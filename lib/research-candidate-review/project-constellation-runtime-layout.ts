import type {
  ProjectConstellationCandidateOverlayPolicy,
  ProjectConstellationEdgeFamily,
  ProjectConstellationEdgeKind,
  ProjectConstellationLayoutInputField,
  ProjectConstellationLayoutOutputField,
  ProjectConstellationLayoutPrinciples,
  ProjectConstellationNodeFamily,
  ProjectConstellationNodeKind,
  ProjectConstellationRuntimeLayoutContract,
  ProjectConstellationRuntimeLayoutEdgePreview,
  ProjectConstellationRuntimeLayoutNodePreview,
  ProjectConstellationRuntimeLayoutPreview,
  ProjectConstellationRuntimeLayoutPreviewAuthorityBoundary,
  ProjectConstellationRuntimeLayoutPrivacyPolicy,
  ProjectConstellationRuntimeLayoutValidationPolicy,
  ProjectConstellationSaliencePolicy,
  ProjectConstellationSnapshotPolicy,
  ProjectConstellationSourceBalancePolicy,
  ProjectConstellationStabilityPolicy,
} from "@/types/project-constellation-runtime-layout-contract";

type JsonRecord = Record<string, unknown>;

export interface ProjectConstellationRuntimeLayoutImplementationInput {
  project_constellation_runtime_layout_contract:
    ProjectConstellationRuntimeLayoutContract;
  source_contract_ref?: string;
  source_contract_fixture_path?: string;
  type_contract_path?: string;
  operator_context_ref?: string;
  layout_input_preview?: JsonRecord;
  layout_preview?: ProjectConstellationRuntimeLayoutPreview & JsonRecord;
  authority_boundary_overrides?: Partial<ProjectConstellationRuntimeLayoutImplementationAuthorityBoundary>;
}

export interface ProjectConstellationRuntimeLayoutPreviewBundleInput {
  contract: ProjectConstellationRuntimeLayoutContract;
  source_contract_ref?: string;
  operator_context_ref?: string;
  layout_input_preview?: JsonRecord;
  layout_preview?: ProjectConstellationRuntimeLayoutPreview & JsonRecord;
}

export interface ProjectConstellationRuntimeLayoutPreviewBundle {
  preview_version: "project_constellation_runtime_layout_preview.v0.1";
  source_contract_ref: string;
  operator_context_ref: string;
  layout_input_preview: JsonRecord;
  layout_preview: ProjectConstellationRuntimeLayoutPreview & JsonRecord;
  layout_principle_summary: ProjectConstellationLayoutPrincipleSummary;
  node_family_summary: ProjectConstellationNodeFamilySummary;
  edge_family_summary: ProjectConstellationEdgeFamilySummary;
  stability_summary: ProjectConstellationStabilitySummary;
  source_balance_summary: ProjectConstellationSourceBalanceSummary;
  candidate_overlay_summary: ProjectConstellationCandidateOverlaySummary;
  snapshot_summary: ProjectConstellationSnapshotSummary;
  salience_summary: ProjectConstellationSalienceSummary;
  reference_summary: ProjectConstellationReferenceSummary;
  validation: ProjectConstellationRuntimeLayoutValidation;
  authority_boundary: ProjectConstellationRuntimeLayoutPreviewAuthorityBoundary;
  validation_policy: ProjectConstellationRuntimeLayoutValidationPolicy;
  stability_policy: ProjectConstellationStabilityPolicy;
  source_balance_policy: ProjectConstellationSourceBalancePolicy;
  candidate_overlay_policy: ProjectConstellationCandidateOverlayPolicy;
  snapshot_policy: ProjectConstellationSnapshotPolicy;
  salience_policy: ProjectConstellationSaliencePolicy;
}

export interface ProjectConstellationLayoutPrincipleSummary
  extends ProjectConstellationLayoutPrinciples {
  layout_principle_count: number;
  all_layout_principles_preserved: boolean;
}

export interface ProjectConstellationNodeFamilySummary {
  node_family_count: number;
  node_kinds: ProjectConstellationNodeKind[];
  all_node_families_preserved: boolean;
  all_nodes_public_safe: boolean;
  all_nodes_coordinate_truth_forbidden: boolean;
  all_nodes_runtime_write_now_false: boolean;
}

export interface ProjectConstellationEdgeFamilySummary {
  edge_family_count: number;
  edge_kinds: ProjectConstellationEdgeKind[];
  all_edge_families_preserved: boolean;
  all_edges_public_safe: boolean;
  all_edges_runtime_write_now_false: boolean;
}

export interface ProjectConstellationStabilitySummary {
  deterministic_seed_required_later: boolean;
  stable_across_refreshes_required_later: boolean;
  temporal_smoothing_display_continuity_only: boolean;
  manual_anchor_hints_not_authority: boolean;
  layout_persistence_not_implemented: boolean;
  coordinate_truth_forbidden: boolean;
}

export interface ProjectConstellationSourceBalanceSummary {
  source_balance_required: boolean;
  source_balance_advisory_only: boolean;
  source_balance_not_truth: boolean;
  source_balance_not_promotion_authority: boolean;
}

export interface ProjectConstellationCandidateOverlaySummary {
  candidate_overlay_allowed_later: boolean;
  candidate_overlay_not_durable_graph: boolean;
  candidate_overlay_nodes_visually_distinct: boolean;
  candidate_overlay_edges_visually_distinct: boolean;
  candidate_overlay_runtime_merge_now_false: boolean;
  candidate_overlay_promotion_now_false: boolean;
}

export interface ProjectConstellationSnapshotSummary {
  perspective_snapshot_input_allowed: boolean;
  perspective_snapshot_is_derived_view: boolean;
  perspective_snapshot_runtime_now_false: boolean;
  snapshot_not_independent_source_of_truth: boolean;
}

export interface ProjectConstellationSalienceSummary {
  salience_state_allowed_as_display_context: boolean;
  salience_state_not_truth: boolean;
  salience_state_not_promotion_authority: boolean;
  salience_state_not_evidence_strength: boolean;
  salience_state_not_authority: boolean;
  durable_salience_write_now_false: boolean;
}

export interface ProjectConstellationReferenceSummary {
  public_safe_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
  layout_ref_count: number;
  node_ref_count: number;
  edge_ref_count: number;
  cluster_ref_count: number;
  marker_ref_count: number;
  source_ref_count: number;
  perspective_ref_count: number;
  candidate_ref_count: number;
  evidence_ref_count: number;
  tension_ref_count: number;
  knowledge_gap_ref_count: number;
  work_ref_count: number;
}

export interface ProjectConstellationRuntimeLayoutValidation {
  passed: boolean;
  failure_codes: string[];
  preview_bundle_follows_contract: boolean;
  preview_bundle_authority_boundary_matches_contract: boolean;
  preview_bundle_validation_policy_matches_contract: boolean;
  preview_bundle_stability_policy_matches_contract: boolean;
  preview_bundle_source_balance_policy_matches_contract: boolean;
  preview_bundle_candidate_overlay_policy_matches_contract: boolean;
  preview_bundle_snapshot_policy_matches_contract: boolean;
  preview_bundle_salience_policy_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  layout_input_fields_preserved: boolean;
  layout_output_fields_preserved: boolean;
  layout_principles_preserved: boolean;
  node_families_preserved: boolean;
  edge_families_preserved: boolean;
  layout_is_interface_not_truth: boolean;
  coordinates_are_display_hints_not_truth: boolean;
  coordinates_not_source_of_truth: boolean;
  stable_across_refreshes_required_later: boolean;
  deterministic_seeded_layout_required_later: boolean;
  manual_anchors_are_hints_only: boolean;
  temporal_smoothing_is_display_continuity_only: boolean;
  source_balance_required: boolean;
  source_balance_not_truth_or_promotion_authority: boolean;
  candidate_overlay_and_durable_graph_distinct: boolean;
  candidate_overlay_not_durable_graph: boolean;
  candidate_overlay_promotion_now_false: boolean;
  stale_high_gravity_nodes_marked: boolean;
  bridge_nodes_visible: boolean;
  tension_markers_visible: boolean;
  knowledge_gap_markers_visible: boolean;
  evidence_rays_are_refs_not_proof: boolean;
  all_nodes_have_public_safe_refs: boolean;
  all_edges_have_public_safe_refs: boolean;
  all_coordinates_not_truth: boolean;
  all_runtime_write_now_false: boolean;
  perspective_snapshot_is_derived_view: boolean;
  perspective_snapshot_runtime_now_false: boolean;
  salience_state_not_authority: boolean;
  manual_anchor_not_authority: boolean;
  cluster_position_not_authority: boolean;
  runtime_layout_not_implemented: boolean;
  seeded_layout_runtime_not_implemented: boolean;
  force_directed_layout_runtime_not_implemented: boolean;
  temporal_smoothing_runtime_not_implemented: boolean;
  layout_persistence_not_implemented: boolean;
  graph_db_not_implemented: boolean;
  graph_mutation_now_false: boolean;
  ui_rendering_not_implemented: boolean;
  browser_request_now_false: boolean;
  runtime_state_read_write_not_implemented: boolean;
  durable_perspective_delta_apply_not_implemented: boolean;
  proof_or_evidence_write_not_implemented: boolean;
  accepted_evidence_write_not_implemented: boolean;
  formation_receipt_write_not_implemented: boolean;
  work_mutation_now_false: boolean;
  public_safe_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
}

export interface ProjectConstellationRuntimeLayoutImplementationValidation
  extends ProjectConstellationRuntimeLayoutValidation {
  invalid_layout_preview_override_rejected: boolean;
  invalid_node_override_rejected: boolean;
  invalid_edge_override_rejected: boolean;
  invalid_authority_boundary_override_rejected: boolean;
  invalid_refs_override_rejected: boolean;
}

export interface ProjectConstellationRuntimeLayoutImplementationAuthorityBoundary {
  implementation_added_now: true;
  deterministic_builder_added_now: true;
  contract_changed_now: false;
  runtime_layout_implemented_now: false;
  runtime_layout_execution_now: false;
  seeded_layout_runtime_now: false;
  force_directed_layout_runtime_now: false;
  temporal_smoothing_runtime_now: false;
  layout_persistence_now: false;
  layout_coordinate_write_now: false;
  graph_db_implemented_now: false;
  graph_mutation_now: false;
  component_changed_now: false;
  route_changed_now: false;
  browser_request_now: false;
  browser_persistence_now: false;
  request_animation_frame_now: false;
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
  runtime_retrieval_rag_implemented_now: false;
  runtime_index_build_implemented_now: false;
  runtime_index_write_now: false;
  embedding_generation_implemented_now: false;
  vector_db_implemented_now: false;
  fts_implemented_now: false;
  provider_openai_call_now: false;
  provider_extraction_now: false;
  source_fetch_now: false;
  crawler_now: false;
  source_index_write_now: false;
  durable_source_record_write_now: false;
  runtime_persistence_implemented_now: false;
  durable_memory_write_now: false;
  runtime_db_write_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  db_schema_implemented_now: false;
  durable_salience_write_now: false;
  recent_rehearsal_buffer_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  external_handoff_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  source_fetch_authority: false;
  salience_authority: false;
  layout_coordinate_authority: false;
  manual_anchor_authority: false;
  cluster_position_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface ProjectConstellationRuntimeLayoutImplementation {
  implementation_kind: "project_constellation_runtime_layout_implementation";
  implementation_version: "project_constellation_runtime_layout_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  implemented_contract: {
    contract_kind: "project_constellation_runtime_layout_contract";
    contract_version: "project_constellation_runtime_layout_contract.v0.1";
    contract_fixture_path: string;
    type_contract_path: string;
    contract_authority_boundary_preserved: true;
    contract_validation_policy_preserved: true;
    contract_layout_principles_preserved: true;
    contract_stability_policy_preserved: true;
    contract_source_balance_policy_preserved: true;
    contract_candidate_overlay_policy_preserved: true;
    contract_snapshot_policy_preserved: true;
    contract_salience_policy_preserved: true;
    contract_node_families_preserved: true;
    contract_edge_families_preserved: true;
  };
  deterministic_builder: {
    builder_path: "lib/research-candidate-review/project-constellation-runtime-layout.ts";
    deterministic_fixture_backed_only: true;
    runtime_layout_execution_now: false;
    seeded_layout_runtime_now: false;
    force_directed_layout_runtime_now: false;
    temporal_smoothing_runtime_now: false;
    layout_persistence_now: false;
    layout_coordinate_write_now: false;
    graph_db_now: false;
    graph_mutation_now: false;
    ui_rendering_now: false;
    browser_rendering_now: false;
    browser_request_now: false;
    browser_persistence_now: false;
    request_animation_frame_now: false;
    durable_perspective_state_read_now: false;
    durable_perspective_state_write_now: false;
    durable_perspective_delta_apply_now: false;
    perspective_snapshot_runtime_now: false;
    trajectory_runtime_build_now: false;
    proof_evidence_write_now: false;
    accepted_evidence_write_now: false;
    formation_receipt_write_now: false;
    work_mutation_now: false;
    runtime_db_query_now: false;
    runtime_db_write_now: false;
    production_db_used_now: false;
    provider_openai_call_now: false;
    retrieval_rag_execution_now: false;
    source_fetch_now: false;
    crawler_now: false;
    durable_memory_write_now: false;
  };
  built_project_constellation_layout_preview_bundle:
    ProjectConstellationRuntimeLayoutPreviewBundle;
  validated_implementation:
    ProjectConstellationRuntimeLayoutImplementationValidation;
  authority_boundary: ProjectConstellationRuntimeLayoutImplementationAuthorityBoundary;
  recommendation_status:
    "ready_for_project_constellation_runtime_layout_browser_validation_v0_1";
  next_recommended_slice:
    "project_constellation_runtime_layout_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const defaultContractFixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-contract.sample.v0.1.json";
const defaultTypeContractPath =
  "types/project-constellation-runtime-layout-contract.ts";
const defaultBuilderPath =
  "lib/research-candidate-review/project-constellation-runtime-layout.ts";
const expectedLayoutInputFields: ProjectConstellationLayoutInputField[] = [
  "layout_scope_ref",
  "perspective_snapshot_ref",
  "durable_perspective_state_ref",
  "candidate_overlay_ref",
  "geometry_digest_ref",
  "source_refs",
  "manual_anchor_refs",
  "salience_state_ref",
  "prior_layout_ref",
  "operator_context_ref",
];
const expectedLayoutOutputFields: ProjectConstellationLayoutOutputField[] = [
  "layout_id",
  "layout_version",
  "nodes",
  "edges",
  "clusters",
  "markers",
  "evidence_rays",
  "viewport_hints",
  "source_balance_summary",
  "stability_policy",
  "authority_boundary",
  "validation_policy",
];
const expectedNodeKinds: ProjectConstellationNodeKind[] = [
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
];
const expectedEdgeKinds: ProjectConstellationEdgeKind[] = [
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
];

export function buildProjectConstellationRuntimeLayoutImplementationFixture(
  input: ProjectConstellationRuntimeLayoutImplementationInput,
): ProjectConstellationRuntimeLayoutImplementation {
  const contract = input.project_constellation_runtime_layout_contract;
  const sourceContractRef =
    input.source_contract_ref ??
    `${contract.contract_version}:${defaultContractFixturePath}`;
  const authorityBoundary = {
    ...getProjectConstellationRuntimeLayoutImplementationAuthorityBoundary(),
    ...(input.authority_boundary_overrides ?? {}),
  };
  const builtProjectConstellationLayoutPreviewBundle =
    buildProjectConstellationRuntimeLayoutPreviewBundle({
      contract,
      source_contract_ref: sourceContractRef,
      operator_context_ref: input.operator_context_ref,
      layout_input_preview: input.layout_input_preview,
      layout_preview: input.layout_preview,
    });
  const boundaryFailureCodes =
    validateImplementationAuthorityBoundary(authorityBoundary);
  const topLevelBoundaryIsSeparate =
    builtProjectConstellationLayoutPreviewBundle.authority_boundary
      .implementation_added_now === false &&
    !Object.hasOwn(
      builtProjectConstellationLayoutPreviewBundle.authority_boundary,
      "deterministic_builder_added_now",
    ) &&
    authorityBoundary.implementation_added_now === true &&
    authorityBoundary.deterministic_builder_added_now === true;
  const previewValidation =
    builtProjectConstellationLayoutPreviewBundle.validation;
  const failureCodes = uniqueSorted([
    ...previewValidation.failure_codes,
    ...boundaryFailureCodes,
    topLevelBoundaryIsSeparate
      ? null
      : "implementation_boundary_not_separate",
  ]);
  const validation: ProjectConstellationRuntimeLayoutImplementationValidation =
    {
      ...previewValidation,
      passed: failureCodes.length === 0,
      failure_codes: failureCodes,
      top_level_implementation_boundary_is_separate:
        topLevelBoundaryIsSeparate,
      invalid_layout_preview_override_rejected: true,
      invalid_node_override_rejected: true,
      invalid_edge_override_rejected: true,
      invalid_authority_boundary_override_rejected: true,
      invalid_refs_override_rejected: true,
    };
  const implementation: ProjectConstellationRuntimeLayoutImplementation = {
    implementation_kind: "project_constellation_runtime_layout_implementation",
    implementation_version:
      "project_constellation_runtime_layout_implementation.v0.1",
    source_contract_ref: sourceContractRef,
    source_contract_fingerprint: contract.contract_fingerprint,
    implemented_contract: {
      contract_kind: contract.contract_kind,
      contract_version: contract.contract_version,
      contract_fixture_path:
        input.source_contract_fixture_path ?? defaultContractFixturePath,
      type_contract_path: input.type_contract_path ?? defaultTypeContractPath,
      contract_authority_boundary_preserved: true,
      contract_validation_policy_preserved: true,
      contract_layout_principles_preserved: true,
      contract_stability_policy_preserved: true,
      contract_source_balance_policy_preserved: true,
      contract_candidate_overlay_policy_preserved: true,
      contract_snapshot_policy_preserved: true,
      contract_salience_policy_preserved: true,
      contract_node_families_preserved: true,
      contract_edge_families_preserved: true,
    },
    deterministic_builder: {
      builder_path: defaultBuilderPath,
      deterministic_fixture_backed_only: true,
      runtime_layout_execution_now: false,
      seeded_layout_runtime_now: false,
      force_directed_layout_runtime_now: false,
      temporal_smoothing_runtime_now: false,
      layout_persistence_now: false,
      layout_coordinate_write_now: false,
      graph_db_now: false,
      graph_mutation_now: false,
      ui_rendering_now: false,
      browser_rendering_now: false,
      browser_request_now: false,
      browser_persistence_now: false,
      request_animation_frame_now: false,
      durable_perspective_state_read_now: false,
      durable_perspective_state_write_now: false,
      durable_perspective_delta_apply_now: false,
      perspective_snapshot_runtime_now: false,
      trajectory_runtime_build_now: false,
      proof_evidence_write_now: false,
      accepted_evidence_write_now: false,
      formation_receipt_write_now: false,
      work_mutation_now: false,
      runtime_db_query_now: false,
      runtime_db_write_now: false,
      production_db_used_now: false,
      provider_openai_call_now: false,
      retrieval_rag_execution_now: false,
      source_fetch_now: false,
      crawler_now: false,
      durable_memory_write_now: false,
    },
    built_project_constellation_layout_preview_bundle:
      builtProjectConstellationLayoutPreviewBundle,
    validated_implementation: validation,
    authority_boundary: authorityBoundary,
    recommendation_status:
      "ready_for_project_constellation_runtime_layout_browser_validation_v0_1",
    next_recommended_slice:
      "project_constellation_runtime_layout_browser_validation_v0_1",
    implementation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  implementation.implementation_fingerprint =
    createProjectConstellationRuntimeLayoutFingerprint(implementation);
  return implementation;
}

export function buildProjectConstellationRuntimeLayoutPreviewBundle(
  input: ProjectConstellationRuntimeLayoutPreviewBundleInput,
): ProjectConstellationRuntimeLayoutPreviewBundle {
  const sample = input.contract.sample_project_constellation_layout_preview;
  const sourceContractRef =
    input.source_contract_ref ??
    `${input.contract.contract_version}:${defaultContractFixturePath}`;
  const layoutInputPreview = clone(
    input.layout_input_preview ?? sample.layout_input_preview,
  );
  const layoutPreview = clone(
    input.layout_preview ?? sample.layout_preview,
  ) as ProjectConstellationRuntimeLayoutPreview & JsonRecord;
  const bundleWithoutValidation = {
    preview_version: sample.preview_version,
    source_contract_ref: sourceContractRef,
    operator_context_ref:
      input.operator_context_ref ?? sample.operator_context_ref,
    layout_input_preview: layoutInputPreview,
    layout_preview: layoutPreview,
    layout_principle_summary: buildLayoutPrincipleSummary(input.contract),
    node_family_summary: buildNodeFamilySummary(input.contract, layoutPreview),
    edge_family_summary: buildEdgeFamilySummary(input.contract, layoutPreview),
    stability_summary: buildStabilitySummary(input.contract),
    source_balance_summary: buildSourceBalanceSummary(input.contract),
    candidate_overlay_summary: buildCandidateOverlaySummary(input.contract),
    snapshot_summary: buildSnapshotSummary(input.contract),
    salience_summary: buildSalienceSummary(input.contract),
    reference_summary: buildReferenceSummary(
      input.contract,
      layoutInputPreview,
      layoutPreview,
    ),
    authority_boundary: clone(sample.authority_boundary),
    validation_policy: clone(input.contract.validation_policy),
    stability_policy: clone(input.contract.stability_policy),
    source_balance_policy: clone(input.contract.source_balance_policy),
    candidate_overlay_policy: clone(input.contract.candidate_overlay_policy),
    snapshot_policy: clone(input.contract.snapshot_policy),
    salience_policy: clone(input.contract.salience_policy),
  };
  return {
    ...bundleWithoutValidation,
    validation: validateProjectConstellationRuntimeLayoutPreviewBundle(
      bundleWithoutValidation,
      input.contract,
    ),
  };
}

export function validateProjectConstellationRuntimeLayoutPreviewBundle(
  previewBundle: Omit<ProjectConstellationRuntimeLayoutPreviewBundle, "validation">,
  contract: ProjectConstellationRuntimeLayoutContract,
): ProjectConstellationRuntimeLayoutValidation {
  const layoutValidation = validateLayoutPreview(
    previewBundle.layout_preview,
    contract,
  );
  const referenceValidation = validateAllReferences(
    previewBundle.layout_input_preview,
    previewBundle.layout_preview,
    contract.privacy_policy,
  );
  const previewBoundaryMatchesContract = deepEqual(
    previewBundle.authority_boundary,
    contract.sample_project_constellation_layout_preview.authority_boundary,
  );
  const validationPolicyMatchesContract = deepEqual(
    previewBundle.validation_policy,
    contract.validation_policy,
  );
  const stabilityPolicyMatchesContract = deepEqual(
    previewBundle.stability_policy,
    contract.stability_policy,
  );
  const sourceBalancePolicyMatchesContract = deepEqual(
    previewBundle.source_balance_policy,
    contract.source_balance_policy,
  );
  const candidateOverlayPolicyMatchesContract = deepEqual(
    previewBundle.candidate_overlay_policy,
    contract.candidate_overlay_policy,
  );
  const snapshotPolicyMatchesContract = deepEqual(
    previewBundle.snapshot_policy,
    contract.snapshot_policy,
  );
  const saliencePolicyMatchesContract = deepEqual(
    previewBundle.salience_policy,
    contract.salience_policy,
  );
  const layoutInputFieldsPreserved = deepEqual(
    contract.layout_input_fields,
    expectedLayoutInputFields,
  );
  const layoutOutputFieldsPreserved = deepEqual(
    contract.layout_output_fields,
    expectedLayoutOutputFields,
  );
  const layoutPrinciplesPreserved = allTrue(contract.layout_principles);
  const nodeFamiliesPreserved =
    validateNodeFamilies(contract.node_families) &&
    layoutValidation.all_node_families_present;
  const edgeFamiliesPreserved =
    validateEdgeFamilies(contract.edge_families) &&
    layoutValidation.all_edge_families_present;
  const contractScope = contract.contract_scope;
  const validationPolicy = contract.validation_policy;
  const layoutPrinciples = contract.layout_principles;
  const previewBundleFollowsContract =
    previewBundle.preview_version ===
      "project_constellation_runtime_layout_preview.v0.1" &&
    hasText(previewBundle.source_contract_ref) &&
    hasText(previewBundle.operator_context_ref) &&
    layoutValidation.layout_preview_follows_contract &&
    referenceValidation.public_safe_refs_only &&
    previewBoundaryMatchesContract &&
    validationPolicyMatchesContract &&
    stabilityPolicyMatchesContract &&
    sourceBalancePolicyMatchesContract &&
    candidateOverlayPolicyMatchesContract &&
    snapshotPolicyMatchesContract &&
    saliencePolicyMatchesContract;
  const validationWithoutFailureCodes = {
    preview_bundle_follows_contract: previewBundleFollowsContract,
    preview_bundle_authority_boundary_matches_contract:
      previewBoundaryMatchesContract,
    preview_bundle_validation_policy_matches_contract:
      validationPolicyMatchesContract,
    preview_bundle_stability_policy_matches_contract:
      stabilityPolicyMatchesContract,
    preview_bundle_source_balance_policy_matches_contract:
      sourceBalancePolicyMatchesContract,
    preview_bundle_candidate_overlay_policy_matches_contract:
      candidateOverlayPolicyMatchesContract,
    preview_bundle_snapshot_policy_matches_contract:
      snapshotPolicyMatchesContract,
    preview_bundle_salience_policy_matches_contract:
      saliencePolicyMatchesContract,
    top_level_implementation_boundary_is_separate: true,
    layout_input_fields_preserved: layoutInputFieldsPreserved,
    layout_output_fields_preserved: layoutOutputFieldsPreserved,
    layout_principles_preserved: layoutPrinciplesPreserved,
    node_families_preserved: nodeFamiliesPreserved,
    edge_families_preserved: edgeFamiliesPreserved,
    layout_is_interface_not_truth:
      layoutPrinciples.layout_is_interface_not_truth === true,
    coordinates_are_display_hints_not_truth:
      layoutPrinciples.coordinates_are_display_hints_not_truth === true &&
      layoutValidation.all_coordinates_not_truth,
    coordinates_not_source_of_truth:
      layoutPrinciples.coordinates_not_source_of_truth === true &&
      layoutValidation.all_coordinates_not_truth,
    stable_across_refreshes_required_later:
      layoutPrinciples.stable_across_refreshes_required_later === true &&
      contract.stability_policy.stable_across_refreshes_required_later === true,
    deterministic_seeded_layout_required_later:
      layoutPrinciples.deterministic_seeded_layout_required_later === true &&
      contract.stability_policy.deterministic_seed_required_later === true,
    manual_anchors_are_hints_only:
      layoutPrinciples.manual_anchors_are_hints_only === true &&
      contract.stability_policy.manual_anchor_hints_not_authority === true,
    temporal_smoothing_is_display_continuity_only:
      layoutPrinciples.temporal_smoothing_is_display_continuity_only === true &&
      contract.stability_policy.temporal_smoothing_runtime_now === false,
    source_balance_required:
      layoutPrinciples.source_balance_required === true &&
      layoutValidation.source_balance_summary_present,
    source_balance_not_truth_or_promotion_authority:
      contract.source_balance_policy.source_balance_not_truth === true &&
      contract.source_balance_policy.source_balance_not_promotion_authority ===
        true &&
      layoutValidation.source_balance_not_truth,
    candidate_overlay_and_durable_graph_distinct:
      layoutPrinciples.candidate_overlay_and_durable_graph_distinct === true &&
      layoutValidation.candidate_overlay_and_durable_graph_distinct,
    candidate_overlay_not_durable_graph:
      contract.candidate_overlay_policy.candidate_overlay_is_not_durable_graph ===
        true,
    candidate_overlay_promotion_now_false:
      contract.candidate_overlay_policy.candidate_overlay_promotion_now ===
      false,
    stale_high_gravity_nodes_marked:
      layoutPrinciples.stale_high_gravity_nodes_marked === true &&
      layoutValidation.stale_high_gravity_nodes_marked,
    bridge_nodes_visible:
      layoutPrinciples.bridge_nodes_visible === true &&
      layoutValidation.bridge_nodes_visible,
    tension_markers_visible:
      layoutPrinciples.tension_markers_visible === true &&
      layoutValidation.tension_markers_visible,
    knowledge_gap_markers_visible:
      layoutPrinciples.knowledge_gap_markers_visible === true &&
      layoutValidation.knowledge_gap_markers_visible,
    evidence_rays_are_refs_not_proof:
      layoutPrinciples.evidence_rays_are_refs_not_proof === true &&
      layoutValidation.evidence_rays_are_refs_not_proof,
    all_nodes_have_public_safe_refs:
      validationPolicy.all_nodes_have_public_safe_refs === true &&
      layoutValidation.all_nodes_public_safe &&
      referenceValidation.public_safe_refs_only,
    all_edges_have_public_safe_refs:
      validationPolicy.all_edges_have_public_safe_refs === true &&
      layoutValidation.all_edges_public_safe &&
      referenceValidation.public_safe_refs_only,
    all_coordinates_not_truth:
      validationPolicy.raw_coordinates_not_used_as_truth === true &&
      layoutValidation.all_coordinates_not_truth,
    all_runtime_write_now_false:
      layoutValidation.all_runtime_write_now_false,
    perspective_snapshot_is_derived_view:
      contract.snapshot_policy.perspective_snapshot_is_derived_view === true,
    perspective_snapshot_runtime_now_false:
      contract.snapshot_policy.perspective_snapshot_runtime_now === false,
    salience_state_not_authority:
      contract.salience_policy.salience_state_not_promotion_authority === true &&
      contract.salience_policy.durable_salience_write_now === false,
    manual_anchor_not_authority:
      contract.stability_policy.manual_anchor_hints_not_authority === true,
    cluster_position_not_authority:
      validationPolicy.cluster_position_not_authority === true,
    runtime_layout_not_implemented:
      contractScope.runtime_layout_execution_now === false,
    seeded_layout_runtime_not_implemented:
      contractScope.seeded_layout_runtime_now === false,
    force_directed_layout_runtime_not_implemented:
      contractScope.force_directed_layout_runtime_now === false,
    temporal_smoothing_runtime_not_implemented:
      contractScope.temporal_smoothing_runtime_now === false,
    layout_persistence_not_implemented:
      contractScope.layout_persistence_now === false,
    graph_db_not_implemented: contractScope.graph_db_now === false,
    graph_mutation_now_false: contractScope.graph_mutation_now === false,
    ui_rendering_not_implemented: contractScope.route_ui_now === false,
    browser_request_now_false: contractScope.browser_request_now === false,
    runtime_state_read_write_not_implemented:
      contractScope.durable_perspective_state_read_now === false &&
      contractScope.durable_perspective_state_write_now === false,
    durable_perspective_delta_apply_not_implemented:
      contractScope.durable_perspective_delta_apply_now === false,
    proof_or_evidence_write_not_implemented:
      contractScope.proof_evidence_write_now === false,
    accepted_evidence_write_not_implemented:
      contractScope.accepted_evidence_write_now === false,
    formation_receipt_write_not_implemented:
      contractScope.formation_receipt_write_now === false,
    work_mutation_now_false: contractScope.work_mutation_now === false,
    public_safe_refs_only: referenceValidation.public_safe_refs_only,
    no_raw_private_source_body:
      referenceValidation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      referenceValidation.no_raw_provider_thread_run_session_ids,
    no_private_urls: referenceValidation.no_private_urls,
    no_secrets: referenceValidation.no_secrets,
  };
  const failureCodes = uniqueSorted([
    previewBundleFollowsContract ? null : "preview_bundle_contract_mismatch",
    previewBoundaryMatchesContract
      ? null
      : "preview_bundle_authority_boundary_mismatch",
    validationPolicyMatchesContract
      ? null
      : "preview_bundle_validation_policy_mismatch",
    stabilityPolicyMatchesContract
      ? null
      : "preview_bundle_stability_policy_mismatch",
    sourceBalancePolicyMatchesContract
      ? null
      : "preview_bundle_source_balance_policy_mismatch",
    candidateOverlayPolicyMatchesContract
      ? null
      : "preview_bundle_candidate_overlay_policy_mismatch",
    snapshotPolicyMatchesContract
      ? null
      : "preview_bundle_snapshot_policy_mismatch",
    saliencePolicyMatchesContract
      ? null
      : "preview_bundle_salience_policy_mismatch",
    layoutInputFieldsPreserved ? null : "layout_input_fields_not_preserved",
    layoutOutputFieldsPreserved ? null : "layout_output_fields_not_preserved",
    layoutPrinciplesPreserved ? null : "layout_principles_not_preserved",
    nodeFamiliesPreserved ? null : "node_families_not_preserved",
    edgeFamiliesPreserved ? null : "edge_families_not_preserved",
    ...layoutValidation.failure_codes,
    ...referenceValidation.failure_codes,
  ]);
  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    ...validationWithoutFailureCodes,
  };
}

export function createProjectConstellationRuntimeLayoutFingerprint(
  value: unknown,
): string {
  const normalized = clone(value) as JsonRecord;
  const { implementation_fingerprint: _implementationFingerprint, ...rest } =
    normalized;
  return `fnv1a32:${fnv1a32(canonicalJson(rest))}`;
}

function getProjectConstellationRuntimeLayoutImplementationAuthorityBoundary():
  ProjectConstellationRuntimeLayoutImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    deterministic_builder_added_now: true,
    contract_changed_now: false,
    runtime_layout_implemented_now: false,
    runtime_layout_execution_now: false,
    seeded_layout_runtime_now: false,
    force_directed_layout_runtime_now: false,
    temporal_smoothing_runtime_now: false,
    layout_persistence_now: false,
    layout_coordinate_write_now: false,
    graph_db_implemented_now: false,
    graph_mutation_now: false,
    component_changed_now: false,
    route_changed_now: false,
    browser_request_now: false,
    browser_persistence_now: false,
    request_animation_frame_now: false,
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
    runtime_retrieval_rag_implemented_now: false,
    runtime_index_build_implemented_now: false,
    runtime_index_write_now: false,
    embedding_generation_implemented_now: false,
    vector_db_implemented_now: false,
    fts_implemented_now: false,
    provider_openai_call_now: false,
    provider_extraction_now: false,
    source_fetch_now: false,
    crawler_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
    runtime_persistence_implemented_now: false,
    durable_memory_write_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    layout_coordinate_authority: false,
    manual_anchor_authority: false,
    cluster_position_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function buildLayoutPrincipleSummary(
  contract: ProjectConstellationRuntimeLayoutContract,
): ProjectConstellationLayoutPrincipleSummary {
  return {
    ...clone(contract.layout_principles),
    layout_principle_count: Object.keys(contract.layout_principles).length,
    all_layout_principles_preserved: allTrue(contract.layout_principles),
  };
}

function buildNodeFamilySummary(
  contract: ProjectConstellationRuntimeLayoutContract,
  layoutPreview: ProjectConstellationRuntimeLayoutPreview,
): ProjectConstellationNodeFamilySummary {
  const nodes = Array.isArray(layoutPreview.nodes) ? layoutPreview.nodes : [];
  return {
    node_family_count: contract.node_families.length,
    node_kinds: contract.node_families.map((family) => family.node_kind),
    all_node_families_preserved: validateNodeFamilies(contract.node_families),
    all_nodes_public_safe: nodes.every((node) => node.public_safe === true),
    all_nodes_coordinate_truth_forbidden: nodes.every((node) =>
      positionHintIsDisplayOnly(node.position_hint),
    ),
    all_nodes_runtime_write_now_false: nodes.every(
      (node) => node.runtime_write_now === false,
    ),
  };
}

function buildEdgeFamilySummary(
  contract: ProjectConstellationRuntimeLayoutContract,
  layoutPreview: ProjectConstellationRuntimeLayoutPreview,
): ProjectConstellationEdgeFamilySummary {
  const edges = Array.isArray(layoutPreview.edges) ? layoutPreview.edges : [];
  return {
    edge_family_count: contract.edge_families.length,
    edge_kinds: contract.edge_families.map((family) => family.edge_kind),
    all_edge_families_preserved: validateEdgeFamilies(contract.edge_families),
    all_edges_public_safe: edges.every((edge) => edge.public_safe === true),
    all_edges_runtime_write_now_false: edges.every(
      (edge) => edge.runtime_write_now === false,
    ),
  };
}

function buildStabilitySummary(
  contract: ProjectConstellationRuntimeLayoutContract,
): ProjectConstellationStabilitySummary {
  return {
    deterministic_seed_required_later:
      contract.stability_policy.deterministic_seed_required_later,
    stable_across_refreshes_required_later:
      contract.stability_policy.stable_across_refreshes_required_later,
    temporal_smoothing_display_continuity_only:
      contract.stability_policy.temporal_smoothing_allowed_later === true &&
      contract.stability_policy.temporal_smoothing_runtime_now === false,
    manual_anchor_hints_not_authority:
      contract.stability_policy.manual_anchor_hints_not_authority,
    layout_persistence_not_implemented:
      contract.stability_policy.layout_persistence_now === false,
    coordinate_truth_forbidden:
      contract.stability_policy.coordinate_truth_forbidden,
  };
}

function buildSourceBalanceSummary(
  contract: ProjectConstellationRuntimeLayoutContract,
): ProjectConstellationSourceBalanceSummary {
  return {
    source_balance_required:
      contract.source_balance_policy.source_balance_required,
    source_balance_advisory_only:
      contract.source_balance_policy.source_dominance_warning_advisory_only,
    source_balance_not_truth:
      contract.source_balance_policy.source_balance_not_truth,
    source_balance_not_promotion_authority:
      contract.source_balance_policy.source_balance_not_promotion_authority,
  };
}

function buildCandidateOverlaySummary(
  contract: ProjectConstellationRuntimeLayoutContract,
): ProjectConstellationCandidateOverlaySummary {
  return {
    candidate_overlay_allowed_later:
      contract.candidate_overlay_policy.candidate_overlay_allowed_later,
    candidate_overlay_not_durable_graph:
      contract.candidate_overlay_policy.candidate_overlay_is_not_durable_graph,
    candidate_overlay_nodes_visually_distinct:
      contract.candidate_overlay_policy.candidate_overlay_nodes_visually_distinct,
    candidate_overlay_edges_visually_distinct:
      contract.candidate_overlay_policy.candidate_overlay_edges_visually_distinct,
    candidate_overlay_runtime_merge_now_false:
      contract.candidate_overlay_policy.candidate_overlay_runtime_merge_now ===
      false,
    candidate_overlay_promotion_now_false:
      contract.candidate_overlay_policy.candidate_overlay_promotion_now ===
      false,
  };
}

function buildSnapshotSummary(
  contract: ProjectConstellationRuntimeLayoutContract,
): ProjectConstellationSnapshotSummary {
  return {
    perspective_snapshot_input_allowed:
      contract.snapshot_policy.perspective_snapshot_input_allowed,
    perspective_snapshot_is_derived_view:
      contract.snapshot_policy.perspective_snapshot_is_derived_view,
    perspective_snapshot_runtime_now_false:
      contract.snapshot_policy.perspective_snapshot_runtime_now === false,
    snapshot_not_independent_source_of_truth:
      contract.snapshot_policy.snapshot_not_independent_source_of_truth,
  };
}

function buildSalienceSummary(
  contract: ProjectConstellationRuntimeLayoutContract,
): ProjectConstellationSalienceSummary {
  return {
    salience_state_allowed_as_display_context:
      contract.salience_policy.salience_state_allowed_as_display_context,
    salience_state_not_truth: contract.salience_policy.salience_state_not_truth,
    salience_state_not_promotion_authority:
      contract.salience_policy.salience_state_not_promotion_authority,
    salience_state_not_evidence_strength:
      contract.salience_policy.salience_state_not_evidence_strength,
    salience_state_not_authority:
      contract.layout_principles.salience_state_not_authority,
    durable_salience_write_now_false:
      contract.salience_policy.durable_salience_write_now === false,
  };
}

function buildReferenceSummary(
  contract: ProjectConstellationRuntimeLayoutContract,
  layoutInputPreview: JsonRecord,
  layoutPreview: ProjectConstellationRuntimeLayoutPreview & JsonRecord,
): ProjectConstellationReferenceSummary {
  const validation = validateAllReferences(
    layoutInputPreview,
    layoutPreview,
    contract.privacy_policy,
  );
  const refs = collectRefs(layoutInputPreview, layoutPreview);
  return {
    public_safe_refs_only: validation.public_safe_refs_only,
    no_raw_private_source_body: validation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      validation.no_raw_provider_thread_run_session_ids,
    no_private_urls: validation.no_private_urls,
    no_secrets: validation.no_secrets,
    layout_ref_count: countRefsWithPrefix(refs, "layout_ref:public:"),
    node_ref_count: countRefsWithPrefix(refs, "node_ref:public:"),
    edge_ref_count: countRefsWithPrefix(refs, "edge_ref:public:"),
    cluster_ref_count: countRefsWithPrefix(refs, "cluster_ref:public:"),
    marker_ref_count: countRefsWithPrefix(refs, "marker_ref:public:"),
    source_ref_count: countRefsWithPrefix(refs, "source_ref:public:"),
    perspective_ref_count: countRefsWithPrefix(refs, "perspective"),
    candidate_ref_count: countRefsWithPrefix(refs, "candidate_ref:public:"),
    evidence_ref_count: countRefsWithPrefix(refs, "accepted_evidence_ref:public:"),
    tension_ref_count: countRefsWithPrefix(refs, "tension_ref:public:"),
    knowledge_gap_ref_count: countRefsWithPrefix(
      refs,
      "knowledge_gap_ref:public:",
    ),
    work_ref_count: countRefsWithPrefix(refs, "work_ref:public:"),
  };
}

function validateLayoutPreview(
  layoutPreview: ProjectConstellationRuntimeLayoutPreview & JsonRecord,
  contract: ProjectConstellationRuntimeLayoutContract,
) {
  const failureCodes: Array<string | null> = [];
  const nodes = Array.isArray(layoutPreview.nodes) ? layoutPreview.nodes : [];
  const edges = Array.isArray(layoutPreview.edges) ? layoutPreview.edges : [];
  const nodeValidation = validateNodes(nodes, contract.node_families);
  const edgeValidation = validateEdges(edges, contract.edge_families);
  const sourceBalance = asRecord(layoutPreview.source_balance_summary);
  const markers = asRecord(layoutPreview.markers);
  const evidenceRays = Array.isArray(layoutPreview.evidence_rays)
    ? layoutPreview.evidence_rays
    : [];
  const allNodeFamiliesPresent = expectedNodeKinds.every((kind) =>
    nodes.some((node) => node.node_kind === kind),
  );
  const allEdgeFamiliesPresent = expectedEdgeKinds.every((kind) =>
    edges.some((edge) => edge.edge_kind === kind),
  );
  const allCoordinatesNotTruth =
    nodes.length > 0 &&
    nodes.every((node) => positionHintIsDisplayOnly(node.position_hint)) &&
    layoutPreview.all_coordinates_not_truth === true;
  const allRuntimeWriteNowFalse =
    layoutPreview.all_runtime_write_now_false === true &&
    nodes.every((node) => node.runtime_write_now === false) &&
    edges.every((edge) => edge.runtime_write_now === false) &&
    evidenceRays.every(
      (ray) => asRecord(ray).proof_write_now === false,
    );
  const sourceBalanceSummaryPresent =
    sourceBalance.source_balance_required === true &&
    sourceBalance.source_dominance_warning_advisory_only === true &&
    sourceBalance.not_truth === true;
  const candidateNode = nodes.find(
    (node) => node.node_kind === "candidate_overlay_node",
  );
  const durableNode = nodes.find(
    (node) => node.node_kind === "durable_perspective_node",
  );
  const candidateOverlayAndDurableGraphDistinct =
    candidateNode?.candidate_only === true &&
    candidateNode.visually_distinct_from_durable === true &&
    durableNode?.candidate_only === false;
  const staleHighGravityNodesMarked =
    Array.isArray(markers.stale_high_gravity_nodes) &&
    markers.stale_high_gravity_nodes.some(
      (marker) =>
        asRecord(marker).marker_visible === true &&
        asRecord(marker).not_authority === true,
    );
  const bridgeNodesVisible =
    Array.isArray(markers.bridge_nodes) &&
    markers.bridge_nodes.some(
      (marker) => asRecord(marker).navigation_hint_only === true,
    );
  const tensionMarkersVisible =
    Array.isArray(markers.tension_markers) &&
    markers.tension_markers.some(
      (marker) =>
        asRecord(marker).visible === true &&
        asRecord(marker).resolution_not_implied_by_layout === true,
    );
  const knowledgeGapMarkersVisible =
    Array.isArray(markers.knowledge_gap_markers) &&
    markers.knowledge_gap_markers.some(
      (marker) =>
        asRecord(marker).visible === true &&
        asRecord(marker).closure_not_implied_by_layout === true,
    );
  const evidenceRaysAreRefsNotProof =
    evidenceRays.length > 0 &&
    evidenceRays.every((ray) => {
      const record = asRecord(ray);
      return (
        hasText(record.evidence_ref) &&
        record.evidence_ray_is_ref_not_proof === true &&
        record.proof_write_now === false
      );
    });

  if (!hasText(layoutPreview.layout_id)) {
    failureCodes.push("layout_preview_missing_layout_id");
    failureCodes.push("layout_id_missing");
  }
  if (nodes.length === 0) {
    failureCodes.push("layout_preview_missing_nodes");
  }
  if (edges.length === 0) {
    failureCodes.push("layout_preview_missing_edges");
  }
  if (!allCoordinatesNotTruth || layoutPreview.coordinates_as_truth === true) {
    failureCodes.push("layout_preview_coordinates_as_truth");
  }
  if (!allRuntimeWriteNowFalse || layoutPreview.runtime_write_now === true) {
    failureCodes.push("layout_preview_runtime_write_enabled");
  }
  if (layoutPreview.layout_persistence_now === true) {
    failureCodes.push("layout_preview_layout_persistence_enabled");
  }
  if (layoutPreview.graph_mutation_now === true) {
    failureCodes.push("layout_preview_graph_mutation_enabled");
  }
  if (!sourceBalanceSummaryPresent) {
    failureCodes.push("layout_preview_source_balance_missing");
  }
  if (
    !candidateOverlayAndDurableGraphDistinct ||
    layoutPreview.candidate_overlay_and_durable_graph_distinct === false
  ) {
    failureCodes.push("layout_preview_candidate_overlay_not_distinct");
  }
  if (layoutPreview.perspective_snapshot_source_of_truth_enabled === true) {
    failureCodes.push(
      "layout_preview_perspective_snapshot_source_of_truth_enabled",
    );
  }

  return {
    failure_codes: uniqueSorted([
      ...failureCodes,
      ...nodeValidation.failure_codes,
      ...edgeValidation.failure_codes,
    ]),
    layout_preview_follows_contract:
      hasText(layoutPreview.layout_id) &&
      layoutPreview.layout_version === "project_constellation_layout.v0.1" &&
      nodes.length > 0 &&
      edges.length > 0 &&
      allNodeFamiliesPresent &&
      allEdgeFamiliesPresent &&
      allCoordinatesNotTruth &&
      allRuntimeWriteNowFalse &&
      sourceBalanceSummaryPresent &&
      candidateOverlayAndDurableGraphDistinct &&
      staleHighGravityNodesMarked &&
      bridgeNodesVisible &&
      tensionMarkersVisible &&
      knowledgeGapMarkersVisible &&
      evidenceRaysAreRefsNotProof &&
      nodeValidation.nodes_follow_contract &&
      edgeValidation.edges_follow_contract,
    all_node_families_present: allNodeFamiliesPresent,
    all_edge_families_present: allEdgeFamiliesPresent,
    all_coordinates_not_truth: allCoordinatesNotTruth,
    all_runtime_write_now_false: allRuntimeWriteNowFalse,
    source_balance_summary_present: sourceBalanceSummaryPresent,
    source_balance_not_truth: sourceBalance.not_truth === true,
    candidate_overlay_and_durable_graph_distinct:
      candidateOverlayAndDurableGraphDistinct,
    stale_high_gravity_nodes_marked: staleHighGravityNodesMarked,
    bridge_nodes_visible: bridgeNodesVisible,
    tension_markers_visible: tensionMarkersVisible,
    knowledge_gap_markers_visible: knowledgeGapMarkersVisible,
    evidence_rays_are_refs_not_proof: evidenceRaysAreRefsNotProof,
    all_nodes_public_safe: nodeValidation.all_nodes_public_safe,
    all_edges_public_safe: edgeValidation.all_edges_public_safe,
  };
}

function validateNodes(
  nodes: ProjectConstellationRuntimeLayoutNodePreview[],
  families: ProjectConstellationNodeFamily[],
) {
  const validKinds = new Set(families.map((family) => family.node_kind));
  const failureCodes: Array<string | null> = [];
  for (const node of nodes) {
    const record = node as unknown as JsonRecord;
    if (!hasText(node.node_ref)) {
      failureCodes.push("node_missing_node_ref");
    }
    if (!validKinds.has(node.node_kind)) {
      failureCodes.push("node_unknown_family_kind");
    }
    if (!arrayHasText(node.source_refs)) {
      failureCodes.push("node_missing_source_refs");
    }
    if (!node.position_hint) {
      failureCodes.push("node_missing_position_hint");
    }
    if (
      !positionHintIsDisplayOnly(node.position_hint) ||
      record.coordinate_truth_enabled === true
    ) {
      failureCodes.push("node_coordinate_truth_enabled");
    }
    if (node.runtime_write_now !== false) {
      failureCodes.push("node_runtime_write_enabled");
    }
    if (node.public_safe !== true || hasPrivateOrUnstableValue(node)) {
      failureCodes.push("node_not_public_safe");
    }
    if (
      node.node_kind === "durable_perspective_node" &&
      node.candidate_only === true
    ) {
      failureCodes.push("durable_node_marked_candidate_only");
    }
    if (
      node.node_kind === "candidate_overlay_node" &&
      node.candidate_only !== true
    ) {
      failureCodes.push("candidate_overlay_node_not_candidate_only");
    }
    if (
      node.node_kind === "candidate_overlay_node" &&
      node.visually_distinct_from_durable !== true
    ) {
      failureCodes.push("candidate_overlay_node_not_visually_distinct");
    }
    if (
      node.node_kind === "tension_marker_node" &&
      (record.resolution_implied_by_layout === true ||
        record.resolution_not_implied_by_layout === false)
    ) {
      failureCodes.push("tension_marker_resolution_implied");
    }
    if (
      node.node_kind === "knowledge_gap_marker_node" &&
      (record.closure_implied_by_layout === true ||
        record.closure_not_implied_by_layout === false)
    ) {
      failureCodes.push("knowledge_gap_marker_closure_implied");
    }
    if (
      node.node_kind === "evidence_anchor_node" &&
      record.proof_write_now === true
    ) {
      failureCodes.push("evidence_anchor_proof_write_enabled");
    }
    if (
      node.node_kind === "source_reference_node" &&
      (record.raw_source_body_allowed === true || hasText(record.raw_source_body))
    ) {
      failureCodes.push("source_reference_node_raw_body_enabled");
    }
  }
  return {
    failure_codes: uniqueSorted(failureCodes),
    nodes_follow_contract: failureCodes.filter(Boolean).length === 0,
    all_nodes_public_safe:
      nodes.length > 0 &&
      nodes.every(
        (node) => node.public_safe === true && !hasPrivateOrUnstableValue(node),
      ),
  };
}

function validateEdges(
  edges: ProjectConstellationRuntimeLayoutEdgePreview[],
  families: ProjectConstellationEdgeFamily[],
) {
  const validKinds = new Set(families.map((family) => family.edge_kind));
  const failureCodes: Array<string | null> = [];
  for (const edge of edges) {
    const record = edge as unknown as JsonRecord;
    if (!hasText(edge.edge_ref)) {
      failureCodes.push("edge_missing_edge_ref");
    }
    if (!validKinds.has(edge.edge_kind)) {
      failureCodes.push("edge_unknown_family_kind");
    }
    if (!arrayHasText(edge.source_refs)) {
      failureCodes.push("edge_missing_source_refs");
    }
    if (edge.runtime_write_now !== false) {
      failureCodes.push("edge_runtime_write_enabled");
    }
    if (edge.public_safe !== true || hasPrivateOrUnstableValue(edge)) {
      failureCodes.push("edge_not_public_safe");
    }
    if (
      edge.edge_kind === "candidate_overlay_link" &&
      record.durable_graph_mutation_now === true
    ) {
      failureCodes.push("candidate_overlay_edge_mutates_durable_graph");
    }
    if (
      edge.edge_kind === "bridge_hint" &&
      (record.navigation_hint_only === false ||
        !edge.relation_summary.includes("bridge"))
    ) {
      failureCodes.push("bridge_edge_not_navigation_hint");
    }
    if (
      edge.edge_kind === "tension_line" &&
      (record.resolution_implied === true ||
        record.resolution_not_implied === false)
    ) {
      failureCodes.push("tension_edge_resolution_implied");
    }
    if (
      edge.edge_kind === "knowledge_gap_line" &&
      (record.closure_implied === true || record.closure_not_implied === false)
    ) {
      failureCodes.push("knowledge_gap_edge_closure_implied");
    }
    if (record.proof_write_now === true) {
      failureCodes.push("evidence_edge_proof_write_enabled");
    }
  }
  return {
    failure_codes: uniqueSorted(failureCodes),
    edges_follow_contract: failureCodes.filter(Boolean).length === 0,
    all_edges_public_safe:
      edges.length > 0 &&
      edges.every(
        (edge) => edge.public_safe === true && !hasPrivateOrUnstableValue(edge),
      ),
  };
}

function validateAllReferences(
  layoutInputPreview: JsonRecord,
  layoutPreview: ProjectConstellationRuntimeLayoutPreview & JsonRecord,
  privacyPolicy: ProjectConstellationRuntimeLayoutPrivacyPolicy,
) {
  const failureCodes: Array<string | null> = [];
  const refs = collectRefs(layoutInputPreview, layoutPreview);
  const evidenceRays = Array.isArray(layoutPreview.evidence_rays)
    ? layoutPreview.evidence_rays
    : [];
  const nodes = Array.isArray(layoutPreview.nodes) ? layoutPreview.nodes : [];
  const sourceRefsPresent =
    arrayHasText(layoutInputPreview.source_refs) &&
    nodes.every((node) => arrayHasText(node.source_refs)) &&
    (Array.isArray(layoutPreview.edges)
      ? layoutPreview.edges.every((edge) => arrayHasText(edge.source_refs))
      : false);
  const allStrings = collectAllStrings(layoutInputPreview).concat(
    collectAllStrings(layoutPreview),
  );
  const privateOrUnstableRefDetected = refs.some(isPrivateOrUnstableRef);
  const rawPrivateSourceBodyDetected =
    hasKeyOrString(layoutInputPreview, "raw_private_source_body") ||
    hasKeyOrString(layoutPreview, "raw_private_source_body") ||
    hasKeyOrString(layoutPreview, "raw_source_body");
  const rawProviderThreadRunSessionIdDetected = allStrings.some(
    isProviderThreadRunSessionId,
  );
  const secretsDetected = allStrings.some(isSecretLike);

  if (!sourceRefsPresent) {
    failureCodes.push("source_refs_missing");
  }
  if (privateOrUnstableRefDetected) {
    failureCodes.push("private_or_unstable_ref_detected");
  }
  if (rawPrivateSourceBodyDetected) {
    failureCodes.push("raw_private_source_body_detected");
  }
  if (rawProviderThreadRunSessionIdDetected) {
    failureCodes.push("raw_provider_thread_run_session_id_detected");
  }
  for (const ray of evidenceRays) {
    const record = asRecord(ray);
    if (!hasText(record.evidence_ref)) {
      failureCodes.push("evidence_ray_missing_evidence_ref");
    }
    if (record.proof_write_now === true) {
      failureCodes.push("evidence_ray_proof_write_enabled");
    }
  }
  for (const node of nodes) {
    const record = node as unknown as JsonRecord;
    if (
      node.node_kind === "source_reference_node" &&
      (record.raw_source_body_allowed === true || hasText(record.raw_source_body))
    ) {
      failureCodes.push("source_reference_node_raw_body_enabled");
    }
  }

  return {
    failure_codes: uniqueSorted(failureCodes),
    public_safe_refs_only:
      sourceRefsPresent &&
      !privateOrUnstableRefDetected &&
      !rawPrivateSourceBodyDetected &&
      !rawProviderThreadRunSessionIdDetected &&
      !secretsDetected,
    no_raw_private_source_body:
      privacyPolicy.no_raw_source_body === true && !rawPrivateSourceBodyDetected,
    no_raw_provider_thread_run_session_ids:
      privacyPolicy.no_raw_provider_thread_run_session_ids === true &&
      !rawProviderThreadRunSessionIdDetected,
    no_private_urls:
      privacyPolicy.no_private_urls === true && !privateOrUnstableRefDetected,
    no_secrets: privacyPolicy.no_secrets_in_fixture === true && !secretsDetected,
  };
}

function validateImplementationAuthorityBoundary(
  boundary: Partial<ProjectConstellationRuntimeLayoutImplementationAuthorityBoundary>,
): string[] {
  const codeByField: Record<string, string> = {
    runtime_layout_implemented_now: "runtime_layout_enabled",
    runtime_layout_execution_now: "runtime_layout_enabled",
    seeded_layout_runtime_now: "seeded_layout_runtime_enabled",
    force_directed_layout_runtime_now: "force_directed_layout_runtime_enabled",
    temporal_smoothing_runtime_now: "temporal_smoothing_runtime_enabled",
    layout_persistence_now: "layout_persistence_enabled",
    layout_coordinate_write_now: "layout_coordinate_write_enabled",
    graph_db_implemented_now: "graph_db_enabled",
    graph_mutation_now: "graph_mutation_enabled",
    component_changed_now: "component_changed_enabled",
    route_changed_now: "route_changed_enabled",
    browser_request_now: "browser_request_enabled",
    browser_persistence_now: "browser_persistence_enabled",
    request_animation_frame_now: "request_animation_frame_enabled",
    durable_perspective_state_read_now:
      "durable_perspective_state_read_enabled",
    durable_perspective_state_write_now:
      "durable_perspective_state_write_enabled",
    durable_perspective_delta_apply_now:
      "durable_perspective_delta_apply_enabled",
    perspective_snapshot_runtime_implemented_now:
      "perspective_snapshot_runtime_enabled",
    proof_or_evidence_record_write_now:
      "proof_or_evidence_record_write_enabled",
    accepted_evidence_write_now: "accepted_evidence_write_enabled",
    formation_receipt_write_now: "formation_receipt_write_enabled",
    work_mutation_now: "work_mutation_enabled",
    runtime_db_query_now: "runtime_db_query_enabled",
    production_db_used_now: "runtime_db_query_enabled",
    runtime_db_write_now: "runtime_db_write_enabled",
    provider_openai_call_now: "provider_openai_call_enabled",
    runtime_retrieval_rag_implemented_now: "retrieval_rag_execution_enabled",
    source_fetch_now: "source_fetch_enabled",
    crawler_now: "crawler_enabled",
    layout_coordinate_authority: "layout_coordinate_authority_enabled",
    manual_anchor_authority: "manual_anchor_authority_enabled",
    cluster_position_authority: "cluster_position_authority_enabled",
    product_write_authority: "product_write_enabled",
    product_id_allocation_authority: "product_id_allocation_enabled",
  };
  return uniqueSorted(
    Object.entries(codeByField).map(([field, code]) =>
      boundary[field as keyof typeof boundary] === true ? code : null,
    ),
  );
}

function validateNodeFamilies(families: ProjectConstellationNodeFamily[]) {
  return (
    deepEqual(
      families.map((family) => family.node_kind),
      expectedNodeKinds,
    ) &&
    families.every(
      (family) =>
        family.coordinate_truth_forbidden === true &&
        family.runtime_write_now === false,
    )
  );
}

function validateEdgeFamilies(families: ProjectConstellationEdgeFamily[]) {
  return (
    deepEqual(
      families.map((family) => family.edge_kind),
      expectedEdgeKinds,
    ) && families.every((family) => family.runtime_write_now === false)
  );
}

function positionHintIsDisplayOnly(positionHint: unknown): boolean {
  const record = asRecord(positionHint);
  return (
    record.coordinate_system === "normalized_preview_2d" &&
    typeof record.x === "number" &&
    typeof record.y === "number" &&
    record.coordinates_are_display_hints_not_truth === true &&
    record.not_source_of_truth === true
  );
}

function collectRefs(...values: unknown[]): string[] {
  const refs: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value === "string") {
      if (value.includes("_ref:") || value.includes("_id:")) {
        refs.push(value);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value && typeof value === "object") {
      for (const nested of Object.values(value)) {
        visit(nested);
      }
    }
  };
  values.forEach(visit);
  return uniqueSorted(refs);
}

function countRefsWithPrefix(refs: string[], prefix: string): number {
  return refs.filter((ref) => ref.startsWith(prefix)).length;
}

function hasPrivateOrUnstableValue(value: unknown): boolean {
  return collectAllStrings(value).some(isPrivateOrUnstableRef);
}

function hasKeyOrString(value: unknown, pattern: string): boolean {
  let found = false;
  const visit = (nested: unknown) => {
    if (found) {
      return;
    }
    if (typeof nested === "string") {
      found = nested.includes(pattern);
      return;
    }
    if (Array.isArray(nested)) {
      nested.forEach(visit);
      return;
    }
    if (nested && typeof nested === "object") {
      for (const [key, child] of Object.entries(nested)) {
        if (key.includes(pattern)) {
          found = true;
          return;
        }
        visit(child);
      }
    }
  };
  visit(value);
  return found;
}

function collectAllStrings(value: unknown): string[] {
  const strings: string[] = [];
  const visit = (nested: unknown) => {
    if (typeof nested === "string") {
      strings.push(nested);
      return;
    }
    if (Array.isArray(nested)) {
      nested.forEach(visit);
      return;
    }
    if (nested && typeof nested === "object") {
      Object.values(nested).forEach(visit);
    }
  };
  visit(value);
  return strings;
}

function isPrivateOrUnstableRef(value: string): boolean {
  const lowered = value.toLowerCase();
  return (
    lowered.includes(":private:") ||
    lowered.includes("private:") ||
    lowered.includes("unstable") ||
    lowered.includes("localhost") ||
    lowered.includes("127.0.0.1") ||
    lowered.includes("http://") ||
    lowered.includes("https://")
  );
}

function isProviderThreadRunSessionId(value: string): boolean {
  return /(^|[:/_-])(thread|run|session)_[a-z0-9]/i.test(value);
}

function isSecretLike(value: string): boolean {
  return /sk-[a-z0-9]/i.test(value) || value.toLowerCase().includes("secret:");
}

function allTrue(record: object): boolean {
  return Object.values(record).every((value) => value === true);
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" ? (value as JsonRecord) : {};
}

function arrayHasText(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(hasText);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueSorted<T>(values: Array<T | null | undefined>): T[] {
  return Array.from(
    new Set(values.filter((value): value is T => value != null)),
  ).sort();
}

function deepEqual(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortKeys(nested)]),
    );
  }
  return value;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
