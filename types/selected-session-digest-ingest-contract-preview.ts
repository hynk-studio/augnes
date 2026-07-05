/**
 * Selected Session Digest Ingest Contract Preview v0.1.
 *
 * Read-only preview of the future contract required for a separately scoped,
 * operator-approved selected session digest ingest write. This contract only
 * consumes an already-built Selected Session Digest Intake Preview. It does not
 * parse raw digest material, create ingest records or receipts, create schema,
 * write DB rows, mutate memory/CWP/Perspective/handoff state, call providers,
 * call GitHub/Codex, or run autonomous actions.
 */

import type {
  SelectedSessionDigestIntakeCandidateKind,
  SelectedSessionDigestIntakePreview,
  SelectedSessionDigestIntakePreviewStatus,
  SelectedSessionDigestSourceKind,
} from "./selected-session-digest-intake-preview";

export const SELECTED_SESSION_DIGEST_INGEST_CONTRACT_PREVIEW_VERSION =
  "selected_session_digest_ingest_contract_preview.v0.1" as const;

export type SelectedSessionDigestIngestContractPreviewStatus =
  | "no_intake_preview"
  | "insufficient_data"
  | "blocked"
  | "contract_candidates_available"
  | "ready_for_operator_review"
  | "ready_for_future_ingest_write_scope"
  | "keep_preview_only";

export type SelectedSessionDigestIngestContractRecommendedNextAction =
  | "supply_selected_session_digest"
  | "supply_selected_session_intake_preview"
  | "resolve_intake_blockers_or_unsafe_refs"
  | "supply_source_ref"
  | "supply_operator_ref"
  | "supply_session_or_project_ref"
  | "supply_evidence_refs"
  | "review_intake_candidate"
  | "supply_privacy_review_confirmation"
  | "supply_selected_digest_candidate_refs"
  | "supply_idempotency_key"
  | "review_future_ingest_contract"
  | "prepare_separate_ingest_write_slice"
  | "keep_preview_only"
  | "reject_digest_ingest_candidate";

export interface SelectedSessionDigestIngestContractPreviewInput {
  selected_session_digest_intake_preview?: unknown;
  selected_candidate_refs?: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  privacy_review_confirmation_ref?: string;
  requested_ingest_scope_ref?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export interface SelectedSessionDigestIngestContractPreview {
  preview_version: typeof SELECTED_SESSION_DIGEST_INGEST_CONTRACT_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  contract_preview_status: SelectedSessionDigestIngestContractPreviewStatus;
  recommended_next_action: SelectedSessionDigestIngestContractRecommendedNextAction;
  input_summary: SelectedSessionDigestIngestContractInputSummary;
  source_status: SelectedSessionDigestIngestContractSourceStatus;
  future_ingest_write_contract: SelectedSessionDigestFutureIngestWriteContract;
  would_ingest_material_preview: SelectedSessionDigestWouldIngestMaterialPreview;
  carry_forward_review_only_material: SelectedSessionDigestIngestContractCarryForward;
  readiness: SelectedSessionDigestIngestContractReadiness;
  refusal_reasons: string[];
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  missing_evidence: string[];
  privacy_review_summary: SelectedSessionDigestIngestPrivacyReviewSummary;
  evidence_summary: SelectedSessionDigestIngestContractEvidenceSummary;
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: SelectedSessionDigestIngestContractAuthorityBoundary;
}

export interface SelectedSessionDigestIngestContractInputSummary {
  has_selected_session_digest_intake_preview: boolean;
  intake_preview_status: SelectedSessionDigestIntakePreviewStatus | null;
  ready_for_intake_operator_review: boolean;
  ready_for_future_ingest_contract_preview: boolean;
  source_kind: SelectedSessionDigestSourceKind | "missing" | null;
  source_ref_supplied: boolean;
  operator_ref_supplied: boolean;
  session_ref_supplied: boolean;
  project_ref_supplied: boolean;
  evidence_ref_count: number;
  source_ref_count: number;
  ingestable_candidate_count: number;
  selected_candidate_ref_count: number;
  selected_candidate_refs_supplied: boolean;
  requested_operator_ref_supplied: boolean;
  requested_idempotency_key_supplied: boolean;
  privacy_review_confirmation_ref_supplied: boolean;
  requested_ingest_scope_ref_supplied: boolean;
  carry_forward_review_only_count: number;
  blocking_reason_count: number;
  insufficient_data_reason_count: number;
  refusal_reason_count: number;
}

export interface SelectedSessionDigestIngestContractSourceStatus {
  selected_session_digest_intake_preview:
    | "supplied"
    | "missing"
    | "wrong_version"
    | "malformed";
  intake_preview_status: SelectedSessionDigestIntakePreviewStatus | null;
  authority_boundary: "valid_read_only" | "invalid" | "missing";
  intake_preview_write_authority: "all_false" | "invalid";
}

export interface SelectedSessionDigestFutureIngestWriteContract {
  proposed_record_kind: "selected_session_digest_ingest_record.v0.1";
  proposed_receipt_kind: "selected_session_digest_ingest_receipt.v0.1";
  required_selected_intake_preview_ref: string[];
  required_selected_digest_candidate_refs: string[];
  required_source_kind: string[];
  required_source_ref: string[];
  required_operator_ref: string[];
  required_session_or_project_ref: string[];
  required_evidence_refs: string[];
  required_privacy_review_confirmation: string[];
  required_idempotency: string[];
  required_no_side_effects_receipt: string[];
  required_refusal_checks: string[];
  required_public_safe_refs: string[];
  required_operator_approval_payload: string[];
}

export interface SelectedSessionDigestWouldIngestMaterialPreview {
  selected_digest_candidate_refs: string[];
  candidate_counts_by_kind: Record<
    Exclude<SelectedSessionDigestIntakeCandidateKind, "rejected_or_review_only">,
    number
  >;
  source_kind: SelectedSessionDigestSourceKind | "missing" | null;
  source_ref: string | null;
  operator_ref: string | null;
  session_ref: string | null;
  project_ref: string | null;
  source_refs: string[];
  evidence_refs: string[];
  intake_preview_ref: string | null;
  privacy_review_confirmation_ref: string | null;
  requested_idempotency_key: string | null;
  requested_ingest_scope_ref: string | null;
  candidate_summaries: SelectedSessionDigestIngestCandidateSummary[];
}

export interface SelectedSessionDigestIngestCandidateSummary {
  candidate_ref: string;
  candidate_kind: Exclude<
    SelectedSessionDigestIntakeCandidateKind,
    "rejected_or_review_only"
  >;
  label: string;
  summary: string;
  source_refs: string[];
  evidence_refs: string[];
  review_required: true;
  ingest_preview_only: true;
}

export interface SelectedSessionDigestIngestContractCarryForward {
  rejected_or_review_only_candidate_refs: string[];
  rejected_or_review_only_count: number;
  review_only_candidate_summaries: Array<{
    candidate_ref: string;
    label: string;
    summary: string;
    ingest_preview_only: true;
  }>;
  intake_privacy_review_notes: string[];
  unresolved_blockers: string[];
  missing_evidence_candidates: string[];
}

export interface SelectedSessionDigestIngestContractReadiness {
  ready_for_operator_review: boolean;
  ready_for_future_ingest_write_scope: boolean;
  requires_valid_intake_preview: boolean;
  requires_intake_ready_for_future_ingest_contract_preview: boolean;
  requires_selected_digest_candidate_refs: boolean;
  requires_known_source_kind: boolean;
  requires_source_ref: boolean;
  requires_operator_ref: boolean;
  requires_session_or_project_ref: boolean;
  requires_evidence_refs: boolean;
  requires_privacy_review_confirmation: boolean;
  requires_idempotency_key: boolean;
  requires_public_safe_refs: boolean;
  requires_no_blockers: boolean;
  requires_no_insufficient_data: boolean;
  requires_no_missing_evidence: boolean;
  requires_read_only_intake_preview: boolean;
  current_blockers: string[];
  current_insufficient_data: string[];
  current_missing_evidence: string[];
  current_unsafe_refs: string[];
  current_refusal_reasons: string[];
}

export interface SelectedSessionDigestIngestPrivacyReviewSummary {
  has_privacy_review_confirmation_ref: boolean;
  privacy_review_confirmation_ref: string | null;
  intake_privacy_review_note_count: number;
  privacy_review_notes: string[];
  unsafe_or_private_markers_present: boolean;
}

export interface SelectedSessionDigestIngestContractEvidenceSummary {
  has_valid_intake_preview: boolean;
  intake_preview_version_valid: boolean;
  intake_ready_for_future_ingest_contract_preview: boolean;
  has_ingestable_candidate_material: boolean;
  has_selected_candidate_refs: boolean;
  has_source_refs: boolean;
  has_evidence_refs: boolean;
  has_operator_ref: boolean;
  has_session_or_project_ref: boolean;
  has_privacy_review_confirmation_ref: boolean;
  has_idempotency_key: boolean;
  has_missing_evidence: boolean;
  has_blockers: boolean;
  has_insufficient_data: boolean;
  has_unsafe_refs: boolean;
  authority_boundary_valid: boolean;
  intake_preview_write_authority_false: boolean;
  no_ingest_record_write_confirmed: boolean;
  no_ingest_receipt_write_confirmed: boolean;
  no_memory_perspective_handoff_mutation_confirmed: boolean;
  no_provider_github_codex_confirmed: boolean;
  source_refs: string[];
  evidence_refs: string[];
  missing_evidence: string[];
  unsafe_refs: string[];
}

export interface SelectedSessionDigestIngestContractAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_create_schema: false;
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
