import type {
  ResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-contract";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_REVIEW_KIND =
  "research_candidate_manual_global_dogfood_metric_snapshot_review" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_REVIEW_VERSION =
  "research_candidate_manual_global_dogfood_metric_snapshot_review.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewDecision =
  | "accept_contract_for_future_metric_snapshot_write_slice"
  | "needs_metric_mapping_revision"
  | "reject_metric_contract"
  | "defer_metric_contract";

export type ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewStatus =
  | "ready_for_future_metric_snapshot_write_slice"
  | "blocked_metric_contract_not_ready"
  | "blocked_metric_mapping_revision_required"
  | "rejected_by_operator"
  | "deferred_by_operator";

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewInput {
  metric_snapshot_contract: ResearchCandidateManualGlobalDogfoodMetricSnapshotContract;
  operator_decision: ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewDecision;
  operator_note?: string;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotAcceptedMappingSummary {
  source_projection_fingerprint: string;
  source_latest_active_committed_receipt_id: string | null;
  source_ledger_record_ref: string | null;
  proposed_idempotency_key: string;
  outcome_label: string | null;
  outcome_signal: string | null;
  proposed_counter_count: number;
  future_write_mode: string;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewValidation {
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

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotReview {
  review_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_REVIEW_KIND;
  review_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_REVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  source_contract_ref: string;
  source_contract_fingerprint: string;
  operator_decision: ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewDecision;
  review_status: ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewStatus;
  accepted_mapping_summary: ResearchCandidateManualGlobalDogfoodMetricSnapshotAcceptedMappingSummary | null;
  unresolved_blockers: string[];
  warning_reasons: string[];
  future_write_requirements: string[];
  validation: ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorityBoundary;
}
