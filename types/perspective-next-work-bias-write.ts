import type {
  PerspectiveNextWorkBiasEntry,
  PerspectiveNextWorkBiasScopedWritePreview,
} from "./perspective-next-work-bias-scoped-write-preview";

export const PERSPECTIVE_NEXT_WORK_BIAS_RECORD_VERSION =
  "perspective_next_work_bias_record.v0.1" as const;
export const PERSPECTIVE_NEXT_WORK_BIAS_RECEIPT_VERSION =
  "perspective_next_work_bias_receipt.v0.1" as const;
export const PERSPECTIVE_NEXT_WORK_BIAS_STORE_VERSION =
  "perspective_next_work_bias_store.v0.1" as const;
export const PERSPECTIVE_NEXT_WORK_BIAS_SCOPE = "project:augnes" as const;

export interface PerspectiveNextWorkBiasWriteInput {
  scoped_write_preview: PerspectiveNextWorkBiasScopedWritePreview;
  operator_approval: PerspectiveNextWorkBiasOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface PerspectiveNextWorkBiasOperatorApproval {
  operator_decision: "approve_for_perspective_next_work_bias_record";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface PerspectiveNextWorkBiasRecordAuthorityProfile {
  durable_local_perspective_next_work_bias: true;
  source_of_truth: false;
  local_project_next_work_bias_only: true;
  persistence_horizon: "local_project_next_work_bias_record";
  next_work_bias_write_performed: true;
  perspective_unit_write_performed: false;
  current_working_perspective_update_performed: false;
  continuity_relay_update_performed: false;
  handoff_context_mutation_performed: false;
  memory_promotion_performed: false;
  metric_update_performed: false;
}

export interface PerspectiveNextWorkBiasNoPromotionPerformed {
  perspective_unit_written: false;
  current_working_perspective_updated: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  handoff_context_applied: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
  memory_written: false;
  memory_promoted: false;
  dogfood_metrics_written: false;
  dogfood_metrics_global_state_updated: false;
  dogfood_metric_snapshot_written: false;
  reuse_outcome_ledger_written: false;
  expected_observed_delta_written: false;
  work_episode_written: false;
}

export interface PerspectiveNextWorkBiasWriteValidation {
  validation_version: "perspective_next_work_bias_write_validation.v0.1";
  scoped_write_preview_revalidated: true;
  selected_next_work_bias_refs_revalidated: true;
  next_work_bias_entries_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_memory_perspective_relay_handoff_promotion: false;
  refused_metric_or_upstream_write: false;
  validation_hash: string;
}

export interface PerspectiveNextWorkBiasWriteAuthorityBoundary {
  durable_local_perspective_next_work_bias: true;
  source_of_truth: false;
  local_project_next_work_bias_only: true;
  can_write_db: boolean;
  can_create_perspective_next_work_bias_record: boolean;
  can_create_perspective_next_work_bias_receipt: boolean;
  can_write_next_work_bias: boolean;
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

export interface PerspectiveNextWorkBiasNoSideEffects {
  perspective_next_work_bias_record_written: boolean;
  perspective_next_work_bias_receipt_written: boolean;
  perspective_next_work_bias_persisted: boolean;
  next_work_bias_written: boolean;
  perspective_unit_written: false;
  current_working_perspective_updated: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  handoff_context_applied: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
  memory_written: false;
  memory_promoted: false;
  memory_mutated: false;
  dogfood_metrics_written: false;
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
  browser_observed: false;
  crawler_or_browser_observer_created: false;
  workbench_action_button_rendered: false;
}

export interface PerspectiveNextWorkBiasRecord {
  record_version: typeof PERSPECTIVE_NEXT_WORK_BIAS_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof PERSPECTIVE_NEXT_WORK_BIAS_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  source_perspective_relay_update_write_contract_preview_ref: string | null;
  source_perspective_relay_update_decision_record_refs: string[];
  selected_next_work_bias_candidate_refs: string[];
  next_work_bias_entries: PerspectiveNextWorkBiasEntry[];
  next_work_bias_entry_count: number;
  authority_profile: PerspectiveNextWorkBiasRecordAuthorityProfile;
  review_status: "recorded_as_scoped_perspective_next_work_bias";
  persistence_horizon: "local_project_next_work_bias_record";
  no_promotion_performed: PerspectiveNextWorkBiasNoPromotionPerformed;
  write_validation: PerspectiveNextWorkBiasWriteValidation;
  authority_boundary: PerspectiveNextWorkBiasWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface PerspectiveNextWorkBiasReceipt {
  receipt_version: typeof PERSPECTIVE_NEXT_WORK_BIAS_RECEIPT_VERSION;
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
  no_side_effects: PerspectiveNextWorkBiasNoSideEffects;
}

export type PerspectiveNextWorkBiasWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface PerspectiveNextWorkBiasStoreResult {
  store_version: typeof PERSPECTIVE_NEXT_WORK_BIAS_STORE_VERSION;
  scope: typeof PERSPECTIVE_NEXT_WORK_BIAS_SCOPE;
  status: PerspectiveNextWorkBiasWriteStatus;
  ok: boolean;
  record: PerspectiveNextWorkBiasRecord | null;
  records: PerspectiveNextWorkBiasRecord[];
  receipt: PerspectiveNextWorkBiasReceipt;
  error_code: PerspectiveNextWorkBiasWriteStatus | null;
  no_side_effects: PerspectiveNextWorkBiasNoSideEffects;
}
