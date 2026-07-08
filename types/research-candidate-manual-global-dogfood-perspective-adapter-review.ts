import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract,
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterTarget,
} from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_REVIEW_KIND =
  "research_candidate_manual_global_dogfood_perspective_adapter_review" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_REVIEW_VERSION =
  "research_candidate_manual_global_dogfood_perspective_adapter_review.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewDecision =
  | "accept_contract_for_future_perspective_adapter_write_slice"
  | "needs_perspective_adapter_mapping_revision"
  | "reject_perspective_adapter_contract"
  | "defer_perspective_adapter_contract";

export type ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewStatus =
  | "ready_for_future_perspective_adapter_write_slice"
  | "blocked_perspective_adapter_contract_not_ready"
  | "blocked_perspective_adapter_mapping_revision_required"
  | "rejected_by_operator"
  | "deferred_by_operator";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewInput {
  perspective_adapter_contract: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract;
  operator_decision: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewDecision;
  operator_note?: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterAcceptedMappingSummary {
  source_contract_fingerprint: string;
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
  intended_future_adapter_target: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterTarget;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewValidation {
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview {
  review_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_REVIEW_KIND;
  review_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_REVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  source_contract_ref: string;
  source_contract_fingerprint: string;
  operator_decision: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewDecision;
  review_status: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewStatus;
  accepted_mapping_summary: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterAcceptedMappingSummary | null;
  unresolved_blockers: string[];
  warning_reasons: string[];
  future_write_requirements: string[];
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterAuthorityBoundary;
}
