// Contract-only Perspective Geometry Digest v0.1 shape.
// This file defines types only. It does not implement a digest builder
// runtime, geometry calculation, layout execution, UI rendering, graph
// mutation, durable Perspective state reads/writes, DB access,
// provider/OpenAI calls, retrieval/RAG execution, source fetching, crawling,
// routes, schema changes, migrations, AI Context Packet, Codex handoff,
// proof/evidence writes, accepted evidence writes, Formation Receipt writes,
// work mutation, or product writes.

export type PerspectiveGeometryDigestContractKind =
  "perspective_geometry_digest_contract";

export type PerspectiveGeometryDigestContractVersion =
  "perspective_geometry_digest_contract.v0.1";

export type PerspectiveGeometryDigestInputField =
  | "digest_scope_ref"
  | "project_constellation_layout_preview_ref"
  | "perspective_snapshot_ref"
  | "durable_perspective_state_ref"
  | "candidate_overlay_ref"
  | "source_refs"
  | "bridge_node_refs"
  | "stale_high_gravity_node_refs"
  | "tension_marker_refs"
  | "knowledge_gap_marker_refs"
  | "evidence_ray_refs"
  | "salience_state_ref"
  | "operator_context_ref";

export type PerspectiveGeometryDigestOutputField =
  | "digest_id"
  | "digest_version"
  | "scope"
  | "as_of"
  | "dominant_clusters"
  | "underrepresented_clusters"
  | "bridge_nodes"
  | "stale_high_gravity_nodes"
  | "contradiction_pairs"
  | "coverage_gaps"
  | "evidence_chains"
  | "diagnostics"
  | "recommended_retrieval_expansion"
  | "source_refs"
  | "authority_boundary"
  | "validation_policy";

export type PerspectiveGeometryClusterDigestKind =
  | "dominant_cluster"
  | "underrepresented_cluster"
  | "stale_influential_cluster";

export type PerspectiveGeometryNodeDigestKind =
  | "bridge_node_digest"
  | "stale_high_gravity_node_digest"
  | "tension_node_digest"
  | "knowledge_gap_node_digest"
  | "candidate_overlay_node_digest"
  | "source_reference_node_digest";

export type PerspectiveGeometryRelationshipDigestKind =
  | "contradiction_pair"
  | "evidence_chain"
  | "coverage_gap"
  | "retrieval_expansion_hint";

export type PerspectiveGeometryDiagnosticKind =
  | "cluster_balance"
  | "source_dominance"
  | "manual_gravity_distribution"
  | "stale_high_gravity_count"
  | "bridge_node_count"
  | "coverage_gap_count"
  | "contradiction_pair_count";

export interface PerspectiveGeometryDigestContractScope {
  perspective_geometry_digest_contract_only: true;
  geometry_digest_runtime_build_now: false;
  geometry_digest_write_now: false;
  geometry_calculation_runtime_now: false;
  raw_coordinate_only_digest_now: false;
  runtime_layout_execution_now: false;
  seeded_layout_runtime_now: false;
  force_directed_layout_runtime_now: false;
  temporal_smoothing_runtime_now: false;
  layout_persistence_now: false;
  layout_coordinate_write_now: false;
  graph_db_now: false;
  graph_mutation_now: false;
  browser_request_now: false;
  browser_rendering_now: false;
  ui_rendering_now: false;
  durable_perspective_state_read_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_now: false;
  ai_context_packet_now: false;
  codex_handoff_now: false;
  retrieval_rag_execution_now: false;
  provider_openai_call_now: false;
  source_fetch_now: false;
  crawler_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  schema_migration_now: false;
  product_write_now: false;
}

export interface PerspectiveGeometryDigestPrinciples {
  geometry_digest_is_interpretation_not_truth: true;
  raw_coordinates_not_enough: true;
  raw_coordinates_are_display_hints_only: true;
  raw_coordinates_not_source_of_truth: true;
  digest_is_derived_view: true;
  digest_not_independent_source_of_truth: true;
  diagnostics_are_advisory_only: true;
  cluster_balance_not_truth: true;
  source_dominance_warning_not_authority: true;
  manual_gravity_distribution_not_authority: true;
  coverage_gap_not_inferred_fact: true;
  candidate_overlay_and_durable_graph_distinct: true;
  evidence_chains_are_refs_not_proof: true;
  evidence_rays_are_refs_not_proof: true;
  recommended_retrieval_expansion_is_advisory: true;
  salience_state_not_authority: true;
  perspective_snapshot_is_derived_view: true;
  agent_substrate_advisory_only: true;
}

export interface PerspectiveGeometryClusterDigestFamily {
  cluster_kind: PerspectiveGeometryClusterDigestKind;
  cluster_ref_required: true;
  node_refs_required?: true;
  source_refs_required?: true;
  underrepresentation_reason_required?: true;
  stale_reason_required?: true;
  stale_marker_required?: true;
  interpretation_only: true;
  not_truth: true;
  runtime_write_now: false;
}

export interface PerspectiveGeometryNodeDigestFamily {
  node_digest_kind: PerspectiveGeometryNodeDigestKind;
  node_ref_required?: true;
  bridge_reason_required?: true;
  stale_reason_required?: true;
  source_refs_required?: true;
  navigation_hint_only?: true;
  not_truth?: true;
  stale_marker_visible?: true;
  not_authority?: true;
  tension_ref_required?: true;
  tension_visible?: true;
  resolution_not_implied?: true;
  knowledge_gap_ref_required?: true;
  gap_visible?: true;
  closure_not_implied?: true;
  candidate_ref_required?: true;
  candidate_only?: true;
  durable_graph_ref_forbidden?: true;
  visually_distinct_from_durable?: true;
  source_ref_required?: true;
  raw_source_body_forbidden?: true;
  runtime_write_now: false;
}

export interface PerspectiveGeometryRelationshipDigestFamily {
  relationship_kind: PerspectiveGeometryRelationshipDigestKind;
  node_refs_required?: true;
  reason_required?: true;
  source_refs_required?: true;
  contradicted_evidence_preserved?: true;
  not_resolution?: true;
  evidence_refs_required?: true;
  claim_refs_required?: true;
  refs_only_not_proof?: true;
  proof_write_now?: false;
  knowledge_gap_ref_required?: true;
  gap_reason_required?: true;
  source_refs_or_gap_reason_required?: true;
  not_inferred_fact?: true;
  expansion_reason_required?: true;
  advisory_only?: true;
  retrieval_execution_now?: false;
  runtime_write_now: false;
}

export interface PerspectiveGeometryDiagnosticFamily {
  diagnostic_kind: PerspectiveGeometryDiagnosticKind;
  advisory_only: true;
  not_truth?: true;
  not_promotion_authority?: true;
  manual_gravity_not_authority?: true;
  not_authority?: true;
  navigation_hint_only?: true;
  gap_not_fact?: true;
  contradiction_not_resolution?: true;
}

export interface PerspectiveGeometryRecommendationPolicy {
  recommended_retrieval_expansion_allowed_later: true;
  recommended_retrieval_expansion_advisory_only: true;
  retrieval_execution_now: false;
  retrieval_score_not_truth_score: true;
  retrieval_score_not_promotion_score: true;
  recommended_review_focus_allowed_later: true;
  recommended_review_focus_not_promotion_authority: true;
  source_balance_followup_allowed_later: true;
  tension_review_allowed_later: true;
  gap_followup_allowed_later: true;
  work_mutation_now: false;
}

export interface PerspectiveGeometryDigestAuthorityBoundary {
  contract_added_now: true;
  implementation_added_now: false;
  browser_validation_added_now: false;
  geometry_digest_runtime_build_implemented_now: false;
  geometry_digest_write_now: false;
  geometry_calculation_runtime_now: false;
  raw_coordinate_authority: false;
  raw_coordinate_only_digest_now: false;
  runtime_layout_implemented_now: false;
  runtime_layout_execution_now: false;
  seeded_layout_runtime_now: false;
  force_directed_layout_runtime_now: false;
  temporal_smoothing_runtime_now: false;
  layout_persistence_now: false;
  layout_coordinate_write_now: false;
  graph_db_implemented_now: false;
  graph_mutation_now: false;
  component_changed_now: false;
  route_changed_now: false;
  browser_request_now: false;
  browser_persistence_now: false;
  request_animation_frame_now: false;
  durable_perspective_state_read_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_implemented_now: false;
  trajectory_runtime_build_implemented_now: false;
  ai_context_packet_implemented_now: false;
  codex_handoff_implemented_now: false;
  proof_or_evidence_record_write_now: false;
  accepted_evidence_write_now: false;
  formation_receipt_write_now: false;
  work_mutation_now: false;
  candidate_mutation_now: false;
  candidate_record_write_now: false;
  runtime_promotion_implemented_now: false;
  promotion_decision_record_implemented_now: false;
  promotion_decision_record_write_now: false;
  runtime_retrieval_rag_implemented_now: false;
  runtime_index_build_implemented_now: false;
  runtime_index_write_now: false;
  embedding_generation_implemented_now: false;
  vector_db_implemented_now: false;
  fts_implemented_now: false;
  provider_openai_call_now: false;
  provider_extraction_now: false;
  source_fetch_now: false;
  crawler_now: false;
  source_index_write_now: false;
  durable_source_record_write_now: false;
  runtime_persistence_implemented_now: false;
  durable_memory_write_now: false;
  runtime_db_write_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  db_schema_implemented_now: false;
  durable_salience_write_now: false;
  recent_rehearsal_buffer_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  external_handoff_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  source_fetch_authority: false;
  salience_authority: false;
  layout_coordinate_authority: false;
  manual_anchor_authority: false;
  cluster_position_authority: false;
  geometry_digest_authority: false;
  diagnostic_authority: false;
  recommendation_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export type PerspectiveGeometryDigestPreviewAuthorityBoundary = Omit<
  PerspectiveGeometryDigestAuthorityBoundary,
  "contract_added_now"
>;

export interface PerspectiveGeometryDigestValidationPolicy {
  geometry_digest_is_interpretation_not_truth: true;
  raw_coordinates_not_enough: true;
  raw_coordinates_are_display_hints_only: true;
  raw_coordinates_not_source_of_truth: true;
  raw_coordinate_only_digest_forbidden: true;
  digest_is_derived_view: true;
  digest_not_independent_source_of_truth: true;
  diagnostics_are_advisory_only: true;
  cluster_balance_not_truth: true;
  source_dominance_warning_not_authority: true;
  manual_gravity_distribution_not_authority: true;
  coverage_gap_not_inferred_fact: true;
  contradiction_pairs_source_ref_backed: true;
  contradiction_not_resolution: true;
  evidence_chains_are_refs_not_proof: true;
  evidence_rays_are_refs_not_proof: true;
  recommended_retrieval_expansion_advisory_only: true;
  recommended_retrieval_expansion_does_not_execute_retrieval: true;
  candidate_overlay_and_durable_graph_distinct: true;
  salience_state_not_authority: true;
  perspective_snapshot_is_derived_view: true;
  all_digest_items_public_safe: true;
  all_digest_items_source_ref_backed_or_gap_reason_backed: true;
  no_runtime_digest_build: true;
  no_geometry_digest_write: true;
  no_geometry_calculation_runtime: true;
  no_runtime_layout_execution: true;
  no_layout_persistence: true;
  no_graph_db: true;
  no_graph_mutation: true;
  no_runtime_state_read_or_write: true;
  no_durable_perspective_delta_apply: true;
  no_perspective_snapshot_runtime: true;
  no_ai_context_packet: true;
  no_codex_handoff: true;
  no_proof_or_evidence_write: true;
  no_accepted_evidence_write: true;
  no_formation_receipt_write: true;
  no_work_mutation: true;
  no_runtime_db_write_or_query: true;
  no_schema_or_migration: true;
  no_route_or_ui: true;
  no_browser_request: true;
  no_provider_openai_call: true;
  no_retrieval_rag_execution: true;
  no_product_write_or_ids: true;
}

export interface PerspectiveGeometryDigestPrivacyPolicy {
  no_secrets_in_fixture: true;
  no_private_urls: true;
  no_raw_provider_thread_run_session_ids: true;
  no_raw_source_body: true;
  no_raw_coordinates_as_truth: true;
  public_safe_digest_refs_only: true;
  public_safe_cluster_refs_only: true;
  public_safe_node_refs_only: true;
  public_safe_edge_refs_only: true;
  public_safe_source_refs_only: true;
  public_safe_perspective_refs_only: true;
  public_safe_candidate_refs_only: true;
  public_safe_evidence_refs_only: true;
  public_safe_tension_refs_only: true;
  public_safe_knowledge_gap_refs_only: true;
}

export interface PerspectiveGeometryDigestPreview {
  digest_id: string;
  digest_version: "perspective_geometry_digest.v0.1";
  scope: string;
  as_of: "fixture_static_timestamp";
  dominant_clusters: Array<Record<string, unknown>>;
  underrepresented_clusters: Array<Record<string, unknown>>;
  bridge_nodes: Array<Record<string, unknown>>;
  stale_high_gravity_nodes: Array<Record<string, unknown>>;
  contradiction_pairs: Array<Record<string, unknown>>;
  coverage_gaps: Array<Record<string, unknown>>;
  evidence_chains: Array<Record<string, unknown>>;
  diagnostics: Record<string, unknown>;
  recommended_retrieval_expansion: Array<Record<string, unknown>>;
  source_refs: string[];
  raw_coordinates_used_as_truth: false;
  raw_coordinate_only_digest: false;
  all_items_public_safe: true;
  all_items_source_ref_backed_or_gap_reason_backed: true;
  all_runtime_write_now_false: true;
}

export interface PerspectiveGeometryDigestContract {
  contract_kind: PerspectiveGeometryDigestContractKind;
  contract_version: PerspectiveGeometryDigestContractVersion;
  source_project_constellation_layout_validation_ref: string;
  source_project_constellation_layout_validation_fingerprint: string;
  contract_scope: PerspectiveGeometryDigestContractScope;
  digest_principles: PerspectiveGeometryDigestPrinciples;
  digest_input_fields: PerspectiveGeometryDigestInputField[];
  digest_output_fields: PerspectiveGeometryDigestOutputField[];
  cluster_digest_families: PerspectiveGeometryClusterDigestFamily[];
  node_digest_families: PerspectiveGeometryNodeDigestFamily[];
  relationship_digest_families: PerspectiveGeometryRelationshipDigestFamily[];
  diagnostic_families: PerspectiveGeometryDiagnosticFamily[];
  recommendation_policy: PerspectiveGeometryRecommendationPolicy;
  sample_perspective_geometry_digest_preview: {
    preview_version: "perspective_geometry_digest_preview.v0.1";
    operator_context_ref: string;
    digest_input_preview: Record<string, unknown>;
    geometry_digest_preview: PerspectiveGeometryDigestPreview;
    authority_boundary: PerspectiveGeometryDigestPreviewAuthorityBoundary;
    validation_policy: PerspectiveGeometryDigestValidationPolicy;
  };
  authority_boundary: PerspectiveGeometryDigestAuthorityBoundary;
  validation_policy: PerspectiveGeometryDigestValidationPolicy;
  privacy_policy: PerspectiveGeometryDigestPrivacyPolicy;
  recommendation_status: "ready_for_perspective_geometry_digest_implementation_v0_1";
  next_recommended_slice: "perspective_geometry_digest_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
