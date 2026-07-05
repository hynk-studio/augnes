import type {
  ContinuityRelayEntry,
  ContinuityRelayScopedWritePreview,
} from "./continuity-relay-scoped-write-preview";

export const CONTINUITY_RELAY_RECORD_VERSION =
  "continuity_relay_record.v0.1" as const;
export const CONTINUITY_RELAY_RECEIPT_VERSION =
  "continuity_relay_receipt.v0.1" as const;
export const CONTINUITY_RELAY_STORE_VERSION =
  "continuity_relay_store.v0.1" as const;
export const CONTINUITY_RELAY_SCOPE = "project:augnes" as const;

export interface ContinuityRelayWriteInput {
  scoped_write_preview: ContinuityRelayScopedWritePreview;
  operator_approval: ContinuityRelayOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface ContinuityRelayOperatorApproval {
  operator_decision: "approve_for_continuity_relay_record";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface ContinuityRelayRecordAuthorityProfile {
  durable_local_continuity_relay: true;
  source_of_truth: false;
  local_project_continuity_relay_only: true;
  persistence_horizon: "local_project_continuity_relay_record";
  continuity_relay_write_performed: true;
  perspective_unit_write_performed: false;
  next_work_bias_write_performed: false;
  current_working_perspective_update_performed: false;
  continuity_relay_update_performed: false;
  handoff_context_mutation_performed: false;
  memory_promotion_performed: false;
  metric_update_performed: false;
}

export interface ContinuityRelayNoPromotionPerformed {
  perspective_unit_written: false;
  next_work_bias_written: false;
  current_working_perspective_updated: false;
  current_working_perspective_mutated: false;
  continuity_relay_updated: false;
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

export interface ContinuityRelayWriteValidation {
  validation_version: "continuity_relay_write_validation.v0.1";
  scoped_write_preview_revalidated: true;
  selected_continuity_relay_refs_revalidated: true;
  continuity_relay_entries_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_memory_perspective_relay_handoff_promotion: false;
  refused_metric_or_upstream_write: false;
  validation_hash: string;
}

export interface ContinuityRelayWriteAuthorityBoundary {
  durable_local_continuity_relay: true;
  source_of_truth: false;
  local_project_continuity_relay_only: true;
  can_write_db: boolean;
  can_create_continuity_relay_record: boolean;
  can_create_continuity_relay_receipt: boolean;
  can_write_continuity_relay: boolean;
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
  can_render_workbench_action_button: false;
  notes: string[];
}

export interface ContinuityRelayNoSideEffects {
  continuity_relay_record_written: boolean;
  continuity_relay_receipt_written: boolean;
  continuity_relay_persisted: boolean;
  continuity_relay_written: boolean;
  perspective_unit_written: false;
  next_work_bias_written: false;
  current_working_perspective_updated: false;
  current_working_perspective_mutated: false;
  continuity_relay_updated: false;
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

export interface ContinuityRelayRecord {
  record_version: typeof CONTINUITY_RELAY_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof CONTINUITY_RELAY_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  source_perspective_relay_update_write_contract_preview_ref: string | null;
  source_perspective_relay_update_decision_record_refs: string[];
  related_perspective_unit_record_refs: string[];
  related_next_work_bias_record_refs: string[];
  selected_continuity_relay_candidate_refs: string[];
  continuity_relay_entries: ContinuityRelayEntry[];
  continuity_relay_entry_count: number;
  authority_profile: ContinuityRelayRecordAuthorityProfile;
  review_status: "recorded_as_scoped_continuity_relay";
  persistence_horizon: "local_project_continuity_relay_record";
  no_promotion_performed: ContinuityRelayNoPromotionPerformed;
  write_validation: ContinuityRelayWriteValidation;
  authority_boundary: ContinuityRelayWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface ContinuityRelayReceipt {
  receipt_version: typeof CONTINUITY_RELAY_RECEIPT_VERSION;
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
  no_side_effects: ContinuityRelayNoSideEffects;
}

export type ContinuityRelayWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface ContinuityRelayStoreResult {
  store_version: typeof CONTINUITY_RELAY_STORE_VERSION;
  scope: typeof CONTINUITY_RELAY_SCOPE;
  status: ContinuityRelayWriteStatus;
  ok: boolean;
  record: ContinuityRelayRecord | null;
  records: ContinuityRelayRecord[];
  receipt: ContinuityRelayReceipt;
  error_code: ContinuityRelayWriteStatus | null;
  no_side_effects: ContinuityRelayNoSideEffects;
}
