import {
  EXPECTED_OBSERVED_DELTA_RECORD_REVIEW_VERSION,
  type ExpectedObservedDeltaNoSideEffectsSummary,
  type ExpectedObservedDeltaRecordReview,
  type ExpectedObservedDeltaRecordReviewAuthorityBoundary,
  type ExpectedObservedDeltaRecordReviewInput,
  type ExpectedObservedDeltaRecordReviewStatus,
  type ExpectedObservedDeltaRecordSummary,
} from "@/types/expected-observed-delta-record-review";
import {
  EXPECTED_OBSERVED_DELTA_RECORD_VERSION,
  EXPECTED_OBSERVED_DELTA_SCOPE,
  type ExpectedObservedDeltaNoSideEffects,
  type ExpectedObservedDeltaRecord,
  type ExpectedObservedDeltaStoreResult,
} from "@/types/expected-observed-delta-write";

const forbiddenNoSideEffectFields: Array<keyof ExpectedObservedDeltaNoSideEffects> = [
  "reuse_outcome_ledger_written",
  "dogfood_metrics_written",
  "work_episode_written",
  "memory_mutated",
  "current_working_perspective_updated",
  "perspective_unit_written",
  "next_work_bias_written",
  "continuity_relay_written",
  "handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
  "handoff_sent",
  "provider_called",
  "github_called",
  "codex_executed",
  "pr_created",
  "pr_merged",
  "autonomous_action_run",
  "graph_or_vector_store_created",
  "rag_stack_created",
  "crawler_or_browser_observer_created",
];

export function buildExpectedObservedDeltaRecordReviewV01(
  input: ExpectedObservedDeltaRecordReviewInput = {},
): ExpectedObservedDeltaRecordReview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const scope = input.scope ?? EXPECTED_OBSERVED_DELTA_SCOPE;
  const storeResultRecords = Array.isArray(input.store_result?.records)
    ? input.store_result.records
    : [];
  const suppliedRecords = Array.isArray(input.records)
    ? input.records
    : storeResultRecords.length > 0
      ? storeResultRecords
      : input.store_result?.record
        ? [input.store_result.record]
        : [];
  const storeSideEffectProblemReasons = storeResultSideEffectProblemReasons(
    input.store_result ?? null,
  );
  const selectedRecordId =
    typeof input.selected_record_id === "string" &&
    input.selected_record_id.trim()
      ? input.selected_record_id
      : null;
  const evaluations = suppliedRecords.map((record) =>
    evaluateRecord(record, storeSideEffectProblemReasons),
  );
  const validRecords = evaluations
    .filter((evaluation) => evaluation.valid)
    .map((evaluation) => evaluation.record)
    .filter((record): record is ExpectedObservedDeltaRecord => Boolean(record))
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
  const sideEffects = buildNoSideEffectsSummary(
    summaries,
    input.store_result ?? null,
  );
  const receiptSideEffectProblemCount = Math.max(
    summaries.filter((summary) => !summary.receipt_no_side_effects_valid)
      .length,
    storeResultSideEffectProblemCount(input.store_result ?? null),
  );
  const reviewStatus = determineReviewStatus({
    storeStatus: input.store_result?.status ?? null,
    suppliedRecordCount: suppliedRecords.length,
    validRecordCount: validSummaries.length,
    selectedRecordId,
    selectedRecordFound: Boolean(selectedRecordSummary),
    problemRecordIds,
    receiptSideEffectProblemCount,
  });
  const recordMaterialSummary = {
    matched_expectation_count: sum(
      validSummaries.map((summary) => summary.matched_expectation_count),
    ),
    missing_expectation_count: sum(
      validSummaries.map((summary) => summary.missing_expectation_count),
    ),
    unexpected_observation_count: sum(
      validSummaries.map((summary) => summary.unexpected_observation_count),
    ),
    skipped_or_unverified_check_count: sum(
      validSummaries.map((summary) => summary.skipped_or_unverified_check_count),
    ),
    not_done_count: sum(validSummaries.map((summary) => summary.not_done_count)),
    changed_file_delta_count: sum(
      validSummaries.map((summary) => summary.changed_file_delta_count),
    ),
    requirement_progress_delta_count: sum(
      validSummaries.map((summary) => summary.requirement_progress_delta_count),
    ),
    non_goal_risk_count: sum(
      validSummaries.map((summary) => summary.non_goal_risk_count),
    ),
    followup_count: sum(validSummaries.map((summary) => summary.followup_count)),
    context_reuse_signal_count: sum(
      validSummaries.map((summary) => summary.context_reuse_signal_count),
    ),
  };

  return {
    review_version: EXPECTED_OBSERVED_DELTA_RECORD_REVIEW_VERSION,
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
      selected_delta_candidate_ref_count: sum(
        validRecords.map((record) => record.selected_delta_candidate_refs.length),
      ),
      receipt_side_effect_problem_count: receiptSideEffectProblemCount,
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
        receiptSideEffectProblemCount > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      problem_record_ids: problemRecordIds,
    },
    record_material_summary: recordMaterialSummary,
    receipt_no_side_effects_summary: sideEffects,
    blocked_reasons: uniqueStrings([
      ...problemRecordIds.map(
        (recordId) => `problem_expected_observed_delta_record:${recordId}`,
      ),
      ...storeSideEffectProblemReasons,
    ]),
    insufficient_data_reasons: buildInsufficientDataReasons({
      reviewStatus,
      selectedRecordId,
      selectedRecordFound: Boolean(selectedRecordSummary),
    }),
    operator_review_checklist: [
      "review_latest_expected_observed_delta_record",
      "confirm_receipt_no_side_effects_show_no_reuse_metric_work_episode_memory_perspective_cwp_relay_or_handoff_mutation",
      "confirm_skipped_and_not_done_counts_remain_gap_signals",
      "confirm_expected_observed_delta_record_is_not_validation_approval_or_canonical_truth",
    ],
    would_not_do: [
      "does_not_open_db_from_workbench",
      "does_not_create_schema",
      "does_not_write_expected_observed_delta",
      "does_not_write_reuse_outcome_ledger",
      "does_not_write_dogfood_metrics",
      "does_not_write_work_episode",
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
      "reuse_outcome_ledger_write",
      "dogfood_metric_write",
      "work_episode_durable_write",
      "memory_write",
      "perspective_unit_durable_mutation",
      "next_work_bias_durable_mutation",
      "cwp_mutation",
      "continuity_relay_write",
      "handoff_context_mutation_or_send",
      "provider_github_codex_call",
      "automatic_expected_observed_delta_promotion",
    ],
    authority_boundary:
      createExpectedObservedDeltaRecordReviewAuthorityBoundaryV01(),
  };
}

export function createExpectedObservedDeltaRecordReviewAuthorityBoundaryV01(): ExpectedObservedDeltaRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_write_expected_observed_delta: false,
    can_write_reuse_outcome_ledger: false,
    can_write_dogfood_metrics: false,
    can_write_work_episode: false,
    can_write_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
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
      "Read-only review of already-read ExpectedObservedDelta records.",
      "The review builder does not open DB handles, create schema, write records, mutate reuse/dogfood/WorkEpisode/memory/Perspective/CWP/handoff state, call providers/GitHub/Codex, or run autonomous actions.",
    ],
  };
}

function evaluateRecord(
  recordLike: unknown,
  extraProblemReasons: string[] = [],
): {
  record: ExpectedObservedDeltaRecord | null;
  summary: ExpectedObservedDeltaRecordSummary;
  valid: boolean;
} {
  const record = isRecord(recordLike)
    ? (recordLike as unknown as Partial<ExpectedObservedDeltaRecord>)
    : null;
  const recordId =
    typeof recordLike === "object" &&
    recordLike &&
    "record_id" in recordLike &&
    typeof recordLike.record_id === "string"
      ? recordLike.record_id
      : "malformed_expected_observed_delta_record";
  const problemReasons = uniqueStrings([
    ...recordProblems(record),
    ...extraProblemReasons,
  ]);
  const sourceRefs = Array.isArray(record?.source_refs) ? record.source_refs : [];
  const evidenceRefs = Array.isArray(record?.evidence_refs)
    ? record.evidence_refs
    : [];
  return {
    record: problemReasons.length === 0 ? (record as ExpectedObservedDeltaRecord) : null,
    summary: {
      record_id: recordId,
      idempotency_key: record?.idempotency_key ?? "",
      created_at: record?.created_at ?? "",
      operator_ref: record?.operator_ref ?? null,
      work_ref: record?.work_ref ?? null,
      result_ref: record?.result_ref ?? null,
      handoff_ref: record?.handoff_ref ?? null,
      matched_expectation_count: record?.matched_expectations?.length ?? 0,
      missing_expectation_count: record?.missing_expectations?.length ?? 0,
      unexpected_observation_count:
        record?.unexpected_observations?.length ?? 0,
      skipped_or_unverified_check_count:
        record?.skipped_or_unverified_checks?.length ?? 0,
      not_done_count: record?.not_done_items?.length ?? 0,
      changed_file_delta_count: record?.changed_file_deltas?.length ?? 0,
      requirement_progress_delta_count:
        record?.requirement_progress_deltas?.length ?? 0,
      non_goal_risk_count: record?.non_goal_risks?.length ?? 0,
      followup_count: record?.followups?.length ?? 0,
      context_reuse_signal_count: record?.context_reuse_signals?.length ?? 0,
      evidence_ref_count: evidenceRefs.length,
      source_ref_count: sourceRefs.length,
      review_status: record?.review_status ?? null,
      record_fingerprint: record?.record_fingerprint ?? null,
      receipt_no_side_effects_valid: problemReasons.every(
        (reason) =>
          !/side_effect|mutation|memory|handoff|provider|github|codex|dogfood|reuse|work_episode|perspective|relay/i.test(
            reason,
          ),
      ),
      problem_reasons: problemReasons,
    },
    valid: problemReasons.length === 0,
  };
}

function recordProblems(record: Partial<ExpectedObservedDeltaRecord> | null): string[] {
  if (!record) return ["record_malformed"];
  const reasons: string[] = [];
  if (record.record_version !== EXPECTED_OBSERVED_DELTA_RECORD_VERSION) {
    reasons.push("record_version_invalid");
  }
  if (record.scope !== EXPECTED_OBSERVED_DELTA_SCOPE) {
    reasons.push("record_scope_invalid");
  }
  if (!record.selected_delta_candidate_refs?.length) {
    reasons.push("selected_delta_candidate_refs_missing");
  }
  if (!record.evidence_refs?.length) reasons.push("evidence_refs_missing");
  if (!record.source_refs?.length) reasons.push("source_refs_missing");
  if (containsRawMaterial(record)) {
    reasons.push("raw_result_report_material_leaked");
  }
  const authority = record.authority_boundary;
  if (
    !authority ||
    authority.can_write_reuse_outcome_ledger !== false ||
    authority.can_write_dogfood_metrics !== false ||
    authority.can_write_work_episode !== false ||
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
    noPromotion.reuse_outcome_ledger_written !== false ||
    noPromotion.dogfood_metrics_written !== false ||
    noPromotion.work_episode_written !== false ||
    noPromotion.memory_mutated !== false ||
    noPromotion.current_working_perspective_updated !== false ||
    noPromotion.perspective_unit_written !== false ||
    noPromotion.next_work_bias_written !== false ||
    noPromotion.continuity_relay_written !== false ||
    noPromotion.handoff_context_mutated !== false ||
    noPromotion.selected_refs_written_to_live_handoff !== false ||
    noPromotion.handoff_sent !== false
  ) {
    reasons.push("no_promotion_side_effect_problem");
  }
  return uniqueStrings(reasons);
}

function buildNoSideEffectsSummary(
  summaries: ExpectedObservedDeltaRecordSummary[],
  storeResult: ExpectedObservedDeltaStoreResult | null,
): ExpectedObservedDeltaNoSideEffectsSummary {
  const invalidCount = summaries.filter(
    (summary) => !summary.receipt_no_side_effects_valid,
  ).length;
  const fieldCount = (field: keyof ExpectedObservedDeltaNoSideEffects): number =>
    Math.max(invalidCount, storeResultForbiddenFieldCount(storeResult, field));

  return {
    expected_observed_delta_record_written_count: summaries.length,
    expected_observed_delta_receipt_written_count: summaries.length,
    expected_observed_delta_persisted_as_dogfood_signal_record_count:
      summaries.length,
    reuse_outcome_ledger_written_count: fieldCount("reuse_outcome_ledger_written"),
    dogfood_metrics_written_count: fieldCount("dogfood_metrics_written"),
    work_episode_written_count: fieldCount("work_episode_written"),
    memory_mutated_count: fieldCount("memory_mutated"),
    current_working_perspective_updated_count: fieldCount(
      "current_working_perspective_updated",
    ),
    perspective_unit_written_count: fieldCount("perspective_unit_written"),
    next_work_bias_written_count: fieldCount("next_work_bias_written"),
    continuity_relay_written_count: fieldCount("continuity_relay_written"),
    handoff_context_mutated_count: fieldCount("handoff_context_mutated"),
    selected_refs_written_to_live_handoff_count: fieldCount(
      "selected_refs_written_to_live_handoff",
    ),
    handoff_sent_count: fieldCount("handoff_sent"),
    provider_called_count: fieldCount("provider_called"),
    github_called_count: fieldCount("github_called"),
    codex_executed_count: fieldCount("codex_executed"),
    pr_created_count: fieldCount("pr_created"),
    pr_merged_count: fieldCount("pr_merged"),
    autonomous_action_run_count: fieldCount("autonomous_action_run"),
    graph_or_vector_store_created_count: fieldCount(
      "graph_or_vector_store_created",
    ),
    rag_stack_created_count: fieldCount("rag_stack_created"),
    crawler_or_browser_observer_created_count: fieldCount(
      "crawler_or_browser_observer_created",
    ),
  };
}

function determineReviewStatus({
  storeStatus,
  suppliedRecordCount,
  validRecordCount,
  selectedRecordId,
  selectedRecordFound,
  problemRecordIds,
  receiptSideEffectProblemCount,
}: {
  storeStatus: string | null;
  suppliedRecordCount: number;
  validRecordCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
  problemRecordIds: string[];
  receiptSideEffectProblemCount: number;
}): ExpectedObservedDeltaRecordReviewStatus {
  if (storeStatus === "schema_missing") return "schema_missing";
  if (receiptSideEffectProblemCount > 0) return "records_invalid";
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
  reviewStatus: ExpectedObservedDeltaRecordReviewStatus;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): string[] {
  const reasons: string[] = [];
  if (reviewStatus === "no_records") {
    reasons.push("expected_observed_delta_records_missing");
  }
  if (reviewStatus === "schema_missing") {
    reasons.push("expected_observed_delta_record_schema_missing");
  }
  if (selectedRecordId && !selectedRecordFound) {
    reasons.push("selected_expected_observed_delta_record_missing");
  }
  return reasons;
}

function storeResultSideEffectProblemReasons(
  storeResult: ExpectedObservedDeltaStoreResult | null,
): string[] {
  if (!storeResult) return [];
  return uniqueStrings([
    ...noSideEffectProblemReasons(storeResult.receipt?.no_side_effects),
    ...noSideEffectProblemReasons(storeResult.no_side_effects),
  ]);
}

function noSideEffectProblemReasons(value: unknown): string[] {
  if (!isRecord(value)) return [];
  return forbiddenNoSideEffectFields.some((field) => value[field] === true)
    ? ["receipt_no_side_effects_claims_forbidden_side_effect"]
    : [];
}

function storeResultSideEffectProblemCount(
  storeResult: ExpectedObservedDeltaStoreResult | null,
): number {
  if (!storeResult) return 0;
  return Math.max(
    ...forbiddenNoSideEffectFields.map((field) =>
      storeResultForbiddenFieldCount(storeResult, field),
    ),
    0,
  );
}

function storeResultForbiddenFieldCount(
  storeResult: ExpectedObservedDeltaStoreResult | null,
  field: keyof ExpectedObservedDeltaNoSideEffects,
): number {
  if (!storeResult) return 0;
  let count = 0;
  if (
    isRecord(storeResult.receipt?.no_side_effects) &&
    storeResult.receipt.no_side_effects[field] === true
  ) {
    count += 1;
  }
  if (isRecord(storeResult.no_side_effects) && storeResult.no_side_effects[field] === true) {
    count += 1;
  }
  return count;
}

function containsRawMaterial(value: unknown): boolean {
  const serialized = JSON.stringify(value).toLowerCase();
  return /raw_text|raw_report|raw_excerpt/.test(serialized);
}

function compareRecordsNewestFirst(
  left: ExpectedObservedDeltaRecord,
  right: ExpectedObservedDeltaRecord,
): number {
  return right.created_at.localeCompare(left.created_at) ||
    right.record_id.localeCompare(left.record_id);
}

function compareSummariesNewestFirst(
  left: ExpectedObservedDeltaRecordSummary,
  right: ExpectedObservedDeltaRecordSummary,
): number {
  return right.created_at.localeCompare(left.created_at) ||
    right.record_id.localeCompare(left.record_id);
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
