import Database from "better-sqlite3";
import {
  scoreCandidateProposal,
  type ConsolidationStatus,
} from "@/lib/runtime/candidate-scoring";
import proposalScoringSchema from "@/lib/db/proposal-scoring-schema.json";
import {
  createRecoveryPrivateMaterialReadBoundary,
  isRecoveryPrivateMaterialExcludedFromAuthoritativeRead,
  projectRecoveryPrivateMaterialStateEntryForAuthoritativeRead,
  RECOVERY_PRIVATE_MATERIAL_MARKER,
} from "@/lib/db/recovery-private-material-contract.mjs";
import {
  ensureVNextProjectIdentityRegistrySchemaV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { ensureVNextProjectLifecycleSchemaV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { ensureVNextProjectControlSchemaV01 } from "@/lib/vnext/persistence/project-control-store";
import { ensureVNextDurableSemanticStoreSchemaV01 } from "@/lib/vnext/persistence/durable-semantic-store";
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
  started_at?: string;
  ended_at?: string | null;
  surface?: string | null;
  actor?: string | null;
  related_work_id?: string | null;
  related_pr?: string | null;
  summary?: string | null;
  handoff_ref?: string | null;
  evidence_pack_ref?: string | null;
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
  const guardedBuildDefaultPath =
    process.env.AUGNES_BUILD_ISOLATION === "1"
      ? process.env.AUGNES_BUILD_DEFAULT_DB_GUARD_PATH
      : undefined;
  return (
    process.env.AUGNES_DB_PATH ?? guardedBuildDefaultPath ?? DEFAULT_DB_PATH
  );
}

export function openDatabase() {
  const dbPath = getDatabasePath();
  mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath, { fileMustExist: false });
  db.pragma("foreign_keys = ON");
  migrateStateDeltaProposalScoringColumns(db);
  migrateSessionBindingColumns(db);
  migrateDeliveryExternalArtifactColumns(db);
  migrateVerificationEvidenceRecordsTable(db);
  migrateTemporalPreviewReviewArtifactsTable(db);
  migrateTemporalPreviewReviewArtifactIdempotencyTable(db);
  migrateResearchCandidateManualNotePreviewDraftsTable(db);
  migrateResearchCandidateManualNotePreviewDraftDiscardsTable(db);
  migrateResearchCandidateManualNotePreviewDraftActivitiesTable(db);
  migrateResearchCandidateManualResultRecordsTables(db);
  migrateResearchCandidateManualGlobalDogfoodLedgerTables(db);
  migrateResearchCandidateManualGlobalDogfoodMetricSnapshotTables(db);
  migrateResearchCandidateManualGlobalDogfoodNextWorkSignalTables(db);
  migrateResearchCandidateManualGlobalDogfoodNextWorkBiasTables(db);
  migrateResearchCandidateManualGlobalDogfoodPerspectiveRelayTables(db);
  migrateResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateTables(db);
  migrateResearchCandidateManualGlobalDogfoodPerspectiveApplyTables(db);
  migrateResearchCandidateManualGlobalDogfoodPerspectiveStateMutationTables(db);
  migrateResearchCandidateManualGlobalDogfoodPerspectiveAdapterTables(db);
  migrateResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationTables(db);
  migrateResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityTables(db);
  migrateResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordTable(db);
  migrateAutonomyDelegationGrantTable(db);
  migrateAutohuntWorkQueueCandidateTable(db);
  migrateAutohuntPreflightPacketTable(db);
  migrateAutohuntHandoffPlanPreviewTable(db);
  migrateAutohuntHandoffPlanOperatorReviewDecisionTable(db);
  migrateAutohuntSupervisedExecutionContractTable(db);
  migrateAutohuntResultIntakeTable(db);
  migrateAutohuntDailyLauncherRunTable(db);
  migratePerspectiveMemoryProductPersistenceBoundaryRecordsTable(db);
  migratePerspectiveMemoryItemsTable(db);
  ensureVNextDurableSemanticStoreSchemaV01(db);
  ensureVNextProjectIdentityRegistrySchemaV01(db);
  ensureVNextProjectLifecycleSchemaV01(db);
  ensureVNextProjectControlSchemaV01(db);
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
    ).run({
      ...message,
      content: RECOVERY_PRIVATE_MATERIAL_MARKER,
    });
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

    return filterAuthoritativeRows(
      db,
      "state_delta_proposals",
      savedRows,
    ).map(parseProposalRow);
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

    return filterAuthoritativeRows(
      db,
      "state_delta_proposals",
      rows,
      scope,
    ).map(parseProposalRow);
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

    return filterAuthoritativeRows(
      db,
      "state_delta_proposals",
      rows,
    ).map(parseProposalRow);
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
      const currentEntryRow = selectStateEntryRow(
        db,
        proposal.scope,
        proposal.state_key,
      );
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
      const currentEntryRow = selectStateEntryRow(
        db,
        input.scope,
        input.state_key,
      );
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
    return selectStateEntryRows(db, scope).map(parseEntryRow);
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

    return filterAuthoritativeRows(
      db,
      "state_transitions",
      rows,
      scope,
    ).map(parseTransitionRow);
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
  const row = db
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
  if (!row) return undefined;
  return filterAuthoritativeRows(
    db,
    "state_delta_proposals",
    [row],
    row.scope,
  )[0];
}

function selectStateEntryRows(db: Database.Database, scope: string) {
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
  return projectAuthoritativeStateEntryRows(db, rows, scope);
}

function selectStateEntryRow(
  db: Database.Database,
  scope: string,
  stateKey: string,
) {
  const row = db
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
    .get(scope, stateKey) as EntryRow | undefined;
  if (!row) return undefined;
  return projectAuthoritativeStateEntryRows(db, [row], scope)[0];
}

function projectAuthoritativeStateEntryRows(
  db: Database.Database,
  rows: EntryRow[],
  scope: string,
) {
  const boundary = createRecoveryPrivateMaterialReadBoundary(db, { scope });
  return rows
    .map((row) =>
      projectRecoveryPrivateMaterialStateEntryForAuthoritativeRead(
        row,
        boundary,
      ),
    )
    .filter((row): row is EntryRow => row !== null);
}

function filterAuthoritativeRows<Row extends { id: string }>(
  db: Database.Database,
  tableName:
    | "state_delta_proposals"
    | "state_transitions",
  rows: Row[],
  scope?: string,
) {
  const boundary = createRecoveryPrivateMaterialReadBoundary(db, {
    scope: scope ?? null,
  });
  return rows.filter(
    (row) =>
      !isRecoveryPrivateMaterialExcludedFromAuthoritativeRead(
        tableName,
        row,
        boundary,
      ),
  );
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

function migrateSessionBindingColumns(db: Database.Database) {
  const table = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'sessions'
      `,
    )
    .get();

  if (!table) {
    return;
  }

  const existingColumns = new Set(
    (
      db.prepare("PRAGMA table_info(sessions)").all() as {
        name: string;
      }[]
    ).map((column) => column.name),
  );
  const columns = [
    {
      name: "surface",
      definition:
        "TEXT CHECK (surface IS NULL OR surface IN ('chatgpt', 'codex', 'cockpit', 'browser', 'github', 'local_runtime', 'other'))",
    },
    { name: "actor", definition: "TEXT" },
    { name: "related_work_id", definition: "TEXT" },
    { name: "related_pr", definition: "TEXT" },
    { name: "summary", definition: "TEXT" },
    { name: "handoff_ref", definition: "TEXT" },
    { name: "evidence_pack_ref", definition: "TEXT" },
  ];

  for (const { name, definition } of columns) {
    if (!existingColumns.has(name)) {
      db.prepare(`ALTER TABLE sessions ADD COLUMN ${name} ${definition}`).run();
    }
  }

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_sessions_scope_surface_time
        ON sessions(scope, surface, started_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_sessions_scope_work_time
        ON sessions(scope, related_work_id, started_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_sessions_scope_pr_time
        ON sessions(scope, related_pr, started_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateVerificationEvidenceRecordsTable(db: Database.Database) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS verification_evidence_records (
        evidence_id TEXT PRIMARY KEY,
        scope TEXT NOT NULL DEFAULT 'project:augnes',
        work_id TEXT,
        publication_id TEXT,
        delivery_id TEXT,
        target_surface TEXT,
        target_ref TEXT,
        evidence_kind TEXT NOT NULL CHECK (
          evidence_kind IN (
            'command_run',
            'check_passed',
            'check_failed',
            'check_skipped',
            'replay_observed',
            'duplicate_block_observed'
          )
        ),
        label TEXT NOT NULL,
        status TEXT NOT NULL CHECK (
          status IN (
            'passed',
            'failed',
            'skipped',
            'observed',
            'blocked',
            'needs_review'
          )
        ),
        command TEXT,
        result_summary TEXT NOT NULL,
        skipped_reason TEXT,
        observed_behavior TEXT,
        source_surface TEXT NOT NULL,
        source_ref TEXT,
        related_action_id TEXT,
        related_work_event_id TEXT,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        FOREIGN KEY (scope, work_id) REFERENCES work_items(scope, work_id),
        FOREIGN KEY (publication_id) REFERENCES publication_drafts(publication_id),
        FOREIGN KEY (delivery_id) REFERENCES delivery_ledger(delivery_id),
        FOREIGN KEY (related_action_id) REFERENCES action_records(id),
        FOREIGN KEY (related_work_event_id) REFERENCES work_events(id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_time
        ON verification_evidence_records(scope, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_work_time
        ON verification_evidence_records(scope, work_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_publication_time
        ON verification_evidence_records(scope, publication_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_delivery_time
        ON verification_evidence_records(scope, delivery_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_target_time
        ON verification_evidence_records(scope, target_surface, target_ref, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_kind_time
        ON verification_evidence_records(scope, evidence_kind, created_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateTemporalPreviewReviewArtifactsTable(db: Database.Database) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS temporal_preview_review_artifacts (
        artifact_id TEXT PRIMARY KEY,
        scope TEXT NOT NULL DEFAULT 'project:augnes',
        work_id TEXT NOT NULL,
        source_route TEXT NOT NULL,
        source_surface TEXT NOT NULL,
        source_ref TEXT,
        generator TEXT NOT NULL,
        model TEXT,
        as_of TEXT NOT NULL,
        capture_mode TEXT NOT NULL CHECK (
          capture_mode IN (
            'mock',
            'openai',
            'mock_fallback',
            'route_capture',
            'cockpit_capture'
          )
        ),
        preview_excerpt TEXT NOT NULL,
        bounded_preview_json TEXT NOT NULL,
        preview_hash TEXT,
        source_refs TEXT NOT NULL DEFAULT '[]',
        evidence_anchor_refs TEXT NOT NULL DEFAULT '[]',
        summary_refs TEXT NOT NULL DEFAULT '[]',
        counterexample_refs TEXT NOT NULL DEFAULT '[]',
        residual_tension_refs TEXT NOT NULL DEFAULT '[]',
        admission_decisions_json TEXT NOT NULL DEFAULT '[]',
        guardrail_passed INTEGER NOT NULL CHECK (guardrail_passed IN (0, 1)),
        guardrail_warnings_json TEXT NOT NULL DEFAULT '[]',
        reviewer_verdict TEXT NOT NULL CHECK (
          reviewer_verdict IN (
            'pass',
            'pass_with_notes',
            'fail',
            'not_reviewed'
          )
        ),
        reviewer_notes TEXT,
        manual_review_report_path TEXT,
        linked_evidence_record_ids TEXT NOT NULL DEFAULT '[]',
        linked_session_id TEXT,
        linked_pr_url TEXT,
        redaction_status TEXT NOT NULL CHECK (
          redaction_status IN (
            'redacted',
            'bounded',
            'raw_disallowed'
          )
        ),
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (scope, work_id) REFERENCES work_items(scope, work_id),
        FOREIGN KEY (linked_session_id) REFERENCES sessions(id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_work_time
        ON temporal_preview_review_artifacts(scope, work_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_generator_time
        ON temporal_preview_review_artifacts(scope, generator, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_verdict_time
        ON temporal_preview_review_artifacts(scope, reviewer_verdict, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_guardrail_time
        ON temporal_preview_review_artifacts(scope, guardrail_passed, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_session_time
        ON temporal_preview_review_artifacts(scope, linked_session_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_pr_time
        ON temporal_preview_review_artifacts(scope, linked_pr_url, created_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateTemporalPreviewReviewArtifactIdempotencyTable(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS temporal_preview_review_artifact_idempotency (
        idempotency_key_hash TEXT PRIMARY KEY,
        scope TEXT NOT NULL DEFAULT 'project:augnes',
        artifact_id TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        work_id TEXT NOT NULL,
        source_ref TEXT,
        preview_hash TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (artifact_id) REFERENCES temporal_preview_review_artifacts(artifact_id),
        FOREIGN KEY (scope, work_id) REFERENCES work_items(scope, work_id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifact_idem_scope_source_hash
        ON temporal_preview_review_artifact_idempotency(scope, work_id, source_ref, preview_hash)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifact_idem_scope_artifact
        ON temporal_preview_review_artifact_idempotency(scope, artifact_id)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateResearchCandidateManualNotePreviewDraftsTable(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_note_preview_drafts (
        preview_draft_id TEXT PRIMARY KEY,
        status TEXT NOT NULL CHECK (status IN ('preview_draft')),
        scope TEXT NOT NULL DEFAULT 'project:augnes' CHECK (scope IN ('project:augnes')),
        source_kind TEXT NOT NULL CHECK (source_kind IN ('manual_paste')),
        operator_note_label TEXT,
        parser_version TEXT NOT NULL,
        preview_version TEXT NOT NULL,
        input_fingerprint TEXT NOT NULL,
        manual_note_text_stored INTEGER NOT NULL DEFAULT 0 CHECK (manual_note_text_stored = 0),
        preview_json TEXT NOT NULL,
        warnings_json TEXT NOT NULL DEFAULT '[]',
        authority_json TEXT NOT NULL,
        runtime_boundary_json TEXT NOT NULL,
        no_side_effects_json TEXT NOT NULL,
        promoted_at TEXT CHECK (promoted_at IS NULL),
        canonical_perspective_id TEXT CHECK (canonical_perspective_id IS NULL),
        proof_id TEXT CHECK (proof_id IS NULL),
        evidence_id TEXT CHECK (evidence_id IS NULL),
        work_item_id TEXT CHECK (work_item_id IS NULL),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_scope_time
        ON research_candidate_manual_note_preview_drafts(scope, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_status_time
        ON research_candidate_manual_note_preview_drafts(status, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_input
        ON research_candidate_manual_note_preview_drafts(input_fingerprint)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_source
        ON research_candidate_manual_note_preview_drafts(source_kind, created_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateResearchCandidateManualNotePreviewDraftDiscardsTable(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_note_preview_draft_discards (
        discard_id TEXT PRIMARY KEY,
        preview_draft_id TEXT NOT NULL UNIQUE,
        scope TEXT NOT NULL DEFAULT 'project:augnes' CHECK (scope IN ('project:augnes')),
        discarded_at TEXT NOT NULL,
        discarded_by TEXT NOT NULL,
        discard_reason TEXT NOT NULL DEFAULT '',
        authority_json TEXT NOT NULL,
        no_side_effects_json TEXT NOT NULL,
        FOREIGN KEY (preview_draft_id) REFERENCES research_candidate_manual_note_preview_drafts(preview_draft_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_discards_scope_time
        ON research_candidate_manual_note_preview_draft_discards(scope, discarded_at DESC)
    `,
  ).run();
}

function migrateResearchCandidateManualNotePreviewDraftActivitiesTable(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_note_preview_draft_activities (
        activity_id TEXT PRIMARY KEY,
        preview_draft_id TEXT NOT NULL,
        scope TEXT NOT NULL DEFAULT 'project:augnes' CHECK (scope IN ('project:augnes')),
        activity_type TEXT NOT NULL CHECK (activity_type IN ('preview_draft_created', 'label_updated', 'label_cleared', 'preview_draft_discarded')),
        activity_at TEXT NOT NULL,
        activity_by TEXT NOT NULL,
        summary TEXT NOT NULL,
        before_json TEXT NOT NULL DEFAULT '{}',
        after_json TEXT NOT NULL DEFAULT '{}',
        authority_json TEXT NOT NULL,
        no_side_effects_json TEXT NOT NULL,
        FOREIGN KEY (preview_draft_id) REFERENCES research_candidate_manual_note_preview_drafts(preview_draft_id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_activities_draft_time
        ON research_candidate_manual_note_preview_draft_activities(preview_draft_id, activity_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_activities_scope_time
        ON research_candidate_manual_note_preview_draft_activities(scope, activity_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_activities_type_time
        ON research_candidate_manual_note_preview_draft_activities(activity_type, activity_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateResearchCandidateManualResultRecordsTables(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_result_write_receipts (
        receipt_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_preview_session_id TEXT NOT NULL,
        source_handoff_seed_fingerprint TEXT NOT NULL,
        source_result_intake_ref TEXT NOT NULL,
        source_result_intake_fingerprint TEXT NOT NULL,
        source_operator_review_ref TEXT NOT NULL,
        source_operator_review_fingerprint TEXT NOT NULL,
        source_record_contract_ref TEXT NOT NULL,
        source_record_contract_fingerprint TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        write_status TEXT NOT NULL CHECK (
          write_status IN (
            'committed',
            'duplicate_replayed',
            'superseded',
            'rolled_back'
          )
        ),
        operator_decision TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        receipt_fingerprint TEXT NOT NULL,
        supersedes_receipt_id TEXT,
        rollback_of_receipt_id TEXT,
        rollback_reason TEXT,
        FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id),
        FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_expected_observed_delta_records (
        record_id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        expected_summary TEXT NOT NULL,
        observed_summary TEXT,
        mismatch_or_gap_summary TEXT NOT NULL,
        source_handoff_seed_fingerprint TEXT NOT NULL,
        source_result_text_fingerprint TEXT NOT NULL,
        source_preview_session_id TEXT NOT NULL,
        source_refs_json TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        record_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_reuse_outcome_records (
        record_id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        outcome_label TEXT NOT NULL,
        selected_candidate_context_refs_json TEXT NOT NULL,
        source_line TEXT,
        warning_reasons_json TEXT NOT NULL,
        source_handoff_seed_fingerprint TEXT NOT NULL,
        source_result_text_fingerprint TEXT NOT NULL,
        source_preview_session_id TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        record_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_result_write_rollbacks (
        rollback_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        receipt_id TEXT NOT NULL,
        rollback_reason TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        rollback_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_receipts_scope_time
        ON research_candidate_manual_result_write_receipts(scope, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_receipts_seed
        ON research_candidate_manual_result_write_receipts(source_handoff_seed_fingerprint, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_receipts_status
        ON research_candidate_manual_result_write_receipts(scope, write_status, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_eod_records_receipt
        ON research_candidate_manual_expected_observed_delta_records(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_eod_records_scope_time
        ON research_candidate_manual_expected_observed_delta_records(scope, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_reuse_records_receipt
        ON research_candidate_manual_reuse_outcome_records(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_reuse_records_scope_time
        ON research_candidate_manual_reuse_outcome_records(scope, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_result_rollbacks_receipt
        ON research_candidate_manual_result_write_rollbacks(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_rollbacks_time
        ON research_candidate_manual_result_write_rollbacks(created_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateResearchCandidateManualGlobalDogfoodLedgerTables(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_ledger_receipts (
        receipt_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_contract_fingerprint TEXT NOT NULL,
        source_contract_ref TEXT NOT NULL,
        source_authorization_review_fingerprint TEXT NOT NULL,
        source_manual_receipt_id TEXT NOT NULL,
        source_bridge_preview_fingerprint TEXT NOT NULL,
        source_handoff_seed_fingerprint TEXT NOT NULL,
        source_result_text_fingerprint TEXT NOT NULL,
        source_expected_observed_delta_record_ref TEXT NOT NULL,
        source_reuse_outcome_record_ref TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        ledger_write_status TEXT NOT NULL CHECK (
          ledger_write_status IN (
            'committed',
            'duplicate_replayed',
            'superseded',
            'rolled_back'
          )
        ),
        authority_profile TEXT NOT NULL,
        receipt_fingerprint TEXT NOT NULL,
        supersedes_receipt_id TEXT,
        rollback_of_receipt_id TEXT,
        rollback_reason TEXT,
        FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_ledger_receipts(receipt_id),
        FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_ledger_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_ledger_records (
        ledger_record_id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_manual_receipt_id TEXT NOT NULL,
        source_handoff_seed_fingerprint TEXT NOT NULL,
        source_result_text_fingerprint TEXT NOT NULL,
        source_expected_observed_delta_record_ref TEXT NOT NULL,
        source_reuse_outcome_record_ref TEXT NOT NULL,
        outcome_label TEXT NOT NULL,
        selected_candidate_context_refs_json TEXT NOT NULL,
        expected_summary TEXT NOT NULL,
        observed_summary TEXT,
        mismatch_or_gap_summary TEXT NOT NULL,
        source_line TEXT,
        manual_only_context_refs_json TEXT NOT NULL,
        warning_reasons_json TEXT NOT NULL,
        compatibility_findings_json TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        ledger_record_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_ledger_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_ledger_rollbacks (
        rollback_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        receipt_id TEXT NOT NULL,
        rollback_reason TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        rollback_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_ledger_receipts(receipt_id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_scope_time
        ON research_candidate_manual_global_dogfood_ledger_receipts(scope, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_status
        ON research_candidate_manual_global_dogfood_ledger_receipts(scope, ledger_write_status, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_source_manual
        ON research_candidate_manual_global_dogfood_ledger_receipts(source_manual_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_contract
        ON research_candidate_manual_global_dogfood_ledger_receipts(source_contract_fingerprint, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_records_receipt
        ON research_candidate_manual_global_dogfood_ledger_records(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_records_scope_time
        ON research_candidate_manual_global_dogfood_ledger_records(scope, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_ledger_rollbacks(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_rollbacks_time
        ON research_candidate_manual_global_dogfood_ledger_rollbacks(created_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateResearchCandidateManualGlobalDogfoodMetricSnapshotTables(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_metric_snapshot_receipts (
        receipt_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_metric_contract_fingerprint TEXT NOT NULL,
        source_metric_review_fingerprint TEXT NOT NULL,
        source_projection_fingerprint TEXT NOT NULL,
        source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
        source_global_dogfood_ledger_record_id TEXT NOT NULL,
        source_manual_receipt_id TEXT NOT NULL,
        source_handoff_seed_fingerprint TEXT NOT NULL,
        source_result_text_fingerprint TEXT NOT NULL,
        source_expected_observed_delta_record_ref TEXT NOT NULL,
        source_reuse_outcome_record_ref TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        write_status TEXT NOT NULL CHECK (
          write_status IN (
            'committed',
            'duplicate_replayed',
            'superseded',
            'rolled_back'
          )
        ),
        authority_profile TEXT NOT NULL,
        receipt_fingerprint TEXT NOT NULL,
        supersedes_receipt_id TEXT,
        rollback_of_receipt_id TEXT,
        rollback_reason TEXT,
        FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_metric_snapshot_receipts(receipt_id),
        FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_metric_snapshot_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_metric_snapshot_records (
        metric_snapshot_record_id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
        source_global_dogfood_ledger_record_id TEXT NOT NULL,
        source_projection_fingerprint TEXT NOT NULL,
        source_metric_contract_fingerprint TEXT NOT NULL,
        source_metric_review_fingerprint TEXT NOT NULL,
        outcome_label TEXT NOT NULL,
        outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
        proposed_metric_dimensions_json TEXT NOT NULL,
        proposed_metric_counters_json TEXT NOT NULL,
        proposed_metric_labels_json TEXT NOT NULL,
        selected_candidate_context_refs_json TEXT NOT NULL,
        expected_summary_present INTEGER NOT NULL,
        observed_summary_present INTEGER NOT NULL,
        mismatch_or_gap_present INTEGER NOT NULL,
        source_refs_json TEXT NOT NULL,
        manual_only_context_refs_json TEXT NOT NULL,
        warning_reasons_json TEXT NOT NULL,
        compatibility_findings_json TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        metric_snapshot_record_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_metric_snapshot_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_metric_snapshot_rollbacks (
        rollback_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        receipt_id TEXT NOT NULL,
        rollback_reason TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        rollback_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_metric_snapshot_receipts(receipt_id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_scope_time
        ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(scope, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_status
        ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(scope, write_status, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_source_projection
        ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(source_projection_fingerprint, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_source_ledger
        ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_records_receipt
        ON research_candidate_manual_global_dogfood_metric_snapshot_records(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_records_scope_time
        ON research_candidate_manual_global_dogfood_metric_snapshot_records(scope, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_metric_snapshot_rollbacks(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_rollbacks_time
        ON research_candidate_manual_global_dogfood_metric_snapshot_rollbacks(created_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateResearchCandidateManualGlobalDogfoodNextWorkSignalTables(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_signal_receipts (
        receipt_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_next_work_contract_fingerprint TEXT NOT NULL,
        source_next_work_review_fingerprint TEXT NOT NULL,
        source_projection_fingerprint TEXT NOT NULL,
        source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
        source_global_dogfood_ledger_record_id TEXT NOT NULL,
        source_metric_snapshot_receipt_id TEXT NOT NULL,
        source_metric_snapshot_record_id TEXT NOT NULL,
        source_manual_receipt_id TEXT NOT NULL,
        source_handoff_seed_fingerprint TEXT NOT NULL,
        source_result_text_fingerprint TEXT NOT NULL,
        source_expected_observed_delta_record_ref TEXT NOT NULL,
        source_reuse_outcome_record_ref TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        write_status TEXT NOT NULL CHECK (
          write_status IN (
            'committed',
            'duplicate_replayed',
            'superseded',
            'rolled_back'
          )
        ),
        authority_profile TEXT NOT NULL,
        receipt_fingerprint TEXT NOT NULL,
        supersedes_receipt_id TEXT,
        rollback_of_receipt_id TEXT,
        rollback_reason TEXT,
        FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_signal_receipts(receipt_id),
        FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_signal_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_signal_records (
        next_work_signal_record_id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
        source_global_dogfood_ledger_record_id TEXT NOT NULL,
        source_metric_snapshot_receipt_id TEXT NOT NULL,
        source_metric_snapshot_record_id TEXT NOT NULL,
        source_projection_fingerprint TEXT NOT NULL,
        source_next_work_contract_fingerprint TEXT NOT NULL,
        source_next_work_review_fingerprint TEXT NOT NULL,
        recommended_next_work_label TEXT NOT NULL,
        rationale TEXT NOT NULL,
        outcome_label TEXT NOT NULL,
        outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
        candidate_priority_hint TEXT NOT NULL CHECK (candidate_priority_hint IN ('high', 'medium', 'low', 'blocked')),
        decision_status TEXT NOT NULL,
        mismatch_or_gap_summary TEXT,
        expected_summary TEXT,
        observed_summary TEXT,
        source_line TEXT,
        selected_candidate_context_refs_json TEXT NOT NULL,
        source_next_work_candidate_card_ids_json TEXT NOT NULL,
        blockers_json TEXT NOT NULL,
        warnings_json TEXT NOT NULL,
        manual_only_context_refs_json TEXT NOT NULL,
        source_refs_json TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        next_work_signal_record_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_signal_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_signal_rollbacks (
        rollback_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        receipt_id TEXT NOT NULL,
        rollback_reason TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        rollback_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_signal_receipts(receipt_id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_scope_time
        ON research_candidate_manual_global_dogfood_next_work_signal_receipts(scope, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_status
        ON research_candidate_manual_global_dogfood_next_work_signal_receipts(scope, write_status, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_projection
        ON research_candidate_manual_global_dogfood_next_work_signal_receipts(source_projection_fingerprint, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_ledger
        ON research_candidate_manual_global_dogfood_next_work_signal_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_metric
        ON research_candidate_manual_global_dogfood_next_work_signal_receipts(source_metric_snapshot_receipt_id, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_records_receipt
        ON research_candidate_manual_global_dogfood_next_work_signal_records(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_records_scope_time
        ON research_candidate_manual_global_dogfood_next_work_signal_records(scope, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_next_work_signal_rollbacks(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_rollbacks_time
        ON research_candidate_manual_global_dogfood_next_work_signal_rollbacks(created_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateResearchCandidateManualGlobalDogfoodNextWorkBiasTables(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_bias_receipts (
        receipt_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_next_work_bias_contract_fingerprint TEXT NOT NULL,
        source_next_work_bias_review_fingerprint TEXT NOT NULL,
        source_next_work_signal_receipt_id TEXT NOT NULL,
        source_next_work_signal_record_id TEXT NOT NULL,
        source_next_work_signal_record_fingerprint TEXT NOT NULL,
        source_projection_fingerprint TEXT NOT NULL,
        source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
        source_global_dogfood_ledger_record_id TEXT NOT NULL,
        source_metric_snapshot_receipt_id TEXT NOT NULL,
        source_metric_snapshot_record_id TEXT NOT NULL,
        source_manual_receipt_id TEXT NOT NULL,
        source_handoff_seed_fingerprint TEXT NOT NULL,
        source_result_text_fingerprint TEXT NOT NULL,
        source_expected_observed_delta_record_ref TEXT NOT NULL,
        source_reuse_outcome_record_ref TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        write_status TEXT NOT NULL CHECK (
          write_status IN (
            'committed',
            'duplicate_replayed',
            'superseded',
            'rolled_back'
          )
        ),
        authority_profile TEXT NOT NULL,
        receipt_fingerprint TEXT NOT NULL,
        supersedes_receipt_id TEXT,
        rollback_of_receipt_id TEXT,
        rollback_reason TEXT,
        FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_bias_receipts(receipt_id),
        FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_bias_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_bias_records (
        next_work_bias_record_id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_next_work_signal_receipt_id TEXT NOT NULL,
        source_next_work_signal_record_id TEXT NOT NULL,
        source_projection_fingerprint TEXT NOT NULL,
        source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
        source_global_dogfood_ledger_record_id TEXT NOT NULL,
        source_metric_snapshot_receipt_id TEXT NOT NULL,
        source_metric_snapshot_record_id TEXT NOT NULL,
        recommended_next_work_label TEXT NOT NULL,
        rationale TEXT NOT NULL,
        outcome_label TEXT NOT NULL,
        outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
        bias_strength_hint TEXT NOT NULL CHECK (bias_strength_hint IN ('low', 'medium', 'high', 'blocked')),
        selected_candidate_context_refs_json TEXT NOT NULL,
        source_next_work_candidate_card_ids_json TEXT NOT NULL,
        expected_summary TEXT,
        observed_summary TEXT,
        mismatch_or_gap_summary TEXT,
        source_line TEXT,
        blockers_json TEXT NOT NULL,
        warnings_json TEXT NOT NULL,
        manual_only_context_refs_json TEXT NOT NULL,
        source_refs_json TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        next_work_bias_record_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_bias_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_bias_rollbacks (
        rollback_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        receipt_id TEXT NOT NULL,
        rollback_reason TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        rollback_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_bias_receipts(receipt_id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_scope_time
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(scope, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_status
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(scope, write_status, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_signal
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_next_work_signal_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_projection
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_projection_fingerprint, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_ledger
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_metric
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_metric_snapshot_receipt_id, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_records_receipt
        ON research_candidate_manual_global_dogfood_next_work_bias_records(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_records_scope_time
        ON research_candidate_manual_global_dogfood_next_work_bias_records(scope, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_next_work_bias_rollbacks(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_rollbacks_time
        ON research_candidate_manual_global_dogfood_next_work_bias_rollbacks(created_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateResearchCandidateManualGlobalDogfoodPerspectiveRelayTables(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_relay_receipts (
        receipt_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_perspective_relay_contract_fingerprint TEXT NOT NULL,
        source_perspective_relay_review_fingerprint TEXT NOT NULL,
        source_next_work_signal_receipt_id TEXT NOT NULL,
        source_next_work_signal_record_id TEXT NOT NULL,
        source_next_work_signal_record_fingerprint TEXT NOT NULL,
        source_next_work_bias_receipt_id TEXT NOT NULL,
        source_next_work_bias_record_id TEXT NOT NULL,
        source_next_work_bias_record_fingerprint TEXT NOT NULL,
        source_projection_fingerprint TEXT NOT NULL,
        source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
        source_global_dogfood_ledger_record_id TEXT NOT NULL,
        source_metric_snapshot_receipt_id TEXT NOT NULL,
        source_metric_snapshot_record_id TEXT NOT NULL,
        source_manual_receipt_id TEXT NOT NULL,
        source_handoff_seed_fingerprint TEXT NOT NULL,
        source_result_text_fingerprint TEXT NOT NULL,
        source_expected_observed_delta_record_ref TEXT NOT NULL,
        source_reuse_outcome_record_ref TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        write_status TEXT NOT NULL CHECK (
          write_status IN (
            'committed',
            'duplicate_replayed',
            'superseded',
            'rolled_back'
          )
        ),
        authority_profile TEXT NOT NULL,
        receipt_fingerprint TEXT NOT NULL,
        supersedes_receipt_id TEXT,
        rollback_of_receipt_id TEXT,
        rollback_reason TEXT,
        FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_relay_receipts(receipt_id),
        FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_relay_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_relay_records (
        perspective_relay_record_id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_next_work_signal_receipt_id TEXT NOT NULL,
        source_next_work_signal_record_id TEXT NOT NULL,
        source_next_work_bias_receipt_id TEXT NOT NULL,
        source_next_work_bias_record_id TEXT NOT NULL,
        source_projection_fingerprint TEXT NOT NULL,
        source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
        source_global_dogfood_ledger_record_id TEXT NOT NULL,
        source_metric_snapshot_receipt_id TEXT NOT NULL,
        source_metric_snapshot_record_id TEXT NOT NULL,
        relay_update_label TEXT NOT NULL,
        relay_update_rationale TEXT NOT NULL,
        recommended_next_work_label TEXT NOT NULL,
        outcome_label TEXT NOT NULL,
        outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
        expected_summary TEXT,
        observed_summary TEXT,
        mismatch_or_gap_summary TEXT,
        selected_candidate_context_refs_json TEXT NOT NULL,
        source_next_work_candidate_card_ids_json TEXT NOT NULL,
        manual_only_context_refs_json TEXT NOT NULL,
        source_line TEXT,
        blockers_json TEXT NOT NULL,
        warnings_json TEXT NOT NULL,
        source_refs_json TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        perspective_relay_record_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_relay_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_relay_rollbacks (
        rollback_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        receipt_id TEXT NOT NULL,
        rollback_reason TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        rollback_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_relay_receipts(receipt_id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_scope_time
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(scope, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_status
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(scope, write_status, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_signal
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_next_work_signal_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_bias
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_next_work_bias_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_projection
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_projection_fingerprint, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_ledger
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_metric
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_metric_snapshot_receipt_id, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_records_receipt
        ON research_candidate_manual_global_dogfood_perspective_relay_records(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_records_scope_time
        ON research_candidate_manual_global_dogfood_perspective_relay_records(scope, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_perspective_relay_rollbacks(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_rollbacks_time
        ON research_candidate_manual_global_dogfood_perspective_relay_rollbacks(created_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateTables(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_canonical_perspective_update_receipts (
        receipt_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_canonical_perspective_update_contract_fingerprint TEXT NOT NULL,
        source_canonical_perspective_update_review_fingerprint TEXT NOT NULL,
        source_perspective_relay_receipt_id TEXT NOT NULL,
        source_perspective_relay_record_id TEXT NOT NULL,
        source_perspective_relay_record_fingerprint TEXT NOT NULL,
        source_next_work_signal_receipt_id TEXT NOT NULL,
        source_next_work_signal_record_id TEXT NOT NULL,
        source_next_work_signal_record_fingerprint TEXT NOT NULL,
        source_next_work_bias_receipt_id TEXT NOT NULL,
        source_next_work_bias_record_id TEXT NOT NULL,
        source_next_work_bias_record_fingerprint TEXT NOT NULL,
        source_projection_fingerprint TEXT NOT NULL,
        source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
        source_global_dogfood_ledger_record_id TEXT NOT NULL,
        source_metric_snapshot_receipt_id TEXT NOT NULL,
        source_metric_snapshot_record_id TEXT NOT NULL,
        source_manual_receipt_id TEXT NOT NULL,
        source_handoff_seed_fingerprint TEXT NOT NULL,
        source_result_text_fingerprint TEXT NOT NULL,
        source_expected_observed_delta_record_ref TEXT NOT NULL,
        source_reuse_outcome_record_ref TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        write_status TEXT NOT NULL CHECK (
          write_status IN (
            'committed',
            'duplicate_replayed',
            'superseded',
            'rolled_back'
          )
        ),
        authority_profile TEXT NOT NULL,
        receipt_fingerprint TEXT NOT NULL,
        supersedes_receipt_id TEXT,
        rollback_of_receipt_id TEXT,
        rollback_reason TEXT,
        FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(receipt_id),
        FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_canonical_perspective_update_records (
        canonical_perspective_update_record_id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
        source_perspective_relay_receipt_id TEXT NOT NULL,
        source_perspective_relay_record_id TEXT NOT NULL,
        source_next_work_signal_receipt_id TEXT NOT NULL,
        source_next_work_signal_record_id TEXT NOT NULL,
        source_next_work_bias_receipt_id TEXT NOT NULL,
        source_next_work_bias_record_id TEXT NOT NULL,
        source_projection_fingerprint TEXT NOT NULL,
        source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
        source_global_dogfood_ledger_record_id TEXT NOT NULL,
        source_metric_snapshot_receipt_id TEXT NOT NULL,
        source_metric_snapshot_record_id TEXT NOT NULL,
        canonical_update_label TEXT NOT NULL,
        canonical_update_rationale TEXT NOT NULL,
        relay_update_label TEXT NOT NULL,
        relay_update_rationale TEXT NOT NULL,
        recommended_next_work_label TEXT NOT NULL,
        outcome_label TEXT NOT NULL,
        outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
        update_scope_hint TEXT NOT NULL CHECK (update_scope_hint IN ('canonical_perspective_state')),
        update_strength_hint TEXT NOT NULL CHECK (update_strength_hint IN ('low', 'medium', 'high')),
        expected_summary TEXT,
        observed_summary TEXT,
        mismatch_or_gap_summary TEXT,
        selected_candidate_context_refs_json TEXT NOT NULL,
        source_next_work_candidate_card_ids_json TEXT NOT NULL,
        manual_only_context_refs_json TEXT NOT NULL,
        source_line TEXT,
        blockers_json TEXT NOT NULL,
        warnings_json TEXT NOT NULL,
        compatibility_findings_json TEXT NOT NULL,
        existing_perspective_update_compatibility_json TEXT NOT NULL,
        source_refs_json TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        canonical_perspective_update_record_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(receipt_id)
      )
    `,
  ).run();

  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks (
        rollback_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        receipt_id TEXT NOT NULL,
        rollback_reason TEXT NOT NULL,
        authority_profile TEXT NOT NULL,
        rollback_fingerprint TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(receipt_id)
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_scope_time
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(scope, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_status
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(scope, write_status, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_relay
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_perspective_relay_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_signal
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_next_work_signal_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_bias
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_next_work_bias_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_projection
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_projection_fingerprint, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_ledger
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_metric
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_metric_snapshot_receipt_id, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_records_receipt
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_records(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_records_scope_time
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_records(scope, created_at DESC)
    `,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks(receipt_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks_time
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks(created_at DESC)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migrateResearchCandidateManualGlobalDogfoodPerspectiveApplyTables(
  db: Database.Database,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_apply_receipts (
      receipt_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_apply_contract_fingerprint TEXT NOT NULL,
      source_perspective_apply_review_fingerprint TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_canonical_perspective_update_record_fingerprint TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_perspective_relay_record_fingerprint TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_signal_record_fingerprint TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_next_work_bias_record_fingerprint TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      source_manual_receipt_id TEXT NOT NULL,
      source_handoff_seed_fingerprint TEXT NOT NULL,
      source_result_text_fingerprint TEXT NOT NULL,
      source_expected_observed_delta_record_ref TEXT NOT NULL,
      source_reuse_outcome_record_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      write_status TEXT NOT NULL CHECK (
        write_status IN (
          'committed',
          'duplicate_replayed',
          'superseded',
          'rolled_back'
        )
      ),
      authority_profile TEXT NOT NULL,
      receipt_fingerprint TEXT NOT NULL,
      supersedes_receipt_id TEXT,
      rollback_of_receipt_id TEXT,
      rollback_reason TEXT,
      FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_apply_receipts(receipt_id),
      FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_apply_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_apply_records (
      perspective_apply_record_id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      apply_label TEXT NOT NULL,
      apply_rationale TEXT NOT NULL,
      canonical_update_label TEXT NOT NULL,
      canonical_update_rationale TEXT NOT NULL,
      relay_update_label TEXT NOT NULL,
      relay_update_rationale TEXT NOT NULL,
      recommended_next_work_label TEXT NOT NULL,
      outcome_label TEXT NOT NULL,
      outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
      intended_future_apply_target TEXT NOT NULL CHECK (intended_future_apply_target IN ('canonical_perspective_state')),
      apply_scope_hint TEXT NOT NULL CHECK (apply_scope_hint IN ('canonical_perspective_state')),
      apply_strength_hint TEXT NOT NULL CHECK (apply_strength_hint IN ('low', 'medium', 'high')),
      expected_summary TEXT,
      observed_summary TEXT,
      mismatch_or_gap_summary TEXT,
      selected_candidate_context_refs_json TEXT NOT NULL,
      source_next_work_candidate_card_ids_json TEXT NOT NULL,
      manual_only_context_refs_json TEXT NOT NULL,
      source_line TEXT,
      blockers_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      compatibility_findings_json TEXT NOT NULL,
      existing_apply_path_compatibility_json TEXT NOT NULL,
      source_refs_json TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      perspective_apply_record_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_apply_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_apply_rollbacks (
      rollback_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      receipt_id TEXT NOT NULL,
      rollback_reason TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      rollback_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_apply_receipts(receipt_id)
    );

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_scope_time
      ON research_candidate_manual_global_dogfood_perspective_apply_receipts(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_status
      ON research_candidate_manual_global_dogfood_perspective_apply_receipts(scope, write_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_canonical_update
      ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_canonical_perspective_update_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_relay
      ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_perspective_relay_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_signal
      ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_next_work_signal_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_bias
      ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_next_work_bias_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_projection
      ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_projection_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_ledger
      ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_receipts_source_metric
      ON research_candidate_manual_global_dogfood_perspective_apply_receipts(source_metric_snapshot_receipt_id, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_records_receipt
      ON research_candidate_manual_global_dogfood_perspective_apply_records(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_records_scope_time
      ON research_candidate_manual_global_dogfood_perspective_apply_records(scope, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_rollbacks_receipt
      ON research_candidate_manual_global_dogfood_perspective_apply_rollbacks(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_apply_rollbacks_time
      ON research_candidate_manual_global_dogfood_perspective_apply_rollbacks(created_at DESC);
  `);
}

function migrateResearchCandidateManualGlobalDogfoodPerspectiveStateMutationTables(
  db: Database.Database,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_mutation_receipts (
      receipt_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_state_mutation_contract_fingerprint TEXT NOT NULL,
      source_perspective_state_mutation_review_fingerprint TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_perspective_apply_record_fingerprint TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_canonical_perspective_update_record_fingerprint TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_perspective_relay_record_fingerprint TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_signal_record_fingerprint TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_next_work_bias_record_fingerprint TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      source_manual_receipt_id TEXT NOT NULL,
      source_handoff_seed_fingerprint TEXT NOT NULL,
      source_result_text_fingerprint TEXT NOT NULL,
      source_expected_observed_delta_record_ref TEXT NOT NULL,
      source_reuse_outcome_record_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      write_status TEXT NOT NULL CHECK (
        write_status IN (
          'committed',
          'duplicate_replayed',
          'superseded',
          'rolled_back'
        )
      ),
      authority_profile TEXT NOT NULL,
      receipt_fingerprint TEXT NOT NULL,
      supersedes_receipt_id TEXT,
      rollback_of_receipt_id TEXT,
      rollback_reason TEXT,
      FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(receipt_id),
      FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_mutation_records (
      perspective_state_mutation_record_id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      mutation_label TEXT NOT NULL,
      mutation_rationale TEXT NOT NULL,
      apply_label TEXT NOT NULL,
      apply_rationale TEXT NOT NULL,
      canonical_update_label TEXT NOT NULL,
      canonical_update_rationale TEXT NOT NULL,
      relay_update_label TEXT NOT NULL,
      relay_update_rationale TEXT NOT NULL,
      recommended_next_work_label TEXT NOT NULL,
      outcome_label TEXT NOT NULL,
      outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
      intended_future_mutation_target TEXT NOT NULL CHECK (intended_future_mutation_target IN ('canonical_perspective_state')),
      mutation_scope_hint TEXT NOT NULL CHECK (mutation_scope_hint IN ('canonical_perspective_state')),
      mutation_strength_hint TEXT NOT NULL CHECK (mutation_strength_hint IN ('low', 'medium', 'high')),
      intended_future_apply_target TEXT NOT NULL CHECK (intended_future_apply_target IN ('canonical_perspective_state')),
      apply_scope_hint TEXT NOT NULL CHECK (apply_scope_hint IN ('canonical_perspective_state')),
      apply_strength_hint TEXT NOT NULL CHECK (apply_strength_hint IN ('low', 'medium', 'high')),
      expected_summary TEXT,
      observed_summary TEXT,
      mismatch_or_gap_summary TEXT,
      selected_candidate_context_refs_json TEXT NOT NULL,
      source_next_work_candidate_card_ids_json TEXT NOT NULL,
      manual_only_context_refs_json TEXT NOT NULL,
      source_line TEXT,
      blockers_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      compatibility_findings_json TEXT NOT NULL,
      existing_state_apply_compatibility_json TEXT NOT NULL,
      source_refs_json TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      perspective_state_mutation_record_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks (
      rollback_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      receipt_id TEXT NOT NULL,
      rollback_reason TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      rollback_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(receipt_id)
    );

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_scope_time
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_status
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(scope, write_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_apply
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_perspective_apply_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_canonical_update
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_canonical_perspective_update_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_relay
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_perspective_relay_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_signal
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_next_work_signal_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_bias
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_next_work_bias_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_projection
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_projection_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_ledger
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_receipts_source_metric
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_receipts(source_metric_snapshot_receipt_id, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_records_receipt
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_records(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_records_scope_time
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_records(scope, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks_receipt
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks_time
      ON research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks(created_at DESC);
  `);
}

function migrateResearchCandidateManualGlobalDogfoodPerspectiveAdapterTables(
  db: Database.Database,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_adapter_receipts (
      receipt_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_adapter_contract_fingerprint TEXT NOT NULL,
      source_perspective_adapter_review_fingerprint TEXT NOT NULL,
      source_perspective_state_mutation_receipt_id TEXT NOT NULL,
      source_perspective_state_mutation_record_id TEXT NOT NULL,
      source_perspective_state_mutation_record_fingerprint TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_perspective_apply_record_fingerprint TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_canonical_perspective_update_record_fingerprint TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_perspective_relay_record_fingerprint TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_signal_record_fingerprint TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_next_work_bias_record_fingerprint TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      source_manual_receipt_id TEXT NOT NULL,
      source_handoff_seed_fingerprint TEXT NOT NULL,
      source_result_text_fingerprint TEXT NOT NULL,
      source_expected_observed_delta_record_ref TEXT NOT NULL,
      source_reuse_outcome_record_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      write_status TEXT NOT NULL CHECK (
        write_status IN (
          'committed',
          'duplicate_replayed',
          'superseded',
          'rolled_back'
        )
      ),
      authority_profile TEXT NOT NULL,
      receipt_fingerprint TEXT NOT NULL,
      supersedes_receipt_id TEXT,
      rollback_of_receipt_id TEXT,
      rollback_reason TEXT,
      FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_adapter_receipts(receipt_id),
      FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_adapter_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_adapter_records (
      perspective_adapter_record_id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_state_mutation_receipt_id TEXT NOT NULL,
      source_perspective_state_mutation_record_id TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      adapter_label TEXT NOT NULL,
      adapter_rationale TEXT NOT NULL,
      mutation_label TEXT NOT NULL,
      mutation_rationale TEXT NOT NULL,
      apply_label TEXT NOT NULL,
      apply_rationale TEXT NOT NULL,
      canonical_update_label TEXT NOT NULL,
      canonical_update_rationale TEXT NOT NULL,
      relay_update_label TEXT NOT NULL,
      relay_update_rationale TEXT NOT NULL,
      recommended_next_work_label TEXT NOT NULL,
      outcome_label TEXT NOT NULL,
      outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
      intended_future_adapter_target TEXT NOT NULL CHECK (
        intended_future_adapter_target IN (
          'manual_specific_canonical_state_adapter',
          'manual_specific_current_working_adapter'
        )
      ),
      default_future_adapter_target TEXT NOT NULL CHECK (
        default_future_adapter_target IN (
          'manual_specific_canonical_state_adapter',
          'manual_specific_current_working_adapter'
        )
      ),
      adapter_scope_hint TEXT NOT NULL CHECK (
        adapter_scope_hint IN (
          'manual_specific_canonical_state_adapter',
          'manual_specific_current_working_adapter'
        )
      ),
      adapter_strength_hint TEXT NOT NULL CHECK (adapter_strength_hint IN ('low', 'medium', 'high')),
      expected_future_write_scope TEXT NOT NULL CHECK (expected_future_write_scope IN ('adapter_record_only')),
      recommended_storage_path TEXT NOT NULL CHECK (recommended_storage_path IN ('manual_specific_perspective_adapter_tables')),
      expected_summary TEXT,
      observed_summary TEXT,
      mismatch_or_gap_summary TEXT,
      selected_candidate_context_refs_json TEXT NOT NULL,
      source_next_work_candidate_card_ids_json TEXT NOT NULL,
      manual_only_context_refs_json TEXT NOT NULL,
      source_line TEXT,
      blockers_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      compatibility_findings_json TEXT NOT NULL,
      existing_current_working_adapter_compatibility_json TEXT NOT NULL,
      existing_canonical_state_adapter_compatibility_json TEXT NOT NULL,
      manual_adapter_write_path_json TEXT NOT NULL,
      source_refs_json TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      perspective_adapter_record_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_adapter_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_adapter_rollbacks (
      rollback_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      receipt_id TEXT NOT NULL,
      rollback_reason TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      rollback_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_adapter_receipts(receipt_id)
    );

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_scope_time
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_status
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(scope, write_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_state_mutation
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_perspective_state_mutation_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_apply
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_perspective_apply_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_canonical_update
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_canonical_perspective_update_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_relay
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_perspective_relay_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_signal
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_next_work_signal_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_bias
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_next_work_bias_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_projection
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_projection_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_ledger
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_receipts_source_metric
      ON research_candidate_manual_global_dogfood_perspective_adapter_receipts(source_metric_snapshot_receipt_id, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_records_receipt
      ON research_candidate_manual_global_dogfood_perspective_adapter_records(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_records_scope_time
      ON research_candidate_manual_global_dogfood_perspective_adapter_records(scope, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_rollbacks_receipt
      ON research_candidate_manual_global_dogfood_perspective_adapter_rollbacks(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_adapter_rollbacks_time
      ON research_candidate_manual_global_dogfood_perspective_adapter_rollbacks(created_at DESC);
  `);
}

function migrateResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationTables(
  db: Database.Database,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_application_receipts (
      receipt_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_state_application_contract_fingerprint TEXT NOT NULL,
      source_perspective_state_application_review_fingerprint TEXT NOT NULL,
      source_perspective_adapter_receipt_id TEXT NOT NULL,
      source_perspective_adapter_record_id TEXT NOT NULL,
      source_perspective_adapter_record_fingerprint TEXT NOT NULL,
      source_perspective_state_mutation_receipt_id TEXT NOT NULL,
      source_perspective_state_mutation_record_id TEXT NOT NULL,
      source_perspective_state_mutation_record_fingerprint TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_perspective_apply_record_fingerprint TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_canonical_perspective_update_record_fingerprint TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_perspective_relay_record_fingerprint TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_signal_record_fingerprint TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_next_work_bias_record_fingerprint TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      source_manual_receipt_id TEXT NOT NULL,
      source_handoff_seed_fingerprint TEXT NOT NULL,
      source_result_text_fingerprint TEXT NOT NULL,
      source_expected_observed_delta_record_ref TEXT NOT NULL,
      source_reuse_outcome_record_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      write_status TEXT NOT NULL CHECK (
        write_status IN (
          'committed',
          'duplicate_replayed',
          'superseded',
          'rolled_back'
        )
      ),
      authority_profile TEXT NOT NULL,
      receipt_fingerprint TEXT NOT NULL,
      supersedes_receipt_id TEXT,
      rollback_of_receipt_id TEXT,
      rollback_reason TEXT,
      FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_application_receipts(receipt_id),
      FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_application_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_application_records (
      perspective_state_application_record_id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_adapter_receipt_id TEXT NOT NULL,
      source_perspective_adapter_record_id TEXT NOT NULL,
      source_perspective_state_mutation_receipt_id TEXT NOT NULL,
      source_perspective_state_mutation_record_id TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      state_application_label TEXT NOT NULL,
      state_application_rationale TEXT NOT NULL,
      adapter_label TEXT NOT NULL,
      adapter_rationale TEXT NOT NULL,
      mutation_label TEXT NOT NULL,
      mutation_rationale TEXT NOT NULL,
      apply_label TEXT NOT NULL,
      apply_rationale TEXT NOT NULL,
      canonical_update_label TEXT NOT NULL,
      canonical_update_rationale TEXT NOT NULL,
      relay_update_label TEXT NOT NULL,
      relay_update_rationale TEXT NOT NULL,
      recommended_next_work_label TEXT NOT NULL,
      outcome_label TEXT NOT NULL,
      outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
      intended_future_state_application_target TEXT NOT NULL CHECK (
        intended_future_state_application_target IN (
          'manual_specific_existing_canonical_state_application_adapter',
          'manual_specific_current_working_application_adapter'
        )
      ),
      default_future_state_application_target TEXT NOT NULL CHECK (
        default_future_state_application_target IN (
          'manual_specific_existing_canonical_state_application_adapter',
          'manual_specific_current_working_application_adapter'
        )
      ),
      state_application_scope_hint TEXT NOT NULL CHECK (
        state_application_scope_hint IN (
          'manual_specific_existing_canonical_state_application_adapter',
          'manual_specific_current_working_application_adapter'
        )
      ),
      state_application_strength_hint TEXT NOT NULL CHECK (state_application_strength_hint IN ('low', 'medium', 'high')),
      expected_future_write_scope TEXT NOT NULL CHECK (expected_future_write_scope IN ('state_application_record_only')),
      recommended_storage_path TEXT NOT NULL CHECK (recommended_storage_path IN ('manual_specific_perspective_state_application_tables')),
      expected_summary TEXT,
      observed_summary TEXT,
      mismatch_or_gap_summary TEXT,
      selected_candidate_context_refs_json TEXT NOT NULL,
      source_next_work_candidate_card_ids_json TEXT NOT NULL,
      manual_only_context_refs_json TEXT NOT NULL,
      source_line TEXT,
      blockers_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      compatibility_findings_json TEXT NOT NULL,
      existing_current_working_application_compatibility_json TEXT NOT NULL,
      existing_canonical_state_application_compatibility_json TEXT NOT NULL,
      manual_state_application_write_path_json TEXT NOT NULL,
      source_refs_json TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      perspective_state_application_record_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_application_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_state_application_rollbacks (
      rollback_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      receipt_id TEXT NOT NULL,
      rollback_reason TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      rollback_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_state_application_receipts(receipt_id)
    );

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_scope_time
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(scope, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_status
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(scope, write_status, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_adapter
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_perspective_adapter_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_state_mutation
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_perspective_state_mutation_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_apply
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_perspective_apply_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_canonical_update
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_canonical_perspective_update_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_relay
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_perspective_relay_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_signal
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_next_work_signal_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_bias
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_next_work_bias_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_projection
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_projection_fingerprint, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_ledger
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_receipts_source_metric
      ON research_candidate_manual_global_dogfood_perspective_state_application_receipts(source_metric_snapshot_receipt_id, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_records_receipt
      ON research_candidate_manual_global_dogfood_perspective_state_application_records(receipt_id);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_records_scope_time
      ON research_candidate_manual_global_dogfood_perspective_state_application_records(scope, created_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_rollbacks_receipt
      ON research_candidate_manual_global_dogfood_perspective_state_application_rollbacks(receipt_id);

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_state_application_rollbacks_time
      ON research_candidate_manual_global_dogfood_perspective_state_application_rollbacks(created_at DESC);

  `);
}

function migrateResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityTables(
  db: Database.Database,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts (
      receipt_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_writer_compatibility_contract_fingerprint TEXT NOT NULL,
      source_perspective_writer_compatibility_review_fingerprint TEXT NOT NULL,
      source_perspective_state_application_receipt_id TEXT NOT NULL,
      source_perspective_state_application_record_id TEXT NOT NULL,
      source_perspective_state_application_record_fingerprint TEXT NOT NULL,
      source_perspective_adapter_receipt_id TEXT NOT NULL,
      source_perspective_adapter_record_id TEXT NOT NULL,
      source_perspective_adapter_record_fingerprint TEXT NOT NULL,
      source_perspective_state_mutation_receipt_id TEXT NOT NULL,
      source_perspective_state_mutation_record_id TEXT NOT NULL,
      source_perspective_state_mutation_record_fingerprint TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_perspective_apply_record_fingerprint TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_canonical_perspective_update_record_fingerprint TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_perspective_relay_record_fingerprint TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_signal_record_fingerprint TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_next_work_bias_record_fingerprint TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      source_manual_receipt_id TEXT NOT NULL,
      source_handoff_seed_fingerprint TEXT NOT NULL,
      source_result_text_fingerprint TEXT NOT NULL,
      source_expected_observed_delta_record_ref TEXT NOT NULL,
      source_reuse_outcome_record_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      write_status TEXT NOT NULL CHECK (
        write_status IN (
          'committed',
          'duplicate_replayed',
          'superseded',
          'rolled_back'
        )
      ),
      authority_profile TEXT NOT NULL,
      receipt_fingerprint TEXT NOT NULL,
      supersedes_receipt_id TEXT,
      rollback_of_receipt_id TEXT,
      rollback_reason TEXT,
      FOREIGN KEY (supersedes_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(receipt_id),
      FOREIGN KEY (rollback_of_receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_writer_compatibility_records (
      perspective_writer_compatibility_record_id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_perspective_state_application_receipt_id TEXT NOT NULL,
      source_perspective_state_application_record_id TEXT NOT NULL,
      source_perspective_adapter_receipt_id TEXT NOT NULL,
      source_perspective_adapter_record_id TEXT NOT NULL,
      source_perspective_state_mutation_receipt_id TEXT NOT NULL,
      source_perspective_state_mutation_record_id TEXT NOT NULL,
      source_perspective_apply_receipt_id TEXT NOT NULL,
      source_perspective_apply_record_id TEXT NOT NULL,
      source_canonical_perspective_update_receipt_id TEXT NOT NULL,
      source_canonical_perspective_update_record_id TEXT NOT NULL,
      source_perspective_relay_receipt_id TEXT NOT NULL,
      source_perspective_relay_record_id TEXT NOT NULL,
      source_next_work_signal_receipt_id TEXT NOT NULL,
      source_next_work_signal_record_id TEXT NOT NULL,
      source_next_work_bias_receipt_id TEXT NOT NULL,
      source_next_work_bias_record_id TEXT NOT NULL,
      source_projection_fingerprint TEXT NOT NULL,
      source_global_dogfood_ledger_receipt_id TEXT NOT NULL,
      source_global_dogfood_ledger_record_id TEXT NOT NULL,
      source_metric_snapshot_receipt_id TEXT NOT NULL,
      source_metric_snapshot_record_id TEXT NOT NULL,
      writer_compatibility_label TEXT NOT NULL,
      writer_compatibility_rationale TEXT NOT NULL,
      state_application_label TEXT NOT NULL,
      state_application_rationale TEXT NOT NULL,
      adapter_label TEXT NOT NULL,
      adapter_rationale TEXT NOT NULL,
      mutation_label TEXT NOT NULL,
      mutation_rationale TEXT NOT NULL,
      apply_label TEXT NOT NULL,
      apply_rationale TEXT NOT NULL,
      canonical_update_label TEXT NOT NULL,
      canonical_update_rationale TEXT NOT NULL,
      relay_update_label TEXT NOT NULL,
      relay_update_rationale TEXT NOT NULL,
      recommended_next_work_label TEXT NOT NULL,
      outcome_label TEXT NOT NULL,
      outcome_signal TEXT NOT NULL CHECK (outcome_signal IN ('positive', 'negative', 'ambiguous')),
      intended_future_writer_target TEXT NOT NULL CHECK (
        intended_future_writer_target IN (
          'manual_specific_existing_canonical_state_writer_adapter',
          'manual_specific_current_working_writer_adapter'
        )
      ),
      default_future_writer_target TEXT NOT NULL CHECK (
        default_future_writer_target IN (
          'manual_specific_existing_canonical_state_writer_adapter',
          'manual_specific_current_working_writer_adapter'
        )
      ),
      writer_compatibility_scope_hint TEXT NOT NULL CHECK (
        writer_compatibility_scope_hint IN (
          'manual_specific_existing_canonical_state_writer_adapter',
          'manual_specific_current_working_writer_adapter'
        )
      ),
      writer_compatibility_strength_hint TEXT NOT NULL CHECK (writer_compatibility_strength_hint IN ('low', 'medium', 'high')),
      expected_future_write_scope TEXT NOT NULL CHECK (expected_future_write_scope IN ('writer_compatibility_record_only')),
      recommended_storage_path TEXT NOT NULL CHECK (recommended_storage_path IN ('manual_specific_perspective_writer_compatibility_tables')),
      expected_summary TEXT,
      observed_summary TEXT,
      mismatch_or_gap_summary TEXT,
      selected_candidate_context_refs_json TEXT NOT NULL,
      source_next_work_candidate_card_ids_json TEXT NOT NULL,
      manual_only_context_refs_json TEXT NOT NULL,
      source_line TEXT,
      blockers_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      compatibility_findings_json TEXT NOT NULL,
      existing_current_working_writer_compatibility_json TEXT NOT NULL,
      existing_canonical_state_writer_compatibility_json TEXT NOT NULL,
      manual_writer_compatibility_path_json TEXT NOT NULL,
      source_refs_json TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      perspective_writer_compatibility_record_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(receipt_id)
    );

    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks (
      rollback_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      receipt_id TEXT NOT NULL,
      rollback_reason TEXT NOT NULL,
      authority_profile TEXT NOT NULL,
      rollback_fingerprint TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(receipt_id)
    );

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_scope_time
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_status
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(scope, write_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_state_application
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_perspective_state_application_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_adapter
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_perspective_adapter_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_state_mutation
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_perspective_state_mutation_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_apply
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_perspective_apply_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_canonical_update
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_canonical_perspective_update_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_relay
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_perspective_relay_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_signal
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_next_work_signal_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_bias
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_next_work_bias_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_projection
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_projection_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_ledger
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts_source_metric
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts(source_metric_snapshot_receipt_id, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_records_receipt
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_records(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_records_scope_time
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_records(scope, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks_receipt
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks_time
      ON research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks(created_at DESC);
  `);
}

function migrateResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordTable(
  db: Database.Database,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records (
      record_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      source_entrypoint_review_fingerprint TEXT NOT NULL,
      source_entrypoint_fingerprint TEXT NOT NULL,
      source_contract_fingerprint TEXT NOT NULL,
      source_review_fingerprint TEXT NOT NULL,
      source_dry_run_result_fingerprint TEXT NOT NULL,
      source_perspective_writer_compatibility_receipt_id TEXT NOT NULL,
      source_perspective_writer_compatibility_record_id TEXT NOT NULL,
      source_perspective_writer_compatibility_record_fingerprint TEXT NOT NULL,
      safe_adapter_target TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      accepted_entrypoint_summary_json TEXT NOT NULL,
      source_row_count_summary_json TEXT NOT NULL,
      source_non_mutation_summary_json TEXT NOT NULL,
      source_binding_summary_json TEXT NOT NULL,
      source_explicit_non_write_boundary_json TEXT NOT NULL,
      result_record_write_boundary_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      record_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records_scope_time
      ON research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records_source_review
      ON research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records(source_entrypoint_review_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records_source_entrypoint
      ON research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records(source_entrypoint_fingerprint, created_at DESC);
  `);
}

function migrateAutonomyDelegationGrantTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autonomy_delegation_grants (
      grant_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      grant_status TEXT NOT NULL,
      grant_mode TEXT NOT NULL,
      approval_ref TEXT NOT NULL,
      approved_by TEXT,
      approved_at TEXT,
      approval_basis TEXT,
      approval_text_fingerprint TEXT NOT NULL,
      source_contract_id TEXT,
      source_contract_fingerprint TEXT,
      source_contract_version TEXT,
      source_autonomy_mode TEXT,
      idempotency_key TEXT NOT NULL UNIQUE,
      allowed_work_classes_json TEXT NOT NULL,
      forbidden_work_classes_json TEXT NOT NULL,
      allowed_actions_json TEXT NOT NULL,
      forbidden_actions_json TEXT NOT NULL,
      budget_json TEXT NOT NULL,
      reporting_cadence_json TEXT NOT NULL,
      stop_conditions_json TEXT NOT NULL,
      allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      revocation_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      grant_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_created
      ON autonomy_delegation_grants(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_status_created
      ON autonomy_delegation_grants(scope, grant_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_mode_created
      ON autonomy_delegation_grants(scope, grant_mode, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_approval_ref
      ON autonomy_delegation_grants(approval_ref);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_source_contract_fingerprint
      ON autonomy_delegation_grants(source_contract_fingerprint);
  `);
}

function migrateAutohuntWorkQueueCandidateTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_work_queue_candidates (
      candidate_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      candidate_status TEXT NOT NULL,
      candidate_origin TEXT NOT NULL,
      source_grant_id TEXT NOT NULL,
      source_grant_fingerprint TEXT NOT NULL,
      source_grant_status TEXT NOT NULL,
      source_grant_mode TEXT NOT NULL,
      work_class TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      title_summary_fingerprint TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      source_refs_json TEXT NOT NULL,
      source_fingerprints_json TEXT NOT NULL,
      evidence_refs_json TEXT NOT NULL,
      required_context_refs_json TEXT NOT NULL,
      proposed_files_or_globs_json TEXT NOT NULL,
      expected_outputs_json TEXT NOT NULL,
      required_checks_json TEXT NOT NULL,
      blocked_actions_json TEXT NOT NULL,
      stop_conditions_json TEXT NOT NULL,
      budget_projection_json TEXT NOT NULL,
      grant_fit_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      candidate_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_scope_created
      ON autohunt_work_queue_candidates(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_source_grant_id_created
      ON autohunt_work_queue_candidates(source_grant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_source_grant_fingerprint_created
      ON autohunt_work_queue_candidates(source_grant_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_candidate_status_created
      ON autohunt_work_queue_candidates(candidate_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_candidate_origin_created
      ON autohunt_work_queue_candidates(candidate_origin, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_work_class_created
      ON autohunt_work_queue_candidates(work_class, created_at DESC);
  `);
}

function migrateAutohuntPreflightPacketTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_preflight_packets (
      preflight_packet_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      preflight_status TEXT NOT NULL,
      source_grant_id TEXT NOT NULL,
      source_grant_fingerprint TEXT NOT NULL,
      source_grant_status TEXT NOT NULL,
      source_grant_mode TEXT NOT NULL,
      selected_candidate_ids_json TEXT NOT NULL,
      selected_candidate_fingerprints_json TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      source_queue_readback_json TEXT NOT NULL,
      selected_candidates_json TEXT NOT NULL,
      aggregate_budget_projection_json TEXT NOT NULL,
      grant_budget_remaining_projection_json TEXT NOT NULL,
      preflight_checks_json TEXT NOT NULL,
      blocked_actions_json TEXT NOT NULL,
      stop_conditions_json TEXT NOT NULL,
      required_checks_json TEXT NOT NULL,
      next_allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      preflight_packet_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_scope_created
      ON autohunt_preflight_packets(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_source_grant_id_created
      ON autohunt_preflight_packets(source_grant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_source_grant_fingerprint_created
      ON autohunt_preflight_packets(source_grant_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_preflight_status_created
      ON autohunt_preflight_packets(preflight_status, created_at DESC);
  `);
}

function migrateAutohuntHandoffPlanPreviewTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_handoff_plan_previews (
      handoff_plan_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      handoff_plan_status TEXT NOT NULL,
      source_grant_id TEXT NOT NULL,
      source_grant_fingerprint TEXT NOT NULL,
      source_grant_status TEXT NOT NULL,
      source_grant_mode TEXT NOT NULL,
      source_preflight_packet_id TEXT NOT NULL,
      source_preflight_packet_fingerprint TEXT NOT NULL,
      source_workbench_spine_fingerprint TEXT NOT NULL,
      selected_candidate_ids_json TEXT NOT NULL,
      selected_candidate_fingerprints_json TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      selected_candidate_plan_summaries_json TEXT NOT NULL,
      supervised_codex_prompt_plan_json TEXT NOT NULL,
      draft_pr_plan_json TEXT NOT NULL,
      operator_review_packet_json TEXT NOT NULL,
      aggregate_budget_projection_json TEXT NOT NULL,
      blocked_actions_json TEXT NOT NULL,
      next_allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      handoff_plan_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_scope_created
      ON autohunt_handoff_plan_previews(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_source_grant_id_created
      ON autohunt_handoff_plan_previews(source_grant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_source_preflight_packet_id_created
      ON autohunt_handoff_plan_previews(source_preflight_packet_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_handoff_plan_status_created
      ON autohunt_handoff_plan_previews(handoff_plan_status, created_at DESC);
  `);
}

function migrateAutohuntHandoffPlanOperatorReviewDecisionTable(
  db: Database.Database,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_handoff_plan_operator_review_decisions (
      decision_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      decision_status TEXT NOT NULL,
      operator_decision TEXT NOT NULL,
      source_handoff_plan_id TEXT NOT NULL,
      source_handoff_plan_fingerprint TEXT NOT NULL,
      source_handoff_plan_status TEXT NOT NULL,
      source_grant_id TEXT NOT NULL,
      source_grant_fingerprint TEXT NOT NULL,
      source_preflight_packet_id TEXT NOT NULL,
      source_preflight_packet_fingerprint TEXT NOT NULL,
      source_workbench_spine_fingerprint TEXT NOT NULL,
      selected_candidate_ids_json TEXT NOT NULL,
      selected_candidate_fingerprints_json TEXT NOT NULL,
      review_basis_ref TEXT NOT NULL,
      reviewed_by TEXT,
      reviewed_at TEXT,
      review_basis_fingerprint TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      accepted_summary_json TEXT,
      defer_or_reject_summary_json TEXT,
      source_chain_validation_json TEXT NOT NULL,
      blocked_actions_json TEXT NOT NULL,
      next_allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      decision_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_scope_created
      ON autohunt_handoff_plan_operator_review_decisions(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_source_handoff_plan_id_created
      ON autohunt_handoff_plan_operator_review_decisions(source_handoff_plan_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_decision_status_created
      ON autohunt_handoff_plan_operator_review_decisions(decision_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_operator_decision_created
      ON autohunt_handoff_plan_operator_review_decisions(operator_decision, created_at DESC);
  `);
}

function migrateAutohuntSupervisedExecutionContractTable(
  db: Database.Database,
) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_supervised_execution_contracts (
      contract_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      contract_status TEXT NOT NULL,
      source_readiness_gate_fingerprint TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      latest_queued_candidate_id TEXT NOT NULL,
      latest_queued_candidate_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      handoff_plan_id TEXT NOT NULL,
      handoff_plan_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      launch_mode TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      freshness_contract_json TEXT NOT NULL,
      launch_envelope_json TEXT NOT NULL,
      launcher_may_json TEXT NOT NULL,
      launcher_must_not_json TEXT NOT NULL,
      launch_guard_checks_json TEXT NOT NULL,
      launch_guard_result_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      contract_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_scope_created
      ON autohunt_supervised_execution_contracts(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_contract_status_created
      ON autohunt_supervised_execution_contracts(contract_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_source_readiness_gate_fingerprint_created
      ON autohunt_supervised_execution_contracts(source_readiness_gate_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_active_grant_fingerprint_created
      ON autohunt_supervised_execution_contracts(active_grant_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_ready_preflight_packet_fingerprint_created
      ON autohunt_supervised_execution_contracts(ready_preflight_packet_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_operator_decision_fingerprint_created
      ON autohunt_supervised_execution_contracts(operator_decision_fingerprint, created_at DESC);
  `);
}

function migrateAutohuntResultIntakeTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_result_intakes (
      result_intake_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      result_intake_status TEXT NOT NULL,
      source_execution_contract_id TEXT NOT NULL,
      source_execution_contract_fingerprint TEXT NOT NULL,
      source_execution_contract_status TEXT NOT NULL,
      source_readiness_gate_fingerprint TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      result_report_id TEXT NOT NULL,
      result_report_fingerprint TEXT NOT NULL,
      result_status TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      structured_result_report_json TEXT NOT NULL,
      expected_observed_delta_candidate_json TEXT NOT NULL,
      reuse_outcome_candidate_json TEXT NOT NULL,
      residual_diagnostic_candidate_json TEXT NOT NULL,
      learning_loop_summary_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      result_intake_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_scope_created
      ON autohunt_result_intakes(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_source_execution_contract_id_created
      ON autohunt_result_intakes(source_execution_contract_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_source_execution_contract_fingerprint_created
      ON autohunt_result_intakes(source_execution_contract_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_result_intake_status_created
      ON autohunt_result_intakes(result_intake_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_result_report_fingerprint_created
      ON autohunt_result_intakes(result_report_fingerprint, created_at DESC);
  `);
}

function migrateAutohuntDailyLauncherRunTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_daily_launcher_runs (
      launcher_run_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      launcher_run_status TEXT NOT NULL,
      source_execution_contract_id TEXT NOT NULL,
      source_execution_contract_fingerprint TEXT NOT NULL,
      source_execution_contract_status TEXT NOT NULL,
      launch_mode TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      confirmation_ref TEXT NOT NULL,
      confirmed_by TEXT,
      confirmed_at TEXT,
      confirmation_fingerprint TEXT NOT NULL,
      handoff_packet_id TEXT NOT NULL,
      handoff_packet_fingerprint TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      handoff_packet_json TEXT NOT NULL,
      launcher_run_boundary_json TEXT NOT NULL,
      structured_result_report_fixture_json TEXT,
      linked_result_intake_json TEXT,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      launcher_run_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_scope_created
      ON autohunt_daily_launcher_runs(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_source_execution_contract_id_created
      ON autohunt_daily_launcher_runs(source_execution_contract_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_source_execution_contract_fingerprint_created
      ON autohunt_daily_launcher_runs(source_execution_contract_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_launcher_run_status_created
      ON autohunt_daily_launcher_runs(launcher_run_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_handoff_packet_fingerprint_created
      ON autohunt_daily_launcher_runs(handoff_packet_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_confirmation_fingerprint_created
      ON autohunt_daily_launcher_runs(confirmation_fingerprint, created_at DESC);
  `);
}

function migratePerspectiveMemoryProductPersistenceBoundaryRecordsTable(
  db: Database.Database,
) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS perspective_memory_product_persistence_boundary_records (
        record_id TEXT PRIMARY KEY,
        boundary_status TEXT NOT NULL CHECK (
          boundary_status IN (
            'product_persistence_boundary_recorded',
            'locally_reviewing_boundary_record',
            'kept_for_later',
            'retracted_before_memory_write'
          )
        ),
        source_checklist_id TEXT NOT NULL,
        source_proposal_id TEXT NOT NULL,
        source_queue_item_id TEXT NOT NULL,
        source_candidate_draft_id TEXT NOT NULL,
        source_validation_result_state TEXT NOT NULL CHECK (
          source_validation_result_state IN ('PASS', 'PASS with follow-up')
        ),
        source_validation_summary_hash TEXT NOT NULL,
        source_input_ref TEXT NOT NULL,
        source_input_hash TEXT NOT NULL,
        prepare_summary_ref TEXT NOT NULL,
        prepare_execution_summary_hash TEXT NOT NULL,
        returned_envelope_hash TEXT NOT NULL,
        source_proposal_hash TEXT NOT NULL,
        record_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_status_time
        ON perspective_memory_product_persistence_boundary_records(boundary_status, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_checklist
        ON perspective_memory_product_persistence_boundary_records(source_checklist_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_proposal
        ON perspective_memory_product_persistence_boundary_records(source_proposal_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_queue
        ON perspective_memory_product_persistence_boundary_records(source_queue_item_id)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
  }
}

function migratePerspectiveMemoryItemsTable(db: Database.Database) {
  db.prepare(
    `
      CREATE TABLE IF NOT EXISTS perspective_memory_items (
        item_id TEXT PRIMARY KEY,
        item_status TEXT NOT NULL CHECK (
          item_status IN (
            'accepted',
            'reviewing',
            'retracted',
            'superseded',
            'deprecated'
          )
        ),
        memory_kind TEXT NOT NULL CHECK (
          memory_kind IN ('perspective_candidate')
        ),
        source_boundary_record_id TEXT NOT NULL UNIQUE,
        source_checklist_id TEXT NOT NULL,
        source_proposal_id TEXT NOT NULL,
        source_queue_item_id TEXT NOT NULL,
        source_candidate_draft_id TEXT NOT NULL,
        source_validation_result_state TEXT NOT NULL CHECK (
          source_validation_result_state IN ('PASS', 'PASS with follow-up')
        ),
        source_validation_summary_hash TEXT NOT NULL,
        source_input_ref TEXT NOT NULL,
        source_input_hash TEXT NOT NULL,
        prepare_summary_ref TEXT NOT NULL,
        prepare_execution_summary_hash TEXT NOT NULL,
        returned_envelope_hash TEXT NOT NULL,
        source_proposal_hash TEXT NOT NULL,
        item_title TEXT NOT NULL,
        item_summary TEXT NOT NULL,
        item_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `,
  ).run();

  const indexes = [
    `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_status_time
        ON perspective_memory_items(item_status, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_kind_time
        ON perspective_memory_items(memory_kind, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_boundary
        ON perspective_memory_items(source_boundary_record_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_validation
        ON perspective_memory_items(source_validation_result_state, created_at DESC)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_source_candidate
        ON perspective_memory_items(source_candidate_draft_id)
    `,
  ];

  for (const sql of indexes) {
    db.prepare(sql).run();
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
