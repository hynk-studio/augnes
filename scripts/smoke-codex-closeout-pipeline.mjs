import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";

const beginMarker = "BEGIN_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const endMarker = "END_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const forbiddenPublicOverclaimPhrases = [
  "already improves",
  "evaluates PR quality",
  "detects drift at runtime",
  "repairs context automatically",
  "selects next tasks autonomously",
  "production-ready",
  "autonomous research agent",
];

const scope = "project:custom scope/207";
const workId = "AG-207 closeout/pipeline";
const sessionId = "session/207 pipeline";
const fakeGithubToken = "fake-gh-token-closeout-pipeline";
const fakeOpenAiKey = "fake-openai-key-closeout-pipeline";

let calls = [];
let failStateBrief = false;
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
    sendJson(res, failStateBrief && url.pathname === "/api/state/brief" ? 500 : 200, {
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

  const both = await runPipeline({
    ...completeEnv(apiBaseUrl),
    CODEX_CLOSEOUT_PIPELINE_OUTPUT: "both",
    CODEX_OPERATION_MODE: "delegated",
  });
  assert.equal(both.status, 0, both.stderr);
  assertExpectedSummary(both.stdout, "delegated", true, "pass");
  assert.match(both.stdout, /## Codex closeout/);
  assert.match(both.stdout, new RegExp(`${beginMarker}\\n`));
  assert.match(both.stdout, new RegExp(`\\n${endMarker}\\n?$`));
  assertNoForbiddenPhrases(both.stdout);
  assertNoSecrets(both.stdout + both.stderr);
  const bothJson = extractPipelineJson(both.stdout);
  assertExpectedPipelineJson(bothJson, "delegated", true, "pass");

  const jsonOnly = await runPipeline({
    ...completeEnv(apiBaseUrl),
    CODEX_CLOSEOUT_PIPELINE_OUTPUT: "json",
    CODEX_OPERATION_MODE: "human_assisted",
  });
  assert.equal(jsonOnly.status, 0, jsonOnly.stderr);
  assert.doesNotMatch(jsonOnly.stdout, /Codex closeout pipeline/);
  assert.doesNotMatch(jsonOnly.stdout, new RegExp(beginMarker));
  assertExpectedPipelineJson(JSON.parse(jsonOnly.stdout), "human_assisted", false, "pass");

  const summaryOnly = await runPipeline({
    ...completeEnv(apiBaseUrl),
    CODEX_CLOSEOUT_PIPELINE_OUTPUT: "summary",
    CODEX_OPERATION_MODE: "delegated",
  });
  assert.equal(summaryOnly.status, 0, summaryOnly.stderr);
  assertExpectedSummary(summaryOnly.stdout, "delegated", true, "pass");
  assert.match(summaryOnly.stdout, /## Codex closeout/);
  assert.doesNotMatch(summaryOnly.stdout, new RegExp(beginMarker));
  assert.doesNotMatch(summaryOnly.stdout, /BEGIN_AUGNES_CODEX_CLOSEOUT_JSON/);

  const parentJsonFormat = await runPipeline({
    ...completeEnv(apiBaseUrl),
    CODEX_CLOSEOUT_PIPELINE_OUTPUT: "json",
    CODEX_CLOSEOUT_FORMAT: "json",
  });
  assert.equal(parentJsonFormat.status, 0, parentJsonFormat.stderr);
  assertExpectedPipelineJson(JSON.parse(parentJsonFormat.stdout), "delegated", true, "pass");

  const parentMarkdownFormat = await runPipeline({
    ...completeEnv(apiBaseUrl),
    CODEX_CLOSEOUT_PIPELINE_OUTPUT: "json",
    CODEX_CLOSEOUT_FORMAT: "markdown",
  });
  assert.equal(parentMarkdownFormat.status, 0, parentMarkdownFormat.stderr);
  assertExpectedPipelineJson(JSON.parse(parentMarkdownFormat.stdout), "delegated", true, "pass");

  const needsReview = await runPipeline({
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: scope,
    CODEX_WORK_ID: workId,
    CODEX_RELATED_PR: "https://github.com/Aurna-code/augnes/pull/207",
    CODEX_CLOSEOUT_PIPELINE_OUTPUT: "json",
    CODEX_OPERATION_MODE: "delegated",
  });
  assert.equal(needsReview.status, 0, needsReview.stderr);
  const needsReviewJson = JSON.parse(needsReview.stdout);
  assert.equal(needsReviewJson.pipeline_status, "needs_review");
  assert.equal(needsReviewJson.closeout_check.validation_status, "needs_review");

  const blockFailed = await runPipeline({
    ...completeEnv(apiBaseUrl),
    CODEX_EVIDENCE_IDS: '["evidence:ok", 12]',
  });
  assert.notEqual(blockFailed.status, 0);
  assert.match(blockFailed.stderr, /CODEX_CLOSEOUT_PIPELINE_BLOCK_FAILED/);

  calls = [];
  const readRefs = await runPipeline({
    ...completeEnv(apiBaseUrl),
    CODEX_CLOSEOUT_PIPELINE_OUTPUT: "json",
    CODEX_CLOSEOUT_CHECK_READ_REFS: "true",
  });
  assert.equal(readRefs.status, 0, readRefs.stderr);
  assertExpectedPipelineJson(JSON.parse(readRefs.stdout), "delegated", true, "pass");
  assertReadOnlyCallsOnly();

  calls = [];
  failStateBrief = true;
  const checkFailed = await runPipeline({
    ...completeEnv(apiBaseUrl),
    CODEX_CLOSEOUT_CHECK_READ_REFS: "true",
  });
  failStateBrief = false;
  assert.notEqual(checkFailed.status, 0);
  assert.match(checkFailed.stderr, /CODEX_CLOSEOUT_PIPELINE_CHECK_FAILED/);
  assert.match(checkFailed.stderr, /CODEX_CLOSEOUT_CHECK_READ_REF_FAILED/);
  assertReadOnlyCallsOnly();

  console.log(
    JSON.stringify(
      {
        smoke: "codex-closeout-pipeline",
        both_mode_checked: true,
        json_only_checked: true,
        summary_only_checked: true,
        parent_closeout_format_json_ignored: true,
        parent_closeout_format_markdown_ignored: true,
        needs_review_checked: true,
        block_failure_checked: true,
        check_failure_checked: true,
        read_ref_mode_get_only: true,
        child_env_secret_stripping_checked: true,
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

function completeEnv(apiBaseUrl) {
  return {
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: scope,
    CODEX_WORK_ID: workId,
    CODEX_RELATED_PR: "https://github.com/Aurna-code/augnes/pull/207",
    CODEX_ACTION_ID: "action:closeout-pipeline:1",
    CODEX_WORK_EVENT_ID: "work-event:closeout-pipeline:1",
    CODEX_SESSION_ID: sessionId,
    CODEX_EVIDENCE_IDS: JSON.stringify(["evidence:closeout-pipeline:1"]),
    CODEX_TESTS_RUN: JSON.stringify(["npm run smoke:codex-closeout-pipeline passed"]),
    CODEX_CHANGED_FILES: JSON.stringify([
      "apps/augnes_apps/scripts/codex-closeout-pipeline.ts",
      "scripts/smoke-codex-closeout-pipeline.mjs",
    ]),
    CODEX_NEXT_GOAL:
      "Continue delegated-compatible Track B Codex workflow by adding policy-gated action planning before actuation.",
    CODEX_DELEGATED_AUTHORITY_SCOPE: JSON.stringify(["produce local closeout material", "validate local closeout material"]),
    CODEX_FORBIDDEN_ACTIONS: JSON.stringify(["posting", "approval", "merge", "publication", "state mutation"]),
    CODEX_CLOSEOUT_STATUS: "ready_for_review",
    CODEX_OPERATION_MODE: "delegated",
  };
}

function runPipeline(env) {
  const childEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    npm_config_cache: process.env.npm_config_cache ?? path.join(tmpdir(), "augnes-npm-cache"),
    GITHUB_TOKEN: fakeGithubToken,
    OPENAI_API_KEY: fakeOpenAiKey,
    ...env,
  };

  return new Promise((resolve) => {
    const child = spawn(
      "npm",
      ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:closeout-pipeline"],
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
      resolve({ status, stdout, stderr });
    });
  });
}

function assertExpectedSummary(output, operationMode, delegatedConsumption, pipelineStatus) {
  assert.match(output, /Codex closeout pipeline/);
  assert.match(output, new RegExp(`operation_mode: ${operationMode}`));
  assert.match(output, new RegExp(`delegated_consumption: ${delegatedConsumption}`));
  assert.match(output, new RegExp(`pipeline_status: ${pipelineStatus}`));
  assert.match(output, /closeout_status: ready_for_review/);
  assert.match(output, new RegExp(`scope: ${escapeRegExp(scope)}`));
  assert.match(output, new RegExp(`work_id: ${escapeRegExp(workId)}`));
  assert.match(output, /changed_files count: 2/);
  assert.match(output, /tests_run count: 1/);
  assert.match(output, /evidence_ids count: 1/);
  assert.match(output, /blockers count: 0/);
  assert.match(output, /warnings count: 0/);
  assert.match(output, /read_ref_checks: 0 checked, 0 failed/);
  assert.match(output, /recommended_next_action:/);
  assert.match(output, /authority_boundary:/);
  if (operationMode === "delegated") {
    assert.match(output, /Delegated note: this pipeline validates closeout material/);
  }
}

function assertExpectedPipelineJson(parsed, operationMode, delegatedConsumption, pipelineStatus) {
  assert.equal(parsed.helper, "codex:closeout-pipeline");
  assert.equal(parsed.version, 1);
  assert.equal(parsed.operation_mode, operationMode);
  assert.equal(parsed.delegated_consumption, delegatedConsumption);
  assert.equal(parsed.pipeline_status, pipelineStatus);
  assert.equal(parsed.closeout_status, "ready_for_review");
  assert.equal(parsed.scope, scope);
  assert.equal(parsed.work_id, workId);
  assert.equal(parsed.closeout.helper, "codex:closeout-block");
  assert.equal(parsed.closeout_check.helper, "codex:closeout-check");
  assert.equal(parsed.closeout_check.validation_status, pipelineStatus);
  assert.equal(typeof parsed.recommended_next_action, "string");
  assert.ok(parsed.recommended_next_action.length > 0);
  assert.match(parsed.authority_boundary, /does not call GitHub\/OpenAI/);
  assert.match(parsed.authority_boundary, /does not itself exercise delegated authority/);
  assertNoForbiddenPhrases(JSON.stringify(parsed));
}

function extractPipelineJson(output) {
  const begin = output.indexOf(beginMarker);
  const end = output.indexOf(endMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + beginMarker.length, end).trim());
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

function assertNoSecrets(output) {
  assert.doesNotMatch(output, new RegExp(escapeRegExp(fakeGithubToken)));
  assert.doesNotMatch(output, new RegExp(escapeRegExp(fakeOpenAiKey)));
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
