import type { PerspectiveRelayUpdateCandidateBridgePreview } from "./perspective-relay-update-candidate-bridge-preview";
import type { PerspectiveRelayUpdateDecisionRecordReview } from "./perspective-relay-update-decision-record-review";
import type { PerspectiveRelayUpdateWriteContractPreview } from "./perspective-relay-update-write-contract-preview";
import type { PerspectiveNextWorkBiasRecordReview } from "./perspective-next-work-bias-record-review";
import type { PerspectiveUnitRecordReview } from "./perspective-unit-record-review";

export const CONTINUITY_RELAY_SCOPED_WRITE_PREVIEW_VERSION =
  "continuity_relay_scoped_write_preview.v0.1" as const;

export interface ContinuityRelayScopedWritePreviewInput {
  perspective_relay_update_write_contract_preview?: unknown;
  perspective_relay_update_decision_record_review?: unknown;
  perspective_relay_update_candidate_bridge_preview?: unknown;
  perspective_next_work_bias_record_review?: unknown;
  perspective_unit_record_review?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type ContinuityRelayScopedWritePreviewStatus =
  | "no_perspective_relay_update_write_contract"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_continuity_relay_record_write"
  | "keep_preview_only";

export type ContinuityRelayScopedWriteRecommendedNextAction =
  | "supply_perspective_relay_update_write_contract"
  | "review_continuity_relay_scoped_write"
  | "write_continuity_relay_record"
  | "resolve_continuity_relay_blockers"
  | "keep_preview_only";

export type ContinuityRelayDirective =
  | "preserve_anchor"
  | "warn_anchor"
  | "stop_if_missing"
  | "next_focus"
  | "relay_update_suggestion";

export type ContinuityRelayBucket =
  | "continuity_relay_preserve_anchor_candidates"
  | "continuity_relay_warn_anchor_candidates"
  | "continuity_relay_stop_if_missing_candidates"
  | "continuity_relay_next_focus_candidates"
  | "continuity_relay_update_suggestions"
  | "preserve_anchor_candidates"
  | "warn_anchor_candidates"
  | "stop_if_missing_candidates"
  | "next_focus_candidates"
  | "relay_update_suggestions";

export interface ContinuityRelayEntry {
  continuity_relay_ref: string;
  source_candidate_ref: string;
  bucket: ContinuityRelayBucket;
  relay_directive: ContinuityRelayDirective;
  summary: string;
  evidence_refs: string[];
  source_refs: string[];
  review_pressure: "low" | "medium" | "high";
  status:
    | "active_scoped_continuity_relay_anchor"
    | "scoped_continuity_relay_warning"
    | "scoped_continuity_relay_stop_condition"
    | "scoped_continuity_relay_next_focus"
    | "scoped_continuity_relay_update_suggestion";
  persistence_horizon: "local_project_continuity_relay_record";
}

export interface ContinuityRelayScopedWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_perspective_relay_update_write_contract: true;
  requires_perspective_relay_update_decision_record: true;
  requires_selected_continuity_relay_refs: true;
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

export interface ContinuityRelayWouldWriteRecordPreview {
  proposed_record_kind: "continuity_relay_record.v0.1" | null;
  proposed_receipt_kind: "continuity_relay_receipt.v0.1" | null;
  proposed_store_kind: "continuity_relay_store.v0.1" | null;
  selected_continuity_relay_candidate_refs: string[];
  selectable_continuity_relay_candidate_refs: string[];
  non_writable_perspective_unit_candidate_refs: string[];
  non_writable_next_work_bias_candidate_refs: string[];
  continuity_relay_entries: ContinuityRelayEntry[];
  related_perspective_unit_record_refs: string[];
  related_next_work_bias_record_refs: string[];
  source_refs: string[];
  evidence_refs: string[];
  source_perspective_relay_update_write_contract_preview_ref: string | null;
  source_perspective_relay_update_decision_record_refs: string[];
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_confirmation_ref: string | null;
  review_summary: string;
}

export interface ContinuityRelayScopedWriteAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_create_continuity_relay_record: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_continuity_relay: false;
  can_update_current_working_perspective: false;
  can_mutate_current_working_perspective: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_update_global_dogfood_metrics: false;
  can_write_dogfood_metrics: false;
  can_write_dogfood_metric_snapshot: false;
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
  can_render_workbench_action_button: false;
  notes: string[];
}

export interface ContinuityRelayScopedWritePreview {
  preview_version: typeof CONTINUITY_RELAY_SCOPED_WRITE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  scoped_write_preview_status: ContinuityRelayScopedWritePreviewStatus;
  recommended_next_action: ContinuityRelayScopedWriteRecommendedNextAction;
  input_summary: {
    has_write_contract_preview: boolean;
    has_decision_record_review: boolean;
    has_valid_decision_records: boolean;
    has_perspective_unit_record_review: boolean;
    has_next_work_bias_record_review: boolean;
    related_perspective_unit_record_count: number;
    related_next_work_bias_record_count: number;
    selected_continuity_relay_candidate_count: number;
    non_writable_perspective_unit_candidate_count: number;
    non_writable_next_work_bias_candidate_count: number;
    continuity_relay_entry_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    review_confirmation_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    requested_operator_ref_supplied: boolean;
  };
  source_status: {
    perspective_relay_update_write_contract_preview:
      | "supplied"
      | "missing"
      | "wrong_version"
      | "malformed";
    perspective_relay_update_decision_record_review:
      | "supplied"
      | "missing"
      | "invalid"
      | "malformed";
    selected_continuity_relay_refs:
      | "supplied"
      | "missing"
      | "unknown_ref"
      | "unsafe";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
  };
  write_readiness: ContinuityRelayScopedWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_valid_write_contract_preview: boolean;
    has_valid_decision_record_material: boolean;
    has_selected_continuity_relay_refs: boolean;
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
  would_write_continuity_relay_record_preview: ContinuityRelayWouldWriteRecordPreview;
  selected_continuity_relay_candidates: string[];
  continuity_relay_entries: ContinuityRelayEntry[];
  related_perspective_unit_record_refs: string[];
  related_next_work_bias_record_refs: string[];
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: ContinuityRelayScopedWriteAuthorityBoundary;
}

export type ContinuityRelayScopedWriteContractPreview =
  PerspectiveRelayUpdateWriteContractPreview;
export type ContinuityRelayScopedWriteDecisionRecordReview =
  PerspectiveRelayUpdateDecisionRecordReview;
export type ContinuityRelayScopedWriteCandidateBridgePreview =
  PerspectiveRelayUpdateCandidateBridgePreview;
export type ContinuityRelayScopedWriteNextWorkBiasRecordReview =
  PerspectiveNextWorkBiasRecordReview;
export type ContinuityRelayScopedWritePerspectiveUnitRecordReview =
  PerspectiveUnitRecordReview;
