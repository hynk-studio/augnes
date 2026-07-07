import type {
  ResearchCandidateManualGlobalDogfoodNextWorkBiasAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodNextWorkBiasContract,
} from "@/types/research-candidate-manual-global-dogfood-next-work-bias-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_REVIEW_KIND =
  "research_candidate_manual_global_dogfood_next_work_bias_review" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_REVIEW_VERSION =
  "research_candidate_manual_global_dogfood_next_work_bias_review.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodNextWorkBiasReviewDecision =
  | "accept_contract_for_future_next_work_bias_write_slice"
  | "needs_next_work_bias_mapping_revision"
  | "reject_next_work_bias_contract"
  | "defer_next_work_bias_contract";

export type ResearchCandidateManualGlobalDogfoodNextWorkBiasReviewStatus =
  | "ready_for_future_next_work_bias_write_slice"
  | "blocked_next_work_bias_contract_not_ready"
  | "blocked_next_work_bias_mapping_revision_required"
  | "rejected_by_operator"
  | "deferred_by_operator";

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasReviewInput {
  next_work_bias_contract: ResearchCandidateManualGlobalDogfoodNextWorkBiasContract;
  operator_decision: ResearchCandidateManualGlobalDogfoodNextWorkBiasReviewDecision;
  operator_note?: string;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasAcceptedMappingSummary {
  source_contract_fingerprint: string;
  source_next_work_signal_receipt_id: string | null;
  source_next_work_signal_record_id: string | null;
  source_next_work_signal_record_fingerprint: string | null;
  source_projection_fingerprint: string | null;
  source_global_dogfood_ledger_receipt_id: string | null;
  source_metric_snapshot_receipt_id: string | null;
  source_manual_receipt_id: string | null;
  source_expected_observed_delta_record_ref: string | null;
  source_reuse_outcome_record_ref: string | null;
  proposed_idempotency_key: string;
  recommended_next_work_label: string | null;
  outcome_label: string | null;
  outcome_signal: string | null;
  bias_strength_hint: string;
  future_write_mode: string;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasReviewValidation {
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

export interface ResearchCandidateManualGlobalDogfoodNextWorkBiasReview {
  review_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_REVIEW_KIND;
  review_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_BIAS_REVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  source_contract_ref: string;
  source_contract_fingerprint: string;
  operator_decision: ResearchCandidateManualGlobalDogfoodNextWorkBiasReviewDecision;
  review_status: ResearchCandidateManualGlobalDogfoodNextWorkBiasReviewStatus;
  accepted_mapping_summary: ResearchCandidateManualGlobalDogfoodNextWorkBiasAcceptedMappingSummary | null;
  unresolved_blockers: string[];
  warning_reasons: string[];
  future_write_requirements: string[];
  validation: ResearchCandidateManualGlobalDogfoodNextWorkBiasReviewValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodNextWorkBiasAuthorityBoundary;
}
