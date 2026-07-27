import type {
  GuideBriefSourceRefV02,
  ProjectGuideBriefV02,
} from "@/types/vnext/guide-brief";
import {
  GUIDE_BRIEF_CONVERSATION_MAX_SUGGESTIONS_V01,
  GUIDE_BRIEF_CONVERSATION_MAX_TURNS_V01,
  GUIDE_BRIEF_CONVERSATION_PLAN_VERSION_V01,
  type GuideBriefConversationAnswerAnchorV01,
  type GuideBriefConversationAvailabilityV01,
  type GuideBriefConversationContextV01,
  type GuideBriefConversationIntentV01,
  type GuideBriefConversationInternalSourceRefV01,
  type GuideBriefConversationPlanInputV01,
  type GuideBriefConversationPlanV01,
} from "@/types/vnext/guide-brief-conversation";
import type {
  SelectedWorkConnectionStatementV01,
  SelectedWorkRelationshipQuestionKeyV01,
  SelectedWorkRelationshipsV01,
} from "@/types/vnext/selected-work-relationships";
import type {
  SelectedWorkTimelineItemV01,
  SelectedWorkTimelineV01,
} from "@/types/vnext/selected-work-timeline";

const MAX_PUBLIC_TEXT = 360;

const INTENT_ORDER: GuideBriefConversationIntentV01[] = [
  "current_situation",
  "meaningful_change",
  "human_attention_reason",
  "source_and_support",
  "relationship_explanation",
  "uncertainty_and_conflict",
  "decision_and_authority",
  "transition_status",
  "later_outcome",
  "next_meaningful_action",
  "capability_boundary",
];

const SUGGESTED_QUESTIONS: Record<
  GuideBriefConversationIntentV01,
  string
> = {
  current_situation: "What is happening now?",
  meaningful_change: "What changed?",
  human_attention_reason: "Why does this need me?",
  source_and_support: "What supports this suggestion?",
  relationship_explanation: "How is this connected?",
  uncertainty_and_conflict: "What remains uncertain or conflicted?",
  decision_and_authority: "What still requires my decision?",
  transition_status: "Has the project update been applied?",
  later_outcome: "Did later work use the resulting context?",
  next_meaningful_action: "What should I do next?",
  capability_boundary: "What can Augnes do here?",
};

const AUTHORITY = {
  projection_only: true,
  rebuildable: true,
  persisted: false,
  accepts_evidence: false,
  establishes_truth: false,
  makes_decision: false,
  authorizes_transition: false,
  applies_transition: false,
  executes_work: false,
  mutates_project: false,
  mutates_later_context: false,
  calls_provider: false,
  performs_external_action: false,
} as const;

const OWNERS = {
  attention: "pc1",
  current_position: "pc2",
  relationships: "pc3",
  conversation_composition: "pc4",
} as const;

const SIDE_EFFECTS = {
  database: false,
  provider: false,
  external_action: false,
} as const;

interface AnswerDraftV01 {
  availability: GuideBriefConversationAvailabilityV01;
  direct_answer: string;
  sections: GuideBriefConversationPlanV01["sections"];
  internal_source_refs: GuideBriefConversationInternalSourceRefV01[];
  source_completeness: GuideBriefConversationPlanV01["source_completeness"];
  secondary_destinations: GuideBriefConversationPlanV01["secondary_destinations"];
}

interface RouteResultV01 {
  status: GuideBriefConversationPlanV01["routing"]["status"];
  intent: GuideBriefConversationIntentV01 | null;
  matched_intents: GuideBriefConversationIntentV01[];
  resolved_from_previous_turn: boolean;
}

export function normalizeGuideBriefConversationQuestionV01(
  question: string,
): string {
  return question
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

export function buildGuideBriefConversationScopeKeyV01(
  input: GuideBriefConversationPlanInputV01,
): string {
  const guideSourceFingerprint =
    exactFingerprintV01(input.guide_source_fingerprint) ??
    `derived:${hashV01(stableCanonicalV01(guideSourceIdentityV01(input.guide)))}`;
  const timeline = input.timeline ?? null;
  const selectedWork = input.selected_work_scope ?? null;
  const relationshipIdentity = Object.entries(input.relationships ?? {})
    .map(([key, value]) => ({
      key,
      version: value?.relationships_version ?? null,
      selected_question_key: value?.selected_question_key ?? null,
      answer_availability: value?.answer_availability ?? null,
      completeness: value?.completeness.status ?? null,
      anchor: value?.selected_work_anchor ?? null,
      exact_refs: (value?.connections ?? []).flatMap((connection) =>
        connection.exact_refs.map((ref) => ({
          source_kind: ref.source_kind,
          record_id: ref.record_id,
          record_fingerprint: ref.record_fingerprint,
        })),
      ),
    }))
    .sort((left, right) => compareCodeUnitsV01(left.key, right.key));
  return `guidebrief-conversation-scope:${hashV01(stableCanonicalV01({
    workspace_id: input.guide.identity.workspace_id,
    project_id: input.guide.identity.project_id,
    project_context: input.guide.identity.project_context,
    active_project_id: input.guide.identity.active_project_id,
    requested_project_id: input.guide.request.requested_project_id,
    guide_source_fingerprint: guideSourceFingerprint,
    proposal_id: selectedWork?.proposal_id ?? null,
    proposal_fingerprint: selectedWork?.proposal_fingerprint ?? null,
    candidate_id:
      selectedWork?.candidate_id ??
      timeline?.selected_work.selected_candidate_id ??
      null,
    candidate_fingerprint:
      selectedWork?.candidate_fingerprint ??
      timeline?.selected_work.selected_candidate_fingerprint ??
      null,
    timeline_current_item_id: timeline?.current_item_id ?? null,
    timeline_current_stage: timeline?.current_position.stage ?? null,
    relationship_question:
      input.selected_relationship_question_key ?? null,
    relationship_identity: relationshipIdentity,
  }))}`;
}

export function createGuideBriefConversationContextV01(
  scopeKey: string,
): GuideBriefConversationContextV01 {
  return { scope_key: scopeKey, turns: [] };
}

export function appendGuideBriefConversationTurnV01(
  context: GuideBriefConversationContextV01,
  plan: GuideBriefConversationPlanV01,
): GuideBriefConversationContextV01 {
  const base =
    context.scope_key === plan.scope.scope_key
      ? context
      : createGuideBriefConversationContextV01(plan.scope.scope_key);
  if (
    plan.routing.status !== "supported" ||
    plan.availability === "ambiguous" ||
    plan.answer_anchor === null
  ) {
    return base;
  }
  return {
    scope_key: plan.scope.scope_key,
    turns: [
      ...base.turns,
      {
        intent: plan.routing.intent!,
        availability: plan.availability,
        answer_anchor: plan.answer_anchor,
      },
    ].slice(-GUIDE_BRIEF_CONVERSATION_MAX_TURNS_V01),
  };
}

export function routeGuideBriefConversationQuestionV01(input: {
  question: string;
  scope_key: string;
  conversation_context?: GuideBriefConversationContextV01 | null;
}): GuideBriefConversationPlanV01["routing"] & {
  resolved_from_previous_turn: boolean;
} {
  const normalizedQuestion =
    normalizeGuideBriefConversationQuestionV01(input.question);
  const context =
    input.conversation_context?.scope_key === input.scope_key
      ? input.conversation_context
      : createGuideBriefConversationContextV01(input.scope_key);
  const result = routeQuestionV01(
    normalizedQuestion,
    context,
  );
  return {
    normalized_question: normalizedQuestion,
    status: result.status,
    intent: result.intent,
    matched_intents: result.matched_intents,
    resolved_from_previous_turn: result.resolved_from_previous_turn,
  };
}

export function buildGuideBriefConversationPlanV01(
  input: GuideBriefConversationPlanInputV01,
): GuideBriefConversationPlanV01 {
  const scopeKey = buildGuideBriefConversationScopeKeyV01(input);
  const guideSourceFingerprint =
    exactFingerprintV01(input.guide_source_fingerprint) ??
    `derived:${hashV01(stableCanonicalV01(guideSourceIdentityV01(input.guide)))}`;
  const contextReset =
    Boolean(input.conversation_context) &&
    input.conversation_context!.scope_key !== scopeKey;
  const context =
    input.conversation_context?.scope_key === scopeKey
      ? input.conversation_context
      : createGuideBriefConversationContextV01(scopeKey);
  const route = routeGuideBriefConversationQuestionV01({
    question: input.question,
    scope_key: scopeKey,
    conversation_context: context,
  });
  const normalizedQuestion = route.normalized_question;
  const relationship = selectedRelationshipV01(input);
  const answer =
    route.status === "supported" && route.intent
      ? answerForIntentV01(input, route.intent, normalizedQuestion)
      : nonAnswerV01(
          input,
          route.status === "ambiguous" ? "ambiguous" : "unsupported",
        );
  const suggestedQuestions = suggestedQuestionsV01(input);
  const anchor =
    route.status === "supported" &&
    route.intent &&
    answer.availability !== "ambiguous" &&
    answer.availability !== "unavailable"
      ? answerAnchorV01(scopeKey, route.intent)
      : null;
  const timeline = input.timeline ?? null;
  const nextAction = timeline
    ? {
        owner: "pc2_timeline" as const,
        label: publicTextV01(timeline.current_position.next_meaningful_step),
        destination: timeline.current_position.destination,
        is_action: false as const,
      }
    : {
        owner: "guide_brief" as const,
        label: publicTextV01(input.guide.primary_guidance.label),
        destination: input.guide.primary_guidance.href,
        is_action: false as const,
      };
  const selectedWork = input.selected_work_scope ?? null;

  return {
    plan_version: GUIDE_BRIEF_CONVERSATION_PLAN_VERSION_V01,
    scope: {
      scope_key: scopeKey,
      workspace_id: input.guide.identity.workspace_id,
      project_id: input.guide.identity.project_id,
      project_context: input.guide.identity.project_context,
      active_project_id: input.guide.identity.active_project_id,
      guide_source_fingerprint: guideSourceFingerprint,
      proposal_id: selectedWork?.proposal_id ?? null,
      proposal_fingerprint: selectedWork?.proposal_fingerprint ?? null,
      candidate_id:
        selectedWork?.candidate_id ??
        timeline?.selected_work.selected_candidate_id ??
        null,
      candidate_fingerprint:
        selectedWork?.candidate_fingerprint ??
        timeline?.selected_work.selected_candidate_fingerprint ??
        null,
      pc2_current_position_identity: timeline
        ? `${timeline.current_item_id}:${timeline.current_position.stage}`
        : null,
      pc3_relationship_question_identity:
        input.selected_relationship_question_key ?? null,
    },
    routing: {
      normalized_question: normalizedQuestion,
      status: route.status,
      intent: route.intent,
      matched_intents: route.matched_intents,
    },
    availability: answer.availability,
    direct_answer: publicTextV01(answer.direct_answer),
    sections: mapPublicSectionsV01(answer.sections),
    internal_source_refs: uniqueInternalRefsV01(
      answer.internal_source_refs,
    ),
    source_completeness: {
      status: answer.source_completeness.status,
      summary: publicTextV01(answer.source_completeness.summary),
    },
    suggested_questions: suggestedQuestions,
    secondary_destinations: uniqueDestinationsV01(
      answer.secondary_destinations,
    ),
    next_action: nextAction,
    facts: {
      current_situation: input.guide.projections.chatgpt.summary,
      meaningful_change:
        input.guide.coordinate.recent_meaningful_change,
      human_attention: input.guide.coordinate.human_attention,
      selected_timeline_position: timeline?.current_position ?? null,
      selected_relationship_meaning:
        relationship?.connections[0]?.explanation ?? null,
      uncertainty:
        relationship?.connections[0]?.uncertainty_or_conflict ??
        input.guide.coordinate.material_blocker_or_uncertainty,
      next_action_label:
        input.guide.projections.codex.suggested_next_action,
      authority: {
        can_decide: false,
        can_transition: false,
        can_execute: false,
      },
    },
    owners: OWNERS,
    authority: AUTHORITY,
    side_effects: SIDE_EFFECTS,
    answer_anchor: anchor,
    follow_up: {
      resolved_from_previous_turn: route.resolved_from_previous_turn,
    },
    context_reset: contextReset,
  };
}

function routeQuestionV01(
  normalized: string,
  context: GuideBriefConversationContextV01,
): RouteResultV01 {
  const previous = context.turns.at(-1) ?? null;
  const singlePreviousSubject =
    previous?.answer_anchor.subjects.length === 1;

  if (normalized === "why") {
    return previous && singlePreviousSubject
      ? {
          status: "supported",
          intent: previous.intent,
          matched_intents: [previous.intent],
          resolved_from_previous_turn: true,
        }
      : {
          status: "ambiguous",
          intent: null,
          matched_intents: [],
          resolved_from_previous_turn: false,
        };
  }
  if (normalized === "what supports that") {
    return previous && singlePreviousSubject
      ? {
          status: "supported",
          intent: "source_and_support",
          matched_intents: ["source_and_support"],
          resolved_from_previous_turn: true,
        }
      : {
          status: "ambiguous",
          intent: null,
          matched_intents: [],
          resolved_from_previous_turn: false,
        };
  }
  if (normalized === "was it applied" || normalized === "has it been applied") {
    const resolvesApplication =
      previous &&
      singlePreviousSubject &&
      previous.answer_anchor.subjects.some((subject) =>
        subject === "decision" ||
        subject === "transition" ||
        subject === "selected_work"
      );
    return resolvesApplication
      ? {
          status: "supported",
          intent: "transition_status",
          matched_intents: ["transition_status"],
          resolved_from_previous_turn: true,
        }
      : {
          status: "ambiguous",
          intent: null,
          matched_intents: ["transition_status"],
          resolved_from_previous_turn: false,
        };
  }

  const matched = INTENT_ORDER.filter((intent) =>
    matchesIntentV01(intent, normalized),
  );
  if (matched.length === 0) {
    return {
      status: "unsupported",
      intent: null,
      matched_intents: [],
      resolved_from_previous_turn: false,
    };
  }
  if (matched.length > 1) {
    return {
      status: "ambiguous",
      intent: null,
      matched_intents: matched,
      resolved_from_previous_turn: false,
    };
  }
  const intent = matched[0]!;
  return {
    status: "supported",
    intent,
    matched_intents: [intent],
    resolved_from_previous_turn: false,
  };
}

function matchesIntentV01(
  intent: GuideBriefConversationIntentV01,
  question: string,
): boolean {
  switch (intent) {
    case "current_situation":
      return /^(what is happening now|what is going on now|where are things now|where does (?:this|the work|the project) stand|current situation)$/u.test(
        question,
      );
    case "meaningful_change":
      return !question.includes("saved project") &&
        /(?:^|\b)(what changed|latest meaningful change|what is different now|what changed since (?:i|we) last looked)(?:$|\b)/u.test(
          question,
        );
    case "human_attention_reason":
      return /^(why (?:does|do) (?:this|it) need me|why is my attention needed|why do you need me|why does this require me)$/u.test(
        question,
      );
    case "source_and_support":
      return /^(what supports (?:this|the) suggestion|what is the basis for (?:this|the) suggestion|where did (?:this|the) suggestion come from|what source supports (?:this|it))$/u.test(
        question,
      );
    case "relationship_explanation":
      return /^(how is (?:this|it) connected(?: to (?:the )?(?:source|decision|source or decision))?|how does this connect|explain (?:the|this) relationship|show (?:the|this) connection)$/u.test(
        question,
      );
    case "uncertainty_and_conflict":
      return /^(what remains uncertain(?: or conflicted)?|what is uncertain(?: or conflicted)?|what is conflicted|why is (?:the )?project update blocked|what is blocking (?:this|the update)|what about (?:the )?blocker)$/u.test(
        question,
      );
    case "decision_and_authority":
      return /^(what still requires my decision|was a decision recorded|what did i decide|who decides(?: this)?|what decision (?:was|is) recorded|is this a decision)$/u.test(
        question,
      );
    case "transition_status":
      return /^(was it applied|has it been applied|has the project update been applied|was a decision recorded but not applied|what changed the saved project|did the saved project change|did the project change)$/u.test(
        question,
      );
    case "later_outcome":
      return /^(did later work use the resulting context|did later work use this context|what later outcome followed|what happened later|was the resulting context used later)$/u.test(
        question,
      );
    case "next_meaningful_action":
      return /(?:^|\b)(what should i do next|what is the next meaningful step|what happens next|what should happen next)(?:$|\b)/u.test(
        question,
      );
    case "capability_boundary":
      return /^(what can augnes do here|what can you do here|can you apply this|can augnes apply this|can you decide this|can augnes decide this)$/u.test(
        question,
      );
  }
}

function answerForIntentV01(
  input: GuideBriefConversationPlanInputV01,
  intent: GuideBriefConversationIntentV01,
  normalizedQuestion: string,
): AnswerDraftV01 {
  switch (intent) {
    case "current_situation":
      return currentSituationAnswerV01(input);
    case "meaningful_change":
      return meaningfulChangeAnswerV01(input);
    case "human_attention_reason":
      return humanAttentionAnswerV01(input);
    case "source_and_support":
      return relationshipAnswerV01(
        input,
        input.relationships?.support_and_source ?? null,
      );
    case "relationship_explanation":
      return relationshipAnswerV01(input, selectedRelationshipV01(input));
    case "uncertainty_and_conflict": {
      const selectedWorkExists = Boolean(
        input.selected_work_scope ?? input.timeline,
      );
      const relationshipRequired =
        selectedWorkExists &&
        (normalizedQuestion.includes("block") ||
          normalizedQuestion.includes("conflict"));
      const blockerRelationship =
        relationshipRequired
          ? input.relationships?.blocker_and_conflict ?? null
          : null;
      return uncertaintyAnswerV01(
        input,
        blockerRelationship,
        relationshipRequired,
      );
    }
    case "decision_and_authority":
      return decisionAnswerV01(input);
    case "transition_status":
      return transitionAnswerV01(input);
    case "later_outcome":
      return relationshipAnswerV01(
        input,
        input.relationships?.project_change_and_later_outcome ?? null,
      );
    case "next_meaningful_action":
      return nextActionAnswerV01(input);
    case "capability_boundary":
      return capabilityAnswerV01(input);
  }
}

function currentSituationAnswerV01(
  input: GuideBriefConversationPlanInputV01,
): AnswerDraftV01 {
  const guide = input.guide;
  if (guide.source_status === "unavailable") {
    return unavailableAnswerV01(
      "Current project guidance is unavailable, so the present situation cannot be answered safely.",
      "The current project read is unavailable.",
    );
  }
  const availability =
    guide.source_status === "partial" ? "partial" : "available";
  return {
    availability,
    direct_answer: guide.projections.chatgpt.summary,
    sections: {
      observed_or_exact_basis:
        guide.observed[0]?.statement ?? null,
      bounded_interpretation:
        guide.inferred[0]?.statement ?? null,
      uncertainty_conflict_or_limitation:
        guide.coordinate.material_blocker_or_uncertainty,
      human_attention_meaning: attentionMeaningV01(guide),
      next_meaningful_action: nextMeaningfulActionV01(input),
    },
    internal_source_refs: guideRefsV01(guide),
    source_completeness: {
      status: availability === "partial" ? "partial" : "complete",
      summary:
        availability === "partial"
          ? "The current situation is based on an incomplete bounded project read."
          : "The current bounded GuideBrief sources are available.",
    },
    secondary_destinations: guideDestinationsV01(guide),
  };
}

function meaningfulChangeAnswerV01(
  input: GuideBriefConversationPlanInputV01,
): AnswerDraftV01 {
  if (input.selected_work_scope && !input.timeline) {
    return unavailableAnswerV01(
      "The exact selected-work position is unavailable, so its meaningful change cannot be established.",
      "The selected-work timeline needed for this question is missing.",
    );
  }
  const timelineItem = currentTimelineItemV01(input.timeline ?? null);
  const change =
    timelineItem?.meaning_change ??
    input.guide.coordinate.recent_meaningful_change;
  if (!change) {
    return unavailableAnswerV01(
      "No exact meaningful change is available in the current bounded sources.",
      "A current GuideBrief change or selected-work timeline change is missing.",
    );
  }
  return {
    availability:
      input.guide.source_status === "partial" ? "partial" : "available",
    direct_answer: change,
    sections: {
      observed_or_exact_basis:
        timelineItem
          ? timelineItem.summary
          : input.guide.observed.at(-1)?.statement ?? null,
      bounded_interpretation:
        timelineItem?.basis === "bounded_interpretation"
          ? timelineItem.meaning_change
          : input.guide.inferred[0]?.statement ?? null,
      uncertainty_conflict_or_limitation:
        input.guide.source_status === "partial"
          ? "The bounded source read is incomplete."
          : null,
      human_attention_meaning: attentionMeaningV01(input.guide),
      next_meaningful_action: nextMeaningfulActionV01(input),
    },
    internal_source_refs: timelineItem
      ? timelineRefsV01(timelineItem)
      : guideRefsV01(input.guide),
    source_completeness: {
      status: input.guide.source_status === "partial" ? "partial" : "complete",
      summary:
        input.guide.source_status === "partial"
          ? "The known change is shown, but the bounded project read is incomplete."
          : "The current meaningful change is available from its existing projection owner.",
    },
    secondary_destinations: timelineItem?.destination
      ? [{
          label: "Open the existing selected-work destination",
          href: timelineItem.destination,
          secondary_only: true,
        }]
      : guideDestinationsV01(input.guide),
  };
}

function humanAttentionAnswerV01(
  input: GuideBriefConversationPlanInputV01,
): AnswerDraftV01 {
  const attention = input.guide.coordinate.human_attention;
  const direct = attention.required
    ? attention.blocked_or_awaiting ??
      "A consequential intervention in the current attention projection requires you."
    : "Nothing in the current attention projection requires your intervention right now.";
  return {
    availability:
      input.guide.source_status === "partial" ? "partial" : "available",
    direct_answer: direct,
    sections: {
      observed_or_exact_basis:
        attention.required
          ? "The current attention projection marks this as a genuine human responsibility."
          : "The current attention projection does not require human intervention.",
      bounded_interpretation: null,
      uncertainty_conflict_or_limitation:
        input.guide.source_status === "partial"
          ? "The current project read is partial; omitted material is not treated as absence."
          : null,
      human_attention_meaning: attentionMeaningV01(input.guide),
      next_meaningful_action: nextMeaningfulActionV01(input),
    },
    internal_source_refs: guideRefsV01(
      input.guide,
      "pc1_attention",
    ),
    source_completeness: {
      status: input.guide.source_status === "partial" ? "partial" : "complete",
      summary:
        input.guide.source_status === "partial"
          ? "The exact current attention result is preserved, with incomplete upstream material still marked partial."
          : "The exact current attention projection is available.",
    },
    secondary_destinations: guideDestinationsV01(input.guide),
  };
}

function relationshipAnswerV01(
  input: GuideBriefConversationPlanInputV01,
  relationship: SelectedWorkRelationshipsV01 | null,
): AnswerDraftV01 {
  if (
    !relationship ||
    relationship.answer_availability === "unavailable" ||
    relationship.connections.length === 0
  ) {
    return unavailableAnswerV01(
      "The exact relationship source needed for this question is unavailable, so Augnes cannot answer it safely.",
      "A required relationship projection is missing or unavailable.",
    );
  }
  const connection = relationship.connections[0]!;
  const availability = relationshipAvailabilityV01(
    relationship.answer_availability,
  );
  const conflicted =
    relationship.answer_availability === "conflicted" ||
    relationship.completeness.status === "conflicted";
  const partial =
    availability === "partial" && !conflicted;
  const sourceReferenceLimitation =
    relationship.selected_question_key === "support_and_source"
      ? "The exact reference preserves lineage but does not independently authenticate or prove the source."
      : null;
  const uncertaintyOrLimitation = [
    connection.uncertainty_or_conflict,
    conflicted ? "An exact conflict remains unresolved." : null,
    partial ? relationship.completeness.summary : null,
    relationship.selected_question_key ===
    "project_change_and_later_outcome"
      ? "Later use proves a connection, not usefulness or correctness."
      : null,
    sourceReferenceLimitation,
  ].filter((value): value is string => Boolean(value)).join(" ");
  return {
    availability,
    direct_answer: connection.explanation,
    sections: {
      observed_or_exact_basis:
        connection.basis === "bounded_interpretation"
          ? null
          : connection.explanation,
      bounded_interpretation:
        connection.basis === "bounded_interpretation"
          ? connection.explanation
          : connection.why_it_matters_now,
      uncertainty_conflict_or_limitation:
        uncertaintyOrLimitation || null,
      human_attention_meaning: attentionMeaningV01(input.guide),
      next_meaningful_action: nextMeaningfulActionV01(input),
    },
    internal_source_refs: relationshipRefsV01(connection),
    source_completeness: {
      status: conflicted
        ? "conflicted"
        : partial
          ? "partial"
          : "complete",
      summary: relationship.completeness.summary,
    },
    secondary_destinations: relationship.suggested_destinations,
  };
}

function uncertaintyAnswerV01(
  input: GuideBriefConversationPlanInputV01,
  blockerRelationship: SelectedWorkRelationshipsV01 | null,
  relationshipRequired: boolean,
): AnswerDraftV01 {
  if (blockerRelationship) {
    return relationshipAnswerV01(input, blockerRelationship);
  }
  if (relationshipRequired) {
    return unavailableAnswerV01(
      "The exact blocker or conflict relationship is unavailable, so Augnes cannot explain it safely.",
      "The selected-work relationship needed for this question is missing.",
    );
  }
  const uncertainty =
    input.guide.coordinate.material_blocker_or_uncertainty ??
    input.guide.gaps[0] ??
    null;
  if (!uncertainty) {
    return {
      availability: "available",
      direct_answer:
        "No material uncertainty or conflict is present in the current bounded GuideBrief projection.",
      sections: {
        observed_or_exact_basis:
          input.guide.observed[0]?.statement ?? null,
        bounded_interpretation: null,
        uncertainty_conflict_or_limitation:
          "This means no current material issue is projected; it does not prove that no unknown issue exists.",
        human_attention_meaning: attentionMeaningV01(input.guide),
        next_meaningful_action: nextMeaningfulActionV01(input),
      },
      internal_source_refs: guideRefsV01(input.guide),
      source_completeness: {
        status: "complete",
        summary: "The current bounded uncertainty projection is available.",
      },
      secondary_destinations: guideDestinationsV01(input.guide),
    };
  }
  return {
    availability:
      input.guide.source_status === "partial" ? "partial" : "available",
    direct_answer: uncertainty,
    sections: {
      observed_or_exact_basis:
        input.guide.observed[0]?.statement ?? null,
      bounded_interpretation: null,
      uncertainty_conflict_or_limitation: uncertainty,
      human_attention_meaning: attentionMeaningV01(input.guide),
      next_meaningful_action: nextMeaningfulActionV01(input),
    },
    internal_source_refs: guideRefsV01(input.guide),
    source_completeness: {
      status: input.guide.source_status === "partial" ? "partial" : "complete",
      summary:
        input.guide.source_status === "partial"
          ? "Known uncertainty is shown, while omitted material remains unknown."
          : "The current material uncertainty is available from GuideBrief.",
    },
    secondary_destinations: guideDestinationsV01(input.guide),
  };
}

function decisionAnswerV01(
  input: GuideBriefConversationPlanInputV01,
): AnswerDraftV01 {
  const relationship =
    input.relationships?.candidate_and_decision ?? null;
  if (relationship?.connections.length) {
    const answer = relationshipAnswerV01(input, relationship);
    const timeline = input.timeline;
    return {
      ...answer,
      direct_answer:
        timeline?.current_position.stage === "decision_recorded"
          ? timeline.current_position.summary
          : answer.direct_answer,
      sections: {
        ...answer.sections,
        uncertainty_conflict_or_limitation:
          answer.sections.uncertainty_conflict_or_limitation ??
          (timeline?.current_position.stage === "decision_recorded" &&
          timeline.current_position.primary_action_owner === "decision"
            ? "The recorded decision does not carry current-session project-update authority."
            : "A recommendation is not a user decision, and a decision is not an applied project update."),
      },
    };
  }
  if (input.selected_work_scope ?? input.timeline) {
    return unavailableAnswerV01(
      "The exact decision relationship is unavailable, so the selected change's decision status cannot be established.",
      "The selected-work decision relationship needed for this question is missing.",
    );
  }
  const judgment =
    input.guide.coordinate.unresolved_user_judgment;
  return {
    availability:
      input.guide.source_status === "partial" ? "partial" : "available",
    direct_answer: judgment
      ? `Your decision is still required: ${judgment}`
      : "No unresolved user decision is present in the current GuideBrief projection.",
    sections: {
      observed_or_exact_basis:
        input.guide.needs_user_judgment[0]?.why_it_matters ?? null,
      bounded_interpretation:
        "GuideBrief may explain or recommend, but it cannot make the decision.",
      uncertainty_conflict_or_limitation:
        "A suggestion or recommendation is not a decision, and a decision is not an applied project update.",
      human_attention_meaning: attentionMeaningV01(input.guide),
      next_meaningful_action: nextMeaningfulActionV01(input),
    },
    internal_source_refs: guideRefsV01(input.guide),
    source_completeness: {
      status: input.guide.source_status === "partial" ? "partial" : "complete",
      summary: "The current GuideBrief decision boundary is available.",
    },
    secondary_destinations: guideDestinationsV01(input.guide),
  };
}

function transitionAnswerV01(
  input: GuideBriefConversationPlanInputV01,
): AnswerDraftV01 {
  const timeline = input.timeline;
  if (!timeline) {
    return unavailableAnswerV01(
      "The exact selected-work position is unavailable, so application status cannot be established.",
      "A required selected-work timeline is missing.",
    );
  }
  const stage = timeline.current_position.stage;
  const relationship =
    stage === "project_updated" ||
    stage === "later_outcome_available" ||
    stage === "later_outcome_reviewed"
      ? input.relationships?.decision_and_project_change ?? null
      : stage === "transition_blocked"
        ? input.relationships?.blocker_and_conflict ?? null
        : input.relationships?.candidate_and_decision ?? null;
  const relationConnection = relationship?.connections[0] ?? null;
  const relationAvailability = relationship
    ? relationshipAvailabilityV01(relationship.answer_availability)
    : "available";
  const conflict =
    relationship?.answer_availability === "conflicted" ||
    stage === "transition_blocked";
  const direct =
    stage === "project_updated" ||
    stage === "later_outcome_available" ||
    stage === "later_outcome_reviewed"
      ? "An authorized project update is recorded for this exact selected change."
      : stage === "awaiting_application"
        ? "The decision is saved, but the project has not changed and no applied update is recorded."
        : timeline.current_position.summary;
  return {
    availability: conflict ? "partial" : relationAvailability,
    direct_answer: direct,
    sections: {
      observed_or_exact_basis:
        relationConnection?.explanation ??
        currentTimelineItemV01(timeline)?.summary ??
        timeline.current_position.summary,
      bounded_interpretation:
        relationConnection?.why_it_matters_now ?? null,
      uncertainty_conflict_or_limitation:
        relationConnection?.uncertainty_or_conflict ??
        (stage === "project_updated"
          ? "Application proves the saved project changed; it does not establish usefulness or correctness."
          : stage === "transition_blocked"
            ? "The current blocker remains unresolved and cannot be bypassed by conversation."
            : "A saved decision remains distinct from an applied project update."),
      human_attention_meaning: attentionMeaningV01(input.guide),
      next_meaningful_action:
        timeline.current_position.next_meaningful_step,
    },
    internal_source_refs: relationConnection
      ? relationshipRefsV01(relationConnection)
      : timeline.items.flatMap(timelineRefsV01),
    source_completeness: {
      status: conflict
        ? "conflicted"
        : relationAvailability === "partial"
          ? "partial"
          : "complete",
      summary:
        relationship?.completeness.summary ??
        "The exact selected-work current position is available.",
    },
    secondary_destinations:
      relationship?.suggested_destinations ??
      (timeline.current_position.destination
        ? [{
            label: "Open the existing selected-work destination",
            href: timeline.current_position.destination,
            secondary_only: true,
          }]
        : []),
  };
}

function nextActionAnswerV01(
  input: GuideBriefConversationPlanInputV01,
): AnswerDraftV01 {
  if (input.selected_work_scope && !input.timeline) {
    return unavailableAnswerV01(
      "The exact selected-work position is unavailable, so its next meaningful action cannot be established.",
      "The selected-work timeline needed for this question is missing.",
    );
  }
  const timeline = input.timeline ?? null;
  const label =
    timeline?.current_position.next_meaningful_step ??
    input.guide.primary_guidance.label;
  const reason =
    timeline?.current_position.summary ??
    input.guide.primary_guidance.reason;
  const destination =
    timeline?.current_position.destination ??
    input.guide.primary_guidance.href;
  return {
    availability:
      input.guide.source_status === "partial" ? "partial" : "available",
    direct_answer:
      `The next meaningful step is: ${label} This is a recommendation and does not perform the action.`,
    sections: {
      observed_or_exact_basis: reason,
      bounded_interpretation:
        "This answer compresses the existing next-step projection; it does not select or own the action.",
      uncertainty_conflict_or_limitation:
        input.guide.coordinate.material_blocker_or_uncertainty,
      human_attention_meaning: attentionMeaningV01(input.guide),
      next_meaningful_action:
        `${label} Use the existing action owner if you choose to continue.`,
    },
    internal_source_refs: timeline
      ? timeline.items.flatMap(timelineRefsV01)
      : guideRefsV01(input.guide),
    source_completeness: {
      status: input.guide.source_status === "partial" ? "partial" : "complete",
      summary: timeline
        ? "The exact current position supplies the next meaningful step."
        : "GuideBrief supplies the current project recommendation.",
    },
    secondary_destinations: destination
      ? [{
          label: timeline
            ? "Open the existing selected-work action"
            : "Open the existing GuideBrief destination",
          href: destination,
          secondary_only: true,
        }]
      : [],
  };
}

function capabilityAnswerV01(
  input: GuideBriefConversationPlanInputV01,
): AnswerDraftV01 {
  const timeline = input.timeline;
  const actionOwner = timeline?.current_position.primary_action_owner ?? null;
  const owner =
    actionOwner === "decision"
      ? "decision controls"
      : actionOwner === "transition"
        ? "project-update controls"
        : actionOwner === "candidate_selection"
          ? "candidate-selection control"
          : actionOwner === "none"
            ? "no current action control"
            : "GuideBrief destination";
  return {
    availability: "available",
    direct_answer:
      actionOwner === "none"
        ? "Augnes can explain the current bounded work, but there is no current action control. This conversation cannot decide, apply, resume, retry, merge, publish, or execute anything."
        : `Augnes can explain the current bounded work and point to the existing ${owner}. This conversation cannot decide, apply, resume, retry, merge, publish, or execute anything.`,
    sections: {
      observed_or_exact_basis:
        "The current GuideBrief and selected-work projections are read-only and non-authoritative.",
      bounded_interpretation:
        "Explanation and recommendation remain separate from decision, project update, and execution. Completed execution alone does not verify success.",
      uncertainty_conflict_or_limitation:
        "Capability is limited to the authority already exposed by existing projections and action owners.",
      human_attention_meaning: attentionMeaningV01(input.guide),
      next_meaningful_action: nextMeaningfulActionV01(input),
    },
    internal_source_refs: timeline
      ? timeline.items.flatMap(timelineRefsV01)
      : guideRefsV01(input.guide),
    source_completeness: {
      status: "complete",
      summary: "The conversation authority boundary is explicit and all action authority remains external.",
    },
    secondary_destinations: timeline?.current_position.destination
      ? [{
          label: "Open the existing action owner",
          href: timeline.current_position.destination,
          secondary_only: true,
        }]
      : guideDestinationsV01(input.guide),
  };
}

function nonAnswerV01(
  input: GuideBriefConversationPlanInputV01,
  status: "unsupported" | "ambiguous",
): AnswerDraftV01 {
  const ambiguous = status === "ambiguous";
  return {
    availability: ambiguous ? "ambiguous" : "unavailable",
    direct_answer: ambiguous
      ? "That question could refer to more than one current-work topic. Choose one of the supported questions below."
      : "I can only answer bounded questions about the current work. Ask about the current work's situation, source, uncertainty, decision, application, later outcome, capability, or next step.",
    sections: emptySectionsV01(),
    internal_source_refs: [],
    source_completeness: {
      status: "unavailable",
      summary: ambiguous
        ? "No single supported intent was established."
        : "The question is outside the supported current-work question family.",
    },
    secondary_destinations: guideDestinationsV01(input.guide),
  };
}

function unavailableAnswerV01(
  directAnswer: string,
  completeness: string,
): AnswerDraftV01 {
  return {
    availability: "unavailable",
    direct_answer: directAnswer,
    sections: {
      ...emptySectionsV01(),
      uncertainty_conflict_or_limitation:
        "Missing exact source material remains unknown and is not reconstructed.",
    },
    internal_source_refs: [],
    source_completeness: {
      status: "unavailable",
      summary: completeness,
    },
    secondary_destinations: [],
  };
}

function emptySectionsV01(): GuideBriefConversationPlanV01["sections"] {
  return {
    observed_or_exact_basis: null,
    bounded_interpretation: null,
    uncertainty_conflict_or_limitation: null,
    human_attention_meaning: null,
    next_meaningful_action: null,
  };
}

function mapPublicSectionsV01(
  sections: GuideBriefConversationPlanV01["sections"],
): GuideBriefConversationPlanV01["sections"] {
  return {
    observed_or_exact_basis: nullablePublicTextV01(
      sections.observed_or_exact_basis,
    ),
    bounded_interpretation: nullablePublicTextV01(
      sections.bounded_interpretation,
    ),
    uncertainty_conflict_or_limitation: nullablePublicTextV01(
      sections.uncertainty_conflict_or_limitation,
    ),
    human_attention_meaning: nullablePublicTextV01(
      sections.human_attention_meaning,
    ),
    next_meaningful_action: nullablePublicTextV01(
      sections.next_meaningful_action,
    ),
  };
}

function selectedRelationshipV01(
  input: GuideBriefConversationPlanInputV01,
): SelectedWorkRelationshipsV01 | null {
  const key = input.selected_relationship_question_key ?? null;
  if (key) return input.relationships?.[key] ?? null;
  const available = Object.values(input.relationships ?? {}).filter(
    (value): value is SelectedWorkRelationshipsV01 => Boolean(value),
  );
  return available.length === 1 ? available[0]! : null;
}

function relationshipAvailabilityV01(
  availability: SelectedWorkRelationshipsV01["answer_availability"],
): GuideBriefConversationAvailabilityV01 {
  return availability === "available"
    ? "available"
    : availability === "unavailable"
      ? "unavailable"
      : "partial";
}

function suggestedQuestionsV01(
  input: GuideBriefConversationPlanInputV01,
): GuideBriefConversationPlanV01["suggested_questions"] {
  const priority: GuideBriefConversationIntentV01[] = [
    "current_situation",
    ...(input.guide.coordinate.human_attention.required
      ? ["human_attention_reason" as const]
      : []),
    ...(input.guide.coordinate.material_blocker_or_uncertainty ||
    input.relationships?.blocker_and_conflict
      ? ["uncertainty_and_conflict" as const]
      : []),
    ...(input.relationships?.support_and_source
      ? ["source_and_support" as const]
      : []),
    ...(selectedRelationshipV01(input)
      ? ["relationship_explanation" as const]
      : []),
    ...(input.relationships?.candidate_and_decision
      ? ["decision_and_authority" as const]
      : []),
    ...(input.timeline ? ["transition_status" as const] : []),
    ...(input.relationships?.project_change_and_later_outcome
      ? ["later_outcome" as const]
      : []),
    "next_meaningful_action",
    "capability_boundary",
  ];
  const result: GuideBriefConversationPlanV01["suggested_questions"] = [];
  for (const intent of priority) {
    if (
      result.some((item) => item.intent === intent) ||
      !intentAvailableV01(input, intent)
    ) {
      continue;
    }
    result.push({
      question: SUGGESTED_QUESTIONS[intent],
      intent,
    });
    if (result.length === GUIDE_BRIEF_CONVERSATION_MAX_SUGGESTIONS_V01) break;
  }
  return result;
}

function intentAvailableV01(
  input: GuideBriefConversationPlanInputV01,
  intent: GuideBriefConversationIntentV01,
): boolean {
  switch (intent) {
    case "current_situation":
      return input.guide.source_status !== "unavailable";
    case "meaningful_change":
      return Boolean(
        currentTimelineItemV01(input.timeline ?? null)?.meaning_change ??
          input.guide.coordinate.recent_meaningful_change,
      );
    case "human_attention_reason":
      return input.guide.source_status !== "unavailable";
    case "source_and_support":
      return relationshipIsAnswerableV01(
        input.relationships?.support_and_source,
      );
    case "relationship_explanation":
      return relationshipIsAnswerableV01(selectedRelationshipV01(input));
    case "uncertainty_and_conflict":
      return Boolean(
        input.guide.coordinate.material_blocker_or_uncertainty ||
          relationshipIsAnswerableV01(
            input.relationships?.blocker_and_conflict,
          ),
      );
    case "decision_and_authority":
      return Boolean(
        input.guide.coordinate.unresolved_user_judgment ||
          relationshipIsAnswerableV01(
            input.relationships?.candidate_and_decision,
          ),
      );
    case "transition_status":
      return Boolean(input.timeline);
    case "later_outcome":
      return relationshipIsAnswerableV01(
        input.relationships?.project_change_and_later_outcome,
      );
    case "next_meaningful_action":
    case "capability_boundary":
      return true;
  }
}

function relationshipIsAnswerableV01(
  relationship: SelectedWorkRelationshipsV01 | null | undefined,
): boolean {
  return Boolean(
    relationship &&
      relationship.answer_availability !== "unavailable" &&
      relationship.connections.length > 0,
  );
}

function answerAnchorV01(
  scopeKey: string,
  intent: GuideBriefConversationIntentV01,
): GuideBriefConversationAnswerAnchorV01 {
  const subject: GuideBriefConversationAnswerAnchorV01["subjects"][number] =
    intent === "current_situation" ||
    intent === "meaningful_change" ||
    intent === "human_attention_reason" ||
    intent === "uncertainty_and_conflict" ||
    intent === "next_meaningful_action"
      ? "project"
      : intent === "decision_and_authority"
        ? "decision"
        : intent === "transition_status"
          ? "transition"
          : intent === "relationship_explanation" ||
              intent === "source_and_support"
            ? "relationship"
            : intent === "later_outcome"
              ? "later_outcome"
              : "capability";
  return { scope_key: scopeKey, intent, subjects: [subject] };
}

function attentionMeaningV01(guide: ProjectGuideBriefV02): string {
  const attention = guide.coordinate.human_attention;
  if (!attention.required) {
    return "The current attention projection does not require human intervention.";
  }
  return attention.blocked_or_awaiting ??
    "The current attention projection marks a consequential intervention as requiring human attention.";
}

function nextMeaningfulActionV01(
  input: GuideBriefConversationPlanInputV01,
): string {
  return input.timeline?.current_position.next_meaningful_step ??
    input.guide.primary_guidance.label;
}

function currentTimelineItemV01(
  timeline: SelectedWorkTimelineV01 | null,
): SelectedWorkTimelineItemV01 | null {
  return timeline?.items.find(
    (item) => item.item_id === timeline.current_item_id,
  ) ?? null;
}

function guideRefsV01(
  guide: ProjectGuideBriefV02,
  owner: "guide_brief" | "pc1_attention" = "guide_brief",
): GuideBriefConversationInternalSourceRefV01[] {
  return guide.source_refs.map((ref) => guideRefV01(ref, owner));
}

function guideRefV01(
  ref: GuideBriefSourceRefV02,
  owner: "guide_brief" | "pc1_attention",
): GuideBriefConversationInternalSourceRefV01 {
  return {
    owner,
    source_kind: ref.kind,
    record_id: ref.ref_id,
    record_fingerprint: null,
    href: ref.href,
  };
}

function timelineRefsV01(
  item: SelectedWorkTimelineItemV01,
): GuideBriefConversationInternalSourceRefV01[] {
  return item.source_refs.map((ref) => ({
    owner: "pc2_timeline",
    source_kind: ref.source_kind,
    record_id: ref.record_id,
    record_fingerprint: ref.record_fingerprint,
    href: item.destination,
  }));
}

function relationshipRefsV01(
  connection: SelectedWorkConnectionStatementV01,
): GuideBriefConversationInternalSourceRefV01[] {
  return connection.exact_refs.map((ref) => ({
    owner: "pc3_relationship",
    source_kind: ref.source_kind,
    record_id: ref.record_id,
    record_fingerprint: ref.record_fingerprint,
    href: connection.destination,
  }));
}

function uniqueInternalRefsV01(
  refs: GuideBriefConversationInternalSourceRefV01[],
): GuideBriefConversationInternalSourceRefV01[] {
  const unique = new Map<string, GuideBriefConversationInternalSourceRefV01>();
  for (const ref of refs) {
    unique.set(
      [
        ref.owner,
        ref.source_kind,
        ref.record_id,
        ref.record_fingerprint ?? "",
        ref.href ?? "",
      ].join("\0"),
      ref,
    );
  }
  return [...unique.entries()]
    .sort(([left], [right]) => compareCodeUnitsV01(left, right))
    .map(([, ref]) => ref);
}

function guideDestinationsV01(
  guide: ProjectGuideBriefV02,
): GuideBriefConversationPlanV01["secondary_destinations"] {
  const result: GuideBriefConversationPlanV01["secondary_destinations"] = [];
  if (guide.primary_guidance.href) {
    result.push({
      label: guide.primary_guidance.label,
      href: guide.primary_guidance.href,
      secondary_only: true,
    });
  }
  const exact = guide.projections.ai_workplane.exact_detail_href;
  if (exact && !result.some((item) => item.href === exact)) {
    result.push({
      label: "View exact details",
      href: exact,
      secondary_only: true,
    });
  }
  return result;
}

function uniqueDestinationsV01(
  destinations: GuideBriefConversationPlanV01["secondary_destinations"],
): GuideBriefConversationPlanV01["secondary_destinations"] {
  const unique = new Map<
    string,
    GuideBriefConversationPlanV01["secondary_destinations"][number]
  >();
  for (const destination of destinations) {
    if (!unique.has(destination.href)) {
      unique.set(destination.href, {
        label: publicTextV01(destination.label),
        href: destination.href,
        secondary_only: true,
      });
    }
  }
  return [...unique.values()].slice(0, 3);
}

function guideSourceIdentityV01(guide: ProjectGuideBriefV02): unknown {
  return {
    identity: guide.identity,
    request: guide.request,
    source_status: guide.source_status,
    gaps: [...guide.gaps].sort(compareCodeUnitsV01),
    coordinate: guide.coordinate,
    primary_guidance: {
      label: guide.primary_guidance.label,
      reason: guide.primary_guidance.reason,
      href: guide.primary_guidance.href,
      source_refs: [...guide.primary_guidance.source_refs].sort(
        compareCodeUnitsV01,
      ),
    },
    source_refs: guide.source_refs
      .map((ref) => ({
        ref_id: ref.ref_id,
        kind: ref.kind,
        href: ref.href,
      }))
      .sort((left, right) =>
        compareCodeUnitsV01(left.ref_id, right.ref_id),
      ),
  };
}

function exactFingerprintV01(
  value: string | null | undefined,
): string | null {
  return value && /^sha256:[a-f0-9]{64}$/u.test(value) ? value : null;
}

function publicTextV01(value: string): string {
  const compact = value
    .replace(
      /(?:[a-z0-9_-]+:)?sha256:[a-f0-9]{64}/giu,
      "exact reference",
    )
    .replace(
      /\b(?:episode-delta-proposal|proposal-candidate|project):[a-z0-9:-]+\b/giu,
      "exact selected work",
    )
    .replaceAll("EpisodeDeltaProposal", "suggested change")
    .replaceAll("ReviewDecision", "saved decision")
    .replaceAll("StateTransitionReceipt", "project update record")
    .replaceAll("TaskContextPacket", "work context")
    .replaceAll("RunReceipt", "source result")
    .replace(/semantic (?:commit )?gate/giu, "project-change safeguard")
    .replace(/\bnonce\b/giu, "one-time confirmation")
    .replace(/\bTTL\b/gu, "confirmation window")
    .replace(/\bdatabase path\b/giu, "local storage detail")
    .replaceAll("_", " ")
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return compact.length <= MAX_PUBLIC_TEXT
    ? compact
    : `${compact.slice(0, MAX_PUBLIC_TEXT - 1)}…`;
}

function nullablePublicTextV01(
  value: string | null,
): string | null {
  return value === null ? null : publicTextV01(value);
}

function stableCanonicalV01(value: unknown): string {
  return JSON.stringify(canonicalValueV01(value));
}

function canonicalValueV01(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(canonicalValueV01)
      .sort((left, right) =>
        compareCodeUnitsV01(JSON.stringify(left), JSON.stringify(right)),
      );
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareCodeUnitsV01(left, right))
        .map(([key, nested]) => [key, canonicalValueV01(nested)]),
    );
  }
  return value;
}

function hashV01(value: string): string {
  let high = 0x811c9dc5;
  let low = 0x01000193;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    high = Math.imul(high ^ code, 0x01000193) >>> 0;
    low = Math.imul(low ^ (code + index), 0x811c9dc5) >>> 0;
  }
  return `${high.toString(16).padStart(8, "0")}${low
    .toString(16)
    .padStart(8, "0")}`;
}

function compareCodeUnitsV01(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
