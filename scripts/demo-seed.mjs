import { encodeValue, initializeDatabase } from "./db-common.mjs";

const scope = "project:augnes";
const agentId = "agent:demo-runtime";
const sessionId = "session:demo-runtime-core";
const timestamp = "2026-05-03T00:00:00.000Z";

const transitions = [
  {
    id: "transition:product-name",
    proposalId: "proposal:product-name",
    stateKey: "product.name",
    beforeValue: "unknown",
    afterValue: "Augnes",
    temporalScope: "current_project",
    stability: "active",
    changeType: "new_state",
    operation: "set",
    reason: "The product identity has been committed for the runtime scaffold.",
  },
  {
    id: "transition:implementation-stack",
    proposalId: "proposal:implementation-stack",
    stateKey: "implementation.stack",
    beforeValue: "unknown",
    afterValue: "Next.js + SQLite + OpenAI API",
    temporalScope: "current_project",
    stability: "active",
    changeType: "new_state",
    operation: "set",
    reason: "The initial implementation stack is recorded for continuity.",
  },
  {
    id: "transition:chatgpt-app",
    proposalId: "proposal:chatgpt-app",
    stateKey: "integration.chatgpt_app",
    beforeValue: "unknown",
    afterValue: "planned_after_challenge",
    temporalScope: "future_phase",
    stability: "tentative",
    changeType: "future_intent",
    operation: "set",
    reason: "ChatGPT app integration is intentionally deferred to a later phase.",
  },
  {
    id: "transition:no-api-keys",
    proposalId: "proposal:no-api-keys",
    stateKey: "security.no_api_keys_in_repo",
    beforeValue: "unknown",
    afterValue: true,
    temporalScope: "current_project",
    stability: "stable",
    changeType: "new_state",
    operation: "set",
    reason: "Repository policy requires that local secrets stay out of source control.",
  },
  {
    id: "transition:readme-checklist",
    proposalId: "proposal:readme-checklist",
    stateKey: "submission.readme_checklist_created",
    beforeValue: false,
    afterValue: true,
    temporalScope: "current_project",
    stability: "completed",
    changeType: "completion",
    operation: "complete",
    reason: "The submission checklist state is complete for the current project.",
  },
  {
    id: "transition:old-memory-framing",
    proposalId: "proposal:old-memory-framing",
    stateKey: "positioning.chatbot_memory_framing",
    beforeValue: "possible",
    afterValue: "deprecated",
    temporalScope: "historical_note",
    stability: "deprecated",
    changeType: "deprecation",
    operation: "deprecate",
    reason: "Augnes should be framed as a temporal state runtime, not chatbot memory.",
  },
];

const db = initializeDatabase();

const insertAgent = db.prepare(`
  INSERT INTO agents (id, name, kind, created_at)
  VALUES (@id, @name, @kind, @createdAt)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    kind = excluded.kind
`);

const insertSession = db.prepare(`
  INSERT INTO sessions (id, agent_id, scope, title, started_at)
  VALUES (@id, @agentId, @scope, @title, @startedAt)
  ON CONFLICT(id) DO UPDATE SET
    agent_id = excluded.agent_id,
    scope = excluded.scope,
    title = excluded.title,
    started_at = excluded.started_at
`);

const insertMessage = db.prepare(`
  INSERT INTO messages (id, session_id, agent_id, role, content, created_at)
  VALUES (@id, @sessionId, @agentId, @role, @content, @createdAt)
  ON CONFLICT(id) DO UPDATE SET
    content = excluded.content,
    created_at = excluded.created_at
`);

const insertProposal = db.prepare(`
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
    decided_at
  )
  VALUES (
    @proposalId,
    @scope,
    @stateKey,
    @beforeValue,
    @afterValue,
    @operation,
    @temporalScope,
    @validFrom,
    @validUntil,
    @stability,
    @changeType,
    @sourceAgentId,
    @sourceSessionId,
    @reason,
    'committed',
    @committedAt,
    @committedAt
  )
  ON CONFLICT(id) DO UPDATE SET
    scope = excluded.scope,
    state_key = excluded.state_key,
    before_value = excluded.before_value,
    after_value = excluded.after_value,
    operation = excluded.operation,
    temporal_scope = excluded.temporal_scope,
    valid_from = excluded.valid_from,
    valid_until = excluded.valid_until,
    stability = excluded.stability,
    change_type = excluded.change_type,
    source_agent_id = excluded.source_agent_id,
    source_session_id = excluded.source_session_id,
    reason = excluded.reason,
    status = excluded.status,
    proposed_at = excluded.proposed_at,
    decided_at = excluded.decided_at
`);

const insertTransition = db.prepare(`
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
    @stateKey,
    @beforeValue,
    @afterValue,
    @temporalScope,
    @validFrom,
    @validUntil,
    @stability,
    @changeType,
    @sourceAgentId,
    @sourceSessionId,
    @proposalId,
    @reason,
    @committedAt
  )
  ON CONFLICT(id) DO UPDATE SET
    scope = excluded.scope,
    state_key = excluded.state_key,
    before_value = excluded.before_value,
    after_value = excluded.after_value,
    temporal_scope = excluded.temporal_scope,
    valid_from = excluded.valid_from,
    valid_until = excluded.valid_until,
    stability = excluded.stability,
    change_type = excluded.change_type,
    source_agent_id = excluded.source_agent_id,
    source_session_id = excluded.source_session_id,
    source_proposal_id = excluded.source_proposal_id,
    reason = excluded.reason,
    committed_at = excluded.committed_at
`);

const upsertEntry = db.prepare(`
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
    @entryId,
    @scope,
    @stateKey,
    @afterValue,
    @temporalScope,
    @validFrom,
    @validUntil,
    @stability,
    @changeType,
    @sourceAgentId,
    @sourceSessionId,
    @id,
    @committedAt,
    @committedAt
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
`);

const upsertTension = db.prepare(`
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
    @stateKey,
    @title,
    @description,
    @status,
    @severity,
    @sourceAgentId,
    @sourceSessionId,
    @createdAt
  )
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    severity = excluded.severity,
    source_agent_id = excluded.source_agent_id,
    source_session_id = excluded.source_session_id
`);

const seed = db.transaction(() => {
  insertAgent.run({
    id: agentId,
    name: "Demo Runtime Agent",
    kind: "seed",
    createdAt: timestamp,
  });

  insertSession.run({
    id: sessionId,
    agentId,
    scope,
    title: "Issue #2 runtime core seed",
    startedAt: timestamp,
  });

  insertMessage.run({
    id: "message:demo-runtime-core",
    sessionId,
    agentId,
    role: "system",
    content: "Seeded state for Augnes temporal runtime API verification.",
    createdAt: timestamp,
  });

  for (const transition of transitions) {
    const row = {
      ...transition,
      entryId: `entry:${transition.stateKey}`,
      scope,
      beforeValue: encodeValue(transition.beforeValue),
      afterValue: encodeValue(transition.afterValue),
      validFrom: timestamp,
      validUntil: null,
      sourceAgentId: agentId,
      sourceSessionId: sessionId,
      committedAt: timestamp,
    };

    insertProposal.run(row);
    insertTransition.run(row);
    upsertEntry.run(row);
  }

  upsertTension.run({
    id: "tension:unsafe-api-key-handling",
    scope,
    stateKey: "security.no_api_keys_in_repo",
    title: "Unsafe API key handling must stay unresolved until secret flow exists",
    description:
      "Runtime work must avoid committing local secrets and should defer API key handling until a safe configuration path is implemented.",
    status: "open",
    severity: "high",
    sourceAgentId: agentId,
    sourceSessionId: sessionId,
    createdAt: timestamp,
  });
});

seed();
db.close();

console.log(`Seeded Augnes demo temporal state for ${scope}`);
