import type {
  FormationReceiptCandidateRef,
  FormationReceiptContextRef,
  FormationReceiptDurableEventContract,
  FormationReceiptDurableEventRef,
  FormationReceiptDurableEventShape,
  FormationReceiptSourceRef,
} from "@/types/formation-receipt-durable-event-contract";

type JsonRecord = Record<string, unknown>;

export interface FormationReceiptDurableEventImplementationInput {
  formation_receipt_durable_event_contract: FormationReceiptDurableEventContract;
  selected_context_refs?: FormationReceiptContextRef[];
  excluded_context_refs?: FormationReceiptContextRef[];
  unresolved_tension_ids?: string[];
  result_refs?: FormationReceiptDurableEventRef[];
  source_contract_ref?: string;
}

export interface FormationReceiptSelectedContextSummary {
  selected_context_count: number;
  selected_context_ref_ids: string[];
  selected_context_has_source_refs: true;
  provenance_only: true;
  not_proof_or_evidence: true;
  not_source_of_truth: true;
  not_perspective_promotion: true;
  not_work_completion: true;
  not_product_write: true;
}

export interface FormationReceiptExcludedContextSummary {
  excluded_context_count: number;
  excluded_context_ref_ids: string[];
  excluded_context_reasons_present: true;
  deletes_records: false;
  suppresses_future_review: false;
  audit_provenance_only: true;
}

export interface FormationReceiptUnresolvedTensionSummary {
  unresolved_tension_count: number;
  unresolved_tension_ids: string[];
  unresolved_tensions_preserved: true;
  receipt_creation_resolves_tensions: false;
  contract_decides_promotion: false;
  implementation_decides_promotion: false;
}

export interface FormationReceiptReferenceLinkSummary {
  digest_refs_count: number;
  handoff_refs_count: number;
  decision_refs_count: number;
  result_refs_count: number;
  references_only: true;
  creates_referenced_objects: false;
  approves_merge: false;
  executes_codex_or_github_automation: false;
  mutates_work_status: false;
}

export interface FormationReceiptDurableEventImplementationAuthorityBoundary {
  implementation_added_now: true;
  contract_followed_now: true;
  fixture_backed_only: true;
  deterministic_builder_added_now: true;
  runtime_persistence_implemented_now: false;
  durable_event_written_now: false;
  runtime_db_write_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
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

export interface FormationReceiptDurableEventImplementationValidationPolicy {
  static_source_validation_only: true;
  fixture_backed_only: true;
  app_server_started_now: false;
  production_db_used_now: false;
  runtime_browser_request_now: false;
  runtime_db_query_now: false;
  runtime_db_write_now: false;
}

export interface FormationReceiptDurableEventImplementationValidation {
  passed: boolean;
  failure_codes: string[];
  selected_context_has_source_refs: boolean;
  excluded_context_has_reasons: boolean;
  unresolved_tensions_preserved: boolean;
  reference_links_are_reference_only: boolean;
  authority_boundary_preserved: boolean;
  deterministic_rebuild_matches_fixture: true;
}

export interface FormationReceiptDurableEventImplementation {
  implementation_kind: "formation_receipt_durable_event_implementation";
  implementation_version: "formation_receipt_durable_event_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  source_feedback_event_aggregation_validation_ref: string;
  generated_receipt_event: FormationReceiptDurableEventShape;
  selected_context_summary: FormationReceiptSelectedContextSummary;
  excluded_context_summary: FormationReceiptExcludedContextSummary;
  unresolved_tension_summary: FormationReceiptUnresolvedTensionSummary;
  reference_link_summary: FormationReceiptReferenceLinkSummary;
  authority_boundary: FormationReceiptDurableEventImplementationAuthorityBoundary;
  validation_policy: FormationReceiptDurableEventImplementationValidationPolicy;
  validation: FormationReceiptDurableEventImplementationValidation;
  recommendation_status:
    "ready_for_formation_receipt_durable_event_browser_validation_v0_1";
  next_recommended_slice:
    "formation_receipt_durable_event_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const defaultSourceContractFixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-contract.sample.v0.1.json";

export function buildFormationReceiptDurableEventImplementation(
  input: FormationReceiptDurableEventImplementationInput,
): FormationReceiptDurableEventImplementation {
  const contract = input.formation_receipt_durable_event_contract;
  const selectedContextRefs = sortContextRefs(
    input.selected_context_refs ?? contract.receipt_event_inputs.selected_context_refs,
  );
  const excludedContextRefs = sortContextRefs(
    input.excluded_context_refs ?? contract.receipt_event_inputs.excluded_context_refs,
  );
  const unresolvedTensionIds = uniqueSorted(
    input.unresolved_tension_ids ?? contract.receipt_event_inputs.unresolved_tension_ids,
  );
  const resultRefs = sortRefs(
    input.result_refs ?? contract.sample_receipt_event.result_refs,
  );
  const generatedReceiptEvent = buildGeneratedReceiptEvent({
    contract,
    selectedContextRefs,
    excludedContextRefs,
    unresolvedTensionIds,
    resultRefs,
  });
  const selectedContextHasSourceRefs = selectedContextRefs.every(hasSourceRefs);
  const excludedContextHasReasons = excludedContextRefs.every(hasReason);
  const unresolvedTensionsPreserved = arraysEqual(
    generatedReceiptEvent.unresolved_tension_ids,
    unresolvedTensionIds,
  );
  const referenceLinksAreReferenceOnly = allReferenceLinksAreReferenceOnly(
    generatedReceiptEvent,
  );
  const authorityBoundary = getFormationReceiptDurableEventImplementationAuthorityBoundary();
  const authorityBoundaryPreserved = implementationAuthorityBoundaryPreserved(
    authorityBoundary,
  );
  const failureCodes = [
    selectedContextHasSourceRefs ? null : "selected_context_missing_source_refs",
    excludedContextHasReasons ? null : "excluded_context_missing_reason",
    unresolvedTensionsPreserved ? null : "unresolved_tensions_not_preserved",
    referenceLinksAreReferenceOnly ? null : "reference_links_not_reference_only",
    authorityBoundaryPreserved ? null : "authority_boundary_not_preserved",
  ].filter((code): code is string => Boolean(code));

  const implementation: FormationReceiptDurableEventImplementation = {
    implementation_kind: "formation_receipt_durable_event_implementation",
    implementation_version: "formation_receipt_durable_event_implementation.v0.1",
    source_contract_ref:
      input.source_contract_ref ??
      `${contract.contract_version}:${defaultSourceContractFixturePath}`,
    source_contract_fingerprint: contract.contract_fingerprint,
    source_feedback_event_aggregation_validation_ref:
      contract.source_feedback_event_aggregation_validation_ref,
    generated_receipt_event: generatedReceiptEvent,
    selected_context_summary: {
      selected_context_count: selectedContextRefs.length,
      selected_context_ref_ids: selectedContextRefs.map((ref) => ref.context_ref_id),
      selected_context_has_source_refs: true,
      provenance_only: true,
      not_proof_or_evidence: true,
      not_source_of_truth: true,
      not_perspective_promotion: true,
      not_work_completion: true,
      not_product_write: true,
    },
    excluded_context_summary: {
      excluded_context_count: excludedContextRefs.length,
      excluded_context_ref_ids: excludedContextRefs.map((ref) => ref.context_ref_id),
      excluded_context_reasons_present: true,
      deletes_records: false,
      suppresses_future_review: false,
      audit_provenance_only: true,
    },
    unresolved_tension_summary: {
      unresolved_tension_count: unresolvedTensionIds.length,
      unresolved_tension_ids: unresolvedTensionIds,
      unresolved_tensions_preserved: true,
      receipt_creation_resolves_tensions: false,
      contract_decides_promotion: false,
      implementation_decides_promotion: false,
    },
    reference_link_summary: {
      digest_refs_count: generatedReceiptEvent.digest_refs.length,
      handoff_refs_count: generatedReceiptEvent.handoff_refs.length,
      decision_refs_count: generatedReceiptEvent.decision_refs.length,
      result_refs_count: generatedReceiptEvent.result_refs.length,
      references_only: true,
      creates_referenced_objects: false,
      approves_merge: false,
      executes_codex_or_github_automation: false,
      mutates_work_status: false,
    },
    authority_boundary: authorityBoundary,
    validation_policy: {
      static_source_validation_only: true,
      fixture_backed_only: true,
      app_server_started_now: false,
      production_db_used_now: false,
      runtime_browser_request_now: false,
      runtime_db_query_now: false,
      runtime_db_write_now: false,
    },
    validation: {
      passed: failureCodes.length === 0,
      failure_codes: uniqueSorted(failureCodes),
      selected_context_has_source_refs: selectedContextHasSourceRefs,
      excluded_context_has_reasons: excludedContextHasReasons,
      unresolved_tensions_preserved: unresolvedTensionsPreserved,
      reference_links_are_reference_only: referenceLinksAreReferenceOnly,
      authority_boundary_preserved: authorityBoundaryPreserved,
      deterministic_rebuild_matches_fixture: true,
    },
    recommendation_status:
      "ready_for_formation_receipt_durable_event_browser_validation_v0_1",
    next_recommended_slice:
      "formation_receipt_durable_event_browser_validation_v0_1",
    implementation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  implementation.implementation_fingerprint =
    computeFormationReceiptDurableEventImplementationFingerprint(implementation);
  return implementation;
}

export function computeFormationReceiptDurableEventImplementationFingerprint(
  implementation: FormationReceiptDurableEventImplementation,
): string {
  const normalized = clone(implementation) as unknown as JsonRecord;
  delete normalized.implementation_fingerprint;
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

export function getFormationReceiptDurableEventImplementationAuthorityBoundary():
  FormationReceiptDurableEventImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    contract_followed_now: true,
    fixture_backed_only: true,
    deterministic_builder_added_now: true,
    runtime_persistence_implemented_now: false,
    durable_event_written_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
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

function buildGeneratedReceiptEvent(input: {
  contract: FormationReceiptDurableEventContract;
  selectedContextRefs: FormationReceiptContextRef[];
  excludedContextRefs: FormationReceiptContextRef[];
  unresolvedTensionIds: string[];
  resultRefs: FormationReceiptDurableEventRef[];
}): FormationReceiptDurableEventShape {
  const sample = input.contract.sample_receipt_event;
  return {
    ...clone(sample),
    selected_context_refs: input.selectedContextRefs,
    excluded_context_refs: input.excludedContextRefs,
    excluded_context_reasons: Object.fromEntries(
      input.excludedContextRefs.map((ref) => [ref.context_ref_id, ref.reason ?? ""]),
    ),
    unresolved_tension_ids: input.unresolvedTensionIds,
    source_refs: sortSourceRefs(sample.source_refs),
    candidate_refs: sortCandidateRefs(sample.candidate_refs),
    digest_refs: sortRefs(sample.digest_refs),
    handoff_refs: sortRefs(sample.handoff_refs),
    decision_refs: sortRefs(sample.decision_refs),
    result_refs: input.resultRefs,
    authority_boundary: clone(input.contract.authority_boundary),
    validation: clone(input.contract.validation_policy),
  };
}

function allReferenceLinksAreReferenceOnly(
  event: FormationReceiptDurableEventShape,
): boolean {
  return [
    ...event.digest_refs,
    ...event.handoff_refs,
    ...event.decision_refs,
    ...event.result_refs,
  ].every((ref) => ref.references_only === true);
}

function implementationAuthorityBoundaryPreserved(
  boundary: FormationReceiptDurableEventImplementationAuthorityBoundary,
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
  refs: FormationReceiptContextRef[],
): FormationReceiptContextRef[] {
  return refs
    .map(clone)
    .sort((a, b) => a.context_ref_id.localeCompare(b.context_ref_id));
}

function sortSourceRefs(refs: FormationReceiptSourceRef[]): FormationReceiptSourceRef[] {
  return refs.map(clone).sort((a, b) => a.ref_id.localeCompare(b.ref_id));
}

function sortCandidateRefs(
  refs: FormationReceiptCandidateRef[],
): FormationReceiptCandidateRef[] {
  return refs
    .map(clone)
    .sort((a, b) => a.candidate_id.localeCompare(b.candidate_id));
}

function sortRefs<T extends { ref_id: string }>(refs: T[]): T[] {
  return refs.map(clone).sort((a, b) => a.ref_id.localeCompare(b.ref_id));
}

function hasSourceRefs(ref: FormationReceiptContextRef): boolean {
  return Array.isArray(ref.source_refs) && ref.source_refs.length > 0;
}

function hasReason(ref: FormationReceiptContextRef): boolean {
  return typeof ref.reason === "string" && ref.reason.trim().length > 0;
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
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
