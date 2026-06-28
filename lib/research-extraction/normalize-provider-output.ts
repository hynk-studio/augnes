import { createHash } from "node:crypto";

import {
  canonicalProviderRuntimeJsonV01,
  isProviderCandidateFamilyV01,
  isProviderConfidenceLabelV01,
  isSafeProviderRuntimePublicTextV01,
  PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01,
  safeBoundedProviderTextV01,
  type ProviderCandidateFamilyV01,
  type ProviderConfidenceLabelV01,
  type ProviderExtractionScopeV01,
  uniqueSortedProviderRuntimeValuesV01,
} from "./provider-boundary";

export interface ProviderExtractionOutputItemV01 {
  candidate_family?: unknown;
  bounded_claim_summary?: unknown;
  bounded_support_summary?: unknown;
  quote_refs?: unknown;
  confidence_label?: unknown;
  warnings?: unknown;
  reason_codes?: unknown;
}

export interface ProviderExtractionAdapterOutputV01 {
  status: string;
  provider_request_ref?: string;
  provider_response_ref?: string;
  provider_latency_ms?: number;
  output_items?: ProviderExtractionOutputItemV01[];
  warnings?: string[];
  reason_codes?: string[];
}

export interface ProviderExtractionNormalizationContextV01 {
  scope: ProviderExtractionScopeV01;
  extraction_request_id: string;
  source_ref_id: string;
  source_locator_ref: string | null;
  candidate_family_allowlist: ProviderCandidateFamilyV01[];
  max_candidates: number;
  max_output_chars: number;
}

export interface NormalizedProviderCandidateV01 {
  candidate_ref: string;
  candidate_family: ProviderCandidateFamilyV01;
  bounded_claim_summary: string;
  bounded_support_summary: string;
  source_ref_id: string;
  source_locator_ref: string | null;
  bounded_quote_refs: string[];
  confidence_label: ProviderConfidenceLabelV01;
  confidence_is_truth: false;
  provider_output_is_truth: false;
  provider_output_is_proof: false;
  candidate_is_fact: false;
  candidate_is_accepted_evidence: false;
  needs_operator_review: true;
  warnings: string[];
  reason_codes: string[];
}

export interface NormalizedProviderCandidateBundleV01 {
  bundle_version: "provider_assisted_extraction_candidate_bundle.v0.1";
  runtime_version: typeof PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01;
  scope: ProviderExtractionScopeV01;
  extraction_request_id: string;
  source_ref_id: string;
  source_locator_ref: string | null;
  candidate_refs: string[];
  candidates: NormalizedProviderCandidateV01[];
  warnings: string[];
  reason_codes: string[];
  provider_output_is_truth: false;
  provider_output_is_proof: false;
  provider_output_is_accepted_evidence: false;
  provider_confidence_is_truth: false;
  provider_confidence_is_promotion_readiness: false;
  candidate_is_fact: false;
  candidate_is_proof: false;
  candidate_is_accepted_evidence: false;
}

export interface ProviderCandidateBundleValidationResultV01 {
  passed: boolean;
  failure_codes: string[];
}

export function normalizeProviderExtractionOutputV01(
  providerOutput: ProviderExtractionAdapterOutputV01,
  context: ProviderExtractionNormalizationContextV01,
): NormalizedProviderCandidateBundleV01 {
  const outputItems = Array.isArray(providerOutput.output_items)
    ? providerOutput.output_items
    : [];
  const candidates: NormalizedProviderCandidateV01[] = [];
  let remainingChars = Math.max(0, context.max_output_chars);

  for (const item of outputItems) {
    if (candidates.length >= context.max_candidates || remainingChars <= 0) break;
    const family = normalizeCandidateFamily(item.candidate_family, context.candidate_family_allowlist);
    if (!family || family === "unknown") continue;

    const claimSummary =
      safeBoundedProviderTextV01(item.bounded_claim_summary, Math.min(800, remainingChars)) ??
      "Provider returned a bounded candidate that needs operator review.";
    remainingChars -= claimSummary.length;
    const supportSummary =
      safeBoundedProviderTextV01(item.bounded_support_summary, Math.min(800, remainingChars)) ??
      "Support summary remains bounded and candidate-only.";
    remainingChars -= supportSummary.length;

    const confidenceLabel = isProviderConfidenceLabelV01(item.confidence_label)
      ? item.confidence_label
      : "unknown";
    const warnings = uniqueSortedProviderRuntimeValuesV01([
      ...normalizeStringArray(providerOutput.warnings, 120),
      ...normalizeStringArray(item.warnings, 120),
      ...(confidenceLabel === "low" || confidenceLabel === "unknown"
        ? ["low_grounding_warning"]
        : []),
    ]);
    const reasonCodes = uniqueSortedProviderRuntimeValuesV01([
      "normalized_candidate_bundle_now",
      "candidate_only_output_now",
      "provider_output_not_truth",
      "provider_output_not_proof",
      "provider_confidence_not_promotion_readiness",
      ...normalizeStringArray(providerOutput.reason_codes, 120),
      ...normalizeStringArray(item.reason_codes, 120),
    ]);
    const candidateRef = createCandidateRef(context, family, candidates.length, {
      claimSummary,
      supportSummary,
      confidenceLabel,
    });

    candidates.push({
      candidate_ref: candidateRef,
      candidate_family: family,
      bounded_claim_summary: claimSummary,
      bounded_support_summary: supportSummary,
      source_ref_id: context.source_ref_id,
      source_locator_ref: context.source_locator_ref,
      bounded_quote_refs: normalizeQuoteRefs(item.quote_refs),
      confidence_label: confidenceLabel,
      confidence_is_truth: false,
      provider_output_is_truth: false,
      provider_output_is_proof: false,
      candidate_is_fact: false,
      candidate_is_accepted_evidence: false,
      needs_operator_review: true,
      warnings,
      reason_codes: reasonCodes,
    });
  }

  const bundleWarnings = uniqueSortedProviderRuntimeValuesV01([
    ...normalizeStringArray(providerOutput.warnings, 120),
    ...(candidates.some((candidate) => candidate.warnings.includes("low_grounding_warning"))
      ? ["low_grounding_warning"]
      : []),
    ...(candidates.length === 0 ? ["unsupported_extraction"] : []),
  ]);
  const bundleReasonCodes = uniqueSortedProviderRuntimeValuesV01([
    "normalized_candidate_bundle_now",
    "candidate_only_output_now",
    "source_ref_required",
    "bounded_source_excerpt_required",
    "provider_output_not_truth",
    "provider_output_not_proof",
    "provider_confidence_not_promotion_readiness",
    ...normalizeStringArray(providerOutput.reason_codes, 120),
  ]);

  return {
    bundle_version: "provider_assisted_extraction_candidate_bundle.v0.1",
    runtime_version: PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01,
    scope: context.scope,
    extraction_request_id: context.extraction_request_id,
    source_ref_id: context.source_ref_id,
    source_locator_ref: context.source_locator_ref,
    candidate_refs: candidates.map((candidate) => candidate.candidate_ref).sort(),
    candidates,
    warnings: bundleWarnings,
    reason_codes: bundleReasonCodes,
    provider_output_is_truth: false,
    provider_output_is_proof: false,
    provider_output_is_accepted_evidence: false,
    provider_confidence_is_truth: false,
    provider_confidence_is_promotion_readiness: false,
    candidate_is_fact: false,
    candidate_is_proof: false,
    candidate_is_accepted_evidence: false,
  };
}

export function validateNormalizedProviderCandidateBundleV01(
  bundle: unknown,
): ProviderCandidateBundleValidationResultV01 {
  const failureCodes: string[] = [];
  if (!isRecord(bundle)) {
    return { passed: false, failure_codes: ["bundle_not_object"] };
  }
  if (bundle.bundle_version !== "provider_assisted_extraction_candidate_bundle.v0.1") {
    failureCodes.push("wrong_bundle_version");
  }
  if (bundle.runtime_version !== PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01) {
    failureCodes.push("wrong_runtime_version");
  }
  if (bundle.scope !== "project:augnes") failureCodes.push("wrong_scope");
  if (!isSafeProviderRuntimePublicTextV01(bundle.extraction_request_id, 240)) {
    failureCodes.push("extraction_request_id_invalid");
  }
  if (!isSafeProviderRuntimePublicTextV01(bundle.source_ref_id, 240)) {
    failureCodes.push("source_ref_id_invalid");
  }
  if (!Array.isArray(bundle.candidates)) failureCodes.push("candidates_not_array");
  if (!Array.isArray(bundle.candidate_refs)) failureCodes.push("candidate_refs_not_array");
  for (const field of [
    "provider_output_is_truth",
    "provider_output_is_proof",
    "provider_output_is_accepted_evidence",
    "provider_confidence_is_truth",
    "provider_confidence_is_promotion_readiness",
    "candidate_is_fact",
    "candidate_is_proof",
    "candidate_is_accepted_evidence",
  ]) {
    if (bundle[field] !== false) failureCodes.push(`${field}_must_be_false`);
  }

  const candidateRefs = new Set<string>();
  const candidates = Array.isArray(bundle.candidates) ? bundle.candidates : [];
  for (const candidate of candidates) {
    if (!isRecord(candidate)) {
      failureCodes.push("candidate_not_object");
      continue;
    }
    if (!isSafeProviderRuntimePublicTextV01(candidate.candidate_ref, 240)) {
      failureCodes.push("candidate_ref_invalid");
    } else if (candidateRefs.has(candidate.candidate_ref)) {
      failureCodes.push("duplicate_candidate_ref");
    } else {
      candidateRefs.add(candidate.candidate_ref);
    }
    if (!isProviderCandidateFamilyV01(candidate.candidate_family)) {
      failureCodes.push("candidate_family_invalid");
    }
    if (!isSafeProviderRuntimePublicTextV01(candidate.bounded_claim_summary, 800)) {
      failureCodes.push("bounded_claim_summary_invalid");
    }
    if (!isSafeProviderRuntimePublicTextV01(candidate.bounded_support_summary, 800)) {
      failureCodes.push("bounded_support_summary_invalid");
    }
    if (candidate.source_ref_id !== bundle.source_ref_id) {
      failureCodes.push("candidate_source_ref_mismatch");
    }
    if (!isProviderConfidenceLabelV01(candidate.confidence_label)) {
      failureCodes.push("confidence_label_invalid");
    }
    for (const field of [
      "confidence_is_truth",
      "provider_output_is_truth",
      "provider_output_is_proof",
      "candidate_is_fact",
      "candidate_is_accepted_evidence",
    ]) {
      if (candidate[field] !== false) failureCodes.push(`candidate_${field}_must_be_false`);
    }
    if (candidate.needs_operator_review !== true) {
      failureCodes.push("candidate_needs_operator_review_required");
    }
  }

  const listedRefs = Array.isArray(bundle.candidate_refs) ? bundle.candidate_refs : [];
  for (const ref of listedRefs) {
    if (!candidateRefs.has(ref)) failureCodes.push("candidate_ref_without_candidate");
  }
  for (const ref of candidateRefs) {
    if (!listedRefs.includes(ref)) failureCodes.push("candidate_missing_from_candidate_refs");
  }

  return {
    passed: failureCodes.length === 0,
    failure_codes: Array.from(new Set(failureCodes)).sort(),
  };
}

export function createProviderCandidateBundleFingerprintV01(
  bundle: NormalizedProviderCandidateBundleV01,
): string {
  return createHash("sha256").update(canonicalProviderRuntimeJsonV01(bundle)).digest("hex");
}

function normalizeCandidateFamily(
  value: unknown,
  allowlist: ProviderCandidateFamilyV01[],
): ProviderCandidateFamilyV01 | null {
  if (!isProviderCandidateFamilyV01(value)) return null;
  if (!allowlist.includes(value)) return null;
  return value;
}

function normalizeQuoteRefs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueSortedProviderRuntimeValuesV01(
    value.filter(
      (item): item is string =>
        typeof item === "string" &&
        /^quote-ref:[a-z0-9][a-z0-9._:-]{1,180}$/i.test(item) &&
        isSafeProviderRuntimePublicTextV01(item, 200),
    ),
  ).slice(0, 5);
}

function normalizeStringArray(value: unknown, maxChars: number): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueSortedProviderRuntimeValuesV01(
    value.filter(
      (item): item is string =>
        typeof item === "string" && isSafeProviderRuntimePublicTextV01(item, maxChars),
    ),
  );
}

function createCandidateRef(
  context: ProviderExtractionNormalizationContextV01,
  family: ProviderCandidateFamilyV01,
  index: number,
  values: {
    claimSummary: string;
    supportSummary: string;
    confidenceLabel: ProviderConfidenceLabelV01;
  },
): string {
  const digest = createHash("sha256")
    .update(canonicalProviderRuntimeJsonV01({ context, family, index, values }))
    .digest("hex")
    .slice(0, 20);
  return `provider-candidate-ref:${family}:${digest}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
