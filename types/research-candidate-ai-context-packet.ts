// This file is a type-only, non-authoritative preview contract for the
// Research Candidate AI Context Packet v0.1 static fixtures. It is not an API
// contract, not a provider prompt, not a Codex execution contract, not
// proof/evidence, not perspective promotion authority, not durable memory, and
// not retrieval/RAG.

export type ResearchCandidateAIContextPacketVersion =
  "research_candidate_ai_context_packet.v0.1";

export type ResearchCandidateAIContextPacketSourceKind =
  | "research_candidate_review_overlay"
  | "manual_parser_output_overlay";

export type ResearchCandidateAIContextPacketAudience =
  | "assistant_preview"
  | "codex_planning_preview"
  | "human_review_preview";

export interface ResearchCandidateAIContextPacketAuthority {
  read_only: true;
  preview_only: true;
  candidate_only: true;
  source_of_truth: false;
  creates_evidence: false;
  creates_proof: false;
  commits_state: false;
  promotes_perspective: false;
  creates_work_item: false;
  mutates_runtime: false;
  executes_agents: false;
  sends_handoff: false;
  calls_provider: false;
  performs_retrieval: false;
}

export interface ResearchCandidateAIContextPacketSourceOverlayRef {
  overlay_version: string;
  source_kind: string;
  source_fixture_path: string;
  overlay_fixture_path: string;
  node_count: number;
  edge_count: number;
}

export interface ResearchCandidateAIContextPacketBaseSummary {
  id: string;
  node_id: string;
  summary: string;
  source_refs: string[];
  related_node_ids: string[];
  authority_note: string;
}

export interface ResearchCandidateAIContextPacketSourceSummary
  extends ResearchCandidateAIContextPacketBaseSummary {}

export interface ResearchCandidateAIContextPacketClaimSummary
  extends ResearchCandidateAIContextPacketBaseSummary {
  review_status?: string;
  epistemic_status?: string;
  supporting_evidence_node_ids: string[];
  contradicting_evidence_node_ids: string[];
}

export interface ResearchCandidateAIContextPacketEvidenceSummary
  extends ResearchCandidateAIContextPacketBaseSummary {
  review_status?: string;
  epistemic_status?: string;
  evidence_relation_labels: string[];
  related_claim_node_ids: string[];
}

export interface ResearchCandidateAIContextPacketTensionSummary
  extends ResearchCandidateAIContextPacketBaseSummary {
  review_status?: string;
  epistemic_status?: string;
  related_claim_node_ids: string[];
  related_evidence_node_ids: string[];
  preserved_by_delta_node_ids: string[];
}

export interface ResearchCandidateAIContextPacketKnowledgeGapSummary
  extends ResearchCandidateAIContextPacketBaseSummary {
  review_status?: string;
  epistemic_status?: string;
  related_claim_node_ids: string[];
  related_tension_node_ids: string[];
  tracked_by_delta_node_ids: string[];
}

export interface ResearchCandidateAIContextPacketPerspectiveDeltaSummary
  extends ResearchCandidateAIContextPacketBaseSummary {
  target_perspective_key: string;
  review_status?: string;
  epistemic_status?: string;
  basis_claim_node_ids: string[];
  basis_evidence_node_ids: string[];
  related_tension_node_ids: string[];
  related_gap_node_ids: string[];
  promotion_readiness_label?: string;
}

export interface ResearchCandidateAIContextPacketFollowUpSummary
  extends ResearchCandidateAIContextPacketBaseSummary {
  review_status?: string;
  derived_from_session_node_ids: string[];
  derived_from_source_node_ids: string[];
  is_work_item: false;
}

export interface ResearchCandidateAIContextPacketTargetPerspectiveSummary {
  target_perspective_key: string;
  anchor_node_id: string;
  delta_node_ids: string[];
  authority_note: string;
}

export interface ResearchCandidateAIContextPacketDiagnostics {
  source_overlay_node_count: number;
  source_overlay_edge_count: number;
  source_summary_count: number;
  claim_summary_count: number;
  evidence_summary_count: number;
  tension_summary_count: number;
  knowledge_gap_summary_count: number;
  perspective_delta_summary_count: number;
  follow_up_summary_count: number;
  target_perspective_summary_count: number;
  unresolved_tension_count: number;
  blocked_or_not_ready_delta_count: number;
  source_ref_coverage_ratio: number;
  final_guardrail_count: number;
}

export interface ResearchCandidateAIContextPacket {
  packet_version: ResearchCandidateAIContextPacketVersion;
  scope: string;
  source_kind: ResearchCandidateAIContextPacketSourceKind;
  source_overlay: ResearchCandidateAIContextPacketSourceOverlayRef;
  audience: ResearchCandidateAIContextPacketAudience;
  mission_brief: string;
  non_authority_notice: string;
  source_summaries: ResearchCandidateAIContextPacketSourceSummary[];
  claim_summaries: ResearchCandidateAIContextPacketClaimSummary[];
  evidence_summaries: ResearchCandidateAIContextPacketEvidenceSummary[];
  tension_summaries: ResearchCandidateAIContextPacketTensionSummary[];
  knowledge_gap_summaries: ResearchCandidateAIContextPacketKnowledgeGapSummary[];
  perspective_delta_summaries: ResearchCandidateAIContextPacketPerspectiveDeltaSummary[];
  follow_up_summaries: ResearchCandidateAIContextPacketFollowUpSummary[];
  target_perspective_summaries: ResearchCandidateAIContextPacketTargetPerspectiveSummary[];
  diagnostics: ResearchCandidateAIContextPacketDiagnostics;
  final_guardrails: string[];
  authority: ResearchCandidateAIContextPacketAuthority;
}

export type ResearchCandidateAIContextPacketFixture =
  ResearchCandidateAIContextPacket;
