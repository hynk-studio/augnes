/**
 * Handoff Context Update Preview v0.1.
 *
 * This contract describes read-only candidate material derived from an already
 * built Handoff Context Relay Rationale and Metric-Informed Continuity Relay
 * Adjustment Preview. It does not rebuild the relay, read the reuse ledger,
 * write DB rows, mutate handoff context, send handoffs, call providers,
 * GitHub, or Codex, create PRs, merge, run autonomous actions, create
 * graph/vector/RAG/crawler/browser observers, mutate memory, apply
 * Perspective, create promotion decisions, or create Formation Receipts.
 */

import type { HandoffContextRelayRationale } from "./handoff-context-relay-rationale";
import type {
  ContinuityRelayAdjustmentCandidate,
  MetricInformedContinuityRelayAdjustmentPreview,
} from "./metric-informed-continuity-relay-adjustment-preview";

export const HANDOFF_CONTEXT_UPDATE_PREVIEW_VERSION =
  "handoff_context_update_preview.v0.1" as const;

export type HandoffContextUpdateCandidateStatus =
  | "insufficient_data"
  | "update_candidates_available"
  | "needs_operator_review";

export type HandoffContextUpdateCandidateKind =
  | "selected_ref"
  | "warning"
  | "context_diet"
  | "stop_if_missing"
  | "expected_return_signal"
  | "unknown_context";

export interface HandoffContextUpdatePreview {
  preview_version: typeof HANDOFF_CONTEXT_UPDATE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  candidate_status: HandoffContextUpdateCandidateStatus;
  input_summary: HandoffContextUpdateInputSummary;
  proposed_selected_ref_updates: ProposedHandoffSelectedRefUpdates;
  proposed_warning_updates: ProposedHandoffWarningUpdates;
  proposed_context_diet_updates: ProposedHandoffContextDietUpdates;
  proposed_stop_if_missing_updates: ProposedHandoffStopIfMissingUpdates;
  proposed_expected_return_signal_updates: ProposedHandoffExpectedReturnSignalUpdates;
  evidence_summary: HandoffContextUpdateEvidenceSummary;
  operator_review_checklist: string[];
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  write_readiness: HandoffContextUpdateWriteReadiness;
  non_goals: string[];
  authority_boundary: HandoffContextUpdateAuthorityBoundary;
}

export interface HandoffContextUpdateInputSummary {
  handoff_context_relay_rationale_ref:
    | HandoffContextRelayRationale["rationale_version"]
    | null;
  handoff_context_relay_rationale_source_status: "supplied" | "missing";
  metric_informed_relay_adjustment_preview_ref:
    | MetricInformedContinuityRelayAdjustmentPreview["preview_version"]
    | null;
  metric_informed_relay_adjustment_candidate_status:
    | MetricInformedContinuityRelayAdjustmentPreview["candidate_status"]
    | null;
  selected_ref_candidate_count: number;
  warning_candidate_count: number;
  context_diet_candidate_count: number;
  stop_if_missing_candidate_count: number;
  expected_return_signal_candidate_count: number;
  unknown_candidate_count: number;
  missing_evidence_count: number;
}

export interface HandoffContextUpdateCandidate {
  candidate_id: string;
  ref_id: string;
  label: string;
  summary: string;
  candidate_kind: HandoffContextUpdateCandidateKind;
  source_bucket: ContinuityRelayAdjustmentCandidate["source_bucket"];
  source_adjustment_kind: ContinuityRelayAdjustmentCandidate["adjustment_kind"];
  source_candidate_id: string;
  source_refs: string[];
  evidence_refs: string[];
  source_record_refs: string[];
  existing_handoff_ref_ids: string[];
  candidate_only: true;
  review_note: string;
}

export interface ProposedHandoffSelectedRefUpdates {
  add_selected_ref_candidates: HandoffContextUpdateCandidate[];
  reinforce_selected_ref_candidates: HandoffContextUpdateCandidate[];
  selected_with_review_only: HandoffContextUpdateCandidate[];
}

export interface ProposedHandoffWarningUpdates {
  add_warning_candidates: HandoffContextUpdateCandidate[];
  strengthen_warning_candidates: HandoffContextUpdateCandidate[];
  stale_warning_candidates: HandoffContextUpdateCandidate[];
  noisy_warning_candidates: HandoffContextUpdateCandidate[];
  misleading_warning_candidates: HandoffContextUpdateCandidate[];
  unknown_warning_candidates: HandoffContextUpdateCandidate[];
}

export interface ProposedHandoffContextDietUpdates {
  refs_to_deprioritize: HandoffContextUpdateCandidate[];
  refs_to_exclude_from_handoff: HandoffContextUpdateCandidate[];
  refs_to_keep_unknown: HandoffContextUpdateCandidate[];
}

export interface ProposedHandoffStopIfMissingUpdates {
  stop_if_missing_candidates: HandoffContextUpdateCandidate[];
  verification_required_before_handoff: HandoffContextUpdateCandidate[];
  missing_source_or_evidence_blockers: HandoffContextUpdateCandidate[];
}

export interface ProposedHandoffExpectedReturnSignalUpdates {
  expected_return_emphasis_candidates: HandoffContextUpdateCandidate[];
  next_handoff_focus_candidates: HandoffContextUpdateCandidate[];
  mismatch_return_signal_candidates: HandoffContextUpdateCandidate[];
}

export interface HandoffContextUpdateEvidenceSummary {
  has_handoff_context_relay_rationale: boolean;
  has_metric_informed_relay_adjustment_preview: boolean;
  has_selected_ref_signal: boolean;
  has_warning_signal: boolean;
  has_context_diet_signal: boolean;
  has_stop_if_missing_signal: boolean;
  has_expected_return_signal: boolean;
  has_unknown_signal: boolean;
  has_insufficient_data: boolean;
  evidence_refs: string[];
  missing_evidence: string[];
}

export interface HandoffContextUpdateWriteReadiness {
  ready_for_handoff_context_write: false;
  ready_for_handoff_send: false;
  ready_for_selected_ref_update_write: false;
  required_followup: string[];
  refusal_reasons: string[];
}

export interface HandoffContextUpdateAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_write_handoff_context: false;
  can_send_handoff: false;
  can_write_selected_refs: false;
  can_write_continuity_relay: false;
  can_update_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_write_dogfood_metrics: false;
  can_update_metrics: false;
  can_write_dogfood_ledger: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}
