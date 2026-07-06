import type {
  HandoffSendContractNoSideEffects,
  HandoffSendContractRecord,
  HandoffSendContractStoreResult,
} from "./handoff-send-contract-write";

export const HANDOFF_SEND_CONTRACT_RECORD_REVIEW_VERSION =
  "handoff_send_contract_record_review.v0.1" as const;

export type HandoffSendContractRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "records_invalid";

export interface HandoffSendContractRecordReviewInput {
  records?: unknown[];
  store_result?: HandoffSendContractStoreResult | null;
  selected_record_id?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffSendContractRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  requested_send_surface: string | null;
  requested_delivery_mode: string | null;
  requested_recipient_ref: string | null;
  source_exported_artifact_ref: string | null;
  source_handoff_packet_copy_export_record_ref: string | null;
  packet_format: string | null;
  payload_hash: string | null;
  record_fingerprint: string | null;
  receipt_no_side_effects_valid: boolean;
  problem_reasons: string[];
}

export interface HandoffSendContractNoSideEffectsSummary {
  handoff_send_contract_record_written_count: number;
  handoff_send_contract_receipt_written_count: number;
  handoff_send_contract_persisted_count: number;
  handoff_send_contract_written_count: number;
  handoff_sent_count: number;
  send_provider_called_count: number;
  external_messaging_called_count: number;
  email_called_count: number;
  slack_called_count: number;
  webhook_called_count: number;
  provider_called_count: number;
  github_called_count: number;
  codex_executed_count: number;
  clipboard_written_count: number;
  file_download_created_count: number;
  arbitrary_file_written_count: number;
  live_handoff_context_mutated_count: number;
  selected_refs_written_to_live_handoff_count: number;
  memory_written_count: number;
  dogfood_metrics_written_count: number;
}

export interface HandoffSendContractRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_handoff_send_contract_record: false;
  can_send_handoff: false;
  can_call_send_provider: false;
  can_call_external_messaging: false;
  can_call_email: false;
  can_call_slack: false;
  can_call_webhook: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_arbitrary_file: false;
  can_write_handoff_packet_file: false;
  can_mutate_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_write_memory: false;
  can_write_dogfood_metrics: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_create_graph_or_vector_store: false;
  can_crawl_or_observe_browser: false;
  can_render_workbench_action_button: false;
  notes: string[];
}

export interface HandoffSendContractRecordReview {
  review_version: typeof HANDOFF_SEND_CONTRACT_RECORD_REVIEW_VERSION;
  scope: "project:augnes";
  as_of: string;
  source_refs: string[];
  review_status: HandoffSendContractRecordReviewStatus;
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
  record_summaries: HandoffSendContractRecordSummary[];
  selected_record_summary: HandoffSendContractRecordSummary | null;
  latest_record_summary: HandoffSendContractRecordSummary | null;
  records: HandoffSendContractRecord[];
  evidence_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    has_records: boolean;
    has_selected_record: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_missing_evidence: boolean;
    has_receipt_side_effect_problem: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    problem_record_ids: string[];
  };
  handoff_send_contract_material_summary: {
    send_surface_counts: Record<string, number>;
    delivery_mode_counts: Record<string, number>;
    recipient_refs: string[];
    source_exported_artifact_refs: string[];
    source_handoff_packet_copy_export_record_refs: string[];
    packet_format_counts: Record<string, number>;
    payload_hashes: string[];
  };
  receipt_no_side_effects_summary: HandoffSendContractNoSideEffectsSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: HandoffSendContractRecordReviewAuthorityBoundary;
}

export type HandoffSendContractReviewNoSideEffects =
  HandoffSendContractNoSideEffects;
