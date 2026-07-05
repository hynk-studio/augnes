import type { CodexResultFeedbackDraftConfidence } from "./codex-result-feedback-draft";
import type { DogfoodReuseCarryForwardCandidates } from "./dogfood-reuse-record-proposal";
import type {
  HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION,
} from "./handoff-reuse-outcome-ledger";

export const REUSE_OUTCOME_BRIDGE_OPERATOR_DECISION_PREVIEW_VERSION =
  "reuse_outcome_bridge_operator_decision_preview.v0.1" as const;

export interface ReuseOutcomeBridgeOperatorDecisionPreviewInput {
  reuse_outcome_candidate_bridge_preview?: unknown;
  expected_observed_delta_record_review?: unknown;
  expected_observed_delta_preview?: unknown;
  selected_reuse_candidate_refs?: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export type ReuseOutcomeBridgeOperatorDecisionPreviewStatus =
  | "no_reuse_outcome_bridge_preview"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "needs_operator_judgment"
  | "ready_for_operator_decision"
  | "ready_for_future_reuse_ledger_write"
  | "keep_preview_only";

export type ReuseOutcomeBridgeRecommendedOperatorDecision =
  | "approve_for_reuse_outcome_ledger_write"
  | "defer_until_delta_material_supplied"
  | "defer_until_evidence_supplied"
  | "defer_until_selected_reuse_refs_supplied"
  | "defer_until_idempotency_supplied"
  | "resolve_blockers"
  | "reject_reuse_outcome_candidate"
  | "keep_as_candidate_only"
  | "request_more_evidence";

export type ReuseOutcomeBridgeAvailableOperatorDecision =
  | "approve_for_reuse_outcome_ledger_write"
  | "defer"
  | "reject"
  | "keep_candidate"
  | "request_more_evidence";

export interface ReuseOutcomeBridgeCandidateSummary {
  candidate_ref: string;
  candidate_kind:
    | "helpful_ref"
    | "stale_ref"
    | "missing_ref"
    | "noisy_ref"
    | "misleading_ref"
    | "unknown_ref"
    | "skipped_or_unverified_check_signal"
    | "not_done_signal"
    | "expected_observed_mismatch_signal"
    | "requirement_progress_gap"
    | "context_feedback_signal"
    | "carry_forward_ref";
  bucket:
    | "helpful_refs"
    | "stale_refs"
    | "missing_refs"
    | "noisy_refs"
    | "misleading_refs"
    | "unknown_refs"
    | "skipped_or_unverified_check_signals"
    | "not_done_signals"
    | "expected_observed_mismatch_signals"
    | "requirement_progress_gaps"
    | "context_feedback_signals"
    | "carry_forward_refs";
  label: string;
  summary: string;
  evidence_refs: string[];
}

export interface ReuseOutcomeBridgeWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_bridge_preview: true;
  requires_delta_material: true;
  requires_operator_confirmation: true;
  requires_selected_reuse_refs: true;
  requires_idempotency_key: true;
  requires_source_refs: true;
  requires_evidence_refs: true;
  requires_no_blockers: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
  confidence: CodexResultFeedbackDraftConfidence;
}

export interface ReuseOutcomeBridgeEvidenceSummary {
  has_bridge_preview: boolean;
  has_candidate_material: boolean;
  has_delta_material: boolean;
  has_expected_observed_delta_records: boolean;
  has_selected_reuse_refs: boolean;
  has_source_refs: boolean;
  has_evidence_refs: boolean;
  has_skipped_or_unverified_checks: boolean;
  has_not_done_items: boolean;
  has_expected_observed_mismatches: boolean;
  has_requirement_progress_gaps: boolean;
  evidence_refs: string[];
  source_refs: string[];
  missing_evidence: string[];
}

export interface ReuseOutcomeBridgeSourceStatus {
  bridge_preview: "supplied" | "missing" | "wrong_version";
  expected_observed_delta_preview: "supplied" | "missing" | "wrong_version";
  expected_observed_delta_record_review:
    | "supplied"
    | "missing"
    | "wrong_version";
  delta_material: "supplied" | "missing";
  reuse_candidates: "supplied" | "missing";
}

export interface ReuseOutcomeBridgeWouldWriteLedgerRecordPreview {
  proposed_record_kind:
    | typeof HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION
    | null;
  proposed_receipt_kind:
    | typeof HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION
    | null;
  proposed_store_kind: typeof HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION | null;
  selected_reuse_candidate_refs: string[];
  selectable_reuse_candidate_refs: string[];
  selected_reuse_candidate_summaries: ReuseOutcomeBridgeCandidateSummary[];
  all_reuse_candidate_summaries: ReuseOutcomeBridgeCandidateSummary[];
  source_refs: string[];
  evidence_refs: string[];
  delta_refs: string[];
  result_ref: string | null;
  result_report_fingerprint: string | null;
  work_ref: string | null;
  handoff_ref: string | null;
  feedback_draft_ref: string | null;
  context_relay_rationale_ref: string | null;
  continuity_relay_ref: string | null;
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_confirmation_ref: string | null;
  proposed_reuse_classifications: {
    helpful_refs: string[];
    stale_refs: string[];
    missing_refs: string[];
    noisy_refs: string[];
    misleading_refs: string[];
    unknown_refs: string[];
  };
  proposed_handoff_quality_signals: {
    skipped_or_unverified_checks: string[];
    not_done_items: string[];
    expected_observed_mismatches: string[];
    requirement_progress_gaps: string[];
    context_feedback_signals: string[];
  };
  proposed_expected_observed_summary: {
    matched_expectation_count: number;
    missing_expectation_count: number;
    unexpected_observation_count: number;
    skipped_or_unverified_check_count: number;
    requirement_progress_gap_count: number;
    not_done_count: number;
    mismatch_summary: string;
    confidence: CodexResultFeedbackDraftConfidence;
  };
  carry_forward_candidates: DogfoodReuseCarryForwardCandidates;
}

export interface ReuseOutcomeBridgeOperatorDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_write_handoff_reuse_ledger: false;
  can_write_dogfood_ledger: false;
  can_write_dogfood_metrics: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_update_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_send_handoff: false;
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

export interface ReuseOutcomeBridgeOperatorDecisionPreview {
  runtime: "augnes";
  preview_version: typeof REUSE_OUTCOME_BRIDGE_OPERATOR_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: ReuseOutcomeBridgeOperatorDecisionPreviewStatus;
  recommended_operator_decision: ReuseOutcomeBridgeRecommendedOperatorDecision;
  available_operator_decisions: ReuseOutcomeBridgeAvailableOperatorDecision[];
  input_summary: {
    has_bridge_preview: boolean;
    bridge_candidate_count: number;
    selectable_reuse_candidate_ref_count: number;
    selected_reuse_candidate_ref_count: number;
    would_write_reuse_candidate_count: number;
    delta_material_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
  };
  bridge_preview_refs: {
    preview_version: string | null;
    bridge_preview_status: string | null;
    source_refs: string[];
  };
  delta_refs: {
    expected_observed_delta_preview_ref: string | null;
    expected_observed_delta_record_refs: string[];
    selected_expected_observed_delta_record_id: string | null;
    latest_expected_observed_delta_record_id: string | null;
    work_ref: string | null;
    result_ref: string | null;
    handoff_ref: string | null;
  };
  source_status: ReuseOutcomeBridgeSourceStatus;
  write_readiness: ReuseOutcomeBridgeWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: ReuseOutcomeBridgeEvidenceSummary;
  would_write_reuse_ledger_record_preview: ReuseOutcomeBridgeWouldWriteLedgerRecordPreview;
  candidate_carry_forward: DogfoodReuseCarryForwardCandidates;
  review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: ReuseOutcomeBridgeOperatorDecisionAuthorityBoundary;
  fallback_reason: string | null;
  notes: string[];
}
