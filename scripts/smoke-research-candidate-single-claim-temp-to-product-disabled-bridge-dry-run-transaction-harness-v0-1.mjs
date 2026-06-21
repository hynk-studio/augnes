import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.ts";
const sampleFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const dryRunPlanSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs";
const contractTestsSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs";
const skeletonSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs";
const bridgeDesignSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs";
const productWriteGateSmokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs";
const dryRunPlanFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan.sample.v0.1.json";
const contractTestsFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests.sample.v0.1.json";
const skeletonFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton.sample.v0.1.json";
const bridgeDesignFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-bridge-design.sample.v0.1.json";
const productWriteGateDesignFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-gate-design.sample.v0.1.json";
const artifactDir =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const harnessPath = path.join(artifactDir, "dry-run-transaction-harness.json");
const optionalDryRunPlanReportPath =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1/report.json";
const optionalContractTestsReportPath =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1/report.json";
const optionalSkeletonReportPath =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1/report.json";
const optionalBridgeDesignReportPath =
  "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json";
const optionalProductWriteGateDesignReportPath =
  "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json";
const tsxPath = "apps/augnes_apps/node_modules/.bin/tsx";

const expectedHarnessKind =
  "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness";
const expectedHarnessVersion =
  "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness.v0.1";
const expectedReadyHarnessStatus = "disabled_dry_run_transaction_harness_only";
const expectedReadyRecommendation =
  "ready_for_product_write_authority_contract_bundle";
const expectedNextSlice = "single_claim_product_write_authority_contract_bundle";
const expectedBlockedHarnessStatus =
  "blocked_before_disabled_dry_run_transaction_harness";
const expectedBlockedRecommendation =
  "blocked_before_product_write_authority_contract_bundle";
const expectedRecheckSlice =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_recheck";
const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
  "harness:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
];
const expectedChangedFiles = [
  "docs/00_INDEX_LATEST.md",
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.sample.v0.1.json",
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.ts",
  "package.json",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  "scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
];
const explicitForbiddenSurfaceKeys = [
  "product_db_write",
  "product_id_allocation",
  "product_route",
  "product_write_adapter_enabled",
  "sql_execution",
  "db_open",
  "schema_or_migration_change",
  "proof_evidence_write",
  "perspective_or_canonical_graph_write",
  "work_item_creation",
  "source_fetch",
  "provider_or_openai_call",
  "retrieval_or_rag",
  "external_handoff",
  "browser_persistence",
  "ui_write_action",
  "transaction_execution",
  "transaction_commit",
  "transaction_rollback_execution",
  "durable_idempotency_write",
  "durable_rollback_write",
  "durable_audit_write",
  "durable_observability_write",
];
const requiredProbeIds = [
  "upstream_plan_final_status_failed",
  "dry_run_plan_recommendation_blocked",
  "dry_run_plan_missing_transaction_step_graph",
  "transaction_step_execution_allowed_now_true",
  "transaction_step_writes_product_db_now_true",
  "transaction_step_sql_statement_count_positive",
  "refusal_matrix_missing_product_write_refusal",
  "refusal_matrix_missing_db_path_refusal",
  "refusal_matrix_missing_sql_text_refusal",
  "refusal_matrix_missing_route_ui_refusal",
  "idempotency_envelope_write_flag_true",
  "rollback_envelope_write_flag_true",
  "audit_envelope_write_flag_true",
  "observability_envelope_write_flag_true",
  "forbidden_surface_product_db_write_true",
  "forbidden_surface_product_id_allocation_true",
  "forbidden_surface_sql_execution_true",
  "forbidden_surface_db_open_true",
  "forbidden_surface_product_route_true",
  "forbidden_surface_ui_write_action_true",
  "forbidden_surface_adapter_enabled_true",
  "forbidden_surface_proof_evidence_write_true",
  "forbidden_surface_perspective_graph_write_true",
  "forbidden_surface_source_fetch_true",
  "forbidden_surface_provider_call_true",
  "forbidden_surface_retrieval_rag_true",
  "forbidden_surface_external_handoff_true",
  "forbidden_surface_browser_persistence_true",
  "product_claim_id_non_null_anywhere",
  "proof_evidence_perspective_work_id_non_null_anywhere",
  "failed_optional_live_plan_report_nested_ready",
  "malformed_optional_live_plan_report",
  "static_boundary_empty_delta",
  "static_boundary_package_addition_outside_allowlist",
  "static_boundary_schema_db_sql_changed_file",
  "static_boundary_app_router_ui_file",
];
const authorityContractIds = [
  "explicit_operator_decision_contract",
  "product_claim_schema_contract",
  "product_claim_id_allocation_contract",
  "product_idempotency_storage_contract",
  "product_rollback_storage_contract",
  "product_review_audit_storage_contract",
  "source_verification_authority_contract",
  "proof_evidence_authority_contract",
  "canonical_perspective_authority_contract",
  "enabled_adapter_transition_contract",
  "product_write_route_contract",
  "product_write_observability_contract",
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
]);

for (const filePath of [
  helperPath,
  sampleFixturePath,
  runnerPath,
  docsIndexPath,
  packagePath,
  browserValidatorPath,
  dryRunPlanSmokePath,
  contractTestsSmokePath,
  skeletonSmokePath,
  bridgeDesignSmokePath,
  productWriteGateSmokePath,
  dryRunPlanFixturePath,
  contractTestsFixturePath,
  skeletonFixturePath,
  bridgeDesignFixturePath,
  productWriteGateDesignFixturePath,
  tsxPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const runner = readFileSync(runnerPath, "utf8");
const sampleFixture = JSON.parse(readFileSync(sampleFixturePath, "utf8"));
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const browserValidator = readFileSync(browserValidatorPath, "utf8");
const dryRunPlanSmoke = readFileSync(dryRunPlanSmokePath, "utf8");
const contractTestsSmoke = readFileSync(contractTestsSmokePath, "utf8");
const skeletonSmoke = readFileSync(skeletonSmokePath, "utf8");
const bridgeDesignSmoke = readFileSync(bridgeDesignSmokePath, "utf8");
const productWriteGateSmoke = readFileSync(productWriteGateSmokePath, "utf8");
const dryRunPlanFixture = JSON.parse(readFileSync(dryRunPlanFixturePath, "utf8"));
const contractTestsFixture = JSON.parse(readFileSync(contractTestsFixturePath, "utf8"));
const skeletonFixture = JSON.parse(readFileSync(skeletonFixturePath, "utf8"));
const bridgeDesignFixture = JSON.parse(readFileSync(bridgeDesignFixturePath, "utf8"));
const productWriteGateDesignFixture = JSON.parse(
  readFileSync(productWriteGateDesignFixturePath, "utf8"),
);
const noopReportSmokeScript =
  "smoke:research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1";
const noopReportRunnerScript =
  "report:research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1";
assert.equal(
  packageJson.scripts[noopReportSmokeScript],
  "node scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
);
assert.equal(
  packageJson.scripts[noopReportRunnerScript],
  "node scripts/run-research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1.mjs",
);
assert.ok(
  browserValidator.includes(
    "single_claim_product_write_disabled_adapter_noop_invocation_report_artifact_note",
  ),
);
assert.ok(
  browserValidator.includes(
    "single_claim_product_write_disabled_adapter_noop_invocation_report_no_browser_route",
  ),
);

assertHelperContract();
assertHarnessContract(sampleFixture, "committed sample fixture");
assertExportedHelperMissingPlanBlocks();
assertExportedHelperBlockedPlanRecommendationBlocks();
const runnerOutput = runHarnessRunnerFixtureMode();
const runtimeReport = JSON.parse(readFileSync(reportPath, "utf8"));
const runtimeHarness = JSON.parse(readFileSync(harnessPath, "utf8"));
assertRunnerOutput(runnerOutput);
assertReportContract(runtimeReport);
assertHarnessContract(runtimeHarness, "runtime harness");
const fixtureModeDeterminism = assertFixtureModeStableAcrossOptionalReportPresence();
assertOptionalFailedPlanReportBlocks();
assertOptionalMalformedPlanReportBlocks();
assertOptionalFailedContractSuiteBlocks();
assertSourceForbiddenSurfaceContaminationBlocks();
assertSourceProductIdContaminationBlocks();
runHarnessRunnerFixtureMode();
assertDocsPackageBrowserAndAdjacentSmokePointers();
assertStaticBoundaryAndNoExpansion(runtimeReport);
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
      helper_exists: true,
      committed_fixture_checked: true,
      runner_fixture_mode_checked: true,
      fixture_mode_optional_report_presence_deterministic_checked: true,
      fixture_mode_absent_fingerprint_checked:
        fixtureModeDeterminism.absentFingerprint,
      fixture_mode_present_fingerprint_checked:
        fixtureModeDeterminism.presentFingerprint,
      direct_helper_missing_plan_blocks_checked: true,
      direct_helper_blocked_plan_recommendation_blocks_checked: true,
      failed_optional_plan_report_blocks_checked: true,
      malformed_optional_plan_report_blocks_checked: true,
      failed_optional_contract_suite_blocks_checked: true,
      source_forbidden_surface_contamination_blocks_checked: true,
      source_product_id_contamination_blocks_checked: true,
      trace_rows_checked: runtimeHarness.dry_run_transaction_trace.trace_row_count,
      refusal_probe_count_checked: runtimeHarness.refusal_probe_matrix.length,
      static_boundary_changed_files_checked:
        runtimeReport.static_boundary_changed_files_inspected.length,
      static_boundary_package_added_lines_checked:
        runtimeReport.static_boundary_package_added_lines_inspected.length,
      next_slice_checked: runtimeHarness.next_recommended_slice,
      product_write_implementation_not_recommended_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_HARNESS_VERSION",
    expectedHarnessVersion,
    "dryRunTransactionPlan",
    "buildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionHarness",
    "createManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionHarnessReport",
    "createManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionHarnessFingerprint",
    "dry_run_transaction_plan_status_not_ready",
    "dry_run_transaction_plan_recommendation_not_ready",
    expectedReadyRecommendation,
    expectedNextSlice,
    expectedBlockedRecommendation,
    expectedRecheckSlice,
    "dry_run_transaction_trace",
    "refusal_probe_matrix",
    "product_write_authority_contract_bundle_preview",
    "0x811c9dc5",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertExportedHelperMissingPlanBlocks() {
  const harness = runExportedHelperPlanMutation("missing_plan");
  assertBlockedHelperHarness(harness, [
    "dry_run_transaction_plan_status_not_ready",
    "dry_run_transaction_plan_recommendation_not_ready",
    "dry_run_transaction_plan_next_slice_invalid",
    "dry_run_transaction_plan_step_graph_missing",
  ]);
}

function assertExportedHelperBlockedPlanRecommendationBlocks() {
  const harness = runExportedHelperPlanMutation("blocked_plan");
  assertBlockedHelperHarness(harness, [
    "dry_run_transaction_plan_recommendation_not_ready",
  ]);
}

function assertBlockedHelperHarness(harness, expectedFailureCodes) {
  assert.equal(harness.dry_run_transaction_harness_status, expectedBlockedHarnessStatus);
  assert.equal(harness.recommendation_status, expectedBlockedRecommendation);
  assert.equal(harness.next_recommended_slice, expectedRecheckSlice);
  assert.equal(harness.validation.passed, false);
  for (const failureCode of expectedFailureCodes) {
    assert.ok(
      harness.validation.failure_codes.includes(failureCode),
      `blocked helper harness should include ${failureCode}`,
    );
  }
  for (const key of [
    "dry_run_execution_allowed_now",
    "transaction_execution_allowed_now",
    "bridge_execution_allowed_now",
    "product_write_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "adapter_enabled",
    "sql_execution",
    "db_open",
  ]) {
    assert.equal(harness[key], false, `${key} must stay false when blocked`);
  }
}

function runExportedHelperPlanMutation(mutationKind) {
  const script = `
    import { readFileSync } from "node:fs";
    import { buildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionHarness } from "./lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.ts";

    const mutationKind = ${JSON.stringify(mutationKind)};
    const dryRunTransactionPlan = JSON.parse(readFileSync(${JSON.stringify(dryRunPlanFixturePath)}, "utf8"));
    const contractTestsReport = JSON.parse(readFileSync(${JSON.stringify(contractTestsFixturePath)}, "utf8"));
    const disabledBridgeSkeleton = JSON.parse(readFileSync(${JSON.stringify(skeletonFixturePath)}, "utf8"));
    const tempToProductBridgeDesign = JSON.parse(readFileSync(${JSON.stringify(bridgeDesignFixturePath)}, "utf8"));
    const productWriteGateDesign = JSON.parse(readFileSync(${JSON.stringify(productWriteGateDesignFixturePath)}, "utf8"));
    const mutatedPlan =
      mutationKind === "missing_plan"
        ? null
        : {
            ...dryRunTransactionPlan,
            recommendation_status: "blocked_before_disabled_dry_run_transaction_harness",
          };
    const harness = buildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionHarness({
      dryRunTransactionPlan: mutatedPlan,
      contractTestsReport,
      disabledBridgeSkeleton,
      tempToProductBridgeDesign,
      productWriteGateDesign,
    });
    console.log(JSON.stringify({
      dry_run_transaction_harness_status: harness.dry_run_transaction_harness_status,
      recommendation_status: harness.recommendation_status,
      next_recommended_slice: harness.next_recommended_slice,
      validation: harness.validation,
      dry_run_execution_allowed_now: harness.dry_run_execution_allowed_now,
      transaction_execution_allowed_now: harness.transaction_execution_allowed_now,
      bridge_execution_allowed_now: harness.bridge_execution_allowed_now,
      product_write_allowed_now: harness.product_write_allowed_now,
      product_db_write: harness.product_db_write,
      product_id_allocation: harness.product_id_allocation,
      adapter_enabled: harness.adapter_enabled,
      sql_execution: harness.sql_execution,
      db_open: harness.db_open,
    }));
  `;
  return JSON.parse(
    execFileSync(tsxPath, ["-e", script], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
}

function runHarnessRunnerFixtureMode() {
  return execFileSync("node", [runnerPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      AUGNES_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_HARNESS_FIXTURE_MODE:
        "1",
    },
  });
}

function assertRunnerOutput(output) {
  const parsed = JSON.parse(output);
  assert.equal(
    parsed.plan,
    "research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
  );
  assert.equal(parsed.final_status, "pass");
  assert.equal(parsed.dry_run_transaction_harness_status, expectedReadyHarnessStatus);
  assert.equal(parsed.recommendation_status, expectedReadyRecommendation);
  assert.equal(parsed.next_recommended_slice, expectedNextSlice);
  assert.ok(parsed.static_boundary_changed_files_inspected >= expectedChangedFiles.length);
}

function assertReportContract(report) {
  assert.equal(
    report.report_kind,
    "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_report",
  );
  assert.equal(report.report_version, expectedHarnessVersion);
  assert.equal(report.final_status, "pass");
  assert.equal(report.dry_run_transaction_harness_status, expectedReadyHarnessStatus);
  assert.equal(report.recommendation_status, expectedReadyRecommendation);
  assert.equal(report.next_recommended_slice, expectedNextSlice);
  assert.equal(report.validation.passed, true);
  assert.deepEqual(report.validation.failure_codes, []);
  assert.ok(report.static_boundary_base_ref);
  assert.ok(report.static_boundary_base_mode);
  assert.notEqual(report.static_boundary_base_mode, "worktree_only");
  assert.ok(report.static_boundary_changed_files_inspected.length >= expectedChangedFiles.length);
  for (const filePath of expectedChangedFiles) {
    assert.ok(
      report.static_boundary_changed_files_inspected.includes(filePath),
      `static boundary changed files must include ${filePath}`,
    );
  }
  assert.deepEqual(
    report.static_boundary_changed_files_inspected.filter(isSchemaDbSqlPath),
    [],
  );
  assert.equal(
    report.static_boundary_package_added_lines_inspected.length,
    allowedPackageScriptNames.length,
  );
  for (const scriptName of allowedPackageScriptNames) {
    assert.ok(
      report.static_boundary_package_added_lines_inspected.some((line) =>
        line.includes(`"${scriptName}"`),
      ),
      `package additions must include ${scriptName}`,
    );
  }
  for (const line of report.static_boundary_package_added_lines_inspected) {
    assert.ok(
      allowedPackageScriptNames.some((scriptName) =>
        line.includes(`"${scriptName}"`),
      ),
      `package additions must only contain allowed scripts: ${line}`,
    );
  }
  assert.deepEqual(report.static_boundary_result.failureCodes, []);
}

function assertHarnessContract(harness, label) {
  assert.equal(harness.dry_run_transaction_harness_kind, expectedHarnessKind, label);
  assert.equal(harness.dry_run_transaction_harness_version, expectedHarnessVersion, label);
  assert.match(harness.dry_run_transaction_harness_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(harness.dry_run_transaction_harness_status, expectedReadyHarnessStatus);
  assert.equal(harness.recommendation_status, expectedReadyRecommendation);
  assert.equal(harness.next_recommended_slice, expectedNextSlice);
  assert.doesNotMatch(harness.next_recommended_slice, /implementation|enabled_adapter|route|ui/i);
  for (const key of [
    "dry_run_execution_allowed_now",
    "transaction_execution_allowed_now",
    "bridge_execution_allowed_now",
    "product_write_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "adapter_enabled",
    "sql_execution",
    "db_open",
  ]) {
    assert.equal(harness[key], false, `${label}: ${key} must be false`);
  }
  assert.equal(harness.validation.passed, true);
  assert.deepEqual(harness.validation.failure_codes, []);
  assertSourceEvidence(harness.source_evidence);
  assertExplicitForbiddenSurfaces(harness.explicit_forbidden_surfaces);
  assertTrace(harness.dry_run_transaction_trace, label);
  assertRefusalProbeMatrix(harness.refusal_probe_matrix);
  assertEnvelopeResults(harness.envelope_results);
  assertAuthorityPreview(harness.product_write_authority_contract_bundle_preview);
  assertNoNonNullProductIds(harness, label);
  assert.equal(harness.local_copy_packet.local_clipboard_only, true);
  assert.equal(harness.local_copy_packet.external_handoff_sent, false);
  assert.equal(harness.local_copy_packet.packet_persisted_to_product_db, false);
  assert.equal(harness.local_copy_packet.adapter_enabled, false);
  assert.equal(harness.local_copy_packet.product_write_allowed_now, false);
}

function assertSourceEvidence(sourceEvidence) {
  assert.equal(
    sourceEvidence.dry_run_transaction_plan.dry_run_transaction_plan_status,
    "disabled_dry_run_transaction_plan_only",
  );
  assert.equal(
    sourceEvidence.dry_run_transaction_plan.recommendation_status,
    "ready_for_disabled_dry_run_transaction_harness",
  );
  assert.equal(
    sourceEvidence.dry_run_transaction_plan.next_recommended_slice,
    "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness",
  );
  assert.ok(sourceEvidence.dry_run_transaction_plan.transaction_step_count > 0);
  assert.equal(sourceEvidence.contract_tests.final_status, "pass");
  assert.equal(
    sourceEvidence.contract_tests.contract_suite_status,
    "disabled_bridge_skeleton_contract_tests_passed",
  );
  assert.equal(
    sourceEvidence.contract_tests.recommendation_status,
    "ready_for_disabled_bridge_dry_run_transaction_plan",
  );
  assert.equal(
    sourceEvidence.contract_tests.next_recommended_slice,
    "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan",
  );
  assert.ok(sourceEvidence.contract_tests.total_cases >= 70);
  assert.equal(sourceEvidence.contract_tests.unexpected_passes, 0);
  assert.equal(sourceEvidence.contract_tests.unexpected_failures, 0);
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton.disabled_bridge_skeleton_status,
    "single_claim_disabled_bridge_skeleton_only",
  );
  assert.equal(sourceEvidence.disabled_bridge_skeleton.bridge_adapter_enabled, false);
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton.bridge_execution_allowed_now,
    false,
  );
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton.product_write_allowed_now,
    false,
  );
  assert.equal(
    sourceEvidence.temp_to_product_bridge_design.bridge_design_status,
    "single_claim_bridge_design_only",
  );
  assert.equal(
    sourceEvidence.product_write_gate_design.gate_design_status,
    "product_write_gate_design_only",
  );
  assert.equal(
    sourceEvidence.product_write_gate_design.recommendation_status,
    "ready_for_single_claim_bridge_design",
  );
}

function assertTrace(trace, label) {
  assert.ok(trace.trace_row_count > 0, `${label}: trace must be non-empty`);
  assert.equal(trace.trace_rows.length, trace.trace_row_count);
  assert.equal(
    trace.trace_row_count,
    dryRunPlanFixture.transaction_step_graph.ordered_steps.length,
  );
  for (const row of trace.trace_rows) {
    assert.match(row.trace_id, /^disabled_harness_trace_\d{2}$/);
    assert.ok(row.source_step_id);
    assert.ok(row.step_group);
    assert.ok(row.planned_step_label);
    assert.equal(row.observed_action, "not_executed_disabled_harness_only");
    assert.equal(row.simulated_result, "blocked_until_future_authority_contract");
    for (const key of [
      "execution_allowed_now",
      "transaction_executed_now",
      "product_db_write_now",
      "product_ids_created_now",
      "idempotency_write_executed_now",
      "rollback_write_executed_now",
      "audit_write_executed_now",
      "observability_write_executed_now",
    ]) {
      assert.equal(row[key], false, `${label}: trace ${key} must be false`);
    }
    assert.equal(row.sql_statement_count_now, 0);
    assert.ok(row.refusal_reason_if_blocked);
    assert.ok(row.next_required_contract);
  }
}

function assertRefusalProbeMatrix(probes) {
  assert.ok(probes.length >= 25);
  assert.ok(probes.length <= 40);
  const probeIds = probes.map((probe) => probe.probe_id);
  for (const probeId of requiredProbeIds) {
    assert.ok(probeIds.includes(probeId), `probe matrix must include ${probeId}`);
  }
  for (const probe of probes) {
    assert.equal(probe.expected_status, expectedBlockedHarnessStatus);
    assert.equal(probe.actual_status, expectedBlockedHarnessStatus);
    assert.deepEqual(probe.actual_failure_codes, probe.expected_failure_codes);
    assert.equal(probe.probe_status, "pass");
  }
}

function assertEnvelopeResults(envelopes) {
  assert.equal(envelopes.idempotency.lookup_executed_now, false);
  assert.equal(envelopes.idempotency.write_executed_now, false);
  assert.equal(envelopes.idempotency.durable_storage_added_now, false);
  assert.equal(envelopes.idempotency.product_idempotency_record_id, null);
  assert.equal(envelopes.rollback.rollback_write_executed_now, false);
  assert.equal(envelopes.rollback.rollback_execution_allowed_now, false);
  assert.equal(envelopes.rollback.product_claim_id, null);
  assert.equal(envelopes.rollback.product_rollback_record_id, null);
  assert.equal(envelopes.audit.audit_write_executed_now, false);
  assert.equal(envelopes.audit.product_claim_id, null);
  assert.equal(envelopes.audit.product_audit_record_id, null);
  assert.equal(envelopes.observability.observability_write_executed_now, false);
  assert.equal(envelopes.observability.product_claim_id, null);
  assert.equal(envelopes.observability.product_observability_record_id, null);
}

function assertAuthorityPreview(preview) {
  assert.equal(preview.required_contract_count, authorityContractIds.length);
  assert.equal(preview.satisfied_contract_count, 0);
  assert.equal(preview.product_write_implementation_allowed_now, false);
  assert.equal(preview.enabled_adapter_transition_allowed_now, false);
  const contractIds = preview.contracts.map((contract) => contract.contract_id);
  for (const contractId of authorityContractIds) {
    assert.ok(contractIds.includes(contractId), `authority preview must include ${contractId}`);
  }
  for (const contract of preview.contracts) {
    assert.equal(contract.required, true);
    assert.equal(contract.satisfied, false);
    assert.equal(contract.next_required_slice, expectedNextSlice);
  }
}

function assertFixtureModeStableAcrossOptionalReportPresence() {
  const absent = runHarnessRunnerFixtureModeWithOptionalReports({});
  const staleMarker = "stale_optional_should_be_ignored";
  const stalePlan = cloneJson(dryRunPlanFixture);
  stalePlan.recommendation_status = staleMarker;
  const staleContractReport = cloneJson(contractTestsFixture);
  staleContractReport.recommendation_status = staleMarker;
  const staleSkeleton = cloneJson(skeletonFixture);
  staleSkeleton.disabled_bridge_skeleton_status = staleMarker;
  const staleBridgeDesign = cloneJson(bridgeDesignFixture);
  staleBridgeDesign.bridge_design_status = staleMarker;
  const staleGateDesign = cloneJson(productWriteGateDesignFixture);
  staleGateDesign.gate_design_status = staleMarker;
  const present = runHarnessRunnerFixtureModeWithOptionalReports({
    [optionalDryRunPlanReportPath]: {
      final_status: "fail",
      dry_run_transaction_plan: stalePlan,
    },
    [optionalContractTestsReportPath]: {
      ...staleContractReport,
      final_status: "fail",
    },
    [optionalSkeletonReportPath]: {
      final_status: "fail",
      disabled_bridge_skeleton: staleSkeleton,
    },
    [optionalBridgeDesignReportPath]: {
      final_status: "fail",
      temp_to_product_bridge_design: staleBridgeDesign,
    },
    [optionalProductWriteGateDesignReportPath]: {
      final_status: "fail",
      product_write_gate_design: staleGateDesign,
    },
  });
  assert.equal(absent.report.final_status, "pass");
  assert.equal(present.report.final_status, "pass");
  assert.equal(
    absent.harness.dry_run_transaction_harness_fingerprint,
    present.harness.dry_run_transaction_harness_fingerprint,
    "fixture-mode fingerprint must not depend on stale optional report presence",
  );
  assert.deepEqual(
    sourceSelectionsFromHarness(absent.harness),
    sourceSelectionsFromHarness(present.harness),
    "fixture-mode source selections must be stable with or without stale optional reports",
  );
  for (const selection of Object.values(sourceSelectionsFromHarness(present.harness))) {
    assert.equal(selection.source_used, "committed_fixture");
    assert.equal(selection.optional_report_present, false);
    assert.equal(selection.optional_report_ignored_for_fixture_mode, true);
    assert.equal(selection.fallback_to_committed_fixture, true);
  }
  assert.doesNotMatch(
    JSON.stringify(present.harness),
    new RegExp(staleMarker),
    "fixture mode must not consume optional report data into the harness artifact",
  );
  assert.equal(present.report.optional_inputs.fixture_mode, true);
  return {
    absentFingerprint: absent.harness.dry_run_transaction_harness_fingerprint,
    presentFingerprint: present.harness.dry_run_transaction_harness_fingerprint,
  };
}

function sourceSelectionsFromHarness(harness) {
  return Object.fromEntries(
    Object.entries(harness.source_evidence)
      .filter(([, value]) => value && typeof value === "object" && "source_selection" in value)
      .map(([key, value]) => [key, value.source_selection]),
  );
}

function assertOptionalFailedPlanReportBlocks() {
  const mutatedPlan = cloneJson(dryRunPlanFixture);
  const result = runHarnessRunnerWithOptionalReports({
    [optionalDryRunPlanReportPath]: {
      final_status: "fail",
      dry_run_transaction_plan: mutatedPlan,
    },
  });
  assert.notEqual(result.exitCode, 0);
  assert.equal(result.report.final_status, "fail");
  assert.equal(result.report.dry_run_transaction_harness_status, expectedBlockedHarnessStatus);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "optional_dry_run_transaction_plan_report_not_passed",
    ),
  );
  assert.equal(
    result.report.optional_inputs.dry_run_transaction_plan.fallback_to_committed_fixture,
    false,
  );
}

function assertOptionalMalformedPlanReportBlocks() {
  const result = runHarnessRunnerWithOptionalReports({
    [optionalDryRunPlanReportPath]: "{",
  });
  assert.notEqual(result.exitCode, 0);
  assert.equal(result.report.final_status, "fail");
  assert.ok(
    result.report.validation.failure_codes.includes(
      "optional_dry_run_transaction_plan_report_malformed",
    ),
  );
}

function assertOptionalFailedContractSuiteBlocks() {
  const failedContractReport = cloneJson(contractTestsFixture);
  failedContractReport.final_status = "fail";
  const result = runHarnessRunnerWithOptionalReports({
    [optionalContractTestsReportPath]: failedContractReport,
  });
  assert.notEqual(result.exitCode, 0);
  assert.equal(result.report.final_status, "fail");
  assert.ok(
    result.report.validation.failure_codes.includes(
      "optional_contract_tests_report_not_passed",
    ),
  );
  assert.equal(
    result.report.optional_inputs.contract_tests.fallback_to_committed_fixture,
    false,
  );
}

function assertSourceForbiddenSurfaceContaminationBlocks() {
  const contaminatedPlan = cloneJson(dryRunPlanFixture);
  contaminatedPlan.explicit_forbidden_surfaces.product_db_write = true;
  const result = runHarnessRunnerWithOptionalReports({
    [optionalDryRunPlanReportPath]: {
      final_status: "pass",
      dry_run_transaction_plan: contaminatedPlan,
    },
  });
  assert.notEqual(result.exitCode, 0);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "dry_run_transaction_plan_forbidden_surface_product_db_write_not_false",
    ),
  );
}

function assertSourceProductIdContaminationBlocks() {
  const contaminatedPlan = cloneJson(dryRunPlanFixture);
  contaminatedPlan.dry_run_rollback_envelope.product_claim_id =
    "product-claim:contaminated";
  const result = runHarnessRunnerWithOptionalReports({
    [optionalDryRunPlanReportPath]: {
      final_status: "pass",
      dry_run_transaction_plan: contaminatedPlan,
    },
  });
  assert.notEqual(result.exitCode, 0);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "dry_run_transaction_plan_product_id_present",
    ),
  );
}

function runHarnessRunnerWithOptionalReports(overrides) {
  const optionalPaths = [
    optionalDryRunPlanReportPath,
    optionalContractTestsReportPath,
    optionalSkeletonReportPath,
    optionalBridgeDesignReportPath,
    optionalProductWriteGateDesignReportPath,
  ];
  const originals = new Map(
    optionalPaths.map((filePath) => [
      filePath,
      existsSync(filePath) ? readFileSync(filePath, "utf8") : null,
    ]),
  );
  try {
    rmSync(artifactDir, { recursive: true, force: true });
    for (const filePath of optionalPaths) {
      rmSync(filePath, { force: true });
    }
    for (const [filePath, value] of Object.entries(overrides)) {
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(
        filePath,
        typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`,
      );
    }
    let exitCode = 0;
    try {
      execFileSync("node", [runnerPath], { encoding: "utf8" });
    } catch (error) {
      exitCode = error.status ?? 1;
    }
    return {
      exitCode,
      report: JSON.parse(readFileSync(reportPath, "utf8")),
      harness: JSON.parse(readFileSync(harnessPath, "utf8")),
    };
  } finally {
    for (const [filePath, originalText] of originals) {
      if (originalText === null) {
        rmSync(filePath, { force: true });
      } else {
        mkdirSync(path.dirname(filePath), { recursive: true });
        writeFileSync(filePath, originalText);
      }
    }
  }
}

function runHarnessRunnerFixtureModeWithOptionalReports(overrides) {
  const optionalPaths = [
    optionalDryRunPlanReportPath,
    optionalContractTestsReportPath,
    optionalSkeletonReportPath,
    optionalBridgeDesignReportPath,
    optionalProductWriteGateDesignReportPath,
  ];
  const originals = new Map(
    optionalPaths.map((filePath) => [
      filePath,
      existsSync(filePath) ? readFileSync(filePath, "utf8") : null,
    ]),
  );
  try {
    rmSync(artifactDir, { recursive: true, force: true });
    for (const filePath of optionalPaths) {
      rmSync(filePath, { force: true });
    }
    for (const [filePath, value] of Object.entries(overrides)) {
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(
        filePath,
        typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`,
      );
    }
    execFileSync("node", [runnerPath], {
      encoding: "utf8",
      env: {
        ...process.env,
        AUGNES_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_HARNESS_FIXTURE_MODE:
          "1",
      },
    });
    return {
      report: JSON.parse(readFileSync(reportPath, "utf8")),
      harness: JSON.parse(readFileSync(harnessPath, "utf8")),
    };
  } finally {
    for (const [filePath, originalText] of originals) {
      if (originalText === null) {
        rmSync(filePath, { force: true });
      } else {
        mkdirSync(path.dirname(filePath), { recursive: true });
        writeFileSync(filePath, originalText);
      }
    }
  }
}

function assertDocsPackageBrowserAndAdjacentSmokePointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "harness:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "authority:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "adapter:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "contracts:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "harness:research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1.mjs",
  );
  for (const requiredText of [
    "Manual note single-claim temp-to-product disabled bridge dry-run transaction harness",
    "Manual note single-claim product write disabled adapter contract tests",
    "Manual note single-claim product write disabled adapter dry-run invocation harness",
    "disabled dry-run transaction harness only",
    "does not implement product write",
    "does not execute a DB transaction",
    "does not enable an adapter",
    "does not allocate product IDs",
    "does not open DB",
    "does not execute SQL",
    "no route",
    "no UI write action",
    "no schema/migration/dependency",
    "Product write remains blocked",
    expectedReadyRecommendation,
    expectedNextSlice,
    "not product write implementation",
  ]) {
    assert.ok(docsIndex.includes(requiredText), `docs must include ${requiredText}`);
  }
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_artifact_note",
    ),
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_no_browser_route",
    ),
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_disabled_adapter_dry_run_invocation_harness_artifact_note",
    ),
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_disabled_adapter_dry_run_invocation_harness_no_browser_route",
    ),
  );
  for (const smokeText of [
    dryRunPlanSmoke,
    contractTestsSmoke,
    skeletonSmoke,
    bridgeDesignSmoke,
    productWriteGateSmoke,
  ]) {
    for (const scriptName of allowedPackageScriptNames) {
      assert.ok(
        smokeText.includes(scriptName),
        `adjacent smoke should allow ${scriptName}`,
      );
    }
  }
}

function assertStaticBoundaryAndNoExpansion(report) {
  assert.equal(isUiFilePath("app/foo/page.tsx"), true);
  assert.equal(isUiFilePath("app/layout.jsx"), true);
  assert.equal(isUiFilePath("components/Foo.tsx"), true);
  assert.equal(isUiFilePath("lib/research-candidate-review/foo.ts"), false);
  assert.deepEqual(
    report.static_boundary_changed_files_inspected.filter((filePath) =>
      /^app\/api\//.test(filePath),
    ),
    [],
  );
  assert.deepEqual(
    report.static_boundary_changed_files_inspected.filter(isUiFilePath),
    [],
  );
  assert.deepEqual(
    report.static_boundary_changed_files_inspected.filter(isSchemaDbSqlPath),
    [],
  );
  assert.ok(report.static_boundary_base_ref);
  assert.ok(report.static_boundary_base_mode);
  assert.ok(report.static_boundary_changed_files_inspected.length > 0);
  assert.equal(
    report.static_boundary_result.allowed_package_script_names.length,
    allowedPackageScriptNames.length,
  );
}

function assertExplicitForbiddenSurfaces(surfaces) {
  assert.deepEqual(Object.keys(surfaces).sort(), explicitForbiddenSurfaceKeys.toSorted());
  for (const key of explicitForbiddenSurfaceKeys) {
    assert.equal(surfaces[key], false, `${key} must be false`);
  }
}

function assertNoNonNullProductIds(value, label, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoNonNullProductIds(item, label, [...trail, String(index)]),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nestedValue] of Object.entries(value)) {
    if (productIdKeys.has(key)) {
      assert.equal(
        nestedValue,
        null,
        `${label}: ${[...trail, key].join(".")} must be null`,
      );
    } else {
      assertNoNonNullProductIds(nestedValue, label, [...trail, key]);
    }
  }
}

function assertForbiddenPatternsAbsent() {
  for (const [label, text] of [
    ["helper", helper],
    ["runner", runner],
  ]) {
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not call fetch`);
    assert.doesNotMatch(text, /\bopenDatabase\s*\(/, `${label} must not call openDatabase`);
    assert.doesNotMatch(
      text,
      browserPersistencePattern(),
      `${label} must not use browser persistence`,
    );
    assert.doesNotMatch(
      text,
      /from\s+["'][^"']*(lib\/db|better-sqlite3|sqlite3|app\/|openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i,
      `${label} must not import forbidden write/runtime modules`,
    );
    assert.doesNotMatch(
      text,
      executableSqlPattern(),
      `${label} must not contain executable SQL text`,
    );
    assert.doesNotMatch(
      text,
      appServerStartupPattern(),
      `${label} must not start an app server`,
    );
  }
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

function executableSqlPattern() {
  const statements = [
    ["CREATE", "TABLE"],
    ["INSERT", "INTO"],
    ["UPDATE", "\\w+"],
    ["DELETE", "FROM"],
    ["ALTER", "TABLE"],
    ["DROP", "TABLE"],
  ];
  return new RegExp(
    `\\b(${statements.map((parts) => parts.join("\\s+")).join("|")})\\b`,
    "i",
  );
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
      "npm\\s+run\\s+dev",
      ["create", "Server"].join(""),
      "listen\\s*\\(",
    ].join("|")})`,
  );
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
