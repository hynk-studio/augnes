import type { SentHandoffReadForWeb } from "@/lib/workplane/read-sent-handoff-for-web";
import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";
import type { ExportedHandoffPacketArtifactRead } from "@/types/exported-handoff-packet-artifact-read";
import type { HandoffSendContractRecordReview } from "./handoff-send-contract-record-review";
import type { HandoffSendRecordReview } from "./handoff-send-record-review";
import type { HandoffSendPayloadType } from "./handoff-send-contract-preview";
import type { ResidualDiagnosticCandidateReadModel } from "./residual-diagnostic-candidate";
import type { WorkbenchDogfoodLoopSpineOverview } from "./workbench-dogfood-loop-spine-overview";
import type { WorkbenchSpineConsolidation } from "./workbench-spine-consolidation";

export const EXTERNAL_HANDOFF_DELIVERY_CONTRACT_PREVIEW_VERSION =
  "external_handoff_delivery_contract_preview.v0.1" as const;
export const EXTERNAL_HANDOFF_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION =
  "external_handoff_delivery_operator_decision_preview.v0.1" as const;
export const EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_VERSION =
  "external_handoff_delivery_contract_record.v0.1" as const;
export const EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECEIPT_VERSION =
  "external_handoff_delivery_contract_receipt.v0.1" as const;
export const EXTERNAL_HANDOFF_DELIVERY_CONTRACT_STORE_VERSION =
  "external_handoff_delivery_contract_store.v0.1" as const;
export const EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_REVIEW_VERSION =
  "external_handoff_delivery_contract_record_review.v0.1" as const;
export const EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE =
  "project:augnes" as const;

export type ExternalHandoffDeliveryContractPreviewStatus =
  | "ready_for_contract_decision"
  | "blocked"
  | "insufficient_data"
  | "no_local_fulfillment"
  | "residual_gate_blocked"
  | "authority_boundary_blocked";

export type ExternalHandoffDeliveryOperatorDecisionStatus =
  | "ready_for_external_delivery_contract_record_write"
  | "blocked"
  | "insufficient_data"
  | "keep_preview_only";

export type ExternalHandoffDeliveryRecommendedDecision =
  | "record_external_delivery_contract_candidate"
  | "do_not_record_external_delivery_contract"
  | "wait_for_missing_prerequisites"
  | "resolve_residual_blockers_first";

export type ExternalHandoffDeliveryContractReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "records_invalid";

export type ExternalHandoffDeliveryContractWriteStatus =
  | "written"
  | "idempotent_existing"
  | "conflict"
  | "refused"
  | "read"
  | "listed"
  | "not_found"
  | "schema_missing";

export type ExternalHandoffDeliverySurface =
  | "future_external_delivery_contract_candidate"
  | "provider_specific_delivery_contract_required";

export interface ExternalHandoffDeliveryContractInput {
  workbench_spine_consolidation?: WorkbenchSpineConsolidation | unknown;
  residual_diagnostic_candidate_read_model?:
    | ResidualDiagnosticCandidateReadModel
    | unknown;
  sent_handoff_read?: SentHandoffReadForWeb | unknown;
  handoff_send_record_review?: HandoffSendRecordReview | unknown;
  handoff_send_contract_record_review?: HandoffSendContractRecordReview | unknown;
  exported_handoff_packet_artifact_read?:
    | ExportedHandoffPacketArtifactRead
    | unknown;
  applied_handoff_context_read?: AppliedHandoffContextRead | unknown;
  workbench_dogfood_loop_spine_overview?:
    | WorkbenchDogfoodLoopSpineOverview
    | unknown;
  requested_delivery_surface?: ExternalHandoffDeliverySurface | string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
  evidence_refs?: string[];
}

export interface ExternalHandoffDeliveryBoundary {
  delivery_performed: false;
  provider_contract_present: false;
  provider_specific_delivery: false;
  provider_called: false;
  external_message_sent: false;
  email_sent: false;
  slack_sent: false;
  webhook_called: false;
  network_called: false;
  clipboard_written: false;
  file_downloaded: false;
  local_fulfillment_is_external_delivery: false;
}

export interface ExternalHandoffDeliveryContractAuthorityBoundary {
  read_only: boolean;
  advisory_only: boolean;
  contract_only: boolean;
  source_of_truth: false;
  can_write_db: boolean;
  can_create_schema: boolean;
  can_create_external_delivery_contract_record: boolean;
  can_create_external_delivery_contract_receipt: boolean;
  can_send_handoff: false;
  can_call_send_provider: false;
  can_call_external_messaging: false;
  can_call_email: false;
  can_call_slack: false;
  can_call_webhook: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_call_browser_or_crawler: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_arbitrary_file: false;
  can_mutate_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_write_handoff_send_record: false;
  can_write_handoff_send_contract_record: false;
  can_write_handoff_packet_copy_export_record: false;
  can_write_handoff_packet_exported_artifact: false;
  can_write_handoff_packet_copy_export_contract_record: false;
  can_write_handoff_context_apply_record: false;
  can_write_applied_handoff_context_snapshot: false;
  can_write_handoff_context_update_contract_record: false;
  can_modify_api_perspective_current_route: false;
  can_update_upstream_current_working_perspective_source_tables: false;
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
  can_write_dogfood_metrics: false;
  can_update_global_dogfood_metrics: false;
  can_write_dogfood_metric_snapshot: false;
  can_write_reuse_outcome_ledger: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  can_render_workbench_action_button: false;
  notes: string[];
}

export interface ExternalHandoffDeliveryReadinessSummary {
  local_spine_ready: boolean;
  local_fulfillment_stage_fulfilled: boolean;
  exported_artifact_stage_exported: boolean;
  handoff_send_contract_stage_approved: boolean;
  local_fulfillment_ref_present: boolean;
  exported_artifact_ref_present: boolean;
  payload_integrity_ref_present: boolean;
  residual_gate_passed: boolean;
  authority_boundary_passed: boolean;
  external_delivery_not_performed: boolean;
  contract_decision_ready: boolean;
}

export interface ExternalHandoffDeliveryResidualGateSummary {
  gate_status: "passed" | "blocked" | "warning_only" | "insufficient_data";
  hard_blocking_candidate_ids: string[];
  warning_candidate_ids: string[];
  non_blocking_candidate_ids: string[];
  hard_blocker_reasons: string[];
  warning_reasons: string[];
}

export interface ExternalHandoffDeliveryContractRecordPreview {
  record_version: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_VERSION;
  scope: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE;
  source_preview_fingerprint: string;
  source_local_fulfillment_ref: string;
  source_handoff_send_contract_record_ref: string;
  source_exported_artifact_ref: string;
  source_applied_handoff_context_ref: string | null;
  payload_hash: string;
  payload_type: HandoffSendPayloadType | string;
  requested_delivery_mode: string;
  requested_delivery_surface: ExternalHandoffDeliverySurface;
  requested_recipient_ref: string;
  contract_status: "external_delivery_contract_candidate_recordable";
  external_delivery_boundary: ExternalHandoffDeliveryBoundary;
  source_refs: string[];
  evidence_refs: string[];
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  authority_boundary: ExternalHandoffDeliveryContractAuthorityBoundary;
  no_external_delivery_performed: true;
  no_provider_call_performed: true;
  no_external_message_sent: true;
}

export interface ExternalHandoffDeliveryContractPreview {
  preview_version: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_PREVIEW_VERSION;
  preview_fingerprint: string;
  scope: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE;
  as_of: string;
  status: ExternalHandoffDeliveryContractPreviewStatus;
  source_refs: string[];
  evidence_refs: string[];
  source_local_fulfillment_ref: string | null;
  source_handoff_send_contract_record_ref: string | null;
  source_exported_artifact_ref: string | null;
  source_applied_handoff_context_ref: string | null;
  payload_hash: string | null;
  payload_type: string | null;
  requested_delivery_mode: string | null;
  requested_delivery_surface: ExternalHandoffDeliverySurface;
  requested_recipient_ref: string | null;
  readiness_summary: ExternalHandoffDeliveryReadinessSummary;
  blocker_reasons: string[];
  warning_reasons: string[];
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  external_delivery_boundary: ExternalHandoffDeliveryBoundary;
  authority_boundary: ExternalHandoffDeliveryContractAuthorityBoundary;
  would_write_external_handoff_delivery_contract_record_preview:
    | ExternalHandoffDeliveryContractRecordPreview
    | null;
  would_not_do: string[];
  non_goals: string[];
}

export interface ExternalHandoffDeliveryOperatorDecisionPreviewInput {
  external_handoff_delivery_contract_preview?:
    | ExternalHandoffDeliveryContractPreview
    | unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  operator_decision_intent?:
    | "record_external_delivery_contract_candidate"
    | "keep_preview_only"
    | "reject";
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface ExternalHandoffDeliveryOperatorDecisionPreview {
  decision_preview_version:
    typeof EXTERNAL_HANDOFF_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION;
  decision_preview_fingerprint: string;
  scope: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE;
  as_of: string;
  decision_status: ExternalHandoffDeliveryOperatorDecisionStatus;
  recommended_operator_decision: ExternalHandoffDeliveryRecommendedDecision;
  decision_reasons: string[];
  blocker_reasons: string[];
  warning_reasons: string[];
  source_preview_fingerprint: string | null;
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_confirmation_ref: string | null;
  write_readiness: {
    write_ready: boolean;
    current_blockers: string[];
    current_missing_evidence: string[];
  };
  would_write_external_handoff_delivery_contract_decision_preview: {
    external_handoff_delivery_contract_preview:
      | ExternalHandoffDeliveryContractPreview
      | null;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
  };
  authority_boundary: ExternalHandoffDeliveryContractAuthorityBoundary;
  would_not_do: string[];
}

export interface ExternalHandoffDeliveryContractWriteInput {
  operator_decision_preview: ExternalHandoffDeliveryOperatorDecisionPreview;
  operator_approval: {
    operator_decision: "record_external_delivery_contract_candidate";
    approved_by: string;
    operator_ref: string;
    approved_at: string;
    approval_statement: string;
    checklist_confirmations: string[];
  };
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface ExternalHandoffDeliveryContractRecord {
  record_version: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  scope: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE;
  created_at: string;
  operator_ref: string;
  source_preview_fingerprint: string;
  source_operator_decision_fingerprint: string;
  source_local_fulfillment_ref: string;
  source_handoff_send_contract_record_ref: string;
  source_exported_artifact_ref: string;
  source_applied_handoff_context_ref: string | null;
  payload_hash: string;
  payload_type: string;
  requested_delivery_mode: string;
  requested_delivery_surface: ExternalHandoffDeliverySurface;
  requested_recipient_ref: string;
  contract_status: "recorded_as_external_handoff_delivery_contract_candidate";
  external_delivery_boundary: ExternalHandoffDeliveryBoundary;
  source_refs: string[];
  evidence_refs: string[];
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  authority_boundary: ExternalHandoffDeliveryContractAuthorityBoundary;
  notes: string[];
  receipt: ExternalHandoffDeliveryContractReceipt;
  record_fingerprint: string;
}

export interface ExternalHandoffDeliveryContractReceipt {
  receipt_version: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECEIPT_VERSION;
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
  no_side_effects: true;
  external_delivery_performed: false;
  provider_called: false;
  external_message_sent: false;
  network_called: false;
  clipboard_written: false;
  file_downloaded: false;
}

export interface ExternalHandoffDeliveryContractStoreResult {
  store_version: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_STORE_VERSION;
  scope: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE;
  status: ExternalHandoffDeliveryContractWriteStatus;
  ok: boolean;
  error_code: string | null;
  record: ExternalHandoffDeliveryContractRecord | null;
  records: ExternalHandoffDeliveryContractRecord[];
  receipt: ExternalHandoffDeliveryContractReceipt;
  notes: string[];
}

export interface ExternalHandoffDeliveryContractRecordReviewInput {
  records?: unknown[];
  store_result?: ExternalHandoffDeliveryContractStoreResult | null;
  selected_record_id?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface ExternalHandoffDeliveryContractRecordSummary {
  record_id: string | null;
  created_at: string | null;
  source_local_fulfillment_ref: string | null;
  source_handoff_send_contract_record_ref: string | null;
  source_exported_artifact_ref: string | null;
  payload_hash: string | null;
  payload_type: string | null;
  requested_delivery_surface: string | null;
  requested_delivery_mode: string | null;
  requested_recipient_ref: string | null;
  contract_status: string | null;
  delivery_performed: boolean;
  provider_called: boolean;
  external_message_sent: boolean;
  problem_reasons: string[];
}

export interface ExternalHandoffDeliveryContractRecordReview {
  review_version:
    typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_REVIEW_VERSION;
  scope: typeof EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE;
  as_of: string;
  review_status: ExternalHandoffDeliveryContractReviewStatus;
  selected_record_summary: ExternalHandoffDeliveryContractRecordSummary | null;
  latest_record_summary: ExternalHandoffDeliveryContractRecordSummary | null;
  record_summaries: ExternalHandoffDeliveryContractRecordSummary[];
  input_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    invalid_record_count: number;
    selected_record_id: string | null;
    selected_record_found: boolean;
  };
  evidence_summary: {
    has_valid_records: boolean;
    source_local_fulfillment_refs: string[];
    source_exported_artifact_refs: string[];
    payload_hashes: string[];
    delivery_performed: false;
    provider_called: false;
    external_message_sent: false;
  };
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  source_refs: string[];
  records: ExternalHandoffDeliveryContractRecord[];
  authority_boundary: ExternalHandoffDeliveryContractAuthorityBoundary;
}
