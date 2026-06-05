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
  PerspectiveIngestUnresolvedTension,
} from "@/types/perspective-ingest-constellation-preview";

export type PerspectiveIngestSourceQuery = "sample:chatgpt" | "sample:codex";

const ROUTE_ID =
  "augnes.read.perspective-ingest-constellation-preview.v0.1" as const;
const BOUNDARY_CLASS =
  "read_only_local_ingest_constellation_preview" as const;
const REQUIRED_CHECKS = [
  "npm run typecheck",
  "npm run smoke:readonly-api-route-constellation-preview",
  "npm run smoke:cockpit-local-only-constellation-route-preview",
  "npm run smoke:perspective-capsule-contract",
  "npm run smoke:perspective-ingest-constellation-preview",
  "git diff --check",
];
const PR_BODY_REQUIREMENTS = [
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
const FINAL_REPORT_REQUIREMENTS = [
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
const FORBIDDEN_ACTIONS = [
  "no raw private history persistence",
  "no automatic account scraping",
  "no OAuth",
  "no external calls",
  "no provider calls",
  "no DB writes",
  "no graph DB",
  "no proof/evidence/readiness writes",
  "no Codex execution",
  "no approval/merge/publish/deploy authority",
];

export function buildPerspectiveIngestConstellationPreviewResponse({
  episodes,
  source,
}: {
  episodes: PerspectiveIngestSessionEpisode[];
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
  const constellation =
    episode.source_kind === "chatgpt_record_fixture"
      ? buildChatGptConstellation({
          episode,
          evidence_pointers,
          next_action_candidates,
          sourceKey,
          unresolved_tensions,
        })
      : buildCodexConstellation({
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
      route_id: ROUTE_ID,
      route_family: "perspective_ingest_constellation",
      workspace_scope: "project:augnes",
      project_scope: "project:augnes",
      request_scope_ref: "project:augnes",
      source_query: source,
      deterministic_fixture_generation: true,
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
      fixture_only: true,
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

function buildSourceRefs(episode: PerspectiveIngestSessionEpisode) {
  return [
    {
      source_ref: episode.source_ref,
      source_kind: episode.source_kind,
      source_label: episode.source_label,
      source_scope: "project:augnes" as const,
      provenance_note:
        "Synthetic public-safe sample fixture only; not raw private history.",
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
  return uniqueStrings([episode.source_ref, ...episode.evidence_refs]).map(
    (targetRef, index) => ({
      pointer_id: `pointer.${sourceKey}.${index + 1}`,
      label: index === 0 ? "Fixture source" : `Source pointer ${index}`,
      target_ref: targetRef,
      pointer_kind: targetRef.startsWith("docs/")
        ? "document_pointer"
        : targetRef.includes("smoke")
          ? "validation_pointer"
          : "fixture_pointer",
      pointer_semantics: "pointer_only",
      bounded_summary:
        index === 0
          ? "Synthetic public-safe fixture source for this preview."
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
  return [
    {
      id: `cluster.${sourceKey}.fixture_ingest_preview`,
      label: "Fixture ingest preview",
      node_ids: nodes.map((item) => item.id),
      edge_ids: edges.map((item) => item.id),
      cluster_thesis:
        "Synthetic records become SessionEpisode-like input, then a bounded node-edge constellation with copyable review and handoff packets.",
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
  return {
    capsule_id: `capsule.${getSourceKey(source)}.fixture_ingest_preview.v0_1`,
    capsule_version: "perspective_capsule_preview.v0.1",
    source_surface: "perspective_ingest_constellation_preview",
    source_scope: "project:augnes",
    source_snapshot_ref: episode.source_ref,
    source_constellation_ref: constellation.constellation_id,
    formation_mode: "fixture_episode_constellation",
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
    target_surface: source === "sample:chatgpt" ? "chatgpt_review" : "codex_handoff",
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
    summary:
      "Manual review text for checking the fixture-backed graph, tensions, and next actions.",
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
  const packetText = [
    "Repo: hynk-studio/augnes",
    "Base branch: main",
    "Working branch suggestion: codex/perspective-ingest-constellation-preview-v0-1",
    "Expected PR title: feat(cockpit): add graph-first perspective ingest constellation preview",
    "",
    "Task goal:",
    thesis,
    "",
    "Context anchors:",
    formatPacketList(
      [
        episode.source_ref,
        "docs/PROJECT_CONSTELLATION_IA_V0_1.md",
        "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
        "components/augnes-cockpit.tsx",
      ],
      (item) => `- ${item}`,
    ),
    "",
    "Expected changed files:",
    formatPacketList(
      episode.changed_files.length
        ? episode.changed_files
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
          ],
      (item) => `- ${item}`,
    ),
    "",
    "Hard constraints:",
    formatPacketList(FORBIDDEN_ACTIONS, (item) => `- ${item}`),
    "",
    "Required checks:",
    formatPacketList(REQUIRED_CHECKS, (item) => `- ${item}`),
    "",
    "PR body requirements:",
    formatPacketList(PR_BODY_REQUIREMENTS, (item) => `- ${item}`),
    "",
    "Final report requirements:",
    formatPacketList(FINAL_REPORT_REQUIREMENTS, (item) => `- ${item}`),
    "",
    "Graph summary:",
    `${constellation.nodes.length} nodes and ${constellation.edges.length} edges from ${source}.`,
  ].join("\n");

  return {
    packet_id: `packet.${getSourceKey(source)}.codex_handoff.v0_1`,
    target_surface: "codex_handoff",
    repo: "hynk-studio/augnes",
    base_branch: "main",
    working_branch_suggestion:
      "codex/perspective-ingest-constellation-preview-v0-1",
    expected_pr_title:
      "feat(cockpit): add graph-first perspective ingest constellation preview",
    task_goal: thesis,
    context_anchors: [
      episode.source_ref,
      "docs/PROJECT_CONSTELLATION_IA_V0_1.md",
      "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
      "components/augnes-cockpit.tsx",
    ],
    expected_changed_files: episode.changed_files,
    hard_constraints: FORBIDDEN_ACTIONS,
    required_checks: REQUIRED_CHECKS,
    pr_body_requirements: PR_BODY_REQUIREMENTS,
    final_report_requirements: FINAL_REPORT_REQUIREMENTS,
    packet_text: packetText,
  };
}

function getSourceKey(source: PerspectiveIngestSourceQuery) {
  return source === "sample:chatgpt" ? "sample_chatgpt" : "sample_codex";
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
