// This file is a type-only, non-authoritative preview contract for the
// Research Candidate Constellation Overlay v0.1 static fixtures. It is not a
// graph DB schema, not a layout contract, not runtime validation, not a
// retrieval or embedding contract, not proof/evidence, and not perspective
// promotion authority.

export type ResearchCandidateConstellationOverlayVersion =
  "research_candidate_constellation_overlay.v0.1";

export type ResearchCandidateConstellationOverlaySourceKind =
  | "research_candidate_review_fixture"
  | "manual_parser_output_fixture";

export type ResearchCandidateConstellationNodeKind =
  | "research_session"
  | "source_reference"
  | "claim_candidate"
  | "evidence_candidate"
  | "tension_candidate"
  | "knowledge_gap_candidate"
  | "perspective_delta_candidate"
  | "follow_up_work_candidate"
  | "target_perspective_anchor";

export type ResearchCandidateConstellationEdgeRelation =
  | "derived_from_source"
  | "session_uses_source"
  | "claim_supported_by_evidence"
  | "claim_qualified_by_evidence"
  | "claim_contradicted_by_evidence"
  | "claim_contextualized_by_evidence"
  | "claim_limited_by_evidence"
  | "tension_relates_to_claim"
  | "tension_relates_to_evidence"
  | "gap_relates_to_claim"
  | "gap_relates_to_tension"
  | "delta_proposes_change_to_perspective"
  | "delta_uses_claim_basis"
  | "delta_uses_evidence_basis"
  | "delta_preserves_tension"
  | "delta_tracks_gap"
  | "follow_up_derived_from_session"
  | "follow_up_derived_from_source";

export interface ResearchCandidateConstellationAuthority {
  read_only: true;
  candidate_only: true;
  source_of_truth: false;
  creates_evidence: false;
  creates_proof: false;
  commits_state: false;
  promotes_perspective: false;
  creates_work_item: false;
  mutates_runtime: false;
  executes_agents: false;
}

export interface ResearchCandidateConstellationSourceRef {
  source_ref_id: string;
}

export interface ResearchCandidateConstellationNode {
  id: string;
  kind: ResearchCandidateConstellationNodeKind;
  label: string;
  summary: string;
  source_family: string;
  source_object_id: string;
  review_status?: string;
  epistemic_status?: string;
  source_refs: ResearchCandidateConstellationSourceRef[];
  target_perspective_key?: string;
  display_order: number;
  authority: ResearchCandidateConstellationAuthority;
}

export interface ResearchCandidateConstellationEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relation: ResearchCandidateConstellationEdgeRelation;
  label: string;
  source_object_id: string;
  source_refs: ResearchCandidateConstellationSourceRef[];
  authority: ResearchCandidateConstellationAuthority;
}

export interface ResearchCandidateConstellationDiagnostics {
  node_count: number;
  edge_count: number;
  source_reference_node_count: number;
  claim_node_count: number;
  evidence_node_count: number;
  tension_node_count: number;
  knowledge_gap_node_count: number;
  perspective_delta_node_count: number;
  follow_up_work_node_count: number;
  target_perspective_anchor_count: number;
  unresolved_tension_count: number;
  promotion_ready_count: number;
  blocked_or_not_ready_delta_count: number;
  source_ref_coverage_ratio: number;
}

export interface ResearchCandidateConstellationOverlay {
  overlay_version: ResearchCandidateConstellationOverlayVersion;
  scope: string;
  source_kind: ResearchCandidateConstellationOverlaySourceKind;
  source_fixture_path: string;
  source_preview_version?: string;
  source_fixture_version?: string;
  nodes: ResearchCandidateConstellationNode[];
  edges: ResearchCandidateConstellationEdge[];
  diagnostics: ResearchCandidateConstellationDiagnostics;
  authority: ResearchCandidateConstellationAuthority;
}

export type ResearchCandidateConstellationOverlayFixture =
  ResearchCandidateConstellationOverlay;
