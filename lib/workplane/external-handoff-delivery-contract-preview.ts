import { createHash } from "node:crypto";

import {
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_PREVIEW_VERSION,
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_VERSION,
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
  type ExternalHandoffDeliveryBoundary,
  type ExternalHandoffDeliveryContractAuthorityBoundary,
  type ExternalHandoffDeliveryContractInput,
  type ExternalHandoffDeliveryContractPreview,
  type ExternalHandoffDeliveryContractPreviewStatus,
  type ExternalHandoffDeliveryContractRecordPreview,
  type ExternalHandoffDeliveryResidualGateSummary,
  type ExternalHandoffDeliverySurface,
} from "@/types/external-handoff-delivery-contract";

type RecordValue = Record<string, unknown>;

const DEFAULT_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const DEFAULT_DELIVERY_SURFACE =
  "future_external_delivery_contract_candidate" as const;

const hardResidualCategories = new Set([
  "authority_boundary_drift",
  "source_ref_lineage_mismatch",
  "local_fulfillment_upstream_gap",
  "no_side_effects_replay_inconsistency",
] as const);

const forbiddenAuthorityTrueFields = [
  "source_of_truth",
  "can_write_db",
  "can_create_schema",
  "can_create_route",
  "can_call_route",
  "can_create_source_of_truth_store",
  "can_create_external_delivery_contract_record",
  "can_create_external_delivery_contract_receipt",
  "can_mutate_current_working_perspective",
  "can_mutate_handoff_context",
  "can_write_selected_refs_to_live_handoff",
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
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_write_handoff_send_record",
  "can_write_handoff_send_contract_record",
  "can_write_handoff_packet_copy_export_record",
  "can_write_handoff_packet_exported_artifact",
  "can_write_handoff_packet_copy_export_contract_record",
  "can_write_handoff_context_apply_record",
  "can_write_applied_handoff_context_snapshot",
  "can_write_handoff_context_update_contract_record",
  "can_modify_api_perspective_current_route",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_current_working_perspective_apply_record",
  "can_write_current_working_perspective_update_contract_record",
  "can_write_route_integration_contract_record",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_write_continuity_relay",
  "can_update_continuity_relay",
  "can_apply_live_relay_state",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_write_dogfood_metrics",
  "can_update_global_dogfood_metrics",
  "can_write_dogfood_metric_snapshot",
  "can_write_reuse_outcome_ledger",
  "can_write_expected_observed_delta",
  "can_write_work_episode",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
  "can_render_workbench_action_button",
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
] as const;

export function createExternalHandoffDeliveryBoundaryV01():
  ExternalHandoffDeliveryBoundary {
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
  };
}

export function createExternalHandoffDeliveryContractAuthorityBoundaryV01({
  writeNow = false,
}: {
  writeNow?: boolean;
} = {}): ExternalHandoffDeliveryContractAuthorityBoundary {
  return {
    read_only: !writeNow,
    advisory_only: !writeNow,
    contract_only: true,
    source_of_truth: false,
    can_write_db: writeNow,
    can_create_schema: writeNow,
    can_create_external_delivery_contract_record: writeNow,
    can_create_external_delivery_contract_receipt: writeNow,
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
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_mutate_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_handoff_send_record: false,
    can_write_handoff_send_contract_record: false,
    can_write_handoff_packet_copy_export_record: false,
    can_write_handoff_packet_exported_artifact: false,
    can_write_handoff_packet_copy_export_contract_record: false,
    can_write_handoff_context_apply_record: false,
    can_write_applied_handoff_context_snapshot: false,
    can_write_handoff_context_update_contract_record: false,
    can_modify_api_perspective_current_route: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_write_dogfood_metrics: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      writeNow
        ? "Writer authority is limited to a scoped local external handoff delivery contract record and receipt."
        : "Preview authority is read-only and contract-only.",
      "External delivery, provider calls, email, Slack, webhook, network, clipboard, file, memory, metrics, route, CWP, handoff, relay, GitHub, Codex, browser, crawler, graph, and RAG actions remain unavailable.",
    ],
  };
}

export function buildExternalHandoffDeliveryContractPreviewV01(
  input: ExternalHandoffDeliveryContractInput = {},
): ExternalHandoffDeliveryContractPreview {
  const spine = recordOrNull(input.workbench_spine_consolidation);
  const residual = recordOrNull(input.residual_diagnostic_candidate_read_model);
  const sentRead = recordOrNull(input.sent_handoff_read);
  const sendReview = recordOrNull(input.handoff_send_record_review);
  const sendContractReview = recordOrNull(
    input.handoff_send_contract_record_review,
  );
  const exportedArtifactRead = recordOrNull(
    input.exported_handoff_packet_artifact_read,
  );
  const appliedHandoffContextRead = recordOrNull(input.applied_handoff_context_read);
  const asOf =
    input.as_of ??
    stringField(spine, "as_of") ??
    stringField(residual, "as_of") ??
    DEFAULT_AS_OF;
  const sourceRefs = uniqueStrings([
    ...(input.source_refs ?? []),
    ...stringArray(spine?.source_refs),
    ...stringArray(residual?.source_refs),
    ...stringArray(sendReview?.source_refs),
    ...stringArray(sendContractReview?.source_refs),
  ]);
  const evidenceRefs = uniqueStrings([
    ...(input.evidence_refs ?? []),
    ...stringArray(recordField(sendReview, "evidence_summary")?.payload_hashes),
    ...stringArray(recordField(sendContractReview, "evidence_summary")?.evidence_refs),
  ]);
  const localStage = stageById(spine, "local_handoff_send_fulfillment");
  const artifactStage = stageById(spine, "exported_handoff_packet_artifact");
  const contractStage = stageById(spine, "handoff_send_contract_record");
  const localFulfillmentSummary = recordField(sentRead, "latest_fulfillment_summary");
  const sendLatestSummary = recordField(sendReview, "latest_record_summary");
  const contractLatestSummary = recordField(
    sendContractReview,
    "latest_record_summary",
  );
  const exportedSummary = recordField(exportedArtifactRead, "summary");
  const appliedSummary = recordField(appliedHandoffContextRead, "summary");

  const sourceLocalFulfillmentRef =
    stringField(localFulfillmentSummary, "record_id") ??
    stringField(sendLatestSummary, "record_id") ??
    stringField(localStage, "primary_ref");
  const sourceHandoffSendContractRecordRef =
    stringField(localFulfillmentSummary, "source_handoff_send_contract_record_ref") ??
    stringField(sendLatestSummary, "source_handoff_send_contract_record_ref") ??
    stringField(contractLatestSummary, "record_id") ??
    stringField(contractStage, "primary_ref");
  const sourceExportedArtifactRef =
    stringField(localFulfillmentSummary, "source_exported_artifact_ref") ??
    stringField(sendLatestSummary, "source_exported_artifact_ref") ??
    stringField(contractLatestSummary, "source_exported_artifact_ref") ??
    stringField(exportedSummary, "exported_artifact_ref") ??
    stringField(artifactStage, "primary_ref");
  const sourceAppliedHandoffContextRef =
    stringField(exportedSummary, "source_applied_handoff_context_snapshot_ref") ??
    stringField(appliedSummary, "applied_handoff_context_snapshot_ref");
  const payloadHash =
    stringField(localFulfillmentSummary, "payload_hash") ??
    stringField(sendLatestSummary, "payload_hash") ??
    stringField(contractLatestSummary, "payload_hash");
  const payloadType =
    stringField(localFulfillmentSummary, "payload_type") ??
    stringField(sendLatestSummary, "payload_type") ??
    stringField(exportedSummary, "packet_format");
  const requestedDeliveryMode =
    stringField(localFulfillmentSummary, "requested_delivery_mode") ??
    stringField(sendLatestSummary, "requested_delivery_mode");
  const requestedRecipientRef =
    stringField(localFulfillmentSummary, "requested_recipient_ref") ??
    stringField(sendLatestSummary, "requested_recipient_ref");
  const requestedDeliverySurface = toDeliverySurface(
    input.requested_delivery_surface,
  );
  const residualGate = residualGateSummary(residual);
  const authorityProblems = externalHandoffDeliveryAuthorityProblemsV01({
    workbench_spine_consolidation: spine,
    residual_diagnostic_candidate_read_model: residual,
    sent_handoff_read: sentRead,
    handoff_send_record_review: sendReview,
    handoff_send_contract_record_review: sendContractReview,
    exported_handoff_packet_artifact_read: exportedArtifactRead,
    applied_handoff_context_read: appliedHandoffContextRead,
    workbench_dogfood_loop_spine_overview:
      input.workbench_dogfood_loop_spine_overview,
  });
  const externalDelivery = recordField(spine, "external_delivery");
  const externalBoundaryProblems = externalBoundaryProblemReasons(externalDelivery);
  const localFulfilled =
    stringField(localStage, "status") === "fulfilled" ||
    stringField(sentRead, "status") === "latest_handoff_send_fulfillment_available";
  const hardBlockers = uniqueStrings([
    ...(stringField(spine, "dashboard_status") !== "local_fulfillment_available"
      ? ["workbench_spine_not_local_fulfillment_available"]
      : []),
    ...(stringField(localStage, "status") !== "fulfilled"
      ? ["local_handoff_send_fulfillment_stage_not_fulfilled"]
      : []),
    ...(stringField(artifactStage, "status") !== "exported"
      ? ["exported_handoff_packet_artifact_stage_not_exported"]
      : []),
    ...(stringField(contractStage, "status") !== "approved"
      ? ["handoff_send_contract_record_stage_not_approved"]
      : []),
    ...(!sourceLocalFulfillmentRef ? ["source_local_fulfillment_ref_missing"] : []),
    ...(!sourceHandoffSendContractRecordRef
      ? ["source_handoff_send_contract_record_ref_missing"]
      : []),
    ...(!sourceExportedArtifactRef ? ["source_exported_artifact_ref_missing"] : []),
    ...(!payloadHash ? ["payload_integrity_ref_missing"] : []),
    ...(!requestedDeliveryMode ? ["requested_delivery_mode_missing"] : []),
    ...(!requestedRecipientRef ? ["requested_recipient_ref_missing"] : []),
    ...externalBoundaryProblems,
  ]);
  const blockerReasons = uniqueStrings([
    ...hardBlockers,
    ...residualGate.hard_blocker_reasons,
    ...authorityProblems,
  ]);
  const warningReasons = uniqueStrings([
    ...residualGate.warning_reasons,
    ...(sourceAppliedHandoffContextRef
      ? []
      : ["source_applied_handoff_context_ref_missing_but_non_blocking"]),
  ]);
  const readinessSummary = {
    local_spine_ready:
      stringField(spine, "dashboard_status") === "local_fulfillment_available",
    local_fulfillment_stage_fulfilled:
      stringField(localStage, "status") === "fulfilled",
    exported_artifact_stage_exported:
      stringField(artifactStage, "status") === "exported",
    handoff_send_contract_stage_approved:
      stringField(contractStage, "status") === "approved",
    local_fulfillment_ref_present: Boolean(sourceLocalFulfillmentRef),
    exported_artifact_ref_present: Boolean(sourceExportedArtifactRef),
    payload_integrity_ref_present: Boolean(payloadHash),
    residual_gate_passed: residualGate.hard_blocker_reasons.length === 0,
    authority_boundary_passed: authorityProblems.length === 0,
    external_delivery_not_performed: externalBoundaryProblems.length === 0,
    contract_decision_ready: false,
  };
  const status = determineStatus({
    localFulfilled,
    authorityProblems,
    residualGate,
    hardBlockers,
    spine,
  });
  const previewBase = {
    preview_version: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_PREVIEW_VERSION,
    scope: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
    as_of: asOf,
    status,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    source_local_fulfillment_ref: sourceLocalFulfillmentRef,
    source_handoff_send_contract_record_ref: sourceHandoffSendContractRecordRef,
    source_exported_artifact_ref: sourceExportedArtifactRef,
    source_applied_handoff_context_ref: sourceAppliedHandoffContextRef,
    payload_hash: payloadHash,
    payload_type: payloadType,
    requested_delivery_mode: requestedDeliveryMode,
    requested_delivery_surface: requestedDeliverySurface,
    requested_recipient_ref: requestedRecipientRef,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    residual_gate_summary: residualGate,
  };
  const previewFingerprint = fingerprint(previewBase);
  const ready = status === "ready_for_contract_decision";
  const authorityBoundary =
    createExternalHandoffDeliveryContractAuthorityBoundaryV01();
  const recordPreview: ExternalHandoffDeliveryContractRecordPreview | null =
    ready &&
    sourceLocalFulfillmentRef &&
    sourceHandoffSendContractRecordRef &&
    sourceExportedArtifactRef &&
    payloadHash &&
    payloadType &&
    requestedDeliveryMode &&
    requestedRecipientRef
      ? {
          record_version: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_VERSION,
          scope: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
          source_preview_fingerprint: previewFingerprint,
          source_local_fulfillment_ref: sourceLocalFulfillmentRef,
          source_handoff_send_contract_record_ref:
            sourceHandoffSendContractRecordRef,
          source_exported_artifact_ref: sourceExportedArtifactRef,
          source_applied_handoff_context_ref: sourceAppliedHandoffContextRef,
          payload_hash: payloadHash,
          payload_type: payloadType,
          requested_delivery_mode: requestedDeliveryMode,
          requested_delivery_surface: requestedDeliverySurface,
          requested_recipient_ref: requestedRecipientRef,
          contract_status: "external_delivery_contract_candidate_recordable",
          external_delivery_boundary: createExternalHandoffDeliveryBoundaryV01(),
          source_refs: sourceRefs,
          evidence_refs: evidenceRefs.length
            ? evidenceRefs
            : [payloadHash, sourceLocalFulfillmentRef],
          residual_gate_summary: residualGate,
          authority_boundary: authorityBoundary,
          no_external_delivery_performed: true,
          no_provider_call_performed: true,
          no_external_message_sent: true,
        }
      : null;
  return {
    ...previewBase,
    preview_fingerprint: previewFingerprint,
    source_local_fulfillment_ref: sourceLocalFulfillmentRef ?? null,
    source_handoff_send_contract_record_ref:
      sourceHandoffSendContractRecordRef ?? null,
    source_exported_artifact_ref: sourceExportedArtifactRef ?? null,
    source_applied_handoff_context_ref: sourceAppliedHandoffContextRef ?? null,
    payload_hash: payloadHash ?? null,
    payload_type: payloadType ?? null,
    requested_delivery_mode: requestedDeliveryMode ?? null,
    requested_recipient_ref: requestedRecipientRef ?? null,
    readiness_summary: {
      ...readinessSummary,
      contract_decision_ready: ready,
    },
    external_delivery_boundary: createExternalHandoffDeliveryBoundaryV01(),
    authority_boundary: authorityBoundary,
    would_write_external_handoff_delivery_contract_record_preview: recordPreview,
    would_not_do: [
      "does_not_perform_external_delivery",
      "does_not_call_provider_email_slack_webhook_github_codex_openai_browser_crawler_or_network",
      "does_not_write_clipboard_download_or_file",
      "does_not_mutate_cwp_handoff_relay_memory_metrics_or_global_state",
      "does_not_create_workbench_action_button",
    ],
    non_goals: [
      "external_handoff_delivery_slice",
      "provider_specific_delivery_preview",
      "email_slack_webhook_delivery",
      "clipboard_download_file_export_behavior",
      "durable_residual_diagnostic_store_or_promotion",
      "graph_vector_rag_crawler_browser_observer",
      "autonomy_runner_scheduler_daemon_or_multi_agent_execution",
    ],
  };
}

export function externalHandoffDeliveryAuthorityProblemsV01(
  values: Record<string, unknown>,
): string[] {
  return uniqueStrings(
    Object.entries(values).flatMap(([label, value]) =>
      authorityProblemReasons(label, value),
    ),
  );
}

function determineStatus({
  localFulfilled,
  authorityProblems,
  residualGate,
  hardBlockers,
  spine,
}: {
  localFulfilled: boolean;
  authorityProblems: string[];
  residualGate: ExternalHandoffDeliveryResidualGateSummary;
  hardBlockers: string[];
  spine: RecordValue | null;
}): ExternalHandoffDeliveryContractPreviewStatus {
  if (!spine) return "insufficient_data";
  if (authorityProblems.length > 0) return "authority_boundary_blocked";
  if (!localFulfilled) return "no_local_fulfillment";
  if (residualGate.hard_blocker_reasons.length > 0) {
    return "residual_gate_blocked";
  }
  if (hardBlockers.length > 0) return "blocked";
  return "ready_for_contract_decision";
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
  const materialized = arrayOfRecords(candidate.observed_signals).some(
    (signal) => signal.materialized_inconsistency === true,
  ) || stringArray(candidate.materialized_inconsistencies).length > 0;
  const observedText = [
    ...stringArray(candidate.materialized_inconsistencies),
    ...arrayOfRecords(candidate.observed_signals).map(
      (signal) => stringField(signal, "summary") ?? "",
    ),
  ].join(" ");
  if (
    forbiddenSignalFragments.some((fragment) => observedText.includes(fragment))
  ) {
    return true;
  }
  if (!category) return false;
  if (hardResidualCategories.has(category as never)) {
    return (
      status === "actionable_candidate" ||
      severity === "high" ||
      materialized
    );
  }
  if (category === "route_integration_mode_mismatch") {
    return status === "actionable_candidate";
  }
  if (category === "review_writer_validation_drift") {
    return status === "actionable_candidate" && materialized;
  }
  return false;
}

function externalBoundaryProblemReasons(externalDelivery: RecordValue | null): string[] {
  if (!externalDelivery) return ["external_delivery_status_missing"];
  return uniqueStrings([
    ...(stringField(externalDelivery, "status") === "not_configured"
      ? []
      : ["external_delivery_status_not_future_contract_gap"]),
    ...(externalDelivery.provider_called === true
      ? ["external_delivery_provider_called_true"]
      : []),
    ...(externalDelivery.external_message_sent === true
      ? ["external_delivery_message_sent_true"]
      : []),
    ...(externalDelivery.local_fulfillment_is_external_delivery === true
      ? ["local_fulfillment_marked_as_external_delivery"]
      : []),
  ]);
}

function authorityProblemReasons(label: string, value: unknown): string[] {
  const record = recordOrNull(value);
  if (!record) return [];
  const authority = recordField(record, "authority_boundary");
  const boundary = recordField(record, "external_delivery");
  return uniqueStrings([
    ...forbiddenAuthorityTrueFields
      .filter((field) => authority?.[field] === true)
      .map((field) => `${label}:authority_boundary_forbidden_true:${field}`),
    ...(boundary?.provider_called === true
      ? [`${label}:external_delivery_provider_called_true`]
      : []),
    ...(boundary?.external_message_sent === true
      ? [`${label}:external_delivery_message_sent_true`]
      : []),
    ...(boundary?.local_fulfillment_is_external_delivery === true
      ? [`${label}:local_fulfillment_is_external_delivery_true`]
      : []),
  ]);
}

function toDeliverySurface(value: unknown): ExternalHandoffDeliverySurface {
  return value === "provider_specific_delivery_contract_required"
    ? value
    : DEFAULT_DELIVERY_SURFACE;
}

function stageById(spine: RecordValue | null, stageId: string): RecordValue | null {
  return (
    arrayOfRecords(spine?.stage_summaries).find(
      (stage) => stringField(stage, "stage_id") === stageId,
    ) ?? null
  );
}

export function fingerprintExternalHandoffDeliveryValueV01(value: unknown): string {
  return fingerprint(value);
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

function recordField(value: unknown, key: string): RecordValue | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? value[key] : null;
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
