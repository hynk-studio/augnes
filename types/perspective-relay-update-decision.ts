import type {
  PERSPECTIVE_RELAY_UPDATE_DECISION_RECEIPT_VERSION,
  PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_VERSION,
  PERSPECTIVE_RELAY_UPDATE_DECISION_STORE_VERSION,
} from "./perspective-relay-update-decision-write";
import type { PerspectiveRelayUpdateCandidateBridgePreview } from "./perspective-relay-update-candidate-bridge-preview";

export const PERSPECTIVE_RELAY_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION =
  "perspective_relay_update_operator_decision_preview.v0.1" as const;

export interface PerspectiveRelayUpdateOperatorDecisionPreviewInput {
  perspective_relay_update_candidate_bridge_preview?: unknown;
  selected_perspective_unit_candidate_refs?: string[];
  selected_next_work_bias_candidate_refs?: string[];
  selected_continuity_relay_candidate_refs?: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export type PerspectiveRelayUpdateOperatorDecisionStatus =
  | "no_perspective_relay_update_candidate_bridge_preview"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "needs_operator_judgment"
  | "ready_for_operator_decision"
  | "ready_for_future_perspective_relay_update_decision_record_write"
  | "keep_preview_only";

export type PerspectiveRelayUpdateRecommendedOperatorDecision =
  | "approve_for_perspective_relay_update_decision_record"
  | "defer_until_candidate_bridge_supplied"
  | "defer_until_evidence_supplied"
  | "defer_until_selected_candidate_refs_supplied"
  | "defer_until_idempotency_supplied"
  | "resolve_blockers"
  | "reject_perspective_relay_update_candidate"
  | "keep_as_candidate_only"
  | "request_more_evidence";

export type PerspectiveRelayUpdateAvailableOperatorDecision =
  | "approve_for_perspective_relay_update_decision_record"
  | "defer"
  | "reject"
  | "keep_candidate"
  | "request_more_evidence";

export type PerspectiveRelayUpdateCandidateTarget =
  | "perspective_unit"
  | "next_work_bias"
  | "continuity_relay";

export type PerspectiveRelayUpdateCandidateBucket =
  | "perspective_unit_reinforce_candidates"
  | "perspective_unit_weaken_or_warn_candidates"
  | "perspective_unit_retire_or_deprioritize_candidates"
  | "perspective_unit_split_or_review_candidates"
  | "next_work_bias_preserve_next_time"
  | "next_work_bias_warn_next_time"
  | "next_work_bias_drop_or_deprioritize"
  | "next_work_bias_verification_bias"
  | "next_work_bias_context_diet_bias"
  | "next_work_bias_handoff_quality_bias"
  | "continuity_relay_preserve_anchor_candidates"
  | "continuity_relay_warn_anchor_candidates"
  | "continuity_relay_stop_if_missing_candidates"
  | "continuity_relay_next_focus_candidates"
  | "continuity_relay_update_suggestions";

export interface PerspectiveRelayUpdateCandidateSummary {
  candidate_ref: string;
  target: PerspectiveRelayUpdateCandidateTarget;
  bucket: PerspectiveRelayUpdateCandidateBucket;
  label: string;
  summary: string;
  evidence_refs: string[];
  review_pressure: "low" | "medium" | "high";
}

export interface PerspectiveRelayUpdateDecisionWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_perspective_relay_update_candidate_bridge_preview: true;
  requires_selected_candidate_refs: true;
  requires_review_confirmation: true;
  requires_idempotency_key: true;
  requires_operator_ref: true;
  requires_source_refs: true;
  requires_evidence_refs: true;
  requires_no_blockers: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
}

export interface PerspectiveRelayUpdateSelectedCandidateRefsByTarget {
  perspective_unit: string[];
  next_work_bias: string[];
  continuity_relay: string[];
}

export interface PerspectiveRelayUpdateWouldWriteDecisionRecordPreview {
  proposed_record_kind: typeof PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_VERSION | null;
  proposed_receipt_kind: typeof PERSPECTIVE_RELAY_UPDATE_DECISION_RECEIPT_VERSION | null;
  proposed_store_kind: typeof PERSPECTIVE_RELAY_UPDATE_DECISION_STORE_VERSION | null;
  selected_candidate_refs: string[];
  selectable_candidate_refs: string[];
  selected_candidate_refs_by_target: PerspectiveRelayUpdateSelectedCandidateRefsByTarget;
  selectable_candidate_refs_by_target: PerspectiveRelayUpdateSelectedCandidateRefsByTarget;
  selected_candidate_summaries: PerspectiveRelayUpdateCandidateSummary[];
  candidate_summaries: PerspectiveRelayUpdateCandidateSummary[];
  source_refs: string[];
  evidence_refs: string[];
  source_perspective_relay_update_candidate_bridge_preview_ref: string | null;
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_confirmation_ref: string | null;
  review_summary: string;
}

export interface PerspectiveRelayUpdateDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_create_perspective_relay_update_decision_record: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_current_working_perspective: false;
  can_mutate_current_working_perspective: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_send_handoff: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
  can_write_reuse_outcome_ledger: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
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

export interface PerspectiveRelayUpdateOperatorDecisionPreview {
  runtime: "augnes";
  preview_version: typeof PERSPECTIVE_RELAY_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: PerspectiveRelayUpdateOperatorDecisionStatus;
  recommended_operator_decision: PerspectiveRelayUpdateRecommendedOperatorDecision;
  available_operator_decisions: PerspectiveRelayUpdateAvailableOperatorDecision[];
  input_summary: {
    has_perspective_relay_update_candidate_bridge_preview: boolean;
    candidate_count: number;
    selectable_candidate_ref_count: number;
    selected_candidate_ref_count: number;
    selected_perspective_unit_candidate_ref_count: number;
    selected_next_work_bias_candidate_ref_count: number;
    selected_continuity_relay_candidate_ref_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    review_confirmation_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    requested_operator_ref_supplied: boolean;
  };
  source_status: {
    perspective_relay_update_candidate_bridge_preview:
      | "supplied"
      | "missing"
      | "wrong_version"
      | "malformed";
    bridge_authority_boundary: "valid_read_only" | "invalid" | "missing";
    selected_candidate_refs: "supplied" | "missing" | "unknown_ref" | "unsafe";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
  };
  write_readiness: PerspectiveRelayUpdateDecisionWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_valid_perspective_relay_update_candidate_bridge_preview: boolean;
    has_candidate_material: boolean;
    has_selected_candidate_refs: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_review_confirmation: boolean;
    has_idempotency_key: boolean;
    has_operator_ref: boolean;
    has_missing_evidence: boolean;
    has_refusal_reasons: boolean;
    has_unsafe_refs: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    unsafe_refs: string[];
  };
  would_write_perspective_relay_update_decision_record_preview: PerspectiveRelayUpdateWouldWriteDecisionRecordPreview;
  selected_perspective_unit_candidates: PerspectiveRelayUpdateCandidateSummary[];
  selected_next_work_bias_candidates: PerspectiveRelayUpdateCandidateSummary[];
  selected_continuity_relay_candidates: PerspectiveRelayUpdateCandidateSummary[];
  review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: PerspectiveRelayUpdateDecisionAuthorityBoundary;
}

export type PerspectiveRelayUpdateDecisionCandidateBridgePreview =
  PerspectiveRelayUpdateCandidateBridgePreview;
