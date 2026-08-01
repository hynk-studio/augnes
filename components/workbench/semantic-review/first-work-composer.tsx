"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  ProjectWorkDefinitionV01,
  ProjectWorkInitializationV01,
} from "@/types/vnext/project-work-initialization";
import { INITIAL_PROJECT_WORK_LIMITS_V01 } from "@/types/vnext/project-work-initialization";
import { SEMANTIC_VISUAL_PRIORITY } from "@/lib/vnext/semantic-visual/semantic-visual-contract";

import styles from "./semantic-review.module.css";

export function FirstWorkComposer({
  initialization,
  busy,
  onSave,
}: {
  initialization: ProjectWorkInitializationV01;
  busy: boolean;
  onSave: (definition: ProjectWorkDefinitionV01) => Promise<void>;
}) {
  const [goal, setGoal] = useState("");
  const [criteriaText, setCriteriaText] = useState("");
  const [nonGoalsText, setNonGoalsText] = useState("");
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const definition = useMemo(
    () => ({
      goal: goal.trim(),
      success_criteria: normalizedLinesV01(criteriaText),
      non_goals: normalizedLinesV01(nonGoalsText),
    }),
    [criteriaText, goal, nonGoalsText],
  );
  const issues = validationIssuesV01(definition);

  useEffect(() => {
    if (window.location.hash !== "#first-work") return;
    window.requestAnimationFrame(() => goalRef.current?.focus());
  }, []);

  return (
    <section
      id="first-work"
      className={`${styles.panel} ${styles.workplaneFocus}`}
      aria-labelledby="first-work-title"
      data-first-work-composer="project_work_initialization.v0.1"
      data-first-work-state={initialization.state}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>First project work</p>
        <h2 id="first-work-title">Define the first work</h2>
        <p className={styles.copy}>
          Save one goal and the criteria that will show success. This does not
          start Codex or change project files.
        </p>
      </div>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (issues.length > 0 || busy) return;
          void onSave(definition);
        }}
      >
        <label htmlFor="first-work-goal">Goal</label>
        <textarea
          ref={goalRef}
          id="first-work-goal"
          name="first-work-goal"
          value={goal}
          required
          aria-describedby="first-work-goal-help"
          aria-invalid={issues.some((issue) => issue.field === "goal")}
          onChange={(event) => setGoal(event.target.value)}
        />
        <small id="first-work-goal-help" className={styles.muted}>
          Required · up to {INITIAL_PROJECT_WORK_LIMITS_V01.goal_characters.toLocaleString()} characters.
        </small>

        <label htmlFor="first-work-success-criteria">Success criteria</label>
        <textarea
          id="first-work-success-criteria"
          name="first-work-success-criteria"
          value={criteriaText}
          required
          aria-describedby="first-work-success-help"
          aria-invalid={issues.some((issue) => issue.field === "criteria")}
          onChange={(event) => setCriteriaText(event.target.value)}
        />
        <small id="first-work-success-help" className={styles.muted}>
          Required · one criterion per line, up to {INITIAL_PROJECT_WORK_LIMITS_V01.success_criteria} entries.
        </small>

        <label htmlFor="first-work-non-goals">Out of scope</label>
        <textarea
          id="first-work-non-goals"
          name="first-work-non-goals"
          value={nonGoalsText}
          aria-describedby="first-work-non-goals-help"
          aria-invalid={issues.some((issue) => issue.field === "non_goals")}
          onChange={(event) => setNonGoalsText(event.target.value)}
        />
        <small id="first-work-non-goals-help" className={styles.muted}>
          Optional · one non-goal per line. These boundaries are not permission grants.
        </small>

        {issues.length > 0 &&
        (goal.length > 0 || criteriaText.length > 0 || nonGoalsText.length > 0) ? (
          <p className={styles.error} role="alert">
            {issues[0]!.message}
          </p>
        ) : null}
        <div className={styles.buttonRow}>
          <button
            type="submit"
            className={styles.button}
            disabled={issues.length > 0 || busy}
            data-first-work-action="save"
            data-augnes-primary-action="save-first-work"
          >
            {busy ? "Saving first work…" : "Save first work"}
          </button>
        </div>
      </form>
    </section>
  );
}

function normalizedLinesV01(value: string): string[] {
  return [...new Set(value.split(/\r?\n/u).map((entry) => entry.trim()).filter(Boolean))]
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

function validationIssuesV01(definition: ProjectWorkDefinitionV01): Array<{
  field: "goal" | "criteria" | "non_goals";
  message: string;
}> {
  if (definition.goal.length === 0) {
    return [{ field: "goal", message: "Enter the project goal before saving." }];
  }
  if ([...definition.goal].length > INITIAL_PROJECT_WORK_LIMITS_V01.goal_characters) {
    return [{ field: "goal", message: "Shorten the goal to 2,000 characters or fewer." }];
  }
  if (definition.success_criteria.length === 0) {
    return [{ field: "criteria", message: "Add at least one success criterion." }];
  }
  if (
    definition.success_criteria.length >
      INITIAL_PROJECT_WORK_LIMITS_V01.success_criteria ||
    definition.success_criteria.some(
      (entry) =>
        [...entry].length >
        INITIAL_PROJECT_WORK_LIMITS_V01.success_criterion_characters,
    )
  ) {
    return [{
      field: "criteria",
      message: "Use no more than 12 criteria and keep each one within 500 characters.",
    }];
  }
  if (
    definition.non_goals.length > INITIAL_PROJECT_WORK_LIMITS_V01.non_goals ||
    definition.non_goals.some(
      (entry) =>
        [...entry].length > INITIAL_PROJECT_WORK_LIMITS_V01.non_goal_characters,
    )
  ) {
    return [{
      field: "non_goals",
      message: "Use no more than 12 out-of-scope entries and keep each one within 500 characters.",
    }];
  }
  if (
    new TextEncoder().encode(JSON.stringify(definition)).byteLength >
    INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes
  ) {
    return [{
      field: "non_goals",
      message: "Shorten the complete definition so it fits the protected request limit.",
    }];
  }
  return [];
}
