#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const shouldExecute = args.has("--yes");
const demoDbPath = "/tmp/augnes-demo.db";

const setupSteps = [
  {
    label: "Install root npm dependencies",
    display: "npm install",
    command: "npm",
    args: ["install"],
  },
  {
    label: "Install Augnes Apps MCP bridge dependencies",
    display: "npm --prefix apps/augnes_apps install",
    command: "npm",
    args: ["--prefix", "apps/augnes_apps", "install"],
  },
  {
    label: "Reset temp local demo DB",
    display: `AUGNES_DB_PATH=${demoDbPath} npm run db:reset`,
    command: "env",
    args: [`AUGNES_DB_PATH=${demoDbPath}`, "npm", "run", "db:reset"],
  },
  {
    label: "Migrate temp local demo DB",
    display: `AUGNES_DB_PATH=${demoDbPath} npm run db:migrate`,
    command: "env",
    args: [`AUGNES_DB_PATH=${demoDbPath}`, "npm", "run", "db:migrate"],
  },
  {
    label: "Seed temp local demo DB",
    display: `AUGNES_DB_PATH=${demoDbPath} npm run demo:seed`,
    command: "env",
    args: [`AUGNES_DB_PATH=${demoDbPath}`, "npm", "run", "demo:seed"],
  },
];

const startCommands = [
  {
    label: "local Augnes runtime",
    command: `env -u OPENAI_API_KEY AUGNES_DB_PATH=${demoDbPath} npm run dev -- --port 3000`,
  },
  {
    label: "local Augnes MCP bridge",
    command:
      "AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev",
  },
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
  process.exit(0);
}

console.log("Executing finite local setup commands because --yes was provided.");
console.log("");

for (const step of setupSteps) {
  console.log(`## ${step.label}`);
  console.log(`$ ${step.display}`);
  const result = spawnSync(step.command, step.args, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error(`Setup failed during step: ${step.label}`);
    process.exit(result.status ?? 1);
  }
}

console.log("");
console.log("Local demo setup finished.");
printStartCommands();
printSkippedReasons();

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
  console.log("- local Augnes runtime startup skipped: `npm run dev` is long-running and must be started explicitly.");
  console.log(
    "- local Augnes MCP bridge startup skipped: bridge dev server startup is long-running and must be started explicitly.",
  );
  console.log("- provider setup skipped: basic local demo setup does not require OPENAI_API_KEY.");
}
