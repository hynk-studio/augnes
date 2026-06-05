/**
 * Dedicated response shape for the local-only Perspective ingest constellation
 * preview.
 *
 * This is read-only display and handoff material. It is not persistence, not a
 * graph DB, not proof/evidence/readiness write authority, not Codex execution
 * authority, and not approval/publish/merge/deploy authority.
 */

export type PerspectiveIngestSourceKind =
  | "chatgpt_record_fixture"
  | "codex_record_fixture";

export interface PerspectiveIngestSessionEpisode {
  episode_id: string;
  source_kind: PerspectiveIngestSourceKind;
  source_ref: string;
  source_label: string;
  title: string;
  summary: string;
  synthetic_timestamp: string;
  actors: string[];
  public_safety: {
    synthetic: true;
    public_safe: true;
    sample_fixture_only: true;
    not_raw_private_history: true;
    no_credentials_or_secrets: true;
    no_proof_evidence_readiness_write: true;
    no_external_call: true;
    no_codex_execution_authority: true;
    boundary_notes: string[];
  };
  user_intents: string[];
  product_concepts: string[];
  decisions: string[];
  work_units: string[];
  changed_files: string[];
  validations: string[];
  final_report_points: string[];
  evidence_refs: string[];
  unresolved_tensions: string[];
  next_actions: string[];
}

export type PerspectiveIngestConstellationEdgeType =
  | "supports"
  | "evidence_for"
  | "derived_from"
  | "depends_on"
  | "refines"
  | "validates"
  | "conflicts_with"
  | "warns_against"
  | "next_candidate"
  | "belongs_to";

export interface PerspectiveIngestConstellationNode {
  id: string;
  type: string;
  label: string;
  summary: string;
  source_episode_ids: string[];
  source_refs: string[];
  evidence_pointer_ids: string[];
  unresolved_tension_ids: string[];
  next_action_candidate_ids: string[];
}

export interface PerspectiveIngestConstellationEdge {
  id: string;
  type: PerspectiveIngestConstellationEdgeType;
  source: string;
  target: string;
  summary: string;
  source_episode_ids: string[];
  evidence_pointer_ids: string[];
}

export interface PerspectiveIngestConstellationCluster {
  id: string;
  label: string;
  node_ids: string[];
  edge_ids: string[];
  cluster_thesis: string;
  evidence_pointer_ids: string[];
  unresolved_tension_ids: string[];
  next_action_candidate_ids: string[];
}

export interface PerspectiveIngestEvidencePointer {
  pointer_id: string;
  label: string;
  target_ref: string;
  pointer_kind: "fixture_pointer" | "document_pointer" | "validation_pointer";
  pointer_semantics: "pointer_only";
  bounded_summary: string;
  source_episode_ids: string[];
  proof_evidence_write_authority: false;
  readiness_write_authority: false;
}

export interface PerspectiveIngestUnresolvedTension {
  tension_id: string;
  label: string;
  summary: string;
  source_refs: string[];
  evidence_pointer_ids: string[];
  blocks_or_qualifies_next_actions: true;
}

export interface PerspectiveIngestNextActionCandidate {
  candidate_id: string;
  label: string;
  summary: string;
  source_refs: string[];
  blocked_by: string[];
  advisory_only: true;
  execution_authority: false;
}

export interface PerspectiveIngestPerspectiveCapsulePreview {
  capsule_id: string;
  capsule_version: "perspective_capsule_preview.v0.1";
  source_surface: "perspective_ingest_constellation_preview";
  source_scope: "project:augnes";
  source_snapshot_ref: string;
  source_constellation_ref: string;
  formation_mode: "fixture_episode_constellation";
  thesis: string;
  selected_nodes: string[];
  selected_edges: string[];
  evidence_pointers: string[];
  unresolved_tensions: string[];
  boundaries: string[];
  forbidden_actions: string[];
  next_action_candidates: string[];
  target_surface: "chatgpt_review" | "codex_handoff";
  chatgpt_rendering_notes: string[];
  codex_handoff_packet_summary: string;
}

export interface PerspectiveIngestChatGptRenderingPacket {
  packet_id: string;
  target_surface: "chatgpt_review";
  title: string;
  summary: string;
  packet_text: string;
  source_refs: string[];
  recommended_review_questions: string[];
  boundary_reminders: string[];
}

export interface PerspectiveIngestCodexHandoffPacket {
  packet_id: string;
  target_surface: "codex_handoff";
  repo: "hynk-studio/augnes";
  base_branch: "main";
  working_branch_suggestion: string;
  expected_pr_title: string;
  task_goal: string;
  context_anchors: string[];
  expected_changed_files: string[];
  hard_constraints: string[];
  required_checks: string[];
  pr_body_requirements: string[];
  final_report_requirements: string[];
  packet_text: string;
}

export interface PerspectiveIngestConstellationPreviewResponse {
  response_version: "perspective_ingest_constellation_preview.v0.1";
  boundary_class: "read_only_local_ingest_constellation_preview";
  meta: {
    generated_at: string;
    route_id: "augnes.read.perspective-ingest-constellation-preview.v0.1";
    route_family: "perspective_ingest_constellation";
    workspace_scope: "project:augnes";
    project_scope: "project:augnes";
    request_scope_ref: "project:augnes";
    source_query: "sample:chatgpt" | "sample:codex";
    deterministic_fixture_generation: true;
    local_only: true;
    read_only: true;
    external_calls: false;
    persistence: false;
    graph_db: false;
    proof_evidence_readiness_writes: false;
    codex_execution: false;
  };
  source_kind: PerspectiveIngestSourceKind;
  source_refs: {
    source_ref: string;
    source_kind: PerspectiveIngestSourceKind | "document_pointer";
    source_label: string;
    source_scope: "project:augnes";
    provenance_note: string;
  }[];
  ingest_batch: {
    batch_id: string;
    episode_count: number;
    episode_ids: string[];
    fixture_only: true;
    public_safe: true;
    deterministic: true;
    boundary_notes: string[];
  };
  constellation: {
    constellation_id: string;
    thesis: string;
    nodes: PerspectiveIngestConstellationNode[];
    edges: PerspectiveIngestConstellationEdge[];
    clusters: PerspectiveIngestConstellationCluster[];
  };
  perspective_capsule_preview: PerspectiveIngestPerspectiveCapsulePreview;
  chatgpt_rendering_packet: PerspectiveIngestChatGptRenderingPacket;
  codex_handoff_packet: PerspectiveIngestCodexHandoffPacket;
  evidence_pointers: PerspectiveIngestEvidencePointer[];
  unresolved_tensions: PerspectiveIngestUnresolvedTension[];
  next_action_candidates: PerspectiveIngestNextActionCandidate[];
}

export interface PerspectiveIngestConstellationPreviewErrorBody {
  response_version: "perspective_ingest_constellation_preview.v0.1";
  error: {
    code: string;
    status: number;
  };
  authority_boundary: string[];
}
