import type { HandoffContextUpdateContractPreview } from "./handoff-context-update-contract-preview";

export const HANDOFF_CONTEXT_UPDATE_CONTRACT_DECISION_PREVIEW_VERSION =
  "handoff_context_update_contract_operator_decision_preview.v0.1" as const;

export type HandoffContextUpdateContractOperatorDecisionIntent =
  | "approve_for_handoff_context_update_contract_record"
  | "keep_existing_handoff_context"
  | "keep_preview_only"
  | "reject";

export type HandoffContextUpdateContractDecisionPreviewStatus =
  | "no_handoff_context_update_contract_preview"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_handoff_context_update_contract_record_write"
  | "keep_preview_only";

export interface HandoffContextUpdateContractDecisionPreviewInput {
  handoff_context_update_contract_preview?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  operator_decision_intent?: HandoffContextUpdateContractOperatorDecisionIntent;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffContextUpdateContractDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  operator_decision_preview_only: true;
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

export interface HandoffContextUpdateContractDecisionReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_contract_preview: true;
  requires_operator_decision_intent: true;
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

export interface HandoffContextUpdateContractOperatorDecisionPreview {
  preview_version: typeof HANDOFF_CONTEXT_UPDATE_CONTRACT_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: HandoffContextUpdateContractDecisionPreviewStatus;
  recommended_operator_decision: HandoffContextUpdateContractOperatorDecisionIntent;
  available_operator_decisions: HandoffContextUpdateContractOperatorDecisionIntent[];
  input_summary: {
    has_contract_preview: boolean;
    contract_preview_ready: boolean;
    operator_decision_intent: HandoffContextUpdateContractOperatorDecisionIntent | null;
    requested_operator_ref_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    review_confirmation_supplied: boolean;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
  };
  source_status: {
    handoff_context_update_contract_preview:
      | "supplied"
      | "missing"
      | "not_ready"
      | "malformed";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
    operator_decision_intent: "supplied" | "missing" | "unsupported";
  };
  write_readiness: HandoffContextUpdateContractDecisionReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_ready_contract_preview: boolean;
    has_review_confirmation: boolean;
    has_idempotency_key: boolean;
    has_operator_ref: boolean;
    has_approval_intent: boolean;
    has_missing_evidence: boolean;
    has_refusal_reasons: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
  };
  would_write_handoff_context_update_contract_decision_preview: {
    operator_decision: "approve_for_handoff_context_update_contract_record" | null;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    source_refs: string[];
    evidence_refs: string[];
    contract_preview: HandoffContextUpdateContractPreview | null;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: HandoffContextUpdateContractDecisionAuthorityBoundary;
}
