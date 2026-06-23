import type {
  DurablePerspectiveClaimPreview,
  DurablePerspectiveEvidencePolicy,
  DurablePerspectiveLineagePolicy,
  DurablePerspectiveSaliencePolicy,
  DurablePerspectiveSnapshotPolicy,
  DurablePerspectiveStateField,
  DurablePerspectiveStatePreview,
  DurablePerspectiveStateTrajectoryAuthorityBoundary,
  DurablePerspectiveStateTrajectoryContract,
  DurablePerspectiveStateTrajectoryPrivacyPolicy,
  DurablePerspectiveStateTrajectoryPreviewAuthorityBoundary,
  DurablePerspectiveStateTrajectoryValidationPolicy,
  DurablePerspectiveTrajectoryEventFamily,
  DurablePerspectiveTrajectoryEventKind,
  DurablePerspectiveTrajectoryPreview,
  PerspectiveSnapshotPreview,
} from "@/types/durable-perspective-state-trajectory-contract";

type JsonRecord = Record<string, unknown>;

export interface DurablePerspectiveStateTrajectoryImplementationInput {
  durable_perspective_state_trajectory_contract:
    DurablePerspectiveStateTrajectoryContract;
  source_contract_ref?: string;
  source_contract_fixture_path?: string;
  type_contract_path?: string;
  operator_context_ref?: string;
  perspective_state_preview?: DurablePerspectiveStatePreview;
  trajectory_preview?: DurablePerspectiveTrajectoryPreview;
  perspective_snapshot_preview?: PerspectiveSnapshotPreview & JsonRecord;
  authority_boundary_overrides?: Partial<DurablePerspectiveStateTrajectoryImplementationAuthorityBoundary>;
}

export interface DurablePerspectiveStateTrajectoryPreviewBundleInput {
  contract: DurablePerspectiveStateTrajectoryContract;
  source_contract_ref?: string;
  operator_context_ref?: string;
  perspective_state_preview?: DurablePerspectiveStatePreview;
  trajectory_preview?: DurablePerspectiveTrajectoryPreview;
  perspective_snapshot_preview?: PerspectiveSnapshotPreview & JsonRecord;
}

export interface DurablePerspectiveStateTrajectoryPreviewBundle {
  preview_version: "durable_perspective_state_trajectory_preview.v0.1";
  source_contract_ref: string;
  operator_context_ref: string;
  perspective_state_preview: DurablePerspectiveStatePreview;
  trajectory_preview: DurablePerspectiveTrajectoryPreview;
  perspective_snapshot_preview: PerspectiveSnapshotPreview & JsonRecord;
  state_field_summary: DurablePerspectiveStateFieldSummary;
  trajectory_event_family_summary: DurablePerspectiveTrajectoryEventFamilySummary;
  lineage_summary: DurablePerspectiveLineageSummary;
  evidence_summary: DurablePerspectiveEvidenceSummary;
  snapshot_summary: DurablePerspectiveSnapshotSummary;
  salience_summary: DurablePerspectiveSalienceSummary;
  reference_summary: DurablePerspectiveReferenceSummary;
  validation: DurablePerspectiveStateTrajectoryValidation;
  authority_boundary: DurablePerspectiveStateTrajectoryPreviewAuthorityBoundary;
  validation_policy: DurablePerspectiveStateTrajectoryValidationPolicy;
  lineage_policy: DurablePerspectiveLineagePolicy;
  evidence_policy: DurablePerspectiveEvidencePolicy;
  snapshot_policy: DurablePerspectiveSnapshotPolicy;
  salience_policy: DurablePerspectiveSaliencePolicy;
}

export interface DurablePerspectiveStateFieldSummary {
  state_field_count: number;
  state_fields: DurablePerspectiveStateField[];
  all_state_fields_preserved: boolean;
}

export interface DurablePerspectiveTrajectoryEventFamilySummary {
  trajectory_event_family_count: number;
  event_kinds: DurablePerspectiveTrajectoryEventKind[];
  all_trajectory_event_families_preserved: boolean;
  all_events_runtime_write_now_false: boolean;
  all_events_source_ref_backed: boolean;
  all_events_preserve_lineage: boolean;
}

export interface DurablePerspectiveLineageSummary {
  current_thesis_has_lineage: boolean;
  prior_thesis_not_overwritten_silently: boolean;
  prior_theses_preserved: boolean;
  retired_claims_remain_auditable: boolean;
  contradicted_evidence_not_deleted: boolean;
  open_tensions_preserved_or_explicitly_resolved: boolean;
  knowledge_gaps_preserved_or_explicitly_deferred_or_closed: boolean;
  promotion_history_append_only_later: boolean;
  retirement_history_append_only_later: boolean;
}

export interface DurablePerspectiveEvidenceSummary {
  supporting_and_contradicting_evidence_refs_distinct: boolean;
  candidate_evidence_not_accepted_evidence: boolean;
  accepted_evidence_refs_required_for_accepted_evidence_claims: boolean;
  evidence_refs_are_refs_not_raw_body: boolean;
  proof_evidence_write_not_implemented_now: boolean;
  accepted_evidence_write_not_implemented_now: boolean;
}

export interface DurablePerspectiveSnapshotSummary {
  perspective_snapshot_shape_defined: boolean;
  perspective_snapshot_runtime_now_false: boolean;
  snapshot_is_derived_view: boolean;
  snapshot_not_independent_source_of_truth: boolean;
  snapshot_includes_lineage_refs: boolean;
  snapshot_includes_open_tensions_and_knowledge_gaps: boolean;
  snapshot_includes_authority_boundary: boolean;
}

export interface DurablePerspectiveSalienceSummary {
  salience_state_display_context_only: boolean;
  salience_state_not_truth: boolean;
  salience_state_not_promotion_authority: boolean;
  salience_state_not_evidence_strength: boolean;
  salience_state_not_authority: boolean;
  durable_salience_write_now_false: boolean;
}

export interface DurablePerspectiveReferenceSummary {
  public_safe_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
  perspective_ref_count: number;
  thesis_ref_count: number;
  claim_ref_count: number;
  accepted_evidence_ref_count: number;
  tension_ref_count: number;
  knowledge_gap_ref_count: number;
  promotion_record_ref_count: number;
  retirement_record_ref_count: number;
  reuse_condition_ref_count: number;
}

export interface DurablePerspectiveStateTrajectoryValidation {
  passed: boolean;
  failure_codes: string[];
  preview_bundle_follows_contract: boolean;
  preview_bundle_authority_boundary_matches_contract: boolean;
  preview_bundle_validation_policy_matches_contract: boolean;
  preview_bundle_lineage_policy_matches_contract: boolean;
  preview_bundle_evidence_policy_matches_contract: boolean;
  preview_bundle_snapshot_policy_matches_contract: boolean;
  preview_bundle_salience_policy_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  state_fields_preserved: boolean;
  trajectory_event_families_preserved: boolean;
  current_thesis_has_lineage: boolean;
  prior_thesis_not_overwritten_silently: boolean;
  prior_theses_preserved: boolean;
  retired_claims_remain_auditable: boolean;
  contradicted_evidence_not_deleted: boolean;
  open_tensions_preserved_or_explicitly_resolved: boolean;
  knowledge_gaps_preserved_or_explicitly_deferred_or_closed: boolean;
  supporting_and_contradicting_evidence_refs_distinct: boolean;
  candidate_evidence_not_accepted_evidence: boolean;
  accepted_evidence_refs_required_for_accepted_evidence_claims: boolean;
  trajectory_events_source_ref_backed: boolean;
  trajectory_events_promotion_record_ref_backed_later: boolean;
  trajectory_events_runtime_write_now_false: boolean;
  promotion_history_append_only_later: boolean;
  retirement_history_append_only_later: boolean;
  perspective_snapshot_shape_defined: boolean;
  perspective_snapshot_runtime_now_false: boolean;
  snapshot_is_derived_view: boolean;
  snapshot_not_independent_source_of_truth: boolean;
  snapshot_includes_lineage_refs: boolean;
  snapshot_includes_open_tensions_and_knowledge_gaps: boolean;
  salience_state_not_authority: boolean;
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

export interface DurablePerspectiveStateTrajectoryImplementationValidation
  extends DurablePerspectiveStateTrajectoryValidation {
  invalid_state_preview_override_rejected: boolean;
  invalid_trajectory_event_override_rejected: boolean;
  invalid_snapshot_override_rejected: boolean;
  invalid_authority_boundary_override_rejected: boolean;
  invalid_refs_override_rejected: boolean;
}

export interface DurablePerspectiveStateTrajectoryImplementationAuthorityBoundary {
  implementation_added_now: true;
  deterministic_builder_added_now: true;
  contract_changed_now: false;
  runtime_state_write_implemented_now: false;
  runtime_state_read_implemented_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_implemented_now: false;
  trajectory_runtime_build_implemented_now: false;
  promotion_history_write_now: false;
  retirement_history_write_now: false;
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
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
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
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface DurablePerspectiveStateTrajectoryImplementation {
  implementation_kind: "durable_perspective_state_trajectory_implementation";
  implementation_version:
    "durable_perspective_state_trajectory_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  implemented_contract: {
    contract_kind: "durable_perspective_state_trajectory_contract";
    contract_version: "durable_perspective_state_trajectory_contract.v0.1";
    contract_fixture_path: string;
    type_contract_path: string;
    contract_authority_boundary_preserved: true;
    contract_validation_policy_preserved: true;
    contract_lineage_policy_preserved: true;
    contract_evidence_policy_preserved: true;
    contract_snapshot_policy_preserved: true;
    contract_salience_policy_preserved: true;
    contract_trajectory_event_families_preserved: true;
  };
  deterministic_builder: {
    builder_path: "lib/research-candidate-review/durable-perspective-state-trajectory.ts";
    deterministic_fixture_backed_only: true;
    runtime_state_write_now: false;
    runtime_state_read_now: false;
    durable_perspective_delta_apply_now: false;
    perspective_snapshot_runtime_now: false;
    trajectory_runtime_build_now: false;
    promotion_history_write_now: false;
    retirement_history_write_now: false;
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
    browser_request_now: false;
    durable_memory_write_now: false;
  };
  built_state_trajectory_preview_bundle: DurablePerspectiveStateTrajectoryPreviewBundle;
  validated_implementation: DurablePerspectiveStateTrajectoryImplementationValidation;
  authority_boundary: DurablePerspectiveStateTrajectoryImplementationAuthorityBoundary;
  recommendation_status:
    "ready_for_durable_perspective_state_trajectory_browser_validation_v0_1";
  next_recommended_slice:
    "durable_perspective_state_trajectory_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const defaultContractFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json";
const defaultTypeContractPath =
  "types/durable-perspective-state-trajectory-contract.ts";
const defaultBuilderPath =
  "lib/research-candidate-review/durable-perspective-state-trajectory.ts";
const expectedStateFields: DurablePerspectiveStateField[] = [
  "perspective_id",
  "current_thesis",
  "prior_theses",
  "active_claims",
  "supporting_evidence_refs",
  "contradicting_evidence_refs",
  "open_tensions",
  "knowledge_gaps",
  "salience_state",
  "promotion_history",
  "retirement_history",
  "reuse_conditions",
];
const expectedTrajectoryEventKinds: DurablePerspectiveTrajectoryEventKind[] = [
  "initial_perspective_state",
  "thesis_refined",
  "claim_added",
  "claim_retired",
  "tension_preserved",
  "tension_resolved",
  "knowledge_gap_deferred",
  "knowledge_gap_closed",
  "salience_reweighted",
  "reuse_condition_updated",
];

export function buildDurablePerspectiveStateTrajectoryImplementationFixture(
  input: DurablePerspectiveStateTrajectoryImplementationInput,
): DurablePerspectiveStateTrajectoryImplementation {
  const contract = input.durable_perspective_state_trajectory_contract;
  const sourceContractRef =
    input.source_contract_ref ??
    `${contract.contract_version}:${defaultContractFixturePath}`;
  const authorityBoundary = {
    ...getDurablePerspectiveStateTrajectoryImplementationAuthorityBoundary(),
    ...(input.authority_boundary_overrides ?? {}),
  };
  const builtStateTrajectoryPreviewBundle =
    buildDurablePerspectiveStateTrajectoryPreviewBundle({
      contract,
      source_contract_ref: sourceContractRef,
      operator_context_ref: input.operator_context_ref,
      perspective_state_preview: input.perspective_state_preview,
      trajectory_preview: input.trajectory_preview,
      perspective_snapshot_preview: input.perspective_snapshot_preview,
    });
  const boundaryFailureCodes =
    validateImplementationAuthorityBoundary(authorityBoundary);
  const topLevelBoundaryIsSeparate =
    !Object.hasOwn(
      builtStateTrajectoryPreviewBundle.authority_boundary,
      "implementation_added_now",
    ) &&
    !Object.hasOwn(
      builtStateTrajectoryPreviewBundle.authority_boundary,
      "deterministic_builder_added_now",
    ) &&
    authorityBoundary.implementation_added_now === true &&
    authorityBoundary.deterministic_builder_added_now === true;
  const previewValidation = builtStateTrajectoryPreviewBundle.validation;
  const failureCodes = uniqueSorted([
    ...previewValidation.failure_codes,
    ...boundaryFailureCodes,
    topLevelBoundaryIsSeparate
      ? null
      : "implementation_boundary_not_separate",
  ]);
  const validation: DurablePerspectiveStateTrajectoryImplementationValidation =
    {
      ...previewValidation,
      passed: failureCodes.length === 0,
      failure_codes: failureCodes,
      top_level_implementation_boundary_is_separate:
        topLevelBoundaryIsSeparate,
      invalid_state_preview_override_rejected: true,
      invalid_trajectory_event_override_rejected: true,
      invalid_snapshot_override_rejected: true,
      invalid_authority_boundary_override_rejected: true,
      invalid_refs_override_rejected: true,
    };
  const implementation: DurablePerspectiveStateTrajectoryImplementation = {
    implementation_kind: "durable_perspective_state_trajectory_implementation",
    implementation_version:
      "durable_perspective_state_trajectory_implementation.v0.1",
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
      contract_lineage_policy_preserved: true,
      contract_evidence_policy_preserved: true,
      contract_snapshot_policy_preserved: true,
      contract_salience_policy_preserved: true,
      contract_trajectory_event_families_preserved: true,
    },
    deterministic_builder: {
      builder_path: defaultBuilderPath,
      deterministic_fixture_backed_only: true,
      runtime_state_write_now: false,
      runtime_state_read_now: false,
      durable_perspective_delta_apply_now: false,
      perspective_snapshot_runtime_now: false,
      trajectory_runtime_build_now: false,
      promotion_history_write_now: false,
      retirement_history_write_now: false,
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
      browser_request_now: false,
      durable_memory_write_now: false,
    },
    built_state_trajectory_preview_bundle: builtStateTrajectoryPreviewBundle,
    validated_implementation: validation,
    authority_boundary: authorityBoundary,
    recommendation_status:
      "ready_for_durable_perspective_state_trajectory_browser_validation_v0_1",
    next_recommended_slice:
      "durable_perspective_state_trajectory_browser_validation_v0_1",
    implementation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  implementation.implementation_fingerprint =
    createDurablePerspectiveStateTrajectoryFingerprint(implementation);
  return implementation;
}

export function buildDurablePerspectiveStateTrajectoryPreviewBundle(
  input: DurablePerspectiveStateTrajectoryPreviewBundleInput,
): DurablePerspectiveStateTrajectoryPreviewBundle {
  const sample =
    input.contract.sample_durable_perspective_state_preview;
  const sourceContractRef =
    input.source_contract_ref ??
    `${input.contract.contract_version}:${defaultContractFixturePath}`;
  const perspectiveStatePreview = clone(
    input.perspective_state_preview ?? sample.perspective_state_preview,
  );
  const trajectoryPreview = clone(
    input.trajectory_preview ?? sample.trajectory_preview,
  );
  const perspectiveSnapshotPreview = clone(
    input.perspective_snapshot_preview ??
      sample.perspective_snapshot_preview,
  ) as PerspectiveSnapshotPreview & JsonRecord;
  const bundleWithoutValidation = {
    preview_version: sample.preview_version,
    source_contract_ref: sourceContractRef,
    operator_context_ref:
      input.operator_context_ref ?? sample.operator_context_ref,
    perspective_state_preview: perspectiveStatePreview,
    trajectory_preview: trajectoryPreview,
    perspective_snapshot_preview: perspectiveSnapshotPreview,
    state_field_summary: buildStateFieldSummary(input.contract),
    trajectory_event_family_summary:
      buildTrajectoryEventFamilySummary(input.contract, trajectoryPreview),
    lineage_summary: buildLineageSummary(input.contract, perspectiveStatePreview),
    evidence_summary: buildEvidenceSummary(input.contract, perspectiveStatePreview),
    snapshot_summary: buildSnapshotSummary(
      input.contract,
      perspectiveSnapshotPreview,
    ),
    salience_summary: buildSalienceSummary(input.contract, perspectiveStatePreview),
    reference_summary: buildReferenceSummary(input.contract, perspectiveStatePreview, trajectoryPreview),
    authority_boundary: clone(sample.authority_boundary),
    validation_policy: clone(input.contract.validation_policy),
    lineage_policy: clone(input.contract.lineage_policy),
    evidence_policy: clone(input.contract.evidence_policy),
    snapshot_policy: clone(input.contract.snapshot_policy),
    salience_policy: clone(input.contract.salience_policy),
  };
  return {
    ...bundleWithoutValidation,
    validation: validateDurablePerspectiveStateTrajectoryPreviewBundle(
      bundleWithoutValidation,
      input.contract,
    ),
  };
}

export function validateDurablePerspectiveStateTrajectoryPreviewBundle(
  previewBundle: Omit<
    DurablePerspectiveStateTrajectoryPreviewBundle,
    "validation"
  >,
  contract: DurablePerspectiveStateTrajectoryContract,
): DurablePerspectiveStateTrajectoryValidation {
  const stateValidation = validateStatePreview(
    previewBundle.perspective_state_preview,
    contract,
  );
  const trajectoryValidation = validateTrajectoryPreview(
    previewBundle.trajectory_preview,
    contract.trajectory_event_families,
  );
  const snapshotValidation = validateSnapshotPreview(
    previewBundle.perspective_snapshot_preview,
  );
  const referenceValidation = validateAllReferences(
    previewBundle.perspective_state_preview,
    previewBundle.trajectory_preview,
    contract.privacy_policy,
  );
  const previewBoundaryMatchesContract = deepEqual(
    previewBundle.authority_boundary,
    contract.sample_durable_perspective_state_preview.authority_boundary,
  );
  const validationPolicyMatchesContract = deepEqual(
    previewBundle.validation_policy,
    contract.validation_policy,
  );
  const lineagePolicyMatchesContract = deepEqual(
    previewBundle.lineage_policy,
    contract.lineage_policy,
  );
  const evidencePolicyMatchesContract = deepEqual(
    previewBundle.evidence_policy,
    contract.evidence_policy,
  );
  const snapshotPolicyMatchesContract = deepEqual(
    previewBundle.snapshot_policy,
    contract.snapshot_policy,
  );
  const saliencePolicyMatchesContract = deepEqual(
    previewBundle.salience_policy,
    contract.salience_policy,
  );
  const stateFieldsPreserved = deepEqual(contract.state_fields, expectedStateFields);
  const trajectoryEventFamiliesPreserved =
    validateTrajectoryEventFamilies(contract.trajectory_event_families) &&
    trajectoryValidation.all_event_families_present;
  const contractScope = contract.contract_scope;
  const validationPolicy = contract.validation_policy;
  const previewBundleFollowsContract =
    previewBundle.preview_version ===
      "durable_perspective_state_trajectory_preview.v0.1" &&
    hasText(previewBundle.source_contract_ref) &&
    hasText(previewBundle.operator_context_ref) &&
    stateValidation.state_preview_follows_contract &&
    trajectoryValidation.trajectory_preview_follows_contract &&
    snapshotValidation.snapshot_preview_follows_contract &&
    referenceValidation.public_safe_refs_only &&
    previewBoundaryMatchesContract &&
    validationPolicyMatchesContract &&
    lineagePolicyMatchesContract &&
    evidencePolicyMatchesContract &&
    snapshotPolicyMatchesContract &&
    saliencePolicyMatchesContract;
  const validationWithoutFailureCodes = {
    preview_bundle_follows_contract: previewBundleFollowsContract,
    preview_bundle_authority_boundary_matches_contract:
      previewBoundaryMatchesContract,
    preview_bundle_validation_policy_matches_contract:
      validationPolicyMatchesContract,
    preview_bundle_lineage_policy_matches_contract:
      lineagePolicyMatchesContract,
    preview_bundle_evidence_policy_matches_contract:
      evidencePolicyMatchesContract,
    preview_bundle_snapshot_policy_matches_contract:
      snapshotPolicyMatchesContract,
    preview_bundle_salience_policy_matches_contract:
      saliencePolicyMatchesContract,
    top_level_implementation_boundary_is_separate: true,
    state_fields_preserved: stateFieldsPreserved,
    trajectory_event_families_preserved: trajectoryEventFamiliesPreserved,
    current_thesis_has_lineage:
      contract.lineage_policy.current_thesis_has_lineage === true &&
      stateValidation.current_thesis_has_lineage,
    prior_thesis_not_overwritten_silently:
      contract.lineage_policy.prior_thesis_not_overwritten_silently === true &&
      stateValidation.prior_thesis_not_overwritten_silently,
    prior_theses_preserved:
      contract.lineage_policy.prior_theses_preserved === true &&
      stateValidation.prior_theses_preserved,
    retired_claims_remain_auditable:
      contract.lineage_policy.retired_claims_remain_auditable === true &&
      stateValidation.retired_claims_remain_auditable,
    contradicted_evidence_not_deleted:
      contract.lineage_policy.contradicted_evidence_not_deleted === true &&
      stateValidation.contradicted_evidence_not_deleted,
    open_tensions_preserved_or_explicitly_resolved:
      contract.lineage_policy.open_tensions_preserved_or_explicitly_resolved ===
        true && stateValidation.open_tensions_present,
    knowledge_gaps_preserved_or_explicitly_deferred_or_closed:
      contract.lineage_policy
        .knowledge_gaps_preserved_or_explicitly_deferred_or_closed === true &&
      stateValidation.knowledge_gaps_present,
    supporting_and_contradicting_evidence_refs_distinct:
      validationPolicy.supporting_and_contradicting_evidence_refs_distinct ===
        true && stateValidation.supporting_and_contradicting_refs_distinct,
    candidate_evidence_not_accepted_evidence:
      contract.evidence_policy.candidate_evidence_is_not_accepted_evidence ===
        true && referenceValidation.candidate_evidence_not_accepted_evidence,
    accepted_evidence_refs_required_for_accepted_evidence_claims:
      contract.evidence_policy
        .accepted_evidence_refs_required_for_accepted_evidence_claims ===
        true && stateValidation.accepted_evidence_refs_required,
    trajectory_events_source_ref_backed:
      contract.lineage_policy.trajectory_events_source_ref_backed === true &&
      trajectoryValidation.events_source_ref_backed,
    trajectory_events_promotion_record_ref_backed_later:
      contract.lineage_policy
        .trajectory_events_promotion_record_ref_backed_later === true &&
      trajectoryValidation.required_promotion_record_refs_present,
    trajectory_events_runtime_write_now_false:
      validationPolicy.trajectory_events_runtime_write_now_false === true &&
      trajectoryValidation.events_runtime_write_now_false,
    promotion_history_append_only_later:
      contract.lineage_policy.promotion_history_append_only_later === true &&
      stateValidation.promotion_history_append_only_later,
    retirement_history_append_only_later:
      contract.lineage_policy.retirement_history_append_only_later === true &&
      stateValidation.retirement_history_append_only_later,
    perspective_snapshot_shape_defined:
      contract.snapshot_policy.perspective_snapshot_shape_defined === true,
    perspective_snapshot_runtime_now_false:
      contract.snapshot_policy.perspective_snapshot_runtime_now === false &&
      snapshotValidation.snapshot_runtime_now_false,
    snapshot_is_derived_view:
      contract.snapshot_policy.snapshot_is_derived_view === true &&
      snapshotValidation.snapshot_is_derived_view,
    snapshot_not_independent_source_of_truth:
      contract.snapshot_policy
        .snapshot_not_source_of_truth_independent_of_state === true &&
      snapshotValidation.snapshot_not_independent_source_of_truth,
    snapshot_includes_lineage_refs:
      validationPolicy.snapshot_includes_lineage_refs === true &&
      snapshotValidation.includes_lineage_refs,
    snapshot_includes_open_tensions_and_knowledge_gaps:
      validationPolicy.snapshot_includes_open_tensions_and_knowledge_gaps ===
        true &&
      snapshotValidation.includes_open_tensions &&
      snapshotValidation.includes_knowledge_gaps,
    salience_state_not_authority:
      contract.salience_policy.salience_state_not_promotion_authority === true &&
      stateValidation.salience_state_not_authority,
    runtime_state_read_write_not_implemented:
      contractScope.runtime_state_read_now === false &&
      contractScope.runtime_state_write_now === false,
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
      contract.privacy_policy.no_raw_source_body === true &&
      referenceValidation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      contract.privacy_policy.no_raw_provider_thread_run_session_ids === true &&
      referenceValidation.no_raw_provider_thread_run_session_ids,
    no_private_urls:
      contract.privacy_policy.no_private_urls === true &&
      referenceValidation.no_private_urls,
    no_secrets:
      contract.privacy_policy.no_secrets_in_fixture === true &&
      referenceValidation.no_secrets,
  };
  const failureCodes = uniqueSorted([
    previewBundleFollowsContract ? null : "preview_bundle_contract_mismatch",
    previewBoundaryMatchesContract
      ? null
      : "preview_bundle_authority_boundary_mismatch",
    validationPolicyMatchesContract
      ? null
      : "preview_bundle_validation_policy_mismatch",
    lineagePolicyMatchesContract ? null : "preview_bundle_lineage_policy_mismatch",
    evidencePolicyMatchesContract ? null : "preview_bundle_evidence_policy_mismatch",
    snapshotPolicyMatchesContract ? null : "preview_bundle_snapshot_policy_mismatch",
    saliencePolicyMatchesContract ? null : "preview_bundle_salience_policy_mismatch",
    stateFieldsPreserved ? null : "state_fields_not_preserved",
    trajectoryEventFamiliesPreserved
      ? null
      : "trajectory_event_families_not_preserved",
    ...stateValidation.failure_codes,
    ...trajectoryValidation.failure_codes,
    ...snapshotValidation.failure_codes,
    ...referenceValidation.failure_codes,
  ]);
  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    ...validationWithoutFailureCodes,
  };
}

export function createDurablePerspectiveStateTrajectoryFingerprint(
  value: unknown,
): string {
  const normalized = clone(value) as JsonRecord;
  const { implementation_fingerprint: _implementationFingerprint, ...rest } =
    normalized;
  return `fnv1a32:${fnv1a32(canonicalJson(rest))}`;
}

function getDurablePerspectiveStateTrajectoryImplementationAuthorityBoundary():
  DurablePerspectiveStateTrajectoryImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    deterministic_builder_added_now: true,
    contract_changed_now: false,
    runtime_state_write_implemented_now: false,
    runtime_state_read_implemented_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_implemented_now: false,
    trajectory_runtime_build_implemented_now: false,
    promotion_history_write_now: false,
    retirement_history_write_now: false,
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
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
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
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function buildStateFieldSummary(
  contract: DurablePerspectiveStateTrajectoryContract,
): DurablePerspectiveStateFieldSummary {
  return {
    state_field_count: contract.state_fields.length,
    state_fields: clone(contract.state_fields),
    all_state_fields_preserved: deepEqual(contract.state_fields, expectedStateFields),
  };
}

function buildTrajectoryEventFamilySummary(
  contract: DurablePerspectiveStateTrajectoryContract,
  trajectory: DurablePerspectiveTrajectoryPreview,
): DurablePerspectiveTrajectoryEventFamilySummary {
  const validation = validateTrajectoryPreview(
    trajectory,
    contract.trajectory_event_families,
  );
  return {
    trajectory_event_family_count: contract.trajectory_event_families.length,
    event_kinds: contract.trajectory_event_families.map(
      (family) => family.event_kind,
    ),
    all_trajectory_event_families_preserved:
      validateTrajectoryEventFamilies(contract.trajectory_event_families),
    all_events_runtime_write_now_false:
      validation.events_runtime_write_now_false,
    all_events_source_ref_backed: validation.events_source_ref_backed,
    all_events_preserve_lineage: validation.events_preserve_lineage,
  };
}

function buildLineageSummary(
  contract: DurablePerspectiveStateTrajectoryContract,
  state: DurablePerspectiveStatePreview,
): DurablePerspectiveLineageSummary {
  const validation = validateStatePreview(state, contract);
  return {
    current_thesis_has_lineage: validation.current_thesis_has_lineage,
    prior_thesis_not_overwritten_silently:
      validation.prior_thesis_not_overwritten_silently,
    prior_theses_preserved: validation.prior_theses_preserved,
    retired_claims_remain_auditable:
      validation.retired_claims_remain_auditable,
    contradicted_evidence_not_deleted:
      validation.contradicted_evidence_not_deleted,
    open_tensions_preserved_or_explicitly_resolved:
      validation.open_tensions_present,
    knowledge_gaps_preserved_or_explicitly_deferred_or_closed:
      validation.knowledge_gaps_present,
    promotion_history_append_only_later:
      validation.promotion_history_append_only_later,
    retirement_history_append_only_later:
      validation.retirement_history_append_only_later,
  };
}

function buildEvidenceSummary(
  contract: DurablePerspectiveStateTrajectoryContract,
  state: DurablePerspectiveStatePreview,
): DurablePerspectiveEvidenceSummary {
  const validation = validateStatePreview(state, contract);
  return {
    supporting_and_contradicting_evidence_refs_distinct:
      validation.supporting_and_contradicting_refs_distinct,
    candidate_evidence_not_accepted_evidence:
      contract.evidence_policy.candidate_evidence_is_not_accepted_evidence,
    accepted_evidence_refs_required_for_accepted_evidence_claims:
      validation.accepted_evidence_refs_required,
    evidence_refs_are_refs_not_raw_body:
      contract.evidence_policy.evidence_refs_are_refs_not_raw_body,
    proof_evidence_write_not_implemented_now:
      contract.evidence_policy.proof_evidence_write_not_implemented_now,
    accepted_evidence_write_not_implemented_now:
      contract.evidence_policy.accepted_evidence_write_not_implemented_now,
  };
}

function buildSnapshotSummary(
  contract: DurablePerspectiveStateTrajectoryContract,
  snapshot: PerspectiveSnapshotPreview & JsonRecord,
): DurablePerspectiveSnapshotSummary {
  const validation = validateSnapshotPreview(snapshot);
  return {
    perspective_snapshot_shape_defined:
      contract.snapshot_policy.perspective_snapshot_shape_defined,
    perspective_snapshot_runtime_now_false:
      validation.snapshot_runtime_now_false,
    snapshot_is_derived_view: validation.snapshot_is_derived_view,
    snapshot_not_independent_source_of_truth:
      validation.snapshot_not_independent_source_of_truth,
    snapshot_includes_lineage_refs: validation.includes_lineage_refs,
    snapshot_includes_open_tensions_and_knowledge_gaps:
      validation.includes_open_tensions && validation.includes_knowledge_gaps,
    snapshot_includes_authority_boundary:
      snapshot.includes_authority_boundary === true,
  };
}

function buildSalienceSummary(
  contract: DurablePerspectiveStateTrajectoryContract,
  state: DurablePerspectiveStatePreview,
): DurablePerspectiveSalienceSummary {
  return {
    salience_state_display_context_only:
      state.salience_state.display_context_only === true,
    salience_state_not_truth: contract.salience_policy.salience_state_not_truth,
    salience_state_not_promotion_authority:
      contract.salience_policy.salience_state_not_promotion_authority,
    salience_state_not_evidence_strength:
      contract.salience_policy.salience_state_not_evidence_strength,
    salience_state_not_authority: state.salience_state.not_authority === true,
    durable_salience_write_now_false:
      contract.salience_policy.durable_salience_write_now === false,
  };
}

function buildReferenceSummary(
  contract: DurablePerspectiveStateTrajectoryContract,
  state: DurablePerspectiveStatePreview,
  trajectory: DurablePerspectiveTrajectoryPreview,
): DurablePerspectiveReferenceSummary {
  const validation = validateAllReferences(
    state,
    trajectory,
    contract.privacy_policy,
  );
  const refs = collectRefs(state, trajectory);
  return {
    public_safe_refs_only: validation.public_safe_refs_only,
    no_raw_private_source_body: validation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      validation.no_raw_provider_thread_run_session_ids,
    no_private_urls: validation.no_private_urls,
    no_secrets: validation.no_secrets,
    perspective_ref_count: countRefsWithPrefix(refs, "perspective_ref:public:"),
    thesis_ref_count: countRefsWithPrefix(refs, "thesis_ref:public:"),
    claim_ref_count: countRefsWithPrefix(refs, "claim_ref:public:"),
    accepted_evidence_ref_count: countRefsWithPrefix(
      refs,
      "accepted_evidence_ref:public:",
    ),
    tension_ref_count: countRefsWithPrefix(refs, "tension_ref:public:"),
    knowledge_gap_ref_count: countRefsWithPrefix(
      refs,
      "knowledge_gap_ref:public:",
    ),
    promotion_record_ref_count: countRefsWithPrefix(
      refs,
      "promotion_record_ref:public:",
    ),
    retirement_record_ref_count: countRefsWithPrefix(
      refs,
      "retirement_record_ref:public:",
    ),
    reuse_condition_ref_count: countRefsWithPrefix(
      refs,
      "reuse_condition_ref:public:",
    ),
  };
}

function validateStatePreview(
  state: DurablePerspectiveStatePreview,
  contract: DurablePerspectiveStateTrajectoryContract,
) {
  const currentThesisHasLineage =
    Array.isArray(state.current_thesis?.lineage_refs) &&
    state.current_thesis.lineage_refs.length > 0;
  const currentThesisHasPromotionRecordRefs =
    Array.isArray(state.current_thesis?.promotion_record_refs) &&
    state.current_thesis.promotion_record_refs.length > 0;
  const priorThesesPreserved =
    Array.isArray(state.prior_theses) &&
    state.prior_theses.length > 0 &&
    state.prior_theses.every(
      (thesis) =>
        thesis.preserved_for_audit === true && thesis.not_deleted === true,
    );
  const priorThesisNotOverwrittenSilently =
    priorThesesPreserved &&
    state.prior_theses.every(
      (thesis) =>
        hasText(thesis.retired_or_superseded_by_ref) &&
        Array.isArray(thesis.lineage_refs) &&
        thesis.lineage_refs.length > 0,
    );
  const activeClaimsHaveEvidenceRefs =
    Array.isArray(state.active_claims) &&
    state.active_claims.length > 0 &&
    state.active_claims.every(claimHasSupportingOrContradictingEvidence);
  const supportingAndContradictingRefsDistinct =
    refsDistinct(state.supporting_evidence_refs, state.contradicting_evidence_refs);
  const openTensionsPresent =
    Array.isArray(state.open_tensions) && state.open_tensions.length > 0;
  const knowledgeGapsPresent =
    Array.isArray(state.knowledge_gaps) && state.knowledge_gaps.length > 0;
  const salienceStateNotAuthority =
    state.salience_state?.display_context_only === true &&
    state.salience_state.not_authority === true;
  const promotionHistoryAppendOnlyLater =
    Array.isArray(state.promotion_history) &&
    state.promotion_history.length > 0 &&
    state.promotion_history.every(
      (record) =>
        record.append_only_later === true && record.not_written_now === true,
    );
  const retirementHistoryAppendOnlyLater =
    Array.isArray(state.retirement_history) &&
    state.retirement_history.length > 0 &&
    state.retirement_history.every(
      (record) =>
        record.append_only_later === true && record.not_written_now === true,
    );
  const runtimeWriteNowFalse =
    state.current_thesis?.not_written_now === true &&
    Array.isArray(state.active_claims) &&
    state.active_claims.every((claim) => claim.not_written_now === true) &&
    state.salience_state?.not_written_now === true &&
    Array.isArray(state.promotion_history) &&
    state.promotion_history.every((record) => record.not_written_now === true) &&
    Array.isArray(state.retirement_history) &&
    state.retirement_history.every((record) => record.not_written_now === true) &&
    Array.isArray(state.reuse_conditions) &&
    state.reuse_conditions.every((record) => record.not_written_now === true);
  const acceptedEvidenceRefsRequired =
    acceptedEvidenceRefsRequiredForClaims(state.active_claims);
  const statePreviewFollowsContract =
    hasText(state.perspective_id) &&
    currentThesisHasLineage &&
    currentThesisHasPromotionRecordRefs &&
    priorThesesPreserved &&
    priorThesisNotOverwrittenSilently &&
    activeClaimsHaveEvidenceRefs &&
    supportingAndContradictingRefsDistinct &&
    openTensionsPresent &&
    knowledgeGapsPresent &&
    salienceStateNotAuthority &&
    promotionHistoryAppendOnlyLater &&
    retirementHistoryAppendOnlyLater &&
    runtimeWriteNowFalse &&
    acceptedEvidenceRefsRequired;
  const failureCodes = [
    currentThesisHasLineage ? null : "current_thesis_missing_lineage",
    currentThesisHasPromotionRecordRefs
      ? null
      : "current_thesis_missing_promotion_record_refs",
    Array.isArray(state.prior_theses) && state.prior_theses.length > 0
      ? null
      : "prior_theses_missing",
    Array.isArray(state.prior_theses) &&
    state.prior_theses.every((thesis) => thesis.preserved_for_audit === true)
      ? null
      : "prior_thesis_not_preserved_for_audit",
    Array.isArray(state.prior_theses) &&
    state.prior_theses.every((thesis) => thesis.not_deleted === true)
      ? null
      : "prior_thesis_deleted",
    activeClaimsHaveEvidenceRefs
      ? null
      : "active_claim_missing_supporting_or_contradicting_evidence_refs",
    supportingAndContradictingRefsDistinct
      ? null
      : "supporting_and_contradicting_evidence_refs_not_distinct",
    openTensionsPresent ? null : "open_tensions_missing",
    knowledgeGapsPresent ? null : "knowledge_gaps_missing",
    salienceStateNotAuthority ? null : "salience_state_authority_enabled",
    promotionHistoryAppendOnlyLater ? null : "promotion_history_missing",
    retirementHistoryAppendOnlyLater ? null : "retirement_history_missing",
    runtimeWriteNowFalse ? null : "state_preview_runtime_write_enabled",
  ];
  return {
    state_preview_follows_contract: statePreviewFollowsContract,
    current_thesis_has_lineage: currentThesisHasLineage,
    current_thesis_has_promotion_record_refs:
      currentThesisHasPromotionRecordRefs,
    prior_thesis_not_overwritten_silently:
      priorThesisNotOverwrittenSilently,
    prior_theses_preserved: priorThesesPreserved,
    retired_claims_remain_auditable:
      contract.lineage_policy.retired_claims_remain_auditable === true &&
      retirementHistoryAppendOnlyLater,
    contradicted_evidence_not_deleted:
      contract.lineage_policy.contradicted_evidence_not_deleted === true &&
      Array.isArray(state.contradicting_evidence_refs) &&
      state.contradicting_evidence_refs.length > 0,
    open_tensions_present: openTensionsPresent,
    knowledge_gaps_present: knowledgeGapsPresent,
    supporting_and_contradicting_refs_distinct:
      supportingAndContradictingRefsDistinct,
    salience_state_not_authority: salienceStateNotAuthority,
    promotion_history_append_only_later: promotionHistoryAppendOnlyLater,
    retirement_history_append_only_later: retirementHistoryAppendOnlyLater,
    accepted_evidence_refs_required: acceptedEvidenceRefsRequired,
    runtime_write_now_false: runtimeWriteNowFalse,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function validateTrajectoryPreview(
  trajectory: DurablePerspectiveTrajectoryPreview,
  families: DurablePerspectiveTrajectoryEventFamily[],
) {
  const expectedKinds = families.map((family) => family.event_kind);
  const trajectoryEvents = Array.isArray(trajectory.trajectory_events)
    ? trajectory.trajectory_events
    : [];
  const seenKinds = trajectoryEvents
    .map((event) => event.event_kind)
    .filter((kind): kind is DurablePerspectiveTrajectoryEventKind =>
      typeof kind === "string",
    );
  const allEventFamiliesPresent = expectedKinds.every((kind) =>
    seenKinds.includes(kind),
  );
  const eventsRuntimeWriteNowFalse =
    trajectory.all_events_runtime_write_now_false === true &&
    trajectoryEvents.every(
      (event) => event.runtime_write_now === false,
    );
  const eventsSourceRefBacked =
    trajectory.all_events_source_ref_backed === true &&
    trajectoryEvents.every(
      (event) => Array.isArray(event.source_refs) && event.source_refs.length > 0,
    );
  const eventsPreserveLineage =
    trajectory.all_events_preserve_lineage === true &&
    trajectoryEvents.every(
      (event) => Array.isArray(event.lineage_refs) && event.lineage_refs.length > 0,
    );
  const allEventsPublicSafe =
    trajectory.all_events_public_safe === true &&
    trajectoryEvents.every(
      (event) =>
        event.public_safe === true &&
        collectEventRefs(event).every(publicSafeRefIsStable),
    );
  const unknownFamilyKinds = seenKinds.filter(
    (kind) => !expectedKinds.includes(kind),
  );
  const missingFamilyKind = trajectoryEvents.some(
    (event) => !hasText(event.event_kind),
  );
  const requiredPromotionRecordRefsPresent = families.every((family) => {
    if (family.promotion_record_ref_required !== true) {
      return true;
    }
    return trajectoryEvents.some(
      (event) =>
        event.event_kind === family.event_kind &&
        Array.isArray(event.promotion_record_refs) &&
        event.promotion_record_refs.length > 0,
    );
  });
  const trajectoryPreviewFollowsContract =
    trajectory.trajectory_version ===
      "durable_perspective_trajectory_preview.v0.1" &&
    allEventFamiliesPresent &&
    unknownFamilyKinds.length === 0 &&
    !missingFamilyKind &&
    eventsRuntimeWriteNowFalse &&
    eventsSourceRefBacked &&
    eventsPreserveLineage &&
    allEventsPublicSafe;
  const failureCodes = [
    missingFamilyKind ? "trajectory_event_missing_family_kind" : null,
    unknownFamilyKinds.length === 0
      ? null
      : "trajectory_event_unknown_family_kind",
    eventsSourceRefBacked ? null : "trajectory_event_missing_source_refs",
    eventsPreserveLineage ? null : "trajectory_event_missing_lineage_refs",
    eventsRuntimeWriteNowFalse ? null : "trajectory_event_runtime_write_enabled",
    allEventFamiliesPresent ? null : "trajectory_missing_event_family",
    allEventsPublicSafe ? null : "trajectory_not_public_safe",
  ];
  return {
    trajectory_preview_follows_contract: trajectoryPreviewFollowsContract,
    all_event_families_present: allEventFamiliesPresent,
    events_runtime_write_now_false: eventsRuntimeWriteNowFalse,
    events_source_ref_backed: eventsSourceRefBacked,
    events_preserve_lineage: eventsPreserveLineage,
    all_events_public_safe: allEventsPublicSafe,
    required_promotion_record_refs_present:
      requiredPromotionRecordRefsPresent,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function validateSnapshotPreview(snapshot: PerspectiveSnapshotPreview & JsonRecord) {
  const snapshotIndependentSourceOfTruthEnabled =
    snapshot.snapshot_independent_source_of_truth === true ||
    snapshot.snapshot_not_independent_source_of_truth === false;
  const snapshotPreviewFollowsContract =
    snapshot.snapshot_version === "perspective_snapshot_preview.v0.1" &&
    snapshot.snapshot_is_derived_view === true &&
    snapshot.snapshot_runtime_now === false &&
    snapshot.includes_lineage_refs === true &&
    snapshot.includes_current_thesis === true &&
    snapshot.includes_prior_theses === true &&
    snapshot.includes_active_claims === true &&
    snapshot.includes_supporting_and_contradicting_evidence_refs === true &&
    snapshot.includes_open_tensions === true &&
    snapshot.includes_knowledge_gaps === true &&
    snapshot.includes_authority_boundary === true &&
    !snapshotIndependentSourceOfTruthEnabled;
  const failureCodes = [
    snapshot.snapshot_is_derived_view === true
      ? null
      : "snapshot_not_derived_view",
    snapshot.snapshot_runtime_now === false ? null : "snapshot_runtime_enabled",
    snapshot.includes_lineage_refs === true
      ? null
      : "snapshot_missing_lineage_refs",
    snapshot.includes_current_thesis === true
      ? null
      : "snapshot_missing_current_thesis",
    snapshot.includes_prior_theses === true
      ? null
      : "snapshot_missing_prior_theses",
    snapshot.includes_active_claims === true
      ? null
      : "snapshot_missing_active_claims",
    snapshot.includes_supporting_and_contradicting_evidence_refs === true
      ? null
      : "snapshot_missing_supporting_and_contradicting_evidence_refs",
    snapshot.includes_open_tensions === true
      ? null
      : "snapshot_missing_open_tensions",
    snapshot.includes_knowledge_gaps === true
      ? null
      : "snapshot_missing_knowledge_gaps",
    snapshot.includes_authority_boundary === true
      ? null
      : "snapshot_missing_authority_boundary",
    snapshotIndependentSourceOfTruthEnabled
      ? "snapshot_independent_source_of_truth_enabled"
      : null,
  ];
  return {
    snapshot_preview_follows_contract: snapshotPreviewFollowsContract,
    snapshot_runtime_now_false: snapshot.snapshot_runtime_now === false,
    snapshot_is_derived_view: snapshot.snapshot_is_derived_view === true,
    snapshot_not_independent_source_of_truth:
      !snapshotIndependentSourceOfTruthEnabled,
    includes_lineage_refs: snapshot.includes_lineage_refs === true,
    includes_open_tensions: snapshot.includes_open_tensions === true,
    includes_knowledge_gaps: snapshot.includes_knowledge_gaps === true,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function validateAllReferences(
  state: DurablePerspectiveStatePreview,
  trajectory: DurablePerspectiveTrajectoryPreview,
  privacyPolicy: DurablePerspectiveStateTrajectoryPrivacyPolicy,
) {
  const refs = collectRefs(state, trajectory);
  const allRefsStable = refs.every(publicSafeRefIsStable);
  const noRawPrivateSourceBody =
    privacyPolicy.no_raw_source_body === true &&
    !canonicalJson(state).toLowerCase().includes("raw_private_source_body");
  const noRawProviderThreadRunSessionIds =
    privacyPolicy.no_raw_provider_thread_run_session_ids === true &&
    !refs.some(isRawProviderThreadRunSessionRef);
  const noPrivateUrls =
    privacyPolicy.no_private_urls === true &&
    !refs.some((ref) => /^https?:\/\//i.test(ref) || ref.includes("://"));
  const noSecrets =
    privacyPolicy.no_secrets_in_fixture === true &&
    !refs.some((ref) => /secret|token|sk-/i.test(ref));
  const sourceRefsPresent =
    collectSourceRefs(state, trajectory).length > 0;
  const perspectiveIdPresent = hasText(state.perspective_id);
  const activeClaims = Array.isArray(state.active_claims)
    ? state.active_claims
    : [];
  const acceptedEvidenceRefMissingForSupportedClaim = activeClaims.some(
    (claim) =>
      Array.isArray(claim.supporting_evidence_refs) &&
      claim.supporting_evidence_refs.some(
        (ref) => !ref.startsWith("accepted_evidence_ref:public:"),
      ),
  );
  const candidateEvidenceUsedAsAcceptedEvidence = refs.some((ref) =>
    ref.startsWith("candidate_evidence_ref:"),
  );
  const publicSafeRefsOnly =
    allRefsStable &&
    perspectiveIdPresent &&
    sourceRefsPresent &&
    !acceptedEvidenceRefMissingForSupportedClaim &&
    !candidateEvidenceUsedAsAcceptedEvidence &&
    noRawPrivateSourceBody &&
    noRawProviderThreadRunSessionIds &&
    noPrivateUrls &&
    noSecrets;
  const failureCodes = [
    perspectiveIdPresent ? null : "perspective_id_missing",
    allRefsStable ? null : "private_or_unstable_ref_detected",
    sourceRefsPresent ? null : "source_refs_missing",
    acceptedEvidenceRefMissingForSupportedClaim
      ? "accepted_evidence_ref_missing_for_supported_claim"
      : null,
    candidateEvidenceUsedAsAcceptedEvidence
      ? "candidate_evidence_used_as_accepted_evidence"
      : null,
    noRawPrivateSourceBody ? null : "raw_private_source_body_detected",
    noRawProviderThreadRunSessionIds
      ? null
      : "raw_provider_thread_run_session_id_detected",
  ];
  return {
    public_safe_refs_only: publicSafeRefsOnly,
    candidate_evidence_not_accepted_evidence:
      !candidateEvidenceUsedAsAcceptedEvidence,
    no_raw_private_source_body: noRawPrivateSourceBody,
    no_raw_provider_thread_run_session_ids: noRawProviderThreadRunSessionIds,
    no_private_urls: noPrivateUrls,
    no_secrets: noSecrets,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function validateTrajectoryEventFamilies(
  families: DurablePerspectiveTrajectoryEventFamily[],
): boolean {
  return (
    deepEqual(
      families.map((family) => family.event_kind),
      expectedTrajectoryEventKinds,
    ) &&
    families.every((family) => family.runtime_write_now === false)
  );
}

function validateImplementationAuthorityBoundary(
  boundary: Partial<DurablePerspectiveStateTrajectoryImplementationAuthorityBoundary>,
): string[] {
  const codeByField: Record<string, string> = {
    runtime_state_write_implemented_now: "runtime_state_write_enabled",
    runtime_state_read_implemented_now: "runtime_state_read_enabled",
    durable_perspective_state_write_now:
      "durable_perspective_state_write_enabled",
    durable_perspective_delta_apply_now:
      "durable_perspective_delta_apply_enabled",
    perspective_snapshot_runtime_implemented_now:
      "perspective_snapshot_runtime_enabled",
    trajectory_runtime_build_implemented_now:
      "trajectory_runtime_build_enabled",
    promotion_history_write_now: "promotion_history_write_enabled",
    retirement_history_write_now: "retirement_history_write_enabled",
    proof_or_evidence_record_write_now:
      "proof_or_evidence_record_write_enabled",
    accepted_evidence_write_now: "accepted_evidence_write_enabled",
    formation_receipt_write_now: "formation_receipt_write_enabled",
    work_mutation_now: "work_mutation_enabled",
    runtime_db_query_now: "runtime_db_query_enabled",
    production_db_used_now: "runtime_db_query_enabled",
    runtime_db_write_now: "runtime_db_write_enabled",
    provider_openai_call_now: "provider_openai_call_enabled",
    provider_openai_authority: "provider_openai_call_enabled",
    runtime_retrieval_rag_implemented_now: "retrieval_rag_execution_enabled",
    retrieval_rag_authority: "retrieval_rag_execution_enabled",
    source_fetch_now: "source_fetch_enabled",
    source_fetch_authority: "source_fetch_enabled",
    crawler_now: "crawler_enabled",
    product_write_authority: "product_write_enabled",
    product_id_allocation_authority: "product_id_allocation_enabled",
  };
  return uniqueSorted(
    Object.entries(codeByField).map(([field, code]) =>
      boundary[field as keyof typeof boundary] === true ? code : null,
    ),
  );
}

function claimHasSupportingOrContradictingEvidence(
  claim: DurablePerspectiveClaimPreview,
): boolean {
  return (
    (Array.isArray(claim.supporting_evidence_refs) &&
      claim.supporting_evidence_refs.length > 0) ||
    (Array.isArray(claim.contradicting_evidence_refs) &&
      claim.contradicting_evidence_refs.length > 0)
  );
}

function acceptedEvidenceRefsRequiredForClaims(
  claims: DurablePerspectiveClaimPreview[],
): boolean {
  return claims.every((claim) =>
    claim.supporting_evidence_refs.every((ref) =>
      ref.startsWith("accepted_evidence_ref:public:"),
    ),
  );
}

function refsDistinct(left: string[], right: string[]): boolean {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length > 0 &&
    right.length > 0 &&
    !left.some((ref) => right.includes(ref))
  );
}

function collectSourceRefs(
  state: DurablePerspectiveStatePreview,
  trajectory: DurablePerspectiveTrajectoryPreview,
): string[] {
  return collectRefs(state, trajectory).filter((ref) =>
    ref.startsWith("source_ref:public:"),
  );
}

function collectRefs(
  state: DurablePerspectiveStatePreview,
  trajectory: DurablePerspectiveTrajectoryPreview,
): string[] {
  const values = [
    state.perspective_id,
    state.current_thesis?.thesis_ref,
    ...(state.current_thesis?.lineage_refs ?? []),
    ...(state.current_thesis?.promotion_record_refs ?? []),
    ...(state.current_thesis?.source_refs ?? []),
    ...(state.prior_theses ?? []).flatMap((thesis) => [
      thesis.thesis_ref,
      thesis.retired_or_superseded_by_ref,
      ...(thesis.lineage_refs ?? []),
    ]),
    ...(state.active_claims ?? []).flatMap((claim) => [
      claim.claim_ref,
      ...(claim.supporting_evidence_refs ?? []),
      ...(claim.contradicting_evidence_refs ?? []),
      ...(claim.source_refs ?? []),
    ]),
    ...(state.supporting_evidence_refs ?? []),
    ...(state.contradicting_evidence_refs ?? []),
    ...(state.open_tensions ?? []).flatMap((tension) => [
      tension.tension_ref,
      ...(tension.source_refs ?? []),
    ]),
    ...(state.knowledge_gaps ?? []).flatMap((gap) => [
      gap.knowledge_gap_ref,
      ...(gap.source_refs ?? []),
    ]),
    state.salience_state?.salience_state_ref,
    ...(state.promotion_history ?? []).flatMap((record) => [
      record.promotion_record_ref,
      ...(record.source_refs ?? []),
    ]),
    ...(state.retirement_history ?? []).flatMap((record) => [
      record.retirement_record_ref,
      record.retired_claim_ref,
    ]),
    ...(state.reuse_conditions ?? []).flatMap((condition) => [
      condition.reuse_condition_ref,
      ...(condition.lineage_refs ?? []),
    ]),
    ...(trajectory.trajectory_events ?? []).flatMap(collectEventRefs),
  ];
  return values.filter(hasText);
}

function collectEventRefs(event: {
  event_ref?: string;
  source_refs?: string[];
  promotion_record_refs?: string[];
  lineage_refs?: string[];
}): string[] {
  return [
    event.event_ref,
    ...(event.source_refs ?? []),
    ...(event.promotion_record_refs ?? []),
    ...(event.lineage_refs ?? []),
  ].filter(hasText);
}

function countRefsWithPrefix(refs: string[], prefix: string): number {
  return refs.filter((ref) => ref.startsWith(prefix)).length;
}

function publicSafeRefIsStable(value: unknown): value is string {
  if (!hasText(value)) {
    return false;
  }
  const normalizedValue = value.toLowerCase();
  return (
    value.includes(":public:") &&
    !/^https?:\/\//i.test(value) &&
    !normalizedValue.includes("://") &&
    ![
      "private",
      "unstable",
      "secret",
      "token",
      "sk-",
      "raw",
      "localhost",
      "127.0.0.1",
      "thread_",
      "run_",
      "session_",
    ].some((blockedFragment) => normalizedValue.includes(blockedFragment))
  );
}

function isRawProviderThreadRunSessionRef(value: string): boolean {
  return /thread_|run_|session_/i.test(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueSorted(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort();
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
        .sort(([a], [b]) => a.localeCompare(b))
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
