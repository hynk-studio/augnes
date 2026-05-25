import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const commandPreviewBeginMarker = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_JSON";
const commandPreviewEndMarker = "END_AUGNES_CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_JSON";
const readinessBeginMarker = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_READINESS_JSON";
const readinessEndMarker = "END_AUGNES_CODEX_GITHUB_COMMENT_READINESS_JSON";
const fakeGithubToken = "fake-gh-token-github-comment-command-preview";
const fakeOpenAiKey = "fake-openai-key-github-comment-command-preview";
const commentBody = "Body content that must stay out of command preview output.";
const commentBodySha = sha256(commentBody);
const forbiddenPublicOverclaimPhrases = [
  "production-ready",
  "ready_to_execute",
  "execution_ready",
  "evaluates PR quality",
  "detects drift at runtime",
  "repairs context automatically",
  "selects next tasks autonomously",
  "autonomous research agent",
  "benchmark",
  "score",
];

const successfulOutputs = [];

const both = await runPreview({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: marked(buildReadiness()),
    CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_OUTPUT: "both",
  },
});
assert.equal(both.status, 0, both.stderr);
assert.match(both.stdout, /Codex GitHub comment command preview/);
assert.match(both.stdout, new RegExp(`${commandPreviewBeginMarker}\\n`));
assert.match(both.stdout, new RegExp(`\\n${commandPreviewEndMarker}\\n?$`));
const bothJson = extractCommandPreviewJson(both.stdout);
assertCanonicalCommandPreviewShape(bothJson);
assert.equal(bothJson.preflight_status, "preflight_passed");
assert.equal(bothJson.command_preview.endpoint_preview, "/repos/Aurna-code/augnes/issues/214/comments");
assert.equal(bothJson.command_preview.auth_header_present, false);
assert.equal(bothJson.command_preview.token_present, false);
assertNoSecretsOrBody(both.stdout + both.stderr);
successfulOutputs.push(both.stdout);

const jsonOnly = await previewJson({
  CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness()),
  CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_OUTPUT: "json",
});
assert.equal(jsonOnly.helper, "codex:github-comment-command-preview");

const summaryOnly = await runPreview({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness()),
    CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_OUTPUT: "summary",
  },
});
assert.equal(summaryOnly.status, 0, summaryOnly.stderr);
assert.match(summaryOnly.stdout, /Codex GitHub comment command preview/);
assert.doesNotMatch(summaryOnly.stdout, new RegExp(commandPreviewBeginMarker));
assertNoSecretsOrBody(summaryOnly.stdout + summaryOnly.stderr);
successfulOutputs.push(summaryOnly.stdout);

const rawJsonEnv = await previewJson({
  CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness()),
});
assert.equal(rawJsonEnv.command_preview.body_sha256, commentBodySha);

const markedEnv = await previewJson({
  CODEX_GITHUB_COMMENT_READINESS_JSON: marked(buildReadiness()),
});
assert.equal(markedEnv.command_preview.method_preview, "would_POST");

const shorthandTarget = await previewJson({
  CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
    buildReadiness({ target: { ...baseTarget(), target_ref: "Aurna-code/augnes#214" } }),
  ),
});
assert.equal(shorthandTarget.target.target_ref, "Aurna-code/augnes#214");

const httpsTarget = await previewJson({
  CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
    buildReadiness({ target: { ...baseTarget(), target_ref: "https://github.com/Aurna-code/augnes/pull/214" } }),
  ),
});
assert.equal(httpsTarget.target.target_ref, "https://github.com/Aurna-code/augnes/pull/214");

const httpTarget = await previewJson({
  CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
    buildReadiness({ target: { ...baseTarget(), target_ref: "http://github.com/Aurna-code/augnes/pull/214" } }),
  ),
});
assert.equal(httpTarget.target.target_ref, "http://github.com/Aurna-code/augnes/pull/214");

const inputFilePath = path.join(tmpdir(), `augnes-github-comment-command-preview-readiness-${process.pid}.json`);
await writeFile(inputFilePath, marked(buildReadiness()), "utf8");
const fileInput = await runPreview({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON_FILE: inputFilePath,
    CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(fileInput.status, 0, fileInput.stderr);
assert.equal(JSON.parse(fileInput.stdout).helper, "codex:github-comment-command-preview");
assertNoSecretsOrBody(fileInput.stdout + fileInput.stderr);
successfulOutputs.push(fileInput.stdout);

const stdinInput = await runPreview({
  stdin: JSON.stringify(buildReadiness()),
  env: {
    CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(JSON.parse(stdinInput.stdout).helper, "codex:github-comment-command-preview");
assertNoSecretsOrBody(stdinInput.stdout + stdinInput.stderr);
successfulOutputs.push(stdinInput.stdout);

await assertInvalid({
  env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({ preflight_status: "needs_review" })) },
  expected: /CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_PREFLIGHT_NEEDS_REVIEW/,
});
await assertInvalid({
  env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({ preflight_status: "blocked" })) },
  expected: /CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_PREFLIGHT_BLOCKED/,
});
await assertInvalid({ env: { CODEX_GITHUB_COMMENT_READINESS_JSON: "{nope" }, expected: /INVALID_JSON/ });
await assertInvalid({ env: { CODEX_GITHUB_COMMENT_READINESS_JSON: "[]" }, expected: /INVALID_READINESS/ });
await assertInvalid({
  env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({ helper: "codex:not-readiness" })) },
  expected: /INVALID_READINESS/,
});
await assertInvalid({
  env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({ intended_action: "merge_pr" })) },
  expected: /INVALID_READINESS/,
});
await assertInvalid({
  env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({ dry_run_only: false })) },
  expected: /INVALID_READINESS/,
});
await assertInvalid({
  env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({ would_execute: true })) },
  expected: /INVALID_READINESS/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({ requires_separate_actuation_helper: false })),
  },
  expected: /INVALID_READINESS/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({}, { method_preview: "POST" }),
    ),
  },
  expected: /INVALID_PAYLOAD_FINGERPRINT/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({}, { endpoint_preview: "POST /repos/Aurna-code/other/issues/214/comments" }),
    ),
  },
  expected: /INVALID_PAYLOAD_FINGERPRINT/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({}, { api_url_preview: "https://api.github.com/repos/Aurna-code/other/issues/214/comments" }),
    ),
  },
  expected: /INVALID_PAYLOAD_FINGERPRINT/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({ target: { ...baseTarget(), target_ref: "https://github.com/evil/repo/pull/999" } }),
    ),
  },
  expected: /TARGET_REF_MISMATCH/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({ target: { ...baseTarget(), target_ref: "https://github.com/evil/augnes/pull/214" } }),
    ),
  },
  expected: /TARGET_REF_MISMATCH/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({ target: { ...baseTarget(), target_ref: "https://github.com/Aurna-code/other/pull/214" } }),
    ),
  },
  expected: /TARGET_REF_MISMATCH/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({ target: { ...baseTarget(), target_ref: "https://github.com/Aurna-code/augnes/pull/999" } }),
    ),
  },
  expected: /TARGET_REF_MISMATCH/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({ target: { ...baseTarget(), pull_number: 999 } }),
    ),
  },
  expected: /TARGET_REF_MISMATCH/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({ target: { ...baseTarget(), issue_number: 999 } }),
    ),
  },
  expected: /TARGET_REF_MISMATCH/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({
        target: {
          ...baseTarget(),
          target_ref: "https://github.com/Aurna-code/augnes/pull/999",
          pull_number: 999,
          issue_number: 214,
        },
      }),
    ),
  },
  expected: /TARGET_REF_MISMATCH/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({ target: { ...baseTarget(), target_ref: "Aurna-code/augnes/pull/214" } }),
    ),
  },
  expected: /INVALID_TARGET/,
});

for (const owner of ["", "Aurna-code/other", "Aurna-code%2Fother", "Aurna code", "Aurna#code", "Aurna?code", "Aurna\u0001code"]) {
  await assertInvalid({
    env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({ target: { ...baseTarget(), owner } })) },
    expected: /INVALID_OWNER/,
  });
}
for (const repo of ["", "augnes/other", "augnes%2Fother", "augnes repo", "augnes#repo", "augnes?repo", "augnes\u0001repo"]) {
  await assertInvalid({
    env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({ target: { ...baseTarget(), repo } })) },
    expected: /INVALID_REPO/,
  });
}

await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({ target: { ...baseTarget(), issue_number: 0 } }),
    ),
  },
  expected: /INVALID_TARGET/,
});
await assertInvalid({
  env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({}, { body_sha256: "not-a-sha" })) },
  expected: /INVALID_PAYLOAD_FINGERPRINT/,
});
await assertInvalid({
  env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({}, { body_sha256: "A".repeat(64) })) },
  expected: /INVALID_PAYLOAD_FINGERPRINT/,
});
await assertInvalid({
  env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({}, { body_length: 0 })) },
  expected: /INVALID_PAYLOAD_FINGERPRINT/,
});
await assertInvalid({
  env: { CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(buildReadiness({}, { body: `${commentBody} extra` })) },
  expected: /INVALID_PAYLOAD_FINGERPRINT/,
});
await assertInvalid({
  env: {
    CODEX_GITHUB_COMMENT_READINESS_JSON: JSON.stringify(
      buildReadiness({ preflight_status: "something_else" }),
    ),
  },
  expected: /INVALID_PREFLIGHT_STATUS/,
});

for (const output of successfulOutputs) {
  assertNoSecretsOrBody(output);
  assertNoForbiddenPhrases(output);
  assertNoAuthHeader(output);
}

const helperSource = await readFile("apps/augnes_apps/scripts/codex-github-comment-posting-command-preview.ts", "utf8");
assert.doesNotMatch(helperSource, /\bfetch\s*\(/);
assert.doesNotMatch(helperSource, /\bcreateServer\s*\(/);
assert.doesNotMatch(helperSource, /from "node:http"/);
assert.doesNotMatch(helperSource, /from "node:https"/);
assert.doesNotMatch(helperSource, /from "node:http2"/);

console.log(
  JSON.stringify(
    {
      smoke: "codex-github-comment-posting-command-preview",
      both_mode_checked: true,
      json_only_checked: true,
      summary_only_checked: true,
      raw_json_env_checked: true,
      marked_json_env_checked: true,
      file_input_checked: true,
      stdin_input_checked: true,
      target_ref_shorthand_checked: true,
      target_ref_https_checked: true,
      target_ref_http_checked: true,
      target_ref_mismatch_rejected: true,
      pull_issue_mismatch_rejected: true,
      preflight_needs_review_rejected: true,
      preflight_blocked_rejected: true,
      invalid_json_and_shape_checked: true,
      boundary_flags_checked: true,
      method_endpoint_api_target_body_validation_checked: true,
      secret_and_body_absence_checked: true,
      forbidden_public_overclaims_checked: true,
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

async function previewJson(env) {
  const result = await runPreview({ env: { CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_OUTPUT: "json", ...env } });
  assert.equal(result.status, 0, result.stderr);
  assertNoSecretsOrBody(result.stdout + result.stderr);
  successfulOutputs.push(result.stdout);
  const parsed = JSON.parse(result.stdout);
  assertCanonicalCommandPreviewShape(parsed);
  return parsed;
}

function runPreview({ env = {}, stdin = "" } = {}) {
  const childEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    npm_config_cache: process.env.npm_config_cache ?? path.join(tmpdir(), "augnes-npm-cache"),
    GITHUB_TOKEN: fakeGithubToken,
    OPENAI_API_KEY: fakeOpenAiKey,
    ...env,
  };

  for (const [key, value] of Object.entries(childEnv)) {
    if (value === undefined) delete childEnv[key];
  }

  return new Promise((resolve) => {
    const child = spawn("npm", ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:github-comment-posting-command-preview"], {
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
  const result = await runPreview({ env });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, expected);
  assertNoSecretsOrBody(result.stderr);
}

function baseTarget() {
  return {
    target_ref: "https://github.com/Aurna-code/augnes/pull/214",
    owner: "Aurna-code",
    repo: "augnes",
    pull_number: 214,
    issue_number: 214,
  };
}

function basePayloadFingerprint() {
  return {
    endpoint_preview: "POST /repos/Aurna-code/augnes/issues/214/comments",
    api_url_preview: "https://api.github.com/repos/Aurna-code/augnes/issues/214/comments",
    method_preview: "would_POST",
    body_length: commentBody.length,
    body_sha256: commentBodySha,
    body: commentBody,
  };
}

function buildReadiness(overrides = {}, payloadFingerprintOverrides = {}) {
  return {
    helper: "codex:github-comment-readiness",
    version: 1,
    operation_mode: "delegated",
    delegated_consumption: true,
    intended_action: "create_pr_comment",
    preflight_status: "preflight_passed",
    gate_status: "gate_passed",
    preview_status: "ready_for_separate_actuation",
    grant_id: "grant-214-fixture",
    scope: "project:custom scope/214",
    work_id: "AG-214 github/comment-command-preview",
    related_pr: "https://github.com/Aurna-code/augnes/pull/214",
    target: baseTarget(),
    payload_fingerprint: {
      ...basePayloadFingerprint(),
      ...payloadFingerprintOverrides,
    },
    consistency_checks: {},
    warnings: [],
    blockers: [],
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    next_step: "Local preflight material only.",
    authority_boundary: "The helper validates local GitHub comment preflight material only.",
    ...overrides,
  };
}

function marked(value) {
  return ["summary text", readinessBeginMarker, JSON.stringify(value, null, 2), readinessEndMarker].join("\n");
}

function extractCommandPreviewJson(output) {
  const begin = output.indexOf(commandPreviewBeginMarker);
  const end = output.indexOf(commandPreviewEndMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + commandPreviewBeginMarker.length, end).trim());
}

function assertCanonicalCommandPreviewShape(result) {
  assert.deepEqual(Object.keys(result), [
    "helper",
    "version",
    "operation_mode",
    "delegated_consumption",
    "intended_action",
    "preflight_status",
    "grant_id",
    "scope",
    "work_id",
    "related_pr",
    "command_preview",
    "target",
    "payload_fingerprint",
    "warnings",
    "blockers",
    "dry_run_only",
    "would_execute",
    "requires_separate_actuation_helper",
    "next_step",
    "authority_boundary",
  ]);
  assert.deepEqual(Object.keys(result.command_preview), [
    "command_kind",
    "method_preview",
    "endpoint_preview",
    "api_url_preview",
    "body_length",
    "body_sha256",
    "auth_header_present",
    "token_present",
    "dry_run_only",
    "would_execute",
  ]);
  assert.deepEqual(Object.keys(result.target), ["target_ref", "owner", "repo", "pull_number", "issue_number"]);
  assert.deepEqual(Object.keys(result.payload_fingerprint), [
    "endpoint_preview",
    "api_url_preview",
    "method_preview",
    "body_length",
    "body_sha256",
  ]);
  assert.equal(result.helper, "codex:github-comment-command-preview");
  assert.equal(result.version, 1);
  assert.equal(result.intended_action, "create_pr_comment");
  assert.equal(result.preflight_status, "preflight_passed");
  assert.equal(result.command_preview.command_kind, "github_issue_comment_post");
  assert.equal(result.command_preview.method_preview, "would_POST");
  assert.equal(result.command_preview.auth_header_present, false);
  assert.equal(result.command_preview.token_present, false);
  assert.equal(result.dry_run_only, true);
  assert.equal(result.would_execute, false);
  assert.equal(result.requires_separate_actuation_helper, true);
  assert.equal(result.next_step, "ready_for_separate_actuation_helper_review");
}

function assertNoSecretsOrBody(output) {
  assert.doesNotMatch(output, new RegExp(escapeRegExp(fakeGithubToken)));
  assert.doesNotMatch(output, new RegExp(escapeRegExp(fakeOpenAiKey)));
  assert.doesNotMatch(output, new RegExp(escapeRegExp(commentBody)));
}

function assertNoForbiddenPhrases(output) {
  const boundaryNegationAllowed = output.replace(/create proof/gi, "");
  for (const phrase of forbiddenPublicOverclaimPhrases) {
    assert.doesNotMatch(boundaryNegationAllowed, new RegExp(escapeRegExp(phrase), "i"));
  }
  assert.doesNotMatch(boundaryNegationAllowed, /\bproof\b/i);
}

function assertNoAuthHeader(output) {
  assert.doesNotMatch(output, /authorization\s*:/i);
  assert.doesNotMatch(output, /\bbearer\b/i);
  assert.doesNotMatch(output, /\btoken\s+[A-Za-z0-9._-]+/i);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
