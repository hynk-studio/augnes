import {
  isSafeResearchCandidateReviewMemoryDbRoutePathV01,
  isSafeResearchCandidateReviewMemoryDbRouteRefV01,
} from "@/lib/research-candidate-review/review-memory-db-route-contract";
import {
  readResearchCandidateReviewRecordV01,
  type ResearchCandidateReviewMemoryDbActivityV01,
  type ResearchCandidateReviewMemoryDbLike,
  type ResearchCandidateReviewMemoryDbRecordV01,
} from "@/lib/research-candidate-review/review-memory-db-store";
import {
  PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_REQUEST_VERSION_V01,
  PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_RESULT_VERSION_V01,
  PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_RUNTIME_VERSION_V01,
  PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_SCOPE_V01,
  type PromotionReadinessGateReportV01,
  type PromotionReadinessPacketAuthorityBoundaryV01,
  type PromotionReadinessPacketFromReviewMemoryRequestV01,
  type PromotionReadinessPacketFromReviewMemoryResultV01,
  type PromotionReadinessPacketFromReviewMemoryStatusV01,
  type PromotionReadinessPacketPolicyV01,
} from "@/types/promotion-readiness-packet-from-review-memory";

const runtimeSliceRef = "promotion_readiness_packet_from_review_memory_v0_1";
const maxPublicTextChars = 2400;
const defaultMaxSummaryChars = 900;
const maxAllowedActivityItems = 25;

const allowedTrueAuthorityFields = new Set([
  "promotion_readiness_packet_from_review_memory_now",
  "explicit_operator_readiness_packet_only",
  "same_origin_post_route_now",
  "read_only_review_memory_db_query_now",
  "review_memory_record_read_now",
  "bounded_readiness_packet_now",
  "gate_report_diagnostic_now",
  "source_refs_lineage_only",
  "final_answer_candidate_input_supported",
  "no_truth_language_required",
  "no_proof_language_required",
]);
const forbiddenAuthorityFields = new Set([
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "promotion_decision_store_write_now",
  "promotion_route_write_now",
  "promotion_decision_ui_now",
  "formation_receipt_write_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "accepted_evidence_ref_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "broad_product_persistence_now",
  "product_persistence_now",
  "final_answer_generation_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "source_fetch_now",
  "retrieval_index_write_now",
  "embedding_created_now",
  "vector_search_now",
  "review_memory_write_now",
  "review_record_create_now",
  "review_record_activity_write_now",
  "review_record_discard_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "release_execution_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "readiness_packet_is_promotion",
  "readiness_packet_is_proof",
  "readiness_packet_is_evidence",
  "readiness_packet_is_accepted_evidence",
  "readiness_packet_is_durable_state",
  "readiness_packet_is_product",
  "review_memory_is_truth",
  "review_memory_is_proof",
  "review_memory_is_accepted_evidence",
  "review_memory_is_durable_perspective_state",
  "final_answer_candidate_is_truth",
  "final_answer_candidate_is_proof",
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
  /_is_evidence$/i,
  /_is_accepted_evidence$/i,
  /_is_durable_state$/i,
  /_is_durable_perspective_state$/i,
  /_is_product$/i,
] as const;
const unsafeTextPatterns = [
  /SAFE_MARKER_/i,
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[[^\]]+\])/i,
  /\bhttps?:\/\/[^/\s]*(?:private|internal|intranet|corp|\.local)[^/\s]*/i,
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
  /\btoken\b/i,
  /private key/i,
  /-----BEGIN PRIVATE KEY-----/i,
  /-----BEGIN RSA PRIVATE KEY-----/i,
  /-----BEGIN OPENSSH PRIVATE KEY-----/i,
] as const;
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
const safePolicyKeyExceptions = new Set([
  "require_no_truth_claims",
  "require_no_proof_claims",
  "require_no_product_write",
  "no_truth_language_required",
  "no_proof_language_required",
  "raw_request_body_stored_now",
  "raw_response_body_stored_now",
  "raw_provider_output_stored_now",
  "raw_retrieval_output_stored_now",
  "raw_source_body_stored_now",
  "hidden_reasoning_stored_now",
  "raw_prompt_stored_now",
  "raw_provider_output_included",
  "raw_retrieval_output_included",
  "raw_source_body_included",
  "raw_candidate_payload_included",
  "raw_conversation_included",
  "raw_db_rows_included",
  "hidden_reasoning_included",
  "provider_thread_run_session_ids_included",
]);
const unsafeKeyPatterns = [
  /(?:^|_)(raw_prompt|raw_provider_output|raw_retrieval_output|raw_source_body|raw_candidate_payload|raw_db_row|raw_conversation)(?:_|$)/i,
  /(?:^|_)(hidden_reasoning|chain_of_thought|telemetry_dump|raw_diff|terminal_log|browser_dump|github_payload)(?:_|$)/i,
  /(?:^|_)provider_(thread|run|session)_id(?:_|$)/i,
  /(?:^|_)(connector_id|uploaded_file_id)(?:_|$)/i,
  /(?:^|_)(secret|token|api_key|password|private_key)(?:_|$)/i,
] as const;

export function createPromotionReadinessPacketAuthorityBoundaryV01(options: {
  readOnlyReviewMemoryDbQueryNow?: boolean;
  reviewMemoryRecordReadNow?: boolean;
  boundedReadinessPacketNow?: boolean;
  gateReportDiagnosticNow?: boolean;
} = {}): PromotionReadinessPacketAuthorityBoundaryV01 {
  return {
    promotion_readiness_packet_from_review_memory_now: true,
    explicit_operator_readiness_packet_only: true,
    same_origin_post_route_now: true,
    read_only_review_memory_db_query_now: options.readOnlyReviewMemoryDbQueryNow === true,
    review_memory_record_read_now: options.reviewMemoryRecordReadNow === true,
    bounded_readiness_packet_now: options.boundedReadinessPacketNow === true,
    gate_report_diagnostic_now: options.gateReportDiagnosticNow === true,
    source_refs_lineage_only: true,
    final_answer_candidate_input_supported: true,
    no_truth_language_required: true,
    no_proof_language_required: true,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    promotion_decision_store_write_now: false,
    promotion_route_write_now: false,
    promotion_decision_ui_now: false,
    formation_receipt_write_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    accepted_evidence_ref_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    broad_product_persistence_now: false,
    product_persistence_now: false,
    final_answer_generation_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    retrieval_execution_now: false,
    source_fetch_now: false,
    retrieval_index_write_now: false,
    embedding_created_now: false,
    vector_search_now: false,
    review_memory_write_now: false,
    review_record_create_now: false,
    review_record_activity_write_now: false,
    review_record_discard_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    release_execution_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    readiness_packet_is_promotion: false,
    readiness_packet_is_proof: false,
    readiness_packet_is_evidence: false,
    readiness_packet_is_accepted_evidence: false,
    readiness_packet_is_durable_state: false,
    readiness_packet_is_product: false,
    review_memory_is_truth: false,
    review_memory_is_proof: false,
    review_memory_is_accepted_evidence: false,
    review_memory_is_durable_perspective_state: false,
    final_answer_candidate_is_truth: false,
    final_answer_candidate_is_proof: false,
    source_ref_is_proof: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function preflightPromotionReadinessPacketFromReviewMemoryV01(
  input: unknown,
): PromotionReadinessPacketFromReviewMemoryResultV01 | null {
  if (!isRecord(input)) {
    return createPromotionReadinessPacketFailureResultV01({
      status: "blocked_invalid_input",
      reason_codes: ["payload_invalid_object"],
      failure_codes: ["payload_invalid_object"],
    });
  }
  const payload = input as Partial<PromotionReadinessPacketFromReviewMemoryRequestV01>;
  if (
    payload.request_version !== PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_REQUEST_VERSION_V01 ||
    payload.runtime_version !== PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_RUNTIME_VERSION_V01 ||
    payload.scope !== PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_SCOPE_V01
  ) {
    return createPromotionReadinessPacketFailureResultV01({
      status: "blocked_invalid_input",
      reason_codes: ["payload_version_or_scope_invalid"],
      failure_codes: ["payload_version_or_scope_invalid"],
      input,
    });
  }

  const forbiddenAuthorityFieldsFound = collectForbiddenAuthorityFields(input);
  if (forbiddenAuthorityFieldsFound.length > 0) {
    return createPromotionReadinessPacketFailureResultV01({
      status: "blocked_forbidden_authority",
      reason_codes: [
        "blocked_forbidden_authority",
        ...forbiddenAuthorityFieldsFound.map((field) => `blocked_authority:${field}`),
      ],
      failure_codes: ["blocked_forbidden_authority", ...forbiddenAuthorityFieldsFound],
      input,
    });
  }

  if (containsUnsafeRuntimePayload(input)) {
    return createPromotionReadinessPacketFailureResultV01({
      status: "blocked_private_or_raw_payload",
      reason_codes: ["blocked_private_or_raw_payload", "raw_private_payload_blocked"],
      failure_codes: ["blocked_private_or_raw_payload"],
      input,
    });
  }

  const identityFailures = [
    validatePublicRef(payload.readiness_packet_request_id, "readiness_packet_request_id"),
    validatePublicRef(payload.requested_by, "requested_by"),
    validateIsoTimestamp(payload.requested_at, "requested_at"),
    validatePublicRef(payload.review_record_id, "review_record_id"),
    validateStringArray(payload.reason_codes, "reason_codes"),
    validateBoundedNumber(payload.max_activity_items, "max_activity_items", 0, maxAllowedActivityItems),
    validateBoundedNumber(payload.max_summary_chars, "max_summary_chars", 120, 1600),
  ].flat();
  if (payload.include_activity !== true && payload.include_activity !== false) {
    identityFailures.push("include_activity_invalid");
  }
  const policyFailures = validateReadinessPolicy(payload.readiness_policy);
  const failures = [...identityFailures, ...policyFailures];
  if (failures.length > 0) {
    return createPromotionReadinessPacketFailureResultV01({
      status: statusForFailures(failures),
      reason_codes: ["readiness_packet_request_invalid", ...failures],
      failure_codes: failures,
      input,
    });
  }

  if (!isSafeResearchCandidateReviewMemoryDbRoutePathV01(payload.review_memory_db_path)) {
    return createPromotionReadinessPacketFailureResultV01({
      status: "invalid_db_path",
      reason_codes: ["invalid_db_path", "review_memory_db_path_invalid"],
      failure_codes: ["invalid_db_path"],
      input,
    });
  }

  return null;
}

export function buildPromotionReadinessPacketFromReviewMemoryV01(
  input: PromotionReadinessPacketFromReviewMemoryRequestV01,
  db: ResearchCandidateReviewMemoryDbLike,
): PromotionReadinessPacketFromReviewMemoryResultV01 {
  const preflight = preflightPromotionReadinessPacketFromReviewMemoryV01(input);
  if (preflight) return preflight;
  const storeResult = readResearchCandidateReviewRecordV01(input.review_record_id, db);
  if (storeResult.status === "not_found" || !storeResult.record) {
    return createPromotionReadinessPacketFailureResultV01({
      status: "not_found",
      reason_codes: ["review_record_not_found", ...storeResult.reason_codes],
      failure_codes: ["not_found"],
      input,
    });
  }
  if (storeResult.status === "blocked_private_or_raw_payload") {
    return createPromotionReadinessPacketFailureResultV01({
      status: "blocked_private_or_raw_payload",
      reason_codes: ["review_record_private_or_raw_payload_blocked"],
      failure_codes: ["blocked_private_or_raw_payload"],
      input,
    });
  }
  if (storeResult.status !== "read") {
    return createPromotionReadinessPacketFailureResultV01({
      status: "rejected",
      reason_codes: ["review_record_read_rejected_bounded", ...storeResult.reason_codes],
      failure_codes: [storeResult.status],
      input,
    });
  }

  return buildPacketFromRecord(input, storeResult.record, storeResult.activities);
}

export function createPromotionReadinessPacketFailureResultV01(input: {
  status: PromotionReadinessPacketFromReviewMemoryStatusV01;
  reason_codes: string[];
  failure_codes: string[];
  input?: unknown;
}): PromotionReadinessPacketFromReviewMemoryResultV01 {
  const payload = isRecord(input.input) ? input.input as Record<string, unknown> : {};
  return baseResult({
    status: input.status,
    readiness_packet_request_id: safePublicRefOrNull(payload.readiness_packet_request_id),
    review_record_ref: safePublicRefOrNull(payload.review_record_id),
    reason_codes: uniqueSorted([
      runtimeSliceRef,
      "readiness_packet_is_not_promotion",
      "readiness_packet_is_not_proof",
      "readiness_packet_is_not_evidence",
      "readiness_packet_is_not_accepted_evidence",
      "readiness_packet_is_not_durable_state",
      "readiness_packet_is_not_product",
      ...input.reason_codes,
    ]),
    failure_codes: uniqueSorted(input.failure_codes),
  });
}

function buildPacketFromRecord(
  input: PromotionReadinessPacketFromReviewMemoryRequestV01,
  record: ResearchCandidateReviewMemoryDbRecordV01,
  activities: ResearchCandidateReviewMemoryDbActivityV01[],
): PromotionReadinessPacketFromReviewMemoryResultV01 {
  const recordSafetyFailures = validateReviewMemoryRecordForReadiness(record, activities);
  if (recordSafetyFailures.includes("blocked_private_or_raw_payload")) {
    return createPromotionReadinessPacketFailureResultV01({
      status: "blocked_private_or_raw_payload",
      reason_codes: ["review_record_private_or_raw_payload_blocked"],
      failure_codes: recordSafetyFailures,
      input,
    });
  }

  const candidateRefs = uniqueSorted(record.candidate_refs.filter(isSafePublicRef));
  const sourceRefs = uniqueSorted(
    record.source_refs
      .filter((sourceRef) => sourceRef.public_safe === true)
      .map((sourceRef) => sourceRef.source_ref)
      .filter(isSafePublicRef),
  );
  const boundaryAcknowledgements = uniqueSorted(
    record.boundary_acknowledgements.filter((acknowledgement) =>
      isSafePublicText(acknowledgement),
    ),
  );
  const finalAnswerCandidateMarker = hasFinalAnswerCandidateReviewMarker(record);
  const missingItems: string[] = [];
  const blockingItems: string[] = [];
  const warningItems: string[] = [];

  if (!finalAnswerCandidateMarker) {
    warningItems.push("candidate_review_snapshot_marker_missing");
  }
  if (record.record_kind !== "candidate_review_snapshot") {
    warningItems.push("record_kind_not_candidate_review_snapshot");
  }
  if (candidateRefs.length === 0) {
    missingItems.push("candidate_refs");
    blockingItems.push("candidate_refs_missing");
  }
  if (sourceRefs.length === 0) {
    missingItems.push("source_refs");
    blockingItems.push("source_refs_missing");
  }
  if (boundaryAcknowledgements.length === 0) {
    missingItems.push("boundary_acknowledgements");
    blockingItems.push("boundary_acknowledgements_missing");
  }
  if (record.lifecycle_state === "discarded" || record.review_decision === "discard") {
    warningItems.push("review_record_discarded_or_rejected");
    blockingItems.push("discarded_review_record_not_ready");
  }

  const unsafeBoundaryAuthority = collectUnsafeRecordAuthorityMarkers(record);
  blockingItems.push(...unsafeBoundaryAuthority);

  const status = statusForReadiness(blockingItems);
  const activityItems = input.include_activity
    ? activities
        .filter((activity) => validateActivityForDisplay(activity).length === 0)
        .slice(0, input.max_activity_items)
    : [];
  const readinessPacketRef =
    status === "ready_for_operator_promotion_review" || status === "needs_more_evidence"
      ? `promotion-readiness-packet:${input.readiness_packet_request_id}`
      : null;
  const gateReport = createGateReport({
    record,
    candidateRefs,
    sourceRefs,
    boundaryAcknowledgements,
    finalAnswerCandidateMarker,
    activityIncluded: input.include_activity,
    status,
  });
  return {
    ...baseResult({
      status,
      readiness_packet_request_id: input.readiness_packet_request_id,
      review_record_ref: record.review_record_id,
      reason_codes: uniqueSorted([
        runtimeSliceRef,
        "bounded_readiness_packet_from_review_memory",
        "read_only_review_memory_db_query",
        "promotion_decision_required_later_not_written_now",
        "formation_receipt_required_later_not_written_now",
        "readiness_packet_is_not_promotion",
        "readiness_packet_is_not_proof",
        "readiness_packet_is_not_evidence",
        "readiness_packet_is_not_accepted_evidence",
        "readiness_packet_is_not_durable_state",
        "readiness_packet_is_not_product",
        ...input.reason_codes,
      ]),
      failure_codes: blockingItems,
    }),
    readiness_packet_ref: readinessPacketRef,
    review_record_kind: record.record_kind,
    review_lifecycle_state: record.lifecycle_state,
    review_decision: record.review_decision,
    review_action: record.review_action,
    candidate_refs: candidateRefs,
    source_refs: sourceRefs,
    activity_refs: activityItems.map((activity) => activity.activity_id),
    readiness_state: status,
    readiness_summary: buildReadinessSummary(record, status, input.max_summary_chars),
    readiness_gate_report: gateReport,
    missing_items: uniqueSorted(missingItems),
    blocking_items: uniqueSorted(blockingItems),
    warning_items: uniqueSorted(warningItems),
    non_authority_notes: createNonAuthorityNotes(),
    operator_next_actions: operatorNextActionsForStatus(status),
    promotion_readiness_packet_generated:
      status === "ready_for_operator_promotion_review" || status === "needs_more_evidence",
    activity_summaries: activityItems.map((activity) => ({
      activity_id: activity.activity_id,
      activity_kind: activity.activity_kind,
      summary: boundedPublicText(activity.summary, 260),
      created_at: activity.created_at,
    })),
    authority_boundary: createPromotionReadinessPacketAuthorityBoundaryV01({
      readOnlyReviewMemoryDbQueryNow: true,
      reviewMemoryRecordReadNow: true,
      boundedReadinessPacketNow:
        status === "ready_for_operator_promotion_review" || status === "needs_more_evidence",
      gateReportDiagnosticNow: true,
    }),
  };
}

function baseResult(input: {
  status: PromotionReadinessPacketFromReviewMemoryStatusV01;
  readiness_packet_request_id: string | null;
  review_record_ref: string | null;
  reason_codes: string[];
  failure_codes: string[];
}): PromotionReadinessPacketFromReviewMemoryResultV01 {
  return {
    result_version: PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_RESULT_VERSION_V01,
    runtime_version: PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_RUNTIME_VERSION_V01,
    scope: PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_SCOPE_V01,
    status: input.status,
    readiness_packet_ref: null,
    readiness_packet_request_id: input.readiness_packet_request_id,
    review_record_ref: input.review_record_ref,
    review_record_kind: null,
    review_lifecycle_state: null,
    review_decision: null,
    review_action: null,
    candidate_refs: [],
    source_refs: [],
    activity_refs: [],
    readiness_state: input.status,
    readiness_summary: "No promotion readiness packet was generated.",
    readiness_gate_report: {
      require_review_record: "blocked",
      require_candidate_review_snapshot: "blocked",
      require_candidate_refs: "blocked",
      require_source_refs: "blocked",
      require_boundary_acknowledgements: "blocked",
      require_no_truth_claims: "passed",
      require_no_proof_claims: "passed",
      require_no_product_write: "passed",
      lifecycle_state: "active_or_reviewable",
      activity_included: false,
    },
    missing_items: [],
    blocking_items: input.failure_codes,
    warning_items: [],
    non_authority_notes: createNonAuthorityNotes(),
    operator_next_actions: operatorNextActionsForStatus(input.status),
    promotion_decision_candidate_ref: null,
    formation_receipt_ref: null,
    durable_state_ref: null,
    product_write_ref: null,
    accepted_evidence_ref_write_ref: null,
    provider_call_executed: false,
    prompt_sent: false,
    retrieval_executed: false,
    source_fetch_executed: false,
    retrieval_index_write_executed: false,
    review_memory_written: false,
    promotion_readiness_packet_generated: false,
    promotion_executed: false,
    promotion_decision_written: false,
    promotion_decision_store_written: false,
    formation_receipt_written: false,
    durable_state_written: false,
    durable_state_applied: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    accepted_evidence_ref_write_executed: false,
    product_id_allocated: false,
    github_api_called: false,
    git_write_executed: false,
    release_executed: false,
    activity_summaries: [],
    authority_boundary: createPromotionReadinessPacketAuthorityBoundaryV01(),
    reason_codes: uniqueSorted(input.reason_codes),
    failure_codes: uniqueSorted(input.failure_codes),
  };
}

function validateReadinessPolicy(value: unknown): string[] {
  if (!isRecord(value)) return ["readiness_policy_missing"];
  const policy = value as Partial<PromotionReadinessPacketPolicyV01>;
  const failures: string[] = [];
  for (const key of [
    "require_review_record",
    "require_candidate_review_snapshot",
    "require_candidate_refs",
    "require_source_refs",
    "require_boundary_acknowledgements",
    "require_no_truth_claims",
    "require_no_proof_claims",
    "require_no_product_write",
  ] as const) {
    if (policy[key] !== true) failures.push(`${key}_required`);
  }
  if (policy.unresolved_tension_policy !== "preserve_or_flag") {
    failures.push("unresolved_tension_policy_invalid");
  }
  if (policy.knowledge_gap_policy !== "preserve_or_flag") {
    failures.push("knowledge_gap_policy_invalid");
  }
  if (policy.formation_receipt_policy !== "required_later_not_written_now") {
    failures.push("formation_receipt_policy_invalid");
  }
  if (policy.promotion_decision_policy !== "operator_decision_required_later_not_written_now") {
    failures.push("promotion_decision_policy_invalid");
  }
  return failures;
}

function validateReviewMemoryRecordForReadiness(
  record: ResearchCandidateReviewMemoryDbRecordV01,
  activities: ResearchCandidateReviewMemoryDbActivityV01[],
): string[] {
  const values = [
    record.review_record_id,
    record.record_kind,
    record.lifecycle_state,
    record.review_decision,
    record.review_action,
    record.reviewer_actor,
    record.reviewer_note_summary,
    record.bounded_summary,
    record.discard_reason,
    ...record.candidate_refs,
    ...record.related_record_refs,
    ...record.boundary_acknowledgements,
    ...record.reason_codes,
    ...record.source_refs.flatMap((sourceRef) => [
      sourceRef.source_ref,
      sourceRef.source_surface,
      sourceRef.source_version,
    ]),
    ...activities.flatMap((activity) => [
      activity.activity_id,
      activity.activity_kind,
      activity.actor_ref,
      activity.summary,
      ...activity.reason_codes,
    ]),
  ];
  if (values.some((value) => typeof value === "string" && !isSafePublicText(value))) {
    return ["blocked_private_or_raw_payload"];
  }
  const privacyReport = record.privacy_report;
  if (
    privacyReport.public_safe !== true ||
    privacyReport.raw_conversation_included !== false ||
    privacyReport.hidden_reasoning_included !== false ||
    privacyReport.raw_source_body_included !== false ||
    privacyReport.raw_candidate_payload_included !== false ||
    privacyReport.raw_provider_output_included !== false ||
    privacyReport.provider_thread_run_session_ids_included !== false ||
    privacyReport.private_urls_included !== false ||
    privacyReport.local_private_paths_included !== false ||
    privacyReport.secrets_included !== false ||
    privacyReport.raw_db_rows_included !== false ||
    privacyReport.raw_browser_dump_included !== false
  ) {
    return ["blocked_private_or_raw_payload"];
  }
  return [];
}

function validateActivityForDisplay(activity: ResearchCandidateReviewMemoryDbActivityV01): string[] {
  const values = [
    activity.activity_id,
    activity.review_record_id,
    activity.activity_kind,
    activity.actor_ref,
    activity.summary,
    activity.created_at,
    ...activity.reason_codes,
  ];
  return values.every((value) => typeof value === "string" && isSafePublicText(value))
    ? []
    : ["activity_private_or_raw_payload_blocked"];
}

function collectUnsafeRecordAuthorityMarkers(record: ResearchCandidateReviewMemoryDbRecordV01): string[] {
  const joined = [
    record.bounded_summary,
    record.reviewer_note_summary,
    ...record.boundary_acknowledgements,
    ...record.reason_codes,
  ].filter((value): value is string => typeof value === "string").join(" ");
  const blocked: string[] = [];
  if (/(?:^|\b)(proof|evidence)[-_ ]?(?:record|created|authority|write)(?:\b|$)/i.test(joined)) {
    blocked.push("proof_or_evidence_authority_marker_present");
  }
  if (/\bpromotion[-_ ]?(?:executed|authority|decision_written|write)\b/i.test(joined)) {
    blocked.push("promotion_authority_marker_present");
  }
  if (/\bproduct[-_ ]?write[-_ ]?(?:executed|authority|now)\b/i.test(joined)) {
    blocked.push("product_write_authority_marker_present");
  }
  if (/\baccepted[-_ ]?evidence[-_ ]?ref[-_ ]?write\b/i.test(joined)) {
    blocked.push("accepted_evidence_authority_marker_present");
  }
  if (/\bdurable[-_ ]?state[-_ ]?(?:written|applied|authority)\b/i.test(joined)) {
    blocked.push("durable_state_authority_marker_present");
  }
  if (/\bformation[-_ ]?receipt[-_ ]?(?:written|authority)\b/i.test(joined)) {
    blocked.push("formation_receipt_authority_marker_present");
  }
  return uniqueSorted(blocked);
}

function hasFinalAnswerCandidateReviewMarker(record: ResearchCandidateReviewMemoryDbRecordV01): boolean {
  return (
    record.record_kind === "candidate_review_snapshot" ||
    record.candidate_refs.some((ref) => ref.startsWith("final-rag-answer-candidate:")) ||
    record.reason_codes.includes("final_rag_answer_candidate_review_memory_binding_v0_1") ||
    record.boundary_acknowledgements.includes("final_answer_candidate_not_truth") ||
    record.boundary_acknowledgements.includes("review_memory_not_truth")
  );
}

function createGateReport(input: {
  record: ResearchCandidateReviewMemoryDbRecordV01;
  candidateRefs: string[];
  sourceRefs: string[];
  boundaryAcknowledgements: string[];
  finalAnswerCandidateMarker: boolean;
  activityIncluded: boolean;
  status: PromotionReadinessPacketFromReviewMemoryStatusV01;
}): PromotionReadinessGateReportV01 {
  return {
    require_review_record: "passed",
    require_candidate_review_snapshot: input.finalAnswerCandidateMarker ? "passed" : "warning",
    require_candidate_refs: input.candidateRefs.length > 0 ? "passed" : "blocked",
    require_source_refs: input.sourceRefs.length > 0 ? "passed" : "blocked",
    require_boundary_acknowledgements:
      input.boundaryAcknowledgements.length > 0 ? "passed" : "blocked",
    require_no_truth_claims: "passed",
    require_no_proof_claims: "passed",
    require_no_product_write: "passed",
    lifecycle_state:
      input.record.lifecycle_state === "discarded" || input.record.review_decision === "discard"
        ? "discarded_or_rejected"
        : "active_or_reviewable",
    activity_included: input.activityIncluded,
  };
}

function statusForReadiness(blockingItems: string[]): PromotionReadinessPacketFromReviewMemoryStatusV01 {
  if (blockingItems.includes("candidate_refs_missing")) return "blocked_missing_candidate_refs";
  if (blockingItems.includes("source_refs_missing")) return "blocked_missing_source_refs";
  if (blockingItems.includes("boundary_acknowledgements_missing")) return "blocked_boundary_acknowledgements";
  if (blockingItems.length > 0) return "needs_more_evidence";
  return "ready_for_operator_promotion_review";
}

function buildReadinessSummary(
  record: ResearchCandidateReviewMemoryDbRecordV01,
  status: PromotionReadinessPacketFromReviewMemoryStatusV01,
  maxSummaryChars: number,
): string {
  const compact = [
    `Readiness state: ${status}.`,
    `Review record: ${record.review_record_id}.`,
    `Record kind: ${record.record_kind}.`,
    `Lifecycle: ${record.lifecycle_state}.`,
    `Review decision: ${record.review_decision}.`,
    "This packet is diagnostic only and is not promotion, proof, evidence, accepted evidence, durable state, Formation Receipt, product-write, or product authority.",
    `Review summary: ${boundedPublicText(record.bounded_summary, Math.min(maxSummaryChars, defaultMaxSummaryChars))}`,
  ].join(" ");
  return boundedPublicText(compact, maxSummaryChars);
}

function createNonAuthorityNotes(): string[] {
  return [
    "Readiness packet is diagnostic and not promotion.",
    "Readiness packet is not proof, evidence, accepted evidence, durable state, Formation Receipt, product-write, product authority, or approval.",
    "Review Memory is not truth, proof, accepted evidence, or durable Perspective state.",
    "Final answer candidate remains candidate-only.",
    "Source refs are lineage pointers, not proof.",
    "Operator must separately decide any future promotion.",
    "Smoke/CI pass is not truth.",
  ];
}

function operatorNextActionsForStatus(
  status: PromotionReadinessPacketFromReviewMemoryStatusV01,
): string[] {
  if (status === "ready_for_operator_promotion_review") {
    return [
      "Operator may review this packet for a future separately approved promotion decision.",
      "Do not treat this packet as promotion, proof, evidence, durable state, Formation Receipt, or product-write authority.",
    ];
  }
  if (status === "needs_more_evidence") {
    return [
      "Operator should inspect blocking and warning items before any future promotion decision.",
      "Additional source review or Review Memory updates require separate approved routes.",
    ];
  }
  return [
    "Resolve the bounded failure before considering any future promotion decision.",
    "Do not infer proof, evidence, promotion, durable state, or product-write authority from this result.",
  ];
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

function validateStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) return [`${label}_invalid`];
  return value.flatMap((item, index) => validatePublicRef(item, `${label}.${index}`));
}

function validatePublicRef(value: unknown, label: string): string[] {
  if (!isSafePublicRef(value)) return [`${label}_invalid`];
  return [];
}

function isSafePublicRef(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 256) return false;
  if (value.includes("/") || value.includes("\\") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  return !unsafeTextPatterns.some((pattern) => pattern.test(value));
}

function validateBoundedNumber(value: unknown, label: string, min: number, max: number): string[] {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    return [`${label}_invalid`];
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
    !unsafeTextPatterns.some((pattern) => pattern.test(value));
}

function safePublicRefOrNull(value: unknown): string | null {
  return isSafePublicRef(value) ? value : null;
}

function boundedPublicText(value: unknown, maxChars: number): string {
  if (typeof value !== "string") return "No bounded public-safe text available.";
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length === 0 || !isSafePublicText(compact, Math.max(maxChars, compact.length))) {
    return "Blocked unsafe or unavailable public-safe text.";
  }
  return compact.slice(0, maxChars);
}

function statusForFailures(failures: string[]): PromotionReadinessPacketFromReviewMemoryStatusV01 {
  if (failures.some((failure) => /unsafe|private|raw|secret|token|provider_thread|provider_run|provider_session/i.test(failure))) {
    return "blocked_private_or_raw_payload";
  }
  return "blocked_invalid_input";
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
