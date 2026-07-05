import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import { METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION } from "@/types/metric-informed-continuity-relay-adjustment-preview";
import {
  PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION,
  type PerspectiveRelayUpdateCandidateBridgePreview,
} from "@/types/perspective-relay-update-candidate-bridge-preview";
import { PERSPECTIVE_RELAY_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION } from "@/types/perspective-relay-update-decision";
import {
  PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_REVIEW_VERSION,
  type PerspectiveRelayUpdateDecisionRecordReview,
} from "@/types/perspective-relay-update-decision-record-review";
import {
  PERSPECTIVE_RELAY_UPDATE_DECISION_SCOPE,
  type PerspectiveRelayUpdateDecisionRecord,
} from "@/types/perspective-relay-update-decision-write";
import {
  PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION,
  type PerspectiveRelayUpdateFutureWriteContract,
  type PerspectiveRelayUpdateWriteContractAuthorityBoundary,
  type PerspectiveRelayUpdateWriteContractPreview,
  type PerspectiveRelayUpdateWriteContractPreviewInput,
  type PerspectiveRelayUpdateWriteContractRecommendedNextAction,
  type PerspectiveRelayUpdateWriteContractStatus,
} from "@/types/perspective-relay-update-write-contract-preview";
import { PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION } from "@/types/perspective-next-work-candidate-update-preview";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

export function buildPerspectiveRelayUpdateWriteContractPreviewV01({
  perspective_relay_update_operator_decision_preview,
  perspective_relay_update_decision_record_review,
  perspective_relay_update_candidate_bridge_preview,
  existing_perspective_next_work_candidate_update_preview,
  existing_metric_informed_continuity_relay_adjustment_preview,
  scope,
  as_of,
  source_refs,
}: PerspectiveRelayUpdateWriteContractPreviewInput = {}): PerspectiveRelayUpdateWriteContractPreview {
  const decisionPreview = isRecord(
    perspective_relay_update_operator_decision_preview,
  ) &&
    perspective_relay_update_operator_decision_preview.preview_version ===
      PERSPECTIVE_RELAY_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION
    ? perspective_relay_update_operator_decision_preview
    : null;
  const recordReview = isPerspectiveRelayUpdateDecisionRecordReview(
    perspective_relay_update_decision_record_review,
  )
    ? perspective_relay_update_decision_record_review
    : null;
  const bridgePreview = isPerspectiveRelayUpdateCandidateBridgePreview(
    perspective_relay_update_candidate_bridge_preview,
  )
    ? perspective_relay_update_candidate_bridge_preview
    : null;
  const perspectivePreview = isRecord(
    existing_perspective_next_work_candidate_update_preview,
  ) &&
    existing_perspective_next_work_candidate_update_preview.preview_version ===
      PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION;
  const relayPreview = isRecord(
    existing_metric_informed_continuity_relay_adjustment_preview,
  ) &&
    existing_metric_informed_continuity_relay_adjustment_preview.preview_version ===
      METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION;
  const decisionEvidenceSummary = isRecord(decisionPreview?.evidence_summary)
    ? decisionPreview.evidence_summary
    : null;
  const validDecisionRecords =
    recordReview &&
    ["records_available", "selected_record_found"].includes(
      recordReview.review_status,
    )
      ? recordReview.records
      : [];
  const latestRecord = validDecisionRecords[0] ?? null;
  const sourceRefs = uniqueCandidateIngressStringsV01([
    PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...safeStringArray(decisionPreview?.source_refs),
    ...(recordReview?.source_refs ?? []),
    ...(bridgePreview?.source_refs ?? []),
    ...(perspectivePreview
      ? [PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION]
      : []),
    ...(relayPreview
      ? [METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION]
      : []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...safeStringArray(decisionEvidenceSummary?.evidence_refs),
    ...(recordReview?.evidence_summary.evidence_refs ?? []),
    ...(bridgePreview?.evidence_summary.evidence_refs ?? []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...safeStringArray(decisionPreview?.missing_evidence),
    ...(recordReview?.evidence_summary.missing_evidence ?? []),
    ...(bridgePreview?.evidence_summary.missing_evidence ?? []),
    ...(evidenceRefs.length === 0
      ? ["perspective_relay_update_write_contract_evidence_refs_missing"]
      : []),
  ]);
  const selectedByTarget = selectedRefsByTargetFromRecord(latestRecord);
  const selectedCount =
    selectedByTarget.perspective_unit.length +
    selectedByTarget.next_work_bias.length +
    selectedByTarget.continuity_relay.length;
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...safeStringArray(decisionPreview?.blocking_reasons),
    ...(recordReview?.blocked_reasons ?? []),
    ...(bridgePreview?.blocked_reasons ?? []),
  ]);
  const insufficientDataReasons = uniqueCandidateIngressStringsV01([
    ...(!bridgePreview
      ? ["perspective_relay_update_candidate_bridge_preview_missing"]
      : []),
    ...(!recordReview || validDecisionRecords.length === 0
      ? ["perspective_relay_update_decision_record_missing"]
      : []),
    ...(selectedCount === 0
      ? ["selected_perspective_relay_update_candidate_refs_missing"]
      : []),
    ...(recordReview?.insufficient_data_reasons ?? []),
    ...(bridgePreview?.insufficient_data_reasons ?? []),
  ]);
  const status = determineStatus({
    hasRecordMaterial: validDecisionRecords.length > 0,
    hasBridgeMaterial: Boolean(bridgePreview),
    selectedCount,
    blockingReasons,
    missingEvidence,
    insufficientDataReasons,
  });

  return {
    preview_version: PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION,
    scope: scope ?? recordReview?.scope ?? bridgePreview?.scope ?? PERSPECTIVE_RELAY_UPDATE_DECISION_SCOPE,
    as_of: as_of ?? recordReview?.as_of ?? bridgePreview?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    contract_preview_status: status,
    recommended_next_action: determineRecommendedNextAction(status),
    input_summary: {
      has_ready_operator_decision_preview: isReadyDecisionPreview(decisionPreview),
      has_decision_record_review: Boolean(recordReview),
      has_valid_decision_records: validDecisionRecords.length > 0,
      has_candidate_bridge_preview: Boolean(bridgePreview),
      selected_perspective_unit_candidate_count:
        selectedByTarget.perspective_unit.length,
      selected_next_work_bias_candidate_count: selectedByTarget.next_work_bias.length,
      selected_continuity_relay_candidate_count:
        selectedByTarget.continuity_relay.length,
      blocker_count: blockingReasons.length,
      insufficient_data_count: insufficientDataReasons.length,
    },
    proposed_future_write_contract: buildFutureWriteContract(selectedByTarget),
    required_source_refs: sourceRefs,
    required_evidence_refs: evidenceRefs,
    selected_candidate_refs_by_target: selectedByTarget,
    blocking_reasons: blockingReasons,
    insufficient_data_reasons: insufficientDataReasons,
    evidence_summary: {
      has_decision_record_material: validDecisionRecords.length > 0,
      has_candidate_bridge_material: Boolean(bridgePreview),
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
    },
    operator_review_checklist: [
      "review_operator_accepted_perspective_relay_update_decision_record",
      "confirm_future_contract_targets_perspective_nextworkbias_and_relay_only",
      "confirm_actual_perspective_cwp_relay_handoff_memory_or_metric_writes_remain_future_work",
    ],
    would_not_write: [
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_mutate_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_apply_or_send_handoff",
      "does_not_write_memory_or_metrics",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "perspective_unit_write",
      "next_work_bias_write",
      "cwp_mutation",
      "continuity_relay_write",
      "handoff_context_apply_or_send",
      "memory_write",
      "metric_write",
      "external_action",
    ],
    authority_boundary:
      createPerspectiveRelayUpdateWriteContractAuthorityBoundaryV01(),
  };
}

export function createPerspectiveRelayUpdateWriteContractAuthorityBoundaryV01(): PerspectiveRelayUpdateWriteContractAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_write_dogfood_metrics: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Write contract preview prepares a future scoped write slice only.",
      "It cannot write PerspectiveUnit, NextWorkBias, CWP, relay, handoff, memory, metrics, provider, GitHub, Codex, graph, vector, RAG, crawler, or browser state.",
    ],
  };
}

function determineStatus({
  hasRecordMaterial,
  hasBridgeMaterial,
  selectedCount,
  blockingReasons,
  missingEvidence,
  insufficientDataReasons,
}: {
  hasRecordMaterial: boolean;
  hasBridgeMaterial: boolean;
  selectedCount: number;
  blockingReasons: string[];
  missingEvidence: string[];
  insufficientDataReasons: string[];
}): PerspectiveRelayUpdateWriteContractStatus {
  if (!hasRecordMaterial && !hasBridgeMaterial) {
    return "no_perspective_relay_update_decision_material";
  }
  if (
    hasRecordMaterial &&
    hasBridgeMaterial &&
    selectedCount > 0 &&
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    insufficientDataReasons.length === 0
  ) {
    return "contract_ready_for_future_scoped_write_slice";
  }
  if (selectedCount > 0) return "future_write_contract_candidates_available";
  return "insufficient_data";
}

function determineRecommendedNextAction(
  status: PerspectiveRelayUpdateWriteContractStatus,
): PerspectiveRelayUpdateWriteContractRecommendedNextAction {
  if (status === "contract_ready_for_future_scoped_write_slice") {
    return "review_perspective_relay_update_write_contract";
  }
  if (status === "future_write_contract_candidates_available") {
    return "review_perspective_relay_update_write_contract";
  }
  if (status === "no_perspective_relay_update_decision_material") {
    return "supply_perspective_relay_update_decision";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "resolve_perspective_relay_update_blockers";
}

function buildFutureWriteContract(
  selectedByTarget: {
    perspective_unit: string[];
    next_work_bias: string[];
    continuity_relay: string[];
  },
): PerspectiveRelayUpdateFutureWriteContract {
  return {
    perspective_unit_update_contract: {
      selected_candidate_refs: selectedByTarget.perspective_unit,
      future_record_kind: "perspective_unit_update_contract.future",
      write_implemented_in_this_pr: false,
    },
    next_work_bias_update_contract: {
      selected_candidate_refs: selectedByTarget.next_work_bias,
      future_record_kind: "next_work_bias_update_contract.future",
      write_implemented_in_this_pr: false,
    },
    continuity_relay_update_contract: {
      selected_candidate_refs: selectedByTarget.continuity_relay,
      future_record_kind: "continuity_relay_update_contract.future",
      write_implemented_in_this_pr: false,
    },
  };
}

function selectedRefsByTargetFromRecord(
  record: PerspectiveRelayUpdateDecisionRecord | null,
): {
  perspective_unit: string[];
  next_work_bias: string[];
  continuity_relay: string[];
} {
  return {
    perspective_unit: record?.selected_perspective_unit_candidate_refs ?? [],
    next_work_bias: record?.selected_next_work_bias_candidate_refs ?? [],
    continuity_relay: record?.selected_continuity_relay_candidate_refs ?? [],
  };
}

function isReadyDecisionPreview(value: Record<string, unknown> | null): boolean {
  return (
    value?.decision_preview_status ===
      "ready_for_future_perspective_relay_update_decision_record_write" &&
    value.recommended_operator_decision ===
      "approve_for_perspective_relay_update_decision_record" &&
    isRecord(value.write_readiness) &&
    value.write_readiness.write_ready === true
  );
}

function isPerspectiveRelayUpdateDecisionRecordReview(
  value: unknown,
): value is PerspectiveRelayUpdateDecisionRecordReview {
  return (
    isRecord(value) &&
    value.review_version === PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.evidence_summary)
  );
}

function isPerspectiveRelayUpdateCandidateBridgePreview(
  value: unknown,
): value is PerspectiveRelayUpdateCandidateBridgePreview {
  return (
    isRecord(value) &&
    value.preview_version === PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION &&
    isRecord(value.proposed_perspective_unit_candidates) &&
    isRecord(value.proposed_next_work_bias_candidates) &&
    isRecord(value.proposed_continuity_relay_candidates) &&
    isRecord(value.evidence_summary)
  );
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
