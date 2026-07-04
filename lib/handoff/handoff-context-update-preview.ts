import {
  HANDOFF_CONTEXT_RELAY_RATIONALE_VERSION,
  type HandoffContextRelayRationale,
  type HandoffContextRelaySelectedRef,
} from "@/types/handoff-context-relay-rationale";
import {
  HANDOFF_CONTEXT_UPDATE_PREVIEW_VERSION,
  type HandoffContextUpdateAuthorityBoundary,
  type HandoffContextUpdateCandidate,
  type HandoffContextUpdateCandidateKind,
  type HandoffContextUpdatePreview,
  type ProposedHandoffContextDietUpdates,
  type ProposedHandoffExpectedReturnSignalUpdates,
  type ProposedHandoffSelectedRefUpdates,
  type ProposedHandoffStopIfMissingUpdates,
  type ProposedHandoffWarningUpdates,
} from "@/types/handoff-context-update-preview";
import {
  METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION,
  type ContinuityRelayAdjustmentCandidate,
  type MetricInformedContinuityRelayAdjustmentPreview,
} from "@/types/metric-informed-continuity-relay-adjustment-preview";

export interface HandoffContextUpdatePreviewInput {
  handoff_context_relay_rationale?: HandoffContextRelayRationale | null;
  metric_informed_relay_adjustment_preview?:
    | MetricInformedContinuityRelayAdjustmentPreview
    | null;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export function buildHandoffContextUpdatePreviewV01(
  input: HandoffContextUpdatePreviewInput,
): HandoffContextUpdatePreview {
  const rationale = isHandoffContextRelayRationale(
    input.handoff_context_relay_rationale,
  )
    ? input.handoff_context_relay_rationale
    : null;
  const adjustmentPreview = isMetricInformedRelayAdjustmentPreview(
    input.metric_informed_relay_adjustment_preview,
  )
    ? input.metric_informed_relay_adjustment_preview
    : null;
  const scope =
    input.scope ?? rationale?.scope ?? adjustmentPreview?.scope ?? "project:augnes";
  const asOf =
    input.as_of ??
    chooseLatestTimestamp(rationale?.as_of ?? "", adjustmentPreview?.as_of ?? "") ??
    new Date(0).toISOString();
  const proposedSelectedRefs = createSelectedRefUpdates();
  const proposedWarnings = createWarningUpdates();
  const proposedContextDiet = createContextDietUpdates();
  const proposedStops = createStopIfMissingUpdates();
  const proposedExpectedReturn = createExpectedReturnSignalUpdates();

  if (adjustmentPreview) {
    mapSelectedRefSignals({
      rationale,
      adjustmentPreview,
      proposedSelectedRefs,
      proposedWarnings,
      proposedContextDiet,
      proposedStops,
    });
    mapWarningSignals({
      rationale,
      adjustmentPreview,
      proposedWarnings,
      proposedContextDiet,
      proposedStops,
    });
    mapContextDietSignals({
      adjustmentPreview,
      proposedWarnings,
      proposedContextDiet,
    });
    mapStopIfMissingSignals({
      adjustmentPreview,
      proposedStops,
      proposedExpectedReturn,
    });
    mapExpectedReturnSignals({
      adjustmentPreview,
      proposedExpectedReturn,
      proposedStops,
    });
  }

  const missingEvidence = missingEvidenceReasons({
    rationale,
    adjustmentPreview,
    proposedSelectedRefs,
    proposedWarnings,
    proposedContextDiet,
    proposedStops,
    proposedExpectedReturn,
  });
  for (const missing of missingEvidence) {
    pushCandidate(
      proposedStops.missing_source_or_evidence_blockers,
      candidateFromMissingEvidence(missing, adjustmentPreview),
    );
  }
  const insufficientDataReasons = insufficientReasons({
    rationale,
    adjustmentPreview,
    missingEvidence,
    proposedSelectedRefs,
    proposedWarnings,
    proposedContextDiet,
    proposedStops,
    proposedExpectedReturn,
  });

  const selectedRefCandidateCount = countUniqueCandidates([
    ...proposedSelectedRefs.add_selected_ref_candidates,
    ...proposedSelectedRefs.reinforce_selected_ref_candidates,
  ]);
  const warningCandidateCount = countUniqueCandidates([
    ...proposedWarnings.add_warning_candidates,
    ...proposedWarnings.strengthen_warning_candidates,
    ...proposedWarnings.stale_warning_candidates,
    ...proposedWarnings.noisy_warning_candidates,
    ...proposedWarnings.misleading_warning_candidates,
    ...proposedWarnings.unknown_warning_candidates,
  ]);
  const contextDietCandidateCount = countUniqueCandidates([
    ...proposedContextDiet.refs_to_deprioritize,
    ...proposedContextDiet.refs_to_exclude_from_handoff,
  ]);
  const stopIfMissingCandidateCount = countUniqueCandidates([
    ...proposedStops.stop_if_missing_candidates,
    ...proposedStops.verification_required_before_handoff,
    ...proposedStops.missing_source_or_evidence_blockers,
  ]);
  const expectedReturnCandidateCount = countUniqueCandidates([
    ...proposedExpectedReturn.expected_return_emphasis_candidates,
    ...proposedExpectedReturn.next_handoff_focus_candidates,
    ...proposedExpectedReturn.mismatch_return_signal_candidates,
  ]);
  const unknownCandidateCount = countUniqueCandidates([
    ...proposedContextDiet.refs_to_keep_unknown,
    ...proposedWarnings.unknown_warning_candidates,
  ]);
  const totalCandidateCount =
    selectedRefCandidateCount +
    warningCandidateCount +
    contextDietCandidateCount +
    stopIfMissingCandidateCount +
    expectedReturnCandidateCount +
    unknownCandidateCount;
  const hasInsufficientData =
    insufficientDataReasons.length > 0 ||
    missingEvidence.length > 0 ||
    adjustmentPreview?.evidence_summary.has_insufficient_data === true;
  const needsReview =
    adjustmentPreview?.candidate_status === "needs_operator_review" ||
    warningCandidateCount > 0 ||
    contextDietCandidateCount > 0 ||
    stopIfMissingCandidateCount > 0 ||
    unknownCandidateCount > 0 ||
    hasInsufficientData;
  const candidateStatus =
    !rationale ||
    !adjustmentPreview ||
    adjustmentPreview.candidate_status === "insufficient_data" ||
    totalCandidateCount === 0
      ? "insufficient_data"
      : needsReview
        ? "needs_operator_review"
        : "update_candidates_available";

  return {
    preview_version: HANDOFF_CONTEXT_UPDATE_PREVIEW_VERSION,
    scope,
    as_of: asOf,
    source_refs: buildSourceRefs({
      rationale,
      adjustmentPreview,
      inputRefs: input.source_refs,
    }),
    candidate_status: candidateStatus,
    input_summary: {
      handoff_context_relay_rationale_ref:
        rationale?.rationale_version ?? null,
      handoff_context_relay_rationale_source_status: rationale
        ? "supplied"
        : "missing",
      metric_informed_relay_adjustment_preview_ref:
        adjustmentPreview?.preview_version ?? null,
      metric_informed_relay_adjustment_candidate_status:
        adjustmentPreview?.candidate_status ?? null,
      selected_ref_candidate_count: selectedRefCandidateCount,
      warning_candidate_count: warningCandidateCount,
      context_diet_candidate_count: contextDietCandidateCount,
      stop_if_missing_candidate_count: stopIfMissingCandidateCount,
      expected_return_signal_candidate_count: expectedReturnCandidateCount,
      unknown_candidate_count: unknownCandidateCount,
      missing_evidence_count: missingEvidence.length,
    },
    proposed_selected_ref_updates: proposedSelectedRefs,
    proposed_warning_updates: proposedWarnings,
    proposed_context_diet_updates: proposedContextDiet,
    proposed_stop_if_missing_updates: proposedStops,
    proposed_expected_return_signal_updates: proposedExpectedReturn,
    evidence_summary: {
      has_handoff_context_relay_rationale: Boolean(rationale),
      has_metric_informed_relay_adjustment_preview:
        Boolean(adjustmentPreview),
      has_selected_ref_signal: selectedRefCandidateCount > 0,
      has_warning_signal: warningCandidateCount > 0,
      has_context_diet_signal: contextDietCandidateCount > 0,
      has_stop_if_missing_signal: stopIfMissingCandidateCount > 0,
      has_expected_return_signal: expectedReturnCandidateCount > 0,
      has_unknown_signal: unknownCandidateCount > 0,
      has_insufficient_data: hasInsufficientData,
      evidence_refs: buildEvidenceRefs({ rationale, adjustmentPreview }),
      missing_evidence: missingEvidence,
    },
    operator_review_checklist: [
      "confirm selected-ref update candidates are evidence-backed and not unknown",
      "confirm unknown refs remain unknown and are not selected into handoff context",
      "confirm stale, missing, noisy, and misleading refs stay visible as warnings, context diet, exclusion, or stop-if-missing candidates",
      "confirm skipped checks and not-done items become verification, stop, or expected-return candidates rather than success",
      "confirm no handoff context write or handoff send is performed",
    ],
    blocked_reasons:
      candidateStatus === "insufficient_data" ? insufficientDataReasons : [],
    insufficient_data_reasons: insufficientDataReasons,
    write_readiness: {
      ready_for_handoff_context_write: false,
      ready_for_handoff_send: false,
      ready_for_selected_ref_update_write: false,
      required_followup: [
        "operator_reviewed_handoff_context_update_write",
        "approved_relay_adjustment_to_handoff_context_write_contract",
        "expected_return_signal_review_policy",
      ],
      refusal_reasons: [
        "handoff_context_write_not_in_scope_for_v0_1",
        "handoff_send_not_in_scope_for_v0_1",
        "selected_ref_update_write_not_in_scope_for_v0_1",
        "candidate_preview_only",
        "operator_review_required_before_any_handoff_context_update",
      ],
    },
    non_goals: uniqueSortedStrings([
      "no_handoff_context_write",
      "no_handoff_send",
      "no_selected_ref_write",
      "no_relay_rebuild_or_relay_write",
      "no_reuse_ledger_read_or_write",
      "no_memory_mutation_or_perspective_apply",
      "no_provider_github_codex_or_autonomous_action",
      ...(rationale?.non_goals ?? []),
      ...(adjustmentPreview?.non_goals ?? []),
    ]),
    authority_boundary: createHandoffContextUpdateAuthorityBoundaryV01(),
  };
}

export function createHandoffContextUpdateAuthorityBoundaryV01(): HandoffContextUpdateAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_write_handoff_context: false,
    can_send_handoff: false,
    can_write_selected_refs: false,
    can_write_continuity_relay: false,
    can_update_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_dogfood_ledger: false,
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
      "Handoff Context Update Preview is read-only candidate material.",
      "It consumes already-built rationale and relay adjustment preview objects; it does not rebuild the relay or read the reuse ledger.",
      "Unknown refs remain unknown and cannot become selected handoff refs.",
    ],
  };
}

function mapSelectedRefSignals({
  rationale,
  adjustmentPreview,
  proposedSelectedRefs,
  proposedWarnings,
  proposedContextDiet,
  proposedStops,
}: {
  rationale: HandoffContextRelayRationale | null;
  adjustmentPreview: MetricInformedContinuityRelayAdjustmentPreview;
  proposedSelectedRefs: ProposedHandoffSelectedRefUpdates;
  proposedWarnings: ProposedHandoffWarningUpdates;
  proposedContextDiet: ProposedHandoffContextDietUpdates;
  proposedStops: ProposedHandoffStopIfMissingUpdates;
}) {
  const candidates = [
    ...adjustmentPreview.proposed_relay_preserve_adjustments
      .reinforce_existing_preserve_anchors,
    ...adjustmentPreview.proposed_relay_preserve_adjustments
      .add_preserve_anchor_candidates,
    ...adjustmentPreview.proposed_relay_preserve_adjustments
      .preserve_with_review_only,
  ];

  for (const candidate of candidates) {
    if (isUnknownCandidate(candidate)) {
      routeUnknownCandidate({
        candidate,
        proposedWarnings,
        proposedContextDiet,
      });
      continue;
    }
    if (!hasEvidence(candidate)) {
      pushCandidate(
        proposedStops.missing_source_or_evidence_blockers,
        candidateFromAdjustmentCandidate({
          candidate,
          kind: "stop_if_missing",
          reviewNote:
            "Selected-ref update candidate lacks evidence and must not be selected.",
        }),
      );
      continue;
    }

    const existingSelectedRefs = rationale
      ? matchingSelectedRefs(candidate, rationale.selected_refs)
      : [];
    const updateCandidate = candidateFromAdjustmentCandidate({
      candidate,
      kind: "selected_ref",
      existingRefs: existingSelectedRefs,
      reviewNote:
        "Selected-ref update candidate is evidence-backed and review-only.",
    });
    if (existingSelectedRefs.length > 0) {
      pushCandidate(
        proposedSelectedRefs.reinforce_selected_ref_candidates,
        updateCandidate,
      );
    } else {
      pushCandidate(proposedSelectedRefs.add_selected_ref_candidates, updateCandidate);
    }
    pushCandidate(proposedSelectedRefs.selected_with_review_only, updateCandidate);
  }
}

function mapWarningSignals({
  rationale,
  adjustmentPreview,
  proposedWarnings,
  proposedContextDiet,
  proposedStops,
}: {
  rationale: HandoffContextRelayRationale | null;
  adjustmentPreview: MetricInformedContinuityRelayAdjustmentPreview;
  proposedWarnings: ProposedHandoffWarningUpdates;
  proposedContextDiet: ProposedHandoffContextDietUpdates;
  proposedStops: ProposedHandoffStopIfMissingUpdates;
}) {
  const candidates = [
    ...adjustmentPreview.proposed_relay_warning_adjustments
      .add_warn_anchor_candidates,
    ...adjustmentPreview.proposed_relay_warning_adjustments
      .strengthen_warn_anchor_candidates,
    ...adjustmentPreview.proposed_relay_warning_adjustments
      .stale_context_warning_candidates,
    ...adjustmentPreview.proposed_relay_warning_adjustments
      .noisy_context_warning_candidates,
    ...adjustmentPreview.proposed_relay_warning_adjustments
      .misleading_context_warning_candidates,
    ...adjustmentPreview.proposed_relay_warning_adjustments
      .unknown_context_warning_candidates,
  ];

  for (const candidate of candidates) {
    if (isUnknownCandidate(candidate)) {
      routeUnknownCandidate({
        candidate,
        proposedWarnings,
        proposedContextDiet,
      });
      continue;
    }
    const existingWarningRefs = rationale
      ? matchingWarningRefs(candidate, rationale)
      : [];
    const warningCandidate = candidateFromAdjustmentCandidate({
      candidate,
      kind: "warning",
      existingRefs: existingWarningRefs,
      reviewNote:
        "Warning update candidate remains review-only and cannot mutate handoff context.",
    });
    if (
      existingWarningRefs.length > 0 ||
      candidate.strength === "strong" ||
      candidate.adjustment_kind === "warn_anchor"
    ) {
      pushCandidate(proposedWarnings.strengthen_warning_candidates, warningCandidate);
    } else {
      pushCandidate(proposedWarnings.add_warning_candidates, warningCandidate);
    }
    if (candidate.source_bucket === "stale" || candidate.source_bucket === "missing") {
      pushCandidate(proposedWarnings.stale_warning_candidates, warningCandidate);
    }
    if (candidate.source_bucket === "noisy") {
      pushCandidate(proposedWarnings.noisy_warning_candidates, warningCandidate);
      pushCandidate(proposedContextDiet.refs_to_deprioritize, {
        ...warningCandidate,
        candidate_kind: "context_diet",
        review_note:
          "Noisy refs should be deprioritized before handoff context updates.",
      });
    }
    if (candidate.source_bucket === "misleading") {
      pushCandidate(proposedWarnings.misleading_warning_candidates, warningCandidate);
      pushCandidate(proposedContextDiet.refs_to_exclude_from_handoff, {
        ...warningCandidate,
        candidate_kind: "context_diet",
        review_note:
          "Misleading refs should be excluded from handoff context unless later evidence changes.",
      });
    }
    if (candidate.source_bucket === "missing") {
      pushCandidate(proposedStops.stop_if_missing_candidates, {
        ...warningCandidate,
        candidate_kind: "stop_if_missing",
        review_note:
          "Missing refs should block or warn before confident handoff context update.",
      });
    }
  }
}

function mapContextDietSignals({
  adjustmentPreview,
  proposedWarnings,
  proposedContextDiet,
}: {
  adjustmentPreview: MetricInformedContinuityRelayAdjustmentPreview;
  proposedWarnings: ProposedHandoffWarningUpdates;
  proposedContextDiet: ProposedHandoffContextDietUpdates;
}) {
  const candidates = [
    ...adjustmentPreview.proposed_context_diet_adjustments
      .refs_to_drop_or_deprioritize,
    ...adjustmentPreview.proposed_context_diet_adjustments
      .refs_to_exclude_from_next_handoff,
    ...adjustmentPreview.proposed_context_diet_adjustments.refs_to_keep_unknown,
  ];

  for (const candidate of candidates) {
    if (isUnknownCandidate(candidate)) {
      routeUnknownCandidate({
        candidate,
        proposedWarnings,
        proposedContextDiet,
      });
      continue;
    }
    const dietCandidate = candidateFromAdjustmentCandidate({
      candidate,
      kind: "context_diet",
      reviewNote:
        "Context diet candidate is review-only and cannot mutate a handoff packet.",
    });
    pushCandidate(proposedContextDiet.refs_to_deprioritize, dietCandidate);
    if (
      candidate.adjustment_kind === "context_diet" ||
      candidate.source_bucket === "noisy" ||
      candidate.source_bucket === "misleading"
    ) {
      pushCandidate(proposedContextDiet.refs_to_exclude_from_handoff, dietCandidate);
    }
  }
}

function mapStopIfMissingSignals({
  adjustmentPreview,
  proposedStops,
  proposedExpectedReturn,
}: {
  adjustmentPreview: MetricInformedContinuityRelayAdjustmentPreview;
  proposedStops: ProposedHandoffStopIfMissingUpdates;
  proposedExpectedReturn: ProposedHandoffExpectedReturnSignalUpdates;
}) {
  const candidates = [
    ...adjustmentPreview.proposed_stop_if_missing_adjustments
      .add_stop_if_missing_candidates,
    ...adjustmentPreview.proposed_stop_if_missing_adjustments
      .verification_required_before_handoff,
    ...adjustmentPreview.proposed_stop_if_missing_adjustments
      .missing_source_or_evidence_blockers,
  ];

  for (const candidate of candidates) {
    const stopCandidate = candidateFromAdjustmentCandidate({
      candidate,
      kind: "stop_if_missing",
      reviewNote:
        "Stop-if-missing candidate is preview material only and cannot block/send a handoff by itself.",
    });
    pushCandidate(proposedStops.stop_if_missing_candidates, stopCandidate);
    if (candidate.source_bucket === "skipped_or_unverified_check") {
      pushCandidate(
        proposedStops.verification_required_before_handoff,
        stopCandidate,
      );
      pushCandidate(
        proposedExpectedReturn.expected_return_emphasis_candidates,
        {
          ...stopCandidate,
          candidate_kind: "expected_return_signal",
          review_note:
            "Skipped or unverified checks should be emphasized in expected return signal, not counted as success.",
        },
      );
    }
    if (candidate.source_bucket === "missing_evidence") {
      pushCandidate(
        proposedStops.missing_source_or_evidence_blockers,
        stopCandidate,
      );
    }
  }
}

function mapExpectedReturnSignals({
  adjustmentPreview,
  proposedExpectedReturn,
  proposedStops,
}: {
  adjustmentPreview: MetricInformedContinuityRelayAdjustmentPreview;
  proposedExpectedReturn: ProposedHandoffExpectedReturnSignalUpdates;
  proposedStops: ProposedHandoffStopIfMissingUpdates;
}) {
  const candidates = [
    ...adjustmentPreview.proposed_next_focus_adjustments.next_focus_candidates,
    ...adjustmentPreview.proposed_next_focus_adjustments
      .next_relay_update_suggestions,
    ...adjustmentPreview.proposed_next_focus_adjustments.next_handoff_adjustments,
  ];

  for (const candidate of candidates) {
    const expectedCandidate = candidateFromAdjustmentCandidate({
      candidate,
      kind: "expected_return_signal",
      reviewNote:
        "Expected-return update candidate is review-only and cannot mutate handoff context.",
    });
    if (candidate.source_bucket === "not_done_item") {
      pushCandidate(
        proposedExpectedReturn.next_handoff_focus_candidates,
        expectedCandidate,
      );
      pushCandidate(proposedStops.stop_if_missing_candidates, {
        ...expectedCandidate,
        candidate_kind: "stop_if_missing",
        review_note:
          "Not-done items should remain visible before the next handoff proceeds.",
      });
      continue;
    }
    if (candidate.source_bucket === "expected_observed_mismatch") {
      pushCandidate(
        proposedExpectedReturn.mismatch_return_signal_candidates,
        expectedCandidate,
      );
      continue;
    }
    pushCandidate(
      proposedExpectedReturn.expected_return_emphasis_candidates,
      expectedCandidate,
    );
  }
}

function routeUnknownCandidate({
  candidate,
  proposedWarnings,
  proposedContextDiet,
}: {
  candidate: ContinuityRelayAdjustmentCandidate;
  proposedWarnings: ProposedHandoffWarningUpdates;
  proposedContextDiet: ProposedHandoffContextDietUpdates;
}) {
  const unknownCandidate = candidateFromAdjustmentCandidate({
    candidate,
    kind: "unknown_context",
    reviewNote:
      "Unknown context remains unknown and must not become a selected handoff ref.",
  });
  pushCandidate(proposedContextDiet.refs_to_keep_unknown, unknownCandidate);
  pushCandidate(proposedWarnings.unknown_warning_candidates, unknownCandidate);
}

function candidateFromAdjustmentCandidate({
  candidate,
  kind,
  existingRefs = [],
  reviewNote,
}: {
  candidate: ContinuityRelayAdjustmentCandidate;
  kind: HandoffContextUpdateCandidateKind;
  existingRefs?: string[];
  reviewNote: string;
}): HandoffContextUpdateCandidate {
  return {
    candidate_id: `${kind}:${safeId(candidate.candidate_id || candidate.ref_id)}`,
    ref_id: candidate.ref_id,
    label: candidate.label,
    summary: candidate.summary,
    candidate_kind: kind,
    source_bucket: candidate.source_bucket,
    source_adjustment_kind: candidate.adjustment_kind,
    source_candidate_id: candidate.candidate_id,
    source_refs: uniqueSortedStrings([
      candidate.ref_id,
      ...candidate.source_refs,
      ...candidate.evidence_refs,
      ...candidate.source_record_refs,
    ]),
    evidence_refs: uniqueSortedStrings(candidate.evidence_refs),
    source_record_refs: uniqueSortedStrings(candidate.source_record_refs),
    existing_handoff_ref_ids: uniqueSortedStrings(existingRefs),
    candidate_only: true,
    review_note: reviewNote,
  };
}

function candidateFromMissingEvidence(
  value: string,
  adjustmentPreview: MetricInformedContinuityRelayAdjustmentPreview | null,
): HandoffContextUpdateCandidate {
  return {
    candidate_id: `stop_if_missing:missing_evidence:${safeId(value)}`,
    ref_id: value,
    label: value,
    summary: `Missing source or evidence blocks handoff context update readiness: ${value}`,
    candidate_kind: "stop_if_missing",
    source_bucket: "missing_evidence",
    source_adjustment_kind: "stop_if_missing",
    source_candidate_id: `missing_evidence:${safeId(value)}`,
    source_refs: uniqueSortedStrings([
      value,
      ...(adjustmentPreview?.source_refs ?? []),
    ]),
    evidence_refs: [],
    source_record_refs: [],
    existing_handoff_ref_ids: [],
    candidate_only: true,
    review_note:
      "Missing evidence remains review-only and blocks write readiness.",
  };
}

function missingEvidenceReasons({
  rationale,
  adjustmentPreview,
  proposedSelectedRefs,
  proposedWarnings,
  proposedContextDiet,
  proposedStops,
  proposedExpectedReturn,
}: {
  rationale: HandoffContextRelayRationale | null;
  adjustmentPreview: MetricInformedContinuityRelayAdjustmentPreview | null;
  proposedSelectedRefs: ProposedHandoffSelectedRefUpdates;
  proposedWarnings: ProposedHandoffWarningUpdates;
  proposedContextDiet: ProposedHandoffContextDietUpdates;
  proposedStops: ProposedHandoffStopIfMissingUpdates;
  proposedExpectedReturn: ProposedHandoffExpectedReturnSignalUpdates;
}): string[] {
  const reasons = [...(adjustmentPreview?.evidence_summary.missing_evidence ?? [])];
  if (!rationale) reasons.push("handoff_context_relay_rationale_missing");
  if (!adjustmentPreview) {
    reasons.push("metric_informed_relay_adjustment_preview_missing");
  }
  const candidateCount = countUniqueCandidates([
    ...proposedSelectedRefs.add_selected_ref_candidates,
    ...proposedSelectedRefs.reinforce_selected_ref_candidates,
    ...proposedWarnings.add_warning_candidates,
    ...proposedWarnings.strengthen_warning_candidates,
    ...proposedContextDiet.refs_to_deprioritize,
    ...proposedContextDiet.refs_to_exclude_from_handoff,
    ...proposedContextDiet.refs_to_keep_unknown,
    ...proposedStops.stop_if_missing_candidates,
    ...proposedExpectedReturn.expected_return_emphasis_candidates,
    ...proposedExpectedReturn.next_handoff_focus_candidates,
    ...proposedExpectedReturn.mismatch_return_signal_candidates,
  ]);
  if (adjustmentPreview && candidateCount === 0) {
    reasons.push("handoff_context_update_candidate_material_missing");
  }
  return uniqueSortedStrings(reasons);
}

function insufficientReasons({
  rationale,
  adjustmentPreview,
  missingEvidence,
  proposedSelectedRefs,
  proposedWarnings,
  proposedContextDiet,
  proposedStops,
  proposedExpectedReturn,
}: {
  rationale: HandoffContextRelayRationale | null;
  adjustmentPreview: MetricInformedContinuityRelayAdjustmentPreview | null;
  missingEvidence: string[];
  proposedSelectedRefs: ProposedHandoffSelectedRefUpdates;
  proposedWarnings: ProposedHandoffWarningUpdates;
  proposedContextDiet: ProposedHandoffContextDietUpdates;
  proposedStops: ProposedHandoffStopIfMissingUpdates;
  proposedExpectedReturn: ProposedHandoffExpectedReturnSignalUpdates;
}): string[] {
  const reasons = [
    ...(adjustmentPreview?.insufficient_data_reasons ?? []),
    ...missingEvidence,
  ];
  if (!rationale) reasons.push("handoff_context_relay_rationale_missing");
  if (!adjustmentPreview) {
    reasons.push("metric_informed_relay_adjustment_preview_missing");
  }
  if (adjustmentPreview?.candidate_status === "insufficient_data") {
    reasons.push("metric_informed_relay_adjustment_preview_insufficient_data");
  }
  const totalCandidates = countUniqueCandidates([
    ...proposedSelectedRefs.add_selected_ref_candidates,
    ...proposedSelectedRefs.reinforce_selected_ref_candidates,
    ...proposedWarnings.add_warning_candidates,
    ...proposedWarnings.strengthen_warning_candidates,
    ...proposedContextDiet.refs_to_deprioritize,
    ...proposedContextDiet.refs_to_exclude_from_handoff,
    ...proposedContextDiet.refs_to_keep_unknown,
    ...proposedStops.stop_if_missing_candidates,
    ...proposedStops.verification_required_before_handoff,
    ...proposedExpectedReturn.expected_return_emphasis_candidates,
    ...proposedExpectedReturn.next_handoff_focus_candidates,
    ...proposedExpectedReturn.mismatch_return_signal_candidates,
  ]);
  if (adjustmentPreview && totalCandidates === 0) {
    reasons.push("handoff_context_update_candidate_material_missing");
  }
  return uniqueSortedStrings(reasons);
}

function matchingSelectedRefs(
  candidate: ContinuityRelayAdjustmentCandidate,
  refs: HandoffContextRelaySelectedRef[],
): string[] {
  const candidateRefs = new Set([
    candidate.ref_id,
    ...candidate.source_refs,
    ...candidate.evidence_refs,
    ...candidate.source_record_refs,
  ]);
  const normalizedRef = normalizeMatchText(candidate.ref_id);
  const normalizedLabel = normalizeMatchText(candidate.label);
  return refs
    .filter((ref) => {
      if (candidateRefs.has(ref.ref_id)) return true;
      for (const sourceRef of ref.source_refs) {
        if (candidateRefs.has(sourceRef)) return true;
      }
      const refText = normalizeMatchText(
        `${ref.ref_id} ${ref.label} ${ref.summary}`,
      );
      return (
        (normalizedRef.length > 0 && refText.includes(normalizedRef)) ||
        (normalizedLabel.length > 0 && refText.includes(normalizedLabel))
      );
    })
    .map((ref) => ref.ref_id);
}

function matchingWarningRefs(
  candidate: ContinuityRelayAdjustmentCandidate,
  rationale: HandoffContextRelayRationale,
): string[] {
  const candidateRefs = new Set([
    candidate.ref_id,
    ...candidate.source_refs,
    ...candidate.evidence_refs,
    ...candidate.source_record_refs,
  ]);
  const warnings = [
    ...rationale.stale_or_gap_warnings.map((warning) => ({
      id: warning.warning_id,
      text: warning.summary,
      sourceRefs: warning.source_refs,
    })),
    ...rationale.excluded_or_deferred_refs.map((ref) => ({
      id: ref.ref_id,
      text: ref.reason,
      sourceRefs: ref.source_refs,
    })),
    ...rationale.stop_if_missing.map((stop) => ({
      id: stop.stop_id,
      text: stop.summary,
      sourceRefs: stop.source_refs,
    })),
  ];
  const normalizedRef = normalizeMatchText(candidate.ref_id);
  return warnings
    .filter((warning) => {
      if (candidateRefs.has(warning.id)) return true;
      for (const sourceRef of warning.sourceRefs) {
        if (candidateRefs.has(sourceRef)) return true;
      }
      return normalizeMatchText(`${warning.id} ${warning.text}`).includes(
        normalizedRef,
      );
    })
    .map((warning) => warning.id);
}

function buildSourceRefs({
  rationale,
  adjustmentPreview,
  inputRefs,
}: {
  rationale: HandoffContextRelayRationale | null;
  adjustmentPreview: MetricInformedContinuityRelayAdjustmentPreview | null;
  inputRefs?: string[];
}): string[] {
  return uniqueSortedStrings([
    HANDOFF_CONTEXT_UPDATE_PREVIEW_VERSION,
    HANDOFF_CONTEXT_RELAY_RATIONALE_VERSION,
    METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION,
    ...(inputRefs ?? []),
    ...(rationale?.source_refs.source_refs ?? []),
    ...(rationale
      ? [`handoff_context_relay_rationale:${rationale.rationale_version}:${rationale.as_of}`]
      : []),
    ...(adjustmentPreview?.source_refs ?? []),
    ...(adjustmentPreview
      ? [
          `metric_informed_continuity_relay_adjustment_preview:${adjustmentPreview.as_of}`,
        ]
      : []),
  ]);
}

function buildEvidenceRefs({
  rationale,
  adjustmentPreview,
}: {
  rationale: HandoffContextRelayRationale | null;
  adjustmentPreview: MetricInformedContinuityRelayAdjustmentPreview | null;
}): string[] {
  return uniqueSortedStrings([
    ...(rationale?.source_refs.evidence_refs ?? []),
    ...(adjustmentPreview?.evidence_summary.evidence_refs ?? []),
  ]);
}

function isHandoffContextRelayRationale(
  value: HandoffContextRelayRationale | null | undefined,
): value is HandoffContextRelayRationale {
  return value?.rationale_version === HANDOFF_CONTEXT_RELAY_RATIONALE_VERSION;
}

function isMetricInformedRelayAdjustmentPreview(
  value: MetricInformedContinuityRelayAdjustmentPreview | null | undefined,
): value is MetricInformedContinuityRelayAdjustmentPreview {
  return (
    value?.preview_version ===
    METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION
  );
}

function hasEvidence(candidate: ContinuityRelayAdjustmentCandidate): boolean {
  return candidate.evidence_refs.length > 0;
}

function isUnknownCandidate(
  candidate: ContinuityRelayAdjustmentCandidate,
): boolean {
  return (
    candidate.source_bucket === "unknown" ||
    candidate.adjustment_kind === "unknown_context" ||
    /\bunknown\b|unknown[-_:]/i.test(candidate.ref_id) ||
    /\bunknown\b|unknown[-_:]/i.test(candidate.label)
  );
}

function createSelectedRefUpdates(): ProposedHandoffSelectedRefUpdates {
  return {
    add_selected_ref_candidates: [],
    reinforce_selected_ref_candidates: [],
    selected_with_review_only: [],
  };
}

function createWarningUpdates(): ProposedHandoffWarningUpdates {
  return {
    add_warning_candidates: [],
    strengthen_warning_candidates: [],
    stale_warning_candidates: [],
    noisy_warning_candidates: [],
    misleading_warning_candidates: [],
    unknown_warning_candidates: [],
  };
}

function createContextDietUpdates(): ProposedHandoffContextDietUpdates {
  return {
    refs_to_deprioritize: [],
    refs_to_exclude_from_handoff: [],
    refs_to_keep_unknown: [],
  };
}

function createStopIfMissingUpdates(): ProposedHandoffStopIfMissingUpdates {
  return {
    stop_if_missing_candidates: [],
    verification_required_before_handoff: [],
    missing_source_or_evidence_blockers: [],
  };
}

function createExpectedReturnSignalUpdates(): ProposedHandoffExpectedReturnSignalUpdates {
  return {
    expected_return_emphasis_candidates: [],
    next_handoff_focus_candidates: [],
    mismatch_return_signal_candidates: [],
  };
}

function pushCandidate(
  list: HandoffContextUpdateCandidate[],
  candidate: HandoffContextUpdateCandidate,
) {
  const existing = list.find(
    (item) => item.candidate_id === candidate.candidate_id,
  );
  if (!existing) {
    list.push({
      ...candidate,
      source_refs: uniqueSortedStrings(candidate.source_refs),
      evidence_refs: uniqueSortedStrings(candidate.evidence_refs),
      source_record_refs: uniqueSortedStrings(candidate.source_record_refs),
      existing_handoff_ref_ids: uniqueSortedStrings(
        candidate.existing_handoff_ref_ids,
      ),
    });
    return;
  }
  existing.source_refs = uniqueSortedStrings([
    ...existing.source_refs,
    ...candidate.source_refs,
  ]);
  existing.evidence_refs = uniqueSortedStrings([
    ...existing.evidence_refs,
    ...candidate.evidence_refs,
  ]);
  existing.source_record_refs = uniqueSortedStrings([
    ...existing.source_record_refs,
    ...candidate.source_record_refs,
  ]);
  existing.existing_handoff_ref_ids = uniqueSortedStrings([
    ...existing.existing_handoff_ref_ids,
    ...candidate.existing_handoff_ref_ids,
  ]);
}

function countUniqueCandidates(candidates: HandoffContextUpdateCandidate[]) {
  return new Set(candidates.map((candidate) => candidate.candidate_id)).size;
}

function chooseLatestTimestamp(left: string, right: string): string | null {
  if (!left && !right) return null;
  const leftParsed = Date.parse(left);
  const rightParsed = Date.parse(right);

  if (Number.isFinite(leftParsed) && Number.isFinite(rightParsed)) {
    return rightParsed > leftParsed ? right : left;
  }

  return left || right;
}

function normalizeMatchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9:_-]+/g, " ").trim();
}

function safeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort();
}
