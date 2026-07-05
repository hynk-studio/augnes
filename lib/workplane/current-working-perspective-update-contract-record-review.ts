import {
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_REVIEW_VERSION,
  type CurrentWorkingPerspectiveUpdateContractNoSideEffectsSummary,
  type CurrentWorkingPerspectiveUpdateContractRecordReview,
  type CurrentWorkingPerspectiveUpdateContractRecordReviewAuthorityBoundary,
  type CurrentWorkingPerspectiveUpdateContractRecordReviewInput,
  type CurrentWorkingPerspectiveUpdateContractRecordReviewStatus,
  type CurrentWorkingPerspectiveUpdateContractRecordSummary,
} from "@/types/current-working-perspective-update-contract-record-review";
import {
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_VERSION,
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE,
  type CurrentWorkingPerspectiveUpdateContractNoSideEffects,
  type CurrentWorkingPerspectiveUpdateContractRecord,
  type CurrentWorkingPerspectiveUpdateContractStoreResult,
} from "@/types/current-working-perspective-update-contract-write";

const forbiddenNoSideEffectFields: Array<
  keyof CurrentWorkingPerspectiveUpdateContractNoSideEffects
> = [
  "current_working_perspective_updated",
  "current_working_perspective_mutated",
  "current_working_perspective_live_state_written",
  "current_working_perspective_update_applied",
  "perspective_unit_written",
  "next_work_bias_written",
  "continuity_relay_written",
  "continuity_relay_updated",
  "live_relay_state_applied",
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

export function buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01(
  input: CurrentWorkingPerspectiveUpdateContractRecordReviewInput = {},
): CurrentWorkingPerspectiveUpdateContractRecordReview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const scope = input.scope ?? CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE;
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
    .filter(
      (record): record is CurrentWorkingPerspectiveUpdateContractRecord =>
        Boolean(record),
    )
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
  const patchTargetCounts = countBy(
    validRecords.flatMap((record) => record.proposed_patch_entries),
    "patch_target",
  );
  const patchOperationCounts = countBy(
    validRecords.flatMap((record) => record.proposed_patch_entries),
    "patch_operation",
  );
  const proposedPatchEntryCount = sum(
    validSummaries.map((summary) => summary.proposed_patch_entry_count),
  );

  return {
    review_version:
      CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_REVIEW_VERSION,
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
      proposed_patch_entry_count: proposedPatchEntryCount,
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
    current_working_perspective_update_contract_material_summary: {
      proposed_patch_entry_count: proposedPatchEntryCount,
      patch_target_counts: patchTargetCounts,
      patch_operation_counts: patchOperationCounts,
      contributing_record_ref_counts: {
        perspective_unit_record_refs: uniqueStrings(
          validRecords.flatMap(
            (record) => record.source_perspective_unit_record_refs,
          ),
        ).length,
        next_work_bias_record_refs: uniqueStrings(
          validRecords.flatMap(
            (record) => record.source_next_work_bias_record_refs,
          ),
        ).length,
        continuity_relay_record_refs: uniqueStrings(
          validRecords.flatMap(
            (record) => record.source_continuity_relay_record_refs,
          ),
        ).length,
        perspective_relay_update_decision_record_refs: uniqueStrings(
          validRecords.flatMap(
            (record) =>
              record.source_perspective_relay_update_decision_record_refs,
          ),
        ).length,
      },
    },
    receipt_no_side_effects_summary: sideEffects,
    blocked_reasons: uniqueStrings([
      ...problemRecordIds.map(
        (recordId) =>
          `problem_current_working_perspective_update_contract_record:${recordId}`,
      ),
      ...storeSideEffectProblemReasons,
    ]),
    insufficient_data_reasons: buildInsufficientDataReasons({
      reviewStatus,
      selectedRecordId,
      selectedRecordFound: Boolean(selectedRecordSummary),
    }),
    operator_review_checklist: [
      "review_latest_current_working_perspective_update_contract_record",
      "confirm_receipt_allows_only_scoped_cwp_update_contract_record_write",
      "confirm_no_live_cwp_relay_handoff_memory_metric_or_external_mutation",
    ],
    would_not_do: [
      "does_not_open_db_from_workbench",
      "does_not_create_schema",
      "does_not_mutate_current_working_perspective",
      "does_not_write_perspective_unit_next_work_bias_or_continuity_relay",
      "does_not_apply_live_relay_state",
      "does_not_mutate_apply_or_send_handoff",
      "does_not_write_memory_metrics_or_upstream_ledgers",
      "does_not_call_provider_openai_github_or_codex",
    ],
    non_goals: [
      "live_cwp_update",
      "perspective_unit_write",
      "next_work_bias_write",
      "continuity_relay_write_or_update",
      "handoff_context_mutation_apply_or_send",
      "memory_write",
      "global_metric_update",
      "upstream_ledger_write",
      "external_action",
    ],
    authority_boundary:
      createCurrentWorkingPerspectiveUpdateContractRecordReviewAuthorityBoundaryV01(),
  };
}

export function createCurrentWorkingPerspectiveUpdateContractRecordReviewAuthorityBoundaryV01():
  CurrentWorkingPerspectiveUpdateContractRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_current_working_perspective_update_contract_record: false,
    can_update_current_working_perspective: false,
    can_mutate_current_working_perspective: false,
    can_write_current_working_perspective_live_state: false,
    can_apply_current_working_perspective_update: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
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
      "Read-only review of already-read scoped CWP update contract records.",
      "Workbench default does not open DB handles, call routes, create schema, or write records.",
    ],
  };
}

function evaluateRecord(
  record: unknown,
  storeSideEffectProblemReasons: string[],
): {
  valid: boolean;
  record: CurrentWorkingPerspectiveUpdateContractRecord | null;
  summary: CurrentWorkingPerspectiveUpdateContractRecordSummary;
} {
  const problemReasons: string[] = [];
  if (containsRawMaterialKeys(record)) {
    problemReasons.push("raw_material_key_refused");
  }
  if (!isContractRecord(record)) {
    problemReasons.push("current_working_perspective_update_contract_record_malformed");
  }
  const typed = isContractRecord(record) ? record : null;
  if (typed?.scope !== CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE) {
    problemReasons.push("scope_invalid");
  }
  if ((typed?.proposed_patch_entries?.length ?? 0) === 0) {
    problemReasons.push("proposed_patch_entries_missing");
  }
  if (storeSideEffectProblemReasons.length > 0) {
    problemReasons.push("receipt_no_side_effects_invalid");
  }
  const patches = typed?.proposed_patch_entries ?? [];
  const targetCounts = countBy(patches, "patch_target");
  const operationCounts = countBy(patches, "patch_operation");
  const summary: CurrentWorkingPerspectiveUpdateContractRecordSummary = {
    record_id: typed?.record_id ?? "invalid-record",
    idempotency_key: typed?.idempotency_key ?? "invalid-idempotency",
    created_at: typed?.created_at ?? new Date(0).toISOString(),
    operator_ref: typed?.operator_ref ?? null,
    proposed_patch_entry_count: patches.length,
    current_frame_patch_count: targetCounts.current_frame ?? 0,
    current_thesis_patch_count: targetCounts.current_thesis ?? 0,
    active_goals_patch_count: targetCounts.active_goals ?? 0,
    accepted_assumptions_patch_count: targetCounts.accepted_assumptions ?? 0,
    rejected_assumptions_patch_count: targetCounts.rejected_assumptions ?? 0,
    open_questions_patch_count: targetCounts.open_questions ?? 0,
    active_risks_patch_count: targetCounts.active_risks ?? 0,
    next_candidates_patch_count: targetCounts.next_candidates ?? 0,
    review_queue_hints_patch_count: targetCounts.review_queue_hints ?? 0,
    staleness_and_gaps_patch_count: targetCounts.staleness_and_gaps ?? 0,
    continuity_relay_alignment_patch_count:
      targetCounts.continuity_relay_alignment ?? 0,
    add_count: operationCounts.add ?? 0,
    preserve_count: operationCounts.preserve ?? 0,
    warn_count: operationCounts.warn ?? 0,
    deprioritize_count: operationCounts.deprioritize ?? 0,
    retire_count: operationCounts.retire ?? 0,
    replace_candidate_count: operationCounts.replace_candidate ?? 0,
    align_count: operationCounts.align ?? 0,
    record_fingerprint: typed?.record_fingerprint ?? null,
    receipt_no_side_effects_valid: storeSideEffectProblemReasons.length === 0,
    problem_reasons: uniqueStrings(problemReasons),
  };
  return {
    valid: problemReasons.length === 0 && Boolean(typed),
    record: problemReasons.length === 0 ? typed : null,
    summary,
  };
}

function isContractRecord(
  value: unknown,
): value is CurrentWorkingPerspectiveUpdateContractRecord {
  return (
    isRecord(value) &&
    value.record_version ===
      CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_VERSION &&
    typeof value.record_id === "string" &&
    typeof value.idempotency_key === "string" &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    Array.isArray(value.proposed_patch_entries) &&
    isRecord(value.proposed_current_working_perspective_update_contract) &&
    isRecord(value.authority_profile) &&
    isRecord(value.authority_boundary) &&
    typeof value.record_fingerprint === "string"
  );
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
}): CurrentWorkingPerspectiveUpdateContractRecordReviewStatus {
  if (storeStatus === "schema_missing") return "schema_missing";
  if (problemRecordIds.length > 0 || receiptSideEffectProblemCount > 0) {
    return "records_invalid";
  }
  if (suppliedRecordCount === 0) return "no_records";
  if (selectedRecordId) {
    return selectedRecordFound ? "selected_record_found" : "selected_record_missing";
  }
  return validRecordCount > 0 ? "records_available" : "records_invalid";
}

function buildInsufficientDataReasons({
  reviewStatus,
  selectedRecordId,
  selectedRecordFound,
}: {
  reviewStatus: CurrentWorkingPerspectiveUpdateContractRecordReviewStatus;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): string[] {
  return uniqueStrings([
    ...(reviewStatus === "no_records" ? ["current_working_perspective_update_contract_records_missing"] : []),
    ...(reviewStatus === "schema_missing" ? ["schema_missing"] : []),
    ...(selectedRecordId && !selectedRecordFound ? ["selected_record_missing"] : []),
  ]);
}

function storeResultSideEffectProblemReasons(
  storeResult: CurrentWorkingPerspectiveUpdateContractStoreResult,
): string[] {
  const noSideEffects = storeResult.no_side_effects ?? storeResult.receipt?.no_side_effects;
  if (!noSideEffects) return ["receipt_no_side_effects_missing"];
  return forbiddenNoSideEffectFields
    .filter((field) => noSideEffects[field] === true)
    .map((field) => `forbidden_no_side_effect_true:${field}`);
}

function buildNoSideEffectsSummary(
  storeResult: CurrentWorkingPerspectiveUpdateContractStoreResult | null,
): CurrentWorkingPerspectiveUpdateContractNoSideEffectsSummary {
  const noSideEffects: Partial<CurrentWorkingPerspectiveUpdateContractNoSideEffects> =
    storeResult?.no_side_effects ?? storeResult?.receipt?.no_side_effects ?? {};
  const count = (field: keyof CurrentWorkingPerspectiveUpdateContractNoSideEffects) =>
    noSideEffects[field] === true ? 1 : 0;
  return {
    current_working_perspective_update_contract_record_written_count: count("current_working_perspective_update_contract_record_written"),
    current_working_perspective_update_contract_receipt_written_count: count("current_working_perspective_update_contract_receipt_written"),
    current_working_perspective_update_contract_persisted_count: count("current_working_perspective_update_contract_persisted"),
    current_working_perspective_update_contract_written_count: count("current_working_perspective_update_contract_written"),
    current_working_perspective_updated_count: count("current_working_perspective_updated"),
    current_working_perspective_mutated_count: count("current_working_perspective_mutated"),
    current_working_perspective_live_state_written_count: count("current_working_perspective_live_state_written"),
    current_working_perspective_update_applied_count: count("current_working_perspective_update_applied"),
    perspective_unit_written_count: count("perspective_unit_written"),
    next_work_bias_written_count: count("next_work_bias_written"),
    continuity_relay_written_count: count("continuity_relay_written"),
    continuity_relay_updated_count: count("continuity_relay_updated"),
    live_relay_state_applied_count: count("live_relay_state_applied"),
    handoff_context_mutated_count: count("handoff_context_mutated"),
    handoff_context_applied_count: count("handoff_context_applied"),
    selected_refs_written_to_live_handoff_count: count("selected_refs_written_to_live_handoff"),
    handoff_sent_count: count("handoff_sent"),
    memory_written_count: count("memory_written"),
    memory_promoted_count: count("memory_promoted"),
    memory_mutated_count: count("memory_mutated"),
    dogfood_metrics_written_count: count("dogfood_metrics_written"),
    dogfood_metrics_global_state_updated_count: count("dogfood_metrics_global_state_updated"),
    dogfood_metric_snapshot_written_count: count("dogfood_metric_snapshot_written"),
    reuse_outcome_ledger_written_count: count("reuse_outcome_ledger_written"),
    expected_observed_delta_written_count: count("expected_observed_delta_written"),
    work_episode_written_count: count("work_episode_written"),
    provider_called_count: count("provider_called"),
    github_called_count: count("github_called"),
    codex_executed_count: count("codex_executed"),
    pr_created_count: count("pr_created"),
    pr_merged_count: count("pr_merged"),
    autonomous_action_run_count: count("autonomous_action_run"),
    graph_or_vector_store_created_count: count("graph_or_vector_store_created"),
    rag_stack_created_count: count("rag_stack_created"),
    browser_observed_count: count("browser_observed"),
    crawler_or_browser_observer_created_count: count("crawler_or_browser_observer_created"),
    workbench_action_button_rendered_count: count("workbench_action_button_rendered"),
  };
}

function compareRecordsNewestFirst(
  left: CurrentWorkingPerspectiveUpdateContractRecord,
  right: CurrentWorkingPerspectiveUpdateContractRecord,
): number {
  return (
    Date.parse(right.created_at) - Date.parse(left.created_at) ||
    right.record_id.localeCompare(left.record_id)
  );
}

function compareSummariesNewestFirst(
  left: CurrentWorkingPerspectiveUpdateContractRecordSummary,
  right: CurrentWorkingPerspectiveUpdateContractRecordSummary,
): number {
  return (
    Date.parse(right.created_at) - Date.parse(left.created_at) ||
    right.record_id.localeCompare(left.record_id)
  );
}

function countBy(items: Array<Record<string, any>>, field: string): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = typeof item[field] === "string" ? item[field] : "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function containsRawMaterialKeys(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsRawMaterialKeys);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, nested]) =>
      ["raw_text", "raw_report", "raw_excerpt"].includes(key) ||
      containsRawMaterialKeys(nested),
  );
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
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

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
