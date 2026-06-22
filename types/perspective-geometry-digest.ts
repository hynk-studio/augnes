// This file is a type-only, advisory preview contract for PerspectiveGeometryDigest
// v0.1 artifacts derived from Research Candidate Constellation Overlay fixtures.
// It is not a source of truth, not proof/evidence, not durable Perspective state,
// not a layout-coordinate contract, not retrieval/RAG, not agent execution
// authority, and not product-write authority.

export type PerspectiveGeometryDigestVersion =
  "perspective_geometry_digest.v0.1";

export type PerspectiveGeometryDigestMode =
  "research_candidate_overlay_digest";

export type PerspectiveGeometryClusterKind =
  | "candidate_family_cluster"
  | "target_perspective_cluster"
  | "source_reference_cluster"
  | "session_context_cluster";

export interface PerspectiveGeometrySourceRef {
  source_ref_id: string;
}

export interface PerspectiveGeometryDigestInput {
  candidateConstellationOverlay: unknown;
  scope?: string;
  as_of?: string;
  digest_mode?: PerspectiveGeometryDigestMode;
}

export interface PerspectiveGeometryDigestInputOverlaySummary {
  overlay_version: string;
  source_bundle_id: string;
  projection_mode: string;
  node_count: number;
  edge_count: number;
  source_ref_count: number;
  candidate_family_counts: Record<string, number>;
  node_kind_counts: Record<string, number>;
  edge_kind_counts: Record<string, number>;
  layout_coordinates_consumed: false;
  raw_layout_coordinates_exported: false;
  source_fixture_fingerprint: string;
}

export interface PerspectiveClusterDigest {
  cluster_id: string;
  cluster_label: string;
  cluster_kind: PerspectiveGeometryClusterKind;
  node_count: number;
  edge_count: number;
  source_ref_count: number;
  representative_node_ids: string[];
  related_candidate_family_counts: Record<string, number>;
  unresolved_tension_count: number;
  knowledge_gap_count: number;
  perspective_delta_count: number;
  follow_up_work_count: number;
  cluster_weight: number;
  source_refs: PerspectiveGeometrySourceRef[];
  interpretation_notes: string[];
  authority_boundary_notes: string[];
}

export interface PerspectiveGeometryNodeRef {
  node_id: string;
  node_kind: string;
  label: string;
  bridge_reason: string;
  degree: number;
  connected_candidate_families: string[];
  source_refs: PerspectiveGeometrySourceRef[];
  authority_boundary_notes: string[];
}

export interface PerspectiveContradictionPair {
  pair_id: string;
  a: PerspectiveGeometryNodeRef;
  b: PerspectiveGeometryNodeRef;
  reason: string;
  related_tension_node_ids: string[];
  source_refs: PerspectiveGeometrySourceRef[];
  epistemic_status: string;
  review_status: string;
  authority_boundary_notes: string[];
}

export interface PerspectiveGeometryDiagnostics {
  cluster_balance: number;
  source_dominance: number;
  manual_gravity_distribution: Record<string, number>;
  stale_high_gravity_count: number;
  bridge_node_count: number;
  coverage_gap_count: number;
  contradiction_pair_count: number;
  unresolved_tension_count: number;
  underrepresented_cluster_count: number;
  dominant_cluster_count: number;
  coordinates_used_for_truth: false;
  coordinates_exported_to_ai_context: false;
  digest_is_authority: false;
  source_ref_coverage_ratio: number;
  candidate_family_coverage: Record<string, number>;
}

export interface PerspectiveRetrievalExpansionRecommendation {
  expansion_id: string;
  reason: string;
  related_node_ids: string[];
  related_gap_or_tension_ids: string[];
  suggested_query_terms: string[];
  source_refs: PerspectiveGeometrySourceRef[];
  retrieval_executed_now: false;
  authority_boundary_notes: string[];
}

export interface PerspectiveGeometryAuthorityBoundary {
  derived_view_only: true;
  source_of_truth: false;
  can_commit_or_reject_state: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_execute_agents: false;
  can_call_external_services: false;
  can_promote_perspective: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
  layout_coordinates_are_truth: false;
  digest_is_advisory_only: true;
}

export interface PerspectiveGeometryDigestValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface PerspectiveGeometryDigest {
  version: PerspectiveGeometryDigestVersion;
  digest_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
  scope: string;
  as_of: string;
  digest_mode: PerspectiveGeometryDigestMode;
  input_overlay_summary: PerspectiveGeometryDigestInputOverlaySummary;
  dominant_clusters: PerspectiveClusterDigest[];
  underrepresented_clusters: PerspectiveClusterDigest[];
  bridge_nodes: PerspectiveGeometryNodeRef[];
  stale_high_gravity_nodes: PerspectiveGeometryNodeRef[];
  contradiction_pairs: PerspectiveContradictionPair[];
  diagnostics: PerspectiveGeometryDiagnostics;
  recommended_retrieval_expansion: PerspectiveRetrievalExpansionRecommendation[];
  source_refs: PerspectiveGeometrySourceRef[];
  authority_boundary: PerspectiveGeometryAuthorityBoundary;
  validation: PerspectiveGeometryDigestValidationResult;
  next_recommended_slice: "agent_perspective_substrate_docs_type_fixture_v0_1";
}
