import type { DogfoodMetricSnapshotOperatorDecisionPreview } from "./dogfood-metric-snapshot-decision";

export const DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION =
  "dogfood_metric_snapshot_record.v0.1" as const;
export const DOGFOOD_METRIC_SNAPSHOT_RECEIPT_VERSION =
  "dogfood_metric_snapshot_receipt.v0.1" as const;
export const DOGFOOD_METRIC_SNAPSHOT_STORE_VERSION =
  "dogfood_metric_snapshot_store.v0.1" as const;
export const DOGFOOD_METRIC_SNAPSHOT_SCOPE = "project:augnes" as const;

export interface DogfoodMetricSnapshotWriteInput {
  decision_preview: DogfoodMetricSnapshotOperatorDecisionPreview;
  operator_approval: DogfoodMetricSnapshotOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface DogfoodMetricSnapshotOperatorApproval {
  operator_decision: "approve_for_dogfood_metric_snapshot_write";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface DogfoodMetricSnapshotRecordAuthorityProfile {
  durable_local_dogfood_metric_snapshot: true;
  source_of_truth: false;
  local_project_metric_snapshot_only: true;
  persistence_horizon: "local_project_dogfood_metric_snapshot";
  global_metric_update_performed: false;
  perspective_promotion_performed: false;
  memory_promotion_performed: false;
}

export interface DogfoodMetricSnapshotNoPromotionPerformed {
  dogfood_metrics_global_state_updated: false;
  reuse_outcome_ledger_written: false;
  expected_observed_delta_written: false;
  work_episode_written: false;
  memory_mutated: false;
  current_working_perspective_updated: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
}

export interface DogfoodMetricSnapshotWriteValidation {
  validation_version: "dogfood_metric_snapshot_write_validation.v0.1";
  decision_preview_revalidated: true;
  selected_metric_candidate_refs_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_memory_perspective_handoff_promotion: false;
  refused_global_metric_or_upstream_write: false;
  validation_hash: string;
}

export interface DogfoodMetricSnapshotWriteAuthorityBoundary {
  durable_local_dogfood_metric_snapshot: true;
  source_of_truth: false;
  local_project_metric_snapshot_only: true;
  can_write_db: boolean;
  can_create_dogfood_metric_snapshot_record: boolean;
  can_create_dogfood_metric_snapshot_receipt: boolean;
  can_write_dogfood_metric_snapshot: boolean;
  can_update_global_dogfood_metrics: false;
  can_write_reuse_outcome_ledger: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
  can_write_memory: false;
  can_mutate_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
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

export interface DogfoodMetricSnapshotNoSideEffects {
  dogfood_metric_snapshot_record_written: boolean;
  dogfood_metric_snapshot_receipt_written: boolean;
  dogfood_metric_snapshot_persisted: boolean;
  dogfood_metrics_global_state_updated: false;
  reuse_outcome_ledger_written: false;
  expected_observed_delta_written: false;
  work_episode_written: false;
  memory_mutated: false;
  current_working_perspective_updated: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
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

export interface DogfoodMetricSnapshotRecord {
  record_version: typeof DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof DOGFOOD_METRIC_SNAPSHOT_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  source_reuse_ledger_record_refs: string[];
  source_expected_observed_delta_record_refs: string[];
  metric_window: DogfoodMetricSnapshotOperatorDecisionPreview["would_write_metric_snapshot_record_preview"]["metric_window"];
  selected_metric_candidate_refs: string[];
  aggregate_counts: DogfoodMetricSnapshotOperatorDecisionPreview["would_write_metric_snapshot_record_preview"]["aggregate_counts"];
  reuse_quality_metrics: DogfoodMetricSnapshotOperatorDecisionPreview["would_write_metric_snapshot_record_preview"]["reuse_quality_metrics"];
  handoff_quality_metrics: DogfoodMetricSnapshotOperatorDecisionPreview["would_write_metric_snapshot_record_preview"]["handoff_quality_metrics"];
  expected_observed_quality_metrics: DogfoodMetricSnapshotOperatorDecisionPreview["would_write_metric_snapshot_record_preview"]["expected_observed_quality_metrics"];
  verification_quality_metrics: DogfoodMetricSnapshotOperatorDecisionPreview["would_write_metric_snapshot_record_preview"]["verification_quality_metrics"];
  context_diet_metrics: DogfoodMetricSnapshotOperatorDecisionPreview["would_write_metric_snapshot_record_preview"]["context_diet_metrics"];
  metric_trend_candidates: DogfoodMetricSnapshotOperatorDecisionPreview["would_write_metric_snapshot_record_preview"]["metric_trend_candidates"];
  insufficient_data_notes: string[];
  authority_profile: DogfoodMetricSnapshotRecordAuthorityProfile;
  review_status: "recorded_as_dogfood_metric_snapshot";
  persistence_horizon: "local_project_dogfood_metric_snapshot";
  no_promotion_performed: DogfoodMetricSnapshotNoPromotionPerformed;
  write_validation: DogfoodMetricSnapshotWriteValidation;
  authority_boundary: DogfoodMetricSnapshotWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface DogfoodMetricSnapshotReceipt {
  receipt_version: typeof DOGFOOD_METRIC_SNAPSHOT_RECEIPT_VERSION;
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
  no_side_effects: DogfoodMetricSnapshotNoSideEffects;
}

export type DogfoodMetricSnapshotWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface DogfoodMetricSnapshotStoreResult {
  store_version: typeof DOGFOOD_METRIC_SNAPSHOT_STORE_VERSION;
  scope: typeof DOGFOOD_METRIC_SNAPSHOT_SCOPE;
  status: DogfoodMetricSnapshotWriteStatus;
  ok: boolean;
  record: DogfoodMetricSnapshotRecord | null;
  records: DogfoodMetricSnapshotRecord[];
  receipt: DogfoodMetricSnapshotReceipt;
  error_code: DogfoodMetricSnapshotWriteStatus | null;
  no_side_effects: DogfoodMetricSnapshotNoSideEffects;
}
