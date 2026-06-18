import type {
  ClaimCandidate,
  EvidenceCandidate,
  FollowUpWorkCandidate,
  KnowledgeGapCandidate,
  PerspectiveDeltaCandidate,
  ResearchCandidateReviewPreviewResponse,
  SourceGrounding,
  TensionCandidate,
} from "@/types/research-candidate-review";
import type {
  ResearchCandidateConstellationAuthority,
  ResearchCandidateConstellationEdge,
  ResearchCandidateConstellationEdgeRelation,
  ResearchCandidateConstellationNode,
  ResearchCandidateConstellationOverlay,
  ResearchCandidateConstellationOverlaySourceKind,
  ResearchCandidateConstellationSourceRef,
} from "@/types/research-candidate-constellation-overlay";

export type ResearchCandidateConstellationOverlayBuildOptions = {
  source_kind: ResearchCandidateConstellationOverlaySourceKind;
  source_fixture_path: string;
};

type CandidateWithGrounding =
  | ClaimCandidate
  | EvidenceCandidate
  | TensionCandidate
  | KnowledgeGapCandidate
  | PerspectiveDeltaCandidate;

export function buildResearchCandidateConstellationOverlay(
  preview: ResearchCandidateReviewPreviewResponse,
  options: ResearchCandidateConstellationOverlayBuildOptions,
): ResearchCandidateConstellationOverlay {
  const nodes = buildResearchCandidateConstellationNodes(preview);
  const edges = buildResearchCandidateConstellationEdges(preview);

  const overlay: ResearchCandidateConstellationOverlay = {
    overlay_version: "research_candidate_constellation_overlay.v0.1",
    scope: preview.scope,
    source_kind: options.source_kind,
    source_fixture_path: options.source_fixture_path,
    nodes,
    edges,
    diagnostics: buildDiagnostics(preview, nodes, edges),
    authority: getResearchCandidateConstellationAuthority(),
  };

  if (preview.preview_version) {
    overlay.source_preview_version = preview.preview_version;
  }
  if (preview.fixture_version) {
    overlay.source_fixture_version = preview.fixture_version;
  }

  return overlay;
}

export function buildResearchCandidateConstellationNodes(
  preview: ResearchCandidateReviewPreviewResponse,
): ResearchCandidateConstellationNode[] {
  const nodes: ResearchCandidateConstellationNode[] = [];
  let displayOrder = 1;

  nodes.push(
    buildNode({
      id: "node_research_session",
      kind: "research_session",
      label: preview.research_session_preview.research_question,
      summary: preview.research_session_preview.operator_intent,
      sourceFamily: "research_session_preview",
      sourceObjectId: preview.research_session_preview.session_id,
      reviewStatus: preview.research_session_preview.review_status,
      sourceRefs: preview.research_session_preview.source_refs,
      displayOrder: displayOrder++,
    }),
  );

  for (const sourceReference of preview.source_reference_previews) {
    nodes.push(
      buildNode({
        id: sourceRefNodeId(sourceReference.source_ref_id),
        kind: "source_reference",
        label: sourceReference.title,
        summary: sourceReference.operator_note_summary,
        sourceFamily: "source_reference_previews",
        sourceObjectId: sourceReference.source_ref_id,
        reviewStatus: sourceReference.review_status,
        sourceRefs: [sourceReference.source_ref_id],
        displayOrder: displayOrder++,
      }),
    );
  }

  for (const claim of preview.claim_candidates) {
    nodes.push(
      buildNode({
        id: candidateNodeId(claim.claim_candidate_id),
        kind: "claim_candidate",
        label: claim.claim_candidate_id,
        summary: claim.claim_text,
        sourceFamily: "claim_candidates",
        sourceObjectId: claim.claim_candidate_id,
        reviewStatus: claim.review_status,
        epistemicStatus: claim.epistemic_status,
        sourceRefs: candidateSourceRefs(claim),
        displayOrder: displayOrder++,
      }),
    );
  }

  for (const evidence of preview.evidence_candidates) {
    nodes.push(
      buildNode({
        id: candidateNodeId(evidence.evidence_candidate_id),
        kind: "evidence_candidate",
        label: evidence.evidence_candidate_id,
        summary: evidence.evidence_summary,
        sourceFamily: "evidence_candidates",
        sourceObjectId: evidence.evidence_candidate_id,
        reviewStatus: evidence.review_status,
        epistemicStatus: evidence.epistemic_status,
        sourceRefs: candidateSourceRefs(evidence),
        displayOrder: displayOrder++,
      }),
    );
  }

  for (const tension of preview.tension_candidates) {
    nodes.push(
      buildNode({
        id: candidateNodeId(tension.tension_candidate_id),
        kind: "tension_candidate",
        label: tension.tension_candidate_id,
        summary: tension.summary,
        sourceFamily: "tension_candidates",
        sourceObjectId: tension.tension_candidate_id,
        reviewStatus: tension.review_status,
        epistemicStatus: tension.epistemic_status,
        sourceRefs: candidateSourceRefs(tension),
        displayOrder: displayOrder++,
      }),
    );
  }

  for (const gap of preview.knowledge_gap_candidates) {
    nodes.push(
      buildNode({
        id: candidateNodeId(gap.knowledge_gap_candidate_id),
        kind: "knowledge_gap_candidate",
        label: gap.knowledge_gap_candidate_id,
        summary: gap.summary,
        sourceFamily: "knowledge_gap_candidates",
        sourceObjectId: gap.knowledge_gap_candidate_id,
        reviewStatus: gap.review_status,
        epistemicStatus: gap.epistemic_status,
        sourceRefs: candidateSourceRefs(gap),
        displayOrder: displayOrder++,
      }),
    );
  }

  for (const delta of preview.perspective_delta_candidates) {
    nodes.push(
      buildNode({
        id: candidateNodeId(delta.perspective_delta_candidate_id),
        kind: "perspective_delta_candidate",
        label: delta.perspective_delta_candidate_id,
        summary: delta.proposed_update_summary,
        sourceFamily: "perspective_delta_candidates",
        sourceObjectId: delta.perspective_delta_candidate_id,
        reviewStatus: delta.review_status,
        epistemicStatus: delta.epistemic_status,
        sourceRefs: candidateSourceRefs(delta),
        targetPerspectiveKey: delta.target_perspective_key,
        displayOrder: displayOrder++,
      }),
    );
  }

  for (const followUp of preview.follow_up_work_candidates) {
    nodes.push(
      buildNode({
        id: candidateNodeId(followUp.follow_up_work_candidate_id),
        kind: "follow_up_work_candidate",
        label: followUp.candidate_title,
        summary: followUp.candidate_summary,
        sourceFamily: "follow_up_work_candidates",
        sourceObjectId: followUp.follow_up_work_candidate_id,
        reviewStatus: followUp.review_status,
        sourceRefs: [],
        displayOrder: displayOrder++,
      }),
    );
  }

  for (const targetPerspectiveKey of distinctTargetPerspectiveKeys(preview)) {
    nodes.push(
      buildNode({
        id: targetPerspectiveNodeId(targetPerspectiveKey),
        kind: "target_perspective_anchor",
        label: targetPerspectiveKey,
        summary:
          "Read-only target perspective anchor for candidate delta preview.",
        sourceFamily: "target_perspective_anchor",
        sourceObjectId: targetPerspectiveKey,
        sourceRefs: [],
        targetPerspectiveKey,
        displayOrder: displayOrder++,
      }),
    );
  }

  return nodes;
}

export function buildResearchCandidateConstellationEdges(
  preview: ResearchCandidateReviewPreviewResponse,
): ResearchCandidateConstellationEdge[] {
  const edges: ResearchCandidateConstellationEdge[] = [];

  for (const sourceRef of preview.research_session_preview.source_refs) {
    edges.push(
      buildEdge({
        sourceNodeId: "node_research_session",
        relation: "session_uses_source",
        targetNodeId: sourceRefNodeId(sourceRef),
        label: "session uses source",
        sourceObjectId: preview.research_session_preview.session_id,
        sourceRefs: [sourceRef],
      }),
    );
  }

  for (const claim of preview.claim_candidates) {
    pushDerivedFromSourceEdges(
      edges,
      candidateNodeId(claim.claim_candidate_id),
      "derived_from_source",
      claim.claim_candidate_id,
      candidateSourceRefs(claim),
    );
  }

  for (const evidence of preview.evidence_candidates) {
    pushDerivedFromSourceEdges(
      edges,
      candidateNodeId(evidence.evidence_candidate_id),
      "derived_from_source",
      evidence.evidence_candidate_id,
      candidateSourceRefs(evidence),
    );
    edges.push(
      buildEdge({
        sourceNodeId: candidateNodeId(evidence.claim_candidate_id),
        relation: evidenceRelation(evidence.evidence_role),
        targetNodeId: candidateNodeId(evidence.evidence_candidate_id),
        label: evidence.evidence_role,
        sourceObjectId: evidence.evidence_candidate_id,
        sourceRefs: candidateSourceRefs(evidence),
      }),
    );
  }

  for (const tension of preview.tension_candidates) {
    const tensionNodeId = candidateNodeId(tension.tension_candidate_id);
    pushDerivedFromSourceEdges(
      edges,
      tensionNodeId,
      "derived_from_source",
      tension.tension_candidate_id,
      candidateSourceRefs(tension),
    );
    for (const claimId of tension.related_claim_candidate_ids) {
      edges.push(
        buildEdge({
          sourceNodeId: tensionNodeId,
          relation: "tension_relates_to_claim",
          targetNodeId: candidateNodeId(claimId),
          label: "tension relates to claim",
          sourceObjectId: tension.tension_candidate_id,
          sourceRefs: candidateSourceRefs(tension),
        }),
      );
    }
    for (const evidenceId of tension.related_evidence_candidate_ids) {
      edges.push(
        buildEdge({
          sourceNodeId: tensionNodeId,
          relation: "tension_relates_to_evidence",
          targetNodeId: candidateNodeId(evidenceId),
          label: "tension relates to evidence",
          sourceObjectId: tension.tension_candidate_id,
          sourceRefs: candidateSourceRefs(tension),
        }),
      );
    }
  }

  for (const gap of preview.knowledge_gap_candidates) {
    const gapNodeId = candidateNodeId(gap.knowledge_gap_candidate_id);
    pushDerivedFromSourceEdges(
      edges,
      gapNodeId,
      "derived_from_source",
      gap.knowledge_gap_candidate_id,
      candidateSourceRefs(gap),
    );
    for (const claimId of gap.related_claim_candidate_ids) {
      edges.push(
        buildEdge({
          sourceNodeId: gapNodeId,
          relation: "gap_relates_to_claim",
          targetNodeId: candidateNodeId(claimId),
          label: "gap relates to claim",
          sourceObjectId: gap.knowledge_gap_candidate_id,
          sourceRefs: candidateSourceRefs(gap),
        }),
      );
    }
    for (const tensionId of gap.related_tension_candidate_ids) {
      edges.push(
        buildEdge({
          sourceNodeId: gapNodeId,
          relation: "gap_relates_to_tension",
          targetNodeId: candidateNodeId(tensionId),
          label: "gap relates to tension",
          sourceObjectId: gap.knowledge_gap_candidate_id,
          sourceRefs: candidateSourceRefs(gap),
        }),
      );
    }
  }

  for (const delta of preview.perspective_delta_candidates) {
    const deltaNodeId = candidateNodeId(delta.perspective_delta_candidate_id);
    pushDerivedFromSourceEdges(
      edges,
      deltaNodeId,
      "derived_from_source",
      delta.perspective_delta_candidate_id,
      candidateSourceRefs(delta),
    );
    edges.push(
      buildEdge({
        sourceNodeId: deltaNodeId,
        relation: "delta_proposes_change_to_perspective",
        targetNodeId: targetPerspectiveNodeId(delta.target_perspective_key),
        label: "delta proposes change to perspective",
        sourceObjectId: delta.perspective_delta_candidate_id,
        sourceRefs: candidateSourceRefs(delta),
      }),
    );
    for (const claimId of delta.basis_claim_candidate_ids) {
      edges.push(
        buildEdge({
          sourceNodeId: deltaNodeId,
          relation: "delta_uses_claim_basis",
          targetNodeId: candidateNodeId(claimId),
          label: "delta uses claim basis",
          sourceObjectId: delta.perspective_delta_candidate_id,
          sourceRefs: candidateSourceRefs(delta),
        }),
      );
    }
    for (const evidenceId of delta.basis_evidence_candidate_ids) {
      edges.push(
        buildEdge({
          sourceNodeId: deltaNodeId,
          relation: "delta_uses_evidence_basis",
          targetNodeId: candidateNodeId(evidenceId),
          label: "delta uses evidence basis",
          sourceObjectId: delta.perspective_delta_candidate_id,
          sourceRefs: candidateSourceRefs(delta),
        }),
      );
    }
    for (const tensionId of delta.related_tension_candidate_ids) {
      edges.push(
        buildEdge({
          sourceNodeId: deltaNodeId,
          relation: "delta_preserves_tension",
          targetNodeId: candidateNodeId(tensionId),
          label: "delta preserves tension",
          sourceObjectId: delta.perspective_delta_candidate_id,
          sourceRefs: candidateSourceRefs(delta),
        }),
      );
    }
    for (const gapId of delta.related_gap_candidate_ids) {
      edges.push(
        buildEdge({
          sourceNodeId: deltaNodeId,
          relation: "delta_tracks_gap",
          targetNodeId: candidateNodeId(gapId),
          label: "delta tracks gap",
          sourceObjectId: delta.perspective_delta_candidate_id,
          sourceRefs: candidateSourceRefs(delta),
        }),
      );
    }
  }

  for (const followUp of preview.follow_up_work_candidates) {
    const followUpNodeId = candidateNodeId(followUp.follow_up_work_candidate_id);
    edges.push(
      buildEdge({
        sourceNodeId: followUpNodeId,
        relation: "follow_up_derived_from_session",
        targetNodeId: "node_research_session",
        label: "follow-up derived from session",
        sourceObjectId: followUp.follow_up_work_candidate_id,
        sourceRefs: [],
      }),
    );
  }

  return edges;
}

export function getResearchCandidateConstellationAuthority(): ResearchCandidateConstellationAuthority {
  return {
    read_only: true,
    candidate_only: true,
    source_of_truth: false,
    creates_evidence: false,
    creates_proof: false,
    commits_state: false,
    promotes_perspective: false,
    creates_work_item: false,
    mutates_runtime: false,
    executes_agents: false,
  };
}

function buildNode(options: {
  id: string;
  kind: ResearchCandidateConstellationNode["kind"];
  label: string;
  summary: string;
  sourceFamily: string;
  sourceObjectId: string;
  reviewStatus?: string;
  epistemicStatus?: string;
  sourceRefs: string[];
  targetPerspectiveKey?: string;
  displayOrder: number;
}): ResearchCandidateConstellationNode {
  const node: ResearchCandidateConstellationNode = {
    id: options.id,
    kind: options.kind,
    label: options.label,
    summary: options.summary,
    source_family: options.sourceFamily,
    source_object_id: options.sourceObjectId,
    source_refs: toSourceRefs(options.sourceRefs),
    display_order: options.displayOrder,
    authority: getResearchCandidateConstellationAuthority(),
  };

  if (options.reviewStatus) {
    node.review_status = options.reviewStatus;
  }
  if (options.epistemicStatus) {
    node.epistemic_status = options.epistemicStatus;
  }
  if (options.targetPerspectiveKey) {
    node.target_perspective_key = options.targetPerspectiveKey;
  }

  return node;
}

function buildEdge(options: {
  sourceNodeId: string;
  relation: ResearchCandidateConstellationEdgeRelation;
  targetNodeId: string;
  label: string;
  sourceObjectId: string;
  sourceRefs: string[];
}): ResearchCandidateConstellationEdge {
  return {
    id: edgeId(options.sourceNodeId, options.relation, options.targetNodeId),
    source_node_id: options.sourceNodeId,
    target_node_id: options.targetNodeId,
    relation: options.relation,
    label: options.label,
    source_object_id: options.sourceObjectId,
    source_refs: toSourceRefs(options.sourceRefs),
    authority: getResearchCandidateConstellationAuthority(),
  };
}

function buildDiagnostics(
  preview: ResearchCandidateReviewPreviewResponse,
  nodes: ResearchCandidateConstellationNode[],
  edges: ResearchCandidateConstellationEdge[],
) {
  const groundedCandidateCount =
    preview.claim_candidates.length +
    preview.evidence_candidates.length +
    preview.tension_candidates.length +
    preview.knowledge_gap_candidates.length +
    preview.perspective_delta_candidates.length;
  const groundedCandidateWithSourceRefs = [
    ...preview.claim_candidates,
    ...preview.evidence_candidates,
    ...preview.tension_candidates,
    ...preview.knowledge_gap_candidates,
    ...preview.perspective_delta_candidates,
  ].filter((candidate) => candidateSourceRefs(candidate).length > 0).length;

  return {
    node_count: nodes.length,
    edge_count: edges.length,
    source_reference_node_count: countNodes(nodes, "source_reference"),
    claim_node_count: countNodes(nodes, "claim_candidate"),
    evidence_node_count: countNodes(nodes, "evidence_candidate"),
    tension_node_count: countNodes(nodes, "tension_candidate"),
    knowledge_gap_node_count: countNodes(nodes, "knowledge_gap_candidate"),
    perspective_delta_node_count: countNodes(nodes, "perspective_delta_candidate"),
    follow_up_work_node_count: countNodes(nodes, "follow_up_work_candidate"),
    target_perspective_anchor_count: countNodes(nodes, "target_perspective_anchor"),
    unresolved_tension_count: preview.tension_candidates.filter(
      (tension) => tension.blocks_or_qualifies_promotion,
    ).length,
    promotion_ready_count: preview.perspective_delta_candidates.filter(
      (delta) => delta.promotion_readiness === "ready",
    ).length,
    blocked_or_not_ready_delta_count: preview.perspective_delta_candidates.filter(
      (delta) =>
        delta.promotion_readiness === "blocked" ||
        delta.promotion_readiness === "not_ready",
    ).length,
    source_ref_coverage_ratio:
      groundedCandidateCount === 0
        ? 1
        : groundedCandidateWithSourceRefs / groundedCandidateCount,
  };
}

function pushDerivedFromSourceEdges(
  edges: ResearchCandidateConstellationEdge[],
  candidateNodeIdValue: string,
  relation: ResearchCandidateConstellationEdgeRelation,
  sourceObjectId: string,
  sourceRefs: string[],
) {
  for (const sourceRef of sourceRefs) {
    edges.push(
      buildEdge({
        sourceNodeId: candidateNodeIdValue,
        relation,
        targetNodeId: sourceRefNodeId(sourceRef),
        label: "derived from source",
        sourceObjectId,
        sourceRefs: [sourceRef],
      }),
    );
  }
}

function evidenceRelation(
  evidenceRole: EvidenceCandidate["evidence_role"],
): ResearchCandidateConstellationEdgeRelation {
  if (evidenceRole === "contradicts") return "claim_contradicted_by_evidence";
  if (evidenceRole === "contextualizes") return "claim_contextualized_by_evidence";
  if (evidenceRole === "qualifies") return "claim_qualified_by_evidence";
  if (evidenceRole === "limitation") return "claim_limited_by_evidence";
  return "claim_supported_by_evidence";
}

function candidateSourceRefs(candidate: SourceGrounding) {
  if ("source_refs" in candidate && candidate.source_refs) {
    return candidate.source_refs;
  }
  if ("source_ref_id" in candidate && candidate.source_ref_id) {
    return [candidate.source_ref_id];
  }
  return [];
}

function toSourceRefs(sourceRefs: string[]): ResearchCandidateConstellationSourceRef[] {
  return sourceRefs.map((sourceRefId) => ({ source_ref_id: sourceRefId }));
}

function candidateNodeId(candidateId: string) {
  return `node_${candidateId}`;
}

function sourceRefNodeId(sourceRefId: string) {
  return `node_source_ref_${sourceRefId}`;
}

function targetPerspectiveNodeId(targetPerspectiveKey: string) {
  return `node_target_perspective_${targetPerspectiveKey.replaceAll(".", "_")}`;
}

function edgeId(
  sourceNodeId: string,
  relation: ResearchCandidateConstellationEdgeRelation,
  targetNodeId: string,
) {
  return `edge_${sourceNodeId}__${relation}__${targetNodeId}`;
}

function distinctTargetPerspectiveKeys(
  preview: ResearchCandidateReviewPreviewResponse,
) {
  return Array.from(
    new Set(
      preview.perspective_delta_candidates.map(
        (delta) => delta.target_perspective_key,
      ),
    ),
  );
}

function countNodes(
  nodes: ResearchCandidateConstellationNode[],
  kind: ResearchCandidateConstellationNode["kind"],
) {
  return nodes.filter((node) => node.kind === kind).length;
}
