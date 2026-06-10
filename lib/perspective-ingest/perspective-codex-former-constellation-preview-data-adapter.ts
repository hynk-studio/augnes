import {
  copySafeCodexPerspectiveTextList,
  sanitizeCodexPerspectiveText,
} from "@/lib/perspective-ingest/perspective-codex-former-input-packet";
import type {
  CodexFormerConstellationEdgeRelationV0,
  CodexFormerConstellationProjectionKindV0,
  CodexFormerConstellationProjectionV0,
  CodexFormerConstellationProjectionVersionV0,
} from "@/lib/perspective-ingest/perspective-codex-former-constellation-projection";

export type CodexFormerConstellationPreviewDataVersionV0 =
  "codex_former_constellation_preview_data.v0.1";
export type CodexFormerConstellationPreviewDataKindV0 =
  "codex_former_constellation_preview_data";

export type CodexFormerConstellationPreviewSurfaceV0 =
  | "constellation_preview"
  | "codex_session_panel"
  | "capture_review_inbox"
  | string;

export type CodexFormerConstellationPreviewNodeToneV0 =
  | "neutral"
  | "review"
  | "warning"
  | "blocked"
  | "future_only";

export type CodexFormerConstellationPreviewEdgeLineStyleV0 =
  | "solid"
  | "dashed"
  | "dotted"
  | "blocked";

export type CodexFormerConstellationPreviewDetailTargetKindV0 =
  | "node"
  | "edge"
  | "summary"
  | "warning_panel"
  | "authority_lens";

export interface BuildCodexFormerConstellationPreviewDataInputV0 {
  projection: CodexFormerConstellationProjectionV0;
  generated_at?: string | null;
  preview_context?: {
    surface_label?: string | null;
    intended_surface?: CodexFormerConstellationPreviewSurfaceV0;
  };
}

export interface CodexFormerConstellationPreviewDataV0 {
  preview_version: CodexFormerConstellationPreviewDataVersionV0;
  preview_kind: CodexFormerConstellationPreviewDataKindV0;
  generated_at: string | null;
  preview_context: {
    surface_label: string;
    intended_surface: CodexFormerConstellationPreviewSurfaceV0;
  };
  source_projection: {
    projection_version: CodexFormerConstellationProjectionVersionV0;
    projection_kind: CodexFormerConstellationProjectionKindV0;
    generated_at: string | null;
    overall_status: CodexFormerConstellationProjectionV0["status_summary"]["overall_status"];
    conclusion: CodexFormerConstellationProjectionV0["status_summary"]["conclusion"];
  };
  display_policy: CodexFormerConstellationPreviewDisplayPolicyV0;
  graph: {
    nodes: PreviewDisplayNodeV0[];
    edges: PreviewDisplayEdgeV0[];
  };
  summary_panel: PreviewSummaryPanelV0;
  warning_panel: PreviewWarningPanelV0;
  authority_lens: PreviewAuthorityLensV0;
  detail_drawers: PreviewDetailDrawerV0[];
  legend: PreviewLegendV0;
  privacy: CodexFormerConstellationProjectionV0["privacy"];
  authority_flags: CodexFormerConstellationProjectionV0["authority_flags"];
}

export interface CodexFormerConstellationPreviewDisplayPolicyV0 {
  default_badge_limit: 2;
  default_view_shows_full_authority_flags: false;
  hover_view_enabled: true;
  detail_drawer_enabled: true;
  authority_lens_available: true;
  red_reserved_for_blocked: true;
  amber_reserved_for_warning_or_needs_review: true;
  review_only_is_normal_state: true;
}

export interface PreviewDisplayNodeV0 {
  id: string;
  source_node_id: string;
  kind: CodexFormerConstellationProjectionV0["nodes"][number]["node_kind"];
  label: string;
  status: CodexFormerConstellationProjectionV0["nodes"][number]["status"];
  authority: CodexFormerConstellationProjectionV0["nodes"][number]["authority"];
  badges: string[];
  tone: CodexFormerConstellationPreviewNodeToneV0;
  compact_summary: string;
  warning_count: number;
  detail_drawer_id: string;
  authority_lens_tags: string[];
}

export interface PreviewDisplayEdgeV0 {
  id: string;
  source_edge_id: string;
  from: string;
  to: string;
  relation: CodexFormerConstellationEdgeRelationV0;
  label: string;
  status: CodexFormerConstellationProjectionV0["edges"][number]["status"];
  authority_boundary: CodexFormerConstellationProjectionV0["edges"][number]["authority_boundary"];
  line_style: CodexFormerConstellationPreviewEdgeLineStyleV0;
  tone: CodexFormerConstellationPreviewNodeToneV0;
  warning_count: number;
  detail_drawer_id: string;
  authority_lens_tags: string[];
}

export interface PreviewSummaryPanelV0 {
  title: string;
  conclusion: CodexFormerConstellationProjectionV0["status_summary"]["conclusion"];
  overall_status: CodexFormerConstellationProjectionV0["status_summary"]["overall_status"];
  candidate_count: number;
  metadata_match: boolean;
  primary_status_label: string;
  primary_caveat_label: string;
  next_safe_action_label: string;
  is_review_only: true;
  is_accepted_state: false;
}

export interface PreviewWarningPanelV0 {
  warning_count: number;
  pointer_warning_count: number;
  grouped_warnings: PreviewWarningGroupV0[];
  blocked_reasons: PreviewWarningGroupV0[];
  has_blocking_warnings: boolean;
  has_pointer_warnings: boolean;
  default_collapsed: boolean;
}

export interface PreviewWarningGroupV0 {
  id: string;
  label: string;
  count: number;
  tone: "warning" | "blocked";
  source_node_ids: string[];
  examples: string[];
}

export interface PreviewAuthorityLensV0 {
  available: true;
  default_enabled: false;
  tags: string[];
  summary: string;
  flags: {
    review_only: true;
    non_committed_candidate: boolean;
    accepted_state_created: false;
    proof_evidence_readiness_created: false;
    provider_model_calls: false;
    codex_sdk_calls: false;
    github_mutation: false;
    db_writes: false;
    ui_implemented: false;
    core_decision: false;
    committed_state: false;
    persistence: false;
    provider_model_api_calls: false;
    proof_evidence_readiness_writes: false;
    codex_execution: false;
    merge_publish_approval: false;
  };
}

export interface PreviewDetailDrawerV0 {
  id: string;
  target_id: string;
  target_kind: CodexFormerConstellationPreviewDetailTargetKindV0;
  title: string;
  sections: PreviewDetailDrawerSectionV0[];
}

export interface PreviewDetailDrawerSectionV0 {
  heading: string;
  rows: PreviewDetailDrawerRowV0[];
}

export interface PreviewDetailDrawerRowV0 {
  label: string;
  value: string;
}

export interface PreviewLegendV0 {
  node_tones: Record<CodexFormerConstellationPreviewNodeToneV0, string>;
  edge_line_styles: Record<
    CodexFormerConstellationPreviewEdgeLineStyleV0,
    string
  >;
  badges: Record<string, string>;
  authority_lens_tags: Record<string, string>;
}

export function buildCodexFormerConstellationPreviewData(
  input: BuildCodexFormerConstellationPreviewDataInputV0,
): CodexFormerConstellationPreviewDataV0 {
  const omittedUnsafeFields = new Set<string>(
    input.projection.privacy.omitted_unsafe_fields,
  );
  const projection = copyProjection(input.projection);
  const generatedAt =
    sanitizePreviewText(
      input.generated_at,
      "preview.generated_at",
      omittedUnsafeFields,
    ) ?? projection.generated_at;
  const surfaceLabel =
    sanitizePreviewText(
      input.preview_context?.surface_label,
      "preview.surface_label",
      omittedUnsafeFields,
    ) ?? "Codex Former constellation preview data";
  const intendedSurface =
    sanitizePreviewText(
      input.preview_context?.intended_surface,
      "preview.intended_surface",
      omittedUnsafeFields,
    ) ?? "constellation_preview";

  const warningPanel = buildWarningPanel(projection, omittedUnsafeFields);
  const graphNodes = projection.nodes.map((node) =>
    buildDisplayNode(node, projection, omittedUnsafeFields),
  );
  const graphEdges = projection.edges.map((edge) =>
    buildDisplayEdge(edge, omittedUnsafeFields),
  );
  const summaryPanel = buildSummaryPanel(
    projection,
    warningPanel,
    surfaceLabel,
    omittedUnsafeFields,
  );
  const authorityLens = buildAuthorityLens(projection, omittedUnsafeFields);
  const detailDrawers = buildDetailDrawers({
    authorityLens,
    graphEdges,
    graphNodes,
    projection,
    summaryPanel,
    warningPanel,
    omittedUnsafeFields,
  });

  return {
    preview_version: "codex_former_constellation_preview_data.v0.1",
    preview_kind: "codex_former_constellation_preview_data",
    generated_at: generatedAt,
    preview_context: {
      surface_label: bounded(surfaceLabel),
      intended_surface: intendedSurface,
    },
    source_projection: {
      projection_version: projection.projection_version,
      projection_kind: projection.projection_kind,
      generated_at: projection.generated_at,
      overall_status: projection.status_summary.overall_status,
      conclusion: projection.status_summary.conclusion,
    },
    display_policy: buildDisplayPolicy(),
    graph: {
      nodes: graphNodes,
      edges: graphEdges,
    },
    summary_panel: summaryPanel,
    warning_panel: warningPanel,
    authority_lens: authorityLens,
    detail_drawers: detailDrawers,
    legend: buildLegend(),
    privacy: {
      ...projection.privacy,
      unsafe_input_material_omitted:
        projection.privacy.unsafe_input_material_omitted ||
        omittedUnsafeFields.size > projection.privacy.omitted_unsafe_fields.length,
      omitted_unsafe_fields: [...omittedUnsafeFields].sort(),
    },
    authority_flags: { ...projection.authority_flags },
  };
}

function buildDisplayPolicy(): CodexFormerConstellationPreviewDisplayPolicyV0 {
  return {
    default_badge_limit: 2,
    default_view_shows_full_authority_flags: false,
    hover_view_enabled: true,
    detail_drawer_enabled: true,
    authority_lens_available: true,
    red_reserved_for_blocked: true,
    amber_reserved_for_warning_or_needs_review: true,
    review_only_is_normal_state: true,
  };
}

function buildDisplayNode(
  node: CodexFormerConstellationProjectionV0["nodes"][number],
  projection: CodexFormerConstellationProjectionV0,
  omittedUnsafeFields: Set<string>,
): PreviewDisplayNodeV0 {
  const id = sanitizePreviewText(
    node.id,
    `${node.id}.display.id`,
    omittedUnsafeFields,
  ) ?? "node:unknown";
  const label =
    sanitizePreviewText(
      node.title,
      `${node.id}.display.label`,
      omittedUnsafeFields,
    ) ?? node.node_kind;
  const badges = copySafeCodexPerspectiveTextList(
    node.primary_badges,
    `${node.id}.display.badges`,
    omittedUnsafeFields,
  ).slice(0, 2);
  const tone = deriveNodeTone(node);

  return {
    id,
    source_node_id: id,
    kind: node.node_kind,
    label: bounded(label, 64),
    status: node.status,
    authority: node.authority,
    badges,
    tone,
    compact_summary: buildNodeCompactSummary(node, projection),
    warning_count: normalizeCount(node.warning_count),
    detail_drawer_id: `drawer:${id}`,
    authority_lens_tags: buildAuthorityTags([
      node.authority,
      node.status,
      ...node.primary_badges,
      projection.status_summary.metadata_match ? null : "provenance_mismatch",
    ]),
  };
}

function buildDisplayEdge(
  edge: CodexFormerConstellationProjectionV0["edges"][number],
  omittedUnsafeFields: Set<string>,
): PreviewDisplayEdgeV0 {
  const id =
    sanitizePreviewText(edge.id, `${edge.id}.display.id`, omittedUnsafeFields) ??
    "edge:unknown";
  const lineStyle = deriveLineStyle(edge);

  return {
    id,
    source_edge_id: id,
    from: edge.from,
    to: edge.to,
    relation: edge.relation,
    label: relationLabel(edge.relation),
    status: edge.status,
    authority_boundary: edge.authority_boundary,
    line_style: lineStyle,
    tone: deriveEdgeTone(edge, lineStyle),
    warning_count: normalizeCount(edge.warning_count),
    detail_drawer_id: `drawer:${id}`,
    authority_lens_tags: buildAuthorityTags([
      edge.authority_boundary,
      edge.status,
      edge.relation,
    ]),
  };
}

function buildSummaryPanel(
  projection: CodexFormerConstellationProjectionV0,
  warningPanel: PreviewWarningPanelV0,
  surfaceLabel: string,
  omittedUnsafeFields: Set<string>,
): PreviewSummaryPanelV0 {
  const isBlocked = projection.status_summary.overall_status === "blocked";
  const isFollowUp =
    projection.status_summary.overall_status === "pass_with_follow_up";
  const primaryStatusLabel = isBlocked
    ? "BLOCKED"
    : isFollowUp
      ? "PASS with follow-up"
      : "PASS";

  return {
    title: bounded(surfaceLabel, 80),
    conclusion: projection.status_summary.conclusion,
    overall_status: projection.status_summary.overall_status,
    candidate_count: projection.status_summary.candidate_count,
    metadata_match: projection.status_summary.metadata_match,
    primary_status_label: primaryStatusLabel,
    primary_caveat_label: buildPrimaryCaveatLabel(
      projection,
      warningPanel,
      omittedUnsafeFields,
    ),
    next_safe_action_label: isBlocked
      ? "No usable review candidate; correct provenance or candidate count first."
      : "Advisory only: review the non-committed candidate before any decision.",
    is_review_only: true,
    is_accepted_state: false,
  };
}

function buildWarningPanel(
  projection: CodexFormerConstellationProjectionV0,
  omittedUnsafeFields: Set<string>,
): PreviewWarningPanelV0 {
  const warningNodes = projection.nodes.filter(
    (node) => node.node_kind === "warning",
  );
  const pointerWarningNodes = warningNodes.filter(
    (node) =>
      node.status !== "blocked" &&
      (node.primary_badges.includes("pointer_warning") ||
        projection.warning_summary.pointer_warning_count > 0),
  );
  const reviewWarningNodes = warningNodes.filter(
    (node) => node.status !== "blocked" && !pointerWarningNodes.includes(node),
  );
  const blockingWarningNodes = warningNodes.filter(
    (node) => node.status === "blocked" || node.authority === "blocked",
  );

  const groupedWarnings: PreviewWarningGroupV0[] = [];
  if (
    projection.warning_summary.pointer_warning_count > 0 ||
    pointerWarningNodes.length > 0
  ) {
    groupedWarnings.push({
      id: "warning_group:pointer_warning_pressure",
      label: "Pointer warning pressure",
      count: Math.max(
        projection.warning_summary.pointer_warning_count,
        pointerWarningNodes.length,
      ),
      tone: "warning",
      source_node_ids: pointerWarningNodes.map((node) => node.id),
      examples: collectWarningExamples(
        pointerWarningNodes,
        projection.warning_summary.warnings,
        omittedUnsafeFields,
      ),
    });
  }

  if (reviewWarningNodes.length > 0) {
    groupedWarnings.push({
      id: "warning_group:review_warning",
      label: "Review warning",
      count: reviewWarningNodes.length,
      tone: "warning",
      source_node_ids: reviewWarningNodes.map((node) => node.id),
      examples: collectWarningExamples(
        reviewWarningNodes,
        projection.warning_summary.warnings,
        omittedUnsafeFields,
      ),
    });
  }

  const blockedReasons =
    projection.warning_summary.blocked_reasons.length > 0
      ? [
          {
            id: "warning_group:blocking_reasons",
            label: "Blocking validation reasons",
            count: projection.warning_summary.blocked_reasons.length,
            tone: "blocked" as const,
            source_node_ids: blockingWarningNodes.map((node) => node.id),
            examples: copySafeCodexPerspectiveTextList(
              projection.warning_summary.blocked_reasons,
              "warning_panel.blocked_reasons",
              omittedUnsafeFields,
            )
              .map((value) => bounded(value))
              .slice(0, 4),
          },
        ]
      : [];

  return {
    warning_count: projection.warning_summary.warning_count,
    pointer_warning_count: projection.warning_summary.pointer_warning_count,
    grouped_warnings: groupedWarnings,
    blocked_reasons: blockedReasons,
    has_blocking_warnings:
      projection.status_summary.overall_status === "blocked" ||
      blockingWarningNodes.length > 0 ||
      blockedReasons.length > 0,
    has_pointer_warnings:
      projection.warning_summary.pointer_warning_count > 0 ||
      pointerWarningNodes.length > 0,
    default_collapsed: projection.status_summary.overall_status !== "blocked",
  };
}

function buildAuthorityLens(
  projection: CodexFormerConstellationProjectionV0,
  omittedUnsafeFields: Set<string>,
): PreviewAuthorityLensV0 {
  const tags = buildAuthorityTags([
    ...projection.nodes.flatMap((node) => [
      node.authority,
      node.status,
      ...node.primary_badges,
    ]),
    ...projection.edges.flatMap((edge) => [
      edge.authority_boundary,
      edge.status,
      edge.relation,
    ]),
    projection.status_summary.metadata_match ? null : "provenance_mismatch",
    "no_accepted_state",
    "no_db_write",
    "no_provider_call",
    "no_codex_sdk_call",
    "no_github_mutation",
    "no_core_decision",
  ]);

  return {
    available: true,
    default_enabled: false,
    tags,
    summary:
      sanitizePreviewText(
        "Authority Lens is inspectability only; it does not grant decision authority.",
        "authority_lens.summary",
        omittedUnsafeFields,
      ) ?? "Authority Lens is inspectability only.",
    flags: {
      review_only: projection.authority_summary.review_only,
      non_committed_candidate:
        projection.authority_summary.non_committed_candidate,
      accepted_state_created:
        projection.authority_summary.accepted_state_created,
      proof_evidence_readiness_created:
        projection.authority_summary.proof_evidence_readiness_created,
      provider_model_calls: projection.authority_summary.provider_model_calls,
      codex_sdk_calls: projection.authority_summary.codex_sdk_calls,
      github_mutation: projection.authority_summary.github_mutation,
      db_writes: projection.authority_summary.db_writes,
      ui_implemented: projection.authority_summary.ui_implemented,
      core_decision: projection.authority_summary.core_decision,
      committed_state: projection.authority_flags.committed_state,
      persistence: projection.authority_flags.persistence,
      provider_model_api_calls:
        projection.authority_flags.provider_model_api_calls,
      proof_evidence_readiness_writes:
        projection.authority_flags.proof_evidence_readiness_writes,
      codex_execution: projection.authority_flags.codex_execution,
      merge_publish_approval:
        projection.authority_flags.merge_publish_approval,
    },
  };
}

function buildDetailDrawers(input: {
  authorityLens: PreviewAuthorityLensV0;
  graphEdges: PreviewDisplayEdgeV0[];
  graphNodes: PreviewDisplayNodeV0[];
  projection: CodexFormerConstellationProjectionV0;
  summaryPanel: PreviewSummaryPanelV0;
  warningPanel: PreviewWarningPanelV0;
  omittedUnsafeFields: Set<string>;
}): PreviewDetailDrawerV0[] {
  const drawers: PreviewDetailDrawerV0[] = [
    buildSummaryDrawer(input.projection, input.summaryPanel),
    buildWarningPanelDrawer(input.warningPanel),
    buildAuthorityLensDrawer(input.authorityLens),
  ];

  for (const node of input.projection.nodes) {
    const displayNode = input.graphNodes.find(
      (candidate) => candidate.source_node_id === node.id,
    );
    drawers.push(buildNodeDrawer(node, displayNode));
  }

  for (const edge of input.projection.edges) {
    const displayEdge = input.graphEdges.find(
      (candidate) => candidate.source_edge_id === edge.id,
    );
    drawers.push(buildEdgeDrawer(edge, displayEdge));
  }

  return drawers;
}

function buildSummaryDrawer(
  projection: CodexFormerConstellationProjectionV0,
  summaryPanel: PreviewSummaryPanelV0,
): PreviewDetailDrawerV0 {
  return {
    id: "drawer:summary",
    target_id: "summary_panel",
    target_kind: "summary",
    title: "Summary details",
    sections: [
      section("Status", [
        row("conclusion", summaryPanel.conclusion),
        row("overall_status", summaryPanel.overall_status),
        row("direct_validation_status", projection.status_summary.direct_validation_status),
        row("candidate_basis_quality", projection.status_summary.candidate_basis_quality),
      ]),
      section("Source", [
        row("capture_source_kind", projection.source.capture_source_kind),
        row("source_input_hash", projection.source.source_input_hash ?? "not supplied"),
        row("source_prompt_hash", projection.source.source_prompt_hash ?? "not supplied"),
        row("candidate_count", projection.status_summary.candidate_count),
        row("metadata_match", projection.status_summary.metadata_match),
      ]),
      section("Review Boundary", [
        row("is_review_only", summaryPanel.is_review_only),
        row("is_accepted_state", summaryPanel.is_accepted_state),
      ]),
    ],
  };
}

function buildWarningPanelDrawer(
  warningPanel: PreviewWarningPanelV0,
): PreviewDetailDrawerV0 {
  return {
    id: "drawer:warning_panel",
    target_id: "warning_panel",
    target_kind: "warning_panel",
    title: "Warning details",
    sections: [
      section("Warning Summary", [
        row("warning_count", warningPanel.warning_count),
        row("pointer_warning_count", warningPanel.pointer_warning_count),
        row("has_pointer_warnings", warningPanel.has_pointer_warnings),
        row("has_blocking_warnings", warningPanel.has_blocking_warnings),
      ]),
      section(
        "Grouped Warnings",
        warningPanel.grouped_warnings.flatMap((group) =>
          group.examples.map((example) =>
            row(`${group.label} (${group.count})`, example),
          ),
        ),
      ),
      section(
        "Blocked Reasons",
        warningPanel.blocked_reasons.flatMap((group) =>
          group.examples.map((example) =>
            row(`${group.label} (${group.count})`, example),
          ),
        ),
      ),
    ],
  };
}

function buildAuthorityLensDrawer(
  authorityLens: PreviewAuthorityLensV0,
): PreviewDetailDrawerV0 {
  return {
    id: "drawer:authority_lens",
    target_id: "authority_lens",
    target_kind: "authority_lens",
    title: "Authority Lens details",
    sections: [
      section("Lens", [
        row("available", authorityLens.available),
        row("default_enabled", authorityLens.default_enabled),
        row("summary", authorityLens.summary),
      ]),
      section(
        "Tags",
        authorityLens.tags.map((tag) => row("tag", tag)),
      ),
      section(
        "Flags",
        Object.entries(authorityLens.flags).map(([label, value]) =>
          row(label, value),
        ),
      ),
    ],
  };
}

function buildNodeDrawer(
  node: CodexFormerConstellationProjectionV0["nodes"][number],
  displayNode: PreviewDisplayNodeV0 | undefined,
): PreviewDetailDrawerV0 {
  return {
    id: `drawer:${node.id}`,
    target_id: node.id,
    target_kind: "node",
    title: `${displayNode?.label ?? node.title} details`,
    sections: [
      section("Display", [
        row("kind", node.node_kind),
        row("status", node.status),
        row("authority", node.authority),
        row("tone", displayNode?.tone ?? deriveNodeTone(node)),
        row("warning_count", node.warning_count),
      ]),
      section(
        "Provenance Refs",
        node.provenance_refs.map((value) => row("ref", value)),
      ),
      section(
        "Detail Refs",
        node.detail_refs.map((value) => row("detail", value)),
      ),
      section(
        "Authority Lens Tags",
        (displayNode?.authority_lens_tags ?? []).map((tag) => row("tag", tag)),
      ),
    ],
  };
}

function buildEdgeDrawer(
  edge: CodexFormerConstellationProjectionV0["edges"][number],
  displayEdge: PreviewDisplayEdgeV0 | undefined,
): PreviewDetailDrawerV0 {
  return {
    id: `drawer:${edge.id}`,
    target_id: edge.id,
    target_kind: "edge",
    title: `${displayEdge?.label ?? edge.relation} edge details`,
    sections: [
      section("Display", [
        row("from", edge.from),
        row("to", edge.to),
        row("relation", edge.relation),
        row("status", edge.status),
        row("authority_boundary", edge.authority_boundary),
        row("line_style", displayEdge?.line_style ?? deriveLineStyle(edge)),
        row("warning_count", edge.warning_count),
      ]),
      section(
        "Provenance Refs",
        edge.provenance_refs.map((value) => row("ref", value)),
      ),
      section(
        "Authority Lens Tags",
        (displayEdge?.authority_lens_tags ?? []).map((tag) => row("tag", tag)),
      ),
    ],
  };
}

function buildLegend(): PreviewLegendV0 {
  return {
    node_tones: {
      neutral: "Default node with no warning pressure.",
      review: "Review-only or non-committed node.",
      warning: "Needs review or pointer warning pressure.",
      blocked: "Blocked validation or unusable candidate material.",
      future_only: "Future schema state only; not emitted by current fixtures.",
    },
    edge_line_styles: {
      solid: "Prepared, returned, validated, or plain informs relation.",
      dashed: "Advisory or suggests relation.",
      dotted: "Pointer-only relation or boundary.",
      blocked: "Blocked edge or blocked_by relation.",
    },
    badges: {
      "review-only": "Review-only material, not accepted state.",
      "non-committed": "Candidate material is not committed.",
      needs_review: "Human review or caveat inspection is required.",
      pointer_warning: "Pointer warning pressure remains visible.",
      blocked: "Validation blocked review use.",
      "advisory-only": "Guidance is advisory only.",
    },
    authority_lens_tags: {
      review_only: "Review-only boundary.",
      non_committed: "Non-committed candidate boundary.",
      advisory_only: "Advisory-only guidance boundary.",
      pointer_only: "Pointer-only provenance or relation.",
      blocked: "Blocked validation boundary.",
      provenance_mismatch: "Metadata or provenance mismatch.",
      no_accepted_state: "No accepted Augnes state created.",
      no_db_write: "No DB write performed.",
      no_provider_call: "No provider/model call performed.",
      no_codex_sdk_call: "No Codex SDK call performed.",
      no_github_mutation: "No GitHub mutation performed.",
      no_core_decision: "No Core decision made.",
    },
  };
}

function buildNodeCompactSummary(
  node: CodexFormerConstellationProjectionV0["nodes"][number],
  projection: CodexFormerConstellationProjectionV0,
) {
  if (node.status === "blocked") return "Blocked validation boundary.";
  if (node.status === "needs_review") return "Needs review before use.";
  if (node.node_kind === "review_candidate") {
    return "Non-committed review candidate.";
  }
  if (node.node_kind === "validation_summary") {
    return bounded(
      `${projection.status_summary.direct_validation_status}; ${projection.status_summary.candidate_basis_quality}`,
    );
  }
  if (node.detail_refs.length > 0) return bounded(node.detail_refs[0]);
  return bounded(`${node.status}; ${node.authority}`);
}

function buildPrimaryCaveatLabel(
  projection: CodexFormerConstellationProjectionV0,
  warningPanel: PreviewWarningPanelV0,
  omittedUnsafeFields: Set<string>,
) {
  if (projection.status_summary.overall_status === "blocked") {
    const reason =
      warningPanel.blocked_reasons[0]?.examples[0] ??
      "blocked validation boundary";
    return bounded(`Blocked validation: ${reason}`);
  }

  if (warningPanel.has_pointer_warnings) {
    return "needs_review with pointer warning pressure";
  }

  if (projection.status_summary.candidate_basis_quality === "needs_review") {
    return "needs_review candidate basis";
  }

  return (
    sanitizePreviewText(
      "Review-only candidate material; no accepted state.",
      "summary.primary_caveat_label",
      omittedUnsafeFields,
    ) ?? "Review-only candidate material."
  );
}

function collectWarningExamples(
  warningNodes: CodexFormerConstellationProjectionV0["nodes"],
  fallbackWarnings: string[],
  omittedUnsafeFields: Set<string>,
) {
  const examples = copySafeCodexPerspectiveTextList(
    [
      ...warningNodes.flatMap((node) => node.detail_refs),
      ...fallbackWarnings,
    ],
    "warning_panel.examples",
    omittedUnsafeFields,
  )
    .map((value) => bounded(value))
    .filter(uniqueByValue)
    .slice(0, 4);

  return examples.length > 0
    ? examples
    : ["Warning pressure remains visible for review."];
}

function deriveNodeTone(
  node: CodexFormerConstellationProjectionV0["nodes"][number],
): CodexFormerConstellationPreviewNodeToneV0 {
  if (node.status === "accepted_future_only" || node.authority === "accepted_future_only") {
    return "future_only";
  }
  if (node.status === "blocked" || node.authority === "blocked") return "blocked";
  if (
    node.status === "needs_review" ||
    node.primary_badges.includes("pointer_warning") ||
    node.warning_count > 0
  ) {
    return "warning";
  }
  if (
    node.authority === "review_only" ||
    node.authority === "non_committed" ||
    node.authority === "advisory_only" ||
    node.authority === "pointer_only"
  ) {
    return "review";
  }
  return "neutral";
}

function deriveEdgeTone(
  edge: CodexFormerConstellationProjectionV0["edges"][number],
  lineStyle: CodexFormerConstellationPreviewEdgeLineStyleV0,
): CodexFormerConstellationPreviewNodeToneV0 {
  if (lineStyle === "blocked") return "blocked";
  if (edge.status === "needs_review" || edge.warning_count > 0) return "warning";
  if (
    edge.authority_boundary === "review_only" ||
    edge.authority_boundary === "non_committing" ||
    edge.authority_boundary === "advisory_only" ||
    edge.authority_boundary === "pointer_only"
  ) {
    return "review";
  }
  return "neutral";
}

function deriveLineStyle(
  edge: CodexFormerConstellationProjectionV0["edges"][number],
): CodexFormerConstellationPreviewEdgeLineStyleV0 {
  if (
    edge.relation === "blocked_by" ||
    edge.status === "blocked" ||
    edge.authority_boundary === "blocked"
  ) {
    return "blocked";
  }
  if (edge.relation === "pointer_only" || edge.authority_boundary === "pointer_only") {
    return "dotted";
  }
  if (edge.relation === "suggests" || edge.authority_boundary === "advisory_only") {
    return "dashed";
  }
  return "solid";
}

function relationLabel(relation: CodexFormerConstellationEdgeRelationV0) {
  const labels: Record<CodexFormerConstellationEdgeRelationV0, string> = {
    prepared: "prepared",
    pasted_by_human: "human paste",
    returned: "returned",
    validated: "validated",
    informs: "informs",
    suggests: "suggests",
    pointer_only: "pointer only",
    blocked_by: "blocked by",
  };
  return labels[relation];
}

function buildAuthorityTags(values: Array<string | null | undefined>) {
  const tags = new Set<string>();

  for (const value of values) {
    switch (value) {
      case "review_only":
      case "review-only":
        tags.add("review_only");
        break;
      case "non_committed":
      case "non_committing":
      case "non-committed":
        tags.add("non_committed");
        break;
      case "advisory_only":
      case "advisory-only":
      case "suggests":
        tags.add("advisory_only");
        break;
      case "pointer_only":
      case "pointer-only":
      case "pointer_warning":
        tags.add("pointer_only");
        break;
      case "blocked":
      case "blocked_by":
        tags.add("blocked");
        break;
      case "provenance_mismatch":
        tags.add("provenance_mismatch");
        break;
      case "no_accepted_state":
      case "no_db_write":
      case "no_provider_call":
      case "no_codex_sdk_call":
      case "no_github_mutation":
      case "no_core_decision":
        tags.add(value);
        break;
    }
  }

  return [...tags].sort();
}

function section(
  heading: string,
  rows: PreviewDetailDrawerRowV0[],
): PreviewDetailDrawerSectionV0 {
  return {
    heading: bounded(heading, 80),
    rows,
  };
}

function row(label: string, value: string | number | boolean): PreviewDetailDrawerRowV0 {
  return {
    label: bounded(label, 80),
    value: bounded(String(value)),
  };
}

function sanitizePreviewText(
  value: string | null | undefined,
  fieldName: string,
  omittedUnsafeFields: Set<string>,
) {
  const safe = sanitizeCodexPerspectiveText(value, fieldName, omittedUnsafeFields);
  return safe ? bounded(safe) : null;
}

function bounded(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function normalizeCount(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function uniqueByValue(value: string, index: number, values: string[]) {
  return values.indexOf(value) === index;
}

function copyProjection(
  projection: CodexFormerConstellationProjectionV0,
): CodexFormerConstellationProjectionV0 {
  return JSON.parse(JSON.stringify(projection)) as CodexFormerConstellationProjectionV0;
}
