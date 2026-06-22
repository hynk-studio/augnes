import type {
  FeedbackEventStoreEvent,
  FeedbackEventStoreEventType,
  FeedbackEventStoreTargetKind,
} from "@/types/feedback-event-store";
import type { FeedbackEventStoreListRouteAuthorityAcknowledgement } from "@/types/feedback-event-store-list-route-contract";

export interface FeedbackEventStoreListUiContractInput {
  listRouteBrowserValidation: {
    validation_version: string;
    route_path: string;
    route_method: string;
    recommendation_status?: string;
    next_recommended_slice?: string;
    product_write_lane_parked_by_686?: boolean;
  };
  listRouteImplementationFixture: {
    fixture_version: string;
    route_path: string;
    route_method: string;
    recommendation_status?: string;
    next_recommended_slice?: string;
    product_write_lane_parked_by_686?: boolean;
  };
  listRouteContract: {
    contract_version: string;
    contract_fingerprint: string;
    route_path: string;
    route_method: string;
    next_recommended_slice?: string;
  };
  feedbackEventStoreFixture: {
    fixture_version: string;
    events: FeedbackEventStoreEvent[];
    product_write_stopline_ref?: string;
    next_recommended_slice?: string;
  };
  feedbackEventControlsUiImplementationFixture?: {
    implementation_version?: string;
    route_path?: string;
    route_method?: string;
    next_recommended_slice?: string;
  };
  scope?: string;
  as_of?: string;
  source_list_route_browser_validation_fixture_path?: string;
  source_list_route_implementation_fixture_path?: string;
  source_list_route_contract_fixture_path?: string;
  source_feedback_event_store_fixture_path?: string;
  source_feedback_event_controls_ui_implementation_fixture_path?: string;
}

export interface FeedbackEventStoreListUiPanelContract {
  panel_id: "feedback-event-store-list-panel";
  intended_location: "agent_perspective_substrate_folded_audit_panel.feedback_event_history";
  title: "Feedback event history";
  implemented_now: false;
  component_added_now: false;
  browser_request_sent_now: false;
  durable_feedback_events_read_now: false;
  empty_state_required: true;
  loading_state_required: true;
  refusal_state_required: true;
  duplicate_feedback_display_required: true;
}

export interface FeedbackEventStoreListUiFilterContract {
  allowed_ui_filters: [
    "event_type",
    "target_kind",
    "target_id",
    "created_after",
    "created_before",
    "limit",
  ];
  disallowed_ui_filters: string[];
  raw_sql_filter_allowed: false;
  raw_where_clause_allowed: false;
  source_fetch_query_allowed: false;
  retrieval_rag_query_allowed: false;
  provider_query_allowed: false;
  product_write_query_allowed: false;
  proof_evidence_query_allowed: false;
  perspective_promotion_query_allowed: false;
  work_mutation_query_allowed: false;
}

export interface FeedbackEventStoreListUiRequestQueryParams {
  request_version: "feedback_event_store_list_route_request.v0.1";
  include_event_json: "true" | "false";
  event_type?: FeedbackEventStoreEventType;
  target_kind?: FeedbackEventStoreTargetKind;
  target_id?: string;
  created_after?: string;
  created_before?: string;
  limit?: "50" | "10";
}

export interface FeedbackEventStoreListUiRequestPreview {
  request_preview_id: string;
  request_version: "feedback_event_store_list_route_request.v0.1";
  route_path: "/api/research-candidate/feedback-events";
  route_method: "GET";
  query_params: FeedbackEventStoreListUiRequestQueryParams;
  authority_acknowledgements: FeedbackEventStoreListRouteAuthorityAcknowledgement[];
  request_valid_for_route_contract: true;
  request_sent_now: false;
  route_response_observed_now: false;
  feedback_events_read_now: false;
}

export interface FeedbackEventStoreListUiDisplayPolicy {
  event_fields_to_display: [
    "event_type",
    "target_kind",
    "target_id",
    "created_at",
    "reason",
    "operator_note",
    "source_ref_ids",
    "authority_boundary",
  ];
  must_label_feedback_as_operator_input_only: true;
  must_not_label_as_proof_or_evidence: true;
  must_not_label_as_perspective_state: true;
  must_not_label_as_work_status: true;
  must_show_product_write_lane_parked: true;
  must_show_retrieval_rag_not_executed: true;
}

export interface FeedbackEventStoreListUiStatePolicy {
  local_component_state_only: true;
  browser_persistence_allowed: false;
  loading_state_required: true;
  empty_state_required: true;
  refusal_state_required: true;
  duplicate_state_display_allowed: true;
  auto_refresh_allowed_now: false;
}

export interface FeedbackEventStoreListUiAuthorityBoundary {
  contract_only: true;
  ui_implemented_now: false;
  components_changed_now: false;
  route_changed_now: false;
  browser_request_executed_now: false;
  feedback_events_read_now: false;
  feedback_events_written_now: false;
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

export interface FeedbackEventStoreListUiValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface FeedbackEventStoreListUiContract {
  contract_kind: "feedback_event_store_list_ui_contract";
  contract_version: "feedback_event_store_list_ui_contract.v0.1";
  scope: string;
  as_of: string;
  source_list_route_browser_validation_ref: string;
  source_list_route_browser_validation_fixture_path: string;
  source_list_route_implementation_ref: string;
  source_list_route_implementation_fixture_path: string;
  source_list_route_contract_ref: string;
  source_list_route_contract_fixture_path: string;
  source_list_route_contract_fingerprint: string;
  source_feedback_event_store_ref: string;
  source_feedback_event_store_fixture_path: string;
  source_feedback_event_controls_ui_implementation_ref?: string;
  source_feedback_event_controls_ui_implementation_fixture_path?: string;
  route_path: "/api/research-candidate/feedback-events";
  route_method: "GET";
  ui_implemented_now: false;
  components_changed_now: false;
  route_changed_now: false;
  browser_request_executed_now: false;
  feedback_events_read_now: false;
  feedback_events_written_now: false;
  panel_contract: FeedbackEventStoreListUiPanelContract;
  filter_contract: FeedbackEventStoreListUiFilterContract;
  request_previews: FeedbackEventStoreListUiRequestPreview[];
  display_policy: FeedbackEventStoreListUiDisplayPolicy;
  state_policy: FeedbackEventStoreListUiStatePolicy;
  error_display_policy: {
    future_ui_must_display_refusal_code: true;
    future_ui_must_display_validation_failure_codes: true;
    future_ui_must_not_retry_forbidden_authority_refusals: true;
    no_error_display_component_added_now: true;
  };
  authority_acknowledgement_policy: {
    required_acknowledgements: FeedbackEventStoreListRouteAuthorityAcknowledgement[];
    every_request_preview_requires_all_acknowledgements: true;
    missing_acknowledgement_refusal_code: "missing_authority_acknowledgement";
    product_write_lane_parked_by_686: true;
  };
  authority_boundary: FeedbackEventStoreListUiAuthorityBoundary;
  validation: FeedbackEventStoreListUiValidationResult;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
  recommendation_status: "ready_for_feedback_event_store_list_ui_implementation_v0_1";
  next_recommended_slice: "feedback_event_store_list_ui_implementation_v0_1";
}
