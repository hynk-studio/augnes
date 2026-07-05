import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_CONTEXT_UPDATE_CONTRACT_DECISION_PREVIEW_VERSION,
  type HandoffContextUpdateContractDecisionAuthorityBoundary,
  type HandoffContextUpdateContractDecisionPreviewInput,
  type HandoffContextUpdateContractDecisionPreviewStatus,
  type HandoffContextUpdateContractDecisionReadiness,
  type HandoffContextUpdateContractOperatorDecisionIntent,
  type HandoffContextUpdateContractOperatorDecisionPreview,
} from "@/types/handoff-context-update-contract-decision";
import {
  HANDOFF_CONTEXT_UPDATE_CONTRACT_PREVIEW_VERSION,
  HANDOFF_CONTEXT_UPDATE_CONTRACT_SCOPE,
  type HandoffContextUpdateContractPreview,
} from "@/types/handoff-context-update-contract-preview";

type RecordValue = Record<string, unknown>;

const approvalIntent =
  "approve_for_handoff_context_update_contract_record" as const;
const decisionIntents: HandoffContextUpdateContractOperatorDecisionIntent[] = [
  approvalIntent,
  "keep_existing_handoff_context",
  "keep_preview_only",
  "reject",
];

export function buildHandoffContextUpdateContractOperatorDecisionPreviewV01({
  handoff_context_update_contract_preview,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  operator_decision_intent,
  scope,
  as_of,
  source_refs,
}: HandoffContextUpdateContractDecisionPreviewInput = {}):
  HandoffContextUpdateContractOperatorDecisionPreview {
  const contractPreview = isHandoffContextUpdateContractPreview(
    handoff_context_update_contract_preview,
  )
    ? handoff_context_update_contract_preview
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
      !decisionIntents.includes(operator_decision_intent),
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
    ...(handoff_context_update_contract_preview !== undefined &&
    handoff_context_update_contract_preview !== null &&
    !contractPreview
      ? ["handoff_context_update_contract_preview_malformed"]
      : []),
    ...(contractPreview &&
    contractPreview.contract_preview_status !==
      "ready_for_future_handoff_context_update_contract_record_write"
      ? ["handoff_context_update_contract_preview_not_ready"]
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
    ...(unsafeRefs.length > 0 ? ["handoff_context_update_decision_refs_unsafe"] : []),
    ...(unsupportedIntent ? ["operator_decision_intent_unsupported"] : []),
    ...(contractPreview?.refusal_reasons ?? []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!contractPreview ? ["handoff_context_update_contract_preview_missing"] : []),
    ...(!operator_decision_intent ? ["operator_decision_intent_missing"] : []),
    ...(!requested_operator_ref ? ["requested_operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["requested_idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
  ]);
  const ready =
    Boolean(contractPreview) &&
    contractPreview?.contract_preview_status ===
      "ready_for_future_handoff_context_update_contract_record_write" &&
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
    preview_version: HANDOFF_CONTEXT_UPDATE_CONTRACT_DECISION_PREVIEW_VERSION,
    scope: scope ?? HANDOFF_CONTEXT_UPDATE_CONTRACT_SCOPE,
    as_of: as_of ?? contractPreview?.as_of ?? new Date().toISOString(),
    source_refs: sourceRefs,
    decision_preview_status: status,
    recommended_operator_decision: ready
      ? approvalIntent
      : operator_decision_intent === "keep_existing_handoff_context"
        ? "keep_existing_handoff_context"
        : "keep_preview_only",
    available_operator_decisions: decisionIntents,
    input_summary: {
      has_contract_preview: Boolean(contractPreview),
      contract_preview_ready:
        contractPreview?.contract_preview_status ===
        "ready_for_future_handoff_context_update_contract_record_write",
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
      handoff_context_update_contract_preview: contractPreview
        ? contractPreview.contract_preview_status ===
          "ready_for_future_handoff_context_update_contract_record_write"
          ? "supplied"
          : "not_ready"
        : handoff_context_update_contract_preview === undefined ||
            handoff_context_update_contract_preview === null
          ? "missing"
          : "malformed",
      review_confirmation_ref: refStatus(review_confirmation_ref),
      requested_idempotency_key: refStatus(requested_idempotency_key),
      requested_operator_ref: refStatus(requested_operator_ref),
      operator_decision_intent: operator_decision_intent
        ? unsupportedIntent
          ? "unsupported"
          : "supplied"
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
      "confirm_operator_approval_for_scoped_local_handoff_context_update_contract_record",
      "confirm_no_handoff_apply_or_send_by_this_slice",
      "confirm_idempotency_key_and_operator_ref_match_preview",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_ready_contract_preview:
        contractPreview?.contract_preview_status ===
        "ready_for_future_handoff_context_update_contract_record_write",
      has_review_confirmation: Boolean(review_confirmation_ref),
      has_idempotency_key: Boolean(requested_idempotency_key),
      has_operator_ref: Boolean(requested_operator_ref),
      has_approval_intent: operator_decision_intent === approvalIntent,
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
    },
    would_write_handoff_context_update_contract_decision_preview: {
      operator_decision: ready ? approvalIntent : null,
      requested_operator_ref: requested_operator_ref ?? null,
      requested_idempotency_key: requested_idempotency_key ?? null,
      review_confirmation_ref: review_confirmation_ref ?? null,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      contract_preview: contractPreview,
    },
    operator_review_checklist: [
      "confirm_contract_preview_is_ready",
      "confirm_handoff_context_update_contract_record_is_the_only_write_target",
      "confirm_future_apply_slice_required_before handoff mutation or send",
    ],
    would_not_write: [
      "does_not_write_record_from_decision_preview",
      "does_not_apply_or_send_handoff",
      "does_not_mutate_cwp_route_snapshot_memory_metrics_or_external_systems",
    ],
    non_goals: [
      "no_live_handoff_context_update",
      "no_handoff_send",
      "no_selected_refs_live_packet_write",
    ],
    authority_boundary:
      createHandoffContextUpdateContractDecisionAuthorityBoundaryV01(),
  };
}

export function createHandoffContextUpdateContractDecisionAuthorityBoundaryV01():
  HandoffContextUpdateContractDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    operator_decision_preview_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_handoff_context_update_contract_record: false,
    can_apply_handoff_context_update: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_write_selected_refs_to_live_handoff: false,
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
      "Decision preview is read-only and cannot persist records.",
      "Only the scoped local writer can create handoff context update contract records after explicit operator approval.",
    ],
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
  contractPreview: HandoffContextUpdateContractPreview | null;
  ready: boolean;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): HandoffContextUpdateContractDecisionPreviewStatus {
  if (!contractPreview) return "no_handoff_context_update_contract_preview";
  if (refusalReasons.length > 0 || blockingReasons.length > 0) return "blocked";
  if (missingEvidence.length > 0) return "needs_more_evidence";
  if (insufficientData.length > 0) return "insufficient_data";
  if (ready) return "ready_for_future_handoff_context_update_contract_record_write";
  return "ready_for_operator_review";
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
}): HandoffContextUpdateContractDecisionReadiness {
  return {
    write_ready: ready,
    readiness_label: ready
      ? "ready_for_scoped_local_handoff_context_update_contract_record_write"
      : "not_ready_for_write",
    requires_contract_preview: true,
    requires_operator_decision_intent: true,
    requires_review_confirmation: true,
    requires_idempotency_key: true,
    requires_operator_ref: true,
    requires_source_refs: true,
    requires_evidence_refs: true,
    requires_no_blockers: true,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusalReasons,
    current_insufficient_data: insufficientData,
  };
}

function isHandoffContextUpdateContractPreview(
  value: unknown,
): value is HandoffContextUpdateContractPreview {
  return (
    isRecord(value) &&
    value.preview_version === HANDOFF_CONTEXT_UPDATE_CONTRACT_PREVIEW_VERSION &&
    value.scope === HANDOFF_CONTEXT_UPDATE_CONTRACT_SCOPE &&
    typeof value.contract_preview_status === "string" &&
    isRecord(value.contract_readiness) &&
    isRecord(value.authority_boundary) &&
    Array.isArray(value.source_refs)
  );
}

function refStatus(value: string | undefined): "supplied" | "missing" | "unsafe" {
  if (!value) return "missing";
  return isCandidateIngressPublicSafeRefV01(value) ? "supplied" : "unsafe";
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
