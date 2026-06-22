// This file is a type-only, non-authoritative preview contract for the
// Research Candidate AI Context Packet v0.1 static fixtures. It is not an API
// contract, not a provider prompt, not a Codex execution contract, not
// proof/evidence, not perspective promotion authority, not durable memory, and
// not retrieval/RAG.

import type {
  PerspectiveClusterDigest,
  PerspectiveContradictionPair,
  PerspectiveGeometryDiagnostics,
  PerspectiveGeometryNodeRef,
  PerspectiveRetrievalExpansionRecommendation,
} from "@/types/perspective-geometry-digest";
import type {
  AgentPerspectiveSourceCoveragePreview,
  AgentPerspectiveSubstratePreviewSection,
  AgentPerspectiveSurfacingPreviewCard,
} from "@/types/agent-perspective-substrate-preview";

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

export type ResearchCandidateAIContextPacketTargetAgent =
  | "chatgpt_design"
  | "codex_implementation"
  | "codex_review"
  | "mcp_runtime"
  | "cockpit_ui";

export type ResearchCandidateAIContextPacketGeometrySubstrateMode =
  "geometry_substrate_advisory_preview";

export interface ResearchCandidateAIContextPacketGeometryContext {
  geometry_digest_refs: string[];
  dominant_clusters: PerspectiveClusterDigest[];
  underrepresented_clusters: PerspectiveClusterDigest[];
  bridge_nodes: PerspectiveGeometryNodeRef[];
  contradiction_pairs: PerspectiveContradictionPair[];
  recommended_retrieval_expansion: PerspectiveRetrievalExpansionRecommendation[];
  diagnostics: PerspectiveGeometryDiagnostics;
  layout_coordinates_consumed: false;
  raw_layout_coordinates_exported: false;
  geometry_digest_is_authority: false;
}

export interface ResearchCandidateAIContextPacketAgentSubstrateContext {
  substrate_ref: string;
  substrate_preview_ref: string;
  surfaced_blockers: AgentPerspectiveSurfacingPreviewCard[];
  surfaced_warnings: AgentPerspectiveSurfacingPreviewCard[];
  surfaced_notices: AgentPerspectiveSurfacingPreviewCard[];
  retrieval_hints: AgentPerspectiveSurfacingPreviewCard[];
  handoff_improvements: AgentPerspectiveSurfacingPreviewCard[];
  stale_context_notices: AgentPerspectiveSurfacingPreviewCard[];
  product_write_stopline_reminders: AgentPerspectiveSurfacingPreviewCard[];
  source_coverage_preview: AgentPerspectiveSourceCoveragePreview;
  substrate_is_authority: false;
  preview_is_authority: false;
}

export interface ResearchCandidateAIContextPacketFoldedAuditContext {
  folded_panel_available: true;
  folded_panel_anchor_id: "agent-perspective-substrate-folded-audit-panel";
  folded_sections: AgentPerspectiveSubstratePreviewSection[];
  surfacing_card_count: number;
  blocker_card_count: number;
  warning_card_count: number;
  source_ref_coverage_ratio: number;
  local_ui_state_only: true;
  durable_feedback_persistence_available: false;
  route_or_api_available: false;
}

export interface ResearchCandidateAIContextPacketTargetAgentContext {
  target_agent: ResearchCandidateAIContextPacketTargetAgent;
  mode: ResearchCandidateAIContextPacketGeometrySubstrateMode;
  token_budget: number;
  allowed_uses: string[];
  forbidden_actions: string[];
  stop_conditions: string[];
  expected_checks: string[];
  expected_files?: string[];
}

export interface ResearchCandidateAIContextPacketGeometrySubstrateAuthorityBoundary
  extends ResearchCandidateAIContextPacketAuthority {
  proof_or_evidence_record: false;
  durable_perspective_state: false;
  retrieval_executed_now: false;
  provider_called_now: false;
  source_fetch_executed_now: false;
  external_handoff_sent_now: false;
  codex_execution_authorized_now: false;
  agent_execution_authorized_now: false;
  product_write_authorized_now: false;
  product_write_available: false;
  db_write_available: false;
  route_or_ui_mutation_available: false;
}

export interface ResearchCandidateAIContextPacketGeometrySubstrateLineage {
  research_candidate_review_refs: string[];
  ai_context_packet_base_ref: string;
  ai_context_packet_base_refs: string[];
  manual_ai_context_packet_base_ref: string | null;
  manual_research_candidate_review_refs: string[];
  perspective_geometry_digest_refs: string[];
  agent_perspective_substrate_ref: string;
  agent_perspective_substrate_preview_ref: string;
  cockpit_folded_audit_panel_ref: string;
  formation_receipt_refs: string[];
  manual_formation_receipt_refs: string[];
  product_write_stopline_ref: string;
}

export interface ResearchCandidateAIContextPacketGeometrySubstrateValidationResult {
  passed: boolean;
  failure_codes: string[];
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

export interface ResearchCandidateAIContextPacketGeometrySubstrateUpgrade
  extends ResearchCandidateAIContextPacket {
  packet_upgrade_version: "research_candidate_ai_context_packet.geometry_substrate_upgrade.v0.1";
  packet_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
  geometry_context: ResearchCandidateAIContextPacketGeometryContext;
  agent_substrate_context: ResearchCandidateAIContextPacketAgentSubstrateContext;
  folded_audit_context: ResearchCandidateAIContextPacketFoldedAuditContext;
  target_agent_context: ResearchCandidateAIContextPacketTargetAgentContext;
  authority_boundary: ResearchCandidateAIContextPacketGeometrySubstrateAuthorityBoundary;
  lineage: ResearchCandidateAIContextPacketGeometrySubstrateLineage;
  validation: ResearchCandidateAIContextPacketGeometrySubstrateValidationResult;
  next_recommended_slice: "candidate_to_codex_handoff_draft_geometry_substrate_v0_1";
}

export interface ResearchCandidateAIContextPacketGeometrySubstrateUpgradeInput {
  baseAiContextPacket: ResearchCandidateAIContextPacket;
  manualBaseAiContextPacket?: ResearchCandidateAIContextPacket;
  perspectiveGeometryDigest: unknown;
  manualPerspectiveGeometryDigest?: unknown;
  agentPerspectiveSubstrate: unknown;
  agentPerspectiveSubstratePreview: unknown;
  formationReceiptPreview?: unknown;
  manualFormationReceiptPreview?: unknown;
  target_agent?: ResearchCandidateAIContextPacketTargetAgent;
  mode?: ResearchCandidateAIContextPacketGeometrySubstrateMode;
  token_budget?: number;
  as_of?: string;
  scope?: string;
}

export type ResearchCandidateAIContextPacketFixture =
  ResearchCandidateAIContextPacket;

export type ResearchCandidateAIContextPacketGeometrySubstrateUpgradeFixture =
  ResearchCandidateAIContextPacketGeometrySubstrateUpgrade;
