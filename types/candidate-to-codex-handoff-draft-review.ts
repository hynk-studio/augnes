// This file is a type-only, non-authoritative review contract for the
// Candidate-to-Codex handoff draft review v0.1. It is review-only,
// preview-only, copyable text only, and grants no execution, write, mutation,
// GitHub automation, external handoff, provider, retrieval, DB, or product
// write authority.

import type { CandidateToCodexHandoffDraft } from "@/types/candidate-to-codex-handoff-draft";
import type { ResearchCandidateAIContextPacketGeometrySubstrateUpgrade } from "@/types/research-candidate-ai-context-packet";

export type CandidateToCodexHandoffDraftReviewStatus =
  | "candidate_to_codex_handoff_draft_review_passed"
  | "blocked_before_candidate_to_codex_handoff_draft_review";

export type CandidateToCodexHandoffDraftReviewFindingSeverity =
  | "info"
  | "notice"
  | "warning"
  | "blocker";

export interface CandidateToCodexHandoffDraftReviewInput {
  handoffDraft: CandidateToCodexHandoffDraft;
  sourceUpgradedAiContextPacket?: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade;
  scope?: string;
  as_of?: string;
  reviewer_note?: string;
}

export interface CandidateToCodexHandoffDraftReviewFinding {
  finding_id: string;
  finding_group:
    | "source_draft_integrity"
    | "copyable_prompt_completeness"
    | "structured_handoff_completeness"
    | "manual_lineage_preservation"
    | "unresolved_tension_preservation"
    | "source_ref_discipline"
    | "authority_boundary"
    | "no_execution"
    | "product_write_stopline"
    | "next_slice_discipline";
  severity: CandidateToCodexHandoffDraftReviewFindingSeverity;
  status: "passed" | "blocked";
  message: string;
  source_refs: string[];
  authority_boundary_notes: string[];
}

export interface CandidateToCodexHandoffDraftReviewChecklistItem {
  checklist_item_id: string;
  label: string;
  passed: boolean;
  source_refs: string[];
  authority_boundary_notes: string[];
}

export interface CandidateToCodexHandoffDraftReviewAuthorityBoundary {
  preview_only: true;
  review_only: true;
  copyable_text_only: true;
  source_of_truth: false;
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
  operator_decision_required_before_any_execution: true;
  operator_decision_satisfied_now: false;
}

export interface CandidateToCodexHandoffDraftReviewLineage {
  source_handoff_draft_ref: string;
  source_handoff_draft_fingerprint: string;
  upgraded_ai_context_packet_ref: string;
  upgraded_ai_context_packet_fingerprint: string;
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

export interface CandidateToCodexHandoffDraftReviewValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface CandidateToCodexHandoffDraftReview {
  review_kind: "candidate_to_codex_handoff_draft_review";
  review_version: "candidate_to_codex_handoff_draft_review.v0.1";
  scope: string;
  as_of: string;
  source_handoff_draft_ref: string;
  source_handoff_draft_fingerprint: string;
  review_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
  review_status: CandidateToCodexHandoffDraftReviewStatus;
  recommendation_status:
    | "ready_for_human_operator_handoff_decision"
    | "blocked_before_human_operator_handoff_decision";
  next_recommended_slice:
    | "candidate_to_codex_handoff_operator_decision_v0_1"
    | "candidate_to_codex_handoff_draft_review_recheck";
  source_summary: Record<string, unknown>;
  prompt_review: Record<string, boolean>;
  structured_handoff_review: Record<string, boolean>;
  lineage_review: Record<string, boolean>;
  manual_lineage_review: Record<string, boolean>;
  boundary_review: Record<string, boolean>;
  stop_condition_review: Record<string, boolean>;
  expected_change_review: Record<string, boolean>;
  expected_check_review: Record<string, boolean>;
  unresolved_tension_review: Record<string, boolean>;
  source_ref_review: Record<string, boolean>;
  review_findings: CandidateToCodexHandoffDraftReviewFinding[];
  checklist: CandidateToCodexHandoffDraftReviewChecklistItem[];
  authority_boundary: CandidateToCodexHandoffDraftReviewAuthorityBoundary;
  lineage: CandidateToCodexHandoffDraftReviewLineage;
  validation: CandidateToCodexHandoffDraftReviewValidationResult;
}
