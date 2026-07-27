"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  appendGuideBriefConversationTurnV01,
  buildGuideBriefConversationPlanV01,
  buildGuideBriefConversationScopeKeyV01,
  createGuideBriefConversationContextV01,
} from "@/lib/vnext/guide-brief/guide-brief-conversation-plan";
import { SEMANTIC_VISUAL_PRIORITY } from "@/lib/vnext/semantic-visual/semantic-visual-contract";
import {
  GUIDE_BRIEF_CONVERSATION_PLAN_VERSION_V01,
  type GuideBriefConversationContextV01,
  type GuideBriefConversationPlanInputV01,
  type GuideBriefConversationPlanV01,
} from "@/types/vnext/guide-brief-conversation";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";

import styles from "./guide-brief-conversation.module.css";

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
}

export function GuideBriefConversation({
  guide,
  surface,
  guide_source_fingerprint = null,
  selected_work_scope = null,
  timeline = null,
  relationships = {},
  selected_relationship_question_key = null,
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
  const [question, setQuestion] = useState("");
  const [context, setContext] =
    useState<GuideBriefConversationContextV01>(() =>
      createGuideBriefConversationContextV01(scopeKey)
    );
  const [answer, setAnswer] =
    useState<GuideBriefConversationPlanV01 | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    setQuestion("");
    setAnswer(null);
    setContext(createGuideBriefConversationContextV01(scopeKey));
  }, [scopeKey]);

  const visibleAnswer =
    answer?.scope.scope_key === scopeKey ? answer : null;

  function ask(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;
    const currentContext =
      context.scope_key === scopeKey
        ? context
        : createGuideBriefConversationContextV01(scopeKey);
    const plan = buildGuideBriefConversationPlanV01({
      ...sourceInput,
      question: trimmed,
      conversation_context: currentContext,
    });
    setQuestion(trimmed);
    setAnswer(plan);
    setContext(
      appendGuideBriefConversationTurnV01(currentContext, plan),
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
  }

  return (
    <section
      className={styles.shell}
      data-guidebrief-conversation={
        GUIDE_BRIEF_CONVERSATION_PLAN_VERSION_V01
      }
      data-guidebrief-conversation-surface={surface}
      data-guidebrief-conversation-scope={scopeKey}
      data-guidebrief-conversation-active-answer={
        visibleAnswer ? "true" : "false"
      }
      data-guidebrief-conversation-hydrated={String(hydrated)}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <details className={styles.disclosure}>
        <summary>Ask about this work</summary>
        <div className={styles.body}>
          <p className={styles.intro}>
            Ask one bounded question about the current work. Answers use the
            same current project, attention, selected work, and relationship
            projections already shown here.
          </p>
          <form className={styles.form} onSubmit={submit}>
            <label htmlFor={`guidebrief-question-${surface}`}>
              Question about the current work
            </label>
            <div className={styles.questionRow}>
              <input
                id={`guidebrief-question-${surface}`}
                name="guidebrief-question"
                type="text"
                value={question}
                maxLength={240}
                autoComplete="off"
                placeholder="What is happening now?"
                onChange={(event) => setQuestion(event.target.value)}
              />
              <button type="submit" disabled={!question.trim()}>
                Ask
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

          {visibleAnswer ? (
            <ConversationAnswer plan={visibleAnswer} />
          ) : null}

          <p className={styles.boundary}>
            Guidance only. This conversation does not decide, apply a project
            change, run work, or replace the existing action owner.
          </p>
        </div>
      </details>
    </section>
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
