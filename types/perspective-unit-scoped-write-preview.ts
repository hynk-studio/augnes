import type { PerspectiveRelayUpdateCandidateBridgePreview } from "./perspective-relay-update-candidate-bridge-preview";
import type { PerspectiveRelayUpdateDecisionRecordReview } from "./perspective-relay-update-decision-record-review";
import type { PerspectiveRelayUpdateWriteContractPreview } from "./perspective-relay-update-write-contract-preview";
import type { PerspectiveNextWorkBiasRecordReview } from "./perspective-next-work-bias-record-review";

export const PERSPECTIVE_UNIT_SCOPED_WRITE_PREVIEW_VERSION =
  "perspective_unit_scoped_write_preview.v0.1" as const;

export interface PerspectiveUnitScopedWritePreviewInput {
  perspective_relay_update_write_contract_preview?: unknown;
  perspective_relay_update_decision_record_review?: unknown;
  perspective_relay_update_candidate_bridge_preview?: unknown;
  perspective_next_work_bias_record_review?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type PerspectiveUnitScopedWritePreviewStatus =
  | "no_perspective_relay_update_write_contract"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_perspective_unit_record_write"
  | "keep_preview_only";

export type PerspectiveUnitScopedWriteRecommendedNextAction =
  | "supply_perspective_relay_update_write_contract"
  | "review_perspective_unit_scoped_write"
  | "write_perspective_unit_record"
  | "resolve_perspective_unit_blockers"
  | "keep_preview_only";

export type PerspectiveUnitDirective =
  | "reinforce"
  | "weaken_or_warn"
  | "retire_or_deprioritize"
  | "split_or_review";

export type PerspectiveUnitBucket =
  | "perspective_unit_reinforce_candidates"
  | "perspective_unit_weaken_or_warn_candidates"
  | "perspective_unit_retire_or_deprioritize_candidates"
  | "perspective_unit_split_or_review_candidates";

export interface PerspectiveUnitEntry {
  perspective_unit_ref: string;
  source_candidate_ref: string;
  bucket: PerspectiveUnitBucket;
  lifecycle_directive: PerspectiveUnitDirective;
  summary: string;
  evidence_refs: string[];
  source_refs: string[];
  review_pressure: "low" | "medium" | "high";
  status:
    | "active_scoped_perspective_unit"
    | "scoped_perspective_unit_warning"
    | "scoped_perspective_unit_retirement_candidate"
    | "scoped_perspective_unit_review_candidate";
  persistence_horizon: "local_project_perspective_unit_record";
}

export interface PerspectiveUnitScopedWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_perspective_relay_update_write_contract: true;
  requires_perspective_relay_update_decision_record: true;
  requires_selected_perspective_unit_refs: true;
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

export interface PerspectiveUnitWouldWriteRecordPreview {
  proposed_record_kind: "perspective_unit_record.v0.1" | null;
  proposed_receipt_kind: "perspective_unit_receipt.v0.1" | null;
  proposed_store_kind: "perspective_unit_store.v0.1" | null;
  selected_perspective_unit_candidate_refs: string[];
  selectable_perspective_unit_candidate_refs: string[];
  non_writable_next_work_bias_candidate_refs: string[];
  non_writable_continuity_relay_candidate_refs: string[];
  perspective_unit_entries: PerspectiveUnitEntry[];
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

export interface PerspectiveUnitScopedWriteAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_create_perspective_unit_record: false;
  can_write_next_work_bias: false;
  can_write_perspective_unit: false;
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

export interface PerspectiveUnitScopedWritePreview {
  preview_version: typeof PERSPECTIVE_UNIT_SCOPED_WRITE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  scoped_write_preview_status: PerspectiveUnitScopedWritePreviewStatus;
  recommended_next_action: PerspectiveUnitScopedWriteRecommendedNextAction;
  input_summary: {
    has_write_contract_preview: boolean;
    has_decision_record_review: boolean;
    has_valid_decision_records: boolean;
    has_next_work_bias_record_review: boolean;
    related_next_work_bias_record_count: number;
    selected_perspective_unit_candidate_count: number;
    non_writable_next_work_bias_candidate_count: number;
    non_writable_continuity_relay_candidate_count: number;
    perspective_unit_entry_count: number;
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
    selected_perspective_unit_refs:
      | "supplied"
      | "missing"
      | "unknown_ref"
      | "unsafe";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
  };
  write_readiness: PerspectiveUnitScopedWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_valid_write_contract_preview: boolean;
    has_valid_decision_record_material: boolean;
    has_selected_perspective_unit_refs: boolean;
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
  would_write_perspective_unit_record_preview: PerspectiveUnitWouldWriteRecordPreview;
  selected_perspective_unit_candidates: string[];
  perspective_unit_entries: PerspectiveUnitEntry[];
  related_next_work_bias_record_refs: string[];
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: PerspectiveUnitScopedWriteAuthorityBoundary;
}

export type PerspectiveUnitScopedWriteContractPreview =
  PerspectiveRelayUpdateWriteContractPreview;
export type PerspectiveUnitScopedWriteDecisionRecordReview =
  PerspectiveRelayUpdateDecisionRecordReview;
export type PerspectiveUnitScopedWriteCandidateBridgePreview =
  PerspectiveRelayUpdateCandidateBridgePreview;
export type PerspectiveUnitScopedWriteNextWorkBiasRecordReview =
  PerspectiveNextWorkBiasRecordReview;
