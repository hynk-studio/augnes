import type {
  PerspectiveIngestConstellationCluster,
  PerspectiveIngestConstellationEdge,
  PerspectiveIngestConstellationNode,
  PerspectiveIngestConstellationPreviewResponse,
  PerspectiveIngestEvidencePointer,
  PerspectiveIngestNextActionCandidate,
  PerspectiveIngestUnresolvedTension,
} from "@/types/perspective-ingest-constellation-preview";

export type FormationBasisV0 =
  | "current"
  | "manual_selection"
  | "auto_proposal"
  | "historical_snapshot"
  | "experimental";

export type PerspectiveConstellationViewModeV0 = "single" | "compare";

export type FormationActorTypeV0 =
  | "augnes_builder"
  | "user"
  | "model"
  | "historical_archive"
  | "hybrid";

export type PerspectiveConstellationSelectionScopeV0 =
  | "whole_constellation"
  | "connected_node"
  | "cluster"
  | "manual_selection";

export interface FormationActorV0 {
  actor_type: FormationActorTypeV0;
  label: string;
  actor_ref?: string;
}

export interface FormationAuthorityV0 {
  read_only: boolean;
  proposal_only: boolean;
  cached: boolean;
  external_calls: boolean;
  api_billable: boolean;
  persistence: boolean;
  graph_db_write: boolean;
  proof_evidence_write: boolean;
  codex_execution: boolean;
}

export interface FormationPreviewOverridesV0 {
  pinned_node_ids: string[];
  hidden_node_ids: string[];
  manual_cluster_ids: string[];
}

export interface FormationAttributionV0 {
  subject_id: string;
  source_refs: string[];
  source_episode_ids: string[];
  evidence_pointer_ids: string[];
  criteria: string[];
}

export interface FormationReceiptV0 {
  formation_id: string;
  constellation_id: string;
  formation_basis: FormationBasisV0;
  view_mode: PerspectiveConstellationViewModeV0;
  formed_by: FormationActorV0;
  source_refs: PerspectiveIngestConstellationPreviewResponse["source_refs"];
  generated_at: string;
  as_of: string;
  criteria_summary: string[];
  authority: FormationAuthorityV0;
  preview_overrides: FormationPreviewOverridesV0;
  node_attributions: Record<string, FormationAttributionV0>;
  edge_attributions: Record<string, FormationAttributionV0>;
}

export interface PerspectiveUnitPreview {
  preview_id: string;
  scope: PerspectiveConstellationSelectionScopeV0;
  scope_label: string;
  selection_title: string;
  selection_type: string;
  selection_summary: string;
  selected_node_ids: string[];
  selected_node_labels: string[];
  selected_edge_ids: string[];
  evidence_pointers: PerspectiveIngestEvidencePointer[];
  unresolved_tensions: PerspectiveIngestUnresolvedTension[];
  next_action_candidates: PerspectiveIngestNextActionCandidate[];
  chatgpt_review_packet_text: string;
  codex_handoff_packet_text: string;
  formation_receipt: FormationReceiptV0;
  local_boundary_notes: string[];
}

export type PerspectiveUnitPreviewConstellation =
  PerspectiveIngestConstellationPreviewResponse["constellation"];

export type PerspectiveUnitPreviewGraphMaterial =
  | PerspectiveIngestConstellationNode
  | PerspectiveIngestConstellationEdge
  | PerspectiveIngestConstellationCluster;
