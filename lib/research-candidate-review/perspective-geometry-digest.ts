import type {
  ResearchCandidateConstellationEdge,
  ResearchCandidateConstellationNode,
  ResearchCandidateConstellationOverlay,
  ResearchCandidateConstellationSourceRef,
} from "@/types/research-candidate-constellation-overlay";
import type {
  PerspectiveClusterDigest,
  PerspectiveContradictionPair,
  PerspectiveGeometryAuthorityBoundary,
  PerspectiveGeometryDiagnostics,
  PerspectiveGeometryDigest,
  PerspectiveGeometryDigestInput,
  PerspectiveGeometryDigestInputOverlaySummary,
  PerspectiveGeometryDigestValidationResult,
  PerspectiveGeometryNodeRef,
  PerspectiveRetrievalExpansionRecommendation,
} from "@/types/perspective-geometry-digest";

type JsonRecord = Record<string, unknown>;

type NodeContext = {
  nodes: ResearchCandidateConstellationNode[];
  edges: ResearchCandidateConstellationEdge[];
  nodeById: Map<string, ResearchCandidateConstellationNode>;
  edgesByNodeId: Map<string, ResearchCandidateConstellationEdge[]>;
  allSourceRefs: ResearchCandidateConstellationSourceRef[];
};

const DIGEST_VERSION = "perspective_geometry_digest.v0.1" as const;
const DIGEST_MODE = "research_candidate_overlay_digest" as const;
const NEXT_RECOMMENDED_SLICE =
  "agent_perspective_substrate_docs_type_fixture_v0_1" as const;
const DEFAULT_AS_OF = "fixture:deterministic";
const SOURCE_COVERAGE_BOUNDARY_NOTE =
  "No direct source refs are present on this derived preview item; treat it as advisory overlay structure only.";
const ADVISORY_NOTE =
  "Derived advisory geometry digest only; source overlay remains candidate-only and layout coordinates are not truth.";

export function buildPerspectiveGeometryDigest(
  input: PerspectiveGeometryDigestInput,
): PerspectiveGeometryDigest {
  const overlay = normalizeOverlay(input.candidateConstellationOverlay);
  const context = buildContext(overlay);
  const sourceRefs = context.allSourceRefs;
  const inputOverlaySummary = buildInputOverlaySummary(overlay, context);
  const clusters = buildClusterDigests(context);
  const dominantClusters = clusters
    .slice()
    .sort(sortClustersByWeight)
    .slice(0, Math.min(3, clusters.length));
  const underrepresentedClusters = clusters
    .filter(isUnderrepresentedCluster)
    .sort(sortClustersBySignal);
  const bridgeNodes = buildBridgeNodes(context);
  const staleHighGravityNodes = buildStaleHighGravityNodes(context);
  const contradictionPairs = buildContradictionPairs(context);
  const recommendedRetrievalExpansion = buildRecommendedRetrievalExpansion({
    context,
    underrepresentedClusters,
    contradictionPairs,
  });
  const diagnostics = buildDiagnostics({
    context,
    clusters,
    dominantClusters,
    underrepresentedClusters,
    bridgeNodes,
    staleHighGravityNodes,
    contradictionPairs,
  });

  const digestBase: PerspectiveGeometryDigest = {
    version: DIGEST_VERSION,
    digest_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
    scope: input.scope ?? overlay.scope ?? "research_candidate_review",
    as_of: input.as_of ?? DEFAULT_AS_OF,
    digest_mode: input.digest_mode ?? DIGEST_MODE,
    input_overlay_summary: inputOverlaySummary,
    dominant_clusters: dominantClusters,
    underrepresented_clusters: underrepresentedClusters,
    bridge_nodes: bridgeNodes,
    stale_high_gravity_nodes: staleHighGravityNodes,
    contradiction_pairs: contradictionPairs,
    diagnostics,
    recommended_retrieval_expansion: recommendedRetrievalExpansion,
    source_refs: sourceRefs,
    authority_boundary: getPerspectiveGeometryAuthorityBoundary(),
    validation: {
      passed: true,
      failure_codes: [],
    },
    next_recommended_slice: NEXT_RECOMMENDED_SLICE,
  };
  const validation = validatePerspectiveGeometryDigest(digestBase);
  const digestWithValidation = {
    ...digestBase,
    validation,
  };
  return {
    ...digestWithValidation,
    digest_fingerprint:
      createPerspectiveGeometryDigestFingerprint(digestWithValidation),
  };
}

export function validatePerspectiveGeometryDigest(
  digest: PerspectiveGeometryDigest,
): PerspectiveGeometryDigestValidationResult {
  const failureCodes: string[] = [];
  if (digest.version !== DIGEST_VERSION) {
    failureCodes.push("digest_version_invalid");
  }
  if (digest.digest_mode !== DIGEST_MODE) {
    failureCodes.push("digest_mode_invalid");
  }
  if (!Array.isArray(digest.source_refs) || digest.source_refs.length === 0) {
    failureCodes.push("source_refs_missing");
  }
  for (const cluster of [
    ...asArray(digest.dominant_clusters),
    ...asArray(digest.underrepresented_clusters),
  ]) {
    const clusterRecord = asRecord(cluster);
    const sourceRefs = asArray(clusterRecord.source_refs);
    const notes = asArray(clusterRecord.authority_boundary_notes).map(asString);
    if (
      sourceRefs.length === 0 &&
      !notes.includes(SOURCE_COVERAGE_BOUNDARY_NOTE)
    ) {
      failureCodes.push("cluster_source_refs_or_boundary_note_missing");
    }
  }
  for (const bridgeNode of asArray(digest.bridge_nodes)) {
    const bridgeRecord = asRecord(bridgeNode);
    const sourceRefs = asArray(bridgeRecord.source_refs);
    const notes = asArray(bridgeRecord.authority_boundary_notes).map(asString);
    if (
      sourceRefs.length === 0 &&
      !notes.includes(SOURCE_COVERAGE_BOUNDARY_NOTE)
    ) {
      failureCodes.push("bridge_node_source_refs_or_boundary_note_missing");
    }
  }
  for (const pair of asArray(digest.contradiction_pairs)) {
    const pairRecord = asRecord(pair);
    if (asArray(pairRecord.related_tension_node_ids).length === 0) {
      failureCodes.push("contradiction_pair_tension_refs_missing");
    }
    if (asArray(pairRecord.source_refs).length === 0) {
      failureCodes.push("contradiction_pair_source_refs_missing");
    }
  }
  for (const expansion of asArray(digest.recommended_retrieval_expansion)) {
    if (asRecord(expansion).retrieval_executed_now !== false) {
      failureCodes.push("retrieval_expansion_executed");
    }
  }
  if (!isAdvisoryAuthorityBoundary(asRecord(digest.authority_boundary))) {
    failureCodes.push("authority_boundary_not_advisory_only");
  }
  if (containsCoordinateKey(digest)) {
    failureCodes.push("coordinate_fields_exported");
  }
  if (representsExecutionOrWrite(digest)) {
    failureCodes.push("execution_or_durable_write_represented");
  }
  if (representsProductWriteAuthority(digest)) {
    failureCodes.push("product_write_capability_represented");
  }
  if (!diagnosticsAreDeterministicNumbers(asRecord(digest.diagnostics))) {
    failureCodes.push("diagnostics_not_deterministic_numbers");
  }
  if (digest.input_overlay_summary.layout_coordinates_consumed !== false) {
    failureCodes.push("layout_coordinates_consumed_not_false");
  }
  if (digest.input_overlay_summary.raw_layout_coordinates_exported !== false) {
    failureCodes.push("raw_layout_coordinates_exported_not_false");
  }
  if (digest.next_recommended_slice !== NEXT_RECOMMENDED_SLICE) {
    failureCodes.push("next_recommended_slice_not_agent_substrate");
  }
  return {
    passed: failureCodes.length === 0,
    failure_codes: unique(failureCodes),
  };
}

export function createPerspectiveGeometryDigestFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function normalizeOverlay(value: unknown): ResearchCandidateConstellationOverlay {
  const record = asRecord(value);
  return {
    overlay_version:
      record.overlay_version === "research_candidate_constellation_overlay.v0.1"
        ? record.overlay_version
        : "research_candidate_constellation_overlay.v0.1",
    scope: asString(record.scope) || "research_candidate_review",
    source_kind:
      record.source_kind === "manual_parser_output_fixture"
        ? "manual_parser_output_fixture"
        : "research_candidate_review_fixture",
    source_fixture_path: asString(record.source_fixture_path),
    source_preview_version: maybeString(record.source_preview_version),
    source_fixture_version: maybeString(record.source_fixture_version),
    nodes: asArray(record.nodes).map(normalizeNode),
    edges: asArray(record.edges).map(normalizeEdge),
    diagnostics: asRecord(record.diagnostics) as unknown as ResearchCandidateConstellationOverlay["diagnostics"],
    authority: asRecord(record.authority) as unknown as ResearchCandidateConstellationOverlay["authority"],
  };
}

function normalizeNode(value: unknown): ResearchCandidateConstellationNode {
  const record = asRecord(value);
  const node: ResearchCandidateConstellationNode = {
    id: asString(record.id),
    kind: asString(record.kind) as ResearchCandidateConstellationNode["kind"],
    label: asString(record.label),
    summary: asString(record.summary),
    source_family: asString(record.source_family),
    source_object_id: asString(record.source_object_id),
    source_refs: normalizeSourceRefs(record.source_refs),
    display_order: asNumber(record.display_order),
    authority: asRecord(record.authority) as unknown as ResearchCandidateConstellationNode["authority"],
  };
  const reviewStatus = maybeString(record.review_status);
  const epistemicStatus = maybeString(record.epistemic_status);
  const targetPerspectiveKey = maybeString(record.target_perspective_key);
  if (reviewStatus) node.review_status = reviewStatus;
  if (epistemicStatus) node.epistemic_status = epistemicStatus;
  if (targetPerspectiveKey) node.target_perspective_key = targetPerspectiveKey;
  return node;
}

function normalizeEdge(value: unknown): ResearchCandidateConstellationEdge {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    source_node_id: asString(record.source_node_id),
    target_node_id: asString(record.target_node_id),
    relation: asString(record.relation) as ResearchCandidateConstellationEdge["relation"],
    label: asString(record.label),
    source_object_id: asString(record.source_object_id),
    source_refs: normalizeSourceRefs(record.source_refs),
    authority: asRecord(record.authority) as unknown as ResearchCandidateConstellationEdge["authority"],
  };
}

function buildContext(overlay: ResearchCandidateConstellationOverlay): NodeContext {
  const nodeById = new Map(overlay.nodes.map((node) => [node.id, node]));
  const edgesByNodeId = new Map<string, ResearchCandidateConstellationEdge[]>();
  for (const edge of overlay.edges) {
    for (const nodeId of [edge.source_node_id, edge.target_node_id]) {
      const existing = edgesByNodeId.get(nodeId) ?? [];
      existing.push(edge);
      edgesByNodeId.set(nodeId, existing);
    }
  }
  return {
    nodes: overlay.nodes,
    edges: overlay.edges,
    nodeById,
    edgesByNodeId,
    allSourceRefs: collectSourceRefs([...overlay.nodes, ...overlay.edges]),
  };
}

function buildInputOverlaySummary(
  overlay: ResearchCandidateConstellationOverlay,
  context: NodeContext,
): PerspectiveGeometryDigestInputOverlaySummary {
  return {
    overlay_version: overlay.overlay_version,
    source_bundle_id: overlay.source_fixture_path || overlay.source_kind,
    projection_mode: "semantic_candidate_constellation_overlay",
    node_count: overlay.nodes.length,
    edge_count: overlay.edges.length,
    source_ref_count: context.allSourceRefs.length,
    candidate_family_counts: countBy(overlay.nodes, (node) => node.source_family),
    node_kind_counts: countBy(overlay.nodes, (node) => node.kind),
    edge_kind_counts: countBy(overlay.edges, (edge) => edge.relation),
    layout_coordinates_consumed: false,
    raw_layout_coordinates_exported: false,
    source_fixture_fingerprint: createPerspectiveGeometryDigestFingerprint({
      overlay,
    }),
  };
}

function buildClusterDigests(context: NodeContext): PerspectiveClusterDigest[] {
  const clusterKeys = unique(
    context.nodes.map((node) => clusterKeyForNode(node)).filter(Boolean),
  ).sort();
  return clusterKeys.map((clusterKey) => {
    const clusterNodes = context.nodes.filter(
      (node) => clusterKeyForNode(node) === clusterKey,
    );
    const nodeIds = new Set(clusterNodes.map((node) => node.id));
    const clusterEdges = context.edges.filter(
      (edge) => nodeIds.has(edge.source_node_id) || nodeIds.has(edge.target_node_id),
    );
    const sourceRefs = collectSourceRefs([...clusterNodes, ...clusterEdges]);
    const unresolvedTensionCount = clusterNodes.filter(
      (node) => node.kind === "tension_candidate" && node.review_status !== "resolved",
    ).length;
    const knowledgeGapCount = clusterNodes.filter(
      (node) => node.kind === "knowledge_gap_candidate",
    ).length;
    const perspectiveDeltaCount = clusterNodes.filter(
      (node) => node.kind === "perspective_delta_candidate",
    ).length;
    const followUpWorkCount = clusterNodes.filter(
      (node) => node.kind === "follow_up_work_candidate",
    ).length;
    const sourceRefCount = sourceRefs.length;
    const nodeCount = clusterNodes.length;
    const edgeCount = clusterEdges.length;
    const clusterWeight =
      nodeCount * 3 +
      edgeCount +
      sourceRefCount +
      unresolvedTensionCount * 4 +
      knowledgeGapCount * 3 +
      perspectiveDeltaCount * 3 +
      followUpWorkCount * 2;
    return {
      cluster_id: stableId("cluster", clusterKey),
      cluster_label: labelForCluster(clusterKey, clusterNodes),
      cluster_kind: clusterKindForCluster(clusterKey, clusterNodes),
      node_count: nodeCount,
      edge_count: edgeCount,
      source_ref_count: sourceRefCount,
      representative_node_ids: clusterNodes
        .slice()
        .sort(sortNodes)
        .slice(0, 5)
        .map((node) => node.id),
      related_candidate_family_counts: countBy(
        clusterNodes,
        (node) => node.source_family,
      ),
      unresolved_tension_count: unresolvedTensionCount,
      knowledge_gap_count: knowledgeGapCount,
      perspective_delta_count: perspectiveDeltaCount,
      follow_up_work_count: followUpWorkCount,
      cluster_weight: clusterWeight,
      source_refs: sourceRefs,
      interpretation_notes: [
        `Cluster derived from semantic family ${clusterKey}.`,
        "Weight uses node, edge, source-ref, tension, gap, delta, and follow-up counts only.",
      ],
      authority_boundary_notes:
        sourceRefs.length > 0
          ? [ADVISORY_NOTE]
          : [ADVISORY_NOTE, SOURCE_COVERAGE_BOUNDARY_NOTE],
    };
  });
}

function buildBridgeNodes(context: NodeContext): PerspectiveGeometryNodeRef[] {
  return context.nodes
    .map((node) => {
      const edges = context.edgesByNodeId.get(node.id) ?? [];
      const connectedNodeIds = unique(
        edges
          .map((edge) =>
            edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id,
          )
          .filter(Boolean),
      );
      const connectedFamilies = unique(
        connectedNodeIds
          .map((nodeId) => context.nodeById.get(nodeId)?.source_family ?? "")
          .filter(Boolean),
      ).sort();
      const edgeKinds = unique(edges.map((edge) => edge.relation)).sort();
      if (connectedFamilies.length < 2 && !(edges.length >= 2 && edgeKinds.length >= 2)) {
        return null;
      }
      const reason =
        connectedFamilies.length >= 2
          ? "connects_multiple_candidate_families"
          : "degree_two_or_more_across_edge_kinds";
      return nodeRef({
        node,
        edges,
        bridgeReason: reason,
        degree: edges.length,
        connectedCandidateFamilies: connectedFamilies,
      });
    })
    .filter(isPresent)
    .sort((a, b) => b.degree - a.degree || a.node_id.localeCompare(b.node_id));
}

function buildStaleHighGravityNodes(
  context: NodeContext,
): PerspectiveGeometryNodeRef[] {
  return context.nodes
    .filter((node) =>
      /stale|superseded|retired|cool|archive/i.test(
        [node.label, node.summary, node.review_status, node.epistemic_status].join(" "),
      ),
    )
    .map((node) =>
      nodeRef({
        node,
        edges: context.edgesByNodeId.get(node.id) ?? [],
        bridgeReason: "stale_or_retired_marker_detected",
        degree: (context.edgesByNodeId.get(node.id) ?? []).length,
        connectedCandidateFamilies: [],
      }),
    )
    .sort((a, b) => b.degree - a.degree || a.node_id.localeCompare(b.node_id));
}

function buildContradictionPairs(
  context: NodeContext,
): PerspectiveContradictionPair[] {
  const explicitPairs = context.edges
    .filter((edge) => /contradict|conflict/i.test(edge.relation))
    .map((edge) => {
      const a = context.nodeById.get(edge.source_node_id);
      const b = context.nodeById.get(edge.target_node_id);
      if (!a || !b) return null;
      const edges = [edge];
      return buildContradictionPair({
        a,
        b,
        relatedTensionNodeIds: [],
        reason: edge.relation,
        sourceRefs: collectSourceRefs(edges),
        context,
      });
    })
    .filter(isPresent);

  const tensionPairs = context.nodes
    .filter((node) => node.kind === "tension_candidate")
    .map((tensionNode) => {
      const edges = (context.edgesByNodeId.get(tensionNode.id) ?? []).filter(
        (edge) =>
          edge.relation === "tension_relates_to_claim" ||
          edge.relation === "tension_relates_to_evidence",
      );
      const relatedNodes = unique(
        edges
          .map((edge) =>
            edge.source_node_id === tensionNode.id
              ? edge.target_node_id
              : edge.source_node_id,
          )
          .filter(Boolean),
      )
        .map((nodeId) => context.nodeById.get(nodeId))
        .filter(isPresent)
        .sort(sortNodes);
      if (relatedNodes.length < 2) return null;
      return buildContradictionPair({
        a: relatedNodes[0],
        b: relatedNodes[1],
        relatedTensionNodeIds: [tensionNode.id],
        reason: "unresolved_tension_relates_multiple_candidates",
        sourceRefs: collectSourceRefs([tensionNode, ...edges]),
        context,
      });
    })
    .filter(isPresent);

  return [...explicitPairs, ...tensionPairs].sort((a, b) =>
    a.pair_id.localeCompare(b.pair_id),
  );
}

function buildContradictionPair(options: {
  a: ResearchCandidateConstellationNode;
  b: ResearchCandidateConstellationNode;
  relatedTensionNodeIds: string[];
  reason: string;
  sourceRefs: ResearchCandidateConstellationSourceRef[];
  context: NodeContext;
}): PerspectiveContradictionPair {
  return {
    pair_id: stableId(
      "contradiction_pair",
      [options.a.id, options.b.id, ...options.relatedTensionNodeIds].join("__"),
    ),
    a: nodeRef({
      node: options.a,
      edges: options.context.edgesByNodeId.get(options.a.id) ?? [],
      bridgeReason: "contradiction_pair_endpoint",
      degree: (options.context.edgesByNodeId.get(options.a.id) ?? []).length,
      connectedCandidateFamilies: [],
    }),
    b: nodeRef({
      node: options.b,
      edges: options.context.edgesByNodeId.get(options.b.id) ?? [],
      bridgeReason: "contradiction_pair_endpoint",
      degree: (options.context.edgesByNodeId.get(options.b.id) ?? []).length,
      connectedCandidateFamilies: [],
    }),
    reason: options.reason,
    related_tension_node_ids: options.relatedTensionNodeIds,
    source_refs: options.sourceRefs,
    epistemic_status: [options.a.epistemic_status, options.b.epistemic_status]
      .filter(Boolean)
      .join("|") || "candidate_only",
    review_status: [options.a.review_status, options.b.review_status]
      .filter(Boolean)
      .join("|") || "candidate_only",
    authority_boundary_notes: [ADVISORY_NOTE],
  };
}

function buildRecommendedRetrievalExpansion(options: {
  context: NodeContext;
  underrepresentedClusters: PerspectiveClusterDigest[];
  contradictionPairs: PerspectiveContradictionPair[];
}): PerspectiveRetrievalExpansionRecommendation[] {
  const gapNodes = options.context.nodes.filter(
    (node) => node.kind === "knowledge_gap_candidate",
  );
  const tensionNodes = options.context.nodes.filter(
    (node) => node.kind === "tension_candidate",
  );
  const coverageGapClusters = options.underrepresentedClusters.filter(
    (cluster) => cluster.source_ref_count === 0 || cluster.knowledge_gap_count > 0,
  );
  const items: PerspectiveRetrievalExpansionRecommendation[] = [];

  for (const node of [...gapNodes, ...tensionNodes]) {
    const edges = options.context.edgesByNodeId.get(node.id) ?? [];
    const relatedNodeIds = unique(
      edges
        .map((edge) =>
          edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id,
        )
        .filter(Boolean),
    ).sort();
    items.push({
      expansion_id: stableId("retrieval_expansion", node.id),
      reason:
        node.kind === "knowledge_gap_candidate"
          ? "knowledge_gap_candidate_needs_review_context"
          : "unresolved_tension_candidate_needs_review_context",
      related_node_ids: [node.id, ...relatedNodeIds],
      related_gap_or_tension_ids: [node.id],
      suggested_query_terms: suggestQueryTerms([node.label, node.summary]),
      source_refs: collectSourceRefs([node, ...edges]),
      retrieval_executed_now: false,
      authority_boundary_notes: [ADVISORY_NOTE, "Advisory only; no retrieval was executed."],
    });
  }

  for (const cluster of coverageGapClusters) {
    items.push({
      expansion_id: stableId("retrieval_expansion", cluster.cluster_id),
      reason: "underrepresented_cluster_or_source_coverage_gap",
      related_node_ids: cluster.representative_node_ids,
      related_gap_or_tension_ids: [],
      suggested_query_terms: suggestQueryTerms([
        cluster.cluster_label,
        ...cluster.interpretation_notes,
      ]),
      source_refs: cluster.source_refs,
      retrieval_executed_now: false,
      authority_boundary_notes: [ADVISORY_NOTE, "Advisory only; no retrieval was executed."],
    });
  }

  for (const pair of options.contradictionPairs) {
    items.push({
      expansion_id: stableId("retrieval_expansion", pair.pair_id),
      reason: "contradiction_pair_needs_human_review_context",
      related_node_ids: [pair.a.node_id, pair.b.node_id],
      related_gap_or_tension_ids: pair.related_tension_node_ids,
      suggested_query_terms: suggestQueryTerms([
        pair.a.label,
        pair.b.label,
        pair.reason,
      ]),
      source_refs: pair.source_refs,
      retrieval_executed_now: false,
      authority_boundary_notes: [ADVISORY_NOTE, "Advisory only; no retrieval was executed."],
    });
  }

  return uniqueBy(items, (item) => item.expansion_id).sort((a, b) =>
    a.expansion_id.localeCompare(b.expansion_id),
  );
}

function buildDiagnostics(options: {
  context: NodeContext;
  clusters: PerspectiveClusterDigest[];
  dominantClusters: PerspectiveClusterDigest[];
  underrepresentedClusters: PerspectiveClusterDigest[];
  bridgeNodes: PerspectiveGeometryNodeRef[];
  staleHighGravityNodes: PerspectiveGeometryNodeRef[];
  contradictionPairs: PerspectiveContradictionPair[];
}): PerspectiveGeometryDiagnostics {
  const clusterNodeCounts = options.clusters.map((cluster) => cluster.node_count);
  const maxCluster = Math.max(...clusterNodeCounts, 0);
  const minCluster = Math.min(...clusterNodeCounts, maxCluster);
  const sourceRefCounts = countBy(
    options.context.allSourceRefs,
    (sourceRef) => sourceRef.source_ref_id,
  );
  const sourceRefValues = Object.values(sourceRefCounts);
  const sourceDominance =
    sourceRefValues.length === 0
      ? 0
      : round(Math.max(...sourceRefValues) / sourceRefValues.reduce((a, b) => a + b, 0));
  const groundedNodes = options.context.nodes.filter(
    (node) => node.kind !== "source_reference" && node.kind !== "target_perspective_anchor",
  );
  const groundedWithSourceRefs = groundedNodes.filter(
    (node) => normalizeSourceRefs(node.source_refs).length > 0,
  );
  return {
    cluster_balance:
      maxCluster === 0 ? 1 : round(minCluster / Math.max(maxCluster, 1)),
    source_dominance: sourceDominance,
    manual_gravity_distribution: Object.fromEntries(
      options.clusters
        .map((cluster) => [cluster.cluster_id, cluster.cluster_weight])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    ),
    stale_high_gravity_count: options.staleHighGravityNodes.length,
    bridge_node_count: options.bridgeNodes.length,
    coverage_gap_count: options.clusters.filter(
      (cluster) => cluster.source_ref_count === 0,
    ).length,
    contradiction_pair_count: options.contradictionPairs.length,
    unresolved_tension_count: options.context.nodes.filter(
      (node) => node.kind === "tension_candidate" && node.review_status !== "resolved",
    ).length,
    underrepresented_cluster_count: options.underrepresentedClusters.length,
    dominant_cluster_count: options.dominantClusters.length,
    coordinates_used_for_truth: false,
    coordinates_exported_to_ai_context: false,
    digest_is_authority: false,
    source_ref_coverage_ratio:
      groundedNodes.length === 0
        ? 1
        : round(groundedWithSourceRefs.length / groundedNodes.length),
    candidate_family_coverage: countBy(
      groundedWithSourceRefs,
      (node) => node.source_family,
    ),
  };
}

function nodeRef(options: {
  node: ResearchCandidateConstellationNode;
  edges: ResearchCandidateConstellationEdge[];
  bridgeReason: string;
  degree: number;
  connectedCandidateFamilies: string[];
}): PerspectiveGeometryNodeRef {
  const sourceRefs = collectSourceRefs([options.node, ...options.edges]);
  return {
    node_id: options.node.id,
    node_kind: options.node.kind,
    label: options.node.label,
    bridge_reason: options.bridgeReason,
    degree: options.degree,
    connected_candidate_families: options.connectedCandidateFamilies,
    source_refs: sourceRefs,
    authority_boundary_notes:
      sourceRefs.length > 0
        ? [ADVISORY_NOTE]
        : [ADVISORY_NOTE, SOURCE_COVERAGE_BOUNDARY_NOTE],
  };
}

function getPerspectiveGeometryAuthorityBoundary(): PerspectiveGeometryAuthorityBoundary {
  return {
    derived_view_only: true,
    source_of_truth: false,
    can_commit_or_reject_state: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_execute_agents: false,
    can_call_external_services: false,
    can_promote_perspective: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
    layout_coordinates_are_truth: false,
    digest_is_advisory_only: true,
  };
}

function clusterKeyForNode(node: ResearchCandidateConstellationNode): string {
  if (node.target_perspective_key) {
    return `target_perspective:${node.target_perspective_key}`;
  }
  return node.source_family || node.kind;
}

function labelForCluster(
  clusterKey: string,
  nodes: ResearchCandidateConstellationNode[],
): string {
  if (clusterKey.startsWith("target_perspective:")) {
    return clusterKey.replace("target_perspective:", "target perspective ");
  }
  const kindCounts = countBy(nodes, (node) => node.kind);
  const dominantKind =
    Object.entries(kindCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
    "candidate";
  return `${clusterKey} (${dominantKind})`;
}

function clusterKindForCluster(
  clusterKey: string,
  nodes: ResearchCandidateConstellationNode[],
): PerspectiveClusterDigest["cluster_kind"] {
  if (clusterKey.startsWith("target_perspective:")) {
    return "target_perspective_cluster";
  }
  if (nodes.some((node) => node.kind === "source_reference")) {
    return "source_reference_cluster";
  }
  if (nodes.some((node) => node.kind === "research_session")) {
    return "session_context_cluster";
  }
  return "candidate_family_cluster";
}

function isUnderrepresentedCluster(cluster: PerspectiveClusterDigest): boolean {
  const hasSignal =
    cluster.unresolved_tension_count > 0 ||
    cluster.knowledge_gap_count > 0 ||
    cluster.perspective_delta_count > 0 ||
    cluster.follow_up_work_count > 0;
  return hasSignal && (cluster.node_count <= 1 || cluster.source_ref_count <= 1);
}

function sortClustersByWeight(
  a: PerspectiveClusterDigest,
  b: PerspectiveClusterDigest,
): number {
  return (
    b.cluster_weight - a.cluster_weight ||
    b.node_count - a.node_count ||
    a.cluster_id.localeCompare(b.cluster_id)
  );
}

function sortClustersBySignal(
  a: PerspectiveClusterDigest,
  b: PerspectiveClusterDigest,
): number {
  const aSignal =
    a.unresolved_tension_count + a.knowledge_gap_count + a.perspective_delta_count;
  const bSignal =
    b.unresolved_tension_count + b.knowledge_gap_count + b.perspective_delta_count;
  return bSignal - aSignal || a.cluster_id.localeCompare(b.cluster_id);
}

function sortNodes(
  a: ResearchCandidateConstellationNode,
  b: ResearchCandidateConstellationNode,
): number {
  return a.display_order - b.display_order || a.id.localeCompare(b.id);
}

function collectSourceRefs(values: Array<unknown>): ResearchCandidateConstellationSourceRef[] {
  const ids = new Set<string>();
  for (const value of values) {
    for (const sourceRef of normalizeSourceRefs(asRecord(value).source_refs)) {
      if (sourceRef.source_ref_id) ids.add(sourceRef.source_ref_id);
    }
  }
  return [...ids].sort().map((source_ref_id) => ({ source_ref_id }));
}

function normalizeSourceRefs(value: unknown): ResearchCandidateConstellationSourceRef[] {
  return asArray(value)
    .map((sourceRef) => {
      if (typeof sourceRef === "string") return { source_ref_id: sourceRef };
      return { source_ref_id: asString(asRecord(sourceRef).source_ref_id) };
    })
    .filter((sourceRef) => sourceRef.source_ref_id);
}

function suggestQueryTerms(values: string[]): string[] {
  const stopWords = new Set([
    "and",
    "for",
    "from",
    "into",
    "that",
    "the",
    "this",
    "with",
    "without",
    "candidate",
    "node",
  ]);
  return unique(
    values
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9_\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !stopWords.has(word))
      .slice(0, 8),
  );
}

function isAdvisoryAuthorityBoundary(record: JsonRecord): boolean {
  return (
    record.derived_view_only === true &&
    record.source_of_truth === false &&
    record.can_commit_or_reject_state === false &&
    record.can_record_proof === false &&
    record.can_create_evidence === false &&
    record.can_update_work === false &&
    record.can_execute_agents === false &&
    record.can_call_external_services === false &&
    record.can_promote_perspective === false &&
    record.can_allocate_product_ids === false &&
    record.can_execute_product_write === false &&
    record.layout_coordinates_are_truth === false &&
    record.digest_is_advisory_only === true
  );
}

function containsCoordinateKey(value: unknown): boolean {
  let found = false;
  visit(value, (key) => {
    if (["x", "y", "fx", "fy", "position"].includes(key)) {
      found = true;
    }
  });
  return found;
}

function representsExecutionOrWrite(value: unknown): boolean {
  let found = false;
  visit(value, (key, nestedValue) => {
    const lowerKey = key.toLowerCase();
    if (
      nestedValue === true &&
      /(executed_now|write_now|db_open|sql_execution|transaction_execution|provider|source_fetch|external|browser_persistence|commit|promote|create_evidence|record_proof|update_work)/.test(
        lowerKey,
      )
    ) {
      found = true;
    }
  });
  return found;
}

function representsProductWriteAuthority(value: unknown): boolean {
  let found = false;
  visit(value, (key, nestedValue) => {
    const lowerKey = key.toLowerCase();
    if (
      nestedValue === true &&
      /(product_write|product_id|allocate_product|execute_product)/.test(lowerKey)
    ) {
      found = true;
    }
  });
  return found;
}

function diagnosticsAreDeterministicNumbers(record: JsonRecord): boolean {
  for (const key of [
    "cluster_balance",
    "source_dominance",
    "stale_high_gravity_count",
    "bridge_node_count",
    "coverage_gap_count",
    "contradiction_pair_count",
    "unresolved_tension_count",
    "underrepresented_cluster_count",
    "dominant_cluster_count",
    "source_ref_coverage_ratio",
  ]) {
    if (typeof record[key] !== "number" || !Number.isFinite(record[key])) {
      return false;
    }
  }
  return true;
}

function visit(
  value: unknown,
  callback: (key: string, nestedValue: unknown) => void,
): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nestedValue] of Object.entries(value as JsonRecord)) {
    callback(key, nestedValue);
    visit(nestedValue, callback);
  }
}

function countBy<T>(values: T[], getKey: (value: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = getKey(value) || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function uniqueBy<T>(values: T[], getKey: (value: T) => string): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }
  return output;
}

function stableId(prefix: string, value: string): string {
  return `${prefix}_${value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripGeneratedFields);
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return Object.fromEntries(
      Object.keys(record)
        .filter((key) => key !== "digest_fingerprint")
        .sort()
        .map((key) => [key, stripGeneratedFields(record[key])]),
    );
  }
  return value;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function maybeString(value: unknown): string | undefined {
  const stringValue = asString(value);
  return stringValue || undefined;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
