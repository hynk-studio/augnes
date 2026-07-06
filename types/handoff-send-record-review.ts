import type {
  HandoffSendDeliveryMode,
  HandoffSendPayloadType,
  HandoffSendSurface,
} from "./handoff-send-contract-preview";
import type {
  HandoffSendExecutionMode,
  HandoffSendFulfillmentStatus,
} from "./handoff-send-preview";
import type {
  HandoffSendNoSideEffects,
  HandoffSendRecord,
  HandoffSendStoreResult,
} from "./handoff-send-write";

export const HANDOFF_SEND_RECORD_REVIEW_VERSION =
  "handoff_send_record_review.v0.1" as const;

export type HandoffSendRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "records_invalid";

export interface HandoffSendRecordReviewInput {
  records?: unknown[];
  store_result?: HandoffSendStoreResult | null;
  selected_record_id?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffSendRecordSummary {
  record_id: string | null;
  idempotency_key: string | null;
  created_at: string | null;
  operator_ref: string | null;
  requested_send_surface: string | null;
  requested_delivery_mode: string | null;
  requested_recipient_ref: string | null;
  requested_send_execution_mode: string | null;
  fulfillment_status: string | null;
  source_handoff_send_contract_record_ref: string | null;
  source_exported_artifact_ref: string | null;
  payload_hash: string | null;
  payload_type: string | null;
  receipt_no_side_effects_valid: boolean;
  authority_boundary_valid: boolean;
  authority_profile_valid: boolean;
  no_external_delivery_performed: boolean;
  problem_reasons: string[];
}

export interface HandoffSendNoSideEffectsSummary {
  allowed_local_write_true_fields: string[];
  forbidden_true_fields: string[];
  has_forbidden_true_field: boolean;
  local_fulfillment_recorded_only: boolean;
}

export interface HandoffSendRecordReviewAuthorityBoundary {
  read_only: true;
  review_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_handoff_send_record: false;
  can_create_handoff_send_receipt: false;
  can_record_local_send_fulfillment: false;
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
  can_mutate_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_write_handoff_send_contract_record: false;
  can_write_memory: false;
  can_write_dogfood_metrics: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_render_workbench_action_button: false;
  notes: string[];
}

export interface HandoffSendRecordReview {
  review_version: typeof HANDOFF_SEND_RECORD_REVIEW_VERSION;
  scope: "project:augnes";
  as_of: string;
  source_refs: string[];
  review_status: HandoffSendRecordReviewStatus;
  input_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    invalid_record_count: number;
    selected_record_id: string | null;
    selected_record_found: boolean;
    latest_record_id: string | null;
    latest_record_created_at: string | null;
    receipt_side_effect_problem_count: number;
  };
  record_summaries: HandoffSendRecordSummary[];
  selected_record_summary: HandoffSendRecordSummary | null;
  latest_record_summary: HandoffSendRecordSummary | null;
  records: HandoffSendRecord[];
  evidence_summary: {
    has_records: boolean;
    has_valid_records: boolean;
    has_invalid_records: boolean;
    selected_record_found: boolean;
    send_surfaces: HandoffSendSurface[];
    delivery_modes: HandoffSendDeliveryMode[];
    recipient_refs: string[];
    send_execution_modes: HandoffSendExecutionMode[];
    fulfillment_statuses: HandoffSendFulfillmentStatus[];
    source_handoff_send_contract_record_refs: string[];
    source_exported_artifact_refs: string[];
    payload_hashes: string[];
    payload_types: HandoffSendPayloadType[];
    problem_record_ids: string[];
  };
  handoff_send_material_summary: {
    latest_record_id: string | null;
    latest_fulfillment_status: HandoffSendFulfillmentStatus | null;
    latest_payload_hash: string | null;
    latest_payload_type: HandoffSendPayloadType | null;
    latest_source_handoff_send_contract_record_ref: string | null;
    external_delivery_performed: false;
    provider_called: false;
  };
  receipt_no_side_effects_summary: HandoffSendNoSideEffectsSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: HandoffSendRecordReviewAuthorityBoundary;
}

export type HandoffSendRecordReviewSources = {
  store_result?: HandoffSendStoreResult | null;
  records?: HandoffSendRecord[];
  no_side_effects?: HandoffSendNoSideEffects;
};
