import {
  METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION,
  type ContinuityRelayAdjustmentCandidate,
  type ContinuityRelayAdjustmentKind,
  type MetricInformedContinuityRelayAdjustmentAuthorityBoundary,
  type MetricInformedContinuityRelayAdjustmentPreview,
  type ProposedContextDietAdjustments,
  type ProposedNextFocusAdjustments,
  type ProposedRelayPreserveAdjustments,
  type ProposedRelayWarningAdjustments,
  type ProposedStopIfMissingAdjustments,
} from "@/types/metric-informed-continuity-relay-adjustment-preview";
import {
  PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION,
  type PerspectiveNextWorkCandidateBucket,
  type PerspectiveNextWorkCandidateItem,
  type PerspectiveNextWorkCandidateStrength,
  type PerspectiveNextWorkCandidateUpdatePreview,
} from "@/types/perspective-next-work-candidate-update-preview";
import {
  WORKPLANE_CONTINUITY_RELAY_VERSION,
  type WorkplaneContinuityRelay,
  type WorkplaneContinuityRelayAnchor,
} from "@/types/workplane-continuity-relay";

export interface MetricInformedContinuityRelayAdjustmentPreviewInput {
  continuity_relay?: WorkplaneContinuityRelay | null;
  perspective_next_work_candidate_update_preview?:
    | PerspectiveNextWorkCandidateUpdatePreview
    | null;
  as_of?: string;
  scope?: string;
  source_refs?: string[];
}

export function buildMetricInformedContinuityRelayAdjustmentPreviewV01(
  input: MetricInformedContinuityRelayAdjustmentPreviewInput,
): MetricInformedContinuityRelayAdjustmentPreview {
  const relay = isContinuityRelay(input.continuity_relay)
    ? input.continuity_relay
    : null;
  const perspectivePreview = isPerspectiveNextWorkCandidateUpdatePreview(
    input.perspective_next_work_candidate_update_preview,
  )
    ? input.perspective_next_work_candidate_update_preview
    : null;
  const asOf =
    input.as_of ??
    chooseLatestTimestamp(relay?.as_of ?? "", perspectivePreview?.as_of ?? "") ??
    new Date(0).toISOString();
  const scope = input.scope ?? relay?.scope ?? perspectivePreview?.scope ?? "project:augnes";
  const proposedPreserve = createProposedRelayPreserveAdjustments();
  const proposedWarnings = createProposedRelayWarningAdjustments();
  const proposedStops = createProposedStopIfMissingAdjustments();
  const proposedNextFocus = createProposedNextFocusAdjustments();
  const proposedContextDiet = createProposedContextDietAdjustments();

  if (perspectivePreview) {
    mapPreserveSignals({
      relay,
      preview: perspectivePreview,
      proposedPreserve,
      proposedWarnings,
      proposedContextDiet,
    });
    mapWarningSignals({
      relay,
      preview: perspectivePreview,
      proposedWarnings,
      proposedContextDiet,
    });
    mapStopIfMissingSignals({
      preview: perspectivePreview,
      proposedStops,
      proposedContextDiet,
    });
    mapNextFocusSignals({
      preview: perspectivePreview,
      proposedNextFocus,
      proposedStops,
    });
    mapContextDietSignals({
      preview: perspectivePreview,
      proposedWarnings,
      proposedContextDiet,
    });
  }

  const missingEvidence = missingEvidenceReasons({
    relay,
    perspectivePreview,
    proposedPreserve,
    proposedWarnings,
    proposedStops,
    proposedNextFocus,
  });
  const insufficientDataReasons = insufficientReasons({
    relay,
    perspectivePreview,
    missingEvidence,
    proposedPreserve,
    proposedWarnings,
    proposedStops,
    proposedNextFocus,
    proposedContextDiet,
  });
  for (const missing of missingEvidence) {
    const blocker = candidateFromMissingEvidence(missing, perspectivePreview);
    pushCandidate(proposedStops.missing_source_or_evidence_blockers, blocker);
    pushCandidate(proposedStops.add_stop_if_missing_candidates, blocker);
  }

  const preserveCandidateCount = countUniqueCandidates([
    ...proposedPreserve.reinforce_existing_preserve_anchors,
    ...proposedPreserve.add_preserve_anchor_candidates,
  ]);
  const warnCandidateCount = countUniqueCandidates([
    ...proposedWarnings.add_warn_anchor_candidates,
    ...proposedWarnings.strengthen_warn_anchor_candidates,
    ...proposedWarnings.stale_context_warning_candidates,
    ...proposedWarnings.noisy_context_warning_candidates,
    ...proposedWarnings.misleading_context_warning_candidates,
    ...proposedWarnings.unknown_context_warning_candidates,
  ]);
  const stopCandidateCount = countUniqueCandidates([
    ...proposedStops.add_stop_if_missing_candidates,
    ...proposedStops.verification_required_before_handoff,
    ...proposedStops.missing_source_or_evidence_blockers,
  ]);
  const nextFocusCandidateCount = countUniqueCandidates([
    ...proposedNextFocus.next_focus_candidates,
    ...proposedNextFocus.next_relay_update_suggestions,
    ...proposedNextFocus.next_handoff_adjustments,
  ]);
  const contextDietCandidateCount = countUniqueCandidates([
    ...proposedContextDiet.refs_to_drop_or_deprioritize,
    ...proposedContextDiet.refs_to_exclude_from_next_handoff,
  ]);
  const unknownCandidateCount = countUniqueCandidates([
    ...proposedContextDiet.refs_to_keep_unknown,
    ...proposedWarnings.unknown_context_warning_candidates,
  ]);
  const hasInsufficientData =
    insufficientDataReasons.length > 0 ||
    missingEvidence.length > 0 ||
    perspectivePreview?.evidence_summary.has_insufficient_data === true;
  const hasProblemSignal =
    Boolean(perspectivePreview?.evidence_summary.has_problem_signal) ||
    contextDietCandidateCount > 0 ||
    proposedContextDiet.stale_or_gap_warnings.length > 0;
  const hasReviewOnlySignal =
    Boolean(perspectivePreview?.candidate_status === "needs_operator_review") ||
    hasProblemSignal ||
    unknownCandidateCount > 0 ||
    stopCandidateCount > 0;
  const totalCandidateCount =
    preserveCandidateCount +
    warnCandidateCount +
    stopCandidateCount +
    nextFocusCandidateCount +
    contextDietCandidateCount +
    unknownCandidateCount;
  const candidateStatus =
    !relay ||
    !perspectivePreview ||
    perspectivePreview.candidate_status === "insufficient_data" ||
    totalCandidateCount === 0
      ? "insufficient_data"
      : hasInsufficientData || hasReviewOnlySignal
        ? "needs_operator_review"
        : "adjustment_candidates_available";

  return {
    preview_version: METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION,
    scope,
    as_of: asOf,
    source_refs: sourceRefs({ relay, perspectivePreview, inputRefs: input.source_refs }),
    candidate_status: candidateStatus,
    input_summary: {
      continuity_relay_ref: relay?.relay_version ?? null,
      continuity_relay_source_status: relay ? "supplied" : "missing",
      perspective_next_work_preview_ref:
        perspectivePreview?.preview_version ?? null,
      perspective_next_work_candidate_status:
        perspectivePreview?.candidate_status ?? null,
      preserve_candidate_count: preserveCandidateCount,
      warn_candidate_count: warnCandidateCount,
      drop_or_deprioritize_candidate_count: contextDietCandidateCount,
      verification_candidate_count: proposedStops
        .verification_required_before_handoff.length,
      next_focus_candidate_count: proposedNextFocus.next_focus_candidates.length,
      unknown_candidate_count: unknownCandidateCount,
      missing_evidence_count: missingEvidence.length,
    },
    proposed_relay_preserve_adjustments: proposedPreserve,
    proposed_relay_warning_adjustments: proposedWarnings,
    proposed_stop_if_missing_adjustments: proposedStops,
    proposed_next_focus_adjustments: proposedNextFocus,
    proposed_context_diet_adjustments: proposedContextDiet,
    evidence_summary: {
      has_continuity_relay: Boolean(relay),
      has_perspective_next_work_preview: Boolean(perspectivePreview),
      has_preserve_signal: preserveCandidateCount > 0,
      has_warning_signal: warnCandidateCount > 0,
      has_stop_if_missing_signal: stopCandidateCount > 0,
      has_next_focus_signal: nextFocusCandidateCount > 0,
      has_problem_signal: hasProblemSignal,
      has_unknown_signal: unknownCandidateCount > 0,
      has_insufficient_data: hasInsufficientData,
      evidence_refs: evidenceRefs({ relay, perspectivePreview }),
      missing_evidence: missingEvidence,
    },
    operator_review_checklist: [
      "confirm relay preserve candidates are evidence-backed before reinforcement",
      "confirm unknown refs remain unknown and are not preserved",
      "confirm stale, missing, noisy, and misleading refs stay visible as warnings or context diet candidates",
      "confirm skipped checks and not-done items block or steer the next handoff rather than counting as success",
      "confirm no Continuity Relay, CWP, handoff context, PerspectiveUnit, NextWorkBias, memory, metric, or ledger write is performed",
    ],
    blocked_reasons:
      candidateStatus === "insufficient_data" ? insufficientDataReasons : [],
    insufficient_data_reasons: insufficientDataReasons,
    write_readiness: {
      ready_for_continuity_relay_write: false,
      ready_for_cwp_update_write: false,
      ready_for_handoff_context_update_write: false,
      required_followup: [
        "operator_reviewed_continuity_relay_adjustment_write",
        "handoff_context_update_preview_from_approved_relay_adjustments",
        "metric_informed_guidebrief_cwp_projection_adjustments",
      ],
      refusal_reasons: [
        "continuity_relay_write_not_in_scope_for_v0_1",
        "current_working_perspective_update_not_in_scope_for_v0_1",
        "handoff_context_update_not_in_scope_for_v0_1",
        "candidate_preview_only",
        "operator_review_required_before_any_durable_update",
      ],
    },
    non_goals: uniqueSortedStrings([
      "no_continuity_relay_write",
      "no_current_working_perspective_mutation",
      "no_handoff_context_packet_mutation",
      "no_perspective_unit_or_next_work_bias_write",
      "no_memory_mutation_or_promotion",
      "no_dogfood_metric_or_reuse_ledger_write",
      "no_provider_github_codex_handoff_or_autonomous_action",
      ...(relay?.non_goals ?? []),
      ...(perspectivePreview?.non_goals ?? []),
      ...(perspectivePreview?.proposed_carry_forward_memory_candidates
        .non_goal_reminders ?? []),
    ]),
    authority_boundary:
      createMetricInformedContinuityRelayAdjustmentAuthorityBoundaryV01(),
  };
}

export function createMetricInformedContinuityRelayAdjustmentAuthorityBoundaryV01(): MetricInformedContinuityRelayAdjustmentAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_write_continuity_relay: false,
    can_update_current_working_perspective: false,
    can_write_handoff_context: false,
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
    can_send_handoff: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Metric-Informed Continuity Relay Adjustment Preview is read-only candidate material.",
      "It consumes already-built relay and Perspective Next-Work preview objects; it does not rebuild metrics or read the reuse ledger.",
      "Unknown refs remain unknown and cannot become preserve anchors.",
    ],
  };
}

function mapPreserveSignals({
  relay,
  preview,
  proposedPreserve,
  proposedWarnings,
  proposedContextDiet,
}: {
  relay: WorkplaneContinuityRelay | null;
  preview: PerspectiveNextWorkCandidateUpdatePreview;
  proposedPreserve: ProposedRelayPreserveAdjustments;
  proposedWarnings: ProposedRelayWarningAdjustments;
  proposedContextDiet: ProposedContextDietAdjustments;
}) {
  const candidates = [
    ...preview.proposed_perspective_unit_updates.reinforce_candidates,
    ...preview.proposed_next_work_bias_updates.refs_to_preserve_next_time,
    ...preview.proposed_carry_forward_memory_candidates
      .reusable_context_candidates,
  ];

  for (const candidate of candidates) {
    if (isUnknownCandidate(candidate)) {
      const unknown = candidateFromPerspectiveItem({
        item: candidate,
        kind: "unknown_context",
        reviewNote: "Unknown refs must remain unknown and cannot be preserved.",
      });
      pushCandidate(proposedContextDiet.refs_to_keep_unknown, unknown);
      pushCandidate(proposedWarnings.unknown_context_warning_candidates, unknown);
      continue;
    }

    const existingPreserveAnchors = relay
      ? matchingAnchors(candidate, relay.preserve_anchors)
      : [];
    const relayCandidate = candidateFromPerspectiveItem({
      item: candidate,
      kind: "preserve_anchor",
      existingAnchors: existingPreserveAnchors,
      reviewNote:
        "Preserve adjustment is review-only and cannot update the relay.",
    });
    if (existingPreserveAnchors.length > 0) {
      pushCandidate(
        proposedPreserve.reinforce_existing_preserve_anchors,
        relayCandidate,
      );
    } else {
      pushCandidate(proposedPreserve.add_preserve_anchor_candidates, relayCandidate);
    }
    pushCandidate(proposedPreserve.preserve_with_review_only, relayCandidate);
  }
}

function mapWarningSignals({
  relay,
  preview,
  proposedWarnings,
  proposedContextDiet,
}: {
  relay: WorkplaneContinuityRelay | null;
  preview: PerspectiveNextWorkCandidateUpdatePreview;
  proposedWarnings: ProposedRelayWarningAdjustments;
  proposedContextDiet: ProposedContextDietAdjustments;
}) {
  const candidates = [
    ...preview.proposed_perspective_unit_updates.warn_candidates,
    ...preview.proposed_next_work_bias_updates.refs_to_warn_next_time,
    ...preview.proposed_carry_forward_memory_candidates.stale_context_warnings,
  ];

  for (const candidate of candidates) {
    const existingWarnAnchors = relay
      ? matchingAnchors(candidate, [
          ...relay.warn_anchors,
          ...relay.stale_or_gap_warnings,
        ])
      : [];
    const relayCandidate = candidateFromPerspectiveItem({
      item: candidate,
      kind: "warn_anchor",
      existingAnchors: existingWarnAnchors,
      reviewNote:
        "Warning adjustment is review-only and cannot mutate relay warn anchors.",
    });
    if (existingWarnAnchors.length > 0 || candidate.strength === "strong") {
      pushCandidate(proposedWarnings.strengthen_warn_anchor_candidates, relayCandidate);
    } else {
      pushCandidate(proposedWarnings.add_warn_anchor_candidates, relayCandidate);
    }
    if (candidate.source_bucket === "stale") {
      pushCandidate(proposedWarnings.stale_context_warning_candidates, relayCandidate);
      pushCandidate(proposedContextDiet.stale_or_gap_warnings, relayCandidate);
    }
    if (candidate.source_bucket === "missing") {
      pushCandidate(proposedContextDiet.stale_or_gap_warnings, relayCandidate);
    }
    if (candidate.source_bucket === "misleading") {
      pushCandidate(
        proposedWarnings.misleading_context_warning_candidates,
        relayCandidate,
      );
    }
    if (isUnknownCandidate(candidate)) {
      pushCandidate(proposedWarnings.unknown_context_warning_candidates, {
        ...relayCandidate,
        adjustment_kind: "unknown_context",
        review_note: "Unknown refs must remain unknown and cannot be preserved.",
      });
    }
  }
}

function mapStopIfMissingSignals({
  preview,
  proposedStops,
  proposedContextDiet,
}: {
  preview: PerspectiveNextWorkCandidateUpdatePreview;
  proposedStops: ProposedStopIfMissingAdjustments;
  proposedContextDiet: ProposedContextDietAdjustments;
}) {
  const unresolvedGapCandidates =
    preview.proposed_carry_forward_memory_candidates.unresolved_gap_candidates;
  const verificationCandidates =
    preview.proposed_carry_forward_memory_candidates.verification_bias_candidates;

  for (const candidate of unresolvedGapCandidates) {
    const relayCandidate = candidateFromPerspectiveItem({
      item: candidate,
      kind: "stop_if_missing",
      reviewNote:
        "Unresolved gaps should become stop-if-missing candidates before handoff.",
    });
    pushCandidate(proposedStops.add_stop_if_missing_candidates, relayCandidate);
    if (candidate.source_bucket === "missing") {
      pushCandidate(proposedContextDiet.stale_or_gap_warnings, relayCandidate);
    }
  }
  for (const candidate of verificationCandidates) {
    const relayCandidate = candidateFromPerspectiveItem({
      item: candidate,
      kind: "stop_if_missing",
      reviewNote:
        "Skipped or missing verification must be reviewed before handoff.",
    });
    pushCandidate(proposedStops.verification_required_before_handoff, relayCandidate);
    if (
      candidate.source_bucket === "missing" ||
      candidate.source_bucket === "skipped_or_unverified_check"
    ) {
      pushCandidate(proposedStops.add_stop_if_missing_candidates, relayCandidate);
    }
  }
}

function mapNextFocusSignals({
  preview,
  proposedNextFocus,
  proposedStops,
}: {
  preview: PerspectiveNextWorkCandidateUpdatePreview;
  proposedNextFocus: ProposedNextFocusAdjustments;
  proposedStops: ProposedStopIfMissingAdjustments;
}) {
  for (const focus of preview.proposed_next_work_bias_updates
    .next_focus_candidates) {
    const candidate = candidateFromText({
      value: focus,
      kind: "next_focus",
      bucket: "not_done_item",
      preview,
      reviewNote:
        "Next-focus candidate is review-only and cannot command the next relay.",
    });
    pushCandidate(proposedNextFocus.next_focus_candidates, candidate);
    pushCandidate(proposedStops.add_stop_if_missing_candidates, {
      ...candidate,
      adjustment_kind: "stop_if_missing",
      review_note:
        "Not-done items should be explicit before the next handoff proceeds.",
    });
  }
  for (const suggestion of preview.proposed_next_work_bias_updates
    .next_relay_update_suggestions) {
    pushCandidate(
      proposedNextFocus.next_relay_update_suggestions,
      candidateFromText({
        value: suggestion,
        kind: "relay_update_suggestion",
        bucket: "expected_observed_mismatch",
        preview,
        reviewNote:
          "Relay update suggestion is not a relay write and requires review.",
      }),
    );
  }
  for (const adjustment of preview.proposed_next_work_bias_updates
    .next_handoff_adjustments) {
    pushCandidate(
      proposedNextFocus.next_handoff_adjustments,
      candidateFromText({
        value: adjustment,
        kind: "handoff_adjustment",
        bucket: "expected_observed_mismatch",
        preview,
        reviewNote:
          "Handoff adjustment is preview material only and cannot mutate a handoff packet.",
      }),
    );
  }
}

function mapContextDietSignals({
  preview,
  proposedWarnings,
  proposedContextDiet,
}: {
  preview: PerspectiveNextWorkCandidateUpdatePreview;
  proposedWarnings: ProposedRelayWarningAdjustments;
  proposedContextDiet: ProposedContextDietAdjustments;
}) {
  const dropCandidates = [
    ...preview.proposed_perspective_unit_updates.retire_or_deprioritize_candidates,
    ...preview.proposed_next_work_bias_updates.refs_to_drop_or_deprioritize,
  ];
  for (const candidate of dropCandidates) {
    const relayCandidate = candidateFromPerspectiveItem({
      item: candidate,
      kind: "context_diet",
      reviewNote:
        "Drop/deprioritize refs are context diet candidates and cannot delete relay state.",
    });
    pushCandidate(proposedContextDiet.refs_to_drop_or_deprioritize, relayCandidate);
    pushCandidate(proposedContextDiet.refs_to_exclude_from_next_handoff, relayCandidate);
    if (candidate.source_bucket === "noisy") {
      pushCandidate(proposedWarnings.noisy_context_warning_candidates, relayCandidate);
    }
    if (candidate.source_bucket === "misleading") {
      pushCandidate(
        proposedWarnings.misleading_context_warning_candidates,
        relayCandidate,
      );
    }
  }

  const unknownCandidates = [
    ...preview.proposed_perspective_unit_updates.insufficient_data_candidates,
    ...allCandidateItems(preview).filter(isUnknownCandidate),
  ];
  for (const candidate of unknownCandidates) {
    const relayCandidate = candidateFromPerspectiveItem({
      item: candidate,
      kind: "unknown_context",
      reviewNote:
        "Unknown refs stay unknown and must not become preserve anchors.",
    });
    pushCandidate(proposedContextDiet.refs_to_keep_unknown, relayCandidate);
    pushCandidate(proposedWarnings.unknown_context_warning_candidates, relayCandidate);
  }
}

function candidateFromPerspectiveItem({
  item,
  kind,
  existingAnchors = [],
  reviewNote,
}: {
  item: PerspectiveNextWorkCandidateItem;
  kind: ContinuityRelayAdjustmentKind;
  existingAnchors?: WorkplaneContinuityRelayAnchor[];
  reviewNote: string;
}): ContinuityRelayAdjustmentCandidate {
  return {
    candidate_id: `${kind}:${safeId(item.candidate_id || item.ref_id)}`,
    ref_id: item.ref_id,
    label: item.label,
    summary: item.summary,
    source_bucket: item.source_bucket,
    adjustment_kind: kind,
    source_refs: uniqueSortedStrings([
      item.ref_id,
      ...item.evidence_refs,
      ...item.source_record_refs,
      ...existingAnchors.flatMap((anchor) => anchor.source_refs),
    ]),
    evidence_refs: uniqueSortedStrings(item.evidence_refs),
    source_record_refs: uniqueSortedStrings(item.source_record_refs),
    existing_relay_anchor_ids: uniqueSortedStrings(
      existingAnchors.map((anchor) => anchor.anchor_id),
    ),
    strength: item.strength,
    candidate_only: true,
    review_note: reviewNote,
  };
}

function candidateFromText({
  value,
  kind,
  bucket,
  preview,
  reviewNote,
}: {
  value: string;
  kind: ContinuityRelayAdjustmentKind;
  bucket: PerspectiveNextWorkCandidateBucket;
  preview: PerspectiveNextWorkCandidateUpdatePreview;
  reviewNote: string;
}): ContinuityRelayAdjustmentCandidate {
  return {
    candidate_id: `${kind}:${safeId(value)}`,
    ref_id: value,
    label: value,
    summary: value,
    source_bucket: bucket,
    adjustment_kind: kind,
    source_refs: uniqueSortedStrings([value, ...preview.source_refs]),
    evidence_refs: uniqueSortedStrings(preview.evidence_summary.evidence_refs),
    source_record_refs: uniqueSortedStrings(
      preview.input_summary.source_record_refs,
    ),
    existing_relay_anchor_ids: [],
    strength: "moderate",
    candidate_only: true,
    review_note: reviewNote,
  };
}

function candidateFromMissingEvidence(
  value: string,
  preview: PerspectiveNextWorkCandidateUpdatePreview | null,
): ContinuityRelayAdjustmentCandidate {
  return {
    candidate_id: `stop_if_missing:missing_evidence:${safeId(value)}`,
    ref_id: value,
    label: value,
    summary: `Missing source or evidence must be resolved before relay update readiness: ${value}`,
    source_bucket: "missing_evidence",
    adjustment_kind: "stop_if_missing",
    source_refs: uniqueSortedStrings([value, ...(preview?.source_refs ?? [])]),
    evidence_refs: [],
    source_record_refs: uniqueSortedStrings(
      preview?.input_summary.source_record_refs ?? [],
    ),
    existing_relay_anchor_ids: [],
    strength: "insufficient_data",
    candidate_only: true,
    review_note:
      "Missing evidence blocks relay write readiness and remains review-only.",
  };
}

function missingEvidenceReasons({
  relay,
  perspectivePreview,
  proposedPreserve,
  proposedWarnings,
  proposedStops,
  proposedNextFocus,
}: {
  relay: WorkplaneContinuityRelay | null;
  perspectivePreview: PerspectiveNextWorkCandidateUpdatePreview | null;
  proposedPreserve: ProposedRelayPreserveAdjustments;
  proposedWarnings: ProposedRelayWarningAdjustments;
  proposedStops: ProposedStopIfMissingAdjustments;
  proposedNextFocus: ProposedNextFocusAdjustments;
}): string[] {
  const reasons = [...(perspectivePreview?.evidence_summary.missing_evidence ?? [])];
  if (!relay) reasons.push("workplane_continuity_relay_missing");
  if (!perspectivePreview) {
    reasons.push("perspective_next_work_candidate_update_preview_missing");
  }
  const candidateCount =
    countUniqueCandidates([
      ...proposedPreserve.reinforce_existing_preserve_anchors,
      ...proposedPreserve.add_preserve_anchor_candidates,
      ...proposedWarnings.add_warn_anchor_candidates,
      ...proposedWarnings.strengthen_warn_anchor_candidates,
      ...proposedStops.add_stop_if_missing_candidates,
      ...proposedNextFocus.next_focus_candidates,
    ]);
  if (perspectivePreview && candidateCount === 0) {
    reasons.push("continuity_relay_adjustment_candidate_material_missing");
  }
  return uniqueSortedStrings(reasons);
}

function insufficientReasons({
  relay,
  perspectivePreview,
  missingEvidence,
  proposedPreserve,
  proposedWarnings,
  proposedStops,
  proposedNextFocus,
  proposedContextDiet,
}: {
  relay: WorkplaneContinuityRelay | null;
  perspectivePreview: PerspectiveNextWorkCandidateUpdatePreview | null;
  missingEvidence: string[];
  proposedPreserve: ProposedRelayPreserveAdjustments;
  proposedWarnings: ProposedRelayWarningAdjustments;
  proposedStops: ProposedStopIfMissingAdjustments;
  proposedNextFocus: ProposedNextFocusAdjustments;
  proposedContextDiet: ProposedContextDietAdjustments;
}): string[] {
  const reasons = [
    ...(perspectivePreview?.insufficient_data_reasons ?? []),
    ...missingEvidence,
  ];
  if (!relay) reasons.push("workplane_continuity_relay_missing");
  if (!perspectivePreview) {
    reasons.push("perspective_next_work_candidate_update_preview_missing");
  }
  if (perspectivePreview?.candidate_status === "insufficient_data") {
    reasons.push("perspective_next_work_candidate_update_preview_insufficient_data");
  }
  const totalCandidates =
    countUniqueCandidates([
      ...proposedPreserve.reinforce_existing_preserve_anchors,
      ...proposedPreserve.add_preserve_anchor_candidates,
      ...proposedWarnings.add_warn_anchor_candidates,
      ...proposedWarnings.strengthen_warn_anchor_candidates,
      ...proposedStops.add_stop_if_missing_candidates,
      ...proposedStops.verification_required_before_handoff,
      ...proposedNextFocus.next_focus_candidates,
      ...proposedNextFocus.next_relay_update_suggestions,
      ...proposedNextFocus.next_handoff_adjustments,
      ...proposedContextDiet.refs_to_drop_or_deprioritize,
      ...proposedContextDiet.refs_to_keep_unknown,
    ]);
  if (perspectivePreview && totalCandidates === 0) {
    reasons.push("continuity_relay_adjustment_candidate_material_missing");
  }
  return uniqueSortedStrings(reasons);
}

function matchingAnchors(
  item: PerspectiveNextWorkCandidateItem,
  anchors: WorkplaneContinuityRelayAnchor[],
): WorkplaneContinuityRelayAnchor[] {
  const refSet = new Set([
    item.ref_id,
    ...item.evidence_refs,
    ...item.source_record_refs,
  ]);
  const normalizedRef = normalizeMatchText(item.ref_id);
  const normalizedLabel = normalizeMatchText(item.label);
  return anchors.filter((anchor) => {
    const anchorRefs = new Set(anchor.source_refs);
    for (const ref of refSet) {
      if (anchorRefs.has(ref)) return true;
    }
    const anchorText = normalizeMatchText(
      `${anchor.anchor_id} ${anchor.label} ${anchor.summary}`,
    );
    return (
      (normalizedRef.length > 0 && anchorText.includes(normalizedRef)) ||
      (normalizedLabel.length > 0 && anchorText.includes(normalizedLabel))
    );
  });
}

function allCandidateItems(
  preview: PerspectiveNextWorkCandidateUpdatePreview,
): PerspectiveNextWorkCandidateItem[] {
  return [
    ...preview.proposed_perspective_unit_updates.reinforce_candidates,
    ...preview.proposed_perspective_unit_updates.weaken_candidates,
    ...preview.proposed_perspective_unit_updates.warn_candidates,
    ...preview.proposed_perspective_unit_updates
      .retire_or_deprioritize_candidates,
    ...preview.proposed_perspective_unit_updates.split_or_review_candidates,
    ...preview.proposed_perspective_unit_updates.insufficient_data_candidates,
    ...preview.proposed_next_work_bias_updates.refs_to_preserve_next_time,
    ...preview.proposed_next_work_bias_updates.refs_to_warn_next_time,
    ...preview.proposed_next_work_bias_updates.refs_to_drop_or_deprioritize,
    ...preview.proposed_carry_forward_memory_candidates
      .reusable_context_candidates,
    ...preview.proposed_carry_forward_memory_candidates.stale_context_warnings,
    ...preview.proposed_carry_forward_memory_candidates.unresolved_gap_candidates,
    ...preview.proposed_carry_forward_memory_candidates
      .verification_bias_candidates,
  ];
}

function isUnknownCandidate(item: PerspectiveNextWorkCandidateItem): boolean {
  return (
    item.source_bucket === "unknown" ||
    /\bunknown\b|unknown[-_:]/i.test(item.ref_id) ||
    /\bunknown\b|unknown[-_:]/i.test(item.label)
  );
}

function sourceRefs({
  relay,
  perspectivePreview,
  inputRefs,
}: {
  relay: WorkplaneContinuityRelay | null;
  perspectivePreview: PerspectiveNextWorkCandidateUpdatePreview | null;
  inputRefs?: string[];
}): string[] {
  return uniqueSortedStrings([
    METRIC_INFORMED_CONTINUITY_RELAY_ADJUSTMENT_PREVIEW_VERSION,
    WORKPLANE_CONTINUITY_RELAY_VERSION,
    PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION,
    ...(inputRefs ?? []),
    ...(relay?.source_refs.source_refs ?? []),
    ...(relay ? [`continuity_relay:${relay.relay_version}:${relay.as_of}`] : []),
    ...(perspectivePreview?.source_refs ?? []),
    ...(perspectivePreview
      ? [
          `perspective_next_work_candidate_update_preview:${perspectivePreview.as_of}`,
        ]
      : []),
  ]);
}

function evidenceRefs({
  relay,
  perspectivePreview,
}: {
  relay: WorkplaneContinuityRelay | null;
  perspectivePreview: PerspectiveNextWorkCandidateUpdatePreview | null;
}): string[] {
  return uniqueSortedStrings([
    ...(relay?.source_refs.evidence_refs ?? []),
    ...(perspectivePreview?.evidence_summary.evidence_refs ?? []),
  ]);
}

function createProposedRelayPreserveAdjustments(): ProposedRelayPreserveAdjustments {
  return {
    reinforce_existing_preserve_anchors: [],
    add_preserve_anchor_candidates: [],
    preserve_with_review_only: [],
  };
}

function createProposedRelayWarningAdjustments(): ProposedRelayWarningAdjustments {
  return {
    add_warn_anchor_candidates: [],
    strengthen_warn_anchor_candidates: [],
    stale_context_warning_candidates: [],
    noisy_context_warning_candidates: [],
    misleading_context_warning_candidates: [],
    unknown_context_warning_candidates: [],
  };
}

function createProposedStopIfMissingAdjustments(): ProposedStopIfMissingAdjustments {
  return {
    add_stop_if_missing_candidates: [],
    verification_required_before_handoff: [],
    missing_source_or_evidence_blockers: [],
  };
}

function createProposedNextFocusAdjustments(): ProposedNextFocusAdjustments {
  return {
    next_focus_candidates: [],
    next_relay_update_suggestions: [],
    next_handoff_adjustments: [],
  };
}

function createProposedContextDietAdjustments(): ProposedContextDietAdjustments {
  return {
    refs_to_drop_or_deprioritize: [],
    refs_to_exclude_from_next_handoff: [],
    refs_to_keep_unknown: [],
    stale_or_gap_warnings: [],
  };
}

function isContinuityRelay(
  value: WorkplaneContinuityRelay | null | undefined,
): value is WorkplaneContinuityRelay {
  return value?.relay_version === WORKPLANE_CONTINUITY_RELAY_VERSION;
}

function isPerspectiveNextWorkCandidateUpdatePreview(
  value: PerspectiveNextWorkCandidateUpdatePreview | null | undefined,
): value is PerspectiveNextWorkCandidateUpdatePreview {
  return (
    value?.preview_version ===
    PERSPECTIVE_NEXT_WORK_CANDIDATE_UPDATE_PREVIEW_VERSION
  );
}

function pushCandidate(
  list: ContinuityRelayAdjustmentCandidate[],
  candidate: ContinuityRelayAdjustmentCandidate,
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
      existing_relay_anchor_ids: uniqueSortedStrings(
        candidate.existing_relay_anchor_ids,
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
  existing.existing_relay_anchor_ids = uniqueSortedStrings([
    ...existing.existing_relay_anchor_ids,
    ...candidate.existing_relay_anchor_ids,
  ]);
  existing.strength = strongerStrength(existing.strength, candidate.strength);
}

function countUniqueCandidates(
  candidates: ContinuityRelayAdjustmentCandidate[],
): number {
  return new Set(candidates.map((candidate) => candidate.candidate_id)).size;
}

function strongerStrength(
  left: PerspectiveNextWorkCandidateStrength,
  right: PerspectiveNextWorkCandidateStrength,
): PerspectiveNextWorkCandidateStrength {
  const rank: Record<PerspectiveNextWorkCandidateStrength, number> = {
    insufficient_data: 0,
    weak: 1,
    moderate: 2,
    strong: 3,
  };
  return rank[right] > rank[left] ? right : left;
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
