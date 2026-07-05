import type {
  DogfoodMetricSnapshotCandidateSummary,
  DogfoodMetricSnapshotPreview,
} from "./dogfood-metric-snapshot-preview";
import type {
  DOGFOOD_METRIC_SNAPSHOT_RECEIPT_VERSION,
  DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION,
  DOGFOOD_METRIC_SNAPSHOT_STORE_VERSION,
} from "./dogfood-metric-snapshot-write";

export const DOGFOOD_METRIC_SNAPSHOT_OPERATOR_DECISION_PREVIEW_VERSION =
  "dogfood_metric_snapshot_operator_decision_preview.v0.1" as const;

export interface DogfoodMetricSnapshotOperatorDecisionPreviewInput {
  dogfood_metric_snapshot_preview?: unknown;
  selected_metric_candidate_refs?: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export type DogfoodMetricSnapshotOperatorDecisionStatus =
  | "no_metric_snapshot_preview"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "needs_operator_judgment"
  | "ready_for_operator_decision"
  | "ready_for_future_metric_snapshot_write"
  | "keep_preview_only";

export type DogfoodMetricSnapshotRecommendedOperatorDecision =
  | "approve_for_dogfood_metric_snapshot_write"
  | "defer_until_reuse_outcome_records_supplied"
  | "defer_until_more_records_available"
  | "defer_until_evidence_supplied"
  | "defer_until_selected_metric_refs_supplied"
  | "defer_until_idempotency_supplied"
  | "resolve_blockers"
  | "reject_metric_snapshot_candidate"
  | "keep_as_candidate_only"
  | "request_more_evidence";

export type DogfoodMetricSnapshotAvailableOperatorDecision =
  | "approve_for_dogfood_metric_snapshot_write"
  | "defer"
  | "reject"
  | "keep_candidate"
  | "request_more_evidence";

export interface DogfoodMetricSnapshotDecisionWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_metric_snapshot_preview: true;
  requires_selected_metric_refs: true;
  requires_review_confirmation: true;
  requires_idempotency_key: true;
  requires_operator_ref: true;
  requires_source_refs: true;
  requires_evidence_refs: true;
  requires_no_blockers: true;
  requires_sufficient_metric_data: true;
  requires_read_only_metric_snapshot_preview: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
}

export interface DogfoodMetricSnapshotWouldWriteRecordPreview {
  proposed_record_kind: typeof DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION | null;
  proposed_receipt_kind: typeof DOGFOOD_METRIC_SNAPSHOT_RECEIPT_VERSION | null;
  proposed_store_kind: typeof DOGFOOD_METRIC_SNAPSHOT_STORE_VERSION | null;
  selected_metric_candidate_refs: string[];
  selectable_metric_candidate_refs: string[];
  selected_metric_candidate_summaries: DogfoodMetricSnapshotCandidateSummary[];
  metric_candidate_summaries: DogfoodMetricSnapshotCandidateSummary[];
  source_refs: string[];
  evidence_refs: string[];
  source_reuse_ledger_record_refs: string[];
  source_expected_observed_delta_record_refs: string[];
  metric_window: DogfoodMetricSnapshotPreview["metric_window"];
  aggregate_counts: DogfoodMetricSnapshotPreview["aggregate_counts"];
  reuse_quality_metrics: DogfoodMetricSnapshotPreview["reuse_quality_metrics"];
  handoff_quality_metrics: DogfoodMetricSnapshotPreview["handoff_quality_metrics"];
  expected_observed_quality_metrics: DogfoodMetricSnapshotPreview["expected_observed_quality_metrics"];
  verification_quality_metrics: DogfoodMetricSnapshotPreview["verification_quality_metrics"];
  context_diet_metrics: DogfoodMetricSnapshotPreview["context_diet_metrics"];
  metric_trend_candidates: DogfoodMetricSnapshotCandidateSummary[];
  insufficient_data_notes: string[];
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_confirmation_ref: string | null;
  review_summary: string;
}

export interface DogfoodMetricSnapshotDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_create_schema: false;
  can_write_dogfood_metric_snapshot: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
  can_write_reuse_outcome_ledger: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
  can_write_memory: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_current_working_perspective: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_send_handoff: false;
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

export interface DogfoodMetricSnapshotOperatorDecisionPreview {
  runtime: "augnes";
  preview_version: typeof DOGFOOD_METRIC_SNAPSHOT_OPERATOR_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: DogfoodMetricSnapshotOperatorDecisionStatus;
  recommended_operator_decision: DogfoodMetricSnapshotRecommendedOperatorDecision;
  available_operator_decisions: DogfoodMetricSnapshotAvailableOperatorDecision[];
  input_summary: {
    has_metric_snapshot_preview: boolean;
    metric_candidate_count: number;
    selectable_metric_candidate_ref_count: number;
    selected_metric_candidate_ref_count: number;
    would_write_metric_candidate_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    review_confirmation_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    requested_operator_ref_supplied: boolean;
  };
  source_status: {
    dogfood_metric_snapshot_preview:
      | "supplied"
      | "missing"
      | "wrong_version"
      | "malformed";
    metric_snapshot_authority_boundary: "valid_read_only" | "invalid" | "missing";
    selected_metric_candidate_refs: "supplied" | "missing" | "unknown_ref" | "unsafe";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
  };
  write_readiness: DogfoodMetricSnapshotDecisionWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_valid_metric_snapshot_preview: boolean;
    has_metric_candidate_material: boolean;
    has_selected_metric_candidate_refs: boolean;
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
  would_write_metric_snapshot_record_preview: DogfoodMetricSnapshotWouldWriteRecordPreview;
  selected_metric_candidates: DogfoodMetricSnapshotCandidateSummary[];
  candidate_carry_forward: {
    single_sample_candidates: DogfoodMetricSnapshotCandidateSummary[];
    insufficient_data_candidates: DogfoodMetricSnapshotCandidateSummary[];
  };
  review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: DogfoodMetricSnapshotDecisionAuthorityBoundary;
  fallback_reason: string | null;
  notes: string[];
}
