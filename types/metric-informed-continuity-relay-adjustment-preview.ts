/**
 * Metric-Informed Continuity Relay Adjustment Preview v0.1.
 *
 * This contract describes read-only candidate material derived from an already
 * built Workplane Continuity Relay and Perspective / Next Work Candidate Update
 * Preview. It does not write the Continuity Relay, CurrentWorkingPerspective,
 * handoff context, PerspectiveUnit, NextWorkBias, memory, dogfood metrics,
 * reuse ledger records, promotion decisions, Formation Receipts, provider,
 * GitHub, Codex, handoff, graph/vector/RAG/crawler/browser observer, or
 * autonomous action state.
 */

import type {
  PerspectiveNextWorkCandidateBucket,
  PerspectiveNextWorkCandidateStrength,
  PerspectiveNextWorkCandidateUpdatePreview,
} from "./perspective-next-work-candidate-update-preview";
import type { WorkplaneContinuityRelay } from "./workplane-continuity-relay";

export const METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION =
  "metric_informed_continuity_relay_adjustment_preview.v0.1" as const;

export type MetricInformedContinuityRelayAdjustmentCandidateStatus =
  | "insufficient_data"
  | "adjustment_candidates_available"
  | "needs_operator_review";

export type ContinuityRelayAdjustmentKind =
  | "preserve_anchor"
  | "warn_anchor"
  | "stop_if_missing"
  | "next_focus"
  | "handoff_adjustment"
  | "relay_update_suggestion"
  | "context_diet"
  | "unknown_context";

export interface MetricInformedContinuityRelayAdjustmentPreview {
  preview_version: typeof METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  candidate_status: MetricInformedContinuityRelayAdjustmentCandidateStatus;
  input_summary: MetricInformedContinuityRelayAdjustmentInputSummary;
  proposed_relay_preserve_adjustments: ProposedRelayPreserveAdjustments;
  proposed_relay_warning_adjustments: ProposedRelayWarningAdjustments;
  proposed_stop_if_missing_adjustments: ProposedStopIfMissingAdjustments;
  proposed_next_focus_adjustments: ProposedNextFocusAdjustments;
  proposed_context_diet_adjustments: ProposedContextDietAdjustments;
  evidence_summary: MetricInformedContinuityRelayAdjustmentEvidenceSummary;
  operator_review_checklist: string[];
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  write_readiness: MetricInformedContinuityRelayAdjustmentWriteReadiness;
  non_goals: string[];
  authority_boundary: MetricInformedContinuityRelayAdjustmentAuthorityBoundary;
}

export interface MetricInformedContinuityRelayAdjustmentInputSummary {
  continuity_relay_ref: WorkplaneContinuityRelay["relay_version"] | null;
  continuity_relay_source_status: "supplied" | "missing";
  perspective_next_work_preview_ref:
    | PerspectiveNextWorkCandidateUpdatePreview["preview_version"]
    | null;
  perspective_next_work_candidate_status:
    | PerspectiveNextWorkCandidateUpdatePreview["candidate_status"]
    | null;
  preserve_candidate_count: number;
  warn_candidate_count: number;
  drop_or_deprioritize_candidate_count: number;
  verification_candidate_count: number;
  next_focus_candidate_count: number;
  unknown_candidate_count: number;
  missing_evidence_count: number;
}

export interface ContinuityRelayAdjustmentCandidate {
  candidate_id: string;
  ref_id: string;
  label: string;
  summary: string;
  source_bucket: PerspectiveNextWorkCandidateBucket | "missing_evidence";
  adjustment_kind: ContinuityRelayAdjustmentKind;
  source_refs: string[];
  evidence_refs: string[];
  source_record_refs: string[];
  existing_relay_anchor_ids: string[];
  strength: PerspectiveNextWorkCandidateStrength;
  candidate_only: true;
  review_note: string;
}

export interface ProposedRelayPreserveAdjustments {
  reinforce_existing_preserve_anchors: ContinuityRelayAdjustmentCandidate[];
  add_preserve_anchor_candidates: ContinuityRelayAdjustmentCandidate[];
  preserve_with_review_only: ContinuityRelayAdjustmentCandidate[];
}

export interface ProposedRelayWarningAdjustments {
  add_warn_anchor_candidates: ContinuityRelayAdjustmentCandidate[];
  strengthen_warn_anchor_candidates: ContinuityRelayAdjustmentCandidate[];
  stale_context_warning_candidates: ContinuityRelayAdjustmentCandidate[];
  noisy_context_warning_candidates: ContinuityRelayAdjustmentCandidate[];
  misleading_context_warning_candidates: ContinuityRelayAdjustmentCandidate[];
  unknown_context_warning_candidates: ContinuityRelayAdjustmentCandidate[];
}

export interface ProposedStopIfMissingAdjustments {
  add_stop_if_missing_candidates: ContinuityRelayAdjustmentCandidate[];
  verification_required_before_handoff: ContinuityRelayAdjustmentCandidate[];
  missing_source_or_evidence_blockers: ContinuityRelayAdjustmentCandidate[];
}

export interface ProposedNextFocusAdjustments {
  next_focus_candidates: ContinuityRelayAdjustmentCandidate[];
  next_relay_update_suggestions: ContinuityRelayAdjustmentCandidate[];
  next_handoff_adjustments: ContinuityRelayAdjustmentCandidate[];
}

export interface ProposedContextDietAdjustments {
  refs_to_drop_or_deprioritize: ContinuityRelayAdjustmentCandidate[];
  refs_to_exclude_from_next_handoff: ContinuityRelayAdjustmentCandidate[];
  refs_to_keep_unknown: ContinuityRelayAdjustmentCandidate[];
  stale_or_gap_warnings: ContinuityRelayAdjustmentCandidate[];
}

export interface MetricInformedContinuityRelayAdjustmentEvidenceSummary {
  has_continuity_relay: boolean;
  has_perspective_next_work_preview: boolean;
  has_preserve_signal: boolean;
  has_warning_signal: boolean;
  has_stop_if_missing_signal: boolean;
  has_next_focus_signal: boolean;
  has_problem_signal: boolean;
  has_unknown_signal: boolean;
  has_insufficient_data: boolean;
  evidence_refs: string[];
  missing_evidence: string[];
}

export interface MetricInformedContinuityRelayAdjustmentWriteReadiness {
  ready_for_continuity_relay_write: false;
  ready_for_cwp_update_write: false;
  ready_for_handoff_context_update_write: false;
  required_followup: string[];
  refusal_reasons: string[];
}

export interface MetricInformedContinuityRelayAdjustmentAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_write_continuity_relay: false;
  can_update_current_working_perspective: false;
  can_write_handoff_context: false;
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
  can_send_handoff: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}
