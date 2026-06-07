import {
  buildPerspectiveTemporalUnderlayProjection,
  type PerspectiveTemporalUnderlayProjection,
} from "@/lib/perspective-ingest/perspective-temporal-spatial-map";
import type {
  PerspectiveUnitPreview,
} from "@/types/perspective-constellation-formation";
import type {
  PerspectiveIngestConstellationEdge,
  PerspectiveIngestConstellationNode,
  PerspectiveIngestConstellationPreviewResponse,
  PerspectiveIngestNextActionCandidate,
  PerspectiveIngestUnresolvedTension,
} from "@/types/perspective-ingest-constellation-preview";

export interface BuildPerspectiveWorkbenchProjectionInput {
  preview: PerspectiveIngestConstellationPreviewResponse;
  unit_preview?: PerspectiveUnitPreview | null;
  selected_node_id?: string | null;
  scope_label?: string | null;
  tension_limit?: number;
  next_action_limit?: number;
}

export interface PerspectiveWorkbenchSelectedMaterialV0 {
  title: string;
  type: string;
  summary: string;
  node_ids: string[];
  edge_ids: string[];
}

export interface PerspectiveWorkbenchProjectionV0 {
  projection_version: "perspective_workbench_projection.v0.1";
  source: {
    query: string;
    kind: string;
    label: string;
  };
  status: {
    scope_label: string;
    selected_title: string;
    node_count: number;
    edge_count: number;
    tension_count: number;
    authority_label: "Local preview";
  };
  selected: PerspectiveWorkbenchSelectedMaterialV0;
  tensions: {
    id: string;
    summary: string;
  }[];
  next_actions: {
    id: string;
    summary: string;
  }[];
  actions: {
    copy_chatgpt_review_available: boolean;
    copy_codex_handoff_available: boolean;
    open_packet_preview_available: boolean;
  };
  temporal_underlay: Pick<
    PerspectiveTemporalUnderlayProjection,
    "primary_path" | "satellites" | "highlighted_item_ids"
  >;
  authority: {
    mode: "advisory_local_preview";
    external_calls: false;
    persistence: false;
    codex_execution: false;
  };
}

const DEFAULT_WORKBENCH_VISIBLE_LIMIT = 2;

export function buildPerspectiveWorkbenchProjection(
  input: BuildPerspectiveWorkbenchProjectionInput,
): PerspectiveWorkbenchProjectionV0 {
  const selected = getPerspectiveWorkbenchSelectedMaterial(input);
  const shouldHighlightSelection = Boolean(
    input.selected_node_id ||
      (input.unit_preview && input.unit_preview.scope !== "whole_constellation"),
  );
  const highlightedNodeIds = shouldHighlightSelection ? selected.node_ids : [];
  const temporalUnderlay = buildPerspectiveTemporalUnderlayProjection({
    nodes: input.preview.constellation.nodes,
    selected_node_ids: highlightedNodeIds,
  });

  return {
    projection_version: "perspective_workbench_projection.v0.1",
    source: {
      query: input.preview.meta.source_query,
      kind: input.preview.source_kind,
      label:
        input.preview.source_refs[0]?.source_label ??
        input.preview.ingest_batch.batch_id,
    },
    status: {
      scope_label:
        input.scope_label ?? input.unit_preview?.scope_label ?? "Whole Constellation",
      selected_title: selected.title,
      node_count: input.preview.constellation.nodes.length,
      edge_count: input.preview.constellation.edges.length,
      tension_count: input.preview.unresolved_tensions.length,
      authority_label: "Local preview",
    },
    selected,
    tensions: getPerspectiveWorkbenchVisibleTensions(input),
    next_actions: getPerspectiveWorkbenchVisibleNextActions(input),
    actions: {
      copy_chatgpt_review_available: Boolean(
        input.preview.chatgpt_rendering_packet.packet_id ||
          input.unit_preview?.chatgpt_review_packet_text,
      ),
      copy_codex_handoff_available: Boolean(
        input.preview.codex_handoff_packet.packet_id ||
          input.unit_preview?.codex_handoff_packet_text,
      ),
      open_packet_preview_available: Boolean(
        input.preview.chatgpt_rendering_packet.packet_id ||
          input.preview.codex_handoff_packet.packet_id,
      ),
    },
    temporal_underlay: {
      primary_path: temporalUnderlay.primary_path,
      satellites: temporalUnderlay.satellites,
      highlighted_item_ids: temporalUnderlay.highlighted_item_ids,
    },
    authority: {
      mode: "advisory_local_preview",
      external_calls: false,
      persistence: false,
      codex_execution: false,
    },
  };
}

export function getPerspectiveWorkbenchSelectedMaterial(
  input: BuildPerspectiveWorkbenchProjectionInput,
): PerspectiveWorkbenchSelectedMaterialV0 {
  if (input.unit_preview) {
    return {
      title: input.unit_preview.selection_title,
      type: input.unit_preview.selection_type,
      summary: input.unit_preview.selection_summary,
      node_ids: [...input.unit_preview.selected_node_ids],
      edge_ids: [...input.unit_preview.selected_edge_ids],
    };
  }

  const selectedNode = input.selected_node_id
    ? findPerspectiveNode(input.preview.constellation.nodes, input.selected_node_id)
    : null;

  if (selectedNode) {
    return {
      title: selectedNode.label,
      type: selectedNode.type,
      summary: selectedNode.summary,
      node_ids: [selectedNode.id],
      edge_ids: getConnectedPerspectiveEdgeIds(
        input.preview.constellation.edges,
        selectedNode.id,
      ),
    };
  }

  return {
    title: "Whole Constellation",
    type: "constellation",
    summary: input.preview.constellation.thesis,
    node_ids: input.preview.constellation.nodes.map((node) => node.id),
    edge_ids: input.preview.constellation.edges.map((edge) => edge.id),
  };
}

export function getPerspectiveWorkbenchVisibleTensions(
  input: BuildPerspectiveWorkbenchProjectionInput,
): { id: string; summary: string }[] {
  return selectPerspectiveWorkbenchTensions(input)
    .slice(0, input.tension_limit ?? DEFAULT_WORKBENCH_VISIBLE_LIMIT)
    .map((tension) => ({
      id: tension.tension_id,
      summary: tension.summary,
    }));
}

export function getPerspectiveWorkbenchVisibleNextActions(
  input: BuildPerspectiveWorkbenchProjectionInput,
): { id: string; summary: string }[] {
  return selectPerspectiveWorkbenchNextActions(input)
    .slice(0, input.next_action_limit ?? DEFAULT_WORKBENCH_VISIBLE_LIMIT)
    .map((candidate) => ({
      id: candidate.candidate_id,
      summary: candidate.summary,
    }));
}

function selectPerspectiveWorkbenchTensions(
  input: BuildPerspectiveWorkbenchProjectionInput,
): PerspectiveIngestUnresolvedTension[] {
  if (input.unit_preview) return input.unit_preview.unresolved_tensions;

  const selectedNode = input.selected_node_id
    ? findPerspectiveNode(input.preview.constellation.nodes, input.selected_node_id)
    : null;
  if (!selectedNode) return input.preview.unresolved_tensions;

  return matchById(
    input.preview.unresolved_tensions,
    selectedNode.unresolved_tension_ids,
    (tension) => tension.tension_id,
  );
}

function selectPerspectiveWorkbenchNextActions(
  input: BuildPerspectiveWorkbenchProjectionInput,
): PerspectiveIngestNextActionCandidate[] {
  if (input.unit_preview) return input.unit_preview.next_action_candidates;

  const selectedNode = input.selected_node_id
    ? findPerspectiveNode(input.preview.constellation.nodes, input.selected_node_id)
    : null;
  if (!selectedNode) return input.preview.next_action_candidates;

  return matchById(
    input.preview.next_action_candidates,
    selectedNode.next_action_candidate_ids,
    (candidate) => candidate.candidate_id,
  );
}

function findPerspectiveNode(
  nodes: PerspectiveIngestConstellationNode[],
  nodeId: string,
) {
  return nodes.find((node) => node.id === nodeId) ?? null;
}

function getConnectedPerspectiveEdgeIds(
  edges: PerspectiveIngestConstellationEdge[],
  nodeId: string,
) {
  return edges
    .filter((edge) => edge.source === nodeId || edge.target === nodeId)
    .map((edge) => edge.id);
}

function matchById<T>(
  items: T[],
  ids: string[],
  getId: (item: T) => string,
): T[] {
  const selectedIds = new Set(ids);
  return items.filter((item) => selectedIds.has(getId(item)));
}
