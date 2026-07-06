import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_SEND_CONTRACT_RECORD_REVIEW_VERSION,
  type HandoffSendContractRecordReview,
} from "@/types/handoff-send-contract-record-review";
import {
  HANDOFF_SEND_CONTRACT_RECORD_VERSION,
  HANDOFF_SEND_CONTRACT_WRITE_SCOPE,
  type HandoffSendContractRecord,
} from "@/types/handoff-send-contract-write";
import {
  HANDOFF_SEND_PREVIEW_VERSION,
  HANDOFF_SEND_SCOPE,
  type HandoffSendExecutionMode,
  type HandoffSendFulfillment,
  type HandoffSendFulfillmentStatus,
  type HandoffSendPreview,
  type HandoffSendPreviewAuthorityBoundary,
  type HandoffSendPreviewInput,
  type HandoffSendPreviewStatus,
} from "@/types/handoff-send-preview";
import type {
  HandoffSendDeliveryMode,
  HandoffSendEnvelope,
  HandoffSendPayloadType,
  HandoffSendSurface,
} from "@/types/handoff-send-contract-preview";

type RecordValue = Record<string, unknown>;

const executionModes = [
  "manual_operator_send_fulfillment",
  "local_deferred_send_queue_fulfillment",
  "provider_send_dry_run_fulfillment",
  "codex_session_transfer_dry_run_fulfillment",
] as const satisfies readonly HandoffSendExecutionMode[];

const usableContractReviewStatuses = [
  "records_available",
  "selected_record_found",
] as const;

const sourceContractAuthorityProfileRequiredTrueFields = [
  "durable_local_handoff_send_contract",
  "local_project_handoff_send_contract_only",
  "handoff_send_contract_written",
] as const;

const sourceContractAuthorityProfileFalseIfPresentFields = [
  "source_of_truth",
  "handoff_sent",
  "send_provider_called",
  "external_messaging_called",
  "email_called",
  "slack_called",
  "webhook_called",
  "clipboard_written",
  "file_download_created",
  "arbitrary_file_written",
  "handoff_packet_file_written",
  "live_handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
  "handoff_packet_copy_export_record_written",
  "handoff_packet_exported_artifact_written",
  "handoff_packet_copy_export_contract_record_written",
  "handoff_context_apply_record_written",
  "applied_handoff_context_snapshot_written",
  "handoff_context_update_contract_record_written",
  "api_perspective_current_route_modified",
  "upstream_current_working_perspective_source_tables_mutated",
  "perspective_unit_write_performed",
  "next_work_bias_write_performed",
  "continuity_relay_write_performed",
  "continuity_relay_update_performed",
  "memory_promotion_performed",
  "metric_update_performed",
] as const;

const sourceContractAuthorityProfileForbiddenTrueFields = [
  "provider_called",
  "github_called",
  "codex_executed",
  "pr_created",
  "pr_merged",
  "autonomous_action_run",
  "graph_or_vector_store_created",
  "rag_stack_created",
  "browser_observed",
  "crawler_or_browser_observer_created",
  "workbench_action_button_rendered",
] as const;

const sourceContractAuthorityBoundaryRequiredTrueFields = [
  "durable_local_handoff_send_contract",
  "local_project_handoff_send_contract_only",
  "can_write_db",
  "can_create_handoff_send_contract_record",
  "can_create_handoff_send_contract_receipt",
] as const;

const sourceContractAuthorityBoundaryFalseOrNotTrueFields = [
  "source_of_truth",
  "can_send_handoff",
  "can_call_send_provider",
  "can_call_external_messaging",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_write_handoff_packet_file",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
  "can_write_handoff_packet_copy_export_record",
  "can_write_handoff_packet_exported_artifact",
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

const sourceContractAllowedNoSideEffectTrueFields = [
  "handoff_send_contract_record_written",
  "handoff_send_contract_receipt_written",
  "handoff_send_contract_persisted",
  "handoff_send_contract_written",
] as const;

const sourceContractForbiddenNoSideEffectFields = [
  "handoff_sent",
  "send_provider_called",
  "external_messaging_called",
  "email_called",
  "slack_called",
  "webhook_called",
  "provider_called",
  "github_called",
  "codex_executed",
  "clipboard_written",
  "file_download_created",
  "arbitrary_file_written",
  "handoff_packet_file_written",
  "handoff_packet_copied_to_clipboard",
  "handoff_packet_exported_to_file",
  "handoff_packet_download_created",
  "handoff_packet_copied",
  "handoff_packet_exported",
  "live_handoff_context_updated",
  "live_handoff_context_mutated",
  "handoff_context_applied_live",
  "handoff_context_mutated",
  "selected_refs_written_to_live_handoff",
  "handoff_packet_copy_export_record_written",
  "handoff_packet_exported_artifact_written",
  "handoff_packet_copy_export_contract_record_written",
  "handoff_context_apply_record_written",
  "applied_handoff_context_snapshot_written",
  "handoff_context_update_contract_record_written",
  "api_perspective_current_route_modified",
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
  "route_integration_contract_record_written",
  "perspective_unit_written",
  "next_work_bias_written",
  "continuity_relay_written",
  "continuity_relay_updated",
  "live_relay_state_applied",
  "memory_written",
  "memory_promoted",
  "memory_mutated",
  "dogfood_metrics_written",
  "dogfood_metrics_global_state_updated",
  "dogfood_metric_snapshot_written",
  "reuse_outcome_ledger_written",
  "expected_observed_delta_written",
  "work_episode_written",
  "pr_created",
  "pr_merged",
  "autonomous_action_run",
  "graph_or_vector_store_created",
  "rag_stack_created",
  "browser_observed",
  "crawler_or_browser_observer_created",
  "workbench_action_button_rendered",
] as const;

export function createHandoffSendPreviewAuthorityBoundaryV01():
  HandoffSendPreviewAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    send_preview_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_handoff_send_record: false,
    can_create_handoff_send_receipt: false,
    can_record_local_send_fulfillment: false,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_call_external_messaging: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_transfer_codex_session: false,
    can_call_browser_or_crawler: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_handoff_packet_file: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_handoff_send_contract_record: false,
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
      "Preview is read-only and only prepares a scoped local handoff send fulfillment record.",
      "It cannot call providers, send external messages, transfer Codex sessions, write clipboard, create downloads, write files, mutate handoff context, route state, CWP/Perspective/Relay records, memory, metrics, or external systems.",
    ],
  };
}

export function buildHandoffSendPreviewV01(
  input: HandoffSendPreviewInput = {},
): HandoffSendPreview {
  const asOf = input.as_of ?? new Date().toISOString();
  const contractReview = parseContractRecordReview(
    input.handoff_send_contract_record_review,
  );
  const directRecord = parseContractRecord(input.handoff_send_contract_record);
  const selectedRecord = selectContractRecord(contractReview, directRecord);
  const envelope = getRecord(
    selectedRecord,
    "proposed_send_envelope",
  ) as HandoffSendEnvelope | null;
  const requestedMode = parseExecutionMode(input.requested_send_execution_mode);
  const requestedOperatorRef = safeRef(input.requested_operator_ref);
  const requestedIdempotencyKey = safeRef(input.requested_idempotency_key);
  const reviewConfirmationRef = safeRef(input.review_confirmation_ref);
  const manualConfirmationRef = safeRef(input.manual_delivery_confirmation_ref);
  const localQueueRef = safeRef(input.local_queue_ref);
  const requestedSourceRefs = uniqueCandidateIngressStringsV01(
    input.source_refs ?? [],
  );
  const requestedPublicSafeSourceRefs = publicSafeRefs(requestedSourceRefs);
  const contractEvidenceRefs = publicSafeRefs(
    safeStringArray(selectedRecord?.evidence_refs),
  );
  const sourceRefs = publicSafeRefs([
    ...requestedSourceRefs,
    ...safeStringArray(selectedRecord?.source_refs),
  ]);
  const evidenceRefs = publicSafeRefs([
    ...contractEvidenceRefs,
    ...(selectedRecord?.source_exported_artifact_ref
      ? [selectedRecord.source_exported_artifact_ref]
      : []),
    ...(selectedRecord?.proposed_send_envelope?.payload_hash
      ? [selectedRecord.proposed_send_envelope.payload_hash]
      : []),
  ]);
  const suppliedRefs = [
    ...requestedSourceRefs,
    ...sourceRefs,
    ...evidenceRefs,
    input.requested_operator_ref,
    input.requested_idempotency_key,
    input.review_confirmation_ref,
    input.manual_delivery_confirmation_ref,
    input.local_queue_ref,
  ];
  const unsafeRefs = suppliedRefs.filter(
    (ref): ref is string =>
      typeof ref === "string" && !isCandidateIngressPublicSafeRefV01(ref),
  );
  const artifactReadStatus = exportedArtifactReadStatus(
    input.exported_handoff_packet_artifact_read,
    selectedRecord?.source_exported_artifact_ref ?? null,
  );
  const modeCompatibility = selectedRecord && requestedMode
    ? executionModeCompatibility(selectedRecord, requestedMode)
    : [];
  const sourceContractProblems = selectedRecord
    ? sourceSendContractProblemReasons(selectedRecord)
    : [];
  const contractReviewProblems = contractReviewProblemReasons(contractReview);
  const fulfillment =
    selectedRecord && envelope && requestedMode
      ? buildFulfillment({
          asOf,
          record: selectedRecord,
          envelope,
          requestedMode,
          manualConfirmationRef,
          localQueueRef,
          sourceRefs,
          evidenceRefs,
        })
      : null;
  const blockers = uniqueCandidateIngressStringsV01([
    ...(input.handoff_send_contract_record_review !== undefined &&
    input.handoff_send_contract_record_review !== null &&
    !contractReview
      ? ["handoff_send_contract_record_review_malformed"]
      : []),
    ...(contractReview?.review_status === "records_invalid"
      ? ["handoff_send_contract_record_review_records_invalid"]
      : []),
    ...contractReviewProblems,
    ...(directRecord === null &&
    input.handoff_send_contract_record !== undefined &&
    input.handoff_send_contract_record !== null
      ? ["handoff_send_contract_record_malformed"]
      : []),
    ...sourceContractProblems,
    ...(selectedRecord && !isProposedSendContractValid(selectedRecord.proposed_handoff_send_contract)
      ? ["proposed_handoff_send_contract_malformed"]
      : []),
    ...(selectedRecord && !isSendEnvelopeValid(selectedRecord.proposed_send_envelope)
      ? ["proposed_send_envelope_malformed"]
      : []),
    ...(artifactReadStatus === "malformed"
      ? ["exported_handoff_packet_artifact_read_malformed"]
      : []),
    ...(artifactReadStatus === "mismatched"
      ? ["exported_handoff_packet_artifact_mismatch"]
      : []),
    ...modeCompatibility,
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(requestedPublicSafeSourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(contractEvidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...(!requestedOperatorRef ? ["requested_operator_ref_missing"] : []),
    ...(!requestedIdempotencyKey ? ["requested_idempotency_key_missing"] : []),
    ...(!reviewConfirmationRef ? ["review_confirmation_ref_missing"] : []),
    ...(!requestedMode ? ["requested_send_execution_mode_missing"] : []),
    ...(requestedMode === "manual_operator_send_fulfillment" &&
    !manualConfirmationRef
      ? ["manual_delivery_confirmation_ref_missing"]
      : []),
    ...(requestedMode === "local_deferred_send_queue_fulfillment" && !localQueueRef
      ? ["local_queue_ref_missing"]
      : []),
    ...(requestedMode === "provider_send_dry_run_fulfillment" &&
    !manualConfirmationRef &&
    !localQueueRef
      ? ["dry_run_confirmation_ref_missing"]
      : []),
    ...(requestedMode === "codex_session_transfer_dry_run_fulfillment" &&
    !manualConfirmationRef &&
    !localQueueRef
      ? ["dry_run_confirmation_ref_missing"]
      : []),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length ? ["handoff_send_refs_unsafe"] : []),
    ...(input.requested_send_execution_mode && !requestedMode
      ? ["requested_send_execution_mode_unsupported"]
      : []),
    ...(containsRawOrPrivateMarkers(input.handoff_send_contract_record_review) ||
    containsRawOrPrivateMarkers(input.handoff_send_contract_record) ||
    containsRawOrPrivateMarkers(input.exported_handoff_packet_artifact_read) ||
    containsRawOrPrivateMarkers(input.handoff_packet_copy_export_record_review)
      ? ["raw_or_private_handoff_send_material_refused"]
      : []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!contractReview && !directRecord
      ? ["handoff_send_contract_record_review_missing"]
      : []),
    ...(!selectedRecord ? ["handoff_send_contract_record_missing"] : []),
  ]);
  const ready =
    Boolean(contractReview) &&
    Boolean(selectedRecord) &&
    Boolean(envelope) &&
    Boolean(fulfillment) &&
    Boolean(requestedMode) &&
    Boolean(requestedOperatorRef) &&
    Boolean(requestedIdempotencyKey) &&
    Boolean(reviewConfirmationRef) &&
    blockers.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  const status = determineStatus({
    hasRecord: Boolean(selectedRecord),
    ready,
    blockers,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const selectedSummary = summarizeContractRecord(selectedRecord);

  return {
    preview_version: HANDOFF_SEND_PREVIEW_VERSION,
    scope: HANDOFF_SEND_SCOPE,
    as_of: asOf,
    source_refs: sourceRefs,
    send_preview_status: status,
    recommended_next_action: ready
      ? "write_handoff_send_record"
      : status === "no_handoff_send_contract_record"
        ? "supply_handoff_send_contract_record"
        : blockers.length || refusalReasons.length
          ? "resolve_handoff_send_blockers"
          : "review_handoff_send_preview",
    input_summary: {
      has_handoff_send_contract_record_review: Boolean(contractReview),
      has_handoff_send_contract_record: Boolean(selectedRecord),
      selected_contract_record_id: selectedRecord?.record_id ?? null,
      requested_send_execution_mode: input.requested_send_execution_mode ?? null,
      requested_operator_ref_supplied: Boolean(input.requested_operator_ref),
      requested_idempotency_key_supplied: Boolean(input.requested_idempotency_key),
      review_confirmation_supplied: Boolean(input.review_confirmation_ref),
      manual_delivery_confirmation_ref_supplied: Boolean(
        input.manual_delivery_confirmation_ref,
      ),
      local_queue_ref_supplied: Boolean(input.local_queue_ref),
      blocker_count: blockers.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
    },
    source_status: {
      handoff_send_contract_record_review: contractReview
        ? contractReview.review_status === "records_invalid"
          ? "records_invalid"
          : "supplied"
        : input.handoff_send_contract_record_review === undefined ||
            input.handoff_send_contract_record_review === null
          ? "missing"
          : "malformed",
      selected_handoff_send_contract_record: selectedRecord
        ? "found"
        : input.handoff_send_contract_record || contractReview
          ? "missing"
          : "malformed",
      exported_handoff_packet_artifact_read: artifactReadStatus,
    },
    send_readiness: {
      write_ready: ready,
      readiness_label: ready ? "ready" : "not_ready",
      requires_handoff_send_contract_record: true,
      requires_send_execution_mode: true,
      requires_confirmation_ref: true,
      requires_operator_ref: true,
      requires_idempotency_key: true,
      requires_review_confirmation: true,
      requires_source_refs: true,
      requires_evidence_refs: true,
      requires_no_blockers: true,
      current_blockers: blockers,
      current_missing_evidence: missingEvidence,
      current_refusal_reasons: refusalReasons,
      current_insufficient_data: insufficientData,
    },
    approval_requirements: [
      "operator_must_review_handoff_send_contract_record",
      "operator_must_confirm_execution_mode_is_local_manual_deferred_or_dry_run_only",
      "operator_must_confirm_no_provider_external_message_clipboard_download_file_or_live_mutation",
    ],
    blocking_reasons: blockers,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_handoff_send_contract_record: Boolean(selectedRecord),
      has_valid_send_envelope: Boolean(envelope),
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_confirmation_ref: Boolean(manualConfirmationRef || localQueueRef),
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      no_external_delivery_confirmed: true,
      no_provider_call_confirmed: true,
      no_clipboard_download_file_write_confirmed: true,
    },
    source_send_contract_summary: selectedSummary,
    proposed_handoff_send_fulfillment: fulfillment,
    proposed_handoff_send_receipt_preview: {
      receipt_version: "handoff_send_receipt.v0.1",
      would_record_local_fulfillment: Boolean(fulfillment),
      external_delivery_performed: false,
      provider_call_performed: false,
      clipboard_download_file_write_performed: false,
    },
    would_write_handoff_send_record_preview: {
      record_version: "handoff_send_record.v0.1",
      scope: HANDOFF_SEND_SCOPE,
      requested_operator_ref: input.requested_operator_ref ?? null,
      requested_idempotency_key: input.requested_idempotency_key ?? null,
      review_confirmation_ref: input.review_confirmation_ref ?? null,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      source_handoff_send_contract_record_ref: selectedRecord?.record_id ?? null,
      source_exported_artifact_ref:
        selectedRecord?.source_exported_artifact_ref ?? null,
      requested_send_surface: selectedRecord?.requested_send_surface ?? null,
      requested_delivery_mode: selectedRecord?.requested_delivery_mode ?? null,
      requested_recipient_ref: selectedRecord?.requested_recipient_ref ?? null,
      requested_send_execution_mode: requestedMode,
      proposed_handoff_send_fulfillment: fulfillment,
      no_actual_external_send_performed: true,
      no_provider_call_performed: true,
      no_clipboard_download_file_write_performed: true,
    },
    operator_review_checklist: [
      "confirm_source_handoff_send_contract_record_is_approved_and_valid",
      "confirm_execution_mode_matches_contract_surface_and_delivery_mode",
      "confirm_local_fulfillment_record_is_not_external_delivery",
      "confirm_provider_email_slack_webhook_github_codex_browser_network_clipboard_download_file_and_live_mutation_are_false",
    ],
    would_not_write: [
      "external_handoff_send",
      "provider_or_external_message_call",
      "email_slack_webhook_github_codex_openai_browser_crawler_network_call",
      "clipboard_download_or_arbitrary_file_write",
      "live_handoff_context_route_cwp_relay_memory_or_metric_mutation",
    ],
    non_goals: [
      "provider_specific_external_delivery",
      "live_handoff_packet_mutation",
      "memory_or_metrics_promotion",
      "workbench_action_button",
    ],
    authority_boundary: createHandoffSendPreviewAuthorityBoundaryV01(),
  };
}

function selectContractRecord(
  review: HandoffSendContractRecordReview | null,
  directRecord: HandoffSendContractRecord | null,
): HandoffSendContractRecord | null {
  if (directRecord) return directRecord;
  if (
    !review ||
    !usableContractReviewStatuses.includes(
      review.review_status as (typeof usableContractReviewStatuses)[number],
    )
  ) {
    return null;
  }
  if (review.selected_record_summary?.record_id) {
    return (
      review.records.find(
        (record) => record.record_id === review.selected_record_summary?.record_id,
      ) ?? null
    );
  }
  if (review.latest_record_summary?.record_id) {
    return (
      review.records.find(
        (record) => record.record_id === review.latest_record_summary?.record_id,
      ) ?? null
    );
  }
  return review.records[0] ?? null;
}

function contractReviewProblemReasons(
  review: HandoffSendContractRecordReview | null,
): string[] {
  if (!review) return [];
  return uniqueCandidateIngressStringsV01([
    ...(review.review_status === "schema_missing"
      ? ["handoff_send_contract_record_review_schema_missing"]
      : []),
    ...(review.review_status === "no_records"
      ? ["handoff_send_contract_record_review_no_records"]
      : []),
    ...(review.review_status === "selected_record_missing"
      ? ["handoff_send_contract_record_review_selected_record_missing"]
      : []),
    ...(review.evidence_summary?.has_receipt_side_effect_problem === true
      ? ["handoff_send_contract_record_review_receipt_side_effect_invalid"]
      : []),
  ]);
}

function sourceSendContractProblemReasons(record: HandoffSendContractRecord): string[] {
  const candidate = record as unknown as RecordValue;
  return uniqueCandidateIngressStringsV01([
    ...(!isContractRecord(candidate)
      ? ["handoff_send_contract_record_malformed"]
      : []),
    ...(!isSourceSendContractAuthorityProfileValid(candidate.authority_profile)
      ? ["handoff_send_contract_record_authority_profile_invalid"]
      : []),
    ...(candidate.no_handoff_send_performed !== true
      ? ["handoff_send_contract_record_no_handoff_send_performed_invalid"]
      : []),
    ...(!isSourceSendContractAuthorityBoundaryValid(candidate.authority_boundary)
      ? ["handoff_send_contract_record_authority_boundary_invalid"]
      : []),
    ...(!isProposedSendContractValid(candidate.proposed_handoff_send_contract)
      ? ["handoff_send_contract_record_proposed_contract_invalid"]
      : []),
    ...(!isSendEnvelopeValid(candidate.proposed_send_envelope)
      ? ["handoff_send_contract_record_send_envelope_invalid"]
      : []),
    ...(!sourceSendContractEnvelopeMatches(candidate)
      ? ["handoff_send_contract_record_contract_envelope_mismatch"]
      : []),
    ...(hasOwn(candidate, "no_side_effects") &&
    !isSourceSendContractNoSideEffectsValid(candidate.no_side_effects)
      ? ["handoff_send_contract_record_no_side_effects_invalid"]
      : []),
  ]);
}

function buildFulfillment({
  asOf,
  record,
  envelope,
  requestedMode,
  manualConfirmationRef,
  localQueueRef,
  sourceRefs,
  evidenceRefs,
}: {
  asOf: string;
  record: HandoffSendContractRecord;
  envelope: HandoffSendEnvelope;
  requestedMode: HandoffSendExecutionMode;
  manualConfirmationRef: string | null;
  localQueueRef: string | null;
  sourceRefs: string[];
  evidenceRefs: string[];
}): HandoffSendFulfillment {
  const fulfillmentStatus = fulfillmentStatusForMode(requestedMode);
  const fulfillmentRef = `handoff-send-fulfillment:${fingerprint({
    record_id: record.record_id,
    requestedMode,
    manualConfirmationRef,
    localQueueRef,
    payload_hash: envelope.payload_hash,
  }).slice(0, 24)}`;
  return {
    fulfillment_version: "handoff_send_fulfillment.v0.1",
    fulfillment_ref: fulfillmentRef,
    scope: HANDOFF_SEND_SCOPE,
    as_of: asOf,
    source_handoff_send_contract_record_ref: record.record_id,
    source_exported_artifact_ref: record.source_exported_artifact_ref,
    source_handoff_packet_copy_export_record_ref:
      record.source_handoff_packet_copy_export_record_ref,
    source_handoff_packet_copy_export_contract_record_ref:
      record.source_handoff_packet_copy_export_contract_record_ref,
    requested_send_surface: record.requested_send_surface,
    requested_delivery_mode: record.requested_delivery_mode,
    requested_recipient_ref: record.requested_recipient_ref,
    requested_send_execution_mode: requestedMode,
    manual_delivery_confirmation_ref: manualConfirmationRef,
    local_queue_ref: localQueueRef,
    payload_hash: envelope.payload_hash,
    payload_type: envelope.payload_type,
    send_envelope_ref: envelope.envelope_ref,
    fulfillment_status: fulfillmentStatus,
    fulfillment_steps: [
      "validated_send_contract_record",
      "validated_send_envelope",
      "validated_payload_hash",
      "validated_recipient_ref",
      "confirmed_no_provider_call",
      "confirmed_no_external_delivery",
      "confirmed_no_clipboard_or_file_write",
      "recorded_scoped_local_send_fulfillment",
    ],
    public_safety_summary: {
      public_safe: true,
      raw_private_material_excluded: true,
    },
    no_external_delivery_summary: {
      provider_call_performed: false,
      external_messaging_called: false,
      email_called: false,
      slack_called: false,
      webhook_called: false,
      github_called: false,
      codex_transfer_performed: false,
      browser_or_crawler_called: false,
      network_send_performed: false,
    },
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    authority_boundary: createHandoffSendPreviewAuthorityBoundaryV01(),
  };
}

function executionModeCompatibility(
  record: HandoffSendContractRecord,
  mode: HandoffSendExecutionMode,
): string[] {
  if (
    mode === "manual_operator_send_fulfillment" &&
    (record.requested_delivery_mode !== "manual_operator_delivery" ||
      record.requested_send_surface !== "operator_manual_send_candidate")
  ) {
    return ["manual_operator_send_fulfillment_incompatible_with_contract"];
  }
  if (
    mode === "local_deferred_send_queue_fulfillment" &&
    (record.requested_delivery_mode !== "deferred_send_queue" ||
      record.requested_send_surface !== "local_send_queue_candidate")
  ) {
    return ["local_deferred_send_queue_fulfillment_incompatible_with_contract"];
  }
  return [];
}

function fulfillmentStatusForMode(
  mode: HandoffSendExecutionMode,
): HandoffSendFulfillmentStatus {
  if (mode === "local_deferred_send_queue_fulfillment") {
    return "locally_queued_deferred_send";
  }
  if (mode === "provider_send_dry_run_fulfillment") {
    return "locally_recorded_provider_send_dry_run";
  }
  if (mode === "codex_session_transfer_dry_run_fulfillment") {
    return "locally_recorded_codex_transfer_dry_run";
  }
  return "locally_fulfilled_manual_operator_send";
}

function summarizeContractRecord(record: HandoffSendContractRecord | null) {
  const envelope = getRecord(record, "proposed_send_envelope") as
    | HandoffSendEnvelope
    | null;
  return {
    source_handoff_send_contract_record_ref: record?.record_id ?? null,
    source_exported_artifact_ref: record?.source_exported_artifact_ref ?? null,
    requested_send_surface: record?.requested_send_surface ?? null,
    requested_delivery_mode: record?.requested_delivery_mode ?? null,
    requested_recipient_ref: record?.requested_recipient_ref ?? null,
    payload_hash: envelope?.payload_hash ?? null,
    payload_type: envelope?.payload_type ?? null,
    send_envelope_ref: envelope?.envelope_ref ?? null,
  };
}

function determineStatus({
  hasRecord,
  ready,
  blockers,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  hasRecord: boolean;
  ready: boolean;
  blockers: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): HandoffSendPreviewStatus {
  if (ready) return "ready_for_future_handoff_send_record_write";
  if (!hasRecord) return "no_handoff_send_contract_record";
  if (refusalReasons.length || blockers.length) return "blocked";
  if (missingEvidence.length) return "needs_more_evidence";
  if (insufficientData.length) return "insufficient_data";
  return "ready_for_operator_review";
}

function exportedArtifactReadStatus(
  value: unknown,
  expectedArtifactRef: string | null,
): "not_supplied" | "matched" | "mismatched" | "malformed" {
  if (value === undefined || value === null) return "not_supplied";
  if (!isRecord(value)) return "malformed";
  if (value.read_version !== "exported_handoff_packet_artifact_read.v0.1") {
    return "malformed";
  }
  const latestArtifact = getRecord(value, "latest_exported_artifact");
  const artifactRef =
    typeof latestArtifact?.artifact_ref === "string"
      ? latestArtifact.artifact_ref
      : null;
  return artifactRef && expectedArtifactRef && artifactRef === expectedArtifactRef
    ? "matched"
    : "mismatched";
}

function parseContractRecordReview(
  value: unknown,
): HandoffSendContractRecordReview | null {
  if (!isRecord(value)) return null;
  return value.review_version === HANDOFF_SEND_CONTRACT_RECORD_REVIEW_VERSION &&
    value.scope === HANDOFF_SEND_CONTRACT_WRITE_SCOPE
    ? (value as unknown as HandoffSendContractRecordReview)
    : null;
}

function parseContractRecord(value: unknown): HandoffSendContractRecord | null {
  if (!isRecord(value)) return null;
  return isContractRecord(value)
    ? (value as unknown as HandoffSendContractRecord)
    : null;
}

function isContractRecord(value: RecordValue): boolean {
  return Boolean(
    value.record_version === HANDOFF_SEND_CONTRACT_RECORD_VERSION &&
      value.scope === HANDOFF_SEND_CONTRACT_WRITE_SCOPE &&
      typeof value.record_id === "string" &&
      typeof value.idempotency_key === "string" &&
      typeof value.created_at === "string" &&
      typeof value.operator_ref === "string" &&
      Array.isArray(value.source_refs) &&
      Array.isArray(value.evidence_refs) &&
      typeof value.source_exported_artifact_ref === "string" &&
      typeof value.requested_send_surface === "string" &&
      typeof value.requested_delivery_mode === "string" &&
      typeof value.requested_recipient_ref === "string" &&
      value.review_status === "recorded_as_scoped_handoff_send_contract" &&
      value.persistence_horizon === "local_project_handoff_send_contract_store" &&
      value.no_handoff_send_performed === true &&
      isRecord(value.proposed_handoff_send_contract) &&
      isRecord(value.proposed_send_envelope) &&
      typeof value.record_fingerprint === "string",
  );
}

function isSourceSendContractAuthorityProfileValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  for (const field of sourceContractAuthorityProfileRequiredTrueFields) {
    if (value[field] !== true) return false;
  }
  for (const field of sourceContractAuthorityProfileFalseIfPresentFields) {
    if (hasOwn(value, field) && value[field] !== false) return false;
  }
  for (const field of sourceContractAuthorityProfileForbiddenTrueFields) {
    if (value[field] === true) return false;
  }
  return true;
}

function isSourceSendContractAuthorityBoundaryValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  for (const field of sourceContractAuthorityBoundaryRequiredTrueFields) {
    if (value[field] !== true) return false;
  }
  for (const field of sourceContractAuthorityBoundaryFalseOrNotTrueFields) {
    if (value[field] === true) return false;
  }
  return Object.entries(value).every(([field, entry]) => {
    if (!field.startsWith("can_") || entry !== true) return true;
    return sourceContractAuthorityBoundaryRequiredTrueFields.includes(
      field as (typeof sourceContractAuthorityBoundaryRequiredTrueFields)[number],
    );
  });
}

function isSourceSendContractNoSideEffectsValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  for (const field of sourceContractForbiddenNoSideEffectFields) {
    if (value[field] !== false) return false;
  }
  for (const field of sourceContractAllowedNoSideEffectTrueFields) {
    if (typeof value[field] !== "boolean") return false;
  }
  return true;
}

function isProposedSendContractValid(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const payloadSummary = getRecord(value, "packet_payload_summary");
  const envelope = getRecord(value, "proposed_send_envelope");
  return Boolean(
    value.contract_kind === "handoff_send_contract.v0.1" &&
      value.send_family === "augnes_operator_handoff_send" &&
      typeof value.source_exported_artifact_ref === "string" &&
      typeof value.requested_send_surface === "string" &&
      typeof value.requested_delivery_mode === "string" &&
      typeof value.requested_recipient_ref === "string" &&
      typeof payloadSummary?.payload_hash === "string" &&
      isRecord(envelope) &&
      Array.isArray(value.proposed_send_steps) &&
      Array.isArray(value.proposed_send_preconditions) &&
      Array.isArray(value.required_source_refs) &&
      Array.isArray(value.required_evidence_refs),
  );
}

function isSendEnvelopeValid(value: unknown): value is HandoffSendEnvelope {
  if (!isRecord(value)) return false;
  return Boolean(
    value.envelope_version === "handoff_send_envelope.v0.1" &&
      typeof value.envelope_ref === "string" &&
      value.packet_family === "augnes_operator_handoff_packet" &&
      typeof value.source_exported_artifact_ref === "string" &&
      typeof value.packet_format === "string" &&
      typeof value.payload_hash === "string" &&
      typeof value.payload_type === "string" &&
      typeof value.requested_send_surface === "string" &&
      typeof value.requested_delivery_mode === "string" &&
      typeof value.requested_recipient_ref === "string" &&
      value.public_safe === true &&
      value.raw_private_material_excluded === true &&
      value.send_not_performed === true &&
      value.provider_not_called === true &&
      value.external_delivery_not_performed === true &&
      value.future_send_slice_required === true,
  );
}

function sourceSendContractEnvelopeMatches(record: RecordValue): boolean {
  const contract = getRecord(record, "proposed_handoff_send_contract");
  const envelope = getRecord(record, "proposed_send_envelope");
  const payloadSummary = getRecord(contract, "packet_payload_summary");
  if (
    !contract ||
    !envelope ||
    !isProposedSendContractValid(contract) ||
    !isSendEnvelopeValid(envelope)
  ) {
    return false;
  }
  return (
    contract.source_exported_artifact_ref === record.source_exported_artifact_ref &&
    envelope.source_exported_artifact_ref === record.source_exported_artifact_ref &&
    contract.requested_send_surface === record.requested_send_surface &&
    envelope.requested_send_surface === record.requested_send_surface &&
    contract.requested_delivery_mode === record.requested_delivery_mode &&
    envelope.requested_delivery_mode === record.requested_delivery_mode &&
    contract.requested_recipient_ref === record.requested_recipient_ref &&
    envelope.requested_recipient_ref === record.requested_recipient_ref &&
    payloadSummary?.payload_hash === envelope.payload_hash
  );
}

function parseExecutionMode(value: unknown): HandoffSendExecutionMode | null {
  return executionModes.includes(value as HandoffSendExecutionMode)
    ? (value as HandoffSendExecutionMode)
    : null;
}

function publicSafeRefs(values: unknown[]): string[] {
  return uniqueCandidateIngressStringsV01(
    values.filter((value): value is string =>
      isCandidateIngressPublicSafeRefV01(value),
    ),
  );
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
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

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function hasOwn(value: RecordValue, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
