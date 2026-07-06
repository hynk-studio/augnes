import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";
import type { HandoffPacketCopyExportContractRecordReview } from "./handoff-packet-copy-export-contract-record-review";
import type {
  HandoffPacketCopyExportContractRecord,
  HandoffPacketCopyExportContractStoreResult,
} from "./handoff-packet-copy-export-contract-write";
import type {
  HandoffPacketCopyExportPacketFormat,
  HandoffPacketCopyExportPlan,
  HandoffPacketCopyExportTarget,
  HandoffPacketEntry,
  HandoffPacketManifest,
} from "./handoff-packet-copy-export-contract-preview";

export const HANDOFF_PACKET_COPY_EXPORT_PREVIEW_VERSION =
  "handoff_packet_copy_export_preview.v0.1" as const;
export const HANDOFF_PACKET_COPY_EXPORT_SCOPE = "project:augnes" as const;
export const HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION =
  "handoff_packet_exported_artifact.v0.1" as const;

export type HandoffPacketCopyExportPreviewStatus =
  | "no_handoff_packet_copy_export_contract_record"
  | "no_packet_copy_export_material"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_handoff_packet_copy_export_record_write"
  | "keep_preview_only";

export type HandoffPacketCopyExportRecommendedNextAction =
  | "supply_handoff_packet_copy_export_contract_record"
  | "review_handoff_packet_copy_export_preview"
  | "write_handoff_packet_copy_export_record"
  | "resolve_handoff_packet_copy_export_blockers"
  | "keep_preview_only";

export interface HandoffPacketCopyExportPreviewInput {
  handoff_packet_copy_export_contract_record_review?: unknown;
  handoff_packet_copy_export_contract_record?: unknown;
  applied_handoff_context_read?: unknown;
  handoff_context_apply_record_review?: unknown;
  existing_handoff_packet_or_capsule?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffPacketExportedArtifact {
  artifact_version: typeof HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION;
  artifact_ref: string;
  scope: typeof HANDOFF_PACKET_COPY_EXPORT_SCOPE;
  as_of: string;
  packet_family: "augnes_operator_handoff_packet";
  packet_format: HandoffPacketCopyExportPacketFormat;
  copy_export_target: HandoffPacketCopyExportTarget;
  source_copy_export_contract_record_ref: string;
  source_applied_handoff_context_snapshot_ref: string;
  source_handoff_context_apply_record_ref: string | null;
  source_handoff_context_update_contract_record_ref: string | null;
  source_route_integration_read_ref: string | null;
  source_runtime_current_working_perspective_ref: string | null;
  source_applied_cwp_snapshot_ref: string | null;
  packet_manifest: HandoffPacketManifest;
  packet_entries: HandoffPacketEntry[];
  packet_entry_count: number;
  packet_section_counts: Record<string, number>;
  markdown_payload: string | null;
  json_payload: Record<string, unknown> | null;
  capsule_payload: Record<string, unknown> | null;
  payload_hash: string;
  public_safety_summary: {
    public_safe: true;
    raw_private_material_excluded: true;
    raw_text_excluded: true;
    raw_report_excluded: true;
    raw_excerpt_excluded: true;
  };
  source_refs: string[];
  evidence_refs: string[];
  artifact_metadata: {
    local_artifact_only: true;
    clipboard_write_not_performed: true;
    file_write_not_performed: true;
    download_not_performed: true;
    handoff_send_not_performed: true;
    future_user_surface_copy_export_required: true;
    future_handoff_send_contract_required: true;
  };
  authority_boundary: HandoffPacketCopyExportAuthorityBoundary;
}

export interface HandoffPacketCopyExportReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_contract_record: true;
  requires_review_confirmation: true;
  requires_idempotency_key: true;
  requires_operator_ref: true;
  requires_source_refs: true;
  requires_evidence_refs: true;
  requires_no_blockers: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
}

export interface HandoffPacketCopyExportAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  copy_export_preview_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_handoff_packet_copy_export_record: false;
  can_create_handoff_packet_copy_export_receipt: false;
  can_create_handoff_packet_exported_artifact: false;
  can_persist_local_packet_artifact: false;
  can_copy_export_handoff_packet_to_local_artifact: false;
  can_write_handoff_packet_file: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_send_handoff: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context_update_live: false;
  can_write_selected_refs_to_live_handoff: false;
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

export interface HandoffPacketCopyExportPreview {
  preview_version: typeof HANDOFF_PACKET_COPY_EXPORT_PREVIEW_VERSION;
  scope: typeof HANDOFF_PACKET_COPY_EXPORT_SCOPE;
  as_of: string;
  source_refs: string[];
  copy_export_preview_status: HandoffPacketCopyExportPreviewStatus;
  recommended_next_action: HandoffPacketCopyExportRecommendedNextAction;
  input_summary: {
    has_contract_record_review: boolean;
    has_direct_contract_record: boolean;
    has_applied_handoff_context_read: boolean;
    requested_packet_format: string | null;
    requested_copy_export_target: string | null;
    proposed_packet_entry_count: number;
    proposed_packet_section_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    review_confirmation_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    requested_operator_ref_supplied: boolean;
  };
  source_status: {
    handoff_packet_copy_export_contract_record_review:
      | "supplied"
      | "missing"
      | "malformed"
      | "invalid";
    selected_contract_record: "found" | "missing";
    applied_handoff_context_read: "supplied" | "missing" | "malformed" | "invalid";
    existing_handoff_material: "supplied" | "missing" | "unsafe";
  };
  copy_export_readiness: HandoffPacketCopyExportReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_contract_record_review: boolean;
    has_contract_record: boolean;
    has_packet_manifest: boolean;
    has_packet_entries: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_missing_evidence: boolean;
    has_receipt_side_effect_problem: boolean;
    no_clipboard_write_confirmed: true;
    no_file_download_confirmed: true;
    no_handoff_send_confirmed: true;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    problem_record_ids: string[];
  };
  source_contract_summary: {
    source_copy_export_contract_record_ref: string | null;
    source_applied_handoff_context_snapshot_ref: string | null;
    requested_packet_format: string | null;
    requested_copy_export_target: string | null;
    proposed_packet_entry_count: number;
    proposed_packet_section_counts: Record<string, number>;
  };
  proposed_exported_packet_artifact_summary: {
    artifact_ref: string | null;
    packet_format: string | null;
    copy_export_target: string | null;
    packet_entry_count: number;
    packet_section_counts: Record<string, number>;
    has_markdown_payload: boolean;
    has_json_payload: boolean;
    has_capsule_payload: boolean;
    payload_hash: string | null;
  };
  proposed_exported_packet_artifact: HandoffPacketExportedArtifact | null;
  proposed_packet_rendering_summary: {
    markdown_payload_present: boolean;
    json_payload_present: boolean;
    capsule_payload_present: boolean;
    payload_hash: string | null;
    clipboard_write_not_performed: true;
    download_not_performed: true;
    file_write_not_performed: true;
    handoff_send_not_performed: true;
  };
  proposed_packet_artifact_plan: {
    plan_version: "handoff_packet_copy_export_artifact_plan.v0.1";
    source_contract_record_ref: string | null;
    packet_format: HandoffPacketCopyExportPacketFormat | null;
    copy_export_target: HandoffPacketCopyExportTarget | null;
    packet_entry_count: number;
    packet_section_counts: Record<string, number>;
    local_artifact_persistence_required: true;
    clipboard_write_not_performed: true;
    file_write_not_performed: true;
    download_not_performed: true;
    handoff_send_not_performed: true;
  };
  would_write_handoff_packet_copy_export_record_preview: {
    record_version: "handoff_packet_copy_export_record.v0.1";
    scope: typeof HANDOFF_PACKET_COPY_EXPORT_SCOPE;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    source_refs: string[];
    evidence_refs: string[];
    source_copy_export_contract_record_ref: string | null;
    source_applied_handoff_context_snapshot_ref: string | null;
    requested_packet_format: HandoffPacketCopyExportPacketFormat | null;
    requested_copy_export_target: HandoffPacketCopyExportTarget | null;
    proposed_exported_packet_artifact: HandoffPacketExportedArtifact | null;
    packet_entry_count: number;
    packet_section_counts: Record<string, number>;
    artifact_hash: string | null;
    no_actual_external_copy_export_performed: true;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: HandoffPacketCopyExportAuthorityBoundary;
}

export type HandoffPacketCopyExportPreviewSourceReview =
  HandoffPacketCopyExportContractRecordReview;
export type HandoffPacketCopyExportPreviewSourceRecord =
  HandoffPacketCopyExportContractRecord;
export type HandoffPacketCopyExportPreviewSourceStore =
  HandoffPacketCopyExportContractStoreResult;
export type HandoffPacketCopyExportPreviewAppliedRead =
  AppliedHandoffContextRead;
export type HandoffPacketCopyExportPreviewPlan =
  HandoffPacketCopyExportPlan;
