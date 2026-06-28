import { createHash } from "node:crypto";

import {
  createResearchRetrievalIndexAuthorityBoundaryV01,
  replaceResearchRetrievalIndexEntriesV01,
  type ResearchRetrievalIndexAuthorityBoundaryV01,
  type ResearchRetrievalIndexDbLikeV01,
  type ResearchRetrievalIndexStoreEntryV01,
// @ts-ignore Direct Node smoke imports TS modules and requires explicit extension.
} from "./index-store.ts";

export const REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION =
  "rebuildable_retrieval_index_runtime.v0.1" as const;
export const REBUILDABLE_RETRIEVAL_INDEX_VERSION =
  "rebuildable_retrieval_index.v0.1" as const;
export const REBUILDABLE_RETRIEVAL_INDEX_ENTRY_VERSION =
  "rebuildable_retrieval_index_entry.v0.1" as const;
export const RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_REBUILD_VERSION_V01 =
  "research_retrieval_index_runtime_completion_rebuild.v0.1" as const;
export const RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_INDEX_VERSION_V01 =
  "research_retrieval_index_runtime_completion_index.v0.1" as const;

const contractVersion = "research_retrieval_runtime_contract.v0.1" as const;
const scope = "project:augnes" as const;
const roadmapRef =
  "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md" as const;
const contractRef = "types/research-retrieval-runtime-contract.ts" as const;
const buildReportVersion = "rebuildable_retrieval_index_build_report.v0.1" as const;

export type RebuildableRetrievalIndexEntryKind =
  | "source_ref_metadata"
  | "candidate_summary"
  | "review_note_summary"
  | "perspective_delta_summary"
  | "formation_receipt_summary"
  | "feedback_summary"
  | "manual_bounded_context"
  | "unknown";

export type RebuildableRetrievalIndexBuildStatus =
  | "rebuilt"
  | "rejected_empty_input"
  | "rejected_private_or_raw_payload"
  | "rejected_invalid_entry"
  | "rejected_unsupported_entry_kind";

export type RebuildableRetrievalIndexFreshnessStatus =
  | "fresh"
  | "stale"
  | "unknown";

export type RebuildableRetrievalIndexPrivacyClass =
  | "public_safe_refs_only"
  | "private_ref_only"
  | "blocked_raw_private_payload"
  | "blocked_secret_like_payload";

export type RebuildableRetrievalIndexRedactionStatus =
  | "not_needed"
  | "redacted"
  | "blocked_secret_like_pattern"
  | "blocked_raw_payload"
  | "blocked_private_location";

export type RebuildableRetrievalIndexReasonCode =
  | "roadmap_file_present"
  | "contract_ref_present"
  | "entry_ref_present"
  | "entry_ref_missing"
  | "entry_kind_supported"
  | "entry_kind_unknown"
  | "bounded_summary_present"
  | "bounded_summary_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "candidate_ref_present"
  | "review_memory_ref_present"
  | "durable_summary_ref_present"
  | "feedback_ref_present"
  | "public_safe_entry"
  | "private_or_raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "local_path_blocked"
  | "private_url_blocked"
  | "raw_source_body_blocked"
  | "raw_provider_output_blocked"
  | "raw_retrieval_output_blocked"
  | "index_rebuilt_from_caller_input"
  | "index_is_rebuildable"
  | "index_is_derived"
  | "index_is_non_authoritative"
  | "stale_index_cannot_override_current_state"
  | "lexical_tokens_created"
  | "embedding_not_created"
  | "vector_search_not_executed"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "source_fetch_not_executed"
  | "file_read_not_executed"
  | "db_write_not_executed"
  | "proof_not_created"
  | "evidence_not_created"
  | "promotion_not_executed"
  | "product_write_denied";

export interface RebuildableRetrievalIndexRuntimeBoundary {
  runtime_slice: typeof REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION;
  rebuildable_index_runtime_now: true;
  bounded_local_index_rebuild_now: true;
  bounded_local_index_search_now: boolean;
  rag_answer_generation_now: false;
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
  provider_openai_call_now: false;
  prompt_sent_now: false;
  db_migration_now: false;
  production_db_read_or_write_now: false;
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
  retrieval_result_is_evidence: false;
  retrieval_score_is_truth_score: false;
  retrieval_score_is_promotion_readiness: false;
}

export interface RebuildableRetrievalIndexEntry {
  entry_version: typeof REBUILDABLE_RETRIEVAL_INDEX_ENTRY_VERSION;
  scope: typeof scope;
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
  tags: string[];
  updated_at: string;
  public_safe: boolean;
  privacy_class: RebuildableRetrievalIndexPrivacyClass;
  redaction_status: RebuildableRetrievalIndexRedactionStatus;
  freshness_status: RebuildableRetrievalIndexFreshnessStatus;
  reason_codes: RebuildableRetrievalIndexReasonCode[];
}

export interface RebuildableRetrievalIndexBuildInput {
  runtime_version: typeof REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION;
  contract_version: typeof contractVersion;
  scope: typeof scope;
  index_id: string;
  requested_at: string;
  requested_by_surface:
    | "operator"
    | "review_memory_ui"
    | "provider_assisted_extraction_runtime"
    | "foundation_lifecycle_review_memory_readonly_ui"
    | "roadmap_guided_codex_slice"
    | "unknown";
  roadmap_ref: typeof roadmapRef;
  contract_ref: typeof contractRef;
  entries: RebuildableRetrievalIndexEntry[];
  max_entries: number;
  max_summary_chars: number;
  public_safe_only: boolean;
  boundary_notes: string[];
  reason_codes: RebuildableRetrievalIndexReasonCode[];
}

export interface RebuildableRetrievalIndexTokenRecord {
  token: string;
  entry_refs: string[];
  entry_count: number;
}

export interface RebuildableRetrievalIndex {
  index_version: typeof REBUILDABLE_RETRIEVAL_INDEX_VERSION;
  runtime_version: typeof REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION;
  contract_version: typeof contractVersion;
  scope: typeof scope;
  index_id: string;
  built_at: string;
  roadmap_ref: typeof roadmapRef;
  contract_ref: typeof contractRef;
  build_status: RebuildableRetrievalIndexBuildStatus;
  rebuildable: true;
  derived_non_authoritative: true;
  stale_index_cannot_override_current_state: true;
  public_safe_only: true;
  entries: RebuildableRetrievalIndexEntry[];
  token_records: RebuildableRetrievalIndexTokenRecord[];
  entry_kind_counts: Record<RebuildableRetrievalIndexEntryKind, number>;
  source_refs: string[];
  candidate_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  boundary_notes: string[];
  reason_codes: RebuildableRetrievalIndexReasonCode[];
  authority_boundary: RebuildableRetrievalIndexRuntimeBoundary;
  index_fingerprint: string;
}

export interface RebuildableRetrievalIndexBuildReport {
  report_version: typeof buildReportVersion;
  runtime_version: typeof REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION;
  contract_version: typeof contractVersion;
  scope: typeof scope;
  index_id: string;
  build_status: RebuildableRetrievalIndexBuildStatus;
  index: RebuildableRetrievalIndex | null;
  rejected_entry_refs: string[];
  warnings: string[];
  reason_codes: RebuildableRetrievalIndexReasonCode[];
  authority_boundary: RebuildableRetrievalIndexRuntimeBoundary;
}

export interface RebuildableRetrievalIndexValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export type ResearchRetrievalIndexRebuildRuntimeStatusV01 =
  | "rebuilt"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "rejected";

export interface ResearchRetrievalIndexRebuildEntryInputV01 {
  index_entry_id?: string;
  index_version?: string;
  scope?: typeof scope;
  source_surface?: string;
  source_record_ref?: string;
  source_ref_id?: string;
  candidate_ref?: string;
  review_record_ref?: string;
  promotion_decision_ref?: string;
  formation_receipt_ref?: string;
  perspective_id?: string;
  feedback_ref?: string;
  provider_extraction_ref?: string;
  bounded_source_intake_ref?: string;
  bounded_title?: string;
  bounded_summary?: string;
  token_terms?: string[];
  public_safe?: boolean;
  stale_marker?: "fresh" | "stale" | "unknown";
  source_updated_at?: string;
  indexed_at?: string;
  reason_codes?: string[];
  authority_boundary?: Record<string, unknown>;
}

export interface ResearchRetrievalIndexRebuildInputV01 {
  rebuild_version: typeof RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_REBUILD_VERSION_V01;
  scope: typeof scope;
  rebuild_request_id: string;
  requested_by: string;
  requested_at: string;
  db_path?: string;
  index_version: typeof RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_INDEX_VERSION_V01 | string;
  entries: ResearchRetrievalIndexRebuildEntryInputV01[];
  rebuild_policy?: "replace_scope_index_version" | "replace";
  stale_policy?: "preserve_entry_stale_markers" | "mark_unknown";
  authority_boundary?: Record<string, unknown>;
  reason_codes?: string[];
}

export interface ResearchRetrievalIndexRebuildValidationResultV01 {
  passed: boolean;
  status: Exclude<ResearchRetrievalIndexRebuildRuntimeStatusV01, "rebuilt"> | "valid";
  failure_codes: string[];
  reason_codes: string[];
  authority_boundary: ResearchRetrievalIndexAuthorityBoundaryV01;
}

export interface ResearchRetrievalIndexRebuildResultV01 {
  rebuild_version: typeof RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_REBUILD_VERSION_V01;
  scope: typeof scope;
  status: ResearchRetrievalIndexRebuildRuntimeStatusV01;
  rebuild_request_id: string;
  index_version: string;
  entry_count: number;
  stale_count: number;
  duplicate_entry_count: number;
  derived_index_write_now: boolean;
  provider_call_executed: false;
  prompt_sent: false;
  source_fetch_executed: false;
  live_crawling_executed: false;
  embedding_created: false;
  vector_search_executed: false;
  rag_answer_generated: false;
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

const supportedEntryKinds: RebuildableRetrievalIndexEntryKind[] = [
  "source_ref_metadata",
  "candidate_summary",
  "review_note_summary",
  "perspective_delta_summary",
  "formation_receipt_summary",
  "feedback_summary",
  "manual_bounded_context",
];

const entryKinds: RebuildableRetrievalIndexEntryKind[] = [
  ...supportedEntryKinds,
  "unknown",
];

const freshnessStatuses: RebuildableRetrievalIndexFreshnessStatus[] = [
  "fresh",
  "stale",
  "unknown",
];

const privacyClasses: RebuildableRetrievalIndexPrivacyClass[] = [
  "public_safe_refs_only",
  "private_ref_only",
  "blocked_raw_private_payload",
  "blocked_secret_like_payload",
];

const redactionStatuses: RebuildableRetrievalIndexRedactionStatus[] = [
  "not_needed",
  "redacted",
  "blocked_secret_like_pattern",
  "blocked_raw_payload",
  "blocked_private_location",
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
  "raw retrieval payload blocked by runtime fixture",
  "secret-like retrieval input blocked by runtime fixture",
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
  "raw source text",
  "raw source body",
  "raw provider output",
  "raw retrieval output",
  "hidden reasoning",
  "chain-of-thought",
  "actual provider response",
  "actual source body",
  "localhost/",
  "127.0.0.1",
  "file://",
  "http://localhost",
  "https://localhost",
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

const runtimeCompletionSourceSurfaces = [
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
];

const authorityBoundaryFalseFields: Array<keyof RebuildableRetrievalIndexRuntimeBoundary> = [
  "rag_answer_generation_now",
  "embedding_created_now",
  "vector_search_now",
  "semantic_embedding_search_now",
  "external_retrieval_provider_now",
  "source_fetch_now",
  "crawler_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "raw_source_body_storage_now",
  "raw_provider_output_storage_now",
  "raw_retrieval_output_storage_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "db_migration_now",
  "production_db_read_or_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "perspective_promotion_now",
  "durable_perspective_state_now",
  "work_mutation_now",
  "git_ledger_export_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "product_id_allocation_authority",
  "source_of_truth",
  "retrieval_result_is_evidence",
  "retrieval_score_is_truth_score",
  "retrieval_score_is_promotion_readiness",
];

export function createRebuildableRetrievalIndexRuntimeBoundaryV01(options?: {
  boundedLocalIndexSearchNow?: boolean;
}): RebuildableRetrievalIndexRuntimeBoundary {
  return {
    runtime_slice: REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION,
    rebuildable_index_runtime_now: true,
    bounded_local_index_rebuild_now: true,
    bounded_local_index_search_now: Boolean(options?.boundedLocalIndexSearchNow),
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

export function buildRebuildableRetrievalIndexV01(
  input: RebuildableRetrievalIndexBuildInput,
): RebuildableRetrievalIndexBuildReport {
  const inputValidation = validateRebuildableRetrievalIndexBuildInputV01(input);
  const status = chooseBuildStatus(input, inputValidation);
  const rejectedEntryRefs = collectRejectedEntryRefs(input);
  const baseReasonCodes = createBaseBuildReasonCodes(input, status);
  const authorityBoundary = createRebuildableRetrievalIndexRuntimeBoundaryV01();

  if (status !== "rebuilt" || !inputValidation.passed) {
    return {
      report_version: buildReportVersion,
      runtime_version: REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION,
      contract_version: contractVersion,
      scope,
      index_id: typeof input?.index_id === "string" ? input.index_id : "",
      build_status: status,
      index: null,
      rejected_entry_refs: rejectedEntryRefs,
      warnings: createBuildWarnings(status),
      reason_codes: uniqueSorted([
        ...baseReasonCodes,
        ...failureCodesToReasonCodes(inputValidation.failure_codes),
      ]),
      authority_boundary: authorityBoundary,
    };
  }

  const entries = [...input.entries].sort((left, right) =>
    left.entry_ref.localeCompare(right.entry_ref),
  );
  const tokenRecords = createTokenRecords(entries);
  const indexWithoutFingerprint: Omit<RebuildableRetrievalIndex, "index_fingerprint"> = {
    index_version: REBUILDABLE_RETRIEVAL_INDEX_VERSION,
    runtime_version: REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION,
    contract_version: contractVersion,
    scope,
    index_id: input.index_id,
    built_at: input.requested_at,
    roadmap_ref: roadmapRef,
    contract_ref: contractRef,
    build_status: "rebuilt",
    rebuildable: true,
    derived_non_authoritative: true,
    stale_index_cannot_override_current_state: true,
    public_safe_only: true,
    entries,
    token_records: tokenRecords,
    entry_kind_counts: countEntryKinds(entries),
    source_refs: uniqueSorted(entries.flatMap((entry) => entry.source_refs)),
    candidate_refs: uniqueSorted(entries.flatMap((entry) => entry.candidate_refs)),
    review_memory_refs: uniqueSorted(entries.flatMap((entry) => entry.review_memory_refs)),
    durable_summary_refs: uniqueSorted(entries.flatMap((entry) => entry.durable_summary_refs)),
    feedback_refs: uniqueSorted(entries.flatMap((entry) => entry.feedback_refs)),
    boundary_notes: uniqueSorted([
      ...input.boundary_notes,
      "The index is rebuildable.",
      "The index is derived.",
      "The index is non-authoritative.",
      "Search results are not evidence.",
      "Product-write remains parked by #686.",
    ]),
    reason_codes: uniqueSorted([
      ...baseReasonCodes,
      "index_rebuilt_from_caller_input",
      "index_is_rebuildable",
      "index_is_derived",
      "index_is_non_authoritative",
      "stale_index_cannot_override_current_state",
      "lexical_tokens_created",
    ]),
    authority_boundary: authorityBoundary,
  };
  const index: RebuildableRetrievalIndex = {
    ...indexWithoutFingerprint,
    index_fingerprint: createRebuildableRetrievalIndexFingerprintV01(indexWithoutFingerprint),
  };
  return {
    report_version: buildReportVersion,
    runtime_version: REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION,
    contract_version: contractVersion,
    scope,
    index_id: input.index_id,
    build_status: "rebuilt",
    index,
    rejected_entry_refs: [],
    warnings: [],
    reason_codes: index.reason_codes,
    authority_boundary: authorityBoundary,
  };
}

export function validateRebuildableRetrievalIndexEntryV01(
  entry: unknown,
): RebuildableRetrievalIndexValidationResult {
  const failureCodes: string[] = [];
  if (!isRecord(entry)) {
    return { passed: false, failure_codes: ["entry_not_object"] };
  }
  if (entry.entry_version !== REBUILDABLE_RETRIEVAL_INDEX_ENTRY_VERSION) {
    failureCodes.push("entry_version_invalid");
  }
  if (entry.scope !== scope) failureCodes.push("scope_invalid");
  for (const key of ["entry_id", "entry_ref", "bounded_title", "bounded_summary", "updated_at"]) {
    if (!isNonEmptyString(entry[key])) failureCodes.push(`${key}_missing`);
  }
  if (!entryKinds.includes(entry.entry_kind as RebuildableRetrievalIndexEntryKind)) {
    failureCodes.push("entry_kind_invalid");
  } else if (entry.entry_kind === "unknown") {
    failureCodes.push("entry_kind_unknown");
  }
  for (const key of ["source_refs", "candidate_refs", "review_memory_refs", "durable_summary_refs", "feedback_refs", "tags"]) {
    if (!isStringArray(entry[key])) failureCodes.push(`${key}_invalid`);
  }
  if (entry.public_safe !== true) failureCodes.push("public_safe_required");
  if (!privacyClasses.includes(entry.privacy_class as RebuildableRetrievalIndexPrivacyClass)) {
    failureCodes.push("privacy_class_invalid");
  }
  if (entry.privacy_class !== "public_safe_refs_only") {
    failureCodes.push("privacy_class_not_public_safe");
  }
  if (!redactionStatuses.includes(entry.redaction_status as RebuildableRetrievalIndexRedactionStatus)) {
    failureCodes.push("redaction_status_invalid");
  }
  if (entry.redaction_status !== "not_needed" && entry.redaction_status !== "redacted") {
    failureCodes.push("redaction_status_blocked");
  }
  if (!freshnessStatuses.includes(entry.freshness_status as RebuildableRetrievalIndexFreshnessStatus)) {
    failureCodes.push("freshness_status_invalid");
  }
  if (!Array.isArray(entry.reason_codes)) failureCodes.push("reason_codes_invalid");
  for (const value of [
    entry.entry_id,
    entry.entry_ref,
    entry.bounded_title,
    entry.bounded_summary,
    ...(isStringArray(entry.source_refs) ? entry.source_refs : []),
    ...(isStringArray(entry.candidate_refs) ? entry.candidate_refs : []),
    ...(isStringArray(entry.review_memory_refs) ? entry.review_memory_refs : []),
    ...(isStringArray(entry.durable_summary_refs) ? entry.durable_summary_refs : []),
    ...(isStringArray(entry.feedback_refs) ? entry.feedback_refs : []),
    ...(isStringArray(entry.tags) ? entry.tags : []),
  ]) {
    if (typeof value === "string" && containsForbiddenMarker(value)) {
      failureCodes.push("forbidden_marker_present");
      break;
    }
  }
  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

export function validateRebuildableRetrievalIndexBuildInputV01(
  input: unknown,
): RebuildableRetrievalIndexValidationResult {
  const failureCodes: string[] = [];
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_not_object"] };
  }
  if (input.runtime_version !== REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION) {
    failureCodes.push("runtime_version_invalid");
  }
  if (input.contract_version !== contractVersion) failureCodes.push("contract_version_invalid");
  if (input.scope !== scope) failureCodes.push("scope_invalid");
  if (!isNonEmptyString(input.index_id)) failureCodes.push("index_id_missing");
  if (!isNonEmptyString(input.requested_at)) failureCodes.push("requested_at_missing");
  if (input.roadmap_ref !== roadmapRef) failureCodes.push("roadmap_ref_invalid");
  if (input.contract_ref !== contractRef) failureCodes.push("contract_ref_invalid");
  if (!Array.isArray(input.entries)) {
    failureCodes.push("entries_invalid");
  } else {
    if (input.entries.length === 0) failureCodes.push("entries_empty");
    if (typeof input.max_entries === "number" && input.entries.length > input.max_entries) {
      failureCodes.push("entries_exceed_max_entries");
    }
    for (const entry of input.entries) {
      const entryValidation = validateRebuildableRetrievalIndexEntryV01(entry);
      failureCodes.push(...entryValidation.failure_codes);
      if (
        isRecord(entry) &&
        typeof input.max_summary_chars === "number" &&
        typeof entry.bounded_summary === "string" &&
        entry.bounded_summary.length > input.max_summary_chars
      ) {
        failureCodes.push("bounded_summary_exceeds_max_summary_chars");
      }
    }
  }
  if (!Number.isInteger(input.max_entries) || Number(input.max_entries) < 1) {
    failureCodes.push("max_entries_invalid");
  }
  if (!Number.isInteger(input.max_summary_chars) || Number(input.max_summary_chars) < 1) {
    failureCodes.push("max_summary_chars_invalid");
  }
  if (input.public_safe_only !== true) failureCodes.push("public_safe_only_required");
  if (!isStringArray(input.boundary_notes)) {
    failureCodes.push("boundary_notes_invalid");
  } else if (input.boundary_notes.some((note) => containsForbiddenMarker(note))) {
    failureCodes.push("boundary_notes_forbidden_marker_present");
  }
  if (!Array.isArray(input.reason_codes)) failureCodes.push("reason_codes_invalid");
  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

export function validateRebuildableRetrievalIndexV01(
  index: unknown,
): RebuildableRetrievalIndexValidationResult {
  const failureCodes: string[] = [];
  if (!isRecord(index)) {
    return { passed: false, failure_codes: ["index_not_object"] };
  }
  if (index.index_version !== REBUILDABLE_RETRIEVAL_INDEX_VERSION) {
    failureCodes.push("index_version_invalid");
  }
  if (index.runtime_version !== REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION) {
    failureCodes.push("runtime_version_invalid");
  }
  if (index.contract_version !== contractVersion) failureCodes.push("contract_version_invalid");
  if (index.scope !== scope) failureCodes.push("scope_invalid");
  if (!isNonEmptyString(index.index_id)) failureCodes.push("index_id_missing");
  if (!isNonEmptyString(index.built_at)) failureCodes.push("built_at_missing");
  if (index.roadmap_ref !== roadmapRef) failureCodes.push("roadmap_ref_invalid");
  if (index.contract_ref !== contractRef) failureCodes.push("contract_ref_invalid");
  if (index.build_status !== "rebuilt") failureCodes.push("build_status_invalid");
  if (index.rebuildable !== true) failureCodes.push("rebuildable_required");
  if (index.derived_non_authoritative !== true) {
    failureCodes.push("derived_non_authoritative_required");
  }
  if (index.stale_index_cannot_override_current_state !== true) {
    failureCodes.push("stale_index_cannot_override_current_state_required");
  }
  if (index.public_safe_only !== true) failureCodes.push("public_safe_only_required");
  if (!Array.isArray(index.entries)) {
    failureCodes.push("entries_invalid");
  } else {
    for (const entry of index.entries) {
      failureCodes.push(...validateRebuildableRetrievalIndexEntryV01(entry).failure_codes);
    }
  }
  if (!Array.isArray(index.token_records)) {
    failureCodes.push("token_records_invalid");
  }
  for (const key of [
    "source_refs",
    "candidate_refs",
    "review_memory_refs",
    "durable_summary_refs",
    "feedback_refs",
  ]) {
    if (!isStringArray(index[key])) failureCodes.push(`${key}_invalid`);
  }
  if (!isStringArray(index.boundary_notes)) {
    failureCodes.push("boundary_notes_invalid");
  } else if (index.boundary_notes.some((note) => containsForbiddenMarker(note))) {
    failureCodes.push("boundary_notes_forbidden_marker_present");
  }
  if (!isRecord(index.authority_boundary)) {
    failureCodes.push("authority_boundary_invalid");
  } else {
    if (index.authority_boundary.runtime_slice !== REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION) {
      failureCodes.push("authority_boundary_runtime_slice_invalid");
    }
    if (index.authority_boundary.rebuildable_index_runtime_now !== true) {
      failureCodes.push("authority_boundary_rebuildable_index_runtime_required");
    }
    if (index.authority_boundary.bounded_local_index_rebuild_now !== true) {
      failureCodes.push("authority_boundary_bounded_local_index_rebuild_required");
    }
    if (typeof index.authority_boundary.bounded_local_index_search_now !== "boolean") {
      failureCodes.push("authority_boundary_bounded_local_index_search_invalid");
    }
    for (const field of authorityBoundaryFalseFields) {
      if (index.authority_boundary[field] !== false) {
        failureCodes.push(`authority_boundary_${field}_must_be_false`);
      }
    }
  }
  if (!isNonEmptyString(index.index_fingerprint)) failureCodes.push("index_fingerprint_missing");
  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

export function createRebuildableRetrievalIndexFingerprintV01(
  index: Omit<RebuildableRetrievalIndex, "index_fingerprint">,
): string {
  return createHash("sha256").update(JSON.stringify(canonicalJson(index))).digest("hex");
}

export function tokenizeBoundedRetrievalTextV01(text: string): string[] {
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

export function tokenizeResearchRetrievalTextV01(text: string): string[] {
  return tokenizeBoundedRetrievalTextV01(text).slice(0, 80);
}

export function createResearchRetrievalIndexEntryIdV01(
  entry: ResearchRetrievalIndexRebuildEntryInputV01 | Record<string, unknown>,
): string {
  const sourceSurface = typeof entry.source_surface === "string" ? entry.source_surface : "unknown_surface";
  const sourceRecordRef = typeof entry.source_record_ref === "string" ? entry.source_record_ref : "unknown_record";
  const indexVersion =
    typeof entry.index_version === "string"
      ? entry.index_version
      : RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_INDEX_VERSION_V01;
  const fingerprintInput = {
    index_version: indexVersion,
    scope: typeof entry.scope === "string" ? entry.scope : scope,
    source_surface: sourceSurface,
    source_record_ref: sourceRecordRef,
    source_ref_id: typeof entry.source_ref_id === "string" ? entry.source_ref_id : null,
    candidate_ref: typeof entry.candidate_ref === "string" ? entry.candidate_ref : null,
    review_record_ref: typeof entry.review_record_ref === "string" ? entry.review_record_ref : null,
    promotion_decision_ref: typeof entry.promotion_decision_ref === "string" ? entry.promotion_decision_ref : null,
    formation_receipt_ref: typeof entry.formation_receipt_ref === "string" ? entry.formation_receipt_ref : null,
    perspective_id: typeof entry.perspective_id === "string" ? entry.perspective_id : null,
    feedback_ref: typeof entry.feedback_ref === "string" ? entry.feedback_ref : null,
    provider_extraction_ref:
      typeof entry.provider_extraction_ref === "string" ? entry.provider_extraction_ref : null,
    bounded_source_intake_ref:
      typeof entry.bounded_source_intake_ref === "string" ? entry.bounded_source_intake_ref : null,
    bounded_title: typeof entry.bounded_title === "string" ? entry.bounded_title : "",
    bounded_summary: typeof entry.bounded_summary === "string" ? entry.bounded_summary : "",
  };
  return `retrieval-index-entry:${createHash("sha256")
    .update(JSON.stringify(canonicalJson(fingerprintInput)))
    .digest("hex")
    .slice(0, 32)}`;
}

export function normalizeResearchRetrievalIndexEntryV01(
  entry: ResearchRetrievalIndexRebuildEntryInputV01,
): ResearchRetrievalIndexStoreEntryV01 {
  const indexVersion =
    typeof entry.index_version === "string" && entry.index_version.length > 0
      ? entry.index_version
      : RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_INDEX_VERSION_V01;
  const boundedTitle = String(entry.bounded_title ?? "").trim();
  const boundedSummary = String(entry.bounded_summary ?? "").trim();
  const tokenTerms = uniqueSorted([
    ...tokenizeResearchRetrievalTextV01(boundedTitle),
    ...tokenizeResearchRetrievalTextV01(boundedSummary),
    ...tokenizeResearchRetrievalTextV01(
      [
        entry.source_surface,
        entry.source_record_ref,
        entry.source_ref_id,
        entry.candidate_ref,
        entry.review_record_ref,
        entry.promotion_decision_ref,
        entry.formation_receipt_ref,
        entry.perspective_id,
        entry.feedback_ref,
        entry.provider_extraction_ref,
        entry.bounded_source_intake_ref,
      ]
        .filter((value): value is string => typeof value === "string")
        .join(" "),
    ),
    ...(Array.isArray(entry.token_terms) ? entry.token_terms.filter(isSafeRuntimeCompletionText) : []),
  ]).slice(0, 120);

  return {
    index_entry_id:
      typeof entry.index_entry_id === "string" && entry.index_entry_id.length > 0
        ? entry.index_entry_id
        : createResearchRetrievalIndexEntryIdV01({ ...entry, index_version: indexVersion, scope }),
    index_version: indexVersion,
    scope,
    source_surface: String(entry.source_surface ?? ""),
    source_record_ref: String(entry.source_record_ref ?? ""),
    source_ref_id: toNullableSafeString(entry.source_ref_id),
    candidate_ref: toNullableSafeString(entry.candidate_ref),
    review_record_ref: toNullableSafeString(entry.review_record_ref),
    promotion_decision_ref: toNullableSafeString(entry.promotion_decision_ref),
    formation_receipt_ref: toNullableSafeString(entry.formation_receipt_ref),
    perspective_id: toNullableSafeString(entry.perspective_id),
    feedback_ref: toNullableSafeString(entry.feedback_ref),
    provider_extraction_ref: toNullableSafeString(entry.provider_extraction_ref),
    bounded_source_intake_ref: toNullableSafeString(entry.bounded_source_intake_ref),
    bounded_title: boundedTitle,
    bounded_summary: boundedSummary,
    token_terms: tokenTerms,
    public_safe: entry.public_safe === true,
    stale_marker: entry.stale_marker ?? "unknown",
    source_updated_at:
      typeof entry.source_updated_at === "string" && entry.source_updated_at.length > 0
        ? entry.source_updated_at
        : "1970-01-01T00:00:00.000Z",
    indexed_at:
      typeof entry.indexed_at === "string" && entry.indexed_at.length > 0
        ? entry.indexed_at
        : "1970-01-01T00:00:00.000Z",
    reason_codes: uniqueSorted([
      ...(Array.isArray(entry.reason_codes) ? entry.reason_codes.filter(isSafeRuntimeCompletionText) : []),
      "index_is_derived",
      "retrieval_result_not_evidence",
      "retrieval_score_not_truth",
      "retrieval_score_not_promotion_readiness",
    ]),
    authority_boundary: createResearchRetrievalIndexAuthorityBoundaryV01({
      derived_index_write_now: true,
    }),
  };
}

export function validateResearchRetrievalRebuildInputV01(
  input: unknown,
): ResearchRetrievalIndexRebuildValidationResultV01 {
  const authorityBoundary = createResearchRetrievalIndexAuthorityBoundaryV01({
    derived_index_write_now: true,
  });
  const failureCodes: string[] = [];
  const reasonCodes: string[] = [
    "rebuildable_retrieval_index_runtime_completion",
    "explicit_operator_rebuild_only",
    "index_is_derived",
    "index_is_rebuildable",
    "source_refs_are_lineage_not_proof",
    "retrieval_result_not_evidence",
    "retrieval_score_not_truth",
    "retrieval_score_not_promotion_readiness",
    "provider_call_not_executed",
    "prompt_not_sent",
    "source_fetch_not_executed",
    "embedding_not_created",
    "vector_search_not_executed",
    "rag_answer_not_generated",
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
  if (input.rebuild_version !== RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_REBUILD_VERSION_V01) {
    failureCodes.push("rebuild_version_invalid");
  }
  if (input.scope !== scope) failureCodes.push("scope_invalid");
  if (!isNonEmptyString(input.rebuild_request_id)) failureCodes.push("rebuild_request_id_missing");
  if (!isNonEmptyString(input.requested_by)) failureCodes.push("requested_by_missing");
  if (!isNonEmptyString(input.requested_at)) failureCodes.push("requested_at_missing");
  if (!isNonEmptyString(input.index_version)) failureCodes.push("index_version_missing");
  if (!Array.isArray(input.entries)) {
    failureCodes.push("entries_invalid");
  } else {
    if (input.entries.length === 0) failureCodes.push("entries_empty");
    if (input.entries.length > 100) failureCodes.push("entries_exceed_runtime_limit");
    for (const [index, entry] of input.entries.entries()) {
      failureCodes.push(...validateRuntimeCompletionEntryV01(entry, index));
    }
  }
  if (input.db_path !== undefined && typeof input.db_path !== "string") {
    failureCodes.push("db_path_invalid");
  }
  if (!Array.isArray(input.reason_codes)) failureCodes.push("reason_codes_invalid");
  if (containsUnsafeRuntimeCompletionValue(input)) failureCodes.push("private_or_raw_payload_present");
  if (containsForbiddenAuthorityGrantRuntimeCompletion(input)) {
    failureCodes.push("forbidden_authority_present");
  }

  const status = chooseRuntimeCompletionRebuildStatus(failureCodes);
  return {
    passed: failureCodes.length === 0,
    status: failureCodes.length === 0 ? "valid" : status,
    failure_codes: uniqueSorted(failureCodes),
    reason_codes: uniqueSorted([
      ...reasonCodes,
      ...(failureCodes.length === 0 ? ["rebuild_input_valid"] : [status]),
      ...(failureCodes.includes("private_or_raw_payload_present")
        ? ["private_or_raw_payload_blocked"]
        : []),
      ...(failureCodes.includes("forbidden_authority_present") ? ["forbidden_authority_blocked"] : []),
    ]),
    authority_boundary: authorityBoundary,
  };
}

export function rebuildResearchRetrievalIndexV01(
  input: ResearchRetrievalIndexRebuildInputV01,
  db: ResearchRetrievalIndexDbLikeV01,
): ResearchRetrievalIndexRebuildResultV01 {
  const validation = validateResearchRetrievalRebuildInputV01(input);
  const authorityBoundary = createResearchRetrievalIndexAuthorityBoundaryV01({
    derived_index_write_now: validation.passed,
  });
  if (!validation.passed) {
    return {
      rebuild_version: RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_REBUILD_VERSION_V01,
      scope,
      status: validation.status === "valid" ? "rejected" : validation.status,
      rebuild_request_id: isRecord(input) && typeof input.rebuild_request_id === "string" ? input.rebuild_request_id : "",
      index_version: isRecord(input) && typeof input.index_version === "string" ? input.index_version : "",
      entry_count: 0,
      stale_count: 0,
      duplicate_entry_count: 0,
      derived_index_write_now: false,
      provider_call_executed: false,
      prompt_sent: false,
      source_fetch_executed: false,
      live_crawling_executed: false,
      embedding_created: false,
      vector_search_executed: false,
      rag_answer_generated: false,
      proof_or_evidence_created: false,
      claim_or_evidence_written: false,
      promotion_executed: false,
      durable_state_written: false,
      formation_receipt_written: false,
      product_write_executed: false,
      product_id_allocated: false,
      authority_boundary: authorityBoundary,
      reason_codes: validation.reason_codes,
      failure_codes: validation.failure_codes,
    };
  }

  const normalizedEntries = input.entries
    .map((entry) =>
      normalizeResearchRetrievalIndexEntryV01({
        ...entry,
        index_version: input.index_version,
        indexed_at: input.requested_at,
      }),
    )
    .sort((left, right) => left.index_entry_id.localeCompare(right.index_entry_id));
  const dedupedById = new Map<string, ResearchRetrievalIndexStoreEntryV01>();
  for (const entry of normalizedEntries) {
    if (!dedupedById.has(entry.index_entry_id)) dedupedById.set(entry.index_entry_id, entry);
  }
  const entries = [...dedupedById.values()];
  const duplicateEntryCount = normalizedEntries.length - entries.length;
  const storeResult = replaceResearchRetrievalIndexEntriesV01(
    {
      rebuild_version: input.rebuild_version,
      scope,
      rebuild_request_id: input.rebuild_request_id,
      requested_by: input.requested_by,
      requested_at: input.requested_at,
      db_path: input.db_path,
      index_version: input.index_version,
      entries,
      rebuild_policy: input.rebuild_policy,
      stale_policy: input.stale_policy,
      authority_boundary: input.authority_boundary,
      reason_codes: uniqueSorted([
        ...(input.reason_codes ?? []),
        "rebuildable_retrieval_index_runtime_completion",
        "derived_index_write_now",
        ...(duplicateEntryCount > 0 ? ["duplicate_entry_refs_deduped"] : []),
      ]),
    },
    db,
  );

  return {
    rebuild_version: input.rebuild_version,
    scope,
    status: storeResult.status === "rebuilt" ? "rebuilt" : "blocked_invalid_input",
    rebuild_request_id: input.rebuild_request_id,
    index_version: input.index_version,
    entry_count: storeResult.entry_count,
    stale_count: storeResult.stale_count,
    duplicate_entry_count: duplicateEntryCount,
    derived_index_write_now: storeResult.status === "rebuilt",
    provider_call_executed: false,
    prompt_sent: false,
    source_fetch_executed: false,
    live_crawling_executed: false,
    embedding_created: false,
    vector_search_executed: false,
    rag_answer_generated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    durable_state_written: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
    authority_boundary: storeResult.authority_boundary,
    reason_codes: uniqueSorted([
      ...storeResult.reason_codes,
      "rebuildable_retrieval_index_runtime_completion",
      "original_phase_3_6_runtime_gap_closed",
      "derived_index_rows_written",
      "index_is_derived",
      "index_is_rebuildable",
      "stale_marker_visible",
      "backrefs_visible",
      "retrieval_result_not_evidence",
      "retrieval_score_not_truth",
      "retrieval_score_not_promotion_readiness",
      "provider_call_not_executed",
      "prompt_not_sent",
      "source_fetch_not_executed",
      "embedding_not_created",
      "vector_search_not_executed",
      "rag_answer_not_generated",
      "proof_not_created",
      "evidence_not_created",
      "promotion_not_executed",
      "product_write_denied",
      ...(duplicateEntryCount > 0 ? ["duplicate_entry_refs_deduped"] : []),
    ]),
  };
}

function validateRuntimeCompletionEntryV01(entry: unknown, index: number): string[] {
  const failureCodes: string[] = [];
  if (!isRecord(entry)) return [`entries_${index}_not_object`];
  if (!isNonEmptyString(entry.source_surface)) failureCodes.push(`entries_${index}_source_surface_missing`);
  else if (!runtimeCompletionSourceSurfaces.includes(entry.source_surface)) {
    failureCodes.push(`entries_${index}_source_surface_invalid`);
  }
  if (!isNonEmptyString(entry.source_record_ref)) {
    failureCodes.push(`entries_${index}_source_record_ref_missing`);
  }
  if (!isNonEmptyString(entry.bounded_title)) failureCodes.push(`entries_${index}_bounded_title_missing`);
  if (!isNonEmptyString(entry.bounded_summary)) failureCodes.push(`entries_${index}_bounded_summary_missing`);
  if (typeof entry.bounded_title === "string" && entry.bounded_title.length > 180) {
    failureCodes.push(`entries_${index}_bounded_title_too_large`);
  }
  if (typeof entry.bounded_summary === "string" && entry.bounded_summary.length > 1200) {
    failureCodes.push(`entries_${index}_bounded_summary_too_large`);
  }
  if (entry.public_safe !== true) failureCodes.push(`entries_${index}_public_safe_required`);
  if (!["fresh", "stale", "unknown", undefined].includes(entry.stale_marker as never)) {
    failureCodes.push(`entries_${index}_stale_marker_invalid`);
  }
  if (!isNonEmptyString(entry.source_updated_at)) {
    failureCodes.push(`entries_${index}_source_updated_at_missing`);
  }
  for (const key of [
    "index_entry_id",
    "source_record_ref",
    "source_ref_id",
    "candidate_ref",
    "review_record_ref",
    "promotion_decision_ref",
    "formation_receipt_ref",
    "perspective_id",
    "feedback_ref",
    "provider_extraction_ref",
    "bounded_source_intake_ref",
    "bounded_title",
    "bounded_summary",
    "source_updated_at",
    "indexed_at",
  ]) {
    const value = entry[key];
    if (value !== undefined && value !== null && typeof value !== "string") {
      failureCodes.push(`entries_${index}_${key}_invalid`);
    }
    if (typeof value === "string" && !isSafeRuntimeCompletionText(value)) {
      failureCodes.push(`entries_${index}_${key}_unsafe`);
    }
  }
  if (entry.token_terms !== undefined) {
    if (!isStringArray(entry.token_terms)) failureCodes.push(`entries_${index}_token_terms_invalid`);
    else if (entry.token_terms.some((term) => !isSafeRuntimeCompletionText(term))) {
      failureCodes.push(`entries_${index}_token_terms_unsafe`);
    }
  }
  if (entry.reason_codes !== undefined) {
    if (!isStringArray(entry.reason_codes)) failureCodes.push(`entries_${index}_reason_codes_invalid`);
    else if (entry.reason_codes.some((code) => !isSafeRuntimeCompletionText(code))) {
      failureCodes.push(`entries_${index}_reason_codes_unsafe`);
    }
  }
  return uniqueSorted(failureCodes);
}

function chooseRuntimeCompletionRebuildStatus(
  failureCodes: string[],
): Exclude<ResearchRetrievalIndexRebuildRuntimeStatusV01, "rebuilt"> {
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

function toNullableSafeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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

function chooseBuildStatus(
  input: RebuildableRetrievalIndexBuildInput,
  validation: RebuildableRetrievalIndexValidationResult,
): RebuildableRetrievalIndexBuildStatus {
  if (!isRecord(input) || !Array.isArray(input.entries) || input.entries.length === 0) {
    return "rejected_empty_input";
  }
  if (validation.failure_codes.includes("entry_kind_unknown")) {
    return "rejected_unsupported_entry_kind";
  }
  if (
    validation.failure_codes.includes("public_safe_required") ||
    validation.failure_codes.includes("privacy_class_not_public_safe") ||
    validation.failure_codes.includes("redaction_status_blocked") ||
    validation.failure_codes.includes("forbidden_marker_present") ||
    validation.failure_codes.includes("boundary_notes_invalid") ||
    validation.failure_codes.includes("boundary_notes_forbidden_marker_present")
  ) {
    return "rejected_private_or_raw_payload";
  }
  if (!validation.passed) return "rejected_invalid_entry";
  return "rebuilt";
}

function collectRejectedEntryRefs(input: RebuildableRetrievalIndexBuildInput): string[] {
  if (!isRecord(input) || !Array.isArray(input.entries)) return [];
  return uniqueSorted(
    input.entries
      .filter((entry) => !validateRebuildableRetrievalIndexEntryV01(entry).passed)
      .map((entry) => (isRecord(entry) && typeof entry.entry_ref === "string" ? entry.entry_ref : "unknown-entry-ref")),
  );
}

function createBaseBuildReasonCodes(
  input: RebuildableRetrievalIndexBuildInput,
  status: RebuildableRetrievalIndexBuildStatus,
): RebuildableRetrievalIndexReasonCode[] {
  const entries = Array.isArray(input?.entries) ? input.entries : [];
  const codes: RebuildableRetrievalIndexReasonCode[] = [
    "roadmap_file_present",
    "contract_ref_present",
    "embedding_not_created",
    "vector_search_not_executed",
    "provider_call_not_executed",
    "prompt_not_sent",
    "source_fetch_not_executed",
    "file_read_not_executed",
    "db_write_not_executed",
    "proof_not_created",
    "evidence_not_created",
    "promotion_not_executed",
    "product_write_denied",
  ];
  if (status === "rejected_private_or_raw_payload") {
    codes.push("private_or_raw_payload_blocked");
  }
  if (status === "rejected_unsupported_entry_kind") codes.push("entry_kind_unknown");
  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    codes.push(isNonEmptyString(entry.entry_ref) ? "entry_ref_present" : "entry_ref_missing");
    codes.push(entry.entry_kind === "unknown" ? "entry_kind_unknown" : "entry_kind_supported");
    codes.push(isNonEmptyString(entry.bounded_summary) ? "bounded_summary_present" : "bounded_summary_missing");
    if (isStringArray(entry.source_refs) && entry.source_refs.length > 0) codes.push("source_ref_present");
    else codes.push("source_ref_missing");
    if (isStringArray(entry.candidate_refs) && entry.candidate_refs.length > 0) codes.push("candidate_ref_present");
    if (isStringArray(entry.review_memory_refs) && entry.review_memory_refs.length > 0) codes.push("review_memory_ref_present");
    if (isStringArray(entry.durable_summary_refs) && entry.durable_summary_refs.length > 0) codes.push("durable_summary_ref_present");
    if (isStringArray(entry.feedback_refs) && entry.feedback_refs.length > 0) codes.push("feedback_ref_present");
    if (entry.public_safe === true && entry.privacy_class === "public_safe_refs_only") codes.push("public_safe_entry");
  }
  return uniqueSorted(codes);
}

function failureCodesToReasonCodes(failureCodes: string[]): RebuildableRetrievalIndexReasonCode[] {
  const mapped: RebuildableRetrievalIndexReasonCode[] = [];
  if (failureCodes.includes("entry_kind_unknown")) mapped.push("entry_kind_unknown");
  if (
    failureCodes.includes("privacy_class_not_public_safe") ||
    failureCodes.includes("public_safe_required")
  ) {
    mapped.push("private_or_raw_payload_blocked");
  }
  if (failureCodes.includes("redaction_status_blocked")) mapped.push("private_or_raw_payload_blocked");
  if (failureCodes.includes("forbidden_marker_present")) mapped.push("private_or_raw_payload_blocked");
  if (failureCodes.includes("boundary_notes_invalid")) mapped.push("private_or_raw_payload_blocked");
  if (failureCodes.includes("boundary_notes_forbidden_marker_present")) {
    mapped.push("private_or_raw_payload_blocked");
  }
  if (failureCodes.includes("bounded_summary_missing")) mapped.push("bounded_summary_missing");
  return uniqueSorted(mapped);
}

function createBuildWarnings(status: RebuildableRetrievalIndexBuildStatus): string[] {
  if (status === "rebuilt") return [];
  return [
    "No derived index was persisted.",
    "No source fetch, file read, provider call, embedding, vector search, DB write, proof/evidence write, promotion, or product write was executed.",
  ];
}

function createTokenRecords(entries: RebuildableRetrievalIndexEntry[]): RebuildableRetrievalIndexTokenRecord[] {
  const tokenToRefs = new Map<string, Set<string>>();
  for (const entry of entries) {
    const entryTokens = tokenizeEntry(entry);
    for (const token of entryTokens) {
      const refs = tokenToRefs.get(token) ?? new Set<string>();
      refs.add(entry.entry_ref);
      tokenToRefs.set(token, refs);
    }
  }
  return [...tokenToRefs.entries()]
    .map(([token, refs]) => {
      const entryRefs = uniqueSorted([...refs]);
      return { token, entry_refs: entryRefs, entry_count: entryRefs.length };
    })
    .sort((left, right) => left.token.localeCompare(right.token));
}

function tokenizeEntry(entry: RebuildableRetrievalIndexEntry): string[] {
  return tokenizeBoundedRetrievalTextV01(
    [entry.bounded_title, entry.bounded_summary, ...entry.tags].join(" "),
  );
}

function countEntryKinds(
  entries: RebuildableRetrievalIndexEntry[],
): Record<RebuildableRetrievalIndexEntryKind, number> {
  const counts = Object.fromEntries(entryKinds.map((kind) => [kind, 0])) as Record<
    RebuildableRetrievalIndexEntryKind,
    number
  >;
  for (const entry of entries) counts[entry.entry_kind] += 1;
  return counts;
}

function containsForbiddenMarker(value: string): boolean {
  return forbiddenTextMarkers.some((marker) => value.includes(marker));
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
