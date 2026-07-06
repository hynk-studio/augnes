import { createHash } from "node:crypto";

import type { ExternalHandoffDeliveryResidualGateSummary } from "@/types/external-handoff-delivery-contract";
import {
  DELIVERY_SPINE_LOOP_CLOSURE_READ_MODEL_VERSION,
  DELIVERY_SPINE_LOOP_CLOSURE_SCOPE,
  type DeliverySpineLoopClosureReadModel,
} from "@/types/delivery-spine-loop-closure";
import {
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE,
  type ProviderSpecificDeliveryExecutionAuthorityBoundary,
  type ProviderSpecificDeliveryExecutionContractPreview,
  type ProviderSpecificDeliveryExecutionContractPreviewInput,
  type ProviderSpecificDeliveryExecutionNonDeliveryBoundary,
  type ProviderSpecificDeliveryExecutionPreviewStatus,
  type ProviderSpecificDeliveryExecutionSurface,
  type ProviderSpecificDeliveryLineageGateSummary,
  type ProviderSpecificDeliveryProviderConfigGateSummary,
} from "@/types/provider-specific-delivery-execution-contract-preview";
import {
  PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_REVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_PREVIEW_VERSION,
  type ProviderSpecificDeliveryIntentContractPreview,
  type ProviderSpecificDeliveryIntentContractRecordReview,
} from "@/types/provider-specific-delivery-intent-contract";
import {
  PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_PREVIEW_CONTRACT_VERSION,
  type ProviderSpecificExternalDeliveryPreviewContract,
  type ProviderSpecificExternalDeliverySurface,
} from "@/types/provider-specific-external-delivery-preview-contract";

type RecordValue = Record<string, unknown>;

const DEFAULT_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const unsafeRefPattern =
  /raw_text|raw_report|raw_excerpt|raw_email_body|raw_message|raw_payload|raw_provider_payload|secret|token|password|api[_-]?key|bearer|private|credential|webhook\s*url|https?:\/\/|env:|process\.env|\.env/i;
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
const supportedExecutionSurfaces = new Set<ProviderSpecificDeliveryExecutionSurface>([
  "manual_operator_delivery_execution_preview",
  "email_delivery_execution_preview",
  "slack_delivery_execution_preview",
  "webhook_delivery_execution_preview",
]);
const boundaryFields = [
  "delivery_performed",
  "external_delivery_performed",
  "execution_performed",
  "provider_specific_delivery",
  "provider_delivery_intent_is_delivery",
  "provider_execution_preview_is_delivery",
  "provider_execution_contract_is_delivery",
  "provider_called",
  "external_message_sent",
  "email_sent",
  "slack_sent",
  "webhook_called",
  "network_called",
  "clipboard_written",
  "file_downloaded",
  "local_fulfillment_is_external_delivery",
  "external_contract_is_delivery",
  "provider_specific_preview_is_delivery",
  "provider_specific_intent_is_delivery",
] as const;
const forbiddenAuthorityTrueFields = [
  "source_of_truth",
  "can_write_db",
  "can_create_schema",
  "can_create_route",
  "can_send_handoff",
  "can_execute_delivery",
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
const forbiddenResidualFragments = [
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

export function buildProviderSpecificDeliveryExecutionContractPreviewV01(
  input: ProviderSpecificDeliveryExecutionContractPreviewInput = {},
): ProviderSpecificDeliveryExecutionContractPreview {
  const deliverySpine = isDeliverySpine(input.delivery_spine_loop_closure_read_model)
    ? input.delivery_spine_loop_closure_read_model
    : null;
  const intentPreview = isIntentPreview(
    input.provider_specific_delivery_intent_contract_preview,
  )
    ? input.provider_specific_delivery_intent_contract_preview
    : null;
  const intentReview = isIntentRecordReview(
    input.provider_specific_delivery_intent_contract_record_review,
  )
    ? input.provider_specific_delivery_intent_contract_record_review
    : null;
  const providerPreview = isProviderPreview(
    input.provider_specific_external_delivery_preview_contract,
  )
    ? input.provider_specific_external_delivery_preview_contract
    : null;
  const selectedIntentSummary = recordField(intentReview, "selected_record_summary");
  const latestIntentSummary = recordField(intentReview, "latest_record_summary");
  const intentSummary = selectedIntentSummary ?? latestIntentSummary;
  const intentRecord = selectIntentRecord(intentReview, intentSummary);
  const requestedProviderSurface =
    toProviderSurface(stringField(intentSummary, "requested_provider_surface")) ??
    intentPreview?.requested_provider_surface ??
    providerPreview?.requested_provider_surface ??
    null;
  const requestedExecutionSurface =
    toExecutionSurface(input.requested_execution_surface) ??
    mapProviderSurfaceToExecutionSurface(requestedProviderSurface);
  const executionProfileRefInput = input.requested_execution_profile_ref;
  const executionProfileRef =
    executionProfileRefInput === undefined
      ? null
      : safeRef(executionProfileRefInput);
  const providerProfileRef =
    stringField(intentSummary, "provider_profile_ref") ??
    intentPreview?.provider_profile_ref ??
    providerPreview?.provider_profile_ref ??
    null;
  const requestedRecipientRef =
    stringField(intentSummary, "requested_recipient_ref") ??
    intentPreview?.requested_recipient_ref ??
    providerPreview?.requested_recipient_ref ??
    null;
  const requestedPayloadFormat =
    stringField(intentSummary, "requested_payload_format") ??
    intentPreview?.requested_payload_format ??
    providerPreview?.requested_payload_format ??
    null;
  const payloadHash =
    stringField(intentSummary, "payload_hash") ??
    intentPreview?.payload_hash ??
    providerPreview?.payload_hash ??
    null;
  const payloadType =
    stringField(intentSummary, "payload_type") ??
    intentPreview?.payload_type ??
    providerPreview?.payload_type ??
    null;
  const sourceProviderPreviewFingerprint =
    stringField(intentSummary, "source_provider_specific_preview_fingerprint") ??
    stringField(intentRecord, "source_provider_specific_preview_fingerprint") ??
    intentPreview?.source_provider_specific_preview_fingerprint ??
    providerPreview?.preview_fingerprint ??
    null;
  const sourceProviderDecisionFingerprint =
    stringField(intentSummary, "source_provider_specific_decision_fingerprint") ??
    stringField(intentRecord, "source_provider_specific_decision_fingerprint") ??
    intentPreview?.source_provider_specific_decision_fingerprint ??
    null;
  const sourceIntentPreviewFingerprint =
    stringField(intentRecord, "source_intent_contract_preview_fingerprint") ??
    intentPreview?.preview_fingerprint ??
    null;
  const sourceIntentDecisionFingerprint =
    stringField(intentRecord, "source_operator_decision_fingerprint") ??
    stringField(
      input.provider_specific_delivery_intent_operator_decision_preview,
      "decision_preview_fingerprint",
    ) ??
    null;
  const sourceExternalRecordRef =
    stringField(intentSummary, "source_external_handoff_delivery_contract_record_ref") ??
    stringField(intentRecord, "source_external_handoff_delivery_contract_record_ref") ??
    intentPreview?.source_external_handoff_delivery_contract_record_ref ??
    providerPreview?.source_external_handoff_delivery_contract_record_ref ??
    null;
  const sourceLocalFulfillmentRef =
    stringField(intentSummary, "source_local_fulfillment_ref") ??
    stringField(intentRecord, "source_local_fulfillment_ref") ??
    intentPreview?.source_local_fulfillment_ref ??
    providerPreview?.source_local_fulfillment_ref ??
    null;
  const sourceHandoffSendContractRecordRef =
    stringField(intentSummary, "source_handoff_send_contract_record_ref") ??
    stringField(intentRecord, "source_handoff_send_contract_record_ref") ??
    intentPreview?.source_handoff_send_contract_record_ref ??
    providerPreview?.source_handoff_send_contract_record_ref ??
    null;
  const sourceExportedArtifactRef =
    stringField(intentSummary, "source_exported_artifact_ref") ??
    stringField(intentRecord, "source_exported_artifact_ref") ??
    intentPreview?.source_exported_artifact_ref ??
    providerPreview?.source_exported_artifact_ref ??
    null;
  const sourceRefs = uniqueStrings([
    ...(input.source_refs ?? []),
    ...stringArray(deliverySpine?.source_refs),
    ...stringArray(intentPreview?.source_refs),
    ...stringArray(intentReview?.source_refs),
    ...stringArray(providerPreview?.source_refs),
    ...(sourceLocalFulfillmentRef ? [sourceLocalFulfillmentRef] : []),
    ...(sourceExternalRecordRef ? [sourceExternalRecordRef] : []),
  ]);
  const evidenceRefs = uniqueStrings([
    ...(input.evidence_refs ?? []),
    ...stringArray(deliverySpine?.evidence_refs),
    ...stringArray(intentPreview?.evidence_refs),
    ...(payloadHash ? [payloadHash] : []),
    ...(sourceIntentPreviewFingerprint ? [sourceIntentPreviewFingerprint] : []),
  ]);
  const deliverySpineProblems = deliverySpineProblemReasons(deliverySpine);
  const intentProblems = intentRecordProblemReasons({
    intentReview,
    intentSummary,
    intentRecord,
  });
  const configGate = providerConfigGateSummary({
    requestedExecutionSurface,
    executionProfileRefInput,
    executionProfileRef,
    providerProfileRef,
    requestedRecipientRef,
  });
  const refProblems = refProblemReasons({
    requestedProviderSurface,
    requestedExecutionSurface,
    executionProfileRefInput,
    executionProfileRef,
    providerProfileRef,
    requestedRecipientRef,
    requestedPayloadFormat,
  });
  const lineageGate = lineageGateSummary({
    providerPreview,
    intentPreview,
    intentSummary,
    intentRecord,
    sourceProviderPreviewFingerprint,
    sourceExternalRecordRef,
    sourceLocalFulfillmentRef,
    sourceExportedArtifactRef,
  });
  const residualGate = combineResidualGates(
    residualGateSummary(recordOrNull(input.residual_diagnostic_candidate_read_model)),
    recordField(deliverySpine, "residual_gate_summary"),
    recordField(intentPreview, "residual_gate_summary"),
    recordField(providerPreview, "residual_gate_summary"),
  );
  const sourceBoundaryProblems = sourceMaterialBoundaryProblems({
    delivery_spine_loop_closure_read_model: deliverySpine,
    provider_specific_delivery_intent_contract_preview: intentPreview,
    provider_specific_delivery_intent_operator_decision_preview:
      input.provider_specific_delivery_intent_operator_decision_preview,
    provider_specific_delivery_intent_contract_record_review: intentReview,
    provider_specific_external_delivery_preview_contract: providerPreview,
    provider_specific_external_delivery_operator_decision_preview:
      input.provider_specific_external_delivery_operator_decision_preview,
    external_handoff_delivery_contract_preview:
      input.external_handoff_delivery_contract_preview,
    external_handoff_delivery_contract_record_review:
      input.external_handoff_delivery_contract_record_review,
    sent_handoff_read: input.sent_handoff_read,
    handoff_send_record_review: input.handoff_send_record_review,
    handoff_send_contract_record_review: input.handoff_send_contract_record_review,
    exported_handoff_packet_artifact_read:
      input.exported_handoff_packet_artifact_read,
    applied_handoff_context_read: input.applied_handoff_context_read,
  });
  const authorityProblems = authorityProblemReasons({
    delivery_spine_loop_closure_read_model: deliverySpine,
    provider_specific_delivery_intent_contract_preview: intentPreview,
    provider_specific_delivery_intent_operator_decision_preview:
      input.provider_specific_delivery_intent_operator_decision_preview,
    provider_specific_delivery_intent_contract_record_review: intentReview,
    provider_specific_external_delivery_preview_contract: providerPreview,
    provider_specific_external_delivery_operator_decision_preview:
      input.provider_specific_external_delivery_operator_decision_preview,
    external_handoff_delivery_contract_preview:
      input.external_handoff_delivery_contract_preview,
    external_handoff_delivery_contract_record_review:
      input.external_handoff_delivery_contract_record_review,
    residual_diagnostic_candidate_read_model:
      input.residual_diagnostic_candidate_read_model,
    workbench_spine_consolidation: input.workbench_spine_consolidation,
    sent_handoff_read: input.sent_handoff_read,
    handoff_send_record_review: input.handoff_send_record_review,
    handoff_send_contract_record_review: input.handoff_send_contract_record_review,
    exported_handoff_packet_artifact_read:
      input.exported_handoff_packet_artifact_read,
    applied_handoff_context_read: input.applied_handoff_context_read,
  });
  const blockerReasons = uniqueStrings([
    ...deliverySpineProblems,
    ...intentProblems,
    ...configGate.problem_reasons,
    ...refProblems,
    ...lineageGate.problem_reasons,
    ...residualGate.hard_blocker_reasons,
    ...sourceBoundaryProblems,
    ...authorityProblems,
  ]);
  const warningReasons = uniqueStrings([
    ...residualGate.warning_reasons,
    "provider_config_runtime_not_verified",
    "future_provider_execution_contract_record_slice_required",
    "provider_specific_delivery_execution_not_authorized_by_preview",
  ]);
  const status = determineStatus({
    deliverySpineProblems,
    intentProblems,
    configProblems: configGate.problem_reasons,
    refProblems,
    lineageGate,
    residualGate,
    sourceBoundaryProblems,
    authorityProblems,
    requestedExecutionSurface,
    blockerReasons,
  });
  const asOf =
    input.as_of ??
    deliverySpine?.as_of ??
    intentPreview?.as_of ??
    providerPreview?.as_of ??
    DEFAULT_AS_OF;
  const previewBase = {
    preview_version: PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_PREVIEW_VERSION,
    scope: PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE,
    as_of: asOf,
    status,
    source_delivery_spine_fingerprint:
      deliverySpine ? fingerprintProviderSpecificDeliveryExecutionValueV01({
        read_model_version: deliverySpine.read_model_version,
        status: deliverySpine.delivery_spine_status,
        stage_summary: deliverySpine.stage_summary,
      }) : null,
    source_provider_specific_intent_contract_record_ref:
      stringField(intentSummary, "record_id"),
    source_provider_specific_intent_preview_fingerprint:
      sourceIntentPreviewFingerprint,
    source_provider_specific_intent_decision_fingerprint:
      sourceIntentDecisionFingerprint,
    source_provider_specific_preview_fingerprint:
      sourceProviderPreviewFingerprint,
    source_external_handoff_delivery_contract_record_ref:
      sourceExternalRecordRef,
    source_local_fulfillment_ref: sourceLocalFulfillmentRef,
    source_handoff_send_contract_record_ref:
      sourceHandoffSendContractRecordRef,
    source_exported_artifact_ref: sourceExportedArtifactRef,
    requested_provider_surface: requestedProviderSurface,
    requested_execution_surface: requestedExecutionSurface,
    provider_profile_ref: providerProfileRef,
    execution_profile_ref: executionProfileRef,
    requested_recipient_ref: requestedRecipientRef,
    requested_payload_format: requestedPayloadFormat,
    payload_hash: payloadHash,
    payload_type: payloadType,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
  };
  return {
    ...previewBase,
    preview_fingerprint:
      fingerprintProviderSpecificDeliveryExecutionValueV01(previewBase),
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    execution_preflight_summary: {
      delivery_spine_present: Boolean(deliverySpine),
      delivery_spine_provider_intent_recorded:
        deliverySpine?.delivery_spine_status === "provider_specific_intent_recorded",
      future_execution_not_started:
        deliverySpine?.stage_summary?.future_execution_stage_status ===
        "not_started",
      provider_specific_intent_record_available:
        Boolean(stringField(intentSummary, "record_id")) &&
        intentProblems.length === 0,
      execution_surface_supported:
        requestedExecutionSurface !== null &&
        supportedExecutionSurfaces.has(requestedExecutionSurface),
      execution_profile_ref_safe:
        !configGate.problem_reasons.includes("execution_profile_ref_unsafe"),
      execution_profile_family_matched:
        !configGate.problem_reasons.includes("execution_profile_ref_surface_mismatch"),
      provider_profile_family_matched:
        !refProblems.includes("provider_profile_ref_surface_mismatch"),
      recipient_ref_family_matched:
        !refProblems.includes("requested_recipient_ref_surface_mismatch"),
      payload_hash_present: Boolean(payloadHash),
      payload_format_safe:
        requestedPayloadFormat !== null &&
        !refProblems.includes("requested_payload_format_unsafe") &&
        supportedPayloadFormats.has(requestedPayloadFormat),
      residual_gate_passed: residualGate.hard_blocker_reasons.length === 0,
      lineage_gate_passed: lineageGate.gate_status === "passed",
      provider_config_gate_passed:
        configGate.problem_reasons.length === 0,
      operator_gate_required_for_future_slice: true,
    },
    provider_execution_requirement_summary: requirementSummary({
      requestedExecutionSurface,
      executionProfileRef,
      providerProfileRef,
      requestedRecipientRef,
      requestedPayloadFormat,
      payloadHash,
      sourceLocalFulfillmentRef,
      sourceExternalRecordRef,
      sourceExportedArtifactRef,
    }),
    residual_gate_summary: residualGate,
    lineage_gate_summary: lineageGate,
    provider_config_gate_summary: configGate,
    operator_gate_summary: {
      operator_review_required: true,
      execution_contract_record_slice_required: true,
      execution_authorization_present: false,
      provider_call_authorized: false,
    },
    explicit_non_delivery_boundary:
      createProviderSpecificDeliveryExecutionNonDeliveryBoundaryV01(),
    authority_boundary:
      createProviderSpecificDeliveryExecutionAuthorityBoundaryV01(),
    would_not_do: [
      "does_not_execute_delivery",
      "does_not_create_execution_record",
      "does_not_call_provider_email_slack_webhook_github_codex_openai_browser_crawler_or_network",
      "does_not_read_environment_or_provider_secrets",
      "does_not_write_clipboard_download_or_file",
      "does_not_mutate_cwp_handoff_relay_memory_metrics_residual_external_contract_provider_preview_provider_intent_or_delivery_spine_state",
      "does_not_create_route_or_workbench_action_button",
    ],
    non_goals: [
      "actual_external_delivery",
      "provider_specific_delivery_execution",
      "provider_specific_delivery_execution_record_write_store_or_review",
      "provider_sdk_integration",
      "provider_credential_storage_or_discovery",
      "clipboard_download_file_export_behavior",
      "durable_execution_contract_record",
      "autonomy_runner_scheduler_daemon_or_multi_agent_execution",
    ],
  };
}

export function createProviderSpecificDeliveryExecutionNonDeliveryBoundaryV01():
  ProviderSpecificDeliveryExecutionNonDeliveryBoundary {
  return {
    delivery_performed: false,
    execution_performed: false,
    provider_specific_delivery: false,
    provider_delivery_intent_is_delivery: false,
    provider_execution_preview_is_delivery: false,
    provider_execution_contract_is_delivery: false,
    provider_called: false,
    external_message_sent: false,
    email_sent: false,
    slack_sent: false,
    webhook_called: false,
    network_called: false,
    clipboard_written: false,
    file_downloaded: false,
    local_fulfillment_is_external_delivery: false,
    external_contract_is_delivery: false,
    provider_specific_preview_is_delivery: false,
    provider_specific_intent_is_delivery: false,
  };
}

export function createProviderSpecificDeliveryExecutionAuthorityBoundaryV01():
  ProviderSpecificDeliveryExecutionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    execution_preview_only: true,
    can_write_db: false,
    can_create_schema: false,
    can_create_route: false,
    can_send_handoff: false,
    can_execute_delivery: false,
    can_call_send_provider: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_call_network: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_memory: false,
    can_mutate_cwp: false,
    can_mutate_handoff: false,
    can_mutate_residual: false,
    can_mutate_external_contract: false,
    can_mutate_provider_intent: false,
    can_mutate_delivery_spine_loop_closure: false,
    can_render_workbench_action_button: false,
  };
}

export function fingerprintProviderSpecificDeliveryExecutionValueV01(
  value: unknown,
): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function determineStatus({
  deliverySpineProblems,
  intentProblems,
  configProblems,
  refProblems,
  lineageGate,
  residualGate,
  sourceBoundaryProblems,
  authorityProblems,
  requestedExecutionSurface,
  blockerReasons,
}: {
  deliverySpineProblems: string[];
  intentProblems: string[];
  configProblems: string[];
  refProblems: string[];
  lineageGate: ProviderSpecificDeliveryLineageGateSummary;
  residualGate: ExternalHandoffDeliveryResidualGateSummary;
  sourceBoundaryProblems: string[];
  authorityProblems: string[];
  requestedExecutionSurface: ProviderSpecificDeliveryExecutionSurface | null;
  blockerReasons: string[];
}): ProviderSpecificDeliveryExecutionPreviewStatus {
  if (authorityProblems.length > 0) return "authority_boundary_blocked";
  if (sourceBoundaryProblems.length > 0) return "execution_boundary_blocked";
  if (residualGate.hard_blocker_reasons.length > 0) return "residual_gate_blocked";
  if (lineageGate.gate_status === "blocked") return "lineage_gate_blocked";
  if (deliverySpineProblems.includes("delivery_spine_missing")) {
    return "delivery_spine_missing";
  }
  if (deliverySpineProblems.length > 0) return "delivery_spine_not_ready";
  if (intentProblems.includes("provider_specific_intent_record_review_records_invalid")) {
    return "provider_specific_intent_invalid";
  }
  if (intentProblems.length > 0) return "provider_specific_intent_missing";
  if (!requestedExecutionSurface) return "execution_surface_missing";
  if (!supportedExecutionSurfaces.has(requestedExecutionSurface)) {
    return "execution_surface_unsupported";
  }
  if (configProblems.some((problem) => problem.includes("unsafe"))) {
    return "provider_config_ref_unsafe";
  }
  if (refProblems.some((problem) => problem.includes("provider_profile_ref_unsafe"))) {
    return "provider_config_ref_unsafe";
  }
  if (refProblems.some((problem) => problem.includes("recipient_ref_unsafe"))) {
    return "recipient_ref_unsafe";
  }
  if (refProblems.some((problem) => problem.includes("payload"))) {
    return "payload_ref_unsafe";
  }
  if (configProblems.length > 0) return "provider_config_missing";
  if (blockerReasons.length > 0) return "blocked";
  return "ready_for_execution_contract_decision";
}

function deliverySpineProblemReasons(
  spine: DeliverySpineLoopClosureReadModel | null,
): string[] {
  if (!spine) return ["delivery_spine_missing"];
  return uniqueStrings([
    ...(spine.delivery_spine_status !== "provider_specific_intent_recorded"
      ? [`delivery_spine_not_provider_specific_intent_recorded:${spine.delivery_spine_status}`]
      : []),
    ...(spine.stage_summary.future_execution_stage_status !== "not_started"
      ? ["delivery_spine_future_execution_stage_not_not_started"]
      : []),
    ...boundaryProblemReasons(spine.explicit_non_delivery_boundary).map(
      (reason) => `delivery_spine_${reason}`,
    ),
    ...stringArray(spine.blocker_summary?.blockers).map(
      (reason) => `delivery_spine_blocker:${reason}`,
    ),
  ]);
}

function intentRecordProblemReasons({
  intentReview,
  intentSummary,
  intentRecord,
}: {
  intentReview: ProviderSpecificDeliveryIntentContractRecordReview | null;
  intentSummary: RecordValue | null;
  intentRecord: RecordValue | null;
}): string[] {
  if (!intentReview) return ["provider_specific_intent_record_review_missing"];
  if (intentReview.review_status === "records_invalid") {
    return ["provider_specific_intent_record_review_records_invalid"];
  }
  if (!intentSummary) return ["provider_specific_intent_record_missing"];
  return uniqueStrings([
    ...(!stringField(intentSummary, "record_id")
      ? ["provider_specific_intent_record_id_missing"]
      : []),
    ...(!(
      stringField(intentSummary, "source_provider_specific_preview_fingerprint") ??
      stringField(intentRecord, "source_provider_specific_preview_fingerprint")
    )
      ? ["source_provider_specific_preview_fingerprint_missing"]
      : []),
    ...(!(
      stringField(intentSummary, "source_provider_specific_decision_fingerprint") ??
      stringField(intentRecord, "source_provider_specific_decision_fingerprint")
    )
      ? ["source_provider_specific_decision_fingerprint_missing"]
      : []),
    ...(!stringField(intentSummary, "source_external_handoff_delivery_contract_record_ref")
      ? ["source_external_handoff_delivery_contract_record_ref_missing"]
      : []),
    ...(!stringField(intentSummary, "source_local_fulfillment_ref")
      ? ["source_local_fulfillment_ref_missing"]
      : []),
    ...(!stringField(intentSummary, "source_handoff_send_contract_record_ref")
      ? ["source_handoff_send_contract_record_ref_missing"]
      : []),
    ...(!stringField(intentSummary, "source_exported_artifact_ref")
      ? ["source_exported_artifact_ref_missing"]
      : []),
    ...(!stringField(intentSummary, "requested_provider_surface")
      ? ["requested_provider_surface_missing"]
      : []),
    ...(!stringField(intentSummary, "requested_recipient_ref")
      ? ["requested_recipient_ref_missing"]
      : []),
    ...(!stringField(intentSummary, "requested_payload_format")
      ? ["requested_payload_format_missing"]
      : []),
    ...(!stringField(intentSummary, "payload_hash")
      ? ["payload_hash_missing"]
      : []),
    ...(!stringField(intentSummary, "payload_type")
      ? ["payload_type_missing"]
      : []),
    ...boundaryProblemReasons(intentSummary).map(
      (reason) => `intent_record_summary_${reason}`,
    ),
    ...boundaryProblemReasons(recordField(intentRecord, "external_delivery_boundary")).map(
      (reason) => `intent_record_external_delivery_boundary_${reason}`,
    ),
  ]);
}

function providerConfigGateSummary({
  requestedExecutionSurface,
  executionProfileRefInput,
  executionProfileRef,
  providerProfileRef,
  requestedRecipientRef,
}: {
  requestedExecutionSurface: ProviderSpecificDeliveryExecutionSurface | null;
  executionProfileRefInput: unknown;
  executionProfileRef: string | null;
  providerProfileRef: string | null;
  requestedRecipientRef: string | null;
}): ProviderSpecificDeliveryProviderConfigGateSummary {
  if (!requestedExecutionSurface) {
    return {
      execution_profile_ref: executionProfileRef,
      config_ref_present: false,
      config_ref_status: "missing",
      config_runtime_verified: false,
      provider_call_tested: false,
      future_runtime_provider_gate_required: true,
      problem_reasons: ["requested_execution_surface_missing"],
    };
  }
  const family = executionSurfaceFamily(requestedExecutionSurface);
  const unsafe =
    executionProfileRefInput !== undefined && !executionProfileRef;
  const unsafeProviderProfile = Boolean(providerProfileRef) && !safeRef(providerProfileRef);
  const missing =
    family !== "manual" && executionProfileRefInput === undefined;
  const mismatch =
    executionProfileRef !== null &&
    !executionProfileMatchesFamily(executionProfileRef, family);
  const providerMismatch =
    family !== "manual" &&
    providerProfileRef !== null &&
    !providerProfileMatchesFamily(providerProfileRef, family);
  const recipientMismatch =
    requestedRecipientRef !== null &&
    !recipientMatchesFamily(requestedRecipientRef, family);
  const problemReasons = uniqueStrings([
    ...(unsafe ? ["execution_profile_ref_unsafe"] : []),
    ...(unsafeProviderProfile ? ["provider_profile_ref_unsafe"] : []),
    ...(missing ? ["execution_profile_ref_missing"] : []),
    ...(mismatch ? ["execution_profile_ref_surface_mismatch"] : []),
    ...(providerMismatch ? ["provider_profile_ref_surface_mismatch"] : []),
    ...(recipientMismatch ? ["requested_recipient_ref_surface_mismatch"] : []),
  ]);
  return {
    execution_profile_ref: executionProfileRef,
    config_ref_present: Boolean(executionProfileRef),
    config_ref_status:
      family === "manual" && !executionProfileRef
        ? "not_required_for_manual_operator_delivery"
        : unsafe || unsafeProviderProfile
          ? "unsafe"
          : mismatch || providerMismatch || recipientMismatch
            ? "surface_mismatch"
            : executionProfileRef
              ? "safe_ref_only"
              : "missing",
    config_runtime_verified: false,
    provider_call_tested: false,
    future_runtime_provider_gate_required: true,
    problem_reasons: problemReasons,
  };
}

function refProblemReasons({
  requestedProviderSurface,
  requestedExecutionSurface,
  executionProfileRefInput,
  executionProfileRef,
  providerProfileRef,
  requestedRecipientRef,
  requestedPayloadFormat,
}: {
  requestedProviderSurface: ProviderSpecificExternalDeliverySurface | null;
  requestedExecutionSurface: ProviderSpecificDeliveryExecutionSurface | null;
  executionProfileRefInput: unknown;
  executionProfileRef: string | null;
  providerProfileRef: string | null;
  requestedRecipientRef: string | null;
  requestedPayloadFormat: string | null;
}): string[] {
  const family = requestedExecutionSurface
    ? executionSurfaceFamily(requestedExecutionSurface)
    : null;
  const providerFamily = requestedProviderSurface
    ? providerSurfaceFamily(requestedProviderSurface)
    : null;
  return uniqueStrings([
    ...(executionProfileRefInput !== undefined && !executionProfileRef
      ? ["execution_profile_ref_unsafe"]
      : []),
    ...(providerProfileRef && !safeRef(providerProfileRef)
      ? ["provider_profile_ref_unsafe"]
      : []),
    ...(requestedRecipientRef && !safeRef(requestedRecipientRef)
      ? ["requested_recipient_ref_unsafe"]
      : []),
    ...(requestedPayloadFormat && !safeRef(requestedPayloadFormat)
      ? ["requested_payload_format_unsafe"]
      : []),
    ...(requestedPayloadFormat && !supportedPayloadFormats.has(requestedPayloadFormat)
      ? ["requested_payload_format_unsupported"]
      : []),
    ...(family && providerFamily && family !== providerFamily
      ? ["provider_surface_execution_surface_mismatch"]
      : []),
    ...(family && providerProfileRef && !providerProfileMatchesFamily(providerProfileRef, family)
      ? ["provider_profile_ref_surface_mismatch"]
      : []),
    ...(family && requestedRecipientRef && !recipientMatchesFamily(requestedRecipientRef, family)
      ? ["requested_recipient_ref_surface_mismatch"]
      : []),
  ]);
}

function lineageGateSummary({
  providerPreview,
  intentPreview,
  intentSummary,
  intentRecord,
  sourceProviderPreviewFingerprint,
  sourceExternalRecordRef,
  sourceLocalFulfillmentRef,
  sourceExportedArtifactRef,
}: {
  providerPreview: ProviderSpecificExternalDeliveryPreviewContract | null;
  intentPreview: ProviderSpecificDeliveryIntentContractPreview | null;
  intentSummary: RecordValue | null;
  intentRecord: RecordValue | null;
  sourceProviderPreviewFingerprint: string | null;
  sourceExternalRecordRef: string | null;
  sourceLocalFulfillmentRef: string | null;
  sourceExportedArtifactRef: string | null;
}): ProviderSpecificDeliveryLineageGateSummary {
  const providerPreviewFingerprint = providerPreview?.preview_fingerprint ?? null;
  const intentRecordProviderPreviewFingerprint =
    sourceProviderPreviewFingerprint ??
    stringField(intentRecord, "source_provider_specific_preview_fingerprint");
  const intentPreviewProviderPreviewFingerprint =
    intentPreview?.source_provider_specific_preview_fingerprint ?? null;
  const providerExternalRef =
    providerPreview?.source_external_handoff_delivery_contract_record_ref ?? null;
  const providerLocalRef = providerPreview?.source_local_fulfillment_ref ?? null;
  const providerArtifactRef = providerPreview?.source_exported_artifact_ref ?? null;
  const problemReasons = uniqueStrings([
    ...(providerPreviewFingerprint &&
    intentRecordProviderPreviewFingerprint &&
    providerPreviewFingerprint !== intentRecordProviderPreviewFingerprint
      ? ["provider_specific_preview_to_intent_record_fingerprint_mismatch"]
      : []),
    ...(intentPreviewProviderPreviewFingerprint &&
    intentRecordProviderPreviewFingerprint &&
    intentPreviewProviderPreviewFingerprint !== intentRecordProviderPreviewFingerprint
      ? ["provider_specific_intent_preview_to_record_fingerprint_mismatch"]
      : []),
    ...(providerExternalRef &&
    sourceExternalRecordRef &&
    providerExternalRef !== sourceExternalRecordRef
      ? ["provider_preview_to_intent_external_contract_ref_mismatch"]
      : []),
    ...(providerLocalRef &&
    sourceLocalFulfillmentRef &&
    providerLocalRef !== sourceLocalFulfillmentRef
      ? ["provider_preview_to_intent_local_fulfillment_ref_mismatch"]
      : []),
    ...(providerArtifactRef &&
    sourceExportedArtifactRef &&
    providerArtifactRef !== sourceExportedArtifactRef
      ? ["provider_preview_to_intent_exported_artifact_ref_mismatch"]
      : []),
    ...(!sourceExternalRecordRef && (providerPreview || intentSummary)
      ? ["downstream_intent_without_external_contract_ref"]
      : []),
  ]);
  return {
    gate_status:
      problemReasons.length > 0
        ? "blocked"
        : intentSummary
          ? "passed"
          : "insufficient_data",
    lineage_refs: {
      source_provider_specific_preview_fingerprint: providerPreviewFingerprint,
      intent_record_source_provider_specific_preview_fingerprint:
        intentRecordProviderPreviewFingerprint,
      source_external_handoff_delivery_contract_record_ref: providerExternalRef,
      intent_record_source_external_handoff_delivery_contract_record_ref:
        sourceExternalRecordRef,
      source_local_fulfillment_ref: providerLocalRef,
      intent_record_source_local_fulfillment_ref: sourceLocalFulfillmentRef,
      source_exported_artifact_ref: providerArtifactRef,
      intent_record_source_exported_artifact_ref: sourceExportedArtifactRef,
    },
    problem_reasons: problemReasons,
  };
}

function requirementSummary({
  requestedExecutionSurface,
  executionProfileRef,
  providerProfileRef,
  requestedRecipientRef,
  requestedPayloadFormat,
  payloadHash,
  sourceLocalFulfillmentRef,
  sourceExternalRecordRef,
  sourceExportedArtifactRef,
}: {
  requestedExecutionSurface: ProviderSpecificDeliveryExecutionSurface | null;
  executionProfileRef: string | null;
  providerProfileRef: string | null;
  requestedRecipientRef: string | null;
  requestedPayloadFormat: string | null;
  payloadHash: string | null;
  sourceLocalFulfillmentRef: string | null;
  sourceExternalRecordRef: string | null;
  sourceExportedArtifactRef: string | null;
}) {
  const family = requestedExecutionSurface
    ? executionSurfaceFamily(requestedExecutionSurface)
    : null;
  const requiredRefs = uniqueStrings([
    "provider_specific_delivery_intent_contract_record",
    "delivery_spine_loop_closure_read_model",
    "provider_specific_external_delivery_preview",
    "external_handoff_delivery_contract_record",
    "local_handoff_send_fulfillment",
    "exported_handoff_packet_artifact",
    "payload_hash",
    "requested_payload_format",
    "requested_recipient_ref",
    ...(family && family !== "manual" ? ["execution_profile_ref", "provider_profile_ref"] : []),
  ]);
  const missingRefs = uniqueStrings([
    ...(!sourceLocalFulfillmentRef ? ["source_local_fulfillment_ref"] : []),
    ...(!sourceExternalRecordRef ? ["source_external_handoff_delivery_contract_record_ref"] : []),
    ...(!sourceExportedArtifactRef ? ["source_exported_artifact_ref"] : []),
    ...(!payloadHash ? ["payload_hash"] : []),
    ...(!requestedPayloadFormat ? ["requested_payload_format"] : []),
    ...(!requestedRecipientRef ? ["requested_recipient_ref"] : []),
    ...(family && family !== "manual" && !executionProfileRef
      ? ["execution_profile_ref"]
      : []),
    ...(family && family !== "manual" && !providerProfileRef
      ? ["provider_profile_ref"]
      : []),
  ]);
  return {
    required_refs: requiredRefs,
    missing_refs: missingRefs,
    satisfied_requirements: requiredRefs.filter(
      (ref) => !missingRefs.includes(ref) && ref !== "provider_specific_delivery_intent_contract_record",
    ),
    future_execution_requirements: [
      "future_provider_specific_execution_contract_record_slice",
      "future_provider_runtime_config_gate",
      "future_operator_execution_approval",
      "future_provider_specific_send_slice",
      "provider_call_must_remain_unavailable_in_this_preview",
    ],
  };
}

function residualGateSummary(
  residual: RecordValue | null,
): ExternalHandoffDeliveryResidualGateSummary {
  const candidates = arrayOfRecords(residual?.residual_candidates);
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
  const hard = candidates.filter(isHardResidualCandidate);
  const warnings = candidates.filter(
    (candidate) =>
      !hard.includes(candidate) &&
      stringField(candidate, "category") === "external_delivery_boundary_pressure",
  );
  return {
    gate_status:
      hard.length > 0 ? "blocked" : warnings.length > 0 ? "warning_only" : "passed",
    hard_blocking_candidate_ids: uniqueStrings(
      hard.map((candidate) => stringField(candidate, "candidate_id")),
    ),
    warning_candidate_ids: uniqueStrings(
      warnings.map((candidate) => stringField(candidate, "candidate_id")),
    ),
    non_blocking_candidate_ids: uniqueStrings(
      candidates
        .filter((candidate) => !hard.includes(candidate) && !warnings.includes(candidate))
        .map((candidate) => stringField(candidate, "candidate_id")),
    ),
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

function combineResidualGates(
  ...gates: Array<ExternalHandoffDeliveryResidualGateSummary | RecordValue | null | undefined>
): ExternalHandoffDeliveryResidualGateSummary {
  const normalized = gates.filter(isResidualGate);
  if (normalized.length === 0) return residualGateSummary(null);
  const hardReasons = uniqueStrings(
    normalized.flatMap((gate) => stringArray(gate.hard_blocker_reasons)),
  );
  const warningReasons = uniqueStrings(
    normalized.flatMap((gate) => stringArray(gate.warning_reasons)),
  );
  return {
    gate_status:
      hardReasons.length > 0
        ? "blocked"
        : warningReasons.length > 0
          ? "warning_only"
          : "passed",
    hard_blocking_candidate_ids: uniqueStrings(
      normalized.flatMap((gate) => stringArray(gate.hard_blocking_candidate_ids)),
    ),
    warning_candidate_ids: uniqueStrings(
      normalized.flatMap((gate) => stringArray(gate.warning_candidate_ids)),
    ),
    non_blocking_candidate_ids: uniqueStrings(
      normalized.flatMap((gate) => stringArray(gate.non_blocking_candidate_ids)),
    ),
    hard_blocker_reasons: hardReasons,
    warning_reasons: warningReasons,
  };
}

function isHardResidualCandidate(candidate: RecordValue): boolean {
  if (candidateHasForbiddenResidualSignal(candidate)) return true;
  const category = stringField(candidate, "category");
  const status = stringField(candidate, "status");
  const severity = stringField(candidate, "severity");
  const materialized =
    arrayOfRecords(candidate.observed_signals).some(
      (signal) => signal.materialized_inconsistency === true,
    ) || stringArray(candidate.materialized_inconsistencies).length > 0;
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

function candidateHasForbiddenResidualSignal(candidate: RecordValue): boolean {
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
  return forbiddenResidualFragments.some((fragment) =>
    signalText.includes(fragment),
  );
}

function sourceMaterialBoundaryProblems(
  input: Record<string, unknown>,
): string[] {
  return uniqueStrings(
    Object.entries(input).flatMap(([label, value]) =>
      nestedBoundaryProblems(label, value),
    ),
  );
}

function nestedBoundaryProblems(label: string, value: unknown, depth = 0): string[] {
  const record = recordOrNull(value);
  if (!record) return [];
  const direct = boundaryFields.flatMap((field) =>
    record[field] === true ? [`${label}:${field}_true`] : [],
  );
  if (depth >= 3) return direct;
  const nestedObjects = [
    "external_delivery_boundary",
    "external_delivery",
    "explicit_non_delivery_boundary",
    "latest_fulfillment_summary",
    "summary",
    "latest_record",
    "latest_record_summary",
    "selected_record_summary",
  ].flatMap((field) => nestedBoundaryProblems(`${label}.${field}`, record[field], depth + 1));
  const nestedArrays = ["record_summaries", "records"].flatMap((field) =>
    arrayOfRecords(record[field]).flatMap((entry, index) =>
      nestedBoundaryProblems(`${label}.${field}[${index}]`, entry, depth + 1),
    ),
  );
  return [...direct, ...nestedObjects, ...nestedArrays];
}

function authorityProblemReasons(input: Record<string, unknown>): string[] {
  return uniqueStrings(
    Object.entries(input).flatMap(([label, value]) =>
      nestedAuthorityProblems(label, value),
    ),
  );
}

function nestedAuthorityProblems(label: string, value: unknown, depth = 0): string[] {
  const record = recordOrNull(value);
  if (!record) return [];
  const authority = recordField(record, "authority_boundary");
  const direct = forbiddenAuthorityTrueFields.flatMap((field) =>
    authority?.[field] === true
      ? [`${label}:authority_boundary_forbidden_true:${field}`]
      : [],
  );
  if (depth >= 2) return direct;
  const nested = [
    "latest_record",
    "selected_record_summary",
    "latest_record_summary",
    "summary",
  ].flatMap((field) => nestedAuthorityProblems(`${label}.${field}`, record[field], depth + 1));
  return [...direct, ...nested];
}

function boundaryProblemReasons(value: unknown): string[] {
  const record = recordOrNull(value);
  if (!record) return [];
  return boundaryFields.flatMap((field) =>
    record[field] === true ? [`${field}_true`] : [],
  );
}

function selectIntentRecord(
  review: ProviderSpecificDeliveryIntentContractRecordReview | null,
  summary: RecordValue | null,
): RecordValue | null {
  const records = arrayOfRecords(review?.records);
  const recordId = stringField(summary, "record_id");
  return records.find((record) => stringField(record, "record_id") === recordId) ?? records[0] ?? null;
}

function mapProviderSurfaceToExecutionSurface(
  surface: ProviderSpecificExternalDeliverySurface | null,
): ProviderSpecificDeliveryExecutionSurface | null {
  if (surface === "manual_operator_delivery") {
    return "manual_operator_delivery_execution_preview";
  }
  if (surface === "email_delivery_preview") return "email_delivery_execution_preview";
  if (surface === "slack_delivery_preview") return "slack_delivery_execution_preview";
  if (surface === "webhook_delivery_preview") return "webhook_delivery_execution_preview";
  return null;
}

function toExecutionSurface(
  value: unknown,
): ProviderSpecificDeliveryExecutionSurface | null {
  return typeof value === "string" &&
    supportedExecutionSurfaces.has(value as ProviderSpecificDeliveryExecutionSurface)
    ? (value as ProviderSpecificDeliveryExecutionSurface)
    : null;
}

function toProviderSurface(
  value: unknown,
): ProviderSpecificExternalDeliverySurface | null {
  return value === "manual_operator_delivery" ||
    value === "email_delivery_preview" ||
    value === "slack_delivery_preview" ||
    value === "webhook_delivery_preview"
    ? value
    : null;
}

function executionSurfaceFamily(
  surface: ProviderSpecificDeliveryExecutionSurface,
): "manual" | "email" | "slack" | "webhook" {
  if (surface === "email_delivery_execution_preview") return "email";
  if (surface === "slack_delivery_execution_preview") return "slack";
  if (surface === "webhook_delivery_execution_preview") return "webhook";
  return "manual";
}

function providerSurfaceFamily(
  surface: ProviderSpecificExternalDeliverySurface,
): "manual" | "email" | "slack" | "webhook" {
  if (surface === "email_delivery_preview") return "email";
  if (surface === "slack_delivery_preview") return "slack";
  if (surface === "webhook_delivery_preview") return "webhook";
  return "manual";
}

function executionProfileMatchesFamily(ref: string, family: string): boolean {
  return ref.startsWith(`execution-profile:${family}:`);
}

function providerProfileMatchesFamily(ref: string, family: string): boolean {
  if (family === "manual") return !ref || ref.startsWith("provider-profile:manual:");
  return ref.startsWith(`provider-profile:${family}:`);
}

function recipientMatchesFamily(ref: string, family: string): boolean {
  if (family === "manual") {
    return ref === "recipient:operator" || ref.startsWith("recipient:manual:");
  }
  if (family === "email") return ref.startsWith("recipient:email:");
  if (family === "slack") {
    return (
      ref.startsWith("recipient:slack:") ||
      ref.startsWith("recipient:slack-channel:") ||
      ref.startsWith("recipient:slack-user:")
    );
  }
  return ref.startsWith("recipient:webhook:") || ref.startsWith("endpoint-ref:webhook:");
}

function safeRef(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    !/[<>{}\n\r\t]/.test(value) &&
    !unsafeRefPattern.test(value)
    ? value
    : null;
}

function isDeliverySpine(value: unknown): value is DeliverySpineLoopClosureReadModel {
  return Boolean(
    isRecord(value) &&
      value.read_model_version === DELIVERY_SPINE_LOOP_CLOSURE_READ_MODEL_VERSION &&
      value.scope === DELIVERY_SPINE_LOOP_CLOSURE_SCOPE,
  );
}

function isIntentPreview(
  value: unknown,
): value is ProviderSpecificDeliveryIntentContractPreview {
  return Boolean(
    isRecord(value) &&
      value.preview_version === PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_PREVIEW_VERSION,
  );
}

function isIntentRecordReview(
  value: unknown,
): value is ProviderSpecificDeliveryIntentContractRecordReview {
  return Boolean(
    isRecord(value) &&
      value.review_version ===
        PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_REVIEW_VERSION,
  );
}

function isProviderPreview(
  value: unknown,
): value is ProviderSpecificExternalDeliveryPreviewContract {
  return Boolean(
    isRecord(value) &&
      value.preview_version ===
        PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_PREVIEW_CONTRACT_VERSION,
  );
}

function isResidualGate(value: unknown): value is ExternalHandoffDeliveryResidualGateSummary {
  return Boolean(
    isRecord(value) &&
      typeof value.gate_status === "string" &&
      Array.isArray(value.hard_blocker_reasons) &&
      Array.isArray(value.warning_reasons),
  );
}

function recordField(value: unknown, field: string): RecordValue | null {
  const record = recordOrNull(value);
  const child = record?.[field];
  return recordOrNull(child);
}

function stringField(value: unknown, field: string): string | null {
  const record = recordOrNull(value);
  const child = record?.[field];
  return typeof child === "string" && child.trim() ? child : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function arrayOfRecords(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
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

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(isNonEmptyString))];
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}
