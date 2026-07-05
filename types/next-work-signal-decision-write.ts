import type { NextWorkSignalOperatorDecisionPreview } from "./next-work-signal-decision";

export const NEXT_WORK_SIGNAL_DECISION_RECORD_VERSION =
  "next_work_signal_decision_record.v0.1" as const;
export const NEXT_WORK_SIGNAL_DECISION_RECEIPT_VERSION =
  "next_work_signal_decision_receipt.v0.1" as const;
export const NEXT_WORK_SIGNAL_DECISION_STORE_VERSION =
  "next_work_signal_decision_store.v0.1" as const;
export const NEXT_WORK_SIGNAL_DECISION_SCOPE = "project:augnes" as const;

export interface NextWorkSignalDecisionWriteInput {
  decision_preview: NextWorkSignalOperatorDecisionPreview;
  operator_approval: NextWorkSignalDecisionOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface NextWorkSignalDecisionOperatorApproval {
  operator_decision: "approve_for_next_work_signal_record";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface NextWorkSignalDecisionRecordAuthorityProfile {
  durable_local_next_work_signal_decision: true;
  source_of_truth: false;
  local_project_next_work_signal_only: true;
  persistence_horizon: "local_project_next_work_signal_record";
  perspective_promotion_performed: false;
  relay_update_performed: false;
  memory_promotion_performed: false;
}

export interface NextWorkSignalDecisionNoPromotionPerformed {
  perspective_unit_written: false;
  next_work_bias_written: false;
  current_working_perspective_updated: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
  memory_mutated: false;
  dogfood_metrics_global_state_updated: false;
  dogfood_metric_snapshot_written: false;
  reuse_outcome_ledger_written: false;
  expected_observed_delta_written: false;
  work_episode_written: false;
}

export interface NextWorkSignalDecisionWriteValidation {
  validation_version: "next_work_signal_decision_write_validation.v0.1";
  decision_preview_revalidated: true;
  selected_signal_refs_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_memory_perspective_relay_handoff_promotion: false;
  refused_metric_or_upstream_write: false;
  validation_hash: string;
}

export interface NextWorkSignalDecisionWriteAuthorityBoundary {
  durable_local_next_work_signal_decision: true;
  source_of_truth: false;
  local_project_next_work_signal_only: true;
  can_write_db: boolean;
  can_create_next_work_signal_decision_record: boolean;
  can_create_next_work_signal_decision_receipt: boolean;
  can_write_next_work_signal_decision: boolean;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
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
  notes: string[];
}

export interface NextWorkSignalDecisionNoSideEffects {
  next_work_signal_decision_record_written: boolean;
  next_work_signal_decision_receipt_written: boolean;
  next_work_signal_decision_persisted: boolean;
  perspective_unit_written: false;
  next_work_bias_written: false;
  current_working_perspective_updated: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
  memory_mutated: false;
  dogfood_metrics_global_state_updated: false;
  dogfood_metric_snapshot_written: false;
  reuse_outcome_ledger_written: false;
  expected_observed_delta_written: false;
  work_episode_written: false;
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

export interface NextWorkSignalDecisionRecord {
  record_version: typeof NEXT_WORK_SIGNAL_DECISION_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof NEXT_WORK_SIGNAL_DECISION_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  source_metric_snapshot_record_refs: string[];
  source_reuse_ledger_record_refs: string[];
  source_expected_observed_delta_record_refs: string[];
  source_next_work_signal_refresh_preview_ref: string | null;
  selected_signal_refs: string[];
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
  authority_profile: NextWorkSignalDecisionRecordAuthorityProfile;
  review_status: "recorded_as_next_work_signal_decision";
  persistence_horizon: "local_project_next_work_signal_record";
  no_promotion_performed: NextWorkSignalDecisionNoPromotionPerformed;
  write_validation: NextWorkSignalDecisionWriteValidation;
  authority_boundary: NextWorkSignalDecisionWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface NextWorkSignalDecisionReceipt {
  receipt_version: typeof NEXT_WORK_SIGNAL_DECISION_RECEIPT_VERSION;
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
  no_side_effects: NextWorkSignalDecisionNoSideEffects;
}

export type NextWorkSignalDecisionWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface NextWorkSignalDecisionStoreResult {
  store_version: typeof NEXT_WORK_SIGNAL_DECISION_STORE_VERSION;
  scope: typeof NEXT_WORK_SIGNAL_DECISION_SCOPE;
  status: NextWorkSignalDecisionWriteStatus;
  ok: boolean;
  record: NextWorkSignalDecisionRecord | null;
  records: NextWorkSignalDecisionRecord[];
  receipt: NextWorkSignalDecisionReceipt;
  error_code: NextWorkSignalDecisionWriteStatus | null;
  no_side_effects: NextWorkSignalDecisionNoSideEffects;
}
