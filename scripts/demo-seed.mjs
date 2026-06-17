import { encodeValue, initializeDatabase } from "./db-common.mjs";

const scope = "project:augnes";
const agentId = "agent:demo-runtime";
const sessionId = "session:demo-runtime-core";
const timestamp = "2026-05-03T00:00:00.000Z";
const scoringVersion = "v0.2-rule-001";

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
    @committedAt,
    @predictionErrorScore,
    @salienceScore,
    @evidenceScore,
    @conflictScore,
    @selfImpactScore,
    'committed',
    @reinforcementCount,
    @expiresAt,
    @committedAt,
    @scoringVersion,
    @scoringReason,
    @scoreBreakdown
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
    decided_at = excluded.decided_at,
    prediction_error_score = excluded.prediction_error_score,
    salience_score = excluded.salience_score,
    evidence_score = excluded.evidence_score,
    conflict_score = excluded.conflict_score,
    self_impact_score = excluded.self_impact_score,
    consolidation_status = excluded.consolidation_status,
    reinforcement_count = excluded.reinforcement_count,
    expires_at = excluded.expires_at,
    last_evaluated_at = excluded.last_evaluated_at,
    scoring_version = excluded.scoring_version,
    scoring_reason = excluded.scoring_reason,
    score_breakdown = excluded.score_breakdown
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

const upsertWorkItem = db.prepare(`
  INSERT INTO work_items (
    work_id,
    scope,
    title,
    status,
    priority,
    summary,
    next_action,
    user_attention_required,
    related_state_keys,
    links,
    created_at,
    updated_at
  )
  VALUES (
    @workId,
    @scope,
    @title,
    @status,
    @priority,
    @summary,
    @nextAction,
    @userAttentionRequired,
    @relatedStateKeys,
    @links,
    @createdAt,
    @updatedAt
  )
  ON CONFLICT(scope, work_id) DO UPDATE SET
    title = excluded.title,
    status = excluded.status,
    priority = excluded.priority,
    summary = excluded.summary,
    next_action = excluded.next_action,
    user_attention_required = excluded.user_attention_required,
    related_state_keys = excluded.related_state_keys,
    links = excluded.links,
    updated_at = excluded.updated_at
`);

const upsertWorkEvent = db.prepare(`
  INSERT INTO work_events (
    id,
    work_id,
    scope,
    actor,
    event_type,
    summary,
    result_status,
    result_kind,
    related_action_id,
    related_pr,
    related_state_keys,
    created_at
  )
  VALUES (
    @id,
    @workId,
    @scope,
    @actor,
    @eventType,
    @summary,
    @resultStatus,
    @resultKind,
    @relatedActionId,
    @relatedPr,
    @relatedStateKeys,
    @createdAt
  )
  ON CONFLICT(id) DO UPDATE SET
    work_id = excluded.work_id,
    scope = excluded.scope,
    actor = excluded.actor,
    event_type = excluded.event_type,
    summary = excluded.summary,
    result_status = excluded.result_status,
    result_kind = excluded.result_kind,
    related_action_id = excluded.related_action_id,
    related_pr = excluded.related_pr,
    related_state_keys = excluded.related_state_keys,
    created_at = excluded.created_at
`);

// Demo seed/reset uses deterministic upserts; runtime coordination events stay
// append-only through appendCoordinationEvent.
const upsertCoordinationEvent = db.prepare(`
  INSERT INTO coordination_events (
    event_id,
    event_type,
    scope,
    work_id,
    actor,
    target,
    source_surface,
    authority_level,
    state_keys,
    causal_parent_id,
    payload_ref,
    result_status,
    created_at
  )
  VALUES (
    @eventId,
    @eventType,
    @scope,
    @workId,
    @actor,
    @target,
    @sourceSurface,
    @authorityLevel,
    @stateKeys,
    @causalParentId,
    @payloadRef,
    @resultStatus,
    @createdAt
  )
  ON CONFLICT(event_id) DO UPDATE SET
    event_type = excluded.event_type,
    scope = excluded.scope,
    work_id = excluded.work_id,
    actor = excluded.actor,
    target = excluded.target,
    source_surface = excluded.source_surface,
    authority_level = excluded.authority_level,
    state_keys = excluded.state_keys,
    causal_parent_id = excluded.causal_parent_id,
    payload_ref = excluded.payload_ref,
    result_status = excluded.result_status,
    created_at = excluded.created_at
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
      ...buildSeedScoring(transition, timestamp),
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

  seedWorkTraceSpine();
});

seed();
db.close();

console.log(`Seeded Augnes demo temporal state for ${scope}`);

function buildSeedScoring(transition, evaluatedAt) {
  const scoringReason =
    "Demo seed proposal is already committed with deterministic v0.2 scoring metadata.";
  const scores = selectSeedScores(transition);

  return {
    predictionErrorScore: scores.prediction_error_score,
    salienceScore: scores.salience_score,
    evidenceScore: scores.evidence_score,
    conflictScore: scores.conflict_score,
    selfImpactScore: scores.self_impact_score,
    reinforcementCount: 0,
    expiresAt: null,
    scoringVersion,
    scoringReason,
    scoreBreakdown: encodeValue({
      version: scoringVersion,
      evaluated_at: evaluatedAt,
      seed: true,
      scores,
      consolidation_lifecycle: {
        evaluated_at: evaluatedAt,
        status: "committed",
        reason: scoringReason,
      },
    }),
  };
}

function selectSeedScores(transition) {
  if (transition.stateKey.startsWith("security.")) {
    return {
      prediction_error_score: 0.1,
      salience_score: 1,
      evidence_score: 1,
      conflict_score: 0,
      self_impact_score: 0.93,
    };
  }

  if (transition.stability === "completed") {
    return {
      prediction_error_score: 0.45,
      salience_score: 0.76,
      evidence_score: 0.8,
      conflict_score: 0,
      self_impact_score: 0.72,
    };
  }

  if (transition.stability === "deprecated") {
    return {
      prediction_error_score: 0.5,
      salience_score: 0.6,
      evidence_score: 0.75,
      conflict_score: 0.2,
      self_impact_score: 0.55,
    };
  }

  if (transition.temporalScope === "future_phase") {
    return {
      prediction_error_score: 0.45,
      salience_score: 0.52,
      evidence_score: 0.65,
      conflict_score: 0,
      self_impact_score: 0.48,
    };
  }

  return {
    prediction_error_score: 0.65,
    salience_score: 0.78,
    evidence_score: 0.82,
    conflict_score: 0,
    self_impact_score: 0.68,
  };
}

function seedWorkTraceSpine() {
  const workItems = [
    {
      workId: "AG-006",
      title: "Coordination event spine schema and storage",
      status: "in_progress",
      priority: "now",
      summary:
        "Add the Phase 1 event spine schema, storage helpers, and read-only API without expanding write authority.",
      nextAction:
        "Implement PR 1.1 and verify the append-only coordination event read path.",
      userAttentionRequired: 0,
      relatedStateKeys: encodeValue(["coordination.event_spine"]),
      links: encodeValue({
        docs: ["docs/AUGNES_COORDINATION_SPINE_ROADMAP.md"],
        implementation_anchors: [
          "docs/AUGNES_COORDINATION_SPINE_ROADMAP.md#pr-11-event-spine-schema-and-storage",
          "lib/db/schema.sql#coordination_events",
          "lib/coordination-events.ts",
          "app/api/events/route.ts",
          "app/api/events/[event_id]/route.ts",
          "lib/work.ts#appendCoordinationEvent",
          "app/api/work/[work_id]/route.ts",
          "app/api/work/[work_id]/brief/route.ts",
          "scripts/demo-seed.mjs#AG-006",
          "scripts/smoke-authority-invariants.mjs#coordination_events",
        ],
      }),
      createdAt: "2026-05-08T00:00:00.000Z",
      updatedAt: "2026-05-08T00:00:00.000Z",
    },
    {
      workId: "AG-004",
      title: "Codex completion protocol",
      status: "in_progress",
      priority: "now",
      summary:
        "Add a repeatable Codex completion routine that records official action proof and links it into the relevant work trace.",
      nextAction:
        "Implement the helper and runbook, then record the completion against this trace anchor after PR work is complete.",
      userAttentionRequired: 0,
      relatedStateKeys: encodeValue([
        "integration.chatgpt_app",
        "implementation.stack",
      ]),
      links: encodeValue({
        issue: "https://github.com/Aurna-code/augnes/issues/43",
        issues: ["https://github.com/Aurna-code/augnes/issues/43"],
        docs: ["apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md"],
      }),
      createdAt: "2026-05-07T01:00:00.000Z",
      updatedAt: "2026-05-07T01:00:00.000Z",
    },
    {
      workId: "AG-TEMPORAL-INTERPRETATION",
      title: "Temporal Interpretation validation and persistence preparation",
      status: "planned",
      priority: "normal",
      summary:
        "Dedicated work anchor for Temporal Interpretation validation, review artifacts, and future persistence preparation. It is not state authority, proof publication, PerspectiveSnapshot runtime, or RawEpisodeBundle runtime.",
      nextAction:
        "Use this seeded work anchor for future Temporal Interpretation evidence and TemporalPreviewReviewArtifact schema design.",
      userAttentionRequired: 0,
      relatedStateKeys: encodeValue([
        "temporal.interpretation.preview",
        "temporal.interpretation.validation",
        "temporal.interpretation.persistence_design",
      ]),
      links: encodeValue({
        docs: [
          "docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md",
          "docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md",
          "docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md",
        ],
        evidence_target_refs: [
          "temporal:v0.2:hardening",
          "temporal:v0.2:route-review",
          "temporal:v0.2:cockpit-validation",
          "temporal:v0.2:openai-validation",
          "temporal:persistence-design:v0.1",
          "temporal:work-binding:v0.1",
        ],
        lifecycle_stage: "design/validation/persistence-prep",
        owner_surface: "user/Core",
      }),
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z",
    },
    {
      workId: "AG-DOGFOOD-RESEARCH-001",
      title: "Research accumulation scenario pack for ChatGPT-Augnes-Codex dogfood",
      status: "completed",
      priority: "normal",
      summary:
        "Operator-led dogfood work item for preparing a bounded, preview-only Research / Paper / Knowledge Accumulation scenario pack that exercises the existing ChatGPT-Augnes-Codex handoff loop.",
      nextAction:
        "Use Core Codex Handoff to prepare the preview-only research accumulation scenario pack docs/smoke slice, then paste the Codex final report back through codexResultText or codexResultPaste for conservative result review.",
      userAttentionRequired: 0,
      relatedStateKeys: encodeValue([
        "research.accumulation.preview",
        "research.paper_knowledge_surface",
        "integration.chatgpt_app",
      ]),
      links: encodeValue({
        docs: ["docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md"],
        expected_files: [
          "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md",
          "scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
          "package.json",
          "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
        ],
        expected_checks: [
          "node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
          "git diff --check",
        ],
        implementation_anchors: [
          "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md#codex-task-payload",
          "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md#sample-codex-final-report-text",
          "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md#expected-normalizer-outcome",
        ],
        authority_boundary_expectations: [
          "preview-only dogfood scenario",
          "no automatic research ingestion",
          "no automatic GitHub fetch",
          "no proof/evidence writes",
          "no event creation/mutation",
          "no work close/status mutation",
          "no state commit/reject",
          "no Codex execution from App/MCP",
          "no shell execution from App/MCP",
          "no provider/OpenAI calls from App/MCP",
          "no branch/PR creation from App/MCP code",
          "no PR review submission",
          "no merge/publish/retry/replay/deploy controls",
        ],
        skipped_check_policy_expectations: [
          "Skipped checks must include concrete unavailable surface and reason.",
          "Combined skipped-check/caveat lines stay conservative and ambiguous lines remain human-review warnings.",
          "Do not claim proof/evidence rows, live Work Contract Card observation, or codex:read-brief output unless actually run.",
        ],
      }),
      createdAt: "2026-06-17T00:00:00.000Z",
      updatedAt: "2026-06-17T00:00:00.000Z",
    },
    {
      workId: "AG-RESEARCH-CAPABILITY-LANES-001",
      title: "Research capability lanes preparation for Perspective development",
      status: "in_progress",
      priority: "normal",
      summary:
        "Prepare the product-facing Research capability lane plan for Augnes Perspective development, covering manual source intake, bounded operator-provided source fetching, provider-assisted extraction/summary, derived retrieval indexes, durable research candidate memory, and human-reviewed perspective promotion.",
      nextAction:
        "Define the bounded lane contract, expected candidate/review records, source provenance expectations, retrieval non-authority rules, and first user-facing slice without implementing fetching, provider calls, retrieval indexes, DB migrations, durable writes, or perspective promotion.",
      userAttentionRequired: 0,
      relatedStateKeys: encodeValue([
        "research.capability_lanes",
        "research.accumulation.preview",
        "perspective.development",
        "integration.chatgpt_app",
      ]),
      links: encodeValue({
        docs: ["docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md"],
        expected_files: [
          "docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md",
          "scripts/smoke-research-capability-lanes-preparation-v0-1.mjs",
          "scripts/demo-seed.mjs",
          "scripts/codex-next-work.mjs",
          "scripts/smoke-codex-worker-bootstrap-v0-1.mjs",
          "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
          "package.json",
        ],
        expected_checks: [
          "node scripts/smoke-research-capability-lanes-preparation-v0-1.mjs",
          "node scripts/smoke-codex-worker-bootstrap-v0-1.mjs",
          "git diff --check",
        ],
        implementation_anchors: [
          "docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md#bounded-lane-contract",
          "docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md#authority-model",
          "docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md#first-recommended-product-slice",
          "scripts/codex-next-work.mjs#CURRENT_RESEARCH_WORK_ID",
        ],
        authority_boundary_expectations: [
          "product-facing research capability preparation only",
          "no source fetching",
          "no crawler",
          "no provider/OpenAI call",
          "no embeddings/RAG/vector/FTS/index implementation",
          "no DB migration",
          "no durable research writes",
          "no candidate/review record storage",
          "no perspective promotion",
          "no proof/evidence writes",
          "no work close/status mutation outside the seed/demo fixture update",
          "no state commit/reject",
          "no API route changes",
          "no App/MCP tool changes",
          "no automatic Codex execution",
          "no GitHub automation",
        ],
        skipped_check_policy_expectations: [
          "Skipped checks must include concrete unavailable surface and reason.",
          "Do not claim proof/evidence rows, durable research records, live Work Brief retrieval, or capability-lane execution unless actually run.",
        ],
      }),
      createdAt: "2026-06-17T00:00:00.000Z",
      updatedAt: "2026-06-17T00:00:00.000Z",
    },
    {
      workId: "AG-001",
      title: "Work Trace Spine v0 and Work Focus View",
      status: "completed",
      priority: "later",
      summary:
        "Work Trace Spine v0 and Work Focus View were implemented and merged by PR #38 without replacing Augnes state authority.",
      nextAction:
        "Validate ChatGPT App work tools through Developer Mode, then update README/SUBMISSION and final proof assets with Work Trace Spine evidence.",
      userAttentionRequired: 0,
      relatedStateKeys: encodeValue([
        "product.name",
        "implementation.stack",
        "integration.chatgpt_app",
      ]),
      links: encodeValue({
        issue: "https://github.com/Aurna-code/augnes/issues/37",
        issues: ["https://github.com/Aurna-code/augnes/issues/37"],
        prs: ["https://github.com/Aurna-code/augnes/pull/38"],
        docs: ["docs/OPS_PLAYBOOK.md", "docs/00_INDEX_LATEST.md"],
      }),
      createdAt: "2026-05-07T00:00:00.000Z",
      updatedAt: "2026-05-07T00:25:00.000Z",
    },
    {
      workId: "AG-000",
      title: "Current Work card and agent handoff",
      status: "completed",
      priority: "later",
      summary:
        "Expose project-level current status and Codex handoff from the Augnes state brief.",
      nextAction:
        "Use AG-001 to inspect focused work traces beside the project-level Current Work card.",
      userAttentionRequired: 0,
      relatedStateKeys: encodeValue(["submission.readme_checklist_created"]),
      links: encodeValue({
        docs: ["components/augnes-cockpit.tsx", "lib/state/brief.ts"],
      }),
      createdAt: "2026-05-06T00:00:00.000Z",
      updatedAt: "2026-05-06T01:00:00.000Z",
    },
  ];

  for (const item of workItems) {
    upsertWorkItem.run({ ...item, scope });
  }

  const events = [
    {
      id: "work-event:ag-004-opened",
      workId: "AG-004",
      actor: "user",
      eventType: "decision",
      summary:
        "Opened AG-004 to standardize Codex completion recording across action_records and work_events without adding state commit or reject authority.",
      resultStatus: null,
      resultKind: "handoff",
      relatedActionId: null,
      relatedPr: null,
      relatedStateKeys: encodeValue(["integration.chatgpt_app"]),
      createdAt: "2026-05-07T01:00:00.000Z",
    },
    {
      id: "work-event:ag-001-planned",
      workId: "AG-001",
      actor: "user",
      eventType: "decision",
      summary:
        "Opened AG-001 as a trace-anchor implementation for work registry, work events, work brief, cockpit focus, and bridge tools.",
      resultStatus: null,
      resultKind: null,
      relatedActionId: null,
      relatedPr: null,
      relatedStateKeys: encodeValue(["integration.chatgpt_app"]),
      createdAt: "2026-05-07T00:00:00.000Z",
    },
    {
      id: "work-event:ag-001-handoff",
      workId: "AG-001",
      actor: "chatgpt",
      eventType: "handoff",
      summary:
        "Framed work_id as a trace anchor only; committed state remains the durable source of truth and action_records remain execution proof.",
      resultStatus: null,
      resultKind: "handoff",
      relatedActionId: null,
      relatedPr: null,
      relatedStateKeys: encodeValue(["product.name", "implementation.stack"]),
      createdAt: "2026-05-07T00:05:00.000Z",
    },
    {
      id: "work-event:ag-001-pr-38-merged",
      workId: "AG-001",
      actor: "codex",
      eventType: "implementation",
      summary:
        "PR #38 merged Work Trace Spine v0 and Work Focus View into main.",
      resultStatus: "completed",
      resultKind: "implementation",
      relatedActionId: null,
      relatedPr: "https://github.com/Aurna-code/augnes/pull/38",
      relatedStateKeys: encodeValue([
        "integration.chatgpt_app",
        "implementation.stack",
      ]),
      createdAt: "2026-05-07T00:20:00.000Z",
    },
    {
      id: "work-event:ag-001-manual-browser-verification",
      workId: "AG-001",
      actor: "user",
      eventType: "verification",
      summary:
        "Manual browser verification confirmed Work Focus rendering, AG-001 selection, proof/events visibility, copy buttons, and jq validation for the copied work event template.",
      resultStatus: "completed",
      resultKind: "verification",
      relatedActionId: null,
      relatedPr: "https://github.com/Aurna-code/augnes/pull/38",
      relatedStateKeys: encodeValue(["integration.chatgpt_app"]),
      createdAt: "2026-05-07T00:25:00.000Z",
    },
    {
      id: "work-event:ag-000-completed",
      workId: "AG-000",
      actor: "codex",
      eventType: "verification",
      summary:
        "Current Work card seed context is complete and available as project-level status beside AG-001 focus.",
      resultStatus: "completed",
      resultKind: "verification",
      relatedActionId: null,
      relatedPr: null,
      relatedStateKeys: encodeValue(["submission.readme_checklist_created"]),
      createdAt: "2026-05-06T01:00:00.000Z",
    },
  ];

  for (const event of events) {
    upsertWorkEvent.run({ ...event, scope });
  }

  upsertCoordinationEvent.run({
    eventId: "event:ag-006-spine-storage-handoff",
    eventType: "handoff_ready",
    scope,
    workId: "AG-006",
    actor: "user",
    target: "codex",
    sourceSurface: "local_runtime",
    authorityLevel: "handoff_guidance",
    stateKeys: encodeValue(["coordination.event_spine"]),
    causalParentId: null,
    payloadRef: "docs/AUGNES_COORDINATION_SPINE_ROADMAP.md#pr-11-event-spine-schema-and-storage",
    resultStatus: null,
    createdAt: "2026-05-08T00:00:00.000Z",
  });
}
