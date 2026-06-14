#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const outputMode = args.has("--json") ? "json" : args.has("--report") ? "report" : "human";
const yesEnabled = args.has("--yes");

const delegatedSetupCommand = "npm run augnes:setup-local-demo -- --yes";
const delegatedSetupArgs = ["run", "augnes:setup-local-demo", "--", "--yes"];
const doctorArgs = ["run", "augnes:doctor", "--", "--json"];
const gitStatusShortArgs = ["status", "--short"];
const prepareYesCommand = "npm run augnes:prepare -- --yes";
const setupSummaryStartMarker = "AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_BEGIN";
const setupSummaryEndMarker = "AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_END";

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
  delegated_setup_summary: null,
  setup_steps: [],
  setup_worktree_status_before: null,
  setup_worktree_status_after: null,
  setup_worktree_status: null,
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
  const worktreeStatusBefore = readWorktreeStatus("before");
  const setupRun = runSetup();
  const delegatedSetupSummary = parseDelimitedJsonOutput(
    setupRun.stdout,
    setupSummaryStartMarker,
    setupSummaryEndMarker,
  );
  const worktreeStatusAfter = readWorktreeStatus("after");
  const worktreeStatus = buildSetupWorktreeStatus(worktreeStatusBefore, worktreeStatusAfter);
  result.setup_executed = true;
  result.delegated_setup_summary = delegatedSetupSummary;
  result.setup_steps = Array.isArray(delegatedSetupSummary?.steps) ? delegatedSetupSummary.steps : [];
  result.setup_worktree_status_before = worktreeStatusBefore;
  result.setup_worktree_status_after = worktreeStatusAfter;
  result.setup_worktree_status = worktreeStatus;
  result.setup_status = {
    state: setupRun.status === 0 ? "PASS" : "FAIL",
    delegated_command: delegatedSetupCommand,
    exit_code: setupRun.status,
    summary_parse_status: delegatedSetupSummary ? "PASS" : "WARN",
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
      : "doctor did not find dependency or temp demo DB checks that require local demo setup",
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

function readWorktreeStatus(label) {
  const run = spawnSync("git", gitStatusShortArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (run.status !== 0) {
    return {
      state: "UNKNOWN",
      label,
      exit_code: run.status,
      detail: tail(run.stderr || run.stdout),
      dirty: null,
      lockfile_churn_detected: null,
      changed_files: [],
    };
  }

  const changedFiles = run.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    state: changedFiles.length > 0 ? "WARN" : "PASS",
    label,
    dirty: changedFiles.length > 0,
    lockfile_churn_detected: changedFiles.some(isLockfileStatusLine),
    changed_files: changedFiles,
  };
}

function buildSetupWorktreeStatus(before, after) {
  if (!before || !after) {
    return null;
  }

  if (before.state === "UNKNOWN" || after.state === "UNKNOWN") {
    return {
      state: "UNKNOWN",
      dirty: after.dirty,
      before,
      after,
      new_dirty_entries: [],
      preexisting_dirty_entries: before.changed_files,
      lockfile_churn_detected: null,
      lockfile_changed_after_setup: null,
      lockfile_was_already_dirty_before_setup: before.lockfile_churn_detected,
      lockfile_churn_detail: "lockfile_churn_unknown_git_status_failed",
      attribution_warning: before.dirty
        ? "Worktree was already dirty before setup; review before/after status before attributing changes to setup."
        : "Worktree attribution is unknown because git status failed before or after delegated setup.",
    };
  }

  const beforeEntries = new Set(before.changed_files);
  const newDirtyEntries = after.changed_files.filter((line) => !beforeEntries.has(line));
  const lockfileChangedAfterSetup = newDirtyEntries.some(isLockfileStatusLine);
  const lockfileWasAlreadyDirtyBeforeSetup = before.changed_files.some(isLockfileStatusLine);
  const lockfileChurnDetail = lockfileChangedAfterSetup
    ? "lockfile_changed_after_setup"
    : lockfileWasAlreadyDirtyBeforeSetup
      ? "lockfile_was_already_dirty_before_setup"
      : "no_lockfile_churn_detected";

  return {
    state: after.dirty ? "WARN" : "PASS",
    dirty: after.dirty,
    before,
    after,
    new_dirty_entries: newDirtyEntries,
    preexisting_dirty_entries: before.changed_files,
    lockfile_churn_detected: lockfileChangedAfterSetup,
    lockfile_changed_after_setup: lockfileChangedAfterSetup,
    lockfile_was_already_dirty_before_setup: lockfileWasAlreadyDirtyBeforeSetup,
    lockfile_churn_detail: lockfileChurnDetail,
    attribution_warning: before.dirty
      ? "Worktree was already dirty before setup; review before/after status before attributing changes to setup."
      : null,
  };
}

function isLockfileStatusLine(line) {
  return line.includes("package-lock.json");
}

function buildSetupRecommendation(doctor) {
  const dependencyChecks = [
    ["root_node_modules", "root dependency directory is missing"],
    ["apps_augnes_apps_node_modules", "Augnes Apps dependency directory is missing"],
    ["temp_demo_db", "temp demo DB is missing or not ready"],
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
    addAction(`Run safe finite setup with: ${prepareYesCommand}`);
    addSkippedReason("safe local demo setup skipped: --yes was not provided.");
  }

  if (result.setup_executed && result.setup_status.state === "FAIL") {
    addAction("Review the delegated setup output before retrying prepare.");
  }

  if (result.setup_executed && result.setup_status.summary_parse_status === "WARN") {
    addAction("Review delegated setup output because the structured setup summary could not be parsed.");
  }

  if (result.setup_worktree_status?.attribution_warning) {
    addAction(result.setup_worktree_status.attribution_warning);
  }

  if (result.setup_worktree_status?.new_dirty_entries?.length > 0) {
    addAction("Review new worktree changes after setup before committing.");
  } else if (result.setup_worktree_status?.dirty) {
    addAction("Review worktree status before committing.");
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
  printSetupStepOutcomes();
  console.log("");
  console.log("## What is ready");
  for (const line of buildReadyLines(activeDoctor)) {
    console.log(`- ${line}`);
  }
  console.log("");
  console.log("## What Codex can safely do");
  console.log("- Run doctor diagnosis and parse the JSON result.");
  console.log("- Recommend guarded local demo setup when dependency directories or /tmp/augnes-demo.db readiness are missing.");
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
  if (result.setup_status.summary_parse_status) {
    console.log(`- summary_parse_status: ${result.setup_status.summary_parse_status}`);
  }
  console.log("");
  console.log("## Delegated setup step outcomes");
  for (const line of buildSetupStepOutcomeLines()) {
    console.log(`- ${line}`);
  }
  console.log("");
  console.log("## Setup worktree status");
  for (const line of buildSetupWorktreeLines()) {
    console.log(`- ${line}`);
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

function printSetupStepOutcomes() {
  console.log("## Setup step outcomes");
  for (const line of buildSetupStepOutcomeLines()) {
    console.log(`- ${line}`);
  }
  console.log("");
  console.log("## Setup worktree status");
  for (const line of buildSetupWorktreeLines()) {
    console.log(`- ${line}`);
  }
}

function buildSetupStepOutcomeLines() {
  if (!result.setup_executed) {
    return ["Not run; pass --yes to delegate guarded setup."];
  }
  if (result.setup_steps.length === 0) {
    return ["Structured setup summary unavailable; review delegated setup stdout/stderr tail."];
  }

  return result.setup_steps.map((step) => {
    const status = step.status ?? "UNKNOWN";
    const exitCode = typeof step.exit_code === "number" ? ` (exit ${step.exit_code})` : "";
    const reason = step.reason ? ` - ${step.reason}` : "";
    return `${step.label}: ${status}${exitCode}${reason}`;
  });
}

function buildSetupWorktreeLines() {
  if (!result.setup_executed) {
    return ["Not checked because delegated setup was not run."];
  }
  if (!result.setup_worktree_status) {
    return ["UNKNOWN: worktree status was not collected."];
  }

  const lines = [
    `before: ${formatWorktreeStatusLine(result.setup_worktree_status.before)}`,
    `after: ${formatWorktreeStatusLine(result.setup_worktree_status.after)}`,
    `lockfile: ${formatLockfileChurn(result.setup_worktree_status)}`,
  ];

  if (result.setup_worktree_status.attribution_warning) {
    lines.push(result.setup_worktree_status.attribution_warning);
  }

  if (result.setup_worktree_status.new_dirty_entries.length > 0) {
    lines.push(...result.setup_worktree_status.new_dirty_entries.map((line) => `new after setup: ${line}`));
  } else {
    lines.push("new after setup: none");
  }

  if (result.setup_worktree_status.preexisting_dirty_entries.length > 0) {
    lines.push(
      ...result.setup_worktree_status.preexisting_dirty_entries.map((line) => `pre-existing before setup: ${line}`),
    );
  } else {
    lines.push("pre-existing before setup: none");
  }

  return lines;
}

function formatWorktreeStatusLine(status) {
  if (!status) {
    return "UNKNOWN: not collected";
  }
  if (status.state === "UNKNOWN") {
    return `UNKNOWN: ${status.detail || "git status --short failed"}`;
  }
  if (!status.dirty) {
    return `${status.state}: clean`;
  }
  const entryWord = status.changed_files.length === 1 ? "entry" : "entries";
  return `${status.state}: ${status.changed_files.length} dirty ${entryWord}`;
}

function formatLockfileChurn(status) {
  if (status.lockfile_churn_detected === null) {
    return "lockfile churn unknown because git status failed";
  }
  if (status.lockfile_changed_after_setup) {
    return "lockfile changed after setup";
  }
  if (status.lockfile_was_already_dirty_before_setup) {
    return "lockfile was already dirty before setup";
  }
  return "no lockfile churn detected";
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
    lines.push(`Approve finite setup explicitly: ${prepareYesCommand}`);
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

function parseDelimitedJsonOutput(output, startMarker, endMarker) {
  if (!output) return null;
  const start = output.indexOf(startMarker);
  const end = output.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const jsonText = output.slice(start + startMarker.length, end).trim();
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function tail(value, maxLength = 2000) {
  if (!value) return "";
  return value.length <= maxLength ? value : value.slice(value.length - maxLength);
}
