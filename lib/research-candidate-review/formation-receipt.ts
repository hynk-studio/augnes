import type {
  ResearchCandidateConstellationEdge,
  ResearchCandidateConstellationNode,
  ResearchCandidateConstellationOverlay,
} from "@/types/research-candidate-constellation-overlay";
import type {
  ResearchCandidateAIContextPacket,
} from "@/types/research-candidate-ai-context-packet";
import type {
  ResearchCandidateFormationReceipt,
  ResearchCandidateFormationReceiptArtifactKind,
  ResearchCandidateFormationReceiptAuthority,
  ResearchCandidateFormationReceiptEdgeContribution,
  ResearchCandidateFormationReceiptGuardrailContribution,
  ResearchCandidateFormationReceiptNodeContribution,
  ResearchCandidateFormationReceiptPacketSectionContribution,
  ResearchCandidateFormationReceiptSourceKind,
  ResearchCandidateFormationReceiptSourceRefContribution,
} from "@/types/research-candidate-formation-receipt";

export type ResearchCandidateFormationReceiptBuildOptions = {
  source_kind: ResearchCandidateFormationReceiptSourceKind;
  source_packet_fixture_path: string;
  source_overlay_fixture_path: string;
  artifact_kind: ResearchCandidateFormationReceiptArtifactKind;
};

type ResearchCandidateFormationReceiptContributions = {
  source_refs: ResearchCandidateFormationReceiptSourceRefContribution[];
  candidate_nodes: ResearchCandidateFormationReceiptNodeContribution[];
  typed_edges: ResearchCandidateFormationReceiptEdgeContribution[];
  packet_sections: ResearchCandidateFormationReceiptPacketSectionContribution[];
  guardrails: ResearchCandidateFormationReceiptGuardrailContribution[];
};

type PacketSectionSpec = {
  section_id: string;
  section_kind: string;
  items: object[];
};

export function buildResearchCandidateFormationReceipt(
  packet: ResearchCandidateAIContextPacket,
  overlay: ResearchCandidateConstellationOverlay,
  options: ResearchCandidateFormationReceiptBuildOptions,
): ResearchCandidateFormationReceipt {
  const contributions = buildResearchCandidateFormationReceiptContributions(
    packet,
    overlay,
  );

  return {
    receipt_version: "research_candidate_formation_receipt.v0.1",
    scope: packet.scope,
    source_kind: options.source_kind,
    artifact: {
      artifact_id: artifactIdForSourceKind(options.source_kind),
      artifact_kind: options.artifact_kind,
      title: artifactTitleForSourceKind(options.source_kind),
      summary:
        "Read-only formation receipt preview for source refs, candidate nodes, typed edges, packet sections, and guardrails.",
      source_packet_version: packet.packet_version,
      source_overlay_version: overlay.overlay_version,
      review_scope: packet.scope,
    },
    source_packet_fixture_path: options.source_packet_fixture_path,
    source_overlay_fixture_path: options.source_overlay_fixture_path,
    ...contributions,
    diagnostics: {
      source_ref_contribution_count: contributions.source_refs.length,
      candidate_node_contribution_count: contributions.candidate_nodes.length,
      typed_edge_contribution_count: contributions.typed_edges.length,
      packet_section_contribution_count: contributions.packet_sections.length,
      guardrail_contribution_count: contributions.guardrails.length,
      source_packet_summary_count: packetSummaryCount(packet),
      source_overlay_node_count: overlay.diagnostics.node_count,
      source_overlay_edge_count: overlay.diagnostics.edge_count,
      unresolved_tension_count: overlay.diagnostics.unresolved_tension_count,
      knowledge_gap_count: packet.knowledge_gap_summaries.length,
      perspective_delta_count: packet.perspective_delta_summaries.length,
      follow_up_candidate_count: packet.follow_up_summaries.length,
      authority_guardrail_count: contributions.guardrails.length,
    },
    authority: getResearchCandidateFormationReceiptAuthority(),
    non_authority_notice: getResearchCandidateFormationReceiptNotice(),
  };
}

export function buildResearchCandidateFormationReceiptContributions(
  packet: ResearchCandidateAIContextPacket,
  overlay: ResearchCandidateConstellationOverlay,
): ResearchCandidateFormationReceiptContributions {
  const packetSections = getPacketSectionSpecs(packet);
  const sourceRefs = collectSourceRefs(packet, overlay).map((sourceRefId) => ({
    source_ref_id: sourceRefId,
    contribution_kind: "source_ref" as const,
    contributed_to_sections: sectionsForSourceRef(packetSections, sourceRefId),
    authority_note:
      "Source ref contribution is a read-only pointer, not source-of-truth authority.",
  }));

  const candidateNodes = overlay.nodes
    .filter(isCandidateContributionNode)
    .map((node) => withOptionalNodeStatus(node, {
      node_id: node.id,
      node_kind: node.kind,
      source_object_id: node.source_object_id,
      contributed_to_sections: sectionsForNode(packetSections, node.id),
      authority_note:
        "Candidate node contribution is read-only review material, not committed state.",
    }));

  const typedEdges = overlay.edges.map((edge) => ({
    edge_id: edge.id,
    relation: edge.relation,
    source_node_id: edge.source_node_id,
    target_node_id: edge.target_node_id,
    contributed_to_sections: sectionsForEdge(packetSections, edge),
    authority_note:
      "Typed edge contribution is read-only relationship context, not graph persistence.",
  }));

  const packetSectionContributions = packetSections.map((section) => ({
    section_id: section.section_id,
    section_kind: section.section_kind,
    item_count: section.items.length,
    related_node_ids: uniqueSorted(
      section.items.flatMap((item) => nodeIdsFromSectionItem(item)),
    ),
    related_source_refs: uniqueSorted(
      section.items.flatMap((item) => sourceRefsFromSectionItem(item)),
    ),
    authority_note:
      "Packet section contribution records static preview participation only.",
  }));

  const guardrails = packet.final_guardrails.map((guardrail, index) => ({
    guardrail_id: `guardrail_${String(index + 1).padStart(3, "0")}`,
    text: guardrail,
    contributed_to_sections: ["packet_section_final_guardrails"],
    authority_note:
      "Guardrail contribution is read-only boundary text, not runtime enforcement.",
  }));

  return {
    source_refs: sourceRefs,
    candidate_nodes: candidateNodes,
    typed_edges: typedEdges,
    packet_sections: packetSectionContributions,
    guardrails,
  };
}

export function getResearchCandidateFormationReceiptAuthority(): ResearchCandidateFormationReceiptAuthority {
  return {
    read_only: true,
    preview_only: true,
    candidate_only: true,
    source_of_truth: false,
    creates_evidence: false,
    creates_proof: false,
    commits_state: false,
    promotes_perspective: false,
    creates_work_item: false,
    mutates_runtime: false,
    executes_agents: false,
    sends_handoff: false,
    calls_provider: false,
    performs_retrieval: false,
    writes_receipt: false,
    writes_event_log: false,
  };
}

export function getResearchCandidateFormationReceiptNotice(): string {
  return "This formation receipt is read-only preview material. It is not durable receipt storage, not an event log, not proof/evidence, not a work item, not a perspective promotion, not a provider call, not retrieval, not Codex execution, and not an external handoff.";
}

function getPacketSectionSpecs(
  packet: ResearchCandidateAIContextPacket,
): PacketSectionSpec[] {
  return [
    {
      section_id: "packet_section_source_summaries",
      section_kind: "source_summaries",
      items: packet.source_summaries,
    },
    {
      section_id: "packet_section_claim_summaries",
      section_kind: "claim_summaries",
      items: packet.claim_summaries,
    },
    {
      section_id: "packet_section_evidence_summaries",
      section_kind: "evidence_summaries",
      items: packet.evidence_summaries,
    },
    {
      section_id: "packet_section_tension_summaries",
      section_kind: "tension_summaries",
      items: packet.tension_summaries,
    },
    {
      section_id: "packet_section_knowledge_gap_summaries",
      section_kind: "knowledge_gap_summaries",
      items: packet.knowledge_gap_summaries,
    },
    {
      section_id: "packet_section_perspective_delta_summaries",
      section_kind: "perspective_delta_summaries",
      items: packet.perspective_delta_summaries,
    },
    {
      section_id: "packet_section_follow_up_summaries",
      section_kind: "follow_up_summaries",
      items: packet.follow_up_summaries,
    },
    {
      section_id: "packet_section_target_perspective_summaries",
      section_kind: "target_perspective_summaries",
      items: packet.target_perspective_summaries,
    },
    {
      section_id: "packet_section_final_guardrails",
      section_kind: "final_guardrails",
      items: packet.final_guardrails.map((guardrail) => ({
        text: guardrail,
      })),
    },
  ];
}

function collectSourceRefs(
  packet: ResearchCandidateAIContextPacket,
  overlay: ResearchCandidateConstellationOverlay,
) {
  return uniqueSorted([
    ...packet.source_summaries.flatMap((summary) => summary.source_refs),
    ...packet.claim_summaries.flatMap((summary) => summary.source_refs),
    ...packet.evidence_summaries.flatMap((summary) => summary.source_refs),
    ...packet.tension_summaries.flatMap((summary) => summary.source_refs),
    ...packet.knowledge_gap_summaries.flatMap((summary) => summary.source_refs),
    ...packet.perspective_delta_summaries.flatMap((summary) => summary.source_refs),
    ...packet.follow_up_summaries.flatMap((summary) => summary.source_refs),
    ...overlay.nodes.flatMap((node) =>
      node.source_refs.map((sourceRef) => sourceRef.source_ref_id),
    ),
    ...overlay.edges.flatMap((edge) =>
      edge.source_refs.map((sourceRef) => sourceRef.source_ref_id),
    ),
  ]);
}

function isCandidateContributionNode(
  node: ResearchCandidateConstellationNode,
) {
  return ![
    "research_session",
    "source_reference",
    "target_perspective_anchor",
  ].includes(node.kind);
}

function sectionsForSourceRef(sections: PacketSectionSpec[], sourceRefId: string) {
  const matchingSections = sections
    .filter((section) =>
      section.items.some((item) =>
        sourceRefsFromSectionItem(item).includes(sourceRefId),
      ),
    )
    .map((section) => section.section_id);
  return matchingSections.length > 0
    ? matchingSections
    : ["packet_section_source_summaries"];
}

function sectionsForNode(sections: PacketSectionSpec[], nodeId: string) {
  const matchingSections = sections
    .filter((section) =>
      section.items.some((item) => nodeIdsFromSectionItem(item).includes(nodeId)),
    )
    .map((section) => section.section_id);
  return matchingSections.length > 0
    ? matchingSections
    : ["packet_section_source_summaries"];
}

function sectionsForEdge(
  sections: PacketSectionSpec[],
  edge: ResearchCandidateConstellationEdge,
) {
  const matchingSections = sections
    .filter((section) =>
      section.items.some((item) => {
        const nodeIds = nodeIdsFromSectionItem(item);
        return (
          nodeIds.includes(edge.source_node_id) ||
          nodeIds.includes(edge.target_node_id)
        );
      }),
    )
    .map((section) => section.section_id);
  return matchingSections.length > 0
    ? matchingSections
    : ["packet_section_source_summaries"];
}

function nodeIdsFromSectionItem(item: object) {
  const nodeIds: string[] = [];
  for (const [key, value] of Object.entries(item)) {
    if (key.endsWith("node_id") && typeof value === "string") {
      nodeIds.push(value);
    }
    if (key.endsWith("node_ids") && Array.isArray(value)) {
      nodeIds.push(...value.filter((entry): entry is string => typeof entry === "string"));
    }
  }
  return uniqueSorted(nodeIds);
}

function sourceRefsFromSectionItem(item: object) {
  const sourceRefs = (item as { source_refs?: unknown }).source_refs;
  return Array.isArray(sourceRefs)
    ? uniqueSorted(sourceRefs.filter((entry): entry is string => typeof entry === "string"))
    : [];
}

function withOptionalNodeStatus(
  node: ResearchCandidateConstellationNode,
  contribution: Omit<
    ResearchCandidateFormationReceiptNodeContribution,
    "review_status" | "epistemic_status"
  >,
): ResearchCandidateFormationReceiptNodeContribution {
  const nextContribution: ResearchCandidateFormationReceiptNodeContribution = {
    ...contribution,
  };
  if (node.review_status) {
    nextContribution.review_status = node.review_status;
  }
  if (node.epistemic_status) {
    nextContribution.epistemic_status = node.epistemic_status;
  }
  return nextContribution;
}

function artifactIdForSourceKind(
  sourceKind: ResearchCandidateFormationReceiptSourceKind,
) {
  if (sourceKind === "manual_parser_output_packet") {
    return "formation_receipt_artifact_manual_parser_output";
  }
  return "formation_receipt_artifact_research_candidate_review";
}

function artifactTitleForSourceKind(
  sourceKind: ResearchCandidateFormationReceiptSourceKind,
) {
  if (sourceKind === "manual_parser_output_packet") {
    return "Manual parser output formation receipt preview";
  }
  return "Research Candidate Review formation receipt preview";
}

function packetSummaryCount(packet: ResearchCandidateAIContextPacket) {
  return [
    packet.source_summaries,
    packet.claim_summaries,
    packet.evidence_summaries,
    packet.tension_summaries,
    packet.knowledge_gap_summaries,
    packet.perspective_delta_summaries,
    packet.follow_up_summaries,
    packet.target_perspective_summaries,
  ].reduce((total, summaries) => total + summaries.length, 0);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}
