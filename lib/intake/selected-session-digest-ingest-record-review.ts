import {
  SELECTED_SESSION_DIGEST_INGEST_RECORD_REVIEW_VERSION,
  type SelectedSessionDigestIngestRecordAuthoritySummary,
  type SelectedSessionDigestIngestRecordReview,
  type SelectedSessionDigestIngestRecordReviewAuthorityBoundary,
  type SelectedSessionDigestIngestRecordReviewEvidenceSummary,
  type SelectedSessionDigestIngestRecordReviewInput,
  type SelectedSessionDigestIngestRecordReviewNoSideEffectsSummary,
  type SelectedSessionDigestIngestRecordReviewStatus,
  type SelectedSessionDigestIngestRecordSummary,
} from "@/types/selected-session-digest-ingest-record-review";
import {
  SELECTED_SESSION_DIGEST_INGEST_RECORD_VERSION,
  SELECTED_SESSION_DIGEST_INGEST_SCOPE,
} from "@/types/selected-session-digest-ingest-write";

interface RecordEvaluation {
  summary: SelectedSessionDigestIngestRecordSummary;
  valid: boolean;
  sourceRefs: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
}

export function buildSelectedSessionDigestIngestRecordReviewV01(
  input: SelectedSessionDigestIngestRecordReviewInput = {},
): SelectedSessionDigestIngestRecordReview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const scope = input.scope ?? SELECTED_SESSION_DIGEST_INGEST_SCOPE;
  const suppliedRecords = Array.isArray(input.records)
    ? input.records
    : input.store_result?.records ?? [];
  const selectedRecordId =
    typeof input.selected_record_id === "string" &&
    input.selected_record_id.trim().length > 0
      ? input.selected_record_id
      : null;

  const evaluations = suppliedRecords.map(evaluateRecord);
  const validEvaluations = evaluations.filter((evaluation) => evaluation.valid);
  const allSummaries = evaluations
    .map((evaluation) => evaluation.summary)
    .sort(compareSummariesNewestFirst);
  const validSummaries = validEvaluations
    .map((evaluation) => evaluation.summary)
    .sort(compareSummariesNewestFirst);
  const selectedRecordSummary = selectedRecordId
    ? validSummaries.find((summary) => summary.record_id === selectedRecordId) ??
      null
    : null;
  const latestRecordSummary = validSummaries[0] ?? null;
  const problemRecordIds = uniqueSortedStrings(
    evaluations
      .filter((evaluation) => !evaluation.valid)
      .map((evaluation) => evaluation.summary.record_id),
  );
  const sourceRefs = uniqueSortedStrings([
    ...(input.source_refs ?? []),
    ...validEvaluations.flatMap((evaluation) => evaluation.sourceRefs),
  ]);
  const evidenceRefs = uniqueSortedStrings(
    validEvaluations.flatMap((evaluation) => evaluation.evidenceRefs),
  );
  const missingEvidence = uniqueSortedStrings(
    evaluations.flatMap((evaluation) => evaluation.missingEvidence),
  );
  const noSideEffectsSummary = buildNoSideEffectsSummary(allSummaries);
  const reviewStatus = determineReviewStatus({
    storeStatus: input.store_result?.status ?? null,
    suppliedRecordCount: suppliedRecords.length,
    validRecordCount: validSummaries.length,
    selectedRecordId,
    selectedRecordFound: Boolean(selectedRecordSummary),
    problemRecordIds,
  });
  const evidenceSummary = buildEvidenceSummary({
    suppliedRecordCount: suppliedRecords.length,
    selectedRecordSummary,
    sourceRefs,
    evidenceRefs,
    missingEvidence,
    problemRecordIds,
    noSideEffectsSummary,
  });
  const insufficientDataReasons = buildInsufficientDataReasons({
    storeStatus: input.store_result?.status ?? null,
    suppliedRecordCount: suppliedRecords.length,
    validRecordCount: validSummaries.length,
    selectedRecordId,
    selectedRecordFound: Boolean(selectedRecordSummary),
  });

  return {
    review_version: SELECTED_SESSION_DIGEST_INGEST_RECORD_REVIEW_VERSION,
    scope,
    as_of: asOf,
    source_refs: sourceRefs,
    review_status: reviewStatus,
    input_summary: {
      supplied_record_count: suppliedRecords.length,
      valid_record_count: validSummaries.length,
      invalid_record_count: suppliedRecords.length - validSummaries.length,
      selected_record_id: selectedRecordId,
      selected_record_found: Boolean(selectedRecordSummary),
      latest_record_id: latestRecordSummary?.record_id ?? null,
      latest_record_created_at: latestRecordSummary?.created_at ?? null,
      selected_digest_candidate_ref_count: sum(
        validSummaries.map(
          (summary) => summary.selected_digest_candidate_ref_count,
        ),
      ),
      sanitized_candidate_summary_count: sum(
        validSummaries.map((summary) => summary.sanitized_candidate_summary_count),
      ),
      receipt_side_effect_problem_count: allSummaries.filter(
        (summary) => !summary.receipt_no_side_effects_valid,
      ).length,
    },
    record_summaries: allSummaries,
    selected_record_summary: selectedRecordSummary,
    latest_record_summary: latestRecordSummary,
    evidence_summary: evidenceSummary,
    receipt_no_side_effects_summary: noSideEffectsSummary,
    blocked_reasons: problemRecordIds.map(
      (recordId) => `problem_selected_session_digest_ingest_record:${recordId}`,
    ),
    insufficient_data_reasons: insufficientDataReasons,
    operator_review_checklist: [
      "review_latest_selected_session_digest_candidate_ingest_record",
      "confirm_receipt_no_side_effects_show_no_memory_perspective_cwp_relay_or_handoff_mutation",
      "confirm_candidate_summaries_are_sanitized_and_bounded",
      "confirm_selected_digest_ingest_record_is_not_memory_or_perspective_state",
    ],
    would_not_do: [
      "does_not_write_memory",
      "does_not_mutate_current_working_perspective",
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_update_continuity_relay",
      "does_not_mutate_handoff_context",
      "does_not_write_selected_refs_to_live_handoff",
      "does_not_send_handoff",
      "does_not_call_provider_openai_github_or_codex",
      "does_not_create_graph_vector_rag_crawler_or_browser_observer",
      "does_not_render_workbench_action_buttons",
    ],
    non_goals: [
      "memory_write",
      "perspective_unit_durable_mutation",
      "next_work_bias_durable_mutation",
      "cwp_mutation",
      "continuity_relay_write",
      "live_handoff_context_apply",
      "selected_refs_live_packet_write",
      "handoff_send",
      "provider_github_codex_call",
      "automatic_memory_or_perspective_promotion",
    ],
    authority_boundary:
      createSelectedSessionDigestIngestRecordReviewAuthorityBoundaryV01(),
  };
}

export function createSelectedSessionDigestIngestRecordReviewAuthorityBoundaryV01(): SelectedSessionDigestIngestRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_ingest_record: false,
    can_create_ingest_receipt: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_dogfood_metrics: false,
    can_write_reuse_ledger: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Read-only review of already-read selected session digest candidate ingest records.",
      "The review builder does not open DB handles, create schema, write records, mutate memory/Perspective/CWP/handoff state, call providers/GitHub/Codex, or run autonomous actions.",
    ],
  };
}

function evaluateRecord(recordLike: unknown, index: number): RecordEvaluation {
  const record = isRecord(recordLike) ? recordLike : null;
  const recordId = asString(record?.record_id) ?? `malformed_record:${index + 1}`;
  const authoritySummary = summarizeAuthority(getRecord(record, "authority_boundary"));
  const problemReasons = recordProblems({ record, authoritySummary });
  const sourceRefs = stringArrayFromPath(record, "source_refs");
  const evidenceRefs = stringArrayFromPath(record, "evidence_refs");
  const selectedRefs = stringArrayFromPath(record, "selected_digest_candidate_refs");
  const summaries = Array.isArray(record?.sanitized_candidate_summaries)
    ? record.sanitized_candidate_summaries
    : [];

  return {
    summary: {
      record_id: recordId,
      idempotency_key: asString(record?.idempotency_key) ?? "",
      created_at: asString(record?.created_at) ?? "",
      operator_ref: asString(record?.operator_ref),
      source_kind: asString(record?.source_kind),
      source_ref: asString(record?.source_ref),
      session_ref: asString(record?.session_ref),
      project_ref: asString(record?.project_ref),
      selected_digest_candidate_ref_count: selectedRefs.length,
      sanitized_candidate_summary_count: summaries.length,
      evidence_ref_count: evidenceRefs.length,
      source_ref_count: sourceRefs.length,
      privacy_review_confirmation_ref:
        asString(record?.privacy_review_confirmation_ref) ?? null,
      review_status: asString(record?.review_status),
      record_fingerprint: asString(record?.record_fingerprint),
      receipt_no_side_effects_valid: problemReasons.every(
        (reason) => !/side_effect|mutation|memory|handoff|provider|github|codex/i.test(reason),
      ),
      authority_summary: authoritySummary,
      problem_reasons: problemReasons,
    },
    valid: problemReasons.length === 0,
    sourceRefs,
    evidenceRefs,
    missingEvidence: evidenceRefs.length === 0 ? ["evidence_refs_missing"] : [],
  };
}

function recordProblems({
  record,
  authoritySummary,
}: {
  record: Record<string, unknown> | null;
  authoritySummary: SelectedSessionDigestIngestRecordAuthoritySummary;
}): string[] {
  const reasons: string[] = [];
  if (!record) return ["record_malformed"];
  if (record.record_version !== SELECTED_SESSION_DIGEST_INGEST_RECORD_VERSION) {
    reasons.push("record_version_invalid");
  }
  if (!asString(record.record_id)) reasons.push("record_id_missing");
  if (!asString(record.idempotency_key)) reasons.push("idempotency_key_missing");
  if (!asString(record.operator_ref)) reasons.push("operator_ref_missing");
  if (!asString(record.source_kind)) reasons.push("source_kind_missing");
  if (!asString(record.source_ref)) reasons.push("source_ref_missing");
  if (!asString(record.session_ref) && !asString(record.project_ref)) {
    reasons.push("session_or_project_ref_missing");
  }
  if (stringArrayFromPath(record, "selected_digest_candidate_refs").length === 0) {
    reasons.push("selected_digest_candidate_refs_missing");
  }
  if (stringArrayFromPath(record, "evidence_refs").length === 0) {
    reasons.push("evidence_refs_missing");
  }
  if (!asString(record.privacy_review_confirmation_ref)) {
    reasons.push("privacy_review_confirmation_ref_missing");
  }
  if (containsRawOrPrivateMarkers(record)) {
    reasons.push("record_contains_raw_or_private_marker");
  }
  if (
    authoritySummary.source_of_truth !== false ||
    authoritySummary.durable_local_candidate_ingest_record !== true ||
    authoritySummary.candidate_record_only !== true
  ) {
    reasons.push("authority_boundary_invalid");
  }
  for (const [field, value] of Object.entries(authoritySummary)) {
    if (
      field.startsWith("can_") &&
      value === true &&
      !["can_write_db", "can_create_ingest_record", "can_create_ingest_receipt"].includes(field)
    ) {
      reasons.push(`authority_boundary_unexpected_true:${field}`);
    }
  }
  const noPromotion = getRecord(record, "no_promotion_performed");
  if (
    noPromotion?.memory_promoted !== false ||
    noPromotion?.current_working_perspective_updated !== false ||
    noPromotion?.perspective_unit_written !== false ||
    noPromotion?.next_work_bias_written !== false ||
    noPromotion?.continuity_relay_written !== false ||
    noPromotion?.handoff_context_mutated !== false ||
    noPromotion?.selected_refs_written_to_live_handoff !== false ||
    noPromotion?.handoff_sent !== false
  ) {
    reasons.push("no_promotion_boundary_invalid");
  }
  return uniqueSortedStrings(reasons);
}

function summarizeAuthority(
  authority: Record<string, unknown> | null,
): SelectedSessionDigestIngestRecordAuthoritySummary {
  return {
    durable_local_candidate_ingest_record:
      authority?.durable_local_candidate_ingest_record === true,
    candidate_record_only: authority?.candidate_record_only === true,
    source_of_truth:
      typeof authority?.source_of_truth === "boolean"
        ? authority.source_of_truth
        : null,
    can_write_memory: booleanOrNull(authority?.can_write_memory),
    can_mutate_current_working_perspective: booleanOrNull(
      authority?.can_mutate_current_working_perspective,
    ),
    can_write_perspective_unit: booleanOrNull(
      authority?.can_write_perspective_unit,
    ),
    can_write_next_work_bias: booleanOrNull(
      authority?.can_write_next_work_bias,
    ),
    can_update_continuity_relay: booleanOrNull(
      authority?.can_update_continuity_relay,
    ),
    can_mutate_handoff_context: booleanOrNull(
      authority?.can_mutate_handoff_context,
    ),
    can_write_selected_refs_to_live_handoff: booleanOrNull(
      authority?.can_write_selected_refs_to_live_handoff,
    ),
    can_send_handoff: booleanOrNull(authority?.can_send_handoff),
    can_call_provider_openai: booleanOrNull(
      authority?.can_call_provider_openai,
    ),
    can_call_github: booleanOrNull(authority?.can_call_github),
    can_execute_codex: booleanOrNull(authority?.can_execute_codex),
  };
}

function buildNoSideEffectsSummary(
  summaries: SelectedSessionDigestIngestRecordSummary[],
): SelectedSessionDigestIngestRecordReviewNoSideEffectsSummary {
  return {
    selected_session_digest_ingest_record_written_count: summaries.length,
    selected_session_digest_ingest_receipt_written_count: summaries.length,
    selected_session_digest_persisted_as_candidate_record_count: summaries.length,
    memory_mutated_count: summaries.filter(
      (summary) => summary.authority_summary.can_write_memory === true,
    ).length,
    current_working_perspective_updated_count: summaries.filter(
      (summary) =>
        summary.authority_summary.can_mutate_current_working_perspective ===
        true,
    ).length,
    perspective_unit_written_count: summaries.filter(
      (summary) => summary.authority_summary.can_write_perspective_unit === true,
    ).length,
    next_work_bias_written_count: summaries.filter(
      (summary) => summary.authority_summary.can_write_next_work_bias === true,
    ).length,
    continuity_relay_written_count: summaries.filter(
      (summary) => summary.authority_summary.can_update_continuity_relay === true,
    ).length,
    handoff_context_mutated_count: summaries.filter(
      (summary) => summary.authority_summary.can_mutate_handoff_context === true,
    ).length,
    selected_refs_written_to_live_handoff_count: summaries.filter(
      (summary) =>
        summary.authority_summary.can_write_selected_refs_to_live_handoff ===
        true,
    ).length,
    handoff_sent_count: summaries.filter(
      (summary) => summary.authority_summary.can_send_handoff === true,
    ).length,
    provider_called_count: summaries.filter(
      (summary) => summary.authority_summary.can_call_provider_openai === true,
    ).length,
    github_called_count: summaries.filter(
      (summary) => summary.authority_summary.can_call_github === true,
    ).length,
    codex_executed_count: summaries.filter(
      (summary) => summary.authority_summary.can_execute_codex === true,
    ).length,
  };
}

function determineReviewStatus({
  storeStatus,
  suppliedRecordCount,
  validRecordCount,
  selectedRecordId,
  selectedRecordFound,
  problemRecordIds,
}: {
  storeStatus: string | null;
  suppliedRecordCount: number;
  validRecordCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
  problemRecordIds: string[];
}): SelectedSessionDigestIngestRecordReviewStatus {
  if (problemRecordIds.length > 0) return "invalid_records";
  if (storeStatus === "schema_missing") return "schema_missing";
  if (suppliedRecordCount === 0) return "no_records";
  if (selectedRecordId && selectedRecordFound) return "selected_record_available";
  if (validRecordCount > 0) return "records_available";
  return "blocked";
}

function buildEvidenceSummary({
  suppliedRecordCount,
  selectedRecordSummary,
  sourceRefs,
  evidenceRefs,
  missingEvidence,
  problemRecordIds,
  noSideEffectsSummary,
}: {
  suppliedRecordCount: number;
  selectedRecordSummary: SelectedSessionDigestIngestRecordSummary | null;
  sourceRefs: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
  problemRecordIds: string[];
  noSideEffectsSummary: SelectedSessionDigestIngestRecordReviewNoSideEffectsSummary;
}): SelectedSessionDigestIngestRecordReviewEvidenceSummary {
  const sideEffectProblems =
    noSideEffectsSummary.memory_mutated_count +
    noSideEffectsSummary.current_working_perspective_updated_count +
    noSideEffectsSummary.perspective_unit_written_count +
    noSideEffectsSummary.next_work_bias_written_count +
    noSideEffectsSummary.continuity_relay_written_count +
    noSideEffectsSummary.handoff_context_mutated_count +
    noSideEffectsSummary.handoff_sent_count +
    noSideEffectsSummary.provider_called_count +
    noSideEffectsSummary.github_called_count +
    noSideEffectsSummary.codex_executed_count;
  return {
    has_records: suppliedRecordCount > 0,
    has_valid_records: suppliedRecordCount > 0 && problemRecordIds.length === 0,
    has_selected_record: Boolean(selectedRecordSummary),
    has_source_refs: sourceRefs.length > 0,
    has_evidence_refs: evidenceRefs.length > 0,
    has_privacy_review_confirmation:
      Boolean(selectedRecordSummary?.privacy_review_confirmation_ref) ||
      suppliedRecordCount > 0,
    has_no_side_effects_receipts: sideEffectProblems === 0,
    has_problem_records: problemRecordIds.length > 0,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    missing_evidence: missingEvidence,
    problem_record_ids: problemRecordIds,
  };
}

function buildInsufficientDataReasons({
  storeStatus,
  suppliedRecordCount,
  validRecordCount,
  selectedRecordId,
  selectedRecordFound,
}: {
  storeStatus: string | null;
  suppliedRecordCount: number;
  validRecordCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): string[] {
  return uniqueSortedStrings([
    ...(storeStatus === "schema_missing"
      ? ["selected_session_digest_ingest_record_schema_missing"]
      : []),
    ...(suppliedRecordCount === 0
      ? ["selected_session_digest_ingest_records_missing"]
      : []),
    ...(suppliedRecordCount > 0 && validRecordCount === 0
      ? ["valid_selected_session_digest_ingest_records_missing"]
      : []),
    ...(selectedRecordId && !selectedRecordFound
      ? ["selected_session_digest_ingest_record_not_found"]
      : []),
  ]);
}

function compareSummariesNewestFirst(
  a: SelectedSessionDigestIngestRecordSummary,
  b: SelectedSessionDigestIngestRecordSummary,
): number {
  return (
    Date.parse(b.created_at || "0") - Date.parse(a.created_at || "0") ||
    b.record_id.localeCompare(a.record_id)
  );
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  return hasUnsafeTextMarker(JSON.stringify(value ?? {}));
}

function hasUnsafeTextMarker(value: string): boolean {
  return (
    /(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i.test(value) ||
    /(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(value) ||
    /password:/i.test(value) ||
    /secret:/i.test(value) ||
    /\/Users\//.test(value) ||
    /\/home\//.test(value) ||
    /\.env/i.test(value) ||
    /raw_text/i.test(value) ||
    /raw_digest/i.test(value) ||
    /raw_excerpt/i.test(value)
  );
}

function stringArrayFromPath(
  record: Record<string, unknown> | null,
  field: string,
): string[] {
  const value = record?.[field];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getRecord(
  value: unknown,
  field: string,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[field];
  return isRecord(nested) ? nested : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueSortedStrings(values: readonly unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort();
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
