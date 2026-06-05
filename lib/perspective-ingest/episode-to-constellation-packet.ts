import type {
  PerspectiveIngestChatGptRenderingPacket,
  PerspectiveIngestCodexHandoffPacket,
  PerspectiveIngestConstellationCluster,
  PerspectiveIngestConstellationEdge,
  PerspectiveIngestConstellationNode,
  PerspectiveIngestConstellationPreviewResponse,
  PerspectiveIngestEvidencePointer,
  PerspectiveIngestNextActionCandidate,
  PerspectiveIngestPerspectiveCapsulePreview,
  PerspectiveIngestSessionEpisode,
  PerspectiveIngestSourceQuery,
  PerspectiveIngestUnresolvedTension,
} from "@/types/perspective-ingest-constellation-preview";

const ROUTE_ID =
  "augnes.read.perspective-ingest-constellation-preview.v0.1" as const;
const LOCAL_PREVIEW_ROUTE_ID =
  "augnes.read.perspective-ingest-local-preview.v0.1" as const;
const BOUNDARY_CLASS =
  "read_only_local_ingest_constellation_preview" as const;
const SAMPLE_REQUIRED_CHECKS = [
  "npm run typecheck",
  "npm run smoke:readonly-api-route-constellation-preview",
  "npm run smoke:cockpit-local-only-constellation-route-preview",
  "npm run smoke:perspective-capsule-contract",
  "npm run smoke:perspective-ingest-constellation-preview",
  "git diff --check",
];
const LOCAL_PREVIEW_REQUIRED_CHECKS = [
  "npm run typecheck",
  "npm run smoke:perspective-ingest-constellation-preview",
  "npm run smoke:perspective-ingest-local-pasted-text-preview",
  "npm run smoke:readonly-api-route-constellation-preview",
  "npm run smoke:cockpit-local-only-constellation-route-preview",
  "npm run smoke:perspective-capsule-contract",
  "git diff --check",
];
const SAMPLE_PR_BODY_REQUIREMENTS = [
  "Summary",
  "User-visible capability",
  "Files changed",
  "How synthetic ChatGPT/Codex records become graph packets",
  "How Cockpit visualizes nodes and edges",
  "What ChatGPT review packet contains",
  "What Codex handoff packet contains",
  "Local-only/read-only authority boundary",
  "Validation results with exact commands and results",
  "Skipped checks with concrete reasons",
  "Blockers or risks",
  "Assumptions",
  "Questions requiring user/PM judgment",
  "Next suggested feature slice",
];
const LOCAL_PREVIEW_PR_BODY_REQUIREMENTS = [
  "Summary",
  "User-visible capability",
  "Files changed",
  "Why this uses pasted text before export zip parsing",
  "How pasted text becomes a SessionEpisode",
  "How the POST-only local preview guard works",
  "How Cockpit reuses the graph and packet display",
  "What ChatGPT review packet contains",
  "What Codex handoff packet contains",
  "Local-only/read-only authority boundary",
  "Validation results with exact commands and results",
  "Browser/computer-use usability table",
  "Skipped checks with concrete reasons",
  "Blockers or risks",
  "Repo/task mismatches",
  "Scope risks",
  "Assumptions",
  "Questions requiring user/PM judgment",
  "Next suggested feature slice",
];
const SAMPLE_FINAL_REPORT_REQUIREMENTS = [
  "PR number and URL",
  "branch",
  "commit SHA",
  "changed files",
  "tests run with exact results",
  "blockers",
  "repo/task mismatches",
  "scope risks",
  "assumptions",
  "questions requiring user/PM judgment",
  "next suggested goal",
];
const LOCAL_PREVIEW_FINAL_REPORT_REQUIREMENTS = [
  "PR number and URL",
  "branch",
  "commit SHA",
  "changed files",
  "tests run with exact results",
  "browser/computer-use usability result",
  "blockers",
  "repo/task mismatches",
  "scope risks",
  "assumptions",
  "questions requiring user/PM judgment",
  "next suggested goal",
];
const FORBIDDEN_ACTIONS = [
  "no raw private history persistence",
  "no automatic account scraping",
  "no OAuth",
  "no external calls",
  "no GitHub calls",
  "no DB query",
  "no provider calls",
  "no DB writes",
  "no graph DB",
  "no proof/evidence/readiness writes",
  "no Codex execution",
  "no approval/merge/publish/deploy authority",
];

export function buildPerspectiveIngestConstellationPreviewResponse({
  episodes,
  routeId = ROUTE_ID,
  source,
}: {
  episodes: PerspectiveIngestSessionEpisode[];
  routeId?: typeof ROUTE_ID | typeof LOCAL_PREVIEW_ROUTE_ID;
  source: PerspectiveIngestSourceQuery;
}): PerspectiveIngestConstellationPreviewResponse {
  const [episode] = episodes;

  if (!episode) {
    throw new Error("Perspective ingest preview requires one fixture episode.");
  }

  const sourceKey = getSourceKey(source);
  const evidence_pointers = buildEvidencePointers(episode, sourceKey);
  const unresolved_tensions = buildUnresolvedTensions(
    episode,
    sourceKey,
    evidence_pointers,
  );
  const next_action_candidates = buildNextActionCandidates(
    episode,
    sourceKey,
    unresolved_tensions,
  );
  const constellation = buildConstellationForEpisode({
    episode,
    evidence_pointers,
    next_action_candidates,
    sourceKey,
    unresolved_tensions,
  });
  const thesis = constellation.clusters[0]?.cluster_thesis ?? episode.summary;
  const perspective_capsule_preview = buildPerspectiveCapsulePreview({
    constellation,
    episode,
    next_action_candidates,
    source,
    thesis,
    unresolved_tensions,
  });
  const chatgpt_rendering_packet = buildChatGptRenderingPacket({
    constellation,
    episode,
    next_action_candidates,
    source,
    thesis,
    unresolved_tensions,
  });
  const codex_handoff_packet = buildCodexHandoffPacket({
    constellation,
    episode,
    source,
    thesis,
  });

  return {
    response_version: "perspective_ingest_constellation_preview.v0.1",
    boundary_class: BOUNDARY_CLASS,
    meta: {
      generated_at: episode.synthetic_timestamp,
      route_id: routeId,
      route_family: "perspective_ingest_constellation",
      workspace_scope: "project:augnes",
      project_scope: "project:augnes",
      request_scope_ref: "project:augnes",
      source_query: source,
      deterministic_fixture_generation: source !== "manual:pasted_text",
      local_only: true,
      read_only: true,
      external_calls: false,
      persistence: false,
      graph_db: false,
      proof_evidence_readiness_writes: false,
      codex_execution: false,
    },
    source_kind: episode.source_kind,
    source_refs: buildSourceRefs(episode),
    ingest_batch: {
      batch_id: `batch.${sourceKey}.v0_1`,
      episode_count: episodes.length,
      episode_ids: episodes.map((item) => item.episode_id),
      fixture_only: source !== "manual:pasted_text",
      local_user_provided: source === "manual:pasted_text",
      public_safe: true,
      deterministic: true,
      boundary_notes: episode.public_safety.boundary_notes,
    },
    constellation,
    perspective_capsule_preview,
    chatgpt_rendering_packet,
    codex_handoff_packet,
    evidence_pointers,
    unresolved_tensions,
    next_action_candidates,
  };
}

function buildConstellationForEpisode({
  episode,
  evidence_pointers,
  next_action_candidates,
  sourceKey,
  unresolved_tensions,
}: {
  episode: PerspectiveIngestSessionEpisode;
  evidence_pointers: PerspectiveIngestEvidencePointer[];
  next_action_candidates: PerspectiveIngestNextActionCandidate[];
  sourceKey: string;
  unresolved_tensions: PerspectiveIngestUnresolvedTension[];
}) {
  if (episode.source_kind === "chatgpt_record_fixture") {
    return buildChatGptConstellation({
      episode,
      evidence_pointers,
      next_action_candidates,
      sourceKey,
      unresolved_tensions,
    });
  }

  if (episode.source_kind === "codex_record_fixture") {
    return buildCodexConstellation({
      episode,
      evidence_pointers,
      next_action_candidates,
      sourceKey,
      unresolved_tensions,
    });
  }

  return buildManualPastedTextConstellation({
    episode,
    evidence_pointers,
    next_action_candidates,
    sourceKey,
    unresolved_tensions,
  });
}

function buildSourceRefs(episode: PerspectiveIngestSessionEpisode) {
  const isManual = episode.source_kind === "manual_pasted_text";

  return [
    {
      source_ref: episode.source_ref,
      source_kind: episode.source_kind,
      source_label: episode.source_label,
      source_scope: "project:augnes" as const,
      provenance_note: isManual
        ? "Local user-provided pasted text preview; bounded extraction only and no raw private history persistence."
        : "Synthetic public-safe sample fixture only; not raw private history.",
    },
    {
      source_ref: "docs/PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_V0_1.md",
      source_kind: "document_pointer" as const,
      source_label: "Perspective ingest constellation preview boundary",
      source_scope: "project:augnes" as const,
      provenance_note:
        "Documents the local-only graph-first ingest preview slice.",
    },
    {
      source_ref: "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
      source_kind: "document_pointer" as const,
      source_label: "Perspective Capsule contract",
      source_scope: "project:augnes" as const,
      provenance_note: "Documents packet vocabulary and handoff semantics.",
    },
    {
      source_ref: "docs/PROJECT_CONSTELLATION_IA_V0_1.md",
      source_kind: "document_pointer" as const,
      source_label: "Project Constellation IA",
      source_scope: "project:augnes" as const,
      provenance_note: "Documents node-edge constellation vocabulary.",
    },
  ];
}

function buildEvidencePointers(
  episode: PerspectiveIngestSessionEpisode,
  sourceKey: string,
): PerspectiveIngestEvidencePointer[] {
  const isManual = episode.source_kind === "manual_pasted_text";

  return uniqueStrings([episode.source_ref, ...episode.evidence_refs]).map(
    (targetRef, index) => ({
      pointer_id: `pointer.${sourceKey}.${index + 1}`,
      label:
        index === 0
          ? isManual
            ? "Local pasted source"
            : "Fixture source"
          : `Source pointer ${index}`,
      target_ref: targetRef,
      pointer_kind:
        isManual && targetRef === episode.source_ref
          ? "local_preview_pointer"
          : targetRef.startsWith("docs/")
            ? "document_pointer"
            : targetRef.includes("smoke")
              ? "validation_pointer"
              : "fixture_pointer",
      pointer_semantics: "pointer_only",
      bounded_summary:
        index === 0
          ? isManual
            ? "Local pasted text preview source; raw input is not persisted."
            : "Synthetic public-safe fixture source for this preview."
          : "Pointer-only context used to explain the preview graph.",
      source_episode_ids: [episode.episode_id],
      proof_evidence_write_authority: false,
      readiness_write_authority: false,
    }),
  );
}

function buildUnresolvedTensions(
  episode: PerspectiveIngestSessionEpisode,
  sourceKey: string,
  evidencePointers: PerspectiveIngestEvidencePointer[],
): PerspectiveIngestUnresolvedTension[] {
  return episode.unresolved_tensions.map((summary, index) => ({
    tension_id: `tension.${sourceKey}.${index + 1}`,
    label: `Unresolved tension ${index + 1}`,
    summary,
    source_refs: [episode.source_ref],
    evidence_pointer_ids: evidencePointers.slice(0, 2).map((pointer) => pointer.pointer_id),
    blocks_or_qualifies_next_actions: true,
  }));
}

function buildNextActionCandidates(
  episode: PerspectiveIngestSessionEpisode,
  sourceKey: string,
  unresolvedTensions: PerspectiveIngestUnresolvedTension[],
): PerspectiveIngestNextActionCandidate[] {
  const blockedBy = unresolvedTensions.slice(0, 1).map((tension) => tension.tension_id);

  return episode.next_actions.map((summary, index) => ({
    candidate_id: `next.${sourceKey}.${index + 1}`,
    label: `Next action ${index + 1}`,
    summary,
    source_refs: [episode.source_ref],
    blocked_by: index === 0 ? [] : blockedBy,
    advisory_only: true,
    execution_authority: false,
  }));
}

function buildChatGptConstellation({
  episode,
  evidence_pointers,
  next_action_candidates,
  sourceKey,
  unresolved_tensions,
}: {
  episode: PerspectiveIngestSessionEpisode;
  evidence_pointers: PerspectiveIngestEvidencePointer[];
  next_action_candidates: PerspectiveIngestNextActionCandidate[];
  sourceKey: string;
  unresolved_tensions: PerspectiveIngestUnresolvedTension[];
}) {
  const pointerIds = evidence_pointers.map((pointer) => pointer.pointer_id);
  const tensionIds = unresolved_tensions.map((tension) => tension.tension_id);
  const nextIds = next_action_candidates.map((candidate) => candidate.candidate_id);
  const nodes: PerspectiveIngestConstellationNode[] = [
    node({
      id: `node.${sourceKey}.source`,
      type: "source",
      label: "Synthetic ChatGPT source",
      summary: episode.summary,
      episode,
      pointerIds,
    }),
    node({
      id: `node.${sourceKey}.user_intent`,
      type: "user_intent",
      label: "User intent",
      summary: summarizeList(episode.user_intents),
      episode,
      pointerIds: pointerIds.slice(0, 2),
    }),
    node({
      id: `node.${sourceKey}.product_concept`,
      type: "product_concept",
      label: "Product concept",
      summary: summarizeList(episode.product_concepts),
      episode,
      pointerIds: pointerIds.slice(0, 3),
    }),
    node({
      id: `node.${sourceKey}.decision`,
      type: "decision",
      label: "Fixture-first decision",
      summary: summarizeList(episode.decisions),
      episode,
      pointerIds: pointerIds.slice(0, 3),
    }),
    node({
      id: `node.${sourceKey}.unresolved_tension`,
      type: "unresolved_tension",
      label: "Visible tension",
      summary: summarizeList(episode.unresolved_tensions),
      episode,
      pointerIds: pointerIds.slice(0, 2),
      tensionIds,
    }),
    node({
      id: `node.${sourceKey}.next_move`,
      type: "next_move",
      label: "Next move",
      summary: summarizeList(episode.next_actions),
      episode,
      pointerIds: pointerIds.slice(0, 2),
      nextIds,
    }),
    node({
      id: `node.${sourceKey}.packet`,
      type: "packet",
      label: "Copyable packets",
      summary:
        "ChatGPT review and Codex handoff packets are derived from the fixture graph for manual copy only.",
      episode,
      pointerIds,
      nextIds,
    }),
  ];
  const edges = buildEdges(sourceKey, episode.episode_id, pointerIds, [
    ["derived_from", "source", "user_intent", "The user intent is derived from the synthetic ChatGPT source."],
    ["refines", "user_intent", "product_concept", "The user intent refines the ingest preview concept."],
    ["supports", "product_concept", "decision", "The concept supports the fixture-first decision."],
    ["conflicts_with", "decision", "unresolved_tension", "The decision leaves real import and persistence tensions visible."],
    ["warns_against", "unresolved_tension", "next_move", "The tension qualifies the next local-only move."],
    ["next_candidate", "decision", "next_move", "The decision points to an advisory next move."],
    ["depends_on", "next_move", "packet", "The packets depend on the selected next move."],
    ["evidence_for", "source", "packet", "The synthetic source is evidence for the copyable packets."],
  ]);

  return {
    constellation_id: `constellation.${sourceKey}.v0_1`,
    thesis:
      "A synthetic ChatGPT record can become a bounded Project Constellation preview with visible decisions, tensions, and copyable handoff packets.",
    nodes,
    edges,
    clusters: buildClusters(sourceKey, nodes, edges, pointerIds, tensionIds, nextIds),
  };
}

function buildCodexConstellation({
  episode,
  evidence_pointers,
  next_action_candidates,
  sourceKey,
  unresolved_tensions,
}: {
  episode: PerspectiveIngestSessionEpisode;
  evidence_pointers: PerspectiveIngestEvidencePointer[];
  next_action_candidates: PerspectiveIngestNextActionCandidate[];
  sourceKey: string;
  unresolved_tensions: PerspectiveIngestUnresolvedTension[];
}) {
  const pointerIds = evidence_pointers.map((pointer) => pointer.pointer_id);
  const tensionIds = unresolved_tensions.map((tension) => tension.tension_id);
  const nextIds = next_action_candidates.map((candidate) => candidate.candidate_id);
  const nodes: PerspectiveIngestConstellationNode[] = [
    node({
      id: `node.${sourceKey}.source`,
      type: "source",
      label: "Synthetic Codex source",
      summary: episode.summary,
      episode,
      pointerIds,
    }),
    node({
      id: `node.${sourceKey}.work_unit`,
      type: "work_unit",
      label: "Work unit",
      summary: summarizeList(episode.work_units),
      episode,
      pointerIds: pointerIds.slice(0, 2),
    }),
    node({
      id: `node.${sourceKey}.changed_files`,
      type: "changed_files",
      label: "Changed files",
      summary: summarizeList(episode.changed_files),
      episode,
      pointerIds: pointerIds.slice(0, 2),
    }),
    node({
      id: `node.${sourceKey}.validation`,
      type: "validation",
      label: "Validation",
      summary: summarizeList(episode.validations),
      episode,
      pointerIds,
    }),
    node({
      id: `node.${sourceKey}.blocker_risk`,
      type: "blocker_risk",
      label: "Blocker and risk",
      summary: summarizeList(episode.unresolved_tensions),
      episode,
      pointerIds: pointerIds.slice(0, 2),
      tensionIds,
    }),
    node({
      id: `node.${sourceKey}.final_report`,
      type: "final_report",
      label: "Final report",
      summary: summarizeList(episode.final_report_points),
      episode,
      pointerIds: pointerIds.slice(0, 2),
    }),
    node({
      id: `node.${sourceKey}.next_move`,
      type: "next_move",
      label: "Next move",
      summary: summarizeList(episode.next_actions),
      episode,
      pointerIds: pointerIds.slice(0, 2),
      nextIds,
    }),
  ];
  const edges = buildEdges(sourceKey, episode.episode_id, pointerIds, [
    ["derived_from", "source", "work_unit", "The work unit is derived from the synthetic Codex source."],
    ["supports", "work_unit", "changed_files", "The work unit names the changed file boundary."],
    ["validates", "changed_files", "validation", "The changed files are paired with targeted validation."],
    ["supports", "validation", "final_report", "Validation results support the final report packet."],
    ["warns_against", "blocker_risk", "next_move", "The risk node qualifies the advisory next move."],
    ["next_candidate", "final_report", "next_move", "The final report points toward the next slice."],
    ["evidence_for", "source", "final_report", "The synthetic source is evidence for the final report summary."],
    ["depends_on", "work_unit", "next_move", "The next move depends on the bounded work unit."],
  ]);

  return {
    constellation_id: `constellation.${sourceKey}.v0_1`,
    thesis:
      "A synthetic Codex record can become a bounded work-unit constellation with changed files, validation, risks, report needs, and next moves.",
    nodes,
    edges,
    clusters: buildClusters(sourceKey, nodes, edges, pointerIds, tensionIds, nextIds),
  };
}

function buildManualPastedTextConstellation({
  episode,
  evidence_pointers,
  next_action_candidates,
  sourceKey,
  unresolved_tensions,
}: {
  episode: PerspectiveIngestSessionEpisode;
  evidence_pointers: PerspectiveIngestEvidencePointer[];
  next_action_candidates: PerspectiveIngestNextActionCandidate[];
  sourceKey: string;
  unresolved_tensions: PerspectiveIngestUnresolvedTension[];
}) {
  const pointerIds = evidence_pointers.map((pointer) => pointer.pointer_id);
  const tensionIds = unresolved_tensions.map((tension) => tension.tension_id);
  const nextIds = next_action_candidates.map((candidate) => candidate.candidate_id);
  const nodes: PerspectiveIngestConstellationNode[] = [
    node({
      id: `node.${sourceKey}.source`,
      type: "source",
      label: "Manual pasted text source",
      summary: episode.summary,
      episode,
      pointerIds,
    }),
    node({
      id: `node.${sourceKey}.user_intent`,
      type: "user_intent",
      label: "User intent",
      summary: summarizeList(episode.user_intents),
      episode,
      pointerIds: pointerIds.slice(0, 2),
    }),
    node({
      id: `node.${sourceKey}.concept`,
      type: "product_concept",
      label: "Concept",
      summary: summarizeList(episode.product_concepts),
      episode,
      pointerIds: pointerIds.slice(0, 3),
    }),
    node({
      id: `node.${sourceKey}.decision`,
      type: "decision",
      label: "Decision",
      summary: summarizeList(episode.decisions),
      episode,
      pointerIds: pointerIds.slice(0, 3),
    }),
    node({
      id: `node.${sourceKey}.tension`,
      type: "unresolved_tension",
      label: "Tension",
      summary: summarizeList(episode.unresolved_tensions),
      episode,
      pointerIds: pointerIds.slice(0, 2),
      tensionIds,
    }),
    node({
      id: `node.${sourceKey}.next_move`,
      type: "next_move",
      label: "Next move",
      summary: summarizeList(episode.next_actions),
      episode,
      pointerIds: pointerIds.slice(0, 2),
      nextIds,
    }),
    node({
      id: `node.${sourceKey}.packet`,
      type: "packet",
      label: "Copyable packets",
      summary:
        "ChatGPT review and Codex handoff packets are derived from bounded pasted-text extraction for manual copy only.",
      episode,
      pointerIds,
      nextIds,
    }),
  ];
  const edges = buildEdges(sourceKey, episode.episode_id, pointerIds, [
    ["derived_from", "source", "user_intent", "The user intent is derived from bounded local pasted text extraction."],
    ["refines", "user_intent", "concept", "The user intent refines the manual local Perspective ingest preview concept."],
    ["supports", "concept", "decision", "The concept supports the local-only non-persistent decision."],
    ["conflicts_with", "decision", "tension", "The decision keeps raw-history and import-scope tensions visible."],
    ["warns_against", "tension", "next_move", "The tension qualifies the advisory next move."],
    ["next_candidate", "decision", "next_move", "The decision points to a manual review next move."],
    ["evidence_for", "source", "packet", "The bounded local source pointer is evidence for the copyable packets."],
    ["depends_on", "next_move", "packet", "The packets depend on manual review before any future import slice."],
  ]);

  return {
    constellation_id: `constellation.${sourceKey}.v0_1`,
    thesis:
      "A local pasted text summary can become a bounded Perspective ingest constellation with visible intent, concept, decision, tension, next move, and manual handoff packets.",
    nodes,
    edges,
    clusters: buildClusters(sourceKey, nodes, edges, pointerIds, tensionIds, nextIds),
  };
}

function node({
  episode,
  id,
  label,
  nextIds = [],
  pointerIds,
  summary,
  tensionIds = [],
  type,
}: {
  episode: PerspectiveIngestSessionEpisode;
  id: string;
  type: string;
  label: string;
  summary: string;
  pointerIds: string[];
  tensionIds?: string[];
  nextIds?: string[];
}): PerspectiveIngestConstellationNode {
  return {
    id,
    type,
    label,
    summary,
    source_episode_ids: [episode.episode_id],
    source_refs: [episode.source_ref],
    evidence_pointer_ids: pointerIds,
    unresolved_tension_ids: tensionIds,
    next_action_candidate_ids: nextIds,
  };
}

function buildEdges(
  sourceKey: string,
  episodeId: string,
  pointerIds: string[],
  specs: [
    PerspectiveIngestConstellationEdge["type"],
    string,
    string,
    string,
  ][],
): PerspectiveIngestConstellationEdge[] {
  return specs.map(([type, source, target, summary], index) => ({
    id: `edge.${sourceKey}.${source}.to.${target}`,
    type,
    source: `node.${sourceKey}.${source}`,
    target: `node.${sourceKey}.${target}`,
    summary,
    source_episode_ids: [episodeId],
    evidence_pointer_ids: [pointerIds[index % Math.max(pointerIds.length, 1)]].filter(Boolean),
  }));
}

function buildClusters(
  sourceKey: string,
  nodes: PerspectiveIngestConstellationNode[],
  edges: PerspectiveIngestConstellationEdge[],
  pointerIds: string[],
  tensionIds: string[],
  nextIds: string[],
): PerspectiveIngestConstellationCluster[] {
  const isManual = sourceKey === "manual_pasted_text";

  return [
    {
      id: `cluster.${sourceKey}.ingest_preview`,
      label: isManual ? "Manual pasted text preview" : "Fixture ingest preview",
      node_ids: nodes.map((item) => item.id),
      edge_ids: edges.map((item) => item.id),
      cluster_thesis: isManual
        ? "Bounded pasted text extraction becomes a local-only node-edge constellation with copyable review and handoff packets."
        : "Synthetic records become SessionEpisode-like input, then a bounded node-edge constellation with copyable review and handoff packets.",
      evidence_pointer_ids: pointerIds,
      unresolved_tension_ids: tensionIds,
      next_action_candidate_ids: nextIds,
    },
  ];
}

function buildPerspectiveCapsulePreview({
  constellation,
  episode,
  next_action_candidates,
  source,
  thesis,
  unresolved_tensions,
}: {
  constellation: PerspectiveIngestConstellationPreviewResponse["constellation"];
  episode: PerspectiveIngestSessionEpisode;
  next_action_candidates: PerspectiveIngestNextActionCandidate[];
  source: PerspectiveIngestSourceQuery;
  thesis: string;
  unresolved_tensions: PerspectiveIngestUnresolvedTension[];
}): PerspectiveIngestPerspectiveCapsulePreview {
  const isManual = source === "manual:pasted_text";

  return {
    capsule_id: `capsule.${getSourceKey(source)}.ingest_preview.v0_1`,
    capsule_version: "perspective_capsule_preview.v0.1",
    source_surface: "perspective_ingest_constellation_preview",
    source_scope: "project:augnes",
    source_snapshot_ref: episode.source_ref,
    source_constellation_ref: constellation.constellation_id,
    formation_mode: isManual
      ? "manual_pasted_text_constellation"
      : "fixture_episode_constellation",
    thesis,
    selected_nodes: constellation.nodes.map((nodeItem) => nodeItem.id),
    selected_edges: constellation.edges.map((edgeItem) => edgeItem.id),
    evidence_pointers: constellation.clusters[0]?.evidence_pointer_ids ?? [],
    unresolved_tensions: unresolved_tensions.map((tension) => tension.tension_id),
    boundaries: episode.public_safety.boundary_notes,
    forbidden_actions: FORBIDDEN_ACTIONS,
    next_action_candidates: next_action_candidates.map(
      (candidate) => candidate.candidate_id,
    ),
    target_surface: source === "sample:codex" ? "codex_handoff" : "chatgpt_review",
    chatgpt_rendering_notes: [
      "Render nodes, edges, tensions, evidence pointers, and next actions as review material.",
      "Keep unresolved tensions visible and separate from support.",
      "Treat packet text as manual review copy only.",
    ],
    codex_handoff_packet_summary:
      "Repo, branch suggestion, PR title, changed-file expectations, checks, authority boundaries, and final-report requirements.",
  };
}

function buildChatGptRenderingPacket({
  constellation,
  episode,
  next_action_candidates,
  source,
  thesis,
  unresolved_tensions,
}: {
  constellation: PerspectiveIngestConstellationPreviewResponse["constellation"];
  episode: PerspectiveIngestSessionEpisode;
  next_action_candidates: PerspectiveIngestNextActionCandidate[];
  source: PerspectiveIngestSourceQuery;
  thesis: string;
  unresolved_tensions: PerspectiveIngestUnresolvedTension[];
}): PerspectiveIngestChatGptRenderingPacket {
  const isManual = source === "manual:pasted_text";
  const packetText = [
    "ChatGPT review packet",
    "",
    `Source: ${source}`,
    `Episode: ${episode.episode_id}`,
    `Thesis: ${thesis}`,
    "",
    "Graph nodes:",
    formatPacketList(
      constellation.nodes,
      (item) => `- ${item.label} (${item.type}): ${item.summary}`,
    ),
    "",
    "Graph edges:",
    formatPacketList(
      constellation.edges,
      (item) => `- ${item.type}: ${item.source} -> ${item.target}; ${item.summary}`,
    ),
    "",
    "Unresolved tensions:",
    formatPacketList(
      unresolved_tensions,
      (item) => `- ${item.label}: ${item.summary}`,
    ),
    "",
    "Next action candidates:",
    formatPacketList(
      next_action_candidates,
      (item) => `- ${item.label}: ${item.summary}`,
    ),
    "",
    "Boundary reminders:",
    formatPacketList(FORBIDDEN_ACTIONS, (item) => `- ${item}`),
  ].join("\n");

  return {
    packet_id: `packet.${getSourceKey(source)}.chatgpt_review.v0_1`,
    target_surface: "chatgpt_review",
    title: "ChatGPT review packet",
    summary: isManual
      ? "Manual review text for checking the bounded pasted-text graph, tensions, and next actions."
      : "Manual review text for checking the fixture-backed graph, tensions, and next actions.",
    packet_text: packetText,
    source_refs: [episode.source_ref, ...episode.evidence_refs],
    recommended_review_questions: [
      "Does the graph preserve user intent without implying raw history import?",
      "Are unresolved tensions visible enough to guide the next local-only slice?",
      "Does the packet keep manual review separate from execution authority?",
    ],
    boundary_reminders: FORBIDDEN_ACTIONS,
  };
}

function buildCodexHandoffPacket({
  constellation,
  episode,
  source,
  thesis,
}: {
  constellation: PerspectiveIngestConstellationPreviewResponse["constellation"];
  episode: PerspectiveIngestSessionEpisode;
  source: PerspectiveIngestSourceQuery;
  thesis: string;
}): PerspectiveIngestCodexHandoffPacket {
  const isManual = source === "manual:pasted_text";
  const workingBranchSuggestion = isManual
    ? "codex/pasted-text-perspective-ingest-preview-v0-1"
    : "codex/perspective-ingest-constellation-preview-v0-1";
  const expectedPrTitle = isManual
    ? "feat(cockpit): add pasted-text perspective ingest preview"
    : "feat(cockpit): add graph-first perspective ingest constellation preview";
  const contextAnchors = isManual
    ? [
        episode.source_ref,
        "docs/PERSPECTIVE_INGEST_LOCAL_PASTED_TEXT_PREVIEW_V0_1.md",
        "docs/PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_V0_1.md",
        "docs/PROJECT_CONSTELLATION_IA_V0_1.md",
        "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
        "components/augnes-cockpit.tsx",
      ]
    : [
        episode.source_ref,
        "docs/PROJECT_CONSTELLATION_IA_V0_1.md",
        "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
        "components/augnes-cockpit.tsx",
      ];
  const expectedChangedFiles = episode.changed_files.length
    ? episode.changed_files
    : isManual
      ? []
      : [
          "types/perspective-ingest-constellation-preview.ts",
          "fixtures/perspective-ingest/*.json",
          "lib/perspective-ingest/*.ts",
          "lib/readonly-api/perspective-ingest-constellation-preview.ts",
          "app/api/augnes/read/perspective-ingest-constellation-preview/route.ts",
          "components/augnes-cockpit.tsx",
          "app/globals.css",
          "scripts/smoke-perspective-ingest-constellation-preview.mjs",
          "docs/PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_V0_1.md",
          "package.json",
        ];
  const requiredChecks = isManual
    ? LOCAL_PREVIEW_REQUIRED_CHECKS
    : SAMPLE_REQUIRED_CHECKS;
  const prBodyRequirements = isManual
    ? LOCAL_PREVIEW_PR_BODY_REQUIREMENTS
    : SAMPLE_PR_BODY_REQUIREMENTS;
  const finalReportRequirements = isManual
    ? LOCAL_PREVIEW_FINAL_REPORT_REQUIREMENTS
    : SAMPLE_FINAL_REPORT_REQUIREMENTS;
  const packetText = [
    "Repo: hynk-studio/augnes",
    "Base branch: main",
    `Working branch suggestion: ${workingBranchSuggestion}`,
    `Expected PR title: ${expectedPrTitle}`,
    ...(isManual
      ? [
          "Packet note: this is a preview packet only; it is not an instruction to execute unless a user manually gives it to Codex.",
        ]
      : []),
    "",
    "Task goal:",
    thesis,
    "",
    "Context anchors:",
    formatPacketList(contextAnchors, (item) => `- ${item}`),
    "",
    "Expected changed files:",
    formatPacketList(expectedChangedFiles, (item) => `- ${item}`),
    "",
    "Hard constraints:",
    formatPacketList(FORBIDDEN_ACTIONS, (item) => `- ${item}`),
    "",
    "Required checks:",
    formatPacketList(requiredChecks, (item) => `- ${item}`),
    "",
    "PR body requirements:",
    formatPacketList(prBodyRequirements, (item) => `- ${item}`),
    "",
    "Final report requirements:",
    formatPacketList(finalReportRequirements, (item) => `- ${item}`),
    "",
    "Graph summary:",
    `${constellation.nodes.length} nodes and ${constellation.edges.length} edges from ${source}.`,
  ].join("\n");

  return {
    packet_id: `packet.${getSourceKey(source)}.codex_handoff.v0_1`,
    target_surface: "codex_handoff",
    repo: "hynk-studio/augnes",
    base_branch: "main",
    working_branch_suggestion: workingBranchSuggestion,
    expected_pr_title: expectedPrTitle,
    task_goal: thesis,
    context_anchors: contextAnchors,
    expected_changed_files: expectedChangedFiles,
    hard_constraints: FORBIDDEN_ACTIONS,
    required_checks: requiredChecks,
    pr_body_requirements: prBodyRequirements,
    final_report_requirements: finalReportRequirements,
    packet_text: packetText,
  };
}

function getSourceKey(source: PerspectiveIngestSourceQuery) {
  if (source === "sample:chatgpt") {
    return "sample_chatgpt";
  }

  if (source === "sample:codex") {
    return "sample_codex";
  }

  return "manual_pasted_text";
}

function summarizeList(items: string[]) {
  if (!items.length) {
    return "No items supplied in this fixture field.";
  }

  return items.join(" ");
}

function formatPacketList<T>(items: T[], formatItem: (item: T) => string) {
  if (!items.length) {
    return "- None supplied.";
  }

  return items.map(formatItem).join("\n");
}

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}
