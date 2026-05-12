import Database from "better-sqlite3";
import {
  scoreCandidateProposal,
  type ConsolidationStatus,
} from "@/lib/runtime/candidate-scoring";
import proposalScoringSchema from "@/lib/db/proposal-scoring-schema.json";
import { randomUUID } from "node:crypto";
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
  scope?: string;
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

export type ActionRecord = {
  id: string;
  scope: string;
  state_key: string | null;
  title: string;
  description: string | null;
  status: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  created_at: string;
  completed_at: string | null;
};

export type CompletedStateInput = {
  scope: string;
  state_key: string;
  before_value?: StateValue;
  after_value: StateValue;
  temporal_scope: string;
  stability: string;
  change_type: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  source_proposal_id?: string | null;
  reason: string | null;
  committed_at?: string;
};

export type ActionRecordInput = {
  id?: string;
  scope: string;
  state_key?: string | null;
  title: string;
  description?: string | null;
  status?:
    | "pending"
    | "completed"
    | "failed"
    | "blocked"
    | "partial"
    | "needs_review";
  source_agent_id?: string | null;
  source_session_id?: string | null;
  created_at?: string;
  completed_at?: string | null;
};

export type AgentRecord = {
  id: string;
  name: string;
  kind: string;
};

export type SessionRecord = {
  id: string;
  agent_id: string | null;
  scope: string;
  title: string;
};

export type MessageRecord = {
  id: string;
  session_id: string;
  agent_id: string | null;
  role: string;
  content: string;
  created_at: string;
};

export type PendingStateDeltaProposalInput = {
  id: string;
  scope: string;
  state_key: string;
  before_value: StateValue;
  after_value: StateValue;
  operation: string;
  temporal_scope: string;
  valid_from: string | null;
  valid_until: string | null;
  stability: string;
  change_type: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  reason: string | null;
  proposed_at: string;
};

export type StateDeltaProposalScoring = {
  prediction_error_score: number;
  salience_score: number;
  evidence_score: number;
  conflict_score: number;
  self_impact_score: number;
  consolidation_status: ConsolidationStatus;
  reinforcement_count: number;
  expires_at: string | null;
  last_evaluated_at: string | null;
  scoring_version: string;
  scoring_reason: string | null;
  score_breakdown: StateValue;
};

export type StateDeltaProposalScoringUpdate = StateDeltaProposalScoring & {
  id: string;
};

export type StateDeltaProposal = PendingStateDeltaProposalInput & {
  status: "pending" | "committed" | "rejected";
  decided_at: string | null;
} & StateDeltaProposalScoring;

type EntryRow = Omit<StateEntry, "value"> & {
  value: string;
};

type TransitionRow = Omit<StateTransition, "before_value" | "after_value"> & {
  before_value: string | null;
  after_value: string;
};

type ActionRecordRow = ActionRecord;

type ProposalRow = Omit<
  StateDeltaProposal,
  "before_value" | "after_value" | "score_breakdown"
> & {
  before_value: string | null;
  after_value: string;
  score_breakdown: string | null;
};

type ProposalCommitResult = {
  proposal: StateDeltaProposal;
  entry: StateEntry;
  transition: StateTransition;
  tension: StateTension | null;
};

export function getDatabasePath() {
  return process.env.AUGNES_DB_PATH ?? DEFAULT_DB_PATH;
}

export function openDatabase() {
  const dbPath = getDatabasePath();
  mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath, { fileMustExist: false });
  db.pragma("foreign_keys = ON");
  migrateStateDeltaProposalScoringColumns(db);
  migrateDeliveryExternalArtifactColumns(db);
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

export function serializeStateValue(value: StateValue) {
  return JSON.stringify(value);
}

export function ensureAgent(agent: AgentRecord) {
  const db = openDatabase();

  try {
    db.prepare(
      `
        INSERT INTO agents (id, name, kind)
        VALUES (@id, @name, @kind)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          kind = excluded.kind
      `,
    ).run(agent);
  } finally {
    db.close();
  }
}

export function ensureSession(session: SessionRecord) {
  const db = openDatabase();

  try {
    db.prepare(
      `
        INSERT INTO sessions (id, agent_id, scope, title)
        VALUES (@id, @agent_id, @scope, @title)
        ON CONFLICT(id) DO UPDATE SET
          agent_id = excluded.agent_id,
          scope = excluded.scope,
          title = excluded.title
      `,
    ).run(session);
  } finally {
    db.close();
  }
}

export function insertMessage(message: MessageRecord) {
  const db = openDatabase();

  try {
    db.prepare(
      `
        INSERT INTO messages (
          id,
          session_id,
          agent_id,
          role,
          content,
          created_at
        )
        VALUES (
          @id,
          @session_id,
          @agent_id,
          @role,
          @content,
          @created_at
        )
      `,
    ).run(message);
  } finally {
    db.close();
  }
}

export function insertPendingStateDeltaProposals(
  proposals: PendingStateDeltaProposalInput[],
  options: { currentState?: StateEntry[]; now?: string } = {},
) {
  if (proposals.length === 0) {
    return [];
  }

  const db = openDatabase();

  try {
    const evaluatedAt = options.now ?? proposals[0]?.proposed_at ?? new Date().toISOString();
    const currentStateByScope = new Map<string, StateEntry[]>();
    const getCurrentState = (scope: string) => {
      const scopedOptionState =
        options.currentState?.filter((entry) => entry.scope === scope) ?? null;

      if (scopedOptionState && scopedOptionState.length > 0) {
        return scopedOptionState;
      }

      if (!currentStateByScope.has(scope)) {
        currentStateByScope.set(
          scope,
          selectStateEntryRows(db, scope).map(parseEntryRow),
        );
      }

      return currentStateByScope.get(scope) ?? [];
    };
    const insert = db.prepare(
      `
        INSERT INTO state_delta_proposals (
          id,
          scope,
          state_key,
          before_value,
          after_value,
          operation,
          temporal_scope,
          valid_from,
          valid_until,
          stability,
          change_type,
          source_agent_id,
          source_session_id,
          reason,
          status,
          proposed_at,
          decided_at,
          prediction_error_score,
          salience_score,
          evidence_score,
          conflict_score,
          self_impact_score,
          consolidation_status,
          reinforcement_count,
          expires_at,
          last_evaluated_at,
          scoring_version,
          scoring_reason,
          score_breakdown
        )
        VALUES (
          @id,
          @scope,
          @state_key,
          @before_value,
          @after_value,
          @operation,
          @temporal_scope,
          @valid_from,
          @valid_until,
          @stability,
          @change_type,
          @source_agent_id,
          @source_session_id,
          @reason,
          'pending',
          @proposed_at,
          NULL,
          @prediction_error_score,
          @salience_score,
          @evidence_score,
          @conflict_score,
          @self_impact_score,
          @consolidation_status,
          @reinforcement_count,
          @expires_at,
          @last_evaluated_at,
          @scoring_version,
          @scoring_reason,
          @score_breakdown
        )
      `,
    );

    const savedRows = db.transaction(() => {
      for (const proposal of proposals) {
        const scoring = scoreCandidateProposal({
          proposal,
          currentState: getCurrentState(proposal.scope),
          now: evaluatedAt,
        });
        insert.run({
          ...proposal,
          ...scoring,
          before_value: serializeStateValue(proposal.before_value),
          after_value: serializeStateValue(proposal.after_value),
          score_breakdown: serializeStateValue(scoring.score_breakdown),
        });
      }

      return db
        .prepare(
          `
            SELECT
              id,
              scope,
              state_key,
              before_value,
              after_value,
              operation,
              temporal_scope,
              valid_from,
              valid_until,
              stability,
              change_type,
              source_agent_id,
              source_session_id,
              reason,
              status,
              proposed_at,
              decided_at,
              prediction_error_score,
              salience_score,
              evidence_score,
              conflict_score,
              self_impact_score,
              consolidation_status,
              reinforcement_count,
              expires_at,
              last_evaluated_at,
              scoring_version,
              scoring_reason,
              score_breakdown
            FROM state_delta_proposals
            WHERE id IN (${proposals.map(() => "?").join(", ")})
            ORDER BY proposed_at ASC, id ASC
          `,
        )
        .all(...proposals.map((proposal) => proposal.id)) as ProposalRow[];
    })();

    return savedRows.map(parseProposalRow);
  } finally {
    db.close();
  }
}

export function listStateDeltaProposals({
  scope,
  status,
  consolidation_status,
  include_expired = false,
}: {
  scope: string;
  status?: StateDeltaProposal["status"];
  consolidation_status?: ConsolidationStatus;
  include_expired?: boolean;
}) {
  const db = openDatabase();

  try {
    const params: string[] = [scope];
    let statusClause = "";
    let consolidationStatusClause = "";
    let expiredClause = "";

    if (status) {
      statusClause = "AND status = ?";
      params.push(status);
    }

    if (consolidation_status) {
      consolidationStatusClause = "AND consolidation_status = ?";
      params.push(consolidation_status);
    }

    if (!include_expired && consolidation_status !== "expired") {
      expiredClause = "AND consolidation_status != 'expired'";
    }

    const rows = db
      .prepare(
        `
          SELECT
            id,
            scope,
            state_key,
            before_value,
            after_value,
            operation,
            temporal_scope,
            valid_from,
            valid_until,
            stability,
            change_type,
            source_agent_id,
            source_session_id,
            reason,
            status,
            proposed_at,
            decided_at,
            prediction_error_score,
            salience_score,
            evidence_score,
            conflict_score,
            self_impact_score,
            consolidation_status,
            reinforcement_count,
            expires_at,
            last_evaluated_at,
            scoring_version,
            scoring_reason,
            score_breakdown
          FROM state_delta_proposals
          WHERE scope = ?
          ${statusClause}
          ${consolidationStatusClause}
          ${expiredClause}
          ORDER BY proposed_at DESC, id ASC
        `,
      )
      .all(...params) as ProposalRow[];

    return rows.map(parseProposalRow);
  } finally {
    db.close();
  }
}

export function updateStateDeltaProposalScoring(
  updates: StateDeltaProposalScoringUpdate[],
) {
  if (updates.length === 0) {
    return [];
  }

  const db = openDatabase();

  try {
    const update = db.prepare(
      `
        UPDATE state_delta_proposals
        SET
          prediction_error_score = @prediction_error_score,
          salience_score = @salience_score,
          evidence_score = @evidence_score,
          conflict_score = @conflict_score,
          self_impact_score = @self_impact_score,
          consolidation_status = @consolidation_status,
          reinforcement_count = @reinforcement_count,
          expires_at = @expires_at,
          last_evaluated_at = @last_evaluated_at,
          scoring_version = @scoring_version,
          scoring_reason = @scoring_reason,
          score_breakdown = @score_breakdown
        WHERE id = @id
      `,
    );

    const rows = db.transaction(() => {
      for (const scoringUpdate of updates) {
        update.run({
          ...scoringUpdate,
          score_breakdown: serializeStateValue(scoringUpdate.score_breakdown),
        });
      }

      return db
        .prepare(
          `
            SELECT
              id,
              scope,
              state_key,
              before_value,
              after_value,
              operation,
              temporal_scope,
              valid_from,
              valid_until,
              stability,
              change_type,
              source_agent_id,
              source_session_id,
              reason,
              status,
              proposed_at,
              decided_at,
              prediction_error_score,
              salience_score,
              evidence_score,
              conflict_score,
              self_impact_score,
              consolidation_status,
              reinforcement_count,
              expires_at,
              last_evaluated_at,
              scoring_version,
              scoring_reason,
              score_breakdown
            FROM state_delta_proposals
            WHERE id IN (${updates.map(() => "?").join(", ")})
            ORDER BY proposed_at DESC, id ASC
          `,
        )
        .all(...updates.map((update) => update.id)) as ProposalRow[];
    })();

    return rows.map(parseProposalRow);
  } finally {
    db.close();
  }
}

export function commitStateDeltaProposal(id: string): ProposalCommitResult {
  const db = openDatabase();

  try {
    return db.transaction(() => {
      const proposalRow = selectProposalRow(db, id);

      if (!proposalRow) {
        throw new Error("Proposal not found.");
      }

      if (proposalRow.status !== "pending") {
        throw new Error(`Proposal is already ${proposalRow.status}.`);
      }

      const proposal = parseProposalRow(proposalRow);
      if (proposal.consolidation_status === "expired") {
        throw new Error("Expired proposals cannot be committed.");
      }

      const now = new Date().toISOString();
      const transitionId = `transition:${randomUUID()}`;
      const entryId = `entry:${proposal.scope}:${proposal.state_key}`;
      const currentEntryRow = db
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
            WHERE scope = ? AND state_key = ?
          `,
        )
        .get(proposal.scope, proposal.state_key) as EntryRow | undefined;
      const actualBeforeValue = currentEntryRow
        ? parseStateValue(currentEntryRow.value)
        : proposal.before_value;
      const beforeValue = serializeStateValue(actualBeforeValue);
      const afterValue = serializeStateValue(proposal.after_value);

      db.prepare(
        `
          INSERT INTO state_transitions (
            id,
            scope,
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
            source_proposal_id,
            reason,
            committed_at
          )
          VALUES (
            @id,
            @scope,
            @state_key,
            @before_value,
            @after_value,
            @temporal_scope,
            @valid_from,
            @valid_until,
            @stability,
            @change_type,
            @source_agent_id,
            @source_session_id,
            @source_proposal_id,
            @reason,
            @committed_at
          )
        `,
      ).run({
        id: transitionId,
        scope: proposal.scope,
        state_key: proposal.state_key,
        before_value: beforeValue,
        after_value: afterValue,
        temporal_scope: proposal.temporal_scope,
        valid_from: proposal.valid_from,
        valid_until: proposal.valid_until,
        stability: proposal.stability,
        change_type: proposal.change_type,
        source_agent_id: proposal.source_agent_id,
        source_session_id: proposal.source_session_id,
        source_proposal_id: proposal.id,
        reason: proposal.reason,
        committed_at: now,
      });

      db.prepare(
        `
          INSERT INTO state_entries (
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
          )
          VALUES (
            @id,
            @scope,
            @state_key,
            @value,
            @temporal_scope,
            @valid_from,
            @valid_until,
            @stability,
            @change_type,
            @source_agent_id,
            @source_session_id,
            @source_transition_id,
            @created_at,
            @updated_at
          )
          ON CONFLICT(scope, state_key) DO UPDATE SET
            value = excluded.value,
            temporal_scope = excluded.temporal_scope,
            valid_from = excluded.valid_from,
            valid_until = excluded.valid_until,
            stability = excluded.stability,
            change_type = excluded.change_type,
            source_agent_id = excluded.source_agent_id,
            source_session_id = excluded.source_session_id,
            source_transition_id = excluded.source_transition_id,
            updated_at = excluded.updated_at
        `,
      ).run({
        id: entryId,
        scope: proposal.scope,
        state_key: proposal.state_key,
        value: afterValue,
        temporal_scope: proposal.temporal_scope,
        valid_from: proposal.valid_from,
        valid_until: proposal.valid_until,
        stability: proposal.stability,
        change_type: proposal.change_type,
        source_agent_id: proposal.source_agent_id,
        source_session_id: proposal.source_session_id,
        source_transition_id: transitionId,
        created_at: now,
        updated_at: now,
      });

      db.prepare(
        `
          UPDATE state_delta_proposals
          SET status = 'committed',
              consolidation_status = 'committed',
              last_evaluated_at = ?,
              decided_at = ?
          WHERE id = ?
        `,
      ).run(now, now, proposal.id);

      const tension = maybeInsertContradictionTension({
        db,
        proposal,
        currentEntryRow,
        actualBeforeValue,
        now,
      });
      const committedProposal = parseProposalRow(
        selectProposalRow(db, proposal.id) as ProposalRow,
      );
      const entry = parseEntryRow(
        db
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
              WHERE scope = ? AND state_key = ?
            `,
          )
          .get(proposal.scope, proposal.state_key) as EntryRow,
      );
      const transition = parseTransitionRow(
        db
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
              WHERE id = ?
            `,
          )
          .get(transitionId) as TransitionRow,
      );

      return {
        proposal: committedProposal,
        entry,
        transition,
        tension,
      };
    })();
  } finally {
    db.close();
  }
}

export function rejectStateDeltaProposal(id: string) {
  const db = openDatabase();

  try {
    return db.transaction(() => {
      const proposalRow = selectProposalRow(db, id);

      if (!proposalRow) {
        throw new Error("Proposal not found.");
      }

      if (proposalRow.status !== "pending") {
        throw new Error(`Proposal is already ${proposalRow.status}.`);
      }

      const now = new Date().toISOString();
      db.prepare(
        `
          UPDATE state_delta_proposals
          SET status = 'rejected',
              consolidation_status = 'rejected',
              last_evaluated_at = ?,
              decided_at = ?
          WHERE id = ?
        `,
      ).run(now, now, id);

      return parseProposalRow(selectProposalRow(db, id) as ProposalRow);
    })();
  } finally {
    db.close();
  }
}

export function insertActionRecord(input: ActionRecordInput) {
  const db = openDatabase();
  const now = new Date().toISOString();
  const row = {
    id: input.id ?? `action:${randomUUID()}`,
    scope: input.scope,
    state_key: input.state_key ?? null,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? "completed",
    source_agent_id: input.source_agent_id ?? null,
    source_session_id: input.source_session_id ?? null,
    created_at: input.created_at ?? now,
    completed_at:
      input.completed_at === undefined
        ? input.status === "pending"
          ? null
          : now
        : input.completed_at,
  };

  try {
    db.prepare(
      `
        INSERT INTO action_records (
          id,
          scope,
          state_key,
          title,
          description,
          status,
          source_agent_id,
          source_session_id,
          created_at,
          completed_at
        )
        VALUES (
          @id,
          @scope,
          @state_key,
          @title,
          @description,
          @status,
          @source_agent_id,
          @source_session_id,
          @created_at,
          @completed_at
        )
      `,
    ).run(row);

    return row;
  } finally {
    db.close();
  }
}

export function listActionRecords(scope: string) {
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
            source_agent_id,
            source_session_id,
            created_at,
            completed_at
          FROM action_records
          WHERE scope = ?
          ORDER BY created_at DESC, id ASC
        `,
      )
      .all(scope) as ActionRecordRow[];
  } finally {
    db.close();
  }
}

export function commitStateUpdate(input: CompletedStateInput) {
  const db = openDatabase();

  try {
    return db.transaction(() => {
      const now = input.committed_at ?? new Date().toISOString();
      const currentEntryRow = db
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
            WHERE scope = ? AND state_key = ?
          `,
        )
        .get(input.scope, input.state_key) as EntryRow | undefined;
      const beforeValue = serializeStateValue(
        currentEntryRow ? parseStateValue(currentEntryRow.value) : input.before_value ?? null,
      );
      const afterValue = serializeStateValue(input.after_value);
      const transitionId = `transition:${randomUUID()}`;
      const entryId = `entry:${input.scope}:${input.state_key}`;

      db.prepare(
        `
          INSERT INTO state_transitions (
            id,
            scope,
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
            source_proposal_id,
            reason,
            committed_at
          )
          VALUES (
            @id,
            @scope,
            @state_key,
            @before_value,
            @after_value,
            @temporal_scope,
            NULL,
            NULL,
            @stability,
            @change_type,
            @source_agent_id,
            @source_session_id,
            @source_proposal_id,
            @reason,
            @committed_at
          )
        `,
      ).run({
        id: transitionId,
        scope: input.scope,
        state_key: input.state_key,
        before_value: beforeValue,
        after_value: afterValue,
        temporal_scope: input.temporal_scope,
        stability: input.stability,
        change_type: input.change_type,
        source_agent_id: input.source_agent_id,
        source_session_id: input.source_session_id,
        source_proposal_id: input.source_proposal_id ?? null,
        reason: input.reason,
        committed_at: now,
      });

      db.prepare(
        `
          INSERT INTO state_entries (
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
          )
          VALUES (
            @id,
            @scope,
            @state_key,
            @value,
            @temporal_scope,
            NULL,
            NULL,
            @stability,
            @change_type,
            @source_agent_id,
            @source_session_id,
            @source_transition_id,
            @created_at,
            @updated_at
          )
          ON CONFLICT(scope, state_key) DO UPDATE SET
            value = excluded.value,
            temporal_scope = excluded.temporal_scope,
            valid_from = excluded.valid_from,
            valid_until = excluded.valid_until,
            stability = excluded.stability,
            change_type = excluded.change_type,
            source_agent_id = excluded.source_agent_id,
            source_session_id = excluded.source_session_id,
            source_transition_id = excluded.source_transition_id,
            updated_at = excluded.updated_at
        `,
      ).run({
        id: entryId,
        scope: input.scope,
        state_key: input.state_key,
        value: afterValue,
        temporal_scope: input.temporal_scope,
        stability: input.stability,
        change_type: input.change_type,
        source_agent_id: input.source_agent_id,
        source_session_id: input.source_session_id,
        source_transition_id: transitionId,
        created_at: now,
        updated_at: now,
      });

      const entry = parseEntryRow(
        db
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
              WHERE scope = ? AND state_key = ?
            `,
          )
          .get(input.scope, input.state_key) as EntryRow,
      );
      const transition = parseTransitionRow(
        db
          .prepare(
            `
              SELECT
                id,
                scope,
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
              WHERE id = ?
            `,
          )
          .get(transitionId) as TransitionRow,
      );

      return { entry, transition };
    })();
  } finally {
    db.close();
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

    return rows.map(parseEntryRow);
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
            scope,
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

    return rows.map(parseTransitionRow);
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

function parseProposalRow(row: ProposalRow): StateDeltaProposal {
  return {
    ...row,
    status: row.status as StateDeltaProposal["status"],
    consolidation_status: row.consolidation_status as ConsolidationStatus,
    before_value: parseStateValue(row.before_value),
    after_value: parseStateValue(row.after_value),
    score_breakdown: parseStateValue(row.score_breakdown),
  };
}

function parseEntryRow(row: EntryRow): StateEntry {
  return {
    ...row,
    value: parseStateValue(row.value),
  };
}

function parseTransitionRow(row: TransitionRow): StateTransition {
  return {
    ...row,
    before_value: parseStateValue(row.before_value),
    after_value: parseStateValue(row.after_value),
  };
}

function selectProposalRow(db: Database.Database, id: string) {
  return db
    .prepare(
      `
        SELECT
          id,
          scope,
          state_key,
          before_value,
          after_value,
          operation,
          temporal_scope,
          valid_from,
          valid_until,
          stability,
          change_type,
          source_agent_id,
          source_session_id,
          reason,
          status,
          proposed_at,
          decided_at,
          prediction_error_score,
          salience_score,
          evidence_score,
          conflict_score,
          self_impact_score,
          consolidation_status,
          reinforcement_count,
          expires_at,
          last_evaluated_at,
          scoring_version,
          scoring_reason,
          score_breakdown
        FROM state_delta_proposals
        WHERE id = ?
      `,
    )
    .get(id) as ProposalRow | undefined;
}

function selectStateEntryRows(db: Database.Database, scope: string) {
  return db
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
}

function migrateStateDeltaProposalScoringColumns(db: Database.Database) {
  const table = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'state_delta_proposals'
      `,
    )
    .get();

  if (!table) {
    return;
  }

  const existingColumns = new Set(
    (
      db.prepare("PRAGMA table_info(state_delta_proposals)").all() as {
        name: string;
      }[]
    ).map((column) => column.name),
  );

  for (const { name, definition } of proposalScoringSchema.columns) {
    if (!existingColumns.has(name)) {
      db.prepare(
        `ALTER TABLE state_delta_proposals ADD COLUMN ${name} ${definition}`,
      ).run();
    }
  }

  for (const { sql } of proposalScoringSchema.indexes) {
    db.prepare(sql).run();
  }
}

function migrateDeliveryExternalArtifactColumns(db: Database.Database) {
  const table = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'delivery_ledger'
      `,
    )
    .get();

  if (!table) {
    return;
  }

  const existingColumns = new Set(
    (
      db.prepare("PRAGMA table_info(delivery_ledger)").all() as {
        name: string;
      }[]
    ).map((column) => column.name),
  );
  const columns = [
    "external_artifact_id",
    "external_artifact_url",
    "external_artifact_type",
  ];

  for (const column of columns) {
    if (!existingColumns.has(column)) {
      db.prepare(`ALTER TABLE delivery_ledger ADD COLUMN ${column} TEXT`).run();
    }
  }
}

function maybeInsertContradictionTension({
  db,
  proposal,
  currentEntryRow,
  actualBeforeValue,
  now,
}: {
  db: Database.Database;
  proposal: StateDeltaProposal;
  currentEntryRow: EntryRow | undefined;
  actualBeforeValue: StateValue;
  now: string;
}) {
  const currentEntry = currentEntryRow ? parseEntryRow(currentEntryRow) : null;
  const hasActiveCurrentEntry =
    currentEntry !== null && isActiveState(currentEntry);
  const hasStaleBefore =
    serializeStateValue(actualBeforeValue) !==
    serializeStateValue(proposal.before_value);
  const hasActiveContradiction =
    hasActiveCurrentEntry &&
    serializeStateValue(currentEntry.value) !==
      serializeStateValue(proposal.after_value);

  if (
    !hasActiveCurrentEntry ||
    proposal.temporal_scope === "future_phase" ||
    proposal.change_type === "future_intent" ||
    (!hasActiveContradiction && !hasStaleBefore)
  ) {
    return null;
  }

  const tensionId = `tension:${randomUUID()}`;
  const title = hasActiveContradiction
    ? `Active contradiction committed for ${proposal.state_key}`
    : `Stale proposal committed for ${proposal.state_key}`;
  const description = hasActiveContradiction
    ? "The committed proposal differs from the existing active state for the same key."
    : "The proposal was based on an older before_value than the current committed state at commit time.";

  db.prepare(
    `
      INSERT INTO state_tensions (
        id,
        scope,
        state_key,
        title,
        description,
        status,
        severity,
        source_agent_id,
        source_session_id,
        created_at
      )
      VALUES (
        @id,
        @scope,
        @state_key,
        @title,
        @description,
        'open',
        'medium',
        @source_agent_id,
        @source_session_id,
        @created_at
      )
    `,
  ).run({
    id: tensionId,
    scope: proposal.scope,
    state_key: proposal.state_key,
    title,
    description,
    source_agent_id: proposal.source_agent_id,
    source_session_id: proposal.source_session_id,
    created_at: now,
  });

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
        WHERE id = ?
      `,
    )
    .get(tensionId) as StateTension;
}
