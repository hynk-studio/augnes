import type {
  ResearchCandidateManualGlobalDogfoodLedgerWriteStatus,
} from "@/types/research-candidate-manual-global-dogfood-ledger-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WORKBENCH_PROJECTION_KIND =
  "research_candidate_manual_global_dogfood_ledger_workbench_projection" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WORKBENCH_PROJECTION_VERSION =
  "research_candidate_manual_global_dogfood_ledger_workbench_projection.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionReadiness =
  | "ready_for_workbench_loop_spine_preview"
  | "blocked_no_global_dogfood_ledger_records"
  | "blocked_no_active_committed_ledger_receipt"
  | "blocked_missing_ledger_record"
  | "blocked_missing_source_fingerprints"
  | "blocked_shape_mismatch";

export type ResearchCandidateManualGlobalDogfoodOutcomeSignal =
  | "positive"
  | "negative"
  | "ambiguous";

export type ResearchCandidateManualGlobalDogfoodNextWorkCardKind =
  | "manual_global_dogfood_latest_outcome"
  | "manual_global_dogfood_expected_observed_delta"
  | "manual_global_dogfood_context_only_rolled_back"
  | "manual_global_dogfood_context_only_superseded";

export type ResearchCandidateManualGlobalDogfoodNextWorkCardStatus =
  | "primary_next_work_candidate"
  | "context_only"
  | "blocked";

export interface ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionLedgerStatusSummary {
  total_receipts: number;
  committed_count: number;
  rolled_back_count: number;
  superseded_count: number;
  active_committed_count: number;
  context_only_count: number;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionRecordSummary {
  source_manual_receipt_id: string | null;
  source_contract_fingerprint: string | null;
  source_authorization_review_fingerprint: string | null;
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  source_expected_observed_delta_record_ref: string | null;
  source_reuse_outcome_record_ref: string | null;
  outcome_label: string | null;
  selected_candidate_context_refs: string[];
  selected_candidate_context_ref_count: number;
  expected_summary: string | null;
  observed_summary: string | null;
  mismatch_or_gap_summary: string | null;
  source_line: string | null;
  manual_only_context_refs: string[];
  warning_reasons: string[];
  warning_reason_count: number;
  compatibility_findings: unknown[];
  compatibility_finding_count: number;
}

export interface ResearchCandidateManualGlobalDogfoodOutcomeSignalSummary {
  outcome_label_counts: {
    helpful: number;
    stale: number;
    missing: number;
    noisy: number;
    misleading: number;
    unknown: number;
  };
  latest_active_outcome_label: string | null;
  latest_active_outcome_is_helpful: boolean;
  latest_active_outcome_is_stale: boolean;
  latest_active_outcome_is_missing: boolean;
  latest_active_outcome_is_noisy: boolean;
  latest_active_outcome_is_misleading: boolean;
  latest_outcome_signal: ResearchCandidateManualGlobalDogfoodOutcomeSignal;
  no_salience_update: true;
  no_metric_write: true;
}

export interface ResearchCandidateManualGlobalDogfoodExpectedObservedSignalSummary {
  expected_summary: string | null;
  observed_summary: string | null;
  mismatch_or_gap_summary: string | null;
  observed_summary_present: boolean;
  mismatch_or_gap_implies_follow_up: boolean;
  no_perspective_promotion: true;
  no_proof_or_evidence: true;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalCard {
  card_id: string;
  card_kind: ResearchCandidateManualGlobalDogfoodNextWorkCardKind;
  card_status: ResearchCandidateManualGlobalDogfoodNextWorkCardStatus;
  source_receipt_id: string | null;
  source_record_id: string | null;
  source_fingerprints: {
    source_contract_fingerprint: string | null;
    source_authorization_review_fingerprint: string | null;
    source_handoff_seed_fingerprint: string | null;
    source_result_text_fingerprint: string | null;
    source_expected_observed_delta_record_ref: string | null;
    source_reuse_outcome_record_ref: string | null;
  };
  recommended_next_work_label: string;
  rationale: string;
  blockers: string[];
  warnings: string[];
  would_write_next_work_bias: false;
  would_write_perspective: false;
  would_write_metrics: false;
}

export interface ResearchCandidateManualGlobalDogfoodLoopSpineAlignment {
  can_feed_workbench_dogfood_loop_spine_overview_read_model: boolean;
  can_feed_dogfood_metric_snapshot_preview_read_model: boolean;
  can_feed_next_work_signal_decision_preview_read_model: boolean;
  blockers_before_any_write_or_mutation: string[];
  read_only_alignment_note: string;
}

export interface ResearchCandidateManualGlobalDogfoodWorkbenchProjectionAuthorityBoundary {
  read_only: true;
  preview_only: true;
  source_of_truth: false;
  can_write_dogfood_metrics: false;
  can_write_dogfood_ledger: false;
  can_mutate_manual_global_dogfood_ledger: false;
  can_write_next_work_bias: false;
  can_write_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_write_proof_or_evidence: false;
  can_mutate_work: false;
  can_execute_codex: false;
  can_call_github: false;
  can_call_providers_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
}

export interface ResearchCandidateManualGlobalDogfoodWorkbenchProjectionValidation {
  passed: boolean;
  failure_codes: string[];
  projection_fingerprint: string;
  source_readback_shape_valid: boolean;
  active_committed_receipt_present: boolean;
  latest_ledger_record_present: boolean;
  source_fingerprints_present: boolean;
  no_metric_write: true;
  no_next_work_bias_write: true;
  no_perspective_write: true;
  no_proof_or_evidence_write: true;
  no_work_mutation: true;
}

export interface ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection {
  projection_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WORKBENCH_PROJECTION_KIND;
  projection_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WORKBENCH_PROJECTION_VERSION;
  projection_readiness: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionReadiness;
  projection_fingerprint: string;
  scope: ResearchCandidateReviewScope;
  operator_view: string | null;
  source_readback_ref: string;
  source_receipt_ids: string[];
  latest_active_committed_receipt_id: string | null;
  ledger_status_summary: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionLedgerStatusSummary;
  latest_ledger_record_summary: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionRecordSummary;
  outcome_signal_summary: ResearchCandidateManualGlobalDogfoodOutcomeSignalSummary;
  expected_observed_signal_summary: ResearchCandidateManualGlobalDogfoodExpectedObservedSignalSummary;
  next_work_signal_candidates: ResearchCandidateManualGlobalDogfoodNextWorkSignalCard[];
  dogfood_loop_spine_alignment: ResearchCandidateManualGlobalDogfoodLoopSpineAlignment;
  blocked_reasons: string[];
  warning_reasons: string[];
  required_future_authorization: string[];
  authority_boundary: ResearchCandidateManualGlobalDogfoodWorkbenchProjectionAuthorityBoundary;
  validation: ResearchCandidateManualGlobalDogfoodWorkbenchProjectionValidation;
  next_recommended_slice: string;
}

export type ResearchCandidateManualGlobalDogfoodLedgerProjectionContextReceiptStatus =
  Exclude<ResearchCandidateManualGlobalDogfoodLedgerWriteStatus, "duplicate_replayed">;
