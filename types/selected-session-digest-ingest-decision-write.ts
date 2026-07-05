import type { SelectedSessionDigestIngestOperatorDecisionPreview } from "./selected-session-digest-ingest-operator-decision";

export const OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_RECORD_VERSION =
  "operator_approved_selected_session_digest_ingest_decision_record.v0.1" as const;
export const OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_WRITE_RECEIPT_VERSION =
  "operator_approved_selected_session_digest_ingest_decision_write_receipt.v0.1" as const;
export const OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_STORE_VERSION =
  "operator_approved_selected_session_digest_ingest_decision_store.v0.1" as const;
export const OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_SCOPE =
  "project:augnes" as const;

export type OperatorApprovedSelectedSessionDigestIngestDecision =
  "approve_for_future_ingest_write";

export interface OperatorApprovedSelectedSessionDigestIngestDecisionChecklistConfirmations {
  [approvalRequirement: string]: true;
}

export interface OperatorApprovedSelectedSessionDigestIngestDecisionOperatorApproval {
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: OperatorApprovedSelectedSessionDigestIngestDecisionChecklistConfirmations;
}

export interface OperatorApprovedSelectedSessionDigestIngestDecisionOperatorApprovalInput
  extends OperatorApprovedSelectedSessionDigestIngestDecisionOperatorApproval {
  operator_decision: OperatorApprovedSelectedSessionDigestIngestDecision;
}

export interface OperatorApprovedSelectedSessionDigestIngestDecisionWriteInput {
  decision_preview: SelectedSessionDigestIngestOperatorDecisionPreview;
  operator_approval: OperatorApprovedSelectedSessionDigestIngestDecisionOperatorApprovalInput;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface OperatorApprovedSelectedSessionDigestIngestDecisionPreviewRefs {
  preview_version: string;
  decision_preview_status: string;
  recommended_operator_decision: string;
  write_ready: boolean;
  preview_as_of: string;
  source_refs: string[];
}

export interface OperatorApprovedSelectedSessionDigestIngestDecisionApprovedFutureMaterial {
  proposed_future_ingest_record_kind: "selected_session_digest_ingest_record.v0.1";
  proposed_future_ingest_receipt_kind: "selected_session_digest_ingest_receipt.v0.1";
  selected_digest_candidate_refs: string[];
  selectable_digest_candidate_refs: string[];
  candidate_counts_by_kind: SelectedSessionDigestIngestOperatorDecisionPreview["would_write_decision_record_preview"]["candidate_counts_by_kind"];
  source_kind: SelectedSessionDigestIngestOperatorDecisionPreview["would_write_decision_record_preview"]["source_kind"];
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
  sanitized_candidate_summaries: SelectedSessionDigestIngestOperatorDecisionPreview["would_write_decision_record_preview"]["sanitized_candidate_summaries"];
}

export interface OperatorApprovedSelectedSessionDigestIngestDecisionCarryForwardMaterial {
  review_only_candidate_refs: string[];
  review_only_candidate_count: number;
  review_only_candidate_summaries: SelectedSessionDigestIngestOperatorDecisionPreview["candidate_carry_forward"]["review_only_candidate_summaries"];
  unresolved_contract_blockers: string[];
  contract_missing_evidence: string[];
}

export interface OperatorApprovedSelectedSessionDigestIngestDecisionWriteValidation {
  validation_version: "operator_approved_selected_session_digest_ingest_decision_write_validation.v0.1";
  write_ready_revalidated: true;
  required_approval_requirements: string[];
  checklist_confirmations_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_actual_selected_digest_ingest: false;
  validation_hash: string;
}

export interface OperatorApprovedSelectedSessionDigestIngestDecisionAuthorityBoundary {
  operator_approved_record_only: true;
  durable_local_record: true;
  source_of_truth: false;
  can_write_db: boolean;
  can_create_ingest_decision_record: boolean;
  can_create_operator_approved_ingest_decision_record: boolean;
  can_create_ingest_decision_receipt: boolean;
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

export interface OperatorApprovedSelectedSessionDigestIngestDecisionNoSideEffects {
  selected_session_digest_ingest_record_written: false;
  selected_session_digest_ingest_receipt_written: false;
  selected_session_digest_persisted: false;
  memory_mutated: false;
  current_working_perspective_updated: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
  dogfood_metrics_written: false;
  reuse_ledger_written: false;
  provider_called: false;
  github_called: false;
  codex_executed: false;
  pr_created: false;
  pr_merged: false;
  autonomous_action_run: false;
  graph_or_vector_store_created: false;
  rag_stack_created: false;
  crawler_or_browser_observer_created: false;
}

export interface OperatorApprovedSelectedSessionDigestIngestDecisionRecord {
  record_version: typeof OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_SCOPE;
  operator_decision: OperatorApprovedSelectedSessionDigestIngestDecision;
  operator_approval: OperatorApprovedSelectedSessionDigestIngestDecisionOperatorApproval;
  source_refs: string[];
  decision_preview_refs: OperatorApprovedSelectedSessionDigestIngestDecisionPreviewRefs;
  ingest_contract_preview_refs: SelectedSessionDigestIngestOperatorDecisionPreview["ingest_contract_preview_refs"];
  approved_future_ingest_material: OperatorApprovedSelectedSessionDigestIngestDecisionApprovedFutureMaterial;
  carry_forward_material: OperatorApprovedSelectedSessionDigestIngestDecisionCarryForwardMaterial;
  evidence_summary: SelectedSessionDigestIngestOperatorDecisionPreview["evidence_summary"];
  write_validation: OperatorApprovedSelectedSessionDigestIngestDecisionWriteValidation;
  authority_boundary: OperatorApprovedSelectedSessionDigestIngestDecisionAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface OperatorApprovedSelectedSessionDigestIngestDecisionWriteReceipt {
  receipt_version: typeof OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_WRITE_RECEIPT_VERSION;
  record_id: string | null;
  idempotency_key: string | null;
  wrote: boolean;
  idempotent_replay: boolean;
  created_at: string;
  refused: boolean;
  refusal_reasons: string[];
  validation_hash: string | null;
  record_fingerprint: string | null;
  store_ref: string | null;
  source_refs: string[];
  no_side_effects: OperatorApprovedSelectedSessionDigestIngestDecisionNoSideEffects;
}

export type OperatorApprovedSelectedSessionDigestIngestDecisionWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface OperatorApprovedSelectedSessionDigestIngestDecisionStoreResult {
  store_version: typeof OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_STORE_VERSION;
  scope: typeof OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_SCOPE;
  status: OperatorApprovedSelectedSessionDigestIngestDecisionWriteStatus;
  ok: boolean;
  record: OperatorApprovedSelectedSessionDigestIngestDecisionRecord | null;
  records: OperatorApprovedSelectedSessionDigestIngestDecisionRecord[];
  receipt: OperatorApprovedSelectedSessionDigestIngestDecisionWriteReceipt;
  error_code: OperatorApprovedSelectedSessionDigestIngestDecisionWriteStatus | null;
  no_side_effects: OperatorApprovedSelectedSessionDigestIngestDecisionNoSideEffects;
}
