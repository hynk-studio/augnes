import type { SemanticReviewProposalDetailV01 } from "@/components/workbench/semantic-review/semantic-review-types";
import { compareEffectiveReviewDecisionsV01 } from "@/lib/vnext/review-decision-lineage";
import { parseStrictIsoTimestampV01 } from "@/lib/vnext/strict-iso-timestamp";
import type { ProjectVerifyRevisionLifecycleV01 } from "@/types/vnext/project-verify-reconciliation";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import {
  SELECTED_WORK_TIMELINE_MAX_ITEMS_V01,
  SELECTED_WORK_TIMELINE_VERSION_V01,
  type SelectedWorkTimelineItemV01,
  type SelectedWorkTimelinePrimaryActionOwnerV01,
  type SelectedWorkTimelineSourceRefV01,
  type SelectedWorkTimelineStageV01,
  type SelectedWorkTimelineV01,
} from "@/types/vnext/selected-work-timeline";

const MAX_TEXT = 320;
const AUTHORITY = {
  projection_only: true,
  rebuildable: true,
  writes_database: false,
  creates_timeline_record: false,
  creates_decision: false,
  authorizes_transition: false,
  applies_transition: false,
  establishes_truth: false,
  establishes_verified_success: false,
  changes_project_state: false,
  changes_later_context: false,
  calls_model_or_provider: false,
  performs_external_action: false,
} as const;

export type SelectedCandidateV01 =
  SemanticReviewProposalDetailV01["candidates"][number];
type SelectedDecisionLineageEntryV01 =
  SemanticReviewProposalDetailV01["decision_history"][number];
type SelectedTransitionReceiptV01 =
  SemanticReviewProposalDetailV01["transition_receipts"][number];

interface TimelineCurrentPositionV01 {
  stage: SelectedWorkTimelineStageV01;
  title: string;
  summary: string;
  next_meaningful_step: string;
  primary_action_owner: SelectedWorkTimelinePrimaryActionOwnerV01;
  destination: string | null;
  status: SelectedWorkTimelineItemV01["status"];
  occurred_at: string | null;
  time_status: SelectedWorkTimelineItemV01["time_status"];
  order_basis: SelectedWorkTimelineItemV01["order_basis"];
  basis: SelectedWorkTimelineItemV01["basis"];
  source_refs: SelectedWorkTimelineSourceRefV01[];
}

export function buildSelectedWorkTimelineV01(input: {
  read: SemanticReviewProposalDetailV01;
  selected_candidate: SelectedCandidateV01;
}): SelectedWorkTimelineV01 {
  const { read, selected_candidate: selected } = input;
  const decisionEntries = selectedDecisionLineageV01(read, selected).slice(-3);
  const effectiveEntry = decisionEntries.at(-1) ?? null;
  const effective = effectiveEntry?.decision ?? null;
  const receipt = effective
    ? exactTransitionReceiptV01(read, selected, effective)
    : null;
  const lifecycle = selectSelectedWorkLifecycleV01(
    read,
    selected.candidate.candidate_id,
    selected.candidate_fingerprint,
  );
  const laterOutcome = receipt && effective
    ? exactLaterOutcomeV01(read, selected, effective, receipt)
    : null;
  const nextCandidate = selectNextSelectedWorkCandidateV01({
    read,
    selected_candidate: selected,
  });
  const current = currentPositionV01({
    read,
    selected,
    effectiveEntry,
    receipt,
    lifecycle,
    laterOutcome,
    nextCandidatePresent: nextCandidate !== null,
  });

  const items: SelectedWorkTimelineItemV01[] = [];
  if (read.source_run_receipts.length > 0) {
    addItemV01(
      items,
      itemV01({
        item_id: "source-observed",
        stage: "source_observed",
        basis: "observed",
        status: "completed",
        title: "Source work observed",
        summary:
          "The exact source result for this suggested change became available for review.",
        meaning_change:
          "Observed work became available as source material. This does not establish task success.",
        occurred_at: latestExactSourceCompletionV01(read),
        order_basis: "source_lineage",
        source_refs: read.source_run_receipts.map((source) => ({
          source_kind: "source_result",
          record_id: source.receipt_id,
          record_fingerprint: source.integrity.fingerprint,
        })),
        destination: "#selected-work-support",
      }),
    );
  }
  addItemV01(
    items,
    itemV01({
      item_id: "change-suggested",
      stage: "change_suggested",
      basis: "bounded_interpretation",
      status: "completed",
      title: read.proposal.operation_revision
        ? "Clarified change suggested"
        : "Change suggested",
      summary: read.proposal.operation_revision
        ? "A clarified, source-bound suggestion was created without changing the earlier suggestion or the project."
        : "Augnes created a bounded suggestion from the observed source material.",
      meaning_change:
        "Observed material was interpreted as a possible project change. The suggestion is not a decision.",
      occurred_at: exactTimestampOrNullV01(read.proposal.created_at),
      order_basis: "source_lineage",
      source_refs: proposalSourceRefsV01(read, selected),
      destination: null,
    }),
  );
  addItemV01(
    items,
    itemV01({
      item_id: "review-focused",
      stage: "review_focused",
      basis: "bounded_interpretation",
      status:
        current.stage === "review_focused" ? current.status : "completed",
      title: "Review focused",
      summary: `“${bounded(selected.candidate.title)}” is the selected change for this timeline.`,
      meaning_change:
        "The selected candidate defines the visible review scope. Other candidates remain separate.",
      occurred_at: null,
      order_basis: "partial_order",
      source_refs: [
        {
          source_kind: "candidate",
          record_id: selected.candidate.candidate_id,
          record_fingerprint: selected.candidate_fingerprint,
        },
      ],
      destination:
        current.stage === "review_focused"
          ? current.destination
          : null,
    }),
  );

  decisionEntries.forEach((entry, index) => {
    const decision = entry.decision;
    const isEffective = decision.decision_id === effective?.decision_id &&
      decision.integrity.fingerprint === effective.integrity.fingerprint;
    addItemV01(
      items,
      itemV01({
        item_id: `decision-recorded-${index + 1}`,
        stage: "decision_recorded",
        basis: "user_decision",
        status:
          current.stage === "decision_recorded" && isEffective
            ? current.status
            : isEffective
              ? "completed"
              : "superseded",
        title: decisionTitleV01(decision),
        summary: decisionSummaryV01(decision),
        meaning_change:
          "A user decision was recorded. A decision does not by itself update saved project state.",
        occurred_at: exactTimestampOrNullV01(decision.decided_at),
        order_basis: "source_lineage",
        source_refs: [
          {
            source_kind: "decision",
            record_id: decision.decision_id,
            record_fingerprint: decision.integrity.fingerprint,
          },
        ],
        destination:
          current.stage === "decision_recorded" && isEffective
            ? current.destination
            : null,
      }),
    );
  });

  if (
    receipt &&
    (current.stage === "later_outcome_available" ||
      current.stage === "later_outcome_reviewed")
  ) {
    addItemV01(
      items,
      itemV01({
        item_id: "project-updated",
        stage: "project_updated",
        basis: "authorized_change",
        status: "completed",
        title: "Project updated",
        summary:
          "An authorized project update was recorded for this exact selected change.",
        meaning_change:
          "Saved project state changed through an authorized application.",
        occurred_at: exactTimestampOrNullV01(receipt.applied_at),
        order_basis: "source_lineage",
        source_refs: [
          {
            source_kind: "project_update",
            record_id: receipt.transition_receipt_id,
            record_fingerprint: receipt.integrity.fingerprint,
          },
        ],
        destination: null,
      }),
    );
  }

  if (
    current.stage !== "review_focused" &&
    current.stage !== "decision_recorded"
  ) {
    addItemV01(
      items,
      itemV01({
        item_id: "current-position",
        stage: current.stage,
        basis: current.basis,
        status: current.status,
        title: current.title,
        summary: current.summary,
        meaning_change: meaningChangeForCurrentV01(current.stage),
        occurred_at: current.occurred_at,
        time_status: current.time_status,
        order_basis: current.order_basis,
        source_refs: current.source_refs,
        destination: current.destination,
      }),
    );
  }

  const currentItemId =
    current.stage === "review_focused"
      ? "review-focused"
      : current.stage === "decision_recorded"
        ? `decision-recorded-${Math.max(decisionEntries.length, 1)}`
        : "current-position";
  const boundedItems = items.slice(0, SELECTED_WORK_TIMELINE_MAX_ITEMS_V01);
  if (!boundedItems.some((item) => item.item_id === currentItemId)) {
    throw new Error("selected_work_timeline_current_item_omitted");
  }
  const normalizedItems = boundedItems.map((item) => ({
    ...item,
    status:
      item.item_id === currentItemId
        ? current.status
        : item.status === "current" || item.status === "blocked"
          ? "completed"
          : item.status,
  }));

  return {
    timeline_version: SELECTED_WORK_TIMELINE_VERSION_V01,
    selected_work: {
      title: bounded(selected.candidate.title),
      operation_label:
        selected.pilot_admission.review_mode === "proposal_only_no_activation"
          ? "Proposal-only operational hypothesis"
          : operationLabelV01(selected.candidate.operation),
      current_meaning: bounded(selected.candidate.proposed_state_summary),
      selected_candidate_id: selected.candidate.candidate_id,
      selected_candidate_fingerprint: selected.candidate_fingerprint,
      selected_candidate_scope: true,
    },
    items: normalizedItems,
    bounded_item_count: normalizedItems.length,
    omitted_item_count: Math.max(0, items.length - normalizedItems.length),
    current_item_id: currentItemId,
    current_position: {
      stage: current.stage,
      title: current.title,
      summary: current.summary,
      next_meaningful_step: current.next_meaningful_step,
      primary_action_owner: current.primary_action_owner,
      destination: current.destination,
    },
    authority: AUTHORITY,
  };
}

export function selectedWorkTimelineDecisionStatusV01(
  timeline: SelectedWorkTimelineV01,
):
  | "needs_decision"
  | "decision_saved"
  | "accepted_proposal_only"
  | "project_updated"
  | "rejected"
  | "deferred"
  | "blocked" {
  switch (timeline.current_position.stage) {
    case "review_focused":
      return timeline.items.find(
        (item) => item.item_id === timeline.current_item_id,
      )?.status === "blocked"
        ? "blocked"
        : timeline.current_position.primary_action_owner === "decision"
          ? "needs_decision"
          : "blocked";
    case "decision_recorded":
      return timeline.current_position.primary_action_owner === "decision"
        ? "needs_decision"
        : timeline.current_position.title.startsWith("Rejected")
        ? "rejected"
        : "blocked";
    case "proposal_only_accepted":
      return "accepted_proposal_only";
    case "deferred_until_condition":
      return timeline.current_position.primary_action_owner === "decision"
        ? "needs_decision"
        : "deferred";
    case "awaiting_application":
      return "decision_saved";
    case "transition_blocked":
      return "blocked";
    case "project_updated":
    case "later_outcome_available":
    case "later_outcome_reviewed":
      return "project_updated";
    default:
      return "blocked";
  }
}

export function selectSelectedWorkLifecycleV01(
  read: SemanticReviewProposalDetailV01,
  candidateId: string,
  candidateFingerprint: string,
): ProjectVerifyRevisionLifecycleV01 | null {
  const profile = read.proposal.project_verify_lifecycle;
  if (
    !profile ||
    profile.lifecycle_binding.selected_candidate.candidate_id !==
      candidateId ||
    profile.lifecycle_binding.selected_candidate.candidate_fingerprint !==
      candidateFingerprint
  ) {
    return null;
  }
  const selectedRef = profile.lifecycle_binding.selected_record_ref;
  if (selectedRef.record_kind === "claim_record") {
    const family = read.project_verify_reconciliation.claim_families.find(
      (entry) =>
        entry.claim_family_id === profile.lifecycle_binding.family_id,
    );
    return (
      family?.revisions.find(
        (entry) =>
          entry.claim_ref.record_id === selectedRef.record_id &&
          entry.claim_ref.record_fingerprint ===
            selectedRef.record_fingerprint,
      )?.lifecycle ?? null
    );
  }
  const family = read.project_verify_reconciliation.relation_families.find(
    (entry) =>
      entry.relation_family_id === profile.lifecycle_binding.family_id,
  );
  return (
    family?.revisions.find(
      (entry) =>
        entry.relation_ref.record_id === selectedRef.record_id &&
        entry.relation_ref.record_fingerprint ===
          selectedRef.record_fingerprint,
    )?.lifecycle ?? null
  );
}

function currentPositionV01(input: {
  read: SemanticReviewProposalDetailV01;
  selected: SelectedCandidateV01;
  effectiveEntry: SelectedDecisionLineageEntryV01 | null;
  receipt: SelectedTransitionReceiptV01 | null;
  lifecycle: ProjectVerifyRevisionLifecycleV01 | null;
  laterOutcome: LaterOutcomeV01 | null;
  nextCandidatePresent: boolean;
}): TimelineCurrentPositionV01 {
  const {
    read,
    selected,
    effectiveEntry,
    receipt,
    lifecycle,
    laterOutcome,
    nextCandidatePresent,
  } = input;
  const effective = effectiveEntry?.decision ?? null;
  const strategicDecisionUnavailable =
    Boolean(read.proposal.strategic_advantage_transfer) &&
    read.strategic_analysis.status !== "available";

  if (laterOutcome?.reviewed) {
    return {
      stage: "later_outcome_reviewed",
      title: "Later outcome reviewed",
      summary:
        "Feedback about how the updated project context affected later work is recorded separately.",
      next_meaningful_step:
        nextCandidatePresent
          ? "Review the next unresolved change when useful."
          : "Return to the work list when you are ready.",
      primary_action_owner: nextCandidatePresent
        ? "candidate_selection"
        : "none",
      destination: nextCandidatePresent ? "#selected-work-next-candidate" : null,
      status: "current",
      occurred_at: laterOutcome.reviewed_at,
      time_status: laterOutcome.reviewed_at ? "exact" : "not_established",
      order_basis: "source_lineage",
      basis: "later_outcome",
      source_refs: laterOutcome.source_refs,
    };
  }
  if (laterOutcome) {
    return {
      stage: "later_outcome_available",
      title: "Later outcome available",
      summary:
        "Later work used the updated context. Optional feedback can assess usefulness without rewriting the original decision.",
      next_meaningful_step:
        "Record optional outcome feedback if it would improve later review.",
      primary_action_owner: "none",
      destination: "#selected-work-later-feedback",
      status: "current",
      occurred_at: laterOutcome.available_at,
      time_status: laterOutcome.available_at ? "exact" : "not_established",
      order_basis: "source_lineage",
      basis: "later_outcome",
      source_refs: laterOutcome.source_refs,
    };
  }
  if (receipt) {
    return {
      stage: "project_updated",
      title: "Project updated",
      summary:
        "An authorized project update is recorded for this exact selected change.",
      next_meaningful_step: nextCandidatePresent
        ? "Review the next unresolved change."
        : "Return to the work list or inspect exact records only if needed.",
      primary_action_owner: nextCandidatePresent
        ? "candidate_selection"
        : "none",
      destination: nextCandidatePresent
        ? "#selected-work-next-candidate"
        : null,
      status: "current",
      occurred_at: exactTimestampOrNullV01(receipt.applied_at),
      time_status: exactTimestampOrNullV01(receipt.applied_at)
        ? "exact"
        : "not_established",
      order_basis: "source_lineage",
      basis: "authorized_change",
      source_refs: [
        {
          source_kind: "project_update",
          record_id: receipt.transition_receipt_id,
          record_fingerprint: receipt.integrity.fingerprint,
        },
      ],
    };
  }
  if (!effective) {
    const blocked =
      selected.pilot_admission.decision_allowed.accept === false ||
      selected.pilot_admission.blocking_reasons.length > 0;
    return {
      stage: "review_focused",
      title: blocked ? "Review needs more information" : "Decision needed",
      summary: blocked
        ? "This suggestion cannot be applied safely from the current material. Rejecting it or deciding later remains available."
        : "The selected suggestion is ready for your consequential review.",
      next_meaningful_step: strategicDecisionUnavailable
        ? "Verify the current source before recording a decision."
        : blocked
          ? "Reject the suggestion or defer it until the missing information is available."
          : "Accept, reject, or defer this exact selected suggestion.",
      primary_action_owner: strategicDecisionUnavailable ? "none" : "decision",
      destination: strategicDecisionUnavailable
        ? null
        : "#selected-work-decision",
      status: blocked ? "blocked" : "current",
      occurred_at: null,
      time_status: "not_established",
      order_basis: "partial_order",
      basis: "bounded_interpretation",
      source_refs: [
        {
          source_kind: "candidate",
          record_id: selected.candidate.candidate_id,
          record_fingerprint: selected.candidate_fingerprint,
        },
      ],
    };
  }
  if (effective.decision === "reject") {
    return {
      stage: "decision_recorded",
      title: "Rejected · project unchanged",
      summary:
        "The selected suggestion was rejected. No project update is pending.",
      next_meaningful_step: nextCandidatePresent
        ? "Review the next unresolved change."
        : "Return to the work list when ready.",
      primary_action_owner: nextCandidatePresent
        ? "candidate_selection"
        : "none",
      destination: nextCandidatePresent
        ? "#selected-work-next-candidate"
        : null,
      status: "current",
      occurred_at: exactTimestampOrNullV01(effective.decided_at),
      time_status: exactTimestampOrNullV01(effective.decided_at)
        ? "exact"
        : "not_established",
      order_basis: "source_lineage",
      basis: "user_decision",
      source_refs: decisionSourceRefsV01(effective),
    };
  }
  if (effective.decision === "defer") {
    const due = revisitDueV01(read.projection_observed_at, effective);
    const proposalOnlyNextCandidate =
      selected.pilot_admission.review_mode ===
        "proposal_only_no_activation" && nextCandidatePresent;
    return {
      stage: "deferred_until_condition",
      title: due ? "Deferred review is due" : "Deferred until condition",
      summary: deferSummaryV01(effective, due),
      next_meaningful_step: proposalOnlyNextCandidate
        ? "Review the next unresolved operational proposal candidate."
        : due
          ? "Review this selected suggestion again now."
          : "Wait for the saved revisit condition or time.",
      primary_action_owner: proposalOnlyNextCandidate
        ? "candidate_selection"
        : due && !strategicDecisionUnavailable
          ? "decision"
          : "none",
      destination: proposalOnlyNextCandidate
        ? "#selected-work-next-candidate"
        : due && !strategicDecisionUnavailable
          ? "#selected-work-decision"
          : null,
      status: due ? "current" : "pending",
      occurred_at: exactTimestampOrNullV01(effective.decided_at),
      time_status: exactTimestampOrNullV01(effective.decided_at)
        ? "exact"
        : "not_established",
      order_basis: "source_lineage",
      basis: "user_decision",
      source_refs: decisionSourceRefsV01(effective),
    };
  }

  if (
    effective.decision === "accept" &&
    selected.pilot_admission.review_mode === "proposal_only_no_activation" &&
    effective.requested_transition_intent === null
  ) {
    return {
      stage: "proposal_only_accepted",
      title: "Operational proposal accepted · project unchanged",
      summary:
        "The proposal-only judgment is recorded. No semantic Transition or operational activation is pending.",
      next_meaningful_step: nextCandidatePresent
        ? "Review the next unresolved operational proposal candidate."
        : "No further application step exists in ACGC4B.",
      primary_action_owner: nextCandidatePresent
        ? "candidate_selection"
        : "none",
      destination: nextCandidatePresent
        ? "#selected-work-next-candidate"
        : null,
      status: "current",
      occurred_at: exactTimestampOrNullV01(effective.decided_at),
      time_status: exactTimestampOrNullV01(effective.decided_at)
        ? "exact"
        : "not_established",
      order_basis: "source_lineage",
      basis: "user_decision",
      source_refs: decisionSourceRefsV01(effective),
    };
  }

  const applyingActionable =
    effectiveEntry !== null &&
    selectedApplyingDecisionIsActionableV01(
      read,
      selected,
      effectiveEntry,
      receipt,
    );
  if (!applyingActionable) {
    return {
      stage: "decision_recorded",
      title: "Decision recorded · current review required",
      summary:
        "The earlier decision remains in history, but it cannot authorize a project update from the current review session.",
      next_meaningful_step:
        "Review this exact suggestion again in the current session before any project update.",
      primary_action_owner: strategicDecisionUnavailable ? "none" : "decision",
      destination: strategicDecisionUnavailable
        ? null
        : "#selected-work-decision",
      status: "current",
      occurred_at: exactTimestampOrNullV01(effective.decided_at),
      time_status: exactTimestampOrNullV01(effective.decided_at)
        ? "exact"
        : "not_established",
      order_basis: "source_lineage",
      basis: "user_decision",
      source_refs: decisionSourceRefsV01(effective),
    };
  }

  const blocked =
    selected.pilot_admission.decision_allowed.accept === false ||
    selected.pilot_admission.blocking_reasons.length > 0 ||
    lifecycle?.gate.status === "source_conflict" ||
    lifecycle?.gate.status === "expired" ||
    lifecycle?.transition.status === "source_conflict" ||
    Boolean(lifecycle?.conflicts.length);
  if (blocked) {
    return {
      stage: "transition_blocked",
      title: "Project update blocked",
      summary:
        "The decision is saved, but exact source, eligibility, current-state, or conflict checks prevent a safe project update.",
      next_meaningful_step:
        "Review the exact impact and blocker before applying any project update.",
      primary_action_owner: "transition",
      destination: "#selected-work-transition",
      status: "blocked",
      occurred_at: null,
      time_status: "not_established",
      order_basis: "source_lineage",
      basis: "bounded_interpretation",
      source_refs: [
        ...decisionSourceRefsV01(effective),
        ...(lifecycle?.gate.gate_ref
          ? [
              {
                source_kind: "semantic_gate" as const,
                record_id: lifecycle.gate.gate_ref.record_id,
                record_fingerprint:
                  lifecycle.gate.gate_ref.record_fingerprint,
              },
            ]
          : []),
      ],
    };
  }

  const gateConfirmed = lifecycle?.gate.status === "authorized";
  return {
    stage: "awaiting_application",
    title: gateConfirmed
      ? "Change confirmed · project unchanged"
      : "Awaiting project update",
    summary: gateConfirmed
      ? "The exact change is confirmed, but no authorized project update is recorded."
      : "The decision is saved. Impact review, confirmation, and application remain separate.",
    next_meaningful_step: gateConfirmed
      ? "Review and apply the confirmed change to update saved project state."
      : "Review the exact impact before confirming or applying anything.",
    primary_action_owner: "transition",
    destination: "#selected-work-transition",
    status: "current",
    occurred_at:
      gateConfirmed && lifecycle?.gate.gate_ref
        ? gateConfirmedAtV01(read, lifecycle.gate.gate_ref.record_id)
        : exactTimestampOrNullV01(effective.decided_at),
    time_status:
      gateConfirmed &&
      lifecycle?.gate.gate_ref &&
      gateConfirmedAtV01(read, lifecycle.gate.gate_ref.record_id)
        ? "exact"
        : exactTimestampOrNullV01(effective.decided_at)
          ? "exact"
          : "not_established",
    order_basis: "source_lineage",
    basis: "user_decision",
    source_refs: [
      ...decisionSourceRefsV01(effective),
      ...(lifecycle?.gate.gate_ref
        ? [
            {
              source_kind: "semantic_gate" as const,
              record_id: lifecycle.gate.gate_ref.record_id,
              record_fingerprint:
                lifecycle.gate.gate_ref.record_fingerprint,
            },
          ]
        : []),
    ],
  };
}

function selectedDecisionLineageV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
): SelectedDecisionLineageEntryV01[] {
  const exact = new Map<string, SelectedDecisionLineageEntryV01>();
  for (const entry of read.decision_history) {
    if (
      entry.status !== "valid" ||
      !entry.pilot_session_bound ||
      entry.decision.candidate.candidate_id !==
        selected.candidate.candidate_id ||
      entry.decision.candidate.candidate_fingerprint !==
        selected.candidate_fingerprint
    ) {
      continue;
    }
    const key =
      `${entry.decision.decision_id}\0${entry.decision.integrity.fingerprint}`;
    const existing = exact.get(key);
    if (!existing || compareDecisionProvenanceV01(entry, existing) < 0) {
      exact.set(key, entry);
    }
  }
  const orderedNewestFirst = [...exact.values()].sort(
    (left, right) =>
      compareEffectiveReviewDecisionsV01(left.decision, right.decision),
  );
  const effective = orderedNewestFirst[0];
  if (!effective) return [];
  const byKey = new Map(
    orderedNewestFirst.map((entry) => [
      `${entry.decision.decision_id}\0${entry.decision.integrity.fingerprint}`,
      entry,
    ]),
  );
  const lineage = new Map<string, SelectedDecisionLineageEntryV01>();
  const visit = (entry: SelectedDecisionLineageEntryV01): void => {
    const decision = entry.decision;
    const key = `${decision.decision_id}\0${decision.integrity.fingerprint}`;
    if (lineage.has(key)) return;
    lineage.set(key, entry);
    for (const prior of decision.lineage.prior_decisions) {
      const priorEntry = byKey.get(
        `${prior.decision_id}\0${prior.decision_fingerprint}`,
      );
      if (priorEntry) visit(priorEntry);
    }
  };
  visit(effective);
  return [...lineage.values()]
    .sort((left, right) =>
      compareEffectiveReviewDecisionsV01(left.decision, right.decision),
    )
    .reverse();
}

function exactTransitionReceiptV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  effective: ReviewDecisionV01,
) {
  return (
    [...read.transition_receipts]
      .filter(
        (receipt) =>
          receipt.source_proposal.proposal_id === read.proposal.proposal_id &&
          receipt.source_proposal.proposal_fingerprint ===
            read.proposal.integrity.fingerprint &&
          receipt.source_decision.decision_id === effective.decision_id &&
          receipt.source_decision.decision_fingerprint ===
            effective.integrity.fingerprint &&
          receipt.source_candidate.candidate_id ===
            selected.candidate.candidate_id &&
          receipt.source_candidate.candidate_fingerprint ===
            selected.candidate_fingerprint,
      )
      .sort(
        (left, right) =>
          timestampOrderV01(left.applied_at, right.applied_at) ||
          compareCodeUnitsV01(
            left.transition_receipt_id,
            right.transition_receipt_id,
          ),
      )[0] ?? null
  );
}

export function selectSelectedCandidateActionableApplyingDecisionV01(input: {
  read: SemanticReviewProposalDetailV01;
  selected_candidate: SelectedCandidateV01;
}): ReviewDecisionV01 | null {
  const { read, selected_candidate: selected } = input;
  const effectiveEntry =
    selectedDecisionLineageV01(read, selected).at(-1) ?? null;
  if (!effectiveEntry) return null;
  const receipt = exactTransitionReceiptV01(
    read,
    selected,
    effectiveEntry.decision,
  );
  return selectedApplyingDecisionIsActionableV01(
    read,
    selected,
    effectiveEntry,
    receipt,
  )
    ? effectiveEntry.decision
    : null;
}

export function selectNextSelectedWorkCandidateV01(input: {
  read: SemanticReviewProposalDetailV01;
  selected_candidate: SelectedCandidateV01;
}): SelectedCandidateV01 | null {
  const { read, selected_candidate: selected } = input;
  for (const candidate of read.candidates) {
    if (
      candidate.candidate.candidate_id === selected.candidate.candidate_id &&
      candidate.candidate_fingerprint === selected.candidate_fingerprint
    ) {
      continue;
    }
    const decisions = selectedDecisionLineageV01(read, candidate);
    const effectiveEntry = decisions.at(-1) ?? null;
    const effective = effectiveEntry?.decision ?? null;
    const receipt = effective
      ? exactTransitionReceiptV01(read, candidate, effective)
      : null;
    if (!effective || (effective.decision === "defer" &&
      revisitDueV01(read.projection_observed_at, effective))) {
      return candidate;
    }
    if (
      (effective.decision === "accept" ||
        effective.decision === "supersede" ||
        effective.decision === "retract") &&
      effective.requested_transition_intent !== null &&
      effective.requested_transition_intent.applied === false &&
      !receipt
    ) {
      return candidate;
    }
  }
  return null;
}

interface LaterOutcomeV01 {
  reviewed: boolean;
  available_at: string | null;
  reviewed_at: string | null;
  source_refs: SelectedWorkTimelineSourceRefV01[];
}

function exactLaterOutcomeV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  effective: ReviewDecisionV01,
  transitionReceipt: SelectedTransitionReceiptV01,
): LaterOutcomeV01 | null {
  const latestTransition = read.project_continuity.latest_applied_transition;
  if (
    latestTransition?.transition_receipt_id !==
      transitionReceipt.transition_receipt_id ||
    latestTransition.transition_receipt_fingerprint !==
      transitionReceipt.integrity.fingerprint ||
    latestTransition.proposal_id !== read.proposal.proposal_id ||
    latestTransition.decision_id !== effective.decision_id ||
    read.durable_lineage.proposal_id !== read.proposal.proposal_id ||
    read.durable_lineage.proposal_fingerprint !==
      read.proposal.integrity.fingerprint
  ) {
    return null;
  }
  const exactChains = read.durable_lineage.chains.filter(
    (chain) =>
      chain.stage_status === "packet_compiled" &&
      chain.transition.receipt_id ===
        transitionReceipt.transition_receipt_id &&
      chain.transition.receipt_fingerprint ===
        transitionReceipt.integrity.fingerprint &&
      chain.transition.decision_id === effective.decision_id &&
      chain.transition.decision_fingerprint ===
        effective.integrity.fingerprint &&
      chain.transition.candidate_id === selected.candidate.candidate_id &&
      chain.transition.candidate_fingerprint ===
        selected.candidate_fingerprint,
  );
  const exactPackets = new Map(
    exactChains.flatMap((chain) =>
      chain.compiled_packet
        ? [[
            `${chain.compiled_packet.packet_id}\0${chain.compiled_packet.packet_fingerprint}`,
            chain.compiled_packet,
          ] as const]
        : [],
    ),
  );
  if (exactPackets.size !== 1) return null;
  const packet = [...exactPackets.values()][0]!;
  const receipt = read.project_continuity.latest_context_use_receipt;
  if (
    !receipt ||
    receipt.task_context_packet_id !== packet.packet_id ||
    receipt.task_context_packet_fingerprint !== packet.packet_fingerprint
  ) {
    return null;
  }
  const review = read.project_continuity.latest_context_use_review_status;
  const exactReview =
    review?.later_task_run_receipt_id === receipt.receipt_id &&
    review.later_task_run_receipt_fingerprint === receipt.receipt_fingerprint
      ? review
      : null;
  return {
    reviewed: exactReview !== null,
    available_at: exactTimestampOrNullV01(receipt.recorded_at),
    reviewed_at: exactTimestampOrNullV01(exactReview?.reviewed_at ?? null),
    source_refs: [
      {
        source_kind: "later_result",
        record_id: receipt.receipt_id,
        record_fingerprint: receipt.receipt_fingerprint,
      },
      ...(exactReview
        ? [
            {
              source_kind: "later_feedback" as const,
              record_id: exactReview.review_id,
              record_fingerprint: exactReview.review_fingerprint,
            },
          ]
        : []),
    ],
  };
}

function selectedApplyingDecisionIsActionableV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  entry: SelectedDecisionLineageEntryV01,
  receipt: SelectedTransitionReceiptV01 | null,
): boolean {
  const decision = entry.decision;
  if (
    !isApplyingDecisionV01(decision) ||
    entry.status !== "valid" ||
    !entry.pilot_session_bound ||
    !entry.pilot_actionable ||
    decision.source_proposal.proposal_id !== read.proposal.proposal_id ||
    decision.source_proposal.proposal_fingerprint !==
      read.proposal.integrity.fingerprint ||
    decision.candidate.candidate_id !== selected.candidate.candidate_id ||
    decision.candidate.candidate_fingerprint !==
      selected.candidate_fingerprint ||
    decision.requested_transition_intent === null ||
    decision.requested_transition_intent.applied !== false ||
    receipt !== null
  ) {
    return false;
  }

  const summary = read.decision_application_summary;
  const binding = summary.effective_decision;
  if (!binding) return true;

  const touchesSelectedDecision =
    binding.decision_id === decision.decision_id ||
    binding.decision_fingerprint === decision.integrity.fingerprint;
  const touchesSelectedCandidate =
    binding.candidate_id === selected.candidate.candidate_id ||
    binding.candidate_fingerprint === selected.candidate_fingerprint;
  if (!touchesSelectedDecision && !touchesSelectedCandidate) {
    return true;
  }

  const exactSelectedBinding =
    binding.decision === decision.decision &&
    binding.decision_id === decision.decision_id &&
    binding.decision_fingerprint === decision.integrity.fingerprint &&
    binding.candidate_id === selected.candidate.candidate_id &&
    binding.candidate_fingerprint === selected.candidate_fingerprint;
  return (
    exactSelectedBinding &&
    summary.status === "ready_to_complete" &&
    summary.applying_decision_pending &&
    !summary.matching_transition_receipt_present &&
    binding.pilot_actionable &&
    binding.requested_project_change &&
    binding.matching_transition_receipt_id === null &&
    binding.matching_transition_receipt_fingerprint === null
  );
}

function isApplyingDecisionV01(decision: ReviewDecisionV01): boolean {
  return (
    decision.decision === "accept" ||
    decision.decision === "supersede" ||
    decision.decision === "retract"
  );
}

function compareDecisionProvenanceV01(
  left: SelectedDecisionLineageEntryV01,
  right: SelectedDecisionLineageEntryV01,
): number {
  if (left.pilot_actionable !== right.pilot_actionable) {
    return left.pilot_actionable ? 1 : -1;
  }
  return compareCodeUnitsV01(
    [
      left.status,
      String(left.pilot_session_bound),
      left.session_id ?? "",
      left.request_fingerprint ?? "",
      ...left.errors,
    ].join("\0"),
    [
      right.status,
      String(right.pilot_session_bound),
      right.session_id ?? "",
      right.request_fingerprint ?? "",
      ...right.errors,
    ].join("\0"),
  );
}

function proposalSourceRefsV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
): SelectedWorkTimelineSourceRefV01[] {
  return [
    {
      source_kind: "proposal",
      record_id: read.proposal.proposal_id,
      record_fingerprint: read.proposal.integrity.fingerprint,
    },
    {
      source_kind: "candidate",
      record_id: selected.candidate.candidate_id,
      record_fingerprint: selected.candidate_fingerprint,
    },
    ...(read.proposal.operation_revision
      ? [
          {
            source_kind: "proposal" as const,
            record_id: read.proposal.operation_revision.source.proposal_id,
            record_fingerprint:
              read.proposal.operation_revision.source.proposal_fingerprint,
          },
        ]
      : []),
  ];
}

function decisionSourceRefsV01(
  decision: ReviewDecisionV01,
): SelectedWorkTimelineSourceRefV01[] {
  return [
    {
      source_kind: "decision",
      record_id: decision.decision_id,
      record_fingerprint: decision.integrity.fingerprint,
    },
  ];
}

function latestExactSourceCompletionV01(
  read: SemanticReviewProposalDetailV01,
): string | null {
  const exact = read.source_run_receipts
    .map((receipt) => exactTimestampOrNullV01(receipt.finished_at))
    .filter((value): value is string => value !== null)
    .sort(timestampOrderV01);
  return exact.at(-1) ?? null;
}

function revisitDueV01(
  observedAt: string,
  decision: ReviewDecisionV01,
): boolean {
  if (!decision.revisit) return true;
  const observed = timestampMillisecondsV01(observedAt);
  if (observed === null) return false;
  const revisit = timestampMillisecondsV01(decision.revisit.revisit_at);
  const expires = timestampMillisecondsV01(decision.revisit.expires_at);
  return (
    (revisit !== null && observed >= revisit) ||
    (expires !== null && observed >= expires)
  );
}

function deferSummaryV01(
  decision: ReviewDecisionV01,
  due: boolean,
): string {
  const condition = bounded(
    decision.revisit?.condition_summary ??
      "the saved revisit condition is met",
  );
  return due
    ? `The saved revisit point is due: ${condition}`
    : `Review remains deferred until ${condition}`;
}

function decisionTitleV01(decision: ReviewDecisionV01): string {
  return decision.decision === "accept"
    ? "Decision recorded · accept"
    : decision.decision === "reject"
      ? "Decision recorded · reject"
      : decision.decision === "defer"
        ? "Decision recorded · review later"
        : decision.decision === "supersede"
          ? "Decision recorded · replace"
          : "Decision recorded · remove";
}

function decisionSummaryV01(decision: ReviewDecisionV01): string {
  const rationale = bounded(decision.rationale_summary);
  return decision.decision === "accept"
    ? `You accepted this suggestion. ${rationale}`
    : decision.decision === "reject"
      ? `You rejected this suggestion. ${rationale}`
      : decision.decision === "defer"
        ? `You chose to review later. ${rationale}`
        : decision.decision === "supersede"
          ? `You chose to replace the current saved context. ${rationale}`
          : `You chose to remove the current saved context. ${rationale}`;
}

function meaningChangeForCurrentV01(
  stage: SelectedWorkTimelineStageV01,
): string {
  return stage === "deferred_until_condition"
    ? "The review remains pending its exact saved revisit semantics."
    : stage === "proposal_only_accepted"
      ? "A proposal-only judgment is recorded; project state and operational policy remain unchanged."
    : stage === "awaiting_application"
      ? "A decision exists, but saved project state has not changed."
      : stage === "transition_blocked"
        ? "A bounded safety or eligibility condition prevents application."
        : stage === "project_updated"
          ? "An authorized durable project change is recorded."
          : stage === "later_outcome_available" ||
              stage === "later_outcome_reviewed"
            ? "Later outcome evidence exists separately from the original decision."
            : "The selected review reached its current position.";
}

function operationLabelV01(operation: string): string {
  return operation === "add"
    ? "Add to the project"
    : operation === "revise"
      ? "Update saved project context"
      : operation === "supersede"
        ? "Replace the current saved state"
        : operation === "retract" || operation === "remove"
          ? "Remove the current saved state"
          : "Clarify how this change should apply";
}

function gateConfirmedAtV01(
  read: SemanticReviewProposalDetailV01,
  gateId: string,
): string | null {
  for (const chain of read.durable_lineage.chains) {
    if (chain.semantic_gate.gate_id === gateId) {
      return exactTimestampOrNullV01(chain.semantic_gate.confirmed_at);
    }
  }
  return null;
}

function itemV01(
  input: Omit<
    SelectedWorkTimelineItemV01,
    | "time_status"
    | "projection_only"
    | "grants_semantic_authority"
  > & {
    time_status?: SelectedWorkTimelineItemV01["time_status"];
  },
): SelectedWorkTimelineItemV01 {
  const occurredAt = exactTimestampOrNullV01(input.occurred_at);
  return {
    ...input,
    title: bounded(input.title),
    summary: bounded(input.summary),
    meaning_change: bounded(input.meaning_change),
    occurred_at: occurredAt,
    time_status:
      input.time_status ?? (occurredAt ? "exact" : "not_established"),
    projection_only: true,
    grants_semantic_authority: false,
  };
}

function addItemV01(
  items: SelectedWorkTimelineItemV01[],
  item: SelectedWorkTimelineItemV01,
): void {
  if (
    items.some(
      (existing) =>
        existing.item_id === item.item_id ||
        (existing.stage === item.stage &&
          existing.title === item.title &&
          existing.summary === item.summary),
    )
  ) {
    return;
  }
  items.push(item);
}

function exactTimestampOrNullV01(value: string | null | undefined): string | null {
  if (!value) return null;
  return timestampMillisecondsV01(value) === null ? null : value;
}

function timestampMillisecondsV01(value: string | null | undefined): number | null {
  if (!value) return null;
  return parseStrictIsoTimestampV01(value);
}

function timestampOrderV01(left: string, right: string): number {
  const leftTime = timestampMillisecondsV01(left);
  const rightTime = timestampMillisecondsV01(right);
  if (leftTime === null && rightTime === null) {
    return compareCodeUnitsV01(left, right);
  }
  if (leftTime === null) return 1;
  if (rightTime === null) return -1;
  return leftTime - rightTime || compareCodeUnitsV01(left, right);
}

function compareCodeUnitsV01(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function bounded(value: string): string {
  const compact = value
    .replaceAll("EpisodeDeltaProposal", "suggested change")
    .replaceAll("ReviewDecision", "saved decision")
    .replaceAll("StateTransitionReceipt", "project update record")
    .replaceAll("CriterionAssessment", "requirement assessment")
    .replaceAll("RunReceipt", "source result")
    .replaceAll("TaskContextPacket", "work context")
    .replaceAll("semantic commit gate", "project-change safeguard")
    .replaceAll("semantic gate", "project-change safeguard")
    .replaceAll("packet fingerprint", "exact source match")
    .replaceAll("_", " ")
    .replace(/\s+/gu, " ")
    .trim();
  return compact.length <= MAX_TEXT
    ? compact
    : `${compact.slice(0, MAX_TEXT - 1)}…`;
}
