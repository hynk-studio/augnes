import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-single-claim-product-write-preflight-stopline.ts";
const runnerPath =
  "scripts/run-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-stopline.sample.v0.1.json";
const preflightFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-command-envelope.sample.v0.1.json";
const packagePath = "package.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const tsxPath = "apps/augnes_apps/node_modules/.bin/tsx";

const artifactDir =
  "/tmp/augnes-single-claim-product-write-preflight-stopline-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const stoplinePath = path.join(artifactDir, "stopline.json");
const generatedContractTestsPath = path.join(artifactDir, "contract-tests.json");

const optionalReportPaths = {
  contract_tests:
    "/tmp/augnes-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1/report.json",
  preflight_command_envelope:
    "/tmp/augnes-single-claim-product-write-preflight-command-envelope-v0-1/report.json",
  noop_invocation_report:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1/report.json",
  dry_run_invocation_harness:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1/report.json",
  disabled_adapter_contract_tests:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-contract-tests-v0-1/report.json",
  disabled_adapter_skeleton:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1/report.json",
  authority_contract_bundle:
    "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1/report.json",
  product_write_gate_design:
    "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json",
};
const optionalBackupDir =
  "/tmp/augnes-single-claim-product-write-preflight-stopline-v0-1-optional-backups";

const expectedVersion = "manual_note_single_claim_product_write_preflight_stopline.v0.1";
const expectedStoplineStatus = "product_write_preflight_stopline_reached";
const blockedStoplineStatus = "blocked_before_product_write_preflight_stopline";
const expectedRecommendation = "ready_for_perspective_geometry_digest";
const blockedRecommendation = "blocked_before_perspective_geometry_digest";
const expectedNextSlice = "perspective_geometry_digest_builder_v0_1";
const expectedSecondarySlice =
  "agent_perspective_substrate_docs_type_fixture_v0_1";
const recheckSlice = "single_claim_product_write_preflight_stopline_recheck";

const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-product-write-preflight-stopline-v0-1",
  "stopline:research-candidate-single-claim-product-write-preflight-stopline-v0-1",
];
const downstreamAllowedPackageScriptNames = [
  "smoke:research-candidate-review-perspective-geometry-digest-v0-1",
  "smoke:agent-perspective-substrate-v0-1",
  "smoke:agent-perspective-substrate-preview-builder-v0-1",
  "smoke:agent-perspective-substrate-folded-audit-panel-v0-1",
  "smoke:research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1",
  "smoke:research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1",
  "smoke:research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1",
  "smoke:research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1",
  "smoke:feedback-event-store-minimal-v0-1",
  "smoke:feedback-event-store-review-controls-preview-v0-1",
  "smoke:feedback-event-write-route-contract-v0-1",
  "smoke:feedback-event-write-route-implementation-v0-1",
  "smoke:feedback-event-write-route-browser-validation-v0-1",
  "smoke:feedback-event-controls-ui-contract-v0-1",
  "smoke:feedback-event-controls-ui-implementation-v0-1",
  "smoke:feedback-event-controls-ui-browser-validation-v0-1",
  "smoke:feedback-event-store-list-route-contract-v0-1",
  "smoke:feedback-event-store-list-route-implementation-v0-1",
];
const expectedChangedFiles = [
  docsIndexPath,
  fixturePath,
  helperPath,
  packagePath,
  browserValidatorPath,
  runnerPath,
  smokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
];
const blockedSurfaceKeys = [
  "product_db_write",
  "product_id_allocation",
  "product_claim_id_allocation",
  "product_write_route",
  "product_write_ui_action",
  "product_write_adapter_enabled",
  "adapter_runtime_invocation",
  "enabled_adapter_transition",
  "command_envelope_persistence",
  "sql_execution",
  "db_open",
  "transaction_execution",
  "transaction_commit",
  "transaction_rollback_execution",
  "schema_or_migration_change",
  "proof_evidence_write",
  "perspective_or_canonical_graph_write",
  "durable_perspective_promotion",
  "work_item_creation",
  "source_fetch",
  "provider_or_openai_call",
  "retrieval_or_rag",
  "external_handoff",
  "browser_persistence",
  "product_write_implementation",
];
const productIdKeys = new Set([
  "product_record_id",
  "product_id",
  "product_claim_id",
  "canonical_claim_id",
  "canonical_id",
  "proof_id",
  "evidence_id",
  "perspective_id",
  "work_item_id",
  "product_idempotency_record_id",
  "product_rollback_record_id",
  "product_audit_record_id",
  "product_observability_record_id",
  "audit_record_product_id",
  "output_product_claim_id",
  "output_proof_id",
  "output_evidence_id",
  "output_perspective_id",
  "output_work_item_id",
  "normalized_product_claim_id",
  "normalized_proof_id",
  "normalized_evidence_id",
  "normalized_perspective_id",
  "normalized_work_item_id",
  "command_envelope_id",
]);

for (const filePath of [
  helperPath,
  runnerPath,
  smokePath,
  fixturePath,
  preflightFixturePath,
  packagePath,
  docsIndexPath,
  browserValidatorPath,
  tsxPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const runner = readFileSync(runnerPath, "utf8");
const smoke = readFileSync(smokePath, "utf8");
const fixture = readJson(fixturePath);
const preflightFixture = readJson(preflightFixturePath);
const packageJson = readJson(packagePath);
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const browserValidator = readFileSync(browserValidatorPath, "utf8");

assertStoplineArtifact(fixture, "committed fixture");
assertPackageScripts();
assertDocsAndBrowserValidator();
assertHelperAndRunnerSource();
assertNoForbiddenStaticSource(helper, "helper");
assertNoForbiddenStaticSource(runner, "runner");
assertNoForbiddenStaticSource(smoke, "smoke");

const backups = backupOptionalReports(Object.values(optionalReportPaths));
try {
  removeOptionalReports();
  const fixtureModeRun = runRunner({
    label: "fixture mode optional reports absent",
    env: { AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_STOPLINE_FIXTURE_MODE: "1" },
    expectPass: true,
  });
  assertReport(fixtureModeRun.report, "fixture mode report");
  assertStoplineArtifact(fixtureModeRun.stopline, "fixture mode stopline");
  assert.equal(
    fixtureModeRun.stopline.stopline_fingerprint,
    fixture.stopline_fingerprint,
    "fixture-mode stopline fingerprint must match committed fixture",
  );
  assert.deepEqual(
    fixtureModeRun.stopline.source_evidence,
    fixture.source_evidence,
    "fixture-mode source evidence must match committed fixture",
  );

  writeHarmlessStaleOptionalReports();
  const staleFixtureModeRun = runRunner({
    label: "fixture mode stale optional reports present",
    env: { AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_STOPLINE_FIXTURE_MODE: "1" },
    expectPass: true,
  });
  assert.equal(
    staleFixtureModeRun.stopline.stopline_fingerprint,
    fixtureModeRun.stopline.stopline_fingerprint,
    "stale optional reports must not affect fixture-mode fingerprint",
  );
  assert.deepEqual(
    staleFixtureModeRun.stopline.source_evidence,
    fixtureModeRun.stopline.source_evidence,
    "stale optional reports must not affect fixture-mode source evidence",
  );

  removeOptionalReports();
  writeJson(optionalReportPaths.contract_tests, {
    final_status: "fail",
    contract_suite: generatedContractSuite(),
  });
  assertRunnerBlocks(
    "failed optional #685 report",
    "optional_contract_tests_report_not_passed",
  );

  removeOptionalReports();
  writeJson(optionalReportPaths.contract_tests, { final_status: "pass" });
  assertRunnerBlocks(
    "optional #685 pass missing payload",
    "optional_contract_tests_report_missing_payload",
  );

  removeOptionalReports();
  const mismatchedContractSuite = generatedContractSuite();
  mismatchedContractSuite.suite_fingerprint = "fnv1a32:mismatched";
  writeJson(optionalReportPaths.contract_tests, {
    final_status: "pass",
    contract_suite: mismatchedContractSuite,
  });
  const contractMismatch = assertRunnerBlocks(
    "optional #685 payload mismatch",
    "optional_contract_tests_traceability_mismatch",
  );
  assert.equal(
    contractMismatch.report.optional_inputs.contract_tests.fallback_to_committed_fixture,
    false,
    "mismatched optional #685 evidence must not fall back silently",
  );

  removeOptionalReports();
  const mismatchedPreflight = cloneJson(preflightFixture);
  mismatchedPreflight.preflight_command_envelope_fingerprint = "fnv1a32:mismatched";
  writeJson(optionalReportPaths.preflight_command_envelope, {
    final_status: "pass",
    preflight_command_envelope: mismatchedPreflight,
  });
  const preflightMismatch = assertRunnerBlocks(
    "optional #684 payload mismatch",
    "optional_preflight_command_envelope_traceability_mismatch",
  );
  assert.equal(
    preflightMismatch.report.optional_inputs.preflight_command_envelope
      .fallback_to_committed_fixture,
    false,
    "mismatched optional #684 evidence must not fall back silently",
  );

  removeOptionalReports();
  const live = runRunner({
    label: "non-fixture live static boundary",
    env: {},
    expectPass: true,
  });
  assertReport(live.report, "live report");
  const liveUsesDownstreamFallback =
    live.report.static_boundary_base_mode ===
    "committed_allowlist_fallback_after_empty_or_downstream_delta";
  assert.equal(
    live.report.static_boundary_used_fallback_allowlist,
    liveUsesDownstreamFallback,
    "live static boundary should use committed delta for the stopline slice or committed allowlist for downstream slices",
  );
  assert.equal(
    live.report.next_recommended_slice,
    expectedNextSlice,
    "live report next slice",
  );
} finally {
  restoreOptionalReports(backups);
  runRunner({
    label: "final fixture reset",
    env: { AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_STOPLINE_FIXTURE_MODE: "1" },
    expectPass: true,
  });
}

const runtimeReport = readJson(reportPath);
const runtimeStopline = readJson(stoplinePath);

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-single-claim-product-write-preflight-stopline-v0-1",
      final_status: "pass",
      stopline_fingerprint: runtimeStopline.stopline_fingerprint,
      validation_matrix_count: runtimeStopline.stopline_validation_matrix.length,
      next_recommended_slice: runtimeStopline.next_recommended_slice,
      secondary_next_recommended_slice:
        runtimeStopline.secondary_next_recommended_slice,
      static_boundary_base_mode: runtimeReport.static_boundary_base_mode,
      checked_fixture_mode_determinism: true,
      checked_optional_report_blocks: true,
      checked_no_product_write_boundary: true,
      checked_roadmap_return: true,
    },
    null,
    2,
  ),
);

function assertStoplineArtifact(stopline, label) {
  assert.equal(stopline.stopline_kind, "manual_note_single_claim_product_write_preflight_stopline", `${label} kind`);
  assert.equal(stopline.stopline_version, expectedVersion, `${label} version`);
  assert.equal(stopline.stopline_status, expectedStoplineStatus, `${label} status`);
  assert.equal(stopline.product_write_lane_parked_now, true, `${label} lane parked`);
  assert.equal(stopline.recommendation_status, expectedRecommendation, `${label} recommendation`);
  assert.equal(stopline.next_recommended_slice, expectedNextSlice, `${label} next`);
  assert.equal(
    stopline.secondary_next_recommended_slice,
    expectedSecondarySlice,
    `${label} secondary next`,
  );
  assert.equal(stopline.validation?.passed, true, `${label} validation`);
  assert.ok(stopline.stopline_fingerprint, `${label} fingerprint`);
  assert.ok(
    stopline.stopline_validation_matrix.length >= 50 &&
      stopline.stopline_validation_matrix.length <= 80,
    `${label} validation matrix count`,
  );
  for (const row of stopline.stopline_validation_matrix) {
    assert.equal(row.check_status, "pass", `${label} matrix ${row.check_id}`);
  }
  for (const key of blockedSurfaceKeys) {
    assert.equal(
      stopline.blocked_surfaces_summary[key],
      false,
      `${label} blocked surface ${key}`,
    );
  }
  assert.equal(
    stopline.no_write_stopline_closeout.product_write_chain_ready_for_implementation,
    false,
    `${label} implementation readiness`,
  );
  assert.equal(
    stopline.no_write_stopline_closeout.next_safe_lane,
    expectedNextSlice,
    `${label} next safe lane`,
  );
  assert.equal(
    stopline.roadmap_return_packet.return_to_milestone,
    "M9_PerspectiveGeometryDigest_Builder",
    `${label} roadmap milestone`,
  );
  assert.equal(
    stopline.roadmap_return_packet.next_primary_slice,
    expectedNextSlice,
    `${label} roadmap primary`,
  );
  assert.equal(
    stopline.roadmap_return_packet.next_secondary_slice,
    expectedSecondarySlice,
    `${label} roadmap secondary`,
  );
  assertNoProductIds(stopline, label);
  assertNoWriteBoundary(stopline, label);
}

function assertReport(report, label) {
  assert.equal(report.report_kind, "manual_note_single_claim_product_write_preflight_stopline_report", `${label} kind`);
  assert.equal(report.report_version, expectedVersion, `${label} version`);
  assert.equal(report.final_status, "pass", `${label} final status`);
  assert.equal(report.stopline_status, expectedStoplineStatus, `${label} status`);
  assert.equal(report.recommendation_status, expectedRecommendation, `${label} recommendation`);
  assert.equal(report.next_recommended_slice, expectedNextSlice, `${label} next`);
  assert.equal(report.secondary_next_recommended_slice, expectedSecondarySlice, `${label} secondary`);
  assert.equal(report.validation?.passed, true, `${label} validation`);
}

function assertRunnerBlocks(label, expectedFailureCode) {
  const result = runRunner({ label, env: {}, expectPass: false });
  assert.equal(result.report.final_status, "fail", `${label} final status`);
  assert.equal(result.report.stopline_status, blockedStoplineStatus, `${label} status`);
  assert.equal(result.report.recommendation_status, blockedRecommendation, `${label} recommendation`);
  assert.equal(result.report.next_recommended_slice, recheckSlice, `${label} next`);
  assert.equal(result.stopline.validation.passed, false, `${label} artifact validation`);
  assert.ok(
    result.report.validation.failure_codes.includes(expectedFailureCode),
    `${label} report failure code ${expectedFailureCode}`,
  );
  assert.ok(
    result.stopline.validation.failure_codes.includes(expectedFailureCode),
    `${label} stopline failure code ${expectedFailureCode}`,
  );
  return result;
}

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-product-write-preflight-stopline-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "stopline:research-candidate-single-claim-product-write-preflight-stopline-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  );
  const packageDiff = readCommand("git diff -- package.json");
  const addedPackageLines = packageDiff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  for (const line of addedPackageLines) {
    assert.ok(
      [allowedPackageScriptNames, downstreamAllowedPackageScriptNames].some((scriptNames) =>
        scriptNames.some((scriptName) => line.includes(`"${scriptName}"`)),
      ),
      `package addition must only be stopline or downstream roadmap smoke scripts: ${line}`,
    );
  }
}

function assertDocsAndBrowserValidator() {
  assert.match(docsIndex, /product write preflight stopline/i);
  assert.match(docsIndex, /PerspectiveGeometryDigest Builder/i);
  assert.match(docsIndex, /Agent Perspective Substrate/i);
  assert.match(browserValidator, /single_claim_product_write_preflight_stopline_artifact_note/);
  assert.match(browserValidator, /single_claim_product_write_preflight_stopline_no_browser_route/);
}

function assertHelperAndRunnerSource() {
  assert.match(helper, /buildManualNoteSingleClaimProductWritePreflightStopline/);
  assert.match(helper, /ready_for_perspective_geometry_digest/);
  assert.match(helper, /perspective_geometry_digest_builder_v0_1/);
  assert.match(helper, /agent_perspective_substrate_docs_type_fixture_v0_1/);
  assert.doesNotMatch(helper, /ready_for_product_write_implementation/);
  assert.match(runner, /AUGNES_PRODUCT_WRITE_PREFLIGHT_STOPLINE_BASE_REF/);
  assert.match(runner, /optional_contract_tests_traceability_mismatch/);
  assert.match(runner, /optional_preflight_command_envelope_traceability_mismatch/);
}

function assertNoWriteBoundary(value, label) {
  const text = JSON.stringify(value);
  assert.doesNotMatch(text, /product_write_implementation_allowed_now\":true/, `${label} product write implementation`);
  assert.doesNotMatch(text, /product_write_allowed_now\":true/, `${label} product write allowed`);
  assert.doesNotMatch(text, /db_open_allowed_now\":true/, `${label} DB open`);
  assert.doesNotMatch(text, /sql_execution_allowed_now\":true/, `${label} SQL`);
  assert.doesNotMatch(text, /transaction_execution_allowed_now\":true/, `${label} transaction`);
  assert.equal(value.product_write_implementation_allowed_now, false, `${label} implementation flag`);
  assert.equal(value.product_write_authority_granted_now, false, `${label} authority flag`);
  assert.equal(value.product_write_allowed_now, false, `${label} write flag`);
  assert.equal(value.product_id_allocation_allowed_now, false, `${label} product ID flag`);
  assert.equal(value.command_envelope_persistence_allowed_now, false, `${label} command persistence flag`);
  assert.equal(value.db_open_allowed_now, false, `${label} DB flag`);
  assert.equal(value.sql_execution_allowed_now, false, `${label} SQL flag`);
  assert.equal(value.transaction_execution_allowed_now, false, `${label} transaction flag`);
  assert.equal(value.route_or_ui_allowed_now, false, `${label} route/UI flag`);
  assert.equal(value.durable_perspective_promotion_allowed_now, false, `${label} durable promotion flag`);
}

function assertNoProductIds(value, label) {
  const offenders = [];
  visit(value, [], (pathSegments, nestedValue) => {
    const key = pathSegments.at(-1);
    if (productIdKeys.has(key) && nestedValue !== null && nestedValue !== undefined) {
      offenders.push(`${pathSegments.join(".")}=${JSON.stringify(nestedValue)}`);
    }
  });
  assert.deepEqual(offenders, [], `${label} must not contain product/proof/evidence/Perspective/work IDs`);
}

function assertNoForbiddenStaticSource(source, label) {
  const browserPersistencePattern = new RegExp(
    `\\b(${[
      ["local", "Storage"].join(""),
      ["session", "Storage"].join(""),
      ["indexed", "DB"].join(""),
      ["document", "cookie"].join("."),
    ].join("|")})\\b`,
  );
  assert.doesNotMatch(source, /\bopenDatabase\s*\(/, `${label} must not call openDatabase`);
  assert.doesNotMatch(source, /\bexec(?:ute)?Sql\s*\(/i, `${label} must not execute SQL`);
  assert.doesNotMatch(source, /\bbeginTransaction\b|\bcommitTransaction\b|\brollbackTransaction\b/i, `${label} must not run transactions`);
  assert.doesNotMatch(source, /\bproductWriteHandler\b/i, `${label} must not add a product write handler`);
  assert.doesNotMatch(source, browserPersistencePattern, `${label} must not use browser persistence`);
  assert.doesNotMatch(
    source,
    /from\s+["'][^"']*(lib\/db|better-sqlite3|sqlite3|app\/|openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i,
    `${label} must not import forbidden runtime surfaces`,
  );
}

function runRunner({ label, env, expectPass }) {
  const result = spawnSync(process.execPath, [runnerPath], {
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  if (expectPass) {
    assert.equal(result.status, 0, `${label} runner stderr: ${result.stderr}`);
  } else {
    assert.notEqual(result.status, 0, `${label} runner should fail`);
  }
  const report = readJson(reportPath);
  const stopline = readJson(stoplinePath);
  return { report, stopline, stdout: result.stdout, stderr: result.stderr };
}

function generatedContractSuite() {
  if (!existsSync(generatedContractTestsPath)) {
    runRunner({
      label: "generate contract suite",
      env: { AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_STOPLINE_FIXTURE_MODE: "1" },
      expectPass: true,
    });
  }
  return readJson(generatedContractTestsPath);
}

function writeHarmlessStaleOptionalReports() {
  for (const [label, filePath] of Object.entries(optionalReportPaths)) {
    writeJson(filePath, {
      final_status: "fail",
      [label]: { stale_optional_report: true },
      contract_suite: { stale_optional_report: true },
      preflight_command_envelope: { stale_optional_report: true },
    });
  }
}

function removeOptionalReports() {
  for (const filePath of Object.values(optionalReportPaths)) {
    rmSync(filePath, { force: true });
  }
}

function backupOptionalReports(filePaths) {
  rmSync(optionalBackupDir, { recursive: true, force: true });
  mkdirSync(optionalBackupDir, { recursive: true });
  return filePaths.map((filePath, index) => {
    const backupPath = path.join(optionalBackupDir, `${index}.json`);
    if (existsSync(filePath)) {
      mkdirSync(path.dirname(backupPath), { recursive: true });
      renameSync(filePath, backupPath);
      return { filePath, backupPath, existed: true };
    }
    return { filePath, backupPath, existed: false };
  });
}

function restoreOptionalReports(backups) {
  for (const backup of backups) {
    rmSync(backup.filePath, { force: true });
    if (backup.existed) {
      mkdirSync(path.dirname(backup.filePath), { recursive: true });
      renameSync(backup.backupPath, backup.filePath);
    }
  }
  rmSync(optionalBackupDir, { recursive: true, force: true });
}

function visit(value, pathSegments, callback) {
  callback(pathSegments, value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, [...pathSegments, String(index)], callback));
  } else if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      visit(nestedValue, [...pathSegments, key], callback);
    }
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readCommand(command) {
  const result = spawnSync("zsh", ["-lc", command], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
