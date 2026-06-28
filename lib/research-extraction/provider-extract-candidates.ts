import { createHash } from "node:crypto";

import {
  normalizeProviderExtractionOutputV01,
  type NormalizedProviderCandidateBundleV01,
  type ProviderExtractionAdapterOutputV01,
  validateNormalizedProviderCandidateBundleV01,
} from "./normalize-provider-output";
import {
  canonicalProviderRuntimeJsonV01,
  classifyProviderAssistedExtractionFailureV01,
  createProviderAssistedExtractionRuntimeAuthorityBoundaryV01,
  isProviderExtractionRequestV01,
  PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_RESULT_VERSION_V01,
  PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01,
  redactProviderRuntimeRefV01,
  safeBoundedProviderTextV01,
  type ProviderAssistedExtractionRuntimeAuthorityBoundaryV01,
  type ProviderAssistedExtractionRuntimeRequestV01,
  type ProviderCandidateFamilyV01,
  type ProviderExtractionModeV01,
  type ProviderExtractionScopeV01,
  type ProviderExtractionStatusV01,
  uniqueSortedProviderRuntimeValuesV01,
  validateProviderAssistedExtractionRuntimeRequestV01,
} from "./provider-boundary";

export interface ProviderExtractionAdapterRequestV01 {
  provider_ref: string;
  model_or_tool_ref: string;
  source_ref_id: string;
  bounded_source_excerpt: string;
  bounded_prompt_descriptor: string;
  extraction_goal: string;
  candidate_family_allowlist: ProviderCandidateFamilyV01[];
  max_candidates: number;
  max_output_chars: number;
}

export type ProviderExtractionAdapterV01 = (
  request: ProviderExtractionAdapterRequestV01,
) => Promise<ProviderExtractionAdapterOutputV01> | ProviderExtractionAdapterOutputV01;

export interface ProviderAssistedExtractionRuntimeResultV01 {
  result_version: typeof PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_RESULT_VERSION_V01;
  runtime_version: typeof PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01;
  scope: ProviderExtractionScopeV01;
  status: ProviderExtractionStatusV01;
  extraction_request_id: string | null;
  provider_mode: ProviderExtractionModeV01 | null;
  provider_ref: string | null;
  model_or_tool_ref: string | null;
  source_ref_id: string | null;
  source_locator_ref: string | null;
  provider_request_ref: string | null;
  provider_response_ref: string | null;
  normalized_candidate_bundle: NormalizedProviderCandidateBundleV01 | null;
  candidate_refs: string[];
  warnings: string[];
  provider_report: Record<string, unknown>;
  privacy_report: Record<string, unknown>;
  redaction_report: Record<string, unknown>;
  raw_source_body_stored: false;
  raw_provider_output_stored: false;
  hidden_reasoning_stored: false;
  provider_call_executed: boolean;
  retrieval_indexed: false;
  proof_or_evidence_created: false;
  promotion_executed: false;
  product_write_executed: false;
  authority_boundary: ProviderAssistedExtractionRuntimeAuthorityBoundaryV01;
  reason_codes: string[];
}

const scope: ProviderExtractionScopeV01 = "project:augnes";

export async function runProviderAssistedExtractionRuntimeV01(
  input: unknown,
  options?: {
    providerAdapter?: ProviderExtractionAdapterV01;
  },
): Promise<ProviderAssistedExtractionRuntimeResultV01> {
  const validation = validateProviderAssistedExtractionRuntimeRequestV01(input);
  if (!validation.passed || !isProviderExtractionRequestV01(input)) {
    return blockedResult(input, {
      status: validation.status,
      failureKind: validation.failure_kind ?? classifyProviderAssistedExtractionFailureV01(validation),
      failureCodes: validation.failure_codes,
    });
  }

  const request = input;
  const baseReasonCodes = uniqueSortedProviderRuntimeValuesV01([
    "provider_assisted_extraction_runtime_completion",
    "original_phase_3_4_provider_runtime_gap_closed",
    "explicit_operator_provider_action_only",
    "same_origin_post_route_now",
    "source_ref_required",
    "bounded_source_excerpt_required",
    "raw_source_body_non_persistent_by_default",
    "raw_provider_output_non_persistent_by_default",
    "candidate_only_output_now",
    "provider_output_not_truth",
    "provider_output_not_proof",
    "provider_confidence_not_promotion_readiness",
    "product_write_denied",
    ...(request.reason_codes ?? []),
  ]);

  if (request.provider_mode === "configured_provider" && !options?.providerAdapter) {
    return providerUnavailableResult(request, {
      status: "provider_missing_key",
      providerRequestRef: null,
      providerResponseRef: null,
      warningCodes: ["provider_missing_key", "configured_provider_missing_key_refusal_now"],
      reasonCodes: [
        ...baseReasonCodes,
        "provider_missing_key",
        "provider_unavailable",
        "configured_provider_missing_key_refusal_now",
        "live_provider_validation_skipped_missing_key",
      ],
      boundary: createProviderAssistedExtractionRuntimeAuthorityBoundaryV01({
        configured_provider_missing_key_refusal_now: true,
      }),
    });
  }

  if (!options?.providerAdapter) {
    return providerUnavailableResult(request, {
      status: "provider_unavailable",
      providerRequestRef: null,
      providerResponseRef: null,
      warningCodes: ["provider_adapter_missing"],
      reasonCodes: [...baseReasonCodes, "provider_adapter_missing", "provider_unavailable"],
      boundary: createProviderAssistedExtractionRuntimeAuthorityBoundaryV01(),
    });
  }

  const adapterRequest = createAdapterRequest(request);
  const providerOutput = await options.providerAdapter(adapterRequest);
  const providerRequestRef =
    safeBoundedProviderTextV01(providerOutput.provider_request_ref, 160) ??
    createProviderRuntimeRef("provider-request-ref", request, adapterRequest);
  const providerResponseRef =
    safeBoundedProviderTextV01(providerOutput.provider_response_ref, 160) ??
    createProviderRuntimeRef("provider-response-ref", request, providerOutput);
  const providerWarnings = normalizeStringArray(providerOutput.warnings, 120);
  const providerReasonCodes = normalizeStringArray(providerOutput.reason_codes, 120);

  if (providerOutput.status === "provider_missing_key") {
    return providerUnavailableResult(request, {
      status: "provider_missing_key",
      providerRequestRef,
      providerResponseRef,
      warningCodes: uniqueSortedProviderRuntimeValuesV01([
        ...providerWarnings,
        "provider_missing_key",
      ]),
      reasonCodes: [
        ...baseReasonCodes,
        ...providerReasonCodes,
        "provider_missing_key",
        "provider_unavailable",
      ],
      boundary: createProviderAssistedExtractionRuntimeAuthorityBoundaryV01({
        provider_adapter_invocation_now: true,
        configured_provider_missing_key_refusal_now: true,
      }),
    });
  }

  if (providerOutput.status === "provider_unavailable" || providerOutput.status === "provider_refused") {
    return providerUnavailableResult(request, {
      status: providerOutput.status,
      providerRequestRef,
      providerResponseRef,
      warningCodes: uniqueSortedProviderRuntimeValuesV01([
        ...providerWarnings,
        providerOutput.status,
      ]),
      reasonCodes: [...baseReasonCodes, ...providerReasonCodes, providerOutput.status],
      boundary: createBoundaryForAdapterInvocation(request.provider_mode),
    });
  }

  if (providerOutput.status === "unsupported_extraction") {
    return providerUnavailableResult(request, {
      status: "unsupported_extraction",
      providerRequestRef,
      providerResponseRef,
      warningCodes: uniqueSortedProviderRuntimeValuesV01([
        ...providerWarnings,
        "unsupported_extraction",
      ]),
      reasonCodes: [...baseReasonCodes, ...providerReasonCodes, "unsupported_extraction"],
      boundary: createBoundaryForAdapterInvocation(request.provider_mode),
    });
  }

  const bundle = normalizeProviderExtractionOutputV01(providerOutput, {
    scope,
    extraction_request_id: request.extraction_request_id,
    source_ref_id: request.source_ref_id,
    source_locator_ref: request.source_locator_ref ?? null,
    candidate_family_allowlist: request.candidate_family_allowlist,
    max_candidates: request.max_candidates,
    max_output_chars: request.max_output_chars,
  });
  const bundleValidation = validateNormalizedProviderCandidateBundleV01(bundle);
  if (!bundleValidation.passed || bundle.candidates.length === 0) {
    return providerUnavailableResult(request, {
      status: "unsupported_extraction",
      providerRequestRef,
      providerResponseRef,
      warningCodes: uniqueSortedProviderRuntimeValuesV01([
        ...providerWarnings,
        "unsupported_extraction",
      ]),
      reasonCodes: [
        ...baseReasonCodes,
        ...providerReasonCodes,
        ...bundleValidation.failure_codes,
        "unsupported_extraction",
      ],
      boundary: createBoundaryForAdapterInvocation(request.provider_mode),
    });
  }

  const warnings = uniqueSortedProviderRuntimeValuesV01([
    ...providerWarnings,
    ...bundle.warnings,
  ]);
  return {
    result_version: PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_RESULT_VERSION_V01,
    runtime_version: PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01,
    scope,
    status: "candidate_bundle_created",
    extraction_request_id: request.extraction_request_id,
    provider_mode: request.provider_mode,
    provider_ref: redactProviderRuntimeRefV01(request.provider_ref),
    model_or_tool_ref: redactProviderRuntimeRefV01(request.model_or_tool_ref),
    source_ref_id: request.source_ref_id,
    source_locator_ref: request.source_locator_ref ?? null,
    provider_request_ref: providerRequestRef,
    provider_response_ref: providerResponseRef,
    normalized_candidate_bundle: bundle,
    candidate_refs: bundle.candidate_refs,
    warnings,
    provider_report: {
      provider_mode: request.provider_mode,
      provider_adapter_invoked: true,
      provider_latency_ms:
        typeof providerOutput.provider_latency_ms === "number"
          ? providerOutput.provider_latency_ms
          : null,
      provider_request_ref: providerRequestRef,
      provider_response_ref: providerResponseRef,
      raw_prompt_stored: false,
      raw_provider_output_stored: false,
      hidden_reasoning_stored: false,
      provider_thread_run_session_id_canonicalized: false,
    },
    privacy_report: privacyReport(),
    redaction_report: redactionReport(),
    raw_source_body_stored: false,
    raw_provider_output_stored: false,
    hidden_reasoning_stored: false,
    provider_call_executed: true,
    retrieval_indexed: false,
    proof_or_evidence_created: false,
    promotion_executed: false,
    product_write_executed: false,
    authority_boundary: createBoundaryForAdapterInvocation(request.provider_mode),
    reason_codes: uniqueSortedProviderRuntimeValuesV01([
      ...baseReasonCodes,
      ...providerReasonCodes,
      ...bundle.reason_codes,
      "provider_adapter_invoked",
      "candidate_bundle_created",
      "normalized_candidate_bundle_now",
    ]),
  };
}

export function createMockProviderExtractionAdapterV01(
  fixtures: ProviderExtractionAdapterOutputV01[],
): ProviderExtractionAdapterV01 {
  return (request) => {
    const fixture = fixtures[0];
    if (!fixture) {
      return {
        status: "provider_unavailable",
        provider_request_ref: createAdapterRef("provider-request-ref", request),
        provider_response_ref: createAdapterRef("provider-response-ref", request),
        provider_latency_ms: 0,
        output_items: [],
        warnings: ["mock_provider_fixture_missing"],
        reason_codes: ["provider_unavailable", "mock_provider_fixture_missing"],
      };
    }
    return {
      status: fixture.status,
      provider_request_ref:
        fixture.provider_request_ref ?? createAdapterRef("provider-request-ref", request),
      provider_response_ref:
        fixture.provider_response_ref ?? createAdapterRef("provider-response-ref", fixture),
      provider_latency_ms:
        typeof fixture.provider_latency_ms === "number" ? fixture.provider_latency_ms : 1,
      output_items: (fixture.output_items ?? []).slice(0, request.max_candidates),
      warnings: fixture.warnings ?? [],
      reason_codes: fixture.reason_codes ?? ["mock_provider_adapter_now"],
    };
  };
}

export function createMissingKeyProviderExtractionAdapterV01(): ProviderExtractionAdapterV01 {
  return (request) => ({
    status: "provider_missing_key",
    provider_request_ref: createAdapterRef("provider-request-ref", request),
    provider_response_ref: createAdapterRef("provider-response-ref", request),
    provider_latency_ms: 0,
    output_items: [],
    warnings: ["provider_missing_key"],
    reason_codes: ["provider_missing_key", "configured_provider_missing_key_refusal_now"],
  });
}

export function createProviderExtractionRequestFingerprintV01(input: unknown): string {
  return createHash("sha256").update(canonicalProviderRuntimeJsonV01(input)).digest("hex");
}

function createAdapterRequest(
  request: ProviderAssistedExtractionRuntimeRequestV01,
): ProviderExtractionAdapterRequestV01 {
  const boundedSourceExcerpt =
    request.bounded_source_excerpt ??
    request.bounded_source_summary ??
    "Bounded source summary unavailable; extraction should remain cautious.";
  return {
    provider_ref: redactProviderRuntimeRefV01(request.provider_ref),
    model_or_tool_ref: redactProviderRuntimeRefV01(request.model_or_tool_ref),
    source_ref_id: request.source_ref_id,
    bounded_source_excerpt: boundedSourceExcerpt.slice(0, request.max_source_excerpt_chars),
    bounded_prompt_descriptor: createBoundedPromptDescriptor(request),
    extraction_goal: request.extraction_goal,
    candidate_family_allowlist: request.candidate_family_allowlist,
    max_candidates: request.max_candidates,
    max_output_chars: request.max_output_chars,
  };
}

function createBoundedPromptDescriptor(request: ProviderAssistedExtractionRuntimeRequestV01): string {
  return [
    `goal:${request.extraction_goal.slice(0, 360)}`,
    `families:${request.candidate_family_allowlist.join(",")}`,
    "candidate_only:true",
    "reasoning_trace_storage:false",
    "raw_provider_output_storage_policy:non_persistent",
  ].join("\n");
}

function providerUnavailableResult(
  request: ProviderAssistedExtractionRuntimeRequestV01,
  values: {
    status: "provider_unavailable" | "provider_missing_key" | "provider_refused" | "unsupported_extraction";
    providerRequestRef: string | null;
    providerResponseRef: string | null;
    warningCodes: string[];
    reasonCodes: string[];
    boundary: ProviderAssistedExtractionRuntimeAuthorityBoundaryV01;
  },
): ProviderAssistedExtractionRuntimeResultV01 {
  return {
    result_version: PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_RESULT_VERSION_V01,
    runtime_version: PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01,
    scope,
    status: values.status,
    extraction_request_id: request.extraction_request_id,
    provider_mode: request.provider_mode,
    provider_ref: redactProviderRuntimeRefV01(request.provider_ref),
    model_or_tool_ref: redactProviderRuntimeRefV01(request.model_or_tool_ref),
    source_ref_id: request.source_ref_id,
    source_locator_ref: request.source_locator_ref ?? null,
    provider_request_ref: values.providerRequestRef,
    provider_response_ref: values.providerResponseRef,
    normalized_candidate_bundle: null,
    candidate_refs: [],
    warnings: uniqueSortedProviderRuntimeValuesV01(values.warningCodes),
    provider_report: {
      provider_mode: request.provider_mode,
      provider_adapter_invoked: values.boundary.provider_adapter_invocation_now,
      provider_unavailable: values.status !== "unsupported_extraction",
      missing_key_refusal: values.status === "provider_missing_key",
      unsupported_extraction: values.status === "unsupported_extraction",
      raw_prompt_stored: false,
      raw_provider_output_stored: false,
      hidden_reasoning_stored: false,
      provider_thread_run_session_id_canonicalized: false,
    },
    privacy_report: privacyReport(),
    redaction_report: redactionReport(),
    raw_source_body_stored: false,
    raw_provider_output_stored: false,
    hidden_reasoning_stored: false,
    provider_call_executed: values.boundary.provider_adapter_invocation_now,
    retrieval_indexed: false,
    proof_or_evidence_created: false,
    promotion_executed: false,
    product_write_executed: false,
    authority_boundary: values.boundary,
    reason_codes: uniqueSortedProviderRuntimeValuesV01(values.reasonCodes),
  };
}

function blockedResult(
  input: unknown,
  values: {
    status: ProviderExtractionStatusV01;
    failureKind: string | null;
    failureCodes: string[];
  },
): ProviderAssistedExtractionRuntimeResultV01 {
  const request = isRecord(input) ? input : {};
  return {
    result_version: PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_RESULT_VERSION_V01,
    runtime_version: PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01,
    scope,
    status: values.status,
    extraction_request_id: safeResultText(request.extraction_request_id),
    provider_mode:
      request.provider_mode === "mock_provider" || request.provider_mode === "configured_provider"
        ? request.provider_mode
        : null,
    provider_ref: safeResultText(request.provider_ref),
    model_or_tool_ref: safeResultText(request.model_or_tool_ref),
    source_ref_id: safeResultText(request.source_ref_id),
    source_locator_ref: safeResultText(request.source_locator_ref),
    provider_request_ref: null,
    provider_response_ref: null,
    normalized_candidate_bundle: null,
    candidate_refs: [],
    warnings: uniqueSortedProviderRuntimeValuesV01(values.failureCodes),
    provider_report: {
      provider_adapter_invoked: false,
      failure_kind: values.failureKind,
      raw_prompt_stored: false,
      raw_provider_output_stored: false,
      hidden_reasoning_stored: false,
      provider_thread_run_session_id_canonicalized: false,
    },
    privacy_report: privacyReport(values.status),
    redaction_report: redactionReport(),
    raw_source_body_stored: false,
    raw_provider_output_stored: false,
    hidden_reasoning_stored: false,
    provider_call_executed: false,
    retrieval_indexed: false,
    proof_or_evidence_created: false,
    promotion_executed: false,
    product_write_executed: false,
    authority_boundary: createProviderAssistedExtractionRuntimeAuthorityBoundaryV01(),
    reason_codes: uniqueSortedProviderRuntimeValuesV01([
      "provider_assisted_extraction_runtime_completion",
      values.status,
      ...(values.failureCodes ?? []),
    ]),
  };
}

function createBoundaryForAdapterInvocation(
  providerMode: ProviderExtractionModeV01,
): ProviderAssistedExtractionRuntimeAuthorityBoundaryV01 {
  return createProviderAssistedExtractionRuntimeAuthorityBoundaryV01({
    provider_adapter_invocation_now: true,
    mock_provider_adapter_now: providerMode === "mock_provider",
  });
}

function createProviderRuntimeRef(
  prefix: "provider-request-ref" | "provider-response-ref",
  request: ProviderAssistedExtractionRuntimeRequestV01,
  payload: unknown,
): string {
  return `${prefix}:${createProviderExtractionRequestFingerprintV01({
    extraction_request_id: request.extraction_request_id,
    payload,
  }).slice(0, 24)}`;
}

function createAdapterRef(prefix: "provider-request-ref" | "provider-response-ref", value: unknown): string {
  return `${prefix}:${createProviderExtractionRequestFingerprintV01(value).slice(0, 24)}`;
}

function privacyReport(status = "passed"): Record<string, unknown> {
  return {
    status,
    raw_source_body_stored: false,
    raw_provider_output_stored: false,
    hidden_reasoning_stored: false,
    chain_of_thought_stored: false,
    public_safe_summary_only: true,
  };
}

function redactionReport(): Record<string, unknown> {
  return {
    status: "not_needed",
    raw_unsafe_value_echoed: false,
    provider_thread_run_session_id_canonicalized: false,
  };
}

function normalizeStringArray(value: unknown, maxChars: number): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueSortedProviderRuntimeValuesV01(
    value.filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0 &&
        item.length <= maxChars &&
        safeBoundedProviderTextV01(item, maxChars) !== null,
    ),
  );
}

function safeResultText(value: unknown): string | null {
  return safeBoundedProviderTextV01(value, 240);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
