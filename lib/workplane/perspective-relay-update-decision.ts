import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION,
  type PerspectiveRelayUpdateCandidateBridgePreview,
} from "@/types/perspective-relay-update-candidate-bridge-preview";
import {
  PERSPECTIVE_RELAY_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION,
  type PerspectiveRelayUpdateAvailableOperatorDecision,
  type PerspectiveRelayUpdateCandidateBucket,
  type PerspectiveRelayUpdateCandidateSummary,
  type PerspectiveRelayUpdateCandidateTarget,
  type PerspectiveRelayUpdateDecisionAuthorityBoundary,
  type PerspectiveRelayUpdateDecisionWriteReadiness,
  type PerspectiveRelayUpdateOperatorDecisionPreview,
  type PerspectiveRelayUpdateOperatorDecisionPreviewInput,
  type PerspectiveRelayUpdateOperatorDecisionStatus,
  type PerspectiveRelayUpdateRecommendedOperatorDecision,
  type PerspectiveRelayUpdateSelectedCandidateRefsByTarget,
  type PerspectiveRelayUpdateWouldWriteDecisionRecordPreview,
} from "@/types/perspective-relay-update-decision";
import {
  PERSPECTIVE_RELAY_UPDATE_DECISION_RECEIPT_VERSION,
  PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_VERSION,
  PERSPECTIVE_RELAY_UPDATE_DECISION_SCOPE,
  PERSPECTIVE_RELAY_UPDATE_DECISION_STORE_VERSION,
} from "@/types/perspective-relay-update-decision-write";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const AVAILABLE_OPERATOR_DECISIONS: PerspectiveRelayUpdateAvailableOperatorDecision[] =
  [
    "approve_for_perspective_relay_update_decision_record",
    "defer",
    "reject",
    "keep_candidate",
    "request_more_evidence",
  ];

const candidateBuckets: Array<{
  target: PerspectiveRelayUpdateCandidateTarget;
  bucket: PerspectiveRelayUpdateCandidateBucket;
  group:
    | "proposed_perspective_unit_candidates"
    | "proposed_next_work_bias_candidates"
    | "proposed_continuity_relay_candidates";
  key: string;
  label: string;
  pressure: "low" | "medium" | "high";
}> = [
  {
    target: "perspective_unit",
    bucket: "perspective_unit_reinforce_candidates",
    group: "proposed_perspective_unit_candidates",
    key: "reinforce_candidates",
    label: "Perspective reinforce",
    pressure: "low",
  },
  {
    target: "perspective_unit",
    bucket: "perspective_unit_weaken_or_warn_candidates",
    group: "proposed_perspective_unit_candidates",
    key: "weaken_or_warn_candidates",
    label: "Perspective warn",
    pressure: "medium",
  },
  {
    target: "perspective_unit",
    bucket: "perspective_unit_retire_or_deprioritize_candidates",
    group: "proposed_perspective_unit_candidates",
    key: "retire_or_deprioritize_candidates",
    label: "Perspective retire or deprioritize",
    pressure: "high",
  },
  {
    target: "perspective_unit",
    bucket: "perspective_unit_split_or_review_candidates",
    group: "proposed_perspective_unit_candidates",
    key: "split_or_review_candidates",
    label: "Perspective split or review",
    pressure: "medium",
  },
  {
    target: "next_work_bias",
    bucket: "next_work_bias_preserve_next_time",
    group: "proposed_next_work_bias_candidates",
    key: "preserve_next_time",
    label: "Next-work preserve",
    pressure: "low",
  },
  {
    target: "next_work_bias",
    bucket: "next_work_bias_warn_next_time",
    group: "proposed_next_work_bias_candidates",
    key: "warn_next_time",
    label: "Next-work warn",
    pressure: "medium",
  },
  {
    target: "next_work_bias",
    bucket: "next_work_bias_drop_or_deprioritize",
    group: "proposed_next_work_bias_candidates",
    key: "drop_or_deprioritize",
    label: "Next-work drop or deprioritize",
    pressure: "high",
  },
  {
    target: "next_work_bias",
    bucket: "next_work_bias_verification_bias",
    group: "proposed_next_work_bias_candidates",
    key: "verification_bias",
    label: "Verification bias",
    pressure: "high",
  },
  {
    target: "next_work_bias",
    bucket: "next_work_bias_context_diet_bias",
    group: "proposed_next_work_bias_candidates",
    key: "context_diet_bias",
    label: "Context diet bias",
    pressure: "medium",
  },
  {
    target: "next_work_bias",
    bucket: "next_work_bias_handoff_quality_bias",
    group: "proposed_next_work_bias_candidates",
    key: "handoff_quality_bias",
    label: "Handoff quality bias",
    pressure: "medium",
  },
  {
    target: "continuity_relay",
    bucket: "continuity_relay_preserve_anchor_candidates",
    group: "proposed_continuity_relay_candidates",
    key: "preserve_anchor_candidates",
    label: "Relay preserve anchor",
    pressure: "low",
  },
  {
    target: "continuity_relay",
    bucket: "continuity_relay_warn_anchor_candidates",
    group: "proposed_continuity_relay_candidates",
    key: "warn_anchor_candidates",
    label: "Relay warn anchor",
    pressure: "medium",
  },
  {
    target: "continuity_relay",
    bucket: "continuity_relay_stop_if_missing_candidates",
    group: "proposed_continuity_relay_candidates",
    key: "stop_if_missing_candidates",
    label: "Relay stop if missing",
    pressure: "high",
  },
  {
    target: "continuity_relay",
    bucket: "continuity_relay_next_focus_candidates",
    group: "proposed_continuity_relay_candidates",
    key: "next_focus_candidates",
    label: "Relay next focus",
    pressure: "medium",
  },
  {
    target: "continuity_relay",
    bucket: "continuity_relay_update_suggestions",
    group: "proposed_continuity_relay_candidates",
    key: "relay_update_suggestions",
    label: "Relay update suggestion",
    pressure: "medium",
  },
];

export function buildPerspectiveRelayUpdateOperatorDecisionPreviewV01({
  perspective_relay_update_candidate_bridge_preview,
  selected_perspective_unit_candidate_refs,
  selected_next_work_bias_candidate_refs,
  selected_continuity_relay_candidate_refs,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  as_of,
  scope,
  source_refs,
}: PerspectiveRelayUpdateOperatorDecisionPreviewInput = {}): PerspectiveRelayUpdateOperatorDecisionPreview {
  const bridgePreview = isPerspectiveRelayUpdateCandidateBridgePreview(
    perspective_relay_update_candidate_bridge_preview,
  )
    ? perspective_relay_update_candidate_bridge_preview
    : null;
  const wrongVersion =
    isRecord(perspective_relay_update_candidate_bridge_preview) &&
    perspective_relay_update_candidate_bridge_preview.preview_version !==
      PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION;
  const sourceRefsRaw = uniqueCandidateIngressStringsV01([
    PERSPECTIVE_RELAY_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...(bridgePreview?.source_refs ?? []),
  ]);
  const bridgeEvidenceRefs = safeStringArray(
    bridgePreview?.evidence_summary.evidence_refs,
  );
  const bridgeMissingEvidence = safeStringArray(
    bridgePreview?.evidence_summary.missing_evidence,
  );
  const evidenceRefs = uniqueCandidateIngressStringsV01(
    bridgeEvidenceRefs,
  ).filter(isCandidateIngressPublicSafeRefV01);
  const candidateSummaries = buildCandidateSummaries(
    bridgePreview,
    evidenceRefs,
  );
  const selectableCandidateRefs = uniqueCandidateIngressStringsV01(
    candidateSummaries.map((candidate) => candidate.candidate_ref),
  );
  const selectedRefsByTarget = {
    perspective_unit: uniqueCandidateIngressStringsV01(
      selected_perspective_unit_candidate_refs ?? [],
    ),
    next_work_bias: uniqueCandidateIngressStringsV01(
      selected_next_work_bias_candidate_refs ?? [],
    ),
    continuity_relay: uniqueCandidateIngressStringsV01(
      selected_continuity_relay_candidate_refs ?? [],
    ),
  };
  const selectedRefs = uniqueCandidateIngressStringsV01([
    ...selectedRefsByTarget.perspective_unit,
    ...selectedRefsByTarget.next_work_bias,
    ...selectedRefsByTarget.continuity_relay,
  ]);
  const selectedSummaries = candidateSummaries.filter((candidate) =>
    selectedRefs.includes(candidate.candidate_ref),
  );
  const unsafeRefs = uniqueCandidateIngressStringsV01([
    ...sourceRefsRaw.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
    ...bridgeEvidenceRefs.filter(
      (ref) => !isCandidateIngressPublicSafeRefV01(ref),
    ),
    ...candidateSummaries
      .map((candidate) => candidate.candidate_ref)
      .filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
    ...selectedRefs.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
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
  const bridgeStatusAllowsDecision =
    bridgePreview?.bridge_preview_status === "update_candidates_available" ||
    bridgePreview?.bridge_preview_status === "ready_for_operator_review";
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(wrongVersion
      ? ["perspective_relay_update_candidate_bridge_preview_version_invalid"]
      : []),
    ...(!bridgePreview
      ? ["perspective_relay_update_candidate_bridge_preview_missing"]
      : []),
    ...(bridgePreview && !hasReadOnlyBridgeAuthority(bridgePreview)
      ? ["perspective_relay_update_candidate_bridge_authority_boundary_invalid"]
      : []),
    ...(bridgePreview && !bridgeStatusAllowsDecision
      ? ["perspective_relay_update_candidate_bridge_not_ready_for_decision"]
      : []),
    ...(bridgePreview?.blocked_reasons ?? []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...bridgeMissingEvidence,
    ...(evidenceRefs.length === 0
      ? ["perspective_relay_update_evidence_refs_missing"]
      : []),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0
      ? ["perspective_relay_update_decision_refs_unsafe"]
      : []),
    ...selectedRefs
      .filter((ref) => !selectableCandidateRefs.includes(ref))
      .map(() => "selected_candidate_refs_not_in_bridge_preview"),
  ]);
  const sourceRefs = sourceRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(candidateSummaries.length === 0
      ? ["perspective_relay_update_candidate_material_missing"]
      : []),
    ...(selectedRefs.length === 0 ? ["selected_candidate_refs_missing"] : []),
    ...(!requested_operator_ref ? ["operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(bridgePreview?.insufficient_data_reasons ?? []),
  ]);
  const writeReadiness = buildWriteReadiness({
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const status = determineStatus({
    bridgePreview,
    writeReadiness,
    wrongVersion,
    selectedRefs,
    candidateSummaries,
  });
  const recommendedDecision = determineRecommendedDecision({
    status,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const wouldWritePreview = buildWouldWriteRecordPreview({
    bridgePreview,
    selectedRefs,
    selectableCandidateRefs,
    selectedRefsByTarget,
    selectedSummaries,
    candidateSummaries,
    sourceRefs,
    evidenceRefs,
    requested_operator_ref,
    requested_idempotency_key,
    review_confirmation_ref,
  });

  return {
    runtime: "augnes",
    preview_version: PERSPECTIVE_RELAY_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: scope ?? bridgePreview?.scope ?? PERSPECTIVE_RELAY_UPDATE_DECISION_SCOPE,
    as_of: as_of ?? bridgePreview?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    decision_preview_status: status,
    recommended_operator_decision: recommendedDecision,
    available_operator_decisions: AVAILABLE_OPERATOR_DECISIONS,
    input_summary: {
      has_perspective_relay_update_candidate_bridge_preview: Boolean(bridgePreview),
      candidate_count: candidateSummaries.length,
      selectable_candidate_ref_count: selectableCandidateRefs.length,
      selected_candidate_ref_count: selectedRefs.length,
      selected_perspective_unit_candidate_ref_count:
        selectedRefsByTarget.perspective_unit.length,
      selected_next_work_bias_candidate_ref_count:
        selectedRefsByTarget.next_work_bias.length,
      selected_continuity_relay_candidate_ref_count:
        selectedRefsByTarget.continuity_relay.length,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
    },
    source_status: {
      perspective_relay_update_candidate_bridge_preview: bridgePreview
        ? "supplied"
        : wrongVersion
          ? "wrong_version"
          : isRecord(perspective_relay_update_candidate_bridge_preview)
            ? "malformed"
            : "missing",
      bridge_authority_boundary: bridgePreview
        ? hasReadOnlyBridgeAuthority(bridgePreview)
          ? "valid_read_only"
          : "invalid"
        : "missing",
      selected_candidate_refs:
        selectedRefs.length === 0
          ? "missing"
          : selectedRefs.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))
            ? "unsafe"
            : selectedRefs.some((ref) => !selectableCandidateRefs.includes(ref))
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
      "review_perspective_relay_update_candidate_bridge_material",
      "confirm_selected_refs_are_candidate_material_for_future_writes_only",
      "confirm_stale_missing_misleading_context_is_warned_or_deprioritized",
      "confirm_skipped_checks_and_not_done_items_are_review_pressure_not_success",
      "confirm_no_perspective_nextworkbias_cwp_relay_handoff_memory_or_metric_write",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_perspective_relay_update_candidate_bridge_preview:
        Boolean(bridgePreview),
      has_candidate_material: candidateSummaries.length > 0,
      has_selected_candidate_refs: selectedRefs.length > 0,
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
    would_write_perspective_relay_update_decision_record_preview:
      wouldWritePreview,
    selected_perspective_unit_candidates: selectedSummaries.filter(
      (candidate) => candidate.target === "perspective_unit",
    ),
    selected_next_work_bias_candidates: selectedSummaries.filter(
      (candidate) => candidate.target === "next_work_bias",
    ),
    selected_continuity_relay_candidates: selectedSummaries.filter(
      (candidate) => candidate.target === "continuity_relay",
    ),
    review_checklist: [
      "review_selected_perspective_unit_nextworkbias_and_relay_candidates",
      "confirm_operator_approval_is_for_local_decision_record_only",
      "confirm_write_contract_preview_remains_read_only",
    ],
    would_not_write: [
      "does_not_write_db",
      "does_not_write_perspective_unit_or_next_work_bias",
      "does_not_mutate_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_apply_or_send_handoff",
      "does_not_write_memory_metrics_reuse_ledger_expected_observed_delta_or_work_episode",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "perspective_unit_write",
      "next_work_bias_write",
      "current_working_perspective_mutation",
      "continuity_relay_write",
      "handoff_context_apply_or_send",
      "memory_write",
      "global_dogfood_metric_update",
      "external_action",
    ],
    authority_boundary: createPerspectiveRelayUpdateDecisionAuthorityBoundaryV01(),
  };
}

export function createPerspectiveRelayUpdateDecisionAuthorityBoundaryV01(): PerspectiveRelayUpdateDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_create_perspective_relay_update_decision_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_current_working_perspective: false,
    can_mutate_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
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
    notes: [
      "Operator decision preview cannot persist decisions or write records.",
      "It prepares scoped perspective relay update decision write material only.",
    ],
  };
}

function buildCandidateSummaries(
  bridgePreview: PerspectiveRelayUpdateCandidateBridgePreview | null,
  evidenceRefs: string[],
): PerspectiveRelayUpdateCandidateSummary[] {
  if (!bridgePreview) return [];
  return candidateBuckets.flatMap(({ target, bucket, group, key, label, pressure }) => {
    const groupValue = bridgePreview[group] as Record<string, unknown>;
    return safeStringArray(groupValue?.[key]).map((candidateRef) => ({
      candidate_ref: candidateRef,
      target,
      bucket,
      label,
      summary: `${label}: ${candidateRef}`,
      evidence_refs: evidenceRefs,
      review_pressure: pressure,
    }));
  });
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
}): PerspectiveRelayUpdateDecisionWriteReadiness {
  const writeReady =
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  return {
    write_ready: writeReady,
    readiness_label: writeReady
      ? "ready_for_future_perspective_relay_update_decision_record_write"
      : "not_ready_for_future_perspective_relay_update_decision_record_write",
    requires_perspective_relay_update_candidate_bridge_preview: true,
    requires_selected_candidate_refs: true,
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
  bridgePreview,
  writeReadiness,
  wrongVersion,
  selectedRefs,
  candidateSummaries,
}: {
  bridgePreview: PerspectiveRelayUpdateCandidateBridgePreview | null;
  writeReadiness: PerspectiveRelayUpdateDecisionWriteReadiness;
  wrongVersion: boolean;
  selectedRefs: string[];
  candidateSummaries: PerspectiveRelayUpdateCandidateSummary[];
}): PerspectiveRelayUpdateOperatorDecisionStatus {
  if (!bridgePreview && !wrongVersion) {
    return "no_perspective_relay_update_candidate_bridge_preview";
  }
  if (writeReadiness.write_ready) {
    return "ready_for_future_perspective_relay_update_decision_record_write";
  }
  if (
    writeReadiness.current_blockers.length > 0 ||
    writeReadiness.current_refusal_reasons.length > 0
  ) {
    return "blocked";
  }
  if (writeReadiness.current_missing_evidence.length > 0) {
    return "needs_more_evidence";
  }
  if (candidateSummaries.length === 0) return "insufficient_data";
  if (selectedRefs.length === 0) return "needs_operator_judgment";
  return "ready_for_operator_decision";
}

function determineRecommendedDecision({
  status,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  status: PerspectiveRelayUpdateOperatorDecisionStatus;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): PerspectiveRelayUpdateRecommendedOperatorDecision {
  if (status === "ready_for_future_perspective_relay_update_decision_record_write") {
    return "approve_for_perspective_relay_update_decision_record";
  }
  if (blockingReasons.length > 0 || refusalReasons.length > 0) {
    return "resolve_blockers";
  }
  if (
    insufficientData.some((reason) =>
      /candidate_bridge|bridge_preview_missing/i.test(reason),
    )
  ) {
    return "defer_until_candidate_bridge_supplied";
  }
  if (missingEvidence.length > 0) return "defer_until_evidence_supplied";
  if (insufficientData.some((reason) => /selected_candidate_refs/i.test(reason))) {
    return "defer_until_selected_candidate_refs_supplied";
  }
  if (insufficientData.some((reason) => /idempotency/i.test(reason))) {
    return "defer_until_idempotency_supplied";
  }
  if (status === "keep_preview_only") return "keep_as_candidate_only";
  return "request_more_evidence";
}

function buildWouldWriteRecordPreview({
  bridgePreview,
  selectedRefs,
  selectableCandidateRefs,
  selectedRefsByTarget,
  selectedSummaries,
  candidateSummaries,
  sourceRefs,
  evidenceRefs,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
}: {
  bridgePreview: PerspectiveRelayUpdateCandidateBridgePreview | null;
  selectedRefs: string[];
  selectableCandidateRefs: string[];
  selectedRefsByTarget: PerspectiveRelayUpdateSelectedCandidateRefsByTarget;
  selectedSummaries: PerspectiveRelayUpdateCandidateSummary[];
  candidateSummaries: PerspectiveRelayUpdateCandidateSummary[];
  sourceRefs: string[];
  evidenceRefs: string[];
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
}): PerspectiveRelayUpdateWouldWriteDecisionRecordPreview {
  const selectableByTarget = {
    perspective_unit: candidateSummaries
      .filter((candidate) => candidate.target === "perspective_unit")
      .map((candidate) => candidate.candidate_ref),
    next_work_bias: candidateSummaries
      .filter((candidate) => candidate.target === "next_work_bias")
      .map((candidate) => candidate.candidate_ref),
    continuity_relay: candidateSummaries
      .filter((candidate) => candidate.target === "continuity_relay")
      .map((candidate) => candidate.candidate_ref),
  };
  return {
    proposed_record_kind: bridgePreview
      ? PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_VERSION
      : null,
    proposed_receipt_kind: bridgePreview
      ? PERSPECTIVE_RELAY_UPDATE_DECISION_RECEIPT_VERSION
      : null,
    proposed_store_kind: bridgePreview
      ? PERSPECTIVE_RELAY_UPDATE_DECISION_STORE_VERSION
      : null,
    selected_candidate_refs: selectedRefs,
    selectable_candidate_refs: selectableCandidateRefs,
    selected_candidate_refs_by_target: selectedRefsByTarget,
    selectable_candidate_refs_by_target: selectableByTarget,
    selected_candidate_summaries: selectedSummaries,
    candidate_summaries: candidateSummaries,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    source_perspective_relay_update_candidate_bridge_preview_ref:
      bridgePreview?.preview_version ?? null,
    requested_operator_ref: requested_operator_ref ?? null,
    requested_idempotency_key: requested_idempotency_key ?? null,
    review_confirmation_ref: review_confirmation_ref ?? null,
    review_summary: bridgePreview
      ? `Perspective relay update decision from ${candidateSummaries.length} bridge candidate(s).`
      : "No perspective relay update candidate bridge preview supplied.",
  };
}

function isPerspectiveRelayUpdateCandidateBridgePreview(
  value: unknown,
): value is PerspectiveRelayUpdateCandidateBridgePreview {
  return (
    isRecord(value) &&
    value.preview_version === PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION &&
    isRecord(value.authority_boundary) &&
    isRecord(value.proposed_perspective_unit_candidates) &&
    isRecord(value.proposed_next_work_bias_candidates) &&
    isRecord(value.proposed_continuity_relay_candidates) &&
    isRecord(value.evidence_summary)
  );
}

function hasReadOnlyBridgeAuthority(
  preview: PerspectiveRelayUpdateCandidateBridgePreview,
): boolean {
  const boundary = preview.authority_boundary;
  return (
    boundary.read_only === true &&
    boundary.candidate_material_only === true &&
    boundary.source_of_truth === false &&
    boundary.derived_read_model === true &&
    boundary.can_write_perspective_unit === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_update_current_working_perspective === false &&
    boundary.can_update_continuity_relay === false &&
    boundary.can_mutate_handoff_context === false &&
    boundary.can_send_handoff === false &&
    boundary.can_write_memory === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_reuse_outcome_ledger === false &&
    boundary.can_write_expected_observed_delta === false &&
    boundary.can_write_work_episode === false &&
    boundary.can_call_provider_openai === false &&
    boundary.can_call_github === false &&
    boundary.can_execute_codex === false
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
