import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
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
  "lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-noop-invocation-report.ts";
const runnerPath =
  "scripts/run-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs";
const sampleFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-noop-invocation-report.sample.v0.1.json";
const dryRunHarnessFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-dry-run-invocation-harness.sample.v0.1.json";
const packagePath = "package.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const tsxPath = "apps/augnes_apps/node_modules/.bin/tsx";

const artifactDir =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1";
const optionalBackupDir =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-noop-invocation-report-smoke-backups-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const noopReportPath = path.join(artifactDir, "noop-invocation-report.json");

const optionalReportPaths = {
  dry_run_invocation_harness:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1/report.json",
  disabled_adapter_contract_tests:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-contract-tests-v0-1/report.json",
  disabled_adapter_skeleton:
    "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1/report.json",
  authority_contract_bundle:
    "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1/report.json",
  dry_run_transaction_harness:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1/report.json",
  dry_run_transaction_plan:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1/report.json",
  disabled_bridge_skeleton_contract_tests:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1/report.json",
  disabled_bridge_skeleton:
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1/report.json",
  temp_to_product_bridge_design:
    "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json",
  product_write_gate_design:
    "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json",
};

const expectedReportKind =
  "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_report_report";
const expectedNoopKind =
  "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_report";
const expectedVersion =
  "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_report.v0.1";
const expectedStatus =
  "product_write_disabled_adapter_noop_invocation_report_only";
const blockedStatus =
  "blocked_before_product_write_disabled_adapter_noop_invocation_report";
const expectedRecommendation =
  "ready_for_single_claim_product_write_preflight_command_envelope";
const blockedRecommendation =
  "blocked_before_product_write_preflight_command_envelope";
const expectedNextSlice =
  "single_claim_product_write_preflight_command_envelope";
const recheckSlice =
  "single_claim_product_write_disabled_adapter_noop_invocation_report_recheck";

const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1",
  "report:research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1",
];
const downstreamAllowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-product-write-preflight-stopline-v0-1",
  "stopline:research-candidate-single-claim-product-write-preflight-stopline-v0-1",
];
const expectedChangedFiles = [
  docsIndexPath,
  sampleFixturePath,
  helperPath,
  packagePath,
  browserValidatorPath,
  runnerPath,
  smokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
];
const requiredMatrixCases = [
  "positive_noop_report_passes",
  "harness_final_status_fail_blocks",
  "adapter_runtime_invocation_true_blocks",
  "product_write_attempted_true_blocks",
  "product_db_write_true_blocks",
  "product_id_allocation_true_blocks",
  "sql_execution_true_blocks",
  "disabled_result_runtime_invocation_true_blocks",
  "dry_noop_preview_persisted_true_blocks",
  "preflight_executable_true_blocks",
  "preflight_product_claim_id_non_null_blocks",
  "normalized_product_claim_id_blocks",
  "failed_optional_harness_report_blocks",
  "optional_harness_report_missing_payload_blocks",
  "static_empty_delta_blocks",
  "static_package_addition_outside_allowlist_blocks",
  "static_schema_db_sql_changed_file_blocks",
  "static_app_router_ui_path_blocks",
  "static_external_call_pattern_blocks",
];
const productIdKeys = new Set([
  "product_record_id",
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
  sampleFixturePath,
  dryRunHarnessFixturePath,
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
const committedSample = readJson(sampleFixturePath);
const dryRunHarnessFixture = readJson(dryRunHarnessFixturePath);
const packageJson = readJson(packagePath);
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const browserValidator = readFileSync(browserValidatorPath, "utf8");
assert.equal(
  packageJson.scripts[
    "smoke:research-candidate-single-claim-product-write-preflight-command-envelope-v0-1"
  ],
  "node scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs",
);
assert.equal(
  packageJson.scripts[
    "envelope:research-candidate-single-claim-product-write-preflight-command-envelope-v0-1"
  ],
  "node scripts/run-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs",
);
assert.ok(
  browserValidator.includes(
    "single_claim_product_write_preflight_command_envelope_artifact_note",
  ),
);
assert.ok(
  browserValidator.includes(
    "single_claim_product_write_preflight_command_envelope_no_browser_route",
  ),
);

assertNoopReport(committedSample, "committed sample");
assertNoProductBoundary(committedSample);
assertSourceEvidence(committedSample);
assertOperatorReviewPacket(committedSample.operator_review_packet);
assertNoWriteCloseout(committedSample.no_write_closeout);
assertPreflightCommandEnvelopePreview(
  committedSample.product_write_preflight_command_envelope_preview,
);
assertValidationMatrix(committedSample);
assertStaticEvidence(committedSample.static_boundary_evidence, "committed sample");
assertNoProductIds(committedSample);
assertHelperSource();
assertRunnerSource();
assertPackageScripts();
assertDocsAndBrowserValidator();
assertUiPathDetector();
assertExportedHelperMutations();

const backups = backupOptionalReports(Object.values(optionalReportPaths));
try {
  removeOptionalReports(Object.values(optionalReportPaths));
  const absent = runFixtureMode("optional reports absent");
  writeHarmlessStaleOptionalReports();
  const stale = runFixtureMode("stale optional reports present");
  assert.equal(absent.report.final_status, "pass");
  assert.equal(stale.report.final_status, "pass");
  assert.equal(
    absent.noop.noop_invocation_report_fingerprint,
    stale.noop.noop_invocation_report_fingerprint,
    "fixture-mode no-op report fingerprint must ignore stale optional /tmp reports",
  );
  assert.deepEqual(
    absent.noop.source_evidence,
    stale.noop.source_evidence,
    "fixture-mode source evidence must ignore stale optional /tmp reports",
  );
  assert.ok(
    Object.values(stale.report.non_fingerprinted_runtime_notes.optional_reports_present_on_disk).every(
      Boolean,
    ),
    "runtime temp-presence notes may be recorded outside the no-op report artifact",
  );
  assertFixtureModeIgnoredOptionalInputs(stale.report);

  assertFailedOptionalReportBlocks({
    label: "dry_run_invocation_harness",
    report: {
      final_status: "fail",
      dry_run_invocation_harness: dryRunHarnessFixture,
    },
    expectedFailureCode: "optional_dry_run_invocation_harness_report_not_passed",
  });
  assertMissingOptionalPayloadBlocks({
    label: "dry_run_invocation_harness",
    report: {
      final_status: "pass",
      wrong_payload: dryRunHarnessFixture,
    },
    expectedFailureCode: "optional_dry_run_invocation_harness_report_missing_payload",
  });
  assertMalformedOptionalReportBlocks({
    label: "authority_contract_bundle",
    expectedFailureCode: "optional_authority_contract_bundle_report_malformed",
  });

  removeOptionalReports(Object.values(optionalReportPaths));
  const live = runRunner({
    label: "non-fixture static boundary metadata",
    env: {},
    expectPass: true,
  });
  assert.equal(live.report.final_status, "pass");
  assertStaticEvidence(
    {
      ...live.noop.static_boundary_evidence,
      static_boundary_base_ref: live.report.static_boundary_base_ref,
      static_boundary_base_mode: live.report.static_boundary_base_mode,
      static_boundary_changed_files_inspected:
        live.report.static_boundary_changed_files_inspected,
      static_boundary_package_added_lines_inspected:
        live.report.static_boundary_package_added_lines_inspected,
      static_boundary_used_fallback_allowlist:
        live.report.static_boundary_used_fallback_allowlist,
    },
    "runtime non-fixture report",
  );
  assert.notEqual(
    live.report.static_boundary_base_mode,
    "worktree_diff",
    "static boundary must not rely on worktree-only diff mode",
  );
} finally {
  restoreOptionalReports(backups);
  runFixtureMode("final passing fixture reset");
}

const runtimeReport = readJson(reportPath);
const runtimeNoopReport = readJson(noopReportPath);
assertReport(runtimeReport, "runtime fixture-mode report");
assertNoopReport(runtimeNoopReport, "runtime fixture-mode no-op report");
assert.deepEqual(runtimeReport.noop_invocation_report, runtimeNoopReport);

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1",
      final_status: "pass",
      noop_invocation_report_fingerprint:
        runtimeNoopReport.noop_invocation_report_fingerprint,
      validation_matrix_count:
        runtimeNoopReport.report_validation_matrix.length,
      next_recommended_slice: runtimeNoopReport.next_recommended_slice,
      static_boundary_base_mode: runtimeReport.static_boundary_base_mode,
      checked_fixture_mode_determinism: true,
      checked_failed_optional_harness_report: true,
      checked_no_product_write_boundary: true,
      checked_preflight_command_envelope_next_slice: true,
    },
    null,
    2,
  ),
);

function assertReport(report, label) {
  assert.equal(report.report_kind, expectedReportKind, `${label} kind`);
  assert.equal(report.report_version, expectedVersion, `${label} version`);
  assert.equal(report.final_status, "pass", `${label} final_status`);
  assert.equal(report.noop_invocation_report_status, expectedStatus);
  assert.equal(report.recommendation_status, expectedRecommendation);
  assert.equal(report.next_recommended_slice, expectedNextSlice);
  assert.equal(report.validation.passed, true);
  assert.deepEqual(report.validation.failure_codes, []);
  assert.ok(
    !String(report.next_recommended_slice).includes("product_write_implementation"),
    `${label} must not recommend product write implementation`,
  );
  assert.ok(
    Array.isArray(report.static_boundary_changed_files_inspected),
    `${label} static changed files recorded`,
  );
}

function assertNoopReport(report, label) {
  assert.equal(report.noop_invocation_report_kind, expectedNoopKind);
  assert.equal(report.noop_invocation_report_version, expectedVersion);
  assert.equal(report.noop_invocation_report_status, expectedStatus, `${label} status`);
  assert.match(report.noop_invocation_report_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(report.recommendation_status, expectedRecommendation);
  assert.equal(report.next_recommended_slice, expectedNextSlice);
  assert.equal(report.validation.passed, true);
  assert.deepEqual(report.validation.failure_codes, []);
  assert.equal(report.report_created_from_harness, true);
  assert.equal(report.report_reviewed_product_write_attempt, false);
  assert.equal(report.adapter_kind, "manual_note_single_claim_product_write_disabled_adapter");
}

function assertNoProductBoundary(report) {
  for (const [key, expected] of [
    ["adapter_enabled", false],
    ["adapter_invocation_attempted_now", true],
    ["adapter_invocation_executed_against_runtime", false],
    ["adapter_invocation_allowed_now", false],
    ["product_write_attempted_now", false],
    ["product_write_executed_now", false],
    ["product_write_allowed_now", false],
    ["product_write_authority_granted_now", false],
    ["product_write_implementation_allowed_now", false],
    ["transaction_execution_allowed_now", false],
    ["product_db_write", false],
    ["product_id_allocation", false],
    ["db_open", false],
    ["sql_execution", false],
    ["route_added", false],
    ["ui_write_action_added", false],
  ]) {
    assert.equal(report[key], expected, `${key} must be ${expected}`);
  }
  for (const [key, value] of Object.entries(report.explicit_forbidden_surfaces)) {
    assert.equal(value, false, `${key} forbidden surface must remain false`);
  }
  assert.equal(
    report.disabled_invocation_result.result_status,
    "rejected_disabled_adapter",
  );
  assert.equal(report.dry_noop_preview.preview_persisted_now, false);
  assert.equal(report.dry_noop_preview.preview_storage_target, "local_artifact_only");
  assert.equal(report.dry_noop_preview.write_operation_count_now, 0);
  assert.equal(report.dry_noop_preview.sql_statement_count_now, 0);
  assert.equal(report.dry_noop_preview.durable_record_count_now, 0);
}

function assertSourceEvidence(report) {
  const source = report.source_evidence;
  assert.equal(
    source.disabled_adapter_dry_run_invocation_harness.final_status,
    "pass",
  );
  assert.equal(
    source.disabled_adapter_dry_run_invocation_harness
      .dry_run_invocation_harness_status,
    "product_write_disabled_adapter_dry_run_invocation_harness_only",
  );
  assert.equal(
    source.disabled_adapter_dry_run_invocation_harness.recommendation_status,
    "ready_for_single_claim_product_write_disabled_adapter_noop_invocation_report",
  );
  assert.equal(
    source.disabled_adapter_dry_run_invocation_harness.next_recommended_slice,
    "single_claim_product_write_disabled_adapter_noop_invocation_report",
  );
  assert.equal(
    source.disabled_adapter_dry_run_invocation_harness
      .adapter_invocation_executed_against_runtime,
    false,
  );
  assert.equal(
    source.disabled_adapter_contract_tests.contract_suite_status,
    "product_write_disabled_adapter_contract_tests_passed",
  );
  assert.equal(
    source.disabled_adapter_skeleton.disabled_adapter_skeleton_status,
    "product_write_disabled_adapter_skeleton_only",
  );
  assert.equal(
    source.authority_contract_bundle.authority_contract_bundle_status,
    "product_write_authority_contracts_defined_only",
  );
  assert.equal(
    source.product_write_gate_design.gate_design_status,
    "product_write_gate_design_only",
  );
}

function assertOperatorReviewPacket(packet) {
  assert.equal(
    packet.review_packet_kind,
    "manual_note_single_claim_product_write_disabled_adapter_noop_invocation_operator_review_packet",
  );
  assert.equal(packet.review_packet_status, "reviewable_noop_invocation_only");
  assert.equal(packet.raw_manual_note_text_included, false);
  assert.equal(packet.operator_decision_required_before_product_write, true);
  assert.equal(packet.operator_decision_satisfied_now, false);
  assert.equal(packet.operator_may_approve_product_write_now, false);
  assert.equal(packet.operator_may_only_review_noop_report_now, true);
  for (const section of [
    "source evidence",
    "normalized invocation input",
    "refusal reasons",
    "no-write closeout",
    "preflight command envelope preview",
  ]) {
    assert.ok(packet.reviewed_sections.includes(section), `missing ${section}`);
  }
}

function assertNoWriteCloseout(closeout) {
  assert.equal(closeout.closeout_status, "no_write_observed");
  for (const key of [
    "runtime_adapter_invocation_now",
    "product_write_attempted_now",
    "product_write_executed_now",
    "product_db_write_now",
    "product_id_allocation_now",
    "db_open_now",
    "sql_execution_now",
    "transaction_execution_now",
    "durable_records_created_now",
    "route_added_now",
    "ui_write_action_added_now",
    "external_handoff_now",
  ]) {
    assert.equal(closeout[key], false, `closeout ${key}`);
  }
}

function assertPreflightCommandEnvelopePreview(preview) {
  assert.equal(preview.preview_status, "defined_for_next_slice_only");
  assert.equal(preview.executable_now, false);
  assert.equal(preview.product_write_allowed_now, false);
  assert.equal(preview.product_claim_id, null);
  assert.equal(preview.command_envelope_id, null);
  assert.equal(preview.command_envelope_persisted_now, false);
  assert.equal(preview.command_envelope_requires_next_slice, expectedNextSlice);
  assert.equal(preview.command_shape_preview.product_claim_id, null);
  assert.equal(preview.command_shape_preview.sql_statement_count_now, 0);
  assert.equal(preview.command_shape_preview.db_write_count_now, 0);
  assert.equal(preview.command_shape_preview.transaction_execution_now, false);
}

function assertValidationMatrix(report) {
  assert.ok(report.report_validation_matrix.length >= 45, "matrix breadth");
  for (const row of report.report_validation_matrix) {
    assert.equal(row.check_status, "pass", `matrix ${row.check_id}`);
  }
  for (const checkId of requiredMatrixCases) {
    assert.ok(
      report.report_validation_matrix.some((row) => row.check_id === checkId),
      `matrix case ${checkId} must be covered`,
    );
  }
}

function assertStaticEvidence(evidence, label) {
  assert.ok(evidence.static_boundary_base_ref, `${label} base ref recorded`);
  assert.ok(evidence.static_boundary_base_mode, `${label} base mode recorded`);
  assert.ok(
    Array.isArray(evidence.static_boundary_changed_files_inspected),
    `${label} changed files recorded`,
  );
  assert.ok(
    evidence.static_boundary_changed_files_inspected.length > 0,
    `${label} changed-file delta must be non-empty`,
  );
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(
      evidence.static_boundary_changed_files_inspected.includes(expectedFile),
      `${label} expected file missing: ${expectedFile}`,
    );
  }
  assert.ok(
    !evidence.static_boundary_changed_files_inspected.some(isSchemaDbSqlPath),
    `${label} must not include schema/migration/db/sql files`,
  );
  assert.ok(
    !evidence.static_boundary_changed_files_inspected.some((filePath) =>
      /^app\/api\//.test(filePath),
    ),
    `${label} must not include app/api route files`,
  );
  assert.ok(
    !evidence.static_boundary_changed_files_inspected.some(isUiFilePath),
    `${label} must not include UI files`,
  );
  assertAllowedPackageAdditions(
    evidence.static_boundary_package_added_lines_inspected,
    `${label} package additions must stay limited to no-op report or downstream contract-test scripts`,
  );
}

function assertHelperSource() {
  assert.match(helper, /buildManualNoteSingleClaimProductWriteDisabledAdapterNoopInvocationReport/);
  assert.match(helper, /ready_for_single_claim_product_write_preflight_command_envelope/);
  assert.match(helper, /single_claim_product_write_preflight_command_envelope/);
  assert.match(helper, /adapter_invocation_executed_against_runtime:\s*false/);
  assert.match(helper, /command_envelope_persisted_now:\s*false/);
  assertNoForbiddenStaticSource(helper, "helper");
}

function assertRunnerSource() {
  assert.match(
    runner,
    /AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_NOOP_INVOCATION_REPORT_BASE_REF/,
  );
  assert.match(runner, /optional_report_ignored_for_fixture_mode/);
  assert.match(runner, /optional_reports_present_on_disk/);
  assert.match(runner, /static_boundary_changed_files_inspected/);
  assert.match(runner, /static_boundary_package_added_lines_inspected/);
  assert.match(runner, /readGitLines\(\[\s*"diff",\s*"--name-only"/);
  assert.match(runner, /readGitOutput\(\[\s*"diff",\s*"--unified=0"/);
  assert.doesNotMatch(runner, /git diff --name-only/);
  assertNoForbiddenStaticSource(runner, "runner");
  assertNoForbiddenStaticSource(smoke, "smoke");
}

function assertPackageScripts() {
  for (const scriptName of allowedPackageScriptNames) {
    assert.ok(packageJson.scripts[scriptName], `missing ${scriptName}`);
  }
  assert.equal(
    packageJson.scripts[allowedPackageScriptNames[0]],
    `node ${smokePath}`,
  );
  assert.equal(
    packageJson.scripts[allowedPackageScriptNames[1]],
    `node ${runnerPath}`,
  );
}

function assertDocsAndBrowserValidator() {
  assert.match(
    docsIndex,
    /manual-note-single-claim-product-write-disabled-adapter-noop-invocation-report/,
  );
  assert.match(docsIndex, /single_claim_product_write_preflight_command_envelope/);
  assert.match(docsIndex, /not product write implementation/i);
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_disabled_adapter_noop_invocation_report_artifact_note",
    ),
    "browser validator must include no-op report artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_disabled_adapter_noop_invocation_report_no_browser_route",
    ),
    "browser validator must assert no no-op report browser route",
  );
}

function assertUiPathDetector() {
  assert.equal(isUiFilePath("app/foo/page.tsx"), true);
  assert.equal(isUiFilePath("app/layout.jsx"), true);
  assert.equal(isUiFilePath("components/Foo.tsx"), true);
  assert.equal(isUiFilePath("lib/research-candidate-review/file.ts"), false);
}

function assertExportedHelperMutations() {
  const script = `
    import { readFileSync } from "node:fs";
    import { buildManualNoteSingleClaimProductWriteDisabledAdapterNoopInvocationReport } from "./${helperPath}";
    const harness = JSON.parse(readFileSync("${dryRunHarnessFixturePath}", "utf8"));
    const staticBoundaryEvidence = ${JSON.stringify(committedSample.static_boundary_evidence)};
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const runCase = (label, mutate, sourceCodes = []) => {
      const mutatedHarness = clone(harness);
      if (mutate) mutate(mutatedHarness);
      const result = buildManualNoteSingleClaimProductWriteDisabledAdapterNoopInvocationReport({
        dryRunInvocationHarness: mutatedHarness,
        staticBoundaryEvidence,
        sourceValidationFailureCodes: sourceCodes
      });
      return {
        label,
        status: result.noop_invocation_report_status,
        recommendation: result.recommendation_status,
        next: result.next_recommended_slice,
        failures: result.validation.failure_codes
      };
    };
    const cases = [
      runCase("missing harness", () => {}, ["optional_dry_run_invocation_harness_report_missing_payload"]),
      runCase("blocked harness", (draft) => { draft.dry_run_invocation_harness_status = "blocked"; }),
      runCase("runtime invocation", (draft) => { draft.adapter_invocation_executed_against_runtime = true; }),
      runCase("product db write", (draft) => { draft.product_db_write = true; }),
      runCase("product id", (draft) => { draft.disabled_invocation_result.product_claim_id = "product:blocked"; }),
      runCase("command envelope persisted", (draft) => { draft.dry_noop_preview.preview_persisted_now = true; }),
      runCase("normalized product claim id", (draft) => { draft.normalized_invocation_input.normalized_product_claim_id = "product:blocked"; }),
      runCase("normalized proof id", (draft) => { draft.normalized_invocation_input.normalized_proof_id = "proof:blocked"; }),
      runCase("normalized evidence id", (draft) => { draft.normalized_invocation_input.normalized_evidence_id = "evidence:blocked"; })
    ];
    console.log(JSON.stringify(cases));
  `;
  const cases = JSON.parse(execFileSync(tsxPath, ["--eval", script], { encoding: "utf8" }));
  for (const result of cases) {
    assert.equal(result.status, blockedStatus, `${result.label} status`);
    assert.equal(result.recommendation, blockedRecommendation, `${result.label} recommendation`);
    assert.equal(result.next, recheckSlice, `${result.label} next`);
    assert.ok(result.failures.length > 0, `${result.label} failures`);
    if (result.label.startsWith("normalized ")) {
      assert.ok(
        result.failures.includes("non_null_product_or_related_id_present") ||
          result.failures.includes("source_harness_non_null_product_or_related_id_present"),
        `${result.label} must be blocked by recursive no-ID validation`,
      );
    }
  }
}

function assertFixtureModeIgnoredOptionalInputs(report) {
  for (const input of report.optional_inputs) {
    assert.equal(input.optional_report_present, false, `${input.source_label} fixture presence`);
    assert.equal(
      input.optional_report_ignored_for_fixture_mode,
      true,
      `${input.source_label} fixture ignored`,
    );
    assert.equal(
      input.fallback_to_committed_fixture,
      true,
      `${input.source_label} fixture fallback`,
    );
    assert.equal(input.source_used, "committed_fixture", `${input.source_label} source`);
  }
}

function runFixtureMode(label) {
  return runRunner({
    label,
    env: {
      AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_NOOP_INVOCATION_REPORT_FIXTURE_MODE:
        "1",
    },
    expectPass: true,
  });
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
  const noop = readJson(noopReportPath);
  return { report, noop, stdout: result.stdout, stderr: result.stderr };
}

function assertFailedOptionalReportBlocks({ label, report, expectedFailureCode }) {
  removeOptionalReports(Object.values(optionalReportPaths));
  writeJson(optionalReportPaths[label], report);
  const result = runRunner({
    label: `${label} failed optional report`,
    env: {},
    expectPass: false,
  });
  assert.equal(result.report.final_status, "fail");
  assert.equal(result.report.noop_invocation_report_status, blockedStatus);
  assert.equal(result.report.recommendation_status, blockedRecommendation);
  assert.ok(
    result.report.validation.failure_codes.includes(expectedFailureCode),
    `${expectedFailureCode} missing from runner validation`,
  );
  assert.ok(
    result.noop.validation.failure_codes.includes(expectedFailureCode),
    `${expectedFailureCode} missing from helper validation`,
  );
}

function assertMissingOptionalPayloadBlocks({ label, report, expectedFailureCode }) {
  removeOptionalReports(Object.values(optionalReportPaths));
  writeJson(optionalReportPaths[label], report);
  const result = runRunner({
    label: `${label} missing optional payload`,
    env: {},
    expectPass: false,
  });
  assert.equal(result.report.final_status, "fail");
  assert.ok(result.report.validation.failure_codes.includes(expectedFailureCode));
}

function assertMalformedOptionalReportBlocks({ label, expectedFailureCode }) {
  removeOptionalReports(Object.values(optionalReportPaths));
  mkdirSync(path.dirname(optionalReportPaths[label]), { recursive: true });
  writeFileSync(optionalReportPaths[label], "{ malformed", "utf8");
  const result = runRunner({
    label: `${label} malformed optional report`,
    env: {},
    expectPass: false,
  });
  assert.equal(result.report.final_status, "fail");
  assert.ok(result.report.validation.failure_codes.includes(expectedFailureCode));
}

function writeHarmlessStaleOptionalReports() {
  for (const [label, filePath] of Object.entries(optionalReportPaths)) {
    writeJson(filePath, {
      final_status: "fail",
      [label]: { stale_optional_report: true },
      case_results: [{ stale_optional_report: true }],
    });
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

function removeOptionalReports(filePaths) {
  for (const filePath of filePaths) rmSync(filePath, { force: true });
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function assertNoProductIds(value) {
  assert.equal(hasNonNullProductIds(value), false, "no product or related ID allocated");
}

function hasNonNullProductIds(value) {
  if (Array.isArray(value)) return value.some((item) => hasNonNullProductIds(item));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nestedValue]) => {
    if (productIdKeys.has(key)) return nestedValue !== null && nestedValue !== undefined;
    return hasNonNullProductIds(nestedValue);
  });
}

function assertNoForbiddenStaticSource(text, label) {
  assert.doesNotMatch(text, executableSqlPattern(), `${label} must not contain executable SQL`);
  assert.doesNotMatch(text, forbiddenImportPattern(), `${label} must not import forbidden modules`);
  assert.doesNotMatch(text, networkOrExternalCallPattern(), `${label} must not call network/provider/retrieval/external APIs`);
  assert.doesNotMatch(text, browserPersistencePattern(), `${label} must not use browser persistence`);
  assert.doesNotMatch(text, appServerStartupPattern(), `${label} must not start a server`);
}

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
}

function assertAllowedPackageAdditions(lines, message) {
  const scriptNames = lines.map(extractScriptName);
  assert.ok(
    [allowedPackageScriptNames, downstreamAllowedPackageScriptNames].some(
      (allowed) => JSON.stringify(scriptNames) === JSON.stringify(allowed),
    ),
    `${message}: ${JSON.stringify(scriptNames)}`,
  );
}

function executableSqlPattern() {
  return new RegExp(
    `\\b(${[
      ["CREATE", "TABLE"].join("\\s+"),
      ["INSERT", "INTO"].join("\\s+"),
      ["ALTER", "TABLE"].join("\\s+"),
      ["DROP", "TABLE"].join("\\s+"),
      "UPDATE\\s+\\w+",
      "DELETE\\s+FROM",
    ].join("|")})\\b`,
    "i",
  );
}

function forbiddenImportPattern() {
  const forbidden = [
    ["lib", "db"].join("\\/"),
    "better-sqlite3",
    "sqlite3",
    ["app", ""].join("\\/"),
    "openai",
    "provider",
    "retrieval",
    "rag",
    "source-fetch",
    "proof",
    "evidence",
    "work-item",
    "perspective-write",
    "canonical-write",
  ].join("|");
  return new RegExp(`from\\s+["'][^"']*(${forbidden})[^"']*["']`, "i");
}

function networkOrExternalCallPattern() {
  const probes = [
    ["fet", "ch"].join(""),
    ["new", "OpenAI"].join("\\s+"),
    "webhook",
    "sendEmail",
    "slack",
    "providerClient",
    "retrievalClient",
    "ragClient",
  ];
  const callProbes = probes.map((probe) =>
    probe.includes("\\s+") ? probe : `${probe}\\s*\\(`,
  );
  return new RegExp(`(?:\\b${callProbes.join("|\\b")})`, "i");
}

function browserPersistencePattern() {
  return new RegExp(
    `\\b(${[
      ["local", "Storage"].join(""),
      ["session", "Storage"].join(""),
      ["indexed", "DB"].join(""),
      ["document", "cookie"].join("\\."),
    ].join("|")})\\b`,
  );
}

function appServerStartupPattern() {
  return new RegExp(
    `\\b(${[
      ["next", "dev"].join("\\s+"),
      ["npm", "run", "dev"].join("\\s+"),
      ["create", "Server"].join(""),
      "listen\\s*\\(",
    ].join("|")})`,
    "i",
  );
}

function isUiFilePath(filePath) {
  return /^components\//.test(filePath) || /^app\/.*\.(tsx|jsx)$/.test(filePath);
}

function isSchemaDbSqlPath(filePath) {
  return (
    /(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
      filePath,
    ) || /^lib\/db(\.ts|\/)/.test(filePath)
  );
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}
