import type {
  FeedbackEventStoreEventType,
  FeedbackEventStoreTargetKind,
} from "@/types/feedback-event-store";

export type FeedbackEventAggregationDimension =
  | "event_type"
  | "target_kind"
  | "target_id"
  | "created_at_day"
  | "source_ref_id"
  | "duplicate_group"
  | "idempotency_key_pattern"
  | "operator_note_presence"
  | "reason_presence";

export type FeedbackEventAggregationReadModelViewId =
  | "feedback_event_counts_by_event_type"
  | "feedback_event_counts_by_target_kind"
  | "feedback_event_counts_by_target"
  | "duplicate_feedback_groups"
  | "recent_feedback_event_window_preview"
  | "pinned_or_dismissed_target_summary"
  | "operator_note_presence_summary"
  | "source_ref_feedback_summary"
  | "authority_boundary_summary";

export interface FeedbackEventAggregationInputs {
  durable_feedback_events_only: true;
  source_route_path: "/api/research-candidate/feedback-events";
  source_route_method: "GET";
  source_request_version: "feedback_event_store_list_route_request.v0.1";
  allowed_event_types: FeedbackEventStoreEventType[];
  allowed_target_kinds: FeedbackEventStoreTargetKind[];
  no_runtime_read_now: true;
  no_db_query_now: true;
  fixture_backed_only: true;
}

export interface FeedbackEventAggregationReadModelViewAuthorityBoundary {
  read_model_only: true;
  not_source_of_truth: true;
  not_proof_or_evidence: true;
  not_perspective_state: true;
  not_work_status: true;
  not_promotion_decision: true;
  not_retrieval_rag_result: true;
  not_product_write: true;
}

export interface FeedbackEventAggregationReadModelView {
  view_id: FeedbackEventAggregationReadModelViewId;
  view_version: `${FeedbackEventAggregationReadModelViewId}.v0.1`;
  input_event_selector: Record<string, unknown>;
  grouping_keys: FeedbackEventAggregationDimension[];
  output_fields: string[];
  sort_policy: Record<string, unknown>;
  limit_policy: Record<string, unknown>;
  sample_grouped_outputs?: Record<string, unknown>[];
  authority_boundary: FeedbackEventAggregationReadModelViewAuthorityBoundary;
}

export interface FeedbackEventAggregationDuplicateFeedbackPolicy {
  duplicate_detection_keys: ["event_type", "target_kind", "target_id"];
  idempotency_key_duplicates_grouped_separately: true;
  display_read_model_indicators_only: true;
  delete_feedback_events: false;
  rewrite_feedback_events: false;
  suppress_feedback_events: false;
  mutate_feedback_events: false;
  decides_promotion: false;
  decides_proof_or_evidence: false;
  decides_work_status: false;
  decides_product_write: false;
}

export interface FeedbackEventAggregationTrendWindowPolicy {
  static_preview_windows_only: true;
  preview_windows: string[];
  no_runtime_scheduler: true;
  no_auto_refresh: true;
  no_polling: true;
  no_durable_window_state: true;
  no_salience_authority: true;
}

export interface FeedbackEventAggregationAuthorityBoundary {
  contract_only: true;
  read_model_defined_now: true;
  runtime_read_model_implemented_now: false;
  runtime_db_query_now: false;
  route_changed_now: false;
  feedback_events_read_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  browser_request_now: false;
  browser_persistence_now: false;
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

export interface FeedbackEventAggregationValidationPolicy {
  static_source_validation_only: true;
  fixture_backed_only: true;
  app_server_started_now: false;
  production_db_used_now: false;
  runtime_browser_request_now: false;
}

export interface FeedbackEventAggregationValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface FeedbackEventAggregationReadModelContract {
  contract_kind: "feedback_event_aggregation_read_model_contract";
  contract_version: "feedback_event_aggregation_read_model_contract.v0.1";
  source_feedback_event_store_ref: string;
  source_list_route_ref: string;
  source_list_ui_browser_validation_ref: string;
  aggregation_inputs: FeedbackEventAggregationInputs;
  aggregation_dimensions: FeedbackEventAggregationDimension[];
  read_model_views: FeedbackEventAggregationReadModelView[];
  duplicate_feedback_policy: FeedbackEventAggregationDuplicateFeedbackPolicy;
  trend_window_policy: FeedbackEventAggregationTrendWindowPolicy;
  authority_boundary: FeedbackEventAggregationAuthorityBoundary;
  validation_policy: FeedbackEventAggregationValidationPolicy;
  validation: FeedbackEventAggregationValidationResult;
  recommendation_status:
    "ready_for_feedback_event_aggregation_read_model_implementation_v0_1";
  next_recommended_slice:
    "feedback_event_aggregation_read_model_implementation_v0_1";
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}
