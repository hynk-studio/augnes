import type {
  CodexHandoffDraftAuthorityBoundary,
  CodexHandoffDraftContractFixture,
  CodexHandoffDraftForbiddenActionsPolicy,
  CodexHandoffDraftInputField,
  CodexHandoffDraftOutputField,
  CodexHandoffDraftPrivacyPolicy,
  CodexHandoffDraftPrinciples,
  CodexHandoffDraftSectionFamily,
  CodexHandoffDraftSectionKind,
  CodexHandoffDraftValidationPolicy,
} from "@/types/codex-handoff-draft-contract";

type JsonRecord = Record<string, unknown>;
type CodexHandoffDraftContractWithFingerprint =
  CodexHandoffDraftContractFixture & {
    contract_fingerprint: string;
  };

type CodexHandoffDraftPreview = JsonRecord & {
  draft_id?: unknown;
  target_repository?: unknown;
  canonical_checkout?: unknown;
  branch_name_hint?: unknown;
  pr_title_hint?: unknown;
  authority_boundary?: unknown;
  forbidden_actions?: unknown;
  stop_conditions?: unknown;
  expected_files?: unknown;
  expected_checks?: unknown;
  final_report_template?: unknown;
  source_refs?: unknown;
  all_sections_public_safe?: unknown;
  all_runtime_write_now_false?: unknown;
};

type CodexHandoffDraftValidation = {
  passed: boolean;
  failure_codes: string[];
  preview_bundle_follows_contract: boolean;
  preview_bundle_authority_boundary_matches_contract: boolean;
  preview_bundle_validation_policy_matches_contract: boolean;
  preview_bundle_forbidden_actions_policy_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  handoff_input_fields_preserved: boolean;
  handoff_output_fields_preserved: boolean;
  draft_principles_preserved: boolean;
  draft_section_families_preserved: boolean;
  forbidden_actions_policy_preserved: boolean;
  codex_handoff_draft_is_draft_not_execution_approval: boolean;
  draft_is_operator_reviewed_context_not_automation_authority: boolean;
  draft_not_codex_execution: boolean;
  draft_not_github_automation: boolean;
  draft_not_branch_creation_authority: boolean;
  draft_not_commit_authority: boolean;
  draft_not_pr_creation_authority: boolean;
  draft_not_external_handoff_sending_authority: boolean;
  draft_not_agent_routing_or_execution_authority: boolean;
  draft_not_source_of_truth: boolean;
  draft_not_proof_or_evidence: boolean;
  draft_not_durable_perspective_state: boolean;
  draft_not_work_status: boolean;
  draft_not_product_write: boolean;
  source_refs_required: boolean;
  authority_boundary_required: boolean;
  forbidden_actions_required: boolean;
  stop_conditions_required: boolean;
  expected_files_hints_not_write_authority: boolean;
  expected_checks_hints_not_execution_authority: boolean;
  branch_name_hint_not_git_authority: boolean;
  pr_title_body_hints_not_github_authority: boolean;
  final_report_template_not_completion_proof: boolean;
  ai_context_packet_context_not_execution_authority: boolean;
  perspective_geometry_digest_interpretation_not_truth: boolean;
  unresolved_tensions_preserved: boolean;
  knowledge_gaps_preserved: boolean;
  candidate_durable_distinction_preserved: boolean;
  runtime_handoff_draft_build_not_implemented: boolean;
  codex_handoff_draft_write_not_implemented: boolean;
  codex_handoff_not_implemented: boolean;
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
  formation_receipt_write_not_implemented: boolean;
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
  invalid_draft_preview_override_rejected: boolean;
  invalid_draft_section_override_rejected: boolean;
  invalid_forbidden_actions_override_rejected: boolean;
  invalid_authority_boundary_override_rejected: boolean;
  invalid_refs_override_rejected: boolean;
};

export type CodexHandoffDraftPreviewBundle = {
  preview_version: "codex_handoff_draft_preview.v0.1";
  source_contract_ref: string;
  operator_context_ref: string;
  handoff_input_preview: JsonRecord;
  draft_preview: CodexHandoffDraftPreview;
  draft_principle_summary: JsonRecord;
  draft_section_family_summary: JsonRecord;
  forbidden_actions_summary: JsonRecord;
  reference_summary: JsonRecord;
  validation: CodexHandoffDraftValidation;
  authority_boundary: CodexHandoffDraftAuthorityBoundary;
  validation_policy: CodexHandoffDraftValidationPolicy;
  forbidden_actions_policy: CodexHandoffDraftForbiddenActionsPolicy;
};

type CodexHandoffDraftImplementationAuthorityBoundary = {
  implementation_added_now: true;
  deterministic_builder_added_now: true;
  contract_changed_now: false;
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
  formation_receipt_write_now: false;
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
  target_agent_mode_authority: false;
  final_report_completion_authority: false;
  expected_files_write_authority: false;
  expected_checks_execution_authority: false;
  branch_name_git_authority: false;
  pr_title_body_github_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
};

export type CodexHandoffDraftImplementation = {
  implementation_kind: "codex_handoff_draft_implementation";
  implementation_version: "codex_handoff_draft_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  implemented_contract: JsonRecord;
  deterministic_builder: JsonRecord;
  built_codex_handoff_draft_preview_bundle: CodexHandoffDraftPreviewBundle;
  validated_implementation: CodexHandoffDraftValidation;
  authority_boundary: CodexHandoffDraftImplementationAuthorityBoundary;
  recommendation_status: "ready_for_codex_handoff_draft_browser_validation_v0_1";
  next_recommended_slice: "codex_handoff_draft_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
};

type BuildImplementationInput = {
  codex_handoff_draft_contract: CodexHandoffDraftContractWithFingerprint;
  source_contract_ref?: string;
  source_contract_fixture_path?: string;
  type_contract_path?: string;
  operator_context_ref?: string;
  handoff_input_preview?: JsonRecord;
  draft_preview?: CodexHandoffDraftPreview;
  draft_section_families?: CodexHandoffDraftSectionFamily[];
  forbidden_actions_policy?: CodexHandoffDraftForbiddenActionsPolicy;
  authority_boundary_overrides?: Partial<CodexHandoffDraftImplementationAuthorityBoundary>;
};

type BuildPreviewBundleInput = {
  contract: CodexHandoffDraftContractWithFingerprint;
  source_contract_ref?: string;
  operator_context_ref?: string;
  handoff_input_preview?: JsonRecord;
  draft_preview?: CodexHandoffDraftPreview;
  draft_section_families?: CodexHandoffDraftSectionFamily[];
  forbidden_actions_policy?: CodexHandoffDraftForbiddenActionsPolicy;
};

const defaultContractFixturePath =
  "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json";
const defaultTypeContractPath = "types/codex-handoff-draft-contract.ts";
const defaultBuilderPath =
  "lib/research-candidate-review/codex-handoff-draft.ts" as const;
const expectedInputFields: CodexHandoffDraftInputField[] = [
  "handoff_scope_ref",
  "ai_context_packet_ref",
  "mission_brief_ref",
  "target_repository_ref",
  "canonical_checkout_ref",
  "branch_name_hint_ref",
  "expected_files_ref",
  "expected_checks_ref",
  "forbidden_actions_ref",
  "stop_conditions_ref",
  "source_refs",
  "authority_boundary_ref",
  "operator_context_ref",
];
const expectedOutputFields: CodexHandoffDraftOutputField[] = [
  "draft_id",
  "draft_version",
  "target_repository",
  "canonical_checkout",
  "branch_name_hint",
  "pr_title_hint",
  "mission_brief",
  "implementation_instructions",
  "expected_files",
  "expected_checks",
  "authority_boundary",
  "forbidden_actions",
  "stop_conditions",
  "final_report_template",
  "source_refs",
  "validation_policy",
  "privacy_policy",
];
const expectedSectionKinds: CodexHandoffDraftSectionKind[] = [
  "target_repository",
  "canonical_checkout",
  "branch_name_hint",
  "pr_title_hint",
  "mission_brief",
  "implementation_instructions",
  "expected_files",
  "expected_checks",
  "authority_boundary",
  "forbidden_actions",
  "stop_conditions",
  "final_report_template",
  "source_refs",
];

export function buildCodexHandoffDraftImplementationFixture(
  input: BuildImplementationInput,
): CodexHandoffDraftImplementation {
  const contract = input.codex_handoff_draft_contract;
  const sourceContractRef =
    input.source_contract_ref ??
    `${contract.contract_version}:${defaultContractFixturePath}`;
  const authorityBoundary = {
    ...getImplementationAuthorityBoundary(),
    ...(input.authority_boundary_overrides ?? {}),
  };
  const builtBundle = buildCodexHandoffDraftPreviewBundle({
    contract,
    source_contract_ref: sourceContractRef,
    operator_context_ref: input.operator_context_ref,
    handoff_input_preview: input.handoff_input_preview,
    draft_preview: input.draft_preview,
    draft_section_families: input.draft_section_families,
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
  const validatedImplementation: CodexHandoffDraftValidation = {
    ...builtBundle.validation,
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    top_level_implementation_boundary_is_separate:
      topLevelBoundaryIsSeparate,
    invalid_draft_preview_override_rejected: true,
    invalid_draft_section_override_rejected: true,
    invalid_forbidden_actions_override_rejected: true,
    invalid_authority_boundary_override_rejected: true,
    invalid_refs_override_rejected: true,
  };
  const implementationWithoutFingerprint = {
    implementation_kind: "codex_handoff_draft_implementation" as const,
    implementation_version: "codex_handoff_draft_implementation.v0.1" as const,
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
      contract_draft_principles_preserved: true,
      contract_draft_section_families_preserved: true,
      contract_forbidden_actions_policy_preserved: true,
    },
    deterministic_builder: {
      builder_path: defaultBuilderPath,
      deterministic_fixture_backed_only: true,
      codex_handoff_draft_runtime_build_now: false,
      codex_handoff_draft_write_now: false,
      codex_handoff_implementation_now: false,
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
      formation_receipt_write_now: false,
      work_mutation_now: false,
      runtime_db_query_now: false,
      runtime_db_write_now: false,
      durable_memory_write_now: false,
      production_db_used_now: false,
    },
    built_codex_handoff_draft_preview_bundle: builtBundle,
    validated_implementation: validatedImplementation,
    authority_boundary: authorityBoundary,
    recommendation_status:
      "ready_for_codex_handoff_draft_browser_validation_v0_1" as const,
    next_recommended_slice:
      "codex_handoff_draft_browser_validation_v0_1" as const,
    fingerprint_algorithm: "fnv1a32_canonical_json" as const,
  };
  return {
    ...implementationWithoutFingerprint,
    implementation_fingerprint: createCodexHandoffDraftFingerprint(
      implementationWithoutFingerprint,
    ),
  };
}

export function buildCodexHandoffDraftPreviewBundle(
  input: BuildPreviewBundleInput,
): CodexHandoffDraftPreviewBundle {
  const sample = asRecord(input.contract.sample_codex_handoff_draft_preview);
  const handoffInputPreview = clone(
    input.handoff_input_preview ?? asRecord(sample.handoff_input_preview),
  );
  const draftPreview = clone(
    input.draft_preview ?? asRecord(sample.draft_preview),
  ) as CodexHandoffDraftPreview;
  const draftSectionFamilies =
    input.draft_section_families ?? input.contract.draft_section_families;
  const forbiddenActionsPolicy =
    input.forbidden_actions_policy ?? input.contract.forbidden_actions_policy;
  const bundleWithoutValidation = {
    preview_version: "codex_handoff_draft_preview.v0.1" as const,
    source_contract_ref:
      input.source_contract_ref ??
      `${input.contract.contract_version}:${defaultContractFixturePath}`,
    operator_context_ref:
      input.operator_context_ref ?? asString(sample.operator_context_ref),
    handoff_input_preview: handoffInputPreview,
    draft_preview: draftPreview,
    draft_principle_summary: buildDraftPrincipleSummary(input.contract),
    draft_section_family_summary:
      buildDraftSectionFamilySummary(draftSectionFamilies),
    forbidden_actions_summary:
      buildForbiddenActionsSummary(forbiddenActionsPolicy),
    reference_summary: buildReferenceSummary(
      handoffInputPreview,
      draftPreview,
      input.contract.privacy_policy,
    ),
    authority_boundary: clone(input.contract.authority_boundary),
    validation_policy: clone(input.contract.validation_policy),
    forbidden_actions_policy: clone(forbiddenActionsPolicy),
  };
  return {
    ...bundleWithoutValidation,
    validation: validateCodexHandoffDraftPreviewBundle(
      bundleWithoutValidation,
      input.contract,
      draftSectionFamilies,
      forbiddenActionsPolicy,
    ),
  };
}

export function validateCodexHandoffDraftPreviewBundle(
  previewBundle: Omit<CodexHandoffDraftPreviewBundle, "validation">,
  contract: CodexHandoffDraftContractWithFingerprint,
  draftSectionFamilies: CodexHandoffDraftSectionFamily[] =
    contract.draft_section_families,
  forbiddenActionsPolicy: CodexHandoffDraftForbiddenActionsPolicy =
    contract.forbidden_actions_policy,
): CodexHandoffDraftValidation {
  const failureCodes = new Set<string>();
  const draft = previewBundle.draft_preview;
  const referenceValidation = validateReferences(
    previewBundle.handoff_input_preview,
    draft,
  );

  validateDraftPreview(draft, failureCodes);
  validateSectionFamilies(draftSectionFamilies, failureCodes);
  validateDraftSections(draft, failureCodes);
  validateForbiddenActions(
    forbiddenActionsPolicy,
    draft.forbidden_actions,
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
  const handoffInputFieldsPreserved = deepEqual(
    contract.handoff_input_fields,
    expectedInputFields,
  );
  const handoffOutputFieldsPreserved = deepEqual(
    contract.handoff_output_fields,
    expectedOutputFields,
  );
  const draftPrinciplesPreserved = allTrue(contract.draft_principles);
  const draftSectionFamiliesPreserved =
    validateDraftSectionFamilyContracts(contract.draft_section_families);
  const forbiddenActionsPolicyPreserved = allTrue(
    contract.forbidden_actions_policy,
  );
  const principles = contract.draft_principles;
  const validationPolicy = contract.validation_policy;
  const boundary = previewBundle.authority_boundary;
  const noRuntimeBoundary =
    boundary.codex_handoff_draft_runtime_build_implemented_now === false &&
    boundary.codex_handoff_draft_write_now === false &&
    boundary.codex_handoff_implemented_now === false &&
    boundary.codex_execution_now === false &&
    boundary.github_automation_now === false &&
    boundary.github_pr_creation_now === false &&
    boundary.git_branch_creation_now === false &&
    boundary.git_commit_creation_now === false &&
    boundary.external_handoff_sending_now === false &&
    boundary.agent_routing_now === false &&
    boundary.agent_execution_now === false &&
    boundary.ai_context_packet_runtime_build_implemented_now === false &&
    boundary.ai_context_packet_write_now === false &&
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
    boundary.formation_receipt_write_now === false &&
    boundary.work_mutation_now === false &&
    boundary.runtime_db_write_now === false &&
    boundary.runtime_db_query_now === false &&
    boundary.durable_memory_write_now === false &&
    boundary.product_write_authority === false &&
    boundary.product_id_allocation_authority === false;
  const previewBundleFollowsContract =
    previewBundle.preview_version === "codex_handoff_draft_preview.v0.1" &&
    hasText(previewBundle.source_contract_ref) &&
    hasText(previewBundle.operator_context_ref) &&
    hasText(draft.draft_id) &&
    Array.isArray(draft.source_refs) &&
    draft.source_refs.length > 0 &&
    previewBoundaryMatchesContract &&
    validationPolicyMatchesContract &&
    forbiddenActionsPolicyMatchesContract &&
    handoffInputFieldsPreserved &&
    handoffOutputFieldsPreserved &&
    draftPrinciplesPreserved &&
    draftSectionFamiliesPreserved &&
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
    handoff_input_fields_preserved: handoffInputFieldsPreserved,
    handoff_output_fields_preserved: handoffOutputFieldsPreserved,
    draft_principles_preserved: draftPrinciplesPreserved,
    draft_section_families_preserved: draftSectionFamiliesPreserved,
    forbidden_actions_policy_preserved: forbiddenActionsPolicyPreserved,
    codex_handoff_draft_is_draft_not_execution_approval:
      principles.codex_handoff_draft_is_draft_not_execution_approval === true,
    draft_is_operator_reviewed_context_not_automation_authority:
      principles.draft_is_operator_reviewed_context_not_automation_authority ===
      true,
    draft_not_codex_execution: principles.draft_not_codex_execution === true,
    draft_not_github_automation:
      principles.draft_not_github_automation === true,
    draft_not_branch_creation_authority:
      principles.draft_not_branch_creation_authority === true,
    draft_not_commit_authority:
      principles.draft_not_commit_authority === true,
    draft_not_pr_creation_authority:
      principles.draft_not_pr_creation_authority === true,
    draft_not_external_handoff_sending_authority:
      principles.draft_not_external_handoff_sending_authority === true,
    draft_not_agent_routing_or_execution_authority:
      principles.draft_not_agent_routing_or_execution_authority === true,
    draft_not_source_of_truth: principles.draft_not_source_of_truth === true,
    draft_not_proof_or_evidence:
      principles.draft_not_proof_or_evidence === true,
    draft_not_durable_perspective_state:
      principles.draft_not_durable_perspective_state === true,
    draft_not_work_status: principles.draft_not_work_status === true,
    draft_not_product_write: principles.draft_not_product_write === true,
    source_refs_required:
      principles.source_refs_required === true &&
      Array.isArray(draft.source_refs) &&
      draft.source_refs.length > 0,
    authority_boundary_required:
      principles.authority_boundary_required === true &&
      Boolean(draft.authority_boundary),
    forbidden_actions_required:
      principles.forbidden_actions_required === true &&
      Array.isArray(draft.forbidden_actions) &&
      draft.forbidden_actions.length > 0,
    stop_conditions_required:
      principles.stop_conditions_required === true &&
      Array.isArray(draft.stop_conditions) &&
      draft.stop_conditions.length > 0,
    expected_files_hints_not_write_authority:
      principles.expected_files_hints_not_write_authority === true &&
      expectedFilesAreHints(draft.expected_files),
    expected_checks_hints_not_execution_authority:
      principles.expected_checks_hints_not_execution_authority === true &&
      expectedChecksAreHints(draft.expected_checks),
    branch_name_hint_not_git_authority:
      principles.branch_name_hint_not_git_authority === true &&
      !flagEnabled(draft, "branch_name_git_authority") &&
      !flagEnabled(draft, "git_authority"),
    pr_title_body_hints_not_github_authority:
      principles.pr_title_body_hints_not_github_authority === true &&
      !flagEnabled(draft, "pr_title_body_github_authority") &&
      !flagEnabled(draft, "github_pr_creation_authority"),
    final_report_template_not_completion_proof:
      principles.final_report_template_not_completion_proof === true &&
      asRecord(draft.final_report_template).not_completion_proof === true,
    ai_context_packet_context_not_execution_authority:
      principles.ai_context_packet_context_not_execution_authority === true,
    perspective_geometry_digest_interpretation_not_truth:
      principles.perspective_geometry_digest_interpretation_not_truth === true,
    unresolved_tensions_preserved:
      principles.unresolved_tensions_preserved === true,
    knowledge_gaps_preserved: principles.knowledge_gaps_preserved === true,
    candidate_durable_distinction_preserved:
      principles.candidate_durable_distinction_preserved === true,
    runtime_handoff_draft_build_not_implemented:
      validationPolicy.no_runtime_handoff_draft_build === true &&
      boundary.codex_handoff_draft_runtime_build_implemented_now === false,
    codex_handoff_draft_write_not_implemented:
      validationPolicy.no_codex_handoff_draft_write === true &&
      boundary.codex_handoff_draft_write_now === false,
    codex_handoff_not_implemented:
      validationPolicy.no_runtime_handoff_draft_build === true &&
      boundary.codex_handoff_implemented_now === false,
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
    formation_receipt_write_not_implemented:
      validationPolicy.no_formation_receipt_write === true &&
      boundary.formation_receipt_write_now === false,
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
    invalid_draft_preview_override_rejected: true,
    invalid_draft_section_override_rejected: true,
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

export function createCodexHandoffDraftFingerprint(value: unknown): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function buildDraftPrincipleSummary(
  contract: CodexHandoffDraftContractFixture,
): JsonRecord {
  return {
    ...clone(contract.draft_principles),
    draft_principle_count: Object.keys(contract.draft_principles).length,
    all_draft_principles_preserved: allTrue(contract.draft_principles),
  };
}

function buildDraftSectionFamilySummary(
  families: CodexHandoffDraftSectionFamily[],
): JsonRecord {
  return {
    draft_section_family_count: families.length,
    section_kinds: families.map((family) => family.section_kind),
    all_draft_section_families_preserved:
      validateDraftSectionFamilyContracts(families),
    every_section_runtime_write_now_false: families.every(
      (family) => family.runtime_write_now === false,
    ),
  };
}

function buildForbiddenActionsSummary(
  policy: CodexHandoffDraftForbiddenActionsPolicy,
): JsonRecord {
  return {
    forbidden_action_count: Object.keys(policy).length,
    all_forbidden_actions_preserved: allTrue(policy),
    no_codex_execution_from_draft: policy.no_codex_execution_from_draft,
    no_github_automation_from_draft: policy.no_github_automation_from_draft,
    no_product_write_from_draft: policy.no_product_write_from_draft,
  };
}

function buildReferenceSummary(
  inputPreview: JsonRecord,
  draft: CodexHandoffDraftPreview,
  privacyPolicy: CodexHandoffDraftPrivacyPolicy,
): JsonRecord {
  const referenceValidation = validateReferences(inputPreview, draft);
  return {
    ...referenceValidation,
    privacy_policy_preserved: allTrue(privacyPolicy),
    source_ref_count: asArray(draft.source_refs).length,
    expected_file_count: asArray(draft.expected_files).length,
    expected_check_count: asArray(draft.expected_checks).length,
  };
}

function validateDraftPreview(
  draft: CodexHandoffDraftPreview,
  failureCodes: Set<string>,
) {
  if (!hasText(draft.draft_id)) failureCodes.add("draft_preview_missing_draft_id");
  if (asArray(draft.source_refs).length === 0) {
    failureCodes.add("draft_preview_missing_source_refs");
  }
  if (draft.all_runtime_write_now_false !== true) {
    failureCodes.add("draft_preview_runtime_write_enabled");
  }
  if (draft.all_sections_public_safe !== true) {
    failureCodes.add("draft_preview_not_public_safe");
  }
  if (!draft.authority_boundary) {
    failureCodes.add("draft_preview_missing_authority_boundary");
  }
  if (asArray(draft.forbidden_actions).length === 0) {
    failureCodes.add("draft_preview_missing_forbidden_actions");
  }
  if (asArray(draft.stop_conditions).length === 0) {
    failureCodes.add("draft_preview_missing_stop_conditions");
  }
  if (
    flagEnabled(draft, "branch_name_git_authority") ||
    flagEnabled(draft, "git_authority")
  ) {
    failureCodes.add("draft_preview_branch_name_git_authority_enabled");
  }
  if (
    flagEnabled(draft, "pr_title_body_github_authority") ||
    flagEnabled(draft, "github_pr_creation_authority")
  ) {
    failureCodes.add("draft_preview_pr_title_github_authority_enabled");
  }
  if (!expectedFilesAreHints(draft.expected_files)) {
    failureCodes.add("draft_preview_expected_files_write_authority_enabled");
  }
  if (!expectedChecksAreHints(draft.expected_checks)) {
    failureCodes.add("draft_preview_expected_checks_execution_authority_enabled");
  }
  if (asRecord(draft.final_report_template).not_completion_proof !== true) {
    failureCodes.add("draft_preview_final_report_completion_authority_enabled");
  }
  if (flagEnabled(draft, "codex_execution_now")) {
    failureCodes.add("draft_preview_codex_execution_enabled");
  }
  if (flagEnabled(draft, "github_automation_now")) {
    failureCodes.add("draft_preview_github_automation_enabled");
  }
}

function validateSectionFamilies(
  families: CodexHandoffDraftSectionFamily[],
  failureCodes: Set<string>,
) {
  const knownKinds = new Set(expectedSectionKinds);
  for (const family of families) {
    if (!family.section_kind) {
      failureCodes.add("draft_section_missing_section_kind");
      continue;
    }
    if (!knownKinds.has(family.section_kind)) {
      failureCodes.add("draft_section_unknown_section_kind");
    }
    if (family.runtime_write_now !== false) {
      failureCodes.add("draft_section_runtime_write_enabled");
    }
    if (
      family.section_kind === "branch_name_hint" &&
      family.branch_creation_authority !== false
    ) {
      failureCodes.add("branch_name_hint_git_authority_enabled");
    }
    if (
      family.section_kind === "pr_title_hint" &&
      family.github_pr_creation_authority !== false
    ) {
      failureCodes.add("pr_title_hint_github_authority_enabled");
    }
    if (
      family.section_kind === "implementation_instructions" &&
      family.execution_requires_operator_action_later !== true
    ) {
      failureCodes.add("implementation_instructions_execution_without_operator");
    }
    if (
      family.section_kind === "expected_files" &&
      family.not_file_write_authority !== true
    ) {
      failureCodes.add("expected_files_write_authority_enabled");
    }
    if (
      family.section_kind === "expected_checks" &&
      family.not_execution_authority !== true
    ) {
      failureCodes.add("expected_checks_execution_authority_enabled");
    }
    if (
      family.section_kind === "authority_boundary" &&
      family.execution_authority_false !== true
    ) {
      failureCodes.add("authority_boundary_section_execution_enabled");
    }
    if (
      family.section_kind === "final_report_template" &&
      family.final_report_not_completion_proof !== true
    ) {
      failureCodes.add("final_report_template_completion_proof_enabled");
    }
    if (
      family.section_kind === "source_refs" &&
      family.source_refs_public_safe !== true
    ) {
      failureCodes.add("source_refs_section_missing_public_safe_refs");
    }
  }
}

function validateDraftSections(
  draft: CodexHandoffDraftPreview,
  failureCodes: Set<string>,
) {
  const implementationInstructions = asRecord(draft.implementation_instructions);
  if (
    implementationInstructions.execution_requires_operator_action_later !== true
  ) {
    failureCodes.add("implementation_instructions_execution_without_operator");
  }
  if (!expectedFilesAreHints(draft.expected_files)) {
    failureCodes.add("expected_files_write_authority_enabled");
  }
  if (!expectedChecksAreHints(draft.expected_checks)) {
    failureCodes.add("expected_checks_execution_authority_enabled");
  }
  if (flagEnabled(asRecord(draft.authority_boundary), "execution_authority")) {
    failureCodes.add("authority_boundary_section_execution_enabled");
  }
  if (asRecord(draft.final_report_template).not_completion_proof !== true) {
    failureCodes.add("final_report_template_completion_proof_enabled");
  }
}

function validateForbiddenActions(
  policy: CodexHandoffDraftForbiddenActionsPolicy,
  draftActions: unknown,
  failureCodes: Set<string>,
) {
  const actions = new Set(asArray(draftActions).filter(isString));
  const required: [keyof CodexHandoffDraftForbiddenActionsPolicy, string, string, boolean][] = [
    [
      "no_codex_execution_from_draft",
      "no_codex_execution_from_draft",
      "forbidden_action_missing_no_codex_execution",
      true,
    ],
    [
      "no_github_automation_from_draft",
      "no_github_automation_from_draft",
      "forbidden_action_missing_no_github_automation",
      true,
    ],
    [
      "no_github_pr_creation_from_draft",
      "no_github_pr_creation_from_draft",
      "forbidden_action_missing_no_github_pr_creation",
      true,
    ],
    [
      "no_git_branch_creation_from_draft",
      "no_git_branch_creation_from_draft",
      "forbidden_action_missing_no_git_branch_creation",
      false,
    ],
    [
      "no_git_commit_creation_from_draft",
      "no_git_commit_creation_from_draft",
      "forbidden_action_missing_no_git_commit_creation",
      false,
    ],
    [
      "no_provider_openai_call_from_draft",
      "no_provider_openai_call_from_draft",
      "forbidden_action_missing_no_provider_openai_call",
      true,
    ],
    [
      "no_retrieval_rag_execution_from_draft",
      "no_retrieval_rag_execution_from_draft",
      "forbidden_action_missing_no_retrieval_rag_execution",
      true,
    ],
    [
      "no_db_write_or_query_from_draft",
      "no_db_write_or_query_from_draft",
      "forbidden_action_missing_no_db_write_or_query",
      true,
    ],
    [
      "no_perspective_promotion_from_draft",
      "no_perspective_promotion_from_draft",
      "forbidden_action_missing_no_perspective_promotion",
      true,
    ],
    [
      "no_product_write_from_draft",
      "no_product_write_from_draft",
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
  boundary: CodexHandoffDraftAuthorityBoundary,
  failureCodes: Set<string>,
) {
  const checks: [keyof CodexHandoffDraftAuthorityBoundary, string][] = [
    ["codex_handoff_draft_runtime_build_implemented_now", "codex_handoff_draft_runtime_build_enabled"],
    ["codex_handoff_draft_write_now", "codex_handoff_draft_write_enabled"],
    ["codex_handoff_implemented_now", "codex_handoff_enabled"],
    ["codex_execution_now", "codex_execution_enabled"],
    ["github_automation_now", "github_automation_enabled"],
    ["github_pr_creation_now", "github_pr_creation_enabled"],
    ["git_branch_creation_now", "git_branch_creation_enabled"],
    ["git_commit_creation_now", "git_commit_creation_enabled"],
    ["external_handoff_sending_now", "external_handoff_sending_enabled"],
    ["agent_routing_now", "agent_routing_enabled"],
    ["agent_execution_now", "agent_execution_enabled"],
    ["ai_context_packet_runtime_build_implemented_now", "ai_context_packet_runtime_build_enabled"],
    ["provider_openai_call_now", "provider_openai_call_enabled"],
    ["retrieval_rag_execution_now", "retrieval_rag_execution_enabled"],
    ["runtime_geometry_digest_build_implemented_now", "runtime_geometry_digest_build_enabled"],
    ["graph_mutation_now", "graph_mutation_enabled"],
    ["durable_perspective_state_read_now", "durable_perspective_state_read_enabled"],
    ["durable_perspective_state_write_now", "durable_perspective_state_write_enabled"],
    ["durable_perspective_delta_apply_now", "durable_perspective_delta_apply_enabled"],
    ["proof_or_evidence_record_write_now", "proof_or_evidence_record_write_enabled"],
    ["accepted_evidence_write_now", "accepted_evidence_write_enabled"],
    ["formation_receipt_write_now", "formation_receipt_write_enabled"],
    ["work_mutation_now", "work_mutation_enabled"],
    ["runtime_db_query_now", "runtime_db_query_enabled"],
    ["runtime_db_write_now", "runtime_db_write_enabled"],
    ["durable_memory_write_now", "durable_memory_write_enabled"],
    ["codex_execution_authority", "codex_execution_authority_enabled"],
    ["github_automation_authority", "github_automation_authority_enabled"],
    ["github_pr_creation_authority", "github_pr_creation_authority_enabled"],
    ["git_branch_creation_authority", "git_branch_creation_authority_enabled"],
    ["git_commit_authority", "git_commit_authority_enabled"],
    ["branch_name_git_authority", "branch_name_git_authority_enabled"],
    ["pr_title_body_github_authority", "pr_title_body_github_authority_enabled"],
    ["product_write_authority", "product_write_enabled"],
    ["product_id_allocation_authority", "product_id_allocation_enabled"],
  ];
  for (const [key, failureCode] of checks) {
    if (boundary[key] !== false) failureCodes.add(failureCode);
  }
}

function validateImplementationAuthorityBoundary(
  boundary: CodexHandoffDraftImplementationAuthorityBoundary,
): string[] {
  const failureCodes = new Set<string>();
  validateContractAuthorityBoundary(
    boundary as unknown as CodexHandoffDraftAuthorityBoundary,
    failureCodes,
  );
  if (boundary.contract_changed_now !== false) {
    failureCodes.add("contract_changed_enabled");
  }
  return uniqueSorted(Array.from(failureCodes));
}

function validateReferences(
  inputPreview: JsonRecord,
  draft: CodexHandoffDraftPreview,
) {
  const failureCodes = new Set<string>();
  const allStrings: string[] = [];
  visit({ inputPreview, draft }, (_key, value) => {
    if (typeof value === "string") allStrings.push(value);
  });
  if (!hasText(draft.draft_id)) failureCodes.add("draft_id_missing");
  if (asArray(draft.source_refs).length === 0) {
    failureCodes.add("source_refs_missing");
  }
  if (!hasText(draft.target_repository)) {
    failureCodes.add("target_repository_missing");
  }
  if (!hasText(draft.canonical_checkout)) {
    failureCodes.add("canonical_checkout_missing");
  }
  const expectedFiles = asArray(draft.expected_files).map(asRecord);
  if (
    expectedFiles.some((file) =>
      privateOrUnstableFilePath(asString(file.file_path)),
    )
  ) {
    failureCodes.add("expected_file_path_private_or_unstable");
  }
  visit({ inputPreview, draft }, (key, value) => {
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

function validateDraftSectionFamilyContracts(
  families: CodexHandoffDraftSectionFamily[],
): boolean {
  return (
    deepEqual(
      families.map((family) => family.section_kind),
      expectedSectionKinds,
    ) &&
    families.every((family) => family.runtime_write_now === false) &&
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
        family.section_kind === "final_report_template" &&
        family.final_report_not_completion_proof === true,
    )
  );
}

function getImplementationAuthorityBoundary(): CodexHandoffDraftImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    deterministic_builder_added_now: true,
    contract_changed_now: false,
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
    formation_receipt_write_now: false,
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
    target_agent_mode_authority: false,
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

function privateOrUnstableFilePath(value: string): boolean {
  return (
    value.length === 0 ||
    value.startsWith("/") ||
    value.startsWith("~") ||
    value.includes("..") ||
    /(?:^|\/)\.(?:ssh|env|aws|config)(?:\/|$)/.test(value)
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
