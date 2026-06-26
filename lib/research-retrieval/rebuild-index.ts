import { createHash } from "node:crypto";

export const REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_VERSION =
  "rebuildable_retrieval_index_runtime.v0.1" as const;
export const REBUILDABLE_RETRIEVAL_INDEX_VERSION =
  "rebuildable_retrieval_index.v0.1" as const;
export const REBUILDABLE_RETRIEVAL_INDEX_ENTRY_VERSION =
  "rebuildable_retrieval_index_entry.v0.1" as const;

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
  if (!Array.isArray(input.boundary_notes)) failureCodes.push("boundary_notes_invalid");
  if (!Array.isArray(input.reason_codes)) failureCodes.push("reason_codes_invalid");
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
    validation.failure_codes.includes("forbidden_marker_present")
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
