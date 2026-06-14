#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const outputMode = args.has("--json") ? "json" : args.has("--report") ? "report" : "human";
const yesEnabled = args.has("--yes");

const delegatedSetupCommand = "npm run augnes:setup-local-demo -- --yes";
const delegatedSetupArgs = ["run", "augnes:setup-local-demo", "--", "--yes"];
const doctorArgs = ["run", "augnes:doctor", "--", "--json"];

const startCommands = {
  local_runtime: "env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000",
  mcp_bridge:
    "AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev",
};

const result = {
  tool: "augnes-codex-prepare",
  mode: outputMode,
  yes_enabled: yesEnabled,
  before_doctor: null,
  setup_recommended: {
    recommended: false,
    reasons: [],
  },
  setup_executed: false,
  setup_status: {
    state: "not_started",
    delegated_command: delegatedSetupCommand,
  },
  after_doctor: null,
  recommended_next_actions: [],
  skipped_reasons: [],
  boundary: [
    "Prepare is a guided wrapper around doctor and the guarded local demo setup script.",
    "Prepare never runs package install, DB setup, or long-running server commands directly.",
    "Prepare does not start dev servers, start the MCP bridge, call MCP tools, read secrets, call providers, call Codex SDK, call GitHub APIs, write ~/.codex/config.toml, create proof/evidence rows, create perspective-memory items, create product persistence boundary records, or commit/reject Augnes state.",
  ],
};

const beforeDoctorRun = runDoctorJson("before");
result.before_doctor = beforeDoctorRun.doctor;
result.setup_recommended = buildSetupRecommendation(result.before_doctor);

if (yesEnabled) {
  const setupRun = runSetup();
  result.setup_executed = true;
  result.setup_status = {
    state: setupRun.status === 0 ? "PASS" : "FAIL",
    delegated_command: delegatedSetupCommand,
    exit_code: setupRun.status,
    stdout_tail: tail(setupRun.stdout),
    stderr_tail: tail(setupRun.stderr),
  };
  const afterDoctorRun = runDoctorJson("after");
  result.after_doctor = afterDoctorRun.doctor;
} else {
  result.setup_status = {
    state: result.setup_recommended.recommended ? "SKIPPED_NEEDS_YES" : "SKIPPED_NOT_RECOMMENDED",
    delegated_command: delegatedSetupCommand,
    reason: result.setup_recommended.recommended
      ? "safe local demo setup appears useful, but --yes was not provided"
      : "doctor did not find missing dependency directories that require local demo setup",
  };
}

finalizeResult();
printResult();
process.exit(prepareExitCode(result));

function runDoctorJson(label) {
  const run = spawnSync("npm", doctorArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const doctor = parseJsonOutput(run.stdout) ?? {
    tool: "augnes-codex-doctor",
    mode: "read-only",
    overall_state: "FAIL",
    checks: [
      {
        status: "FAIL",
        name: `${label}_doctor_json`,
        detail: `could not parse doctor JSON; exit_code=${run.status}; stderr=${tail(run.stderr)}`,
      },
    ],
    recommended_next_actions: ["Run `npm run augnes:doctor -- --json` and inspect the output."],
    skipped_reasons: ["prepare could not parse doctor JSON, so setup was not inferred from doctor checks."],
    boundary: [],
  };

  doctor.doctor_exit_code = run.status;
  return { doctor, run };
}

function runSetup() {
  return spawnSync("npm", delegatedSetupArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function buildSetupRecommendation(doctor) {
  const dependencyChecks = [
    ["root_node_modules", "root dependency directory is missing"],
    ["apps_augnes_apps_node_modules", "Augnes Apps dependency directory is missing"],
  ];
  const reasons = [];

  for (const [checkName, reason] of dependencyChecks) {
    const check = findCheck(doctor, checkName);
    if (check && check.status !== "PASS") {
      reasons.push(`${reason}: ${check.detail}`);
    }
  }

  return {
    recommended: reasons.length > 0,
    reasons,
  };
}

function finalizeResult() {
  const activeDoctor = result.after_doctor ?? result.before_doctor;

  if (result.setup_recommended.recommended && !result.setup_executed) {
    addAction(`Run safe finite setup with: ${delegatedSetupCommand}`);
    addSkippedReason("safe local demo setup skipped: --yes was not provided.");
  }

  if (result.setup_executed && result.setup_status.state === "FAIL") {
    addAction("Review the delegated setup output before retrying prepare.");
  }

  for (const action of activeDoctor?.recommended_next_actions ?? []) {
    addAction(action);
  }

  addStartActionsForDoctor(activeDoctor);

  for (const reason of activeDoctor?.skipped_reasons ?? []) {
    addSkippedReason(reason);
  }

  addSkippedReason("long-running local Augnes runtime startup skipped: prepare never starts `npm run dev`.");
  addSkippedReason("long-running local Augnes MCP bridge startup skipped: prepare never starts the bridge dev server.");
  addSkippedReason("MCP tool calls skipped: prepare uses doctor output only and does not call MCP tools.");
  addSkippedReason("provider/model checks skipped: basic local setup does not require OPENAI_API_KEY.");

  if (result.recommended_next_actions.length === 0) {
    addAction("No setup action required by prepare checks.");
  }
}

function prepareExitCode(prepareResult) {
  if (prepareResult.setup_status.state === "FAIL") return 1;
  if (prepareResult.before_doctor?.overall_state === "FAIL") return 1;
  if (prepareResult.after_doctor?.overall_state === "FAIL") return 1;
  return 0;
}

function addStartActionsForDoctor(doctor) {
  if (hasNonPassCheck(doctor, "runtime_state_brief")) {
    addAction(`Start the local Augnes runtime with: ${startCommands.local_runtime}`);
  }
  if (hasNonPassCheck(doctor, "mcp_bridge_endpoint")) {
    addAction(`Start the local Augnes MCP bridge with: ${startCommands.mcp_bridge}`);
  }
}

function printResult() {
  if (outputMode === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (outputMode === "report") {
    printReport();
    return;
  }

  printHuman();
}

function printHuman() {
  const activeDoctor = result.after_doctor ?? result.before_doctor;
  console.log("# Augnes prepare status");
  console.log("");
  console.log(`doctor_status: ${result.before_doctor?.overall_state ?? "unknown"}`);
  console.log(`setup_recommended: ${result.setup_recommended.recommended ? "yes" : "no"}`);
  console.log(`setup_executed: ${result.setup_executed ? "yes" : "no"}`);
  if (result.after_doctor) {
    console.log(`after_doctor_status: ${result.after_doctor.overall_state}`);
  }
  console.log("");
  console.log("## What is ready");
  for (const line of buildReadyLines(activeDoctor)) {
    console.log(`- ${line}`);
  }
  console.log("");
  console.log("## What Codex can safely do");
  console.log("- Run doctor diagnosis and parse the JSON result.");
  console.log("- Recommend guarded local demo setup when dependency directories are missing.");
  console.log(`- Delegate finite setup only through \`${delegatedSetupCommand}\` when --yes is provided.`);
  console.log("- Produce human, JSON, or report output without starting long-running servers.");
  console.log("");
  console.log("## What still needs a visible terminal action");
  for (const line of buildVisibleTerminalLines(activeDoctor)) {
    console.log(`- ${line}`);
  }
  console.log("");
  console.log("## Next commands");
  for (const action of result.recommended_next_actions) {
    console.log(`- ${action}`);
  }
  console.log("");
  console.log("## Skipped reasons");
  for (const reason of result.skipped_reasons) {
    console.log(`- ${reason}`);
  }
  console.log("");
  console.log("## Boundary");
  for (const boundary of result.boundary) {
    console.log(`- ${boundary}`);
  }
}

function printReport() {
  console.log("## Summary");
  console.log("Guided Augnes prepare wrapper completed.");
  console.log("");
  console.log("## Prepare result");
  console.log(`- Mode: ${outputMode}`);
  console.log(`- yes_enabled: ${yesEnabled}`);
  console.log(`- setup_executed: ${result.setup_executed}`);
  console.log(`- setup_status: ${result.setup_status.state}`);
  console.log("");
  console.log("## Before doctor status");
  console.log(`- ${result.before_doctor?.overall_state ?? "unknown"}`);
  console.log("");
  console.log("## Setup recommendation");
  console.log(`- recommended: ${result.setup_recommended.recommended}`);
  for (const reason of result.setup_recommended.reasons) {
    console.log(`- reason: ${reason}`);
  }
  console.log("");
  console.log("## Setup execution status");
  console.log(`- ${result.setup_status.state}`);
  console.log(`- delegated command: ${delegatedSetupCommand}`);
  if (typeof result.setup_status.exit_code === "number") {
    console.log(`- exit_code: ${result.setup_status.exit_code}`);
  }
  console.log("");
  if (result.after_doctor) {
    console.log("## After doctor status");
    console.log(`- ${result.after_doctor.overall_state}`);
    console.log("");
  }
  console.log("## Recommended next actions");
  for (const action of result.recommended_next_actions) {
    console.log(`- ${action}`);
  }
  console.log("");
  console.log("## Skipped checks");
  for (const reason of result.skipped_reasons) {
    console.log(`- ${reason}`);
  }
  console.log("");
  console.log("## Boundary");
  for (const boundary of result.boundary) {
    console.log(`- ${boundary}`);
  }
}

function buildReadyLines(doctor) {
  const readyNames = [
    "repository_root",
    "node_version",
    "npm_version",
    "root_node_modules",
    "apps_augnes_apps_node_modules",
  ];
  const lines = [];
  for (const name of readyNames) {
    const check = findCheck(doctor, name);
    if (check?.status === "PASS") {
      lines.push(`${name}: ${check.detail}`);
    }
  }
  if (lines.length === 0) {
    lines.push("No ready checks could be confirmed from doctor output.");
  }
  return lines;
}

function buildVisibleTerminalLines(doctor) {
  const lines = [];
  if (hasNonPassCheck(doctor, "runtime_state_brief")) {
    lines.push(`Start local Augnes runtime: ${startCommands.local_runtime}`);
  }
  if (hasNonPassCheck(doctor, "mcp_bridge_endpoint")) {
    lines.push(`Start local Augnes MCP bridge: ${startCommands.mcp_bridge}`);
  }
  if (result.setup_recommended.recommended && !result.setup_executed) {
    lines.push(`Approve finite setup explicitly: ${delegatedSetupCommand}`);
  }
  if (lines.length === 0) {
    lines.push("No visible terminal action is required by current prepare output.");
  }
  return lines;
}

function findCheck(doctor, name) {
  return doctor?.checks?.find((check) => check.name === name);
}

function hasNonPassCheck(doctor, name) {
  const check = findCheck(doctor, name);
  return Boolean(check && check.status !== "PASS");
}

function addAction(action) {
  if (!result.recommended_next_actions.includes(action)) {
    result.recommended_next_actions.push(action);
  }
}

function addSkippedReason(reason) {
  if (!result.skipped_reasons.includes(reason)) {
    result.skipped_reasons.push(reason);
  }
}

function parseJsonOutput(output) {
  const firstBrace = output.indexOf("{");
  const lastBrace = output.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  try {
    return JSON.parse(output.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

function tail(value, maxLength = 2000) {
  if (!value) return "";
  return value.length <= maxLength ? value : value.slice(value.length - maxLength);
}
