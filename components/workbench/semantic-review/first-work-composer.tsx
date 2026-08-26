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
  mode = "initial",
  initialDefinition,
  onCancel,
}: {
  initialization: ProjectWorkInitializationV01;
  busy: boolean;
  onSave: (definition: ProjectWorkDefinitionV01) => Promise<void>;
  mode?: "initial" | "revision";
  initialDefinition?: ProjectWorkDefinitionV01;
  onCancel?: () => void;
}) {
  const [goal, setGoal] = useState(initialDefinition?.goal ?? "");
  const [criteriaText, setCriteriaText] = useState(
    initialDefinition?.success_criteria.join("\n") ?? "",
  );
  const [nonGoalsText, setNonGoalsText] = useState(
    initialDefinition?.non_goals.join("\n") ?? "",
  );
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
  const unchanged =
    mode === "revision" &&
    initialDefinition !== undefined &&
    sameDefinitionV01(definition, initialDefinition);
  const prefix = mode === "revision" ? "work-revision" : "first-work";

  useEffect(() => {
    if (mode === "initial" && window.location.hash !== "#first-work") return;
    window.requestAnimationFrame(() => goalRef.current?.focus());
  }, [mode]);

  return (
    <section
      id={mode === "initial" ? "first-work" : "work-revision"}
      className={`${styles.panel} ${styles.workplaneFocus}`}
      aria-labelledby={`${prefix}-title`}
      data-first-work-composer={
        mode === "initial" ? "project_work_initialization.v0.1" : undefined
      }
      data-work-revision-composer={
        mode === "revision" ? "pre_execution_user_revision" : undefined
      }
      data-first-work-state={initialization.state}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>
          {mode === "revision" ? "Current project work" : "First project work"}
        </p>
        <h2 id={`${prefix}-title`}>
          {mode === "revision" ? "Revise work definition" : "Define the first work"}
        </h2>
        <p className={styles.copy}>
          {mode === "revision"
            ? "Save an append-only revision before work starts. This does not start Codex or change project files."
            : "Save one goal and the criteria that will show success. This does not start Codex or change project files."}
        </p>
      </div>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (issues.length > 0 || busy || unchanged) return;
          void onSave(definition);
        }}
      >
        <label htmlFor={`${prefix}-goal`}>Goal</label>
        <textarea
          ref={goalRef}
          id={`${prefix}-goal`}
          name={`${prefix}-goal`}
          value={goal}
          required
          aria-describedby={`${prefix}-goal-help`}
          aria-invalid={issues.some((issue) => issue.field === "goal")}
          onChange={(event) => setGoal(event.target.value)}
        />
        <small id={`${prefix}-goal-help`} className={styles.muted}>
          Required · up to {INITIAL_PROJECT_WORK_LIMITS_V01.goal_characters.toLocaleString()} characters.
        </small>

        <label htmlFor={`${prefix}-success-criteria`}>Success criteria</label>
        <textarea
          id={`${prefix}-success-criteria`}
          name={`${prefix}-success-criteria`}
          value={criteriaText}
          required
          aria-describedby={`${prefix}-success-help`}
          aria-invalid={issues.some((issue) => issue.field === "criteria")}
          onChange={(event) => setCriteriaText(event.target.value)}
        />
        <small id={`${prefix}-success-help`} className={styles.muted}>
          Required · one criterion per line, up to {INITIAL_PROJECT_WORK_LIMITS_V01.success_criteria} entries.
        </small>

        <label htmlFor={`${prefix}-non-goals`}>Out of scope</label>
        <textarea
          id={`${prefix}-non-goals`}
          name={`${prefix}-non-goals`}
          value={nonGoalsText}
          aria-describedby={`${prefix}-non-goals-help`}
          aria-invalid={issues.some((issue) => issue.field === "non_goals")}
          onChange={(event) => setNonGoalsText(event.target.value)}
        />
        <small id={`${prefix}-non-goals-help`} className={styles.muted}>
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
            disabled={issues.length > 0 || busy || unchanged}
            data-first-work-action={mode === "initial" ? "save" : undefined}
            data-work-revision-action={mode === "revision" ? "save" : undefined}
            data-augnes-primary-action={
              mode === "revision" ? "save-work-revision" : "save-first-work"
            }
          >
            {busy
              ? mode === "revision"
                ? "Saving revision…"
                : "Saving first work…"
              : mode === "revision"
                ? "Save revision"
                : "Save first work"}
          </button>
          {mode === "revision" ? (
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={busy}
              data-work-revision-action="cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : null}
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
  if (containsDisallowedControlV01(definition.goal)) {
    return [{ field: "goal", message: "Remove control characters from the goal." }];
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
          INITIAL_PROJECT_WORK_LIMITS_V01.success_criterion_characters ||
        containsDisallowedControlV01(entry),
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
        [...entry].length > INITIAL_PROJECT_WORK_LIMITS_V01.non_goal_characters ||
        containsDisallowedControlV01(entry),
    )
  ) {
    return [{
      field: "non_goals",
      message: "Use no more than 12 out-of-scope entries and keep each one within 500 characters.",
    }];
  }
  if (
    new TextEncoder().encode(canonicalDefinitionV01(definition)).byteLength >
    INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes
  ) {
    return [{
      field: "non_goals",
      message: "Shorten the complete definition so it fits the protected request limit.",
    }];
  }
  return [];
}

function sameDefinitionV01(
  left: ProjectWorkDefinitionV01,
  right: ProjectWorkDefinitionV01,
): boolean {
  return canonicalDefinitionV01(left) === canonicalDefinitionV01(right);
}

function canonicalDefinitionV01(definition: ProjectWorkDefinitionV01): string {
  return `{"goal":${JSON.stringify(definition.goal)},"non_goals":[${definition.non_goals.map((entry) => JSON.stringify(entry)).join(",")}],"success_criteria":[${definition.success_criteria.map((entry) => JSON.stringify(entry)).join(",")}]}`;
}

function containsDisallowedControlV01(value: string): boolean {
  return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
}
