import { createHash } from "node:crypto";

import {
  createResearchRetrievalIndexAuthorityBoundaryV01,
  researchRetrievalIndexSchemaExistsV01,
  type ResearchRetrievalIndexAuthorityBoundaryV01,
  type ResearchRetrievalIndexDbLikeV01,
// @ts-ignore Direct Node smoke imports TS modules and requires explicit extension.
} from "./index-store.ts";
// @ts-ignore Direct Node smoke imports TS modules and requires explicit extension.
import { tokenizeResearchRetrievalTextV01 } from "./rebuild-index.ts";
import type {
  RebuildableRetrievalIndex,
  RebuildableRetrievalIndexEntry,
  RebuildableRetrievalIndexEntryKind,
  RebuildableRetrievalIndexFreshnessStatus,
  RebuildableRetrievalIndexRuntimeBoundary,
  RebuildableRetrievalIndexValidationResult,
} from "./rebuild-index";

export const RESEARCH_RETRIEVAL_INDEX_SEARCH_REQUEST_VERSION =
  "research_retrieval_index_search_request.v0.1" as const;
export const RESEARCH_RETRIEVAL_INDEX_SEARCH_RESULT_VERSION =
  "research_retrieval_index_search_result.v0.1" as const;
export const RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01 =
  "research_retrieval_index_runtime_completion_search.v0.1" as const;

const runtimeVersion = "rebuildable_retrieval_index_runtime.v0.1" as const;
const contractVersion = "research_retrieval_runtime_contract.v0.1" as const;
const scope = "project:augnes" as const;

export type ResearchRetrievalIndexSearchStatus =
  | "candidate_only"
  | "no_matches"
  | "blocked_unsupported_mode"
  | "blocked_private_or_raw_payload"
  | "rejected_invalid_request";

export type ResearchRetrievalIndexSearchMode =
  | "metadata_lookup"
  | "lexical_candidate_retrieval"
  | "hybrid_candidate_retrieval"
  | "no_retrieval"
  | "semantic_candidate_retrieval"
  | "rerank_candidate_preview"
  | "rag_context_preview"
  | "citation_context_preview"
  | "unknown";

export type ResearchRetrievalIndexSearchReasonCode =
  | "index_present"
  | "index_missing"
  | "query_summary_present"
  | "query_summary_missing"
  | "retrieval_mode_supported"
  | "retrieval_mode_unsupported"
  | "bounded_local_search_executed"
  | "metadata_lookup_executed"
  | "lexical_search_executed"
  | "hybrid_search_executed"
  | "no_retrieval_requested"
  | "semantic_embedding_search_deferred"
  | "rag_context_preview_deferred"
  | "rerank_deferred"
  | "citation_context_preview_deferred"
  | "entry_match_found"
  | "entry_match_not_found"
  | "stale_result_warning"
  | "retrieval_result_not_evidence"
  | "retrieval_score_not_truth_score"
  | "retrieval_score_not_promotion_readiness"
  | "rag_answer_not_generated"
  | "embedding_not_created"
  | "vector_search_not_executed"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "source_fetch_not_executed"
  | "file_read_not_executed"
  | "db_query_not_executed"
  | "proof_not_created"
  | "evidence_not_created"
  | "promotion_not_executed"
  | "product_write_denied";

export interface ResearchRetrievalIndexSearchFilters {
  entry_kinds: RebuildableRetrievalIndexEntryKind[];
  source_refs: string[];
  candidate_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  freshness_statuses: RebuildableRetrievalIndexFreshnessStatus[];
}

export interface ResearchRetrievalIndexSearchRequest {
  search_request_version: typeof RESEARCH_RETRIEVAL_INDEX_SEARCH_REQUEST_VERSION;
  runtime_version: typeof runtimeVersion;
  contract_version: typeof contractVersion;
  scope: typeof scope;
  request_id: string;
  index_id: string;
  retrieval_mode: ResearchRetrievalIndexSearchMode;
  bounded_query_summary: string;
  filters: ResearchRetrievalIndexSearchFilters;
  limit: number;
  public_safe: boolean;
  reason_codes: ResearchRetrievalIndexSearchReasonCode[];
  authority_boundary: RebuildableRetrievalIndexRuntimeBoundary;
}

export interface ResearchRetrievalIndexSearchHit {
  rank: number;
  entry_id: string;
  entry_ref: string;
  entry_kind: RebuildableRetrievalIndexEntryKind;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  candidate_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  matched_terms: string[];
  score_hint: number;
  score_band: "none" | "low" | "medium" | "high";
  stale_warning: boolean;
  retrieval_result_is_evidence: false;
  retrieval_score_is_truth_score: false;
  retrieval_score_is_promotion_readiness: false;
  reason_codes: ResearchRetrievalIndexSearchReasonCode[];
}

export interface ResearchRetrievalIndexSearchResult {
  search_result_version: typeof RESEARCH_RETRIEVAL_INDEX_SEARCH_RESULT_VERSION;
  runtime_version: typeof runtimeVersion;
  contract_version: typeof contractVersion;
  scope: typeof scope;
  request_id: string;
  index_id: string;
  status: ResearchRetrievalIndexSearchStatus;
  hits: ResearchRetrievalIndexSearchHit[];
  rejected: boolean;
  warnings: string[];
  reason_codes: ResearchRetrievalIndexSearchReasonCode[];
  retrieval_executed: boolean;
  rag_executed: false;
  embedding_created: false;
  vector_search_executed: false;
  semantic_embedding_search_executed: false;
  rerank_executed: false;
  provider_call_executed: false;
  prompt_sent: false;
  source_fetch_executed: false;
  file_read_executed: false;
  db_query_executed: false;
  proof_or_evidence_created: false;
  perspective_promoted: false;
  product_write_executed: false;
  authority_boundary: RebuildableRetrievalIndexRuntimeBoundary;
}

export type ResearchRetrievalIndexDbSearchStatusV01 =
  | "searched"
  | "not_found"
  | "schema_missing"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "rejected";

export interface ResearchRetrievalIndexSearchInputV01 {
  search_version: typeof RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01;
  scope: typeof scope;
  search_request_id: string;
  requested_by: string;
  requested_at: string;
  db_path?: string;
  query: string;
  filters?: {
    source_surface?: string;
    source_ref_id?: string;
    source_ref?: string;
    candidate_ref?: string;
    review_record_ref?: string;
    promotion_decision_ref?: string;
    formation_receipt_ref?: string;
    perspective_id?: string;
    feedback_ref?: string;
    provider_extraction_ref?: string;
    bounded_source_intake_ref?: string;
  };
  limit?: number;
  include_stale?: boolean;
  authority_boundary?: Record<string, unknown>;
  reason_codes?: string[];
}

export interface ResearchRetrievalIndexSearchResultItemV01 {
  result_ref: string;
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
  bounded_snippet: string;
  score: number;
  score_is_truth: false;
  score_is_promotion_readiness: false;
  retrieval_result_is_evidence: false;
  source_refs_are_lineage: true;
  stale_marker: "fresh" | "stale" | "unknown";
  reason_codes: string[];
  authority_boundary: ResearchRetrievalIndexAuthorityBoundaryV01;
}

export interface ResearchRetrievalIndexSearchRuntimeResultV01 {
  search_version: typeof RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01;
  scope: typeof scope;
  status: ResearchRetrievalIndexDbSearchStatusV01;
  search_request_id: string;
  result_count: number;
  results: ResearchRetrievalIndexSearchResultItemV01[];
  retrieval_executed: boolean;
  rag_answer_generated: false;
  provider_call_executed: false;
  prompt_sent: false;
  source_fetch_executed: false;
  embedding_created: false;
  vector_search_executed: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  promotion_executed: false;
  durable_state_written: false;
  formation_receipt_written: false;
  product_write_executed: false;
  product_id_allocated: false;
  authority_boundary: ResearchRetrievalIndexAuthorityBoundaryV01;
  reason_codes: string[];
  failure_codes?: string[];
}

export interface ResearchRetrievalIndexSearchValidationResultV01 {
  passed: boolean;
  status: Exclude<ResearchRetrievalIndexDbSearchStatusV01, "searched" | "not_found" | "schema_missing"> | "valid";
  failure_codes: string[];
  reason_codes: string[];
  authority_boundary: ResearchRetrievalIndexAuthorityBoundaryV01;
}

const supportedModes: ResearchRetrievalIndexSearchMode[] = [
  "metadata_lookup",
  "lexical_candidate_retrieval",
  "hybrid_candidate_retrieval",
  "no_retrieval",
];

const deferredModes: ResearchRetrievalIndexSearchMode[] = [
  "semantic_candidate_retrieval",
  "rerank_candidate_preview",
  "rag_context_preview",
  "citation_context_preview",
  "unknown",
];

const searchModes: ResearchRetrievalIndexSearchMode[] = [
  ...supportedModes,
  ...deferredModes,
];

const entryKinds: RebuildableRetrievalIndexEntryKind[] = [
  "source_ref_metadata",
  "candidate_summary",
  "review_note_summary",
  "perspective_delta_summary",
  "formation_receipt_summary",
  "feedback_summary",
  "manual_bounded_context",
  "unknown",
];

const freshnessStatuses: RebuildableRetrievalIndexFreshnessStatus[] = [
  "fresh",
  "stale",
  "unknown",
];

const runtimeCompletionForbiddenTextMarkers = [
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
  "raw source body",
  "raw provider output",
  "raw retrieval output",
  "raw conversation",
  "hidden reasoning",
  "raw DB row",
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
];

const runtimeCompletionForbiddenAuthorityFields = [
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "live_crawling_now",
  "embedding_created_now",
  "vector_search_now",
  "rag_answer_generation_now",
  "raw_source_body_indexed_now",
  "raw_provider_output_indexed_now",
  "raw_retrieval_output_stored_now",
  "hidden_reasoning_stored_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
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
  "retrieval_result_is_evidence",
  "retrieval_result_is_truth",
  "retrieval_score_is_truth",
  "retrieval_score_is_promotion_readiness",
  "rag_context_is_truth",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const runtimeCompletionAllowedAuthorityFields = [
  "rebuildable_retrieval_index_runtime_now",
  "explicit_operator_rebuild_only",
  "explicit_operator_search_only",
  "caller_injected_db_only",
  "db_query_or_write_now",
  "derived_index_write_now",
  "derived_index_search_now",
  "public_safe_derived_entries_only",
  "stale_marker_visible",
  "backrefs_visible",
];

const runtimeCompletionAuthorityLikeKeyPatterns = [
  "_authority",
  "_write_now",
  "_call_now",
  "_execution_now",
  "_is_truth",
  "_is_proof",
  "_is_accepted_evidence",
  "_is_durable_state",
  "product_write",
  "product_id_allocation",
  "proof_or_evidence",
  "claim_or_evidence",
  "promotion_execution",
  "durable_state_apply",
  "formation_receipt_write",
  "github_api_call",
  "git_write",
];

export function validateResearchRetrievalSearchInputV01(
  input: unknown,
): ResearchRetrievalIndexSearchValidationResultV01 {
  const authorityBoundary = createResearchRetrievalIndexAuthorityBoundaryV01({
    derived_index_search_now: true,
  });
  const failureCodes: string[] = [];
  const reasonCodes = [
    "rebuildable_retrieval_index_runtime_completion",
    "explicit_operator_search_only",
    "derived_index_search_now",
    "retrieval_result_not_evidence",
    "retrieval_score_not_truth",
    "retrieval_score_not_promotion_readiness",
    "rag_answer_not_generated",
    "provider_call_not_executed",
    "prompt_not_sent",
    "source_fetch_not_executed",
    "embedding_not_created",
    "vector_search_not_executed",
    "proof_not_created",
    "evidence_not_created",
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
  if (input.search_version !== RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01) {
    failureCodes.push("search_version_invalid");
  }
  if (input.scope !== scope) failureCodes.push("scope_invalid");
  if (!isNonEmptyString(input.search_request_id)) failureCodes.push("search_request_id_missing");
  if (!isNonEmptyString(input.requested_by)) failureCodes.push("requested_by_missing");
  if (!isNonEmptyString(input.requested_at)) failureCodes.push("requested_at_missing");
  if (!isNonEmptyString(input.query)) failureCodes.push("query_missing");
  if (typeof input.query === "string" && input.query.length > 300) failureCodes.push("query_too_large");
  if (input.db_path !== undefined && typeof input.db_path !== "string") failureCodes.push("db_path_invalid");
  if (input.limit !== undefined && (!Number.isInteger(input.limit) || Number(input.limit) < 1)) {
    failureCodes.push("limit_invalid");
  }
  if (input.filters !== undefined) {
    if (!isRecord(input.filters)) failureCodes.push("filters_invalid");
    else {
      for (const [key, value] of Object.entries(input.filters)) {
        if (value !== undefined && value !== null && typeof value !== "string") {
          failureCodes.push(`filter_${key}_invalid`);
        }
      }
    }
  }
  if (!Array.isArray(input.reason_codes)) failureCodes.push("reason_codes_invalid");
  if (containsUnsafeRuntimeCompletionValue(input)) failureCodes.push("private_or_raw_payload_present");
  if (containsForbiddenAuthorityGrantRuntimeCompletion(input)) {
    failureCodes.push("forbidden_authority_present");
  }

  const status = chooseRuntimeCompletionSearchStatus(failureCodes);
  return {
    passed: failureCodes.length === 0,
    status: failureCodes.length === 0 ? "valid" : status,
    failure_codes: uniqueSorted(failureCodes),
    reason_codes: uniqueSorted([
      ...reasonCodes,
      ...(failureCodes.length === 0 ? ["search_input_valid"] : [status]),
      ...(failureCodes.includes("private_or_raw_payload_present")
        ? ["private_or_raw_payload_blocked"]
        : []),
      ...(failureCodes.includes("forbidden_authority_present") ? ["forbidden_authority_blocked"] : []),
    ]),
    authority_boundary: authorityBoundary,
  };
}

export function searchResearchRetrievalIndexV01(
  input: ResearchRetrievalIndexSearchInputV01,
  db: ResearchRetrievalIndexDbLikeV01,
): ResearchRetrievalIndexSearchRuntimeResultV01 {
  const validation = validateResearchRetrievalSearchInputV01(input);
  const authorityBoundary = createResearchRetrievalIndexAuthorityBoundaryV01({
    derived_index_search_now: validation.passed,
  });
  if (!validation.passed) {
    return createDbSearchResult({
      input,
      status: validation.status === "valid" ? "rejected" : validation.status,
      results: [],
      retrievalExecuted: false,
      authorityBoundary,
      reasonCodes: validation.reason_codes,
      failureCodes: validation.failure_codes,
    });
  }
  if (!researchRetrievalIndexSchemaExistsV01(db)) {
    return createDbSearchResult({
      input,
      status: "schema_missing",
      results: [],
      retrievalExecuted: false,
      authorityBoundary,
      reasonCodes: uniqueSorted([...validation.reason_codes, "schema_missing"]),
      failureCodes: ["schema_missing"],
    });
  }

  const queryTerms = tokenizeResearchRetrievalTextV01(input.query).slice(0, 12);
  if (queryTerms.length === 0) {
    return createDbSearchResult({
      input,
      status: "blocked_invalid_input",
      results: [],
      retrievalExecuted: false,
      authorityBoundary,
      reasonCodes: uniqueSorted([...validation.reason_codes, "query_terms_missing"]),
      failureCodes: ["query_terms_missing"],
    });
  }

  const limit = Math.min(Math.max(Number(input.limit ?? 10), 1), 20);
  const rows = queryDbIndexRows(db, input, queryTerms, limit);
  const results = rows.map((row) => rowToSearchResultItem(row, input, queryTerms));
  return createDbSearchResult({
    input,
    status: results.length > 0 ? "searched" : "not_found",
    results,
    retrievalExecuted: true,
    authorityBoundary,
    reasonCodes: uniqueSorted([
      ...validation.reason_codes,
      "derived_index_search_now",
      "search_result_not_evidence",
      "retrieval_score_not_truth",
      "retrieval_score_not_promotion_readiness",
      ...(results.some((result) => result.stale_marker === "stale") ? ["stale_marker_visible"] : []),
      ...(results.length > 0 ? ["backrefs_visible"] : []),
    ]),
  });
}

export function createResearchRetrievalSearchResultFingerprintV01(
  result: unknown,
): string {
  return createHash("sha256").update(JSON.stringify(canonicalJson(result))).digest("hex");
}

interface ResearchRetrievalIndexDbSearchRowV01 {
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
  bounded_summary: string;
  stale_marker: "fresh" | "stale" | "unknown";
  score: number;
}

function queryDbIndexRows(
  db: ResearchRetrievalIndexDbLikeV01,
  input: ResearchRetrievalIndexSearchInputV01,
  queryTerms: string[],
  limit: number,
): ResearchRetrievalIndexDbSearchRowV01[] {
  const filters = input.filters ?? {};
  const clauses = [
    "e.scope = ?",
    `t.term IN (${queryTerms.map(() => "?").join(", ")})`,
  ];
  const params: unknown[] = [input.scope, ...queryTerms];
  if (!input.include_stale) clauses.push("e.stale_marker != 'stale'");
  const filterMappings: Array<[string, string | undefined]> = [
    ["e.source_surface", filters.source_surface],
    ["e.source_ref_id", filters.source_ref_id ?? filters.source_ref],
    ["e.candidate_ref", filters.candidate_ref],
    ["e.review_record_ref", filters.review_record_ref],
    ["e.promotion_decision_ref", filters.promotion_decision_ref],
    ["e.formation_receipt_ref", filters.formation_receipt_ref],
    ["e.perspective_id", filters.perspective_id],
    ["e.feedback_ref", filters.feedback_ref],
    ["e.provider_extraction_ref", filters.provider_extraction_ref],
    ["e.bounded_source_intake_ref", filters.bounded_source_intake_ref],
  ];
  for (const [column, value] of filterMappings) {
    if (typeof value === "string" && value.length > 0) {
      clauses.push(`${column} = ?`);
      params.push(value);
    }
  }
  params.push(limit);
  return db
    .prepare(
      `SELECT
        e.index_entry_id AS index_entry_id,
        e.source_surface AS source_surface,
        e.source_record_ref AS source_record_ref,
        e.source_ref_id AS source_ref_id,
        e.candidate_ref AS candidate_ref,
        e.review_record_ref AS review_record_ref,
        e.promotion_decision_ref AS promotion_decision_ref,
        e.formation_receipt_ref AS formation_receipt_ref,
        e.perspective_id AS perspective_id,
        e.feedback_ref AS feedback_ref,
        e.provider_extraction_ref AS provider_extraction_ref,
        e.bounded_source_intake_ref AS bounded_source_intake_ref,
        e.bounded_title AS bounded_title,
        e.bounded_summary AS bounded_summary,
        e.stale_marker AS stale_marker,
        SUM(t.term_count) AS score
       FROM research_retrieval_index_entries e
       JOIN research_retrieval_index_terms t ON t.index_entry_id = e.index_entry_id
       WHERE ${clauses.join(" AND ")}
       GROUP BY e.index_entry_id
       ORDER BY score DESC, e.index_entry_id ASC
       LIMIT ?`,
    )
    .all(...params) as ResearchRetrievalIndexDbSearchRowV01[];
}

function rowToSearchResultItem(
  row: ResearchRetrievalIndexDbSearchRowV01,
  input: ResearchRetrievalIndexSearchInputV01,
  queryTerms: string[],
): ResearchRetrievalIndexSearchResultItemV01 {
  const authorityBoundary = createResearchRetrievalIndexAuthorityBoundaryV01({
    derived_index_search_now: true,
  });
  const boundedSnippet = createBoundedSnippet(row.bounded_summary, queryTerms);
  const resultWithoutRef = {
    search_request_id: input.search_request_id,
    index_entry_id: row.index_entry_id,
    score: Number(row.score ?? 0),
  };
  return {
    result_ref: `retrieval-search-result:${createResearchRetrievalSearchResultFingerprintV01(resultWithoutRef).slice(0, 24)}`,
    index_entry_id: row.index_entry_id,
    source_surface: row.source_surface,
    source_record_ref: row.source_record_ref,
    source_ref_id: row.source_ref_id,
    candidate_ref: row.candidate_ref,
    review_record_ref: row.review_record_ref,
    promotion_decision_ref: row.promotion_decision_ref,
    formation_receipt_ref: row.formation_receipt_ref,
    perspective_id: row.perspective_id,
    feedback_ref: row.feedback_ref,
    provider_extraction_ref: row.provider_extraction_ref,
    bounded_source_intake_ref: row.bounded_source_intake_ref,
    bounded_title: row.bounded_title,
    bounded_snippet: boundedSnippet,
    score: Number(row.score ?? 0),
    score_is_truth: false,
    score_is_promotion_readiness: false,
    retrieval_result_is_evidence: false,
    source_refs_are_lineage: true,
    stale_marker: row.stale_marker,
    reason_codes: uniqueSorted([
      "derived_index_search_now",
      "retrieval_result_not_evidence",
      "retrieval_score_not_truth",
      "retrieval_score_not_promotion_readiness",
      "source_refs_are_lineage_not_proof",
      ...(row.stale_marker === "stale" ? ["stale_marker_visible"] : []),
    ]),
    authority_boundary: authorityBoundary,
  };
}

function createDbSearchResult(input: {
  input: ResearchRetrievalIndexSearchInputV01;
  status: ResearchRetrievalIndexDbSearchStatusV01;
  results: ResearchRetrievalIndexSearchResultItemV01[];
  retrievalExecuted: boolean;
  authorityBoundary: ResearchRetrievalIndexAuthorityBoundaryV01;
  reasonCodes: string[];
  failureCodes?: string[];
}): ResearchRetrievalIndexSearchRuntimeResultV01 {
  return {
    search_version: RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_SEARCH_VERSION_V01,
    scope,
    status: input.status,
    search_request_id:
      isRecord(input.input) && typeof input.input.search_request_id === "string"
        ? input.input.search_request_id
        : "",
    result_count: input.results.length,
    results: input.results,
    retrieval_executed: input.retrievalExecuted,
    rag_answer_generated: false,
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    durable_state_written: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
    authority_boundary: input.authorityBoundary,
    reason_codes: uniqueSorted([
      ...input.reasonCodes,
      "retrieval_result_not_evidence",
      "retrieval_score_not_truth",
      "retrieval_score_not_promotion_readiness",
      "rag_answer_not_generated",
      "provider_call_not_executed",
      "prompt_not_sent",
      "source_fetch_not_executed",
      "embedding_not_created",
      "vector_search_not_executed",
      "proof_not_created",
      "evidence_not_created",
      "promotion_not_executed",
      "product_write_denied",
    ]),
    ...(input.failureCodes ? { failure_codes: uniqueSorted(input.failureCodes) } : {}),
  };
}

function createBoundedSnippet(summary: string, queryTerms: string[]): string {
  const normalizedSummary = summary.replace(/\s+/g, " ").trim();
  const lowerSummary = normalizedSummary.toLowerCase();
  const firstTerm = queryTerms.find((term) => lowerSummary.includes(term));
  if (!firstTerm) return normalizedSummary.slice(0, 220);
  const matchIndex = lowerSummary.indexOf(firstTerm);
  const start = Math.max(0, matchIndex - 60);
  return normalizedSummary.slice(start, start + 220);
}

function chooseRuntimeCompletionSearchStatus(
  failureCodes: string[],
): Exclude<ResearchRetrievalIndexDbSearchStatusV01, "searched" | "not_found" | "schema_missing"> {
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

function isSafeRuntimeCompletionText(value: string): boolean {
  const normalized = value.normalize("NFKC");
  if (normalized.includes("\0")) return false;
  if (normalized.length > 2000) return false;
  return !runtimeCompletionForbiddenTextMarkers.some((marker) =>
    normalized.toLowerCase().includes(marker.toLowerCase()),
  );
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

export function searchRebuildableRetrievalIndexV01(
  index: RebuildableRetrievalIndex,
  request: ResearchRetrievalIndexSearchRequest,
): ResearchRetrievalIndexSearchResult {
  const validation = validateResearchRetrievalIndexSearchRequestV01(request);
  if (!validation.passed) {
    return createSearchResult({
      request,
      index,
      status: request?.public_safe === false ? "blocked_private_or_raw_payload" : "rejected_invalid_request",
      hits: [],
      rejected: true,
      warnings: ["Search request was rejected before local derived index search."],
      reason_codes: uniqueSorted([
        ...baseSearchReasonCodes(index, request),
        ...(request?.public_safe === false ? ["retrieval_result_not_evidence" as const] : []),
      ]),
      retrieval_executed: false,
    });
  }

  if (!isSearchableDerivedIndex(index)) {
    return createSearchResult({
      request,
      index: undefined,
      status: "rejected_invalid_request",
      hits: [],
      rejected: true,
      warnings: ["Index shape was rejected before local derived index search."],
      reason_codes: uniqueSorted([...baseSearchReasonCodes(undefined, request), "index_missing"]),
      retrieval_executed: false,
    });
  }

  if (!index || index.index_id !== request.index_id) {
    return createSearchResult({
      request,
      index,
      status: "rejected_invalid_request",
      hits: [],
      rejected: true,
      warnings: ["Index is missing or does not match the search request index_id."],
      reason_codes: uniqueSorted([...baseSearchReasonCodes(index, request), "index_missing"]),
      retrieval_executed: false,
    });
  }

  if (deferredModes.includes(request.retrieval_mode)) {
    return createSearchResult({
      request,
      index,
      status: "blocked_unsupported_mode",
      hits: [],
      rejected: true,
      warnings: ["Requested retrieval mode is deferred for a later slice."],
      reason_codes: uniqueSorted([
        ...baseSearchReasonCodes(index, request),
        "retrieval_mode_unsupported",
        ...deferredReasonCodes(request.retrieval_mode),
      ]),
      retrieval_executed: false,
    });
  }

  if (request.retrieval_mode === "no_retrieval") {
    return createSearchResult({
      request,
      index,
      status: "no_matches",
      hits: [],
      rejected: false,
      warnings: [],
      reason_codes: uniqueSorted([
        ...baseSearchReasonCodes(index, request),
        "retrieval_mode_supported",
        "no_retrieval_requested",
        "entry_match_not_found",
      ]),
      retrieval_executed: false,
    });
  }

  const hits = buildHits(index, request);
  return createSearchResult({
    request,
    index,
    status: hits.length > 0 ? "candidate_only" : "no_matches",
    hits,
    rejected: false,
    warnings: hits.some((hit) => hit.stale_warning)
      ? ["Stale index entries are candidate-only review aids and cannot override current state."]
      : [],
    reason_codes: uniqueSorted([
      ...baseSearchReasonCodes(index, request),
      "retrieval_mode_supported",
      "bounded_local_search_executed",
      modeExecutedReasonCode(request.retrieval_mode),
      hits.length > 0 ? "entry_match_found" : "entry_match_not_found",
      ...(hits.some((hit) => hit.stale_warning) ? ["stale_result_warning" as const] : []),
    ]),
    retrieval_executed: true,
  });
}

export function validateResearchRetrievalIndexSearchRequestV01(
  request: unknown,
): RebuildableRetrievalIndexValidationResult {
  const failureCodes: string[] = [];
  if (!isRecord(request)) return { passed: false, failure_codes: ["request_not_object"] };
  if (request.search_request_version !== RESEARCH_RETRIEVAL_INDEX_SEARCH_REQUEST_VERSION) {
    failureCodes.push("search_request_version_invalid");
  }
  if (request.runtime_version !== runtimeVersion) failureCodes.push("runtime_version_invalid");
  if (request.contract_version !== contractVersion) failureCodes.push("contract_version_invalid");
  if (request.scope !== scope) failureCodes.push("scope_invalid");
  if (!isNonEmptyString(request.request_id)) failureCodes.push("request_id_missing");
  if (!isNonEmptyString(request.index_id)) failureCodes.push("index_id_missing");
  if (!searchModes.includes(request.retrieval_mode as ResearchRetrievalIndexSearchMode)) {
    failureCodes.push("retrieval_mode_invalid");
  }
  if (request.public_safe !== true) failureCodes.push("public_safe_required");
  if (typeof request.bounded_query_summary !== "string") {
    failureCodes.push("bounded_query_summary_invalid");
  }
  if (
    request.retrieval_mode !== "metadata_lookup" &&
    request.retrieval_mode !== "no_retrieval" &&
    typeof request.bounded_query_summary === "string" &&
    request.bounded_query_summary.trim().length === 0
  ) {
    failureCodes.push("bounded_query_summary_missing");
  }
  if (!isSearchFilters(request.filters)) failureCodes.push("filters_invalid");
  if (!Number.isInteger(request.limit) || Number(request.limit) < 1) {
    failureCodes.push("limit_invalid");
  }
  if (!Array.isArray(request.reason_codes)) failureCodes.push("reason_codes_invalid");
  if (!isRecord(request.authority_boundary)) failureCodes.push("authority_boundary_invalid");
  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

export function createSearchHitScoreBandV01(
  scoreHint: number,
): "none" | "low" | "medium" | "high" {
  if (scoreHint >= 3) return "high";
  if (scoreHint === 2) return "medium";
  if (scoreHint === 1) return "low";
  return "none";
}

function buildHits(
  index: RebuildableRetrievalIndex,
  request: ResearchRetrievalIndexSearchRequest,
): ResearchRetrievalIndexSearchHit[] {
  const queryTokens = tokenizeBoundedSearchText(request.bounded_query_summary);
  const limit = Math.min(Math.max(request.limit || 10, 1), 20);
  const scored = index.entries
    .filter((entry) => entryMatchesFilters(entry, request.filters))
    .map((entry) => scoreEntry(entry, queryTokens, request))
    .filter((hit) => hit.score_hint > 0 || request.retrieval_mode === "metadata_lookup")
    .sort((left, right) => right.score_hint - left.score_hint || left.entry_ref.localeCompare(right.entry_ref))
    .slice(0, limit);
  return scored.map((hit, index) => ({ ...hit, rank: index + 1 }));
}

function scoreEntry(
  entry: RebuildableRetrievalIndexEntry,
  queryTokens: string[],
  request: ResearchRetrievalIndexSearchRequest,
): ResearchRetrievalIndexSearchHit {
  const entryTokens = tokenizeBoundedSearchText([entry.bounded_title, entry.bounded_summary, ...entry.tags].join(" "));
  const matchedTerms =
    request.retrieval_mode === "metadata_lookup"
      ? []
      : queryTokens.filter((token) => entryTokens.includes(token));
  const filterScore = request.retrieval_mode === "hybrid_candidate_retrieval" ? countMatchedFilterFamilies(entry, request.filters) : 0;
  const scoreHint =
    request.retrieval_mode === "metadata_lookup"
      ? Math.max(1, countMatchedFilterFamilies(entry, request.filters))
      : matchedTerms.length + filterScore;
  const staleWarning = entry.freshness_status === "stale";
  return {
    rank: 0,
    entry_id: entry.entry_id,
    entry_ref: entry.entry_ref,
    entry_kind: entry.entry_kind,
    bounded_title: entry.bounded_title,
    bounded_summary: entry.bounded_summary,
    source_refs: [...entry.source_refs].sort(),
    candidate_refs: [...entry.candidate_refs].sort(),
    review_memory_refs: [...entry.review_memory_refs].sort(),
    durable_summary_refs: [...entry.durable_summary_refs].sort(),
    feedback_refs: [...entry.feedback_refs].sort(),
    matched_terms: uniqueSorted(matchedTerms),
    score_hint: scoreHint,
    score_band: createSearchHitScoreBandV01(scoreHint),
    stale_warning: staleWarning,
    retrieval_result_is_evidence: false,
    retrieval_score_is_truth_score: false,
    retrieval_score_is_promotion_readiness: false,
    reason_codes: uniqueSorted([
      "entry_match_found",
      "retrieval_result_not_evidence",
      "retrieval_score_not_truth_score",
      "retrieval_score_not_promotion_readiness",
      ...(staleWarning ? ["stale_result_warning" as const] : []),
    ]),
  };
}

function createSearchResult(input: {
  request: ResearchRetrievalIndexSearchRequest;
  index: RebuildableRetrievalIndex | undefined;
  status: ResearchRetrievalIndexSearchStatus;
  hits: ResearchRetrievalIndexSearchHit[];
  rejected: boolean;
  warnings: string[];
  reason_codes: ResearchRetrievalIndexSearchReasonCode[];
  retrieval_executed: boolean;
}): ResearchRetrievalIndexSearchResult {
  return {
    search_result_version: RESEARCH_RETRIEVAL_INDEX_SEARCH_RESULT_VERSION,
    runtime_version: runtimeVersion,
    contract_version: contractVersion,
    scope,
    request_id: input.request?.request_id ?? "",
    index_id: input.request?.index_id ?? input.index?.index_id ?? "",
    status: input.status,
    hits: input.hits,
    rejected: input.rejected,
    warnings: input.warnings,
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      "retrieval_result_not_evidence",
      "retrieval_score_not_truth_score",
      "retrieval_score_not_promotion_readiness",
      "rag_answer_not_generated",
      "embedding_not_created",
      "vector_search_not_executed",
      "provider_call_not_executed",
      "prompt_not_sent",
      "source_fetch_not_executed",
      "file_read_not_executed",
      "db_query_not_executed",
      "proof_not_created",
      "evidence_not_created",
      "promotion_not_executed",
      "product_write_denied",
    ]),
    retrieval_executed: input.retrieval_executed,
    rag_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    semantic_embedding_search_executed: false,
    rerank_executed: false,
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    file_read_executed: false,
    db_query_executed: false,
    proof_or_evidence_created: false,
    perspective_promoted: false,
    product_write_executed: false,
    authority_boundary: createSearchRuntimeBoundary(),
  };
}

function baseSearchReasonCodes(
  index: RebuildableRetrievalIndex | undefined,
  request: ResearchRetrievalIndexSearchRequest,
): ResearchRetrievalIndexSearchReasonCode[] {
  return uniqueSorted([
    index ? "index_present" : "index_missing",
    request?.bounded_query_summary ? "query_summary_present" : "query_summary_missing",
  ]);
}

function deferredReasonCodes(
  mode: ResearchRetrievalIndexSearchMode,
): ResearchRetrievalIndexSearchReasonCode[] {
  if (mode === "semantic_candidate_retrieval") return ["semantic_embedding_search_deferred"];
  if (mode === "rag_context_preview") return ["rag_context_preview_deferred"];
  if (mode === "rerank_candidate_preview") return ["rerank_deferred"];
  if (mode === "citation_context_preview") return ["citation_context_preview_deferred"];
  return ["semantic_embedding_search_deferred", "rag_context_preview_deferred", "rerank_deferred"];
}

function modeExecutedReasonCode(
  mode: ResearchRetrievalIndexSearchMode,
): ResearchRetrievalIndexSearchReasonCode {
  if (mode === "metadata_lookup") return "metadata_lookup_executed";
  if (mode === "hybrid_candidate_retrieval") return "hybrid_search_executed";
  return "lexical_search_executed";
}

function entryMatchesFilters(
  entry: RebuildableRetrievalIndexEntry,
  filters: ResearchRetrievalIndexSearchFilters,
): boolean {
  return (
    matchesAny(filters.entry_kinds, [entry.entry_kind]) &&
    matchesAny(filters.source_refs, entry.source_refs) &&
    matchesAny(filters.candidate_refs, entry.candidate_refs) &&
    matchesAny(filters.review_memory_refs, entry.review_memory_refs) &&
    matchesAny(filters.durable_summary_refs, entry.durable_summary_refs) &&
    matchesAny(filters.feedback_refs, entry.feedback_refs) &&
    matchesAny(filters.freshness_statuses, [entry.freshness_status])
  );
}

function countMatchedFilterFamilies(
  entry: RebuildableRetrievalIndexEntry,
  filters: ResearchRetrievalIndexSearchFilters,
): number {
  return [
    filters.entry_kinds.length > 0 && matchesAny(filters.entry_kinds, [entry.entry_kind]),
    filters.source_refs.length > 0 && matchesAny(filters.source_refs, entry.source_refs),
    filters.candidate_refs.length > 0 && matchesAny(filters.candidate_refs, entry.candidate_refs),
    filters.review_memory_refs.length > 0 && matchesAny(filters.review_memory_refs, entry.review_memory_refs),
    filters.durable_summary_refs.length > 0 && matchesAny(filters.durable_summary_refs, entry.durable_summary_refs),
    filters.feedback_refs.length > 0 && matchesAny(filters.feedback_refs, entry.feedback_refs),
    filters.freshness_statuses.length > 0 && matchesAny(filters.freshness_statuses, [entry.freshness_status]),
  ].filter(Boolean).length;
}

function matchesAny(filterValues: string[], entryValues: string[]): boolean {
  if (filterValues.length === 0) return true;
  const entrySet = new Set(entryValues);
  return filterValues.some((filterValue) => entrySet.has(filterValue));
}

function isSearchFilters(value: unknown): value is ResearchRetrievalIndexSearchFilters {
  if (!isRecord(value)) return false;
  return (
    isStringArray(value.entry_kinds) &&
    value.entry_kinds.every((entryKind) => entryKinds.includes(entryKind as RebuildableRetrievalIndexEntryKind)) &&
    isStringArray(value.source_refs) &&
    isStringArray(value.candidate_refs) &&
    isStringArray(value.review_memory_refs) &&
    isStringArray(value.durable_summary_refs) &&
    isStringArray(value.feedback_refs) &&
    isStringArray(value.freshness_statuses) &&
    value.freshness_statuses.every((status) =>
      freshnessStatuses.includes(status as RebuildableRetrievalIndexFreshnessStatus),
    )
  );
}

function isSearchableDerivedIndex(value: unknown): value is RebuildableRetrievalIndex {
  return (
    isRecord(value) &&
    value.index_version === "rebuildable_retrieval_index.v0.1" &&
    value.runtime_version === runtimeVersion &&
    value.contract_version === contractVersion &&
    value.scope === scope &&
    isNonEmptyString(value.index_id) &&
    isNonEmptyString(value.built_at) &&
    value.roadmap_ref === "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md" &&
    value.contract_ref === "types/research-retrieval-runtime-contract.ts" &&
    value.build_status === "rebuilt" &&
    value.rebuildable === true &&
    value.derived_non_authoritative === true &&
    value.stale_index_cannot_override_current_state === true &&
    value.public_safe_only === true &&
    Array.isArray(value.entries) &&
    Array.isArray(value.token_records) &&
    isStringArray(value.source_refs) &&
    isStringArray(value.candidate_refs) &&
    isStringArray(value.review_memory_refs) &&
    isStringArray(value.durable_summary_refs) &&
    isStringArray(value.feedback_refs) &&
    isStringArray(value.boundary_notes) &&
    isRecord(value.authority_boundary) &&
    isNonEmptyString(value.index_fingerprint)
  );
}

function createSearchRuntimeBoundary(): RebuildableRetrievalIndexRuntimeBoundary {
  return {
    runtime_slice: runtimeVersion,
    rebuildable_index_runtime_now: true,
    bounded_local_index_rebuild_now: true,
    bounded_local_index_search_now: true,
    rag_answer_generation_now: false,
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
    provider_openai_call_now: false,
    prompt_sent_now: false,
    db_migration_now: false,
    production_db_read_or_write_now: false,
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
    retrieval_result_is_evidence: false,
    retrieval_score_is_truth_score: false,
    retrieval_score_is_promotion_readiness: false,
  };
}

function tokenizeBoundedSearchText(text: string): string[] {
  return uniqueSorted(
    text
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .split(/\s+/u)
      .filter((token) => token.length >= 2),
  );
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

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
