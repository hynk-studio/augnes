/**
 * Perspective / Next Work Candidate Update Preview v0.1.
 *
 * This contract describes read-only candidate material derived from dogfood
 * metric candidate previews and approved Handoff Reuse Outcome Ledger records.
 * It does not write PerspectiveUnits, NextWorkBias, memory, dogfood metrics,
 * ledger records, promotion decisions, Formation Receipts, provider/GitHub/Codex
 * calls, handoffs, graph/vector/RAG/crawler/browser observers, or autonomous
 * actions.
 */

import type { DogfoodMetricCandidatePreview } from "./dogfood-metric-candidate-preview";

export const PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION =
  "perspective_next_work_candidate_update_preview.v0.1" as const;

export type PerspectiveNextWorkCandidateUpdateStatus =
  | "insufficient_data"
  | "candidate_update_available"
  | "needs_operator_review";

export type PerspectiveNextWorkCandidateStrength =
  | "weak"
  | "moderate"
  | "strong"
  | "insufficient_data";

export type PerspectiveNextWorkCandidateBucket =
  | "helpful"
  | "stale"
  | "missing"
  | "noisy"
  | "misleading"
  | "unknown"
  | "skipped_or_unverified_check"
  | "not_done_item"
  | "expected_observed_mismatch"
  | "carry_forward";

export interface PerspectiveNextWorkCandidateUpdatePreview {
  preview_version: typeof PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  candidate_status: PerspectiveNextWorkCandidateUpdateStatus;
  summary: string;
  input_summary: PerspectiveNextWorkCandidateInputSummary;
  proposed_perspective_unit_updates: ProposedPerspectiveUnitUpdates;
  proposed_next_work_bias_updates: ProposedNextWorkBiasUpdates;
  proposed_carry_forward_memory_candidates: ProposedCarryForwardMemoryCandidates;
  evidence_summary: PerspectiveNextWorkEvidenceSummary;
  review_required: true;
  operator_review_checklist: string[];
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  write_readiness: PerspectiveNextWorkWriteReadiness;
  non_goals: string[];
  authority_boundary: PerspectiveNextWorkAuthorityBoundary;
}

export interface PerspectiveNextWorkCandidateInputSummary {
  metric_preview_ref: string;
  metric_preview_version: DogfoodMetricCandidatePreview["preview_version"] | null;
  metric_candidate_status: DogfoodMetricCandidatePreview["candidate_status"] | null;
  ledger_record_count: number;
  source_record_refs: string[];
  helpful_ref_count: number;
  stale_ref_count: number;
  missing_ref_count: number;
  noisy_ref_count: number;
  misleading_ref_count: number;
  unknown_ref_count: number;
  skipped_or_unverified_check_count: number;
  not_done_item_count: number;
  mismatch_count: number;
}

export interface PerspectiveNextWorkCandidateItem {
  candidate_id: string;
  ref_id: string;
  label: string;
  summary: string;
  source_bucket: PerspectiveNextWorkCandidateBucket;
  evidence_refs: string[];
  source_record_refs: string[];
  strength: PerspectiveNextWorkCandidateStrength;
  candidate_only: true;
  review_note: string;
}

export interface ProposedPerspectiveUnitUpdates {
  reinforce_candidates: PerspectiveNextWorkCandidateItem[];
  weaken_candidates: PerspectiveNextWorkCandidateItem[];
  warn_candidates: PerspectiveNextWorkCandidateItem[];
  retire_or_deprioritize_candidates: PerspectiveNextWorkCandidateItem[];
  split_or_review_candidates: PerspectiveNextWorkCandidateItem[];
  insufficient_data_candidates: PerspectiveNextWorkCandidateItem[];
}

export interface ProposedNextWorkBiasUpdates {
  refs_to_preserve_next_time: PerspectiveNextWorkCandidateItem[];
  refs_to_warn_next_time: PerspectiveNextWorkCandidateItem[];
  refs_to_drop_or_deprioritize: PerspectiveNextWorkCandidateItem[];
  next_handoff_adjustments: string[];
  next_relay_update_suggestions: string[];
  next_focus_candidates: string[];
}

export interface ProposedCarryForwardMemoryCandidates {
  reusable_context_candidates: PerspectiveNextWorkCandidateItem[];
  stale_context_warnings: PerspectiveNextWorkCandidateItem[];
  unresolved_gap_candidates: PerspectiveNextWorkCandidateItem[];
  verification_bias_candidates: PerspectiveNextWorkCandidateItem[];
  non_goal_reminders: string[];
}

export interface PerspectiveNextWorkEvidenceSummary {
  has_metric_candidate_preview: boolean;
  has_approved_ledger_records: boolean;
  has_helpful_signal: boolean;
  has_problem_signal: boolean;
  has_unknown_signal: boolean;
  has_skipped_or_unverified_checks: boolean;
  has_not_done_items: boolean;
  has_expected_observed_mismatches: boolean;
  has_insufficient_data: boolean;
  evidence_refs: string[];
  missing_evidence: string[];
}

export interface PerspectiveNextWorkWriteReadiness {
  ready_for_perspective_update_write: false;
  ready_for_next_work_bias_write: false;
  required_followup: string[];
  refusal_reasons: string[];
}

export interface PerspectiveNextWorkAuthorityBoundary {
  read_only: true;
  candidate_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
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
