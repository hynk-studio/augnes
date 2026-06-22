// This file is a type-only, non-authoritative preview contract for the
// Candidate-to-Codex handoff draft v0.1. It is not an execution contract, not
// GitHub automation, not a branch/PR creation contract, not proof/evidence, not
// durable Perspective state, not product-write authority, and not retrieval/RAG.

import type {
  ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
  ResearchCandidateAIContextPacketGeometrySubstrateLineage,
} from "@/types/research-candidate-ai-context-packet";

export type CandidateToCodexHandoffDraftTarget = "codex_implementation";

export interface CandidateToCodexHandoffDraftInput {
  upgradedAiContextPacket: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade;
  target?: CandidateToCodexHandoffDraftTarget;
  handoff_mode?: "copyable_codex_prompt_preview";
  scope?: string;
  as_of?: string;
  operator_note?: string;
}

export interface CandidateToCodexHandoffDraftSection {
  section_id: string;
  section_title: string;
  section_kind:
    | "mission"
    | "source_packet"
    | "geometry_context"
    | "agent_substrate"
    | "folded_audit"
    | "manual_lineage"
    | "boundaries"
    | "stop_conditions";
  summary: string;
  source_refs: string[];
  preview_only: true;
  authority_boundary_notes: string[];
}

export interface CandidateToCodexHandoffDraftExpectedChange {
  change_id: string;
  change_kind: "future_handoff_review_slice";
  description: string;
  expected_files: string[];
  implementation_allowed_now: false;
  product_write_related: false;
  authority_boundary_notes: string[];
}

export interface CandidateToCodexHandoffDraftExpectedCheck {
  check_id: string;
  command: string;
  purpose: string;
  required_for_future_review: true;
  executes_codex_now: false;
  calls_github_now: false;
  authority_boundary_notes: string[];
}

export interface CandidateToCodexHandoffDraftStopCondition {
  stop_condition_id: string;
  condition: string;
  severity: "blocker";
  authority_boundary_notes: string[];
}

export interface CandidateToCodexHandoffDraftAuthorityBoundary {
  preview_only: true;
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
}

export interface CandidateToCodexHandoffDraftLineage {
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

export interface CandidateToCodexHandoffDraftValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface CandidateToCodexHandoffDraft {
  draft_kind: "candidate_to_codex_handoff_draft";
  draft_version: "candidate_to_codex_handoff_draft.geometry_substrate.v0.1";
  scope: string;
  as_of: string;
  handoff_mode: "copyable_codex_prompt_preview";
  target: CandidateToCodexHandoffDraftTarget;
  source_ai_context_packet_ref: string;
  source_ai_context_packet_fingerprint: string;
  draft_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
  title: string;
  copyable_prompt: string;
  structured_handoff: {
    mission_brief: string;
    implementation_intent: string;
    source_packet_summary: Record<string, unknown>;
    geometry_digest_summary: Record<string, unknown>;
    agent_substrate_summary: Record<string, unknown>;
    folded_audit_summary: Record<string, unknown>;
    manual_lineage_summary: Record<string, unknown>;
    selected_context_cards: Array<Record<string, unknown>>;
    forbidden_actions: string[];
    expected_files: string[];
    expected_checks: string[];
    stop_conditions: string[];
    final_report_requirements: string[];
  };
  expected_changes: CandidateToCodexHandoffDraftExpectedChange[];
  expected_checks: CandidateToCodexHandoffDraftExpectedCheck[];
  stop_conditions: CandidateToCodexHandoffDraftStopCondition[];
  source_refs: string[];
  unresolved_tensions: Array<Record<string, unknown>>;
  geometry_context_summary: Record<string, unknown>;
  agent_substrate_summary: Record<string, unknown>;
  folded_audit_summary: Record<string, unknown>;
  manual_lineage_summary: {
    manual_ai_context_packet_base_ref: string | null;
    manual_research_candidate_review_refs: string[];
    manual_formation_receipt_refs: string[];
    manual_lineage_present: boolean;
    manual_lineage_authority: false;
    manual_lineage_included_in_copyable_prompt: boolean;
  };
  authority_boundary: CandidateToCodexHandoffDraftAuthorityBoundary;
  lineage: CandidateToCodexHandoffDraftLineage &
    Pick<
      ResearchCandidateAIContextPacketGeometrySubstrateLineage,
      | "ai_context_packet_base_refs"
      | "manual_ai_context_packet_base_ref"
      | "research_candidate_review_refs"
      | "manual_research_candidate_review_refs"
      | "perspective_geometry_digest_refs"
      | "agent_perspective_substrate_ref"
      | "agent_perspective_substrate_preview_ref"
      | "cockpit_folded_audit_panel_ref"
      | "formation_receipt_refs"
      | "manual_formation_receipt_refs"
      | "product_write_stopline_ref"
    >;
  validation: CandidateToCodexHandoffDraftValidationResult;
  recommendation_status: "ready_for_candidate_to_codex_handoff_draft_review";
  next_recommended_slice: "candidate_to_codex_handoff_draft_review_v0_1";
}
