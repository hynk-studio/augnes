import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = {
  doctor: "scripts/augnes-codex-doctor.mjs",
  setup: "scripts/augnes-codex-local-demo-setup.mjs",
  smoke: "scripts/smoke-augnes-codex-doctor.mjs",
  doc: "docs/AUGNES_CODEX_DOCTOR_V0_1.md",
  report: "reports/2026-06-14-augnes-codex-doctor.md",
  packageJson: "package.json",
};

for (const [name, filePath] of Object.entries(files)) {
  assert.ok(existsSync(filePath), `${name} file must exist at ${filePath}`);
}

const packageJson = JSON.parse(readFileSync(files.packageJson, "utf8"));
assert.equal(packageJson.scripts["augnes:doctor"], "node scripts/augnes-codex-doctor.mjs");
assert.equal(packageJson.scripts["augnes:setup-local-demo"], "node scripts/augnes-codex-local-demo-setup.mjs");
assert.equal(packageJson.scripts["smoke:augnes-codex-doctor"], "node scripts/smoke-augnes-codex-doctor.mjs");

const doctorSource = readFileSync(files.doctor, "utf8");
const setupSource = readFileSync(files.setup, "utf8");
const combinedScriptSource = `${doctorSource}\n${setupSource}`;
const docText = readFileSync(files.doc, "utf8");
const reportText = readFileSync(files.report, "utf8");

assertDoctorSource(doctorSource);
assertSetupSource(setupSource);
assertNoForbiddenScriptBehavior(combinedScriptSource);
assertDoctorJson();
assertDoctorReport();
assertSetupDryRun();
assertDocs(docText);
assertReport(reportText);

console.log(
  JSON.stringify(
    {
      smoke: "augnes-codex-doctor",
      package_scripts_valid: true,
      doctor_json_supported: true,
      doctor_report_supported: true,
      setup_requires_yes: true,
      setup_finite_commands_only: true,
      boundary_preserved: true,
    },
    null,
    2,
  ),
);

function assertDoctorSource(source) {
  for (const expected of [
    "README.md",
    "AGENTS.md",
    "docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md",
    "docs/AUGNES_CODEX_BOOTSTRAP_V0_1.md",
    ".codex/config.toml.example",
    "plugins/augnes-operator/.codex-plugin/plugin.json",
    "plugins/augnes-operator/INSTALL.md",
    "apps/augnes_apps/package.json",
    "augnes:codex-bootstrap",
    "augnes:doctor",
    "augnes:setup-local-demo",
    "smoke:augnes-codex-bootstrap",
    "smoke:augnes-codex-doctor",
    "temp_demo_db",
    'const tempDemoDbPath = "/tmp/augnes-demo.db"',
    "missing_temp_demo_db",
    "lstatSync",
    "isSymbolicLink()",
    "symlink_temp_demo_db",
    "readonly: true",
    "fileMustExist: true",
    "missing_core_tables",
    "missing_seeded_demo_rows",
    "guarded setup may be useful",
    "--json",
    "--report",
    "http://localhost:3000/api/state/brief?scope=project:augnes",
    "http://localhost:8787/mcp",
    "checkRuntimeStateBrief",
    "result.statusCode !== 200",
    "strict runtime readiness requires HTTP 200",
    "isAugnesStateBrief",
    "runtime=augnes and scope=project:augnes",
    "checkMcpBridgeReachability",
    "endpoint reachability only, MCP tool calls not tested",
  ]) {
    assert.ok(source.includes(expected), `doctor source should include ${expected}`);
  }

  assert.match(
    source,
    /async function checkRuntimeStateBrief[\s\S]+result\.statusCode !== 200[\s\S]+isAugnesStateBrief/,
    "runtime_state_brief should require HTTP 200 and Augnes state brief shape",
  );
  assert.match(
    source,
    /async function checkMcpBridgeReachability[\s\S]+statusCode >= 200[\s\S]+statusCode < 500[\s\S]+MCP tool calls not tested/,
    "MCP bridge check should remain reachability-only and explicitly skip tool calls",
  );
  assert.match(
    source,
    /function checkTempDemoDb\(\)[\s\S]+lstatSync\(tempDemoDbPath\)[\s\S]+isSymbolicLink\(\)[\s\S]+symlink_temp_demo_db[\s\S]+new Database\(tempDemoDbPath, \{ readonly: true, fileMustExist: true \}\)[\s\S]+missing_seeded_demo_rows/,
    "temp_demo_db should reject symlinks before read-only SQLite inspection and warn when readiness cannot be proven",
  );
  assert.ok(
    source.indexOf("symlink_temp_demo_db") < source.indexOf("new Database(tempDemoDbPath"),
    "temp_demo_db symlink rejection must happen before SQLite open",
  );
  assert.doesNotMatch(
    source,
    /process\.env\.AUGNES_DB_PATH|data["'],\s*["']augnes\.db|DEFAULT_DB_PATH/,
    "doctor source must not inspect default/user DB paths",
  );
  for (const forbiddenDbWrite of [
    /db\.exec\(/,
    /\.run\(/,
    /\brmSync\b/,
    /\bmkdirSync\b/,
    /\bchmod/,
    /\bdb:reset\b/,
    /\bdb:migrate\b/,
    /\bdemo:seed\b/,
  ]) {
    assert.doesNotMatch(source, forbiddenDbWrite, `doctor source must not write DB or setup data: ${forbiddenDbWrite}`);
  }
}

function assertSetupSource(source) {
  for (const expected of [
    'args.has("--yes")',
    "DRY RUN: pass --yes",
    "npm install",
    "npm --prefix apps/augnes_apps install",
    "AUGNES_DB_PATH=${demoDbPath} npm run db:reset",
    "AUGNES_DB_PATH=${demoDbPath} npm run db:migrate",
    "AUGNES_DB_PATH=${demoDbPath} npm run demo:seed",
    "env -u OPENAI_API_KEY AUGNES_DB_PATH=${demoDbPath} npm run dev -- --port 3000",
    "AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev",
  ]) {
    assert.ok(source.includes(expected), `setup source should include ${expected}`);
  }

  const activeArgArrays = Array.from(source.matchAll(/args:\s*\[([^\]]*)\]/g)).map((match) => match[1]);
  assert.deepEqual(activeArgArrays, [
    '"install"',
    '"--prefix", "apps/augnes_apps", "install"',
    "`AUGNES_DB_PATH=${demoDbPath}`, \"npm\", \"run\", \"db:reset\"",
    "`AUGNES_DB_PATH=${demoDbPath}`, \"npm\", \"run\", \"db:migrate\"",
    "`AUGNES_DB_PATH=${demoDbPath}`, \"npm\", \"run\", \"demo:seed\"",
  ]);

  for (const activeArgs of activeArgArrays) {
    assert.doesNotMatch(activeArgs, /\bdev\b/, "setup active commands must not include dev server startup");
    assert.doesNotMatch(activeArgs, /\binspect\b/, "setup active commands must not include MCP inspector startup");
  }
}

function assertNoForbiddenScriptBehavior(source) {
  for (const pattern of [
    /\bprocess\.env\.OPENAI_API_KEY\b/,
    /\bprocess\.env\.GITHUB_TOKEN\b/,
    /readFileSync\([^)]*\.env/,
    /writeFileSync\([^)]*~\/\.codex\/config\.toml/,
    /\bapi\.openai\.com\b/,
    /\bapi\.github\.com\b/,
    /\bCodexSDK\b/,
    /\bfrom\s+["']@openai\/codex/i,
    /\bfrom\s+["']openai["']/i,
    /\bgh\s+(api|pr|issue|repo)\b/,
    /\bcreatePerspectiveMemoryItem\b/,
    /\bproduct persistence boundary records\b/i,
  ]) {
    assert.doesNotMatch(source, pattern, `doctor/setup scripts must not contain ${pattern}`);
  }

  assert.doesNotMatch(
    source,
    /spawnSync\([^)]*["']dev["']/s,
    "doctor/setup scripts must not spawn dev servers directly",
  );
}

function assertDoctorJson() {
  const result = spawnSync(process.execPath, [files.doctor, "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `doctor --json should pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.tool, "augnes-codex-doctor");
  assert.equal(parsed.mode, "read-only");
  assert.ok(Array.isArray(parsed.checks), "doctor JSON should include checks array");
  assert.ok(Array.isArray(parsed.recommended_next_actions), "doctor JSON should include recommended next actions");
  assert.ok(Array.isArray(parsed.skipped_reasons), "doctor JSON should include skipped reasons");
  assert.ok(parsed.checks.some((check) => check.name === "repository_root"), "doctor JSON should check repo root");
  assert.ok(parsed.checks.some((check) => check.name === "node_version"), "doctor JSON should check Node");
  assert.ok(parsed.checks.some((check) => check.name === "npm_version"), "doctor JSON should check npm");
  const tempDemoDbCheck = parsed.checks.find((check) => check.name === "temp_demo_db");
  assert.ok(tempDemoDbCheck, "doctor JSON should include temp_demo_db check");
  assert.match(tempDemoDbCheck.detail, /\/tmp\/augnes-demo\.db/, "temp_demo_db check should target /tmp/augnes-demo.db");
  assert.match(
    tempDemoDbCheck.detail,
    /ready|missing_temp_demo_db|symlink_temp_demo_db|missing_core_tables|missing_seeded_demo_rows|sqlite_read_failed|stat_failed|not_regular_file/,
    "temp_demo_db detail should record readiness or a concrete warning reason",
  );
}

function assertDoctorReport() {
  const result = spawnSync(process.execPath, [files.doctor, "--report"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `doctor --report should pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  for (const expected of [
    "## Augnes Codex Doctor Report",
    "### Checks",
    "### Recommended next actions",
    "### Skipped checks",
    "### Boundary",
    "Mode: read-only",
  ]) {
    assert.ok(result.stdout.includes(expected), `doctor --report should include ${expected}`);
  }
}

function assertSetupDryRun() {
  const result = spawnSync(process.execPath, [files.setup], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `setup dry run should pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.ok(result.stdout.includes("DRY RUN: pass --yes"), "setup should dry-run without --yes");
  assert.ok(result.stdout.includes("## Commands that would run"), "setup dry run should print finite commands");
  assert.ok(!result.stdout.includes("Executing finite local setup commands"), "setup must not execute without --yes");
  for (const expected of [
    "npm install",
    "npm --prefix apps/augnes_apps install",
    "AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:reset",
    "AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:migrate",
    "AUGNES_DB_PATH=/tmp/augnes-demo.db npm run demo:seed",
  ]) {
    assert.ok(result.stdout.includes(expected), `setup dry run should include ${expected}`);
  }
}

function assertDocs(text) {
  for (const expected of [
    "Codex, prepare Augnes",
    "Bootstrap vs Doctor vs Setup",
    "What Codex Can Do Automatically",
    "What Codex Must Not Do Automatically",
    "/tmp/augnes-demo.db",
    "Skipped Reason Policy",
    "npm run augnes:doctor -- --json",
    "npm run augnes:doctor -- --report",
    "How This Helps Non-expert Users",
    "does not call MCP tools",
    "`runtime_state_brief` requires HTTP 200 and a successful Augnes state brief response",
    "`temp_demo_db` checks only `/tmp/augnes-demo.db`",
    "missing_temp_demo_db",
    "symlink_temp_demo_db",
    "read-only SQLite inspection",
    "PR #545 dogfood",
    "MCP bridge check is endpoint reachability only",
    "does not require `OPENAI_API_KEY`",
    "write `~/.codex/config.toml`",
    "create perspective-memory items",
    "create product persistence boundary records",
  ]) {
    assert.ok(text.includes(expected), `doctor docs should include ${expected}`);
  }
}

function assertReport(text) {
  for (const expected of [
    "## Summary",
    "## Files changed",
    "## Behavior",
    "`temp_demo_db`",
    "/tmp/augnes-demo.db",
    "missing_temp_demo_db",
    "symlink_temp_demo_db",
    "## Boundary",
    "## Verification plan",
    "## Skipped checks",
    "## Next recommended PR",
    "local setup and doctor behavior only",
    "runtime authority, DB schema changes",
    "secret handling",
    "provider calls",
    "Codex SDK execution",
    "GitHub API calls",
    "proof/evidence writes",
    "Augnes state",
  ]) {
    assert.ok(text.includes(expected), `doctor report should include ${expected}`);
  }
}
