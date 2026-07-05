import type { CandidateIngressNormalizedCandidate } from "./candidate-ingress-normalizer";

export const EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION =
  "expected_observed_delta_preview.v0.1" as const;

export interface ExpectedObservedDeltaPreviewInput {
  work_episode_residue_candidate_preview?: unknown;
  codex_result_report_intake_record_review?: unknown;
  codex_result_report_intake_preview?: unknown;
  expected_material?: unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface ExpectedObservedDeltaExpectedMaterial {
  expected_files: string[];
  expected_checks: string[];
  expected_requirement_progress: string[];
  expected_non_goals: string[];
  expected_risks: string[];
  expected_followups: string[];
  handoff_ref: string | null;
  work_ref: string | null;
  result_ref: string | null;
  source_refs: string[];
  evidence_refs: string[];
}

export type ExpectedObservedDeltaPreviewStatus =
  | "no_result_material"
  | "insufficient_expected_material"
  | "insufficient_observed_material"
  | "insufficient_data"
  | "delta_candidates_available"
  | "ready_for_operator_review"
  | "keep_preview_only";

export type ExpectedObservedDeltaPreviewRecommendedNextAction =
  | "supply_codex_result_report"
  | "supply_expected_material"
  | "review_expected_observed_delta_candidates"
  | "prepare_expected_observed_delta_decision"
  | "keep_preview_only"
  | "reject_delta_candidate";

export interface ExpectedObservedDeltaSignalSummary {
  expected_file_refs: string[];
  expected_check_refs: string[];
  expected_requirement_progress: string[];
  expected_non_goals: string[];
  expected_risks: string[];
  expected_followups: string[];
  expected_signal_refs: string[];
  has_explicit_expected_material: boolean;
  derived_expected_signal_count: number;
}

export interface ExpectedObservedDeltaObservedSummary {
  changed_files: string[];
  passed_or_completed_checks: string[];
  skipped_or_unverified_checks: string[];
  not_done_items: string[];
  requirement_progress: string[];
  risks: string[];
  followups: string[];
  context_reuse_signals: string[];
  observed_signal_refs: string[];
  has_observed_material: boolean;
}

export interface ExpectedObservedDeltaCandidateBuckets {
  matched_expectation_candidates: CandidateIngressNormalizedCandidate[];
  missing_expectation_candidates: CandidateIngressNormalizedCandidate[];
  unexpected_observation_candidates: CandidateIngressNormalizedCandidate[];
  skipped_or_unverified_check_candidates: CandidateIngressNormalizedCandidate[];
  not_done_candidates: CandidateIngressNormalizedCandidate[];
  changed_file_delta_candidates: CandidateIngressNormalizedCandidate[];
  requirement_progress_delta_candidates: CandidateIngressNormalizedCandidate[];
  non_goal_risk_candidates: CandidateIngressNormalizedCandidate[];
  followup_delta_candidates: CandidateIngressNormalizedCandidate[];
  context_reuse_signal_candidates: CandidateIngressNormalizedCandidate[];
  review_only_candidates: CandidateIngressNormalizedCandidate[];
}

export interface ExpectedObservedDeltaComparisonSummary {
  matched_expectation_count: number;
  missing_expectation_count: number;
  unexpected_observation_count: number;
  skipped_or_unverified_check_count: number;
  not_done_count: number;
  changed_file_delta_count: number;
  requirement_progress_delta_count: number;
  non_goal_risk_count: number;
  followup_delta_count: number;
  context_reuse_signal_count: number;
}

export interface ExpectedObservedDeltaPreviewAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_expected_observed_delta: false;
  can_write_reuse_outcome_ledger: false;
  can_write_dogfood_metrics: false;
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
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}

export interface ExpectedObservedDeltaPreview {
  preview_version: typeof EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  delta_preview_status: ExpectedObservedDeltaPreviewStatus;
  recommended_next_action: ExpectedObservedDeltaPreviewRecommendedNextAction;
  input_summary: {
    has_work_episode_residue_candidate_preview: boolean;
    has_codex_result_report_intake_record_review: boolean;
    has_codex_result_report_intake_preview: boolean;
    has_explicit_expected_material: boolean;
    expected_signal_count: number;
    observed_signal_count: number;
    delta_candidate_count: number;
    blocked_reason_count: number;
    insufficient_data_reason_count: number;
  };
  expected_summary: ExpectedObservedDeltaSignalSummary;
  observed_summary: ExpectedObservedDeltaObservedSummary;
  delta_candidates: ExpectedObservedDeltaCandidateBuckets;
  mismatch_summary: ExpectedObservedDeltaComparisonSummary & {
    summary: string;
  };
  requirement_progress_comparison: {
    expected_requirement_progress: string[];
    observed_requirement_progress: string[];
    requirement_progress_delta_candidates: CandidateIngressNormalizedCandidate[];
    changed_files_are_not_requirement_completion: true;
  };
  verification_comparison: {
    expected_checks: string[];
    passed_or_completed_checks: string[];
    skipped_or_unverified_checks: string[];
    skipped_checks_count_as_passed: false;
  };
  non_goal_comparison: {
    expected_non_goals: string[];
    observed_risks: string[];
    non_goal_risk_candidates: CandidateIngressNormalizedCandidate[];
  };
  evidence_summary: {
    has_result_material: boolean;
    has_expected_material: boolean;
    has_observed_material: boolean;
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
  authority_boundary: ExpectedObservedDeltaPreviewAuthorityBoundary;
}
