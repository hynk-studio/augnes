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
