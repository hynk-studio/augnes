import type {
  PerspectiveIngestConstellationNode,
} from "@/types/perspective-ingest-constellation-preview";

export type PerspectiveCockpitSurfaceId =
  | "overview"
  | "work"
  | "perspective"
  | "bridge"
  | "operator";

export type PerspectiveTemporalNodeId =
  | "session"
  | "decision"
  | "handoff"
  | "pr"
  | "review"
  | "closeout"
  | "current_view"
  | "next_perspective";

export type PerspectiveTemporalEdgeId =
  | "session_to_decision"
  | "decision_to_handoff"
  | "handoff_to_review"
  | "handoff_to_pr_ref"
  | "review_to_closeout"
  | "closeout_to_current"
  | "current_to_next";

export interface PerspectiveTemporalSurfaceHint {
  surface_id: PerspectiveCockpitSurfaceId;
  reason: string;
}

export interface PerspectiveTemporalUnderlayItem {
  id: PerspectiveTemporalNodeId;
  label: string;
  summary: string;
  role: "archive" | "present" | "future" | "satellite";
  surface_hints: PerspectiveTemporalSurfaceHint[];
  spatial_node_ids: string[];
}

export interface PerspectiveTemporalUnderlayProjection {
  projection_version: "perspective_temporal_underlay.v0.1";
  primary_path: PerspectiveTemporalUnderlayItem[];
  satellites: {
    parent: "handoff";
    items: PerspectiveTemporalUnderlayItem[];
  };
  highlighted_item_ids: PerspectiveTemporalNodeId[];
}

export interface PerspectiveSpatialTemporalMapping {
  spatial_node_id: string;
  spatial_node_type?: string;
  temporal_node_ids: PerspectiveTemporalNodeId[];
  source: "sample_node_id" | "node_type_fallback";
}

export interface BuildPerspectiveTemporalUnderlayProjectionInput {
  nodes?: Pick<PerspectiveIngestConstellationNode, "id" | "type">[];
  selected_node_id?: string | null;
  selected_node_ids?: string[];
  highlighted_temporal_node_ids?: PerspectiveTemporalNodeId[];
}

const PERSPECTIVE_TEMPORAL_NODE_DEFINITIONS: Record<
  PerspectiveTemporalNodeId,
  Omit<PerspectiveTemporalUnderlayItem, "id" | "surface_hints" | "spatial_node_ids">
> = {
  session: {
    label: "Session",
    summary: "The source episode or conversation that formed the preview.",
    role: "archive",
  },
  decision: {
    label: "Decision",
    summary: "The formed intent, concept, or tradeoff being interpreted.",
    role: "archive",
  },
  handoff: {
    label: "Handoff",
    summary: "The review or implementation packet boundary.",
    role: "archive",
  },
  pr: {
    label: "PR",
    summary: "A pull request reference for review context.",
    role: "satellite",
  },
  review: {
    label: "Review",
    summary: "The critique, evidence check, or validation surface.",
    role: "satellite",
  },
  closeout: {
    label: "Closeout",
    summary: "The final report or outcome summary for a slice of work.",
    role: "satellite",
  },
  current_view: {
    label: "Current View",
    summary: "The present Perspective read model that a person is inspecting.",
    role: "present",
  },
  next_perspective: {
    label: "Next Perspective",
    summary: "The advisory future candidate for the next interpretation pass.",
    role: "future",
  },
};

const PERSPECTIVE_TEMPORAL_UNDERLAY_PRIMARY_PATH = [
  "session",
  "decision",
  "handoff",
  "current_view",
  "next_perspective",
] as const satisfies readonly PerspectiveTemporalNodeId[];

const PERSPECTIVE_TEMPORAL_UNDERLAY_SATELLITES = {
  parent: "handoff",
  items: ["pr", "review", "closeout"],
} as const satisfies {
  parent: "handoff";
  items: readonly PerspectiveTemporalNodeId[];
};

const PERSPECTIVE_TEMPORAL_NODE_SURFACE_MAP = {
  session: ["overview", "perspective"],
  decision: ["work", "perspective"],
  handoff: ["bridge"],
  pr: ["bridge", "work"],
  review: ["perspective", "bridge"],
  closeout: ["work", "overview"],
  current_view: ["perspective"],
  next_perspective: ["operator", "work"],
} as const satisfies Record<
  PerspectiveTemporalNodeId,
  readonly PerspectiveCockpitSurfaceId[]
>;

const SAMPLE_CHATGPT_SPATIAL_TO_TEMPORAL_MAP: Record<
  string,
  readonly PerspectiveTemporalNodeId[]
> = {
  "node.sample_chatgpt.source": ["session"],
  "node.sample_chatgpt.user_intent": ["session", "decision"],
  "node.sample_chatgpt.product_concept": ["decision", "current_view"],
  "node.sample_chatgpt.decision": ["decision", "closeout"],
  "node.sample_chatgpt.unresolved_tension": ["decision", "next_perspective"],
  "node.sample_chatgpt.next_move": ["next_perspective"],
  "node.sample_chatgpt.packet": ["handoff", "review", "pr"],
} as const;

const SPATIAL_NODE_TYPE_TO_TEMPORAL_MAP: Record<
  string,
  readonly PerspectiveTemporalNodeId[]
> = {
  source: ["session"],
  user_intent: ["session", "decision"],
  product_concept: ["decision", "current_view"],
  decision: ["decision", "closeout"],
  unresolved_tension: ["decision", "next_perspective"],
  next_move: ["next_perspective"],
  packet: ["handoff", "review", "pr"],
  work_unit: ["decision", "closeout"],
  changed_files: ["closeout"],
  validation: ["review", "closeout"],
  final_report: ["review", "closeout"],
  blocker_risk: ["decision", "next_perspective"],
} as const;

export function getPerspectiveTemporalNodesForSpatialNode(
  node: Pick<PerspectiveIngestConstellationNode, "id" | "type">,
): PerspectiveTemporalNodeId[] {
  return getPerspectiveTemporalNodesForSpatialNodeId(node.id, node.type);
}

export function getPerspectiveTemporalNodesForSpatialNodeId(
  nodeId: string,
  nodeType?: string | null,
): PerspectiveTemporalNodeId[] {
  const directMapping = SAMPLE_CHATGPT_SPATIAL_TO_TEMPORAL_MAP[nodeId];
  if (directMapping) return [...directMapping];

  const fallbackMapping = nodeType
    ? SPATIAL_NODE_TYPE_TO_TEMPORAL_MAP[nodeType]
    : null;

  return fallbackMapping ? [...fallbackMapping] : [];
}

export function getPerspectiveSurfacesForTemporalNode(
  temporalNodeId: PerspectiveTemporalNodeId,
): PerspectiveCockpitSurfaceId[] {
  return [...PERSPECTIVE_TEMPORAL_NODE_SURFACE_MAP[temporalNodeId]];
}

export function buildPerspectiveTemporalUnderlayProjection(
  input: BuildPerspectiveTemporalUnderlayProjectionInput = {},
): PerspectiveTemporalUnderlayProjection {
  const spatialNodeIdsByTemporalNode = buildSpatialNodeIdsByTemporalNode(
    input.nodes ?? [],
  );
  const selectedNodeIds = new Set([
    ...(input.selected_node_id ? [input.selected_node_id] : []),
    ...(input.selected_node_ids ?? []),
  ]);
  const selectedTemporalNodeIds = uniquePerspectiveTemporalNodeIds([
    ...Array.from(selectedNodeIds).flatMap((nodeId) => {
      const node = input.nodes?.find((candidate) => candidate.id === nodeId);
      return getPerspectiveTemporalNodesForSpatialNodeId(nodeId, node?.type);
    }),
    ...(input.highlighted_temporal_node_ids ?? []),
  ]);

  return {
    projection_version: "perspective_temporal_underlay.v0.1",
    primary_path: getPerspectiveTemporalUnderlayPrimaryPath().map((nodeId) =>
      buildPerspectiveTemporalUnderlayItem(
        nodeId,
        spatialNodeIdsByTemporalNode.get(nodeId) ?? [],
      ),
    ),
    satellites: {
      parent: "handoff",
      items: getPerspectiveTemporalUnderlaySatellites().items.map((nodeId) =>
        buildPerspectiveTemporalUnderlayItem(
          nodeId,
          spatialNodeIdsByTemporalNode.get(nodeId) ?? [],
        ),
      ),
    },
    highlighted_item_ids: selectedTemporalNodeIds,
  };
}

export function getPerspectiveTemporalUnderlayPrimaryPath(): PerspectiveTemporalNodeId[] {
  return [...PERSPECTIVE_TEMPORAL_UNDERLAY_PRIMARY_PATH];
}

export function getPerspectiveTemporalUnderlaySatellites(): {
  parent: "handoff";
  items: PerspectiveTemporalNodeId[];
} {
  return {
    parent: PERSPECTIVE_TEMPORAL_UNDERLAY_SATELLITES.parent,
    items: [...PERSPECTIVE_TEMPORAL_UNDERLAY_SATELLITES.items],
  };
}

export function getPerspectiveSpatialTemporalMapping(
  node: Pick<PerspectiveIngestConstellationNode, "id" | "type">,
): PerspectiveSpatialTemporalMapping {
  const directMapping = SAMPLE_CHATGPT_SPATIAL_TO_TEMPORAL_MAP[node.id];
  if (directMapping) {
    return {
      spatial_node_id: node.id,
      spatial_node_type: node.type,
      temporal_node_ids: [...directMapping],
      source: "sample_node_id",
    };
  }

  return {
    spatial_node_id: node.id,
    spatial_node_type: node.type,
    temporal_node_ids: getPerspectiveTemporalNodesForSpatialNodeId(
      node.id,
      node.type,
    ),
    source: "node_type_fallback",
  };
}

function buildPerspectiveTemporalUnderlayItem(
  nodeId: PerspectiveTemporalNodeId,
  spatialNodeIds: string[],
): PerspectiveTemporalUnderlayItem {
  const definition = PERSPECTIVE_TEMPORAL_NODE_DEFINITIONS[nodeId];

  return {
    id: nodeId,
    label: definition.label,
    summary: definition.summary,
    role: definition.role,
    surface_hints: getPerspectiveSurfacesForTemporalNode(nodeId).map(
      (surfaceId) => ({
        surface_id: surfaceId,
        reason: `Temporal ${nodeId} material is relevant to the ${surfaceId} Cockpit surface.`,
      }),
    ),
    spatial_node_ids: [...spatialNodeIds],
  };
}

function buildSpatialNodeIdsByTemporalNode(
  nodes: Pick<PerspectiveIngestConstellationNode, "id" | "type">[],
) {
  const nodeIdsByTemporalNode = new Map<PerspectiveTemporalNodeId, string[]>();

  for (const node of nodes) {
    for (const temporalNodeId of getPerspectiveTemporalNodesForSpatialNode(node)) {
      const nodeIds = nodeIdsByTemporalNode.get(temporalNodeId) ?? [];
      nodeIds.push(node.id);
      nodeIdsByTemporalNode.set(temporalNodeId, nodeIds);
    }
  }

  return nodeIdsByTemporalNode;
}

function uniquePerspectiveTemporalNodeIds(
  nodeIds: PerspectiveTemporalNodeId[],
): PerspectiveTemporalNodeId[] {
  return Array.from(new Set(nodeIds));
}
