import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAcceptedSummary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewExplicitNonWriteBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewNonMutationSummary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewRowCountSummary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewSourceBindingSummary,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_KIND =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_VERSION =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record.v0.1" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_READBACK_KIND =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record_readback" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_READBACK_VERSION =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record_readback.v0.1" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE =
  "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records" as const;

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteStatus =
  | "written"
  | "duplicate_replayed"
  | "refused";

export type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadbackSelectionStatus =
  | "selected_latest_valid_record"
  | "source_entrypoint_review_fingerprint_not_found"
  | "no_records";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordInput {
  source_entrypoint_review:
    | ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview
    | null
    | undefined;
  candidate_input?: Record<string, unknown> | null;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountObservation {
  table_name: string;
  before_count: number;
  after_count: number;
  delta: number;
  changed: boolean;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountWriteSummary {
  target_table_name: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE;
  target_before_count: number;
  target_after_count: number;
  target_delta: number;
  target_table_changed: boolean;
  non_target_table_count: number;
  non_target_changed_table_count: number;
  all_non_target_row_counts_unchanged: boolean;
  rows: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountObservation[];
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteBoundary {
  can_write_no_mutation_result_record: true;
  target_table_name: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE;
  source_of_truth: false;
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

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordPersistedMaterialBoundary {
  persists_source_fingerprints: true;
  persists_row_count_proof: true;
  persists_non_mutation_proof: true;
  persists_raw_manual_note: false;
  persists_raw_result_report: false;
  persists_raw_operator_note: false;
  persists_raw_payload: false;
  persists_provider_payload: false;
  persists_secret_or_token: false;
  persists_url_or_env_value: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordValidation {
  passed: true;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  source_entrypoint_review_accepted: true;
  source_entrypoint_review_fingerprint: string;
  source_entrypoint_fingerprint: string;
  source_contract_fingerprint: string;
  source_review_fingerprint: string;
  source_dry_run_result_fingerprint: string;
  source_writer_compatibility_refs_present: true;
  accepted_entrypoint_summary_present: true;
  row_counts_unchanged: true;
  changed_protected_table_count: 0;
  non_mutation_summary_all_false: true;
  explicit_non_write_boundary_all_false: true;
  target_only_write_proven: true;
  raw_material_absent: true;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord {
  record_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_KIND;
  record_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_VERSION;
  record_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_entrypoint_review_fingerprint: string;
  source_entrypoint_fingerprint: string;
  source_contract_fingerprint: string;
  source_review_fingerprint: string;
  source_dry_run_result_fingerprint: string;
  source_perspective_writer_compatibility_receipt_id: string;
  source_perspective_writer_compatibility_record_id: string;
  source_perspective_writer_compatibility_record_fingerprint: string;
  safe_adapter_target: string;
  idempotency_key: string;
  accepted_entrypoint_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointAcceptedSummary;
  source_row_count_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewRowCountSummary;
  source_non_mutation_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewNonMutationSummary;
  source_binding_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewSourceBindingSummary;
  source_explicit_non_write_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewExplicitNonWriteBoundary;
  result_record_write_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteBoundary;
  row_count_write_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountWriteSummary;
  persisted_material_boundary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordPersistedMaterialBoundary;
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordValidation;
  record_fingerprint: string;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteResult {
  ok: boolean;
  result_status: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteStatus;
  refusal_reasons: string[];
  record: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord | null;
  duplicate_replayed: boolean;
  result_record_written: boolean;
  row_count_write_summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountWriteSummary | null;
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
  provider_openai_called: false;
  github_called: false;
  codex_executed: false;
  sources_fetched: false;
  retrieval_rag_embeddings_vector_fts_or_crawler_run: false;
  raw_material_persisted: false;
}

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadback {
  readback_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_READBACK_KIND;
  readback_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_READBACK_VERSION;
  scope: ResearchCandidateReviewScope;
  source_entrypoint_review_fingerprint_filter: string | null;
  selection_status: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadbackSelectionStatus;
  selected_record: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord | null;
  records: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord[];
  invalid_record_count: number;
  raw_material_persisted: false;
  existing_writer_called: false;
  current_working_perspective_updated: false;
  existing_canonical_perspective_state_table_mutated: false;
  perspective_memory_written: false;
  work_mutated: false;
  proof_or_evidence_written: false;
  dogfood_metrics_written: false;
  provider_openai_called: false;
  github_called: false;
  codex_executed: false;
  sources_fetched: false;
  retrieval_rag_embeddings_vector_fts_or_crawler_run: false;
}
