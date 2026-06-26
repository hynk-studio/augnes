import type {
  ProjectConstellationDiagnosticKind,
  ProjectConstellationEdgeKind,
  ProjectConstellationLayoutDiagnostic,
  ProjectConstellationLayoutEdge,
  ProjectConstellationLayoutLayer,
  ProjectConstellationLayoutMarker,
  ProjectConstellationLayoutNode,
  ProjectConstellationLayoutPosition,
  ProjectConstellationMarkerKind,
  ProjectConstellationNodeKind,
  ProjectConstellationRuntimeLayoutAuthorityBoundary,
  ProjectConstellationRuntimeLayoutContract,
  ProjectConstellationRuntimeLayoutContractVersion,
  ProjectConstellationRuntimeLayoutScope,
} from "@/types/project-constellation-runtime-layout-contract";

export const SEEDED_CONSTELLATION_LAYOUT_RUNTIME_VERSION =
  "seeded_constellation_layout_runtime.v0.1" as const;
export const SEEDED_CONSTELLATION_LAYOUT_INPUT_VERSION =
  "seeded_constellation_layout_input.v0.1" as const;
export const SEEDED_CONSTELLATION_LAYOUT_RESULT_VERSION =
  "seeded_constellation_layout_result.v0.1" as const;

export type SeededConstellationLayoutStatus =
  | "built"
  | "empty"
  | "blocked_private_or_raw_payload"
  | "blocked_missing_nodes"
  | "blocked_invalid_input";

export type SeededConstellationLayoutReasonCode =
  | "contract_ref_present"
  | "trajectory_ref_present"
  | "durable_state_ref_present"
  | "perspective_id_present"
  | "perspective_id_missing"
  | "layout_seed_present"
  | "layout_seed_missing"
  | "input_node_present"
  | "input_node_missing"
  | "input_edge_present"
  | "edge_endpoint_ref_missing"
  | "orphan_edge_blocked"
  | "source_ref_present"
  | "candidate_ref_present"
  | "deterministic_seed_used"
  | "deterministic_layout_built"
  | "same_input_same_output"
  | "cluster_position_assigned"
  | "durable_graph_layer_positioned"
  | "candidate_overlay_layer_positioned"
  | "candidate_overlay_visually_distinct"
  | "stale_marker_positioned"
  | "tension_marker_positioned"
  | "gap_marker_positioned"
  | "bridge_marker_positioned"
  | "source_balance_diagnostic_created"
  | "coordinate_display_hint_only"
  | "coordinate_not_truth"
  | "coordinate_not_proof"
  | "coordinate_not_evidence_strength"
  | "coordinate_not_promotion_readiness"
  | "layout_is_derived"
  | "layout_is_non_authoritative"
  | "layout_persistence_not_executed"
  | "manual_anchor_persistence_not_executed"
  | "route_not_implemented"
  | "ui_not_implemented"
  | "db_write_not_executed"
  | "durable_state_not_mutated"
  | "formation_receipt_not_written"
  | "promotion_not_executed"
  | "proof_not_created"
  | "evidence_not_created"
  | "claim_evidence_not_written"
  | "product_write_denied"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "retrieval_not_executed"
  | "rag_answer_not_generated"
  | "source_fetch_not_executed"
  | "file_read_not_executed"
  | "git_ledger_export_not_executed"
  | "private_or_raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "local_path_blocked"
  | "private_url_blocked";

export interface SeededConstellationLayoutAuthorityBoundary {
  seeded_layout_runtime_now: true;
  deterministic_layout_algorithm_now: true;
  layout_persistence_now: false;
  manual_anchor_persistence_now: false;
  route_now: false;
  ui_now: false;
  graph_rendering_now: false;
  graph_database_now: false;
  db_query_or_write_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  work_mutation_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  git_ledger_export_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  layout_is_truth: false;
  coordinate_is_truth: false;
  coordinate_is_proof: false;
  coordinate_is_evidence_strength: false;
  coordinate_is_promotion_readiness: false;
  manual_anchor_is_authority: false;
  candidate_overlay_is_durable_graph: false;
  source_balance_is_truth: false;
  product_write_authority: false;
}

export interface SeededConstellationLayoutInputNode {
  input_node_id: string;
  node_ref: string;
  node_kind: ProjectConstellationNodeKind;
  layer: ProjectConstellationLayoutLayer;
  bounded_label: string;
  bounded_summary: string;
  source_refs: string[];
  candidate_refs: string[];
  review_record_refs: string[];
  promotion_decision_refs: string[];
  formation_receipt_refs: string[];
  apply_event_refs: string[];
  feedback_refs: string[];
  marker_refs: string[];
  public_safe: boolean;
  reason_codes: SeededConstellationLayoutReasonCode[];
}

export interface SeededConstellationLayoutInputEdge {
  input_edge_id: string;
  edge_ref: string;
  edge_kind: ProjectConstellationEdgeKind;
  from_node_ref: string;
  to_node_ref: string;
  bounded_label: string;
  bounded_summary: string;
  source_refs: string[];
  public_safe: boolean;
  reason_codes: SeededConstellationLayoutReasonCode[];
}

export interface SeededConstellationLayoutInput {
  input_version: typeof SEEDED_CONSTELLATION_LAYOUT_INPUT_VERSION;
  runtime_version: typeof SEEDED_CONSTELLATION_LAYOUT_RUNTIME_VERSION;
  contract_version: ProjectConstellationRuntimeLayoutContractVersion;
  scope: ProjectConstellationRuntimeLayoutScope;
  layout_id: string;
  perspective_id: string;
  as_of_state_version: string;
  trajectory_ref: string;
  durable_state_refs: string[];
  candidate_overlay_ref: string;
  layout_seed: string;
  input_nodes: SeededConstellationLayoutInputNode[];
  input_edges: SeededConstellationLayoutInputEdge[];
  requested_marker_kinds: ProjectConstellationMarkerKind[];
  requested_diagnostic_kinds: ProjectConstellationDiagnosticKind[];
  boundary_notes: string[];
  reason_codes: SeededConstellationLayoutReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface SeededConstellationLayoutResult {
  result_version: typeof SEEDED_CONSTELLATION_LAYOUT_RESULT_VERSION;
  runtime_version: typeof SEEDED_CONSTELLATION_LAYOUT_RUNTIME_VERSION;
  contract_version: ProjectConstellationRuntimeLayoutContractVersion;
  scope: ProjectConstellationRuntimeLayoutScope;
  status: SeededConstellationLayoutStatus;
  layout: ProjectConstellationRuntimeLayoutContract | null;
  diagnostics: ProjectConstellationLayoutDiagnostic[];
  rejected_input_refs: string[];
  warnings: string[];
  reason_codes: SeededConstellationLayoutReasonCode[];
  authority_boundary: SeededConstellationLayoutAuthorityBoundary;
}

export interface SeededConstellationLayoutValidationResult {
  passed: boolean;
  failure_codes: string[];
}

type ValidationFailure = {
  status: Exclude<SeededConstellationLayoutStatus, "built" | "empty">;
  code: string;
};

const scope = "project:augnes" as const;
const contractVersion =
  "project_constellation_runtime_layout_contract.v0.1" as const;
const layoutVersion = "project_constellation_layout.v0.1" as const;
const nodeVersion = "project_constellation_layout_node.v0.1" as const;
const edgeVersion = "project_constellation_layout_edge.v0.1" as const;
const diagnosticVersion =
  "project_constellation_layout_diagnostic.v0.1" as const;

const forbiddenAuthorityKeys = [
  "route_now",
  "ui_now",
  "layout_persistence_now",
  "manual_anchor_persistence_now",
  "graph_database_now",
  "db_query_or_write_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "git_ledger_export_now",
  "github_automation_authority",
  "layout_is_truth",
  "coordinate_is_truth",
  "coordinate_is_proof",
  "coordinate_is_evidence_strength",
  "coordinate_is_promotion_readiness",
  "manual_anchor_is_authority",
  "candidate_overlay_is_durable_graph",
  "source_balance_is_truth",
] as const;

const privateRawMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "raw provider output",
  "raw retrieval output",
  "raw layout payload",
  "raw conversation",
  "hidden reasoning",
  "raw DB row",
  "raw_db_row",
  "browser dump",
  "raw browser dump",
  "raw source body",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
  "raw seeded layout payload blocked by runtime fixture",
  "secret-like seeded layout input blocked by runtime fixture",
] as const;

const allowedNodeKinds: ProjectConstellationNodeKind[] = [
  "perspective",
  "thesis",
  "claim",
  "evidence_ref",
  "source_ref",
  "tension",
  "knowledge_gap",
  "candidate",
  "review_record",
  "promotion_decision",
  "formation_receipt",
  "apply_event",
  "feedback",
  "bridge",
  "durable_perspective_node",
  "candidate_overlay_node",
  "claim_node",
  "evidence_anchor_node",
  "tension_marker_node",
  "knowledge_gap_marker_node",
  "bridge_node",
  "stale_high_gravity_node",
  "source_reference_node",
  "work_context_node",
  "unknown",
];

const allowedLayers: ProjectConstellationLayoutLayer[] = [
  "durable_graph",
  "candidate_overlay",
  "review_memory",
  "source_ref",
  "feedback",
  "trajectory",
  "unknown",
];

const allowedEdgeKinds: ProjectConstellationEdgeKind[] = [
  "supports",
  "contradicts",
  "refines",
  "weakens",
  "reverses",
  "splits",
  "merges",
  "retires",
  "reactivates",
  "preserves_tension",
  "resolves_tension",
  "preserves_gap",
  "closes_gap",
  "selected_by_receipt",
  "omitted_by_receipt",
  "deferred_by_receipt",
  "promoted_by_decision",
  "applied_by_event",
  "feedback_influences",
  "source_lineage",
  "bridge_relation",
  "supports_ref",
  "contradicts_ref",
  "qualifies_ref",
  "derived_from_source",
  "candidate_overlay_link",
  "bridge_hint",
  "tension_line",
  "knowledge_gap_line",
  "reuse_condition_link",
  "work_context_link",
  "unknown",
];

const allowedReasonCodes: SeededConstellationLayoutReasonCode[] = [
  "contract_ref_present",
  "trajectory_ref_present",
  "durable_state_ref_present",
  "perspective_id_present",
  "perspective_id_missing",
  "layout_seed_present",
  "layout_seed_missing",
  "input_node_present",
  "input_node_missing",
  "input_edge_present",
  "edge_endpoint_ref_missing",
  "orphan_edge_blocked",
  "source_ref_present",
  "candidate_ref_present",
  "deterministic_seed_used",
  "deterministic_layout_built",
  "same_input_same_output",
  "cluster_position_assigned",
  "durable_graph_layer_positioned",
  "candidate_overlay_layer_positioned",
  "candidate_overlay_visually_distinct",
  "stale_marker_positioned",
  "tension_marker_positioned",
  "gap_marker_positioned",
  "bridge_marker_positioned",
  "source_balance_diagnostic_created",
  "coordinate_display_hint_only",
  "coordinate_not_truth",
  "coordinate_not_proof",
  "coordinate_not_evidence_strength",
  "coordinate_not_promotion_readiness",
  "layout_is_derived",
  "layout_is_non_authoritative",
  "layout_persistence_not_executed",
  "manual_anchor_persistence_not_executed",
  "route_not_implemented",
  "ui_not_implemented",
  "db_write_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "promotion_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "product_write_denied",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "git_ledger_export_not_executed",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
];

export function buildSeededConstellationLayoutV01(
  input: SeededConstellationLayoutInput,
): SeededConstellationLayoutResult {
  const validation = validateSeededConstellationLayoutInputV01(input);
  if (!validation.passed) {
    const status = statusForFailureCodes(validation.failure_codes);
    return blockedResult(status, validation.failure_codes);
  }

  const nodes = sortNodes(input.input_nodes);
  if (nodes.length === 0) {
    return {
      result_version: SEEDED_CONSTELLATION_LAYOUT_RESULT_VERSION,
      runtime_version: SEEDED_CONSTELLATION_LAYOUT_RUNTIME_VERSION,
      contract_version: contractVersion,
      scope,
      status: "empty",
      layout: null,
      diagnostics: [],
      rejected_input_refs: [],
      warnings: ["No public-safe input nodes were provided."],
      reason_codes: [
        "input_node_missing",
        "layout_is_derived",
        ...boundaryReasonCodes(),
      ],
      authority_boundary: createSeededConstellationLayoutAuthorityBoundaryV01(),
    };
  }

  const deterministicSeed = createDeterministicLayoutSeedV01(input);
  const layoutNodes = nodes.map((node, index) =>
    buildLayoutNode(input, node, index, deterministicSeed),
  );
  const layoutEdges = sortEdges(input.input_edges).map((edge) =>
    buildLayoutEdge(edge),
  );
  const markerKinds = new Set(input.requested_marker_kinds);
  const markers = buildMarkers(layoutNodes, markerKinds);
  const layoutWithoutFingerprint: Omit<
    ProjectConstellationRuntimeLayoutContract,
    "layout_fingerprint"
  > = {
    layout_version: layoutVersion,
    contract_version: contractVersion,
    scope,
    status: "layout_candidate",
    layout_id: input.layout_id,
    perspective_id: input.perspective_id,
    as_of_state_version: input.as_of_state_version,
    trajectory_ref: input.trajectory_ref,
    candidate_overlay_ref: input.candidate_overlay_ref,
    layout_seed: deterministicSeed,
    node_positions: layoutNodes,
    edge_routes: layoutEdges,
    manual_anchors: [],
    temporal_smoothing_state: {
      smoothing_ref: `temporal-smoothing:${input.layout_id}`,
      display_continuity_only: true,
      persistence_now: false,
      reason_codes: ["temporal_smoothing_display_continuity_only"],
    },
    stale_markers: markers.filter((marker) => marker.marker_kind === "stale"),
    tension_markers: markers.filter((marker) => marker.marker_kind === "tension"),
    gap_markers: markers.filter((marker) => marker.marker_kind === "gap"),
    bridge_node_markers: markers.filter((marker) => marker.marker_kind === "bridge"),
    source_balance_diagnostics: [],
    boundary_notes: uniqueSorted([
      ...input.boundary_notes,
      "Seeded Constellation Layout Runtime is display-only.",
      "Coordinates are display hints only.",
      "Product-write remains parked by #686.",
    ]),
    reason_codes: [
      "coordinate_display_hint_only",
      "coordinate_not_truth",
      "coordinate_not_proof",
      "coordinate_not_evidence_strength",
      "coordinate_not_promotion_readiness",
      "candidate_overlay_not_durable_graph",
      "source_balance_advisory_only",
      "layout_runtime_not_implemented",
      "route_not_implemented",
      "ui_not_implemented",
      "db_write_not_executed",
      "durable_state_not_mutated",
      "product_write_denied",
    ],
    authority_boundary: createContractAuthorityBoundaryV01(),
  };
  const layout: ProjectConstellationRuntimeLayoutContract = {
    ...layoutWithoutFingerprint,
    layout_fingerprint:
      createSeededLayoutFingerprintV01(layoutWithoutFingerprint),
  };
  const diagnostics = buildSeededConstellationLayoutDiagnosticsInternal(
    layout,
    input,
  );
  const sourceBalanceDiagnostics = diagnostics.filter(
    (diagnostic) => diagnostic.diagnostic_kind === "source_balance",
  );
  const layoutWithDiagnostics: ProjectConstellationRuntimeLayoutContract = {
    ...layout,
    source_balance_diagnostics: sourceBalanceDiagnostics,
    layout_fingerprint: createSeededLayoutFingerprintV01({
      ...layout,
      source_balance_diagnostics: sourceBalanceDiagnostics,
      layout_fingerprint: undefined,
    }),
  };

  return {
    result_version: SEEDED_CONSTELLATION_LAYOUT_RESULT_VERSION,
    runtime_version: SEEDED_CONSTELLATION_LAYOUT_RUNTIME_VERSION,
    contract_version: contractVersion,
    scope,
    status: "built",
    layout: layoutWithDiagnostics,
    diagnostics,
    rejected_input_refs: [],
    warnings: [],
    reason_codes: uniqueSeededReasonCodes([
      "contract_ref_present",
      "trajectory_ref_present",
      "durable_state_ref_present",
      "perspective_id_present",
      "layout_seed_present",
      "input_node_present",
      "input_edge_present",
      "deterministic_seed_used",
      "deterministic_layout_built",
      "same_input_same_output",
      "cluster_position_assigned",
      "durable_graph_layer_positioned",
      "candidate_overlay_layer_positioned",
      "candidate_overlay_visually_distinct",
      "stale_marker_positioned",
      "tension_marker_positioned",
      "gap_marker_positioned",
      "bridge_marker_positioned",
      "source_balance_diagnostic_created",
      "layout_is_derived",
      "layout_is_non_authoritative",
      ...coordinateReasonCodes(),
      ...boundaryReasonCodes(),
    ]),
    authority_boundary: createSeededConstellationLayoutAuthorityBoundaryV01(),
  };
}

export function validateSeededConstellationLayoutInputV01(
  input: unknown,
): SeededConstellationLayoutValidationResult {
  const failures: string[] = [];
  if (!isRecord(input)) return fail("input_not_object");
  if (input.input_version !== SEEDED_CONSTELLATION_LAYOUT_INPUT_VERSION) {
    failures.push("input_version_invalid");
  }
  if (input.runtime_version !== SEEDED_CONSTELLATION_LAYOUT_RUNTIME_VERSION) {
    failures.push("runtime_version_invalid");
  }
  if (input.contract_version !== contractVersion) {
    failures.push("contract_version_invalid");
  }
  if (input.scope !== scope) failures.push("scope_invalid");
  for (const field of [
    "layout_id",
    "perspective_id",
    "as_of_state_version",
    "trajectory_ref",
    "candidate_overlay_ref",
    "layout_seed",
  ]) {
    validateStringField(input, field, failures);
  }
  validateStringArray(input.durable_state_refs, "durable_state_refs", failures);
  validateStringArray(input.boundary_notes, "boundary_notes", failures);
  validateReasonCodes(input.reason_codes, "reason_codes", failures);
  validateEnumArray(
    input.requested_marker_kinds,
    "requested_marker_kinds",
    [
      "stale",
      "tension",
      "gap",
      "bridge",
      "source_balance",
      "candidate_overlay",
      "retired",
      "prior_thesis",
      "contradiction",
      "unknown",
    ],
    failures,
  );
  validateEnumArray(
    input.requested_diagnostic_kinds,
    "requested_diagnostic_kinds",
    [
      "source_balance",
      "stale_layout",
      "candidate_overlay_separation",
      "durable_candidate_boundary",
      "unresolved_tension_visibility",
      "knowledge_gap_visibility",
      "retired_claim_visibility",
      "prior_thesis_visibility",
      "bridge_node_visibility",
      "authority_boundary",
      "unknown",
    ],
    failures,
  );
  if (!Array.isArray(input.input_nodes)) {
    failures.push("input_nodes_not_array");
  } else if (input.input_nodes.length === 0) {
    failures.push("input_node_missing");
  } else {
    input.input_nodes.forEach((node, index) => {
      failures.push(
        ...validateSeededConstellationLayoutInputNodeV01(node).failure_codes.map(
          (code) => `input_nodes.${index}.${code}`,
        ),
      );
    });
  }
  if (!Array.isArray(input.input_edges)) {
    failures.push("input_edges_not_array");
  } else {
    input.input_edges.forEach((edge, index) => {
      failures.push(
        ...validateSeededConstellationLayoutInputEdgeV01(edge).failure_codes.map(
          (code) => `input_edges.${index}.${code}`,
        ),
      );
    });
  }
  failures.push(...validateSeededLayoutEdgeEndpointsV01(input).failure_codes);
  const authorityBoundary = input.authority_boundary;
  if (isRecord(authorityBoundary)) {
    if (forbiddenAuthorityKeys.some((key) => authorityBoundary[key] === true)) {
      failures.push("forbidden_authority");
    }
  }
  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

function validateSeededLayoutEdgeEndpointsV01(
  input: Record<string, unknown>,
): SeededConstellationLayoutValidationResult {
  if (!Array.isArray(input.input_nodes) || !Array.isArray(input.input_edges)) {
    return { passed: true, failure_codes: [] };
  }
  const inputNodeRefs = new Set<string>();
  for (const node of input.input_nodes) {
    if (!isRecord(node)) continue;
    if (isPublicSafeNonEmptyString(node.node_ref)) {
      inputNodeRefs.add(node.node_ref);
    }
  }

  const failures: string[] = [];
  input.input_edges.forEach((edge, index) => {
    if (!isRecord(edge)) return;
    if (
      isPublicSafeNonEmptyString(edge.from_node_ref) &&
      !inputNodeRefs.has(edge.from_node_ref)
    ) {
      failures.push(`input_edges.${index}.from_node_ref_missing_node`);
      failures.push(`input_edges.${index}.orphan_edge_endpoint`);
    }
    if (
      isPublicSafeNonEmptyString(edge.to_node_ref) &&
      !inputNodeRefs.has(edge.to_node_ref)
    ) {
      failures.push(`input_edges.${index}.to_node_ref_missing_node`);
      failures.push(`input_edges.${index}.orphan_edge_endpoint`);
    }
  });

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateSeededConstellationLayoutInputNodeV01(
  node: unknown,
): SeededConstellationLayoutValidationResult {
  const failures: string[] = [];
  if (!isRecord(node)) return fail("node_not_object");
  for (const field of [
    "input_node_id",
    "node_ref",
    "bounded_label",
    "bounded_summary",
  ]) {
    validateStringField(node, field, failures);
  }
  validateStringField(node, "node_kind", failures);
  if (
    typeof node.node_kind === "string" &&
    !allowedNodeKinds.includes(node.node_kind as ProjectConstellationNodeKind)
  ) {
    failures.push("node_kind_unknown_value");
  }
  validateStringField(node, "layer", failures);
  if (
    typeof node.layer === "string" &&
    !allowedLayers.includes(node.layer as ProjectConstellationLayoutLayer)
  ) {
    failures.push("layer_unknown_value");
  }
  if (node.public_safe !== true) failures.push("public_safe_not_true");
  for (const field of [
    "source_refs",
    "candidate_refs",
    "review_record_refs",
    "promotion_decision_refs",
    "formation_receipt_refs",
    "apply_event_refs",
    "feedback_refs",
    "marker_refs",
  ]) {
    validateStringArray(node[field], field, failures);
  }
  validateReasonCodes(node.reason_codes, "reason_codes", failures);
  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateSeededConstellationLayoutInputEdgeV01(
  edge: unknown,
): SeededConstellationLayoutValidationResult {
  const failures: string[] = [];
  if (!isRecord(edge)) return fail("edge_not_object");
  for (const field of [
    "input_edge_id",
    "edge_ref",
    "from_node_ref",
    "to_node_ref",
    "bounded_label",
    "bounded_summary",
  ]) {
    validateStringField(edge, field, failures);
  }
  validateStringField(edge, "edge_kind", failures);
  if (
    typeof edge.edge_kind === "string" &&
    !allowedEdgeKinds.includes(edge.edge_kind as ProjectConstellationEdgeKind)
  ) {
    failures.push("edge_kind_unknown_value");
  }
  if (edge.public_safe !== true) failures.push("public_safe_not_true");
  validateStringArray(edge.source_refs, "source_refs", failures);
  validateReasonCodes(edge.reason_codes, "reason_codes", failures);
  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function createSeededConstellationLayoutAuthorityBoundaryV01():
  SeededConstellationLayoutAuthorityBoundary {
  return {
    seeded_layout_runtime_now: true,
    deterministic_layout_algorithm_now: true,
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
    candidate_overlay_is_durable_graph: false,
    source_balance_is_truth: false,
    product_write_authority: false,
  };
}

export function createDeterministicLayoutSeedV01(
  input: SeededConstellationLayoutInput,
): string {
  return `seeded-layout:${fingerprint({
    perspective_id: input.perspective_id,
    as_of_state_version: input.as_of_state_version,
    layout_seed: input.layout_seed,
    trajectory_ref: input.trajectory_ref,
    durable_state_refs: uniqueSorted(input.durable_state_refs),
  })}`;
}

export function createSeededLayoutPositionV01(args: {
  node_ref: string;
  node_kind: ProjectConstellationNodeKind;
  layer: ProjectConstellationLayoutLayer;
  index: number;
  seed: string;
}): ProjectConstellationLayoutPosition {
  const base = layerBase(args.layer);
  const kindJitter = normalizedHash(`${args.seed}:${args.node_kind}`) * 36 - 18;
  const nodeJitter = normalizedHash(`${args.seed}:${args.node_ref}`) * 22 - 11;
  const ring = Math.floor(args.index / 8);
  const spoke = args.index % 8;
  const angle = (Math.PI * 2 * spoke) / 8 + normalizedHash(args.seed) * 0.4;
  const radius = 28 + ring * 18;
  return {
    x: round(base.x + Math.cos(angle) * radius + kindJitter),
    y: round(base.y + Math.sin(angle) * radius + nodeJitter),
    z: round(base.z + normalizedHash(`${args.seed}:z:${args.node_ref}`) * 0.2),
    coordinate_authority:
      args.node_kind === "stale_high_gravity_node"
        ? "stale_layout_hint"
        : "display_hint_only",
    reason_codes: [
      "coordinate_display_hint_only",
      "coordinate_not_truth",
      "coordinate_not_proof",
      "coordinate_not_evidence_strength",
      "coordinate_not_promotion_readiness",
    ],
  };
}

export function createSeededLayoutFingerprintV01(
  layoutWithoutFingerprint: unknown,
): string {
  return fingerprint(layoutWithoutFingerprint);
}

export function createContractAuthorityBoundaryV01():
  ProjectConstellationRuntimeLayoutAuthorityBoundary {
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

function buildLayoutNode(
  input: SeededConstellationLayoutInput,
  node: SeededConstellationLayoutInputNode,
  index: number,
  seed: string,
): ProjectConstellationLayoutNode {
  const reasonCodes = uniqueContractReasonCodes([
    "node_ref_present",
    ...(node.source_refs.length ? ["source_ref_present" as const] : []),
    ...(node.candidate_refs.length ? ["candidate_ref_present" as const] : []),
    ...(node.review_record_refs.length ? ["review_record_ref_present" as const] : []),
    ...(node.promotion_decision_refs.length
      ? ["promotion_decision_ref_present" as const]
      : []),
    ...(node.formation_receipt_refs.length
      ? ["formation_receipt_ref_present" as const]
      : []),
    ...(node.apply_event_refs.length ? ["apply_event_ref_present" as const] : []),
    ...(node.feedback_refs.length ? ["feedback_ref_present" as const] : []),
    ...(node.node_kind === "thesis" ? ["prior_thesis_ref_present" as const] : []),
    ...(node.node_kind === "claim" ? ["retired_claim_ref_present" as const] : []),
    ...(node.node_kind === "tension" ? ["tension_ref_present" as const] : []),
    ...(node.node_kind === "knowledge_gap" ? ["knowledge_gap_ref_present" as const] : []),
    ...(node.layer === "candidate_overlay"
      ? ["candidate_overlay_not_durable_graph" as const]
      : []),
    ...contractCoordinateReasonCodes(),
  ]);
  return {
    node_version: nodeVersion,
    scope,
    node_id: node.input_node_id,
    node_ref: node.node_ref,
    node_kind: node.node_kind,
    layer: node.layer,
    bounded_label: node.bounded_label,
    bounded_summary: node.bounded_summary,
    position: createSeededLayoutPositionV01({
      node_ref: node.node_ref,
      node_kind: node.node_kind,
      layer: node.layer,
      index,
      seed,
    }),
    source_refs: uniqueSorted(node.source_refs),
    candidate_refs: uniqueSorted(node.candidate_refs),
    review_record_refs: uniqueSorted(node.review_record_refs),
    promotion_decision_refs: uniqueSorted(node.promotion_decision_refs),
    formation_receipt_refs: uniqueSorted(node.formation_receipt_refs),
    apply_event_refs: uniqueSorted(node.apply_event_refs),
    feedback_refs: uniqueSorted(node.feedback_refs),
    marker_refs: uniqueSorted([
      ...node.marker_refs,
      ...markerRefsForNode(input.requested_marker_kinds, node),
    ]),
    public_safe: true,
    reason_codes: reasonCodes,
    authority_boundary: createContractAuthorityBoundaryV01(),
  };
}

function buildLayoutEdge(
  edge: SeededConstellationLayoutInputEdge,
): ProjectConstellationLayoutEdge {
  return {
    edge_version: edgeVersion,
    scope,
    edge_id: edge.input_edge_id,
    edge_ref: edge.edge_ref,
    edge_kind: edge.edge_kind,
    from_node_ref: edge.from_node_ref,
    to_node_ref: edge.to_node_ref,
    bounded_label: edge.bounded_label,
    bounded_summary: edge.bounded_summary,
    source_refs: uniqueSorted(edge.source_refs),
    reason_codes: uniqueContractReasonCodes([
      "edge_ref_present",
      ...(edge.source_refs.length ? ["source_ref_present" as const] : []),
      "source_balance_advisory_only",
    ]),
    authority_boundary: createContractAuthorityBoundaryV01(),
  };
}

function buildMarkers(
  nodes: ProjectConstellationLayoutNode[],
  requestedMarkerKinds: Set<ProjectConstellationMarkerKind>,
): ProjectConstellationLayoutMarker[] {
  const markerKinds: ProjectConstellationMarkerKind[] = [
    "stale",
    "tension",
    "gap",
    "bridge",
  ];
  return markerKinds
    .filter((kind) => requestedMarkerKinds.has(kind))
    .map((kind) => {
      const matchingNodes = nodes.filter((node) => markerMatchesNode(kind, node));
      return {
        marker_id: `marker:${kind}:seeded`,
        marker_kind: kind,
        marker_ref: `marker-ref:${kind}:seeded`,
        node_refs: matchingNodes.map((node) => node.node_ref),
        edge_refs: [],
        bounded_label: `${kind} marker`,
        bounded_summary: `${kind} marker is a display or review aid only.`,
        display_warning_only: kind === "stale",
        review_aid_only: kind !== "stale",
        reason_codes: markerReasonCodes(kind),
      };
    });
}

function buildSeededConstellationLayoutDiagnosticsInternal(
  layout: ProjectConstellationRuntimeLayoutContract,
  input: SeededConstellationLayoutInput,
): ProjectConstellationLayoutDiagnostic[] {
  const diagnostics: ProjectConstellationLayoutDiagnostic[] = [];
  if (input.requested_diagnostic_kinds.includes("source_balance")) {
    diagnostics.push({
      diagnostic_version: diagnosticVersion,
      scope,
      diagnostic_id: `diagnostic:source-balance:${layout.layout_id}`,
      diagnostic_kind: "source_balance",
      bounded_summary: "Source balance is advisory across symbolic source refs.",
      affected_node_refs: layout.node_positions
        .filter((node) => node.source_refs.length > 0)
        .map((node) => node.node_ref)
        .sort(),
      affected_edge_refs: layout.edge_routes
        .filter((edge) => edge.source_refs.length > 0)
        .map((edge) => edge.edge_ref)
        .sort(),
      reason_codes: [
        "source_ref_present",
        "source_balance_advisory_only",
        "candidate_overlay_not_durable_graph",
      ],
      authority_boundary: createContractAuthorityBoundaryV01(),
    });
  }
  if (input.requested_diagnostic_kinds.includes("candidate_overlay_separation")) {
    diagnostics.push({
      diagnostic_version: diagnosticVersion,
      scope,
      diagnostic_id: `diagnostic:candidate-overlay-separation:${layout.layout_id}`,
      diagnostic_kind: "candidate_overlay_separation",
      bounded_summary:
        "Candidate overlay is visually distinct from durable graph positions.",
      affected_node_refs: layout.node_positions
        .filter(
          (node) =>
            node.layer === "candidate_overlay" || node.layer === "durable_graph",
        )
        .map((node) => node.node_ref)
        .sort(),
      affected_edge_refs: [],
      reason_codes: [
        "candidate_ref_present",
        "candidate_overlay_not_durable_graph",
        "coordinate_display_hint_only",
      ],
      authority_boundary: createContractAuthorityBoundaryV01(),
    });
  }
  if (input.requested_diagnostic_kinds.includes("durable_candidate_boundary")) {
    diagnostics.push({
      diagnostic_version: diagnosticVersion,
      scope,
      diagnostic_id: `diagnostic:durable-candidate-boundary:${layout.layout_id}`,
      diagnostic_kind: "durable_candidate_boundary",
      bounded_summary:
        "Durable graph and candidate overlay remain separate display layers.",
      affected_node_refs: layout.node_positions
        .filter(
          (node) =>
            node.layer === "candidate_overlay" || node.layer === "durable_graph",
        )
        .map((node) => node.node_ref)
        .sort(),
      affected_edge_refs: layout.edge_routes.map((edge) => edge.edge_ref).sort(),
      reason_codes: [
        "durable_state_ref_present",
        "candidate_ref_present",
        "candidate_overlay_not_durable_graph",
      ],
      authority_boundary: createContractAuthorityBoundaryV01(),
    });
  }
  if (input.requested_diagnostic_kinds.includes("unresolved_tension_visibility")) {
    diagnostics.push({
      diagnostic_version: diagnosticVersion,
      scope,
      diagnostic_id: `diagnostic:tension-visibility:${layout.layout_id}`,
      diagnostic_kind: "unresolved_tension_visibility",
      bounded_summary: "Tension markers are review aids only.",
      affected_node_refs: layout.node_positions
        .filter((node) => node.node_kind === "tension")
        .map((node) => node.node_ref)
        .sort(),
      affected_edge_refs: [],
      reason_codes: ["tension_ref_present", "tension_marker_review_aid_only"],
      authority_boundary: createContractAuthorityBoundaryV01(),
    });
  }
  if (input.requested_diagnostic_kinds.includes("knowledge_gap_visibility")) {
    diagnostics.push({
      diagnostic_version: diagnosticVersion,
      scope,
      diagnostic_id: `diagnostic:knowledge-gap-visibility:${layout.layout_id}`,
      diagnostic_kind: "knowledge_gap_visibility",
      bounded_summary: "Gap markers are review aids only.",
      affected_node_refs: layout.node_positions
        .filter((node) => node.node_kind === "knowledge_gap")
        .map((node) => node.node_ref)
        .sort(),
      affected_edge_refs: [],
      reason_codes: ["knowledge_gap_ref_present", "gap_marker_review_aid_only"],
      authority_boundary: createContractAuthorityBoundaryV01(),
    });
  }
  return diagnostics.sort((a, b) => a.diagnostic_id.localeCompare(b.diagnostic_id));
}

function markerMatchesNode(
  kind: ProjectConstellationMarkerKind,
  node: ProjectConstellationLayoutNode,
) {
  if (kind === "stale") return node.marker_refs.some((ref) => ref.includes("stale"));
  if (kind === "tension") return node.node_kind === "tension";
  if (kind === "gap") return node.node_kind === "knowledge_gap";
  if (kind === "bridge") return node.node_kind === "bridge";
  return false;
}

function markerRefsForNode(
  markerKinds: ProjectConstellationMarkerKind[],
  node: SeededConstellationLayoutInputNode,
) {
  return markerKinds
    .filter((kind) => markerMatchesInputNode(kind, node))
    .map((kind) => `marker-ref:${kind}:${node.node_ref}`);
}

function markerMatchesInputNode(
  kind: ProjectConstellationMarkerKind,
  node: SeededConstellationLayoutInputNode,
) {
  if (kind === "stale") return node.marker_refs.some((ref) => ref.includes("stale"));
  if (kind === "tension") return node.node_kind === "tension";
  if (kind === "gap") return node.node_kind === "knowledge_gap";
  if (kind === "bridge") return node.node_kind === "bridge";
  return false;
}

function markerReasonCodes(kind: ProjectConstellationMarkerKind) {
  if (kind === "stale") return ["stale_marker_display_warning_only" as const];
  if (kind === "tension") return ["tension_marker_review_aid_only" as const];
  if (kind === "gap") return ["gap_marker_review_aid_only" as const];
  if (kind === "bridge") return ["bridge_marker_review_aid_only" as const];
  return [];
}

function layerBase(layer: ProjectConstellationLayoutLayer) {
  if (layer === "durable_graph") return { x: 0, y: 0, z: 0 };
  if (layer === "candidate_overlay") return { x: 260, y: 70, z: 0.3 };
  if (layer === "review_memory") return { x: -210, y: 130, z: 0.1 };
  if (layer === "source_ref") return { x: -260, y: -120, z: 0.1 };
  if (layer === "feedback") return { x: 120, y: -220, z: 0.1 };
  if (layer === "trajectory") return { x: 210, y: 210, z: 0.2 };
  return { x: 0, y: 260, z: 0 };
}

function sortNodes(nodes: SeededConstellationLayoutInputNode[]) {
  return [...nodes].sort((a, b) =>
    `${a.layer}:${a.node_kind}:${a.node_ref}`.localeCompare(
      `${b.layer}:${b.node_kind}:${b.node_ref}`,
    ),
  );
}

function sortEdges(edges: SeededConstellationLayoutInputEdge[]) {
  return [...edges].sort((a, b) =>
    `${a.edge_kind}:${a.edge_ref}`.localeCompare(`${b.edge_kind}:${b.edge_ref}`),
  );
}

function validateStringField(
  record: Record<string, unknown>,
  field: string,
  failures: string[],
) {
  const value = record[field];
  if (typeof value !== "string" || value.trim() === "") {
    failures.push(`${field}_missing_or_not_string`);
    return;
  }
  failures.push(...privateRawFailures(value, field));
}

function isPublicSafeNonEmptyString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    privateRawFailures(value, "value").length === 0
  );
}

function validateStringArray(
  value: unknown,
  field: string,
  failures: string[],
) {
  if (!Array.isArray(value)) {
    failures.push(`${field}_not_array`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      failures.push(`${field}.${index}_not_public_safe_string`);
      return;
    }
    failures.push(...privateRawFailures(item, `${field}.${index}`));
  });
}

function validateReasonCodes(
  value: unknown,
  field: string,
  failures: string[],
) {
  validateStringArray(value, field, failures);
  if (!Array.isArray(value)) return;
  value.forEach((item, index) => {
    if (
      typeof item === "string" &&
      !allowedReasonCodes.includes(item as SeededConstellationLayoutReasonCode)
    ) {
      failures.push(`${field}.${index}_unknown_reason_code`);
    }
  });
}

function validateEnumArray(
  value: unknown,
  field: string,
  allowed: readonly string[],
  failures: string[],
) {
  validateStringArray(value, field, failures);
  if (!Array.isArray(value)) return;
  value.forEach((item, index) => {
    if (typeof item === "string" && !allowed.includes(item)) {
      failures.push(`${field}.${index}_unknown_value`);
    }
  });
}

function privateRawFailures(value: string, field: string) {
  return privateRawMarkers
    .filter((marker) => value.includes(marker))
    .map((marker) => `${field}_${markerFailureCode(marker)}`);
}

function markerFailureCode(marker: string) {
  if (marker === "/Users/" || marker === "/home/") return "local_path_blocked";
  if (marker === "file://") return "private_url_blocked";
  if (
    marker === "sk-" ||
    marker === "ghp_" ||
    marker === "OPENAI_API_KEY" ||
    marker === "GITHUB_TOKEN" ||
    marker === "password:" ||
    marker === "secret:" ||
    marker === "private key"
  ) {
    return "secret_like_pattern_blocked";
  }
  return "private_or_raw_payload_blocked";
}

function statusForFailureCodes(
  failureCodes: string[],
): Exclude<SeededConstellationLayoutStatus, "built" | "empty"> {
  if (failureCodes.some((code) => code.includes("private_or_raw_payload_blocked"))) {
    return "blocked_private_or_raw_payload";
  }
  if (
    failureCodes.some(
      (code) =>
        code.includes("local_path_blocked") ||
        code.includes("private_url_blocked") ||
        code.includes("secret_like_pattern_blocked"),
    )
  ) {
    return "blocked_private_or_raw_payload";
  }
  if (failureCodes.some((code) => code.includes("input_node_missing"))) {
    return "blocked_missing_nodes";
  }
  return "blocked_invalid_input";
}

function blockedResult(
  status: Exclude<SeededConstellationLayoutStatus, "built" | "empty">,
  failureCodes: string[],
): SeededConstellationLayoutResult {
  return {
    result_version: SEEDED_CONSTELLATION_LAYOUT_RESULT_VERSION,
    runtime_version: SEEDED_CONSTELLATION_LAYOUT_RUNTIME_VERSION,
    contract_version: contractVersion,
    scope,
    status,
    layout: null,
    diagnostics: [],
    rejected_input_refs: ["input:blocked"],
    warnings: ["Seeded layout input was rejected before layout construction."],
    reason_codes: uniqueSeededReasonCodes([
      ...(status === "blocked_private_or_raw_payload"
        ? ["private_or_raw_payload_blocked" as const]
        : []),
      ...(status === "blocked_missing_nodes"
        ? ["input_node_missing" as const]
        : []),
      "layout_is_non_authoritative",
      ...boundaryReasonCodes(),
      ...failureCodesToReasonCodes(failureCodes),
    ]),
    authority_boundary: createSeededConstellationLayoutAuthorityBoundaryV01(),
  };
}

function failureCodesToReasonCodes(failureCodes: string[]) {
  const reasonCodes: SeededConstellationLayoutReasonCode[] = [];
  for (const code of failureCodes) {
    if (code.includes("local_path_blocked")) reasonCodes.push("local_path_blocked");
    if (code.includes("private_url_blocked")) reasonCodes.push("private_url_blocked");
    if (code.includes("secret_like_pattern_blocked")) {
      reasonCodes.push("secret_like_pattern_blocked");
    }
    if (code.includes("private_or_raw_payload_blocked")) {
      reasonCodes.push("private_or_raw_payload_blocked");
    }
    if (code.includes("from_node_ref_missing_node")) {
      reasonCodes.push("edge_endpoint_ref_missing");
    }
    if (code.includes("to_node_ref_missing_node")) {
      reasonCodes.push("edge_endpoint_ref_missing");
    }
    if (code.includes("orphan_edge_endpoint")) {
      reasonCodes.push("orphan_edge_blocked");
    }
  }
  return reasonCodes;
}

function fail(code: string): SeededConstellationLayoutValidationResult {
  return { passed: false, failure_codes: [code] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)).sort();
}

function uniqueSeededReasonCodes(
  values: SeededConstellationLayoutReasonCode[],
): SeededConstellationLayoutReasonCode[] {
  return uniqueSorted(values);
}

function uniqueContractReasonCodes(values: string[]) {
  return uniqueSorted(values.filter(Boolean)) as ProjectConstellationLayoutNode["reason_codes"];
}

function coordinateReasonCodes(): SeededConstellationLayoutReasonCode[] {
  return [
    "coordinate_display_hint_only",
    "coordinate_not_truth",
    "coordinate_not_proof",
    "coordinate_not_evidence_strength",
    "coordinate_not_promotion_readiness",
  ];
}

function contractCoordinateReasonCodes() {
  return [
    "coordinate_display_hint_only",
    "coordinate_not_truth",
    "coordinate_not_proof",
    "coordinate_not_evidence_strength",
    "coordinate_not_promotion_readiness",
  ] as const;
}

function boundaryReasonCodes(): SeededConstellationLayoutReasonCode[] {
  return [
    "layout_persistence_not_executed",
    "manual_anchor_persistence_not_executed",
    "route_not_implemented",
    "ui_not_implemented",
    "db_write_not_executed",
    "durable_state_not_mutated",
    "formation_receipt_not_written",
    "promotion_not_executed",
    "proof_not_created",
    "evidence_not_created",
    "claim_evidence_not_written",
    "product_write_denied",
    "provider_call_not_executed",
    "prompt_not_sent",
    "retrieval_not_executed",
    "rag_answer_not_generated",
    "source_fetch_not_executed",
    "file_read_not_executed",
    "git_ledger_export_not_executed",
  ];
}

function fingerprint(value: unknown) {
  return fnv1a32(stableStringify(value));
}

function normalizedHash(value: string) {
  return Number.parseInt(fnv1a32(value).slice(0, 8), 16) / 0xffffffff;
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => nested !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
