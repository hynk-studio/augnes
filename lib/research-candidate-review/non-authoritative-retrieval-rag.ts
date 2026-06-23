import type {
  NonAuthoritativeRagContextPreview,
  NonAuthoritativeRetrievalNonAuthorityPolicy,
  NonAuthoritativeRetrievalPreviewAuthorityBoundary,
  NonAuthoritativeRetrievalRagContract,
  NonAuthoritativeRetrievalResultFamilyKind,
  NonAuthoritativeRetrievalResultPreview,
  NonAuthoritativeRetrievalSourceRef,
  NonAuthoritativeRetrievalValidationPolicy,
} from "@/types/non-authoritative-retrieval-rag-contract";

type JsonRecord = Record<string, unknown>;

export interface NonAuthoritativeRetrievalRagImplementationInput {
  non_authoritative_retrieval_rag_contract:
    NonAuthoritativeRetrievalRagContract;
  source_contract_ref?: string;
  source_contract_fixture_path?: string;
  type_contract_path?: string;
  operator_context_ref?: string;
  source_refs?: NonAuthoritativeRetrievalSourceRef[];
  retrieval_results?: NonAuthoritativeRetrievalResultPreview[];
  rag_context_preview?: NonAuthoritativeRagContextPreview;
  authority_boundary_overrides?: Partial<NonAuthoritativeRetrievalRagImplementationAuthorityBoundary>;
}

export interface NonAuthoritativeRetrievalRagPreviewBundleInput {
  contract: NonAuthoritativeRetrievalRagContract;
  source_contract_ref?: string;
  operator_context_ref?: string;
  source_refs?: NonAuthoritativeRetrievalSourceRef[];
  retrieval_results?: NonAuthoritativeRetrievalResultPreview[];
  rag_context_preview?: NonAuthoritativeRagContextPreview;
}

export interface NonAuthoritativeRetrievalRagPreviewBundle {
  preview_version: "non_authoritative_retrieval_rag_preview.v0.1";
  source_contract_ref: string;
  operator_context_ref: string;
  source_refs: NonAuthoritativeRetrievalSourceRef[];
  retrieval_results: NonAuthoritativeRetrievalResultPreview[];
  rag_context_preview: NonAuthoritativeRagContextPreview;
  retrieval_input_summary: NonAuthoritativeRetrievalInputSummary;
  retrieval_result_family_summary: NonAuthoritativeRetrievalResultFamilySummary;
  source_reference_summary: NonAuthoritativeRetrievalSourceReferenceSummary;
  validation: NonAuthoritativeRetrievalRagValidation;
  authority_boundary: NonAuthoritativeRetrievalPreviewAuthorityBoundary;
  validation_policy: NonAuthoritativeRetrievalValidationPolicy;
  non_authority_policy: NonAuthoritativeRetrievalNonAuthorityPolicy;
}

export interface NonAuthoritativeRetrievalInputSummary {
  retrieval_input_count: number;
  retrieval_inputs: string[];
  source_ref_metadata_allowed: boolean;
  candidate_summaries_allowed: boolean;
  review_notes_allowed: boolean;
  perspective_delta_summaries_allowed: boolean;
  formation_receipt_summaries_allowed: boolean;
  raw_private_source_body_allowed: false;
  raw_provider_ids_allowed: false;
  raw_thread_run_session_ids_allowed: false;
  private_or_unstable_urls_allowed: false;
  secrets_allowed: false;
}

export interface NonAuthoritativeRetrievalResultFamilySummary {
  family_count: number;
  family_kinds: NonAuthoritativeRetrievalResultFamilyKind[];
  all_families_preserved: boolean;
  all_result_families_recall_only_or_context_preview: boolean;
  all_result_families_non_authoritative: boolean;
  all_result_families_not_evidence: boolean;
  all_result_families_not_proof: boolean;
  all_result_families_not_source_of_truth: boolean;
  all_result_families_not_promotion_basis_or_context_only: boolean;
}

export interface NonAuthoritativeRetrievalSourceReferenceSummary {
  source_ref_count: number;
  source_ref_ids: string[];
  all_source_refs_have_ids: boolean;
  all_source_refs_have_public_safe_refs: boolean;
  all_source_refs_have_refs: boolean;
  all_source_refs_have_operator_context: boolean;
  all_source_refs_public_safe: boolean;
  all_public_safe_refs_stable: boolean;
  public_safe_source_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
}

export interface NonAuthoritativeRetrievalRagValidation {
  passed: boolean;
  failure_codes: string[];
  preview_bundle_follows_contract: boolean;
  preview_bundle_authority_boundary_matches_contract: boolean;
  preview_bundle_validation_policy_matches_contract: boolean;
  preview_bundle_non_authority_policy_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  retrieval_result_families_preserved: boolean;
  retrieval_inputs_preserved: boolean;
  all_results_source_ref_backed_or_explicit_gap: boolean;
  all_results_preserve_candidate_durable_distinction: boolean;
  all_results_recall_only: boolean;
  all_results_non_authoritative: boolean;
  no_result_is_evidence: boolean;
  no_result_is_proof: boolean;
  no_result_is_source_of_truth: boolean;
  no_result_is_promotion_basis: boolean;
  rag_context_preview_not_evidence_or_proof: boolean;
  rag_context_preview_not_source_of_truth: boolean;
  rag_context_preview_not_perspective_state: boolean;
  rag_context_preview_not_work_status: boolean;
  rag_context_preview_not_product_write: boolean;
  rag_context_preview_human_review_required_later: boolean;
  retrieval_scores_not_truth_or_promotion_scores: boolean;
  retrieval_scores_not_evidence_strength: boolean;
  embedding_similarity_not_truth_or_salience_or_promotion_readiness: boolean;
  index_rebuildable_derived_non_authoritative: boolean;
  stale_index_cannot_override_current_state: boolean;
  vector_db_not_source_of_truth: boolean;
  hidden_permanent_memory_not_allowed: boolean;
  public_safe_source_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
}

export interface NonAuthoritativeRetrievalRagImplementationAuthorityBoundary {
  implementation_added_now: true;
  deterministic_builder_added_now: true;
  contract_changed_now: false;
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

export interface NonAuthoritativeRetrievalRagImplementation {
  implementation_kind: "non_authoritative_retrieval_rag_implementation";
  implementation_version: "non_authoritative_retrieval_rag_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  implemented_contract: {
    contract_kind: "non_authoritative_retrieval_rag_contract";
    contract_version: "non_authoritative_retrieval_rag_contract.v0.1";
    contract_fixture_path: string;
    type_contract_path: string;
    contract_authority_boundary_preserved: true;
    contract_validation_policy_preserved: true;
    contract_non_authority_policy_preserved: true;
  };
  deterministic_builder: {
    builder_path: "lib/research-candidate-review/non-authoritative-retrieval-rag.ts";
    deterministic_fixture_backed_only: true;
    runtime_retrieval_rag_now: false;
    runtime_index_build_now: false;
    runtime_index_write_now: false;
    embedding_generation_now: false;
    vector_db_now: false;
    fts_now: false;
    provider_openai_call_now: false;
    provider_extraction_now: false;
    source_fetch_now: false;
    crawler_now: false;
    browser_request_now: false;
    runtime_db_query_now: false;
    runtime_db_write_now: false;
    production_db_used_now: false;
    durable_memory_write_now: false;
  };
  built_preview_bundle: NonAuthoritativeRetrievalRagPreviewBundle;
  validated_implementation: NonAuthoritativeRetrievalRagImplementationValidation;
  authority_boundary: NonAuthoritativeRetrievalRagImplementationAuthorityBoundary;
  recommendation_status:
    "ready_for_non_authoritative_retrieval_rag_browser_validation_v0_1";
  next_recommended_slice:
    "non_authoritative_retrieval_rag_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

export interface NonAuthoritativeRetrievalRagImplementationValidation
  extends NonAuthoritativeRetrievalRagValidation {
  invalid_retrieval_result_override_rejected: boolean;
  invalid_rag_context_preview_override_rejected: boolean;
  invalid_source_refs_override_rejected: boolean;
  invalid_authority_boundary_override_rejected: boolean;
}

const defaultContractFixturePath =
  "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json";
const defaultTypeContractPath = "types/non-authoritative-retrieval-rag-contract.ts";
const defaultBuilderPath =
  "lib/research-candidate-review/non-authoritative-retrieval-rag.ts";

export function buildNonAuthoritativeRetrievalRagImplementationFixture(
  input: NonAuthoritativeRetrievalRagImplementationInput,
): NonAuthoritativeRetrievalRagImplementation {
  const contract = input.non_authoritative_retrieval_rag_contract;
  const sourceContractRef =
    input.source_contract_ref ??
    `${contract.contract_version}:${defaultContractFixturePath}`;
  const authorityBoundary = {
    ...getNonAuthoritativeRetrievalRagImplementationAuthorityBoundary(),
    ...(input.authority_boundary_overrides ?? {}),
  };
  const builtPreviewBundle = buildNonAuthoritativeRetrievalRagPreviewBundle({
    contract,
    source_contract_ref: sourceContractRef,
    operator_context_ref: input.operator_context_ref,
    source_refs: input.source_refs,
    retrieval_results: input.retrieval_results,
    rag_context_preview: input.rag_context_preview,
  });
  const boundaryFailureCodes =
    validateImplementationAuthorityBoundary(authorityBoundary);
  const topLevelBoundaryIsSeparate =
    !Object.hasOwn(
      builtPreviewBundle.authority_boundary,
      "implementation_added_now",
    ) &&
    !Object.hasOwn(
      builtPreviewBundle.authority_boundary,
      "deterministic_builder_added_now",
    ) &&
    authorityBoundary.implementation_added_now === true &&
    authorityBoundary.deterministic_builder_added_now === true;
  const previewValidation = builtPreviewBundle.validation;
  const failureCodes = uniqueSorted([
    ...previewValidation.failure_codes,
    ...boundaryFailureCodes,
    topLevelBoundaryIsSeparate ? null : "implementation_boundary_not_separate",
  ]);
  const validation: NonAuthoritativeRetrievalRagImplementationValidation = {
    ...previewValidation,
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    top_level_implementation_boundary_is_separate: topLevelBoundaryIsSeparate,
    invalid_retrieval_result_override_rejected: true,
    invalid_rag_context_preview_override_rejected: true,
    invalid_source_refs_override_rejected: true,
    invalid_authority_boundary_override_rejected: true,
  };
  const implementation: NonAuthoritativeRetrievalRagImplementation = {
    implementation_kind: "non_authoritative_retrieval_rag_implementation",
    implementation_version:
      "non_authoritative_retrieval_rag_implementation.v0.1",
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
      contract_non_authority_policy_preserved: true,
    },
    deterministic_builder: {
      builder_path: defaultBuilderPath,
      deterministic_fixture_backed_only: true,
      runtime_retrieval_rag_now: false,
      runtime_index_build_now: false,
      runtime_index_write_now: false,
      embedding_generation_now: false,
      vector_db_now: false,
      fts_now: false,
      provider_openai_call_now: false,
      provider_extraction_now: false,
      source_fetch_now: false,
      crawler_now: false,
      browser_request_now: false,
      runtime_db_query_now: false,
      runtime_db_write_now: false,
      production_db_used_now: false,
      durable_memory_write_now: false,
    },
    built_preview_bundle: builtPreviewBundle,
    validated_implementation: validation,
    authority_boundary: authorityBoundary,
    recommendation_status:
      "ready_for_non_authoritative_retrieval_rag_browser_validation_v0_1",
    next_recommended_slice:
      "non_authoritative_retrieval_rag_browser_validation_v0_1",
    implementation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  implementation.implementation_fingerprint =
    createNonAuthoritativeRetrievalRagFingerprint(implementation);
  return implementation;
}

export function buildNonAuthoritativeRetrievalRagPreviewBundle(
  input: NonAuthoritativeRetrievalRagPreviewBundleInput,
): NonAuthoritativeRetrievalRagPreviewBundle {
  const sample = input.contract.sample_retrieval_rag_contract_preview;
  const sourceContractRef =
    input.source_contract_ref ??
    `${input.contract.contract_version}:${defaultContractFixturePath}`;
  const bundleWithoutValidation = {
    preview_version: sample.preview_version,
    source_contract_ref: sourceContractRef,
    operator_context_ref:
      input.operator_context_ref ?? sample.operator_context_ref,
    source_refs: clone(input.source_refs ?? sample.source_refs),
    retrieval_results: clone(input.retrieval_results ?? sample.retrieval_results),
    rag_context_preview: clone(
      input.rag_context_preview ?? sample.rag_context_preview,
    ),
    retrieval_input_summary: buildRetrievalInputSummary(input.contract),
    retrieval_result_family_summary:
      buildRetrievalResultFamilySummary(input.contract),
    source_reference_summary: buildSourceReferenceSummary(
      input.contract,
      input.source_refs ?? sample.source_refs,
    ),
    authority_boundary: clone(sample.authority_boundary),
    validation_policy: clone(input.contract.validation_policy),
    non_authority_policy: clone(input.contract.non_authority_policy),
  };
  const bundle = {
    ...bundleWithoutValidation,
    validation: validateNonAuthoritativeRetrievalRagPreviewBundle(
      bundleWithoutValidation,
      input.contract,
    ),
  };
  return bundle;
}

export function validateNonAuthoritativeRetrievalRagPreviewBundle(
  previewBundle: Omit<
    NonAuthoritativeRetrievalRagPreviewBundle,
    "validation"
  >,
  contract: NonAuthoritativeRetrievalRagContract,
): NonAuthoritativeRetrievalRagValidation {
  const sourceRefValidation = validateSourceRefs(
    previewBundle.source_refs,
    contract,
  );
  const retrievalResultValidation = validateRetrievalResults(
    previewBundle.retrieval_results,
    previewBundle.source_refs,
    contract,
  );
  const ragContextValidation = validateRagContextPreview(
    previewBundle.rag_context_preview,
    previewBundle.source_refs,
  );
  const expectedPreviewBoundary =
    contract.sample_retrieval_rag_contract_preview.authority_boundary;
  const previewBundleAuthorityBoundaryMatchesContract = deepEqual(
    previewBundle.authority_boundary,
    expectedPreviewBoundary,
  );
  const previewBundleValidationPolicyMatchesContract = deepEqual(
    previewBundle.validation_policy,
    contract.validation_policy,
  );
  const previewBundleNonAuthorityPolicyMatchesContract = deepEqual(
    previewBundle.non_authority_policy,
    contract.non_authority_policy,
  );
  const retrievalResultFamiliesPreserved =
    retrievalResultValidation.retrieval_result_families_preserved;
  const retrievalInputsPreserved = deepEqual(
    previewBundle.retrieval_input_summary.retrieval_inputs,
    contract.retrieval_inputs,
  );
  const embeddingSimilarityNotAuthority =
    contract.non_authority_policy.embedding_similarity_is_not_truth_score ===
      true &&
    contract.non_authority_policy
      .embedding_similarity_is_not_salience_authority === true &&
    contract.non_authority_policy
      .embedding_similarity_is_not_promotion_readiness === true;
  const indexRebuildableDerivedNonAuthoritative =
    contract.non_authority_policy.index_is_rebuildable === true &&
    contract.non_authority_policy.index_is_derived === true &&
    contract.non_authority_policy.index_is_non_authoritative === true;
  const previewBundleFollowsContract =
    previewBundle.preview_version ===
      "non_authoritative_retrieval_rag_preview.v0.1" &&
    hasText(previewBundle.source_contract_ref) &&
    hasText(previewBundle.operator_context_ref) &&
    sourceRefValidation.public_safe_source_refs_only &&
    retrievalResultValidation.all_results_follow_contract &&
    ragContextValidation.rag_context_preview_follows_contract &&
    previewBundleAuthorityBoundaryMatchesContract &&
    previewBundleValidationPolicyMatchesContract &&
    previewBundleNonAuthorityPolicyMatchesContract;
  const validationWithoutFailureCodes = {
    preview_bundle_follows_contract: previewBundleFollowsContract,
    preview_bundle_authority_boundary_matches_contract:
      previewBundleAuthorityBoundaryMatchesContract,
    preview_bundle_validation_policy_matches_contract:
      previewBundleValidationPolicyMatchesContract,
    preview_bundle_non_authority_policy_matches_contract:
      previewBundleNonAuthorityPolicyMatchesContract,
    top_level_implementation_boundary_is_separate: true,
    retrieval_result_families_preserved: retrievalResultFamiliesPreserved,
    retrieval_inputs_preserved: retrievalInputsPreserved,
    all_results_source_ref_backed_or_explicit_gap:
      retrievalResultValidation.all_results_source_ref_backed_or_explicit_gap,
    all_results_preserve_candidate_durable_distinction:
      retrievalResultValidation.all_results_preserve_candidate_durable_distinction,
    all_results_recall_only:
      retrievalResultValidation.all_results_recall_only,
    all_results_non_authoritative:
      retrievalResultValidation.all_results_non_authoritative,
    no_result_is_evidence: retrievalResultValidation.no_result_is_evidence,
    no_result_is_proof: retrievalResultValidation.no_result_is_proof,
    no_result_is_source_of_truth:
      retrievalResultValidation.no_result_is_source_of_truth,
    no_result_is_promotion_basis:
      retrievalResultValidation.no_result_is_promotion_basis,
    rag_context_preview_not_evidence_or_proof:
      ragContextValidation.rag_context_preview_not_evidence_or_proof,
    rag_context_preview_not_source_of_truth:
      ragContextValidation.rag_context_preview_not_source_of_truth,
    rag_context_preview_not_perspective_state:
      ragContextValidation.rag_context_preview_not_perspective_state,
    rag_context_preview_not_work_status:
      ragContextValidation.rag_context_preview_not_work_status,
    rag_context_preview_not_product_write:
      ragContextValidation.rag_context_preview_not_product_write,
    rag_context_preview_human_review_required_later:
      ragContextValidation.rag_context_preview_human_review_required_later,
    retrieval_scores_not_truth_or_promotion_scores:
      retrievalResultValidation.retrieval_scores_not_truth_or_promotion_scores,
    retrieval_scores_not_evidence_strength:
      retrievalResultValidation.retrieval_scores_not_evidence_strength,
    embedding_similarity_not_truth_or_salience_or_promotion_readiness:
      embeddingSimilarityNotAuthority,
    index_rebuildable_derived_non_authoritative:
      indexRebuildableDerivedNonAuthoritative,
    stale_index_cannot_override_current_state:
      contract.non_authority_policy.stale_index_cannot_override_current_state,
    vector_db_not_source_of_truth:
      contract.non_authority_policy.vector_db_is_not_source_of_truth,
    hidden_permanent_memory_not_allowed:
      contract.non_authority_policy.hidden_permanent_memory_not_allowed,
    public_safe_source_refs_only:
      sourceRefValidation.public_safe_source_refs_only,
    no_raw_private_source_body:
      contract.privacy_policy.no_raw_source_body === true,
    no_raw_provider_thread_run_session_ids:
      contract.privacy_policy.no_raw_provider_thread_run_session_ids === true,
    no_private_urls:
      contract.privacy_policy.no_private_urls === true &&
      sourceRefValidation.all_public_safe_refs_stable,
    no_secrets: contract.privacy_policy.no_secrets_in_fixture === true,
  };
  const failureCodes = uniqueSorted([
    previewBundleFollowsContract ? null : "preview_bundle_contract_mismatch",
    previewBundleAuthorityBoundaryMatchesContract
      ? null
      : "preview_bundle_authority_boundary_mismatch",
    previewBundleValidationPolicyMatchesContract
      ? null
      : "preview_bundle_validation_policy_mismatch",
    previewBundleNonAuthorityPolicyMatchesContract
      ? null
      : "preview_bundle_non_authority_policy_mismatch",
    retrievalResultFamiliesPreserved
      ? null
      : "retrieval_result_families_not_preserved",
    retrievalInputsPreserved ? null : "retrieval_inputs_not_preserved",
    embeddingSimilarityNotAuthority
      ? null
      : "embedding_similarity_authority_enabled",
    indexRebuildableDerivedNonAuthoritative
      ? null
      : "index_rebuildable_derived_non_authoritative_missing",
    contract.non_authority_policy.stale_index_cannot_override_current_state
      ? null
      : "stale_index_override_enabled",
    contract.non_authority_policy.vector_db_is_not_source_of_truth
      ? null
      : "vector_db_source_of_truth_enabled",
    contract.non_authority_policy.hidden_permanent_memory_not_allowed
      ? null
      : "hidden_permanent_memory_enabled",
    contract.privacy_policy.no_raw_source_body
      ? null
      : "raw_private_source_body_enabled",
    contract.privacy_policy.no_raw_provider_thread_run_session_ids
      ? null
      : "raw_provider_thread_run_session_ids_enabled",
    contract.privacy_policy.no_private_urls ? null : "private_urls_enabled",
    contract.privacy_policy.no_secrets_in_fixture ? null : "secrets_enabled",
    ...sourceRefValidation.failure_codes,
    ...retrievalResultValidation.failure_codes,
    ...ragContextValidation.failure_codes,
  ]);
  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    ...validationWithoutFailureCodes,
  };
}

export function createNonAuthoritativeRetrievalRagFingerprint(
  value: unknown,
): string {
  const normalized = clone(value) as JsonRecord;
  const { implementation_fingerprint: _implementationFingerprint, ...rest } =
    normalized;
  return `fnv1a32:${fnv1a32(canonicalJson(rest))}`;
}

function getNonAuthoritativeRetrievalRagImplementationAuthorityBoundary():
  NonAuthoritativeRetrievalRagImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    deterministic_builder_added_now: true,
    contract_changed_now: false,
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

function buildRetrievalInputSummary(
  contract: NonAuthoritativeRetrievalRagContract,
): NonAuthoritativeRetrievalInputSummary {
  return {
    retrieval_input_count: contract.retrieval_inputs.length,
    retrieval_inputs: clone(contract.retrieval_inputs),
    source_ref_metadata_allowed:
      contract.input_policy.source_ref_metadata_allowed,
    candidate_summaries_allowed:
      contract.input_policy.candidate_summaries_allowed,
    review_notes_allowed: contract.input_policy.review_notes_allowed,
    perspective_delta_summaries_allowed:
      contract.input_policy.perspective_delta_summaries_allowed,
    formation_receipt_summaries_allowed:
      contract.input_policy.formation_receipt_summaries_allowed,
    raw_private_source_body_allowed:
      contract.input_policy.raw_private_source_body_allowed,
    raw_provider_ids_allowed: contract.input_policy.raw_provider_ids_allowed,
    raw_thread_run_session_ids_allowed:
      contract.input_policy.raw_thread_run_session_ids_allowed,
    private_or_unstable_urls_allowed:
      contract.input_policy.private_or_unstable_urls_allowed,
    secrets_allowed: contract.input_policy.secrets_allowed,
  };
}

function buildRetrievalResultFamilySummary(
  contract: NonAuthoritativeRetrievalRagContract,
): NonAuthoritativeRetrievalResultFamilySummary {
  const familyKinds = contract.retrieval_result_families.map(
    (family) => family.family_kind,
  );
  return {
    family_count: contract.retrieval_result_families.length,
    family_kinds: clone(familyKinds),
    all_families_preserved: familyKinds.length > 0,
    all_result_families_recall_only_or_context_preview:
      contract.retrieval_result_families.every(
        (family) =>
          family.recall_only === true ||
          family.answer_is_context_preview_only === true,
      ),
    all_result_families_non_authoritative:
      contract.retrieval_result_families.every(
        (family) =>
          family.authority === false ||
          family.generated_answer_authority === false ||
          family.candidate_only === true,
      ),
    all_result_families_not_evidence:
      contract.retrieval_result_families.every(
        (family) => family.not_evidence === true,
      ),
    all_result_families_not_proof: contract.retrieval_result_families.every(
      (family) => family.not_proof === true,
    ),
    all_result_families_not_source_of_truth:
      contract.retrieval_result_families.every(
        (family) => family.not_source_of_truth === true,
      ),
    all_result_families_not_promotion_basis_or_context_only:
      contract.retrieval_result_families.every(
        (family) =>
          family.not_promotion_basis === true ||
          family.answer_is_context_preview_only === true,
      ),
  };
}

function buildSourceReferenceSummary(
  contract: NonAuthoritativeRetrievalRagContract,
  sourceRefs: NonAuthoritativeRetrievalSourceRef[],
): NonAuthoritativeRetrievalSourceReferenceSummary {
  const validation = validateSourceRefs(sourceRefs, contract);
  return {
    source_ref_count: sourceRefs.length,
    source_ref_ids: sourceRefs.map((sourceRef) =>
      String(sourceRef.source_ref_id ?? ""),
    ),
    all_source_refs_have_ids: validation.all_have_ids,
    all_source_refs_have_public_safe_refs:
      validation.all_have_public_safe_refs,
    all_source_refs_have_refs: validation.all_have_refs,
    all_source_refs_have_operator_context:
      validation.all_have_operator_context,
    all_source_refs_public_safe: validation.all_public_safe,
    all_public_safe_refs_stable: validation.all_public_safe_refs_stable,
    public_safe_source_refs_only: validation.public_safe_source_refs_only,
    no_raw_private_source_body:
      contract.privacy_policy.no_raw_source_body === true,
    no_raw_provider_thread_run_session_ids:
      contract.privacy_policy.no_raw_provider_thread_run_session_ids === true,
    no_private_urls: contract.privacy_policy.no_private_urls === true,
    no_secrets: contract.privacy_policy.no_secrets_in_fixture === true,
  };
}

function validateSourceRefs(
  sourceRefs: NonAuthoritativeRetrievalSourceRef[],
  contract: NonAuthoritativeRetrievalRagContract,
) {
  const allHaveIds = sourceRefs.every((sourceRef) =>
    hasText(sourceRef.source_ref_id),
  );
  const allHavePublicSafeRefs = sourceRefs.every((sourceRef) =>
    hasText(sourceRef.public_safe_ref),
  );
  const allHaveRefs = sourceRefs.every(
    (sourceRef) =>
      Array.isArray(sourceRef.source_refs) &&
      sourceRef.source_refs.some((ref) => hasText(ref)),
  );
  const allHaveOperatorContext = sourceRefs.every((sourceRef) =>
    hasText(sourceRef.operator_context_ref),
  );
  const allPublicSafe = sourceRefs.every(
    (sourceRef) => sourceRef.public_safe === true,
  );
  const allPublicSafeRefsStable = sourceRefs.every(
    (sourceRef) =>
      !hasText(sourceRef.public_safe_ref) ||
      publicSafeRefIsStable(sourceRef.public_safe_ref),
  );
  const publicSafeSourceRefsOnly =
    sourceRefs.length > 0 &&
    allHaveIds &&
    allHavePublicSafeRefs &&
    allHaveRefs &&
    allHaveOperatorContext &&
    allPublicSafe &&
    allPublicSafeRefsStable &&
    contract.privacy_policy.public_safe_source_refs_only === true;
  const failureCodes = [
    allHaveIds ? null : "source_ref_missing_id",
    allHavePublicSafeRefs ? null : "source_ref_missing_public_safe_ref",
    allHaveRefs ? null : "source_ref_missing_refs",
    allHaveOperatorContext ? null : "source_ref_missing_operator_context",
    allPublicSafe ? null : "source_ref_not_public_safe",
    allPublicSafeRefsStable
      ? null
      : "source_ref_private_or_unstable_public_safe_ref",
  ];
  return {
    public_safe_source_refs_only: publicSafeSourceRefsOnly,
    all_have_ids: allHaveIds,
    all_have_public_safe_refs: allHavePublicSafeRefs,
    all_have_refs: allHaveRefs,
    all_have_operator_context: allHaveOperatorContext,
    all_public_safe: allPublicSafe,
    all_public_safe_refs_stable: allPublicSafeRefsStable,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function validateRetrievalResults(
  retrievalResults: NonAuthoritativeRetrievalResultPreview[],
  sourceRefs: NonAuthoritativeRetrievalSourceRef[],
  contract: NonAuthoritativeRetrievalRagContract,
) {
  const allowedFamilyKinds = new Set(
    contract.retrieval_result_families.map((family) => family.family_kind),
  );
  const bundleSourceRefIds = new Set(
    sourceRefs.map((sourceRef) => sourceRef.source_ref_id).filter(hasText),
  );
  const resultFamilyKinds = new Set(
    retrievalResults.map((result) => result.family_kind),
  );
  const retrievalResultFamiliesPreserved =
    contract.retrieval_result_families.every((family) =>
      resultFamilyKinds.has(family.family_kind),
    );
  const allKnownFamilyKinds = retrievalResults.every((result) =>
    allowedFamilyKinds.has(result.family_kind),
  );
  const allResultsSourceRefBackedOrExplicitGap = retrievalResults.every(
    (result) => retrievalResultHasSourceBackOrGap(result, bundleSourceRefIds),
  );
  const allResultsPreserveCandidateDurableDistinction = retrievalResults.every(
    (result) => result.candidate_durable_distinction_preserved === true,
  );
  const allResultsRecallOnly = retrievalResults.every(
    (result) => result.recall_only === true,
  );
  const allResultsNonAuthoritative = retrievalResults.every(
    (result) => result.authority === false,
  );
  const noResultIsEvidence = retrievalResults.every(
    (result) => result.not_evidence === true,
  );
  const noResultIsProof = retrievalResults.every(
    (result) => result.not_proof === true,
  );
  const noResultIsSourceOfTruth = retrievalResults.every(
    (result) => result.not_source_of_truth === true,
  );
  const noResultIsPromotionBasis = retrievalResults.every(
    (result) => result.not_promotion_basis === true,
  );
  const retrievalScoresNotTruthOrPromotionScores = retrievalResults.every(
    (result) => retrievalScoreLabelIsNonAuthoritative(result.retrieval_score_label),
  );
  const retrievalScoresNotEvidenceStrength = retrievalResults.every(
    (result) => !scoreLabelIncludesEvidenceStrength(result.retrieval_score_label),
  );
  const failureCodes = retrievalResults.flatMap((result) => [
    allowedFamilyKinds.has(result.family_kind)
      ? null
      : "retrieval_result_unknown_family_kind",
    retrievalResultHasSourceBackOrGap(result, bundleSourceRefIds)
      ? null
      : "retrieval_result_missing_source_refs_or_gap_reason",
    result.authority === false ? null : "retrieval_result_authority_enabled",
    result.recall_only === true ? null : "retrieval_result_not_recall_only",
    result.not_evidence === true ? null : "retrieval_result_evidence_enabled",
    result.not_proof === true ? null : "retrieval_result_proof_enabled",
    result.not_source_of_truth === true
      ? null
      : "retrieval_result_source_of_truth_enabled",
    result.not_promotion_basis === true
      ? null
      : "retrieval_result_promotion_basis_enabled",
    result.candidate_durable_distinction_preserved === true
      ? null
      : "retrieval_result_missing_candidate_durable_distinction",
    retrievalScoreLabelIsNonAuthoritative(result.retrieval_score_label) &&
    !scoreLabelIncludesEvidenceStrength(result.retrieval_score_label)
      ? null
      : "retrieval_score_truth_or_promotion_label_enabled",
  ]);
  const allResultsFollowContract =
    retrievalResultFamiliesPreserved &&
    allKnownFamilyKinds &&
    allResultsSourceRefBackedOrExplicitGap &&
    allResultsPreserveCandidateDurableDistinction &&
    allResultsRecallOnly &&
    allResultsNonAuthoritative &&
    noResultIsEvidence &&
    noResultIsProof &&
    noResultIsSourceOfTruth &&
    noResultIsPromotionBasis &&
    retrievalScoresNotTruthOrPromotionScores &&
    retrievalScoresNotEvidenceStrength;
  return {
    all_results_follow_contract: allResultsFollowContract,
    retrieval_result_families_preserved: retrievalResultFamiliesPreserved,
    all_results_source_ref_backed_or_explicit_gap:
      allResultsSourceRefBackedOrExplicitGap,
    all_results_preserve_candidate_durable_distinction:
      allResultsPreserveCandidateDurableDistinction,
    all_results_recall_only: allResultsRecallOnly,
    all_results_non_authoritative: allResultsNonAuthoritative,
    no_result_is_evidence: noResultIsEvidence,
    no_result_is_proof: noResultIsProof,
    no_result_is_source_of_truth: noResultIsSourceOfTruth,
    no_result_is_promotion_basis: noResultIsPromotionBasis,
    retrieval_scores_not_truth_or_promotion_scores:
      retrievalScoresNotTruthOrPromotionScores,
    retrieval_scores_not_evidence_strength: retrievalScoresNotEvidenceStrength,
    failure_codes: uniqueSorted([
      retrievalResultFamiliesPreserved
        ? null
        : "retrieval_result_families_not_preserved",
      allKnownFamilyKinds ? null : "retrieval_result_unknown_family_kind",
      ...failureCodes,
    ]),
  };
}

function validateRagContextPreview(
  ragContextPreview: NonAuthoritativeRagContextPreview,
  sourceRefs: NonAuthoritativeRetrievalSourceRef[],
) {
  const bundleSourceRefIds = new Set(
    sourceRefs.map((sourceRef) => sourceRef.source_ref_id).filter(hasText),
  );
  const sourceRefsResolve =
    Array.isArray(ragContextPreview.source_refs) &&
    ragContextPreview.source_refs.length > 0 &&
    ragContextPreview.source_refs.every((sourceRef) =>
      bundleSourceRefIds.has(sourceRef),
    );
  const notEvidenceOrProof =
    ragContextPreview.not_evidence === true &&
    ragContextPreview.not_proof === true;
  const followsContract =
    sourceRefsResolve &&
    ragContextPreview.authority === false &&
    ragContextPreview.recall_only === true &&
    notEvidenceOrProof &&
    ragContextPreview.not_source_of_truth === true &&
    ragContextPreview.not_perspective_state === true &&
    ragContextPreview.not_work_status === true &&
    ragContextPreview.not_product_write === true &&
    ragContextPreview.human_review_required_later === true;
  const failureCodes = [
    sourceRefsResolve ? null : "rag_context_preview_missing_source_refs",
    ragContextPreview.authority === false
      ? null
      : "rag_context_preview_authority_enabled",
    ragContextPreview.recall_only === true
      ? null
      : "rag_context_preview_not_recall_only",
    ragContextPreview.not_evidence === true
      ? null
      : "rag_context_preview_evidence_enabled",
    ragContextPreview.not_proof === true
      ? null
      : "rag_context_preview_proof_enabled",
    ragContextPreview.not_source_of_truth === true
      ? null
      : "rag_context_preview_source_of_truth_enabled",
    ragContextPreview.not_perspective_state === true
      ? null
      : "rag_context_preview_perspective_state_enabled",
    ragContextPreview.not_work_status === true
      ? null
      : "rag_context_preview_work_status_enabled",
    ragContextPreview.not_product_write === true
      ? null
      : "rag_context_preview_product_write_enabled",
    ragContextPreview.human_review_required_later === true
      ? null
      : "rag_context_preview_missing_human_review_required_later",
  ];
  return {
    rag_context_preview_follows_contract: followsContract,
    rag_context_preview_not_evidence_or_proof: notEvidenceOrProof,
    rag_context_preview_not_source_of_truth:
      ragContextPreview.not_source_of_truth === true,
    rag_context_preview_not_perspective_state:
      ragContextPreview.not_perspective_state === true,
    rag_context_preview_not_work_status:
      ragContextPreview.not_work_status === true,
    rag_context_preview_not_product_write:
      ragContextPreview.not_product_write === true,
    rag_context_preview_human_review_required_later:
      ragContextPreview.human_review_required_later === true,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function validateImplementationAuthorityBoundary(
  boundary: Partial<NonAuthoritativeRetrievalRagImplementationAuthorityBoundary>,
): string[] {
  const codeByField: Record<string, string> = {
    runtime_retrieval_rag_implemented_now: "runtime_retrieval_rag_enabled",
    retrieval_rag_authority: "runtime_retrieval_rag_enabled",
    runtime_index_build_implemented_now: "runtime_index_build_enabled",
    runtime_index_write_now: "runtime_index_write_enabled",
    embedding_generation_implemented_now: "embedding_generation_enabled",
    vector_db_implemented_now: "vector_db_enabled",
    fts_implemented_now: "fts_enabled",
    provider_openai_call_now: "provider_openai_call_enabled",
    provider_openai_authority: "provider_openai_call_enabled",
    provider_extraction_now: "provider_extraction_enabled",
    source_fetch_now: "source_fetch_enabled",
    source_fetch_authority: "source_fetch_enabled",
    crawler_now: "crawler_enabled",
    source_index_write_now: "source_index_write_enabled",
    durable_source_record_write_now: "durable_source_record_write_enabled",
    candidate_record_write_now: "candidate_record_write_enabled",
    runtime_db_query_now: "runtime_db_query_enabled",
    production_db_used_now: "runtime_db_query_enabled",
    runtime_db_write_now: "runtime_db_write_enabled",
    proof_or_evidence_record: "proof_or_evidence_enabled",
    perspective_promotion: "perspective_promotion_enabled",
    work_mutation: "work_mutation_enabled",
    product_write_authority: "product_write_enabled",
    product_id_allocation_authority: "product_id_allocation_enabled",
  };
  return uniqueSorted(
    Object.entries(codeByField).map(([field, code]) =>
      boundary[field as keyof typeof boundary] === true ? code : null,
    ),
  );
}

function retrievalResultHasSourceBackOrGap(
  result: NonAuthoritativeRetrievalResultPreview,
  bundleSourceRefIds: Set<string>,
): boolean {
  const sourceRefsResolve =
    Array.isArray(result.source_refs) &&
    result.source_refs.length > 0 &&
    result.source_refs.every((sourceRef) => bundleSourceRefIds.has(sourceRef));
  const recordRefPresent =
    hasText(result.review_record_ref) || hasText(result.formation_receipt_ref);
  const publicSafeGapReason =
    hasText(result.gap_reason) &&
    result.gap_reason.startsWith("public_safe_gap_reason:");
  if (result.family_kind === "retrieval_gap_or_tension_candidate") {
    return publicSafeGapReason || sourceRefsResolve;
  }
  return sourceRefsResolve || recordRefPresent;
}

function retrievalScoreLabelIsNonAuthoritative(value: unknown): boolean {
  if (!hasText(value)) {
    return false;
  }
  const normalizedValue = value.toLowerCase();
  return (
    normalizedValue.includes("not_truth_score") &&
    !normalizedValue.includes("promotion_score")
  );
}

function scoreLabelIncludesEvidenceStrength(value: unknown): boolean {
  return hasText(value) && value.toLowerCase().includes("evidence_strength");
}

function publicSafeRefIsStable(publicSafeRef: string): boolean {
  const normalizedPublicSafeRef = publicSafeRef.toLowerCase();
  return (
    !/^https?:\/\//i.test(publicSafeRef) &&
    !normalizedPublicSafeRef.includes("://") &&
    ![
      "secret",
      "token",
      "private",
      "raw",
      "thread",
      "run",
      "session",
      "localhost",
      "127.0.0.1",
    ].some((blockedFragment) =>
      normalizedPublicSafeRef.includes(blockedFragment),
    )
  );
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
