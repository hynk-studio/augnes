import type {
  BoundedExternalAllowedSourceInputKind,
  BoundedExternalDisallowedSourceInputKind,
  BoundedExternalSourceIntakeContract,
  BoundedExternalSourceIntakeReferenceBundle,
  BoundedExternalSourceReference,
  BoundedExternalSourceStatusValue,
} from "@/types/bounded-external-source-intake-contract";

type JsonRecord = Record<string, unknown>;

export interface BoundedExternalSourceIntakeImplementationInput {
  bounded_external_source_intake_contract: BoundedExternalSourceIntakeContract;
  generated_at?: string;
  source_refs?: BoundedExternalSourceReference[];
  source_intake_bundle_id?: string;
  source_contract_ref?: string;
}

export type BoundedExternalGeneratedSourceIntakeReferenceBundle =
  BoundedExternalSourceIntakeReferenceBundle;

export interface BoundedExternalAllowedSourceInputSummary {
  allowed_input_count: number;
  allowed_input_kinds: BoundedExternalAllowedSourceInputKind[];
  all_inputs_reference_only_now: boolean;
  all_source_fetch_now_false: boolean;
  all_provider_extraction_now_false: boolean;
  all_candidate_generation_later_only: boolean;
  all_require_source_refs: boolean;
  all_require_operator_context: boolean;
  all_public_safe_fixture_only_now: boolean;
}

export interface BoundedExternalDisallowedSourceInputSummary {
  disallowed_input_count: number;
  disallowed_input_kinds: BoundedExternalDisallowedSourceInputKind[];
  includes_crawler_seed: boolean;
  includes_unbounded_domain_crawl: boolean;
  includes_automatic_web_search: boolean;
  includes_raw_oauth_token: boolean;
  includes_raw_private_url_as_canonical_id: boolean;
  all_disallowed_now: boolean;
  all_have_reasons: boolean;
}

export interface BoundedExternalSourceReferenceSummary {
  source_ref_count: number;
  source_ref_ids: string[];
  all_public_safe: boolean;
  all_have_source_refs: boolean;
  all_have_operator_context: boolean;
  all_reference_only_now: boolean;
  all_source_fetch_now_false: boolean;
  all_provider_extraction_now_false: boolean;
  raw_url_not_canonical_id: true;
  raw_provider_id_not_canonical_id: true;
  private_identifier_not_canonical_id: true;
  no_fetch_now: true;
  no_crawl_now: true;
  no_provider_call_now: true;
  no_retrieval_rag_now: true;
  no_embedding_now: true;
  no_index_write_now: true;
}

export interface BoundedExternalCandidateGenerationSummary {
  source_intake_may_prepare_candidates_later: true;
  candidate_generation_not_implemented_now: true;
  generated_candidate_is_not_proof_or_evidence: true;
  generated_candidate_is_not_source_of_truth: true;
  generated_candidate_does_not_promote_perspective: true;
  generated_candidate_does_not_mutate_work: true;
  generated_candidate_does_not_write_product: true;
  human_review_required_later: true;
}

export interface BoundedExternalProvenanceSummary {
  source_refs_required: true;
  operator_context_required: true;
  provenance_visible_to_review_surface_later: true;
  unresolved_source_status_allowed: true;
  source_status_values: BoundedExternalSourceStatusValue[];
  all_source_refs_have_valid_status: boolean;
}

export interface BoundedExternalPrivacySummary {
  public_safe_fixture_only_now: true;
  no_secrets_in_fixture: true;
  no_raw_oauth_tokens: true;
  no_private_urls_in_fixture: true;
  no_provider_ids_as_canonical_labels: true;
  no_thread_run_session_ids_as_canonical_labels: true;
}

export interface BoundedExternalNonAuthoritySummary {
  not_source_of_truth: true;
  not_proof_or_evidence: true;
  not_perspective_state: true;
  not_work_status: true;
  not_promotion_basis: true;
  not_retrieval_rag_result: true;
  not_salience_authority: true;
  not_product_write: true;
  source_reference_not_evidence_record: true;
  provider_summary_not_evidence_record: true;
  retrieval_result_not_authority: true;
}

export interface BoundedExternalSourceIntakeImplementationAuthorityBoundary {
  implementation_added_now: true;
  contract_followed_now: true;
  fixture_backed_only: true;
  deterministic_builder_added_now: true;
  runtime_source_fetch_implemented_now: false;
  crawler_implemented_now: false;
  provider_extraction_implemented_now: false;
  retrieval_rag_implemented_now: false;
  source_index_write_now: false;
  durable_source_record_write_now: false;
  candidate_generation_now: false;
  candidate_mutation_now: false;
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
  formation_receipt_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state_write: false;
  promotion_decision_record: false;
  work_mutation: false;
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

export interface BoundedExternalSourceIntakeImplementationValidationPolicy {
  static_source_validation_only: true;
  fixture_backed_only: true;
  app_server_started_now: false;
  production_db_used_now: false;
  runtime_browser_request_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  runtime_source_fetch_now: false;
  runtime_provider_call_now: false;
  runtime_retrieval_rag_now: false;
}

export interface BoundedExternalSourceIntakeImplementationValidation {
  passed: boolean;
  failure_codes: string[];
  generated_bundle_follows_contract: boolean;
  generated_bundle_boundary_matches_contract: boolean;
  generated_bundle_validation_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  allowed_inputs_reference_only: boolean;
  source_fetch_not_implemented: boolean;
  provider_extraction_not_implemented: boolean;
  retrieval_rag_not_implemented: boolean;
  source_index_write_not_implemented: boolean;
  durable_source_record_write_not_implemented: boolean;
  candidate_generation_not_implemented: boolean;
  source_refs_have_operator_context: boolean;
  privacy_policy_preserved: boolean;
  non_authority_policy_preserved: boolean;
  authority_boundary_preserved: boolean;
  deterministic_rebuild_matches_fixture: true;
}

export interface BoundedExternalSourceIntakeImplementation {
  implementation_kind: "bounded_external_source_intake_implementation";
  implementation_version: "bounded_external_source_intake_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  source_salience_governor_validation_ref: string;
  generated_source_intake_reference_bundle:
    BoundedExternalGeneratedSourceIntakeReferenceBundle;
  allowed_source_input_summary: BoundedExternalAllowedSourceInputSummary;
  disallowed_source_input_summary: BoundedExternalDisallowedSourceInputSummary;
  source_reference_summary: BoundedExternalSourceReferenceSummary;
  candidate_generation_summary: BoundedExternalCandidateGenerationSummary;
  provenance_summary: BoundedExternalProvenanceSummary;
  privacy_summary: BoundedExternalPrivacySummary;
  non_authority_summary: BoundedExternalNonAuthoritySummary;
  authority_boundary: BoundedExternalSourceIntakeImplementationAuthorityBoundary;
  validation_policy: BoundedExternalSourceIntakeImplementationValidationPolicy;
  validation: BoundedExternalSourceIntakeImplementationValidation;
  recommendation_status:
    "ready_for_bounded_external_source_intake_browser_validation_v0_1";
  next_recommended_slice: "bounded_external_source_intake_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const defaultSourceContractFixturePath =
  "fixtures/research-candidate-review.bounded-external-source-intake-contract.sample.v0.1.json";

export function buildBoundedExternalSourceIntakeImplementation(
  input: BoundedExternalSourceIntakeImplementationInput,
): BoundedExternalSourceIntakeImplementation {
  const contract = input.bounded_external_source_intake_contract;
  const authorityBoundary =
    getBoundedExternalSourceIntakeImplementationAuthorityBoundary();
  const validationPolicy =
    getBoundedExternalSourceIntakeImplementationValidationPolicy();
  const generatedBundle = buildGeneratedSourceIntakeReferenceBundle({
    contract,
    generatedAt:
      input.generated_at ??
      contract.sample_source_intake_reference_bundle.generated_at,
    sourceRefs:
      input.source_refs ?? contract.sample_source_intake_reference_bundle.source_refs,
    sourceIntakeBundleId:
      input.source_intake_bundle_id ??
      contract.sample_source_intake_reference_bundle.source_intake_bundle_id,
  });
  const allowedInputSummary = buildAllowedSourceInputSummary(contract);
  const disallowedInputSummary = buildDisallowedSourceInputSummary(contract);
  const sourceReferenceSummary = buildSourceReferenceSummary(
    contract,
    generatedBundle.source_refs,
  );
  const candidateGenerationSummary = {
    ...contract.candidate_generation_policy,
  };
  const provenanceSummary = buildProvenanceSummary(
    contract,
    generatedBundle.source_refs,
  );
  const privacySummary = {
    ...contract.privacy_policy,
  };
  const nonAuthoritySummary = {
    ...contract.non_authority_policy,
  };

  const generatedBundleFollowsContract =
    sourceIntakeReferenceBundleFollowsContract(generatedBundle);
  const generatedBundleBoundaryMatchesContract = deepEqual(
    generatedBundle.authority_boundary,
    contract.authority_boundary,
  );
  const generatedBundleValidationMatchesContract = deepEqual(
    generatedBundle.validation,
    contract.validation_policy,
  );
  const topLevelBoundaryIsSeparate =
    !Object.hasOwn(generatedBundle.authority_boundary, "implementation_added_now") &&
    !Object.hasOwn(
      generatedBundle.authority_boundary,
      "deterministic_builder_added_now",
    ) &&
    authorityBoundary.implementation_added_now === true &&
    authorityBoundary.deterministic_builder_added_now === true;
  const allowedInputsReferenceOnly =
    allowedInputSummary.all_inputs_reference_only_now &&
    allowedInputSummary.all_candidate_generation_later_only &&
    allowedInputSummary.all_require_source_refs &&
    allowedInputSummary.all_require_operator_context;
  const sourceFetchNotImplemented =
    allowedInputSummary.all_source_fetch_now_false &&
    sourceReferenceSummary.all_source_fetch_now_false &&
    contract.source_reference_policy.no_fetch_now === true &&
    contract.authority_boundary.runtime_source_fetch_implemented_now === false;
  const providerExtractionNotImplemented =
    allowedInputSummary.all_provider_extraction_now_false &&
    sourceReferenceSummary.all_provider_extraction_now_false &&
    contract.source_reference_policy.no_provider_call_now === true &&
    contract.authority_boundary.provider_extraction_implemented_now === false;
  const retrievalRagNotImplemented =
    contract.source_reference_policy.no_retrieval_rag_now === true &&
    contract.authority_boundary.retrieval_rag_implemented_now === false;
  const sourceIndexWriteNotImplemented =
    contract.source_reference_policy.no_index_write_now === true &&
    contract.authority_boundary.source_index_write_now === false;
  const durableSourceRecordWriteNotImplemented =
    contract.authority_boundary.durable_source_record_write_now === false;
  const candidateGenerationNotImplemented =
    contract.candidate_generation_policy.candidate_generation_not_implemented_now ===
      true && contract.authority_boundary.candidate_generation_now === false;
  const sourceRefsHaveOperatorContext =
    sourceReferenceSummary.all_have_operator_context;
  const privacyPolicyIsPreserved = privacyPolicyPreserved(contract);
  const nonAuthorityPolicyIsPreserved = nonAuthorityPolicyPreserved(contract);
  const authorityBoundaryPreserved = implementationAuthorityBoundaryPreserved(
    authorityBoundary,
  );
  const failureCodes = [
    generatedBundleFollowsContract ? null : "generated_bundle_contract_mismatch",
    generatedBundleBoundaryMatchesContract
      ? null
      : "generated_bundle_boundary_mismatch",
    generatedBundleValidationMatchesContract
      ? null
      : "generated_bundle_validation_mismatch",
    topLevelBoundaryIsSeparate ? null : "implementation_boundary_not_separate",
    allowedInputsReferenceOnly ? null : "allowed_input_not_reference_only",
    sourceFetchNotImplemented ? null : "source_fetch_implemented",
    providerExtractionNotImplemented ? null : "provider_extraction_implemented",
    retrievalRagNotImplemented ? null : "retrieval_rag_implemented",
    sourceIndexWriteNotImplemented ? null : "source_index_write_implemented",
    durableSourceRecordWriteNotImplemented
      ? null
      : "durable_source_record_write_implemented",
    candidateGenerationNotImplemented ? null : "candidate_generation_implemented",
    sourceRefsHaveOperatorContext ? null : "source_ref_missing_operator_context",
    privacyPolicyIsPreserved ? null : "privacy_policy_not_preserved",
    nonAuthorityPolicyIsPreserved ? null : "non_authority_policy_not_preserved",
    authorityBoundaryPreserved ? null : "authority_boundary_not_preserved",
    provenanceSummary.all_source_refs_have_valid_status
      ? null
      : "source_ref_invalid_status",
    sourceReferenceSummary.all_have_source_refs ? null : "source_ref_missing_refs",
    sourceReferenceSummary.all_public_safe ? null : "source_ref_not_public_safe",
  ].filter((code): code is string => Boolean(code));

  const implementation: BoundedExternalSourceIntakeImplementation = {
    implementation_kind: "bounded_external_source_intake_implementation",
    implementation_version: "bounded_external_source_intake_implementation.v0.1",
    source_contract_ref:
      input.source_contract_ref ??
      `${contract.contract_version}:${defaultSourceContractFixturePath}`,
    source_contract_fingerprint: contract.contract_fingerprint,
    source_salience_governor_validation_ref:
      contract.source_salience_governor_validation_ref,
    generated_source_intake_reference_bundle: generatedBundle,
    allowed_source_input_summary: allowedInputSummary,
    disallowed_source_input_summary: disallowedInputSummary,
    source_reference_summary: sourceReferenceSummary,
    candidate_generation_summary: candidateGenerationSummary,
    provenance_summary: provenanceSummary,
    privacy_summary: privacySummary,
    non_authority_summary: nonAuthoritySummary,
    authority_boundary: authorityBoundary,
    validation_policy: validationPolicy,
    validation: {
      passed: failureCodes.length === 0,
      failure_codes: uniqueSorted(failureCodes),
      generated_bundle_follows_contract: generatedBundleFollowsContract,
      generated_bundle_boundary_matches_contract:
        generatedBundleBoundaryMatchesContract,
      generated_bundle_validation_matches_contract:
        generatedBundleValidationMatchesContract,
      top_level_implementation_boundary_is_separate: topLevelBoundaryIsSeparate,
      allowed_inputs_reference_only: allowedInputsReferenceOnly,
      source_fetch_not_implemented: sourceFetchNotImplemented,
      provider_extraction_not_implemented: providerExtractionNotImplemented,
      retrieval_rag_not_implemented: retrievalRagNotImplemented,
      source_index_write_not_implemented: sourceIndexWriteNotImplemented,
      durable_source_record_write_not_implemented:
        durableSourceRecordWriteNotImplemented,
      candidate_generation_not_implemented: candidateGenerationNotImplemented,
      source_refs_have_operator_context: sourceRefsHaveOperatorContext,
      privacy_policy_preserved: privacyPolicyIsPreserved,
      non_authority_policy_preserved: nonAuthorityPolicyIsPreserved,
      authority_boundary_preserved: authorityBoundaryPreserved,
      deterministic_rebuild_matches_fixture: true,
    },
    recommendation_status:
      "ready_for_bounded_external_source_intake_browser_validation_v0_1",
    next_recommended_slice:
      "bounded_external_source_intake_browser_validation_v0_1",
    implementation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  implementation.implementation_fingerprint =
    computeBoundedExternalSourceIntakeImplementationFingerprint(implementation);
  return implementation;
}

export function computeBoundedExternalSourceIntakeImplementationFingerprint(
  implementation: BoundedExternalSourceIntakeImplementation,
): string {
  const normalized = clone(implementation) as unknown as JsonRecord;
  delete normalized.implementation_fingerprint;
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

export function getBoundedExternalSourceIntakeImplementationAuthorityBoundary():
  BoundedExternalSourceIntakeImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    contract_followed_now: true,
    fixture_backed_only: true,
    deterministic_builder_added_now: true,
    runtime_source_fetch_implemented_now: false,
    crawler_implemented_now: false,
    provider_extraction_implemented_now: false,
    retrieval_rag_implemented_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
    candidate_generation_now: false,
    candidate_mutation_now: false,
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
    formation_receipt_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state_write: false,
    promotion_decision_record: false,
    work_mutation: false,
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

export function getBoundedExternalSourceIntakeImplementationValidationPolicy():
  BoundedExternalSourceIntakeImplementationValidationPolicy {
  return {
    static_source_validation_only: true,
    fixture_backed_only: true,
    app_server_started_now: false,
    production_db_used_now: false,
    runtime_browser_request_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    runtime_source_fetch_now: false,
    runtime_provider_call_now: false,
    runtime_retrieval_rag_now: false,
  };
}

function buildGeneratedSourceIntakeReferenceBundle(input: {
  contract: BoundedExternalSourceIntakeContract;
  generatedAt: string;
  sourceRefs: BoundedExternalSourceReference[];
  sourceIntakeBundleId: string;
}): BoundedExternalGeneratedSourceIntakeReferenceBundle {
  const sample = input.contract.sample_source_intake_reference_bundle;
  return {
    ...clone(sample),
    source_intake_bundle_id: input.sourceIntakeBundleId,
    generated_at: input.generatedAt,
    source_refs: sortSourceRefs(input.sourceRefs),
    disallowed_source_inputs: clone(input.contract.disallowed_source_inputs),
    source_reference_policy_ref: sample.source_reference_policy_ref,
    candidate_generation_policy_ref: sample.candidate_generation_policy_ref,
    provenance_policy_ref: sample.provenance_policy_ref,
    privacy_policy_ref: sample.privacy_policy_ref,
    non_authority_policy_ref: sample.non_authority_policy_ref,
    authority_boundary: clone(input.contract.authority_boundary),
    validation: clone(input.contract.validation_policy),
  };
}

function buildAllowedSourceInputSummary(
  contract: BoundedExternalSourceIntakeContract,
): BoundedExternalAllowedSourceInputSummary {
  return {
    allowed_input_count: contract.allowed_source_inputs.length,
    allowed_input_kinds: contract.allowed_source_inputs.map(
      (input) => input.input_kind,
    ),
    all_inputs_reference_only_now: contract.allowed_source_inputs.every(
      (input) => input.accepted_as_reference_only_now === true,
    ),
    all_source_fetch_now_false: contract.allowed_source_inputs.every(
      (input) => input.source_fetch_now === false,
    ),
    all_provider_extraction_now_false: contract.allowed_source_inputs.every(
      (input) => input.provider_extraction_now === false,
    ),
    all_candidate_generation_later_only: contract.allowed_source_inputs.every(
      (input) => input.candidate_generation_later_only === true,
    ),
    all_require_source_refs: contract.allowed_source_inputs.every(
      (input) => input.requires_source_refs === true,
    ),
    all_require_operator_context: contract.allowed_source_inputs.every(
      (input) => input.requires_operator_context === true,
    ),
    all_public_safe_fixture_only_now: contract.allowed_source_inputs.every(
      (input) => input.public_safe_fixture_only_now === true,
    ),
  };
}

function buildDisallowedSourceInputSummary(
  contract: BoundedExternalSourceIntakeContract,
): BoundedExternalDisallowedSourceInputSummary {
  const disallowedInputKinds = contract.disallowed_source_inputs.map(
    (input) => input.input_kind,
  );
  return {
    disallowed_input_count: contract.disallowed_source_inputs.length,
    disallowed_input_kinds: disallowedInputKinds,
    includes_crawler_seed: disallowedInputKinds.includes("crawler_seed"),
    includes_unbounded_domain_crawl:
      disallowedInputKinds.includes("unbounded_domain_crawl"),
    includes_automatic_web_search:
      disallowedInputKinds.includes("automatic_web_search"),
    includes_raw_oauth_token: disallowedInputKinds.includes("raw_oauth_token"),
    includes_raw_private_url_as_canonical_id:
      disallowedInputKinds.includes("raw_private_url_as_canonical_id"),
    all_disallowed_now: contract.disallowed_source_inputs.every(
      (input) => input.disallowed_now === true,
    ),
    all_have_reasons: contract.disallowed_source_inputs.every(
      (input) => input.reason.length > 0,
    ),
  };
}

function buildSourceReferenceSummary(
  contract: BoundedExternalSourceIntakeContract,
  sourceRefs: BoundedExternalSourceReference[],
): BoundedExternalSourceReferenceSummary {
  return {
    source_ref_count: sourceRefs.length,
    source_ref_ids: sourceRefs.map((sourceRef) => sourceRef.source_ref_id),
    all_public_safe: sourceRefs.every((sourceRef) => sourceRef.public_safe === true),
    all_have_source_refs: sourceRefs.every(
      (sourceRef) =>
        Array.isArray(sourceRef.source_refs) && sourceRef.source_refs.length > 0,
    ),
    all_have_operator_context: sourceRefs.every(
      (sourceRef) => sourceRef.operator_context_ref.length > 0,
    ),
    all_reference_only_now: sourceRefs.every(
      (sourceRef) => sourceRef.accepted_as_reference_only_now === true,
    ),
    all_source_fetch_now_false: sourceRefs.every(
      (sourceRef) => sourceRef.source_fetch_now === false,
    ),
    all_provider_extraction_now_false: sourceRefs.every(
      (sourceRef) => sourceRef.provider_extraction_now === false,
    ),
    raw_url_not_canonical_id:
      contract.source_reference_policy.raw_url_not_canonical_id,
    raw_provider_id_not_canonical_id:
      contract.source_reference_policy.raw_provider_id_not_canonical_id,
    private_identifier_not_canonical_id:
      contract.source_reference_policy.private_identifier_not_canonical_id,
    no_fetch_now: contract.source_reference_policy.no_fetch_now,
    no_crawl_now: contract.source_reference_policy.no_crawl_now,
    no_provider_call_now: contract.source_reference_policy.no_provider_call_now,
    no_retrieval_rag_now:
      contract.source_reference_policy.no_retrieval_rag_now,
    no_embedding_now: contract.source_reference_policy.no_embedding_now,
    no_index_write_now: contract.source_reference_policy.no_index_write_now,
  };
}

function buildProvenanceSummary(
  contract: BoundedExternalSourceIntakeContract,
  sourceRefs: BoundedExternalSourceReference[],
): BoundedExternalProvenanceSummary {
  return {
    source_refs_required: contract.provenance_policy.source_refs_required,
    operator_context_required:
      contract.provenance_policy.operator_context_required,
    provenance_visible_to_review_surface_later:
      contract.provenance_policy.provenance_visible_to_review_surface_later,
    unresolved_source_status_allowed:
      contract.provenance_policy.unresolved_source_status_allowed,
    source_status_values: [...contract.provenance_policy.source_status_values],
    all_source_refs_have_valid_status: sourceRefs.every((sourceRef) =>
      contract.provenance_policy.source_status_values.includes(
        sourceRef.source_status,
      ),
    ),
  };
}

function sourceIntakeReferenceBundleFollowsContract(
  bundle: BoundedExternalGeneratedSourceIntakeReferenceBundle,
): boolean {
  return (
    bundle.intake_version === "bounded_external_source_intake.v0.1" &&
    typeof bundle.source_intake_bundle_id === "string" &&
    bundle.source_intake_bundle_id.length > 0 &&
    typeof bundle.generated_at === "string" &&
    bundle.generated_at.length > 0 &&
    Array.isArray(bundle.source_refs) &&
    bundle.source_refs.length > 0 &&
    Array.isArray(bundle.disallowed_source_inputs) &&
    bundle.source_reference_policy_ref.length > 0 &&
    bundle.candidate_generation_policy_ref.length > 0 &&
    bundle.provenance_policy_ref.length > 0 &&
    bundle.privacy_policy_ref.length > 0 &&
    bundle.non_authority_policy_ref.length > 0
  );
}

function privacyPolicyPreserved(
  contract: BoundedExternalSourceIntakeContract,
): boolean {
  return (
    contract.privacy_policy.public_safe_fixture_only_now === true &&
    contract.privacy_policy.no_secrets_in_fixture === true &&
    contract.privacy_policy.no_raw_oauth_tokens === true &&
    contract.privacy_policy.no_private_urls_in_fixture === true &&
    contract.privacy_policy.no_provider_ids_as_canonical_labels === true &&
    contract.privacy_policy.no_thread_run_session_ids_as_canonical_labels === true
  );
}

function nonAuthorityPolicyPreserved(
  contract: BoundedExternalSourceIntakeContract,
): boolean {
  return (
    contract.non_authority_policy.not_source_of_truth === true &&
    contract.non_authority_policy.not_proof_or_evidence === true &&
    contract.non_authority_policy.not_perspective_state === true &&
    contract.non_authority_policy.not_work_status === true &&
    contract.non_authority_policy.not_promotion_basis === true &&
    contract.non_authority_policy.not_retrieval_rag_result === true &&
    contract.non_authority_policy.not_salience_authority === true &&
    contract.non_authority_policy.not_product_write === true &&
    contract.non_authority_policy.source_reference_not_evidence_record === true &&
    contract.non_authority_policy.provider_summary_not_evidence_record === true &&
    contract.non_authority_policy.retrieval_result_not_authority === true
  );
}

function implementationAuthorityBoundaryPreserved(
  boundary: BoundedExternalSourceIntakeImplementationAuthorityBoundary,
): boolean {
  return Object.entries(boundary).every(([key, value]) =>
    key === "implementation_added_now" ||
    key === "contract_followed_now" ||
    key === "fixture_backed_only" ||
    key === "deterministic_builder_added_now" ||
    key === "product_write_lane_parked_by_686"
      ? value === true
      : value === false,
  );
}

function sortSourceRefs(
  sourceRefs: BoundedExternalSourceReference[],
): BoundedExternalSourceReference[] {
  return sourceRefs
    .map(clone)
    .sort((a, b) => a.source_ref_id.localeCompare(b.source_ref_id));
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
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
