import {
  PERSPECTIVE_NEXT_WORK_BIAS_RECORD_REVIEW_VERSION,
  type PerspectiveNextWorkBiasNoSideEffectsSummary,
  type PerspectiveNextWorkBiasRecordReview,
  type PerspectiveNextWorkBiasRecordReviewAuthorityBoundary,
  type PerspectiveNextWorkBiasRecordReviewInput,
  type PerspectiveNextWorkBiasRecordReviewStatus,
  type PerspectiveNextWorkBiasRecordSummary,
} from "@/types/perspective-next-work-bias-record-review";
import {
  PERSPECTIVE_NEXT_WORK_BIAS_RECORD_VERSION,
  PERSPECTIVE_NEXT_WORK_BIAS_SCOPE,
  type PerspectiveNextWorkBiasNoSideEffects,
  type PerspectiveNextWorkBiasRecord,
  type PerspectiveNextWorkBiasStoreResult,
} from "@/types/perspective-next-work-bias-write";

const forbiddenNoSideEffectFields: Array<keyof PerspectiveNextWorkBiasNoSideEffects> = [
  "perspective_unit_written",
  "current_working_perspective_updated",
  "continuity_relay_written",
  "handoff_context_mutated",
  "handoff_context_applied",
  "selected_refs_written_to_live_handoff",
  "handoff_sent",
  "memory_written",
  "memory_promoted",
  "memory_mutated",
  "dogfood_metrics_written",
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
  "browser_observed",
  "crawler_or_browser_observer_created",
  "workbench_action_button_rendered",
];

export function buildPerspectiveNextWorkBiasRecordReviewV01(
  input: PerspectiveNextWorkBiasRecordReviewInput = {},
): PerspectiveNextWorkBiasRecordReview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const scope = input.scope ?? PERSPECTIVE_NEXT_WORK_BIAS_SCOPE;
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
  const storeSideEffectProblemReasons = input.store_result
    ? storeResultSideEffectProblemReasons(input.store_result)
    : [];
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
    .filter((record): record is PerspectiveNextWorkBiasRecord => Boolean(record))
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
    ...validRecords.flatMap((record) => safeStringArray(record.source_refs)),
  ]);
  const evidenceRefs = uniqueStrings(
    validRecords.flatMap((record) => safeStringArray(record.evidence_refs)),
  );
  const missingEvidence =
    validRecords.length > 0 && evidenceRefs.length === 0
      ? ["evidence_refs_missing"]
      : [];
  const sideEffects = buildNoSideEffectsSummary(input.store_result ?? null);
  const receiptSideEffectProblemCount = input.store_result
    ? Math.max(
        summaries.filter((summary) => !summary.receipt_no_side_effects_valid)
          .length,
        storeSideEffectProblemReasons.length,
      )
    : summaries.filter((summary) => !summary.receipt_no_side_effects_valid)
        .length;
  const reviewStatus = determineReviewStatus({
    storeStatus: input.store_result?.status ?? null,
    suppliedRecordCount: suppliedRecords.length,
    validRecordCount: validSummaries.length,
    selectedRecordId,
    selectedRecordFound: Boolean(selectedRecordSummary),
    problemRecordIds,
    receiptSideEffectProblemCount,
  });
  const materialSummary = {
    selected_next_work_bias_candidate_count: sum(
      validSummaries.map(
        (summary) => summary.selected_next_work_bias_candidate_count,
      ),
    ),
    next_work_bias_entry_count: sum(
      validSummaries.map((summary) => summary.next_work_bias_entry_count),
    ),
    preserve_next_time_count: sum(
      validSummaries.map((summary) => summary.preserve_next_time_count),
    ),
    warn_next_time_count: sum(
      validSummaries.map((summary) => summary.warn_next_time_count),
    ),
    drop_or_deprioritize_count: sum(
      validSummaries.map((summary) => summary.drop_or_deprioritize_count),
    ),
    verification_bias_count: sum(
      validSummaries.map((summary) => summary.verification_bias_count),
    ),
    context_diet_bias_count: sum(
      validSummaries.map((summary) => summary.context_diet_bias_count),
    ),
    handoff_quality_bias_count: sum(
      validSummaries.map((summary) => summary.handoff_quality_bias_count),
    ),
  };

  return {
    review_version: PERSPECTIVE_NEXT_WORK_BIAS_RECORD_REVIEW_VERSION,
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
      selected_next_work_bias_candidate_ref_count:
        materialSummary.selected_next_work_bias_candidate_count,
      next_work_bias_entry_count: materialSummary.next_work_bias_entry_count,
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
      has_missing_evidence: missingEvidence.length > 0,
      has_receipt_side_effect_problem: receiptSideEffectProblemCount > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      problem_record_ids: problemRecordIds,
    },
    next_work_bias_material_summary: materialSummary,
    receipt_no_side_effects_summary: sideEffects,
    blocked_reasons: uniqueStrings([
      ...problemRecordIds.map(
        (recordId) => `problem_perspective_next_work_bias_record:${recordId}`,
      ),
      ...storeSideEffectProblemReasons,
    ]),
    insufficient_data_reasons: buildInsufficientDataReasons({
      reviewStatus,
      selectedRecordId,
      selectedRecordFound: Boolean(selectedRecordSummary),
    }),
    operator_review_checklist: [
      "review_latest_perspective_next_work_bias_record",
      "confirm_receipt_allows_only_scoped_next_work_bias_record_write",
      "confirm_no_perspective_unit_cwp_relay_handoff_memory_metric_or_external_mutation",
    ],
    would_not_do: [
      "does_not_open_db_from_workbench",
      "does_not_create_schema",
      "does_not_write_perspective_unit",
      "does_not_mutate_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_apply_or_send_handoff",
      "does_not_write_memory_metrics_or_upstream_ledgers",
      "does_not_call_provider_openai_github_or_codex",
    ],
    non_goals: [
      "perspective_unit_write",
      "cwp_mutation",
      "continuity_relay_write",
      "handoff_context_mutation_apply_or_send",
      "memory_write",
      "global_metric_update",
      "upstream_ledger_write",
      "external_action",
    ],
    authority_boundary:
      createPerspectiveNextWorkBiasRecordReviewAuthorityBoundaryV01(),
  };
}

export function createPerspectiveNextWorkBiasRecordReviewAuthorityBoundaryV01(): PerspectiveNextWorkBiasRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_write_next_work_bias: false,
    can_write_perspective_unit: false,
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
    can_render_workbench_action_button: false,
    notes: [
      "Read-only review of already-read Perspective NextWorkBias scoped records.",
      "Workbench default does not open DB handles, call routes, create schema, or write records.",
    ],
  };
}

function evaluateRecord(
  record: unknown,
  storeSideEffectProblemReasons: string[],
): {
  valid: boolean;
  record: PerspectiveNextWorkBiasRecord | null;
  summary: PerspectiveNextWorkBiasRecordSummary;
} {
  const problemReasons: string[] = [];
  if (!isPerspectiveNextWorkBiasRecord(record)) {
    problemReasons.push("perspective_next_work_bias_record_malformed");
  }
  if (containsRawMaterialKey(record, new Set())) {
    problemReasons.push("raw_material_key_present");
  }
  const maybeRecord = isRecord(record) ? record : {};
  const entries = safeEntryArray(maybeRecord.next_work_bias_entries);
  const receiptValid = storeSideEffectProblemReasons.length === 0;
  if (!receiptValid) {
    problemReasons.push("perspective_next_work_bias_receipt_no_side_effects_invalid");
  }
  const summary = {
    record_id:
      typeof maybeRecord.record_id === "string"
        ? maybeRecord.record_id
        : "malformed_record",
    idempotency_key:
      typeof maybeRecord.idempotency_key === "string"
        ? maybeRecord.idempotency_key
        : "missing_idempotency_key",
    created_at:
      typeof maybeRecord.created_at === "string"
        ? maybeRecord.created_at
        : new Date(0).toISOString(),
    operator_ref:
      typeof maybeRecord.operator_ref === "string" ? maybeRecord.operator_ref : null,
    selected_next_work_bias_candidate_count: safeStringArray(
      maybeRecord.selected_next_work_bias_candidate_refs,
    ).length,
    next_work_bias_entry_count: entries.length,
    preserve_next_time_count: countEntries(entries, "preserve_next_time"),
    warn_next_time_count: countEntries(entries, "warn_next_time"),
    drop_or_deprioritize_count: countEntries(entries, "drop_or_deprioritize"),
    verification_bias_count: countEntries(entries, "verification_bias"),
    context_diet_bias_count: countEntries(entries, "context_diet_bias"),
    handoff_quality_bias_count: countEntries(entries, "handoff_quality_bias"),
    record_fingerprint:
      typeof maybeRecord.record_fingerprint === "string"
        ? maybeRecord.record_fingerprint
        : null,
    receipt_no_side_effects_valid: receiptValid,
    problem_reasons: uniqueStrings(problemReasons),
  };
  const valid = problemReasons.length === 0;
  return {
    valid,
    record: valid ? (record as PerspectiveNextWorkBiasRecord) : null,
    summary,
  };
}

function isPerspectiveNextWorkBiasRecord(
  value: unknown,
): value is PerspectiveNextWorkBiasRecord {
  if (!isRecord(value)) return false;
  return (
    value.record_version === PERSPECTIVE_NEXT_WORK_BIAS_RECORD_VERSION &&
    typeof value.record_id === "string" &&
    typeof value.idempotency_key === "string" &&
    typeof value.created_at === "string" &&
    value.scope === PERSPECTIVE_NEXT_WORK_BIAS_SCOPE &&
    typeof value.operator_ref === "string" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    Array.isArray(value.source_perspective_relay_update_decision_record_refs) &&
    Array.isArray(value.selected_next_work_bias_candidate_refs) &&
    Array.isArray(value.next_work_bias_entries) &&
    typeof value.next_work_bias_entry_count === "number" &&
    value.review_status === "recorded_as_scoped_perspective_next_work_bias" &&
    typeof value.record_fingerprint === "string" &&
    isRecord(value.authority_boundary) &&
    value.authority_boundary.can_write_next_work_bias === true &&
    value.authority_boundary.can_write_perspective_unit === false &&
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
    value.authority_boundary.can_execute_codex === false
  );
}

function storeResultSideEffectProblemReasons(
  storeResult: PerspectiveNextWorkBiasStoreResult | null,
): string[] {
  if (!storeResult) return [];
  const reasons: string[] = [];
  for (const sideEffects of [
    storeResult.no_side_effects,
    storeResult.receipt?.no_side_effects,
  ]) {
    if (!sideEffects) continue;
    if (
      forbiddenNoSideEffectFields.some((field) => sideEffects[field] !== false)
    ) {
      reasons.push("perspective_next_work_bias_receipt_no_side_effects_invalid");
    }
  }
  return uniqueStrings(reasons);
}

function buildNoSideEffectsSummary(
  storeResult: PerspectiveNextWorkBiasStoreResult | null,
): PerspectiveNextWorkBiasNoSideEffectsSummary {
  const sideEffects = [
    ...(storeResult?.receipt?.no_side_effects
      ? [storeResult.receipt.no_side_effects]
      : []),
    ...(storeResult?.no_side_effects ? [storeResult.no_side_effects] : []),
  ];
  return {
    perspective_next_work_bias_record_written_count: countTruthy(
      sideEffects,
      "perspective_next_work_bias_record_written",
    ),
    perspective_next_work_bias_receipt_written_count: countTruthy(
      sideEffects,
      "perspective_next_work_bias_receipt_written",
    ),
    perspective_next_work_bias_persisted_count: countTruthy(
      sideEffects,
      "perspective_next_work_bias_persisted",
    ),
    next_work_bias_written_count: countTruthy(sideEffects, "next_work_bias_written"),
    perspective_unit_written_count: countTruthy(sideEffects, "perspective_unit_written"),
    current_working_perspective_updated_count: countTruthy(
      sideEffects,
      "current_working_perspective_updated",
    ),
    continuity_relay_written_count: countTruthy(sideEffects, "continuity_relay_written"),
    handoff_context_mutated_count: countTruthy(sideEffects, "handoff_context_mutated"),
    handoff_context_applied_count: countTruthy(sideEffects, "handoff_context_applied"),
    selected_refs_written_to_live_handoff_count: countTruthy(
      sideEffects,
      "selected_refs_written_to_live_handoff",
    ),
    handoff_sent_count: countTruthy(sideEffects, "handoff_sent"),
    memory_written_count: countTruthy(sideEffects, "memory_written"),
    memory_promoted_count: countTruthy(sideEffects, "memory_promoted"),
    memory_mutated_count: countTruthy(sideEffects, "memory_mutated"),
    dogfood_metrics_written_count: countTruthy(sideEffects, "dogfood_metrics_written"),
    dogfood_metrics_global_state_updated_count: countTruthy(
      sideEffects,
      "dogfood_metrics_global_state_updated",
    ),
    dogfood_metric_snapshot_written_count: countTruthy(
      sideEffects,
      "dogfood_metric_snapshot_written",
    ),
    reuse_outcome_ledger_written_count: countTruthy(
      sideEffects,
      "reuse_outcome_ledger_written",
    ),
    expected_observed_delta_written_count: countTruthy(
      sideEffects,
      "expected_observed_delta_written",
    ),
    work_episode_written_count: countTruthy(sideEffects, "work_episode_written"),
    provider_called_count: countTruthy(sideEffects, "provider_called"),
    github_called_count: countTruthy(sideEffects, "github_called"),
    codex_executed_count: countTruthy(sideEffects, "codex_executed"),
    pr_created_count: countTruthy(sideEffects, "pr_created"),
    pr_merged_count: countTruthy(sideEffects, "pr_merged"),
    autonomous_action_run_count: countTruthy(sideEffects, "autonomous_action_run"),
    graph_or_vector_store_created_count: countTruthy(
      sideEffects,
      "graph_or_vector_store_created",
    ),
    rag_stack_created_count: countTruthy(sideEffects, "rag_stack_created"),
    browser_observed_count: countTruthy(sideEffects, "browser_observed"),
    crawler_or_browser_observer_created_count: countTruthy(
      sideEffects,
      "crawler_or_browser_observer_created",
    ),
    workbench_action_button_rendered_count: countTruthy(
      sideEffects,
      "workbench_action_button_rendered",
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
}): PerspectiveNextWorkBiasRecordReviewStatus {
  if (storeStatus === "schema_missing") return "schema_missing";
  if (problemRecordIds.length > 0 || receiptSideEffectProblemCount > 0) {
    return "records_invalid";
  }
  if (suppliedRecordCount === 0) return "no_records";
  if (selectedRecordId && selectedRecordFound) return "selected_record_found";
  if (selectedRecordId && !selectedRecordFound) return "selected_record_missing";
  return validRecordCount > 0 ? "records_available" : "records_invalid";
}

function buildInsufficientDataReasons({
  reviewStatus,
  selectedRecordId,
  selectedRecordFound,
}: {
  reviewStatus: PerspectiveNextWorkBiasRecordReviewStatus;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): string[] {
  if (reviewStatus === "no_records") {
    return ["perspective_next_work_bias_records_missing"];
  }
  if (reviewStatus === "schema_missing") {
    return ["perspective_next_work_bias_schema_missing"];
  }
  if (selectedRecordId && !selectedRecordFound) {
    return ["selected_perspective_next_work_bias_record_missing"];
  }
  return [];
}

function compareRecordsNewestFirst(
  left: PerspectiveNextWorkBiasRecord,
  right: PerspectiveNextWorkBiasRecord,
): number {
  return right.created_at.localeCompare(left.created_at) ||
    right.record_id.localeCompare(left.record_id);
}

function compareSummariesNewestFirst(
  left: PerspectiveNextWorkBiasRecordSummary,
  right: PerspectiveNextWorkBiasRecordSummary,
): number {
  return right.created_at.localeCompare(left.created_at) ||
    right.record_id.localeCompare(left.record_id);
}

function countTruthy(
  sideEffects: Array<Partial<PerspectiveNextWorkBiasNoSideEffects>>,
  field: keyof PerspectiveNextWorkBiasNoSideEffects,
): number {
  return sideEffects.filter((item) => item[field] === true).length;
}

function countEntries(
  entries: Array<Record<string, unknown>>,
  directive: string,
): number {
  return entries.filter((entry) => entry.directive === directive).length;
}

function safeEntryArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => isRecord(item))
    : [];
}

function containsRawMaterialKey(value: unknown, seen: Set<unknown>): boolean {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((item) => containsRawMaterialKey(item, seen));
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    if (/^(raw_text|raw_report|raw_excerpt)$/i.test(key)) return true;
    if (containsRawMaterialKey(nestedValue, seen)) return true;
  }
  return false;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
