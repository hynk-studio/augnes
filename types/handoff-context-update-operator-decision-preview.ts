/**
 * Handoff Context Update Operator Decision Preview v0.1.
 *
 * This contract describes a read-only operator decision preview derived from
 * an already-built Handoff Context Update Preview. It does not rebuild
 * upstream relay/rationale/metric objects, persist decisions, write DB rows,
 * mutate handoff context, send handoffs, call providers/GitHub/Codex, or run
 * autonomous actions.
 */

import type {
  HandoffContextUpdateCandidate,
  HandoffContextUpdateCandidateStatus,
  HandoffContextUpdatePreview,
} from "./handoff-context-update-preview";

export const HANDOFF_CONTEXT_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION =
  "handoff_context_update_operator_decision_preview.v0.1" as const;

export type HandoffContextUpdateOperatorDecisionPreviewStatus =
  | "insufficient_data"
  | "blocked"
  | "ready_for_operator_review"
  | "ready_for_future_write";

export type HandoffContextUpdateRecommendedOperatorDecision =
  | "defer_until_evidence_supplied"
  | "defer_until_blockers_resolved"
  | "review_for_future_write"
  | "approve_for_future_write"
  | "keep_preview_only"
  | "reject_update_candidate";

export type HandoffContextUpdateAvailableOperatorDecision =
  | "defer_until_evidence_supplied"
  | "defer_until_blockers_resolved"
  | "review_for_future_write"
  | "approve_for_future_write"
  | "keep_preview_only"
  | "reject_update_candidate";

export interface HandoffContextUpdateOperatorDecisionPreview {
  preview_version: typeof HANDOFF_CONTEXT_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: HandoffContextUpdateOperatorDecisionPreviewStatus;
  recommended_operator_decision: HandoffContextUpdateRecommendedOperatorDecision;
  available_operator_decisions: HandoffContextUpdateAvailableOperatorDecision[];
  input_summary: HandoffContextUpdateOperatorDecisionInputSummary;
  update_preview_refs: HandoffContextUpdateOperatorDecisionUpdatePreviewRefs;
  source_status: HandoffContextUpdateOperatorDecisionSourceStatus;
  write_readiness: HandoffContextUpdateOperatorDecisionWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  evidence_summary: HandoffContextUpdateOperatorDecisionEvidenceSummary;
  would_write_preview: HandoffContextUpdateOperatorDecisionWouldWritePreview;
  would_not_write: string[];
  candidate_carry_forward: HandoffContextUpdateOperatorDecisionCarryForward;
  review_checklist: string[];
  non_goals: string[];
  authority_boundary: HandoffContextUpdateOperatorDecisionAuthorityBoundary;
}

export interface HandoffContextUpdateOperatorDecisionInputSummary {
  update_preview_ref: HandoffContextUpdatePreview["preview_version"] | null;
  update_preview_source_status: "supplied" | "missing" | "wrong_version";
  update_preview_candidate_status:
    | HandoffContextUpdateCandidateStatus
    | null;
  selected_ref_add_candidate_count: number;
  selected_ref_reinforcement_candidate_count: number;
  warning_candidate_count: number;
  context_diet_candidate_count: number;
  stop_if_missing_candidate_count: number;
  verification_required_candidate_count: number;
  expected_return_signal_candidate_count: number;
  unknown_candidate_count: number;
  total_candidate_count: number;
  candidate_material_present: boolean;
  blocking_reason_count: number;
  missing_evidence_count: number;
  source_preview_write_flags_all_false: boolean;
}

export interface HandoffContextUpdateOperatorDecisionUpdatePreviewRefs {
  update_preview_ref: string | null;
  update_preview_version: HandoffContextUpdatePreview["preview_version"] | null;
  update_preview_candidate_status:
    | HandoffContextUpdateCandidateStatus
    | null;
  source_refs: string[];
  evidence_refs: string[];
}

export interface HandoffContextUpdateOperatorDecisionSourceStatus {
  handoff_context_update_preview: "supplied" | "missing" | "wrong_version";
  candidate_status: HandoffContextUpdateCandidateStatus | null;
  authority_boundary: "valid_read_only" | "missing" | "invalid";
  source_write_readiness: "all_false" | "missing" | "unexpected_write_ready";
}

export interface HandoffContextUpdateOperatorDecisionWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_valid_update_preview: true;
  requires_candidate_material: true;
  requires_no_blockers: true;
  requires_no_missing_evidence: true;
  requires_no_unresolved_stop_or_verification: true;
  requires_selected_refs_evidence_backed: true;
  requires_selected_refs_not_unknown: true;
  requires_read_only_source_preview: true;
  requires_source_preview_no_write_performed: true;
  requires_operator_confirmation: true;
  current_blockers: string[];
  current_missing_evidence: string[];
}

export interface HandoffContextUpdateOperatorDecisionEvidenceSummary {
  has_update_preview: boolean;
  update_preview_version_valid: boolean;
  has_candidate_material: boolean;
  has_selected_ref_signal: boolean;
  has_warning_signal: boolean;
  has_context_diet_signal: boolean;
  has_stop_if_missing_signal: boolean;
  has_expected_return_signal: boolean;
  has_unknown_signal: boolean;
  has_missing_evidence: boolean;
  has_insufficient_data: boolean;
  source_authority_boundary_valid: boolean;
  source_write_readiness_false: boolean;
  evidence_refs: string[];
  missing_evidence: string[];
}

export interface HandoffContextUpdateOperatorDecisionWouldWritePreview {
  proposed_record_kind:
    | "handoff_context_update_write_candidate.v0.1"
    | null;
  selected_ref_add_candidates: HandoffContextUpdateCandidate[];
  selected_ref_reinforcement_candidates: HandoffContextUpdateCandidate[];
  warning_update_candidates: HandoffContextUpdateCandidate[];
  context_diet_candidates: HandoffContextUpdateCandidate[];
  keep_unknown_candidates: HandoffContextUpdateCandidate[];
  stop_if_missing_candidates: HandoffContextUpdateCandidate[];
  expected_return_signal_candidates: HandoffContextUpdateCandidate[];
  source_refs: string[];
  evidence_refs: string[];
  update_preview_ref: string | null;
  review_summary: string;
}

export interface HandoffContextUpdateOperatorDecisionCarryForward {
  selected_ref_update_candidates: HandoffContextUpdateCandidate[];
  warning_update_candidates: HandoffContextUpdateCandidate[];
  context_diet_candidates: HandoffContextUpdateCandidate[];
  keep_unknown_candidates: HandoffContextUpdateCandidate[];
  stop_if_missing_candidates: HandoffContextUpdateCandidate[];
  expected_return_signal_candidates: HandoffContextUpdateCandidate[];
  unresolved_blockers: string[];
  missing_evidence: string[];
}

export interface HandoffContextUpdateOperatorDecisionAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_write_handoff_context: false;
  can_write_selected_refs: false;
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
