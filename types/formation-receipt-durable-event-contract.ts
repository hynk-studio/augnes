// Contract-only Formation Receipt durable event v0.1 shape.
// This file defines types only. It does not implement durable event writes,
// DB schema, routes, browser behavior, provider calls, retrieval, salience
// authority, Perspective promotion, work mutation, proof/evidence creation, or
// product writes.

export type FormationReceiptDurableEventContractKind =
  "formation_receipt_durable_event_contract";

export type FormationReceiptDurableEventContractVersion =
  "formation_receipt_durable_event_contract.v0.1";

export type FormationReceiptDurableEventVersion =
  "formation_receipt_durable_event.v0.1";

export type FormationReceiptContextSelectionStatus =
  | "selected"
  | "excluded";

export type FormationReceiptRefKind =
  | "source_ref"
  | "candidate_ref"
  | "selected_context_ref"
  | "excluded_context_ref"
  | "unresolved_tension_ref"
  | "geometry_digest_ref"
  | "ai_context_packet_ref"
  | "feedback_aggregation_read_model_ref"
  | "operator_decision_ref"
  | "related_pr_ref"
  | "result_link_ref"
  | "handoff_ref"
  | "decision_ref";

export interface FormationReceiptDurableEventScope {
  records_context_selection: true;
  records_candidate_selection: true;
  records_candidate_exclusion: true;
  records_unresolved_tensions: true;
  records_digest_refs: true;
  records_handoff_or_decision_refs: true;
  contract_only_now: true;
  durable_write_implemented_now: false;
  db_schema_implemented_now: false;
  route_implemented_now: false;
}

export interface FormationReceiptSourceRef {
  ref_id: string;
  ref_kind: FormationReceiptRefKind;
  ref: string;
  public_safe: true;
}

export interface FormationReceiptContextRef {
  context_ref_id: string;
  context_kind: string;
  selection_status: FormationReceiptContextSelectionStatus;
  source_refs: string[];
  reason?: string;
}

export interface FormationReceiptDurableEventInputs {
  source_refs: FormationReceiptSourceRef[];
  candidate_ids: string[];
  selected_context_refs: FormationReceiptContextRef[];
  excluded_context_refs: FormationReceiptContextRef[];
  unresolved_tension_ids: string[];
  geometry_digest_ref: FormationReceiptSourceRef;
  ai_context_packet_ref: FormationReceiptSourceRef;
  feedback_aggregation_read_model_ref: FormationReceiptSourceRef;
  operator_decision_ref: FormationReceiptSourceRef;
  related_pr_ref?: FormationReceiptSourceRef;
  result_link?: FormationReceiptSourceRef;
}

export interface FormationReceiptSelectedContextPolicy {
  selected_context_is_provenance_not_proof: true;
  selected_context_is_not_source_of_truth: true;
  selected_context_does_not_imply_perspective_promotion: true;
  selected_context_does_not_imply_work_completion: true;
  selected_context_does_not_imply_product_write: true;
  selected_context_must_keep_source_refs: true;
}

export interface FormationReceiptExcludedContextPolicy {
  exclusions_must_include_reason: true;
  exclusions_delete_source_candidate_feedback_records: false;
  exclusions_suppress_future_review: false;
  exclusions_are_audit_provenance_only: true;
}

export interface FormationReceiptUnresolvedTensionPolicy {
  unresolved_tensions_must_be_preserved: true;
  receipt_creation_resolves_tensions: false;
  unresolved_tensions_may_block_later_promotion: true;
  contract_decides_promotion: false;
}

export interface FormationReceiptDecisionLinkPolicy {
  may_reference_operator_decision: true;
  may_reference_codex_handoff: true;
  may_reference_pr: true;
  may_reference_review_result: true;
  creates_referenced_objects: false;
  approves_merge: false;
  executes_codex_or_github_automation: false;
  mutates_work_status: false;
}

export interface FormationReceiptDurableEventFieldContract {
  formation_receipt_event_id: "required_public_safe_id";
  event_version: FormationReceiptDurableEventVersion;
  created_at: "required_iso8601_timestamp";
  scope: "required_scope";
  formation_intent: "required_formation_intent";
  selected_context_refs: "required_reference_array";
  excluded_context_refs: "required_reference_array";
  excluded_context_reasons: "required_reason_array";
  unresolved_tension_ids: "required_reference_array";
  source_refs: "required_reference_array";
  candidate_refs: "required_reference_array";
  digest_refs: "required_reference_array";
  handoff_refs: "required_reference_array";
  decision_refs: "required_reference_array";
  result_refs: "required_reference_array";
  authority_boundary: "required_authority_boundary";
  validation: "required_validation_summary";
}

export interface FormationReceiptAuthorityBoundary {
  contract_only: true;
  durable_event_contract_defined_now: true;
  durable_event_write_implemented_now: false;
  db_schema_implemented_now: false;
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
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

export interface FormationReceiptValidationPolicy {
  static_source_validation_only: true;
  fixture_backed_only: true;
  app_server_started_now: false;
  production_db_used_now: false;
  runtime_browser_request_now: false;
  runtime_db_query_now: false;
}

export interface FormationReceiptDurableEventRef {
  ref_id: string;
  ref_kind: FormationReceiptRefKind;
  ref: string;
  references_only: true;
}

export interface FormationReceiptCandidateRef {
  candidate_id: string;
  candidate_kind: string;
  selection_status: FormationReceiptContextSelectionStatus;
  source_refs: string[];
  reason?: string;
}

export interface FormationReceiptDurableEventShape {
  formation_receipt_event_id: string;
  event_version: FormationReceiptDurableEventVersion;
  created_at: string;
  scope: string;
  formation_intent: string;
  selected_context_refs: FormationReceiptContextRef[];
  excluded_context_refs: FormationReceiptContextRef[];
  excluded_context_reasons: Record<string, string>;
  unresolved_tension_ids: string[];
  source_refs: FormationReceiptSourceRef[];
  candidate_refs: FormationReceiptCandidateRef[];
  digest_refs: FormationReceiptDurableEventRef[];
  handoff_refs: FormationReceiptDurableEventRef[];
  decision_refs: FormationReceiptDurableEventRef[];
  result_refs: FormationReceiptDurableEventRef[];
  authority_boundary: FormationReceiptAuthorityBoundary;
  validation: FormationReceiptValidationPolicy;
}

export interface FormationReceiptDurableEventContract {
  contract_kind: FormationReceiptDurableEventContractKind;
  contract_version: FormationReceiptDurableEventContractVersion;
  source_feedback_event_aggregation_validation_ref: string;
  receipt_event_scope: FormationReceiptDurableEventScope;
  receipt_event_inputs: FormationReceiptDurableEventInputs;
  selected_context_policy: FormationReceiptSelectedContextPolicy;
  excluded_context_policy: FormationReceiptExcludedContextPolicy;
  unresolved_tension_policy: FormationReceiptUnresolvedTensionPolicy;
  decision_link_policy: FormationReceiptDecisionLinkPolicy;
  durable_event_fields: FormationReceiptDurableEventFieldContract;
  sample_receipt_event: FormationReceiptDurableEventShape;
  authority_boundary: FormationReceiptAuthorityBoundary;
  validation_policy: FormationReceiptValidationPolicy;
  recommendation_status:
    "ready_for_formation_receipt_durable_event_implementation_v0_1";
  next_recommended_slice:
    "formation_receipt_durable_event_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
