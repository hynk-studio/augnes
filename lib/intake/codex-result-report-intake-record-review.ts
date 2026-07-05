import {
  CODEX_RESULT_REPORT_INTAKE_RECORD_REVIEW_VERSION,
  type CodexResultReportIntakeNoSideEffectsSummary,
  type CodexResultReportIntakeRecordReview,
  type CodexResultReportIntakeRecordReviewAuthorityBoundary,
  type CodexResultReportIntakeRecordReviewInput,
  type CodexResultReportIntakeRecordReviewStatus,
  type CodexResultReportIntakeRecordSummary,
} from "@/types/codex-result-report-intake-record-review";
import {
  CODEX_RESULT_REPORT_INTAKE_RECORD_VERSION,
  CODEX_RESULT_REPORT_INTAKE_SCOPE,
  type CodexResultReportIntakeRecord,
} from "@/types/codex-result-report-intake-write";

export function buildCodexResultReportIntakeRecordReviewV01(
  input: CodexResultReportIntakeRecordReviewInput = {},
): CodexResultReportIntakeRecordReview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const scope = input.scope ?? CODEX_RESULT_REPORT_INTAKE_SCOPE;
  const suppliedRecords = Array.isArray(input.records)
    ? input.records
    : input.store_result?.records ?? [];
  const selectedRecordId =
    typeof input.selected_record_id === "string" &&
    input.selected_record_id.trim()
      ? input.selected_record_id
      : null;
  const evaluations = suppliedRecords.map(evaluateRecord);
  const validRecords = evaluations
    .filter((evaluation) => evaluation.valid)
    .map((evaluation) => evaluation.record)
    .filter((record): record is CodexResultReportIntakeRecord => Boolean(record))
    .sort(compareRecordsNewestFirst);
  const summaries = evaluations
    .map((evaluation) => evaluation.summary)
    .sort(compareSummariesNewestFirst);
  const validSummaries = summaries.filter(
    (summary) => summary.problem_reasons.length === 0,
  );
  const selectedRecordSummary = selectedRecordId
    ? validSummaries.find((summary) => summary.record_id === selectedRecordId) ??
      null
    : null;
  const latestRecordSummary = validSummaries[0] ?? null;
  const problemRecordIds = uniqueStrings(
    summaries
      .filter((summary) => summary.problem_reasons.length > 0)
      .map((summary) => summary.record_id),
  );
  const sourceRefs = uniqueStrings([
    ...(input.source_refs ?? []),
    ...validRecords.flatMap((record) => record.source_refs),
  ]);
  const evidenceRefs = uniqueStrings(
    validRecords.flatMap((record) => record.evidence_refs),
  );
  const missingEvidence =
    validRecords.length > 0 && evidenceRefs.length === 0
      ? ["evidence_refs_missing"]
      : [];
  const sideEffects = buildNoSideEffectsSummary(summaries);
  const reviewStatus = determineReviewStatus({
    storeStatus: input.store_result?.status ?? null,
    suppliedRecordCount: suppliedRecords.length,
    validRecordCount: validSummaries.length,
    selectedRecordId,
    selectedRecordFound: Boolean(selectedRecordSummary),
    problemRecordIds,
  });

  return {
    review_version: CODEX_RESULT_REPORT_INTAKE_RECORD_REVIEW_VERSION,
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
      selected_candidate_ref_count: sum(
        validSummaries.map((summary) => summary.selected_candidate_ref_count),
      ),
      sanitized_candidate_summary_count: sum(
        validSummaries.map(
          (summary) => summary.sanitized_candidate_summary_count,
        ),
      ),
      receipt_side_effect_problem_count: summaries.filter(
        (summary) => !summary.receipt_no_side_effects_valid,
      ).length,
    },
    record_summaries: summaries,
    selected_record_summary: selectedRecordSummary,
    latest_record_summary: latestRecordSummary,
    records: validRecords,
    evidence_summary: {
      supplied_record_count: suppliedRecords.length,
      valid_record_count: validSummaries.length,
      has_records: validSummaries.length > 0,
      has_selected_record: Boolean(selectedRecordSummary),
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_receipt_side_effect_problem:
        summaries.some((summary) => !summary.receipt_no_side_effects_valid),
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      problem_record_ids: problemRecordIds,
    },
    receipt_no_side_effects_summary: sideEffects,
    blocked_reasons: problemRecordIds.map(
      (recordId) => `problem_codex_result_report_intake_record:${recordId}`,
    ),
    insufficient_data_reasons: buildInsufficientDataReasons({
      reviewStatus,
      selectedRecordId,
      selectedRecordFound: Boolean(selectedRecordSummary),
    }),
    operator_review_checklist: [
      "review_latest_codex_result_report_candidate_ingest_record",
      "confirm_receipt_no_side_effects_show_no_work_episode_delta_reuse_metrics_memory_perspective_cwp_relay_or_handoff_mutation",
      "confirm_candidate_summaries_are_sanitized_and_bounded",
      "confirm_codex_result_report_intake_record_is_not_dogfood_outcome_memory_or_perspective_state",
    ],
    would_not_do: [
      "does_not_open_db_from_workbench",
      "does_not_create_schema",
      "does_not_write_work_episode",
      "does_not_write_expected_observed_delta",
      "does_not_write_reuse_outcome_ledger",
      "does_not_write_dogfood_metrics",
      "does_not_write_memory",
      "does_not_mutate_current_working_perspective",
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_update_continuity_relay",
      "does_not_mutate_handoff_context",
      "does_not_send_handoff",
      "does_not_call_provider_openai_github_or_codex",
    ],
    non_goals: [
      "memory_write",
      "perspective_unit_durable_mutation",
      "next_work_bias_durable_mutation",
      "cwp_mutation",
      "continuity_relay_write",
      "handoff_context_mutation_or_send",
      "dogfood_metric_write",
      "reuse_outcome_ledger_write",
      "expected_observed_delta_write",
      "work_episode_write",
      "provider_github_codex_call",
      "automatic_codex_result_report_promotion",
    ],
    authority_boundary:
      createCodexResultReportIntakeRecordReviewAuthorityBoundaryV01(),
  };
}

export function createCodexResultReportIntakeRecordReviewAuthorityBoundaryV01(): CodexResultReportIntakeRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_ingest_record: false,
    can_create_ingest_receipt: false,
    can_write_work_episode: false,
    can_write_expected_observed_delta: false,
    can_write_reuse_outcome_ledger: false,
    can_write_dogfood_metrics: false,
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
      "Read-only review of already-read Codex result report candidate ingest records.",
      "The review builder does not open DB handles, create schema, write records, mutate WorkEpisode/ExpectedObservedDelta/reuse/dogfood/memory/Perspective/CWP/handoff state, call providers/GitHub/Codex, or run autonomous actions.",
    ],
  };
}

function evaluateRecord(recordLike: unknown): {
  record: CodexResultReportIntakeRecord | null;
  summary: CodexResultReportIntakeRecordSummary;
  valid: boolean;
} {
  const record = isRecord(recordLike)
    ? (recordLike as unknown as Partial<CodexResultReportIntakeRecord>)
    : null;
  const recordId =
    typeof recordLike === "object" &&
    recordLike &&
    "record_id" in recordLike &&
    typeof recordLike.record_id === "string"
      ? recordLike.record_id
      : "malformed_codex_result_report_record";
  const problemReasons = recordProblems(record);
  const selectedCandidateRefs = Array.isArray(record?.selected_candidate_refs)
    ? record.selected_candidate_refs
    : [];
  const evidenceRefs = Array.isArray(record?.evidence_refs)
    ? record.evidence_refs
    : [];
  const sourceRefs = Array.isArray(record?.source_refs)
    ? record.source_refs
    : [];
  const summaries = Array.isArray(record?.sanitized_candidate_summaries)
    ? record.sanitized_candidate_summaries
    : [];
  const counts = record?.candidate_counts_by_kind ?? {};
  return {
    record: problemReasons.length === 0 ? (record as CodexResultReportIntakeRecord) : null,
    summary: {
      record_id: recordId,
      idempotency_key: record?.idempotency_key ?? "",
      created_at: record?.created_at ?? "",
      operator_ref: record?.operator_ref ?? null,
      source_ref: record?.source_ref ?? null,
      work_ref: record?.work_ref ?? null,
      result_ref: record?.result_ref ?? null,
      pr_ref: record?.pr_ref ?? null,
      commit_ref: record?.commit_ref ?? null,
      selected_candidate_ref_count: selectedCandidateRefs.length,
      sanitized_candidate_summary_count: summaries.length,
      changed_file_count: record?.changed_files_summary?.length ?? counts.changed_artifact_ref ?? 0,
      check_result_count: record?.checks_summary?.length ?? counts.expected_observed_signal ?? 0,
      skipped_check_count: record?.skipped_checks_summary?.length ?? 0,
      not_done_count: record?.not_done_summary?.length ?? 0,
      followup_count: record?.followup_summary?.length ?? counts.next_action ?? 0,
      evidence_ref_count: evidenceRefs.length,
      source_ref_count: sourceRefs.length,
      privacy_review_confirmation_ref:
        record?.privacy_review_confirmation_ref ?? null,
      review_status: record?.review_status ?? null,
      record_fingerprint: record?.record_fingerprint ?? null,
      receipt_no_side_effects_valid: problemReasons.every(
        (reason) =>
          !/side_effect|mutation|memory|handoff|provider|github|codex|dogfood|reuse|work_episode|expected_observed/i.test(
            reason,
          ),
      ),
      problem_reasons: problemReasons,
    },
    valid: problemReasons.length === 0,
  };
}

function recordProblems(record: Partial<CodexResultReportIntakeRecord> | null): string[] {
  if (!record) return ["record_malformed"];
  const reasons: string[] = [];
  if (record.record_version !== CODEX_RESULT_REPORT_INTAKE_RECORD_VERSION) {
    reasons.push("record_version_invalid");
  }
  if (record.scope !== CODEX_RESULT_REPORT_INTAKE_SCOPE) {
    reasons.push("record_scope_invalid");
  }
  if (!record.selected_candidate_refs?.length) {
    reasons.push("selected_candidate_refs_missing");
  }
  if (!record.evidence_refs?.length) reasons.push("evidence_refs_missing");
  if (!record.source_refs?.length) reasons.push("source_refs_missing");
  const authority = record.authority_boundary;
  if (
    !authority ||
    authority.can_write_work_episode !== false ||
    authority.can_write_expected_observed_delta !== false ||
    authority.can_write_reuse_outcome_ledger !== false ||
    authority.can_write_dogfood_metrics !== false ||
    authority.can_write_memory !== false ||
    authority.can_mutate_current_working_perspective !== false ||
    authority.can_write_perspective_unit !== false ||
    authority.can_write_next_work_bias !== false ||
    authority.can_update_continuity_relay !== false ||
    authority.can_mutate_handoff_context !== false ||
    authority.can_send_handoff !== false ||
    authority.can_call_provider_openai !== false ||
    authority.can_call_github !== false ||
    authority.can_execute_codex !== false
  ) {
    reasons.push("authority_boundary_side_effect_problem");
  }
  const noPromotion = record.no_promotion_performed;
  if (
    !noPromotion ||
    noPromotion.work_episode_written !== false ||
    noPromotion.expected_observed_delta_written !== false ||
    noPromotion.reuse_outcome_ledger_written !== false ||
    noPromotion.dogfood_metrics_written !== false ||
    noPromotion.memory_promoted !== false ||
    noPromotion.current_working_perspective_updated !== false ||
    noPromotion.perspective_unit_written !== false ||
    noPromotion.next_work_bias_written !== false ||
    noPromotion.continuity_relay_written !== false ||
    noPromotion.handoff_context_mutated !== false ||
    noPromotion.handoff_sent !== false
  ) {
    reasons.push("no_promotion_side_effect_problem");
  }
  return uniqueStrings(reasons);
}

function buildNoSideEffectsSummary(
  summaries: CodexResultReportIntakeRecordSummary[],
): CodexResultReportIntakeNoSideEffectsSummary {
  const invalidCount = summaries.filter(
    (summary) => !summary.receipt_no_side_effects_valid,
  ).length;
  return {
    codex_result_report_intake_record_written_count: summaries.length,
    codex_result_report_intake_receipt_written_count: summaries.length,
    codex_result_report_persisted_as_candidate_record_count: summaries.length,
    work_episode_residue_written_count: invalidCount,
    expected_observed_delta_written_count: invalidCount,
    reuse_outcome_ledger_written_count: invalidCount,
    dogfood_metrics_written_count: invalidCount,
    memory_mutated_count: invalidCount,
    current_working_perspective_updated_count: invalidCount,
    perspective_unit_written_count: invalidCount,
    next_work_bias_written_count: invalidCount,
    continuity_relay_written_count: invalidCount,
    handoff_context_mutated_count: invalidCount,
    handoff_sent_count: invalidCount,
    provider_called_count: invalidCount,
    github_called_count: invalidCount,
    codex_executed_count: invalidCount,
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
}): CodexResultReportIntakeRecordReviewStatus {
  if (storeStatus === "schema_missing") return "schema_missing";
  if (problemRecordIds.length > 0 && validRecordCount === 0) return "records_invalid";
  if (selectedRecordId && selectedRecordFound) return "selected_record_found";
  if (selectedRecordId && !selectedRecordFound) return "selected_record_missing";
  if (validRecordCount > 0) return "records_available";
  if (suppliedRecordCount > 0) return "records_invalid";
  return "no_records";
}

function buildInsufficientDataReasons({
  reviewStatus,
  selectedRecordId,
  selectedRecordFound,
}: {
  reviewStatus: CodexResultReportIntakeRecordReviewStatus;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): string[] {
  const reasons: string[] = [];
  if (reviewStatus === "no_records") {
    reasons.push("codex_result_report_intake_records_missing");
  }
  if (reviewStatus === "schema_missing") {
    reasons.push("codex_result_report_intake_record_schema_missing");
  }
  if (selectedRecordId && !selectedRecordFound) {
    reasons.push("selected_codex_result_report_intake_record_missing");
  }
  return reasons;
}

function compareRecordsNewestFirst(
  left: CodexResultReportIntakeRecord,
  right: CodexResultReportIntakeRecord,
): number {
  return `${right.created_at}:${right.record_id}`.localeCompare(
    `${left.created_at}:${left.record_id}`,
  );
}

function compareSummariesNewestFirst(
  left: CodexResultReportIntakeRecordSummary,
  right: CodexResultReportIntakeRecordSummary,
): number {
  return `${right.created_at}:${right.record_id}`.localeCompare(
    `${left.created_at}:${left.record_id}`,
  );
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
