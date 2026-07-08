import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationTarget,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_REVIEW_KIND =
  "research_candidate_manual_global_dogfood_perspective_state_application_review" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_REVIEW_VERSION =
  "research_candidate_manual_global_dogfood_perspective_state_application_review.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewDecision =
  | "accept_contract_for_future_perspective_state_application_write_slice"
  | "needs_perspective_state_application_mapping_revision"
  | "reject_perspective_state_application_contract"
  | "defer_perspective_state_application_contract";

export type ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewStatus =
  | "ready_for_future_perspective_state_application_write_slice"
  | "blocked_perspective_state_application_contract_not_ready"
  | "blocked_perspective_state_application_mapping_revision_required"
  | "rejected_by_operator"
  | "deferred_by_operator";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewInput {
  perspective_state_application_contract: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract;
  operator_decision: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewDecision;
  operator_note?: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationAcceptedMappingSummary {
  source_contract_fingerprint: string;
  source_perspective_adapter_receipt_id: string | null;
  source_perspective_adapter_record_id: string | null;
  source_perspective_adapter_record_fingerprint: string | null;
  source_perspective_state_mutation_receipt_id: string | null;
  source_perspective_state_mutation_record_id: string | null;
  source_perspective_state_mutation_record_fingerprint: string | null;
  source_perspective_apply_receipt_id: string | null;
  source_perspective_apply_record_id: string | null;
  source_perspective_apply_record_fingerprint: string | null;
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
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  source_expected_observed_delta_record_ref: string | null;
  source_reuse_outcome_record_ref: string | null;
  proposed_idempotency_key: string;
  intended_future_state_application_target: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationTarget;
  state_application_label: string | null;
  state_application_rationale: string | null;
  adapter_label: string | null;
  adapter_rationale: string | null;
  mutation_label: string | null;
  mutation_rationale: string | null;
  apply_label: string | null;
  apply_rationale: string | null;
  canonical_update_label: string | null;
  canonical_update_rationale: string | null;
  future_write_mode: string;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewValidation {
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview {
  review_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_REVIEW_KIND;
  review_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_REVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  source_contract_ref: string;
  source_contract_fingerprint: string;
  operator_decision: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewDecision;
  review_status: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewStatus;
  accepted_mapping_summary: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationAcceptedMappingSummary | null;
  unresolved_blockers: string[];
  warning_reasons: string[];
  future_write_requirements: string[];
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationAuthorityBoundary;
}
