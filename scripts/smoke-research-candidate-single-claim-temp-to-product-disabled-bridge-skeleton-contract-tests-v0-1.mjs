import assert from "node:assert/strict";
import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests.ts";
const testCasesFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-test-cases.v0.1.json";
const sampleReportPath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests.sample.v0.1.json";
const runnerPath =
  "scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs";
const skeletonSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs";
const bridgeDesignSmokePath =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs";
const productWriteGateSmokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const browserValidatorPath =
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs";
const skeletonFixturePath =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton.sample.v0.1.json";
const artifactDir =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1";
const reportPath = path.join(artifactDir, "report.json");
const contractTestsPath = path.join(artifactDir, "contract-tests.json");
const expectedReportKind =
  "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_report";
const expectedReportVersion =
  "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests.v0.1";
const expectedSuiteStatus =
  "disabled_bridge_skeleton_contract_tests_passed";
const expectedRecommendationStatus =
  "ready_for_disabled_bridge_dry_run_transaction_plan";
const expectedNextSlice =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan";
const minimumCaseCount = 45;
const expectedChangedFiles = [
  "docs/00_INDEX_LATEST.md",
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-test-cases.v0.1.json",
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests.sample.v0.1.json",
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests.ts",
  "package.json",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  "scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
];
const allowedPackageScriptNames = [
  "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1",
  "contracts:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1",
];
const requiredCaseIds = [
  "positive_committed_disabled_skeleton_fixture_passes",
  "positive_runner_fixture_mode_report_passes",
  "positive_helper_built_skeleton_from_committed_bridge_design_passes",
  "positive_optional_upstream_report_pass_ready_nested_design_passes",
  "positive_local_copy_packet_boundary_flags_false",
  "positive_source_bridge_evidence_summary_clean_and_stable",
  "positive_next_recommended_slice_is_contract_tests_not_product_write",
  "negative_source_bridge_recommendation_status_missing",
  "negative_source_bridge_recommendation_status_blocked",
  "negative_source_bridge_recommendation_status_wrong_ready_string",
  "negative_source_bridge_bridge_design_status_missing",
  "negative_source_bridge_bridge_design_status_wrong",
  "negative_source_bridge_next_recommended_slice_missing",
  "negative_source_bridge_next_recommended_slice_wrong",
  "negative_source_bridge_input_missing_selected_temp_claim_record_id",
  "negative_source_bridge_input_missing_source_operation_id",
  "negative_source_bridge_input_missing_source_temp_intent_id",
  "negative_source_bridge_input_missing_temp_idempotency_key",
  "negative_source_bridge_input_missing_gate_design_fingerprint",
  "negative_source_bridge_input_missing_result_contract_evidence_fingerprint",
  "negative_optional_report_fail_ready_nested_must_not_fallback",
  "negative_optional_report_warn_ready_nested_fails",
  "negative_optional_report_final_status_missing",
  "negative_optional_report_malformed",
  "negative_optional_report_missing_temp_to_product_bridge_design",
  "negative_optional_report_present_without_fallback_to_committed_fixture",
  "negative_source_forbidden_product_db_write_true",
  "negative_source_forbidden_product_id_allocation_true",
  "negative_source_forbidden_sql_execution_true",
  "negative_source_forbidden_db_open_true",
  "negative_source_forbidden_schema_or_migration_change_true",
  "negative_source_forbidden_proof_evidence_write_true",
  "negative_source_forbidden_perspective_or_canonical_graph_write_true",
  "negative_source_forbidden_work_item_creation_true",
  "negative_source_forbidden_source_fetch_true",
  "negative_source_forbidden_provider_or_openai_call_true",
  "negative_source_forbidden_retrieval_or_rag_true",
  "negative_source_forbidden_external_handoff_true",
  "negative_source_forbidden_adapter_enabled_true",
  "negative_source_forbidden_route_added_true",
  "negative_source_forbidden_ui_write_action_added_true",
  "negative_source_forbidden_surfaces_missing",
  "negative_source_forbidden_surfaces_empty",
  "negative_source_product_claim_id_present",
  "negative_source_proof_and_evidence_ids_present",
  "negative_source_perspective_and_work_item_ids_present",
  "negative_source_product_idempotency_record_id_present",
  "negative_source_product_rollback_record_id_present",
  "negative_source_product_audit_record_id_present",
  "negative_source_nested_canonical_product_id_anywhere_present",
  "negative_skeleton_bridge_adapter_enabled_true",
  "negative_skeleton_disabled_adapter_boundary_adapter_enabled_true",
  "negative_skeleton_disabled_adapter_boundary_invocation_allowed_true",
  "negative_skeleton_bridge_execution_allowed_now_true",
  "negative_skeleton_product_write_allowed_now_true",
  "negative_skeleton_product_db_write_and_id_allocation_true",
  "negative_skeleton_future_product_claim_id_present",
  "negative_skeleton_future_product_statement_counts_nonzero",
  "negative_skeleton_future_product_db_route_ui_flags_true",
  "negative_skeleton_future_product_execution_status_wrong",
  "negative_skeleton_placeholder_product_record_ids_present",
  "negative_skeleton_placeholder_write_flags_true",
  "positive_static_no_app_api_route_for_contract_tests",
  "positive_static_no_components_ui_for_contract_tests",
  "positive_static_no_schema_migration_db_sql_changes",
  "positive_static_no_dependency_additions",
  "positive_static_no_executable_sql_strings",
  "positive_static_no_forbidden_imports",
  "positive_static_no_network_provider_retrieval_source_external_calls",
  "positive_static_no_browser_persistence_or_app_server_startup",
];
const requiredFailureCodes = [
  "source_bridge_recommendation_status_missing",
  "source_bridge_recommendation_status_not_ready",
  "source_bridge_bridge_design_status_missing",
  "source_bridge_bridge_design_status_invalid",
  "source_bridge_next_recommended_slice_missing",
  "source_bridge_next_recommended_slice_invalid",
  "source_bridge_input_contract_selected_temp_claim_record_id_missing",
  "source_bridge_input_contract_source_operation_id_missing",
  "source_bridge_input_contract_source_temp_intent_id_missing",
  "source_bridge_input_contract_temp_idempotency_key_missing",
  "source_bridge_input_contract_gate_design_fingerprint_missing",
  "source_bridge_input_contract_result_contract_evidence_fingerprint_missing",
  "optional_bridge_design_report_not_passed",
  "optional_bridge_design_report_final_status_missing",
  "optional_bridge_design_report_malformed",
  "optional_bridge_design_missing_temp_to_product_bridge_design",
  "source_bridge_explicit_forbidden_surfaces_missing",
  "source_bridge_explicit_forbidden_surfaces_empty",
  "source_bridge_product_id_present",
  "bridge_adapter_enabled",
  "disabled_adapter_boundary_adapter_enabled",
  "disabled_adapter_boundary_adapter_invocation_allowed_now",
  "bridge_execution_allowed_now",
  "product_write_allowed_now",
  "product_db_write",
  "product_id_allocation",
  "future_product_write_intent_product_claim_id_present",
  "future_product_write_intent_product_write_statement_count_nonzero",
  "future_product_write_intent_sql_statement_count_nonzero",
  "future_product_write_intent_db_opened",
  "future_product_write_intent_route_added",
  "future_product_write_intent_ui_action_added",
  "future_product_write_intent_execution_status_invalid",
  "placeholder_record_mapping_product_idempotency_record_id_present",
  "placeholder_record_mapping_product_rollback_record_id_present",
  "placeholder_record_mapping_product_audit_record_id_present",
  "placeholder_record_mapping_idempotency_write_executed_now",
  "placeholder_record_mapping_rollback_write_executed_now",
  "placeholder_record_mapping_audit_write_executed_now",
];

for (const filePath of [
  helperPath,
  testCasesFixturePath,
  sampleReportPath,
  runnerPath,
  skeletonSmokePath,
  bridgeDesignSmokePath,
  productWriteGateSmokePath,
  docsIndexPath,
  packagePath,
  browserValidatorPath,
  skeletonFixturePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const runner = readFileSync(runnerPath, "utf8");
const smoke = readFileSync(runnerPath.replace("run-", "smoke-"), "utf8");
const testCasesFixture = JSON.parse(readFileSync(testCasesFixturePath, "utf8"));
const sampleReport = JSON.parse(readFileSync(sampleReportPath, "utf8"));
const skeletonFixture = JSON.parse(readFileSync(skeletonFixturePath, "utf8"));
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const docsIndex = readFileSync(docsIndexPath, "utf8").replace(/\s+/g, " ");
const browserValidator = readFileSync(browserValidatorPath, "utf8");
const skeletonSmoke = readFileSync(skeletonSmokePath, "utf8");
const bridgeDesignSmoke = readFileSync(bridgeDesignSmokePath, "utf8");
const productWriteGateSmoke = readFileSync(productWriteGateSmokePath, "utf8");

assertHelperContract();
assertFixtureContract();
assertSampleReportContract(sampleReport, "committed sample report");
const runnerOutput = runContractRunnerFixtureMode();
const runtimeReport = JSON.parse(readFileSync(reportPath, "utf8"));
const contractTestsArtifact = JSON.parse(readFileSync(contractTestsPath, "utf8"));
assertSampleReportContract(runtimeReport, "runtime report");
assertContractTestsArtifact(contractTestsArtifact, runtimeReport);
assertRunnerOutput(runnerOutput);
assertDocsPackageBrowserAndUpstreamSmokePointers();
assertNoRouteUiSchemaDependencyExpansion(runtimeReport);
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1",
      helper_exists: true,
      test_cases_fixture_exists_and_parses: true,
      sample_report_exists_and_parses: true,
      runner_exists: true,
      runner_fixture_mode_checked: true,
      total_cases_checked: runtimeReport.total_cases,
      minimum_case_count_checked: minimumCaseCount,
      failed_optional_report_with_ready_nested_source_covered: true,
      source_forbidden_surface_contamination_covered: true,
      source_product_id_contamination_covered: true,
      skeleton_output_boundary_mutations_covered: true,
      static_repo_boundary_checks_covered: true,
      static_boundary_base_mode_checked:
        runtimeReport.static_boundary_base_mode,
      static_boundary_changed_files_checked:
        runtimeReport.static_boundary_changed_files_inspected.length,
      static_boundary_package_added_lines_checked:
        runtimeReport.static_boundary_package_added_lines_inspected.length,
      no_unexpected_passes_or_failures_checked: true,
      next_slice_checked: expectedNextSlice,
      product_write_not_recommended_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_CONTRACT_TESTS_VERSION",
    expectedReportVersion,
    "buildManualNoteSingleClaimTempToProductDisabledBridgeSkeletonContractTestSuite",
    "runManualNoteSingleClaimTempToProductDisabledBridgeSkeletonContractTestCase",
    "buildManualNoteSingleClaimTempToProductDisabledBridgeSkeletonContractTestReport",
    "createManualNoteSingleClaimTempToProductDisabledBridgeSkeletonContractTestFingerprint",
    "ready_for_disabled_bridge_dry_run_transaction_plan",
    expectedNextSlice,
    "source_bridge_product_id_present",
    "source_bridge_explicit_forbidden_surfaces_empty",
    "disabled_adapter_boundary_adapter_enabled",
    "future_product_write_intent_sql_statement_count_nonzero",
    "0x811c9dc5",
    "0x01000193",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
  assert.ok(
    helper.includes(
      "buildManualNoteSingleClaimTempToProductDisabledBridgeSkeleton",
    ),
    "helper must exercise the disabled bridge skeleton builder contract",
  );
}

function assertFixtureContract() {
  assert.equal(
    testCasesFixture.suite_kind,
    "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests",
  );
  assert.equal(testCasesFixture.suite_version, expectedReportVersion);
  assert.equal(testCasesFixture.expected_total_cases, requiredCaseIds.length);
  assert.equal(testCasesFixture.test_cases.length, requiredCaseIds.length);
  assert.ok(
    testCasesFixture.test_cases.length >= minimumCaseCount,
    "contract fixture must keep broad case coverage",
  );
  const caseIds = new Set(
    testCasesFixture.test_cases.map((testCase) => testCase.case_id),
  );
  for (const caseId of requiredCaseIds) {
    assert.ok(caseIds.has(caseId), `fixture must include ${caseId}`);
  }
  const allExpectedFailureCodes = new Set(
    testCasesFixture.test_cases.flatMap(
      (testCase) => testCase.expected_failure_codes ?? [],
    ),
  );
  for (const code of requiredFailureCodes) {
    assert.ok(allExpectedFailureCodes.has(code), `fixture must cover ${code}`);
  }
  assert.equal(
    findFixtureCase("negative_optional_report_fail_ready_nested_must_not_fallback")
      .target_fixture,
    "optional_bridge_design_report",
  );
  assert.equal(
    findFixtureCase("negative_source_forbidden_product_db_write_true").case_kind,
    "source_forbidden_surface_contamination",
  );
  assert.equal(
    findFixtureCase("negative_source_product_claim_id_present").case_kind,
    "source_product_id_contamination",
  );
  assert.equal(
    findFixtureCase("negative_skeleton_future_product_statement_counts_nonzero")
      .case_kind,
    "skeleton_output_boundary_failure",
  );
  assert.equal(
    findFixtureCase("positive_static_no_executable_sql_strings").case_kind,
    "static_repo_boundary",
  );
  for (const [key, value] of Object.entries(testCasesFixture.tested_boundaries)) {
    assert.equal(value, true, `tested boundary ${key} must be true`);
  }
}

function assertSampleReportContract(report, label) {
  assert.equal(report.report_kind, expectedReportKind, `${label} kind`);
  assert.equal(report.report_version, expectedReportVersion, `${label} version`);
  assert.equal(report.final_status, "pass", `${label} final status`);
  assert.equal(report.contract_suite_status, expectedSuiteStatus);
  assert.equal(report.recommendation_status, expectedRecommendationStatus);
  assert.equal(report.next_recommended_slice, expectedNextSlice);
  assert.ok(!/product_write/i.test(report.next_recommended_slice));
  assert.equal(report.source_skeleton_fingerprint, skeletonFixture.skeleton_fingerprint);
  assert.equal(report.total_cases, requiredCaseIds.length);
  assert.ok(report.total_cases >= minimumCaseCount);
  assert.equal(report.unexpected_passes.length, 0);
  assert.equal(report.unexpected_failures.length, 0);
  assert.equal(report.case_results.length, report.total_cases);
  assert.equal(
    report.expected_negative_cases,
    report.case_results.filter((result) => result.case_status === "expected_failure")
      .length,
  );
  assert.equal(
    report.positive_cases,
    report.case_results.filter(
      (result) =>
        result.expected_status === "pass" && result.case_status === "passed",
    ).length,
  );
  assert.equal(
    findReportCase(
      report,
      "negative_optional_report_fail_ready_nested_must_not_fallback",
    ).case_status,
    "expected_failure",
  );
  assert.equal(
    findReportCase(report, "negative_source_forbidden_product_db_write_true")
      .case_status,
    "expected_failure",
  );
  assert.equal(
    findReportCase(report, "negative_source_product_claim_id_present").case_status,
    "expected_failure",
  );
  assert.equal(
    findReportCase(
      report,
      "negative_skeleton_future_product_statement_counts_nonzero",
    ).case_status,
    "expected_failure",
  );
  assert.equal(
    findReportCase(report, "positive_static_no_executable_sql_strings").case_status,
    "passed",
  );
  assert.equal(report.tested_boundaries.static_repo_boundary_checks, true);
  assert.equal(
    report.tested_boundaries.next_slice_is_disabled_dry_run_transaction_plan,
    true,
  );
  assertStaticBoundaryDeltaMetadata(report, label);
}

function assertContractTestsArtifact(artifact, report) {
  assert.equal(
    artifact.suite_kind,
    "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests",
  );
  assert.equal(artifact.suite_version, expectedReportVersion);
  assert.equal(artifact.suite_fingerprint, report.suite_fingerprint);
  assert.equal(artifact.total_cases, report.total_cases);
  assert.equal(artifact.case_results.length, report.total_cases);
}

function assertRunnerOutput(output) {
  assert.equal(output.final_status, "pass");
  assert.equal(output.total_cases, requiredCaseIds.length);
  assert.equal(output.unexpected_passes, 0);
  assert.equal(output.unexpected_failures, 0);
  assert.equal(output.contract_suite_status, expectedSuiteStatus);
  assert.equal(output.recommendation_status, expectedRecommendationStatus);
  assert.equal(output.next_recommended_slice, expectedNextSlice);
}

function runContractRunnerFixtureMode() {
  return JSON.parse(
    execFileSync("node", [runnerPath], {
      encoding: "utf8",
      env: {
        ...process.env,
        AUGNES_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_CONTRACT_TESTS_FIXTURE_MODE:
          "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
}

function assertDocsPackageBrowserAndUpstreamSmokePointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1"
    ],
    "node scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts[
      "contracts:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1"
    ],
    "node scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  );
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
    "Manual note single-claim temp-to-product disabled bridge skeleton contract tests",
    "Manual note single-claim temp-to-product disabled bridge dry-run transaction plan",
    "Manual note single-claim temp-to-product disabled bridge dry-run transaction harness",
    "contract-test suite for the disabled bridge skeleton",
    "disabled dry-run transaction plan only",
    "disabled dry-run transaction harness only",
    "does not implement product write",
    "does not execute a transaction",
    "does not enable an adapter",
    "does not allocate product IDs",
    "does not open DB",
    "does not execute SQL",
    "adds no route or UI write action",
    "adds no schema/migration/dependency",
    "Product write remains blocked",
    expectedSuiteStatus,
    expectedRecommendationStatus,
    expectedNextSlice,
    "ready_for_disabled_dry_run_transaction_harness",
    "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness",
    "ready_for_product_write_authority_contract_bundle",
    "single_claim_product_write_authority_contract_bundle",
  ]) {
    assert.ok(docsIndex.includes(requiredText), `docs must include ${requiredText}`);
  }
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_artifact_note",
    ),
    "browser validator should include contract test artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_no_browser_route",
    ),
    "browser validator should assert no contract test browser route",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_artifact_note",
    ),
    "browser validator should include dry-run transaction-plan artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan_no_browser_route",
    ),
    "browser validator should assert no dry-run transaction-plan browser route",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_artifact_note",
    ),
    "browser validator should include dry-run transaction-harness artifact note",
  );
  assert.ok(
    browserValidator.includes(
      "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness_no_browser_route",
    ),
    "browser validator should assert no dry-run transaction-harness browser route",
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
  for (const scriptText of [skeletonSmoke, bridgeDesignSmoke, productWriteGateSmoke]) {
    assert.ok(
      scriptText.includes(
        "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1",
      ),
      "upstream smoke should allow the contract smoke package script",
    );
    assert.ok(
      scriptText.includes(
        "contracts:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1",
      ),
      "upstream smoke should allow the contract runner package script",
    );
    assert.ok(
      scriptText.includes(
        "smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
      ),
      "upstream smoke should allow the harness smoke package script",
    );
    assert.ok(
      scriptText.includes(
        "harness:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1",
      ),
      "upstream smoke should allow the harness runner package script",
    );
  }
}

function assertNoRouteUiSchemaDependencyExpansion(report) {
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /single-claim-temp-to-product-disabled-bridge-skeleton-contract|disabled-bridge-skeleton-contract-tests/i.test(
      filePath,
    ),
  );
  assert.deepEqual(routeFiles, [], "no API route may be added for contract tests");

  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-temp-to-product-disabled-bridge-skeleton-contract|disabled-bridge-skeleton-contract-tests/i.test(
      filePath,
    ),
  );
  assert.deepEqual(uiFiles, [], "no UI component may be added for contract tests");

  for (const filePath of report.static_boundary_changed_files_inspected) {
    assert.ok(
      !/(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
        filePath,
      ) && !/^lib\/db(\.ts|\/)/.test(filePath),
      `schema or migration file must not be changed: ${filePath}`,
    );
  }

  for (const line of report.static_boundary_package_added_lines_inspected) {
    assert.ok(
      allowedPackageScriptNames.some((scriptName) =>
        line.includes(`"${scriptName}"`),
      ),
      `package.json must only add contract-test scripts, not dependencies: ${line}`,
    );
  }
}

function assertStaticBoundaryDeltaMetadata(report, label) {
  const boundary = report.static_boundary_result;
  assert.ok(boundary, `${label} must include static boundary result`);
  assert.equal(
    report.static_boundary_base_ref,
    boundary.static_boundary_base_ref,
    `${label} top-level base ref must mirror static result`,
  );
  assert.equal(
    report.static_boundary_base_mode,
    boundary.static_boundary_base_mode,
    `${label} top-level base mode must mirror static result`,
  );
  assert.deepEqual(
    report.static_boundary_changed_files_inspected,
    boundary.changed_files_inspected,
    `${label} top-level changed files must mirror static result`,
  );
  assert.deepEqual(
    report.static_boundary_package_added_lines_inspected,
    boundary.package_added_lines_inspected,
    `${label} top-level package additions must mirror static result`,
  );
  assert.equal(
    report.static_boundary_used_fallback_allowlist,
    boundary.used_fallback_allowlist,
    `${label} top-level fallback flag must mirror static result`,
  );
  assert.notEqual(
    report.static_boundary_base_mode,
    "worktree_diff",
    `${label} must not use clean-worktree-only static boundary mode`,
  );
  assert.ok(
    typeof report.static_boundary_base_ref === "string" &&
      report.static_boundary_base_ref.length > 0,
    `${label} must record static boundary base ref`,
  );
  assert.equal(
    typeof report.static_boundary_used_fallback_allowlist,
    "boolean",
    `${label} must record fallback allowlist mode`,
  );
  if (!report.static_boundary_used_fallback_allowlist) {
    assert.ok(
      typeof report.static_boundary_base_commit === "string" &&
        report.static_boundary_base_commit.length >= 7,
      `${label} must record base commit when using git delta mode`,
    );
  }
  assert.ok(
    report.static_boundary_changed_files_inspected.length > 0,
    `${label} inspected changed-file set must be non-empty`,
  );
  for (const filePath of expectedChangedFiles) {
    assert.ok(
      report.static_boundary_changed_files_inspected.includes(filePath),
      `${label} inspected delta must include ${filePath}`,
    );
  }
  for (const filePath of report.static_boundary_changed_files_inspected) {
    assert.ok(
      !/(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
        filePath,
      ) && !/^lib\/db(\.ts|\/)/.test(filePath),
      `${label} inspected delta must not include schema/migration/db/sql path: ${filePath}`,
    );
  }
  assert.ok(
    report.static_boundary_package_added_lines_inspected.length > 0,
    `${label} must record inspected package additions`,
  );
  assert.equal(
    report.static_boundary_package_added_lines_inspected.length,
    allowedPackageScriptNames.length,
    `${label} must inspect only the two allowed package additions`,
  );
  for (const scriptName of allowedPackageScriptNames) {
    assert.ok(
      report.static_boundary_package_added_lines_inspected.some((line) =>
        line.includes(`"${scriptName}"`),
      ),
      `${label} package additions must include ${scriptName}`,
    );
  }
  for (const line of report.static_boundary_package_added_lines_inspected) {
    assert.ok(
      allowedPackageScriptNames.some((scriptName) =>
        line.includes(`"${scriptName}"`),
      ),
      `${label} package addition is outside allowlist: ${line}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  for (const [label, text] of [
    ["helper", helper],
    ["runner", runner],
    ["smoke", smoke],
  ]) {
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not call fetch`);
    assert.doesNotMatch(
      text,
      /\bopenDatabase\s*\(/,
      `${label} must not call openDatabase`,
    );
    assert.doesNotMatch(
      text,
      browserPersistencePattern(),
      `${label} must not use browser persistence`,
    );
    assert.doesNotMatch(
      text,
      /from\s+["'][^"']*(lib\/db|better-sqlite3|sqlite3|app\/|openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i,
      `${label} must not import DB/provider/retrieval/source/proof/evidence/work/Perspective modules`,
    );
    assert.doesNotMatch(
      text,
      appServerStartupPattern(),
      `${label} must not start the app server`,
    );
    assert.doesNotMatch(
      text,
      executableSqlPattern(),
      `${label} must not include executable SQL statements`,
    );
  }
}

function findFixtureCase(caseId) {
  const testCase = testCasesFixture.test_cases.find(
    (candidate) => candidate.case_id === caseId,
  );
  assert.ok(testCase, `fixture must include ${caseId}`);
  return testCase;
}

function findReportCase(report, caseId) {
  const testCase = report.case_results.find(
    (candidate) => candidate.case_id === caseId,
  );
  assert.ok(testCase, `report must include ${caseId}`);
  return testCase;
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const output = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current)) {
        stack.push(path.join(current, entry));
      }
      continue;
    }
    output.push(current);
  }
  return output;
}

function readCommand(command) {
  return execSync(command, { encoding: "utf8" });
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
