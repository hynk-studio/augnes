import type { HandoffPacketExportedArtifact } from "./handoff-packet-copy-export-preview";
import type {
  HandoffPacketCopyExportNoSideEffects,
  HandoffPacketCopyExportRecord,
  HandoffPacketCopyExportStoreResult,
} from "./handoff-packet-copy-export-write";

export const HANDOFF_PACKET_COPY_EXPORT_RECORD_REVIEW_VERSION =
  "handoff_packet_copy_export_record_review.v0.1" as const;

export type HandoffPacketCopyExportRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "selected_exported_artifact_found"
  | "selected_exported_artifact_missing"
  | "records_invalid";

export interface HandoffPacketCopyExportRecordReviewInput {
  records?: unknown[];
  store_result?: HandoffPacketCopyExportStoreResult | null;
  selected_record_id?: string | null;
  selected_exported_artifact_ref?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface ExportedHandoffPacketArtifactSummary {
  artifact_ref: string;
  packet_format: string;
  copy_export_target: string;
  source_copy_export_contract_record_ref: string;
  source_applied_handoff_context_snapshot_ref: string;
  packet_entry_count: number;
  packet_section_counts: Record<string, number>;
  has_markdown_payload: boolean;
  has_json_payload: boolean;
  has_capsule_payload: boolean;
  payload_hash: string;
  problem_reasons: string[];
}

export interface HandoffPacketCopyExportRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  exported_artifact_ref: string | null;
  source_copy_export_contract_record_ref: string | null;
  requested_packet_format: string | null;
  requested_copy_export_target: string | null;
  packet_entry_count: number;
  packet_section_counts: Record<string, number>;
  payload_hash: string | null;
  record_fingerprint: string | null;
  receipt_no_side_effects_valid: boolean;
  problem_reasons: string[];
}

export interface HandoffPacketCopyExportNoSideEffectsSummary {
  handoff_packet_copy_export_record_written_count: number;
  handoff_packet_copy_export_receipt_written_count: number;
  handoff_packet_copy_export_persisted_count: number;
  handoff_packet_exported_artifact_written_count: number;
  handoff_packet_materialized_to_local_artifact_count: number;
  clipboard_written_count: number;
  file_download_created_count: number;
  arbitrary_file_written_count: number;
  handoff_packet_file_written_count: number;
  handoff_packet_copied_count: number;
  handoff_packet_exported_count: number;
  handoff_sent_count: number;
  live_handoff_context_mutated_count: number;
  selected_refs_written_to_live_handoff_count: number;
  memory_written_count: number;
  provider_called_count: number;
  github_called_count: number;
  codex_executed_count: number;
}

export interface HandoffPacketCopyExportRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_handoff_packet_copy_export_record: false;
  can_create_handoff_packet_exported_artifact: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_arbitrary_file: false;
  can_write_handoff_packet_file: false;
  can_send_handoff: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context_update_live: false;
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

export interface HandoffPacketCopyExportRecordReview {
  review_version: typeof HANDOFF_PACKET_COPY_EXPORT_RECORD_REVIEW_VERSION;
  scope: "project:augnes";
  as_of: string;
  source_refs: string[];
  review_status: HandoffPacketCopyExportRecordReviewStatus;
  input_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    invalid_record_count: number;
    selected_record_id: string | null;
    selected_record_found: boolean;
    selected_exported_artifact_ref: string | null;
    selected_exported_artifact_found: boolean;
    latest_record_id: string | null;
    latest_record_created_at: string | null;
    receipt_side_effect_problem_count: number;
  };
  record_summaries: HandoffPacketCopyExportRecordSummary[];
  selected_record_summary: HandoffPacketCopyExportRecordSummary | null;
  selected_exported_artifact_summary:
    | ExportedHandoffPacketArtifactSummary
    | null;
  latest_record_summary: HandoffPacketCopyExportRecordSummary | null;
  latest_exported_artifact_summary:
    | ExportedHandoffPacketArtifactSummary
    | null;
  records: HandoffPacketCopyExportRecord[];
  exported_artifacts: HandoffPacketExportedArtifact[];
  evidence_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    has_records: boolean;
    has_selected_record: boolean;
    has_selected_exported_artifact: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_missing_evidence: boolean;
    has_receipt_side_effect_problem: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    problem_record_ids: string[];
  };
  handoff_packet_copy_export_material_summary: {
    packet_format_counts: Record<string, number>;
    copy_export_target_counts: Record<string, number>;
    packet_section_counts: Record<string, number>;
    packet_entry_count: number;
    payload_type_counts: Record<string, number>;
    payload_hashes: string[];
    source_copy_export_contract_record_refs: string[];
  };
  receipt_no_side_effects_summary: HandoffPacketCopyExportNoSideEffectsSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: HandoffPacketCopyExportRecordReviewAuthorityBoundary;
}

export type HandoffPacketCopyExportReviewNoSideEffects =
  HandoffPacketCopyExportNoSideEffects;
