import { createHash } from "node:crypto";

import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  CONTINUITY_RELAY_RECORD_VERSION,
  CONTINUITY_RELAY_RECEIPT_VERSION,
  CONTINUITY_RELAY_SCOPE,
  CONTINUITY_RELAY_STORE_VERSION,
} from "@/types/continuity-relay-write";
import {
  CONTINUITY_RELAY_SCOPED_WRITE_PREVIEW_VERSION,
  type ContinuityRelayBucket,
  type ContinuityRelayDirective,
  type ContinuityRelayEntry,
  type ContinuityRelayScopedWriteAuthorityBoundary,
  type ContinuityRelayScopedWritePreview,
  type ContinuityRelayScopedWritePreviewInput,
  type ContinuityRelayScopedWritePreviewStatus,
  type ContinuityRelayScopedWriteReadiness,
  type ContinuityRelayScopedWriteRecommendedNextAction,
} from "@/types/continuity-relay-scoped-write-preview";
import { PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION } from "@/types/perspective-relay-update-candidate-bridge-preview";
import { PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_REVIEW_VERSION } from "@/types/perspective-relay-update-decision-record-review";
import { PERSPECTIVE_NEXT_WORK_BIAS_RECORD_REVIEW_VERSION } from "@/types/perspective-next-work-bias-record-review";
import { PERSPECTIVE_UNIT_RECORD_REVIEW_VERSION } from "@/types/perspective-unit-record-review";
import {
  type PerspectiveRelayUpdateDecisionRecord,
} from "@/types/perspective-relay-update-decision-write";
import { PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION } from "@/types/perspective-relay-update-write-contract-preview";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const bucketToDirective = new Map<
  ContinuityRelayBucket,
  ContinuityRelayDirective
>([
  ["continuity_relay_preserve_anchor_candidates", "preserve_anchor"],
  ["continuity_relay_warn_anchor_candidates", "warn_anchor"],
  ["continuity_relay_stop_if_missing_candidates", "stop_if_missing"],
  ["continuity_relay_next_focus_candidates", "next_focus"],
  ["continuity_relay_update_suggestions", "relay_update_suggestion"],
  ["preserve_anchor_candidates", "preserve_anchor"],
  ["warn_anchor_candidates", "warn_anchor"],
  ["stop_if_missing_candidates", "stop_if_missing"],
  ["next_focus_candidates", "next_focus"],
  ["relay_update_suggestions", "relay_update_suggestion"],
]);

const validBuckets = new Set(bucketToDirective.keys());

export function buildContinuityRelayScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview,
  perspective_relay_update_decision_record_review,
  perspective_relay_update_candidate_bridge_preview,
  perspective_next_work_bias_record_review,
  perspective_unit_record_review,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  scope,
  as_of,
  source_refs,
}: ContinuityRelayScopedWritePreviewInput = {}): ContinuityRelayScopedWritePreview {
  const writeContract = isWriteContractPreview(
    perspective_relay_update_write_contract_preview,
  )
    ? perspective_relay_update_write_contract_preview
    : null;
  const wrongContractVersion =
    isRecord(perspective_relay_update_write_contract_preview) &&
    perspective_relay_update_write_contract_preview.preview_version !==
      PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION;
  const decisionReview = isDecisionRecordReview(
    perspective_relay_update_decision_record_review,
  )
    ? perspective_relay_update_decision_record_review
    : null;
  const bridgePreview = isRecord(
    perspective_relay_update_candidate_bridge_preview,
  ) &&
    perspective_relay_update_candidate_bridge_preview.preview_version ===
      PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION
    ? perspective_relay_update_candidate_bridge_preview
    : null;
  const nextWorkBiasReview = isNextWorkBiasRecordReview(
    perspective_next_work_bias_record_review,
  )
    ? perspective_next_work_bias_record_review
    : null;
  const perspectiveUnitReview = isPerspectiveUnitRecordReview(
    perspective_unit_record_review,
  )
    ? perspective_unit_record_review
    : null;
  const validDecisionRecords = decisionReview &&
    ["records_available", "selected_record_found"].includes(
      decisionReview.review_status,
    )
    ? decisionReview.records
    : [];
  const contractSelectedRefs = safeStringArray(
    writeContract?.selected_candidate_refs_by_target?.continuity_relay,
  );
  const contractSelectableRefs = safeStringArray(
    writeContract?.proposed_future_write_contract
      ?.continuity_relay_update_contract?.selected_candidate_refs,
  );
  const nonWritablePerspectiveUnitRefs = safeStringArray(
    writeContract?.selected_candidate_refs_by_target?.perspective_unit,
  );
  const nonWritableNextWorkBiasRefs = safeStringArray(
    writeContract?.selected_candidate_refs_by_target?.next_work_bias,
  );
  const relatedPerspectiveUnitRecordRefs =
    perspectiveUnitReview &&
    ["records_available", "selected_record_found"].includes(
      perspectiveUnitReview.review_status,
    ) &&
    perspectiveUnitReview.input_summary.valid_record_count > 0 &&
    !perspectiveUnitReview.evidence_summary.has_receipt_side_effect_problem
      ? uniqueCandidateIngressStringsV01(
          perspectiveUnitReview.records.map(
            (record: { record_id: string }) => record.record_id,
          ),
        )
      : [];
  const relatedNextWorkBiasRecordRefs =
    nextWorkBiasReview &&
    ["records_available", "selected_record_found"].includes(
      nextWorkBiasReview.review_status,
    ) &&
    nextWorkBiasReview.input_summary.valid_record_count > 0 &&
    !nextWorkBiasReview.evidence_summary.has_receipt_side_effect_problem
      ? uniqueCandidateIngressStringsV01(
          nextWorkBiasReview.records.map((record: { record_id: string }) => record.record_id),
        )
      : [];
  const acceptedDecisionContinuityRelayRefs = uniqueCandidateIngressStringsV01(
    validDecisionRecords.flatMap((record) =>
      safeStringArray(record.selected_continuity_relay_candidate_refs),
    ),
  );
  const selectedRefs = uniqueCandidateIngressStringsV01(contractSelectedRefs);
  const sourceRefsRaw = uniqueCandidateIngressStringsV01([
    CONTINUITY_RELAY_SCOPED_WRITE_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...safeStringArray(writeContract?.source_refs),
    ...(decisionReview?.source_refs ?? []),
    ...safeStringArray(bridgePreview?.source_refs),
    ...(perspectiveUnitReview?.source_refs ?? []),
    ...(nextWorkBiasReview?.source_refs ?? []),
  ]);
  const sourceRefs = sourceRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...safeStringArray(writeContract?.required_evidence_refs),
    ...safeStringArray(writeContract?.evidence_summary?.evidence_refs),
    ...(decisionReview?.evidence_summary.evidence_refs ?? []),
    ...(isRecord(bridgePreview?.evidence_summary)
      ? safeStringArray(bridgePreview.evidence_summary.evidence_refs)
      : []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const entries = buildEntries({
    records: validDecisionRecords,
    selectedRefs,
    evidenceRefs,
    sourceRefs,
  });
  const unsafeRefs = uniqueCandidateIngressStringsV01([
    ...sourceRefsRaw.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
    ...safeStringArray(writeContract?.required_evidence_refs).filter(
      (ref) => !isCandidateIngressPublicSafeRefV01(ref),
    ),
    ...selectedRefs.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
    ...contractSelectableRefs.filter(
      (ref) => !isCandidateIngressPublicSafeRefV01(ref),
    ),
    ...acceptedDecisionContinuityRelayRefs.filter(
      (ref) => !isCandidateIngressPublicSafeRefV01(ref),
    ),
    ...(requested_operator_ref && !safeRef(requested_operator_ref)
      ? [requested_operator_ref]
      : []),
    ...(requested_idempotency_key && !safeRef(requested_idempotency_key)
      ? [requested_idempotency_key]
      : []),
    ...(review_confirmation_ref && !safeRef(review_confirmation_ref)
      ? [review_confirmation_ref]
      : []),
  ]);
  const contractReady =
    writeContract?.contract_preview_status ===
    "contract_ready_for_future_scoped_write_slice";
  const decisionReviewValid = Boolean(
    decisionReview &&
      ["records_available", "selected_record_found"].includes(
        decisionReview.review_status,
      ) &&
      decisionReview.input_summary.valid_record_count > 0 &&
      decisionReview.records.length > 0 &&
      !decisionReview.evidence_summary.has_receipt_side_effect_problem,
  );
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(wrongContractVersion
      ? ["perspective_relay_update_write_contract_preview_version_invalid"]
      : []),
    ...(!writeContract
      ? ["perspective_relay_update_write_contract_preview_missing"]
      : []),
    ...(writeContract && !hasReadOnlyWriteContractAuthority(writeContract)
      ? ["perspective_relay_update_write_contract_authority_boundary_invalid"]
      : []),
    ...(writeContract && !contractReady
      ? ["perspective_relay_update_write_contract_not_ready"]
      : []),
    ...(decisionReview && decisionReview.review_status === "records_invalid"
      ? ["perspective_relay_update_decision_record_review_invalid"]
      : []),
    ...(nextWorkBiasReview &&
    nextWorkBiasReview.review_status === "records_invalid"
      ? ["perspective_next_work_bias_record_review_invalid"]
      : []),
    ...(perspectiveUnitReview &&
    perspectiveUnitReview.review_status === "records_invalid"
      ? ["perspective_unit_record_review_invalid"]
      : []),
    ...(decisionReview?.blocked_reasons ?? []),
    ...(writeContract?.blocking_reasons ?? []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...safeStringArray(writeContract?.evidence_summary?.missing_evidence),
    ...(decisionReview?.evidence_summary.missing_evidence ?? []),
    ...(evidenceRefs.length === 0
      ? ["continuity_relay_evidence_refs_missing"]
      : []),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0 ? ["continuity_relay_refs_unsafe"] : []),
    ...selectedRefs
      .filter((ref) => !contractSelectableRefs.includes(ref))
      .map(() => "selected_continuity_relay_refs_not_in_contract"),
    ...selectedRefs
      .filter((ref) => !acceptedDecisionContinuityRelayRefs.includes(ref))
      .map(() => "selected_continuity_relay_refs_not_in_decision_record"),
    ...(entries.length !== selectedRefs.length && selectedRefs.length > 0
      ? ["selected_continuity_relay_entries_missing"]
      : []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!decisionReview ? ["perspective_relay_update_decision_record_review_missing"] : []),
    ...(decisionReview && !decisionReviewValid
      ? ["valid_perspective_relay_update_decision_record_missing"]
      : []),
    ...(selectedRefs.length === 0
      ? ["selected_continuity_relay_candidate_refs_missing"]
      : []),
    ...(!requested_operator_ref ? ["operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(entries.length === 0 && selectedRefs.length > 0
      ? ["continuity_relay_entries_missing"]
      : []),
    ...(writeContract?.insufficient_data_reasons ?? []),
    ...(decisionReview?.insufficient_data_reasons ?? []),
  ]);
  const writeReadiness = buildWriteReadiness({
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const status = determineStatus({
    hasContract: Boolean(writeContract),
    hasSelectedRefs: selectedRefs.length > 0,
    writeReadiness,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });

  return {
    preview_version: CONTINUITY_RELAY_SCOPED_WRITE_PREVIEW_VERSION,
    scope:
      scope ??
      writeContract?.scope ??
      decisionReview?.scope ??
      CONTINUITY_RELAY_SCOPE,
    as_of:
      as_of ?? writeContract?.as_of ?? decisionReview?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    scoped_write_preview_status: status,
    recommended_next_action: determineRecommendedNextAction(status),
    input_summary: {
      has_write_contract_preview: Boolean(writeContract),
      has_decision_record_review: Boolean(decisionReview),
      has_valid_decision_records: decisionReviewValid,
      has_perspective_unit_record_review: Boolean(perspectiveUnitReview),
      has_next_work_bias_record_review: Boolean(nextWorkBiasReview),
      related_perspective_unit_record_count: relatedPerspectiveUnitRecordRefs.length,
      related_next_work_bias_record_count: relatedNextWorkBiasRecordRefs.length,
      selected_continuity_relay_candidate_count: selectedRefs.length,
      non_writable_perspective_unit_candidate_count:
        nonWritablePerspectiveUnitRefs.length,
      non_writable_next_work_bias_candidate_count:
        nonWritableNextWorkBiasRefs.length,
      continuity_relay_entry_count: entries.length,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
    },
    source_status: {
      perspective_relay_update_write_contract_preview: writeContract
        ? "supplied"
        : wrongContractVersion
          ? "wrong_version"
          : isRecord(perspective_relay_update_write_contract_preview)
            ? "malformed"
            : "missing",
      perspective_relay_update_decision_record_review: decisionReview
        ? decisionReviewValid
          ? "supplied"
          : "invalid"
        : isRecord(perspective_relay_update_decision_record_review)
          ? "malformed"
          : "missing",
      selected_continuity_relay_refs:
        selectedRefs.length === 0
          ? "missing"
          : selectedRefs.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))
            ? "unsafe"
            : selectedRefs.some((ref) => !contractSelectableRefs.includes(ref))
              ? "unknown_ref"
              : "supplied",
      review_confirmation_ref: review_confirmation_ref
        ? safeRef(review_confirmation_ref)
          ? "supplied"
          : "unsafe"
        : "missing",
      requested_idempotency_key: requested_idempotency_key
        ? safeRef(requested_idempotency_key)
          ? "supplied"
          : "unsafe"
        : "missing",
      requested_operator_ref: requested_operator_ref
        ? safeRef(requested_operator_ref)
          ? "supplied"
          : "unsafe"
        : "missing",
    },
    write_readiness: writeReadiness,
    approval_requirements: [
      "review_perspective_relay_update_write_contract",
      "confirm_selected_continuity_relay_refs_are_accepted_in_decision_record",
      "confirm_next_work_bias_and_continuity_relay_refs_are_not_written_by_this_slice",
      "confirm_only_scoped_local_continuity_relay_record_and_receipt_may_be_written",
      "confirm_no_cwp_relay_handoff_memory_metric_or_external_mutation",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_write_contract_preview: Boolean(writeContract && contractReady),
      has_valid_decision_record_material: decisionReviewValid,
      has_selected_continuity_relay_refs: selectedRefs.length > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_review_confirmation: Boolean(review_confirmation_ref),
      has_idempotency_key: Boolean(requested_idempotency_key),
      has_operator_ref: Boolean(requested_operator_ref),
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      has_unsafe_refs: unsafeRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      unsafe_refs: unsafeRefs,
    },
    would_write_continuity_relay_record_preview: {
      proposed_record_kind: CONTINUITY_RELAY_RECORD_VERSION,
      proposed_receipt_kind: CONTINUITY_RELAY_RECEIPT_VERSION,
      proposed_store_kind: CONTINUITY_RELAY_STORE_VERSION,
      selected_continuity_relay_candidate_refs: selectedRefs,
      selectable_continuity_relay_candidate_refs: contractSelectableRefs,
      non_writable_perspective_unit_candidate_refs:
        nonWritablePerspectiveUnitRefs,
      non_writable_next_work_bias_candidate_refs: nonWritableNextWorkBiasRefs,
      continuity_relay_entries: entries,
      related_perspective_unit_record_refs: relatedPerspectiveUnitRecordRefs,
      related_next_work_bias_record_refs: relatedNextWorkBiasRecordRefs,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      source_perspective_relay_update_write_contract_preview_ref:
        writeContract?.preview_version ?? null,
      source_perspective_relay_update_decision_record_refs:
        validDecisionRecords.map((record) => record.record_id),
      requested_operator_ref: safeRef(requested_operator_ref),
      requested_idempotency_key: safeRef(requested_idempotency_key),
      review_confirmation_ref: safeRef(review_confirmation_ref),
      review_summary:
        "Scoped local ContinuityRelay record write candidate; NextWorkBias, CWP, relay, handoff, memory, metrics, upstream ledgers, and external effects remain out of scope.",
    },
    selected_continuity_relay_candidates: selectedRefs,
    continuity_relay_entries: entries,
    related_perspective_unit_record_refs: relatedPerspectiveUnitRecordRefs,
    related_next_work_bias_record_refs: relatedNextWorkBiasRecordRefs,
    operator_review_checklist: [
      "review_selected_continuity_relay_entries",
      "confirm_entries_match_accepted_perspective_relay_update_decision_record",
      "confirm_perspective_unit_and_next_work_bias_context_is_advisory_only",
      "confirm_workbench_does_not_call_route_or_render_action_buttons",
    ],
    would_not_write: [
      "does_not_write_next_work_bias",
      "does_not_mutate_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_apply_or_send_handoff",
      "does_not_write_memory_or_metrics",
      "does_not_write_upstream_ledgers",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "next_work_bias_write",
      "perspective_unit_write",
      "cwp_mutation",
      "live_continuity_relay_update",
      "handoff_apply_or_send",
      "memory_write",
      "metric_write",
      "reuse_expected_observed_or_work_episode_write",
      "external_action",
    ],
    authority_boundary:
      createContinuityRelayScopedWriteAuthorityBoundaryV01(),
  };
}

export function createContinuityRelayScopedWriteAuthorityBoundaryV01(): ContinuityRelayScopedWriteAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_create_continuity_relay_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_current_working_perspective: false,
    can_mutate_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
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
      "Preview prepares a scoped local ContinuityRelay record write only.",
      "It cannot write DB, NextWorkBias, CWP, continuity relay, handoff, memory, metrics, upstream ledgers, provider, GitHub, Codex, PR, autonomous, graph, vector, RAG, crawler, browser, or Workbench action state.",
    ],
  };
}

function buildEntries({
  records,
  selectedRefs,
  evidenceRefs,
  sourceRefs,
}: {
  records: PerspectiveRelayUpdateDecisionRecord[];
  selectedRefs: string[];
  evidenceRefs: string[];
  sourceRefs: string[];
}): ContinuityRelayEntry[] {
  const summaries = records.flatMap((record) => record.continuity_relay_candidates);
  return selectedRefs.flatMap((selectedRef) => {
    const summary = summaries.find(
      (candidate) => candidate.candidate_ref === selectedRef,
    );
    if (!summary || !validBuckets.has(summary.bucket as ContinuityRelayBucket)) {
      return [];
    }
    const bucket = summary.bucket as ContinuityRelayBucket;
    return [
      {
        continuity_relay_ref: `continuity-relay:${hashText(selectedRef).slice(0, 24)}`,
        source_candidate_ref: selectedRef,
        bucket,
        relay_directive: bucketToDirective.get(bucket) ?? "warn_anchor",
        summary: summary.summary,
        evidence_refs: uniqueCandidateIngressStringsV01([
          ...summary.evidence_refs,
          ...evidenceRefs,
        ]).filter(isCandidateIngressPublicSafeRefV01),
        source_refs: sourceRefs,
        review_pressure: summary.review_pressure,
        status: statusForDirective(bucketToDirective.get(bucket)),
        persistence_horizon: "local_project_continuity_relay_record",
      },
    ];
  });
}

function statusForDirective(
  directive: ContinuityRelayDirective | undefined,
): ContinuityRelayEntry["status"] {
  if (directive === "preserve_anchor") {
    return "active_scoped_continuity_relay_anchor";
  }
  if (directive === "warn_anchor") return "scoped_continuity_relay_warning";
  if (directive === "stop_if_missing") {
    return "scoped_continuity_relay_stop_condition";
  }
  if (directive === "next_focus") return "scoped_continuity_relay_next_focus";
  return "scoped_continuity_relay_update_suggestion";
}

function buildWriteReadiness({
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): ContinuityRelayScopedWriteReadiness {
  const ready =
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  return {
    write_ready: ready,
    readiness_label: ready
      ? "ready_for_scoped_local_continuity_relay_record_write"
      : "not_ready_for_scoped_local_continuity_relay_record_write",
    requires_perspective_relay_update_write_contract: true,
    requires_perspective_relay_update_decision_record: true,
    requires_selected_continuity_relay_refs: true,
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

function determineStatus({
  hasContract,
  hasSelectedRefs,
  writeReadiness,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  hasContract: boolean;
  hasSelectedRefs: boolean;
  writeReadiness: ContinuityRelayScopedWriteReadiness;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): ContinuityRelayScopedWritePreviewStatus {
  if (!hasContract) return "no_perspective_relay_update_write_contract";
  if (writeReadiness.write_ready) {
    return "ready_for_future_continuity_relay_record_write";
  }
  if (blockingReasons.length > 0 || refusalReasons.length > 0) return "blocked";
  if (missingEvidence.length > 0) return "needs_more_evidence";
  if (hasSelectedRefs && insufficientData.length === 0) {
    return "ready_for_operator_review";
  }
  return "insufficient_data";
}

function determineRecommendedNextAction(
  status: ContinuityRelayScopedWritePreviewStatus,
): ContinuityRelayScopedWriteRecommendedNextAction {
  if (status === "ready_for_future_continuity_relay_record_write") {
    return "write_continuity_relay_record";
  }
  if (status === "ready_for_operator_review") {
    return "review_continuity_relay_scoped_write";
  }
  if (status === "no_perspective_relay_update_write_contract") {
    return "supply_perspective_relay_update_write_contract";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "resolve_continuity_relay_blockers";
}

function hasReadOnlyWriteContractAuthority(value: Record<string, unknown>): boolean {
  const authority = isRecord(value.authority_boundary)
    ? value.authority_boundary
    : null;
  return Boolean(
    authority &&
      authority.read_only === true &&
      authority.candidate_material_only === true &&
      authority.derived_read_model === true &&
      authority.can_write_perspective_unit === false &&
      authority.can_write_next_work_bias === false &&
      authority.can_update_current_working_perspective === false &&
      authority.can_update_continuity_relay === false &&
      authority.can_mutate_handoff_context === false &&
      authority.can_send_handoff === false &&
      authority.can_write_memory === false &&
      authority.can_write_dogfood_metrics === false &&
      authority.can_call_provider_openai === false &&
      authority.can_call_github === false &&
      authority.can_execute_codex === false,
  );
}

function isWriteContractPreview(value: unknown): value is Record<string, any> {
  return (
    isRecord(value) &&
    value.preview_version ===
      PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION &&
    isRecord(value.proposed_future_write_contract) &&
    isRecord(value.selected_candidate_refs_by_target)
  );
}

function isDecisionRecordReview(value: unknown): value is Record<string, any> & {
  records: PerspectiveRelayUpdateDecisionRecord[];
} {
  return (
    isRecord(value) &&
    value.review_version === PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
  );
}

function isNextWorkBiasRecordReview(value: unknown): value is Record<string, any> & {
  records: Array<{ record_id: string }>;
} {
  return (
    isRecord(value) &&
    value.review_version === PERSPECTIVE_NEXT_WORK_BIAS_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
  );
}

function isPerspectiveUnitRecordReview(value: unknown): value is Record<string, any> & {
  records: Array<{ record_id: string }>;
} {
  return (
    isRecord(value) &&
    value.review_version === PERSPECTIVE_UNIT_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
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

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
