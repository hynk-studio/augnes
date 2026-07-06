import {
  PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_PREVIEW_CONTRACT_VERSION,
  PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_SCOPE,
  type ProviderSpecificExternalDeliveryDecisionStatus,
  type ProviderSpecificExternalDeliveryOperatorDecisionPreview,
  type ProviderSpecificExternalDeliveryOperatorDecisionPreviewInput,
  type ProviderSpecificExternalDeliveryPreviewContract,
  type ProviderSpecificExternalDeliveryRecommendedDecision,
} from "@/types/provider-specific-external-delivery-preview-contract";
import {
  createProviderSpecificExternalDeliveryAuthorityBoundaryV01,
  fingerprintProviderSpecificExternalDeliveryValueV01,
} from "@/lib/workplane/provider-specific-external-delivery-preview-contract";

type RecordValue = Record<string, unknown>;

const DEFAULT_AS_OF = "1970-01-01T00:00:00.000Z" as const;

export function buildProviderSpecificExternalDeliveryOperatorDecisionPreviewV01(
  input: ProviderSpecificExternalDeliveryOperatorDecisionPreviewInput = {},
): ProviderSpecificExternalDeliveryOperatorDecisionPreview {
  const preview = isProviderSpecificPreview(
    input.provider_specific_external_delivery_preview_contract,
  )
    ? input.provider_specific_external_delivery_preview_contract
    : null;
  const requestedOperatorRef = safeRef(input.requested_operator_ref);
  const requestedIdempotencyKey = safeRef(input.requested_idempotency_key);
  const reviewConfirmationRef = safeRef(input.review_confirmation_ref);
  const missingEvidence = [
    ...(!preview
      ? ["provider_specific_external_delivery_preview_contract_missing"]
      : []),
    ...(!requestedOperatorRef ? ["requested_operator_ref_missing"] : []),
    ...(!requestedIdempotencyKey ? ["requested_idempotency_key_missing"] : []),
    ...(!reviewConfirmationRef ? ["review_confirmation_ref_missing"] : []),
  ];
  const previewBlockers =
    preview && preview.status !== "ready_for_provider_specific_decision"
      ? [
          `provider_specific_external_delivery_preview_not_ready:${preview.status}`,
        ]
      : [];
  const intentBlockers =
    input.operator_decision_intent &&
    input.operator_decision_intent !==
      "record_provider_specific_preview_contract_candidate" &&
    input.operator_decision_intent !== "keep_preview_only"
      ? [`operator_decision_intent_rejected:${input.operator_decision_intent}`]
      : [];
  const blockerReasons = [...previewBlockers, ...intentBlockers];
  const readyForReview =
    Boolean(preview) &&
    preview?.status === "ready_for_provider_specific_decision" &&
    requestedOperatorRef &&
    requestedIdempotencyKey &&
    reviewConfirmationRef &&
    blockerReasons.length === 0;
  const recommended = recommendedDecision({
    preview,
    blockerReasons,
    missingEvidence,
  });
  const decisionStatus: ProviderSpecificExternalDeliveryDecisionStatus =
    readyForReview
      ? "ready_for_provider_specific_preview_decision"
      : blockerReasons.length
        ? "blocked"
        : "insufficient_data";
  const decisionBase = {
    decision_preview_version:
      PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_SCOPE,
    as_of: input.as_of ?? preview?.as_of ?? DEFAULT_AS_OF,
    decision_status: decisionStatus,
    recommended_operator_decision: recommended,
    source_provider_specific_preview_fingerprint:
      preview?.preview_fingerprint ?? null,
    requested_operator_ref: requestedOperatorRef,
    requested_idempotency_key: requestedIdempotencyKey,
    review_confirmation_ref: reviewConfirmationRef,
    current_blockers: blockerReasons,
    current_missing_evidence: missingEvidence,
  };
  return {
    decision_preview_version:
      PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION,
    decision_preview_fingerprint:
      fingerprintProviderSpecificExternalDeliveryValueV01(decisionBase),
    scope: PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_SCOPE,
    as_of: decisionBase.as_of,
    decision_status: decisionBase.decision_status,
    recommended_operator_decision: recommended,
    decision_reasons: readyForReview
      ? ["provider_specific_preview_contract_ready_for_operator_review"]
      : ["provider_specific_preview_contract_not_ready_for_operator_review"],
    blocker_reasons: blockerReasons,
    warning_reasons: preview?.warning_reasons ?? [],
    source_provider_specific_preview_fingerprint:
      preview?.preview_fingerprint ?? null,
    requested_operator_ref: requestedOperatorRef,
    requested_idempotency_key: requestedIdempotencyKey,
    review_confirmation_ref: reviewConfirmationRef,
    next_step_readiness: {
      ready_for_operator_review: Boolean(readyForReview),
      current_blockers: blockerReasons,
      current_missing_evidence: missingEvidence,
    },
    authority_boundary:
      createProviderSpecificExternalDeliveryAuthorityBoundaryV01(),
    would_not_do: [
      "does_not_write_provider_specific_records",
      "does_not_create_delivery_intent",
      "does_not_perform_external_delivery",
      "does_not_call_provider_email_slack_webhook_github_codex_provider_runtime_browser_crawler_or_network",
      "does_not_read_provider_secrets_environment_or_live_provider_state",
      "does_not_write_clipboard_download_or_file",
    ],
  };
}

function recommendedDecision({
  preview,
  blockerReasons,
  missingEvidence,
}: {
  preview: ProviderSpecificExternalDeliveryPreviewContract | null;
  blockerReasons: string[];
  missingEvidence: string[];
}): ProviderSpecificExternalDeliveryRecommendedDecision {
  if (
    preview?.status === "residual_gate_blocked" ||
    preview?.status === "authority_boundary_blocked" ||
    blockerReasons.some((reason) => /residual|authority/.test(reason))
  ) {
    return "resolve_residual_or_authority_blockers_first";
  }
  if (preview?.status === "provider_profile_missing") {
    return "wait_for_provider_profile";
  }
  if (preview?.status === "recipient_missing") {
    return "wait_for_recipient";
  }
  if (preview?.status === "ready_for_provider_specific_decision") {
    return "record_provider_specific_preview_contract_candidate";
  }
  if (missingEvidence.length > 0 || !preview) {
    return "keep_preview_only";
  }
  return "do_not_prepare_provider_delivery";
}

function isProviderSpecificPreview(
  value: unknown,
): value is ProviderSpecificExternalDeliveryPreviewContract {
  return Boolean(
    isRecord(value) &&
      value.preview_version ===
        PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_PREVIEW_CONTRACT_VERSION &&
      value.scope === PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_SCOPE,
  );
}

function safeRef(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    !/[<>{}\n\r\t]/.test(value) &&
    !/raw_text|raw_report|raw_excerpt|raw_email_body|raw_message|raw_payload|secret|token|password|api[_-]?key|bearer|private|https?:\/\//i.test(
      value,
    )
    ? value
    : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
