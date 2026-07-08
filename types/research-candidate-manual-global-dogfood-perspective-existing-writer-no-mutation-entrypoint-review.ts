import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_REVIEW_KIND =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint_review" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_REVIEW_VERSION =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_entrypoint_review.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewDecision =
  | "accept_entrypoint_for_future_result_record_planning"
  | "defer_entrypoint_review"
  | "reject_entrypoint_review";

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewStatus =
  | "ready_for_future_no_mutation_result_record_planning"
  | "blocked"
  | "source_entrypoint_missing"
  | "source_entrypoint_not_ready"
  | "source_entrypoint_not_safe"
  | "source_entrypoint_row_count_delta"
  | "source_entrypoint_lineage_mismatch"
  | "operator_decision_missing"
  | "operator_decision_deferred"
  | "operator_decision_rejected";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewInput {
  source_entrypoint_result:
    | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult
    | null
    | undefined;
  operator_decision?:
    | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewDecision
    | null;
  requested_operator_ref?: string | null;
  requested_idempotency_key?: string | null;
  review_confirmation_ref?: string | null;
  operator_note?: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceWriterCompatibilityRefs {
  source_perspective_writer_compatibility_receipt_id: string | null;
  source_perspective_writer_compatibility_record_id: string | null;
  source_perspective_writer_compatibility_record_fingerprint: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewRowCountSummary {
  protected_table_count: number;
  changed_protected_table_count: number;
  all_protected_row_counts_unchanged: boolean;
  row_count_before_after_snapshot_recorded: boolean;
  rows: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult["non_mutation_assertions"]["protected_table_row_counts"];
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewNonMutationSummary {
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewSourceBindingSummary {
  source_entrypoint_fingerprint: string | null;
  source_entrypoint_status: string | null;
  source_contract_fingerprint: string | null;
  source_review_fingerprint: string | null;
  source_dry_run_result_fingerprint: string | null;
  safe_adapter_target: string | null;
  accepted_mapping_summary_present: boolean;
  source_writer_compatibility_refs: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceWriterCompatibilityRefs;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAcceptedSummary {
  source_entrypoint_fingerprint: string;
  source_entrypoint_status: "safe_no_mutation_entrypoint_available";
  source_contract_fingerprint: string;
  source_review_fingerprint: string;
  source_dry_run_result_fingerprint: string;
  source_writer_compatibility_refs: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceWriterCompatibilityRefs;
  safe_adapter_target: string;
  row_count_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewRowCountSummary;
  non_mutation_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewNonMutationSummary;
  source_binding_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewSourceBindingSummary;
  future_planning_scope: "future_explicit_no_mutation_result_record_planning_only";
  writes_now: false;
  existing_writer_called: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewAuthorityBoundary {
  preview_only: true;
  read_only: true;
  source_of_truth: false;
  can_write_no_mutation_result_record: false;
  can_write_review_record: false;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewExplicitNonWriteBoundary {
  durable_review_record_written: false;
  no_mutation_result_record_written: false;
  existing_writer_called: false;
  existing_current_working_writer_called: false;
  existing_canonical_state_writer_called: false;
  current_working_perspective_updated: false;
  existing_canonical_perspective_state_table_mutated: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  work_mutated: false;
  proof_or_evidence_written: false;
  dogfood_metrics_written: false;
  product_or_delivery_record_written: false;
  source_record_mutated: false;
  provider_openai_called: false;
  github_called: false;
  codex_executed: false;
  sources_fetched: false;
  retrieval_rag_embeddings_vector_fts_or_crawler_run: false;
  raw_manual_note_result_or_operator_note_persisted: false;
  action_button_added: false;
  server_action_added: false;
  browser_or_network_call_added: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewValidation {
  passed: boolean;
  review_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  source_entrypoint_present: boolean;
  source_entrypoint_ready: boolean;
  source_entrypoint_safe: boolean;
  source_entrypoint_lineage_complete: boolean;
  source_entrypoint_row_counts_unchanged: boolean;
  operator_decision_present: boolean;
  operator_accepts_safe_entrypoint: boolean;
  no_write_authority: true;
  no_existing_writer_authority: true;
  no_provider_github_codex_retrieval_authority: true;
  blocker_count: number;
  warning_count: number;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview {
  review_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_REVIEW_KIND;
  review_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_ENTRYPOINT_REVIEW_VERSION;
  scope: ResearchCandidateReviewScope;
  review_status: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewStatus;
  operator_decision: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewDecision | null;
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_confirmation_ref: string | null;
  source_entrypoint_fingerprint: string | null;
  source_entrypoint_status: string | null;
  source_contract_fingerprint: string | null;
  source_review_fingerprint: string | null;
  source_dry_run_result_fingerprint: string | null;
  source_writer_compatibility_refs: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointSourceWriterCompatibilityRefs;
  safe_adapter_target: string | null;
  row_count_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewRowCountSummary;
  non_mutation_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewNonMutationSummary;
  source_binding_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewSourceBindingSummary;
  blocker_reasons: string[];
  warning_reasons: string[];
  accepted_entrypoint_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAcceptedSummary | null;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewAuthorityBoundary;
  explicit_non_write_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewExplicitNonWriteBoundary;
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewValidation;
}
