import type {
  ResearchCandidateManualGlobalDogfoodOutcomeSignal,
} from "@/types/research-candidate-manual-global-dogfood-ledger-workbench-projection";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_KIND =
  "research_candidate_manual_global_dogfood_metric_snapshot_contract" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_VERSION =
  "research_candidate_manual_global_dogfood_metric_snapshot_contract.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorizationMode =
  | "preview_only"
  | "ready_for_future_metric_snapshot_write_authorization"
  | "blocked_before_metric_snapshot_authorization";

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotContractInput {
  projection: unknown;
  operator_intent_label?: string;
  requested_future_write_mode?: string;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotMapping {
  outcome_label: string | null;
  outcome_signal: ResearchCandidateManualGlobalDogfoodOutcomeSignal | null;
  expected_summary_present: boolean;
  observed_summary_present: boolean;
  mismatch_or_gap_present: boolean;
  selected_candidate_context_ref_count: number;
  warning_reason_count: number;
  compatibility_finding_count: number;
  source_line_present: boolean;
  can_feed_metric_snapshot_refresh_candidate: boolean;
  can_write_metric_now: false;
  field_gaps: string[];
}

export interface ResearchCandidateManualGlobalDogfoodMetricDimensions {
  scope: ResearchCandidateReviewScope;
  source_projection_ref: string;
  source_latest_active_committed_receipt_id: string | null;
  source_ledger_record_ref: string | null;
  source_manual_receipt_id: string | null;
  source_contract_fingerprint: string | null;
  source_authorization_review_fingerprint: string | null;
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  source_expected_observed_delta_record_ref: string | null;
  source_reuse_outcome_record_ref: string | null;
  outcome_label: string | null;
  outcome_signal: ResearchCandidateManualGlobalDogfoodOutcomeSignal | null;
  selected_candidate_context_refs: string[];
  manual_only_context_refs: string[];
}

export interface ResearchCandidateManualGlobalDogfoodMetricCountersPreview {
  manual_global_dogfood_ledger_active_candidate_count: number;
  manual_global_dogfood_positive_signal_count: number;
  manual_global_dogfood_negative_signal_count: number;
  manual_global_dogfood_ambiguous_signal_count: number;
  manual_global_dogfood_follow_up_candidate_count: number;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodMetricLabelsPreview {
  source_family: "manual_research_candidate_global_dogfood_ledger";
  projection_ready_label: string;
  outcome_label: string | null;
  outcome_signal: ResearchCandidateManualGlobalDogfoodOutcomeSignal | null;
  expected_observed_follow_up_label: string;
  labels: string[];
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotIdempotencyPreview {
  proposed_idempotency_key: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  would_prevent_duplicate_metric_snapshot_write: true;
  durable_id_allocated: false;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotCompatibilityFinding {
  finding_code: string;
  severity: "ready" | "warning" | "blocker";
  applies_to: "manual_global_dogfood_projection" | "future_metric_snapshot_refresh";
  summary: string;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotNonWriteConfirmation {
  dogfood_metrics_written: false;
  metric_snapshot_written: false;
  next_work_bias_written: false;
  global_dogfood_ledger_written: false;
  global_dogfood_ledger_mutated: false;
  manual_result_records_written: false;
  manual_result_records_mutated: false;
  proof_or_evidence_written: false;
  work_mutated: false;
  perspective_promoted: false;
  perspective_state_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
  api_write_route_added: false;
  db_schema_or_migration_added: false;
  provider_openai_called: false;
  github_called: false;
  codex_executed: false;
  sources_fetched: false;
  retrieval_rag_embeddings_vector_fts_or_crawler_run: false;
  operator_note_persisted: false;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotValidation {
  passed: boolean;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  projection_ready: boolean;
  latest_active_committed_receipt_present: boolean;
  source_ledger_record_ref_present: boolean;
  source_fingerprints_present: boolean;
  outcome_signal_supported: boolean;
  projection_authority_is_read_only: boolean;
  no_write_authority: boolean;
  blocker_count: number;
  warning_count: number;
}

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorityBoundary {
  preview_only: true;
  read_only: true;
  source_of_truth: false;
  can_write_dogfood_metrics: false;
  can_write_metric_snapshot: false;
  can_write_global_dogfood_ledger: false;
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

export interface ResearchCandidateManualGlobalDogfoodMetricSnapshotContract {
  contract_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_KIND;
  contract_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_CONTRACT_VERSION;
  scope: ResearchCandidateReviewScope;
  operator_intent_label: string;
  requested_future_write_mode: string;
  source_projection_ref: string;
  source_projection_fingerprint: string;
  source_latest_active_committed_receipt_id: string | null;
  source_ledger_record_ref: string | null;
  source_manual_receipt_id: string | null;
  source_contract_fingerprint: string | null;
  source_authorization_review_fingerprint: string | null;
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  source_expected_observed_delta_record_ref: string | null;
  source_reuse_outcome_record_ref: string | null;
  operator_authorization_mode: ResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorizationMode;
  proposed_metric_snapshot_mapping: ResearchCandidateManualGlobalDogfoodMetricSnapshotMapping;
  proposed_metric_dimensions: ResearchCandidateManualGlobalDogfoodMetricDimensions;
  proposed_metric_counters: ResearchCandidateManualGlobalDogfoodMetricCountersPreview;
  proposed_metric_labels: ResearchCandidateManualGlobalDogfoodMetricLabelsPreview;
  idempotency_contract_preview: ResearchCandidateManualGlobalDogfoodMetricSnapshotIdempotencyPreview;
  compatibility_findings: ResearchCandidateManualGlobalDogfoodMetricSnapshotCompatibilityFinding[];
  blocker_reasons: string[];
  warning_reasons: string[];
  required_future_authorization: string[];
  required_future_checks: string[];
  non_write_confirmation: ResearchCandidateManualGlobalDogfoodMetricSnapshotNonWriteConfirmation;
  validation: ResearchCandidateManualGlobalDogfoodMetricSnapshotValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodMetricSnapshotAuthorityBoundary;
  next_recommended_slice: string;
}
