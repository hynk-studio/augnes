import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyTarget,
} from "@/types/research-candidate-manual-global-dogfood-perspective-apply-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_REVIEW_KIND =
  "research_candidate_manual_global_dogfood_perspective_apply_review" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_REVIEW_VERSION =
  "research_candidate_manual_global_dogfood_perspective_apply_review.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewDecision =
  | "accept_contract_for_future_perspective_apply_write_slice"
  | "needs_perspective_apply_mapping_revision"
  | "reject_perspective_apply_contract"
  | "defer_perspective_apply_contract";

export type ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewStatus =
  | "ready_for_future_perspective_apply_write_slice"
  | "blocked_perspective_apply_contract_not_ready"
  | "blocked_perspective_apply_mapping_revision_required"
  | "rejected_by_operator"
  | "deferred_by_operator";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewInput {
  perspective_apply_contract: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract;
  operator_decision: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewDecision;
  operator_note?: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveApplyAcceptedMappingSummary {
  source_contract_fingerprint: string;
  source_canonical_perspective_update_receipt_id: string | null;
  source_canonical_perspective_update_record_id: string | null;
  source_canonical_perspective_update_record_fingerprint: string | null;
  source_perspective_relay_receipt_id: string | null;
  source_perspective_relay_record_id: string | null;
  source_perspective_relay_record_fingerprint: string | null;
  source_next_work_signal_receipt_id: string | null;
  source_next_work_signal_record_id: string | null;
  source_next_work_signal_record_fingerprint: string | null;
  source_next_work_bias_receipt_id: string | null;
  source_next_work_bias_record_id: string | null;
  source_next_work_bias_record_fingerprint: string | null;
  source_projection_fingerprint: string | null;
  source_global_dogfood_ledger_receipt_id: string | null;
  source_global_dogfood_ledger_record_id: string | null;
  source_metric_snapshot_receipt_id: string | null;
  source_metric_snapshot_record_id: string | null;
  source_manual_receipt_id: string | null;
  source_expected_observed_delta_record_ref: string | null;
  source_reuse_outcome_record_ref: string | null;
  proposed_idempotency_key: string;
  intended_future_apply_target: ResearchCandidateManualGlobalDogfoodPerspectiveApplyTarget;
  apply_label: string | null;
  apply_rationale: string | null;
  canonical_update_label: string | null;
  canonical_update_rationale: string | null;
  future_write_mode: string;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewValidation {
  passed: boolean;
  review_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  contract_ready: boolean;
  operator_accepts_ready_contract: boolean;
  operator_note_persisted: false;
  no_write_authority: true;
  unresolved_blocker_count: number;
  warning_count: number;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveApplyReview {
  review_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_REVIEW_KIND;
  review_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_REVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  source_contract_ref: string;
  source_contract_fingerprint: string;
  operator_decision: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewDecision;
  review_status: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewStatus;
  accepted_mapping_summary: ResearchCandidateManualGlobalDogfoodPerspectiveApplyAcceptedMappingSummary | null;
  unresolved_blockers: string[];
  warning_reasons: string[];
  future_write_requirements: string[];
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveApplyAuthorityBoundary;
}
