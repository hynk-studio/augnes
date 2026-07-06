import type { HandoffContextApplyPreview } from "./handoff-context-apply-slice-preview";

export const HANDOFF_CONTEXT_APPLY_DECISION_PREVIEW_VERSION =
  "handoff_context_apply_operator_decision_preview.v0.1" as const;

export type HandoffContextApplyDecisionPreviewStatus =
  | "insufficient_data"
  | "blocked"
  | "ready_for_operator_review"
  | "ready_for_future_handoff_context_apply_record_write"
  | "keep_preview_only";

export type HandoffContextApplyRecommendedOperatorDecision =
  | "approve_for_handoff_context_apply_record"
  | "keep_preview_only"
  | "reject";

export type HandoffContextApplyAvailableOperatorDecision =
  | "approve_for_handoff_context_apply_record"
  | "keep_preview_only"
  | "reject";

export interface HandoffContextApplyOperatorDecisionPreviewInput {
  handoff_context_apply_preview?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  operator_decision_intent?:
    | "approve_for_handoff_context_apply_record"
    | "keep_preview_only"
    | "reject";
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffContextApplyDecisionReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_apply_preview: true;
  requires_approval_intent: true;
  requires_review_confirmation: true;
  requires_idempotency_key: true;
  requires_operator_ref: true;
  requires_no_blockers: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
}

export interface HandoffContextApplyDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  decision_preview_only: true;
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

export interface HandoffContextApplyOperatorDecisionPreview {
  preview_version: typeof HANDOFF_CONTEXT_APPLY_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: HandoffContextApplyDecisionPreviewStatus;
  recommended_operator_decision: HandoffContextApplyRecommendedOperatorDecision;
  available_operator_decisions: HandoffContextApplyAvailableOperatorDecision[];
  input_summary: {
    has_apply_preview: boolean;
    apply_preview_status: HandoffContextApplyPreview["apply_preview_status"] | null;
    operator_decision_intent:
      | "approve_for_handoff_context_apply_record"
      | "keep_preview_only"
      | "reject"
      | null;
    proposed_entry_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    requested_operator_ref_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    review_confirmation_supplied: boolean;
  };
  source_status: {
    apply_preview: "supplied" | "missing" | "malformed" | "not_ready";
    operator_decision_intent: "approve" | "missing" | "keep_preview_only" | "reject";
    authority_boundary: "valid_read_only" | "invalid" | "missing";
  };
  write_readiness: HandoffContextApplyDecisionReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_apply_preview: boolean;
    apply_preview_ready: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    authority_boundary_valid: boolean;
    no_live_handoff_mutation_confirmed: true;
    no_handoff_send_confirmed: true;
    no_copy_export_confirmed: true;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
  };
  would_write_handoff_context_apply_decision_preview: {
    decision_kind: "handoff_context_apply_operator_decision_preview.v0.1";
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    contract_preview: HandoffContextApplyPreview | null;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: HandoffContextApplyDecisionAuthorityBoundary;
}
