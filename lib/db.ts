import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "augnes.db");

export type StateValue = boolean | number | string | null | StateValue[] | {
  [key: string]: StateValue;
};

export type StateEntry = {
  id: string;
  scope: string;
  state_key: string;
  value: StateValue;
  temporal_scope: string;
  valid_from: string | null;
  valid_until: string | null;
  stability: string;
  change_type: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  source_transition_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StateTension = {
  id: string;
  scope: string;
  state_key: string | null;
  title: string;
  description: string;
  status: string;
  severity: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type StateTransition = {
  id: string;
  state_key: string;
  before_value: StateValue;
  after_value: StateValue;
  temporal_scope: string;
  valid_from: string | null;
  valid_until: string | null;
  stability: string;
  change_type: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  reason: string | null;
  committed_at: string;
};

type EntryRow = Omit<StateEntry, "value"> & {
  value: string;
};

type TransitionRow = Omit<StateTransition, "before_value" | "after_value"> & {
  before_value: string | null;
  after_value: string;
};

export function getDatabasePath() {
  return process.env.AUGNES_DB_PATH ?? DEFAULT_DB_PATH;
}

export function openDatabase() {
  const dbPath = getDatabasePath();
  mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath, { fileMustExist: false });
  db.pragma("foreign_keys = ON");
  return db;
}

export function parseStateValue(value: string | null): StateValue {
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value) as StateValue;
  } catch {
    return value;
  }
}

export function listStateEntries(scope: string): StateEntry[] {
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            id,
            scope,
            state_key,
            value,
            temporal_scope,
            valid_from,
            valid_until,
            stability,
            change_type,
            source_agent_id,
            source_session_id,
            source_transition_id,
            created_at,
            updated_at
          FROM state_entries
          WHERE scope = ?
          ORDER BY state_key ASC
        `,
      )
      .all(scope) as EntryRow[];

    return rows.map((row) => ({
      ...row,
      value: parseStateValue(row.value),
    }));
  } finally {
    db.close();
  }
}

export function listOpenTensions(scope: string): StateTension[] {
  const db = openDatabase();

  try {
    return db
      .prepare(
        `
          SELECT
            id,
            scope,
            state_key,
            title,
            description,
            status,
            severity,
            source_agent_id,
            source_session_id,
            created_at,
            resolved_at
          FROM state_tensions
          WHERE scope = ? AND status = 'open'
          ORDER BY severity DESC, created_at ASC, id ASC
        `,
      )
      .all(scope) as StateTension[];
  } finally {
    db.close();
  }
}

export function listStateTransitions(scope: string): StateTransition[] {
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            id,
            state_key,
            before_value,
            after_value,
            temporal_scope,
            valid_from,
            valid_until,
            stability,
            change_type,
            source_agent_id,
            source_session_id,
            reason,
            committed_at
          FROM state_transitions
          WHERE scope = ?
          ORDER BY state_key ASC, committed_at ASC, id ASC
        `,
      )
      .all(scope) as TransitionRow[];

    return rows.map((row) => ({
      ...row,
      before_value: parseStateValue(row.before_value),
      after_value: parseStateValue(row.after_value),
    }));
  } finally {
    db.close();
  }
}

export function groupEntriesForSnapshot(entries: StateEntry[]) {
  return {
    active_state: entries.filter(isActiveState),
    future_state: entries.filter(isFutureState),
    deprecated_state: entries.filter(isDeprecatedState),
    completed_state: entries.filter(isCompletedState),
  };
}

export function groupTransitionsByStateKey(transitions: StateTransition[]) {
  return transitions.reduce<Record<string, StateTransition[]>>(
    (grouped, transition) => {
      grouped[transition.state_key] ??= [];
      grouped[transition.state_key].push(transition);
      return grouped;
    },
    {},
  );
}

function isFutureState(entry: StateEntry) {
  return (
    entry.temporal_scope === "future_phase" ||
    entry.change_type === "future_intent" ||
    isFutureDate(entry.valid_from)
  );
}

function isDeprecatedState(entry: StateEntry) {
  return entry.stability === "deprecated" || entry.change_type === "deprecation";
}

function isCompletedState(entry: StateEntry) {
  return entry.stability === "completed" || entry.change_type === "completion";
}

function isActiveState(entry: StateEntry) {
  return (
    !isFutureState(entry) &&
    !isDeprecatedState(entry) &&
    !isCompletedState(entry)
  );
}

function isFutureDate(value: string | null) {
  if (!value) {
    return false;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) && time > Date.now();
}
