import type {
  HandoffContextUpdateOperatorDecisionPreview,
  HandoffContextUpdateOperatorDecisionUpdatePreviewRefs,
} from "./handoff-context-update-operator-decision-preview";
import type { HandoffContextUpdateCandidate } from "./handoff-context-update-preview";

export const OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_VERSION =
  "operator_approved_handoff_context_update_record.v0.1" as const;
export const OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_WRITE_RECEIPT_VERSION =
  "operator_approved_handoff_context_update_write_receipt.v0.1" as const;
export const OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_STORE_VERSION =
  "operator_approved_handoff_context_update_store.v0.1" as const;
export const OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE =
  "project:augnes" as const;

export type OperatorApprovedHandoffContextUpdateDecision =
  "approve_for_future_write";

export interface OperatorApprovedHandoffContextUpdateChecklistConfirmations {
  [approvalRequirement: string]: true;
}

export interface OperatorApprovedHandoffContextUpdateOperatorApproval {
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: OperatorApprovedHandoffContextUpdateChecklistConfirmations;
}

export interface OperatorApprovedHandoffContextUpdateOperatorApprovalInput
  extends OperatorApprovedHandoffContextUpdateOperatorApproval {
  operator_decision: OperatorApprovedHandoffContextUpdateDecision;
}

export interface OperatorApprovedHandoffContextUpdateWriteInput {
  decision_preview: HandoffContextUpdateOperatorDecisionPreview;
  operator_approval: OperatorApprovedHandoffContextUpdateOperatorApprovalInput;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface OperatorApprovedHandoffContextUpdateDecisionPreviewRefs {
  preview_version: string;
  decision_preview_status: string;
  recommended_operator_decision: string;
  write_ready: boolean;
  preview_as_of: string;
  source_refs: string[];
}

export interface OperatorApprovedHandoffContextUpdateApprovedCandidateMaterial {
  selected_ref_add_candidates: HandoffContextUpdateCandidate[];
  selected_ref_reinforcement_candidates: HandoffContextUpdateCandidate[];
  warning_update_candidates: HandoffContextUpdateCandidate[];
  context_diet_candidates: HandoffContextUpdateCandidate[];
  keep_unknown_candidates: HandoffContextUpdateCandidate[];
  expected_return_signal_candidates: HandoffContextUpdateCandidate[];
}

export interface OperatorApprovedHandoffContextUpdateCarryForwardMaterial {
  unresolved_blockers: string[];
  missing_evidence: string[];
  stop_if_missing_candidates: HandoffContextUpdateCandidate[];
  rejected_or_excluded_candidates: HandoffContextUpdateCandidate[];
}

export interface OperatorApprovedHandoffContextUpdateWriteValidation {
  validation_version: "operator_approved_handoff_context_update_write_validation.v0.1";
  write_ready_revalidated: true;
  required_approval_requirements: string[];
  checklist_confirmations_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  validation_hash: string;
}

export interface OperatorApprovedHandoffContextUpdateAuthorityBoundary {
  operator_approved_record_only: true;
  source_of_truth: false;
  durable_local_record: true;
  can_write_db: boolean;
  can_write_handoff_context_update_record: boolean;
  can_write_operator_approved_handoff_context_update_record: boolean;
  can_persist_general_operator_decision: false;
  can_mutate_live_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_write_continuity_relay: false;
  can_update_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
  can_write_dogfood_ledger: false;
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

export interface OperatorApprovedHandoffContextUpdateNoSideEffects {
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
  continuity_relay_written: false;
  current_working_perspective_updated: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  memory_mutated: false;
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

export interface OperatorApprovedHandoffContextUpdateRecord {
  record_version: typeof OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE;
  operator_decision: OperatorApprovedHandoffContextUpdateDecision;
  operator_approval: OperatorApprovedHandoffContextUpdateOperatorApproval;
  source_refs: string[];
  decision_preview_refs: OperatorApprovedHandoffContextUpdateDecisionPreviewRefs;
  update_preview_refs: HandoffContextUpdateOperatorDecisionUpdatePreviewRefs;
  approved_candidate_material: OperatorApprovedHandoffContextUpdateApprovedCandidateMaterial;
  carry_forward_material: OperatorApprovedHandoffContextUpdateCarryForwardMaterial;
  evidence_summary: HandoffContextUpdateOperatorDecisionPreview["evidence_summary"];
  write_validation: OperatorApprovedHandoffContextUpdateWriteValidation;
  authority_boundary: OperatorApprovedHandoffContextUpdateAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface OperatorApprovedHandoffContextUpdateWriteReceipt {
  receipt_version: typeof OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_WRITE_RECEIPT_VERSION;
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
  no_side_effects: OperatorApprovedHandoffContextUpdateNoSideEffects;
}

export type OperatorApprovedHandoffContextUpdateWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface OperatorApprovedHandoffContextUpdateStoreResult {
  store_version: typeof OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_STORE_VERSION;
  scope: typeof OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE;
  status: OperatorApprovedHandoffContextUpdateWriteStatus;
  ok: boolean;
  record: OperatorApprovedHandoffContextUpdateRecord | null;
  records: OperatorApprovedHandoffContextUpdateRecord[];
  receipt: OperatorApprovedHandoffContextUpdateWriteReceipt;
  error_code: OperatorApprovedHandoffContextUpdateWriteStatus | null;
  no_side_effects: OperatorApprovedHandoffContextUpdateNoSideEffects;
}
