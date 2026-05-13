import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(path.join(os.tmpdir(), "augnes-session-binding-"));
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");

const { resetDatabase } = await import("./db-common.mjs");
const bindRoute = await import("../app/api/sessions/bind/route.ts");
const traceRoute = await import("../app/api/sessions/trace/route.ts");
const sessionTraceRoute = await import("../app/api/sessions/[session_id]/trace/route.ts");
const {
  bindCodexSession,
  resolveBindSessionConfig,
} = await import("../apps/augnes_apps/scripts/codex-bind-session.ts");

const scope = "project:augnes";
const sessionId = "session:codex-session-binding-smoke";
const oldSessionId = "session:old-unbound-smoke";
const helperSessionId = "session:codex-helper-smoke";
const workId = "AG-SESSION-BINDING";
const relatedPr = "PR-109";

const db = resetDatabase();
const originalFetch = globalThis.fetch;

try {
  const sessionColumns = db
    .prepare("PRAGMA table_info(sessions)")
    .all()
    .map((column) => column.name);
  for (const column of [
    "surface",
    "actor",
    "related_work_id",
    "related_pr",
    "summary",
    "handoff_ref",
    "evidence_pack_ref",
  ]) {
    assert.ok(sessionColumns.includes(column), `sessions should include ${column}`);
  }

  seedDatabase(db);
  const protectedBefore = snapshotProtectedCounts(db);
  let externalFetchCalls = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    if (url.origin !== "http://localhost:3000" || url.pathname !== "/api/sessions/bind") {
      externalFetchCalls += 1;
      throw new Error(`Unexpected external fetch: ${url.toString()}`);
    }

    return bindRoute.POST(
      new Request(url, {
        method: init?.method ?? "POST",
        headers: init?.headers,
        body: init?.body,
      }),
    );
  };

  const missingSessionIdResponse = await bindRoute.POST(
    jsonRequest("/api/sessions/bind", {
      scope,
      surface: "codex",
    }),
  );
  assert.equal(missingSessionIdResponse.status, 400, "missing session_id should be rejected");

  const invalidSurfaceResponse = await bindRoute.POST(
    jsonRequest("/api/sessions/bind", {
      session_id: sessionId,
      scope,
      surface: "spaceship",
    }),
  );
  assert.equal(invalidSurfaceResponse.status, 400, "invalid surface should be rejected");

  const unknownSessionResponse = await bindRoute.POST(
    jsonRequest("/api/sessions/bind", {
      session_id: "session:missing",
      scope,
      surface: "codex",
    }),
  );
  assert.equal(unknownSessionResponse.status, 404, "unknown session should fail closed");

  const bindResponse = await bindRoute.POST(
    jsonRequest("/api/sessions/bind", {
      session_id: sessionId,
      scope,
      surface: "codex",
      actor: "codex",
      related_work_id: workId.toLowerCase(),
      related_pr: relatedPr,
      summary: "Session binding smoke summary.",
      evidence_pack_ref: "evidence-pack:session-binding-smoke",
    }),
  );
  assert.equal(bindResponse.status, 201, "valid binding should be recorded");

  const traceResponse = await traceRoute.GET(
    new Request(`http://localhost:3000/api/sessions/trace?scope=${encodeURIComponent(scope)}`),
  );
  assert.equal(traceResponse.status, 200, "trace route should return 200");
  const trace = await traceResponse.json();
  const sessionTrace = trace.sessions.find((session) => session.session_id === sessionId);
  assert.ok(sessionTrace, "trace should include bound session");
  assert.equal(sessionTrace.surface, "codex");
  assert.equal(sessionTrace.related_work_id, workId);
  assert.equal(sessionTrace.related_pr, relatedPr);
  assert.equal(sessionTrace.evidence_pack_ref, "evidence-pack:session-binding-smoke");
  assert.equal(sessionTrace.work_event_counts.total, 1);
  assert.equal(sessionTrace.evidence_counts.verification_evidence_records_for_work, 1);
  assert.equal(sessionTrace.evidence_counts.messages, 1);
  assert.equal(sessionTrace.evidence_counts.action_records_by_session, 1);
  assert.equal(sessionTrace.latest_work_event.summary, "Seeded work event for session binding smoke.");
  assert.equal(sessionTrace.latest_evidence_record.evidence_id, "evidence:session-binding-smoke");

  const oldSessionTrace = trace.sessions.find((session) => session.session_id === oldSessionId);
  assert.ok(oldSessionTrace, "old unbound sessions should serialize safely");
  assert.equal(oldSessionTrace.surface, null);
  assert.ok(oldSessionTrace.gaps.includes("unbound_session"));

  const singleTraceResponse = await sessionTraceRoute.GET(
    new Request(
      `http://localhost:3000/api/sessions/${encodeURIComponent(sessionId)}/trace?scope=${encodeURIComponent(scope)}`,
    ),
    { params: Promise.resolve({ session_id: sessionId }) },
  );
  assert.equal(singleTraceResponse.status, 200, "single-session trace should return 200");
  const singleTrace = await singleTraceResponse.json();
  assert.equal(singleTrace.sessions.length, 1);
  assert.equal(singleTrace.sessions[0].session_id, sessionId);

  const missingSingleTraceResponse = await sessionTraceRoute.GET(
    new Request(
      `http://localhost:3000/api/sessions/${encodeURIComponent("session:missing")}/trace?scope=${encodeURIComponent(scope)}`,
    ),
    { params: Promise.resolve({ session_id: "session:missing" }) },
  );
  assert.equal(missingSingleTraceResponse.status, 404, "missing single-session trace should 404");

  const protectedAfterRoutes = snapshotProtectedCounts(db);
  assert.deepEqual(
    protectedAfterRoutes,
    protectedBefore,
    "bind/trace routes must not mutate publication/approval/readiness/delivery/mailbox/state rows",
  );

  const savedEnv = { ...process.env };
  try {
    delete process.env.CODEX_SESSION_ID;
    assert.throws(
      () => resolveBindSessionConfig(),
      /CODEX_SESSION_ID is required/,
      "helper should validate required CODEX_SESSION_ID before POST",
    );

    process.env.AUGNES_API_BASE_URL = "http://localhost:3000";
    process.env.CODEX_SCOPE = scope;
    process.env.CODEX_SESSION_ID = helperSessionId;
    process.env.CODEX_WORK_ID = workId;
    process.env.CODEX_RELATED_PR = relatedPr;
    process.env.CODEX_SESSION_SUMMARY = "Helper session binding smoke summary.";
    const helperConfig = resolveBindSessionConfig();
    const helperResult = await bindCodexSession(helperConfig);
    assert.equal(helperResult.scope, scope, "helper should bind through local API route");
  } finally {
    process.env = savedEnv;
  }

  const helperTraceResponse = await sessionTraceRoute.GET(
    new Request(
      `http://localhost:3000/api/sessions/${encodeURIComponent(helperSessionId)}/trace?scope=${encodeURIComponent(scope)}`,
    ),
    { params: Promise.resolve({ session_id: helperSessionId }) },
  );
  assert.equal(helperTraceResponse.status, 200, "helper-bound session should be traceable");

  assert.equal(externalFetchCalls, 0, "no external fetch calls should occur");
  const protectedAfterHelper = snapshotProtectedCounts(db);
  assert.deepEqual(
    protectedAfterHelper,
    protectedBefore,
    "helper binding must not mutate publication/approval/readiness/delivery/mailbox/state rows",
  );

  console.log(
    JSON.stringify(
      {
        db_path: process.env.AUGNES_DB_PATH,
        bound_session_id: sessionId,
        helper_session_id: helperSessionId,
        related_work_id: workId,
        related_pr: relatedPr,
        trace_sessions: trace.sessions.length,
        work_event_count: sessionTrace.work_event_counts.total,
        verification_evidence_count:
          sessionTrace.evidence_counts.verification_evidence_records_total,
        external_fetch_calls: externalFetchCalls,
      },
      null,
      2,
    ),
  );
} finally {
  globalThis.fetch = originalFetch;
  db.close();
}

function jsonRequest(pathname, body) {
  return new Request(`http://localhost:3000${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function seedDatabase(db) {
  db.prepare(
    `
      INSERT INTO agents (id, name, kind)
      VALUES ('agent:codex', 'Codex', 'external')
    `,
  ).run();
  db.prepare(
    `
      INSERT INTO sessions (id, agent_id, scope, title, started_at)
      VALUES (?, 'agent:codex', ?, ?, ?)
    `,
  ).run(sessionId, scope, "Codex session binding smoke", "2026-05-13T00:00:00.000Z");
  db.prepare(
    `
      INSERT INTO sessions (id, agent_id, scope, title, started_at)
      VALUES (?, 'agent:codex', ?, ?, ?)
    `,
  ).run(helperSessionId, scope, "Codex helper binding smoke", "2026-05-13T00:01:00.000Z");
  db.prepare(
    `
      INSERT INTO sessions (id, agent_id, scope, title, started_at)
      VALUES (?, 'agent:codex', ?, ?, ?)
    `,
  ).run(oldSessionId, scope, "Old unbound session", "2026-05-12T00:00:00.000Z");
  db.prepare(
    `
      INSERT INTO messages (id, session_id, agent_id, role, content, created_at)
      VALUES ('message:session-binding-smoke', ?, 'agent:codex', 'assistant', 'Seeded message.', '2026-05-13T00:02:00.000Z')
    `,
  ).run(sessionId);
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
        related_state_keys,
        links,
        created_at,
        updated_at
      )
      VALUES (?, ?, 'Session binding smoke', 'in_progress', 'normal', 'Smoke work item.', 'Inspect trace.', '[]', '{}', '2026-05-13T00:00:00.000Z', '2026-05-13T00:00:00.000Z')
    `,
  ).run(workId, scope);
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
        'action:session-binding-smoke',
        ?,
        'session_binding.smoke',
        'Session binding smoke action',
        '{}',
        'completed',
        'agent:codex',
        ?,
        '2026-05-13T00:03:00.000Z',
        '2026-05-13T00:03:00.000Z'
      )
    `,
  ).run(scope, sessionId);
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
        'work-event:session-binding-smoke',
        ?,
        ?,
        'codex',
        'verification',
        'Seeded work event for session binding smoke.',
        'completed',
        'verification',
        'action:session-binding-smoke',
        ?,
        '[]',
        '2026-05-13T00:04:00.000Z'
      )
    `,
  ).run(workId, scope, relatedPr);
  db.prepare(
    `
      INSERT INTO verification_evidence_records (
        evidence_id,
        scope,
        work_id,
        target_surface,
        target_ref,
        evidence_kind,
        label,
        status,
        command,
        result_summary,
        source_surface,
        related_action_id,
        related_work_event_id,
        metadata,
        created_by,
        created_at
      )
      VALUES (
        'evidence:session-binding-smoke',
        ?,
        ?,
        'github',
        ?,
        'command_run',
        'Session binding smoke command',
        'passed',
        'npm run smoke:session-binding',
        'Seeded verification evidence record.',
        'codex',
        'action:session-binding-smoke',
        'work-event:session-binding-smoke',
        '{}',
        'codex',
        '2026-05-13T00:05:00.000Z'
      )
    `,
  ).run(scope, workId, relatedPr);
}

function snapshotProtectedCounts(db) {
  const tables = [
    "publication_drafts",
    "publication_approval_requests",
    "publication_approval_decisions",
    "publication_readiness_checks",
    "delivery_ledger",
    "mailbox_messages",
    "state_entries",
    "state_transitions",
    "state_delta_proposals",
  ];

  return Object.fromEntries(
    tables.map((table) => {
      const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get();
      return [table, row.count];
    }),
  );
}
