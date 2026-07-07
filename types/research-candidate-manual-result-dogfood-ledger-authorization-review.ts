import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationAuthorityBoundary,
  ResearchCandidateManualResultDogfoodLedgerAuthorizationContract,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_REVIEW_KIND =
  "research_candidate_manual_result_dogfood_ledger_authorization_review" as const;

export const RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_REVIEW_VERSION =
  "research_candidate_manual_result_dogfood_ledger_authorization_review.v0.1" as const;

export type ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewDecision =
  | "accept_contract_for_future_write_slice"
  | "needs_mapping_revision"
  | "reject_contract"
  | "defer_contract";

export type ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewStatus =
  | "ready_for_future_ledger_write_slice"
  | "blocked_contract_not_ready"
  | "blocked_mapping_revision_required"
  | "rejected_by_operator"
  | "deferred_by_operator";

export interface ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewInput {
  authorization_contract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract;
  operator_decision: ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewDecision;
  operator_note?: string;
}

export interface ResearchCandidateManualResultDogfoodLedgerAcceptedMappingSummary {
  source_manual_receipt_id: string | null;
  proposed_idempotency_key: string;
  outcome_label: string;
  selected_candidate_context_ref_count: number;
  expected_observed_delta_record_ref: string | null;
  reuse_outcome_record_ref: string | null;
  future_write_mode: string;
  writes_now: false;
}

export interface ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewValidation {
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

export interface ResearchCandidateManualResultDogfoodLedgerAuthorizationReview {
  review_kind: typeof RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_REVIEW_KIND;
  review_version: typeof RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_REVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  source_contract_ref: string;
  source_contract_fingerprint: string;
  operator_decision: ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewDecision;
  review_status: ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewStatus;
  accepted_mapping_summary: ResearchCandidateManualResultDogfoodLedgerAcceptedMappingSummary | null;
  unresolved_blockers: string[];
  warning_reasons: string[];
  future_write_requirements: string[];
  validation: ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewValidation;
  authority_boundary: ResearchCandidateManualResultDogfoodLedgerAuthorizationAuthorityBoundary;
}
