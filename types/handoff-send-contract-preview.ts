import type { ExportedHandoffPacketArtifactRead } from "@/lib/workplane/read-exported-handoff-packet-artifact-for-web";
import type { HandoffPacketCopyExportRecordReview } from "./handoff-packet-copy-export-record-review";
import type { HandoffPacketCopyExportContractRecordReview } from "./handoff-packet-copy-export-contract-record-review";
import type { HandoffContextApplyRecordReview } from "./handoff-context-apply-record-review";
import type { HandoffPacketExportedArtifact } from "./handoff-packet-copy-export-preview";

export const HANDOFF_SEND_CONTRACT_PREVIEW_VERSION =
  "handoff_send_contract_preview.v0.1" as const;
export const HANDOFF_SEND_CONTRACT_SCOPE = "project:augnes" as const;

export type HandoffSendSurface =
  | "operator_manual_send_candidate"
  | "codex_session_handoff_candidate"
  | "external_message_candidate"
  | "local_send_queue_candidate";

export type HandoffSendDeliveryMode =
  | "manual_operator_delivery"
  | "deferred_send_queue"
  | "provider_send_candidate"
  | "codex_session_transfer_candidate";

export type HandoffSendPayloadType =
  | "markdown_payload"
  | "json_payload"
  | "capsule_payload"
  | "dual_markdown_and_json_payload";

export type HandoffSendContractPreviewStatus =
  | "no_exported_handoff_packet_artifact"
  | "no_handoff_send_material"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_handoff_send_contract_record_write"
  | "keep_preview_only";

export type HandoffSendContractRecommendedNextAction =
  | "supply_exported_handoff_packet_artifact"
  | "review_handoff_send_contract"
  | "write_handoff_send_contract_record"
  | "resolve_handoff_send_contract_blockers"
  | "keep_preview_only";

export interface HandoffSendContractPreviewInput {
  exported_handoff_packet_artifact_read?: unknown;
  handoff_packet_copy_export_record_review?: unknown;
  handoff_packet_copy_export_record?: unknown;
  exported_handoff_packet_artifact?: unknown;
  handoff_packet_copy_export_contract_record_review?: unknown;
  handoff_context_apply_record_review?: unknown;
  requested_send_surface?: HandoffSendSurface | string;
  requested_recipient_ref?: string;
  requested_delivery_mode?: HandoffSendDeliveryMode | string;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffSendEnvelope {
  envelope_version: "handoff_send_envelope.v0.1";
  envelope_ref: string;
  packet_family: "augnes_operator_handoff_packet";
  source_exported_artifact_ref: string;
  packet_format: string;
  payload_hash: string;
  payload_type: HandoffSendPayloadType;
  requested_send_surface: HandoffSendSurface;
  requested_delivery_mode: HandoffSendDeliveryMode;
  requested_recipient_ref: string;
  public_safe: true;
  raw_private_material_excluded: true;
  send_not_performed: true;
  provider_not_called: true;
  external_delivery_not_performed: true;
  future_send_slice_required: true;
}

export interface ProposedHandoffSendContract {
  contract_kind: "handoff_send_contract.v0.1";
  send_family: "augnes_operator_handoff_send";
  source_exported_artifact_ref: string;
  source_handoff_packet_copy_export_record_ref: string | null;
  source_handoff_packet_copy_export_contract_record_ref: string | null;
  source_applied_handoff_context_snapshot_ref: string | null;
  source_handoff_context_apply_record_ref: string | null;
  source_handoff_context_update_contract_record_ref: string | null;
  source_route_integration_read_ref: string | null;
  source_runtime_current_working_perspective_ref: string | null;
  source_applied_cwp_snapshot_ref: string | null;
  requested_send_surface: HandoffSendSurface;
  requested_delivery_mode: HandoffSendDeliveryMode;
  requested_recipient_ref: string;
  packet_payload_summary: HandoffSendPacketPayloadSummary;
  proposed_send_envelope: HandoffSendEnvelope;
  proposed_send_steps: string[];
  proposed_send_preconditions: string[];
  required_source_refs: string[];
  required_evidence_refs: string[];
  blocked_live_mutations: string[];
  future_send_requirements: string[];
  operator_acceptance_criteria: string[];
  rollback_and_fallback_plan: string[];
}

export interface HandoffSendPacketPayloadSummary {
  source_exported_artifact_ref: string | null;
  packet_format: string | null;
  payload_hash: string | null;
  payload_type: HandoffSendPayloadType | null;
  has_markdown_payload: boolean;
  has_json_payload: boolean;
  has_capsule_payload: boolean;
  packet_entry_count: number;
  packet_section_counts: Record<string, number>;
  public_safe: boolean;
  raw_private_material_excluded: boolean;
}

export interface HandoffSendContractReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_exported_packet_artifact: true;
  requires_requested_send_surface: true;
  requires_requested_delivery_mode: true;
  requires_recipient_ref: true;
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

export interface HandoffSendContractPreviewAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  contract_material_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_handoff_send_contract_record: false;
  can_create_handoff_send_contract_receipt: false;
  can_send_handoff: false;
  can_call_send_provider: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_call_external_messaging: false;
  can_call_email: false;
  can_call_slack: false;
  can_call_webhook: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_arbitrary_file: false;
  can_write_handoff_packet_file: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context_update_live: false;
  can_write_selected_refs_to_live_handoff: false;
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

export interface HandoffSendContractPreview {
  preview_version: typeof HANDOFF_SEND_CONTRACT_PREVIEW_VERSION;
  scope: typeof HANDOFF_SEND_CONTRACT_SCOPE;
  as_of: string;
  source_refs: string[];
  contract_preview_status: HandoffSendContractPreviewStatus;
  recommended_next_action: HandoffSendContractRecommendedNextAction;
  input_summary: {
    has_exported_handoff_packet_artifact_read: boolean;
    has_latest_exported_artifact: boolean;
    has_copy_export_record_review: boolean;
    has_copy_export_record: boolean;
    requested_send_surface: string | null;
    requested_delivery_mode: string | null;
    requested_recipient_ref_supplied: boolean;
    requested_operator_ref_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    review_confirmation_supplied: boolean;
    proposed_payload_type: HandoffSendPayloadType | null;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
  };
  source_status: {
    exported_handoff_packet_artifact_read:
      | "supplied"
      | "missing"
      | "malformed"
      | "not_available";
    latest_exported_artifact:
      | "found"
      | "missing"
      | "malformed"
      | "unsupported";
    handoff_packet_copy_export_record_review:
      | "supplied"
      | "missing"
      | "malformed"
      | "invalid";
    exported_artifact_supported_by_copy_export_review:
      | "supported"
      | "unsupported"
      | "not_checked";
    requested_send_surface:
      | "supplied"
      | "missing"
      | "unsupported"
      | "unsafe";
    requested_delivery_mode:
      | "supplied"
      | "missing"
      | "unsupported"
      | "unsafe";
  };
  contract_readiness: HandoffSendContractReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_exported_artifact_read: boolean;
    has_latest_exported_artifact: boolean;
    has_valid_copy_export_record_review: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_missing_evidence: boolean;
    has_receipt_side_effect_problem: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    problem_record_ids: string[];
    no_handoff_send_confirmed: true;
    no_provider_call_confirmed: true;
    no_external_delivery_confirmed: true;
  };
  source_exported_packet_artifact_summary: HandoffSendPacketPayloadSummary & {
    source_handoff_packet_copy_export_record_ref: string | null;
    source_handoff_packet_copy_export_contract_record_ref: string | null;
  };
  proposed_handoff_send_contract: ProposedHandoffSendContract | null;
  would_write_handoff_send_contract_record_preview: {
    record_version: "handoff_send_contract_record.v0.1";
    scope: typeof HANDOFF_SEND_CONTRACT_SCOPE;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    source_refs: string[];
    evidence_refs: string[];
    source_exported_artifact_ref: string | null;
    source_handoff_packet_copy_export_record_ref: string | null;
    requested_send_surface: HandoffSendSurface | null;
    requested_delivery_mode: HandoffSendDeliveryMode | null;
    requested_recipient_ref: string | null;
    proposed_handoff_send_contract: ProposedHandoffSendContract | null;
    proposed_send_envelope: HandoffSendEnvelope | null;
    no_handoff_send_performed: true;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: HandoffSendContractPreviewAuthorityBoundary;
}

export type HandoffSendContractPreviewSources = {
  exported_handoff_packet_artifact_read?: ExportedHandoffPacketArtifactRead | null;
  handoff_packet_copy_export_record_review?: HandoffPacketCopyExportRecordReview | null;
  handoff_packet_copy_export_contract_record_review?: HandoffPacketCopyExportContractRecordReview | null;
  handoff_context_apply_record_review?: HandoffContextApplyRecordReview | null;
  exported_handoff_packet_artifact?: HandoffPacketExportedArtifact | null;
};
