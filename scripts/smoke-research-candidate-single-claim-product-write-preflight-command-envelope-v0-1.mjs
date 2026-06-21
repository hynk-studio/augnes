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
  "lib/research-candidate-review/manual-note-single-claim-product-write-preflight-command-envelope.ts";
const runnerPath =
  "scripts/run-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-v0-1.mjs";
const sampleFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-command-envelope.sample.v0.1.json";
const noopReportFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-noop-invocation-report.sample.v0.1.json";
const packagePath = "package.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const tsxPath = "apps/augnes_apps/node_modules/.bin/tsx";

const artifactDir =
  "/tmp/augnes-single-claim-product-write-preflight-command-envelope-v0-1";
const optionalBackupDir =
  "/tmp/augnes-single-claim-product-write-preflight-command-envelope-smoke-backups-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const preflightCommandEnvelopePath = path.join(
  artifactDir,
  "preflight-command-envelope.json",
);

const optionalReportPaths = {
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

const expectedReportKind =
  "manual_note_single_claim_product_write_preflight_command_envelope_report";
const expectedEnvelopeKind =
  "manual_note_single_claim_product_write_preflight_command_envelope";
const expectedVersion =
  "manual_note_single_claim_product_write_preflight_command_envelope.v0.1";
const expectedStatus = "product_write_preflight_command_envelope_only";
const blockedStatus = "blocked_before_product_write_preflight_command_envelope";
const expectedRecommendation =
  "ready_for_single_claim_product_write_preflight_command_envelope_contract_tests";
const blockedRecommendation =
  "blocked_before_product_write_preflight_command_envelope_contract_tests";
const expectedNextSlice =
  "single_claim_product_write_preflight_command_envelope_contract_tests";
const recheckSlice =
  "single_claim_product_write_preflight_command_envelope_recheck";

const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-product-write-preflight-command-envelope-v0-1",
  "envelope:research-candidate-single-claim-product-write-preflight-command-envelope-v0-1",
];
const expectedChangedFiles = [
  docsIndexPath,
  sampleFixturePath,
  helperPath,
  packagePath,
  browserValidatorPath,
  runnerPath,
  smokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
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
  "positive_envelope_from_committed_noop_report_passes",
  "noop_report_failed_blocks",
  "noop_report_status_blocked_blocks",
  "noop_report_next_slice_wrong_blocks",
  "operator_may_approve_product_write_now_true_blocks",
  "no_write_closeout_product_db_write_true_blocks",
  "invocation_closeout_failed_probe_count_positive_blocks",
  "command_envelope_persisted_now_true_blocks",
  "command_envelope_executable_now_true_blocks",
  "product_write_allowed_now_true_blocks",
  "product_write_authority_granted_now_true_blocks",
  "product_write_implementation_allowed_now_true_blocks",
  "product_claim_id_non_null_blocks",
  "product_id_allocation_true_blocks",
  "product_db_write_true_blocks",
  "db_open_true_blocks",
  "sql_execution_true_blocks",
  "transaction_execution_now_true_blocks",
  "adapter_runtime_invocation_now_true_blocks",
  "route_added_true_blocks",
  "ui_write_action_added_true_blocks",
  "command_input_raw_manual_note_text_true_blocks",
  "product_claim_draft_product_claim_id_non_null_blocks",
  "product_claim_draft_write_count_positive_blocks",
  "idempotency_durable_write_true_blocks",
  "rollback_durable_write_true_blocks",
  "audit_durable_write_true_blocks",
  "observability_durable_write_true_blocks",
  "missing_rejection_reason_blocks",
  "normalized_product_claim_id_non_null_blocks",
  "failed_optional_noop_report_blocks",
  "optional_pass_missing_nested_payload_blocks",
  "static_boundary_empty_delta_blocks",
  "static_boundary_package_addition_outside_allowlist_blocks",
  "static_boundary_missing_expected_package_script_blocks",
  "static_boundary_schema_db_sql_file_blocks",
  "static_boundary_app_router_ui_path_blocks",
  "static_boundary_external_call_pattern_blocks",
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
  noopReportFixturePath,
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
const noopReportFixture = readJson(noopReportFixturePath);
const packageJson = readJson(packagePath);
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const browserValidator = readFileSync(browserValidatorPath, "utf8");

assertEnvelope(committedSample, "committed sample");
assertNoProductBoundary(committedSample);
assertSourceEvidence(committedSample);
assertCommandEnvelopeInput(committedSample.command_envelope_input);
assertProductClaimDraftPreview(committedSample.product_claim_draft_preview);
assertPreviews(committedSample);
assertNoWritePreflightCloseout(committedSample.no_write_preflight_closeout);
assertValidationMatrix(committedSample);
assertStaticEvidence(committedSample.static_boundary_evidence, "committed sample", {
  expectFallback: true,
});
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
    absent.envelope.preflight_command_envelope_fingerprint,
    stale.envelope.preflight_command_envelope_fingerprint,
    "fixture-mode envelope fingerprint must ignore stale optional /tmp reports",
  );
  assert.deepEqual(
    absent.envelope.source_evidence,
    stale.envelope.source_evidence,
    "fixture-mode source evidence must ignore stale optional /tmp reports",
  );
  assert.ok(
    Object.values(stale.report.non_fingerprinted_runtime_notes.optional_reports_present_on_disk).every(
      Boolean,
    ),
    "runtime temp-presence notes may be recorded outside the envelope artifact",
  );
  assertFixtureModeIgnoredOptionalInputs(stale.report);
  assertStaticEvidence(stale.envelope.static_boundary_evidence, "fixture mode", {
    expectFallback: true,
  });

  assertFailedOptionalReportBlocks({
    label: "noop_invocation_report",
    report: {
      final_status: "fail",
      noop_invocation_report: noopReportFixture,
    },
    expectedFailureCode: "optional_noop_invocation_report_not_passed",
  });
  assertMissingOptionalPayloadBlocks({
    label: "noop_invocation_report",
    report: {
      final_status: "pass",
      wrong_payload: noopReportFixture,
    },
    expectedFailureCode: "optional_noop_invocation_report_missing_payload",
  });
  assertTraceabilityMismatchBlocks({
    label: "dry_run_invocation_harness",
    report: buildTraceableOptionalReport(
      "dry_run_invocation_harness",
      (payload) => {
        payload.dry_run_invocation_harness_fingerprint = "fnv1a32:mismatch";
      },
    ),
    expectedFailureCode:
      "optional_dry_run_invocation_harness_traceability_mismatch",
  });
  assertTraceabilityMismatchBlocks({
    label: "disabled_adapter_contract_tests",
    report: buildTraceableOptionalReport(
      "disabled_adapter_contract_tests",
      (payload) => {
        payload.suite_fingerprint = "fnv1a32:mismatch";
      },
    ),
    expectedFailureCode:
      "optional_disabled_adapter_contract_tests_traceability_mismatch",
  });
  assertTraceabilityMismatchBlocks({
    label: "disabled_adapter_skeleton",
    report: buildTraceableOptionalReport(
      "disabled_adapter_skeleton",
      (payload) => {
        payload.disabled_adapter_skeleton_fingerprint = "fnv1a32:mismatch";
      },
    ),
    expectedFailureCode:
      "optional_disabled_adapter_skeleton_traceability_mismatch",
  });
  assertTraceabilityMismatchBlocks({
    label: "authority_contract_bundle",
    report: buildTraceableOptionalReport(
      "authority_contract_bundle",
      (payload) => {
        payload.authority_contract_bundle_fingerprint = "fnv1a32:mismatch";
      },
    ),
    expectedFailureCode:
      "optional_authority_contract_bundle_traceability_mismatch",
  });
  assertTraceabilityMismatchBlocks({
    label: "product_write_gate_design",
    report: buildTraceableOptionalReport(
      "product_write_gate_design",
      (payload) => {
        payload.design_fingerprint = "fnv1a32:mismatch";
      },
    ),
    expectedFailureCode:
      "optional_product_write_gate_design_traceability_mismatch",
  });
  assertTraceabilityMismatchBlocks({
    label: "disabled_adapter_skeleton",
    report: buildTraceableOptionalReport(
      "disabled_adapter_skeleton",
      (payload) => {
        payload.adapter_enabled = true;
      },
    ),
    expectedFailureCode:
      "optional_disabled_adapter_skeleton_traceability_mismatch",
  });
  assertTraceabilityMismatchBlocks({
    label: "authority_contract_bundle",
    report: buildTraceableOptionalReport(
      "authority_contract_bundle",
      (payload) => {
        payload.authority_gap_summary.authority_granted_now_count = 1;
      },
    ),
    expectedFailureCode:
      "optional_authority_contract_bundle_traceability_mismatch",
  });
  assertTraceabilityMismatchBlocks({
    label: "product_write_gate_design",
    report: buildTraceableOptionalReport(
      "product_write_gate_design",
      (payload) => {
        payload.gate_design_status = "product_write_allowed";
      },
    ),
    expectedFailureCode:
      "optional_product_write_gate_design_traceability_mismatch",
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
      ...live.envelope.static_boundary_evidence,
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
    { expectFallback: false },
  );
} finally {
  restoreOptionalReports(backups);
  runFixtureMode("final passing fixture reset");
}

const runtimeReport = readJson(reportPath);
const runtimeEnvelope = readJson(preflightCommandEnvelopePath);
assertReport(runtimeReport, "runtime fixture-mode report");
assertEnvelope(runtimeEnvelope, "runtime fixture-mode envelope");
assert.deepEqual(runtimeReport.preflight_command_envelope, runtimeEnvelope);

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-product-write-preflight-command-envelope-v0-1",
      final_status: "pass",
      preflight_command_envelope_fingerprint:
        runtimeEnvelope.preflight_command_envelope_fingerprint,
      validation_matrix_count:
        runtimeEnvelope.preflight_validation_matrix.length,
      next_recommended_slice: runtimeEnvelope.next_recommended_slice,
      static_boundary_base_mode: runtimeReport.static_boundary_base_mode,
      checked_fixture_mode_determinism: true,
      checked_failed_optional_noop_report: true,
      checked_optional_traceability_mismatch_blocks: true,
      checked_no_product_write_boundary: true,
      checked_no_product_write_implementation_recommendation: true,
    },
    null,
    2,
  ),
);

function assertReport(report, label) {
  assert.equal(report.report_kind, expectedReportKind, `${label} kind`);
  assert.equal(report.report_version, expectedVersion, `${label} version`);
  assert.equal(report.final_status, "pass", `${label} final_status`);
  assert.equal(report.preflight_command_envelope_status, expectedStatus);
  assert.equal(report.recommendation_status, expectedRecommendation);
  assert.equal(report.next_recommended_slice, expectedNextSlice);
  assert.equal(report.validation.passed, true);
  assert.deepEqual(report.validation.failure_codes, []);
  assertNoImplementationRecommendation(report);
}

function assertEnvelope(envelope, label) {
  assert.equal(envelope.preflight_command_envelope_kind, expectedEnvelopeKind);
  assert.equal(envelope.preflight_command_envelope_version, expectedVersion);
  assert.equal(
    envelope.preflight_command_envelope_status,
    expectedStatus,
    `${label} status`,
  );
  assert.match(
    envelope.preflight_command_envelope_fingerprint,
    /^fnv1a32:[0-9a-f]{8}$/,
  );
  assert.equal(envelope.recommendation_status, expectedRecommendation);
  assert.equal(envelope.next_recommended_slice, expectedNextSlice);
  assert.equal(envelope.validation.passed, true);
  assert.deepEqual(envelope.validation.failure_codes, []);
  assert.equal(envelope.command_envelope_created_now, true);
  assertNoImplementationRecommendation(envelope);
}

function assertNoProductBoundary(envelope) {
  for (const [key, expected] of [
    ["command_envelope_persisted_now", false],
    ["command_envelope_executable_now", false],
    ["product_write_allowed_now", false],
    ["product_write_authority_granted_now", false],
    ["product_write_implementation_allowed_now", false],
    ["product_claim_id", null],
    ["product_id_allocation", false],
    ["product_db_write", false],
    ["db_open", false],
    ["sql_execution", false],
    ["transaction_execution_now", false],
    ["adapter_runtime_invocation_now", false],
    ["route_added", false],
    ["ui_write_action_added", false],
  ]) {
    assert.equal(envelope[key], expected, `${key} must be ${expected}`);
  }
  for (const [key, value] of Object.entries(envelope.explicit_forbidden_surfaces)) {
    assert.equal(value, false, `${key} forbidden surface must remain false`);
  }
}

function assertSourceEvidence(envelope) {
  const source = envelope.source_evidence;
  assert.equal(source.noop_invocation_report.final_status, "pass");
  assert.equal(
    source.noop_invocation_report.noop_invocation_report_status,
    "product_write_disabled_adapter_noop_invocation_report_only",
  );
  assert.equal(
    source.noop_invocation_report.recommendation_status,
    "ready_for_single_claim_product_write_preflight_command_envelope",
  );
  assert.equal(
    source.noop_invocation_report.next_recommended_slice,
    "single_claim_product_write_preflight_command_envelope",
  );
  assert.equal(source.noop_invocation_report.validation_passed, true);
  assert.equal(
    source.operator_review_packet.operator_decision_required_before_product_write,
    true,
  );
  assert.equal(source.operator_review_packet.operator_decision_satisfied_now, false);
  assert.equal(
    source.operator_review_packet.operator_may_approve_product_write_now,
    false,
  );
  assert.equal(source.no_write_closeout.closeout_status, "no_write_observed");
  assert.equal(
    source.invocation_closeout_summary.dry_run_invocation_result_status,
    "rejected_disabled_adapter",
  );
  assert.equal(source.invocation_closeout_summary.failed_probe_count, 0);
  assert.equal(source.noop_preflight_command_envelope_preview.executable_now, false);
  assert.equal(source.noop_preflight_command_envelope_preview.persisted_now, false);
  assert.equal(
    source.disabled_adapter_dry_run_invocation_harness.final_status,
    "pass",
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

function assertCommandEnvelopeInput(input) {
  assert.equal(
    input.input_kind,
    "manual_note_single_claim_product_write_preflight_command_envelope_input",
  );
  assert.equal(input.candidate_kind, "manual_note_single_claim");
  assert.ok(input.noop_invocation_report_fingerprint);
  assert.ok(input.dry_run_invocation_harness_fingerprint);
  assert.ok(input.authority_contract_bundle_fingerprint);
  assert.ok(input.selected_temp_claim_record_id);
  assert.ok(input.source_operation_id);
  assert.ok(input.source_temp_intent_id);
  assert.ok(input.temp_idempotency_key);
  assert.equal(input.operator_decision_reference, null);
  assert.equal(input.operator_decision_required, true);
  assert.equal(input.operator_decision_satisfied_now, false);
  assert.equal(input.raw_manual_note_text_included, false);
  assert.equal(input.product_claim_id, null);
  assert.equal(input.db_path, null);
  assert.equal(input.sql_text, null);
  assert.equal(input.route_request, null);
  assert.equal(input.ui_action_request, null);
}

function assertProductClaimDraftPreview(draft) {
  assert.equal(draft.draft_kind, "manual_note_single_claim_product_claim_draft_preview");
  assert.equal(draft.draft_status, "preflight_shape_only");
  assert.equal(draft.product_claim_id, null);
  assert.equal(draft.product_claim_schema_contract_required, true);
  assert.equal(draft.schema_satisfied_now, false);
  assert.equal(draft.raw_manual_note_text_included, false);
  assert.equal(draft.write_operation_count_now, 0);
  assert.equal(draft.db_write_count_now, 0);
  assert.equal(draft.sql_statement_count_now, 0);
}

function assertPreviews(envelope) {
  for (const label of [
    "idempotency_preview",
    "rollback_preview",
    "audit_preview",
    "observability_preview",
  ]) {
    const preview = envelope[label];
    assert.equal(preview.preview_status, "preflight_shape_only", label);
    for (const key of [
      "preview_persisted_now",
      "preview_executed_now",
      "durable_write_now",
      "db_open_now",
      "sql_execution_now",
      "transaction_execution_now",
      "product_id_allocation_now",
      "product_db_write_now",
      "proof_evidence_write_now",
      "perspective_or_canonical_graph_write_now",
      "work_item_creation_now",
    ]) {
      assert.equal(preview[key], false, `${label} ${key}`);
    }
    for (const key of [
      "product_claim_id",
      "proof_id",
      "evidence_id",
      "perspective_id",
      "work_item_id",
      "product_idempotency_record_id",
      "product_rollback_record_id",
      "product_audit_record_id",
      "product_observability_record_id",
    ]) {
      assert.equal(preview[key], null, `${label} ${key}`);
    }
  }
}

function assertNoWritePreflightCloseout(closeout) {
  assert.equal(closeout.closeout_status, "no_write_preflight_command_envelope_only");
  assert.equal(closeout.command_envelope_created_now, true);
  for (const key of [
    "command_envelope_persisted_now",
    "command_envelope_executable_now",
    "product_write_allowed_now",
    "product_write_executed_now",
    "product_db_write_now",
    "product_id_allocation_now",
    "db_open_now",
    "sql_execution_now",
    "transaction_execution_now",
    "transaction_commit_now",
    "transaction_rollback_execution_now",
    "adapter_runtime_invocation_now",
    "route_added_now",
    "ui_write_action_added_now",
    "proof_evidence_write_now",
    "perspective_or_canonical_graph_write_now",
    "work_item_creation_now",
    "source_fetch_now",
    "provider_or_openai_call_now",
    "retrieval_or_rag_now",
    "external_handoff_now",
    "browser_persistence_now",
    "durable_idempotency_write_now",
    "durable_rollback_write_now",
    "durable_audit_write_now",
    "durable_observability_write_now",
  ]) {
    assert.equal(closeout[key], false, `closeout ${key}`);
  }
}

function assertValidationMatrix(envelope) {
  assert.ok(
    envelope.preflight_validation_matrix.length >= 50 &&
      envelope.preflight_validation_matrix.length <= 80,
    "matrix breadth must stay in requested 50-80 row range",
  );
  for (const row of envelope.preflight_validation_matrix) {
    assert.equal(row.check_status, "pass", `matrix ${row.check_id}`);
  }
  for (const checkId of requiredMatrixCases) {
    assert.ok(
      envelope.preflight_validation_matrix.some((row) => row.check_id === checkId),
      `matrix case ${checkId} must be covered`,
    );
  }
}

function assertStaticEvidence(evidence, label, { expectFallback }) {
  assert.ok(evidence.static_boundary_base_ref, `${label} base ref recorded`);
  assert.ok(evidence.static_boundary_base_mode, `${label} base mode recorded`);
  assert.equal(
    evidence.static_boundary_used_fallback_allowlist,
    expectFallback,
    `${label} fallback mode`,
  );
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
  assert.deepEqual(
    evidence.static_boundary_package_added_lines_inspected.map(extractScriptName),
    allowedPackageScriptNames,
    `${label} package additions must stay limited to preflight smoke/envelope scripts`,
  );
}

function assertHelperSource() {
  assert.match(helper, /buildManualNoteSingleClaimProductWritePreflightCommandEnvelope/);
  assert.match(helper, /product_write_preflight_command_envelope_only/);
  assert.match(helper, /ready_for_single_claim_product_write_preflight_command_envelope_contract_tests/);
  assert.match(helper, /command_envelope_persisted_now:\s*false/);
  assert.match(helper, /command_envelope_executable_now:\s*false/);
  assert.match(helper, /product_claim_id:\s*null/);
  assertNoForbiddenStaticSource(helper, "helper");
}

function assertRunnerSource() {
  assert.match(runner, /AUGNES_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_BASE_REF/);
  assert.match(runner, /optional_report_ignored_for_fixture_mode/);
  assert.match(runner, /optional_reports_present_on_disk/);
  assert.match(runner, /static_boundary_changed_files_inspected/);
  assert.match(runner, /static_boundary_package_added_lines_inspected/);
  assert.match(runner, /readGitLines\(\[\s*"diff",\s*"--name-only"/);
  assert.match(runner, /readGitOutput\(\[\s*"diff",\s*"--unified=0"/);
  assertNoForbiddenStaticSource(runner, "runner");
  assertNoForbiddenStaticSource(smoke, "smoke");
}

function assertPackageScripts() {
  for (const scriptName of allowedPackageScriptNames) {
    assert.ok(packageJson.scripts[scriptName], `missing ${scriptName}`);
  }
  assert.equal(packageJson.scripts[allowedPackageScriptNames[0]], `node ${smokePath}`);
  assert.equal(packageJson.scripts[allowedPackageScriptNames[1]], `node ${runnerPath}`);
}

function assertDocsAndBrowserValidator() {
  assert.match(docsIndex, /manual-note-single-claim-product-write-preflight-command-envelope/);
  assert.match(docsIndex, /product write preflight command envelope only/i);
  assert.match(docsIndex, /not product write implementation/i);
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_preflight_command_envelope_artifact_note",
    ),
    "browser validator must include preflight envelope artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_preflight_command_envelope_no_browser_route",
    ),
    "browser validator must assert no preflight envelope browser route",
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
    import { buildManualNoteSingleClaimProductWritePreflightCommandEnvelope } from "./${helperPath}";
    const noop = JSON.parse(readFileSync("${noopReportFixturePath}", "utf8"));
    const staticBoundaryEvidence = ${JSON.stringify(committedSample.static_boundary_evidence)};
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const runCase = (label, mutate, sourceCodes = []) => {
      const mutatedNoop = clone(noop);
      if (mutate) mutate(mutatedNoop);
      const result = buildManualNoteSingleClaimProductWritePreflightCommandEnvelope({
        noopInvocationReport: mutatedNoop,
        commandEnvelopeInput: {},
        staticBoundaryEvidence,
        sourceValidationFailureCodes: sourceCodes
      });
      return {
        label,
        status: result.preflight_command_envelope_status,
        recommendation: result.recommendation_status,
        next: result.next_recommended_slice,
        failures: result.validation.failure_codes
      };
    };
    const cases = [
      runCase("missing noop", () => {}, ["optional_noop_invocation_report_missing_payload"]),
      runCase("blocked noop status", (draft) => { draft.noop_invocation_report_status = "blocked"; }),
      runCase("operator approval true", (draft) => { draft.operator_review_packet.operator_may_approve_product_write_now = true; }),
      runCase("source product db write", (draft) => { draft.no_write_closeout.product_db_write_now = true; }),
      runCase("product id", (draft) => { draft.product_write_preflight_command_envelope_preview.product_claim_id = "product:blocked"; }),
      runCase("command envelope persisted", (draft) => { draft.product_write_preflight_command_envelope_preview.command_envelope_persisted_now = true; }),
      runCase("normalized product claim id", (draft) => { draft.normalized_product_claim_id = "product:blocked"; }),
      runCase("normalized proof id", (draft) => { draft.normalized_proof_id = "proof:blocked"; }),
      runCase("normalized evidence id", (draft) => { draft.normalized_evidence_id = "evidence:blocked"; })
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
        result.failures.includes("source_non_null_product_or_related_id_present"),
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
      AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_FIXTURE_MODE:
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
  const envelope = readJson(preflightCommandEnvelopePath);
  return { report, envelope, stdout: result.stdout, stderr: result.stderr };
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
  assert.equal(result.report.preflight_command_envelope_status, blockedStatus);
  assert.equal(result.report.recommendation_status, blockedRecommendation);
  assert.ok(
    result.report.validation.failure_codes.includes(expectedFailureCode),
    `${expectedFailureCode} missing from runner validation`,
  );
  assert.ok(
    result.envelope.validation.failure_codes.includes(expectedFailureCode),
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

function assertTraceabilityMismatchBlocks({
  label,
  report,
  expectedFailureCode,
}) {
  removeOptionalReports(Object.values(optionalReportPaths));
  writeJson(optionalReportPaths[label], report);
  const result = runRunner({
    label: `${label} traceability mismatch`,
    env: {},
    expectPass: false,
  });
  assert.equal(result.report.final_status, "fail");
  assert.equal(result.report.preflight_command_envelope_status, blockedStatus);
  assert.equal(result.report.recommendation_status, blockedRecommendation);
  assert.equal(result.report.next_recommended_slice, recheckSlice);
  assert.ok(
    result.report.validation.failure_codes.includes(expectedFailureCode),
    `${expectedFailureCode} missing from runner validation`,
  );
  assert.ok(
    result.envelope.validation.failure_codes.includes(expectedFailureCode),
    `${expectedFailureCode} missing from envelope validation`,
  );
  const input = result.report.optional_inputs.find(
    (candidate) => candidate.source_label === label,
  );
  assert.ok(input, `${label} optional input must be recorded`);
  assert.equal(input.source_used, "optional_report_passed");
  assert.equal(input.fallback_to_committed_fixture, false);
  assert.equal(input.traceability_checked, true);
  assert.equal(input.traceability_status, "mismatched");
  assert.equal(input.traceability_failure_code, expectedFailureCode);
  assert.ok(
    Array.isArray(input.compared_fields) && input.compared_fields.length > 0,
    `${label} compared fields must be recorded`,
  );
}

function buildTraceableOptionalReport(label, mutatePayload) {
  const source = noopReportFixture.source_evidence[sourceEvidenceKeyForLabel(label)];
  assert.ok(source, `${label} source evidence must exist`);
  const payload = cloneJson(source);
  mutatePayload(payload);
  if (label === "dry_run_invocation_harness") {
    return {
      final_status: "pass",
      dry_run_invocation_harness: payload,
    };
  }
  if (label === "disabled_adapter_contract_tests") {
    return {
      ...payload,
      final_status: "pass",
      case_results: [{ case_id: "traceability-placeholder", case_status: "pass" }],
    };
  }
  return {
    final_status: "pass",
    [label]: payload,
  };
}

function sourceEvidenceKeyForLabel(label) {
  return label === "dry_run_invocation_harness"
    ? "disabled_adapter_dry_run_invocation_harness"
    : label;
}

function writeHarmlessStaleOptionalReports() {
  for (const [label, filePath] of Object.entries(optionalReportPaths)) {
    writeJson(filePath, {
      final_status: "fail",
      [label]: { stale_optional_report: true },
      noop_invocation_report: { stale_optional_report: true },
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

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
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

function assertNoImplementationRecommendation(value) {
  assert.ok(
    !String(value.next_recommended_slice).includes("product_write_implementation"),
    "must not recommend product write implementation",
  );
  assert.notEqual(
    value.next_recommended_slice,
    "enabled_adapter_transition",
    "must not recommend enabled adapter",
  );
}

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
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
