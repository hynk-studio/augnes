import type {
  FeedbackEventStoreEvent,
  FeedbackEventStoreEventType,
  FeedbackEventStoreTargetKind,
} from "@/types/feedback-event-store";

export type FeedbackEventStoreReviewControlKind =
  | "dismiss_preview"
  | "pin_preview"
  | "correct_preview"
  | "invalidate_preview";

export interface FeedbackEventStoreReviewControlsPreviewInput {
  sourceFeedbackEventStoreFixture: {
    fixture_version: string;
    events: FeedbackEventStoreEvent[];
    product_write_stopline_ref?: string;
    next_recommended_slice?: string;
  };
  agentPerspectiveSubstratePreview: Record<string, unknown>;
  candidateToCodexHandoffDraftReview: Record<string, unknown>;
  candidateToCodexHandoffOperatorDecisionPreview: Record<string, unknown>;
  scope?: string;
  as_of?: string;
  source_feedback_event_store_fixture_path?: string;
}

export interface FeedbackEventStoreReviewControlTarget {
  target_kind: FeedbackEventStoreTargetKind;
  target_id: string;
  target_fingerprint?: string;
  source_ref_ids: string[];
  source_ref_resolution_status:
    | "resolved_repo_local"
    | "external_lineage_allowed"
    | "explicit_empty_source_reason";
  source_ref_resolution_notes: string[];
}

export interface FeedbackEventStoreReviewControl {
  control_id: string;
  control_kind: FeedbackEventStoreReviewControlKind;
  label: string;
  target: FeedbackEventStoreReviewControlTarget;
  enabled_now: false;
  preview_only: true;
  would_create_event_type: FeedbackEventStoreEventType;
  would_create_event_preview_id: string;
  requires_operator_action: true;
  writes_now: false;
  route_available_now: false;
  server_action_available_now: false;
  db_write_available_now: false;
  durable_feedback_persisted_now: false;
  authority_boundary_notes: string[];
}

export interface FeedbackEventStoreReviewControlEventPreview {
  event_preview_id: string;
  event_type: FeedbackEventStoreEventType;
  target_kind: FeedbackEventStoreTargetKind;
  target_id: string;
  target_fingerprint?: string;
  source_ref_ids: string[];
  operator_note_placeholder: string;
  correction_text_placeholder?: string;
  reason_placeholder: string;
  idempotency_key_preview: string;
  event_id_preview: string;
  valid_feedback_event_shape_now: true;
  inserted_now: false;
  persisted_now: false;
  db_write_now: false;
}

export interface FeedbackEventStoreReviewControlsAuthorityBoundary {
  preview_only: true;
  durable_feedback_event_written_now: false;
  route_available_now: false;
  server_action_available_now: false;
  db_write_available_now: false;
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

export interface FeedbackEventStoreReviewControlsValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface FeedbackEventStoreReviewControlsPreview {
  preview_kind: "feedback_event_store_review_controls_preview";
  preview_version: "feedback_event_store_review_controls_preview.v0.1";
  scope: string;
  as_of: string;
  source_feedback_event_store_ref: string;
  source_feedback_event_store_fixture_path: string;
  preview_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
  source_surfaces: Record<string, unknown>;
  controls: FeedbackEventStoreReviewControl[];
  event_previews: FeedbackEventStoreReviewControlEventPreview[];
  authority_boundary: FeedbackEventStoreReviewControlsAuthorityBoundary;
  validation: FeedbackEventStoreReviewControlsValidationResult;
  recommendation_status: "ready_for_feedback_event_write_route_contract_v0_1";
  next_recommended_slice: "feedback_event_write_route_contract_v0_1";
}
