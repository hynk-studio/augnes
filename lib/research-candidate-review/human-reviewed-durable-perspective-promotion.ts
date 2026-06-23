import type {
  HumanReviewedDurablePerspectivePromotionAuthorityBoundary,
  HumanReviewedDurablePerspectivePromotionContract,
  HumanReviewedDurablePerspectivePromotionGatePolicy,
  HumanReviewedDurablePerspectivePromotionInput,
  HumanReviewedDurablePerspectivePromotionPreviewAuthorityBoundary,
  HumanReviewedDurablePerspectivePromotionPrivacyPolicy,
  HumanReviewedDurablePerspectivePromotionValidationPolicy,
  HumanReviewedPerspectiveDeltaCandidatePreview,
  HumanReviewedPromotionDecisionFamily,
  HumanReviewedPromotionDecisionKind,
  HumanReviewedPromotionDecisionPreview,
  HumanReviewedPromotionGateCheckPreview,
} from "@/types/human-reviewed-durable-perspective-promotion-contract";

type JsonRecord = Record<string, unknown>;

export interface HumanReviewedDurablePerspectivePromotionImplementationInput {
  human_reviewed_durable_perspective_promotion_contract:
    HumanReviewedDurablePerspectivePromotionContract;
  source_contract_ref?: string;
  source_contract_fixture_path?: string;
  type_contract_path?: string;
  operator_context_ref?: string;
  candidate_refs?: string[];
  source_refs?: string[];
  selected_perspective_delta_candidate?: HumanReviewedPerspectiveDeltaCandidatePreview;
  promotion_gate_check_preview?: HumanReviewedPromotionGateCheckPreview;
  promotion_decision_preview?: HumanReviewedPromotionDecisionPreview;
  authority_boundary_overrides?: Partial<HumanReviewedDurablePerspectivePromotionImplementationAuthorityBoundary>;
}

export interface HumanReviewedDurablePerspectivePromotionPreviewBundleInput {
  contract: HumanReviewedDurablePerspectivePromotionContract;
  source_contract_ref?: string;
  operator_context_ref?: string;
  candidate_refs?: string[];
  source_refs?: string[];
  selected_perspective_delta_candidate?: HumanReviewedPerspectiveDeltaCandidatePreview;
  promotion_gate_check_preview?: HumanReviewedPromotionGateCheckPreview;
  promotion_decision_preview?: HumanReviewedPromotionDecisionPreview;
}

export interface HumanReviewedDurablePerspectivePromotionPreviewBundle {
  preview_version: "human_reviewed_durable_perspective_promotion_preview.v0.1";
  source_contract_ref: string;
  operator_context_ref: string;
  candidate_refs: string[];
  source_refs: string[];
  selected_perspective_delta_candidate: HumanReviewedPerspectiveDeltaCandidatePreview;
  promotion_gate_check_preview: HumanReviewedPromotionGateCheckPreview;
  promotion_decision_preview: HumanReviewedPromotionDecisionPreview;
  promotion_decision_family_summary: HumanReviewedPromotionDecisionFamilySummary;
  source_reference_summary: HumanReviewedPromotionSourceReferenceSummary;
  candidate_reference_summary: HumanReviewedPromotionCandidateReferenceSummary;
  validation: HumanReviewedDurablePerspectivePromotionValidation;
  authority_boundary: HumanReviewedDurablePerspectivePromotionPreviewAuthorityBoundary;
  validation_policy: HumanReviewedDurablePerspectivePromotionValidationPolicy;
  promotion_gate_policy: HumanReviewedDurablePerspectivePromotionGatePolicy;
}

export interface HumanReviewedPromotionDecisionFamilySummary {
  decision_family_count: number;
  decision_kinds: HumanReviewedPromotionDecisionKind[];
  all_decision_families_preserved: boolean;
  all_require_explicit_human_review: boolean;
  all_runtime_write_now_false: boolean;
  promote_requires_source_refs_basis_tensions_gaps_and_future_records: boolean;
}

export interface HumanReviewedPromotionSourceReferenceSummary {
  source_ref_count: number;
  source_refs: string[];
  public_safe_source_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
}

export interface HumanReviewedPromotionCandidateReferenceSummary {
  candidate_ref_count: number;
  candidate_refs: string[];
  selected_delta_candidate_ref: string;
  basis_claim_candidate_refs: string[];
  basis_evidence_candidate_refs: string[];
  accepted_evidence_refs: string[];
  unresolved_tension_candidate_refs: string[];
  knowledge_gap_candidate_refs: string[];
  public_safe_candidate_refs_only: boolean;
  candidate_durable_distinction_preserved: boolean;
  accepted_evidence_distinction_required: boolean;
}

export interface HumanReviewedDurablePerspectivePromotionValidation {
  passed: boolean;
  failure_codes: string[];
  preview_bundle_follows_contract: boolean;
  preview_bundle_authority_boundary_matches_contract: boolean;
  preview_bundle_validation_policy_matches_contract: boolean;
  preview_bundle_gate_policy_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  promotion_decision_families_preserved: boolean;
  promotion_inputs_preserved: boolean;
  explicit_human_review_required: boolean;
  source_refs_required: boolean;
  reviewer_note_ref_required: boolean;
  candidate_durable_distinction_preserved: boolean;
  claim_candidate_not_fact: boolean;
  evidence_candidate_not_accepted_evidence: boolean;
  accepted_evidence_distinction_required: boolean;
  unresolved_tensions_preserved_or_resolved: boolean;
  knowledge_gaps_preserved_or_deferred: boolean;
  retrieval_result_not_promotion_authority: boolean;
  retrieval_result_not_evidence: boolean;
  rag_answer_not_proof_or_evidence: boolean;
  retrieval_score_not_promotion_score: boolean;
  embedding_similarity_not_promotion_readiness: boolean;
  salience_score_not_promotion_authority: boolean;
  provider_output_not_promotion_authority: boolean;
  codex_github_automation_not_promotion_authority: boolean;
  agent_substrate_not_promotion_authority: boolean;
  provider_initiated_promotion_forbidden: boolean;
  retrieval_initiated_promotion_forbidden: boolean;
  rag_initiated_promotion_forbidden: boolean;
  agent_substrate_initiated_promotion_forbidden: boolean;
  codex_initiated_promotion_forbidden: boolean;
  github_automation_initiated_promotion_forbidden: boolean;
  salience_initiated_promotion_forbidden: boolean;
  feedback_event_initiated_promotion_forbidden: boolean;
  product_write_initiated_promotion_forbidden: boolean;
  future_promotion_decision_record_required_later: boolean;
  future_formation_receipt_required_later: boolean;
  future_durable_perspective_delta_apply_required_later: boolean;
  runtime_promotion_not_implemented: boolean;
  runtime_write_now_false: boolean;
  durable_perspective_state_write_now_false: boolean;
  promotion_decision_record_write_now_false: boolean;
  proof_evidence_write_now_false: boolean;
  formation_receipt_write_now_false: boolean;
  work_mutation_now_false: boolean;
  public_safe_source_refs_only: boolean;
  public_safe_candidate_refs_only: boolean;
  public_safe_reviewer_note_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
}

export interface HumanReviewedDurablePerspectivePromotionImplementationValidation
  extends HumanReviewedDurablePerspectivePromotionValidation {
  invalid_promotion_decision_override_rejected: boolean;
  invalid_promotion_gate_override_rejected: boolean;
  invalid_authority_boundary_override_rejected: boolean;
  invalid_refs_override_rejected: boolean;
}

export interface HumanReviewedDurablePerspectivePromotionImplementationAuthorityBoundary {
  implementation_added_now: true;
  deterministic_builder_added_now: true;
  contract_changed_now: false;
  runtime_promotion_implemented_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_delta_apply_now: false;
  promotion_decision_record_implemented_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_write_now: false;
  formation_receipt_write_now: false;
  work_mutation_now: false;
  candidate_mutation_now: false;
  candidate_record_write_now: false;
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

export interface HumanReviewedDurablePerspectivePromotionImplementation {
  implementation_kind:
    "human_reviewed_durable_perspective_promotion_implementation";
  implementation_version:
    "human_reviewed_durable_perspective_promotion_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  implemented_contract: {
    contract_kind: "human_reviewed_durable_perspective_promotion_contract";
    contract_version: "human_reviewed_durable_perspective_promotion_contract.v0.1";
    contract_fixture_path: string;
    type_contract_path: string;
    contract_authority_boundary_preserved: true;
    contract_validation_policy_preserved: true;
    contract_gate_policy_preserved: true;
    contract_decision_families_preserved: true;
  };
  deterministic_builder: {
    builder_path:
      "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts";
    deterministic_fixture_backed_only: true;
    runtime_promotion_now: false;
    durable_perspective_state_write_now: false;
    durable_perspective_delta_apply_now: false;
    promotion_decision_record_write_now: false;
    proof_evidence_write_now: false;
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
  built_promotion_preview_bundle: HumanReviewedDurablePerspectivePromotionPreviewBundle;
  validated_implementation: HumanReviewedDurablePerspectivePromotionImplementationValidation;
  authority_boundary: HumanReviewedDurablePerspectivePromotionImplementationAuthorityBoundary;
  recommendation_status:
    "ready_for_human_reviewed_durable_perspective_promotion_browser_validation_v0_1";
  next_recommended_slice:
    "human_reviewed_durable_perspective_promotion_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const defaultContractFixturePath =
  "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json";
const defaultTypeContractPath =
  "types/human-reviewed-durable-perspective-promotion-contract.ts";
const defaultBuilderPath =
  "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts";
const expectedPromotionInputs: HumanReviewedDurablePerspectivePromotionInput[] = [
  "perspective_delta_candidate_ref",
  "claim_candidate_refs",
  "evidence_candidate_refs",
  "accepted_evidence_refs",
  "unresolved_tension_candidate_refs",
  "knowledge_gap_candidate_refs",
  "source_refs",
  "human_review_decision",
  "reviewer_note_ref",
  "promotion_gate_context_ref",
];

export function buildHumanReviewedDurablePerspectivePromotionImplementationFixture(
  input: HumanReviewedDurablePerspectivePromotionImplementationInput,
): HumanReviewedDurablePerspectivePromotionImplementation {
  const contract =
    input.human_reviewed_durable_perspective_promotion_contract;
  const sourceContractRef =
    input.source_contract_ref ??
    `${contract.contract_version}:${defaultContractFixturePath}`;
  const authorityBoundary = {
    ...getHumanReviewedDurablePerspectivePromotionImplementationAuthorityBoundary(),
    ...(input.authority_boundary_overrides ?? {}),
  };
  const builtPromotionPreviewBundle =
    buildHumanReviewedDurablePerspectivePromotionPreviewBundle({
      contract,
      source_contract_ref: sourceContractRef,
      operator_context_ref: input.operator_context_ref,
      candidate_refs: input.candidate_refs,
      source_refs: input.source_refs,
      selected_perspective_delta_candidate:
        input.selected_perspective_delta_candidate,
      promotion_gate_check_preview: input.promotion_gate_check_preview,
      promotion_decision_preview: input.promotion_decision_preview,
    });
  const boundaryFailureCodes =
    validateImplementationAuthorityBoundary(authorityBoundary);
  const topLevelBoundaryIsSeparate =
    !Object.hasOwn(
      builtPromotionPreviewBundle.authority_boundary,
      "implementation_added_now",
    ) &&
    !Object.hasOwn(
      builtPromotionPreviewBundle.authority_boundary,
      "deterministic_builder_added_now",
    ) &&
    authorityBoundary.implementation_added_now === true &&
    authorityBoundary.deterministic_builder_added_now === true;
  const previewValidation = builtPromotionPreviewBundle.validation;
  const failureCodes = uniqueSorted([
    ...previewValidation.failure_codes,
    ...boundaryFailureCodes,
    topLevelBoundaryIsSeparate
      ? null
      : "implementation_boundary_not_separate",
  ]);
  const validation: HumanReviewedDurablePerspectivePromotionImplementationValidation =
    {
      ...previewValidation,
      passed: failureCodes.length === 0,
      failure_codes: failureCodes,
      top_level_implementation_boundary_is_separate:
        topLevelBoundaryIsSeparate,
      invalid_promotion_decision_override_rejected: true,
      invalid_promotion_gate_override_rejected: true,
      invalid_authority_boundary_override_rejected: true,
      invalid_refs_override_rejected: true,
    };
  const implementation: HumanReviewedDurablePerspectivePromotionImplementation =
    {
      implementation_kind:
        "human_reviewed_durable_perspective_promotion_implementation",
      implementation_version:
        "human_reviewed_durable_perspective_promotion_implementation.v0.1",
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
        contract_gate_policy_preserved: true,
        contract_decision_families_preserved: true,
      },
      deterministic_builder: {
        builder_path: defaultBuilderPath,
        deterministic_fixture_backed_only: true,
        runtime_promotion_now: false,
        durable_perspective_state_write_now: false,
        durable_perspective_delta_apply_now: false,
        promotion_decision_record_write_now: false,
        proof_evidence_write_now: false,
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
      built_promotion_preview_bundle: builtPromotionPreviewBundle,
      validated_implementation: validation,
      authority_boundary: authorityBoundary,
      recommendation_status:
        "ready_for_human_reviewed_durable_perspective_promotion_browser_validation_v0_1",
      next_recommended_slice:
        "human_reviewed_durable_perspective_promotion_browser_validation_v0_1",
      implementation_fingerprint: "",
      fingerprint_algorithm: "fnv1a32_canonical_json",
    };
  implementation.implementation_fingerprint =
    createHumanReviewedDurablePerspectivePromotionFingerprint(implementation);
  return implementation;
}

export function buildHumanReviewedDurablePerspectivePromotionPreviewBundle(
  input: HumanReviewedDurablePerspectivePromotionPreviewBundleInput,
): HumanReviewedDurablePerspectivePromotionPreviewBundle {
  const sample = input.contract.sample_promotion_contract_preview;
  const selectedDeltaCandidate = clone(
    input.selected_perspective_delta_candidate ??
      sample.selected_perspective_delta_candidate,
  );
  const sourceContractRef =
    input.source_contract_ref ??
    `${input.contract.contract_version}:${defaultContractFixturePath}`;
  const sourceRefs = clone(input.source_refs ?? sample.source_refs);
  const candidateRefs = clone(input.candidate_refs ?? sample.candidate_refs);
  const bundleWithoutValidation = {
    preview_version: sample.preview_version,
    source_contract_ref: sourceContractRef,
    operator_context_ref:
      input.operator_context_ref ?? sample.operator_context_ref,
    candidate_refs: candidateRefs,
    source_refs: sourceRefs,
    selected_perspective_delta_candidate: selectedDeltaCandidate,
    promotion_gate_check_preview: clone(
      input.promotion_gate_check_preview ??
        sample.promotion_gate_check_preview,
    ),
    promotion_decision_preview: clone(
      input.promotion_decision_preview ?? sample.promotion_decision_preview,
    ),
    promotion_decision_family_summary:
      buildPromotionDecisionFamilySummary(input.contract),
    source_reference_summary: buildSourceReferenceSummary(
      input.contract.privacy_policy,
      sourceRefs,
    ),
    candidate_reference_summary: buildCandidateReferenceSummary(
      input.contract.privacy_policy,
      candidateRefs,
      selectedDeltaCandidate,
    ),
    authority_boundary: clone(sample.authority_boundary),
    validation_policy: clone(input.contract.validation_policy),
    promotion_gate_policy: clone(input.contract.promotion_gate_policy),
  };
  const bundle = {
    ...bundleWithoutValidation,
    validation: validateHumanReviewedDurablePerspectivePromotionPreviewBundle(
      bundleWithoutValidation,
      input.contract,
    ),
  };
  return bundle;
}

export function validateHumanReviewedDurablePerspectivePromotionPreviewBundle(
  previewBundle: Omit<
    HumanReviewedDurablePerspectivePromotionPreviewBundle,
    "validation"
  >,
  contract: HumanReviewedDurablePerspectivePromotionContract,
): HumanReviewedDurablePerspectivePromotionValidation {
  const sourceRefValidation = validateSourceRefs(
    previewBundle.source_refs,
    contract.privacy_policy,
  );
  const candidateRefValidation = validateCandidateRefs(
    previewBundle.candidate_refs,
    previewBundle.selected_perspective_delta_candidate,
    contract.privacy_policy,
  );
  const decisionValidation = validatePromotionDecisionPreview(
    previewBundle.promotion_decision_preview,
  );
  const gateValidation = validatePromotionGateCheckPreview(
    previewBundle.promotion_gate_check_preview,
  );
  const expectedPreviewBoundary =
    contract.sample_promotion_contract_preview.authority_boundary;
  const previewBundleAuthorityBoundaryMatchesContract = deepEqual(
    previewBundle.authority_boundary,
    expectedPreviewBoundary,
  );
  const previewBundleValidationPolicyMatchesContract = deepEqual(
    previewBundle.validation_policy,
    contract.validation_policy,
  );
  const previewBundleGatePolicyMatchesContract = deepEqual(
    previewBundle.promotion_gate_policy,
    contract.promotion_gate_policy,
  );
  const promotionDecisionFamiliesPreserved =
    validatePromotionDecisionFamilies(contract.promotion_decision_families);
  const promotionInputsPreserved = deepEqual(
    contract.promotion_inputs,
    expectedPromotionInputs,
  );
  const gatePolicy = contract.promotion_gate_policy;
  const validationPolicy = contract.validation_policy;
  const contractScope = contract.contract_scope;
  const explicitHumanReviewRequired =
    contract.input_policy.explicit_human_review_required === true &&
    gatePolicy.explicit_human_review_required === true &&
    gateValidation.explicit_human_review_required &&
    decisionValidation.human_review_required_later;
  const sourceRefsRequired =
    contract.input_policy.source_refs_required === true &&
    gateValidation.source_refs_present &&
    sourceRefValidation.public_safe_source_refs_only &&
    candidateRefValidation.selected_delta_candidate_has_source_refs;
  const reviewerNoteRefRequired =
    contract.input_policy.reviewer_note_ref_required === true &&
    decisionValidation.reviewer_note_ref_present &&
    decisionValidation.reviewer_note_ref_public_safe;
  const futurePromotionDecisionRecordRequiredLater =
    gatePolicy.promotion_decision_record_required_later === true &&
    validationPolicy.promotion_decision_record_required_later === true &&
    decisionValidation.future_promotion_decision_record_required;
  const futureFormationReceiptRequiredLater =
    gatePolicy.formation_receipt_required_later === true &&
    validationPolicy.formation_receipt_required_later === true &&
    decisionValidation.future_formation_receipt_required;
  const futureDurablePerspectiveDeltaApplyRequiredLater =
    gatePolicy.durable_perspective_delta_apply_required_later === true &&
    validationPolicy.durable_perspective_delta_apply_required_later === true &&
    decisionValidation.future_durable_perspective_delta_apply_required;
  const runtimeWriteNowFalse =
    gateValidation.runtime_write_now_false &&
    decisionValidation.runtime_write_now_false &&
    contractScope.runtime_promotion_now === false &&
    contractScope.runtime_db_query_now === false &&
    contractScope.runtime_db_write_now === false;
  const previewBundleFollowsContract =
    previewBundle.preview_version ===
      "human_reviewed_durable_perspective_promotion_preview.v0.1" &&
    hasText(previewBundle.source_contract_ref) &&
    hasText(previewBundle.operator_context_ref) &&
    sourceRefsRequired &&
    reviewerNoteRefRequired &&
    candidateRefValidation.candidate_refs_follow_contract &&
    decisionValidation.promotion_decision_preview_follows_contract &&
    gateValidation.promotion_gate_preview_follows_contract &&
    previewBundleAuthorityBoundaryMatchesContract &&
    previewBundleValidationPolicyMatchesContract &&
    previewBundleGatePolicyMatchesContract;
  const validationWithoutFailureCodes = {
    preview_bundle_follows_contract: previewBundleFollowsContract,
    preview_bundle_authority_boundary_matches_contract:
      previewBundleAuthorityBoundaryMatchesContract,
    preview_bundle_validation_policy_matches_contract:
      previewBundleValidationPolicyMatchesContract,
    preview_bundle_gate_policy_matches_contract:
      previewBundleGatePolicyMatchesContract,
    top_level_implementation_boundary_is_separate: true,
    promotion_decision_families_preserved:
      promotionDecisionFamiliesPreserved,
    promotion_inputs_preserved: promotionInputsPreserved,
    explicit_human_review_required: explicitHumanReviewRequired,
    source_refs_required: sourceRefsRequired,
    reviewer_note_ref_required: reviewerNoteRefRequired,
    candidate_durable_distinction_preserved:
      candidateRefValidation.candidate_durable_distinction_preserved &&
      decisionValidation.not_durable_perspective_state,
    claim_candidate_not_fact: gatePolicy.claim_candidate_is_not_fact === true,
    evidence_candidate_not_accepted_evidence:
      gatePolicy.evidence_candidate_is_not_accepted_evidence === true,
    accepted_evidence_distinction_required:
      gatePolicy.accepted_evidence_ref_required_for_evidence_record_claims ===
        true &&
      gateValidation.accepted_evidence_distinction_preserved &&
      candidateRefValidation.accepted_evidence_distinction_required,
    unresolved_tensions_preserved_or_resolved:
      gatePolicy.unresolved_tensions_must_be_preserved_or_explicitly_resolved ===
        true && gateValidation.unresolved_tensions_handled,
    knowledge_gaps_preserved_or_deferred:
      gatePolicy.knowledge_gaps_must_be_preserved_or_explicitly_deferred ===
        true && gateValidation.knowledge_gaps_handled,
    retrieval_result_not_promotion_authority:
      gatePolicy.retrieval_initiated_promotion_forbidden === true &&
      validationPolicy.retrieval_result_not_authority === true,
    retrieval_result_not_evidence:
      gatePolicy.retrieval_result_is_not_evidence === true,
    rag_answer_not_proof_or_evidence:
      gatePolicy.rag_answer_is_not_proof_or_evidence === true &&
      validationPolicy.rag_answer_not_proof_or_evidence === true,
    retrieval_score_not_promotion_score:
      gatePolicy.retrieval_score_is_not_promotion_score === true &&
      validationPolicy.retrieval_score_not_promotion_score === true,
    embedding_similarity_not_promotion_readiness:
      gatePolicy.embedding_similarity_is_not_promotion_readiness === true &&
      validationPolicy.embedding_similarity_not_promotion_readiness === true,
    salience_score_not_promotion_authority:
      gatePolicy.salience_score_is_not_promotion_authority === true &&
      validationPolicy.salience_score_not_promotion_authority === true,
    provider_output_not_promotion_authority:
      validationPolicy.provider_output_not_promotion_authority === true,
    codex_github_automation_not_promotion_authority:
      validationPolicy.codex_github_automation_not_promotion_authority ===
      true,
    agent_substrate_not_promotion_authority:
      validationPolicy.agent_substrate_not_promotion_authority === true,
    provider_initiated_promotion_forbidden:
      gatePolicy.provider_initiated_promotion_forbidden === true,
    retrieval_initiated_promotion_forbidden:
      gatePolicy.retrieval_initiated_promotion_forbidden === true,
    rag_initiated_promotion_forbidden:
      gatePolicy.rag_initiated_promotion_forbidden === true,
    agent_substrate_initiated_promotion_forbidden:
      gatePolicy.agent_substrate_initiated_promotion_forbidden === true,
    codex_initiated_promotion_forbidden:
      gatePolicy.codex_initiated_promotion_forbidden === true,
    github_automation_initiated_promotion_forbidden:
      gatePolicy.github_automation_initiated_promotion_forbidden === true,
    salience_initiated_promotion_forbidden:
      gatePolicy.salience_initiated_promotion_forbidden === true,
    feedback_event_initiated_promotion_forbidden:
      gatePolicy.feedback_event_initiated_promotion_forbidden === true,
    product_write_initiated_promotion_forbidden:
      gatePolicy.product_write_initiated_promotion_forbidden === true,
    future_promotion_decision_record_required_later:
      futurePromotionDecisionRecordRequiredLater,
    future_formation_receipt_required_later:
      futureFormationReceiptRequiredLater,
    future_durable_perspective_delta_apply_required_later:
      futureDurablePerspectiveDeltaApplyRequiredLater,
    runtime_promotion_not_implemented:
      contractScope.runtime_promotion_now === false,
    runtime_write_now_false: runtimeWriteNowFalse,
    durable_perspective_state_write_now_false:
      contractScope.durable_perspective_state_write_now === false,
    promotion_decision_record_write_now_false:
      contractScope.promotion_decision_record_write_now === false,
    proof_evidence_write_now_false:
      contractScope.proof_evidence_write_now === false,
    formation_receipt_write_now_false:
      contractScope.formation_receipt_write_now === false,
    work_mutation_now_false: contractScope.work_mutation_now === false,
    public_safe_source_refs_only:
      sourceRefValidation.public_safe_source_refs_only,
    public_safe_candidate_refs_only:
      candidateRefValidation.public_safe_candidate_refs_only,
    public_safe_reviewer_note_refs_only:
      decisionValidation.reviewer_note_ref_public_safe,
    no_raw_private_source_body:
      contract.privacy_policy.no_raw_source_body === true,
    no_raw_provider_thread_run_session_ids:
      contract.privacy_policy.no_raw_provider_thread_run_session_ids === true,
    no_private_urls:
      contract.privacy_policy.no_private_urls === true &&
      sourceRefValidation.all_refs_stable &&
      candidateRefValidation.all_refs_stable &&
      decisionValidation.reviewer_note_ref_public_safe,
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
    previewBundleGatePolicyMatchesContract
      ? null
      : "preview_bundle_gate_policy_mismatch",
    promotionDecisionFamiliesPreserved
      ? null
      : "promotion_decision_families_not_preserved",
    promotionInputsPreserved ? null : "promotion_inputs_not_preserved",
    explicitHumanReviewRequired
      ? null
      : "promotion_gate_missing_explicit_human_review",
    sourceRefsRequired ? null : "promotion_gate_missing_source_refs",
    reviewerNoteRefRequired ? null : "reviewer_note_ref_missing",
    futurePromotionDecisionRecordRequiredLater
      ? null
      : "promotion_decision_missing_future_promotion_decision_record",
    futureFormationReceiptRequiredLater
      ? null
      : "promotion_decision_missing_future_formation_receipt",
    futureDurablePerspectiveDeltaApplyRequiredLater
      ? null
      : "promotion_decision_missing_future_durable_perspective_delta_apply",
    ...sourceRefValidation.failure_codes,
    ...candidateRefValidation.failure_codes,
    ...decisionValidation.failure_codes,
    ...gateValidation.failure_codes,
  ]);
  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    ...validationWithoutFailureCodes,
  };
}

export function createHumanReviewedDurablePerspectivePromotionFingerprint(
  value: unknown,
): string {
  const normalized = clone(value) as JsonRecord;
  const { implementation_fingerprint: _implementationFingerprint, ...rest } =
    normalized;
  return `fnv1a32:${fnv1a32(canonicalJson(rest))}`;
}

function getHumanReviewedDurablePerspectivePromotionImplementationAuthorityBoundary():
  HumanReviewedDurablePerspectivePromotionImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    deterministic_builder_added_now: true,
    contract_changed_now: false,
    runtime_promotion_implemented_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    promotion_decision_record_implemented_now: false,
    promotion_decision_record_write_now: false,
    proof_or_evidence_record_write_now: false,
    formation_receipt_write_now: false,
    work_mutation_now: false,
    candidate_mutation_now: false,
    candidate_record_write_now: false,
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

function buildPromotionDecisionFamilySummary(
  contract: HumanReviewedDurablePerspectivePromotionContract,
): HumanReviewedPromotionDecisionFamilySummary {
  const decisionKinds = contract.promotion_decision_families.map(
    (family) => family.decision_kind,
  );
  const promote = contract.promotion_decision_families.find(
    (family) => family.decision_kind === "promote",
  );
  return {
    decision_family_count: contract.promotion_decision_families.length,
    decision_kinds: clone(decisionKinds),
    all_decision_families_preserved:
      validatePromotionDecisionFamilies(contract.promotion_decision_families),
    all_require_explicit_human_review:
      contract.promotion_decision_families.every(
        (family) => family.explicit_human_review_required === true,
      ),
    all_runtime_write_now_false: contract.promotion_decision_families.every(
      (family) => family.runtime_write_now === false,
    ),
    promote_requires_source_refs_basis_tensions_gaps_and_future_records:
      promote?.source_refs_required === true &&
      promote.basis_required === true &&
      promote.unresolved_tension_handling_required === true &&
      promote.knowledge_gap_handling_required === true &&
      promote.future_promotion_decision_record_required === true &&
      promote.future_formation_receipt_required === true &&
      promote.runtime_write_now === false,
  };
}

function buildSourceReferenceSummary(
  privacyPolicy: HumanReviewedDurablePerspectivePromotionPrivacyPolicy,
  sourceRefs: string[],
): HumanReviewedPromotionSourceReferenceSummary {
  const validation = validateSourceRefs(sourceRefs, privacyPolicy);
  return {
    source_ref_count: sourceRefs.length,
    source_refs: clone(sourceRefs),
    public_safe_source_refs_only: validation.public_safe_source_refs_only,
    no_raw_private_source_body:
      privacyPolicy.no_raw_source_body === true,
    no_raw_provider_thread_run_session_ids:
      privacyPolicy.no_raw_provider_thread_run_session_ids === true,
    no_private_urls: privacyPolicy.no_private_urls === true,
    no_secrets: privacyPolicy.no_secrets_in_fixture === true,
  };
}

function buildCandidateReferenceSummary(
  privacyPolicy: HumanReviewedDurablePerspectivePromotionPrivacyPolicy,
  candidateRefs: string[],
  candidate: HumanReviewedPerspectiveDeltaCandidatePreview,
): HumanReviewedPromotionCandidateReferenceSummary {
  const validation = validateCandidateRefs(
    candidateRefs,
    candidate,
    privacyPolicy,
  );
  return {
    candidate_ref_count: candidateRefs.length,
    candidate_refs: clone(candidateRefs),
    selected_delta_candidate_ref: candidate.candidate_ref,
    basis_claim_candidate_refs: clone(candidate.basis_claim_candidate_refs),
    basis_evidence_candidate_refs: clone(candidate.basis_evidence_candidate_refs),
    accepted_evidence_refs: clone(candidate.accepted_evidence_refs),
    unresolved_tension_candidate_refs: clone(
      candidate.unresolved_tension_candidate_refs,
    ),
    knowledge_gap_candidate_refs: clone(candidate.knowledge_gap_candidate_refs),
    public_safe_candidate_refs_only:
      validation.public_safe_candidate_refs_only,
    candidate_durable_distinction_preserved:
      validation.candidate_durable_distinction_preserved,
    accepted_evidence_distinction_required:
      validation.accepted_evidence_distinction_required,
  };
}

function validatePromotionDecisionFamilies(
  families: HumanReviewedPromotionDecisionFamily[],
): boolean {
  const decisionKinds = families.map((family) => family.decision_kind);
  return (
    deepEqual(decisionKinds, [
      "promote",
      "reject",
      "defer",
      "supersede",
      "request_more_evidence",
      "split_delta",
      "merge_with_existing",
      "retire_candidate",
    ]) &&
    families.every(
      (family) =>
        family.explicit_human_review_required === true &&
        family.future_promotion_decision_record_required === true &&
        family.runtime_write_now === false,
    )
  );
}

function validateSourceRefs(
  sourceRefs: string[],
  privacyPolicy: HumanReviewedDurablePerspectivePromotionPrivacyPolicy,
) {
  const sourceRefsPresent = Array.isArray(sourceRefs) && sourceRefs.length > 0;
  const allPublicSafe = sourceRefs.every(publicSafeRefIsStable);
  const publicSafeSourceRefsOnly =
    sourceRefsPresent &&
    allPublicSafe &&
    privacyPolicy.public_safe_source_refs_only === true;
  const failureCodes = [
    sourceRefsPresent ? null : "source_refs_missing",
    allPublicSafe ? null : "private_or_unstable_ref_detected",
  ];
  return {
    public_safe_source_refs_only: publicSafeSourceRefsOnly,
    all_refs_stable: allPublicSafe,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function validateCandidateRefs(
  candidateRefs: string[],
  candidate: HumanReviewedPerspectiveDeltaCandidatePreview,
  privacyPolicy: HumanReviewedDurablePerspectivePromotionPrivacyPolicy,
) {
  const candidateRefsPresent =
    Array.isArray(candidateRefs) && candidateRefs.length > 0;
  const selectedDeltaCandidateHasSourceRefs =
    Array.isArray(candidate.source_refs) &&
    candidate.source_refs.length > 0 &&
    candidate.source_refs.every(publicSafeRefIsStable);
  const selectedDeltaCandidateHasBasis =
    Array.isArray(candidate.basis_claim_candidate_refs) &&
    candidate.basis_claim_candidate_refs.length > 0 &&
    Array.isArray(candidate.basis_evidence_candidate_refs) &&
    candidate.basis_evidence_candidate_refs.length > 0;
  const allCandidateRefValues = [
    ...candidateRefs,
    candidate.candidate_ref,
    ...candidate.basis_claim_candidate_refs,
    ...candidate.basis_evidence_candidate_refs,
    ...candidate.accepted_evidence_refs,
    ...candidate.unresolved_tension_candidate_refs,
    ...candidate.knowledge_gap_candidate_refs,
    ...candidate.source_refs,
  ].filter(hasText);
  const allRefsStable = allCandidateRefValues.every(publicSafeRefIsStable);
  const publicSafeCandidateRefsOnly =
    candidateRefsPresent &&
    allRefsStable &&
    privacyPolicy.public_safe_candidate_refs_only === true;
  const candidateDurableDistinctionPreserved =
    candidate.candidate_only === true &&
    candidate.not_durable_state === true &&
    candidate.not_proof === true &&
    candidate.not_evidence_record === true;
  const acceptedEvidenceDistinctionRequired =
    Array.isArray(candidate.accepted_evidence_refs) &&
    candidate.accepted_evidence_refs.length > 0 &&
    candidate.accepted_evidence_refs.every((ref) =>
      ref.startsWith("accepted_evidence_ref:public:"),
    );
  const unresolvedTensionsHandled =
    Array.isArray(candidate.unresolved_tension_candidate_refs) &&
    candidate.unresolved_tension_candidate_refs.length > 0;
  const knowledgeGapsHandled =
    Array.isArray(candidate.knowledge_gap_candidate_refs) &&
    candidate.knowledge_gap_candidate_refs.length > 0;
  const candidateRefsFollowContract =
    publicSafeCandidateRefsOnly &&
    selectedDeltaCandidateHasSourceRefs &&
    selectedDeltaCandidateHasBasis &&
    candidateDurableDistinctionPreserved &&
    acceptedEvidenceDistinctionRequired &&
    unresolvedTensionsHandled &&
    knowledgeGapsHandled;
  const failureCodes = [
    candidateRefsPresent ? null : "candidate_refs_missing",
    selectedDeltaCandidateHasSourceRefs
      ? null
      : "selected_delta_candidate_missing_source_refs",
    selectedDeltaCandidateHasBasis
      ? null
      : "selected_delta_candidate_missing_basis",
    candidate.candidate_only === true
      ? null
      : "selected_delta_candidate_not_candidate_only",
    candidate.not_durable_state === true
      ? null
      : "selected_delta_candidate_durable_state_enabled",
    candidate.not_proof === true
      ? null
      : "selected_delta_candidate_proof_enabled",
    candidate.not_evidence_record === true
      ? null
      : "selected_delta_candidate_evidence_record_enabled",
    allRefsStable ? null : "private_or_unstable_ref_detected",
  ];
  return {
    candidate_refs_follow_contract: candidateRefsFollowContract,
    public_safe_candidate_refs_only: publicSafeCandidateRefsOnly,
    all_refs_stable: allRefsStable,
    selected_delta_candidate_has_source_refs:
      selectedDeltaCandidateHasSourceRefs,
    selected_delta_candidate_has_basis: selectedDeltaCandidateHasBasis,
    candidate_durable_distinction_preserved:
      candidateDurableDistinctionPreserved,
    accepted_evidence_distinction_required:
      acceptedEvidenceDistinctionRequired,
    unresolved_tensions_handled: unresolvedTensionsHandled,
    knowledge_gaps_handled: knowledgeGapsHandled,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function validatePromotionGateCheckPreview(
  gate: HumanReviewedPromotionGateCheckPreview,
) {
  const promotionGatePreviewFollowsContract =
    gate.explicit_human_review_required === true &&
    gate.source_refs_present === true &&
    gate.basis_present === true &&
    gate.accepted_evidence_distinction_preserved === true &&
    gate.unresolved_tensions_preserved_or_explicitly_resolved === true &&
    gate.knowledge_gaps_preserved_or_explicitly_deferred === true &&
    gate.retrieval_rag_context_non_authoritative === true &&
    gate.salience_context_non_authoritative === true &&
    gate.provider_context_non_authoritative === true &&
    gate.product_write_forbidden === true &&
    gate.runtime_write_now === false;
  const failureCodes = [
    gate.explicit_human_review_required === true
      ? null
      : "promotion_gate_missing_explicit_human_review",
    gate.source_refs_present === true
      ? null
      : "promotion_gate_missing_source_refs",
    gate.basis_present === true ? null : "promotion_gate_missing_basis",
    gate.accepted_evidence_distinction_preserved === true
      ? null
      : "promotion_gate_accepted_evidence_distinction_not_preserved",
    gate.unresolved_tensions_preserved_or_explicitly_resolved === true
      ? null
      : "promotion_gate_unresolved_tensions_not_handled",
    gate.knowledge_gaps_preserved_or_explicitly_deferred === true
      ? null
      : "promotion_gate_knowledge_gaps_not_handled",
    gate.retrieval_rag_context_non_authoritative === true
      ? null
      : "promotion_gate_retrieval_rag_context_authoritative",
    gate.salience_context_non_authoritative === true
      ? null
      : "promotion_gate_salience_context_authoritative",
    gate.provider_context_non_authoritative === true
      ? null
      : "promotion_gate_provider_context_authoritative",
    gate.product_write_forbidden === true
      ? null
      : "promotion_gate_product_write_allowed",
    gate.runtime_write_now === false
      ? null
      : "promotion_gate_runtime_write_enabled",
  ];
  return {
    promotion_gate_preview_follows_contract:
      promotionGatePreviewFollowsContract,
    explicit_human_review_required:
      gate.explicit_human_review_required === true,
    source_refs_present: gate.source_refs_present === true,
    basis_present: gate.basis_present === true,
    accepted_evidence_distinction_preserved:
      gate.accepted_evidence_distinction_preserved === true,
    unresolved_tensions_handled:
      gate.unresolved_tensions_preserved_or_explicitly_resolved === true,
    knowledge_gaps_handled:
      gate.knowledge_gaps_preserved_or_explicitly_deferred === true,
    runtime_write_now_false: gate.runtime_write_now === false,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function validatePromotionDecisionPreview(
  decision: HumanReviewedPromotionDecisionPreview,
) {
  const reviewerNoteRefPresent = hasText(decision.reviewer_note_ref);
  const reviewerNoteRefPublicSafe =
    reviewerNoteRefPresent && publicSafeRefIsStable(decision.reviewer_note_ref);
  const promotionDecisionPreviewFollowsContract =
    decision.human_review_decision_required_later === true &&
    reviewerNoteRefPublicSafe &&
    decision.future_promotion_decision_record_required === true &&
    decision.future_formation_receipt_required === true &&
    decision.future_durable_perspective_delta_apply_required === true &&
    decision.runtime_write_now === false &&
    decision.not_durable_perspective_state === true &&
    decision.not_proof_or_evidence === true &&
    decision.not_work_status === true &&
    decision.not_product_write === true;
  const failureCodes = [
    decision.human_review_decision_required_later === true
      ? null
      : "promotion_decision_missing_human_review_required_later",
    reviewerNoteRefPresent
      ? null
      : "promotion_decision_missing_reviewer_note_ref",
    reviewerNoteRefPresent ? null : "reviewer_note_ref_missing",
    reviewerNoteRefPublicSafe ? null : "private_or_unstable_ref_detected",
    decision.runtime_write_now === false
      ? null
      : "promotion_decision_runtime_write_enabled",
    decision.not_durable_perspective_state === true
      ? null
      : "promotion_decision_durable_state_enabled",
    decision.not_proof_or_evidence === true
      ? null
      : "promotion_decision_proof_or_evidence_enabled",
    decision.not_work_status === true
      ? null
      : "promotion_decision_work_status_enabled",
    decision.not_product_write === true
      ? null
      : "promotion_decision_product_write_enabled",
    decision.future_promotion_decision_record_required === true
      ? null
      : "promotion_decision_missing_future_promotion_decision_record",
    decision.future_formation_receipt_required === true
      ? null
      : "promotion_decision_missing_future_formation_receipt",
    decision.future_durable_perspective_delta_apply_required === true
      ? null
      : "promotion_decision_missing_future_durable_perspective_delta_apply",
  ];
  return {
    promotion_decision_preview_follows_contract:
      promotionDecisionPreviewFollowsContract,
    human_review_required_later:
      decision.human_review_decision_required_later === true,
    reviewer_note_ref_present: reviewerNoteRefPresent,
    reviewer_note_ref_public_safe: reviewerNoteRefPublicSafe,
    future_promotion_decision_record_required:
      decision.future_promotion_decision_record_required === true,
    future_formation_receipt_required:
      decision.future_formation_receipt_required === true,
    future_durable_perspective_delta_apply_required:
      decision.future_durable_perspective_delta_apply_required === true,
    runtime_write_now_false: decision.runtime_write_now === false,
    not_durable_perspective_state:
      decision.not_durable_perspective_state === true,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function validateImplementationAuthorityBoundary(
  boundary: Partial<HumanReviewedDurablePerspectivePromotionImplementationAuthorityBoundary>,
): string[] {
  const codeByField: Record<string, string> = {
    runtime_promotion_implemented_now: "runtime_promotion_enabled",
    durable_perspective_state_write_now:
      "durable_perspective_state_write_enabled",
    durable_perspective_delta_apply_now:
      "durable_perspective_delta_apply_enabled",
    promotion_decision_record_implemented_now:
      "promotion_decision_record_implemented",
    promotion_decision_record_write_now:
      "promotion_decision_record_write_enabled",
    proof_or_evidence_record_write_now:
      "proof_or_evidence_record_write_enabled",
    formation_receipt_write_now: "formation_receipt_write_enabled",
    work_mutation_now: "work_mutation_enabled",
    candidate_mutation_now: "candidate_mutation_enabled",
    candidate_record_write_now: "candidate_record_write_enabled",
    runtime_retrieval_rag_implemented_now: "runtime_retrieval_rag_enabled",
    provider_openai_call_now: "provider_openai_call_enabled",
    provider_openai_authority: "provider_openai_call_enabled",
    source_fetch_now: "source_fetch_enabled",
    source_fetch_authority: "source_fetch_enabled",
    crawler_now: "crawler_enabled",
    runtime_db_query_now: "runtime_db_query_enabled",
    production_db_used_now: "runtime_db_query_enabled",
    runtime_db_write_now: "runtime_db_write_enabled",
    product_write_authority: "product_write_enabled",
    product_id_allocation_authority: "product_id_allocation_enabled",
  };
  return uniqueSorted(
    Object.entries(codeByField).map(([field, code]) =>
      boundary[field as keyof typeof boundary] === true ? code : null,
    ),
  );
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
