// Type-only Project Constellation Runtime Layout Contract v0.1.
// This contract defines future runtime layout boundaries only. It does not
// implement seeded layout runtime, layout algorithms, persistence, routes, UI,
// graph rendering, DB access, durable state mutation, proof/evidence writes,
// product writes, provider calls, retrieval/RAG execution, source fetch, file
// reads, Git Ledger export, Codex/GitHub automation, or background work.

export type ProjectConstellationRuntimeLayoutContractVersion =
  "project_constellation_runtime_layout_contract.v0.1";

export type ProjectConstellationRuntimeLayoutScope = "project:augnes";

export type ProjectConstellationRuntimeLayoutContractStatus =
  "contract_only";

export type ProjectConstellationLayoutVersion =
  "project_constellation_layout.v0.1";

export type ProjectConstellationLayoutNodeVersion =
  "project_constellation_layout_node.v0.1";

export type ProjectConstellationLayoutEdgeVersion =
  "project_constellation_layout_edge.v0.1";

export type ProjectConstellationManualAnchorVersion =
  "project_constellation_manual_anchor.v0.1";

export type ProjectConstellationLayoutDiagnosticVersion =
  "project_constellation_layout_diagnostic.v0.1";

export type ProjectConstellationRuntimeLayoutBundleVersion =
  "project_constellation_runtime_layout_bundle.v0.1";

export type ProjectConstellationLayoutLayer =
  | "durable_graph"
  | "candidate_overlay"
  | "review_memory"
  | "source_ref"
  | "feedback"
  | "trajectory"
  | "unknown";

export type ProjectConstellationNodeKind =
  | "perspective"
  | "thesis"
  | "claim"
  | "evidence_ref"
  | "source_ref"
  | "tension"
  | "knowledge_gap"
  | "candidate"
  | "review_record"
  | "promotion_decision"
  | "formation_receipt"
  | "apply_event"
  | "feedback"
  | "bridge"
  | "durable_perspective_node"
  | "candidate_overlay_node"
  | "claim_node"
  | "evidence_anchor_node"
  | "tension_marker_node"
  | "knowledge_gap_marker_node"
  | "bridge_node"
  | "stale_high_gravity_node"
  | "source_reference_node"
  | "work_context_node"
  | "unknown";

export type ProjectConstellationEdgeKind =
  | "supports"
  | "contradicts"
  | "refines"
  | "weakens"
  | "reverses"
  | "splits"
  | "merges"
  | "retires"
  | "reactivates"
  | "preserves_tension"
  | "resolves_tension"
  | "preserves_gap"
  | "closes_gap"
  | "selected_by_receipt"
  | "omitted_by_receipt"
  | "deferred_by_receipt"
  | "promoted_by_decision"
  | "applied_by_event"
  | "feedback_influences"
  | "source_lineage"
  | "bridge_relation"
  | "supports_ref"
  | "contradicts_ref"
  | "qualifies_ref"
  | "derived_from_source"
  | "candidate_overlay_link"
  | "bridge_hint"
  | "tension_line"
  | "knowledge_gap_line"
  | "reuse_condition_link"
  | "work_context_link"
  | "unknown";

export type ProjectConstellationLayoutStatus =
  | "contract_only"
  | "layout_candidate"
  | "needs_operator_review"
  | "blocked_private_or_raw_payload"
  | "blocked_missing_state"
  | "blocked_forbidden_authority"
  | "rejected";

export type ProjectConstellationCoordinateAuthority =
  | "display_hint_only"
  | "manual_anchor_hint"
  | "temporal_smoothing_hint"
  | "stale_layout_hint"
  | "unknown";

export type ProjectConstellationMarkerKind =
  | "stale"
  | "tension"
  | "gap"
  | "bridge"
  | "source_balance"
  | "candidate_overlay"
  | "retired"
  | "prior_thesis"
  | "contradiction"
  | "unknown";

export type ProjectConstellationDiagnosticKind =
  | "source_balance"
  | "stale_layout"
  | "candidate_overlay_separation"
  | "durable_candidate_boundary"
  | "unresolved_tension_visibility"
  | "knowledge_gap_visibility"
  | "retired_claim_visibility"
  | "prior_thesis_visibility"
  | "bridge_node_visibility"
  | "authority_boundary"
  | "unknown";

export type ProjectConstellationReasonCode =
  | "roadmap_file_present"
  | "trajectory_ref_present"
  | "trajectory_ref_missing"
  | "durable_state_ref_present"
  | "durable_state_ref_missing"
  | "perspective_id_present"
  | "perspective_id_missing"
  | "layout_seed_present"
  | "layout_seed_missing"
  | "node_ref_present"
  | "node_ref_missing"
  | "edge_ref_present"
  | "edge_ref_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "candidate_ref_present"
  | "review_record_ref_present"
  | "promotion_decision_ref_present"
  | "formation_receipt_ref_present"
  | "apply_event_ref_present"
  | "feedback_ref_present"
  | "prior_thesis_ref_present"
  | "retired_claim_ref_present"
  | "tension_ref_present"
  | "knowledge_gap_ref_present"
  | "coordinate_display_hint_only"
  | "coordinate_not_truth"
  | "coordinate_not_proof"
  | "coordinate_not_evidence_strength"
  | "coordinate_not_promotion_readiness"
  | "manual_anchor_display_hint_only"
  | "temporal_smoothing_display_continuity_only"
  | "candidate_overlay_not_durable_graph"
  | "source_balance_advisory_only"
  | "stale_marker_display_warning_only"
  | "tension_marker_review_aid_only"
  | "gap_marker_review_aid_only"
  | "bridge_marker_review_aid_only"
  | "layout_runtime_not_implemented"
  | "layout_algorithm_not_implemented"
  | "layout_persistence_not_implemented"
  | "route_not_implemented"
  | "ui_not_implemented"
  | "db_write_not_executed"
  | "durable_state_not_mutated"
  | "formation_receipt_not_written"
  | "promotion_not_executed"
  | "proof_not_created"
  | "evidence_not_created"
  | "claim_evidence_not_written"
  | "product_write_denied"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "retrieval_not_executed"
  | "rag_answer_not_generated"
  | "source_fetch_not_executed"
  | "file_read_not_executed"
  | "git_ledger_export_not_executed"
  | "private_or_raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "local_path_blocked"
  | "private_url_blocked";

export interface ProjectConstellationRuntimeLayoutAuthorityBoundary {
  contract_only: true;
  layout_runtime_now: false;
  layout_algorithm_now: false;
  seeded_layout_now: false;
  layout_persistence_now: false;
  manual_anchor_persistence_now: false;
  route_now: false;
  ui_now: false;
  graph_rendering_now: false;
  graph_database_now: false;
  db_query_or_write_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  work_mutation_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  git_ledger_export_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  layout_is_truth: false;
  coordinate_is_truth: false;
  coordinate_is_proof: false;
  coordinate_is_evidence_strength: false;
  coordinate_is_promotion_readiness: false;
  manual_anchor_is_authority: false;
  temporal_smoothing_is_state: false;
  candidate_overlay_is_durable_graph: false;
  source_balance_is_truth: false;
  product_write_authority: false;
}

export interface ProjectConstellationLayoutPosition {
  x: number;
  y: number;
  z: number;
  coordinate_authority: ProjectConstellationCoordinateAuthority;
  reason_codes: ProjectConstellationReasonCode[];
}

export interface ProjectConstellationLayoutNode {
  node_version: ProjectConstellationLayoutNodeVersion;
  scope: ProjectConstellationRuntimeLayoutScope;
  node_id: string;
  node_ref: string;
  node_kind: ProjectConstellationNodeKind;
  layer: ProjectConstellationLayoutLayer;
  bounded_label: string;
  bounded_summary: string;
  position: ProjectConstellationLayoutPosition;
  source_refs: string[];
  candidate_refs: string[];
  review_record_refs: string[];
  promotion_decision_refs: string[];
  formation_receipt_refs: string[];
  apply_event_refs: string[];
  feedback_refs: string[];
  marker_refs: string[];
  public_safe: boolean;
  reason_codes: ProjectConstellationReasonCode[];
  authority_boundary: ProjectConstellationRuntimeLayoutAuthorityBoundary;
}

export interface ProjectConstellationLayoutEdge {
  edge_version: ProjectConstellationLayoutEdgeVersion;
  scope: ProjectConstellationRuntimeLayoutScope;
  edge_id: string;
  edge_ref: string;
  edge_kind: ProjectConstellationEdgeKind;
  from_node_ref: string;
  to_node_ref: string;
  bounded_label: string;
  bounded_summary: string;
  source_refs: string[];
  reason_codes: ProjectConstellationReasonCode[];
  authority_boundary: ProjectConstellationRuntimeLayoutAuthorityBoundary;
}

export interface ProjectConstellationManualAnchor {
  anchor_version: ProjectConstellationManualAnchorVersion;
  scope: ProjectConstellationRuntimeLayoutScope;
  anchor_id: string;
  node_ref: string;
  anchor_position: ProjectConstellationLayoutPosition;
  anchor_reason: string;
  created_by_ref: string;
  applies_to_layout_scope: string;
  display_hint_only: true;
  persistence_now: false;
  authority_boundary: ProjectConstellationRuntimeLayoutAuthorityBoundary;
  reason_codes: ProjectConstellationReasonCode[];
}

export interface ProjectConstellationLayoutMarker {
  marker_id: string;
  marker_kind: ProjectConstellationMarkerKind;
  marker_ref: string;
  node_refs: string[];
  edge_refs: string[];
  bounded_label: string;
  bounded_summary: string;
  display_warning_only: boolean;
  review_aid_only: boolean;
  reason_codes: ProjectConstellationReasonCode[];
}

export interface ProjectConstellationLayoutDiagnostic {
  diagnostic_version: ProjectConstellationLayoutDiagnosticVersion;
  scope: ProjectConstellationRuntimeLayoutScope;
  diagnostic_id: string;
  diagnostic_kind: ProjectConstellationDiagnosticKind;
  bounded_summary: string;
  affected_node_refs: string[];
  affected_edge_refs: string[];
  reason_codes: ProjectConstellationReasonCode[];
  authority_boundary: ProjectConstellationRuntimeLayoutAuthorityBoundary;
}

export interface ProjectConstellationRuntimeLayoutContract {
  layout_version: ProjectConstellationLayoutVersion;
  contract_version: ProjectConstellationRuntimeLayoutContractVersion;
  scope: ProjectConstellationRuntimeLayoutScope;
  status: ProjectConstellationLayoutStatus;
  layout_id: string;
  perspective_id: string;
  as_of_state_version: string;
  trajectory_ref: string;
  candidate_overlay_ref: string;
  layout_seed: string;
  node_positions: ProjectConstellationLayoutNode[];
  edge_routes: ProjectConstellationLayoutEdge[];
  manual_anchors: ProjectConstellationManualAnchor[];
  temporal_smoothing_state: {
    smoothing_ref: string;
    display_continuity_only: true;
    persistence_now: false;
    reason_codes: ProjectConstellationReasonCode[];
  };
  stale_markers: ProjectConstellationLayoutMarker[];
  tension_markers: ProjectConstellationLayoutMarker[];
  gap_markers: ProjectConstellationLayoutMarker[];
  bridge_node_markers: ProjectConstellationLayoutMarker[];
  source_balance_diagnostics: ProjectConstellationLayoutDiagnostic[];
  boundary_notes: string[];
  reason_codes: ProjectConstellationReasonCode[];
  authority_boundary: ProjectConstellationRuntimeLayoutAuthorityBoundary;
  layout_fingerprint: string;
}

export interface ProjectConstellationRuntimeLayoutBundle {
  bundle_version: ProjectConstellationRuntimeLayoutBundleVersion;
  contract_version: ProjectConstellationRuntimeLayoutContractVersion;
  scope: ProjectConstellationRuntimeLayoutScope;
  status: ProjectConstellationRuntimeLayoutContractStatus;
  as_of: string;
  roadmap_ref: "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
  source_fixture_refs: string[];
  layouts: ProjectConstellationRuntimeLayoutContract[];
  node_kind_counts: Record<ProjectConstellationNodeKind, number>;
  edge_kind_counts: Record<ProjectConstellationEdgeKind, number>;
  layer_counts: Record<ProjectConstellationLayoutLayer, number>;
  marker_kind_counts: Record<ProjectConstellationMarkerKind, number>;
  diagnostic_kind_counts: Record<ProjectConstellationDiagnosticKind, number>;
  coordinate_authority_counts: Record<ProjectConstellationCoordinateAuthority, number>;
  boundary_notes: string[];
  reason_codes: ProjectConstellationReasonCode[];
  authority_boundary: ProjectConstellationRuntimeLayoutAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface ProjectConstellationRuntimeLayoutValidationResult {
  passed: boolean;
  failure_codes: string[];
}

// Legacy type-only compatibility for earlier Project Constellation preview
// helpers that still compile against this contract file. These names remain
// type-only and do not grant runtime layout, route, UI, persistence, DB,
// provider, retrieval/RAG, proof/evidence, Git Ledger, or product-write
// authority.
export type ProjectConstellationRuntimeLayoutContractKind =
  "project_constellation_runtime_layout_contract";

export type ProjectConstellationLayoutInputField =
  | "layout_scope_ref"
  | "perspective_snapshot_ref"
  | "durable_perspective_state_ref"
  | "candidate_overlay_ref"
  | "geometry_digest_ref"
  | "source_refs"
  | "manual_anchor_refs"
  | "salience_state_ref"
  | "prior_layout_ref"
  | "operator_context_ref";

export type ProjectConstellationLayoutOutputField =
  | "layout_id"
  | "layout_version"
  | "nodes"
  | "edges"
  | "clusters"
  | "markers"
  | "evidence_rays"
  | "viewport_hints"
  | "source_balance_summary"
  | "stability_policy"
  | "authority_boundary"
  | "validation_policy";

export type ProjectConstellationStateBoundary =
  | "durable"
  | "candidate"
  | "marker"
  | "source"
  | "work_context";

export interface ProjectConstellationRuntimeLayoutContractScope {
  project_constellation_layout_contract_only: true;
  runtime_layout_execution_now: false;
  seeded_layout_runtime_now: false;
  force_directed_layout_runtime_now: false;
  temporal_smoothing_runtime_now: false;
  layout_persistence_now: false;
  layout_coordinate_write_now: false;
  graph_db_now: false;
  graph_mutation_now: false;
  durable_perspective_state_read_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_now: false;
  trajectory_runtime_build_now: false;
  proof_evidence_write_now: false;
  accepted_evidence_write_now: false;
  formation_receipt_write_now: false;
  work_mutation_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  schema_migration_now: false;
  route_ui_now: false;
  browser_request_now: false;
  provider_openai_call_now: false;
  retrieval_rag_execution_now: false;
  source_fetch_now: false;
  crawler_now: false;
  product_write_now: false;
}

export interface ProjectConstellationLayoutPrinciples {
  layout_is_interface_not_truth: true;
  coordinates_are_display_hints_not_truth: true;
  coordinates_not_source_of_truth: true;
  stable_across_refreshes_required_later: true;
  deterministic_seeded_layout_required_later: true;
  manual_anchors_are_hints_only: true;
  temporal_smoothing_is_display_continuity_only: true;
  source_balance_required: true;
  candidate_overlay_and_durable_graph_distinct: true;
  stale_high_gravity_nodes_marked: true;
  bridge_nodes_visible: true;
  tension_markers_visible: true;
  knowledge_gap_markers_visible: true;
  evidence_rays_are_refs_not_proof: true;
  salience_state_not_authority: true;
  perspective_snapshot_is_derived_view: true;
  agent_substrate_advisory_only: true;
}

export interface ProjectConstellationNodeFamily {
  node_kind: ProjectConstellationNodeKind;
  durable_state_ref_required?: true;
  candidate_only?: boolean;
  source_refs_required?: true;
  coordinate_truth_forbidden: true;
  runtime_write_now: false;
  candidate_ref_required?: true;
  durable_state_ref_forbidden?: true;
  visually_distinct_from_durable?: true;
  claim_ref_required?: true;
  supporting_or_contradicting_evidence_refs_required?: true;
  evidence_ref_required?: true;
  evidence_ref_is_ref_not_raw_body?: true;
  proof_write_now?: false;
  tension_ref_required?: true;
  tension_visible?: true;
  resolution_not_implied_by_layout?: true;
  knowledge_gap_ref_required?: true;
  gap_visible?: true;
  closure_not_implied_by_layout?: true;
  bridge_reason_required?: true;
  bridge_is_navigation_hint_not_truth?: true;
  stale_reason_required?: true;
  manual_gravity_hint_allowed?: true;
  stale_marker_visible?: true;
  source_ref_required?: true;
  raw_source_body_forbidden?: true;
  work_ref_required?: true;
  work_mutation_now?: false;
}

export interface ProjectConstellationEdgeFamily {
  edge_kind: ProjectConstellationEdgeKind;
  source_ref_backed?: true;
  proof_write_now?: false;
  runtime_write_now: false;
  contradicted_evidence_preserved?: true;
  tension_or_gap_visible?: true;
  source_ref_required?: true;
  raw_source_body_forbidden?: true;
  candidate_only?: true;
  durable_graph_mutation_now?: false;
  bridge_reason_required?: true;
  navigation_hint_only?: true;
  tension_ref_required?: true;
  tension_visible?: true;
  resolution_not_implied?: true;
  knowledge_gap_ref_required?: true;
  gap_visible?: true;
  closure_not_implied?: true;
  reuse_condition_ref_required?: true;
  display_context_only?: true;
  work_ref_required?: true;
  work_mutation_now?: false;
}

export interface ProjectConstellationStabilityPolicy {
  deterministic_seed_required_later: true;
  stable_across_refreshes_required_later: true;
  temporal_smoothing_allowed_later: true;
  temporal_smoothing_runtime_now: false;
  manual_anchor_hints_allowed_later: true;
  manual_anchor_hints_not_authority: true;
  layout_persistence_now: false;
  coordinate_truth_forbidden: true;
}

export interface ProjectConstellationSourceBalancePolicy {
  source_balance_required: true;
  source_dominance_warning_allowed: true;
  source_dominance_warning_advisory_only: true;
  source_balance_not_truth: true;
  source_balance_not_promotion_authority: true;
}

export interface ProjectConstellationCandidateOverlayPolicy {
  candidate_overlay_allowed_later: true;
  candidate_overlay_is_not_durable_graph: true;
  candidate_overlay_nodes_visually_distinct: true;
  candidate_overlay_edges_visually_distinct: true;
  candidate_overlay_runtime_merge_now: false;
  candidate_overlay_promotion_now: false;
}

export interface ProjectConstellationSnapshotPolicy {
  perspective_snapshot_input_allowed: true;
  perspective_snapshot_is_derived_view: true;
  perspective_snapshot_runtime_now: false;
  snapshot_not_independent_source_of_truth: true;
}

export interface ProjectConstellationSaliencePolicy {
  salience_state_allowed_as_display_context: true;
  salience_state_not_truth: true;
  salience_state_not_promotion_authority: true;
  salience_state_not_evidence_strength: true;
  durable_salience_write_now: false;
}

export interface ProjectConstellationRuntimeLayoutValidationPolicy {
  layout_is_interface_not_truth: true;
  coordinates_are_display_hints_not_truth: true;
  coordinates_not_source_of_truth: true;
  stable_across_refreshes_required_later: true;
  deterministic_seeded_layout_required_later: true;
  manual_anchors_are_hints_only: true;
  temporal_smoothing_is_display_continuity_only: true;
  source_balance_required: true;
  candidate_overlay_and_durable_graph_distinct: true;
  candidate_overlay_not_durable_graph: true;
  candidate_overlay_promotion_now_false: true;
  stale_high_gravity_nodes_marked: true;
  bridge_nodes_visible: true;
  tension_markers_visible: true;
  knowledge_gap_markers_visible: true;
  evidence_rays_are_refs_not_proof: true;
  all_nodes_have_public_safe_refs: true;
  all_edges_have_public_safe_refs: true;
  raw_coordinates_not_used_as_truth: true;
  source_balance_not_truth: true;
  source_balance_not_promotion_authority: true;
  salience_state_not_authority: true;
  manual_anchor_not_authority: true;
  cluster_position_not_authority: true;
  perspective_snapshot_is_derived_view: true;
  no_runtime_layout_execution: true;
  no_seeded_layout_runtime: true;
  no_force_directed_layout_runtime: true;
  no_temporal_smoothing_runtime: true;
  no_layout_persistence: true;
  no_graph_db: true;
  no_graph_mutation: true;
  no_runtime_state_read_or_write: true;
  no_durable_perspective_delta_apply: true;
  no_perspective_snapshot_runtime: true;
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

export interface ProjectConstellationRuntimeLayoutPrivacyPolicy {
  no_secrets_in_fixture: true;
  no_private_urls: true;
  no_raw_provider_thread_run_session_ids: true;
  no_raw_source_body: true;
  public_safe_layout_refs_only: true;
  public_safe_node_refs_only: true;
  public_safe_edge_refs_only: true;
  public_safe_cluster_refs_only: true;
  public_safe_marker_refs_only: true;
  public_safe_source_refs_only: true;
  public_safe_perspective_refs_only: true;
  public_safe_candidate_refs_only: true;
  public_safe_evidence_refs_only: true;
  public_safe_tension_refs_only: true;
  public_safe_knowledge_gap_refs_only: true;
  public_safe_work_refs_only: true;
}

export interface ProjectConstellationRuntimeLayoutPositionHint {
  coordinate_system: "normalized_preview_2d";
  x: number;
  y: number;
  coordinates_are_display_hints_not_truth: true;
  not_source_of_truth: true;
}

export interface ProjectConstellationRuntimeLayoutNodePreview {
  node_ref: string;
  node_kind: ProjectConstellationNodeKind;
  label_summary: string;
  source_refs: string[];
  state_boundary: ProjectConstellationStateBoundary;
  position_hint: ProjectConstellationRuntimeLayoutPositionHint;
  runtime_write_now: false;
  public_safe: true;
  candidate_only?: boolean;
  visually_distinct_from_durable?: true;
  durable_state_ref?: string;
  candidate_ref?: string;
  claim_ref?: string;
  evidence_ref?: string;
  tension_ref?: string;
  knowledge_gap_ref?: string;
  bridge_reason?: string;
  stale_reason?: string;
  source_ref?: string;
  work_ref?: string;
}

export interface ProjectConstellationRuntimeLayoutEdgePreview {
  edge_ref: string;
  edge_kind: ProjectConstellationEdgeKind;
  from_node_ref: string;
  to_node_ref: string;
  source_refs: string[];
  relation_summary: string;
  runtime_write_now: false;
  public_safe: true;
}

export interface ProjectConstellationRuntimeLayoutPreview {
  layout_id: string;
  layout_version: ProjectConstellationLayoutVersion;
  nodes: ProjectConstellationRuntimeLayoutNodePreview[];
  edges: ProjectConstellationRuntimeLayoutEdgePreview[];
  clusters: Array<{
    cluster_ref: string;
    cluster_kind: string;
    node_refs: string[];
    source_refs: string[];
    cluster_is_display_grouping_only: true;
    coordinates_not_truth: true;
    runtime_write_now: false;
  }>;
  markers: {
    stale_high_gravity_nodes: Array<{
      node_ref: string;
      stale_reason: string;
      marker_visible: true;
      not_authority: true;
    }>;
    bridge_nodes: Array<{
      node_ref: string;
      bridge_reason: string;
      navigation_hint_only: true;
    }>;
    tension_markers: Array<{
      tension_ref: string;
      visible: true;
      resolution_not_implied_by_layout: true;
    }>;
    knowledge_gap_markers: Array<{
      knowledge_gap_ref: string;
      visible: true;
      closure_not_implied_by_layout: true;
    }>;
  };
  evidence_rays: Array<{
    evidence_ray_ref: string;
    from_evidence_node_ref: string;
    to_claim_node_ref: string;
    evidence_ref: string;
    source_refs: string[];
    evidence_ray_is_ref_not_proof: true;
    proof_write_now: false;
  }>;
  viewport_hints: {
    default_center_ref: string;
    zoom_hint: string;
    viewport_hint_only: true;
    not_state: true;
  };
  source_balance_summary: {
    source_ref_count: number;
    source_balance_required: true;
    source_dominance_warning_advisory_only: true;
    not_truth: true;
  };
  all_nodes_public_safe: true;
  all_edges_public_safe: true;
  all_coordinates_not_truth: true;
  all_runtime_write_now_false: true;
}

export interface ProjectConstellationRuntimeLayoutPreviewAuthorityBoundary {
  implementation_added_now: false;
  browser_validation_added_now: false;
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
  durable_perspective_state_read_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_implemented_now: false;
  trajectory_runtime_build_implemented_now: false;
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
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface ProjectConstellationRuntimeLayoutContract {
  contract_kind: ProjectConstellationRuntimeLayoutContractKind;
  source_state_trajectory_validation_ref: string;
  source_state_trajectory_validation_fingerprint: string;
  contract_scope: ProjectConstellationRuntimeLayoutContractScope;
  layout_principles: ProjectConstellationLayoutPrinciples;
  layout_input_fields: ProjectConstellationLayoutInputField[];
  layout_output_fields: ProjectConstellationLayoutOutputField[];
  node_families: ProjectConstellationNodeFamily[];
  edge_families: ProjectConstellationEdgeFamily[];
  stability_policy: ProjectConstellationStabilityPolicy;
  source_balance_policy: ProjectConstellationSourceBalancePolicy;
  candidate_overlay_policy: ProjectConstellationCandidateOverlayPolicy;
  snapshot_policy: ProjectConstellationSnapshotPolicy;
  salience_policy: ProjectConstellationSaliencePolicy;
  sample_project_constellation_layout_preview: {
    preview_version: "project_constellation_runtime_layout_preview.v0.1";
    operator_context_ref: string;
    layout_input_preview: Record<string, unknown>;
    layout_preview: ProjectConstellationRuntimeLayoutPreview;
    authority_boundary: ProjectConstellationRuntimeLayoutPreviewAuthorityBoundary;
    validation_policy: ProjectConstellationRuntimeLayoutValidationPolicy;
  };
  validation_policy: ProjectConstellationRuntimeLayoutValidationPolicy;
  privacy_policy: ProjectConstellationRuntimeLayoutPrivacyPolicy;
  recommendation_status:
    "ready_for_project_constellation_runtime_layout_implementation_v0_1";
  next_recommended_slice:
    "project_constellation_runtime_layout_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
