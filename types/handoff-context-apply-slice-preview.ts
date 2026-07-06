import type { CurrentWorkingPerspectiveRouteIntegrationRead } from "./current-working-perspective-route-integration-read";
import type { CurrentWorkingPerspectiveRouteIntegrationReadReview } from "./current-working-perspective-route-integration-read-review";
import type { HandoffContextUpdateContractEntry } from "./handoff-context-update-contract-preview";
import type { HandoffContextUpdateContractRecordReview } from "./handoff-context-update-contract-record-review";
import type { HandoffContextUpdateContractRecord } from "./handoff-context-update-contract-write";

export const HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION =
  "handoff_context_apply_preview.v0.1" as const;
export const HANDOFF_CONTEXT_APPLY_SCOPE = "project:augnes" as const;

export type HandoffContextApplyPreviewStatus =
  | "no_handoff_context_update_contract_record"
  | "no_handoff_context_apply_material"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_handoff_context_apply_record_write"
  | "keep_preview_only";

export type HandoffContextApplyRecommendedNextAction =
  | "supply_handoff_context_update_contract_record"
  | "review_handoff_context_apply_preview"
  | "write_handoff_context_apply_record"
  | "resolve_handoff_context_apply_blockers"
  | "keep_preview_only";

export type AppliedHandoffContextSection =
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
  | "blocked_or_missing_context_section";

export type AppliedHandoffContextEntryKind =
  | "preserve"
  | "summarize"
  | "warn"
  | "next_action_candidate"
  | "review_required"
  | "stop_condition"
  | "source_trace"
  | "fallback_note";

export interface HandoffContextApplyPreviewInput {
  handoff_context_update_contract_record_review?: unknown;
  handoff_context_update_contract_record?: unknown;
  current_handoff_context_read?: unknown;
  existing_handoff_packet_or_capsule?: unknown;
  current_working_perspective_route_integration_read?: unknown;
  current_working_perspective_route_integration_read_review?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffContextApplyReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_handoff_context_update_contract_record: true;
  requires_handoff_context_entries: true;
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

export interface HandoffContextApplyAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  apply_preview_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_handoff_context_apply_record: false;
  can_create_applied_handoff_context_snapshot: false;
  can_apply_handoff_context_update_to_local_snapshot: false;
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

export interface AppliedHandoffContextEntry {
  applied_entry_ref: string;
  source_contract_entry_ref: string;
  handoff_section: AppliedHandoffContextSection;
  entry_kind: AppliedHandoffContextEntryKind;
  summary: string;
  source_record_refs: string[];
  source_refs: string[];
  evidence_refs: string[];
  review_pressure: string;
  applied_status: "applied_to_local_handoff_context_snapshot";
  persistence_horizon: "local_project_handoff_context_apply_store";
}

export interface AppliedHandoffContext {
  handoff_context_version: "applied_handoff_context.v0.1";
  scope: typeof HANDOFF_CONTEXT_APPLY_SCOPE;
  as_of: string;
  source_contract_record_ref: string;
  source_handoff_context_update_contract_record_refs: string[];
  source_route_integration_read_ref: string | null;
  source_runtime_current_working_perspective_ref: string | null;
  source_applied_snapshot_ref: string | null;
  source_refs: string[];
  evidence_refs: string[];
  handoff_sections: Record<AppliedHandoffContextSection, AppliedHandoffContextEntry[]>;
  applied_entries: AppliedHandoffContextEntry[];
  previous_context_summary: {
    supplied: boolean;
    preserved_as_previous_context_only: true;
    summary: string | null;
    source_refs: string[];
  };
  apply_metadata: {
    local_snapshot_only: true;
    does_not_send_handoff: true;
    does_not_write_live_packet: true;
    future_copy_export_required: true;
    future_send_required: true;
  };
  authority_boundary: HandoffContextApplyAuthorityBoundary;
}

export interface HandoffContextApplyPlan {
  plan_version: "handoff_context_apply_plan.v0.1";
  source_contract_record_ref: string | null;
  entry_count: number;
  section_counts: Record<string, number>;
  applied_entry_refs: string[];
  preserves_previous_context_as_previous_context_only: true;
  no_handoff_send_or_copy_export: true;
  no_live_handoff_context_mutation: true;
  future_copy_export_required: true;
  future_send_required: true;
}

export interface HandoffContextApplyPreview {
  preview_version: typeof HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION;
  scope: typeof HANDOFF_CONTEXT_APPLY_SCOPE;
  as_of: string;
  source_refs: string[];
  apply_preview_status: HandoffContextApplyPreviewStatus;
  recommended_next_action: HandoffContextApplyRecommendedNextAction;
  input_summary: {
    has_contract_record_review: boolean;
    has_contract_record: boolean;
    has_current_handoff_context: boolean;
    has_existing_handoff_packet_or_capsule: boolean;
    has_route_integration_read: boolean;
    has_route_integration_read_review: boolean;
    proposed_entry_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    review_confirmation_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    requested_operator_ref_supplied: boolean;
  };
  source_status: {
    handoff_context_update_contract_record_review:
      | "supplied"
      | "missing"
      | "malformed"
      | "invalid"
      | "schema_missing"
      | "no_records"
      | "selected_record_missing";
    route_integration_read: "supplied" | "missing" | "malformed" | "invalid";
    existing_handoff_material: "supplied" | "missing" | "unsafe";
  };
  apply_readiness: HandoffContextApplyReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_contract_record_review: boolean;
    has_contract_record: boolean;
    has_handoff_context_entries: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_missing_evidence: boolean;
    has_receipt_side_effect_problem: boolean;
    no_live_handoff_mutation_confirmed: true;
    no_handoff_send_confirmed: true;
    no_copy_export_confirmed: true;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    problem_record_ids: string[];
  };
  source_contract_summary: {
    record_id: string | null;
    record_fingerprint: string | null;
    proposed_entry_count: number;
    source_route_integration_read_ref: string | null;
    source_runtime_current_working_perspective_ref: string | null;
    source_applied_snapshot_ref: string | null;
  };
  current_handoff_context_summary: {
    supplied: boolean;
    preserved_as_previous_context_only: true;
    summary: string | null;
    source_refs: string[];
  };
  proposed_applied_handoff_context_summary: {
    handoff_context_version: "applied_handoff_context.v0.1" | null;
    section_counts: Record<string, number>;
    applied_entry_count: number;
    source_contract_record_ref: string | null;
    copy_export_still_pending: true;
    send_still_pending: true;
  };
  proposed_applied_handoff_context: AppliedHandoffContext | null;
  proposed_handoff_context_apply_plan: HandoffContextApplyPlan;
  proposed_handoff_section_application_summary: Record<string, number>;
  would_write_handoff_context_apply_record_preview: {
    record_version: "handoff_context_apply_record.v0.1";
    scope: typeof HANDOFF_CONTEXT_APPLY_SCOPE;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    source_refs: string[];
    evidence_refs: string[];
    source_handoff_context_update_contract_record_ref: string | null;
    source_handoff_context_update_contract_record_refs: string[];
    source_route_integration_read_ref: string | null;
    source_runtime_current_working_perspective_ref: string | null;
    source_applied_snapshot_ref: string | null;
    proposed_applied_handoff_context: AppliedHandoffContext | null;
    proposed_handoff_context_apply_plan: HandoffContextApplyPlan;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: HandoffContextApplyAuthorityBoundary;
}

export type HandoffContextApplySourceRecord =
  HandoffContextUpdateContractRecord;
export type HandoffContextApplySourceReview =
  HandoffContextUpdateContractRecordReview;
export type HandoffContextApplyRouteIntegrationRead =
  CurrentWorkingPerspectiveRouteIntegrationRead;
export type HandoffContextApplyRouteIntegrationReadReview =
  CurrentWorkingPerspectiveRouteIntegrationReadReview;
export type HandoffContextApplySourceContractEntry =
  HandoffContextUpdateContractEntry;
