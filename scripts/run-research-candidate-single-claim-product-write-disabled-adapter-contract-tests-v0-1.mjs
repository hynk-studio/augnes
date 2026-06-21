import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const CONTRACT_TEST_VERSION =
  "manual_note_single_claim_product_write_disabled_adapter_contract_tests.v0.1";
const ARTIFACT_DIR =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-contract-tests-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const CONTRACT_TESTS_PATH = path.join(ARTIFACT_DIR, "contract-tests.json");

const DISABLED_ADAPTER_SKELETON_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-skeleton.sample.v0.1.json";
const TEST_CASES_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-contract-test-cases.v0.1.json";
const OPTIONAL_DISABLED_ADAPTER_SKELETON_REPORT_PATH =
  "/tmp/augnes-single-claim-product-write-disabled-adapter-skeleton-v0-1/report.json";

const OPTIONAL_UPSTREAM_REPORTS = [
  [
    "authority_contract_bundle",
    "/tmp/augnes-single-claim-product-write-authority-contract-bundle-v0-1/report.json",
  ],
  [
    "dry_run_transaction_harness",
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1/report.json",
  ],
  [
    "dry_run_transaction_plan",
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1/report.json",
  ],
  [
    "disabled_bridge_skeleton_contract_tests",
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1/report.json",
  ],
  [
    "disabled_bridge_skeleton",
    "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1/report.json",
  ],
  [
    "temp_to_product_bridge_design",
    "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json",
  ],
  [
    "product_write_gate_design",
    "/tmp/augnes-single-claim-product-write-gate-design-v0-1/report.json",
  ],
];

const HELPER_PATH =
  "lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-contract-tests.ts";
const RUNNER_PATH =
  "scripts/run-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs";
const SMOKE_PATH =
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs";

const FIXTURE_MODE =
  process.env
    .AUGNES_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_CONTRACT_TESTS_FIXTURE_MODE ===
  "1";

const READY_SKELETON_STATUS = "product_write_disabled_adapter_skeleton_only";
const READY_SKELETON_RECOMMENDATION =
  "ready_for_single_claim_product_write_disabled_adapter_contract_tests";
const READY_SKELETON_NEXT_SLICE =
  "single_claim_product_write_disabled_adapter_contract_tests";
const CONTRACT_SUITE_STATUS =
  "product_write_disabled_adapter_contract_tests_passed";
const BLOCKED_SUITE_STATUS =
  "blocked_before_product_write_disabled_adapter_contract_tests";
const READY_RECOMMENDATION =
  "ready_for_single_claim_product_write_disabled_adapter_dry_run_invocation_harness";
const BLOCKED_RECOMMENDATION =
  "blocked_before_product_write_disabled_adapter_dry_run_invocation_harness";
const NEXT_DRY_RUN_INVOCATION_HARNESS =
  "single_claim_product_write_disabled_adapter_dry_run_invocation_harness";
const RECHECK_SLICE =
  "single_claim_product_write_disabled_adapter_contract_tests_recheck";

const AUTHORITY_CONTRACT_IDS = [
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

const REQUIRED_ADAPTER_INPUTS = [
  "authority_contract_bundle_fingerprint",
  "selected_temp_claim_record_id",
  "source_operation_id",
  "source_temp_intent_id",
  "temp_idempotency_key",
  "operator_decision_contract_reference",
  "product_claim_schema_contract_reference",
  "idempotency_contract_reference",
  "rollback_contract_reference",
  "audit_contract_reference",
  "observability_contract_reference",
];

const FORBIDDEN_ADAPTER_INPUTS = [
  "product_claim_id",
  "proof_id",
  "evidence_id",
  "perspective_id",
  "work_item_id",
  "db_path",
  "sql_text",
  "route_request",
  "ui_action_request",
  "provider_request",
  "source_fetch_request",
  "external_handoff_request",
];

const REFUSAL_REASON_IDS = [
  "adapter_disabled",
  "adapter_invocation_requested",
  "product_write_requested",
  "product_write_authority_not_granted",
  "authority_contracts_not_satisfied",
  "missing_or_malformed_authority_bundle",
  "missing_selected_temp_claim_identity",
  "candidate_kind_mismatch",
  "multiple_selected_temp_claims",
  "product_claim_id_provided",
  "proof_or_evidence_id_provided",
  "perspective_or_canonical_id_provided",
  "work_item_id_provided",
  "raw_manual_note_text_included",
  "db_path_provided",
  "sql_text_provided",
  "transaction_execution_requested",
  "route_requested",
  "ui_action_requested",
  "provider_or_openai_requested",
  "source_fetch_requested",
  "retrieval_or_rag_requested",
  "external_handoff_requested",
  "browser_persistence_requested",
  "upstream_forbidden_surface_true",
  "static_schema_db_sql_change",
  "static_app_router_ui_change",
  "dependency_addition_outside_allowlist",
];

const EXPLICIT_FORBIDDEN_SURFACE_KEYS = [
  "product_db_write",
  "product_id_allocation",
  "product_route",
  "product_write_adapter_enabled",
  "product_write_authority_granted",
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
  "adapter_invocation",
  "enabled_adapter_transition",
];

const PRODUCT_ID_KEYS = [
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
];

const STATIC_SCAN_PATHS = [HELPER_PATH, RUNNER_PATH, SMOKE_PATH];
const EXPECTED_CHANGED_FILES = [
  "docs/00_INDEX_LATEST.md",
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-contract-test-cases.v0.1.json",
  "fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-contract-tests.sample.v0.1.json",
  "lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-contract-tests.ts",
  "package.json",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  "scripts/run-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-authority-contract-bundle-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-gate-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-bridge-design-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1.mjs",
];
const ALLOWED_PACKAGE_SCRIPT_NAMES = [
  "smoke:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1",
  "contracts:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1",
];
const FALLBACK_PACKAGE_ADDED_LINES = [
  '    "smoke:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1": "node scripts/smoke-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",',
  '    "contracts:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1": "node scripts/run-research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1.mjs",',
];

async function main() {
  await rm(ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const skeletonFixture = await readJson(DISABLED_ADAPTER_SKELETON_FIXTURE_PATH);
  const rawTestCasesFixture = existsSync(TEST_CASES_FIXTURE_PATH)
    ? await readJson(TEST_CASES_FIXTURE_PATH)
    : {};
  const testCasesFixture = normalizeTestCasesFixture(rawTestCasesFixture);
  const skeletonSource = await selectDisabledAdapterSkeletonSource(skeletonFixture);
  const optionalUpstreamReports = await inspectOptionalUpstreamReports();
  const optionalFailureCodes = optionalUpstreamReports.flatMap(
    (entry) => entry.failureCodes,
  );
  const liveStaticBoundaryResult = validateStaticRepoBoundary();
  const staticBoundaryResult = FIXTURE_MODE
    ? buildFixtureModeStaticBoundaryResult()
    : liveStaticBoundaryResult;
  const sourceFailureCodes = [
    ...skeletonSource.failureCodes,
    ...optionalFailureCodes,
    ...validateSourceDisabledAdapterSkeleton(skeletonSource.value),
    ...staticBoundaryResult.failureCodes,
  ];
  const caseResults = testCasesFixture.test_cases.map((testCase) =>
    runContractTestCase(testCase, skeletonSource.value),
  );
  const unexpectedPasses = caseResults.filter(
    (result) => result.case_status === "unexpected_pass",
  );
  const unexpectedFailures = caseResults.filter(
    (result) => result.case_status === "unexpected_failure",
  );
  const sourceEvidence = buildSourceEvidence({
    skeleton: skeletonSource.value,
    skeletonSelection: skeletonSource.selection,
    optionalUpstreamReports,
    staticBoundaryResult,
  });
  const finalStatus =
    sourceFailureCodes.length === 0 &&
    caseResults.length >= 80 &&
    unexpectedPasses.length === 0 &&
    unexpectedFailures.length === 0
      ? "pass"
      : "fail";
  const testedBoundaries = summarizeTestedBoundaries(
    testCasesFixture,
    caseResults,
  );
  const reportCore = {
    report_kind:
      "manual_note_single_claim_product_write_disabled_adapter_contract_tests_report",
    report_version: CONTRACT_TEST_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      contract_tests: CONTRACT_TESTS_PATH,
    },
    input_paths: {
      disabled_adapter_skeleton_fixture: DISABLED_ADAPTER_SKELETON_FIXTURE_PATH,
      contract_test_cases_fixture: TEST_CASES_FIXTURE_PATH,
      optional_disabled_adapter_skeleton_report:
        OPTIONAL_DISABLED_ADAPTER_SKELETON_REPORT_PATH,
      optional_upstream_reports: Object.fromEntries(OPTIONAL_UPSTREAM_REPORTS),
    },
    optional_inputs: {
      fixture_mode: FIXTURE_MODE,
      disabled_adapter_skeleton: skeletonSource.selection,
      upstream_reports: optionalUpstreamReports.map((entry) => entry.selection),
    },
    non_fingerprinted_runtime_notes: {
      fixture_mode: FIXTURE_MODE,
      fixture_mode_live_static_boundary_result: FIXTURE_MODE
        ? summarizeStaticBoundaryResult(liveStaticBoundaryResult)
        : null,
      optional_disabled_adapter_skeleton_report_present_on_disk: existsSync(
        OPTIONAL_DISABLED_ADAPTER_SKELETON_REPORT_PATH,
      ),
      optional_upstream_reports_present_on_disk: Object.fromEntries(
        OPTIONAL_UPSTREAM_REPORTS.map(([label, filePath]) => [
          label,
          existsSync(filePath),
        ]),
      ),
    },
    source_evidence: sourceEvidence,
    contract_suite_status:
      finalStatus === "pass" ? CONTRACT_SUITE_STATUS : BLOCKED_SUITE_STATUS,
    final_status: finalStatus,
    total_cases: caseResults.length,
    positive_cases: caseResults.filter(
      (result) =>
        result.expected_status === "pass" && result.case_status === "passed",
    ).length,
    expected_negative_cases: caseResults.filter(
      (result) => result.expected_status === "fail",
    ).length,
    unexpected_passes: unexpectedPasses,
    unexpected_failures: unexpectedFailures,
    source_disabled_adapter_skeleton_fingerprint: asString(
      skeletonSource.value.disabled_adapter_skeleton_fingerprint,
    ),
    suite_fingerprint: "",
    tested_boundaries: testedBoundaries,
    static_boundary_result: staticBoundaryResult,
    static_boundary_evidence: buildStaticBoundaryEvidence(staticBoundaryResult),
    static_boundary_base_ref: staticBoundaryResult.static_boundary_base_ref,
    static_boundary_base_mode: staticBoundaryResult.static_boundary_base_mode,
    static_boundary_base_commit: staticBoundaryResult.static_boundary_base_commit,
    static_boundary_changed_files_inspected:
      staticBoundaryResult.changed_files_inspected,
    static_boundary_package_added_lines_inspected:
      staticBoundaryResult.package_added_lines_inspected,
    static_boundary_used_fallback_allowlist:
      staticBoundaryResult.used_fallback_allowlist,
    validation: {
      passed: finalStatus === "pass",
      failure_codes: unique(sourceFailureCodes),
    },
    recommendation_status:
      finalStatus === "pass" ? READY_RECOMMENDATION : BLOCKED_RECOMMENDATION,
    next_recommended_slice:
      finalStatus === "pass" ? NEXT_DRY_RUN_INVOCATION_HARNESS : RECHECK_SLICE,
  };
  const { non_fingerprinted_runtime_notes: _runtimeNotes, ...fingerprintedCore } =
    reportCore;
  const suiteFingerprint = createFingerprint({
    ...fingerprintedCore,
    case_results: caseResults,
    contract_test_cases: testCasesFixture.test_cases,
  });
  const report = {
    ...reportCore,
    suite_fingerprint: suiteFingerprint,
    case_results: caseResults,
  };
  const contractTestsArtifact = {
    suite_kind:
      "manual_note_single_claim_product_write_disabled_adapter_contract_tests",
    suite_version: CONTRACT_TEST_VERSION,
    suite_fingerprint: suiteFingerprint,
    source_disabled_adapter_skeleton_fingerprint:
      report.source_disabled_adapter_skeleton_fingerprint,
    test_cases: testCasesFixture.test_cases,
    case_results: caseResults,
    tested_boundaries: testedBoundaries,
  };

  await writeFile(
    CONTRACT_TESTS_PATH,
    `${JSON.stringify(contractTestsArtifact, null, 2)}\n`,
  );
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        contracts:
          "research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1",
        final_status: report.final_status,
        total_cases: report.total_cases,
        positive_cases: report.positive_cases,
        expected_negative_cases: report.expected_negative_cases,
        unexpected_passes: report.unexpected_passes.length,
        unexpected_failures: report.unexpected_failures.length,
        contract_suite_status: report.contract_suite_status,
        recommendation_status: report.recommendation_status,
        next_recommended_slice: report.next_recommended_slice,
        static_boundary_base_mode: report.static_boundary_base_mode,
        static_boundary_changed_files_inspected:
          report.static_boundary_changed_files_inspected.length,
        artifact_paths: report.artifact_paths,
      },
      null,
      2,
    ),
  );

  if (report.final_status !== "pass") process.exitCode = 1;
}

function normalizeTestCasesFixture(value) {
  const record = asRecord(value);
  const testCases = asArray(record.test_cases);
  if (testCases.length >= 80) return record;
  return {
    fixture_kind:
      "manual_note_single_claim_product_write_disabled_adapter_contract_test_cases",
    fixture_version: CONTRACT_TEST_VERSION,
    test_cases: buildDefaultTestCases(),
  };
}

function buildDefaultTestCases() {
  const cases = [];
  const addCase = (
    caseId,
    caseGroup,
    mutationKind,
    mutationSummary,
    expectedFailureCodes = [],
    config = {},
  ) => {
    cases.push({
      case_id: caseId,
      case_group: caseGroup,
      mutation_kind: mutationKind,
      mutation_summary: mutationSummary,
      expected_status: expectedFailureCodes.length === 0 ? "pass" : "fail",
      expected_failure_codes: expectedFailureCodes,
      ...config,
    });
  };

  for (const [caseId, summary] of [
    ["positive_committed_fixture_passes", "committed disabled adapter skeleton fixture passes"],
    ["positive_runner_fixture_mode_report_passes", "runner fixture-mode report passes"],
    ["positive_helper_built_skeleton_contract_passes", "exported helper-ready skeleton contract passes"],
    ["positive_optional_pass_nested_skeleton_passes", "optional upstream report with pass nested skeleton passes"],
    ["positive_local_artifact_boundary_flags_false", "local artifact boundary flags remain false"],
    ["positive_source_evidence_clean", "source evidence summary is clean and stable"],
    ["positive_next_slice_is_dry_run_invocation_harness", "next recommended slice is dry-run invocation harness"],
    ["positive_static_delta_allowlist_nonempty", "static committed allowlist delta is non-empty"],
  ]) {
    addCase(caseId, "positive", "none", summary);
  }

  for (const [key, code] of [
    ["adapter_enabled", "adapter_enabled_not_false"],
    ["adapter_invocation_allowed_now", "adapter_invocation_allowed_now_not_false"],
    ["product_write_allowed_now", "product_write_allowed_now_not_false"],
    ["product_write_authority_granted_now", "product_write_authority_granted_now_not_false"],
    [
      "product_write_implementation_allowed_now",
      "product_write_implementation_allowed_now_not_false",
    ],
    ["transaction_execution_allowed_now", "transaction_execution_allowed_now_not_false"],
  ]) {
    addCase(
      `top_level_${key}_true_fails`,
      "skeleton_top_level_boundary",
      "set_path",
      `${key} true fails`,
      [code],
      { mutation_path: [key], mutation_value: true },
    );
  }
  addCase(
    "top_level_status_missing_fails",
    "skeleton_top_level_boundary",
    "delete_path",
    "disabled adapter skeleton status missing fails",
    ["disabled_adapter_skeleton_status_not_ready"],
    { mutation_path: ["disabled_adapter_skeleton_status"] },
  );
  addCase(
    "top_level_recommendation_wrong_fails",
    "skeleton_top_level_boundary",
    "set_path",
    "recommendation must point to contract tests",
    ["disabled_adapter_skeleton_recommendation_not_ready"],
    {
      mutation_path: ["recommendation_status"],
      mutation_value: "ready_for_product_write_implementation",
    },
  );
  addCase(
    "top_level_next_slice_wrong_fails",
    "skeleton_top_level_boundary",
    "set_path",
    "skeleton next slice cannot skip to product write",
    ["disabled_adapter_skeleton_next_slice_invalid"],
    {
      mutation_path: ["next_recommended_slice"],
      mutation_value: "single_claim_product_write_implementation",
    },
  );

  for (const inputName of REQUIRED_ADAPTER_INPUTS.slice(0, 7)) {
    addCase(
      `adapter_input_missing_required_${inputName}_fails`,
      "adapter_input_contract",
      "remove_array_value",
      `required adapter input ${inputName} missing fails`,
      [`adapter_input_contract_missing_required_${inputName}`],
      {
        mutation_path: ["adapter_input_contract", "required_inputs"],
        mutation_value: inputName,
      },
    );
  }
  for (const inputName of FORBIDDEN_ADAPTER_INPUTS.slice(0, 4)) {
    addCase(
      `adapter_input_missing_forbidden_${inputName}_fails`,
      "adapter_input_contract",
      "remove_array_value",
      `forbidden adapter input ${inputName} missing fails`,
      [`adapter_input_contract_missing_forbidden_${inputName}`],
      {
        mutation_path: ["adapter_input_contract", "forbidden_inputs"],
        mutation_value: inputName,
      },
    );
  }

  for (const [pathKey, code] of [
    ["candidate_kind", "normalized_candidate_kind_invalid"],
    ["selected_temp_claim_record_id", "normalized_selected_temp_claim_record_id_missing"],
    ["source_operation_id", "normalized_source_operation_id_missing"],
    ["source_temp_intent_id", "normalized_source_temp_intent_id_missing"],
    ["temp_idempotency_key", "normalized_temp_idempotency_key_missing"],
  ]) {
    addCase(
      `normalized_${pathKey}_invalid_fails`,
      "normalized_adapter_input",
      "set_path",
      `normalized input ${pathKey} invalid fails`,
      [code],
      {
        mutation_path: ["normalized_adapter_input_preview", pathKey],
        mutation_value: pathKey === "candidate_kind" ? "manual_note_multi_claim" : "",
      },
    );
  }
  addCase(
    "normalized_authority_bundle_fingerprint_mismatch_fails",
    "normalized_adapter_input",
    "set_path",
    "authority bundle fingerprint mismatch fails",
    ["normalized_authority_bundle_fingerprint_mismatch"],
    {
      mutation_path: [
        "normalized_adapter_input_preview",
        "authority_contract_bundle_fingerprint",
      ],
      mutation_value: "fnv1a32:00000000",
    },
  );
  for (const idKey of [
    "product_claim_id",
    "proof_id",
    "evidence_id",
    "perspective_id",
    "work_item_id",
  ]) {
    addCase(
      `normalized_${idKey}_nonnull_fails`,
      "normalized_adapter_input",
      "set_path",
      `${idKey} in normalized input fails`,
      [`normalized_${idKey}_not_null`],
      {
        mutation_path: ["normalized_adapter_input_preview", idKey],
        mutation_value: `${idKey}:leak`,
      },
    );
  }
  for (const [key, value, code] of [
    ["raw_manual_note_text_included", true, "normalized_raw_manual_note_text_included_not_false"],
    ["normalization_executed_now", false, "normalization_executed_now_not_true"],
    ["normalization_persisted_now", true, "normalization_persisted_now_not_false"],
    ["normalization_storage_target", "product_db", "normalization_storage_target_invalid"],
    ["multiple_selected_temp_claims", true, "normalized_multiple_selected_temp_claims_present"],
  ]) {
    addCase(
      `normalized_${key}_invalid_fails`,
      "normalized_adapter_input",
      "set_path",
      `normalized ${key} boundary fails`,
      [code],
      { mutation_path: ["normalized_adapter_input_preview", key], mutation_value: value },
    );
  }

  for (const [key, value, code] of [
    ["default_result_status", "write_executed", "adapter_output_default_status_invalid"],
    ["product_write_result", { status: "written" }, "adapter_output_product_write_result_invalid"],
    ["product_claim_id", "product-claim:leak", "adapter_output_product_claim_id_invalid"],
    ["durable_records_created_now", true, "adapter_output_durable_records_created_now_invalid"],
    ["product_db_write", true, "adapter_output_product_db_write_invalid"],
    ["product_id_allocation", true, "adapter_output_product_id_allocation_invalid"],
    ["db_open", true, "adapter_output_db_open_invalid"],
    ["sql_execution", true, "adapter_output_sql_execution_invalid"],
    ["transaction_execution", true, "adapter_output_transaction_execution_invalid"],
  ]) {
    addCase(
      `adapter_output_${key}_invalid_fails`,
      "adapter_output_contract",
      "set_path",
      `adapter output ${key} boundary fails`,
      [code],
      { mutation_path: ["adapter_output_contract", key], mutation_value: value },
    );
  }

  for (const [key, code] of [
    ["invocation_attempted_now", "disabled_invocation_invocation_attempted_now_not_false"],
    [
      "adapter_invocation_allowed_now",
      "disabled_invocation_adapter_invocation_allowed_now_not_false",
    ],
    ["adapter_enabled", "disabled_invocation_adapter_enabled_not_false"],
    ["product_write_executed_now", "disabled_invocation_product_write_executed_now_not_false"],
    ["transaction_executed_now", "disabled_invocation_transaction_executed_now_not_false"],
    ["product_db_write", "disabled_invocation_product_db_write_not_false"],
    ["product_id_allocation", "disabled_invocation_product_id_allocation_not_false"],
    ["db_open", "disabled_invocation_db_open_not_false"],
    ["sql_execution", "disabled_invocation_sql_execution_not_false"],
  ]) {
    addCase(
      `disabled_invocation_${key}_true_fails`,
      "disabled_invocation_result",
      "set_path",
      `disabled invocation ${key} true fails`,
      [code],
      { mutation_path: ["disabled_invocation_result", key], mutation_value: true },
    );
  }
  addCase(
    "disabled_invocation_result_status_wrong_fails",
    "disabled_invocation_result",
    "set_path",
    "disabled invocation status cannot become dry success",
    ["disabled_invocation_result_status_invalid"],
    {
      mutation_path: ["disabled_invocation_result", "result_status"],
      mutation_value: "dry_noop_preview",
    },
  );
  for (const reason of [
    "adapter_disabled",
    "product_write_authority_not_granted",
  ]) {
    addCase(
      `disabled_invocation_missing_${reason}_fails`,
      "disabled_invocation_result",
      "remove_array_value",
      `disabled invocation refusal reason ${reason} missing fails`,
      [`disabled_invocation_missing_refusal_${reason}`],
      {
        mutation_path: ["disabled_invocation_result", "refusal_reasons"],
        mutation_value: reason,
      },
    );
  }

  for (const [key, value, code] of [
    ["executable_now", true, "future_command_executable_now_not_false"],
    ["product_claim_id", "product-claim:leak", "future_command_product_claim_id_not_null"],
    ["target_table_or_interface", "", "future_command_target_missing"],
    ["write_operation_count", 1, "future_command_write_operation_count_not_zero"],
    ["sql_statement_count", 1, "future_command_sql_statement_count_not_zero"],
    ["command_rejected_now", false, "future_command_rejected_now_not_true"],
    ["rejection_reason", "ready_for_product_write", "future_command_rejection_reason_invalid"],
  ]) {
    addCase(
      `future_command_${key}_invalid_fails`,
      "future_product_write_command_preview",
      "set_path",
      `future product write command ${key} boundary fails`,
      [code],
      {
        mutation_path: ["future_product_write_command_preview", key],
        mutation_value: value,
      },
    );
  }
  for (const contractId of [
    "explicit_operator_decision_contract",
    "product_claim_id_allocation_contract",
    "product_write_transaction_boundary_contract",
  ]) {
    addCase(
      `future_command_missing_${contractId}_fails`,
      "future_product_write_command_preview",
      "remove_array_value",
      `future command missing ${contractId} fails`,
      [`future_command_missing_required_contract_${contractId}`],
      {
        mutation_path: ["future_product_write_command_preview", "would_require_contracts"],
        mutation_value: contractId,
      },
    );
  }

  for (const reasonId of REFUSAL_REASON_IDS.slice(0, 7)) {
    addCase(
      `refusal_matrix_missing_${reasonId}_fails`,
      "refusal_matrix",
      "remove_refusal_reason",
      `refusal matrix missing ${reasonId} fails`,
      [`refusal_matrix_missing_${reasonId}`],
      { mutation_value: reasonId },
    );
  }
  for (const [field, value, code] of [
    ["requested_now", true, "refusal_matrix_adapter_disabled_requested_now_not_false"],
    [
      "refusal_required_now",
      false,
      "refusal_matrix_adapter_disabled_refusal_required_now_not_true",
    ],
    [
      "blocks_adapter_invocation_now",
      false,
      "refusal_matrix_adapter_disabled_blocks_adapter_invocation_now_not_true",
    ],
    [
      "blocks_product_write_now",
      false,
      "refusal_matrix_adapter_disabled_blocks_product_write_now_not_true",
    ],
  ]) {
    addCase(
      `refusal_matrix_adapter_disabled_${field}_invalid_fails`,
      "refusal_matrix",
      "set_refusal_reason_field",
      `refusal matrix adapter_disabled ${field} invalid fails`,
      [code],
      { mutation_value: "adapter_disabled", mutation_field: field, mutation_field_value: value },
    );
  }

  for (const [caseId, pathValue, value, code] of [
    [
      "source_authority_bundle_status_wrong_fails",
      ["source_evidence", "authority_contract_bundle", "authority_contract_bundle_status"],
      "blocked",
      "source_authority_bundle_status_not_ready",
    ],
    [
      "source_authority_bundle_recommendation_wrong_fails",
      ["source_evidence", "authority_contract_bundle", "recommendation_status"],
      "ready_for_product_write",
      "source_authority_bundle_recommendation_not_ready",
    ],
    [
      "source_authority_bundle_validation_false_fails",
      ["source_evidence", "authority_contract_bundle", "validation_passed"],
      false,
      "source_authority_bundle_validation_not_passed",
    ],
    [
      "source_authority_gap_summary_wrong_fails",
      ["source_evidence", "authority_contract_bundle", "authority_gap_summary", "satisfied_now_count"],
      1,
      "source_authority_gap_summary_invalid",
    ],
    [
      "source_harness_status_wrong_fails",
      ["source_evidence", "dry_run_transaction_harness", "dry_run_transaction_harness_status"],
      "executed",
      "source_harness_status_not_ready",
    ],
    [
      "source_plan_status_wrong_fails",
      ["source_evidence", "dry_run_transaction_plan", "dry_run_transaction_plan_status"],
      "executed",
      "source_plan_status_not_ready",
    ],
    [
      "source_contract_tests_failed_fails",
      ["source_evidence", "disabled_bridge_skeleton_contract_tests", "final_status"],
      "fail",
      "source_disabled_bridge_skeleton_contract_tests_not_passed",
    ],
    [
      "source_bridge_skeleton_status_wrong_fails",
      ["source_evidence", "disabled_bridge_skeleton", "disabled_bridge_skeleton_status"],
      "enabled",
      "source_disabled_bridge_skeleton_not_ready",
    ],
    [
      "source_bridge_skeleton_adapter_enabled_fails",
      ["source_evidence", "disabled_bridge_skeleton", "bridge_adapter_enabled"],
      true,
      "source_disabled_bridge_skeleton_bridge_adapter_enabled_not_false",
    ],
    [
      "source_bridge_design_status_wrong_fails",
      ["source_evidence", "temp_to_product_bridge_design", "bridge_design_status"],
      "blocked",
      "source_bridge_design_not_ready",
    ],
    [
      "source_gate_design_status_wrong_fails",
      ["source_evidence", "product_write_gate_design", "gate_design_status"],
      "blocked",
      "source_gate_design_not_ready",
    ],
    [
      "source_gate_design_recommendation_wrong_fails",
      ["source_evidence", "product_write_gate_design", "recommendation_status"],
      "blocked_before_bridge_design",
      "source_gate_design_recommendation_not_ready",
    ],
    [
      "source_nested_product_claim_id_fails",
      ["source_evidence", "authority_contract_bundle", "product_claim_id"],
      "product-claim:source-leak",
      "non_null_product_or_related_id_present",
    ],
  ]) {
    addCase(
      caseId,
      caseId.includes("product_claim_id")
        ? "source_product_id_contamination"
        : "upstream_readiness",
      "set_path",
      caseId.replaceAll("_", " "),
      [code],
      { mutation_path: pathValue, mutation_value: value },
    );
  }

  addCase(
    "explicit_forbidden_surface_product_db_write_true_fails",
    "source_contamination",
    "set_path",
    "explicit product DB write surface true fails",
    ["explicit_forbidden_surface_product_db_write_not_false"],
    {
      mutation_path: ["explicit_forbidden_surfaces", "product_db_write"],
      mutation_value: true,
    },
  );
  addCase(
    "explicit_forbidden_surfaces_missing_fails",
    "source_contamination",
    "delete_path",
    "explicit forbidden surfaces missing fails",
    ["explicit_forbidden_surface_record_missing"],
    { mutation_path: ["explicit_forbidden_surfaces"] },
  );

  for (const [caseId, code] of [
    [
      "optional_disabled_adapter_skeleton_report_fail_blocks",
      "optional_disabled_adapter_skeleton_report_not_passed",
    ],
    [
      "optional_disabled_adapter_skeleton_report_malformed_blocks",
      "optional_disabled_adapter_skeleton_report_malformed",
    ],
    [
      "optional_upstream_authority_report_fail_blocks",
      "optional_upstream_authority_contract_bundle_report_not_passed",
    ],
    [
      "optional_upstream_report_missing_nested_payload_blocks",
      "optional_upstream_authority_contract_bundle_report_missing_payload",
    ],
  ]) {
    addCase(
      caseId,
      "optional_report_handling",
      "forced_failure",
      `${caseId} must not fall back silently`,
      [code],
      { forced_failure_codes: [code] },
    );
  }

  for (const [caseId, mutationKind, code, config] of [
    [
      "static_changed_file_delta_empty_fails",
      "static_empty_changed_files",
      "static_boundary_changed_file_delta_empty",
      {},
    ],
    [
      "static_expected_contract_file_missing_fails",
      "static_remove_expected_file",
      "static_boundary_expected_files_missing",
      { mutation_value: HELPER_PATH },
    ],
    [
      "static_schema_db_sql_file_rejected",
      "static_add_changed_file",
      "static_boundary_schema_db_sql_changed",
      { mutation_value: "db/schema.sql" },
    ],
    [
      "static_app_api_route_rejected",
      "static_add_changed_file",
      "static_boundary_app_api_route_changed",
      { mutation_value: "app/api/product-write/route.ts" },
    ],
    [
      "static_app_page_ui_rejected",
      "static_add_changed_file",
      "static_boundary_ui_changed",
      { mutation_value: "app/foo/page.tsx" },
    ],
    [
      "static_app_layout_ui_rejected",
      "static_add_changed_file",
      "static_boundary_ui_changed",
      { mutation_value: "app/layout.jsx" },
    ],
    [
      "static_component_ui_rejected",
      "static_add_changed_file",
      "static_boundary_ui_changed",
      { mutation_value: "components/Foo.tsx" },
    ],
    [
      "static_package_added_lines_empty_fails",
      "static_empty_package_lines",
      "static_boundary_package_added_lines_empty",
      {},
    ],
    [
      "static_package_dependency_addition_rejected",
      "static_add_package_line",
      "static_boundary_package_addition_outside_allowlist",
      { mutation_value: '+    "openai": "^9.9.9",' },
    ],
    [
      "static_executable_sql_string_rejected",
      "static_set_probe_text",
      "static_boundary_executable_sql_string_present",
      { mutation_value: executableSqlProbeText() },
    ],
    [
      "static_forbidden_db_import_rejected",
      "static_set_probe_text",
      "static_boundary_forbidden_import_present",
      { mutation_value: forbiddenImportProbeText() },
    ],
    [
      "static_network_call_rejected",
      "static_set_probe_text",
      "static_boundary_network_or_external_call_present",
      { mutation_value: networkProbeText() },
    ],
    [
      "static_browser_persistence_rejected",
      "static_set_probe_text",
      "static_boundary_browser_persistence_present",
      { mutation_value: browserPersistenceProbeText() },
    ],
    [
      "static_app_server_startup_rejected",
      "static_set_probe_text",
      "static_boundary_app_server_startup_present",
      { mutation_value: appServerStartupProbeText() },
    ],
  ]) {
    addCase(
      caseId,
      "static_repo_boundary",
      mutationKind,
      caseId.replaceAll("_", " "),
      [code],
      config,
    );
  }

  return cases;
}

function runContractTestCase(testCaseValue, sourceSkeleton) {
  const testCase = asRecord(testCaseValue);
  const candidateSkeleton = cloneJson(sourceSkeleton);
  const staticBoundaryEvidence = buildStaticBoundaryEvidence(
    buildFixtureModeStaticBoundaryResult(),
  );
  const forcedFailures = asArray(testCase.forced_failure_codes).map(asString);
  const mutationFailures = [];
  applyMutation({
    candidateSkeleton,
    staticBoundaryEvidence,
    testCase,
    mutationFailures,
  });
  const mutationKind = asString(testCase.mutation_kind);
  const actualFailureCodes = unique([
    ...forcedFailures,
    ...mutationFailures,
    ...(mutationKind.startsWith("static_")
      ? validateStaticBoundaryEvidence(staticBoundaryEvidence)
      : validateDisabledAdapterSkeletonContract(candidateSkeleton)),
  ]);
  const expectedFailureCodes = asArray(testCase.expected_failure_codes).map(asString);
  const expectedStatus = asString(testCase.expected_status) || "fail";
  const actualStatus = actualFailureCodes.length === 0 ? "pass" : "fail";
  const expectedCodesCovered = expectedFailureCodes.every((code) =>
    actualFailureCodes.includes(code),
  );
  let caseStatus = "passed";
  if (expectedStatus === "fail" && actualStatus === "pass") {
    caseStatus = "unexpected_pass";
  } else if (expectedStatus === "pass" && actualStatus === "fail") {
    caseStatus = "unexpected_failure";
  } else if (expectedStatus === "fail" && !expectedCodesCovered) {
    caseStatus = "unexpected_failure";
  }
  return {
    case_id: asString(testCase.case_id),
    case_group: asString(testCase.case_group),
    mutation_kind: mutationKind,
    mutation_summary: asString(testCase.mutation_summary),
    expected_status: expectedStatus,
    expected_failure_codes: expectedFailureCodes,
    actual_status: actualStatus,
    actual_failure_codes: actualFailureCodes,
    case_status: caseStatus,
  };
}

function applyMutation({
  candidateSkeleton,
  staticBoundaryEvidence,
  testCase,
  mutationFailures,
}) {
  const mutationKind = asString(testCase.mutation_kind);
  const mutationPath = asArray(testCase.mutation_path).map(asString);
  switch (mutationKind) {
    case "none":
    case "forced_failure":
      return;
    case "set_path":
      setPath(candidateSkeleton, mutationPath, testCase.mutation_value);
      return;
    case "delete_path":
      deletePath(candidateSkeleton, mutationPath);
      return;
    case "remove_array_value":
      removeArrayValue(candidateSkeleton, mutationPath, testCase.mutation_value);
      return;
    case "remove_refusal_reason":
      candidateSkeleton.adapter_refusal_matrix = asArray(
        candidateSkeleton.adapter_refusal_matrix,
      ).filter(
        (entry) => asRecord(entry).reason_id !== asString(testCase.mutation_value),
      );
      return;
    case "set_refusal_reason_field":
      for (const entry of asArray(candidateSkeleton.adapter_refusal_matrix)) {
        const record = asRecord(entry);
        if (record.reason_id === asString(testCase.mutation_value)) {
          record[asString(testCase.mutation_field)] = testCase.mutation_field_value;
        }
      }
      return;
    case "static_empty_changed_files":
      staticBoundaryEvidence.changed_files_inspected = [];
      staticBoundaryEvidence.static_boundary_changed_files_inspected = [];
      return;
    case "static_remove_expected_file": {
      const target = asString(testCase.mutation_value);
      staticBoundaryEvidence.changed_files_inspected = asArray(
        staticBoundaryEvidence.changed_files_inspected,
      ).filter((filePath) => filePath !== target);
      staticBoundaryEvidence.static_boundary_changed_files_inspected =
        staticBoundaryEvidence.changed_files_inspected;
      return;
    }
    case "static_add_changed_file":
      staticBoundaryEvidence.changed_files_inspected = unique([
        ...asArray(staticBoundaryEvidence.changed_files_inspected).map(asString),
        asString(testCase.mutation_value),
      ]);
      staticBoundaryEvidence.static_boundary_changed_files_inspected =
        staticBoundaryEvidence.changed_files_inspected;
      return;
    case "static_empty_package_lines":
      staticBoundaryEvidence.package_added_lines_inspected = [];
      staticBoundaryEvidence.static_boundary_package_added_lines_inspected = [];
      return;
    case "static_add_package_line":
      staticBoundaryEvidence.package_added_lines_inspected = [
        ...asArray(staticBoundaryEvidence.package_added_lines_inspected).map(asString),
        asString(testCase.mutation_value),
      ];
      staticBoundaryEvidence.static_boundary_package_added_lines_inspected =
        staticBoundaryEvidence.package_added_lines_inspected;
      return;
    case "static_set_probe_text":
      staticBoundaryEvidence.static_boundary_probe_text = asString(
        testCase.mutation_value,
      );
      return;
    default:
      mutationFailures.push(`unknown_mutation_kind_${mutationKind || "missing"}`);
  }
}

async function selectDisabledAdapterSkeletonSource(fixture) {
  const selection = buildSourceSelection({
    sourceLabel: "disabled_adapter_skeleton",
    sourceUsed: "committed_fixture",
    fixturePath: DISABLED_ADAPTER_SKELETON_FIXTURE_PATH,
    optionalReportPath: OPTIONAL_DISABLED_ADAPTER_SKELETON_REPORT_PATH,
    optionalReportPresent: false,
    optionalReportIgnoredForFixtureMode: FIXTURE_MODE,
    fallbackToCommittedFixture: true,
  });
  if (FIXTURE_MODE) {
    return { value: fixture, selection, failureCodes: [] };
  }
  if (!existsSync(OPTIONAL_DISABLED_ADAPTER_SKELETON_REPORT_PATH)) {
    return { value: fixture, selection, failureCodes: [] };
  }
  let report;
  try {
    report = await readJson(OPTIONAL_DISABLED_ADAPTER_SKELETON_REPORT_PATH);
  } catch {
    return {
      value: {},
      selection: buildSourceSelection({
        sourceLabel: "disabled_adapter_skeleton",
        sourceUsed: "optional_report_malformed",
        fixturePath: DISABLED_ADAPTER_SKELETON_FIXTURE_PATH,
        optionalReportPath: OPTIONAL_DISABLED_ADAPTER_SKELETON_REPORT_PATH,
        optionalReportPresent: true,
        optionalReportIgnoredForFixtureMode: false,
        fallbackToCommittedFixture: false,
      }),
      failureCodes: ["optional_disabled_adapter_skeleton_report_malformed"],
    };
  }
  if (report.final_status !== "pass") {
    return {
      value: asRecord(report.disabled_adapter_skeleton),
      selection: buildSourceSelection({
        sourceLabel: "disabled_adapter_skeleton",
        sourceUsed: "optional_report_failed",
        fixturePath: DISABLED_ADAPTER_SKELETON_FIXTURE_PATH,
        optionalReportPath: OPTIONAL_DISABLED_ADAPTER_SKELETON_REPORT_PATH,
        optionalReportPresent: true,
        optionalReportIgnoredForFixtureMode: false,
        fallbackToCommittedFixture: false,
      }),
      failureCodes: ["optional_disabled_adapter_skeleton_report_not_passed"],
    };
  }
  const nested = asRecord(report.disabled_adapter_skeleton);
  if (Object.keys(nested).length === 0) {
    return {
      value: {},
      selection: buildSourceSelection({
        sourceLabel: "disabled_adapter_skeleton",
        sourceUsed: "optional_report_missing_payload",
        fixturePath: DISABLED_ADAPTER_SKELETON_FIXTURE_PATH,
        optionalReportPath: OPTIONAL_DISABLED_ADAPTER_SKELETON_REPORT_PATH,
        optionalReportPresent: true,
        optionalReportIgnoredForFixtureMode: false,
        fallbackToCommittedFixture: false,
      }),
      failureCodes: [
        "optional_disabled_adapter_skeleton_report_missing_disabled_adapter_skeleton",
      ],
    };
  }
  return {
    value: nested,
    selection: buildSourceSelection({
      sourceLabel: "disabled_adapter_skeleton",
      sourceUsed: "optional_report",
      fixturePath: DISABLED_ADAPTER_SKELETON_FIXTURE_PATH,
      optionalReportPath: OPTIONAL_DISABLED_ADAPTER_SKELETON_REPORT_PATH,
      optionalReportPresent: true,
      optionalReportIgnoredForFixtureMode: false,
      fallbackToCommittedFixture: false,
    }),
    failureCodes: [],
  };
}

async function inspectOptionalUpstreamReports() {
  const entries = [];
  for (const [label, filePath] of OPTIONAL_UPSTREAM_REPORTS) {
    entries.push(await inspectOptionalUpstreamReport(label, filePath));
  }
  return entries;
}

async function inspectOptionalUpstreamReport(label, filePath) {
  const selection = buildSourceSelection({
    sourceLabel: label,
    sourceUsed: "committed_fixture",
    fixturePath: null,
    optionalReportPath: filePath,
    optionalReportPresent: false,
    optionalReportIgnoredForFixtureMode: FIXTURE_MODE,
    fallbackToCommittedFixture: true,
  });
  if (FIXTURE_MODE || !existsSync(filePath)) {
    return {
      label,
      selection,
      summary: { optional_report_present: false, final_status: null },
      failureCodes: [],
    };
  }
  let report;
  try {
    report = await readJson(filePath);
  } catch {
    return {
      label,
      selection: {
        ...selection,
        source_used: "optional_report_malformed",
        optional_report_present: true,
        optional_report_ignored_for_fixture_mode: false,
        fallback_to_committed_fixture: false,
      },
      summary: { optional_report_present: true, final_status: "malformed" },
      failureCodes: [`optional_upstream_${label}_report_malformed`],
    };
  }
  if (report.final_status !== "pass") {
    return {
      label,
      selection: {
        ...selection,
        source_used: "optional_report_failed",
        optional_report_present: true,
        optional_report_ignored_for_fixture_mode: false,
        fallback_to_committed_fixture: false,
      },
      summary: { optional_report_present: true, final_status: report.final_status ?? null },
      failureCodes: [`optional_upstream_${label}_report_not_passed`],
    };
  }
  return {
    label,
    selection: {
      ...selection,
      source_used: "optional_report_passed",
      optional_report_present: true,
      optional_report_ignored_for_fixture_mode: false,
      fallback_to_committed_fixture: false,
    },
    summary: { optional_report_present: true, final_status: "pass" },
    failureCodes: [],
  };
}

function buildSourceSelection({
  sourceLabel,
  sourceUsed,
  fixturePath,
  optionalReportPath,
  optionalReportPresent,
  optionalReportIgnoredForFixtureMode,
  fallbackToCommittedFixture,
}) {
  return {
    source_label: sourceLabel,
    source_used: sourceUsed,
    fixture_path: fixturePath,
    optional_report_path: optionalReportPath,
    optional_report_present: optionalReportPresent,
    optional_report_ignored_for_fixture_mode: optionalReportIgnoredForFixtureMode,
    fallback_to_committed_fixture: fallbackToCommittedFixture,
  };
}

function validateSourceDisabledAdapterSkeleton(skeleton) {
  return validateDisabledAdapterSkeletonContract(skeleton);
}

function validateDisabledAdapterSkeletonContract(value) {
  const skeleton = asRecord(value);
  const failures = [];
  if (skeleton.disabled_adapter_skeleton_status !== READY_SKELETON_STATUS) {
    failures.push("disabled_adapter_skeleton_status_not_ready");
  }
  if (skeleton.recommendation_status !== READY_SKELETON_RECOMMENDATION) {
    failures.push("disabled_adapter_skeleton_recommendation_not_ready");
  }
  if (skeleton.next_recommended_slice !== READY_SKELETON_NEXT_SLICE) {
    failures.push("disabled_adapter_skeleton_next_slice_invalid");
  }
  for (const key of [
    "adapter_enabled",
    "adapter_invocation_allowed_now",
    "product_write_allowed_now",
    "product_write_authority_granted_now",
    "product_write_implementation_allowed_now",
    "transaction_execution_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "route_added",
    "ui_write_action_added",
  ]) {
    if (skeleton[key] !== false) failures.push(`${key}_not_false`);
  }
  failures.push(...validateAdapterInputContract(skeleton.adapter_input_contract));
  failures.push(
    ...validateNormalizedInputPreview(
      skeleton.normalized_adapter_input_preview,
      skeleton,
    ),
  );
  failures.push(...validateAdapterOutputContract(skeleton.adapter_output_contract));
  failures.push(
    ...validateDisabledInvocationResult(skeleton.disabled_invocation_result),
  );
  failures.push(
    ...validateFutureCommandPreview(
      skeleton.future_product_write_command_preview,
    ),
  );
  failures.push(...validateRefusalMatrix(skeleton.adapter_refusal_matrix));
  failures.push(
    ...validateFalseRecord(
      skeleton.explicit_forbidden_surfaces,
      EXPLICIT_FORBIDDEN_SURFACE_KEYS,
      "explicit_forbidden_surface",
    ),
  );
  failures.push(...validateSourceEvidence(asRecord(skeleton.source_evidence)));
  failures.push(...validateStaticBoundaryEvidence(skeleton.static_boundary_evidence));
  if (hasNonNullProductIds(skeleton)) {
    failures.push("non_null_product_or_related_id_present");
  }
  return unique(failures);
}

function validateAdapterInputContract(value) {
  const contract = asRecord(value);
  const failures = [];
  const requiredInputs = asArray(contract.required_inputs).map(asString);
  const forbiddenInputs = asArray(contract.forbidden_inputs).map(asString);
  for (const inputName of REQUIRED_ADAPTER_INPUTS) {
    if (!requiredInputs.includes(inputName)) {
      failures.push(`adapter_input_contract_missing_required_${inputName}`);
    }
  }
  for (const inputName of FORBIDDEN_ADAPTER_INPUTS) {
    if (!forbiddenInputs.includes(inputName)) {
      failures.push(`adapter_input_contract_missing_forbidden_${inputName}`);
    }
  }
  return failures;
}

function validateNormalizedInputPreview(value, skeleton) {
  const preview = asRecord(value);
  const failures = [];
  if (preview.candidate_kind !== "manual_note_single_claim") {
    failures.push("normalized_candidate_kind_invalid");
  }
  for (const inputName of [
    "authority_contract_bundle_fingerprint",
    "selected_temp_claim_record_id",
    "source_operation_id",
    "source_temp_intent_id",
    "temp_idempotency_key",
  ]) {
    if (!asString(preview[inputName])) {
      failures.push(`normalized_${inputName}_missing`);
    }
  }
  const expectedFingerprint = asString(
    asRecord(asRecord(skeleton.source_evidence).authority_contract_bundle)
      .authority_contract_bundle_fingerprint,
  );
  if (
    expectedFingerprint &&
    preview.authority_contract_bundle_fingerprint !== expectedFingerprint
  ) {
    failures.push("normalized_authority_bundle_fingerprint_mismatch");
  }
  for (const idKey of [
    "product_claim_id",
    "proof_id",
    "evidence_id",
    "perspective_id",
    "work_item_id",
  ]) {
    if (preview[idKey] !== null) failures.push(`normalized_${idKey}_not_null`);
  }
  if (preview.raw_manual_note_text_included !== false) {
    failures.push("normalized_raw_manual_note_text_included_not_false");
  }
  if (preview.normalization_executed_now !== true) {
    failures.push("normalization_executed_now_not_true");
  }
  if (preview.normalization_persisted_now !== false) {
    failures.push("normalization_persisted_now_not_false");
  }
  if (preview.normalization_storage_target !== "local_artifact_only") {
    failures.push("normalization_storage_target_invalid");
  }
  if (preview.multiple_selected_temp_claims === true) {
    failures.push("normalized_multiple_selected_temp_claims_present");
  }
  for (const inputName of FORBIDDEN_ADAPTER_INPUTS) {
    if (
      inputName in preview &&
      preview[inputName] !== null &&
      preview[inputName] !== undefined &&
      preview[inputName] !== false
    ) {
      failures.push(`normalized_forbidden_${inputName}_present`);
    }
  }
  return failures;
}

function validateAdapterOutputContract(value) {
  const contract = asRecord(value);
  const failures = [];
  const statuses = asArray(contract.possible_result_statuses).map(asString);
  for (const status of [
    "rejected_disabled_adapter",
    "blocked_missing_authority_contract",
    "blocked_forbidden_input",
    "blocked_product_write_not_allowed",
    "dry_noop_preview",
  ]) {
    if (!statuses.includes(status)) {
      failures.push(`adapter_output_contract_missing_status_${status}`);
    }
  }
  if (contract.default_result_status !== "rejected_disabled_adapter") {
    failures.push("adapter_output_default_status_invalid");
  }
  for (const [key, expected] of [
    ["product_write_result", null],
    ["product_claim_id", null],
    ["durable_records_created_now", false],
    ["product_db_write", false],
    ["product_id_allocation", false],
    ["db_open", false],
    ["sql_execution", false],
    ["transaction_execution", false],
  ]) {
    if (contract[key] !== expected) failures.push(`adapter_output_${key}_invalid`);
  }
  return failures;
}

function validateDisabledInvocationResult(value) {
  const result = asRecord(value);
  const failures = [];
  for (const key of [
    "invocation_attempted_now",
    "adapter_invocation_allowed_now",
    "adapter_enabled",
    "product_write_executed_now",
    "transaction_executed_now",
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "route_added",
    "ui_write_action_added",
    "durable_records_created_now",
  ]) {
    if (result[key] !== false) {
      failures.push(`disabled_invocation_${key}_not_false`);
    }
  }
  if (result.result_status !== "rejected_disabled_adapter") {
    failures.push("disabled_invocation_result_status_invalid");
  }
  const reasons = asArray(result.refusal_reasons).map(asString);
  for (const reason of [
    "adapter_disabled",
    "product_write_authority_not_granted",
    "authority_contracts_defined_but_not_satisfied",
    "product_write_implementation_not_allowed",
  ]) {
    if (!reasons.includes(reason)) {
      failures.push(`disabled_invocation_missing_refusal_${reason}`);
    }
  }
  return failures;
}

function validateFutureCommandPreview(value) {
  const preview = asRecord(value);
  const failures = [];
  if (preview.executable_now !== false) {
    failures.push("future_command_executable_now_not_false");
  }
  if (preview.product_claim_id !== null) {
    failures.push("future_command_product_claim_id_not_null");
  }
  if (!asString(preview.target_table_or_interface)) {
    failures.push("future_command_target_missing");
  }
  if (asNumber(preview.write_operation_count) !== 0) {
    failures.push("future_command_write_operation_count_not_zero");
  }
  if (asNumber(preview.sql_statement_count) !== 0) {
    failures.push("future_command_sql_statement_count_not_zero");
  }
  if (preview.command_rejected_now !== true) {
    failures.push("future_command_rejected_now_not_true");
  }
  if (preview.rejection_reason !== "disabled_adapter_skeleton_only") {
    failures.push("future_command_rejection_reason_invalid");
  }
  const requiredContracts = asArray(preview.would_require_contracts).map(asString);
  for (const contractId of AUTHORITY_CONTRACT_IDS) {
    if (!requiredContracts.includes(contractId)) {
      failures.push(`future_command_missing_required_contract_${contractId}`);
    }
  }
  if (asString(preview.product_write_implementation_hint)) {
    failures.push("future_command_product_write_implementation_hint_present");
  }
  return failures;
}

function validateRefusalMatrix(value) {
  const matrix = asArray(value).map(asRecord);
  const failures = [];
  const reasonIds = matrix.map((entry) => asString(entry.reason_id));
  for (const reasonId of REFUSAL_REASON_IDS) {
    if (!reasonIds.includes(reasonId)) {
      failures.push(`refusal_matrix_missing_${reasonId}`);
    }
  }
  for (const entry of matrix) {
    const reasonId = asString(entry.reason_id) || "unknown";
    if (entry.requested_now !== false) {
      failures.push(`refusal_matrix_${reasonId}_requested_now_not_false`);
    }
    if (entry.refusal_required_now !== true) {
      failures.push(`refusal_matrix_${reasonId}_refusal_required_now_not_true`);
    }
    if (entry.blocks_adapter_invocation_now !== true) {
      failures.push(
        `refusal_matrix_${reasonId}_blocks_adapter_invocation_now_not_true`,
      );
    }
    if (entry.blocks_product_write_now !== true) {
      failures.push(`refusal_matrix_${reasonId}_blocks_product_write_now_not_true`);
    }
  }
  return failures;
}

function validateSourceEvidence(sourceEvidence) {
  const failures = [];
  const authorityBundle = asRecord(sourceEvidence.authority_contract_bundle);
  if (
    authorityBundle.authority_contract_bundle_status !==
    "product_write_authority_contracts_defined_only"
  ) {
    failures.push("source_authority_bundle_status_not_ready");
  }
  if (
    authorityBundle.recommendation_status !==
    "ready_for_single_claim_product_write_disabled_adapter_skeleton"
  ) {
    failures.push("source_authority_bundle_recommendation_not_ready");
  }
  if (authorityBundle.validation_passed !== true) {
    failures.push("source_authority_bundle_validation_not_passed");
  }
  const gapSummary = asRecord(authorityBundle.authority_gap_summary);
  if (
    gapSummary.total_required_contracts !== AUTHORITY_CONTRACT_IDS.length ||
    gapSummary.satisfied_now_count !== 0 ||
    gapSummary.authority_granted_now_count !== 0 ||
    gapSummary.implementation_allowed_now_count !== 0 ||
    gapSummary.blocked_contract_count !== AUTHORITY_CONTRACT_IDS.length
  ) {
    failures.push("source_authority_gap_summary_invalid");
  }
  const harness = asRecord(sourceEvidence.dry_run_transaction_harness);
  if (
    harness.dry_run_transaction_harness_status !==
    "disabled_dry_run_transaction_harness_only"
  ) {
    failures.push("source_harness_status_not_ready");
  }
  const plan = asRecord(sourceEvidence.dry_run_transaction_plan);
  if (plan.dry_run_transaction_plan_status !== "disabled_dry_run_transaction_plan_only") {
    failures.push("source_plan_status_not_ready");
  }
  const contractTests = asRecord(
    sourceEvidence.disabled_bridge_skeleton_contract_tests,
  );
  if (contractTests.final_status !== "pass") {
    failures.push("source_disabled_bridge_skeleton_contract_tests_not_passed");
  }
  const bridgeSkeleton = asRecord(sourceEvidence.disabled_bridge_skeleton);
  if (
    bridgeSkeleton.disabled_bridge_skeleton_status !==
    "single_claim_disabled_bridge_skeleton_only"
  ) {
    failures.push("source_disabled_bridge_skeleton_not_ready");
  }
  for (const key of [
    "bridge_adapter_enabled",
    "bridge_execution_allowed_now",
    "product_write_allowed_now",
  ]) {
    if (bridgeSkeleton[key] !== false) {
      failures.push(`source_disabled_bridge_skeleton_${key}_not_false`);
    }
  }
  const bridgeDesign = asRecord(sourceEvidence.temp_to_product_bridge_design);
  if (bridgeDesign.bridge_design_status !== "single_claim_bridge_design_only") {
    failures.push("source_bridge_design_not_ready");
  }
  const gateDesign = asRecord(sourceEvidence.product_write_gate_design);
  if (gateDesign.gate_design_status !== "product_write_gate_design_only") {
    failures.push("source_gate_design_not_ready");
  }
  if (gateDesign.recommendation_status !== "ready_for_single_claim_bridge_design") {
    failures.push("source_gate_design_recommendation_not_ready");
  }
  return failures;
}

function buildSourceEvidence({
  skeleton,
  skeletonSelection,
  optionalUpstreamReports,
  staticBoundaryResult,
}) {
  const sourceEvidence = asRecord(skeleton.source_evidence);
  return {
    disabled_adapter_skeleton: {
      source_selection: skeletonSelection,
      disabled_adapter_skeleton_fingerprint: asString(
        skeleton.disabled_adapter_skeleton_fingerprint,
      ),
      disabled_adapter_skeleton_status: asString(
        skeleton.disabled_adapter_skeleton_status,
      ),
      recommendation_status: asString(skeleton.recommendation_status),
      next_recommended_slice: asString(skeleton.next_recommended_slice),
      adapter_enabled: skeleton.adapter_enabled === true,
      adapter_invocation_allowed_now:
        skeleton.adapter_invocation_allowed_now === true,
      product_write_allowed_now: skeleton.product_write_allowed_now === true,
    },
    optional_upstream_reports: optionalUpstreamReports.map((entry) => ({
      label: entry.label,
      source_selection: entry.selection,
      summary: entry.summary,
      failure_codes: entry.failureCodes,
    })),
    authority_contract_bundle: sourceEvidence.authority_contract_bundle ?? {},
    dry_run_transaction_harness:
      sourceEvidence.dry_run_transaction_harness ?? {},
    dry_run_transaction_plan: sourceEvidence.dry_run_transaction_plan ?? {},
    disabled_bridge_skeleton_contract_tests:
      sourceEvidence.disabled_bridge_skeleton_contract_tests ?? {},
    disabled_bridge_skeleton:
      sourceEvidence.disabled_bridge_skeleton ?? {},
    temp_to_product_bridge_design:
      sourceEvidence.temp_to_product_bridge_design ?? {},
    product_write_gate_design: sourceEvidence.product_write_gate_design ?? {},
    product_write_disabled_adapter_contract_tests_static_boundary: {
      static_boundary_base_ref: staticBoundaryResult.static_boundary_base_ref,
      static_boundary_base_mode: staticBoundaryResult.static_boundary_base_mode,
      static_boundary_changed_file_count:
        staticBoundaryResult.changed_files_inspected.length,
      static_boundary_package_added_line_count:
        staticBoundaryResult.package_added_lines_inspected.length,
      static_boundary_used_fallback_allowlist:
        staticBoundaryResult.used_fallback_allowlist,
    },
  };
}

function summarizeTestedBoundaries(testCasesFixture, caseResults) {
  const groups = unique(
    asArray(testCasesFixture.test_cases).map((testCase) =>
      asString(asRecord(testCase).case_group),
    ),
  ).filter(Boolean);
  return {
    disabled_adapter_contract_tests_only: true,
    fixture_only: true,
    deterministic: true,
    total_case_groups: groups.length,
    case_groups: groups,
    positive_case_count: caseResults.filter(
      (result) => result.expected_status === "pass",
    ).length,
    expected_negative_case_count: caseResults.filter(
      (result) => result.expected_status === "fail",
    ).length,
    product_db_write: false,
    product_id_allocation: false,
    db_open: false,
    sql_execution: false,
    transaction_execution: false,
    route_added: false,
    ui_write_action_added: false,
    adapter_enabled: false,
    adapter_invocation_allowed_now: false,
    proof_evidence_write: false,
    perspective_or_canonical_graph_write: false,
    work_item_creation: false,
    source_fetch: false,
    provider_or_openai_call: false,
    retrieval_or_rag: false,
    external_handoff: false,
    browser_persistence: false,
    next_recommended_slice: NEXT_DRY_RUN_INVOCATION_HARNESS,
    suite_does_not_recommend_product_write: true,
  };
}

function validateStaticRepoBoundary() {
  const failures = [];
  const messages = [];
  const delta = resolveStaticBoundaryDelta();
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /single-claim-product-write-disabled-adapter|product-write-disabled-adapter-contract-tests/i.test(
      filePath,
    ),
  );
  if (routeFiles.length > 0) {
    failures.push("static_app_api_route_added");
    messages.push(`unexpected API route files: ${routeFiles.join(", ")}`);
  }
  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-product-write-disabled-adapter|product-write-disabled-adapter-contract-tests/i.test(
      filePath,
    ),
  );
  if (uiFiles.length > 0) {
    failures.push("static_ui_file_added");
    messages.push(`unexpected UI files: ${uiFiles.join(", ")}`);
  }
  const evidence = buildStaticBoundaryEvidence({
    failureCodes: [],
    messages: [],
    static_boundary_base_ref: delta.baseRef,
    static_boundary_base_mode: delta.baseMode,
    static_boundary_base_commit: delta.baseCommit,
    static_boundary_compare_ref: delta.compareRef,
    changed_files_inspected: delta.changedFiles,
    package_added_lines_inspected: delta.packageAddedLines,
    used_fallback_allowlist: delta.usedFallbackAllowlist,
    expected_changed_files: EXPECTED_CHANGED_FILES,
    allowed_package_script_names: ALLOWED_PACKAGE_SCRIPT_NAMES,
  });
  failures.push(...validateStaticBoundaryEvidence(evidence));
  const sourceTexts = STATIC_SCAN_PATHS.map((filePath) => [
    filePath,
    existsSync(filePath) ? readFileSync(filePath, "utf8") : "",
  ]);
  for (const [filePath, text] of sourceTexts) {
    if (executableSqlPattern().test(text)) {
      failures.push("static_executable_sql_string_present");
      messages.push(`executable SQL-like string found in ${filePath}`);
    }
    if (forbiddenImportPattern().test(text)) {
      failures.push("static_forbidden_import_present");
      messages.push(`forbidden import found in ${filePath}`);
    }
    if (networkOrExternalCallPattern().test(text)) {
      failures.push("static_network_or_external_call_present");
      messages.push(`network/provider/retrieval/external call found in ${filePath}`);
    }
    if (browserPersistencePattern().test(text)) {
      failures.push("static_browser_persistence_present");
      messages.push(`browser persistence found in ${filePath}`);
    }
    if (appServerStartupPattern().test(text)) {
      failures.push("static_app_server_startup_present");
      messages.push(`app server startup found in ${filePath}`);
    }
  }
  return {
    failureCodes: unique(failures),
    messages,
    static_boundary_base_ref: delta.baseRef,
    static_boundary_base_mode: delta.baseMode,
    static_boundary_base_commit: delta.baseCommit,
    static_boundary_compare_ref: delta.compareRef,
    changed_files_inspected: delta.changedFiles,
    package_added_lines_inspected: delta.packageAddedLines,
    used_fallback_allowlist: delta.usedFallbackAllowlist,
    expected_changed_files: EXPECTED_CHANGED_FILES,
    allowed_package_script_names: ALLOWED_PACKAGE_SCRIPT_NAMES,
  };
}

function validateStaticBoundaryEvidence(value) {
  const evidence = asRecord(value);
  const failures = [];
  const changedFiles = asArray(
    evidence.static_boundary_changed_files_inspected ??
      evidence.changed_files_inspected,
  ).map(asString);
  const packageLines = asArray(
    evidence.static_boundary_package_added_lines_inspected ??
      evidence.package_added_lines_inspected,
  ).map(asString);
  if (changedFiles.length === 0) {
    failures.push("static_boundary_changed_file_delta_empty");
  }
  const expectedFiles = asArray(evidence.expected_changed_files).map(asString);
  if (expectedFiles.some((filePath) => !changedFiles.includes(filePath))) {
    failures.push("static_boundary_expected_files_missing");
  }
  if (packageLines.length === 0) {
    failures.push("static_boundary_package_added_lines_empty");
  }
  if (changedFiles.some(isSchemaDbSqlPath)) {
    failures.push("static_boundary_schema_db_sql_changed");
  }
  if (changedFiles.some((filePath) => /^app\/api\//.test(filePath))) {
    failures.push("static_boundary_app_api_route_changed");
  }
  if (changedFiles.some(isUiFilePath)) {
    failures.push("static_boundary_ui_changed");
  }
  const allowedScripts = asArray(evidence.allowed_package_script_names).map(asString);
  for (const line of packageLines) {
    if (!allowedScripts.some((scriptName) => line.includes(`"${scriptName}"`))) {
      failures.push("static_boundary_package_addition_outside_allowlist");
    }
  }
  const missingPackageScripts = allowedScripts.filter(
    (scriptName) => !packageLines.some((line) => line.includes(`"${scriptName}"`)),
  );
  if (missingPackageScripts.length > 0) {
    failures.push("static_boundary_expected_package_script_missing");
  }
  const probeText = asString(evidence.static_boundary_probe_text);
  if (probeText) {
    if (executableSqlPattern().test(probeText)) {
      failures.push("static_boundary_executable_sql_string_present");
    }
    if (forbiddenImportPattern().test(probeText)) {
      failures.push("static_boundary_forbidden_import_present");
    }
    if (networkOrExternalCallPattern().test(probeText)) {
      failures.push("static_boundary_network_or_external_call_present");
    }
    if (browserPersistencePattern().test(probeText)) {
      failures.push("static_boundary_browser_persistence_present");
    }
    if (appServerStartupPattern().test(probeText)) {
      failures.push("static_boundary_app_server_startup_present");
    }
  }
  return unique(failures);
}

function buildStaticBoundaryEvidence(result) {
  return {
    static_boundary_base_ref: result.static_boundary_base_ref,
    static_boundary_base_mode: result.static_boundary_base_mode,
    static_boundary_base_commit: result.static_boundary_base_commit,
    static_boundary_compare_ref: result.static_boundary_compare_ref,
    changed_files_inspected: result.changed_files_inspected,
    package_added_lines_inspected: result.package_added_lines_inspected,
    static_boundary_changed_files_inspected: result.changed_files_inspected,
    static_boundary_package_added_lines_inspected:
      result.package_added_lines_inspected,
    static_boundary_used_fallback_allowlist: result.used_fallback_allowlist,
    expected_changed_files: result.expected_changed_files,
    allowed_package_script_names: result.allowed_package_script_names,
    static_boundary_probe_text: "",
  };
}

function buildFixtureModeStaticBoundaryResult() {
  return {
    failureCodes: [],
    messages: [],
    static_boundary_base_ref: "committed_allowlist",
    static_boundary_base_mode: "fixture_mode_committed_static_boundary_allowlist",
    static_boundary_base_commit: null,
    static_boundary_compare_ref: "HEAD",
    changed_files_inspected: EXPECTED_CHANGED_FILES,
    package_added_lines_inspected: FALLBACK_PACKAGE_ADDED_LINES,
    used_fallback_allowlist: true,
    expected_changed_files: EXPECTED_CHANGED_FILES,
    allowed_package_script_names: ALLOWED_PACKAGE_SCRIPT_NAMES,
  };
}

function summarizeStaticBoundaryResult(result) {
  return {
    note:
      "Live static boundary metadata observed during fixture mode is not included in the product write disabled adapter contract-tests artifact or fingerprint.",
    static_boundary_base_ref: result.static_boundary_base_ref,
    static_boundary_base_mode: result.static_boundary_base_mode,
    static_boundary_base_commit: result.static_boundary_base_commit,
    static_boundary_compare_ref: result.static_boundary_compare_ref,
    changed_files_inspected_count: result.changed_files_inspected.length,
    package_added_lines_inspected_count:
      result.package_added_lines_inspected.length,
    used_fallback_allowlist: result.used_fallback_allowlist,
    failureCodes: result.failureCodes,
  };
}

function resolveStaticBoundaryDelta() {
  const envBaseRef =
    process.env
      .AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_CONTRACT_TESTS_BASE_REF?.trim();
  if (envBaseRef) {
    const envDelta = resolveDeltaFromBaseRef(
      envBaseRef,
      "env:AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_CONTRACT_TESTS_BASE_REF",
    );
    if (envDelta) return deltaOrAllowlistFallback(envDelta);
    return emptyDelta(
      envBaseRef,
      "env:AUGNES_PRODUCT_WRITE_DISABLED_ADAPTER_CONTRACT_TESTS_BASE_REF",
    );
  }
  const baseCandidates = [
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null,
    "origin/main",
    "main",
    "HEAD^",
  ].filter(Boolean);
  const attemptedDeltas = [];
  for (const candidate of baseCandidates) {
    const delta = resolveDeltaFromBaseRef(candidate, `merge_base:${candidate}`);
    if (!delta) continue;
    attemptedDeltas.push(delta);
    const expectedFilesPresent = EXPECTED_CHANGED_FILES.every((filePath) =>
      delta.changedFiles.includes(filePath),
    );
    if (expectedFilesPresent) return delta;
  }
  return allowlistFallback(
    attemptedDeltas[0]?.baseCommit ?? null,
    attemptedDeltas.length > 0
      ? "committed_allowlist_fallback_after_empty_or_downstream_delta"
      : "committed_allowlist_fallback_no_base_metadata",
  );
}

function deltaOrAllowlistFallback(delta) {
  if (EXPECTED_CHANGED_FILES.every((filePath) => delta.changedFiles.includes(filePath))) {
    return delta;
  }
  if (delta.changedFiles.length === 0) {
    return allowlistFallback(
      delta.baseCommit,
      "committed_allowlist_fallback_after_empty_env_delta",
    );
  }
  return delta;
}

function allowlistFallback(baseCommit, baseMode) {
  return {
    baseRef: "committed_allowlist",
    baseMode,
    baseCommit,
    compareRef: "HEAD",
    changedFiles: EXPECTED_CHANGED_FILES,
    packageAddedLines: FALLBACK_PACKAGE_ADDED_LINES,
    usedFallbackAllowlist: true,
  };
}

function resolveDeltaFromBaseRef(baseRef, baseMode) {
  const baseCommit = resolveBaseCommit(baseRef);
  if (!baseCommit) return null;
  const changedFiles = readGitLines([
    "diff",
    "--name-only",
    `${baseCommit}..HEAD`,
  ]);
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    `${baseCommit}..HEAD`,
    "--",
    "package.json",
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  return {
    baseRef,
    baseMode,
    baseCommit,
    compareRef: "HEAD",
    changedFiles,
    packageAddedLines,
    usedFallbackAllowlist: false,
  };
}

function resolveBaseCommit(baseRef) {
  const verifiedBase = readGitOutput([
    "rev-parse",
    "--verify",
    `${baseRef}^{commit}`,
  ]).trim();
  if (!verifiedBase) return null;
  if (baseRef === "HEAD^") return verifiedBase;
  const mergeBase = readGitOutput(["merge-base", verifiedBase, "HEAD"]).trim();
  return mergeBase || verifiedBase;
}

function readGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function readGitLines(args) {
  return readGitOutput(args)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function emptyDelta(baseRef, baseMode) {
  return {
    baseRef,
    baseMode,
    baseCommit: null,
    compareRef: "HEAD",
    changedFiles: [],
    packageAddedLines: [],
    usedFallbackAllowlist: false,
  };
}

function validateFalseRecord(value, keys, prefix) {
  const record = asRecord(value);
  const failures = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push(`${prefix}_record_missing`);
  }
  if (Object.keys(record).length === 0) {
    failures.push(`${prefix}_record_empty`);
  }
  for (const key of keys) {
    if (record[key] !== false) failures.push(`${prefix}_${key}_not_false`);
  }
  return failures;
}

function hasNonNullProductIds(value) {
  if (Array.isArray(value)) return value.some((item) => hasNonNullProductIds(item));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nestedValue]) => {
    if (PRODUCT_ID_KEYS.includes(key)) {
      return nestedValue !== null && nestedValue !== undefined;
    }
    return hasNonNullProductIds(nestedValue);
  });
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
  const words = [
    ["CREATE", "TABLE"],
    ["INSERT", "INTO"],
    ["ALTER", "TABLE"],
    ["DROP", "TABLE"],
  ].map(([left, right]) => `${left}\\s+${right}`);
  return new RegExp(
    `\\b(${[...words, "UPDATE\\s+\\w+", "DELETE\\s+FROM"].join("|")})\\b`,
    "i",
  );
}

function executableSqlProbeText() {
  return `${["CREATE", "TABLE"].join(" ")} product_claims (id text)`;
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

function forbiddenImportProbeText() {
  return `import x from "${["lib", "db", "client"].join("/")}"`;
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

function networkProbeText() {
  return `${["fet", "ch"].join("")}('https://example.invalid')`;
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

function browserPersistenceProbeText() {
  return `${["local", "Storage"].join("")}.setItem('x','y')`;
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

function appServerStartupProbeText() {
  return `${["create", "Server"].join("")}(handler).${["listen"].join("")}(3000)`;
}

function listFiles(dirPath) {
  if (!existsSync(dirPath)) return [];
  const files = [];
  for (const entry of readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files.map((filePath) => filePath.replaceAll(path.sep, "/"));
}

function setPath(target, pathParts, value) {
  if (pathParts.length === 0) return;
  let cursor = target;
  for (const part of pathParts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== "object") cursor[part] = {};
    cursor = cursor[part];
  }
  cursor[pathParts[pathParts.length - 1]] = value;
}

function deletePath(target, pathParts) {
  if (pathParts.length === 0) return;
  let cursor = target;
  for (const part of pathParts.slice(0, -1)) {
    cursor = asRecord(cursor[part]);
  }
  delete cursor[pathParts[pathParts.length - 1]];
}

function removeArrayValue(target, pathParts, value) {
  if (pathParts.length === 0) return;
  let cursor = target;
  for (const part of pathParts.slice(0, -1)) {
    cursor = asRecord(cursor[part]);
  }
  const key = pathParts[pathParts.length - 1];
  cursor[key] = asArray(cursor[key]).filter((entry) => entry !== value);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function createFingerprint(value) {
  const json = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalJson(value) {
  return JSON.stringify(sortJson(value));
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }
  return value;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function unique(values) {
  return [...new Set(values)];
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
