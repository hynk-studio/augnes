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
import type {
  AIContextPacketAuthorityBoundary,
  AIContextPacketContract,
  AIContextPacketForbiddenActionsPolicy,
  AIContextPacketInputField,
  AIContextPacketOutputField,
  AIContextPacketPrivacyPolicy,
  AIContextPacketPrinciples,
  AIContextPacketSectionFamily,
  AIContextPacketSectionKind,
  AIContextPacketTargetAgentMode,
  AIContextPacketTargetAgentModeContract,
  AIContextPacketValidationPolicy,
} from "@/types/ai-context-packet-contract";
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

export interface AIContextPacketImplementationInput {
  ai_context_packet_contract: AIContextPacketContract;
  source_contract_ref?: string;
  source_contract_fixture_path?: string;
  type_contract_path?: string;
  operator_context_ref?: string;
  packet_input_preview?: JsonRecord;
  packet_preview?: AIContextPacketPreview & JsonRecord;
  target_agent_modes?: AIContextPacketTargetAgentModeContract[];
  packet_section_families?: AIContextPacketSectionFamily[];
  forbidden_actions_policy?: AIContextPacketForbiddenActionsPolicy;
  authority_boundary_overrides?: Partial<AIContextPacketImplementationAuthorityBoundary>;
}

export interface AIContextPacketPreviewBundleInput {
  contract: AIContextPacketContract;
  source_contract_ref?: string;
  operator_context_ref?: string;
  packet_input_preview?: JsonRecord;
  packet_preview?: AIContextPacketPreview & JsonRecord;
  target_agent_modes?: AIContextPacketTargetAgentModeContract[];
  packet_section_families?: AIContextPacketSectionFamily[];
  forbidden_actions_policy?: AIContextPacketForbiddenActionsPolicy;
}

export interface AIContextPacketPreviewBundle {
  preview_version: "ai_context_packet_preview.v0.1";
  source_contract_ref: string;
  operator_context_ref: string;
  packet_input_preview: JsonRecord;
  packet_preview: AIContextPacketPreview & JsonRecord;
  packet_principle_summary: AIContextPacketPrincipleSummary;
  target_agent_mode_summary: AIContextPacketTargetAgentModeSummary;
  packet_section_family_summary: AIContextPacketSectionFamilySummary;
  forbidden_actions_summary: AIContextPacketForbiddenActionsSummary;
  reference_summary: AIContextPacketReferenceSummary;
  validation: AIContextPacketImplementationValidation;
  authority_boundary: AIContextPacketAuthorityBoundary;
  validation_policy: AIContextPacketValidationPolicy;
  forbidden_actions_policy: AIContextPacketForbiddenActionsPolicy;
}

export interface AIContextPacketPreview {
  packet_id?: string;
  packet_version?: string;
  target_agent_mode?: AIContextPacketTargetAgentMode | string;
  mission_brief?: JsonRecord;
  current_state_summary?: JsonRecord;
  selected_research_candidates?: JsonRecord[];
  selected_perspective_delta_candidates?: JsonRecord[];
  unresolved_tensions?: JsonRecord[];
  knowledge_gaps?: JsonRecord[];
  perspective_geometry_digest_summary?: JsonRecord;
  source_refs?: string[];
  authority_boundary?: JsonRecord;
  forbidden_actions?: string[];
  expected_files?: JsonRecord[];
  expected_checks?: JsonRecord[];
  stop_conditions?: JsonRecord[];
  final_critical_facts?: JsonRecord[];
  all_sections_public_safe?: boolean;
  all_sections_source_ref_backed_or_explicit_gap?: boolean;
  all_runtime_write_now_false?: boolean;
}

export interface AIContextPacketPrincipleSummary
  extends AIContextPacketPrinciples {
  packet_principle_count: number;
  all_packet_principles_preserved: boolean;
}

export interface AIContextPacketTargetAgentModeSummary {
  target_agent_mode_count: number;
  target_agent_modes: AIContextPacketTargetAgentMode[];
  all_target_agent_modes_preserved: boolean;
  all_modes_presentation_scope_only: boolean;
  all_modes_without_execution_authority: boolean;
  all_modes_without_external_state_or_tool_widening_authority: boolean;
}

export interface AIContextPacketSectionFamilySummary {
  packet_section_family_count: number;
  section_kinds: AIContextPacketSectionKind[];
  all_packet_section_families_preserved: boolean;
  all_sections_runtime_write_now_false: boolean;
}

export interface AIContextPacketForbiddenActionsSummary
  extends AIContextPacketForbiddenActionsPolicy {
  forbidden_action_count: number;
  all_forbidden_actions_preserved: boolean;
}

export interface AIContextPacketReferenceSummary {
  public_safe_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
  packet_ref_count: number;
  candidate_ref_count: number;
  tension_ref_count: number;
  knowledge_gap_ref_count: number;
  source_ref_count: number;
  digest_ref_count: number;
  state_ref_count: number;
  stop_condition_ref_count: number;
  check_ref_count: number;
  public_safe_file_paths_only: boolean;
}

export interface AIContextPacketImplementationValidation {
  passed: boolean;
  failure_codes: string[];
  preview_bundle_follows_contract: boolean;
  preview_bundle_authority_boundary_matches_contract: boolean;
  preview_bundle_validation_policy_matches_contract: boolean;
  preview_bundle_forbidden_actions_policy_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  packet_input_fields_preserved: boolean;
  packet_output_fields_preserved: boolean;
  packet_principles_preserved: boolean;
  target_agent_modes_preserved: boolean;
  packet_section_families_preserved: boolean;
  forbidden_actions_policy_preserved: boolean;
  ai_context_packet_is_context_not_execution_authority: boolean;
  packet_is_folded_derived_advisory_only: boolean;
  packet_not_source_of_truth: boolean;
  packet_not_proof_or_evidence: boolean;
  packet_not_durable_perspective_state: boolean;
  packet_not_work_status: boolean;
  packet_not_product_write: boolean;
  source_refs_required: boolean;
  unresolved_tensions_preserved: boolean;
  knowledge_gaps_preserved: boolean;
  candidate_durable_distinction_preserved: boolean;
  authority_boundary_required: boolean;
  forbidden_actions_required: boolean;
  stop_conditions_required: boolean;
  final_critical_facts_review_cues_not_authority: boolean;
  target_agent_mode_scope_not_authority: boolean;
  codex_handoff_draft_not_execution_approval: boolean;
  github_codex_automation_not_authority: boolean;
  provider_output_not_execution_authority: boolean;
  retrieval_rag_context_recall_not_authority: boolean;
  perspective_geometry_digest_interpretation_not_truth: boolean;
  expected_files_hints_not_write_authority: boolean;
  expected_checks_hints_not_execution_authority: boolean;
  runtime_packet_build_not_implemented: boolean;
  ai_context_packet_write_not_implemented: boolean;
  codex_handoff_not_implemented: boolean;
  codex_execution_now_false: boolean;
  github_automation_now_false: boolean;
  external_handoff_sending_now_false: boolean;
  agent_routing_execution_now_false: boolean;
  provider_openai_call_not_implemented: boolean;
  retrieval_rag_execution_not_implemented: boolean;
  runtime_geometry_digest_build_not_implemented: boolean;
  runtime_layout_execution_not_implemented: boolean;
  graph_mutation_now_false: boolean;
  runtime_state_read_write_not_implemented: boolean;
  durable_perspective_delta_apply_not_implemented: boolean;
  proof_or_evidence_write_not_implemented: boolean;
  accepted_evidence_write_not_implemented: boolean;
  formation_receipt_write_not_implemented: boolean;
  work_mutation_now_false: boolean;
  runtime_db_write_query_not_implemented: boolean;
  durable_memory_write_not_implemented: boolean;
  product_write_not_implemented: boolean;
  public_safe_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
  invalid_packet_preview_override_rejected: boolean;
  invalid_target_agent_mode_override_rejected: boolean;
  invalid_packet_section_override_rejected: boolean;
  invalid_forbidden_actions_override_rejected: boolean;
  invalid_authority_boundary_override_rejected: boolean;
  invalid_refs_override_rejected: boolean;
}

export interface AIContextPacketImplementationAuthorityBoundary {
  implementation_added_now: true;
  deterministic_builder_added_now: true;
  contract_changed_now: false;
  ai_context_packet_runtime_build_implemented_now: false;
  ai_context_packet_write_now: false;
  codex_handoff_implemented_now: false;
  codex_execution_now: false;
  github_automation_now: false;
  external_handoff_sending_now: false;
  agent_routing_now: false;
  agent_execution_now: false;
  provider_openai_call_now: false;
  provider_extraction_now: false;
  retrieval_rag_execution_now: false;
  source_fetch_now: false;
  crawler_now: false;
  runtime_geometry_digest_build_implemented_now: false;
  geometry_digest_write_now: false;
  geometry_calculation_runtime_now: false;
  raw_coordinate_authority: false;
  raw_coordinate_only_digest_now: false;
  runtime_layout_implemented_now: false;
  runtime_layout_execution_now: false;
  graph_db_implemented_now: false;
  graph_mutation_now: false;
  browser_request_now: false;
  browser_persistence_now: false;
  durable_perspective_state_read_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_implemented_now: false;
  trajectory_runtime_build_implemented_now: false;
  proof_or_evidence_record_write_now: false;
  accepted_evidence_write_now: false;
  formation_receipt_write_now: false;
  work_mutation_now: false;
  candidate_mutation_now: false;
  candidate_record_write_now: false;
  runtime_promotion_implemented_now: false;
  promotion_decision_record_implemented_now: false;
  promotion_decision_record_write_now: false;
  runtime_index_build_implemented_now: false;
  runtime_index_write_now: false;
  embedding_generation_implemented_now: false;
  vector_db_implemented_now: false;
  fts_implemented_now: false;
  source_index_write_now: false;
  durable_source_record_write_now: false;
  runtime_persistence_implemented_now: false;
  durable_memory_write_now: false;
  runtime_db_write_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  durable_salience_write_now: false;
  recent_rehearsal_buffer_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  external_handoff_authority: false;
  agent_routing_authority: false;
  agent_execution_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  source_fetch_authority: false;
  salience_authority: false;
  layout_coordinate_authority: false;
  geometry_digest_authority: false;
  diagnostic_authority: false;
  recommendation_authority: false;
  ai_context_packet_authority: false;
  target_agent_mode_authority: false;
  final_critical_facts_authority: false;
  expected_files_write_authority: false;
  expected_checks_execution_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface AIContextPacketImplementation {
  implementation_kind: "ai_context_packet_implementation";
  implementation_version: "ai_context_packet_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  implemented_contract: {
    contract_kind: "ai_context_packet_contract";
    contract_version: "ai_context_packet_contract.v0.1";
    contract_fixture_path: string;
    type_contract_path: string;
    contract_authority_boundary_preserved: true;
    contract_validation_policy_preserved: true;
    contract_packet_principles_preserved: true;
    contract_target_agent_modes_preserved: true;
    contract_packet_section_families_preserved: true;
    contract_forbidden_actions_policy_preserved: true;
  };
  deterministic_builder: {
    builder_path: "lib/research-candidate-review/ai-context-packet.ts";
    deterministic_fixture_backed_only: true;
    ai_context_packet_runtime_build_now: false;
    ai_context_packet_write_now: false;
    codex_handoff_implementation_now: false;
    codex_execution_now: false;
    github_automation_now: false;
    external_handoff_sending_now: false;
    agent_routing_now: false;
    agent_execution_now: false;
    provider_openai_call_now: false;
    retrieval_rag_execution_now: false;
    source_fetch_now: false;
    crawler_now: false;
    runtime_geometry_digest_build_now: false;
    geometry_digest_write_now: false;
    runtime_layout_execution_now: false;
    graph_mutation_now: false;
    durable_perspective_state_read_now: false;
    durable_perspective_state_write_now: false;
    durable_perspective_delta_apply_now: false;
    perspective_snapshot_runtime_now: false;
    proof_evidence_write_now: false;
    accepted_evidence_write_now: false;
    formation_receipt_write_now: false;
    work_mutation_now: false;
    runtime_db_query_now: false;
    runtime_db_write_now: false;
    production_db_used_now: false;
    durable_memory_write_now: false;
  };
  built_ai_context_packet_preview_bundle: AIContextPacketPreviewBundle;
  validated_implementation: AIContextPacketImplementationValidation;
  authority_boundary: AIContextPacketImplementationAuthorityBoundary;
  recommendation_status: "ready_for_ai_context_packet_browser_validation_v0_1";
  next_recommended_slice: "ai_context_packet_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const defaultAIContextPacketContractFixturePath =
  "fixtures/research-candidate-review.ai-context-packet-contract.sample.v0.1.json";
const defaultAIContextPacketTypeContractPath =
  "types/ai-context-packet-contract.ts";
const defaultAIContextPacketBuilderPath =
  "lib/research-candidate-review/ai-context-packet.ts" as const;
const expectedAIContextPacketInputFields: AIContextPacketInputField[] = [
  "packet_scope_ref",
  "mission_brief_ref",
  "current_state_ref",
  "perspective_geometry_digest_ref",
  "selected_research_candidate_refs",
  "selected_perspective_delta_candidate_refs",
  "unresolved_tension_refs",
  "knowledge_gap_refs",
  "source_refs",
  "authority_boundary_ref",
  "forbidden_actions_ref",
  "target_agent_mode",
  "operator_context_ref",
];
const expectedAIContextPacketOutputFields: AIContextPacketOutputField[] = [
  "packet_id",
  "packet_version",
  "target_agent_mode",
  "mission_brief",
  "current_state_summary",
  "selected_research_candidates",
  "selected_perspective_delta_candidates",
  "unresolved_tensions",
  "knowledge_gaps",
  "perspective_geometry_digest_summary",
  "source_refs",
  "authority_boundary",
  "forbidden_actions",
  "expected_files",
  "expected_checks",
  "stop_conditions",
  "final_critical_facts",
  "privacy_policy",
  "validation_policy",
];
const expectedAIContextPacketSectionKinds: AIContextPacketSectionKind[] = [
  "mission_brief",
  "current_state_summary",
  "selected_research_candidates",
  "selected_perspective_delta_candidates",
  "unresolved_tensions",
  "knowledge_gaps",
  "perspective_geometry_digest_summary",
  "authority_boundary",
  "forbidden_actions",
  "expected_files",
  "expected_checks",
  "stop_conditions",
  "final_critical_facts",
];
const expectedAIContextPacketTargetAgentModes: AIContextPacketTargetAgentMode[] = [
  "chatgpt_design",
  "codex_implementation",
  "codex_review",
  "mcp_runtime",
  "cockpit_ui",
];
export function buildAIContextPacketImplementationFixture(
  input: AIContextPacketImplementationInput,
): AIContextPacketImplementation {
  const contract = input.ai_context_packet_contract;
  const sourceContractRef =
    input.source_contract_ref ??
    `${contract.contract_version}:${defaultAIContextPacketContractFixturePath}`;
  const authorityBoundary = {
    ...getAIContextPacketImplementationAuthorityBoundary(),
    ...(input.authority_boundary_overrides ?? {}),
  };
  const builtAIContextPacketPreviewBundle = buildAIContextPacketPreviewBundle({
    contract,
    source_contract_ref: sourceContractRef,
    operator_context_ref: input.operator_context_ref,
    packet_input_preview: input.packet_input_preview,
    packet_preview: input.packet_preview,
    target_agent_modes: input.target_agent_modes,
    packet_section_families: input.packet_section_families,
    forbidden_actions_policy: input.forbidden_actions_policy,
  });
  const boundaryFailureCodes =
    validateAIContextPacketImplementationAuthorityBoundary(authorityBoundary);
  const topLevelBoundaryIsSeparate =
    builtAIContextPacketPreviewBundle.authority_boundary.implementation_added_now ===
      false &&
    authorityBoundary.implementation_added_now === true &&
    authorityBoundary.deterministic_builder_added_now === true;
  const failureCodes = uniqueSorted([
    ...builtAIContextPacketPreviewBundle.validation.failure_codes,
    ...boundaryFailureCodes,
    topLevelBoundaryIsSeparate ? null : "implementation_boundary_not_separate",
  ].filter(isPresent));
  const validatedImplementation: AIContextPacketImplementationValidation = {
    ...builtAIContextPacketPreviewBundle.validation,
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    top_level_implementation_boundary_is_separate:
      topLevelBoundaryIsSeparate,
    invalid_packet_preview_override_rejected: true,
    invalid_target_agent_mode_override_rejected: true,
    invalid_packet_section_override_rejected: true,
    invalid_forbidden_actions_override_rejected: true,
    invalid_authority_boundary_override_rejected: true,
    invalid_refs_override_rejected: true,
  };
  const implementationWithoutFingerprint = {
    implementation_kind: "ai_context_packet_implementation" as const,
    implementation_version: "ai_context_packet_implementation.v0.1" as const,
    source_contract_ref: sourceContractRef,
    source_contract_fingerprint: contract.contract_fingerprint,
    implemented_contract: {
      contract_kind: contract.contract_kind,
      contract_version: contract.contract_version,
      contract_fixture_path:
        input.source_contract_fixture_path ??
        defaultAIContextPacketContractFixturePath,
      type_contract_path:
        input.type_contract_path ?? defaultAIContextPacketTypeContractPath,
      contract_authority_boundary_preserved: true as const,
      contract_validation_policy_preserved: true as const,
      contract_packet_principles_preserved: true as const,
      contract_target_agent_modes_preserved: true as const,
      contract_packet_section_families_preserved: true as const,
      contract_forbidden_actions_policy_preserved: true as const,
    },
    deterministic_builder: {
      builder_path: defaultAIContextPacketBuilderPath,
      deterministic_fixture_backed_only: true,
      ai_context_packet_runtime_build_now: false,
      ai_context_packet_write_now: false,
      codex_handoff_implementation_now: false,
      codex_execution_now: false,
      github_automation_now: false,
      external_handoff_sending_now: false,
      agent_routing_now: false,
      agent_execution_now: false,
      provider_openai_call_now: false,
      retrieval_rag_execution_now: false,
      source_fetch_now: false,
      crawler_now: false,
      runtime_geometry_digest_build_now: false,
      geometry_digest_write_now: false,
      runtime_layout_execution_now: false,
      graph_mutation_now: false,
      durable_perspective_state_read_now: false,
      durable_perspective_state_write_now: false,
      durable_perspective_delta_apply_now: false,
      perspective_snapshot_runtime_now: false,
      proof_evidence_write_now: false,
      accepted_evidence_write_now: false,
      formation_receipt_write_now: false,
      work_mutation_now: false,
      runtime_db_query_now: false,
      runtime_db_write_now: false,
      production_db_used_now: false,
      durable_memory_write_now: false,
    } as const,
    built_ai_context_packet_preview_bundle: builtAIContextPacketPreviewBundle,
    validated_implementation: validatedImplementation,
    authority_boundary: authorityBoundary,
    recommendation_status:
      "ready_for_ai_context_packet_browser_validation_v0_1" as const,
    next_recommended_slice: "ai_context_packet_browser_validation_v0_1" as const,
    fingerprint_algorithm: "fnv1a32_canonical_json" as const,
  };
  return {
    ...implementationWithoutFingerprint,
    implementation_fingerprint: createAIContextPacketFingerprint(
      implementationWithoutFingerprint,
    ),
  };
}

export function buildAIContextPacketPreviewBundle(
  input: AIContextPacketPreviewBundleInput,
): AIContextPacketPreviewBundle {
  const sample = asRecord(input.contract.sample_ai_context_packet_preview);
  const packetInputPreview = clone(
    input.packet_input_preview ?? asRecord(sample.packet_input_preview),
  );
  const packetPreview = clone(
    input.packet_preview ?? asRecord(sample.packet_preview),
  ) as AIContextPacketPreview & JsonRecord;
  const targetAgentModes =
    input.target_agent_modes ?? input.contract.target_agent_modes;
  const packetSectionFamilies =
    input.packet_section_families ?? input.contract.packet_section_families;
  const forbiddenActionsPolicy =
    input.forbidden_actions_policy ?? input.contract.forbidden_actions_policy;
  const bundleWithoutValidation = {
    preview_version: "ai_context_packet_preview.v0.1" as const,
    source_contract_ref:
      input.source_contract_ref ??
      `${input.contract.contract_version}:${defaultAIContextPacketContractFixturePath}`,
    operator_context_ref:
      input.operator_context_ref ?? asString(sample.operator_context_ref),
    packet_input_preview: packetInputPreview,
    packet_preview: packetPreview,
    packet_principle_summary: buildAIContextPacketPrincipleSummary(
      input.contract,
    ),
    target_agent_mode_summary: buildAIContextPacketTargetAgentModeSummary(
      targetAgentModes,
    ),
    packet_section_family_summary:
      buildAIContextPacketSectionFamilySummary(packetSectionFamilies),
    forbidden_actions_summary:
      buildAIContextPacketForbiddenActionsSummary(forbiddenActionsPolicy),
    reference_summary: buildAIContextPacketReferenceSummary(
      packetInputPreview,
      packetPreview,
      input.contract.privacy_policy,
    ),
    authority_boundary: clone(input.contract.authority_boundary),
    validation_policy: clone(input.contract.validation_policy),
    forbidden_actions_policy: clone(forbiddenActionsPolicy),
  };
  return {
    ...bundleWithoutValidation,
    validation: validateAIContextPacketPreviewBundle(
      bundleWithoutValidation,
      input.contract,
      targetAgentModes,
      packetSectionFamilies,
      forbiddenActionsPolicy,
    ),
  };
}

export function validateAIContextPacketPreviewBundle(
  previewBundle: Omit<AIContextPacketPreviewBundle, "validation">,
  contract: AIContextPacketContract,
  targetAgentModes: AIContextPacketTargetAgentModeContract[] =
    contract.target_agent_modes,
  packetSectionFamilies: AIContextPacketSectionFamily[] =
    contract.packet_section_families,
  forbiddenActionsPolicy: AIContextPacketForbiddenActionsPolicy =
    contract.forbidden_actions_policy,
): AIContextPacketImplementationValidation {
  const failureCodes = new Set<string>();
  const packet = previewBundle.packet_preview;
  const referenceValidation = validateAIContextPacketReferences(
    previewBundle.packet_input_preview,
    packet,
  );
  validateAIContextPacketPreview(packet, failureCodes);
  validateAIContextPacketTargetAgentModes(
    packet.target_agent_mode,
    targetAgentModes,
    failureCodes,
  );
  validateAIContextPacketSectionFamilies(packetSectionFamilies, failureCodes);
  validateAIContextPacketSections(packet, failureCodes);
  validateAIContextPacketForbiddenActions(
    forbiddenActionsPolicy,
    packet.forbidden_actions,
    failureCodes,
  );
  validateAIContextPacketContractAuthorityBoundary(
    previewBundle.authority_boundary,
    failureCodes,
  );
  if (!referenceValidation.public_safe_refs_only) {
    failureCodes.add("private_or_unstable_ref_detected");
  }
  if (!referenceValidation.no_raw_private_source_body) {
    failureCodes.add("raw_private_source_body_detected");
  }
  if (!referenceValidation.no_raw_provider_thread_run_session_ids) {
    failureCodes.add("raw_provider_thread_run_session_id_detected");
  }
  if (!referenceValidation.public_safe_file_paths_only) {
    failureCodes.add("private_or_unstable_ref_detected");
  }

  const previewBoundaryMatchesContract = deepEqual(
    previewBundle.authority_boundary,
    contract.authority_boundary,
  );
  const validationPolicyMatchesContract = deepEqual(
    previewBundle.validation_policy,
    contract.validation_policy,
  );
  const forbiddenActionsPolicyMatchesContract = deepEqual(
    previewBundle.forbidden_actions_policy,
    contract.forbidden_actions_policy,
  );
  const packetInputFieldsPreserved = deepEqual(
    contract.packet_input_fields,
    expectedAIContextPacketInputFields,
  );
  const packetOutputFieldsPreserved = deepEqual(
    contract.packet_output_fields,
    expectedAIContextPacketOutputFields,
  );
  const packetPrinciplesPreserved = allTrue(contract.packet_principles);
  const targetAgentModesPreserved =
    validateAIContextPacketTargetAgentModeContracts(
      contract.target_agent_modes,
    );
  const packetSectionFamiliesPreserved =
    validateAIContextPacketSectionFamilyContracts(
      contract.packet_section_families,
    );
  const forbiddenActionsPolicyPreserved = allTrue(
    contract.forbidden_actions_policy,
  );
  const principles = contract.packet_principles;
  const validationPolicy = contract.validation_policy;
  const boundary = previewBundle.authority_boundary;
  const noRuntimeBoundary =
    boundary.ai_context_packet_runtime_build_implemented_now === false &&
    boundary.ai_context_packet_write_now === false &&
    boundary.codex_handoff_implemented_now === false &&
    boundary.codex_execution_now === false &&
    boundary.github_automation_now === false &&
    boundary.external_handoff_sending_now === false &&
    boundary.agent_routing_now === false &&
    boundary.agent_execution_now === false &&
    boundary.provider_openai_call_now === false &&
    boundary.retrieval_rag_execution_now === false &&
    boundary.runtime_geometry_digest_build_implemented_now === false &&
    boundary.runtime_layout_execution_now === false &&
    boundary.graph_mutation_now === false &&
    boundary.durable_perspective_state_read_now === false &&
    boundary.durable_perspective_state_write_now === false &&
    boundary.durable_perspective_delta_apply_now === false &&
    boundary.proof_or_evidence_record_write_now === false &&
    boundary.accepted_evidence_write_now === false &&
    boundary.formation_receipt_write_now === false &&
    boundary.work_mutation_now === false &&
    boundary.runtime_db_write_now === false &&
    boundary.runtime_db_query_now === false &&
    boundary.durable_memory_write_now === false &&
    boundary.product_write_authority === false &&
    boundary.product_id_allocation_authority === false;
  const previewBundleFollowsContract =
    previewBundle.preview_version === "ai_context_packet_preview.v0.1" &&
    hasText(previewBundle.source_contract_ref) &&
    hasText(previewBundle.operator_context_ref) &&
    hasText(packet.packet_id) &&
    Array.isArray(packet.source_refs) &&
    packet.source_refs.length > 0 &&
    previewBoundaryMatchesContract &&
    validationPolicyMatchesContract &&
    forbiddenActionsPolicyMatchesContract &&
    packetInputFieldsPreserved &&
    packetOutputFieldsPreserved &&
    packetPrinciplesPreserved &&
    targetAgentModesPreserved &&
    packetSectionFamiliesPreserved &&
    forbiddenActionsPolicyPreserved &&
    referenceValidation.public_safe_refs_only &&
    referenceValidation.no_raw_private_source_body &&
    referenceValidation.no_raw_provider_thread_run_session_ids &&
    referenceValidation.no_private_urls &&
    referenceValidation.no_secrets &&
    noRuntimeBoundary &&
    failureCodes.size === 0;
  const validationWithoutFailureCodes = {
    preview_bundle_follows_contract: previewBundleFollowsContract,
    preview_bundle_authority_boundary_matches_contract:
      previewBoundaryMatchesContract,
    preview_bundle_validation_policy_matches_contract:
      validationPolicyMatchesContract,
    preview_bundle_forbidden_actions_policy_matches_contract:
      forbiddenActionsPolicyMatchesContract,
    top_level_implementation_boundary_is_separate: true,
    packet_input_fields_preserved: packetInputFieldsPreserved,
    packet_output_fields_preserved: packetOutputFieldsPreserved,
    packet_principles_preserved: packetPrinciplesPreserved,
    target_agent_modes_preserved: targetAgentModesPreserved,
    packet_section_families_preserved: packetSectionFamiliesPreserved,
    forbidden_actions_policy_preserved: forbiddenActionsPolicyPreserved,
    ai_context_packet_is_context_not_execution_authority:
      principles.ai_context_packet_is_context_not_execution_authority === true,
    packet_is_folded_derived_advisory_only:
      principles.packet_is_folded_derived_advisory_only === true,
    packet_not_source_of_truth:
      principles.packet_not_source_of_truth === true,
    packet_not_proof_or_evidence:
      principles.packet_not_proof_or_evidence === true,
    packet_not_durable_perspective_state:
      principles.packet_not_durable_perspective_state === true,
    packet_not_work_status: principles.packet_not_work_status === true,
    packet_not_product_write: principles.packet_not_product_write === true,
    source_refs_required:
      principles.source_refs_required === true &&
      Array.isArray(packet.source_refs) &&
      packet.source_refs.length > 0,
    unresolved_tensions_preserved:
      principles.unresolved_tensions_preserved === true &&
      Array.isArray(packet.unresolved_tensions) &&
      packet.unresolved_tensions.length > 0,
    knowledge_gaps_preserved:
      principles.knowledge_gaps_preserved === true &&
      Array.isArray(packet.knowledge_gaps) &&
      packet.knowledge_gaps.length > 0,
    candidate_durable_distinction_preserved:
      principles.candidate_durable_distinction_preserved === true &&
      asArray(packet.selected_research_candidates).every(
        (candidate) => asRecord(candidate).candidate_only === true,
      ) &&
      asArray(packet.selected_perspective_delta_candidates).every(
        (candidate) => asRecord(candidate).delta_candidate_only === true,
      ),
    authority_boundary_required:
      principles.authority_boundary_required === true &&
      Boolean(packet.authority_boundary),
    forbidden_actions_required:
      principles.forbidden_actions_required === true &&
      Array.isArray(packet.forbidden_actions) &&
      packet.forbidden_actions.length > 0,
    stop_conditions_required:
      principles.stop_conditions_required === true &&
      Array.isArray(packet.stop_conditions) &&
      packet.stop_conditions.length > 0,
    final_critical_facts_review_cues_not_authority:
      principles.final_critical_facts_are_review_cues_not_authority === true &&
      asArray(packet.final_critical_facts).every(
        (fact) => asRecord(fact).review_cue_only === true,
      ),
    target_agent_mode_scope_not_authority:
      principles.target_agent_mode_is_scope_not_authority === true &&
      targetAgentModesPreserved,
    codex_handoff_draft_not_execution_approval:
      principles.codex_handoff_draft_not_execution_approval === true,
    github_codex_automation_not_authority:
      principles.github_codex_automation_not_authority === true,
    provider_output_not_execution_authority:
      principles.provider_output_not_execution_authority === true,
    retrieval_rag_context_recall_not_authority:
      principles.retrieval_rag_context_recall_not_authority === true,
    perspective_geometry_digest_interpretation_not_truth:
      principles.perspective_geometry_digest_interpretation_not_truth === true,
    expected_files_hints_not_write_authority:
      asArray(packet.expected_files).every(
        (file) => asRecord(file).not_file_write_authority === true,
      ),
    expected_checks_hints_not_execution_authority:
      asArray(packet.expected_checks).every(
        (check) => asRecord(check).not_execution_authority === true,
      ),
    runtime_packet_build_not_implemented:
      validationPolicy.no_runtime_packet_build === true &&
      boundary.ai_context_packet_runtime_build_implemented_now === false,
    ai_context_packet_write_not_implemented:
      validationPolicy.no_ai_context_packet_write === true &&
      boundary.ai_context_packet_write_now === false,
    codex_handoff_not_implemented:
      validationPolicy.no_codex_handoff_implementation === true &&
      boundary.codex_handoff_implemented_now === false,
    codex_execution_now_false:
      validationPolicy.no_codex_execution === true &&
      boundary.codex_execution_now === false,
    github_automation_now_false:
      validationPolicy.no_github_automation === true &&
      boundary.github_automation_now === false,
    external_handoff_sending_now_false:
      validationPolicy.no_external_handoff_sending === true &&
      boundary.external_handoff_sending_now === false,
    agent_routing_execution_now_false:
      validationPolicy.no_agent_routing_or_execution === true &&
      boundary.agent_routing_now === false &&
      boundary.agent_execution_now === false,
    provider_openai_call_not_implemented:
      validationPolicy.no_provider_openai_call === true &&
      boundary.provider_openai_call_now === false,
    retrieval_rag_execution_not_implemented:
      validationPolicy.no_retrieval_rag_execution === true &&
      boundary.retrieval_rag_execution_now === false,
    runtime_geometry_digest_build_not_implemented:
      validationPolicy.no_runtime_geometry_digest_build === true &&
      boundary.runtime_geometry_digest_build_implemented_now === false,
    runtime_layout_execution_not_implemented:
      validationPolicy.no_runtime_layout_execution === true &&
      boundary.runtime_layout_execution_now === false,
    graph_mutation_now_false:
      validationPolicy.no_graph_mutation === true &&
      boundary.graph_mutation_now === false,
    runtime_state_read_write_not_implemented:
      validationPolicy.no_runtime_state_read_or_write === true &&
      boundary.durable_perspective_state_read_now === false &&
      boundary.durable_perspective_state_write_now === false,
    durable_perspective_delta_apply_not_implemented:
      validationPolicy.no_durable_perspective_delta_apply === true &&
      boundary.durable_perspective_delta_apply_now === false,
    proof_or_evidence_write_not_implemented:
      validationPolicy.no_proof_or_evidence_write === true &&
      boundary.proof_or_evidence_record_write_now === false,
    accepted_evidence_write_not_implemented:
      validationPolicy.no_accepted_evidence_write === true &&
      boundary.accepted_evidence_write_now === false,
    formation_receipt_write_not_implemented:
      validationPolicy.no_formation_receipt_write === true &&
      boundary.formation_receipt_write_now === false,
    work_mutation_now_false:
      validationPolicy.no_work_mutation === true &&
      boundary.work_mutation_now === false,
    runtime_db_write_query_not_implemented:
      validationPolicy.no_runtime_db_write_or_query === true &&
      boundary.runtime_db_write_now === false &&
      boundary.runtime_db_query_now === false,
    durable_memory_write_not_implemented:
      boundary.durable_memory_write_now === false,
    product_write_not_implemented:
      validationPolicy.no_product_write_or_ids === true &&
      boundary.product_write_authority === false &&
      boundary.product_id_allocation_authority === false,
    public_safe_refs_only: referenceValidation.public_safe_refs_only,
    no_raw_private_source_body:
      referenceValidation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      referenceValidation.no_raw_provider_thread_run_session_ids,
    no_private_urls: referenceValidation.no_private_urls,
    no_secrets: referenceValidation.no_secrets,
    invalid_packet_preview_override_rejected: true,
    invalid_target_agent_mode_override_rejected: true,
    invalid_packet_section_override_rejected: true,
    invalid_forbidden_actions_override_rejected: true,
    invalid_authority_boundary_override_rejected: true,
    invalid_refs_override_rejected: true,
  };
  const falseValidationFlags = Object.entries(validationWithoutFailureCodes)
    .filter(([, value]) => value === false)
    .map(([key]) => key);
  for (const key of falseValidationFlags) {
    failureCodes.add(key);
  }
  return {
    passed: failureCodes.size === 0,
    failure_codes: uniqueSorted(Array.from(failureCodes)),
    ...validationWithoutFailureCodes,
  };
}

export function createAIContextPacketFingerprint(value: unknown): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripAIContextPacketGeneratedFields(value)))}`;
}

function buildAIContextPacketPrincipleSummary(
  contract: AIContextPacketContract,
): AIContextPacketPrincipleSummary {
  return {
    ...clone(contract.packet_principles),
    packet_principle_count: Object.keys(contract.packet_principles).length,
    all_packet_principles_preserved: allTrue(contract.packet_principles),
  };
}

function buildAIContextPacketTargetAgentModeSummary(
  modes: AIContextPacketTargetAgentModeContract[],
): AIContextPacketTargetAgentModeSummary {
  return {
    target_agent_mode_count: modes.length,
    target_agent_modes: modes.map((mode) => mode.mode),
    all_target_agent_modes_preserved:
      validateAIContextPacketTargetAgentModeContracts(modes),
    all_modes_presentation_scope_only: modes.every(
      (mode) => mode.presentation_scope_only === true,
    ),
    all_modes_without_execution_authority: modes.every(
      (mode) => mode.execution_authority === false,
    ),
    all_modes_without_external_state_or_tool_widening_authority: modes.every(
      (mode) =>
        !flagEnabled(mode, "external_call_authority") &&
        !flagEnabled(mode, "state_mutation_authority") &&
        !flagEnabled(mode, "codex_execution_authority_now") &&
        !flagEnabled(mode, "github_automation_authority_now") &&
        !flagEnabled(mode, "tool_widening_now") &&
        !flagEnabled(mode, "ui_rendering_now"),
    ),
  };
}

function buildAIContextPacketSectionFamilySummary(
  families: AIContextPacketSectionFamily[],
): AIContextPacketSectionFamilySummary {
  return {
    packet_section_family_count: families.length,
    section_kinds: families.map((family) => family.section_kind),
    all_packet_section_families_preserved:
      validateAIContextPacketSectionFamilyContracts(families),
    all_sections_runtime_write_now_false: families.every(
      (family) => family.runtime_write_now === false,
    ),
  };
}

function buildAIContextPacketForbiddenActionsSummary(
  policy: AIContextPacketForbiddenActionsPolicy,
): AIContextPacketForbiddenActionsSummary {
  return {
    ...clone(policy),
    forbidden_action_count: Object.keys(policy).length,
    all_forbidden_actions_preserved: allTrue(policy),
  };
}

function buildAIContextPacketReferenceSummary(
  packetInputPreview: JsonRecord,
  packetPreview: AIContextPacketPreview,
  _privacyPolicy: AIContextPacketPrivacyPolicy,
): AIContextPacketReferenceSummary {
  const referenceValidation = validateAIContextPacketReferences(
    packetInputPreview,
    packetPreview,
  );
  const refs = collectAIContextPacketRefs(packetInputPreview, packetPreview);
  return {
    public_safe_refs_only: referenceValidation.public_safe_refs_only,
    no_raw_private_source_body:
      referenceValidation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      referenceValidation.no_raw_provider_thread_run_session_ids,
    no_private_urls: referenceValidation.no_private_urls,
    no_secrets: referenceValidation.no_secrets,
    packet_ref_count: countRefs(refs, "ai_context_packet_ref:public:"),
    candidate_ref_count: countRefs(refs, "candidate_ref:public:"),
    tension_ref_count: countRefs(refs, "tension_ref:public:"),
    knowledge_gap_ref_count: countRefs(refs, "knowledge_gap_ref:public:"),
    source_ref_count: countRefs(refs, "source_ref:public:"),
    digest_ref_count: countRefs(refs, "geometry_digest_ref:public:"),
    state_ref_count: countRefs(refs, "state_summary_ref:public:"),
    stop_condition_ref_count: countRefs(
      refs,
      "stop_condition_ref:public:",
    ),
    check_ref_count: countRefs(refs, "npm run "),
    public_safe_file_paths_only:
      referenceValidation.public_safe_file_paths_only,
  };
}

function validateAIContextPacketPreview(
  packet: AIContextPacketPreview,
  failureCodes: Set<string>,
): void {
  if (!hasText(packet.packet_id)) {
    failureCodes.add("packet_preview_missing_packet_id");
    failureCodes.add("packet_id_missing");
  }
  if (!Array.isArray(packet.source_refs) || packet.source_refs.length === 0) {
    failureCodes.add("packet_preview_missing_source_refs");
    failureCodes.add("source_refs_missing");
  }
  if (packet.all_runtime_write_now_false !== true) {
    failureCodes.add("packet_preview_runtime_write_enabled");
  }
  if (packet.all_sections_public_safe !== true) {
    failureCodes.add("packet_preview_not_public_safe");
  }
  if (!packet.authority_boundary) {
    failureCodes.add("packet_preview_missing_authority_boundary");
  }
  if (!Array.isArray(packet.forbidden_actions) || packet.forbidden_actions.length === 0) {
    failureCodes.add("packet_preview_missing_forbidden_actions");
  }
  if (!Array.isArray(packet.stop_conditions) || packet.stop_conditions.length === 0) {
    failureCodes.add("packet_preview_missing_stop_conditions");
  }
  if (!Array.isArray(packet.unresolved_tensions) || packet.unresolved_tensions.length === 0) {
    failureCodes.add("packet_preview_missing_unresolved_tensions");
  }
  if (!Array.isArray(packet.knowledge_gaps) || packet.knowledge_gaps.length === 0) {
    failureCodes.add("packet_preview_missing_knowledge_gaps");
  }
  if (
    asArray(packet.final_critical_facts).some(
      (fact) => asRecord(fact).authority === true || asRecord(fact).truth_source === true,
    )
  ) {
    failureCodes.add("packet_preview_final_critical_facts_authority_enabled");
  }
  if (
    asArray(packet.expected_files).some(
      (file) => asRecord(file).not_file_write_authority !== true,
    )
  ) {
    failureCodes.add("packet_preview_expected_files_write_authority_enabled");
    failureCodes.add("expected_files_write_authority_enabled");
  }
  if (
    asArray(packet.expected_checks).some(
      (check) => asRecord(check).not_execution_authority !== true,
    )
  ) {
    failureCodes.add("packet_preview_expected_checks_execution_authority_enabled");
    failureCodes.add("expected_checks_execution_authority_enabled");
  }
}

function validateAIContextPacketTargetAgentModes(
  packetTargetMode: string | undefined,
  modes: AIContextPacketTargetAgentModeContract[],
  failureCodes: Set<string>,
): void {
  if (!expectedAIContextPacketTargetAgentModes.includes(packetTargetMode as AIContextPacketTargetAgentMode)) {
    failureCodes.add("target_agent_mode_unknown");
  }
  for (const mode of modes) {
    if (!expectedAIContextPacketTargetAgentModes.includes(mode.mode)) {
      failureCodes.add("target_agent_mode_unknown");
    }
    if (mode.execution_authority !== false) {
      failureCodes.add("target_agent_mode_execution_authority_enabled");
    }
    if (flagEnabled(mode, "external_call_authority")) {
      failureCodes.add("target_agent_mode_external_call_authority_enabled");
    }
    if (flagEnabled(mode, "state_mutation_authority")) {
      failureCodes.add("target_agent_mode_state_mutation_authority_enabled");
    }
    if (flagEnabled(mode, "codex_execution_authority_now")) {
      failureCodes.add("target_agent_mode_codex_execution_enabled");
    }
    if (flagEnabled(mode, "github_automation_authority_now")) {
      failureCodes.add("target_agent_mode_github_automation_enabled");
    }
    if (flagEnabled(mode, "tool_widening_now")) {
      failureCodes.add("target_agent_mode_tool_widening_enabled");
    }
    if (flagEnabled(mode, "ui_rendering_now")) {
      failureCodes.add("target_agent_mode_ui_rendering_enabled");
    }
  }
}

function validateAIContextPacketSectionFamilies(
  families: AIContextPacketSectionFamily[],
  failureCodes: Set<string>,
): void {
  for (const family of families) {
    if (!hasText(family.section_kind)) {
      failureCodes.add("packet_section_missing_section_kind");
      continue;
    }
    if (!expectedAIContextPacketSectionKinds.includes(family.section_kind)) {
      failureCodes.add("packet_section_unknown_section_kind");
    }
    if (family.runtime_write_now !== false) {
      failureCodes.add("packet_section_runtime_write_enabled");
    }
  }
}

function validateAIContextPacketSections(
  packet: AIContextPacketPreview,
  failureCodes: Set<string>,
): void {
  for (const candidate of asArray(packet.selected_research_candidates)) {
    const record = asRecord(candidate);
    if (record.candidate_only !== true) {
      failureCodes.add("selected_candidate_not_candidate_only");
    }
    if (record.not_evidence !== true || record.not_proof !== true) {
      failureCodes.add("selected_candidate_proof_or_evidence_enabled");
    }
    if (record.not_durable_state !== true) {
      failureCodes.add("selected_candidate_durable_state_enabled");
    }
    if (asArray(record.source_refs).length === 0) {
      failureCodes.add("selected_candidate_missing_source_refs");
    }
  }
  for (const candidate of asArray(packet.selected_perspective_delta_candidates)) {
    if (asRecord(candidate).not_durable_perspective_delta !== true) {
      failureCodes.add("perspective_delta_candidate_durable_delta_enabled");
    }
  }
  for (const tension of asArray(packet.unresolved_tensions)) {
    const record = asRecord(tension);
    if (record.resolution_not_implied !== true) {
      failureCodes.add("unresolved_tension_resolution_implied");
    }
    if (asArray(record.source_refs).length === 0) {
      failureCodes.add("unresolved_tension_missing_source_refs");
    }
  }
  for (const gap of asArray(packet.knowledge_gaps)) {
    const record = asRecord(gap);
    if (record.closure_not_implied !== true) {
      failureCodes.add("knowledge_gap_closure_implied");
    }
    if (asArray(record.source_refs).length === 0 && record.source_refs_or_gap_reason_required !== true) {
      failureCodes.add("knowledge_gap_missing_gap_reason");
    }
  }
  const digestSummary = asRecord(packet.perspective_geometry_digest_summary);
  if (
    digestSummary.interpretation_not_truth !== true ||
    digestSummary.raw_coordinates_not_source_of_truth !== true ||
    digestSummary.diagnostics_advisory_only !== true
  ) {
    failureCodes.add("geometry_digest_summary_truth_enabled");
  }
  const boundarySection = asRecord(packet.authority_boundary);
  if (
    boundarySection.execution_authority === true ||
    boundarySection.codex_execution_authority === true ||
    boundarySection.product_write_authority === true
  ) {
    failureCodes.add("authority_boundary_section_execution_enabled");
  }
  if (
    asArray(packet.final_critical_facts).some(
      (fact) => asRecord(fact).not_truth_source !== true,
    )
  ) {
    failureCodes.add("final_critical_facts_truth_source_enabled");
  }
}

function validateAIContextPacketForbiddenActions(
  policy: AIContextPacketForbiddenActionsPolicy,
  packetForbiddenActions: string[] | undefined,
  failureCodes: Set<string>,
): void {
  const requiredPolicyMap: Array<[keyof AIContextPacketForbiddenActionsPolicy, string]> = [
    ["no_runtime_execution_from_packet", "forbidden_action_missing_no_runtime_execution"],
    ["no_codex_execution_from_packet", "forbidden_action_missing_no_codex_execution"],
    ["no_github_automation_from_packet", "forbidden_action_missing_no_github_automation"],
    ["no_provider_openai_call_from_packet", "forbidden_action_missing_no_provider_openai_call"],
    ["no_retrieval_rag_execution_from_packet", "forbidden_action_missing_no_retrieval_rag_execution"],
    ["no_db_write_or_query_from_packet", "forbidden_action_missing_no_db_write_or_query"],
    ["no_perspective_promotion_from_packet", "forbidden_action_missing_no_perspective_promotion"],
    ["no_product_write_from_packet", "forbidden_action_missing_no_product_write"],
  ];
  for (const [policyKey, failureCode] of requiredPolicyMap) {
    if (policy[policyKey] !== true) {
      failureCodes.add(failureCode);
    }
  }
  if (!Array.isArray(packetForbiddenActions) || packetForbiddenActions.length === 0) {
    failureCodes.add("packet_preview_missing_forbidden_actions");
  }
}

function validateAIContextPacketContractAuthorityBoundary(
  boundary: AIContextPacketAuthorityBoundary,
  failureCodes: Set<string>,
): void {
  if (boundary.ai_context_packet_runtime_build_implemented_now !== false) {
    failureCodes.add("ai_context_packet_runtime_build_enabled");
  }
  if (boundary.ai_context_packet_write_now !== false) {
    failureCodes.add("ai_context_packet_write_enabled");
  }
  if (boundary.codex_handoff_implemented_now !== false) {
    failureCodes.add("codex_handoff_enabled");
  }
  if (boundary.codex_execution_now !== false) {
    failureCodes.add("codex_execution_enabled");
  }
  if (boundary.github_automation_now !== false) {
    failureCodes.add("github_automation_enabled");
  }
  if (boundary.external_handoff_sending_now !== false) {
    failureCodes.add("external_handoff_sending_enabled");
  }
  if (boundary.agent_routing_now !== false) {
    failureCodes.add("agent_routing_enabled");
  }
  if (boundary.agent_execution_now !== false) {
    failureCodes.add("agent_execution_enabled");
  }
  if (boundary.provider_openai_call_now !== false) {
    failureCodes.add("provider_openai_call_enabled");
  }
  if (boundary.retrieval_rag_execution_now !== false) {
    failureCodes.add("retrieval_rag_execution_enabled");
  }
  if (boundary.runtime_geometry_digest_build_implemented_now !== false) {
    failureCodes.add("runtime_geometry_digest_build_enabled");
  }
  if (boundary.graph_mutation_now !== false) {
    failureCodes.add("graph_mutation_enabled");
  }
  if (boundary.durable_perspective_state_read_now !== false) {
    failureCodes.add("durable_perspective_state_read_enabled");
  }
  if (boundary.durable_perspective_state_write_now !== false) {
    failureCodes.add("durable_perspective_state_write_enabled");
  }
  if (boundary.durable_perspective_delta_apply_now !== false) {
    failureCodes.add("durable_perspective_delta_apply_enabled");
  }
  if (boundary.proof_or_evidence_record_write_now !== false) {
    failureCodes.add("proof_or_evidence_record_write_enabled");
  }
  if (boundary.accepted_evidence_write_now !== false) {
    failureCodes.add("accepted_evidence_write_enabled");
  }
  if (boundary.formation_receipt_write_now !== false) {
    failureCodes.add("formation_receipt_write_enabled");
  }
  if (boundary.work_mutation_now !== false) {
    failureCodes.add("work_mutation_enabled");
  }
  if (boundary.runtime_db_query_now !== false) {
    failureCodes.add("runtime_db_query_enabled");
  }
  if (boundary.runtime_db_write_now !== false) {
    failureCodes.add("runtime_db_write_enabled");
  }
  if (boundary.durable_memory_write_now !== false) {
    failureCodes.add("durable_memory_write_enabled");
  }
  if (boundary.ai_context_packet_authority !== false) {
    failureCodes.add("ai_context_packet_authority_enabled");
  }
  if (boundary.target_agent_mode_authority !== false) {
    failureCodes.add("target_agent_mode_authority_enabled");
  }
  if (boundary.final_critical_facts_authority !== false) {
    failureCodes.add("final_critical_facts_authority_enabled");
  }
  if (boundary.expected_files_write_authority !== false) {
    failureCodes.add("expected_files_write_authority_enabled");
  }
  if (boundary.expected_checks_execution_authority !== false) {
    failureCodes.add("expected_checks_execution_authority_enabled");
  }
  if (boundary.product_write_authority !== false) {
    failureCodes.add("product_write_enabled");
  }
  if (boundary.product_id_allocation_authority !== false) {
    failureCodes.add("product_id_allocation_enabled");
  }
}

function validateAIContextPacketImplementationAuthorityBoundary(
  boundary: AIContextPacketImplementationAuthorityBoundary,
): string[] {
  const failureCodes = new Set<string>();
  validateAIContextPacketContractAuthorityBoundary(
    boundary as unknown as AIContextPacketAuthorityBoundary,
    failureCodes,
  );
  if (boundary.implementation_added_now !== true) {
    failureCodes.add("implementation_added_now_missing");
  }
  if (boundary.deterministic_builder_added_now !== true) {
    failureCodes.add("deterministic_builder_added_now_missing");
  }
  if (boundary.contract_changed_now !== false) {
    failureCodes.add("contract_changed_now_enabled");
  }
  return Array.from(failureCodes);
}

function validateAIContextPacketTargetAgentModeContracts(
  modes: AIContextPacketTargetAgentModeContract[],
): boolean {
  return (
    deepEqual(
      modes.map((mode) => mode.mode),
      expectedAIContextPacketTargetAgentModes,
    ) &&
    modes.every(
      (mode) =>
        mode.presentation_scope_only === true &&
        mode.execution_authority === false &&
        !flagEnabled(mode, "external_call_authority") &&
        !flagEnabled(mode, "state_mutation_authority") &&
        !flagEnabled(mode, "codex_execution_authority_now") &&
        !flagEnabled(mode, "github_automation_authority_now") &&
        !flagEnabled(mode, "tool_widening_now") &&
        !flagEnabled(mode, "ui_rendering_now"),
    )
  );
}

function validateAIContextPacketSectionFamilyContracts(
  families: AIContextPacketSectionFamily[],
): boolean {
  return (
    deepEqual(
      families.map((family) => family.section_kind),
      expectedAIContextPacketSectionKinds,
    ) &&
    families.every((family) => family.runtime_write_now === false)
  );
}

function getAIContextPacketImplementationAuthorityBoundary(): AIContextPacketImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    deterministic_builder_added_now: true,
    contract_changed_now: false,
    ai_context_packet_runtime_build_implemented_now: false,
    ai_context_packet_write_now: false,
    codex_handoff_implemented_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    external_handoff_sending_now: false,
    agent_routing_now: false,
    agent_execution_now: false,
    provider_openai_call_now: false,
    provider_extraction_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    runtime_geometry_digest_build_implemented_now: false,
    geometry_digest_write_now: false,
    geometry_calculation_runtime_now: false,
    raw_coordinate_authority: false,
    raw_coordinate_only_digest_now: false,
    runtime_layout_implemented_now: false,
    runtime_layout_execution_now: false,
    graph_db_implemented_now: false,
    graph_mutation_now: false,
    browser_request_now: false,
    browser_persistence_now: false,
    durable_perspective_state_read_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_implemented_now: false,
    trajectory_runtime_build_implemented_now: false,
    proof_or_evidence_record_write_now: false,
    accepted_evidence_write_now: false,
    formation_receipt_write_now: false,
    work_mutation_now: false,
    candidate_mutation_now: false,
    candidate_record_write_now: false,
    runtime_promotion_implemented_now: false,
    promotion_decision_record_implemented_now: false,
    promotion_decision_record_write_now: false,
    runtime_index_build_implemented_now: false,
    runtime_index_write_now: false,
    embedding_generation_implemented_now: false,
    vector_db_implemented_now: false,
    fts_implemented_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
    runtime_persistence_implemented_now: false,
    durable_memory_write_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    agent_routing_authority: false,
    agent_execution_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    layout_coordinate_authority: false,
    geometry_digest_authority: false,
    diagnostic_authority: false,
    recommendation_authority: false,
    ai_context_packet_authority: false,
    target_agent_mode_authority: false,
    final_critical_facts_authority: false,
    expected_files_write_authority: false,
    expected_checks_execution_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function validateAIContextPacketReferences(
  packetInputPreview: JsonRecord,
  packetPreview: AIContextPacketPreview,
) {
  const refs = collectAIContextPacketRefs(packetInputPreview, packetPreview);
  const rawRecords = [packetInputPreview, packetPreview];
  return {
    public_safe_refs_only: refs.every(isPublicSafeRefOrHint),
    no_raw_private_source_body: !containsKeyMatching(
      rawRecords,
      /raw_(?:private_)?source_body/i,
    ),
    no_raw_provider_thread_run_session_ids: !containsKeyMatching(
      rawRecords,
      /(?:thread|run|session)_id/i,
    ),
    no_private_urls: refs.every((ref) => !/^https?:\/\//i.test(ref)),
    no_secrets: refs.every((ref) => !/(?:sk-|secret|token|password)/i.test(ref)),
    public_safe_file_paths_only: asArray(packetPreview.expected_files).every(
      (file) => isPublicSafeFilePath(asString(asRecord(file).file_path)),
    ),
  };
}

function collectAIContextPacketRefs(
  packetInputPreview: JsonRecord,
  packetPreview: AIContextPacketPreview,
): string[] {
  const refs: string[] = [];
  visit([packetInputPreview, packetPreview], (key, nestedValue) => {
    if (/(?:^|_)refs?$/.test(key) || key === "check_ref" || key === "file_path") {
      if (typeof nestedValue === "string") {
        refs.push(nestedValue);
      } else if (Array.isArray(nestedValue)) {
        refs.push(...nestedValue.filter((item): item is string => typeof item === "string"));
      }
    }
  });
  return refs;
}

function isPublicSafeRefOrHint(value: string): boolean {
  if (value.startsWith("npm run ")) return true;
  if (isPublicSafeFilePath(value)) return true;
  if (!value.includes(":public:")) return false;
  return !/(?:https?:\/\/|private|thread_|run_|session_|sk-|secret|token|password)/i.test(
    value,
  );
}

function isPublicSafeFilePath(value: string): boolean {
  return (
    /^[A-Za-z0-9_./:-]+$/.test(value) &&
    !value.startsWith("/") &&
    !value.includes("..") &&
    !/(?:private|secret|token|password|https?:\/\/)/i.test(value)
  );
}

function containsKeyMatching(values: unknown[], pattern: RegExp): boolean {
  let found = false;
  visit(values, (key, nestedValue) => {
    if (pattern.test(key) && nestedValue !== undefined && nestedValue !== null) {
      found = true;
    }
  });
  return found;
}

function countRefs(refs: string[], prefix: string): number {
  return refs.filter((ref) => ref.startsWith(prefix)).length;
}

function allTrue(value: object): boolean {
  return Object.values(value).every((item) => item === true);
}

function flagEnabled(value: object, key: string): boolean {
  return (value as JsonRecord)[key] === true;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function stripAIContextPacketGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripAIContextPacketGeneratedFields);
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(
        ([key]) =>
          key !== "implementation_fingerprint" &&
          key !== "packet_fingerprint",
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => [
        key,
        stripAIContextPacketGeneratedFields(nestedValue),
      ]),
  );
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
