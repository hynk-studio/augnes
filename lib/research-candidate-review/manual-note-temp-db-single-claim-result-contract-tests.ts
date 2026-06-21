export const MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_RESULT_CONTRACT_TESTS_VERSION =
  "manual_note_temp_db_single_claim_result_contract_tests.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type ContractTestStatus = "pass" | "fail" | "skipped";
type ReviewStatus =
  | "temp_result_review_passed"
  | "temp_result_review_needs_attention"
  | "temp_result_review_blocked";

type ContractTestCase = {
  case_id: string;
  case_kind: string;
  mutation_kind: string;
  target_fixture: string;
  expected_status: "pass" | "fail";
  expected_review_status?: ReviewStatus;
  expected_failure_codes?: string[];
  optional?: boolean;
  skip_when_optional_reports_missing?: boolean;
  mutated_fixture_patch?: MutationPatch;
};

type MutationPatch = {
  set?: MutationOperation[];
  unset?: MutationOperation[];
  replace?: MutationOperation[];
};

type MutationOperation = {
  path: Array<string | number>;
  value?: unknown;
};

type ContractFixtures = {
  resultReviewFixture?: unknown;
  tempDbHarnessFixture?: unknown;
  optionalResultReviewReport?: unknown | null;
  optionalTmpHarnessReport?: unknown | null;
  optionalBrowserReport?: unknown | null;
};

type ContractTestCaseResult = {
  case_id: string;
  case_kind: string;
  mutation_kind: string;
  expected_status: "pass" | "fail";
  actual_status: ContractTestStatus;
  case_status:
    | "passed"
    | "expected_failure"
    | "skipped"
    | "unexpected_pass"
    | "unexpected_failure";
  expected_review_status: ReviewStatus | null;
  actual_review_status: ReviewStatus | null;
  expected_failure_codes: string[];
  actual_failure_codes: string[];
  messages: string[];
  skip_reason: string | null;
};

type ContractTestReportInput = ContractFixtures & {
  testCasesFixture?: unknown;
  generated_at?: string | null;
};

const HARNESS_ARTIFACT_DIR = "/tmp/augnes-single-claim-write-prototype-v0-1";
const TEMP_TABLES = [
  "temp_claim_records",
  "temp_idempotency_records",
  "temp_rollback_records",
  "temp_review_audit_records",
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
  "audit_record_product_id",
];
const RAW_NOTE_PATTERN =
  /manual note raw text|verbatim manual note|raw note body|raw_manual_note_text_for_negative_contract_test/i;

export function buildManualNoteTempDbSingleClaimResultContractTestSuite(
  input: ContractTestReportInput,
): JsonRecord {
  const fixture = asRecord(input.testCasesFixture);
  const testCases = asArray(fixture.test_cases);
  return {
    suite_kind: "manual_note_temp_db_single_claim_result_contract_tests",
    suite_version: MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_RESULT_CONTRACT_TESTS_VERSION,
    suite_fingerprint: createManualNoteTempDbSingleClaimResultContractTestFingerprint(
      fixture,
    ),
    positive_fixture_chain: fixture.positive_fixture_chain ?? null,
    test_case_count: testCases.length,
    required_case_ids: testCases
      .map((testCase) => asRecord(testCase).case_id)
      .filter((caseId): caseId is string => typeof caseId === "string"),
    preserved_boundaries: fixture.preserved_boundaries ?? preservedBoundaries(),
  };
}

export function runManualNoteTempDbSingleClaimResultContractTestCase(
  testCase: ContractTestCase,
  fixtures: ContractFixtures,
): ContractTestCaseResult {
  return runContractTestCase(testCase, fixtures);
}

export function buildManualNoteTempDbSingleClaimResultContractTestReport(
  input: ContractTestReportInput,
): JsonRecord {
  const fixture = asRecord(input.testCasesFixture);
  const testCases = asArray(fixture.test_cases).map(
    (testCase) => asRecord(testCase) as ContractTestCase,
  );
  const fixtures: ContractFixtures = {
    resultReviewFixture: input.resultReviewFixture,
    tempDbHarnessFixture: input.tempDbHarnessFixture,
    optionalResultReviewReport: input.optionalResultReviewReport,
    optionalTmpHarnessReport: input.optionalTmpHarnessReport,
    optionalBrowserReport: input.optionalBrowserReport,
  };
  const caseResults = testCases.map((testCase) =>
    runContractTestCase(testCase, fixtures),
  );
  const unexpectedPasses = caseResults.filter(
    (result) => result.case_status === "unexpected_pass",
  );
  const unexpectedFailures = caseResults.filter(
    (result) => result.case_status === "unexpected_failure",
  );
  const positiveFixtureChainResult = runPositiveFixtureChain(fixtures);
  const optionalLiveReportCaseResult =
    caseResults.find(
      (result) => result.case_id === "positive_live_reports_all_pass_when_available",
    ) ?? null;
  const finalStatus =
    positiveFixtureChainResult.actual_status === "pass" &&
    unexpectedPasses.length === 0 &&
    unexpectedFailures.length === 0
      ? "pass"
      : "fail";

  return {
    report_kind: "manual_note_temp_db_single_claim_result_contract_test_report",
    report_version: MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_RESULT_CONTRACT_TESTS_VERSION,
    suite_fingerprint: createManualNoteTempDbSingleClaimResultContractTestFingerprint({
      fixture,
      case_results: caseResults,
    }),
    total_cases: caseResults.length,
    passed_cases: caseResults.filter((result) => result.case_status === "passed")
      .length,
    failed_cases: caseResults.filter((result) => result.actual_status === "fail")
      .length,
    skipped_cases: caseResults.filter((result) => result.actual_status === "skipped")
      .length,
    expected_failures: caseResults.filter(
      (result) => result.case_status === "expected_failure",
    ).length,
    unexpected_passes: unexpectedPasses,
    unexpected_failures: unexpectedFailures,
    case_results: caseResults,
    positive_fixture_chain_result: positiveFixtureChainResult,
    optional_live_report_case_result: optionalLiveReportCaseResult,
    preserved_boundaries: fixture.preserved_boundaries ?? preservedBoundaries(),
    final_status: finalStatus,
    next_recommended_slice:
      "temp_db_single_claim_result_review_hardening_or_product_write_gate_design",
  };
}

export function createManualNoteTempDbSingleClaimResultContractTestFingerprint(
  input: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function runContractTestCase(
  testCase: ContractTestCase,
  fixtures: ContractFixtures,
): ContractTestCaseResult {
  const expectedFailureCodes = testCase.expected_failure_codes ?? [];
  const optionalResult = maybeSkipOptionalCase(testCase, fixtures);
  if (optionalResult) {
    return optionalResult;
  }

  const target = buildTargetObject(testCase, fixtures);
  const reviewTarget =
    testCase.target_fixture === "browser_validation_report"
      ? asRecord(fixtures.resultReviewFixture)
      : target;
  const validation =
    testCase.target_fixture === "temp_db_harness_fixture"
      ? validateHarnessObject(target)
      : validateReviewObject(reviewTarget, {
          browserReport:
            testCase.target_fixture === "browser_validation_report"
              ? target
              : fixtures.optionalBrowserReport,
          enforceFingerprint:
            testCase.case_kind === "fixture_drift" ||
            testCase.case_kind === "positive_review_fixture" ||
            testCase.case_kind === "warning_review_fixture",
        });
  const actualStatus: ContractTestStatus =
    validation.failureCodes.length === 0 ? "pass" : "fail";
  const expectedCodesPresent = expectedFailureCodes.every((code) =>
    validation.failureCodes.includes(code),
  );
  const expectedStatusMatched =
    testCase.expected_status === actualStatus &&
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
    case_id: testCase.case_id,
    case_kind: testCase.case_kind,
    mutation_kind: testCase.mutation_kind,
    expected_status: testCase.expected_status,
    actual_status: actualStatus,
    case_status: caseStatus,
    expected_review_status: testCase.expected_review_status ?? null,
    actual_review_status: validation.actualReviewStatus,
    expected_failure_codes: expectedFailureCodes,
    actual_failure_codes: validation.failureCodes,
    messages: validation.messages,
    skip_reason: null,
  };
}

function maybeSkipOptionalCase(
  testCase: ContractTestCase,
  fixtures: ContractFixtures,
): ContractTestCaseResult | null {
  if (!testCase.optional && !testCase.skip_when_optional_reports_missing) return null;
  const liveReview = asRecord(asRecord(fixtures.optionalResultReviewReport).result_review);
  const canRunLiveCase =
    Object.keys(liveReview).length > 0 &&
    liveReview.review_status === "temp_result_review_passed";
  if (canRunLiveCase) return null;
  return {
    case_id: testCase.case_id,
    case_kind: testCase.case_kind,
    mutation_kind: testCase.mutation_kind,
    expected_status: testCase.expected_status,
    actual_status: "skipped",
    case_status: "skipped",
    expected_review_status: testCase.expected_review_status ?? null,
    actual_review_status: null,
    expected_failure_codes: testCase.expected_failure_codes ?? [],
    actual_failure_codes: [],
    messages: [],
    skip_reason:
      "Optional live all-pass result review report was absent or did not include all optional report-backed evidence.",
  };
}

function buildTargetObject(
  testCase: ContractTestCase,
  fixtures: ContractFixtures,
): JsonRecord {
  const baseline = selectBaselineObject(testCase.target_fixture, fixtures);
  const cloned = cloneJson(baseline);
  applyMutationPatch(cloned, testCase.mutated_fixture_patch);
  return cloned;
}

function selectBaselineObject(
  targetFixture: string,
  fixtures: ContractFixtures,
): JsonRecord {
  if (targetFixture === "temp_db_harness_fixture") {
    return asRecord(fixtures.tempDbHarnessFixture);
  }
  if (targetFixture === "optional_result_review_report") {
    return asRecord(asRecord(fixtures.optionalResultReviewReport).result_review);
  }
  if (targetFixture === "browser_validation_report") {
    return {
      final_status: "pass",
      external_request_count: 0,
      forbidden_request_count: 0,
    };
  }
  return asRecord(fixtures.resultReviewFixture);
}

function validateHarnessObject(harnessReport: JsonRecord): {
  actualReviewStatus: ReviewStatus;
  failureCodes: string[];
  messages: string[];
} {
  const harnessResult = asRecord(harnessReport.harness_result);
  const tempDbArtifact = asRecord(harnessResult.temp_db_artifact);
  const sqlSummary = asRecord(harnessResult.executed_sql_summary);
  const verification = asRecord(harnessResult.verification);
  const insertedRecords = asRecord(harnessResult.inserted_records);
  const tempClaimRecord = asRecord(insertedRecords.temp_claim_record);
  const failureCodes: string[] = [];
  const messages: string[] = [];

  if (harnessResult.result_status !== "temp_db_write_passed") {
    addFailure(failureCodes, messages, "harness_result_not_passed");
  }
  addRowCountFailures(failureCodes, messages, readRowCounts(verification.row_counts));
  if (verification.expected_row_counts_match !== true) {
    addFailure(failureCodes, messages, "expected_row_counts_not_matched");
  }
  if (sqlSummary.product_table_statement_count !== 0) {
    addFailure(failureCodes, messages, "product_table_statement_present");
  }
  if (tempDbArtifact.product_db_path_used !== false) {
    addFailure(failureCodes, messages, "product_db_path_used");
  }
  if (verification.product_db_untouched !== true) {
    addFailure(failureCodes, messages, "product_db_touched");
  }
  if (
    verification.product_ids_absent !== true ||
    !noNonNullProductIds(harnessReport)
  ) {
    addFailure(failureCodes, messages, "product_id_present");
  }
  if (
    verification.raw_manual_note_absent !== true ||
    tempClaimRecord.raw_manual_note_text_included !== false ||
    RAW_NOTE_PATTERN.test(JSON.stringify(harnessReport))
  ) {
    addFailure(failureCodes, messages, "raw_manual_note_present");
  }
  if (!isHarnessTempDbPath(asString(tempDbArtifact.temp_db_path))) {
    addFailure(failureCodes, messages, "temp_db_path_outside_harness");
  }
  if (tempDbArtifact.temp_db_under_tmp !== true) {
    addFailure(failureCodes, messages, "temp_db_under_tmp_false");
  }
  if (!boundaryIntact(asRecord(harnessResult.product_write_boundary), "temp_db_execution_only")) {
    addFailure(failureCodes, messages, "boundary_flag_enabled");
  }

  return {
    actualReviewStatus:
      failureCodes.length > 0
        ? "temp_result_review_blocked"
        : "temp_result_review_passed",
    failureCodes,
    messages,
  };
}

function validateReviewObject(
  review: JsonRecord,
  options: { browserReport?: unknown; enforceFingerprint?: boolean } = {},
): {
  actualReviewStatus: ReviewStatus;
  failureCodes: string[];
  messages: string[];
} {
  const failureCodes: string[] = [];
  const messages: string[] = [];
  const evidenceResults = asArray(review.evidence_check_results).map(asRecord);
  const evidenceHasWarn = evidenceResults.some((result) => result.status === "warn");
  const evidenceHasBlock = evidenceResults.some((result) => result.status === "block");
  const boundary = asRecord(review.product_write_boundary);
  const sourceHarness = asRecord(review.source_harness);
  const tempRecordSummary = readRowCounts(review.temp_record_summary);
  const insertedClaim = asRecord(review.inserted_claim_summary);
  const browserReport = asRecord(options.browserReport);

  if (sourceHarness.result_status !== "temp_db_write_passed") {
    addFailure(failureCodes, messages, "harness_result_not_passed");
  }
  addRowCountFailures(failureCodes, messages, tempRecordSummary);
  if (asRecord(review.temp_record_summary).exactly_one_each !== true) {
    addFailure(failureCodes, messages, "expected_row_counts_not_matched");
  }
  if (asRecord(review.evidence_checks).product_table_statement_count_zero !== true) {
    addFailure(failureCodes, messages, "product_table_statement_present");
  }
  if (asRecord(review.evidence_checks).product_db_path_used_false !== true) {
    addFailure(failureCodes, messages, "product_db_path_used");
  }
  if (asRecord(review.evidence_checks).product_db_untouched_true !== true) {
    addFailure(failureCodes, messages, "product_db_touched");
  }
  if (!noNonNullProductIds(review)) {
    addFailure(failureCodes, messages, "product_id_present");
  }
  if (
    asRecord(review.evidence_checks).raw_manual_note_absent !== true ||
    insertedClaim.raw_manual_note_text_included !== false ||
    RAW_NOTE_PATTERN.test(JSON.stringify(review))
  ) {
    addFailure(failureCodes, messages, "raw_manual_note_present");
  }
  if (!isHarnessTempDbPath(asString(sourceHarness.temp_db_path))) {
    addFailure(failureCodes, messages, "temp_db_path_outside_harness");
  }
  if (sourceHarness.temp_db_under_tmp !== true) {
    addFailure(failureCodes, messages, "temp_db_under_tmp_false");
  }
  if (!boundaryIntact(boundary, "result_review_only")) {
    addFailure(failureCodes, messages, "boundary_flag_enabled");
  }
  if (asNumber(browserReport.external_request_count) !== null) {
    if ((asNumber(browserReport.external_request_count) ?? 0) > 0) {
      addFailure(failureCodes, messages, "browser_external_request_present");
    }
  }
  if (asNumber(browserReport.forbidden_request_count) !== null) {
    if ((asNumber(browserReport.forbidden_request_count) ?? 0) > 0) {
      addFailure(failureCodes, messages, "browser_forbidden_request_present");
    }
  }
  if (options.enforceFingerprint && !reviewFingerprintMatches(review)) {
    addFailure(failureCodes, messages, "fixture_drift_detected");
  }

  const derivedStatus: ReviewStatus =
    evidenceHasBlock || failureCodes.length > 0
      ? "temp_result_review_blocked"
      : evidenceHasWarn
        ? "temp_result_review_needs_attention"
        : "temp_result_review_passed";
  if (review.review_status !== derivedStatus) {
    addFailure(failureCodes, messages, "review_status_mismatch");
  }
  if (
    derivedStatus === "temp_result_review_blocked" &&
    asRecord(review.next_stage_recommendation).recommendation_status ===
      "ready_for_temp_result_contract_tests"
  ) {
    addFailure(failureCodes, messages, "recommendation_status_mismatch");
  }

  return {
    actualReviewStatus: derivedStatus,
    failureCodes,
    messages,
  };
}

function runPositiveFixtureChain(fixtures: ContractFixtures): ContractTestCaseResult {
  return runContractTestCase(
    {
      case_id: "positive_fixture_chain",
      case_kind: "positive_review_fixture",
      mutation_kind: "none",
      target_fixture: "result_review_fixture",
      expected_status: "pass",
      expected_review_status: "temp_result_review_needs_attention",
      expected_failure_codes: [],
      mutated_fixture_patch: {},
    },
    fixtures,
  );
}

function addRowCountFailures(
  failureCodes: string[],
  messages: string[],
  rowCounts: Record<(typeof TEMP_TABLES)[number], number>,
) {
  if (!TEMP_TABLES.every((tableName) => rowCounts[tableName] === 1)) {
    addFailure(failureCodes, messages, "row_count_mismatch");
  }
}

function addFailure(codes: string[], messages: string[], code: string) {
  if (!codes.includes(code)) codes.push(code);
  messages.push(code);
}

function applyMutationPatch(target: JsonRecord, patch: MutationPatch | undefined) {
  if (!patch) return;
  for (const operation of patch.set ?? []) {
    setPath(target, operation.path, operation.value);
  }
  for (const operation of patch.replace ?? []) {
    setPath(target, operation.path, operation.value);
  }
  for (const operation of patch.unset ?? []) {
    unsetPath(target, operation.path);
  }
}

function setPath(target: JsonRecord, path: Array<string | number>, value: unknown) {
  let current: JsonRecord | unknown[] = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    if (typeof segment === "number" && Array.isArray(current)) {
      current[segment] = asRecord(current[segment]);
      current = current[segment] as JsonRecord;
      continue;
    }
    const record = asRecord(current);
    if (!record[String(segment)] || typeof record[String(segment)] !== "object") {
      record[String(segment)] = {};
    }
    current = record[String(segment)] as JsonRecord;
  }
  const finalSegment = path[path.length - 1];
  if (typeof finalSegment === "number" && Array.isArray(current)) {
    current[finalSegment] = value;
    return;
  }
  asRecord(current)[String(finalSegment)] = value;
}

function unsetPath(target: JsonRecord, path: Array<string | number>) {
  let current: JsonRecord | unknown[] = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    current =
      typeof segment === "number" && Array.isArray(current)
        ? (current[segment] as JsonRecord)
        : (asRecord(current)[String(segment)] as JsonRecord | unknown[]);
  }
  const finalSegment = path[path.length - 1];
  if (typeof finalSegment === "number" && Array.isArray(current)) {
    current.splice(finalSegment, 1);
    return;
  }
  delete asRecord(current)[String(finalSegment)];
}

function readRowCounts(value: unknown): Record<(typeof TEMP_TABLES)[number], number> {
  const record = asRecord(value);
  return {
    temp_claim_records: asNumber(record.temp_claim_records) ?? 0,
    temp_idempotency_records: asNumber(record.temp_idempotency_records) ?? 0,
    temp_rollback_records: asNumber(record.temp_rollback_records) ?? 0,
    temp_review_audit_records: asNumber(record.temp_review_audit_records) ?? 0,
  };
}

function boundaryIntact(boundary: JsonRecord, allowedTrueKey: string): boolean {
  if (boundary[allowedTrueKey] !== true) return false;
  return Object.entries(boundary).every(([key, value]) =>
    key === allowedTrueKey ? value === true : value === false,
  );
}

function noNonNullProductIds(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.every((item) => noNonNullProductIds(item));
  }
  if (!value || typeof value !== "object") return true;
  return Object.entries(value as JsonRecord).every(([key, nestedValue]) => {
    if (PRODUCT_ID_KEYS.includes(key)) return nestedValue === null;
    return noNonNullProductIds(nestedValue);
  });
}

function isHarnessTempDbPath(value: string | null): boolean {
  if (typeof value !== "string" || !value.endsWith(".sqlite")) return false;
  if (value.includes("/../")) return false;
  return value.startsWith(`${HARNESS_ARTIFACT_DIR}/`);
}

function reviewFingerprintMatches(review: JsonRecord): boolean {
  const expected = asString(review.review_fingerprint);
  if (!expected) return false;
  const clone = cloneJson(review);
  clone.review_fingerprint = "";
  return (
    createManualNoteTempDbSingleClaimResultContractTestFingerprint(clone) === expected
  );
}

function preservedBoundaries(): JsonRecord {
  return {
    fixture_only: true,
    product_db_write: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_product_persistence: false,
    browser_persistence: false,
  };
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "generated_at" && key !== "local_copy_packet")
      .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]);
    return Object.fromEntries(entries);
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

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
