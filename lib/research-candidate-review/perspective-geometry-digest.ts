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

import type {
  PerspectiveGeometryClusterDigestFamily,
  PerspectiveGeometryClusterDigestKind,
  PerspectiveGeometryDiagnosticFamily,
  PerspectiveGeometryDiagnosticKind,
  PerspectiveGeometryDigestContract,
  PerspectiveGeometryDigestInputField,
  PerspectiveGeometryDigestOutputField,
  PerspectiveGeometryDigestPreview,
  PerspectiveGeometryDigestPreviewAuthorityBoundary,
  PerspectiveGeometryDigestPrinciples,
  PerspectiveGeometryDigestPrivacyPolicy,
  PerspectiveGeometryDigestValidationPolicy,
  PerspectiveGeometryNodeDigestFamily,
  PerspectiveGeometryNodeDigestKind,
  PerspectiveGeometryRecommendationPolicy,
  PerspectiveGeometryRelationshipDigestFamily,
  PerspectiveGeometryRelationshipDigestKind,
} from "@/types/perspective-geometry-digest-contract";

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

export interface PerspectiveGeometryDigestImplementationInput {
  perspective_geometry_digest_contract: PerspectiveGeometryDigestContract;
  source_contract_ref?: string;
  source_contract_fixture_path?: string;
  type_contract_path?: string;
  operator_context_ref?: string;
  digest_input_preview?: JsonRecord;
  geometry_digest_preview?: PerspectiveGeometryDigestPreview & JsonRecord;
  authority_boundary_overrides?: Partial<PerspectiveGeometryDigestImplementationAuthorityBoundary>;
}

export interface PerspectiveGeometryDigestPreviewBundleInput {
  contract: PerspectiveGeometryDigestContract;
  source_contract_ref?: string;
  operator_context_ref?: string;
  digest_input_preview?: JsonRecord;
  geometry_digest_preview?: PerspectiveGeometryDigestPreview & JsonRecord;
}

export interface PerspectiveGeometryDigestPreviewBundle {
  preview_version: "perspective_geometry_digest_preview.v0.1";
  source_contract_ref: string;
  operator_context_ref: string;
  digest_input_preview: JsonRecord;
  geometry_digest_preview: PerspectiveGeometryDigestPreview & JsonRecord;
  digest_principle_summary: PerspectiveGeometryDigestPrincipleSummary;
  cluster_digest_family_summary: PerspectiveGeometryClusterDigestFamilySummary;
  node_digest_family_summary: PerspectiveGeometryNodeDigestFamilySummary;
  relationship_digest_family_summary: PerspectiveGeometryRelationshipDigestFamilySummary;
  diagnostic_family_summary: PerspectiveGeometryDiagnosticFamilySummary;
  recommendation_summary: PerspectiveGeometryRecommendationSummary;
  reference_summary: PerspectiveGeometryReferenceSummary;
  validation: PerspectiveGeometryDigestValidation;
  authority_boundary: PerspectiveGeometryDigestPreviewAuthorityBoundary;
  validation_policy: PerspectiveGeometryDigestValidationPolicy;
  recommendation_policy: PerspectiveGeometryRecommendationPolicy;
}

export interface PerspectiveGeometryDigestPrincipleSummary
  extends PerspectiveGeometryDigestPrinciples {
  digest_principle_count: number;
  all_digest_principles_preserved: boolean;
}

export interface PerspectiveGeometryClusterDigestFamilySummary {
  cluster_digest_family_count: number;
  cluster_kinds: PerspectiveGeometryClusterDigestKind[];
  all_cluster_digest_families_preserved: boolean;
  all_cluster_digests_interpretation_only: boolean;
  all_cluster_digests_not_truth: boolean;
  all_cluster_digests_runtime_write_now_false: boolean;
}

export interface PerspectiveGeometryNodeDigestFamilySummary {
  node_digest_family_count: number;
  node_digest_kinds: PerspectiveGeometryNodeDigestKind[];
  all_node_digest_families_preserved: boolean;
  bridge_nodes_visible: boolean;
  stale_high_gravity_nodes_visible: boolean;
  candidate_overlay_digest_distinct: boolean;
  all_node_digests_runtime_write_now_false: boolean;
}

export interface PerspectiveGeometryRelationshipDigestFamilySummary {
  relationship_digest_family_count: number;
  relationship_kinds: PerspectiveGeometryRelationshipDigestKind[];
  all_relationship_digest_families_preserved: boolean;
  contradiction_pairs_source_ref_backed: boolean;
  evidence_chains_refs_not_proof: boolean;
  coverage_gaps_not_inferred_facts: boolean;
  retrieval_expansion_advisory_only: boolean;
  all_relationship_digests_runtime_write_now_false: boolean;
}

export interface PerspectiveGeometryDiagnosticFamilySummary {
  diagnostic_family_count: number;
  diagnostic_kinds: PerspectiveGeometryDiagnosticKind[];
  all_diagnostic_families_preserved: boolean;
  all_diagnostics_advisory_only: boolean;
  diagnostics_not_truth_or_authority: boolean;
}

export interface PerspectiveGeometryRecommendationSummary {
  recommended_retrieval_expansion_allowed_later: boolean;
  recommended_retrieval_expansion_advisory_only: boolean;
  retrieval_execution_now_false: boolean;
  recommended_review_focus_not_promotion_authority: boolean;
  followups_allowed_later: boolean;
  work_mutation_now_false: boolean;
}

export interface PerspectiveGeometryReferenceSummary {
  public_safe_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
  digest_ref_count: number;
  cluster_ref_count: number;
  node_ref_count: number;
  edge_ref_count: number;
  source_ref_count: number;
  perspective_ref_count: number;
  candidate_ref_count: number;
  evidence_ref_count: number;
  tension_ref_count: number;
  knowledge_gap_ref_count: number;
}

export interface PerspectiveGeometryDigestValidation {
  passed: boolean;
  failure_codes: string[];
  preview_bundle_follows_contract: boolean;
  preview_bundle_authority_boundary_matches_contract: boolean;
  preview_bundle_validation_policy_matches_contract: boolean;
  preview_bundle_recommendation_policy_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  digest_input_fields_preserved: boolean;
  digest_output_fields_preserved: boolean;
  digest_principles_preserved: boolean;
  cluster_digest_families_preserved: boolean;
  node_digest_families_preserved: boolean;
  relationship_digest_families_preserved: boolean;
  diagnostic_families_preserved: boolean;
  geometry_digest_is_interpretation_not_truth: boolean;
  raw_coordinates_not_enough: boolean;
  raw_coordinates_display_hints_only: boolean;
  raw_coordinates_not_source_of_truth: boolean;
  raw_coordinate_only_digest_forbidden: boolean;
  digest_is_derived_view: boolean;
  digest_not_independent_source_of_truth: boolean;
  diagnostics_are_advisory_only: boolean;
  cluster_balance_not_truth: boolean;
  source_dominance_warning_not_authority: boolean;
  manual_gravity_distribution_not_authority: boolean;
  coverage_gap_not_inferred_fact: boolean;
  contradiction_pairs_source_ref_backed: boolean;
  contradiction_not_resolution: boolean;
  evidence_chains_are_refs_not_proof: boolean;
  evidence_rays_are_refs_not_proof: boolean;
  recommended_retrieval_expansion_advisory_only: boolean;
  recommended_retrieval_expansion_does_not_execute_retrieval: boolean;
  candidate_overlay_and_durable_graph_distinct: boolean;
  salience_state_not_authority: boolean;
  perspective_snapshot_is_derived_view: boolean;
  all_digest_items_public_safe: boolean;
  all_digest_items_source_ref_backed_or_gap_reason_backed: boolean;
  geometry_digest_runtime_build_not_implemented: boolean;
  geometry_digest_write_not_implemented: boolean;
  geometry_calculation_runtime_not_implemented: boolean;
  runtime_layout_not_implemented: boolean;
  graph_db_not_implemented: boolean;
  graph_mutation_now_false: boolean;
  ui_rendering_not_implemented: boolean;
  browser_request_now_false: boolean;
  ai_context_packet_not_implemented: boolean;
  codex_handoff_not_implemented: boolean;
  runtime_state_read_write_not_implemented: boolean;
  durable_perspective_delta_apply_not_implemented: boolean;
  proof_or_evidence_write_not_implemented: boolean;
  accepted_evidence_write_not_implemented: boolean;
  formation_receipt_write_not_implemented: boolean;
  work_mutation_now_false: boolean;
  retrieval_rag_execution_not_implemented: boolean;
  provider_openai_call_not_implemented: boolean;
  source_fetch_not_implemented: boolean;
  crawler_not_implemented: boolean;
  public_safe_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
}

export interface PerspectiveGeometryDigestImplementationValidation
  extends PerspectiveGeometryDigestValidation {
  invalid_digest_preview_override_rejected: boolean;
  invalid_cluster_digest_override_rejected: boolean;
  invalid_node_digest_override_rejected: boolean;
  invalid_relationship_digest_override_rejected: boolean;
  invalid_diagnostic_override_rejected: boolean;
  invalid_authority_boundary_override_rejected: boolean;
  invalid_refs_override_rejected: boolean;
}

export interface PerspectiveGeometryDigestImplementationAuthorityBoundary {
  implementation_added_now: true;
  deterministic_builder_added_now: true;
  contract_changed_now: false;
  geometry_digest_runtime_build_implemented_now: false;
  geometry_digest_write_now: false;
  geometry_calculation_runtime_now: false;
  raw_coordinate_authority: false;
  raw_coordinate_only_digest_now: false;
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
  request_animation_frame_now: false;
  durable_perspective_state_read_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_implemented_now: false;
  trajectory_runtime_build_implemented_now: false;
  ai_context_packet_implemented_now: false;
  codex_handoff_implemented_now: false;
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
  geometry_digest_authority: false;
  diagnostic_authority: false;
  recommendation_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface PerspectiveGeometryDigestImplementationFixture {
  implementation_kind: "perspective_geometry_digest_implementation";
  implementation_version: "perspective_geometry_digest_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  implemented_contract: {
    contract_kind: "perspective_geometry_digest_contract";
    contract_version: "perspective_geometry_digest_contract.v0.1";
    contract_fixture_path: string;
    type_contract_path: string;
    contract_authority_boundary_preserved: true;
    contract_validation_policy_preserved: true;
    contract_digest_principles_preserved: true;
    contract_recommendation_policy_preserved: true;
    contract_cluster_digest_families_preserved: true;
    contract_node_digest_families_preserved: true;
    contract_relationship_digest_families_preserved: true;
    contract_diagnostic_families_preserved: true;
  };
  deterministic_builder: {
    builder_path: "lib/research-candidate-review/perspective-geometry-digest.ts";
    deterministic_fixture_backed_only: true;
    geometry_digest_runtime_build_now: false;
    geometry_digest_write_now: false;
    geometry_calculation_runtime_now: false;
    raw_coordinate_only_digest_now: false;
    runtime_layout_execution_now: false;
    seeded_layout_runtime_now: false;
    force_directed_layout_runtime_now: false;
    temporal_smoothing_runtime_now: false;
    layout_persistence_now: false;
    layout_coordinate_write_now: false;
    graph_db_now: false;
    graph_mutation_now: false;
    ui_rendering_now: false;
    browser_rendering_now: false;
    browser_request_now: false;
    browser_persistence_now: false;
    request_animation_frame_now: false;
    durable_perspective_state_read_now: false;
    durable_perspective_state_write_now: false;
    durable_perspective_delta_apply_now: false;
    perspective_snapshot_runtime_now: false;
    ai_context_packet_now: false;
    codex_handoff_now: false;
    retrieval_rag_execution_now: false;
    provider_openai_call_now: false;
    source_fetch_now: false;
    crawler_now: false;
    runtime_db_query_now: false;
    runtime_db_write_now: false;
    production_db_used_now: false;
    durable_memory_write_now: false;
  };
  built_perspective_geometry_digest_preview_bundle: PerspectiveGeometryDigestPreviewBundle;
  validated_implementation: PerspectiveGeometryDigestImplementationValidation;
  authority_boundary: PerspectiveGeometryDigestImplementationAuthorityBoundary;
  recommendation_status: "ready_for_perspective_geometry_digest_browser_validation_v0_1";
  next_recommended_slice: "perspective_geometry_digest_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const expectedDigestInputFields: PerspectiveGeometryDigestInputField[] = [
  "digest_scope_ref",
  "project_constellation_layout_preview_ref",
  "perspective_snapshot_ref",
  "durable_perspective_state_ref",
  "candidate_overlay_ref",
  "source_refs",
  "bridge_node_refs",
  "stale_high_gravity_node_refs",
  "tension_marker_refs",
  "knowledge_gap_marker_refs",
  "evidence_ray_refs",
  "salience_state_ref",
  "operator_context_ref",
];

const expectedDigestOutputFields: PerspectiveGeometryDigestOutputField[] = [
  "digest_id",
  "digest_version",
  "scope",
  "as_of",
  "dominant_clusters",
  "underrepresented_clusters",
  "bridge_nodes",
  "stale_high_gravity_nodes",
  "contradiction_pairs",
  "coverage_gaps",
  "evidence_chains",
  "diagnostics",
  "recommended_retrieval_expansion",
  "source_refs",
  "authority_boundary",
  "validation_policy",
];

const expectedClusterKinds: PerspectiveGeometryClusterDigestKind[] = [
  "dominant_cluster",
  "underrepresented_cluster",
  "stale_influential_cluster",
];

const expectedNodeDigestKinds: PerspectiveGeometryNodeDigestKind[] = [
  "bridge_node_digest",
  "stale_high_gravity_node_digest",
  "tension_node_digest",
  "knowledge_gap_node_digest",
  "candidate_overlay_node_digest",
  "source_reference_node_digest",
];

const expectedRelationshipKinds: PerspectiveGeometryRelationshipDigestKind[] = [
  "contradiction_pair",
  "evidence_chain",
  "coverage_gap",
  "retrieval_expansion_hint",
];

const expectedDiagnosticKinds: PerspectiveGeometryDiagnosticKind[] = [
  "cluster_balance",
  "source_dominance",
  "manual_gravity_distribution",
  "stale_high_gravity_count",
  "bridge_node_count",
  "coverage_gap_count",
  "contradiction_pair_count",
];

const invalidEnabled = true;

export function buildPerspectiveGeometryDigestImplementationFixture(
  input: PerspectiveGeometryDigestImplementationInput,
): PerspectiveGeometryDigestImplementationFixture {
  const contract = input.perspective_geometry_digest_contract;
  const sourceContractRef =
    input.source_contract_ref ??
    `${contract.contract_version}:fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json`;
  const previewBundle = buildPerspectiveGeometryDigestPreviewBundle({
    contract,
    source_contract_ref: sourceContractRef,
    operator_context_ref: input.operator_context_ref,
    digest_input_preview: input.digest_input_preview,
    geometry_digest_preview: input.geometry_digest_preview,
  });
  const validation = previewBundle.validation;
  const implementationBoundary = {
    ...defaultImplementationAuthorityBoundary(),
    ...(input.authority_boundary_overrides ?? {}),
  } as PerspectiveGeometryDigestImplementationAuthorityBoundary;
  const fixtureWithoutFingerprint: Omit<
    PerspectiveGeometryDigestImplementationFixture,
    "implementation_fingerprint"
  > = {
    implementation_kind: "perspective_geometry_digest_implementation" as const,
    implementation_version:
      "perspective_geometry_digest_implementation.v0.1" as const,
    source_contract_ref: sourceContractRef,
    source_contract_fingerprint: createPerspectiveGeometryDigestFingerprint(
      contract,
    ),
    implemented_contract: {
      contract_kind: contract.contract_kind,
      contract_version: contract.contract_version,
      contract_fixture_path:
        input.source_contract_fixture_path ??
        "fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json",
      type_contract_path:
        input.type_contract_path ??
        "types/perspective-geometry-digest-contract.ts",
      contract_authority_boundary_preserved: true,
      contract_validation_policy_preserved: true,
      contract_digest_principles_preserved: true,
      contract_recommendation_policy_preserved: true,
      contract_cluster_digest_families_preserved: true,
      contract_node_digest_families_preserved: true,
      contract_relationship_digest_families_preserved: true,
      contract_diagnostic_families_preserved: true,
    },
    deterministic_builder: defaultDeterministicBuilderBoundary(),
    built_perspective_geometry_digest_preview_bundle: previewBundle,
    validated_implementation: {
      ...validation,
      invalid_digest_preview_override_rejected:
        invalidDigestPreviewOverrideRejected(previewBundle, contract),
      invalid_cluster_digest_override_rejected:
        invalidClusterDigestOverrideRejected(previewBundle, contract),
      invalid_node_digest_override_rejected:
        invalidNodeDigestOverrideRejected(previewBundle, contract),
      invalid_relationship_digest_override_rejected:
        invalidRelationshipDigestOverrideRejected(previewBundle, contract),
      invalid_diagnostic_override_rejected:
        invalidDiagnosticOverrideRejected(previewBundle, contract),
      invalid_authority_boundary_override_rejected:
        invalidAuthorityBoundaryOverrideRejected(previewBundle, contract),
      invalid_refs_override_rejected: invalidRefsOverrideRejected(
        previewBundle,
        contract,
      ),
    },
    authority_boundary: implementationBoundary,
    recommendation_status:
      "ready_for_perspective_geometry_digest_browser_validation_v0_1",
    next_recommended_slice:
      "perspective_geometry_digest_browser_validation_v0_1",
    fingerprint_algorithm: "fnv1a32_canonical_json" as const,
  };

  return {
    ...fixtureWithoutFingerprint,
    implementation_fingerprint: createPerspectiveGeometryDigestFingerprint(
      fixtureWithoutFingerprint,
    ),
  };
}

export function buildPerspectiveGeometryDigestPreviewBundle(
  input: PerspectiveGeometryDigestPreviewBundleInput,
): PerspectiveGeometryDigestPreviewBundle {
  const sample = input.contract.sample_perspective_geometry_digest_preview;
  const digestInputPreview = clone(
    input.digest_input_preview ?? sample.digest_input_preview,
  );
  const digestPreview = clone(
    input.geometry_digest_preview ?? sample.geometry_digest_preview,
  ) as PerspectiveGeometryDigestPreview & JsonRecord;
  const bundleWithoutValidation = {
    preview_version: "perspective_geometry_digest_preview.v0.1" as const,
    source_contract_ref:
      input.source_contract_ref ??
      `${input.contract.contract_version}:fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json`,
    operator_context_ref:
      input.operator_context_ref ?? sample.operator_context_ref,
    digest_input_preview: digestInputPreview,
    geometry_digest_preview: digestPreview,
    digest_principle_summary: buildDigestPrincipleSummary(input.contract),
    cluster_digest_family_summary: buildClusterDigestFamilySummary(
      input.contract,
    ),
    node_digest_family_summary: buildNodeDigestFamilySummary(input.contract),
    relationship_digest_family_summary:
      buildRelationshipDigestFamilySummary(input.contract),
    diagnostic_family_summary: buildDiagnosticFamilySummary(input.contract),
    recommendation_summary: buildRecommendationSummary(input.contract),
    reference_summary: buildReferenceSummary(
      digestInputPreview,
      digestPreview,
      input.contract.privacy_policy,
    ),
    authority_boundary: clone(sample.authority_boundary),
    validation_policy: clone(input.contract.validation_policy),
    recommendation_policy: clone(input.contract.recommendation_policy),
  };

  return {
    ...bundleWithoutValidation,
    validation: validatePerspectiveGeometryDigestPreviewBundle(
      bundleWithoutValidation,
      input.contract,
    ),
  };
}

export function validatePerspectiveGeometryDigestPreviewBundle(
  previewBundle: Omit<PerspectiveGeometryDigestPreviewBundle, "validation">,
  contract: PerspectiveGeometryDigestContract,
): PerspectiveGeometryDigestValidation {
  const failureCodes = new Set<string>();
  const digest = previewBundle.geometry_digest_preview;
  const principles = contract.digest_principles;
  const validationPolicy = contract.validation_policy;
  const recommendationPolicy = contract.recommendation_policy;
  const boundary = previewBundle.authority_boundary as JsonRecord;
  const referenceValidation = validateAllReferences(
    previewBundle.digest_input_preview,
    digest,
    contract.privacy_policy,
  );
  const digestValidation = validateDigestPreview(digest, failureCodes);
  validateClusters(digest, failureCodes);
  validateNodeDigests(digest, failureCodes);
  validateRelationships(digest, failureCodes);
  validateDiagnostics(digest, failureCodes);
  validateAuthorityBoundary(boundary, failureCodes);

  if (!referenceValidation.public_safe_refs_only) {
    failureCodes.add("private_or_unstable_ref_detected");
  }
  if (!referenceValidation.no_raw_private_source_body) {
    failureCodes.add("raw_private_source_body_detected");
  }
  if (!referenceValidation.no_raw_provider_thread_run_session_ids) {
    failureCodes.add("raw_provider_thread_run_session_id_detected");
  }

  const previewBoundaryMatchesContract = deepEqual(
    previewBundle.authority_boundary,
    contract.sample_perspective_geometry_digest_preview.authority_boundary,
  );
  const validationPolicyMatchesContract = deepEqual(
    previewBundle.validation_policy,
    contract.validation_policy,
  );
  const recommendationPolicyMatchesContract = deepEqual(
    previewBundle.recommendation_policy,
    contract.recommendation_policy,
  );
  const digestInputFieldsPreserved = deepEqual(
    contract.digest_input_fields,
    expectedDigestInputFields,
  );
  const digestOutputFieldsPreserved = deepEqual(
    contract.digest_output_fields,
    expectedDigestOutputFields,
  );
  const digestPrinciplesPreserved = allTrue(principles);
  const clusterFamiliesPreserved = validateClusterFamilies(
    contract.cluster_digest_families,
  );
  const nodeFamiliesPreserved = validateNodeFamilies(
    contract.node_digest_families,
  );
  const relationshipFamiliesPreserved = validateRelationshipFamilies(
    contract.relationship_digest_families,
  );
  const diagnosticFamiliesPreserved = validateDiagnosticFamilies(
    contract.diagnostic_families,
  );
  const noRuntimeBoundary =
    boundary.geometry_digest_runtime_build_implemented_now === false &&
    boundary.geometry_digest_write_now === false &&
    boundary.geometry_calculation_runtime_now === false &&
    boundary.runtime_layout_execution_now === false &&
    boundary.graph_db_implemented_now === false &&
    boundary.graph_mutation_now === false &&
    boundary.browser_request_now === false &&
    boundary.ai_context_packet_implemented_now === false &&
    boundary.codex_handoff_implemented_now === false &&
    boundary.durable_perspective_state_read_now === false &&
    boundary.durable_perspective_state_write_now === false &&
    boundary.runtime_db_write_now === false &&
    boundary.runtime_db_query_now === false &&
    boundary.provider_openai_call_now === false &&
    boundary.retrieval_rag_authority === false &&
    boundary.source_fetch_now === false &&
    boundary.crawler_now === false &&
    boundary.product_write_authority === false &&
    boundary.product_id_allocation_authority === false;
  const previewBundleFollowsContract =
    previewBundle.preview_version === "perspective_geometry_digest_preview.v0.1" &&
    hasText(previewBundle.source_contract_ref) &&
    hasText(previewBundle.operator_context_ref) &&
    digestValidation.digest_preview_follows_contract &&
    previewBoundaryMatchesContract &&
    validationPolicyMatchesContract &&
    recommendationPolicyMatchesContract &&
    referenceValidation.public_safe_refs_only &&
    noRuntimeBoundary;

  const validationWithoutFailureCodes = {
    preview_bundle_follows_contract: previewBundleFollowsContract,
    preview_bundle_authority_boundary_matches_contract:
      previewBoundaryMatchesContract,
    preview_bundle_validation_policy_matches_contract:
      validationPolicyMatchesContract,
    preview_bundle_recommendation_policy_matches_contract:
      recommendationPolicyMatchesContract,
    top_level_implementation_boundary_is_separate: true,
    digest_input_fields_preserved: digestInputFieldsPreserved,
    digest_output_fields_preserved: digestOutputFieldsPreserved,
    digest_principles_preserved: digestPrinciplesPreserved,
    cluster_digest_families_preserved: clusterFamiliesPreserved,
    node_digest_families_preserved: nodeFamiliesPreserved,
    relationship_digest_families_preserved: relationshipFamiliesPreserved,
    diagnostic_families_preserved: diagnosticFamiliesPreserved,
    geometry_digest_is_interpretation_not_truth:
      principles.geometry_digest_is_interpretation_not_truth === true,
    raw_coordinates_not_enough:
      principles.raw_coordinates_not_enough === true,
    raw_coordinates_display_hints_only:
      principles.raw_coordinates_are_display_hints_only === true,
    raw_coordinates_not_source_of_truth:
      principles.raw_coordinates_not_source_of_truth === true &&
      digest.raw_coordinates_used_as_truth === false,
    raw_coordinate_only_digest_forbidden:
      validationPolicy.raw_coordinate_only_digest_forbidden === true &&
      digest.raw_coordinate_only_digest === false,
    digest_is_derived_view: principles.digest_is_derived_view === true,
    digest_not_independent_source_of_truth:
      principles.digest_not_independent_source_of_truth === true,
    diagnostics_are_advisory_only:
      principles.diagnostics_are_advisory_only === true &&
      digestValidation.diagnostics_are_advisory_only,
    cluster_balance_not_truth:
      principles.cluster_balance_not_truth === true &&
      getRecord(digest.diagnostics.cluster_balance).not_truth === true,
    source_dominance_warning_not_authority:
      principles.source_dominance_warning_not_authority === true &&
      getRecord(digest.diagnostics.source_dominance)
        .not_promotion_authority === true,
    manual_gravity_distribution_not_authority:
      principles.manual_gravity_distribution_not_authority === true &&
      getRecord(digest.diagnostics.manual_gravity_distribution)
        .manual_gravity_not_authority === true,
    coverage_gap_not_inferred_fact:
      principles.coverage_gap_not_inferred_fact === true &&
      digestValidation.coverage_gaps_not_inferred_facts,
    contradiction_pairs_source_ref_backed:
      validationPolicy.contradiction_pairs_source_ref_backed === true &&
      digestValidation.contradiction_pairs_source_ref_backed,
    contradiction_not_resolution:
      validationPolicy.contradiction_not_resolution === true &&
      digestValidation.contradiction_not_resolution,
    evidence_chains_are_refs_not_proof:
      principles.evidence_chains_are_refs_not_proof === true &&
      digestValidation.evidence_chains_refs_not_proof,
    evidence_rays_are_refs_not_proof:
      principles.evidence_rays_are_refs_not_proof === true,
    recommended_retrieval_expansion_advisory_only:
      validationPolicy.recommended_retrieval_expansion_advisory_only === true &&
      recommendationPolicy.recommended_retrieval_expansion_advisory_only === true &&
      digestValidation.retrieval_expansion_advisory_only,
    recommended_retrieval_expansion_does_not_execute_retrieval:
      validationPolicy
        .recommended_retrieval_expansion_does_not_execute_retrieval === true &&
      recommendationPolicy.retrieval_execution_now === false &&
      digestValidation.retrieval_execution_now_false,
    candidate_overlay_and_durable_graph_distinct:
      principles.candidate_overlay_and_durable_graph_distinct === true,
    salience_state_not_authority: principles.salience_state_not_authority === true,
    perspective_snapshot_is_derived_view:
      principles.perspective_snapshot_is_derived_view === true,
    all_digest_items_public_safe:
      digest.all_items_public_safe === true &&
      referenceValidation.public_safe_refs_only,
    all_digest_items_source_ref_backed_or_gap_reason_backed:
      digest.all_items_source_ref_backed_or_gap_reason_backed === true &&
      digestValidation.all_items_source_ref_backed_or_gap_reason_backed,
    geometry_digest_runtime_build_not_implemented:
      boundary.geometry_digest_runtime_build_implemented_now === false,
    geometry_digest_write_not_implemented:
      boundary.geometry_digest_write_now === false,
    geometry_calculation_runtime_not_implemented:
      boundary.geometry_calculation_runtime_now === false,
    runtime_layout_not_implemented:
      boundary.runtime_layout_implemented_now === false &&
      boundary.runtime_layout_execution_now === false,
    graph_db_not_implemented: boundary.graph_db_implemented_now === false,
    graph_mutation_now_false: boundary.graph_mutation_now === false,
    ui_rendering_not_implemented: boundary.component_changed_now === false,
    browser_request_now_false: boundary.browser_request_now === false,
    ai_context_packet_not_implemented:
      boundary.ai_context_packet_implemented_now === false,
    codex_handoff_not_implemented:
      boundary.codex_handoff_implemented_now === false,
    runtime_state_read_write_not_implemented:
      boundary.durable_perspective_state_read_now === false &&
      boundary.durable_perspective_state_write_now === false,
    durable_perspective_delta_apply_not_implemented:
      boundary.durable_perspective_delta_apply_now === false,
    proof_or_evidence_write_not_implemented:
      boundary.proof_or_evidence_record_write_now === false,
    accepted_evidence_write_not_implemented:
      boundary.accepted_evidence_write_now === false,
    formation_receipt_write_not_implemented:
      boundary.formation_receipt_write_now === false,
    work_mutation_now_false: boundary.work_mutation_now === false,
    retrieval_rag_execution_not_implemented:
      boundary.runtime_retrieval_rag_implemented_now === false &&
      boundary.retrieval_rag_authority === false,
    provider_openai_call_not_implemented:
      boundary.provider_openai_call_now === false,
    source_fetch_not_implemented: boundary.source_fetch_now === false,
    crawler_not_implemented: boundary.crawler_now === false,
    public_safe_refs_only: referenceValidation.public_safe_refs_only,
    no_raw_private_source_body:
      referenceValidation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      referenceValidation.no_raw_provider_thread_run_session_ids,
    no_private_urls: referenceValidation.no_private_urls,
    no_secrets: referenceValidation.no_secrets,
  };
  for (const [key, value] of Object.entries(validationWithoutFailureCodes)) {
    if (value !== true) {
      failureCodes.add(key);
    }
  }

  return {
    passed: failureCodes.size === 0,
    failure_codes: [...failureCodes].sort(),
    ...validationWithoutFailureCodes,
  };
}


function buildDigestPrincipleSummary(
  contract: PerspectiveGeometryDigestContract,
): PerspectiveGeometryDigestPrincipleSummary {
  return {
    ...clone(contract.digest_principles),
    digest_principle_count: Object.keys(contract.digest_principles).length,
    all_digest_principles_preserved: allTrue(contract.digest_principles),
  };
}

function buildClusterDigestFamilySummary(
  contract: PerspectiveGeometryDigestContract,
): PerspectiveGeometryClusterDigestFamilySummary {
  return {
    cluster_digest_family_count: contract.cluster_digest_families.length,
    cluster_kinds: contract.cluster_digest_families.map(
      (family) => family.cluster_kind,
    ),
    all_cluster_digest_families_preserved: validateClusterFamilies(
      contract.cluster_digest_families,
    ),
    all_cluster_digests_interpretation_only:
      contract.cluster_digest_families.every(
        (family) => family.interpretation_only === true,
      ),
    all_cluster_digests_not_truth: contract.cluster_digest_families.every(
      (family) => family.not_truth === true,
    ),
    all_cluster_digests_runtime_write_now_false:
      contract.cluster_digest_families.every(
        (family) => family.runtime_write_now === false,
      ),
  };
}

function buildNodeDigestFamilySummary(
  contract: PerspectiveGeometryDigestContract,
): PerspectiveGeometryNodeDigestFamilySummary {
  return {
    node_digest_family_count: contract.node_digest_families.length,
    node_digest_kinds: contract.node_digest_families.map(
      (family) => family.node_digest_kind,
    ),
    all_node_digest_families_preserved: validateNodeFamilies(
      contract.node_digest_families,
    ),
    bridge_nodes_visible: contract.node_digest_families.some(
      (family) =>
        family.node_digest_kind === "bridge_node_digest" &&
        family.navigation_hint_only === true,
    ),
    stale_high_gravity_nodes_visible: contract.node_digest_families.some(
      (family) =>
        family.node_digest_kind === "stale_high_gravity_node_digest" &&
        family.stale_marker_visible === true &&
        family.not_authority === true,
    ),
    candidate_overlay_digest_distinct: contract.node_digest_families.some(
      (family) =>
        family.node_digest_kind === "candidate_overlay_node_digest" &&
        family.candidate_only === true &&
        family.durable_graph_ref_forbidden === true,
    ),
    all_node_digests_runtime_write_now_false:
      contract.node_digest_families.every(
        (family) => family.runtime_write_now === false,
      ),
  };
}

function buildRelationshipDigestFamilySummary(
  contract: PerspectiveGeometryDigestContract,
): PerspectiveGeometryRelationshipDigestFamilySummary {
  return {
    relationship_digest_family_count:
      contract.relationship_digest_families.length,
    relationship_kinds: contract.relationship_digest_families.map(
      (family) => family.relationship_kind,
    ),
    all_relationship_digest_families_preserved:
      validateRelationshipFamilies(contract.relationship_digest_families),
    contradiction_pairs_source_ref_backed:
      contract.relationship_digest_families.some(
        (family) =>
          family.relationship_kind === "contradiction_pair" &&
          family.source_refs_required === true &&
          family.not_resolution === true,
      ),
    evidence_chains_refs_not_proof:
      contract.relationship_digest_families.some(
        (family) =>
          family.relationship_kind === "evidence_chain" &&
          family.refs_only_not_proof === true &&
          family.proof_write_now === false,
      ),
    coverage_gaps_not_inferred_facts:
      contract.relationship_digest_families.some(
        (family) =>
          family.relationship_kind === "coverage_gap" &&
          family.not_inferred_fact === true,
      ),
    retrieval_expansion_advisory_only:
      contract.relationship_digest_families.some(
        (family) =>
          family.relationship_kind === "retrieval_expansion_hint" &&
          family.advisory_only === true &&
          family.retrieval_execution_now === false,
      ),
    all_relationship_digests_runtime_write_now_false:
      contract.relationship_digest_families.every(
        (family) => family.runtime_write_now === false,
      ),
  };
}

function buildDiagnosticFamilySummary(
  contract: PerspectiveGeometryDigestContract,
): PerspectiveGeometryDiagnosticFamilySummary {
  return {
    diagnostic_family_count: contract.diagnostic_families.length,
    diagnostic_kinds: contract.diagnostic_families.map(
      (family) => family.diagnostic_kind,
    ),
    all_diagnostic_families_preserved: validateDiagnosticFamilies(
      contract.diagnostic_families,
    ),
    all_diagnostics_advisory_only: contract.diagnostic_families.every(
      (family) => family.advisory_only === true,
    ),
    diagnostics_not_truth_or_authority: contract.diagnostic_families.every(
      (family) =>
        family.not_truth === true ||
        family.not_promotion_authority === true ||
        family.manual_gravity_not_authority === true ||
        family.not_authority === true ||
        family.navigation_hint_only === true ||
        family.gap_not_fact === true ||
        family.contradiction_not_resolution === true,
    ),
  };
}

function buildRecommendationSummary(
  contract: PerspectiveGeometryDigestContract,
): PerspectiveGeometryRecommendationSummary {
  const policy = contract.recommendation_policy;
  return {
    recommended_retrieval_expansion_allowed_later:
      policy.recommended_retrieval_expansion_allowed_later,
    recommended_retrieval_expansion_advisory_only:
      policy.recommended_retrieval_expansion_advisory_only,
    retrieval_execution_now_false: policy.retrieval_execution_now === false,
    recommended_review_focus_not_promotion_authority:
      policy.recommended_review_focus_not_promotion_authority,
    followups_allowed_later:
      policy.source_balance_followup_allowed_later &&
      policy.tension_review_allowed_later &&
      policy.gap_followup_allowed_later,
    work_mutation_now_false: policy.work_mutation_now === false,
  };
}

function buildReferenceSummary(
  digestInputPreview: JsonRecord,
  digestPreview: JsonRecord,
  privacyPolicy: PerspectiveGeometryDigestPrivacyPolicy,
): PerspectiveGeometryReferenceSummary {
  const referenceValidation = validateAllReferences(
    digestInputPreview,
    digestPreview,
    privacyPolicy,
  );
  const allRefs = collectStrings([digestInputPreview, digestPreview]).filter(
    (value) => value.includes(":public:"),
  );
  const countRefs = (prefix: string) =>
    allRefs.filter((value) => value.startsWith(prefix)).length;
  return {
    public_safe_refs_only: referenceValidation.public_safe_refs_only,
    no_raw_private_source_body:
      referenceValidation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      referenceValidation.no_raw_provider_thread_run_session_ids,
    no_private_urls: referenceValidation.no_private_urls,
    no_secrets: referenceValidation.no_secrets,
    digest_ref_count: countRefs("geometry_digest_ref:public:"),
    cluster_ref_count: countRefs("cluster_ref:public:"),
    node_ref_count: countRefs("node_ref:public:"),
    edge_ref_count: countRefs("edge_ref:public:"),
    source_ref_count: countRefs("source_ref:public:"),
    perspective_ref_count:
      countRefs("perspective_snapshot_ref:public:") +
      countRefs("perspective_state_ref:public:"),
    candidate_ref_count: countRefs("candidate_overlay_ref:public:"),
    evidence_ref_count:
      countRefs("accepted_evidence_ref:public:") +
      countRefs("evidence_ray_ref:public:"),
    tension_ref_count: countRefs("tension_ref:public:"),
    knowledge_gap_ref_count: countRefs("knowledge_gap_ref:public:"),
  };
}

function validateDigestPreview(
  digest: PerspectiveGeometryDigestPreview & JsonRecord,
  failureCodes: Set<string>,
) {
  if (!hasText(digest.digest_id)) {
    failureCodes.add("digest_preview_missing_digest_id");
    failureCodes.add("digest_id_missing");
  }
  if (!hasPublicSafeRefs(digest.source_refs)) {
    failureCodes.add("digest_preview_missing_source_refs");
    failureCodes.add("source_refs_missing");
  }
  if (digest.raw_coordinates_used_as_truth !== false) {
    failureCodes.add("digest_preview_raw_coordinates_used_as_truth");
  }
  if (digest.raw_coordinate_only_digest !== false) {
    failureCodes.add("digest_preview_raw_coordinate_only_digest_enabled");
    failureCodes.add("raw_coordinate_only_digest_enabled");
  }
  if (hasRuntimeWriteEnabled(digest)) {
    failureCodes.add("digest_preview_runtime_write_enabled");
  }
  if (digest.all_items_public_safe !== true) {
    failureCodes.add("digest_preview_not_public_safe");
  }
  if (!nonEmptyArray(digest.contradiction_pairs)) {
    failureCodes.add("digest_preview_missing_contradiction_pairs");
  }
  if (!nonEmptyArray(digest.coverage_gaps)) {
    failureCodes.add("digest_preview_missing_coverage_gaps");
  }
  if (!nonEmptyArray(digest.recommended_retrieval_expansion)) {
    failureCodes.add("digest_preview_missing_recommended_retrieval_expansion");
  }
  if (collectRecords(digest).some((record) => record.retrieval_execution_now === true)) {
    failureCodes.add("digest_preview_retrieval_execution_enabled");
  }
  const diagnostics = getRecord(digest.diagnostics);
  const diagnosticsAreAdvisory = Object.values(diagnostics)
    .filter(isRecord)
    .every((record) => record.advisory_only === true);
  const contradictionPairsSourceRefBacked = implementationAsArray(
    digest.contradiction_pairs,
  ).every((item) => hasPublicSafeRefs(getRecord(item).source_refs));
  const contradictionNotResolution = implementationAsArray(digest.contradiction_pairs).every(
    (item) => getRecord(item).not_resolution === true,
  );
  const evidenceChainsRefsNotProof = implementationAsArray(digest.evidence_chains).every(
    (item) => {
      const record = getRecord(item);
      return (
        hasPublicSafeRefs(record.evidence_refs) &&
        hasPublicSafeRefs(record.claim_refs) &&
        record.refs_only_not_proof === true &&
        record.proof_write_now === false
      );
    },
  );
  const coverageGapsNotInferredFacts = implementationAsArray(digest.coverage_gaps).every(
    (item) => getRecord(item).not_inferred_fact === true,
  );
  const retrievalExpansionAdvisoryOnly = implementationAsArray(
    digest.recommended_retrieval_expansion,
  ).every((item) => getRecord(item).advisory_only === true);
  const retrievalExecutionNowFalse = implementationAsArray(
    digest.recommended_retrieval_expansion,
  ).every((item) => getRecord(item).retrieval_execution_now === false);
  const allItemsSourceBackedOrGapReasonBacked = [
    ...implementationAsArray(digest.dominant_clusters),
    ...implementationAsArray(digest.underrepresented_clusters),
    ...implementationAsArray(digest.bridge_nodes),
    ...implementationAsArray(digest.stale_high_gravity_nodes),
    ...implementationAsArray(digest.contradiction_pairs),
    ...implementationAsArray(digest.evidence_chains),
    ...implementationAsArray(digest.coverage_gaps),
    ...implementationAsArray(digest.recommended_retrieval_expansion),
  ].every((item) => {
    const record = getRecord(item);
    return hasPublicSafeRefs(record.source_refs) || hasText(record.gap_reason) || record.source_refs_or_gap_reason_required === true;
  });
  return {
    digest_preview_follows_contract:
      hasText(digest.digest_id) &&
      digest.digest_version === "perspective_geometry_digest.v0.1" &&
      hasPublicSafeRefs(digest.source_refs) &&
      digest.raw_coordinates_used_as_truth === false &&
      digest.raw_coordinate_only_digest === false &&
      digest.all_items_public_safe === true &&
      digest.all_items_source_ref_backed_or_gap_reason_backed === true &&
      digest.all_runtime_write_now_false === true,
    diagnostics_are_advisory_only: diagnosticsAreAdvisory,
    contradiction_pairs_source_ref_backed:
      contradictionPairsSourceRefBacked,
    contradiction_not_resolution: contradictionNotResolution,
    evidence_chains_refs_not_proof: evidenceChainsRefsNotProof,
    coverage_gaps_not_inferred_facts: coverageGapsNotInferredFacts,
    retrieval_expansion_advisory_only: retrievalExpansionAdvisoryOnly,
    retrieval_execution_now_false: retrievalExecutionNowFalse,
    all_items_source_ref_backed_or_gap_reason_backed:
      allItemsSourceBackedOrGapReasonBacked,
  };
}

function validateClusters(
  digest: PerspectiveGeometryDigestPreview & JsonRecord,
  failureCodes: Set<string>,
) {
  const clusters = [
    ...implementationAsArray(digest.dominant_clusters),
    ...implementationAsArray(digest.underrepresented_clusters),
    ...implementationAsArray(digest.stale_influential_clusters),
  ].map(getRecord);
  for (const cluster of clusters) {
    if (!hasText(cluster.cluster_ref)) {
      failureCodes.add("cluster_digest_missing_cluster_ref");
    }
    if (!hasPublicSafeRefs(cluster.source_refs)) {
      failureCodes.add("cluster_digest_missing_source_refs");
    }
    if (cluster.interpretation_only !== true) {
      failureCodes.add("cluster_digest_not_interpretation_only");
    }
    if (cluster.not_truth !== true) {
      failureCodes.add("cluster_digest_truth_enabled");
    }
    if (cluster.runtime_write_now !== false) {
      failureCodes.add("cluster_digest_runtime_write_enabled");
    }
    if (
      cluster.cluster_kind === "underrepresented_cluster" &&
      !hasText(cluster.underrepresentation_reason)
    ) {
      failureCodes.add("underrepresented_cluster_missing_reason");
    }
    if (
      cluster.cluster_kind === "stale_influential_cluster" &&
      cluster.stale_marker_required !== true
    ) {
      failureCodes.add("stale_influential_cluster_missing_stale_marker");
    }
  }
}

function validateNodeDigests(
  digest: PerspectiveGeometryDigestPreview & JsonRecord,
  failureCodes: Set<string>,
) {
  const nodeDigests = [
    ...implementationAsArray(digest.bridge_nodes),
    ...implementationAsArray(digest.stale_high_gravity_nodes),
    ...implementationAsArray(digest.node_digests),
  ].map(getRecord);
  for (const node of nodeDigests) {
    const nodeKind = node.node_digest_kind;
    if (
      !hasText(node.node_ref) &&
      nodeKind !== "tension_node_digest" &&
      nodeKind !== "knowledge_gap_node_digest" &&
      nodeKind !== "source_reference_node_digest"
    ) {
      failureCodes.add("node_digest_missing_node_ref");
    }
    if (!hasPublicSafeRefs(node.source_refs) && !hasText(node.source_ref)) {
      failureCodes.add("node_digest_missing_source_refs");
    }
    if (
      nodeKind === "bridge_node_digest" &&
      node.navigation_hint_only !== true
    ) {
      failureCodes.add("bridge_node_digest_not_navigation_hint");
    }
    if (
      nodeKind === "stale_high_gravity_node_digest" &&
      node.not_authority !== true
    ) {
      failureCodes.add("stale_high_gravity_node_authority_enabled");
    }
    if (
      nodeKind === "tension_node_digest" &&
      node.resolution_not_implied !== true
    ) {
      failureCodes.add("tension_node_resolution_implied");
    }
    if (
      nodeKind === "knowledge_gap_node_digest" &&
      node.closure_not_implied !== true
    ) {
      failureCodes.add("knowledge_gap_node_closure_implied");
    }
    if (
      nodeKind === "candidate_overlay_node_digest" &&
      node.candidate_only !== true
    ) {
      failureCodes.add("candidate_overlay_node_not_candidate_only");
    }
    if (
      nodeKind === "candidate_overlay_node_digest" &&
      node.durable_graph_ref_forbidden !== true
    ) {
      failureCodes.add("candidate_overlay_node_durable_graph_ref_enabled");
    }
    if (
      nodeKind === "source_reference_node_digest" &&
      node.raw_source_body_forbidden !== true
    ) {
      failureCodes.add("source_reference_node_raw_body_enabled");
    }
    if (node.runtime_write_now !== false) {
      failureCodes.add("node_digest_runtime_write_enabled");
    }
  }
}

function validateRelationships(
  digest: PerspectiveGeometryDigestPreview & JsonRecord,
  failureCodes: Set<string>,
) {
  const relationships = [
    ...implementationAsArray(digest.contradiction_pairs),
    ...implementationAsArray(digest.coverage_gaps),
    ...implementationAsArray(digest.evidence_chains),
    ...implementationAsArray(digest.recommended_retrieval_expansion),
    ...implementationAsArray(digest.relationship_digests),
  ].map(getRecord);
  for (const relationship of relationships) {
    if (!hasText(relationship.relationship_kind)) {
      failureCodes.add("relationship_digest_missing_relationship_kind");
    }
    if (
      hasText(relationship.relationship_kind) &&
      !expectedRelationshipKinds.includes(
        relationship.relationship_kind as PerspectiveGeometryRelationshipDigestKind,
      )
    ) {
      failureCodes.add("relationship_digest_unknown_family_kind");
    }
    if (
      relationship.relationship_kind === "contradiction_pair" &&
      !hasPublicSafeRefs(relationship.source_refs)
    ) {
      failureCodes.add("contradiction_pair_missing_source_refs");
    }
    if (
      relationship.relationship_kind === "contradiction_pair" &&
      relationship.not_resolution !== true
    ) {
      failureCodes.add("contradiction_pair_resolution_enabled");
    }
    if (
      relationship.relationship_kind === "evidence_chain" &&
      relationship.proof_write_now !== false
    ) {
      failureCodes.add("evidence_chain_proof_write_enabled");
    }
    if (
      relationship.relationship_kind === "evidence_chain" &&
      (!hasPublicSafeRefs(relationship.evidence_refs) ||
        !hasPublicSafeRefs(relationship.claim_refs))
    ) {
      failureCodes.add("evidence_chain_missing_refs");
      failureCodes.add("evidence_chain_missing_evidence_refs");
    }
    if (
      relationship.relationship_kind === "coverage_gap" &&
      relationship.not_inferred_fact !== true
    ) {
      failureCodes.add("coverage_gap_inferred_fact_enabled");
    }
    if (
      relationship.relationship_kind === "coverage_gap" &&
      !hasText(relationship.gap_reason)
    ) {
      failureCodes.add("coverage_gap_missing_gap_reason");
    }
    if (
      relationship.relationship_kind === "retrieval_expansion_hint" &&
      relationship.advisory_only !== true
    ) {
      failureCodes.add("retrieval_expansion_not_advisory");
    }
    if (
      relationship.relationship_kind === "retrieval_expansion_hint" &&
      relationship.retrieval_execution_now !== false
    ) {
      failureCodes.add("retrieval_expansion_execution_enabled");
    }
    if (
      relationship.relationship_kind === "retrieval_expansion_hint" &&
      !hasText(relationship.expansion_reason)
    ) {
      failureCodes.add("recommended_retrieval_expansion_missing_reason");
    }
    if (relationship.runtime_write_now !== false) {
      failureCodes.add("relationship_digest_runtime_write_enabled");
    }
  }
}

function validateDiagnostics(
  digest: PerspectiveGeometryDigestPreview & JsonRecord,
  failureCodes: Set<string>,
) {
  for (const diagnostic of Object.values(getRecord(digest.diagnostics)).filter(
    isRecord,
  )) {
    if (
      hasText(diagnostic.diagnostic_kind) &&
      !expectedDiagnosticKinds.includes(
        diagnostic.diagnostic_kind as PerspectiveGeometryDiagnosticKind,
      )
    ) {
      failureCodes.add("diagnostic_unknown_family_kind");
    }
    if (diagnostic.advisory_only !== true) {
      failureCodes.add("diagnostic_not_advisory");
    }
    if (diagnostic.not_truth === false) {
      failureCodes.add("diagnostic_truth_enabled");
    }
    if (diagnostic.not_promotion_authority === false) {
      failureCodes.add("diagnostic_promotion_authority_enabled");
    }
    if (
      diagnostic.diagnostic_kind === "manual_gravity_distribution" &&
      diagnostic.manual_gravity_not_authority !== true
    ) {
      failureCodes.add("manual_gravity_distribution_authority_enabled");
    }
    if (
      diagnostic.diagnostic_kind === "coverage_gap_count" &&
      diagnostic.gap_not_fact !== true
    ) {
      failureCodes.add("coverage_gap_count_fact_enabled");
    }
    if (
      diagnostic.diagnostic_kind === "contradiction_pair_count" &&
      diagnostic.contradiction_not_resolution !== true
    ) {
      failureCodes.add("contradiction_pair_count_resolution_enabled");
    }
  }
}

function validateAuthorityBoundary(
  boundary: JsonRecord,
  failureCodes: Set<string>,
) {
  const authorityFailureCodes: Record<string, string> = {
    geometry_digest_runtime_build_implemented_now:
      "geometry_digest_runtime_build_enabled",
    geometry_digest_write_now: "geometry_digest_write_enabled",
    geometry_calculation_runtime_now: "geometry_calculation_runtime_enabled",
    raw_coordinate_authority: "raw_coordinate_authority_enabled",
    raw_coordinate_only_digest_now: "raw_coordinate_only_digest_enabled",
    runtime_layout_execution_now: "runtime_layout_enabled",
    graph_db_implemented_now: "graph_db_enabled",
    graph_mutation_now: "graph_mutation_enabled",
    component_changed_now: "component_changed_enabled",
    route_changed_now: "route_changed_enabled",
    browser_request_now: "browser_request_enabled",
    browser_persistence_now: "browser_persistence_enabled",
    request_animation_frame_now: "request_animation_frame_enabled",
    durable_perspective_state_read_now:
      "durable_perspective_state_read_enabled",
    durable_perspective_state_write_now:
      "durable_perspective_state_write_enabled",
    durable_perspective_delta_apply_now:
      "durable_perspective_delta_apply_enabled",
    ai_context_packet_implemented_now: "ai_context_packet_enabled",
    codex_handoff_implemented_now: "codex_handoff_enabled",
    proof_or_evidence_record_write_now:
      "proof_or_evidence_record_write_enabled",
    accepted_evidence_write_now: "accepted_evidence_write_enabled",
    formation_receipt_write_now: "formation_receipt_write_enabled",
    work_mutation_now: "work_mutation_enabled",
    runtime_db_query_now: "runtime_db_query_enabled",
    runtime_db_write_now: "runtime_db_write_enabled",
    provider_openai_call_now: "provider_openai_call_enabled",
    runtime_retrieval_rag_implemented_now: "retrieval_rag_execution_enabled",
    source_fetch_now: "source_fetch_enabled",
    crawler_now: "crawler_enabled",
    geometry_digest_authority: "geometry_digest_authority_enabled",
    diagnostic_authority: "diagnostic_authority_enabled",
    recommendation_authority: "recommendation_authority_enabled",
    product_write_authority: "product_write_enabled",
    product_id_allocation_authority: "product_id_allocation_enabled",
  };
  for (const [field, failureCode] of Object.entries(authorityFailureCodes)) {
    if (boundary[field] !== false) {
      failureCodes.add(failureCode);
    }
  }
}

function invalidDigestPreviewOverrideRejected(
  bundle: PerspectiveGeometryDigestPreviewBundle,
  contract: PerspectiveGeometryDigestContract,
): boolean {
  const invalidBundle = clone(bundle);
  Object.assign(invalidBundle.geometry_digest_preview, {
    digest_id: "",
    source_refs: [],
    raw_coordinates_used_as_truth: true,
    raw_coordinate_only_digest: true,
    runtime_write_now: true,
    all_items_public_safe: false,
    contradiction_pairs: [],
    coverage_gaps: [],
    recommended_retrieval_expansion: [
      {
        relationship_ref: "relationship_ref:public:bad_retrieval",
        relationship_kind: "retrieval_expansion_hint",
        expansion_reason: "public-safe invalid override",
        advisory_only: true,
        retrieval_execution_now: true,
        runtime_write_now: false,
      },
    ],
  });
  const validation = validatePerspectiveGeometryDigestPreviewBundle(
    withoutValidation(invalidBundle),
    contract,
  );
  return containsFailureCodes(validation, [
    "digest_preview_missing_digest_id",
    "digest_preview_missing_source_refs",
    "digest_preview_raw_coordinates_used_as_truth",
    "digest_preview_raw_coordinate_only_digest_enabled",
    "digest_preview_runtime_write_enabled",
    "digest_preview_not_public_safe",
    "digest_preview_missing_contradiction_pairs",
    "digest_preview_missing_coverage_gaps",
    "digest_preview_retrieval_execution_enabled",
  ]);
}

function invalidClusterDigestOverrideRejected(
  bundle: PerspectiveGeometryDigestPreviewBundle,
  contract: PerspectiveGeometryDigestContract,
): boolean {
  const invalidBundle = clone(bundle);
  invalidBundle.geometry_digest_preview.dominant_clusters = [
    {
      cluster_ref: "",
      cluster_kind: "dominant_cluster",
      source_refs: [],
      interpretation_only: false,
      not_truth: false,
      runtime_write_now: true,
    },
  ];
  invalidBundle.geometry_digest_preview.underrepresented_clusters = [
    {
      cluster_ref: "cluster_ref:public:bad_underrepresented",
      cluster_kind: "underrepresented_cluster",
      source_refs: ["source_ref:public:bad_underrepresented"],
      interpretation_only: true,
      not_truth: true,
      runtime_write_now: false,
    },
  ];
  invalidBundle.geometry_digest_preview.stale_influential_clusters = [
    {
      cluster_ref: "cluster_ref:public:bad_stale",
      cluster_kind: "stale_influential_cluster",
      source_refs: ["source_ref:public:bad_stale"],
      interpretation_only: true,
      not_truth: true,
      runtime_write_now: false,
    },
  ];
  const validation = validatePerspectiveGeometryDigestPreviewBundle(
    withoutValidation(invalidBundle),
    contract,
  );
  return containsFailureCodes(validation, [
    "cluster_digest_missing_cluster_ref",
    "cluster_digest_missing_source_refs",
    "cluster_digest_not_interpretation_only",
    "cluster_digest_truth_enabled",
    "cluster_digest_runtime_write_enabled",
    "underrepresented_cluster_missing_reason",
    "stale_influential_cluster_missing_stale_marker",
  ]);
}

function invalidNodeDigestOverrideRejected(
  bundle: PerspectiveGeometryDigestPreviewBundle,
  contract: PerspectiveGeometryDigestContract,
): boolean {
  const invalidBundle = clone(bundle);
  invalidBundle.geometry_digest_preview.node_digests = [
    {
      node_ref: "",
      node_digest_kind: "bridge_node_digest",
      source_refs: [],
      navigation_hint_only: false,
      runtime_write_now: false,
    },
    {
      node_ref: "node_ref:public:bad_stale",
      node_digest_kind: "stale_high_gravity_node_digest",
      source_refs: ["source_ref:public:bad_stale"],
      not_authority: false,
      runtime_write_now: false,
    },
    {
      tension_ref: "tension_ref:public:bad_tension",
      node_digest_kind: "tension_node_digest",
      source_refs: ["source_ref:public:bad_tension"],
      resolution_not_implied: false,
      runtime_write_now: false,
    },
    {
      knowledge_gap_ref: "knowledge_gap_ref:public:bad_gap",
      node_digest_kind: "knowledge_gap_node_digest",
      source_refs: ["source_ref:public:bad_gap"],
      closure_not_implied: false,
      runtime_write_now: false,
    },
    {
      node_ref: "node_ref:public:bad_candidate",
      node_digest_kind: "candidate_overlay_node_digest",
      source_refs: ["source_ref:public:bad_candidate"],
      candidate_only: false,
      durable_graph_ref_forbidden: false,
      runtime_write_now: false,
    },
    {
      node_digest_kind: "source_reference_node_digest",
      source_ref: "source_ref:public:bad_source",
      raw_source_body_forbidden: false,
      runtime_write_now: true,
    },
  ];
  const validation = validatePerspectiveGeometryDigestPreviewBundle(
    withoutValidation(invalidBundle),
    contract,
  );
  return containsFailureCodes(validation, [
    "node_digest_missing_node_ref",
    "node_digest_missing_source_refs",
    "bridge_node_digest_not_navigation_hint",
    "stale_high_gravity_node_authority_enabled",
    "tension_node_resolution_implied",
    "knowledge_gap_node_closure_implied",
    "candidate_overlay_node_not_candidate_only",
    "candidate_overlay_node_durable_graph_ref_enabled",
    "source_reference_node_raw_body_enabled",
    "node_digest_runtime_write_enabled",
  ]);
}

function invalidRelationshipDigestOverrideRejected(
  bundle: PerspectiveGeometryDigestPreviewBundle,
  contract: PerspectiveGeometryDigestContract,
): boolean {
  const invalidBundle = clone(bundle);
  invalidBundle.geometry_digest_preview.relationship_digests = [
    {
      relationship_ref: "relationship_ref:public:missing_kind",
      runtime_write_now: false,
    },
    {
      relationship_ref: "relationship_ref:public:unknown_kind",
      relationship_kind: "unknown_family_kind",
      runtime_write_now: false,
    },
    {
      relationship_ref: "relationship_ref:public:bad_contradiction",
      relationship_kind: "contradiction_pair",
      source_refs: [],
      not_resolution: false,
      runtime_write_now: false,
    },
    {
      relationship_ref: "relationship_ref:public:bad_evidence",
      relationship_kind: "evidence_chain",
      evidence_refs: [],
      claim_refs: [],
      proof_write_now: true,
      runtime_write_now: false,
    },
    {
      relationship_ref: "relationship_ref:public:bad_gap",
      relationship_kind: "coverage_gap",
      not_inferred_fact: false,
      runtime_write_now: false,
    },
    {
      relationship_ref: "relationship_ref:public:bad_retrieval",
      relationship_kind: "retrieval_expansion_hint",
      advisory_only: false,
      retrieval_execution_now: true,
      runtime_write_now: true,
    },
  ];
  const validation = validatePerspectiveGeometryDigestPreviewBundle(
    withoutValidation(invalidBundle),
    contract,
  );
  return containsFailureCodes(validation, [
    "relationship_digest_missing_relationship_kind",
    "relationship_digest_unknown_family_kind",
    "contradiction_pair_missing_source_refs",
    "contradiction_pair_resolution_enabled",
    "evidence_chain_proof_write_enabled",
    "evidence_chain_missing_refs",
    "coverage_gap_inferred_fact_enabled",
    "retrieval_expansion_not_advisory",
    "retrieval_expansion_execution_enabled",
    "relationship_digest_runtime_write_enabled",
  ]);
}

function invalidDiagnosticOverrideRejected(
  bundle: PerspectiveGeometryDigestPreviewBundle,
  contract: PerspectiveGeometryDigestContract,
): boolean {
  const invalidBundle = clone(bundle);
  invalidBundle.geometry_digest_preview.diagnostics = {
    unknown: {
      diagnostic_kind: "unknown_family_kind",
      advisory_only: true,
    },
    cluster_balance: {
      diagnostic_kind: "cluster_balance",
      advisory_only: false,
      not_truth: false,
      not_promotion_authority: false,
    },
    manual_gravity_distribution: {
      diagnostic_kind: "manual_gravity_distribution",
      advisory_only: true,
      manual_gravity_not_authority: false,
    },
    coverage_gap_count: {
      diagnostic_kind: "coverage_gap_count",
      advisory_only: true,
      gap_not_fact: false,
    },
    contradiction_pair_count: {
      diagnostic_kind: "contradiction_pair_count",
      advisory_only: true,
      contradiction_not_resolution: false,
    },
  };
  const validation = validatePerspectiveGeometryDigestPreviewBundle(
    withoutValidation(invalidBundle),
    contract,
  );
  return containsFailureCodes(validation, [
    "diagnostic_unknown_family_kind",
    "diagnostic_not_advisory",
    "diagnostic_truth_enabled",
    "diagnostic_promotion_authority_enabled",
    "manual_gravity_distribution_authority_enabled",
    "coverage_gap_count_fact_enabled",
    "contradiction_pair_count_resolution_enabled",
  ]);
}

function invalidAuthorityBoundaryOverrideRejected(
  bundle: PerspectiveGeometryDigestPreviewBundle,
  contract: PerspectiveGeometryDigestContract,
): boolean {
  const invalidBundle = clone(bundle);
  Object.assign(invalidBundle.authority_boundary, {
    geometry_digest_runtime_build_implemented_now: invalidEnabled,
    geometry_digest_write_now: invalidEnabled,
    geometry_calculation_runtime_now: invalidEnabled,
    raw_coordinate_authority: invalidEnabled,
    raw_coordinate_only_digest_now: invalidEnabled,
    runtime_layout_execution_now: invalidEnabled,
    graph_db_implemented_now: invalidEnabled,
    graph_mutation_now: invalidEnabled,
    component_changed_now: invalidEnabled,
    route_changed_now: invalidEnabled,
    browser_request_now: invalidEnabled,
    browser_persistence_now: invalidEnabled,
    request_animation_frame_now: invalidEnabled,
    durable_perspective_state_read_now: invalidEnabled,
    durable_perspective_state_write_now: invalidEnabled,
    durable_perspective_delta_apply_now: invalidEnabled,
    ai_context_packet_implemented_now: invalidEnabled,
    codex_handoff_implemented_now: invalidEnabled,
    proof_or_evidence_record_write_now: invalidEnabled,
    accepted_evidence_write_now: invalidEnabled,
    formation_receipt_write_now: invalidEnabled,
    work_mutation_now: invalidEnabled,
    runtime_db_query_now: invalidEnabled,
    runtime_db_write_now: invalidEnabled,
    provider_openai_call_now: invalidEnabled,
    runtime_retrieval_rag_implemented_now: invalidEnabled,
    source_fetch_now: invalidEnabled,
    crawler_now: invalidEnabled,
    geometry_digest_authority: invalidEnabled,
    diagnostic_authority: invalidEnabled,
    recommendation_authority: invalidEnabled,
    product_write_authority: invalidEnabled,
    product_id_allocation_authority: invalidEnabled,
  });
  const validation = validatePerspectiveGeometryDigestPreviewBundle(
    withoutValidation(invalidBundle),
    contract,
  );
  return containsFailureCodes(validation, [
    "geometry_digest_runtime_build_enabled",
    "geometry_digest_write_enabled",
    "geometry_calculation_runtime_enabled",
    "raw_coordinate_authority_enabled",
    "raw_coordinate_only_digest_enabled",
    "runtime_layout_enabled",
    "graph_db_enabled",
    "graph_mutation_enabled",
    "component_changed_enabled",
    "route_changed_enabled",
    "browser_request_enabled",
    "browser_persistence_enabled",
    "request_animation_frame_enabled",
    "durable_perspective_state_read_enabled",
    "durable_perspective_state_write_enabled",
    "durable_perspective_delta_apply_enabled",
    "ai_context_packet_enabled",
    "codex_handoff_enabled",
    "proof_or_evidence_record_write_enabled",
    "accepted_evidence_write_enabled",
    "formation_receipt_write_enabled",
    "work_mutation_enabled",
    "runtime_db_query_enabled",
    "runtime_db_write_enabled",
    "provider_openai_call_enabled",
    "retrieval_rag_execution_enabled",
    "source_fetch_enabled",
    "crawler_enabled",
    "geometry_digest_authority_enabled",
    "diagnostic_authority_enabled",
    "recommendation_authority_enabled",
    "product_write_enabled",
    "product_id_allocation_enabled",
  ]);
}

function invalidRefsOverrideRejected(
  bundle: PerspectiveGeometryDigestPreviewBundle,
  contract: PerspectiveGeometryDigestContract,
): boolean {
  const invalidBundle = clone(bundle);
  Object.assign(invalidBundle.geometry_digest_preview, {
    digest_id: "",
    source_refs: [],
    raw_private_source_body: "private body",
    provider_thread_run_session_id: "thread_123_run_456",
    private_url: "https://private.example.invalid/source",
    contradiction_pairs: [
      {
        relationship_ref: "relationship_ref:public:bad_contradiction_ref",
        relationship_kind: "contradiction_pair",
        node_refs: ["node_ref:public:a", "node_ref:public:b"],
        source_refs: [],
        not_resolution: true,
        runtime_write_now: false,
      },
    ],
    evidence_chains: [
      {
        relationship_ref: "relationship_ref:public:bad_evidence_ref",
        relationship_kind: "evidence_chain",
        evidence_refs: [],
        claim_refs: ["claim_ref:public:claim"],
        source_refs: ["source_ref:public:evidence_chain"],
        refs_only_not_proof: true,
        proof_write_now: false,
        runtime_write_now: false,
      },
    ],
    coverage_gaps: [
      {
        relationship_ref: "relationship_ref:public:bad_gap_ref",
        relationship_kind: "coverage_gap",
        knowledge_gap_ref: "knowledge_gap_ref:public:gap",
        source_refs_or_gap_reason_required: true,
        not_inferred_fact: true,
        runtime_write_now: false,
      },
    ],
    recommended_retrieval_expansion: [
      {
        relationship_ref: "relationship_ref:public:bad_expansion_ref",
        relationship_kind: "retrieval_expansion_hint",
        source_refs_or_gap_reason_required: true,
        advisory_only: true,
        retrieval_execution_now: false,
        runtime_write_now: false,
      },
    ],
  });
  const validation = validatePerspectiveGeometryDigestPreviewBundle(
    withoutValidation(invalidBundle),
    contract,
  );
  return containsFailureCodes(validation, [
    "digest_id_missing",
    "private_or_unstable_ref_detected",
    "source_refs_missing",
    "raw_private_source_body_detected",
    "raw_provider_thread_run_session_id_detected",
    "contradiction_pair_missing_source_refs",
    "evidence_chain_missing_evidence_refs",
    "coverage_gap_missing_gap_reason",
    "recommended_retrieval_expansion_missing_reason",
  ]);
}

function validateClusterFamilies(
  families: PerspectiveGeometryClusterDigestFamily[],
): boolean {
  return (
    deepEqual(
      families.map((family) => family.cluster_kind).sort(),
      [...expectedClusterKinds].sort(),
    ) &&
    families.every(
      (family) =>
        family.interpretation_only === true &&
        family.not_truth === true &&
        family.runtime_write_now === false,
    )
  );
}

function validateNodeFamilies(
  families: PerspectiveGeometryNodeDigestFamily[],
): boolean {
  return (
    deepEqual(
      families.map((family) => family.node_digest_kind).sort(),
      [...expectedNodeDigestKinds].sort(),
    ) && families.every((family) => family.runtime_write_now === false)
  );
}

function validateRelationshipFamilies(
  families: PerspectiveGeometryRelationshipDigestFamily[],
): boolean {
  return (
    deepEqual(
      families.map((family) => family.relationship_kind).sort(),
      [...expectedRelationshipKinds].sort(),
    ) && families.every((family) => family.runtime_write_now === false)
  );
}

function validateDiagnosticFamilies(
  families: PerspectiveGeometryDiagnosticFamily[],
): boolean {
  return (
    deepEqual(
      families.map((family) => family.diagnostic_kind).sort(),
      [...expectedDiagnosticKinds].sort(),
    ) && families.every((family) => family.advisory_only === true)
  );
}

function defaultImplementationAuthorityBoundary(): PerspectiveGeometryDigestImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    deterministic_builder_added_now: true,
    contract_changed_now: false,
    geometry_digest_runtime_build_implemented_now: false,
    geometry_digest_write_now: false,
    geometry_calculation_runtime_now: false,
    raw_coordinate_authority: false,
    raw_coordinate_only_digest_now: false,
    runtime_layout_implemented_now: false,
    runtime_layout_execution_now: false,
    seeded_layout_runtime_now: false,
    force_directed_layout_runtime_now: false,
    temporal_smoothing_runtime_now: false,
    layout_persistence_now: false,
    layout_coordinate_write_now: false,
    graph_db_implemented_now: false,
    graph_mutation_now: false,
    component_changed_now: false,
    route_changed_now: false,
    browser_request_now: false,
    browser_persistence_now: false,
    request_animation_frame_now: false,
    durable_perspective_state_read_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_implemented_now: false,
    trajectory_runtime_build_implemented_now: false,
    ai_context_packet_implemented_now: false,
    codex_handoff_implemented_now: false,
    proof_or_evidence_record_write_now: false,
    accepted_evidence_write_now: false,
    formation_receipt_write_now: false,
    work_mutation_now: false,
    candidate_mutation_now: false,
    candidate_record_write_now: false,
    runtime_promotion_implemented_now: false,
    promotion_decision_record_implemented_now: false,
    promotion_decision_record_write_now: false,
    runtime_retrieval_rag_implemented_now: false,
    runtime_index_build_implemented_now: false,
    runtime_index_write_now: false,
    embedding_generation_implemented_now: false,
    vector_db_implemented_now: false,
    fts_implemented_now: false,
    provider_openai_call_now: false,
    provider_extraction_now: false,
    source_fetch_now: false,
    crawler_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
    runtime_persistence_implemented_now: false,
    durable_memory_write_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    layout_coordinate_authority: false,
    manual_anchor_authority: false,
    cluster_position_authority: false,
    geometry_digest_authority: false,
    diagnostic_authority: false,
    recommendation_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function defaultDeterministicBuilderBoundary() {
  return {
    builder_path: "lib/research-candidate-review/perspective-geometry-digest.ts",
    deterministic_fixture_backed_only: true,
    geometry_digest_runtime_build_now: false,
    geometry_digest_write_now: false,
    geometry_calculation_runtime_now: false,
    raw_coordinate_only_digest_now: false,
    runtime_layout_execution_now: false,
    seeded_layout_runtime_now: false,
    force_directed_layout_runtime_now: false,
    temporal_smoothing_runtime_now: false,
    layout_persistence_now: false,
    layout_coordinate_write_now: false,
    graph_db_now: false,
    graph_mutation_now: false,
    ui_rendering_now: false,
    browser_rendering_now: false,
    browser_request_now: false,
    browser_persistence_now: false,
    request_animation_frame_now: false,
    durable_perspective_state_read_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_now: false,
    ai_context_packet_now: false,
    codex_handoff_now: false,
    retrieval_rag_execution_now: false,
    provider_openai_call_now: false,
    source_fetch_now: false,
    crawler_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    production_db_used_now: false,
    durable_memory_write_now: false,
  } as const;
}

function validateAllReferences(
  digestInputPreview: JsonRecord,
  digestPreview: JsonRecord,
  privacyPolicy: PerspectiveGeometryDigestPrivacyPolicy,
) {
  const strings = collectStrings([digestInputPreview, digestPreview]);
  const records = collectRecords({ digestInputPreview, digestPreview });
  const publicSafeRefsOnly = strings
    .filter(isRefLike)
    .every((value) => value.includes(":public:") && !isPrivateOrUnstableRef(value));
  const noRawPrivateSourceBody =
    privacyPolicy.no_raw_source_body === true &&
    records.every(
      (record) =>
        !("raw_private_source_body" in record) &&
        !("raw_source_body" in record),
    );
  const noRawProviderThreadRunSessionIds =
    privacyPolicy.no_raw_provider_thread_run_session_ids === true &&
    strings.every((value) => !/\b(thread|run|session)_[A-Za-z0-9_-]+/.test(value));
  const noPrivateUrls =
    privacyPolicy.no_private_urls === true &&
    strings.every((value) => !/^https?:\/\//i.test(value));
  const noSecrets =
    privacyPolicy.no_secrets_in_fixture === true &&
    strings.every((value) => !/(sk-|secret|token|password|api[_-]?key)/i.test(value));
  return {
    public_safe_refs_only: publicSafeRefsOnly,
    no_raw_private_source_body: noRawPrivateSourceBody,
    no_raw_provider_thread_run_session_ids: noRawProviderThreadRunSessionIds,
    no_private_urls: noPrivateUrls,
    no_secrets: noSecrets,
  };
}

function withoutValidation(
  bundle: PerspectiveGeometryDigestPreviewBundle,
): Omit<PerspectiveGeometryDigestPreviewBundle, "validation"> {
  const { validation: _validation, ...bundleWithoutValidation } = bundle;
  return bundleWithoutValidation;
}

function containsFailureCodes(
  validation: PerspectiveGeometryDigestValidation,
  requiredFailureCodes: string[],
): boolean {
  return (
    validation.passed === false &&
    requiredFailureCodes.every((code) =>
      validation.failure_codes.includes(code),
    )
  );
}

function hasPublicSafeRefs(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        typeof item === "string" &&
        item.includes(":public:") &&
        !isPrivateOrUnstableRef(item),
    )
  );
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

function implementationAsArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function allTrue(value: object): boolean {
  return Object.values(value).every((entry) => entry === true);
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hasRuntimeWriteEnabled(value: unknown): boolean {
  return collectRecords(value).some(
    (record) => record.runtime_write_now === true,
  );
}

function collectRecords(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectRecords(entry));
  }
  if (!isRecord(value)) {
    return [];
  }
  return [
    value,
    ...Object.values(value).flatMap((entry) => collectRecords(entry)),
  ];
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectStrings(entry));
  }
  if (isRecord(value)) {
    return Object.values(value).flatMap((entry) => collectStrings(entry));
  }
  return [];
}

function isRefLike(value: string): boolean {
  return /^[a-z0-9_]+(_ref)?:/i.test(value) || value.includes("_ref:");
}

function isPrivateOrUnstableRef(value: string): boolean {
  return (
    value.includes(":private:") ||
    value.includes("localhost") ||
    value.includes("127.0.0.1") ||
    /^https?:\/\//i.test(value)
  );
}
