// Agent Perspective Substrate v0.1 is a type-only advisory contract.
// It is not source of truth, proof/evidence, durable Perspective state,
// execution authority, agent routing, retrieval execution, or product write.

export type AgentPerspectiveSubstrateVersion =
  "agent_perspective_substrate.v0.1";

export type AgentPerspectiveSubstrateRuleName =
  | "source_refs_missing_blocks_grounded_claim"
  | "evidence_missing_blocks_perspective_delta_promotion"
  | "unresolved_tension_missing_from_handoff_warns"
  | "local_constraint_globalized_warns_scope_overreach"
  | "forbidden_action_missing_from_handoff_warns"
  | "repeated_dismissed_warning_without_new_source_downgrades"
  | "stale_high_gravity_node_warns_context_distortion"
  | "retrieval_hint_without_execution_only"
  | "coordinates_as_truth_forbidden"
  | "product_write_lane_parked";

export type AgentPerspectiveSurfacingType =
  | "unresolved_tension_warning"
  | "grounded_claim_boundary_blocker"
  | "handoff_improvement_suggestion"
  | "stale_context_notice"
  | "retrieval_hint"
  | "product_write_stopline_reminder"
  | "scope_overreach_warning"
  | "coordinates_as_truth_blocker";

export interface AgentPerspectiveSubstrateInput {
  perspective_geometry_digest_refs: string[];
  research_candidate_review_refs: string[];
  constellation_overlay_refs: string[];
  ai_context_packet_refs: string[];
  formation_receipt_refs: string[];
}

export interface AgentPerspectiveSourceRef {
  source_ref_id: string;
}

export interface AgentPerspectiveSourceSnapshotRef {
  snapshot_version: string;
  scope: string;
  as_of: string;
  source_refs: AgentPerspectiveSourceRef[];
}

export interface AgentPerspectiveNode {
  substrate_node_id: string;
  node_kind:
    | "geometry_cluster"
    | "bridge_node"
    | "unresolved_tension"
    | "knowledge_gap"
    | "perspective_delta"
    | "handoff_constraint"
    | "stale_context"
    | "source_ref"
    | "retrieval_hint"
    | "product_write_stopline";
  label: string;
  summary: string;
  source_refs: AgentPerspectiveSourceRef[];
  epistemic_status: string;
  review_status: string;
  derived_from: string[];
  authority_boundary_notes: string[];
}

export interface AgentPerspectiveEdge {
  substrate_edge_id: string;
  edge_kind:
    | "derived_from"
    | "warns_about"
    | "connects_to"
    | "qualifies"
    | "preserves_tension"
    | "blocks_promotion"
    | "suggests_handoff_improvement"
    | "references_stopline";
  source_node_id: string;
  target_node_id: string;
  source_refs: AgentPerspectiveSourceRef[];
  authority_boundary_notes: string[];
}

export interface AgentPerspectiveRuleFire {
  rule_fire_id: string;
  rule_name: AgentPerspectiveSubstrateRuleName;
  severity: "info" | "notice" | "warning" | "blocker";
  source_node_ids: string[];
  message: string;
  why_now: string;
  source_refs: AgentPerspectiveSourceRef[];
  authority_boundary_notes: string[];
}

export interface AgentPerspectiveSurfacingCandidate {
  surfacing_candidate_id: string;
  substrate_node_ids: string[];
  substrate_edge_ids: string[];
  rule_fire_ids: string[];
  surface_type: AgentPerspectiveSurfacingType;
  title: string;
  message: string;
  severity: "info" | "notice" | "warning" | "blocker";
  confidence: number;
  impact: "low" | "medium" | "high" | "critical";
  epistemic_status: string;
  review_status: string;
  why_now: string;
  source_refs: AgentPerspectiveSourceRef[];
  suggested_user_actions: Array<
    | "inspect"
    | "dismiss_preview"
    | "pin_preview"
    | "downgrade_preview"
    | "invalidate_preview"
    | "add_to_capsule_preview"
    | "exclude_from_capsule_preview"
  >;
  may_interrupt_user: boolean;
  authority_boundary_notes: string[];
  execution_authority: false;
  durable_write_authority: false;
  retrieval_executed_now?: false;
}

export interface AgentPerspectiveAuthorityBoundary {
  derived_view_only: true;
  source_of_truth: false;
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
  advisory_only: true;
}

export interface AgentPerspectiveDiagnostics {
  graph_density: number;
  unresolved_high_impact_tension_count: number;
  stale_belief_count: number;
  source_ref_coverage_ratio: number;
  invalidated_belief_reuse_count: number;
  surfacing_candidate_count: number;
  blocker_count: number;
  warning_count: number;
  source_refs_missing_count: number;
  product_write_stopline_respected: true;
  geometry_digest_consumed_as_advisory: true;
}

export interface AgentPerspectiveValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface AgentPerspectiveSubstrateSnapshot {
  runtime: "augnes";
  substrate_version: AgentPerspectiveSubstrateVersion;
  scope: string;
  as_of: string;
  source_snapshot_ref: AgentPerspectiveSourceSnapshotRef;
  source_inputs: AgentPerspectiveSubstrateInput;
  nodes: AgentPerspectiveNode[];
  edges: AgentPerspectiveEdge[];
  rules_fired: AgentPerspectiveRuleFire[];
  surfacing_candidates: AgentPerspectiveSurfacingCandidate[];
  authority_boundaries: AgentPerspectiveAuthorityBoundary;
  diagnostics: AgentPerspectiveDiagnostics;
  validation: AgentPerspectiveValidationResult;
  next_recommended_slice: "agent_perspective_substrate_preview_builder_v0_1";
}
