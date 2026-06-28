import { createHash } from "node:crypto";

import {
  type BoundedSourceFetchFailureKindV01,
  type BoundedSourceFetcherV01,
  fetchBoundedSourceV01,
} from "./fetch-bounded-source";
import {
  type BoundedSourceInputKindV01,
  containsUnsafeSourceLocatorTextV01,
  createPublicSafeSourceLocatorFingerprintV01,
  isBoundedSourceInputKindV01,
  sanitizeSourceLocatorV01,
} from "./sanitize-source-ref";

export const BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_VERSION_V01 =
  "bounded_source_intake_runtime_completion.v0.1" as const;
export const BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_REQUEST_VERSION_V01 =
  "bounded_source_intake_runtime_completion_request.v0.1" as const;
export const BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_RESULT_VERSION_V01 =
  "bounded_source_intake_runtime_completion_result.v0.1" as const;

type Scope = "project:augnes";

export type BoundedSourceIntakeRuntimeCompletionStatusV01 =
  | "source_ref_created"
  | "accepted_bounded_summary"
  | "candidate_only"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "rejected";

export type BoundedSourceIntakeFailureKindV01 =
  | BoundedSourceFetchFailureKindV01
  | "copyright_boundary_blocked"
  | "private_identifier_detected"
  | "invalid_input"
  | "forbidden_authority"
  | "raw_payload_blocked";

export interface BoundedSourceIntakeRuntimeAuthorityBoundaryV01 {
  bounded_source_intake_runtime_now: true;
  explicit_user_provided_source_only: true;
  same_origin_post_route_now: true;
  bounded_fetch_abstraction_now: true;
  source_ref_metadata_now: true;
  raw_body_non_persistent_by_default: true;
  failure_to_gap_candidate_metadata_now: true;
  automatic_crawling_now: false;
  background_fetch_now: false;
  automatic_web_discovery_now: false;
  provider_extraction_now: false;
  retrieval_index_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  raw_source_body_persisted_now: false;
  raw_private_payload_persisted_now: false;
  raw_provider_output_stored_now: false;
  raw_retrieval_output_stored_now: false;
  source_ref_is_proof: false;
  source_summary_is_truth: false;
  failure_gap_is_fact: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface BoundedSourceIntakeRuntimeRequestV01 {
  request_version: typeof BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_REQUEST_VERSION_V01;
  runtime_version: typeof BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_VERSION_V01;
  scope: Scope;
  source_intake_request_id: string;
  requested_by: string;
  requested_at: string;
  input_kind: BoundedSourceInputKindV01;
  user_provided: true;
  source_locator: string;
  source_label?: string;
  bounded_summary?: string;
  fetch_policy?: Record<string, unknown>;
  size_limit_bytes?: number;
  timeout_ms?: number;
  content_type_allowlist?: string[];
  raw_body_storage_policy?: "non_persistent";
  redaction_policy?: "public_safe_summary_only";
  failure_to_gap_policy?: "create_gap_metadata";
  authority_boundary?: Record<string, unknown>;
  reason_codes?: string[];
}

export interface BoundedSourceIntakeRuntimeValidationResultV01 {
  passed: boolean;
  status: BoundedSourceIntakeRuntimeCompletionStatusV01;
  failure_kind: BoundedSourceIntakeFailureKindV01 | null;
  failure_codes: string[];
}

export interface BoundedSourceIntakeRuntimeResultV01 {
  result_version: typeof BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_RESULT_VERSION_V01;
  runtime_version: typeof BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_VERSION_V01;
  scope: Scope;
  status: BoundedSourceIntakeRuntimeCompletionStatusV01;
  input_kind: BoundedSourceInputKindV01 | null;
  source_ref_id: string | null;
  source_locator_ref: string | null;
  source_label: string | null;
  bounded_summary: string | null;
  source_metadata: Record<string, unknown>;
  fetch_report: Record<string, unknown>;
  privacy_report: Record<string, unknown>;
  redaction_report: Record<string, unknown>;
  gap_candidate_ref: string | null;
  failure_kind: BoundedSourceIntakeFailureKindV01 | null;
  raw_body_stored: false;
  provider_extraction_started: false;
  retrieval_indexed: false;
  proof_or_evidence_created: false;
  product_write_executed: false;
  authority_boundary: BoundedSourceIntakeRuntimeAuthorityBoundaryV01;
  reason_codes: string[];
}

const scope: Scope = "project:augnes";
const defaultSizeLimitBytes = 65536;
const maxSizeLimitBytes = 65536;
const defaultTimeoutMs = 1500;
const maxTimeoutMs = 5000;
const manualSummaryLimit = 1200;
const defaultContentTypeAllowlist = ["text/plain", "text/html", "application/json"] as const;

const forbiddenAuthorityFalseFields = [
  "automatic_crawling_now",
  "background_fetch_now",
  "automatic_web_discovery_now",
  "provider_extraction_now",
  "retrieval_index_write_now",
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
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "raw_source_body_persisted_now",
  "raw_private_payload_persisted_now",
  "raw_provider_output_stored_now",
  "raw_retrieval_output_stored_now",
  "source_ref_is_proof",
  "source_summary_is_truth",
  "failure_gap_is_fact",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
] as const;

const forbiddenAuthorityFieldSet = new Set<string>(forbiddenAuthorityFalseFields);
const authorityLikePatterns = [
  /_authority$/i,
  /_write_now$/i,
  /_call_now$/i,
  /_execution_now$/i,
  /_is_truth$/i,
  /_is_proof$/i,
  /_is_accepted_evidence$/i,
  /_is_durable_state$/i,
  /product_write/i,
  /product_id_allocation/i,
  /proof_or_evidence/i,
  /claim_or_evidence/i,
  /promotion_execution/i,
  /durable_state_apply/i,
  /formation_receipt_write/i,
  /github_api_call/i,
  /git_write/i,
] as const;

export function createBoundedSourceIntakeRuntimeAuthorityBoundaryV01():
  BoundedSourceIntakeRuntimeAuthorityBoundaryV01 {
  return {
    bounded_source_intake_runtime_now: true,
    explicit_user_provided_source_only: true,
    same_origin_post_route_now: true,
    bounded_fetch_abstraction_now: true,
    source_ref_metadata_now: true,
    raw_body_non_persistent_by_default: true,
    failure_to_gap_candidate_metadata_now: true,
    automatic_crawling_now: false,
    background_fetch_now: false,
    automatic_web_discovery_now: false,
    provider_extraction_now: false,
    retrieval_index_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    raw_source_body_persisted_now: false,
    raw_private_payload_persisted_now: false,
    raw_provider_output_stored_now: false,
    raw_retrieval_output_stored_now: false,
    source_ref_is_proof: false,
    source_summary_is_truth: false,
    failure_gap_is_fact: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function validateBoundedSourceIntakeRuntimeRequestV01(
  input: unknown,
): BoundedSourceIntakeRuntimeValidationResultV01 {
  const failureCodes: string[] = [];
  if (!isRecord(input)) {
    return validationFailure("blocked_invalid_input", "invalid_input", ["input_not_object"]);
  }

  if (input.request_version !== BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_REQUEST_VERSION_V01) {
    failureCodes.push("wrong_request_version");
  }
  if (input.runtime_version !== BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_VERSION_V01) {
    failureCodes.push("wrong_runtime_version");
  }
  if (input.scope !== scope) failureCodes.push("wrong_scope");
  if (!isSafeIdentifier(input.source_intake_request_id)) {
    failureCodes.push("source_intake_request_id_invalid");
  }
  if (!isSafeIdentifier(input.requested_by)) failureCodes.push("requested_by_invalid");
  if (!isIsoTimestamp(input.requested_at)) failureCodes.push("requested_at_invalid");
  if (!isBoundedSourceInputKindV01(input.input_kind)) failureCodes.push("input_kind_invalid");
  if (input.user_provided !== true) failureCodes.push("user_provided_false");
  if (input.source_label !== undefined && !isSafePublicText(input.source_label, 160)) {
    failureCodes.push("source_label_invalid");
  }
  if (!isSafeReasonCodes(input.reason_codes)) failureCodes.push("reason_codes_invalid");

  const authorityFailures = validateRecursiveAuthority(input);
  if (authorityFailures.length > 0) {
    return validationFailure(
      "blocked_forbidden_authority",
      "forbidden_authority",
      authorityFailures,
    );
  }

  if (containsUnsafeSourceLocatorTextV01(input)) {
    return validationFailure(
      "blocked_private_or_raw_payload",
      "private_identifier_detected",
      ["private_or_raw_payload_detected"],
    );
  }

  if (input.raw_body_storage_policy !== "non_persistent") {
    failureCodes.push("raw_body_storage_policy_must_be_non_persistent");
  }
  if (
    input.redaction_policy !== undefined &&
    input.redaction_policy !== "public_safe_summary_only"
  ) {
    failureCodes.push("redaction_policy_invalid");
  }
  if (
    input.failure_to_gap_policy !== undefined &&
    input.failure_to_gap_policy !== "create_gap_metadata"
  ) {
    failureCodes.push("failure_to_gap_policy_invalid");
  }
  failureCodes.push(...validateLimits(input));
  failureCodes.push(...validateFetchPolicy(input.fetch_policy));

  if (isBoundedSourceInputKindV01(input.input_kind)) {
    const sanitized = sanitizeSourceLocatorV01({
      input_kind: input.input_kind,
      source_locator: input.source_locator,
    });
    if (sanitized.status === "blocked_private_or_raw_payload") {
      return validationFailure(
        "blocked_private_or_raw_payload",
        "private_identifier_detected",
        sanitized.failure_codes,
      );
    }
    if (sanitized.status !== "ok") failureCodes.push(...sanitized.failure_codes);
  }

  if (input.input_kind === "manual_text_summary") {
    if (!isSafePublicText(input.bounded_summary, manualSummaryLimit)) {
      failureCodes.push("manual_text_summary_invalid");
    }
  } else if (input.bounded_summary !== undefined && !isSafePublicText(input.bounded_summary, manualSummaryLimit)) {
    failureCodes.push("bounded_summary_invalid");
  }

  if (failureCodes.length > 0) {
    const rawStorageFailure = failureCodes.includes("raw_body_storage_policy_must_be_non_persistent");
    return validationFailure(
      "blocked_invalid_input",
      rawStorageFailure ? "raw_payload_blocked" : "invalid_input",
      failureCodes,
    );
  }
  return { passed: true, status: "source_ref_created", failure_kind: null, failure_codes: [] };
}

export async function runBoundedSourceIntakeRuntimeV01(
  input: unknown,
  options?: {
    fetcher?: BoundedSourceFetcherV01;
    allow_live_fetch?: boolean;
  },
): Promise<BoundedSourceIntakeRuntimeResultV01> {
  const validation = validateBoundedSourceIntakeRuntimeRequestV01(input);
  if (!validation.passed || !isRecord(input) || !isBoundedSourceInputKindV01(input.input_kind)) {
    return blockedResult(input, validation);
  }

  const request = input as unknown as BoundedSourceIntakeRuntimeRequestV01;
  const sanitized = sanitizeSourceLocatorV01({
    input_kind: request.input_kind,
    source_locator: request.source_locator,
  });
  if (sanitized.status !== "ok") {
    return blockedResult(
      request,
      validationFailure(
        sanitized.status,
        sanitized.status === "blocked_private_or_raw_payload"
          ? "private_identifier_detected"
          : "invalid_input",
        sanitized.failure_codes,
      ),
    );
  }

  const sourceRefId = createBoundedSourceRefIdV01(request);
  const baseReasonCodes = uniqueSorted([
    "bounded_source_intake_runtime_completion",
    "explicit_user_provided_source_only",
    "raw_body_non_persistent_by_default",
    "source_ref_metadata_now",
    "source_refs_are_lineage_not_proof",
    "bounded_source_summary_not_truth",
    "product_write_denied",
    ...(request.reason_codes ?? []),
  ]);

  if (request.input_kind === "manual_text_summary") {
    return successResult(request, {
      status: "accepted_bounded_summary",
      sourceRefId,
      sourceLocatorRef: sanitized.source_locator_ref!,
      sourceLocatorDisplay: sanitized.source_locator_display!,
      boundedSummary: boundedSummary(request.bounded_summary!),
      fetchReport: {
        fetch_executed: false,
        reason_codes: ["manual_text_summary_no_fetch"],
      },
      sourceMetadata: {
        source_locator_display: sanitized.source_locator_display,
        source_locator_fingerprint: sanitized.source_locator_fingerprint,
      },
      reasonCodes: [...baseReasonCodes, "accepted_bounded_summary", "source_ref_created"],
    });
  }

  if (request.input_kind === "file_ref" || request.input_kind === "note_ref") {
    return successResult(request, {
      status: "candidate_only",
      sourceRefId,
      sourceLocatorRef: sanitized.source_locator_ref!,
      sourceLocatorDisplay: sanitized.source_locator_display!,
      boundedSummary: null,
      fetchReport: {
        fetch_executed: false,
        local_file_read_executed: false,
        symbolic_ref_only: true,
        reason_codes: [`${request.input_kind}_symbolic_only`],
      },
      sourceMetadata: {
        source_locator_display: sanitized.source_locator_display,
        source_locator_fingerprint: sanitized.source_locator_fingerprint,
        symbolic_ref_only: true,
      },
      reasonCodes: [
        ...baseReasonCodes,
        "source_ref_created",
        "symbolic_ref_only",
        "failure_to_gap_candidate_metadata_now",
      ],
    });
  }

  const fetchResponse = await fetchBoundedSourceV01(
    {
      input_kind: request.input_kind,
      source_locator: request.source_locator,
      source_locator_ref: sanitized.source_locator_ref!,
      source_ref_id: sourceRefId,
      limits: normalizeLimits(request),
    },
    {
      fetcher: options?.fetcher,
      allow_live_fetch: options?.allow_live_fetch === true && request.fetch_policy?.allow_live_fetch === true,
    },
  );

  if (fetchResponse.status !== "ok") {
    const failureKind = fetchResponse.failure_kind ?? fetchResponse.status;
    return failureToGapResult(request, {
      sourceRefId,
      sourceLocatorRef: sanitized.source_locator_ref!,
      sourceLocatorDisplay: sanitized.source_locator_display!,
      sourceMetadata: {
        source_locator_display: sanitized.source_locator_display,
        source_locator_fingerprint: sanitized.source_locator_fingerprint,
        content_type: fetchResponse.content_type ?? null,
        byte_length: fetchResponse.byte_length ?? null,
      },
      fetchReport: {
        status: fetchResponse.status,
        http_status: fetchResponse.http_status ?? null,
        content_type: fetchResponse.content_type ?? null,
        byte_length: fetchResponse.byte_length ?? null,
        elapsed_ms: fetchResponse.elapsed_ms ?? null,
        failure_kind: failureKind,
        reason_codes: fetchResponse.reason_codes,
      },
      failureKind,
      reasonCodes: [
        ...baseReasonCodes,
        "failure_to_gap_candidate_metadata_now",
        ...fetchResponse.reason_codes,
      ],
    });
  }

  const safeFetchSummary = isSafePublicText(fetchResponse.bounded_summary, manualSummaryLimit)
    ? boundedSummary(fetchResponse.bounded_summary!)
    : null;
  if (!safeFetchSummary) {
    return failureToGapResult(request, {
      sourceRefId,
      sourceLocatorRef: sanitized.source_locator_ref!,
      sourceLocatorDisplay: sanitized.source_locator_display!,
      sourceMetadata: {
        source_locator_display: sanitized.source_locator_display,
        source_locator_fingerprint: sanitized.source_locator_fingerprint,
        content_type: fetchResponse.content_type ?? null,
        byte_length: fetchResponse.byte_length ?? null,
      },
      fetchReport: {
        status: "fetch_failed",
        content_type: fetchResponse.content_type ?? null,
        byte_length: fetchResponse.byte_length ?? null,
        elapsed_ms: fetchResponse.elapsed_ms ?? null,
        failure_kind: "fetch_failed",
        reason_codes: ["bounded_summary_missing_or_unsafe"],
      },
      failureKind: "fetch_failed",
      reasonCodes: [...baseReasonCodes, "bounded_summary_missing_or_unsafe"],
    });
  }

  return successResult(request, {
    status: "accepted_bounded_summary",
    sourceRefId,
    sourceLocatorRef: sanitized.source_locator_ref!,
    sourceLocatorDisplay: sanitized.source_locator_display!,
    boundedSummary: safeFetchSummary,
    sourceMetadata: {
      source_locator_display: sanitized.source_locator_display,
      source_locator_fingerprint: sanitized.source_locator_fingerprint,
      source_title: safeOptionalText(fetchResponse.source_title, 160),
      content_type: fetchResponse.content_type ?? null,
      byte_length: fetchResponse.byte_length ?? null,
    },
    fetchReport: {
      status: "ok",
      http_status: fetchResponse.http_status ?? null,
      content_type: fetchResponse.content_type ?? null,
      byte_length: fetchResponse.byte_length ?? null,
      elapsed_ms: fetchResponse.elapsed_ms ?? null,
      reason_codes: fetchResponse.reason_codes,
    },
    reasonCodes: [
      ...baseReasonCodes,
      "bounded_fetch_completed",
      "accepted_bounded_summary",
      "source_ref_created",
    ],
  });
}

export function buildBoundedSourceRefMetadataV01(
  result: BoundedSourceIntakeRuntimeResultV01,
): Record<string, unknown> {
  return {
    source_ref_id: result.source_ref_id,
    source_locator_ref: result.source_locator_ref,
    input_kind: result.input_kind,
    source_label: result.source_label,
    status: result.status,
    failure_kind: result.failure_kind,
    raw_body_stored: false,
    source_ref_is_proof: false,
    source_summary_is_truth: false,
    source_metadata: result.source_metadata,
  };
}

export function createBoundedSourceRefIdV01(input: unknown): string {
  if (!isRecord(input) || !isBoundedSourceInputKindV01(input.input_kind)) {
    return "source-ref:bounded-intake:invalid";
  }
  const fingerprint = createPublicSafeSourceLocatorFingerprintV01({
    input_kind: input.input_kind,
    source_locator: input.source_locator,
  });
  return `source-ref:bounded-intake:${fingerprint.slice(0, 32)}`;
}

export function classifyBoundedSourceIntakeFailureV01(
  errorOrResult: unknown,
): BoundedSourceIntakeFailureKindV01 | null {
  if (isRecord(errorOrResult) && typeof errorOrResult.failure_kind === "string") {
    const value = errorOrResult.failure_kind;
    if (isFailureKind(value)) return value;
  }
  if (errorOrResult instanceof Error) {
    if (/timeout/i.test(errorOrResult.message)) return "timeout";
    return "fetch_failed";
  }
  return null;
}

function successResult(
  request: BoundedSourceIntakeRuntimeRequestV01,
  values: {
    status: "source_ref_created" | "accepted_bounded_summary" | "candidate_only";
    sourceRefId: string;
    sourceLocatorRef: string;
    sourceLocatorDisplay: string;
    boundedSummary: string | null;
    sourceMetadata: Record<string, unknown>;
    fetchReport: Record<string, unknown>;
    reasonCodes: string[];
  },
): BoundedSourceIntakeRuntimeResultV01 {
  return {
    result_version: BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_RESULT_VERSION_V01,
    runtime_version: BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_VERSION_V01,
    scope,
    status: values.status,
    input_kind: request.input_kind,
    source_ref_id: values.sourceRefId,
    source_locator_ref: values.sourceLocatorRef,
    source_label: safeOptionalText(request.source_label, 160),
    bounded_summary: values.boundedSummary,
    source_metadata: {
      input_kind: request.input_kind,
      source_locator_ref: values.sourceLocatorRef,
      source_locator_display: values.sourceLocatorDisplay,
      user_provided: true,
      ...values.sourceMetadata,
    },
    fetch_report: values.fetchReport,
    privacy_report: {
      status: "passed",
      raw_body_stored: false,
      raw_private_payload_persisted: false,
      public_safe_summary_only: true,
    },
    redaction_report: {
      status: "not_needed",
      source_locator_display: values.sourceLocatorDisplay,
      raw_unsafe_value_echoed: false,
    },
    gap_candidate_ref: null,
    failure_kind: null,
    raw_body_stored: false,
    provider_extraction_started: false,
    retrieval_indexed: false,
    proof_or_evidence_created: false,
    product_write_executed: false,
    authority_boundary: createBoundedSourceIntakeRuntimeAuthorityBoundaryV01(),
    reason_codes: uniqueSorted(values.reasonCodes),
  };
}

function failureToGapResult(
  request: BoundedSourceIntakeRuntimeRequestV01,
  values: {
    sourceRefId: string;
    sourceLocatorRef: string;
    sourceLocatorDisplay: string;
    sourceMetadata: Record<string, unknown>;
    fetchReport: Record<string, unknown>;
    failureKind: BoundedSourceIntakeFailureKindV01;
    reasonCodes: string[];
  },
): BoundedSourceIntakeRuntimeResultV01 {
  return {
    result_version: BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_RESULT_VERSION_V01,
    runtime_version: BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_VERSION_V01,
    scope,
    status: "candidate_only",
    input_kind: request.input_kind,
    source_ref_id: values.sourceRefId,
    source_locator_ref: values.sourceLocatorRef,
    source_label: safeOptionalText(request.source_label, 160),
    bounded_summary: null,
    source_metadata: {
      input_kind: request.input_kind,
      source_locator_ref: values.sourceLocatorRef,
      source_locator_display: values.sourceLocatorDisplay,
      user_provided: true,
      ...values.sourceMetadata,
    },
    fetch_report: values.fetchReport,
    privacy_report: {
      status: "passed",
      raw_body_stored: false,
      raw_private_payload_persisted: false,
      public_safe_summary_only: true,
    },
    redaction_report: {
      status: "not_needed",
      source_locator_display: values.sourceLocatorDisplay,
      raw_unsafe_value_echoed: false,
    },
    gap_candidate_ref: `gap-candidate:${values.sourceRefId}`,
    failure_kind: values.failureKind,
    raw_body_stored: false,
    provider_extraction_started: false,
    retrieval_indexed: false,
    proof_or_evidence_created: false,
    product_write_executed: false,
    authority_boundary: createBoundedSourceIntakeRuntimeAuthorityBoundaryV01(),
    reason_codes: uniqueSorted([
      ...values.reasonCodes,
      "failed_fetch_creates_gap_metadata_not_summary",
    ]),
  };
}

function blockedResult(
  input: unknown,
  validation: BoundedSourceIntakeRuntimeValidationResultV01,
): BoundedSourceIntakeRuntimeResultV01 {
  return {
    result_version: BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_RESULT_VERSION_V01,
    runtime_version: BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_VERSION_V01,
    scope,
    status: validation.status,
    input_kind: isRecord(input) && isBoundedSourceInputKindV01(input.input_kind)
      ? input.input_kind
      : null,
    source_ref_id: null,
    source_locator_ref: null,
    source_label: null,
    bounded_summary: null,
    source_metadata: {},
    fetch_report: {
      fetch_executed: false,
      failure_kind: validation.failure_kind,
    },
    privacy_report: {
      status: validation.status,
      raw_body_stored: false,
      raw_private_payload_persisted: false,
    },
    redaction_report: {
      status: validation.status,
      raw_unsafe_value_echoed: false,
    },
    gap_candidate_ref: null,
    failure_kind: validation.failure_kind,
    raw_body_stored: false,
    provider_extraction_started: false,
    retrieval_indexed: false,
    proof_or_evidence_created: false,
    product_write_executed: false,
    authority_boundary: createBoundedSourceIntakeRuntimeAuthorityBoundaryV01(),
    reason_codes: uniqueSorted([
      "bounded_source_intake_runtime_completion",
      "request_validation_failed",
      ...validation.failure_codes,
    ]),
  };
}

function validateLimits(input: Record<string, unknown>): string[] {
  const failureCodes: string[] = [];
  if (
    input.size_limit_bytes !== undefined &&
    (!Number.isInteger(input.size_limit_bytes) ||
      (input.size_limit_bytes as number) <= 0 ||
      (input.size_limit_bytes as number) > maxSizeLimitBytes)
  ) {
    failureCodes.push("size_limit_bytes_invalid");
  }
  if (
    input.timeout_ms !== undefined &&
    (!Number.isInteger(input.timeout_ms) ||
      (input.timeout_ms as number) <= 0 ||
      (input.timeout_ms as number) > maxTimeoutMs)
  ) {
    failureCodes.push("timeout_ms_invalid");
  }
  if (input.content_type_allowlist !== undefined) {
    if (
      !Array.isArray(input.content_type_allowlist) ||
      input.content_type_allowlist.length === 0 ||
      input.content_type_allowlist.some(
        (item) =>
          typeof item !== "string" ||
          !defaultContentTypeAllowlist.includes(
            item as (typeof defaultContentTypeAllowlist)[number],
          ),
      )
    ) {
      failureCodes.push("content_type_allowlist_invalid");
    }
  }
  return failureCodes;
}

function validateFetchPolicy(value: unknown): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return ["fetch_policy_invalid"];
  const failureCodes: string[] = [];
  const mode = value.mode;
  if (mode !== undefined && mode !== "mock" && mode !== "bounded_fetch" && mode !== "no_fetch") {
    failureCodes.push("fetch_policy_mode_invalid");
  }
  for (const forbiddenKey of [
    "automatic_follow_up_crawling",
    "background_fetch",
    "automatic_web_discovery",
    "provider_extraction",
    "retrieval_index_write",
  ]) {
    if (value[forbiddenKey] !== undefined && value[forbiddenKey] !== false) {
      failureCodes.push(`${forbiddenKey}_forbidden`);
    }
  }
  return failureCodes;
}

function normalizeLimits(input: BoundedSourceIntakeRuntimeRequestV01) {
  return {
    size_limit_bytes: input.size_limit_bytes ?? defaultSizeLimitBytes,
    timeout_ms: input.timeout_ms ?? defaultTimeoutMs,
    content_type_allowlist:
      input.content_type_allowlist && input.content_type_allowlist.length > 0
        ? input.content_type_allowlist
        : [...defaultContentTypeAllowlist],
  };
}

function validateRecursiveAuthority(value: unknown, path = "input"): string[] {
  const failures: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      failures.push(...validateRecursiveAuthority(item, `${path}[${index}]`));
    });
    return failures;
  }
  if (!isRecord(value)) return failures;

  for (const [key, nested] of Object.entries(value)) {
    if (hasForbiddenAuthorityGrant(key, nested)) {
      failures.push(`forbidden_authority:${path}.${key}`);
    }
    failures.push(...validateRecursiveAuthority(nested, `${path}.${key}`));
  }
  return uniqueSorted(failures);
}

function hasForbiddenAuthorityGrant(key: string, value: unknown): boolean {
  const isForbidden =
    forbiddenAuthorityFieldSet.has(key) || authorityLikePatterns.some((pattern) => pattern.test(key));
  return isForbidden && !isFalseLikeAuthorityValue(value);
}

function isFalseLikeAuthorityValue(value: unknown): boolean {
  return value === false || value === null || value === undefined;
}

function isFailureKind(value: string): value is BoundedSourceIntakeFailureKindV01 {
  return (
    value === "fetch_failed" ||
    value === "unsupported_content_type" ||
    value === "content_too_large" ||
    value === "copyright_boundary_blocked" ||
    value === "private_identifier_detected" ||
    value === "source_unavailable" ||
    value === "invalid_input" ||
    value === "forbidden_authority" ||
    value === "raw_payload_blocked" ||
    value === "timeout"
  );
}

function validationFailure(
  status: BoundedSourceIntakeRuntimeCompletionStatusV01,
  failureKind: BoundedSourceIntakeFailureKindV01,
  failureCodes: string[],
): BoundedSourceIntakeRuntimeValidationResultV01 {
  return {
    passed: false,
    status,
    failure_kind: failureKind,
    failure_codes: uniqueSorted(failureCodes),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSafeIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-z][a-z0-9._:-]{2,160}$/i.test(value) &&
    !containsUnsafeSourceLocatorTextV01(value)
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function isSafePublicText(value: unknown, maxLength = 500): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength &&
    !containsUnsafeSourceLocatorTextV01(value)
  );
}

function isSafeReasonCodes(value: unknown): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.length <= 30 &&
      value.every((item) => typeof item === "string" && /^[a-z0-9_:-]{2,120}$/i.test(item)))
  );
}

function safeOptionalText(value: unknown, maxLength: number): string | null {
  return isSafePublicText(value, maxLength) ? value : null;
}

function boundedSummary(value: string): string {
  return value.trim().slice(0, manualSummaryLimit);
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

export function createBoundedSourceIntakeRuntimeResultFingerprintV01(
  result: BoundedSourceIntakeRuntimeResultV01,
): string {
  return createHash("sha256").update(JSON.stringify(result)).digest("hex");
}
