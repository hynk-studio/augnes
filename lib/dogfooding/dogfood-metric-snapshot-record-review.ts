import {
  DOGFOOD_METRIC_SNAPSHOT_RECORD_REVIEW_VERSION,
  type DogfoodMetricSnapshotNoSideEffectsSummary,
  type DogfoodMetricSnapshotRecordReview,
  type DogfoodMetricSnapshotRecordReviewAuthorityBoundary,
  type DogfoodMetricSnapshotRecordReviewInput,
  type DogfoodMetricSnapshotRecordReviewStatus,
  type DogfoodMetricSnapshotRecordSummary,
} from "@/types/dogfood-metric-snapshot-record-review";
import {
  DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION,
  DOGFOOD_METRIC_SNAPSHOT_SCOPE,
  type DogfoodMetricSnapshotNoSideEffects,
  type DogfoodMetricSnapshotRecord,
  type DogfoodMetricSnapshotStoreResult,
} from "@/types/dogfood-metric-snapshot-write";

const forbiddenNoSideEffectFields: Array<keyof DogfoodMetricSnapshotNoSideEffects> = [
  "dogfood_metrics_global_state_updated",
  "reuse_outcome_ledger_written",
  "expected_observed_delta_written",
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

export function buildDogfoodMetricSnapshotRecordReviewV01(
  input: DogfoodMetricSnapshotRecordReviewInput = {},
): DogfoodMetricSnapshotRecordReview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const scope = input.scope ?? DOGFOOD_METRIC_SNAPSHOT_SCOPE;
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
    .filter((record): record is DogfoodMetricSnapshotRecord => Boolean(record))
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
    helpful_context_signal_count: sum(
      validSummaries.map((summary) => summary.helpful_context_signal_count),
    ),
    stale_context_signal_count: sum(
      validSummaries.map((summary) => summary.stale_context_signal_count),
    ),
    missing_context_signal_count: sum(
      validSummaries.map((summary) => summary.missing_context_signal_count),
    ),
    noisy_context_signal_count: sum(
      validSummaries.map((summary) => summary.noisy_context_signal_count),
    ),
    misleading_context_signal_count: sum(
      validSummaries.map((summary) => summary.misleading_context_signal_count),
    ),
    unknown_context_signal_count: sum(
      validSummaries.map((summary) => summary.unknown_context_signal_count),
    ),
    skipped_or_unverified_check_count: sum(
      validSummaries.map((summary) => summary.skipped_or_unverified_check_count),
    ),
    not_done_item_count: sum(
      validSummaries.map((summary) => summary.not_done_item_count),
    ),
    expected_observed_mismatch_count: sum(
      validSummaries.map((summary) => summary.expected_observed_mismatch_count),
    ),
    review_burden_signal_count: sum(
      validSummaries.map((summary) => summary.review_burden_signal_count),
    ),
    carry_forward_candidate_count: sum(
      validSummaries.map((summary) => summary.carry_forward_candidate_count),
    ),
  };

  return {
    review_version: DOGFOOD_METRIC_SNAPSHOT_RECORD_REVIEW_VERSION,
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
      selected_metric_candidate_ref_count: sum(
        validRecords.map((record) => record.selected_metric_candidate_refs.length),
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
        (recordId) => `problem_dogfood_metric_snapshot_record:${recordId}`,
      ),
      ...storeSideEffectProblemReasons,
    ]),
    insufficient_data_reasons: buildInsufficientDataReasons({
      reviewStatus,
      selectedRecordId,
      selectedRecordFound: Boolean(selectedRecordSummary),
    }),
    operator_review_checklist: [
      "review_latest_dogfood_metric_snapshot_record",
      "confirm_receipt_no_side_effects_show_no_global_metric_reuse_ledger_expected_observed_work_episode_memory_perspective_cwp_relay_or_handoff_mutation",
      "confirm_snapshot_counts_do_not_claim_improvement_without_sufficient_data",
      "confirm_metric_snapshot_record_is_not_perspective_next_work_or_relay_write",
    ],
    would_not_do: [
      "does_not_open_db_from_workbench",
      "does_not_create_schema",
      "does_not_write_dogfood_metric_snapshot",
      "does_not_update_global_dogfood_metrics",
      "does_not_write_reuse_outcome_ledger",
      "does_not_write_expected_observed_delta",
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
      "global_dogfood_metric_update",
      "reuse_outcome_ledger_write",
      "expected_observed_delta_write",
      "work_episode_durable_write",
      "memory_write",
      "perspective_unit_durable_mutation",
      "next_work_bias_durable_mutation",
      "cwp_mutation",
      "continuity_relay_write",
      "handoff_context_mutation_or_send",
      "provider_github_codex_call",
      "automatic_metric_promotion",
    ],
    authority_boundary:
      createDogfoodMetricSnapshotRecordReviewAuthorityBoundaryV01(),
  };
}

export function createDogfoodMetricSnapshotRecordReviewAuthorityBoundaryV01(): DogfoodMetricSnapshotRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
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
      "Read-only review of already-read DogfoodMetricSnapshot records.",
      "Workbench default does not open DB handles, call routes, create schema, or write records.",
    ],
  };
}

function evaluateRecord(
  value: unknown,
  storeSideEffectProblemReasons: string[],
): {
  valid: boolean;
  record: DogfoodMetricSnapshotRecord | null;
  summary: DogfoodMetricSnapshotRecordSummary;
} {
  if (!isDogfoodMetricSnapshotRecord(value)) {
    return {
      valid: false,
      record: null,
      summary: invalidSummary("invalid-dogfood-metric-snapshot-record", [
        "dogfood_metric_snapshot_record_malformed",
      ]),
    };
  }
  const recordNoSideEffectsValid =
    value.authority_boundary.can_update_global_dogfood_metrics === false &&
    value.authority_boundary.can_write_reuse_outcome_ledger === false &&
    value.authority_boundary.can_write_expected_observed_delta === false &&
    value.authority_boundary.can_write_work_episode === false &&
    value.authority_boundary.can_write_memory === false &&
    value.authority_boundary.can_mutate_current_working_perspective === false &&
    value.authority_boundary.can_write_perspective_unit === false &&
    value.authority_boundary.can_write_next_work_bias === false &&
    value.authority_boundary.can_update_continuity_relay === false &&
    value.authority_boundary.can_mutate_handoff_context === false &&
    value.authority_boundary.can_call_provider_openai === false &&
    value.authority_boundary.can_call_github === false &&
    value.authority_boundary.can_execute_codex === false;
  const problemReasons = uniqueStrings([
    ...(recordNoSideEffectsValid
      ? []
      : ["dogfood_metric_snapshot_record_forbidden_side_effect_authority"]),
    ...storeSideEffectProblemReasons,
  ]);
  const summary = {
    record_id: value.record_id,
    idempotency_key: value.idempotency_key,
    created_at: value.created_at,
    operator_ref: value.operator_ref,
    metric_window_start: value.metric_window.since,
    metric_window_end: value.metric_window.until,
    reuse_ledger_source_count: value.source_reuse_ledger_record_refs.length,
    expected_observed_source_count:
      value.source_expected_observed_delta_record_refs.length,
    helpful_context_signal_count:
      value.aggregate_counts.helpful_context_signal_count,
    stale_context_signal_count:
      value.aggregate_counts.stale_context_signal_count,
    missing_context_signal_count:
      value.aggregate_counts.missing_context_signal_count,
    noisy_context_signal_count:
      value.aggregate_counts.noisy_context_signal_count,
    misleading_context_signal_count:
      value.aggregate_counts.misleading_context_signal_count,
    unknown_context_signal_count:
      value.aggregate_counts.unknown_context_signal_count,
    skipped_or_unverified_check_count:
      value.aggregate_counts.skipped_or_unverified_check_count,
    not_done_item_count: value.aggregate_counts.not_done_item_count,
    expected_observed_mismatch_count:
      value.aggregate_counts.expected_observed_mismatch_count,
    review_burden_signal_count:
      value.aggregate_counts.review_burden_signal_count,
    carry_forward_candidate_count:
      value.aggregate_counts.carry_forward_candidate_count,
    record_fingerprint: value.record_fingerprint,
    receipt_no_side_effects_valid:
      recordNoSideEffectsValid && storeSideEffectProblemReasons.length === 0,
    problem_reasons: problemReasons,
  };
  return {
    valid: problemReasons.length === 0,
    record: value,
    summary,
  };
}

function invalidSummary(
  recordId: string,
  problemReasons: string[],
): DogfoodMetricSnapshotRecordSummary {
  return {
    record_id: recordId,
    idempotency_key: "",
    created_at: "",
    operator_ref: null,
    metric_window_start: null,
    metric_window_end: null,
    reuse_ledger_source_count: 0,
    expected_observed_source_count: 0,
    helpful_context_signal_count: 0,
    stale_context_signal_count: 0,
    missing_context_signal_count: 0,
    noisy_context_signal_count: 0,
    misleading_context_signal_count: 0,
    unknown_context_signal_count: 0,
    skipped_or_unverified_check_count: 0,
    not_done_item_count: 0,
    expected_observed_mismatch_count: 0,
    review_burden_signal_count: 0,
    carry_forward_candidate_count: 0,
    record_fingerprint: null,
    receipt_no_side_effects_valid: false,
    problem_reasons: problemReasons,
  };
}

function buildNoSideEffectsSummary(
  summaries: DogfoodMetricSnapshotRecordSummary[],
  storeResult: DogfoodMetricSnapshotStoreResult | null,
): DogfoodMetricSnapshotNoSideEffectsSummary {
  const receiptEffects = storeResult?.receipt.no_side_effects ?? null;
  return {
    dogfood_metric_snapshot_record_written_count: countTrue(
      summaries,
      storeResult,
      "dogfood_metric_snapshot_record_written",
      receiptEffects,
    ),
    dogfood_metric_snapshot_receipt_written_count: countTrue(
      summaries,
      storeResult,
      "dogfood_metric_snapshot_receipt_written",
      receiptEffects,
    ),
    dogfood_metric_snapshot_persisted_count: countTrue(
      summaries,
      storeResult,
      "dogfood_metric_snapshot_persisted",
      receiptEffects,
    ),
    dogfood_metrics_global_state_updated_count: countForbidden(
      receiptEffects,
      "dogfood_metrics_global_state_updated",
    ),
    reuse_outcome_ledger_written_count: countForbidden(
      receiptEffects,
      "reuse_outcome_ledger_written",
    ),
    expected_observed_delta_written_count: countForbidden(
      receiptEffects,
      "expected_observed_delta_written",
    ),
    work_episode_written_count: countForbidden(receiptEffects, "work_episode_written"),
    memory_mutated_count: countForbidden(receiptEffects, "memory_mutated"),
    current_working_perspective_updated_count: countForbidden(
      receiptEffects,
      "current_working_perspective_updated",
    ),
    perspective_unit_written_count: countForbidden(
      receiptEffects,
      "perspective_unit_written",
    ),
    next_work_bias_written_count: countForbidden(
      receiptEffects,
      "next_work_bias_written",
    ),
    continuity_relay_written_count: countForbidden(
      receiptEffects,
      "continuity_relay_written",
    ),
    handoff_context_mutated_count: countForbidden(
      receiptEffects,
      "handoff_context_mutated",
    ),
    selected_refs_written_to_live_handoff_count: countForbidden(
      receiptEffects,
      "selected_refs_written_to_live_handoff",
    ),
    handoff_sent_count: countForbidden(receiptEffects, "handoff_sent"),
    provider_called_count: countForbidden(receiptEffects, "provider_called"),
    github_called_count: countForbidden(receiptEffects, "github_called"),
    codex_executed_count: countForbidden(receiptEffects, "codex_executed"),
    pr_created_count: countForbidden(receiptEffects, "pr_created"),
    pr_merged_count: countForbidden(receiptEffects, "pr_merged"),
    autonomous_action_run_count: countForbidden(
      receiptEffects,
      "autonomous_action_run",
    ),
    graph_or_vector_store_created_count: countForbidden(
      receiptEffects,
      "graph_or_vector_store_created",
    ),
    rag_stack_created_count: countForbidden(receiptEffects, "rag_stack_created"),
    crawler_or_browser_observer_created_count: countForbidden(
      receiptEffects,
      "crawler_or_browser_observer_created",
    ),
  };
}

function storeResultSideEffectProblemReasons(
  storeResult: DogfoodMetricSnapshotStoreResult | null,
): string[] {
  if (!storeResult) return [];
  const reasons: string[] = [];
  if (!noSideEffectsValid(storeResult.no_side_effects)) {
    reasons.push("dogfood_metric_snapshot_store_no_side_effects_invalid");
  }
  if (!noSideEffectsValid(storeResult.receipt.no_side_effects)) {
    reasons.push("dogfood_metric_snapshot_receipt_no_side_effects_invalid");
  }
  return uniqueStrings(reasons);
}

function storeResultSideEffectProblemCount(
  storeResult: DogfoodMetricSnapshotStoreResult | null,
): number {
  return storeResultSideEffectProblemReasons(storeResult).length;
}

function noSideEffectsValid(value: DogfoodMetricSnapshotNoSideEffects): boolean {
  return forbiddenNoSideEffectFields.every((field) => value[field] === false);
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
}): DogfoodMetricSnapshotRecordReviewStatus {
  if (problemRecordIds.length > 0 || receiptSideEffectProblemCount > 0) {
    return "records_invalid";
  }
  if (selectedRecordId && selectedRecordFound) return "selected_record_found";
  if (selectedRecordId) return "selected_record_missing";
  if (validRecordCount > 0) return "records_available";
  if (storeStatus === "schema_missing") return "schema_missing";
  if (suppliedRecordCount > 0) return "records_invalid";
  return "no_records";
}

function buildInsufficientDataReasons({
  reviewStatus,
  selectedRecordId,
  selectedRecordFound,
}: {
  reviewStatus: DogfoodMetricSnapshotRecordReviewStatus;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): string[] {
  const reasons: string[] = [];
  if (reviewStatus === "no_records") {
    reasons.push("dogfood_metric_snapshot_records_missing");
  }
  if (reviewStatus === "schema_missing") reasons.push("schema_missing");
  if (selectedRecordId && !selectedRecordFound) {
    reasons.push("selected_dogfood_metric_snapshot_record_missing");
  }
  return uniqueStrings(reasons);
}

function isDogfoodMetricSnapshotRecord(
  value: unknown,
): value is DogfoodMetricSnapshotRecord {
  return (
    isRecord(value) &&
    value.record_version === DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION &&
    isRecord(value.metric_window) &&
    isRecord(value.aggregate_counts) &&
    isRecord(value.authority_boundary) &&
    Array.isArray(value.selected_metric_candidate_refs)
  );
}

function countTrue(
  summaries: DogfoodMetricSnapshotRecordSummary[],
  storeResult: DogfoodMetricSnapshotStoreResult | null,
  field: keyof DogfoodMetricSnapshotNoSideEffects,
  receiptEffects: DogfoodMetricSnapshotNoSideEffects | null,
): number {
  if (receiptEffects?.[field] === true) return 1;
  if (storeResult?.no_side_effects[field] === true) return 1;
  return summaries.filter((summary) => summary.receipt_no_side_effects_valid)
    .length;
}

function countForbidden(
  receiptEffects: DogfoodMetricSnapshotNoSideEffects | null,
  field: keyof DogfoodMetricSnapshotNoSideEffects,
): number {
  return receiptEffects?.[field] === true ? 1 : 0;
}

function compareRecordsNewestFirst(
  left: DogfoodMetricSnapshotRecord,
  right: DogfoodMetricSnapshotRecord,
): number {
  return right.created_at.localeCompare(left.created_at);
}

function compareSummariesNewestFirst(
  left: DogfoodMetricSnapshotRecordSummary,
  right: DogfoodMetricSnapshotRecordSummary,
): number {
  return right.created_at.localeCompare(left.created_at);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
