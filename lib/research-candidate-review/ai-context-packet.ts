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
  ResearchCandidateAIContextPacketGeometrySubstrateLineage,
  ResearchCandidateAIContextPacketGeometrySubstrateAuthorityBoundary,
  ResearchCandidateAIContextPacketGeometrySubstrateMode,
  ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
  ResearchCandidateAIContextPacketGeometrySubstrateUpgradeInput,
  ResearchCandidateAIContextPacketGeometrySubstrateValidationResult,
  ResearchCandidateAIContextPacketKnowledgeGapSummary,
  ResearchCandidateAIContextPacketPerspectiveDeltaSummary,
  ResearchCandidateAIContextPacketSourceKind,
  ResearchCandidateAIContextPacketSourceSummary,
  ResearchCandidateAIContextPacketTargetAgent,
  ResearchCandidateAIContextPacketTargetAgentContext,
  ResearchCandidateAIContextPacketTargetPerspectiveSummary,
  ResearchCandidateAIContextPacketTensionSummary,
} from "@/types/research-candidate-ai-context-packet";
import type { PerspectiveGeometryDigest } from "@/types/perspective-geometry-digest";
import type { AgentPerspectiveSubstrateSnapshot } from "@/types/agent-perspective-substrate";
import type {
  AgentPerspectiveSubstratePreview,
  AgentPerspectiveSurfacingPreviewCard,
} from "@/types/agent-perspective-substrate-preview";
import type { ResearchCandidateFormationReceipt } from "@/types/research-candidate-formation-receipt";

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

export function buildResearchCandidateAIContextPacketGeometrySubstrateUpgrade(
  input: ResearchCandidateAIContextPacketGeometrySubstrateUpgradeInput,
): ResearchCandidateAIContextPacketGeometrySubstrateUpgrade {
  const perspectiveGeometryDigest =
    input.perspectiveGeometryDigest as PerspectiveGeometryDigest;
  const manualPerspectiveGeometryDigest =
    input.manualPerspectiveGeometryDigest as PerspectiveGeometryDigest | undefined;
  const manualBaseAiContextPacket = input.manualBaseAiContextPacket;
  const agentPerspectiveSubstrate =
    input.agentPerspectiveSubstrate as AgentPerspectiveSubstrateSnapshot;
  const agentPerspectiveSubstratePreview =
    input.agentPerspectiveSubstratePreview as AgentPerspectiveSubstratePreview;
  const formationReceiptPreview =
    input.formationReceiptPreview as ResearchCandidateFormationReceipt | undefined;
  const manualFormationReceiptPreview =
    input.manualFormationReceiptPreview as
      | ResearchCandidateFormationReceipt
      | undefined;
  const targetAgent = input.target_agent ?? "codex_implementation";
  const mode = input.mode ?? "geometry_substrate_advisory_preview";
  const primaryPacketRef = packetRef(input.baseAiContextPacket);
  const manualPacketRef = manualBaseAiContextPacket
    ? packetRef(manualBaseAiContextPacket)
    : null;

  const upgradedPacket: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade = {
    ...input.baseAiContextPacket,
    scope: input.scope ?? input.baseAiContextPacket.scope,
    packet_upgrade_version:
      "research_candidate_ai_context_packet.geometry_substrate_upgrade.v0.1",
    packet_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
    geometry_context: {
      geometry_digest_refs: geometryDigestRefs(
        perspectiveGeometryDigest,
        manualPerspectiveGeometryDigest,
      ),
      dominant_clusters: [
        ...perspectiveGeometryDigest.dominant_clusters,
        ...(manualPerspectiveGeometryDigest?.dominant_clusters ?? []),
      ],
      underrepresented_clusters: [
        ...perspectiveGeometryDigest.underrepresented_clusters,
        ...(manualPerspectiveGeometryDigest?.underrepresented_clusters ?? []),
      ],
      bridge_nodes: uniqueBy(
        [
          ...perspectiveGeometryDigest.bridge_nodes,
          ...(manualPerspectiveGeometryDigest?.bridge_nodes ?? []),
        ],
        (node) => node.node_id,
      ),
      contradiction_pairs: uniqueBy(
        [
          ...perspectiveGeometryDigest.contradiction_pairs,
          ...(manualPerspectiveGeometryDigest?.contradiction_pairs ?? []),
        ],
        (pair) => pair.pair_id,
      ),
      recommended_retrieval_expansion: uniqueBy(
        [
          ...perspectiveGeometryDigest.recommended_retrieval_expansion,
          ...(manualPerspectiveGeometryDigest?.recommended_retrieval_expansion ?? []),
        ],
        (expansion) => expansion.expansion_id,
      ),
      diagnostics: perspectiveGeometryDigest.diagnostics,
      layout_coordinates_consumed: false,
      raw_layout_coordinates_exported: false,
      geometry_digest_is_authority: false,
    },
    agent_substrate_context: {
      substrate_ref: `${agentPerspectiveSubstrate.substrate_version}:${agentPerspectiveSubstrate.scope}:${agentPerspectiveSubstrate.as_of}`,
      substrate_preview_ref: `${agentPerspectiveSubstratePreview.preview_version}:${agentPerspectiveSubstratePreview.fingerprint}`,
      surfaced_blockers: cardsBySeverity(agentPerspectiveSubstratePreview, "blocker"),
      surfaced_warnings: cardsBySeverity(agentPerspectiveSubstratePreview, "warning"),
      surfaced_notices: cardsBySeverity(agentPerspectiveSubstratePreview, "notice"),
      retrieval_hints: cardsByKind(agentPerspectiveSubstratePreview, "retrieval_hint"),
      handoff_improvements: cardsByKind(
        agentPerspectiveSubstratePreview,
        "handoff_improvement_suggestion",
      ),
      stale_context_notices: cardsByKind(
        agentPerspectiveSubstratePreview,
        "stale_context_notice",
      ),
      product_write_stopline_reminders: cardsByKind(
        agentPerspectiveSubstratePreview,
        "product_write_stopline_reminder",
      ),
      source_coverage_preview:
        agentPerspectiveSubstratePreview.source_coverage_preview,
      substrate_is_authority: false,
      preview_is_authority: false,
    },
    folded_audit_context: {
      folded_panel_available: true,
      folded_panel_anchor_id: "agent-perspective-substrate-folded-audit-panel",
      folded_sections: agentPerspectiveSubstratePreview.folded_sections,
      surfacing_card_count:
        agentPerspectiveSubstratePreview.diagnostics.surfacing_card_count,
      blocker_card_count:
        agentPerspectiveSubstratePreview.diagnostics.blocker_card_count,
      warning_card_count:
        agentPerspectiveSubstratePreview.diagnostics.warning_card_count,
      source_ref_coverage_ratio:
        agentPerspectiveSubstratePreview.diagnostics.source_ref_coverage_ratio,
      local_ui_state_only: true,
      durable_feedback_persistence_available: false,
      route_or_api_available: false,
    },
    target_agent_context: buildTargetAgentContext({
      targetAgent,
      mode,
      tokenBudget: input.token_budget ?? 12000,
    }),
    authority_boundary: getResearchCandidateAIContextPacketGeometrySubstrateAuthorityBoundary(),
    lineage: {
      research_candidate_review_refs: [
        input.baseAiContextPacket.source_overlay.source_fixture_path,
        input.baseAiContextPacket.source_overlay.overlay_fixture_path,
      ],
      ai_context_packet_base_ref: primaryPacketRef,
      ai_context_packet_base_refs: uniqueSorted(
        [primaryPacketRef, manualPacketRef].filter(isPresent),
      ),
      manual_ai_context_packet_base_ref: manualPacketRef,
      manual_research_candidate_review_refs: manualBaseAiContextPacket
        ? [
            manualBaseAiContextPacket.source_overlay.source_fixture_path,
            manualBaseAiContextPacket.source_overlay.overlay_fixture_path,
          ]
        : [],
      perspective_geometry_digest_refs: geometryDigestRefs(
        perspectiveGeometryDigest,
        manualPerspectiveGeometryDigest,
      ),
      agent_perspective_substrate_ref: `${agentPerspectiveSubstrate.substrate_version}:${agentPerspectiveSubstrate.scope}:${agentPerspectiveSubstrate.as_of}`,
      agent_perspective_substrate_preview_ref: `${agentPerspectiveSubstratePreview.preview_version}:${agentPerspectiveSubstratePreview.fingerprint}`,
      cockpit_folded_audit_panel_ref:
        "components/agent-perspective-substrate-folded-audit-panel.tsx#agent-perspective-substrate-folded-audit-panel",
      formation_receipt_refs: formationReceiptPreview
        ? [formationReceiptRef(formationReceiptPreview)]
        : [],
      manual_formation_receipt_refs: manualFormationReceiptPreview
        ? [formationReceiptRef(manualFormationReceiptPreview)]
        : [],
      product_write_stopline_ref:
        "pr:686:manual_note_single_claim_product_write_preflight_stopline",
    },
    validation: { passed: true, failure_codes: [] },
    next_recommended_slice:
      "candidate_to_codex_handoff_draft_geometry_substrate_v0_1",
  };

  upgradedPacket.validation =
    validateResearchCandidateAIContextPacketGeometrySubstrateUpgrade(
      upgradedPacket,
    );
  upgradedPacket.packet_fingerprint =
    createResearchCandidateAIContextPacketGeometrySubstrateUpgradeFingerprint(
      upgradedPacket,
    );
  return upgradedPacket;
}

export function validateResearchCandidateAIContextPacketGeometrySubstrateUpgrade(
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
): ResearchCandidateAIContextPacketGeometrySubstrateValidationResult {
  const failureCodes: string[] = [];
  if (packet.packet_version !== "research_candidate_ai_context_packet.v0.1") {
    failureCodes.push("base_packet_version_invalid");
  }
  if (!packet.source_overlay || !Array.isArray(packet.source_summaries)) {
    failureCodes.push("base_packet_fields_missing");
  }
  if (!packet.geometry_context) {
    failureCodes.push("geometry_context_missing");
  } else {
    if (packet.geometry_context.layout_coordinates_consumed !== false) {
      failureCodes.push("geometry_layout_coordinates_consumed");
    }
    if (packet.geometry_context.raw_layout_coordinates_exported !== false) {
      failureCodes.push("geometry_raw_layout_coordinates_exported");
    }
    if (packet.geometry_context.geometry_digest_is_authority !== false) {
      failureCodes.push("geometry_digest_authority_enabled");
    }
  }
  if (!packet.agent_substrate_context) {
    failureCodes.push("agent_substrate_context_missing");
  } else {
    for (const card of surfacedSubstrateItems(packet)) {
      if (!hasSourceRefs(card) && !card.source_coverage_boundary_note) {
        failureCodes.push("surfaced_item_source_refs_missing");
      }
      if (!card.epistemic_status) {
        failureCodes.push("surfaced_item_epistemic_status_missing");
      }
      if (!card.review_status) {
        failureCodes.push("surfaced_item_review_status_missing");
      }
      if (!card.why_now) {
        failureCodes.push("surfaced_item_why_now_missing");
      }
      if (
        !Array.isArray(card.authority_boundary_notes) ||
        card.authority_boundary_notes.length === 0
      ) {
        failureCodes.push("surfaced_item_authority_boundary_notes_missing");
      }
    }
    for (const card of packet.agent_substrate_context.retrieval_hints) {
      if (card.retrieval_executed_now !== false && card.retrieval_executed_now !== undefined) {
        failureCodes.push("retrieval_hint_execution_represented");
      }
    }
  }
  if (!packet.folded_audit_context) {
    failureCodes.push("folded_audit_context_missing");
  } else {
    if (packet.folded_audit_context.route_or_api_available !== false) {
      failureCodes.push("folded_audit_route_or_api_available");
    }
    if (
      packet.folded_audit_context.durable_feedback_persistence_available !== false
    ) {
      failureCodes.push("folded_audit_durable_feedback_available");
    }
  }
  if (!packet.lineage) {
    failureCodes.push("lineage_missing");
  } else {
    const lineageBaseRefs = Array.isArray(
      packet.lineage.ai_context_packet_base_refs,
    )
      ? packet.lineage.ai_context_packet_base_refs
      : [];
    const manualResearchRefs = Array.isArray(
      packet.lineage.manual_research_candidate_review_refs,
    )
      ? packet.lineage.manual_research_candidate_review_refs
      : [];
    const manualFormationRefs = Array.isArray(
      packet.lineage.manual_formation_receipt_refs,
    )
      ? packet.lineage.manual_formation_receipt_refs
      : [];
    if (
      !Array.isArray(packet.lineage.ai_context_packet_base_refs) ||
      lineageBaseRefs.length === 0
    ) {
      failureCodes.push("lineage_ai_context_packet_base_refs_missing");
    } else if (!lineageBaseRefs.includes(packet.lineage.ai_context_packet_base_ref)) {
      failureCodes.push("lineage_primary_packet_ref_missing");
    }
    if (
      (manualResearchRefs.length > 0 || manualFormationRefs.length > 0) &&
      !packet.lineage.manual_ai_context_packet_base_ref
    ) {
      failureCodes.push("lineage_manual_packet_ref_missing");
    }
    if (
      packet.lineage.manual_ai_context_packet_base_ref &&
      manualResearchRefs.length === 0
    ) {
      failureCodes.push(
        "lineage_manual_research_candidate_review_refs_missing",
      );
    }
    if (
      packet.lineage.manual_ai_context_packet_base_ref &&
      manualFormationRefs.length === 0
    ) {
      failureCodes.push("lineage_manual_formation_receipt_refs_missing");
    }
    if (lineageRefsGrantAuthorityOrExecution(packet.lineage)) {
      failureCodes.push("authority_boundary_forbidden_capability_enabled");
    }
  }
  if (hasCoordinateFields(packet)) {
    failureCodes.push("coordinate_fields_exported_to_ai_packet");
  }
  if (!packet.authority_boundary) {
    failureCodes.push("authority_boundary_missing");
  } else if (!authorityBoundaryIsSafe(packet.authority_boundary)) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }
  if (!packet.target_agent_context) {
    failureCodes.push("target_agent_context_missing");
  } else {
    for (const requiredForbiddenAction of requiredTargetAgentForbiddenActions()) {
      if (
        !packet.target_agent_context.forbidden_actions.includes(
          requiredForbiddenAction,
        )
      ) {
        failureCodes.push(
          `target_agent_forbidden_action_missing:${requiredForbiddenAction}`,
        );
      }
    }
  }
  if (
    !packet.agent_substrate_context ||
    packet.agent_substrate_context.product_write_stopline_reminders.length === 0 ||
    !packet.authority_boundary ||
    packet.authority_boundary.product_write_authorized_now !== false ||
    packet.authority_boundary.product_write_available !== false
  ) {
    failureCodes.push("product_write_stopline_not_preserved");
  }
  if (
    packet.next_recommended_slice !==
    "candidate_to_codex_handoff_draft_geometry_substrate_v0_1"
  ) {
    failureCodes.push("next_recommended_slice_invalid");
  }
  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueSorted(failureCodes),
  };
}

export function createResearchCandidateAIContextPacketGeometrySubstrateUpgradeFingerprint(
  value: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
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

function geometryDigestRefs(
  perspectiveGeometryDigest: PerspectiveGeometryDigest,
  manualPerspectiveGeometryDigest?: PerspectiveGeometryDigest,
): string[] {
  return uniqueSorted(
    [perspectiveGeometryDigest, manualPerspectiveGeometryDigest]
      .filter(isPresent)
      .map((digest) => `${digest.version}:${digest.digest_fingerprint}`),
  );
}

function packetRef(packet: ResearchCandidateAIContextPacket): string {
  return `${packet.packet_version}:${packet.source_kind}:${packet.source_overlay.overlay_fixture_path}`;
}

function formationReceiptRef(receipt: ResearchCandidateFormationReceipt): string {
  return `${receipt.receipt_version}:${receipt.source_kind}:${receipt.source_packet_fixture_path}`;
}

function cardsBySeverity(
  preview: AgentPerspectiveSubstratePreview,
  severity: AgentPerspectiveSurfacingPreviewCard["severity"],
): AgentPerspectiveSurfacingPreviewCard[] {
  return preview.surfacing_cards.filter((card) => card.severity === severity);
}

function cardsByKind(
  preview: AgentPerspectiveSubstratePreview,
  cardKind: AgentPerspectiveSurfacingPreviewCard["card_kind"],
): AgentPerspectiveSurfacingPreviewCard[] {
  return preview.surfacing_cards.filter((card) => card.card_kind === cardKind);
}

function buildTargetAgentContext({
  targetAgent,
  mode,
  tokenBudget,
}: {
  targetAgent: ResearchCandidateAIContextPacketTargetAgent;
  mode: ResearchCandidateAIContextPacketGeometrySubstrateMode;
  tokenBudget: number;
}): ResearchCandidateAIContextPacketTargetAgentContext {
  return {
    target_agent: targetAgent,
    mode,
    token_budget: tokenBudget,
    allowed_uses: targetAgentAllowedUses(targetAgent),
    forbidden_actions: requiredTargetAgentForbiddenActions(),
    stop_conditions: [
      "Stop if source_refs are missing and no source coverage boundary note is present.",
      "Stop if an action would require provider calls, retrieval execution, source fetching, DB writes, durable state, agent execution, Codex execution, external handoff sending, or product write.",
      "Stop if geometry or substrate context conflicts with the base candidate packet without an explicit boundary note.",
    ],
    expected_checks: [
      "preserve unresolved tensions",
      "preserve source_refs and why_now fields",
      "preserve advisory-only authority boundary",
      "verify product-write lane remains parked by #686",
      "verify no coordinates are treated as truth",
    ],
    expected_files: expectedFilesForTargetAgent(targetAgent),
  };
}

function targetAgentAllowedUses(
  targetAgent: ResearchCandidateAIContextPacketTargetAgent,
): string[] {
  const commonUses = [
    "summarize advisory geometry/substrate context",
    "preserve unresolved tensions and source coverage boundaries",
    "prepare non-executing review notes",
    "compare candidate structures without committing state",
  ];
  const targetUses: Record<ResearchCandidateAIContextPacketTargetAgent, string[]> = {
    chatgpt_design: [
      "draft design analysis from advisory context",
      "identify UX copy or information hierarchy risks",
    ],
    codex_implementation: [
      "plan deterministic fixture-backed implementation work",
      "derive expected files and checks for a future bounded PR",
    ],
    codex_review: [
      "review code or fixture changes against advisory source context",
      "spot missing source discipline or authority-boundary drift",
    ],
    mcp_runtime: [
      "prepare non-executing runtime contract notes",
      "compare tool-facing constraints without widening MCP tools",
    ],
    cockpit_ui: [
      "prepare Cockpit preview hierarchy notes",
      "identify folded audit surfacing improvements without route or UI mutation",
    ],
  };
  return [...commonUses, ...targetUses[targetAgent]];
}

function requiredTargetAgentForbiddenActions(): string[] {
  return [
    "do not treat packet as source of truth",
    "do not create proof/evidence",
    "do not mutate work",
    "do not promote Perspective",
    "do not call providers/OpenAI",
    "do not run retrieval/RAG",
    "do not fetch sources",
    "do not route/execute agents",
    "do not execute Codex",
    "do not create branch/PR",
    "do not send external handoff",
    "do not write DB",
    "do not allocate product IDs",
    "do not execute product write",
  ];
}

function expectedFilesForTargetAgent(
  targetAgent: ResearchCandidateAIContextPacketTargetAgent,
): string[] | undefined {
  if (targetAgent !== "codex_implementation") return undefined;
  return [
    "types/research-candidate-ai-context-packet.ts",
    "lib/research-candidate-review/ai-context-packet.ts",
    "fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  ];
}

function getResearchCandidateAIContextPacketGeometrySubstrateAuthorityBoundary(): ResearchCandidateAIContextPacketGeometrySubstrateAuthorityBoundary {
  return {
    ...getResearchCandidateAIContextPacketAuthority(),
    proof_or_evidence_record: false,
    durable_perspective_state: false,
    retrieval_executed_now: false,
    provider_called_now: false,
    source_fetch_executed_now: false,
    external_handoff_sent_now: false,
    codex_execution_authorized_now: false,
    agent_execution_authorized_now: false,
    product_write_authorized_now: false,
    product_write_available: false,
    db_write_available: false,
    route_or_ui_mutation_available: false,
  };
}

function surfacedSubstrateItems(
  packet: ResearchCandidateAIContextPacketGeometrySubstrateUpgrade,
): AgentPerspectiveSurfacingPreviewCard[] {
  return uniqueBy(
    [
      ...packet.agent_substrate_context.surfaced_blockers,
      ...packet.agent_substrate_context.surfaced_warnings,
      ...packet.agent_substrate_context.surfaced_notices,
      ...packet.agent_substrate_context.retrieval_hints,
      ...packet.agent_substrate_context.handoff_improvements,
      ...packet.agent_substrate_context.stale_context_notices,
      ...packet.agent_substrate_context.product_write_stopline_reminders,
    ],
    (card) => card.card_id,
  );
}

function hasSourceRefs(card: AgentPerspectiveSurfacingPreviewCard): boolean {
  return Array.isArray(card.source_refs) && card.source_refs.length > 0;
}

function lineageRefsGrantAuthorityOrExecution(
  lineage: ResearchCandidateAIContextPacketGeometrySubstrateLineage,
): boolean {
  return Object.values(lineage)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string => typeof value === "string")
    .some((value) =>
      /(?:authority_granted|execution_authorized|execute_now|db_write_available|route_or_ui_mutation_available)/i.test(
        value,
      ),
    );
}

function authorityBoundaryIsSafe(
  boundary: ResearchCandidateAIContextPacketGeometrySubstrateAuthorityBoundary,
): boolean {
  return [
    boundary.source_of_truth,
    boundary.creates_evidence,
    boundary.creates_proof,
    boundary.commits_state,
    boundary.promotes_perspective,
    boundary.creates_work_item,
    boundary.mutates_runtime,
    boundary.executes_agents,
    boundary.sends_handoff,
    boundary.calls_provider,
    boundary.performs_retrieval,
    boundary.proof_or_evidence_record,
    boundary.durable_perspective_state,
    boundary.retrieval_executed_now,
    boundary.provider_called_now,
    boundary.source_fetch_executed_now,
    boundary.external_handoff_sent_now,
    boundary.codex_execution_authorized_now,
    boundary.agent_execution_authorized_now,
    boundary.product_write_authorized_now,
    boundary.product_write_available,
    boundary.db_write_available,
    boundary.route_or_ui_mutation_available,
  ].every((value) => value === false);
}

function hasCoordinateFields(value: unknown): boolean {
  let found = false;
  visit(value, (key) => {
    if (["x", "y", "fx", "fy", "position"].includes(key)) found = true;
  });
  return found;
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

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripGeneratedFields);
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "packet_fingerprint")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
  );
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value as JsonRecord)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as JsonRecord)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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
  for (const [key, nestedValue] of Object.entries(value)) {
    callback(key, nestedValue);
    visit(nestedValue, callback);
  }
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

type JsonRecord = Record<string, unknown>;
