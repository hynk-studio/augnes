import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_PACKET_COPY_EXPORT_RECORD_REVIEW_VERSION,
} from "@/types/handoff-packet-copy-export-record-review";
import {
  HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION,
  type HandoffPacketExportedArtifact,
} from "@/types/handoff-packet-copy-export-preview";
import {
  HANDOFF_SEND_CONTRACT_PREVIEW_VERSION,
  HANDOFF_SEND_CONTRACT_SCOPE,
  type HandoffSendContractPreview,
  type HandoffSendContractPreviewAuthorityBoundary,
  type HandoffSendContractPreviewInput,
  type HandoffSendContractPreviewStatus,
  type HandoffSendContractReadiness,
  type HandoffSendDeliveryMode,
  type HandoffSendEnvelope,
  type HandoffSendPayloadType,
  type HandoffSendSurface,
  type ProposedHandoffSendContract,
} from "@/types/handoff-send-contract-preview";

type RecordValue = Record<string, unknown>;

const sendSurfaces = [
  "operator_manual_send_candidate",
  "codex_session_handoff_candidate",
  "external_message_candidate",
  "local_send_queue_candidate",
] as const satisfies readonly HandoffSendSurface[];

const deliveryModes = [
  "manual_operator_delivery",
  "deferred_send_queue",
  "provider_send_candidate",
  "codex_session_transfer_candidate",
] as const satisfies readonly HandoffSendDeliveryMode[];

export function createHandoffSendContractPreviewAuthorityBoundaryV01():
  HandoffSendContractPreviewAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    contract_material_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_handoff_send_contract_record: false,
    can_create_handoff_send_contract_receipt: false,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_call_external_messaging: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_handoff_packet_file: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_handoff_packet_copy_export_record: false,
    can_write_handoff_packet_exported_artifact: false,
    can_write_handoff_packet_copy_export_contract_record: false,
    can_write_handoff_context_apply_record: false,
    can_write_applied_handoff_context_snapshot: false,
    can_write_handoff_context_update_contract_record: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
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
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Preview is read-only contract material for a future handoff send slice.",
      "It cannot send handoff, call providers or messaging systems, write clipboard, create downloads, write packet files, mutate live handoff context, route state, CWP/Perspective/Relay records, memory, metrics, or external systems.",
    ],
  };
}

export function buildHandoffSendContractPreviewV01(
  input: HandoffSendContractPreviewInput = {},
): HandoffSendContractPreview {
  const asOf = input.as_of ?? new Date().toISOString();
  const artifactRead = parseExportedArtifactRead(
    input.exported_handoff_packet_artifact_read,
  );
  const directArtifact = isExportedArtifactLike(
    input.exported_handoff_packet_artifact,
  )
    ? input.exported_handoff_packet_artifact
    : null;
  const directRecord = isRecord(input.handoff_packet_copy_export_record)
    ? input.handoff_packet_copy_export_record
    : null;
  const latestArtifact =
    parseExportedArtifact(artifactRead?.latest_exported_artifact) ??
    directArtifact ??
    null;
  const latestRecord = getRecord(artifactRead, "latest_record") ?? directRecord;
  const copyExportReview = parseCopyExportRecordReview(
    input.handoff_packet_copy_export_record_review,
  );
  const copyExportReviewEvidence = getRecord(copyExportReview, "evidence_summary");
  const reviewRecords = Array.isArray(copyExportReview?.records)
    ? copyExportReview.records.filter(isRecord)
    : [];
  const reviewArtifacts = Array.isArray(copyExportReview?.exported_artifacts)
    ? copyExportReview.exported_artifacts.filter(isRecord)
    : [];
  const requestedSourceRefs = uniqueCandidateIngressStringsV01(
    input.source_refs ?? [],
  );
  const sourceRefs = publicSafeRefs([
    ...requestedSourceRefs,
    ...safeStringArray(latestArtifact?.source_refs),
    ...safeStringArray(latestRecord?.source_refs),
  ]);
  const evidenceRefs = publicSafeRefs([
    ...safeStringArray(latestArtifact?.evidence_refs),
    ...safeStringArray(latestRecord?.evidence_refs),
    ...safeStringArray(copyExportReviewEvidence?.evidence_refs),
  ]);
  const requestedSendSurface = parseSendSurface(input.requested_send_surface);
  const requestedDeliveryMode = parseDeliveryMode(input.requested_delivery_mode);
  const requestedRecipientRef = safeRef(input.requested_recipient_ref);
  const requestedOperatorRef = safeRef(input.requested_operator_ref);
  const requestedIdempotencyKey = safeRef(input.requested_idempotency_key);
  const reviewConfirmationRef = safeRef(input.review_confirmation_ref);
  const payloadType = latestArtifact ? payloadTypeForArtifact(latestArtifact) : null;
  const artifactSupportedByReview = latestArtifact
    ? exportedArtifactSupportedByReview({
        artifact: latestArtifact,
        reviewRecords,
        reviewArtifacts,
      })
    : "not_checked";
  const proposedEnvelope =
    latestArtifact &&
    requestedSendSurface &&
    requestedDeliveryMode &&
    requestedRecipientRef &&
    payloadType
      ? buildEnvelope({
          artifact: latestArtifact,
          requestedSendSurface,
          requestedDeliveryMode,
          requestedRecipientRef,
          payloadType,
        })
      : null;
  const proposedContract =
    latestArtifact &&
    proposedEnvelope &&
    requestedSendSurface &&
    requestedDeliveryMode &&
    requestedRecipientRef
      ? buildProposedContract({
          artifact: latestArtifact,
          record: latestRecord,
          sourceRefs,
          evidenceRefs,
          requestedSendSurface,
          requestedDeliveryMode,
          requestedRecipientRef,
          proposedEnvelope,
        })
      : null;

  const suppliedRefs = [
    ...requestedSourceRefs,
    ...sourceRefs,
    ...evidenceRefs,
    input.requested_recipient_ref,
    input.requested_operator_ref,
    input.requested_idempotency_key,
    input.review_confirmation_ref,
  ];
  const unsafeRefs = suppliedRefs.filter(
    (ref): ref is string =>
      typeof ref === "string" && !isCandidateIngressPublicSafeRefV01(ref),
  );
  const artifactValidationReasons = latestArtifact
    ? validateExportedArtifact(latestArtifact)
    : [];
  const artifactMetadataProblems = latestArtifact
    ? artifactMetadataSideEffectClaims(latestArtifact.artifact_metadata)
    : [];
  const artifactAuthorityProblems = latestArtifact
    ? artifactAuthoritySideEffectClaims(latestArtifact.authority_boundary)
    : [];
  const blockers = uniqueCandidateIngressStringsV01([
    ...(input.exported_handoff_packet_artifact_read !== undefined &&
    input.exported_handoff_packet_artifact_read !== null &&
    !artifactRead
      ? ["exported_handoff_packet_artifact_read_malformed"]
      : []),
    ...(artifactRead &&
    artifactRead.status !== "latest_exported_handoff_packet_artifact_available"
      ? ["exported_handoff_packet_artifact_read_not_available"]
      : []),
    ...(input.exported_handoff_packet_artifact !== undefined &&
    input.exported_handoff_packet_artifact !== null &&
    !directArtifact
      ? ["exported_handoff_packet_artifact_malformed"]
      : []),
    ...(artifactValidationReasons.length ? artifactValidationReasons : []),
    ...(artifactMetadataProblems.length ? artifactMetadataProblems : []),
    ...(artifactAuthorityProblems.length ? artifactAuthorityProblems : []),
    ...(copyExportReview?.review_status === "records_invalid"
      ? ["handoff_packet_copy_export_record_review_records_invalid"]
      : []),
    ...(copyExportReviewEvidence?.has_receipt_side_effect_problem === true
      ? ["handoff_packet_copy_export_record_review_receipt_side_effect_invalid"]
      : []),
    ...(artifactSupportedByReview === "unsupported"
      ? ["exported_artifact_not_supported_by_copy_export_record_review"]
      : []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...(!requestedRecipientRef ? ["requested_recipient_ref_missing"] : []),
    ...(!requestedOperatorRef ? ["requested_operator_ref_missing"] : []),
    ...(!requestedIdempotencyKey ? ["requested_idempotency_key_missing"] : []),
    ...(!reviewConfirmationRef ? ["review_confirmation_ref_missing"] : []),
  ]);
  const refusals = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0 ? ["handoff_send_contract_refs_unsafe"] : []),
    ...(input.requested_send_surface && !requestedSendSurface
      ? ["requested_send_surface_unsupported"]
      : []),
    ...(input.requested_delivery_mode && !requestedDeliveryMode
      ? ["requested_delivery_mode_unsupported"]
      : []),
    ...(containsRawOrPrivateMarkers(latestArtifact?.markdown_payload) ||
    containsRawOrPrivateMarkers(latestArtifact?.json_payload) ||
    containsRawOrPrivateMarkers(latestArtifact?.capsule_payload)
      ? ["raw_or_private_packet_payload_refused"]
      : []),
    ...(containsRawOrPrivateMarkers(input.handoff_packet_copy_export_record) ||
    containsRawOrPrivateMarkers(input.handoff_packet_copy_export_record_review) ||
    containsRawOrPrivateMarkers(input.handoff_packet_copy_export_contract_record_review) ||
    containsRawOrPrivateMarkers(input.handoff_context_apply_record_review)
      ? ["raw_or_private_existing_material_refused"]
      : []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!artifactRead && !directArtifact
      ? ["exported_handoff_packet_artifact_read_missing"]
      : []),
    ...(!latestArtifact ? ["latest_exported_handoff_packet_artifact_missing"] : []),
    ...(latestArtifact && !payloadType
      ? ["exported_handoff_packet_artifact_payload_missing"]
      : []),
    ...(!latestRecord && !copyExportReview
      ? ["handoff_packet_copy_export_record_or_review_missing"]
      : []),
    ...(!input.requested_send_surface ? ["requested_send_surface_missing"] : []),
    ...(!input.requested_delivery_mode ? ["requested_delivery_mode_missing"] : []),
  ]);
  const ready =
    Boolean(artifactRead) &&
    artifactRead?.status === "latest_exported_handoff_packet_artifact_available" &&
    Boolean(latestArtifact) &&
    Boolean(proposedContract) &&
    Boolean(requestedSendSurface) &&
    Boolean(requestedDeliveryMode) &&
    Boolean(requestedRecipientRef) &&
    Boolean(requestedOperatorRef) &&
    Boolean(requestedIdempotencyKey) &&
    Boolean(reviewConfirmationRef) &&
    blockers.length === 0 &&
    missingEvidence.length === 0 &&
    refusals.length === 0 &&
    insufficientData.length === 0;
  const status = determineStatus({
    artifact: latestArtifact,
    proposedContract,
    ready,
    blockers,
    missingEvidence,
    refusals,
    insufficientData,
  });

  return {
    preview_version: HANDOFF_SEND_CONTRACT_PREVIEW_VERSION,
    scope: HANDOFF_SEND_CONTRACT_SCOPE,
    as_of: asOf,
    source_refs: sourceRefs,
    contract_preview_status: status,
    recommended_next_action: ready
      ? "write_handoff_send_contract_record"
      : blockers.length || refusals.length
        ? "resolve_handoff_send_contract_blockers"
        : latestArtifact
          ? "review_handoff_send_contract"
          : "supply_exported_handoff_packet_artifact",
    input_summary: {
      has_exported_handoff_packet_artifact_read: Boolean(artifactRead),
      has_latest_exported_artifact: Boolean(latestArtifact),
      has_copy_export_record_review: Boolean(copyExportReview),
      has_copy_export_record: Boolean(latestRecord),
      requested_send_surface:
        typeof input.requested_send_surface === "string"
          ? input.requested_send_surface
          : null,
      requested_delivery_mode:
        typeof input.requested_delivery_mode === "string"
          ? input.requested_delivery_mode
          : null,
      requested_recipient_ref_supplied: Boolean(requestedRecipientRef),
      requested_operator_ref_supplied: Boolean(requestedOperatorRef),
      requested_idempotency_key_supplied: Boolean(requestedIdempotencyKey),
      review_confirmation_supplied: Boolean(reviewConfirmationRef),
      proposed_payload_type: payloadType,
      blocker_count: blockers.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusals.length,
      insufficient_data_reason_count: insufficientData.length,
    },
    source_status: {
      exported_handoff_packet_artifact_read: artifactRead
        ? artifactRead.status === "latest_exported_handoff_packet_artifact_available"
          ? "supplied"
          : "not_available"
        : input.exported_handoff_packet_artifact_read === undefined ||
            input.exported_handoff_packet_artifact_read === null
          ? "missing"
          : "malformed",
      latest_exported_artifact: latestArtifact
        ? artifactValidationReasons.length
          ? "unsupported"
          : "found"
        : input.exported_handoff_packet_artifact !== undefined
          ? "malformed"
          : "missing",
      handoff_packet_copy_export_record_review: copyExportReview
        ? copyExportReview.review_status === "records_invalid"
          ? "invalid"
          : "supplied"
        : input.handoff_packet_copy_export_record_review === undefined ||
            input.handoff_packet_copy_export_record_review === null
          ? "missing"
          : "malformed",
      exported_artifact_supported_by_copy_export_review: artifactSupportedByReview,
      requested_send_surface: refChoiceStatus({
        supplied: input.requested_send_surface,
        parsed: requestedSendSurface,
      }),
      requested_delivery_mode: refChoiceStatus({
        supplied: input.requested_delivery_mode,
        parsed: requestedDeliveryMode,
      }),
    },
    contract_readiness: createReadiness({
      ready,
      blockers,
      missingEvidence,
      refusals,
      insufficientData,
    }),
    approval_requirements: [
      "confirm_exported_packet_artifact_readback_is_latest_and_public_safe",
      "confirm_send_surface_delivery_mode_recipient_operator_and_idempotency_refs",
      "confirm_future_send_slice_is_required_before_any_handoff_send",
      "confirm_no_provider_email_slack_webhook_clipboard_download_file_or_live_mutation",
    ],
    blocking_reasons: blockers,
    missing_evidence: missingEvidence,
    refusal_reasons: refusals,
    evidence_summary: {
      has_exported_artifact_read: Boolean(artifactRead),
      has_latest_exported_artifact: Boolean(latestArtifact),
      has_valid_copy_export_record_review:
        Boolean(copyExportReview) && copyExportReview?.review_status !== "records_invalid",
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_missing_evidence: missingEvidence.length > 0,
      has_receipt_side_effect_problem:
        copyExportReviewEvidence?.has_receipt_side_effect_problem === true,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      problem_record_ids: safeStringArray(copyExportReviewEvidence?.problem_record_ids),
      no_handoff_send_confirmed: true,
      no_provider_call_confirmed: true,
      no_external_delivery_confirmed: true,
    },
    source_exported_packet_artifact_summary: {
      ...packetPayloadSummary(latestArtifact),
      source_handoff_packet_copy_export_record_ref:
        getString(latestRecord, "record_id"),
      source_handoff_packet_copy_export_contract_record_ref:
        getString(latestArtifact, "source_copy_export_contract_record_ref"),
    },
    proposed_handoff_send_contract: proposedContract,
    would_write_handoff_send_contract_record_preview: {
      record_version: "handoff_send_contract_record.v0.1",
      scope: HANDOFF_SEND_CONTRACT_SCOPE,
      requested_operator_ref: input.requested_operator_ref ?? null,
      requested_idempotency_key: input.requested_idempotency_key ?? null,
      review_confirmation_ref: input.review_confirmation_ref ?? null,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      source_exported_artifact_ref: latestArtifact?.artifact_ref ?? null,
      source_handoff_packet_copy_export_record_ref: getString(latestRecord, "record_id"),
      requested_send_surface: requestedSendSurface,
      requested_delivery_mode: requestedDeliveryMode,
      requested_recipient_ref: input.requested_recipient_ref ?? null,
      proposed_handoff_send_contract: proposedContract,
      proposed_send_envelope: proposedEnvelope,
      no_handoff_send_performed: true,
    },
    operator_review_checklist: [
      "confirm_exported_packet_artifact_hash_and_public_safety_summary",
      "confirm_recipient_operator_idempotency_review_and_evidence_refs_are_public_safe",
      "confirm_send_contract_record_is_the_only scoped local write",
      "confirm_no_handoff_send_provider_email_slack_webhook_clipboard_download_or_file_write",
    ],
    would_not_write: [
      "does_not_write_records_from_preview",
      "does_not_send_handoff",
      "does_not_call_send_provider_email_slack_webhook_github_codex_or_openai",
      "does_not_write_clipboard_download_arbitrary_file_or_packet_file",
      "does_not_mutate_live_handoff_context_selected_refs_route_cwp_relay_memory_or_metrics",
    ],
    non_goals: [
      "no_actual_handoff_send",
      "no_provider_or_external_messaging_call",
      "no_clipboard_download_or_file_write",
      "no_live_handoff_context_or_selected_refs_mutation",
      "no_memory_metrics_route_cwp_relay_or_external_system_mutation",
    ],
    authority_boundary: createHandoffSendContractPreviewAuthorityBoundaryV01(),
  };
}

function buildEnvelope({
  artifact,
  requestedSendSurface,
  requestedDeliveryMode,
  requestedRecipientRef,
  payloadType,
}: {
  artifact: HandoffPacketExportedArtifact;
  requestedSendSurface: HandoffSendSurface;
  requestedDeliveryMode: HandoffSendDeliveryMode;
  requestedRecipientRef: string;
  payloadType: HandoffSendPayloadType;
}): HandoffSendEnvelope {
  const envelopeRef = `handoff-send-envelope:${fingerprint({
    artifact_ref: artifact.artifact_ref,
    payload_hash: artifact.payload_hash,
    requestedSendSurface,
    requestedDeliveryMode,
    requestedRecipientRef,
  }).slice(0, 24)}`;
  return {
    envelope_version: "handoff_send_envelope.v0.1",
    envelope_ref: envelopeRef,
    packet_family: "augnes_operator_handoff_packet",
    source_exported_artifact_ref: artifact.artifact_ref,
    packet_format: artifact.packet_format,
    payload_hash: artifact.payload_hash,
    payload_type: payloadType,
    requested_send_surface: requestedSendSurface,
    requested_delivery_mode: requestedDeliveryMode,
    requested_recipient_ref: requestedRecipientRef,
    public_safe: true,
    raw_private_material_excluded: true,
    send_not_performed: true,
    provider_not_called: true,
    external_delivery_not_performed: true,
    future_send_slice_required: true,
  };
}

function buildProposedContract({
  artifact,
  record,
  sourceRefs,
  evidenceRefs,
  requestedSendSurface,
  requestedDeliveryMode,
  requestedRecipientRef,
  proposedEnvelope,
}: {
  artifact: HandoffPacketExportedArtifact;
  record: RecordValue | null;
  sourceRefs: string[];
  evidenceRefs: string[];
  requestedSendSurface: HandoffSendSurface;
  requestedDeliveryMode: HandoffSendDeliveryMode;
  requestedRecipientRef: string;
  proposedEnvelope: HandoffSendEnvelope;
}): ProposedHandoffSendContract {
  return {
    contract_kind: "handoff_send_contract.v0.1",
    send_family: "augnes_operator_handoff_send",
    source_exported_artifact_ref: artifact.artifact_ref,
    source_handoff_packet_copy_export_record_ref: getString(record, "record_id"),
    source_handoff_packet_copy_export_contract_record_ref:
      artifact.source_copy_export_contract_record_ref,
    source_applied_handoff_context_snapshot_ref:
      artifact.source_applied_handoff_context_snapshot_ref,
    source_handoff_context_apply_record_ref:
      artifact.source_handoff_context_apply_record_ref,
    source_handoff_context_update_contract_record_ref:
      artifact.source_handoff_context_update_contract_record_ref,
    source_route_integration_read_ref: artifact.source_route_integration_read_ref,
    source_runtime_current_working_perspective_ref:
      artifact.source_runtime_current_working_perspective_ref,
    source_applied_cwp_snapshot_ref: artifact.source_applied_cwp_snapshot_ref,
    requested_send_surface: requestedSendSurface,
    requested_delivery_mode: requestedDeliveryMode,
    requested_recipient_ref: requestedRecipientRef,
    packet_payload_summary: packetPayloadSummary(artifact),
    proposed_send_envelope: proposedEnvelope,
    proposed_send_steps: [
      "validate_exported_artifact_ref",
      "validate_payload_hash",
      "validate_public_safety_summary",
      "validate_operator_recipient_ref",
      "confirm_delivery_surface",
      "confirm_no_provider_call_in_contract_slice",
      "require_future_handoff_send_slice",
      "require_operator_send_approval",
    ],
    proposed_send_preconditions: [
      "approved_handoff_send_contract_record",
      "selected_send_surface",
      "selected_recipient_ref",
      "payload_hash_revalidated",
      "public_safety_revalidated",
      "provider_boundary_confirmed",
      "no_live_handoff_mutation_required",
      "no_memory_or_metric_write_required",
    ],
    required_source_refs: sourceRefs,
    required_evidence_refs: evidenceRefs,
    blocked_live_mutations: [
      "live_handoff_context_mutation",
      "selected_refs_live_packet_write",
      "current_working_perspective_route_mutation",
      "memory_or_metric_write",
      "provider_or_external_delivery_call",
    ],
    future_send_requirements: [
      "future_handoff_send_slice_must_revalidate_contract_record",
      "future_handoff_send_slice_must_revalidate_payload_hash",
      "future_handoff_send_slice_must_get_operator_send_approval",
      "future_handoff_send_slice_must_confirm_provider_boundary",
    ],
    operator_acceptance_criteria: [
      "exported_packet_artifact_is_latest_public_safe_and_hash_valid",
      "recipient_surface_delivery_mode_operator_and_idempotency_refs_are_public_safe",
      "this_slice_writes_only_scoped_local_handoff_send_contract_records",
      "no_handoff_send_provider_external_message_clipboard_download_file_or_live_mutation_occurs",
    ],
    rollback_and_fallback_plan: [
      "discard_unapproved_send_contract_record",
      "rebuild_contract_from_latest_exported_packet_artifact_if_payload_changes",
      "keep_manual_operator_delivery_as_future_slice_only_until_send_is_authorized",
    ],
  };
}

function parseExportedArtifactRead(value: unknown): RecordValue | null {
  if (!isRecord(value)) return null;
  return value.read_version === "exported_handoff_packet_artifact_read.v0.1" &&
    value.scope === HANDOFF_SEND_CONTRACT_SCOPE
    ? value
    : null;
}

function parseExportedArtifact(value: unknown): HandoffPacketExportedArtifact | null {
  return isExportedArtifactLike(value) ? value : null;
}

function parseCopyExportRecordReview(value: unknown): RecordValue | null {
  if (!isRecord(value)) return null;
  return value.review_version === HANDOFF_PACKET_COPY_EXPORT_RECORD_REVIEW_VERSION &&
    value.scope === HANDOFF_SEND_CONTRACT_SCOPE
    ? value
    : null;
}

function exportedArtifactSupportedByReview({
  artifact,
  reviewRecords,
  reviewArtifacts,
}: {
  artifact: HandoffPacketExportedArtifact;
  reviewRecords: RecordValue[];
  reviewArtifacts: RecordValue[];
}): "supported" | "unsupported" | "not_checked" {
  if (!reviewRecords.length && !reviewArtifacts.length) return "not_checked";
  const supportedByRecord = reviewRecords.some(
    (record) => record.exported_artifact_ref === artifact.artifact_ref,
  );
  const supportedByArtifact = reviewArtifacts.some(
    (candidate) => candidate.artifact_ref === artifact.artifact_ref,
  );
  return supportedByRecord || supportedByArtifact ? "supported" : "unsupported";
}

function validateExportedArtifact(artifact: HandoffPacketExportedArtifact): string[] {
  const reasons: string[] = [];
  if (artifact.artifact_version !== HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION) {
    reasons.push("exported_handoff_packet_artifact_version_invalid");
  }
  if (artifact.scope !== HANDOFF_SEND_CONTRACT_SCOPE) {
    reasons.push("exported_handoff_packet_artifact_scope_invalid");
  }
  if (!payloadTypeForArtifact(artifact)) {
    reasons.push("exported_handoff_packet_artifact_payload_missing");
  }
  if (
    artifact.payload_hash !==
    calculateHistoricalArtifactPayloadHashV01({
      packet_format: artifact.packet_format,
      markdown_payload: artifact.markdown_payload,
      json_payload: artifact.json_payload,
      capsule_payload: artifact.capsule_payload,
    })
  ) {
    reasons.push("exported_handoff_packet_artifact_payload_hash_mismatch");
  }
  const safety = getRecord(artifact, "public_safety_summary");
  if (
    safety?.public_safe !== true ||
    safety.raw_private_material_excluded !== true ||
    safety.raw_text_excluded !== true ||
    safety.raw_report_excluded !== true ||
    safety.raw_excerpt_excluded !== true
  ) {
    reasons.push("exported_handoff_packet_artifact_public_safety_invalid");
  }
  const metadata = getRecord(artifact, "artifact_metadata");
  if (
    metadata?.local_artifact_only !== true ||
    metadata.clipboard_write_not_performed !== true ||
    metadata.file_write_not_performed !== true ||
    metadata.download_not_performed !== true ||
    metadata.handoff_send_not_performed !== true
  ) {
    reasons.push("exported_handoff_packet_artifact_metadata_no_side_effects_invalid");
  }
  if (!hasReadOnlyArtifactAuthority(artifact.authority_boundary)) {
    reasons.push("exported_handoff_packet_artifact_authority_boundary_invalid");
  }
  return reasons;
}

function calculateHistoricalArtifactPayloadHashV01(
  artifact: Pick<
    HandoffPacketExportedArtifact,
    "markdown_payload" | "json_payload" | "capsule_payload" | "packet_format"
  >,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        packet_format: artifact.packet_format,
        markdown_payload: artifact.markdown_payload,
        json_payload: artifact.json_payload,
        capsule_payload: artifact.capsule_payload,
      }),
    )
    .digest("hex");
}

function isExportedArtifactLike(value: unknown): value is HandoffPacketExportedArtifact {
  return Boolean(
    isRecord(value) &&
      typeof value.artifact_version === "string" &&
      typeof value.artifact_ref === "string" &&
      value.scope === HANDOFF_SEND_CONTRACT_SCOPE &&
      value.packet_family === "augnes_operator_handoff_packet" &&
      typeof value.packet_format === "string" &&
      typeof value.payload_hash === "string" &&
      isRecord(value.artifact_metadata) &&
      isRecord(value.public_safety_summary) &&
      isRecord(value.authority_boundary),
  );
}

function payloadTypeForArtifact(
  artifact: Pick<
    HandoffPacketExportedArtifact,
    "packet_format" | "markdown_payload" | "json_payload" | "capsule_payload"
  >,
): HandoffSendPayloadType | null {
  if (
    artifact.packet_format === "operator_handoff_packet_markdown" &&
    typeof artifact.markdown_payload === "string" &&
    artifact.markdown_payload.length > 0 &&
    artifact.json_payload === null &&
    artifact.capsule_payload === null
  ) {
    return "markdown_payload";
  }
  if (
    artifact.packet_format === "codex_handoff_packet_json" &&
    isRecord(artifact.json_payload) &&
    artifact.markdown_payload === null &&
    artifact.capsule_payload === null
  ) {
    return "json_payload";
  }
  if (
    artifact.packet_format === "conversation_handoff_capsule" &&
    isRecord(artifact.capsule_payload) &&
    artifact.markdown_payload === null &&
    artifact.json_payload === null
  ) {
    return "capsule_payload";
  }
  if (
    artifact.packet_format === "dual_markdown_and_json" &&
    typeof artifact.markdown_payload === "string" &&
    artifact.markdown_payload.length > 0 &&
    isRecord(artifact.json_payload) &&
    artifact.capsule_payload === null
  ) {
    return "dual_markdown_and_json_payload";
  }
  return null;
}

function packetPayloadSummary(artifact: HandoffPacketExportedArtifact | null) {
  const safety = getRecord(artifact, "public_safety_summary");
  return {
    source_exported_artifact_ref: artifact?.artifact_ref ?? null,
    packet_format: artifact?.packet_format ?? null,
    payload_hash: artifact?.payload_hash ?? null,
    payload_type: artifact ? payloadTypeForArtifact(artifact) : null,
    has_markdown_payload: Boolean(artifact?.markdown_payload),
    has_json_payload: Boolean(artifact?.json_payload),
    has_capsule_payload: Boolean(artifact?.capsule_payload),
    packet_entry_count:
      typeof artifact?.packet_entry_count === "number"
        ? artifact.packet_entry_count
        : 0,
    packet_section_counts: isRecord(artifact?.packet_section_counts)
      ? artifact.packet_section_counts as Record<string, number>
      : {},
    public_safe: safety?.public_safe === true,
    raw_private_material_excluded: safety?.raw_private_material_excluded === true,
  };
}

function artifactMetadataSideEffectClaims(value: unknown): string[] {
  if (!isRecord(value)) return ["exported_artifact_metadata_missing"];
  const reasons: string[] = [];
  const requiredTrue = [
    "local_artifact_only",
    "clipboard_write_not_performed",
    "file_write_not_performed",
    "download_not_performed",
    "handoff_send_not_performed",
  ];
  for (const field of requiredTrue) {
    if (value[field] !== true) {
      reasons.push(`exported_artifact_metadata_${field}_not_confirmed`);
    }
  }
  for (const [key, candidate] of Object.entries(value)) {
    if (
      /(handoff.*sent|provider.*called|external.*delivery|email|slack|webhook|clipboard_written|download_created|file_written|live.*mutation)/i.test(key) &&
      candidate === true
    ) {
      reasons.push(`exported_artifact_metadata_forbidden_${key}`);
    }
  }
  return reasons;
}

function artifactAuthoritySideEffectClaims(value: unknown): string[] {
  if (!isRecord(value)) return ["exported_artifact_authority_missing"];
  const reasons: string[] = [];
  for (const field of artifactAuthorityForbiddenTrueFields) {
    if (value[field] === true) {
      reasons.push(`exported_artifact_authority_forbidden_${field}`);
    }
  }
  return reasons;
}

function hasReadOnlyArtifactAuthority(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    value.read_only === true &&
    value.source_of_truth === false &&
    artifactAuthorityForbiddenTrueFields.every((field) => value[field] !== true)
  );
}

const artifactAuthorityForbiddenTrueFields = [
  "can_write_db",
  "can_create_handoff_packet_copy_export_record",
  "can_create_handoff_packet_copy_export_receipt",
  "can_create_handoff_packet_exported_artifact",
  "can_persist_local_packet_artifact",
  "can_copy_export_handoff_packet_to_local_artifact",
  "can_write_handoff_packet_file",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_send_handoff",
  "can_call_send_provider",
  "can_call_external_messaging",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
  "can_write_handoff_packet_copy_export_contract_record",
  "can_write_handoff_context_apply_record",
  "can_write_applied_handoff_context_snapshot",
  "can_write_handoff_context_update_contract_record",
  "can_modify_api_perspective_current_route",
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_applied_current_working_perspective_snapshot",
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
  "can_update_global_dogfood_metrics",
  "can_write_dogfood_metrics",
  "can_write_dogfood_metric_snapshot",
  "can_write_reuse_outcome_ledger",
  "can_write_expected_observed_delta",
  "can_write_work_episode",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
  "can_render_workbench_action_button",
] as const;

function createReadiness({
  ready,
  blockers,
  missingEvidence,
  refusals,
  insufficientData,
}: {
  ready: boolean;
  blockers: string[];
  missingEvidence: string[];
  refusals: string[];
  insufficientData: string[];
}): HandoffSendContractReadiness {
  return {
    write_ready: ready,
    readiness_label: ready ? "write_ready" : "not_write_ready",
    requires_exported_packet_artifact: true,
    requires_requested_send_surface: true,
    requires_requested_delivery_mode: true,
    requires_recipient_ref: true,
    requires_operator_ref: true,
    requires_idempotency_key: true,
    requires_review_confirmation: true,
    requires_source_refs: true,
    requires_evidence_refs: true,
    requires_no_blockers: true,
    current_blockers: blockers,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusals,
    current_insufficient_data: insufficientData,
  };
}

function determineStatus({
  artifact,
  proposedContract,
  ready,
  blockers,
  missingEvidence,
  refusals,
  insufficientData,
}: {
  artifact: HandoffPacketExportedArtifact | null;
  proposedContract: ProposedHandoffSendContract | null;
  ready: boolean;
  blockers: string[];
  missingEvidence: string[];
  refusals: string[];
  insufficientData: string[];
}): HandoffSendContractPreviewStatus {
  if (ready) return "ready_for_future_handoff_send_contract_record_write";
  if (!artifact) return "no_exported_handoff_packet_artifact";
  if (!proposedContract) return "no_handoff_send_material";
  if (blockers.length || refusals.length) return "blocked";
  if (missingEvidence.length) return "needs_more_evidence";
  if (insufficientData.length) return "insufficient_data";
  return "ready_for_operator_review";
}

function parseSendSurface(value: unknown): HandoffSendSurface | null {
  return typeof value === "string" &&
    sendSurfaces.includes(value as HandoffSendSurface)
    ? (value as HandoffSendSurface)
    : null;
}

function parseDeliveryMode(value: unknown): HandoffSendDeliveryMode | null {
  return typeof value === "string" &&
    deliveryModes.includes(value as HandoffSendDeliveryMode)
    ? (value as HandoffSendDeliveryMode)
    : null;
}

function refChoiceStatus({
  supplied,
  parsed,
}: {
  supplied: unknown;
  parsed: string | null;
}): "supplied" | "missing" | "unsupported" | "unsafe" {
  if (!supplied) return "missing";
  if (typeof supplied === "string" && !isCandidateIngressPublicSafeRefV01(supplied)) {
    return "unsafe";
  }
  return parsed ? "supplied" : "unsupported";
}

function publicSafeRefs(values: unknown[]): string[] {
  return uniqueCandidateIngressStringsV01(values).filter(
    isCandidateIngressPublicSafeRefV01,
  );
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    return containsCandidateIngressUnsafeMarkerV01(value);
  }
  if (Array.isArray(value)) return value.some(containsRawOrPrivateMarkers);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, entry]) =>
      ["raw_text", "raw_report", "raw_excerpt"].includes(key) ||
      containsRawOrPrivateMarkers(entry),
  );
}

function getRecord(value: unknown, key: string): RecordValue | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? value[key] : null;
}

function getString(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  return typeof value[key] === "string" ? value[key] : null;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
