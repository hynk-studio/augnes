import type { ExportedHandoffPacketArtifactRead } from "@/lib/workplane/read-exported-handoff-packet-artifact-for-web";
import type { HandoffSendContractRecordReview } from "./handoff-send-contract-record-review";
import type { HandoffSendContractRecord } from "./handoff-send-contract-write";
import type {
  HandoffSendDeliveryMode,
  HandoffSendEnvelope,
  HandoffSendPayloadType,
  HandoffSendSurface,
} from "./handoff-send-contract-preview";

export const HANDOFF_SEND_PREVIEW_VERSION =
  "handoff_send_preview.v0.1" as const;
export const HANDOFF_SEND_SCOPE = "project:augnes" as const;

export type HandoffSendExecutionMode =
  | "manual_operator_send_fulfillment"
  | "local_deferred_send_queue_fulfillment"
  | "provider_send_dry_run_fulfillment"
  | "codex_session_transfer_dry_run_fulfillment";

export type HandoffSendFulfillmentStatus =
  | "locally_fulfilled_manual_operator_send"
  | "locally_queued_deferred_send"
  | "locally_recorded_provider_send_dry_run"
  | "locally_recorded_codex_transfer_dry_run";

export type HandoffSendPreviewStatus =
  | "no_handoff_send_contract_record"
  | "no_handoff_send_material"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_handoff_send_record_write"
  | "keep_preview_only";

export type HandoffSendRecommendedNextAction =
  | "supply_handoff_send_contract_record"
  | "review_handoff_send_preview"
  | "write_handoff_send_record"
  | "resolve_handoff_send_blockers"
  | "keep_preview_only";

export interface HandoffSendPreviewInput {
  handoff_send_contract_record_review?: unknown;
  handoff_send_contract_record?: unknown;
  exported_handoff_packet_artifact_read?: unknown;
  handoff_packet_copy_export_record_review?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  requested_send_execution_mode?: HandoffSendExecutionMode | string;
  manual_delivery_confirmation_ref?: string;
  local_queue_ref?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffSendFulfillment {
  fulfillment_version: "handoff_send_fulfillment.v0.1";
  fulfillment_ref: string;
  scope: typeof HANDOFF_SEND_SCOPE;
  as_of: string;
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
  payload_hash: string;
  payload_type: HandoffSendPayloadType;
  send_envelope_ref: string;
  fulfillment_status: HandoffSendFulfillmentStatus;
  fulfillment_steps: string[];
  public_safety_summary: {
    public_safe: true;
    raw_private_material_excluded: true;
  };
  no_external_delivery_summary: {
    provider_call_performed: false;
    external_messaging_called: false;
    email_called: false;
    slack_called: false;
    webhook_called: false;
    github_called: false;
    codex_transfer_performed: false;
    browser_or_crawler_called: false;
    network_send_performed: false;
  };
  source_refs: string[];
  evidence_refs: string[];
  authority_boundary: HandoffSendPreviewAuthorityBoundary;
}

export interface HandoffSendReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_handoff_send_contract_record: true;
  requires_send_execution_mode: true;
  requires_confirmation_ref: true;
  requires_operator_ref: true;
  requires_idempotency_key: true;
  requires_review_confirmation: true;
  requires_source_refs: true;
  requires_evidence_refs: true;
  requires_no_blockers: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
}

export interface HandoffSendPreviewAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  send_preview_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_handoff_send_record: false;
  can_create_handoff_send_receipt: false;
  can_record_local_send_fulfillment: false;
  can_send_handoff: false;
  can_call_send_provider: false;
  can_call_provider_openai: false;
  can_call_github: false;
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

export interface HandoffSendPreview {
  preview_version: typeof HANDOFF_SEND_PREVIEW_VERSION;
  scope: typeof HANDOFF_SEND_SCOPE;
  as_of: string;
  source_refs: string[];
  send_preview_status: HandoffSendPreviewStatus;
  recommended_next_action: HandoffSendRecommendedNextAction;
  input_summary: {
    has_handoff_send_contract_record_review: boolean;
    has_handoff_send_contract_record: boolean;
    selected_contract_record_id: string | null;
    requested_send_execution_mode: string | null;
    requested_operator_ref_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    review_confirmation_supplied: boolean;
    manual_delivery_confirmation_ref_supplied: boolean;
    local_queue_ref_supplied: boolean;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
  };
  source_status: {
    handoff_send_contract_record_review:
      | "supplied"
      | "missing"
      | "malformed"
      | "records_invalid";
    selected_handoff_send_contract_record:
      | "found"
      | "missing"
      | "malformed";
    exported_handoff_packet_artifact_read:
      | "not_supplied"
      | "matched"
      | "mismatched"
      | "malformed";
  };
  send_readiness: HandoffSendReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_valid_handoff_send_contract_record: boolean;
    has_valid_send_envelope: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_confirmation_ref: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    no_external_delivery_confirmed: true;
    no_provider_call_confirmed: true;
    no_clipboard_download_file_write_confirmed: true;
  };
  source_send_contract_summary: {
    source_handoff_send_contract_record_ref: string | null;
    source_exported_artifact_ref: string | null;
    requested_send_surface: HandoffSendSurface | null;
    requested_delivery_mode: HandoffSendDeliveryMode | null;
    requested_recipient_ref: string | null;
    payload_hash: string | null;
    payload_type: HandoffSendPayloadType | null;
    send_envelope_ref: string | null;
  };
  proposed_handoff_send_fulfillment: HandoffSendFulfillment | null;
  proposed_handoff_send_receipt_preview: {
    receipt_version: "handoff_send_receipt.v0.1";
    would_record_local_fulfillment: boolean;
    external_delivery_performed: false;
    provider_call_performed: false;
    clipboard_download_file_write_performed: false;
  };
  would_write_handoff_send_record_preview: {
    record_version: "handoff_send_record.v0.1";
    scope: typeof HANDOFF_SEND_SCOPE;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    source_refs: string[];
    evidence_refs: string[];
    source_handoff_send_contract_record_ref: string | null;
    source_exported_artifact_ref: string | null;
    requested_send_surface: HandoffSendSurface | null;
    requested_delivery_mode: HandoffSendDeliveryMode | null;
    requested_recipient_ref: string | null;
    requested_send_execution_mode: HandoffSendExecutionMode | null;
    proposed_handoff_send_fulfillment: HandoffSendFulfillment | null;
    no_actual_external_send_performed: true;
    no_provider_call_performed: true;
    no_clipboard_download_file_write_performed: true;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: HandoffSendPreviewAuthorityBoundary;
}

export type HandoffSendPreviewSources = {
  handoff_send_contract_record_review?: HandoffSendContractRecordReview;
  handoff_send_contract_record?: HandoffSendContractRecord;
  exported_handoff_packet_artifact_read?: ExportedHandoffPacketArtifactRead;
  proposed_send_envelope?: HandoffSendEnvelope;
};
