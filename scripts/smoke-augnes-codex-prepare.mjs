import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = {
  prepare: "scripts/augnes-codex-prepare.mjs",
  setup: "scripts/augnes-codex-local-demo-setup.mjs",
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
const setupSource = readFileSync(files.setup, "utf8");
const docText = readFileSync(files.doc, "utf8");
const reportText = readFileSync(files.report, "utf8");

assertSetupSource(setupSource);
assertSetupDryRunSummary();
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
      setup_summary_supported: true,
      setup_dry_run_summary_supported: true,
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
    "execution_mode",
    "setup_execution_warning",
    "getExecutionMode",
    "\"setup-executing\"",
    "\"diagnostic-only\"",
    "SETUP EXECUTION MODE: --yes delegates finite setup.",
    "This may run package install and reset/migrate/seed /tmp/augnes-demo.db.",
    "--json and --report do not cancel --yes.",
    "`--yes --json` and `--yes --report` still execute setup; output mode does not cancel `--yes`.",
    "before_doctor",
    "after_doctor",
    "setup_recommended",
    "temp_demo_db",
    "temp demo DB is missing or not ready",
    "npm run augnes:prepare -- --yes",
    "dependency or temp demo DB checks",
    "delegated_setup_summary",
    "setup_steps",
    "setup_worktree_status_before",
    "setup_worktree_status_after",
    "setup_worktree_status",
    "const worktreeStatusBefore = readWorktreeStatus(\"before\")",
    "const worktreeStatusAfter = readWorktreeStatus(\"after\")",
    "buildSetupWorktreeStatus(worktreeStatusBefore, worktreeStatusAfter)",
    "new_dirty_entries",
    "preexisting_dirty_entries",
    "Worktree was already dirty before setup; review before/after status before attributing changes to setup.",
    "lockfile_changed_after_setup",
    "lockfile_was_already_dirty_before_setup",
    "lockfile_churn_unknown_git_status_failed",
    "lockfile churn unknown because git status failed",
    "Inspect apps/augnes_apps/package-lock.json before committing setup-generated lockfile churn.",
    "Do not assume npm metadata churn is intended; restore unrelated package-lock.json changes after inspection.",
    "Lockfile was already dirty before setup; do not attribute apps/augnes_apps/package-lock.json to this setup run without diff review.",
    "AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_BEGIN",
    "AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_END",
    "Setup step outcomes",
    "Delegated setup step outcomes",
    "Setup worktree status",
    "Review new worktree changes after setup before committing.",
    "package-lock.json",
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
  assert.match(
    source,
    /function getExecutionMode\(\)[\s\S]+yesEnabled \? "setup-executing" : "diagnostic-only"/,
    "prepare source should label setup-executing when --yes is present and diagnostic-only otherwise",
  );
  assert.match(
    source,
    /function buildSetupExecutionWarning\(\)[\s\S]+--json and --report do not cancel --yes/,
    "prepare source should warn that --yes --json and --yes --report still execute setup",
  );
  assert.match(
    source,
    /function buildLockfileGuidance\(status\)[\s\S]+Inspect apps\/augnes_apps\/package-lock\.json[\s\S]+restore unrelated package-lock\.json changes after inspection[\s\S]+already dirty before setup/,
    "prepare source should include lockfile churn and already-dirty guidance",
  );
  assert.match(
    source,
    /const worktreeStatusBefore = readWorktreeStatus\("before"\);[\s\S]+const setupRun = runSetup\(\);[\s\S]+const worktreeStatusAfter = readWorktreeStatus\("after"\);/,
    "prepare should capture worktree status before and after delegated setup",
  );

  const spawnCalls = Array.from(source.matchAll(/spawnSync\(\s*"([^"]+)"\s*,\s*([^,\n]+)/g)).map((match) => ({
    command: match[1],
    argsRef: match[2],
  }));
  assert.deepEqual(spawnCalls, [
    { command: "npm", argsRef: "doctorArgs" },
    { command: "npm", argsRef: "delegatedSetupArgs" },
    { command: "git", argsRef: "gitStatusShortArgs" },
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
    /\bgit\s+checkout\b/,
    /\bgit\s+reset\b/,
    /\bgit\s+restore\b/,
    /\brevert\b/,
  ]) {
    assert.doesNotMatch(source, forbidden, `prepare source must not contain ${forbidden}`);
  }
}

function assertSetupSource(source) {
  for (const expected of [
    "AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_BEGIN",
    "AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_END",
    "tool: \"augnes-codex-local-demo-setup\"",
    "mode: shouldExecute ? \"execute\" : \"dry-run\"",
    "demo_db_path: demoDbPath",
    "display_command",
    "attempted: false",
    "completed: false",
    "status: \"SKIPPED\"",
    "dry_run_requires_yes",
    "exit_code",
    "root_dependencies",
    "apps_dependencies",
    "temp_demo_db_reset",
    "temp_demo_db_migrate",
    "temp_demo_db_seed",
    "Local demo setup does not start dev servers",
  ]) {
    assert.ok(source.includes(expected), `setup source should include ${expected}`);
  }
}

function assertSetupDryRunSummary() {
  const result = spawnSync(process.execPath, [files.setup], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `setup dry run should pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.ok(result.stdout.includes("DRY RUN: pass --yes"), "setup should dry-run without --yes");
  assert.ok(!result.stdout.includes("Executing finite local setup commands"), "setup must not execute without --yes");
  const summary = parseDelimitedJsonOutput(
    result.stdout,
    "AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_BEGIN",
    "AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_END",
  );
  assert.ok(summary, "setup dry run should emit parseable structured summary");
  assert.equal(summary.tool, "augnes-codex-local-demo-setup");
  assert.equal(summary.mode, "dry-run");
  assert.equal(summary.demo_db_path, "/tmp/augnes-demo.db");
  assert.equal(summary.steps.length, 5, "setup summary should include finite setup steps");
  for (const step of summary.steps) {
    assert.equal(step.attempted, false, `${step.id} must not be attempted in dry run`);
    assert.equal(step.completed, false, `${step.id} must not be completed in dry run`);
    assert.equal(step.status, "SKIPPED", `${step.id} must be skipped in dry run`);
    assert.equal(step.reason, "dry_run_requires_yes", `${step.id} should explain dry-run skip reason`);
    assert.ok(step.id, "step should include id");
    assert.ok(step.label, "step should include label");
    assert.ok(step.display_command, "step should include display command");
  }
  assert.ok(Array.isArray(summary.start_commands), "setup summary should include start commands");
  assert.ok(Array.isArray(summary.skipped_reasons), "setup summary should include skipped reasons");
  assert.ok(Array.isArray(summary.boundary), "setup summary should include boundary");
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
  assert.equal(parsed.execution_mode, "diagnostic-only");
  assert.equal(parsed.setup_execution_warning, null);
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
  assert.equal(parsed.delegated_setup_summary, null, "prepare without --yes should not have delegated setup summary");
  assert.deepEqual(parsed.setup_steps, [], "prepare without --yes should expose empty setup_steps array");
  assert.equal(
    parsed.setup_worktree_status_before,
    null,
    "prepare without --yes should not collect before setup worktree status",
  );
  assert.equal(
    parsed.setup_worktree_status_after,
    null,
    "prepare without --yes should not collect after setup worktree status",
  );
  assert.equal(parsed.setup_worktree_status, null, "prepare without --yes should not collect setup worktree status");
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
    "## Execution mode",
    "## Before doctor status",
    "## Setup recommendation",
    "## Setup execution status",
    "## Delegated setup step outcomes",
    "## Setup worktree status",
    "## Recommended next actions",
    "## Skipped checks",
    "## Boundary",
  ]) {
    assert.ok(result.stdout.includes(expected), `prepare report should include ${expected}`);
  }
  assert.ok(result.stdout.includes("- diagnostic-only"), "prepare --report without --yes should be diagnostic-only");
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
    "Execution mode",
    "diagnostic-only",
    "What is ready",
    "Setup step outcomes",
    "Setup worktree status",
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
    "Execution modes",
    "diagnostic-only",
    "setup-executing",
    "npm run augnes:prepare -- --yes --json",
    "npm run augnes:prepare -- --yes --report",
    "`--json` and `--report` do not cancel `--yes`",
    "npm run augnes:prepare -- --json",
    "npm run augnes:prepare -- --report",
    "npm run augnes:prepare -- --yes",
    "npm run augnes:setup-local-demo -- --yes",
    "/tmp/augnes-demo.db",
    "temp demo DB readiness",
    "PR #545 dogfood",
    "prepare --yes now shows delegated setup step outcomes",
    "dirty worktree after setup is reported but not modified",
    "setup_worktree_status_before",
    "setup_worktree_status_after",
    "Dirty worktree after setup is not automatically attributed to setup",
    "Worktree was already dirty before setup; review before/after status before attributing changes to setup.",
    "lockfile changed after setup",
    "lockfile was already dirty before setup",
    "lockfile churn unknown because git status failed",
    "Setup may alter `apps/augnes_apps/package-lock.json` under some npm versions",
    "inspect the lockfile diff",
    "restore unrelated npm metadata churn after inspection",
    "Prepare reports worktree status but does not modify files",
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
    "## Execution mode behavior",
    "setup-executing",
    "diagnostic-only",
    "`--json` and `--report` do not cancel `--yes`",
    "temp demo DB readiness",
    "/tmp/augnes-demo.db",
    "PR #545 dogfood",
    "Delegated setup summary shape",
    "delegated setup step outcomes",
    "dirty worktree",
    "new_dirty_entries",
    "preexisting_dirty_entries",
    "Dirty worktree after setup is not automatically attributed to setup",
    "Worktree was already dirty before setup; review before/after status before attributing changes to setup.",
    "lockfile changed after setup",
    "lockfile was already dirty before setup",
    "lockfile churn unknown because git status failed",
    "## Lockfile churn guidance",
    "inspect `apps/augnes_apps/package-lock.json`",
    "do not assume npm metadata churn is intended",
    "restore unrelated npm metadata churn after inspection",
    "prepare does not auto-revert files",
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

function parseDelimitedJsonOutput(output, startMarker, endMarker) {
  const start = output.indexOf(startMarker);
  const end = output.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  assert.notEqual(end, -1, `missing ${endMarker}`);
  return JSON.parse(output.slice(start + startMarker.length, end).trim());
}
