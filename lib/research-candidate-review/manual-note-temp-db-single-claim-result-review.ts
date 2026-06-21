export const MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_RESULT_REVIEW_VERSION =
  "manual_note_temp_db_single_claim_result_review.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type EvidenceCheckStatus = "pass" | "warn" | "block";
type ReviewStatus =
  | "temp_result_review_passed"
  | "temp_result_review_needs_attention"
  | "temp_result_review_blocked";

type TempRecordCounts = {
  temp_claim_records: number;
  temp_idempotency_records: number;
  temp_rollback_records: number;
  temp_review_audit_records: number;
};

type EvidenceCheckResult = {
  check_id: string;
  status: EvidenceCheckStatus;
  message: string;
};

type ProductWriteBoundary = {
  result_review_only: true;
  normal_product_write_enabled: false;
  product_db_write: false;
  actual_promotion_performed: false;
  proof_or_evidence_writes: false;
  perspective_or_canonical_writes: false;
  canonical_graph_write: false;
  work_item_creation: false;
  product_ids_created: false;
  repo_schema_changed: false;
  migration_added: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  external_handoff_sent: false;
  durable_product_persistence: false;
  browser_persistence: false;
};

type ResultReviewInput = {
  committedHarnessReport: unknown;
  tmpHarnessReport?: unknown | null;
  browserValidationReport?: unknown | null;
  generated_at?: string | null;
};

export type ManualNoteTempDbSingleClaimResultReview = {
  review_kind: "manual_note_temp_db_single_claim_result_review";
  review_version: typeof MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_RESULT_REVIEW_VERSION;
  review_fingerprint: string;
  source_harness: {
    report_version: string | null;
    result_fingerprint: string | null;
    result_status: string | null;
    sqlite_method: string | null;
    temp_db_path: string | null;
    temp_db_under_tmp: boolean;
    temp_db_created: boolean;
    temp_db_preserved_for_inspection: boolean;
  };
  temp_record_summary: TempRecordCounts & {
    exactly_one_each: boolean;
  };
  inserted_claim_summary: {
    source_operation_id: string | null;
    source_temp_intent_id: string | null;
    temp_claim_record_id: string | null;
    product_claim_id: null;
    canonical_claim_id: null;
    proof_id: null;
    evidence_id: null;
    perspective_id: null;
    work_item_id: null;
    raw_manual_note_text_included: false;
  };
  evidence_checks: {
    row_counts_match_expected: boolean;
    temp_tables_only: boolean;
    product_table_statement_count_zero: boolean;
    product_db_path_used_false: boolean;
    product_db_untouched_true: boolean;
    product_ids_absent: boolean;
    raw_manual_note_absent: boolean;
    browser_external_requests_zero_when_report_available: boolean;
    browser_forbidden_requests_zero_when_report_available: boolean;
    temp_db_path_containment_checked: boolean;
    traversal_blocked_when_report_available: boolean;
  };
  evidence_check_results: EvidenceCheckResult[];
  review_status: ReviewStatus;
  remaining_product_write_blockers: string[];
  product_write_boundary: ProductWriteBoundary;
  next_stage_recommendation: {
    recommendation_status:
      | "ready_for_temp_result_contract_tests"
      | "blocked_before_more_temp_work";
    recommended_next_slice: "temp_db_single_claim_result_contract_tests";
    why_not_product_write_yet: string[];
    minimum_new_tests_before_product_write_design: string[];
  };
  local_copy_packet: {
    markdown: string;
    json: string;
    fingerprint: string;
    fingerprint_algorithm: "fnv1a32_canonical_json";
    local_clipboard_only: true;
    external_handoff_sent: false;
    packet_persisted_to_product_db: false;
    product_write_authority_granted: false;
    actual_promotion_allowed: false;
  };
  next_recommended_slice: "temp_db_single_claim_result_contract_tests";
};

type ResultReviewCopySource = Omit<
  ManualNoteTempDbSingleClaimResultReview,
  "local_copy_packet"
>;

const HARNESS_ARTIFACT_DIR = "/tmp/augnes-single-claim-write-prototype-v0-1";
const TEMP_TABLES: Array<keyof TempRecordCounts> = [
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
const REMAINING_PRODUCT_WRITE_BLOCKERS = [
  "source_verification_authority_missing",
  "proof_evidence_write_authority_missing",
  "canonical_perspective_write_authority_missing",
  "product_schema_review_missing",
  "product_idempotency_storage_missing",
  "product_rollback_contract_missing",
  "product_audit_record_contract_missing",
  "explicit_operator_promotion_decision_missing",
  "enabled_adapter_review_missing",
  "product_write_route_missing",
];

export function buildManualNoteTempDbSingleClaimResultReview(
  input: ResultReviewInput,
): ManualNoteTempDbSingleClaimResultReview {
  const committedReport = asRecord(input.committedHarnessReport);
  const tmpReport = asRecord(input.tmpHarnessReport);
  const browserReport = asRecord(input.browserValidationReport);
  const sourceReport = Object.keys(tmpReport).length > 0 ? tmpReport : committedReport;
  const harnessResult = asRecord(sourceReport.harness_result);
  const insertedRecords = asRecord(harnessResult.inserted_records);
  const tempClaimRecord = asRecord(insertedRecords.temp_claim_record);
  const tempDbArtifact = asRecord(harnessResult.temp_db_artifact);
  const executedSqlSummary = asRecord(harnessResult.executed_sql_summary);
  const verification = asRecord(harnessResult.verification);
  const rowCounts = readRowCounts(verification.row_counts);

  const evidenceCheckResults = buildEvidenceCheckResults({
    committedReport,
    sourceReport,
    harnessResult,
    tempDbArtifact,
    executedSqlSummary,
    verification,
    rowCounts,
    tempClaimRecord,
    browserReport,
    tmpReportPresent: Object.keys(tmpReport).length > 0,
    browserReportPresent: Object.keys(browserReport).length > 0,
  });
  const hasBlock = evidenceCheckResults.some((result) => result.status === "block");
  const hasWarn = evidenceCheckResults.some((result) => result.status === "warn");
  const reviewStatus: ReviewStatus = hasBlock
    ? "temp_result_review_blocked"
    : hasWarn
      ? "temp_result_review_needs_attention"
      : "temp_result_review_passed";
  const recommendationStatus =
    reviewStatus === "temp_result_review_blocked"
      ? "blocked_before_more_temp_work"
      : "ready_for_temp_result_contract_tests";

  const reviewCore: ResultReviewCopySource = {
    review_kind: "manual_note_temp_db_single_claim_result_review",
    review_version: MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_RESULT_REVIEW_VERSION,
    review_fingerprint: "",
    source_harness: {
      report_version: asString(sourceReport.report_version),
      result_fingerprint: asString(harnessResult.result_fingerprint),
      result_status: asString(harnessResult.result_status),
      sqlite_method: asString(harnessResult.sqlite_method),
      temp_db_path: asString(tempDbArtifact.temp_db_path),
      temp_db_under_tmp: tempDbArtifact.temp_db_under_tmp === true,
      temp_db_created: tempDbArtifact.temp_db_created === true,
      temp_db_preserved_for_inspection:
        tempDbArtifact.temp_db_preserved_for_inspection === true,
    },
    temp_record_summary: {
      ...rowCounts,
      exactly_one_each: rowCountsExactlyOne(rowCounts),
    },
    inserted_claim_summary: {
      source_operation_id: asString(tempClaimRecord.source_operation_id),
      source_temp_intent_id: asString(tempClaimRecord.source_temp_intent_id),
      temp_claim_record_id: asString(tempClaimRecord.temp_claim_record_id),
      product_claim_id: null,
      canonical_claim_id: null,
      proof_id: null,
      evidence_id: null,
      perspective_id: null,
      work_item_id: null,
      raw_manual_note_text_included: false,
    },
    evidence_checks: {
      row_counts_match_expected: checkPassed(
        evidenceCheckResults,
        "row_counts_match_expected",
      ),
      temp_tables_only: checkPassed(evidenceCheckResults, "temp_tables_only"),
      product_table_statement_count_zero: checkPassed(
        evidenceCheckResults,
        "product_table_statement_count_zero",
      ),
      product_db_path_used_false: checkPassed(
        evidenceCheckResults,
        "product_db_path_used_false",
      ),
      product_db_untouched_true: checkPassed(
        evidenceCheckResults,
        "product_db_untouched_true",
      ),
      product_ids_absent: checkPassed(evidenceCheckResults, "product_ids_absent"),
      raw_manual_note_absent: checkPassed(
        evidenceCheckResults,
        "raw_manual_note_absent",
      ),
      browser_external_requests_zero_when_report_available:
        checkNotBlocked(evidenceCheckResults, "browser_external_requests_zero"),
      browser_forbidden_requests_zero_when_report_available:
        checkNotBlocked(evidenceCheckResults, "browser_forbidden_requests_zero"),
      temp_db_path_containment_checked: checkPassed(
        evidenceCheckResults,
        "temp_db_path_containment_checked",
      ),
      traversal_blocked_when_report_available: checkNotBlocked(
        evidenceCheckResults,
        "traversal_blocked_when_report_available",
      ),
    },
    evidence_check_results: evidenceCheckResults,
    review_status: reviewStatus,
    remaining_product_write_blockers: [...REMAINING_PRODUCT_WRITE_BLOCKERS],
    product_write_boundary: productWriteBoundary(),
    next_stage_recommendation: {
      recommendation_status: recommendationStatus,
      recommended_next_slice: "temp_db_single_claim_result_contract_tests",
      why_not_product_write_yet: [
        "Temp DB evidence proves only an isolated fixture-backed temp write path.",
        "No source verification, proof/evidence, canonical Perspective, product schema, product idempotency, rollback, audit, operator decision, enabled adapter, or product route authority exists.",
      ],
      minimum_new_tests_before_product_write_design: [
        "temp_result_review_fixture_drift_tests",
        "path_containment_negative_result_review_tests",
        "product_id_absence_negative_result_review_tests",
        "raw_note_absence_negative_result_review_tests",
        "row_count_negative_result_review_tests",
      ],
    },
    next_recommended_slice: "temp_db_single_claim_result_contract_tests",
  };
  const fingerprint = createManualNoteTempDbSingleClaimResultReviewFingerprint(
    reviewCore,
  );
  const review = {
    ...reviewCore,
    review_fingerprint: fingerprint,
  };
  return {
    ...review,
    local_copy_packet: {
      markdown: buildManualNoteTempDbSingleClaimResultReviewMarkdown(review),
      json: buildManualNoteTempDbSingleClaimResultReviewJson(review),
      fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted_to_product_db: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

export function buildManualNoteTempDbSingleClaimResultReviewMarkdown(
  review: ResultReviewCopySource,
): string {
  return [
    "# Manual Note Temp DB Single-Claim Result Review",
    "",
    "Result review only. No DB is opened and no SQL is executed.",
    `review_status: ${review.review_status}`,
    `attention_note: ${buildAttentionNote(review)}`,
    `result_status: ${review.source_harness.result_status ?? "missing"}`,
    `temp_db_path: ${review.source_harness.temp_db_path ?? "missing"}`,
    "",
    "## Temp Record Summary",
    `- temp_claim_records: ${review.temp_record_summary.temp_claim_records}`,
    `- temp_idempotency_records: ${review.temp_record_summary.temp_idempotency_records}`,
    `- temp_rollback_records: ${review.temp_record_summary.temp_rollback_records}`,
    `- temp_review_audit_records: ${review.temp_record_summary.temp_review_audit_records}`,
    "",
    "## Product Write Boundary",
    "normal_product_write_enabled=false",
    "product_db_write=false",
    "actual_promotion_performed=false",
    "proof_or_evidence_writes=false",
    "perspective_or_canonical_writes=false",
    "canonical_graph_write=false",
    "work_item_creation=false",
    "",
    "## Next",
    review.next_recommended_slice,
  ].join("\n");
}

function buildAttentionNote(review: ResultReviewCopySource): string {
  if (review.review_status === "temp_result_review_needs_attention") {
    return "Ready to proceed to result contract tests, but optional report-backed evidence is incomplete.";
  }
  if (review.review_status === "temp_result_review_blocked") {
    return "Blocked before more temp work because at least one evidence check failed.";
  }
  return "Ready to proceed to result contract tests with no warning evidence.";
}

export function buildManualNoteTempDbSingleClaimResultReviewJson(
  review: ResultReviewCopySource,
): string {
  return JSON.stringify(
    {
      review_kind: review.review_kind,
      review_version: review.review_version,
      review_fingerprint: review.review_fingerprint,
      source_harness: review.source_harness,
      temp_record_summary: review.temp_record_summary,
      evidence_checks: review.evidence_checks,
      review_status: review.review_status,
      remaining_product_write_blockers: review.remaining_product_write_blockers,
      product_write_boundary: review.product_write_boundary,
      next_stage_recommendation: review.next_stage_recommendation,
      next_recommended_slice: review.next_recommended_slice,
    },
    null,
    2,
  );
}

export function createManualNoteTempDbSingleClaimResultReviewFingerprint(
  input: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function buildEvidenceCheckResults({
  sourceReport,
  harnessResult,
  tempDbArtifact,
  executedSqlSummary,
  verification,
  rowCounts,
  tempClaimRecord,
  browserReport,
  tmpReportPresent,
  browserReportPresent,
}: {
  committedReport: JsonRecord;
  sourceReport: JsonRecord;
  harnessResult: JsonRecord;
  tempDbArtifact: JsonRecord;
  executedSqlSummary: JsonRecord;
  verification: JsonRecord;
  rowCounts: TempRecordCounts;
  tempClaimRecord: JsonRecord;
  browserReport: JsonRecord;
  tmpReportPresent: boolean;
  browserReportPresent: boolean;
}): EvidenceCheckResult[] {
  const tempDbPath = asString(tempDbArtifact.temp_db_path);
  const browserExternalCount = asNumber(browserReport.external_request_count);
  const browserForbiddenCount = asNumber(browserReport.forbidden_request_count);
  const sourceText = JSON.stringify(sourceReport);
  return [
    evidenceCheck(
      "harness_result_passed",
      harnessResult.result_status === "temp_db_write_passed",
      "Harness result status is temp_db_write_passed.",
    ),
    evidenceCheck(
      "row_counts_match_expected",
      verification.expected_row_counts_match === true && rowCountsExactlyOne(rowCounts),
      "Temp row counts match exactly one row in each required temp table.",
    ),
    evidenceCheck(
      "temp_tables_only",
      verification.temp_tables_only === true &&
        executedSqlSummary.sql_scope === "temp_db_only",
      "Harness evidence is scoped to temp tables only.",
    ),
    evidenceCheck(
      "product_table_statement_count_zero",
      executedSqlSummary.product_table_statement_count === 0,
      "Harness reported zero product-table statements.",
    ),
    evidenceCheck(
      "product_db_path_used_false",
      tempDbArtifact.product_db_path_used === false,
      "Harness did not use a product DB path.",
    ),
    evidenceCheck(
      "product_db_untouched_true",
      verification.product_db_untouched === true,
      "Harness verification states the product DB was untouched.",
    ),
    evidenceCheck(
      "product_ids_absent",
      verification.product_ids_absent === true &&
        tempClaimRecord.product_claim_id === null &&
        tempClaimRecord.canonical_claim_id === null &&
        tempClaimRecord.proof_id === null &&
        tempClaimRecord.evidence_id === null &&
        tempClaimRecord.perspective_id === null &&
        tempClaimRecord.work_item_id === null &&
        noNonNullProductIds(sourceReport),
      "Harness evidence contains no product, canonical, proof, evidence, Perspective, or work item IDs.",
    ),
    evidenceCheck(
      "raw_manual_note_absent",
      verification.raw_manual_note_absent === true &&
        tempClaimRecord.raw_manual_note_text_included === false &&
        !/manual note raw text|verbatim manual note|raw note body/i.test(sourceText),
      "Harness evidence excludes raw manual note text.",
    ),
    optionalEvidenceCheck(
      "browser_external_requests_zero",
      browserReportPresent,
      browserExternalCount === 0,
      "Browser report was not supplied; browser external request evidence is optional for this result review.",
      "Browser report recorded zero browser-observed external requests.",
      "Browser report recorded browser-observed external requests.",
    ),
    optionalEvidenceCheck(
      "browser_forbidden_requests_zero",
      browserReportPresent,
      browserForbiddenCount === 0,
      "Browser report was not supplied; browser forbidden request evidence is optional for this result review.",
      "Browser report recorded zero browser-observed forbidden requests.",
      "Browser report recorded browser-observed forbidden requests.",
    ),
    evidenceCheck(
      "temp_db_path_containment_checked",
      tempDbArtifact.temp_db_under_tmp === true &&
        isHarnessTempDbPath(tempDbPath),
      "Temp DB path is contained under the single-claim harness artifact directory.",
    ),
    optionalEvidenceCheck(
      "traversal_blocked_when_report_available",
      tmpReportPresent,
      tempDbArtifact.temp_db_under_tmp === true && isHarnessTempDbPath(tempDbPath),
      "No separate failure-path harness report was supplied; committed fixture path containment is reviewed, but traversal-block evidence remains validation-command evidence.",
      "Harness report path containment evidence is present.",
      "Harness report path containment evidence is missing or invalid.",
    ),
  ];
}

function evidenceCheck(
  checkId: string,
  passed: boolean,
  message: string,
): EvidenceCheckResult {
  return {
    check_id: checkId,
    status: passed ? "pass" : "block",
    message,
  };
}

function optionalEvidenceCheck(
  checkId: string,
  available: boolean,
  passed: boolean,
  unavailableMessage: string,
  passMessage: string,
  blockMessage: string,
): EvidenceCheckResult {
  if (!available) {
    return {
      check_id: checkId,
      status: "warn",
      message: unavailableMessage,
    };
  }
  return {
    check_id: checkId,
    status: passed ? "pass" : "block",
    message: passed ? passMessage : blockMessage,
  };
}

function productWriteBoundary(): ProductWriteBoundary {
  return {
    result_review_only: true,
    normal_product_write_enabled: false,
    product_db_write: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    product_ids_created: false,
    repo_schema_changed: false,
    migration_added: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_product_persistence: false,
    browser_persistence: false,
  };
}

function readRowCounts(value: unknown): TempRecordCounts {
  const record = asRecord(value);
  return {
    temp_claim_records: asNumber(record.temp_claim_records) ?? 0,
    temp_idempotency_records: asNumber(record.temp_idempotency_records) ?? 0,
    temp_rollback_records: asNumber(record.temp_rollback_records) ?? 0,
    temp_review_audit_records: asNumber(record.temp_review_audit_records) ?? 0,
  };
}

function rowCountsExactlyOne(rowCounts: TempRecordCounts): boolean {
  return TEMP_TABLES.every((tableName) => rowCounts[tableName] === 1);
}

function checkPassed(results: EvidenceCheckResult[], checkId: string): boolean {
  return results.some((result) => result.check_id === checkId && result.status === "pass");
}

function checkNotBlocked(results: EvidenceCheckResult[], checkId: string): boolean {
  return results.some((result) => result.check_id === checkId && result.status !== "block");
}

function isHarnessTempDbPath(value: string | null): boolean {
  return (
    typeof value === "string" &&
    value.startsWith(`${HARNESS_ARTIFACT_DIR}/`) &&
    value.endsWith(".sqlite") &&
    !value.includes("/../")
  );
}

function noNonNullProductIds(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.every((item) => noNonNullProductIds(item));
  }
  if (!value || typeof value !== "object") return true;
  return Object.entries(value as JsonRecord).every(([key, nestedValue]) => {
    if (PRODUCT_ID_KEYS.includes(key)) {
      return nestedValue === null;
    }
    return noNonNullProductIds(nestedValue);
  });
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

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
