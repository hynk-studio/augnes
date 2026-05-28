import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-codex-completion-proof-"));
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");

const scope = "project:augnes";
const workId = "AG-PROOF";
let server;
let workItemGets = 0;
let workEventPosts = 0;
let actionProofPosts = 0;
let forbiddenLegacyActionRecordPosts = 0;
let unexpectedRequests = 0;

try {
  const { resetDatabase, openDatabase } = await import("./db-common.mjs");
  const db = resetDatabase();
  seedWorkItem(db);
  db.close();

  const workItemRoute = await import("../app/api/work/[work_id]/route.ts");
  const workBriefRoute = await import("../app/api/work/[work_id]/brief/route.ts");
  const actionProofRoute = await import("../app/api/actions/record-proof/route.ts");
  const workEventRoute = await import("../app/api/work/[work_id]/events/route.ts");
  const evidencePackRoute = await import("../app/api/evidence-pack/route.ts");
  const stateBriefRoute = await import("../app/api/state/brief/route.ts");
  const sessionTraceRoute = await import("../app/api/sessions/trace/route.ts");
  const sessionBindRoute = await import("../app/api/sessions/bind/route.ts");
  const sessionTraceByIdRoute = await import("../app/api/sessions/[session_id]/trace/route.ts");

  server = http.createServer(async (request, response) => {
    try {
      const routeResponse = await routeLocalRequest({
        request,
        actionProofRoute,
        workItemRoute,
        workEventRoute,
      });
      await writeWebResponse(response, routeResponse);
    } catch (error) {
      unexpectedRequests += 1;
      response.writeHead(500, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : "local smoke server failed",
        }),
      );
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const apiBaseUrl = `http://127.0.0.1:${address.port}`;

  const beforeInvalidActionProof = readProofBoundarySnapshot(openDatabase);
  const invalidActionProof = await fetch(`${apiBaseUrl}/api/actions/record-proof`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      scope,
      action_name: "invalid_missing_source_agent",
      result_summary: "Invalid proof request should fail before any writes.",
      files_changed: [],
      result_status: "completed",
      result_kind: "verification",
      work_id: workId,
      related_state_keys: ["verification.evidence_records"],
    }),
  });
  const afterInvalidActionProof = readProofBoundarySnapshot(openDatabase);
  assert.equal(invalidActionProof.status, 400, "invalid action proof request should fail");
  assert.deepEqual(
    afterInvalidActionProof,
    beforeInvalidActionProof,
    "invalid action proof request must not create proof or state records",
  );
  assert.equal(workItemGets, 0, "invalid action proof request must not read work item route");
  assert.equal(workEventPosts, 0, "invalid action proof request must not POST work event");
  assert.equal(forbiddenLegacyActionRecordPosts, 0, "invalid action proof request must not call legacy action-record route");
  const invalidActionProofPosts = actionProofPosts;

  const before = readProofBoundarySnapshot(openDatabase);
  const success = await runProofHelper({
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: scope,
    CODEX_WORK_ID: workId,
    CODEX_ACTION_NAME: "codex_completion_proof_smoke",
    CODEX_RESULT_SUMMARY: "Proof-only completion helper recorded a work event only.",
    CODEX_RESULT_STATUS: "completed",
    CODEX_RESULT_KIND: "verification",
    CODEX_FILES_CHANGED: "apps/augnes_apps/scripts/codex-record-completion-proof.ts",
    CODEX_RELATED_STATE_KEYS: "verification.evidence_records",
    CODEX_RELATED_PR: "https://github.com/Aurna-code/augnes/pull/220",
    CODEX_SESSION_ID: "session:proof-smoke",
  });
  const after = readProofBoundarySnapshot(openDatabase);

  assert.equal(success.status, 0, success.stderr);
  assert.match(success.stdout, /Augnes Codex completion proof recorded/);
  assert.match(success.stdout, /action_record_id: action:/);
  assert.match(success.stdout, /work_event_id: work-event:/);
  assert.match(success.stdout, /read_only_review_refs:/);
  assert.match(success.stdout, /proof-native action and work trace only/);
  assert.match(success.stdout, /session_trace_note: this helper does not create or bind sessions/);
  assert.doesNotMatch(success.stdout, /external\./);
  assert.match(success.stdout, /action_proof_response:/);
  assert.equal(workItemGets, 1, "successful helper should preflight work item once");
  assert.equal(
    actionProofPosts,
    invalidActionProofPosts + 1,
    "successful helper should POST one valid action proof after the invalid guardrail request",
  );
  assert.equal(workEventPosts, 1, "successful helper should POST one work event");
  assert.equal(forbiddenLegacyActionRecordPosts, 0, "proof helper must not call legacy action-record route");
  assert.equal(unexpectedRequests, 0, "smoke server should see no unexpected local requests");
  assert.equal(after.state_entries, before.state_entries, "proof helper must not create state entries");
  assert.equal(after.state_transitions, before.state_transitions, "proof helper must not create state transitions");
  assert.equal(after.external_state_entries, before.external_state_entries, "proof helper must not create external state entries");
  assert.equal(after.action_records, before.action_records + 1, "proof helper should create one action record");
  assert.equal(after.verification_evidence_records, before.verification_evidence_records);
  assert.equal(after.work_events, before.work_events + 1, "proof helper should create one work event");
  assert.equal(after.coordination_events, before.coordination_events + 2, "action proof and work event should each create one coordination event");

  const proofActionRecord = readLatestActionRecord(openDatabase);
  assert.equal(proofActionRecord.state_key, null, "proof-only action record must not carry external.* state key");
  assert.equal(proofActionRecord.title, "codex_completion_proof_smoke");
  assert.equal(proofActionRecord.source_session_id, null, "proof-only action record should not set source_session_id automatically");
  const proofWorkEvent = readLatestWorkEvent(openDatabase);
  assert.equal(
    proofWorkEvent.related_action_id,
    proofActionRecord.id,
    "work event should link the proof-only action record",
  );

  const workBrief = await readJson(
    await workBriefRoute.GET(
      new Request(`http://localhost/api/work/${encodeURIComponent(workId)}/brief?scope=${encodeURIComponent(scope)}`),
      { params: Promise.resolve({ work_id: workId }) },
    ),
  );
  assert.equal(
    workBrief.related_proof.action_ids.includes(proofActionRecord.id),
    true,
    "Work Brief should include the proof action ID",
  );
  const workBriefProof = workBrief.related_proof.action_records.find(
    (record) => record.id === proofActionRecord.id,
  );
  assert.equal(workBriefProof.state_key, null, "Work Brief should expose proof action state_key: null");
  assert.equal(workBriefProof.proof_marker_type, "proof_only");
  assert.deepEqual(workBriefProof.linked_work_event_ids, [proofWorkEvent.id]);

  const evidencePack = await readJson(
    await evidencePackRoute.GET(
      new Request(`http://localhost/api/evidence-pack?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`),
    ),
  );
  assert.equal(
    evidencePack.verification_trace.proof_visibility.proof_only_action_ids.includes(proofActionRecord.id),
    true,
    "Evidence Pack should list the proof-only action ID",
  );
  assert.deepEqual(
    evidencePack.verification_trace.proof_visibility.committed_state_marker_action_ids,
    [],
    "Evidence Pack should not report committed marker action IDs for proof-only closeout",
  );
  assert.equal(
    evidencePack.verification_trace.proof_visibility.linked_work_event_ids.includes(proofWorkEvent.id),
    true,
    "Evidence Pack should list the linked work event ID",
  );
  assert(
    evidencePack.verification_trace.checks_passed.some(
      (check) =>
        check.source === "action_records" &&
        check.id === proofActionRecord.id &&
        check.state_key === null &&
        check.proof_marker_type === "proof_only",
    ),
    "Evidence Pack should label proof-only action records in checks_passed",
  );
  assert(
    evidencePack.verification_trace.checks_passed.some(
      (check) =>
        check.source === "work_events" &&
        check.id === proofWorkEvent.id &&
        check.related_action_id === proofActionRecord.id,
    ),
    "Evidence Pack should show the linked work event proof",
  );
  assert(
    evidencePack.verification_trace.source_refs.includes(`action_record:${proofActionRecord.id}`),
    "Evidence Pack source_refs should include action record proof",
  );
  assert(
    evidencePack.verification_trace.source_refs.includes(`work_event:${proofWorkEvent.id}`),
    "Evidence Pack source_refs should include linked work event proof",
  );

  const stateBrief = await readJson(
    await stateBriefRoute.GET(
      new Request(`http://localhost/api/state/brief?scope=${encodeURIComponent(scope)}`),
    ),
  );
  const stateBriefAction = stateBrief.recent_actions.find(
    (action) => action.id === proofActionRecord.id,
  );
  assert.equal(stateBriefAction.state_key, null, "State Brief recent_actions should preserve proof action state_key: null");
  assert.equal(
    stateBrief.recent_action_visibility.proof_only_action_ids.includes(proofActionRecord.id),
    true,
    "State Brief should label proof-only recent actions separately from active state",
  );
  assert.equal(
    stateBrief.active_state.some((entry) => entry.state_key?.startsWith?.("external.")),
    false,
    "State Brief active_state should not contain external.* markers for proof-only closeout",
  );

  const sessionTrace = await readJson(
    await sessionTraceRoute.GET(
      new Request(`http://localhost/api/sessions/trace?scope=${encodeURIComponent(scope)}`),
    ),
  );
  assert.deepEqual(
    sessionTrace.sessions,
    [],
    "Session Trace should remain empty without explicit session binding",
  );
  assert.equal(
    sessionTrace.gaps.includes("no_sessions_for_scope"),
    true,
    "Session Trace should report absence as an explicit gap before binding",
  );
  assert.equal(
    readSessionCount(openDatabase),
    0,
    "proof-only completion should not auto-create sessions",
  );

  seedExistingSession(openDatabase);
  const unboundSessionTrace = await readJson(
    await sessionTraceByIdRoute.GET(
      new Request(`http://localhost/api/sessions/${encodeURIComponent("session:proof-smoke")}/trace?scope=${encodeURIComponent(scope)}`),
      { params: Promise.resolve({ session_id: "session:proof-smoke" }) },
    ),
  );
  const unboundSession = unboundSessionTrace.sessions[0];
  assert.equal(unboundSession.related_work_id, null, "proof-only completion should not auto-bind sessions");
  assert.equal(unboundSession.proof_visibility.work_linked_proof_action_ids.length, 0);
  assert.equal(unboundSession.evidence_counts.action_records_by_session, 0);

  await readJson(
    await sessionBindRoute.POST(
      new Request("http://localhost/api/sessions/bind", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scope,
          session_id: "session:proof-smoke",
          surface: "codex",
          actor: "codex",
          related_work_id: workId,
          related_pr: "https://github.com/Aurna-code/augnes/pull/220",
          summary: "Bound after proof-only closeout to verify work-linked proof visibility.",
          evidence_pack_ref: `/api/evidence-pack?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
        }),
      }),
    ),
  );
  const boundSessionTrace = await readJson(
    await sessionTraceByIdRoute.GET(
      new Request(`http://localhost/api/sessions/${encodeURIComponent("session:proof-smoke")}/trace?scope=${encodeURIComponent(scope)}`),
      { params: Promise.resolve({ session_id: "session:proof-smoke" }) },
    ),
  );
  const boundSession = boundSessionTrace.sessions[0];
  assert.equal(boundSession.related_work_id, workId);
  assert.equal(boundSession.evidence_counts.action_records_by_session, 0);
  assert.deepEqual(boundSession.action_records, []);
  assert.deepEqual(boundSession.proof_visibility.session_owned_action_ids, []);
  assert.equal(
    boundSession.proof_visibility.work_linked_proof_action_ids.includes(proofActionRecord.id),
    true,
    "bound Session Trace should expose work-linked proof action IDs",
  );
  assert.equal(
    boundSession.proof_visibility.latest_work_event_related_action_id,
    proofActionRecord.id,
    "bound Session Trace should expose latest work event related action ID as a secondary shortcut",
  );
  const canonicalWorkLinkedProofAction = boundSession.work_linked_proof_actions.find(
    (action) => action.id === proofActionRecord.id,
  );
  assert.ok(
    canonicalWorkLinkedProofAction,
    "work_linked_proof_actions[] is the canonical Session Trace proof summary after explicit binding",
  );
  assert.equal(
    canonicalWorkLinkedProofAction.source_session_id,
    null,
    "canonical work-linked proof action should preserve source_session_id: null",
  );
  assert.equal(canonicalWorkLinkedProofAction.proof_marker_type, "proof_only");
  assert.equal(
    canonicalWorkLinkedProofAction.linked_work_event_ids.includes(proofWorkEvent.id),
    true,
    "canonical work-linked proof action should include the linked work event ID",
  );
  assert.match(
    boundSession.proof_visibility.source_session_id_note,
    /source_session_id matches this session/,
  );

  const callsAfterSuccess = workItemGets + actionProofPosts + workEventPosts + forbiddenLegacyActionRecordPosts + unexpectedRequests;
  const unknownWork = await runProofHelper({
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: scope,
    CODEX_WORK_ID: "AG-MISSING",
    CODEX_RESULT_SUMMARY: "Unknown work should fail before proof write.",
    CODEX_RESULT_STATUS: "completed",
    CODEX_RESULT_KIND: "implementation",
  });
  assert.notEqual(unknownWork.status, 0);
  assert.match(unknownWork.stderr, /CODEX_RECORD_COMPLETION_PROOF_UNKNOWN_WORK_ID/);
  assert.equal(actionProofPosts, invalidActionProofPosts + 1, "unknown work must not POST an action proof");
  assert.equal(workEventPosts, 1, "unknown work must not POST a work event");
  assert.equal(forbiddenLegacyActionRecordPosts, 0, "unknown work must not call legacy action-record route");
  assert.equal(
    workItemGets + actionProofPosts + workEventPosts + forbiddenLegacyActionRecordPosts + unexpectedRequests,
    callsAfterSuccess + 1,
    "unknown work should add only one preflight GET",
  );

  const callsAfterUnknown = workItemGets + actionProofPosts + workEventPosts + forbiddenLegacyActionRecordPosts + unexpectedRequests;
  const missingSummary = await runProofHelper({
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: scope,
    CODEX_WORK_ID: workId,
    CODEX_RESULT_STATUS: "completed",
    CODEX_RESULT_KIND: "implementation",
  });
  assert.notEqual(missingSummary.status, 0);
  assert.match(missingSummary.stderr, /CODEX_RESULT_SUMMARY is required/);
  assert.equal(
    workItemGets + actionProofPosts + workEventPosts + forbiddenLegacyActionRecordPosts + unexpectedRequests,
    callsAfterUnknown,
    "missing required env should fail before route calls",
  );

  const callsAfterMissingSummary = workItemGets + actionProofPosts + workEventPosts + forbiddenLegacyActionRecordPosts + unexpectedRequests;
  const unsupportedDogfoodKind = await runProofHelper({
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: scope,
    CODEX_WORK_ID: workId,
    CODEX_RESULT_SUMMARY: "Dogfood report label should not be accepted as proof result kind.",
    CODEX_RESULT_STATUS: "completed",
    CODEX_RESULT_KIND: "runtime_backed_dogfood",
  });
  assert.notEqual(unsupportedDogfoodKind.status, 0);
  assert.match(unsupportedDogfoodKind.stderr, /Invalid CODEX_RESULT_KIND: runtime_backed_dogfood/);
  assert.equal(
    workItemGets + actionProofPosts + workEventPosts + forbiddenLegacyActionRecordPosts + unexpectedRequests,
    callsAfterMissingSummary,
    "unsupported result kind should fail before route calls",
  );

  console.log(
    JSON.stringify(
      {
        smoke: "codex-record-completion-proof-helper",
        helper: "codex:record-completion-proof",
        proof_native_records_used: ["action_records", "work_events", "coordination_events"],
        work_item_gets: workItemGets,
        action_proof_posts: actionProofPosts,
        invalid_action_proof_posts: invalidActionProofPosts,
        successful_action_proof_posts: actionProofPosts - invalidActionProofPosts,
        work_event_posts: workEventPosts,
        legacy_action_record_posts: forbiddenLegacyActionRecordPosts,
        state_entries_delta: after.state_entries - before.state_entries,
        state_transitions_delta: after.state_transitions - before.state_transitions,
        external_state_entries_delta: after.external_state_entries - before.external_state_entries,
        action_records_delta: after.action_records - before.action_records,
        work_events_delta: after.work_events - before.work_events,
        coordination_events_delta: after.coordination_events - before.coordination_events,
        proof_action_record_state_key: proofActionRecord.state_key,
        work_brief_proof_action_visible: true,
        evidence_pack_proof_visibility: true,
        state_brief_recent_action_visibility: true,
        session_trace_requires_explicit_binding: true,
        session_auto_created: false,
        session_auto_bound: false,
        action_records_by_session_unchanged_for_source_session_null: true,
        session_trace_canonical_work_linked_proof_actions: true,
        latest_work_event_related_action_id_secondary_shortcut: true,
        work_linked_proof_visible_after_explicit_bind: true,
        proof_source_session_id: null,
        invalid_action_proof_failed_without_writes: true,
        unknown_work_failed_before_write: true,
        invalid_env_failed_before_route_calls: true,
        unsupported_result_kind_failed_before_route_calls: true,
        github_calls: 0,
        openai_calls: 0,
        limitation:
          "Uses a local HTTP adapter around the real Next route handlers instead of starting next dev.",
      },
      null,
      2,
    ),
  );
} finally {
  if (server) {
    server.close();
    await once(server, "close").catch(() => undefined);
  }
  rmSync(tempDir, { recursive: true, force: true });
}

async function routeLocalRequest({ request, actionProofRoute, workItemRoute, workEventRoute }) {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const body = method === "GET" || method === "HEAD" ? undefined : await readRequestBody(request);
  const webRequest = new Request(url, {
    method,
    headers: request.headers,
    body,
  });

  if (url.pathname === "/api/actions/record") {
    forbiddenLegacyActionRecordPosts += 1;
    return Response.json({ error: "proof helper must not call action-record route" }, { status: 500 });
  }

  if (url.pathname === "/api/actions/record-proof" && method === "POST") {
    actionProofPosts += 1;
    return actionProofRoute.POST(webRequest);
  }

  const workEventMatch = url.pathname.match(/^\/api\/work\/([^/]+)\/events$/);
  if (workEventMatch && method === "POST") {
    workEventPosts += 1;
    return workEventRoute.POST(webRequest, {
      params: Promise.resolve({ work_id: decodeURIComponent(workEventMatch[1]) }),
    });
  }

  const workItemMatch = url.pathname.match(/^\/api\/work\/([^/]+)$/);
  if (workItemMatch && method === "GET") {
    workItemGets += 1;
    return workItemRoute.GET(webRequest, {
      params: Promise.resolve({ work_id: decodeURIComponent(workItemMatch[1]) }),
    });
  }

  unexpectedRequests += 1;
  return Response.json({ error: `Unexpected ${method} ${url.pathname}` }, { status: 404 });
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function writeWebResponse(nodeResponse, webResponse) {
  nodeResponse.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });
  nodeResponse.end(Buffer.from(await webResponse.arrayBuffer()));
}

async function readJson(response) {
  assert(
    response.status === 200 || response.status === 201,
    `expected 200/201 response, got ${response.status}`,
  );
  return response.json();
}

function runProofHelper(env) {
  const childEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    npm_config_cache: process.env.npm_config_cache ?? path.join(tempDir, "npm-cache"),
    ...env,
  };

  delete childEnv.GITHUB_TOKEN;
  delete childEnv.OPENAI_API_KEY;

  return new Promise((resolve) => {
    const child = spawn(
      "npm",
      ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:record-completion-proof"],
      {
        cwd: process.cwd(),
        env: childEnv,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (status) => {
      resolve({ status: status ?? 1, stdout, stderr });
    });
  });
}

function readProofBoundarySnapshot(openDatabase) {
  const db = openDatabase();
  try {
    return {
      state_entries: db.prepare("SELECT COUNT(*) AS count FROM state_entries").get().count,
      state_transitions: db.prepare("SELECT COUNT(*) AS count FROM state_transitions").get().count,
      external_state_entries: db
        .prepare("SELECT COUNT(*) AS count FROM state_entries WHERE state_key LIKE 'external.%'")
        .get().count,
      action_records: db.prepare("SELECT COUNT(*) AS count FROM action_records").get().count,
      work_events: db.prepare("SELECT COUNT(*) AS count FROM work_events").get().count,
      verification_evidence_records: db
        .prepare("SELECT COUNT(*) AS count FROM verification_evidence_records")
        .get().count,
      coordination_events: db.prepare("SELECT COUNT(*) AS count FROM coordination_events").get().count,
    };
  } finally {
    db.close();
  }
}

function readLatestActionRecord(openDatabase) {
  const db = openDatabase();
  try {
    return db
      .prepare(
        `
          SELECT id, state_key, title, status, source_session_id
          FROM action_records
          ORDER BY created_at DESC, id ASC
          LIMIT 1
        `,
      )
      .get();
  } finally {
    db.close();
  }
}

function readSessionCount(openDatabase) {
  const db = openDatabase();
  try {
    return db.prepare("SELECT COUNT(*) AS count FROM sessions").get().count;
  } finally {
    db.close();
  }
}

function seedExistingSession(openDatabase) {
  const db = openDatabase();
  try {
    db.prepare(
      `
        INSERT INTO sessions (
          id,
          agent_id,
          scope,
          title,
          started_at
        )
        VALUES (
          'session:proof-smoke',
          'agent:codex',
          ?,
          'Proof-only closeout session trace smoke',
          '2026-01-01T00:01:00.000Z'
        )
      `,
    ).run(scope);
  } finally {
    db.close();
  }
}

function readLatestWorkEvent(openDatabase) {
  const db = openDatabase();
  try {
    return db
      .prepare(
        `
          SELECT id, related_action_id
          FROM work_events
          ORDER BY created_at DESC, id ASC
          LIMIT 1
        `,
      )
      .get();
  } finally {
    db.close();
  }
}

function seedWorkItem(db) {
  db.prepare(
    `
      INSERT INTO agents (id, name, kind, created_at)
      VALUES ('codex-proof-smoke', 'Codex Proof Smoke', 'codex', '2026-01-01T00:00:00.000Z')
    `,
  ).run();
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
        'AG-PROOF',
        'project:augnes',
        'Codex completion proof helper smoke work',
        'in_progress',
        'now',
        'Seeded local work trace for the proof-only Codex completion helper.',
        'Review helper-created work event proof.',
        0,
        '["verification.evidence_records"]',
        '{}',
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z'
      )
    `,
  ).run();
}
