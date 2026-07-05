import {
  NEXT_WORK_SIGNAL_DECISION_RECORD_REVIEW_VERSION,
  type NextWorkSignalDecisionNoSideEffectsSummary,
  type NextWorkSignalDecisionRecordReview,
  type NextWorkSignalDecisionRecordReviewAuthorityBoundary,
  type NextWorkSignalDecisionRecordReviewInput,
  type NextWorkSignalDecisionRecordReviewStatus,
  type NextWorkSignalDecisionRecordSummary,
} from "@/types/next-work-signal-decision-record-review";
import {
  NEXT_WORK_SIGNAL_DECISION_RECORD_VERSION,
  NEXT_WORK_SIGNAL_DECISION_SCOPE,
  type NextWorkSignalDecisionNoSideEffects,
  type NextWorkSignalDecisionRecord,
  type NextWorkSignalDecisionStoreResult,
} from "@/types/next-work-signal-decision-write";

const forbiddenNoSideEffectFields: Array<keyof NextWorkSignalDecisionNoSideEffects> = [
  "perspective_unit_written",
  "next_work_bias_written",
  "current_working_perspective_updated",
  "continuity_relay_written",
  "handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
  "handoff_sent",
  "memory_mutated",
  "dogfood_metrics_global_state_updated",
  "dogfood_metric_snapshot_written",
  "reuse_outcome_ledger_written",
  "expected_observed_delta_written",
  "work_episode_written",
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

export function buildNextWorkSignalDecisionRecordReviewV01(
  input: NextWorkSignalDecisionRecordReviewInput = {},
): NextWorkSignalDecisionRecordReview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const scope = input.scope ?? NEXT_WORK_SIGNAL_DECISION_SCOPE;
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
    .filter((record): record is NextWorkSignalDecisionRecord => Boolean(record))
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
    preserve_context_count: sum(
      validSummaries.map((summary) => summary.preserve_context_count),
    ),
    warn_context_count: sum(
      validSummaries.map((summary) => summary.warn_context_count),
    ),
    drop_or_deprioritize_count: sum(
      validSummaries.map((summary) => summary.drop_or_deprioritize_count),
    ),
    verification_focus_count: sum(
      validSummaries.map((summary) => summary.verification_focus_count),
    ),
    expected_observed_followup_count: sum(
      validSummaries.map((summary) => summary.expected_observed_followup_count),
    ),
    handoff_quality_focus_count: sum(
      validSummaries.map((summary) => summary.handoff_quality_focus_count),
    ),
    context_diet_count: sum(
      validSummaries.map((summary) => summary.context_diet_count),
    ),
    review_burden_reduction_count: sum(
      validSummaries.map((summary) => summary.review_burden_reduction_count),
    ),
  };

  return {
    review_version: NEXT_WORK_SIGNAL_DECISION_RECORD_REVIEW_VERSION,
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
      selected_signal_ref_count: sum(
        validRecords.map((record) => record.selected_signal_refs.length),
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
      has_receipt_side_effect_problem: receiptSideEffectProblemCount > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      problem_record_ids: problemRecordIds,
    },
    record_material_summary: recordMaterialSummary,
    receipt_no_side_effects_summary: sideEffects,
    blocked_reasons: uniqueStrings([
      ...problemRecordIds.map(
        (recordId) => `problem_next_work_signal_decision_record:${recordId}`,
      ),
      ...storeSideEffectProblemReasons,
    ]),
    insufficient_data_reasons: buildInsufficientDataReasons({
      reviewStatus,
      selectedRecordId,
      selectedRecordFound: Boolean(selectedRecordSummary),
    }),
    operator_review_checklist: [
      "review_latest_next_work_signal_decision_record",
      "confirm_receipt_no_side_effects_show_no_perspective_nextworkbias_cwp_relay_handoff_memory_metrics_or_external_mutation",
      "confirm_record_is_candidate_material_for_future_perspective_relay_decisions_only",
    ],
    would_not_do: [
      "does_not_open_db_from_workbench",
      "does_not_create_schema",
      "does_not_write_next_work_signal_decision",
      "does_not_write_perspective_unit_or_next_work_bias",
      "does_not_mutate_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_or_send_handoff",
      "does_not_write_memory_metrics_or_upstream_ledgers",
      "does_not_call_provider_openai_github_or_codex",
    ],
    non_goals: [
      "perspective_unit_write",
      "next_work_bias_write",
      "cwp_mutation",
      "continuity_relay_write",
      "handoff_context_mutation_or_send",
      "memory_write",
      "global_metric_update",
      "external_action",
    ],
    authority_boundary:
      createNextWorkSignalDecisionRecordReviewAuthorityBoundaryV01(),
  };
}

export function createNextWorkSignalDecisionRecordReviewAuthorityBoundaryV01(): NextWorkSignalDecisionRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_write_next_work_signal_decision: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
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
      "Read-only review of already-read NextWorkSignal decision records.",
      "Workbench default does not open DB handles, call routes, create schema, or write records.",
    ],
  };
}

function evaluateRecord(
  value: unknown,
  storeSideEffectProblemReasons: string[],
): {
  valid: boolean;
  record: NextWorkSignalDecisionRecord | null;
  summary: NextWorkSignalDecisionRecordSummary;
} {
  if (!isNextWorkSignalDecisionRecord(value)) {
    return {
      valid: false,
      record: null,
      summary: invalidSummary("invalid-next-work-signal-decision-record", [
        "next_work_signal_decision_record_malformed",
      ]),
    };
  }
  const recordNoSideEffectsValid =
    value.authority_boundary.can_write_perspective_unit === false &&
    value.authority_boundary.can_write_next_work_bias === false &&
    value.authority_boundary.can_update_current_working_perspective === false &&
    value.authority_boundary.can_update_continuity_relay === false &&
    value.authority_boundary.can_mutate_handoff_context === false &&
    value.authority_boundary.can_send_handoff === false &&
    value.authority_boundary.can_write_memory === false &&
    value.authority_boundary.can_write_dogfood_metrics === false &&
    value.authority_boundary.can_write_reuse_outcome_ledger === false &&
    value.authority_boundary.can_write_expected_observed_delta === false &&
    value.authority_boundary.can_write_work_episode === false &&
    value.authority_boundary.can_call_provider_openai === false &&
    value.authority_boundary.can_call_github === false &&
    value.authority_boundary.can_execute_codex === false;
  const problemReasons = uniqueStrings([
    ...(recordNoSideEffectsValid
      ? []
      : ["next_work_signal_decision_record_forbidden_side_effect_authority"]),
    ...storeSideEffectProblemReasons,
  ]);
  const summary = {
    record_id: value.record_id,
    idempotency_key: value.idempotency_key,
    created_at: value.created_at,
    operator_ref: value.operator_ref,
    metric_snapshot_source_count: value.source_metric_snapshot_record_refs.length,
    selected_signal_count: value.selected_signal_refs.length,
    preserve_context_count: value.preserve_context_refs.length,
    warn_context_count: value.warn_context_refs.length,
    drop_or_deprioritize_count: value.drop_or_deprioritize_context_refs.length,
    verification_focus_count: value.verification_focus_candidates.length,
    expected_observed_followup_count:
      value.expected_observed_followup_candidates.length,
    handoff_quality_focus_count: value.handoff_quality_focus_candidates.length,
    context_diet_count: value.context_diet_candidates.length,
    review_burden_reduction_count:
      value.review_burden_reduction_candidates.length,
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
): NextWorkSignalDecisionRecordSummary {
  return {
    record_id: recordId,
    idempotency_key: "",
    created_at: "",
    operator_ref: null,
    metric_snapshot_source_count: 0,
    selected_signal_count: 0,
    preserve_context_count: 0,
    warn_context_count: 0,
    drop_or_deprioritize_count: 0,
    verification_focus_count: 0,
    expected_observed_followup_count: 0,
    handoff_quality_focus_count: 0,
    context_diet_count: 0,
    review_burden_reduction_count: 0,
    record_fingerprint: null,
    receipt_no_side_effects_valid: false,
    problem_reasons: problemReasons,
  };
}

function buildNoSideEffectsSummary(
  summaries: NextWorkSignalDecisionRecordSummary[],
  storeResult: NextWorkSignalDecisionStoreResult | null,
): NextWorkSignalDecisionNoSideEffectsSummary {
  const receiptEffects = storeResult?.receipt.no_side_effects ?? null;
  return {
    next_work_signal_decision_record_written_count: countTrue(
      summaries,
      storeResult,
      "next_work_signal_decision_record_written",
      receiptEffects,
    ),
    next_work_signal_decision_receipt_written_count: countTrue(
      summaries,
      storeResult,
      "next_work_signal_decision_receipt_written",
      receiptEffects,
    ),
    next_work_signal_decision_persisted_count: countTrue(
      summaries,
      storeResult,
      "next_work_signal_decision_persisted",
      receiptEffects,
    ),
    perspective_unit_written_count: countForbidden(
      receiptEffects,
      "perspective_unit_written",
    ),
    next_work_bias_written_count: countForbidden(
      receiptEffects,
      "next_work_bias_written",
    ),
    current_working_perspective_updated_count: countForbidden(
      receiptEffects,
      "current_working_perspective_updated",
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
    memory_mutated_count: countForbidden(receiptEffects, "memory_mutated"),
    dogfood_metrics_global_state_updated_count: countForbidden(
      receiptEffects,
      "dogfood_metrics_global_state_updated",
    ),
    dogfood_metric_snapshot_written_count: countForbidden(
      receiptEffects,
      "dogfood_metric_snapshot_written",
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
  storeResult: NextWorkSignalDecisionStoreResult | null,
): string[] {
  if (!storeResult) return [];
  const reasons: string[] = [];
  if (!noSideEffectsValid(storeResult.no_side_effects)) {
    reasons.push("next_work_signal_decision_store_no_side_effects_invalid");
  }
  if (!noSideEffectsValid(storeResult.receipt.no_side_effects)) {
    reasons.push("next_work_signal_decision_receipt_no_side_effects_invalid");
  }
  return uniqueStrings(reasons);
}

function storeResultSideEffectProblemCount(
  storeResult: NextWorkSignalDecisionStoreResult | null,
): number {
  return storeResultSideEffectProblemReasons(storeResult).length;
}

function noSideEffectsValid(value: NextWorkSignalDecisionNoSideEffects): boolean {
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
}): NextWorkSignalDecisionRecordReviewStatus {
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
  reviewStatus: NextWorkSignalDecisionRecordReviewStatus;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): string[] {
  const reasons: string[] = [];
  if (reviewStatus === "no_records") {
    reasons.push("next_work_signal_decision_records_missing");
  }
  if (reviewStatus === "schema_missing") reasons.push("schema_missing");
  if (selectedRecordId && !selectedRecordFound) {
    reasons.push("selected_next_work_signal_decision_record_missing");
  }
  return uniqueStrings(reasons);
}

function isNextWorkSignalDecisionRecord(
  value: unknown,
): value is NextWorkSignalDecisionRecord {
  if (!isRecord(value)) return false;
  const authorityBoundary = value.authority_boundary;
  return (
    value.record_version === NEXT_WORK_SIGNAL_DECISION_RECORD_VERSION &&
    typeof value.record_id === "string" &&
    typeof value.idempotency_key === "string" &&
    typeof value.created_at === "string" &&
    (typeof value.operator_ref === "string" || value.operator_ref === null) &&
    typeof value.record_fingerprint === "string" &&
    isStringArray(value.source_refs) &&
    isStringArray(value.evidence_refs) &&
    isStringArray(value.source_metric_snapshot_record_refs) &&
    isStringArray(value.source_reuse_ledger_record_refs) &&
    isStringArray(value.source_expected_observed_delta_record_refs) &&
    isStringArray(value.selected_signal_refs) &&
    isStringArray(value.preserve_context_refs) &&
    isStringArray(value.warn_context_refs) &&
    isStringArray(value.drop_or_deprioritize_context_refs) &&
    isStringArray(value.verification_focus_candidates) &&
    isStringArray(value.expected_observed_followup_candidates) &&
    isStringArray(value.handoff_quality_focus_candidates) &&
    isStringArray(value.context_diet_candidates) &&
    isStringArray(value.review_burden_reduction_candidates) &&
    isRecord(authorityBoundary)
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function countTrue(
  summaries: NextWorkSignalDecisionRecordSummary[],
  storeResult: NextWorkSignalDecisionStoreResult | null,
  field: keyof NextWorkSignalDecisionNoSideEffects,
  receiptEffects: NextWorkSignalDecisionNoSideEffects | null,
): number {
  if (receiptEffects?.[field] === true) return 1;
  if (storeResult?.no_side_effects[field] === true) return 1;
  return summaries.filter((summary) => summary.receipt_no_side_effects_valid)
    .length;
}

function countForbidden(
  receiptEffects: NextWorkSignalDecisionNoSideEffects | null,
  field: keyof NextWorkSignalDecisionNoSideEffects,
): number {
  return receiptEffects?.[field] === true ? 1 : 0;
}

function compareRecordsNewestFirst(
  left: NextWorkSignalDecisionRecord,
  right: NextWorkSignalDecisionRecord,
): number {
  return right.created_at.localeCompare(left.created_at);
}

function compareSummariesNewestFirst(
  left: NextWorkSignalDecisionRecordSummary,
  right: NextWorkSignalDecisionRecordSummary,
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
