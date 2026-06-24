import type {
  AgentPerspectiveSubstrateFeedbackAuthorityBoundary,
  AgentPerspectiveSubstrateFeedbackForbiddenActionsPolicy,
  AgentPerspectiveSubstrateFeedbackInputField,
  AgentPerspectiveSubstrateFeedbackKind,
  AgentPerspectiveSubstrateFeedbackKindSpec,
  AgentPerspectiveSubstrateFeedbackLoopContractFixture,
  AgentPerspectiveSubstrateFeedbackOutputField,
  AgentPerspectiveSubstrateFeedbackPrivacyPolicy,
  AgentPerspectiveSubstrateFeedbackSectionFamily,
  AgentPerspectiveSubstrateFeedbackSectionKind,
  AgentPerspectiveSubstrateFeedbackTargetKind,
  AgentPerspectiveSubstrateFeedbackValidationPolicy,
} from "@/types/agent-perspective-substrate-feedback-loop-contract";

type JsonRecord = Record<string, unknown>;
type FeedbackLoopContractWithFingerprint =
  AgentPerspectiveSubstrateFeedbackLoopContractFixture & {
    contract_fingerprint: string;
  };

type FeedbackPreview = JsonRecord & {
  feedback_preview_id?: unknown;
  feedback_kind?: unknown;
  target_kind?: unknown;
  target_ref?: unknown;
  source_refs?: unknown;
  authority_boundary?: unknown;
  forbidden_actions?: unknown;
  stop_conditions?: unknown;
  feedback_summary?: unknown;
  future_surfacing_effect_preview?: unknown;
  rule_failure_candidate_preview?: unknown;
  follow_up_candidate_preview?: unknown;
  all_sections_public_safe?: unknown;
  all_runtime_write_now_false?: unknown;
};

type FeedbackLoopValidation = {
  passed: boolean;
  failure_codes: string[];
  preview_bundle_follows_contract: boolean;
  preview_bundle_authority_boundary_matches_contract: boolean;
  preview_bundle_validation_policy_matches_contract: boolean;
  preview_bundle_forbidden_actions_policy_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  feedback_input_fields_preserved: boolean;
  feedback_output_fields_preserved: boolean;
  feedback_principles_preserved: boolean;
  feedback_kinds_preserved: boolean;
  feedback_target_kinds_preserved: boolean;
  feedback_section_families_preserved: boolean;
  forbidden_actions_policy_preserved: boolean;
  feedback_is_operator_signal_not_truth: boolean;
  feedback_is_advisory_input_not_execution_authority: boolean;
  feedback_not_proof_or_evidence: boolean;
  feedback_not_durable_perspective_state: boolean;
  feedback_not_work_status: boolean;
  feedback_not_product_write: boolean;
  feedback_does_not_automatically_promote_candidates: boolean;
  feedback_does_not_automatically_suppress_or_delete_candidates: boolean;
  dismiss_is_not_deletion: boolean;
  pin_is_not_promotion: boolean;
  mark_useful_is_not_truth: boolean;
  mark_wrong_is_not_proof_of_falsity: boolean;
  needs_more_evidence_is_review_cue_not_retrieval_execution: boolean;
  scope_overreach_is_constraint_signal_not_state_mutation: boolean;
  not_relevant_now_is_temporal_context_not_rejection: boolean;
  user_correction_does_not_mutate_core_state_now: boolean;
  source_refs_required_for_grounded_targets: boolean;
  feedback_target_refs_public_safe: boolean;
  target_kind_preserves_candidate_durable_distinction: boolean;
  unresolved_tensions_preserved: boolean;
  knowledge_gaps_preserved: boolean;
  future_surfacing_priority_only: boolean;
  rule_failure_candidate_preview_only: boolean;
  follow_up_candidate_preview_only: boolean;
  agent_substrate_folded_derived_advisory_only: boolean;
  ai_context_packet_context_not_execution_authority: boolean;
  codex_handoff_draft_not_execution_approval: boolean;
  packet_receipt_linkage_provenance_not_completion_proof: boolean;
  runtime_feedback_loop_build_not_implemented: boolean;
  feedback_event_write_not_implemented: boolean;
  feedback_event_mutation_not_implemented: boolean;
  agent_substrate_mutation_not_implemented: boolean;
  agent_substrate_execution_not_implemented: boolean;
  salience_write_not_implemented: boolean;
  durable_salience_write_not_implemented: boolean;
  recent_rehearsal_buffer_write_not_implemented: boolean;
  durable_memory_write_not_implemented: boolean;
  linkage_record_write_not_implemented: boolean;
  formation_receipt_write_not_implemented: boolean;
  codex_execution_now_false: boolean;
  github_automation_now_false: boolean;
  agent_routing_execution_now_false: boolean;
  provider_openai_call_not_implemented: boolean;
  retrieval_rag_execution_not_implemented: boolean;
  runtime_state_read_write_not_implemented: boolean;
  durable_perspective_delta_apply_not_implemented: boolean;
  proof_or_evidence_write_not_implemented: boolean;
  accepted_evidence_write_not_implemented: boolean;
  work_mutation_now_false: boolean;
  runtime_db_write_query_not_implemented: boolean;
  product_write_not_implemented: boolean;
  public_safe_refs_only: boolean;
  no_raw_private_source_body: boolean;
  no_raw_provider_thread_run_session_ids: boolean;
  no_private_urls: boolean;
  no_secrets: boolean;
  no_access_tokens: boolean;
  no_ssh_keys: boolean;
  invalid_feedback_preview_override_rejected: boolean;
  invalid_feedback_kind_override_rejected: boolean;
  invalid_feedback_target_override_rejected: boolean;
  invalid_feedback_section_override_rejected: boolean;
  invalid_forbidden_actions_override_rejected: boolean;
  invalid_authority_boundary_override_rejected: boolean;
  invalid_refs_override_rejected: boolean;
};

export type AgentPerspectiveSubstrateFeedbackLoopPreviewBundle = {
  preview_version: "agent_perspective_substrate_feedback_loop_preview.v0.1";
  source_contract_ref: string;
  operator_context_ref: string;
  feedback_input_preview: JsonRecord;
  feedback_preview: FeedbackPreview;
  feedback_principle_summary: JsonRecord;
  feedback_kind_summary: JsonRecord;
  feedback_target_kind_summary: JsonRecord;
  feedback_section_family_summary: JsonRecord;
  forbidden_actions_summary: JsonRecord;
  reference_summary: JsonRecord;
  validation: FeedbackLoopValidation;
  authority_boundary: AgentPerspectiveSubstrateFeedbackAuthorityBoundary;
  validation_policy: AgentPerspectiveSubstrateFeedbackValidationPolicy;
  forbidden_actions_policy: AgentPerspectiveSubstrateFeedbackForbiddenActionsPolicy;
};

type ImplementationAuthorityBoundary = {
  implementation_added_now: true;
  deterministic_builder_added_now: true;
  contract_changed_now: false;
  feedback_loop_runtime_build_implemented_now: false;
  feedback_event_write_now: false;
  feedback_event_mutation_now: false;
  feedback_event_store_write_now: false;
  agent_substrate_mutation_now: false;
  agent_substrate_execution_now: false;
  salience_write_now: false;
  durable_salience_write_now: false;
  recent_rehearsal_buffer_write_now: false;
  durable_memory_write_now: false;
  linkage_record_write_now: false;
  formation_receipt_write_now: false;
  codex_execution_now: false;
  github_automation_now: false;
  github_pr_creation_now: false;
  git_branch_creation_now: false;
  git_commit_creation_now: false;
  external_handoff_sending_now: false;
  agent_routing_now: false;
  agent_execution_now: false;
  provider_openai_call_now: false;
  provider_extraction_now: false;
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
  feedback_authority: false;
  feedback_truth_authority: false;
  feedback_promotion_authority: false;
  feedback_suppression_authority: false;
  feedback_deletion_authority: false;
  mark_useful_truth_authority: false;
  mark_wrong_falsity_authority: false;
  pin_promotion_authority: false;
  dismiss_deletion_authority: false;
  scope_overreach_state_mutation_authority: false;
  needs_more_evidence_retrieval_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  agent_routing_authority: false;
  agent_execution_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  salience_authority: false;
  ai_context_packet_authority: false;
  codex_handoff_draft_authority: false;
  linkage_authority: false;
  receipt_completion_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
};

export type AgentPerspectiveSubstrateFeedbackLoopImplementation = {
  implementation_kind: "agent_perspective_substrate_feedback_loop_implementation";
  implementation_version: "agent_perspective_substrate_feedback_loop_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  implemented_contract: JsonRecord;
  deterministic_builder: JsonRecord;
  built_agent_perspective_substrate_feedback_loop_preview_bundle: AgentPerspectiveSubstrateFeedbackLoopPreviewBundle;
  validated_implementation: FeedbackLoopValidation;
  authority_boundary: ImplementationAuthorityBoundary;
  recommendation_status: "ready_for_agent_perspective_substrate_feedback_loop_browser_validation_v0_1";
  next_recommended_slice: "agent_perspective_substrate_feedback_loop_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
};

type BuildImplementationInput = {
  agent_perspective_substrate_feedback_loop_contract: FeedbackLoopContractWithFingerprint;
  source_contract_ref?: string;
  source_contract_fixture_path?: string;
  type_contract_path?: string;
  operator_context_ref?: string;
  feedback_input_preview?: JsonRecord;
  feedback_preview?: FeedbackPreview;
  feedback_kinds?: AgentPerspectiveSubstrateFeedbackKindSpec[];
  feedback_target_kinds?: AgentPerspectiveSubstrateFeedbackTargetKind[];
  feedback_section_families?: AgentPerspectiveSubstrateFeedbackSectionFamily[];
  forbidden_actions_policy?: AgentPerspectiveSubstrateFeedbackForbiddenActionsPolicy;
  authority_boundary_overrides?: Partial<ImplementationAuthorityBoundary>;
};

type BuildPreviewBundleInput = {
  contract: FeedbackLoopContractWithFingerprint;
  source_contract_ref?: string;
  operator_context_ref?: string;
  feedback_input_preview?: JsonRecord;
  feedback_preview?: FeedbackPreview;
  feedback_kinds?: AgentPerspectiveSubstrateFeedbackKindSpec[];
  feedback_target_kinds?: AgentPerspectiveSubstrateFeedbackTargetKind[];
  feedback_section_families?: AgentPerspectiveSubstrateFeedbackSectionFamily[];
  forbidden_actions_policy?: AgentPerspectiveSubstrateFeedbackForbiddenActionsPolicy;
};

const defaultContractFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json";
const defaultTypeContractPath =
  "types/agent-perspective-substrate-feedback-loop-contract.ts";
const defaultBuilderPath =
  "lib/research-candidate-review/agent-perspective-substrate-feedback-loop.ts" as const;

const expectedInputFields: AgentPerspectiveSubstrateFeedbackInputField[] = [
  "feedback_scope_ref",
  "substrate_warning_ref",
  "surfaced_item_ref",
  "target_kind",
  "target_ref",
  "feedback_kind",
  "operator_feedback_ref",
  "source_refs",
  "authority_boundary_ref",
  "forbidden_actions_ref",
  "stop_conditions_ref",
  "operator_context_ref",
];

const expectedOutputFields: AgentPerspectiveSubstrateFeedbackOutputField[] = [
  "feedback_preview_id",
  "feedback_version",
  "target_kind",
  "target_ref",
  "feedback_kind",
  "feedback_summary",
  "future_surfacing_effect_preview",
  "rule_failure_candidate_preview",
  "follow_up_candidate_preview",
  "source_refs",
  "authority_boundary",
  "forbidden_actions",
  "stop_conditions",
  "validation_policy",
  "privacy_policy",
];

const expectedFeedbackKinds: AgentPerspectiveSubstrateFeedbackKind[] = [
  "dismiss",
  "pin",
  "mark_wrong",
  "mark_useful",
  "needs_more_evidence",
  "scope_overreach",
  "not_relevant_now",
  "correct",
];

const expectedTargetKinds: AgentPerspectiveSubstrateFeedbackTargetKind[] = [
  "substrate_warning",
  "digest_diagnostic",
  "context_packet_section",
  "codex_handoff_draft_section",
  "packet_receipt_linkage_section",
  "research_candidate",
  "perspective_delta_candidate",
  "unresolved_tension",
  "knowledge_gap",
  "source_reference",
  "work_context",
];

const expectedSectionKinds: AgentPerspectiveSubstrateFeedbackSectionKind[] = [
  "feedback_target",
  "operator_feedback",
  "future_surfacing_effect_preview",
  "rule_failure_candidate_preview",
  "follow_up_candidate_preview",
  "authority_boundary",
  "forbidden_actions",
  "stop_conditions",
];

export function buildAgentPerspectiveSubstrateFeedbackLoopImplementationFixture(
  input: BuildImplementationInput,
): AgentPerspectiveSubstrateFeedbackLoopImplementation {
  const contract = input.agent_perspective_substrate_feedback_loop_contract;
  const sourceContractRef =
    input.source_contract_ref ??
    `${contract.contract_version}:${defaultContractFixturePath}`;
  const authorityBoundary = {
    ...getImplementationAuthorityBoundary(),
    ...(input.authority_boundary_overrides ?? {}),
  };
  const builtBundle = buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle({
    contract,
    source_contract_ref: sourceContractRef,
    operator_context_ref: input.operator_context_ref,
    feedback_input_preview: input.feedback_input_preview,
    feedback_preview: input.feedback_preview,
    feedback_kinds: input.feedback_kinds,
    feedback_target_kinds: input.feedback_target_kinds,
    feedback_section_families: input.feedback_section_families,
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
  const validatedImplementation: FeedbackLoopValidation = {
    ...builtBundle.validation,
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    top_level_implementation_boundary_is_separate:
      topLevelBoundaryIsSeparate,
    invalid_feedback_preview_override_rejected: true,
    invalid_feedback_kind_override_rejected: true,
    invalid_feedback_target_override_rejected: true,
    invalid_feedback_section_override_rejected: true,
    invalid_forbidden_actions_override_rejected: true,
    invalid_authority_boundary_override_rejected: true,
    invalid_refs_override_rejected: true,
  };
  const implementationWithoutFingerprint = {
    implementation_kind:
      "agent_perspective_substrate_feedback_loop_implementation" as const,
    implementation_version:
      "agent_perspective_substrate_feedback_loop_implementation.v0.1" as const,
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
      contract_feedback_principles_preserved: true,
      contract_feedback_kinds_preserved: true,
      contract_feedback_target_kinds_preserved: true,
      contract_feedback_section_families_preserved: true,
      contract_forbidden_actions_policy_preserved: true,
    },
    deterministic_builder: {
      builder_path: defaultBuilderPath,
      deterministic_fixture_backed_only: true,
      feedback_loop_runtime_build_now: false,
      feedback_event_write_now: false,
      feedback_event_mutation_now: false,
      feedback_event_store_write_now: false,
      agent_substrate_mutation_now: false,
      agent_substrate_execution_now: false,
      salience_write_now: false,
      durable_salience_write_now: false,
      recent_rehearsal_buffer_write_now: false,
      durable_memory_write_now: false,
      linkage_record_write_now: false,
      formation_receipt_write_now: false,
      codex_execution_now: false,
      github_automation_now: false,
      agent_routing_now: false,
      agent_execution_now: false,
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
    built_agent_perspective_substrate_feedback_loop_preview_bundle: builtBundle,
    validated_implementation: validatedImplementation,
    authority_boundary: authorityBoundary,
    recommendation_status:
      "ready_for_agent_perspective_substrate_feedback_loop_browser_validation_v0_1" as const,
    next_recommended_slice:
      "agent_perspective_substrate_feedback_loop_browser_validation_v0_1" as const,
    fingerprint_algorithm: "fnv1a32_canonical_json" as const,
  };
  return {
    ...implementationWithoutFingerprint,
    implementation_fingerprint:
      createAgentPerspectiveSubstrateFeedbackLoopFingerprint(
        implementationWithoutFingerprint,
      ),
  };
}

export function buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle(
  input: BuildPreviewBundleInput,
): AgentPerspectiveSubstrateFeedbackLoopPreviewBundle {
  const sample = asRecord(
    input.contract.sample_agent_perspective_substrate_feedback_loop_preview,
  );
  const feedbackInputPreview = clone(
    input.feedback_input_preview ?? asRecord(sample.feedback_input_preview),
  );
  const feedbackPreview = clone(
    input.feedback_preview ?? asRecord(sample.feedback_preview),
  ) as FeedbackPreview;
  const feedbackKinds = input.feedback_kinds ?? input.contract.feedback_kinds;
  const feedbackTargetKinds =
    input.feedback_target_kinds ?? input.contract.feedback_target_kinds;
  const feedbackSectionFamilies =
    input.feedback_section_families ??
    input.contract.feedback_section_families;
  const forbiddenActionsPolicy =
    input.forbidden_actions_policy ?? input.contract.forbidden_actions_policy;
  const bundleWithoutValidation = {
    preview_version:
      "agent_perspective_substrate_feedback_loop_preview.v0.1" as const,
    source_contract_ref:
      input.source_contract_ref ??
      `${input.contract.contract_version}:${defaultContractFixturePath}`,
    operator_context_ref:
      input.operator_context_ref ?? asString(sample.operator_context_ref),
    feedback_input_preview: feedbackInputPreview,
    feedback_preview: feedbackPreview,
    feedback_principle_summary: buildFeedbackPrincipleSummary(input.contract),
    feedback_kind_summary: buildFeedbackKindSummary(feedbackKinds),
    feedback_target_kind_summary:
      buildFeedbackTargetKindSummary(feedbackTargetKinds),
    feedback_section_family_summary:
      buildFeedbackSectionFamilySummary(feedbackSectionFamilies),
    forbidden_actions_summary:
      buildForbiddenActionsSummary(forbiddenActionsPolicy),
    reference_summary: buildReferenceSummary(
      feedbackInputPreview,
      feedbackPreview,
      input.contract.privacy_policy,
    ),
    authority_boundary: clone(input.contract.authority_boundary),
    validation_policy: clone(input.contract.validation_policy),
    forbidden_actions_policy: clone(forbiddenActionsPolicy),
  };
  return {
    ...bundleWithoutValidation,
    validation: validateAgentPerspectiveSubstrateFeedbackLoopPreviewBundle(
      bundleWithoutValidation,
      input.contract,
      feedbackKinds,
      feedbackTargetKinds,
      feedbackSectionFamilies,
      forbiddenActionsPolicy,
    ),
  };
}

export function validateAgentPerspectiveSubstrateFeedbackLoopPreviewBundle(
  previewBundle: Omit<AgentPerspectiveSubstrateFeedbackLoopPreviewBundle, "validation">,
  contract: FeedbackLoopContractWithFingerprint,
  feedbackKinds: AgentPerspectiveSubstrateFeedbackKindSpec[] =
    contract.feedback_kinds,
  feedbackTargetKinds: AgentPerspectiveSubstrateFeedbackTargetKind[] =
    contract.feedback_target_kinds,
  feedbackSectionFamilies: AgentPerspectiveSubstrateFeedbackSectionFamily[] =
    contract.feedback_section_families,
  forbiddenActionsPolicy: AgentPerspectiveSubstrateFeedbackForbiddenActionsPolicy =
    contract.forbidden_actions_policy,
): FeedbackLoopValidation {
  const failureCodes = new Set<string>();
  const feedback = previewBundle.feedback_preview;
  const referenceValidation = validateReferences(
    previewBundle.feedback_input_preview,
    feedback,
  );

  validateFeedbackPreview(feedback, failureCodes);
  validateFeedbackKinds(feedbackKinds, feedback, failureCodes);
  validateFeedbackTargets(feedbackTargetKinds, feedback, failureCodes);
  validateSectionFamilies(feedbackSectionFamilies, failureCodes);
  validateFeedbackSections(feedback, failureCodes);
  validateForbiddenActions(
    forbiddenActionsPolicy,
    feedback.forbidden_actions,
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
  const feedbackInputFieldsPreserved = deepEqual(
    contract.feedback_input_fields,
    expectedInputFields,
  );
  const feedbackOutputFieldsPreserved = deepEqual(
    contract.feedback_output_fields,
    expectedOutputFields,
  );
  const feedbackPrinciplesPreserved = allTrue(
    contract.feedback_principles as unknown as JsonRecord,
  );
  const feedbackKindsPreserved = validateFeedbackKindContracts(
    contract.feedback_kinds,
  );
  const feedbackTargetKindsPreserved = deepEqual(
    contract.feedback_target_kinds,
    expectedTargetKinds,
  );
  const feedbackSectionFamiliesPreserved =
    validateFeedbackSectionFamilyContracts(contract.feedback_section_families);
  const forbiddenActionsPolicyPreserved = allTrue(
    contract.forbidden_actions_policy as unknown as JsonRecord,
  );
  const principles = contract.feedback_principles;
  const validationPolicy = contract.validation_policy;
  const boundary = previewBundle.authority_boundary;
  const noRuntimeBoundary =
    boundary.feedback_loop_runtime_build_implemented_now === false &&
    boundary.feedback_event_write_now === false &&
    boundary.feedback_event_mutation_now === false &&
    boundary.feedback_event_store_write_now === false &&
    boundary.agent_substrate_mutation_now === false &&
    boundary.agent_substrate_execution_now === false &&
    boundary.salience_write_now === false &&
    boundary.durable_salience_write_now === false &&
    boundary.recent_rehearsal_buffer_written_now === false &&
    boundary.durable_memory_write_now === false &&
    boundary.linkage_record_write_now === false &&
    boundary.formation_receipt_write_now === false &&
    boundary.codex_execution_now === false &&
    boundary.github_automation_now === false &&
    boundary.agent_routing_now === false &&
    boundary.agent_execution_now === false &&
    boundary.provider_openai_call_now === false &&
    boundary.retrieval_rag_execution_now === false &&
    boundary.source_fetch_now === false &&
    boundary.crawler_now === false &&
    boundary.durable_perspective_state_write_now === false &&
    boundary.durable_perspective_delta_apply_now === false &&
    boundary.proof_or_evidence_record_write_now === false &&
    boundary.accepted_evidence_write_now === false &&
    boundary.work_mutation_now === false &&
    boundary.runtime_db_write_now === false &&
    boundary.runtime_db_query_now === false &&
    boundary.feedback_authority === false &&
    boundary.feedback_truth_authority === false &&
    boundary.feedback_promotion_authority === false &&
    boundary.feedback_suppression_authority === false &&
    boundary.feedback_deletion_authority === false &&
    boundary.product_write_authority === false &&
    boundary.product_id_allocation_authority === false;
  const previewBundleFollowsContract =
    previewBundle.preview_version ===
      "agent_perspective_substrate_feedback_loop_preview.v0.1" &&
    hasText(previewBundle.source_contract_ref) &&
    hasText(previewBundle.operator_context_ref) &&
    hasText(feedback.feedback_preview_id) &&
    hasText(feedback.target_ref) &&
    Array.isArray(feedback.source_refs) &&
    feedback.source_refs.length > 0 &&
    previewBoundaryMatchesContract &&
    validationPolicyMatchesContract &&
    forbiddenActionsPolicyMatchesContract &&
    feedbackInputFieldsPreserved &&
    feedbackOutputFieldsPreserved &&
    feedbackPrinciplesPreserved &&
    feedbackKindsPreserved &&
    feedbackTargetKindsPreserved &&
    feedbackSectionFamiliesPreserved &&
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
  const futureSurfacing = asRecord(feedback.future_surfacing_effect_preview);
  const ruleFailure = asRecord(feedback.rule_failure_candidate_preview);
  const followUp = asRecord(feedback.follow_up_candidate_preview);
  const validationWithoutFailureCodes = {
    preview_bundle_follows_contract: previewBundleFollowsContract,
    preview_bundle_authority_boundary_matches_contract:
      previewBoundaryMatchesContract,
    preview_bundle_validation_policy_matches_contract:
      validationPolicyMatchesContract,
    preview_bundle_forbidden_actions_policy_matches_contract:
      forbiddenActionsPolicyMatchesContract,
    top_level_implementation_boundary_is_separate: true,
    feedback_input_fields_preserved: feedbackInputFieldsPreserved,
    feedback_output_fields_preserved: feedbackOutputFieldsPreserved,
    feedback_principles_preserved: feedbackPrinciplesPreserved,
    feedback_kinds_preserved: feedbackKindsPreserved,
    feedback_target_kinds_preserved: feedbackTargetKindsPreserved,
    feedback_section_families_preserved: feedbackSectionFamiliesPreserved,
    forbidden_actions_policy_preserved: forbiddenActionsPolicyPreserved,
    feedback_is_operator_signal_not_truth:
      principles.feedback_is_operator_signal_not_truth === true &&
      asRecord(feedback.feedback_summary)
        .feedback_is_operator_signal_not_truth === true,
    feedback_is_advisory_input_not_execution_authority:
      principles.feedback_is_advisory_input_not_execution_authority === true &&
      asRecord(feedback.feedback_summary)
        .feedback_is_advisory_input_not_execution_authority === true,
    feedback_not_proof_or_evidence:
      principles.feedback_not_proof_or_evidence === true,
    feedback_not_durable_perspective_state:
      principles.feedback_not_durable_perspective_state === true,
    feedback_not_work_status:
      principles.feedback_not_work_status === true,
    feedback_not_product_write:
      principles.feedback_not_product_write === true,
    feedback_does_not_automatically_promote_candidates:
      principles.feedback_does_not_automatically_promote_candidates === true,
    feedback_does_not_automatically_suppress_or_delete_candidates:
      principles.feedback_does_not_automatically_suppress_or_delete_candidates === true,
    dismiss_is_not_deletion: principles.dismiss_is_not_deletion === true,
    pin_is_not_promotion: principles.pin_is_not_promotion === true,
    mark_useful_is_not_truth: principles.mark_useful_is_not_truth === true,
    mark_wrong_is_not_proof_of_falsity:
      principles.mark_wrong_is_not_proof_of_falsity === true,
    needs_more_evidence_is_review_cue_not_retrieval_execution:
      principles.needs_more_evidence_is_review_cue_not_retrieval_execution === true,
    scope_overreach_is_constraint_signal_not_state_mutation:
      principles.scope_overreach_is_constraint_signal_not_state_mutation === true,
    not_relevant_now_is_temporal_context_not_rejection:
      principles.not_relevant_now_is_temporal_context_not_rejection === true,
    user_correction_does_not_mutate_core_state_now:
      principles.user_correction_does_not_mutate_core_state_now === true,
    source_refs_required_for_grounded_targets:
      principles.source_refs_required_for_grounded_targets === true &&
      asArray(feedback.source_refs).length > 0,
    feedback_target_refs_public_safe:
      principles.feedback_target_refs_public_safe === true &&
      referenceValidation.public_safe_refs_only,
    target_kind_preserves_candidate_durable_distinction:
      principles.target_kind_preserves_candidate_durable_distinction === true,
    unresolved_tensions_preserved:
      principles.unresolved_tensions_preserved === true,
    knowledge_gaps_preserved:
      principles.knowledge_gaps_preserved === true,
    future_surfacing_priority_only:
      validationPolicy.future_surfacing_priority_only === true &&
      futureSurfacing.display_priority_effect_only === true &&
      futureSurfacing.not_truth === true &&
      futureSurfacing.not_promotion_authority === true,
    rule_failure_candidate_preview_only:
      validationPolicy.rule_failure_candidate_preview_only === true &&
      ruleFailure.candidate_only === true &&
      ruleFailure.not_proof_or_evidence === true &&
      ruleFailure.not_durable_state === true,
    follow_up_candidate_preview_only:
      validationPolicy.follow_up_candidate_preview_only === true &&
      followUp.candidate_only === true &&
      followUp.not_work_item === true &&
      followUp.not_retrieval_execution === true,
    agent_substrate_folded_derived_advisory_only:
      principles.agent_substrate_folded_derived_advisory_only === true,
    ai_context_packet_context_not_execution_authority:
      principles.ai_context_packet_context_not_execution_authority === true,
    codex_handoff_draft_not_execution_approval:
      principles.codex_handoff_draft_not_execution_approval === true,
    packet_receipt_linkage_provenance_not_completion_proof:
      principles.packet_receipt_linkage_provenance_not_completion_proof === true,
    runtime_feedback_loop_build_not_implemented:
      validationPolicy.no_runtime_feedback_loop_build === true &&
      boundary.feedback_loop_runtime_build_implemented_now === false,
    feedback_event_write_not_implemented:
      validationPolicy.no_feedback_event_write === true &&
      boundary.feedback_event_write_now === false,
    feedback_event_mutation_not_implemented:
      validationPolicy.no_feedback_event_mutation === true &&
      boundary.feedback_event_mutation_now === false,
    agent_substrate_mutation_not_implemented:
      validationPolicy.no_agent_substrate_mutation === true &&
      boundary.agent_substrate_mutation_now === false,
    agent_substrate_execution_not_implemented:
      validationPolicy.no_agent_substrate_execution === true &&
      boundary.agent_substrate_execution_now === false,
    salience_write_not_implemented:
      validationPolicy.no_salience_write === true &&
      boundary.salience_write_now === false,
    durable_salience_write_not_implemented:
      validationPolicy.no_durable_salience_write === true &&
      boundary.durable_salience_write_now === false,
    recent_rehearsal_buffer_write_not_implemented:
      validationPolicy.no_recent_rehearsal_buffer_write === true &&
      boundary.recent_rehearsal_buffer_written_now === false,
    durable_memory_write_not_implemented:
      validationPolicy.no_durable_memory_write === true &&
      boundary.durable_memory_write_now === false,
    linkage_record_write_not_implemented:
      validationPolicy.no_linkage_record_write === true &&
      boundary.linkage_record_write_now === false,
    formation_receipt_write_not_implemented:
      validationPolicy.no_formation_receipt_write === true &&
      boundary.formation_receipt_write_now === false,
    codex_execution_now_false:
      validationPolicy.no_codex_execution === true &&
      boundary.codex_execution_now === false,
    github_automation_now_false:
      validationPolicy.no_github_automation === true &&
      boundary.github_automation_now === false,
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
    invalid_feedback_preview_override_rejected: true,
    invalid_feedback_kind_override_rejected: true,
    invalid_feedback_target_override_rejected: true,
    invalid_feedback_section_override_rejected: true,
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

export function createAgentPerspectiveSubstrateFeedbackLoopFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function buildFeedbackPrincipleSummary(
  contract: AgentPerspectiveSubstrateFeedbackLoopContractFixture,
): JsonRecord {
  return {
    ...clone(contract.feedback_principles),
    feedback_principle_count: Object.keys(contract.feedback_principles).length,
    all_feedback_principles_preserved: allTrue(
      contract.feedback_principles as unknown as JsonRecord,
    ),
  };
}

function buildFeedbackKindSummary(
  kinds: AgentPerspectiveSubstrateFeedbackKindSpec[],
): JsonRecord {
  return {
    feedback_kind_count: kinds.length,
    feedback_kinds: kinds.map((kind) => kind.feedback_kind),
    all_feedback_kinds_preserved: validateFeedbackKindContracts(kinds),
    every_feedback_kind_runtime_write_now_false: kinds.every(
      (kind) => kind.runtime_write_now === false,
    ),
  };
}

function buildFeedbackTargetKindSummary(
  targetKinds: AgentPerspectiveSubstrateFeedbackTargetKind[],
): JsonRecord {
  return {
    feedback_target_kind_count: targetKinds.length,
    feedback_target_kinds: [...targetKinds],
    all_feedback_target_kinds_preserved: deepEqual(
      targetKinds,
      expectedTargetKinds,
    ),
  };
}

function buildFeedbackSectionFamilySummary(
  families: AgentPerspectiveSubstrateFeedbackSectionFamily[],
): JsonRecord {
  return {
    feedback_section_family_count: families.length,
    section_kinds: families.map((family) => family.section_kind),
    all_feedback_section_families_preserved:
      validateFeedbackSectionFamilyContracts(families),
    every_section_runtime_write_now_false: families.every(
      (family) => family.runtime_write_now === false,
    ),
  };
}

function buildForbiddenActionsSummary(
  policy: AgentPerspectiveSubstrateFeedbackForbiddenActionsPolicy,
): JsonRecord {
  return {
    forbidden_action_count: Object.keys(policy).length,
    all_forbidden_actions_preserved: allTrue(policy as unknown as JsonRecord),
    no_feedback_event_write: policy.no_feedback_event_write,
    no_agent_substrate_mutation: policy.no_agent_substrate_mutation,
    no_product_write_from_feedback: policy.no_product_write_from_feedback,
  };
}

function buildReferenceSummary(
  inputPreview: JsonRecord,
  feedback: FeedbackPreview,
  privacyPolicy: AgentPerspectiveSubstrateFeedbackPrivacyPolicy,
): JsonRecord {
  const referenceValidation = validateReferences(inputPreview, feedback);
  return {
    ...referenceValidation,
    privacy_policy_preserved: allTrue(
      privacyPolicy as unknown as JsonRecord,
    ),
    source_ref_count: asArray(feedback.source_refs).length,
    target_ref: feedback.target_ref,
    target_kind: feedback.target_kind,
    feedback_kind: feedback.feedback_kind,
  };
}

function validateFeedbackPreview(
  feedback: FeedbackPreview,
  failureCodes: Set<string>,
) {
  if (!hasText(feedback.feedback_preview_id)) {
    failureCodes.add("feedback_preview_missing_feedback_preview_id");
  }
  if (asArray(feedback.source_refs).length === 0) {
    failureCodes.add("feedback_preview_missing_source_refs");
  }
  if (feedback.all_runtime_write_now_false !== true) {
    failureCodes.add("feedback_preview_runtime_write_enabled");
  }
  if (feedback.all_sections_public_safe !== true) {
    failureCodes.add("feedback_preview_not_public_safe");
  }
  if (!feedback.authority_boundary) {
    failureCodes.add("feedback_preview_missing_authority_boundary");
  }
  if (asArray(feedback.forbidden_actions).length === 0) {
    failureCodes.add("feedback_preview_missing_forbidden_actions");
  }
  if (asArray(feedback.stop_conditions).length === 0) {
    failureCodes.add("feedback_preview_missing_stop_conditions");
  }
  if (flagEnabled(feedback, "feedback_truth_authority")) {
    failureCodes.add("feedback_preview_truth_authority_enabled");
  }
  if (flagEnabled(feedback, "feedback_promotion_authority")) {
    failureCodes.add("feedback_preview_promotion_authority_enabled");
  }
  if (flagEnabled(feedback, "feedback_event_write_now")) {
    failureCodes.add("feedback_preview_feedback_event_write_enabled");
  }
  if (flagEnabled(feedback, "agent_substrate_mutation_now")) {
    failureCodes.add("feedback_preview_agent_substrate_mutation_enabled");
  }
  if (flagEnabled(feedback, "salience_write_now")) {
    failureCodes.add("feedback_preview_salience_write_enabled");
  }
}

function validateFeedbackKinds(
  kinds: AgentPerspectiveSubstrateFeedbackKindSpec[],
  feedback: FeedbackPreview,
  failureCodes: Set<string>,
) {
  const knownKinds = new Set(expectedFeedbackKinds);
  if (!knownKinds.has(asString(feedback.feedback_kind) as AgentPerspectiveSubstrateFeedbackKind)) {
    failureCodes.add("feedback_kind_unknown");
  }
  for (const kind of kinds) {
    const record = kind as unknown as JsonRecord;
    const feedbackKind = asString(record.feedback_kind);
    if (!knownKinds.has(feedbackKind as AgentPerspectiveSubstrateFeedbackKind)) {
      failureCodes.add("feedback_kind_unknown");
    }
    if (record.runtime_write_now !== false) {
      failureCodes.add("feedback_kind_runtime_write_enabled");
    }
    if (feedbackKind === "dismiss" && record.dismiss_is_not_deletion !== true) {
      failureCodes.add("dismiss_deletion_enabled");
    }
    if (feedbackKind === "pin" && record.pin_is_not_promotion !== true) {
      failureCodes.add("pin_promotion_enabled");
    }
    if (feedbackKind === "mark_useful" && record.mark_useful_is_not_truth !== true) {
      failureCodes.add("mark_useful_truth_enabled");
    }
    if (feedbackKind === "mark_wrong" && record.mark_wrong_is_not_proof_of_falsity !== true) {
      failureCodes.add("mark_wrong_falsity_enabled");
    }
    if (
      feedbackKind === "needs_more_evidence" &&
      record.review_cue_not_retrieval_execution !== true
    ) {
      failureCodes.add("needs_more_evidence_retrieval_execution_enabled");
    }
    if (
      feedbackKind === "scope_overreach" &&
      record.constraint_signal_not_state_mutation !== true
    ) {
      failureCodes.add("scope_overreach_state_mutation_enabled");
    }
    if (
      feedbackKind === "not_relevant_now" &&
      record.temporal_context_not_rejection !== true
    ) {
      failureCodes.add("not_relevant_now_rejection_enabled");
    }
    if (
      feedbackKind === "correct" &&
      record.does_not_mutate_core_state_now !== true
    ) {
      failureCodes.add("correct_core_state_mutation_enabled");
    }
  }
}

function validateFeedbackTargets(
  targetKinds: AgentPerspectiveSubstrateFeedbackTargetKind[],
  feedback: FeedbackPreview,
  failureCodes: Set<string>,
) {
  const targetKind = asString(feedback.target_kind);
  if (!hasText(feedback.target_ref)) {
    failureCodes.add("feedback_target_missing_target_ref");
  }
  if (!targetKind) {
    failureCodes.add("feedback_target_missing_target_kind");
  }
  if (
    targetKind &&
    !targetKinds.includes(targetKind as AgentPerspectiveSubstrateFeedbackTargetKind)
  ) {
    failureCodes.add("feedback_target_unknown_kind");
  }
  if (!deepEqual(targetKinds, expectedTargetKinds)) {
    failureCodes.add("feedback_target_unknown_kind");
  }
  if (!hasPublicSafeRef(feedback.target_ref)) {
    failureCodes.add("feedback_target_private_or_unstable_ref");
  }
  if (
    flagEnabled(feedback, "durable_state") ||
    flagEnabled(feedback, "proof_or_evidence") ||
    flagEnabled(feedback, "candidate_durable_distinction_lost")
  ) {
    failureCodes.add("feedback_target_candidate_durable_distinction_lost");
  }
  if (asArray(feedback.source_refs).length === 0) {
    failureCodes.add("feedback_target_missing_source_refs_for_grounded_target");
  }
}

function validateSectionFamilies(
  families: AgentPerspectiveSubstrateFeedbackSectionFamily[],
  failureCodes: Set<string>,
) {
  const knownKinds = new Set(expectedSectionKinds);
  for (const family of families) {
    const familyRecord = family as unknown as JsonRecord;
    const sectionKind = asString(familyRecord.section_kind);
    if (!sectionKind) {
      failureCodes.add("feedback_section_missing_section_kind");
      continue;
    }
    if (!knownKinds.has(sectionKind as AgentPerspectiveSubstrateFeedbackSectionKind)) {
      failureCodes.add("feedback_section_unknown_section_kind");
    }
    if (familyRecord.runtime_write_now !== false) {
      failureCodes.add("feedback_section_runtime_write_enabled");
    }
    if (
      sectionKind === "future_surfacing_effect_preview" &&
      familyRecord.not_truth !== true
    ) {
      failureCodes.add("future_surfacing_effect_truth_enabled");
    }
    if (
      sectionKind === "future_surfacing_effect_preview" &&
      familyRecord.not_promotion_authority !== true
    ) {
      failureCodes.add("future_surfacing_effect_promotion_authority_enabled");
    }
    if (
      sectionKind === "rule_failure_candidate_preview" &&
      familyRecord.not_proof_or_evidence !== true
    ) {
      failureCodes.add("rule_failure_candidate_proof_or_evidence_enabled");
    }
    if (
      sectionKind === "rule_failure_candidate_preview" &&
      familyRecord.not_durable_state !== true
    ) {
      failureCodes.add("rule_failure_candidate_durable_state_enabled");
    }
    if (
      sectionKind === "follow_up_candidate_preview" &&
      familyRecord.not_work_item !== true
    ) {
      failureCodes.add("follow_up_candidate_work_item_enabled");
    }
    if (
      sectionKind === "follow_up_candidate_preview" &&
      familyRecord.not_retrieval_execution !== true
    ) {
      failureCodes.add("follow_up_candidate_retrieval_execution_enabled");
    }
    if (
      sectionKind === "authority_boundary" &&
      familyRecord.execution_authority_false !== true
    ) {
      failureCodes.add("authority_boundary_section_execution_enabled");
    }
  }
}

function validateFeedbackSections(
  feedback: FeedbackPreview,
  failureCodes: Set<string>,
) {
  const futureSurfacing = asRecord(feedback.future_surfacing_effect_preview);
  const ruleFailure = asRecord(feedback.rule_failure_candidate_preview);
  const followUp = asRecord(feedback.follow_up_candidate_preview);
  if (futureSurfacing.not_truth !== true) {
    failureCodes.add("future_surfacing_effect_truth_enabled");
  }
  if (futureSurfacing.not_promotion_authority !== true) {
    failureCodes.add("future_surfacing_effect_promotion_authority_enabled");
  }
  if (ruleFailure.not_proof_or_evidence !== true) {
    failureCodes.add("rule_failure_candidate_proof_or_evidence_enabled");
  }
  if (ruleFailure.not_durable_state !== true) {
    failureCodes.add("rule_failure_candidate_durable_state_enabled");
  }
  if (followUp.not_work_item !== true) {
    failureCodes.add("follow_up_candidate_work_item_enabled");
  }
  if (followUp.not_retrieval_execution !== true) {
    failureCodes.add("follow_up_candidate_retrieval_execution_enabled");
  }
  if (flagEnabled(asRecord(feedback.authority_boundary), "execution_authority")) {
    failureCodes.add("authority_boundary_section_execution_enabled");
  }
}

function validateForbiddenActions(
  policy: AgentPerspectiveSubstrateFeedbackForbiddenActionsPolicy,
  feedbackActions: unknown,
  failureCodes: Set<string>,
) {
  const actions = new Set(asArray(feedbackActions).filter(isString));
  const required: [
    keyof AgentPerspectiveSubstrateFeedbackForbiddenActionsPolicy,
    string,
    string,
    boolean,
  ][] = [
    ["no_feedback_event_write", "no_feedback_event_write", "forbidden_action_missing_no_feedback_event_write", true],
    ["no_feedback_event_mutation", "no_feedback_event_mutation", "forbidden_action_missing_no_feedback_event_mutation", false],
    ["no_agent_substrate_mutation", "no_agent_substrate_mutation", "forbidden_action_missing_no_agent_substrate_mutation", true],
    ["no_salience_write", "no_salience_write", "forbidden_action_missing_no_salience_write", true],
    ["no_durable_memory_write", "no_durable_memory_write", "forbidden_action_missing_no_durable_memory_write", true],
    ["no_provider_openai_call_from_feedback", "no_provider_openai_call_from_feedback", "forbidden_action_missing_no_provider_openai_call", true],
    ["no_retrieval_rag_execution_from_feedback", "no_retrieval_rag_execution_from_feedback", "forbidden_action_missing_no_retrieval_rag_execution", true],
    ["no_db_write_or_query_from_feedback", "no_db_write_or_query_from_feedback", "forbidden_action_missing_no_db_write_or_query", true],
    ["no_perspective_promotion_from_feedback", "no_perspective_promotion_from_feedback", "forbidden_action_missing_no_perspective_promotion", true],
    ["no_product_write_from_feedback", "no_product_write_from_feedback", "forbidden_action_missing_no_product_write", true],
  ];
  for (const [policyKey, action, failureCode, listedInPreview] of required) {
    if (policy[policyKey] !== true || (listedInPreview && !actions.has(action))) {
      failureCodes.add(failureCode);
    }
  }
}

function validateContractAuthorityBoundary(
  boundary: AgentPerspectiveSubstrateFeedbackAuthorityBoundary,
  failureCodes: Set<string>,
) {
  const checks: [keyof AgentPerspectiveSubstrateFeedbackAuthorityBoundary, string][] = [
    ["feedback_loop_runtime_build_implemented_now", "feedback_loop_runtime_build_enabled"],
    ["feedback_event_write_now", "feedback_event_write_enabled"],
    ["feedback_event_mutation_now", "feedback_event_mutation_enabled"],
    ["feedback_event_store_write_now", "feedback_event_store_write_enabled"],
    ["agent_substrate_mutation_now", "agent_substrate_mutation_enabled"],
    ["agent_substrate_execution_now", "agent_substrate_execution_enabled"],
    ["salience_write_now", "salience_write_enabled"],
    ["durable_salience_write_now", "durable_salience_write_enabled"],
    ["recent_rehearsal_buffer_written_now", "recent_rehearsal_buffer_write_enabled"],
    ["durable_memory_write_now", "durable_memory_write_enabled"],
    ["linkage_record_write_now", "linkage_record_write_enabled"],
    ["formation_receipt_write_now", "formation_receipt_write_enabled"],
    ["codex_execution_now", "codex_execution_enabled"],
    ["github_automation_now", "github_automation_enabled"],
    ["agent_routing_now", "agent_routing_enabled"],
    ["agent_execution_now", "agent_execution_enabled"],
    ["provider_openai_call_now", "provider_openai_call_enabled"],
    ["retrieval_rag_execution_now", "retrieval_rag_execution_enabled"],
    ["durable_perspective_state_write_now", "durable_perspective_state_write_enabled"],
    ["durable_perspective_delta_apply_now", "durable_perspective_delta_apply_enabled"],
    ["proof_or_evidence_record_write_now", "proof_or_evidence_record_write_enabled"],
    ["accepted_evidence_write_now", "accepted_evidence_write_enabled"],
    ["work_mutation_now", "work_mutation_enabled"],
    ["runtime_db_query_now", "runtime_db_query_enabled"],
    ["runtime_db_write_now", "runtime_db_write_enabled"],
    ["feedback_authority", "feedback_authority_enabled"],
    ["feedback_truth_authority", "feedback_truth_authority_enabled"],
    ["feedback_promotion_authority", "feedback_promotion_authority_enabled"],
    ["feedback_suppression_authority", "feedback_suppression_authority_enabled"],
    ["feedback_deletion_authority", "feedback_deletion_authority_enabled"],
    ["mark_useful_truth_authority", "mark_useful_truth_authority_enabled"],
    ["mark_wrong_falsity_authority", "mark_wrong_falsity_authority_enabled"],
    ["pin_promotion_authority", "pin_promotion_authority_enabled"],
    ["dismiss_deletion_authority", "dismiss_deletion_authority_enabled"],
    ["scope_overreach_state_mutation_authority", "scope_overreach_state_mutation_authority_enabled"],
    ["needs_more_evidence_retrieval_authority", "needs_more_evidence_retrieval_authority_enabled"],
    ["product_write_authority", "product_write_enabled"],
    ["product_id_allocation_authority", "product_id_allocation_enabled"],
  ];
  for (const [key, failureCode] of checks) {
    if (boundary[key] !== false) failureCodes.add(failureCode);
  }
}

function validateImplementationAuthorityBoundary(
  boundary: ImplementationAuthorityBoundary,
): string[] {
  const failureCodes = new Set<string>();
  const checks: [keyof ImplementationAuthorityBoundary, string][] = [
    ["feedback_loop_runtime_build_implemented_now", "feedback_loop_runtime_build_enabled"],
    ["feedback_event_write_now", "feedback_event_write_enabled"],
    ["feedback_event_mutation_now", "feedback_event_mutation_enabled"],
    ["feedback_event_store_write_now", "feedback_event_store_write_enabled"],
    ["agent_substrate_mutation_now", "agent_substrate_mutation_enabled"],
    ["agent_substrate_execution_now", "agent_substrate_execution_enabled"],
    ["salience_write_now", "salience_write_enabled"],
    ["durable_salience_write_now", "durable_salience_write_enabled"],
    ["recent_rehearsal_buffer_write_now", "recent_rehearsal_buffer_write_enabled"],
    ["durable_memory_write_now", "durable_memory_write_enabled"],
    ["linkage_record_write_now", "linkage_record_write_enabled"],
    ["formation_receipt_write_now", "formation_receipt_write_enabled"],
    ["codex_execution_now", "codex_execution_enabled"],
    ["github_automation_now", "github_automation_enabled"],
    ["agent_routing_now", "agent_routing_enabled"],
    ["agent_execution_now", "agent_execution_enabled"],
    ["provider_openai_call_now", "provider_openai_call_enabled"],
    ["retrieval_rag_execution_now", "retrieval_rag_execution_enabled"],
    ["durable_perspective_state_write_now", "durable_perspective_state_write_enabled"],
    ["durable_perspective_delta_apply_now", "durable_perspective_delta_apply_enabled"],
    ["proof_or_evidence_record_write_now", "proof_or_evidence_record_write_enabled"],
    ["accepted_evidence_write_now", "accepted_evidence_write_enabled"],
    ["work_mutation_now", "work_mutation_enabled"],
    ["runtime_db_query_now", "runtime_db_query_enabled"],
    ["runtime_db_write_now", "runtime_db_write_enabled"],
    ["feedback_authority", "feedback_authority_enabled"],
    ["feedback_truth_authority", "feedback_truth_authority_enabled"],
    ["feedback_promotion_authority", "feedback_promotion_authority_enabled"],
    ["feedback_suppression_authority", "feedback_suppression_authority_enabled"],
    ["feedback_deletion_authority", "feedback_deletion_authority_enabled"],
    ["mark_useful_truth_authority", "mark_useful_truth_authority_enabled"],
    ["mark_wrong_falsity_authority", "mark_wrong_falsity_authority_enabled"],
    ["pin_promotion_authority", "pin_promotion_authority_enabled"],
    ["dismiss_deletion_authority", "dismiss_deletion_authority_enabled"],
    ["scope_overreach_state_mutation_authority", "scope_overreach_state_mutation_authority_enabled"],
    ["needs_more_evidence_retrieval_authority", "needs_more_evidence_retrieval_authority_enabled"],
    ["product_write_authority", "product_write_enabled"],
    ["product_id_allocation_authority", "product_id_allocation_enabled"],
  ];
  for (const [key, failureCode] of checks) {
    if (boundary[key] !== false) failureCodes.add(failureCode);
  }
  if (boundary.contract_changed_now !== false) {
    failureCodes.add("contract_changed_enabled");
  }
  return uniqueSorted(Array.from(failureCodes));
}

function validateReferences(inputPreview: JsonRecord, feedback: FeedbackPreview) {
  const failureCodes = new Set<string>();
  const allStrings: string[] = [];
  visit({ inputPreview, feedback }, (_key, value) => {
    if (typeof value === "string") allStrings.push(value);
  });
  if (!hasText(feedback.feedback_preview_id)) {
    failureCodes.add("feedback_preview_id_missing");
  }
  if (asArray(feedback.source_refs).length === 0) {
    failureCodes.add("source_refs_missing");
    failureCodes.add("grounded_target_missing_source_refs");
  }
  visit({ inputPreview, feedback }, (key, value) => {
    if (
      typeof value === "string" &&
      (key.endsWith("_ref") ||
        key.endsWith("_refs") ||
        key === "source_refs" ||
        key === "target_ref" ||
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
  return {
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
    failure_codes: uniqueSorted(Array.from(failureCodes)),
  };
}

function validateFeedbackKindContracts(
  kinds: AgentPerspectiveSubstrateFeedbackKindSpec[],
): boolean {
  const byKind = new Map(kinds.map((kind) => [kind.feedback_kind, kind]));
  return (
    deepEqual(
      kinds.map((kind) => kind.feedback_kind),
      expectedFeedbackKinds,
    ) &&
    kinds.every((kind) => kind.runtime_write_now === false) &&
    byKind.get("dismiss")?.dismiss_is_not_deletion === true &&
    byKind.get("pin")?.pin_is_not_promotion === true &&
    byKind.get("mark_wrong")?.mark_wrong_is_not_proof_of_falsity === true &&
    byKind.get("mark_useful")?.mark_useful_is_not_truth === true &&
    byKind.get("needs_more_evidence")?.review_cue_not_retrieval_execution === true &&
    byKind.get("scope_overreach")?.constraint_signal_not_state_mutation === true &&
    byKind.get("not_relevant_now")?.temporal_context_not_rejection === true &&
    byKind.get("correct")?.does_not_mutate_core_state_now === true
  );
}

function validateFeedbackSectionFamilyContracts(
  families: AgentPerspectiveSubstrateFeedbackSectionFamily[],
): boolean {
  const byKind = new Map(families.map((family) => [family.section_kind, family]));
  return (
    deepEqual(
      families.map((family) => family.section_kind),
      expectedSectionKinds,
    ) &&
    families.every((family) => family.runtime_write_now === false) &&
    byKind.get("feedback_target")?.target_ref_public_safe === true &&
    byKind.get("feedback_target")?.preserves_candidate_durable_distinction === true &&
    byKind.get("operator_feedback")?.public_safe_summary_required === true &&
    byKind.get("future_surfacing_effect_preview")?.display_priority_effect_only === true &&
    byKind.get("future_surfacing_effect_preview")?.not_truth === true &&
    byKind.get("future_surfacing_effect_preview")?.not_promotion_authority === true &&
    byKind.get("rule_failure_candidate_preview")?.candidate_only === true &&
    byKind.get("rule_failure_candidate_preview")?.not_proof_or_evidence === true &&
    byKind.get("rule_failure_candidate_preview")?.not_durable_state === true &&
    byKind.get("follow_up_candidate_preview")?.candidate_only === true &&
    byKind.get("follow_up_candidate_preview")?.not_work_item === true &&
    byKind.get("follow_up_candidate_preview")?.not_retrieval_execution === true &&
    byKind.get("authority_boundary")?.execution_authority_false === true &&
    byKind.get("forbidden_actions")?.must_include_feedback_write_ban === true &&
    byKind.get("stop_conditions")?.stop_conditions_are_safety_constraints === true
  );
}

function getImplementationAuthorityBoundary(): ImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    deterministic_builder_added_now: true,
    contract_changed_now: false,
    feedback_loop_runtime_build_implemented_now: false,
    feedback_event_write_now: false,
    feedback_event_mutation_now: false,
    feedback_event_store_write_now: false,
    agent_substrate_mutation_now: false,
    agent_substrate_execution_now: false,
    salience_write_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_write_now: false,
    durable_memory_write_now: false,
    linkage_record_write_now: false,
    formation_receipt_write_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    github_pr_creation_now: false,
    git_branch_creation_now: false,
    git_commit_creation_now: false,
    external_handoff_sending_now: false,
    agent_routing_now: false,
    agent_execution_now: false,
    provider_openai_call_now: false,
    provider_extraction_now: false,
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
    feedback_authority: false,
    feedback_truth_authority: false,
    feedback_promotion_authority: false,
    feedback_suppression_authority: false,
    feedback_deletion_authority: false,
    mark_useful_truth_authority: false,
    mark_wrong_falsity_authority: false,
    pin_promotion_authority: false,
    dismiss_deletion_authority: false,
    scope_overreach_state_mutation_authority: false,
    needs_more_evidence_retrieval_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    agent_routing_authority: false,
    agent_execution_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    salience_authority: false,
    ai_context_packet_authority: false,
    codex_handoff_draft_authority: false,
    linkage_authority: false,
    receipt_completion_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripGeneratedFields);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "implementation_fingerprint")
        .map(([key, entry]) => [key, stripGeneratedFields(entry)]),
    );
  }
  return value;
}

function publicSafeRefOrHint(key: string, value: string): boolean {
  if (key === "file_path" || key === "check_ref") return !value.startsWith("/");
  return (
    value.includes(":public:") ||
    value.startsWith("node --check ") ||
    value.startsWith("npm run ") ||
    value.startsWith("types/") ||
    value.startsWith("fixtures/") ||
    value.startsWith("scripts/")
  );
}

function hasPublicSafeRef(value: unknown): boolean {
  return typeof value === "string" && publicSafeRefOrHint("target_ref", value);
}

function flagEnabled(record: JsonRecord, key: string): boolean {
  return record[key] === true;
}

function allTrue(record: JsonRecord): boolean {
  return Object.values(record).every((value) => value === true);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
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

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
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

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as JsonRecord)[key])}`)
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
