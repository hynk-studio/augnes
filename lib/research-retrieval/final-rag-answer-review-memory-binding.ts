import {
  createResearchCandidateReviewMemoryDbAuthorityBoundaryV01,
  createResearchCandidateReviewRecordV01,
  type ResearchCandidateReviewMemoryDbCreateInputV01,
  type ResearchCandidateReviewMemoryDbLike,
  type ResearchCandidateReviewMemoryDbStoreResultV01,
} from "@/lib/research-candidate-review/review-memory-db-store";
import { isSafeResearchCandidateReviewMemoryDbRoutePathV01 } from "@/lib/research-candidate-review/review-memory-db-route-contract";
import {
  FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RESULT_VERSION_V01,
  FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RUNTIME_VERSION_V01,
  FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01,
  type FinalRagAnswerCandidateReviewResultV01,
} from "@/types/final-rag-answer-candidate-review";
import {
  FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_REQUEST_VERSION_V01,
  FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_RESULT_VERSION_V01,
  FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_RUNTIME_VERSION_V01,
  FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01,
  type FinalRagAnswerReviewMemoryBindingAuthorityBoundaryV01,
  type FinalRagAnswerReviewMemoryBindingRequestV01,
  type FinalRagAnswerReviewMemoryBindingResultV01,
  type FinalRagAnswerReviewMemoryBindingStatusV01,
} from "@/types/final-rag-answer-review-memory-binding";

const contractVersion = "research_candidate_review_memory_contract.v0.1" as const;
const operatorPayloadVersion = "final_rag_answer_review_memory_binding_operator_review.v0.1";
const runtimeSliceRef = "final_rag_answer_candidate_review_memory_binding_v0_1";
const maxBoundedAnswerExcerptChars = 600;
const maxPublicTextChars = 1600;

const allowedReviewDecisions = new Set([
  "keep_for_review",
  "needs_more_evidence",
  "discard",
  "needs_operator_review",
]);
const allowedReviewActions = new Set([
  "save_review_note",
  "request_more_evidence",
  "reject_candidate",
  "defer_candidate",
]);
const falseCandidateResultFields = [
  "proof_or_evidence_created",
  "claim_or_evidence_written",
  "review_memory_written",
  "promotion_executed",
  "durable_state_written",
  "durable_state_applied",
  "formation_receipt_written",
  "product_write_executed",
  "product_id_allocated",
  "db_write_executed",
  "retrieval_index_write_executed",
  "source_fetch_executed",
  "github_api_called",
  "git_write_executed",
  "release_executed",
] as const;
const trueCandidateResultFields = [
  "no_truth_claim",
  "no_proof_claim",
  "no_accepted_evidence_claim",
  "no_promotion_claim",
  "no_product_write_claim",
  "final_answer_candidate_generated",
] as const;
const allowedTrueAuthorityFields = new Set([
  "final_rag_answer_review_memory_binding_now",
  "explicit_operator_review_memory_binding_only",
  "same_origin_post_route_now",
  "caller_injected_review_memory_db_only",
  "db_query_or_write_now",
  "review_memory_db_store_now",
  "review_record_persistence_now",
  "review_record_activity_persistence_now",
  "final_answer_candidate_input_required",
  "answer_review_state_candidate_only_required",
  "bounded_review_memory_snapshot_now",
  "source_refs_lineage_only",
  "no_truth_language_required",
  "no_proof_language_required",
]);
const forbiddenAuthorityFields = new Set([
  "provider_openai_call_now",
  "prompt_sent_now",
  "raw_prompt_stored_now",
  "raw_provider_output_stored_now",
  "raw_retrieval_output_stored_now",
  "raw_source_body_stored_now",
  "hidden_reasoning_stored_now",
  "chain_of_thought_stored_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "final_rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "accepted_evidence_ref_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "broad_product_persistence_now",
  "product_persistence_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "release_execution_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "review_memory_is_truth",
  "review_memory_is_proof",
  "review_memory_is_accepted_evidence",
  "review_memory_is_durable_perspective_state",
  "final_answer_candidate_is_truth",
  "final_answer_candidate_is_proof",
  "final_answer_candidate_is_accepted_evidence",
  "final_answer_candidate_is_promotion",
  "final_answer_candidate_is_product",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
]);
const authorityLikePatterns = [
  /_authority$/i,
  /_write_now$/i,
  /_call_now$/i,
  /_execution_now$/i,
  /_enabled_now$/i,
  /_runtime_now$/i,
  /_persistence_now$/i,
  /_is_truth$/i,
  /_is_proof$/i,
  /_is_accepted_evidence$/i,
  /_is_durable_perspective_state$/i,
  /_is_product$/i,
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
  /\braw[-_ ]?prompt\b/i,
  /\braw[-_ ]?provider[-_ ]?output\b/i,
  /\braw[-_ ]?retrieval[-_ ]?output\b/i,
  /\braw[-_ ]?source[-_ ]?body\b/i,
  /\braw[-_ ]?candidate[-_ ]?payload\b/i,
  /\braw[-_ ]?db[-_ ]?row\b/i,
  /\braw[-_ ]?conversation\b/i,
  /\bhidden[-_ ]?reasoning\b/i,
  /\bchain[-_ ]?of[-_ ]?thought\b/i,
  /\btelemetry[-_ ]?dump\b/i,
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
  "raw_prompt_non_persistent",
  "raw_provider_output_non_persistent",
  "raw_prompt_storage_policy",
  "raw_provider_output_storage_policy",
  "no_chain_of_thought_storage",
  "raw_prompt_stored_now",
  "raw_provider_output_stored_now",
  "raw_retrieval_output_stored_now",
  "raw_source_body_stored_now",
  "hidden_reasoning_stored_now",
  "chain_of_thought_stored_now",
]);
const unsafeKeyExactMatches = new Set([
  "raw_prompt",
  "raw_provider_output",
  "raw_retrieval_output",
  "raw_source_body",
  "raw_candidate_payload",
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
  /(?:^|_)(raw_prompt|raw_provider_output|raw_retrieval_output|raw_source_body|raw_candidate_payload|raw_db_row|raw_conversation)(?:_|$)/i,
  /(?:^|_)(hidden_reasoning|chain_of_thought|telemetry_dump|raw_diff|terminal_log|browser_dump|github_payload)(?:_|$)/i,
  /(?:^|_)provider_(thread|run|session)_id(?:_|$)/i,
  /(?:^|_)(connector_id|uploaded_file_id)(?:_|$)/i,
  /(?:^|_)(secret|token|api_key|password|private_key)(?:_|$)/i,
] as const;

export function createFinalRagAnswerReviewMemoryBindingAuthorityBoundaryV01(options: {
  dbQueryOrWriteNow?: boolean;
  reviewRecordPersistenceNow?: boolean;
  reviewRecordActivityPersistenceNow?: boolean;
  boundedReviewMemorySnapshotNow?: boolean;
} = {}): FinalRagAnswerReviewMemoryBindingAuthorityBoundaryV01 {
  return {
    final_rag_answer_review_memory_binding_now: true,
    explicit_operator_review_memory_binding_only: true,
    same_origin_post_route_now: true,
    caller_injected_review_memory_db_only: true,
    db_query_or_write_now: options.dbQueryOrWriteNow === true,
    review_memory_db_store_now: true,
    review_record_persistence_now: options.reviewRecordPersistenceNow === true,
    review_record_activity_persistence_now: options.reviewRecordActivityPersistenceNow === true,
    final_answer_candidate_input_required: true,
    answer_review_state_candidate_only_required: true,
    bounded_review_memory_snapshot_now: options.boundedReviewMemorySnapshotNow === true,
    source_refs_lineage_only: true,
    no_truth_language_required: true,
    no_proof_language_required: true,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    raw_prompt_stored_now: false,
    raw_provider_output_stored_now: false,
    raw_retrieval_output_stored_now: false,
    raw_source_body_stored_now: false,
    hidden_reasoning_stored_now: false,
    chain_of_thought_stored_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    final_rag_answer_generation_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    accepted_evidence_ref_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    broad_product_persistence_now: false,
    product_persistence_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    release_execution_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    review_memory_is_truth: false,
    review_memory_is_proof: false,
    review_memory_is_accepted_evidence: false,
    review_memory_is_durable_perspective_state: false,
    final_answer_candidate_is_truth: false,
    final_answer_candidate_is_proof: false,
    final_answer_candidate_is_accepted_evidence: false,
    final_answer_candidate_is_promotion: false,
    final_answer_candidate_is_product: false,
    source_ref_is_proof: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function preflightFinalRagAnswerReviewMemoryBindingRuntimeV01(
  input: unknown,
): FinalRagAnswerReviewMemoryBindingResultV01 | null {
  if (!isRecord(input)) {
    return createFinalRagAnswerReviewMemoryBindingFailureResultV01({
      status: "blocked_invalid_input",
      reason_codes: ["payload_invalid_object"],
      failure_codes: ["payload_invalid_object"],
    });
  }
  const payload = input as Partial<FinalRagAnswerReviewMemoryBindingRequestV01>;
  if (
    payload.request_version !== FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_REQUEST_VERSION_V01 ||
    payload.runtime_version !== FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_RUNTIME_VERSION_V01 ||
    payload.scope !== FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01
  ) {
    return createFinalRagAnswerReviewMemoryBindingFailureResultV01({
      status: "blocked_invalid_input",
      reason_codes: ["payload_version_or_scope_invalid"],
      failure_codes: ["payload_version_or_scope_invalid"],
    });
  }

  const forbiddenAuthorityFieldsFound = collectForbiddenAuthorityFields(input);
  if (forbiddenAuthorityFieldsFound.length > 0) {
    return createFinalRagAnswerReviewMemoryBindingFailureResultV01({
      status: "blocked_forbidden_authority",
      reason_codes: [
        "blocked_forbidden_authority",
        ...forbiddenAuthorityFieldsFound.map((field) => `blocked_authority:${field}`),
      ],
      failure_codes: ["blocked_forbidden_authority", ...forbiddenAuthorityFieldsFound],
    });
  }

  if (containsUnsafeRuntimePayload(input)) {
    return createFinalRagAnswerReviewMemoryBindingFailureResultV01({
      status: "blocked_private_or_raw_payload",
      reason_codes: ["blocked_private_or_raw_payload", "raw_private_payload_blocked"],
      failure_codes: ["blocked_private_or_raw_payload"],
    });
  }

  const candidateFailures = validateFinalAnswerCandidateResult(payload.final_answer_candidate_result);
  if (candidateFailures.length > 0) {
    return createFinalRagAnswerReviewMemoryBindingFailureResultV01({
      status: statusForFailures(candidateFailures),
      reason_codes: ["final_answer_candidate_result_invalid", ...candidateFailures],
      failure_codes: candidateFailures,
      input,
    });
  }

  const reviewPayloadFailures = validateOperatorReviewPayload(payload.operator_review_payload);
  if (reviewPayloadFailures.length > 0) {
    return createFinalRagAnswerReviewMemoryBindingFailureResultV01({
      status: statusForFailures(reviewPayloadFailures),
      reason_codes: ["operator_review_payload_invalid", ...reviewPayloadFailures],
      failure_codes: reviewPayloadFailures,
      input,
    });
  }

  const identityFailures = [
    validatePublicRef(payload.binding_request_id, "binding_request_id"),
    validatePublicRef(payload.requested_by, "requested_by"),
    validateIsoTimestamp(payload.requested_at, "requested_at"),
    validateIdempotencyKey(payload.idempotency_key),
    validateStringArray(payload.reason_codes, "reason_codes"),
  ].flat();
  if (identityFailures.length > 0) {
    return createFinalRagAnswerReviewMemoryBindingFailureResultV01({
      status: statusForFailures(identityFailures),
      reason_codes: ["binding_identity_invalid", ...identityFailures],
      failure_codes: identityFailures,
      input,
    });
  }

  if (!isSafeResearchCandidateReviewMemoryDbRoutePathV01(payload.review_memory_db_path)) {
    return createFinalRagAnswerReviewMemoryBindingFailureResultV01({
      status: "invalid_db_path",
      reason_codes: ["invalid_db_path", "review_memory_db_path_invalid"],
      failure_codes: ["invalid_db_path"],
      input,
    });
  }

  return null;
}

export function runFinalRagAnswerReviewMemoryBindingRuntimeV01(
  input: FinalRagAnswerReviewMemoryBindingRequestV01,
  db: ResearchCandidateReviewMemoryDbLike,
): FinalRagAnswerReviewMemoryBindingResultV01 {
  const preflight = preflightFinalRagAnswerReviewMemoryBindingRuntimeV01(input);
  if (preflight) return preflight;
  const createInput = buildFinalRagAnswerReviewMemoryCreateInputV01(input);
  const storeResult = createResearchCandidateReviewRecordV01(createInput, db);
  return createFinalRagAnswerReviewMemoryBindingStoreResultV01(input, storeResult);
}

export function buildFinalRagAnswerReviewMemoryCreateInputV01(
  input: FinalRagAnswerReviewMemoryBindingRequestV01,
): ResearchCandidateReviewMemoryDbCreateInputV01 {
  const candidate = input.final_answer_candidate_result;
  const reviewPayload = input.operator_review_payload;
  const candidateRefs = uniqueSorted([
    candidate.answer_candidate_ref as string,
    candidate.answer_request_id as string,
    candidate.rag_context_preview_ref as string,
  ]);
  const boundedAnswerExcerpt = boundedPublicText(candidate.bounded_answer, maxBoundedAnswerExcerptChars);
  const lifecycleState = reviewPayload.review_decision === "discard" ? "discarded" : "active";
  const boundaryAcknowledgements = [
    "final_answer_candidate_not_truth",
    "final_answer_candidate_not_proof",
    "final_answer_candidate_not_accepted_evidence",
    "final_answer_candidate_not_promotion",
    "final_answer_candidate_not_product",
    "review_memory_not_truth",
    "review_memory_not_proof",
    "review_memory_not_accepted_evidence",
    "review_memory_not_durable_state",
    "source_refs_are_lineage_not_proof",
    "product_write_not_executed",
  ];
  return {
    contract_version: contractVersion,
    scope: FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01,
    review_record_id: input.idempotency_key,
    record_kind: "candidate_review_snapshot",
    lifecycle_state: lifecycleState,
    review_decision: reviewPayload.review_decision,
    review_action: reviewPayload.review_action,
    candidate_ref: candidate.answer_candidate_ref as string,
    candidate_refs: candidateRefs,
    source_refs: candidate.cited_source_refs.map((sourceRef) => ({
      source_surface: "manual_source_ref" as const,
      source_ref: sourceRef,
      source_version: FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RUNTIME_VERSION_V01,
      public_safe: true,
    })),
    related_record_refs: [candidate.rag_context_preview_ref as string],
    reviewer_actor: reviewPayload.operator_actor_ref,
    operator_actor_ref: reviewPayload.operator_actor_ref,
    reviewer_note_summary: reviewPayload.reviewer_note_summary,
    bounded_summary: [
      `Answer candidate ref: ${candidate.answer_candidate_ref}.`,
      `Answer request ref: ${candidate.answer_request_id}.`,
      `RAG context preview ref: ${candidate.rag_context_preview_ref}.`,
      `Bounded answer excerpt: ${boundedAnswerExcerpt}.`,
      "Candidate-only warning: final answer candidate is not truth, proof, accepted evidence, promotion, durable state, Formation Receipt, product-write, or product.",
    ].join(" "),
    boundary_acknowledgements: boundaryAcknowledgements,
    privacy_report: {
      privacy_class: "public_safe",
      public_safe: true,
      raw_conversation_included: false,
      hidden_reasoning_included: false,
      raw_source_body_included: false,
      raw_candidate_payload_included: false,
      raw_provider_output_included: false,
      provider_thread_run_session_ids_included: false,
      private_urls_included: false,
      local_private_paths_included: false,
      secrets_included: false,
      raw_db_rows_included: false,
      raw_browser_dump_included: false,
      blocked_reason_codes: [],
    },
    authority_boundary: {
      ...createResearchCandidateReviewMemoryDbAuthorityBoundaryV01(),
    },
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      ...candidate.reason_codes,
      runtimeSliceRef,
      "bounded_review_memory_snapshot_now",
      "final_answer_candidate_input_required",
      "answer_review_state_candidate_only_required",
      "source_refs_are_lineage_not_proof",
      "review_memory_not_truth",
      "review_memory_not_proof",
      "review_memory_not_accepted_evidence",
      "review_memory_not_durable_state",
      "provider_call_not_executed",
      "prompt_not_sent",
      "retrieval_not_executed",
      "source_fetch_not_executed",
      "proof_not_created",
      "evidence_not_created",
      "promotion_not_executed",
      "durable_state_not_mutated",
      "formation_receipt_not_written",
      "product_write_denied",
      "product_id_allocation_not_executed",
      "git_github_not_executed",
    ]),
    created_at: input.requested_at,
    updated_at: input.requested_at,
    ...(lifecycleState === "discarded"
      ? { discard_reason: reviewPayload.reviewer_note_summary }
      : {}),
  };
}

export function createFinalRagAnswerReviewMemoryBindingFailureResultV01(input: {
  status: FinalRagAnswerReviewMemoryBindingStatusV01;
  reason_codes: string[];
  failure_codes: string[];
  input?: unknown;
}): FinalRagAnswerReviewMemoryBindingResultV01 {
  const payload = isRecord(input.input) ? input.input as Record<string, unknown> : {};
  const candidate = isRecord(payload.final_answer_candidate_result)
    ? payload.final_answer_candidate_result as Record<string, unknown>
    : {};
  return baseResult({
    status: input.status,
    binding_request_id: safePublicRefOrNull(payload.binding_request_id),
    answer_request_id: safePublicRefOrNull(candidate.answer_request_id),
    answer_candidate_ref: safePublicRefOrNull(candidate.answer_candidate_ref),
    review_record_id: safePublicRefOrNull(payload.idempotency_key),
    reason_codes: uniqueSorted([
      runtimeSliceRef,
      "review_memory_not_truth",
      "review_memory_not_proof",
      "review_memory_not_accepted_evidence",
      "review_memory_not_durable_state",
      "product_write_denied",
      ...input.reason_codes,
    ]),
    failure_codes: uniqueSorted(input.failure_codes),
  });
}

function createFinalRagAnswerReviewMemoryBindingStoreResultV01(
  input: FinalRagAnswerReviewMemoryBindingRequestV01,
  storeResult: ResearchCandidateReviewMemoryDbStoreResultV01,
): FinalRagAnswerReviewMemoryBindingResultV01 {
  const status = bindingStatusForStoreStatus(storeResult.status);
  return {
    ...baseResult({
      status,
      binding_request_id: input.binding_request_id,
      answer_request_id: input.final_answer_candidate_result.answer_request_id,
      answer_candidate_ref: input.final_answer_candidate_result.answer_candidate_ref,
      review_record_id: input.idempotency_key,
      reason_codes: uniqueSorted([
        runtimeSliceRef,
        "review_memory_binding_store_result",
        ...storeResult.reason_codes,
      ]),
      failure_codes: storeResult.error_code ? [storeResult.error_code] : [],
    }),
    store_status: storeResult.status,
    store_result: storeResult,
    review_memory_written:
      storeResult.status === "created" || storeResult.status === "idempotent_existing",
    db_query_or_write_executed: true,
    db_write_executed: storeResult.status === "created",
    authority_boundary: createFinalRagAnswerReviewMemoryBindingAuthorityBoundaryV01({
      dbQueryOrWriteNow: true,
      reviewRecordPersistenceNow:
        storeResult.status === "created" || storeResult.status === "idempotent_existing",
      reviewRecordActivityPersistenceNow:
        storeResult.status === "created" || storeResult.status === "idempotent_existing",
      boundedReviewMemorySnapshotNow:
        storeResult.status === "created" || storeResult.status === "idempotent_existing",
    }),
  };
}

function baseResult(input: {
  status: FinalRagAnswerReviewMemoryBindingStatusV01;
  binding_request_id: string | null;
  answer_request_id: string | null;
  answer_candidate_ref: string | null;
  review_record_id: string | null;
  reason_codes: string[];
  failure_codes: string[];
}): FinalRagAnswerReviewMemoryBindingResultV01 {
  return {
    result_version: FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_RESULT_VERSION_V01,
    runtime_version: FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_RUNTIME_VERSION_V01,
    scope: FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_SCOPE_V01,
    status: input.status,
    binding_request_id: input.binding_request_id,
    answer_request_id: input.answer_request_id,
    answer_candidate_ref: input.answer_candidate_ref,
    review_record_id: input.review_record_id,
    store_status: null,
    store_result: null,
    create_input: null,
    review_memory_written: false,
    db_query_or_write_executed: false,
    db_write_executed: false,
    provider_call_executed: false,
    prompt_sent: false,
    retrieval_executed: false,
    rag_answer_generated: false,
    final_answer_generated: false,
    source_fetch_executed: false,
    retrieval_index_write_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    durable_state_written: false,
    durable_state_applied: false,
    formation_receipt_written: false,
    product_write_executed: false,
    accepted_evidence_ref_write_executed: false,
    product_id_allocated: false,
    github_api_called: false,
    git_write_executed: false,
    release_executed: false,
    authority_boundary: createFinalRagAnswerReviewMemoryBindingAuthorityBoundaryV01(),
    reason_codes: uniqueSorted(input.reason_codes),
    failure_codes: uniqueSorted(input.failure_codes),
  };
}

function bindingStatusForStoreStatus(status: string): FinalRagAnswerReviewMemoryBindingStatusV01 {
  if (status === "created") return "created";
  if (status === "idempotent_existing") return "idempotent_existing";
  if (status === "conflict_existing_record") return "conflict_existing_record";
  if (status === "blocked_forbidden_authority") return "blocked_forbidden_authority";
  if (status === "blocked_private_or_raw_payload") return "blocked_private_or_raw_payload";
  if (status === "blocked_invalid_input") return "blocked_invalid_input";
  return "rejected";
}

function validateFinalAnswerCandidateResult(value: unknown): string[] {
  if (!isRecord(value)) return ["final_answer_candidate_result_missing"];
  const result = value as Partial<FinalRagAnswerCandidateReviewResultV01>;
  const failures: string[] = [];
  if (result.result_version !== FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RESULT_VERSION_V01) {
    failures.push("final_answer_candidate_result_version_invalid");
  }
  if (result.runtime_version !== FINAL_RAG_ANSWER_CANDIDATE_REVIEW_RUNTIME_VERSION_V01) {
    failures.push("final_answer_candidate_runtime_version_invalid");
  }
  if (result.scope !== FINAL_RAG_ANSWER_CANDIDATE_REVIEW_SCOPE_V01) {
    failures.push("final_answer_candidate_scope_invalid");
  }
  if (result.status !== "final_answer_candidate_created") {
    failures.push("final_answer_candidate_status_invalid");
  }
  if (result.answer_review_state !== "candidate_only") {
    failures.push("answer_review_state_candidate_only_required");
  }
  for (const field of trueCandidateResultFields) {
    if (result[field] !== true) failures.push(`${field}_not_true`);
  }
  for (const field of falseCandidateResultFields) {
    if (result[field] !== false) failures.push(`${field}_not_false`);
  }
  failures.push(...validatePublicRef(result.answer_candidate_ref, "answer_candidate_ref"));
  failures.push(...validatePublicRef(result.answer_request_id, "answer_request_id"));
  failures.push(...validatePublicRef(result.rag_context_preview_ref, "rag_context_preview_ref"));
  failures.push(...validateStringArray(result.retrieved_refs, "retrieved_refs"));
  failures.push(...validateStringArray(result.reason_codes, "candidate_reason_codes"));
  if (!Array.isArray(result.cited_source_refs) || result.cited_source_refs.length === 0) {
    failures.push("cited_source_refs_missing");
  } else {
    failures.push(...validateStringArray(result.cited_source_refs, "cited_source_refs"));
  }
  if (!isSafePublicText(result.bounded_answer, 3000)) failures.push("bounded_answer_invalid");
  const citedSet = new Set(Array.isArray(result.cited_source_refs) ? result.cited_source_refs : []);
  if (!Array.isArray(result.bounded_citation_notes)) {
    failures.push("bounded_citation_notes_invalid");
  } else {
    for (const [index, note] of result.bounded_citation_notes.entries()) {
      if (!isRecord(note)) {
        failures.push(`bounded_citation_notes.${index}_invalid`);
        continue;
      }
      const sourceRef = note.source_ref;
      failures.push(...validatePublicRef(sourceRef, `bounded_citation_notes.${index}.source_ref`));
      if (typeof sourceRef === "string" && !citedSet.has(sourceRef)) {
        failures.push("citation_note_source_ref_not_in_cited_source_refs");
      }
      if (!isSafePublicText(note.bounded_note, 800)) {
        failures.push(`bounded_citation_notes.${index}.bounded_note_invalid`);
      }
    }
  }
  if (Array.isArray(result.omitted_context_reasons)) {
    for (const [index, reason] of result.omitted_context_reasons.entries()) {
      if (!isRecord(reason)) {
        failures.push(`omitted_context_reasons.${index}_invalid`);
        continue;
      }
      for (const key of ["source_result_ref", "bounded_title", "reason"] as const) {
        if (!isSafePublicText(reason[key], 300)) {
          failures.push(`omitted_context_reasons.${index}.${key}_invalid`);
        }
      }
      if (reason.context_ref !== null && reason.context_ref !== undefined) {
        failures.push(...validatePublicRef(reason.context_ref, `omitted_context_reasons.${index}.context_ref`));
      }
    }
  }
  return uniqueSorted(failures);
}

function validateOperatorReviewPayload(value: unknown): string[] {
  if (!isRecord(value)) return ["operator_review_payload_missing"];
  const payload = value as Record<string, unknown>;
  const failures: string[] = [];
  if (payload.payload_version !== operatorPayloadVersion) failures.push("operator_payload_version_invalid");
  failures.push(...validatePublicRef(payload.operator_actor_ref, "operator_actor_ref"));
  if (typeof payload.review_decision !== "string" || !allowedReviewDecisions.has(payload.review_decision)) {
    failures.push("review_decision_invalid");
  }
  if (typeof payload.review_action !== "string" || !allowedReviewActions.has(payload.review_action)) {
    failures.push("review_action_invalid");
  }
  if (!isSafePublicText(payload.reviewer_note_summary, 800)) failures.push("reviewer_note_summary_invalid");
  if (payload.authority_boundary_acknowledged !== true) {
    failures.push("authority_boundary_acknowledged_required");
  }
  return failures;
}

function collectForbiddenAuthorityFields(input: unknown): string[] {
  const blocked: string[] = [];
  visitJson(input, (key, value) => {
    if (!key) return;
    if (allowedTrueAuthorityFields.has(key)) return;
    if (forbiddenAuthorityFields.has(key) || authorityLikePatterns.some((pattern) => pattern.test(key))) {
      if (!isFalseLikeAuthorityValue(value)) blocked.push(key);
    }
  });
  return uniqueSorted(blocked);
}

function containsUnsafeRuntimePayload(input: unknown): boolean {
  if (typeof input === "string") return unsafeTextPatterns.some((pattern) => pattern.test(input));
  if (Array.isArray(input)) return input.some((item) => containsUnsafeRuntimePayload(item));
  if (input && typeof input === "object") {
    return Object.entries(input as Record<string, unknown>).some(([key, value]) =>
      isUnsafeRuntimeKey(key) || containsUnsafeRuntimePayload(value),
    );
  }
  return false;
}

function isUnsafeRuntimeKey(key: unknown): boolean {
  if (typeof key !== "string") return false;
  const normalized = key.trim().replace(/[-\s]+/g, "_").toLowerCase();
  if (safePolicyKeyExceptions.has(normalized)) return false;
  return unsafeKeyExactMatches.has(normalized) ||
    unsafeKeyPatterns.some((pattern) => pattern.test(normalized));
}

function statusForFailures(failures: string[]): FinalRagAnswerReviewMemoryBindingStatusV01 {
  if (
    failures.some((failure) =>
      /unsafe|private|raw|secret|token|provider_thread|provider_run|provider_session/i.test(failure),
    )
  ) {
    return "blocked_private_or_raw_payload";
  }
  return "blocked_invalid_input";
}

function validateStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) return [`${label}_invalid`];
  return value.flatMap((item, index) => validatePublicRef(item, `${label}.${index}`));
}

function validatePublicRef(value: unknown, label: string): string[] {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 240) {
    return [`${label}_invalid`];
  }
  if (value.includes("/") || value.includes("\\") || value.includes("..") || value.includes("\0")) {
    return [`${label}_invalid`];
  }
  if (unsafeTextPatterns.some((pattern) => pattern.test(value))) {
    return [`${label}_unsafe_private_or_raw_marker`];
  }
  return [];
}

function validateIdempotencyKey(value: unknown): string[] {
  const publicRefFailures = validatePublicRef(value, "idempotency_key");
  if (publicRefFailures.length > 0) return publicRefFailures;
  if (typeof value !== "string" || !/^[A-Za-z0-9:._-]+$/.test(value)) {
    return ["idempotency_key_invalid"];
  }
  return [];
}

function validateIsoTimestamp(value: unknown, label: string): string[] {
  if (typeof value !== "string") return [`${label}_invalid`];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    return [`${label}_invalid`];
  }
  return [];
}

function isSafePublicText(value: unknown, maxChars = maxPublicTextChars): value is string {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxChars &&
    !containsUnsafeRuntimePayload(value);
}

function safePublicRefOrNull(value: unknown): string | null {
  return validatePublicRef(value, "safe_ref").length === 0 ? value as string : null;
}

function boundedPublicText(value: unknown, maxChars: number): string {
  if (typeof value !== "string") return "No bounded answer excerpt available.";
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length === 0 || containsUnsafeRuntimePayload(compact)) {
    return "No bounded answer excerpt available.";
  }
  return compact.slice(0, maxChars);
}

function isFalseLikeAuthorityValue(value: unknown): boolean {
  return value === false || value === null || value === undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function visitJson(
  value: unknown,
  visitor: (key: string | null, value: unknown) => void,
  key: string | null = null,
): void {
  visitor(key, value);
  if (Array.isArray(value)) {
    value.forEach((item) => visitJson(item, visitor, null));
    return;
  }
  if (!isRecord(value)) return;
  for (const [nestedKey, nestedValue] of Object.entries(value)) {
    visitJson(nestedValue, visitor, nestedKey);
  }
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
