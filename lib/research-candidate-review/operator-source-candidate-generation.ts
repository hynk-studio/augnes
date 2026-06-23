import type {
  OperatorSourceCandidateGenerationContract,
  OperatorSourceCandidateGenerationPreviewBundle,
  OperatorSourceCandidatePreviewFamilyKind,
  OperatorSourceCandidateSourceRef,
  OperatorSourceGeneratedCandidatePreview,
} from "@/types/operator-source-candidate-generation-contract";

type JsonRecord = Record<string, unknown>;

interface GeneratedCandidateValidation {
  all_generated_candidates_follow_contract: boolean;
  all_have_source_refs: boolean;
  all_source_refs_resolve_to_bundle_refs: boolean;
  all_have_operator_context: boolean;
  all_review_required_later: boolean;
  all_durable_write_now_false: boolean;
  all_not_proof_or_evidence: boolean;
  all_not_source_of_truth: boolean;
  all_not_perspective_state: boolean;
  all_not_work_status: boolean;
  all_not_product_write: boolean;
  failure_codes: string[];
}

export interface OperatorSourceCandidateGenerationImplementationInput {
  operator_source_candidate_generation_contract:
    OperatorSourceCandidateGenerationContract;
  generated_at?: string;
  generated_candidate_previews?: OperatorSourceGeneratedCandidatePreview[];
  source_refs?: OperatorSourceCandidateSourceRef[];
  candidate_generation_preview_bundle_id?: string;
  source_contract_ref?: string;
}

export type OperatorSourceGeneratedCandidateGenerationPreviewBundle =
  OperatorSourceCandidateGenerationPreviewBundle;

export interface OperatorSourceCandidatePreviewFamilySummary {
  family_count: number;
  family_kinds: OperatorSourceCandidatePreviewFamilyKind[];
  all_families_candidate_only: boolean;
  all_families_preview_only: boolean;
  all_families_require_source_refs: boolean;
  all_families_require_operator_context: boolean;
  all_families_review_required_later: boolean;
  all_families_durable_write_now_false: boolean;
}

export interface OperatorSourceGeneratedCandidateSummary {
  generated_candidate_count: number;
  generated_candidate_preview_ids: string[];
  generated_candidate_family_kinds: OperatorSourceCandidatePreviewFamilyKind[];
  all_generated_candidates_preview_only: boolean;
  all_generated_candidates_candidate_only: boolean;
  all_generated_candidates_have_source_refs: boolean;
  all_generated_candidates_have_operator_context: boolean;
  all_generated_candidate_source_refs_resolve_to_bundle_refs: boolean;
  all_generated_candidates_review_required_later: boolean;
  all_generated_candidates_durable_write_now_false: boolean;
  all_generated_candidates_not_proof_or_evidence: boolean;
  all_generated_candidates_not_source_of_truth: boolean;
  all_generated_candidates_not_perspective_state: boolean;
  all_generated_candidates_not_work_status: boolean;
  all_generated_candidates_not_product_write: boolean;
}

export interface OperatorSourceReferenceSummary {
  source_ref_count: number;
  source_ref_ids: string[];
  all_source_refs_reference_only: boolean;
  all_source_refs_public_safe: boolean;
  all_source_refs_have_operator_context: boolean;
  source_intake_bundle_ref_present: boolean;
  no_source_fetch_now: true;
  no_provider_extraction_now: true;
  no_retrieval_rag_now: true;
  invalid_source_refs_rejected_upstream: true;
}

export interface OperatorSourceProvenanceSummary {
  source_refs_required: true;
  source_intake_bundle_ref_required: true;
  operator_context_required: true;
  provenance_visible_to_review_surface_later: true;
  unresolved_source_status_allowed: true;
  invalid_source_refs_rejected_upstream: true;
  source_fetch_not_required_now: true;
}

export interface OperatorSourceReviewSummary {
  review_surface_later_only: true;
  human_review_required_later: true;
  promotion_requires_later_contract: true;
  proof_evidence_requires_later_gate: true;
  work_creation_requires_later_contract: true;
  product_write_requires_later_contract: true;
}

export interface OperatorSourcePrivacySummary {
  public_safe_fixture_only_now: true;
  no_secrets_in_fixture: true;
  no_raw_oauth_tokens: true;
  no_private_urls_in_fixture: true;
  no_provider_ids_as_canonical_labels: true;
  no_thread_run_session_ids_as_canonical_labels: true;
}

export interface OperatorSourceNonAuthoritySummary {
  not_source_of_truth: true;
  not_proof_or_evidence: true;
  not_perspective_state: true;
  not_work_status: true;
  not_promotion_basis: true;
  not_retrieval_rag_result: true;
  not_salience_authority: true;
  not_product_write: true;
  generated_candidate_not_authority: true;
  provider_summary_not_evidence_record: true;
  retrieval_result_not_authority: true;
}

export interface OperatorSourceCandidateGenerationImplementationAuthorityBoundary {
  implementation_added_now: true;
  contract_followed_now: true;
  fixture_backed_only: true;
  deterministic_builder_added_now: true;
  runtime_candidate_generation_implemented_now: false;
  runtime_source_fetch_implemented_now: false;
  crawler_implemented_now: false;
  provider_extraction_implemented_now: false;
  retrieval_rag_implemented_now: false;
  source_index_write_now: false;
  durable_source_record_write_now: false;
  candidate_record_write_now: false;
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

export interface OperatorSourceCandidateGenerationImplementationValidationPolicy {
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
  runtime_candidate_generation_now: false;
}

export interface OperatorSourceCandidateGenerationImplementationValidation {
  passed: boolean;
  failure_codes: string[];
  generated_bundle_follows_contract: boolean;
  generated_bundle_boundary_matches_contract: boolean;
  generated_bundle_validation_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  candidate_preview_families_preserved: boolean;
  generated_candidates_preview_only: boolean;
  generated_candidates_have_source_refs: boolean;
  generated_candidates_source_refs_resolve_to_bundle_refs: boolean;
  generated_candidates_have_operator_context: boolean;
  generated_candidates_review_required_later: boolean;
  generated_candidates_durable_write_now_false: boolean;
  generated_candidates_not_proof_or_evidence: boolean;
  generated_candidates_not_source_of_truth: boolean;
  generated_candidates_not_perspective_state: boolean;
  generated_candidates_not_work_status: boolean;
  generated_candidates_not_product_write: boolean;
  source_refs_reference_only: boolean;
  source_fetch_not_implemented: boolean;
  provider_extraction_not_implemented: boolean;
  retrieval_rag_not_implemented: boolean;
  candidate_generation_not_runtime: boolean;
  candidate_record_write_not_implemented: boolean;
  candidate_mutation_not_implemented: boolean;
  privacy_policy_preserved: boolean;
  non_authority_policy_preserved: boolean;
  authority_boundary_preserved: boolean;
  deterministic_rebuild_matches_fixture: true;
}

export interface OperatorSourceCandidateGenerationImplementation {
  implementation_kind: "operator_source_candidate_generation_implementation";
  implementation_version: "operator_source_candidate_generation_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  source_bounded_external_source_intake_validation_ref: string;
  generated_candidate_generation_preview_bundle:
    OperatorSourceGeneratedCandidateGenerationPreviewBundle;
  candidate_preview_family_summary: OperatorSourceCandidatePreviewFamilySummary;
  generated_candidate_summary: OperatorSourceGeneratedCandidateSummary;
  source_reference_summary: OperatorSourceReferenceSummary;
  provenance_summary: OperatorSourceProvenanceSummary;
  review_summary: OperatorSourceReviewSummary;
  privacy_summary: OperatorSourcePrivacySummary;
  non_authority_summary: OperatorSourceNonAuthoritySummary;
  authority_boundary:
    OperatorSourceCandidateGenerationImplementationAuthorityBoundary;
  validation_policy:
    OperatorSourceCandidateGenerationImplementationValidationPolicy;
  validation: OperatorSourceCandidateGenerationImplementationValidation;
  recommendation_status:
    "ready_for_operator_source_candidate_generation_browser_validation_v0_1";
  next_recommended_slice:
    "operator_source_candidate_generation_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const defaultSourceContractFixturePath =
  "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json";

export function buildOperatorSourceCandidateGenerationImplementation(
  input: OperatorSourceCandidateGenerationImplementationInput,
): OperatorSourceCandidateGenerationImplementation {
  const contract = input.operator_source_candidate_generation_contract;
  const authorityBoundary =
    getOperatorSourceCandidateGenerationImplementationAuthorityBoundary();
  const validationPolicy =
    getOperatorSourceCandidateGenerationImplementationValidationPolicy();
  const generatedBundle = buildGeneratedCandidateGenerationPreviewBundle({
    contract,
    generatedAt:
      input.generated_at ??
      contract.sample_candidate_generation_preview_bundle.generated_at,
    sourceRefs:
      input.source_refs ??
      contract.sample_candidate_generation_preview_bundle.source_refs,
    generatedCandidatePreviews:
      input.generated_candidate_previews ??
      contract.sample_candidate_generation_preview_bundle
        .generated_candidate_previews,
    candidateGenerationPreviewBundleId:
      input.candidate_generation_preview_bundle_id ??
      contract.sample_candidate_generation_preview_bundle
        .candidate_generation_preview_bundle_id,
  });
  const candidatePreviewFamilySummary =
    buildCandidatePreviewFamilySummary(contract);
  const generatedCandidateValidation =
    validateGeneratedCandidatePreviewsAgainstContract(
      contract,
      generatedBundle,
    );
  const generatedCandidateSummary = buildGeneratedCandidateSummary(
    generatedBundle.generated_candidate_previews,
    generatedCandidateValidation,
  );
  const sourceReferenceSummary = buildSourceReferenceSummary(
    contract,
    generatedBundle,
  );
  const provenanceSummary = {
    ...contract.provenance_policy,
  };
  const reviewSummary = {
    ...contract.review_policy,
  };
  const privacySummary = {
    ...contract.privacy_policy,
  };
  const nonAuthoritySummary = {
    ...contract.non_authority_policy,
  };
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
  const candidatePreviewFamiliesPreserved = deepEqual(
    generatedBundle.candidate_preview_families,
    contract.candidate_preview_families,
  );
  const sourceRefsReferenceOnly =
    sourceReferenceSummary.all_source_refs_reference_only &&
    sourceReferenceSummary.all_source_refs_public_safe &&
    sourceReferenceSummary.all_source_refs_have_operator_context;
  const sourceFetchNotImplemented =
    contract.source_input_requirements.source_fetch_now === false &&
    contract.authority_boundary.runtime_source_fetch_implemented_now === false;
  const providerExtractionNotImplemented =
    contract.source_input_requirements.provider_extraction_now === false &&
    contract.authority_boundary.provider_extraction_implemented_now === false;
  const retrievalRagNotImplemented =
    contract.source_input_requirements.retrieval_rag_now === false &&
    contract.authority_boundary.retrieval_rag_implemented_now === false;
  const candidateGenerationNotRuntime =
    contract.generation_scope.runtime_candidate_generation_implemented_now ===
      false &&
    contract.authority_boundary.runtime_candidate_generation_implemented_now ===
      false;
  const candidateRecordWriteNotImplemented =
    contract.authority_boundary.candidate_record_write_now === false;
  const candidateMutationNotImplemented =
    contract.authority_boundary.candidate_mutation_now === false;
  const privacyPolicyIsPreserved = privacyPolicyPreserved(contract);
  const nonAuthorityPolicyIsPreserved = nonAuthorityPolicyPreserved(contract);
  const authorityBoundaryPreserved = implementationAuthorityBoundaryPreserved(
    authorityBoundary,
  );
  const generatedBundleFollowsContract =
    candidateGenerationPreviewBundleFollowsContract(generatedBundle) &&
    candidatePreviewFamiliesPreserved &&
    generatedCandidateValidation.all_generated_candidates_follow_contract;
  const failureCodes = [
    generatedBundleFollowsContract ? null : "generated_bundle_contract_mismatch",
    generatedBundleBoundaryMatchesContract
      ? null
      : "generated_bundle_boundary_mismatch",
    generatedBundleValidationMatchesContract
      ? null
      : "generated_bundle_validation_mismatch",
    topLevelBoundaryIsSeparate ? null : "implementation_boundary_not_separate",
    candidatePreviewFamiliesPreserved
      ? null
      : "candidate_preview_families_not_preserved",
    generatedCandidateValidation.all_generated_candidates_follow_contract
      ? null
      : "generated_candidate_contract_mismatch",
    generatedCandidateValidation.all_have_source_refs
      ? null
      : "generated_candidate_missing_source_refs",
    generatedCandidateValidation.all_source_refs_resolve_to_bundle_refs
      ? null
      : "generated_candidate_unknown_source_ref",
    generatedCandidateValidation.all_have_operator_context
      ? null
      : "generated_candidate_missing_operator_context",
    generatedCandidateValidation.all_review_required_later
      ? null
      : "generated_candidate_review_not_required_later",
    generatedCandidateValidation.all_durable_write_now_false
      ? null
      : "generated_candidate_durable_write_enabled",
    generatedCandidateValidation.all_not_proof_or_evidence
      ? null
      : "generated_candidate_proof_or_evidence_enabled",
    generatedCandidateValidation.all_not_source_of_truth
      ? null
      : "generated_candidate_source_of_truth_enabled",
    generatedCandidateValidation.all_not_perspective_state
      ? null
      : "generated_candidate_perspective_state_enabled",
    generatedCandidateValidation.all_not_work_status
      ? null
      : "generated_candidate_work_status_enabled",
    generatedCandidateValidation.all_not_product_write
      ? null
      : "generated_candidate_product_write_enabled",
    sourceRefsReferenceOnly ? null : "source_refs_not_reference_only",
    sourceFetchNotImplemented ? null : "source_fetch_implemented",
    providerExtractionNotImplemented ? null : "provider_extraction_implemented",
    retrievalRagNotImplemented ? null : "retrieval_rag_implemented",
    candidateGenerationNotRuntime ? null : "runtime_candidate_generation_enabled",
    candidateRecordWriteNotImplemented ? null : "candidate_record_write_enabled",
    candidateMutationNotImplemented ? null : "candidate_mutation_enabled",
    privacyPolicyIsPreserved ? null : "privacy_policy_not_preserved",
    nonAuthorityPolicyIsPreserved ? null : "non_authority_policy_not_preserved",
    authorityBoundaryPreserved ? null : "authority_boundary_not_preserved",
    ...generatedCandidateValidation.failure_codes,
  ].filter((code): code is string => Boolean(code));

  const implementation: OperatorSourceCandidateGenerationImplementation = {
    implementation_kind: "operator_source_candidate_generation_implementation",
    implementation_version:
      "operator_source_candidate_generation_implementation.v0.1",
    source_contract_ref:
      input.source_contract_ref ??
      `${contract.contract_version}:${defaultSourceContractFixturePath}`,
    source_contract_fingerprint: contract.contract_fingerprint,
    source_bounded_external_source_intake_validation_ref:
      contract.source_bounded_external_source_intake_validation_ref,
    generated_candidate_generation_preview_bundle: generatedBundle,
    candidate_preview_family_summary: candidatePreviewFamilySummary,
    generated_candidate_summary: generatedCandidateSummary,
    source_reference_summary: sourceReferenceSummary,
    provenance_summary: provenanceSummary,
    review_summary: reviewSummary,
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
      candidate_preview_families_preserved: candidatePreviewFamiliesPreserved,
      generated_candidates_preview_only:
        generatedCandidateSummary.all_generated_candidates_preview_only,
      generated_candidates_have_source_refs:
        generatedCandidateValidation.all_have_source_refs,
      generated_candidates_source_refs_resolve_to_bundle_refs:
        generatedCandidateValidation.all_source_refs_resolve_to_bundle_refs,
      generated_candidates_have_operator_context:
        generatedCandidateValidation.all_have_operator_context,
      generated_candidates_review_required_later:
        generatedCandidateValidation.all_review_required_later,
      generated_candidates_durable_write_now_false:
        generatedCandidateValidation.all_durable_write_now_false,
      generated_candidates_not_proof_or_evidence:
        generatedCandidateValidation.all_not_proof_or_evidence,
      generated_candidates_not_source_of_truth:
        generatedCandidateValidation.all_not_source_of_truth,
      generated_candidates_not_perspective_state:
        generatedCandidateValidation.all_not_perspective_state,
      generated_candidates_not_work_status:
        generatedCandidateValidation.all_not_work_status,
      generated_candidates_not_product_write:
        generatedCandidateValidation.all_not_product_write,
      source_refs_reference_only: sourceRefsReferenceOnly,
      source_fetch_not_implemented: sourceFetchNotImplemented,
      provider_extraction_not_implemented: providerExtractionNotImplemented,
      retrieval_rag_not_implemented: retrievalRagNotImplemented,
      candidate_generation_not_runtime: candidateGenerationNotRuntime,
      candidate_record_write_not_implemented:
        candidateRecordWriteNotImplemented,
      candidate_mutation_not_implemented: candidateMutationNotImplemented,
      privacy_policy_preserved: privacyPolicyIsPreserved,
      non_authority_policy_preserved: nonAuthorityPolicyIsPreserved,
      authority_boundary_preserved: authorityBoundaryPreserved,
      deterministic_rebuild_matches_fixture: true,
    },
    recommendation_status:
      "ready_for_operator_source_candidate_generation_browser_validation_v0_1",
    next_recommended_slice:
      "operator_source_candidate_generation_browser_validation_v0_1",
    implementation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  implementation.implementation_fingerprint =
    computeOperatorSourceCandidateGenerationImplementationFingerprint(
      implementation,
    );
  return implementation;
}

export function computeOperatorSourceCandidateGenerationImplementationFingerprint(
  implementation: OperatorSourceCandidateGenerationImplementation,
): string {
  const normalized = clone(implementation) as unknown as JsonRecord;
  delete normalized.implementation_fingerprint;
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

export function getOperatorSourceCandidateGenerationImplementationAuthorityBoundary():
  OperatorSourceCandidateGenerationImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    contract_followed_now: true,
    fixture_backed_only: true,
    deterministic_builder_added_now: true,
    runtime_candidate_generation_implemented_now: false,
    runtime_source_fetch_implemented_now: false,
    crawler_implemented_now: false,
    provider_extraction_implemented_now: false,
    retrieval_rag_implemented_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
    candidate_record_write_now: false,
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

export function getOperatorSourceCandidateGenerationImplementationValidationPolicy():
  OperatorSourceCandidateGenerationImplementationValidationPolicy {
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
    runtime_candidate_generation_now: false,
  };
}

function buildGeneratedCandidateGenerationPreviewBundle(input: {
  contract: OperatorSourceCandidateGenerationContract;
  generatedAt: string;
  sourceRefs: OperatorSourceCandidateSourceRef[];
  generatedCandidatePreviews: OperatorSourceGeneratedCandidatePreview[];
  candidateGenerationPreviewBundleId: string;
}): OperatorSourceGeneratedCandidateGenerationPreviewBundle {
  const sample = input.contract.sample_candidate_generation_preview_bundle;
  return {
    ...clone(sample),
    candidate_generation_preview_bundle_id:
      input.candidateGenerationPreviewBundleId,
    generated_at: input.generatedAt,
    source_refs: sortSourceRefs(input.sourceRefs),
    candidate_preview_families: clone(input.contract.candidate_preview_families),
    generated_candidate_previews: sortGeneratedCandidatePreviews(
      input.generatedCandidatePreviews,
    ),
    generated_candidate_policy_ref: sample.generated_candidate_policy_ref,
    provenance_policy_ref: sample.provenance_policy_ref,
    review_policy_ref: sample.review_policy_ref,
    privacy_policy_ref: sample.privacy_policy_ref,
    non_authority_policy_ref: sample.non_authority_policy_ref,
    authority_boundary: clone(input.contract.authority_boundary),
    validation: clone(input.contract.validation_policy),
  };
}

function buildCandidatePreviewFamilySummary(
  contract: OperatorSourceCandidateGenerationContract,
): OperatorSourceCandidatePreviewFamilySummary {
  return {
    family_count: contract.candidate_preview_families.length,
    family_kinds: contract.candidate_preview_families.map(
      (family) => family.family_kind,
    ),
    all_families_candidate_only: contract.candidate_preview_families.every(
      (family) => family.candidate_only === true,
    ),
    all_families_preview_only: contract.candidate_preview_families.every(
      (family) => family.preview_only === true,
    ),
    all_families_require_source_refs:
      contract.candidate_preview_families.every(
        (family) => family.source_refs_required === true,
      ),
    all_families_require_operator_context:
      contract.candidate_preview_families.every(
        (family) => family.operator_context_required === true,
      ),
    all_families_review_required_later:
      contract.candidate_preview_families.every(
        (family) => family.review_required_later === true,
      ),
    all_families_durable_write_now_false:
      contract.candidate_preview_families.every(
        (family) => family.durable_write_now === false,
      ),
  };
}

function buildGeneratedCandidateSummary(
  candidatePreviews: OperatorSourceGeneratedCandidatePreview[],
  validation: GeneratedCandidateValidation,
): OperatorSourceGeneratedCandidateSummary {
  return {
    generated_candidate_count: candidatePreviews.length,
    generated_candidate_preview_ids: candidatePreviews.map(
      (candidatePreview) => candidatePreview.candidate_preview_id,
    ),
    generated_candidate_family_kinds: uniqueSorted(
      candidatePreviews.map((candidatePreview) => candidatePreview.family_kind),
    ) as OperatorSourceCandidatePreviewFamilyKind[],
    all_generated_candidates_preview_only: candidatePreviews.every(
      (candidatePreview) => candidatePreview.preview_only === true,
    ),
    all_generated_candidates_candidate_only: candidatePreviews.every(
      (candidatePreview) => candidatePreview.candidate_only === true,
    ),
    all_generated_candidates_have_source_refs: validation.all_have_source_refs,
    all_generated_candidates_have_operator_context:
      validation.all_have_operator_context,
    all_generated_candidate_source_refs_resolve_to_bundle_refs:
      validation.all_source_refs_resolve_to_bundle_refs,
    all_generated_candidates_review_required_later:
      validation.all_review_required_later,
    all_generated_candidates_durable_write_now_false:
      validation.all_durable_write_now_false,
    all_generated_candidates_not_proof_or_evidence:
      validation.all_not_proof_or_evidence,
    all_generated_candidates_not_source_of_truth:
      validation.all_not_source_of_truth,
    all_generated_candidates_not_perspective_state:
      validation.all_not_perspective_state,
    all_generated_candidates_not_work_status: validation.all_not_work_status,
    all_generated_candidates_not_product_write:
      validation.all_not_product_write,
  };
}

function buildSourceReferenceSummary(
  contract: OperatorSourceCandidateGenerationContract,
  bundle: OperatorSourceGeneratedCandidateGenerationPreviewBundle,
): OperatorSourceReferenceSummary {
  return {
    source_ref_count: bundle.source_refs.length,
    source_ref_ids: bundle.source_refs.map((sourceRef) => sourceRef.source_ref_id),
    all_source_refs_reference_only: bundle.source_refs.every(
      (sourceRef) => sourceRef.reference_only === true,
    ),
    all_source_refs_public_safe: bundle.source_refs.every(
      (sourceRef) => sourceRef.public_safe === true,
    ),
    all_source_refs_have_operator_context: bundle.source_refs.every(
      (sourceRef) =>
        typeof sourceRef.operator_context_ref === "string" &&
        sourceRef.operator_context_ref.length > 0,
    ),
    source_intake_bundle_ref_present:
      typeof bundle.source_intake_bundle_ref === "string" &&
      bundle.source_intake_bundle_ref.length > 0,
    no_source_fetch_now: true,
    no_provider_extraction_now: true,
    no_retrieval_rag_now: true,
    invalid_source_refs_rejected_upstream:
      contract.source_input_requirements.invalid_source_refs_must_be_rejected,
  };
}

function validateGeneratedCandidatePreviewsAgainstContract(
  contract: OperatorSourceCandidateGenerationContract,
  bundle: OperatorSourceGeneratedCandidateGenerationPreviewBundle,
): GeneratedCandidateValidation {
  const allowedFamilyKinds = new Set<string>(
    contract.candidate_preview_families.map((family) => family.family_kind),
  );
  const bundleSourceRefIds = new Set<string>(
    bundle.source_refs.map((sourceRef) => sourceRef.source_ref_id),
  );
  const candidatePreviews = bundle.generated_candidate_previews;
  const allKnownFamilyKinds = candidatePreviews.every((candidatePreview) =>
    allowedFamilyKinds.has(candidatePreview.family_kind),
  );
  const allHaveSourceRefs = candidatePreviews.every(
    (candidatePreview) =>
      Array.isArray(candidatePreview.source_refs) &&
      candidatePreview.source_refs.length > 0,
  );
  const allSourceRefsResolveToBundleRefs = candidatePreviews.every(
    (candidatePreview) =>
      Array.isArray(candidatePreview.source_refs) &&
      candidatePreview.source_refs.every((sourceRef) =>
        bundleSourceRefIds.has(sourceRef),
      ),
  );
  const allHaveOperatorContext = candidatePreviews.every(
    (candidatePreview) =>
      typeof candidatePreview.operator_context_ref === "string" &&
      candidatePreview.operator_context_ref.length > 0,
  );
  const allSourceIntakeBundleRefsMatch = candidatePreviews.every(
    (candidatePreview) =>
      candidatePreview.source_intake_bundle_ref ===
      bundle.source_intake_bundle_ref,
  );
  const allCandidateOnly = candidatePreviews.every(
    (candidatePreview) => candidatePreview.candidate_only === true,
  );
  const allPreviewOnly = candidatePreviews.every(
    (candidatePreview) => candidatePreview.preview_only === true,
  );
  const allReviewRequiredLater = candidatePreviews.every(
    (candidatePreview) => candidatePreview.review_required_later === true,
  );
  const allDurableWriteNowFalse = candidatePreviews.every(
    (candidatePreview) => candidatePreview.durable_write_now === false,
  );
  const allNotProofOrEvidence = candidatePreviews.every(
    (candidatePreview) => candidatePreview.not_proof_or_evidence === true,
  );
  const allNotSourceOfTruth = candidatePreviews.every(
    (candidatePreview) => candidatePreview.not_source_of_truth === true,
  );
  const allNotPerspectiveState = candidatePreviews.every(
    (candidatePreview) => candidatePreview.not_perspective_state === true,
  );
  const allNotWorkStatus = candidatePreviews.every(
    (candidatePreview) => candidatePreview.not_work_status === true,
  );
  const allNotProductWrite = candidatePreviews.every(
    (candidatePreview) => candidatePreview.not_product_write === true,
  );
  const failureCodes = [
    allKnownFamilyKinds ? null : "generated_candidate_unknown_family_kind",
    allHaveSourceRefs ? null : "generated_candidate_missing_source_refs",
    allSourceRefsResolveToBundleRefs
      ? null
      : "generated_candidate_unknown_source_ref",
    allHaveOperatorContext ? null : "generated_candidate_missing_operator_context",
    allCandidateOnly ? null : "generated_candidate_not_candidate_only",
    allPreviewOnly ? null : "generated_candidate_not_preview_only",
    allReviewRequiredLater
      ? null
      : "generated_candidate_review_not_required_later",
    allDurableWriteNowFalse
      ? null
      : "generated_candidate_durable_write_enabled",
    allNotProofOrEvidence
      ? null
      : "generated_candidate_proof_or_evidence_enabled",
    allNotSourceOfTruth ? null : "generated_candidate_source_of_truth_enabled",
    allNotPerspectiveState
      ? null
      : "generated_candidate_perspective_state_enabled",
    allNotWorkStatus ? null : "generated_candidate_work_status_enabled",
    allNotProductWrite ? null : "generated_candidate_product_write_enabled",
    allSourceIntakeBundleRefsMatch
      ? null
      : "generated_candidate_source_intake_bundle_mismatch",
  ].filter((code): code is string => Boolean(code));

  return {
    all_generated_candidates_follow_contract: failureCodes.length === 0,
    all_have_source_refs: allHaveSourceRefs,
    all_source_refs_resolve_to_bundle_refs: allSourceRefsResolveToBundleRefs,
    all_have_operator_context: allHaveOperatorContext,
    all_review_required_later: allReviewRequiredLater,
    all_durable_write_now_false: allDurableWriteNowFalse,
    all_not_proof_or_evidence: allNotProofOrEvidence,
    all_not_source_of_truth: allNotSourceOfTruth,
    all_not_perspective_state: allNotPerspectiveState,
    all_not_work_status: allNotWorkStatus,
    all_not_product_write: allNotProductWrite,
    failure_codes: failureCodes,
  };
}

function candidateGenerationPreviewBundleFollowsContract(
  bundle: OperatorSourceGeneratedCandidateGenerationPreviewBundle,
): boolean {
  return (
    bundle.preview_version ===
      "operator_source_candidate_generation_preview.v0.1" &&
    typeof bundle.candidate_generation_preview_bundle_id === "string" &&
    bundle.candidate_generation_preview_bundle_id.length > 0 &&
    typeof bundle.generated_at === "string" &&
    bundle.generated_at.length > 0 &&
    typeof bundle.source_intake_bundle_ref === "string" &&
    bundle.source_intake_bundle_ref.length > 0 &&
    Array.isArray(bundle.source_refs) &&
    bundle.source_refs.length > 0 &&
    typeof bundle.operator_context_ref === "string" &&
    bundle.operator_context_ref.length > 0 &&
    Array.isArray(bundle.candidate_preview_families) &&
    bundle.candidate_preview_families.length > 0 &&
    Array.isArray(bundle.generated_candidate_previews) &&
    bundle.generated_candidate_previews.length > 0 &&
    bundle.generated_candidate_policy_ref.length > 0 &&
    bundle.provenance_policy_ref.length > 0 &&
    bundle.review_policy_ref.length > 0 &&
    bundle.privacy_policy_ref.length > 0 &&
    bundle.non_authority_policy_ref.length > 0
  );
}

function privacyPolicyPreserved(
  contract: OperatorSourceCandidateGenerationContract,
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
  contract: OperatorSourceCandidateGenerationContract,
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
    contract.non_authority_policy.generated_candidate_not_authority === true &&
    contract.non_authority_policy.provider_summary_not_evidence_record === true &&
    contract.non_authority_policy.retrieval_result_not_authority === true
  );
}

function implementationAuthorityBoundaryPreserved(
  boundary: OperatorSourceCandidateGenerationImplementationAuthorityBoundary,
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
  sourceRefs: OperatorSourceCandidateSourceRef[],
): OperatorSourceCandidateSourceRef[] {
  return sourceRefs
    .map(clone)
    .sort((a, b) =>
      String(a.source_ref_id ?? "").localeCompare(String(b.source_ref_id ?? "")),
    );
}

function sortGeneratedCandidatePreviews(
  candidatePreviews: OperatorSourceGeneratedCandidatePreview[],
): OperatorSourceGeneratedCandidatePreview[] {
  return candidatePreviews
    .map(clone)
    .sort((a, b) =>
      String(a.candidate_preview_id ?? "").localeCompare(
        String(b.candidate_preview_id ?? ""),
      ),
    );
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
