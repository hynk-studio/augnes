// Type-only contract for the Research Candidate Lifecycle Read Model v0.1.
// It is a derived read model only: not proof/evidence, not Perspective
// promotion, not durable state, not execution authority, and not product write.

export type ResearchCandidateLifecycleVersion =
  "research_candidate_lifecycle.v0.1";

export type ResearchCandidateLifecycleScope = "project:augnes";

export type ResearchCandidateLifecycleStatus = "derived_read_model_only";

export type ResearchCandidateFamily =
  | "claim"
  | "evidence"
  | "tension"
  | "knowledge_gap"
  | "perspective_delta"
  | "follow_up_work";

export type ResearchCandidateLifecycleStatusLabel =
  | "new_candidate"
  | "needs_review"
  | "operator_corrected"
  | "operator_pinned"
  | "operator_dismissed"
  | "invalidated"
  | "superseded"
  | "stale"
  | "ready_for_review"
  | "blocked";

export type ResearchCandidateNextReviewAction =
  | "inspect_source"
  | "resolve_tension"
  | "add_evidence"
  | "review_feedback"
  | "prepare_handoff"
  | "defer"
  | "reject_candidate"
  | "no_action";

export interface ResearchCandidateLifecycleAuthorityBoundary {
  derived_read_model_only: true;
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

export interface ResearchCandidateLifecycleSummary {
  lifecycle_version: ResearchCandidateLifecycleVersion;
  scope: ResearchCandidateLifecycleScope;
  as_of: string;
  candidate_id: string;
  candidate_family: ResearchCandidateFamily;
  source_refs: string[];
  source_coverage_boundary_note?: string;
  current_review_status: string;
  current_epistemic_status?: string;
  lifecycle_status: ResearchCandidateLifecycleStatusLabel;
  first_seen_ref: string;
  latest_feedback_event_ref?: string;
  related_packet_refs: string[];
  related_handoff_refs: string[];
  related_feedback_event_refs: string[];
  unresolved_tension_count: number;
  knowledge_gap_count: number;
  source_ref_coverage_ratio: number;
  next_review_action: ResearchCandidateNextReviewAction;
  reason_codes: string[];
  authority_boundary: ResearchCandidateLifecycleAuthorityBoundary;
}

export interface ResearchCandidateLifecycleReadModel {
  lifecycle_version: ResearchCandidateLifecycleVersion;
  scope: ResearchCandidateLifecycleScope;
  status: ResearchCandidateLifecycleStatus;
  as_of: string;
  source_fixture_refs: string[];
  candidate_summaries: ResearchCandidateLifecycleSummary[];
  family_counts: Record<ResearchCandidateFamily, number>;
  lifecycle_status_counts: Record<ResearchCandidateLifecycleStatusLabel, number>;
  review_queue: {
    needs_review: string[];
    blocked: string[];
    stale: string[];
    ready_for_review: string[];
  };
  boundary_notes: string[];
  lifecycle_fingerprint: string;
  authority_boundary: ResearchCandidateLifecycleAuthorityBoundary;
}

export interface ResearchCandidateLifecycleValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface ResearchCandidateLifecycleFeedbackEvent {
  event_id: string;
  event_type:
    | "dismiss_preview"
    | "pin_preview"
    | "correct_preview"
    | "invalidate_preview"
    | string;
  target_kind?: string;
  target_id: string;
  source_ref_ids?: string[];
  created_at?: string;
}

export interface ResearchCandidateLifecyclePacketRef {
  packet_ref: string;
  candidate_refs: string[];
  source_refs?: string[];
}

export interface ResearchCandidateLifecycleHandoffRef {
  handoff_ref: string;
  candidate_refs: string[];
  source_refs?: string[];
}

export interface ResearchCandidateLifecycleCandidateReviewInput {
  claim_candidates?: unknown[];
  evidence_candidates?: unknown[];
  tension_candidates?: unknown[];
  knowledge_gap_candidates?: unknown[];
  perspective_delta_candidates?: unknown[];
  follow_up_work_candidates?: unknown[];
}

export interface ResearchCandidateLifecycleBuilderInput {
  scope: ResearchCandidateLifecycleScope;
  as_of: string;
  source_fixture_refs: string[];
  candidate_review: ResearchCandidateLifecycleCandidateReviewInput;
  feedback_events?: ResearchCandidateLifecycleFeedbackEvent[];
  packet_refs?: ResearchCandidateLifecyclePacketRef[];
  handoff_refs?: ResearchCandidateLifecycleHandoffRef[];
}
