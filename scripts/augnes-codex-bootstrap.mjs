#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md",
  "plugins/augnes-operator/.codex-plugin/plugin.json",
  "apps/augnes_apps/package.json",
];

const localSetupCommands = [
  "npm install",
  "npm run db:reset",
  "npm run db:migrate",
  "npm run demo:seed",
  "env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000",
];

const mcpBridgeSetupCommands = [
  "npm --prefix apps/augnes_apps install",
  "AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev",
];

const configExamplePath = ".codex/config.toml.example";
const configExampleText = `# Project-local example for connecting Codex to the local Augnes MCP bridge.
# This file is inert documentation. It is not loaded automatically.
# Review and copy the relevant shape into your user-level Codex config only if
# your local Codex build supports this MCP server syntax.
#
# Do not put secrets in this file.
# This repository script never writes ~/.codex/config.toml.
# Enabling this bridge does not grant commit, reject, merge, approve, publish,
# retry, replay, auto-merge, provider, GitHub, DB write, or Augnes state authority.
#
# Recommended local Augnes app:
# env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
#
# Recommended local Augnes MCP bridge:
# npm --prefix apps/augnes_apps install
# AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
#
# URL-based MCP bridge example:
[mcp_servers.augnes_local_bridge]
url = "http://localhost:8787/mcp"
`;

const checks = [];
let exitCode = 0;

const repoRootResult = run("git", ["rev-parse", "--show-toplevel"]);
if (repoRootResult.status !== 0 || repoRootResult.stdout.trim().length === 0) {
  fail("repository_root", "not_git_repository", repoRootResult.stderr.trim() || "git rev-parse failed");
  printReport({ repoRoot: null, npmVersion: null, gitStatus: null, configStatus: "not_checked" });
  process.exit(exitCode);
}

const repoRoot = repoRootResult.stdout.trim();
process.chdir(repoRoot);

const npmVersionResult = run("npm", ["--version"]);
if (npmVersionResult.status === 0) {
  pass("npm_available", npmVersionResult.stdout.trim());
} else {
  fail("npm_available", "npm_missing", npmVersionResult.stderr.trim() || "npm --version failed");
}

pass("node_available", process.version);
pass("repository_root", repoRoot);

const gitStatusResult = run("git", ["status", "--short", "--branch"]);
const gitStatus =
  gitStatusResult.status === 0 ? gitStatusResult.stdout.trim() || "clean" : gitStatusResult.stderr.trim();
if (gitStatusResult.status === 0) {
  pass("git_status_checked", gitStatus);
} else {
  warn("git_status_checked", "git_status_unavailable", gitStatus || "git status failed");
}

for (const filePath of requiredFiles) {
  if (existsSync(path.join(repoRoot, filePath))) {
    pass(`required_file:${filePath}`, "present");
  } else {
    fail(`required_file:${filePath}`, "missing", `${filePath} is required for Codex bootstrap context`);
  }
}

const configStatus = ensureConfigExample(repoRoot);
printReport({
  repoRoot,
  npmVersion: npmVersionResult.status === 0 ? npmVersionResult.stdout.trim() : null,
  gitStatus,
  configStatus,
});

process.exit(exitCode);

function ensureConfigExample(root) {
  const fullPath = path.join(root, configExamplePath);
  const parent = path.dirname(fullPath);

  if (!existsSync(fullPath)) {
    mkdirSync(parent, { recursive: true });
    writeFileSync(fullPath, configExampleText, "utf8");
    pass("codex_config_example", `generated ${configExamplePath}`);
    return "generated";
  }

  const existing = readFileSync(fullPath, "utf8");
  if (existing === configExampleText) {
    pass("codex_config_example", `validated ${configExamplePath}`);
    return "validated";
  }

  fail(
    "codex_config_example",
    "content_mismatch",
    `${configExamplePath} exists but does not match the repo-local bootstrap template`,
  );
  return "content_mismatch";
}

function printReport({ repoRoot, npmVersion, gitStatus, configStatus }) {
  console.log("# Augnes Codex Bootstrap v0.1");
  console.log("");
  console.log("This command checks local prerequisites and prints setup commands only.");
  console.log("It does not install packages, migrate databases, read secrets, call providers, call GitHub, or write user-level Codex config.");
  console.log("");
  console.log("## Environment");
  console.log(`- repository_root: ${repoRoot ?? "unavailable"}`);
  console.log(`- node_version: ${process.version}`);
  console.log(`- npm_version: ${npmVersion ?? "unavailable"}`);
  console.log(`- git_status: ${formatMultiline(gitStatus ?? "unavailable")}`);
  console.log(`- config_example_status: ${configStatus}`);
  console.log("");
  console.log("## Checks");
  for (const check of checks) {
    const suffix = check.detail ? ` - ${formatMultiline(check.detail)}` : "";
    console.log(`- ${check.status}: ${check.name}${suffix}`);
  }
  console.log("");
  console.log("## Recommended Local Setup Commands");
  printCommands(localSetupCommands);
  console.log("");
  console.log("## Recommended MCP Bridge Setup Commands");
  printCommands(mcpBridgeSetupCommands);
  console.log("");
  console.log("## Boundary");
  console.log("- This bootstrap output is advisory and repo-local.");
  console.log("- Candidate acceptance, memory persistence, proof/evidence writes, DB writes, schema changes, provider calls, Codex SDK execution, GitHub mutation, merge, approval, publication, retry, replay, and auto-merge are out of scope.");
}

function printCommands(commands) {
  console.log("```bash");
  for (const command of commands) {
    console.log(command);
  }
  console.log("```");
}

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function pass(name, detail) {
  checks.push({ status: "PASS", name, detail });
}

function warn(name, reason, detail) {
  checks.push({ status: "WARN", name, detail: `${reason}: ${detail}` });
}

function fail(name, reason, detail) {
  exitCode = 1;
  checks.push({ status: "FAIL", name, detail: `${reason}: ${detail}` });
}

function formatMultiline(value) {
  return value.includes("\n") ? JSON.stringify(value) : value;
}
