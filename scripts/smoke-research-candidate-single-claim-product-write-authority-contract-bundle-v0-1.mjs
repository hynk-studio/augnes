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
  "lib/research-candidate-review/manual-note-single-claim-product-write-authority-contract-bundle.ts";
const sampleFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-authority-contract-bundle.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const harnessSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs";
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
const dryRunHarnessFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.sample.v0.1.json";
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
  "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const bundlePath = path.join(artifactDir, "authority-contract-bundle.json");
const optionalDryRunHarnessReportPath =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1/report.json";
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

const expectedBundleKind =
  "manual_note_single_claim_product_write_authority_contract_bundle";
const expectedBundleVersion =
  "manual_note_single_claim_product_write_authority_contract_bundle.v0.1";
const expectedReadyBundleStatus = "product_write_authority_contracts_defined_only";
const expectedReadyRecommendation =
  "ready_for_single_claim_product_write_disabled_adapter_skeleton";
const expectedNextSlice = "single_claim_product_write_disabled_adapter_skeleton";
const expectedBlockedBundleStatus =
  "blocked_before_product_write_authority_contract_bundle";
const expectedBlockedRecommendation =
  "blocked_before_single_claim_product_write_disabled_adapter_skeleton";
const expectedRecheckSlice = "single_claim_product_write_authority_contract_bundle_recheck";
const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1",
  "authority:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1",
];
const expectedChangedFiles = [
  "docs/00_INDEX_LATEST.md",
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-authority-contract-bundle.sample.v0.1.json",
  "lib/research-candidate-review/manual-note-single-claim-product-write-authority-contract-bundle.ts",
  "package.json",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  "scripts/run-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
];
const authorityContractIds = [
  "explicit_operator_decision_contract",
  "selected_temp_claim_identity_contract",
  "product_claim_schema_contract",
  "product_claim_id_allocation_contract",
  "product_idempotency_storage_contract",
  "product_rollback_storage_contract",
  "product_review_audit_storage_contract",
  "product_write_observability_contract",
  "source_verification_authority_contract",
  "proof_evidence_authority_contract",
  "canonical_perspective_authority_contract",
  "enabled_adapter_transition_contract",
  "product_write_route_contract",
  "product_write_transaction_boundary_contract",
  "product_write_static_boundary_contract",
  "product_write_runtime_boundary_contract",
];
const explicitForbiddenSurfaceKeys = [
  "product_write_authority_granted",
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
const requiredRefusalReasonIds = [
  "missing_authority_contract_bundle",
  "authority_bundle_malformed",
  "upstream_harness_failed",
  "operator_decision_missing",
  "product_schema_missing",
  "product_id_allocation_missing",
  "idempotency_storage_missing",
  "rollback_storage_missing",
  "audit_storage_missing",
  "observability_missing",
  "source_verification_authority_missing",
  "proof_evidence_authority_missing",
  "perspective_canonical_authority_missing",
  "enabled_adapter_transition_requested",
  "product_write_route_requested",
  "ui_write_action_requested",
  "db_path_provided",
  "sql_text_provided",
  "transaction_execution_requested",
  "product_write_requested",
  "product_id_allocation_requested",
  "proof_evidence_write_requested",
  "perspective_canonical_write_requested",
  "source_fetch_requested",
  "provider_openai_call_requested",
  "retrieval_rag_requested",
  "external_handoff_requested",
  "browser_persistence_requested",
  "non_null_product_id_present",
  "upstream_forbidden_surface_true",
  "static_schema_db_sql_change",
  "static_app_router_ui_change",
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
  harnessSmokePath,
  dryRunPlanSmokePath,
  contractTestsSmokePath,
  skeletonSmokePath,
  bridgeDesignSmokePath,
  productWriteGateSmokePath,
  dryRunHarnessFixturePath,
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
const harnessSmoke = readFileSync(harnessSmokePath, "utf8");
const dryRunPlanSmoke = readFileSync(dryRunPlanSmokePath, "utf8");
const contractTestsSmoke = readFileSync(contractTestsSmokePath, "utf8");
const skeletonSmoke = readFileSync(skeletonSmokePath, "utf8");
const bridgeDesignSmoke = readFileSync(bridgeDesignSmokePath, "utf8");
const productWriteGateSmoke = readFileSync(productWriteGateSmokePath, "utf8");
const dryRunHarnessFixture = JSON.parse(
  readFileSync(dryRunHarnessFixturePath, "utf8"),
);
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
assertBundleContract(sampleFixture, "committed sample fixture");
assertExportedHelperMissingHarnessBlocks();
assertExportedHelperBlockedHarnessRecommendationBlocks();
const runnerOutput = runAuthorityRunnerFixtureMode();
const runtimeReport = JSON.parse(readFileSync(reportPath, "utf8"));
const runtimeBundle = JSON.parse(readFileSync(bundlePath, "utf8"));
assertRunnerOutput(runnerOutput);
assertReportContract(runtimeReport);
assertBundleContract(runtimeBundle, "runtime bundle");
assertOptionalFailedHarnessReportBlocks();
assertOptionalFailedPlanReportBlocks();
assertOptionalFailedContractSuiteBlocks();
assertSourceForbiddenSurfaceContaminationBlocks();
assertSourceProductIdContaminationBlocks();
runAuthorityRunnerFixtureMode();
assertMutationValidatorCoverage(runtimeBundle);
assertDocsPackageBrowserAndAdjacentSmokePointers();
assertStaticBoundaryAndNoExpansion(runtimeReport);
assertStaticExternalCallPatternCoverage();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-product-write-authority-contract-bundle-v0-1",
      helper_exists: true,
      committed_fixture_checked: true,
      runner_fixture_mode_checked: true,
      direct_helper_missing_harness_blocks_checked: true,
      direct_helper_blocked_harness_recommendation_blocks_checked: true,
      failed_optional_harness_report_blocks_checked: true,
      failed_optional_plan_report_blocks_checked: true,
      failed_optional_contract_suite_blocks_checked: true,
      source_forbidden_surface_contamination_blocks_checked: true,
      source_product_id_contamination_blocks_checked: true,
      authority_contract_count_checked: runtimeBundle.authority_contracts.length,
      refusal_reason_count_checked: runtimeBundle.authority_refusal_matrix.length,
      static_boundary_changed_files_checked:
        runtimeReport.static_boundary_changed_files_inspected.length,
      static_boundary_package_added_lines_checked:
        runtimeReport.static_boundary_package_added_lines_inspected.length,
      next_slice_checked: runtimeBundle.next_recommended_slice,
      product_write_implementation_not_recommended_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_AUTHORITY_CONTRACT_BUNDLE_VERSION",
    expectedBundleVersion,
    "dryRunTransactionHarness",
    "productWriteGateDesign",
    "buildManualNoteSingleClaimProductWriteAuthorityContractBundle",
    "createManualNoteSingleClaimProductWriteAuthorityContractBundleReport",
    "createManualNoteSingleClaimProductWriteAuthorityContractBundleFingerprint",
    "dry_run_transaction_harness_status_not_ready",
    "product_write_gate_design_recommendation_not_ready",
    expectedReadyRecommendation,
    expectedNextSlice,
    expectedBlockedRecommendation,
    expectedRecheckSlice,
    "authority_contracts",
    "authority_dependency_graph",
    "disabled_product_write_adapter_skeleton_preparation",
    "authority_refusal_matrix",
    "0x811c9dc5",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
  for (const contractId of authorityContractIds) {
    assert.ok(helper.includes(contractId), `helper must define ${contractId}`);
  }
}

function assertExportedHelperMissingHarnessBlocks() {
  const bundle = runExportedHelperHarnessMutation("missing_harness");
  assertBlockedHelperBundle(bundle, [
    "dry_run_transaction_harness_status_not_ready",
    "dry_run_transaction_harness_recommendation_not_ready",
    "dry_run_transaction_harness_next_slice_invalid",
    "dry_run_transaction_harness_trace_missing",
  ]);
}

function assertExportedHelperBlockedHarnessRecommendationBlocks() {
  const bundle = runExportedHelperHarnessMutation("blocked_harness");
  assertBlockedHelperBundle(bundle, [
    "dry_run_transaction_harness_recommendation_not_ready",
  ]);
}

function assertBlockedHelperBundle(bundle, expectedFailureCodes) {
  assert.equal(bundle.authority_contract_bundle_status, expectedBlockedBundleStatus);
  assert.equal(bundle.recommendation_status, expectedBlockedRecommendation);
  assert.equal(bundle.next_recommended_slice, expectedRecheckSlice);
  assert.equal(bundle.validation.passed, false);
  for (const failureCode of expectedFailureCodes) {
    assert.ok(
      bundle.validation.failure_codes.includes(failureCode),
      `blocked helper bundle should include ${failureCode}`,
    );
  }
  for (const key of [
    "product_write_authority_granted_now",
    "product_write_allowed_now",
    "adapter_enabled",
    "transaction_execution_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "route_added",
    "ui_write_action_added",
  ]) {
    assert.equal(bundle[key], false, `${key} must stay false when blocked`);
  }
}

function runExportedHelperHarnessMutation(mutationKind) {
  const script = `
    import { readFileSync } from "node:fs";
    import { buildManualNoteSingleClaimProductWriteAuthorityContractBundle } from "./lib/research-candidate-review/manual-note-single-claim-product-write-authority-contract-bundle.ts";

    const mutationKind = ${JSON.stringify(mutationKind)};
    const dryRunTransactionHarness = JSON.parse(readFileSync(${JSON.stringify(dryRunHarnessFixturePath)}, "utf8"));
    const dryRunTransactionPlan = JSON.parse(readFileSync(${JSON.stringify(dryRunPlanFixturePath)}, "utf8"));
    const contractTestsReport = JSON.parse(readFileSync(${JSON.stringify(contractTestsFixturePath)}, "utf8"));
    const disabledBridgeSkeleton = JSON.parse(readFileSync(${JSON.stringify(skeletonFixturePath)}, "utf8"));
    const tempToProductBridgeDesign = JSON.parse(readFileSync(${JSON.stringify(bridgeDesignFixturePath)}, "utf8"));
    const productWriteGateDesign = JSON.parse(readFileSync(${JSON.stringify(productWriteGateDesignFixturePath)}, "utf8"));
    const mutatedHarness =
      mutationKind === "missing_harness"
        ? null
        : {
            ...dryRunTransactionHarness,
            recommendation_status: "blocked_before_product_write_authority_contract_bundle",
          };
    const bundle = buildManualNoteSingleClaimProductWriteAuthorityContractBundle({
      dryRunTransactionHarness: mutatedHarness,
      dryRunTransactionPlan,
      contractTestsReport,
      disabledBridgeSkeleton,
      tempToProductBridgeDesign,
      productWriteGateDesign,
      staticBoundaryEvidence: {
        static_boundary_base_ref: "committed_allowlist",
        static_boundary_base_mode: "smoke_helper_fixture_delta",
        static_boundary_changed_files_inspected: ${JSON.stringify(expectedChangedFiles)},
        failureCodes: [],
      },
    });
    console.log(JSON.stringify({
      authority_contract_bundle_status: bundle.authority_contract_bundle_status,
      recommendation_status: bundle.recommendation_status,
      next_recommended_slice: bundle.next_recommended_slice,
      validation: bundle.validation,
      product_write_authority_granted_now: bundle.product_write_authority_granted_now,
      product_write_allowed_now: bundle.product_write_allowed_now,
      adapter_enabled: bundle.adapter_enabled,
      transaction_execution_allowed_now: bundle.transaction_execution_allowed_now,
      product_db_write: bundle.product_db_write,
      product_id_allocation: bundle.product_id_allocation,
      db_open: bundle.db_open,
      sql_execution: bundle.sql_execution,
      route_added: bundle.route_added,
      ui_write_action_added: bundle.ui_write_action_added,
    }));
  `;
  return JSON.parse(
    execFileSync(tsxPath, ["-e", script], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
}

function runAuthorityRunnerFixtureMode() {
  return execFileSync("node", [runnerPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_AUTHORITY_CONTRACT_BUNDLE_FIXTURE_MODE:
        "1",
    },
  });
}

function assertRunnerOutput(output) {
  const parsed = JSON.parse(output);
  assert.equal(
    parsed.plan,
    "research-candidate-single-claim-product-write-authority-contract-bundle-v0-1",
  );
  assert.equal(parsed.final_status, "pass");
  assert.equal(parsed.authority_contract_bundle_status, expectedReadyBundleStatus);
  assert.equal(parsed.recommendation_status, expectedReadyRecommendation);
  assert.equal(parsed.next_recommended_slice, expectedNextSlice);
  assert.ok(parsed.static_boundary_changed_files_inspected >= expectedChangedFiles.length);
}

function assertReportContract(report) {
  assert.equal(
    report.report_kind,
    "manual_note_single_claim_product_write_authority_contract_bundle_report",
  );
  assert.equal(report.report_version, expectedBundleVersion);
  assert.equal(report.final_status, "pass");
  assert.equal(report.authority_contract_bundle_status, expectedReadyBundleStatus);
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

function assertBundleContract(bundle, label) {
  assertValidAuthorityBundle(bundle, label);
  assert.equal(bundle.authority_contract_bundle_status, expectedReadyBundleStatus);
  assert.equal(bundle.recommendation_status, expectedReadyRecommendation);
  assert.equal(bundle.next_recommended_slice, expectedNextSlice);
  assert.doesNotMatch(bundle.next_recommended_slice, /product_write_implementation|enabled_adapter|route|ui/i);
  assert.equal(bundle.validation.passed, true);
  assert.deepEqual(bundle.validation.failure_codes, []);
  assertSourceEvidence(bundle.source_evidence);
}

function assertValidAuthorityBundle(bundle, label) {
  assert.equal(bundle.authority_contract_bundle_kind, expectedBundleKind, label);
  assert.equal(bundle.authority_contract_bundle_version, expectedBundleVersion, label);
  assert.match(bundle.authority_contract_bundle_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  for (const key of [
    "product_write_authority_granted_now",
    "product_write_allowed_now",
    "adapter_enabled",
    "transaction_execution_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "route_added",
    "ui_write_action_added",
  ]) {
    assert.equal(bundle[key], false, `${label}: ${key} must be false`);
  }
  assertAuthorityContracts(bundle.authority_contracts, label);
  assertAuthorityGapSummary(bundle.authority_gap_summary);
  assertDependencyGraph(bundle.authority_dependency_graph);
  assertDisabledAdapterPreparation(
    bundle.disabled_product_write_adapter_skeleton_preparation,
  );
  assertRefusalMatrix(bundle.authority_refusal_matrix);
  assertExplicitForbiddenSurfaces(bundle.explicit_forbidden_surfaces);
  assertNoNonNullProductIds(bundle, label);
  assert.equal(bundle.local_copy_packet.local_clipboard_only, true);
  assert.equal(bundle.local_copy_packet.external_handoff_sent, false);
  assert.equal(bundle.local_copy_packet.packet_persisted_to_product_db, false);
  assert.equal(bundle.local_copy_packet.adapter_enabled, false);
  assert.equal(bundle.local_copy_packet.product_write_allowed_now, false);
  assert.equal(bundle.local_copy_packet.product_write_authority_granted_now, false);
}

function assertAuthorityContracts(contracts, label) {
  assert.equal(contracts.length, authorityContractIds.length, label);
  assert.deepEqual(
    contracts.map((contract) => contract.contract_id),
    authorityContractIds,
  );
  for (const contract of contracts) {
    assert.ok(contract.contract_label);
    assert.ok(contract.contract_kind);
    assert.equal(contract.required_for_product_write, true);
    assert.equal(contract.satisfied_now, false);
    assert.equal(contract.authority_granted_now, false);
    assert.equal(contract.implementation_allowed_now, false);
    assert.equal(contract.blocks_product_write_now, true);
    assert.ok(contract.required_before_slice, `${contract.contract_id}.required_before_slice`);
    assert.ok(contract.allowed_next_action, `${contract.contract_id}.allowed_next_action`);
    assert.ok(
      Array.isArray(contract.forbidden_now),
      `${contract.contract_id}.forbidden_now`,
    );
    assert.ok(
      contract.forbidden_now.length > 0,
      `${contract.contract_id}.forbidden_now`,
    );
    for (const field of [
      "required_inputs",
      "required_future_evidence",
      "forbidden_until_satisfied",
      "acceptance_criteria",
      "rejection_criteria",
      "observability_requirements",
      "rollback_requirements",
      "idempotency_requirements",
      "audit_requirements",
    ]) {
      assert.ok(Array.isArray(contract[field]), `${contract.contract_id}.${field}`);
      assert.ok(contract[field].length > 0, `${contract.contract_id}.${field}`);
    }
  }
  assertCoreContractSpecificity(contracts);
}

function assertCoreContractSpecificity(contracts) {
  const byId = new Map(contracts.map((contract) => [contract.contract_id, contract]));
  const requiredPhrases = {
    explicit_operator_decision_contract: [
      "selected temp claim identity",
      "operator decision fingerprint",
      "approve, reject, or defer",
      "raw text redaction policy",
    ],
    product_claim_schema_contract: [
      "allowed product claim fields",
      "nullability",
      "raw manual note text inclusion policy",
      "schema version",
      "product DB target as placeholder only",
    ],
    product_claim_id_allocation_contract: [
      "when product claim IDs are created",
      "not allocated before operator and schema authority",
      "collision and retry behavior",
    ],
    product_idempotency_storage_contract: [
      "lookup-before-write",
      "replay behavior",
      "duplicate suppression",
      "source fingerprint inputs",
    ],
    product_rollback_storage_contract: [
      "rollback record fields",
      "triggering failure cases",
      "partial product write recovery",
    ],
    product_review_audit_storage_contract: [
      "decision fingerprint",
      "source evidence fingerprints",
      "missing or contradictory decision evidence",
    ],
    source_verification_authority_contract: [
      "accepted without fetching new sources",
      "stale, missing, or contradictory source negative cases",
      "source fetch requires separate approval",
    ],
    proof_evidence_authority_contract: [
      "existing proof or evidence",
      "separate review before any proof/evidence write",
      "missing proof or evidence pointers",
    ],
    canonical_perspective_authority_contract: [
      "Perspective or canonical graph writes",
      "separate review for promotion into canonical graph state",
      "conflicting canonical identities",
    ],
    enabled_adapter_transition_contract: [
      "disabled adapter skeleton",
      "exact enablement switch",
      "accidental default enablement",
    ],
    product_write_route_contract: [
      "product write route",
      "operator access policy",
      "App Router or component additions",
    ],
    product_write_observability_contract: [
      "success, refusal, rollback, duplicate, and failure event names",
      "trace correlation",
      "missing metrics or uncorrelated events",
    ],
  };
  for (const [contractId, phrases] of Object.entries(requiredPhrases)) {
    const contract = byId.get(contractId);
    assert.ok(contract, `${contractId} must be present`);
    const text = [
      ...contract.acceptance_criteria,
      ...contract.rejection_criteria,
      ...contract.required_future_evidence,
      ...contract.observability_requirements,
      ...contract.rollback_requirements,
      ...contract.idempotency_requirements,
      ...contract.audit_requirements,
    ].join(" ");
    for (const phrase of phrases) {
      assert.ok(
        text.includes(phrase),
        `${contractId} must include specific phrase: ${phrase}`,
      );
    }
  }
}

function assertAuthorityGapSummary(summary) {
  assert.equal(summary.total_required_contracts, authorityContractIds.length);
  assert.equal(summary.satisfied_now_count, 0);
  assert.equal(summary.authority_granted_now_count, 0);
  assert.equal(summary.implementation_allowed_now_count, 0);
  assert.equal(summary.blocked_contract_count, authorityContractIds.length);
  assert.equal(
    summary.next_bundle_goal,
    "single_claim_product_write_disabled_adapter_plan",
  );
  assert.equal(summary.product_write_allowed_after_this_bundle, false);
}

function assertDependencyGraph(graph) {
  assert.deepEqual(graph.ordered_contract_ids, authorityContractIds);
  assert.deepEqual(graph.blocking_contract_ids, authorityContractIds);
  assert.ok(graph.dependency_edges.length >= authorityContractIds.length - 2);
  const edgeContractIds = new Set();
  for (const edge of graph.dependency_edges) {
    edgeContractIds.add(edge.from_contract_id);
    edgeContractIds.add(edge.to_contract_id);
    assert.equal(edge.dependency_kind, "must_be_reviewed_before");
  }
  for (const contractId of authorityContractIds) {
    assert.ok(
      edgeContractIds.has(contractId) ||
        contractId === "product_write_runtime_boundary_contract",
      `dependency graph should include ${contractId}`,
    );
  }
  for (const requiredText of [
    "operator decision exists",
    "product claim schema exists",
    "product ID allocation exists",
    "idempotency storage exists",
    "rollback storage exists",
    "audit storage exists",
    "observability exists",
    "source verification authority exists",
    "proof/evidence authority exists",
    "Perspective/canonical authority exists",
    "enabled adapter transition is explicitly reviewed",
    "route/UI contract is explicitly reviewed if ever added",
    "runtime DB transaction contract is reviewed",
  ]) {
    assert.ok(graph.product_write_unlock_sequence.includes(requiredText));
  }
}

function assertDisabledAdapterPreparation(preparation) {
  assert.equal(
    preparation.adapter_kind,
    "manual_note_single_claim_product_write_disabled_adapter",
  );
  assert.equal(preparation.adapter_enabled_now, false);
  assert.equal(preparation.adapter_invocation_allowed_now, false);
  assert.equal(preparation.product_write_allowed_now, false);
  assert.equal(preparation.would_accept_candidate_kind, "manual_note_single_claim");
  assert.equal(preparation.would_accept_single_selected_temp_claim_only, true);
  assert.equal(preparation.would_require_authority_contract_bundle, true);
  assert.equal(preparation.would_require_all_contracts_satisfied_later, true);
  for (const inputName of [
    "authority_contract_bundle_fingerprint",
    "dry_run_transaction_harness_fingerprint",
    "selected_temp_claim_identity",
    "product_schema_contract_placeholder",
    "idempotency_contract_placeholder",
    "rollback_contract_placeholder",
    "audit_contract_placeholder",
    "observability_contract_placeholder",
  ]) {
    assert.ok(preparation.next_disabled_adapter_slice_inputs.includes(inputName));
  }
}

function assertRefusalMatrix(matrix) {
  assert.ok(matrix.length >= requiredRefusalReasonIds.length);
  const reasonIds = matrix.map((entry) => entry.reason_id);
  for (const reasonId of requiredRefusalReasonIds) {
    assert.ok(reasonIds.includes(reasonId), `refusal matrix must include ${reasonId}`);
  }
  for (const entry of matrix) {
    assert.equal(entry.requested_now, false);
    assert.equal(entry.refusal_required_now, true);
    assert.equal(entry.blocks_product_write_now, true);
    assert.equal(entry.expected_status, expectedBlockedBundleStatus);
  }
}

function assertSourceEvidence(sourceEvidence) {
  assert.equal(
    sourceEvidence.dry_run_transaction_harness.dry_run_transaction_harness_status,
    "disabled_dry_run_transaction_harness_only",
  );
  assert.equal(
    sourceEvidence.dry_run_transaction_harness.recommendation_status,
    "ready_for_product_write_authority_contract_bundle",
  );
  assert.equal(
    sourceEvidence.dry_run_transaction_harness.next_recommended_slice,
    "single_claim_product_write_authority_contract_bundle",
  );
  assert.ok(sourceEvidence.dry_run_transaction_harness.trace_row_count > 0);
  assert.ok(sourceEvidence.dry_run_transaction_harness.refusal_probe_count >= 25);
  assert.ok(
    sourceEvidence.dry_run_transaction_harness.authority_preview_contract_count >=
      12,
  );
  assert.equal(
    sourceEvidence.dry_run_transaction_plan.dry_run_transaction_plan_status,
    "disabled_dry_run_transaction_plan_only",
  );
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton_contract_tests.final_status,
    "pass",
  );
  assert.ok(sourceEvidence.disabled_bridge_skeleton_contract_tests.total_cases >= 70);
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton_contract_tests.unexpected_passes,
    0,
  );
  assert.equal(
    sourceEvidence.disabled_bridge_skeleton_contract_tests.unexpected_failures,
    0,
  );
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

function assertOptionalFailedHarnessReportBlocks() {
  const result = runAuthorityRunnerWithOptionalReports({
    [optionalDryRunHarnessReportPath]: {
      final_status: "fail",
      dry_run_transaction_harness: cloneJson(dryRunHarnessFixture),
    },
  });
  assert.notEqual(result.exitCode, 0);
  assert.equal(result.report.final_status, "fail");
  assert.equal(result.report.authority_contract_bundle_status, expectedBlockedBundleStatus);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "optional_dry_run_transaction_harness_report_not_passed",
    ),
  );
  assert.equal(
    result.report.optional_inputs.dry_run_transaction_harness
      .fallback_to_committed_fixture,
    false,
  );
}

function assertOptionalFailedPlanReportBlocks() {
  const result = runAuthorityRunnerWithOptionalReports({
    [optionalDryRunPlanReportPath]: {
      final_status: "fail",
      dry_run_transaction_plan: cloneJson(dryRunPlanFixture),
    },
  });
  assert.notEqual(result.exitCode, 0);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "optional_dry_run_transaction_plan_report_not_passed",
    ),
  );
}

function assertOptionalFailedContractSuiteBlocks() {
  const failedContractReport = cloneJson(contractTestsFixture);
  failedContractReport.final_status = "fail";
  const result = runAuthorityRunnerWithOptionalReports({
    [optionalContractTestsReportPath]: failedContractReport,
  });
  assert.notEqual(result.exitCode, 0);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "optional_contract_tests_report_not_passed",
    ),
  );
}

function assertSourceForbiddenSurfaceContaminationBlocks() {
  const contaminatedHarness = cloneJson(dryRunHarnessFixture);
  contaminatedHarness.explicit_forbidden_surfaces.product_db_write = true;
  const result = runAuthorityRunnerWithOptionalReports({
    [optionalDryRunHarnessReportPath]: {
      final_status: "pass",
      dry_run_transaction_harness: contaminatedHarness,
    },
  });
  assert.notEqual(result.exitCode, 0);
  assert.ok(
    result.report.validation.failure_codes.includes(
      "dry_run_transaction_harness_forbidden_surface_product_db_write_not_false",
    ),
  );
}

function assertSourceProductIdContaminationBlocks() {
  const contaminatedHarness = cloneJson(dryRunHarnessFixture);
  contaminatedHarness.envelope_results.rollback.product_claim_id =
    "product-claim:contaminated";
  const result = runAuthorityRunnerWithOptionalReports({
    [optionalDryRunHarnessReportPath]: {
      final_status: "pass",
      dry_run_transaction_harness: contaminatedHarness,
    },
  });
  assert.notEqual(result.exitCode, 0);
  assert.ok(
    result.report.validation.failure_codes.includes("upstream_product_id_present"),
  );
}

function runAuthorityRunnerWithOptionalReports(overrides) {
  const optionalPaths = [
    optionalDryRunHarnessReportPath,
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
      bundle: JSON.parse(readFileSync(bundlePath, "utf8")),
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

function assertMutationValidatorCoverage(bundle) {
  const missingContract = cloneJson(bundle);
  missingContract.authority_contracts.pop();
  assert.throws(
    () => assertValidAuthorityBundle(missingContract, "missing contract mutation"),
    /15 !== 16|authority_contracts|length|deepStrictEqual/,
  );

  const satisfiedContract = cloneJson(bundle);
  satisfiedContract.authority_contracts[0].satisfied_now = true;
  assert.throws(
    () => assertValidAuthorityBundle(satisfiedContract, "satisfied_now mutation"),
    /true !== false|satisfied_now/,
  );

  const implementationAllowed = cloneJson(bundle);
  implementationAllowed.authority_contracts[0].implementation_allowed_now = true;
  assert.throws(
    () =>
      assertValidAuthorityBundle(
        implementationAllowed,
        "implementation_allowed_now mutation",
      ),
    /true !== false|implementation_allowed_now/,
  );

  const missingForbiddenNow = cloneJson(bundle);
  delete missingForbiddenNow.authority_contracts[0].forbidden_now;
  assert.throws(
    () => assertValidAuthorityBundle(missingForbiddenNow, "forbidden_now mutation"),
    /forbidden_now/,
  );

  const missingAllowedNextAction = cloneJson(bundle);
  delete missingAllowedNextAction.authority_contracts[0].allowed_next_action;
  assert.throws(
    () =>
      assertValidAuthorityBundle(
        missingAllowedNextAction,
        "allowed_next_action mutation",
      ),
    /allowed_next_action/,
  );

  for (const [field, value] of [
    ["product_write_allowed_now", true],
    ["adapter_enabled", true],
    ["product_db_write", true],
    ["sql_execution", true],
    ["route_added", true],
    ["ui_write_action_added", true],
  ]) {
    const mutated = cloneJson(bundle);
    mutated[field] = value;
    assert.throws(
      () => assertValidAuthorityBundle(mutated, `${field} mutation`),
      new RegExp(field),
    );
  }
}

function assertDocsPackageBrowserAndAdjacentSmokePointers() {
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
    "Manual note single-claim product write authority contract bundle",
    "Manual note single-claim product write disabled adapter contract tests",
    "Manual note single-claim product write disabled adapter dry-run invocation harness",
    "product-write authority contract bundle only",
    "defines required authority contracts but does not satisfy or grant them",
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
      "single_claim_product_write_authority_contract_bundle_artifact_note",
    ),
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_product_write_authority_contract_bundle_no_browser_route",
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
    harnessSmoke,
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

function assertStaticExternalCallPatternCoverage() {
  const examples = [
    ["fetch", "(\"https://example.com\")"].join(""),
    ["webhook", "()"].join(""),
    ["slack", "()"].join(""),
    ["send", "Email()"].join(""),
    ["new", "OpenAI()"].join(" "),
    ["provider", "Client()"].join(""),
    ["retrieval", "Client()"].join(""),
    ["rag", "Client()"].join(""),
  ];
  for (const example of examples) {
    assert.ok(
      networkOrExternalCallPattern().test(example),
      `static external-call pattern must reject ${example}`,
    );
  }
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
    assert.doesNotMatch(
      text,
      networkOrExternalCallPattern(),
      `${label} must not use network/provider/retrieval/external calls`,
    );
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

function networkOrExternalCallPattern() {
  const probes = [
    "fetch\\s*\\(",
    ["new", "OpenAI"].join("\\s+"),
    ["webhook", "\\s*\\("].join(""),
    ["send", "Email", "\\s*\\("].join(""),
    ["slack", "\\s*\\("].join(""),
    ["provider", "Client"].join(""),
    ["retrieval", "Client"].join(""),
    ["rag", "Client"].join(""),
  ];
  const callProbes = probes.map((probe) =>
    probe.includes("\\(") ? probe : `${probe}\\s*\\(`,
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
      "npm\\s+run\\s+dev",
      ["create", "Server"].join(""),
      "listen\\s*\\(",
    ].join("|")})`,
  );
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
