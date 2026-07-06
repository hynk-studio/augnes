import type {
  AppliedHandoffContextSnapshot,
  HandoffContextApplyNoSideEffects,
  HandoffContextApplyRecord,
  HandoffContextApplyStoreResult,
} from "./handoff-context-apply-write";

export const HANDOFF_CONTEXT_APPLY_RECORD_REVIEW_VERSION =
  "handoff_context_apply_record_review.v0.1" as const;

export interface HandoffContextApplyRecordReviewInput {
  records?: unknown[];
  store_result?: HandoffContextApplyStoreResult | null;
  selected_record_id?: string | null;
  selected_applied_handoff_context_snapshot_ref?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type HandoffContextApplyRecordReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "selected_applied_snapshot_found"
  | "selected_applied_snapshot_missing"
  | "records_invalid";

export interface HandoffContextApplyRecordSummary {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  operator_ref: string | null;
  source_handoff_context_update_contract_record_ref: string | null;
  source_route_integration_read_ref: string | null;
  source_runtime_current_working_perspective_ref: string | null;
  source_applied_snapshot_ref: string | null;
  applied_handoff_context_snapshot_ref: string | null;
  applied_entry_count: number;
  applied_section_counts: Record<string, number>;
  record_fingerprint: string | null;
  receipt_no_side_effects_valid: boolean;
  problem_reasons: string[];
}

export interface AppliedHandoffContextSnapshotSummary {
  applied_handoff_context_snapshot_ref: string | null;
  snapshot_version: string | null;
  source_handoff_context_update_contract_record_ref: string | null;
  source_route_integration_read_ref: string | null;
  applied_entry_count: number;
  section_counts: Record<string, number>;
  previous_context_used: boolean;
  copy_export_still_pending: boolean;
  send_still_pending: boolean;
  problem_reasons: string[];
}

export interface HandoffContextApplyNoSideEffectsSummary {
  handoff_context_apply_record_written_count: number;
  handoff_context_apply_receipt_written_count: number;
  handoff_context_apply_persisted_count: number;
  applied_handoff_context_snapshot_written_count: number;
  handoff_context_update_applied_to_local_snapshot_count: number;
  live_handoff_context_updated_count: number;
  live_handoff_context_mutated_count: number;
  handoff_context_applied_live_count: number;
  handoff_context_mutated_count: number;
  handoff_sent_count: number;
  selected_refs_written_to_live_handoff_count: number;
  handoff_packet_copy_exported_count: number;
  handoff_packet_sent_count: number;
  api_perspective_current_route_modified_count: number;
  current_working_perspective_route_response_replaced_count: number;
  memory_written_count: number;
  provider_called_count: number;
  github_called_count: number;
  codex_executed_count: number;
}

export interface HandoffContextApplyRecordReviewAuthorityBoundary {
  read_only_record_review: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_handoff_context_apply_record: false;
  can_create_applied_handoff_context_snapshot: false;
  can_apply_handoff_context_update_live: false;
  can_mutate_handoff_context: false;
  can_send_handoff: false;
  can_copy_export_handoff_packet: false;
  can_write_selected_refs_to_live_handoff: false;
  can_modify_api_perspective_current_route: false;
  can_replace_current_working_perspective_route_response: false;
  can_update_upstream_current_working_perspective_source_tables: false;
  can_write_applied_current_working_perspective_snapshot: false;
  can_write_current_working_perspective_apply_record: false;
  can_write_current_working_perspective_update_contract_record: false;
  can_write_route_integration_contract_record: false;
  can_write_handoff_context_update_contract_record: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_continuity_relay: false;
  can_update_continuity_relay: false;
  can_apply_live_relay_state: false;
  can_write_memory: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
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

export interface HandoffContextApplyRecordReview {
  review_version: typeof HANDOFF_CONTEXT_APPLY_RECORD_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  review_status: HandoffContextApplyRecordReviewStatus;
  input_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    invalid_record_count: number;
    selected_record_id: string | null;
    selected_record_found: boolean;
    selected_applied_handoff_context_snapshot_ref: string | null;
    selected_applied_snapshot_found: boolean;
    latest_record_id: string | null;
    latest_record_created_at: string | null;
    latest_applied_handoff_context_snapshot_ref: string | null;
    receipt_side_effect_problem_count: number;
  };
  record_summaries: HandoffContextApplyRecordSummary[];
  selected_record_summary: HandoffContextApplyRecordSummary | null;
  selected_applied_snapshot_summary: AppliedHandoffContextSnapshotSummary | null;
  latest_record_summary: HandoffContextApplyRecordSummary | null;
  latest_applied_snapshot_summary: AppliedHandoffContextSnapshotSummary | null;
  records: HandoffContextApplyRecord[];
  applied_snapshots: AppliedHandoffContextSnapshot[];
  evidence_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    has_records: boolean;
    has_applied_snapshots: boolean;
    has_selected_record: boolean;
    has_selected_applied_snapshot: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_missing_evidence: boolean;
    has_receipt_side_effect_problem: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    problem_record_ids: string[];
  };
  handoff_context_apply_material_summary: {
    section_counts: Record<string, number>;
    entry_kind_counts: Record<string, number>;
    applied_entry_count: number;
    source_contract_record_refs: string[];
    source_route_integration_read_refs: string[];
    copy_export_still_pending: boolean;
    send_still_pending: boolean;
  };
  receipt_no_side_effects_summary: HandoffContextApplyNoSideEffectsSummary;
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: HandoffContextApplyRecordReviewAuthorityBoundary;
}

export type HandoffContextApplyRecordReviewNoSideEffects =
  HandoffContextApplyNoSideEffects;
