// Portable authored-definition normalization. Runtime admission stays in its owner.
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { INITIAL_PROJECT_WORK_LIMITS_V01, type ProjectWorkDefinitionV01 } from "@/types/vnext/project-work-initialization";
const DISALLOWED_TEXT = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

export class InitialProjectWorkContextErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 422) {
    super(code);
    this.name = "InitialProjectWorkContextErrorV01";
  }
}

export function normalizeInitialProjectWorkDefinitionV01(input: {
  goal: unknown;
  success_criteria: unknown;
  non_goals: unknown;
}): ProjectWorkDefinitionV01 {
  const { definition, bytes } = inspectInitialProjectWorkDefinitionV01(input);
  if (bytes > INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes) refuse("first_work_definition_too_large");
  return definition;
}

/** Shares normalization with admission; an inspection never admits material. */
export function inspectInitialProjectWorkDefinitionV01(input: {
  goal: unknown;
  success_criteria: unknown;
  non_goals: unknown;
}) {
  const goal = normalizeBoundedTextV01(
    input.goal,
    INITIAL_PROJECT_WORK_LIMITS_V01.goal_characters,
    "first_work_goal_invalid",
  );
  const successCriteria = normalizeBoundedListV01(
    input.success_criteria,
    1,
    INITIAL_PROJECT_WORK_LIMITS_V01.success_criteria,
    INITIAL_PROJECT_WORK_LIMITS_V01.success_criterion_characters,
    "first_work_success_criteria_invalid",
  );
  const nonGoals = normalizeBoundedListV01(
    input.non_goals,
    0,
    INITIAL_PROJECT_WORK_LIMITS_V01.non_goals,
    INITIAL_PROJECT_WORK_LIMITS_V01.non_goal_characters,
    "first_work_non_goals_invalid",
  );
  const definition = {
    goal,
    success_criteria: successCriteria,
    non_goals: nonGoals,
  };
  return { definition, bytes: new TextEncoder().encode(canonicalizeProtocolValueV01(definition)).byteLength };
}

function normalizeBoundedListV01(
  value: unknown,
  minimum: number,
  maximum: number,
  characterLimit: number,
  code: string,
): string[] {
  if (!Array.isArray(value)) refuse(code);
  const normalized = value
    .filter((entry) => typeof entry !== "string" || entry.trim().length > 0)
    .map((entry) => normalizeBoundedTextV01(entry, characterLimit, code));
  const unique = [...new Set(normalized)].sort(compareCodeUnitsV01);
  if (unique.length < minimum || unique.length > maximum) refuse(code);
  return unique;
}

function normalizeBoundedTextV01(
  value: unknown,
  limit: number,
  code: string,
): string {
  if (typeof value !== "string") refuse(code);
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    [...normalized].length > limit ||
    DISALLOWED_TEXT.test(normalized)
  ) {
    refuse(code);
  }
  return normalized;
}

function compareCodeUnitsV01(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function refuse(code: string, status = 422): never {
  throw new InitialProjectWorkContextErrorV01(code, status);
}
