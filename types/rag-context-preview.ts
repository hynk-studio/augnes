// Type-only contract for RAG Context Preview v0.1.
// This file defines preview-only, provider-free, non-authoritative context
// packet shapes. It does not generate answers, send prompts, call providers,
// fetch sources, read files, query/write DB, create proof/evidence, promote
// Perspective, export Git Ledger packets, write products, or allocate product IDs.

export type RagContextPreviewVersion = "rag_context_preview.v0.1";

export type RagContextPreviewScope = "project:augnes";

export type RagContextPreviewStatus =
  | "preview_only"
  | "blocked_private_or_raw_payload"
  | "blocked_missing_context"
  | "blocked_unsupported_input"
  | "rejected";

export type RagContextPreviewInputVersion = "rag_context_preview_input.v0.1";

export type RagContextPreviewContextItemVersion =
  "rag_context_preview_context_item.v0.1";

export type RagContextPreviewEnvelopeVersion =
  "rag_context_preview_envelope.v0.1";

export type RagContextPreviewBundleVersion =
  "rag_context_preview_bundle.v0.1";

export type RagContextInputKind =
  | "retrieval_search_result"
  | "retrieval_search_hit"
  | "source_ref_candidate"
  | "candidate_summary"
  | "review_memory_summary"
  | "perspective_delta_summary"
  | "formation_receipt_summary"
  | "feedback_summary"
  | "manual_bounded_context"
  | "unknown";

export type RagContextItemKind =
  | "included_source_ref"
  | "included_candidate_summary"
  | "included_review_memory_summary"
  | "included_durable_summary"
  | "included_feedback_summary"
  | "included_gap_context"
  | "included_tension_context"
  | "excluded_context"
  | "unknown";

export type RagContextLayer =
  | "candidate"
  | "durable"
  | "review_memory"
  | "feedback"
  | "source_ref"
  | "manual"
  | "unknown";

export type RagContextInclusionStatus =
  | "included"
  | "excluded_missing_source_ref"
  | "excluded_private_or_raw_payload"
  | "excluded_stale_without_warning"
  | "excluded_duplicate"
  | "excluded_unsupported_kind"
  | "excluded_empty_summary"
  | "needs_operator_review";

export type RagContextPreviewReasonCode =
  | "roadmap_file_present"
  | "retrieval_contract_present"
  | "retrieval_index_runtime_present"
  | "input_ref_present"
  | "input_ref_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "candidate_ref_present"
  | "review_memory_ref_present"
  | "durable_summary_ref_present"
  | "feedback_ref_present"
  | "bounded_summary_present"
  | "bounded_summary_missing"
  | "context_item_included"
  | "context_item_excluded"
  | "duplicate_context_excluded"
  | "stale_context_warning"
  | "unresolved_tension_preserved"
  | "knowledge_gap_preserved"
  | "candidate_layer_marked"
  | "durable_layer_marked"
  | "review_memory_layer_marked"
  | "feedback_layer_marked"
  | "source_ref_layer_marked"
  | "private_or_raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "local_path_blocked"
  | "private_url_blocked"
  | "raw_source_body_blocked"
  | "raw_provider_output_blocked"
  | "raw_retrieval_output_blocked"
  | "rag_answer_not_generated"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "embedding_not_created"
  | "vector_search_not_executed"
  | "source_fetch_not_executed"
  | "file_read_not_executed"
  | "db_query_not_executed"
  | "db_write_not_executed"
  | "proof_not_created"
  | "evidence_not_created"
  | "promotion_not_executed"
  | "product_write_denied"
  | "git_ledger_export_not_executed";

export interface RagContextPreviewAuthorityBoundary {
  preview_only: true;
  rag_context_preview_now: true;
  rag_answer_generation_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  semantic_embedding_search_now: false;
  external_retrieval_provider_now: false;
  source_fetch_now: false;
  crawler_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  raw_source_body_storage_now: false;
  raw_provider_output_storage_now: false;
  raw_retrieval_output_storage_now: false;
  db_query_or_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  perspective_promotion_now: false;
  durable_perspective_state_now: false;
  work_mutation_now: false;
  git_ledger_export_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  source_of_truth: false;
  rag_answer_is_truth: false;
  context_item_is_evidence: false;
  retrieval_score_is_truth_score: false;
  retrieval_score_is_promotion_readiness: false;
}

export interface RagContextPreviewInputRef {
  input_kind: RagContextInputKind;
  input_ref: string;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  candidate_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  retrieval_score_hint: number;
  retrieval_score_band: "none" | "low" | "medium" | "high";
  freshness_status: "fresh" | "stale" | "unknown";
  public_safe: boolean;
  layer: RagContextLayer;
  reason_codes: RagContextPreviewReasonCode[];
}

export interface RagContextPreviewInput {
  input_version: RagContextPreviewInputVersion;
  scope: RagContextPreviewScope;
  preview_id: string;
  requested_at: string;
  requested_by_surface:
    | "operator"
    | "rebuildable_retrieval_index_runtime"
    | "review_memory_ui"
    | "foundation_lifecycle_review_memory_readonly_ui"
    | "roadmap_guided_codex_slice"
    | "unknown";
  roadmap_ref: "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
  retrieval_contract_ref: "types/research-retrieval-runtime-contract.ts";
  retrieval_index_runtime_ref: "lib/research-retrieval/search-index.ts";
  bounded_query_summary: string;
  max_context_items: number;
  max_summary_chars: number;
  input_refs: RagContextPreviewInputRef[];
  unresolved_tension_refs: string[];
  knowledge_gap_refs: string[];
  boundary_notes: string[];
  reason_codes: RagContextPreviewReasonCode[];
  authority_boundary: RagContextPreviewAuthorityBoundary;
}

export interface RagContextPreviewContextItem {
  item_version: RagContextPreviewContextItemVersion;
  scope: RagContextPreviewScope;
  item_id: string;
  item_kind: RagContextItemKind;
  input_ref: string;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  candidate_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  layer: RagContextLayer;
  inclusion_status: RagContextInclusionStatus;
  retrieval_score_hint: number;
  retrieval_score_band: "none" | "low" | "medium" | "high";
  stale_warning: boolean;
  unresolved_tension_refs: string[];
  knowledge_gap_refs: string[];
  context_item_is_evidence: false;
  retrieval_score_is_truth_score: false;
  retrieval_score_is_promotion_readiness: false;
  reason_codes: RagContextPreviewReasonCode[];
}

export interface RagContextPreviewEnvelope {
  envelope_version: RagContextPreviewEnvelopeVersion;
  preview_version: RagContextPreviewVersion;
  scope: RagContextPreviewScope;
  preview_id: string;
  status: RagContextPreviewStatus;
  bounded_query_summary: string;
  included_context_items: RagContextPreviewContextItem[];
  excluded_context_items: RagContextPreviewContextItem[];
  source_refs: string[];
  candidate_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  unresolved_tension_refs: string[];
  knowledge_gap_refs: string[];
  staleness_warnings: string[];
  boundary_notes: string[];
  rag_answer_generated: false;
  provider_call_executed: false;
  prompt_sent: false;
  embedding_created: false;
  vector_search_executed: false;
  source_fetch_executed: false;
  file_read_executed: false;
  db_query_executed: false;
  proof_or_evidence_created: false;
  perspective_promoted: false;
  product_write_executed: false;
  reason_codes: RagContextPreviewReasonCode[];
  authority_boundary: RagContextPreviewAuthorityBoundary;
  preview_fingerprint: string;
}

export interface RagContextPreviewBundle {
  bundle_version: RagContextPreviewBundleVersion;
  preview_version: RagContextPreviewVersion;
  scope: RagContextPreviewScope;
  as_of: string;
  roadmap_ref: "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
  source_fixture_refs: string[];
  inputs: RagContextPreviewInput[];
  envelopes: RagContextPreviewEnvelope[];
  item_kind_counts: Record<RagContextItemKind, number>;
  layer_counts: Record<RagContextLayer, number>;
  inclusion_status_counts: Record<RagContextInclusionStatus, number>;
  boundary_notes: string[];
  reason_codes: RagContextPreviewReasonCode[];
  authority_boundary: RagContextPreviewAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface RagContextPreviewValidationResult {
  passed: boolean;
  failure_codes: string[];
}
