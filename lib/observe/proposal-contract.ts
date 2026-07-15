import type { StateValue } from "@/lib/db";

export const TEMPORAL_SCOPES = [
  "current_session",
  "current_task",
  "current_project",
  "until_deadline",
  "future_phase",
  "historical_note",
  "global_preference",
] as const;

export const STABILITIES = [
  "temporary",
  "tentative",
  "active",
  "stable",
  "deprecated",
  "completed",
] as const;

export const CHANGE_TYPES = [
  "new_state",
  "refinement",
  "override",
  "reversal",
  "completion",
  "deprecation",
  "future_intent",
] as const;

export const OPERATIONS = [
  "set",
  "update",
  "deprecate",
  "complete",
  "supersede",
] as const;

export const MAX_OBSERVE_PROPOSALS = 8;

export type ValidatedProposal = {
  state_key: string;
  before_value: StateValue;
  after_value: StateValue;
  operation: (typeof OPERATIONS)[number];
  temporal_scope: (typeof TEMPORAL_SCOPES)[number];
  valid_from: string | null;
  valid_until: string | null;
  stability: (typeof STABILITIES)[number];
  change_type: (typeof CHANGE_TYPES)[number];
  reason: string;
};

type UnknownRecord = Record<string, unknown>;
const STATE_VALUE_TYPES = new Set(["string", "number", "boolean"]);

export function validateCompilerOutput(output: unknown): ValidatedProposal[] {
  if (!isRecord(output) || !Array.isArray(output.proposals)) {
    throw new Error("Compiler output must include a proposals array.");
  }

  if (output.proposals.length > MAX_OBSERVE_PROPOSALS) {
    throw new Error(
      `Compiler output must include no more than ${MAX_OBSERVE_PROPOSALS} proposals.`,
    );
  }

  return output.proposals.map(validateProposal);
}

function validateProposal(value: unknown): ValidatedProposal {
  if (!isRecord(value)) {
    throw new Error("Each proposal must be an object.");
  }

  const proposal = {
    state_key: requireString(value, "state_key"),
    before_value: requireStateValue(value, "before_value"),
    after_value: requireStateValue(value, "after_value"),
    operation: requireEnum(value, "operation", OPERATIONS),
    temporal_scope: requireEnum(value, "temporal_scope", TEMPORAL_SCOPES),
    valid_from: requireNullableIsoDate(value, "valid_from"),
    valid_until: requireNullableIsoDate(value, "valid_until"),
    stability: requireEnum(value, "stability", STABILITIES),
    change_type: requireEnum(value, "change_type", CHANGE_TYPES),
    reason: requireString(value, "reason"),
  };

  if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)+$/.test(proposal.state_key)) {
    throw new Error("state_key is invalid.");
  }

  if (proposal.reason.length > 1_000) {
    throw new Error("reason must be 1000 characters or fewer.");
  }

  return proposal;
}

function requireString(record: UnknownRecord, key: string) {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string.`);
  }

  return value.trim();
}

function requireStateValue(record: UnknownRecord, key: string): StateValue {
  const value = record[key];

  if (
    value === null ||
    (STATE_VALUE_TYPES.has(typeof value) &&
      (typeof value !== "number" || Number.isFinite(value)))
  ) {
    return value as StateValue;
  }

  throw new Error(`${key} must be a JSON string, number, boolean, or null.`);
}

function requireEnum<T extends readonly string[]>(
  record: UnknownRecord,
  key: string,
  allowed: T,
) {
  const value = record[key];

  if (typeof value === "string" && allowed.includes(value)) {
    return value as T[number];
  }

  throw new Error(`${key} has an unsupported value.`);
}

function requireNullableIsoDate(record: UnknownRecord, key: string) {
  const value = record[key];

  if (value === null) {
    return null;
  }

  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value;
  }

  throw new Error(`${key} must be an ISO date string or null.`);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
