import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-perspective-snapshot-"));
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");
delete process.env.OPENAI_API_KEY;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("PerspectiveSnapshot smoke must not make live external calls");
};

const SCOPE = "project:perspective-snapshot";
const WORK_ID = "AG-PERSPECTIVE-SNAPSHOT";

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
  seedPerspectiveFixture(db);
  db.close();

  const { buildPerspectiveSnapshot } = await import(
    "../lib/perspective/snapshot.ts"
  );
  const perspectiveSnapshotRoute = await import(
    "../app/api/perspective/snapshot/route.ts"
  );
  const { buildStateBrief } = await import("../lib/state/brief.ts");
  const { buildControlPacket } = await import("../lib/control-packet.ts");

  const before = readAuthoritySnapshot(openDatabase);
  const baselineStateBrief = buildStateBrief(SCOPE);
  const baselineControlPacket = buildControlPacket({ scope: SCOPE });
  const beforeAfterBaselineReads = readAuthoritySnapshot(openDatabase);

  assert.deepEqual(
    beforeAfterBaselineReads,
    before,
    "baseline state brief/control packet reads must not mutate authority tables",
  );
  assert.equal(baselineStateBrief.runtime, "augnes");
  assert.equal(baselineControlPacket.boundaries.derived_view_only, true);
  assert.equal(
    baselineControlPacket.boundaries.state_commit_or_reject,
    false,
    "control packet must remain non-authority",
  );

  const snapshot = buildPerspectiveSnapshot({ scope: SCOPE });
  const afterHelperSnapshot = readAuthoritySnapshot(openDatabase);

  assertSnapshotShape(snapshot);
  assert.deepEqual(
    afterHelperSnapshot,
    before,
    "buildPerspectiveSnapshot must not mutate authority tables",
  );

  const response = await perspectiveSnapshotRoute.GET(
    new Request(
      `http://localhost/api/perspective/snapshot?scope=${encodeURIComponent(
        SCOPE,
      )}`,
    ),
  );
  const routeSnapshot = await response.json();
  const afterRouteSnapshot = readAuthoritySnapshot(openDatabase);

  assert.equal(response.status, 200, "PerspectiveSnapshot route should return 200");
  assertSnapshotShape(routeSnapshot);
  assert.deepEqual(
    afterRouteSnapshot,
    before,
    "PerspectiveSnapshot route must not mutate authority tables",
  );
  assert.equal(
    afterRouteSnapshot.counts.state_transitions,
    0,
    "PerspectiveSnapshot must not invoke existing action-proof state transition behavior",
  );
  assert.equal(fetchCalls, 0, "PerspectiveSnapshot smoke should make no fetch calls");

  console.log(
    JSON.stringify(
      {
        smoke: "perspective-snapshot",
        runtime: snapshot.runtime,
        snapshot_version: snapshot.snapshot_version,
        scope: snapshot.scope,
        route_status: response.status,
        committed_state_items:
          snapshot.committed_state_basis.active.length +
          snapshot.committed_state_basis.future.length +
          snapshot.committed_state_basis.completed.length +
          snapshot.committed_state_basis.deprecated.length,
        pending_proposal_pressure_count:
          snapshot.pending_proposal_pressure.count,
        evidence_count: snapshot.evidence_basis.count,
        work_count: snapshot.work_trace_basis.count,
        action_count: snapshot.action_trace_basis.count,
        open_tension_count: snapshot.open_tensions.count,
        research_diagnostics_mode: snapshot.research_diagnostics.mode,
        derived_view_only: snapshot.authority_boundaries.derived_view_only,
        authority_tables_mutated: false,
        action_proof_state_transition_invoked: false,
        state_brief_control_packet_mutated: false,
        fetch_calls: fetchCalls,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assertSnapshotShape(snapshot) {
  assert.equal(snapshot.runtime, "augnes");
  assert.equal(snapshot.snapshot_version, "perspective_snapshot.v0.1");
  assert.equal(snapshot.scope, SCOPE);
  assert.equal(typeof snapshot.as_of, "string");
  assert(Array.isArray(snapshot.source_refs.state_entry_ids));
  assert(Array.isArray(snapshot.source_refs.pending_proposal_ids));
  assert(Array.isArray(snapshot.source_refs.evidence_ids));
  assert(Array.isArray(snapshot.source_refs.work_ids));
  assert(Array.isArray(snapshot.source_refs.work_event_ids));
  assert(Array.isArray(snapshot.source_refs.action_record_ids));
  assert(Array.isArray(snapshot.source_refs.tension_ids));
  assert(Array.isArray(snapshot.source_refs.execution_lane_ids));
  assert.equal(snapshot.committed_state_basis.active.length, 1);
  assert.equal(snapshot.pending_proposal_pressure.count, 1);
  assert.equal(snapshot.evidence_basis.count, 1);
  assert.equal(snapshot.work_trace_basis.count, 1);
  assert.equal(snapshot.action_trace_basis.count, 1);
  assert.equal(snapshot.open_tensions.count, 1);
  assert(snapshot.recent_agent_activity.length >= 1);
  assert.equal(snapshot.authority_boundaries.derived_view_only, true);
  assert.equal(snapshot.authority_boundaries.can_commit_or_reject_state, false);
  assert.equal(snapshot.authority_boundaries.can_record_proof, false);
  assert.equal(snapshot.authority_boundaries.can_create_evidence, false);
  assert.equal(snapshot.authority_boundaries.can_update_work, false);
  assert.equal(snapshot.authority_boundaries.can_publish_external, false);
  assert.equal(snapshot.authority_boundaries.can_mutate_mailbox, false);
  assert.equal(snapshot.authority_boundaries.can_mutate_publication_state, false);
  assert.equal(snapshot.authority_boundaries.can_call_github_or_openai, false);
  assert.equal(
    snapshot.authority_boundaries.can_write_temporal_review_artifacts,
    false,
  );
  assert.equal(snapshot.research_diagnostics.mode, "log_only");
  assert.equal(snapshot.research_diagnostics.sidecar_e_t, null);
  assert.equal(snapshot.research_diagnostics.meta_wm_hint, null);
  assert.equal(snapshot.research_diagnostics.bsl_hint, null);
  assert.equal(snapshot.research_diagnostics.loopness_hint, null);
  assert.equal(snapshot.research_diagnostics.comp_index_hint, null);
  assert(
    snapshot.research_diagnostics.notes.some((note) =>
      note.includes("not authority"),
    ),
    "research diagnostics should state non-authority boundary",
  );
}

function seedPerspectiveFixture(db) {
  const now = "2026-05-18T00:00:00.000Z";

  db.prepare(
    `
      INSERT INTO agents (id, name, kind)
      VALUES ('codex-smoke', 'Codex smoke', 'external')
    `,
  ).run();

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
        'state:perspective:product',
        @scope,
        'product.name',
        '"Augnes"',
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
  ).run({ scope: SCOPE, now });

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
        'proposal:perspective:pending',
        @scope,
        'perspective.next',
        NULL,
        '"Cockpit Perspective wiring"',
        'set',
        'future_phase',
        NULL,
        NULL,
        'tentative',
        'future_intent',
        NULL,
        NULL,
        'Seed pending proposal for PerspectiveSnapshot smoke.',
        'pending',
        @now,
        0.1,
        0.8,
        0.5,
        0.2,
        0.4,
        'candidate',
        0,
        NULL,
        @now,
        'v0.2-rule-001',
        'Seed scoring for PerspectiveSnapshot smoke.',
        '{}'
      )
    `,
  ).run({ scope: SCOPE, now });

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
        'tension:perspective:authority',
        @scope,
        'perspective.next',
        'Perspective authority boundary',
        'PerspectiveSnapshot must remain derived read-only.',
        'open',
        'high',
        NULL,
        NULL,
        @now,
        NULL
      )
    `,
  ).run({ scope: SCOPE, now });

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
        'action:perspective:smoke',
        @scope,
        'perspective.snapshot',
        'PerspectiveSnapshot smoke seed action',
        'Seed action trace for PerspectiveSnapshot smoke.',
        'completed',
        'codex-smoke',
        NULL,
        @now,
        @now
      )
    `,
  ).run({ scope: SCOPE, now });

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
        'PerspectiveSnapshot v0.1',
        'in_progress',
        'now',
        'Seed work trace for PerspectiveSnapshot smoke.',
        'Verify read-only snapshot generation.',
        0,
        '["perspective.snapshot"]',
        '{}',
        @now,
        @now
      )
    `,
  ).run({ work_id: WORK_ID, scope: SCOPE, now });

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
        'work-event:perspective:smoke',
        @work_id,
        @scope,
        'codex',
        'verification',
        'Seed work event for PerspectiveSnapshot smoke.',
        'completed',
        'verification',
        'action:perspective:smoke',
        NULL,
        '["perspective.snapshot"]',
        @now
      )
    `,
  ).run({ work_id: WORK_ID, scope: SCOPE, now });

  db.prepare(
    `
      INSERT INTO verification_evidence_records (
        evidence_id,
        scope,
        work_id,
        publication_id,
        delivery_id,
        target_surface,
        target_ref,
        evidence_kind,
        label,
        status,
        command,
        result_summary,
        skipped_reason,
        observed_behavior,
        source_surface,
        source_ref,
        related_action_id,
        related_work_event_id,
        metadata,
        created_by,
        created_at
      )
      VALUES (
        'evidence:perspective:smoke',
        @scope,
        @work_id,
        NULL,
        NULL,
        NULL,
        NULL,
        'check_passed',
        'PerspectiveSnapshot smoke seed evidence',
        'passed',
        'npm run smoke:perspective-snapshot',
        'Seed evidence trace for PerspectiveSnapshot smoke.',
        NULL,
        NULL,
        'codex',
        'authority-smoke',
        'action:perspective:smoke',
        'work-event:perspective:smoke',
        '{}',
        'codex-smoke',
        @now
      )
    `,
  ).run({ work_id: WORK_ID, scope: SCOPE, now });
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
