import type {
  ResearchCandidateConstellationEdge,
  ResearchCandidateConstellationNode,
  ResearchCandidateConstellationOverlay,
} from "@/types/research-candidate-constellation-overlay";
import type {
  ResearchCandidateAIContextPacket,
  ResearchCandidateAIContextPacketAudience,
  ResearchCandidateAIContextPacketAuthority,
  ResearchCandidateAIContextPacketClaimSummary,
  ResearchCandidateAIContextPacketEvidenceSummary,
  ResearchCandidateAIContextPacketFollowUpSummary,
  ResearchCandidateAIContextPacketKnowledgeGapSummary,
  ResearchCandidateAIContextPacketPerspectiveDeltaSummary,
  ResearchCandidateAIContextPacketSourceKind,
  ResearchCandidateAIContextPacketSourceSummary,
  ResearchCandidateAIContextPacketTargetPerspectiveSummary,
  ResearchCandidateAIContextPacketTensionSummary,
} from "@/types/research-candidate-ai-context-packet";

export type ResearchCandidateAIContextPacketBuildOptions = {
  source_kind: ResearchCandidateAIContextPacketSourceKind;
  overlay_fixture_path: string;
  audience: ResearchCandidateAIContextPacketAudience;
};

type ResearchCandidateAIContextPacketSummaries = {
  source_summaries: ResearchCandidateAIContextPacketSourceSummary[];
  claim_summaries: ResearchCandidateAIContextPacketClaimSummary[];
  evidence_summaries: ResearchCandidateAIContextPacketEvidenceSummary[];
  tension_summaries: ResearchCandidateAIContextPacketTensionSummary[];
  knowledge_gap_summaries: ResearchCandidateAIContextPacketKnowledgeGapSummary[];
  perspective_delta_summaries: ResearchCandidateAIContextPacketPerspectiveDeltaSummary[];
  follow_up_summaries: ResearchCandidateAIContextPacketFollowUpSummary[];
  target_perspective_summaries: ResearchCandidateAIContextPacketTargetPerspectiveSummary[];
};

export function buildResearchCandidateAIContextPacket(
  overlay: ResearchCandidateConstellationOverlay,
  options: ResearchCandidateAIContextPacketBuildOptions,
): ResearchCandidateAIContextPacket {
  const summaries = buildResearchCandidateAIContextPacketSummaries(overlay);
  const finalGuardrails = getResearchCandidateAIContextPacketFinalGuardrails();

  return {
    packet_version: "research_candidate_ai_context_packet.v0.1",
    scope: overlay.scope,
    source_kind: options.source_kind,
    source_overlay: {
      overlay_version: overlay.overlay_version,
      source_kind: overlay.source_kind,
      source_fixture_path: overlay.source_fixture_path,
      overlay_fixture_path: options.overlay_fixture_path,
      node_count: overlay.diagnostics.node_count,
      edge_count: overlay.diagnostics.edge_count,
    },
    audience: options.audience,
    mission_brief: getMissionBrief(options.source_kind),
    non_authority_notice:
      "This packet is read-only preview material. It is not source of truth, not proof/evidence, not a work item, not a perspective promotion, not a provider call, not retrieval, and not Codex execution.",
    ...summaries,
    diagnostics: {
      source_overlay_node_count: overlay.diagnostics.node_count,
      source_overlay_edge_count: overlay.diagnostics.edge_count,
      source_summary_count: summaries.source_summaries.length,
      claim_summary_count: summaries.claim_summaries.length,
      evidence_summary_count: summaries.evidence_summaries.length,
      tension_summary_count: summaries.tension_summaries.length,
      knowledge_gap_summary_count: summaries.knowledge_gap_summaries.length,
      perspective_delta_summary_count:
        summaries.perspective_delta_summaries.length,
      follow_up_summary_count: summaries.follow_up_summaries.length,
      target_perspective_summary_count:
        summaries.target_perspective_summaries.length,
      unresolved_tension_count: overlay.diagnostics.unresolved_tension_count,
      blocked_or_not_ready_delta_count:
        overlay.diagnostics.blocked_or_not_ready_delta_count,
      source_ref_coverage_ratio: overlay.diagnostics.source_ref_coverage_ratio,
      final_guardrail_count: finalGuardrails.length,
    },
    final_guardrails: finalGuardrails,
    authority: getResearchCandidateAIContextPacketAuthority(),
  };
}

export function buildResearchCandidateAIContextPacketSummaries(
  overlay: ResearchCandidateConstellationOverlay,
): ResearchCandidateAIContextPacketSummaries {
  const nodesById = new Map(overlay.nodes.map((node) => [node.id, node]));

  const source_summaries = nodesByKind(overlay, "source_reference").map(
    (node) => ({
      ...baseSummary(node, relatedNodeIds(overlay, node.id)),
      id: summaryId("source_summary", node.source_object_id),
      authority_note:
        "Source summary is display/source pointer material only; not source of truth.",
    }),
  );

  const claim_summaries = nodesByKind(overlay, "claim_candidate").map((node) => {
    const supportingEdges = outgoingEdges(
      overlay,
      node.id,
      "claim_supported_by_evidence",
    );
    const contradictingEdges = outgoingEdges(
      overlay,
      node.id,
      "claim_contradicted_by_evidence",
    );
    return withOptionalStatus(node, {
      ...baseSummary(node, relatedNodeIds(overlay, node.id)),
      id: summaryId("claim_summary", node.source_object_id),
      supporting_evidence_node_ids: supportingEdges.map(
        (edge) => edge.target_node_id,
      ),
      contradicting_evidence_node_ids: contradictingEdges.map(
        (edge) => edge.target_node_id,
      ),
      authority_note:
        "Claim summary is candidate-only review material; do not treat it as fact.",
    });
  });

  const evidence_summaries = nodesByKind(overlay, "evidence_candidate").map(
    (node) => {
      const claimEdges = incomingEdges(overlay, node.id).filter((edge) =>
        edge.relation.startsWith("claim_"),
      );
      return withOptionalStatus(node, {
        ...baseSummary(node, relatedNodeIds(overlay, node.id)),
        id: summaryId("evidence_summary", node.source_object_id),
        evidence_relation_labels: claimEdges.map((edge) => edge.label),
        related_claim_node_ids: claimEdges.map((edge) => edge.source_node_id),
        authority_note:
          "Evidence summary is candidate-only context; it is not an Augnes proof/evidence row.",
      });
    },
  );

  const tension_summaries = nodesByKind(overlay, "tension_candidate").map(
    (node) => {
      const claimEdges = outgoingEdges(overlay, node.id, "tension_relates_to_claim");
      const evidenceEdges = outgoingEdges(
        overlay,
        node.id,
        "tension_relates_to_evidence",
      );
      const deltaEdges = incomingEdges(overlay, node.id).filter(
        (edge) => edge.relation === "delta_preserves_tension",
      );
      return withOptionalStatus(node, {
        ...baseSummary(node, relatedNodeIds(overlay, node.id)),
        id: summaryId("tension_summary", node.source_object_id),
        related_claim_node_ids: claimEdges.map((edge) => edge.target_node_id),
        related_evidence_node_ids: evidenceEdges.map(
          (edge) => edge.target_node_id,
        ),
        preserved_by_delta_node_ids: deltaEdges.map(
          (edge) => edge.source_node_id,
        ),
        authority_note:
          "Tension summary preserves unresolved review material; do not smooth it away.",
      });
    },
  );

  const knowledge_gap_summaries = nodesByKind(
    overlay,
    "knowledge_gap_candidate",
  ).map((node) => {
    const claimEdges = outgoingEdges(overlay, node.id, "gap_relates_to_claim");
    const tensionEdges = outgoingEdges(overlay, node.id, "gap_relates_to_tension");
    const deltaEdges = incomingEdges(overlay, node.id).filter(
      (edge) => edge.relation === "delta_tracks_gap",
    );
    return withOptionalStatus(node, {
      ...baseSummary(node, relatedNodeIds(overlay, node.id)),
      id: summaryId("knowledge_gap_summary", node.source_object_id),
      related_claim_node_ids: claimEdges.map((edge) => edge.target_node_id),
      related_tension_node_ids: tensionEdges.map((edge) => edge.target_node_id),
      tracked_by_delta_node_ids: deltaEdges.map((edge) => edge.source_node_id),
      authority_note:
        "Knowledge gap summary must remain explicit; do not fill it by inference.",
    });
  });

  const perspective_delta_summaries = nodesByKind(
    overlay,
    "perspective_delta_candidate",
  ).map((node) => {
    const targetEdge = outgoingEdges(
      overlay,
      node.id,
      "delta_proposes_change_to_perspective",
    )[0];
    const targetNode = targetEdge ? nodesById.get(targetEdge.target_node_id) : null;
    const claimEdges = outgoingEdges(overlay, node.id, "delta_uses_claim_basis");
    const evidenceEdges = outgoingEdges(
      overlay,
      node.id,
      "delta_uses_evidence_basis",
    );
    const tensionEdges = outgoingEdges(overlay, node.id, "delta_preserves_tension");
    const gapEdges = outgoingEdges(overlay, node.id, "delta_tracks_gap");
    return withOptionalStatus(node, {
      ...baseSummary(node, relatedNodeIds(overlay, node.id)),
      id: summaryId("perspective_delta_summary", node.source_object_id),
      target_perspective_key:
        node.target_perspective_key ??
        targetNode?.target_perspective_key ??
        "research.candidate_review",
      basis_claim_node_ids: claimEdges.map((edge) => edge.target_node_id),
      basis_evidence_node_ids: evidenceEdges.map((edge) => edge.target_node_id),
      related_tension_node_ids: tensionEdges.map((edge) => edge.target_node_id),
      related_gap_node_ids: gapEdges.map((edge) => edge.target_node_id),
      authority_note:
        "Perspective delta summary is candidate pressure only; it is not committed state.",
    });
  });

  const follow_up_summaries = nodesByKind(
    overlay,
    "follow_up_work_candidate",
  ).map((node) => {
    const sessionEdges = outgoingEdges(
      overlay,
      node.id,
      "follow_up_derived_from_session",
    );
    const sourceEdges = outgoingEdges(
      overlay,
      node.id,
      "follow_up_derived_from_source",
    );
    return withOptionalReviewStatus(node, {
      ...baseSummary(node, relatedNodeIds(overlay, node.id)),
      id: summaryId("follow_up_summary", node.source_object_id),
      derived_from_session_node_ids: sessionEdges.map(
        (edge) => edge.target_node_id,
      ),
      derived_from_source_node_ids: sourceEdges.map(
        (edge) => edge.target_node_id,
      ),
      is_work_item: false as false,
      authority_note:
        "Follow-up summary is candidate-only planning material; it is not a work item.",
    });
  });

  const target_perspective_summaries = nodesByKind(
    overlay,
    "target_perspective_anchor",
  ).map((node) => ({
    target_perspective_key: node.target_perspective_key ?? node.label,
    anchor_node_id: node.id,
    delta_node_ids: incomingEdges(overlay, node.id)
      .filter((edge) => edge.relation === "delta_proposes_change_to_perspective")
      .map((edge) => edge.source_node_id),
    authority_note:
      "Target perspective summary is a read-only anchor, not committed Perspective state.",
  }));

  return {
    source_summaries,
    claim_summaries,
    evidence_summaries,
    tension_summaries,
    knowledge_gap_summaries,
    perspective_delta_summaries,
    follow_up_summaries,
    target_perspective_summaries,
  };
}

export function getResearchCandidateAIContextPacketAuthority(): ResearchCandidateAIContextPacketAuthority {
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
  };
}

export function getResearchCandidateAIContextPacketFinalGuardrails(): string[] {
  return [
    "Do not treat candidate claims as facts.",
    "Do not treat evidence candidates as proof/evidence rows.",
    "Preserve unresolved tensions.",
    "Preserve knowledge gaps instead of filling them by inference.",
    "Do not promote perspective deltas.",
    "Do not create work items from follow-up candidates.",
    "Do not use raw source titles, URLs, provider IDs, thread IDs, run IDs, session IDs, arbitrary user strings, episode IDs, or demo refs as canonical labels.",
    "Do not execute Codex or send external handoffs from this preview packet.",
  ];
}

function getMissionBrief(sourceKind: ResearchCandidateAIContextPacketSourceKind) {
  if (sourceKind === "manual_parser_output_overlay") {
    return "Review deterministic manual parser output overlay candidates without treating parser output as durable state.";
  }
  return "Review Research Candidate Review overlay candidates without treating them as durable state.";
}

function nodesByKind(
  overlay: ResearchCandidateConstellationOverlay,
  kind: ResearchCandidateConstellationNode["kind"],
) {
  return overlay.nodes.filter((node) => node.kind === kind);
}

function outgoingEdges(
  overlay: ResearchCandidateConstellationOverlay,
  nodeId: string,
  relation?: ResearchCandidateConstellationEdge["relation"],
) {
  return overlay.edges.filter(
    (edge) =>
      edge.source_node_id === nodeId && (!relation || edge.relation === relation),
  );
}

function incomingEdges(
  overlay: ResearchCandidateConstellationOverlay,
  nodeId: string,
) {
  return overlay.edges.filter((edge) => edge.target_node_id === nodeId);
}

function relatedNodeIds(
  overlay: ResearchCandidateConstellationOverlay,
  nodeId: string,
) {
  return uniqueSorted([
    ...outgoingEdges(overlay, nodeId).map((edge) => edge.target_node_id),
    ...incomingEdges(overlay, nodeId).map((edge) => edge.source_node_id),
  ]);
}

function baseSummary(
  node: ResearchCandidateConstellationNode,
  relatedNodeIdsValue: string[],
) {
  return {
    id: summaryId("summary", node.source_object_id),
    node_id: node.id,
    summary: node.summary,
    source_refs: node.source_refs.map((sourceRef) => sourceRef.source_ref_id),
    related_node_ids: relatedNodeIdsValue,
    authority_note:
      "Summary is read-only candidate preview material with no durable authority.",
  };
}

function withOptionalStatus<T extends object>(
  node: ResearchCandidateConstellationNode,
  summary: T,
): T & { review_status?: string; epistemic_status?: string } {
  const nextSummary = withOptionalReviewStatus(node, summary) as T & {
    review_status?: string;
    epistemic_status?: string;
  };
  if (node.epistemic_status) {
    nextSummary.epistemic_status = node.epistemic_status;
  }
  return nextSummary;
}

function withOptionalReviewStatus<T extends object>(
  node: ResearchCandidateConstellationNode,
  summary: T,
): T & { review_status?: string } {
  const nextSummary = summary as T & { review_status?: string };
  if (node.review_status) {
    nextSummary.review_status = node.review_status;
  }
  return nextSummary;
}

function summaryId(prefix: string, sourceObjectId: string) {
  return `${prefix}_${stableIdPart(sourceObjectId)}`;
}

function stableIdPart(value: string) {
  return value.replaceAll(".", "_");
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}
