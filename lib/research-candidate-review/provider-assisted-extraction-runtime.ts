import { createHash } from "node:crypto";

import type {
  ProviderAssistedExtractionAuthorityBoundary,
  ProviderAssistedExtractionCandidateOutput,
  ProviderAssistedExtractionCandidateRequest,
  ProviderAssistedExtractionCandidateReviewStatus,
  ProviderAssistedExtractionConfidencePreview,
  ProviderAssistedExtractionInputRef,
  ProviderAssistedExtractionMode,
  ProviderAssistedExtractionPrivacyClass,
  ProviderAssistedExtractionReasonCode,
  ProviderAssistedExtractionRedactionStatus,
  ProviderAssistedExtractionRequestStatus,
  ProviderAssistedExtractionRuntimeAuthorityBoundary,
  ProviderAssistedExtractionRuntimeCandidatePreview,
  ProviderAssistedExtractionRuntimeDecision,
  ProviderAssistedExtractionRuntimeDecisionRecord,
  ProviderAssistedExtractionRuntimeInput,
  ProviderAssistedExtractionRuntimeReasonCode,
  ProviderAssistedExtractionRuntimeReport,
  ProviderAssistedExtractionRuntimeValidationResult,
  ProviderAssistedExtractionTargetKind,
} from "@/types/provider-assisted-extraction-candidate-only-contract";

const runtimeVersion = "provider_assisted_extraction_runtime.v0.1";
const contractVersion = "provider_assisted_extraction_candidate_only_contract.v0.1";
const requestVersion = "provider_assisted_extraction_candidate_request.v0.1";
const promptDescriptorVersion = "provider_assisted_extraction_prompt_descriptor.v0.1";
const outputVersion = "provider_assisted_extraction_candidate_output.v0.1";
const scope = "project:augnes";
const runtimeStatus = "bounded_runtime_only";

const inputKinds = [
  "bounded_source_intake_result_envelope",
  "bounded_source_intake_runtime_report",
  "bounded_summary_ref",
  "source_ref",
  "review_memory_ref",
  "manual_bounded_context",
  "unknown",
] as const;

const targetKinds = [
  "claim_candidate",
  "evidence_candidate",
  "source_summary_candidate",
  "knowledge_gap_signal",
  "contradiction_signal",
  "calibration_signal",
  "logical_shape_hint",
  "handoff_hint",
  "unknown",
] as const;

const extractionModes = [
  "summarize_only",
  "candidate_claim_extraction",
  "candidate_evidence_mapping",
  "gap_signal_detection",
  "contradiction_signal_detection",
  "calibration_signal_detection",
  "logical_shape_hinting",
  "metadata_only",
  "unknown",
] as const;

const requestStatuses = [
  "candidate_only",
  "needs_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_missing_bounded_source",
  "blocked_unsupported_target",
  "accepted_for_future_provider_run",
  "rejected",
] as const;

const reviewStatuses = [
  "candidate_only",
  "needs_review",
  "rejected",
  "accepted_for_future_runtime",
  "superseded",
] as const;

const privacyClasses = [
  "public_safe_bounded_input",
  "private_ref_only",
  "blocked_raw_private_payload",
  "blocked_secret_like_payload",
] as const;

const redactionStatuses = [
  "not_needed",
  "redacted",
  "blocked_secret_like_pattern",
  "blocked_raw_payload",
  "blocked_private_location",
] as const;

const confidencePreviews = ["low", "medium", "high"] as const;

const contractReasonCodes: ProviderAssistedExtractionReasonCode[] = [
  "bounded_source_ref_present",
  "bounded_source_ref_missing",
  "bounded_summary_ref_present",
  "bounded_summary_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "input_kind_supported",
  "input_kind_unknown",
  "target_kind_supported",
  "target_kind_unknown",
  "prompt_descriptor_present",
  "prompt_descriptor_missing",
  "prompt_not_sent",
  "provider_call_not_executed",
  "provider_output_not_stored",
  "source_fetch_not_executed",
  "local_file_read_not_executed",
  "retrieval_not_executed",
  "raw_payload_blocked",
  "secret_like_pattern_blocked",
  "operator_review_required",
  "candidate_output_shape_defined",
  "candidate_only_not_truth",
  "source_ref_not_proof",
  "accepted_for_future_provider_run_not_execution",
  "product_write_denied",
];

const runtimeDecisions: ProviderAssistedExtractionRuntimeDecision[] = [
  "candidate_output_created",
  "blocked_private_or_raw_payload",
  "blocked_secret_like_payload",
  "blocked_missing_bounded_source",
  "blocked_unsupported_target",
  "needs_operator_review",
  "candidate_only",
  "rejected",
];

const candidateAuthorityFalseFields = [
  "provider_call_now",
  "prompt_sent_now",
  "provider_output_stored_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "raw_source_body_storage_now",
  "retrieval_rag_execution_now",
  "db_query_or_write_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "claim_or_evidence_write_now",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "codex_execution_authority",
  "github_automation_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
] as const;

const runtimeAuthorityFalseFields = [
  "provider_call_now",
  "prompt_sent_now",
  "provider_output_stored_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "raw_source_body_storage_now",
  "retrieval_rag_execution_now",
  "db_query_or_write_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "claim_or_evidence_write_now",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "codex_execution_authority",
  "github_automation_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
] as const;

export function getProviderAssistedExtractionRuntimeAuthorityBoundary(): ProviderAssistedExtractionRuntimeAuthorityBoundary {
  return {
    bounded_runtime_only: true,
    caller_provided_input_only: true,
    provider_call_now: false,
    prompt_sent_now: false,
    provider_output_stored_now: false,
    source_fetch_now: false,
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    raw_source_body_storage_now: false,
    retrieval_rag_execution_now: false,
    db_query_or_write_now: false,
    source_of_truth: false,
    proof_or_evidence_record: false,
    claim_or_evidence_write_now: false,
    perspective_promotion: false,
    durable_perspective_state: false,
    work_mutation: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    git_ledger_export_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
  };
}

export function buildProviderAssistedExtractionRuntimeReport(
  input: ProviderAssistedExtractionRuntimeInput,
): ProviderAssistedExtractionRuntimeReport {
  const validation = validateProviderAssistedExtractionRuntimeInput(input);
  if (!validation.passed) {
    throw new Error("provider_assisted_extraction_runtime_input_invalid");
  }

  const previewsByRequestId = new Map<string, ProviderAssistedExtractionRuntimeCandidatePreview>();
  for (const preview of input.candidate_previews ?? []) {
    previewsByRequestId.set(preview.request_id, preview);
  }

  const sortedRequests = [...input.requests].sort((left, right) =>
    left.request_id.localeCompare(right.request_id),
  );
  const runtimeDecisions: ProviderAssistedExtractionRuntimeDecisionRecord[] = [];
  const candidateOutputs: ProviderAssistedExtractionCandidateOutput[] = [];

  for (const request of sortedRequests) {
    const preview = previewsByRequestId.get(request.request_id);
    const decision = decideRuntimeRequest(request, preview);
    const output =
      decision === "candidate_output_created" && preview
        ? createCandidateOutput(request, preview)
        : undefined;
    if (output) {
      candidateOutputs.push(output);
    }
    runtimeDecisions.push({
      request_id: request.request_id,
      decision,
      requested_target_kinds: uniqueSorted(request.target_kinds),
      output_refs: output ? [output.output_id] : [],
      reason_codes: createDecisionReasonCodes(request, decision, Boolean(preview), Boolean(output)),
    });
  }

  const sortedOutputs = candidateOutputs.sort(compareCandidateOutputs);
  const sortedDecisions = runtimeDecisions.sort((left, right) =>
    left.request_id.localeCompare(right.request_id),
  );
  const reportWithoutFingerprint: Omit<
    ProviderAssistedExtractionRuntimeReport,
    "runtime_report_fingerprint"
  > = {
    runtime_version: runtimeVersion,
    contract_version: contractVersion,
    scope,
    status: runtimeStatus,
    as_of: input.as_of,
    source_fixture_refs: [...input.source_fixture_refs].sort(),
    candidate_outputs: sortedOutputs,
    runtime_decisions: sortedDecisions,
    decision_counts: countRuntimeDecisions(sortedDecisions),
    output_kind_counts: countOutputKinds(sortedOutputs),
    review_status_counts: countReviewStatuses(sortedOutputs),
    boundary_notes: [
      "Provider-Assisted Extraction Runtime is bounded-runtime-only.",
      "It processes caller-provided candidate previews and bounded inputs only.",
      "Candidate output is not truth.",
      "Candidate output is not proof/evidence.",
      "Product-write remains parked by #686.",
    ],
    authority_boundary: getProviderAssistedExtractionRuntimeAuthorityBoundary(),
  };
  return {
    ...reportWithoutFingerprint,
    runtime_report_fingerprint:
      createProviderAssistedExtractionRuntimeReportFingerprint(reportWithoutFingerprint),
  };
}

export function validateProviderAssistedExtractionRuntimeInput(
  input: unknown,
): ProviderAssistedExtractionRuntimeValidationResult {
  const failureCodes: string[] = [];
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_not_object"] };
  }
  if (input.runtime_version !== runtimeVersion) {
    failureCodes.push("wrong_runtime_version");
  }
  if (input.contract_version !== contractVersion) {
    failureCodes.push("wrong_contract_version");
  }
  if (input.scope !== scope) {
    failureCodes.push("wrong_scope");
  }
  if (!isNonEmptyString(input.as_of)) {
    failureCodes.push("missing_as_of");
  } else if (!isIsoTimestamp(input.as_of)) {
    failureCodes.push("malformed_as_of");
  }
  if (!Array.isArray(input.source_fixture_refs)) {
    failureCodes.push("source_fixture_refs_not_array");
  } else if (input.source_fixture_refs.some((ref) => !isSafeProviderAssistedExtractionRuntimeRef(ref))) {
    failureCodes.push("unsafe_source_fixture_refs");
  }
  if (!Array.isArray(input.requests) || input.requests.length === 0) {
    failureCodes.push("missing_or_empty_requests");
  } else {
    failureCodes.push(...validateRequests(input.requests));
  }
  if (
    "candidate_previews" in input &&
    input.candidate_previews !== undefined &&
    !Array.isArray(input.candidate_previews)
  ) {
    failureCodes.push("candidate_previews_not_array");
  } else if (Array.isArray(input.candidate_previews)) {
    const requestById = new Map<string, Record<string, unknown>>();
    if (Array.isArray(input.requests)) {
      for (const request of input.requests) {
        if (isRecord(request) && isNonEmptyString(request.request_id)) {
          requestById.set(request.request_id, request);
        }
      }
    }
    failureCodes.push(...validateCandidatePreviews(input.candidate_previews, requestById));
  }
  if (!isSafePublicText(JSON.stringify(input))) {
    failureCodes.push("input_contains_unsafe_text");
  }
  return uniqueValidationResult(failureCodes);
}

export function validateProviderAssistedExtractionRuntimeReport(
  report: unknown,
): ProviderAssistedExtractionRuntimeValidationResult {
  const failureCodes: string[] = [];
  if (!isRecord(report)) {
    return { passed: false, failure_codes: ["report_not_object"] };
  }
  if (report.runtime_version !== runtimeVersion) {
    failureCodes.push("wrong_runtime_version");
  }
  if (report.contract_version !== contractVersion) {
    failureCodes.push("wrong_contract_version");
  }
  if (report.scope !== scope) {
    failureCodes.push("wrong_scope");
  }
  if (report.status !== runtimeStatus) {
    failureCodes.push("wrong_status");
  }
  if (!isNonEmptyString(report.as_of)) {
    failureCodes.push("missing_as_of");
  } else if (!isIsoTimestamp(report.as_of)) {
    failureCodes.push("malformed_as_of");
  }
  if (!Array.isArray(report.runtime_decisions) || report.runtime_decisions.length === 0) {
    failureCodes.push("empty_runtime_decisions");
  }
  if (!Array.isArray(report.candidate_outputs)) {
    failureCodes.push("candidate_outputs_not_array");
  }
  if (!isRuntimeAuthorityBoundarySafe(report.authority_boundary)) {
    failureCodes.push("authority_boundary_grants_forbidden_authority");
  }
  if (!isNonEmptyString(report.runtime_report_fingerprint)) {
    failureCodes.push("fingerprint_empty");
  } else if (
    createProviderAssistedExtractionRuntimeReportFingerprint(
      report as Partial<ProviderAssistedExtractionRuntimeReport>,
    ) !== report.runtime_report_fingerprint
  ) {
    failureCodes.push("fingerprint_mismatched");
  }
  if (!isSafePublicText(JSON.stringify(report))) {
    failureCodes.push("report_contains_unsafe_text");
  }

  const decisions = Array.isArray(report.runtime_decisions)
    ? (report.runtime_decisions as unknown[])
    : [];
  const outputs = Array.isArray(report.candidate_outputs)
    ? (report.candidate_outputs as unknown[])
    : [];
  const decisionIds = new Set<string>();
  const decisionByRequestId = new Map<string, ProviderAssistedExtractionRuntimeDecisionRecord>();
  const outputIds = new Set<string>();
  const outputById = new Map<string, Record<string, unknown>>();
  const candidateRefs = new Set<string>();

  for (const decision of decisions) {
    if (!isRuntimeDecisionRecord(decision)) {
      failureCodes.push("invalid_runtime_decision_record");
      continue;
    }
    if (decisionIds.has(decision.request_id)) {
      failureCodes.push("duplicate_runtime_decision_request_id");
    }
    decisionIds.add(decision.request_id);
    decisionByRequestId.set(decision.request_id, decision);
  }

  for (const output of outputs) {
    if (!isRecord(output)) {
      failureCodes.push("candidate_output_not_object");
      continue;
    }
    failureCodes.push(...validateCandidateOutput(output));
    if (isNonEmptyString(output.output_id)) {
      if (outputIds.has(output.output_id)) {
        failureCodes.push("duplicate_output_id");
      }
      outputIds.add(output.output_id);
      outputById.set(output.output_id, output);
    }
    if (isNonEmptyString(output.candidate_ref)) {
      if (candidateRefs.has(output.candidate_ref)) {
        failureCodes.push("duplicate_candidate_ref");
      }
      candidateRefs.add(output.candidate_ref);
    }
    if (!isNonEmptyString(output.request_id)) {
      failureCodes.push("candidate_output_missing_request_id");
      continue;
    }
    const decision = decisionByRequestId.get(output.request_id);
    if (!decision) {
      failureCodes.push("candidate_output_without_runtime_decision");
      continue;
    }
    if (decision.decision !== "candidate_output_created") {
      failureCodes.push("candidate_output_for_noncreated_decision");
    }
    if (decision.decision.startsWith("blocked_") || decision.decision === "rejected") {
      failureCodes.push("candidate_output_for_blocked_or_rejected_decision");
    }
    if (!decision.output_refs.includes(output.output_id as string)) {
      failureCodes.push("candidate_output_not_listed_in_decision_output_refs");
    }
    if (
      Array.isArray(decision.requested_target_kinds) &&
      !decision.requested_target_kinds.includes(output.output_kind as ProviderAssistedExtractionTargetKind)
    ) {
      failureCodes.push("candidate_output_kind_not_requested");
    }
  }

  for (const decision of decisionByRequestId.values()) {
    for (const outputRef of decision.output_refs) {
      const matchingOutput = outputById.get(outputRef);
      if (!matchingOutput) {
        failureCodes.push("dangling_decision_output_ref");
      } else if (matchingOutput.request_id !== decision.request_id) {
        failureCodes.push("decision_output_ref_request_mismatch");
      }
    }
    if (decision.decision === "candidate_output_created" && decision.output_refs.length === 0) {
      failureCodes.push("decision_candidate_output_created_without_output_refs");
    }
    if (decision.decision.startsWith("blocked_") && decision.output_refs.length > 0) {
      failureCodes.push("decision_blocked_with_output_refs");
    }
    if (
      ["candidate_only", "needs_operator_review", "rejected"].includes(decision.decision) &&
      decision.output_refs.length > 0
    ) {
      failureCodes.push("decision_noncreated_with_output_refs");
    }
  }
  if (!decisionCountsMatch(report.decision_counts, decisions)) {
    failureCodes.push("decision_counts_mismatch");
  }
  if (!outputKindCountsMatch(report.output_kind_counts, outputs)) {
    failureCodes.push("output_kind_counts_mismatch");
  }
  if (!reviewStatusCountsMatch(report.review_status_counts, outputs)) {
    failureCodes.push("review_status_counts_mismatch");
  }
  return uniqueValidationResult(failureCodes);
}

export function createProviderAssistedExtractionRuntimeReportFingerprint(
  report: Partial<ProviderAssistedExtractionRuntimeReport>,
): string {
  const reportForHash = JSON.parse(JSON.stringify(report));
  delete reportForHash.runtime_report_fingerprint;
  return createHash("sha256").update(canonicalJson(reportForHash)).digest("hex");
}

export function isSafeProviderAssistedExtractionRuntimeText(value: unknown): boolean {
  return typeof value === "string" && isSafePublicText(value);
}

export function isSafeProviderAssistedExtractionRuntimeRef(value: unknown): boolean {
  return typeof value === "string" && value.length > 0 && isSafePublicText(value);
}

function decideRuntimeRequest(
  request: ProviderAssistedExtractionCandidateRequest,
  preview?: ProviderAssistedExtractionRuntimeCandidatePreview,
): ProviderAssistedExtractionRuntimeDecision {
  if (request.request_status === "rejected") {
    return "rejected";
  }
  if (
    request.input_refs.some(
      (inputRef) =>
        inputRef.privacy_class === "blocked_secret_like_payload" ||
        inputRef.redaction_status === "blocked_secret_like_pattern",
    )
  ) {
    return "blocked_secret_like_payload";
  }
  if (
    request.input_refs.some(
      (inputRef) =>
        inputRef.privacy_class === "blocked_raw_private_payload" ||
        inputRef.redaction_status === "blocked_raw_payload" ||
        inputRef.redaction_status === "blocked_private_location",
    )
  ) {
    return "blocked_private_or_raw_payload";
  }
  if (request.request_status === "blocked_private_or_raw_payload") {
    return "blocked_private_or_raw_payload";
  }
  if (request.request_status === "blocked_missing_bounded_source") {
    return "blocked_missing_bounded_source";
  }
  if (request.request_status === "blocked_unsupported_target") {
    return "blocked_unsupported_target";
  }
  if (request.target_kinds.includes("unknown")) {
    return "blocked_unsupported_target";
  }
  if (
    request.input_refs.length === 0 ||
    request.input_refs.every(
      (inputRef) => inputRef.bounded_summary_refs.length === 0 && inputRef.source_refs.length === 0,
    )
  ) {
    return "blocked_missing_bounded_source";
  }
  if (request.request_status === "needs_operator_review") {
    return "needs_operator_review";
  }
  if (
    preview &&
    preview.public_safe === true &&
    preview.output_kind !== "unknown" &&
    request.target_kinds.includes(preview.output_kind) &&
    isSafeProviderAssistedExtractionRuntimeText(preview.bounded_output_summary)
  ) {
    return "candidate_output_created";
  }
  if (preview && (preview.output_kind === "unknown" || !request.target_kinds.includes(preview.output_kind))) {
    return "blocked_unsupported_target";
  }
  if (request.request_status === "accepted_for_future_provider_run") {
    return "candidate_only";
  }
  return "candidate_only";
}

function createCandidateOutput(
  request: ProviderAssistedExtractionCandidateRequest,
  preview: ProviderAssistedExtractionRuntimeCandidatePreview,
): ProviderAssistedExtractionCandidateOutput {
  const outputKind = preview.output_kind;
  const hashPrefix = createHash("sha256")
    .update(
      canonicalJson({
        request_id: request.request_id,
        output_kind: outputKind,
        bounded_output_summary: preview.bounded_output_summary,
        candidate_ref: preview.candidate_ref ?? "",
      }),
    )
    .digest("hex")
    .slice(0, 12);
  const outputId = `provider-runtime-output:${request.request_id}:${outputKind}:${hashPrefix}`;
  const candidateRef =
    preview.candidate_ref && isSafeProviderAssistedExtractionRuntimeRef(preview.candidate_ref)
      ? preview.candidate_ref
      : `provider-runtime-candidate-ref:${request.request_id}:${outputKind}:${hashPrefix}`;
  const sourceRefs = uniqueSorted([
    ...request.input_refs.flatMap((inputRef) => inputRef.source_refs),
    ...(preview.source_refs ?? []),
  ].filter(isSafeProviderAssistedExtractionRuntimeRef));
  const boundedSummaryRefs = uniqueSorted([
    ...request.input_refs.flatMap((inputRef) => inputRef.bounded_summary_refs),
    ...(preview.bounded_summary_refs ?? []),
  ].filter(isSafeProviderAssistedExtractionRuntimeRef));

  return {
    output_version: outputVersion,
    contract_version: contractVersion,
    scope,
    request_id: request.request_id,
    output_id: outputId,
    output_kind: outputKind,
    candidate_ref: candidateRef,
    bounded_output_summary: preview.bounded_output_summary,
    source_refs: sourceRefs,
    bounded_summary_refs: boundedSummaryRefs,
    confidence_preview: isConfidencePreview(preview.confidence_preview)
      ? preview.confidence_preview
      : "low",
    review_status: isReviewStatus(preview.review_status)
      ? preview.review_status
      : "candidate_only",
    provider_output_included: false,
    prompt_sent: false,
    provider_call_executed: false,
    claim_or_evidence_written: false,
    proof_or_evidence_created: false,
    perspective_promoted: false,
    product_write_executed: false,
    reason_codes: createCandidateOutputReasonCodes(request),
    authority_boundary: getCandidateContractAuthorityBoundary(),
  };
}

function createCandidateOutputReasonCodes(
  request: ProviderAssistedExtractionCandidateRequest,
): ProviderAssistedExtractionReasonCode[] {
  return uniqueSorted([
    ...request.reason_codes.filter(isContractReasonCode),
    "candidate_output_shape_defined",
    "candidate_only_not_truth",
    "source_ref_not_proof",
    "prompt_not_sent",
    "provider_call_not_executed",
    "provider_output_not_stored",
    "source_fetch_not_executed",
    "local_file_read_not_executed",
    "retrieval_not_executed",
    "product_write_denied",
  ]);
}

function createDecisionReasonCodes(
  request: ProviderAssistedExtractionCandidateRequest,
  decision: ProviderAssistedExtractionRuntimeDecision,
  previewPresent: boolean,
  outputCreated: boolean,
): ProviderAssistedExtractionRuntimeReasonCode[] {
  const codes: ProviderAssistedExtractionRuntimeReasonCode[] = [
    ...request.reason_codes.filter(isContractReasonCode),
    "bounded_runtime_executed",
    "runtime_request_validation_passed",
    "provider_call_still_not_executed",
    "prompt_still_not_sent",
    "provider_output_still_not_stored",
    "prompt_not_sent",
    "provider_call_not_executed",
    "provider_output_not_stored",
    "source_fetch_not_executed",
    "local_file_read_not_executed",
    "retrieval_not_executed",
    "candidate_only_not_truth",
    "source_ref_not_proof",
    "product_write_denied",
    previewPresent ? "candidate_preview_present" : "candidate_preview_missing",
  ];
  if (previewPresent && outputCreated) {
    codes.push(
      "candidate_preview_public_safe",
      "runtime_candidate_output_created",
      "accepted_output_not_truth",
      "accepted_output_not_proof",
    );
  }
  if (previewPresent && !outputCreated) {
    codes.push("candidate_preview_blocked");
  }
  if (decision.startsWith("blocked_") || decision === "rejected") {
    codes.push("blocked_request_not_executed");
  }
  if (decision === "blocked_secret_like_payload") {
    codes.push("secret_like_pattern_blocked");
  }
  if (decision === "blocked_private_or_raw_payload") {
    codes.push("raw_payload_blocked");
  }
  if (decision === "blocked_missing_bounded_source") {
    codes.push("bounded_source_ref_missing", "bounded_summary_ref_missing");
  }
  if (decision === "blocked_unsupported_target") {
    codes.push("target_kind_unknown");
  }
  if (decision === "needs_operator_review") {
    codes.push("operator_review_required");
  }
  return uniqueSorted(codes).filter(isRuntimeReasonCode);
}

function validateRequests(requests: unknown[]): string[] {
  const failureCodes: string[] = [];
  const requestIds = new Set<string>();
  for (const request of requests) {
    if (!isRecord(request)) {
      failureCodes.push("request_not_object");
      continue;
    }
    if (!isNonEmptyString(request.request_id)) {
      failureCodes.push("missing_request_id");
    } else if (requestIds.has(request.request_id)) {
      failureCodes.push("duplicate_request_id");
    } else {
      requestIds.add(request.request_id);
    }
    if (request.request_version !== requestVersion) {
      failureCodes.push("request_wrong_request_version");
    }
    if (request.contract_version !== contractVersion) {
      failureCodes.push("request_wrong_contract_version");
    }
    if (request.scope !== scope) {
      failureCodes.push("request_wrong_scope");
    }
    if (!requestStatuses.includes(request.request_status as ProviderAssistedExtractionRequestStatus)) {
      failureCodes.push("request_status_outside_vocabulary");
    }
    if (!extractionModes.includes(request.extraction_mode as ProviderAssistedExtractionMode)) {
      failureCodes.push("extraction_mode_outside_vocabulary");
    }
    if (
      !Array.isArray(request.target_kinds) ||
      request.target_kinds.some((kind) => !targetKinds.includes(kind as ProviderAssistedExtractionTargetKind))
    ) {
      failureCodes.push("target_kinds_outside_vocabulary");
    }
    if (!Array.isArray(request.input_refs)) {
      failureCodes.push("input_refs_not_array");
    } else {
      for (const inputRef of request.input_refs) {
        failureCodes.push(...validateInputRef(inputRef));
      }
    }
    if (!isRecord(request.prompt_descriptor)) {
      failureCodes.push("prompt_descriptor_missing");
    } else {
      failureCodes.push(...validatePromptDescriptor(request.prompt_descriptor, request));
    }
    if (!isSafeProviderAssistedExtractionRuntimeText(request.bounded_purpose)) {
      failureCodes.push("unsafe_bounded_purpose");
    }
    if (
      !Array.isArray(request.expected_candidate_output_refs) ||
      request.expected_candidate_output_refs.some((ref) => !isSafeProviderAssistedExtractionRuntimeRef(ref))
    ) {
      failureCodes.push("unsafe_expected_candidate_output_refs");
    }
    if (
      !Array.isArray(request.boundary_notes) ||
      request.boundary_notes.some((note) => !isSafeProviderAssistedExtractionRuntimeText(note))
    ) {
      failureCodes.push("unsafe_boundary_notes");
    }
    if (!Array.isArray(request.reason_codes) || request.reason_codes.some((code) => !isContractReasonCode(code))) {
      failureCodes.push("request_reason_codes_outside_vocabulary");
    }
    if (!isCandidateAuthorityBoundarySafe(request.authority_boundary)) {
      failureCodes.push("request_authority_boundary_grants_forbidden_authority");
    }
  }
  return failureCodes;
}

function validateInputRef(value: unknown): string[] {
  const failureCodes: string[] = [];
  if (!isRecord(value)) {
    return ["input_ref_not_object"];
  }
  if (!inputKinds.includes(value.input_kind as ProviderAssistedExtractionInputRef["input_kind"])) {
    failureCodes.push("input_kind_outside_vocabulary");
  }
  if (!isSafeProviderAssistedExtractionRuntimeRef(value.input_ref)) {
    failureCodes.push("unsafe_input_ref");
  }
  if (
    !Array.isArray(value.source_refs) ||
    value.source_refs.some((ref) => !isSafeProviderAssistedExtractionRuntimeRef(ref))
  ) {
    failureCodes.push("unsafe_source_refs");
  }
  if (
    !Array.isArray(value.bounded_summary_refs) ||
    value.bounded_summary_refs.some((ref) => !isSafeProviderAssistedExtractionRuntimeRef(ref))
  ) {
    failureCodes.push("unsafe_bounded_summary_refs");
  }
  if (typeof value.public_safe !== "boolean") {
    failureCodes.push("input_ref_public_safe_not_boolean");
  }
  if (!privacyClasses.includes(value.privacy_class as ProviderAssistedExtractionPrivacyClass)) {
    failureCodes.push("privacy_class_outside_vocabulary");
  }
  if (!redactionStatuses.includes(value.redaction_status as ProviderAssistedExtractionRedactionStatus)) {
    failureCodes.push("redaction_status_outside_vocabulary");
  }
  if (!Array.isArray(value.reason_codes) || value.reason_codes.some((code) => !isContractReasonCode(code))) {
    failureCodes.push("input_ref_reason_codes_outside_vocabulary");
  }
  return failureCodes;
}

function validatePromptDescriptor(
  value: Record<string, unknown>,
  request: Record<string, unknown>,
): string[] {
  const failureCodes: string[] = [];
  if (value.prompt_descriptor_version !== promptDescriptorVersion) {
    failureCodes.push("prompt_descriptor_wrong_version");
  }
  if (value.scope !== scope) {
    failureCodes.push("prompt_descriptor_wrong_scope");
  }
  if (!isNonEmptyString(value.prompt_descriptor_id)) {
    failureCodes.push("prompt_descriptor_id_missing");
  }
  if (!extractionModes.includes(value.mode as ProviderAssistedExtractionMode)) {
    failureCodes.push("prompt_descriptor_mode_outside_vocabulary");
  }
  if (!isSafeProviderAssistedExtractionRuntimeText(value.bounded_prompt_summary)) {
    failureCodes.push("prompt_descriptor_bounded_prompt_summary_unsafe");
  }
  if (
    (request.request_status === "accepted_for_future_provider_run" ||
      request.request_status === "candidate_only") &&
    value.public_safe !== true
  ) {
    failureCodes.push("prompt_descriptor_public_safe_not_true_for_runnable_candidate");
  }
  if (!Array.isArray(value.allowed_input_refs) || value.allowed_input_refs.some((ref) => !isSafeProviderAssistedExtractionRuntimeRef(ref))) {
    failureCodes.push("unsafe_allowed_input_refs");
  }
  if (
    !Array.isArray(value.forbidden_input_classes) ||
    value.forbidden_input_classes.some((inputClass) => !isSafeProviderAssistedExtractionRuntimeText(inputClass))
  ) {
    failureCodes.push("unsafe_forbidden_input_classes");
  }
  if (!redactionStatuses.includes(value.redaction_status as ProviderAssistedExtractionRedactionStatus)) {
    failureCodes.push("prompt_descriptor_redaction_status_outside_vocabulary");
  }
  if (typeof value.public_safe !== "boolean") {
    failureCodes.push("prompt_descriptor_public_safe_not_boolean");
  }
  if (!Array.isArray(value.reason_codes) || value.reason_codes.some((code) => !isContractReasonCode(code))) {
    failureCodes.push("prompt_descriptor_reason_codes_outside_vocabulary");
  }
  if (!isCandidateAuthorityBoundarySafe(value.authority_boundary)) {
    failureCodes.push("prompt_descriptor_authority_boundary_grants_forbidden_authority");
  }
  return failureCodes;
}

function validateCandidatePreviews(
  previews: unknown[],
  requestById: Map<string, Record<string, unknown>>,
): string[] {
  const failureCodes: string[] = [];
  const previewRequestIds = new Set<string>();
  for (const preview of previews) {
    if (!isRecord(preview)) {
      failureCodes.push("candidate_preview_not_object");
      continue;
    }
    if (!isNonEmptyString(preview.request_id)) {
      failureCodes.push("candidate_preview_missing_request_id");
    } else {
      const request = requestById.get(preview.request_id);
      if (!request) {
        failureCodes.push("candidate_preview_request_id_not_found");
      }
      if (previewRequestIds.has(preview.request_id)) {
        failureCodes.push("duplicate_candidate_preview_request_id");
      }
      previewRequestIds.add(preview.request_id);
    }
    if (!targetKinds.includes(preview.output_kind as ProviderAssistedExtractionTargetKind)) {
      failureCodes.push("candidate_preview_output_kind_outside_vocabulary");
    } else if (preview.output_kind === "unknown") {
      failureCodes.push("candidate_preview_output_kind_unknown");
    } else if (isNonEmptyString(preview.request_id)) {
      const request = requestById.get(preview.request_id);
      if (
        request &&
        Array.isArray(request.target_kinds) &&
        !request.target_kinds.includes(preview.output_kind)
      ) {
        failureCodes.push("candidate_preview_output_kind_not_requested");
      }
    }
    if (preview.public_safe !== true) {
      failureCodes.push("candidate_preview_public_safe_not_true");
    }
    if (!isSafeProviderAssistedExtractionRuntimeText(preview.bounded_output_summary)) {
      failureCodes.push("candidate_preview_bounded_output_summary_unsafe");
    }
    if (
      preview.candidate_ref !== undefined &&
      !isSafeProviderAssistedExtractionRuntimeRef(preview.candidate_ref)
    ) {
      failureCodes.push("candidate_preview_candidate_ref_unsafe");
    }
    if (
      preview.source_refs !== undefined &&
      (!Array.isArray(preview.source_refs) ||
        preview.source_refs.some((ref) => !isSafeProviderAssistedExtractionRuntimeRef(ref)))
    ) {
      failureCodes.push("candidate_preview_source_refs_unsafe");
    }
    if (
      preview.bounded_summary_refs !== undefined &&
      (!Array.isArray(preview.bounded_summary_refs) ||
        preview.bounded_summary_refs.some((ref) => !isSafeProviderAssistedExtractionRuntimeRef(ref)))
    ) {
      failureCodes.push("candidate_preview_bounded_summary_refs_unsafe");
    }
    if (preview.confidence_preview !== undefined && !isConfidencePreview(preview.confidence_preview)) {
      failureCodes.push("candidate_preview_confidence_preview_outside_vocabulary");
    }
    if (preview.review_status !== undefined && !isReviewStatus(preview.review_status)) {
      failureCodes.push("candidate_preview_review_status_outside_vocabulary");
    }
    if (!isSafePublicText(JSON.stringify(preview))) {
      failureCodes.push("candidate_preview_contains_unsafe_text");
    }
  }
  return failureCodes;
}

function validateCandidateOutput(output: Record<string, unknown>): string[] {
  const failureCodes: string[] = [];
  if (output.output_version !== outputVersion) {
    failureCodes.push("candidate_output_wrong_version");
  }
  if (output.contract_version !== contractVersion) {
    failureCodes.push("candidate_output_wrong_contract_version");
  }
  if (output.scope !== scope) {
    failureCodes.push("candidate_output_wrong_scope");
  }
  if (!isNonEmptyString(output.output_id)) {
    failureCodes.push("candidate_output_missing_output_id");
  }
  if (!targetKinds.includes(output.output_kind as ProviderAssistedExtractionTargetKind)) {
    failureCodes.push("candidate_output_kind_outside_vocabulary");
  }
  if (!isSafeProviderAssistedExtractionRuntimeRef(output.candidate_ref)) {
    failureCodes.push("candidate_output_candidate_ref_unsafe");
  }
  if (!isSafeProviderAssistedExtractionRuntimeText(output.bounded_output_summary)) {
    failureCodes.push("candidate_output_bounded_output_summary_unsafe");
  }
  if (
    !Array.isArray(output.source_refs) ||
    output.source_refs.some((ref) => !isSafeProviderAssistedExtractionRuntimeRef(ref))
  ) {
    failureCodes.push("candidate_output_source_refs_unsafe");
  }
  if (
    !Array.isArray(output.bounded_summary_refs) ||
    output.bounded_summary_refs.some((ref) => !isSafeProviderAssistedExtractionRuntimeRef(ref))
  ) {
    failureCodes.push("candidate_output_bounded_summary_refs_unsafe");
  }
  if (!isConfidencePreview(output.confidence_preview)) {
    failureCodes.push("candidate_output_confidence_preview_invalid");
  }
  if (!isReviewStatus(output.review_status)) {
    failureCodes.push("candidate_output_review_status_invalid");
  }
  for (const field of [
    "provider_output_included",
    "prompt_sent",
    "provider_call_executed",
    "claim_or_evidence_written",
    "proof_or_evidence_created",
    "perspective_promoted",
    "product_write_executed",
  ]) {
    if (output[field] !== false) {
      failureCodes.push(`${field}_granted`);
    }
  }
  if (!Array.isArray(output.reason_codes) || output.reason_codes.some((code) => !isContractReasonCode(code))) {
    failureCodes.push("candidate_output_reason_codes_outside_vocabulary");
  }
  if (!isCandidateAuthorityBoundarySafe(output.authority_boundary)) {
    failureCodes.push("candidate_output_authority_boundary_grants_forbidden_authority");
  }
  return failureCodes;
}

function countRuntimeDecisions(
  decisions: ProviderAssistedExtractionRuntimeDecisionRecord[],
): Record<ProviderAssistedExtractionRuntimeDecision, number> {
  const counts = {
    candidate_output_created: 0,
    blocked_private_or_raw_payload: 0,
    blocked_secret_like_payload: 0,
    blocked_missing_bounded_source: 0,
    blocked_unsupported_target: 0,
    needs_operator_review: 0,
    candidate_only: 0,
    rejected: 0,
  };
  for (const decision of decisions) {
    counts[decision.decision] += 1;
  }
  return counts;
}

function countOutputKinds(
  outputs: ProviderAssistedExtractionCandidateOutput[],
): Record<ProviderAssistedExtractionTargetKind, number> {
  const counts = {
    claim_candidate: 0,
    evidence_candidate: 0,
    source_summary_candidate: 0,
    knowledge_gap_signal: 0,
    contradiction_signal: 0,
    calibration_signal: 0,
    logical_shape_hint: 0,
    handoff_hint: 0,
    unknown: 0,
  };
  for (const output of outputs) {
    counts[output.output_kind] += 1;
  }
  return counts;
}

function countReviewStatuses(
  outputs: ProviderAssistedExtractionCandidateOutput[],
): Record<ProviderAssistedExtractionCandidateReviewStatus, number> {
  const counts = {
    candidate_only: 0,
    needs_review: 0,
    rejected: 0,
    accepted_for_future_runtime: 0,
    superseded: 0,
  };
  for (const output of outputs) {
    counts[output.review_status] += 1;
  }
  return counts;
}

function decisionCountsMatch(counts: unknown, decisions: unknown[]): boolean {
  if (!isRecord(counts)) {
    return false;
  }
  const expected = countRuntimeDecisions(decisions.filter(isRuntimeDecisionRecord));
  return runtimeDecisions.every((decision) => counts[decision] === expected[decision]);
}

function outputKindCountsMatch(counts: unknown, outputs: unknown[]): boolean {
  if (!isRecord(counts)) {
    return false;
  }
  const expected = countOutputKinds(outputs.filter(isCandidateOutputRecord));
  return targetKinds.every((outputKind) => counts[outputKind] === expected[outputKind]);
}

function reviewStatusCountsMatch(counts: unknown, outputs: unknown[]): boolean {
  if (!isRecord(counts)) {
    return false;
  }
  const expected = countReviewStatuses(outputs.filter(isCandidateOutputRecord));
  return reviewStatuses.every((reviewStatus) => counts[reviewStatus] === expected[reviewStatus]);
}

function getCandidateContractAuthorityBoundary(): ProviderAssistedExtractionAuthorityBoundary {
  return {
    candidate_contract_only: true,
    provider_call_now: false,
    prompt_sent_now: false,
    provider_output_stored_now: false,
    source_fetch_now: false,
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    raw_source_body_storage_now: false,
    retrieval_rag_execution_now: false,
    db_query_or_write_now: false,
    source_of_truth: false,
    proof_or_evidence_record: false,
    claim_or_evidence_write_now: false,
    perspective_promotion: false,
    durable_perspective_state: false,
    work_mutation: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    git_ledger_export_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
  };
}

function isCandidateAuthorityBoundarySafe(value: unknown): boolean {
  if (!isRecord(value) || value.candidate_contract_only !== true) {
    return false;
  }
  return candidateAuthorityFalseFields.every((field) => value[field] === false);
}

function isRuntimeAuthorityBoundarySafe(value: unknown): boolean {
  if (
    !isRecord(value) ||
    value.bounded_runtime_only !== true ||
    value.caller_provided_input_only !== true
  ) {
    return false;
  }
  return runtimeAuthorityFalseFields.every((field) => value[field] === false);
}

function isRuntimeDecisionRecord(
  value: unknown,
): value is ProviderAssistedExtractionRuntimeDecisionRecord {
  return (
    isRecord(value) &&
    isNonEmptyString(value.request_id) &&
    runtimeDecisions.includes(value.decision as ProviderAssistedExtractionRuntimeDecision) &&
    (value.requested_target_kinds === undefined ||
      (Array.isArray(value.requested_target_kinds) &&
        value.requested_target_kinds.every((kind) =>
          targetKinds.includes(kind as ProviderAssistedExtractionTargetKind),
        ))) &&
    Array.isArray(value.output_refs) &&
    value.output_refs.every(isSafeProviderAssistedExtractionRuntimeRef) &&
    Array.isArray(value.reason_codes) &&
    value.reason_codes.every(isRuntimeReasonCode)
  );
}

function isCandidateOutputRecord(value: unknown): value is ProviderAssistedExtractionCandidateOutput {
  return (
    isRecord(value) &&
    value.output_version === outputVersion &&
    value.contract_version === contractVersion &&
    value.scope === scope &&
    isNonEmptyString(value.request_id) &&
    isNonEmptyString(value.output_id) &&
    targetKinds.includes(value.output_kind as ProviderAssistedExtractionTargetKind) &&
    isSafeProviderAssistedExtractionRuntimeRef(value.candidate_ref) &&
    isSafeProviderAssistedExtractionRuntimeText(value.bounded_output_summary) &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.bounded_summary_refs) &&
    isConfidencePreview(value.confidence_preview) &&
    isReviewStatus(value.review_status)
  );
}

function isContractReasonCode(value: unknown): value is ProviderAssistedExtractionReasonCode {
  return typeof value === "string" && contractReasonCodes.includes(value as ProviderAssistedExtractionReasonCode);
}

function isRuntimeReasonCode(value: unknown): value is ProviderAssistedExtractionRuntimeReasonCode {
  return (
    isContractReasonCode(value) ||
    value === "bounded_runtime_executed" ||
    value === "provider_call_still_not_executed" ||
    value === "prompt_still_not_sent" ||
    value === "provider_output_still_not_stored" ||
    value === "candidate_preview_present" ||
    value === "candidate_preview_missing" ||
    value === "candidate_preview_public_safe" ||
    value === "candidate_preview_blocked" ||
    value === "runtime_candidate_output_created" ||
    value === "runtime_request_validation_passed" ||
    value === "runtime_request_validation_failed" ||
    value === "blocked_request_not_executed" ||
    value === "accepted_output_not_truth" ||
    value === "accepted_output_not_proof"
  );
}

function isConfidencePreview(value: unknown): value is ProviderAssistedExtractionConfidencePreview {
  return confidencePreviews.includes(value as ProviderAssistedExtractionConfidencePreview);
}

function isReviewStatus(value: unknown): value is ProviderAssistedExtractionCandidateReviewStatus {
  return reviewStatuses.includes(value as ProviderAssistedExtractionCandidateReviewStatus);
}

function compareCandidateOutputs(
  left: ProviderAssistedExtractionCandidateOutput,
  right: ProviderAssistedExtractionCandidateOutput,
): number {
  return (
    left.request_id.localeCompare(right.request_id) ||
    left.output_kind.localeCompare(right.output_kind) ||
    left.output_id.localeCompare(right.output_id)
  );
}

function isSafePublicText(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value !== "string") {
    return false;
  }
  const lowered = value.toLowerCase();
  const splitActualPromptMarker = "actual " + "prompt:";
  return (
    !value.includes("/Users/") &&
    !value.includes("/home/") &&
    !lowered.includes("file://") &&
    !lowered.includes("http://private") &&
    !lowered.includes("https://private") &&
    !value.includes("sk-") &&
    !value.includes("ghp_") &&
    !value.includes("OPENAI_API_KEY") &&
    !value.includes("GITHUB_TOKEN") &&
    !lowered.includes("password:") &&
    !lowered.includes("secret:") &&
    !lowered.includes("private key") &&
    !lowered.includes("raw provider output") &&
    !lowered.includes("provider response:") &&
    !lowered.includes(splitActualPromptMarker) &&
    !lowered.includes("raw conversation") &&
    !lowered.includes("hidden reasoning") &&
    !lowered.includes("raw db row") &&
    !lowered.includes("raw_db_row") &&
    !lowered.includes("browser dump") &&
    !lowered.includes("raw browser dump") &&
    !lowered.includes("raw source body") &&
    !lowered.includes("provider transcript")
  );
}

function isIsoTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)).sort();
}

function uniqueValidationResult(
  failureCodes: string[],
): ProviderAssistedExtractionRuntimeValidationResult {
  const uniqueCodes = uniqueSorted(failureCodes);
  return {
    passed: uniqueCodes.length === 0,
    failure_codes: uniqueCodes,
  };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
