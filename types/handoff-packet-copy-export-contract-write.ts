import type { HandoffPacketCopyExportContractOperatorDecisionPreview } from "./handoff-packet-copy-export-contract-decision";
import type {
  HandoffPacketCopyExportContractMaterial,
  HandoffPacketCopyExportPacketFormat,
  HandoffPacketCopyExportPlan,
  HandoffPacketCopyExportTarget,
  HandoffPacketEntry,
  HandoffPacketManifest,
} from "./handoff-packet-copy-export-contract-preview";

export const HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_VERSION =
  "handoff_packet_copy_export_contract_record.v0.1" as const;
export const HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECEIPT_VERSION =
  "handoff_packet_copy_export_contract_receipt.v0.1" as const;
export const HANDOFF_PACKET_COPY_EXPORT_CONTRACT_STORE_VERSION =
  "handoff_packet_copy_export_contract_store.v0.1" as const;
export const HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE =
  "project:augnes" as const;

export interface HandoffPacketCopyExportContractWriteInput {
  operator_decision_preview: HandoffPacketCopyExportContractOperatorDecisionPreview;
  operator_approval: HandoffPacketCopyExportContractOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface HandoffPacketCopyExportContractOperatorApproval {
  operator_decision: "approve_for_handoff_packet_copy_export_contract_record";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface HandoffPacketCopyExportContractAuthorityProfile {
  durable_local_handoff_packet_copy_export_contract: true;
  source_of_truth: false;
  local_project_handoff_packet_copy_export_contract_only: true;
  persistence_horizon: "local_project_handoff_packet_copy_export_contract_store";
  handoff_packet_copy_export_contract_written: true;
  handoff_packet_copied: false;
  handoff_packet_exported: false;
  handoff_packet_file_written: false;
  clipboard_written: false;
  handoff_sent: false;
  live_handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_context_apply_record_written: false;
  applied_handoff_context_snapshot_written: false;
  handoff_context_update_contract_record_written: false;
  api_perspective_current_route_modified: false;
  upstream_current_working_perspective_source_tables_mutated: false;
  perspective_unit_write_performed: false;
  next_work_bias_write_performed: false;
  continuity_relay_write_performed: false;
  continuity_relay_update_performed: false;
  memory_promotion_performed: false;
  metric_update_performed: false;
}

export interface HandoffPacketCopyExportContractNoCopyExportOrSend {
  handoff_packet_copied: false;
  handoff_packet_exported: false;
  handoff_packet_file_written: false;
  clipboard_written: false;
  file_download_created: false;
  handoff_sent: false;
  live_handoff_context_updated: false;
  live_handoff_context_mutated: false;
  handoff_context_applied_live: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_context_apply_record_written: false;
  applied_handoff_context_snapshot_written: false;
  handoff_context_update_contract_record_written: false;
  api_perspective_current_route_modified: false;
  current_working_perspective_route_response_replaced: false;
  upstream_current_working_perspective_source_tables_updated: false;
  upstream_current_working_perspective_source_tables_mutated: false;
  applied_current_working_perspective_snapshot_written: false;
  current_working_perspective_apply_record_written: false;
  current_working_perspective_update_contract_record_written: false;
  route_integration_contract_record_written: false;
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

export interface HandoffPacketCopyExportContractWriteValidation {
  validation_version: "handoff_packet_copy_export_contract_write_validation.v0.1";
  operator_decision_preview_revalidated: true;
  handoff_packet_copy_export_contract_revalidated: true;
  packet_manifest_revalidated: true;
  packet_entries_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_packet_copy_export_or_send: false;
  refused_metric_or_upstream_write: false;
  validation_hash: string;
}

export interface HandoffPacketCopyExportContractWriteAuthorityBoundary {
  durable_local_handoff_packet_copy_export_contract: true;
  source_of_truth: false;
  local_project_handoff_packet_copy_export_contract_only: true;
  can_write_db: boolean;
  can_create_handoff_packet_copy_export_contract_record: boolean;
  can_create_handoff_packet_copy_export_contract_receipt: boolean;
  can_copy_export_handoff_packet: false;
  can_write_handoff_packet_file: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_send_handoff: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context_update_live: false;
  can_write_selected_refs_to_live_handoff: false;
  can_write_handoff_context_apply_record: false;
  can_write_applied_handoff_context_snapshot: false;
  can_write_handoff_context_update_contract_record: false;
  can_modify_api_perspective_current_route: false;
  can_replace_current_working_perspective_route_response: false;
  can_update_upstream_current_working_perspective_source_tables: false;
  can_write_applied_current_working_perspective_snapshot: false;
  can_write_current_working_perspective_apply_record: false;
  can_write_current_working_perspective_update_contract_record: false;
  can_write_route_integration_contract_record: false;
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

export interface HandoffPacketCopyExportContractNoSideEffects
  extends HandoffPacketCopyExportContractNoCopyExportOrSend {
  handoff_packet_copy_export_contract_record_written: boolean;
  handoff_packet_copy_export_contract_receipt_written: boolean;
  handoff_packet_copy_export_contract_persisted: boolean;
  handoff_packet_copy_export_contract_written: boolean;
}

export interface HandoffPacketCopyExportContractRecord {
  record_version: typeof HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  source_applied_handoff_context_snapshot_ref: string;
  source_handoff_context_apply_record_ref: string | null;
  source_handoff_context_update_contract_record_ref: string | null;
  source_route_integration_read_ref: string | null;
  source_runtime_current_working_perspective_ref: string | null;
  source_applied_cwp_snapshot_ref: string | null;
  requested_packet_format: HandoffPacketCopyExportPacketFormat;
  requested_copy_export_target: HandoffPacketCopyExportTarget;
  proposed_handoff_packet_copy_export_contract:
    HandoffPacketCopyExportContractMaterial;
  proposed_packet_manifest: HandoffPacketManifest;
  proposed_packet_entries: HandoffPacketEntry[];
  proposed_packet_entry_count: number;
  proposed_packet_section_counts: Record<string, number>;
  proposed_copy_export_plan: HandoffPacketCopyExportPlan;
  authority_profile: HandoffPacketCopyExportContractAuthorityProfile;
  review_status: "recorded_as_scoped_handoff_packet_copy_export_contract";
  persistence_horizon: "local_project_handoff_packet_copy_export_contract_store";
  no_copy_export_or_send_performed:
    HandoffPacketCopyExportContractNoCopyExportOrSend;
  write_validation: HandoffPacketCopyExportContractWriteValidation;
  authority_boundary: HandoffPacketCopyExportContractWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface HandoffPacketCopyExportContractReceipt {
  receipt_version: typeof HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECEIPT_VERSION;
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
  no_side_effects: HandoffPacketCopyExportContractNoSideEffects;
}

export type HandoffPacketCopyExportContractWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface HandoffPacketCopyExportContractStoreResult {
  store_version: typeof HANDOFF_PACKET_COPY_EXPORT_CONTRACT_STORE_VERSION;
  scope: typeof HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE;
  status: HandoffPacketCopyExportContractWriteStatus;
  ok: boolean;
  record: HandoffPacketCopyExportContractRecord | null;
  records: HandoffPacketCopyExportContractRecord[];
  receipt: HandoffPacketCopyExportContractReceipt;
  error_code: HandoffPacketCopyExportContractWriteStatus | null;
  no_side_effects: HandoffPacketCopyExportContractNoSideEffects;
}
