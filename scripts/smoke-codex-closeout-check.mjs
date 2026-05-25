import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";

const closeoutBeginMarker = "BEGIN_AUGNES_CODEX_CLOSEOUT_JSON";
const closeoutEndMarker = "END_AUGNES_CODEX_CLOSEOUT_JSON";
const checkBeginMarker = "BEGIN_AUGNES_CODEX_CLOSEOUT_CHECK_JSON";
const checkEndMarker = "END_AUGNES_CODEX_CLOSEOUT_CHECK_JSON";
const forbiddenPublicOverclaimPhrases = [
  "already improves",
  "evaluates PR quality",
  "detects drift at runtime",
  "repairs context automatically",
  "selects next tasks autonomously",
  "production-ready",
  "autonomous research agent",
];

const scope = "project:custom scope/206";
const workId = "AG-206 closeout/check";
const sessionId = "session/206 closeout";
const relatedPr = "https://github.com/Aurna-code/augnes/pull/206";
const authorityBoundary =
  "The helper prints closeout/handoff material only. It does not call Augnes runtime routes. It does not call GitHub/OpenAI. It does not create evidence, proof, readiness, benchmark, score, state transition, proposal commit/reject, publication, approval, PR comment, PR review, merge, or PR mutation. It is usable by human-assisted or delegated Codex workflows, but it does not itself grant or exercise authority.";

let calls = [];
const server = http.createServer((req, res) => {
  calls.push({ method: req.method, url: req.url });
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "method not allowed" });
    return;
  }

  if (
    url.pathname === "/api/state/brief" ||
    url.pathname === `/api/work/${encodeURIComponent(workId)}/brief` ||
    url.pathname === "/api/evidence-pack" ||
    url.pathname === `/api/sessions/${encodeURIComponent(sessionId)}/trace`
  ) {
    sendJson(res, url.searchParams.get("force_500") === "true" ? 500 : 200, {
      ok: true,
      path: url.pathname,
    });
    return;
  }

  sendJson(res, 404, { error: `unexpected ${req.method} ${url.pathname}` });
});

try {
  await listen(server);
  const { port } = server.address();
  const apiBaseUrl = `http://127.0.0.1:${port}`;
  const delegatedCloseout = buildCloseout({ apiBaseUrl, operationMode: "delegated" });
  const humanCloseout = buildCloseout({ apiBaseUrl, operationMode: "human_assisted" });
  const markedCloseout = [
    "## Codex closeout",
    closeoutBeginMarker,
    JSON.stringify(delegatedCloseout, null, 2),
    closeoutEndMarker,
  ].join("\n");

  const rawJson = await runCloseoutCheck({
    env: { CODEX_CLOSEOUT_JSON: JSON.stringify(delegatedCloseout) },
  });
  assert.equal(rawJson.status, 0, rawJson.stderr);
  assertExpectedSummary(rawJson.stdout, "delegated", true, "pass");
  assertExpectedResult(extractCheckJson(rawJson.stdout), "delegated", true, "pass");
  assertNoForbiddenPhrases(rawJson.stdout);
  assert.equal(calls.length, 0, "default mode should not fetch runtime refs");

  const marked = await runCloseoutCheck({
    env: { CODEX_CLOSEOUT_JSON: markedCloseout },
  });
  assert.equal(marked.status, 0, marked.stderr);
  assertExpectedResult(extractCheckJson(marked.stdout), "delegated", true, "pass");

  const filePath = path.join(tmpdir(), `augnes-closeout-check-${process.pid}.json`);
  await writeFile(filePath, JSON.stringify(humanCloseout), "utf8");
  const fileInput = await runCloseoutCheck({
    env: { CODEX_CLOSEOUT_JSON_FILE: filePath },
  });
  assert.equal(fileInput.status, 0, fileInput.stderr);
  assertExpectedResult(extractCheckJson(fileInput.stdout), "human_assisted", false, "pass");

  const stdinInput = await runCloseoutCheck({
    stdin: JSON.stringify(humanCloseout),
  });
  assert.equal(stdinInput.status, 0, stdinInput.stderr);
  assertExpectedResult(extractCheckJson(stdinInput.stdout), "human_assisted", false, "pass");

  const incomplete = await runCloseoutCheck({
    env: {
      CODEX_CLOSEOUT_JSON: JSON.stringify({
        ...delegatedCloseout,
        changed_files: [],
        tests_run: [],
        next_goal: null,
        evidence_completion_refs: {
          ...delegatedCloseout.evidence_completion_refs,
          evidence_ids: [],
          action_id: null,
          work_event_id: null,
        },
      }),
    },
  });
  assert.equal(incomplete.status, 0, incomplete.stderr);
  const incompleteJson = extractCheckJson(incomplete.stdout);
  assert.equal(incompleteJson.validation_status, "needs_review");
  assert.deepEqual(incompleteJson.missing_recommended_fields, [
    "tests_run",
    "changed_files",
    "next_goal",
    "evidence_or_completion_ref",
  ]);

  const invalidJson = await runCloseoutCheck({
    env: { CODEX_CLOSEOUT_JSON: "{nope" },
  });
  assert.notEqual(invalidJson.status, 0);
  assert.match(invalidJson.stderr, /CODEX_CLOSEOUT_CHECK_INVALID_JSON/);
  assert.equal(invalidJson.stdout, "");

  const missingInput = await runCloseoutCheck({});
  assert.notEqual(missingInput.status, 0);
  assert.match(missingInput.stderr, /CODEX_CLOSEOUT_CHECK_MISSING_INPUT/);
  assert.equal(missingInput.stdout, "");

  const invalidOperationMode = await runCloseoutCheck({
    env: {
      CODEX_CLOSEOUT_JSON: JSON.stringify({
        ...delegatedCloseout,
        operation_mode: "automatic",
      }),
    },
  });
  assert.notEqual(invalidOperationMode.status, 0);
  assert.match(invalidOperationMode.stderr, /CODEX_CLOSEOUT_CHECK_INVALID_SHAPE/);
  assert.equal(invalidOperationMode.stdout, "");

  const invalidUrl = await runCloseoutCheck({
    env: {
      CODEX_CLOSEOUT_JSON: JSON.stringify({
        ...delegatedCloseout,
        runtime_refs: {
          ...delegatedCloseout.runtime_refs,
          state_brief_url: "not a url",
        },
      }),
    },
  });
  assert.notEqual(invalidUrl.status, 0);
  assert.match(invalidUrl.stderr, /CODEX_CLOSEOUT_CHECK_INVALID_URL/);
  assert.equal(invalidUrl.stdout, "");

  const invalidReadRefs = await runCloseoutCheck({
    env: {
      CODEX_CLOSEOUT_JSON: JSON.stringify(delegatedCloseout),
      CODEX_CLOSEOUT_CHECK_READ_REFS: "sometimes",
    },
  });
  assert.notEqual(invalidReadRefs.status, 0);
  assert.match(invalidReadRefs.stderr, /CODEX_CLOSEOUT_CHECK_INVALID_READ_REFS/);
  assert.equal(invalidReadRefs.stdout, "");

  calls = [];
  const forbiddenProviderRef = await runCloseoutCheck({
    env: {
      CODEX_CLOSEOUT_JSON: JSON.stringify({
        ...delegatedCloseout,
        runtime_refs: {
          ...delegatedCloseout.runtime_refs,
          state_brief_url: "https://api.openai.com/api/state/brief?scope=project%3Aaugnes",
        },
      }),
      CODEX_CLOSEOUT_CHECK_READ_REFS: "true",
    },
  });
  assert.notEqual(forbiddenProviderRef.status, 0);
  assert.match(forbiddenProviderRef.stderr, /CODEX_CLOSEOUT_CHECK_INVALID_URL/);
  assert.equal(forbiddenProviderRef.stdout, "");
  assert.equal(calls.length, 0, "forbidden provider ref should fail before fetch");

  calls = [];
  const unexpectedPathRef = await runCloseoutCheck({
    env: {
      CODEX_CLOSEOUT_JSON: JSON.stringify({
        ...delegatedCloseout,
        runtime_refs: {
          ...delegatedCloseout.runtime_refs,
          state_brief_url: `${apiBaseUrl}/api/actions/record?scope=${encodeURIComponent(scope)}`,
        },
      }),
      CODEX_CLOSEOUT_CHECK_READ_REFS: "true",
    },
  });
  assert.notEqual(unexpectedPathRef.status, 0);
  assert.match(unexpectedPathRef.stderr, /CODEX_CLOSEOUT_CHECK_INVALID_URL/);
  assert.equal(unexpectedPathRef.stdout, "");
  assert.equal(calls.length, 0, "unexpected read-ref path should fail before fetch");

  calls = [];
  const mixedOriginRef = await runCloseoutCheck({
    env: {
      CODEX_CLOSEOUT_JSON: JSON.stringify({
        ...delegatedCloseout,
        runtime_refs: {
          ...delegatedCloseout.runtime_refs,
          evidence_pack_url: `http://localhost:${port}/api/evidence-pack?scope=${encodeURIComponent(
            scope,
          )}&work_id=${encodeURIComponent(workId)}`,
        },
      }),
      CODEX_CLOSEOUT_CHECK_READ_REFS: "true",
    },
  });
  assert.notEqual(mixedOriginRef.status, 0);
  assert.match(mixedOriginRef.stderr, /CODEX_CLOSEOUT_CHECK_INVALID_URL/);
  assert.equal(mixedOriginRef.stdout, "");
  assert.equal(calls.length, 0, "mixed-origin read refs should fail before fetch");

  calls = [];
  const readRefs = await runCloseoutCheck({
    env: {
      CODEX_CLOSEOUT_JSON: JSON.stringify(delegatedCloseout),
      CODEX_CLOSEOUT_CHECK_READ_REFS: "true",
    },
  });
  assert.equal(readRefs.status, 0, readRefs.stderr);
  const readRefsJson = extractCheckJson(readRefs.stdout);
  assertExpectedResult(readRefsJson, "delegated", true, "pass");
  assert.deepEqual(
    readRefsJson.read_only_ref_checks.map((check) => [check.name, check.checked, check.status, check.ok]),
    [
      ["state_brief_url", true, 200, true],
      ["work_brief_url", true, 200, true],
      ["evidence_pack_url", true, 200, true],
      ["session_trace_url", true, 200, true],
    ],
  );
  assertReadOnlyCallsOnly();

  calls = [];
  const failingCloseout = buildCloseout({ apiBaseUrl, operationMode: "delegated", failStateBrief: true });
  const failedReadRef = await runCloseoutCheck({
    env: {
      CODEX_CLOSEOUT_JSON: JSON.stringify(failingCloseout),
      CODEX_CLOSEOUT_CHECK_READ_REFS: "true",
    },
  });
  assert.notEqual(failedReadRef.status, 0);
  assert.match(failedReadRef.stderr, /CODEX_CLOSEOUT_CHECK_READ_REF_FAILED/);
  const failedReadRefJson = extractCheckJson(failedReadRef.stdout);
  assert.equal(failedReadRefJson.validation_status, "fail");
  assert.equal(failedReadRefJson.read_only_ref_checks[0].status, 500);
  assert.equal(failedReadRefJson.read_only_ref_checks[0].ok, false);
  assertReadOnlyCallsOnly();

  console.log(
    JSON.stringify(
      {
        smoke: "codex-closeout-check",
        raw_json_env_checked: true,
        marked_json_env_checked: true,
        json_file_input_checked: true,
        stdin_input_checked: true,
        delegated_consumption_checked: true,
        human_assisted_consumption_checked: true,
        incomplete_needs_review_checked: true,
        invalid_json_failed: true,
        missing_input_failed: true,
        invalid_operation_mode_failed: true,
        invalid_url_failed: true,
        invalid_read_refs_failed: true,
        forbidden_provider_ref_failed_before_fetch: true,
        unexpected_path_ref_failed_before_fetch: true,
        mixed_origin_ref_failed_before_fetch: true,
        default_mode_fetch_calls: 0,
        read_ref_mode_get_only: true,
        read_ref_mode_statuses_checked: true,
        read_ref_failure_checked: true,
        forbidden_public_overclaims_checked: true,
        openai_calls: 0,
        github_calls: 0,
        provider_calls: 0,
        mutation_routes_called: 0,
      },
      null,
      2,
    ),
  );
} finally {
  await close(server);
}

function buildCloseout({ apiBaseUrl, operationMode, failStateBrief = false }) {
  const stateBriefUrl = new URL("/api/state/brief", `${apiBaseUrl}/`);
  stateBriefUrl.searchParams.set("scope", scope);
  if (failStateBrief) stateBriefUrl.searchParams.set("force_500", "true");

  const workBriefUrl = new URL(`/api/work/${encodeURIComponent(workId)}/brief`, `${apiBaseUrl}/`);
  workBriefUrl.searchParams.set("scope", scope);

  const evidencePackUrl = new URL("/api/evidence-pack", `${apiBaseUrl}/`);
  evidencePackUrl.searchParams.set("scope", scope);
  evidencePackUrl.searchParams.set("work_id", workId);

  const sessionTraceUrl = new URL(`/api/sessions/${encodeURIComponent(sessionId)}/trace`, `${apiBaseUrl}/`);
  sessionTraceUrl.searchParams.set("scope", scope);

  return {
    helper: "codex:closeout-block",
    version: "1",
    operation_mode: operationMode,
    closeout_status: "ready_for_review",
    scope,
    work_id: workId,
    related_pr: relatedPr,
    changed_files: [
      "apps/augnes_apps/scripts/codex-closeout-check.ts",
      "scripts/smoke-codex-closeout-check.mjs",
    ],
    tests_run: ["npm run smoke:codex-closeout-check passed"],
    tests_skipped: ["optional checks not touched"],
    runtime_refs: {
      state_brief_url: stateBriefUrl.toString(),
      work_brief_url: workBriefUrl.toString(),
      evidence_pack_url: evidencePackUrl.toString(),
      session_trace_url: sessionTraceUrl.toString(),
    },
    evidence_completion_refs: {
      evidence_ids: ["evidence:closeout-check:1"],
      action_id: "action:closeout-check:1",
      work_event_id: "work-event:closeout-check:1",
      related_pr: relatedPr,
      handoff_ref: "handoff:closeout-check:1",
      evidence_pack_ref: "evidence-pack:closeout-check:1",
    },
    warnings: [],
    blockers: [],
    scope_risks: ["Closeout checking remains material validation only."],
    assumptions: ["Refs are supplied by the caller."],
    open_questions: [],
    delegated_authority_scope: operationMode === "delegated" ? ["consume closeout material"] : [],
    forbidden_actions: ["posting", "approval", "merge", "publication", "state mutation"],
    next_goal:
      "Continue delegated-compatible Track B Codex workflow work by adding validation layers before actuation.",
    authority_boundary: authorityBoundary,
  };
}

function runCloseoutCheck({ env = {}, stdin } = {}) {
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
      ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:closeout-check"],
      {
        cwd: process.cwd(),
        env: childEnv,
        stdio: ["pipe", "pipe", "pipe"],
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
      resolve({ status, stdout, stderr });
    });

    child.stdin.end(stdin ?? "");
  });
}

function assertExpectedSummary(output, operationMode, delegatedConsumption, validationStatus) {
  assert.match(output, /Codex closeout check/);
  assert.match(output, new RegExp(`operation_mode: ${operationMode}`));
  assert.match(output, /closeout_status: ready_for_review/);
  assert.match(output, new RegExp(`scope: ${escapeRegExp(scope)}`));
  assert.match(output, new RegExp(`work_id: ${escapeRegExp(workId)}`));
  assert.match(output, new RegExp(`related_pr: ${escapeRegExp(relatedPr)}`));
  assert.match(output, /evidence_ids count: 1/);
  assert.match(output, /changed_files count: 2/);
  assert.match(output, /tests_run count: 1/);
  assert.match(output, /blockers count: 0/);
  assert.match(output, /warnings count: 0/);
  assert.match(output, new RegExp(`delegated_consumption: ${delegatedConsumption}`));
  assert.match(output, new RegExp(`validation_status: ${validationStatus}`));
}

function assertExpectedResult(parsed, operationMode, delegatedConsumption, validationStatus) {
  assert.equal(parsed.helper, "codex:closeout-check");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.validation_status, validationStatus);
  assert.equal(parsed.operation_mode, operationMode);
  assert.equal(parsed.delegated_consumption, delegatedConsumption);
  assert.equal(parsed.scope, scope);
  assert.equal(parsed.work_id, workId);
  assert.equal(parsed.related_pr, relatedPr);
  assert.deepEqual(parsed.boundary_warnings, []);
  assert.deepEqual(parsed.missing_recommended_fields, []);
  assert.deepEqual(parsed.forbidden_actions, ["posting", "approval", "merge", "publication", "state mutation"]);
  assert.deepEqual(
    parsed.delegated_authority_scope,
    operationMode === "delegated" ? ["consume closeout material"] : [],
  );
  assert.match(parsed.authority_boundary, /does not call GitHub\/OpenAI/);
  assert.match(parsed.authority_boundary, /does not itself grant or exercise authority/);
  assertNoForbiddenPhrases(JSON.stringify(parsed));
}

function extractCheckJson(output) {
  const begin = output.indexOf(checkBeginMarker);
  const end = output.indexOf(checkEndMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + checkBeginMarker.length, end).trim());
}

function assertReadOnlyCallsOnly() {
  assert.equal(calls.length, 4);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.doesNotMatch(call.url, /github|openai|provider/i);
  }
  assert.deepEqual(
    calls.map((call) => new URL(call.url, "http://localhost").pathname),
    [
      "/api/state/brief",
      `/api/work/${encodeURIComponent(workId)}/brief`,
      "/api/evidence-pack",
      `/api/sessions/${encodeURIComponent(sessionId)}/trace`,
    ],
  );
}

function assertNoForbiddenPhrases(output) {
  for (const phrase of forbiddenPublicOverclaimPhrases) {
    assert.doesNotMatch(output, new RegExp(escapeRegExp(phrase), "i"));
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
