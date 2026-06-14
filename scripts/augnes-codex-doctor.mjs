#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { URL } from "node:url";

const args = new Set(process.argv.slice(2));
const outputMode = args.has("--json") ? "json" : args.has("--report") ? "report" : "human";

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md",
  "docs/AUGNES_CODEX_BOOTSTRAP_V0_1.md",
  ".codex/config.toml.example",
  "plugins/augnes-operator/.codex-plugin/plugin.json",
  "plugins/augnes-operator/INSTALL.md",
  "apps/augnes_apps/package.json",
];

const requiredPackageScripts = [
  "augnes:codex-bootstrap",
  "augnes:doctor",
  "augnes:setup-local-demo",
  "smoke:augnes-codex-bootstrap",
  "smoke:augnes-codex-doctor",
];

const startCommands = {
  local_runtime: "env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000",
  mcp_bridge:
    "AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev",
};

const tempDemoDbPath = "/tmp/augnes-demo.db";
const tempDemoDbRequiredTables = [
  "agents",
  "sessions",
  "messages",
  "state_entries",
  "state_transitions",
  "work_items",
];
const tempDemoDbSeededTables = ["agents", "sessions", "messages", "state_entries", "work_items"];

const report = {
  tool: "augnes-codex-doctor",
  mode: "read-only",
  overall_state: "unknown",
  repository_root: null,
  checks: [],
  recommended_next_actions: [],
  skipped_reasons: [],
  boundary: [
    "Doctor mode is read-only by default.",
    "It does not install packages, mutate DB, start servers, read secrets, call providers, call Codex SDK, call GitHub APIs, write ~/.codex/config.toml, create proof/evidence rows, or commit/reject Augnes state.",
  ],
};

const repoRootResult = run("git", ["rev-parse", "--show-toplevel"]);
if (repoRootResult.status !== 0 || repoRootResult.stdout.trim().length === 0) {
  fail("repository_root", "not_git_repository", repoRootResult.stderr.trim() || "git rev-parse failed");
  addAction("Run this command from inside the Augnes repository checkout.");
  finalizeAndPrint();
  process.exit(1);
}

const repoRoot = repoRootResult.stdout.trim();
report.repository_root = repoRoot;
process.chdir(repoRoot);
pass("repository_root", repoRoot);

const gitStatusResult = run("git", ["status", "--short", "--branch"]);
if (gitStatusResult.status === 0) {
  const statusText = gitStatusResult.stdout.trim() || "clean";
  const detail = statusText.includes("\n") ? JSON.stringify(statusText) : statusText;
  const status = statusText === "clean" || /^## [^\n]+$/.test(statusText) ? "PASS" : "WARN";
  addCheck(status, "git_status", statusText === "clean" ? "clean" : detail);
  if (status === "WARN") {
    addAction("Review the dirty git status before committing doctor/setup changes.");
  }
} else {
  warn("git_status", "git_status_unavailable", gitStatusResult.stderr.trim() || "git status failed");
}

pass("node_version", process.version);

const npmVersionResult = run("npm", ["--version"]);
if (npmVersionResult.status === 0) {
  pass("npm_version", npmVersionResult.stdout.trim());
} else {
  fail("npm_version", "npm_missing", npmVersionResult.stderr.trim() || "npm --version failed");
  addAction("Install npm before running Augnes setup commands.");
}

for (const filePath of requiredFiles) {
  if (existsSync(path.join(repoRoot, filePath))) {
    pass(`required_file:${filePath}`, "present");
  } else {
    fail(`required_file:${filePath}`, "missing", `${filePath} is required for Codex local setup`);
  }
}

checkNodeModules("root_node_modules", "node_modules", "npm install");
checkNodeModules(
  "apps_augnes_apps_node_modules",
  "apps/augnes_apps/node_modules",
  "npm --prefix apps/augnes_apps install",
);

checkPackageScripts();
await checkTempDemoDb();
await checkRuntimeStateBrief("http://localhost:3000/api/state/brief?scope=project:augnes");
await checkMcpBridgeReachability("http://localhost:8787/mcp");

if (
  !hasActionContaining("augnes:setup-local-demo") &&
  hasWarn("root_node_modules", "apps_augnes_apps_node_modules", "temp_demo_db")
) {
  addAction("Run `npm run augnes:setup-local-demo -- --yes` to install dependencies if needed and prepare /tmp/augnes-demo.db.");
}

if (hasWarningOrFailure("runtime_state_brief")) {
  addAction(`Start the local Augnes runtime with: ${startCommands.local_runtime}`);
  addSkippedReason("local Augnes runtime startup skipped: doctor mode is read-only and `npm run dev` is long-running.");
}

if (hasWarningOrFailure("mcp_bridge_endpoint")) {
  addAction(`Start the local Augnes MCP bridge with: ${startCommands.mcp_bridge}`);
  addSkippedReason("local Augnes MCP bridge startup skipped: doctor mode is read-only and bridge startup is long-running.");
}

finalizeAndPrint();
process.exit(report.checks.some((check) => check.status === "FAIL") ? 1 : 0);

function checkNodeModules(name, relativePath, installCommand) {
  if (existsSync(path.join(repoRoot, relativePath))) {
    pass(name, `${relativePath} present`);
    return;
  }

  warn(name, "missing", `${relativePath} missing; run ${installCommand}`);
}

function checkPackageScripts() {
  const packagePath = path.join(repoRoot, "package.json");
  if (!existsSync(packagePath)) {
    fail("package_json", "missing", "package.json is required");
    return;
  }

  let packageJson;
  try {
    packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  } catch (error) {
    fail("package_json", "invalid_json", error.message);
    return;
  }

  for (const scriptName of requiredPackageScripts) {
    if (typeof packageJson.scripts?.[scriptName] === "string") {
      pass(`package_script:${scriptName}`, packageJson.scripts[scriptName]);
    } else {
      fail(`package_script:${scriptName}`, "missing", `${scriptName} must be wired in package.json`);
    }
  }
}

async function checkTempDemoDb() {
  let stat;
  try {
    stat = lstatSync(tempDemoDbPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      warn(
        "temp_demo_db",
        "missing_temp_demo_db",
        `${tempDemoDbPath} is missing; guarded setup may be useful`,
      );
      return;
    }
    warn(
      "temp_demo_db",
      "stat_failed",
      `${tempDemoDbPath} exists but could not be inspected: ${error.code || error.message}`,
    );
    return;
  }

  if (stat.isSymbolicLink()) {
    warn(
      "temp_demo_db",
      "symlink_temp_demo_db",
      `${tempDemoDbPath} is a symlink; guarded setup may be useful because doctor does not follow temp demo DB symlinks`,
    );
    return;
  }

  if (!stat.isFile()) {
    warn("temp_demo_db", "not_regular_file", `${tempDemoDbPath} exists but is not a regular file`);
    return;
  }

  let db;
  try {
    const { default: Database } = await import("better-sqlite3");
    db = new Database(tempDemoDbPath, { readonly: true, fileMustExist: true });
    const missingTables = tempDemoDbRequiredTables.filter((tableName) => !hasSqliteTable(db, tableName));
    if (missingTables.length > 0) {
      warn(
        "temp_demo_db",
        "missing_core_tables",
        `${tempDemoDbPath} is readable but missing core table(s): ${missingTables.join(", ")}; guarded setup may be useful`,
      );
      return;
    }

    const seededRows = Object.fromEntries(
      tempDemoDbSeededTables.map((tableName) => [tableName, countRows(db, tableName)]),
    );
    const emptySeedTables = Object.entries(seededRows)
      .filter(([, count]) => count < 1)
      .map(([tableName]) => tableName);
    if (emptySeedTables.length > 0) {
      warn(
        "temp_demo_db",
        "missing_seeded_demo_rows",
        `${tempDemoDbPath} has core tables but no seeded rows in: ${emptySeedTables.join(", ")}; guarded setup may be useful`,
      );
      return;
    }

    pass(
      "temp_demo_db",
      `${tempDemoDbPath} ready; core tables present; seeded rows present in ${formatSeededRows(seededRows)}`,
    );
  } catch (error) {
    warn(
      "temp_demo_db",
      "sqlite_read_failed",
      `${tempDemoDbPath} exists but read-only SQLite inspection failed: ${error.code || error.message}; guarded setup may be useful`,
    );
  } finally {
    db?.close();
  }
}

function hasSqliteTable(db, tableName) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName),
  );
}

function countRows(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function formatSeededRows(seededRows) {
  return Object.entries(seededRows)
    .map(([tableName, count]) => `${tableName}=${count}`)
    .join(", ");
}

async function checkRuntimeStateBrief(target) {
  const result = await requestLocalUrl(target, 800);
  if (!result.reachable) {
    warn("runtime_state_brief", result.reason, `${target} unavailable: ${result.detail}`);
    return;
  }

  if (result.statusCode !== 200) {
    warn(
      "runtime_state_brief",
      "http_status_not_200",
      `${target} returned HTTP ${result.statusCode}; strict runtime readiness requires HTTP 200`,
    );
    return;
  }

  let payload;
  try {
    payload = JSON.parse(result.body);
  } catch (error) {
    warn("runtime_state_brief", "invalid_json", `${target} returned HTTP 200 but JSON parse failed: ${error.message}`);
    return;
  }

  if (!isAugnesStateBrief(payload)) {
    warn(
      "runtime_state_brief",
      "unexpected_state_brief_shape",
      `${target} returned HTTP 200 but did not include runtime=augnes and scope=project:augnes`,
    );
    return;
  }

  pass("runtime_state_brief", `${target} returned HTTP 200 Augnes state brief for project:augnes`);
}

async function checkMcpBridgeReachability(target) {
  const result = await requestLocalUrl(target, 800);
  if (result.reachable && result.statusCode >= 200 && result.statusCode < 500) {
    pass(
      "mcp_bridge_endpoint",
      `${target} reachable with HTTP ${result.statusCode}; endpoint reachability only, MCP tool calls not tested`,
    );
    return;
  }

  const detail = result.reachable ? `HTTP ${result.statusCode}` : result.detail;
  warn(
    "mcp_bridge_endpoint",
    result.reason,
    `${target} unavailable for endpoint reachability check: ${detail}; MCP tool calls not tested`,
  );
}

function requestLocalUrl(target, timeoutMs) {
  return new Promise((resolve) => {
    const url = new URL(target);
    let settled = false;
    const request = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        timeout: timeoutMs,
      },
      (response) => {
        let body = "";
        let truncated = false;
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          if (body.length >= 65536) {
            truncated = true;
            return;
          }
          body += chunk;
          if (body.length > 65536) {
            body = body.slice(0, 65536);
            truncated = true;
          }
        });
        response.on("end", () => {
          if (settled) return;
          settled = true;
          resolve({
            reachable: true,
            statusCode: response.statusCode,
            body,
            truncated,
            reason: response.statusCode >= 500 ? "http_status_5xx" : "http_status",
            detail: `HTTP ${response.statusCode}`,
          });
        });
      },
    );

    request.on("timeout", () => {
      if (settled) return;
      settled = true;
      request.destroy();
      resolve({ reachable: false, reason: "timeout", detail: `${timeoutMs}ms timeout`, body: "" });
    });

    request.on("error", (error) => {
      if (settled) return;
      settled = true;
      resolve({ reachable: false, reason: "unreachable", detail: error.code || error.message, body: "" });
    });

    request.end();
  });
}

function isAugnesStateBrief(payload) {
  return (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    payload.runtime === "augnes" &&
    payload.scope === "project:augnes"
  );
}

function finalizeAndPrint() {
  const failed = report.checks.filter((check) => check.status === "FAIL").length;
  const warned = report.checks.filter((check) => check.status === "WARN").length;
  report.overall_state = failed > 0 ? "FAIL" : warned > 0 ? "ACTION_REQUIRED" : "PASS";

  if (report.recommended_next_actions.length === 0) {
    report.recommended_next_actions.push("No setup action required by doctor checks.");
  }

  if (report.skipped_reasons.length === 0) {
    report.skipped_reasons.push("No long-running startup action was attempted; doctor mode remains read-only.");
  }

  if (outputMode === "json") {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (outputMode === "report") {
    printMarkdownReport();
    return;
  }

  printHumanReport();
}

function printHumanReport() {
  console.log("# Augnes Codex Doctor v0.1");
  console.log("");
  console.log("Read-only diagnosis for the local Augnes checkout.");
  console.log("");
  console.log(`overall_state: ${report.overall_state}`);
  console.log(`repository_root: ${report.repository_root ?? "unavailable"}`);
  console.log("");
  console.log("## Checks");
  for (const check of report.checks) {
    console.log(`- ${check.status}: ${check.name} - ${check.detail}`);
  }
  console.log("");
  console.log("## Recommended Next Actions");
  for (const action of report.recommended_next_actions) {
    console.log(`- ${action}`);
  }
  console.log("");
  console.log("## Skipped Reasons");
  for (const reason of report.skipped_reasons) {
    console.log(`- ${reason}`);
  }
  console.log("");
  console.log("## Boundary");
  for (const boundary of report.boundary) {
    console.log(`- ${boundary}`);
  }
}

function printMarkdownReport() {
  console.log("## Augnes Codex Doctor Report");
  console.log("");
  console.log(`- Overall state: ${report.overall_state}`);
  console.log(`- Repository root: ${report.repository_root ?? "unavailable"}`);
  console.log("- Mode: read-only");
  console.log("");
  console.log("### Checks");
  for (const check of report.checks) {
    console.log(`- ${check.status}: ${check.name} - ${check.detail}`);
  }
  console.log("");
  console.log("### Recommended next actions");
  for (const action of report.recommended_next_actions) {
    console.log(`- ${action}`);
  }
  console.log("");
  console.log("### Skipped checks");
  for (const reason of report.skipped_reasons) {
    console.log(`- ${reason}`);
  }
  console.log("");
  console.log("### Boundary");
  for (const boundary of report.boundary) {
    console.log(`- ${boundary}`);
  }
}

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function pass(name, detail) {
  addCheck("PASS", name, detail);
}

function warn(name, reason, detail) {
  addCheck("WARN", name, `${reason}: ${detail}`);
}

function fail(name, reason, detail) {
  addCheck("FAIL", name, `${reason}: ${detail}`);
}

function addCheck(status, name, detail) {
  report.checks.push({ status, name, detail });
}

function addAction(action) {
  if (!report.recommended_next_actions.includes(action)) {
    report.recommended_next_actions.push(action);
  }
}

function addSkippedReason(reason) {
  if (!report.skipped_reasons.includes(reason)) {
    report.skipped_reasons.push(reason);
  }
}

function hasWarn(...names) {
  return report.checks.some((check) => names.includes(check.name) && check.status === "WARN");
}

function hasWarningOrFailure(name) {
  return report.checks.some((check) => check.name === name && check.status !== "PASS");
}

function hasActionContaining(fragment) {
  return report.recommended_next_actions.some((action) => action.includes(fragment));
}
