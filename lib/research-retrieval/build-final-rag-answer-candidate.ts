import { createHash } from "node:crypto";

import {
  buildRagContextPreviewRuntimeCompletionV01,
  validateRagContextPreviewRuntimeRequestV01,
  type RagContextPreviewRuntimeContextItemV01,
  type RagContextPreviewRuntimeExcludedContextV01,
  type RagContextPreviewRuntimeRequestV01,
  type RagContextPreviewRuntimeResultV01,
} from "./build-rag-context-preview";
import type { ResearchRetrievalIndexDbLikeV01 } from "./index-store";
import {
  collectFinalRagAnswerForbiddenAuthorityFieldsV01,
  containsUnsafeFinalRagAnswerRuntimeTextV01,
  createFinalRagAnswerCandidateAuthorityBoundaryV01,
  createMockFinalRagAnswerProviderAdapterV01,
  isSafeFinalRagAnswerPublicTextV01,
  providerStatusForModeV01,
  redactFinalRagAnswerProviderRefV01,
  type FinalRagAnswerProviderAdapterOutputV01,
  type FinalRagAnswerProviderAdapterRequestV01,
  type FinalRagAnswerProviderAdapterV01,
} from "./final-rag-answer-provider-boundary";
import {
  FINAL_RAG_ANSWER_CANDIDATE_REVIEW_REQUEST_VERSION_V01,
  FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RESULT_VERSION_V01,
  FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RUNTIME_VERSION_V01,
  FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01,
  type FinalRagAnswerCandidateReviewRequestV01,
  type FinalRagAnswerCandidateReviewResultV01,
  type FinalRagAnswerCandidateReviewStatusV01,
  type FinalRagAnswerCitationNoteV01,
  type FinalRagAnswerOmittedContextReasonV01,
  type FinalRagAnswerProviderStatusV01,
} from "../../types/final-rag-answer-candidate-review";

interface ValidationResult {
  passed: boolean;
  status: FinalRagAnswerCandidateReviewStatusV01;
  failure_codes: string[];
  reason_codes: string[];
}

const scope = FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01;
const safeIdentifierPattern = /^[a-z][a-z0-9._:-]{2,220}$/i;
const maxReasonCodeChars = 96;

export function preflightFinalRagAnswerCandidateReviewRuntimeV01(
  input: unknown,
): FinalRagAnswerCandidateReviewResultV01 | null {
  const validation = validateFinalRagAnswerCandidateReviewInputV01(input);
  if (!validation.passed) {
    return createResult({
      input: isRecord(input) ? input : null,
      status: validation.status,
      providerStatus: "not_invoked",
      ragContextPreview: null,
      providerCallExecuted: false,
      promptSent: false,
      retrievalExecuted: false,
      finalAnswerCandidateGenerated: false,
      reasonCodes: validation.reason_codes,
      failureCodes: validation.failure_codes,
    });
  }
  return null;
}

export function createFinalRagAnswerCandidateReviewFailureResultV01(input: {
  status: Extract<FinalRagAnswerCandidateReviewStatusV01, "db_missing" | "schema_missing" | "rejected">;
  reason_codes: string[];
  failure_codes?: string[];
}): FinalRagAnswerCandidateReviewResultV01 {
  return createResult({
    input: null,
    status: input.status,
    providerStatus: "not_invoked",
    ragContextPreview: null,
    providerCallExecuted: false,
    promptSent: false,
    retrievalExecuted: false,
    finalAnswerCandidateGenerated: false,
    reasonCodes: input.reason_codes,
    failureCodes: input.failure_codes,
  });
}

export function validateFinalRagAnswerCandidateReviewInputV01(input: unknown): ValidationResult {
  const reasonCodes = [
    "final_rag_answer_generation_candidate_review_v0_1",
    "explicit_operator_answer_generation_only",
    "answer_review_state_candidate_only",
    "raw_prompt_non_persistent",
    "raw_provider_output_non_persistent",
    "no_chain_of_thought_storage",
  ];

  if (!isRecord(input)) {
    return validationFailure("blocked_invalid_input", ["input_not_object"], reasonCodes);
  }

  const forbiddenAuthorityFields = collectFinalRagAnswerForbiddenAuthorityFieldsV01(input);
  if (forbiddenAuthorityFields.length > 0) {
    return validationFailure(
      "blocked_forbidden_authority",
      ["forbidden_authority_present", ...forbiddenAuthorityFields.map((field) => `forbidden_authority:${field}`)],
      [...reasonCodes, "forbidden_authority_blocked"],
    );
  }

  if (containsUnsafeFinalRagAnswerRuntimeTextV01(input)) {
    return validationFailure(
      "blocked_private_or_raw_payload",
      ["private_or_raw_payload_detected"],
      [...reasonCodes, "private_or_raw_payload_blocked"],
    );
  }

  const failureCodes: string[] = [];
  if (input.request_version !== FINAL_RAG_ANSWER_CANDIDATE_REVIEW_REQUEST_VERSION_V01) {
    failureCodes.push("request_version_invalid");
  }
  if (input.runtime_version !== FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RUNTIME_VERSION_V01) {
    failureCodes.push("runtime_version_invalid");
  }
  if (input.scope !== scope) failureCodes.push("scope_invalid");
  if (!isSafeIdentifier(input.answer_request_id)) failureCodes.push("answer_request_id_invalid");
  if (!isSafeIdentifier(input.requested_by)) failureCodes.push("requested_by_invalid");
  if (!isIsoTimestamp(input.requested_at)) failureCodes.push("requested_at_invalid");
  if (input.provider_mode !== "mock_provider" && input.provider_mode !== "configured_provider") {
    failureCodes.push("provider_mode_invalid");
  }
  if (!isSafeFinalRagAnswerPublicTextV01(input.provider_ref, 160)) {
    failureCodes.push("provider_ref_invalid");
  }
  if (!isSafeFinalRagAnswerPublicTextV01(input.model_or_tool_ref, 160)) {
    failureCodes.push("model_or_tool_ref_invalid");
  }
  if (!isRecord(input.rag_context_preview_request)) {
    failureCodes.push("rag_context_preview_request_invalid");
  }
  failureCodes.push(...validateIntegerLimit(input.max_answer_chars, "max_answer_chars", 256, 6000));
  failureCodes.push(...validateIntegerLimit(input.max_context_items, "max_context_items", 1, 12));
  if (input.citation_policy !== "source_ref_lineage_citations_only") {
    failureCodes.push("citation_policy_invalid");
  }
  if (input.no_truth_language_required !== true) failureCodes.push("no_truth_language_required");
  if (input.no_proof_language_required !== true) failureCodes.push("no_proof_language_required");
  if (input.raw_prompt_storage_policy !== "non_persistent") {
    failureCodes.push("raw_prompt_storage_policy_must_be_non_persistent");
  }
  if (input.raw_provider_output_storage_policy !== "non_persistent") {
    failureCodes.push("raw_provider_output_storage_policy_must_be_non_persistent");
  }
  if (input.no_chain_of_thought_storage !== true) failureCodes.push("no_chain_of_thought_storage_required");
  if (!isSafeReasonCodes(input.reason_codes)) failureCodes.push("reason_codes_invalid");

  if (isRecord(input.rag_context_preview_request)) {
    const previewValidation = validateRagContextPreviewRuntimeRequestV01(input.rag_context_preview_request);
    if (!previewValidation.passed) {
      failureCodes.push(`context_preview_request_${previewValidation.status}`);
      failureCodes.push(...(previewValidation.failure_codes ?? []).map((code) => `context_preview:${code}`));
    }
  }

  if (failureCodes.length > 0) {
    const status =
      failureCodes.some((code) => code.includes("private_or_raw"))
        ? "blocked_private_or_raw_payload"
        : failureCodes.some((code) => code.includes("forbidden_authority"))
          ? "blocked_forbidden_authority"
          : "blocked_invalid_input";
    return validationFailure(status, failureCodes, reasonCodes);
  }

  return {
    passed: true,
    status: "final_answer_candidate_created",
    failure_codes: [],
    reason_codes: uniqueSorted([...reasonCodes, "payload_valid", "context_preview_request_valid"]),
  };
}

export async function runFinalRagAnswerCandidateReviewRuntimeV01(
  input: FinalRagAnswerCandidateReviewRequestV01,
  db: ResearchRetrievalIndexDbLikeV01,
  options: {
    providerAdapter?: FinalRagAnswerProviderAdapterV01;
  } = {},
): Promise<FinalRagAnswerCandidateReviewResultV01> {
  const preflightResult = preflightFinalRagAnswerCandidateReviewRuntimeV01(input);
  if (preflightResult) return preflightResult;

  const contextPreview = buildRagContextPreviewRuntimeCompletionV01(
    input.rag_context_preview_request as unknown as RagContextPreviewRuntimeRequestV01,
    db,
  );
  if (contextPreview.status === "schema_missing") {
    return createResult({
      input,
      status: "schema_missing",
      providerStatus: "not_invoked",
      ragContextPreview: contextPreview,
      providerCallExecuted: false,
      promptSent: false,
      retrievalExecuted: contextPreview.retrieval_executed,
      finalAnswerCandidateGenerated: false,
      reasonCodes: ["schema_missing", ...contextPreview.reason_codes],
      failureCodes: contextPreview.failure_codes,
    });
  }
  if (
    contextPreview.status === "blocked_forbidden_authority" ||
    contextPreview.status === "blocked_private_or_raw_payload" ||
    contextPreview.status === "blocked_invalid_input" ||
    contextPreview.status === "rejected"
  ) {
    return createResult({
      input,
      status: contextPreview.status === "rejected" ? "rejected" : contextPreview.status,
      providerStatus: "not_invoked",
      ragContextPreview: contextPreview,
      providerCallExecuted: false,
      promptSent: false,
      retrievalExecuted: contextPreview.retrieval_executed,
      finalAnswerCandidateGenerated: false,
      reasonCodes: contextPreview.reason_codes,
      failureCodes: contextPreview.failure_codes,
    });
  }
  const selectedContext = contextPreview.included_context_summaries.slice(0, input.max_context_items);
  if (contextPreview.status !== "context_preview_created" || selectedContext.length === 0) {
    return createResult({
      input,
      status: "context_preview_empty",
      providerStatus: "not_invoked",
      ragContextPreview: contextPreview,
      providerCallExecuted: false,
      promptSent: false,
      retrievalExecuted: contextPreview.retrieval_executed,
      finalAnswerCandidateGenerated: false,
      reasonCodes: uniqueSorted([...contextPreview.reason_codes, "context_preview_empty"]),
    });
  }

  if (input.provider_mode === "configured_provider" && !options.providerAdapter) {
    return createResult({
      input,
      status: "provider_missing_key",
      providerStatus: "provider_missing_key",
      ragContextPreview: contextPreview,
      providerCallExecuted: false,
      promptSent: false,
      retrievalExecuted: contextPreview.retrieval_executed,
      finalAnswerCandidateGenerated: false,
      reasonCodes: uniqueSorted([
        ...contextPreview.reason_codes,
        "provider_missing_key",
        "configured_provider_missing_key_refusal_now",
      ]),
    });
  }

  const adapter = options.providerAdapter ?? createMockFinalRagAnswerProviderAdapterV01();
  const adapterRequest = createProviderAdapterRequest(input, contextPreview, selectedContext);
  const providerOutput = await adapter(adapterRequest);
  if (containsUnsafeFinalRagAnswerRuntimeTextV01(providerOutput)) {
    return createResult({
      input,
      status: "blocked_private_or_raw_payload",
      providerStatus: "provider_unavailable",
      ragContextPreview: contextPreview,
      providerCallExecuted: true,
      promptSent: true,
      retrievalExecuted: contextPreview.retrieval_executed,
      finalAnswerCandidateGenerated: false,
      reasonCodes: ["provider_output_blocked_private_or_raw_payload"],
      failureCodes: ["private_or_raw_payload_detected"],
    });
  }
  const unbackedProviderCitationRefs = collectUnbackedProviderCitationRefs(providerOutput, contextPreview);
  if (unbackedProviderCitationRefs.length > 0) {
    return createResult({
      input,
      status: "rejected",
      providerStatus:
        providerOutput.status === "provider_missing_key" || providerOutput.status === "provider_unavailable"
          ? providerOutput.status
          : providerStatusForModeV01(input.provider_mode),
      ragContextPreview: contextPreview,
      providerOutput,
      providerCallExecuted: true,
      promptSent: true,
      retrievalExecuted: contextPreview.retrieval_executed,
      finalAnswerCandidateGenerated: false,
      reasonCodes: uniqueSorted([
        ...contextPreview.reason_codes,
        "provider_cited_unbacked_source_ref",
        "final_answer_candidate_rejected",
      ]),
      failureCodes: [
        "provider_cited_unbacked_source_ref",
        ...unbackedProviderCitationRefs.map((sourceRef) => `unbacked_source_ref:${sourceRef}`),
      ],
    });
  }
  if (providerOutput.status === "provider_missing_key" || providerOutput.status === "provider_unavailable") {
    return createResult({
      input,
      status: providerOutput.status,
      providerStatus: providerOutput.status,
      ragContextPreview: contextPreview,
      providerCallExecuted: true,
      promptSent: true,
      retrievalExecuted: contextPreview.retrieval_executed,
      finalAnswerCandidateGenerated: false,
      reasonCodes: uniqueSorted([
        ...contextPreview.reason_codes,
        ...(providerOutput.reason_codes ?? []),
        providerOutput.status,
      ]),
    });
  }

  const boundedAnswer = normalizeBoundedAnswer(providerOutput, input.max_answer_chars);
  if (!boundedAnswer) {
    return createResult({
      input,
      status: "provider_unavailable",
      providerStatus: "provider_unavailable",
      ragContextPreview: contextPreview,
      providerCallExecuted: true,
      promptSent: true,
      retrievalExecuted: contextPreview.retrieval_executed,
      finalAnswerCandidateGenerated: false,
      reasonCodes: ["provider_unavailable", "bounded_answer_missing"],
      failureCodes: ["bounded_answer_missing"],
    });
  }

  return createResult({
    input,
    status: "final_answer_candidate_created",
    providerStatus: providerStatusForModeV01(input.provider_mode),
    ragContextPreview: contextPreview,
    providerOutput,
    boundedAnswer,
    providerCallExecuted: true,
    promptSent: true,
    retrievalExecuted: contextPreview.retrieval_executed,
    finalAnswerCandidateGenerated: true,
    reasonCodes: uniqueSorted([
      ...contextPreview.reason_codes,
      ...(providerOutput.reason_codes ?? []),
      "bounded_prompt_descriptor_now",
      "final_answer_candidate_created",
      "answer_review_state_candidate_only",
      "final_answer_not_truth",
      "final_answer_not_proof",
      "final_answer_not_accepted_evidence",
      "final_answer_not_promotion",
      "final_answer_not_product",
      "product_write_not_executed",
    ]),
  });
}

export function createFinalRagAnswerCandidateRefV01(input: {
  answer_request_id: string;
  rag_context_preview_ref: string;
  cited_source_refs: string[];
}): string {
  return `final-rag-answer-candidate:v0.1:${shortHash(input)}`;
}

function createProviderAdapterRequest(
  input: FinalRagAnswerCandidateReviewRequestV01,
  contextPreview: RagContextPreviewRuntimeResultV01,
  contextItems: RagContextPreviewRuntimeContextItemV01[],
): FinalRagAnswerProviderAdapterRequestV01 {
  return {
    provider_ref: redactFinalRagAnswerProviderRefV01(input.provider_ref),
    model_or_tool_ref: redactFinalRagAnswerProviderRefV01(input.model_or_tool_ref),
    bounded_prompt_descriptor: [
      `answer_request_id:${input.answer_request_id}`,
      `rag_context_preview_ref:${contextPreview.preview_request_id}`,
      "answer_review_state:candidate_only",
      "no_truth_claim:true",
      "no_proof_claim:true",
      "raw_prompt_storage_policy:non_persistent",
      "raw_provider_output_storage_policy:non_persistent",
      `citation_policy:${input.citation_policy}`,
      `context_item_count:${contextItems.length}`,
    ].join("\n"),
    bounded_context_summaries: contextItems.map((item) => ({
      context_ref: item.context_ref,
      source_ref: item.source_ref_id ?? item.source_record_ref,
      bounded_title: item.bounded_title.slice(0, 180),
      bounded_context_summary: item.bounded_context_summary.slice(0, 900),
    })),
    max_answer_chars: input.max_answer_chars,
    citation_policy: input.citation_policy,
    no_truth_language_required: true,
    no_proof_language_required: true,
  };
}

function createResult(input: {
  input: FinalRagAnswerCandidateReviewRequestV01 | Record<string, unknown> | null;
  status: FinalRagAnswerCandidateReviewStatusV01;
  providerStatus: FinalRagAnswerProviderStatusV01;
  ragContextPreview: RagContextPreviewRuntimeResultV01 | null;
  providerOutput?: FinalRagAnswerProviderAdapterOutputV01;
  boundedAnswer?: string;
  providerCallExecuted: boolean;
  promptSent: boolean;
  retrievalExecuted: boolean;
  finalAnswerCandidateGenerated: boolean;
  reasonCodes: string[];
  failureCodes?: string[];
}): FinalRagAnswerCandidateReviewResultV01 {
  const request = input.input;
  const answerRequestId = isRecord(request) && typeof request.answer_request_id === "string"
    ? request.answer_request_id
    : null;
  const providerMode = isRecord(request) &&
    (request.provider_mode === "mock_provider" || request.provider_mode === "configured_provider")
      ? request.provider_mode
      : null;
  const contextPreview = input.ragContextPreview;
  const contextSourceRefs = contextBackedSourceRefs(contextPreview);
  const allowedContextSourceRefs = new Set(contextSourceRefs);
  const providerCitedSourceRefs = Array.isArray(input.providerOutput?.cited_source_refs)
    ? input.providerOutput.cited_source_refs.filter((value): value is string => typeof value === "string")
    : [];
  const sourceRefs = providerCitedSourceRefs.length > 0
    ? uniqueSorted(providerCitedSourceRefs.filter((sourceRef) => allowedContextSourceRefs.has(sourceRef)))
    : contextSourceRefs;
  const answerCandidateRef =
    answerRequestId && contextPreview && input.finalAnswerCandidateGenerated
      ? createFinalRagAnswerCandidateRefV01({
          answer_request_id: answerRequestId,
          rag_context_preview_ref: contextPreview.preview_request_id,
          cited_source_refs: sourceRefs,
        })
      : null;
  return {
    result_version: FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RESULT_VERSION_V01,
    runtime_version: FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RUNTIME_VERSION_V01,
    scope,
    status: input.status,
    answer_request_id: answerRequestId,
    provider_mode: providerMode,
    provider_status: input.providerStatus,
    rag_context_preview_ref: contextPreview?.preview_request_id ?? null,
    retrieved_refs: contextPreview?.retrieved_refs ?? [],
    cited_source_refs: sourceRefs,
    answer_candidate_ref: answerCandidateRef,
    bounded_answer: input.boundedAnswer ?? null,
    bounded_citation_notes: createCitationNotes(input.providerOutput, contextPreview, sourceRefs),
    omitted_context_reasons: createOmittedContextReasons(contextPreview),
    answer_review_state: "candidate_only",
    no_truth_claim: true,
    no_proof_claim: true,
    no_accepted_evidence_claim: true,
    no_promotion_claim: true,
    no_product_write_claim: true,
    provider_call_executed: input.providerCallExecuted,
    prompt_sent: input.promptSent,
    retrieval_executed: input.retrievalExecuted,
    rag_answer_generated: input.finalAnswerCandidateGenerated,
    final_answer_candidate_generated: input.finalAnswerCandidateGenerated,
    db_write_executed: false,
    retrieval_index_write_executed: false,
    source_fetch_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    review_memory_written: false,
    promotion_executed: false,
    durable_state_written: false,
    durable_state_applied: false,
    formation_receipt_written: false,
    product_write_executed: false,
    product_id_allocated: false,
    github_api_called: false,
    git_write_executed: false,
    release_executed: false,
    authority_boundary: createFinalRagAnswerCandidateAuthorityBoundaryV01({
      retrievalExecutionViaContextPreviewNow: input.retrievalExecuted,
      mockAnswerProviderNow: providerMode === "mock_provider" && input.providerCallExecuted,
      configuredProviderMissingKeyRefusalNow: input.status === "provider_missing_key",
      finalAnswerCandidateGeneratedNow: input.finalAnswerCandidateGenerated,
    }),
    reason_codes: uniqueSorted([
      "final_answer_candidate_is_not_truth",
      "final_answer_candidate_is_not_proof",
      "final_answer_candidate_is_not_accepted_evidence",
      "final_answer_candidate_is_not_promotion",
      "final_answer_candidate_is_not_product",
      "retrieval_result_not_evidence",
      "retrieval_score_not_truth",
      "retrieval_score_not_promotion_readiness",
      "source_refs_are_lineage_pointers_not_proof",
      "raw_prompt_not_stored",
      "raw_provider_output_not_stored",
      "hidden_reasoning_not_stored",
      "product_write_not_executed",
      ...input.reasonCodes,
    ]),
    failure_codes: input.failureCodes,
  };
}

function createCitationNotes(
  providerOutput: FinalRagAnswerProviderAdapterOutputV01 | undefined,
  contextPreview: RagContextPreviewRuntimeResultV01 | null,
  sourceRefs: string[],
): FinalRagAnswerCitationNoteV01[] {
  const providerNotes = providerOutput?.bounded_citation_notes ?? [];
  if (providerNotes.length > 0) {
    return providerNotes
      .filter((note) => sourceRefs.includes(note.source_ref))
      .slice(0, 8)
      .map((note) => ({
        source_ref: note.source_ref,
        context_refs: contextRefsForSource(contextPreview, note.source_ref),
        bounded_note: note.bounded_note.slice(0, 240),
      }));
  }
  return sourceRefs.slice(0, 8).map((sourceRef) => ({
    source_ref: sourceRef,
    context_refs: contextRefsForSource(contextPreview, sourceRef),
    bounded_note: `Source ref is a lineage pointer for candidate review: ${sourceRef}.`,
  }));
}

function createOmittedContextReasons(
  contextPreview: RagContextPreviewRuntimeResultV01 | null,
): FinalRagAnswerOmittedContextReasonV01[] {
  return (contextPreview?.excluded_context_reasons ?? []).slice(0, 12).map(
    (item: RagContextPreviewRuntimeExcludedContextV01) => ({
      source_result_ref: item.source_result_ref,
      context_ref: null,
      reason: item.exclusion_reason,
      bounded_title: item.bounded_title.slice(0, 180),
    }),
  );
}

function contextRefsForSource(contextPreview: RagContextPreviewRuntimeResultV01 | null, sourceRef: string): string[] {
  return (contextPreview?.included_context_summaries ?? [])
    .filter((item) => item.source_ref_id === sourceRef || item.source_record_ref === sourceRef)
    .map((item) => item.context_ref)
    .slice(0, 8);
}

function collectUnbackedProviderCitationRefs(
  providerOutput: FinalRagAnswerProviderAdapterOutputV01,
  contextPreview: RagContextPreviewRuntimeResultV01,
): string[] {
  const allowedContextSourceRefs = new Set(contextBackedSourceRefs(contextPreview));
  const citedSourceRefs = Array.isArray(providerOutput.cited_source_refs)
    ? providerOutput.cited_source_refs.filter((sourceRef): sourceRef is string => typeof sourceRef === "string")
    : [];
  const noteSourceRefs = Array.isArray(providerOutput.bounded_citation_notes)
    ? providerOutput.bounded_citation_notes
        .map((note) => note.source_ref)
        .filter((sourceRef): sourceRef is string => typeof sourceRef === "string")
    : [];
  return uniqueSorted([...citedSourceRefs, ...noteSourceRefs].filter((sourceRef) => !allowedContextSourceRefs.has(sourceRef)));
}

function contextBackedSourceRefs(contextPreview: RagContextPreviewRuntimeResultV01 | null): string[] {
  return uniqueSorted(
    (contextPreview?.included_context_summaries ?? [])
      .flatMap((item) => [item.source_ref_id, item.source_record_ref])
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );
}

function normalizeBoundedAnswer(
  providerOutput: FinalRagAnswerProviderAdapterOutputV01,
  maxChars: number,
): string | null {
  if (providerOutput.status !== "answered") return null;
  if (!isSafeFinalRagAnswerPublicTextV01(providerOutput.bounded_answer, maxChars)) return null;
  const answer = providerOutput.bounded_answer.trim().slice(0, maxChars);
  if (containsUnsafeFinalRagAnswerRuntimeTextV01(answer)) return null;
  return answer;
}

function validationFailure(
  status: FinalRagAnswerCandidateReviewStatusV01,
  failureCodes: string[],
  reasonCodes: string[],
): ValidationResult {
  return {
    passed: false,
    status,
    failure_codes: uniqueSorted(failureCodes),
    reason_codes: uniqueSorted([...reasonCodes, status]),
  };
}

function validateIntegerLimit(value: unknown, field: string, min: number, max: number): string[] {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    return [`${field}_invalid`];
  }
  return [];
}

function isSafeIdentifier(value: unknown): value is string {
  return typeof value === "string" && safeIdentifierPattern.test(value) && isSafeFinalRagAnswerPublicTextV01(value, 240);
}

function isSafeReasonCodes(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every(
    (reason) =>
      typeof reason === "string" &&
      reason.length <= maxReasonCodeChars &&
      /^[a-z][a-z0-9_:-]{1,95}$/.test(reason) &&
      !containsUnsafeFinalRagAnswerRuntimeTextV01(reason),
  );
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && value.includes("T");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function shortHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortJson(value))).digest("hex").slice(0, 24);
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, sortJson(nested)]),
  );
}
