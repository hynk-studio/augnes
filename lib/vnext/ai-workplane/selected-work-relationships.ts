import type { SemanticReviewProposalDetailV01 } from "@/components/workbench/semantic-review/semantic-review-types";
import {
  selectSelectedWorkLifecycleV01,
} from "@/lib/vnext/ai-workplane/selected-work-timeline";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import {
  SELECTED_WORK_RELATIONSHIPS_MAX_CONNECTIONS_V01,
  SELECTED_WORK_RELATIONSHIPS_MAX_QUESTIONS_V01,
  SELECTED_WORK_RELATIONSHIPS_VERSION_V01,
  type SelectedWorkConnectionStatementV01,
  type SelectedWorkRelationshipAnswerAvailabilityV01,
  type SelectedWorkRelationshipBasisV01,
  type SelectedWorkRelationshipExactRefV01,
  type SelectedWorkRelationshipKindV01,
  type SelectedWorkRelationshipQuestionKeyV01,
  type SelectedWorkRelationshipQuestionV01,
  type SelectedWorkRelationshipRoleV01,
  type SelectedWorkRelationshipsV01,
} from "@/types/vnext/selected-work-relationships";
import type {
  SelectedWorkTimelineItemV01,
  SelectedWorkTimelineV01,
} from "@/types/vnext/selected-work-timeline";

const MAX_TEXT = 320;

const AUTHORITY = {
  projection_only: true,
  rebuildable: true,
  writes_database: false,
  creates_relation_record: false,
  creates_evidence: false,
  accepts_evidence: false,
  establishes_claim_truth: false,
  creates_decision: false,
  authorizes_transition: false,
  applies_transition: false,
  selects_current_position: false,
  changes_timeline_order: false,
  changes_project_state: false,
  changes_later_context: false,
  calls_model_or_provider: false,
  performs_external_action: false,
} as const;

const QUESTION_LABELS: Record<SelectedWorkRelationshipQuestionKeyV01, string> = {
  support_and_source: "What supports this suggestion?",
  candidate_and_decision: "What exact decision is bound to this change?",
  blocker_and_conflict: "Why is the project update blocked?",
  decision_and_project_change: "What project change did this decision produce?",
  project_change_and_later_outcome:
    "What later work used the resulting context?",
};

type SelectedCandidateV01 =
  SemanticReviewProposalDetailV01["candidates"][number];
type DecisionEntryV01 =
  SemanticReviewProposalDetailV01["decision_history"][number];
type TransitionReceiptV01 =
  SemanticReviewProposalDetailV01["transition_receipts"][number];

interface CandidateConnectionV01
  extends Omit<
    SelectedWorkConnectionStatementV01,
    "connection_id" | "projection_only" | "grants_semantic_authority"
  > {
  identity_key: string;
  rank: number;
}

interface BuiltAnswerV01 {
  candidates: CandidateConnectionV01[];
  upstream_incomplete: boolean;
  conflicted: boolean;
}

export function buildSelectedWorkRelationshipsV01(input: {
  read: SemanticReviewProposalDetailV01;
  selected_candidate: SelectedCandidateV01;
  timeline: SelectedWorkTimelineV01;
  selected_question_key?: SelectedWorkRelationshipQuestionKeyV01 | null;
}): SelectedWorkRelationshipsV01 {
  const { read, selected_candidate: selected, timeline } = input;
  assertTimelineScopeV01(read, selected, timeline);

  const supportedQuestionKeys = supportedQuestionsV01(read, selected, timeline);
  const questions = orderedQuestionsV01(
    supportedQuestionKeys,
    timeline.current_position.stage,
  ).map(questionV01);
  const selectedQuestionKey = selectQuestionV01(
    questions,
    input.selected_question_key ?? null,
    timeline.current_position.stage,
  );
  const answer = selectedQuestionKey
    ? buildAnswerV01(read, selected, timeline, selectedQuestionKey)
    : { candidates: [], upstream_incomplete: false, conflicted: false };
  const ordered = deduplicatedConnectionsV01(answer.candidates);
  const visible = ordered
    .slice(0, SELECTED_WORK_RELATIONSHIPS_MAX_CONNECTIONS_V01)
    .map((candidate, index) => statementV01(candidate, selectedQuestionKey!, index));
  const omitted = Math.max(0, ordered.length - visible.length);
  const answerAvailability = answerAvailabilityV01({
    visible_count: visible.length,
    upstream_incomplete: answer.upstream_incomplete,
    conflicted: answer.conflicted,
  });
  const completeness = completenessV01({
    availability: answerAvailability,
    upstream_incomplete: answer.upstream_incomplete,
    locally_omitted: omitted,
  });

  return {
    relationships_version: SELECTED_WORK_RELATIONSHIPS_VERSION_V01,
    selected_work_anchor: {
      title: publicTextV01(selected.candidate.title),
      selected_candidate_id: selected.candidate.candidate_id,
      selected_candidate_fingerprint: selected.candidate_fingerprint,
      timeline_stage: timeline.current_position.stage,
      timeline_current_item_id: timeline.current_item_id,
      timeline_remains_current_position_owner: true,
    },
    questions,
    selected_question_key: selectedQuestionKey,
    selected_question_label: selectedQuestionKey
      ? QUESTION_LABELS[selectedQuestionKey]
      : "No source-supported relationship question is available",
    answer_availability: answerAvailability,
    highlighted_connection_id: visible[0]?.connection_id ?? null,
    connections: visible,
    visible_connection_count: visible.length,
    known_connection_count: ordered.length,
    locally_omitted_connection_count: omitted,
    completeness,
    suggested_destinations: suggestedDestinationsV01(visible),
    authority: AUTHORITY,
  };
}

function supportedQuestionsV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  timeline: SelectedWorkTimelineV01,
): Set<SelectedWorkRelationshipQuestionKeyV01> {
  const result = new Set<SelectedWorkRelationshipQuestionKeyV01>();
  if (hasSupportQuestionSourceV01(read, selected)) {
    result.add("support_and_source");
  }
  const decision = selectedTimelineDecisionV01(read, selected, timeline);
  if (decision) {
    result.add("candidate_and_decision");
  }
  if (hasBlockerQuestionSourceV01(read, selected, timeline)) {
    result.add("blocker_and_conflict");
  }
  const receipt = selectedTimelineTransitionV01(read, selected, timeline);
  if (decision && receipt) {
    result.add("decision_and_project_change");
  }
  if (
    receipt &&
    (timeline.current_position.stage === "later_outcome_available" ||
      timeline.current_position.stage === "later_outcome_reviewed") &&
    timeline.items.some((item) =>
      item.source_refs.some((ref) => ref.source_kind === "later_result")
    )
  ) {
    result.add("project_change_and_later_outcome");
  }
  return result;
}

function orderedQuestionsV01(
  supported: Set<SelectedWorkRelationshipQuestionKeyV01>,
  stage: SelectedWorkTimelineV01["current_position"]["stage"],
): SelectedWorkRelationshipQuestionKeyV01[] {
  const preferred = preferredQuestionV01(stage);
  const priority: SelectedWorkRelationshipQuestionKeyV01[] = [
    preferred,
    "blocker_and_conflict",
    "candidate_and_decision",
    "decision_and_project_change",
    "project_change_and_later_outcome",
    "support_and_source",
  ];
  return [...new Set(priority)]
    .filter((key) => supported.has(key))
    .slice(0, SELECTED_WORK_RELATIONSHIPS_MAX_QUESTIONS_V01);
}

function selectQuestionV01(
  questions: SelectedWorkRelationshipQuestionV01[],
  requested: SelectedWorkRelationshipQuestionKeyV01 | null,
  stage: SelectedWorkTimelineV01["current_position"]["stage"],
): SelectedWorkRelationshipQuestionKeyV01 | null {
  if (requested && questions.some((item) => item.question_key === requested)) {
    return requested;
  }
  const preferred = preferredQuestionV01(stage);
  return (
    questions.find((item) => item.question_key === preferred)?.question_key ??
    questions[0]?.question_key ??
    null
  );
}

function preferredQuestionV01(
  stage: SelectedWorkTimelineV01["current_position"]["stage"],
): SelectedWorkRelationshipQuestionKeyV01 {
  switch (stage) {
    case "review_focused":
    case "source_observed":
    case "change_suggested":
      return "support_and_source";
    case "decision_recorded":
    case "deferred_until_condition":
    case "awaiting_application":
      return "candidate_and_decision";
    case "transition_blocked":
      return "blocker_and_conflict";
    case "project_updated":
      return "decision_and_project_change";
    case "later_outcome_available":
    case "later_outcome_reviewed":
      return "project_change_and_later_outcome";
  }
}

function questionV01(
  questionKey: SelectedWorkRelationshipQuestionKeyV01,
): SelectedWorkRelationshipQuestionV01 {
  return {
    question_key: questionKey,
    label: QUESTION_LABELS[questionKey],
    source_supported: true,
  };
}

function buildAnswerV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  timeline: SelectedWorkTimelineV01,
  question: SelectedWorkRelationshipQuestionKeyV01,
): BuiltAnswerV01 {
  switch (question) {
    case "support_and_source":
      return supportAnswerV01(read, selected);
    case "candidate_and_decision":
      return decisionAnswerV01(read, selected, timeline);
    case "blocker_and_conflict":
      return blockerAnswerV01(read, selected, timeline);
    case "decision_and_project_change":
      return projectChangeAnswerV01(read, selected, timeline);
    case "project_change_and_later_outcome":
      return laterOutcomeAnswerV01(read, selected, timeline);
  }
}

function supportAnswerV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
): BuiltAnswerV01 {
  const candidates: CandidateConnectionV01[] = [];
  const materialIds = new Set(selected.candidate.basis_material_ids);
  const addMaterial = (
    lane: "observation" | "attestation" | "inference",
    item: {
      material_id: string;
      source_run_receipt_refs: Array<{
        external_id: string;
        source_ref?: string | null;
      }>;
    },
  ) => {
    if (!materialIds.has(item.material_id)) return;
    const isObserved = lane === "observation";
    const isReported = lane === "attestation";
    candidates.push({
      identity_key: `material\0${lane}\0${item.material_id}`,
      rank: isObserved ? 20 : isReported ? 30 : 40,
      relation_kind: isObserved ? "derived_from" : "interpreted_as",
      source_role: isObserved
        ? "observed_material"
        : isReported
          ? "reported_material"
          : "interpreted_material",
      target_role: "selected_suggestion",
      title: isObserved
        ? "Observed source informed this suggestion"
        : isReported
          ? "Reported source informed this suggestion"
          : "Source material was interpreted as this suggestion",
      explanation: isObserved
        ? "The selected suggestion names directly observed material as part of its exact basis."
        : isReported
          ? "The selected suggestion preserves reported material as a distinct source lane."
          : "The selected suggestion preserves a bounded interpretation derived from identified source material.",
      why_it_matters_now: isObserved
        ? "Observation supports review, but it does not by itself establish task success or approve the change."
        : isReported
          ? "Reported material remains separate from direct observation and still requires judgment."
          : "Interpretation explains the proposed meaning; it is not an accepted project state.",
      basis: isObserved
        ? "observed_source"
        : isReported
          ? "reported_source"
          : "bounded_interpretation",
      support_status: "exact",
      uncertainty_or_conflict: null,
      exact_refs: item.source_run_receipt_refs.map((ref) => ({
        source_kind: "source_result",
        record_id: ref.external_id,
        record_fingerprint: exactFingerprintV01(ref.source_ref),
      })),
      destination: "#selected-work-support",
    });
  };
  read.source_lanes.observations.forEach((item) =>
    addMaterial("observation", item)
  );
  read.source_lanes.attestations.forEach((item) =>
    addMaterial("attestation", item)
  );
  read.source_lanes.inferences.forEach((item) => addMaterial("inference", item));

  if (candidates.length === 0 && read.source_run_receipts.length > 0) {
    for (const receipt of [...read.source_run_receipts].sort((left, right) =>
      compareCodeUnitsV01(left.receipt_id, right.receipt_id)
    )) {
      candidates.push({
        identity_key:
          `source-result\0${receipt.receipt_id}\0${receipt.integrity.fingerprint}`,
        rank: 50,
        relation_kind: "derived_from",
        source_role: "source_work",
        target_role: "selected_suggestion",
        title: "Exact source work anchors this suggestion",
        explanation:
          "The selected suggestion belongs to a proposal created from an exact saved source result.",
        why_it_matters_now:
          "The result anchors the review, but host completion remains distinct from verified success.",
        basis: "observed_source",
        support_status: "exact",
        uncertainty_or_conflict: null,
        exact_refs: [
          {
            source_kind: "source_result",
            record_id: receipt.receipt_id,
            record_fingerprint: receipt.integrity.fingerprint,
          },
        ],
        destination: "#selected-work-support",
      });
    }
  }

  const selectedMaterial = selectedProjectVerifyMaterialV01(read, selected);
  if (selectedMaterial) {
    candidates.push(...selectedMaterial.connections);
  }

  const basisMissing =
    selected.candidate.basis_material_ids.length > 0 &&
    selected.candidate.basis_material_ids.some(
      (materialId) =>
        !read.source_lanes.observations.some(
          (item) => item.material_id === materialId,
        ) &&
        !read.source_lanes.attestations.some(
          (item) => item.material_id === materialId,
        ) &&
        !read.source_lanes.inferences.some(
          (item) => item.material_id === materialId,
        ),
    );
  if (basisMissing && candidates.length === 0) {
    candidates.push({
      identity_key: "support-partial-missing-basis",
      rank: 0,
      relation_kind: "derived_from",
      source_role: "source_work",
      target_role: "selected_suggestion",
      title: "The source path is only partly available",
      explanation:
        "The selected suggestion preserves a source basis, but this bounded read does not include every intermediate source item.",
      why_it_matters_now:
        "Missing intermediate material remains unknown and is not treated as support, proof, or absence.",
      basis: "bounded_interpretation",
      support_status: "partial",
      uncertainty_or_conflict:
        "Part of the exact source path is unavailable in this bounded view.",
      exact_refs: proposalCandidateRefsV01(read, selected),
      destination: "#selected-work-advanced",
    });
  }

  const upstreamIncomplete =
    basisMissing ||
    read.proposal.source_status.coverage !== "complete" ||
    read.project_verify_reconciliation.completeness.status !== "complete" ||
    selectedMaterial?.upstream_incomplete === true;
  const conflicted =
    selectedMaterial?.conflicted === true ||
    read.proposal.source_status.currentness === "stale";
  return { candidates, upstream_incomplete: upstreamIncomplete, conflicted };
}

function decisionAnswerV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  timeline: SelectedWorkTimelineV01,
): BuiltAnswerV01 {
  const entry = selectedTimelineDecisionV01(read, selected, timeline);
  if (!entry) {
    return { candidates: [], upstream_incomplete: true, conflicted: false };
  }
  const decision = entry.decision;
  const applying =
    decision.decision === "accept" ||
    decision.decision === "supersede" ||
    decision.decision === "retract";
  const historicalApplying = applying && !entry.pilot_actionable;
  const candidates: CandidateConnectionV01[] = [
    {
      identity_key:
        `decision\0${decision.decision_id}\0${decision.integrity.fingerprint}`,
      rank: historicalApplying ? 0 : 10,
      relation_kind: "decided_by",
      source_role: "selected_suggestion",
      target_role: "user_decision",
      title: decisionConnectionTitleV01(decision),
      explanation: decisionConnectionExplanationV01(decision),
      why_it_matters_now: historicalApplying
        ? "The decision remains part of history, but the current session must review again before any project update can proceed."
        : decision.decision === "reject"
          ? "The project remains unchanged; the recorded rejection does not need application."
          : decision.decision === "defer"
            ? "The saved revisit condition remains the source of when review resumes."
            : "The decision is bound to this selected suggestion, while application remains a separate protected step.",
      basis: "user_decision",
      support_status: "exact",
      uncertainty_or_conflict: historicalApplying
        ? "Current-session application authority is not present."
        : null,
      exact_refs: decisionRefsV01(read, selected, decision),
      destination: "#selected-work-advanced",
    },
  ];

  if (
    decision.decision === "supersede" &&
    decision.lineage.prior_decisions.length > 0
  ) {
    candidates.push({
      identity_key:
        `supersedes\0${decision.decision_id}\0${decision.integrity.fingerprint}`,
      rank: 20,
      relation_kind: "supersedes",
      source_role: "user_decision",
      target_role: "saved_project_state",
      title: "The decision explicitly replaces earlier accepted meaning",
      explanation:
        "Its exact decision lineage names the earlier decision that this selected change is intended to supersede.",
      why_it_matters_now:
        "Replacement remains a recorded intent until an exact authorized project update is applied.",
      basis: "user_decision",
      support_status: "exact",
      uncertainty_or_conflict: null,
      exact_refs: decision.lineage.prior_decisions.map((prior) => ({
        source_kind: "decision",
        record_id: prior.decision_id,
        record_fingerprint: prior.decision_fingerprint,
      })),
      destination: "#selected-work-advanced",
    });
  }
  if (
    decision.decision === "retract" &&
    decision.lineage.retracted_decision
  ) {
    candidates.push({
      identity_key:
        `retracts\0${decision.decision_id}\0${decision.integrity.fingerprint}`,
      rank: 20,
      relation_kind: "retracts",
      source_role: "user_decision",
      target_role: "saved_project_state",
      title: "The decision explicitly removes earlier accepted meaning",
      explanation:
        "Its exact lineage identifies the earlier decision whose saved project meaning is intended to be removed.",
      why_it_matters_now:
        "Removal remains a recorded intent until a separate authorized project update proves application.",
      basis: "user_decision",
      support_status: "exact",
      uncertainty_or_conflict: null,
      exact_refs: [
        {
          source_kind: "decision",
          record_id: decision.lineage.retracted_decision.decision_id,
          record_fingerprint:
            decision.lineage.retracted_decision.decision_fingerprint,
        },
      ],
      destination: "#selected-work-advanced",
    });
  }
  return {
    candidates,
    upstream_incomplete: false,
    conflicted: entry.status !== "valid" || !entry.pilot_session_bound,
  };
}

function blockerAnswerV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  timeline: SelectedWorkTimelineV01,
): BuiltAnswerV01 {
  const candidates: CandidateConnectionV01[] = [];
  const current = timeline.items.find(
    (item) => item.item_id === timeline.current_item_id,
  );
  if (timeline.current_position.stage === "transition_blocked" && current) {
    candidates.push({
      identity_key: `timeline-blocker\0${current.item_id}`,
      rank: 0,
      relation_kind: "blocked_by",
      source_role: "project_safeguard",
      target_role: "selected_suggestion",
      title: "A current safeguard blocks this project update",
      explanation: publicTextV01(timeline.current_position.summary),
      why_it_matters_now:
        "The blocker prevents safe application; it does not authorize bypass or convert the decision into a project change.",
      basis: "blocker_or_conflict",
      support_status: "exact",
      uncertainty_or_conflict: publicTextV01(
        timeline.current_position.next_meaningful_step,
      ),
      exact_refs: timelineRefsV01(current),
      destination: timeline.current_position.destination,
    });
  }

  const lifecycle = selectSelectedWorkLifecycleV01(
    read,
    selected.candidate.candidate_id,
  );
  for (const [index, conflict] of (lifecycle?.conflicts ?? []).entries()) {
    candidates.push({
      identity_key:
        `lifecycle-conflict\0${conflict.conflict_kind}\0${conflict.code}\0${index}`,
      rank: 5,
      relation_kind: "conflicts_with",
      source_role: "project_safeguard",
      target_role: "selected_suggestion",
      title: conflictTitleV01(conflict.conflict_kind),
      explanation:
        "The exact selected-record lifecycle reports a conflict on the path from this suggestion to saved project state.",
      why_it_matters_now:
        "The conflict must remain visible and unresolved before the project can be changed safely.",
      basis: "blocker_or_conflict",
      support_status: "conflicting",
      uncertainty_or_conflict:
        "The exact lifecycle source reports an unresolved conflict.",
      exact_refs: conflict.exact_refs.map(projectVerifyRefV01),
      destination: "#selected-work-advanced",
    });
  }

  const relevantMaterialIds = new Set(selected.candidate.basis_material_ids);
  for (const conflict of read.proposal.conflicts) {
    if (
      conflict.material_ids.length > 0 &&
      !conflict.material_ids.some((id) => relevantMaterialIds.has(id))
    ) {
      continue;
    }
    candidates.push({
      identity_key: `proposal-conflict\0${conflict.conflict_id}`,
      rank: 10,
      relation_kind: "conflicts_with",
      source_role: "source_work",
      target_role: "selected_suggestion",
      title: "Source material conflicts with this suggestion",
      explanation:
        "The proposal preserves an unresolved conflict in source material connected to the selected suggestion.",
      why_it_matters_now:
        "The conflict weakens the connection and remains a matter for review rather than automatic resolution.",
      basis: "blocker_or_conflict",
      support_status: "conflicting",
      uncertainty_or_conflict:
        "The source conflict remains explicitly unresolved.",
      exact_refs: proposalCandidateRefsV01(read, selected),
      destination: "#selected-work-support",
    });
  }

  if (
    candidates.length === 0 &&
    (selected.pilot_admission.blocking_reasons.length > 0 ||
      selected.pilot_admission.current_state_status === "drifted")
  ) {
    candidates.push({
      identity_key: "candidate-admission-blocker",
      rank: 0,
      relation_kind: "blocked_by",
      source_role: "project_safeguard",
      target_role: "selected_suggestion",
      title: "Current project state prevents safe application",
      explanation:
        "The exact selected candidate does not currently satisfy the bounded application conditions.",
      why_it_matters_now:
        "Review may continue, but the project update cannot be applied from this state.",
      basis: "blocker_or_conflict",
      support_status: "exact",
      uncertainty_or_conflict:
        "The current state or eligibility basis must be reconciled first.",
      exact_refs: proposalCandidateRefsV01(read, selected),
      destination: "#selected-work-advanced",
    });
  }

  const upstreamIncomplete =
    read.project_verify_reconciliation.completeness.status !== "complete" ||
    read.project_verify_lineage.completeness.status !== "complete";
  return {
    candidates,
    upstream_incomplete: upstreamIncomplete,
    conflicted: candidates.some(
      (candidate) => candidate.support_status === "conflicting",
    ),
  };
}

function projectChangeAnswerV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  timeline: SelectedWorkTimelineV01,
): BuiltAnswerV01 {
  const decision = selectedTimelineDecisionV01(read, selected, timeline);
  const receipt = selectedTimelineTransitionV01(read, selected, timeline);
  if (
    !decision ||
    !receipt ||
    !decisionTransitionBindingIsExactV01(decision, receipt)
  ) {
    return { candidates: [], upstream_incomplete: true, conflicted: false };
  }
  return {
    candidates: [
      {
        identity_key:
          `project-change\0${receipt.transition_receipt_id}\0${receipt.integrity.fingerprint}`,
        rank: 0,
        relation_kind: "applied_as",
        source_role: "user_decision",
        target_role: "saved_project_state",
        title: "The exact decision produced an authorized project update",
        explanation:
          "A project update record is bound to this selected suggestion and its exact saved decision.",
        why_it_matters_now:
          "This is the boundary where reviewed intent became durable project state; it still does not demonstrate later usefulness.",
        basis: "authorized_project_change",
        support_status: "exact",
        uncertainty_or_conflict: null,
        exact_refs: [
          ...decisionRefsV01(read, selected, decision.decision),
          {
            source_kind: "project_update",
            record_id: receipt.transition_receipt_id,
            record_fingerprint: receipt.integrity.fingerprint,
          },
        ],
        destination: "#selected-work-advanced",
      },
    ],
    upstream_incomplete:
      read.project_verify_lineage.completeness.status !== "complete",
    conflicted: false,
  };
}

function laterOutcomeAnswerV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  timeline: SelectedWorkTimelineV01,
): BuiltAnswerV01 {
  const decision = selectedTimelineDecisionV01(read, selected, timeline);
  const receipt = selectedTimelineTransitionV01(read, selected, timeline);
  const laterItem = timeline.items.find(
    (item) => item.item_id === timeline.current_item_id,
  );
  if (
    !decision ||
    !receipt ||
    !decisionTransitionBindingIsExactV01(decision, receipt) ||
    !laterItem
  ) {
    return { candidates: [], upstream_incomplete: true, conflicted: false };
  }
  const laterRef = laterItem.source_refs.find(
    (ref) => ref.source_kind === "later_result",
  );
  if (!laterRef) {
    return { candidates: [], upstream_incomplete: true, conflicted: false };
  }
  const latestTransition =
    read.project_continuity.latest_applied_transition;
  if (
    latestTransition?.transition_receipt_id !==
      receipt.transition_receipt_id ||
    latestTransition.transition_receipt_fingerprint !==
      receipt.integrity.fingerprint ||
    latestTransition.proposal_id !== read.proposal.proposal_id ||
    latestTransition.decision_id !== decision.decision.decision_id ||
    read.durable_lineage.proposal_id !== read.proposal.proposal_id ||
    read.durable_lineage.proposal_fingerprint !==
      read.proposal.integrity.fingerprint
  ) {
    return { candidates: [], upstream_incomplete: true, conflicted: false };
  }
  const exactChains = read.durable_lineage.chains.filter(
    (chain) =>
      chain.stage_status === "packet_compiled" &&
      chain.transition.receipt_id === receipt.transition_receipt_id &&
      chain.transition.receipt_fingerprint === receipt.integrity.fingerprint &&
      chain.transition.decision_id === decision.decision.decision_id &&
      chain.transition.decision_fingerprint ===
        decision.decision.integrity.fingerprint &&
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
  if (exactPackets.size !== 1) {
    return { candidates: [], upstream_incomplete: true, conflicted: false };
  }
  const packet = [...exactPackets.values()][0]!;
  const laterReceipt = read.project_continuity.latest_context_use_receipt;
  if (
    !laterReceipt ||
    laterReceipt.task_context_packet_id !== packet.packet_id ||
    laterReceipt.task_context_packet_fingerprint !==
      packet.packet_fingerprint ||
    laterReceipt.receipt_id !== laterRef.record_id ||
    laterReceipt.receipt_fingerprint !== laterRef.record_fingerprint
  ) {
    return { candidates: [], upstream_incomplete: true, conflicted: false };
  }
  const candidates: CandidateConnectionV01[] = [
    {
      identity_key:
        `later-work\0${laterRef.record_id}\0${laterRef.record_fingerprint ?? ""}`,
      rank: 0,
      relation_kind: "used_by_later_work",
      source_role: "saved_project_state",
      target_role: "later_work",
      title: "Later work used context compiled from this project update",
      explanation:
        "The later source result is bound to the exact context compiled from this selected project update.",
      why_it_matters_now:
        "This proves a later-use connection, not that the context was useful or that the earlier decision was correct.",
      basis: "later_outcome",
      support_status: "exact",
      uncertainty_or_conflict: null,
      exact_refs: [
        {
          source_kind: "project_update",
          record_id: receipt.transition_receipt_id,
          record_fingerprint: receipt.integrity.fingerprint,
        },
        {
          source_kind: "compiled_context",
          record_id: packet.packet_id,
          record_fingerprint: packet.packet_fingerprint,
        },
        {
          source_kind: "later_result",
          record_id: laterRef.record_id,
          record_fingerprint: laterRef.record_fingerprint,
        },
      ],
      destination: "#selected-work-later-feedback",
    },
  ];
  const feedbackRef = laterItem.source_refs.find(
    (ref) => ref.source_kind === "later_feedback",
  );
  const review = read.project_continuity.latest_context_use_review_status;
  if (
    feedbackRef &&
    review?.review_id === feedbackRef.record_id &&
    review.review_fingerprint === feedbackRef.record_fingerprint &&
    review.later_task_run_receipt_id === laterRef.record_id &&
    review.later_task_run_receipt_fingerprint === laterRef.record_fingerprint
  ) {
    candidates.push({
      identity_key:
        `later-feedback\0${feedbackRef.record_id}\0${feedbackRef.record_fingerprint ?? ""}`,
      rank: 10,
      relation_kind: "reviewed_by_later_feedback",
      source_role: "later_work",
      target_role: "later_feedback",
      title: "Later feedback reviewed the exact later result",
      explanation:
        "A separate feedback record is bound to the same later result and preserves how the context was assessed.",
      why_it_matters_now:
        "Feedback informs later review without rewriting the original decision or project history.",
      basis: "later_outcome",
      support_status: "exact",
      uncertainty_or_conflict: null,
      exact_refs: [
        {
          source_kind: "later_result",
          record_id: laterRef.record_id,
          record_fingerprint: laterRef.record_fingerprint,
        },
        {
          source_kind: "later_feedback",
          record_id: feedbackRef.record_id,
          record_fingerprint: feedbackRef.record_fingerprint,
        },
      ],
      destination: "#selected-work-later-feedback",
    });
  }
  return {
    candidates,
    upstream_incomplete: false,
    conflicted: false,
  };
}

function selectedProjectVerifyMaterialV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
): {
  connections: CandidateConnectionV01[];
  upstream_incomplete: boolean;
  conflicted: boolean;
} | null {
  const profile = read.proposal.project_verify_lifecycle;
  if (
    !profile ||
    profile.lifecycle_binding.selected_candidate.candidate_id !==
      selected.candidate.candidate_id ||
    profile.lifecycle_binding.selected_candidate.candidate_fingerprint !==
      selected.candidate_fingerprint
  ) {
    return null;
  }
  const binding = profile.lifecycle_binding;
  if (binding.entity_kind === "claim_evidence_relation") {
    const family = read.project_verify_reconciliation.relation_families.find(
      (entry) =>
        entry.relation_family_id === binding.family_id &&
        entry.claim_ref.record_id === binding.relation_endpoints?.claim_ref.record_id &&
        entry.claim_ref.record_fingerprint ===
          binding.relation_endpoints?.claim_ref.record_fingerprint &&
        entry.evidence_ref.record_id ===
          binding.relation_endpoints?.evidence_ref.record_id &&
        entry.evidence_ref.record_fingerprint ===
          binding.relation_endpoints?.evidence_ref.record_fingerprint,
    );
    const revision = family?.revisions.find(
      (entry) =>
        entry.relation_ref.record_id === binding.selected_record_ref.record_id &&
        entry.relation_ref.record_fingerprint ===
          binding.selected_record_ref.record_fingerprint,
    );
    if (!family || !revision) {
      return {
        connections: [
          partialSelectedRecordConnectionV01(read, selected, "relation"),
        ],
        upstream_incomplete: true,
        conflicted: false,
      };
    }
    return {
      connections: [
        exactRelationConnectionV01(revision.relation, read, selected),
      ],
      upstream_incomplete: family.completeness.status !== "complete",
      conflicted: revision.lifecycle.conflicts.length > 0,
    };
  }

  const family = read.project_verify_reconciliation.claim_families.find(
    (entry) => entry.claim_family_id === binding.family_id,
  );
  const revision = family?.revisions.find(
    (entry) =>
      entry.claim_ref.record_id === binding.selected_record_ref.record_id &&
      entry.claim_ref.record_fingerprint ===
        binding.selected_record_ref.record_fingerprint,
  );
  if (!family || !revision) {
    return {
      connections: [
        partialSelectedRecordConnectionV01(read, selected, "claim"),
      ],
      upstream_incomplete: true,
      conflicted: false,
    };
  }
  const connections: CandidateConnectionV01[] = [
    {
      identity_key:
        `selected-claim\0${revision.claim_ref.record_id}\0${revision.claim_ref.record_fingerprint}`,
      rank: 15,
      relation_kind: "interpreted_as",
      source_role: "claim",
      target_role: "selected_suggestion",
      title: "An exact recorded claim is selected for this suggestion",
      explanation:
        "The selected candidate is exactly bound to one recorded, revisable claim.",
      why_it_matters_now:
        "The claim explains the proposed meaning, but recording or selecting it does not establish truth.",
      basis: "bounded_interpretation",
      support_status: "exact",
      uncertainty_or_conflict:
        revision.claim.uncertainty.length > 0
          ? "The selected claim preserves explicit uncertainty."
          : null,
      exact_refs: [
        {
          source_kind: "claim",
          record_id: revision.claim_ref.record_id,
          record_fingerprint: revision.claim_ref.record_fingerprint,
        },
        ...proposalCandidateRefsV01(read, selected),
      ],
      destination: "#selected-work-advanced",
    },
  ];
  for (const relationFamily of read.project_verify_reconciliation
    .relation_families) {
    if (
      relationFamily.claim_ref.record_id !== revision.claim_ref.record_id ||
      relationFamily.claim_ref.record_fingerprint !==
        revision.claim_ref.record_fingerprint
    ) {
      continue;
    }
    const relation =
      relationFamily.revisions.find(
        (entry) =>
          entry.relation_ref.record_id ===
            relationFamily.applied_current_head_ref?.record_id &&
          entry.relation_ref.record_fingerprint ===
            relationFamily.applied_current_head_ref?.record_fingerprint,
      ) ??
      relationFamily.revisions.find(
        (entry) =>
          entry.relation_ref.record_id ===
            relationFamily.latest_recorded_candidate_ref?.record_id &&
          entry.relation_ref.record_fingerprint ===
            relationFamily.latest_recorded_candidate_ref?.record_fingerprint,
      ) ??
      null;
    if (relation) {
      connections.push(exactRelationConnectionV01(
        relation.relation,
        read,
        selected,
      ));
    }
  }
  return {
    connections,
    upstream_incomplete:
      family.completeness.status !== "complete" ||
      read.project_verify_reconciliation.relation_families.some(
        (entry) =>
          entry.claim_ref.record_id === revision.claim_ref.record_id &&
          entry.claim_ref.record_fingerprint ===
            revision.claim_ref.record_fingerprint &&
          entry.completeness.status !== "complete",
      ),
    conflicted:
      revision.lifecycle.conflicts.length > 0 ||
      connections.some((entry) => entry.support_status === "conflicting"),
  };
}

function exactRelationConnectionV01(
  relation: SemanticReviewProposalDetailV01["project_verify_reconciliation"]["relation_families"][number]["revisions"][number]["relation"],
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
): CandidateConnectionV01 {
  const conflicting =
    relation.relation_kind === "opposes" ||
    relation.relation_kind === "contradicts";
  const insufficient = relation.relation_kind === "insufficient";
  return {
    identity_key:
      `exact-relation\0${relation.relation_id}\0${relation.integrity.fingerprint}`,
    rank: conflicting ? 0 : insufficient ? 5 : 10,
    relation_kind: conflicting
      ? "conflicts_with"
      : relation.relation_kind === "supports"
        ? "supported_by"
        : "interpreted_as",
    source_role: "evidence",
    target_role: "claim",
    title: relationTitleV01(relation.relation_kind),
    explanation:
      "An exact recorded relation connects one bounded evidence item to the claim selected by this suggestion.",
    why_it_matters_now: conflicting
      ? "The opposing connection must remain visible; it is not resolved by relation count or confidence."
      : insufficient
        ? "The relation explicitly says the material is insufficient, so the missing support remains unresolved."
        : "The relation contributes support or context, but it does not prove the claim or accept the suggestion.",
    basis: "exact_recorded_relation",
    support_status: conflicting
      ? "conflicting"
      : insufficient
        ? "partial"
        : "exact",
    uncertainty_or_conflict: conflicting
      ? "The exact recorded relation opposes or contradicts the selected claim."
      : insufficient
        ? "The exact relation reports insufficient support."
        : relation.uncertainty.length > 0
          ? "The exact relation preserves explicit uncertainty."
          : null,
    exact_refs: [
      {
        source_kind: "claim_evidence_relation",
        record_id: relation.relation_id,
        record_fingerprint: relation.integrity.fingerprint,
      },
      {
        source_kind: "claim",
        record_id: relation.claim_ref.record_id,
        record_fingerprint: relation.claim_ref.record_fingerprint,
      },
      {
        source_kind: "evidence",
        record_id: relation.evidence_ref.record_id,
        record_fingerprint: relation.evidence_ref.record_fingerprint,
      },
      ...proposalCandidateRefsV01(read, selected),
    ],
    destination: "#selected-work-advanced",
  };
}

function partialSelectedRecordConnectionV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  kind: "claim" | "relation",
): CandidateConnectionV01 {
  return {
    identity_key: `partial-selected-${kind}`,
    rank: 0,
    relation_kind: kind === "relation" ? "supported_by" : "interpreted_as",
    source_role: kind === "relation" ? "evidence" : "claim",
    target_role: "selected_suggestion",
    title: "The selected exact connection is only partly available",
    explanation:
      "The proposal preserves an exact selected-record binding, but the bounded reconciliation read does not include the complete intermediate material.",
    why_it_matters_now:
      "The missing path remains unknown and cannot be treated as proof, accepted state, or absence.",
    basis:
      kind === "relation"
        ? "exact_recorded_relation"
        : "bounded_interpretation",
    support_status: "partial",
    uncertainty_or_conflict:
      "Intermediate exact relationship material is unavailable in this bounded read.",
    exact_refs: proposalCandidateRefsV01(read, selected),
    destination: "#selected-work-advanced",
  };
}

function hasSupportQuestionSourceV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
): boolean {
  return (
    selected.candidate.basis_material_ids.length > 0 ||
    selected.candidate.source_refs.length > 0 ||
    read.source_run_receipts.length > 0 ||
    read.proposal.project_verify_lifecycle?.lifecycle_binding.selected_candidate
      .candidate_id === selected.candidate.candidate_id
  );
}

function hasBlockerQuestionSourceV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  timeline: SelectedWorkTimelineV01,
): boolean {
  if (timeline.current_position.stage === "transition_blocked") return true;
  if (
    selected.pilot_admission.blocking_reasons.length > 0 ||
    selected.pilot_admission.current_state_status === "drifted"
  ) {
    return true;
  }
  const lifecycle = selectSelectedWorkLifecycleV01(
    read,
    selected.candidate.candidate_id,
  );
  if ((lifecycle?.conflicts.length ?? 0) > 0) return true;
  const materialIds = new Set(selected.candidate.basis_material_ids);
  return read.proposal.conflicts.some(
    (conflict) =>
      conflict.material_ids.length === 0 ||
      conflict.material_ids.some((id) => materialIds.has(id)),
  );
}

function selectedTimelineDecisionV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  timeline: SelectedWorkTimelineV01,
): DecisionEntryV01 | null {
  const current = timeline.items.find(
    (item) => item.item_id === timeline.current_item_id,
  );
  const receipt = selectedTimelineTransitionV01(read, selected, timeline);
  const decisionRefs = [
    ...(current?.source_refs.filter(
      (ref) => ref.source_kind === "decision",
    ) ?? []),
    ...(receipt
      ? [
          {
            record_id: receipt.source_decision.decision_id,
            record_fingerprint: receipt.source_decision.decision_fingerprint,
          },
        ]
      : []),
    ...timeline.items
      .flatMap((item) =>
        item.source_refs.filter((ref) => ref.source_kind === "decision"),
      )
      .reverse(),
  ];
  for (const ref of decisionRefs) {
    const entry = read.decision_history.find(
      (candidate) =>
        candidate.status === "valid" &&
        candidate.pilot_session_bound &&
        candidate.decision.decision_id === ref.record_id &&
        candidate.decision.integrity.fingerprint === ref.record_fingerprint &&
        candidate.decision.source_proposal.proposal_id ===
          read.proposal.proposal_id &&
        candidate.decision.source_proposal.proposal_fingerprint ===
          read.proposal.integrity.fingerprint &&
        candidate.decision.candidate.candidate_id ===
          selected.candidate.candidate_id &&
        candidate.decision.candidate.candidate_fingerprint ===
          selected.candidate_fingerprint,
    );
    if (entry) return entry;
  }
  return null;
}

function selectedTimelineTransitionV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  timeline: SelectedWorkTimelineV01,
): TransitionReceiptV01 | null {
  const refs = timeline.items.flatMap((item) =>
    item.source_refs.filter((ref) => ref.source_kind === "project_update")
  );
  for (const ref of refs.reverse()) {
    const receipt = read.transition_receipts.find(
      (candidate) =>
        candidate.transition_receipt_id === ref.record_id &&
        candidate.integrity.fingerprint === ref.record_fingerprint &&
        candidate.source_proposal.proposal_id === read.proposal.proposal_id &&
        candidate.source_proposal.proposal_fingerprint ===
          read.proposal.integrity.fingerprint &&
        candidate.source_candidate.candidate_id ===
          selected.candidate.candidate_id &&
        candidate.source_candidate.candidate_fingerprint ===
          selected.candidate_fingerprint,
    );
    if (receipt) return receipt;
  }
  return null;
}

function decisionTransitionBindingIsExactV01(
  decision: DecisionEntryV01,
  receipt: TransitionReceiptV01,
): boolean {
  return (
    receipt.source_decision.decision_id === decision.decision.decision_id &&
    receipt.source_decision.decision_fingerprint ===
      decision.decision.integrity.fingerprint
  );
}

function deduplicatedConnectionsV01(
  candidates: CandidateConnectionV01[],
): CandidateConnectionV01[] {
  const exact = new Map<string, CandidateConnectionV01>();
  for (const candidate of candidates) {
    const semanticKey = [
      candidate.relation_kind,
      candidate.source_role,
      candidate.target_role,
      candidate.title,
      candidate.explanation,
      candidate.exact_refs
        .map((ref) =>
          `${ref.source_kind}\0${ref.record_id}\0${ref.record_fingerprint ?? ""}`
        )
        .sort(compareCodeUnitsV01)
        .join("\u0001"),
    ].join("\0");
    const existing = exact.get(semanticKey);
    if (
      !existing ||
      candidate.rank < existing.rank ||
      (candidate.rank === existing.rank &&
        compareCodeUnitsV01(candidate.identity_key, existing.identity_key) < 0)
    ) {
      exact.set(semanticKey, candidate);
    }
  }
  return [...exact.values()].sort(
    (left, right) =>
      left.rank - right.rank ||
      compareCodeUnitsV01(left.identity_key, right.identity_key),
  );
}

function statementV01(
  candidate: CandidateConnectionV01,
  question: SelectedWorkRelationshipQuestionKeyV01,
  index: number,
): SelectedWorkConnectionStatementV01 {
  return {
    connection_id: `connection-${question}-${index + 1}`,
    relation_kind: candidate.relation_kind,
    source_role: candidate.source_role,
    target_role: candidate.target_role,
    title: publicTextV01(candidate.title),
    explanation: publicTextV01(candidate.explanation),
    why_it_matters_now: publicTextV01(candidate.why_it_matters_now),
    basis: candidate.basis,
    support_status: candidate.support_status,
    uncertainty_or_conflict: candidate.uncertainty_or_conflict
      ? publicTextV01(candidate.uncertainty_or_conflict)
      : null,
    exact_refs: uniqueExactRefsV01(candidate.exact_refs),
    destination: candidate.destination,
    projection_only: true,
    grants_semantic_authority: false,
  };
}

function answerAvailabilityV01(input: {
  visible_count: number;
  upstream_incomplete: boolean;
  conflicted: boolean;
}): SelectedWorkRelationshipAnswerAvailabilityV01 {
  if (input.visible_count === 0) return "unavailable";
  if (input.conflicted) return "conflicted";
  if (input.upstream_incomplete) return "partial";
  return "available";
}

function completenessV01(input: {
  availability: SelectedWorkRelationshipAnswerAvailabilityV01;
  upstream_incomplete: boolean;
  locally_omitted: number;
}): SelectedWorkRelationshipsV01["completeness"] {
  if (input.availability === "unavailable") {
    return {
      status: "unavailable",
      upstream_incomplete: input.upstream_incomplete,
      omitted_source_count_known: false,
      omitted_source_count: null,
      summary:
        "No exact source-supported connection is available for this question.",
    };
  }
  if (input.availability === "conflicted") {
    return {
      status: "conflicted",
      upstream_incomplete: input.upstream_incomplete,
      omitted_source_count_known: false,
      omitted_source_count: null,
      summary:
        "Known connections are shown, and an exact conflict remains unresolved.",
    };
  }
  if (input.locally_omitted > 0) {
    return {
      status: "bounded_incomplete",
      upstream_incomplete: input.upstream_incomplete,
      omitted_source_count_known: false,
      omitted_source_count: null,
      summary:
        "The most consequential known connections are shown; additional known detail remains in exact review.",
    };
  }
  if (input.upstream_incomplete) {
    return {
      status: "partial",
      upstream_incomplete: true,
      omitted_source_count_known: false,
      omitted_source_count: null,
      summary:
        "Known connections are shown, but the bounded source read is not exhaustive.",
    };
  }
  return {
    status: "complete",
    upstream_incomplete: false,
    omitted_source_count_known: false,
    omitted_source_count: null,
    summary: "The known bounded connection path is available for this question.",
  };
}

function suggestedDestinationsV01(
  connections: SelectedWorkConnectionStatementV01[],
): SelectedWorkRelationshipsV01["suggested_destinations"] {
  const labels = new Map<string, string>([
    ["#selected-work-support", "Review verification and uncertainty"],
    ["#selected-work-later-feedback", "Review optional later feedback"],
    ["#selected-work-advanced", "Open advanced exact review"],
  ]);
  const result: SelectedWorkRelationshipsV01["suggested_destinations"] = [];
  for (const connection of connections) {
    if (
      !connection.destination ||
      result.some((entry) => entry.href === connection.destination)
    ) {
      continue;
    }
    result.push({
      label: labels.get(connection.destination) ?? "Open related detail",
      href: connection.destination,
      secondary_only: true,
    });
  }
  if (!result.some((entry) => entry.href === "#selected-work-advanced")) {
    result.push({
      label: "Open advanced exact review",
      href: "#selected-work-advanced",
      secondary_only: true,
    });
  }
  return result.slice(0, 3);
}

function assertTimelineScopeV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  timeline: SelectedWorkTimelineV01,
): void {
  if (
    timeline.selected_work.selected_candidate_scope !== true ||
    timeline.selected_work.title !== publicTextV01(selected.candidate.title) ||
    !read.candidates.some(
      (candidate) =>
        candidate.candidate.candidate_id === selected.candidate.candidate_id &&
        candidate.candidate_fingerprint === selected.candidate_fingerprint,
    ) ||
    timeline.items.filter((item) => item.item_id === timeline.current_item_id)
      .length !== 1
  ) {
    throw new Error("selected_work_relationship_timeline_scope_invalid");
  }
}

function proposalCandidateRefsV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
): SelectedWorkRelationshipExactRefV01[] {
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
  ];
}

function decisionRefsV01(
  read: SemanticReviewProposalDetailV01,
  selected: SelectedCandidateV01,
  decision: ReviewDecisionV01,
): SelectedWorkRelationshipExactRefV01[] {
  return [
    ...proposalCandidateRefsV01(read, selected),
    {
      source_kind: "decision",
      record_id: decision.decision_id,
      record_fingerprint: decision.integrity.fingerprint,
    },
  ];
}

function timelineRefsV01(
  item: SelectedWorkTimelineItemV01,
): SelectedWorkRelationshipExactRefV01[] {
  return item.source_refs.map((ref) => ({
    source_kind: ref.source_kind,
    record_id: ref.record_id,
    record_fingerprint: ref.record_fingerprint,
  }));
}

function projectVerifyRefV01(ref: {
  record_kind: string;
  record_id: string;
  record_fingerprint: string;
}): SelectedWorkRelationshipExactRefV01 {
  const sourceKind: SelectedWorkRelationshipExactRefV01["source_kind"] =
    ref.record_kind === "evidence_record"
      ? "evidence"
      : ref.record_kind === "claim_record"
        ? "claim"
        : ref.record_kind === "claim_evidence_relation"
          ? "claim_evidence_relation"
          : ref.record_kind === "review_decision"
            ? "decision"
            : ref.record_kind === "semantic_commit_gate"
              ? "semantic_gate"
              : ref.record_kind === "state_transition_receipt"
                ? "project_update"
                : ref.record_kind === "task_context_packet"
                  ? "compiled_context"
                  : ref.record_kind === "run_receipt"
                    ? "later_result"
                    : ref.record_kind === "context_use_review"
                      ? "later_feedback"
                      : ref.record_kind === "episode_delta_proposal_candidate"
                        ? "candidate"
                        : "proposal";
  return {
    source_kind: sourceKind,
    record_id: ref.record_id,
    record_fingerprint: ref.record_fingerprint,
  };
}

function uniqueExactRefsV01(
  refs: SelectedWorkRelationshipExactRefV01[],
): SelectedWorkRelationshipExactRefV01[] {
  const unique = new Map<string, SelectedWorkRelationshipExactRefV01>();
  for (const ref of refs) {
    unique.set(
      `${ref.source_kind}\0${ref.record_id}\0${ref.record_fingerprint ?? ""}`,
      ref,
    );
  }
  return [...unique.values()].sort((left, right) =>
    compareCodeUnitsV01(
      `${left.source_kind}\0${left.record_id}\0${left.record_fingerprint ?? ""}`,
      `${right.source_kind}\0${right.record_id}\0${right.record_fingerprint ?? ""}`,
    )
  );
}

function exactFingerprintV01(value: string | null | undefined): string | null {
  return value && /^sha256:[a-f0-9]{64}$/u.test(value) ? value : null;
}

function decisionConnectionTitleV01(decision: ReviewDecisionV01): string {
  return decision.decision === "accept"
    ? "This selected suggestion has an exact accept decision"
    : decision.decision === "reject"
      ? "This selected suggestion has an exact reject decision"
      : decision.decision === "defer"
        ? "This selected suggestion has an exact review-later decision"
        : decision.decision === "supersede"
          ? "This selected suggestion has an exact replacement decision"
          : "This selected suggestion has an exact removal decision";
}

function decisionConnectionExplanationV01(
  decision: ReviewDecisionV01,
): string {
  return decision.decision === "accept"
    ? "The saved decision is bound to this exact candidate and requests a separate protected project update."
    : decision.decision === "reject"
      ? "The saved decision is bound to this exact candidate and records that the project should remain unchanged."
      : decision.decision === "defer"
        ? "The saved decision is bound to this exact candidate and preserves a separate revisit condition."
        : decision.decision === "supersede"
          ? "The saved decision is bound to this exact candidate and requests replacement of earlier accepted meaning."
          : "The saved decision is bound to this exact candidate and requests removal of earlier accepted meaning.";
}

function relationTitleV01(relationKind: string): string {
  return relationKind === "supports"
    ? "Recorded evidence supports the selected claim"
    : relationKind === "opposes"
      ? "Recorded evidence opposes the selected claim"
      : relationKind === "contradicts"
        ? "Recorded evidence contradicts the selected claim"
        : relationKind === "qualifies"
          ? "Recorded evidence qualifies the selected claim"
          : relationKind === "contextualizes"
            ? "Recorded evidence adds context to the selected claim"
            : "Recorded material is insufficient for the selected claim";
}

function conflictTitleV01(conflictKind: string): string {
  return conflictKind === "current_head"
    ? "Current saved state conflicts with the proposed update"
    : conflictKind === "transition"
      ? "The protected project-update path reports a conflict"
      : conflictKind === "review_decision"
        ? "The saved decision binding reports a conflict"
        : conflictKind === "bounded_read"
          ? "The bounded source read is incomplete"
          : "Exact source lineage reports a conflict";
}

function publicTextV01(value: string): string {
  const compact = value
    .replace(
      /(?:[a-z0-9_-]+:)?sha256:[a-f0-9]{64}/giu,
      "exact reference",
    )
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

function compareCodeUnitsV01(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
