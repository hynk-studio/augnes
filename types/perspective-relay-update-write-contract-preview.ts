import type { MetricInformedContinuityRelayAdjustmentPreview } from "./metric-informed-continuity-relay-adjustment-preview";
import type { PerspectiveNextWorkCandidateUpdatePreview } from "./perspective-next-work-candidate-update-preview";
import type { PerspectiveRelayUpdateCandidateBridgePreview } from "./perspective-relay-update-candidate-bridge-preview";
import type { PerspectiveRelayUpdateOperatorDecisionPreview } from "./perspective-relay-update-decision";
import type { PerspectiveRelayUpdateDecisionRecordReview } from "./perspective-relay-update-decision-record-review";

export const PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION =
  "perspective_relay_update_write_contract_preview.v0.1" as const;

export interface PerspectiveRelayUpdateWriteContractPreviewInput {
  perspective_relay_update_operator_decision_preview?: unknown;
  perspective_relay_update_decision_record_review?: unknown;
  perspective_relay_update_candidate_bridge_preview?: unknown;
  existing_perspective_next_work_candidate_update_preview?: unknown;
  existing_metric_informed_continuity_relay_adjustment_preview?: unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type PerspectiveRelayUpdateWriteContractStatus =
  | "no_perspective_relay_update_decision_material"
  | "insufficient_data"
  | "future_write_contract_candidates_available"
  | "contract_ready_for_future_scoped_write_slice"
  | "keep_preview_only";

export type PerspectiveRelayUpdateWriteContractRecommendedNextAction =
  | "supply_perspective_relay_update_decision"
  | "review_perspective_relay_update_write_contract"
  | "prepare_scoped_perspective_next_work_relay_write_slice"
  | "keep_preview_only"
  | "resolve_perspective_relay_update_blockers";

export interface PerspectiveRelayUpdateFutureWriteContract {
  perspective_unit_update_contract: {
    selected_candidate_refs: string[];
    future_record_kind: "perspective_unit_update_contract.future";
    write_implemented_in_this_pr: false;
  };
  next_work_bias_update_contract: {
    selected_candidate_refs: string[];
    future_record_kind: "next_work_bias_update_contract.future";
    write_implemented_in_this_pr: false;
  };
  continuity_relay_update_contract: {
    selected_candidate_refs: string[];
    future_record_kind: "continuity_relay_update_contract.future";
    write_implemented_in_this_pr: false;
  };
}

export interface PerspectiveRelayUpdateWriteContractAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_current_working_perspective: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_send_handoff: false;
  can_write_memory: false;
  can_write_dogfood_metrics: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}

export interface PerspectiveRelayUpdateWriteContractPreview {
  preview_version: typeof PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  contract_preview_status: PerspectiveRelayUpdateWriteContractStatus;
  recommended_next_action: PerspectiveRelayUpdateWriteContractRecommendedNextAction;
  input_summary: {
    has_ready_operator_decision_preview: boolean;
    has_decision_record_review: boolean;
    has_valid_decision_records: boolean;
    has_candidate_bridge_preview: boolean;
    selected_perspective_unit_candidate_count: number;
    selected_next_work_bias_candidate_count: number;
    selected_continuity_relay_candidate_count: number;
    blocker_count: number;
    insufficient_data_count: number;
  };
  proposed_future_write_contract: PerspectiveRelayUpdateFutureWriteContract;
  required_source_refs: string[];
  required_evidence_refs: string[];
  selected_candidate_refs_by_target: {
    perspective_unit: string[];
    next_work_bias: string[];
    continuity_relay: string[];
  };
  blocking_reasons: string[];
  insufficient_data_reasons: string[];
  evidence_summary: {
    has_decision_record_material: boolean;
    has_candidate_bridge_material: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: PerspectiveRelayUpdateWriteContractAuthorityBoundary;
}

export type PerspectiveRelayUpdateWriteContractDecisionPreview =
  PerspectiveRelayUpdateOperatorDecisionPreview;
export type PerspectiveRelayUpdateWriteContractDecisionRecordReview =
  PerspectiveRelayUpdateDecisionRecordReview;
export type PerspectiveRelayUpdateWriteContractBridgePreview =
  PerspectiveRelayUpdateCandidateBridgePreview;
export type PerspectiveRelayUpdateWriteContractPerspectivePreview =
  PerspectiveNextWorkCandidateUpdatePreview;
export type PerspectiveRelayUpdateWriteContractRelayPreview =
  MetricInformedContinuityRelayAdjustmentPreview;
