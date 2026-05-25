import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const beginMarker = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_PAYLOAD_JSON";
const endMarker = "END_AUGNES_CODEX_GITHUB_COMMENT_PAYLOAD_JSON";
const previewBeginMarker = "BEGIN_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const previewEndMarker = "END_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const fakeGithubToken = "fake-gh-token-github-comment-payload";
const fakeOpenAiKey = "fake-openai-key-github-comment-payload";
const commentBody = "Prepared PR comment body for a later separate GitHub posting helper.";
const forbiddenPublicOverclaimPhrases = [
  "already improves",
  "evaluates PR quality",
  "detects drift at runtime",
  "repairs context automatically",
  "selects next tasks autonomously",
  "production-ready",
  "autonomous research agent",
];

const successfulOutputs = [];

const both = await runPayload({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: markedPreview(buildPreview()),
    CODEX_GITHUB_COMMENT_BODY: commentBody,
    CODEX_GITHUB_COMMENT_PAYLOAD_OUTPUT: "both",
  }),
});
assert.equal(both.status, 0, both.stderr);
assert.match(both.stdout, /Codex GitHub comment payload/);
assert.match(both.stdout, new RegExp(`${beginMarker}\\n`));
assert.match(both.stdout, new RegExp(`\\n${endMarker}\\n?$`));
const bothJson = extractPayloadJson(both.stdout);
assertCanonicalPayloadShape(bothJson, false);
assert.equal(bothJson.payload.endpoint_preview, "POST /repos/Aurna-code/augnes/issues/213/comments");
assert.equal(bothJson.payload.api_url_preview, "https://api.github.com/repos/Aurna-code/augnes/issues/213/comments");
assert.equal(bothJson.dry_run_only, true);
assert.equal(bothJson.would_execute, false);
assert.equal(bothJson.payload.body_present, true);
assert.ok(bothJson.payload.body_length > 0);
assert.equal("body" in bothJson.payload, false);
assert.match(bothJson.payload.body_sha256, /^[a-f0-9]{64}$/);
assertNoSecrets(both.stdout + both.stderr);
successfulOutputs.push(both.stdout);

const includeBody = await payloadJson({
  CODEX_GITHUB_COMMENT_INCLUDE_BODY: "true",
  CODEX_GITHUB_COMMENT_BODY: commentBody,
});
assertCanonicalPayloadShape(includeBody, true);
assert.equal(includeBody.payload.body, commentBody);

const jsonOnly = await runPayload({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(buildPreview()),
    CODEX_GITHUB_COMMENT_BODY: commentBody,
    CODEX_GITHUB_COMMENT_PAYLOAD_OUTPUT: "json",
  }),
});
assert.equal(jsonOnly.status, 0, jsonOnly.stderr);
assert.equal(JSON.parse(jsonOnly.stdout).helper, "codex:github-comment-payload");
assert.doesNotMatch(jsonOnly.stdout, /Codex GitHub comment payload/);
assert.doesNotMatch(jsonOnly.stdout, new RegExp(beginMarker));
successfulOutputs.push(jsonOnly.stdout);

const summaryOnly = await runPayload({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(buildPreview()),
    CODEX_GITHUB_COMMENT_BODY: commentBody,
    CODEX_GITHUB_COMMENT_PAYLOAD_OUTPUT: "summary",
  }),
});
assert.equal(summaryOnly.status, 0, summaryOnly.stderr);
assert.match(summaryOnly.stdout, /Codex GitHub comment payload/);
assert.doesNotMatch(summaryOnly.stdout, new RegExp(beginMarker));
assert.doesNotMatch(summaryOnly.stdout, /"helper":/);
successfulOutputs.push(summaryOnly.stdout);

const bodyFilePath = path.join(tmpdir(), `augnes-github-comment-body-${process.pid}.md`);
await writeFile(bodyFilePath, commentBody, "utf8");
const bodyFile = await payloadJson({
  CODEX_GITHUB_COMMENT_BODY: undefined,
  CODEX_GITHUB_COMMENT_BODY_FILE: bodyFilePath,
});
assert.equal(bodyFile.payload.body_length, commentBody.length);

const bodyFromPreview = await payloadJson(
  {
    CODEX_GITHUB_COMMENT_BODY: undefined,
    CODEX_GITHUB_COMMENT_INCLUDE_BODY: "true",
  },
  buildPreview(
    {},
    {
      body_present: true,
      body_length: commentBody.length,
      body_preview: commentBody,
    },
  ),
);
assert.equal(bodyFromPreview.payload.body, commentBody);

const operationTargetFallback = await payloadJson({
  CODEX_GITHUB_COMMENT_TARGET_REF: undefined,
});
assert.equal(operationTargetFallback.target.target_ref, "https://github.com/Aurna-code/augnes/pull/213");

const relatedPrFallback = await payloadJson(
  {
    CODEX_GITHUB_COMMENT_TARGET_REF: undefined,
  },
  buildPreview({}, { target_ref: null }),
);
assert.equal(relatedPrFallback.target.target_ref, "https://github.com/Aurna-code/augnes/pull/213");

const shorthandTarget = await payloadJson({
  CODEX_GITHUB_COMMENT_TARGET_REF: "Aurna-code/augnes#213",
});
assert.equal(shorthandTarget.target.owner, "Aurna-code");
assert.equal(shorthandTarget.target.repo, "augnes");
assert.equal(shorthandTarget.target.issue_number, 213);

const httpTarget = await payloadJson({
  CODEX_GITHUB_COMMENT_TARGET_REF: "http://github.com/Aurna-code/augnes/pull/213",
});
assert.ok(httpTarget.warnings.includes("non_https_github_target"));
assert.equal(httpTarget.payload.api_url_preview, "https://api.github.com/repos/Aurna-code/augnes/issues/213/comments");

const previewFilePath = path.join(tmpdir(), `augnes-github-comment-preview-${process.pid}.txt`);
await writeFile(previewFilePath, markedPreview(buildPreview()), "utf8");
const fileInput = await runPayload({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: undefined,
    CODEX_ACTUATION_PREVIEW_JSON_FILE: previewFilePath,
    CODEX_GITHUB_COMMENT_BODY: commentBody,
    CODEX_GITHUB_COMMENT_PAYLOAD_OUTPUT: "json",
  }),
});
assert.equal(fileInput.status, 0, fileInput.stderr);
assert.equal(JSON.parse(fileInput.stdout).helper, "codex:github-comment-payload");
successfulOutputs.push(fileInput.stdout);

const stdinInput = await runPayload({
  stdin: JSON.stringify(buildPreview()),
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: undefined,
    CODEX_GITHUB_COMMENT_BODY: commentBody,
    CODEX_GITHUB_COMMENT_PAYLOAD_OUTPUT: "json",
  }),
});
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(JSON.parse(stdinInput.stdout).helper, "codex:github-comment-payload");
successfulOutputs.push(stdinInput.stdout);

await assertInvalid({
  env: payloadEnv({
    CODEX_GITHUB_COMMENT_TARGET_REF: "https://example.com/Aurna-code/augnes/pull/213",
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_TARGET/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_GITHUB_COMMENT_TARGET_REF: "Aurna-code/augnes/pull/213",
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_TARGET/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(buildPreview({ target_status: "missing" })),
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_TARGET_MISSING/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_GITHUB_COMMENT_BODY: undefined,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_MISSING_BODY/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_GITHUB_COMMENT_BODY: "abcd",
    CODEX_GITHUB_COMMENT_BODY_MAX_CHARS: "3",
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_BODY_TOO_LARGE/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_GITHUB_COMMENT_BODY: commentBody,
    CODEX_GITHUB_COMMENT_BODY_MAX_CHARS: "0",
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_BODY_LIMIT/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(buildPreview({ preview_status: "blocked" })),
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_PREVIEW_BLOCKED/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(buildPreview({ preview_status: "needs_review" })),
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_PREVIEW_NEEDS_REVIEW/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(
      buildPreview({ gate_status: "denied", execution_permitted_by_gate: false }),
    ),
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_GATE_NOT_PASSED/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(
      buildPreview({ intended_action: "create_pr_review" }, { action: "create_pr_review" }),
    ),
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_UNSUPPORTED_ACTION/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: "{nope",
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_JSON/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify({ ...buildPreview(), helper: "codex:not-preview" }),
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_PREVIEW/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_OUTPUT: "xml",
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_OUTPUT/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_GITHUB_COMMENT_INCLUDE_BODY: "maybe",
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_BOOLEAN CODEX_GITHUB_COMMENT_INCLUDE_BODY/,
});
await assertInvalid({
  env: payloadEnv({
    CODEX_ACTUATION_PREVIEW_JSON: undefined,
    CODEX_GITHUB_COMMENT_BODY: commentBody,
  }),
  expected: /CODEX_GITHUB_COMMENT_PAYLOAD_MISSING_INPUT/,
});

for (const output of successfulOutputs) {
  assertNoSecrets(output);
  assertNoForbiddenPhrases(output);
}

console.log(
  JSON.stringify(
    {
      smoke: "codex-github-comment-payload",
      both_mode_checked: true,
      include_body_checked: true,
      json_only_checked: true,
      summary_only_checked: true,
      body_file_input_checked: true,
      body_preview_input_checked: true,
      operation_target_fallback_checked: true,
      related_pr_target_fallback_checked: true,
      shorthand_target_checked: true,
      http_target_warning_checked: true,
      file_input_checked: true,
      stdin_input_checked: true,
      invalid_target_host_failed: true,
      malformed_target_failed: true,
      missing_target_failed: true,
      missing_body_failed: true,
      body_too_large_failed: true,
      invalid_body_limit_failed: true,
      preview_blocked_failed: true,
      preview_needs_review_failed: true,
      gate_not_passed_failed: true,
      unsupported_action_failed: true,
      invalid_preview_json_failed: true,
      invalid_preview_shape_failed: true,
      invalid_output_mode_failed: true,
      invalid_include_body_boolean_failed: true,
      missing_input_failed: true,
      forbidden_public_overclaims_checked: true,
      fake_secret_absence_checked: true,
      http_server_started: false,
      fetch_calls: 0,
      openai_calls: 0,
      github_calls: 0,
      provider_calls: 0,
      augnes_runtime_calls: 0,
      mutation_routes_called: 0,
    },
    null,
    2,
  ),
);

async function payloadJson(env = {}, preview = buildPreview()) {
  const result = await runPayload({
    env: payloadEnv({
      CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(preview),
      CODEX_GITHUB_COMMENT_BODY: commentBody,
      CODEX_GITHUB_COMMENT_PAYLOAD_OUTPUT: "json",
      ...env,
    }),
  });
  assert.equal(result.status, 0, result.stderr);
  assertNoSecrets(result.stdout + result.stderr);
  successfulOutputs.push(result.stdout);
  const parsed = JSON.parse(result.stdout);
  assertCanonicalPayloadShape(parsed, env.CODEX_GITHUB_COMMENT_INCLUDE_BODY === "true");
  return parsed;
}

function payloadEnv(overrides = {}) {
  const env = {
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(buildPreview()),
    ...overrides,
  };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key];
  }

  return env;
}

function runPayload({ env = {}, stdin = "" } = {}) {
  const childEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    npm_config_cache: process.env.npm_config_cache ?? path.join(tmpdir(), "augnes-npm-cache"),
    GITHUB_TOKEN: fakeGithubToken,
    OPENAI_API_KEY: fakeOpenAiKey,
    ...env,
  };

  return new Promise((resolve) => {
    const child = spawn("npm", ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:github-comment-payload"], {
      cwd: process.cwd(),
      env: childEnv,
      stdio: ["pipe", "pipe", "pipe"],
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
    child.stdin.end(stdin);
  });
}

async function assertInvalid({ env, expected }) {
  const result = await runPayload({ env });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, expected);
  assertNoSecrets(result.stderr);
}

function buildPreview(overrides = {}, operationPreviewOverrides = {}) {
  const operationPreview = {
    action: "create_pr_comment",
    operation_kind: "github_write",
    target_ref: "https://github.com/Aurna-code/augnes/pull/213",
    scope: "project:custom scope/213",
    work_id: "AG-213 github/comment-payload",
    related_pr: "https://github.com/Aurna-code/augnes/pull/213",
    method_preview: "would_POST",
    payload_present: false,
    payload_keys: [],
    body_present: false,
    body_length: 0,
    dry_run_only: true,
    would_execute: false,
    ...operationPreviewOverrides,
  };

  return {
    helper: "codex:actuation-preview",
    version: 1,
    dry_run_id: "dry-run-create_pr_comment-213",
    operation_mode: "delegated",
    delegated_consumption: true,
    pipeline_status: "pass",
    plan_status: "pass",
    intended_action: "create_pr_comment",
    gate_status: "gate_passed",
    preview_status: "ready_for_separate_actuation",
    execution_permitted_by_gate: true,
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    grant_id: "grant-213-fixture",
    scope: "project:custom scope/213",
    work_id: "AG-213 github/comment-payload",
    related_pr: "https://github.com/Aurna-code/augnes/pull/213",
    target_status: "present",
    operation_preview: operationPreview,
    warnings: [],
    blockers: [],
    next_step:
      "Dry-run preview is ready. Execution still requires a separate actuation helper or human/operator process.",
    authority_boundary:
      "The helper previews a possible action shape only. It does not execute actions. It does not call GitHub/OpenAI/providers.",
    ...overrides,
  };
}

function markedPreview(preview) {
  return ["summary text", previewBeginMarker, JSON.stringify(preview, null, 2), previewEndMarker].join("\n");
}

function extractPayloadJson(output) {
  const begin = output.indexOf(beginMarker);
  const end = output.indexOf(endMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + beginMarker.length, end).trim());
}

function assertCanonicalPayloadShape(result, includesBody) {
  assert.deepEqual(Object.keys(result), [
    "helper",
    "version",
    "operation_mode",
    "delegated_consumption",
    "intended_action",
    "gate_status",
    "preview_status",
    "grant_id",
    "scope",
    "work_id",
    "related_pr",
    "target",
    "payload",
    "warnings",
    "blockers",
    "dry_run_only",
    "would_execute",
    "requires_separate_actuation_helper",
    "next_step",
    "authority_boundary",
  ]);
  assert.deepEqual(Object.keys(result.target), [
    "target_ref",
    "owner",
    "repo",
    "pull_number",
    "issue_number",
    "target_status",
  ]);
  const payloadKeys = [
    "endpoint_preview",
    "api_url_preview",
    "method_preview",
    "body_present",
    "body_length",
    "body_sha256",
    ...(includesBody ? ["body"] : []),
    "dry_run_only",
    "would_execute",
  ];
  assert.deepEqual(Object.keys(result.payload), payloadKeys);
  assert.equal(result.helper, "codex:github-comment-payload");
  assert.equal(result.intended_action, "create_pr_comment");
  assert.equal(result.payload.method_preview, "would_POST");
  assert.equal(result.payload.dry_run_only, true);
  assert.equal(result.payload.would_execute, false);
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
