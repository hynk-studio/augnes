/**
 * Dogfood Reuse Record Proposal Preview v0.1.
 *
 * This contract describes candidate-only proposal material derived from an
 * existing Codex Result Feedback Draft. It does not write a dogfood ledger,
 * update metrics, mutate memory, apply Perspective state, create promotion
 * decisions or Formation Receipts, call providers/GitHub/Codex, send handoffs,
 * create stores, run crawlers, or execute autonomous actions.
 */

import type {
  CodexContextReuseRef,
  CodexResultFeedbackDraftConfidence,
} from "@/types/codex-result-feedback-draft";

export const DOGFOOD_REUSE_RECORD_PROPOSAL_VERSION =
  "dogfood_reuse_record_proposal.v0.1" as const;

export type DogfoodReuseRecordProposalStatus =
  | "proposal_ready_for_operator_review"
  | "needs_more_result_signal"
  | "blocked_insufficient_data"
  | "blocked_missing_feedback_draft";

export type DogfoodReuseRecordProposalKind =
  | "handoff_reuse_outcome_candidate"
  | "expected_observed_feedback_candidate"
  | "dogfood_loop_observation_candidate";

export interface DogfoodReuseRecordProposal {
  runtime: "augnes";
  proposal_version: typeof DOGFOOD_REUSE_RECORD_PROPOSAL_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  feedback_draft_refs: DogfoodReuseFeedbackDraftRefs;
  proposed_record_kind: DogfoodReuseRecordProposalKind;
  proposal_status: DogfoodReuseRecordProposalStatus;
  proposed_dogfood_signal: DogfoodReuseProposedSignal;
  proposed_reuse_classifications: DogfoodReuseProposedClassifications;
  proposed_expected_observed_summary: DogfoodReuseExpectedObservedSummary;
  evidence_summary: DogfoodReuseEvidenceSummary;
  review_required: true;
  operator_review_checklist: string[];
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  carry_forward_candidates: DogfoodReuseCarryForwardCandidates;
  non_goals: string[];
  authority_boundary: DogfoodReuseRecordProposalAuthorityBoundary;
  source_status: DogfoodReuseRecordProposalSourceStatus;
  fallback_reason: string | null;
  notes: string[];
}

export interface DogfoodReuseFeedbackDraftRefs {
  feedback_draft_ref: string | null;
  feedback_draft_version: string | null;
  result_report_ref: string | null;
  result_report_fingerprint: string | null;
  context_relay_rationale_ref: string | null;
  continuity_relay_ref: string | null;
  source_refs: string[];
}

export interface DogfoodReuseProposedSignal {
  requirement_progress_observed: string[];
  checks_observed: string[];
  skipped_or_unverified_checks: string[];
  not_done_items: string[];
  mismatch_summary: string;
  context_feedback_signal_present: boolean;
  stale_or_gap_warnings: string[];
  review_burden_hint: string;
  handoff_quality_hint: string;
  confidence: CodexResultFeedbackDraftConfidence;
}

export interface DogfoodReuseProposedClassifications {
  helpful_refs: CodexContextReuseRef[];
  stale_refs: CodexContextReuseRef[];
  missing_refs: CodexContextReuseRef[];
  noisy_refs: CodexContextReuseRef[];
  misleading_refs: CodexContextReuseRef[];
  unknown_refs: CodexContextReuseRef[];
  corrections_needed: string[];
  refs_to_preserve_next_time: string[];
  refs_to_warn_next_time: string[];
  refs_to_drop_or_deprioritize: string[];
  confidence: CodexResultFeedbackDraftConfidence;
  review_needed: boolean;
}

export interface DogfoodReuseExpectedObservedSummary {
  matched_expectation_count: number;
  missing_expectation_count: number;
  unexpected_observation_count: number;
  skipped_or_unverified_check_count: number;
  changed_files_observed: string[];
  checks_observed: string[];
  requirement_progress_observed: string[];
  missing_expectations: string[];
  unexpected_observations: string[];
  not_done_items: string[];
  mismatch_summary: string;
  confidence: CodexResultFeedbackDraftConfidence;
}

export interface DogfoodReuseEvidenceSummary {
  has_feedback_draft: boolean;
  has_result_report: boolean;
  has_context_rationale: boolean;
  has_expected_return_signal: boolean;
  has_observed_return_signal: boolean;
  has_explicit_context_feedback: boolean;
  has_skipped_or_unverified_checks: boolean;
  has_insufficient_data: boolean;
  evidence_refs: string[];
  missing_evidence: string[];
}

export interface DogfoodReuseCarryForwardCandidates {
  next_relay_update_suggestions: string[];
  next_handoff_adjustments: string[];
  refs_to_preserve_next_time: string[];
  refs_to_warn_next_time: string[];
  refs_to_drop_or_deprioritize: string[];
  unresolved_gaps: string[];
  next_focus_candidate: string;
}

export interface DogfoodReuseRecordProposalSourceStatus {
  feedback_draft: "supplied" | "missing";
  codex_result_report: "supplied" | "missing";
  handoff_context_rationale: "supplied" | "missing";
  codex_result_report_status: string;
}

export interface DogfoodReuseRecordProposalAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_write_dogfood_ledger: false;
  can_update_metrics: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_send_handoff: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}
