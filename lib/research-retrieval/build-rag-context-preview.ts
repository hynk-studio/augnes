import { createHash } from "node:crypto";

import {
  isSafeResearchRetrievalDbPathV01,
  type ResearchRetrievalIndexDbLikeV01,
// @ts-ignore Direct Node smoke imports TS modules and requires explicit extension.
} from "./index-store.ts";
import {
  RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01,
  searchResearchRetrievalIndexV01,
  type ResearchRetrievalIndexSearchInputV01,
  type ResearchRetrievalIndexSearchResultItemV01,
  type ResearchRetrievalIndexSearchRuntimeResultV01,
// @ts-ignore Direct Node smoke imports TS modules and requires explicit extension.
} from "./search-index.ts";
import type {
  RagContextInclusionStatus,
  RagContextInputKind,
  RagContextItemKind,
  RagContextLayer,
  RagContextPreviewAuthorityBoundary,
  RagContextPreviewBundle,
  RagContextPreviewContextItem,
  RagContextPreviewEnvelope,
  RagContextPreviewInput,
  RagContextPreviewInputRef,
  RagContextPreviewReasonCode,
  RagContextPreviewStatus,
  RagContextPreviewValidationResult,
} from "@/types/rag-context-preview";

const previewVersion = "rag_context_preview.v0.1" as const;
const inputVersion = "rag_context_preview_input.v0.1" as const;
const itemVersion = "rag_context_preview_context_item.v0.1" as const;
const envelopeVersion = "rag_context_preview_envelope.v0.1" as const;
const scope = "project:augnes" as const;
const roadmapRef =
  "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md" as const;
const retrievalContractRef = "types/research-retrieval-runtime-contract.ts" as const;
const retrievalIndexRuntimeRef = "lib/research-retrieval/search-index.ts" as const;
const blockedBoundedQuerySummary =
  "blocked bounded query summary redacted by RAG context preview" as const;
const blockedPreviewId = "blocked-rag-context-preview-id" as const;
const blockedContextInputTitle = "Blocked RAG context input" as const;
const blockedContextInputSummary = "blocked RAG context payload redacted by preview" as const;
export const RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_PREVIEW_VERSION_V01 =
  "rag_context_preview_runtime_completion.v0.1" as const;
export const RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_REQUEST_VERSION_V01 =
  "rag_context_preview_runtime_completion_request.v0.1" as const;
export const RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_RESULT_VERSION_V01 =
  "rag_context_preview_runtime_completion_result.v0.1" as const;

const inputKinds: RagContextInputKind[] = [
  "retrieval_search_result",
  "retrieval_search_hit",
  "source_ref_candidate",
  "candidate_summary",
  "review_memory_summary",
  "perspective_delta_summary",
  "formation_receipt_summary",
  "feedback_summary",
  "manual_bounded_context",
  "unknown",
];

const itemKinds: RagContextItemKind[] = [
  "included_source_ref",
  "included_candidate_summary",
  "included_review_memory_summary",
  "included_durable_summary",
  "included_feedback_summary",
  "included_gap_context",
  "included_tension_context",
  "excluded_context",
  "unknown",
];

const layers: RagContextLayer[] = [
  "candidate",
  "durable",
  "review_memory",
  "feedback",
  "source_ref",
  "manual",
  "unknown",
];

const inclusionStatuses: RagContextInclusionStatus[] = [
  "included",
  "excluded_missing_source_ref",
  "excluded_private_or_raw_payload",
  "excluded_stale_without_warning",
  "excluded_duplicate",
  "excluded_unsupported_kind",
  "excluded_empty_summary",
  "needs_operator_review",
];

const forbiddenTextMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "raw provider output",
  "raw retrieval output",
  "raw conversation",
  "hidden reasoning",
  "raw DB row",
  "raw_db_row",
  "browser dump",
  "raw browser dump",
  "raw source body",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
  "raw RAG context payload blocked by preview fixture",
  "secret-like RAG context input blocked by preview fixture",
];

const runtimeCompletionForbiddenTextMarkers = [
  ...forbiddenTextMarkers,
  "SAFE_MARKER_PRIVATE_URL",
  "SAFE_MARKER_LOCAL_PRIVATE_PATH",
  "SAFE_MARKER_SECRET_TOKEN",
  "SAFE_MARKER_RAW_SOURCE_BODY",
  "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
  "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
  "SAFE_MARKER_PROVIDER_THREAD_ID",
  "SAFE_MARKER_RAW_CONVERSATION",
  "SAFE_MARKER_HIDDEN_REASONING",
  "SAFE_MARKER_RAW_DB_ROW",
  "SAFE_MARKER_RAW_DIFF",
  "SAFE_MARKER_TELEMETRY_DUMP",
  "actual source body",
  "actual provider response",
  "actual retrieval output",
  "chain-of-thought",
  "localhost/",
  "127.0.0.1",
];

const runtimeCompletionForbiddenAuthorityFields = [
  "rag_answer_generation_now",
  "final_answer_generation_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "live_crawling_now",
  "embedding_created_now",
  "vector_search_now",
  "retrieval_index_write_now",
  "db_write_now",
  "raw_source_body_included_now",
  "raw_provider_output_included_now",
  "raw_retrieval_output_stored_now",
  "hidden_reasoning_stored_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "candidate_mutation_now",
  "review_memory_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "rag_context_is_truth",
  "rag_context_is_proof",
  "rag_context_is_accepted_evidence",
  "rag_context_is_promotion_readiness",
  "retrieval_result_is_evidence",
  "retrieval_score_is_truth",
  "retrieval_score_is_promotion_readiness",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const runtimeCompletionAllowedAuthorityFields = [
  "rag_context_preview_runtime_now",
  "db_backed_retrieval_search_now",
  "explicit_operator_preview_only",
  "same_origin_post_route_now",
  "read_only_db_search_now",
  "context_preview_created_now",
  "candidate_vs_durable_markers_visible",
  "staleness_warnings_visible",
  "unresolved_tension_markers_visible",
  "knowledge_gap_markers_visible",
];

const runtimeCompletionAuthorityLikeKeyPatterns = [
  "_authority",
  "_write_now",
  "_call_now",
  "_execution_now",
  "_generation_now",
  "_is_truth",
  "_is_proof",
  "_is_accepted_evidence",
  "_is_promotion_readiness",
  "product_write",
  "product_id_allocation",
  "proof_or_evidence",
  "claim_or_evidence",
  "candidate_mutation",
  "review_memory_write",
  "promotion_execution",
  "durable_state_apply",
  "formation_receipt_write",
  "github_api_call",
  "git_write",
];

const baseReasonCodes: RagContextPreviewReasonCode[] = [
  "roadmap_file_present",
  "retrieval_contract_present",
  "retrieval_index_runtime_present",
  "rag_answer_not_generated",
  "provider_call_not_executed",
  "prompt_not_sent",
  "embedding_not_created",
  "vector_search_not_executed",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_query_not_executed",
  "db_write_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "product_write_denied",
  "git_ledger_export_not_executed",
];

const layerReasonCodes: Record<RagContextLayer, RagContextPreviewReasonCode[]> = {
  candidate: ["candidate_layer_marked"],
  durable: ["durable_layer_marked"],
  review_memory: ["review_memory_layer_marked"],
  feedback: ["feedback_layer_marked"],
  source_ref: ["source_ref_layer_marked"],
  manual: [],
  unknown: [],
};

const layerSortOrder: Record<RagContextLayer, number> = {
  source_ref: 0,
  candidate: 1,
  review_memory: 2,
  durable: 3,
  feedback: 4,
  manual: 5,
  unknown: 6,
};

const inclusionSortOrder: Record<RagContextInclusionStatus, number> = {
  included: 0,
  needs_operator_review: 1,
  excluded_private_or_raw_payload: 2,
  excluded_missing_source_ref: 3,
  excluded_stale_without_warning: 4,
  excluded_duplicate: 5,
  excluded_unsupported_kind: 6,
  excluded_empty_summary: 7,
};

export type RagContextPreviewRuntimeCompletionStatusV01 =
  | "context_preview_created"
  | "no_retrieval_results"
  | "db_missing"
  | "schema_missing"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "rejected";

export type RagContextPreviewRuntimeCandidateOrDurableMarkerV01 =
  | "candidate_context"
  | "review_memory_context"
  | "durable_state_context"
  | "promotion_context"
  | "formation_receipt_context"
  | "feedback_context"
  | "source_context"
  | "provider_candidate_context"
  | "unknown_context";

export type RagContextPreviewRuntimeExclusionReasonV01 =
  | "stale_excluded"
  | "max_context_items_exceeded"
  | "max_context_chars_exceeded"
  | "missing_source_ref"
  | "private_or_raw_payload_blocked"
  | "unsupported_surface"
  | "duplicate_backref"
  | "not_public_safe"
  | "search_result_not_relevant";

export interface RagContextPreviewRuntimeAuthorityBoundaryV01 {
  rag_context_preview_runtime_now: true;
  db_backed_retrieval_search_now: true;
  explicit_operator_preview_only: true;
  same_origin_post_route_now: true;
  read_only_db_search_now: true;
  context_preview_created_now: true;
  candidate_vs_durable_markers_visible: true;
  staleness_warnings_visible: true;
  unresolved_tension_markers_visible: true;
  knowledge_gap_markers_visible: true;
  rag_answer_generation_now: false;
  final_answer_generation_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  live_crawling_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  retrieval_index_write_now: false;
  db_write_now: false;
  raw_source_body_included_now: false;
  raw_provider_output_included_now: false;
  raw_retrieval_output_stored_now: false;
  hidden_reasoning_stored_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  candidate_mutation_now: false;
  review_memory_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  rag_context_is_truth: false;
  rag_context_is_proof: false;
  rag_context_is_accepted_evidence: false;
  rag_context_is_promotion_readiness: false;
  retrieval_result_is_evidence: false;
  retrieval_score_is_truth: false;
  retrieval_score_is_promotion_readiness: false;
  source_ref_is_proof: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface RagContextPreviewRuntimeRequestV01 {
  request_version: typeof RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_REQUEST_VERSION_V01;
  preview_version: typeof RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_PREVIEW_VERSION_V01;
  search_version: typeof RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01;
  scope: typeof scope;
  preview_request_id: string;
  requested_by: string;
  requested_at: string;
  db_path: string;
  query: string;
  search_filters?: ResearchRetrievalIndexSearchInputV01["filters"];
  include_stale?: boolean;
  max_search_results: number;
  max_context_items: number;
  max_context_chars: number;
  include_candidate_context: boolean;
  include_durable_context: boolean;
  include_tension_markers: boolean;
  include_gap_markers: boolean;
  authority_boundary?: Record<string, unknown>;
  reason_codes: string[];
}

export interface RagContextPreviewRuntimeContextItemV01 {
  context_ref: string;
  source_result_ref: string;
  index_entry_id: string;
  source_surface: string;
  source_record_ref: string;
  source_ref_id: string | null;
  candidate_ref: string | null;
  review_record_ref: string | null;
  promotion_decision_ref: string | null;
  formation_receipt_ref: string | null;
  perspective_id: string | null;
  feedback_ref: string | null;
  provider_extraction_ref: string | null;
  bounded_source_intake_ref: string | null;
  bounded_title: string;
  bounded_context_summary: string;
  inclusion_reason_codes: string[];
  stale_marker: "fresh" | "stale" | "unknown";
  candidate_or_durable_marker: RagContextPreviewRuntimeCandidateOrDurableMarkerV01;
  retrieval_score: number;
  retrieval_score_is_truth: false;
  retrieval_score_is_promotion_readiness: false;
  retrieval_result_is_evidence: false;
  source_refs_are_lineage: true;
  authority_boundary: RagContextPreviewRuntimeAuthorityBoundaryV01;
}

export interface RagContextPreviewRuntimeExcludedContextV01 {
  source_result_ref: string;
  index_entry_id: string;
  source_surface: string;
  source_record_ref: string;
  exclusion_reason: RagContextPreviewRuntimeExclusionReasonV01;
  bounded_title: string;
  reason_codes: string[];
}

export interface RagContextPreviewRuntimeResultV01 {
  result_version: typeof RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_RESULT_VERSION_V01;
  preview_version: typeof RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_PREVIEW_VERSION_V01;
  scope: typeof scope;
  status: RagContextPreviewRuntimeCompletionStatusV01;
  preview_request_id: string;
  query_ref: string;
  search_request_ref: string;
  search_status: string;
  retrieved_refs: string[];
  included_context_summaries: RagContextPreviewRuntimeContextItemV01[];
  excluded_context_reasons: RagContextPreviewRuntimeExcludedContextV01[];
  candidate_vs_durable_markers: Array<{
    context_ref: string;
    marker: RagContextPreviewRuntimeCandidateOrDurableMarkerV01;
    source_surface: string;
  }>;
  staleness_warnings: string[];
  unresolved_tensions: string[];
  knowledge_gaps: string[];
  context_char_count: number;
  context_item_count: number;
  retrieval_executed: boolean;
  rag_answer_generated: false;
  provider_call_executed: false;
  prompt_sent: false;
  source_fetch_executed: false;
  embedding_created: false;
  vector_search_executed: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  candidate_mutation_executed: false;
  promotion_executed: false;
  durable_state_written: false;
  formation_receipt_written: false;
  product_write_executed: false;
  product_id_allocated: false;
  authority_boundary: RagContextPreviewRuntimeAuthorityBoundaryV01;
  reason_codes: string[];
  failure_codes?: string[];
}

export interface RagContextPreviewRuntimeValidationResultV01 {
  passed: boolean;
  status: Exclude<
    RagContextPreviewRuntimeCompletionStatusV01,
    "context_preview_created" | "no_retrieval_results" | "db_missing" | "schema_missing"
  > | "valid";
  failure_codes: string[];
  reason_codes: string[];
  authority_boundary: RagContextPreviewRuntimeAuthorityBoundaryV01;
}

export function createRagContextPreviewAuthorityBoundaryV01(): RagContextPreviewAuthorityBoundary {
  return {
    preview_only: true,
    rag_context_preview_now: true,
    rag_answer_generation_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    embedding_created_now: false,
    vector_search_now: false,
    semantic_embedding_search_now: false,
    external_retrieval_provider_now: false,
    source_fetch_now: false,
    crawler_now: false,
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    raw_source_body_storage_now: false,
    raw_provider_output_storage_now: false,
    raw_retrieval_output_storage_now: false,
    db_query_or_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    perspective_promotion_now: false,
    durable_perspective_state_now: false,
    work_mutation_now: false,
    git_ledger_export_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    source_of_truth: false,
    rag_answer_is_truth: false,
    context_item_is_evidence: false,
    retrieval_score_is_truth_score: false,
    retrieval_score_is_promotion_readiness: false,
  };
}

export function createRagContextPreviewRuntimeCompletionAuthorityBoundaryV01(): RagContextPreviewRuntimeAuthorityBoundaryV01 {
  return {
    rag_context_preview_runtime_now: true,
    db_backed_retrieval_search_now: true,
    explicit_operator_preview_only: true,
    same_origin_post_route_now: true,
    read_only_db_search_now: true,
    context_preview_created_now: true,
    candidate_vs_durable_markers_visible: true,
    staleness_warnings_visible: true,
    unresolved_tension_markers_visible: true,
    knowledge_gap_markers_visible: true,
    rag_answer_generation_now: false,
    final_answer_generation_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    live_crawling_now: false,
    embedding_created_now: false,
    vector_search_now: false,
    retrieval_index_write_now: false,
    db_write_now: false,
    raw_source_body_included_now: false,
    raw_provider_output_included_now: false,
    raw_retrieval_output_stored_now: false,
    hidden_reasoning_stored_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    candidate_mutation_now: false,
    review_memory_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    local_file_export_now: false,
    local_file_import_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    rag_context_is_truth: false,
    rag_context_is_proof: false,
    rag_context_is_accepted_evidence: false,
    rag_context_is_promotion_readiness: false,
    retrieval_result_is_evidence: false,
    retrieval_score_is_truth: false,
    retrieval_score_is_promotion_readiness: false,
    source_ref_is_proof: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function validateRagContextPreviewRuntimeRequestV01(
  input: unknown,
): RagContextPreviewRuntimeValidationResultV01 {
  const authorityBoundary = createRagContextPreviewRuntimeCompletionAuthorityBoundaryV01();
  const failureCodes: string[] = [];
  const reasonCodes = [
    "rag_context_preview_runtime_completion",
    "db_backed_retrieval_search_now",
    "explicit_operator_preview_only",
    "context_preview_only",
    "rag_answer_not_generated",
    "final_answer_not_generated",
    "provider_call_not_executed",
    "prompt_not_sent",
    "source_fetch_not_executed",
    "embedding_not_created",
    "vector_search_not_executed",
    "retrieval_index_write_not_executed",
    "db_write_not_executed",
    "proof_not_created",
    "evidence_not_created",
    "candidate_mutation_not_executed",
    "review_memory_not_written",
    "promotion_not_executed",
    "product_write_denied",
  ];
  if (!isRecord(input)) {
    return {
      passed: false,
      status: "blocked_invalid_input",
      failure_codes: ["input_not_object"],
      reason_codes: uniqueSorted([...reasonCodes, "blocked_invalid_input"]),
      authority_boundary: authorityBoundary,
    };
  }
  if (input.request_version !== RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_REQUEST_VERSION_V01) {
    failureCodes.push("request_version_invalid");
  }
  if (input.preview_version !== RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_PREVIEW_VERSION_V01) {
    failureCodes.push("preview_version_invalid");
  }
  if (input.search_version !== RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01) {
    failureCodes.push("search_version_invalid");
  }
  if (input.scope !== scope) failureCodes.push("scope_invalid");
  if (!isNonEmptyString(input.preview_request_id)) failureCodes.push("preview_request_id_missing");
  if (!isNonEmptyString(input.requested_by)) failureCodes.push("requested_by_missing");
  if (!isNonEmptyString(input.requested_at)) failureCodes.push("requested_at_missing");
  if (!isNonEmptyString(input.db_path) || !isSafeResearchRetrievalDbPathV01(input.db_path)) {
    failureCodes.push("db_path_invalid");
  }
  if (!isNonEmptyString(input.query)) failureCodes.push("query_missing");
  if (typeof input.query === "string" && input.query.length > 300) failureCodes.push("query_too_large");
  for (const key of ["max_search_results", "max_context_items", "max_context_chars"]) {
    const value = input[key];
    if (!Number.isInteger(value) || Number(value) < 1) failureCodes.push(`${key}_invalid`);
  }
  if (Number(input.max_search_results) > 20) failureCodes.push("max_search_results_too_large");
  if (Number(input.max_context_items) > 12) failureCodes.push("max_context_items_too_large");
  if (Number(input.max_context_chars) > 4000) failureCodes.push("max_context_chars_too_large");
  for (const key of [
    "include_candidate_context",
    "include_durable_context",
    "include_tension_markers",
    "include_gap_markers",
  ]) {
    if (typeof input[key] !== "boolean") failureCodes.push(`${key}_invalid`);
  }
  if (input.search_filters !== undefined) {
    if (!isRecord(input.search_filters)) failureCodes.push("search_filters_invalid");
    else {
      for (const [key, value] of Object.entries(input.search_filters)) {
        if (value !== undefined && value !== null && typeof value !== "string") {
          failureCodes.push(`search_filter_${key}_invalid`);
        }
      }
    }
  }
  if (!Array.isArray(input.reason_codes)) failureCodes.push("reason_codes_invalid");
  if (containsUnsafeRuntimeCompletionValue(input)) failureCodes.push("private_or_raw_payload_present");
  if (containsForbiddenAuthorityGrantRuntimeCompletion(input)) {
    failureCodes.push("forbidden_authority_present");
  }
  const status = chooseRuntimeCompletionStatus(failureCodes);
  return {
    passed: failureCodes.length === 0,
    status: failureCodes.length === 0 ? "valid" : status,
    failure_codes: uniqueSorted(failureCodes),
    reason_codes: uniqueSorted([
      ...reasonCodes,
      ...(failureCodes.length === 0 ? ["preview_input_valid"] : [status]),
      ...(failureCodes.includes("private_or_raw_payload_present")
        ? ["private_or_raw_payload_blocked"]
        : []),
      ...(failureCodes.includes("forbidden_authority_present") ? ["forbidden_authority_blocked"] : []),
    ]),
    authority_boundary: authorityBoundary,
  };
}

export function buildRagContextPreviewRuntimeCompletionV01(
  input: RagContextPreviewRuntimeRequestV01,
  db: ResearchRetrievalIndexDbLikeV01,
): RagContextPreviewRuntimeResultV01 {
  const validation = validateRagContextPreviewRuntimeRequestV01(input);
  if (!validation.passed) {
    return createRuntimeCompletionResult({
      input,
      status: validation.status === "valid" ? "rejected" : validation.status,
      searchStatus: "not_executed",
      retrievedRefs: [],
      included: [],
      excluded: [],
      retrievalExecuted: false,
      reasonCodes: validation.reason_codes,
      failureCodes: validation.failure_codes,
    });
  }

  const searchInput: ResearchRetrievalIndexSearchInputV01 = {
    search_version: input.search_version,
    scope,
    search_request_id: `rag-context-search:${input.preview_request_id}`,
    requested_by: input.requested_by,
    requested_at: input.requested_at,
    db_path: input.db_path,
    query: input.query,
    filters: input.search_filters,
    limit: input.max_search_results,
    include_stale: input.include_stale === true,
    authority_boundary: {
      rebuildable_retrieval_index_runtime_now: true,
      explicit_operator_search_only: true,
      caller_injected_db_only: true,
      derived_index_search_now: true,
      retrieval_result_is_evidence: false,
      retrieval_score_is_truth: false,
      retrieval_score_is_promotion_readiness: false,
    },
    reason_codes: ["rag_context_preview_runtime_completion", "db_backed_retrieval_search_now"],
  };
  const searchResult = searchResearchRetrievalIndexV01(searchInput, db);
  return buildRagContextPreviewFromSearchResultsV01(input, searchResult);
}

export function buildRagContextPreviewFromSearchResultsV01(
  input: RagContextPreviewRuntimeRequestV01,
  searchResult: ResearchRetrievalIndexSearchRuntimeResultV01,
): RagContextPreviewRuntimeResultV01 {
  const validation = validateRagContextPreviewRuntimeRequestV01(input);
  if (!validation.passed) {
    return createRuntimeCompletionResult({
      input,
      status: validation.status === "valid" ? "rejected" : validation.status,
      searchStatus: "not_executed",
      retrievedRefs: [],
      included: [],
      excluded: [],
      retrievalExecuted: false,
      reasonCodes: validation.reason_codes,
      failureCodes: validation.failure_codes,
    });
  }
  if (searchResult.status === "schema_missing") {
    return createRuntimeCompletionResult({
      input,
      status: "schema_missing",
      searchStatus: searchResult.status,
      retrievedRefs: [],
      included: [],
      excluded: [],
      retrievalExecuted: false,
      reasonCodes: uniqueSorted([...validation.reason_codes, "schema_missing"]),
      failureCodes: ["schema_missing"],
    });
  }
  if (searchResult.status === "blocked_forbidden_authority") {
    return createRuntimeCompletionResult({
      input,
      status: "blocked_forbidden_authority",
      searchStatus: searchResult.status,
      retrievedRefs: [],
      included: [],
      excluded: [],
      retrievalExecuted: false,
      reasonCodes: uniqueSorted([...validation.reason_codes, "forbidden_authority_blocked"]),
      failureCodes: searchResult.failure_codes ?? ["forbidden_authority_present"],
    });
  }
  if (searchResult.status === "blocked_private_or_raw_payload") {
    return createRuntimeCompletionResult({
      input,
      status: "blocked_private_or_raw_payload",
      searchStatus: searchResult.status,
      retrievedRefs: [],
      included: [],
      excluded: [],
      retrievalExecuted: false,
      reasonCodes: uniqueSorted([...validation.reason_codes, "private_or_raw_payload_blocked"]),
      failureCodes: searchResult.failure_codes ?? ["private_or_raw_payload_present"],
    });
  }
  if (searchResult.status === "blocked_invalid_input" || searchResult.status === "rejected") {
    return createRuntimeCompletionResult({
      input,
      status: "blocked_invalid_input",
      searchStatus: searchResult.status,
      retrievedRefs: [],
      included: [],
      excluded: [],
      retrievalExecuted: false,
      reasonCodes: uniqueSorted([...validation.reason_codes, "blocked_invalid_input"]),
      failureCodes: searchResult.failure_codes ?? ["search_input_invalid"],
    });
  }
  if (searchResult.status === "not_found" || searchResult.results.length === 0) {
    return createRuntimeCompletionResult({
      input,
      status: "no_retrieval_results",
      searchStatus: searchResult.status,
      retrievedRefs: [],
      included: [],
      excluded: [],
      retrievalExecuted: searchResult.retrieval_executed,
      reasonCodes: uniqueSorted([...validation.reason_codes, "no_retrieval_results"]),
    });
  }

  const { included, excluded } = selectRuntimeContextItems(input, searchResult.results);
  return createRuntimeCompletionResult({
    input,
    status: included.length > 0 ? "context_preview_created" : "no_retrieval_results",
    searchStatus: searchResult.status,
    retrievedRefs: searchResult.results.map((result) => result.result_ref).sort(),
    included,
    excluded,
    retrievalExecuted: searchResult.retrieval_executed,
    reasonCodes: uniqueSorted([
      ...validation.reason_codes,
      ...searchResult.reason_codes,
      "context_preview_created",
      "retrieval_result_not_evidence",
      "retrieval_score_not_truth",
      "retrieval_score_not_promotion_readiness",
      "rag_context_not_truth",
      "rag_context_not_proof",
      "rag_context_not_promotion_readiness",
      ...(included.some((item) => item.stale_marker === "stale") ? ["staleness_warnings_visible"] : []),
      ...(included.some((item) => hasTensionMarker(item)) ? ["unresolved_tension_markers_visible"] : []),
      ...(included.some((item) => hasGapMarker(item)) ? ["knowledge_gap_markers_visible"] : []),
    ]),
  });
}

export function createRagContextPreviewRuntimeFingerprintV01(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalJson(value))).digest("hex");
}

function selectRuntimeContextItems(
  input: RagContextPreviewRuntimeRequestV01,
  results: ResearchRetrievalIndexSearchResultItemV01[],
): {
  included: RagContextPreviewRuntimeContextItemV01[];
  excluded: RagContextPreviewRuntimeExcludedContextV01[];
} {
  const included: RagContextPreviewRuntimeContextItemV01[] = [];
  const excluded: RagContextPreviewRuntimeExcludedContextV01[] = [];
  const seenBackrefs = new Set<string>();
  let charCount = 0;
  for (const result of results) {
    const exclusionReason = chooseRuntimeExclusionReason(input, result, seenBackrefs);
    if (exclusionReason) {
      excluded.push(createRuntimeExcludedContext(result, exclusionReason));
      continue;
    }
    const contextItem = createRuntimeContextItem(input, result);
    const nextCharCount = charCount + contextItem.bounded_context_summary.length;
    if (included.length >= input.max_context_items) {
      excluded.push(createRuntimeExcludedContext(result, "max_context_items_exceeded"));
      continue;
    }
    if (nextCharCount > input.max_context_chars) {
      excluded.push(createRuntimeExcludedContext(result, "max_context_chars_exceeded"));
      continue;
    }
    included.push(contextItem);
    charCount = nextCharCount;
    seenBackrefs.add(createRuntimeBackrefKey(result));
  }
  return { included, excluded };
}

function chooseRuntimeExclusionReason(
  input: RagContextPreviewRuntimeRequestV01,
  result: ResearchRetrievalIndexSearchResultItemV01,
  seenBackrefs: Set<string>,
): RagContextPreviewRuntimeExclusionReasonV01 | null {
  if (containsUnsafeRuntimeCompletionValue(result)) return "private_or_raw_payload_blocked";
  if (!isSupportedRuntimeSurface(result.source_surface)) return "unsupported_surface";
  if (!result.source_ref_id) return "missing_source_ref";
  if (result.stale_marker === "stale" && input.include_stale !== true) return "stale_excluded";
  const marker = mapRuntimeCandidateOrDurableMarker(result);
  if (!input.include_candidate_context && isCandidateRuntimeMarker(marker)) return "unsupported_surface";
  if (!input.include_durable_context && isDurableRuntimeMarker(marker)) return "unsupported_surface";
  if (seenBackrefs.has(createRuntimeBackrefKey(result))) return "duplicate_backref";
  if (result.score <= 0) return "search_result_not_relevant";
  return null;
}

function createRuntimeContextItem(
  input: RagContextPreviewRuntimeRequestV01,
  result: ResearchRetrievalIndexSearchResultItemV01,
): RagContextPreviewRuntimeContextItemV01 {
  const authorityBoundary = createRagContextPreviewRuntimeCompletionAuthorityBoundaryV01();
  const marker = mapRuntimeCandidateOrDurableMarker(result);
  const summary = truncateSummary(
    safeRuntimeOutputString(result.bounded_snippet, "blocked RAG context summary"),
    Math.min(input.max_context_chars, 800),
  );
  const contextWithoutRef = {
    preview_request_id: input.preview_request_id,
    result_ref: result.result_ref,
    index_entry_id: result.index_entry_id,
    marker,
  };
  return {
    context_ref: `rag-context-preview-runtime:${createRagContextPreviewRuntimeFingerprintV01(contextWithoutRef).slice(0, 24)}`,
    source_result_ref: result.result_ref,
    index_entry_id: result.index_entry_id,
    source_surface: result.source_surface,
    source_record_ref: result.source_record_ref,
    source_ref_id: result.source_ref_id,
    candidate_ref: result.candidate_ref,
    review_record_ref: result.review_record_ref,
    promotion_decision_ref: result.promotion_decision_ref,
    formation_receipt_ref: result.formation_receipt_ref,
    perspective_id: result.perspective_id,
    feedback_ref: result.feedback_ref,
    provider_extraction_ref: result.provider_extraction_ref,
    bounded_source_intake_ref: result.bounded_source_intake_ref,
    bounded_title: safeRuntimeOutputString(result.bounded_title, "Blocked RAG context title"),
    bounded_context_summary: summary,
    inclusion_reason_codes: uniqueSorted([
      "context_item_included",
      "source_ref_present",
      "retrieval_result_not_evidence",
      "retrieval_score_not_truth",
      "retrieval_score_not_promotion_readiness",
      "source_refs_are_lineage_not_proof",
      `${marker}_visible`,
      ...(result.stale_marker === "stale" ? ["stale_context_warning"] : []),
      ...(hasTensionSearchResult(result) && input.include_tension_markers ? ["unresolved_tension_preserved"] : []),
      ...(hasGapSearchResult(result) && input.include_gap_markers ? ["knowledge_gap_preserved"] : []),
    ]),
    stale_marker: result.stale_marker,
    candidate_or_durable_marker: marker,
    retrieval_score: result.score,
    retrieval_score_is_truth: false,
    retrieval_score_is_promotion_readiness: false,
    retrieval_result_is_evidence: false,
    source_refs_are_lineage: true,
    authority_boundary: authorityBoundary,
  };
}

function createRuntimeExcludedContext(
  result: ResearchRetrievalIndexSearchResultItemV01,
  exclusionReason: RagContextPreviewRuntimeExclusionReasonV01,
): RagContextPreviewRuntimeExcludedContextV01 {
  return {
    source_result_ref: result.result_ref,
    index_entry_id: result.index_entry_id,
    source_surface: result.source_surface,
    source_record_ref: safeRuntimeOutputString(result.source_record_ref, "blocked-source-record-ref"),
    exclusion_reason: exclusionReason,
    bounded_title: safeRuntimeOutputString(result.bounded_title, "Blocked RAG context title"),
    reason_codes: uniqueSorted([
      "context_item_excluded",
      exclusionReason,
      "retrieval_result_not_evidence",
      "retrieval_score_not_truth",
      "retrieval_score_not_promotion_readiness",
    ]),
  };
}

function createRuntimeCompletionResult(input: {
  input: RagContextPreviewRuntimeRequestV01;
  status: RagContextPreviewRuntimeCompletionStatusV01;
  searchStatus: string;
  retrievedRefs: string[];
  included: RagContextPreviewRuntimeContextItemV01[];
  excluded: RagContextPreviewRuntimeExcludedContextV01[];
  retrievalExecuted: boolean;
  reasonCodes: string[];
  failureCodes?: string[];
}): RagContextPreviewRuntimeResultV01 {
  const authorityBoundary = createRagContextPreviewRuntimeCompletionAuthorityBoundaryV01();
  const contextCharCount = input.included.reduce(
    (total, item) => total + item.bounded_context_summary.length,
    0,
  );
  return {
    result_version: RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_RESULT_VERSION_V01,
    preview_version: RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_PREVIEW_VERSION_V01,
    scope,
    status: input.status,
    preview_request_id:
      isRecord(input.input) && typeof input.input.preview_request_id === "string"
        ? safeRuntimeOutputString(input.input.preview_request_id, "blocked-preview-request-id")
        : "",
    query_ref: createRuntimeQueryRef(input.input?.query),
    search_request_ref:
      isRecord(input.input) && typeof input.input.preview_request_id === "string"
        ? `rag-context-search:${safeRuntimeOutputString(input.input.preview_request_id, "blocked-preview-request-id")}`
        : "",
    search_status: input.searchStatus,
    retrieved_refs: uniqueSorted(input.retrievedRefs.filter(isSafeRuntimeCompletionText)),
    included_context_summaries: input.included,
    excluded_context_reasons: input.excluded,
    candidate_vs_durable_markers: input.included.map((item) => ({
      context_ref: item.context_ref,
      marker: item.candidate_or_durable_marker,
      source_surface: item.source_surface,
    })),
    staleness_warnings: input.included
      .filter((item) => item.stale_marker === "stale")
      .map((item) => `stale context retained for review: ${item.context_ref}`)
      .sort(),
    unresolved_tensions: input.included
      .filter((item) => hasTensionMarker(item))
      .map((item) => `unresolved tension marker retained: ${item.context_ref}`)
      .sort(),
    knowledge_gaps: input.included
      .filter((item) => hasGapMarker(item))
      .map((item) => `knowledge gap marker retained: ${item.context_ref}`)
      .sort(),
    context_char_count: contextCharCount,
    context_item_count: input.included.length,
    retrieval_executed: input.retrievalExecuted,
    rag_answer_generated: false,
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    candidate_mutation_executed: false,
    promotion_executed: false,
    durable_state_written: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
    authority_boundary: authorityBoundary,
    reason_codes: uniqueSorted([
      ...input.reasonCodes,
      "rag_answer_not_generated",
      "final_answer_not_generated",
      "provider_call_not_executed",
      "prompt_not_sent",
      "source_fetch_not_executed",
      "embedding_not_created",
      "vector_search_not_executed",
      "retrieval_index_write_not_executed",
      "db_write_not_executed",
      "proof_not_created",
      "evidence_not_created",
      "candidate_mutation_not_executed",
      "review_memory_not_written",
      "promotion_not_executed",
      "product_write_denied",
    ]),
    ...(input.failureCodes ? { failure_codes: uniqueSorted(input.failureCodes) } : {}),
  };
}

function chooseRuntimeCompletionStatus(
  failureCodes: string[],
): Exclude<
  RagContextPreviewRuntimeCompletionStatusV01,
  "context_preview_created" | "no_retrieval_results" | "db_missing" | "schema_missing"
> {
  if (failureCodes.includes("forbidden_authority_present")) return "blocked_forbidden_authority";
  if (
    failureCodes.includes("private_or_raw_payload_present") ||
    failureCodes.some((code) => code.endsWith("_unsafe"))
  ) {
    return "blocked_private_or_raw_payload";
  }
  if (failureCodes.length > 0) return "blocked_invalid_input";
  return "rejected";
}

function mapRuntimeCandidateOrDurableMarker(
  result: ResearchRetrievalIndexSearchResultItemV01,
): RagContextPreviewRuntimeCandidateOrDurableMarkerV01 {
  if (result.provider_extraction_ref || result.source_surface === "provider_extraction_candidate_summary") {
    return "provider_candidate_context";
  }
  if (result.candidate_ref || result.source_surface === "candidate_summary") return "candidate_context";
  if (result.review_record_ref || result.source_surface === "review_note_summary") return "review_memory_context";
  if (result.perspective_id || result.source_surface === "durable_perspective_state_summary") {
    return "durable_state_context";
  }
  if (result.promotion_decision_ref || result.source_surface === "promotion_decision_summary") {
    return "promotion_context";
  }
  if (result.formation_receipt_ref || result.source_surface === "formation_receipt_summary") {
    return "formation_receipt_context";
  }
  if (result.feedback_ref || result.source_surface === "feedback_summary") return "feedback_context";
  if (result.source_ref_id || result.bounded_source_intake_ref) return "source_context";
  return "unknown_context";
}

function isCandidateRuntimeMarker(marker: RagContextPreviewRuntimeCandidateOrDurableMarkerV01): boolean {
  return marker === "candidate_context" || marker === "provider_candidate_context";
}

function isDurableRuntimeMarker(marker: RagContextPreviewRuntimeCandidateOrDurableMarkerV01): boolean {
  return (
    marker === "durable_state_context" ||
    marker === "promotion_context" ||
    marker === "formation_receipt_context"
  );
}

function isSupportedRuntimeSurface(sourceSurface: string): boolean {
  return [
    "source_ref_metadata",
    "candidate_summary",
    "review_note_summary",
    "promotion_decision_summary",
    "formation_receipt_summary",
    "durable_perspective_state_summary",
    "trajectory_event_summary",
    "feedback_summary",
    "provider_extraction_candidate_summary",
    "bounded_source_intake_summary",
    "dogfooding_record_summary",
    "manual_bounded_context",
  ].includes(sourceSurface);
}

function createRuntimeBackrefKey(result: ResearchRetrievalIndexSearchResultItemV01): string {
  return [
    result.source_ref_id,
    result.candidate_ref,
    result.review_record_ref,
    result.promotion_decision_ref,
    result.formation_receipt_ref,
    result.perspective_id,
    result.feedback_ref,
    result.provider_extraction_ref,
    result.bounded_source_intake_ref,
    result.source_record_ref,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join("|");
}

function hasTensionSearchResult(result: ResearchRetrievalIndexSearchResultItemV01): boolean {
  const text = `${result.bounded_title} ${result.bounded_snippet} ${result.reason_codes.join(" ")}`.toLowerCase();
  return text.includes("tension") || text.includes("unresolved_tension");
}

function hasGapSearchResult(result: ResearchRetrievalIndexSearchResultItemV01): boolean {
  const text = `${result.bounded_title} ${result.bounded_snippet} ${result.reason_codes.join(" ")}`.toLowerCase();
  return text.includes("knowledge gap") || text.includes("knowledge_gap") || text.includes(" gap ");
}

function hasTensionMarker(item: RagContextPreviewRuntimeContextItemV01): boolean {
  const text = `${item.bounded_title} ${item.bounded_context_summary} ${item.inclusion_reason_codes.join(" ")}`.toLowerCase();
  return text.includes("tension") || text.includes("unresolved_tension");
}

function hasGapMarker(item: RagContextPreviewRuntimeContextItemV01): boolean {
  const text = `${item.bounded_title} ${item.bounded_context_summary} ${item.inclusion_reason_codes.join(" ")}`.toLowerCase();
  return text.includes("knowledge gap") || text.includes("knowledge_gap") || text.includes(" gap ");
}

function createRuntimeQueryRef(query: unknown): string {
  const safeQuery = typeof query === "string" && isSafeRuntimeCompletionText(query) ? query : "blocked-query";
  return `rag-context-query:${createRagContextPreviewRuntimeFingerprintV01({
    query: safeQuery,
  }).slice(0, 24)}`;
}

function isSafeRuntimeCompletionText(value: string): boolean {
  const normalized = value.normalize("NFKC");
  if (normalized.includes("\0")) return false;
  if (normalized.length > 4000) return false;
  return !runtimeCompletionForbiddenTextMarkers.some((marker) =>
    normalized.toLowerCase().includes(marker.toLowerCase()),
  );
}

function safeRuntimeOutputString(value: unknown, placeholder: string): string {
  if (typeof value !== "string") return "";
  return isSafeRuntimeCompletionText(value) ? value : placeholder;
}

function containsUnsafeRuntimeCompletionValue(value: unknown): boolean {
  if (typeof value === "string") return !isSafeRuntimeCompletionText(value);
  if (Array.isArray(value)) return value.some((item) => containsUnsafeRuntimeCompletionValue(item));
  if (isRecord(value)) {
    return Object.values(value).some((item) => containsUnsafeRuntimeCompletionValue(item));
  }
  return false;
}

function isFalseLikeAuthorityValue(value: unknown): boolean {
  return value === false || value === null || value === undefined;
}

function containsForbiddenAuthorityGrantRuntimeCompletion(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => containsForbiddenAuthorityGrantRuntimeCompletion(item));
  if (!isRecord(value)) return false;
  for (const [key, nestedValue] of Object.entries(value)) {
    if (isRuntimeCompletionForbiddenAuthorityKey(key) && !isFalseLikeAuthorityValue(nestedValue)) {
      return true;
    }
    if (containsForbiddenAuthorityGrantRuntimeCompletion(nestedValue)) return true;
  }
  return false;
}

function isRuntimeCompletionForbiddenAuthorityKey(key: string): boolean {
  if (runtimeCompletionAllowedAuthorityFields.includes(key)) return false;
  return (
    runtimeCompletionForbiddenAuthorityFields.includes(key) ||
    runtimeCompletionAuthorityLikeKeyPatterns.some((pattern) => key.includes(pattern))
  );
}

export function buildRagContextPreviewV01(
  input: RagContextPreviewInput,
): RagContextPreviewEnvelope {
  const validation = validateRagContextPreviewInputV01(input);
  const authorityBoundary = createRagContextPreviewAuthorityBoundaryV01();
  const baseEnvelope = createBaseEnvelope(input, authorityBoundary);
  if (!validation.passed) {
    return withFingerprint({
      ...baseEnvelope,
      status: isPrivateOrRawValidationFailure(validation.failure_codes)
        ? "blocked_private_or_raw_payload"
        : "rejected",
      reason_codes: uniqueSorted([
        ...baseEnvelope.reason_codes,
        ...failureCodesToReasonCodes(validation.failure_codes),
      ]),
    });
  }

  const seenInputRefs = new Set<string>();
  const seenContentRefs = new Set<string>();
  const candidateItems = input.input_refs.map((inputRef, index) =>
    createContextItem(inputRef, input, index, seenInputRefs, seenContentRefs),
  );
  const sortedCandidateItems = candidateItems.sort(compareContextItems);
  const included: RagContextPreviewContextItem[] = [];
  const excluded: RagContextPreviewContextItem[] = [];
  for (const item of sortedCandidateItems) {
    if (item.inclusion_status === "included" || item.inclusion_status === "needs_operator_review") {
      if (included.length < input.max_context_items) included.push(item);
      else excluded.push(markExcluded(item, "excluded_duplicate", ["context_item_excluded"]));
    } else {
      excluded.push(item);
    }
  }
  const status = createEnvelopeStatus(included, excluded);
  const stalenessWarnings = included
    .filter((item) => item.stale_warning)
    .map((item) => `stale context retained for review: ${item.input_ref}`)
    .sort();

  return withFingerprint({
    ...baseEnvelope,
    status,
    included_context_items: included,
    excluded_context_items: excluded,
    source_refs: uniqueSorted(included.flatMap((item) => item.source_refs)),
    candidate_refs: uniqueSorted(included.flatMap((item) => item.candidate_refs)),
    review_memory_refs: uniqueSorted(included.flatMap((item) => item.review_memory_refs)),
    durable_summary_refs: uniqueSorted(included.flatMap((item) => item.durable_summary_refs)),
    feedback_refs: uniqueSorted(included.flatMap((item) => item.feedback_refs)),
    unresolved_tension_refs: uniqueSorted(input.unresolved_tension_refs),
    knowledge_gap_refs: uniqueSorted(input.knowledge_gap_refs),
    staleness_warnings: stalenessWarnings,
    boundary_notes: uniqueSorted([
      ...input.boundary_notes,
      "RAG Context Preview is preview-only.",
      "RAG Context Preview does not generate answers.",
      "Context items are not evidence.",
      "Product-write remains parked by #686.",
    ]),
    reason_codes: uniqueSorted([
      ...baseEnvelope.reason_codes,
      ...included.flatMap((item) => item.reason_codes),
      ...excluded.flatMap((item) => item.reason_codes),
      ...(input.unresolved_tension_refs.length > 0 ? ["unresolved_tension_preserved" as const] : []),
      ...(input.knowledge_gap_refs.length > 0 ? ["knowledge_gap_preserved" as const] : []),
    ]),
  });
}

export function validateRagContextPreviewInputV01(
  input: unknown,
): RagContextPreviewValidationResult {
  const failureCodes: string[] = [];
  if (!isRecord(input)) return { passed: false, failure_codes: ["input_not_object"] };
  if (input.input_version !== inputVersion) failureCodes.push("input_version_invalid");
  if (input.scope !== scope) failureCodes.push("scope_invalid");
  if (!isNonEmptyString(input.preview_id)) failureCodes.push("preview_id_missing");
  else if (containsForbiddenMarker(input.preview_id)) failureCodes.push("preview_id_forbidden_marker_present");
  if (!isNonEmptyString(input.requested_at)) failureCodes.push("requested_at_missing");
  if (input.roadmap_ref !== roadmapRef) failureCodes.push("roadmap_ref_invalid");
  if (input.retrieval_contract_ref !== retrievalContractRef) {
    failureCodes.push("retrieval_contract_ref_invalid");
  }
  if (input.retrieval_index_runtime_ref !== retrievalIndexRuntimeRef) {
    failureCodes.push("retrieval_index_runtime_ref_invalid");
  }
  if (typeof input.bounded_query_summary !== "string") {
    failureCodes.push("bounded_query_summary_invalid");
  } else if (containsForbiddenMarker(input.bounded_query_summary)) {
    failureCodes.push("bounded_query_summary_forbidden_marker_present");
  }
  if (!Number.isInteger(input.max_context_items) || Number(input.max_context_items) < 1) {
    failureCodes.push("max_context_items_invalid");
  }
  if (!Number.isInteger(input.max_summary_chars) || Number(input.max_summary_chars) < 1) {
    failureCodes.push("max_summary_chars_invalid");
  }
  if (!Array.isArray(input.input_refs)) {
    failureCodes.push("input_refs_invalid");
  } else if (input.input_refs.length === 0) {
    failureCodes.push("input_refs_empty");
  }
  for (const key of ["unresolved_tension_refs", "knowledge_gap_refs", "boundary_notes", "reason_codes"]) {
    if (!isStringArray(input[key])) failureCodes.push(`${key}_invalid`);
  }
  if (
    isStringArray(input.unresolved_tension_refs) &&
    input.unresolved_tension_refs.some(containsForbiddenMarker)
  ) {
    failureCodes.push("unresolved_tension_refs_forbidden_marker_present");
  }
  if (isStringArray(input.knowledge_gap_refs) && input.knowledge_gap_refs.some(containsForbiddenMarker)) {
    failureCodes.push("knowledge_gap_refs_forbidden_marker_present");
  }
  if (isStringArray(input.boundary_notes) && input.boundary_notes.some(containsForbiddenMarker)) {
    failureCodes.push("boundary_notes_forbidden_marker_present");
  }
  if (isStringArray(input.reason_codes) && input.reason_codes.some(containsForbiddenMarker)) {
    failureCodes.push("reason_codes_forbidden_marker_present");
  }
  if (!isRecord(input.authority_boundary)) failureCodes.push("authority_boundary_invalid");
  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

export function validateRagContextPreviewInputRefV01(
  inputRef: unknown,
): RagContextPreviewValidationResult {
  const failureCodes: string[] = [];
  if (!isRecord(inputRef)) return { passed: false, failure_codes: ["input_ref_not_object"] };
  if (!inputKinds.includes(inputRef.input_kind as RagContextInputKind)) {
    failureCodes.push("input_kind_invalid");
  }
  for (const key of ["input_ref", "bounded_title", "bounded_summary"]) {
    if (!isNonEmptyString(inputRef[key])) failureCodes.push(`${key}_missing`);
  }
  for (const key of [
    "source_refs",
    "candidate_refs",
    "review_memory_refs",
    "durable_summary_refs",
    "feedback_refs",
  ]) {
    if (!isStringArray(inputRef[key])) failureCodes.push(`${key}_invalid`);
  }
  if (typeof inputRef.retrieval_score_hint !== "number") {
    failureCodes.push("retrieval_score_hint_invalid");
  }
  if (!["none", "low", "medium", "high"].includes(String(inputRef.retrieval_score_band))) {
    failureCodes.push("retrieval_score_band_invalid");
  }
  if (!["fresh", "stale", "unknown"].includes(String(inputRef.freshness_status))) {
    failureCodes.push("freshness_status_invalid");
  }
  if (inputRef.public_safe !== true) failureCodes.push("public_safe_required");
  if (!layers.includes(inputRef.layer as RagContextLayer)) failureCodes.push("layer_invalid");
  if (!Array.isArray(inputRef.reason_codes)) failureCodes.push("reason_codes_invalid");
  if (
    [
      inputRef.input_ref,
      inputRef.bounded_title,
      inputRef.bounded_summary,
      ...(isStringArray(inputRef.source_refs) ? inputRef.source_refs : []),
      ...(isStringArray(inputRef.candidate_refs) ? inputRef.candidate_refs : []),
      ...(isStringArray(inputRef.review_memory_refs) ? inputRef.review_memory_refs : []),
      ...(isStringArray(inputRef.durable_summary_refs) ? inputRef.durable_summary_refs : []),
      ...(isStringArray(inputRef.feedback_refs) ? inputRef.feedback_refs : []),
      ...(isStringArray(inputRef.reason_codes) ? inputRef.reason_codes : []),
    ].some((value) => typeof value === "string" && containsForbiddenMarker(value))
  ) {
    failureCodes.push("input_ref_forbidden_marker_present");
  }
  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

export function createRagContextPreviewFingerprintV01(
  envelopeWithoutFingerprint: Omit<RagContextPreviewEnvelope, "preview_fingerprint">,
): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalJson(envelopeWithoutFingerprint)))
    .digest("hex");
}

export function createRagContextPreviewInputRefsFromSearchResultV01(
  searchResult: unknown,
): RagContextPreviewInputRef[] {
  if (!isRecord(searchResult) || !Array.isArray(searchResult.hits)) return [];
  return searchResult.hits
    .filter(isRecord)
    .map((hit, index) => ({
      input_kind: mapHitEntryKindToInputKind(String(hit.entry_kind)),
      input_ref: typeof hit.entry_ref === "string" ? hit.entry_ref : `retrieval-hit:${index}`,
      bounded_title: typeof hit.bounded_title === "string" ? hit.bounded_title : "",
      bounded_summary: typeof hit.bounded_summary === "string" ? hit.bounded_summary : "",
      source_refs: asStringArray(hit.source_refs),
      candidate_refs: asStringArray(hit.candidate_refs),
      review_memory_refs: asStringArray(hit.review_memory_refs),
      durable_summary_refs: asStringArray(hit.durable_summary_refs),
      feedback_refs: asStringArray(hit.feedback_refs),
      retrieval_score_hint: typeof hit.score_hint === "number" ? hit.score_hint : 0,
      retrieval_score_band: scoreBand(String(hit.score_band)),
      freshness_status: hit.stale_warning === true ? ("stale" as const) : ("fresh" as const),
      public_safe: true,
      layer: mapHitEntryKindToLayer(String(hit.entry_kind)),
      reason_codes: uniqueSorted([
        "input_ref_present",
        "bounded_summary_present",
        ...(asStringArray(hit.source_refs).length > 0 ? ["source_ref_present" as const] : ["source_ref_missing" as const]),
        ...(hit.stale_warning === true ? ["stale_context_warning" as const] : []),
      ]),
    }))
    .sort((left, right) => left.input_ref.localeCompare(right.input_ref));
}

export function countRagContextPreviewItemKindsV01(
  envelopes: RagContextPreviewEnvelope[],
): RagContextPreviewBundle["item_kind_counts"] {
  const counts = Object.fromEntries(itemKinds.map((kind) => [kind, 0])) as RagContextPreviewBundle["item_kind_counts"];
  for (const item of envelopes.flatMap((envelope) => [
    ...envelope.included_context_items,
    ...envelope.excluded_context_items,
  ])) {
    counts[item.item_kind] += 1;
  }
  return counts;
}

export function countRagContextPreviewLayersV01(
  envelopes: RagContextPreviewEnvelope[],
): RagContextPreviewBundle["layer_counts"] {
  const counts = Object.fromEntries(layers.map((layer) => [layer, 0])) as RagContextPreviewBundle["layer_counts"];
  for (const item of envelopes.flatMap((envelope) => [
    ...envelope.included_context_items,
    ...envelope.excluded_context_items,
  ])) {
    counts[item.layer] += 1;
  }
  return counts;
}

export function countRagContextPreviewInclusionStatusesV01(
  envelopes: RagContextPreviewEnvelope[],
): RagContextPreviewBundle["inclusion_status_counts"] {
  const counts = Object.fromEntries(inclusionStatuses.map((status) => [status, 0])) as RagContextPreviewBundle["inclusion_status_counts"];
  for (const item of envelopes.flatMap((envelope) => [
    ...envelope.included_context_items,
    ...envelope.excluded_context_items,
  ])) {
    counts[item.inclusion_status] += 1;
  }
  return counts;
}

export function createRagContextPreviewBundleFingerprintV01(
  bundleWithoutFingerprint: Omit<RagContextPreviewBundle, "bundle_fingerprint">,
): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalJson(bundleWithoutFingerprint)))
    .digest("hex");
}

function createBaseEnvelope(
  input: RagContextPreviewInput,
  authorityBoundary: RagContextPreviewAuthorityBoundary,
): Omit<RagContextPreviewEnvelope, "preview_fingerprint"> {
  return {
    envelope_version: envelopeVersion,
    preview_version: previewVersion,
    scope,
    preview_id: safeOutputString(input?.preview_id, blockedPreviewId),
    status: "preview_only",
    bounded_query_summary: safeOutputString(input?.bounded_query_summary, blockedBoundedQuerySummary),
    included_context_items: [],
    excluded_context_items: [],
    source_refs: [],
    candidate_refs: [],
    review_memory_refs: [],
    durable_summary_refs: [],
    feedback_refs: [],
    unresolved_tension_refs: safeOutputStringArray(input?.unresolved_tension_refs),
    knowledge_gap_refs: safeOutputStringArray(input?.knowledge_gap_refs),
    staleness_warnings: [],
    boundary_notes: [],
    rag_answer_generated: false,
    provider_call_executed: false,
    prompt_sent: false,
    embedding_created: false,
    vector_search_executed: false,
    source_fetch_executed: false,
    file_read_executed: false,
    db_query_executed: false,
    proof_or_evidence_created: false,
    perspective_promoted: false,
    product_write_executed: false,
    reason_codes: baseReasonCodes,
    authority_boundary: authorityBoundary,
  };
}

function createContextItem(
  inputRef: RagContextPreviewInputRef,
  input: RagContextPreviewInput,
  index: number,
  seenInputRefs: Set<string>,
  seenContentRefs: Set<string>,
): RagContextPreviewContextItem {
  const validation = validateRagContextPreviewInputRefV01(inputRef);
  const layer = layers.includes(inputRef.layer) ? inputRef.layer : "unknown";
  if (isPrivateOrRawValidationFailure(validation.failure_codes)) {
    return createRedactedPrivateRawContextItem(inputRef, input, index, validation, layer);
  }
  const sourceRefs = uniqueSorted(asStringArray(inputRef.source_refs));
  const candidateRefs = uniqueSorted(asStringArray(inputRef.candidate_refs));
  const reviewMemoryRefs = uniqueSorted(asStringArray(inputRef.review_memory_refs));
  const durableSummaryRefs = uniqueSorted(asStringArray(inputRef.durable_summary_refs));
  const feedbackRefs = uniqueSorted(asStringArray(inputRef.feedback_refs));
  const inputRefValue = typeof inputRef.input_ref === "string" ? inputRef.input_ref : `input-ref:${index}`;
  const itemKind = determineItemKind(inputRef, input);
  const contentKey = [
    inputRef.bounded_summary,
    sourceRefs.join("|"),
    candidateRefs.join("|"),
    reviewMemoryRefs.join("|"),
    durableSummaryRefs.join("|"),
    feedbackRefs.join("|"),
  ].join("::");
  const duplicateByInputRef = seenInputRefs.has(inputRefValue);
  const duplicateByContent = seenContentRefs.has(contentKey);
  seenInputRefs.add(inputRefValue);
  seenContentRefs.add(contentKey);
  const inclusionStatus = determineInclusionStatus({
    inputRef,
    validation,
    sourceRefs,
    itemKind,
    duplicate: duplicateByInputRef || duplicateByContent,
  });
  const staleWarning = inputRef.freshness_status === "stale" && inclusionStatus !== "excluded_stale_without_warning";
  const item: RagContextPreviewContextItem = {
    item_version: itemVersion,
    scope,
    item_id: `rag-context-item:${String(index + 1).padStart(3, "0")}`,
    item_kind: inclusionStatus.startsWith("excluded") ? "excluded_context" : itemKind,
    input_ref: inputRefValue,
    bounded_title: typeof inputRef.bounded_title === "string" ? inputRef.bounded_title : "",
    bounded_summary: truncateSummary(
      typeof inputRef.bounded_summary === "string" ? inputRef.bounded_summary : "",
      input.max_summary_chars,
    ),
    source_refs: sourceRefs,
    candidate_refs: candidateRefs,
    review_memory_refs: reviewMemoryRefs,
    durable_summary_refs: durableSummaryRefs,
    feedback_refs: feedbackRefs,
    layer,
    inclusion_status: inclusionStatus,
    retrieval_score_hint:
      typeof inputRef.retrieval_score_hint === "number" ? inputRef.retrieval_score_hint : 0,
    retrieval_score_band: scoreBand(inputRef.retrieval_score_band),
    stale_warning: staleWarning,
    unresolved_tension_refs: itemKind === "included_tension_context" ? uniqueSorted(input.unresolved_tension_refs) : [],
    knowledge_gap_refs: itemKind === "included_gap_context" ? uniqueSorted(input.knowledge_gap_refs) : [],
    context_item_is_evidence: false,
    retrieval_score_is_truth_score: false,
    retrieval_score_is_promotion_readiness: false,
    reason_codes: uniqueSorted([
      ...baseReasonCodes,
      ...safeReasonCodes(inputRef.reason_codes),
      ...layerReasonCodes[layer],
      validation.passed ? "input_ref_present" : "context_item_excluded",
      inputRefValue ? "input_ref_present" : "input_ref_missing",
      sourceRefs.length > 0 ? "source_ref_present" : "source_ref_missing",
      candidateRefs.length > 0 ? "candidate_ref_present" : undefined,
      reviewMemoryRefs.length > 0 ? "review_memory_ref_present" : undefined,
      durableSummaryRefs.length > 0 ? "durable_summary_ref_present" : undefined,
      feedbackRefs.length > 0 ? "feedback_ref_present" : undefined,
      inputRef.bounded_summary ? "bounded_summary_present" : "bounded_summary_missing",
      inclusionStatus === "included" || inclusionStatus === "needs_operator_review"
        ? "context_item_included"
        : "context_item_excluded",
      inclusionStatus === "excluded_duplicate" ? "duplicate_context_excluded" : undefined,
      staleWarning ? "stale_context_warning" : undefined,
      itemKind === "included_tension_context" ? "unresolved_tension_preserved" : undefined,
      itemKind === "included_gap_context" ? "knowledge_gap_preserved" : undefined,
      inclusionStatus === "excluded_private_or_raw_payload"
        ? "private_or_raw_payload_blocked"
        : undefined,
      validation.failure_codes.includes("input_ref_forbidden_marker_present")
        ? "secret_like_pattern_blocked"
        : undefined,
    ]),
  };
  return item;
}

function createRedactedPrivateRawContextItem(
  inputRef: RagContextPreviewInputRef,
  input: RagContextPreviewInput,
  index: number,
  validation: RagContextPreviewValidationResult,
  layer: RagContextLayer,
): RagContextPreviewContextItem {
  const safeLayer = layers.includes(layer) ? layer : "unknown";
  return {
    item_version: itemVersion,
    scope,
    item_id: `rag-context-item:${String(index + 1).padStart(3, "0")}`,
    item_kind: "excluded_context",
    input_ref: `blocked-rag-context-input-ref:${index}`,
    bounded_title: blockedContextInputTitle,
    bounded_summary: truncateSummary(blockedContextInputSummary, input.max_summary_chars),
    source_refs: [],
    candidate_refs: [],
    review_memory_refs: [],
    durable_summary_refs: [],
    feedback_refs: [],
    layer: safeLayer,
    inclusion_status: "excluded_private_or_raw_payload",
    retrieval_score_hint:
      typeof inputRef.retrieval_score_hint === "number" ? inputRef.retrieval_score_hint : 0,
    retrieval_score_band: scoreBand(inputRef.retrieval_score_band),
    stale_warning: false,
    unresolved_tension_refs: [],
    knowledge_gap_refs: [],
    context_item_is_evidence: false,
    retrieval_score_is_truth_score: false,
    retrieval_score_is_promotion_readiness: false,
    reason_codes: uniqueSorted([
      ...baseReasonCodes,
      ...layerReasonCodes[safeLayer],
      "bounded_summary_present",
      "context_item_excluded",
      "private_or_raw_payload_blocked",
      validation.failure_codes.includes("input_ref_forbidden_marker_present")
        ? "secret_like_pattern_blocked"
        : undefined,
    ]),
  };
}

function determineInclusionStatus(input: {
  inputRef: RagContextPreviewInputRef;
  validation: RagContextPreviewValidationResult;
  sourceRefs: string[];
  itemKind: RagContextItemKind;
  duplicate: boolean;
}): RagContextInclusionStatus {
  if (input.duplicate) return "excluded_duplicate";
  if (!input.validation.passed) {
    if (
      input.validation.failure_codes.includes("public_safe_required") ||
      input.validation.failure_codes.includes("input_ref_forbidden_marker_present")
    ) {
      return "excluded_private_or_raw_payload";
    }
    if (input.validation.failure_codes.includes("bounded_summary_missing")) {
      return "excluded_empty_summary";
    }
    return "excluded_unsupported_kind";
  }
  if (input.inputRef.input_kind === "unknown" || input.itemKind === "unknown") {
    return "excluded_unsupported_kind";
  }
  if (input.inputRef.bounded_summary.trim().length === 0) return "excluded_empty_summary";
  if (input.inputRef.freshness_status === "stale" && !input.inputRef.reason_codes.includes("stale_context_warning")) {
    return "excluded_stale_without_warning";
  }
  if (
    input.sourceRefs.length === 0 &&
    input.itemKind !== "included_gap_context" &&
    input.itemKind !== "included_tension_context"
  ) {
    return "excluded_missing_source_ref";
  }
  if (input.inputRef.reason_codes.includes("context_item_excluded")) return "needs_operator_review";
  return "included";
}

function determineItemKind(
  inputRef: RagContextPreviewInputRef,
  input: RagContextPreviewInput,
): RagContextItemKind {
  if (inputRef.input_kind === "source_ref_candidate" || inputRef.input_kind === "retrieval_search_hit") {
    if (inputRef.layer === "source_ref") return "included_source_ref";
  }
  if (inputRef.input_kind === "candidate_summary") return "included_candidate_summary";
  if (inputRef.input_kind === "review_memory_summary") return "included_review_memory_summary";
  if (inputRef.input_kind === "perspective_delta_summary" || inputRef.input_kind === "formation_receipt_summary") {
    return "included_durable_summary";
  }
  if (inputRef.input_kind === "feedback_summary") return "included_feedback_summary";
  if (inputRef.input_kind === "manual_bounded_context") {
    if (
      inputRef.reason_codes.includes("knowledge_gap_preserved") ||
      inputRef.input_ref.includes("gap") ||
      input.knowledge_gap_refs.some((ref) => inputRef.input_ref.includes(ref))
    ) {
      return "included_gap_context";
    }
    if (
      inputRef.reason_codes.includes("unresolved_tension_preserved") ||
      inputRef.input_ref.includes("tension") ||
      input.unresolved_tension_refs.some((ref) => inputRef.input_ref.includes(ref))
    ) {
      return "included_tension_context";
    }
  }
  return "unknown";
}

function markExcluded(
  item: RagContextPreviewContextItem,
  status: RagContextInclusionStatus,
  reasonCodes: RagContextPreviewReasonCode[],
): RagContextPreviewContextItem {
  return {
    ...item,
    item_kind: "excluded_context",
    inclusion_status: status,
    reason_codes: uniqueSorted([...item.reason_codes, ...reasonCodes]),
  };
}

function withFingerprint(
  envelopeWithoutFingerprint: Omit<RagContextPreviewEnvelope, "preview_fingerprint">,
): RagContextPreviewEnvelope {
  return {
    ...envelopeWithoutFingerprint,
    preview_fingerprint: createRagContextPreviewFingerprintV01(envelopeWithoutFingerprint),
  };
}

function createEnvelopeStatus(
  included: RagContextPreviewContextItem[],
  excluded: RagContextPreviewContextItem[],
): RagContextPreviewStatus {
  if (included.length > 0) return "preview_only";
  if (excluded.some((item) => item.inclusion_status === "excluded_private_or_raw_payload")) {
    return "blocked_private_or_raw_payload";
  }
  if (excluded.some((item) => item.inclusion_status === "excluded_unsupported_kind")) {
    return "blocked_unsupported_input";
  }
  return "blocked_missing_context";
}

function failureCodesToReasonCodes(failureCodes: string[]): RagContextPreviewReasonCode[] {
  const reasonCodes: RagContextPreviewReasonCode[] = [];
  if (isPrivateOrRawValidationFailure(failureCodes)) {
    reasonCodes.push("private_or_raw_payload_blocked");
  }
  if (failureCodes.includes("input_refs_empty")) reasonCodes.push("bounded_summary_missing");
  return uniqueSorted(reasonCodes);
}

function isPrivateOrRawValidationFailure(failureCodes: string[]): boolean {
  return failureCodes.some(
    (code) => code.includes("forbidden") || code === "public_safe_required",
  );
}

function compareContextItems(
  left: RagContextPreviewContextItem,
  right: RagContextPreviewContextItem,
): number {
  return (
    inclusionSortOrder[left.inclusion_status] - inclusionSortOrder[right.inclusion_status] ||
    layerSortOrder[left.layer] - layerSortOrder[right.layer] ||
    right.retrieval_score_hint - left.retrieval_score_hint ||
    left.input_ref.localeCompare(right.input_ref)
  );
}

function mapHitEntryKindToInputKind(entryKind: string): RagContextInputKind {
  if (entryKind === "source_ref_metadata") return "source_ref_candidate";
  if (entryKind === "candidate_summary") return "candidate_summary";
  if (entryKind === "review_note_summary") return "review_memory_summary";
  if (entryKind === "perspective_delta_summary") return "perspective_delta_summary";
  if (entryKind === "formation_receipt_summary") return "formation_receipt_summary";
  if (entryKind === "feedback_summary") return "feedback_summary";
  if (entryKind === "manual_bounded_context") return "manual_bounded_context";
  return "unknown";
}

function mapHitEntryKindToLayer(entryKind: string): RagContextLayer {
  if (entryKind === "source_ref_metadata") return "source_ref";
  if (entryKind === "candidate_summary") return "candidate";
  if (entryKind === "review_note_summary") return "review_memory";
  if (entryKind === "perspective_delta_summary" || entryKind === "formation_receipt_summary") return "durable";
  if (entryKind === "feedback_summary") return "feedback";
  if (entryKind === "manual_bounded_context") return "manual";
  return "unknown";
}

function truncateSummary(value: string, maxSummaryChars: number): string {
  if (value.length <= maxSummaryChars) return value;
  return value.slice(0, Math.max(0, maxSummaryChars));
}

function containsForbiddenMarker(value: string): boolean {
  return forbiddenTextMarkers.some((marker) => value.includes(marker));
}

function safeOutputString(value: unknown, placeholder: string): string {
  if (typeof value !== "string") return "";
  return containsForbiddenMarker(value) ? placeholder : value;
}

function safeOutputStringArray(value: unknown): string[] {
  if (!isStringArray(value)) return [];
  return uniqueSorted(value.filter((item) => !containsForbiddenMarker(item)));
}

function safeReasonCodes(value: unknown): RagContextPreviewReasonCode[] {
  if (!isStringArray(value)) return [];
  return uniqueSorted(value.filter((item) => !containsForbiddenMarker(item))) as RagContextPreviewReasonCode[];
}

function scoreBand(value: string): "none" | "low" | "medium" | "high" {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "none";
}

function asStringArray(value: unknown): string[] {
  return isStringArray(value) ? uniqueSorted(value) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalJson((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

function uniqueSorted<T extends string | undefined>(values: T[]): Exclude<T, undefined>[] {
  return [...new Set(values.filter((value): value is Exclude<T, undefined> => value !== undefined))].sort((left, right) =>
    left.localeCompare(right),
  );
}
