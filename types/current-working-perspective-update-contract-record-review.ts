import type {
  CurrentWorkingPerspectiveUpdateContractNoSideEffects,
  CurrentWorkingPerspectiveUpdateContractRecord,
  CurrentWorkingPerspectiveUpdateContractStoreResult,
} from "./current-working-perspective-update-contract-write";

export const CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_REVIEW_VERSION =
  "current_working_perspective_update_contract_record_review.v0.1" as const;

export interface CurrentWorkingPerspectiveUpdateContractRecordReviewInput {
  records?: unknown[];
  store_result?: CurrentWorkingPerspectiveUpdateContractStoreResult | null;
  selected_record_id?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type CurrentWorkingPerspectiveUpdateContractRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "records_invalid";

export interface CurrentWorkingPerspectiveUpdateContractRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  proposed_patch_entry_count: number;
  current_frame_patch_count: number;
  current_thesis_patch_count: number;
  active_goals_patch_count: number;
  accepted_assumptions_patch_count: number;
  rejected_assumptions_patch_count: number;
  open_questions_patch_count: number;
  active_risks_patch_count: number;
  next_candidates_patch_count: number;
  review_queue_hints_patch_count: number;
  staleness_and_gaps_patch_count: number;
  continuity_relay_alignment_patch_count: number;
  add_count: number;
  preserve_count: number;
  warn_count: number;
  deprioritize_count: number;
  retire_count: number;
  replace_candidate_count: number;
  align_count: number;
  record_fingerprint: string | null;
  receipt_no_side_effects_valid: boolean;
  problem_reasons: string[];
}

export interface CurrentWorkingPerspectiveUpdateContractNoSideEffectsSummary {
  current_working_perspective_update_contract_record_written_count: number;
  current_working_perspective_update_contract_receipt_written_count: number;
  current_working_perspective_update_contract_persisted_count: number;
  current_working_perspective_update_contract_written_count: number;
  current_working_perspective_updated_count: number;
  current_working_perspective_mutated_count: number;
  current_working_perspective_live_state_written_count: number;
  current_working_perspective_update_applied_count: number;
  perspective_unit_written_count: number;
  next_work_bias_written_count: number;
  continuity_relay_written_count: number;
  continuity_relay_updated_count: number;
  live_relay_state_applied_count: number;
  handoff_context_mutated_count: number;
  handoff_context_applied_count: number;
  selected_refs_written_to_live_handoff_count: number;
  handoff_sent_count: number;
  memory_written_count: number;
  memory_promoted_count: number;
  memory_mutated_count: number;
  dogfood_metrics_written_count: number;
  dogfood_metrics_global_state_updated_count: number;
  dogfood_metric_snapshot_written_count: number;
  reuse_outcome_ledger_written_count: number;
  expected_observed_delta_written_count: number;
  work_episode_written_count: number;
  provider_called_count: number;
  github_called_count: number;
  codex_executed_count: number;
  pr_created_count: number;
  pr_merged_count: number;
  autonomous_action_run_count: number;
  graph_or_vector_store_created_count: number;
  rag_stack_created_count: number;
  browser_observed_count: number;
  crawler_or_browser_observer_created_count: number;
  workbench_action_button_rendered_count: number;
}

export interface CurrentWorkingPerspectiveUpdateContractRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_current_working_perspective_update_contract_record: false;
  can_update_current_working_perspective: false;
  can_mutate_current_working_perspective: false;
  can_write_current_working_perspective_live_state: false;
  can_apply_current_working_perspective_update: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_continuity_relay: false;
  can_update_continuity_relay: false;
  can_apply_live_relay_state: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_write_memory: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
  can_write_reuse_outcome_ledger: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  can_render_workbench_action_button: false;
  notes: string[];
}

export interface CurrentWorkingPerspectiveUpdateContractRecordReview {
  review_version: typeof CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  review_status: CurrentWorkingPerspectiveUpdateContractRecordReviewStatus;
  input_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    invalid_record_count: number;
    selected_record_id: string | null;
    selected_record_found: boolean;
    latest_record_id: string | null;
    latest_record_created_at: string | null;
    proposed_patch_entry_count: number;
    receipt_side_effect_problem_count: number;
  };
  record_summaries: CurrentWorkingPerspectiveUpdateContractRecordSummary[];
  selected_record_summary: CurrentWorkingPerspectiveUpdateContractRecordSummary | null;
  latest_record_summary: CurrentWorkingPerspectiveUpdateContractRecordSummary | null;
  records: CurrentWorkingPerspectiveUpdateContractRecord[];
  evidence_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    has_records: boolean;
    has_selected_record: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_missing_evidence: boolean;
    has_receipt_side_effect_problem: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    problem_record_ids: string[];
  };
  current_working_perspective_update_contract_material_summary: {
    proposed_patch_entry_count: number;
    patch_target_counts: Record<string, number>;
    patch_operation_counts: Record<string, number>;
    contributing_record_ref_counts: {
      perspective_unit_record_refs: number;
      next_work_bias_record_refs: number;
      continuity_relay_record_refs: number;
      perspective_relay_update_decision_record_refs: number;
    };
  };
  receipt_no_side_effects_summary: CurrentWorkingPerspectiveUpdateContractNoSideEffectsSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: CurrentWorkingPerspectiveUpdateContractRecordReviewAuthorityBoundary;
}

export type CurrentWorkingPerspectiveUpdateContractRecordReviewNoSideEffects =
  CurrentWorkingPerspectiveUpdateContractNoSideEffects;
