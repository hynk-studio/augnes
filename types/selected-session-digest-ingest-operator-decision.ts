/**
 * Selected Session Digest Ingest Operator Decision Preview v0.1.
 *
 * Read-only operator decision preview derived only from an already-built
 * Selected Session Digest Ingest Contract Preview. This preview does not parse
 * raw digest material, create selected digest ingest records or receipts,
 * write DB rows, mutate memory/CWP/Perspective/handoff state, call providers,
 * call GitHub/Codex, or run autonomous actions.
 */

import type { SelectedSessionDigestIngestContractPreview } from "./selected-session-digest-ingest-contract-preview";

export const SELECTED_SESSION_DIGEST_INGEST_OPERATOR_DECISION_PREVIEW_VERSION =
  "selected_session_digest_ingest_operator_decision_preview.v0.1" as const;

export type SelectedSessionDigestIngestOperatorDecisionPreviewStatus =
  | "no_ingest_contract_preview"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "needs_operator_judgment"
  | "ready_for_operator_decision"
  | "ready_for_future_decision_record_write"
  | "keep_preview_only";

export type SelectedSessionDigestIngestRecommendedOperatorDecision =
  | "approve_for_future_ingest_write"
  | "defer_until_contract_material_supplied"
  | "defer_until_evidence_supplied"
  | "defer_until_privacy_review_confirmed"
  | "defer_until_selected_candidate_refs_supplied"
  | "defer_until_idempotency_supplied"
  | "resolve_blockers_or_unsafe_refs"
  | "reject_digest_ingest_candidate"
  | "keep_as_candidate_only"
  | "request_more_evidence";

export type SelectedSessionDigestIngestAvailableOperatorDecision =
  | "approve_for_future_ingest_write"
  | "defer"
  | "reject"
  | "keep_candidate"
  | "request_more_evidence";

export interface SelectedSessionDigestIngestOperatorDecisionPreviewInput {
  selected_session_digest_ingest_contract_preview?: unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface SelectedSessionDigestIngestOperatorDecisionPreview {
  runtime: "augnes";
  preview_version: typeof SELECTED_SESSION_DIGEST_INGEST_OPERATOR_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: SelectedSessionDigestIngestOperatorDecisionPreviewStatus;
  recommended_operator_decision: SelectedSessionDigestIngestRecommendedOperatorDecision;
  available_operator_decisions: SelectedSessionDigestIngestAvailableOperatorDecision[];
  input_summary: SelectedSessionDigestIngestOperatorDecisionInputSummary;
  ingest_contract_preview_refs: SelectedSessionDigestIngestOperatorDecisionContractPreviewRefs;
  source_status: SelectedSessionDigestIngestOperatorDecisionSourceStatus;
  write_readiness: SelectedSessionDigestIngestOperatorDecisionWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: SelectedSessionDigestIngestOperatorDecisionEvidenceSummary;
  would_write_decision_record_preview: SelectedSessionDigestIngestOperatorDecisionWouldWritePreview;
  would_not_write: string[];
  candidate_carry_forward: SelectedSessionDigestIngestOperatorDecisionCarryForward;
  review_checklist: string[];
  non_goals: string[];
  authority_boundary: SelectedSessionDigestIngestOperatorDecisionAuthorityBoundary;
  fallback_reason: string | null;
  notes: string[];
}

export interface SelectedSessionDigestIngestOperatorDecisionInputSummary {
  has_ingest_contract_preview: boolean;
  contract_preview_status:
    | SelectedSessionDigestIngestContractPreview["contract_preview_status"]
    | null;
  contract_ready_for_operator_review: boolean;
  contract_ready_for_future_ingest_write_scope: boolean;
  selected_digest_candidate_ref_count: number;
  selectable_digest_candidate_ref_count: number;
  source_ref_supplied: boolean;
  operator_ref_supplied: boolean;
  session_ref_supplied: boolean;
  project_ref_supplied: boolean;
  evidence_ref_count: number;
  privacy_review_confirmation_ref_supplied: boolean;
  requested_idempotency_key_supplied: boolean;
  blocking_reason_count: number;
  missing_evidence_count: number;
  refusal_reason_count: number;
  contract_authority_read_only: boolean;
  contract_preview_write_flags_all_false: boolean;
}

export interface SelectedSessionDigestIngestOperatorDecisionContractPreviewRefs {
  contract_preview_ref: string | null;
  contract_preview_version:
    | SelectedSessionDigestIngestContractPreview["preview_version"]
    | null;
  contract_preview_status:
    | SelectedSessionDigestIngestContractPreview["contract_preview_status"]
    | null;
  recommended_next_action:
    | SelectedSessionDigestIngestContractPreview["recommended_next_action"]
    | null;
  intake_preview_ref: string | null;
  source_refs: string[];
  evidence_refs: string[];
}

export interface SelectedSessionDigestIngestOperatorDecisionSourceStatus {
  selected_session_digest_ingest_contract_preview:
    | "supplied"
    | "missing"
    | "wrong_version"
    | "malformed";
  contract_preview_status:
    | SelectedSessionDigestIngestContractPreview["contract_preview_status"]
    | null;
  authority_boundary: "valid_read_only" | "missing" | "invalid";
  contract_preview_write_authority: "all_false" | "missing" | "invalid";
}

export interface SelectedSessionDigestIngestOperatorDecisionWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_valid_ingest_contract_preview: true;
  requires_contract_ready_for_future_ingest_write_scope: true;
  requires_selected_digest_candidate_refs: true;
  requires_privacy_review_confirmation: true;
  requires_idempotency_key: true;
  requires_operator_confirmation: true;
  requires_no_blockers: true;
  requires_no_missing_evidence: true;
  requires_no_refusal_reasons: true;
  requires_read_only_contract_preview: true;
  requires_contract_preview_no_write_performed: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
}

export interface SelectedSessionDigestIngestOperatorDecisionEvidenceSummary {
  has_ingest_contract_preview: boolean;
  ingest_contract_preview_version_valid: boolean;
  contract_ready_for_future_ingest_write_scope: boolean;
  has_selected_digest_candidate_refs: boolean;
  selected_refs_subset_of_selectable_refs: boolean;
  has_privacy_review_confirmation_ref: boolean;
  has_idempotency_key: boolean;
  has_source_ref: boolean;
  has_operator_ref: boolean;
  has_session_or_project_ref: boolean;
  has_evidence_refs: boolean;
  has_missing_evidence: boolean;
  has_blockers: boolean;
  has_refusal_reasons: boolean;
  has_insufficient_data: boolean;
  has_unsafe_refs: boolean;
  source_authority_boundary_valid: boolean;
  source_write_authority_false: boolean;
  no_ingest_record_write_confirmed: boolean;
  no_ingest_receipt_write_confirmed: boolean;
  no_memory_perspective_handoff_mutation_confirmed: boolean;
  no_provider_github_codex_confirmed: boolean;
  evidence_refs: string[];
  missing_evidence: string[];
  unsafe_refs: string[];
}

export interface SelectedSessionDigestIngestOperatorDecisionWouldWritePreview {
  proposed_record_kind:
    | "operator_approved_selected_session_digest_ingest_decision_record.v0.1"
    | null;
  proposed_receipt_kind:
    | "operator_approved_selected_session_digest_ingest_decision_write_receipt.v0.1"
    | null;
  proposed_future_ingest_record_kind: "selected_session_digest_ingest_record.v0.1";
  proposed_future_ingest_receipt_kind: "selected_session_digest_ingest_receipt.v0.1";
  selected_digest_candidate_refs: string[];
  selectable_digest_candidate_refs: string[];
  candidate_counts_by_kind: SelectedSessionDigestIngestContractPreview["would_ingest_material_preview"]["candidate_counts_by_kind"];
  source_kind: SelectedSessionDigestIngestContractPreview["would_ingest_material_preview"]["source_kind"];
  source_ref: string | null;
  operator_ref: string | null;
  session_ref: string | null;
  project_ref: string | null;
  source_refs: string[];
  evidence_refs: string[];
  contract_preview_ref: string | null;
  intake_preview_ref: string | null;
  privacy_review_confirmation_ref: string | null;
  requested_idempotency_key: string | null;
  requested_ingest_scope_ref: string | null;
  sanitized_candidate_summaries: Array<{
    candidate_ref: string;
    candidate_kind: string;
    label: string;
    summary: string;
    source_refs: string[];
    evidence_refs: string[];
  }>;
  review_summary: string;
}

export interface SelectedSessionDigestIngestOperatorDecisionCarryForward {
  review_only_candidate_refs: string[];
  review_only_candidate_count: number;
  review_only_candidate_summaries: Array<{
    candidate_ref: string;
    label: string;
    summary: string;
    ingest_preview_only: true;
  }>;
  unresolved_contract_blockers: string[];
  contract_missing_evidence: string[];
  contract_privacy_review_notes: string[];
}

export interface SelectedSessionDigestIngestOperatorDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_ingest_decision_record: false;
  can_create_ingest_decision_receipt: false;
  can_create_ingest_record: false;
  can_create_ingest_receipt: false;
  can_write_selected_session_digest: false;
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
