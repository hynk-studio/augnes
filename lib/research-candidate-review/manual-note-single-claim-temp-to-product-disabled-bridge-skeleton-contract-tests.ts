import {
  buildManualNoteSingleClaimTempToProductDisabledBridgeSkeleton,
  createManualNoteSingleClaimTempToProductDisabledBridgeSkeletonFingerprint,
} from "./manual-note-single-claim-temp-to-product-disabled-bridge-skeleton";

export const MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_CONTRACT_TESTS_VERSION =
  "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type ContractTestStatus = "pass" | "fail";
type ContractCaseStatus =
  | "passed"
  | "expected_failure"
  | "unexpected_pass"
  | "unexpected_failure";

type MutationOperation = {
  path: Array<string | number>;
  value?: unknown;
};

type MutationPatch = {
  set?: MutationOperation[];
  unset?: MutationOperation[];
  replace?: MutationOperation[];
};

type ContractTestCase = {
  case_id: string;
  case_kind: string;
  mutation_kind: string;
  target_fixture: string;
  expected_status: ContractTestStatus;
  expected_failure_codes?: string[];
  mutated_fixture_patch?: MutationPatch;
};

type ContractFixtures = {
  skeletonFixture?: unknown;
  bridgeDesignFixture?: unknown;
  testCasesFixture?: unknown;
  staticBoundaryResult?: ValidationResult;
};

type ValidationResult = {
  failureCodes: string[];
  messages: string[];
};

type ContractTestCaseResult = {
  case_id: string;
  case_kind: string;
  mutation_kind: string;
  target_fixture: string;
  expected_status: ContractTestStatus;
  actual_status: ContractTestStatus;
  case_status: ContractCaseStatus;
  expected_failure_codes: string[];
  actual_failure_codes: string[];
  messages: string[];
};

const READY_SOURCE_RECOMMENDATION = "ready_for_disabled_bridge_skeleton";
const READY_SKELETON_RECOMMENDATION =
  "ready_for_disabled_bridge_skeleton_contract_tests";
const NEXT_CONTRACT_TEST_SLICE =
  "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests";
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
] as const;

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
] as const;

const SOURCE_INPUT_CONTRACT_FIELDS = [
  "selected_temp_claim_record_id",
  "source_operation_id",
  "source_temp_intent_id",
  "temp_idempotency_key",
  "gate_design_fingerprint",
  "result_contract_evidence_fingerprint",
] as const;

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
] as const;

export function buildManualNoteSingleClaimTempToProductDisabledBridgeSkeletonContractTestSuite(
  input: ContractFixtures,
): JsonRecord {
  const testCasesFixture = asRecord(input.testCasesFixture);
  const testCases = asArray(testCasesFixture.test_cases);
  return {
    suite_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests",
    suite_version:
      MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_CONTRACT_TESTS_VERSION,
    suite_fingerprint:
      createManualNoteSingleClaimTempToProductDisabledBridgeSkeletonContractTestFingerprint(
        testCasesFixture,
      ),
    source_skeleton_fingerprint: asString(
      asRecord(input.skeletonFixture).skeleton_fingerprint,
    ),
    total_cases: testCases.length,
    required_case_ids: testCases
      .map((testCase) => asRecord(testCase).case_id)
      .filter((caseId): caseId is string => typeof caseId === "string"),
    tested_boundaries: testCasesFixture.tested_boundaries ?? testedBoundaries(),
  };
}

export function runManualNoteSingleClaimTempToProductDisabledBridgeSkeletonContractTestCase(
  testCase: ContractTestCase,
  fixtures: ContractFixtures,
): ContractTestCaseResult {
  return runContractTestCase(testCase, fixtures);
}

export function buildManualNoteSingleClaimTempToProductDisabledBridgeSkeletonContractTestReport(
  input: ContractFixtures,
): JsonRecord {
  const testCasesFixture = asRecord(input.testCasesFixture);
  const testCases = asArray(testCasesFixture.test_cases).map(
    (testCase) => asRecord(testCase) as ContractTestCase,
  );
  const caseResults = testCases.map((testCase) =>
    runContractTestCase(testCase, input),
  );
  const unexpectedPasses = caseResults.filter(
    (result) => result.case_status === "unexpected_pass",
  );
  const unexpectedFailures = caseResults.filter(
    (result) => result.case_status === "unexpected_failure",
  );
  return {
    report_kind:
      "manual_note_single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_report",
    report_version:
      MANUAL_NOTE_SINGLE_CLAIM_TEMP_TO_PRODUCT_DISABLED_BRIDGE_SKELETON_CONTRACT_TESTS_VERSION,
    suite_fingerprint:
      createManualNoteSingleClaimTempToProductDisabledBridgeSkeletonContractTestFingerprint(
        {
          test_cases_fixture: testCasesFixture,
          case_results: caseResults,
        },
      ),
    source_skeleton_fingerprint: asString(
      asRecord(input.skeletonFixture).skeleton_fingerprint,
    ),
    total_cases: caseResults.length,
    positive_cases: caseResults.filter(
      (result) =>
        result.expected_status === "pass" && result.case_status === "passed",
    ).length,
    expected_negative_cases: caseResults.filter(
      (result) => result.case_status === "expected_failure",
    ).length,
    unexpected_passes: unexpectedPasses,
    unexpected_failures: unexpectedFailures,
    case_results: caseResults,
    tested_boundaries: testCasesFixture.tested_boundaries ?? testedBoundaries(),
    contract_suite_status:
      unexpectedPasses.length === 0 && unexpectedFailures.length === 0
        ? "disabled_bridge_skeleton_contract_tests_passed"
        : "disabled_bridge_skeleton_contract_tests_failed",
    recommendation_status:
      unexpectedPasses.length === 0 && unexpectedFailures.length === 0
        ? "ready_for_disabled_bridge_dry_run_transaction_plan"
        : "blocked_before_disabled_bridge_dry_run_transaction_plan",
    next_recommended_slice:
      unexpectedPasses.length === 0 && unexpectedFailures.length === 0
        ? NEXT_DRY_RUN_TRANSACTION_PLAN
        : "single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests_recheck",
    final_status:
      unexpectedPasses.length === 0 && unexpectedFailures.length === 0
        ? "pass"
        : "fail",
  };
}

export function createManualNoteSingleClaimTempToProductDisabledBridgeSkeletonContractTestFingerprint(
  input: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function runContractTestCase(
  testCase: ContractTestCase,
  fixtures: ContractFixtures,
): ContractTestCaseResult {
  const target = buildTargetObject(testCase, fixtures);
  const validation = validateTarget(testCase, target, fixtures);
  const actualStatus: ContractTestStatus =
    validation.failureCodes.length === 0 ? "pass" : "fail";
  const expectedFailureCodes = testCase.expected_failure_codes ?? [];
  const expectedCodesPresent = expectedFailureCodes.every((code) =>
    validation.failureCodes.includes(code),
  );
  const caseStatus: ContractCaseStatus =
    testCase.expected_status === "fail"
      ? actualStatus === "fail" && expectedCodesPresent
        ? "expected_failure"
        : "unexpected_pass"
      : actualStatus === "pass"
        ? "passed"
        : "unexpected_failure";
  return {
    case_id: testCase.case_id,
    case_kind: testCase.case_kind,
    mutation_kind: testCase.mutation_kind,
    target_fixture: testCase.target_fixture,
    expected_status: testCase.expected_status,
    actual_status: actualStatus,
    case_status: caseStatus,
    expected_failure_codes: expectedFailureCodes,
    actual_failure_codes: validation.failureCodes,
    messages: validation.messages,
  };
}

function buildTargetObject(
  testCase: ContractTestCase,
  fixtures: ContractFixtures,
): unknown {
  const bridgeDesignFixture = fixtures.bridgeDesignFixture;
  if (testCase.target_fixture === "source_bridge_design") {
    const bridgeDesign = applyMutationPatch(
      bridgeDesignFixture,
      testCase.mutated_fixture_patch,
    );
    return {
      source_bridge_design: bridgeDesign,
      skeleton:
        buildManualNoteSingleClaimTempToProductDisabledBridgeSkeleton({
          tempToProductBridgeDesign: bridgeDesign,
        }),
    };
  }
  if (testCase.target_fixture === "optional_bridge_design_report") {
    const optionalReport = applyMutationPatch(
      buildReadyOptionalBridgeDesignReport(bridgeDesignFixture),
      testCase.mutated_fixture_patch,
    );
    const optionalReportRecord = asRecord(optionalReport);
    const sourceBridgeDesign =
      optionalReportRecord.temp_to_product_bridge_design ?? {};
    const sourceReportPassed = optionalReportRecord.final_status === "pass";
    return {
      optional_bridge_design_report: optionalReport,
      source_bridge_design: sourceBridgeDesign,
      skeleton:
        buildManualNoteSingleClaimTempToProductDisabledBridgeSkeleton({
          tempToProductBridgeDesign: sourceBridgeDesign,
        }),
      source_report_passed: sourceReportPassed,
    };
  }
  if (testCase.target_fixture === "helper_built_skeleton_from_bridge_design") {
    return buildManualNoteSingleClaimTempToProductDisabledBridgeSkeleton({
      tempToProductBridgeDesign: bridgeDesignFixture,
    });
  }
  if (testCase.target_fixture === "static_repo_boundary") {
    return fixtures.staticBoundaryResult ?? { failureCodes: [], messages: [] };
  }
  return applyMutationPatch(fixtures.skeletonFixture, testCase.mutated_fixture_patch);
}

function validateTarget(
  testCase: ContractTestCase,
  target: unknown,
  fixtures: ContractFixtures,
): ValidationResult {
  if (testCase.target_fixture === "source_bridge_design") {
    const targetRecord = asRecord(target);
    return mergeValidationResults(
      validateSourceBridgeDesign(targetRecord.source_bridge_design),
      validateSkeletonArtifact(targetRecord.skeleton, targetRecord.source_bridge_design),
    );
  }
  if (testCase.target_fixture === "optional_bridge_design_report") {
    const targetRecord = asRecord(target);
    return mergeValidationResults(
      validateOptionalBridgeDesignReport(
        targetRecord.optional_bridge_design_report,
      ),
      validateSourceBridgeDesign(targetRecord.source_bridge_design),
      validateSkeletonArtifact(targetRecord.skeleton, targetRecord.source_bridge_design),
    );
  }
  if (testCase.target_fixture === "runner_fixture_mode_report") {
    return validateRunnerFixtureModeReport(fixtures.skeletonFixture);
  }
  if (testCase.target_fixture === "static_repo_boundary") {
    return asValidationResult(target);
  }
  return validateSkeletonArtifact(target, fixtures.bridgeDesignFixture);
}

function validateSkeletonArtifact(
  skeleton: unknown,
  sourceBridgeDesign: unknown,
): ValidationResult {
  const failures: string[] = [];
  const messages: string[] = [];
  const skeletonRecord = asRecord(skeleton);
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
  validateSkeletonForbiddenSurfaces(skeletonRecord.explicit_forbidden_surfaces)
    .failureCodes.forEach((failure) => failures.push(failure));
  validateFutureProductWriteIntent(skeletonRecord.future_product_write_intent)
    .failureCodes.forEach((failure) => failures.push(failure));
  validatePlaceholderRecordMapping(skeletonRecord.placeholder_record_mapping)
    .failureCodes.forEach((failure) => failures.push(failure));
  validateLocalCopyPacket(skeletonRecord.local_copy_packet).failureCodes.forEach(
    (failure) => failures.push(failure),
  );
  validateSourceEvidenceSummary(skeletonRecord.source_evidence).failureCodes.forEach(
    (failure) => failures.push(failure),
  );
  validateSourceBridgeDesign(sourceBridgeDesign).failureCodes.forEach((failure) =>
    failures.push(failure),
  );
  if (hasNonNullProductIds(skeletonRecord)) {
    failures.push("skeleton_product_id_present");
  }
  return { failureCodes: unique(failures), messages };
}

function validateSourceBridgeDesign(sourceBridgeDesign: unknown): ValidationResult {
  const failures: string[] = [];
  const messages: string[] = [];
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
  validateSourceForbiddenSurfaces(
    bridgeDesign.explicit_forbidden_surfaces,
  ).failureCodes.forEach((failure) => failures.push(failure));
  if (hasNonNullProductIds(bridgeDesign)) {
    failures.push("source_bridge_product_id_present");
  }
  return { failureCodes: unique(failures), messages };
}

function validateOptionalBridgeDesignReport(report: unknown): ValidationResult {
  const failures: string[] = [];
  const messages: string[] = [];
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
  return { failureCodes: unique(failures), messages };
}

function validateRunnerFixtureModeReport(skeletonFixture: unknown): ValidationResult {
  const skeletonValidation = validateSkeletonArtifact(skeletonFixture, {});
  const failures = skeletonValidation.failureCodes.filter(
    (failure) => !failure.startsWith("source_bridge_"),
  );
  return { failureCodes: unique(failures), messages: [] };
}

function validateSourceEvidenceSummary(sourceEvidence: unknown): ValidationResult {
  const failures: string[] = [];
  const summary = asRecord(
    asRecord(sourceEvidence).temp_to_product_bridge_design,
  );
  if (summary.recommendation_status !== READY_SOURCE_RECOMMENDATION) {
    failures.push("source_bridge_evidence_summary_not_ready");
  }
  const inputSummary = asRecord(summary.bridge_input_contract_summary);
  for (const field of SOURCE_INPUT_CONTRACT_FIELDS) {
    if (typeof inputSummary[field] !== "string" || inputSummary[field] === "") {
      failures.push(`source_bridge_evidence_summary_${field}_missing`);
    }
  }
  validateSourceForbiddenSurfaces(summary.explicit_forbidden_surfaces).failureCodes.forEach(
    (failure) => failures.push(`source_evidence_${failure}`),
  );
  return { failureCodes: unique(failures), messages: [] };
}

function validateSourceForbiddenSurfaces(value: unknown): ValidationResult {
  const failures: string[] = [];
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

function validateSkeletonForbiddenSurfaces(value: unknown): ValidationResult {
  const failures: string[] = [];
  const surfaces = asRecord(value);
  for (const key of SKELETON_FORBIDDEN_SURFACE_KEYS) {
    if (surfaces[key] !== false) {
      failures.push(`skeleton_forbidden_surface_${key}_not_false`);
    }
  }
  return { failureCodes: unique(failures), messages: [] };
}

function validateFutureProductWriteIntent(value: unknown): ValidationResult {
  const failures: string[] = [];
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

function validatePlaceholderRecordMapping(value: unknown): ValidationResult {
  const failures: string[] = [];
  const mapping = asRecord(value);
  for (const key of [
    "product_idempotency_record_id",
    "product_rollback_record_id",
    "product_audit_record_id",
  ]) {
    if (mapping[key] !== null) failures.push(`placeholder_record_mapping_${key}_present`);
  }
  for (const key of [
    "idempotency_write_executed_now",
    "rollback_write_executed_now",
    "audit_write_executed_now",
  ]) {
    if (mapping[key] !== false) failures.push(`placeholder_record_mapping_${key}`);
  }
  return { failureCodes: unique(failures), messages: [] };
}

function validateLocalCopyPacket(value: unknown): ValidationResult {
  const failures: string[] = [];
  const packet = asRecord(value);
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
  if (packet.local_clipboard_only !== true) {
    failures.push("local_copy_packet_local_clipboard_only_not_true");
  }
  return { failureCodes: unique(failures), messages: [] };
}

function applyMutationPatch(value: unknown, patch: MutationPatch | undefined): unknown {
  let next = cloneJson(value);
  for (const operation of patch?.replace ?? []) {
    if (operation.path.length === 0) {
      next = cloneJson(operation.value);
    } else {
      setAtPath(next, operation.path, cloneJson(operation.value));
    }
  }
  for (const operation of patch?.set ?? []) {
    setAtPath(next, operation.path, cloneJson(operation.value));
  }
  for (const operation of patch?.unset ?? []) {
    unsetAtPath(next, operation.path);
  }
  return next;
}

function buildReadyOptionalBridgeDesignReport(bridgeDesignFixture: unknown): JsonRecord {
  return {
    report_kind:
      "manual_note_single_claim_temp_to_product_bridge_design_report",
    final_status: "pass",
    temp_to_product_bridge_design: cloneJson(bridgeDesignFixture),
  };
}

function testedBoundaries(): JsonRecord {
  return {
    upstream_bridge_design_readiness: true,
    optional_report_status: true,
    source_forbidden_surface_contamination: true,
    source_product_id_contamination: true,
    skeleton_disabled_adapter_boundary: true,
    no_product_write: true,
    static_repo_boundary: true,
    next_slice_is_disabled_dry_run_transaction_plan: true,
  };
}

function asValidationResult(value: unknown): ValidationResult {
  const record = asRecord(value);
  return {
    failureCodes: asArray(record.failureCodes).filter(
      (failure): failure is string => typeof failure === "string",
    ),
    messages: asArray(record.messages).filter(
      (message): message is string => typeof message === "string",
    ),
  };
}

function mergeValidationResults(...results: ValidationResult[]): ValidationResult {
  return {
    failureCodes: unique(results.flatMap((result) => result.failureCodes)),
    messages: results.flatMap((result) => result.messages),
  };
}

function hasNonNullProductIds(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasNonNullProductIds(item));
  }
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as JsonRecord).some(([key, nestedValue]) => {
    if ((PRODUCT_ID_KEYS as readonly string[]).includes(key)) {
      return nestedValue !== null;
    }
    return hasNonNullProductIds(nestedValue);
  });
}

function setAtPath(target: unknown, path: Array<string | number>, value: unknown) {
  if (path.length === 0) return;
  let current = target as JsonRecord;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = String(path[index]);
    const nextKey = path[index + 1];
    const nextValue = current[key];
    if (!nextValue || typeof nextValue !== "object") {
      current[key] = typeof nextKey === "number" ? [] : {};
    }
    current = current[key] as JsonRecord;
  }
  current[String(path[path.length - 1])] = value;
}

function unsetAtPath(target: unknown, path: Array<string | number>) {
  if (path.length === 0) return;
  let current = target as JsonRecord;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = String(path[index]);
    if (!current[key] || typeof current[key] !== "object") return;
    current = current[key] as JsonRecord;
  }
  delete current[String(path[path.length - 1])];
}

function cloneJson(value: unknown): unknown {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as JsonRecord)
        .filter(([key]) => key !== "generated_at")
        .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
    );
  }
  return value;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function hasOwn(record: JsonRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export const DISABLED_BRIDGE_SKELETON_CONTRACT_TEST_SOURCE_SKELETON_FINGERPRINT_HELPER =
  createManualNoteSingleClaimTempToProductDisabledBridgeSkeletonFingerprint;
