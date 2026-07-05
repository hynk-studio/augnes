import {
  CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_REVIEW_VERSION,
  type CurrentWorkingPerspectiveAppliedSnapshotSummary,
  type CurrentWorkingPerspectiveApplyNoSideEffectsSummary,
  type CurrentWorkingPerspectiveApplyRecordReview,
  type CurrentWorkingPerspectiveApplyRecordReviewAuthorityBoundary,
  type CurrentWorkingPerspectiveApplyRecordReviewInput,
  type CurrentWorkingPerspectiveApplyRecordReviewStatus,
  type CurrentWorkingPerspectiveApplyRecordSummary,
} from "@/types/current-working-perspective-apply-record-review";
import {
  CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION,
  CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_VERSION,
  CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
  type CurrentWorkingPerspectiveAppliedSnapshot,
  type CurrentWorkingPerspectiveApplyNoSideEffects,
  type CurrentWorkingPerspectiveApplyRecord,
  type CurrentWorkingPerspectiveApplyStoreResult,
} from "@/types/current-working-perspective-apply-write";

const forbiddenNoSideEffectFields: Array<
  keyof CurrentWorkingPerspectiveApplyNoSideEffects
> = [
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "current_working_perspective_route_response_replaced",
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

export function buildCurrentWorkingPerspectiveApplyRecordReviewV01(
  input: CurrentWorkingPerspectiveApplyRecordReviewInput = {},
): CurrentWorkingPerspectiveApplyRecordReview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const scope = input.scope ?? CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE;
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
  const selectedAppliedSnapshotRef =
    typeof input.selected_applied_snapshot_ref === "string" &&
    input.selected_applied_snapshot_ref.trim()
      ? input.selected_applied_snapshot_ref
      : null;
  const evaluations = suppliedRecords.map((record) =>
    evaluateRecord(record, storeSideEffectProblemReasons),
  );
  const validRecords = evaluations
    .filter((evaluation) => evaluation.valid)
    .map((evaluation) => evaluation.record)
    .filter((record): record is CurrentWorkingPerspectiveApplyRecord =>
      Boolean(record),
    )
    .sort(compareRecordsNewestFirst);
  const summaries = evaluations
    .map((evaluation) => evaluation.summary)
    .sort(compareSummariesNewestFirst);
  const validSummaries = summaries.filter(
    (summary) => summary.problem_reasons.length === 0,
  );
  const snapshotEvaluations = suppliedRecords.flatMap((record) =>
    evaluateAppliedSnapshotFromRecord(record),
  );
  const validSnapshots = snapshotEvaluations
    .filter((evaluation) => evaluation.valid)
    .map((evaluation) => evaluation.snapshot)
    .filter((snapshot): snapshot is CurrentWorkingPerspectiveAppliedSnapshot =>
      Boolean(snapshot),
    )
    .sort(compareSnapshotsNewestFirst);
  const snapshotSummaries = snapshotEvaluations
    .map((evaluation) => evaluation.summary)
    .sort(compareSnapshotSummariesNewestFirst);
  const validSnapshotSummaries = snapshotSummaries.filter(
    (summary) => summary.problem_reasons.length === 0,
  );
  const selectedRecordSummary = selectedRecordId
    ? validSummaries.find((summary) => summary.record_id === selectedRecordId) ??
      null
    : null;
  const selectedAppliedSnapshotSummary = selectedAppliedSnapshotRef
    ? validSnapshotSummaries.find(
        (summary) =>
          summary.applied_snapshot_ref === selectedAppliedSnapshotRef,
      ) ?? null
    : null;
  const latestRecordSummary = validSummaries[0] ?? null;
  const latestAppliedSnapshotSummary = validSnapshotSummaries[0] ?? null;
  const problemRecordIds = uniqueStrings(
    summaries
      .filter((summary) => summary.problem_reasons.length > 0)
      .map((summary) => summary.record_id),
  );
  const problemAppliedSnapshotRefs = uniqueStrings(
    snapshotSummaries
      .filter((summary) => summary.problem_reasons.length > 0)
      .map((summary) => summary.applied_snapshot_ref),
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
    selectedAppliedSnapshotRef,
    selectedAppliedSnapshotFound: Boolean(selectedAppliedSnapshotSummary),
    problemRecordIds,
    problemAppliedSnapshotRefs,
    receiptSideEffectProblemCount,
  });
  const patchTargetCounts = mergeCounts(
    validRecords.map(
      (record) => record.patch_application_summary.patch_target_counts,
    ),
  );
  const patchOperationCounts = mergeCounts(
    validRecords.map(
      (record) => record.patch_application_summary.patch_operation_counts,
    ),
  );
  const appliedPatchCount = sum(
    validSummaries.map((summary) => summary.applied_patch_count),
  );

  return {
    review_version: CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_REVIEW_VERSION,
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
      selected_applied_snapshot_ref: selectedAppliedSnapshotRef,
      selected_applied_snapshot_found: Boolean(selectedAppliedSnapshotSummary),
      latest_record_id: latestRecordSummary?.record_id ?? null,
      latest_record_created_at: latestRecordSummary?.created_at ?? null,
      latest_applied_snapshot_ref:
        latestAppliedSnapshotSummary?.applied_snapshot_ref ?? null,
      applied_patch_count: appliedPatchCount,
      receipt_side_effect_problem_count: receiptSideEffectProblemCount,
    },
    record_summaries: summaries,
    selected_record_summary: selectedRecordSummary,
    selected_applied_snapshot_summary: selectedAppliedSnapshotSummary,
    latest_record_summary: latestRecordSummary,
    latest_applied_snapshot_summary: latestAppliedSnapshotSummary,
    records: validRecords,
    applied_snapshots: validSnapshots,
    evidence_summary: {
      supplied_record_count: suppliedRecords.length,
      valid_record_count: validSummaries.length,
      has_records: validSummaries.length > 0,
      has_selected_record: Boolean(selectedRecordSummary),
      has_selected_applied_snapshot: Boolean(selectedAppliedSnapshotSummary),
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_missing_evidence: missingEvidence.length > 0,
      has_receipt_side_effect_problem: receiptSideEffectProblemCount > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      problem_record_ids: problemRecordIds,
      problem_applied_snapshot_refs: problemAppliedSnapshotRefs,
    },
    current_working_perspective_apply_material_summary: {
      applied_patch_count: appliedPatchCount,
      patch_target_counts: patchTargetCounts,
      patch_operation_counts: patchOperationCounts,
      latest_applied_current_working_perspective_summary:
        latestAppliedSnapshotSummary,
    },
    receipt_no_side_effects_summary: sideEffects,
    blocked_reasons: uniqueStrings([
      ...problemRecordIds.map(
        (recordId) =>
          `problem_current_working_perspective_apply_record:${recordId}`,
      ),
      ...problemAppliedSnapshotRefs.map(
        (snapshotRef) =>
          `problem_current_working_perspective_applied_snapshot:${snapshotRef}`,
      ),
      ...storeSideEffectProblemReasons,
    ]),
    insufficient_data_reasons: buildInsufficientDataReasons({
      reviewStatus,
      selectedRecordId,
      selectedRecordFound: Boolean(selectedRecordSummary),
      selectedAppliedSnapshotRef,
      selectedAppliedSnapshotFound: Boolean(selectedAppliedSnapshotSummary),
    }),
    operator_review_checklist: [
      "review_latest_current_working_perspective_apply_record",
      "confirm_receipt_allows_only_scoped_local_apply_record_and_snapshot_write",
      "confirm_no_upstream_cwp_source_table_route_replacement_relay_handoff_memory_metric_or_external_mutation",
    ],
    would_not_do: [
      "does_not_open_db_from_workbench",
      "does_not_create_schema",
      "does_not_mutate_upstream_current_working_perspective_source_tables",
      "does_not_replace_api_perspective_current_response",
      "does_not_write_perspective_unit_next_work_bias_or_continuity_relay",
      "does_not_apply_live_relay_state",
      "does_not_mutate_apply_or_send_handoff",
      "does_not_write_memory_metrics_or_upstream_ledgers",
      "does_not_call_provider_openai_github_or_codex",
    ],
    non_goals: [
      "upstream_cwp_source_table_mutation",
      "api_perspective_current_route_replacement",
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
      createCurrentWorkingPerspectiveApplyRecordReviewAuthorityBoundaryV01(),
  };
}

export function createCurrentWorkingPerspectiveApplyRecordReviewAuthorityBoundaryV01():
  CurrentWorkingPerspectiveApplyRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_current_working_perspective_apply_record: false,
    can_create_applied_current_working_perspective_snapshot: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_replace_current_working_perspective_route_response: false,
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
      "Read-only review of already-read scoped CWP apply records and applied snapshots.",
      "Workbench default does not open DB handles, call routes, create schema, or write records.",
    ],
  };
}

function evaluateRecord(
  record: unknown,
  storeSideEffectProblemReasons: string[],
): {
  valid: boolean;
  record: CurrentWorkingPerspectiveApplyRecord | null;
  summary: CurrentWorkingPerspectiveApplyRecordSummary;
} {
  const problemReasons: string[] = [];
  if (containsRawMaterialKeys(record)) problemReasons.push("raw_material_key_refused");
  if (!isApplyRecord(record)) {
    problemReasons.push("current_working_perspective_apply_record_malformed");
  }
  const typed = isApplyRecord(record) ? record : null;
  if (typed?.scope !== CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE) {
    problemReasons.push("scope_invalid");
  }
  if (typed && !hasExpectedAuthorityProfile(typed.authority_profile)) {
    problemReasons.push("current_working_perspective_apply_record_authority_profile_invalid");
  }
  if (typed && !hasExpectedMutationBoundary(typed.mutation_boundary)) {
    problemReasons.push("current_working_perspective_apply_record_mutation_boundary_invalid");
  }
  if (typed && !hasExpectedAuthorityBoundary(typed.authority_boundary)) {
    problemReasons.push("current_working_perspective_apply_record_authority_boundary_invalid");
  }
  if (typed && !isAppliedSnapshot(typed.applied_snapshot)) {
    problemReasons.push("current_working_perspective_applied_snapshot_malformed");
  }
  if ((typed?.applied_patch_count ?? 0) <= 0) {
    problemReasons.push("applied_patch_count_missing");
  }
  if (storeSideEffectProblemReasons.length > 0) {
    problemReasons.push("receipt_no_side_effects_invalid");
  }
  const targetCounts = typed?.patch_application_summary?.patch_target_counts ?? {};
  const operationCounts =
    typed?.patch_application_summary?.patch_operation_counts ?? {};
  const summary: CurrentWorkingPerspectiveApplyRecordSummary = {
    record_id: typed?.record_id ?? "invalid-record",
    idempotency_key: typed?.idempotency_key ?? "invalid-idempotency",
    created_at: typed?.created_at ?? new Date(0).toISOString(),
    operator_ref: typed?.operator_ref ?? null,
    applied_snapshot_ref: typed?.applied_snapshot_ref ?? null,
    applied_patch_count: typed?.applied_patch_count ?? 0,
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
    applied_current_working_perspective_fingerprint:
      typed?.applied_current_working_perspective_fingerprint ?? null,
    receipt_no_side_effects_valid: storeSideEffectProblemReasons.length === 0,
    problem_reasons: uniqueStrings(problemReasons),
  };
  return {
    valid: problemReasons.length === 0 && Boolean(typed),
    record: problemReasons.length === 0 ? typed : null,
    summary,
  };
}

function evaluateAppliedSnapshotFromRecord(record: unknown): Array<{
  valid: boolean;
  snapshot: CurrentWorkingPerspectiveAppliedSnapshot | null;
  summary: CurrentWorkingPerspectiveAppliedSnapshotSummary;
}> {
  const snapshot = isRecord(record) ? record.applied_snapshot : null;
  const problemReasons: string[] = [];
  if (!isAppliedSnapshot(snapshot)) {
    problemReasons.push("current_working_perspective_applied_snapshot_malformed");
  }
  const typed = isAppliedSnapshot(snapshot) ? snapshot : null;
  if (typed && !hasExpectedAuthorityBoundary(typed.authority_boundary)) {
    problemReasons.push("current_working_perspective_applied_snapshot_authority_boundary_invalid");
  }
  const cwp = isRecord(typed?.applied_current_working_perspective)
    ? typed?.applied_current_working_perspective
    : null;
  const summary: CurrentWorkingPerspectiveAppliedSnapshotSummary = {
    applied_snapshot_ref: typed?.applied_snapshot_ref ?? "invalid-snapshot",
    source_contract_record_ref: typed?.source_contract_record_ref ?? null,
    source_current_working_perspective_ref:
      typed?.source_current_working_perspective_ref ?? null,
    as_of: typed?.as_of ?? new Date(0).toISOString(),
    current_frame_summary:
      typeof cwp?.current_frame?.summary === "string"
        ? cwp.current_frame.summary
        : null,
    current_thesis_summary:
      typeof cwp?.current_thesis?.summary === "string"
        ? cwp.current_thesis.summary
        : null,
    active_goal_count: Array.isArray(cwp?.active_goals)
      ? cwp.active_goals.length
      : 0,
    open_question_count: Array.isArray(cwp?.open_questions)
      ? cwp.open_questions.length
      : 0,
    active_risk_count: Array.isArray(cwp?.active_risks)
      ? cwp.active_risks.length
      : 0,
    next_candidate_count: Array.isArray(cwp?.next_candidates)
      ? cwp.next_candidates.length
      : 0,
    staleness_status:
      typeof cwp?.staleness?.status === "string" ? cwp.staleness.status : null,
    applied_patch_count: typed?.applied_patch_count ?? 0,
    problem_reasons: uniqueStrings(problemReasons),
  };
  return [
    {
      valid: problemReasons.length === 0 && Boolean(typed),
      snapshot: problemReasons.length === 0 ? typed : null,
      summary,
    },
  ];
}

function isApplyRecord(value: unknown): value is CurrentWorkingPerspectiveApplyRecord {
  return (
    isRecord(value) &&
    value.record_version === CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_VERSION &&
    typeof value.record_id === "string" &&
    typeof value.idempotency_key === "string" &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE &&
    typeof value.applied_snapshot_ref === "string" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    isRecord(value.applied_current_working_perspective) &&
    isRecord(value.applied_snapshot) &&
    isRecord(value.patch_application_summary) &&
    isRecord(value.authority_profile) &&
    isRecord(value.mutation_boundary) &&
    isRecord(value.authority_boundary) &&
    typeof value.record_fingerprint === "string"
  );
}

function isAppliedSnapshot(value: unknown): value is CurrentWorkingPerspectiveAppliedSnapshot {
  return (
    isRecord(value) &&
    value.snapshot_version === CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION &&
    typeof value.applied_snapshot_ref === "string" &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE &&
    typeof value.source_contract_record_ref === "string" &&
    isRecord(value.applied_current_working_perspective) &&
    Array.isArray(value.applied_patch_refs) &&
    typeof value.applied_patch_count === "number" &&
    isRecord(value.authority_boundary)
  );
}

function hasExpectedAuthorityProfile(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return fieldsMatch(value, {
    durable_local_current_working_perspective_apply_record: true,
    durable_local_applied_current_working_perspective_snapshot: true,
    source_of_truth: false,
    local_project_current_working_perspective_apply_only: true,
    current_working_perspective_apply_record_written: true,
    applied_current_working_perspective_snapshot_written: true,
    current_working_perspective_update_applied_to_local_snapshot: true,
    upstream_current_working_perspective_source_tables_mutated: false,
    perspective_unit_write_performed: false,
    next_work_bias_write_performed: false,
    continuity_relay_write_performed: false,
    continuity_relay_update_performed: false,
    handoff_context_mutation_performed: false,
    memory_promotion_performed: false,
    metric_update_performed: false,
  });
}

function hasExpectedMutationBoundary(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return fieldsMatch(value, {
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    current_working_perspective_route_response_replaced: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    memory_written: false,
    memory_promoted: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
  });
}

function hasExpectedAuthorityBoundary(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return fieldsMatch(value, {
    durable_local_current_working_perspective_apply_record: true,
    durable_local_applied_current_working_perspective_snapshot: true,
    source_of_truth: false,
    local_project_current_working_perspective_apply_only: true,
    can_create_current_working_perspective_apply_record: true,
    can_create_current_working_perspective_apply_receipt: true,
    can_create_applied_current_working_perspective_snapshot: true,
    can_apply_current_working_perspective_update_to_local_snapshot: true,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_replace_current_working_perspective_route_response: false,
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
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
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
  });
}

function fieldsMatch(
  value: Record<string, unknown>,
  expected: Record<string, boolean>,
): boolean {
  return Object.entries(expected).every(
    ([field, expectedValue]) => value[field] === expectedValue,
  );
}

function determineReviewStatus({
  storeStatus,
  suppliedRecordCount,
  validRecordCount,
  selectedRecordId,
  selectedRecordFound,
  selectedAppliedSnapshotRef,
  selectedAppliedSnapshotFound,
  problemRecordIds,
  problemAppliedSnapshotRefs,
  receiptSideEffectProblemCount,
}: {
  storeStatus: string | null;
  suppliedRecordCount: number;
  validRecordCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
  selectedAppliedSnapshotRef: string | null;
  selectedAppliedSnapshotFound: boolean;
  problemRecordIds: string[];
  problemAppliedSnapshotRefs: string[];
  receiptSideEffectProblemCount: number;
}): CurrentWorkingPerspectiveApplyRecordReviewStatus {
  if (storeStatus === "schema_missing") return "schema_missing";
  if (
    problemRecordIds.length > 0 ||
    problemAppliedSnapshotRefs.length > 0 ||
    receiptSideEffectProblemCount > 0
  ) {
    return "records_invalid";
  }
  if (suppliedRecordCount === 0) return "no_records";
  if (selectedAppliedSnapshotRef) {
    return selectedAppliedSnapshotFound
      ? "selected_applied_snapshot_found"
      : "selected_applied_snapshot_missing";
  }
  if (selectedRecordId) {
    return selectedRecordFound ? "selected_record_found" : "selected_record_missing";
  }
  return validRecordCount > 0 ? "records_available" : "records_invalid";
}

function buildInsufficientDataReasons({
  reviewStatus,
  selectedRecordId,
  selectedRecordFound,
  selectedAppliedSnapshotRef,
  selectedAppliedSnapshotFound,
}: {
  reviewStatus: CurrentWorkingPerspectiveApplyRecordReviewStatus;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
  selectedAppliedSnapshotRef: string | null;
  selectedAppliedSnapshotFound: boolean;
}): string[] {
  return uniqueStrings([
    ...(reviewStatus === "no_records" ? ["current_working_perspective_apply_records_missing"] : []),
    ...(reviewStatus === "schema_missing" ? ["schema_missing"] : []),
    ...(selectedRecordId && !selectedRecordFound ? ["selected_record_missing"] : []),
    ...(selectedAppliedSnapshotRef && !selectedAppliedSnapshotFound
      ? ["selected_applied_snapshot_missing"]
      : []),
  ]);
}

function storeResultSideEffectProblemReasons(
  storeResult: CurrentWorkingPerspectiveApplyStoreResult,
): string[] {
  const noSideEffects = storeResult.no_side_effects ?? storeResult.receipt?.no_side_effects;
  if (!noSideEffects) return ["receipt_no_side_effects_missing"];
  return forbiddenNoSideEffectFields
    .filter((field) => noSideEffects[field] === true)
    .map((field) => `forbidden_no_side_effect_true:${field}`);
}

function buildNoSideEffectsSummary(
  storeResult: CurrentWorkingPerspectiveApplyStoreResult | null,
): CurrentWorkingPerspectiveApplyNoSideEffectsSummary {
  const noSideEffects: Partial<CurrentWorkingPerspectiveApplyNoSideEffects> =
    storeResult?.no_side_effects ?? storeResult?.receipt?.no_side_effects ?? {};
  const count = (field: keyof CurrentWorkingPerspectiveApplyNoSideEffects) =>
    noSideEffects[field] === true ? 1 : 0;
  return {
    current_working_perspective_apply_record_written_count: count("current_working_perspective_apply_record_written"),
    current_working_perspective_apply_receipt_written_count: count("current_working_perspective_apply_receipt_written"),
    current_working_perspective_apply_persisted_count: count("current_working_perspective_apply_persisted"),
    applied_current_working_perspective_snapshot_written_count: count("applied_current_working_perspective_snapshot_written"),
    current_working_perspective_update_applied_to_local_snapshot_count: count("current_working_perspective_update_applied_to_local_snapshot"),
    upstream_current_working_perspective_source_tables_updated_count: count("upstream_current_working_perspective_source_tables_updated"),
    upstream_current_working_perspective_source_tables_mutated_count: count("upstream_current_working_perspective_source_tables_mutated"),
    current_working_perspective_route_response_replaced_count: count("current_working_perspective_route_response_replaced"),
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
  left: CurrentWorkingPerspectiveApplyRecord,
  right: CurrentWorkingPerspectiveApplyRecord,
): number {
  return (
    Date.parse(right.created_at) - Date.parse(left.created_at) ||
    right.record_id.localeCompare(left.record_id)
  );
}

function compareSummariesNewestFirst(
  left: CurrentWorkingPerspectiveApplyRecordSummary,
  right: CurrentWorkingPerspectiveApplyRecordSummary,
): number {
  return (
    Date.parse(right.created_at) - Date.parse(left.created_at) ||
    right.record_id.localeCompare(left.record_id)
  );
}

function compareSnapshotsNewestFirst(
  left: CurrentWorkingPerspectiveAppliedSnapshot,
  right: CurrentWorkingPerspectiveAppliedSnapshot,
): number {
  return (
    Date.parse(right.as_of) - Date.parse(left.as_of) ||
    right.applied_snapshot_ref.localeCompare(left.applied_snapshot_ref)
  );
}

function compareSnapshotSummariesNewestFirst(
  left: CurrentWorkingPerspectiveAppliedSnapshotSummary,
  right: CurrentWorkingPerspectiveAppliedSnapshotSummary,
): number {
  return (
    Date.parse(right.as_of) - Date.parse(left.as_of) ||
    right.applied_snapshot_ref.localeCompare(left.applied_snapshot_ref)
  );
}

function mergeCounts(counts: Array<Record<string, number>>): Record<string, number> {
  return counts.reduce<Record<string, number>>((merged, item) => {
    for (const [key, value] of Object.entries(item)) {
      merged[key] = (merged[key] ?? 0) + value;
    }
    return merged;
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

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values.filter((value): value is string =>
        typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
