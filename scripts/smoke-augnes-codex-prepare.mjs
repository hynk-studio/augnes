import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = {
  prepare: "scripts/augnes-codex-prepare.mjs",
  smoke: "scripts/smoke-augnes-codex-prepare.mjs",
  doc: "docs/AUGNES_CODEX_PREPARE_V0_1.md",
  report: "reports/2026-06-14-augnes-codex-prepare.md",
  packageJson: "package.json",
};

for (const [name, filePath] of Object.entries(files)) {
  assert.ok(existsSync(filePath), `${name} file must exist at ${filePath}`);
}

const packageJson = JSON.parse(readFileSync(files.packageJson, "utf8"));
assert.equal(packageJson.scripts["augnes:prepare"], "node scripts/augnes-codex-prepare.mjs");
assert.equal(packageJson.scripts["smoke:augnes-codex-prepare"], "node scripts/smoke-augnes-codex-prepare.mjs");

const prepareSource = readFileSync(files.prepare, "utf8");
const docText = readFileSync(files.doc, "utf8");
const reportText = readFileSync(files.report, "utf8");

assertPrepareSource(prepareSource);
assertPrepareJson();
assertPrepareReport();
assertPrepareHuman();
assertDocs(docText);
assertReport(reportText);

console.log(
  JSON.stringify(
    {
      smoke: "augnes-codex-prepare",
      package_scripts_valid: true,
      prepare_json_supported: true,
      prepare_report_supported: true,
      prepare_without_yes_does_not_execute_setup: true,
      prepare_delegates_setup_only: true,
      boundary_preserved: true,
    },
    null,
    2,
  ),
);

function assertPrepareSource(source) {
  for (const expected of [
    "augnes-codex-prepare",
    "npm run augnes:setup-local-demo -- --yes",
    '"run", "augnes:setup-local-demo", "--", "--yes"',
    '"run", "augnes:doctor", "--", "--json"',
    "--json",
    "--report",
    "--yes",
    "before_doctor",
    "after_doctor",
    "setup_recommended",
    "temp_demo_db",
    "temp demo DB is missing or not ready",
    "npm run augnes:prepare -- --yes",
    "dependency or temp demo DB checks",
    "setup_executed",
    "recommended_next_actions",
    "skipped_reasons",
    "What is ready",
    "What Codex can safely do",
    "What still needs a visible terminal action",
    "Next commands",
    "prepareExitCode(result)",
    "prepareResult.setup_status.state === \"FAIL\"",
    "prepareResult.before_doctor?.overall_state === \"FAIL\"",
    "prepareResult.after_doctor?.overall_state === \"FAIL\"",
  ]) {
    assert.ok(source.includes(expected), `prepare source should include ${expected}`);
  }

  assert.match(
    source,
    /function prepareExitCode\(prepareResult\)[\s\S]+setup_status\.state === "FAIL"[\s\S]+before_doctor\?\.overall_state === "FAIL"[\s\S]+after_doctor\?\.overall_state === "FAIL"/,
    "prepare source should return nonzero for setup failure and hard doctor failures",
  );
  assert.doesNotMatch(
    source,
    /process\.exit\(result\.setup_status\.state === "FAIL" \? 1 : 0\)/,
    "process.exit must not be based only on setup_status.state",
  );
  assert.match(
    source,
    /function buildSetupRecommendation\(doctor\)[\s\S]+"temp_demo_db", "temp demo DB is missing or not ready"[\s\S]+check\.status !== "PASS"/,
    "prepare setup recommendation should include non-PASS temp_demo_db checks",
  );
  assert.match(
    source,
    /const prepareYesCommand = "npm run augnes:prepare -- --yes"/,
    "prepare should print the --yes prepare command for user approval",
  );

  const spawnCalls = Array.from(source.matchAll(/spawnSync\(\s*"([^"]+)"\s*,\s*([^,\n]+)/g)).map((match) => ({
    command: match[1],
    argsRef: match[2],
  }));
  assert.deepEqual(spawnCalls, [
    { command: "npm", argsRef: "doctorArgs" },
    { command: "npm", argsRef: "delegatedSetupArgs" },
  ]);

  for (const forbidden of [
    /\bdb:reset\b/,
    /\bdb:migrate\b/,
    /\bdemo:seed\b/,
    /process\.env\.AUGNES_DB_PATH/,
    /data["'],\s*["']augnes\.db/,
    /DEFAULT_DB_PATH/,
    /spawnSync\(\s*"npm"\s*,\s*\[\s*"install"/,
    /spawnSync\(\s*"npm"\s*,\s*\[[^\]]*"dev"/,
    /spawnSync\(\s*"env"/,
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
    /\bcreateProductPersistenceBoundaryRecord\b/,
    /\bcallMcpTool\b/i,
    /\bMcpClient\b/,
  ]) {
    assert.doesNotMatch(source, forbidden, `prepare source must not contain ${forbidden}`);
  }
}

function assertPrepareJson() {
  const result = spawnSync(process.execPath, [files.prepare, "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `prepare --json should pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.tool, "augnes-codex-prepare");
  assert.equal(parsed.mode, "json");
  assert.equal(parsed.yes_enabled, false);
  assert.equal(parsed.setup_executed, false);
  assert.ok(parsed.before_doctor, "prepare JSON should include before doctor");
  assert.equal(parsed.after_doctor, null, "prepare without --yes should not include after doctor");
  assert.ok(typeof parsed.setup_recommended?.recommended === "boolean");
  const tempDemoDbCheck = parsed.before_doctor.checks.find((check) => check.name === "temp_demo_db");
  assert.ok(tempDemoDbCheck, "prepare JSON should include doctor temp_demo_db check");
  if (tempDemoDbCheck.status !== "PASS") {
    assert.equal(parsed.setup_recommended.recommended, true, "non-PASS temp_demo_db should recommend setup");
    assert.ok(
      parsed.setup_recommended.reasons.some((reason) => reason.includes("temp demo DB is missing or not ready")),
      "setup recommendation should include temp demo DB reason",
    );
    assert.ok(
      parsed.recommended_next_actions.some((action) => action.includes("npm run augnes:prepare -- --yes")),
      "prepare should print npm run augnes:prepare -- --yes when temp demo DB is not ready",
    );
  }
  assert.ok(Array.isArray(parsed.recommended_next_actions));
  assert.ok(Array.isArray(parsed.skipped_reasons));
  assert.ok(Array.isArray(parsed.boundary));
}

function assertPrepareReport() {
  const result = spawnSync(process.execPath, [files.prepare, "--report"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `prepare --report should pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  for (const expected of [
    "## Summary",
    "## Prepare result",
    "## Before doctor status",
    "## Setup recommendation",
    "## Setup execution status",
    "## Recommended next actions",
    "## Skipped checks",
    "## Boundary",
  ]) {
    assert.ok(result.stdout.includes(expected), `prepare report should include ${expected}`);
  }
  assert.doesNotMatch(result.stdout, /setup_executed: true/, "prepare --report without --yes must not execute setup");
}

function assertPrepareHuman() {
  const result = spawnSync(process.execPath, [files.prepare], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `prepare human output should pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  for (const expected of [
    "Augnes prepare status",
    "What is ready",
    "What Codex can safely do",
    "What still needs a visible terminal action",
    "Next commands",
  ]) {
    assert.ok(result.stdout.includes(expected), `prepare human output should include ${expected}`);
  }
  assert.ok(!result.stdout.includes("setup_executed: yes"), "prepare without --yes must not execute setup");
}

function assertDocs(text) {
  for (const expected of [
    "Codex, prepare Augnes",
    "How Prepare Differs From Bootstrap, Doctor, and Setup",
    "Without --yes",
    "With --yes",
    "npm run augnes:prepare -- --json",
    "npm run augnes:prepare -- --report",
    "npm run augnes:prepare -- --yes",
    "npm run augnes:setup-local-demo -- --yes",
    "/tmp/augnes-demo.db",
    "temp demo DB readiness",
    "PR #545 dogfood",
    "Why Long-running Servers Are Not Auto-started",
    "Why User-level Codex Config Is Not Auto-written",
    "How Non-expert Users Should Use It",
    "How Codex Should Report Skipped Checks",
    "Authority Boundary",
    "does not call MCP tools",
    "does not require `OPENAI_API_KEY`",
    "create perspective-memory items",
    "create product persistence boundary records",
  ]) {
    assert.ok(text.includes(expected), `prepare docs should include ${expected}`);
  }
}

function assertReport(text) {
  for (const expected of [
    "## Summary",
    "## Files changed",
    "## Behavior",
    "temp demo DB readiness",
    "/tmp/augnes-demo.db",
    "PR #545 dogfood",
    "## User-facing flow",
    "## Boundary",
    "## Verification plan",
    "## Skipped checks",
    "## Next recommended PR",
    "guided prepare wrapper only",
    "does not add runtime authority",
    "DB schema changes",
    "secret handling",
    "provider/model calls",
    "Codex SDK",
    "GitHub API calls",
    "proof/evidence writes",
    "perspective-memory persistence",
    "product boundary creation",
    "Augnes state commit/reject authority",
  ]) {
    assert.ok(text.includes(expected), `prepare report should include ${expected}`);
  }
}
