import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const CONTRACT_TEST_VERSION =
  "manual_note_temp_db_single_claim_result_contract_tests.v0.1";
const ARTIFACT_DIR =
  "/tmp/augnes-temp-db-single-claim-result-contract-tests-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const CASE_RESULTS_PATH = path.join(ARTIFACT_DIR, "case-results.json");
const RESULT_REVIEW_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-review.sample.v0.1.json";
const TEMP_DB_HARNESS_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-write-prototype-harness.sample.v0.1.json";
const TEST_CASES_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-contract-test-cases.v0.1.json";
const OPTIONAL_RESULT_REVIEW_REPORT_PATH =
  "/tmp/augnes-temp-db-single-claim-result-review-v0-1/report.json";
const OPTIONAL_TMP_HARNESS_REPORT_PATH =
  "/tmp/augnes-single-claim-write-prototype-v0-1/report.json";
const OPTIONAL_BROWSER_REPORT_PATH =
  "/tmp/augnes-manual-note-lane-validation-v0-1/report.json";
const HARNESS_ARTIFACT_DIR = "/tmp/augnes-single-claim-write-prototype-v0-1";
const RESOLVED_HARNESS_ARTIFACT_DIR = path.resolve(HARNESS_ARTIFACT_DIR);
const TEMP_TABLES = [
  "temp_claim_records",
  "temp_idempotency_records",
  "temp_rollback_records",
  "temp_review_audit_records",
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
  "audit_record_product_id",
];
const RAW_NOTE_PATTERN =
  /manual note raw text|verbatim manual note|raw note body|raw_manual_note_text_for_negative_contract_test/i;

async function main() {
  await rm(ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const resultReviewFixture = await readJson(RESULT_REVIEW_FIXTURE_PATH);
  const tempDbHarnessFixture = await readJson(TEMP_DB_HARNESS_FIXTURE_PATH);
  const testCasesFixture = await readJson(TEST_CASES_FIXTURE_PATH);
  const optionalResultReviewReport = await readOptionalJson(
    OPTIONAL_RESULT_REVIEW_REPORT_PATH,
  );
  const optionalTmpHarnessReport = await readOptionalJson(
    OPTIONAL_TMP_HARNESS_REPORT_PATH,
  );
  const optionalBrowserReport = await readOptionalJson(OPTIONAL_BROWSER_REPORT_PATH);

  const report = buildReport({
    resultReviewFixture,
    tempDbHarnessFixture,
    testCasesFixture,
    optionalResultReviewReport,
    optionalTmpHarnessReport,
    optionalBrowserReport,
  });

  await writeFile(
    CASE_RESULTS_PATH,
    `${JSON.stringify(report.case_results, null, 2)}\n`,
  );
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        contracts:
          "research-candidate-temp-db-single-claim-result-contract-tests-v0-1",
        final_status: report.final_status,
        total_cases: report.total_cases,
        passed_cases: report.passed_cases,
        expected_failures: report.expected_failures,
        skipped_cases: report.skipped_cases,
        unexpected_passes: report.unexpected_passes.length,
        unexpected_failures: report.unexpected_failures.length,
        artifact_paths: report.artifact_paths,
      },
      null,
      2,
    ),
  );

  if (report.final_status !== "pass") {
    process.exitCode = 1;
  }
}

function buildReport({
  resultReviewFixture,
  tempDbHarnessFixture,
  testCasesFixture,
  optionalResultReviewReport,
  optionalTmpHarnessReport,
  optionalBrowserReport,
}) {
  const testCases = asArray(asRecord(testCasesFixture).test_cases).map(asRecord);
  const fixtures = {
    resultReviewFixture,
    tempDbHarnessFixture,
    optionalResultReviewReport,
    optionalTmpHarnessReport,
    optionalBrowserReport,
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
  const positiveFixtureChainResult = runContractTestCase(
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
  const optionalLiveReportCaseResult =
    caseResults.find(
      (result) => result.case_id === "positive_live_reports_all_pass_when_available",
    ) ?? null;
  const finalStatus =
    positiveFixtureChainResult.actual_status === "pass" &&
    unexpectedPasses.length === 0 &&
    unexpectedFailures.length === 0 &&
    preservedBoundariesIntact(asRecord(testCasesFixture).preserved_boundaries)
      ? "pass"
      : "fail";

  return {
    report_kind: "manual_note_temp_db_single_claim_result_contract_test_report",
    report_version: CONTRACT_TEST_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      case_results: CASE_RESULTS_PATH,
    },
    input_paths: {
      result_review_fixture: RESULT_REVIEW_FIXTURE_PATH,
      temp_db_harness_fixture: TEMP_DB_HARNESS_FIXTURE_PATH,
      test_cases_fixture: TEST_CASES_FIXTURE_PATH,
      optional_result_review_report: OPTIONAL_RESULT_REVIEW_REPORT_PATH,
      optional_tmp_harness_report: OPTIONAL_TMP_HARNESS_REPORT_PATH,
      optional_browser_report: OPTIONAL_BROWSER_REPORT_PATH,
    },
    optional_inputs: {
      result_review_report_present: Boolean(optionalResultReviewReport),
      result_review_report_final_status:
        optionalResultReviewReport?.final_status ?? null,
      tmp_harness_report_present: Boolean(optionalTmpHarnessReport),
      tmp_harness_report_final_status: optionalTmpHarnessReport?.final_status ?? null,
      browser_report_present: Boolean(optionalBrowserReport),
      browser_report_final_status: optionalBrowserReport?.final_status ?? null,
    },
    suite_fingerprint: createFingerprint({
      test_cases_fixture: testCasesFixture,
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
    preserved_boundaries: asRecord(testCasesFixture).preserved_boundaries,
    final_status: finalStatus,
    next_recommended_slice:
      "temp_db_single_claim_result_review_hardening_or_product_write_gate_design",
  };
}

function runContractTestCase(testCase, fixtures) {
  const optionalSkip = maybeSkipOptionalCase(testCase, fixtures);
  if (optionalSkip) return optionalSkip;

  const target = buildTargetObject(testCase, fixtures);
  const validation =
    testCase.target_fixture === "temp_db_harness_fixture"
      ? validateHarnessObject(target)
      : validateReviewObject(
          testCase.target_fixture === "browser_validation_report"
            ? asRecord(fixtures.resultReviewFixture)
            : target,
          {
            browserReport:
              testCase.target_fixture === "browser_validation_report"
                ? target
                : fixtures.optionalBrowserReport,
            enforceFingerprint:
              testCase.case_kind === "fixture_drift" ||
              testCase.case_kind === "positive_review_fixture" ||
              testCase.case_kind === "warning_review_fixture",
          },
        );
  const expectedFailureCodes = asArray(testCase.expected_failure_codes).filter(
    (code) => typeof code === "string",
  );
  const actualStatus = validation.failureCodes.length === 0 ? "pass" : "fail";
  const expectedCodesPresent = expectedFailureCodes.every((code) =>
    validation.failureCodes.includes(code),
  );
  const expectedReviewStatusMatched =
    typeof testCase.expected_review_status !== "string" ||
    testCase.expected_review_status === validation.actualReviewStatus;
  const expectedStatusMatched =
    actualStatus === testCase.expected_status &&
    expectedReviewStatusMatched &&
    (actualStatus === "pass" || expectedCodesPresent);
  const caseStatus =
    testCase.expected_status === "fail"
      ? actualStatus === "fail" && expectedCodesPresent && expectedReviewStatusMatched
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
    expected_review_status: asString(testCase.expected_review_status),
    actual_review_status: validation.actualReviewStatus,
    expected_failure_codes: expectedFailureCodes,
    actual_failure_codes: validation.failureCodes,
    messages: validation.messages,
    skip_reason: null,
  };
}

function maybeSkipOptionalCase(testCase, fixtures) {
  if (!testCase.optional && !testCase.skip_when_optional_reports_missing) return null;
  const liveReview = asRecord(asRecord(fixtures.optionalResultReviewReport).result_review);
  const canRunLiveCase =
    Object.keys(liveReview).length > 0 &&
    liveReview.review_status === "temp_result_review_passed";
  if (canRunLiveCase) return null;
  return {
    case_id: asString(testCase.case_id),
    case_kind: asString(testCase.case_kind),
    mutation_kind: asString(testCase.mutation_kind),
    target_fixture: asString(testCase.target_fixture),
    expected_status: asString(testCase.expected_status),
    actual_status: "skipped",
    case_status: "skipped",
    expected_review_status: asString(testCase.expected_review_status),
    actual_review_status: null,
    expected_failure_codes: asArray(testCase.expected_failure_codes).filter(
      (code) => typeof code === "string",
    ),
    actual_failure_codes: [],
    messages: [],
    skip_reason:
      "Optional live all-pass result review report was absent or did not include all optional report-backed evidence.",
  };
}

function buildTargetObject(testCase, fixtures) {
  const baseline = selectBaselineObject(testCase.target_fixture, fixtures);
  const cloned = cloneJson(baseline);
  applyMutationPatch(cloned, asRecord(testCase.mutated_fixture_patch));
  return cloned;
}

function selectBaselineObject(targetFixture, fixtures) {
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

function validateHarnessObject(harnessReport) {
  const harnessResult = asRecord(harnessReport.harness_result);
  const tempDbArtifact = asRecord(harnessResult.temp_db_artifact);
  const sqlSummary = asRecord(harnessResult.executed_sql_summary);
  const verification = asRecord(harnessResult.verification);
  const insertedRecords = asRecord(harnessResult.inserted_records);
  const tempClaimRecord = asRecord(insertedRecords.temp_claim_record);
  const failureCodes = [];
  const messages = [];

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
  if (
    !boundaryIntact(asRecord(harnessResult.product_write_boundary), [
      "temp_db_execution_only",
    ])
  ) {
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

function validateReviewObject(review, { browserReport, enforceFingerprint } = {}) {
  const failureCodes = [];
  const messages = [];
  const evidenceResults = asArray(review.evidence_check_results).map(asRecord);
  const evidenceHasWarn = evidenceResults.some((result) => result.status === "warn");
  const evidenceHasBlock = evidenceResults.some(
    (result) => result.status === "block",
  );
  const boundary = asRecord(review.product_write_boundary);
  const sourceHarness = asRecord(review.source_harness);
  const tempRecordSummary = readRowCounts(review.temp_record_summary);
  const insertedClaim = asRecord(review.inserted_claim_summary);
  const report = asRecord(browserReport);

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
  if (!boundaryIntact(boundary, ["result_review_only"])) {
    addFailure(failureCodes, messages, "boundary_flag_enabled");
  }
  if (asNumber(report.external_request_count) !== null) {
    if ((asNumber(report.external_request_count) ?? 0) > 0) {
      addFailure(failureCodes, messages, "browser_external_request_present");
    }
  }
  if (asNumber(report.forbidden_request_count) !== null) {
    if ((asNumber(report.forbidden_request_count) ?? 0) > 0) {
      addFailure(failureCodes, messages, "browser_forbidden_request_present");
    }
  }
  if (enforceFingerprint && !reviewFingerprintMatches(review)) {
    addFailure(failureCodes, messages, "fixture_drift_detected");
  }

  const derivedStatus =
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

function addRowCountFailures(failureCodes, messages, rowCounts) {
  if (!TEMP_TABLES.every((tableName) => rowCounts[tableName] === 1)) {
    addFailure(failureCodes, messages, "row_count_mismatch");
  }
}

function addFailure(codes, messages, code) {
  if (!codes.includes(code)) codes.push(code);
  messages.push(code);
}

function applyMutationPatch(target, patch) {
  for (const operation of asArray(patch.set)) {
    setPath(target, asArray(operation.path), operation.value);
  }
  for (const operation of asArray(patch.replace)) {
    setPath(target, asArray(operation.path), operation.value);
  }
  for (const operation of asArray(patch.unset)) {
    unsetPath(target, asArray(operation.path));
  }
}

function setPath(target, pathSegments, value) {
  let current = target;
  for (let index = 0; index < pathSegments.length - 1; index += 1) {
    const segment = pathSegments[index];
    if (typeof segment === "number" && Array.isArray(current)) {
      if (!current[segment] || typeof current[segment] !== "object") {
        current[segment] = {};
      }
      current = current[segment];
      continue;
    }
    const record = asRecord(current);
    if (!record[String(segment)] || typeof record[String(segment)] !== "object") {
      record[String(segment)] = {};
    }
    current = record[String(segment)];
  }
  const finalSegment = pathSegments[pathSegments.length - 1];
  if (typeof finalSegment === "number" && Array.isArray(current)) {
    current[finalSegment] = value;
    return;
  }
  asRecord(current)[String(finalSegment)] = value;
}

function unsetPath(target, pathSegments) {
  let current = target;
  for (let index = 0; index < pathSegments.length - 1; index += 1) {
    const segment = pathSegments[index];
    current =
      typeof segment === "number" && Array.isArray(current)
        ? current[segment]
        : asRecord(current)[String(segment)];
  }
  const finalSegment = pathSegments[pathSegments.length - 1];
  if (typeof finalSegment === "number" && Array.isArray(current)) {
    current.splice(finalSegment, 1);
    return;
  }
  delete asRecord(current)[String(finalSegment)];
}

function readRowCounts(value) {
  const record = asRecord(value);
  return {
    temp_claim_records: asNumber(record.temp_claim_records) ?? 0,
    temp_idempotency_records: asNumber(record.temp_idempotency_records) ?? 0,
    temp_rollback_records: asNumber(record.temp_rollback_records) ?? 0,
    temp_review_audit_records: asNumber(record.temp_review_audit_records) ?? 0,
  };
}

function boundaryIntact(boundary, allowedTrueKeys) {
  for (const key of allowedTrueKeys) {
    if (boundary[key] !== true) return false;
  }
  return Object.entries(boundary).every(([key, value]) =>
    allowedTrueKeys.includes(key) ? value === true : value === false,
  );
}

function preservedBoundariesIntact(boundary) {
  if (!boundary || boundary.fixture_only !== true) return false;
  return Object.entries(boundary).every(([key, value]) =>
    key === "fixture_only" ? value === true : value === false,
  );
}

function noNonNullProductIds(value) {
  if (Array.isArray(value)) {
    return value.every((item) => noNonNullProductIds(item));
  }
  if (!value || typeof value !== "object") return true;
  return Object.entries(value).every(([key, nestedValue]) => {
    if (PRODUCT_ID_KEYS.includes(key)) return nestedValue === null;
    return noNonNullProductIds(nestedValue);
  });
}

function isHarnessTempDbPath(value) {
  if (typeof value !== "string" || !value.endsWith(".sqlite")) return false;
  const resolved = path.resolve(value);
  return resolved.startsWith(`${RESOLVED_HARNESS_ARTIFACT_DIR}${path.sep}`);
}

function reviewFingerprintMatches(review) {
  const expected = asString(review.review_fingerprint);
  if (!expected) return false;
  const cloned = cloneJson(review);
  cloned.review_fingerprint = "";
  return createFingerprint(cloned) === expected;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readOptionalJson(filePath) {
  if (!existsSync(filePath)) return null;
  return readJson(filePath);
}

function createFingerprint(input) {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function stripGeneratedFields(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "generated_at" && key !== "local_copy_packet")
        .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
    );
  }
  return value;
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
  return JSON.parse(JSON.stringify(value));
}

function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value) {
  return typeof value === "string" ? value : null;
}

function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

await main();
