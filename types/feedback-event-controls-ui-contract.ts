import type {
  FeedbackEventStoreEventType,
  FeedbackEventStoreTargetKind,
} from "@/types/feedback-event-store";
import type {
  FeedbackEventStoreReviewControl,
  FeedbackEventStoreReviewControlEventPreview,
  FeedbackEventStoreReviewControlKind,
} from "@/types/feedback-event-store-review-controls-preview";
import type { FeedbackEventWriteRouteAuthorityAcknowledgement } from "@/types/feedback-event-write-route-contract";

export interface FeedbackEventControlsUiContractInput {
  reviewControlsPreview: {
    preview_version: string;
    preview_fingerprint: string;
    controls: FeedbackEventStoreReviewControl[];
    event_previews: FeedbackEventStoreReviewControlEventPreview[];
    next_recommended_slice?: string;
  };
  writeRouteContract: {
    contract_version: string;
    contract_fingerprint: string;
    route_path: string;
    route_method: string;
    next_recommended_slice?: string;
  };
  writeRouteImplementationFixture: {
    fixture_version: string;
    route_path: string;
    route_method: string;
    next_recommended_slice?: string;
  };
  writeRouteBrowserValidation: {
    validation_version: string;
    route_path: string;
    route_method: string;
    next_recommended_slice?: string;
  };
  feedbackEventStoreFixture: {
    fixture_version: string;
    next_recommended_slice?: string;
    product_write_stopline_ref?: string;
  };
  scope?: string;
  as_of?: string;
  source_review_controls_preview_fixture_path?: string;
  source_write_route_contract_fixture_path?: string;
  source_write_route_implementation_fixture_path?: string;
  source_write_route_validation_fixture_path?: string;
  source_feedback_event_store_fixture_path?: string;
}

export interface FeedbackEventControlUiBinding {
  binding_id: string;
  control_kind: FeedbackEventStoreReviewControlKind;
  target_kind: FeedbackEventStoreTargetKind;
  target_id: string;
  target_fingerprint?: string;
  source_control_id: string;
  label: string;
  render_location_preview: string;
  route_path: "/api/research-candidate/feedback-events";
  route_method: "POST";
  request_preview_id: string;
  disabled_now: true;
  preview_only_now: true;
  ui_component_added_now: false;
  browser_request_sent_now: false;
  feedback_event_persisted_now: false;
  requires_operator_click: true;
  requires_authority_acknowledgements: true;
  authority_boundary_notes: string[];
}

export interface FeedbackEventControlUiRequestPreview {
  request_preview_id: string;
  request_version: "feedback_event_write_route_request.v0.1";
  event_type: FeedbackEventStoreEventType;
  target_kind: FeedbackEventStoreTargetKind;
  target_id: string;
  target_fingerprint?: string;
  source_ref_ids: string[];
  operator_note_placeholder: string;
  correction_text_placeholder?: string;
  reason_placeholder: string;
  idempotency_key_preview?: string;
  client_request_id_preview: string;
  authority_acknowledgements: FeedbackEventWriteRouteAuthorityAcknowledgement[];
  request_valid_for_route_contract: true;
  request_sent_now: false;
  route_response_observed_now: false;
  feedback_event_written_now: false;
}

export interface FeedbackEventControlUiDisabledState {
  all_controls_disabled_now: true;
  reason: "contract_only_no_ui_implementation";
  future_enablement_requires: string[];
}

export interface FeedbackEventControlUiAuthorityBoundary {
  contract_only: true;
  ui_implemented_now: false;
  components_changed_now: false;
  route_changed_now: false;
  browser_request_executed_now: false;
  feedback_event_persisted_now: false;
  production_db_used_now: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
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

export interface FeedbackEventControlsUiValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface FeedbackEventControlsUiContract {
  contract_kind: "feedback_event_controls_ui_contract";
  contract_version: "feedback_event_controls_ui_contract.v0.1";
  scope: string;
  as_of: string;
  source_review_controls_preview_ref: string;
  source_review_controls_preview_fixture_path: string;
  source_review_controls_preview_fingerprint: string;
  source_write_route_contract_ref: string;
  source_write_route_contract_fixture_path: string;
  source_write_route_contract_fingerprint: string;
  source_write_route_implementation_ref: string;
  source_write_route_implementation_fixture_path: string;
  source_write_route_validation_ref: string;
  source_write_route_validation_fixture_path: string;
  source_feedback_event_store_ref: string;
  source_feedback_event_store_fixture_path: string;
  route_path: "/api/research-candidate/feedback-events";
  route_method: "POST";
  ui_implemented_now: false;
  components_changed_now: false;
  route_changed_now: false;
  browser_request_executed_now: false;
  feedback_event_persisted_now: false;
  control_bindings: FeedbackEventControlUiBinding[];
  request_previews: FeedbackEventControlUiRequestPreview[];
  disabled_state_policy: FeedbackEventControlUiDisabledState;
  authority_acknowledgement_policy: {
    required_acknowledgements: FeedbackEventWriteRouteAuthorityAcknowledgement[];
    every_request_preview_requires_all_acknowledgements: true;
    missing_acknowledgement_refusal_code: "missing_authority_acknowledgement";
    product_write_lane_parked_by_686: true;
  };
  error_display_policy: {
    future_ui_must_display_refusal_code: true;
    future_ui_must_display_validation_failure_codes: true;
    future_ui_must_not_retry_forbidden_authority_refusals: true;
    no_error_display_component_added_now: true;
  };
  source_ref_policy: {
    repo_local_source_refs_required_or_explicitly_justified: true;
    source_ref_resolution_performed_in_smoke_only: true;
    allowed_repo_local_prefixes: string[];
    allowed_external_lineage_prefixes: string[];
  };
  authority_boundary: FeedbackEventControlUiAuthorityBoundary;
  validation: FeedbackEventControlsUiValidationResult;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
  recommendation_status: "ready_for_feedback_event_controls_ui_implementation_v0_1";
  next_recommended_slice: "feedback_event_controls_ui_implementation_v0_1";
}
