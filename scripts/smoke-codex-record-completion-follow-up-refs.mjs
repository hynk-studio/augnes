import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";

const scope = "project:custom scope/202";
const workIdInput = "ag-202 follow-up";
const workId = "AG-202 FOLLOW-UP";
const sessionId = "session/with space";
const actionId = "action:completion-follow-up:1";
const workEventId = "work-event:completion-follow-up:1";
const calls = [];

let actionRecordPosts = 0;
let workEventPosts = 0;

const server = http.createServer(async (req, res) => {
  calls.push({ method: req.method, url: req.url });

  const url = new URL(req.url ?? "/", "http://localhost");
  const knownWorkPath = `/api/work/${encodeURIComponent(workId)}`;
  const knownWorkEventsPath = `${knownWorkPath}/events`;

  if (req.method === "GET" && url.pathname === knownWorkPath) {
    assert.equal(url.searchParams.get("scope"), scope);
    sendJson(res, 200, { work_id: workId, scope, title: "Completion follow-up refs" });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/actions/record") {
    const body = await readJson(req);
    assert.equal(body.scope, scope);
    assert.equal(body.work_id, workId);
    assert.equal(body.action_name, "codex_completion_follow_up_refs");
    assert.equal(body.result_status, "completed");
    assert.equal(body.result_kind, "handoff");
    actionRecordPosts += 1;
    sendJson(res, 200, {
      result: {
        action_id: actionId,
        action_record: { id: actionId },
      },
    });
    return;
  }

  if (req.method === "POST" && url.pathname === knownWorkEventsPath) {
    assert.equal(url.searchParams.get("scope"), scope);
    const body = await readJson(req);
    assert.equal(body.scope, scope);
    assert.equal(body.event_type, "handoff");
    assert.equal(body.related_action_id, actionId);
    assert.equal(body.related_pr, "https://github.com/Aurna-code/augnes/pull/202");
    workEventPosts += 1;
    sendJson(res, 200, {
      event: {
        event_id: workEventId,
        work_id: workId,
        related_action_id: actionId,
      },
    });
    return;
  }

  sendJson(res, 404, { error: `unexpected ${req.method} ${url.pathname}` });
});

try {
  await listen(server);
  const { port } = server.address();
  const apiBaseUrl = `http://127.0.0.1:${port}`;

  const success = await runCompletionHelper({
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: scope,
    CODEX_WORK_ID: workIdInput,
    CODEX_ACTION_NAME: "codex_completion_follow_up_refs",
    CODEX_RESULT_SUMMARY: "Completion helper printed follow-up review refs.",
    CODEX_RESULT_STATUS: "completed",
    CODEX_RESULT_KIND: "handoff",
    CODEX_FILES_CHANGED: "apps/augnes_apps/scripts/codex-record-completion.ts",
    CODEX_RELATED_STATE_KEYS: "coordination.evidence_pack",
    CODEX_RELATED_PR: "https://github.com/Aurna-code/augnes/pull/202",
    CODEX_SESSION_ID: sessionId,
  });
  assert.equal(success.status, 0, success.stderr);
  assert.match(success.stdout, /Augnes Codex completion recorded/);
  assert.match(success.stdout, new RegExp(`work_id: ${escapeRegExp(workId)}`));
  assert.match(success.stdout, new RegExp(`work_event_id: ${escapeRegExp(workEventId)}`));
  assert.match(success.stdout, new RegExp(`related_action_id: ${escapeRegExp(actionId)}`));
  assert.match(success.stdout, /action_record_response:/);
  assert.match(success.stdout, /work_event_response:/);
  assert.match(success.stdout, /read_only_review_refs:/);
  assert.doesNotMatch(success.stdout, /Verify work event:/);
  assert.doesNotMatch(success.stdout, /Verify action record:/);
  assert.match(
    success.stdout,
    new RegExp(
      `Verify work brief: ${escapeRegExp(
        buildReviewUrl(apiBaseUrl, `/api/work/${encodeURIComponent(workId)}/brief`, { scope }),
      )}`,
    ),
  );
  assert.match(
    success.stdout,
    new RegExp(
      `Verify state brief: ${escapeRegExp(buildReviewUrl(apiBaseUrl, "/api/state/brief", { scope }))}`,
    ),
  );
  assert.match(
    success.stdout,
    new RegExp(
      `work_brief_url: ${escapeRegExp(
        buildReviewUrl(apiBaseUrl, `/api/work/${encodeURIComponent(workId)}/brief`, { scope }),
      )}`,
    ),
  );
  assert.match(
    success.stdout,
    new RegExp(
      `state_brief_url: ${escapeRegExp(buildReviewUrl(apiBaseUrl, "/api/state/brief", { scope }))}`,
    ),
  );
  assert.match(
    success.stdout,
    new RegExp(
      `evidence_pack_url: ${escapeRegExp(
        buildReviewUrl(apiBaseUrl, "/api/evidence-pack", { scope, work_id: workId }),
      )}`,
    ),
  );
  assert.match(
    success.stdout,
    new RegExp(
      `session_trace_url: ${escapeRegExp(
        buildReviewUrl(apiBaseUrl, `/api/sessions/${encodeURIComponent(sessionId)}/trace`, {
          scope,
        }),
      )}`,
    ),
  );
  assert.match(
    success.stdout,
    /This helper records completion proof and trace notes only; it does not commit or reject state proposals\./,
  );
  assert.equal(actionRecordPosts, 1, "successful helper should POST one action record");
  assert.equal(workEventPosts, 1, "successful helper should POST one work event");
  assertNoForbiddenRouteCalls();

  const callsAfterSuccess = calls.length;
  const unknownWork = await runCompletionHelper({
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: scope,
    CODEX_WORK_ID: "AG-MISSING",
    CODEX_ACTION_NAME: "codex_completion_unknown_work",
    CODEX_RESULT_SUMMARY: "Unknown work should fail before mutation routes.",
    CODEX_RESULT_STATUS: "completed",
    CODEX_RESULT_KIND: "handoff",
  });
  assert.notEqual(unknownWork.status, 0);
  assert.match(unknownWork.stderr, /CODEX_RECORD_COMPLETION_UNKNOWN_WORK_ID/);
  assert.equal(actionRecordPosts, 1, "unknown work should not POST action record");
  assert.equal(workEventPosts, 1, "unknown work should not POST work event");
  assert.equal(calls.length, callsAfterSuccess + 1, "unknown work should only add preflight GET");

  const callsAfterUnknown = calls.length;
  const invalidMissing = await runCompletionHelper({
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: scope,
    CODEX_WORK_ID: workIdInput,
    CODEX_RESULT_SUMMARY: "Missing action name should fail before route calls.",
    CODEX_RESULT_STATUS: "completed",
    CODEX_RESULT_KIND: "handoff",
  });
  assert.notEqual(invalidMissing.status, 0);
  assert.match(invalidMissing.stderr, /CODEX_ACTION_NAME is required/);
  assert.equal(calls.length, callsAfterUnknown, "missing required env should fail before route calls");
  assertNoForbiddenRouteCalls();

  console.log(
    JSON.stringify(
      {
        smoke: "codex-record-completion-follow-up-refs",
        completion_output_refs_checked: true,
        session_trace_ref_checked: true,
        encoded_urls_checked: true,
        evidence_pack_fetch_calls: countCalls("GET", "/api/evidence-pack"),
        session_trace_fetch_calls: countSessionTraceFetches(),
        action_record_posts: actionRecordPosts,
        work_event_posts: workEventPosts,
        unknown_work_failed_before_mutation_posts: true,
        invalid_env_failed_before_route_calls: true,
        github_calls: 0,
        openai_calls: 0,
      },
      null,
      2,
    ),
  );
} finally {
  await close(server);
}

function runCompletionHelper(env) {
  const childEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    npm_config_cache: process.env.npm_config_cache ?? path.join(tmpdir(), "augnes-npm-cache"),
    ...env,
  };

  delete childEnv.GITHUB_TOKEN;
  delete childEnv.OPENAI_API_KEY;

  return new Promise((resolve) => {
    const child = spawn(
      "npm",
      ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:record-completion"],
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

function buildReviewUrl(apiBaseUrl, pathname, params) {
  const url = new URL(pathname, `${apiBaseUrl}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

function countCalls(method, pathname) {
  return calls.filter((call) => {
    const url = new URL(call.url ?? "/", "http://localhost");
    return call.method === method && url.pathname === pathname;
  }).length;
}

function countSessionTraceFetches() {
  return calls.filter((call) => {
    const url = new URL(call.url ?? "/", "http://localhost");
    return call.method === "GET" && /^\/api\/sessions\/.+\/trace$/.test(url.pathname);
  }).length;
}

function assertNoForbiddenRouteCalls() {
  assert.equal(countCalls("GET", "/api/evidence-pack"), 0, "helper should not fetch Evidence Pack");
  assert.equal(countSessionTraceFetches(), 0, "helper should not fetch Session Trace");
  assert.ok(
    calls.every((call) => {
      const url = new URL(call.url ?? "/", "http://localhost");
      return (
        (call.method === "GET" && /^\/api\/work\/[^/]+$/.test(url.pathname)) ||
        (call.method === "POST" && url.pathname === "/api/actions/record") ||
        (call.method === "POST" && /^\/api\/work\/[^/]+\/events$/.test(url.pathname))
      );
    }),
    "helper should only call bounded completion routes",
  );
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function listen(target) {
  return new Promise((resolve) => {
    target.listen(0, "127.0.0.1", resolve);
  });
}

function close(target) {
  return new Promise((resolve, reject) => {
    target.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
