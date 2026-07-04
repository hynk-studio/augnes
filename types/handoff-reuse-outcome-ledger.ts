import type {
  DogfoodReuseDogfoodSignalSummary,
  DogfoodReuseOperatorDecisionPreview,
} from "@/types/dogfood-reuse-operator-decision-preview";
import type {
  DogfoodReuseCarryForwardCandidates,
  DogfoodReuseExpectedObservedSummary,
  DogfoodReuseProposedClassifications,
  DogfoodReuseRecordProposalKind,
} from "@/types/dogfood-reuse-record-proposal";

export const HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION =
  "handoff_reuse_outcome_ledger_record.v0.1" as const;
export const HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION =
  "handoff_reuse_outcome_ledger_write_receipt.v0.1" as const;
export const HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION =
  "handoff_reuse_outcome_ledger_store.v0.1" as const;
export const HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE = "project:augnes" as const;

export type HandoffReuseOutcomeLedgerOperatorDecision =
  "approve_for_future_write";

export interface HandoffReuseOutcomeLedgerChecklistConfirmations {
  actual_result_report_confirmed: true;
  result_matches_intended_codex_run: true;
  changed_files_and_checks_confirmed: true;
  skipped_checks_reviewed_not_counted_as_success: true;
  reuse_classifications_evidence_backed: true;
  unknown_refs_remain_unknown: true;
  carry_forward_candidates_are_candidate_only: true;
  no_durable_memory_or_perspective_apply: true;
  no_metric_update_expected: true;
}

export interface HandoffReuseOutcomeLedgerOperatorApproval {
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  checklist_confirmations: HandoffReuseOutcomeLedgerChecklistConfirmations;
  review_note: string | null;
}

export interface HandoffReuseOutcomeLedgerWriteInput {
  decision_preview: DogfoodReuseOperatorDecisionPreview;
  operator_decision: HandoffReuseOutcomeLedgerOperatorDecision;
  idempotency_key: string;
  approved_by?: string;
  operator_ref?: string;
  approved_at: string;
  checklist_confirmations: HandoffReuseOutcomeLedgerChecklistConfirmations;
  review_note?: string;
}

export interface HandoffReuseOutcomeLedgerDecisionPreviewRefs {
  preview_version: string;
  preview_status: string;
  recommended_operator_decision: string;
  write_ready: boolean;
  preview_as_of: string;
  source_refs: string[];
}

export interface HandoffReuseOutcomeLedgerFeedbackDraftRefs {
  feedback_draft_ref: string | null;
  result_report_ref: string | null;
  result_report_fingerprint: string | null;
  context_relay_rationale_ref: string | null;
  continuity_relay_ref: string | null;
  source_refs: string[];
}

export interface HandoffReuseOutcomeLedgerWriteValidation {
  validation_version: "handoff_reuse_outcome_ledger_write_validation.v0.1";
  write_ready_revalidated: true;
  required_checklist_confirmations: string[];
  refused_sample_fixture_material: false;
  default_workbench_missing_result_refused: false;
  validation_hash: string;
}

export interface HandoffReuseOutcomeLedgerAuthorityBoundary {
  ledger_record_only: true;
  source_of_truth: false;
  operator_approved_durable_local_record: true;
  can_write_handoff_reuse_ledger: boolean;
  can_write_db: boolean;
  can_write_dogfood_ledger: boolean;
  can_update_metrics: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_send_handoff: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}

export interface HandoffReuseOutcomeLedgerRecord {
  record_version: typeof HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION;
  store_version: typeof HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE;
  operator_decision: HandoffReuseOutcomeLedgerOperatorDecision;
  operator_approval: HandoffReuseOutcomeLedgerOperatorApproval;
  source_refs: string[];
  decision_preview_refs: HandoffReuseOutcomeLedgerDecisionPreviewRefs;
  proposal_refs: DogfoodReuseOperatorDecisionPreview["proposal_refs"];
  feedback_draft_refs: HandoffReuseOutcomeLedgerFeedbackDraftRefs;
  result_report_ref: string;
  result_report_fingerprint: string;
  context_relay_rationale_ref: string;
  continuity_relay_ref: string;
  proposed_record_kind: DogfoodReuseRecordProposalKind;
  dogfood_signal: DogfoodReuseDogfoodSignalSummary;
  reuse_classifications: DogfoodReuseProposedClassifications;
  expected_observed_summary: DogfoodReuseExpectedObservedSummary;
  skipped_or_unverified_checks: string[];
  not_done_items: string[];
  carry_forward_candidates: DogfoodReuseCarryForwardCandidates;
  evidence_summary: DogfoodReuseOperatorDecisionPreview["evidence_summary"];
  write_validation: HandoffReuseOutcomeLedgerWriteValidation;
  authority_boundary: HandoffReuseOutcomeLedgerAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface HandoffReuseOutcomeLedgerWriteReceipt {
  receipt_version: typeof HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION;
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
  no_metric_update: true;
  no_memory_mutation: true;
  no_perspective_apply: true;
  no_provider_call: true;
  no_github_call: true;
  no_codex_execution: true;
  no_handoff_send: true;
}

export type HandoffReuseOutcomeLedgerWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface HandoffReuseOutcomeLedgerStoreResult {
  store_version: typeof HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION;
  scope: typeof HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE;
  status: HandoffReuseOutcomeLedgerWriteStatus;
  ok: boolean;
  record: HandoffReuseOutcomeLedgerRecord | null;
  records: HandoffReuseOutcomeLedgerRecord[];
  receipt: HandoffReuseOutcomeLedgerWriteReceipt;
  error_code: HandoffReuseOutcomeLedgerWriteStatus | null;
  no_metric_update: true;
  no_memory_mutation: true;
  no_perspective_apply: true;
  no_provider_call: true;
  no_github_call: true;
  no_codex_execution: true;
  no_handoff_send: true;
  no_formation_receipt: true;
  no_promotion_decision: true;
  no_graph_vector_rag_crawler_observer: true;
  no_autonomous_action: true;
}
