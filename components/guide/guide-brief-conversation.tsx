"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildBrowserActionCapabilitySnapshotV01,
  buildGuideBriefInteractionRequestV01,
  compileGuideBriefInteractionPlanV01,
  createGuideBriefInteractionExecutionLedgerV01,
  executeGuideBriefInteractionPlanV01,
} from "@/lib/vnext/guide-brief/guide-brief-interaction-plan";
import {
  appendGuideBriefConversationTurnV01,
  buildGuideBriefConversationPlanV01,
  buildGuideBriefConversationScopeKeyV01,
  createGuideBriefConversationContextV01,
  scopeGuideBriefConversationContextV01,
  selectVisibleGuideBriefConversationAnswerV01,
} from "@/lib/vnext/guide-brief/guide-brief-conversation-plan";
import { SEMANTIC_VISUAL_PRIORITY } from "@/lib/vnext/semantic-visual/semantic-visual-contract";
import {
  GUIDE_BRIEF_CONVERSATION_MAX_QUESTION_LENGTH_V01,
  GUIDE_BRIEF_CONVERSATION_PLAN_VERSION_V01,
  type GuideBriefConversationContextV01,
  type GuideBriefConversationPlanInputV01,
  type GuideBriefConversationPlanV01,
} from "@/types/vnext/guide-brief-conversation";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";
import type {
  BrowserActionCapabilityV01,
  GuideBriefInteractionAdapterV01,
  GuideBriefInteractionContextV01,
  GuideBriefInteractionOutcomeV01,
  GuideBriefInteractionPlanV01,
} from "@/types/vnext/guide-brief-interaction";

import styles from "./guide-brief-conversation.module.css";

export interface GuideBriefInteractionHostV01 {
  context: GuideBriefInteractionContextV01;
  capabilities: BrowserActionCapabilityV01[];
  adapters: GuideBriefInteractionAdapterV01[];
}

export interface GuideBriefConversationPropsV01
  extends Pick<
    GuideBriefConversationPlanInputV01,
    | "guide_source_fingerprint"
    | "selected_work_scope"
    | "timeline"
    | "relationships"
    | "selected_relationship_question_key"
  > {
  guide: ProjectGuideBriefV02;
  surface: "blank_state" | "ai_workplane";
  interaction?: GuideBriefInteractionHostV01 | null;
  initiallyExpanded?: boolean;
  presentation?: "disclosure" | "embedded";
}

export function GuideBriefConversation({
  guide,
  surface,
  guide_source_fingerprint = null,
  selected_work_scope = null,
  timeline = null,
  relationships = {},
  selected_relationship_question_key = null,
  interaction = null,
  initiallyExpanded = false,
  presentation = "disclosure",
}: GuideBriefConversationPropsV01) {
  const sourceInput = useMemo(
    () => ({
      guide,
      guide_source_fingerprint,
      selected_work_scope,
      timeline,
      relationships,
      selected_relationship_question_key,
    }),
    [
      guide,
      guide_source_fingerprint,
      relationships,
      selected_relationship_question_key,
      selected_work_scope,
      timeline,
    ],
  );
  const scopeKey = useMemo(
    () =>
      buildGuideBriefConversationScopeKeyV01({
        ...sourceInput,
        question: "",
        conversation_context: null,
      }),
    [sourceInput],
  );
  const supportPlan = useMemo(
    () =>
      buildGuideBriefConversationPlanV01({
        ...sourceInput,
        question: "What is happening now?",
        conversation_context: null,
      }),
    [sourceInput],
  );
  const capabilitySnapshot = useMemo(
    () =>
      interaction
        ? buildBrowserActionCapabilitySnapshotV01({
            context: interaction.context,
            capabilities: interaction.capabilities,
          })
        : null,
    [interaction],
  );
  if (
    capabilitySnapshot &&
    capabilitySnapshot.scope_key !== scopeKey
  ) {
    throw new Error("guidebrief_interaction_pc4_scope_mismatch");
  }
  const [question, setQuestion] = useState("");
  const [context, setContext] =
    useState<GuideBriefConversationContextV01>(() =>
      createGuideBriefConversationContextV01(scopeKey)
    );
  const [answer, setAnswer] =
    useState<GuideBriefConversationPlanV01 | null>(null);
  const [interactionPlan, setInteractionPlan] =
    useState<GuideBriefInteractionPlanV01 | null>(null);
  const [interactionOutcome, setInteractionOutcome] =
    useState<GuideBriefInteractionOutcomeV01 | null>(null);
  const [interactionBusy, setInteractionBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const requestSequence = useRef(0);
  const mountedHost = useRef(false);
  const executionLedger = useRef(
    createGuideBriefInteractionExecutionLedgerV01(),
  );
  const currentBinding = useRef({
    scope_key: scopeKey,
    capability_snapshot_fingerprint:
      capabilitySnapshot?.fingerprint ?? "conversation-only",
  });
  currentBinding.current = {
    scope_key: scopeKey,
    capability_snapshot_fingerprint:
      capabilitySnapshot?.fingerprint ?? "conversation-only",
  };
  const interactionIdentity = `${scopeKey}\u0000${
    capabilitySnapshot?.fingerprint ?? "conversation-only"
  }`;

  useEffect(() => {
    mountedHost.current = true;
    setHydrated(true);
    return () => {
      mountedHost.current = false;
    };
  }, []);
  useEffect(() => {
    setQuestion("");
    setAnswer(null);
    setContext(createGuideBriefConversationContextV01(scopeKey));
  }, [scopeKey]);
  useEffect(() => {
    setInteractionPlan(null);
    setInteractionOutcome(null);
  }, [interactionIdentity]);

  const visibleAnswer = selectVisibleGuideBriefConversationAnswerV01(
    answer,
    scopeKey,
  );
  const visibleInteractionPlan =
    interactionPlan?.scope_key === scopeKey &&
      interactionPlan.capability_snapshot_fingerprint ===
        capabilitySnapshot?.fingerprint
      ? interactionPlan
      : null;
  const visibleInteractionOutcome =
    interactionPlan !== null &&
      interactionOutcome !== null &&
      interactionPlan.plan_id === interactionOutcome.plan_id &&
      interactionPlan.scope_key === scopeKey &&
      interactionPlan.capability_snapshot_fingerprint ===
        capabilitySnapshot?.fingerprint &&
      interactionOutcome.refreshed_scope_key === scopeKey &&
      interactionOutcome.refreshed_capability_snapshot_fingerprint ===
        capabilitySnapshot?.fingerprint
      ? interactionOutcome
      : null;

  function ask(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;
    const currentContext = scopeGuideBriefConversationContextV01(
      context,
      scopeKey,
    );
    const plan = buildGuideBriefConversationPlanV01({
      ...sourceInput,
      question: trimmed,
      conversation_context: currentContext,
    });
    setQuestion(trimmed);
    setInteractionPlan(null);
    setInteractionOutcome(null);
    setAnswer(plan);
    setContext(
      appendGuideBriefConversationTurnV01(currentContext, plan),
    );
  }

  async function submitUtterance(nextUtterance: string) {
    const trimmed = nextUtterance.trim();
    if (
      !trimmed ||
      interactionBusy ||
      executionLedger.current.in_flight_plan_id !== null
    ) {
      return;
    }
    if (!interaction || !capabilitySnapshot) {
      ask(trimmed);
      return;
    }
    requestSequence.current += 1;
    const currentContext = scopeGuideBriefConversationContextV01(
      context,
      scopeKey,
    );
    const request = buildGuideBriefInteractionRequestV01({
      request_id: `local-request-${requestSequence.current}`,
      raw_utterance: trimmed,
      scope_key: scopeKey,
      capability_snapshot_fingerprint: capabilitySnapshot.fingerprint,
      previous_turn_anchor: visibleAnswer?.answer_anchor ?? null,
      conversation_context: currentContext,
    });
    const plan = compileGuideBriefInteractionPlanV01({
      request,
      snapshot: capabilitySnapshot,
    });
    setQuestion(trimmed);
    if (plan.disposition === "answer_only") {
      ask(trimmed);
      return;
    }
    setAnswer(null);
    setInteractionOutcome(null);
    setInteractionPlan(plan);
    if (plan.status !== "resolved") return;
    setInteractionBusy(true);
    try {
      const outcome = await executeGuideBriefInteractionPlanV01({
        plan,
        current_snapshot: capabilitySnapshot,
        adapters: interaction.adapters,
        ledger: executionLedger.current,
        read_current_binding: () => currentBinding.current,
      });
      if (mountedHost.current) {
        setInteractionOutcome(outcome);
      }
    } finally {
      if (mountedHost.current) {
        setInteractionBusy(false);
      }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitUtterance(question);
  }

  const body = (
    <div className={styles.body}>
      <p className={styles.intro}>
        Ask one bounded question or request one currently supported Browser
        interaction. Explanations and interactions use the same exact
        current-work projections and existing action owners.
      </p>
      <form className={styles.form} onSubmit={submit}>
        <label htmlFor={`guidebrief-question-${surface}`}>
          Question or supported action about the current work
        </label>
        <div className={styles.questionRow}>
          <input
            id={`guidebrief-question-${surface}`}
            name="guidebrief-question"
            type="text"
            value={question}
            maxLength={GUIDE_BRIEF_CONVERSATION_MAX_QUESTION_LENGTH_V01}
            autoComplete="off"
            placeholder="What is happening now?"
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button
            type="submit"
            disabled={!question.trim() || interactionBusy}
          >
            {interactionBusy ? "Working…" : "Ask or act"}
          </button>
        </div>
      </form>

      {supportPlan.suggested_questions.length > 0 ? (
        <div
          className={styles.suggestions}
          aria-label="Questions supported by current sources"
        >
          <span>Available questions</span>
          <div>
            {supportPlan.suggested_questions.map((suggestion) => (
              <button
                key={suggestion.intent}
                type="button"
                onClick={() => ask(suggestion.question)}
              >
                {suggestion.question}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {capabilitySnapshot &&
      capabilitySnapshot.capabilities.some(
        (capability) =>
          capability.availability === "available" &&
          capability.may_propose,
      ) ? (
        <div
          className={styles.suggestions}
          aria-label="Interactions supported by current owners"
        >
          <span>Available interactions</span>
          <div>
            {capabilitySnapshot.capabilities
              .filter(
                (capability) =>
                  capability.availability === "available" &&
                  capability.may_propose,
              )
              .slice(0, 8)
              .map((capability) => (
                <button
                  key={`${capability.action_key}:${capability.target_handle}`}
                  type="button"
                  disabled={interactionBusy}
                  onClick={() =>
                    void submitUtterance(capability.public_label)
                  }
                >
                  {capability.public_label}
                </button>
              ))}
          </div>
        </div>
      ) : null}

      {visibleAnswer ? (
        <ConversationAnswer plan={visibleAnswer} />
      ) : null}
      {!visibleAnswer && visibleInteractionOutcome ? (
        <InteractionOutcome outcome={visibleInteractionOutcome} />
      ) : !visibleAnswer && visibleInteractionPlan ? (
        <InteractionPlan plan={visibleInteractionPlan} />
      ) : null}

      <p className={styles.boundary}>
        Guidance and bounded Browser handoffs only. This surface does not save
        a decision, confirm or apply a project change, run work, or replace the
        existing action owner.
      </p>
    </div>
  );

  return (
    <section
      className={styles.shell}
      data-guidebrief-conversation={
        GUIDE_BRIEF_CONVERSATION_PLAN_VERSION_V01
      }
      data-guidebrief-conversation-surface={surface}
      data-guidebrief-conversation-scope={scopeKey}
      data-guidebrief-conversation-active-answer={
        visibleAnswer || visibleInteractionPlan || visibleInteractionOutcome
          ? "true"
          : "false"
      }
      data-guidebrief-interaction={
        capabilitySnapshot ? "bounded-browser-v0.1" : "unavailable"
      }
      data-guidebrief-interaction-in-flight={String(interactionBusy)}
      data-guidebrief-conversation-hydrated={String(hydrated)}
      data-guidebrief-conversation-presentation={presentation}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      {presentation === "embedded" ? (
        <div className={styles.embedded}>{body}</div>
      ) : (
        <details
          className={styles.disclosure}
          open={initiallyExpanded || undefined}
        >
          <summary>Ask about this work</summary>
          {body}
        </details>
      )}
    </section>
  );
}

function InteractionPlan({
  plan,
}: {
  plan: GuideBriefInteractionPlanV01;
}) {
  return (
    <article
      className={styles.answer}
      aria-live="polite"
      data-guidebrief-interaction-plan={plan.status}
    >
      <div className={styles.answerHeader}>
        <span>
          {plan.status === "ambiguous"
            ? "Choose one action"
            : plan.status === "blocked" ||
                plan.status === "unavailable"
              ? "Action unavailable"
              : plan.status === "stale"
                ? "Current work changed"
                : plan.status === "unsupported"
                  ? "Unsupported request"
                  : "Current interaction"}
        </span>
        <strong>{plan.public_preview}</strong>
      </div>
    </article>
  );
}

function InteractionOutcome({
  outcome,
}: {
  outcome: GuideBriefInteractionOutcomeV01;
}) {
  return (
    <article
      className={styles.answer}
      aria-live="polite"
      data-guidebrief-interaction-outcome={outcome.status}
      data-guidebrief-interaction-durable-state-changed="false"
    >
      <div className={styles.answerHeader}>
        <span>
          {outcome.status === "completed"
            ? "Action completed"
            : outcome.status === "handed_off"
              ? "Owner prepared"
              : outcome.status === "preview_prepared"
                ? "Preview prepared"
                : outcome.status === "stale"
                  ? "Current work changed"
                  : outcome.status === "blocked"
                    ? "Action blocked"
                    : outcome.status === "unsupported"
                      ? "Unsupported request"
                      : "Action unavailable"}
        </span>
        <strong>{outcome.public_observed_effect}</strong>
      </div>
      <p className={styles.completeness}>
        No durable state changed through this interaction.
      </p>
    </article>
  );
}

function ConversationAnswer({
  plan,
}: {
  plan: GuideBriefConversationPlanV01;
}) {
  const sections: Array<{
    key: keyof GuideBriefConversationPlanV01["sections"];
    label: string;
  }> = [
    { key: "observed_or_exact_basis", label: "Basis" },
    { key: "bounded_interpretation", label: "Interpretation" },
    {
      key: "uncertainty_conflict_or_limitation",
      label: "Uncertainty or limitation",
    },
    { key: "human_attention_meaning", label: "Needs you" },
    { key: "next_meaningful_action", label: "Next step" },
  ];
  return (
    <article
      className={styles.answer}
      aria-live="polite"
      data-guidebrief-conversation-answer={plan.availability}
      data-guidebrief-conversation-intent={
        plan.routing.intent ?? plan.routing.status
      }
      data-guidebrief-conversation-context-reset={String(
        plan.context_reset,
      )}
    >
      <div className={styles.answerHeader}>
        <span>
          {plan.availability === "available"
            ? "Current answer"
            : plan.availability === "partial"
              ? "Partial answer"
              : plan.availability === "ambiguous"
                ? "Choose a narrower question"
                : "Answer unavailable"}
        </span>
        <strong>{plan.direct_answer}</strong>
      </div>
      {sections.some(({ key }) => plan.sections[key]) ? (
        <dl className={styles.sections}>
          {sections.map(({ key, label }) =>
            plan.sections[key] ? (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{plan.sections[key]}</dd>
              </div>
            ) : null
          )}
        </dl>
      ) : null}
      {plan.secondary_destinations.length > 0 ? (
        <nav
          className={styles.destinations}
          aria-label="Existing related destinations"
        >
          {plan.secondary_destinations.map((destination) => (
            <a key={destination.href} href={destination.href}>
              {destination.label}
            </a>
          ))}
        </nav>
      ) : null}
      {plan.source_completeness.status !== "complete" ? (
        <p className={styles.completeness}>
          {plan.source_completeness.summary}
        </p>
      ) : null}
    </article>
  );
}
