import {
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
  EXTERNAL_HANDOFF_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION,
  type ExternalHandoffDeliveryContractPreview,
  type ExternalHandoffDeliveryOperatorDecisionPreview,
  type ExternalHandoffDeliveryOperatorDecisionPreviewInput,
  type ExternalHandoffDeliveryOperatorDecisionStatus,
  type ExternalHandoffDeliveryRecommendedDecision,
} from "@/types/external-handoff-delivery-contract";
import {
  createExternalHandoffDeliveryContractAuthorityBoundaryV01,
  fingerprintExternalHandoffDeliveryValueV01,
} from "@/lib/workplane/external-handoff-delivery-contract-preview";

type RecordValue = Record<string, unknown>;

const DEFAULT_AS_OF = "1970-01-01T00:00:00.000Z" as const;

export function buildExternalHandoffDeliveryOperatorDecisionPreviewV01(
  input: ExternalHandoffDeliveryOperatorDecisionPreviewInput = {},
): ExternalHandoffDeliveryOperatorDecisionPreview {
  const preview = isExternalPreview(input.external_handoff_delivery_contract_preview)
    ? input.external_handoff_delivery_contract_preview
    : null;
  const requestedOperatorRef = safeRef(input.requested_operator_ref);
  const requestedIdempotencyKey = safeRef(input.requested_idempotency_key);
  const reviewConfirmationRef = safeRef(input.review_confirmation_ref);
  const missingEvidence = [
    ...(!preview ? ["external_handoff_delivery_contract_preview_missing"] : []),
    ...(!requestedOperatorRef ? ["requested_operator_ref_missing"] : []),
    ...(!requestedIdempotencyKey ? ["requested_idempotency_key_missing"] : []),
    ...(!reviewConfirmationRef ? ["review_confirmation_ref_missing"] : []),
  ];
  const previewBlockers =
    preview && preview.status !== "ready_for_contract_decision"
      ? [`external_handoff_delivery_contract_preview_not_ready:${preview.status}`]
      : [];
  const intentBlockers =
    input.operator_decision_intent &&
    input.operator_decision_intent !== "record_external_delivery_contract_candidate"
      ? [`operator_decision_intent_not_record:${input.operator_decision_intent}`]
      : [];
  const intentMissing =
    input.operator_decision_intent === "record_external_delivery_contract_candidate"
      ? []
      : ["operator_decision_intent_missing_or_not_record"];
  const blockerReasons = [...previewBlockers, ...intentBlockers];
  const allMissing = [...missingEvidence, ...intentMissing];
  const writeReady =
    Boolean(preview) &&
    preview?.status === "ready_for_contract_decision" &&
    input.operator_decision_intent ===
      "record_external_delivery_contract_candidate" &&
    requestedOperatorRef &&
    requestedIdempotencyKey &&
    reviewConfirmationRef &&
    blockerReasons.length === 0;
  const recommended = recommendedDecision({ preview, blockerReasons, missingEvidence });
  const decisionStatus: ExternalHandoffDeliveryOperatorDecisionStatus = writeReady
    ? "ready_for_external_delivery_contract_record_write"
    : blockerReasons.length
      ? "blocked"
      : "insufficient_data";
  const decisionBase = {
    decision_preview_version:
      EXTERNAL_HANDOFF_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
    as_of: input.as_of ?? preview?.as_of ?? DEFAULT_AS_OF,
    decision_status: decisionStatus,
    recommended_operator_decision: recommended,
    source_preview_fingerprint: preview?.preview_fingerprint ?? null,
    requested_operator_ref: requestedOperatorRef,
    requested_idempotency_key: requestedIdempotencyKey,
    review_confirmation_ref: reviewConfirmationRef,
    current_blockers: blockerReasons,
    current_missing_evidence: allMissing,
  };
  return {
    decision_preview_version:
      EXTERNAL_HANDOFF_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION,
    decision_preview_fingerprint:
      fingerprintExternalHandoffDeliveryValueV01(decisionBase),
    scope: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
    as_of: decisionBase.as_of,
    decision_status: decisionBase.decision_status,
    recommended_operator_decision: recommended,
    decision_reasons: writeReady
      ? ["external_delivery_contract_candidate_record_write_ready"]
      : ["external_delivery_contract_candidate_not_write_ready"],
    blocker_reasons: blockerReasons,
    warning_reasons: preview?.warning_reasons ?? [],
    source_preview_fingerprint: preview?.preview_fingerprint ?? null,
    requested_operator_ref: requestedOperatorRef,
    requested_idempotency_key: requestedIdempotencyKey,
    review_confirmation_ref: reviewConfirmationRef,
    write_readiness: {
      write_ready: Boolean(writeReady),
      current_blockers: blockerReasons,
      current_missing_evidence: allMissing,
    },
    would_write_external_handoff_delivery_contract_decision_preview: {
      external_handoff_delivery_contract_preview: preview,
      requested_operator_ref: requestedOperatorRef,
      requested_idempotency_key: requestedIdempotencyKey,
      review_confirmation_ref: reviewConfirmationRef,
    },
    authority_boundary:
      createExternalHandoffDeliveryContractAuthorityBoundaryV01(),
    would_not_do: [
      "does_not_write_records_from_preview",
      "does_not_perform_external_delivery",
      "does_not_call_provider_email_slack_webhook_github_codex_openai_browser_crawler_or_network",
      "does_not_write_clipboard_download_or_file",
      "does_not_mutate_cwp_handoff_relay_memory_metrics_or_global_state",
    ],
  };
}

function recommendedDecision({
  preview,
  blockerReasons,
  missingEvidence,
}: {
  preview: ExternalHandoffDeliveryContractPreview | null;
  blockerReasons: string[];
  missingEvidence: string[];
}): ExternalHandoffDeliveryRecommendedDecision {
  if (
    preview?.status === "residual_gate_blocked" ||
    blockerReasons.some((reason) => reason.includes("residual"))
  ) {
    return "resolve_residual_blockers_first";
  }
  if (preview?.status === "ready_for_contract_decision") {
    return "record_external_delivery_contract_candidate";
  }
  if (missingEvidence.length > 0 || !preview) {
    return "wait_for_missing_prerequisites";
  }
  return "do_not_record_external_delivery_contract";
}

function isExternalPreview(
  value: unknown,
): value is ExternalHandoffDeliveryContractPreview {
  return Boolean(
    isRecord(value) &&
      value.preview_version === "external_handoff_delivery_contract_preview.v0.1" &&
      value.scope === EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
  );
}

function safeRef(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    !/[<>{}\n\r\t]/.test(value) &&
    !/raw_text|raw_report|raw_excerpt|secret|token|password|private/i.test(value)
    ? value
    : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
