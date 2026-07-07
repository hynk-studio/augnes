import type {
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract,
} from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_REVIEW_KIND =
  "research_candidate_manual_global_dogfood_canonical_perspective_update_review" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_REVIEW_VERSION =
  "research_candidate_manual_global_dogfood_canonical_perspective_update_review.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewDecision =
  | "accept_contract_for_future_canonical_perspective_update_write_slice"
  | "needs_canonical_perspective_mapping_revision"
  | "reject_canonical_perspective_update_contract"
  | "defer_canonical_perspective_update_contract";

export type ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewStatus =
  | "ready_for_future_canonical_perspective_update_write_slice"
  | "blocked_canonical_perspective_contract_not_ready"
  | "blocked_canonical_perspective_mapping_revision_required"
  | "rejected_by_operator"
  | "deferred_by_operator";

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewInput {
  canonical_perspective_update_contract: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract;
  operator_decision: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewDecision;
  operator_note?: string;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAcceptedMappingSummary {
  source_contract_fingerprint: string;
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
  canonical_update_label: string | null;
  canonical_update_rationale: string | null;
  relay_update_label: string | null;
  outcome_label: string | null;
  outcome_signal: string | null;
  future_write_mode: string;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewValidation {
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

export interface ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview {
  review_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_REVIEW_KIND;
  review_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_REVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  source_contract_ref: string;
  source_contract_fingerprint: string;
  operator_decision: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewDecision;
  review_status: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewStatus;
  accepted_mapping_summary: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAcceptedMappingSummary | null;
  unresolved_blockers: string[];
  warning_reasons: string[];
  future_write_requirements: string[];
  validation: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateAuthorityBoundary;
}
