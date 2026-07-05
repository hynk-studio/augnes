import type { CurrentWorkingPerspective } from "./current-working-perspective";
import type { CurrentWorkingPerspectiveApplyOperatorDecisionPreview } from "./current-working-perspective-apply-decision";
import type { CurrentWorkingPerspectiveApplyPatchApplicationSummary } from "./current-working-perspective-apply-preview";

export const CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_VERSION =
  "current_working_perspective_apply_record.v0.1" as const;
export const CURRENT_WORKING_PERSPECTIVE_APPLY_RECEIPT_VERSION =
  "current_working_perspective_apply_receipt.v0.1" as const;
export const CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION =
  "current_working_perspective_applied_snapshot.v0.1" as const;
export const CURRENT_WORKING_PERSPECTIVE_APPLY_STORE_VERSION =
  "current_working_perspective_apply_store.v0.1" as const;
export const CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE =
  "project:augnes" as const;

export interface CurrentWorkingPerspectiveApplyWriteInput {
  apply_decision_preview: CurrentWorkingPerspectiveApplyOperatorDecisionPreview;
  operator_approval: CurrentWorkingPerspectiveApplyOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface CurrentWorkingPerspectiveApplyOperatorApproval {
  operator_decision: "approve_for_current_working_perspective_apply_record";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface CurrentWorkingPerspectiveApplyAuthorityProfile {
  durable_local_current_working_perspective_apply_record: true;
  durable_local_applied_current_working_perspective_snapshot: true;
  source_of_truth: false;
  local_project_current_working_perspective_apply_only: true;
  persistence_horizon: "local_project_current_working_perspective_apply_store";
  current_working_perspective_apply_record_written: true;
  applied_current_working_perspective_snapshot_written: true;
  current_working_perspective_update_applied_to_local_snapshot: true;
  upstream_current_working_perspective_source_tables_mutated: false;
  perspective_unit_write_performed: false;
  next_work_bias_write_performed: false;
  continuity_relay_write_performed: false;
  continuity_relay_update_performed: false;
  handoff_context_mutation_performed: false;
  memory_promotion_performed: false;
  metric_update_performed: false;
}

export interface CurrentWorkingPerspectiveApplyMutationBoundary {
  upstream_current_working_perspective_source_tables_updated: false;
  upstream_current_working_perspective_source_tables_mutated: false;
  current_working_perspective_route_response_replaced: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  continuity_relay_updated: false;
  live_relay_state_applied: false;
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

export interface CurrentWorkingPerspectiveApplyWriteValidation {
  validation_version: "current_working_perspective_apply_write_validation.v0.1";
  operator_decision_preview_revalidated: true;
  applied_snapshot_revalidated: true;
  patch_application_summary_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_upstream_cwp_relay_handoff_memory_promotion: false;
  refused_metric_or_upstream_write: false;
  validation_hash: string;
}

export interface CurrentWorkingPerspectiveApplyWriteAuthorityBoundary {
  durable_local_current_working_perspective_apply_record: true;
  durable_local_applied_current_working_perspective_snapshot: true;
  source_of_truth: false;
  local_project_current_working_perspective_apply_only: true;
  can_write_db: boolean;
  can_create_current_working_perspective_apply_record: boolean;
  can_create_current_working_perspective_apply_receipt: boolean;
  can_create_applied_current_working_perspective_snapshot: boolean;
  can_apply_current_working_perspective_update_to_local_snapshot: boolean;
  can_update_upstream_current_working_perspective_source_tables: false;
  can_mutate_upstream_current_working_perspective_source_tables: false;
  can_replace_current_working_perspective_route_response: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_continuity_relay: false;
  can_update_continuity_relay: false;
  can_apply_live_relay_state: false;
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

export interface CurrentWorkingPerspectiveApplyNoSideEffects {
  current_working_perspective_apply_record_written: boolean;
  current_working_perspective_apply_receipt_written: boolean;
  current_working_perspective_apply_persisted: boolean;
  applied_current_working_perspective_snapshot_written: boolean;
  current_working_perspective_update_applied_to_local_snapshot: boolean;
  upstream_current_working_perspective_source_tables_updated: false;
  upstream_current_working_perspective_source_tables_mutated: false;
  current_working_perspective_route_response_replaced: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  continuity_relay_updated: false;
  live_relay_state_applied: false;
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

export interface CurrentWorkingPerspectiveAppliedSnapshot {
  snapshot_version: typeof CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION;
  applied_snapshot_ref: string;
  scope: typeof CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE;
  as_of: string;
  source_contract_record_ref: string;
  source_current_working_perspective_ref: string | null;
  applied_current_working_perspective: CurrentWorkingPerspective;
  applied_patch_refs: string[];
  applied_patch_count: number;
  source_refs: string[];
  evidence_refs: string[];
  authority_boundary: CurrentWorkingPerspectiveApplyWriteAuthorityBoundary;
}

export interface CurrentWorkingPerspectiveApplyRecord {
  record_version: typeof CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  source_current_working_perspective_ref: string | null;
  source_current_working_perspective_update_contract_record_ref: string;
  source_current_working_perspective_update_contract_record_fingerprint:
    | string
    | null;
  applied_snapshot_version: typeof CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION;
  applied_snapshot_ref: string;
  applied_current_working_perspective: CurrentWorkingPerspective;
  applied_current_working_perspective_fingerprint: string;
  applied_snapshot: CurrentWorkingPerspectiveAppliedSnapshot;
  patch_application_summary: CurrentWorkingPerspectiveApplyPatchApplicationSummary;
  applied_patch_refs: string[];
  applied_patch_count: number;
  preserved_existing_cwp_ref: string | null;
  authority_profile: CurrentWorkingPerspectiveApplyAuthorityProfile;
  review_status: "applied_as_scoped_current_working_perspective_snapshot";
  persistence_horizon: "local_project_current_working_perspective_apply_store";
  mutation_boundary: CurrentWorkingPerspectiveApplyMutationBoundary;
  write_validation: CurrentWorkingPerspectiveApplyWriteValidation;
  authority_boundary: CurrentWorkingPerspectiveApplyWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface CurrentWorkingPerspectiveApplyReceipt {
  receipt_version: typeof CURRENT_WORKING_PERSPECTIVE_APPLY_RECEIPT_VERSION;
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
  no_side_effects: CurrentWorkingPerspectiveApplyNoSideEffects;
}

export type CurrentWorkingPerspectiveApplyWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface CurrentWorkingPerspectiveApplyStoreResult {
  store_version: typeof CURRENT_WORKING_PERSPECTIVE_APPLY_STORE_VERSION;
  scope: typeof CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE;
  status: CurrentWorkingPerspectiveApplyWriteStatus;
  ok: boolean;
  record: CurrentWorkingPerspectiveApplyRecord | null;
  records: CurrentWorkingPerspectiveApplyRecord[];
  applied_snapshot: CurrentWorkingPerspectiveAppliedSnapshot | null;
  applied_snapshots: CurrentWorkingPerspectiveAppliedSnapshot[];
  receipt: CurrentWorkingPerspectiveApplyReceipt;
  error_code: CurrentWorkingPerspectiveApplyWriteStatus | null;
  no_side_effects: CurrentWorkingPerspectiveApplyNoSideEffects;
}
