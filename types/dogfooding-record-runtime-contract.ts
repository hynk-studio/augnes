// Contract-only Dogfooding Record Runtime v0.1 shape.
// This file defines public-safe, bounded review record contracts only. It does
// not implement dogfooding ingestion, routes, DB access, browser/session log
// reads, raw conversation ingestion, telemetry ingestion, Perspective state
// mutation, proof/evidence writes, provider calls, retrieval/RAG execution,
// source fetch, Git Ledger export, GitHub/Codex automation, or product writes.

export const DogfoodingRecordRuntimeContractVersion =
  "dogfooding_record_runtime_contract.v0.1" as const;
export const DogfoodingRecordVersion = "dogfooding_record.v0.1" as const;
export const DogfoodingSignalVersion = "dogfooding_signal.v0.1" as const;
export const DogfoodingReviewCueVersion = "dogfooding_review_cue.v0.1" as const;
export const DogfoodingRecordBundleVersion =
  "dogfooding_record_bundle.v0.1" as const;
export const DogfoodingRecordRuntimeScope = "project:augnes" as const;
export const DogfoodingRecordRuntimeStatus = "contract_only" as const;

export const DogfoodingSignalKinds = [
  "usability_friction",
  "missing_context",
  "wrong_surfacing",
  "confusing_label",
  "broken_flow",
  "stale_context",
  "source_gap",
  "overreach",
  "latency_observation",
  "trust_boundary_confusion",
  "product_write_request",
  "unknown",
] as const;
export type DogfoodingSignalKind = (typeof DogfoodingSignalKinds)[number];

export const DogfoodingSurfaces = [
  "cockpit",
  "research_candidate_review",
  "constellation_runtime_ui",
  "feedback_controls",
  "surfacing_preview",
  "manual_anchor_store",
  "promotion_decision",
  "formation_receipt",
  "durable_state",
  "trajectory",
  "codex_handoff",
  "unknown",
] as const;
export type DogfoodingSurface = (typeof DogfoodingSurfaces)[number];

export const DogfoodingSeverities = [
  "low",
  "medium",
  "high",
  "critical",
  "unknown",
] as const;
export type DogfoodingSeverity = (typeof DogfoodingSeverities)[number];

export const DogfoodingReviewCueKinds = [
  "review_needed",
  "evidence_needed",
  "boundary_confusion",
  "stale_context_review",
  "source_gap_review",
  "surfacing_review",
  "usability_review",
  "product_write_reentry_request",
  "unknown",
] as const;
export type DogfoodingReviewCueKind =
  (typeof DogfoodingReviewCueKinds)[number];

export const DogfoodingRecordStatuses = [
  "contract_only",
  "candidate_only",
  "ready_for_future_ingestion",
  "blocked_private_or_raw_payload",
  "blocked_missing_surface",
  "blocked_missing_signal",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type DogfoodingRecordStatus = (typeof DogfoodingRecordStatuses)[number];

export const DogfoodingPrivacyClasses = [
  "public_safe_summary",
  "private_ref_only",
  "blocked_raw_private_payload",
  "blocked_secret_like_payload",
] as const;
export type DogfoodingPrivacyClass =
  (typeof DogfoodingPrivacyClasses)[number];

export const DogfoodingRedactionStatuses = [
  "not_needed",
  "redacted",
  "blocked_raw_payload",
  "blocked_secret_like_pattern",
  "blocked_private_location",
] as const;
export type DogfoodingRedactionStatus =
  (typeof DogfoodingRedactionStatuses)[number];

export const DogfoodingRecordReasonCodes = [
  "roadmap_file_present",
  "dogfooding_record_contract_present",
  "dogfooding_signal_present",
  "dogfooding_signal_missing",
  "dogfooding_surface_present",
  "dogfooding_surface_missing",
  "bounded_summary_present",
  "bounded_summary_missing",
  "operator_actor_ref_present",
  "operator_actor_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "feedback_ref_present",
  "surfacing_preview_ref_present",
  "manual_anchor_ref_present",
  "promotion_decision_ref_present",
  "formation_receipt_ref_present",
  "durable_state_ref_present",
  "trajectory_ref_present",
  "review_cue_present",
  "review_cue_missing",
  "product_write_request_recorded_as_review_cue_only",
  "product_write_not_executed",
  "dogfooding_record_is_not_truth",
  "dogfooding_record_is_not_proof",
  "dogfooding_record_is_not_promotion_readiness",
  "dogfooding_record_is_not_raw_conversation",
  "dogfooding_record_is_not_hidden_reasoning",
  "dogfooding_record_is_not_telemetry_dump",
  "dogfooding_record_is_bounded_summary_only",
  "ingestion_runtime_not_implemented",
  "dogfooding_write_not_implemented",
  "dogfooding_route_not_implemented",
  "db_write_not_executed",
  "candidate_not_mutated",
  "durable_state_not_mutated",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "product_write_denied",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "git_ledger_export_not_executed",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
] as const;
export type DogfoodingRecordReasonCode =
  (typeof DogfoodingRecordReasonCodes)[number];

export interface DogfoodingRecordAuthorityBoundary {
  contract_only: true;
  dogfooding_ingestion_runtime_now: false;
  dogfooding_write_route_now: false;
  dogfooding_read_route_now: false;
  dogfooding_record_write_now: false;
  db_query_or_write_now: false;
  browser_log_ingestion_now: false;
  session_log_ingestion_now: false;
  raw_conversation_ingestion_now: false;
  telemetry_ingestion_now: false;
  external_analytics_ingestion_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  candidate_mutation_now: false;
  rule_mutation_now: false;
  parser_mutation_now: false;
  work_mutation_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  git_ledger_export_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  dogfooding_record_is_truth: false;
  dogfooding_record_is_proof: false;
  dogfooding_record_is_promotion_readiness: false;
  dogfooding_record_is_raw_conversation: false;
  dogfooding_record_is_hidden_reasoning: false;
  dogfooding_record_is_telemetry_dump: false;
  product_write_authority: false;
}

export interface DogfoodingSignal {
  signal_version: typeof DogfoodingSignalVersion;
  scope: typeof DogfoodingRecordRuntimeScope;
  signal_id: string;
  signal_kind: DogfoodingSignalKind;
  surface: DogfoodingSurface;
  surface_ref: string;
  severity: DogfoodingSeverity;
  bounded_summary: string;
  source_refs: string[];
  feedback_refs: string[];
  surfacing_preview_refs: string[];
  manual_anchor_refs: string[];
  promotion_decision_refs: string[];
  formation_receipt_refs: string[];
  durable_state_refs: string[];
  trajectory_refs: string[];
  privacy_class: DogfoodingPrivacyClass;
  redaction_status: DogfoodingRedactionStatus;
  public_safe: boolean;
  reason_codes: DogfoodingRecordReasonCode[];
  authority_boundary: DogfoodingRecordAuthorityBoundary;
}

export interface DogfoodingReviewCue {
  review_cue_version: typeof DogfoodingReviewCueVersion;
  scope: typeof DogfoodingRecordRuntimeScope;
  review_cue_id: string;
  cue_kind: DogfoodingReviewCueKind;
  target_surface: DogfoodingSurface;
  target_surface_ref: string;
  target_signal_refs: string[];
  bounded_summary: string;
  severity: DogfoodingSeverity;
  candidate_only: true;
  product_write_request_only: boolean;
  product_write_executed: false;
  reason_codes: DogfoodingRecordReasonCode[];
  authority_boundary: DogfoodingRecordAuthorityBoundary;
}

export interface DogfoodingRecord {
  record_version: typeof DogfoodingRecordVersion;
  contract_version: typeof DogfoodingRecordRuntimeContractVersion;
  scope: typeof DogfoodingRecordRuntimeScope;
  status: DogfoodingRecordStatus;
  record_id: string;
  operator_actor_ref: string;
  recorded_at: string;
  bounded_context_summary: string;
  signals: DogfoodingSignal[];
  review_cues: DogfoodingReviewCue[];
  privacy_class: DogfoodingPrivacyClass;
  redaction_status: DogfoodingRedactionStatus;
  public_safe: boolean;
  boundary_notes: string[];
  reason_codes: DogfoodingRecordReasonCode[];
  authority_boundary: DogfoodingRecordAuthorityBoundary;
  record_fingerprint: string;
}

export interface DogfoodingRecordBundle {
  bundle_version: typeof DogfoodingRecordBundleVersion;
  contract_version: typeof DogfoodingRecordRuntimeContractVersion;
  scope: typeof DogfoodingRecordRuntimeScope;
  status: typeof DogfoodingRecordRuntimeStatus;
  as_of: string;
  roadmap_ref: "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
  source_fixture_refs: string[];
  records: DogfoodingRecord[];
  signal_kind_counts: Record<DogfoodingSignalKind, number>;
  surface_counts: Record<DogfoodingSurface, number>;
  severity_counts: Record<DogfoodingSeverity, number>;
  review_cue_kind_counts: Record<DogfoodingReviewCueKind, number>;
  privacy_class_counts: Record<DogfoodingPrivacyClass, number>;
  redaction_status_counts: Record<DogfoodingRedactionStatus, number>;
  boundary_notes: string[];
  reason_codes: DogfoodingRecordReasonCode[];
  authority_boundary: DogfoodingRecordAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface DogfoodingRecordValidationResult {
  passed: boolean;
  failure_codes: string[];
}
