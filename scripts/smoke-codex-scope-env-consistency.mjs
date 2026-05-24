import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";

const codexScope = "project:custom-scope";
const legacyAugnesScope = "project:legacy-scope";
const defaultScope = "project:augnes";
const calls = [];

let expectedScope = codexScope;
let actionSequence = 0;

const server = http.createServer(async (req, res) => {
  calls.push({ method: req.method, url: req.url });

  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/state/brief") {
    assert.equal(url.searchParams.get("scope"), expectedScope);
    sendJson(res, 200, stateBriefFixture());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/actions/record") {
    const body = await readJson(req);
    assert.equal(body.scope, expectedScope);
    actionSequence += 1;
    sendJson(res, 200, {
      action_id: `action:scope-env:${actionSequence}`,
      status: "recorded",
      received_scope: body.scope,
      received_action_name: body.action_name,
    });
    return;
  }

  sendJson(res, 404, { error: "not found" });
});

try {
  await listen(server);
  const { port } = server.address();
  const apiBaseUrl = `http://127.0.0.1:${port}`;

  await assertRecordResultScope({
    apiBaseUrl,
    expected: codexScope,
    envMode: "codex-and-augnes",
    label: "record-result CODEX_SCOPE precedence",
  });
  await assertRecordResultScope({
    apiBaseUrl,
    expected: legacyAugnesScope,
    envMode: "augnes-only",
    label: "record-result AUGNES_SCOPE fallback",
  });
  await assertRecordResultScope({
    apiBaseUrl,
    expected: defaultScope,
    envMode: "neither",
    label: "record-result default scope fallback",
  });

  await assertHandoffCheckScope({
    apiBaseUrl,
    expected: codexScope,
    envMode: "codex-and-augnes",
    label: "handoff-check CODEX_SCOPE precedence",
  });
  await assertHandoffCheckScope({
    apiBaseUrl,
    expected: legacyAugnesScope,
    envMode: "augnes-only",
    label: "handoff-check AUGNES_SCOPE fallback",
  });
  await assertHandoffCheckScope({
    apiBaseUrl,
    expected: defaultScope,
    envMode: "neither",
    label: "handoff-check default scope fallback",
  });

  console.log(
    JSON.stringify(
      {
        smoke: "codex-scope-env-consistency",
        record_result_codex_scope_precedence_checked: true,
        record_result_augnes_scope_fallback_checked: true,
        record_result_default_scope_checked: true,
        handoff_check_codex_scope_precedence_checked: true,
        handoff_check_augnes_scope_fallback_checked: true,
        handoff_check_default_scope_checked: true,
        openai_calls: 0,
        github_calls: 0,
        mutation_routes_called: {
          route: "/api/actions/record",
          bounded_stub_only: true,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await close(server);
}

async function assertRecordResultScope({ apiBaseUrl, expected, envMode, label }) {
  resetCalls(expected);
  const result = await runAppHelper({
    script: "codex:record-result",
    apiBaseUrl,
    envMode,
  });
  assert.equal(result.status, 0, `${label}: ${result.stderr}`);
  assert.match(result.stdout, new RegExp(`scope: ${escapeRegExp(expected)}`));
  assert.equal(countCalls("POST", "/api/actions/record"), 1, label);
  assert.equal(countCalls("GET", "/api/state/brief"), 0, label);
  assertOnlyExpectedRoutes();
}

async function assertHandoffCheckScope({ apiBaseUrl, expected, envMode, label }) {
  resetCalls(expected);
  const result = await runAppHelper({
    script: "codex:handoff-check",
    apiBaseUrl,
    envMode,
  });
  assert.equal(result.status, 0, `${label}: ${result.stderr}`);
  assert.match(result.stdout, /Codex handoff check/);
  assert.equal(countCalls("GET", "/api/state/brief"), 2, label);
  assert.equal(countCalls("POST", "/api/actions/record"), 1, label);
  assertOnlyExpectedRoutes();
}

function runAppHelper({ script, apiBaseUrl, envMode }) {
  const env = {
    ...process.env,
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_ACTION_NAME: "codex_scope_env_consistency",
    CODEX_RESULT_SUMMARY: "Scope env consistency smoke.",
    CODEX_FILES_CHANGED: "apps/augnes_apps/scripts/codex-record-result.ts",
    OPENAI_API_KEY: "smoke-openai-key-must-not-be-used",
  };

  if (envMode === "codex-and-augnes") {
    env.CODEX_SCOPE = codexScope;
    env.AUGNES_SCOPE = legacyAugnesScope;
  } else if (envMode === "augnes-only") {
    delete env.CODEX_SCOPE;
    env.AUGNES_SCOPE = legacyAugnesScope;
  } else {
    delete env.CODEX_SCOPE;
    delete env.AUGNES_SCOPE;
  }

  return new Promise((resolve) => {
    const child = spawn("npm", ["--prefix", "apps/augnes_apps", "run", script], {
      cwd: process.cwd(),
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

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
      resolve({ status, stdout, stderr });
    });
  });
}

function resetCalls(scope) {
  calls.length = 0;
  expectedScope = scope;
}

function stateBriefFixture() {
  return {
    runtime: "augnes",
    scope: expectedScope,
    active_state: [],
    pending_proposals: [],
    recent_actions: [],
    open_tensions: [],
  };
}

function countCalls(method, pathname) {
  return calls.filter((call) => {
    const url = new URL(call.url ?? "/", "http://localhost");
    return call.method === method && url.pathname === pathname;
  }).length;
}

function assertOnlyExpectedRoutes() {
  assert.ok(
    calls.every((call) => {
      const url = new URL(call.url ?? "/", "http://localhost");
      return (
        (call.method === "GET" && url.pathname === "/api/state/brief") ||
        (call.method === "POST" && url.pathname === "/api/actions/record")
      );
    }),
    "scope env consistency smoke should only call bounded helper routes",
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
