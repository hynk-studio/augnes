import type {
  ProjectConstellationLayoutDiagnostic,
  ProjectConstellationRuntimeLayoutAuthorityBoundary,
  ProjectConstellationRuntimeLayoutContract,
} from "@/types/project-constellation-runtime-layout-contract";
import type { SeededConstellationLayoutInput } from "./seeded-layout";

const scope = "project:augnes" as const;
const diagnosticVersion =
  "project_constellation_layout_diagnostic.v0.1" as const;

export function buildSeededConstellationLayoutDiagnosticsV01(
  layout: ProjectConstellationRuntimeLayoutContract,
  input: SeededConstellationLayoutInput,
): ProjectConstellationLayoutDiagnostic[] {
  return [
    ...buildSourceBalanceDiagnosticsV01(layout, input),
    ...buildCandidateOverlaySeparationDiagnosticsV01(layout, input),
    ...buildDurableCandidateBoundaryDiagnosticsV01(layout, input),
    ...buildTensionGapVisibilityDiagnosticsV01(layout, input),
  ].sort((a, b) => a.diagnostic_id.localeCompare(b.diagnostic_id));
}

export function buildSourceBalanceDiagnosticsV01(
  layout: ProjectConstellationRuntimeLayoutContract,
  input: SeededConstellationLayoutInput,
): ProjectConstellationLayoutDiagnostic[] {
  if (!input.requested_diagnostic_kinds.includes("source_balance")) return [];
  return [
    {
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
      authority_boundary: createDiagnosticAuthorityBoundary(),
    },
  ];
}

export function buildCandidateOverlaySeparationDiagnosticsV01(
  layout: ProjectConstellationRuntimeLayoutContract,
  input: SeededConstellationLayoutInput,
): ProjectConstellationLayoutDiagnostic[] {
  if (!input.requested_diagnostic_kinds.includes("candidate_overlay_separation")) {
    return [];
  }
  const candidateNodes = layout.node_positions.filter(
    (node) => node.layer === "candidate_overlay",
  );
  const durableNodes = layout.node_positions.filter(
    (node) => node.layer === "durable_graph",
  );
  return [
    {
      diagnostic_version: diagnosticVersion,
      scope,
      diagnostic_id: `diagnostic:candidate-overlay-separation:${layout.layout_id}`,
      diagnostic_kind: "candidate_overlay_separation",
      bounded_summary:
        "Candidate overlay is visually distinct from durable graph positions.",
      affected_node_refs: uniqueSorted([
        ...candidateNodes.map((node) => node.node_ref),
        ...durableNodes.map((node) => node.node_ref),
      ]),
      affected_edge_refs: [],
      reason_codes: [
        "candidate_ref_present",
        "candidate_overlay_not_durable_graph",
        "coordinate_display_hint_only",
      ],
      authority_boundary: createDiagnosticAuthorityBoundary(),
    },
  ];
}

export function buildDurableCandidateBoundaryDiagnosticsV01(
  layout: ProjectConstellationRuntimeLayoutContract,
  input: SeededConstellationLayoutInput,
): ProjectConstellationLayoutDiagnostic[] {
  if (!input.requested_diagnostic_kinds.includes("durable_candidate_boundary")) {
    return [];
  }
  return [
    {
      diagnostic_version: diagnosticVersion,
      scope,
      diagnostic_id: `diagnostic:durable-candidate-boundary:${layout.layout_id}`,
      diagnostic_kind: "durable_candidate_boundary",
      bounded_summary:
        "Durable graph and candidate overlay remain separate display layers.",
      affected_node_refs: layout.node_positions
        .filter(
          (node) =>
            node.layer === "durable_graph" || node.layer === "candidate_overlay",
        )
        .map((node) => node.node_ref)
        .sort(),
      affected_edge_refs: layout.edge_routes.map((edge) => edge.edge_ref).sort(),
      reason_codes: [
        "durable_state_ref_present",
        "candidate_ref_present",
        "candidate_overlay_not_durable_graph",
      ],
      authority_boundary: createDiagnosticAuthorityBoundary(),
    },
  ];
}

export function buildTensionGapVisibilityDiagnosticsV01(
  layout: ProjectConstellationRuntimeLayoutContract,
  input: SeededConstellationLayoutInput,
): ProjectConstellationLayoutDiagnostic[] {
  const diagnostics: ProjectConstellationLayoutDiagnostic[] = [];
  const tensionNodes = layout.node_positions.filter(
    (node) => node.node_kind === "tension",
  );
  const gapNodes = layout.node_positions.filter(
    (node) => node.node_kind === "knowledge_gap",
  );
  if (input.requested_diagnostic_kinds.includes("unresolved_tension_visibility")) {
    diagnostics.push({
      diagnostic_version: diagnosticVersion,
      scope,
      diagnostic_id: `diagnostic:tension-visibility:${layout.layout_id}`,
      diagnostic_kind: "unresolved_tension_visibility",
      bounded_summary: "Tension markers are review aids only.",
      affected_node_refs: tensionNodes.map((node) => node.node_ref).sort(),
      affected_edge_refs: [],
      reason_codes: [
        "tension_ref_present",
        "tension_marker_review_aid_only",
      ],
      authority_boundary: createDiagnosticAuthorityBoundary(),
    });
  }
  if (input.requested_diagnostic_kinds.includes("knowledge_gap_visibility")) {
    diagnostics.push({
      diagnostic_version: diagnosticVersion,
      scope,
      diagnostic_id: `diagnostic:knowledge-gap-visibility:${layout.layout_id}`,
      diagnostic_kind: "knowledge_gap_visibility",
      bounded_summary: "Gap markers are review aids only.",
      affected_node_refs: gapNodes.map((node) => node.node_ref).sort(),
      affected_edge_refs: [],
      reason_codes: ["knowledge_gap_ref_present", "gap_marker_review_aid_only"],
      authority_boundary: createDiagnosticAuthorityBoundary(),
    });
  }
  return diagnostics;
}

function createDiagnosticAuthorityBoundary():
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

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}
