import { createHash } from "node:crypto";

import type {
  BoundedSourceIntakeAuthorityBoundary,
  BoundedSourceIntakeContractBundle,
  BoundedSourceIntakeReasonCode,
  BoundedSourceIntakeRequest,
  BoundedSourceIntakeResultEnvelope,
  BoundedSourceIntakeRuntimeAuthorityBoundary,
  BoundedSourceIntakeRuntimeBoundedSummary,
  BoundedSourceIntakeRuntimeDecision,
  BoundedSourceIntakeRuntimeDecisionRecord,
  BoundedSourceIntakeRuntimeInput,
  BoundedSourceIntakeRuntimeReasonCode,
  BoundedSourceIntakeRuntimeReport,
  BoundedSourceIntakeRuntimeValidationResult,
} from "@/types/bounded-source-intake-runtime-contract";

const runtimeVersion = "bounded_source_intake_runtime.v0.1";
const contractVersion = "bounded_source_intake_runtime_contract.v0.1";
const requestVersion = "bounded_source_intake_request.v0.1";
const resultVersion = "bounded_source_intake_result_envelope.v0.1";
const sourceDescriptorVersion = "bounded_source_intake_source_descriptor.v0.1";
const scope = "project:augnes";
const runtimeStatus = "bounded_runtime_only";
const contractStatus = "contract_only";

const sourceKinds = [
  "manual_text_summary",
  "public_url_ref",
  "repository_file_ref",
  "uploaded_file_ref",
  "operator_note_ref",
  "review_memory_ref",
  "unknown",
] as const;

const locatorKinds = [
  "symbolic_ref",
  "public_url_locator",
  "repo_path_locator",
  "uploaded_file_locator",
  "manual_ref_locator",
  "unknown",
] as const;

const requestStatuses = [
  "candidate_only",
  "needs_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_unsupported_source_kind",
  "accepted_for_future_runtime",
] as const;

const privacyClasses = [
  "public_safe_ref",
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

const contractReasonCodes: BoundedSourceIntakeReasonCode[] = [
  "source_kind_supported",
  "source_kind_unknown",
  "source_locator_present",
  "source_locator_missing",
  "source_ref_public_safe",
  "source_ref_private_ref_only",
  "raw_source_body_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "operator_review_required",
  "runtime_not_implemented",
  "source_fetch_not_executed",
  "local_file_read_not_executed",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_ref_not_proof",
  "product_write_denied",
];

const runtimeDecisions: BoundedSourceIntakeRuntimeDecision[] = [
  "accepted_bounded_summary",
  "blocked_private_or_raw_payload",
  "blocked_secret_like_payload",
  "blocked_unsupported_source_kind",
  "needs_operator_review",
  "candidate_only",
];

const contractAuthorityFalseFields = [
  "source_intake_runtime_now",
  "source_fetch_now",
  "local_file_read_now",
  "raw_source_body_storage_now",
  "provider_openai_call_now",
  "retrieval_rag_execution_now",
  "db_query_or_write_now",
  "source_of_truth",
  "proof_or_evidence_record",
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
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "raw_source_body_storage_now",
  "provider_openai_call_now",
  "retrieval_rag_execution_now",
  "db_query_or_write_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "codex_execution_authority",
  "github_automation_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
] as const;

const blockedRawPlaceholder = "raw source body blocked by contract fixture";
const blockedSecretPlaceholder = "secret-like source locator blocked by contract fixture";

export function getBoundedSourceIntakeRuntimeAuthorityBoundary(): BoundedSourceIntakeRuntimeAuthorityBoundary {
  return {
    bounded_runtime_only: true,
    caller_provided_input_only: true,
    source_fetch_now: false,
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    raw_source_body_storage_now: false,
    provider_openai_call_now: false,
    retrieval_rag_execution_now: false,
    db_query_or_write_now: false,
    source_of_truth: false,
    proof_or_evidence_record: false,
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

export function buildBoundedSourceIntakeRuntimeReport(
  input:
    | BoundedSourceIntakeRuntimeInput
    | BoundedSourceIntakeContractBundle
    | BoundedSourceIntakeRequest[],
  options?: {
    as_of?: string;
    source_fixture_refs?: string[];
    bounded_summaries?: BoundedSourceIntakeRuntimeBoundedSummary[];
  },
): BoundedSourceIntakeRuntimeReport {
  const normalizedInput = normalizeRuntimeInput(input, options);
  const validation = validateBoundedSourceIntakeRuntimeInput(normalizedInput);
  if (!validation.passed) {
    throw new Error("bounded_source_intake_runtime_input_invalid");
  }

  const summariesByRequestId = new Map<string, BoundedSourceIntakeRuntimeBoundedSummary>();
  const summariesBySourceId = new Map<string, BoundedSourceIntakeRuntimeBoundedSummary>();
  for (const summary of normalizedInput.bounded_summaries ?? []) {
    if (summary.request_id) {
      summariesByRequestId.set(summary.request_id, summary);
    }
    if (summary.source_id) {
      summariesBySourceId.set(summary.source_id, summary);
    }
  }

  const sortedRequests = [...normalizedInput.requests].sort((left, right) =>
    left.request_id.localeCompare(right.request_id),
  );
  const runtime_decisions: BoundedSourceIntakeRuntimeDecisionRecord[] = [];
  const result_envelopes: BoundedSourceIntakeResultEnvelope[] = [];

  for (const request of sortedRequests) {
    const summary =
      summariesByRequestId.get(request.request_id) ??
      summariesBySourceId.get(request.source_descriptor.source_id);
    const decision = decideRuntimeRequest(request, summary);
    const boundedSummaryRef = getBoundedSummaryRef(request, summary, decision);
    const decisionRecord: BoundedSourceIntakeRuntimeDecisionRecord = {
      request_id: request.request_id,
      source_id: request.source_descriptor.source_id,
      decision,
      reason_codes: createDecisionReasonCodes(request, decision, Boolean(boundedSummaryRef)),
      ...(boundedSummaryRef ? { bounded_summary_ref: boundedSummaryRef } : {}),
    };
    runtime_decisions.push(decisionRecord);
    result_envelopes.push(createResultEnvelope(request, decision, boundedSummaryRef));
  }

  const reportWithoutFingerprint: Omit<
    BoundedSourceIntakeRuntimeReport,
    "runtime_report_fingerprint"
  > = {
    runtime_version: runtimeVersion,
    contract_version: contractVersion,
    scope,
    status: runtimeStatus,
    as_of: normalizedInput.as_of,
    source_fixture_refs: [...normalizedInput.source_fixture_refs].sort(),
    result_envelopes,
    runtime_decisions,
    decision_counts: countRuntimeDecisions(runtime_decisions),
    boundary_notes: [
      "Bounded Source Intake Runtime is bounded-runtime-only.",
      "It processes caller-provided source descriptors and bounded summaries only.",
      "Source refs are lineage pointers, not proof.",
      "accepted_bounded_summary is not truth.",
      "Product-write remains parked by #686.",
    ],
    authority_boundary: getBoundedSourceIntakeRuntimeAuthorityBoundary(),
  };
  const report = {
    ...reportWithoutFingerprint,
    runtime_report_fingerprint: createBoundedSourceIntakeRuntimeReportFingerprint(
      reportWithoutFingerprint,
    ),
  };
  return report;
}

export function validateBoundedSourceIntakeRuntimeInput(
  input: unknown,
): BoundedSourceIntakeRuntimeValidationResult {
  const failure_codes: string[] = [];
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_not_object"] };
  }

  if (input.runtime_version !== runtimeVersion) {
    failure_codes.push("wrong_runtime_version");
  }
  if (input.contract_version !== contractVersion) {
    failure_codes.push("wrong_contract_version");
  }
  if (input.scope !== scope) {
    failure_codes.push("wrong_scope");
  }
  if (!isNonEmptyString(input.as_of)) {
    failure_codes.push("missing_as_of");
  } else if (!isIsoTimestamp(input.as_of)) {
    failure_codes.push("malformed_as_of");
  }
  if (!Array.isArray(input.source_fixture_refs)) {
    failure_codes.push("source_fixture_refs_not_array");
  } else if (input.source_fixture_refs.some((ref) => !isSafePublicText(ref))) {
    failure_codes.push("unsafe_source_fixture_refs");
  }
  if (!Array.isArray(input.requests) || input.requests.length === 0) {
    failure_codes.push("missing_or_empty_requests");
  } else {
    failure_codes.push(...validateRequests(input.requests));
  }
  if (
    "bounded_summaries" in input &&
    input.bounded_summaries !== undefined &&
    !Array.isArray(input.bounded_summaries)
  ) {
    failure_codes.push("bounded_summaries_not_array");
  } else if (Array.isArray(input.bounded_summaries)) {
    failure_codes.push(...validateBoundedSummaries(input.bounded_summaries));
  }

  return uniqueValidationResult(failure_codes);
}

export function validateBoundedSourceIntakeRuntimeReport(
  report: unknown,
): BoundedSourceIntakeRuntimeValidationResult {
  const failure_codes: string[] = [];
  if (!isRecord(report)) {
    return { passed: false, failure_codes: ["report_not_object"] };
  }

  if (report.runtime_version !== runtimeVersion) {
    failure_codes.push("wrong_runtime_version");
  }
  if (report.contract_version !== contractVersion) {
    failure_codes.push("wrong_contract_version");
  }
  if (report.scope !== scope) {
    failure_codes.push("wrong_scope");
  }
  if (report.status !== runtimeStatus) {
    failure_codes.push("wrong_status");
  }
  if (!isNonEmptyString(report.as_of)) {
    failure_codes.push("missing_as_of");
  } else if (!isIsoTimestamp(report.as_of)) {
    failure_codes.push("malformed_as_of");
  }
  if (!Array.isArray(report.result_envelopes) || report.result_envelopes.length === 0) {
    failure_codes.push("empty_result_envelopes");
  }
  if (!Array.isArray(report.runtime_decisions) || report.runtime_decisions.length === 0) {
    failure_codes.push("empty_runtime_decisions");
  }
  if (!isRuntimeAuthorityBoundarySafe(report.authority_boundary)) {
    failure_codes.push("authority_boundary_grants_forbidden_authority");
  }
  if (!isNonEmptyString(report.runtime_report_fingerprint)) {
    failure_codes.push("fingerprint_empty");
  } else if (
    createBoundedSourceIntakeRuntimeReportFingerprint(
      report as Partial<BoundedSourceIntakeRuntimeReport>,
    ) !== report.runtime_report_fingerprint
  ) {
    failure_codes.push("fingerprint_mismatched");
  }
  if (!isSafePublicText(JSON.stringify(report))) {
    failure_codes.push("report_contains_unsafe_text");
  }

  const envelopes = Array.isArray(report.result_envelopes)
    ? (report.result_envelopes as unknown[])
    : [];
  const decisions = Array.isArray(report.runtime_decisions)
    ? (report.runtime_decisions as unknown[])
    : [];
  const envelopeIds = new Set<string>();
  const decisionIds = new Set<string>();
  const decisionByRequestId = new Map<string, BoundedSourceIntakeRuntimeDecisionRecord>();

  for (const envelope of envelopes) {
    if (!isRecord(envelope) || !isNonEmptyString(envelope.request_id)) {
      failure_codes.push("result_envelope_missing_request_id");
      continue;
    }
    if (envelopeIds.has(envelope.request_id)) {
      failure_codes.push("duplicate_result_envelope_request_id");
    }
    envelopeIds.add(envelope.request_id);
    failure_codes.push(...validateResultEnvelope(envelope));
  }

  for (const decision of decisions) {
    if (!isRuntimeDecisionRecord(decision)) {
      failure_codes.push("invalid_runtime_decision_record");
      continue;
    }
    if (decisionIds.has(decision.request_id)) {
      failure_codes.push("duplicate_runtime_decision_request_id");
    }
    decisionIds.add(decision.request_id);
    decisionByRequestId.set(decision.request_id, decision);
  }

  for (const requestId of envelopeIds) {
    if (!decisionIds.has(requestId)) {
      failure_codes.push("result_envelope_without_runtime_decision");
    }
  }
  for (const requestId of decisionIds) {
    if (!envelopeIds.has(requestId)) {
      failure_codes.push("runtime_decision_without_result_envelope");
    }
  }
  for (const envelope of envelopes) {
    if (!isRecord(envelope) || !isNonEmptyString(envelope.request_id)) {
      continue;
    }
    const decision = decisionByRequestId.get(envelope.request_id);
    if (!decision) {
      continue;
    }
    if (
      envelope.accepted_for_future_runtime === true &&
      decision.decision !== "accepted_bounded_summary"
    ) {
      failure_codes.push("accepted_envelope_without_accepted_decision");
    }
    if (
      decision.decision === "accepted_bounded_summary" &&
      !isNonEmptyString(decision.bounded_summary_ref)
    ) {
      failure_codes.push("accepted_decision_without_bounded_summary_ref");
    }
    if (
      decision.decision.startsWith("blocked_") &&
      envelope.accepted_for_future_runtime === true
    ) {
      failure_codes.push("blocked_decision_with_accepted_envelope");
    }
  }
  if (!decisionCountsMatch(report.decision_counts, decisions)) {
    failure_codes.push("decision_counts_mismatch");
  }

  return uniqueValidationResult(failure_codes);
}

export function createBoundedSourceIntakeRuntimeReportFingerprint(
  report: Partial<BoundedSourceIntakeRuntimeReport>,
): string {
  const reportForHash = JSON.parse(JSON.stringify(report));
  delete reportForHash.runtime_report_fingerprint;
  return createHash("sha256").update(canonicalJson(reportForHash)).digest("hex");
}

export function isSafeBoundedSourceIntakeRuntimeSummary(value: unknown): boolean {
  return typeof value === "string" && isSafePublicText(value);
}

export function isSafeBoundedSourceIntakeRuntimeLocator(value: unknown): boolean {
  return typeof value === "string" && isSafePublicText(value);
}

function normalizeRuntimeInput(
  input:
    | BoundedSourceIntakeRuntimeInput
    | BoundedSourceIntakeContractBundle
    | BoundedSourceIntakeRequest[],
  options?: {
    as_of?: string;
    source_fixture_refs?: string[];
    bounded_summaries?: BoundedSourceIntakeRuntimeBoundedSummary[];
  },
): BoundedSourceIntakeRuntimeInput {
  if (Array.isArray(input)) {
    return {
      runtime_version: runtimeVersion,
      contract_version: contractVersion,
      scope,
      as_of: options?.as_of ?? "",
      source_fixture_refs: options?.source_fixture_refs ?? [],
      requests: input,
      bounded_summaries: options?.bounded_summaries ?? [],
    };
  }
  if ("bundle_version" in input && "requests" in input) {
    return {
      runtime_version: runtimeVersion,
      contract_version: contractVersion,
      scope,
      as_of: input.as_of,
      source_fixture_refs: input.source_fixture_refs,
      requests: input.requests,
      bounded_summaries: options?.bounded_summaries ?? [],
    };
  }
  return input;
}

function decideRuntimeRequest(
  request: BoundedSourceIntakeRequest,
  summary?: BoundedSourceIntakeRuntimeBoundedSummary,
): BoundedSourceIntakeRuntimeDecision {
  const descriptor = request.source_descriptor;
  if (descriptor.source_kind === "unknown") {
    return "blocked_unsupported_source_kind";
  }
  if (
    descriptor.privacy_class === "blocked_secret_like_payload" ||
    descriptor.redaction_status === "blocked_secret_like_pattern"
  ) {
    return "blocked_secret_like_payload";
  }
  if (
    descriptor.privacy_class === "blocked_raw_private_payload" ||
    descriptor.redaction_status === "blocked_raw_payload"
  ) {
    return "blocked_private_or_raw_payload";
  }
  if (!descriptor.source_locator) {
    return "needs_operator_review";
  }
  if (request.request_status === "blocked_private_or_raw_payload") {
    return "blocked_private_or_raw_payload";
  }
  if (request.request_status === "blocked_unsupported_source_kind") {
    return "blocked_unsupported_source_kind";
  }
  if (request.request_status === "needs_operator_review") {
    return "needs_operator_review";
  }
  if (summary) {
    return "accepted_bounded_summary";
  }
  if (
    descriptor.source_kind === "manual_text_summary" &&
    descriptor.operator_supplied_summary &&
    isSafeBoundedSourceIntakeRuntimeSummary(descriptor.operator_supplied_summary)
  ) {
    return "accepted_bounded_summary";
  }
  if (request.request_status === "accepted_for_future_runtime") {
    return "candidate_only";
  }
  return "candidate_only";
}

function getBoundedSummaryRef(
  request: BoundedSourceIntakeRequest,
  summary: BoundedSourceIntakeRuntimeBoundedSummary | undefined,
  decision: BoundedSourceIntakeRuntimeDecision,
): string | undefined {
  if (decision !== "accepted_bounded_summary") {
    return undefined;
  }
  if (summary?.bounded_summary_ref) {
    return summary.bounded_summary_ref;
  }
  if (request.source_descriptor.source_kind === "manual_text_summary") {
    return `bounded-summary-ref:${request.request_id}`;
  }
  return undefined;
}

function createResultEnvelope(
  request: BoundedSourceIntakeRequest,
  decision: BoundedSourceIntakeRuntimeDecision,
  boundedSummaryRef: string | undefined,
): BoundedSourceIntakeResultEnvelope {
  const descriptor = request.source_descriptor;
  const source_refs = isSafeSourceRef(descriptor.symbolic_source_ref)
    ? [descriptor.symbolic_source_ref].sort()
    : [];
  return {
    result_version: resultVersion,
    contract_version: contractVersion,
    scope,
    status: contractStatus,
    request_id: request.request_id,
    accepted_for_future_runtime: decision === "accepted_bounded_summary",
    source_refs,
    ...(boundedSummaryRef ? { bounded_summary_ref: boundedSummaryRef } : {}),
    raw_source_body_included: false,
    source_fetch_executed: false,
    local_file_read_executed: false,
    provider_call_executed: false,
    retrieval_executed: false,
    proof_or_evidence_created: false,
    product_write_executed: false,
    reason_codes: createEnvelopeReasonCodes(request, decision),
    authority_boundary: getContractEnvelopeAuthorityBoundary(),
  };
}

function createEnvelopeReasonCodes(
  request: BoundedSourceIntakeRequest,
  decision: BoundedSourceIntakeRuntimeDecision,
): BoundedSourceIntakeReasonCode[] {
  const descriptor = request.source_descriptor;
  const codes: BoundedSourceIntakeReasonCode[] = [
    ...descriptor.reason_codes,
    "runtime_not_implemented",
    "source_fetch_not_executed",
    "local_file_read_not_executed",
    "provider_call_not_executed",
    "retrieval_not_executed",
    "source_ref_not_proof",
    "product_write_denied",
  ];
  if (decision === "blocked_unsupported_source_kind") {
    codes.push("source_kind_unknown");
  }
  if (decision === "blocked_private_or_raw_payload") {
    codes.push("raw_source_body_blocked");
  }
  if (decision === "blocked_secret_like_payload") {
    codes.push("secret_like_pattern_blocked");
  }
  if (decision === "needs_operator_review") {
    codes.push("operator_review_required");
  }
  if (!descriptor.source_locator) {
    codes.push("source_locator_missing");
  }
  return uniqueSorted(codes).filter(isContractReasonCode);
}

function createDecisionReasonCodes(
  request: BoundedSourceIntakeRequest,
  decision: BoundedSourceIntakeRuntimeDecision,
  hasSummary: boolean,
): BoundedSourceIntakeRuntimeReasonCode[] {
  const codes: BoundedSourceIntakeRuntimeReasonCode[] = [
    ...createEnvelopeReasonCodes(request, decision),
    "bounded_runtime_executed",
    "request_validation_passed",
    "runtime_result_envelope_created",
    "accepted_request_not_truth",
    hasSummary ? "bounded_summary_present" : "bounded_summary_missing",
  ];
  if (decision.startsWith("blocked_")) {
    codes.push("blocked_request_not_executed");
  }
  return uniqueSorted(codes);
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
    if (!requestStatuses.includes(request.request_status as (typeof requestStatuses)[number])) {
      failureCodes.push("request_status_outside_vocabulary");
    }
    if (!isSafePublicText(request.bounded_intake_purpose)) {
      failureCodes.push("unsafe_bounded_intake_purpose");
    }
    if (
      !Array.isArray(request.boundary_notes) ||
      request.boundary_notes.some((note) => !isSafePublicText(note))
    ) {
      failureCodes.push("unsafe_boundary_notes");
    }
    if (!isContractAuthorityBoundarySafe(request.authority_boundary)) {
      failureCodes.push("authority_boundary_grants_forbidden_authority");
    }
    if (!isRecord(request.source_descriptor)) {
      failureCodes.push("source_descriptor_missing");
      continue;
    }
    failureCodes.push(...validateSourceDescriptor(request.source_descriptor));
  }
  return failureCodes;
}

function validateSourceDescriptor(descriptor: Record<string, unknown>): string[] {
  const failureCodes: string[] = [];
  if (descriptor.source_descriptor_version !== sourceDescriptorVersion) {
    failureCodes.push("source_descriptor_wrong_version");
  }
  if (descriptor.scope !== scope) {
    failureCodes.push("source_descriptor_wrong_scope");
  }
  if (!isNonEmptyString(descriptor.source_id)) {
    failureCodes.push("source_id_missing");
  }
  if (!sourceKinds.includes(descriptor.source_kind as (typeof sourceKinds)[number])) {
    failureCodes.push("source_kind_outside_vocabulary");
  }
  if (!locatorKinds.includes(descriptor.locator_kind as (typeof locatorKinds)[number])) {
    failureCodes.push("locator_kind_outside_vocabulary");
  }
  if (!privacyClasses.includes(descriptor.privacy_class as (typeof privacyClasses)[number])) {
    failureCodes.push("privacy_class_outside_vocabulary");
  }
  if (!redactionStatuses.includes(descriptor.redaction_status as (typeof redactionStatuses)[number])) {
    failureCodes.push("redaction_status_outside_vocabulary");
  }
  if (!Array.isArray(descriptor.reason_codes)) {
    failureCodes.push("reason_codes_not_array");
  } else if (descriptor.reason_codes.some((code) => !isContractReasonCode(code))) {
    failureCodes.push("reason_codes_outside_contract_vocabulary");
  }
  if (!isSafeSourceRef(descriptor.symbolic_source_ref)) {
    failureCodes.push("unsafe_symbolic_source_ref");
  }
  if (!isDescriptorLocatorSafe(descriptor)) {
    failureCodes.push("unsafe_source_locator_not_blocked");
  }
  if (!isSafePublicText(descriptor.title_summary)) {
    failureCodes.push("unsafe_title_summary");
  }
  if (!isSafePublicText(descriptor.operator_supplied_summary)) {
    failureCodes.push("unsafe_operator_supplied_summary");
  }
  if (
    !Array.isArray(descriptor.redaction_notes) ||
    descriptor.redaction_notes.some(
      (note) => !isRedactionNoteSafe(note, descriptor),
    )
  ) {
    failureCodes.push("unsafe_redaction_notes");
  }
  return failureCodes;
}

function validateBoundedSummaries(summaries: unknown[]): string[] {
  const failureCodes: string[] = [];
  for (const summary of summaries) {
    if (!isRecord(summary)) {
      failureCodes.push("bounded_summary_not_object");
      continue;
    }
    if (!isNonEmptyString(summary.request_id) && !isNonEmptyString(summary.source_id)) {
      failureCodes.push("bounded_summary_missing_request_or_source_id");
    }
    if (!isSafeSourceRef(summary.bounded_summary_ref)) {
      failureCodes.push("bounded_summary_ref_unsafe");
    }
    if (summary.public_safe !== true) {
      failureCodes.push("bounded_summary_public_safe_not_true");
    }
    if (!isSafeBoundedSourceIntakeRuntimeSummary(summary.bounded_summary)) {
      failureCodes.push("bounded_summary_unsafe");
    }
  }
  return failureCodes;
}

function validateResultEnvelope(envelope: Record<string, unknown>): string[] {
  const failureCodes: string[] = [];
  if (envelope.result_version !== resultVersion) {
    failureCodes.push("result_wrong_version");
  }
  if (envelope.contract_version !== contractVersion) {
    failureCodes.push("result_wrong_contract_version");
  }
  if (envelope.scope !== scope) {
    failureCodes.push("result_wrong_scope");
  }
  if (envelope.status !== contractStatus) {
    failureCodes.push("result_wrong_status");
  }
  for (const field of [
    "raw_source_body_included",
    "source_fetch_executed",
    "local_file_read_executed",
    "provider_call_executed",
    "retrieval_executed",
    "proof_or_evidence_created",
    "product_write_executed",
  ]) {
    if (envelope[field] !== false) {
      failureCodes.push(`${field}_granted`);
    }
  }
  if (!Array.isArray(envelope.source_refs) || envelope.source_refs.some((ref) => !isSafeSourceRef(ref))) {
    failureCodes.push("unsafe_source_refs");
  }
  if (!isSafeSourceRef(envelope.bounded_summary_ref)) {
    failureCodes.push("unsafe_bounded_summary_ref");
  }
  if (!Array.isArray(envelope.reason_codes) || envelope.reason_codes.some((code) => !isContractReasonCode(code))) {
    failureCodes.push("result_reason_codes_invalid");
  }
  if (!isContractAuthorityBoundarySafe(envelope.authority_boundary)) {
    failureCodes.push("result_authority_boundary_grants_forbidden_authority");
  }
  return failureCodes;
}

function countRuntimeDecisions(
  decisions: BoundedSourceIntakeRuntimeDecisionRecord[],
): Record<BoundedSourceIntakeRuntimeDecision, number> {
  const counts = {
    accepted_bounded_summary: 0,
    blocked_private_or_raw_payload: 0,
    blocked_secret_like_payload: 0,
    blocked_unsupported_source_kind: 0,
    needs_operator_review: 0,
    candidate_only: 0,
  };
  for (const decision of decisions) {
    counts[decision.decision] += 1;
  }
  return counts;
}

function decisionCountsMatch(counts: unknown, decisions: unknown[]): boolean {
  if (!isRecord(counts)) {
    return false;
  }
  const expected = countRuntimeDecisions(
    decisions.filter(isRuntimeDecisionRecord),
  );
  return runtimeDecisions.every((decision) => counts[decision] === expected[decision]);
}

function isRuntimeDecisionRecord(value: unknown): value is BoundedSourceIntakeRuntimeDecisionRecord {
  return (
    isRecord(value) &&
    isNonEmptyString(value.request_id) &&
    isNonEmptyString(value.source_id) &&
    runtimeDecisions.includes(value.decision as BoundedSourceIntakeRuntimeDecision) &&
    Array.isArray(value.reason_codes) &&
    value.reason_codes.every(isRuntimeReasonCode) &&
    isSafeSourceRef(value.bounded_summary_ref)
  );
}

function getContractEnvelopeAuthorityBoundary(): BoundedSourceIntakeAuthorityBoundary {
  return {
    contract_only: true,
    source_intake_runtime_now: false,
    source_fetch_now: false,
    local_file_read_now: false,
    raw_source_body_storage_now: false,
    provider_openai_call_now: false,
    retrieval_rag_execution_now: false,
    db_query_or_write_now: false,
    source_of_truth: false,
    proof_or_evidence_record: false,
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

function isContractAuthorityBoundarySafe(value: unknown): boolean {
  if (!isRecord(value) || value.contract_only !== true) {
    return false;
  }
  return contractAuthorityFalseFields.every((field) => value[field] === false);
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

function isDescriptorLocatorSafe(descriptor: Record<string, unknown>): boolean {
  const locator = descriptor.source_locator;
  if (typeof locator !== "string") {
    return false;
  }
  if (locator === "") {
    return true;
  }
  if (isSafePublicText(locator)) {
    return true;
  }
  if (
    locator === blockedSecretPlaceholder &&
    (descriptor.privacy_class === "blocked_secret_like_payload" ||
      descriptor.redaction_status === "blocked_secret_like_pattern")
  ) {
    return true;
  }
  return false;
}

function isRedactionNoteSafe(
  note: unknown,
  descriptor: Record<string, unknown>,
): boolean {
  if (typeof note !== "string") {
    return false;
  }
  if (
    note === blockedRawPlaceholder &&
    (descriptor.privacy_class === "blocked_raw_private_payload" ||
      descriptor.redaction_status === "blocked_raw_payload")
  ) {
    return true;
  }
  if (
    note === blockedSecretPlaceholder &&
    (descriptor.privacy_class === "blocked_secret_like_payload" ||
      descriptor.redaction_status === "blocked_secret_like_pattern")
  ) {
    return true;
  }
  return isSafePublicText(note);
}

function isSafePublicText(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value !== "string") {
    return false;
  }
  const lowered = value.toLowerCase();
  return (
    !value.includes("/Users/") &&
    !value.includes("/home/") &&
    !lowered.includes("file://") &&
    !value.includes("sk-") &&
    !value.includes("ghp_") &&
    !value.includes("OPENAI_API_KEY") &&
    !value.includes("GITHUB_TOKEN") &&
    !lowered.includes("password:") &&
    !lowered.includes("secret:") &&
    !lowered.includes("private key") &&
    !lowered.includes("raw provider output") &&
    !lowered.includes("raw conversation") &&
    !lowered.includes("hidden reasoning") &&
    !lowered.includes("raw db row") &&
    !lowered.includes("raw_db_row") &&
    !lowered.includes("browser dump") &&
    !lowered.includes("raw browser dump") &&
    !lowered.includes("raw source body") &&
    !lowered.includes("secret-like source locator")
  );
}

function isSafeSourceRef(value: unknown): value is string | undefined {
  if (value === undefined || value === null) {
    return true;
  }
  return typeof value === "string" && value.length > 0 && isSafePublicText(value);
}

function isContractReasonCode(value: unknown): value is BoundedSourceIntakeReasonCode {
  return typeof value === "string" && contractReasonCodes.includes(value as BoundedSourceIntakeReasonCode);
}

function isRuntimeReasonCode(value: unknown): value is BoundedSourceIntakeRuntimeReasonCode {
  return (
    isContractReasonCode(value) ||
    value === "bounded_runtime_executed" ||
    value === "bounded_summary_present" ||
    value === "bounded_summary_missing" ||
    value === "runtime_result_envelope_created" ||
    value === "request_validation_passed" ||
    value === "request_validation_failed" ||
    value === "blocked_request_not_executed" ||
    value === "accepted_request_not_truth"
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

function uniqueValidationResult(failureCodes: string[]): BoundedSourceIntakeRuntimeValidationResult {
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
