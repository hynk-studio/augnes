import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_REVIEW_KIND =
  "research_candidate_manual_global_dogfood_next_work_signal_review" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_REVIEW_VERSION =
  "research_candidate_manual_global_dogfood_next_work_signal_review.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewDecision =
  | "accept_contract_for_future_next_work_signal_write_slice"
  | "needs_next_work_mapping_revision"
  | "reject_next_work_contract"
  | "defer_next_work_contract";

export type ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewStatus =
  | "ready_for_future_next_work_signal_write_slice"
  | "blocked_next_work_contract_not_ready"
  | "blocked_next_work_mapping_revision_required"
  | "rejected_by_operator"
  | "deferred_by_operator";

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewInput {
  next_work_signal_contract: ResearchCandidateManualGlobalDogfoodNextWorkSignalContract;
  operator_decision: ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewDecision;
  operator_note?: string;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalAcceptedMappingSummary {
  source_projection_fingerprint: string;
  source_latest_active_committed_receipt_id: string | null;
  source_ledger_record_ref: string | null;
  proposed_idempotency_key: string;
  recommended_next_work_label: string | null;
  outcome_label: string | null;
  candidate_priority_hint: string;
  future_write_mode: string;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewValidation {
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

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalReview {
  review_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_REVIEW_KIND;
  review_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_REVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  source_contract_ref: string;
  source_contract_fingerprint: string;
  operator_decision: ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewDecision;
  review_status: ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewStatus;
  accepted_mapping_summary: ResearchCandidateManualGlobalDogfoodNextWorkSignalAcceptedMappingSummary | null;
  unresolved_blockers: string[];
  warning_reasons: string[];
  future_write_requirements: string[];
  validation: ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorityBoundary;
}
