import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const CONTRACT_TEST_VERSION =
  "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests.v0.1";
const SKELETON_VERSION =
  "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton.v0.1";
const ARTIFACT_DIR =
  "/tmp/augnes-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const CONTRACT_TESTS_PATH = path.join(ARTIFACT_DIR, "contract-tests.json");
const SKELETON_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton.sample.v0.1.json";
const BRIDGE_DESIGN_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-bridge-design.sample.v0.1.json";
const TEST_CASES_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-test-cases.v0.1.json";
const OPTIONAL_UPSTREAM_BRIDGE_DESIGN_REPORT_PATH =
  "/tmp/augnes-single-claim-temp-to-product-bridge-design-v0-1/report.json";
const HELPER_PATH =
  "lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests.ts";
const RUNNER_PATH =
  "scripts/run-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs";
const SMOKE_PATH =
  "scripts/smoke-research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1.mjs";
const FIXTURE_MODE =
  process.env
    .AUGNES_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_CONTRACT_TESTS_FIXTURE_MODE ===
  "1";

const READY_SOURCE_RECOMMENDATION = "ready_for_disabled_bridge_skeleton";
const READY_SKELETON_RECOMMENDATION =
  "ready_for_disabled_bridge_skeleton_contract_tests";
const NEXT_CONTRACT_TEST_SLICE =
  "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests";
const CONTRACT_SUITE_STATUS =
  "disabled_bridge_skeleton_contract_tests_passed";
const RECOMMENDATION_STATUS =
  "ready_for_disabled_bridge_dry_run_transaction_plan";
const NEXT_DRY_RUN_TRANSACTION_PLAN =
  "single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan";

const SOURCE_FORBIDDEN_SURFACE_KEYS = [
  "proof_evidence_write",
  "perspective_or_canonical_graph_write",
  "work_item_creation",
  "source_fetch",
  "provider_or_openai_call",
  "retrieval_or_rag",
  "external_handoff",
  "product_db_write",
  "product_id_allocation",
  "sql_execution",
  "db_open",
  "schema_or_migration_change",
  "route_added",
  "ui_write_action_added",
  "adapter_enabled",
];
const SKELETON_FORBIDDEN_SURFACE_KEYS = [
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
];
const SOURCE_INPUT_CONTRACT_FIELDS = [
  "selected_temp_claim_record_id",
  "source_operation_id",
  "source_temp_intent_id",
  "temp_idempotency_key",
  "gate_design_fingerprint",
  "result_contract_evidence_fingerprint",
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
  "audit_record_product_id",
];
const STATIC_SCAN_PATHS = [HELPER_PATH, RUNNER_PATH, SMOKE_PATH];

async function main() {
  await rm(ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const skeletonFixture = await readJson(SKELETON_FIXTURE_PATH);
  const bridgeDesignFixture = await readJson(BRIDGE_DESIGN_FIXTURE_PATH);
  const testCasesFixture = await readJson(TEST_CASES_FIXTURE_PATH);
  const caseResults = asArray(asRecord(testCasesFixture).test_cases).map(
    (testCase) =>
      runContractTestCase(asRecord(testCase), {
        skeletonFixture,
        bridgeDesignFixture,
        testCasesFixture,
      }),
  );
  const unexpectedPasses = caseResults.filter(
    (result) => result.case_status === "unexpected_pass",
  );
  const unexpectedFailures = caseResults.filter(
    (result) => result.case_status === "unexpected_failure",
  );
  const staticBoundaryResult = validateStaticRepoBoundary();
  const finalStatus =
    caseResults.length >= 45 &&
    unexpectedPasses.length === 0 &&
    unexpectedFailures.length === 0 &&
    staticBoundaryResult.failureCodes.length === 0 &&
    preservedBoundariesIntact(asRecord(testCasesFixture).tested_boundaries)
      ? "pass"
      : "fail";
  const suiteFingerprint = createFingerprint({
    test_cases_fixture: testCasesFixture,
    case_results: caseResults,
    static_boundary_result: staticBoundaryResult,
  });
  const report = {
    report_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_report",
    report_version: CONTRACT_TEST_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      contract_tests: CONTRACT_TESTS_PATH,
    },
    input_paths: {
      disabled_bridge_skeleton_fixture: SKELETON_FIXTURE_PATH,
      bridge_design_fixture: BRIDGE_DESIGN_FIXTURE_PATH,
      test_cases_fixture: TEST_CASES_FIXTURE_PATH,
      optional_upstream_bridge_design_report:
        OPTIONAL_UPSTREAM_BRIDGE_DESIGN_REPORT_PATH,
    },
    optional_inputs: {
      fixture_mode: FIXTURE_MODE,
      live_optional_upstream_report_present: existsSync(
        OPTIONAL_UPSTREAM_BRIDGE_DESIGN_REPORT_PATH,
      ),
      live_optional_upstream_report_ignored_for_fixture_only_suite: true,
    },
    suite_fingerprint: suiteFingerprint,
    source_skeleton_fingerprint: asString(
      asRecord(skeletonFixture).skeleton_fingerprint,
    ),
    source_skeleton_fingerprint_validation:
      createFingerprint(canonicalSkeletonForFingerprint(skeletonFixture)) ===
      asString(asRecord(skeletonFixture).skeleton_fingerprint),
    source_bridge_design_fingerprint: asString(
      asRecord(bridgeDesignFixture).design_fingerprint,
    ),
    total_cases: caseResults.length,
    positive_cases: caseResults.filter(
      (result) =>
        result.expected_status === "pass" && result.case_status === "passed",
    ).length,
    expected_negative_cases: caseResults.filter(
      (result) => result.case_status === "expected_failure",
    ).length,
    failed_cases: caseResults.filter((result) => result.actual_status === "fail")
      .length,
    unexpected_passes: unexpectedPasses,
    unexpected_failures: unexpectedFailures,
    case_results: caseResults,
    static_boundary_result: staticBoundaryResult,
    tested_boundaries: summarizeTestedBoundaries(testCasesFixture, caseResults),
    contract_suite_status:
      finalStatus === "pass" ? CONTRACT_SUITE_STATUS : "contract_tests_failed",
    recommendation_status:
      finalStatus === "pass"
        ? RECOMMENDATION_STATUS
        : "blocked_before_disabled_bridge_dry_run_transaction_plan",
    next_recommended_slice:
      finalStatus === "pass"
        ? NEXT_DRY_RUN_TRANSACTION_PLAN
        : "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_recheck",
    final_status: finalStatus,
  };
  const contractTestsArtifact = {
    suite_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests",
    suite_version: CONTRACT_TEST_VERSION,
    suite_fingerprint: suiteFingerprint,
    total_cases: caseResults.length,
    case_results: caseResults,
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
          "research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1",
        final_status: report.final_status,
        total_cases: report.total_cases,
        positive_cases: report.positive_cases,
        expected_negative_cases: report.expected_negative_cases,
        unexpected_passes: report.unexpected_passes.length,
        unexpected_failures: report.unexpected_failures.length,
        contract_suite_status: report.contract_suite_status,
        recommendation_status: report.recommendation_status,
        next_recommended_slice: report.next_recommended_slice,
        artifact_paths: report.artifact_paths,
      },
      null,
    ),
  );

  if (report.final_status !== "pass") {
    process.exitCode = 1;
  }
}

function runContractTestCase(testCase, fixtures) {
  const target = buildTargetObject(testCase, fixtures);
  const validation = validateTarget(testCase, target, fixtures);
  const expectedFailureCodes = asArray(testCase.expected_failure_codes).filter(
    (code) => typeof code === "string",
  );
  const actualStatus = validation.failureCodes.length === 0 ? "pass" : "fail";
  const expectedCodesPresent = expectedFailureCodes.every((code) =>
    validation.failureCodes.includes(code),
  );
  const expectedStatusMatched =
    actualStatus === testCase.expected_status &&
    (actualStatus === "pass" || expectedCodesPresent);
  const caseStatus =
    testCase.expected_status === "fail"
      ? actualStatus === "fail" && expectedCodesPresent
        ? "expected_failure"
        : "unexpected_pass"
      : expectedStatusMatched
        ? "passed"
        : "unexpected_failure";
  return {
    case_id: asString(testCase.case_id),
    case_kind: asString(testCase.case_kind),
    mutation_kind: asString(testCase.mutation_kind),
    target_fixture: asString(testCase.target_fixture),
    expected_status: asString(testCase.expected_status),
    actual_status: actualStatus,
    case_status: caseStatus,
    expected_failure_codes: expectedFailureCodes,
    actual_failure_codes: validation.failureCodes,
    messages: validation.messages,
  };
}

function buildTargetObject(testCase, fixtures) {
  if (testCase.target_fixture === "source_bridge_design") {
    const bridgeDesign = applyMutationPatch(
      fixtures.bridgeDesignFixture,
      testCase.mutated_fixture_patch,
    );
    return {
      source_bridge_design: bridgeDesign,
      disabled_bridge_skeleton: buildSkeleton({
        tempToProductBridgeDesign: bridgeDesign,
      }),
    };
  }
  if (testCase.target_fixture === "optional_bridge_design_report") {
    const optionalReport = applyMutationPatch(
      buildReadyOptionalBridgeDesignReport(fixtures.bridgeDesignFixture),
      testCase.mutated_fixture_patch,
    );
    const optionalReportRecord = asRecord(optionalReport);
    const sourceBridgeDesign =
      optionalReportRecord.temp_to_product_bridge_design ?? {};
    const reportPassed = optionalReportRecord.final_status === "pass";
    return {
      optional_bridge_design_report: optionalReport,
      source_bridge_design: sourceBridgeDesign,
      disabled_bridge_skeleton: buildSkeleton({
        tempToProductBridgeDesign: sourceBridgeDesign,
        sourceBridgeDesignReportPassed: reportPassed,
      }),
      source_selection: {
        optional_report_present: true,
        source_used: "optional_bridge_design_report",
        fallback_to_committed_fixture: false,
      },
    };
  }
  if (testCase.target_fixture === "helper_built_skeleton_from_bridge_design") {
    return buildSkeleton({
      tempToProductBridgeDesign: fixtures.bridgeDesignFixture,
    });
  }
  if (testCase.target_fixture === "runner_fixture_mode_report") {
    return buildRunnerFixtureModeReport(fixtures.skeletonFixture);
  }
  if (testCase.target_fixture === "static_repo_boundary") {
    return validateStaticRepoBoundary();
  }
  return applyMutationPatch(
    fixtures.skeletonFixture,
    testCase.mutated_fixture_patch,
  );
}

function validateTarget(testCase, target, fixtures) {
  if (testCase.target_fixture === "source_bridge_design") {
    const targetRecord = asRecord(target);
    return mergeValidationResults(
      validateSourceBridgeDesign(targetRecord.source_bridge_design),
      validateSkeletonArtifact(
        targetRecord.disabled_bridge_skeleton,
        targetRecord.source_bridge_design,
      ),
    );
  }
  if (testCase.target_fixture === "optional_bridge_design_report") {
    const targetRecord = asRecord(target);
    return mergeValidationResults(
      validateOptionalBridgeDesignReport(
        targetRecord.optional_bridge_design_report,
        targetRecord.source_selection,
      ),
      validateSourceBridgeDesign(targetRecord.source_bridge_design),
      validateSkeletonArtifact(
        targetRecord.disabled_bridge_skeleton,
        targetRecord.source_bridge_design,
      ),
    );
  }
  if (testCase.target_fixture === "runner_fixture_mode_report") {
    return validateRunnerFixtureModeReport(target);
  }
  if (testCase.target_fixture === "static_repo_boundary") {
    return asValidationResult(target);
  }
  return validateSkeletonArtifact(target, fixtures.bridgeDesignFixture);
}

function validateSkeletonArtifact(skeleton, sourceBridgeDesign) {
  const failures = [];
  const messages = [];
  const skeletonRecord = asRecord(skeleton);
  if (skeletonRecord.skeleton_version !== SKELETON_VERSION) {
    failures.push("skeleton_version_invalid");
  }
  if (
    skeletonRecord.disabled_bridge_skeleton_status !==
    "single_claim_disabled_bridge_skeleton_only"
  ) {
    failures.push("skeleton_status_not_ready");
  }
  if (skeletonRecord.recommendation_status !== READY_SKELETON_RECOMMENDATION) {
    failures.push("skeleton_recommendation_status_not_ready");
  }
  if (skeletonRecord.next_recommended_slice !== NEXT_CONTRACT_TEST_SLICE) {
    failures.push("skeleton_next_recommended_slice_invalid");
  }
  if (/product_write/i.test(String(skeletonRecord.next_recommended_slice))) {
    failures.push("skeleton_next_recommended_slice_points_to_product_write");
  }
  if (skeletonRecord.bridge_adapter_enabled !== false) {
    failures.push("bridge_adapter_enabled");
  }
  if (skeletonRecord.bridge_execution_allowed_now !== false) {
    failures.push("bridge_execution_allowed_now");
  }
  if (skeletonRecord.product_write_allowed_now !== false) {
    failures.push("product_write_allowed_now");
  }
  if (skeletonRecord.product_db_write !== false) {
    failures.push("product_db_write");
  }
  if (skeletonRecord.product_id_allocation !== false) {
    failures.push("product_id_allocation");
  }
  const disabledAdapterBoundary = asRecord(
    skeletonRecord.disabled_adapter_boundary,
  );
  if (disabledAdapterBoundary.adapter_enabled !== false) {
    failures.push("disabled_adapter_boundary_adapter_enabled");
  }
  if (disabledAdapterBoundary.adapter_invocation_allowed_now !== false) {
    failures.push("disabled_adapter_boundary_adapter_invocation_allowed_now");
  }
  failures.push(
    ...validateSkeletonForbiddenSurfaces(
      skeletonRecord.explicit_forbidden_surfaces,
    ).failureCodes,
    ...validateFutureProductWriteIntent(
      skeletonRecord.future_product_write_intent,
    ).failureCodes,
    ...validatePlaceholderRecordMapping(
      skeletonRecord.placeholder_record_mapping,
    ).failureCodes,
    ...validateLocalCopyPacket(skeletonRecord.local_copy_packet).failureCodes,
    ...validateSourceEvidenceSummary(skeletonRecord.source_evidence).failureCodes,
    ...validateSourceBridgeDesign(sourceBridgeDesign).failureCodes,
  );
  if (hasNonNullProductIds(skeletonRecord)) {
    failures.push("skeleton_product_id_present");
  }
  return { failureCodes: unique(failures), messages };
}

function validateSourceBridgeDesign(sourceBridgeDesign) {
  const failures = [];
  const messages = [];
  const bridgeDesign = asRecord(sourceBridgeDesign);
  if (!hasOwn(bridgeDesign, "recommendation_status")) {
    failures.push("source_bridge_recommendation_status_missing");
  } else if (bridgeDesign.recommendation_status !== READY_SOURCE_RECOMMENDATION) {
    failures.push("source_bridge_recommendation_status_not_ready");
  }
  if (!hasOwn(bridgeDesign, "bridge_design_status")) {
    failures.push("source_bridge_bridge_design_status_missing");
  } else if (bridgeDesign.bridge_design_status !== "single_claim_bridge_design_only") {
    failures.push("source_bridge_bridge_design_status_invalid");
  }
  if (!hasOwn(bridgeDesign, "next_recommended_slice")) {
    failures.push("source_bridge_next_recommended_slice_missing");
  } else if (
    bridgeDesign.next_recommended_slice !==
    "single_claim_temp_to_product_disabled_bridge_skeleton"
  ) {
    failures.push("source_bridge_next_recommended_slice_invalid");
  }
  const inputContract = asRecord(bridgeDesign.bridge_input_contract);
  for (const field of SOURCE_INPUT_CONTRACT_FIELDS) {
    if (typeof inputContract[field] !== "string" || inputContract[field] === "") {
      failures.push(`source_bridge_input_contract_${field}_missing`);
    }
  }
  failures.push(
    ...validateSourceForbiddenSurfaces(
      bridgeDesign.explicit_forbidden_surfaces,
    ).failureCodes,
  );
  if (hasNonNullProductIds(bridgeDesign)) {
    failures.push("source_bridge_product_id_present");
  }
  return { failureCodes: unique(failures), messages };
}

function validateOptionalBridgeDesignReport(report, sourceSelection) {
  const failures = [];
  const messages = [];
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    failures.push("optional_bridge_design_report_malformed");
    return { failureCodes: failures, messages };
  }
  const reportRecord = asRecord(report);
  if (!hasOwn(reportRecord, "final_status")) {
    failures.push("optional_bridge_design_report_final_status_missing");
  } else if (reportRecord.final_status !== "pass") {
    failures.push("optional_bridge_design_report_not_passed");
  }
  if (
    !hasOwn(reportRecord, "temp_to_product_bridge_design") ||
    Object.keys(asRecord(reportRecord.temp_to_product_bridge_design)).length === 0
  ) {
    failures.push("optional_bridge_design_missing_temp_to_product_bridge_design");
  }
  const selection = asRecord(sourceSelection);
  if (
    selection.optional_report_present !== true ||
    selection.source_used !== "optional_bridge_design_report" ||
    selection.fallback_to_committed_fixture !== false
  ) {
    failures.push("optional_bridge_design_report_no_fallback");
  }
  return { failureCodes: unique(failures), messages };
}

function validateSourceEvidenceSummary(sourceEvidence) {
  const failures = [];
  const summary = asRecord(
    asRecord(sourceEvidence).temp_to_product_bridge_design,
  );
  if (summary.recommendation_status !== READY_SOURCE_RECOMMENDATION) {
    failures.push("source_bridge_evidence_summary_not_ready");
  }
  if (summary.bridge_design_status !== "single_claim_bridge_design_only") {
    failures.push("source_bridge_evidence_summary_status_invalid");
  }
  if (
    summary.next_recommended_slice !==
    "single_claim_temp_to_product_disabled_bridge_skeleton"
  ) {
    failures.push("source_bridge_evidence_summary_next_slice_invalid");
  }
  const inputSummary = asRecord(summary.bridge_input_contract_summary);
  for (const field of SOURCE_INPUT_CONTRACT_FIELDS) {
    if (typeof inputSummary[field] !== "string" || inputSummary[field] === "") {
      failures.push(`source_bridge_evidence_summary_${field}_missing`);
    }
  }
  for (const failure of validateSourceForbiddenSurfaces(
    summary.explicit_forbidden_surfaces,
  ).failureCodes) {
    failures.push(`source_evidence_${failure}`);
  }
  return { failureCodes: unique(failures), messages: [] };
}

function validateSourceForbiddenSurfaces(value) {
  const failures = [];
  const surfaces = asRecord(value);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push("source_bridge_explicit_forbidden_surfaces_missing");
  }
  if (Object.keys(surfaces).length === 0) {
    failures.push("source_bridge_explicit_forbidden_surfaces_empty");
  }
  for (const key of SOURCE_FORBIDDEN_SURFACE_KEYS) {
    if (surfaces[key] !== false) {
      failures.push(`source_bridge_forbidden_surface_${key}_not_false`);
    }
  }
  return { failureCodes: unique(failures), messages: [] };
}

function validateSkeletonForbiddenSurfaces(value) {
  const failures = [];
  const surfaces = asRecord(value);
  for (const key of SKELETON_FORBIDDEN_SURFACE_KEYS) {
    if (surfaces[key] !== false) {
      failures.push(`skeleton_forbidden_surface_${key}_not_false`);
    }
  }
  return { failureCodes: unique(failures), messages: [] };
}

function validateFutureProductWriteIntent(value) {
  const failures = [];
  const intent = asRecord(value);
  if (intent.product_claim_id !== null) {
    failures.push("future_product_write_intent_product_claim_id_present");
  }
  if (intent.product_write_statement_count !== 0) {
    failures.push("future_product_write_intent_product_write_statement_count_nonzero");
  }
  if (intent.sql_statement_count !== 0) {
    failures.push("future_product_write_intent_sql_statement_count_nonzero");
  }
  if (intent.db_opened !== false) {
    failures.push("future_product_write_intent_db_opened");
  }
  if (intent.route_added !== false) {
    failures.push("future_product_write_intent_route_added");
  }
  if (intent.ui_action_added !== false) {
    failures.push("future_product_write_intent_ui_action_added");
  }
  if (intent.execution_status !== "blocked_disabled_skeleton_only") {
    failures.push("future_product_write_intent_execution_status_invalid");
  }
  return { failureCodes: unique(failures), messages: [] };
}

function validatePlaceholderRecordMapping(value) {
  const failures = [];
  const mapping = asRecord(value);
  for (const key of [
    "product_idempotency_record_id",
    "product_rollback_record_id",
    "product_audit_record_id",
  ]) {
    if (mapping[key] !== null) {
      failures.push(`placeholder_record_mapping_${key}_present`);
    }
  }
  for (const key of [
    "idempotency_write_executed_now",
    "rollback_write_executed_now",
    "audit_write_executed_now",
  ]) {
    if (mapping[key] !== false) {
      failures.push(`placeholder_record_mapping_${key}`);
    }
  }
  return { failureCodes: unique(failures), messages: [] };
}

function validateLocalCopyPacket(value) {
  const failures = [];
  const packet = asRecord(value);
  if (packet.local_clipboard_only !== true) {
    failures.push("local_copy_packet_local_clipboard_only_not_true");
  }
  for (const key of [
    "external_handoff_sent",
    "packet_persisted_to_product_db",
    "adapter_enabled",
    "bridge_execution_allowed_now",
    "product_write_allowed_now",
    "product_write_authority_granted",
  ]) {
    if (packet[key] !== false) failures.push(`local_copy_packet_${key}`);
  }
  return { failureCodes: unique(failures), messages: [] };
}

function validateRunnerFixtureModeReport(report) {
  const failures = [];
  const reportRecord = asRecord(report);
  const validation = asRecord(reportRecord.disabled_bridge_skeleton_validation);
  if (reportRecord.final_status !== "pass") {
    failures.push("runner_fixture_mode_report_not_passed");
  }
  if (validation.passed !== true) {
    failures.push("runner_fixture_mode_validation_not_passed");
  }
  if (
    reportRecord.report_kind !==
    "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_report"
  ) {
    failures.push("runner_fixture_mode_report_kind_invalid");
  }
  const skeleton = reportRecord.disabled_bridge_skeleton;
  failures.push(
    ...validateSkeletonArtifact(
      skeleton,
      asRecord(skeleton).source_bridge_design_for_contract_test ?? {},
    ).failureCodes.filter(
      (failure) => !failure.startsWith("source_bridge_"),
    ),
  );
  return { failureCodes: unique(failures), messages: [] };
}

function validateStaticRepoBoundary() {
  const failures = [];
  const messages = [];
  const routeFiles = listFiles("app/api").filter((filePath) =>
    /single-claim-temp-to-product-disabled-bridge-skeleton-contract|disabled-bridge-skeleton-contract-tests/i.test(
      filePath,
    ),
  );
  if (routeFiles.length > 0) {
    failures.push("static_app_api_route_added");
    messages.push(`unexpected API route files: ${routeFiles.join(", ")}`);
  }
  const uiFiles = listFiles("components").filter((filePath) =>
    /single-claim-temp-to-product-disabled-bridge-skeleton-contract|disabled-bridge-skeleton-contract-tests/i.test(
      filePath,
    ),
  );
  if (uiFiles.length > 0) {
    failures.push("static_ui_file_added");
    messages.push(`unexpected UI files: ${uiFiles.join(", ")}`);
  }
  for (const filePath of readGitChangedFiles()) {
    if (
      /(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
        filePath,
      ) ||
      /^lib\/db(\.ts|\/)/.test(filePath)
    ) {
      failures.push("static_schema_or_migration_changed");
      messages.push(`schema/migration/db/sql path changed: ${filePath}`);
    }
  }
  for (const line of readAddedPackageLines()) {
    if (
      !line.includes(
        '"smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1"',
      ) &&
      !line.includes(
        '"contracts:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1"',
      )
    ) {
      failures.push("static_dependency_added");
      messages.push(`unexpected package.json addition: ${line}`);
    }
  }
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
      failures.push("static_network_or_external_handoff_present");
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
  return { failureCodes: unique(failures), messages };
}

function buildSkeleton({
  tempToProductBridgeDesign,
  sourceBridgeDesignReportPassed = true,
}) {
  const bridgeDesign = asRecord(tempToProductBridgeDesign);
  const bridgeInputContract = asRecord(bridgeDesign.bridge_input_contract);
  const futureProductClaimDraft = asRecord(bridgeDesign.future_product_claim_draft);
  const futureProductIdempotencyDesign = asRecord(
    bridgeDesign.future_product_idempotency_design,
  );
  const futureProductRollbackDesign = asRecord(
    bridgeDesign.future_product_rollback_design,
  );
  const futureProductAuditDesign = asRecord(bridgeDesign.future_product_audit_design);
  const sourceBridgeEvidenceClean =
    allFalse(asRecord(bridgeDesign.explicit_forbidden_surfaces)) &&
    !hasNonNullProductIds(bridgeDesign);
  const sourceBridgeReady =
    bridgeDesign.recommendation_status === READY_SOURCE_RECOMMENDATION &&
    sourceBridgeDesignReportPassed === true &&
    sourceBridgeEvidenceClean;
  const disabledBridgeSkeletonStatus = sourceBridgeReady
    ? "single_claim_disabled_bridge_skeleton_only"
    : "blocked_before_disabled_bridge_skeleton";
  const recommendationStatus = sourceBridgeReady
    ? READY_SKELETON_RECOMMENDATION
    : "blocked_before_disabled_bridge_skeleton_contract_tests";
  const nextRecommendedSlice = sourceBridgeReady
    ? NEXT_CONTRACT_TEST_SLICE
    : "single_claim_temp_to_product_bridge_design_recheck";
  const skeletonCore = {
    skeleton_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton",
    skeleton_version: SKELETON_VERSION,
    skeleton_fingerprint: "",
    source_evidence: {
      temp_to_product_bridge_design: {
        design_fingerprint: asString(bridgeDesign.design_fingerprint),
        bridge_design_status: asString(bridgeDesign.bridge_design_status),
        recommendation_status: asString(bridgeDesign.recommendation_status),
        next_recommended_slice: asString(bridgeDesign.next_recommended_slice),
        bridge_input_contract_summary: {
          selected_temp_claim_record_id: asString(
            bridgeInputContract.selected_temp_claim_record_id,
          ),
          source_operation_id: asString(bridgeInputContract.source_operation_id),
          source_temp_intent_id: asString(
            bridgeInputContract.source_temp_intent_id,
          ),
          temp_idempotency_key: asString(bridgeInputContract.temp_idempotency_key),
          gate_design_fingerprint: asString(
            bridgeInputContract.gate_design_fingerprint,
          ),
          result_contract_evidence_fingerprint: asString(
            bridgeInputContract.result_contract_evidence_fingerprint,
          ),
          operator_decision_status: asString(
            bridgeInputContract.operator_decision_status,
          ),
        },
        future_product_claim_draft_summary: {
          candidate_kind: asString(futureProductClaimDraft.candidate_kind),
          source_temp_claim_record_id: asString(
            futureProductClaimDraft.source_temp_claim_record_id,
          ),
          source_operation_id: asString(
            futureProductClaimDraft.source_operation_id,
          ),
          source_temp_intent_id: asString(
            futureProductClaimDraft.source_temp_intent_id,
          ),
          product_claim_id: null,
          product_claim_id_allocation_status: asString(
            futureProductClaimDraft.product_claim_id_allocation_status,
          ),
          raw_manual_note_text_included: false,
          proof_id: null,
          evidence_id: null,
          perspective_id: null,
          work_item_id: null,
        },
        idempotency_design_summary: {
          key_inputs: asRecord(futureProductIdempotencyDesign.key_inputs),
          storage_status: asString(futureProductIdempotencyDesign.storage_status),
          product_idempotency_record_id: null,
          idempotency_write_executed_now: false,
        },
        rollback_design_summary: {
          strategy: asString(futureProductRollbackDesign.strategy),
          rollback_storage_status: asString(
            futureProductRollbackDesign.rollback_storage_status,
          ),
          product_rollback_record_id: null,
          rollback_write_executed_now: false,
        },
        audit_design_summary: {
          records_operator_decision: asString(
            futureProductAuditDesign.records_operator_decision,
          ),
          records_gate_evidence:
            futureProductAuditDesign.records_gate_evidence === true,
          records_bridge_design_inputs:
            futureProductAuditDesign.records_bridge_design_inputs === true,
          product_audit_record_id: null,
          audit_write_executed_now: false,
        },
        explicit_forbidden_surfaces: readBooleanRecord(
          bridgeDesign.explicit_forbidden_surfaces,
        ),
      },
    },
    disabled_bridge_skeleton_status: disabledBridgeSkeletonStatus,
    bridge_adapter_enabled: false,
    bridge_execution_allowed_now: false,
    product_write_allowed_now: false,
    product_db_write: false,
    product_id_allocation: false,
    disabled_adapter_boundary: disabledAdapterBoundary(),
    future_product_write_intent: {
      product_claim_id: null,
      product_write_statement_count: 0,
      sql_statement_count: 0,
      db_opened: false,
      route_added: false,
      ui_action_added: false,
      execution_status: "blocked_disabled_skeleton_only",
    },
    placeholder_record_mapping: {
      product_idempotency_record_id: null,
      product_rollback_record_id: null,
      product_audit_record_id: null,
      idempotency_write_executed_now: false,
      rollback_write_executed_now: false,
      audit_write_executed_now: false,
    },
    explicit_forbidden_surfaces: explicitForbiddenSurfaces(),
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
  const fingerprint = createFingerprint(skeletonCore);
  const skeleton = {
    ...skeletonCore,
    skeleton_fingerprint: fingerprint,
  };
  return {
    ...skeleton,
    local_copy_packet: {
      markdown: "",
      json: JSON.stringify(stripLocalCopyPacket(skeleton), null, 2),
      fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted_to_product_db: false,
      adapter_enabled: false,
      bridge_execution_allowed_now: false,
      product_write_allowed_now: false,
      product_write_authority_granted: false,
    },
  };
}

function buildRunnerFixtureModeReport(skeletonFixture) {
  const validation = validateSkeletonArtifact(skeletonFixture, {});
  return {
    report_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_report",
    report_version: SKELETON_VERSION,
    optional_inputs: {
      fixture_mode: true,
      bridge_design_report_present: false,
      bridge_design_report_final_status: null,
    },
    disabled_bridge_skeleton: skeletonFixture,
    disabled_bridge_skeleton_validation: {
      passed: validation.failureCodes.filter(
        (failure) => !failure.startsWith("source_bridge_"),
      ).length === 0,
      failures: validation.failureCodes.filter(
        (failure) => !failure.startsWith("source_bridge_"),
      ),
    },
    final_status: "pass",
  };
}

function buildReadyOptionalBridgeDesignReport(bridgeDesignFixture) {
  return {
    report_kind:
      "manual_note_single_claim_temp_to_product_bridge_design_report",
    report_version: "manual_note_single_claim_temp_to_product_bridge_design.v0.1",
    final_status: "pass",
    temp_to_product_bridge_design: cloneJson(bridgeDesignFixture),
  };
}

function summarizeTestedBoundaries(testCasesFixture, caseResults) {
  const testCases = asArray(asRecord(testCasesFixture).test_cases).map(asRecord);
  const caseKinds = new Set(testCases.map((testCase) => testCase.case_kind));
  const failureCodes = new Set(
    caseResults.flatMap((result) => result.expected_failure_codes),
  );
  return {
    minimum_case_count_met: caseResults.length >= 45,
    upstream_bridge_design_readiness: caseKinds.has("upstream_readiness_failure"),
    optional_report_status_handling: caseKinds.has("optional_report_failure"),
    failed_optional_report_no_fallback: Boolean(
      testCases.find(
        (testCase) =>
          testCase.case_id ===
          "negative_optional_report_fail_ready_nested_must_not_fallback",
      ),
    ),
    source_forbidden_surface_contamination: caseKinds.has(
      "source_forbidden_surface_contamination",
    ),
    source_product_id_contamination: caseKinds.has(
      "source_product_id_contamination",
    ),
    skeleton_output_boundary_mutations: caseKinds.has(
      "skeleton_output_boundary_failure",
    ),
    static_repo_boundary_checks: caseKinds.has("static_repo_boundary"),
    local_copy_packet_boundary_flags: Boolean(
      testCases.find(
        (testCase) =>
          testCase.case_id === "positive_local_copy_packet_boundary_flags_false",
      ),
    ),
    disabled_adapter_boundary: failureCodes.has(
      "disabled_adapter_boundary_adapter_enabled",
    ),
    no_product_write_boundary: failureCodes.has("product_write_allowed_now"),
    no_product_id_allocation_boundary: failureCodes.has("product_id_allocation"),
    next_slice_is_disabled_dry_run_transaction_plan: true,
  };
}

function preservedBoundariesIntact(testedBoundaries) {
  const boundaries = asRecord(testedBoundaries);
  return [
    "no_product_db_write",
    "no_product_id_allocation",
    "no_db_open",
    "no_sql_execution",
    "no_product_write_route",
    "no_ui_write_action",
    "no_adapter_enablement",
    "no_schema_migration_dependency_change",
    "no_proof_evidence_write",
    "no_perspective_or_canonical_graph_write",
    "no_work_item_creation",
    "no_source_fetch",
    "no_provider_or_openai_call",
    "no_retrieval_or_rag",
    "no_external_handoff",
    "no_browser_persistence",
    "no_local_runtime_requirement",
  ].every((key) => boundaries[key] === true);
}

function applyMutationPatch(value, patch) {
  let next = cloneJson(value);
  for (const operation of asArray(asRecord(patch).replace)) {
    const op = asRecord(operation);
    const opPath = asArray(op.path);
    if (opPath.length === 0) {
      next = cloneJson(op.value);
    } else {
      setAtPath(next, opPath, cloneJson(op.value));
    }
  }
  for (const operation of asArray(asRecord(patch).set)) {
    const op = asRecord(operation);
    setAtPath(next, asArray(op.path), cloneJson(op.value));
  }
  for (const operation of asArray(asRecord(patch).unset)) {
    const op = asRecord(operation);
    unsetAtPath(next, asArray(op.path));
  }
  return next;
}

function setAtPath(target, opPath, value) {
  if (opPath.length === 0) return;
  let current = target;
  for (let index = 0; index < opPath.length - 1; index += 1) {
    const key = opPath[index];
    const nextKey = opPath[index + 1];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = typeof nextKey === "number" ? [] : {};
    }
    current = current[key];
  }
  current[opPath[opPath.length - 1]] = value;
}

function unsetAtPath(target, opPath) {
  if (opPath.length === 0) return;
  let current = target;
  for (let index = 0; index < opPath.length - 1; index += 1) {
    const key = opPath[index];
    if (!current[key] || typeof current[key] !== "object") return;
    current = current[key];
  }
  delete current[opPath[opPath.length - 1]];
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function readBooleanRecord(value) {
  return Object.fromEntries(
    Object.entries(asRecord(value)).map(([key, nestedValue]) => [
      key,
      nestedValue === true,
    ]),
  );
}

function disabledAdapterBoundary() {
  return {
    adapter_kind: "manual_note_single_claim_temp_to_product_disabled_bridge",
    adapter_enabled: false,
    adapter_invocation_allowed_now: false,
    adapter_execution_mode: "disabled_dry_boundary_only",
    adapter_would_accept_candidate_kind: "manual_note_single_claim",
    adapter_would_accept_one_selected_claim_only: true,
    adapter_rejects_blocked_bridge_design: true,
    adapter_rejects_missing_operator_decision: true,
    adapter_rejects_missing_product_schema_contract: true,
    adapter_rejects_missing_idempotency_storage_contract: true,
    adapter_rejects_missing_rollback_storage_contract: true,
    adapter_rejects_missing_audit_storage_contract: true,
  };
}

function explicitForbiddenSurfaces() {
  return {
    product_db_write: false,
    product_id_allocation: false,
    product_route: false,
    product_write_adapter_enabled: false,
    sql_execution: false,
    db_open: false,
    schema_or_migration_change: false,
    proof_evidence_write: false,
    perspective_or_canonical_graph_write: false,
    work_item_creation: false,
    source_fetch: false,
    provider_or_openai_call: false,
    retrieval_or_rag: false,
    external_handoff: false,
    browser_persistence: false,
    ui_write_action: false,
  };
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

function readGitChangedFiles() {
  return readGitOutput(["diff", "--name-only"])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readAddedPackageLines() {
  return readGitOutput(["diff", "--", "package.json"])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
}

function readGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return "";
  }
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

function forbiddenImportPattern() {
  return /from\s+["'][^"']*(lib\/db|better-sqlite3|sqlite3|app\/|openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i;
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
  return new RegExp(`\\b(${probes.join("|")})\\b`, "i");
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

function asValidationResult(value) {
  const record = asRecord(value);
  return {
    failureCodes: asArray(record.failureCodes).filter(
      (failure) => typeof failure === "string",
    ),
    messages: asArray(record.messages).filter(
      (message) => typeof message === "string",
    ),
  };
}

function mergeValidationResults(...results) {
  return {
    failureCodes: unique(results.flatMap((result) => result.failureCodes)),
    messages: results.flatMap((result) => result.messages),
  };
}

function hasNonNullProductIds(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasNonNullProductIds(item));
  }
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nestedValue]) => {
    if (PRODUCT_ID_KEYS.includes(key)) return nestedValue !== null;
    return hasNonNullProductIds(nestedValue);
  });
}

function allFalse(record) {
  return Object.keys(record).length > 0
    ? Object.values(record).every((value) => value === false)
    : false;
}

function stripLocalCopyPacket(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripLocalCopyPacket(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "local_copy_packet")
        .map(([key, nestedValue]) => [key, stripLocalCopyPacket(nestedValue)]),
    );
  }
  return value;
}

function canonicalSkeletonForFingerprint(value) {
  const copy = stripLocalCopyPacket(value);
  if (copy && typeof copy === "object" && !Array.isArray(copy)) {
    return {
      ...copy,
      skeleton_fingerprint: "",
    };
  }
  return copy;
}

function stripGeneratedFields(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "generated_at")
        .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
    );
  }
  return value;
}

function createFingerprint(input) {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function unique(values) {
  return [...new Set(values)];
}

function hasOwn(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function asString(value) {
  return typeof value === "string" ? value : null;
}

await main();
