/**
 * Handoff Context Apply Operator Decision Preview v0.1.
 *
 * Read-only operator decision/readiness preview derived from an already-built
 * Handoff Context Apply Preview. This contract cannot apply material, persist
 * decisions, write DB rows, create schema, mutate live handoff context, send
 * handoffs, call providers/GitHub/Codex, or run autonomous actions.
 */

import type {
  HandoffContextApplyPreview,
  HandoffContextApplyPreviewCandidate,
  HandoffContextApplyPreviewConflictSummary,
  HandoffContextApplyPreviewStatus,
} from "./handoff-context-apply-preview";

export const HANDOFF_CONTEXT_APPLY_OPERATOR_DECISION_PREVIEW_VERSION =
  "handoff_context_apply_operator_decision_preview.v0.1" as const;

export type HandoffContextApplyOperatorDecisionPreviewStatus =
  | "insufficient_data"
  | "blocked"
  | "ready_for_operator_review"
  | "ready_for_future_apply_write"
  | "keep_preview_only";

export type HandoffContextApplyRecommendedOperatorDecision =
  | "defer_until_record_material_supplied"
  | "defer_until_blockers_resolved"
  | "review_for_future_apply_write"
  | "approve_for_future_apply_write"
  | "keep_preview_only"
  | "reject_apply_candidate";

export type HandoffContextApplyAvailableOperatorDecision =
  | "defer_until_record_material_supplied"
  | "defer_until_blockers_resolved"
  | "review_for_future_apply_write"
  | "approve_for_future_apply_write"
  | "keep_preview_only"
  | "reject_apply_candidate";

export interface HandoffContextApplyOperatorDecisionPreviewInput {
  apply_preview?: unknown;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export interface HandoffContextApplyOperatorDecisionPreview {
  preview_version: typeof HANDOFF_CONTEXT_APPLY_OPERATOR_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: HandoffContextApplyOperatorDecisionPreviewStatus;
  recommended_operator_decision: HandoffContextApplyRecommendedOperatorDecision;
  available_operator_decisions: HandoffContextApplyAvailableOperatorDecision[];
  input_summary: HandoffContextApplyOperatorDecisionInputSummary;
  source_status: HandoffContextApplyOperatorDecisionSourceStatus;
  readiness: HandoffContextApplyOperatorDecisionReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  insufficient_data_reasons: string[];
  missing_evidence: string[];
  conflict_summary: HandoffContextApplyPreviewConflictSummary;
  evidence_summary: HandoffContextApplyOperatorDecisionEvidenceSummary;
  would_apply_preview: HandoffContextApplyOperatorDecisionWouldApplyPreview;
  would_not_apply: string[];
  candidate_carry_forward: HandoffContextApplyOperatorDecisionCarryForward;
  review_checklist: string[];
  non_goals: string[];
  authority_boundary: HandoffContextApplyOperatorDecisionAuthorityBoundary;
}

export interface HandoffContextApplyOperatorDecisionInputSummary {
  has_apply_preview: boolean;
  apply_preview_status: HandoffContextApplyPreviewStatus | null;
  selected_record_ref: string | null;
  selected_full_record_supplied: boolean;
  apply_candidate_count: number;
  selected_ref_add_count: number;
  selected_ref_reinforce_count: number;
  warning_update_count: number;
  context_deprioritize_count: number;
  context_exclude_count: number;
  keep_unknown_count: number;
  expected_return_update_count: number;
  carry_forward_stop_count: number;
  rejected_or_excluded_note_count: number;
  blocker_count: number;
  insufficient_data_count: number;
  conflict_count: number;
  missing_evidence_count: number;
}

export interface HandoffContextApplyOperatorDecisionSourceStatus {
  apply_preview: "supplied" | "missing" | "wrong_version";
  apply_preview_status: HandoffContextApplyPreviewStatus | null;
  authority_boundary: "valid_read_only" | "invalid" | "missing";
  apply_preview_write_authority: "all_false" | "invalid";
}

export interface HandoffContextApplyOperatorDecisionReadiness {
  ready_for_operator_review: boolean;
  ready_for_future_apply_write: boolean;
  requires_apply_preview: true;
  requires_full_record_material: true;
  requires_apply_candidates: true;
  requires_no_blockers: true;
  requires_no_missing_evidence: true;
  requires_no_unknown_selected_refs: true;
  requires_no_duplicate_selected_ref_adds: true;
  requires_no_selected_ref_missing_evidence: true;
  requires_no_problem_records: true;
  requires_read_only_apply_preview: true;
  requires_operator_confirmation: true;
  current_blockers: string[];
  current_missing_evidence: string[];
}

export interface HandoffContextApplyOperatorDecisionEvidenceSummary {
  has_apply_preview: boolean;
  apply_preview_version_valid: boolean;
  has_selected_record: boolean;
  has_full_record_material: boolean;
  has_apply_candidates: boolean;
  has_source_refs: boolean;
  has_evidence_refs: boolean;
  has_missing_evidence: boolean;
  has_conflicts: boolean;
  has_problem_records: boolean;
  all_apply_candidates_evidence_backed: boolean;
  no_live_handoff_mutation_confirmed: boolean;
  no_handoff_send_confirmed: boolean;
  no_provider_github_codex_confirmed: boolean;
  authority_boundary_valid: boolean;
  source_refs: string[];
  evidence_refs: string[];
  missing_evidence: string[];
  problem_record_ids: string[];
}

export interface HandoffContextApplyOperatorDecisionWouldApplyPreview {
  proposed_record_kind: "handoff_context_apply_write_candidate.v0.1" | null;
  selected_refs_to_add: HandoffContextApplyPreviewCandidate[];
  selected_refs_to_reinforce: HandoffContextApplyPreviewCandidate[];
  warnings_to_add_or_strengthen: HandoffContextApplyPreviewCandidate[];
  context_refs_to_deprioritize: HandoffContextApplyPreviewCandidate[];
  context_refs_to_exclude: HandoffContextApplyPreviewCandidate[];
  expected_return_signal_updates: HandoffContextApplyPreviewCandidate[];
  source_refs: string[];
  evidence_refs: string[];
  selected_record_ref: string | null;
  review_summary: string;
}

export interface HandoffContextApplyOperatorDecisionCarryForward {
  keep_unknown_as_review_only: HandoffContextApplyPreviewCandidate[];
  carry_forward_stop_if_missing: HandoffContextApplyPreviewCandidate[];
  rejected_or_excluded_review_notes: HandoffContextApplyPreviewCandidate[];
  duplicate_selected_refs: string[];
  unknown_selected_ref_attempts: string[];
  stale_or_noisy_candidates: string[];
  missing_evidence_candidates: string[];
  unresolved_blockers: string[];
}

export interface HandoffContextApplyOperatorDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_create_schema: false;
  can_write_handoff_context_update_record: false;
  can_write_operator_approved_handoff_context_update_record: false;
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

export type HandoffContextApplyOperatorDecisionSourcePreview =
  HandoffContextApplyPreview;
