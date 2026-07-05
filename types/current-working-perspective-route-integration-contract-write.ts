import type { CurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreview } from "./current-working-perspective-route-integration-contract-decision";
import type {
  CurrentWorkingPerspectiveRouteIntegrationContractMaterial,
  CurrentWorkingPerspectiveRouteIntegrationMode,
} from "./current-working-perspective-route-integration-contract-preview";

export const CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_VERSION =
  "current_working_perspective_route_integration_contract_record.v0.1" as const;
export const CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECEIPT_VERSION =
  "current_working_perspective_route_integration_contract_receipt.v0.1" as const;
export const CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_STORE_VERSION =
  "current_working_perspective_route_integration_contract_store.v0.1" as const;
export const CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE =
  "project:augnes" as const;

export interface CurrentWorkingPerspectiveRouteIntegrationContractWriteInput {
  operator_decision_preview: CurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreview;
  operator_approval: CurrentWorkingPerspectiveRouteIntegrationContractOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface CurrentWorkingPerspectiveRouteIntegrationContractOperatorApproval {
  operator_decision: "approve_for_current_working_perspective_route_integration_contract_record";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface CurrentWorkingPerspectiveRouteIntegrationContractAuthorityProfile {
  durable_local_current_working_perspective_route_integration_contract: true;
  source_of_truth: false;
  local_project_current_working_perspective_route_integration_contract_only: true;
  persistence_horizon: "local_project_current_working_perspective_route_integration_contract_store";
  current_working_perspective_route_integration_contract_written: true;
  api_perspective_current_route_modified: false;
  current_working_perspective_route_response_replaced: false;
  upstream_current_working_perspective_source_tables_mutated: false;
  applied_current_working_perspective_snapshot_written: false;
  current_working_perspective_apply_record_written: false;
  current_working_perspective_update_contract_record_written: false;
  perspective_unit_write_performed: false;
  next_work_bias_write_performed: false;
  continuity_relay_write_performed: false;
  continuity_relay_update_performed: false;
  handoff_context_mutation_performed: false;
  memory_promotion_performed: false;
  metric_update_performed: false;
}

export interface CurrentWorkingPerspectiveRouteIntegrationContractNoRouteChange {
  api_perspective_current_route_modified: false;
  current_working_perspective_route_response_replaced: false;
  upstream_current_working_perspective_source_tables_updated: false;
  upstream_current_working_perspective_source_tables_mutated: false;
  applied_current_working_perspective_snapshot_written: false;
  current_working_perspective_apply_record_written: false;
  current_working_perspective_update_contract_record_written: false;
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

export interface CurrentWorkingPerspectiveRouteIntegrationContractWriteValidation {
  validation_version: "current_working_perspective_route_integration_contract_write_validation.v0.1";
  operator_decision_preview_revalidated: true;
  route_integration_contract_revalidated: true;
  route_guard_summary_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_route_replacement_or_upstream_cwp_mutation: false;
  refused_metric_or_upstream_write: false;
  validation_hash: string;
}

export interface CurrentWorkingPerspectiveRouteIntegrationContractWriteAuthorityBoundary {
  durable_local_current_working_perspective_route_integration_contract: true;
  source_of_truth: false;
  local_project_current_working_perspective_route_integration_contract_only: true;
  can_write_db: boolean;
  can_create_current_working_perspective_route_integration_contract_record: boolean;
  can_create_current_working_perspective_route_integration_contract_receipt: boolean;
  can_modify_api_perspective_current_route: false;
  can_replace_current_working_perspective_route_response: false;
  can_update_upstream_current_working_perspective_source_tables: false;
  can_mutate_upstream_current_working_perspective_source_tables: false;
  can_write_applied_current_working_perspective_snapshot: false;
  can_write_current_working_perspective_apply_record: false;
  can_write_current_working_perspective_update_contract_record: false;
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

export interface CurrentWorkingPerspectiveRouteIntegrationContractNoSideEffects {
  current_working_perspective_route_integration_contract_record_written: boolean;
  current_working_perspective_route_integration_contract_receipt_written: boolean;
  current_working_perspective_route_integration_contract_persisted: boolean;
  current_working_perspective_route_integration_contract_written: boolean;
  api_perspective_current_route_modified: false;
  current_working_perspective_route_response_replaced: false;
  upstream_current_working_perspective_source_tables_updated: false;
  upstream_current_working_perspective_source_tables_mutated: false;
  applied_current_working_perspective_snapshot_written: false;
  current_working_perspective_apply_record_written: false;
  current_working_perspective_update_contract_record_written: false;
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

export interface CurrentWorkingPerspectiveRouteIntegrationContractRecord {
  record_version: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  route_path: "/api/perspective/current";
  route_family: "current_working_perspective";
  source_runtime_current_working_perspective_ref: string | null;
  source_applied_snapshot_ref: string | null;
  source_cwp_apply_record_refs: string[];
  source_cwp_update_contract_record_refs: string[];
  proposed_current_working_perspective_route_integration_contract:
    CurrentWorkingPerspectiveRouteIntegrationContractMaterial;
  route_integration_mode: CurrentWorkingPerspectiveRouteIntegrationMode;
  route_integration_guard_summary: {
    enabled_guard_count: number;
    guard_keys: string[];
  };
  proposed_response_contract: CurrentWorkingPerspectiveRouteIntegrationContractMaterial["proposed_response_contract"];
  future_implementation_requirements: string[];
  rollback_and_fallback_plan: string[];
  authority_profile: CurrentWorkingPerspectiveRouteIntegrationContractAuthorityProfile;
  review_status: "recorded_as_scoped_current_working_perspective_route_integration_contract";
  persistence_horizon: "local_project_current_working_perspective_route_integration_contract_store";
  no_route_change_performed: CurrentWorkingPerspectiveRouteIntegrationContractNoRouteChange;
  write_validation: CurrentWorkingPerspectiveRouteIntegrationContractWriteValidation;
  authority_boundary: CurrentWorkingPerspectiveRouteIntegrationContractWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface CurrentWorkingPerspectiveRouteIntegrationContractReceipt {
  receipt_version: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECEIPT_VERSION;
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
  no_side_effects: CurrentWorkingPerspectiveRouteIntegrationContractNoSideEffects;
}

export type CurrentWorkingPerspectiveRouteIntegrationContractWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface CurrentWorkingPerspectiveRouteIntegrationContractStoreResult {
  store_version: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_STORE_VERSION;
  scope: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE;
  status: CurrentWorkingPerspectiveRouteIntegrationContractWriteStatus;
  ok: boolean;
  record: CurrentWorkingPerspectiveRouteIntegrationContractRecord | null;
  records: CurrentWorkingPerspectiveRouteIntegrationContractRecord[];
  receipt: CurrentWorkingPerspectiveRouteIntegrationContractReceipt;
  error_code: CurrentWorkingPerspectiveRouteIntegrationContractWriteStatus | null;
  no_side_effects: CurrentWorkingPerspectiveRouteIntegrationContractNoSideEffects;
}
