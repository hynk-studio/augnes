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
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan.ts";
const sampleFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const contractTestsSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs";
const skeletonSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs";
const bridgeDesignSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs";
const productWriteGateSmokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs";
const contractTestsFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests.sample.v0.1.json";
const skeletonFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton.sample.v0.1.json";
const bridgeDesignFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-bridge-design.sample.v0.1.json";
const productWriteGateDesignFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-gate-design.sample.v0.1.json";
const artifactDir =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const planPath = path.join(artifactDir, "dry-run-transaction-plan.json");
const optionalContractTestsReportPath =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1/report.json";
const optionalSkeletonReportPath =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1/report.json";
const optionalBridgeDesignReportPath =
  "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json";
const optionalProductWriteGateDesignReportPath =
  "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json";
const tsxPath = "apps/augnes_apps/node_modules/.bin/tsx";

const expectedPlanKind =
  "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan";
const expectedPlanVersion =
  "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan.v0.1";
const expectedReadyPlanStatus = "disabled_dry_run_transaction_plan_only";
const expectedReadyRecommendation =
  "ready_for_disabled_dry_run_transaction_harness";
const expectedNextSlice =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness";
const expectedBlockedPlanStatus =
  "blocked_before_disabled_dry_run_transaction_plan";
const expectedBlockedRecommendation =
  "blocked_before_disabled_dry_run_transaction_harness";
const expectedRecheckSlice =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_recheck";
const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1",
  "plan:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1",
];
const expectedChangedFiles = [
  "docs/00_INDEX_LATEST.md",
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan.sample.v0.1.json",
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan.ts",
  "package.json",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  "scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
];
const requiredStepGroups = [
  "preflight_source_evidence",
  "operator_decision",
  "selected_claim_identity",
  "product_schema_review",
  "product_claim_id_allocation",
  "idempotency_lookup",
  "transaction_begin_boundary",
  "product_claim_insert_boundary",
  "product_idempotency_record_boundary",
  "product_rollback_record_boundary",
  "product_review_audit_record_boundary",
  "observability_record_boundary",
  "transaction_commit_boundary",
  "transaction_rollback_boundary",
  "proof_evidence_refusal_boundary",
  "perspective_canonical_refusal_boundary",
  "work_item_refusal_boundary",
  "provider_retrieval_source_fetch_refusal_boundary",
  "external_handoff_refusal_boundary",
];
const requiredRefusalReasonIds = [
  "upstream_contract_suite_failed",
  "upstream_skeleton_blocked",
  "source_bridge_design_blocked",
  "source_forbidden_surface_true",
  "non_null_source_product_id",
  "adapter_enabled_true",
  "bridge_execution_requested",
  "product_write_requested",
  "db_path_provided",
  "sql_text_provided",
  "product_route_requested",
  "ui_write_action_requested",
  "proof_evidence_write_requested",
  "perspective_canonical_graph_write_requested",
  "work_item_creation_requested",
  "source_fetch_requested",
  "provider_openai_call_requested",
  "retrieval_rag_requested",
  "external_handoff_requested",
  "browser_persistence_requested",
  "missing_operator_decision",
  "missing_product_schema_contract",
  "missing_product_id_allocation_contract",
  "missing_idempotency_storage_contract",
  "missing_rollback_storage_contract",
  "missing_audit_storage_contract",
  "missing_observability_contract",
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
  contractTestsSmokePath,
  skeletonSmokePath,
  bridgeDesignSmokePath,
  productWriteGateSmokePath,
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
const smoke = readFileSync(new URL(import.meta.url), "utf8");
const sampleFixture = JSON.parse(readFileSync(sampleFixturePath, "utf8"));
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const browserValidator = readFileSync(browserValidatorPath, "utf8");
const contractTestsSmoke = readFileSync(contractTestsSmokePath, "utf8");
const skeletonSmoke = readFileSync(skeletonSmokePath, "utf8");
const bridgeDesignSmoke = readFileSync(bridgeDesignSmokePath, "utf8");
const productWriteGateSmoke = readFileSync(productWriteGateSmokePath, "utf8");
const contractTestsFixture = JSON.parse(
  readFileSync(contractTestsFixturePath, "utf8"),
);
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
assertPlanContract(sampleFixture, "committed sample fixture");
assertExportedHelperMissingProductGateBlocks();
assertExportedHelperBlockedProductGateRecommendationBlocks();
const runnerOutput = runPlanRunnerFixtureMode();
const runtimeReport = JSON.parse(readFileSync(reportPath, "utf8"));
const runtimePlan = JSON.parse(readFileSync(planPath, "utf8"));
assertRunnerOutput(runnerOutput);
assertReportContract(runtimeReport);
assertPlanContract(runtimePlan, "runtime plan");
assertOptionalFailedContractSuiteBlocks();
assertOptionalFailedSkeletonReportBlocks();
assertOptionalBlockedProductGateReportBlocks();
assertSourceForbiddenSurfaceContaminationBlocks();
assertSourceProductIdContaminationBlocks();
runPlanRunnerFixtureMode();
assertDocsPackageBrowserAndAdjacentSmokePointers();
assertNoRouteUiSchemaDependencyExpansion(runtimeReport);
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1",
      helper_exists: true,
      committed_fixture_checked: true,
      exported_helper_missing_product_gate_blocks_checked: true,
      exported_helper_blocked_product_gate_recommendation_blocks_checked: true,
      runner_fixture_mode_checked: true,
      contract_suite_total_cases_checked:
        runtimePlan.source_evidence.contract_tests.total_cases,
      failed_optional_contract_suite_blocks_checked: true,
      failed_optional_skeleton_report_blocks_checked: true,
      blocked_optional_product_gate_report_blocks_checked: true,
      source_forbidden_surface_contamination_blocks_checked: true,
      source_product_id_contamination_blocks_checked: true,
      static_ui_app_router_path_detection_checked: true,
      transaction_step_graph_checked:
        runtimePlan.transaction_step_graph.ordered_steps.length,
      refusal_matrix_checked: runtimePlan.refusal_matrix.length,
      static_boundary_base_mode_checked:
        runtimeReport.static_boundary_base_mode,
      static_boundary_changed_files_checked:
        runtimeReport.static_boundary_changed_files_inspected.length,
      static_boundary_package_added_lines_checked:
        runtimeReport.static_boundary_package_added_lines_inspected.length,
      next_slice_checked: runtimePlan.next_recommended_slice,
      product_write_not_recommended_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_PLAN_VERSION",
    expectedPlanVersion,
    "buildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlan",
    "createManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlanReport",
    "createManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlanFingerprint",
    expectedReadyRecommendation,
    expectedNextSlice,
    "blocked_before_disabled_dry_run_transaction_harness",
    "transaction_step_graph",
    "refusal_matrix",
    "dry_run_idempotency_envelope",
    "durable_observability_write",
    "0x811c9dc5",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertExportedHelperMissingProductGateBlocks() {
  const plan = runExportedHelperProductGateMutation("missing_product_gate");
  assertBlockedHelperPlan(plan, [
    "product_write_gate_design_not_ready",
    "product_write_gate_design_status_invalid",
    "product_write_gate_design_recommendation_not_ready",
  ]);
}

function assertExportedHelperBlockedProductGateRecommendationBlocks() {
  const plan = runExportedHelperProductGateMutation("blocked_product_gate");
  assertBlockedHelperPlan(plan, [
    "product_write_gate_design_not_ready",
    "product_write_gate_design_recommendation_not_ready",
  ]);
}

function assertBlockedHelperPlan(plan, expectedFailureCodes) {
  assert.equal(plan.dry_run_transaction_plan_status, expectedBlockedPlanStatus);
  assert.equal(plan.recommendation_status, expectedBlockedRecommendation);
  assert.equal(plan.next_recommended_slice, expectedRecheckSlice);
  assert.equal(plan.validation.passed, false);
  for (const failureCode of expectedFailureCodes) {
    assert.ok(
      plan.validation.failure_codes.includes(failureCode),
      `exported helper blocked plan should include ${failureCode}`,
    );
  }
  assert.equal(plan.product_db_write, false);
  assert.equal(plan.product_id_allocation, false);
  assert.equal(plan.adapter_enabled, false);
  assert.equal(plan.dry_run_execution_allowed_now, false);
  assert.equal(plan.product_write_allowed_now, false);
}

function runExportedHelperProductGateMutation(mutationKind) {
  const script = `
    import { readFileSync } from "node:fs";
    import { buildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlan } from "./lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan.ts";

    const mutationKind = ${JSON.stringify(mutationKind)};
    const contractTestsReport = JSON.parse(readFileSync(${JSON.stringify(contractTestsFixturePath)}, "utf8"));
    const disabledBridgeSkeleton = JSON.parse(readFileSync(${JSON.stringify(skeletonFixturePath)}, "utf8"));
    const tempToProductBridgeDesign = JSON.parse(readFileSync(${JSON.stringify(bridgeDesignFixturePath)}, "utf8"));
    const productWriteGateDesign = JSON.parse(readFileSync(${JSON.stringify(productWriteGateDesignFixturePath)}, "utf8"));
    const mutatedGate =
      mutationKind === "missing_product_gate"
        ? null
        : {
            ...productWriteGateDesign,
            next_stage_recommendation: {
              ...productWriteGateDesign.next_stage_recommendation,
              recommendation_status: "blocked_before_bridge_design",
            },
          };
    const plan = buildManualNoteSingleClaimTempToProductDisabledBridgeDryRunTransactionPlan({
      contractTestsReport,
      disabledBridgeSkeleton,
      tempToProductBridgeDesign,
      productWriteGateDesign: mutatedGate,
    });
    console.log(JSON.stringify({
      dry_run_transaction_plan_status: plan.dry_run_transaction_plan_status,
      recommendation_status: plan.recommendation_status,
      next_recommended_slice: plan.next_recommended_slice,
      validation: plan.validation,
      product_db_write: plan.product_db_write,
      product_id_allocation: plan.product_id_allocation,
      adapter_enabled: plan.adapter_enabled,
      dry_run_execution_allowed_now: plan.dry_run_execution_allowed_now,
      product_write_allowed_now: plan.product_write_allowed_now,
    }));
  `;
  return JSON.parse(
    execFileSync(tsxPath, ["-e", script], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
}

function runPlanRunnerFixtureMode() {
  return execFileSync("node", [runnerPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      AUGNES_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_DRY_RUN_TRANSACTION_PLAN_FIXTURE_MODE:
        "1",
    },
  });
}

function assertRunnerOutput(output) {
  const parsed = JSON.parse(output);
  assert.equal(
    parsed.plan,
    "research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1",
  );
  assert.equal(parsed.final_status, "pass");
  assert.equal(parsed.dry_run_transaction_plan_status, expectedReadyPlanStatus);
  assert.equal(parsed.recommendation_status, expectedReadyRecommendation);
  assert.equal(parsed.next_recommended_slice, expectedNextSlice);
  assert.ok(parsed.static_boundary_changed_files_inspected >= expectedChangedFiles.length);
}

function assertReportContract(report) {
  assert.equal(
    report.report_kind,
    "manual_note_single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_report",
  );
  assert.equal(report.report_version, expectedPlanVersion);
  assert.equal(report.final_status, "pass");
  assert.equal(report.dry_run_transaction_plan_status, expectedReadyPlanStatus);
  assert.equal(report.recommendation_status, expectedReadyRecommendation);
  assert.equal(report.next_recommended_slice, expectedNextSlice);
  assert.equal(report.validation.passed, true);
  assert.deepEqual(report.validation.failure_codes, []);
  assert.ok(report.static_boundary_base_ref);
  assert.ok(report.static_boundary_base_mode);
  assert.notEqual(
    report.static_boundary_base_mode,
    "worktree_only",
    "static boundary must not use worktree-only mode",
  );
  assert.ok(
    report.static_boundary_changed_files_inspected.length >=
      expectedChangedFiles.length,
    "static boundary must inspect a non-empty PR/file delta or allowlist",
  );
  for (const filePath of expectedChangedFiles) {
    assert.ok(
      report.static_boundary_changed_files_inspected.includes(filePath),
      `static boundary changed files must include ${filePath}`,
    );
  }
  assert.deepEqual(
    report.static_boundary_changed_files_inspected.filter((filePath) =>
      /(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
        filePath,
      ),
    ),
    [],
    "static boundary changed files must not include schema/migration/db/sql paths",
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

function assertPlanContract(plan, label) {
  assert.equal(plan.dry_run_transaction_plan_kind, expectedPlanKind, label);
  assert.equal(plan.dry_run_transaction_plan_version, expectedPlanVersion, label);
  assert.match(plan.dry_run_transaction_plan_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(plan.dry_run_transaction_plan_status, expectedReadyPlanStatus);
  assert.equal(plan.recommendation_status, expectedReadyRecommendation);
  assert.equal(plan.next_recommended_slice, expectedNextSlice);
  assert.doesNotMatch(
    plan.next_recommended_slice,
    /product_write/,
    "plan must not recommend product write",
  );
  for (const key of [
    "dry_run_execution_allowed_now",
    "bridge_execution_allowed_now",
    "product_write_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "adapter_enabled",
  ]) {
    assert.equal(plan[key], false, `${label}: ${key} must be false`);
  }
  assert.equal(plan.validation.passed, true);
  assert.deepEqual(plan.validation.failure_codes, []);
  assertContractSourceEvidence(plan.source_evidence);
  assertExplicitForbiddenSurfaces(plan.explicit_forbidden_surfaces);
  assertTransactionStepGraph(plan.transaction_step_graph);
  assertRefusalMatrix(plan.refusal_matrix);
  assertDryRunEnvelopes(plan);
  assertNoNonNullProductIds(plan, label);
  assert.equal(plan.local_copy_packet.local_clipboard_only, true);
  assert.equal(plan.local_copy_packet.external_handoff_sent, false);
  assert.equal(plan.local_copy_packet.packet_persisted_to_product_db, false);
  assert.equal(plan.local_copy_packet.adapter_enabled, false);
  assert.equal(plan.local_copy_packet.product_write_allowed_now, false);
}

function assertContractSourceEvidence(sourceEvidence) {
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
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton.bridge_adapter_enabled,
    false,
  );
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
    sourceEvidence.temp_to_product_bridge_design.recommendation_status,
    "ready_for_disabled_bridge_skeleton",
  );
  assert.equal(
    sourceEvidence.product_write_gate_design.gate_design_status,
    "product_write_gate_design_only",
  );
  assert.equal(sourceEvidence.product_write_gate_design.pass_count, 3);
  assert.equal(sourceEvidence.product_write_gate_design.warn_count, 3);
  assert.equal(sourceEvidence.product_write_gate_design.block_count, 12);
}

function assertExplicitForbiddenSurfaces(surfaces) {
  for (const key of explicitForbiddenSurfaceKeys) {
    assert.equal(surfaces[key], false, `${key} must remain false`);
  }
}

function assertTransactionStepGraph(graph) {
  assert.equal(graph.ordered_steps.length, requiredStepGroups.length);
  assert.equal(graph.ordered_step_count, requiredStepGroups.length);
  assert.deepEqual(
    graph.ordered_steps.map((step) => step.step_group),
    requiredStepGroups,
  );
  for (const step of graph.ordered_steps) {
    assert.equal(step.execution_allowed_now, false);
    assert.equal(step.writes_product_db_now, false);
    assert.equal(step.sql_statement_count_now, 0);
    assert.ok(step.required_future_contract);
    assert.ok(step.blocked_until);
    assert.ok(Array.isArray(step.depends_on_step_ids));
    assert.ok(step.rollback_scope);
    assert.ok(step.idempotency_scope);
    assert.ok(step.audit_scope);
  }
}

function assertRefusalMatrix(matrix) {
  const ids = matrix.map((entry) => entry.reason_id);
  for (const reasonId of requiredRefusalReasonIds) {
    assert.ok(ids.includes(reasonId), `refusal matrix must include ${reasonId}`);
  }
  for (const entry of matrix) {
    assert.equal(entry.requested_now, false);
    assert.equal(entry.refusal_required_now, true);
    assert.equal(entry.blocks_harness_until_contract, true);
  }
}

function assertDryRunEnvelopes(plan) {
  assert.equal(
    plan.dry_run_idempotency_envelope.product_idempotency_record_id,
    null,
  );
  assert.equal(plan.dry_run_idempotency_envelope.lookup_executed_now, false);
  assert.equal(plan.dry_run_idempotency_envelope.write_executed_now, false);
  assert.equal(
    plan.dry_run_rollback_envelope.product_rollback_record_id,
    null,
  );
  assert.equal(plan.dry_run_rollback_envelope.rollback_write_executed_now, false);
  assert.equal(
    plan.dry_run_rollback_envelope.rollback_execution_allowed_now,
    false,
  );
  assert.equal(plan.dry_run_audit_envelope.product_audit_record_id, null);
  assert.equal(plan.dry_run_audit_envelope.audit_write_executed_now, false);
  assert.equal(
    plan.dry_run_observability_envelope.product_observability_record_id,
    null,
  );
  assert.equal(
    plan.dry_run_observability_envelope.observability_write_executed_now,
    false,
  );
}

function assertOptionalFailedContractSuiteBlocks() {
  const failedContractReport = {
    ...contractTestsFixture,
    final_status: "fail",
    contract_suite_status: "disabled_bridge_skeleton_contract_tests_passed",
    recommendation_status: "ready_for_disabled_bridge_dry_run_transaction_plan",
    next_recommended_slice:
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan",
  };
  const result = runWithTemporaryOptionalReports({
    [optionalContractTestsReportPath]: failedContractReport,
  });
  assert.equal(result.exitCode, 1);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  assert.equal(report.final_status, "fail");
  assert.equal(report.dry_run_transaction_plan_status, expectedBlockedPlanStatus);
  assert.equal(report.recommendation_status, expectedBlockedRecommendation);
  assert.equal(report.next_recommended_slice, expectedRecheckSlice);
  assert.ok(
    report.validation.failure_codes.includes(
      "optional_contract_tests_report_not_passed",
    ),
  );
  assert.equal(
    report.optional_inputs.contract_tests.fallback_to_committed_fixture,
    false,
  );
}

function assertOptionalFailedSkeletonReportBlocks() {
  const failedSkeletonReport = {
    report_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_report",
    report_version:
      "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton.v0.1",
    final_status: "fail",
    disabled_bridge_skeleton: skeletonFixture,
  };
  const result = runWithTemporaryOptionalReports({
    [optionalSkeletonReportPath]: failedSkeletonReport,
  });
  assert.equal(result.exitCode, 1);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  assert.equal(report.final_status, "fail");
  assert.ok(
    report.validation.failure_codes.includes(
      "optional_disabled_bridge_skeleton_report_not_passed",
    ),
  );
  assert.equal(
    report.optional_inputs.disabled_bridge_skeleton.fallback_to_committed_fixture,
    false,
  );
}

function assertOptionalBlockedProductGateReportBlocks() {
  const blockedGateDesign = JSON.parse(
    JSON.stringify(productWriteGateDesignFixture),
  );
  blockedGateDesign.next_stage_recommendation.recommendation_status =
    "blocked_before_bridge_design";
  const result = runWithTemporaryOptionalReports({
    [optionalProductWriteGateDesignReportPath]: {
      report_kind:
        "manual_note_single_claim_product_write_gate_design_report",
      report_version: "manual_note_single_claim_product_write_gate_design.v0.1",
      final_status: "pass",
      product_write_gate_design: blockedGateDesign,
    },
  });
  assert.equal(result.exitCode, 1);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  assert.equal(report.final_status, "fail");
  assert.equal(report.dry_run_transaction_plan_status, expectedBlockedPlanStatus);
  assert.ok(
    report.validation.failure_codes.includes("product_write_gate_design_not_ready"),
  );
  assert.ok(
    report.validation.failure_codes.includes(
      "product_write_gate_design_recommendation_not_ready",
    ),
  );
  assert.equal(
    report.optional_inputs.product_write_gate_design.fallback_to_committed_fixture,
    false,
  );
}

function assertSourceForbiddenSurfaceContaminationBlocks() {
  const contaminatedBridgeDesign = JSON.parse(JSON.stringify(bridgeDesignFixture));
  contaminatedBridgeDesign.explicit_forbidden_surfaces.product_db_write = true;
  const result = runWithTemporaryOptionalReports({
    [optionalBridgeDesignReportPath]: {
      report_kind:
        "manual_note_single_claim_temp_to_product_bridge_design_report",
      report_version: "manual_note_single_claim_temp_to_product_bridge_design.v0.1",
      final_status: "pass",
      temp_to_product_bridge_design: contaminatedBridgeDesign,
    },
  });
  assert.equal(result.exitCode, 1);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  assert.equal(report.final_status, "fail");
  assert.ok(
    report.validation.failure_codes.includes(
      "source_bridge_forbidden_surface_product_db_write_not_false",
    ),
  );
}

function assertSourceProductIdContaminationBlocks() {
  const contaminatedBridgeDesign = JSON.parse(JSON.stringify(bridgeDesignFixture));
  contaminatedBridgeDesign.future_product_claim_draft.product_claim_id =
    "product-claim:bad";
  const result = runWithTemporaryOptionalReports({
    [optionalBridgeDesignReportPath]: {
      report_kind:
        "manual_note_single_claim_temp_to_product_bridge_design_report",
      report_version: "manual_note_single_claim_temp_to_product_bridge_design.v0.1",
      final_status: "pass",
      temp_to_product_bridge_design: contaminatedBridgeDesign,
    },
  });
  assert.equal(result.exitCode, 1);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  assert.equal(report.final_status, "fail");
  assert.ok(report.validation.failure_codes.includes("source_bridge_product_id_present"));
}

function runWithTemporaryOptionalReports(reportByPath) {
  const optionalPaths = [
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
    for (const filePath of optionalPaths) {
      rmSync(filePath, { force: true });
    }
    for (const [filePath, value] of Object.entries(reportByPath)) {
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
    }
    try {
      execFileSync("node", [runnerPath], { encoding: "utf8" });
      return { exitCode: 0 };
    } catch (error) {
      return { exitCode: error.status ?? 1 };
    }
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
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "plan:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  );
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
  for (const requiredText of [
    "Manual note single-claim temp-to-product disabled bridge dry-run transaction plan",
    "Manual note single-claim temp-to-product disabled bridge dry-run transaction harness",
    "disabled dry-run transaction plan only",
    "disabled dry-run transaction harness only",
    "does not implement product write",
    "does not execute a transaction",
    "does not execute a DB transaction",
    "does not enable an adapter",
    "does not allocate product IDs",
    "does not open DB",
    "does not execute SQL",
    "no route",
    "no UI write action",
    "no schema/migration/dependency",
    "Product write remains blocked",
    "ready_for_disabled_dry_run_transaction_harness",
    "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness",
    "ready_for_product_write_authority_contract_bundle",
    "single_claim_product_write_authority_contract_bundle",
    "not product write",
  ]) {
    assert.ok(docsIndex.includes(requiredText), `docs must include ${requiredText}`);
  }
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_artifact_note",
    ),
    "browser validator should include dry-run transaction plan artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_no_browser_route",
    ),
    "browser validator should assert no dry-run transaction plan browser route",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_artifact_note",
    ),
    "browser validator should include dry-run transaction harness artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_no_browser_route",
    ),
    "browser validator should assert no dry-run transaction harness browser route",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_disabled_adapter_dry_run_invocation_harness_artifact_note",
    ),
    "browser validator should include disabled adapter dry-run invocation harness artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_disabled_adapter_dry_run_invocation_harness_no_browser_route",
    ),
    "browser validator should assert no disabled adapter dry-run invocation harness browser route",
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
  for (const smokeText of [
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
    for (const scriptName of [
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
      "harness:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
    ]) {
      assert.ok(
        smokeText.includes(scriptName),
        `adjacent smoke should allow ${scriptName}`,
      );
    }
  }
}

function assertNoRouteUiSchemaDependencyExpansion(report) {
  assert.equal(isUiFilePath("app/foo/page.tsx"), true);
  assert.equal(isUiFilePath("app/layout.jsx"), true);
  assert.equal(isUiFilePath("components/Foo.tsx"), true);
  assert.equal(isUiFilePath("lib/research-candidate-review/foo.ts"), false);
  assert.deepEqual(
    ["app/foo/page.tsx", "app/layout.jsx", "components/Foo.tsx"].filter(
      isUiFilePath,
    ),
    ["app/foo/page.tsx", "app/layout.jsx", "components/Foo.tsx"],
    "static UI matcher must reject App Router and component UI paths",
  );
  assert.deepEqual(
    report.static_boundary_changed_files_inspected.filter((filePath) =>
      /^app\/api\//.test(filePath),
    ),
    [],
    "no API route may be added for dry-run transaction plan",
  );
  assert.deepEqual(
    report.static_boundary_changed_files_inspected.filter((filePath) =>
      isUiFilePath(filePath),
    ),
    [],
    "no UI file may be added for dry-run transaction plan",
  );
  assert.deepEqual(
    report.static_boundary_changed_files_inspected.filter((filePath) =>
      /(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
        filePath,
      ),
    ),
    [],
    "no schema/migration/db/sql file may be changed",
  );
}

function isUiFilePath(filePath) {
  return /^components\//.test(filePath) || /^app\/.*\.(tsx|jsx)$/.test(filePath);
}

function assertForbiddenPatternsAbsent() {
  const browserPersistencePattern = new RegExp(
    `\\b(${[
      ["local", "Storage"].join(""),
      ["session", "Storage"].join(""),
      ["indexed", "DB"].join(""),
      ["document", "cookie"].join("\\."),
    ].join("|")})\\b`,
  );
  const appServerStartupPattern = new RegExp(
    `\\b(${[
      ["next", "dev"].join("\\s+"),
      "npm\\s+run\\s+dev",
      ["create", "Server"].join(""),
      "listen\\s*\\(",
    ].join("|")})`,
  );
  const executableStatementPattern = new RegExp(
    `\\b(${[
      ["CREATE", "TABLE"],
      ["INSERT", "INTO"],
      ["UPDATE", "\\w+"],
      ["DELETE", "FROM"],
      ["ALTER", "TABLE"],
      ["DROP", "TABLE"],
    ]
      .map((parts) => parts.join("\\s+"))
      .join("|")})\\b`,
    "i",
  );
  for (const [label, text] of [
    ["helper", helper],
    ["runner", runner],
    ["smoke", smoke],
  ]) {
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not call fetch`);
    assert.doesNotMatch(text, /\bopenDatabase\s*\(/, `${label} must not call openDatabase`);
    assert.doesNotMatch(
      text,
      browserPersistencePattern,
      `${label} must not use browser persistence`,
    );
    assert.doesNotMatch(
      text,
      /from\s+["'][^"']*(lib\/db|better-sqlite3|sqlite3|app\/|openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i,
      `${label} must not import DB/provider/retrieval/source/proof/evidence/work/Perspective modules`,
    );
    assert.doesNotMatch(
      text,
      appServerStartupPattern,
      `${label} must not start the app server`,
    );
    assert.doesNotMatch(
      text,
      executableStatementPattern,
      `${label} must not include executable SQL statements`,
    );
  }
}

function assertNoNonNullProductIds(value, label, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoNonNullProductIds(item, label, [...pathParts, String(index)]),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = [...pathParts, key];
    if (productIdKeys.has(key)) {
      assert.equal(
        nestedValue,
        null,
        `${label} must keep ${nextPath.join(".")} null`,
      );
      continue;
    }
    assertNoNonNullProductIds(nestedValue, label, nextPath);
  }
}
