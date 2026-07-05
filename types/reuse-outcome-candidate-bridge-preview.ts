export const REUSE_OUTCOME_CANDIDATE_BRIDGE_PREVIEW_VERSION =
  "reuse_outcome_candidate_bridge_preview.v0.1" as const;

export interface ReuseOutcomeCandidateBridgePreviewInput {
  expected_observed_delta_preview?: unknown;
  expected_observed_delta_record_review?: unknown;
  work_episode_residue_candidate_preview?: unknown;
  codex_result_report_intake_record_review?: unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type ReuseOutcomeCandidateBridgePreviewStatus =
  | "no_delta_material"
  | "insufficient_data"
  | "reuse_outcome_candidates_available"
  | "ready_for_operator_review"
  | "keep_preview_only";

export type ReuseOutcomeCandidateBridgeRecommendedNextAction =
  | "supply_codex_result_report"
  | "review_expected_observed_delta"
  | "review_reuse_outcome_candidates"
  | "prepare_reuse_outcome_operator_decision"
  | "keep_preview_only";

export interface ReuseOutcomeCandidateBridgeAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_reuse_outcome_ledger: false;
  can_write_dogfood_metrics: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
  can_write_memory: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_current_working_perspective: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_send_handoff: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  notes: string[];
}

export interface ReuseOutcomeCandidateBridgePreview {
  preview_version: typeof REUSE_OUTCOME_CANDIDATE_BRIDGE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  bridge_preview_status: ReuseOutcomeCandidateBridgePreviewStatus;
  recommended_next_action: ReuseOutcomeCandidateBridgeRecommendedNextAction;
  input_summary: {
    has_expected_observed_delta_preview: boolean;
    has_expected_observed_delta_records: boolean;
    has_work_episode_residue_candidate_preview: boolean;
    has_codex_result_report_intake_records: boolean;
    delta_material_count: number;
    bridge_candidate_count: number;
    blocker_count: number;
    insufficient_data_count: number;
  };
  proposed_reuse_classifications: {
    helpful_refs: string[];
    stale_refs: string[];
    missing_refs: string[];
    noisy_refs: string[];
    misleading_refs: string[];
    unknown_refs: string[];
  };
  proposed_handoff_quality_signals: {
    skipped_or_unverified_checks: string[];
    not_done_items: string[];
    expected_observed_mismatches: string[];
    requirement_progress_gaps: string[];
    context_feedback_signals: string[];
  };
  carry_forward_candidates: {
    refs_to_preserve_next_time: string[];
    refs_to_warn_next_time: string[];
    refs_to_drop_or_deprioritize: string[];
    unresolved_gaps: string[];
    next_focus_candidates: string[];
  };
  evidence_summary: {
    has_delta_material: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
  };
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: ReuseOutcomeCandidateBridgeAuthorityBoundary;
}
