import type { CurrentWorkingPerspectiveUpdateContractOperatorDecisionPreview } from "./current-working-perspective-update-contract-decision";
import type {
  CurrentWorkingPerspectivePatchEntry,
  CurrentWorkingPerspectiveUpdateContractMaterial,
} from "./current-working-perspective-update-contract-preview";

export const CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_VERSION =
  "current_working_perspective_update_contract_record.v0.1" as const;
export const CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECEIPT_VERSION =
  "current_working_perspective_update_contract_receipt.v0.1" as const;
export const CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_STORE_VERSION =
  "current_working_perspective_update_contract_store.v0.1" as const;
export const CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE =
  "project:augnes" as const;

export interface CurrentWorkingPerspectiveUpdateContractWriteInput {
  operator_decision_preview: CurrentWorkingPerspectiveUpdateContractOperatorDecisionPreview;
  operator_approval: CurrentWorkingPerspectiveUpdateContractOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface CurrentWorkingPerspectiveUpdateContractOperatorApproval {
  operator_decision: "approve_for_current_working_perspective_update_contract_record";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface CurrentWorkingPerspectiveUpdateContractAuthorityProfile {
  durable_local_current_working_perspective_update_contract: true;
  source_of_truth: false;
  local_project_current_working_perspective_update_contract_only: true;
  persistence_horizon: "local_project_current_working_perspective_update_contract_record";
  current_working_perspective_update_contract_written: true;
  current_working_perspective_update_performed: false;
  current_working_perspective_mutation_performed: false;
  perspective_unit_write_performed: false;
  next_work_bias_write_performed: false;
  continuity_relay_write_performed: false;
  continuity_relay_update_performed: false;
  handoff_context_mutation_performed: false;
  memory_promotion_performed: false;
  metric_update_performed: false;
}

export interface CurrentWorkingPerspectiveUpdateContractNoMutationPerformed {
  current_working_perspective_updated: false;
  current_working_perspective_mutated: false;
  current_working_perspective_live_state_written: false;
  current_working_perspective_update_applied: false;
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

export interface CurrentWorkingPerspectiveUpdateContractWriteValidation {
  validation_version: "current_working_perspective_update_contract_write_validation.v0.1";
  operator_decision_preview_revalidated: true;
  proposed_contract_revalidated: true;
  proposed_patch_entries_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_live_cwp_relay_handoff_memory_promotion: false;
  refused_metric_or_upstream_write: false;
  validation_hash: string;
}

export interface CurrentWorkingPerspectiveUpdateContractWriteAuthorityBoundary {
  durable_local_current_working_perspective_update_contract: true;
  source_of_truth: false;
  local_project_current_working_perspective_update_contract_only: true;
  can_write_db: boolean;
  can_create_current_working_perspective_update_contract_record: boolean;
  can_create_current_working_perspective_update_contract_receipt: boolean;
  can_write_current_working_perspective_update_contract: boolean;
  can_update_current_working_perspective: false;
  can_mutate_current_working_perspective: false;
  can_write_current_working_perspective_live_state: false;
  can_apply_current_working_perspective_update: false;
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

export interface CurrentWorkingPerspectiveUpdateContractNoSideEffects {
  current_working_perspective_update_contract_record_written: boolean;
  current_working_perspective_update_contract_receipt_written: boolean;
  current_working_perspective_update_contract_persisted: boolean;
  current_working_perspective_update_contract_written: boolean;
  current_working_perspective_updated: false;
  current_working_perspective_mutated: false;
  current_working_perspective_live_state_written: false;
  current_working_perspective_update_applied: false;
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

export interface CurrentWorkingPerspectiveUpdateContractRecord {
  record_version: typeof CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  source_current_working_perspective_ref: string | null;
  source_perspective_unit_record_refs: string[];
  source_next_work_bias_record_refs: string[];
  source_continuity_relay_record_refs: string[];
  source_perspective_relay_update_decision_record_refs: string[];
  source_perspective_relay_update_write_contract_preview_ref: string | null;
  proposed_current_working_perspective_update_contract: CurrentWorkingPerspectiveUpdateContractMaterial;
  proposed_patch_entries: CurrentWorkingPerspectivePatchEntry[];
  proposed_patch_entry_count: number;
  authority_profile: CurrentWorkingPerspectiveUpdateContractAuthorityProfile;
  review_status: "recorded_as_scoped_current_working_perspective_update_contract";
  persistence_horizon: "local_project_current_working_perspective_update_contract_record";
  no_mutation_performed: CurrentWorkingPerspectiveUpdateContractNoMutationPerformed;
  write_validation: CurrentWorkingPerspectiveUpdateContractWriteValidation;
  authority_boundary: CurrentWorkingPerspectiveUpdateContractWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface CurrentWorkingPerspectiveUpdateContractReceipt {
  receipt_version: typeof CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECEIPT_VERSION;
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
  no_side_effects: CurrentWorkingPerspectiveUpdateContractNoSideEffects;
}

export type CurrentWorkingPerspectiveUpdateContractWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface CurrentWorkingPerspectiveUpdateContractStoreResult {
  store_version: typeof CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_STORE_VERSION;
  scope: typeof CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE;
  status: CurrentWorkingPerspectiveUpdateContractWriteStatus;
  ok: boolean;
  record: CurrentWorkingPerspectiveUpdateContractRecord | null;
  records: CurrentWorkingPerspectiveUpdateContractRecord[];
  receipt: CurrentWorkingPerspectiveUpdateContractReceipt;
  error_code: CurrentWorkingPerspectiveUpdateContractWriteStatus | null;
  no_side_effects: CurrentWorkingPerspectiveUpdateContractNoSideEffects;
}
