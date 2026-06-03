/**
 * type-only response shape boundary for future read-only Augnes API route
 * planning.
 *
 * These types are not runtime schema, not API route implementation, not DB
 * schema, not MCP/App tool contract, not proof/evidence write authority, and
 * not source-of-truth. They add no auth implementation, no external calls, and
 * no runtime execution.
 * Boundary phrases: not runtime schema; not API route implementation; not DB schema.
 * Boundary phrases: not MCP/App tool contract; not proof/evidence write authority.
 * Boundary phrases: not source-of-truth; no auth implementation; no external calls; no runtime execution.
 *
 * Required response envelope concepts include meta, source_refs, generated_at,
 * route_family, workspace_scope, project_scope, whole_perspective,
 * project_constellation, perspective_capsule_preview, copyable_handoff_preview,
 * boundary_next_review, evidence_pointers, unresolved_tensions,
 * next_action_candidates, forbidden_fields_removed, and authority_boundary.
 */

export interface ReadonlyApiRouteResponseEnvelopeV0 {
  response_version: "readonly_api_route_response.v0.1";
  meta: ReadonlyApiRouteResponseMeta;
  source_refs: ReadonlyApiRouteSourceRef[];
  whole_perspective?: ReadonlyApiRouteWholePerspectiveSummary;
  project_constellation?: ReadonlyApiRouteProjectConstellationReadModel;
  perspective_capsule_preview?: ReadonlyApiRoutePerspectiveCapsulePreview;
  copyable_handoff_preview?: ReadonlyApiRouteCopyableHandoffPreview;
  boundary_next_review?: ReadonlyApiRouteBoundaryNextReview;
  evidence_pointers: ReadonlyApiRouteEvidencePointer[];
  unresolved_tensions: ReadonlyApiRouteUnresolvedTension[];
  next_action_candidates: ReadonlyApiRouteNextActionCandidate[];
  forbidden_fields_removed: ReadonlyApiRouteForbiddenField[];
  authority_boundary: string[];
}

export interface ReadonlyApiRouteResponseMeta {
  generated_at: string;
  route_family:
    | "whole_perspective"
    | "project_constellation"
    | "perspective_capsule"
    | "copyable_handoff"
    | "boundary_next_review";
  workspace_scope: string;
  project_scope: string;
  request_scope_ref?: string;
  response_shape_boundary: "type_only";
  runtime_schema: false;
  api_route_implementation: false;
  auth_implementation: false;
  external_calls: false;
  source_of_truth: false;
}

export interface ReadonlyApiRouteSourceRef {
  source_ref: string;
  source_kind:
    | "augnes_record"
    | "static_fixture"
    | "document_pointer"
    | "evidence_pointer"
    | "capsule_pointer";
  source_label: string;
  source_scope: string;
  provenance_note: string;
}

export interface ReadonlyApiRouteWholePerspectiveSummary {
  perspective_id: string;
  title: string;
  summary: string;
  source_refs: string[];
  evidence_pointers: ReadonlyApiRouteEvidencePointer[];
  unresolved_tensions: ReadonlyApiRouteUnresolvedTension[];
  next_action_candidates: ReadonlyApiRouteNextActionCandidate[];
  authority_boundary: string[];
}

export interface ReadonlyApiRouteProjectConstellationReadModel {
  constellation_id: string;
  thesis: string;
  nodes: ReadonlyApiRouteConstellationNode[];
  edges: ReadonlyApiRouteConstellationEdge[];
  clusters: ReadonlyApiRouteConstellationCluster[];
  evidence_pointers: ReadonlyApiRouteEvidencePointer[];
  unresolved_tensions: ReadonlyApiRouteUnresolvedTension[];
  next_action_candidates: ReadonlyApiRouteNextActionCandidate[];
  authority_boundary: string[];
}

export interface ReadonlyApiRouteConstellationNode {
  id: string;
  type: string;
  label: string;
  summary: string;
  source_refs: string[];
  evidence_pointers: ReadonlyApiRouteEvidencePointer[];
  unresolved_tensions: ReadonlyApiRouteUnresolvedTension[];
  next_action_candidates: ReadonlyApiRouteNextActionCandidate[];
}

export interface ReadonlyApiRouteConstellationEdge {
  id: string;
  type: string;
  source: string;
  target: string;
  summary: string;
  source_refs: string[];
  evidence_pointers: ReadonlyApiRouteEvidencePointer[];
}

export interface ReadonlyApiRouteConstellationCluster {
  id: string;
  label: string;
  node_ids: string[];
  edge_ids: string[];
  cluster_thesis: string;
  unresolved_tensions: ReadonlyApiRouteUnresolvedTension[];
  next_action_candidates: ReadonlyApiRouteNextActionCandidate[];
}

export interface ReadonlyApiRouteEvidencePointer {
  pointer_id: string;
  label: string;
  target_ref: string;
  pointer_kind: "evidence_pointer" | "proof_pointer" | "readiness_pointer";
  pointer_semantics: "pointer_only";
  bounded_summary?: string;
  proof_evidence_write_authority: false;
  readiness_write_authority: false;
}

export interface ReadonlyApiRouteUnresolvedTension {
  tension_id: string;
  label: string;
  summary: string;
  source_refs: string[];
  evidence_pointers: ReadonlyApiRouteEvidencePointer[];
}

export interface ReadonlyApiRouteNextActionCandidate {
  candidate_id: string;
  label: string;
  summary: string;
  source_refs: string[];
  blocked_by?: string[];
  authority_boundary: string[];
}

export interface ReadonlyApiRoutePerspectiveCapsulePreview {
  capsule_id: string;
  thesis: string;
  source_refs: string[];
  selected_nodes: string[];
  selected_edges: string[];
  evidence_pointers: ReadonlyApiRouteEvidencePointer[];
  unresolved_tensions: ReadonlyApiRouteUnresolvedTension[];
  next_action_candidates: ReadonlyApiRouteNextActionCandidate[];
  authority_boundary: string[];
}

export interface ReadonlyApiRouteCopyableHandoffPreview {
  handoff_id: string;
  target_surface: "codex_handoff" | "chatgpt_review" | "manual_review";
  handoff_text: string;
  source_refs: string[];
  required_checks: string[];
  skipped_check_policy: string;
  final_report_requirements: string[];
  authority_boundary: string[];
}

export interface ReadonlyApiRouteBoundaryNextReview {
  review_id: string;
  boundary_summary: string;
  skipped_checks: string[];
  blockers_or_risks: string[];
  assumptions: string[];
  questions_requiring_user_pm_judgment: string[];
  next_suggested_goal: string;
  authority_boundary: string[];
}

export type ReadonlyApiRouteForbiddenField =
  | "secrets"
  | "credentials/auth/env"
  | "hidden reasoning / chain-of-thought"
  | "raw DB rows"
  | "proof/evidence write handles"
  | "mutation URLs"
  | "approval/publish/merge controls"
  | "Codex SDK execution handles"
  | "provider credentials";
