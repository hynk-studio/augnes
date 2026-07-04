/**
 * Dogfood Reuse Operator Decision Preview v0.1.
 *
 * This contract describes a read-only write-readiness preview derived from an
 * existing Dogfood Reuse Record Proposal. It does not persist a review
 * decision, write a dogfood ledger, update metrics, mutate memory, apply
 * Perspective state, create promotion decisions or Formation Receipts, call
 * providers/GitHub/Codex, send handoffs, create routes/stores, or run
 * autonomous actions.
 */

import type { CodexResultFeedbackDraftConfidence } from "@/types/codex-result-feedback-draft";
import type {
  DogfoodReuseCarryForwardCandidates,
  DogfoodReuseExpectedObservedSummary,
  DogfoodReuseProposedClassifications,
  DogfoodReuseRecordProposalKind,
  DogfoodReuseRecordProposalStatus,
} from "@/types/dogfood-reuse-record-proposal";

export const DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION =
  "dogfood_reuse_operator_decision_preview.v0.1" as const;

export type DogfoodReuseOperatorDecisionPreviewStatus =
  | "ready_for_operator_decision"
  | "blocked_insufficient_data"
  | "blocked_missing_proposal"
  | "needs_more_evidence"
  | "needs_operator_judgment";

export type DogfoodReuseRecommendedOperatorDecision =
  | "approve_for_future_write"
  | "defer_until_result_report_supplied"
  | "reject_as_insufficient_data"
  | "keep_as_candidate_only"
  | "request_more_evidence";

export type DogfoodReuseAvailableOperatorDecision =
  | "approve_for_future_write"
  | "defer"
  | "reject"
  | "keep_candidate"
  | "request_more_evidence";

export interface DogfoodReuseOperatorDecisionPreview {
  runtime: "augnes";
  preview_version: typeof DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  proposal_refs: DogfoodReuseOperatorDecisionProposalRefs;
  decision_preview_status: DogfoodReuseOperatorDecisionPreviewStatus;
  recommended_operator_decision: DogfoodReuseRecommendedOperatorDecision;
  available_operator_decisions: DogfoodReuseAvailableOperatorDecision[];
  write_readiness: DogfoodReuseWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  evidence_summary: DogfoodReuseOperatorDecisionEvidenceSummary;
  would_write_preview: DogfoodReuseWouldWritePreview;
  would_not_write: string[];
  candidate_carry_forward: DogfoodReuseCarryForwardCandidates;
  review_checklist: string[];
  non_goals: string[];
  authority_boundary: DogfoodReuseOperatorDecisionAuthorityBoundary;
  source_status: DogfoodReuseOperatorDecisionSourceStatus;
  fallback_reason: string | null;
  notes: string[];
}

export interface DogfoodReuseOperatorDecisionProposalRefs {
  proposal_ref: string | null;
  proposal_version: string | null;
  proposal_status: DogfoodReuseRecordProposalStatus | null;
  feedback_draft_ref: string | null;
  result_report_ref: string | null;
  result_report_fingerprint: string | null;
  context_relay_rationale_ref: string | null;
  continuity_relay_ref: string | null;
  source_refs: string[];
}

export interface DogfoodReuseWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_actual_result_report: true;
  requires_explicit_context_feedback: true;
  requires_operator_confirmation: true;
  requires_no_blockers: true;
  requires_evidence_backing: true;
  requires_skipped_checks_review: boolean;
  current_blockers: string[];
  current_missing_evidence: string[];
  confidence: CodexResultFeedbackDraftConfidence;
}

export interface DogfoodReuseOperatorDecisionEvidenceSummary {
  has_proposal: boolean;
  proposal_status: DogfoodReuseRecordProposalStatus | null;
  has_feedback_draft: boolean;
  has_result_report: boolean;
  has_context_rationale: boolean;
  has_expected_return_signal: boolean;
  has_observed_return_signal: boolean;
  has_explicit_context_feedback: boolean;
  has_skipped_or_unverified_checks: boolean;
  has_insufficient_data: boolean;
  has_blocking_reasons: boolean;
  has_missing_evidence: boolean;
  evidence_refs: string[];
  missing_evidence: string[];
}

export interface DogfoodReuseWouldWritePreview {
  proposed_record_kind: DogfoodReuseRecordProposalKind | null;
  proposed_dogfood_signal_summary: DogfoodReuseDogfoodSignalSummary;
  proposed_reuse_bucket_counts: DogfoodReuseBucketCounts;
  proposed_reuse_classifications: DogfoodReuseProposedClassifications | null;
  proposed_expected_observed_summary:
    | DogfoodReuseExpectedObservedSummary
    | null;
  evidence_refs: string[];
  carry_forward_candidates: DogfoodReuseCarryForwardCandidates;
  confidence: CodexResultFeedbackDraftConfidence;
}

export interface DogfoodReuseDogfoodSignalSummary {
  requirement_progress_observed: string[];
  checks_observed: string[];
  skipped_or_unverified_checks: string[];
  not_done_items: string[];
  mismatch_summary: string;
  context_feedback_signal_present: boolean;
  review_burden_hint: string | null;
  handoff_quality_hint: string | null;
}

export interface DogfoodReuseBucketCounts {
  helpful_refs: number;
  stale_refs: number;
  missing_refs: number;
  noisy_refs: number;
  misleading_refs: number;
  unknown_refs: number;
}

export interface DogfoodReuseOperatorDecisionSourceStatus {
  proposal: "supplied" | "missing";
  feedback_draft: "supplied" | "missing";
  codex_result_report: "supplied" | "missing";
  handoff_context_rationale: "supplied" | "missing";
  codex_result_report_status: string;
}

export interface DogfoodReuseOperatorDecisionAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
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
