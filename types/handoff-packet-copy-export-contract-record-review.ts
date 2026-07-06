import type {
  HandoffPacketCopyExportContractNoSideEffects,
  HandoffPacketCopyExportContractRecord,
  HandoffPacketCopyExportContractStoreResult,
} from "./handoff-packet-copy-export-contract-write";

export const HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_REVIEW_VERSION =
  "handoff_packet_copy_export_contract_record_review.v0.1" as const;

export type HandoffPacketCopyExportContractRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "records_invalid";

export interface HandoffPacketCopyExportContractRecordReviewInput {
  records?: unknown[];
  store_result?: HandoffPacketCopyExportContractStoreResult | null;
  selected_record_id?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffPacketCopyExportContractRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  source_applied_handoff_context_snapshot_ref: string | null;
  source_handoff_context_apply_record_ref: string | null;
  requested_packet_format: string | null;
  requested_copy_export_target: string | null;
  proposed_packet_entry_count: number;
  proposed_packet_section_counts: Record<string, number>;
  record_fingerprint: string | null;
  receipt_no_side_effects_valid: boolean;
  problem_reasons: string[];
}

export interface HandoffPacketCopyExportContractNoSideEffectsSummary {
  handoff_packet_copy_export_contract_record_written_count: number;
  handoff_packet_copy_export_contract_receipt_written_count: number;
  handoff_packet_copy_export_contract_persisted_count: number;
  handoff_packet_copy_export_contract_written_count: number;
  handoff_packet_copied_count: number;
  handoff_packet_exported_count: number;
  handoff_packet_file_written_count: number;
  clipboard_written_count: number;
  file_download_created_count: number;
  handoff_sent_count: number;
  live_handoff_context_mutated_count: number;
  selected_refs_written_to_live_handoff_count: number;
  memory_written_count: number;
  provider_called_count: number;
  github_called_count: number;
  codex_executed_count: number;
}

export interface HandoffPacketCopyExportContractRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_handoff_packet_copy_export_contract_record: false;
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

export interface HandoffPacketCopyExportContractRecordReview {
  review_version: typeof HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_REVIEW_VERSION;
  scope: "project:augnes";
  as_of: string;
  source_refs: string[];
  review_status: HandoffPacketCopyExportContractRecordReviewStatus;
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
  record_summaries: HandoffPacketCopyExportContractRecordSummary[];
  selected_record_summary: HandoffPacketCopyExportContractRecordSummary | null;
  latest_record_summary: HandoffPacketCopyExportContractRecordSummary | null;
  records: HandoffPacketCopyExportContractRecord[];
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
  handoff_packet_copy_export_contract_material_summary: {
    packet_format_counts: Record<string, number>;
    copy_export_target_counts: Record<string, number>;
    packet_section_counts: Record<string, number>;
    packet_entry_count: number;
    source_applied_handoff_context_snapshot_refs: string[];
  };
  receipt_no_side_effects_summary:
    HandoffPacketCopyExportContractNoSideEffectsSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: HandoffPacketCopyExportContractRecordReviewAuthorityBoundary;
}

export type HandoffPacketCopyExportContractReviewNoSideEffects =
  HandoffPacketCopyExportContractNoSideEffects;
