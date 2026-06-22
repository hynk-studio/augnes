// This file is a type-only, non-authoritative preview contract for the
// Candidate-to-Codex handoff operator decision v0.1. It records that a human
// operator decision is required, not satisfied now, and grants no Codex,
// GitHub, branch/PR, external handoff, provider, retrieval, DB, durable write,
// agent, or product-write authority.

import type { CandidateToCodexHandoffDraftReview } from "@/types/candidate-to-codex-handoff-draft-review";

export type CandidateToCodexHandoffOperatorDecisionStatus =
  "operator_decision_required_before_any_codex_or_github_execution";

export type CandidateToCodexHandoffOperatorDecisionId =
  | "approve_for_manual_codex_copy_paste_later"
  | "request_handoff_revision"
  | "defer_handoff"
  | "reject_handoff"
  | "archive_preview";

export interface CandidateToCodexHandoffOperatorDecisionInput {
  handoffDraftReview: CandidateToCodexHandoffDraftReview;
  scope?: string;
  as_of?: string;
  operator_decision?: CandidateToCodexHandoffOperatorDecisionId | null;
  operator_note?: string | null;
}

export interface CandidateToCodexHandoffOperatorDecisionOption {
  option_id: CandidateToCodexHandoffOperatorDecisionId;
  label: string;
  meaning: string;
  execution_authority_granted_now: false;
  github_authority_granted_now: false;
  branch_or_pr_authority_granted_now: false;
  durable_write_authority_granted_now: false;
  product_write_authority_granted_now: false;
}

export interface CandidateToCodexHandoffOperatorDecisionRequiredAcknowledgement {
  acknowledgement_id:
    | "packet_is_not_source_of_truth"
    | "codex_execution_not_authorized_by_preview"
    | "github_automation_not_authorized_by_preview"
    | "branch_pr_creation_not_authorized_by_preview"
    | "external_handoff_not_sent_by_preview"
    | "no_provider_openai_call"
    | "no_source_fetch"
    | "no_retrieval_rag_execution"
    | "no_db_sql_transaction"
    | "no_proof_evidence_work_perspective_write"
    | "no_product_write_or_product_id_allocation"
    | "manual_lineage_preserved"
    | "unresolved_tensions_preserved";
  required: true;
  satisfied_now: false;
  authority_boundary_notes: string[];
}

export interface CandidateToCodexHandoffOperatorDecisionAuthorityBoundary {
  preview_only: true;
  review_only: true;
  operator_decision_recorded_now: false;
  operator_decision_satisfied_now: false;
  can_execute_codex: false;
  can_create_branch: false;
  can_open_pr: false;
  can_call_github: false;
  can_send_external_handoff: false;
  can_commit_or_reject_state: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_create_work_item: false;
  can_execute_agents: false;
  can_route_agents: false;
  can_call_external_services: false;
  can_call_providers_or_openai: false;
  can_run_retrieval_or_rag: false;
  can_fetch_sources: false;
  can_promote_perspective: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
  can_open_db: false;
  can_execute_sql: false;
  can_execute_transaction: false;
  can_add_route_or_ui: false;
  durable_write_authority: false;
  merge_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface CandidateToCodexHandoffOperatorDecisionLineage {
  source_handoff_draft_review_ref: string;
  source_handoff_draft_review_fingerprint: string;
  source_handoff_draft_ref: string;
  source_handoff_draft_fingerprint: string;
  source_ai_context_packet_ref: string;
  source_ai_context_packet_fingerprint: string;
  ai_context_packet_base_refs: string[];
  manual_ai_context_packet_base_ref: string | null;
  research_candidate_review_refs: string[];
  manual_research_candidate_review_refs: string[];
  perspective_geometry_digest_refs: string[];
  agent_perspective_substrate_ref: string;
  agent_perspective_substrate_preview_ref: string;
  cockpit_folded_audit_panel_ref: string;
  formation_receipt_refs: string[];
  manual_formation_receipt_refs: string[];
  product_write_stopline_ref: string;
}

export interface CandidateToCodexHandoffOperatorDecisionValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface CandidateToCodexHandoffOperatorDecisionPreview {
  decision_preview_kind: "candidate_to_codex_handoff_operator_decision_preview";
  decision_preview_version: "candidate_to_codex_handoff_operator_decision.v0.1";
  scope: string;
  as_of: string;
  source_handoff_draft_review_ref: string;
  source_handoff_draft_review_fingerprint: string;
  decision_preview_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
  operator_decision_required: true;
  operator_decision_satisfied_now: false;
  operator_decision_status: CandidateToCodexHandoffOperatorDecisionStatus;
  operator_decision: null;
  operator_note: null;
  decision_options: CandidateToCodexHandoffOperatorDecisionOption[];
  required_acknowledgements: CandidateToCodexHandoffOperatorDecisionRequiredAcknowledgement[];
  reviewed_readiness_summary: Record<string, unknown>;
  execution_blockers: string[];
  source_refs_summary: Record<string, unknown>;
  manual_lineage_summary: Record<string, unknown>;
  unresolved_tension_summary: Record<string, unknown>;
  stop_condition_summary: Record<string, unknown>;
  expected_checks_summary: Record<string, unknown>;
  authority_boundary: CandidateToCodexHandoffOperatorDecisionAuthorityBoundary;
  lineage: CandidateToCodexHandoffOperatorDecisionLineage;
  validation: CandidateToCodexHandoffOperatorDecisionValidationResult;
  recommendation_status: "ready_for_feedback_event_store_minimal_v0_1";
  next_recommended_slice: "feedback_event_store_minimal_v0_1";
}
