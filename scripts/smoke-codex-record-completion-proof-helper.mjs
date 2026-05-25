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
  const actionProofRoute = await import("../app/api/actions/record-proof/route.ts");
  const workEventRoute = await import("../app/api/work/[work_id]/events/route.ts");

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

  const before = readProofBoundarySnapshot(openDatabase);
  const success = await runProofHelper({
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: scope,
    CODEX_WORK_ID: workId,
    CODEX_ACTION_NAME: "codex_completion_proof_smoke",
    CODEX_RESULT_SUMMARY: "Proof-only completion helper recorded a work event only.",
    CODEX_RESULT_STATUS: "completed",
    CODEX_RESULT_KIND: "implementation",
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
  assert.doesNotMatch(success.stdout, /external\./);
  assert.match(success.stdout, /action_proof_response:/);
  assert.equal(workItemGets, 1, "successful helper should preflight work item once");
  assert.equal(actionProofPosts, 1, "successful helper should POST one action proof");
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
  assert.equal(actionProofPosts, 1, "unknown work must not POST an action proof");
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

  console.log(
    JSON.stringify(
      {
        smoke: "codex-record-completion-proof-helper",
        helper: "codex:record-completion-proof",
        proof_native_records_used: ["action_records", "work_events", "coordination_events"],
        work_item_gets: workItemGets,
        action_proof_posts: actionProofPosts,
        work_event_posts: workEventPosts,
        legacy_action_record_posts: forbiddenLegacyActionRecordPosts,
        state_entries_delta: after.state_entries - before.state_entries,
        state_transitions_delta: after.state_transitions - before.state_transitions,
        external_state_entries_delta: after.external_state_entries - before.external_state_entries,
        action_records_delta: after.action_records - before.action_records,
        work_events_delta: after.work_events - before.work_events,
        coordination_events_delta: after.coordination_events - before.coordination_events,
        proof_action_record_state_key: proofActionRecord.state_key,
        unknown_work_failed_before_write: true,
        invalid_env_failed_before_route_calls: true,
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
          SELECT id, state_key, title, status
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
