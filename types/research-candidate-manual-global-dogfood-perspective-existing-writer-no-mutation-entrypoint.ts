import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-review";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_KIND =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_VERSION =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointStatus =
  | "safe_no_mutation_entrypoint_available"
  | "unsupported_no_safe_entrypoint"
  | "input_validation_failed"
  | "unsafe_existing_writer_target_refused"
  | "row_count_delta_detected"
  | "blocked";

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAdapterTarget =
  | "manual_specific_current_working_writer_dry_run_adapter"
  | "manual_specific_existing_canonical_state_writer_dry_run_adapter"
  | "blocked";

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSnapshotSource =
  | "provided_before_after"
  | "dry_run_result_protected_row_counts"
  | "default_empty_in_memory_noop";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointInput {
  existing_writer_dry_run_contract:
    | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract
    | null
    | undefined;
  existing_writer_dry_run_review:
    | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview
    | null
    | undefined;
  existing_writer_dry_run_result:
    | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult
    | null
    | undefined;
  row_count_before?: Record<string, number> | null;
  row_count_after?: Record<string, number> | null;
  candidate_dry_run_adapter_input?: Record<string, unknown> | null;
  allow_safe_adapter_noop?: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointRowCountObservation {
  table_name: string;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceBinding {
  source_contract_fingerprint: string | null;
  source_review_fingerprint: string | null;
  source_dry_run_result_fingerprint: string | null;
  accepted_mapping_summary_present: boolean;
  accepted_mapping_contract_fingerprint: string | null;
  source_perspective_writer_compatibility_receipt_id: string | null;
  source_perspective_writer_compatibility_record_id: string | null;
  source_perspective_writer_compatibility_record_fingerprint: string | null;
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  intended_future_dry_run_target: string | null;
  accepted_future_dry_run_target: string | null;
  safe_adapter_target: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAdapterTarget;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSupportedCapabilities {
  supports_row_count_snapshot: boolean;
  supports_transaction_rollback: boolean;
  supports_no_mutation_assertions: boolean;
  supports_safe_adapter_noop: boolean;
  supports_existing_writer_call: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointValidation {
  passed: boolean;
  entrypoint_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  source_contract_present: boolean;
  source_review_present: boolean;
  source_dry_run_result_present: boolean;
  source_contract_ready: boolean;
  source_review_accepted: boolean;
  source_dry_run_result_validated: boolean;
  source_contract_fingerprint_matches_review: boolean;
  accepted_mapping_summary_matches_contract: boolean;
  source_dry_run_result_matches_contract_review: boolean;
  safe_adapter_target_supported: boolean;
  direct_existing_writer_target_requested: boolean;
  direct_existing_writer_target_refused: boolean;
  raw_payload_absent: boolean;
  raw_payload_forbidden_fields: string[];
  row_count_snapshots_present: boolean;
  protected_row_counts_unchanged: boolean;
  existing_writer_called: false;
  existing_writer_call_faked: false;
  safe_adapter_noop_executed: boolean;
  no_write_authority: true;
  no_existing_writer_authority: true;
  no_provider_github_codex_retrieval_authority: true;
  failure_reasons: string[];
  warning_reasons: string[];
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointNonMutationAssertions {
  assertion_kind: "manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint_assertions";
  snapshot_source: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSnapshotSource;
  protected_table_row_counts: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointRowCountObservation[];
  protected_table_count: number;
  changed_protected_table_count: number;
  all_protected_row_counts_unchanged: boolean;
  row_count_before_after_snapshot_recorded: true;
  existing_writer_called: false;
  existing_current_working_writer_called: false;
  existing_canonical_state_writer_called: false;
  current_working_perspective_updated: false;
  existing_canonical_perspective_state_table_mutated: false;
  canonical_perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  work_mutated: false;
  dogfood_metrics_written: false;
  proof_or_evidence_written: false;
  manual_result_records_written: false;
  product_write_executed: false;
  provider_openai_called: false;
  github_called: false;
  codex_executed: false;
  sources_fetched: false;
  retrieval_rag_embeddings_vector_fts_or_crawler_run: false;
  raw_operator_note_or_result_persisted: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAuthorityBoundary {
  preview_only: true;
  read_only: true;
  source_of_truth: false;
  can_run_safe_adapter_noop: true;
  can_call_existing_current_working_writer: false;
  can_call_existing_canonical_state_writer: false;
  can_update_current_working_perspective: false;
  can_mutate_existing_canonical_perspective_state: false;
  can_write_existing_canonical_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_write_work_item: false;
  can_mutate_work: false;
  can_write_dogfood_metrics: false;
  can_write_global_dogfood_ledger: false;
  can_write_metric_snapshot: false;
  can_write_next_work_signal_decision: false;
  can_write_proof_or_evidence: false;
  can_execute_codex: false;
  can_call_github: false;
  can_call_providers_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointExecutionDecision {
  adapter_runnable_today: boolean;
  safe_adapter_noop_executed: boolean;
  existing_writer_called: false;
  existing_writer_skipped: true;
  skipped_existing_writer_reason: string;
  execution_trace: string[];
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult {
  entrypoint_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_KIND;
  entrypoint_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_VERSION;
  scope: ResearchCandidateReviewScope;
  entrypoint_status: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointStatus;
  source_binding: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceBinding;
  source_contract_fingerprint: string | null;
  source_review_fingerprint: string | null;
  source_dry_run_result_fingerprint: string | null;
  safe_adapter_target: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAdapterTarget;
  supported_capabilities: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSupportedCapabilities;
  execution_decision: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointExecutionDecision;
  non_mutation_assertions: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointNonMutationAssertions;
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAuthorityBoundary;
  blocker_reasons: string[];
  warning_reasons: string[];
  next_recommended_slice: string;
}
