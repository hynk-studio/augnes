import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_V0_1_CLOSEOUT.md";
const reportFile =
  "reports/2026-06-12-perspective-codex-former-local-adapter-v0-1-closeout.md";
const summaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-v0-1-closeout-summary.json";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-v0-1-closeout.mjs";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const preparedWaitingRoute =
  "http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-snapshot-fixture";
const validateResultRoute =
  "http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-validate-result-fixture";
const requiredFixtureFiles = [
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json",
  "reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-summary-dry-run.json",
  "reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json",
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-prepared.json",
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-waiting.json",
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-prepared.json",
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-waiting.json",
  "reports/fixtures/2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-dry-run-summary-ready.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json",
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json",
];
const requiredRouteFiles = [
  "app/cockpit/perspective/codex-former/local-adapter-snapshot-fixture/page.tsx",
  "app/cockpit/perspective/codex-former/local-adapter-validate-result-fixture/page.tsx",
  "app/cockpit/perspective/codex-former/local-adapter-validate-result-fixture/validate-result-fixture-surface.tsx",
  "app/cockpit/perspective/codex-former/local-adapter-validate-result-fixture/validate-result-fixture-surface.module.css",
];
const requiredReports = [
  "reports/2026-06-11-perspective-codex-former-local-adapter-manifest-to-source-input.md",
  "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-orchestration-dry-run.md",
  "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-execution.md",
  "reports/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening.md",
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-orchestration-dry-run.md",
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-orchestration-execution.md",
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-result-snapshots.md",
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.md",
];
const requiredBrowserReports = [
  "reports/browser/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface.md",
  "reports/browser/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening.md",
  "reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface.md",
  "reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.md",
];
const requiredPackageScripts = [
  "smoke:perspective-codex-former-local-adapter-v0-1-closeout",
  "smoke:perspective-codex-former-local-adapter-manifest-to-source-input",
  "smoke:perspective-codex-former-local-adapter-prepare-orchestration-dry-run",
  "smoke:perspective-codex-former-local-adapter-prepare-execution",
  "smoke:perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening",
  "smoke:perspective-codex-former-local-adapter-validate-orchestration-dry-run",
  "smoke:perspective-codex-former-local-adapter-validate-orchestration-execution",
  "smoke:perspective-codex-former-local-adapter-validate-result-snapshots",
  "smoke:perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening",
  "browser:perspective-codex-former-local-adapter-snapshot-fixture-surface",
  "browser:perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening",
  "browser:perspective-codex-former-local-adapter-validate-result-fixture-surface",
  "browser:perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening",
];
const expectedCompletedStages = [
  "bounded_source_input",
  "prepare_dry_run",
  "prepare_execution",
  "prepared_waiting_snapshots",
  "prepared_waiting_read_only_ui",
  "prepared_waiting_ui_hardening",
  "validate_orchestration_design",
  "validate_orchestration_dry_run",
  "validate_orchestration_execution",
  "validate_result_snapshots",
  "validate_result_read_only_ui",
  "validate_result_ui_hardening",
  "browser_validation",
];
const expectedRemainingScope = [
  "accepted state design",
  "persistence design",
  "review decision records",
  "runtime/product handoff",
  "Constellation/Core handoff",
  "provider/model integration",
  "Codex SDK integration",
  "GitHub mutation",
  "automatic promotion",
  "proof/evidence/readiness record creation",
];
const authorityFalseFields = [
  "accepted_state_created",
  "review_decision_created",
  "db_writes",
  "network_calls",
  "provider_model_api_calls",
  "codex_calls",
  "codex_sdk_calls",
  "github_mutation",
  "core_decision",
  "proof_evidence_readiness_records_created",
  "persistence",
  "surface_export",
  "clipboard_automation",
  "runtime_fixture_mutation",
  "runtime_product_state_created",
  "automatic_promotion",
];

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const summaryFixture = JSON.parse(readFileSync(summaryFixtureFile, "utf8"));
const publicText = `${docText}\n${reportText}`;
const boundedTexts = [
  ["doc", docText],
  ["report", reportText],
  ["summary fixture", JSON.stringify(summaryFixture, null, 2)],
];

assertFilesExist();
assertPackageScripts();
assertSummaryFixture();
assertDocsAndReport();
assertNoPrivateMaterialMarkers();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-local-adapter-v0-1-closeout");

function assertFilesExist() {
  for (const file of [
    packageFile,
    docFile,
    reportFile,
    summaryFixtureFile,
    smokeFile,
    ...requiredFixtureFiles,
    ...requiredRouteFiles,
    ...requiredReports,
    ...requiredBrowserReports,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["smoke:perspective-codex-former-local-adapter-v0-1-closeout"],
    `${expectedTsxCommand} ${smokeFile}`,
  );
  for (const script of requiredPackageScripts) {
    assert.equal(typeof packageJson.scripts[script], "string", `${script} must exist`);
  }
}

function assertSummaryFixture() {
  assert.equal(
    summaryFixture.summary_version,
    "codex_former_local_adapter_v0_1_closeout_summary.v0.1",
  );
  assert.equal(summaryFixture.mode, "local-codex-adapter-v0-1-closeout");
  assert.equal(summaryFixture.status, "complete_for_local_fixture_backed_v0_1");
  assert.deepEqual(summaryFixture.completed_stages, expectedCompletedStages);
  assert.deepEqual(summaryFixture.required_routes, [preparedWaitingRoute, validateResultRoute]);
  for (const file of requiredFixtureFiles) {
    assert(
      JSON.stringify(summaryFixture.required_fixtures).includes(file),
      `summary fixture must reference ${file}`,
    );
  }
  for (const file of requiredReports) {
    assert(summaryFixture.required_reports.includes(file), `summary must include ${file}`);
  }
  for (const file of requiredBrowserReports) {
    assert(
      summaryFixture.required_browser_reports.includes(file),
      `summary must include ${file}`,
    );
  }
  for (const script of requiredPackageScripts) {
    assert(summaryFixture.required_smokes.includes(script), `summary must include ${script}`);
  }
  for (const field of authorityFalseFields) {
    assert.equal(summaryFixture.authority_boundary[field], false, `${field} must be false`);
  }
  assert.deepEqual(summaryFixture.remaining_non_v0_1_scope, expectedRemainingScope);
  assert.equal(
    summaryFixture.next_recommended_axis,
    "Design accepted-state / persistence boundary only after separate product decision, or pause this axis and start the next prioritized Augnes feature. Do not continue fixture UI hardening unless a concrete regression appears.",
  );
}

function assertDocsAndReport() {
  assertIncludesAll(publicText, [
    "Why This Follows PR #527",
    "v0.1 Completed Chain",
    "source input fixture path",
    "prepare execution summary fixture path",
    "prepared/waiting snapshot fixture paths",
    "returned candidate envelope fixture path",
    "validate dry-run summary fixture path",
    "validate execution summary fixture paths for PASS / PASS with follow-up / BLOCKED",
    "validate result snapshot fixture paths",
    preparedWaitingRoute,
    validateResultRoute,
    "browser validation reports for prepared/waiting UI and validate result UI",
    "hardening reports for prepared/waiting UI and validate result UI",
    "PASS / PASS with follow-up / BLOCKED semantics are review-only",
    "prepared_waiting_for_codex_return",
    "review-only boundary",
    "no accepted state / no review decision / no persistence / no DB / no provider/model / no Codex / no Codex SDK / no GitHub mutation / no Core decision",
    "remaining_non_v0_1_scope",
    "No further UI hardening is recommended without a concrete regression",
    "Design accepted-state / persistence boundary only after separate product decision, or pause this axis and start the next prioritized Augnes feature. Do not continue fixture UI hardening unless a concrete regression appears.",
  ]);
  for (const file of [
    ...requiredFixtureFiles,
    summaryFixtureFile,
    ...requiredBrowserReports,
    ...requiredReports.filter((file) => file.includes("hardening")),
  ]) {
    assert(publicText.includes(file), `docs/report must mention ${file}`);
  }
}

function assertNoPrivateMaterialMarkers() {
  for (const [label, text] of boundedTexts) {
    for (const marker of [
      "raw returned candidate content",
      "raw prompt text",
      "raw source packet",
      "hidden reasoning",
      "provider logs",
      "secrets",
      "tokens",
      "API keys",
      "browser dumps",
      "raw diffs",
      "raw review payloads",
      "raw source payloads",
      "raw candidate payloads",
      "private markers",
      "unsafe marker values",
      "sk-proj-",
      "ghp_",
    ]) {
      assert.equal(text.includes(marker), false, `${label} must not include ${marker}`);
    }
  }
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    docFile,
    reportFile,
    summaryFixtureFile,
    smokeFile,
    "scripts/smoke-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.mjs",
    "scripts/smoke-perspective-codex-former-local-adapter-validate-result-snapshots.mjs",
    "scripts/smoke-perspective-codex-former-local-adapter-validate-orchestration-execution.mjs",
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `closeout changed an out-of-scope file: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  return [
    ...new Set([
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
      ...gitLines(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ].sort();
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertIncludesAll(text, phrases) {
  for (const phrase of phrases) {
    assert(text.includes(phrase), `expected phrase: ${phrase}`);
  }
}
