import type { CurrentWorkingPerspectiveRouteIntegrationRead } from "./current-working-perspective-route-integration-read";

export const HANDOFF_CONTEXT_UPDATE_CONTRACT_PREVIEW_VERSION =
  "handoff_context_update_contract_preview.v0.1" as const;

export const HANDOFF_CONTEXT_UPDATE_CONTRACT_SCOPE =
  "project:augnes" as const;

export type HandoffContextUpdateMode =
  | "route_integrated_cwp_summary"
  | "handoff_packet_update_candidate"
  | "codex_handoff_context_candidate"
  | "keep_existing_handoff_context";

export type HandoffContextUpdateContractPreviewStatus =
  | "no_route_integrated_current_working_perspective_material"
  | "no_handoff_context_update_material"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_handoff_context_update_contract_record_write"
  | "keep_preview_only";

export type HandoffContextUpdateContractRecommendedNextAction =
  | "supply_route_integrated_current_working_perspective_read"
  | "review_handoff_context_update_contract"
  | "write_handoff_context_update_contract_record"
  | "resolve_handoff_context_update_contract_blockers"
  | "keep_existing_handoff_context"
  | "keep_preview_only";

export type HandoffContextSection =
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

export type HandoffContextEntryKind =
  | "preserve"
  | "summarize"
  | "warn"
  | "next_action_candidate"
  | "review_required"
  | "stop_condition"
  | "source_trace"
  | "fallback_note";

export interface HandoffContextUpdateContractPreviewInput {
  current_working_perspective_route_integration_read?: unknown;
  current_working_perspective_route_integration_read_review?: unknown;
  current_working_perspective_route_integration_contract_record_review?: unknown;
  current_working_perspective_apply_record_review?: unknown;
  continuity_relay_record_review?: unknown;
  perspective_unit_record_review?: unknown;
  perspective_next_work_bias_record_review?: unknown;
  existing_handoff_context_read?: unknown;
  existing_handoff_packet_or_capsule?: unknown;
  requested_handoff_context_mode?: HandoffContextUpdateMode;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffContextUpdateContractReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_route_integrated_current_working_perspective: true;
  requires_runtime_fallback: true;
  requires_handoff_context_mode: true;
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

export interface HandoffContextUpdateContractAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  contract_material_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_handoff_context_update_contract_record: false;
  can_apply_handoff_context_update: false;
  can_mutate_handoff_context: false;
  can_send_handoff: false;
  can_write_selected_refs_to_live_handoff: false;
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

export interface HandoffContextUpdateContractEntry {
  entry_ref: string;
  handoff_section: HandoffContextSection;
  entry_kind: HandoffContextEntryKind;
  summary: string;
  source_record_refs: string[];
  source_refs: string[];
  evidence_refs: string[];
  review_pressure: string;
  authority_required: "future_handoff_context_apply";
  persistence_horizon: "handoff_context_update_contract_record";
}

export interface HandoffContextUpdateContractMaterial {
  contract_kind: "handoff_context_update_contract.v0.1";
  handoff_context_family: "augnes_operator_handoff_context";
  source_route_integration_read_ref: string | null;
  source_route_integration_status: string | null;
  source_route_integration_response_mode: string | null;
  source_runtime_current_working_perspective_ref: string | null;
  source_applied_snapshot_ref: string | null;
  source_route_integration_contract_record_refs: string[];
  source_cwp_apply_record_refs: string[];
  source_continuity_relay_record_refs: string[];
  source_perspective_unit_record_refs: string[];
  source_next_work_bias_record_refs: string[];
  requested_handoff_context_mode: HandoffContextUpdateMode;
  proposed_handoff_sections: Record<HandoffContextSection, HandoffContextUpdateContractEntry[]>;
  proposed_handoff_context_entries: HandoffContextUpdateContractEntry[];
  proposed_handoff_packet_delta: {
    packet_delta_kind: "handoff_context_update_candidate";
    existing_handoff_material_ref: string | null;
    proposed_entry_count: number;
    does_not_apply_or_send: true;
  };
  required_source_refs: string[];
  required_evidence_refs: string[];
  blocked_live_mutations: string[];
  future_apply_requirements: string[];
  operator_acceptance_criteria: string[];
  rollback_and_fallback_plan: string[];
}

export interface HandoffContextUpdateContractPreview {
  preview_version: typeof HANDOFF_CONTEXT_UPDATE_CONTRACT_PREVIEW_VERSION;
  scope: typeof HANDOFF_CONTEXT_UPDATE_CONTRACT_SCOPE;
  as_of: string;
  source_refs: string[];
  contract_preview_status: HandoffContextUpdateContractPreviewStatus;
  recommended_next_action: HandoffContextUpdateContractRecommendedNextAction;
  input_summary: {
    has_route_integration_read: boolean;
    has_route_integration_read_review: boolean;
    has_route_integration_contract_record_review: boolean;
    has_cwp_apply_record_review: boolean;
    has_continuity_relay_record_review: boolean;
    has_perspective_unit_record_review: boolean;
    has_next_work_bias_record_review: boolean;
    has_existing_handoff_material: boolean;
    requested_handoff_context_mode: HandoffContextUpdateMode | null;
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
    current_working_perspective_route_integration_read:
      | "supplied"
      | "runtime_only"
      | "missing"
      | "malformed"
      | "invalid";
    current_working_perspective_route_integration_read_review:
      | "supplied"
      | "missing"
      | "invalid"
      | "malformed";
    requested_handoff_context_mode:
      | "supplied"
      | "missing"
      | "keep_existing_handoff_context";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
  };
  contract_readiness: HandoffContextUpdateContractReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_route_integration_read: boolean;
    has_runtime_fallback: boolean;
    has_applied_snapshot_participation: boolean;
    has_route_integration_read_review: boolean;
    has_route_integration_contract_record_review: boolean;
    has_scoped_record_context: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_missing_evidence: boolean;
    has_refusal_reasons: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
  };
  route_integrated_current_working_perspective_summary: {
    read_ref: string | null;
    status: CurrentWorkingPerspectiveRouteIntegrationRead["status"] | null;
    response_mode: CurrentWorkingPerspectiveRouteIntegrationRead["response_mode"] | null;
    runtime_cwp_ref: string | null;
    applied_snapshot_ref: string | null;
    current_frame_summary: string | null;
    current_thesis_summary: string | null;
    active_goal_count: number;
    next_candidate_count: number;
    open_question_count: number;
    active_risk_count: number;
  };
  existing_handoff_context_summary: {
    supplied: boolean;
    material_ref: string | null;
    summary: string | null;
    treated_as_previous_context_only: true;
  };
  proposed_handoff_context_update_contract: HandoffContextUpdateContractMaterial | null;
  would_write_handoff_context_update_contract_record_preview: {
    record_version: "handoff_context_update_contract_record.v0.1";
    scope: typeof HANDOFF_CONTEXT_UPDATE_CONTRACT_SCOPE;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    source_refs: string[];
    evidence_refs: string[];
    source_route_integration_read_ref: string | null;
    source_runtime_current_working_perspective_ref: string | null;
    source_applied_snapshot_ref: string | null;
    source_route_integration_contract_record_refs: string[];
    source_cwp_apply_record_refs: string[];
    source_continuity_relay_record_refs: string[];
    source_perspective_unit_record_refs: string[];
    source_next_work_bias_record_refs: string[];
    proposed_handoff_context_update_contract: HandoffContextUpdateContractMaterial | null;
    proposed_handoff_context_entries: HandoffContextUpdateContractEntry[];
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: HandoffContextUpdateContractAuthorityBoundary;
}
