import {
  PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_OPERATOR_DECISION_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
  type ProviderSpecificDeliveryIntentContractPreview,
  type ProviderSpecificDeliveryIntentDecisionStatus,
  type ProviderSpecificDeliveryIntentOperatorDecisionPreview,
  type ProviderSpecificDeliveryIntentOperatorDecisionPreviewInput,
  type ProviderSpecificDeliveryIntentRecommendedDecision,
} from "@/types/provider-specific-delivery-intent-contract";
import {
  createProviderSpecificDeliveryIntentAuthorityBoundaryV01,
  fingerprintProviderSpecificDeliveryIntentValueV01,
} from "@/lib/workplane/provider-specific-delivery-intent-contract-preview";

type RecordValue = Record<string, unknown>;

const DEFAULT_AS_OF = "1970-01-01T00:00:00.000Z" as const;

export function buildProviderSpecificDeliveryIntentOperatorDecisionPreviewV01(
  input: ProviderSpecificDeliveryIntentOperatorDecisionPreviewInput = {},
): ProviderSpecificDeliveryIntentOperatorDecisionPreview {
  const preview = isIntentPreview(
    input.provider_specific_delivery_intent_contract_preview,
  )
    ? input.provider_specific_delivery_intent_contract_preview
    : null;
  const requestedOperatorRef = safeRef(input.requested_operator_ref);
  const requestedIdempotencyKey = safeRef(input.requested_idempotency_key);
  const reviewConfirmationRef = safeRef(input.review_confirmation_ref);
  const missingEvidence = [
    ...(!preview ? ["provider_specific_delivery_intent_preview_missing"] : []),
    ...(!requestedOperatorRef ? ["requested_operator_ref_missing"] : []),
    ...(!requestedIdempotencyKey ? ["requested_idempotency_key_missing"] : []),
    ...(!reviewConfirmationRef ? ["review_confirmation_ref_missing"] : []),
  ];
  const previewBlockers =
    preview && preview.status !== "ready_for_intent_decision"
      ? [`provider_specific_delivery_intent_preview_not_ready:${preview.status}`]
      : [];
  const intentBlockers =
    input.operator_decision_intent &&
    input.operator_decision_intent !==
      "record_provider_specific_delivery_intent_contract_candidate" &&
    input.operator_decision_intent !== "keep_preview_only"
      ? [`operator_decision_intent_rejected:${input.operator_decision_intent}`]
      : [];
  const approvalIntentMissing =
    input.operator_decision_intent !==
    "record_provider_specific_delivery_intent_contract_candidate";
  const blockerReasons = uniqueStrings([
    ...previewBlockers,
    ...intentBlockers,
    ...(approvalIntentMissing
      ? ["operator_decision_intent_missing_or_not_record_intent"]
      : []),
  ]);
  const writeReady =
    Boolean(preview) &&
    preview?.status === "ready_for_intent_decision" &&
    Boolean(preview?.would_write_provider_specific_delivery_intent_contract_record_preview) &&
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
  const decisionStatus: ProviderSpecificDeliveryIntentDecisionStatus = writeReady
    ? "ready_for_provider_specific_delivery_intent_contract_record_write"
    : blockerReasons.length
      ? "blocked"
      : missingEvidence.length
        ? "insufficient_data"
        : "keep_preview_only";
  const decisionBase = {
    decision_preview_version:
      PROVIDER_SPECIFIC_DELIVERY_INTENT_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
    as_of: input.as_of ?? preview?.as_of ?? DEFAULT_AS_OF,
    decision_status: decisionStatus,
    recommended_operator_decision: recommended,
    source_intent_contract_preview_fingerprint:
      preview?.preview_fingerprint ?? null,
    requested_operator_ref: requestedOperatorRef,
    requested_idempotency_key: requestedIdempotencyKey,
    review_confirmation_ref: reviewConfirmationRef,
    current_blockers: blockerReasons,
    current_missing_evidence: missingEvidence,
  };
  return {
    decision_preview_version:
      PROVIDER_SPECIFIC_DELIVERY_INTENT_OPERATOR_DECISION_PREVIEW_VERSION,
    decision_preview_fingerprint:
      fingerprintProviderSpecificDeliveryIntentValueV01(decisionBase),
    scope: PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
    as_of: decisionBase.as_of,
    decision_status: decisionStatus,
    recommended_operator_decision: recommended,
    decision_reasons: writeReady
      ? ["provider_specific_delivery_intent_ready_for_scoped_record_write"]
      : ["provider_specific_delivery_intent_not_ready_for_scoped_record_write"],
    blocker_reasons: blockerReasons,
    warning_reasons: preview?.warning_reasons ?? [],
    source_intent_contract_preview_fingerprint:
      preview?.preview_fingerprint ?? null,
    requested_operator_ref: requestedOperatorRef,
    requested_idempotency_key: requestedIdempotencyKey,
    review_confirmation_ref: reviewConfirmationRef,
    write_readiness: {
      write_ready: writeReady,
      current_blockers: blockerReasons,
      current_missing_evidence: missingEvidence,
    },
    would_write_provider_specific_delivery_intent_decision_preview: {
      provider_specific_delivery_intent_contract_preview: preview,
      requested_operator_ref: requestedOperatorRef,
      requested_idempotency_key: requestedIdempotencyKey,
      review_confirmation_ref: reviewConfirmationRef,
    },
    authority_boundary:
      createProviderSpecificDeliveryIntentAuthorityBoundaryV01(),
    would_not_do: [
      "does_not_perform_external_delivery",
      "does_not_authorize_provider_execution",
      "does_not_call_provider_email_slack_webhook_github_codex_provider_runtime_browser_crawler_or_network",
      "does_not_read_or_store_provider_credentials",
      "does_not_write_clipboard_download_or_file",
    ],
  };
}

function recommendedDecision({
  preview,
  blockerReasons,
  missingEvidence,
}: {
  preview: ProviderSpecificDeliveryIntentContractPreview | null;
  blockerReasons: string[];
  missingEvidence: string[];
}): ProviderSpecificDeliveryIntentRecommendedDecision {
  if (!preview || missingEvidence.length > 0) {
    return "wait_for_provider_specific_preview";
  }
  if (
    preview.status === "residual_gate_blocked" ||
    preview.status === "authority_boundary_blocked" ||
    preview.status === "unsafe_ref_blocked" ||
    blockerReasons.length > 0
  ) {
    return "resolve_provider_specific_blockers_first";
  }
  if (preview.status === "ready_for_intent_decision") {
    return "record_provider_specific_delivery_intent_contract_candidate";
  }
  if (preview.status === "provider_specific_preview_missing") {
    return "wait_for_provider_specific_preview";
  }
  return "do_not_prepare_provider_delivery";
}

function isIntentPreview(
  value: unknown,
): value is ProviderSpecificDeliveryIntentContractPreview {
  return Boolean(
    isRecord(value) &&
      value.preview_version ===
        PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_PREVIEW_VERSION &&
      value.scope === PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
  );
}

function safeRef(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    !/[<>{}\n\r\t]/.test(value) &&
    !/raw_text|raw_report|raw_excerpt|raw_email_body|raw_message|raw_payload|raw_provider_payload|secret|token|password|api[_-]?key|bearer|private|https?:\/\//i.test(
      value,
    )
    ? value
    : null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
