import type { CurrentWorkingPerspective } from "./current-working-perspective";
import type { ContinuityRelayRecordReview } from "./continuity-relay-record-review";
import type { PerspectiveNextWorkBiasRecordReview } from "./perspective-next-work-bias-record-review";
import type { PerspectiveRelayUpdateDecisionRecordReview } from "./perspective-relay-update-decision-record-review";
import type { PerspectiveRelayUpdateWriteContractPreview } from "./perspective-relay-update-write-contract-preview";
import type { PerspectiveUnitRecordReview } from "./perspective-unit-record-review";

export const CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_PREVIEW_VERSION =
  "current_working_perspective_update_contract_preview.v0.1" as const;

export interface CurrentWorkingPerspectiveUpdateContractPreviewInput {
  current_working_perspective_read?: unknown;
  current_working_perspective?: unknown;
  perspective_next_work_bias_record_review?: unknown;
  perspective_unit_record_review?: unknown;
  continuity_relay_record_review?: unknown;
  perspective_relay_update_decision_record_review?: unknown;
  perspective_relay_update_write_contract_preview?: unknown;
  workplane_continuity_relay?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type CurrentWorkingPerspectiveUpdateContractPreviewStatus =
  | "no_current_working_perspective_material"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_current_working_perspective_update_contract_record_write"
  | "keep_preview_only";

export type CurrentWorkingPerspectiveUpdateContractRecommendedNextAction =
  | "supply_current_working_perspective_material"
  | "review_current_working_perspective_update_contract"
  | "write_current_working_perspective_update_contract_record"
  | "resolve_current_working_perspective_update_contract_blockers"
  | "keep_preview_only";

export type CurrentWorkingPerspectivePatchTarget =
  | "current_frame"
  | "current_thesis"
  | "active_goals"
  | "accepted_assumptions"
  | "rejected_assumptions"
  | "open_questions"
  | "active_risks"
  | "next_candidates"
  | "review_queue_hints"
  | "staleness_and_gaps"
  | "continuity_relay_alignment";

export type CurrentWorkingPerspectivePatchOperation =
  | "add"
  | "preserve"
  | "warn"
  | "deprioritize"
  | "retire"
  | "replace_candidate"
  | "align";

export interface CurrentWorkingPerspectivePatchEntry {
  patch_ref: string;
  patch_target: CurrentWorkingPerspectivePatchTarget;
  patch_operation: CurrentWorkingPerspectivePatchOperation;
  summary: string;
  source_record_refs: string[];
  evidence_refs: string[];
  source_refs: string[];
  review_pressure: "low" | "medium" | "high";
  authority_required: "future_current_working_perspective_apply";
  persistence_horizon: "current_working_perspective_update_contract_record";
}

export interface CurrentWorkingPerspectiveFieldUpdateContract {
  target: CurrentWorkingPerspectivePatchTarget;
  status: "preserve_existing" | "proposed_update" | "needs_review";
  patch_refs: string[];
  source_record_refs: string[];
  summary: string;
}

export interface CurrentWorkingPerspectiveUpdateContractMaterial {
  contract_kind: "current_working_perspective_update_contract.v0.1";
  current_cwp_ref: string | null;
  source_cwp_version: "current_working_perspective.v0.1" | null;
  proposed_update_basis: {
    perspective_unit_record_refs: string[];
    next_work_bias_record_refs: string[];
    continuity_relay_record_refs: string[];
    perspective_relay_update_decision_record_refs: string[];
    perspective_relay_update_write_contract_preview_ref: string | null;
  };
  field_update_contracts: {
    current_frame_update_contract: CurrentWorkingPerspectiveFieldUpdateContract;
    current_thesis_update_contract: CurrentWorkingPerspectiveFieldUpdateContract;
    active_goals_update_contract: CurrentWorkingPerspectiveFieldUpdateContract;
    accepted_assumptions_update_contract: CurrentWorkingPerspectiveFieldUpdateContract;
    rejected_assumptions_update_contract: CurrentWorkingPerspectiveFieldUpdateContract;
    open_questions_update_contract: CurrentWorkingPerspectiveFieldUpdateContract;
    active_risks_update_contract: CurrentWorkingPerspectiveFieldUpdateContract;
    next_candidates_update_contract: CurrentWorkingPerspectiveFieldUpdateContract;
    review_queue_hints_update_contract: CurrentWorkingPerspectiveFieldUpdateContract;
    staleness_and_gaps_update_contract: CurrentWorkingPerspectiveFieldUpdateContract;
    continuity_relay_alignment_contract: CurrentWorkingPerspectiveFieldUpdateContract;
  };
  proposed_patch_entries: CurrentWorkingPerspectivePatchEntry[];
  expected_cwp_effect_summary: string[];
  required_source_refs: string[];
  required_evidence_refs: string[];
  blocked_live_mutations: string[];
  future_apply_requirements: string[];
}

export interface CurrentWorkingPerspectiveUpdateContractReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_current_working_perspective_material: true;
  requires_perspective_unit_record_review: true;
  requires_next_work_bias_record_review: true;
  requires_continuity_relay_record_review: true;
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

export interface CurrentWorkingPerspectiveUpdateContractAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  contract_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
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

export interface CurrentWorkingPerspectiveUpdateContractPreview {
  preview_version: typeof CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  contract_preview_status: CurrentWorkingPerspectiveUpdateContractPreviewStatus;
  recommended_next_action: CurrentWorkingPerspectiveUpdateContractRecommendedNextAction;
  input_summary: {
    has_current_working_perspective_material: boolean;
    current_working_perspective_source_status:
      | "runtime"
      | "supplied"
      | "fixture_fallback"
      | "empty_fallback"
      | "missing"
      | "malformed";
    perspective_unit_valid_record_count: number;
    next_work_bias_valid_record_count: number;
    continuity_relay_valid_record_count: number;
    proposed_patch_entry_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    review_confirmation_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    requested_operator_ref_supplied: boolean;
  };
  source_status: {
    current_working_perspective:
      | "supplied"
      | "runtime"
      | "fixture_fallback"
      | "empty_fallback"
      | "missing"
      | "wrong_version"
      | "wrong_scope"
      | "malformed";
    perspective_unit_record_review:
      | "supplied"
      | "missing"
      | "invalid"
      | "malformed";
    perspective_next_work_bias_record_review:
      | "supplied"
      | "missing"
      | "invalid"
      | "malformed";
    continuity_relay_record_review:
      | "supplied"
      | "missing"
      | "invalid"
      | "malformed";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
  };
  contract_readiness: CurrentWorkingPerspectiveUpdateContractReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_valid_current_working_perspective_material: boolean;
    has_perspective_unit_records: boolean;
    has_next_work_bias_records: boolean;
    has_continuity_relay_records: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_review_confirmation: boolean;
    has_idempotency_key: boolean;
    has_operator_ref: boolean;
    has_missing_evidence: boolean;
    has_refusal_reasons: boolean;
    has_unsafe_refs: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    unsafe_refs: string[];
  };
  current_working_perspective_summary: {
    current_cwp_ref: string | null;
    perspective_version: string | null;
    scope: string | null;
    as_of: string | null;
    source_status: string;
    current_frame_summary: string | null;
    current_thesis_summary: string | null;
    active_goal_count: number;
    open_question_count: number;
    active_risk_count: number;
    next_candidate_count: number;
    staleness_status: string | null;
  };
  contributing_record_refs: {
    perspective_unit_record_refs: string[];
    next_work_bias_record_refs: string[];
    continuity_relay_record_refs: string[];
    perspective_relay_update_decision_record_refs: string[];
    perspective_relay_update_write_contract_preview_ref: string | null;
  };
  proposed_current_working_perspective_update_contract: CurrentWorkingPerspectiveUpdateContractMaterial;
  would_write_current_working_perspective_update_contract_record_preview: {
    proposed_record_kind:
      | "current_working_perspective_update_contract_record.v0.1"
      | null;
    proposed_receipt_kind:
      | "current_working_perspective_update_contract_receipt.v0.1"
      | null;
    proposed_store_kind:
      | "current_working_perspective_update_contract_store.v0.1"
      | null;
    current_cwp_ref: string | null;
    source_refs: string[];
    evidence_refs: string[];
    contributing_record_refs: CurrentWorkingPerspectiveUpdateContractPreview["contributing_record_refs"];
    proposed_patch_entries: CurrentWorkingPerspectivePatchEntry[];
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    review_summary: string;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: CurrentWorkingPerspectiveUpdateContractAuthorityBoundary;
}

export type CurrentWorkingPerspectiveUpdateContractCurrentPerspective =
  CurrentWorkingPerspective;
export type CurrentWorkingPerspectiveUpdateContractPerspectiveUnitRecordReview =
  PerspectiveUnitRecordReview;
export type CurrentWorkingPerspectiveUpdateContractNextWorkBiasRecordReview =
  PerspectiveNextWorkBiasRecordReview;
export type CurrentWorkingPerspectiveUpdateContractContinuityRelayRecordReview =
  ContinuityRelayRecordReview;
export type CurrentWorkingPerspectiveUpdateContractDecisionRecordReview =
  PerspectiveRelayUpdateDecisionRecordReview;
export type CurrentWorkingPerspectiveUpdateContractRelayWriteContractPreview =
  PerspectiveRelayUpdateWriteContractPreview;
