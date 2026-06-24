import type {
  DogfoodingResearchToPerspectiveCiExpansionAuthorityBoundary,
  DogfoodingResearchToPerspectiveCiExpansionContractFixture,
  DogfoodingResearchToPerspectiveCiExpansionForbiddenActionsPolicy,
  DogfoodingResearchToPerspectiveCiExpansionInputField,
  DogfoodingResearchToPerspectiveCiExpansionOutputField,
  DogfoodingResearchToPerspectiveCiExpansionPrivacyPolicy,
  DogfoodingResearchToPerspectiveCiExpansionPrinciples,
  DogfoodingResearchToPerspectiveCiExpansionSectionFamily,
  DogfoodingResearchToPerspectiveCiExpansionSectionKind,
  DogfoodingResearchToPerspectiveCiExpansionValidationPolicy,
} from "@/types/dogfooding-research-to-perspective-ci-expansion-contract";

type JsonRecord = Record<string, unknown>;

type DogfoodingContractWithFingerprint =
  DogfoodingResearchToPerspectiveCiExpansionContractFixture & {
    contract_fingerprint: string;
  };

type DogfoodingPreview = JsonRecord & {
  dogfooding_preview_id?: unknown;
  dogfooding_version?: unknown;
  source_pr_ref?: unknown;
  codex_result_summary?: unknown;
  changed_files_summary?: unknown;
  validation_matrix_summary?: unknown;
  warnings_summary?: unknown;
  skipped_checks_summary?: unknown;
  authority_boundary_summary?: unknown;
  candidate_review_implications?: unknown;
  perspective_delta_candidate_preview?: unknown;
  ci_expansion_candidate_preview?: unknown;
  source_refs?: unknown;
  validation_policy?: unknown;
  privacy_policy?: unknown;
  all_sections_public_safe?: unknown;
  all_runtime_write_now_false?: unknown;
};

export type DogfoodingResearchToPerspectiveCiExpansionValidation = {
  passed: boolean;
  failure_codes: string[];
  preview_bundle_follows_contract: boolean;
  preview_bundle_authority_boundary_matches_contract: boolean;
  preview_bundle_validation_policy_matches_contract: boolean;
  preview_bundle_forbidden_actions_policy_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  dogfooding_input_fields_preserved: boolean;
  dogfooding_output_fields_preserved: boolean;
  dogfooding_principles_preserved: boolean;
  dogfooding_section_families_preserved: boolean;
  forbidden_actions_policy_preserved: boolean;
  dogfooding_record_candidate_context_not_truth: boolean;
  ci_signal_not_proof_or_evidence: boolean;
  smoke_pass_not_truth: boolean;
  smoke_fail_diagnostic_not_rejection: boolean;
  codex_result_report_candidate_input_not_execution_proof: boolean;
  pr_body_operator_report_not_authority: boolean;
  merge_status_context_not_product_write: boolean;
  changed_files_review_cues_not_correctness_proof: boolean;
  validation_commands_review_cues_not_execution_authority: boolean;
  warnings_diagnostic_not_failure_unless_policy_says_so: boolean;
  skipped_checks_explicitly_justified: boolean;
  authority_boundary_regression_candidate_alert_not_mutation: boolean;
  dogfooding_candidate_remains_candidate_until_future_gate: boolean;
  product_decision_delta_candidate_later_not_state_now: boolean;
  public_safe_refs_only: boolean;
  runtime_dogfooding_ingestion_not_implemented: boolean;
  dogfooding_record_write_not_implemented: boolean;
  ci_runtime_change_not_implemented: boolean;
  github_actions_not_added: boolean;
  ci_execution_not_implemented: boolean;
  codex_execution_now_false: boolean;
  github_automation_now_false: boolean;
  provider_openai_call_not_implemented: boolean;
  retrieval_rag_execution_not_implemented: boolean;
  runtime_db_write_query_not_implemented: boolean;
  perspective_promotion_not_implemented: boolean;
  proof_or_evidence_write_not_implemented: boolean;
  work_mutation_now_false: boolean;
  product_write_not_implemented: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
  no_access_tokens: boolean;
  no_ssh_keys: boolean;
  invalid_dogfooding_preview_override_rejected: boolean;
  invalid_dogfooding_section_override_rejected: boolean;
  invalid_forbidden_actions_override_rejected: boolean;
  invalid_authority_boundary_override_rejected: boolean;
  invalid_refs_override_rejected: boolean;
};

export type DogfoodingResearchToPerspectiveCiExpansionPreviewBundle = {
  preview_version: "dogfooding_research_to_perspective_ci_expansion_preview.v0.1";
  source_contract_ref: string;
  operator_context_ref: string;
  dogfooding_input_preview: JsonRecord;
  dogfooding_preview: DogfoodingPreview;
  dogfooding_principle_summary: JsonRecord;
  dogfooding_section_family_summary: JsonRecord;
  forbidden_actions_summary: JsonRecord;
  reference_summary: JsonRecord;
  validation: DogfoodingResearchToPerspectiveCiExpansionValidation;
  authority_boundary: DogfoodingResearchToPerspectiveCiExpansionAuthorityBoundary;
  validation_policy: DogfoodingResearchToPerspectiveCiExpansionValidationPolicy;
  forbidden_actions_policy:
    DogfoodingResearchToPerspectiveCiExpansionForbiddenActionsPolicy;
};

type ImplementationAuthorityBoundary = {
  implementation_added_now: true;
  deterministic_builder_added_now: true;
  contract_changed_now: false;
  runtime_dogfooding_ingestion_implemented_now: false;
  dogfooding_record_write_now: false;
  ci_runtime_change_now: false;
  github_actions_added_now: false;
  ci_execution_now: false;
  codex_execution_now: false;
  github_automation_now: false;
  github_pr_creation_now: false;
  git_branch_creation_now: false;
  git_commit_creation_now: false;
  feedback_event_write_now: false;
  agent_substrate_mutation_now: false;
  salience_write_now: false;
  durable_memory_write_now: false;
  linkage_record_write_now: false;
  formation_receipt_write_now: false;
  provider_openai_call_now: false;
  retrieval_rag_execution_now: false;
  source_fetch_now: false;
  crawler_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  proof_or_evidence_record_write_now: false;
  accepted_evidence_write_now: false;
  work_mutation_now: false;
  runtime_db_write_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  dogfooding_authority: false;
  ci_authority: false;
  github_actions_authority: false;
  validation_pass_truth_authority: false;
  validation_failure_rejection_authority: false;
  codex_result_execution_authority: false;
  pr_body_authority: false;
  changed_files_correctness_authority: false;
  boundary_regression_mutation_authority: false;
  product_write_lane_parked_by_686: true;
};

export type DogfoodingResearchToPerspectiveCiExpansionImplementation = {
  implementation_kind: "dogfooding_research_to_perspective_ci_expansion_implementation";
  implementation_version: "dogfooding_research_to_perspective_ci_expansion_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  implemented_contract: JsonRecord;
  deterministic_builder: JsonRecord;
  built_dogfooding_research_to_perspective_ci_expansion_preview_bundle:
    DogfoodingResearchToPerspectiveCiExpansionPreviewBundle;
  validated_implementation:
    DogfoodingResearchToPerspectiveCiExpansionValidation;
  authority_boundary: ImplementationAuthorityBoundary;
  recommendation_status:
    "ready_for_dogfooding_research_to_perspective_ci_expansion_browser_validation_v0_1";
  next_recommended_slice:
    "dogfooding_research_to_perspective_ci_expansion_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
};

type BuildImplementationInput = {
  dogfooding_research_to_perspective_ci_expansion_contract:
    DogfoodingContractWithFingerprint;
  source_contract_ref?: string;
  source_contract_fixture_path?: string;
  type_contract_path?: string;
  operator_context_ref?: string;
  dogfooding_input_preview?: JsonRecord;
  dogfooding_preview?: DogfoodingPreview;
  dogfooding_section_families?:
    DogfoodingResearchToPerspectiveCiExpansionSectionFamily[];
  forbidden_actions_policy?:
    DogfoodingResearchToPerspectiveCiExpansionForbiddenActionsPolicy;
  authority_boundary_overrides?: Partial<ImplementationAuthorityBoundary>;
};

type BuildPreviewBundleInput = {
  contract: DogfoodingContractWithFingerprint;
  source_contract_ref?: string;
  operator_context_ref?: string;
  dogfooding_input_preview?: JsonRecord;
  dogfooding_preview?: DogfoodingPreview;
  dogfooding_section_families?:
    DogfoodingResearchToPerspectiveCiExpansionSectionFamily[];
  forbidden_actions_policy?:
    DogfoodingResearchToPerspectiveCiExpansionForbiddenActionsPolicy;
};

const defaultContractFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json";
const defaultTypeContractPath =
  "types/dogfooding-research-to-perspective-ci-expansion-contract.ts";
const defaultBuilderPath =
  "lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts" as const;

const expectedInputFields:
  DogfoodingResearchToPerspectiveCiExpansionInputField[] = [
    "dogfooding_scope_ref",
    "source_pr_ref",
    "codex_result_report_ref",
    "changed_files_ref",
    "validation_matrix_ref",
    "warning_refs",
    "skipped_check_refs",
    "authority_boundary_ref",
    "source_refs",
    "operator_context_ref",
  ];

const expectedOutputFields:
  DogfoodingResearchToPerspectiveCiExpansionOutputField[] = [
    "dogfooding_preview_id",
    "dogfooding_version",
    "source_pr_ref",
    "codex_result_summary",
    "changed_files_summary",
    "validation_matrix_summary",
    "warnings_summary",
    "skipped_checks_summary",
    "authority_boundary_summary",
    "candidate_review_implications",
    "perspective_delta_candidate_preview",
    "ci_expansion_candidate_preview",
    "source_refs",
    "validation_policy",
    "privacy_policy",
  ];

const expectedSectionKinds:
  DogfoodingResearchToPerspectiveCiExpansionSectionKind[] = [
    "source_pr",
    "codex_result_report",
    "changed_files_summary",
    "validation_matrix_summary",
    "warnings_summary",
    "skipped_checks_summary",
    "authority_boundary_summary",
    "candidate_review_implications",
    "perspective_delta_candidate_preview",
    "ci_expansion_candidate_preview",
    "source_refs",
  ];

export function buildDogfoodingResearchToPerspectiveCiExpansionImplementationFixture(
  input: BuildImplementationInput,
): DogfoodingResearchToPerspectiveCiExpansionImplementation {
  const contract =
    input.dogfooding_research_to_perspective_ci_expansion_contract;
  const sourceContractRef =
    input.source_contract_ref ??
    `${contract.contract_version}:${defaultContractFixturePath}`;
  const authorityBoundary = {
    ...getImplementationAuthorityBoundary(),
    ...(input.authority_boundary_overrides ?? {}),
  };
  const builtBundle =
    buildDogfoodingResearchToPerspectiveCiExpansionPreviewBundle({
      contract,
      source_contract_ref: sourceContractRef,
      operator_context_ref: input.operator_context_ref,
      dogfooding_input_preview: input.dogfooding_input_preview,
      dogfooding_preview: input.dogfooding_preview,
      dogfooding_section_families: input.dogfooding_section_families,
      forbidden_actions_policy: input.forbidden_actions_policy,
    });
  const boundaryFailureCodes =
    validateImplementationAuthorityBoundary(authorityBoundary);
  const topLevelBoundaryIsSeparate =
    builtBundle.authority_boundary.implementation_added_now === false &&
    !Object.hasOwn(
      builtBundle.authority_boundary,
      "deterministic_builder_added_now",
    ) &&
    authorityBoundary.implementation_added_now === true &&
    authorityBoundary.deterministic_builder_added_now === true;
  const failureCodes = uniqueSorted(
    [
      ...builtBundle.validation.failure_codes,
      ...boundaryFailureCodes,
      topLevelBoundaryIsSeparate ? null : "implementation_boundary_not_separate",
    ].filter(isPresent),
  );
  const validatedImplementation:
    DogfoodingResearchToPerspectiveCiExpansionValidation = {
      ...builtBundle.validation,
      passed: failureCodes.length === 0,
      failure_codes: failureCodes,
      top_level_implementation_boundary_is_separate:
        topLevelBoundaryIsSeparate,
      invalid_dogfooding_preview_override_rejected: true,
      invalid_dogfooding_section_override_rejected: true,
      invalid_forbidden_actions_override_rejected: true,
      invalid_authority_boundary_override_rejected: true,
      invalid_refs_override_rejected: true,
    };
  const implementationWithoutFingerprint = {
    implementation_kind:
      "dogfooding_research_to_perspective_ci_expansion_implementation" as const,
    implementation_version:
      "dogfooding_research_to_perspective_ci_expansion_implementation.v0.1" as const,
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
      contract_dogfooding_principles_preserved: true,
      contract_dogfooding_section_families_preserved: true,
      contract_forbidden_actions_policy_preserved: true,
    },
    deterministic_builder: {
      builder_path: defaultBuilderPath,
      deterministic_fixture_backed_only: true,
      runtime_dogfooding_ingestion_now: false,
      dogfooding_record_write_now: false,
      ci_runtime_change_now: false,
      github_actions_added_now: false,
      ci_execution_now: false,
      codex_execution_now: false,
      github_automation_now: false,
      github_pr_creation_now: false,
      git_branch_creation_now: false,
      git_commit_creation_now: false,
      feedback_event_write_now: false,
      agent_substrate_mutation_now: false,
      salience_write_now: false,
      durable_memory_write_now: false,
      linkage_record_write_now: false,
      formation_receipt_write_now: false,
      provider_openai_call_now: false,
      retrieval_rag_execution_now: false,
      source_fetch_now: false,
      crawler_now: false,
      durable_perspective_state_write_now: false,
      durable_perspective_delta_apply_now: false,
      proof_evidence_write_now: false,
      accepted_evidence_write_now: false,
      work_mutation_now: false,
      runtime_db_query_now: false,
      runtime_db_write_now: false,
      production_db_used_now: false,
    },
    built_dogfooding_research_to_perspective_ci_expansion_preview_bundle:
      builtBundle,
    validated_implementation: validatedImplementation,
    authority_boundary: authorityBoundary,
    recommendation_status:
      "ready_for_dogfooding_research_to_perspective_ci_expansion_browser_validation_v0_1" as const,
    next_recommended_slice:
      "dogfooding_research_to_perspective_ci_expansion_browser_validation_v0_1" as const,
    fingerprint_algorithm: "fnv1a32_canonical_json" as const,
  };
  return {
    ...implementationWithoutFingerprint,
    implementation_fingerprint:
      createDogfoodingResearchToPerspectiveCiExpansionFingerprint(
        implementationWithoutFingerprint,
      ),
  };
}

export function buildDogfoodingResearchToPerspectiveCiExpansionPreviewBundle(
  input: BuildPreviewBundleInput,
): DogfoodingResearchToPerspectiveCiExpansionPreviewBundle {
  const sample = asRecord(
    input.contract.sample_dogfooding_ci_expansion_preview,
  );
  const dogfoodingInputPreview = clone(
    input.dogfooding_input_preview ??
      asRecord(sample.dogfooding_input_preview),
  );
  const dogfoodingPreview = clone(
    input.dogfooding_preview ?? asRecord(sample.dogfooding_preview),
  ) as DogfoodingPreview;
  const dogfoodingSectionFamilies =
    input.dogfooding_section_families ??
    input.contract.dogfooding_section_families;
  const forbiddenActionsPolicy =
    input.forbidden_actions_policy ??
    input.contract.forbidden_actions_policy;
  const bundleWithoutValidation = {
    preview_version:
      "dogfooding_research_to_perspective_ci_expansion_preview.v0.1" as const,
    source_contract_ref:
      input.source_contract_ref ??
      `${input.contract.contract_version}:${defaultContractFixturePath}`,
    operator_context_ref:
      input.operator_context_ref ?? asString(sample.operator_context_ref),
    dogfooding_input_preview: dogfoodingInputPreview,
    dogfooding_preview: dogfoodingPreview,
    dogfooding_principle_summary:
      buildDogfoodingPrincipleSummary(input.contract.dogfooding_principles),
    dogfooding_section_family_summary:
      buildDogfoodingSectionFamilySummary(dogfoodingSectionFamilies),
    forbidden_actions_summary:
      buildForbiddenActionsSummary(forbiddenActionsPolicy),
    reference_summary: buildReferenceSummary(
      dogfoodingInputPreview,
      dogfoodingPreview,
      input.contract.privacy_policy,
    ),
    authority_boundary: clone(input.contract.authority_boundary),
    validation_policy: clone(input.contract.validation_policy),
    forbidden_actions_policy: clone(forbiddenActionsPolicy),
  };
  return {
    ...bundleWithoutValidation,
    validation:
      validateDogfoodingResearchToPerspectiveCiExpansionPreviewBundle(
        bundleWithoutValidation,
        input.contract,
        dogfoodingSectionFamilies,
        forbiddenActionsPolicy,
      ),
  };
}

export function validateDogfoodingResearchToPerspectiveCiExpansionPreviewBundle(
  previewBundle: Omit<
    DogfoodingResearchToPerspectiveCiExpansionPreviewBundle,
    "validation"
  >,
  contract: DogfoodingContractWithFingerprint,
  dogfoodingSectionFamilies:
    DogfoodingResearchToPerspectiveCiExpansionSectionFamily[] =
    contract.dogfooding_section_families,
  forbiddenActionsPolicy:
    DogfoodingResearchToPerspectiveCiExpansionForbiddenActionsPolicy =
    contract.forbidden_actions_policy,
): DogfoodingResearchToPerspectiveCiExpansionValidation {
  const failureCodes = new Set<string>();
  const dogfoodingPreview = previewBundle.dogfooding_preview;
  const referenceValidation = validateReferences(
    previewBundle.dogfooding_input_preview,
    dogfoodingPreview,
  );

  validateDogfoodingPreview(dogfoodingPreview, failureCodes);
  validateSectionFamilies(dogfoodingSectionFamilies, failureCodes);
  validateDogfoodingSections(dogfoodingPreview, failureCodes);
  validateForbiddenActions(forbiddenActionsPolicy, failureCodes);
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
  const dogfoodingInputFieldsPreserved = deepEqual(
    contract.dogfooding_input_fields,
    expectedInputFields,
  );
  const dogfoodingOutputFieldsPreserved = deepEqual(
    contract.dogfooding_output_fields,
    expectedOutputFields,
  );
  const dogfoodingPrinciplesPreserved = allTrue(
    contract.dogfooding_principles as unknown as JsonRecord,
  );
  const dogfoodingSectionFamiliesPreserved =
    validateSectionFamilyContracts(contract.dogfooding_section_families);
  const forbiddenActionsPolicyPreserved = allTrue(
    contract.forbidden_actions_policy as unknown as JsonRecord,
  );
  const principles = contract.dogfooding_principles;
  const validationPolicy = contract.validation_policy;
  const boundary = previewBundle.authority_boundary;
  const validationMatrix = asRecord(
    dogfoodingPreview.validation_matrix_summary,
  );
  const codexResult = asRecord(dogfoodingPreview.codex_result_summary);
  const changedFiles = asRecord(dogfoodingPreview.changed_files_summary);
  const warnings = asRecord(dogfoodingPreview.warnings_summary);
  const skippedChecks = asRecord(dogfoodingPreview.skipped_checks_summary);
  const authoritySummary = asRecord(
    dogfoodingPreview.authority_boundary_summary,
  );
  const candidateReview = asRecord(
    dogfoodingPreview.candidate_review_implications,
  );
  const perspectiveDelta = asRecord(
    dogfoodingPreview.perspective_delta_candidate_preview,
  );
  const ciExpansion = asRecord(
    dogfoodingPreview.ci_expansion_candidate_preview,
  );
  const noRuntimeBoundary =
    boundary.runtime_dogfooding_ingestion_implemented_now === false &&
    boundary.dogfooding_record_write_now === false &&
    boundary.ci_runtime_change_now === false &&
    boundary.github_actions_added_now === false &&
    boundary.ci_execution_now === false &&
    boundary.codex_execution_now === false &&
    boundary.github_automation_now === false &&
    boundary.provider_openai_call_now === false &&
    boundary.retrieval_rag_execution_now === false &&
    boundary.durable_perspective_state_write_now === false &&
    boundary.durable_perspective_delta_apply_now === false &&
    boundary.proof_or_evidence_record_write_now === false &&
    boundary.accepted_evidence_write_now === false &&
    boundary.work_mutation_now === false &&
    boundary.runtime_db_write_now === false &&
    boundary.runtime_db_query_now === false &&
    boundary.product_write_authority === false &&
    boundary.product_id_allocation_authority === false &&
    boundary.dogfooding_authority === false &&
    boundary.ci_authority === false &&
    boundary.github_actions_authority === false;
  const previewBundleFollowsContract =
    previewBundle.preview_version ===
      "dogfooding_research_to_perspective_ci_expansion_preview.v0.1" &&
    hasText(previewBundle.source_contract_ref) &&
    hasText(previewBundle.operator_context_ref) &&
    hasText(dogfoodingPreview.dogfooding_preview_id) &&
    Array.isArray(dogfoodingPreview.source_refs) &&
    dogfoodingPreview.source_refs.length > 0 &&
    previewBoundaryMatchesContract &&
    validationPolicyMatchesContract &&
    forbiddenActionsPolicyMatchesContract &&
    dogfoodingInputFieldsPreserved &&
    dogfoodingOutputFieldsPreserved &&
    dogfoodingPrinciplesPreserved &&
    dogfoodingSectionFamiliesPreserved &&
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
    dogfooding_input_fields_preserved: dogfoodingInputFieldsPreserved,
    dogfooding_output_fields_preserved: dogfoodingOutputFieldsPreserved,
    dogfooding_principles_preserved: dogfoodingPrinciplesPreserved,
    dogfooding_section_families_preserved:
      dogfoodingSectionFamiliesPreserved,
    forbidden_actions_policy_preserved: forbiddenActionsPolicyPreserved,
    dogfooding_record_candidate_context_not_truth:
      principles.dogfooding_record_is_candidate_review_context_not_truth ===
        true &&
      validationPolicy.dogfooding_not_source_of_truth === true,
    ci_signal_not_proof_or_evidence:
      principles.ci_signal_not_proof_or_evidence === true &&
      validationPolicy.ci_signal_not_proof_or_evidence === true,
    smoke_pass_not_truth:
      principles.smoke_pass_not_truth === true &&
      validationMatrix.smoke_pass_not_truth === true,
    smoke_fail_diagnostic_not_rejection:
      principles.smoke_fail_diagnostic_not_automatic_rejection === true &&
      validationMatrix.smoke_fail_diagnostic_not_rejection === true,
    codex_result_report_candidate_input_not_execution_proof:
      principles.codex_result_report_candidate_input_not_execution_proof ===
        true &&
      codexResult.candidate_input_only === true &&
      codexResult.not_execution_proof === true,
    pr_body_operator_report_not_authority:
      principles.pr_body_operator_report_not_authority === true &&
      boundary.pr_body_authority === false,
    merge_status_context_not_product_write:
      principles.merge_status_repo_event_context_not_product_write === true &&
      boundary.product_write_authority === false,
    changed_files_review_cues_not_correctness_proof:
      principles.changed_files_review_cues_not_correctness_proof === true &&
      changedFiles.changed_files_are_review_cues_only === true &&
      changedFiles.not_correctness_proof === true,
    validation_commands_review_cues_not_execution_authority:
      principles.validation_commands_review_cues_not_execution_authority ===
        true &&
      validationMatrix.validation_commands_are_review_cues_only === true &&
      validationMatrix.not_execution_authority === true,
    warnings_diagnostic_not_failure_unless_policy_says_so:
      principles.warnings_diagnostic_not_failure_unless_policy_says_so ===
        true &&
      warnings.warnings_are_diagnostic_only === true &&
      warnings.warning_not_failure_unless_policy_says_so === true,
    skipped_checks_explicitly_justified:
      principles.skipped_checks_explicitly_justified === true &&
      skippedChecks.skipped_checks_not_silent === true &&
      skippedChecksHaveReasons(skippedChecks.skipped_checks),
    authority_boundary_regression_candidate_alert_not_mutation:
      principles.authority_boundary_regression_candidate_alert_not_mutation ===
        true &&
      authoritySummary.regression_is_candidate_alert_not_mutation === true,
    dogfooding_candidate_remains_candidate_until_future_gate:
      principles.dogfooding_candidate_remains_candidate_until_future_gate ===
        true &&
      candidateReview.candidate_only === true &&
      perspectiveDelta.future_human_gate_required === true,
    product_decision_delta_candidate_later_not_state_now:
      principles.product_decision_can_create_delta_candidate_later_not_state_now ===
        true &&
      perspectiveDelta.not_durable_perspective_delta === true,
    public_safe_refs_only: referenceValidation.public_safe_refs_only,
    runtime_dogfooding_ingestion_not_implemented:
      validationPolicy.no_runtime_dogfooding_ingestion === true &&
      boundary.runtime_dogfooding_ingestion_implemented_now === false,
    dogfooding_record_write_not_implemented:
      validationPolicy.no_dogfooding_record_write === true &&
      boundary.dogfooding_record_write_now === false,
    ci_runtime_change_not_implemented:
      validationPolicy.no_ci_runtime_change === true &&
      boundary.ci_runtime_change_now === false &&
      ciExpansion.ci_runtime_change_now === false,
    github_actions_not_added:
      validationPolicy.no_github_actions_addition === true &&
      boundary.github_actions_added_now === false &&
      ciExpansion.github_actions_added_now === false,
    ci_execution_not_implemented:
      boundary.ci_execution_now === false &&
      contract.forbidden_actions_policy.no_ci_execution === true,
    codex_execution_now_false:
      boundary.codex_execution_now === false &&
      contract.forbidden_actions_policy.no_codex_execution === true,
    github_automation_now_false:
      boundary.github_automation_now === false &&
      contract.forbidden_actions_policy.no_github_automation === true,
    provider_openai_call_not_implemented:
      validationPolicy.no_provider_openai_call === true &&
      boundary.provider_openai_call_now === false,
    retrieval_rag_execution_not_implemented:
      validationPolicy.no_retrieval_rag_execution === true &&
      boundary.retrieval_rag_execution_now === false,
    runtime_db_write_query_not_implemented:
      validationPolicy.no_db_write_or_query === true &&
      boundary.runtime_db_write_now === false &&
      boundary.runtime_db_query_now === false,
    perspective_promotion_not_implemented:
      validationPolicy.no_perspective_promotion === true &&
      boundary.durable_perspective_delta_apply_now === false,
    proof_or_evidence_write_not_implemented:
      validationPolicy.no_proof_or_evidence_write === true &&
      boundary.proof_or_evidence_record_write_now === false,
    work_mutation_now_false:
      validationPolicy.no_work_mutation === true &&
      boundary.work_mutation_now === false,
    product_write_not_implemented:
      validationPolicy.no_product_write_or_ids === true &&
      boundary.product_write_authority === false &&
      boundary.product_id_allocation_authority === false &&
      principles.product_write_lane_parked_by_686 === true,
    no_raw_private_source_body:
      referenceValidation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      referenceValidation.no_raw_provider_thread_run_session_ids,
    no_private_urls: referenceValidation.no_private_urls,
    no_secrets: referenceValidation.no_secrets,
    no_access_tokens: referenceValidation.no_access_tokens,
    no_ssh_keys: referenceValidation.no_ssh_keys,
    invalid_dogfooding_preview_override_rejected: true,
    invalid_dogfooding_section_override_rejected: true,
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

export function createDogfoodingResearchToPerspectiveCiExpansionFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function buildDogfoodingPrincipleSummary(
  principles: DogfoodingResearchToPerspectiveCiExpansionPrinciples,
): JsonRecord {
  return {
    ...clone(principles),
    dogfooding_principle_count: Object.keys(principles).length,
    all_dogfooding_principles_preserved: allTrue(
      principles as unknown as JsonRecord,
    ),
  };
}

function buildDogfoodingSectionFamilySummary(
  families: DogfoodingResearchToPerspectiveCiExpansionSectionFamily[],
): JsonRecord {
  return {
    dogfooding_section_family_count: families.length,
    section_kinds: families.map((family) => family.section_kind),
    all_dogfooding_section_families_preserved:
      validateSectionFamilyContracts(families),
    every_section_runtime_write_now_false: families.every(
      (family) => family.runtime_write_now === false,
    ),
  };
}

function buildForbiddenActionsSummary(
  policy: DogfoodingResearchToPerspectiveCiExpansionForbiddenActionsPolicy,
): JsonRecord {
  return {
    forbidden_action_count: Object.keys(policy).length,
    all_forbidden_actions_preserved: allTrue(policy as unknown as JsonRecord),
    no_runtime_dogfooding_ingestion: policy.no_runtime_dogfooding_ingestion,
    no_ci_runtime_change: policy.no_ci_runtime_change,
    no_github_actions_addition: policy.no_github_actions_addition,
    no_provider_openai_call: policy.no_provider_openai_call,
    no_retrieval_rag_execution: policy.no_retrieval_rag_execution,
    no_product_write: policy.no_product_write,
  };
}

function buildReferenceSummary(
  inputPreview: JsonRecord,
  dogfoodingPreview: DogfoodingPreview,
  privacyPolicy: DogfoodingResearchToPerspectiveCiExpansionPrivacyPolicy,
): JsonRecord {
  const referenceValidation = validateReferences(
    inputPreview,
    dogfoodingPreview,
  );
  return {
    ...referenceValidation,
    privacy_policy_preserved: allTrue(
      privacyPolicy as unknown as JsonRecord,
    ),
    source_ref_count: asArray(dogfoodingPreview.source_refs).length,
    source_pr_ref: dogfoodingPreview.source_pr_ref,
    input_source_pr_ref: inputPreview.source_pr_ref,
  };
}

function validateDogfoodingPreview(
  dogfoodingPreview: DogfoodingPreview,
  failureCodes: Set<string>,
) {
  const codexResult = asRecord(dogfoodingPreview.codex_result_summary);
  const changedFiles = asRecord(dogfoodingPreview.changed_files_summary);
  const validationMatrix = asRecord(
    dogfoodingPreview.validation_matrix_summary,
  );
  const ciExpansion = asRecord(
    dogfoodingPreview.ci_expansion_candidate_preview,
  );
  if (!hasText(dogfoodingPreview.dogfooding_preview_id)) {
    failureCodes.add("dogfooding_preview_missing_preview_id");
  }
  if (asArray(dogfoodingPreview.source_refs).length === 0) {
    failureCodes.add("dogfooding_preview_missing_source_refs");
  }
  if (dogfoodingPreview.all_runtime_write_now_false !== true) {
    failureCodes.add("dogfooding_preview_runtime_write_enabled");
  }
  if (dogfoodingPreview.all_sections_public_safe !== true) {
    failureCodes.add("dogfooding_preview_not_public_safe");
  }
  if (flagEnabled(dogfoodingPreview, "product_write_now")) {
    failureCodes.add("dogfooding_preview_product_write_enabled");
  }
  if (
    flagEnabled(dogfoodingPreview, "ci_runtime_change_now") ||
    ciExpansion.ci_runtime_change_now !== false
  ) {
    failureCodes.add("dogfooding_preview_ci_runtime_change_enabled");
  }
  if (
    flagEnabled(dogfoodingPreview, "github_actions_added_now") ||
    ciExpansion.github_actions_added_now !== false
  ) {
    failureCodes.add("dogfooding_preview_github_actions_added");
  }
  if (flagEnabled(dogfoodingPreview, "ci_execution_now")) {
    failureCodes.add("dogfooding_preview_ci_execution_enabled");
  }
  if (validationMatrix.smoke_pass_not_truth !== true) {
    failureCodes.add("dogfooding_preview_smoke_pass_truth_enabled");
  }
  if (validationMatrix.smoke_fail_diagnostic_not_rejection !== true) {
    failureCodes.add("dogfooding_preview_smoke_fail_rejection_enabled");
  }
  if (codexResult.not_execution_proof !== true) {
    failureCodes.add("dogfooding_preview_codex_execution_proof_enabled");
  }
  if (changedFiles.not_correctness_proof !== true) {
    failureCodes.add("dogfooding_preview_changed_files_correctness_enabled");
  }
}

function validateSectionFamilies(
  families: DogfoodingResearchToPerspectiveCiExpansionSectionFamily[],
  failureCodes: Set<string>,
) {
  const knownKinds = new Set(expectedSectionKinds);
  for (const family of families) {
    const record = family as unknown as JsonRecord;
    const sectionKind = asString(record.section_kind);
    if (!sectionKind) {
      failureCodes.add("dogfooding_section_missing_section_kind");
      continue;
    }
    if (
      !knownKinds.has(
        sectionKind as DogfoodingResearchToPerspectiveCiExpansionSectionKind,
      )
    ) {
      failureCodes.add("dogfooding_section_unknown_section_kind");
    }
    if (record.runtime_write_now !== false) {
      failureCodes.add("dogfooding_section_runtime_write_enabled");
    }
    if (
      sectionKind === "source_pr" &&
      record.not_github_authority !== true
    ) {
      failureCodes.add("source_pr_github_authority_enabled");
    }
    if (
      sectionKind === "codex_result_report" &&
      record.not_execution_proof !== true
    ) {
      failureCodes.add("codex_result_execution_proof_enabled");
    }
    if (
      sectionKind === "changed_files_summary" &&
      record.not_correctness_proof !== true
    ) {
      failureCodes.add("changed_files_correctness_proof_enabled");
    }
    if (sectionKind === "validation_matrix_summary") {
      if (record.not_execution_authority !== true) {
        failureCodes.add("validation_matrix_execution_authority_enabled");
      }
      if (record.smoke_pass_not_truth !== true) {
        failureCodes.add("validation_matrix_smoke_pass_truth_enabled");
      }
      if (record.smoke_fail_diagnostic_not_rejection !== true) {
        failureCodes.add("validation_matrix_smoke_fail_rejection_enabled");
      }
    }
    if (
      sectionKind === "warnings_summary" &&
      record.warning_not_failure_unless_policy_says_so !== true
    ) {
      failureCodes.add("warning_treated_as_failure_without_policy");
    }
    if (
      sectionKind === "skipped_checks_summary" &&
      record.skipped_checks_require_reason !== true
    ) {
      failureCodes.add("skipped_check_missing_reason");
    }
    if (
      sectionKind === "authority_boundary_summary" &&
      record.regression_is_candidate_alert_not_mutation !== true
    ) {
      failureCodes.add("authority_boundary_regression_mutation_enabled");
    }
    if (
      sectionKind === "candidate_review_implications" &&
      record.not_proof_or_evidence !== true
    ) {
      failureCodes.add("candidate_review_implication_proof_enabled");
    }
    if (
      sectionKind === "perspective_delta_candidate_preview" &&
      record.not_durable_perspective_delta !== true
    ) {
      failureCodes.add("perspective_delta_candidate_durable_state_enabled");
    }
    if (
      sectionKind === "ci_expansion_candidate_preview" &&
      record.github_actions_added_now !== false
    ) {
      failureCodes.add("ci_expansion_candidate_github_actions_added");
    }
  }
}

function validateDogfoodingSections(
  dogfoodingPreview: DogfoodingPreview,
  failureCodes: Set<string>,
) {
  const codexResult = asRecord(dogfoodingPreview.codex_result_summary);
  const changedFiles = asRecord(dogfoodingPreview.changed_files_summary);
  const validationMatrix = asRecord(
    dogfoodingPreview.validation_matrix_summary,
  );
  const warnings = asRecord(dogfoodingPreview.warnings_summary);
  const skippedChecks = asRecord(dogfoodingPreview.skipped_checks_summary);
  const authoritySummary = asRecord(
    dogfoodingPreview.authority_boundary_summary,
  );
  const candidateReview = asRecord(
    dogfoodingPreview.candidate_review_implications,
  );
  const perspectiveDelta = asRecord(
    dogfoodingPreview.perspective_delta_candidate_preview,
  );
  const ciExpansion = asRecord(
    dogfoodingPreview.ci_expansion_candidate_preview,
  );
  if (codexResult.not_execution_proof !== true) {
    failureCodes.add("codex_result_execution_proof_enabled");
  }
  if (changedFiles.not_correctness_proof !== true) {
    failureCodes.add("changed_files_correctness_proof_enabled");
  }
  if (validationMatrix.not_execution_authority !== true) {
    failureCodes.add("validation_matrix_execution_authority_enabled");
  }
  if (validationMatrix.smoke_pass_not_truth !== true) {
    failureCodes.add("validation_matrix_smoke_pass_truth_enabled");
  }
  if (validationMatrix.smoke_fail_diagnostic_not_rejection !== true) {
    failureCodes.add("validation_matrix_smoke_fail_rejection_enabled");
  }
  if (warnings.warning_not_failure_unless_policy_says_so !== true) {
    failureCodes.add("warning_treated_as_failure_without_policy");
  }
  if (!skippedChecksHaveReasons(skippedChecks.skipped_checks)) {
    failureCodes.add("skipped_check_missing_reason");
  }
  if (authoritySummary.regression_is_candidate_alert_not_mutation !== true) {
    failureCodes.add("authority_boundary_regression_mutation_enabled");
  }
  if (candidateReview.not_proof_or_evidence !== true) {
    failureCodes.add("candidate_review_implication_proof_enabled");
  }
  if (perspectiveDelta.not_durable_perspective_delta !== true) {
    failureCodes.add("perspective_delta_candidate_durable_state_enabled");
  }
  if (ciExpansion.github_actions_added_now !== false) {
    failureCodes.add("ci_expansion_candidate_github_actions_added");
  }
}

function validateForbiddenActions(
  policy: DogfoodingResearchToPerspectiveCiExpansionForbiddenActionsPolicy,
  failureCodes: Set<string>,
) {
  const required: [
    keyof DogfoodingResearchToPerspectiveCiExpansionForbiddenActionsPolicy,
    string,
  ][] = [
    [
      "no_runtime_dogfooding_ingestion",
      "forbidden_action_missing_no_runtime_dogfooding_ingestion",
    ],
    [
      "no_dogfooding_record_write",
      "forbidden_action_missing_no_dogfooding_record_write",
    ],
    ["no_ci_runtime_change", "forbidden_action_missing_no_ci_runtime_change"],
    [
      "no_github_actions_addition",
      "forbidden_action_missing_no_github_actions_addition",
    ],
    ["no_ci_execution", "forbidden_action_missing_no_ci_execution"],
    ["no_codex_execution", "forbidden_action_missing_no_codex_execution"],
    [
      "no_github_automation",
      "forbidden_action_missing_no_github_automation",
    ],
    [
      "no_provider_openai_call",
      "forbidden_action_missing_no_provider_openai_call",
    ],
    [
      "no_retrieval_rag_execution",
      "forbidden_action_missing_no_retrieval_rag_execution",
    ],
    ["no_db_write_or_query", "forbidden_action_missing_no_db_write_or_query"],
    [
      "no_perspective_promotion",
      "forbidden_action_missing_no_perspective_promotion",
    ],
    ["no_product_write", "forbidden_action_missing_no_product_write"],
  ];
  for (const [key, failureCode] of required) {
    if (policy[key] !== true) failureCodes.add(failureCode);
  }
}

function validateContractAuthorityBoundary(
  boundary: DogfoodingResearchToPerspectiveCiExpansionAuthorityBoundary,
  failureCodes: Set<string>,
) {
  validateAuthorityBoundaryFlags(boundary as unknown as JsonRecord, failureCodes);
}

function validateImplementationAuthorityBoundary(
  boundary: ImplementationAuthorityBoundary,
): string[] {
  const failureCodes = new Set<string>();
  validateAuthorityBoundaryFlags(boundary as unknown as JsonRecord, failureCodes);
  if (boundary.contract_changed_now !== false) {
    failureCodes.add("contract_changed_enabled");
  }
  return uniqueSorted(Array.from(failureCodes));
}

function validateAuthorityBoundaryFlags(
  boundary: JsonRecord,
  failureCodes: Set<string>,
) {
  const checks: [string, string][] = [
    [
      "runtime_dogfooding_ingestion_implemented_now",
      "runtime_dogfooding_ingestion_enabled",
    ],
    ["dogfooding_record_write_now", "dogfooding_record_write_enabled"],
    ["ci_runtime_change_now", "ci_runtime_change_enabled"],
    ["github_actions_added_now", "github_actions_added_enabled"],
    ["ci_execution_now", "ci_execution_enabled"],
    ["codex_execution_now", "codex_execution_enabled"],
    ["github_automation_now", "github_automation_enabled"],
    ["github_pr_creation_now", "github_pr_creation_enabled"],
    ["git_branch_creation_now", "git_branch_creation_enabled"],
    ["git_commit_creation_now", "git_commit_creation_enabled"],
    ["feedback_event_write_now", "feedback_event_write_enabled"],
    ["agent_substrate_mutation_now", "agent_substrate_mutation_enabled"],
    ["provider_openai_call_now", "provider_openai_call_enabled"],
    ["retrieval_rag_execution_now", "retrieval_rag_execution_enabled"],
    [
      "durable_perspective_state_write_now",
      "durable_perspective_state_write_enabled",
    ],
    [
      "durable_perspective_delta_apply_now",
      "durable_perspective_delta_apply_enabled",
    ],
    [
      "proof_or_evidence_record_write_now",
      "proof_or_evidence_record_write_enabled",
    ],
    ["accepted_evidence_write_now", "accepted_evidence_write_enabled"],
    ["work_mutation_now", "work_mutation_enabled"],
    ["runtime_db_query_now", "runtime_db_query_enabled"],
    ["runtime_db_write_now", "runtime_db_write_enabled"],
    ["dogfooding_authority", "dogfooding_authority_enabled"],
    ["ci_authority", "ci_authority_enabled"],
    ["github_actions_authority", "github_actions_authority_enabled"],
    [
      "validation_pass_truth_authority",
      "validation_pass_truth_authority_enabled",
    ],
    [
      "validation_failure_rejection_authority",
      "validation_failure_rejection_authority_enabled",
    ],
    [
      "codex_result_execution_authority",
      "codex_result_execution_authority_enabled",
    ],
    ["pr_body_authority", "pr_body_authority_enabled"],
    [
      "changed_files_correctness_authority",
      "changed_files_correctness_authority_enabled",
    ],
    [
      "boundary_regression_mutation_authority",
      "boundary_regression_mutation_authority_enabled",
    ],
    ["product_write_authority", "product_write_enabled"],
    ["product_id_allocation_authority", "product_id_allocation_enabled"],
  ];
  for (const [key, failureCode] of checks) {
    if (boundary[key] !== false) failureCodes.add(failureCode);
  }
}

function validateReferences(
  inputPreview: JsonRecord,
  dogfoodingPreview: DogfoodingPreview,
) {
  const failureCodes = new Set<string>();
  const allStrings: string[] = [];
  visit({ inputPreview, dogfoodingPreview }, (_key, value) => {
    if (typeof value === "string") allStrings.push(value);
  });
  if (!hasText(dogfoodingPreview.dogfooding_preview_id)) {
    failureCodes.add("dogfooding_preview_id_missing");
  }
  if (
    asArray(dogfoodingPreview.source_refs).length === 0 ||
    asArray(inputPreview.source_refs).length === 0
  ) {
    failureCodes.add("source_refs_missing");
  }
  if (!hasText(inputPreview.source_pr_ref)) {
    failureCodes.add("pr_ref_missing");
  }
  if (!hasText(inputPreview.codex_result_report_ref)) {
    failureCodes.add("codex_result_report_ref_missing");
  }
  if (!hasText(inputPreview.validation_matrix_ref)) {
    failureCodes.add("validation_matrix_ref_missing");
  }
  visit({ inputPreview, dogfoodingPreview }, (key, value) => {
    if (
      typeof value === "string" &&
      (key.endsWith("_ref") ||
        key.endsWith("_refs") ||
        key === "source_refs" ||
        key === "warning_refs") &&
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
  if (
    allStrings.some((value) =>
      /https?:\/\/|localhost|127\.0\.0\.1|file:\/\//.test(value),
    )
  ) {
    failureCodes.add("private_or_unstable_ref_detected");
    failureCodes.add("no_private_urls");
  }
  if (
    allStrings.some((value) =>
      /\b(?:thread|run|session|sess)_[A-Za-z0-9]{6,}/.test(value),
    )
  ) {
    failureCodes.add("raw_provider_thread_run_session_id_detected");
  }
  if (
    allStrings.some((value) => /\braw private source body\b/i.test(value))
  ) {
    failureCodes.add("raw_private_source_body_detected");
  }
  if (
    allStrings.some((value) =>
      /(sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]+)/.test(
        value,
      ),
    )
  ) {
    failureCodes.add("access_token_detected");
  }
  if (
    allStrings.some((value) =>
      /-----BEGIN (?:OPENSSH |RSA |EC |DSA )?PRIVATE KEY-----/.test(value),
    )
  ) {
    failureCodes.add("ssh_key_detected");
  }
  return {
    failure_codes: uniqueSorted(Array.from(failureCodes)),
    public_safe_refs_only:
      !failureCodes.has("private_or_unstable_ref_detected"),
    no_raw_private_source_body:
      !failureCodes.has("raw_private_source_body_detected"),
    no_raw_provider_thread_run_session_ids:
      !failureCodes.has("raw_provider_thread_run_session_id_detected"),
    no_private_urls: !failureCodes.has("no_private_urls"),
    no_secrets: !failureCodes.has("access_token_detected"),
    no_access_tokens: !failureCodes.has("access_token_detected"),
    no_ssh_keys: !failureCodes.has("ssh_key_detected"),
  };
}

function validateSectionFamilyContracts(
  families: DogfoodingResearchToPerspectiveCiExpansionSectionFamily[],
) {
  return (
    deepEqual(
      families.map((family) => family.section_kind),
      expectedSectionKinds,
    ) && families.every((family) => family.runtime_write_now === false)
  );
}

function getImplementationAuthorityBoundary(): ImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    deterministic_builder_added_now: true,
    contract_changed_now: false,
    runtime_dogfooding_ingestion_implemented_now: false,
    dogfooding_record_write_now: false,
    ci_runtime_change_now: false,
    github_actions_added_now: false,
    ci_execution_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    github_pr_creation_now: false,
    git_branch_creation_now: false,
    git_commit_creation_now: false,
    feedback_event_write_now: false,
    agent_substrate_mutation_now: false,
    salience_write_now: false,
    durable_memory_write_now: false,
    linkage_record_write_now: false,
    formation_receipt_write_now: false,
    provider_openai_call_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    proof_or_evidence_record_write_now: false,
    accepted_evidence_write_now: false,
    work_mutation_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    dogfooding_authority: false,
    ci_authority: false,
    github_actions_authority: false,
    validation_pass_truth_authority: false,
    validation_failure_rejection_authority: false,
    codex_result_execution_authority: false,
    pr_body_authority: false,
    changed_files_correctness_authority: false,
    boundary_regression_mutation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function skippedChecksHaveReasons(value: unknown) {
  const skippedChecks = asArray(value);
  return skippedChecks.every((check) => {
    const record = asRecord(check);
    return hasText(record.reason_ref) || hasText(record.reason);
  });
}

function publicSafeRefOrHint(key: string, value: string) {
  if (!hasText(value)) return false;
  if (value.includes(":public:")) return true;
  if (key === "operator_context_ref" && value.startsWith("operator_context:")) {
    return true;
  }
  if (key === "dogfooding_preview_id" && value.startsWith("dogfooding_")) {
    return true;
  }
  return false;
}

function flagEnabled(record: JsonRecord, key: string) {
  return record[key] === true;
}

function allTrue(record: JsonRecord) {
  return Object.values(record).every((value) => value === true);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepEqual(left: unknown, right: unknown) {
  return canonicalJson(left) === canonicalJson(right);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function isPresent(value: string | null): value is string {
  return typeof value === "string";
}

function visit(value: unknown, visitor: (key: string, value: unknown) => void) {
  function walk(current: unknown, key: string) {
    visitor(key, current);
    if (Array.isArray(current)) {
      for (const item of current) walk(item, key);
      return;
    }
    if (current && typeof current === "object") {
      for (const [childKey, childValue] of Object.entries(
        current as JsonRecord,
      )) {
        walk(childValue, childKey);
      }
    }
  }
  walk(value, "");
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return Object.fromEntries(
      Object.keys(record)
        .filter((key) => key !== "implementation_fingerprint")
        .sort()
        .map((key) => [key, stripGeneratedFields(record[key])]),
    );
  }
  return value;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value as JsonRecord)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonicalJson(
            (value as JsonRecord)[key],
          )}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
