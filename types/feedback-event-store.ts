// Type-only contract for Feedback Event Store minimal v0.1. Feedback events
// are durable operator input only; they do not grant proof/evidence,
// Perspective promotion, work mutation, execution, handoff, provider,
// retrieval, source-fetch, product-write, or product-ID authority.

export type FeedbackEventStoreEventType =
  | "dismiss_preview"
  | "pin_preview"
  | "correct_preview"
  | "invalidate_preview";

export type FeedbackEventStoreTargetKind =
  | "agent_perspective_substrate_surfacing_card"
  | "agent_perspective_substrate_folded_section"
  | "candidate_to_codex_handoff_draft"
  | "candidate_to_codex_handoff_draft_review"
  | "candidate_to_codex_handoff_operator_decision_preview"
  | "research_candidate_review_object"
  | "research_candidate_ai_context_packet"
  | "perspective_geometry_digest";

export interface FeedbackEventStoreAuthorityBoundary {
  durable_feedback_event: true;
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
}

export interface FeedbackEventStoreInput {
  event_type: FeedbackEventStoreEventType;
  target_kind: FeedbackEventStoreTargetKind;
  target_id: string;
  target_fingerprint?: string;
  source_ref_ids?: string[];
  operator_note?: string;
  correction_text?: string;
  reason?: string;
  created_at?: string;
  idempotency_key?: string;
}

export interface FeedbackEventStoreEvent {
  event_id: string;
  event_version: "feedback_event_store.v0.1";
  event_type: FeedbackEventStoreEventType;
  target_kind: FeedbackEventStoreTargetKind;
  target_id: string;
  target_fingerprint?: string;
  source_ref_ids: string[];
  operator_note?: string;
  correction_text?: string;
  reason?: string;
  created_at: string;
  idempotency_key: string;
  authority_boundary: FeedbackEventStoreAuthorityBoundary;
}

export interface FeedbackEventStoreValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface FeedbackEventStoreWriteResult {
  inserted: boolean;
  duplicate: boolean;
  event: FeedbackEventStoreEvent | null;
  validation: FeedbackEventStoreValidationResult;
  row_count: number;
}

export interface FeedbackEventStoreListResult {
  events: FeedbackEventStoreEvent[];
  filters: {
    event_type?: FeedbackEventStoreEventType;
    target_kind?: FeedbackEventStoreTargetKind;
    target_id?: string;
  };
  row_count: number;
}
