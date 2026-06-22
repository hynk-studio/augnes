import type {
  FeedbackEventStoreEventType,
  FeedbackEventStoreTargetKind,
} from "@/types/feedback-event-store";
import type { FeedbackEventStoreReviewControlEventPreview } from "@/types/feedback-event-store-review-controls-preview";

export type FeedbackEventWriteRouteAuthorityAcknowledgement =
  | "durable_feedback_event_only"
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

export type FeedbackEventWriteRouteRefusalCode =
  | "route_not_implemented_in_this_slice"
  | "missing_authority_acknowledgement"
  | "invalid_event_type"
  | "invalid_target_kind"
  | "missing_target_id"
  | "missing_source_refs_without_reason"
  | "correction_text_required_for_correct_preview"
  | "operator_note_secret_like_pattern"
  | "forbidden_authority_requested"
  | "product_write_authority_requested"
  | "retrieval_rag_execution_requested"
  | "provider_openai_call_requested"
  | "source_fetch_requested"
  | "codex_or_github_automation_requested";

export interface FeedbackEventWriteRouteContractInput {
  reviewControlsPreview: {
    preview_kind: string;
    preview_version: string;
    preview_fingerprint: string;
    event_previews: FeedbackEventStoreReviewControlEventPreview[];
    next_recommended_slice?: string;
  };
  feedbackEventStoreFixture: {
    fixture_version: string;
    product_write_stopline_ref?: string;
    next_recommended_slice?: string;
  };
  scope?: string;
  as_of?: string;
  source_review_controls_preview_fixture_path?: string;
  source_feedback_event_store_fixture_path?: string;
}

export interface FeedbackEventWriteRouteRequest {
  request_version: "feedback_event_write_route_request.v0.1";
  event_type: FeedbackEventStoreEventType;
  target_kind: FeedbackEventStoreTargetKind;
  target_id: string;
  target_fingerprint?: string;
  source_ref_ids: string[];
  operator_note?: string;
  correction_text?: string;
  reason?: string;
  idempotency_key?: string;
  client_request_id?: string;
  authority_acknowledgements: FeedbackEventWriteRouteAuthorityAcknowledgement[];
}

export interface FeedbackEventWriteRouteRefusal {
  refusal_code: FeedbackEventWriteRouteRefusalCode;
  message: string;
  retryable: boolean;
  authority_boundary_notes: string[];
}

export interface FeedbackEventWriteRouteAuthorityBoundary {
  contract_only: true;
  route_implemented_now: false;
  durable_feedback_event_written_now: false;
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

export interface FeedbackEventWriteRouteValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface FeedbackEventWriteRouteResponse {
  response_version: "feedback_event_write_route_response.v0.1";
  accepted: boolean;
  inserted: boolean;
  duplicate: boolean;
  event_id: string | null;
  idempotency_key: string | null;
  event_preview?: FeedbackEventStoreReviewControlEventPreview;
  validation: FeedbackEventWriteRouteValidationResult;
  authority_boundary: FeedbackEventWriteRouteAuthorityBoundary;
  refusal?: FeedbackEventWriteRouteRefusal;
  route_implemented_now: false;
  runtime_write_executed_now: false;
  db_open_now: false;
  sql_execution_now: false;
}

export interface FeedbackEventWriteRouteIdempotencyContract {
  idempotency_key_optional_in_request: true;
  derives_from_normalized_event_input_when_missing: true;
  duplicate_idempotency_key_returns_duplicate_true: true;
  duplicate_inserted_false: true;
  duplicate_row_created: false;
  db_insert_tested_in_this_slice: false;
  contract_notes: string[];
}

export interface FeedbackEventWriteRouteContract {
  contract_kind: "feedback_event_write_route_contract";
  contract_version: "feedback_event_write_route_contract.v0.1";
  scope: string;
  as_of: string;
  route_path: "/api/research-candidate/feedback-events";
  route_method: "POST";
  route_implemented_now: false;
  source_review_controls_preview_ref: string;
  source_review_controls_preview_fixture_path: string;
  source_review_controls_preview_fingerprint: string;
  source_feedback_event_store_ref: string;
  source_feedback_event_store_fixture_path: string;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
  request_contract: FeedbackEventWriteRouteRequest;
  response_contract: FeedbackEventWriteRouteResponse;
  refusal_contracts: FeedbackEventWriteRouteRefusal[];
  idempotency_contract: FeedbackEventWriteRouteIdempotencyContract;
  authority_boundary: FeedbackEventWriteRouteAuthorityBoundary;
  validation: FeedbackEventWriteRouteValidationResult;
  recommendation_status: "ready_for_feedback_event_write_route_implementation_v0_1";
  next_recommended_slice: "feedback_event_write_route_implementation_v0_1";
}
