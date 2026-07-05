import type { DogfoodMetricSnapshotPreview } from "./dogfood-metric-snapshot-preview";
import type { DogfoodMetricSnapshotRecordReview } from "./dogfood-metric-snapshot-record-review";
import type {
  NEXT_WORK_SIGNAL_DECISION_RECEIPT_VERSION,
  NEXT_WORK_SIGNAL_DECISION_RECORD_VERSION,
  NEXT_WORK_SIGNAL_DECISION_STORE_VERSION,
} from "./next-work-signal-decision-write";
import type { NextWorkSignalRefreshPreview } from "./next-work-signal-refresh-preview";

export const NEXT_WORK_SIGNAL_OPERATOR_DECISION_PREVIEW_VERSION =
  "next_work_signal_operator_decision_preview.v0.1" as const;

export interface NextWorkSignalOperatorDecisionPreviewInput {
  next_work_signal_refresh_preview?: unknown;
  dogfood_metric_snapshot_record_review?: unknown;
  dogfood_metric_snapshot_preview?: unknown;
  selected_signal_refs?: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export type NextWorkSignalOperatorDecisionStatus =
  | "no_next_work_signal_refresh_preview"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "needs_operator_judgment"
  | "ready_for_operator_decision"
  | "ready_for_future_next_work_signal_record_write"
  | "keep_preview_only";

export type NextWorkSignalRecommendedOperatorDecision =
  | "approve_for_next_work_signal_record"
  | "defer_until_metric_snapshot_supplied"
  | "defer_until_evidence_supplied"
  | "defer_until_selected_signal_refs_supplied"
  | "defer_until_idempotency_supplied"
  | "resolve_blockers"
  | "reject_next_work_signal_candidate"
  | "keep_as_candidate_only"
  | "request_more_evidence";

export type NextWorkSignalAvailableOperatorDecision =
  | "approve_for_next_work_signal_record"
  | "defer"
  | "reject"
  | "keep_candidate"
  | "request_more_evidence";

export type NextWorkSignalCandidateBucket =
  | "preserve_context_refs"
  | "warn_context_refs"
  | "drop_or_deprioritize_context_refs"
  | "verification_focus_candidates"
  | "expected_observed_followup_candidates"
  | "handoff_quality_focus_candidates"
  | "context_diet_candidates"
  | "review_burden_reduction_candidates";

export interface NextWorkSignalCandidateSummary {
  signal_ref: string;
  bucket: NextWorkSignalCandidateBucket;
  label: string;
  summary: string;
  evidence_refs: string[];
  review_pressure: "low" | "medium" | "high";
}

export interface NextWorkSignalDecisionWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_next_work_signal_refresh_preview: true;
  requires_selected_signal_refs: true;
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

export interface NextWorkSignalWouldWriteRecordPreview {
  proposed_record_kind: typeof NEXT_WORK_SIGNAL_DECISION_RECORD_VERSION | null;
  proposed_receipt_kind: typeof NEXT_WORK_SIGNAL_DECISION_RECEIPT_VERSION | null;
  proposed_store_kind: typeof NEXT_WORK_SIGNAL_DECISION_STORE_VERSION | null;
  selected_signal_refs: string[];
  selectable_signal_refs: string[];
  selected_signal_summaries: NextWorkSignalCandidateSummary[];
  signal_summaries: NextWorkSignalCandidateSummary[];
  source_refs: string[];
  evidence_refs: string[];
  source_metric_snapshot_record_refs: string[];
  source_reuse_ledger_record_refs: string[];
  source_expected_observed_delta_record_refs: string[];
  source_next_work_signal_refresh_preview_ref: string | null;
  preserve_context_refs: string[];
  warn_context_refs: string[];
  drop_or_deprioritize_context_refs: string[];
  verification_focus_candidates: string[];
  expected_observed_followup_candidates: string[];
  handoff_quality_focus_candidates: string[];
  context_diet_candidates: string[];
  review_burden_reduction_candidates: string[];
  unresolved_gap_candidates: string[];
  stale_or_misleading_context_warnings: string[];
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_confirmation_ref: string | null;
  review_summary: string;
}

export interface NextWorkSignalDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_create_next_work_signal_record: false;
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

export interface NextWorkSignalOperatorDecisionPreview {
  runtime: "augnes";
  preview_version: typeof NEXT_WORK_SIGNAL_OPERATOR_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: NextWorkSignalOperatorDecisionStatus;
  recommended_operator_decision: NextWorkSignalRecommendedOperatorDecision;
  available_operator_decisions: NextWorkSignalAvailableOperatorDecision[];
  input_summary: {
    has_next_work_signal_refresh_preview: boolean;
    signal_candidate_count: number;
    selectable_signal_ref_count: number;
    selected_signal_ref_count: number;
    would_write_signal_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    review_confirmation_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    requested_operator_ref_supplied: boolean;
  };
  refresh_preview_refs: {
    refresh_preview_version: string | null;
    refresh_preview_source_refs: string[];
  };
  metric_snapshot_refs: {
    metric_snapshot_preview_source_refs: string[];
    metric_snapshot_record_refs: string[];
  };
  source_status: {
    next_work_signal_refresh_preview:
      | "supplied"
      | "missing"
      | "wrong_version"
      | "malformed";
    refresh_authority_boundary: "valid_read_only" | "invalid" | "missing";
    selected_signal_refs: "supplied" | "missing" | "unknown_ref" | "unsafe";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
  };
  write_readiness: NextWorkSignalDecisionWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_valid_next_work_signal_refresh_preview: boolean;
    has_signal_candidate_material: boolean;
    has_selected_signal_refs: boolean;
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
  would_write_next_work_signal_record_preview: NextWorkSignalWouldWriteRecordPreview;
  selected_signal_candidates: NextWorkSignalCandidateSummary[];
  candidate_carry_forward: {
    verification_pressure_signals: NextWorkSignalCandidateSummary[];
    context_diet_signals: NextWorkSignalCandidateSummary[];
    warning_signals: NextWorkSignalCandidateSummary[];
  };
  review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: NextWorkSignalDecisionAuthorityBoundary;
  fallback_reason: string | null;
  notes: string[];
}

export type NextWorkSignalDecisionRefreshPreview =
  NextWorkSignalRefreshPreview;
export type NextWorkSignalDecisionMetricSnapshotPreview =
  DogfoodMetricSnapshotPreview;
export type NextWorkSignalDecisionMetricSnapshotRecordReview =
  DogfoodMetricSnapshotRecordReview;
