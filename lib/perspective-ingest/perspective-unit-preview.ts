import type {
  FormationActorV0,
  FormationAttributionV0,
  FormationAuthorityV0,
  FormationBasisV0,
  FormationReceiptV0,
  PerspectiveConstellationSelectionScopeV0,
  PerspectiveUnitPreview,
  PerspectiveUnitPreviewConstellation,
} from "@/types/perspective-constellation-formation";
import type {
  PerspectiveIngestConstellationCluster,
  PerspectiveIngestConstellationEdge,
  PerspectiveIngestConstellationNode,
  PerspectiveIngestConstellationPreviewResponse,
  PerspectiveIngestEvidencePointer,
  PerspectiveIngestNextActionCandidate,
  PerspectiveIngestSourceQuery,
  PerspectiveIngestUnresolvedTension,
} from "@/types/perspective-ingest-constellation-preview";

type PerspectiveConstellationSelectionRefField =
  | "evidence_pointer_ids"
  | "unresolved_tension_ids"
  | "next_action_candidate_ids";

export interface BuildPerspectiveUnitPreviewInput {
  scope: PerspectiveConstellationSelectionScopeV0;
  selectedNode: PerspectiveIngestConstellationNode | null;
  selectedCluster: PerspectiveIngestConstellationCluster | null;
  constellation: PerspectiveUnitPreviewConstellation;
  evidencePointers: PerspectiveIngestEvidencePointer[];
  unresolvedTensions: PerspectiveIngestUnresolvedTension[];
  nextActionCandidates: PerspectiveIngestNextActionCandidate[];
  sourceRefs: PerspectiveIngestConstellationPreviewResponse["source_refs"];
  sourceQuery: PerspectiveIngestSourceQuery;
  generatedAt: string;
  baseChatGptPacketText: string;
  baseCodexHandoffPacketText: string;
}

const LOCAL_PREVIEW_AUTHORITY: FormationAuthorityV0 = {
  read_only: true,
  proposal_only: false,
  cached: false,
  external_calls: false,
  api_billable: false,
  persistence: false,
  graph_db_write: false,
  proof_evidence_write: false,
  codex_execution: false,
};

const LOCAL_BOUNDARY_NOTES = [
  "local-only Perspective Unit preview",
  "read-only selected graph material",
  "preview/copy only",
  "no external calls",
  "no API billable work",
  "no persistence",
  "no graph DB write",
  "no proof/evidence write",
  "no Codex execution",
];

export function buildPerspectiveUnitPreview({
  scope,
  selectedNode,
  selectedCluster,
  constellation,
  evidencePointers,
  unresolvedTensions,
  nextActionCandidates,
  sourceRefs,
  sourceQuery,
  generatedAt,
  baseChatGptPacketText,
  baseCodexHandoffPacketText,
}: BuildPerspectiveUnitPreviewInput): PerspectiveUnitPreview {
  const selectedNodeIds = getPerspectiveConstellationSelectionNodeIds({
    cluster: selectedCluster,
    edges: constellation.edges,
    nodes: constellation.nodes,
    scope,
    selectedNode,
  });
  const selectedNodeIdSet = new Set(selectedNodeIds);
  const selectedNodes = constellation.nodes.filter((node) =>
    selectedNodeIdSet.has(node.id),
  );
  const selectedEdgeIds = getPerspectiveConstellationSelectionEdgeIds({
    cluster: selectedCluster,
    edges: constellation.edges,
    scope,
    selectedNode,
    selectedNodeIds,
  });
  const selectedEdgeIdSet = new Set(selectedEdgeIds);
  const selectedEdges = constellation.edges.filter((edge) =>
    selectedEdgeIdSet.has(edge.id),
  );
  const selectedEvidencePointerIds = getPerspectiveConstellationSelectionRefIds({
    cluster: selectedCluster,
    field: "evidence_pointer_ids",
    nodes: selectedNodes,
    scope,
    wholeRefs: evidencePointers.map((pointer) => pointer.pointer_id),
  });
  const selectedTensionIds = getPerspectiveConstellationSelectionRefIds({
    cluster: selectedCluster,
    field: "unresolved_tension_ids",
    nodes: selectedNodes,
    scope,
    wholeRefs: unresolvedTensions.map((tension) => tension.tension_id),
  });
  const selectedNextActionIds = getPerspectiveConstellationSelectionRefIds({
    cluster: selectedCluster,
    field: "next_action_candidate_ids",
    nodes: selectedNodes,
    scope,
    wholeRefs: nextActionCandidates.map((candidate) => candidate.candidate_id),
  });
  const scopedEvidencePointers = matchPerspectiveIngestEvidencePointers(
    evidencePointers,
    selectedEvidencePointerIds,
  );
  const scopedTensions = matchPerspectiveIngestTensions(
    unresolvedTensions,
    selectedTensionIds,
  );
  const scopedNextActions = matchPerspectiveIngestNextActions(
    nextActionCandidates,
    selectedNextActionIds,
  );
  const scopeLabel = formatPerspectiveConstellationSelectionScope(scope);
  const selectionTitle = getPerspectiveConstellationSelectionTitle({
    cluster: selectedCluster,
    constellation,
    scope,
    selectedNode,
  });
  const selectionType = getPerspectiveConstellationSelectionType({
    scope,
    selectedNode,
  });
  const selectionSummary = getPerspectiveConstellationSelectionSummary({
    cluster: selectedCluster,
    constellation,
    scope,
    selectedNode,
  });
  const packetContext = {
    evidencePointers: scopedEvidencePointers,
    nextActions: scopedNextActions,
    nodeLabels: selectedNodes.map((node) => node.label),
    scopeLabel,
    selectionSummary,
    selectionTitle,
    selectionType,
    tensions: scopedTensions,
  };
  const idSegment = getPreviewIdSegment({
    scope,
    selectedCluster,
    selectedNode,
  });
  const formationReceipt = buildFormationReceipt({
    constellation,
    generatedAt,
    scope,
    selectedEdges,
    selectedNodes,
    selectionIdSegment: idSegment,
    sourceQuery,
    sourceRefs,
  });

  return {
    preview_id: stablePreviewId(
      "perspective_unit_preview",
      constellation.constellation_id,
      sourceQuery,
      scope,
      idSegment,
    ),
    scope,
    scope_label: scopeLabel,
    selection_title: selectionTitle,
    selection_type: selectionType,
    selection_summary: selectionSummary,
    selected_node_ids: selectedNodeIds,
    selected_node_labels: selectedNodes.map((node) => node.label),
    selected_edge_ids: selectedEdgeIds,
    evidence_pointers: scopedEvidencePointers,
    unresolved_tensions: scopedTensions,
    next_action_candidates: scopedNextActions,
    chatgpt_review_packet_text: buildPerspectiveConstellationScopedPacketText({
      ...packetContext,
      basePacketText: baseChatGptPacketText,
      packetTitle: "ChatGPT review packet scoped to current selection",
    }),
    codex_handoff_packet_text: buildPerspectiveConstellationScopedPacketText({
      ...packetContext,
      basePacketText: baseCodexHandoffPacketText,
      packetTitle: "Codex handoff packet scoped to current selection",
    }),
    formation_receipt: formationReceipt,
    local_boundary_notes: LOCAL_BOUNDARY_NOTES,
  };
}

export function getPerspectiveConstellationConnectedNodeIds({
  edges,
  selectedNode,
}: {
  edges: PerspectiveIngestConstellationEdge[];
  selectedNode: PerspectiveIngestConstellationNode | null;
}) {
  if (!selectedNode) return [];

  return uniquePerspectiveConstellationStrings(
    edges
      .filter(
        (edge) => edge.source === selectedNode.id || edge.target === selectedNode.id,
      )
      .flatMap((edge) => [edge.source, edge.target]),
  );
}

export function formatPerspectiveConstellationSelectionScope(
  scope: PerspectiveConstellationSelectionScopeV0,
) {
  const labels: Record<PerspectiveConstellationSelectionScopeV0, string> = {
    cluster: "Cluster",
    connected_node: "Connected Node",
    manual_selection: "Manual Selection",
    whole_constellation: "Whole Constellation",
  };

  return labels[scope];
}

export function buildPerspectiveConstellationScopedPacketText({
  basePacketText,
  evidencePointers,
  nextActions,
  nodeLabels,
  packetTitle,
  scopeLabel,
  selectionSummary,
  selectionTitle,
  selectionType,
  tensions,
}: {
  basePacketText: string;
  evidencePointers: PerspectiveIngestEvidencePointer[];
  nextActions: PerspectiveIngestNextActionCandidate[];
  nodeLabels: string[];
  packetTitle: string;
  scopeLabel: string;
  selectionSummary: string;
  selectionTitle: string;
  selectionType: string;
  tensions: PerspectiveIngestUnresolvedTension[];
}) {
  return [
    packetTitle,
    "",
    `Selection scope: ${scopeLabel}`,
    `Selected title: ${selectionTitle}`,
    `Selected type: ${selectionType}`,
    `Selected summary: ${selectionSummary}`,
    "",
    "Selected graph material:",
    formatPerspectiveConstellationPacketList(
      nodeLabels,
      (label) => `- ${label}`,
      "- Whole constellation material",
    ),
    "",
    "Evidence pointers (support only):",
    formatPerspectiveConstellationPacketList(
      evidencePointers,
      (pointer) => `- ${pointer.label}: ${pointer.target_ref}`,
      "- No scoped evidence pointers",
    ),
    "",
    "Unresolved tensions (kept separate):",
    formatPerspectiveConstellationPacketList(
      tensions,
      (tension) => `- ${tension.label}: ${tension.summary}`,
      "- No scoped unresolved tensions",
    ),
    "",
    "Next action candidates (advisory only):",
    formatPerspectiveConstellationPacketList(
      nextActions,
      (candidate) => `- ${candidate.label}: ${candidate.summary}`,
      "- No scoped next action candidates",
    ),
    "",
    "Boundary: preview/copy only. No Codex execution, GitHub call, state mutation, PR creation, proof/evidence/readiness write, persistence, or authority grant.",
    "",
    "Base packet text:",
    basePacketText,
  ].join("\n");
}

function buildFormationReceipt({
  constellation,
  generatedAt,
  scope,
  selectedEdges,
  selectedNodes,
  selectionIdSegment,
  sourceQuery,
  sourceRefs,
}: {
  constellation: PerspectiveUnitPreviewConstellation;
  generatedAt: string;
  scope: PerspectiveConstellationSelectionScopeV0;
  selectedEdges: PerspectiveIngestConstellationEdge[];
  selectedNodes: PerspectiveIngestConstellationNode[];
  selectionIdSegment: string;
  sourceQuery: PerspectiveIngestSourceQuery;
  sourceRefs: PerspectiveIngestConstellationPreviewResponse["source_refs"];
}): FormationReceiptV0 {
  const formationBasis = getFormationBasis(scope);
  const formedBy = getFormationActor(formationBasis);
  const nodeAttributions = Object.fromEntries(
    selectedNodes.map((node) => [
      node.id,
      buildNodeAttribution({ node, scope }),
    ]),
  );
  const nodeById = new Map(constellation.nodes.map((node) => [node.id, node]));
  const edgeAttributions = Object.fromEntries(
    selectedEdges.map((edge) => [
      edge.id,
      buildEdgeAttribution({
        edge,
        nodeById,
        scope,
      }),
    ]),
  );

  return {
    formation_id: stablePreviewId(
      "formation",
      constellation.constellation_id,
      sourceQuery,
      scope,
      selectionIdSegment,
    ),
    constellation_id: constellation.constellation_id,
    formation_basis: formationBasis,
    view_mode: "single",
    formed_by: formedBy,
    source_refs: sourceRefs,
    generated_at: generatedAt,
    as_of: generatedAt,
    criteria_summary: [
      "Built from the existing local Perspective ingest Constellation preview response.",
      `Source query: ${sourceQuery}.`,
      `Scope: ${formatPerspectiveConstellationSelectionScope(scope)}.`,
      "Lens controls inspection of the current graph; Formation Basis records how this preview was formed.",
      "No persistence, graph DB write, proof/evidence write, external call, API billable work, or Codex execution is authorized.",
    ],
    authority: { ...LOCAL_PREVIEW_AUTHORITY },
    preview_overrides: {
      hidden_node_ids: [],
      manual_cluster_ids: [],
      pinned_node_ids: [],
    },
    node_attributions: nodeAttributions,
    edge_attributions: edgeAttributions,
  };
}

function getPerspectiveConstellationSelectionNodeIds({
  cluster,
  edges,
  nodes,
  scope,
  selectedNode,
}: {
  cluster: PerspectiveIngestConstellationCluster | null;
  edges: PerspectiveIngestConstellationEdge[];
  nodes: PerspectiveIngestConstellationNode[];
  scope: PerspectiveConstellationSelectionScopeV0;
  selectedNode: PerspectiveIngestConstellationNode | null;
}) {
  if (scope === "whole_constellation") {
    return nodes.map((node) => node.id);
  }

  if (scope === "cluster" && cluster) {
    return uniquePerspectiveConstellationStrings(cluster.node_ids);
  }

  if (scope === "connected_node" && selectedNode) {
    return getPerspectiveConstellationConnectedNodeIds({ edges, selectedNode });
  }

  return selectedNode ? [selectedNode.id] : [];
}

function getPerspectiveConstellationSelectionEdgeIds({
  cluster,
  edges,
  scope,
  selectedNode,
  selectedNodeIds,
}: {
  cluster: PerspectiveIngestConstellationCluster | null;
  edges: PerspectiveIngestConstellationEdge[];
  scope: PerspectiveConstellationSelectionScopeV0;
  selectedNode: PerspectiveIngestConstellationNode | null;
  selectedNodeIds: string[];
}) {
  if (scope === "whole_constellation") {
    return edges.map((edge) => edge.id);
  }

  if (scope === "cluster" && cluster) {
    return uniquePerspectiveConstellationStrings(cluster.edge_ids);
  }

  if (scope === "connected_node" && selectedNode) {
    return uniquePerspectiveConstellationStrings(
      edges
        .filter(
          (edge) =>
            edge.source === selectedNode.id || edge.target === selectedNode.id,
        )
        .map((edge) => edge.id),
    );
  }

  const selectedNodeIdSet = new Set(selectedNodeIds);

  return edges
    .filter(
      (edge) =>
        selectedNodeIdSet.has(edge.source) && selectedNodeIdSet.has(edge.target),
    )
    .map((edge) => edge.id);
}

function getPerspectiveConstellationSelectionRefIds({
  cluster,
  field,
  nodes,
  scope,
  wholeRefs,
}: {
  cluster: PerspectiveIngestConstellationCluster | null;
  field: PerspectiveConstellationSelectionRefField;
  nodes: PerspectiveIngestConstellationNode[];
  scope: PerspectiveConstellationSelectionScopeV0;
  wholeRefs: string[];
}) {
  if (scope === "whole_constellation") {
    return uniquePerspectiveConstellationStrings(wholeRefs);
  }

  const nodeRefs = nodes.flatMap((node) => node[field]);
  const clusterRefs = scope === "cluster" && cluster ? cluster[field] : [];

  return uniquePerspectiveConstellationStrings([...clusterRefs, ...nodeRefs]);
}

function getPerspectiveConstellationSelectionTitle({
  cluster,
  constellation,
  scope,
  selectedNode,
}: {
  cluster: PerspectiveIngestConstellationCluster | null;
  constellation: PerspectiveUnitPreviewConstellation;
  scope: PerspectiveConstellationSelectionScopeV0;
  selectedNode: PerspectiveIngestConstellationNode | null;
}) {
  if (scope === "whole_constellation") {
    return "Whole Constellation";
  }

  if (scope === "cluster" && cluster) {
    return cluster.label;
  }

  return selectedNode?.label ?? constellation.constellation_id;
}

function getPerspectiveConstellationSelectionSummary({
  cluster,
  constellation,
  scope,
  selectedNode,
}: {
  cluster: PerspectiveIngestConstellationCluster | null;
  constellation: PerspectiveUnitPreviewConstellation;
  scope: PerspectiveConstellationSelectionScopeV0;
  selectedNode: PerspectiveIngestConstellationNode | null;
}) {
  if (scope === "whole_constellation") {
    return constellation.thesis;
  }

  if (scope === "cluster" && cluster) {
    return cluster.cluster_thesis;
  }

  return selectedNode?.summary ?? "Manual selection preview pending.";
}

function getPerspectiveConstellationSelectionType({
  scope,
  selectedNode,
}: {
  scope: PerspectiveConstellationSelectionScopeV0;
  selectedNode: PerspectiveIngestConstellationNode | null;
}) {
  if (scope === "whole_constellation") {
    return "constellation";
  }

  if (scope === "cluster") {
    return "cluster";
  }

  return selectedNode?.type ?? "selection";
}

function matchPerspectiveIngestEvidencePointers(
  evidencePointers: PerspectiveIngestEvidencePointer[],
  pointerIds: string[],
) {
  const selectedIds = new Set(pointerIds);

  return evidencePointers.filter((pointer) =>
    selectedIds.has(pointer.pointer_id),
  );
}

function matchPerspectiveIngestTensions(
  tensions: PerspectiveIngestUnresolvedTension[],
  tensionIds: string[],
) {
  const selectedIds = new Set(tensionIds);

  return tensions.filter((tension) => selectedIds.has(tension.tension_id));
}

function matchPerspectiveIngestNextActions(
  nextActions: PerspectiveIngestNextActionCandidate[],
  candidateIds: string[],
) {
  const selectedIds = new Set(candidateIds);

  return nextActions.filter((candidate) =>
    selectedIds.has(candidate.candidate_id),
  );
}

function getFormationBasis(
  scope: PerspectiveConstellationSelectionScopeV0,
): FormationBasisV0 {
  return scope === "manual_selection" ? "manual_selection" : "current";
}

function getFormationActor(
  formationBasis: FormationBasisV0,
): FormationActorV0 {
  if (formationBasis === "manual_selection") {
    return {
      actor_type: "user",
      label: "User-selected Perspective ingest / Constellation preview scope",
    };
  }

  return {
    actor_type: "augnes_builder",
    label: "Augnes Perspective ingest / Constellation preview builder",
  };
}

function buildNodeAttribution({
  node,
  scope,
}: {
  node: PerspectiveIngestConstellationNode;
  scope: PerspectiveConstellationSelectionScopeV0;
}): FormationAttributionV0 {
  return {
    subject_id: node.id,
    source_refs: uniquePerspectiveConstellationStrings(node.source_refs),
    source_episode_ids: uniquePerspectiveConstellationStrings(
      node.source_episode_ids,
    ),
    evidence_pointer_ids: uniquePerspectiveConstellationStrings(
      node.evidence_pointer_ids,
    ),
    criteria: [
      "selected node in current Perspective Unit preview",
      `scope:${scope}`,
    ],
  };
}

function buildEdgeAttribution({
  edge,
  nodeById,
  scope,
}: {
  edge: PerspectiveIngestConstellationEdge;
  nodeById: Map<string, PerspectiveIngestConstellationNode>;
  scope: PerspectiveConstellationSelectionScopeV0;
}): FormationAttributionV0 {
  const sourceNode = nodeById.get(edge.source);
  const targetNode = nodeById.get(edge.target);

  return {
    subject_id: edge.id,
    source_refs: uniquePerspectiveConstellationStrings([
      ...(sourceNode?.source_refs ?? []),
      ...(targetNode?.source_refs ?? []),
    ]),
    source_episode_ids: uniquePerspectiveConstellationStrings(
      edge.source_episode_ids,
    ),
    evidence_pointer_ids: uniquePerspectiveConstellationStrings(
      edge.evidence_pointer_ids,
    ),
    criteria: [
      "selected edge in current Perspective Unit preview",
      `scope:${scope}`,
    ],
  };
}

function formatPerspectiveConstellationPacketList<T>(
  items: T[],
  formatItem: (item: T) => string,
  emptyLabel: string,
) {
  return items.length > 0 ? items.map(formatItem).join("\n") : emptyLabel;
}

function uniquePerspectiveConstellationStrings(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function getPreviewIdSegment({
  scope,
  selectedCluster,
  selectedNode,
}: {
  scope: PerspectiveConstellationSelectionScopeV0;
  selectedCluster: PerspectiveIngestConstellationCluster | null;
  selectedNode: PerspectiveIngestConstellationNode | null;
}) {
  if (scope === "cluster" && selectedCluster) return selectedCluster.id;
  if ((scope === "connected_node" || scope === "manual_selection") && selectedNode) {
    return selectedNode.id;
  }

  return "all";
}

function stablePreviewId(...parts: string[]) {
  return parts.map((part) => part.replace(/[^a-zA-Z0-9._:-]/g, "_")).join(":");
}
