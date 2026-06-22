import type {
  FeedbackEventStoreEvent,
  FeedbackEventStoreEventType,
  FeedbackEventStoreTargetKind,
} from "@/types/feedback-event-store";

export type FeedbackEventStoreListRouteAuthorityAcknowledgement =
  | "read_feedback_events_only"
  | "not_proof_or_evidence"
  | "not_perspective_promotion"
  | "not_work_mutation"
  | "not_execution_authority"
  | "not_codex_execution"
  | "not_github_automation"
  | "not_external_handoff"
  | "not_provider_openai_call"
  | "not_source_fetch"
  | "not_retrieval_rag_execution"
  | "not_product_write"
  | "product_write_lane_parked_by_686";

export type FeedbackEventStoreListRouteRefusalCode =
  | "route_not_implemented_in_this_slice"
  | "missing_authority_acknowledgement"
  | "invalid_request_version"
  | "invalid_event_type"
  | "invalid_target_kind"
  | "invalid_limit"
  | "invalid_cursor"
  | "raw_sql_filter_forbidden"
  | "forbidden_authority_requested"
  | "product_write_authority_requested"
  | "retrieval_rag_execution_requested"
  | "provider_openai_call_requested"
  | "source_fetch_requested"
  | "codex_or_github_automation_requested";

export interface FeedbackEventStoreListRouteContractInput {
  feedbackEventStoreFixture: {
    fixture_version: string;
    events: FeedbackEventStoreEvent[];
    product_write_stopline_ref?: string;
    next_recommended_slice?: string;
  };
  feedbackEventControlsUiBrowserValidation: {
    validation_version: string;
    route_path: string;
    route_method: string;
    next_recommended_slice?: string;
    product_write_lane_parked_by_686?: boolean;
  };
  feedbackEventControlsUiImplementationFixture?: {
    implementation_version?: string;
    fixture_version?: string;
    route_path?: string;
    route_method?: string;
    next_recommended_slice?: string;
  };
  feedbackEventWriteRouteBrowserValidation?: {
    validation_version?: string;
    route_path?: string;
    route_method?: string;
    next_recommended_slice?: string;
  };
  scope?: string;
  as_of?: string;
  source_feedback_event_store_fixture_path?: string;
  source_feedback_event_controls_ui_browser_validation_fixture_path?: string;
  source_feedback_event_controls_ui_implementation_fixture_path?: string;
  source_feedback_event_write_route_browser_validation_fixture_path?: string;
}

export interface FeedbackEventStoreListRouteRequest {
  request_version: "feedback_event_store_list_route_request.v0.1";
  event_type?: FeedbackEventStoreEventType;
  target_kind?: FeedbackEventStoreTargetKind;
  target_id?: string;
  created_after?: string;
  created_before?: string;
  limit?: number;
  cursor?: string;
  include_event_json: boolean;
  authority_acknowledgements: FeedbackEventStoreListRouteAuthorityAcknowledgement[];
}

export interface FeedbackEventStoreListRouteRefusal {
  refusal_code: FeedbackEventStoreListRouteRefusalCode;
  message: string;
  retryable: boolean;
  authority_boundary_notes: string[];
}

export interface FeedbackEventStoreListRouteFilterContract {
  allowed_filters: [
    "event_type",
    "target_kind",
    "target_id",
    "created_after",
    "created_before",
    "limit",
    "cursor",
  ];
  disallowed_filters: string[];
  arbitrary_sql_allowed: false;
  raw_where_clause_allowed: false;
  source_fetch_query_allowed: false;
  retrieval_rag_query_allowed: false;
  provider_query_allowed: false;
  product_write_query_allowed: false;
  proof_evidence_query_allowed: false;
  perspective_promotion_query_allowed: false;
  work_mutation_query_allowed: false;
}

export interface FeedbackEventStoreListRoutePaginationContract {
  default_limit: 50;
  max_limit: 100;
  deterministic_order: ["created_at DESC", "event_id DESC"];
  cursor_is_opaque_contract_value: true;
  cursor_implemented_now: false;
  exposes_raw_sql_cursor_internals: false;
  implementation_notes: string[];
}

export interface FeedbackEventStoreListRouteAuthorityBoundary {
  contract_only: true;
  route_implemented_now: false;
  durable_feedback_event_read_now: false;
  durable_feedback_event_written_now: false;
  runtime_read_executed_now: false;
  runtime_write_executed_now: false;
  db_open_now: false;
  sql_execution_now: false;
  server_action_available_now: false;
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

export interface FeedbackEventStoreListRouteValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface FeedbackEventStoreListRouteResponse {
  response_version: "feedback_event_store_list_route_response.v0.1";
  accepted: boolean;
  events: FeedbackEventStoreEvent[];
  count: number;
  next_cursor: string | null;
  validation: FeedbackEventStoreListRouteValidationResult;
  authority_boundary: FeedbackEventStoreListRouteAuthorityBoundary;
  refusal: FeedbackEventStoreListRouteRefusal | null;
  route_implemented_now: false;
  runtime_read_executed_now: false;
  db_open_now: false;
  sql_execution_now: false;
}

export interface FeedbackEventStoreListRouteContract {
  contract_kind: "feedback_event_store_list_route_contract";
  contract_version: "feedback_event_store_list_route_contract.v0.1";
  scope: string;
  as_of: string;
  route_path: "/api/research-candidate/feedback-events";
  route_method: "GET";
  route_implemented_now: false;
  source_feedback_event_store_ref: string;
  source_feedback_event_store_fixture_path: string;
  source_feedback_event_controls_ui_browser_validation_ref: string;
  source_feedback_event_controls_ui_browser_validation_fixture_path: string;
  source_feedback_event_controls_ui_implementation_ref?: string;
  source_feedback_event_controls_ui_implementation_fixture_path?: string;
  source_feedback_event_write_route_browser_validation_ref?: string;
  source_feedback_event_write_route_browser_validation_fixture_path?: string;
  request_contract: FeedbackEventStoreListRouteRequest;
  response_contract: FeedbackEventStoreListRouteResponse;
  refusal_contracts: FeedbackEventStoreListRouteRefusal[];
  filter_contract: FeedbackEventStoreListRouteFilterContract;
  pagination_contract: FeedbackEventStoreListRoutePaginationContract;
  authority_boundary: FeedbackEventStoreListRouteAuthorityBoundary;
  validation: FeedbackEventStoreListRouteValidationResult;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
  recommendation_status: "ready_for_feedback_event_store_list_route_implementation_v0_1";
  next_recommended_slice: "feedback_event_store_list_route_implementation_v0_1";
}
