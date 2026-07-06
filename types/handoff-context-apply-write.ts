import type {
  AppliedHandoffContext,
  AppliedHandoffContextEntry,
  HandoffContextApplyPlan,
} from "./handoff-context-apply-slice-preview";
import type { HandoffContextApplyOperatorDecisionPreview } from "./handoff-context-apply-slice-decision";

export const HANDOFF_CONTEXT_APPLY_RECORD_VERSION =
  "handoff_context_apply_record.v0.1" as const;
export const HANDOFF_CONTEXT_APPLY_RECEIPT_VERSION =
  "handoff_context_apply_receipt.v0.1" as const;
export const APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION =
  "applied_handoff_context_snapshot.v0.1" as const;
export const HANDOFF_CONTEXT_APPLY_STORE_VERSION =
  "handoff_context_apply_store.v0.1" as const;
export const HANDOFF_CONTEXT_APPLY_WRITE_SCOPE = "project:augnes" as const;

export interface HandoffContextApplyWriteInput {
  apply_decision_preview: HandoffContextApplyOperatorDecisionPreview;
  operator_approval: HandoffContextApplyOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface HandoffContextApplyOperatorApproval {
  operator_decision: "approve_for_handoff_context_apply_record";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface HandoffContextApplyAuthorityProfile {
  durable_local_handoff_context_apply_record: true;
  durable_local_applied_handoff_context_snapshot: true;
  source_of_truth: false;
  local_project_handoff_context_apply_only: true;
  persistence_horizon: "local_project_handoff_context_apply_store";
  handoff_context_apply_record_written: true;
  applied_handoff_context_snapshot_written: true;
  handoff_context_update_applied_to_local_snapshot: true;
  live_handoff_context_mutated: false;
  handoff_sent: false;
  selected_refs_written_to_live_handoff: false;
  handoff_packet_copy_exported: false;
  handoff_packet_sent: false;
  api_perspective_current_route_modified: false;
  upstream_current_working_perspective_source_tables_mutated: false;
  applied_current_working_perspective_snapshot_written: false;
  current_working_perspective_apply_record_written: false;
  route_integration_contract_record_written: false;
  handoff_context_update_contract_record_written: false;
  perspective_unit_write_performed: false;
  next_work_bias_write_performed: false;
  continuity_relay_write_performed: false;
  continuity_relay_update_performed: false;
  memory_promotion_performed: false;
  metric_update_performed: false;
}

export interface HandoffContextApplyNoHandoffSend {
  live_handoff_context_updated: false;
  live_handoff_context_mutated: false;
  handoff_context_applied_live: false;
  handoff_context_mutated: false;
  handoff_sent: false;
  selected_refs_written_to_live_handoff: false;
  handoff_packet_copy_exported: false;
  handoff_packet_sent: false;
  api_perspective_current_route_modified: false;
  current_working_perspective_route_response_replaced: false;
  upstream_current_working_perspective_source_tables_updated: false;
  upstream_current_working_perspective_source_tables_mutated: false;
  applied_current_working_perspective_snapshot_written: false;
  current_working_perspective_apply_record_written: false;
  current_working_perspective_update_contract_record_written: false;
  route_integration_contract_record_written: false;
  handoff_context_update_contract_record_written: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  continuity_relay_updated: false;
  live_relay_state_applied: false;
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

export interface HandoffContextApplyWriteValidation {
  validation_version: "handoff_context_apply_write_validation.v0.1";
  operator_decision_preview_revalidated: true;
  applied_handoff_context_snapshot_revalidated: true;
  apply_plan_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_live_handoff_send_or_copy_export: false;
  refused_metric_or_upstream_write: false;
  validation_hash: string;
}

export interface HandoffContextApplyWriteAuthorityBoundary {
  durable_local_handoff_context_apply_record: true;
  durable_local_applied_handoff_context_snapshot: true;
  source_of_truth: false;
  local_project_handoff_context_apply_only: true;
  can_write_db: boolean;
  can_create_handoff_context_apply_record: boolean;
  can_create_handoff_context_apply_receipt: boolean;
  can_create_applied_handoff_context_snapshot: boolean;
  can_apply_handoff_context_update_to_local_snapshot: boolean;
  can_apply_handoff_context_update_live: false;
  can_mutate_handoff_context: false;
  can_send_handoff: false;
  can_copy_export_handoff_packet: false;
  can_write_selected_refs_to_live_handoff: false;
  can_modify_api_perspective_current_route: false;
  can_replace_current_working_perspective_route_response: false;
  can_update_upstream_current_working_perspective_source_tables: false;
  can_write_applied_current_working_perspective_snapshot: false;
  can_write_current_working_perspective_apply_record: false;
  can_write_current_working_perspective_update_contract_record: false;
  can_write_route_integration_contract_record: false;
  can_write_handoff_context_update_contract_record: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_continuity_relay: false;
  can_update_continuity_relay: false;
  can_apply_live_relay_state: false;
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

export interface HandoffContextApplyNoSideEffects
  extends HandoffContextApplyNoHandoffSend {
  handoff_context_apply_record_written: boolean;
  handoff_context_apply_receipt_written: boolean;
  handoff_context_apply_persisted: boolean;
  applied_handoff_context_snapshot_written: boolean;
  handoff_context_update_applied_to_local_snapshot: boolean;
}

export interface AppliedHandoffContextSnapshot {
  snapshot_version: typeof APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION;
  applied_handoff_context_snapshot_ref: string;
  scope: typeof HANDOFF_CONTEXT_APPLY_WRITE_SCOPE;
  as_of: string;
  source_handoff_context_update_contract_record_ref: string;
  source_route_integration_read_ref: string | null;
  source_runtime_current_working_perspective_ref: string | null;
  source_applied_snapshot_ref: string | null;
  applied_handoff_context: AppliedHandoffContext;
  applied_handoff_context_entries: AppliedHandoffContextEntry[];
  applied_entry_count: number;
  source_refs: string[];
  evidence_refs: string[];
  authority_boundary: HandoffContextApplyWriteAuthorityBoundary;
}

export interface HandoffContextApplyRecord {
  record_version: typeof HANDOFF_CONTEXT_APPLY_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof HANDOFF_CONTEXT_APPLY_WRITE_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  source_handoff_context_update_contract_record_ref: string;
  source_handoff_context_update_contract_record_refs: string[];
  source_route_integration_read_ref: string | null;
  source_runtime_current_working_perspective_ref: string | null;
  source_applied_snapshot_ref: string | null;
  applied_snapshot_version: typeof APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION;
  applied_handoff_context_snapshot_ref: string;
  applied_handoff_context: AppliedHandoffContext;
  applied_handoff_context_fingerprint: string;
  applied_snapshot: AppliedHandoffContextSnapshot;
  applied_handoff_context_entries: AppliedHandoffContextEntry[];
  applied_handoff_context_entry_count: number;
  applied_handoff_section_counts: Record<string, number>;
  apply_plan: HandoffContextApplyPlan;
  authority_profile: HandoffContextApplyAuthorityProfile;
  review_status: "applied_as_scoped_handoff_context_snapshot";
  persistence_horizon: "local_project_handoff_context_apply_store";
  no_handoff_send_performed: HandoffContextApplyNoHandoffSend;
  write_validation: HandoffContextApplyWriteValidation;
  authority_boundary: HandoffContextApplyWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface HandoffContextApplyReceipt {
  receipt_version: typeof HANDOFF_CONTEXT_APPLY_RECEIPT_VERSION;
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
  no_side_effects: HandoffContextApplyNoSideEffects;
}

export type HandoffContextApplyWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface HandoffContextApplyStoreResult {
  store_version: typeof HANDOFF_CONTEXT_APPLY_STORE_VERSION;
  scope: typeof HANDOFF_CONTEXT_APPLY_WRITE_SCOPE;
  status: HandoffContextApplyWriteStatus;
  ok: boolean;
  record: HandoffContextApplyRecord | null;
  records: HandoffContextApplyRecord[];
  applied_snapshot: AppliedHandoffContextSnapshot | null;
  applied_snapshots: AppliedHandoffContextSnapshot[];
  receipt: HandoffContextApplyReceipt;
  error_code: HandoffContextApplyWriteStatus | null;
  no_side_effects: HandoffContextApplyNoSideEffects;
}
