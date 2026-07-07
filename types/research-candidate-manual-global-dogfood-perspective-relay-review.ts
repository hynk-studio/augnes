import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_REVIEW_KIND =
  "research_candidate_manual_global_dogfood_perspective_relay_review" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_REVIEW_VERSION =
  "research_candidate_manual_global_dogfood_perspective_relay_review.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewDecision =
  | "accept_contract_for_future_perspective_relay_write_slice"
  | "needs_perspective_relay_mapping_revision"
  | "reject_perspective_relay_contract"
  | "defer_perspective_relay_contract";

export type ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewStatus =
  | "ready_for_future_perspective_relay_write_slice"
  | "blocked_perspective_relay_contract_not_ready"
  | "blocked_perspective_relay_mapping_revision_required"
  | "rejected_by_operator"
  | "deferred_by_operator";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewInput {
  perspective_relay_contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract;
  operator_decision: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewDecision;
  operator_note?: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayAcceptedMappingSummary {
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
  relay_update_label: string | null;
  recommended_next_work_label: string | null;
  outcome_label: string | null;
  outcome_signal: string | null;
  relay_scope_hint: string;
  future_write_mode: string;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewValidation {
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview {
  review_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_REVIEW_KIND;
  review_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_REVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  source_contract_ref: string;
  source_contract_fingerprint: string;
  operator_decision: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewDecision;
  review_status: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewStatus;
  accepted_mapping_summary: ResearchCandidateManualGlobalDogfoodPerspectiveRelayAcceptedMappingSummary | null;
  unresolved_blockers: string[];
  warning_reasons: string[];
  future_write_requirements: string[];
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveRelayAuthorityBoundary;
}
