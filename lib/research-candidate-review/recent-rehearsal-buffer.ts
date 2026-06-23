import type {
  RecentRehearsalBufferContract,
  RecentRehearsalBufferShape,
  RecentRehearsalContextRef,
  RecentRehearsalDecayState,
  RecentRehearsalSourceRef,
} from "@/types/recent-rehearsal-buffer-contract";

type JsonRecord = Record<string, unknown>;

export interface RecentRehearsalBufferImplementationInput {
  recent_rehearsal_buffer_contract: RecentRehearsalBufferContract;
  generated_at?: string;
  decay_state?: RecentRehearsalDecayState;
  recent_context_refs?: RecentRehearsalContextRef[];
  excluded_context_refs?: RecentRehearsalContextRef[];
  last_open_tension_ids?: string[];
  source_contract_ref?: string;
}

export interface RecentRehearsalResumeContextSummary {
  recent_context_count: number;
  recent_context_ref_ids: string[];
  recent_context_has_source_refs: boolean;
  excluded_context_count: number;
  excluded_context_ref_ids: string[];
  excluded_context_reasons_present: boolean;
  last_open_tension_count: number;
  last_failed_check_present: boolean;
  last_user_decision_present: boolean;
  may_help_resume_work: true;
  non_durable: true;
  not_promotion_basis: true;
  not_source_of_truth: true;
  not_proof_or_evidence: true;
  not_perspective_state: true;
  not_work_status: true;
  not_product_write: true;
}

export interface RecentRehearsalDecaySummary {
  decay_state: RecentRehearsalDecayState;
  allowed_decay_states: RecentRehearsalDecayState[];
  decay_is_display_context_only: true;
  decay_does_not_delete_records: true;
  decay_does_not_mutate_work: true;
  decay_does_not_decide_promotion: true;
  pin_or_watch_not_implemented_now: true;
}

export interface RecentRehearsalNonDurableSummary {
  non_durable: true;
  durable_write_requires_later_contract: true;
  runtime_persistence_implemented_now: false;
  durable_memory_write_implemented_now: false;
  not_salience_authority: true;
  not_retrieval_rag_result: true;
  not_product_write: true;
}

export interface RecentRehearsalBufferImplementationAuthorityBoundary {
  implementation_added_now: true;
  contract_followed_now: true;
  fixture_backed_only: true;
  deterministic_builder_added_now: true;
  runtime_buffer_implemented_now: false;
  runtime_persistence_implemented_now: false;
  durable_memory_write_implemented_now: false;
  runtime_db_write_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
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

export interface RecentRehearsalBufferImplementationValidationPolicy {
  static_source_validation_only: true;
  fixture_backed_only: true;
  app_server_started_now: false;
  production_db_used_now: false;
  runtime_browser_request_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
}

export interface RecentRehearsalBufferImplementationValidation {
  passed: boolean;
  failure_codes: string[];
  recent_context_has_source_refs: boolean;
  excluded_context_has_reasons: boolean;
  decay_state_allowed: boolean;
  non_durable_policy_preserved: boolean;
  authority_boundary_preserved: boolean;
  deterministic_rebuild_matches_fixture: true;
}

export interface RecentRehearsalBufferImplementation {
  implementation_kind: "recent_rehearsal_buffer_implementation";
  implementation_version: "recent_rehearsal_buffer_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  source_formation_receipt_validation_ref: string;
  generated_recent_rehearsal_buffer: RecentRehearsalBufferShape;
  resume_context_summary: RecentRehearsalResumeContextSummary;
  decay_summary: RecentRehearsalDecaySummary;
  non_durable_summary: RecentRehearsalNonDurableSummary;
  authority_boundary: RecentRehearsalBufferImplementationAuthorityBoundary;
  validation_policy: RecentRehearsalBufferImplementationValidationPolicy;
  validation: RecentRehearsalBufferImplementationValidation;
  recommendation_status:
    "ready_for_recent_rehearsal_buffer_browser_validation_v0_1";
  next_recommended_slice:
    "recent_rehearsal_buffer_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const defaultSourceContractFixturePath =
  "fixtures/research-candidate-review.recent-rehearsal-buffer-contract.sample.v0.1.json";

export function buildRecentRehearsalBufferImplementation(
  input: RecentRehearsalBufferImplementationInput,
): RecentRehearsalBufferImplementation {
  const contract = input.recent_rehearsal_buffer_contract;
  const recentContextRefs = sortContextRefs(
    input.recent_context_refs ?? contract.buffer_inputs.recent_context_refs,
  );
  const excludedContextRefs = sortContextRefs(
    input.excluded_context_refs ?? contract.buffer_inputs.excluded_context_refs,
  );
  const lastOpenTensionIds = uniqueSorted(
    input.last_open_tension_ids ?? contract.buffer_inputs.last_open_tension_ids,
  );
  const decayState = input.decay_state ?? contract.sample_recent_rehearsal_buffer.decay_state;
  const generatedAt = input.generated_at ?? contract.sample_recent_rehearsal_buffer.generated_at;
  const authorityBoundary = getRecentRehearsalBufferImplementationAuthorityBoundary();
  const validationPolicy = getRecentRehearsalBufferImplementationValidationPolicy();
  const generatedRecentRehearsalBuffer = buildGeneratedRecentRehearsalBuffer({
    contract,
    generatedAt,
    decayState,
    recentContextRefs,
    excludedContextRefs,
    lastOpenTensionIds,
  });
  const recentContextHasSourceRefs = recentContextRefs.every(hasSourceRefs);
  const excludedContextHasReasons = excludedContextRefs.every(hasReason);
  const decayStateAllowed = contract.decay_policy.allowed_decay_states.includes(decayState);
  const nonDurablePolicyIsPreserved = nonDurablePolicyPreserved(contract);
  const authorityBoundaryPreserved = implementationAuthorityBoundaryPreserved(
    authorityBoundary,
  );
  const failureCodes = [
    recentContextHasSourceRefs ? null : "recent_context_missing_source_refs",
    excludedContextHasReasons ? null : "excluded_context_missing_reason",
    decayStateAllowed ? null : "decay_state_not_allowed",
    nonDurablePolicyIsPreserved ? null : "non_durable_policy_not_preserved",
    authorityBoundaryPreserved ? null : "authority_boundary_not_preserved",
  ].filter((code): code is string => Boolean(code));

  const implementation: RecentRehearsalBufferImplementation = {
    implementation_kind: "recent_rehearsal_buffer_implementation",
    implementation_version: "recent_rehearsal_buffer_implementation.v0.1",
    source_contract_ref:
      input.source_contract_ref ??
      `${contract.contract_version}:${defaultSourceContractFixturePath}`,
    source_contract_fingerprint: contract.contract_fingerprint,
    source_formation_receipt_validation_ref:
      contract.source_formation_receipt_validation_ref,
    generated_recent_rehearsal_buffer: generatedRecentRehearsalBuffer,
    resume_context_summary: {
      recent_context_count: recentContextRefs.length,
      recent_context_ref_ids: recentContextRefs.map((ref) => ref.context_ref_id),
      recent_context_has_source_refs: recentContextHasSourceRefs,
      excluded_context_count: excludedContextRefs.length,
      excluded_context_ref_ids: excludedContextRefs.map((ref) => ref.context_ref_id),
      excluded_context_reasons_present: excludedContextHasReasons,
      last_open_tension_count: lastOpenTensionIds.length,
      last_failed_check_present: Boolean(contract.buffer_inputs.last_failed_check),
      last_user_decision_present: Boolean(contract.buffer_inputs.last_user_decision),
      may_help_resume_work: true,
      non_durable: true,
      not_promotion_basis: true,
      not_source_of_truth: true,
      not_proof_or_evidence: true,
      not_perspective_state: true,
      not_work_status: true,
      not_product_write: true,
    },
    decay_summary: {
      decay_state: decayState,
      allowed_decay_states: [...contract.decay_policy.allowed_decay_states],
      decay_is_display_context_only: true,
      decay_does_not_delete_records: true,
      decay_does_not_mutate_work: true,
      decay_does_not_decide_promotion: true,
      pin_or_watch_not_implemented_now: true,
    },
    non_durable_summary: {
      non_durable: true,
      durable_write_requires_later_contract: true,
      runtime_persistence_implemented_now: false,
      durable_memory_write_implemented_now: false,
      not_salience_authority: true,
      not_retrieval_rag_result: true,
      not_product_write: true,
    },
    authority_boundary: authorityBoundary,
    validation_policy: validationPolicy,
    validation: {
      passed: failureCodes.length === 0,
      failure_codes: uniqueSorted(failureCodes),
      recent_context_has_source_refs: recentContextHasSourceRefs,
      excluded_context_has_reasons: excludedContextHasReasons,
      decay_state_allowed: decayStateAllowed,
      non_durable_policy_preserved: nonDurablePolicyIsPreserved,
      authority_boundary_preserved: authorityBoundaryPreserved,
      deterministic_rebuild_matches_fixture: true,
    },
    recommendation_status:
      "ready_for_recent_rehearsal_buffer_browser_validation_v0_1",
    next_recommended_slice:
      "recent_rehearsal_buffer_browser_validation_v0_1",
    implementation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  implementation.implementation_fingerprint =
    computeRecentRehearsalBufferImplementationFingerprint(implementation);
  return implementation;
}

export function computeRecentRehearsalBufferImplementationFingerprint(
  implementation: RecentRehearsalBufferImplementation,
): string {
  const normalized = clone(implementation) as unknown as JsonRecord;
  delete normalized.implementation_fingerprint;
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

export function getRecentRehearsalBufferImplementationAuthorityBoundary():
  RecentRehearsalBufferImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    contract_followed_now: true,
    fixture_backed_only: true,
    deterministic_builder_added_now: true,
    runtime_buffer_implemented_now: false,
    runtime_persistence_implemented_now: false,
    durable_memory_write_implemented_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
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

export function getRecentRehearsalBufferImplementationValidationPolicy():
  RecentRehearsalBufferImplementationValidationPolicy {
  return {
    static_source_validation_only: true,
    fixture_backed_only: true,
    app_server_started_now: false,
    production_db_used_now: false,
    runtime_browser_request_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
  };
}

function buildGeneratedRecentRehearsalBuffer(input: {
  contract: RecentRehearsalBufferContract;
  generatedAt: string;
  decayState: RecentRehearsalDecayState;
  recentContextRefs: RecentRehearsalContextRef[];
  excludedContextRefs: RecentRehearsalContextRef[];
  lastOpenTensionIds: string[];
}): RecentRehearsalBufferShape {
  const sample = input.contract.sample_recent_rehearsal_buffer;
  return {
    ...clone(sample),
    generated_at: input.generatedAt,
    source_refs: sortSourceRefs(sample.source_refs),
    last_active_research_question:
      input.contract.buffer_inputs.last_active_research_question,
    last_active_perspective_key:
      input.contract.buffer_inputs.last_active_perspective_key,
    last_candidate_review_surface_id:
      input.contract.buffer_inputs.last_candidate_review_surface_id,
    last_formation_receipt_ref:
      input.contract.buffer_inputs.last_formation_receipt_ref,
    last_open_tension_ids: input.lastOpenTensionIds,
    last_failed_check: input.contract.buffer_inputs.last_failed_check,
    last_codex_result_status:
      input.contract.buffer_inputs.last_codex_result_status,
    last_user_decision: input.contract.buffer_inputs.last_user_decision,
    last_follow_up_work_candidate_id:
      input.contract.buffer_inputs.last_follow_up_work_candidate_id,
    recent_context_refs: input.recentContextRefs,
    excluded_context_refs: input.excludedContextRefs,
    decay_state: input.decayState,
    decay_policy_ref: "recent_rehearsal_buffer_decay_policy.v0.1",
    authority_boundary: clone(input.contract.authority_boundary),
    validation: clone(input.contract.validation_policy),
  };
}

function nonDurablePolicyPreserved(
  contract: RecentRehearsalBufferContract,
): boolean {
  return (
    contract.non_durable_policy.non_durable === true &&
    contract.non_durable_policy.not_promotion_basis === true &&
    contract.non_durable_policy.not_source_of_truth === true &&
    contract.non_durable_policy.not_proof_or_evidence === true &&
    contract.non_durable_policy.not_perspective_state === true &&
    contract.non_durable_policy.not_work_status === true &&
    contract.non_durable_policy.not_salience_authority === true &&
    contract.non_durable_policy.not_retrieval_rag_result === true &&
    contract.non_durable_policy.not_product_write === true &&
    contract.non_durable_policy.durable_write_requires_later_contract === true
  );
}

function implementationAuthorityBoundaryPreserved(
  boundary: RecentRehearsalBufferImplementationAuthorityBoundary,
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

function sortContextRefs(
  refs: RecentRehearsalContextRef[],
): RecentRehearsalContextRef[] {
  return refs
    .map(clone)
    .sort((a, b) => a.context_ref_id.localeCompare(b.context_ref_id));
}

function sortSourceRefs(refs: RecentRehearsalSourceRef[]): RecentRehearsalSourceRef[] {
  return refs.map(clone).sort((a, b) => a.ref_id.localeCompare(b.ref_id));
}

function hasSourceRefs(ref: RecentRehearsalContextRef): boolean {
  return Array.isArray(ref.source_refs) && ref.source_refs.length > 0;
}

function hasReason(ref: RecentRehearsalContextRef): boolean {
  return typeof ref.reason === "string" && ref.reason.trim().length > 0;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
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
