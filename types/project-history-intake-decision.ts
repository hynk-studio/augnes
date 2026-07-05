import type { CandidateIngressNormalizedCandidate } from "./candidate-ingress-normalizer";

export const PROJECT_HISTORY_INTAKE_OPERATOR_DECISION_PREVIEW_VERSION =
  "project_history_intake_operator_decision_preview.v0.1" as const;

export interface ProjectHistoryIntakeOperatorDecisionPreviewInput {
  project_history_intake_preview?: unknown;
  selected_candidate_refs?: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  privacy_review_confirmation_ref?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export type ProjectHistoryIntakeOperatorDecisionStatus =
  | "no_project_history_intake_preview"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "needs_operator_judgment"
  | "ready_for_operator_decision"
  | "ready_for_future_candidate_record_write"
  | "keep_preview_only";

export type ProjectHistoryIntakeRecommendedOperatorDecision =
  | "approve_for_project_history_candidate_ingest"
  | "defer_until_history_material_supplied"
  | "defer_until_evidence_supplied"
  | "defer_until_privacy_review_confirmed"
  | "defer_until_selected_candidate_refs_supplied"
  | "defer_until_idempotency_supplied"
  | "resolve_blockers_or_unsafe_refs"
  | "reject_project_history_candidate"
  | "keep_as_candidate_only"
  | "request_more_evidence";

export type ProjectHistoryAvailableOperatorDecision =
  | "approve_for_project_history_candidate_ingest"
  | "defer"
  | "reject"
  | "keep_candidate"
  | "request_more_evidence";

export interface ProjectHistoryIntakeDecisionInputSummary {
  has_valid_project_history_intake_preview: boolean;
  selected_candidate_ref_count: number;
  selectable_candidate_ref_count: number;
  would_write_candidate_count: number;
  review_only_candidate_count: number;
  blocker_count: number;
  missing_evidence_count: number;
  refusal_reason_count: number;
  insufficient_data_reason_count: number;
  privacy_review_confirmation_supplied: boolean;
  requested_idempotency_key_supplied: boolean;
}

export interface ProjectHistoryIntakeDecisionSourceStatus {
  project_history_intake_preview:
    | "supplied"
    | "missing"
    | "wrong_version"
    | "malformed";
  intake_authority_boundary: "valid_read_only" | "invalid" | "missing";
  selected_candidate_refs: "supplied" | "missing" | "unknown_ref" | "unsafe";
  privacy_review_confirmation_ref: "supplied" | "missing" | "unsafe";
  requested_idempotency_key: "supplied" | "missing" | "unsafe";
}

export interface ProjectHistoryIntakeDecisionWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_valid_project_history_intake_preview: true;
  requires_intake_ready_for_candidate_ingest_record: true;
  requires_selected_candidate_refs: true;
  requires_privacy_review_confirmation: true;
  requires_idempotency_key: true;
  requires_operator_confirmation: true;
  requires_no_blockers: true;
  requires_no_missing_evidence: true;
  requires_no_refusal_reasons: true;
  requires_read_only_intake_preview: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
}

export interface ProjectHistoryWouldWriteCandidateRecordPreview {
  proposed_record_kind: "project_history_intake_record.v0.1" | null;
  proposed_receipt_kind: "project_history_intake_receipt.v0.1" | null;
  selected_candidate_refs: string[];
  selectable_candidate_refs: string[];
  candidate_counts_by_kind: Record<string, number>;
  source_kind: string | null;
  source_ref: string | null;
  operator_ref: string | null;
  project_ref: string | null;
  work_ref: string | null;
  source_refs: string[];
  evidence_refs: string[];
  intake_preview_ref: string | null;
  privacy_review_confirmation_ref: string | null;
  requested_idempotency_key: string | null;
  sanitized_candidate_summaries: Array<{
    candidate_ref: string;
    candidate_kind: string;
    label: string;
    summary: string;
  }>;
  review_summary: string;
}

export interface ProjectHistoryIntakeDecisionEvidenceSummary {
  has_valid_project_history_intake_preview: boolean;
  has_candidate_material: boolean;
  has_selected_candidate_refs: boolean;
  has_source_ref: boolean;
  has_operator_ref: boolean;
  has_project_ref: boolean;
  has_evidence_refs: boolean;
  has_privacy_review_confirmation: boolean;
  has_idempotency_key: boolean;
  has_missing_evidence: boolean;
  has_refusal_reasons: boolean;
  has_unsafe_refs: boolean;
  source_refs: string[];
  evidence_refs: string[];
  missing_evidence: string[];
  unsafe_refs: string[];
}

export interface ProjectHistoryIntakeDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_ingest_record: false;
  can_create_ingest_receipt: false;
  can_write_project_history: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_mutate_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_write_dogfood_metrics: false;
  can_write_reuse_ledger: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}

export interface ProjectHistoryIntakeOperatorDecisionPreview {
  runtime: "augnes";
  preview_version: typeof PROJECT_HISTORY_INTAKE_OPERATOR_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: ProjectHistoryIntakeOperatorDecisionStatus;
  recommended_operator_decision: ProjectHistoryIntakeRecommendedOperatorDecision;
  available_operator_decisions: ProjectHistoryAvailableOperatorDecision[];
  input_summary: ProjectHistoryIntakeDecisionInputSummary;
  source_status: ProjectHistoryIntakeDecisionSourceStatus;
  write_readiness: ProjectHistoryIntakeDecisionWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: ProjectHistoryIntakeDecisionEvidenceSummary;
  would_write_candidate_record_preview: ProjectHistoryWouldWriteCandidateRecordPreview;
  would_not_write: string[];
  candidate_carry_forward: {
    review_only_candidates: CandidateIngressNormalizedCandidate[];
  };
  review_checklist: string[];
  non_goals: string[];
  authority_boundary: ProjectHistoryIntakeDecisionAuthorityBoundary;
  fallback_reason: string | null;
  notes: string[];
}
