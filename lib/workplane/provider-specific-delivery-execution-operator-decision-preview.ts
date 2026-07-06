import {
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_OPERATOR_DECISION_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE,
  type ProviderSpecificDeliveryExecutionDecisionStatus,
  type ProviderSpecificDeliveryExecutionOperatorDecisionPreview,
  type ProviderSpecificDeliveryExecutionOperatorDecisionPreviewInput,
  type ProviderSpecificDeliveryExecutionRecommendedDecision,
  type ProviderSpecificDeliveryExecutionContractPreview,
} from "@/types/provider-specific-delivery-execution-contract-preview";
import {
  createProviderSpecificDeliveryExecutionAuthorityBoundaryV01,
  fingerprintProviderSpecificDeliveryExecutionValueV01,
} from "@/lib/workplane/provider-specific-delivery-execution-contract-preview";

type RecordValue = Record<string, unknown>;

const DEFAULT_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const unsafeRefPattern =
  /raw_text|raw_report|raw_excerpt|raw_email_body|raw_message|raw_payload|raw_provider_payload|secret|token|password|api[_-]?key|bearer|private|credential|webhook\s*url|https?:\/\/|env:|process\.env|\.env/i;

export function buildProviderSpecificDeliveryExecutionOperatorDecisionPreviewV01(
  input: ProviderSpecificDeliveryExecutionOperatorDecisionPreviewInput = {},
): ProviderSpecificDeliveryExecutionOperatorDecisionPreview {
  const preview = isExecutionPreview(
    input.provider_specific_delivery_execution_contract_preview,
  )
    ? input.provider_specific_delivery_execution_contract_preview
    : null;
  const requestedOperatorRef = safeRef(input.requested_operator_ref);
  const requestedIdempotencyKey = safeRef(input.requested_idempotency_key);
  const reviewConfirmationRef = safeRef(input.review_confirmation_ref);
  const missingEvidence = uniqueStrings([
    ...(!preview ? ["execution_contract_preview_missing"] : []),
    ...(!requestedOperatorRef ? ["requested_operator_ref_missing_or_unsafe"] : []),
    ...(!requestedIdempotencyKey
      ? ["requested_idempotency_key_missing_or_unsafe"]
      : []),
    ...(!reviewConfirmationRef
      ? ["review_confirmation_ref_missing_or_unsafe"]
      : []),
  ]);
  const previewBlockers =
    preview && preview.status !== "ready_for_execution_contract_decision"
      ? [`execution_contract_preview_not_ready:${preview.status}`]
      : [];
  const intentBlockers =
    input.operator_decision_intent &&
    input.operator_decision_intent !==
      "prepare_future_execution_contract_record_slice" &&
    input.operator_decision_intent !== "keep_execution_preview_only"
      ? [`operator_decision_intent_rejected:${input.operator_decision_intent}`]
      : [];
  const blockerReasons = uniqueStrings([...previewBlockers, ...intentBlockers]);
  const readyForReview =
    Boolean(preview) &&
    preview?.status === "ready_for_execution_contract_decision" &&
    Boolean(requestedOperatorRef) &&
    Boolean(requestedIdempotencyKey) &&
    Boolean(reviewConfirmationRef) &&
    blockerReasons.length === 0 &&
    missingEvidence.length === 0;
  const recommended = recommendedDecision({
    preview,
    blockerReasons,
    missingEvidence,
  });
  const decisionStatus = decisionStatusFor({
    preview,
    readyForReview,
    blockerReasons,
    missingEvidence,
  });
  const decisionBase = {
    decision_preview_version:
      PROVIDER_SPECIFIC_DELIVERY_EXECUTION_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE,
    as_of: input.as_of ?? preview?.as_of ?? DEFAULT_AS_OF,
    decision_status: decisionStatus,
    recommended_operator_decision: recommended,
    source_execution_contract_preview_fingerprint:
      preview?.preview_fingerprint ?? null,
    requested_operator_ref: requestedOperatorRef,
    requested_idempotency_key: requestedIdempotencyKey,
    review_confirmation_ref: reviewConfirmationRef,
    current_blockers: blockerReasons,
    current_missing_evidence: missingEvidence,
  };
  return {
    decision_preview_version:
      PROVIDER_SPECIFIC_DELIVERY_EXECUTION_OPERATOR_DECISION_PREVIEW_VERSION,
    decision_preview_fingerprint:
      fingerprintProviderSpecificDeliveryExecutionValueV01(decisionBase),
    scope: PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE,
    as_of: decisionBase.as_of,
    decision_status: decisionStatus,
    recommended_operator_decision: recommended,
    decision_reasons: readyForReview
      ? ["provider_specific_delivery_execution_preview_ready_for_design_review"]
      : ["provider_specific_delivery_execution_preview_not_ready_for_design_review"],
    blocker_reasons: blockerReasons,
    warning_reasons: preview?.warning_reasons ?? [],
    source_execution_contract_preview_fingerprint:
      preview?.preview_fingerprint ?? null,
    requested_operator_ref: requestedOperatorRef,
    requested_idempotency_key: requestedIdempotencyKey,
    review_confirmation_ref: reviewConfirmationRef,
    next_step_readiness: {
      ready_for_operator_review: readyForReview,
      current_blockers: blockerReasons,
      current_missing_evidence: missingEvidence,
    },
    authority_boundary:
      createProviderSpecificDeliveryExecutionAuthorityBoundaryV01(),
    would_not_do: [
      "does_not_execute_delivery",
      "does_not_create_execution_record",
      "does_not_call_provider_email_slack_webhook_github_codex_openai_browser_crawler_or_network",
      "does_not_read_environment_or_provider_secrets",
      "does_not_write_clipboard_download_or_file",
      "does_not_mutate_delivery_spine_or_provider_intent_state",
    ],
  };
}

function decisionStatusFor({
  preview,
  readyForReview,
  blockerReasons,
  missingEvidence,
}: {
  preview: ProviderSpecificDeliveryExecutionContractPreview | null;
  readyForReview: boolean;
  blockerReasons: string[];
  missingEvidence: string[];
}): ProviderSpecificDeliveryExecutionDecisionStatus {
  if (!preview) return "execution_preview_missing";
  if (readyForReview) return "ready_for_execution_contract_design_review";
  if (preview.status !== "ready_for_execution_contract_decision") {
    return "execution_preview_not_ready";
  }
  if (missingEvidence.includes("review_confirmation_ref_missing_or_unsafe")) {
    return "review_confirmation_missing";
  }
  if (missingEvidence.length > 0) return "operator_evidence_missing";
  if (blockerReasons.length > 0) return "blocked";
  return "insufficient_data";
}

function recommendedDecision({
  preview,
  blockerReasons,
  missingEvidence,
}: {
  preview: ProviderSpecificDeliveryExecutionContractPreview | null;
  blockerReasons: string[];
  missingEvidence: string[];
}): ProviderSpecificDeliveryExecutionRecommendedDecision {
  if (!preview) return "wait_for_provider_specific_intent_record";
  if (
    preview.status === "provider_specific_intent_missing" ||
    preview.status === "provider_specific_intent_invalid"
  ) {
    return "wait_for_provider_specific_intent_record";
  }
  if (
    preview.status === "delivery_spine_missing" ||
    preview.status === "delivery_spine_not_ready" ||
    preview.status === "lineage_gate_blocked" ||
    preview.status === "residual_gate_blocked" ||
    preview.status === "authority_boundary_blocked" ||
    preview.status === "execution_boundary_blocked" ||
    blockerReasons.length > 0
  ) {
    return "resolve_delivery_spine_blockers_first";
  }
  if (
    preview.status === "provider_config_missing" ||
    preview.status === "provider_config_ref_unsafe" ||
    preview.provider_config_gate_summary.problem_reasons.length > 0
  ) {
    return "resolve_provider_config_refs_first";
  }
  if (preview.status === "ready_for_execution_contract_decision") {
    return missingEvidence.length > 0
      ? "keep_execution_preview_only"
      : "prepare_future_execution_contract_record_slice";
  }
  return "do_not_prepare_execution";
}

function isExecutionPreview(
  value: unknown,
): value is ProviderSpecificDeliveryExecutionContractPreview {
  return Boolean(
    isRecord(value) &&
      value.preview_version ===
        PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_PREVIEW_VERSION &&
      value.scope === PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE,
  );
}

function safeRef(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    !/[<>{}\n\r\t]/.test(value) &&
    !unsafeRefPattern.test(value)
    ? value
    : null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
