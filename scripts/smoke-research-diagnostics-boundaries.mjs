import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(
  path.join(tmpdir(), "augnes-research-diagnostics-boundaries-"),
);
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");
delete process.env.OPENAI_API_KEY;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error(
    "Research diagnostics boundary smoke must not make live external calls",
  );
};

const CLEAN_SCOPE = "project:research-diagnostics-clean";
const REPEATED_SCOPE = "project:research-diagnostics-repeated";
const REPEATED_WORK_ID = "AG-RESEARCH-DIAGNOSTICS-REPEATED";

const AUTHORITY_TABLES = [
  "agents",
  "sessions",
  "messages",
  "state_delta_proposals",
  "state_entries",
  "state_transitions",
  "state_tensions",
  "action_records",
  "work_items",
  "work_events",
  "handoffs",
  "mailbox_messages",
  "publication_drafts",
  "publication_approval_requests",
  "publication_approval_decisions",
  "publication_readiness_checks",
  "delivery_ledger",
  "verification_evidence_records",
  "temporal_preview_review_artifacts",
  "temporal_preview_review_artifact_idempotency",
  "coordination_events",
];

try {
  const { resetDatabase, openDatabase } = await import("./db-common.mjs");
  const db = resetDatabase();
  seedResearchDiagnosticFixtures(db);
  db.close();

  const { buildPerspectiveSnapshot } = await import(
    "../lib/perspective/snapshot.ts"
  );
  const perspectiveSnapshotRoute = await import(
    "../app/api/perspective/snapshot/route.ts"
  );

  const before = readAuthoritySnapshot(openDatabase);
  const cleanHelperSnapshot = buildPerspectiveSnapshot({ scope: CLEAN_SCOPE });
  assertAuthorityUnchanged({
    openDatabase,
    before,
    label: "clean helper PerspectiveSnapshot",
  });
  assertCleanSnapshot(cleanHelperSnapshot);
  assertNoDiagnosticAuthority(cleanHelperSnapshot);
  assertNoActionInputInvocations();

  const cleanRouteSnapshot = await readRouteSnapshot({
    route: perspectiveSnapshotRoute,
    scope: CLEAN_SCOPE,
  });
  assertAuthorityUnchanged({
    openDatabase,
    before,
    label: "clean route PerspectiveSnapshot",
  });
  assertCleanSnapshot(cleanRouteSnapshot);
  assertNoDiagnosticAuthority(cleanRouteSnapshot);
  assertNoActionInputInvocations();

  const repeatedHelperSnapshot = buildPerspectiveSnapshot({
    scope: REPEATED_SCOPE,
  });
  assertAuthorityUnchanged({
    openDatabase,
    before,
    label: "repeated helper PerspectiveSnapshot",
  });
  assertRepeatedSnapshot(repeatedHelperSnapshot);
  assertNoDiagnosticAuthority(repeatedHelperSnapshot);
  assertNoActionInputInvocations();

  const repeatedRouteSnapshot = await readRouteSnapshot({
    route: perspectiveSnapshotRoute,
    scope: REPEATED_SCOPE,
  });
  assertAuthorityUnchanged({
    openDatabase,
    before,
    label: "repeated route PerspectiveSnapshot",
  });
  assertRepeatedSnapshot(repeatedRouteSnapshot);
  assertNoDiagnosticAuthority(repeatedRouteSnapshot);
  assertNoActionInputInvocations();

  assert.equal(fetchCalls, 0, "research diagnostics smoke should not call fetch");

  console.log(
    JSON.stringify(
      {
        smoke: "research-diagnostics-boundaries",
        scopes_checked: [CLEAN_SCOPE, REPEATED_SCOPE],
        clean_loopness_level:
          cleanHelperSnapshot.research_diagnostics.loopness_hint.level,
        repeated_loopness_level:
          repeatedHelperSnapshot.research_diagnostics.loopness_hint.level,
        repeated_loopness_score:
          repeatedHelperSnapshot.research_diagnostics.loopness_hint.score,
        meta_wm_placeholder_preserved: true,
        remaining_placeholders_preserved: true,
        authority_tables_mutated: false,
        fetch_calls: fetchCalls,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

async function readRouteSnapshot({ route, scope }) {
  const response = await route.GET(
    new Request(
      `http://localhost/api/perspective/snapshot?scope=${encodeURIComponent(
        scope,
      )}`,
    ),
  );

  assert.equal(
    response.status,
    200,
    `PerspectiveSnapshot route should return 200 for ${scope}`,
  );

  return response.json();
}

function assertCleanSnapshot(snapshot) {
  assert.equal(snapshot.runtime, "augnes");
  assert.equal(snapshot.snapshot_version, "perspective_snapshot.v0.1");
  assert.equal(snapshot.scope, CLEAN_SCOPE);
  assert.equal(snapshot.committed_state_basis.active.length, 1);
  assert.deepEqual(
    snapshot.source_refs.state_entry_ids,
    ["state:research-boundary:clean"],
  );
  assert.equal(snapshot.pending_proposal_pressure.count, 0);
  assert.equal(snapshot.work_trace_basis.count, 0);
  assert.equal(snapshot.action_trace_basis.count, 0);
  assert.equal(snapshot.open_tensions.count, 0);
  assertPlaceholders(snapshot);
  assertLoopnessCommon(snapshot);
  assert.equal(snapshot.research_diagnostics.loopness_hint.score, 0);
  assert.equal(snapshot.research_diagnostics.loopness_hint.level, "none");
  assert.deepEqual(snapshot.research_diagnostics.loopness_hint.signals, {
    repeated_action_state_keys: 0,
    repeated_work_event_actors: 0,
    pending_proposal_count: 0,
    open_tension_count: 0,
  });
  assert.deepEqual(snapshot.research_diagnostics.loopness_hint.source_refs, {
    action_record_ids: [],
    work_event_ids: [],
    pending_proposal_ids: [],
    tension_ids: [],
  });
}

function assertRepeatedSnapshot(snapshot) {
  assert.equal(snapshot.runtime, "augnes");
  assert.equal(snapshot.snapshot_version, "perspective_snapshot.v0.1");
  assert.equal(snapshot.scope, REPEATED_SCOPE);
  assert.equal(snapshot.committed_state_basis.active.length, 1);
  assert.deepEqual(
    snapshot.source_refs.state_entry_ids,
    ["state:research-boundary:repeated"],
  );
  assert.equal(snapshot.pending_proposal_pressure.count, 1);
  assert.equal(snapshot.work_trace_basis.count, 1);
  assert.equal(snapshot.action_trace_basis.count, 2);
  assert.equal(snapshot.open_tensions.count, 1);
  assertPlaceholders(snapshot);
  assertLoopnessCommon(snapshot);
  assert(
    snapshot.research_diagnostics.loopness_hint.score > 0 &&
      snapshot.research_diagnostics.loopness_hint.score <= 1,
    "repeated loopness score should stay bounded between 0 and 1",
  );
  assert.notEqual(snapshot.research_diagnostics.loopness_hint.level, "none");
  assert.deepEqual(snapshot.research_diagnostics.loopness_hint.signals, {
    repeated_action_state_keys: 1,
    repeated_work_event_actors: 1,
    pending_proposal_count: 1,
    open_tension_count: 1,
  });
  assert.deepEqual(
    snapshot.research_diagnostics.loopness_hint.source_refs.action_record_ids,
    [
      "action:research-boundary:repeat-a",
      "action:research-boundary:repeat-b",
    ],
  );
  assert.deepEqual(
    snapshot.research_diagnostics.loopness_hint.source_refs.work_event_ids,
    [
      "work-event:research-boundary:repeat-a",
      "work-event:research-boundary:repeat-b",
    ],
  );
  assert.deepEqual(
    snapshot.research_diagnostics.loopness_hint.source_refs.pending_proposal_ids,
    ["proposal:research-boundary:pending"],
  );
  assert.deepEqual(
    snapshot.research_diagnostics.loopness_hint.source_refs.tension_ids,
    ["tension:research-boundary:open"],
  );
  assertLoopnessSourceRefsAlreadyRead(snapshot);
}

function assertLoopnessCommon(snapshot) {
  const hint = snapshot.research_diagnostics.loopness_hint;
  assert.equal(hint.version, "loopness_hint.v0.1");
  assert.equal(hint.mode, "log_only");
  assert(hint.score >= 0 && hint.score <= 1, "loopness score must be bounded");
  assert(
    hint.notes.some((note) => note.includes("not authority")),
    "loopness notes should include non-authority boundary language",
  );
  assert(
    hint.notes.some((note) => note.includes("Gate/SRF")),
    "loopness notes should include Gate/SRF boundary language",
  );
  assert(
    hint.notes.some((note) => note.includes("commit/reject input")),
    "loopness notes should include commit/reject boundary language",
  );
}

function assertPlaceholders(snapshot) {
  assert.equal(snapshot.research_diagnostics.mode, "log_only");
  assert.equal(snapshot.research_diagnostics.sidecar_e_t, null);
  assert.equal(snapshot.research_diagnostics.bsl_hint, null);
  assert.equal(snapshot.research_diagnostics.comp_index_hint, null);
  assertMetaWmHintPlaceholder(snapshot.research_diagnostics.meta_wm_hint);
}

function assertMetaWmHintPlaceholder(metaWmHint) {
  assert.equal(metaWmHint.version, "meta_wm_hint.placeholder.v0.1");
  assert.equal(metaWmHint.mode, "log_only");
  assert.equal(metaWmHint.status, "placeholder");
  assert.equal(metaWmHint.computed, false);
  assert.deepEqual(metaWmHint.values, {
    wm_strength_hat: null,
    wm_uncertainty_hat: null,
    history_bias_hat: null,
    arousal_proxy: null,
    meta_wm_hat: null,
  });
  assert.deepEqual(metaWmHint.source_refs, []);
  assert(
    metaWmHint.notes.some((note) => note.includes("not computed")),
    "Meta-WM placeholder should state that it is not computed",
  );
  assert(
    metaWmHint.notes.some((note) => note.includes("no authority")),
    "Meta-WM placeholder should state that it has no authority",
  );
}

function assertLoopnessSourceRefsAlreadyRead(snapshot) {
  const loopnessRefs = snapshot.research_diagnostics.loopness_hint.source_refs;
  assertSubset(
    loopnessRefs.action_record_ids,
    snapshot.source_refs.action_record_ids,
    "loopness action refs should be already-read action records",
  );
  assertSubset(
    loopnessRefs.work_event_ids,
    snapshot.source_refs.work_event_ids,
    "loopness work event refs should be already-read work events",
  );
  assertSubset(
    loopnessRefs.pending_proposal_ids,
    snapshot.source_refs.pending_proposal_ids,
    "loopness proposal refs should be already-read proposals",
  );
  assertSubset(
    loopnessRefs.tension_ids,
    snapshot.source_refs.tension_ids,
    "loopness tension refs should be already-read tensions",
  );
}

function assertSubset(subset, superset, message) {
  for (const value of subset) {
    assert(
      superset.includes(value),
      `${message}: ${value} was not present in snapshot source_refs`,
    );
  }
}

function assertNoDiagnosticAuthority(snapshot) {
  assert.equal(snapshot.authority_boundaries.derived_view_only, true);
  assert.equal(snapshot.authority_boundaries.source_of_truth, false);
  assert.equal(snapshot.authority_boundaries.can_commit_or_reject_state, false);
  assert.equal(snapshot.authority_boundaries.can_record_proof, false);
  assert.equal(snapshot.authority_boundaries.can_create_evidence, false);
  assert.equal(snapshot.authority_boundaries.can_update_work, false);
  assert.equal(snapshot.authority_boundaries.can_publish_external, false);
  assert.equal(snapshot.authority_boundaries.can_call_github_or_openai, false);
  assert.equal(
    snapshot.authority_boundaries.can_write_temporal_review_artifacts,
    false,
  );
  assert(
    snapshot.research_diagnostics.notes.some((note) =>
      note.includes("not authority"),
    ),
    "research diagnostics notes should include non-authority boundary language",
  );
  assert(
    snapshot.research_diagnostics.notes.some((note) =>
      note.includes("Cockpit actions"),
    ),
    "research diagnostics notes should exclude Cockpit action input authority",
  );
}

function assertNoActionInputInvocations() {
  assert.equal(fetchCalls, 0, "diagnostics must not call external action paths");
}

function assertAuthorityUnchanged({ openDatabase, before, label }) {
  const after = readAuthoritySnapshot(openDatabase);
  assert.deepEqual(
    after.counts,
    before.counts,
    `${label} must not write authority table rows`,
  );
  assert.deepEqual(
    after.table_hashes,
    before.table_hashes,
    `${label} must not mutate authority table contents`,
  );
  assert.equal(
    after.counts.state_transitions,
    0,
    `${label} must not invoke commit/reject state transition behavior`,
  );
}

function seedResearchDiagnosticFixtures(db) {
  const now = "2026-05-20T00:00:00.000Z";

  db.prepare(
    `
      INSERT INTO agents (id, name, kind)
      VALUES ('codex-research-boundary-smoke', 'Codex research boundary smoke', 'external')
    `,
  ).run();

  seedStateEntry({
    db,
    id: "state:research-boundary:clean",
    scope: CLEAN_SCOPE,
    stateKey: "research.clean",
    value: '"clean fixture"',
    now,
  });

  seedStateEntry({
    db,
    id: "state:research-boundary:repeated",
    scope: REPEATED_SCOPE,
    stateKey: "research.repeated",
    value: '"repeated fixture"',
    now,
  });

  seedActionRecord({
    db,
    id: "action:research-boundary:repeat-a",
    scope: REPEATED_SCOPE,
    stateKey: "research.loop",
    title: "Repeated trace-pressure action A",
    now,
  });
  seedActionRecord({
    db,
    id: "action:research-boundary:repeat-b",
    scope: REPEATED_SCOPE,
    stateKey: "research.loop",
    title: "Repeated trace-pressure action B",
    now,
  });

  db.prepare(
    `
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
        @work_id,
        @scope,
        'Research diagnostics repeated pressure',
        'in_progress',
        'now',
        'Deterministic fixture for runtime diagnostics boundary smoke.',
        'Keep diagnostics read-only and log-only.',
        0,
        '["research.loop"]',
        '{}',
        @now,
        @now
      )
    `,
  ).run({ work_id: REPEATED_WORK_ID, scope: REPEATED_SCOPE, now });

  seedWorkEvent({
    db,
    id: "work-event:research-boundary:repeat-a",
    relatedActionId: "action:research-boundary:repeat-a",
    now,
  });
  seedWorkEvent({
    db,
    id: "work-event:research-boundary:repeat-b",
    relatedActionId: "action:research-boundary:repeat-b",
    now,
  });

  db.prepare(
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
        'proposal:research-boundary:pending',
        @scope,
        'research.loop',
        NULL,
        '"diagnostic pressure fixture"',
        'set',
        'current_project',
        NULL,
        NULL,
        'tentative',
        'new_state',
        NULL,
        NULL,
        'Pending proposal must remain pressure only.',
        'pending',
        @now,
        0.1,
        0.2,
        0.3,
        0.4,
        0.5,
        'candidate',
        0,
        NULL,
        @now,
        'v0.2-rule-001',
        'Seed scoring for research diagnostics boundary smoke.',
        '{}'
      )
    `,
  ).run({ scope: REPEATED_SCOPE, now });

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
        created_at,
        resolved_at
      )
      VALUES (
        'tension:research-boundary:open',
        @scope,
        'research.loop',
        'Diagnostics boundary tension',
        'Open tension should influence only loopness trace-pressure hints.',
        'open',
        'high',
        NULL,
        NULL,
        @now,
        NULL
      )
    `,
  ).run({ scope: REPEATED_SCOPE, now });
}

function seedStateEntry({ db, id, scope, stateKey, value, now }) {
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
        'current_project',
        NULL,
        NULL,
        'active',
        'new_state',
        NULL,
        NULL,
        NULL,
        @now,
        @now
      )
    `,
  ).run({ id, scope, state_key: stateKey, value, now });
}

function seedActionRecord({ db, id, scope, stateKey, title, now }) {
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
        'Deterministic repeated action fixture for log-only loopness hint.',
        'completed',
        'codex-research-boundary-smoke',
        NULL,
        @now,
        @now
      )
    `,
  ).run({ id, scope, state_key: stateKey, title, now });
}

function seedWorkEvent({ db, id, relatedActionId, now }) {
  db.prepare(
    `
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
        @work_id,
        @scope,
        'codex',
        'verification',
        'Deterministic repeated actor fixture for log-only loopness hint.',
        'completed',
        'verification',
        @related_action_id,
        NULL,
        '["research.loop"]',
        @now
      )
    `,
  ).run({
    id,
    work_id: REPEATED_WORK_ID,
    scope: REPEATED_SCOPE,
    related_action_id: relatedActionId,
    now,
  });
}

function readAuthoritySnapshot(openDatabase) {
  const db = openDatabase();
  try {
    const tableRows = Object.fromEntries(
      AUTHORITY_TABLES.map((table) => [
        table,
        db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
      ]),
    );

    return {
      counts: Object.fromEntries(
        AUTHORITY_TABLES.map((table) => [table, tableRows[table].length]),
      ),
      table_hashes: Object.fromEntries(
        AUTHORITY_TABLES.map((table) => [table, hashRows(tableRows[table])]),
      ),
    };
  } finally {
    db.close();
  }
}

function hashRows(rows) {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}
