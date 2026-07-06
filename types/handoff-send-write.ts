import type { HandoffSendOperatorDecisionPreview } from "./handoff-send-decision";
import type {
  HandoffSendDeliveryMode,
  HandoffSendPayloadType,
  HandoffSendSurface,
} from "./handoff-send-contract-preview";
import type {
  HandoffSendExecutionMode,
  HandoffSendFulfillment,
  HandoffSendFulfillmentStatus,
} from "./handoff-send-preview";

export const HANDOFF_SEND_RECORD_VERSION =
  "handoff_send_record.v0.1" as const;
export const HANDOFF_SEND_RECEIPT_VERSION =
  "handoff_send_receipt.v0.1" as const;
export const HANDOFF_SEND_STORE_VERSION =
  "handoff_send_store.v0.1" as const;
export const HANDOFF_SEND_WRITE_SCOPE = "project:augnes" as const;

export interface HandoffSendWriteInput {
  send_decision_preview: HandoffSendOperatorDecisionPreview;
  operator_approval: HandoffSendOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface HandoffSendOperatorApproval {
  operator_decision: "approve_for_handoff_send_record";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface HandoffSendAuthorityProfile
  extends HandoffSendNoForbiddenSideEffects {
  durable_local_handoff_send_record: true;
  source_of_truth: false;
  local_project_handoff_send_only: true;
  persistence_horizon: "local_project_handoff_send_store";
  handoff_send_record_written: true;
  handoff_send_receipt_written: true;
  local_handoff_send_fulfillment_recorded: true;
  handoff_sent_externally: false;
  send_provider_called: false;
  external_messaging_called: false;
  email_called: false;
  slack_called: false;
  webhook_called: false;
  github_called: false;
  codex_session_transferred: false;
  browser_or_crawler_called: false;
  network_send_performed: false;
  clipboard_written: false;
  file_download_created: false;
  arbitrary_file_written: false;
  handoff_packet_file_written: false;
  live_handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_send_contract_record_written: false;
  handoff_packet_copy_export_record_written: false;
  handoff_packet_exported_artifact_written: false;
  handoff_packet_copy_export_contract_record_written: false;
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

export interface HandoffSendNoForbiddenSideEffects {
  handoff_sent: false;
  handoff_sent_externally: false;
  send_provider_called: false;
  external_messaging_called: false;
  email_called: false;
  slack_called: false;
  webhook_called: false;
  provider_called: false;
  github_called: false;
  codex_executed: false;
  codex_session_transferred: false;
  browser_or_crawler_called: false;
  network_send_performed: false;
  clipboard_written: false;
  file_download_created: false;
  arbitrary_file_written: false;
  handoff_packet_file_written: false;
  handoff_packet_copied_to_clipboard: false;
  handoff_packet_exported_to_file: false;
  handoff_packet_download_created: false;
  handoff_packet_copied: false;
  handoff_packet_exported: false;
  live_handoff_context_updated: false;
  live_handoff_context_mutated: false;
  handoff_context_applied_live: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_send_contract_record_written: false;
  handoff_packet_copy_export_record_written: false;
  handoff_packet_exported_artifact_written: false;
  handoff_packet_copy_export_contract_record_written: false;
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
  pr_created: false;
  pr_merged: false;
  autonomous_action_run: false;
  graph_or_vector_store_created: false;
  rag_stack_created: false;
  browser_observed: false;
  crawler_or_browser_observer_created: false;
  workbench_action_button_rendered: false;
}

export interface HandoffSendNoSideEffects
  extends HandoffSendNoForbiddenSideEffects {
  handoff_send_record_written: boolean;
  handoff_send_receipt_written: boolean;
  handoff_send_persisted: boolean;
  local_handoff_send_fulfillment_recorded: boolean;
}

export interface HandoffSendWriteValidation {
  validation_version: "handoff_send_write_validation.v0.1";
  send_decision_preview_revalidated: true;
  handoff_send_fulfillment_revalidated: true;
  payload_hash_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_external_send_or_provider: false;
  refused_metric_or_upstream_write: false;
  validation_hash: string;
}

export interface HandoffSendWriteAuthorityBoundary {
  durable_local_handoff_send_record: true;
  source_of_truth: false;
  local_project_handoff_send_only: true;
  can_write_db: boolean;
  can_create_handoff_send_record: boolean;
  can_create_handoff_send_receipt: boolean;
  can_record_local_send_fulfillment: boolean;
  can_send_handoff: false;
  can_call_send_provider: false;
  can_call_external_messaging: false;
  can_call_email: false;
  can_call_slack: false;
  can_call_webhook: false;
  can_transfer_codex_session: false;
  can_call_browser_or_crawler: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_arbitrary_file: false;
  can_write_handoff_packet_file: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context_update_live: false;
  can_write_selected_refs_to_live_handoff: false;
  can_write_handoff_send_contract_record: false;
  can_write_handoff_packet_copy_export_record: false;
  can_write_handoff_packet_exported_artifact: false;
  can_write_handoff_packet_copy_export_contract_record: false;
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

export interface HandoffSendRecord {
  record_version: typeof HANDOFF_SEND_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof HANDOFF_SEND_WRITE_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  source_handoff_send_contract_record_ref: string;
  source_exported_artifact_ref: string;
  source_handoff_packet_copy_export_record_ref: string | null;
  source_handoff_packet_copy_export_contract_record_ref: string | null;
  requested_send_surface: HandoffSendSurface;
  requested_delivery_mode: HandoffSendDeliveryMode;
  requested_recipient_ref: string;
  requested_send_execution_mode: HandoffSendExecutionMode;
  manual_delivery_confirmation_ref: string | null;
  local_queue_ref: string | null;
  handoff_send_fulfillment: HandoffSendFulfillment;
  fulfillment_status: HandoffSendFulfillmentStatus;
  payload_hash: string;
  payload_type: HandoffSendPayloadType;
  authority_profile: HandoffSendAuthorityProfile;
  review_status: "recorded_as_scoped_local_handoff_send_fulfillment";
  persistence_horizon: "local_project_handoff_send_store";
  no_external_delivery_performed: true;
  write_validation: HandoffSendWriteValidation;
  authority_boundary: HandoffSendWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
  no_side_effects?: HandoffSendNoSideEffects;
}

export type HandoffSendWriteStatus =
  | "written"
  | "idempotent_existing"
  | "conflict"
  | "refused"
  | "read"
  | "listed"
  | "not_found"
  | "schema_missing";

export interface HandoffSendReceipt {
  receipt_version: typeof HANDOFF_SEND_RECEIPT_VERSION;
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
  no_side_effects: HandoffSendNoSideEffects;
}

export interface HandoffSendStoreResult {
  store_version: typeof HANDOFF_SEND_STORE_VERSION;
  scope: typeof HANDOFF_SEND_WRITE_SCOPE;
  status: HandoffSendWriteStatus;
  ok: boolean;
  error_code: string | null;
  record: HandoffSendRecord | null;
  records: HandoffSendRecord[];
  receipt: HandoffSendReceipt;
  notes: string[];
}
