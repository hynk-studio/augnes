export const CODEX_FORMER_CONSTELLATION_PREVIEW_VERSION =
  "codex_former_constellation_preview_data.v0.1";

export type CodexFormerPreviewDetailRow = {
  label: string;
  value: string;
};

export type CodexFormerPreviewDetailSection = {
  heading: string;
  rows: CodexFormerPreviewDetailRow[];
};

export type CodexFormerPreviewDetailDrawer = {
  id: string;
  target_id: string;
  target_kind: string;
  title: string;
  sections: CodexFormerPreviewDetailSection[];
};

export type CodexFormerPreviewGraphNode = {
  id: string;
  kind: string;
  label: string;
  status: string;
  authority: string;
  badges: string[];
  tone: "neutral" | "review" | "warning" | "blocked" | "future_only" | string;
  compact_summary: string;
  warning_count: number;
  detail_drawer_id: string;
  authority_lens_tags: string[];
};

export type CodexFormerPreviewGraphEdge = {
  id: string;
  from: string;
  to: string;
  relation: string;
  label: string;
  status: string;
  authority_boundary: string;
  line_style: "solid" | "dashed" | "dotted" | "blocked" | string;
  tone: "neutral" | "review" | "warning" | "blocked" | "future_only" | string;
  warning_count: number;
  detail_drawer_id: string;
  authority_lens_tags: string[];
};

export type CodexFormerPreviewWarningGroup = {
  id: string;
  label: string;
  count: number;
  tone: string;
  source_node_ids: string[];
  examples: string[];
};

export type CodexFormerPreviewData = {
  preview_version: string;
  preview_kind: string;
  generated_at: string;
  summary_panel: {
    title: string;
    conclusion: string;
    overall_status: string;
    candidate_count: number;
    metadata_match: boolean;
    primary_status_label: string;
    primary_caveat_label: string;
    next_safe_action_label: string;
    is_review_only: boolean;
    is_accepted_state: boolean;
  };
  graph: {
    nodes: CodexFormerPreviewGraphNode[];
    edges: CodexFormerPreviewGraphEdge[];
  };
  warning_panel: {
    warning_count: number;
    pointer_warning_count: number;
    grouped_warnings: CodexFormerPreviewWarningGroup[];
    blocked_reasons: CodexFormerPreviewWarningGroup[];
    has_blocking_warnings: boolean;
    has_pointer_warnings: boolean;
    default_collapsed: boolean;
  };
  authority_lens: {
    available: boolean;
    default_enabled: boolean;
    tags: string[];
    summary: string;
    flags: Record<string, boolean>;
  };
  detail_drawers: CodexFormerPreviewDetailDrawer[];
  legend: {
    node_tones: Record<string, string>;
    edge_line_styles: Record<string, string>;
    badges: Record<string, string>;
    authority_lens_tags: Record<string, string>;
  };
  privacy: {
    raw_payloads_included: boolean;
    bounded_summaries_only: boolean;
    unsafe_input_material_omitted: boolean;
    omitted_unsafe_fields: string[];
  };
  authority_flags: Record<string, boolean>;
};

export type CodexFormerPreviewSurfaceValidation = {
  valid: boolean;
  errors: string[];
};

export function validateCodexFormerConstellationPreviewSurfaceData(
  previewData: Pick<CodexFormerPreviewData, "preview_version" | "graph">,
): CodexFormerPreviewSurfaceValidation {
  const errors: string[] = [];

  if (previewData.preview_version !== CODEX_FORMER_CONSTELLATION_PREVIEW_VERSION) {
    errors.push(`unsupported preview_version: ${previewData.preview_version}`);
  }

  if (!Array.isArray(previewData.graph?.nodes) || previewData.graph.nodes.length === 0) {
    errors.push("invalid graph: no nodes available");
  }

  const nodeIds = new Set(previewData.graph?.nodes?.map((node) => node.id) ?? []);
  for (const edge of previewData.graph?.edges ?? []) {
    if (!nodeIds.has(edge.from)) {
      errors.push(`invalid graph edge reference: ${edge.id} missing from ${edge.from}`);
    }
    if (!nodeIds.has(edge.to)) {
      errors.push(`invalid graph edge reference: ${edge.id} missing to ${edge.to}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getCodexFormerPreviewDrawerById(
  previewData: CodexFormerPreviewData,
  drawerId: string,
): CodexFormerPreviewDetailDrawer | null {
  return (
    previewData.detail_drawers.find((drawer) => drawer.id === drawerId) ??
    previewData.detail_drawers.find((drawer) => drawer.id === "drawer:summary") ??
    null
  );
}
