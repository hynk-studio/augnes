import {
  buildPerspectiveTemporalUnderlayProjection,
  getPerspectiveSurfacesForTemporalNode,
  type PerspectiveCockpitSurfaceId,
  type PerspectiveTemporalNodeId,
} from "@/lib/perspective-ingest/perspective-temporal-spatial-map";
import {
  getPerspectiveWorkbenchSelectedMaterial,
  type BuildPerspectiveWorkbenchProjectionInput,
} from "@/lib/perspective-ingest/perspective-workbench-projection";
import type {
  PerspectiveIngestConstellationNode,
  PerspectiveIngestConstellationPreviewResponse,
} from "@/types/perspective-ingest-constellation-preview";

export interface BuildPerspectiveAgentBriefInput
  extends BuildPerspectiveWorkbenchProjectionInput {
  scope_mode?: string | null;
}

export interface PerspectiveAgentBriefV0 {
  brief_version: "perspective_brief.v0.1";
  surface: "Perspective";
  scope: {
    mode: string;
    label: string;
  };
  source: {
    query: string;
    kind: string;
  };
  selected: {
    id: string;
    label: string;
    type: string;
    summary: string;
  };
  spatial_context: {
    node_count: number;
    edge_count: number;
    related_node_ids: string[];
    related_edge_ids: string[];
  };
  temporal_context: {
    primary_spine: PerspectiveTemporalNodeId[];
    satellites: {
      parent: "handoff";
      items: PerspectiveTemporalNodeId[];
    };
    related_temporal_nodes: PerspectiveTemporalNodeId[];
    current_temporal_node: PerspectiveTemporalNodeId | null;
    next_temporal_node: PerspectiveTemporalNodeId | null;
  };
  surface_context: {
    related_surfaces: PerspectiveCockpitSurfaceId[];
  };
  tensions: {
    id: string;
    summary: string;
  }[];
  next_actions: {
    id: string;
    summary: string;
  }[];
  handoff: {
    chatgpt_review_available: boolean;
    codex_handoff_available: boolean;
  };
  authority: {
    mode: "advisory_local_preview";
    external_calls: false;
    persistence: false;
    codex_execution: false;
  };
  refs: {
    evidence_pointer_count: number;
    full_refs_available: true;
  };
}

export function buildPerspectiveAgentBrief(
  input: BuildPerspectiveAgentBriefInput,
): PerspectiveAgentBriefV0 {
  const selected = getPerspectiveWorkbenchSelectedMaterial(input);
  const selectedNodeId =
    input.selected_node_id ??
    (selected.node_ids.length === 1 ? selected.node_ids[0] : null);
  const selectedNode = selectedNodeId
    ? findPerspectiveNode(input.preview.constellation.nodes, selectedNodeId)
    : null;
  const temporalUnderlay = buildPerspectiveTemporalUnderlayProjection({
    nodes: input.preview.constellation.nodes,
    selected_node_ids: selected.node_ids,
  });
  const relatedTemporalNodes = temporalUnderlay.highlighted_item_ids;
  const primarySpine = temporalUnderlay.primary_path.map((item) => item.id);
  const currentTemporalNode = getCurrentTemporalNode(
    primarySpine,
    relatedTemporalNodes,
  );

  return {
    brief_version: "perspective_brief.v0.1",
    surface: "Perspective",
    scope: {
      mode: input.scope_mode ?? input.unit_preview?.scope ?? "whole_constellation",
      label:
        input.scope_label ?? input.unit_preview?.scope_label ?? "Whole Constellation",
    },
    source: {
      query: input.preview.meta.source_query,
      kind: input.preview.source_kind,
    },
    selected: {
      id: selectedNode?.id ?? input.unit_preview?.preview_id ?? "whole_constellation",
      label: selected.title,
      type: selected.type,
      summary: selected.summary,
    },
    spatial_context: {
      node_count: input.preview.constellation.nodes.length,
      edge_count: input.preview.constellation.edges.length,
      related_node_ids: selected.node_ids,
      related_edge_ids: selected.edge_ids,
    },
    temporal_context: {
      primary_spine: primarySpine,
      satellites: {
        parent: temporalUnderlay.satellites.parent,
        items: temporalUnderlay.satellites.items.map((item) => item.id),
      },
      related_temporal_nodes: relatedTemporalNodes,
      current_temporal_node: currentTemporalNode,
      next_temporal_node: getNextTemporalNode(primarySpine, currentTemporalNode),
    },
    surface_context: {
      related_surfaces: getRelatedSurfaces(relatedTemporalNodes),
    },
    tensions: selectAgentTensions(input).map((tension) => ({
      id: tension.tension_id,
      summary: tension.summary,
    })),
    next_actions: selectAgentNextActions(input).map((candidate) => ({
      id: candidate.candidate_id,
      summary: candidate.summary,
    })),
    handoff: {
      chatgpt_review_available: Boolean(
        input.preview.chatgpt_rendering_packet.packet_id ||
          input.unit_preview?.chatgpt_review_packet_text,
      ),
      codex_handoff_available: Boolean(
        input.preview.codex_handoff_packet.packet_id ||
          input.unit_preview?.codex_handoff_packet_text,
      ),
    },
    authority: {
      mode: "advisory_local_preview",
      external_calls: false,
      persistence: false,
      codex_execution: false,
    },
    refs: {
      evidence_pointer_count: getEvidencePointerCount(input.preview, selected.node_ids),
      full_refs_available: true,
    },
  };
}

function selectAgentTensions(input: BuildPerspectiveAgentBriefInput) {
  if (input.unit_preview) return input.unit_preview.unresolved_tensions;

  const selectedNode = input.selected_node_id
    ? findPerspectiveNode(input.preview.constellation.nodes, input.selected_node_id)
    : null;
  if (!selectedNode) return input.preview.unresolved_tensions;

  return input.preview.unresolved_tensions.filter((tension) =>
    selectedNode.unresolved_tension_ids.includes(tension.tension_id),
  );
}

function selectAgentNextActions(input: BuildPerspectiveAgentBriefInput) {
  if (input.unit_preview) return input.unit_preview.next_action_candidates;

  const selectedNode = input.selected_node_id
    ? findPerspectiveNode(input.preview.constellation.nodes, input.selected_node_id)
    : null;
  if (!selectedNode) return input.preview.next_action_candidates;

  return input.preview.next_action_candidates.filter((candidate) =>
    selectedNode.next_action_candidate_ids.includes(candidate.candidate_id),
  );
}

function findPerspectiveNode(
  nodes: PerspectiveIngestConstellationNode[],
  nodeId: string,
) {
  return nodes.find((node) => node.id === nodeId) ?? null;
}

function getCurrentTemporalNode(
  primarySpine: PerspectiveTemporalNodeId[],
  relatedTemporalNodes: PerspectiveTemporalNodeId[],
) {
  const relatedPrimaryNodes = primarySpine.filter((nodeId) =>
    relatedTemporalNodes.includes(nodeId),
  );

  return relatedPrimaryNodes.at(-1) ?? null;
}

function getNextTemporalNode(
  primarySpine: PerspectiveTemporalNodeId[],
  currentTemporalNode: PerspectiveTemporalNodeId | null,
) {
  if (!currentTemporalNode) return null;

  const currentIndex = primarySpine.indexOf(currentTemporalNode);
  return primarySpine[currentIndex + 1] ?? null;
}

function getRelatedSurfaces(
  relatedTemporalNodes: PerspectiveTemporalNodeId[],
): PerspectiveCockpitSurfaceId[] {
  return Array.from(
    new Set(
      relatedTemporalNodes.flatMap((temporalNodeId) =>
        getPerspectiveSurfacesForTemporalNode(temporalNodeId),
      ),
    ),
  );
}

function getEvidencePointerCount(
  preview: PerspectiveIngestConstellationPreviewResponse,
  selectedNodeIds: string[],
) {
  if (!selectedNodeIds.length) return preview.evidence_pointers.length;

  const selectedNodeIdSet = new Set(selectedNodeIds);
  const selectedPointerIds = new Set(
    preview.constellation.nodes
      .filter((node) => selectedNodeIdSet.has(node.id))
      .flatMap((node) => node.evidence_pointer_ids),
  );

  return selectedPointerIds.size || preview.evidence_pointers.length;
}
