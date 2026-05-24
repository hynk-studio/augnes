import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const jsonBeginMarker = "BEGIN_AUGNES_CODEX_CLOSEOUT_JSON";
const jsonEndMarker = "END_AUGNES_CODEX_CLOSEOUT_JSON";
const forbiddenPublicOverclaimPhrases = [
  "already improves",
  "evaluates PR quality",
  "detects drift at runtime",
  "repairs context automatically",
  "selects next tasks autonomously",
  "production-ready",
  "autonomous research agent",
];

const apiBaseUrl = "http://127.0.0.1:65534/base path";
const scope = "project:custom scope/205";
const workId = "AG-205 closeout/block";
const sessionId = "session/205 closeout";
const relatedPr = "https://github.com/Aurna-code/augnes/pull/205";
const actionId = "action:closeout-block:1";
const workEventId = "work-event:closeout-block:1";
const handoffRef = "handoff:closeout-block:1";
const evidencePackRef = "evidence-pack:closeout-block:1";

const commonEnv = {
  AUGNES_API_BASE_URL: apiBaseUrl,
  CODEX_SCOPE: scope,
  CODEX_WORK_ID: workId,
  CODEX_RELATED_PR: relatedPr,
  CODEX_ACTION_ID: actionId,
  CODEX_WORK_EVENT_ID: workEventId,
  CODEX_SESSION_ID: sessionId,
  CODEX_EVIDENCE_IDS: JSON.stringify(["evidence:closeout:1", "evidence:closeout:2"]),
  CODEX_EVIDENCE_PACK_REF: evidencePackRef,
  CODEX_HANDOFF_REF: handoffRef,
  CODEX_TESTS_RUN: JSON.stringify([
    "npm run smoke:codex-closeout-block passed",
    "npm run typecheck passed",
  ]),
  CODEX_TESTS_SKIPPED: "optional perspective checks not touched",
  CODEX_WARNINGS: "No warnings.",
  CODEX_BLOCKERS: "No blockers.",
  CODEX_CHANGED_FILES: JSON.stringify([
    "apps/augnes_apps/scripts/codex-closeout-block.ts",
    "scripts/smoke-codex-closeout-block.mjs",
  ]),
  CODEX_SCOPE_RISKS: "Formatting-only helper must stay non-mutating.",
  CODEX_ASSUMPTIONS: "Known refs are supplied by the caller.",
  CODEX_OPEN_QUESTIONS: "Should future callers add extra closeout sections?",
  CODEX_NEXT_GOAL:
    "Continue practical Track B Codex handoff/evidence workflow improvements with delegated compatibility bounded.",
  CODEX_DELEGATED_AUTHORITY_SCOPE: JSON.stringify(["format closeout material", "emit local JSON"]),
  CODEX_FORBIDDEN_ACTIONS: JSON.stringify([
    "posting",
    "approval",
    "merge",
    "publication",
    "Augnes state mutation",
  ]),
  CODEX_CLOSEOUT_STATUS: "ready_for_review",
};

const both = await runCloseoutBlock({
  ...commonEnv,
  CODEX_CLOSEOUT_FORMAT: "both",
  CODEX_OPERATION_MODE: "delegated",
});
assert.equal(both.status, 0, both.stderr);
assertExpectedMarkdown(both.stdout);
assertNoForbiddenPhrases(both.stdout);
assert.match(both.stdout, new RegExp(`${jsonBeginMarker}\\n`));
assert.match(both.stdout, new RegExp(`\\n${jsonEndMarker}\\n?$`));

const bothJson = extractMarkedJson(both.stdout);
assertExpectedJson(bothJson, "delegated");
assert.equal(bothJson.runtime_refs.state_brief_url, buildReviewUrl(apiBaseUrl, "/api/state/brief", { scope }));
assert.equal(
  bothJson.runtime_refs.work_brief_url,
  buildReviewUrl(apiBaseUrl, `/api/work/${encodeURIComponent(workId)}/brief`, { scope }),
);
assert.equal(
  bothJson.runtime_refs.evidence_pack_url,
  buildReviewUrl(apiBaseUrl, "/api/evidence-pack", { scope, work_id: workId }),
);
assert.equal(
  bothJson.runtime_refs.session_trace_url,
  buildReviewUrl(apiBaseUrl, `/api/sessions/${encodeURIComponent(sessionId)}/trace`, { scope }),
);

const jsonOnly = await runCloseoutBlock({
  ...commonEnv,
  CODEX_CLOSEOUT_FORMAT: "json",
  CODEX_OPERATION_MODE: "human_assisted",
});
assert.equal(jsonOnly.status, 0, jsonOnly.stderr);
assert.doesNotMatch(jsonOnly.stdout, /## Codex closeout/);
assert.doesNotMatch(jsonOnly.stdout, new RegExp(jsonBeginMarker));
assertExpectedJson(JSON.parse(jsonOnly.stdout), "human_assisted");

const markdownOnly = await runCloseoutBlock({
  ...commonEnv,
  CODEX_CLOSEOUT_FORMAT: "markdown",
  CODEX_OPERATION_MODE: "delegated",
});
assert.equal(markdownOnly.status, 0, markdownOnly.stderr);
assertExpectedMarkdown(markdownOnly.stdout);
assert.doesNotMatch(markdownOnly.stdout, new RegExp(jsonBeginMarker));
assert.doesNotMatch(markdownOnly.stdout, new RegExp(jsonEndMarker));

const minimal = await runCloseoutBlock({
  AUGNES_API_BASE_URL: apiBaseUrl,
  CODEX_SCOPE: scope,
  CODEX_CLOSEOUT_FORMAT: "both",
});
assert.equal(minimal.status, 0, minimal.stderr);
assert.match(minimal.stdout, /work_id: Not provided\./);
assert.match(minimal.stdout, /action_id: Not provided\./);
assert.match(minimal.stdout, /None reported\./);
const minimalJson = extractMarkedJson(minimal.stdout);
assert.equal(minimalJson.work_id, null);
assert.equal(minimalJson.related_pr, null);
assert.equal(minimalJson.runtime_refs.work_brief_url, null);
assert.equal(minimalJson.runtime_refs.evidence_pack_url, null);
assert.equal(minimalJson.runtime_refs.session_trace_url, null);
assert.equal(minimalJson.evidence_completion_refs.action_id, null);
assert.equal(minimalJson.evidence_completion_refs.work_event_id, null);
assert.deepEqual(minimalJson.changed_files, []);

const invalidList = await runCloseoutBlock({
  ...commonEnv,
  CODEX_EVIDENCE_IDS: '["evidence:ok", 12]',
});
assert.notEqual(invalidList.status, 0);
assert.match(invalidList.stderr, /CODEX_CLOSEOUT_BLOCK_INVALID_LIST_ENV CODEX_EVIDENCE_IDS/);
assert.equal(invalidList.stdout, "");

const invalidFormat = await runCloseoutBlock({
  ...commonEnv,
  CODEX_CLOSEOUT_FORMAT: "xml",
});
assert.notEqual(invalidFormat.status, 0);
assert.match(invalidFormat.stderr, /CODEX_CLOSEOUT_BLOCK_INVALID_FORMAT/);
assert.equal(invalidFormat.stdout, "");

const invalidOperationMode = await runCloseoutBlock({
  ...commonEnv,
  CODEX_OPERATION_MODE: "automatic",
});
assert.notEqual(invalidOperationMode.status, 0);
assert.match(invalidOperationMode.stderr, /CODEX_CLOSEOUT_BLOCK_INVALID_OPERATION_MODE/);
assert.equal(invalidOperationMode.stdout, "");

const invalidBaseUrl = await runCloseoutBlock({
  ...commonEnv,
  AUGNES_API_BASE_URL: "not a url",
});
assert.notEqual(invalidBaseUrl.status, 0);
assert.match(invalidBaseUrl.stderr, /CODEX_CLOSEOUT_BLOCK_INVALID_BASE_URL/);
assert.equal(invalidBaseUrl.stdout, "");

console.log(
  JSON.stringify(
    {
      smoke: "codex-closeout-block",
      markdown_headings_checked: true,
      both_mode_json_markers_checked: true,
      json_only_parseable_without_markdown: true,
      markdown_only_without_json_markers: true,
      delegated_operation_note_checked: true,
      encoded_runtime_refs_checked: true,
      evidence_completion_refs_checked: true,
      authority_boundary_checked: true,
      missing_optional_values_checked: true,
      forbidden_public_overclaims_checked: true,
      invalid_list_env_failed_before_printing: true,
      invalid_format_failed_before_printing: true,
      invalid_operation_mode_failed_before_printing: true,
      invalid_base_url_failed_before_printing: true,
      http_server_needed: false,
      fetch_calls: 0,
      openai_calls: 0,
      github_calls: 0,
      mutation_routes_called: 0,
    },
    null,
    2,
  ),
);

function runCloseoutBlock(env) {
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
      ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:closeout-block"],
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

function assertExpectedMarkdown(output) {
  for (const heading of [
    "## Codex closeout",
    "### Changed files",
    "### Tests run/results",
    "### Skipped tests",
    "### Runtime/Augnes refs",
    "### Evidence / completion refs",
    "### Warnings",
    "### Blockers",
    "### Scope risks",
    "### Assumptions",
    "### Questions requiring user/PM judgment",
    "### Delegated operation note",
    "### Recommended next goal",
    "### Authority boundary",
  ]) {
    assert.match(output, new RegExp(escapeRegExp(heading)));
  }

  for (const expected of [
    "operation_mode: delegated",
    "ready_for_review",
    "apps/augnes_apps/scripts/codex-closeout-block.ts",
    "scripts/smoke-codex-closeout-block.mjs",
    "npm run smoke:codex-closeout-block passed",
    "optional perspective checks not touched",
    "No warnings.",
    "No blockers.",
    "Formatting-only helper must stay non-mutating.",
    "Known refs are supplied by the caller.",
    "Should future callers add extra closeout sections?",
    commonEnv.CODEX_NEXT_GOAL,
    buildReviewUrl(apiBaseUrl, "/api/state/brief", { scope }),
    buildReviewUrl(apiBaseUrl, `/api/work/${encodeURIComponent(workId)}/brief`, { scope }),
    buildReviewUrl(apiBaseUrl, "/api/evidence-pack", { scope, work_id: workId }),
    buildReviewUrl(apiBaseUrl, `/api/sessions/${encodeURIComponent(sessionId)}/trace`, { scope }),
    "evidence:closeout:1",
    "evidence:closeout:2",
    actionId,
    workEventId,
    relatedPr,
    handoffRef,
    evidencePackRef,
    "Delegated operation note: this block may be consumed by a delegated Codex workflow as closeout material, but this helper does not perform posting, approval, merge, publication, provider calls, or Augnes state mutation.",
    "The helper prints closeout/handoff material only.",
    "It does not call Augnes runtime routes.",
    "It does not call GitHub/OpenAI.",
    "It does not create evidence, proof, readiness, benchmark, score, state transition, proposal commit/reject, publication, approval, PR comment, PR review, merge, or PR mutation.",
    "it does not itself grant or exercise authority",
  ]) {
    assert.match(output, new RegExp(escapeRegExp(expected)));
  }
}

function assertExpectedJson(parsed, expectedOperationMode) {
  assert.equal(parsed.helper, "codex:closeout-block");
  assert.equal(parsed.version, "1");
  assert.equal(parsed.operation_mode, expectedOperationMode);
  assert.equal(parsed.closeout_status, "ready_for_review");
  assert.equal(parsed.scope, scope);
  assert.equal(parsed.work_id, workId);
  assert.equal(parsed.related_pr, relatedPr);
  assert.deepEqual(parsed.changed_files, [
    "apps/augnes_apps/scripts/codex-closeout-block.ts",
    "scripts/smoke-codex-closeout-block.mjs",
  ]);
  assert.deepEqual(parsed.tests_run, [
    "npm run smoke:codex-closeout-block passed",
    "npm run typecheck passed",
  ]);
  assert.deepEqual(parsed.tests_skipped, ["optional perspective checks not touched"]);
  assert.deepEqual(parsed.evidence_completion_refs.evidence_ids, [
    "evidence:closeout:1",
    "evidence:closeout:2",
  ]);
  assert.equal(parsed.evidence_completion_refs.action_id, actionId);
  assert.equal(parsed.evidence_completion_refs.work_event_id, workEventId);
  assert.equal(parsed.evidence_completion_refs.related_pr, relatedPr);
  assert.equal(parsed.evidence_completion_refs.handoff_ref, handoffRef);
  assert.equal(parsed.evidence_completion_refs.evidence_pack_ref, evidencePackRef);
  assert.deepEqual(parsed.warnings, ["No warnings."]);
  assert.deepEqual(parsed.blockers, ["No blockers."]);
  assert.deepEqual(parsed.scope_risks, ["Formatting-only helper must stay non-mutating."]);
  assert.deepEqual(parsed.assumptions, ["Known refs are supplied by the caller."]);
  assert.deepEqual(parsed.open_questions, ["Should future callers add extra closeout sections?"]);
  assert.deepEqual(parsed.delegated_authority_scope, ["format closeout material", "emit local JSON"]);
  assert.deepEqual(parsed.forbidden_actions, [
    "posting",
    "approval",
    "merge",
    "publication",
    "Augnes state mutation",
  ]);
  assert.equal(parsed.next_goal, commonEnv.CODEX_NEXT_GOAL);
  assert.match(parsed.authority_boundary, /does not itself grant or exercise authority/);
  assertNoForbiddenPhrases(JSON.stringify(parsed));
}

function extractMarkedJson(output) {
  const begin = output.indexOf(jsonBeginMarker);
  const end = output.indexOf(jsonEndMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + jsonBeginMarker.length, end).trim());
}

function assertNoForbiddenPhrases(output) {
  for (const phrase of forbiddenPublicOverclaimPhrases) {
    assert.doesNotMatch(output, new RegExp(escapeRegExp(phrase), "i"));
  }
}

function buildReviewUrl(apiBaseUrlValue, pathname, params) {
  const url = new URL(pathname, `${apiBaseUrlValue.replace(/\/+$/, "")}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
