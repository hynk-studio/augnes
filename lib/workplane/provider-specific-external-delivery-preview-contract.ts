import { createHash } from "node:crypto";

import {
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_PREVIEW_VERSION,
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_REVIEW_VERSION,
} from "@/types/external-handoff-delivery-contract";
import type {
  ExternalHandoffDeliveryResidualGateSummary,
} from "@/types/external-handoff-delivery-contract";
import {
  PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_PREVIEW_CONTRACT_VERSION,
  PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_SCOPE,
  type ProviderSpecificCapabilitySummary,
  type ProviderSpecificExternalDeliveryAuthorityBoundary,
  type ProviderSpecificExternalDeliveryBoundary,
  type ProviderSpecificExternalDeliveryInput,
  type ProviderSpecificExternalDeliveryPreviewContract,
  type ProviderSpecificExternalDeliveryPreviewStatus,
  type ProviderSpecificExternalDeliveryProviderProfileStatus,
  type ProviderSpecificExternalDeliverySurface,
  type ProviderSpecificRecipientSummary,
  type ProviderSpecificRequirementSummary,
} from "@/types/provider-specific-external-delivery-preview-contract";

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
const hardResidualCategories = new Set([
  "authority_boundary_drift",
  "source_ref_lineage_mismatch",
  "local_fulfillment_upstream_gap",
  "no_side_effects_replay_inconsistency",
]);
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
  "can_write_handoff_send_record",
  "can_write_handoff_send_contract_record",
  "can_write_external_handoff_delivery_contract_record",
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
const forbiddenExternalBoundaryFields = [
  "delivery_performed",
  "provider_contract_present",
  "provider_specific_delivery",
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
const forbiddenSignalFragments = [
  "provider_called",
  "external_message_sent",
  "network_called",
  "network_send_performed",
  "can_write_db",
  "can_send_handoff",
  "can_call_send_provider",
  "can_write_memory",
  "can_render_workbench_action_button",
  "token",
  "secret",
  "raw_payload",
] as const;
const unsafeRefPattern =
  /raw_text|raw_report|raw_excerpt|raw_email_body|raw_message|raw_payload|secret|token|password|api[_-]?key|bearer|private|webhook\s*url|https?:\/\//i;

export function buildProviderSpecificExternalDeliveryPreviewContractV01(
  input: ProviderSpecificExternalDeliveryInput = {},
): ProviderSpecificExternalDeliveryPreviewContract {
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
  const residual = recordOrNull(input.residual_diagnostic_candidate_read_model);
  const asOf =
    input.as_of ??
    stringField(externalPreview, "as_of") ??
    stringField(externalRecordReview, "as_of") ??
    stringField(residual, "as_of") ??
    DEFAULT_AS_OF;
  const requestedProviderSurface = toProviderSurface(
    input.requested_provider_surface,
  );
  const selectedExternalRecordSummary = recordField(
    externalRecordReview,
    "selected_record_summary",
  );
  const latestExternalRecordSummary = recordField(
    externalRecordReview,
    "latest_record_summary",
  );
  const requestedPayloadFormat =
    safeRef(input.requested_payload_format) ??
    stringField(externalPreview, "payload_type") ??
    stringField(latestExternalRecordSummary, "payload_type");
  const providerProfileRef = safeProviderRef(input.requested_provider_profile_ref);
  const providerProfileUnsafe =
    typeof input.requested_provider_profile_ref === "string" &&
    input.requested_provider_profile_ref.trim().length > 0 &&
    !providerProfileRef;
  const sourceRecordSummary =
    selectedExternalRecordSummary ?? latestExternalRecordSummary;
  const sourceExternalRecordRef =
    stringField(sourceRecordSummary, "record_id") ?? null;
  const sourceLocalFulfillmentRef =
    stringField(externalPreview, "source_local_fulfillment_ref") ??
    stringField(sourceRecordSummary, "source_local_fulfillment_ref");
  const sourceSendContractRef =
    stringField(externalPreview, "source_handoff_send_contract_record_ref") ??
    stringField(sourceRecordSummary, "source_handoff_send_contract_record_ref");
  const sourceExportedArtifactRef =
    stringField(externalPreview, "source_exported_artifact_ref") ??
    stringField(sourceRecordSummary, "source_exported_artifact_ref");
  const sourceAppliedHandoffContextRef =
    stringField(externalPreview, "source_applied_handoff_context_ref");
  const payloadHash =
    stringField(externalPreview, "payload_hash") ??
    stringField(sourceRecordSummary, "payload_hash");
  const payloadType =
    stringField(externalPreview, "payload_type") ??
    stringField(sourceRecordSummary, "payload_type");
  const requestedRecipientRef =
    safeRef(input.requested_recipient_ref) ??
    stringField(externalPreview, "requested_recipient_ref") ??
    stringField(sourceRecordSummary, "requested_recipient_ref");
  const recipientUnsafe =
    typeof input.requested_recipient_ref === "string" &&
    input.requested_recipient_ref.trim().length > 0 &&
    !safeRef(input.requested_recipient_ref);
  const sourceRefs = uniqueStrings([
    ...(input.source_refs ?? []),
    ...stringArray(externalPreview?.source_refs),
    ...stringArray(externalRecordReview?.source_refs),
    ...stringArray(residual?.source_refs),
  ]);
  const evidenceRefs = uniqueStrings([
    ...(input.evidence_refs ?? []),
    ...stringArray(externalPreview?.evidence_refs),
    ...(payloadHash ? [payloadHash] : []),
    ...(sourceExternalRecordRef ? [sourceExternalRecordRef] : []),
  ]);
  const residualGate = residualGateSummary(residual);
  const authorityProblems = providerSpecificExternalDeliveryAuthorityProblemsV01({
    external_handoff_delivery_contract_preview: externalPreview,
    external_handoff_delivery_operator_decision_preview:
      input.external_handoff_delivery_operator_decision_preview,
    external_handoff_delivery_contract_record_review: externalRecordReview,
    workbench_spine_consolidation: input.workbench_spine_consolidation,
    residual_diagnostic_candidate_read_model: residual,
    sent_handoff_read: input.sent_handoff_read,
    handoff_send_record_review: input.handoff_send_record_review,
    handoff_send_contract_record_review: input.handoff_send_contract_record_review,
    exported_handoff_packet_artifact_read:
      input.exported_handoff_packet_artifact_read,
    applied_handoff_context_read: input.applied_handoff_context_read,
  });
  const externalContractProblems = externalContractProblemReasons({
    externalPreview,
    externalRecordReview,
    sourceRecordSummary,
  });
  const providerProfileStatus = determineProviderProfileStatus({
    surface: requestedProviderSurface,
    providerProfileRef,
    providerProfileUnsafe,
  });
  const providerRequirementSummary = requirementSummary({
    surface: requestedProviderSurface,
    providerProfileRef,
    requestedRecipientRef,
    payloadHash,
    requestedPayloadFormat,
  });
  const providerCapabilitySummary = capabilitySummary(
    requestedProviderSurface,
    providerProfileStatus,
  );
  const providerSpecificRecipientSummary: ProviderSpecificRecipientSummary = {
    requested_recipient_ref: requestedRecipientRef ?? null,
    recipient_ref_safe: Boolean(requestedRecipientRef) && !recipientUnsafe,
    recipient_surface: requestedProviderSurface,
    raw_recipient_material_rejected: recipientUnsafe,
  };
  const profileBlockers = uniqueStrings([
    ...(providerProfileUnsafe ? ["provider_profile_ref_unsafe"] : []),
    ...(requestedProviderSurface &&
    requestedProviderSurface !== "manual_operator_delivery" &&
    !providerProfileRef
      ? ["provider_profile_ref_missing"]
      : []),
  ]);
  const providerBlockers = uniqueStrings([
    ...(!requestedProviderSurface ? ["unsupported_provider_surface"] : []),
    ...(recipientUnsafe ? ["requested_recipient_ref_unsafe"] : []),
    ...(!requestedRecipientRef ? ["requested_recipient_ref_missing"] : []),
    ...(!payloadHash ? ["payload_hash_missing"] : []),
    ...(requestedPayloadFormat &&
    !supportedPayloadFormats.has(requestedPayloadFormat)
      ? ["payload_format_unsupported"]
      : []),
    ...profileBlockers,
  ]);
  const blockerReasons = uniqueStrings([
    ...externalContractProblems,
    ...providerBlockers,
    ...residualGate.hard_blocker_reasons,
    ...authorityProblems,
  ]);
  const warningReasons = uniqueStrings([
    ...residualGate.warning_reasons,
    ...(requestedProviderSurface === "manual_operator_delivery"
      ? ["manual_operator_delivery_requires_future_human_execution"]
      : ["provider_configuration_not_verified_by_runtime_call"]),
  ]);
  const status = determineStatus({
    requestedProviderSurface,
    providerProfileStatus,
    recipientUnsafe,
    requestedRecipientRef,
    requestedPayloadFormat,
    authorityProblems,
    residualGate,
    externalContractProblems,
    providerBlockers,
  });
  const ready = status === "ready_for_provider_specific_decision";
  const previewBase = {
    preview_version: PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_PREVIEW_CONTRACT_VERSION,
    scope: PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_SCOPE,
    as_of: asOf,
    status,
    requested_provider_surface: requestedProviderSurface,
    provider_profile_ref: providerProfileRef,
    provider_profile_status: providerProfileStatus,
    source_external_handoff_delivery_contract_record_ref: sourceExternalRecordRef,
    source_external_handoff_delivery_contract_preview_fingerprint:
      stringField(externalPreview, "preview_fingerprint"),
    source_local_fulfillment_ref: sourceLocalFulfillmentRef,
    source_handoff_send_contract_record_ref: sourceSendContractRef,
    source_exported_artifact_ref: sourceExportedArtifactRef,
    source_applied_handoff_context_ref: sourceAppliedHandoffContextRef,
    payload_hash: payloadHash,
    payload_type: payloadType,
    requested_payload_format: requestedPayloadFormat,
    requested_recipient_ref: requestedRecipientRef,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
  };
  const previewFingerprint = fingerprint(previewBase);
  return {
    ...previewBase,
    preview_fingerprint: previewFingerprint,
    requested_provider_surface: requestedProviderSurface,
    provider_profile_ref: providerProfileRef,
    source_local_fulfillment_ref: sourceLocalFulfillmentRef ?? null,
    source_handoff_send_contract_record_ref: sourceSendContractRef ?? null,
    source_exported_artifact_ref: sourceExportedArtifactRef ?? null,
    source_applied_handoff_context_ref: sourceAppliedHandoffContextRef ?? null,
    payload_hash: payloadHash ?? null,
    payload_type: payloadType ?? null,
    requested_payload_format: requestedPayloadFormat ?? null,
    requested_recipient_ref: requestedRecipientRef ?? null,
    provider_capability_summary: providerCapabilitySummary,
    provider_specific_recipient_summary: providerSpecificRecipientSummary,
    readiness_summary: {
      external_contract_ready: externalContractProblems.length === 0,
      external_contract_record_available: Boolean(sourceExternalRecordRef),
      provider_surface_supported: Boolean(requestedProviderSurface),
      provider_profile_ref_present: Boolean(providerProfileRef),
      provider_profile_ref_safe:
        providerProfileStatus === "safe_ref_available" ||
        providerProfileStatus === "not_required_for_manual_operator_delivery",
      recipient_ref_present: Boolean(requestedRecipientRef),
      recipient_ref_safe: Boolean(requestedRecipientRef) && !recipientUnsafe,
      payload_hash_present: Boolean(payloadHash),
      payload_format_supported: Boolean(
        requestedPayloadFormat &&
          supportedPayloadFormats.has(requestedPayloadFormat),
      ),
      residual_gate_passed: residualGate.hard_blocker_reasons.length === 0,
      authority_boundary_passed: authorityProblems.length === 0,
      external_delivery_not_performed: externalContractProblems.length === 0,
      provider_specific_decision_ready: ready,
    },
    provider_requirement_summary: providerRequirementSummary,
    residual_gate_summary: residualGate,
    external_delivery_boundary: createProviderSpecificExternalDeliveryBoundaryV01(),
    authority_boundary:
      createProviderSpecificExternalDeliveryAuthorityBoundaryV01(),
    would_not_do: [
      "does_not_perform_external_delivery",
      "does_not_call_provider_email_slack_webhook_github_codex_provider_runtime_browser_crawler_or_network",
      "does_not_read_provider_secrets_environment_or_live_provider_state",
      "does_not_write_clipboard_download_or_file",
      "does_not_mutate_cwp_handoff_relay_memory_metrics_or_global_state",
      "does_not_create_route_or_workbench_action_button",
    ],
    non_goals: [
      "external_handoff_delivery_execution",
      "provider_sdk_integration",
      "provider_credential_storage_or_discovery",
      "email_slack_webhook_delivery",
      "clipboard_download_file_export_behavior",
      "durable_provider_specific_delivery_record",
      "autonomy_runner_scheduler_daemon_or_multi_agent_execution",
    ],
  };
}

export function createProviderSpecificExternalDeliveryBoundaryV01():
  ProviderSpecificExternalDeliveryBoundary {
  return {
    delivery_performed: false,
    provider_contract_present: false,
    provider_specific_delivery: false,
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

export function createProviderSpecificExternalDeliveryAuthorityBoundaryV01():
  ProviderSpecificExternalDeliveryAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    preview_only: true,
    provider_specific_preview_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_route: false,
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
    can_write_handoff_send_record: false,
    can_write_handoff_send_contract_record: false,
    can_write_external_handoff_delivery_contract_record: false,
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
      "Provider-specific delivery preview is read-only and advisory-only.",
      "Provider configuration is accepted only as public-safe refs and is never discovered by runtime calls.",
    ],
  };
}

export function providerSpecificExternalDeliveryAuthorityProblemsV01(
  values: Record<string, unknown>,
): string[] {
  return uniqueStrings(
    Object.entries(values).flatMap(([label, value]) =>
      authorityProblemReasons(label, value),
    ),
  );
}

export function fingerprintProviderSpecificExternalDeliveryValueV01(
  value: unknown,
): string {
  return fingerprint(value);
}

function determineStatus({
  requestedProviderSurface,
  providerProfileStatus,
  recipientUnsafe,
  requestedRecipientRef,
  requestedPayloadFormat,
  authorityProblems,
  residualGate,
  externalContractProblems,
  providerBlockers,
}: {
  requestedProviderSurface: ProviderSpecificExternalDeliverySurface | null;
  providerProfileStatus: ProviderSpecificExternalDeliveryProviderProfileStatus;
  recipientUnsafe: boolean;
  requestedRecipientRef: string | null | undefined;
  requestedPayloadFormat: string | null | undefined;
  authorityProblems: string[];
  residualGate: ExternalHandoffDeliveryResidualGateSummary;
  externalContractProblems: string[];
  providerBlockers: string[];
}): ProviderSpecificExternalDeliveryPreviewStatus {
  if (authorityProblems.length > 0) return "authority_boundary_blocked";
  if (residualGate.hard_blocker_reasons.length > 0) return "residual_gate_blocked";
  if (externalContractProblems.includes("external_contract_missing")) {
    return "external_contract_missing";
  }
  if (externalContractProblems.length > 0) return "external_contract_not_ready";
  if (!requestedProviderSurface) return "insufficient_data";
  if (providerProfileStatus === "unsafe") return "provider_profile_invalid";
  if (providerProfileStatus === "missing") return "provider_profile_missing";
  if (recipientUnsafe || !requestedRecipientRef) return "recipient_missing";
  if (
    requestedPayloadFormat &&
    !supportedPayloadFormats.has(requestedPayloadFormat)
  ) {
    return "payload_format_unsupported";
  }
  if (providerBlockers.length > 0) return "blocked";
  return "ready_for_provider_specific_decision";
}

function externalContractProblemReasons({
  externalPreview,
  externalRecordReview,
  sourceRecordSummary,
}: {
  externalPreview: RecordValue | null;
  externalRecordReview: RecordValue | null;
  sourceRecordSummary: RecordValue | null;
}): string[] {
  const hasReadyPreview =
    externalPreview?.status === "ready_for_contract_decision" &&
    boundaryFlagsFalse(recordField(externalPreview, "external_delivery_boundary"));
  const hasValidRecord =
    (externalRecordReview?.review_status === "records_available" ||
      externalRecordReview?.review_status === "selected_record_found") &&
    Boolean(sourceRecordSummary?.record_id) &&
    sourceRecordSummary?.delivery_performed === false &&
    sourceRecordSummary?.provider_called === false &&
    sourceRecordSummary?.external_message_sent === false;
  if (externalRecordReview?.review_status === "records_invalid") {
    return ["external_handoff_delivery_contract_record_review_invalid"];
  }
  if (!externalPreview && !externalRecordReview) return ["external_contract_missing"];
  return uniqueStrings([
    ...(!hasReadyPreview && !hasValidRecord
      ? ["external_handoff_delivery_contract_not_ready"]
      : []),
    ...externalBoundaryProblemReasons(
      recordField(externalPreview, "external_delivery_boundary"),
      "external_handoff_delivery_contract_preview",
    ),
    ...recordSummaryBoundaryProblems(sourceRecordSummary),
  ]);
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
  const nonBlocking = candidates.filter(
    (candidate) => !hard.includes(candidate) && !warnings.includes(candidate),
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
    non_blocking_candidate_ids: uniqueStrings(
      nonBlocking.map((candidate) => stringField(candidate, "candidate_id")),
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

function isHardResidualCandidate(candidate: RecordValue): boolean {
  const category = stringField(candidate, "category");
  const status = stringField(candidate, "status");
  const severity = stringField(candidate, "severity");
  const materialized =
    arrayOfRecords(candidate.observed_signals).some(
      (signal) => signal.materialized_inconsistency === true,
    ) || stringArray(candidate.materialized_inconsistencies).length > 0;
  const observedText = [
    ...stringArray(candidate.materialized_inconsistencies),
    ...arrayOfRecords(candidate.observed_signals).map(
      (signal) => stringField(signal, "summary") ?? "",
    ),
  ].join(" ");
  if (
    forbiddenSignalFragments.some((fragment) =>
      observedText.toLowerCase().includes(fragment),
    )
  ) {
    return true;
  }
  if (!category) return false;
  if (hardResidualCategories.has(category as never)) {
    return status === "actionable_candidate" || severity === "high" || materialized;
  }
  if (category === "route_integration_mode_mismatch") {
    return status === "actionable_candidate";
  }
  if (category === "review_writer_validation_drift") {
    return status === "actionable_candidate" && materialized;
  }
  return false;
}

function determineProviderProfileStatus({
  surface,
  providerProfileRef,
  providerProfileUnsafe,
}: {
  surface: ProviderSpecificExternalDeliverySurface | null;
  providerProfileRef: string | null;
  providerProfileUnsafe: boolean;
}): ProviderSpecificExternalDeliveryProviderProfileStatus {
  if (providerProfileUnsafe) return "unsafe";
  if (surface === "manual_operator_delivery") {
    return "not_required_for_manual_operator_delivery";
  }
  if (!surface) return "not_configured";
  return providerProfileRef ? "safe_ref_available" : "missing";
}

function capabilitySummary(
  surface: ProviderSpecificExternalDeliverySurface | null,
  providerProfileStatus: ProviderSpecificExternalDeliveryProviderProfileStatus,
): ProviderSpecificCapabilitySummary {
  const requiresProviderProfile = Boolean(
    surface && surface !== "manual_operator_delivery",
  );
  return {
    provider_surface: surface,
    requires_provider_profile_ref: requiresProviderProfile,
    requires_provider_token: false,
    requires_recipient_ref: true,
    requires_payload_hash: true,
    requires_payload_format: true,
    provider_config_status:
      surface === "manual_operator_delivery"
        ? "not_required"
        : providerProfileStatus === "safe_ref_available"
          ? "safe_ref_only"
          : "not_configured",
    validates_by_provider_call: false,
    delivery_execution_available: false,
    future_delivery_slice_required: true,
  };
}

function requirementSummary({
  surface,
  providerProfileRef,
  requestedRecipientRef,
  payloadHash,
  requestedPayloadFormat,
}: {
  surface: ProviderSpecificExternalDeliverySurface | null;
  providerProfileRef: string | null;
  requestedRecipientRef: string | null | undefined;
  payloadHash: string | null | undefined;
  requestedPayloadFormat: string | null | undefined;
}): ProviderSpecificRequirementSummary {
  const requiredRefs = uniqueStrings([
    "source_external_handoff_delivery_contract",
    "source_local_fulfillment_ref",
    "source_exported_artifact_ref",
    "payload_hash",
    "requested_recipient_ref",
    ...(surface && surface !== "manual_operator_delivery"
      ? ["provider_profile_ref"]
      : []),
  ]);
  return {
    required_refs: requiredRefs,
    missing_refs: uniqueStrings([
      ...(!surface ? ["requested_provider_surface"] : []),
      ...(!payloadHash ? ["payload_hash"] : []),
      ...(!requestedRecipientRef ? ["requested_recipient_ref"] : []),
      ...(surface && surface !== "manual_operator_delivery" && !providerProfileRef
        ? ["provider_profile_ref"]
        : []),
      ...(!requestedPayloadFormat ? ["requested_payload_format"] : []),
    ]),
    satisfied_requirements: uniqueStrings([
      ...(surface ? ["requested_provider_surface"] : []),
      ...(payloadHash ? ["payload_hash"] : []),
      ...(requestedRecipientRef ? ["requested_recipient_ref"] : []),
      ...(providerProfileRef ? ["provider_profile_ref"] : []),
      ...(requestedPayloadFormat ? ["requested_payload_format"] : []),
    ]),
    provider_specific_future_requirements: [
      "future_provider_specific_delivery_contract",
      "future_explicit_operator_delivery_approval",
      "future_provider_configuration_validation_without_secret_leakage",
      "future_delivery_execution_slice",
    ],
  };
}

function authorityProblemReasons(label: string, value: unknown): string[] {
  const record = recordOrNull(value);
  if (!record) return [];
  const authority = recordField(record, "authority_boundary");
  const externalBoundary =
    recordField(record, "external_delivery_boundary") ??
    recordField(record, "external_delivery");
  return uniqueStrings([
    ...forbiddenAuthorityTrueFields
      .filter((field) => authority?.[field] === true)
      .map((field) => `${label}:authority_boundary_forbidden_true:${field}`),
    ...externalBoundaryProblemReasons(externalBoundary, label),
  ]);
}

function externalBoundaryProblemReasons(
  boundary: RecordValue | null,
  label: string,
): string[] {
  if (!boundary) return [];
  return forbiddenExternalBoundaryFields.flatMap((field) =>
    boundary[field] === true
      ? [`${label}:external_delivery_boundary_forbidden_true:${field}`]
      : [],
  );
}

function recordSummaryBoundaryProblems(summary: RecordValue | null): string[] {
  if (!summary) return [];
  return [
    ...(summary.delivery_performed === true
      ? ["external_contract_record_delivery_performed_true"]
      : []),
    ...(summary.provider_called === true
      ? ["external_contract_record_provider_called_true"]
      : []),
    ...(summary.external_message_sent === true
      ? ["external_contract_record_external_message_sent_true"]
      : []),
    ...stringArray(summary.problem_reasons).filter((reason) =>
      /provider|delivery|network|email|slack|webhook|clipboard|download|local_fulfillment_is_external_delivery/.test(
        reason,
      ),
    ),
  ];
}

function boundaryFlagsFalse(boundary: RecordValue | null): boolean {
  if (!boundary) return false;
  return forbiddenExternalBoundaryFields.every((field) => boundary[field] !== true);
}

function safeRef(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    !/[<>{}\n\r\t]/.test(value) &&
    !unsafeRefPattern.test(value)
    ? value
    : null;
}

function safeProviderRef(value: unknown): string | null {
  return safeRef(value);
}

function toProviderSurface(
  value: unknown,
): ProviderSpecificExternalDeliverySurface | null {
  return typeof value === "string" && supportedSurfaces.has(value as never)
    ? (value as ProviderSpecificExternalDeliverySurface)
    : null;
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

function recordField(value: unknown, key: string): RecordValue | null {
  return isRecord(value) && isRecord(value[key]) ? value[key] : null;
}

function arrayOfRecords(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => isNonEmptyString(item))
    : [];
}

function stringField(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  return isNonEmptyString(value[key]) ? value[key] : null;
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

function fingerprint(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
