import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_PACKET_COPY_EXPORT_DECISION_PREVIEW_VERSION,
  type HandoffPacketCopyExportDecisionAuthorityBoundary,
  type HandoffPacketCopyExportDecisionPreviewInput,
  type HandoffPacketCopyExportDecisionPreviewStatus,
  type HandoffPacketCopyExportDecisionReadiness,
  type HandoffPacketCopyExportOperatorDecisionIntent,
  type HandoffPacketCopyExportOperatorDecisionPreview,
} from "@/types/handoff-packet-copy-export-decision";
import {
  HANDOFF_PACKET_COPY_EXPORT_PREVIEW_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_SCOPE,
  type HandoffPacketCopyExportPreview,
} from "@/types/handoff-packet-copy-export-preview";

type RecordValue = Record<string, unknown>;

const approvalIntent = "approve_for_handoff_packet_copy_export_record" as const;
const decisionIntents: HandoffPacketCopyExportOperatorDecisionIntent[] = [
  approvalIntent,
  "keep_preview_only",
  "reject",
];

export function createHandoffPacketCopyExportDecisionAuthorityBoundaryV01():
  HandoffPacketCopyExportDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    decision_preview_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_handoff_packet_copy_export_record: false,
    can_create_handoff_packet_copy_export_receipt: false,
    can_create_handoff_packet_exported_artifact: false,
    can_persist_local_packet_artifact: false,
    can_copy_export_handoff_packet_to_local_artifact: false,
    can_write_handoff_packet_file: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_send_handoff: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
    can_write_selected_refs_to_live_handoff: false,
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
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Decision preview is read-only and cannot write packet artifact records.",
      "It cannot write clipboard, downloads, files, send handoff, mutate live handoff context, memory, metrics, routes, or external systems.",
    ],
  };
}

export function buildHandoffPacketCopyExportOperatorDecisionPreviewV01({
  handoff_packet_copy_export_preview,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  operator_decision_intent,
  scope,
  as_of,
  source_refs,
}: HandoffPacketCopyExportDecisionPreviewInput = {}):
  HandoffPacketCopyExportOperatorDecisionPreview {
  const copyExportPreview = isHandoffPacketCopyExportPreview(
    handoff_packet_copy_export_preview,
  )
    ? handoff_packet_copy_export_preview
    : null;
  const sourceRefs = uniqueCandidateIngressStringsV01([
    ...(source_refs ?? []),
    ...(copyExportPreview?.source_refs ?? []),
  ]);
  const evidenceRefs = uniqueCandidateIngressStringsV01(
    copyExportPreview?.evidence_summary.evidence_refs ?? [],
  );
  const unsupportedIntent = Boolean(
    operator_decision_intent &&
      !decisionIntents.includes(
        operator_decision_intent as HandoffPacketCopyExportOperatorDecisionIntent,
      ),
  );
  const unsafeRefs = [
    ...sourceRefs,
    ...evidenceRefs,
    requested_operator_ref,
    requested_idempotency_key,
    review_confirmation_ref,
  ].filter((ref): ref is string =>
    Boolean(ref && !isCandidateIngressPublicSafeRefV01(ref)),
  );
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(handoff_packet_copy_export_preview !== undefined &&
    handoff_packet_copy_export_preview !== null &&
    !copyExportPreview
      ? ["handoff_packet_copy_export_preview_malformed"]
      : []),
    ...(copyExportPreview &&
    copyExportPreview.copy_export_preview_status !==
      "ready_for_future_handoff_packet_copy_export_record_write"
      ? ["handoff_packet_copy_export_preview_not_ready"]
      : []),
    ...(operator_decision_intent &&
    operator_decision_intent !== approvalIntent
      ? ["operator_decision_intent_not_approval"]
      : []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...(copyExportPreview?.missing_evidence ?? []),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0 ? ["handoff_packet_copy_export_decision_refs_unsafe"] : []),
    ...(unsupportedIntent ? ["operator_decision_intent_unsupported"] : []),
    ...(copyExportPreview?.refusal_reasons ?? []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!copyExportPreview ? ["handoff_packet_copy_export_preview_missing"] : []),
    ...(!operator_decision_intent ? ["operator_decision_intent_missing"] : []),
    ...(!requested_operator_ref ? ["requested_operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["requested_idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
  ]);
  const ready =
    Boolean(copyExportPreview) &&
    copyExportPreview?.copy_export_preview_status ===
      "ready_for_future_handoff_packet_copy_export_record_write" &&
    operator_decision_intent === approvalIntent &&
    Boolean(requested_operator_ref) &&
    Boolean(requested_idempotency_key) &&
    Boolean(review_confirmation_ref) &&
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  const status = determineStatus({
    copyExportPreview,
    ready,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });

  return {
    preview_version: HANDOFF_PACKET_COPY_EXPORT_DECISION_PREVIEW_VERSION,
    scope: scope ?? HANDOFF_PACKET_COPY_EXPORT_SCOPE,
    as_of: as_of ?? copyExportPreview?.as_of ?? new Date().toISOString(),
    source_refs: sourceRefs,
    decision_preview_status: status,
    recommended_operator_decision: ready ? approvalIntent : "keep_preview_only",
    available_operator_decisions: decisionIntents,
    input_summary: {
      has_copy_export_preview: Boolean(copyExportPreview),
      copy_export_preview_ready:
        copyExportPreview?.copy_export_preview_status ===
        "ready_for_future_handoff_packet_copy_export_record_write",
      operator_decision_intent: operator_decision_intent ?? null,
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      proposed_packet_entry_count:
        copyExportPreview?.input_summary.proposed_packet_entry_count ?? 0,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
    },
    source_status: {
      handoff_packet_copy_export_preview: copyExportPreview
        ? copyExportPreview.copy_export_preview_status ===
          "ready_for_future_handoff_packet_copy_export_record_write"
          ? "supplied"
          : "not_ready"
        : handoff_packet_copy_export_preview === undefined ||
            handoff_packet_copy_export_preview === null
          ? "missing"
          : "malformed",
      review_confirmation_ref: refStatus(review_confirmation_ref),
      requested_idempotency_key: refStatus(requested_idempotency_key),
      requested_operator_ref: refStatus(requested_operator_ref),
      operator_decision_intent: operator_decision_intent
        ? unsupportedIntent
          ? "unsupported"
          : operator_decision_intent === approvalIntent
            ? "approve"
            : operator_decision_intent === "reject"
              ? "reject"
              : "keep_preview_only"
        : "missing",
    },
    write_readiness: createReadiness({
      ready,
      blockingReasons,
      missingEvidence,
      refusalReasons,
      insufficientData,
    }),
    approval_requirements: [
      "confirm_copy_export_preview_is_ready",
      "confirm_local_artifact_record_is_the_only_write_target",
      "confirm_no_clipboard_download_file_write_or_handoff_send",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_ready_copy_export_preview:
        copyExportPreview?.copy_export_preview_status ===
        "ready_for_future_handoff_packet_copy_export_record_write",
      has_review_confirmation: Boolean(review_confirmation_ref),
      has_idempotency_key: Boolean(requested_idempotency_key),
      has_operator_ref: Boolean(requested_operator_ref),
      has_approval_intent: operator_decision_intent === approvalIntent,
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      no_clipboard_write_confirmed: true,
      no_download_or_file_write_confirmed: true,
      no_handoff_send_confirmed: true,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
    },
    would_write_handoff_packet_copy_export_decision_preview: {
      operator_decision: ready ? approvalIntent : null,
      requested_operator_ref: requested_operator_ref ?? null,
      requested_idempotency_key: requested_idempotency_key ?? null,
      review_confirmation_ref: review_confirmation_ref ?? null,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      copy_export_preview: copyExportPreview,
    },
    operator_review_checklist: [
      "confirm_copy_export_preview_is_ready",
      "confirm_idempotency_key_and_operator_ref_match_preview",
      "confirm_no_clipboard_download_file_write_or_handoff_send",
    ],
    would_not_write: [
      "does_not_write_record_from_decision_preview",
      "does_not_write_clipboard_download_or_file",
      "does_not_send_handoff_or_mutate_live_handoff_context",
    ],
    non_goals: [
      "no_clipboard_write",
      "no_file_download_or_arbitrary_file_write",
      "no_handoff_send",
    ],
    authority_boundary: createHandoffPacketCopyExportDecisionAuthorityBoundaryV01(),
  };
}

function isHandoffPacketCopyExportPreview(
  value: unknown,
): value is HandoffPacketCopyExportPreview {
  return Boolean(
    isRecord(value) &&
      value.preview_version === HANDOFF_PACKET_COPY_EXPORT_PREVIEW_VERSION &&
      value.scope === HANDOFF_PACKET_COPY_EXPORT_SCOPE &&
      isRecord(value.copy_export_readiness) &&
      isRecord(value.evidence_summary) &&
      isRecord(value.authority_boundary),
  );
}

function createReadiness({
  ready,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  ready: boolean;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): HandoffPacketCopyExportDecisionReadiness {
  return {
    write_ready: ready,
    readiness_label: ready ? "write_ready" : "not_write_ready",
    requires_copy_export_preview: true,
    requires_approval_intent: true,
    requires_review_confirmation: true,
    requires_idempotency_key: true,
    requires_operator_ref: true,
    requires_no_blockers: true,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusalReasons,
    current_insufficient_data: insufficientData,
  };
}

function determineStatus({
  copyExportPreview,
  ready,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  copyExportPreview: HandoffPacketCopyExportPreview | null;
  ready: boolean;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): HandoffPacketCopyExportDecisionPreviewStatus {
  if (ready) return "ready_for_future_handoff_packet_copy_export_record_write";
  if (!copyExportPreview || insufficientData.length > 0) return "insufficient_data";
  if (blockingReasons.length || refusalReasons.length) return "blocked";
  if (missingEvidence.length) return "ready_for_operator_review";
  return "keep_preview_only";
}

function refStatus(value: string | undefined): "supplied" | "missing" | "unsafe" {
  if (!value) return "missing";
  return isCandidateIngressPublicSafeRefV01(value) ? "supplied" : "unsafe";
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
