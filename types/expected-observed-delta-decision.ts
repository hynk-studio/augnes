import type { CandidateIngressNormalizedCandidate } from "./candidate-ingress-normalizer";
import type {
  ExpectedObservedDeltaCandidateBuckets,
  ExpectedObservedDeltaPreview,
} from "./expected-observed-delta-preview";

export const EXPECTED_OBSERVED_DELTA_OPERATOR_DECISION_PREVIEW_VERSION =
  "expected_observed_delta_operator_decision_preview.v0.1" as const;

export interface ExpectedObservedDeltaOperatorDecisionPreviewInput {
  expected_observed_delta_preview?: unknown;
  selected_delta_candidate_refs?: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export type ExpectedObservedDeltaOperatorDecisionStatus =
  | "no_expected_observed_delta_preview"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "needs_operator_judgment"
  | "ready_for_operator_decision"
  | "ready_for_future_delta_record_write"
  | "keep_preview_only";

export type ExpectedObservedDeltaRecommendedOperatorDecision =
  | "approve_for_expected_observed_delta_record"
  | "defer_until_expected_material_supplied"
  | "defer_until_observed_material_supplied"
  | "defer_until_evidence_supplied"
  | "defer_until_selected_delta_refs_supplied"
  | "defer_until_idempotency_supplied"
  | "resolve_blockers"
  | "reject_delta_candidate"
  | "keep_as_candidate_only"
  | "request_more_evidence";

export type ExpectedObservedDeltaAvailableOperatorDecision =
  | "approve_for_expected_observed_delta_record"
  | "defer"
  | "reject"
  | "keep_candidate"
  | "request_more_evidence";

export interface ExpectedObservedDeltaDecisionWriteReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_valid_expected_observed_delta_preview: true;
  requires_delta_preview_ready_for_operator_review: true;
  requires_selected_delta_candidate_refs: true;
  requires_review_confirmation: true;
  requires_idempotency_key: true;
  requires_operator_ref: true;
  requires_source_refs: true;
  requires_evidence_refs: true;
  requires_no_blockers: true;
  requires_no_missing_evidence: true;
  requires_no_refusal_reasons: true;
  requires_read_only_delta_preview: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
}

export interface ExpectedObservedDeltaWouldWriteRecordPreview {
  proposed_record_kind: "expected_observed_delta_record.v0.1" | null;
  proposed_receipt_kind: "expected_observed_delta_receipt.v0.1" | null;
  selected_delta_candidate_refs: string[];
  selectable_delta_candidate_refs: string[];
  excluded_review_only_candidate_refs: string[];
  delta_candidate_summaries: Array<{
    candidate_ref: string;
    bucket: keyof ExpectedObservedDeltaCandidateBuckets;
    candidate_kind: string;
    label: string;
    summary: string;
  }>;
  expected_summary: ExpectedObservedDeltaPreview["expected_summary"];
  observed_summary: ExpectedObservedDeltaPreview["observed_summary"];
  mismatch_summary: ExpectedObservedDeltaPreview["mismatch_summary"];
  source_refs: string[];
  evidence_refs: string[];
  work_ref: string | null;
  result_ref: string | null;
  handoff_ref: string | null;
  codex_result_report_intake_record_refs: string[];
  work_episode_residue_preview_ref: string | null;
  review_confirmation_ref: string | null;
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_summary: string;
}

export interface ExpectedObservedDeltaDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_persist_decision: false;
  can_write_db: false;
  can_create_schema: false;
  can_write_expected_observed_delta: false;
  can_write_expected_observed_delta_receipt: false;
  can_write_reuse_outcome_ledger: false;
  can_write_dogfood_metrics: false;
  can_write_work_episode: false;
  can_write_memory: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_current_working_perspective: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
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

export interface ExpectedObservedDeltaOperatorDecisionPreview {
  runtime: "augnes";
  preview_version: typeof EXPECTED_OBSERVED_DELTA_OPERATOR_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: ExpectedObservedDeltaOperatorDecisionStatus;
  recommended_operator_decision: ExpectedObservedDeltaRecommendedOperatorDecision;
  available_operator_decisions: ExpectedObservedDeltaAvailableOperatorDecision[];
  input_summary: {
    has_valid_expected_observed_delta_preview: boolean;
    selected_delta_candidate_ref_count: number;
    selectable_delta_candidate_ref_count: number;
    would_write_delta_candidate_count: number;
    review_only_candidate_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    review_confirmation_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    requested_operator_ref_supplied: boolean;
  };
  source_status: {
    expected_observed_delta_preview:
      | "supplied"
      | "missing"
      | "wrong_version"
      | "malformed";
    delta_preview_authority_boundary: "valid_read_only" | "invalid" | "missing";
    selected_delta_candidate_refs: "supplied" | "missing" | "unknown_ref" | "unsafe";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
  };
  write_readiness: ExpectedObservedDeltaDecisionWriteReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_valid_expected_observed_delta_preview: boolean;
    has_delta_candidate_material: boolean;
    has_selected_delta_candidate_refs: boolean;
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
  would_write_delta_record_preview: ExpectedObservedDeltaWouldWriteRecordPreview;
  selected_delta_candidates: CandidateIngressNormalizedCandidate[];
  candidate_carry_forward: {
    review_only_candidates: CandidateIngressNormalizedCandidate[];
  };
  would_not_write: string[];
  review_checklist: string[];
  non_goals: string[];
  authority_boundary: ExpectedObservedDeltaDecisionAuthorityBoundary;
  fallback_reason: string | null;
  notes: string[];
}
