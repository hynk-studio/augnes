/**
 * Handoff Context Apply Write Contract Preview v0.1.
 *
 * Read-only preview of the future contract required for a separately scoped
 * operator-approved handoff context apply write. This contract cannot persist
 * decisions, create records, create schema, write DB rows, mutate live handoff
 * context, send handoffs, call providers/GitHub/Codex, or run autonomous
 * actions.
 */

import type {
  HandoffContextApplyOperatorDecisionPreview,
  HandoffContextApplyOperatorDecisionPreviewStatus,
} from "./handoff-context-apply-operator-decision-preview";
import type { HandoffContextApplyPreviewCandidate } from "./handoff-context-apply-preview";

export const HANDOFF_CONTEXT_APPLY_WRITE_CONTRACT_PREVIEW_VERSION =
  "handoff_context_apply_write_contract_preview.v0.1" as const;

export type HandoffContextApplyWriteContractPreviewStatus =
  | "insufficient_data"
  | "blocked"
  | "contract_candidates_available"
  | "ready_for_operator_review"
  | "ready_for_future_write_scope"
  | "keep_preview_only";

export type HandoffContextApplyWriteContractRecommendedNextAction =
  | "supply_apply_decision_preview"
  | "resolve_apply_decision_blockers"
  | "supply_current_handoff_packet_fingerprint"
  | "supply_operator_approval_material"
  | "review_future_write_contract"
  | "prepare_separate_apply_write_slice"
  | "keep_preview_only"
  | "reject_apply_write_candidate";

export interface HandoffContextApplyWriteContractPreviewInput {
  apply_operator_decision_preview?: unknown;
  current_handoff_packet_fingerprint?: string;
  current_handoff_context_ref?: string;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export interface HandoffContextApplyWriteContractPreview {
  preview_version: typeof HANDOFF_CONTEXT_APPLY_WRITE_CONTRACT_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  contract_preview_status: HandoffContextApplyWriteContractPreviewStatus;
  recommended_next_action: HandoffContextApplyWriteContractRecommendedNextAction;
  input_summary: HandoffContextApplyWriteContractInputSummary;
  source_status: HandoffContextApplyWriteContractSourceStatus;
  future_write_contract: HandoffContextApplyFutureWriteContract;
  would_write_material_preview: HandoffContextApplyWouldWriteMaterialPreview;
  carry_forward_review_only_material: HandoffContextApplyWriteContractCarryForward;
  readiness: HandoffContextApplyWriteContractReadiness;
  refusal_reasons: string[];
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  missing_evidence: string[];
  evidence_summary: HandoffContextApplyWriteContractEvidenceSummary;
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: HandoffContextApplyWriteContractAuthorityBoundary;
}

export interface HandoffContextApplyWriteContractInputSummary {
  has_apply_operator_decision_preview: boolean;
  decision_preview_status: HandoffContextApplyOperatorDecisionPreviewStatus | null;
  recommended_operator_decision:
    | HandoffContextApplyOperatorDecisionPreview["recommended_operator_decision"]
    | null;
  ready_for_future_apply_write: boolean;
  selected_record_ref: string | null;
  current_handoff_packet_fingerprint_supplied: boolean;
  current_handoff_context_ref_supplied: boolean;
  requested_operator_ref_supplied: boolean;
  requested_idempotency_key_supplied: boolean;
  would_apply_candidate_count: number;
  selected_ref_add_count: number;
  selected_ref_reinforce_count: number;
  warning_update_count: number;
  context_deprioritize_count: number;
  context_exclude_count: number;
  expected_return_update_count: number;
  carry_forward_review_only_count: number;
  blocking_reason_count: number;
  insufficient_data_reason_count: number;
  refusal_reason_count: number;
}

export interface HandoffContextApplyWriteContractSourceStatus {
  apply_operator_decision_preview:
    | "supplied"
    | "missing"
    | "wrong_version"
    | "malformed";
  decision_preview_status: HandoffContextApplyOperatorDecisionPreviewStatus | null;
  authority_boundary: "valid_read_only" | "invalid" | "missing";
  decision_preview_write_authority: "all_false" | "invalid";
}

export interface HandoffContextApplyFutureWriteContract {
  proposed_record_kind: "handoff_context_apply_write_contract.v0.1";
  proposed_receipt_kind: "handoff_context_apply_write_contract_receipt.v0.1";
  required_operator_approval_payload: string[];
  required_idempotency: string[];
  required_current_handoff_context_guard: string[];
  required_current_handoff_packet_fingerprint: string[];
  required_selected_record_ref: string[];
  required_apply_decision_preview_ref: string[];
  required_source_refs: string[];
  required_evidence_refs: string[];
  required_no_side_effects_receipt: string[];
  required_refusal_checks: string[];
}

export interface HandoffContextApplyWouldWriteMaterialPreview {
  selected_refs_to_add: HandoffContextApplyPreviewCandidate[];
  selected_refs_to_reinforce: HandoffContextApplyPreviewCandidate[];
  warnings_to_add_or_strengthen: HandoffContextApplyPreviewCandidate[];
  context_refs_to_deprioritize: HandoffContextApplyPreviewCandidate[];
  context_refs_to_exclude: HandoffContextApplyPreviewCandidate[];
  expected_return_signal_updates: HandoffContextApplyPreviewCandidate[];
  source_refs: string[];
  evidence_refs: string[];
  selected_record_ref: string | null;
  apply_decision_preview_ref: string | null;
  current_handoff_context_ref: string | null;
  current_handoff_packet_fingerprint: string | null;
}

export interface HandoffContextApplyWriteContractCarryForward {
  keep_unknown_as_review_only: HandoffContextApplyPreviewCandidate[];
  carry_forward_stop_if_missing: HandoffContextApplyPreviewCandidate[];
  rejected_or_excluded_review_notes: HandoffContextApplyPreviewCandidate[];
  duplicate_selected_refs: string[];
  unknown_selected_ref_attempts: string[];
  stale_or_noisy_candidates: string[];
  missing_evidence_candidates: string[];
  unresolved_blockers: string[];
}

export interface HandoffContextApplyWriteContractReadiness {
  ready_for_operator_review: boolean;
  ready_for_future_write_scope: boolean;
  requires_apply_operator_decision_preview: true;
  requires_ready_for_future_apply_write: true;
  requires_current_handoff_packet_fingerprint: true;
  requires_current_handoff_context_ref: true;
  requires_operator_approval_payload: true;
  requires_public_safe_operator_ref: true;
  requires_public_safe_idempotency_key: true;
  requires_no_blockers: true;
  requires_no_insufficient_data: true;
  requires_no_missing_evidence: true;
  requires_no_review_only_material_in_live_write: true;
  requires_read_only_decision_preview: true;
  current_blockers: string[];
  current_insufficient_data: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
}

export interface HandoffContextApplyWriteContractEvidenceSummary {
  has_apply_operator_decision_preview: boolean;
  decision_preview_version_valid: boolean;
  decision_preview_ready_for_future_apply_write: boolean;
  has_would_write_material: boolean;
  has_selected_record_ref: boolean;
  has_source_refs: boolean;
  has_evidence_refs: boolean;
  has_current_handoff_packet_fingerprint: boolean;
  has_current_handoff_context_ref: boolean;
  has_operator_ref: boolean;
  has_idempotency_key: boolean;
  has_missing_evidence: boolean;
  has_blockers: boolean;
  has_insufficient_data: boolean;
  authority_boundary_valid: boolean;
  decision_preview_write_authority_false: boolean;
  no_live_handoff_mutation_confirmed: boolean;
  no_handoff_send_confirmed: boolean;
  no_provider_github_codex_confirmed: boolean;
  source_refs: string[];
  evidence_refs: string[];
  missing_evidence: string[];
}

export interface HandoffContextApplyWriteContractAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_apply_write_contract_record: false;
  can_create_apply_write_receipt: false;
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
