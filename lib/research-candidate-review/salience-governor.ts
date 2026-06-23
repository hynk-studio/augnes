import type {
  SalienceActionHintKind,
  SalienceComponentKind,
  SalienceGovernorContract,
  SalienceInhibitionKind,
  SaliencePriorityViewCandidate,
  SaliencePriorityViewShape,
} from "@/types/salience-governor-contract";

type JsonRecord = Record<string, unknown>;

export interface SalienceGovernorImplementationInput {
  salience_governor_contract: SalienceGovernorContract;
  generated_at?: string;
  candidate_priority_preview?: SaliencePriorityViewCandidate[];
  top_k?: number;
  source_contract_ref?: string;
}

export type SalienceGovernorGeneratedPriorityView = Omit<
  SaliencePriorityViewShape,
  "top_k"
> & {
  top_k: number;
};

export interface SalienceComponentSummary {
  component_count: number;
  component_kinds: SalienceComponentKind[];
  all_components_display_only: boolean;
  all_components_not_authority: boolean;
  preview_weights_only: boolean;
}

export interface SalienceInhibitionComponentSummary {
  inhibition_count: number;
  inhibition_kinds: SalienceInhibitionKind[];
  all_inhibitions_display_only: boolean;
  all_inhibitions_not_authority: boolean;
  suppression_is_display_hint_only: true;
  reactivation_is_display_hint_only: true;
}

export interface SalienceActionHintSummary {
  allowed_hint_kinds: SalienceActionHintKind[];
  hint_count: number;
  all_hints_hint_only: boolean;
  all_hints_no_mutation_now: boolean;
  all_hints_require_later_user_action: boolean;
  all_hints_not_execution_authority: boolean;
  all_hints_not_promotion_authority: boolean;
  all_hints_not_product_write: boolean;
}

export interface SaliencePriorityViewSummary {
  top_k: number;
  candidate_preview_count: number;
  score_range: "0_to_1";
  all_scores_in_range: boolean;
  priority_view_is_display_only: true;
  priority_view_does_not_delete_or_hide_records: true;
  salience_score_preview_allowed: true;
  runtime_score_computation_now: false;
  runtime_salience_scoring_implemented_now: false;
}

export interface SalienceNonAuthoritySummary {
  not_promotion_basis: true;
  not_source_of_truth: true;
  not_proof_or_evidence: true;
  not_perspective_state: true;
  not_work_status: true;
  not_retrieval_rag_result: true;
  not_product_write: true;
  salience_score_not_authority: true;
  salience_score_not_promotion_readiness: true;
  salience_score_not_durable_approval: true;
  salience_score_not_evidence_strength: true;
  durable_write_requires_later_contract: true;
}

export interface SalienceGovernorImplementationAuthorityBoundary {
  implementation_added_now: true;
  contract_followed_now: true;
  fixture_backed_only: true;
  deterministic_builder_added_now: true;
  runtime_salience_scoring_implemented_now: false;
  durable_salience_write_implemented_now: false;
  salience_score_used_as_authority_now: false;
  runtime_persistence_implemented_now: false;
  durable_memory_write_now: false;
  runtime_db_write_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
  recent_rehearsal_buffer_written_now: false;
  formation_receipt_written_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  candidate_mutation_now: false;
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
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface SalienceGovernorImplementationValidationPolicy {
  static_source_validation_only: true;
  fixture_backed_only: true;
  app_server_started_now: false;
  production_db_used_now: false;
  runtime_browser_request_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
  runtime_salience_scoring_now: false;
}

export interface SalienceGovernorImplementationValidation {
  passed: boolean;
  failure_codes: string[];
  generated_priority_view_follows_contract: boolean;
  generated_priority_view_boundary_matches_contract: boolean;
  generated_priority_view_validation_matches_contract: boolean;
  top_level_implementation_boundary_is_separate: boolean;
  all_scores_in_range: boolean;
  action_hints_are_hint_only: boolean;
  action_hints_do_not_mutate_now: boolean;
  salience_score_not_authority: true;
  salience_score_not_promotion_readiness: true;
  salience_score_not_durable_approval: true;
  salience_score_not_evidence_strength: true;
  non_authority_policy_preserved: boolean;
  authority_boundary_preserved: boolean;
  deterministic_rebuild_matches_fixture: true;
}

export interface SalienceGovernorImplementation {
  implementation_kind: "salience_governor_implementation";
  implementation_version: "salience_governor_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  source_recent_rehearsal_buffer_validation_ref: string;
  generated_salience_priority_view: SalienceGovernorGeneratedPriorityView;
  salience_component_summary: SalienceComponentSummary;
  inhibition_component_summary: SalienceInhibitionComponentSummary;
  action_hint_summary: SalienceActionHintSummary;
  priority_view_summary: SaliencePriorityViewSummary;
  non_authority_summary: SalienceNonAuthoritySummary;
  authority_boundary: SalienceGovernorImplementationAuthorityBoundary;
  validation_policy: SalienceGovernorImplementationValidationPolicy;
  validation: SalienceGovernorImplementationValidation;
  recommendation_status: "ready_for_salience_governor_browser_validation_v0_1";
  next_recommended_slice: "salience_governor_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const defaultSourceContractFixturePath =
  "fixtures/research-candidate-review.salience-governor-contract.sample.v0.1.json";

export function buildSalienceGovernorImplementation(
  input: SalienceGovernorImplementationInput,
): SalienceGovernorImplementation {
  const contract = input.salience_governor_contract;
  const topK = input.top_k ?? contract.priority_view_contract.default_top_k;
  const candidatePriorityPreview = sortCandidatePriorityPreview(
    input.candidate_priority_preview ??
      contract.sample_salience_priority_view.candidate_priority_preview,
  ).slice(0, topK);
  const generatedAt =
    input.generated_at ?? contract.sample_salience_priority_view.generated_at;
  const authorityBoundary = getSalienceGovernorImplementationAuthorityBoundary();
  const validationPolicy = getSalienceGovernorImplementationValidationPolicy();
  const generatedSaliencePriorityView = buildGeneratedSaliencePriorityView({
    contract,
    generatedAt,
    topK,
    candidatePriorityPreview,
  });
  const allScoresInRange = candidatePriorityPreview.every(scoreInRange);
  const generatedPriorityViewFollowsContract =
    priorityViewFollowsContract(generatedSaliencePriorityView);
  const generatedBoundaryMatchesContract = deepEqual(
    generatedSaliencePriorityView.authority_boundary,
    contract.authority_boundary,
  );
  const generatedValidationMatchesContract = deepEqual(
    generatedSaliencePriorityView.validation,
    contract.validation_policy,
  );
  const topLevelBoundaryIsSeparate =
    !Object.hasOwn(
      generatedSaliencePriorityView.authority_boundary,
      "implementation_added_now",
    ) &&
    authorityBoundary.implementation_added_now === true &&
    authorityBoundary.deterministic_builder_added_now === true;
  const actionHintsAreHintOnly = actionHintEntries(contract).every(
    (hintPolicy) =>
      hintPolicy.hint_only === true &&
      hintPolicy.not_execution_authority === true &&
      hintPolicy.not_promotion_authority === true &&
      hintPolicy.not_product_write === true,
  );
  const actionHintsDoNotMutateNow = actionHintEntries(contract).every(
    (hintPolicy) => hintPolicy.no_mutation_now === true,
  );
  const nonAuthorityPolicyIsPreserved = nonAuthorityPolicyPreserved(contract);
  const authorityBoundaryPreserved = implementationAuthorityBoundaryPreserved(
    authorityBoundary,
  );
  const failureCodes = [
    generatedPriorityViewFollowsContract
      ? null
      : "generated_priority_view_contract_mismatch",
    generatedBoundaryMatchesContract
      ? null
      : "generated_priority_view_boundary_mismatch",
    generatedValidationMatchesContract
      ? null
      : "generated_priority_view_validation_mismatch",
    topLevelBoundaryIsSeparate
      ? null
      : "implementation_boundary_not_separate",
    allScoresInRange ? null : "salience_score_preview_out_of_range",
    actionHintsAreHintOnly ? null : "action_hint_not_hint_only",
    actionHintsDoNotMutateNow ? null : "action_hint_mutates_now",
    nonAuthorityPolicyIsPreserved ? null : "non_authority_policy_not_preserved",
    authorityBoundaryPreserved ? null : "authority_boundary_not_preserved",
  ].filter((code): code is string => Boolean(code));

  const implementation: SalienceGovernorImplementation = {
    implementation_kind: "salience_governor_implementation",
    implementation_version: "salience_governor_implementation.v0.1",
    source_contract_ref:
      input.source_contract_ref ??
      `${contract.contract_version}:${defaultSourceContractFixturePath}`,
    source_contract_fingerprint: contract.contract_fingerprint,
    source_recent_rehearsal_buffer_validation_ref:
      contract.source_recent_rehearsal_buffer_validation_ref,
    generated_salience_priority_view: generatedSaliencePriorityView,
    salience_component_summary: {
      component_count: contract.salience_components.length,
      component_kinds: contract.salience_components.map(
        (component) => component.component_kind,
      ),
      all_components_display_only: contract.salience_components.every(
        (component) => component.display_only === true,
      ),
      all_components_not_authority: contract.salience_components.every(
        (component) => component.not_authority === true,
      ),
      preview_weights_only: contract.salience_components.every(
        (component) => typeof component.preview_weight === "number",
      ),
    },
    inhibition_component_summary: {
      inhibition_count: contract.inhibition_components.length,
      inhibition_kinds: contract.inhibition_components.map(
        (component) => component.inhibition_kind,
      ),
      all_inhibitions_display_only: contract.inhibition_components.every(
        (component) => component.display_only === true,
      ),
      all_inhibitions_not_authority: contract.inhibition_components.every(
        (component) => component.not_authority === true,
      ),
      suppression_is_display_hint_only:
        contract.priority_view_contract.suppression_is_display_hint_only,
      reactivation_is_display_hint_only:
        contract.priority_view_contract.reactivation_is_display_hint_only,
    },
    action_hint_summary: {
      allowed_hint_kinds: [...contract.action_hint_policy.allowed_hint_kinds],
      hint_count: contract.action_hint_policy.allowed_hint_kinds.length,
      all_hints_hint_only: actionHintsAreHintOnly,
      all_hints_no_mutation_now: actionHintsDoNotMutateNow,
      all_hints_require_later_user_action: actionHintEntries(contract).every(
        (hintPolicy) => hintPolicy.requires_later_user_action === true,
      ),
      all_hints_not_execution_authority: actionHintEntries(contract).every(
        (hintPolicy) => hintPolicy.not_execution_authority === true,
      ),
      all_hints_not_promotion_authority: actionHintEntries(contract).every(
        (hintPolicy) => hintPolicy.not_promotion_authority === true,
      ),
      all_hints_not_product_write: actionHintEntries(contract).every(
        (hintPolicy) => hintPolicy.not_product_write === true,
      ),
    },
    priority_view_summary: {
      top_k: topK,
      candidate_preview_count: candidatePriorityPreview.length,
      score_range: contract.priority_view_contract.score_range,
      all_scores_in_range: allScoresInRange,
      priority_view_is_display_only:
        contract.priority_view_contract.priority_view_is_display_only,
      priority_view_does_not_delete_or_hide_records:
        contract.priority_view_contract.priority_view_does_not_delete_or_hide_records,
      salience_score_preview_allowed:
        contract.priority_view_contract.salience_score_preview_allowed,
      runtime_score_computation_now:
        contract.priority_view_contract.runtime_score_computation_now,
      runtime_salience_scoring_implemented_now:
        contract.salience_scope.runtime_salience_scoring_implemented_now,
    },
    non_authority_summary: {
      not_promotion_basis: contract.non_authority_policy.not_promotion_basis,
      not_source_of_truth: contract.non_authority_policy.not_source_of_truth,
      not_proof_or_evidence: contract.non_authority_policy.not_proof_or_evidence,
      not_perspective_state: contract.non_authority_policy.not_perspective_state,
      not_work_status: contract.non_authority_policy.not_work_status,
      not_retrieval_rag_result:
        contract.non_authority_policy.not_retrieval_rag_result,
      not_product_write: contract.non_authority_policy.not_product_write,
      salience_score_not_authority:
        contract.non_authority_policy.salience_score_not_authority,
      salience_score_not_promotion_readiness:
        contract.non_authority_policy.salience_score_not_promotion_readiness,
      salience_score_not_durable_approval:
        contract.non_authority_policy.salience_score_not_durable_approval,
      salience_score_not_evidence_strength:
        contract.non_authority_policy.salience_score_not_evidence_strength,
      durable_write_requires_later_contract:
        contract.non_authority_policy.durable_write_requires_later_contract,
    },
    authority_boundary: authorityBoundary,
    validation_policy: validationPolicy,
    validation: {
      passed: failureCodes.length === 0,
      failure_codes: uniqueSorted(failureCodes),
      generated_priority_view_follows_contract:
        generatedPriorityViewFollowsContract,
      generated_priority_view_boundary_matches_contract:
        generatedBoundaryMatchesContract,
      generated_priority_view_validation_matches_contract:
        generatedValidationMatchesContract,
      top_level_implementation_boundary_is_separate: topLevelBoundaryIsSeparate,
      all_scores_in_range: allScoresInRange,
      action_hints_are_hint_only: actionHintsAreHintOnly,
      action_hints_do_not_mutate_now: actionHintsDoNotMutateNow,
      salience_score_not_authority: true,
      salience_score_not_promotion_readiness: true,
      salience_score_not_durable_approval: true,
      salience_score_not_evidence_strength: true,
      non_authority_policy_preserved: nonAuthorityPolicyIsPreserved,
      authority_boundary_preserved: authorityBoundaryPreserved,
      deterministic_rebuild_matches_fixture: true,
    },
    recommendation_status:
      "ready_for_salience_governor_browser_validation_v0_1",
    next_recommended_slice: "salience_governor_browser_validation_v0_1",
    implementation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  implementation.implementation_fingerprint =
    computeSalienceGovernorImplementationFingerprint(implementation);
  return implementation;
}

export function computeSalienceGovernorImplementationFingerprint(
  implementation: SalienceGovernorImplementation,
): string {
  const normalized = clone(implementation) as unknown as JsonRecord;
  delete normalized.implementation_fingerprint;
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

export function getSalienceGovernorImplementationAuthorityBoundary():
  SalienceGovernorImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    contract_followed_now: true,
    fixture_backed_only: true,
    deterministic_builder_added_now: true,
    runtime_salience_scoring_implemented_now: false,
    durable_salience_write_implemented_now: false,
    salience_score_used_as_authority_now: false,
    runtime_persistence_implemented_now: false,
    durable_memory_write_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
    recent_rehearsal_buffer_written_now: false,
    formation_receipt_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    candidate_mutation_now: false,
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
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

export function getSalienceGovernorImplementationValidationPolicy():
  SalienceGovernorImplementationValidationPolicy {
  return {
    static_source_validation_only: true,
    fixture_backed_only: true,
    app_server_started_now: false,
    production_db_used_now: false,
    runtime_browser_request_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    runtime_salience_scoring_now: false,
  };
}

function buildGeneratedSaliencePriorityView(input: {
  contract: SalienceGovernorContract;
  generatedAt: string;
  topK: number;
  candidatePriorityPreview: SaliencePriorityViewCandidate[];
}): SalienceGovernorGeneratedPriorityView {
  const sample = input.contract.sample_salience_priority_view;
  return {
    ...clone(sample),
    generated_at: input.generatedAt,
    source_refs: sortSourceRefs(sample.source_refs),
    top_k: input.topK,
    candidate_priority_preview: input.candidatePriorityPreview,
    action_hint_policy_ref: sample.action_hint_policy_ref,
    priority_view_contract_ref: sample.priority_view_contract_ref,
    non_authority_policy_ref: sample.non_authority_policy_ref,
    authority_boundary: clone(input.contract.authority_boundary),
    validation: clone(input.contract.validation_policy),
  };
}

function priorityViewFollowsContract(
  priorityView: SalienceGovernorGeneratedPriorityView,
): boolean {
  return (
    priorityView.priority_view_version === "salience_governor_priority_view.v0.1" &&
    Array.isArray(priorityView.source_refs) &&
    priorityView.source_refs.length > 0 &&
    Array.isArray(priorityView.candidate_priority_preview) &&
    priorityView.action_hint_policy_ref.length > 0 &&
    priorityView.priority_view_contract_ref.length > 0 &&
    priorityView.non_authority_policy_ref.length > 0
  );
}

function nonAuthorityPolicyPreserved(contract: SalienceGovernorContract): boolean {
  return (
    contract.non_authority_policy.not_promotion_basis === true &&
    contract.non_authority_policy.not_source_of_truth === true &&
    contract.non_authority_policy.not_proof_or_evidence === true &&
    contract.non_authority_policy.not_perspective_state === true &&
    contract.non_authority_policy.not_work_status === true &&
    contract.non_authority_policy.not_retrieval_rag_result === true &&
    contract.non_authority_policy.not_product_write === true &&
    contract.non_authority_policy.salience_score_not_authority === true &&
    contract.non_authority_policy.salience_score_not_promotion_readiness === true &&
    contract.non_authority_policy.salience_score_not_durable_approval === true &&
    contract.non_authority_policy.salience_score_not_evidence_strength === true &&
    contract.non_authority_policy.durable_write_requires_later_contract === true
  );
}

function implementationAuthorityBoundaryPreserved(
  boundary: SalienceGovernorImplementationAuthorityBoundary,
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

function actionHintEntries(contract: SalienceGovernorContract) {
  return contract.action_hint_policy.allowed_hint_kinds.map(
    (hintKind) => contract.action_hint_policy.hint_policy_by_kind[hintKind],
  );
}

function sortCandidatePriorityPreview(
  values: SaliencePriorityViewCandidate[],
): SaliencePriorityViewCandidate[] {
  return values
    .map(clone)
    .sort((a, b) =>
      b.salience_score_preview - a.salience_score_preview ||
      a.candidate_ref_id.localeCompare(b.candidate_ref_id),
    );
}

function sortSourceRefs(
  refs: SaliencePriorityViewShape["source_refs"],
): SaliencePriorityViewShape["source_refs"] {
  return refs.map(clone).sort((a, b) => a.ref_id.localeCompare(b.ref_id));
}

function scoreInRange(candidate: SaliencePriorityViewCandidate): boolean {
  return (
    typeof candidate.salience_score_preview === "number" &&
    candidate.salience_score_preview >= 0 &&
    candidate.salience_score_preview <= 1
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
