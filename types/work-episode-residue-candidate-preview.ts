import type { CandidateIngressNormalizedCandidate } from "./candidate-ingress-normalizer";

export const WORK_EPISODE_RESIDUE_CANDIDATE_PREVIEW_VERSION =
  "work_episode_residue_candidate_preview.v0.1" as const;

export interface WorkEpisodeResidueCandidatePreviewInput {
  codex_result_report_intake_preview?: unknown;
  codex_result_report_intake_record_review?: unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type WorkEpisodeResidueCandidatePreviewStatus =
  | "no_codex_result_material"
  | "insufficient_data"
  | "candidate_residue_available"
  | "ready_for_operator_review"
  | "keep_preview_only";

export type WorkEpisodeResidueCandidateRecommendedNextAction =
  | "supply_codex_result_report"
  | "ingest_codex_result_report_candidate_record"
  | "review_work_episode_residue_candidates"
  | "prepare_expected_observed_delta_preview"
  | "prepare_reuse_outcome_candidate_preview"
  | "keep_preview_only";

export interface WorkEpisodeResidueCandidateMaterial {
  work_episode_summary_candidates: CandidateIngressNormalizedCandidate[];
  changed_artifact_candidates: CandidateIngressNormalizedCandidate[];
  verification_result_candidates: CandidateIngressNormalizedCandidate[];
  skipped_verification_candidates: CandidateIngressNormalizedCandidate[];
  not_done_candidates: CandidateIngressNormalizedCandidate[];
  requirement_progress_candidates: CandidateIngressNormalizedCandidate[];
  expected_observed_signal_candidates: CandidateIngressNormalizedCandidate[];
  context_reuse_signal_candidates: CandidateIngressNormalizedCandidate[];
  risk_or_regression_candidates: CandidateIngressNormalizedCandidate[];
  next_work_bias_candidates: CandidateIngressNormalizedCandidate[];
  carry_forward_memory_candidates: CandidateIngressNormalizedCandidate[];
  review_only_candidates: CandidateIngressNormalizedCandidate[];
}

export interface WorkEpisodeResidueCandidateAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_work_episode: false;
  can_write_expected_observed_delta: false;
  can_write_reuse_outcome_ledger: false;
  can_write_dogfood_metrics: false;
  can_write_memory: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_current_working_perspective: false;
  can_mutate_current_working_perspective: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
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

export interface WorkEpisodeResidueCandidatePreview {
  preview_version: typeof WORK_EPISODE_RESIDUE_CANDIDATE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  residue_preview_status: WorkEpisodeResidueCandidatePreviewStatus;
  recommended_next_action: WorkEpisodeResidueCandidateRecommendedNextAction;
  input_summary: {
    has_codex_result_report_intake_preview: boolean;
    has_codex_result_report_intake_records: boolean;
    intake_candidate_count: number;
    record_count: number;
    residue_candidate_count: number;
    blocker_count: number;
    insufficient_data_count: number;
  };
  candidate_residue: WorkEpisodeResidueCandidateMaterial;
  evidence_summary: {
    has_codex_result_material: boolean;
    has_candidate_residue: boolean;
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
  authority_boundary: WorkEpisodeResidueCandidateAuthorityBoundary;
}
