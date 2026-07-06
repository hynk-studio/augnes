import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";
import type { CurrentWorkingPerspectiveRouteIntegrationRead } from "./current-working-perspective-route-integration-read";
import type { HandoffContextApplyRecordReview } from "./handoff-context-apply-record-review";
import type { HandoffContextUpdateContractRecordReview } from "./handoff-context-update-contract-record-review";

export const HANDOFF_PACKET_COPY_EXPORT_CONTRACT_PREVIEW_VERSION =
  "handoff_packet_copy_export_contract_preview.v0.1" as const;
export const HANDOFF_PACKET_COPY_EXPORT_CONTRACT_SCOPE =
  "project:augnes" as const;

export type HandoffPacketCopyExportPacketFormat =
  | "operator_handoff_packet_markdown"
  | "codex_handoff_packet_json"
  | "conversation_handoff_capsule"
  | "dual_markdown_and_json";

export type HandoffPacketCopyExportTarget =
  | "clipboard_candidate"
  | "download_candidate"
  | "local_file_candidate"
  | "operator_copy_surface_candidate";

export type HandoffPacketCopyExportContractPreviewStatus =
  | "no_applied_handoff_context_snapshot"
  | "no_handoff_packet_copy_export_material"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_handoff_packet_copy_export_contract_record_write"
  | "keep_preview_only";

export type HandoffPacketCopyExportContractRecommendedNextAction =
  | "supply_applied_handoff_context_snapshot"
  | "review_handoff_packet_copy_export_contract"
  | "write_handoff_packet_copy_export_contract_record"
  | "resolve_handoff_packet_copy_export_contract_blockers"
  | "keep_preview_only";

export type HandoffPacketSection =
  | "packet_header_section"
  | "current_frame_section"
  | "current_thesis_section"
  | "active_goals_section"
  | "next_candidates_section"
  | "open_questions_section"
  | "active_risks_section"
  | "continuity_relay_section"
  | "perspective_units_section"
  | "next_work_bias_section"
  | "route_integration_metadata_section"
  | "operator_review_required_section"
  | "blocked_or_missing_context_section"
  | "source_trace_section"
  | "packet_footer_section";

export type HandoffPacketEntryKind =
  | "heading"
  | "summary"
  | "warning"
  | "next_action"
  | "review_required"
  | "stop_condition"
  | "source_trace"
  | "fallback_note"
  | "footer";

export type HandoffPacketCopyExportRenderingHint =
  | "markdown_bullet"
  | "markdown_heading"
  | "json_field"
  | "capsule_field";

export interface HandoffPacketCopyExportContractPreviewInput {
  applied_handoff_context_read?: unknown;
  handoff_context_apply_record_review?: unknown;
  handoff_context_apply_record?: unknown;
  applied_handoff_context_snapshot?: unknown;
  handoff_context_update_contract_record_review?: unknown;
  current_working_perspective_route_integration_read?: unknown;
  existing_handoff_packet_or_capsule?: unknown;
  requested_packet_format?: HandoffPacketCopyExportPacketFormat | string;
  requested_copy_export_target?: HandoffPacketCopyExportTarget | string;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffPacketManifest {
  manifest_version: "handoff_packet_manifest.v0.1";
  packet_ref: string;
  packet_title: string;
  packet_format: HandoffPacketCopyExportPacketFormat;
  packet_target: HandoffPacketCopyExportTarget;
  source_applied_handoff_context_snapshot_ref: string;
  source_apply_record_ref: string | null;
  entry_count: number;
  section_count: number;
  public_safe: true;
  raw_private_material_excluded: true;
  copy_export_not_performed: true;
  send_not_performed: true;
  future_copy_export_required: true;
  future_send_required: true;
}

export interface HandoffPacketEntry {
  packet_entry_ref: string;
  source_applied_entry_ref: string | null;
  packet_section: HandoffPacketSection;
  entry_kind: HandoffPacketEntryKind;
  copy_export_rendering_hint: HandoffPacketCopyExportRenderingHint;
  summary: string;
  source_record_refs: string[];
  source_refs: string[];
  evidence_refs: string[];
  public_safe: true;
  raw_private_material_excluded: true;
  authority_required: "future_handoff_packet_copy_export";
  persistence_horizon: "handoff_packet_copy_export_contract_record";
}

export interface HandoffPacketCopyExportPlan {
  plan_version: "handoff_packet_copy_export_plan.v0.1";
  packet_format: HandoffPacketCopyExportPacketFormat | null;
  copy_export_target: HandoffPacketCopyExportTarget | null;
  packet_entry_count: number;
  packet_section_counts: Record<string, number>;
  source_applied_handoff_context_snapshot_ref: string | null;
  copy_export_not_performed: true;
  clipboard_write_not_performed: true;
  file_write_not_performed: true;
  download_not_performed: true;
  handoff_send_not_performed: true;
  future_copy_export_required: true;
  future_send_required: true;
}

export interface HandoffPacketCopyExportContractMaterial {
  contract_kind: "handoff_packet_copy_export_contract.v0.1";
  packet_family: "augnes_operator_handoff_packet";
  source_applied_handoff_context_snapshot_ref: string;
  source_handoff_context_apply_record_ref: string | null;
  source_handoff_context_update_contract_record_ref: string | null;
  source_route_integration_read_ref: string | null;
  source_runtime_current_working_perspective_ref: string | null;
  source_applied_cwp_snapshot_ref: string | null;
  requested_packet_format: HandoffPacketCopyExportPacketFormat;
  requested_copy_export_target: HandoffPacketCopyExportTarget;
  proposed_packet_manifest: HandoffPacketManifest;
  proposed_packet_sections: HandoffPacketSection[];
  proposed_packet_entries: HandoffPacketEntry[];
  proposed_copy_export_plan: HandoffPacketCopyExportPlan;
  required_source_refs: string[];
  required_evidence_refs: string[];
  blocked_live_mutations: string[];
  future_copy_export_requirements: string[];
  future_send_requirements: string[];
  operator_acceptance_criteria: string[];
  rollback_and_fallback_plan: string[];
}

export interface HandoffPacketCopyExportContractReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_applied_handoff_context_snapshot: true;
  requires_packet_format: true;
  requires_copy_export_target: true;
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

export interface HandoffPacketCopyExportContractAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  contract_material_only: true;
  source_of_truth: false;
  can_write_db: false;
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

export interface HandoffPacketCopyExportContractPreview {
  preview_version: typeof HANDOFF_PACKET_COPY_EXPORT_CONTRACT_PREVIEW_VERSION;
  scope: typeof HANDOFF_PACKET_COPY_EXPORT_CONTRACT_SCOPE;
  as_of: string;
  source_refs: string[];
  contract_preview_status: HandoffPacketCopyExportContractPreviewStatus;
  recommended_next_action: HandoffPacketCopyExportContractRecommendedNextAction;
  input_summary: {
    has_applied_handoff_context_read: boolean;
    has_apply_record_review: boolean;
    has_direct_apply_record: boolean;
    has_direct_applied_snapshot: boolean;
    requested_packet_format: HandoffPacketCopyExportPacketFormat | string | null;
    requested_copy_export_target: HandoffPacketCopyExportTarget | string | null;
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
    applied_handoff_context_read:
      | "supplied"
      | "missing"
      | "malformed"
      | "no_applied_snapshot"
      | "invalid";
    handoff_context_apply_record_review:
      | "supplied"
      | "missing"
      | "malformed"
      | "invalid";
    existing_handoff_material: "supplied" | "missing" | "unsafe";
  };
  contract_readiness: HandoffPacketCopyExportContractReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_applied_handoff_context_read: boolean;
    has_latest_applied_snapshot: boolean;
    has_applied_handoff_context_entries: boolean;
    has_apply_record_review: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_missing_evidence: boolean;
    has_receipt_side_effect_problem: boolean;
    no_copy_export_confirmed: true;
    no_handoff_send_confirmed: true;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    problem_record_ids: string[];
  };
  source_applied_handoff_context_summary: {
    applied_handoff_context_snapshot_ref: string | null;
    source_handoff_context_apply_record_ref: string | null;
    source_handoff_context_update_contract_record_ref: string | null;
    source_route_integration_read_ref: string | null;
    source_runtime_current_working_perspective_ref: string | null;
    source_applied_cwp_snapshot_ref: string | null;
    entry_count: number;
    section_counts: Record<string, number>;
    copy_export_still_pending: boolean;
    send_still_pending: boolean;
  };
  proposed_handoff_packet_copy_export_contract:
    | HandoffPacketCopyExportContractMaterial
    | null;
  would_write_handoff_packet_copy_export_contract_record_preview: {
    record_version: "handoff_packet_copy_export_contract_record.v0.1";
    scope: typeof HANDOFF_PACKET_COPY_EXPORT_CONTRACT_SCOPE;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    source_refs: string[];
    evidence_refs: string[];
    source_applied_handoff_context_snapshot_ref: string | null;
    source_handoff_context_apply_record_ref: string | null;
    source_handoff_context_update_contract_record_ref: string | null;
    source_route_integration_read_ref: string | null;
    source_runtime_current_working_perspective_ref: string | null;
    source_applied_cwp_snapshot_ref: string | null;
    requested_packet_format: HandoffPacketCopyExportPacketFormat | null;
    requested_copy_export_target: HandoffPacketCopyExportTarget | null;
    proposed_handoff_packet_copy_export_contract:
      | HandoffPacketCopyExportContractMaterial
      | null;
    proposed_packet_manifest: HandoffPacketManifest | null;
    proposed_packet_entries: HandoffPacketEntry[];
    proposed_packet_section_counts: Record<string, number>;
    proposed_copy_export_plan: HandoffPacketCopyExportPlan;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: HandoffPacketCopyExportContractAuthorityBoundary;
}

export type HandoffPacketCopyExportAppliedRead = AppliedHandoffContextRead;
export type HandoffPacketCopyExportApplyRecordReview =
  HandoffContextApplyRecordReview;
export type HandoffPacketCopyExportUpdateContractRecordReview =
  HandoffContextUpdateContractRecordReview;
export type HandoffPacketCopyExportRouteIntegrationRead =
  CurrentWorkingPerspectiveRouteIntegrationRead;
