import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_SEND_CONTRACT_DECISION_PREVIEW_VERSION,
  type HandoffSendContractDecisionAuthorityBoundary,
  type HandoffSendContractDecisionPreviewInput,
  type HandoffSendContractDecisionPreviewStatus,
  type HandoffSendContractDecisionReadiness,
  type HandoffSendContractOperatorDecisionIntent,
  type HandoffSendContractOperatorDecisionPreview,
} from "@/types/handoff-send-contract-decision";
import {
  HANDOFF_SEND_CONTRACT_PREVIEW_VERSION,
  HANDOFF_SEND_CONTRACT_SCOPE,
  type HandoffSendContractPreview,
} from "@/types/handoff-send-contract-preview";

type RecordValue = Record<string, unknown>;

const approvalIntent = "approve_for_handoff_send_contract_record" as const;
const decisionIntents: HandoffSendContractOperatorDecisionIntent[] = [
  approvalIntent,
  "keep_preview_only",
  "reject",
];

export function createHandoffSendContractDecisionAuthorityBoundaryV01():
  HandoffSendContractDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    decision_preview_only: true,
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
      "Decision preview is read-only and cannot write handoff send contract records.",
      "It cannot send handoff, call providers or external messaging systems, write clipboard, create downloads, write files, mutate handoff context, routes, CWP/Perspective/Relay records, memory, metrics, or external systems.",
    ],
  };
}

export function buildHandoffSendContractOperatorDecisionPreviewV01({
  handoff_send_contract_preview,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  operator_decision_intent,
  scope,
  as_of,
  source_refs,
}: HandoffSendContractDecisionPreviewInput = {}):
  HandoffSendContractOperatorDecisionPreview {
  const contractPreview = isHandoffSendContractPreview(
    handoff_send_contract_preview,
  )
    ? handoff_send_contract_preview
    : null;
  const sourceRefs = uniqueCandidateIngressStringsV01([
    ...(source_refs ?? []),
    ...(contractPreview?.source_refs ?? []),
  ]);
  const evidenceRefs = uniqueCandidateIngressStringsV01(
    contractPreview?.evidence_summary.evidence_refs ?? [],
  );
  const unsupportedIntent = Boolean(
    operator_decision_intent &&
      !decisionIntents.includes(
        operator_decision_intent as HandoffSendContractOperatorDecisionIntent,
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
    ...(handoff_send_contract_preview !== undefined &&
    handoff_send_contract_preview !== null &&
    !contractPreview
      ? ["handoff_send_contract_preview_malformed"]
      : []),
    ...(contractPreview &&
    contractPreview.contract_preview_status !==
      "ready_for_future_handoff_send_contract_record_write"
      ? ["handoff_send_contract_preview_not_ready"]
      : []),
    ...(operator_decision_intent &&
    operator_decision_intent !== approvalIntent
      ? ["operator_decision_intent_not_approval"]
      : []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...(contractPreview?.missing_evidence ?? []),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0 ? ["handoff_send_contract_decision_refs_unsafe"] : []),
    ...(unsupportedIntent ? ["operator_decision_intent_unsupported"] : []),
    ...(contractPreview?.refusal_reasons ?? []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!contractPreview ? ["handoff_send_contract_preview_missing"] : []),
    ...(!operator_decision_intent ? ["operator_decision_intent_missing"] : []),
    ...(!requested_operator_ref ? ["requested_operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["requested_idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
  ]);
  const ready =
    Boolean(contractPreview) &&
    contractPreview?.contract_preview_status ===
      "ready_for_future_handoff_send_contract_record_write" &&
    operator_decision_intent === approvalIntent &&
    Boolean(requested_operator_ref) &&
    Boolean(requested_idempotency_key) &&
    Boolean(review_confirmation_ref) &&
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  const status = determineStatus({
    contractPreview,
    ready,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });

  return {
    preview_version: HANDOFF_SEND_CONTRACT_DECISION_PREVIEW_VERSION,
    scope: scope ?? HANDOFF_SEND_CONTRACT_SCOPE,
    as_of: as_of ?? contractPreview?.as_of ?? new Date().toISOString(),
    source_refs: sourceRefs,
    decision_preview_status: status,
    recommended_operator_decision: ready ? approvalIntent : "keep_preview_only",
    available_operator_decisions: decisionIntents,
    input_summary: {
      has_handoff_send_contract_preview: Boolean(contractPreview),
      handoff_send_contract_preview_ready:
        contractPreview?.contract_preview_status ===
        "ready_for_future_handoff_send_contract_record_write",
      operator_decision_intent: operator_decision_intent ?? null,
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
    },
    source_status: {
      handoff_send_contract_preview: contractPreview
        ? contractPreview.contract_preview_status ===
          "ready_for_future_handoff_send_contract_record_write"
          ? "supplied"
          : "not_ready"
        : handoff_send_contract_preview === undefined ||
            handoff_send_contract_preview === null
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
      "confirm_handoff_send_contract_preview_is_ready",
      "confirm_scoped_local_send_contract_record_is_the_only_write_target",
      "confirm_no_handoff_send_provider_external_message_email_slack_webhook_clipboard_download_or_file_write",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_ready_handoff_send_contract_preview:
        contractPreview?.contract_preview_status ===
        "ready_for_future_handoff_send_contract_record_write",
      has_review_confirmation: Boolean(review_confirmation_ref),
      has_idempotency_key: Boolean(requested_idempotency_key),
      has_operator_ref: Boolean(requested_operator_ref),
      has_approval_intent: operator_decision_intent === approvalIntent,
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      no_handoff_send_confirmed: true,
      no_provider_call_confirmed: true,
      no_external_delivery_confirmed: true,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
    },
    would_write_handoff_send_contract_decision_preview: {
      operator_decision: ready ? approvalIntent : null,
      requested_operator_ref: requested_operator_ref ?? null,
      requested_idempotency_key: requested_idempotency_key ?? null,
      review_confirmation_ref: review_confirmation_ref ?? null,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      handoff_send_contract_preview: contractPreview,
    },
    operator_review_checklist: [
      "confirm_handoff_send_contract_preview_is_ready",
      "confirm_idempotency_key_and_operator_ref_match_preview",
      "confirm_future_send_slice_required_before_any_handoff_send",
      "confirm_no_provider_external_message_email_slack_webhook_clipboard_download_or_file_write",
    ],
    would_not_write: [
      "does_not_write_record_from_decision_preview",
      "does_not_send_handoff",
      "does_not_call_provider_email_slack_webhook_github_codex_or_openai",
      "does_not_write_clipboard_download_or_file",
      "does_not_mutate_live_handoff_context_selected_refs_memory_metrics_or_routes",
    ],
    non_goals: [
      "no_handoff_send",
      "no_provider_or_external_messaging_call",
      "no_clipboard_download_or_file_write",
      "no_live_handoff_context_or_selected_refs_mutation",
    ],
    authority_boundary: createHandoffSendContractDecisionAuthorityBoundaryV01(),
  };
}

function isHandoffSendContractPreview(
  value: unknown,
): value is HandoffSendContractPreview {
  return Boolean(
    isRecord(value) &&
      value.preview_version === HANDOFF_SEND_CONTRACT_PREVIEW_VERSION &&
      value.scope === HANDOFF_SEND_CONTRACT_SCOPE &&
      isRecord(value.contract_readiness) &&
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
}): HandoffSendContractDecisionReadiness {
  return {
    write_ready: ready,
    readiness_label: ready ? "write_ready" : "not_write_ready",
    requires_handoff_send_contract_preview: true,
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
  contractPreview,
  ready,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  contractPreview: HandoffSendContractPreview | null;
  ready: boolean;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): HandoffSendContractDecisionPreviewStatus {
  if (ready) return "ready_for_future_handoff_send_contract_record_write";
  if (!contractPreview || insufficientData.length > 0) return "insufficient_data";
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
