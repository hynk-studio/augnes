import type { RagContextPreviewRuntimeResultV01 } from "@/lib/research-retrieval/build-rag-context-preview";
import type {
  ProjectConstellationLayoutDiagnostic,
  ProjectConstellationLayoutEdge,
  ProjectConstellationLayoutMarker,
  ProjectConstellationLayoutNode,
  ProjectConstellationManualAnchor,
  ProjectConstellationRuntimeLayoutAuthorityBoundary,
  ProjectConstellationRuntimeLayoutContract,
} from "@/types/project-constellation-runtime-layout-contract";
import type { ManualAnchorRecord, ManualAnchorStoreResult } from "./manual-anchor-store";
import type { SeededConstellationLayoutResult } from "./seeded-layout";

export const CONSTELLATION_RUNTIME_UI_COMPLETION_UI_VERSION_V01 =
  "constellation_runtime_ui_runtime_completion.v0.1" as const;
export const CONSTELLATION_RUNTIME_UI_COMPLETION_VIEW_MODEL_VERSION_V01 =
  "constellation_runtime_ui_view_model.v0.1" as const;

export interface ConstellationRuntimeUiCompletionAuthorityBoundaryV01 {
  constellation_runtime_ui_completion_now: true;
  readonly_runtime_ui_now: true;
  durable_graph_layer_visible: true;
  candidate_overlay_layer_visible: true;
  source_provenance_inspector_visible: true;
  tension_gap_stale_bridge_markers_visible: true;
  manual_anchor_preview_visible: true;
  layout_diagnostics_visible: true;
  selected_node_trajectory_preview_visible: true;
  selected_node_context_preview_visible: true;
  same_origin_runtime_reads_only: true;
  coordinate_edit_write_now: false;
  manual_anchor_write_now: false;
  direct_db_access_from_ui_now: false;
  direct_file_write_from_ui_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_index_write_now: false;
  rag_answer_generation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  work_item_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  github_pr_create_now: false;
  github_merge_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  layout_coordinate_is_truth: false;
  manual_anchor_is_truth: false;
  salience_score_is_truth: false;
  layout_view_is_promotion: false;
  candidate_overlay_is_durable_state: false;
  rag_context_is_truth: false;
  retrieval_result_is_evidence: false;
  source_ref_is_proof: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export type ConstellationRuntimeUiCompletionReasonCodeV01 =
  | "constellation_runtime_ui_runtime_completion"
  | "bounded_runtime_read_source"
  | "durable_state_read_route_bound"
  | "trajectory_read_route_bound"
  | "manual_anchor_get_route_bound"
  | "rag_context_preview_route_bound"
  | "mounted_cockpit_layout_seed_present"
  | "no_layout_runtime_response_fallback"
  | "runtime_response_display_nodes_only"
  | "durable_graph_layer_visible"
  | "candidate_overlay_layer_visible"
  | "source_provenance_inspector_visible"
  | "tension_gap_stale_bridge_markers_visible"
  | "manual_anchor_preview_visible"
  | "layout_diagnostics_visible"
  | "selected_node_trajectory_preview_visible"
  | "selected_node_context_preview_visible"
  | "coordinate_edit_not_executed"
  | "manual_anchor_write_not_executed"
  | "direct_db_access_from_ui_not_executed"
  | "direct_file_write_from_ui_not_executed"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "source_fetch_not_executed"
  | "retrieval_index_write_not_executed"
  | "rag_answer_not_generated"
  | "proof_not_created"
  | "evidence_not_created"
  | "work_item_not_created"
  | "promotion_not_executed"
  | "durable_state_not_mutated"
  | "formation_receipt_not_written"
  | "product_write_denied"
  | "product_id_allocation_not_executed"
  | "git_github_not_executed"
  | "codex_not_executed";

export interface ConstellationRuntimeUiCompletionBoundedErrorV01 {
  source: "durable_state" | "trajectory" | "manual_anchors" | "rag_context_preview" | "view_model";
  error_code: string;
  bounded_summary: string;
}

export interface ConstellationRuntimeUiCompletionManualAnchorPreviewV01 {
  anchor_id: string;
  node_ref: string;
  anchor_reason: string;
  display_hint_only: true;
  manual_anchor_is_truth: false;
  x: number;
  y: number;
  z: number;
}

export interface ConstellationRuntimeUiCompletionTrajectoryPreviewV01 {
  selected_node_ref: string | null;
  event_count: number;
  events: Array<{
    event_id: string;
    event_kind: string;
    layer: string;
    occurred_at: string;
    subject_ref: string;
    bounded_summary: string;
    source_refs: string[];
    reason_codes: string[];
  }>;
}

export interface ConstellationRuntimeUiCompletionContextPreviewV01 {
  selected_node_ref: string | null;
  status: string;
  context_item_count: number;
  context_char_count: number;
  included_context_summaries: Array<{
    context_ref: string;
    source_ref_id: string | null;
    bounded_title: string;
    bounded_context_summary: string;
    candidate_or_durable_marker: string;
    stale_marker: string;
    retrieval_score: number;
    retrieval_score_is_truth: false;
    retrieval_score_is_promotion_readiness: false;
    retrieval_result_is_evidence: false;
  }>;
  excluded_context_reasons: unknown[];
  staleness_warnings: unknown[];
  unresolved_tensions: unknown[];
  knowledge_gaps: unknown[];
}

export interface ConstellationRuntimeUiCompletionViewModelV01 {
  view_model_version: typeof CONSTELLATION_RUNTIME_UI_COMPLETION_VIEW_MODEL_VERSION_V01;
  ui_version: typeof CONSTELLATION_RUNTIME_UI_COMPLETION_UI_VERSION_V01;
  scope: "project:augnes";
  perspective_id: string;
  state_version_ref: string;
  durable_nodes: ProjectConstellationLayoutNode[];
  candidate_overlay_nodes: ProjectConstellationLayoutNode[];
  edges: ProjectConstellationLayoutEdge[];
  source_provenance_refs: string[];
  tension_markers: ProjectConstellationLayoutMarker[];
  gap_markers: ProjectConstellationLayoutMarker[];
  stale_markers: ProjectConstellationLayoutMarker[];
  bridge_markers: ProjectConstellationLayoutMarker[];
  manual_anchor_previews: ConstellationRuntimeUiCompletionManualAnchorPreviewV01[];
  layout_diagnostics: ProjectConstellationLayoutDiagnostic[];
  selected_node_trajectory_preview: ConstellationRuntimeUiCompletionTrajectoryPreviewV01;
  selected_node_rag_context_preview: ConstellationRuntimeUiCompletionContextPreviewV01;
  bounded_errors: ConstellationRuntimeUiCompletionBoundedErrorV01[];
  authority_boundary: ConstellationRuntimeUiCompletionAuthorityBoundaryV01;
  reason_codes: ConstellationRuntimeUiCompletionReasonCodeV01[];
}

export interface BuildConstellationRuntimeUiCompletionViewModelInputV01 {
  layout_result?: SeededConstellationLayoutResult | null;
  layout?: ProjectConstellationRuntimeLayoutContract | null;
  selected_node_ref?: string | null;
  durable_state_read_response?: unknown;
  trajectory_response?: unknown;
  manual_anchor_response?: unknown;
  rag_context_preview_response?: unknown;
  bounded_errors?: ConstellationRuntimeUiCompletionBoundedErrorV01[];
}

export function createConstellationRuntimeUiCompletionAuthorityBoundaryV01():
  ConstellationRuntimeUiCompletionAuthorityBoundaryV01 {
  return {
    constellation_runtime_ui_completion_now: true,
    readonly_runtime_ui_now: true,
    durable_graph_layer_visible: true,
    candidate_overlay_layer_visible: true,
    source_provenance_inspector_visible: true,
    tension_gap_stale_bridge_markers_visible: true,
    manual_anchor_preview_visible: true,
    layout_diagnostics_visible: true,
    selected_node_trajectory_preview_visible: true,
    selected_node_context_preview_visible: true,
    same_origin_runtime_reads_only: true,
    coordinate_edit_write_now: false,
    manual_anchor_write_now: false,
    direct_db_access_from_ui_now: false,
    direct_file_write_from_ui_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_index_write_now: false,
    rag_answer_generation_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    work_item_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    github_pr_create_now: false,
    github_merge_now: false,
    repository_file_write_now: false,
    local_file_export_now: false,
    local_file_import_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    layout_coordinate_is_truth: false,
    manual_anchor_is_truth: false,
    salience_score_is_truth: false,
    layout_view_is_promotion: false,
    candidate_overlay_is_durable_state: false,
    rag_context_is_truth: false,
    retrieval_result_is_evidence: false,
    source_ref_is_proof: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function buildRuntimeConstellationViewModelV01(
  input: BuildConstellationRuntimeUiCompletionViewModelInputV01,
): ConstellationRuntimeUiCompletionViewModelV01 {
  const layout = input.layout ?? input.layout_result?.layout ?? null;
  const manualAnchorStoreResult = extractManualAnchorStoreResult(input.manual_anchor_response);
  const ragContextResult = extractRagContextPreviewResult(input.rag_context_preview_response);
  const trajectory = extractTrajectory(input.trajectory_response);
  const durableState = extractDurableState(input.durable_state_read_response);
  const fallbackNodes = layout
    ? []
    : buildRuntimeFallbackNodes({
        durableState,
        trajectory,
        manualAnchorStoreResult,
        ragContextResult,
      });
  const selectedNodeRef =
    input.selected_node_ref ?? layout?.node_positions[0]?.node_ref ?? fallbackNodes[0]?.node_ref ?? null;
  const durableNodes = layout
    ? layout.node_positions.filter((node) => node.layer === "durable_graph")
    : fallbackNodes.filter((node) => node.layer === "durable_graph");
  const candidateOverlayNodes = layout
    ? layout.node_positions.filter((node) => node.layer === "candidate_overlay")
    : fallbackNodes.filter((node) => node.layer === "candidate_overlay");
  const fallbackEdges = layout ? [] : buildRuntimeFallbackEdges(fallbackNodes);
  const fallbackMarkers = layout
    ? { tension: [], gap: [], stale: [], bridge: [] }
    : buildRuntimeFallbackMarkers({
        durableState,
        ragContextResult,
        nodes: fallbackNodes,
      });
  const boundedErrors = [
    ...(input.bounded_errors ?? []),
    ...extractBoundedErrors("durable_state", input.durable_state_read_response),
    ...extractBoundedErrors("trajectory", input.trajectory_response),
    ...extractBoundedErrors("manual_anchors", input.manual_anchor_response),
    ...extractBoundedErrors("rag_context_preview", input.rag_context_preview_response),
  ];

  return {
    view_model_version: CONSTELLATION_RUNTIME_UI_COMPLETION_VIEW_MODEL_VERSION_V01,
    ui_version: CONSTELLATION_RUNTIME_UI_COMPLETION_UI_VERSION_V01,
    scope: "project:augnes",
    perspective_id: layout?.perspective_id ?? extractPerspectiveId(input.durable_state_read_response) ?? "perspective:unknown",
    state_version_ref: layout?.as_of_state_version ?? extractStateVersion(input.durable_state_read_response) ?? "state-version:unknown",
    durable_nodes: durableNodes,
    candidate_overlay_nodes: candidateOverlayNodes,
    edges: layout?.edge_routes ?? fallbackEdges,
    source_provenance_refs: uniqueSorted([
      ...(layout?.node_positions.flatMap((node) => node.source_refs) ?? []),
      ...(layout?.edge_routes.flatMap((edge) => edge.source_refs) ?? []),
      ...fallbackNodes.flatMap((node) => node.source_refs),
      ...fallbackEdges.flatMap((edge) => edge.source_refs),
      ...collectRuntimeResponseSourceRefs(durableState, trajectory, ragContextResult),
      ...(ragContextResult?.retrieved_refs.filter(isNonEmptyString) ?? []),
    ]),
    tension_markers: layout?.tension_markers ?? fallbackMarkers.tension,
    gap_markers: layout?.gap_markers ?? fallbackMarkers.gap,
    stale_markers: layout?.stale_markers ?? fallbackMarkers.stale,
    bridge_markers: layout?.bridge_node_markers ?? fallbackMarkers.bridge,
    manual_anchor_previews: [
      ...(layout?.manual_anchors.map(manualAnchorFromLayout) ?? []),
      ...(manualAnchorStoreResult?.records.map(manualAnchorFromRecord) ?? []),
    ],
    layout_diagnostics: uniqueDiagnostics([
      ...(input.layout_result?.diagnostics ?? []),
      ...(layout?.source_balance_diagnostics ?? []),
    ]),
    selected_node_trajectory_preview: buildSelectedTrajectoryPreview(selectedNodeRef, layout, trajectory),
    selected_node_rag_context_preview: buildSelectedContextPreview(selectedNodeRef, ragContextResult),
    bounded_errors: dedupeBoundedErrors(boundedErrors),
    authority_boundary: createConstellationRuntimeUiCompletionAuthorityBoundaryV01(),
    reason_codes: [
      "constellation_runtime_ui_runtime_completion",
      "bounded_runtime_read_source",
      "durable_state_read_route_bound",
      "trajectory_read_route_bound",
      "manual_anchor_get_route_bound",
      "rag_context_preview_route_bound",
      ...(layout
        ? (["mounted_cockpit_layout_seed_present"] as const)
        : ([
            "no_layout_runtime_response_fallback",
            "runtime_response_display_nodes_only",
          ] as const)),
      "durable_graph_layer_visible",
      "candidate_overlay_layer_visible",
      "source_provenance_inspector_visible",
      "tension_gap_stale_bridge_markers_visible",
      "manual_anchor_preview_visible",
      "layout_diagnostics_visible",
      "selected_node_trajectory_preview_visible",
      "selected_node_context_preview_visible",
      "coordinate_edit_not_executed",
      "manual_anchor_write_not_executed",
      "direct_db_access_from_ui_not_executed",
      "direct_file_write_from_ui_not_executed",
      "provider_call_not_executed",
      "prompt_not_sent",
      "source_fetch_not_executed",
      "retrieval_index_write_not_executed",
      "rag_answer_not_generated",
      "proof_not_created",
      "evidence_not_created",
      "work_item_not_created",
      "promotion_not_executed",
      "durable_state_not_mutated",
      "formation_receipt_not_written",
      "product_write_denied",
      "product_id_allocation_not_executed",
      "git_github_not_executed",
      "codex_not_executed",
    ],
  };
}

function buildRuntimeFallbackNodes({
  durableState,
  trajectory,
  manualAnchorStoreResult,
  ragContextResult,
}: {
  durableState: Record<string, unknown> | null;
  trajectory: Record<string, unknown> | null;
  manualAnchorStoreResult: ManualAnchorStoreResult | null;
  ragContextResult: RagContextPreviewRuntimeResultV01 | null;
}): ProjectConstellationLayoutNode[] {
  const nodes: ProjectConstellationLayoutNode[] = [];
  const perspectiveId = durableState
    ? stringField(durableState, "perspective_id", "perspective:runtime-response-fallback")
    : "perspective:runtime-response-fallback";
  const stateSourceRefs = collectStateSourceRefs(durableState);
  if (durableState) {
    nodes.push(
      createRuntimeFallbackNode({
        index: nodes.length,
        node_id: `runtime-fallback:durable:${perspectiveId}`,
        node_ref: perspectiveId,
        node_kind: "perspective",
        layer: "durable_graph",
        bounded_label: "Runtime durable state",
        bounded_summary: safeBoundedText(
          stringField(durableState, "current_thesis", "Durable state read response is available as display context."),
        ),
        source_refs: stateSourceRefs,
        marker_refs: ["runtime_response_display_nodes_only"],
        reason_codes: [
          "perspective_id_present",
          ...sourceReasonCodes(stateSourceRefs),
        ],
      }),
    );
  }

  for (const claim of arrayRecordField(durableState, "active_claims").slice(0, 4)) {
    const sourceRefs = stringArrayField(claim, "source_refs");
    nodes.push(
      createRuntimeFallbackNode({
        index: nodes.length,
        node_id: `runtime-fallback:claim:${stringField(claim, "claim_ref", `claim:${nodes.length}`)}`,
        node_ref: stringField(claim, "claim_ref", `claim-ref:runtime-fallback:${nodes.length}`),
        node_kind: "claim",
        layer: "durable_graph",
        bounded_label: "Active claim",
        bounded_summary: safeBoundedText(stringField(claim, "bounded_summary", "Active claim read from durable state.")),
        source_refs: sourceRefs,
        marker_refs: ["runtime_response_display_nodes_only"],
        reason_codes: ["node_ref_present", "candidate_overlay_not_durable_graph", ...sourceReasonCodes(sourceRefs)],
      }),
    );
  }

  for (const item of ragContextResult?.included_context_summaries ?? []) {
    if (!item.candidate_ref && !item.candidate_or_durable_marker.includes("candidate")) continue;
    const sourceRefs = uniqueSorted([item.source_ref_id, ...stringRefsFromContext(item)].filter(isNonEmptyString));
    nodes.push(
      createRuntimeFallbackNode({
        index: nodes.length,
        node_id: `runtime-fallback:candidate:${item.context_ref}`,
        node_ref: item.candidate_ref ?? item.context_ref,
        node_kind: "candidate",
        layer: "candidate_overlay",
        bounded_label: safeBoundedText(item.bounded_title),
        bounded_summary: safeBoundedText(item.bounded_context_summary),
        source_refs: sourceRefs,
        candidate_refs: item.candidate_ref ? [item.candidate_ref] : [],
        review_record_refs: item.review_record_ref ? [item.review_record_ref] : [],
        promotion_decision_refs: item.promotion_decision_ref ? [item.promotion_decision_ref] : [],
        formation_receipt_refs: item.formation_receipt_ref ? [item.formation_receipt_ref] : [],
        feedback_refs: item.feedback_ref ? [item.feedback_ref] : [],
        marker_refs: ["candidate_overlay_not_durable_graph", item.candidate_or_durable_marker],
        reason_codes: ["candidate_ref_present", "candidate_overlay_not_durable_graph", ...sourceReasonCodes(sourceRefs)],
      }),
    );
  }

  for (const record of manualAnchorStoreResult?.records ?? []) {
    if (nodes.some((node) => node.node_ref === record.node_ref)) continue;
    nodes.push(
      createRuntimeFallbackNode({
        index: nodes.length,
        node_id: `runtime-fallback:manual-anchor:${record.anchor_id}`,
        node_ref: record.node_ref,
        node_kind: "bridge",
        layer: "durable_graph",
        bounded_label: "Manual anchor preview",
        bounded_summary: safeBoundedText(record.anchor_reason),
        source_refs: [],
        marker_refs: ["manual_anchor_display_hint_only"],
        reason_codes: ["node_ref_present", "manual_anchor_display_hint_only"],
      }),
    );
  }

  for (const event of arrayRecordField(trajectory, "events").slice(0, 3)) {
    const subjectRef = stringField(event, "subject_ref", "");
    if (!subjectRef || nodes.some((node) => node.node_ref === subjectRef)) continue;
    const sourceRefs = stringArrayField(event, "source_refs");
    nodes.push(
      createRuntimeFallbackNode({
        index: nodes.length,
        node_id: `runtime-fallback:trajectory:${stringField(event, "event_id", subjectRef)}`,
        node_ref: subjectRef,
        node_kind: "apply_event",
        layer: "trajectory",
        bounded_label: "Trajectory event",
        bounded_summary: safeBoundedText(stringField(event, "bounded_summary", "Trajectory event read response.")),
        source_refs: sourceRefs,
        marker_refs: ["temporal_smoothing_display_continuity_only"],
        reason_codes: ["node_ref_present", ...sourceReasonCodes(sourceRefs)],
      }),
    );
  }

  return nodes.slice(0, 12);
}

function buildRuntimeFallbackEdges(
  nodes: ProjectConstellationLayoutNode[],
): ProjectConstellationLayoutEdge[] {
  const durableRoot = nodes.find((node) => node.layer === "durable_graph");
  if (!durableRoot) return [];
  return nodes
    .filter((node) => node.node_ref !== durableRoot.node_ref)
    .slice(0, 10)
    .map((node, index) => ({
      edge_version: "project_constellation_layout_edge.v0.1",
      scope: "project:augnes",
      edge_id: `runtime-fallback:edge:${index + 1}`,
      edge_ref: `edge-ref:runtime-fallback:${index + 1}`,
      edge_kind: node.layer === "candidate_overlay" ? "candidate_overlay_link" : "bridge_relation",
      from_node_ref: durableRoot.node_ref,
      to_node_ref: node.node_ref,
      bounded_label: node.layer === "candidate_overlay" ? "Candidate overlay display link" : "Runtime display link",
      bounded_summary:
        "Read-only runtime response display link; this edge is a view-model hint only.",
      source_refs: node.source_refs,
      reason_codes: ["edge_ref_present", "coordinate_not_truth", ...sourceReasonCodes(node.source_refs)],
      authority_boundary: createLayoutAuthorityBoundary(),
    }));
}

function buildRuntimeFallbackMarkers({
  durableState,
  ragContextResult,
  nodes,
}: {
  durableState: Record<string, unknown> | null;
  ragContextResult: RagContextPreviewRuntimeResultV01 | null;
  nodes: ProjectConstellationLayoutNode[];
}): {
  tension: ProjectConstellationLayoutMarker[];
  gap: ProjectConstellationLayoutMarker[];
  stale: ProjectConstellationLayoutMarker[];
  bridge: ProjectConstellationLayoutMarker[];
} {
  const nodeRefs = nodes.map((node) => node.node_ref);
  const tension = [
    ...arrayRecordField(durableState, "open_tensions").slice(0, 4).map((item, index) =>
      createRuntimeFallbackMarker({
        marker_kind: "tension",
        marker_ref: stringField(item, "tension_ref", `tension-ref:runtime-fallback:${index + 1}`),
        node_refs: nodeRefs.slice(0, 2),
        bounded_label: "Runtime tension marker",
        bounded_summary: safeBoundedText(stringField(item, "bounded_summary", "Open tension read from durable state.")),
        reason_codes: ["tension_ref_present", "tension_marker_review_aid_only"],
      }),
    ),
    ...(ragContextResult?.unresolved_tensions ?? []).slice(0, 3).map((item, index) =>
      createRuntimeFallbackMarker({
        marker_kind: "tension",
        marker_ref: `rag-tension-ref:runtime-fallback:${index + 1}`,
        node_refs: nodeRefs.slice(0, 2),
        bounded_label: "RAG context tension marker",
        bounded_summary: safeBoundedText(String(item)),
        reason_codes: ["tension_ref_present", "tension_marker_review_aid_only"],
      }),
    ),
  ];
  const gap = [
    ...arrayRecordField(durableState, "knowledge_gaps").slice(0, 4).map((item, index) =>
      createRuntimeFallbackMarker({
        marker_kind: "gap",
        marker_ref: stringField(item, "knowledge_gap_ref", `knowledge-gap-ref:runtime-fallback:${index + 1}`),
        node_refs: nodeRefs.slice(0, 2),
        bounded_label: "Runtime gap marker",
        bounded_summary: safeBoundedText(stringField(item, "bounded_summary", "Knowledge gap read from durable state.")),
        reason_codes: ["knowledge_gap_ref_present", "gap_marker_review_aid_only"],
      }),
    ),
    ...(ragContextResult?.knowledge_gaps ?? []).slice(0, 3).map((item, index) =>
      createRuntimeFallbackMarker({
        marker_kind: "gap",
        marker_ref: `rag-gap-ref:runtime-fallback:${index + 1}`,
        node_refs: nodeRefs.slice(0, 2),
        bounded_label: "RAG context gap marker",
        bounded_summary: safeBoundedText(String(item)),
        reason_codes: ["knowledge_gap_ref_present", "gap_marker_review_aid_only"],
      }),
    ),
  ];
  const stale = (ragContextResult?.staleness_warnings ?? []).slice(0, 3).map((item, index) =>
    createRuntimeFallbackMarker({
      marker_kind: "stale",
      marker_ref: `stale-ref:runtime-fallback:${index + 1}`,
      node_refs: nodeRefs.slice(0, 2),
      bounded_label: "Runtime stale warning",
      bounded_summary: safeBoundedText(String(item)),
      display_warning_only: true,
      reason_codes: ["stale_marker_display_warning_only"],
    }),
  );
  const bridge = (ragContextResult?.included_context_summaries ?? []).slice(0, 3).map((item, index) =>
    createRuntimeFallbackMarker({
      marker_kind: "bridge",
      marker_ref: item.context_ref || `bridge-ref:runtime-fallback:${index + 1}`,
      node_refs: nodeRefs.slice(0, 2),
      bounded_label: "Runtime bridge marker",
      bounded_summary: `RAG context preview links ${safeBoundedText(item.bounded_title)} as read-only context.`,
      reason_codes: ["bridge_marker_review_aid_only"],
    }),
  );
  return { tension, gap, stale, bridge };
}

function createRuntimeFallbackNode({
  index,
  node_id,
  node_ref,
  node_kind,
  layer,
  bounded_label,
  bounded_summary,
  source_refs,
  candidate_refs = [],
  review_record_refs = [],
  promotion_decision_refs = [],
  formation_receipt_refs = [],
  apply_event_refs = [],
  feedback_refs = [],
  marker_refs,
  reason_codes,
}: {
  index: number;
  node_id: string;
  node_ref: string;
  node_kind: ProjectConstellationLayoutNode["node_kind"];
  layer: ProjectConstellationLayoutNode["layer"];
  bounded_label: string;
  bounded_summary: string;
  source_refs: string[];
  candidate_refs?: string[];
  review_record_refs?: string[];
  promotion_decision_refs?: string[];
  formation_receipt_refs?: string[];
  apply_event_refs?: string[];
  feedback_refs?: string[];
  marker_refs: string[];
  reason_codes: ProjectConstellationLayoutNode["reason_codes"];
}): ProjectConstellationLayoutNode {
  return {
    node_version: "project_constellation_layout_node.v0.1",
    scope: "project:augnes",
    node_id: safeRef(node_id),
    node_ref: safeRef(node_ref),
    node_kind,
    layer,
    bounded_label: safeBoundedText(bounded_label),
    bounded_summary: `${safeBoundedText(bounded_summary)} This runtime response node is display/read-model only, not truth, proof, accepted evidence, durable state mutation, promotion, or product-write.`,
    position: {
      x: 96 + (index % 4) * 144,
      y: 112 + Math.floor(index / 4) * 112,
      z: 0,
      coordinate_authority: "display_hint_only",
      reason_codes: [
        "coordinate_display_hint_only",
        "coordinate_not_truth",
        "coordinate_not_proof",
        "coordinate_not_evidence_strength",
        "coordinate_not_promotion_readiness",
      ],
    },
    source_refs: uniqueSorted(source_refs),
    candidate_refs: uniqueSorted(candidate_refs),
    review_record_refs: uniqueSorted(review_record_refs),
    promotion_decision_refs: uniqueSorted(promotion_decision_refs),
    formation_receipt_refs: uniqueSorted(formation_receipt_refs),
    apply_event_refs: uniqueSorted(apply_event_refs),
    feedback_refs: uniqueSorted(feedback_refs),
    marker_refs: uniqueSorted(marker_refs),
    public_safe: true,
    reason_codes: uniqueSorted([
      "node_ref_present",
      "coordinate_display_hint_only",
      "coordinate_not_truth",
      ...reason_codes,
    ]) as ProjectConstellationLayoutNode["reason_codes"],
    authority_boundary: createLayoutAuthorityBoundary(),
  };
}

function createRuntimeFallbackMarker({
  marker_kind,
  marker_ref,
  node_refs,
  bounded_label,
  bounded_summary,
  display_warning_only = false,
  reason_codes,
}: {
  marker_kind: ProjectConstellationLayoutMarker["marker_kind"];
  marker_ref: string;
  node_refs: string[];
  bounded_label: string;
  bounded_summary: string;
  display_warning_only?: boolean;
  reason_codes: ProjectConstellationLayoutMarker["reason_codes"];
}): ProjectConstellationLayoutMarker {
  return {
    marker_id: `marker:${marker_kind}:${safeRef(marker_ref)}`,
    marker_kind,
    marker_ref: safeRef(marker_ref),
    node_refs: uniqueSorted(node_refs),
    edge_refs: [],
    bounded_label: safeBoundedText(bounded_label),
    bounded_summary: `${safeBoundedText(bounded_summary)} Marker is a review/display aid only.`,
    display_warning_only,
    review_aid_only: true,
    reason_codes: uniqueSorted(reason_codes) as ProjectConstellationLayoutMarker["reason_codes"],
  };
}

function buildSelectedTrajectoryPreview(
  selectedNodeRef: string | null,
  layout: ProjectConstellationRuntimeLayoutContract | null,
  trajectory: Record<string, unknown> | null,
): ConstellationRuntimeUiCompletionTrajectoryPreviewV01 {
  const selectedNode = layout?.node_positions.find((node) => node.node_ref === selectedNodeRef) ?? null;
  const matchRefs = new Set([
    selectedNodeRef,
    selectedNode?.node_id,
    ...(selectedNode?.source_refs ?? []),
    ...(selectedNode?.candidate_refs ?? []),
    ...(selectedNode?.review_record_refs ?? []),
    ...(selectedNode?.promotion_decision_refs ?? []),
    ...(selectedNode?.formation_receipt_refs ?? []),
    ...(selectedNode?.apply_event_refs ?? []),
    ...(selectedNode?.feedback_refs ?? []),
  ].filter(isNonEmptyString));
  const rawEvents = Array.isArray(trajectory?.events) ? trajectory.events : [];
  const matchedEvents = rawEvents
    .filter(isRecord)
    .filter((event) => eventMatchesRefs(event, matchRefs));
  const events = (matchedEvents.length > 0 ? matchedEvents : rawEvents.filter(isRecord))
    .slice(0, 5)
    .map((event) => ({
      event_id: stringField(event, "event_id", "trajectory:event:unknown"),
      event_kind: stringField(event, "event_kind", "unknown"),
      layer: stringField(event, "layer", "unknown"),
      occurred_at: stringField(event, "occurred_at", "unknown"),
      subject_ref: stringField(event, "subject_ref", "unknown"),
      bounded_summary: stringField(event, "bounded_summary", "No bounded trajectory summary returned."),
      source_refs: stringArrayField(event, "source_refs"),
      reason_codes: stringArrayField(event, "reason_codes"),
    }));
  return {
    selected_node_ref: selectedNodeRef,
    event_count: events.length,
    events,
  };
}

function buildSelectedContextPreview(
  selectedNodeRef: string | null,
  ragContextResult: RagContextPreviewRuntimeResultV01 | null,
): ConstellationRuntimeUiCompletionContextPreviewV01 {
  const included = ragContextResult?.included_context_summaries ?? [];
  return {
    selected_node_ref: selectedNodeRef,
    status: ragContextResult?.status ?? "not_loaded",
    context_item_count: ragContextResult?.context_item_count ?? 0,
    context_char_count: ragContextResult?.context_char_count ?? 0,
    included_context_summaries: included.slice(0, 6).map((item) => ({
      context_ref: item.context_ref,
      source_ref_id: item.source_ref_id,
      bounded_title: item.bounded_title,
      bounded_context_summary: item.bounded_context_summary,
      candidate_or_durable_marker: item.candidate_or_durable_marker,
      stale_marker: item.stale_marker,
      retrieval_score: item.retrieval_score,
      retrieval_score_is_truth: false,
      retrieval_score_is_promotion_readiness: false,
      retrieval_result_is_evidence: false,
    })),
    excluded_context_reasons: ragContextResult?.excluded_context_reasons ?? [],
    staleness_warnings: ragContextResult?.staleness_warnings ?? [],
    unresolved_tensions: ragContextResult?.unresolved_tensions ?? [],
    knowledge_gaps: ragContextResult?.knowledge_gaps ?? [],
  };
}

function manualAnchorFromLayout(
  anchor: ProjectConstellationManualAnchor,
): ConstellationRuntimeUiCompletionManualAnchorPreviewV01 {
  return {
    anchor_id: anchor.anchor_id,
    node_ref: anchor.node_ref,
    anchor_reason: anchor.anchor_reason,
    display_hint_only: true,
    manual_anchor_is_truth: false,
    x: anchor.anchor_position.x,
    y: anchor.anchor_position.y,
    z: anchor.anchor_position.z,
  };
}

function manualAnchorFromRecord(
  record: ManualAnchorRecord,
): ConstellationRuntimeUiCompletionManualAnchorPreviewV01 {
  return {
    anchor_id: record.anchor_id,
    node_ref: record.node_ref,
    anchor_reason: record.anchor_reason,
    display_hint_only: true,
    manual_anchor_is_truth: false,
    x: record.anchor_position.x,
    y: record.anchor_position.y,
    z: record.anchor_position.z,
  };
}

function extractManualAnchorStoreResult(response: unknown): ManualAnchorStoreResult | null {
  if (!isRecord(response)) return null;
  const result = response.result;
  if (!isRecord(result)) return null;
  if (!Array.isArray(result.records)) return null;
  return result as unknown as ManualAnchorStoreResult;
}

function extractRagContextPreviewResult(response: unknown): RagContextPreviewRuntimeResultV01 | null {
  if (!isRecord(response)) return null;
  const result = response.result;
  if (!isRecord(result)) return null;
  if (!Array.isArray(result.included_context_summaries)) return null;
  return result as unknown as RagContextPreviewRuntimeResultV01;
}

function extractTrajectory(response: unknown): Record<string, unknown> | null {
  if (!isRecord(response)) return null;
  return isRecord(response.trajectory) ? response.trajectory : null;
}

function extractDurableState(response: unknown): Record<string, unknown> | null {
  if (!isRecord(response) || !isRecord(response.result) || !isRecord(response.result.state)) return null;
  return response.result.state;
}

function extractPerspectiveId(response: unknown): string | null {
  if (!isRecord(response) || !isRecord(response.result) || !isRecord(response.result.state)) return null;
  return stringField(response.result.state, "perspective_id", "");
}

function extractStateVersion(response: unknown): string | null {
  if (!isRecord(response) || !isRecord(response.result) || !isRecord(response.result.state)) return null;
  return stringField(response.result.state, "state_version", "");
}

function extractBoundedErrors(
  source: ConstellationRuntimeUiCompletionBoundedErrorV01["source"],
  response: unknown,
): ConstellationRuntimeUiCompletionBoundedErrorV01[] {
  if (!isRecord(response)) return [];
  const errorCode = typeof response.error_code === "string" ? response.error_code : null;
  if (!errorCode) return [];
  return [
    {
      source,
      error_code: errorCode,
      bounded_summary: `${source} returned bounded error ${errorCode}.`,
    },
  ];
}

function eventMatchesRefs(event: Record<string, unknown>, refs: Set<string>) {
  if (refs.size === 0) return false;
  const eventRefs = [
    stringField(event, "subject_ref", ""),
    ...stringArrayField(event, "source_refs"),
    ...stringArrayField(event, "candidate_refs"),
    ...stringArrayField(event, "review_record_refs"),
    ...stringArrayField(event, "promotion_decision_refs"),
    ...stringArrayField(event, "formation_receipt_refs"),
    ...stringArrayField(event, "apply_event_refs"),
    ...stringArrayField(event, "feedback_refs"),
    ...stringArrayField(event, "active_claim_refs"),
    ...stringArrayField(event, "retired_claim_refs"),
    ...stringArrayField(event, "tension_refs"),
    ...stringArrayField(event, "knowledge_gap_refs"),
  ];
  return eventRefs.some((ref) => refs.has(ref));
}

function collectRuntimeResponseSourceRefs(
  durableState: Record<string, unknown> | null,
  trajectory: Record<string, unknown> | null,
  ragContextResult: RagContextPreviewRuntimeResultV01 | null,
) {
  return uniqueSorted([
    ...collectStateSourceRefs(durableState),
    ...arrayRecordField(trajectory, "events").flatMap((event) => stringArrayField(event, "source_refs")),
    ...(ragContextResult?.retrieved_refs ?? []),
    ...(ragContextResult?.included_context_summaries.flatMap(stringRefsFromContext) ?? []),
  ]);
}

function collectStateSourceRefs(state: Record<string, unknown> | null) {
  if (!state) return [];
  return uniqueSorted([
    ...arrayRecordField(state, "active_claims").flatMap((claim) => stringArrayField(claim, "source_refs")),
    ...arrayRecordField(state, "retired_claims").flatMap((claim) => stringArrayField(claim, "source_refs")),
    ...arrayRecordField(state, "open_tensions").flatMap((tension) => stringArrayField(tension, "source_refs")),
    ...arrayRecordField(state, "resolved_tensions").flatMap((tension) => stringArrayField(tension, "source_refs")),
    ...arrayRecordField(state, "knowledge_gaps").flatMap((gap) => stringArrayField(gap, "source_refs")),
  ]);
}

function stringRefsFromContext(item: RagContextPreviewRuntimeResultV01["included_context_summaries"][number]) {
  return [
    item.source_ref_id,
    item.source_record_ref,
    item.candidate_ref,
    item.review_record_ref,
    item.promotion_decision_ref,
    item.formation_receipt_ref,
    item.feedback_ref,
    item.provider_extraction_ref,
    item.bounded_source_intake_ref,
  ].filter(isNonEmptyString);
}

function sourceReasonCodes(sourceRefs: string[]): ProjectConstellationLayoutNode["reason_codes"] {
  return sourceRefs.length > 0 ? ["source_ref_present"] : [];
}

function arrayRecordField(record: Record<string, unknown> | null, key: string): Record<string, unknown>[] {
  if (!record) return [];
  const value = record[key];
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function uniqueDiagnostics(
  diagnostics: ProjectConstellationLayoutDiagnostic[],
): ProjectConstellationLayoutDiagnostic[] {
  const byId = new Map<string, ProjectConstellationLayoutDiagnostic>();
  for (const diagnostic of diagnostics) byId.set(diagnostic.diagnostic_id, diagnostic);
  return Array.from(byId.values()).sort((a, b) => a.diagnostic_id.localeCompare(b.diagnostic_id));
}

function dedupeBoundedErrors(
  errors: ConstellationRuntimeUiCompletionBoundedErrorV01[],
): ConstellationRuntimeUiCompletionBoundedErrorV01[] {
  const byKey = new Map<string, ConstellationRuntimeUiCompletionBoundedErrorV01>();
  for (const error of errors) byKey.set(`${error.source}:${error.error_code}`, error);
  return Array.from(byKey.values());
}

function stringField(record: Record<string, unknown>, key: string, fallback: string) {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function stringArrayField(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  return Array.isArray(value) ? value.filter(isNonEmptyString) : [];
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(isNonEmptyString))).sort();
}

function safeRef(value: string) {
  return safeBoundedText(value).replace(/\s+/g, "-").slice(0, 160) || "runtime-fallback-ref";
}

function safeBoundedText(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return "Bounded runtime display item.";
  if (/SAFE_MARKER|secret|token|\/Users\/|\/home\/|file:\/\//i.test(trimmed)) {
    return "Bounded runtime display item omitted because it was not public-safe.";
  }
  return trimmed.slice(0, 220);
}

function createLayoutAuthorityBoundary(): ProjectConstellationRuntimeLayoutAuthorityBoundary {
  return {
    contract_only: true,
    layout_runtime_now: false,
    layout_algorithm_now: false,
    seeded_layout_now: false,
    layout_persistence_now: false,
    manual_anchor_persistence_now: false,
    route_now: false,
    ui_now: false,
    graph_rendering_now: false,
    graph_database_now: false,
    db_query_or_write_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    work_mutation_now: false,
    source_fetch_now: false,
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    embedding_created_now: false,
    vector_search_now: false,
    git_ledger_export_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    layout_is_truth: false,
    coordinate_is_truth: false,
    coordinate_is_proof: false,
    coordinate_is_evidence_strength: false,
    coordinate_is_promotion_readiness: false,
    manual_anchor_is_authority: false,
    temporal_smoothing_is_state: false,
    candidate_overlay_is_durable_graph: false,
    source_balance_is_truth: false,
    product_write_authority: false,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
