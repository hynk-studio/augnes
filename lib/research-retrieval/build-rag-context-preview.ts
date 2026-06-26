import { createHash } from "node:crypto";

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
