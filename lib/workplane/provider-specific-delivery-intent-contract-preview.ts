import { createHash } from "node:crypto";

import {
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_PREVIEW_VERSION,
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_REVIEW_VERSION,
  type ExternalHandoffDeliveryResidualGateSummary,
} from "@/types/external-handoff-delivery-contract";
import {
  PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_PREVIEW_CONTRACT_VERSION,
} from "@/types/provider-specific-external-delivery-preview-contract";
import type {
  ProviderSpecificExternalDeliveryOperatorDecisionPreview,
  ProviderSpecificExternalDeliveryPreviewContract,
  ProviderSpecificExternalDeliverySurface,
} from "@/types/provider-specific-external-delivery-preview-contract";
import {
  PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
  type ProviderSpecificDeliveryIntentAuthorityBoundary,
  type ProviderSpecificDeliveryIntentBoundary,
  type ProviderSpecificDeliveryIntentContractPreview,
  type ProviderSpecificDeliveryIntentContractRecordPreview,
  type ProviderSpecificDeliveryIntentInput,
  type ProviderSpecificDeliveryIntentPreviewStatus,
} from "@/types/provider-specific-delivery-intent-contract";

type RecordValue = Record<string, unknown>;

const DEFAULT_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const supportedSurfaces = new Set<ProviderSpecificExternalDeliverySurface>([
  "manual_operator_delivery",
  "email_delivery_preview",
  "slack_delivery_preview",
  "webhook_delivery_preview",
]);
const supportedPayloadFormats = new Set([
  "markdown_payload",
  "json_payload",
  "capsule_payload",
  "dual_markdown_and_json_payload",
  "operator_handoff_packet_markdown",
  "operator_handoff_packet_json",
  "handoff_packet_markdown",
  "handoff_packet_json",
]);
const unsafeRefPattern =
  /raw_text|raw_report|raw_excerpt|raw_email_body|raw_message|raw_payload|raw_provider_payload|secret|token|password|api[_-]?key|bearer|private|webhook\s*url|https?:\/\//i;
const forbiddenAuthorityTrueFields = [
  "source_of_truth",
  "can_write_db",
  "can_create_schema",
  "can_create_route",
  "can_call_route",
  "can_send_handoff",
  "can_call_send_provider",
  "can_call_external_messaging",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_call_browser_or_crawler",
  "can_call_network",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_mutate_handoff_context",
  "can_write_selected_refs_to_live_handoff",
  "can_write_external_handoff_delivery_contract_record",
  "can_write_provider_specific_preview_contract_record",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_write_dogfood_metrics",
  "can_update_global_dogfood_metrics",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
  "can_render_workbench_action_button",
] as const;
const hardResidualCategories = new Set([
  "authority_boundary_drift",
  "source_ref_lineage_mismatch",
  "local_fulfillment_upstream_gap",
  "no_side_effects_replay_inconsistency",
]);
const forbiddenResidualSignalFragments = [
  "provider_called",
  "external_message_sent",
  "network_called",
  "email_sent",
  "slack_sent",
  "webhook_called",
  "can_write_db",
  "can_send_handoff",
  "can_call_send_provider",
  "can_write_memory",
  "can_render_workbench_action_button",
  "token",
  "secret",
  "raw_payload",
  "raw_message",
  "raw_provider_payload",
  "private",
] as const;
const boundaryFields = [
  "delivery_performed",
  "provider_specific_delivery",
  "provider_delivery_intent_is_delivery",
  "provider_called",
  "external_message_sent",
  "email_sent",
  "slack_sent",
  "webhook_called",
  "network_called",
  "clipboard_written",
  "file_downloaded",
  "local_fulfillment_is_external_delivery",
  "provider_specific_preview_is_delivery",
] as const;

export function buildProviderSpecificDeliveryIntentContractPreviewV01(
  input: ProviderSpecificDeliveryIntentInput = {},
): ProviderSpecificDeliveryIntentContractPreview {
  const providerPreview = isProviderSpecificPreview(
    input.provider_specific_external_delivery_preview_contract,
  )
    ? input.provider_specific_external_delivery_preview_contract
    : null;
  const providerDecision = isProviderSpecificDecision(
    input.provider_specific_external_delivery_operator_decision_preview,
  )
    ? input.provider_specific_external_delivery_operator_decision_preview
    : null;
  const externalPreview = isExternalPreview(
    input.external_handoff_delivery_contract_preview,
  )
    ? input.external_handoff_delivery_contract_preview
    : null;
  const externalRecordReview = isExternalRecordReview(
    input.external_handoff_delivery_contract_record_review,
  )
    ? input.external_handoff_delivery_contract_record_review
    : null;
  const selectedExternalRecordSummary = recordField(
    externalRecordReview,
    "selected_record_summary",
  );
  const latestExternalRecordSummary = recordField(
    externalRecordReview,
    "latest_record_summary",
  );
  const externalRecordSummary =
    selectedExternalRecordSummary ?? latestExternalRecordSummary;
  const residual = recordOrNull(input.residual_diagnostic_candidate_read_model);
  const asOf =
    input.as_of ??
    providerPreview?.as_of ??
    providerDecision?.as_of ??
    stringField(externalPreview, "as_of") ??
    DEFAULT_AS_OF;
  const sourceExternalRecordRef =
    providerPreview?.source_external_handoff_delivery_contract_record_ref ??
    stringField(externalRecordSummary, "record_id");
  const requestedSurface = providerPreview?.requested_provider_surface ?? null;
  const providerProfileRef = providerPreview?.provider_profile_ref ?? null;
  const requestedRecipientRef = providerPreview?.requested_recipient_ref ?? null;
  const requestedPayloadFormat =
    providerPreview?.requested_payload_format ?? null;
  const payloadHash = providerPreview?.payload_hash ?? null;
  const payloadType = providerPreview?.payload_type ?? null;
  const sourceRefs = uniqueStrings([
    ...(input.source_refs ?? []),
    ...stringArray(providerPreview?.source_refs),
    ...stringArray(externalPreview?.source_refs),
    ...stringArray(externalRecordReview?.source_refs),
    ...stringArray(residual?.source_refs),
  ]);
  const evidenceRefs = uniqueStrings([
    ...(input.evidence_refs ?? []),
    ...stringArray(providerPreview?.evidence_refs),
    ...(payloadHash ? [payloadHash] : []),
    ...(sourceExternalRecordRef ? [sourceExternalRecordRef] : []),
  ]);
  const residualGate = combineResidualGates(
    residualGateSummary(residual),
    recordField(providerPreview, "residual_gate_summary"),
  );
  const providerPreviewProblems = providerPreviewProblemReasons(providerPreview);
  const providerDecisionProblems = providerDecisionProblemReasons(
    providerDecision,
    providerPreview,
  );
  const externalContractProblems = externalContractProblemReasons({
    externalPreview,
    externalRecordReview,
    externalRecordSummary,
    sourceExternalRecordRef,
  });
  const unsafeRefProblems = unsafeRefProblemReasons({
    surface: requestedSurface,
    providerProfileRef,
    requestedRecipientRef,
    requestedPayloadFormat,
  });
  const sourceBoundaryProblems = sourceMaterialBoundaryProblems({
    providerPreview,
    providerDecision,
    externalPreview,
    externalRecordReview,
    sent_handoff_read: input.sent_handoff_read,
    handoff_send_record_review: input.handoff_send_record_review,
    handoff_send_contract_record_review: input.handoff_send_contract_record_review,
    exported_handoff_packet_artifact_read:
      input.exported_handoff_packet_artifact_read,
    applied_handoff_context_read: input.applied_handoff_context_read,
  });
  const authorityProblems = authorityProblemReasons({
    providerPreview,
    providerDecision,
    externalPreview,
    externalRecordReview,
    workbench_spine_consolidation: input.workbench_spine_consolidation,
    residual_diagnostic_candidate_read_model: residual,
    sent_handoff_read: input.sent_handoff_read,
    handoff_send_record_review: input.handoff_send_record_review,
    handoff_send_contract_record_review: input.handoff_send_contract_record_review,
    exported_handoff_packet_artifact_read:
      input.exported_handoff_packet_artifact_read,
    applied_handoff_context_read: input.applied_handoff_context_read,
  });
  const blockerReasons = uniqueStrings([
    ...providerPreviewProblems,
    ...providerDecisionProblems,
    ...externalContractProblems,
    ...unsafeRefProblems,
    ...sourceBoundaryProblems,
    ...residualGate.hard_blocker_reasons,
    ...authorityProblems,
  ]);
  const warningReasons = uniqueStrings([
    ...residualGate.warning_reasons,
    "provider_specific_delivery_intent_contract_requires_future_execution_slice",
  ]);
  const status = determineStatus({
    blockerReasons,
    providerPreviewProblems,
    providerDecisionProblems,
    externalContractProblems,
    unsafeRefProblems,
    residualGate,
    authorityProblems,
    requestedSurface,
    requestedPayloadFormat,
  });
  const ready = status === "ready_for_intent_decision";
  const previewBase = {
    preview_version: PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_PREVIEW_VERSION,
    scope: PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
    as_of: asOf,
    status,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    source_provider_specific_preview_fingerprint:
      providerPreview?.preview_fingerprint ?? null,
    source_provider_specific_decision_fingerprint:
      providerDecision?.decision_preview_fingerprint ?? null,
    source_external_handoff_delivery_contract_record_ref:
      sourceExternalRecordRef ?? null,
    source_external_handoff_delivery_contract_preview_fingerprint:
      providerPreview?.source_external_handoff_delivery_contract_preview_fingerprint ??
      stringField(externalPreview, "preview_fingerprint"),
    source_local_fulfillment_ref:
      providerPreview?.source_local_fulfillment_ref ?? null,
    source_handoff_send_contract_record_ref:
      providerPreview?.source_handoff_send_contract_record_ref ?? null,
    source_exported_artifact_ref:
      providerPreview?.source_exported_artifact_ref ?? null,
    source_applied_handoff_context_ref:
      providerPreview?.source_applied_handoff_context_ref ?? null,
    requested_provider_surface: requestedSurface,
    provider_profile_ref: providerProfileRef,
    requested_recipient_ref: requestedRecipientRef,
    requested_payload_format: requestedPayloadFormat,
    payload_hash: payloadHash,
    payload_type: payloadType,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
  };
  const previewFingerprint =
    fingerprintProviderSpecificDeliveryIntentValueV01(previewBase);
  const material =
    ready && providerPreview && providerDecision && requestedSurface
      ? buildRecordPreview({
          previewFingerprint,
          providerPreview,
          providerDecision,
          sourceExternalRecordRef: sourceExternalRecordRef ?? null,
          sourceRefs,
          evidenceRefs,
        })
      : null;
  return {
    ...previewBase,
    preview_fingerprint: previewFingerprint,
    provider_specific_recipient_summary:
      providerPreview?.provider_specific_recipient_summary ?? null,
    provider_requirement_summary:
      providerPreview?.provider_requirement_summary ?? null,
    readiness_summary: {
      provider_specific_preview_ready:
        providerPreview?.status === "ready_for_provider_specific_decision",
      provider_specific_decision_ready: providerDecisionProblems.length === 0,
      external_contract_record_available: Boolean(sourceExternalRecordRef),
      provider_surface_supported: Boolean(
        requestedSurface && supportedSurfaces.has(requestedSurface),
      ),
      provider_profile_ref_safe_and_matched:
        providerProfileReady(requestedSurface, providerProfileRef) &&
        !unsafeRefProblems.includes("provider_profile_ref_unsafe") &&
        !unsafeRefProblems.includes("provider_profile_ref_surface_mismatch"),
      recipient_ref_safe_and_matched:
        Boolean(requestedRecipientRef) &&
        !unsafeRefProblems.includes("requested_recipient_ref_unsafe") &&
        !unsafeRefProblems.includes("requested_recipient_ref_surface_mismatch"),
      payload_hash_present: Boolean(payloadHash),
      payload_format_safe_and_supported:
        Boolean(requestedPayloadFormat) &&
        !unsafeRefProblems.includes("requested_payload_format_unsafe") &&
        !unsafeRefProblems.includes("payload_format_unsupported"),
      residual_gate_passed: residualGate.hard_blocker_reasons.length === 0,
      authority_boundary_passed: authorityProblems.length === 0,
      external_delivery_not_performed: sourceBoundaryProblems.length === 0,
      intent_decision_ready: ready,
    },
    residual_gate_summary: residualGate,
    external_delivery_boundary: createProviderSpecificDeliveryIntentBoundaryV01(),
    authority_boundary:
      createProviderSpecificDeliveryIntentAuthorityBoundaryV01(),
    would_write_provider_specific_delivery_intent_contract_record_preview:
      material,
    would_not_do: [
      "does_not_perform_external_delivery",
      "does_not_authorize_provider_execution",
      "does_not_call_provider_email_slack_webhook_github_codex_provider_runtime_browser_crawler_or_network",
      "does_not_read_or_store_provider_credentials",
      "does_not_write_clipboard_download_or_file",
      "does_not_mutate_cwp_handoff_relay_memory_metrics_residual_or_external_contract_state",
      "does_not_create_route_or_workbench_action_button",
    ],
    non_goals: [
      "provider_specific_delivery_execution",
      "email_slack_webhook_delivery",
      "provider_sdk_integration",
      "provider_credential_storage_or_discovery",
      "clipboard_download_file_export_behavior",
      "durable_residual_diagnostic_store",
      "autonomy_runner_scheduler_daemon_or_multi_agent_execution",
    ],
  };
}

export function createProviderSpecificDeliveryIntentBoundaryV01():
  ProviderSpecificDeliveryIntentBoundary {
  return {
    delivery_performed: false,
    provider_specific_delivery: false,
    provider_delivery_intent_is_delivery: false,
    provider_called: false,
    external_message_sent: false,
    email_sent: false,
    slack_sent: false,
    webhook_called: false,
    network_called: false,
    clipboard_written: false,
    file_downloaded: false,
    local_fulfillment_is_external_delivery: false,
    provider_specific_preview_is_delivery: false,
  };
}

export function createProviderSpecificDeliveryIntentAuthorityBoundaryV01(
  options: { writeNow?: boolean } = {},
): ProviderSpecificDeliveryIntentAuthorityBoundary {
  const writeNow = options.writeNow === true;
  return {
    read_only: !writeNow,
    advisory_only: !writeNow,
    intent_contract_only: true,
    source_of_truth: false,
    can_write_db: writeNow,
    can_create_schema: writeNow,
    can_create_provider_specific_delivery_intent_contract_record: writeNow,
    can_create_provider_specific_delivery_intent_contract_receipt: writeNow,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_external_messaging: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_call_browser_or_crawler: false,
    can_call_network: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_mutate_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_external_handoff_delivery_contract_record: false,
    can_write_provider_specific_preview_contract_record: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_write_dogfood_metrics: false,
    can_update_global_dogfood_metrics: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Provider-specific delivery intent contracts are scoped local contract records only.",
      "Provider-specific delivery intent is not delivery, provider authorization, provider execution, or a network call.",
    ],
  };
}

export function fingerprintProviderSpecificDeliveryIntentValueV01(
  value: unknown,
): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function providerSpecificDeliveryIntentRefProblemReasonsV01({
  surface,
  providerProfileRef,
  requestedRecipientRef,
  requestedPayloadFormat,
}: {
  surface: string | null | undefined;
  providerProfileRef: string | null | undefined;
  requestedRecipientRef: string | null | undefined;
  requestedPayloadFormat: string | null | undefined;
}): string[] {
  const typedSurface = toSurface(surface);
  return unsafeRefProblemReasons({
    surface: typedSurface,
    providerProfileRef: providerProfileRef ?? null,
    requestedRecipientRef: requestedRecipientRef ?? null,
    requestedPayloadFormat: requestedPayloadFormat ?? null,
  });
}

export function providerSpecificDeliveryIntentBoundaryProblemReasonsV01(
  value: unknown,
): string[] {
  const boundary = recordOrNull(value);
  if (!boundary) return ["external_delivery_boundary_missing"];
  return boundaryFields.flatMap((field) =>
    boundary[field] === true ? [`${field}_true`] : [],
  );
}

export function providerSpecificDeliveryIntentAuthorityProblemReasonsV01(
  value: unknown,
): string[] {
  return authorityProblemReasons({ value });
}

function buildRecordPreview({
  previewFingerprint,
  providerPreview,
  providerDecision,
  sourceExternalRecordRef,
  sourceRefs,
  evidenceRefs,
}: {
  previewFingerprint: string;
  providerPreview: ProviderSpecificExternalDeliveryPreviewContract;
  providerDecision: ProviderSpecificExternalDeliveryOperatorDecisionPreview;
  sourceExternalRecordRef: string | null;
  sourceRefs: string[];
  evidenceRefs: string[];
}): ProviderSpecificDeliveryIntentContractRecordPreview | null {
  if (
    !sourceExternalRecordRef ||
    !providerPreview.requested_provider_surface ||
    !providerPreview.requested_recipient_ref ||
    !providerPreview.requested_payload_format ||
    !providerPreview.payload_hash ||
    !providerPreview.payload_type ||
    !providerPreview.source_local_fulfillment_ref ||
    !providerPreview.source_handoff_send_contract_record_ref ||
    !providerPreview.source_exported_artifact_ref ||
    !providerPreview.provider_requirement_summary
  ) {
    return null;
  }
  return {
    record_version: PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_VERSION,
    scope: PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
    source_intent_contract_preview_fingerprint: previewFingerprint,
    source_provider_specific_preview_fingerprint:
      providerPreview.preview_fingerprint,
    source_provider_specific_decision_fingerprint:
      providerDecision.decision_preview_fingerprint,
    source_external_handoff_delivery_contract_record_ref:
      sourceExternalRecordRef,
    source_external_handoff_delivery_contract_preview_fingerprint:
      providerPreview.source_external_handoff_delivery_contract_preview_fingerprint,
    source_local_fulfillment_ref: providerPreview.source_local_fulfillment_ref,
    source_handoff_send_contract_record_ref:
      providerPreview.source_handoff_send_contract_record_ref,
    source_exported_artifact_ref: providerPreview.source_exported_artifact_ref,
    source_applied_handoff_context_ref:
      providerPreview.source_applied_handoff_context_ref,
    requested_provider_surface: providerPreview.requested_provider_surface,
    provider_profile_ref: providerPreview.provider_profile_ref,
    requested_recipient_ref: providerPreview.requested_recipient_ref,
    requested_payload_format: providerPreview.requested_payload_format,
    payload_hash: providerPreview.payload_hash,
    payload_type: providerPreview.payload_type,
    intent_status:
      "provider_specific_delivery_intent_contract_candidate_recordable",
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    provider_requirement_summary:
      providerPreview.provider_requirement_summary,
    residual_gate_summary: providerPreview.residual_gate_summary,
    external_delivery_boundary: createProviderSpecificDeliveryIntentBoundaryV01(),
    authority_boundary:
      createProviderSpecificDeliveryIntentAuthorityBoundaryV01(),
    no_external_delivery_performed: true,
    no_provider_call_performed: true,
    no_external_message_sent: true,
  };
}

function determineStatus({
  blockerReasons,
  providerPreviewProblems,
  providerDecisionProblems,
  externalContractProblems,
  unsafeRefProblems,
  residualGate,
  authorityProblems,
  requestedSurface,
  requestedPayloadFormat,
}: {
  blockerReasons: string[];
  providerPreviewProblems: string[];
  providerDecisionProblems: string[];
  externalContractProblems: string[];
  unsafeRefProblems: string[];
  residualGate: ExternalHandoffDeliveryResidualGateSummary;
  authorityProblems: string[];
  requestedSurface: ProviderSpecificExternalDeliverySurface | null;
  requestedPayloadFormat: string | null;
}): ProviderSpecificDeliveryIntentPreviewStatus {
  if (authorityProblems.length > 0) return "authority_boundary_blocked";
  if (residualGate.hard_blocker_reasons.length > 0) return "residual_gate_blocked";
  if (unsafeRefProblems.some((reason) => /unsafe|mismatch/.test(reason))) {
    return "unsafe_ref_blocked";
  }
  if (providerPreviewProblems.includes("provider_specific_preview_missing")) {
    return "provider_specific_preview_missing";
  }
  if (providerPreviewProblems.length > 0) {
    return "provider_specific_preview_not_ready";
  }
  if (providerDecisionProblems.includes("provider_specific_decision_missing")) {
    return "provider_specific_decision_missing";
  }
  if (providerDecisionProblems.length > 0) {
    return "provider_specific_decision_not_ready";
  }
  if (externalContractProblems.includes("external_contract_missing")) {
    return "external_contract_missing";
  }
  if (externalContractProblems.length > 0) return "external_contract_invalid";
  if (!requestedSurface || !supportedSurfaces.has(requestedSurface)) {
    return "provider_surface_not_supported";
  }
  if (!requestedPayloadFormat || !supportedPayloadFormats.has(requestedPayloadFormat)) {
    return "payload_format_unsupported";
  }
  if (blockerReasons.length > 0) return "blocked";
  return "ready_for_intent_decision";
}

function providerPreviewProblemReasons(
  preview: ProviderSpecificExternalDeliveryPreviewContract | null,
): string[] {
  if (!preview) return ["provider_specific_preview_missing"];
  return uniqueStrings([
    ...(preview.status !== "ready_for_provider_specific_decision"
      ? [`provider_specific_preview_not_ready:${preview.status}`]
      : []),
    ...providerSpecificDeliveryIntentBoundaryProblemReasonsV01(
      preview.external_delivery_boundary,
    ).map((reason) => `provider_specific_preview_${reason}`),
  ]);
}

function providerDecisionProblemReasons(
  decision: ProviderSpecificExternalDeliveryOperatorDecisionPreview | null,
  preview: ProviderSpecificExternalDeliveryPreviewContract | null,
): string[] {
  if (!decision) return ["provider_specific_decision_missing"];
  const nextStepReadiness = recordField(decision, "next_step_readiness");
  const nextStepBlockers = stringArray(
    nextStepReadiness?.current_blockers,
  );
  const nextStepMissingEvidence = stringArray(
    nextStepReadiness?.current_missing_evidence,
  );
  return uniqueStrings([
    ...(decision.decision_status !== "ready_for_provider_specific_preview_decision"
      ? [`provider_specific_decision_not_ready:${decision.decision_status}`]
      : []),
    ...(decision.recommended_operator_decision !==
    "record_provider_specific_preview_contract_candidate"
      ? ["provider_specific_decision_recommendation_invalid"]
      : []),
    ...((decision.blocker_reasons ?? []).length > 0
      ? ["provider_specific_decision_has_blockers"]
      : []),
    ...(preview &&
    decision.source_provider_specific_preview_fingerprint !==
      preview.preview_fingerprint
      ? ["provider_specific_decision_source_preview_mismatch"]
      : []),
    ...(!nextStepReadiness
      ? ["provider_specific_decision_next_step_readiness_missing"]
      : []),
    ...(nextStepReadiness &&
    nextStepReadiness.ready_for_operator_review !== true
      ? ["provider_specific_decision_next_step_not_ready"]
      : []),
    ...(nextStepBlockers.length > 0
      ? ["provider_specific_decision_next_step_blockers_present"]
      : []),
    ...(nextStepMissingEvidence.length > 0
      ? [
          "provider_specific_decision_next_step_missing_evidence_present",
        ]
      : []),
    ...(!safeRef(decision.requested_operator_ref)
      ? ["provider_specific_decision_operator_ref_missing_or_unsafe"]
      : []),
    ...(!safeRef(decision.requested_idempotency_key)
      ? ["provider_specific_decision_idempotency_key_missing_or_unsafe"]
      : []),
    ...(!safeRef(decision.review_confirmation_ref)
      ? ["provider_specific_decision_review_confirmation_ref_missing_or_unsafe"]
      : []),
  ]);
}

function externalContractProblemReasons({
  externalPreview,
  externalRecordReview,
  externalRecordSummary,
  sourceExternalRecordRef,
}: {
  externalPreview: RecordValue | null;
  externalRecordReview: RecordValue | null;
  externalRecordSummary: RecordValue | null;
  sourceExternalRecordRef: string | null | undefined;
}): string[] {
  return uniqueStrings([
    ...(!externalPreview && !externalRecordReview
      ? ["external_contract_missing"]
      : []),
    ...(externalRecordReview?.review_status === "records_invalid"
      ? ["external_handoff_delivery_contract_record_review_invalid"]
      : []),
    ...(!sourceExternalRecordRef
      ? ["source_external_handoff_delivery_contract_record_ref_missing"]
      : []),
    ...(externalPreview
      ? providerSpecificDeliveryIntentBoundaryProblemReasonsV01(
          recordField(externalPreview, "external_delivery_boundary"),
        ).map((reason) => `external_contract_preview_${reason}`)
      : []),
    ...recordSummaryBoundaryProblems(externalRecordSummary),
  ]);
}

function recordSummaryBoundaryProblems(summary: RecordValue | null): string[] {
  if (!summary) return [];
  return [
    ["delivery_performed", "external_contract_record_delivery_performed_true"],
    ["provider_called", "external_contract_record_provider_called_true"],
    [
      "external_message_sent",
      "external_contract_record_external_message_sent_true",
    ],
    ["network_called", "external_contract_record_network_called_true"],
  ].flatMap(([field, reason]) => (summary[field] === true ? [reason] : []));
}

function unsafeRefProblemReasons({
  surface,
  providerProfileRef,
  requestedRecipientRef,
  requestedPayloadFormat,
}: {
  surface: ProviderSpecificExternalDeliverySurface | null;
  providerProfileRef: string | null;
  requestedRecipientRef: string | null;
  requestedPayloadFormat: string | null;
}): string[] {
  return uniqueStrings([
    ...(!surface ? ["requested_provider_surface_missing"] : []),
    ...(surface && !supportedSurfaces.has(surface)
      ? ["requested_provider_surface_unsupported"]
      : []),
    ...(providerProfileRef && !safeRef(providerProfileRef)
      ? ["provider_profile_ref_unsafe"]
      : []),
    ...(!providerProfileReady(surface, providerProfileRef)
      ? ["provider_profile_ref_missing"]
      : []),
    ...(providerProfileRefSurfaceMismatch(surface, providerProfileRef)
      ? ["provider_profile_ref_surface_mismatch"]
      : []),
    ...(!requestedRecipientRef ? ["requested_recipient_ref_missing"] : []),
    ...(requestedRecipientRef && !safeRef(requestedRecipientRef)
      ? ["requested_recipient_ref_unsafe"]
      : []),
    ...(recipientRefSurfaceMismatch(surface, requestedRecipientRef)
      ? ["requested_recipient_ref_surface_mismatch"]
      : []),
    ...(!requestedPayloadFormat ? ["requested_payload_format_missing"] : []),
    ...(requestedPayloadFormat && !safeRef(requestedPayloadFormat)
      ? ["requested_payload_format_unsafe"]
      : []),
    ...(requestedPayloadFormat &&
    safeRef(requestedPayloadFormat) &&
    !supportedPayloadFormats.has(requestedPayloadFormat)
      ? ["payload_format_unsupported"]
      : []),
  ]);
}

function sourceMaterialBoundaryProblems(values: Record<string, unknown>): string[] {
  return uniqueStrings(
    Object.entries(values).flatMap(([label, value]) =>
      nestedBoundaryProblemReasons(label, value),
    ),
  );
}

function nestedBoundaryProblemReasons(label: string, value: unknown): string[] {
  const record = recordOrNull(value);
  if (!record) return [];
  const direct = providerSpecificDeliveryIntentBoundaryProblemReasonsV01(
    recordField(record, "external_delivery_boundary") ??
      recordField(record, "external_delivery"),
  ).map((reason) => `${label}_${reason}`);
  const summaries = [
    ...arrayOfRecords(record.record_summaries),
    recordField(record, "selected_record_summary"),
    recordField(record, "latest_record_summary"),
  ].filter(isRecord);
  const summaryProblems = summaries.flatMap((summary) =>
    ["delivery_performed", "provider_called", "external_message_sent", "network_called"]
      .flatMap((field) =>
        summary[field] === true ? [`${label}_${field}_true`] : [],
      ),
  );
  return uniqueStrings([...direct.filter((reason) => !reason.endsWith("_missing")), ...summaryProblems]);
}

function authorityProblemReasons(values: Record<string, unknown>): string[] {
  return uniqueStrings(
    Object.entries(values).flatMap(([label, value]) => {
      const record = recordOrNull(value);
      if (!record) return [];
      const authority = recordField(record, "authority_boundary");
      const direct = forbiddenAuthorityTrueFields.flatMap((field) =>
        authority?.[field] === true ? [`${label}_authority_forbidden_true:${field}`] : [],
      );
      return direct;
    }),
  );
}

function residualGateSummary(
  residual: RecordValue | null,
): ExternalHandoffDeliveryResidualGateSummary {
  if (!residual) {
    return {
      gate_status: "insufficient_data",
      hard_blocking_candidate_ids: [],
      warning_candidate_ids: [],
      non_blocking_candidate_ids: [],
      hard_blocker_reasons: [],
      warning_reasons: ["residual_diagnostic_candidate_read_model_missing"],
    };
  }
  const candidates = arrayOfRecords(residual.residual_candidates);
  const hard = candidates.filter(isHardResidualCandidate);
  const warnings = candidates.filter(
    (candidate) =>
      !hard.includes(candidate) &&
      stringField(candidate, "category") === "external_delivery_boundary_pressure",
  );
  return {
    gate_status:
      hard.length > 0
        ? "blocked"
        : warnings.length > 0
          ? "warning_only"
          : "passed",
    hard_blocking_candidate_ids: uniqueStrings(
      hard.map((candidate) => stringField(candidate, "candidate_id")),
    ),
    warning_candidate_ids: uniqueStrings(
      warnings.map((candidate) => stringField(candidate, "candidate_id")),
    ),
    non_blocking_candidate_ids: [],
    hard_blocker_reasons: uniqueStrings(
      hard.map(
        (candidate) =>
          `residual_candidate_blocked:${stringField(candidate, "category") ?? "unknown"}`,
      ),
    ),
    warning_reasons: uniqueStrings(
      warnings.map(
        (candidate) =>
          `residual_candidate_warning:${stringField(candidate, "category") ?? "unknown"}`,
      ),
    ),
  };
}

function isHardResidualCandidate(candidate: RecordValue): boolean {
  if (residualCandidateHasForbiddenSignal(candidate)) return true;
  const category = stringField(candidate, "category");
  const status = stringField(candidate, "status");
  const severity = stringField(candidate, "severity");
  const materialized = residualCandidateHasMaterializedEvidence(candidate);
  if (category === "route_integration_mode_mismatch") {
    return status === "actionable_candidate";
  }
  if (category === "review_writer_validation_drift") {
    return status === "actionable_candidate" || materialized;
  }
  if (hardResidualCategories.has(category ?? "")) {
    return status === "actionable_candidate" || severity === "high" || materialized;
  }
  return false;
}

function residualCandidateHasMaterializedEvidence(candidate: RecordValue): boolean {
  return (
    arrayOfRecords(candidate.observed_signals).some(
      (signal) => signal.materialized_inconsistency === true,
    ) || stringArray(candidate.materialized_inconsistencies).length > 0
  );
}

function residualCandidateHasForbiddenSignal(candidate: RecordValue): boolean {
  const signalText = [
    ...stringArray(candidate.materialized_inconsistencies),
    ...arrayOfRecords(candidate.observed_signals).flatMap((signal) => [
      stringField(signal, "summary"),
      stringField(signal, "signal"),
      stringField(signal, "reason"),
      stringField(signal, "label"),
    ]),
  ]
    .filter(isNonEmptyString)
    .join("\n")
    .toLowerCase();
  return forbiddenResidualSignalFragments.some((fragment) =>
    signalText.includes(fragment),
  );
}

function combineResidualGates(
  current: ExternalHandoffDeliveryResidualGateSummary,
  previewGate: RecordValue | null,
): ExternalHandoffDeliveryResidualGateSummary {
  const previewHard = stringArray(previewGate?.hard_blocker_reasons);
  const previewWarnings = stringArray(previewGate?.warning_reasons);
  const hard = uniqueStrings([...current.hard_blocker_reasons, ...previewHard]);
  const warnings = uniqueStrings([...current.warning_reasons, ...previewWarnings]);
  return {
    gate_status:
      hard.length > 0 ? "blocked" : warnings.length > 0 ? "warning_only" : "passed",
    hard_blocking_candidate_ids: current.hard_blocking_candidate_ids,
    warning_candidate_ids: current.warning_candidate_ids,
    non_blocking_candidate_ids: current.non_blocking_candidate_ids,
    hard_blocker_reasons: hard,
    warning_reasons: warnings,
  };
}

function providerProfileReady(
  surface: ProviderSpecificExternalDeliverySurface | null,
  providerProfileRef: string | null,
): boolean {
  return surface === "manual_operator_delivery" || Boolean(providerProfileRef);
}

function providerProfileRefSurfaceMismatch(
  surface: ProviderSpecificExternalDeliverySurface | null,
  providerProfileRef: string | null,
): boolean {
  if (!surface || !providerProfileRef) return false;
  if (surface === "manual_operator_delivery") return false;
  if (surface === "email_delivery_preview") {
    return !providerProfileRef.startsWith("provider-profile:email:");
  }
  if (surface === "slack_delivery_preview") {
    return !providerProfileRef.startsWith("provider-profile:slack:");
  }
  if (surface === "webhook_delivery_preview") {
    return !providerProfileRef.startsWith("provider-profile:webhook:");
  }
  return true;
}

function recipientRefSurfaceMismatch(
  surface: ProviderSpecificExternalDeliverySurface | null,
  recipientRef: string | null,
): boolean {
  if (!surface || !recipientRef) return false;
  if (surface === "manual_operator_delivery") {
    return !(
      recipientRef === "recipient:operator" ||
      recipientRef.startsWith("recipient:manual:")
    );
  }
  if (surface === "email_delivery_preview") {
    return !recipientRef.startsWith("recipient:email:");
  }
  if (surface === "slack_delivery_preview") {
    return !(
      recipientRef.startsWith("recipient:slack:") ||
      recipientRef.startsWith("recipient:slack-channel:") ||
      recipientRef.startsWith("recipient:slack-user:")
    );
  }
  if (surface === "webhook_delivery_preview") {
    return !(
      recipientRef.startsWith("recipient:webhook:") ||
      recipientRef.startsWith("endpoint-ref:webhook:")
    );
  }
  return true;
}

function toSurface(value: unknown): ProviderSpecificExternalDeliverySurface | null {
  return typeof value === "string" && supportedSurfaces.has(value as never)
    ? (value as ProviderSpecificExternalDeliverySurface)
    : null;
}

function isProviderSpecificPreview(
  value: unknown,
): value is ProviderSpecificExternalDeliveryPreviewContract {
  return Boolean(
    isRecord(value) &&
      value.preview_version ===
        PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_PREVIEW_CONTRACT_VERSION &&
      value.scope === PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
  );
}

function isProviderSpecificDecision(
  value: unknown,
): value is ProviderSpecificExternalDeliveryOperatorDecisionPreview {
  return Boolean(
    isRecord(value) &&
      value.decision_preview_version ===
        PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION &&
      value.scope === PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
  );
}

function isExternalPreview(value: unknown): value is RecordValue {
  return Boolean(
    isRecord(value) &&
      value.preview_version === EXTERNAL_HANDOFF_DELIVERY_CONTRACT_PREVIEW_VERSION,
  );
}

function isExternalRecordReview(value: unknown): value is RecordValue {
  return Boolean(
    isRecord(value) &&
      value.review_version ===
        EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_REVIEW_VERSION,
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

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as RecordValue)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as RecordValue)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(isNonEmptyString))];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => isNonEmptyString(item))
    : [];
}

function arrayOfRecords(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function stringField(value: unknown, key: string): string | null {
  return isRecord(value) && isNonEmptyString(value[key]) ? value[key] : null;
}

function recordField(value: unknown, key: string): RecordValue | null {
  return isRecord(value) && isRecord(value[key]) ? value[key] : null;
}

function recordOrNull(value: unknown): RecordValue | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
