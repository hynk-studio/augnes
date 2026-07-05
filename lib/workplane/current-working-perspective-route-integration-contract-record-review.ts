import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_REVIEW_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationContractNoSideEffectsSummary,
  type CurrentWorkingPerspectiveRouteIntegrationContractRecordReview,
  type CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewAuthorityBoundary,
  type CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewInput,
  type CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewStatus,
  type CurrentWorkingPerspectiveRouteIntegrationContractRecordSummary,
} from "@/types/current-working-perspective-route-integration-contract-record-review";
import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_VERSION,
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE,
  type CurrentWorkingPerspectiveRouteIntegrationContractNoSideEffects,
  type CurrentWorkingPerspectiveRouteIntegrationContractRecord,
  type CurrentWorkingPerspectiveRouteIntegrationContractStoreResult,
} from "@/types/current-working-perspective-route-integration-contract-write";

const forbiddenNoSideEffectFields: Array<
  keyof CurrentWorkingPerspectiveRouteIntegrationContractNoSideEffects
> = [
  "api_perspective_current_route_modified",
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
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

export function buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01(
  input: CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewInput = {},
): CurrentWorkingPerspectiveRouteIntegrationContractRecordReview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const scope =
    input.scope ?? CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE;
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
    .filter((record): record is CurrentWorkingPerspectiveRouteIntegrationContractRecord =>
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

  return {
    review_version:
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_REVIEW_VERSION,
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
    route_integration_contract_material_summary: {
      mode_counts: countBy(validRecords, "route_integration_mode"),
      route_guard_counts: mergeGuardCounts(validRecords),
      future_implementation_requirement_count: sum(
        validRecords.map(
          (record) => record.future_implementation_requirements.length,
        ),
      ),
      route_path_counts: countBy(validRecords, "route_path"),
    },
    receipt_no_side_effects_summary: sideEffects,
    blocked_reasons: uniqueStrings([
      ...problemRecordIds.map(
        (recordId) =>
          `problem_current_working_perspective_route_integration_contract_record:${recordId}`,
      ),
      ...storeSideEffectProblemReasons,
    ]),
    insufficient_data_reasons: buildInsufficientDataReasons({
      reviewStatus,
      selectedRecordId,
      selectedRecordFound: Boolean(selectedRecordSummary),
    }),
    operator_review_checklist: [
      "review_latest_current_working_perspective_route_integration_contract_record",
      "confirm_receipt_allows_only_scoped_local_route_integration_contract_record_write",
      "confirm_no_api_perspective_current_route_replacement_or_upstream_cwp_mutation",
    ],
    would_not_do: [
      "does_not_open_db_from_workbench",
      "does_not_create_schema",
      "does_not_modify_api_perspective_current_route",
      "does_not_replace_current_working_perspective_route_response",
      "does_not_mutate_upstream_current_working_perspective_source_tables",
      "does_not_write_applied_snapshots_apply_records_or_update_contract_records",
      "does_not_apply_live_relay_state_or_handoff",
      "does_not_write_memory_metrics_or_upstream_ledgers",
      "does_not_call_provider_openai_github_or_codex",
    ],
    non_goals: [
      "api_perspective_current_route_modification",
      "route_response_replacement",
      "upstream_cwp_source_table_mutation",
      "applied_snapshot_write",
      "current_working_perspective_apply_record_write",
      "current_working_perspective_update_contract_record_write",
      "handoff_context_mutation_apply_or_send",
      "memory_write",
      "global_metric_update",
      "external_action",
    ],
    authority_boundary:
      createCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewAuthorityBoundaryV01(),
  };
}

export function createCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewAuthorityBoundaryV01():
  CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_current_working_perspective_route_integration_contract_record:
      false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
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
      "Read-only review of already-read scoped CWP route integration contract records.",
      "Workbench default does not open DB handles, call routes, create schema, write records, or modify /api/perspective/current.",
    ],
  };
}

function evaluateRecord(
  record: unknown,
  storeSideEffectProblemReasons: string[],
): {
  valid: boolean;
  record: CurrentWorkingPerspectiveRouteIntegrationContractRecord | null;
  summary: CurrentWorkingPerspectiveRouteIntegrationContractRecordSummary;
} {
  const problemReasons: string[] = [];
  if (containsRawMaterialKeys(record)) problemReasons.push("raw_material_key_refused");
  if (!isRouteIntegrationContractRecordShape(record)) {
    problemReasons.push(
      "current_working_perspective_route_integration_contract_record_malformed",
    );
  }
  const typed = isRouteIntegrationContractRecordShape(record) ? record : null;
  if (typed?.scope !== CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE) {
    problemReasons.push("scope_invalid");
  }
  if (typed && !hasExpectedAuthorityProfile(typed.authority_profile)) {
    problemReasons.push(
      "current_working_perspective_route_integration_contract_record_authority_profile_invalid",
    );
  }
  if (typed && !hasExpectedNoRouteChange(typed.no_route_change_performed)) {
    problemReasons.push(
      "current_working_perspective_route_integration_contract_record_no_route_change_invalid",
    );
  }
  if (typed && !hasExpectedAuthorityBoundary(typed.authority_boundary)) {
    problemReasons.push(
      "current_working_perspective_route_integration_contract_record_authority_boundary_invalid",
    );
  }
  if (typed && !isProposedContract(typed.proposed_current_working_perspective_route_integration_contract)) {
    problemReasons.push(
      "current_working_perspective_route_integration_contract_record_contract_malformed",
    );
  }
  if (typed && typed.route_path !== "/api/perspective/current") {
    problemReasons.push("route_path_invalid");
  }
  if (storeSideEffectProblemReasons.length > 0) {
    problemReasons.push("receipt_no_side_effects_invalid");
  }
  const summary: CurrentWorkingPerspectiveRouteIntegrationContractRecordSummary = {
    record_id: typed?.record_id ?? "invalid-record",
    idempotency_key: typed?.idempotency_key ?? "invalid-idempotency",
    created_at: typed?.created_at ?? new Date(0).toISOString(),
    operator_ref: typed?.operator_ref ?? null,
    route_path: typed?.route_path ?? null,
    route_integration_mode: typed?.route_integration_mode ?? null,
    source_runtime_current_working_perspective_ref:
      typed?.source_runtime_current_working_perspective_ref ?? null,
    source_applied_snapshot_ref: typed?.source_applied_snapshot_ref ?? null,
    source_cwp_apply_record_ref_count:
      typed?.source_cwp_apply_record_refs?.length ?? 0,
    source_cwp_update_contract_record_ref_count:
      typed?.source_cwp_update_contract_record_refs?.length ?? 0,
    enabled_guard_count:
      typed?.route_integration_guard_summary?.enabled_guard_count ?? 0,
    future_implementation_requirement_count:
      typed?.future_implementation_requirements?.length ?? 0,
    rollback_step_count: typed?.rollback_and_fallback_plan?.length ?? 0,
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

function isRouteIntegrationContractRecordShape(
  value: unknown,
): value is CurrentWorkingPerspectiveRouteIntegrationContractRecord {
  return (
    isRecord(value) &&
    value.record_version ===
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_VERSION &&
    typeof value.record_id === "string" &&
    typeof value.idempotency_key === "string" &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE &&
    value.route_path === "/api/perspective/current" &&
    value.route_family === "current_working_perspective" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    Array.isArray(value.source_cwp_apply_record_refs) &&
    Array.isArray(value.source_cwp_update_contract_record_refs) &&
    isRecord(value.proposed_current_working_perspective_route_integration_contract) &&
    typeof value.route_integration_mode === "string" &&
    isRecord(value.route_integration_guard_summary) &&
    isRecord(value.proposed_response_contract) &&
    Array.isArray(value.future_implementation_requirements) &&
    Array.isArray(value.rollback_and_fallback_plan) &&
    isRecord(value.authority_profile) &&
    isRecord(value.no_route_change_performed) &&
    isRecord(value.authority_boundary) &&
    typeof value.record_fingerprint === "string"
  );
}

function isProposedContract(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const guards = isRecord(value.route_integration_guards)
    ? value.route_integration_guards
    : null;
  return (
    value.contract_kind ===
      "current_working_perspective_route_integration_contract.v0.1" &&
    value.route_family === "current_working_perspective" &&
    value.route_path === "/api/perspective/current" &&
    value.route_version_before === "perspective.current.v0.1" &&
    typeof value.current_runtime_cwp_ref === "string" &&
    typeof value.applied_snapshot_ref === "string" &&
    typeof value.applied_snapshot_source_apply_record_ref === "string" &&
    [
      "runtime_only_with_applied_snapshot_hint",
      "applied_snapshot_overlay_candidate",
      "applied_snapshot_preferred_with_runtime_fallback",
    ].includes(String(value.requested_route_integration_mode)) &&
    isRecord(value.proposed_future_route_behavior) &&
    isRecord(value.proposed_response_contract) &&
    guards !== null &&
    Object.values(guards).every((guard) => guard === true) &&
    Array.isArray(value.future_implementation_requirements) &&
    Array.isArray(value.rollback_and_fallback_plan) &&
    Array.isArray(value.operator_acceptance_criteria)
  );
}

function hasExpectedAuthorityProfile(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return fieldsMatch(value, {
    durable_local_current_working_perspective_route_integration_contract: true,
    source_of_truth: false,
    local_project_current_working_perspective_route_integration_contract_only:
      true,
    current_working_perspective_route_integration_contract_written: true,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    perspective_unit_write_performed: false,
    next_work_bias_write_performed: false,
    continuity_relay_write_performed: false,
    continuity_relay_update_performed: false,
    handoff_context_mutation_performed: false,
    memory_promotion_performed: false,
    metric_update_performed: false,
  });
}

function hasExpectedNoRouteChange(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return fieldsMatch(value, {
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
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
    durable_local_current_working_perspective_route_integration_contract: true,
    source_of_truth: false,
    local_project_current_working_perspective_route_integration_contract_only:
      true,
    can_write_current_working_perspective_route_integration_contract: undefined,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
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

function storeResultSideEffectProblemReasons(
  storeResult: CurrentWorkingPerspectiveRouteIntegrationContractStoreResult,
): string[] {
  const receipt = storeResult.receipt;
  const sideEffects = receipt?.no_side_effects;
  if (!sideEffects) return ["receipt_no_side_effects_missing"];
  const problems = forbiddenNoSideEffectFields
    .filter((field) => sideEffects[field] !== false)
    .map((field) => `forbidden_no_side_effect_true:${String(field)}`);
  if (storeResult.status === "written") {
    for (const field of [
      "current_working_perspective_route_integration_contract_record_written",
      "current_working_perspective_route_integration_contract_receipt_written",
      "current_working_perspective_route_integration_contract_persisted",
      "current_working_perspective_route_integration_contract_written",
    ] as const) {
      if (sideEffects[field] !== true) {
        problems.push(`expected_no_side_effect_false:${field}`);
      }
    }
  }
  if (storeResult.status === "idempotent_existing") {
    for (const field of [
      "current_working_perspective_route_integration_contract_record_written",
      "current_working_perspective_route_integration_contract_receipt_written",
      "current_working_perspective_route_integration_contract_persisted",
      "current_working_perspective_route_integration_contract_written",
    ] as const) {
      if (sideEffects[field] !== false) {
        problems.push(`idempotent_replay_claimed_new_write:${field}`);
      }
    }
  }
  return uniqueStrings(problems);
}

function buildNoSideEffectsSummary(
  storeResult: CurrentWorkingPerspectiveRouteIntegrationContractStoreResult | null,
): CurrentWorkingPerspectiveRouteIntegrationContractNoSideEffectsSummary {
  const sideEffects = storeResult?.receipt?.no_side_effects ?? null;
  const count = (field: keyof CurrentWorkingPerspectiveRouteIntegrationContractNoSideEffects) =>
    sideEffects?.[field] === true ? 1 : 0;
  return {
    current_working_perspective_route_integration_contract_record_written_count:
      count("current_working_perspective_route_integration_contract_record_written"),
    current_working_perspective_route_integration_contract_receipt_written_count:
      count("current_working_perspective_route_integration_contract_receipt_written"),
    current_working_perspective_route_integration_contract_persisted_count:
      count("current_working_perspective_route_integration_contract_persisted"),
    current_working_perspective_route_integration_contract_written_count:
      count("current_working_perspective_route_integration_contract_written"),
    api_perspective_current_route_modified_count: count("api_perspective_current_route_modified"),
    current_working_perspective_route_response_replaced_count: count("current_working_perspective_route_response_replaced"),
    upstream_current_working_perspective_source_tables_updated_count: count("upstream_current_working_perspective_source_tables_updated"),
    upstream_current_working_perspective_source_tables_mutated_count: count("upstream_current_working_perspective_source_tables_mutated"),
    applied_current_working_perspective_snapshot_written_count: count("applied_current_working_perspective_snapshot_written"),
    current_working_perspective_apply_record_written_count: count("current_working_perspective_apply_record_written"),
    current_working_perspective_update_contract_record_written_count: count("current_working_perspective_update_contract_record_written"),
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
}): CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewStatus {
  if (storeStatus === "schema_missing") return "schema_missing";
  if (problemRecordIds.length > 0 || receiptSideEffectProblemCount > 0) {
    return "records_invalid";
  }
  if (selectedRecordId) {
    return selectedRecordFound ? "selected_record_found" : "selected_record_missing";
  }
  if (validRecordCount > 0) return "records_available";
  if (suppliedRecordCount > 0) return "records_invalid";
  return "no_records";
}

function buildInsufficientDataReasons({
  reviewStatus,
  selectedRecordId,
  selectedRecordFound,
}: {
  reviewStatus: CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewStatus;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): string[] {
  if (reviewStatus === "no_records") return ["route_integration_contract_records_missing"];
  if (reviewStatus === "schema_missing") return ["route_integration_contract_schema_missing"];
  if (selectedRecordId && !selectedRecordFound) return ["selected_record_missing"];
  return [];
}

function containsRawMaterialKeys(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsRawMaterialKeys);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, entry]) => {
    if (/raw_text|raw_report|raw_excerpt/i.test(key)) return true;
    return containsRawMaterialKeys(entry);
  });
}

function fieldsMatch(
  value: Record<string, unknown>,
  expected: Record<string, unknown>,
): boolean {
  return Object.entries(expected).every(([key, expectedValue]) => {
    if (expectedValue === undefined) return true;
    return value[key] === expectedValue;
  });
}

function countBy<T extends Record<string, any>>(
  items: T[],
  field: keyof T & string,
): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = typeof item[field] === "string" ? item[field] : "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function mergeGuardCounts(
  records: CurrentWorkingPerspectiveRouteIntegrationContractRecord[],
): Record<string, number> {
  return records.reduce<Record<string, number>>((counts, record) => {
    for (const key of record.route_integration_guard_summary.guard_keys) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, {});
}

function compareRecordsNewestFirst(
  left: CurrentWorkingPerspectiveRouteIntegrationContractRecord,
  right: CurrentWorkingPerspectiveRouteIntegrationContractRecord,
): number {
  return (
    right.created_at.localeCompare(left.created_at) ||
    right.record_id.localeCompare(left.record_id)
  );
}

function compareSummariesNewestFirst(
  left: CurrentWorkingPerspectiveRouteIntegrationContractRecordSummary,
  right: CurrentWorkingPerspectiveRouteIntegrationContractRecordSummary,
): number {
  return (
    right.created_at.localeCompare(left.created_at) ||
    right.record_id.localeCompare(left.record_id)
  );
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
