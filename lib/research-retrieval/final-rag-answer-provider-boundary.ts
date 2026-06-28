import { createHash } from "node:crypto";

import type {
  FinalRagAnswerCandidateAuthorityBoundaryV01,
  FinalRagAnswerProviderModeV01,
} from "../../types/final-rag-answer-candidate-review";

export interface FinalRagAnswerProviderAdapterRequestV01 {
  provider_ref: string;
  model_or_tool_ref: string;
  bounded_prompt_descriptor: string;
  bounded_context_summaries: Array<{
    context_ref: string;
    source_ref: string;
    bounded_title: string;
    bounded_context_summary: string;
  }>;
  max_answer_chars: number;
  citation_policy: "source_ref_lineage_citations_only";
  no_truth_language_required: true;
  no_proof_language_required: true;
}

export interface FinalRagAnswerProviderAdapterOutputV01 {
  status: "answered" | "provider_missing_key" | "provider_unavailable";
  bounded_answer?: string;
  cited_source_refs?: string[];
  bounded_citation_notes?: Array<{
    source_ref: string;
    bounded_note: string;
  }>;
  warnings?: string[];
  reason_codes?: string[];
}

export type FinalRagAnswerProviderAdapterV01 = (
  request: FinalRagAnswerProviderAdapterRequestV01,
) => Promise<FinalRagAnswerProviderAdapterOutputV01> | FinalRagAnswerProviderAdapterOutputV01;

const forbiddenAuthorityFields = new Set<string>([
  "provider_call_on_load_now",
  "background_provider_call_now",
  "hidden_provider_call_now",
  "raw_prompt_stored_now",
  "raw_provider_output_stored_now",
  "raw_retrieval_output_stored_now",
  "raw_source_body_stored_now",
  "hidden_reasoning_stored_now",
  "chain_of_thought_stored_now",
  "provider_thread_run_session_id_canonicalized_now",
  "source_fetch_now",
  "automatic_crawling_now",
  "retrieval_index_write_now",
  "embedding_created_now",
  "vector_search_now",
  "final_answer_is_truth",
  "final_answer_is_proof",
  "final_answer_is_accepted_evidence",
  "final_answer_is_promotion_readiness",
  "final_answer_is_product",
  "retrieval_result_is_evidence",
  "retrieval_score_is_truth_score",
  "retrieval_score_is_promotion_readiness",
  "source_ref_is_proof",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "review_memory_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_accepted_evidence_ref_write_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "broad_product_persistence_now",
  "product_persistence_now",
  "github_api_call_now",
  "git_write_now",
  "repository_file_write_now",
  "release_execution_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
]);

const authorityLikePatterns = [
  /_authority$/i,
  /_write_now$/i,
  /_call_now$/i,
  /_execution_now$/i,
  /_stored_now$/i,
  /_is_truth$/i,
  /_is_proof$/i,
  /_is_accepted_evidence$/i,
  /_is_promotion_readiness$/i,
  /product_write/i,
  /product_id_allocation/i,
  /broad_product_persistence/i,
  /proof_or_evidence/i,
  /claim_or_evidence/i,
  /review_memory_write/i,
  /promotion_execution/i,
  /durable_state_apply/i,
  /formation_receipt_write/i,
  /github_api_call/i,
  /git_write/i,
  /release_execution/i,
] as const;

const unsafeTextPatterns = [
  /SAFE_MARKER_/i,
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[[^\]]+\])/i,
  /\bhttps?:\/\/[^/\s]*(?:private|internal|intranet|corp|\.local)\b/i,
  /\bprivate[-_ ]?url\b/i,
  /\blocal[-_ ]?private[-_ ]?path\b/i,
  /\braw[-_ ]?source[-_ ]?body\b/i,
  /\braw[-_ ]?provider[-_ ]?output\b/i,
  /\braw[-_ ]?retrieval[-_ ]?output\b/i,
  /\braw[-_ ]?conversation\b/i,
  /\bhidden[-_ ]?reasoning\b/i,
  /\bchain[-_ ]?of[-_ ]?thought\b/i,
  /\btelemetry[-_ ]?dump\b/i,
  /\braw[-_ ]?db[-_ ]?row\b/i,
  /\braw[-_ ]?diff\b/i,
  /\bterminal[-_ ]?log\b/i,
  /\bbrowser[-_ ]?dump\b/i,
  /\bgithub[-_ ]?payload\b/i,
  /\bprovider[-_ ]?(thread|run|session)[-_ ]?id\b/i,
  /\b(thread|run|session)_[A-Za-z0-9_-]+/i,
  /\buploaded[-_ ]?file[-_ ]?id\b/i,
  /\bconnector[-_ ]?id\b/i,
  /sk-[A-Za-z0-9]/i,
  /ghp_[A-Za-z0-9]/i,
  /github_pat_[A-Za-z0-9_]/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /password:/i,
  /secret:/i,
  /\bsecret\b/i,
  /private key/i,
  /-----BEGIN PRIVATE KEY-----/i,
  /-----BEGIN RSA PRIVATE KEY-----/i,
  /-----BEGIN OPENSSH PRIVATE KEY-----/i,
] as const;

const safePolicyKeyExceptions = new Set([
  "raw_prompt_storage_policy",
  "raw_provider_output_storage_policy",
  "raw_prompt_non_persistent",
  "raw_provider_output_non_persistent",
  "no_chain_of_thought_storage",
]);

const unsafeKeyExactMatches = new Set([
  "raw_prompt",
  "raw_provider_output",
  "raw_retrieval_output",
  "raw_source_body",
  "raw_db_row",
  "raw_conversation",
  "hidden_reasoning",
  "chain_of_thought",
  "telemetry_dump",
  "raw_diff",
  "terminal_log",
  "browser_dump",
  "github_payload",
  "provider_thread_id",
  "provider_run_id",
  "provider_session_id",
  "connector_id",
  "uploaded_file_id",
  "secret",
  "token",
  "api_key",
  "password",
  "private_key",
]);

const unsafeKeyPatterns = [
  /(?:^|_)(raw_prompt|raw_provider_output|raw_retrieval_output|raw_source_body|raw_db_row|raw_conversation)(?:_|$)/i,
  /(?:^|_)(hidden_reasoning|chain_of_thought|telemetry_dump|raw_diff|terminal_log|browser_dump|github_payload)(?:_|$)/i,
  /(?:^|_)provider_(thread|run|session)_id(?:_|$)/i,
  /(?:^|_)(connector_id|uploaded_file_id)(?:_|$)/i,
  /(?:^|_)(secret|token|api_key|password|private_key)(?:_|$)/i,
] as const;

export function createFinalRagAnswerCandidateAuthorityBoundaryV01(options: {
  retrievalExecutionViaContextPreviewNow?: boolean;
  mockAnswerProviderNow?: boolean;
  configuredProviderMissingKeyRefusalNow?: boolean;
  finalAnswerCandidateGeneratedNow?: boolean;
} = {}): FinalRagAnswerCandidateAuthorityBoundaryV01 {
  return {
    final_rag_answer_generation_candidate_review_now: true,
    explicit_operator_answer_generation_only: true,
    same_origin_post_route_now: true,
    db_backed_rag_context_preview_now: true,
    retrieval_execution_via_context_preview_now:
      options.retrievalExecutionViaContextPreviewNow === true,
    bounded_prompt_descriptor_now: true,
    answer_provider_adapter_boundary_now: true,
    mock_answer_provider_now: options.mockAnswerProviderNow === true,
    configured_provider_missing_key_refusal_now:
      options.configuredProviderMissingKeyRefusalNow === true,
    final_answer_candidate_generated_now:
      options.finalAnswerCandidateGeneratedNow === true,
    answer_review_state_candidate_only: true,
    citation_source_refs_visible: true,
    no_truth_language_required: true,
    no_proof_language_required: true,
    raw_prompt_non_persistent: true,
    raw_provider_output_non_persistent: true,
    provider_call_on_load_now: false,
    background_provider_call_now: false,
    hidden_provider_call_now: false,
    raw_prompt_stored_now: false,
    raw_provider_output_stored_now: false,
    raw_retrieval_output_stored_now: false,
    raw_source_body_stored_now: false,
    hidden_reasoning_stored_now: false,
    chain_of_thought_stored_now: false,
    provider_thread_run_session_id_canonicalized_now: false,
    source_fetch_now: false,
    automatic_crawling_now: false,
    retrieval_index_write_now: false,
    embedding_created_now: false,
    vector_search_now: false,
    final_answer_is_truth: false,
    final_answer_is_proof: false,
    final_answer_is_accepted_evidence: false,
    final_answer_is_promotion_readiness: false,
    final_answer_is_product: false,
    retrieval_result_is_evidence: false,
    retrieval_score_is_truth_score: false,
    retrieval_score_is_promotion_readiness: false,
    source_ref_is_proof: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    review_memory_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_accepted_evidence_ref_write_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    broad_product_persistence_now: false,
    product_persistence_now: false,
    github_api_call_now: false,
    git_write_now: false,
    repository_file_write_now: false,
    release_execution_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function createMockFinalRagAnswerProviderAdapterV01(): FinalRagAnswerProviderAdapterV01 {
  return (request) => {
    const sourceRefs = uniqueSorted(request.bounded_context_summaries.map((item) => item.source_ref));
    const leadTitle = request.bounded_context_summaries[0]?.bounded_title ?? "available context";
    const answer = [
      `Candidate answer for operator review based on ${request.bounded_context_summaries.length} bounded context items.`,
      `The current context points to ${leadTitle}.`,
      "Treat this as a review candidate only; it is not truth, proof, accepted evidence, promotion readiness, or product output.",
      `Lineage refs: ${sourceRefs.slice(0, 6).join(", ")}.`,
    ].join(" ");
    return {
      status: "answered",
      bounded_answer: answer.slice(0, request.max_answer_chars),
      cited_source_refs: sourceRefs,
      bounded_citation_notes: sourceRefs.slice(0, 6).map((sourceRef) => ({
        source_ref: sourceRef,
        bounded_note: `Lineage pointer cited from bounded context for ${sourceRef}.`,
      })),
      warnings: ["mock_provider_deterministic"],
      reason_codes: ["mock_answer_provider_now", "candidate_only_output_now"],
    };
  };
}

export function collectFinalRagAnswerForbiddenAuthorityFieldsV01(input: unknown): string[] {
  const blocked: string[] = [];
  visitJson(input, (key, value) => {
    if (!key) return;
    if (forbiddenAuthorityFields.has(key) || authorityLikePatterns.some((pattern) => pattern.test(key))) {
      if (!isFalseLikeAuthorityValue(value)) blocked.push(key);
    }
  });
  return uniqueSorted(blocked);
}

export function containsUnsafeFinalRagAnswerRuntimeTextV01(input: unknown): boolean {
  if (typeof input === "string") return unsafeTextPatterns.some((pattern) => pattern.test(input));
  if (Array.isArray(input)) return input.some((item) => containsUnsafeFinalRagAnswerRuntimeTextV01(item));
  if (input && typeof input === "object") {
    return Object.entries(input as Record<string, unknown>).some(([key, item]) =>
      isUnsafeFinalRagAnswerRuntimeKeyV01(key) ||
      containsUnsafeFinalRagAnswerRuntimeTextV01(item),
    );
  }
  return false;
}

export function isUnsafeFinalRagAnswerRuntimeKeyV01(key: unknown): boolean {
  if (typeof key !== "string") return false;
  const normalized = key.trim().replace(/[-\s]+/g, "_").toLowerCase();
  if (safePolicyKeyExceptions.has(normalized)) return false;
  return unsafeKeyExactMatches.has(normalized) ||
    unsafeKeyPatterns.some((pattern) => pattern.test(normalized));
}

export function isSafeFinalRagAnswerPublicTextV01(value: unknown, maxChars = 1200): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxChars && !containsUnsafeFinalRagAnswerRuntimeTextV01(trimmed);
}

export function redactFinalRagAnswerProviderRefV01(input: unknown): string {
  const raw = typeof input === "string" ? input.trim() : JSON.stringify(input ?? "unknown");
  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  if (typeof input === "string" && isSafeFinalRagAnswerPublicTextV01(input, 160)) {
    const prefix = input.split(":").slice(0, 2).join(":");
    return `${prefix || "provider-ref"}#${hash}`;
  }
  return `provider-ref:redacted#${hash}`;
}

export function providerStatusForModeV01(mode: FinalRagAnswerProviderModeV01): "mock_provider_completed" | "configured_provider_completed" {
  return mode === "mock_provider" ? "mock_provider_completed" : "configured_provider_completed";
}

function isFalseLikeAuthorityValue(value: unknown): boolean {
  return value === false || value === null || value === undefined;
}

function visitJson(value: unknown, visitor: (key: string | null, value: unknown) => void, key: string | null = null): void {
  visitor(key, value);
  if (Array.isArray(value)) {
    value.forEach((item) => visitJson(item, visitor, null));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    visitJson(nestedValue, visitor, nestedKey);
  }
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
