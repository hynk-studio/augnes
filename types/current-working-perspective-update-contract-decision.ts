import type {
  CurrentWorkingPerspectiveUpdateContractPreview,
  CurrentWorkingPerspectiveUpdateContractReadiness,
} from "./current-working-perspective-update-contract-preview";

export const CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_DECISION_PREVIEW_VERSION =
  "current_working_perspective_update_contract_operator_decision_preview.v0.1" as const;

export type CurrentWorkingPerspectiveUpdateContractOperatorDecisionIntent =
  | "approve_for_current_working_perspective_update_contract_record"
  | "keep_preview_only"
  | "reject";

export type CurrentWorkingPerspectiveUpdateContractDecisionPreviewStatus =
  | "no_current_working_perspective_update_contract_preview"
  | "insufficient_data"
  | "blocked"
  | "ready_for_operator_review"
  | "ready_for_future_current_working_perspective_update_contract_record_write"
  | "keep_preview_only";

export interface CurrentWorkingPerspectiveUpdateContractDecisionPreviewInput {
  current_working_perspective_update_contract_preview?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  operator_decision_intent?: CurrentWorkingPerspectiveUpdateContractOperatorDecisionIntent;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface CurrentWorkingPerspectiveUpdateContractDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  operator_decision_preview_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_current_working_perspective_update_contract_record: false;
  can_update_current_working_perspective: false;
  can_mutate_current_working_perspective: false;
  can_write_current_working_perspective_live_state: false;
  can_apply_current_working_perspective_update: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_continuity_relay: false;
  can_update_continuity_relay: false;
  can_apply_live_relay_state: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
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

export interface CurrentWorkingPerspectiveUpdateContractOperatorDecisionPreview {
  preview_version: typeof CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: CurrentWorkingPerspectiveUpdateContractDecisionPreviewStatus;
  recommended_operator_decision:
    | "approve_for_current_working_perspective_update_contract_record"
    | "keep_preview_only"
    | "reject"
    | "resolve_current_working_perspective_update_contract_blockers";
  available_operator_decisions: CurrentWorkingPerspectiveUpdateContractOperatorDecisionIntent[];
  input_summary: {
    has_contract_preview: boolean;
    contract_preview_ready: boolean;
    operator_decision_intent: CurrentWorkingPerspectiveUpdateContractOperatorDecisionIntent | null;
    requested_operator_ref_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    review_confirmation_supplied: boolean;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
  };
  source_status: {
    current_working_perspective_update_contract_preview:
      | "supplied"
      | "missing"
      | "not_ready"
      | "malformed";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
    operator_decision_intent: "supplied" | "missing" | "unsupported";
  };
  write_readiness: CurrentWorkingPerspectiveUpdateContractReadiness;
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
  would_write_current_working_perspective_update_contract_decision_preview: {
    operator_decision:
      | "approve_for_current_working_perspective_update_contract_record"
      | null;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    current_cwp_ref: string | null;
    proposed_patch_entry_count: number;
    source_refs: string[];
    evidence_refs: string[];
    contract_preview: CurrentWorkingPerspectiveUpdateContractPreview | null;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: CurrentWorkingPerspectiveUpdateContractDecisionAuthorityBoundary;
}
