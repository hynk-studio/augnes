// Type-only contract for Feedback-to-Rule Candidate v0.1.
// This contract is candidate-only: not rule mutation, not PR creation, not
// truth, not proof/evidence, not Perspective promotion, not durable state, not
// execution authority, and not product write.

export type FeedbackToRuleCandidateVersion = "feedback_to_rule_candidate.v0.1";

export type FeedbackToRuleCandidateScope = "project:augnes";

export type FeedbackToRuleCandidateStatus = "candidate_contract_only";

export type FeedbackToRuleAffectedSurface =
  | "manual_note_parser"
  | "research_candidate_review"
  | "research_candidate_lifecycle_read_model"
  | "research_candidate_calibration_diagnostic"
  | "logical_claim_shape_preview"
  | "perspective_geometry_digest"
  | "agent_perspective_substrate"
  | "ai_context_packet"
  | "codex_handoff_draft"
  | "feedback_event_store"
  | "foundation_status_review"
  | "unknown";

export type FeedbackToRuleFeedbackPatternKind =
  | "repeated_dismissal"
  | "repeated_pin"
  | "repeated_correction"
  | "repeated_invalidation"
  | "needs_more_evidence_pattern"
  | "scope_overreach_pattern"
  | "missing_source_pattern"
  | "overclaim_risk_pattern"
  | "logical_structure_gap_pattern"
  | "handoff_not_done_pattern"
  | "authority_boundary_confusion"
  | "other";

export type FeedbackToRuleCandidateReviewStatus =
  | "candidate_only"
  | "needs_review"
  | "rejected"
  | "accepted_for_future_pr"
  | "superseded";

export type FeedbackToRuleRiskLevel = "low" | "medium" | "high";

export type FeedbackToRuleCandidateReasonCode =
  | "feedback_refs_present"
  | "feedback_refs_missing"
  | "source_refs_present"
  | "source_refs_missing"
  | "operator_note_redacted"
  | "secret_like_pattern_blocked"
  | "affected_surface_supported"
  | "affected_surface_unknown"
  | "pattern_kind_supported"
  | "proposed_change_present"
  | "proposed_change_missing"
  | "authority_boundary_preserved"
  | "rule_mutation_not_executed"
  | "future_pr_not_created"
  | "candidate_only_not_truth"
  | "accepted_for_future_pr_not_pr_authority";

export interface FeedbackToRuleAuthorityBoundary {
  candidate_only: true;
  rule_mutation_executed_now: false;
  future_pr_created_now: false;
  source_of_truth: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state: false;
  work_mutation: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  provider_openai_authority: false;
  source_fetch_authority: false;
  retrieval_rag_authority: false;
  git_ledger_export_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
}

export interface FeedbackToRuleSourceFeedbackRef {
  feedback_event_ref: string;
  event_type: string;
  target_kind?: string;
  target_id?: string;
  source_ref_ids: string[];
  operator_note_summary?: string;
  redaction_status: "not_needed" | "redacted" | "blocked_secret_like_pattern";
}

export interface FeedbackToRuleCandidate {
  candidate_version: FeedbackToRuleCandidateVersion;
  scope: FeedbackToRuleCandidateScope;
  status: FeedbackToRuleCandidateStatus;
  candidate_id: string;
  affected_surface: FeedbackToRuleAffectedSurface;
  feedback_pattern_kind: FeedbackToRuleFeedbackPatternKind;
  feedback_event_refs: string[];
  source_feedback_refs: FeedbackToRuleSourceFeedbackRef[];
  observed_pattern: string;
  proposed_rule_change: string;
  expected_benefit: string;
  risk_level: FeedbackToRuleRiskLevel;
  risk_note: string;
  review_status: FeedbackToRuleCandidateReviewStatus;
  reason_codes: FeedbackToRuleCandidateReasonCode[];
  boundary_notes: string[];
  authority_boundary: FeedbackToRuleAuthorityBoundary;
}

export interface FeedbackToRuleCandidateBundle {
  bundle_version: "feedback_to_rule_candidate_bundle.v0.1";
  scope: FeedbackToRuleCandidateScope;
  status: FeedbackToRuleCandidateStatus;
  as_of: string;
  source_fixture_refs: string[];
  candidates: FeedbackToRuleCandidate[];
  affected_surface_counts: Record<FeedbackToRuleAffectedSurface, number>;
  feedback_pattern_counts: Record<FeedbackToRuleFeedbackPatternKind, number>;
  review_status_counts: Record<FeedbackToRuleCandidateReviewStatus, number>;
  risk_level_counts: Record<FeedbackToRuleRiskLevel, number>;
  boundary_notes: string[];
  authority_boundary: FeedbackToRuleAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface FeedbackToRuleCandidateValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface FeedbackToRuleRawFeedbackEvent {
  event_id: string;
  event_type: string;
  target_kind?: string;
  target_id?: string;
  source_ref_ids?: string[];
  operator_note?: string;
  operator_note_summary?: string;
  created_at?: string;
}

export interface FeedbackToRuleCandidateOverride {
  target_candidate_id?: string;
  affected_surface?: FeedbackToRuleAffectedSurface;
  feedback_pattern_kind?: FeedbackToRuleFeedbackPatternKind;
  review_status?: FeedbackToRuleCandidateReviewStatus;
  risk_level?: FeedbackToRuleRiskLevel;
  observed_pattern?: string;
  proposed_rule_change?: string;
  expected_benefit?: string;
  risk_note?: string;
}

export interface FeedbackToRuleCandidateBuilderInput {
  scope: FeedbackToRuleCandidateScope;
  as_of: string;
  source_fixture_refs: string[];
  feedback_events: FeedbackToRuleRawFeedbackEvent[];
  candidate_overrides?: FeedbackToRuleCandidateOverride[];
}
