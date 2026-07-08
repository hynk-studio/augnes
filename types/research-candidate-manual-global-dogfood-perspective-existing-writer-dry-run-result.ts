import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_RESULT_KIND =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_dry_run_result" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_RESULT_VERSION =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_dry_run_result.v0.1" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES =
  [
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts",
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records",
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks",
    "research_candidate_manual_global_dogfood_perspective_state_application_receipts",
    "research_candidate_manual_global_dogfood_perspective_state_application_records",
    "research_candidate_manual_global_dogfood_perspective_state_application_rollbacks",
    "research_candidate_manual_global_dogfood_perspective_adapter_receipts",
    "research_candidate_manual_global_dogfood_perspective_adapter_records",
    "research_candidate_manual_global_dogfood_perspective_adapter_rollbacks",
    "research_candidate_manual_global_dogfood_perspective_state_mutation_receipts",
    "research_candidate_manual_global_dogfood_perspective_state_mutation_records",
    "research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks",
    "research_candidate_manual_global_dogfood_perspective_apply_receipts",
    "research_candidate_manual_global_dogfood_perspective_apply_records",
    "research_candidate_manual_global_dogfood_perspective_apply_rollbacks",
    "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    "research_candidate_manual_global_dogfood_canonical_perspective_update_records",
    "research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks",
    "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    "research_candidate_manual_global_dogfood_perspective_relay_records",
    "research_candidate_manual_global_dogfood_perspective_relay_rollbacks",
    "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    "research_candidate_manual_global_dogfood_next_work_signal_records",
    "research_candidate_manual_global_dogfood_next_work_signal_rollbacks",
    "research_candidate_manual_global_dogfood_next_work_bias_receipts",
    "research_candidate_manual_global_dogfood_next_work_bias_records",
    "research_candidate_manual_global_dogfood_next_work_bias_rollbacks",
    "research_candidate_manual_global_dogfood_metric_snapshot_records",
    "perspective_states",
    "perspective_promotion_decisions",
    "perspective_formation_receipts",
    "perspective_memory_items",
    "work_items",
    "work_events",
    "verification_evidence_records",
    "dogfood_metric_snapshot_records",
    "dogfooding_records",
    "dogfooding_signals",
    "dogfooding_review_cues",
    "delivery_ledger",
  ] as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunProtectedRowCountTable =
  (typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES)[number];

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultStatus =
  | "no_mutation_dry_run_passed"
  | "existing_writer_unsupported"
  | "blocked"
  | "source_contract_not_ready"
  | "source_review_not_accepted"
  | "source_chain_mismatch"
  | "raw_payload_refused"
  | "row_count_delta_detected";

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunSnapshotSource =
  | "provided_before_after"
  | "default_empty_in_memory_noop";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunEntrypointStatus {
  detected: boolean;
  entrypoint_id?: string | null;
  supports_row_count_snapshot?: boolean;
  supports_transaction_rollback?: boolean;
  supports_no_mutation_assertions?: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultInput {
  existing_writer_dry_run_contract:
    | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract
    | null
    | undefined;
  existing_writer_dry_run_review:
    | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview
    | null
    | undefined;
  row_count_before?: Record<string, number> | null;
  row_count_after?: Record<string, number> | null;
  candidate_input?: Record<string, unknown> | null;
  safe_existing_writer_no_mutation_entrypoint?: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunEntrypointStatus | null;
  safe_existing_writer_no_mutation_entrypoint_result?: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult | null;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunSourceBinding {
  source_contract_fingerprint: string | null;
  source_review_fingerprint: string | null;
  accepted_mapping_summary_present: boolean;
  accepted_mapping_contract_fingerprint: string | null;
  source_perspective_writer_compatibility_receipt_id: string | null;
  source_perspective_writer_compatibility_record_id: string | null;
  source_perspective_writer_compatibility_record_fingerprint: string | null;
  accepted_perspective_writer_compatibility_receipt_id: string | null;
  accepted_perspective_writer_compatibility_record_id: string | null;
  accepted_perspective_writer_compatibility_record_fingerprint: string | null;
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  proposed_idempotency_key: string | null;
  accepted_proposed_idempotency_key: string | null;
  intended_future_dry_run_target: string | null;
  accepted_future_dry_run_target: string | null;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunInputValidation {
  passed: boolean;
  result_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  source_contract_present: boolean;
  source_review_present: boolean;
  source_contract_ready: boolean;
  source_review_accepted: boolean;
  source_contract_fingerprint_matches_review: boolean;
  accepted_mapping_summary_matches_contract: boolean;
  direct_existing_writer_target_requested: boolean;
  direct_existing_writer_target_refused: boolean;
  raw_payload_absent: boolean;
  raw_payload_forbidden_fields: string[];
  row_count_snapshots_present: boolean;
  protected_row_counts_unchanged: boolean;
  safe_existing_writer_no_mutation_entrypoint_result_present: boolean;
  safe_existing_writer_no_mutation_entrypoint_result_validated: boolean;
  safe_existing_writer_no_mutation_entrypoint_result_available: boolean;
  safe_existing_writer_no_mutation_entrypoint_result_fingerprint: string | null;
  safe_existing_writer_no_mutation_entrypoint_result_status: string | null;
  safe_existing_writer_no_mutation_entrypoint_detected: boolean;
  existing_current_working_writer_dry_run_entrypoint_detected: boolean;
  existing_canonical_state_writer_dry_run_entrypoint_detected: boolean;
  existing_writer_supported_today: boolean;
  existing_writer_called: false;
  existing_writer_call_faked: false;
  no_write_authority: true;
  no_existing_writer_authority: true;
  no_provider_github_codex_retrieval_authority: true;
  failure_reasons: string[];
  warning_reasons: string[];
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunExecutionDecision {
  adapter_runnable_today: boolean;
  existing_writer_support_status:
    | "supported_no_mutation_entrypoint_available"
    | "unsupported_no_safe_entrypoint"
    | "blocked_input_validation";
  existing_writer_called: false;
  existing_writer_skipped: true;
  skip_reason: string;
  runnable_today_blockers: string[];
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunRowCountObservation {
  table_name: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunProtectedRowCountTable;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunNonMutationProof {
  proof_kind: "manual_global_dogfood_perspective_existing_writer_no_mutation_dry_run_proof";
  snapshot_source: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunSnapshotSource;
  protected_table_row_counts: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunRowCountObservation[];
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
  perspective_writer_compatibility_record_mutated: false;
  perspective_state_application_record_mutated: false;
  perspective_adapter_record_mutated: false;
  perspective_state_mutation_record_mutated: false;
  perspective_apply_record_mutated: false;
  canonical_perspective_update_record_mutated: false;
  perspective_relay_mutated: false;
  next_work_bias_mutated: false;
  work_item_written: false;
  work_mutated: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_written: false;
  metric_snapshot_written: false;
  next_work_signal_decision_written: false;
  proof_or_evidence_written: false;
  manual_result_records_written: false;
  manual_result_records_mutated: false;
  product_write_executed: false;
  api_write_route_added: false;
  dry_run_api_route_added: false;
  db_schema_or_migration_added: false;
  provider_openai_called: false;
  github_called: false;
  codex_executed: false;
  sources_fetched: false;
  retrieval_rag_embeddings_vector_fts_or_crawler_run: false;
  operator_note_persisted: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorityBoundary {
  preview_only: true;
  read_only: true;
  source_of_truth: false;
  can_write_existing_writer_dry_run_result_record: false;
  can_run_existing_writer_dry_run: false;
  can_call_existing_current_working_writer: false;
  can_call_existing_canonical_state_writer: false;
  can_update_current_working_perspective: false;
  can_mutate_existing_canonical_perspective_state: false;
  can_write_existing_canonical_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_mutate_perspective_writer_compatibility_record: false;
  can_mutate_perspective_state_application_record: false;
  can_mutate_perspective_adapter_record: false;
  can_mutate_perspective_state_mutation_record: false;
  can_mutate_perspective_apply_record: false;
  can_mutate_canonical_perspective_update_record: false;
  can_mutate_perspective_relay: false;
  can_mutate_next_work_bias: false;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult {
  result_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_RESULT_KIND;
  result_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_RESULT_VERSION;
  scope: ResearchCandidateReviewScope;
  result_status: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultStatus;
  source_binding: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunSourceBinding;
  execution_decision: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunExecutionDecision;
  non_mutation_proof: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunNonMutationProof;
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunInputValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunAuthorityBoundary;
  blocker_reasons: string[];
  warning_reasons: string[];
  next_recommended_slice: string;
}
