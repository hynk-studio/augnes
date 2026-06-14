#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const shouldExecute = args.has("--yes");
const demoDbPath = "/tmp/augnes-demo.db";
const summaryStartMarker = "AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_BEGIN";
const summaryEndMarker = "AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_END";

const setupSteps = [
  {
    id: "root_dependencies",
    label: "root dependencies",
    display: "npm install",
    command: "npm",
    args: ["install"],
  },
  {
    id: "apps_dependencies",
    label: "Augnes Apps dependencies",
    display: "npm --prefix apps/augnes_apps install",
    command: "npm",
    args: ["--prefix", "apps/augnes_apps", "install"],
  },
  {
    id: "temp_demo_db_reset",
    label: "temp demo DB reset",
    display: `AUGNES_DB_PATH=${demoDbPath} npm run db:reset`,
    command: "env",
    args: [`AUGNES_DB_PATH=${demoDbPath}`, "npm", "run", "db:reset"],
  },
  {
    id: "temp_demo_db_migrate",
    label: "temp demo DB migration",
    display: `AUGNES_DB_PATH=${demoDbPath} npm run db:migrate`,
    command: "env",
    args: [`AUGNES_DB_PATH=${demoDbPath}`, "npm", "run", "db:migrate"],
  },
  {
    id: "temp_demo_db_seed",
    label: "temp demo DB seed",
    display: `AUGNES_DB_PATH=${demoDbPath} npm run demo:seed`,
    command: "env",
    args: [`AUGNES_DB_PATH=${demoDbPath}`, "npm", "run", "demo:seed"],
  },
];

const startCommands = [
  {
    id: "local_runtime",
    label: "local Augnes runtime",
    command: `env -u OPENAI_API_KEY AUGNES_DB_PATH=${demoDbPath} npm run dev -- --port 3000`,
  },
  {
    id: "mcp_bridge",
    label: "local Augnes MCP bridge",
    command:
      "AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev",
  },
];

const skippedReasons = [
  "local Augnes runtime startup skipped: `npm run dev` is long-running and must be started explicitly.",
  "local Augnes MCP bridge startup skipped: bridge dev server startup is long-running and must be started explicitly.",
  "provider setup skipped: basic local demo setup does not require OPENAI_API_KEY.",
];

const boundary = [
  "Local demo setup runs only the guarded finite setup commands when --yes is provided.",
  "Local demo setup does not start dev servers, start the MCP bridge, call MCP tools, read secrets, call providers, call Codex SDK, call GitHub APIs, write ~/.codex/config.toml, inspect default/user DB paths, create proof/evidence rows, create perspective-memory items, create product boundary records, or commit/reject Augnes state.",
];

const repoRootResult = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (repoRootResult.status !== 0 || repoRootResult.stdout.trim().length === 0) {
  console.error("Augnes local demo setup must be run from inside the Augnes git repository.");
  console.error(repoRootResult.stderr.trim() || "git rev-parse failed");
  process.exit(1);
}

const repoRoot = repoRootResult.stdout.trim();
process.chdir(repoRoot);

const summary = buildInitialSummary(repoRoot);

console.log("# Augnes Local Demo Setup");
console.log("");
console.log(`repository_root: ${repoRoot}`);
console.log(`demo_db_path: ${demoDbPath}`);
console.log("");

if (!shouldExecute) {
  console.log("DRY RUN: pass --yes to execute the finite local setup commands.");
  console.log("");
  printSetupCommands();
  printStartCommands();
  printSkippedReasons();
  printSummary(summary);
  process.exit(0);
}

console.log("Executing finite local setup commands because --yes was provided.");
console.log("");

for (const step of setupSteps) {
  console.log(`## ${step.label}`);
  console.log(`$ ${step.display}`);
  const summaryStep = summary.steps.find((entry) => entry.id === step.id);
  summaryStep.attempted = true;
  summaryStep.completed = false;
  delete summaryStep.reason;
  const result = spawnSync(step.command, step.args, {
    cwd: repoRoot,
    stdio: "inherit",
  });
  summaryStep.exit_code = result.status;

  if (result.status !== 0) {
    summaryStep.status = "FAIL";
    summaryStep.reason = "command_failed";
    console.error(`Setup failed during step: ${step.label}`);
    printSummary(summary);
    process.exit(result.status ?? 1);
  }

  summaryStep.status = "PASS";
  summaryStep.completed = true;
}

console.log("");
console.log("Local demo setup finished.");
printStartCommands();
printSkippedReasons();
printSummary(summary);

function buildInitialSummary(repositoryRoot) {
  return {
    tool: "augnes-codex-local-demo-setup",
    mode: shouldExecute ? "execute" : "dry-run",
    repository_root: repositoryRoot,
    demo_db_path: demoDbPath,
    steps: setupSteps.map((step) => ({
      id: step.id,
      label: step.label,
      display_command: step.display,
      attempted: false,
      completed: false,
      status: "SKIPPED",
      reason: shouldExecute ? "not_reached" : "dry_run_requires_yes",
    })),
    start_commands: startCommands.map((entry) => ({
      id: entry.id,
      label: entry.label,
      command: entry.command,
    })),
    skipped_reasons: skippedReasons,
    boundary,
  };
}

function printSetupCommands() {
  console.log("## Commands that would run");
  console.log("```bash");
  for (const step of setupSteps) {
    console.log(step.display);
  }
  console.log("```");
  console.log("");
}

function printStartCommands() {
  console.log("## Start commands to run after setup");
  for (const entry of startCommands) {
    console.log("");
    console.log(`### ${entry.label}`);
    console.log("```bash");
    console.log(entry.command);
    console.log("```");
  }
  console.log("");
}

function printSkippedReasons() {
  console.log("## Skipped reasons");
  for (const reason of skippedReasons) {
    console.log(`- ${reason}`);
  }
}

function printSummary(value) {
  console.log("");
  console.log(summaryStartMarker);
  console.log(JSON.stringify(value, null, 2));
  console.log(summaryEndMarker);
}
