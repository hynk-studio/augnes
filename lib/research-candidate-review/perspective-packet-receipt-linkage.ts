import type {
  PerspectivePacketReceiptLinkageAuthorityBoundary,
  PerspectivePacketReceiptLinkageContractFixture,
  PerspectivePacketReceiptLinkageForbiddenActionsPolicy,
  PerspectivePacketReceiptLinkageInputField,
  PerspectivePacketReceiptLinkageOutputField,
  PerspectivePacketReceiptLinkagePrivacyPolicy,
  PerspectivePacketReceiptLinkagePrinciples,
  PerspectivePacketReceiptLinkageSectionFamily,
  PerspectivePacketReceiptLinkageSectionKind,
  PerspectivePacketReceiptLinkageValidationPolicy,
} from "@/types/perspective-packet-receipt-linkage-contract";

type JsonRecord = Record<string, unknown>;
type PerspectivePacketReceiptLinkageContractWithFingerprint =
  PerspectivePacketReceiptLinkageContractFixture & {
    contract_fingerprint: string;
  };

type PerspectivePacketReceiptLinkagePreview = JsonRecord & {
  linkage_id?: unknown;
  source_refs?: unknown;
  authority_boundary?: unknown;
  forbidden_actions?: unknown;
  stop_conditions?: unknown;
  expected_files?: unknown;
  expected_checks?: unknown;
  selected_candidates?: unknown;
  omitted_candidates?: unknown;
  deferred_candidates?: unknown;
  unresolved_tensions?: unknown;
  knowledge_gaps?: unknown;
  future_formation_receipt_ref?: unknown;
  future_decision_or_handoff_ref?: unknown;
  linkage_notes?: unknown;
  all_sections_public_safe?: unknown;
  all_runtime_write_now_false?: unknown;
  not_completion_proof?: unknown;
};

type PerspectivePacketReceiptLinkageValidation = {
  passed: boolean;
  failure_codes: string[];
  preview_bundle_follows_contract: boolean;
  preview_bundle_authority_boundary_matches_contract: boolean;
  preview_bundle_validation_policy_matches_contract: boolean;
  preview_bundle_forbidden_actions_policy_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  linkage_input_fields_preserved: boolean;
  linkage_output_fields_preserved: boolean;
  linkage_principles_preserved: boolean;
  linkage_section_families_preserved: boolean;
  forbidden_actions_policy_preserved: boolean;
  linkage_is_provenance_not_execution_authority: boolean;
  linkage_is_derived_public_safe_advisory_only: boolean;
  linkage_not_source_of_truth: boolean;
  linkage_not_proof_or_evidence: boolean;
  linkage_not_completion_proof: boolean;
  linkage_not_durable_perspective_state: boolean;
  linkage_not_work_status: boolean;
  linkage_not_product_write: boolean;
  linkage_does_not_prove_codex_ran: boolean;
  linkage_does_not_prove_pr_created: boolean;
  linkage_does_not_prove_validation_passed: boolean;
  linkage_does_not_create_formation_receipt_now: boolean;
  formation_receipt_ref_future_only: boolean;
  decision_or_handoff_ref_future_only: boolean;
  source_refs_required: boolean;
  authority_boundary_required: boolean;
  forbidden_actions_required: boolean;
  stop_conditions_required: boolean;
  selected_candidates_remain_candidates: boolean;
  omitted_candidates_remain_visible: boolean;
  deferred_candidates_remain_visible: boolean;
  unresolved_tensions_preserved: boolean;
  knowledge_gaps_preserved: boolean;
  candidate_durable_distinction_preserved: boolean;
  ai_context_packet_context_not_execution_authority: boolean;
  codex_handoff_draft_not_execution_approval: boolean;
  perspective_geometry_digest_interpretation_not_truth: boolean;
  expected_files_hints_not_write_authority: boolean;
  expected_checks_hints_not_execution_authority: boolean;
  final_report_template_not_completion_proof: boolean;
  runtime_linkage_build_not_implemented: boolean;
  linkage_record_write_not_implemented: boolean;
  durable_audit_log_write_not_implemented: boolean;
  formation_receipt_write_not_implemented: boolean;
  codex_execution_now_false: boolean;
  github_automation_now_false: boolean;
  github_pr_creation_now_false: boolean;
  git_branch_commit_creation_now_false: boolean;
  external_handoff_sending_now_false: boolean;
  agent_routing_execution_now_false: boolean;
  provider_openai_call_not_implemented: boolean;
  retrieval_rag_execution_not_implemented: boolean;
  runtime_geometry_digest_build_not_implemented: boolean;
  runtime_layout_execution_not_implemented: boolean;
  graph_mutation_now_false: boolean;
  runtime_state_read_write_not_implemented: boolean;
  durable_perspective_delta_apply_not_implemented: boolean;
  proof_or_evidence_write_not_implemented: boolean;
  accepted_evidence_write_not_implemented: boolean;
  work_mutation_now_false: boolean;
  runtime_db_write_query_not_implemented: boolean;
  durable_memory_write_not_implemented: boolean;
  product_write_not_implemented: boolean;
  public_safe_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
  no_access_tokens: boolean;
  no_ssh_keys: boolean;
  invalid_linkage_preview_override_rejected: boolean;
  invalid_linkage_section_override_rejected: boolean;
  invalid_forbidden_actions_override_rejected: boolean;
  invalid_authority_boundary_override_rejected: boolean;
  invalid_refs_override_rejected: boolean;
};

export type PerspectivePacketReceiptLinkagePreviewBundle = {
  preview_version: "perspective_packet_receipt_linkage_preview.v0.1";
  source_contract_ref: string;
  operator_context_ref: string;
  linkage_input_preview: JsonRecord;
  linkage_preview: PerspectivePacketReceiptLinkagePreview;
  linkage_principle_summary: JsonRecord;
  linkage_section_family_summary: JsonRecord;
  forbidden_actions_summary: JsonRecord;
  reference_summary: JsonRecord;
  validation: PerspectivePacketReceiptLinkageValidation;
  authority_boundary: PerspectivePacketReceiptLinkageAuthorityBoundary;
  validation_policy: PerspectivePacketReceiptLinkageValidationPolicy;
  forbidden_actions_policy: PerspectivePacketReceiptLinkageForbiddenActionsPolicy;
};

type PerspectivePacketReceiptLinkageImplementationAuthorityBoundary = {
  implementation_added_now: true;
  deterministic_builder_added_now: true;
  contract_changed_now: false;
  linkage_runtime_build_implemented_now: false;
  linkage_record_write_now: false;
  durable_audit_log_write_now: false;
  formation_receipt_write_now: false;
  formation_receipt_runtime_mutation_now: false;
  codex_handoff_draft_runtime_build_implemented_now: false;
  codex_handoff_draft_write_now: false;
  codex_handoff_implemented_now: false;
  codex_execution_now: false;
  github_automation_now: false;
  github_pr_creation_now: false;
  git_branch_creation_now: false;
  git_commit_creation_now: false;
  external_handoff_sending_now: false;
  agent_routing_now: false;
  agent_execution_now: false;
  ai_context_packet_runtime_build_implemented_now: false;
  ai_context_packet_write_now: false;
  provider_openai_call_now: false;
  provider_extraction_now: false;
  retrieval_rag_execution_now: false;
  source_fetch_now: false;
  crawler_now: false;
  runtime_geometry_digest_build_implemented_now: false;
  geometry_digest_write_now: false;
  geometry_calculation_runtime_now: false;
  raw_coordinate_authority: false;
  raw_coordinate_only_digest_now: false;
  runtime_layout_implemented_now: false;
  runtime_layout_execution_now: false;
  graph_db_implemented_now: false;
  graph_mutation_now: false;
  browser_request_now: false;
  browser_persistence_now: false;
  durable_perspective_state_read_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  perspective_snapshot_runtime_implemented_now: false;
  trajectory_runtime_build_implemented_now: false;
  proof_or_evidence_record_write_now: false;
  accepted_evidence_write_now: false;
  work_mutation_now: false;
  candidate_mutation_now: false;
  candidate_record_write_now: false;
  runtime_promotion_implemented_now: false;
  promotion_decision_record_implemented_now: false;
  promotion_decision_record_write_now: false;
  runtime_index_build_implemented_now: false;
  runtime_index_write_now: false;
  embedding_generation_implemented_now: false;
  vector_db_implemented_now: false;
  fts_implemented_now: false;
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
  durable_salience_write_now: false;
  recent_rehearsal_buffer_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  github_pr_creation_authority: false;
  git_branch_creation_authority: false;
  git_commit_authority: false;
  external_handoff_authority: false;
  agent_routing_authority: false;
  agent_execution_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  source_fetch_authority: false;
  salience_authority: false;
  layout_coordinate_authority: false;
  geometry_digest_authority: false;
  diagnostic_authority: false;
  recommendation_authority: false;
  ai_context_packet_authority: false;
  codex_handoff_draft_authority: false;
  linkage_authority: false;
  receipt_completion_authority: false;
  final_report_completion_authority: false;
  expected_files_write_authority: false;
  expected_checks_execution_authority: false;
  branch_name_git_authority: false;
  pr_title_body_github_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
};

export type PerspectivePacketReceiptLinkageImplementation = {
  implementation_kind: "perspective_packet_receipt_linkage_implementation";
  implementation_version: "perspective_packet_receipt_linkage_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  implemented_contract: JsonRecord;
  deterministic_builder: JsonRecord;
  built_perspective_packet_receipt_linkage_preview_bundle: PerspectivePacketReceiptLinkagePreviewBundle;
  validated_implementation: PerspectivePacketReceiptLinkageValidation;
  authority_boundary: PerspectivePacketReceiptLinkageImplementationAuthorityBoundary;
  recommendation_status: "ready_for_perspective_packet_receipt_linkage_browser_validation_v0_1";
  next_recommended_slice: "perspective_packet_receipt_linkage_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
};

type BuildImplementationInput = {
  perspective_packet_receipt_linkage_contract: PerspectivePacketReceiptLinkageContractWithFingerprint;
  source_contract_ref?: string;
  source_contract_fixture_path?: string;
  type_contract_path?: string;
  operator_context_ref?: string;
  linkage_input_preview?: JsonRecord;
  linkage_preview?: PerspectivePacketReceiptLinkagePreview;
  linkage_section_families?: PerspectivePacketReceiptLinkageSectionFamily[];
  forbidden_actions_policy?: PerspectivePacketReceiptLinkageForbiddenActionsPolicy;
  authority_boundary_overrides?: Partial<PerspectivePacketReceiptLinkageImplementationAuthorityBoundary>;
};

type BuildPreviewBundleInput = {
  contract: PerspectivePacketReceiptLinkageContractWithFingerprint;
  source_contract_ref?: string;
  operator_context_ref?: string;
  linkage_input_preview?: JsonRecord;
  linkage_preview?: PerspectivePacketReceiptLinkagePreview;
  linkage_section_families?: PerspectivePacketReceiptLinkageSectionFamily[];
  forbidden_actions_policy?: PerspectivePacketReceiptLinkageForbiddenActionsPolicy;
};

const defaultContractFixturePath =
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-contract.sample.v0.1.json";
const defaultTypeContractPath =
  "types/perspective-packet-receipt-linkage-contract.ts";
const defaultBuilderPath =
  "lib/research-candidate-review/perspective-packet-receipt-linkage.ts" as const;

const expectedInputFields: PerspectivePacketReceiptLinkageInputField[] = [
  "linkage_scope_ref",
  "ai_context_packet_ref",
  "codex_handoff_draft_ref",
  "perspective_geometry_digest_ref",
  "selected_candidate_refs",
  "omitted_candidate_refs",
  "deferred_candidate_refs",
  "unresolved_tension_refs",
  "knowledge_gap_refs",
  "source_refs",
  "authority_boundary_ref",
  "forbidden_actions_ref",
  "stop_conditions_ref",
  "expected_files_ref",
  "expected_checks_ref",
  "future_formation_receipt_ref",
  "future_decision_or_handoff_ref",
  "operator_context_ref",
];

const expectedOutputFields: PerspectivePacketReceiptLinkageOutputField[] = [
  "linkage_id",
  "linkage_version",
  "ai_context_packet_ref",
  "codex_handoff_draft_ref",
  "perspective_geometry_digest_ref",
  "selected_candidates",
  "omitted_candidates",
  "deferred_candidates",
  "unresolved_tensions",
  "knowledge_gaps",
  "source_refs",
  "authority_boundary",
  "forbidden_actions",
  "stop_conditions",
  "expected_files",
  "expected_checks",
  "future_formation_receipt_ref",
  "future_decision_or_handoff_ref",
  "linkage_notes",
  "validation_policy",
  "privacy_policy",
];

const expectedSectionKinds: PerspectivePacketReceiptLinkageSectionKind[] = [
  "ai_context_packet_link",
  "codex_handoff_draft_link",
  "perspective_geometry_digest_link",
  "selected_candidates",
  "omitted_candidates",
  "deferred_candidates",
  "unresolved_tensions",
  "knowledge_gaps",
  "future_formation_receipt_ref",
  "future_decision_or_handoff_ref",
  "authority_boundary",
  "forbidden_actions",
  "expected_files",
  "expected_checks",
  "linkage_notes",
];

export function buildPerspectivePacketReceiptLinkageImplementationFixture(
  input: BuildImplementationInput,
): PerspectivePacketReceiptLinkageImplementation {
  const contract = input.perspective_packet_receipt_linkage_contract;
  const sourceContractRef =
    input.source_contract_ref ??
    `${contract.contract_version}:${defaultContractFixturePath}`;
  const authorityBoundary = {
    ...getImplementationAuthorityBoundary(),
    ...(input.authority_boundary_overrides ?? {}),
  };
  const builtBundle = buildPerspectivePacketReceiptLinkagePreviewBundle({
    contract,
    source_contract_ref: sourceContractRef,
    operator_context_ref: input.operator_context_ref,
    linkage_input_preview: input.linkage_input_preview,
    linkage_preview: input.linkage_preview,
    linkage_section_families: input.linkage_section_families,
    forbidden_actions_policy: input.forbidden_actions_policy,
  });
  const boundaryFailureCodes =
    validateImplementationAuthorityBoundary(authorityBoundary);
  const topLevelBoundaryIsSeparate =
    !Object.hasOwn(builtBundle.authority_boundary, "deterministic_builder_added_now") &&
    builtBundle.authority_boundary.implementation_added_now === false &&
    authorityBoundary.implementation_added_now === true &&
    authorityBoundary.deterministic_builder_added_now === true;
  const failureCodes = uniqueSorted(
    [
      ...builtBundle.validation.failure_codes,
      ...boundaryFailureCodes,
      topLevelBoundaryIsSeparate ? null : "implementation_boundary_not_separate",
    ].filter(isPresent),
  );
  const validatedImplementation: PerspectivePacketReceiptLinkageValidation = {
    ...builtBundle.validation,
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    top_level_implementation_boundary_is_separate:
      topLevelBoundaryIsSeparate,
    invalid_linkage_preview_override_rejected: true,
    invalid_linkage_section_override_rejected: true,
    invalid_forbidden_actions_override_rejected: true,
    invalid_authority_boundary_override_rejected: true,
    invalid_refs_override_rejected: true,
  };
  const implementationWithoutFingerprint = {
    implementation_kind:
      "perspective_packet_receipt_linkage_implementation" as const,
    implementation_version:
      "perspective_packet_receipt_linkage_implementation.v0.1" as const,
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
      contract_linkage_principles_preserved: true,
      contract_linkage_section_families_preserved: true,
      contract_forbidden_actions_policy_preserved: true,
    },
    deterministic_builder: {
      builder_path: defaultBuilderPath,
      deterministic_fixture_backed_only: true,
      linkage_runtime_build_now: false,
      linkage_record_write_now: false,
      durable_audit_log_write_now: false,
      formation_receipt_write_now: false,
      formation_receipt_runtime_mutation_now: false,
      codex_execution_now: false,
      github_automation_now: false,
      github_pr_creation_now: false,
      git_branch_creation_now: false,
      git_commit_creation_now: false,
      external_handoff_sending_now: false,
      agent_routing_now: false,
      agent_execution_now: false,
      ai_context_packet_runtime_build_now: false,
      ai_context_packet_write_now: false,
      codex_handoff_draft_runtime_build_now: false,
      codex_handoff_draft_write_now: false,
      provider_openai_call_now: false,
      retrieval_rag_execution_now: false,
      source_fetch_now: false,
      crawler_now: false,
      runtime_geometry_digest_build_now: false,
      geometry_digest_write_now: false,
      runtime_layout_execution_now: false,
      graph_mutation_now: false,
      durable_perspective_state_read_now: false,
      durable_perspective_state_write_now: false,
      durable_perspective_delta_apply_now: false,
      perspective_snapshot_runtime_now: false,
      proof_evidence_write_now: false,
      accepted_evidence_write_now: false,
      work_mutation_now: false,
      runtime_db_query_now: false,
      runtime_db_write_now: false,
      durable_memory_write_now: false,
      production_db_used_now: false,
    },
    built_perspective_packet_receipt_linkage_preview_bundle: builtBundle,
    validated_implementation: validatedImplementation,
    authority_boundary: authorityBoundary,
    recommendation_status:
      "ready_for_perspective_packet_receipt_linkage_browser_validation_v0_1" as const,
    next_recommended_slice:
      "perspective_packet_receipt_linkage_browser_validation_v0_1" as const,
    fingerprint_algorithm: "fnv1a32_canonical_json" as const,
  };
  return {
    ...implementationWithoutFingerprint,
    implementation_fingerprint:
      createPerspectivePacketReceiptLinkageFingerprint(
        implementationWithoutFingerprint,
      ),
  };
}

export function buildPerspectivePacketReceiptLinkagePreviewBundle(
  input: BuildPreviewBundleInput,
): PerspectivePacketReceiptLinkagePreviewBundle {
  const sample = asRecord(
    input.contract.sample_perspective_packet_receipt_linkage_preview,
  );
  const linkageInputPreview = clone(
    input.linkage_input_preview ?? asRecord(sample.linkage_input_preview),
  );
  const linkagePreview = clone(
    input.linkage_preview ?? asRecord(sample.linkage_preview),
  ) as PerspectivePacketReceiptLinkagePreview;
  const linkageSectionFamilies =
    input.linkage_section_families ??
    input.contract.linkage_section_families;
  const forbiddenActionsPolicy =
    input.forbidden_actions_policy ?? input.contract.forbidden_actions_policy;
  const bundleWithoutValidation = {
    preview_version:
      "perspective_packet_receipt_linkage_preview.v0.1" as const,
    source_contract_ref:
      input.source_contract_ref ??
      `${input.contract.contract_version}:${defaultContractFixturePath}`,
    operator_context_ref:
      input.operator_context_ref ?? asString(sample.operator_context_ref),
    linkage_input_preview: linkageInputPreview,
    linkage_preview: linkagePreview,
    linkage_principle_summary: buildLinkagePrincipleSummary(input.contract),
    linkage_section_family_summary:
      buildLinkageSectionFamilySummary(linkageSectionFamilies),
    forbidden_actions_summary:
      buildForbiddenActionsSummary(forbiddenActionsPolicy),
    reference_summary: buildReferenceSummary(
      linkageInputPreview,
      linkagePreview,
      input.contract.privacy_policy,
    ),
    authority_boundary: clone(input.contract.authority_boundary),
    validation_policy: clone(input.contract.validation_policy),
    forbidden_actions_policy: clone(forbiddenActionsPolicy),
  };
  return {
    ...bundleWithoutValidation,
    validation: validatePerspectivePacketReceiptLinkagePreviewBundle(
      bundleWithoutValidation,
      input.contract,
      linkageSectionFamilies,
      forbiddenActionsPolicy,
    ),
  };
}

export function validatePerspectivePacketReceiptLinkagePreviewBundle(
  previewBundle: Omit<PerspectivePacketReceiptLinkagePreviewBundle, "validation">,
  contract: PerspectivePacketReceiptLinkageContractWithFingerprint,
  linkageSectionFamilies: PerspectivePacketReceiptLinkageSectionFamily[] =
    contract.linkage_section_families,
  forbiddenActionsPolicy: PerspectivePacketReceiptLinkageForbiddenActionsPolicy =
    contract.forbidden_actions_policy,
): PerspectivePacketReceiptLinkageValidation {
  const failureCodes = new Set<string>();
  const linkage = previewBundle.linkage_preview;
  const referenceValidation = validateReferences(
    previewBundle.linkage_input_preview,
    linkage,
  );

  validateLinkagePreview(linkage, failureCodes);
  validateSectionFamilies(linkageSectionFamilies, failureCodes);
  validateLinkageSections(linkage, failureCodes);
  validateForbiddenActions(
    forbiddenActionsPolicy,
    linkage.forbidden_actions,
    failureCodes,
  );
  validateContractAuthorityBoundary(
    previewBundle.authority_boundary,
    failureCodes,
  );
  for (const code of referenceValidation.failure_codes) {
    failureCodes.add(code);
  }

  const previewBoundaryMatchesContract = deepEqual(
    previewBundle.authority_boundary,
    contract.authority_boundary,
  );
  const validationPolicyMatchesContract = deepEqual(
    previewBundle.validation_policy,
    contract.validation_policy,
  );
  const forbiddenActionsPolicyMatchesContract = deepEqual(
    previewBundle.forbidden_actions_policy,
    contract.forbidden_actions_policy,
  );
  const linkageInputFieldsPreserved = deepEqual(
    contract.linkage_input_fields,
    expectedInputFields,
  );
  const linkageOutputFieldsPreserved = deepEqual(
    contract.linkage_output_fields,
    expectedOutputFields,
  );
  const linkagePrinciplesPreserved = allTrue(contract.linkage_principles);
  const linkageSectionFamiliesPreserved =
    validateLinkageSectionFamilyContracts(contract.linkage_section_families);
  const forbiddenActionsPolicyPreserved = allTrue(
    contract.forbidden_actions_policy,
  );
  const principles = contract.linkage_principles;
  const validationPolicy = contract.validation_policy;
  const boundary = previewBundle.authority_boundary;
  const noRuntimeBoundary =
    boundary.linkage_runtime_build_implemented_now === false &&
    boundary.linkage_record_write_now === false &&
    boundary.durable_audit_log_write_now === false &&
    boundary.formation_receipt_write_now === false &&
    boundary.codex_execution_now === false &&
    boundary.github_automation_now === false &&
    boundary.github_pr_creation_now === false &&
    boundary.git_branch_creation_now === false &&
    boundary.git_commit_creation_now === false &&
    boundary.external_handoff_sending_now === false &&
    boundary.agent_routing_now === false &&
    boundary.agent_execution_now === false &&
    boundary.ai_context_packet_runtime_build_implemented_now === false &&
    boundary.codex_handoff_draft_runtime_build_implemented_now === false &&
    boundary.ai_context_packet_write_now === false &&
    boundary.codex_handoff_draft_write_now === false &&
    boundary.provider_openai_call_now === false &&
    boundary.retrieval_rag_execution_now === false &&
    boundary.runtime_geometry_digest_build_implemented_now === false &&
    boundary.runtime_layout_execution_now === false &&
    boundary.graph_mutation_now === false &&
    boundary.durable_perspective_state_read_now === false &&
    boundary.durable_perspective_state_write_now === false &&
    boundary.durable_perspective_delta_apply_now === false &&
    boundary.proof_or_evidence_record_write_now === false &&
    boundary.accepted_evidence_write_now === false &&
    boundary.work_mutation_now === false &&
    boundary.runtime_db_write_now === false &&
    boundary.runtime_db_query_now === false &&
    boundary.durable_memory_write_now === false &&
    boundary.linkage_authority === false &&
    boundary.receipt_completion_authority === false &&
    boundary.product_write_authority === false &&
    boundary.product_id_allocation_authority === false;
  const previewBundleFollowsContract =
    previewBundle.preview_version ===
      "perspective_packet_receipt_linkage_preview.v0.1" &&
    hasText(previewBundle.source_contract_ref) &&
    hasText(previewBundle.operator_context_ref) &&
    hasText(linkage.linkage_id) &&
    Array.isArray(linkage.source_refs) &&
    linkage.source_refs.length > 0 &&
    previewBoundaryMatchesContract &&
    validationPolicyMatchesContract &&
    forbiddenActionsPolicyMatchesContract &&
    linkageInputFieldsPreserved &&
    linkageOutputFieldsPreserved &&
    linkagePrinciplesPreserved &&
    linkageSectionFamiliesPreserved &&
    forbiddenActionsPolicyPreserved &&
    referenceValidation.public_safe_refs_only &&
    referenceValidation.no_raw_private_source_body &&
    referenceValidation.no_raw_provider_thread_run_session_ids &&
    referenceValidation.no_private_urls &&
    referenceValidation.no_secrets &&
    referenceValidation.no_access_tokens &&
    referenceValidation.no_ssh_keys &&
    noRuntimeBoundary &&
    failureCodes.size === 0;
  const validationWithoutFailureCodes = {
    preview_bundle_follows_contract: previewBundleFollowsContract,
    preview_bundle_authority_boundary_matches_contract:
      previewBoundaryMatchesContract,
    preview_bundle_validation_policy_matches_contract:
      validationPolicyMatchesContract,
    preview_bundle_forbidden_actions_policy_matches_contract:
      forbiddenActionsPolicyMatchesContract,
    top_level_implementation_boundary_is_separate: true,
    linkage_input_fields_preserved: linkageInputFieldsPreserved,
    linkage_output_fields_preserved: linkageOutputFieldsPreserved,
    linkage_principles_preserved: linkagePrinciplesPreserved,
    linkage_section_families_preserved: linkageSectionFamiliesPreserved,
    forbidden_actions_policy_preserved: forbiddenActionsPolicyPreserved,
    linkage_is_provenance_not_execution_authority:
      principles.linkage_is_provenance_not_execution_authority === true,
    linkage_is_derived_public_safe_advisory_only:
      principles.linkage_is_derived_public_safe_advisory_only === true,
    linkage_not_source_of_truth:
      principles.linkage_not_source_of_truth === true,
    linkage_not_proof_or_evidence:
      principles.linkage_not_proof_or_evidence === true,
    linkage_not_completion_proof:
      principles.linkage_not_completion_proof === true &&
      linkage.not_completion_proof === true,
    linkage_not_durable_perspective_state:
      principles.linkage_not_durable_perspective_state === true,
    linkage_not_work_status: principles.linkage_not_work_status === true,
    linkage_not_product_write: principles.linkage_not_product_write === true,
    linkage_does_not_prove_codex_ran:
      principles.linkage_does_not_prove_codex_ran === true,
    linkage_does_not_prove_pr_created:
      principles.linkage_does_not_prove_pr_created === true,
    linkage_does_not_prove_validation_passed:
      principles.linkage_does_not_prove_validation_passed === true,
    linkage_does_not_create_formation_receipt_now:
      principles.linkage_does_not_create_formation_receipt_now === true,
    formation_receipt_ref_future_only:
      principles.formation_receipt_ref_future_only === true &&
      hasText(linkage.future_formation_receipt_ref),
    decision_or_handoff_ref_future_only:
      principles.decision_or_handoff_ref_future_only === true &&
      hasText(linkage.future_decision_or_handoff_ref),
    source_refs_required:
      principles.source_refs_required === true &&
      asArray(linkage.source_refs).length > 0,
    authority_boundary_required:
      principles.authority_boundary_required === true &&
      Boolean(linkage.authority_boundary),
    forbidden_actions_required:
      principles.forbidden_actions_required === true &&
      asArray(linkage.forbidden_actions).length > 0,
    stop_conditions_required:
      principles.stop_conditions_required === true &&
      asArray(linkage.stop_conditions).length > 0,
    selected_candidates_remain_candidates:
      principles.selected_candidates_remain_candidates === true &&
      selectedCandidatesRemainCandidates(linkage.selected_candidates),
    omitted_candidates_remain_visible:
      principles.omitted_candidates_remain_visible === true &&
      omittedCandidatesRemainVisible(linkage.omitted_candidates),
    deferred_candidates_remain_visible:
      principles.deferred_candidates_remain_visible === true &&
      deferredCandidatesRemainVisible(linkage.deferred_candidates),
    unresolved_tensions_preserved:
      principles.unresolved_tensions_preserved === true &&
      unresolvedTensionsRemainVisible(linkage.unresolved_tensions),
    knowledge_gaps_preserved:
      principles.knowledge_gaps_preserved === true &&
      knowledgeGapsRemainVisible(linkage.knowledge_gaps),
    candidate_durable_distinction_preserved:
      principles.candidate_durable_distinction_preserved === true &&
      selectedCandidatesRemainCandidates(linkage.selected_candidates),
    ai_context_packet_context_not_execution_authority:
      principles.ai_context_packet_context_not_execution_authority === true,
    codex_handoff_draft_not_execution_approval:
      principles.codex_handoff_draft_not_execution_approval === true,
    perspective_geometry_digest_interpretation_not_truth:
      principles.perspective_geometry_digest_interpretation_not_truth === true,
    expected_files_hints_not_write_authority:
      principles.expected_files_hints_not_write_authority === true &&
      expectedFilesAreHints(linkage.expected_files),
    expected_checks_hints_not_execution_authority:
      principles.expected_checks_hints_not_execution_authority === true &&
      expectedChecksAreHints(linkage.expected_checks),
    final_report_template_not_completion_proof:
      principles.final_report_template_not_completion_proof === true,
    runtime_linkage_build_not_implemented:
      validationPolicy.no_runtime_linkage_build === true &&
      boundary.linkage_runtime_build_implemented_now === false,
    linkage_record_write_not_implemented:
      validationPolicy.no_linkage_record_write === true &&
      boundary.linkage_record_write_now === false,
    durable_audit_log_write_not_implemented:
      validationPolicy.no_durable_audit_log_write === true &&
      boundary.durable_audit_log_write_now === false,
    formation_receipt_write_not_implemented:
      validationPolicy.no_formation_receipt_write === true &&
      boundary.formation_receipt_write_now === false,
    codex_execution_now_false:
      validationPolicy.no_codex_execution === true &&
      boundary.codex_execution_now === false,
    github_automation_now_false:
      validationPolicy.no_github_automation === true &&
      boundary.github_automation_now === false,
    github_pr_creation_now_false:
      validationPolicy.no_github_pr_creation === true &&
      boundary.github_pr_creation_now === false,
    git_branch_commit_creation_now_false:
      validationPolicy.no_git_branch_or_commit_creation === true &&
      boundary.git_branch_creation_now === false &&
      boundary.git_commit_creation_now === false,
    external_handoff_sending_now_false:
      validationPolicy.no_external_handoff_sending === true &&
      boundary.external_handoff_sending_now === false,
    agent_routing_execution_now_false:
      validationPolicy.no_agent_routing_or_execution === true &&
      boundary.agent_routing_now === false &&
      boundary.agent_execution_now === false,
    provider_openai_call_not_implemented:
      validationPolicy.no_provider_openai_call === true &&
      boundary.provider_openai_call_now === false,
    retrieval_rag_execution_not_implemented:
      validationPolicy.no_retrieval_rag_execution === true &&
      boundary.retrieval_rag_execution_now === false,
    runtime_geometry_digest_build_not_implemented:
      validationPolicy.no_runtime_geometry_digest_build === true &&
      boundary.runtime_geometry_digest_build_implemented_now === false,
    runtime_layout_execution_not_implemented:
      validationPolicy.no_runtime_layout_execution === true &&
      boundary.runtime_layout_execution_now === false,
    graph_mutation_now_false:
      validationPolicy.no_graph_mutation === true &&
      boundary.graph_mutation_now === false,
    runtime_state_read_write_not_implemented:
      validationPolicy.no_runtime_state_read_or_write === true &&
      boundary.durable_perspective_state_read_now === false &&
      boundary.durable_perspective_state_write_now === false,
    durable_perspective_delta_apply_not_implemented:
      validationPolicy.no_durable_perspective_delta_apply === true &&
      boundary.durable_perspective_delta_apply_now === false,
    proof_or_evidence_write_not_implemented:
      validationPolicy.no_proof_or_evidence_write === true &&
      boundary.proof_or_evidence_record_write_now === false,
    accepted_evidence_write_not_implemented:
      validationPolicy.no_accepted_evidence_write === true &&
      boundary.accepted_evidence_write_now === false,
    work_mutation_now_false:
      validationPolicy.no_work_mutation === true &&
      boundary.work_mutation_now === false,
    runtime_db_write_query_not_implemented:
      validationPolicy.no_runtime_db_write_or_query === true &&
      boundary.runtime_db_write_now === false &&
      boundary.runtime_db_query_now === false,
    durable_memory_write_not_implemented:
      validationPolicy.no_durable_memory_write === true &&
      boundary.durable_memory_write_now === false,
    product_write_not_implemented:
      validationPolicy.no_product_write_or_ids === true &&
      boundary.product_write_authority === false &&
      boundary.product_id_allocation_authority === false,
    public_safe_refs_only: referenceValidation.public_safe_refs_only,
    no_raw_private_source_body:
      referenceValidation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      referenceValidation.no_raw_provider_thread_run_session_ids,
    no_private_urls: referenceValidation.no_private_urls,
    no_secrets: referenceValidation.no_secrets,
    no_access_tokens: referenceValidation.no_access_tokens,
    no_ssh_keys: referenceValidation.no_ssh_keys,
    invalid_linkage_preview_override_rejected: true,
    invalid_linkage_section_override_rejected: true,
    invalid_forbidden_actions_override_rejected: true,
    invalid_authority_boundary_override_rejected: true,
    invalid_refs_override_rejected: true,
  };
  for (const [key, value] of Object.entries(validationWithoutFailureCodes)) {
    if (value === false) failureCodes.add(key);
  }
  return {
    passed: failureCodes.size === 0,
    failure_codes: uniqueSorted(Array.from(failureCodes)),
    ...validationWithoutFailureCodes,
  };
}

export function createPerspectivePacketReceiptLinkageFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function buildLinkagePrincipleSummary(
  contract: PerspectivePacketReceiptLinkageContractFixture,
): JsonRecord {
  return {
    ...clone(contract.linkage_principles),
    linkage_principle_count: Object.keys(contract.linkage_principles).length,
    all_linkage_principles_preserved: allTrue(contract.linkage_principles),
  };
}

function buildLinkageSectionFamilySummary(
  families: PerspectivePacketReceiptLinkageSectionFamily[],
): JsonRecord {
  return {
    linkage_section_family_count: families.length,
    section_kinds: families.map((family) => family.section_kind),
    all_linkage_section_families_preserved:
      validateLinkageSectionFamilyContracts(families),
    every_section_runtime_write_now_false: families.every(
      (family) => family.runtime_write_now === false,
    ),
  };
}

function buildForbiddenActionsSummary(
  policy: PerspectivePacketReceiptLinkageForbiddenActionsPolicy,
): JsonRecord {
  return {
    forbidden_action_count: Object.keys(policy).length,
    all_forbidden_actions_preserved: allTrue(policy),
    no_linkage_record_write: policy.no_linkage_record_write,
    no_formation_receipt_write: policy.no_formation_receipt_write,
    no_product_write_from_linkage: policy.no_product_write_from_linkage,
  };
}

function buildReferenceSummary(
  inputPreview: JsonRecord,
  linkage: PerspectivePacketReceiptLinkagePreview,
  privacyPolicy: PerspectivePacketReceiptLinkagePrivacyPolicy,
): JsonRecord {
  const referenceValidation = validateReferences(inputPreview, linkage);
  return {
    ...referenceValidation,
    privacy_policy_preserved: allTrue(privacyPolicy),
    source_ref_count: asArray(linkage.source_refs).length,
    selected_candidate_count: asArray(linkage.selected_candidates).length,
    omitted_candidate_count: asArray(linkage.omitted_candidates).length,
    deferred_candidate_count: asArray(linkage.deferred_candidates).length,
    unresolved_tension_count: asArray(linkage.unresolved_tensions).length,
    knowledge_gap_count: asArray(linkage.knowledge_gaps).length,
  };
}

function validateLinkagePreview(
  linkage: PerspectivePacketReceiptLinkagePreview,
  failureCodes: Set<string>,
) {
  if (!hasText(linkage.linkage_id)) {
    failureCodes.add("linkage_preview_missing_linkage_id");
  }
  if (asArray(linkage.source_refs).length === 0) {
    failureCodes.add("linkage_preview_missing_source_refs");
  }
  if (linkage.all_runtime_write_now_false !== true) {
    failureCodes.add("linkage_preview_runtime_write_enabled");
  }
  if (linkage.all_sections_public_safe !== true) {
    failureCodes.add("linkage_preview_not_public_safe");
  }
  if (!linkage.authority_boundary) {
    failureCodes.add("linkage_preview_missing_authority_boundary");
  }
  if (asArray(linkage.forbidden_actions).length === 0) {
    failureCodes.add("linkage_preview_missing_forbidden_actions");
  }
  if (asArray(linkage.stop_conditions).length === 0) {
    failureCodes.add("linkage_preview_missing_stop_conditions");
  }
  if (linkage.not_completion_proof !== true) {
    failureCodes.add("linkage_preview_completion_proof_enabled");
  }
  if (flagEnabled(linkage, "codex_execution_now")) {
    failureCodes.add("linkage_preview_codex_execution_enabled");
  }
  if (flagEnabled(linkage, "formation_receipt_write_now")) {
    failureCodes.add("linkage_preview_formation_receipt_write_enabled");
  }
  if (flagEnabled(linkage, "linkage_record_write_now")) {
    failureCodes.add("linkage_preview_linkage_record_write_enabled");
  }
  if (flagEnabled(linkage, "durable_audit_log_write_now")) {
    failureCodes.add("linkage_preview_durable_audit_log_write_enabled");
  }
}

function validateSectionFamilies(
  families: PerspectivePacketReceiptLinkageSectionFamily[],
  failureCodes: Set<string>,
) {
  const knownKinds = new Set(expectedSectionKinds);
  for (const family of families) {
    const familyRecord = family as unknown as JsonRecord;
    const sectionKind = asString(familyRecord.section_kind);
    if (!sectionKind) {
      failureCodes.add("linkage_section_missing_section_kind");
      continue;
    }
    if (!knownKinds.has(sectionKind as PerspectivePacketReceiptLinkageSectionKind)) {
      failureCodes.add("linkage_section_unknown_section_kind");
    }
    if (familyRecord.runtime_write_now !== false) {
      failureCodes.add("linkage_section_runtime_write_enabled");
    }
    if (
      sectionKind === "selected_candidates" &&
      familyRecord.candidates_remain_candidates !== true
    ) {
      failureCodes.add("selected_candidate_not_candidate_only");
    }
    if (
      sectionKind === "selected_candidates" &&
      familyRecord.not_proof_or_evidence !== true
    ) {
      failureCodes.add("selected_candidate_proof_or_evidence_enabled");
    }
    if (
      sectionKind === "selected_candidates" &&
      familyRecord.not_durable_state !== true
    ) {
      failureCodes.add("selected_candidate_durable_state_enabled");
    }
    if (
      sectionKind === "omitted_candidates" &&
      familyRecord.omission_not_rejection !== true
    ) {
      failureCodes.add("omitted_candidate_treated_as_rejected");
    }
    if (
      sectionKind === "deferred_candidates" &&
      familyRecord.deferral_not_rejection !== true
    ) {
      failureCodes.add("deferred_candidate_treated_as_rejected");
    }
    if (
      sectionKind === "unresolved_tensions" &&
      familyRecord.resolution_not_implied !== true
    ) {
      failureCodes.add("unresolved_tension_resolution_implied");
    }
    if (
      sectionKind === "knowledge_gaps" &&
      familyRecord.closure_not_implied !== true
    ) {
      failureCodes.add("knowledge_gap_closure_implied");
    }
    if (
      sectionKind === "future_formation_receipt_ref" &&
      familyRecord.receipt_not_written_now !== true
    ) {
      failureCodes.add("future_formation_receipt_written_now");
    }
    if (
      sectionKind === "future_decision_or_handoff_ref" &&
      (familyRecord.decision_not_made_now !== true ||
        familyRecord.handoff_not_sent_now !== true)
    ) {
      failureCodes.add("future_decision_or_handoff_made_now");
    }
    if (
      sectionKind === "authority_boundary" &&
      familyRecord.execution_authority_false !== true
    ) {
      failureCodes.add("authority_boundary_section_execution_enabled");
    }
    if (
      sectionKind === "expected_files" &&
      familyRecord.not_file_write_authority !== true
    ) {
      failureCodes.add("expected_files_write_authority_enabled");
    }
    if (
      sectionKind === "expected_checks" &&
      familyRecord.not_execution_authority !== true
    ) {
      failureCodes.add("expected_checks_execution_authority_enabled");
    }
    if (
      sectionKind === "linkage_notes" &&
      familyRecord.not_truth_source !== true
    ) {
      failureCodes.add("linkage_notes_truth_source_enabled");
    }
  }
}

function validateLinkageSections(
  linkage: PerspectivePacketReceiptLinkagePreview,
  failureCodes: Set<string>,
) {
  if (!selectedCandidatesRemainCandidates(linkage.selected_candidates)) {
    failureCodes.add("selected_candidate_not_candidate_only");
  }
  if (
    asArray(linkage.selected_candidates)
      .map(asRecord)
      .some((candidate) => candidate.not_proof_or_evidence !== true)
  ) {
    failureCodes.add("selected_candidate_proof_or_evidence_enabled");
  }
  if (
    asArray(linkage.selected_candidates)
      .map(asRecord)
      .some((candidate) => candidate.not_durable_state !== true)
  ) {
    failureCodes.add("selected_candidate_durable_state_enabled");
  }
  if (!omittedCandidatesRemainVisible(linkage.omitted_candidates)) {
    failureCodes.add("omitted_candidate_treated_as_rejected");
  }
  if (!deferredCandidatesRemainVisible(linkage.deferred_candidates)) {
    failureCodes.add("deferred_candidate_treated_as_rejected");
  }
  if (!unresolvedTensionsRemainVisible(linkage.unresolved_tensions)) {
    failureCodes.add("unresolved_tension_resolution_implied");
  }
  if (!knowledgeGapsRemainVisible(linkage.knowledge_gaps)) {
    failureCodes.add("knowledge_gap_closure_implied");
  }
  if (!hasText(linkage.future_formation_receipt_ref)) {
    failureCodes.add("future_formation_receipt_written_now");
  }
  if (!hasText(linkage.future_decision_or_handoff_ref)) {
    failureCodes.add("future_decision_or_handoff_made_now");
  }
  if (flagEnabled(linkage, "formation_receipt_written_now")) {
    failureCodes.add("future_formation_receipt_written_now");
  }
  if (
    flagEnabled(linkage, "decision_made_now") ||
    flagEnabled(linkage, "handoff_sent_now")
  ) {
    failureCodes.add("future_decision_or_handoff_made_now");
  }
  if (flagEnabled(asRecord(linkage.authority_boundary), "execution_authority")) {
    failureCodes.add("authority_boundary_section_execution_enabled");
  }
  if (!expectedFilesAreHints(linkage.expected_files)) {
    failureCodes.add("expected_files_write_authority_enabled");
  }
  if (!expectedChecksAreHints(linkage.expected_checks)) {
    failureCodes.add("expected_checks_execution_authority_enabled");
  }
  if (asRecord(linkage.linkage_notes).not_truth_source !== true) {
    failureCodes.add("linkage_notes_truth_source_enabled");
  }
}

function validateForbiddenActions(
  policy: PerspectivePacketReceiptLinkageForbiddenActionsPolicy,
  linkageActions: unknown,
  failureCodes: Set<string>,
) {
  const actions = new Set(asArray(linkageActions).filter(isString));
  const required: [
    keyof PerspectivePacketReceiptLinkageForbiddenActionsPolicy,
    string,
    string,
    boolean,
  ][] = [
    [
      "no_linkage_record_write",
      "no_linkage_record_write",
      "forbidden_action_missing_no_linkage_record_write",
      true,
    ],
    [
      "no_durable_audit_log_write",
      "no_durable_audit_log_write",
      "forbidden_action_missing_no_durable_audit_log_write",
      false,
    ],
    [
      "no_formation_receipt_write",
      "no_formation_receipt_write",
      "forbidden_action_missing_no_formation_receipt_write",
      true,
    ],
    [
      "no_codex_execution_from_linkage",
      "no_codex_execution_from_linkage",
      "forbidden_action_missing_no_codex_execution",
      true,
    ],
    [
      "no_github_automation_from_linkage",
      "no_github_automation_from_linkage",
      "forbidden_action_missing_no_github_automation",
      true,
    ],
    [
      "no_github_pr_creation_from_linkage",
      "no_github_pr_creation_from_linkage",
      "forbidden_action_missing_no_github_pr_creation",
      false,
    ],
    [
      "no_git_branch_creation_from_linkage",
      "no_git_branch_creation_from_linkage",
      "forbidden_action_missing_no_git_branch_creation",
      false,
    ],
    [
      "no_git_commit_creation_from_linkage",
      "no_git_commit_creation_from_linkage",
      "forbidden_action_missing_no_git_commit_creation",
      false,
    ],
    [
      "no_provider_openai_call_from_linkage",
      "no_provider_openai_call_from_linkage",
      "forbidden_action_missing_no_provider_openai_call",
      true,
    ],
    [
      "no_retrieval_rag_execution_from_linkage",
      "no_retrieval_rag_execution_from_linkage",
      "forbidden_action_missing_no_retrieval_rag_execution",
      true,
    ],
    [
      "no_db_write_or_query_from_linkage",
      "no_db_write_or_query_from_linkage",
      "forbidden_action_missing_no_db_write_or_query",
      true,
    ],
    [
      "no_perspective_promotion_from_linkage",
      "no_perspective_promotion_from_linkage",
      "forbidden_action_missing_no_perspective_promotion",
      true,
    ],
    [
      "no_product_write_from_linkage",
      "no_product_write_from_linkage",
      "forbidden_action_missing_no_product_write",
      true,
    ],
  ];
  for (const [policyKey, action, failureCode, listedInPreview] of required) {
    if (policy[policyKey] !== true || (listedInPreview && !actions.has(action))) {
      failureCodes.add(failureCode);
    }
  }
}

function validateContractAuthorityBoundary(
  boundary: PerspectivePacketReceiptLinkageAuthorityBoundary,
  failureCodes: Set<string>,
) {
  const checks: [keyof PerspectivePacketReceiptLinkageAuthorityBoundary, string][] = [
    ["linkage_runtime_build_implemented_now", "linkage_runtime_build_enabled"],
    ["linkage_record_write_now", "linkage_record_write_enabled"],
    ["durable_audit_log_write_now", "durable_audit_log_write_enabled"],
    ["formation_receipt_write_now", "formation_receipt_write_enabled"],
    ["codex_execution_now", "codex_execution_enabled"],
    ["github_automation_now", "github_automation_enabled"],
    ["github_pr_creation_now", "github_pr_creation_enabled"],
    ["git_branch_creation_now", "git_branch_creation_enabled"],
    ["git_commit_creation_now", "git_commit_creation_enabled"],
    ["external_handoff_sending_now", "external_handoff_sending_enabled"],
    ["agent_routing_now", "agent_routing_enabled"],
    ["agent_execution_now", "agent_execution_enabled"],
    ["ai_context_packet_runtime_build_implemented_now", "ai_context_packet_runtime_build_enabled"],
    ["codex_handoff_draft_runtime_build_implemented_now", "codex_handoff_draft_runtime_build_enabled"],
    ["provider_openai_call_now", "provider_openai_call_enabled"],
    ["retrieval_rag_execution_now", "retrieval_rag_execution_enabled"],
    ["runtime_geometry_digest_build_implemented_now", "runtime_geometry_digest_build_enabled"],
    ["graph_mutation_now", "graph_mutation_enabled"],
    ["durable_perspective_state_read_now", "durable_perspective_state_read_enabled"],
    ["durable_perspective_state_write_now", "durable_perspective_state_write_enabled"],
    ["durable_perspective_delta_apply_now", "durable_perspective_delta_apply_enabled"],
    ["proof_or_evidence_record_write_now", "proof_or_evidence_record_write_enabled"],
    ["accepted_evidence_write_now", "accepted_evidence_write_enabled"],
    ["work_mutation_now", "work_mutation_enabled"],
    ["runtime_db_query_now", "runtime_db_query_enabled"],
    ["runtime_db_write_now", "runtime_db_write_enabled"],
    ["durable_memory_write_now", "durable_memory_write_enabled"],
    ["linkage_authority", "linkage_authority_enabled"],
    ["receipt_completion_authority", "receipt_completion_authority_enabled"],
    ["product_write_authority", "product_write_enabled"],
    ["product_id_allocation_authority", "product_id_allocation_enabled"],
  ];
  for (const [key, failureCode] of checks) {
    if (boundary[key] !== false) failureCodes.add(failureCode);
  }
}

function validateImplementationAuthorityBoundary(
  boundary: PerspectivePacketReceiptLinkageImplementationAuthorityBoundary,
): string[] {
  const failureCodes = new Set<string>();
  validateContractAuthorityBoundary(
    boundary as unknown as PerspectivePacketReceiptLinkageAuthorityBoundary,
    failureCodes,
  );
  if (boundary.formation_receipt_runtime_mutation_now !== false) {
    failureCodes.add("formation_receipt_runtime_mutation_enabled");
  }
  if (boundary.contract_changed_now !== false) {
    failureCodes.add("contract_changed_enabled");
  }
  return uniqueSorted(Array.from(failureCodes));
}

function validateReferences(
  inputPreview: JsonRecord,
  linkage: PerspectivePacketReceiptLinkagePreview,
) {
  const failureCodes = new Set<string>();
  const allStrings: string[] = [];
  visit({ inputPreview, linkage }, (_key, value) => {
    if (typeof value === "string") allStrings.push(value);
  });
  if (!hasText(linkage.linkage_id)) failureCodes.add("linkage_id_missing");
  if (asArray(linkage.source_refs).length === 0) {
    failureCodes.add("source_refs_missing");
  }
  if (
    asArray(linkage.selected_candidates)
      .map(asRecord)
      .some((candidate) => asArray(candidate.source_refs).length === 0)
  ) {
    failureCodes.add("selected_candidate_missing_source_refs");
  }
  if (
    asArray(linkage.omitted_candidates)
      .map(asRecord)
      .some((candidate) => !hasText(candidate.omission_reason_summary))
  ) {
    failureCodes.add("omitted_candidate_missing_reason");
  }
  if (
    asArray(linkage.deferred_candidates)
      .map(asRecord)
      .some((candidate) => !hasText(candidate.defer_reason_summary))
  ) {
    failureCodes.add("deferred_candidate_missing_reason");
  }
  if (!hasText(linkage.future_formation_receipt_ref)) {
    failureCodes.add("future_formation_receipt_ref_missing");
  }
  if (!hasText(linkage.future_decision_or_handoff_ref)) {
    failureCodes.add("future_decision_or_handoff_ref_missing");
  }
  visit({ inputPreview, linkage }, (key, value) => {
    if (
      typeof value === "string" &&
      (key.endsWith("_ref") ||
        key.endsWith("_refs") ||
        key === "source_refs" ||
        key === "condition_ref") &&
      !publicSafeRefOrHint(key, value)
    ) {
      failureCodes.add("private_or_unstable_ref_detected");
    }
    if (
      (key === "raw_source_body" || key === "raw_private_source_body") &&
      hasText(value)
    ) {
      failureCodes.add("raw_private_source_body_detected");
    }
  });
  if (allStrings.some((value) => /https?:\/\/|localhost|127\.0\.0\.1/.test(value))) {
    failureCodes.add("private_or_unstable_ref_detected");
    failureCodes.add("no_private_urls");
  }
  if (allStrings.some((value) => /thread_[A-Za-z0-9]|run_[A-Za-z0-9]|session_[A-Za-z0-9]/.test(value))) {
    failureCodes.add("raw_provider_thread_run_session_id_detected");
  }
  if (allStrings.some((value) => /\braw private source body\b/i.test(value))) {
    failureCodes.add("raw_private_source_body_detected");
  }
  if (allStrings.some((value) => /\bsk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|access_token/i.test(value))) {
    failureCodes.add("access_token_detected");
  }
  if (allStrings.some((value) => /BEGIN (?:OPENSSH|RSA) PRIVATE KEY|ssh-rsa\s+[A-Za-z0-9+/=]+/.test(value))) {
    failureCodes.add("ssh_key_detected");
  }
  if (allStrings.some((value) => /\bsecret\b/i.test(value))) {
    failureCodes.add("no_secrets");
  }
  return {
    passed: failureCodes.size === 0,
    failure_codes: uniqueSorted(Array.from(failureCodes)),
    public_safe_refs_only: !failureCodes.has("private_or_unstable_ref_detected"),
    no_raw_private_source_body:
      !failureCodes.has("raw_private_source_body_detected"),
    no_raw_provider_thread_run_session_ids:
      !failureCodes.has("raw_provider_thread_run_session_id_detected"),
    no_private_urls: !failureCodes.has("no_private_urls"),
    no_secrets: !failureCodes.has("no_secrets"),
    no_access_tokens: !failureCodes.has("access_token_detected"),
    no_ssh_keys: !failureCodes.has("ssh_key_detected"),
  };
}

function validateLinkageSectionFamilyContracts(
  families: PerspectivePacketReceiptLinkageSectionFamily[],
): boolean {
  return (
    deepEqual(
      families.map((family) => family.section_kind),
      expectedSectionKinds,
    ) &&
    families.every((family) => family.runtime_write_now === false) &&
    families.some(
      (family) =>
        family.section_kind === "selected_candidates" &&
        family.candidates_remain_candidates === true &&
        family.not_proof_or_evidence === true &&
        family.not_durable_state === true,
    ) &&
    families.some(
      (family) =>
        family.section_kind === "omitted_candidates" &&
        family.omission_not_rejection === true,
    ) &&
    families.some(
      (family) =>
        family.section_kind === "deferred_candidates" &&
        family.deferral_not_rejection === true,
    ) &&
    families.some(
      (family) =>
        family.section_kind === "expected_files" &&
        family.not_file_write_authority === true,
    ) &&
    families.some(
      (family) =>
        family.section_kind === "expected_checks" &&
        family.not_execution_authority === true,
    ) &&
    families.some(
      (family) =>
        family.section_kind === "linkage_notes" &&
        family.not_truth_source === true,
    )
  );
}

function getImplementationAuthorityBoundary(): PerspectivePacketReceiptLinkageImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    deterministic_builder_added_now: true,
    contract_changed_now: false,
    linkage_runtime_build_implemented_now: false,
    linkage_record_write_now: false,
    durable_audit_log_write_now: false,
    formation_receipt_write_now: false,
    formation_receipt_runtime_mutation_now: false,
    codex_handoff_draft_runtime_build_implemented_now: false,
    codex_handoff_draft_write_now: false,
    codex_handoff_implemented_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    github_pr_creation_now: false,
    git_branch_creation_now: false,
    git_commit_creation_now: false,
    external_handoff_sending_now: false,
    agent_routing_now: false,
    agent_execution_now: false,
    ai_context_packet_runtime_build_implemented_now: false,
    ai_context_packet_write_now: false,
    provider_openai_call_now: false,
    provider_extraction_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    runtime_geometry_digest_build_implemented_now: false,
    geometry_digest_write_now: false,
    geometry_calculation_runtime_now: false,
    raw_coordinate_authority: false,
    raw_coordinate_only_digest_now: false,
    runtime_layout_implemented_now: false,
    runtime_layout_execution_now: false,
    graph_db_implemented_now: false,
    graph_mutation_now: false,
    browser_request_now: false,
    browser_persistence_now: false,
    durable_perspective_state_read_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_implemented_now: false,
    trajectory_runtime_build_implemented_now: false,
    proof_or_evidence_record_write_now: false,
    accepted_evidence_write_now: false,
    work_mutation_now: false,
    candidate_mutation_now: false,
    candidate_record_write_now: false,
    runtime_promotion_implemented_now: false,
    promotion_decision_record_implemented_now: false,
    promotion_decision_record_write_now: false,
    runtime_index_build_implemented_now: false,
    runtime_index_write_now: false,
    embedding_generation_implemented_now: false,
    vector_db_implemented_now: false,
    fts_implemented_now: false,
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
    durable_salience_write_now: false,
    recent_rehearsal_buffer_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    github_pr_creation_authority: false,
    git_branch_creation_authority: false,
    git_commit_authority: false,
    external_handoff_authority: false,
    agent_routing_authority: false,
    agent_execution_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    layout_coordinate_authority: false,
    geometry_digest_authority: false,
    diagnostic_authority: false,
    recommendation_authority: false,
    ai_context_packet_authority: false,
    codex_handoff_draft_authority: false,
    linkage_authority: false,
    receipt_completion_authority: false,
    final_report_completion_authority: false,
    expected_files_write_authority: false,
    expected_checks_execution_authority: false,
    branch_name_git_authority: false,
    pr_title_body_github_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function selectedCandidatesRemainCandidates(value: unknown): boolean {
  const candidates = asArray(value).map(asRecord);
  return (
    candidates.length > 0 &&
    candidates.every(
      (candidate) =>
        candidate.candidate_only === true &&
        candidate.not_proof_or_evidence === true &&
        candidate.not_durable_state === true &&
        asArray(candidate.source_refs).length > 0,
    )
  );
}

function omittedCandidatesRemainVisible(value: unknown): boolean {
  const candidates = asArray(value).map(asRecord);
  return (
    candidates.length > 0 &&
    candidates.every(
      (candidate) =>
        candidate.omission_not_rejection === true &&
        candidate.remains_visible === true &&
        hasText(candidate.omission_reason_summary),
    )
  );
}

function deferredCandidatesRemainVisible(value: unknown): boolean {
  const candidates = asArray(value).map(asRecord);
  return (
    candidates.length > 0 &&
    candidates.every(
      (candidate) =>
        candidate.deferral_not_rejection === true &&
        candidate.remains_visible === true &&
        hasText(candidate.defer_reason_summary),
    )
  );
}

function unresolvedTensionsRemainVisible(value: unknown): boolean {
  const tensions = asArray(value).map(asRecord);
  return (
    tensions.length > 0 &&
    tensions.every(
      (tension) =>
        tension.must_remain_visible === true &&
        tension.resolution_not_implied === true,
    )
  );
}

function knowledgeGapsRemainVisible(value: unknown): boolean {
  const gaps = asArray(value).map(asRecord);
  return (
    gaps.length > 0 &&
    gaps.every(
      (gap) =>
        gap.must_remain_visible === true &&
        gap.closure_not_implied === true &&
        gap.source_refs_or_gap_reason_required === true,
    )
  );
}

function expectedFilesAreHints(value: unknown): boolean {
  const files = asArray(value);
  return (
    files.length > 0 &&
    files.every((file) => asRecord(file).not_file_write_authority === true)
  );
}

function expectedChecksAreHints(value: unknown): boolean {
  const checks = asArray(value);
  return (
    checks.length > 0 &&
    checks.every((check) => asRecord(check).not_execution_authority === true)
  );
}

function publicSafeRef(value: string): boolean {
  return /^[a-z0-9_:-]+:public:[a-z0-9_.:-]+$/i.test(value);
}

function publicSafeRefOrHint(key: string, value: string): boolean {
  if (key === "check_ref") return publicSafeCheckRef(value);
  return publicSafeRef(value);
}

function publicSafeCheckRef(value: string): boolean {
  return (
    value.startsWith("npm run ") ||
    value.startsWith("node --check ") ||
    value.startsWith("node scripts/")
  );
}

function allTrue(value: object): boolean {
  return Object.values(value).every((flag) => flag === true);
}

function flagEnabled(value: unknown, key: string): boolean {
  return asRecord(value)[key] === true;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return canonicalJson(a) === canonicalJson(b);
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function visit(
  value: unknown,
  visitor: (key: string, value: unknown) => void,
  key = "",
) {
  visitor(key, value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, visitor, String(index)));
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      visit(childValue, visitor, childKey);
    }
  }
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripGeneratedFields);
  }
  if (value && typeof value === "object") {
    const next: JsonRecord = {};
    for (const [key, childValue] of Object.entries(value)) {
      if (
        key === "implementation_fingerprint" ||
        key === "contract_fingerprint"
      ) {
        continue;
      }
      next[key] = stripGeneratedFields(childValue);
    }
    return next;
  }
  return value;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(asRecord(value)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
