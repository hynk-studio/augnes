import type {
  ResearchCandidateManualResultWriteStatus,
} from "@/types/research-candidate-manual-result-authorized-record-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_BRIDGE_PREVIEW_KIND =
  "research_candidate_manual_result_dogfood_bridge_preview" as const;

export const RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_BRIDGE_PREVIEW_VERSION =
  "research_candidate_manual_result_dogfood_bridge_preview.v0.1" as const;

export type ResearchCandidateManualResultDogfoodBridgeReadiness =
  | "ready_for_operator_bridge_review"
  | "blocked_no_manual_result_records"
  | "blocked_no_committed_receipt"
  | "blocked_missing_expected_observed_delta"
  | "blocked_missing_reuse_outcome"
  | "blocked_only_rolled_back_or_superseded_records"
  | "blocked_shape_mismatch";

export type ResearchCandidateManualResultDogfoodBridgeOutcomeLabel =
  | "helpful"
  | "stale"
  | "missing"
  | "noisy"
  | "misleading"
  | "not_reported";

export interface ResearchCandidateManualResultDogfoodBridgePreviewInput {
  readback: unknown;
  limit?: number;
  scope?: ResearchCandidateReviewScope;
  operator_view?: string;
}

export interface ResearchCandidateManualResultDogfoodBridgeReceiptStatusSummary {
  total_receipts: number;
  committed_count: number;
  superseded_count: number;
  rolled_back_count: number;
  duplicate_replayed_count: number;
  active_committed_count: number;
  context_only_receipt_count: number;
}

export interface ResearchCandidateManualResultExpectedObservedDeltaAlignment {
  total_manual_expected_observed_delta_records: number;
  committed_count: number;
  superseded_count: number;
  rolled_back_count: number;
  latest_expected_summary: string | null;
  latest_observed_summary: string | null;
  latest_mismatch_or_gap_summary: string | null;
  observed_summary_present: boolean;
  source_handoff_seed_fingerprint_present: boolean;
  source_result_text_fingerprint_present: boolean;
  can_become_broader_expected_observed_delta_bridge_candidate: boolean;
  blockers: string[];
}

export interface ResearchCandidateManualResultReuseOutcomeAlignment {
  total_manual_reuse_outcome_records: number;
  committed_count: number;
  superseded_count: number;
  rolled_back_count: number;
  outcome_label_counts: Record<
    ResearchCandidateManualResultDogfoodBridgeOutcomeLabel,
    number
  >;
  latest_outcome_label: ResearchCandidateManualResultDogfoodBridgeOutcomeLabel;
  selected_candidate_context_ref_count: number;
  total_selected_candidate_context_ref_count: number;
  source_line_present: boolean;
  warning_reason_counts: Record<string, number>;
  can_become_broader_reuse_outcome_bridge_candidate: boolean;
  blockers: string[];
}

export type ResearchCandidateManualResultDogfoodBridgeCardKind =
  | "latest_committed_expected_observed_delta"
  | "latest_committed_reuse_outcome"
  | "context_only_expected_observed_delta"
  | "context_only_reuse_outcome"
  | "context_only_receipt";

export type ResearchCandidateManualResultDogfoodBridgeCardStatus =
  | "primary_candidate"
  | "context_only";

export interface ResearchCandidateManualResultDogfoodBridgeCard {
  card_id: string;
  card_kind: ResearchCandidateManualResultDogfoodBridgeCardKind;
  card_status: ResearchCandidateManualResultDogfoodBridgeCardStatus;
  receipt_id: string;
  receipt_status: ResearchCandidateManualResultWriteStatus;
  created_at: string;
  record_id: string | null;
  record_fingerprint: string | null;
  summary: string;
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  source_refs: string[];
  selected_candidate_context_refs: string[];
  outcome_label: ResearchCandidateManualResultDogfoodBridgeOutcomeLabel | null;
  writes_ledger: false;
  blockers: string[];
  warning_reasons: string[];
}

export interface ResearchCandidateManualResultDogfoodBridgeAuthorityBoundary {
  read_only: true;
  preview_only: true;
  source_of_truth: false;
  writes_global_dogfood_ledger: false;
  writes_dogfood_metrics: false;
  writes_expected_observed_delta_global_record: false;
  writes_reuse_outcome_global_record: false;
  writes_perspective: false;
  writes_perspective_memory: false;
  writes_proof_or_evidence: false;
  mutates_work: false;
  can_call_provider_or_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
}

export interface ResearchCandidateManualResultDogfoodBridgeValidation {
  passed: boolean;
  preview_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  readback_is_manual_result_records: boolean;
  raw_manual_note_text_absent: boolean;
  raw_result_report_text_absent: boolean;
  no_proof_evidence_work_or_perspective_rows_written: boolean;
  latest_committed_receipt_selected: boolean;
  no_global_dogfood_or_metric_write_authority: boolean;
  blocker_count: number;
  warning_count: number;
}

export interface ResearchCandidateManualResultDogfoodBridgePreview {
  preview_kind: typeof RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_BRIDGE_PREVIEW_KIND;
  preview_version: typeof RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_BRIDGE_PREVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  operator_view_label: string;
  source_readback_ref: string;
  source_receipt_ids: string[];
  latest_committed_receipt_id: string | null;
  receipt_status_summary: ResearchCandidateManualResultDogfoodBridgeReceiptStatusSummary;
  expected_observed_delta_alignment: ResearchCandidateManualResultExpectedObservedDeltaAlignment;
  reuse_outcome_alignment: ResearchCandidateManualResultReuseOutcomeAlignment;
  dogfood_bridge_readiness: ResearchCandidateManualResultDogfoodBridgeReadiness;
  candidate_bridge_cards: ResearchCandidateManualResultDogfoodBridgeCard[];
  blocked_reasons: string[];
  warning_reasons: string[];
  required_future_authorization: string[];
  authority_boundary: ResearchCandidateManualResultDogfoodBridgeAuthorityBoundary;
  validation: ResearchCandidateManualResultDogfoodBridgeValidation;
  next_recommended_slice: string;
}
