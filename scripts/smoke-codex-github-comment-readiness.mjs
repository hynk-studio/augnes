import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

const readinessBeginMarker = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_READINESS_JSON";
const readinessEndMarker = "END_AUGNES_CODEX_GITHUB_COMMENT_READINESS_JSON";
const payloadBeginMarker = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_PAYLOAD_JSON";
const payloadEndMarker = "END_AUGNES_CODEX_GITHUB_COMMENT_PAYLOAD_JSON";
const gateBeginMarker = "BEGIN_AUGNES_CODEX_ACTUATION_GATE_JSON";
const gateEndMarker = "END_AUGNES_CODEX_ACTUATION_GATE_JSON";
const previewBeginMarker = "BEGIN_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const previewEndMarker = "END_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const grantBeginMarker = "BEGIN_AUGNES_CODEX_AUTHORITY_GRANT_JSON";
const grantEndMarker = "END_AUGNES_CODEX_AUTHORITY_GRANT_JSON";
const fakeGithubToken = "fake-gh-token-github-comment-readiness";
const fakeOpenAiKey = "fake-openai-key-github-comment-readiness";
const commentBody = "Prepared PR comment body for a later separate GitHub posting helper.";
const commentBodySha = sha256(commentBody);
const forbiddenPublicOverclaimPhrases = [
  "already improves",
  "evaluates PR quality",
  "detects drift at runtime",
  "repairs context automatically",
  "selects next tasks autonomously",
  "production-ready",
  "autonomous research agent",
  "ready_to_execute",
  "execution_ready",
];

const successfulOutputs = [];

const both = await runReadiness({
  env: fullChainEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: marked(payloadBeginMarker, payloadEndMarker, buildPayload()),
    CODEX_ACTUATION_GATE_JSON: marked(gateBeginMarker, gateEndMarker, buildGate()),
    CODEX_ACTUATION_PREVIEW_JSON: marked(previewBeginMarker, previewEndMarker, buildPreview()),
    CODEX_AUTHORITY_GRANT_JSON: marked(grantBeginMarker, grantEndMarker, buildGrant()),
    CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "both",
  }),
});
assert.equal(both.status, 0, both.stderr);
assert.match(both.stdout, /Codex GitHub comment readiness/);
assert.match(both.stdout, new RegExp(`${readinessBeginMarker}\\n`));
assert.match(both.stdout, new RegExp(`\\n${readinessEndMarker}\\n?$`));
const bothJson = extractReadinessJson(both.stdout);
assertCanonicalReadinessShape(bothJson);
assert.equal(bothJson.preflight_status, "preflight_passed");
assert.equal(bothJson.dry_run_only, true);
assert.equal(bothJson.would_execute, false);
assert.equal(bothJson.requires_separate_actuation_helper, true);
for (const check of Object.values(bothJson.consistency_checks)) {
  assert.equal(check.checked, true);
  assert.equal(check.ok, true);
}
assertNoSecrets(both.stdout + both.stderr);
successfulOutputs.push(both.stdout);

const jsonOnly = await readinessJson(fullChainEnv({ CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "json" }));
assert.equal(jsonOnly.helper, "codex:github-comment-readiness");

const summaryOnly = await runReadiness({
  env: fullChainEnv({ CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "summary" }),
});
assert.equal(summaryOnly.status, 0, summaryOnly.stderr);
assert.match(summaryOnly.stdout, /Codex GitHub comment readiness/);
assert.doesNotMatch(summaryOnly.stdout, new RegExp(readinessBeginMarker));
successfulOutputs.push(summaryOnly.stdout);

const missingOptional = await readinessJson({
  CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload()),
  CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "json",
});
assert.equal(missingOptional.preflight_status, "preflight_passed");
assert.ok(missingOptional.warnings.includes("gate_input_missing"));
assert.ok(missingOptional.warnings.includes("preview_input_missing"));
assert.ok(missingOptional.warnings.includes("authority_grant_input_missing"));
assert.equal(missingOptional.consistency_checks.gate_consistency.checked, false);

const requireFullChain = await readinessJson({
  CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload()),
  CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN: "true",
  CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "json",
});
assert.equal(requireFullChain.preflight_status, "needs_review");

assert.equal(
  (
    await readinessJson({ CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload({ gate_status: "denied" })) })
  ).preflight_status,
  "blocked",
);
assert.equal(
  (
    await readinessJson({ CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload({ preview_status: "blocked" })) })
  ).preflight_status,
  "blocked",
);
assert.equal(
  (
    await readinessJson({ CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload({ gate_status: "needs_review" })) })
  ).preflight_status,
  "needs_review",
);
assert.equal(
  (
    await readinessJson({ CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload({ preview_status: "needs_review" })) })
  ).preflight_status,
  "needs_review",
);

await assertBlocked(
  fullChainEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(
      buildPayload({}, { endpoint_preview: "POST /repos/Aurna-code/other/issues/214/comments" }),
    ),
  }),
  "endpoint_preview_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(
      buildPayload({ target: { ...baseTarget(), issue_number: 999 } }),
    ),
  }),
  "target_issue_number_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload({}, { body_sha256: "not-a-sha" })),
  }),
  "body_sha256_invalid",
);
await assertBlocked(
  fullChainEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(
      buildPayload({}, { body: `${commentBody} plus`, body_sha256: sha256(`${commentBody} plus`) }),
    ),
  }),
  "payload_body_length_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(
      buildPayload({}, { body: commentBody, body_sha256: "a".repeat(64) }),
    ),
  }),
  "payload_body_hash_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate({ gate_status: "needs_review" })),
  }),
  "gate_status_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate({ grant_id: "grant-other" })),
  }),
  "gate_grant_id_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate({ scope: "project:other" })),
  }),
  "gate_scope_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(
      buildPreview({}, { target_ref: "https://github.com/Aurna-code/other/pull/214" }),
    ),
  }),
  "preview_target_ref_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(buildPreview({}, { body_length: commentBody.length + 1 })),
  }),
  "preview_body_length_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(buildPreview({}, { body_preview: "different body" })),
  }),
  "preview_body_hash_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant({ grant_id: "grant-other" })),
  }),
  "grant_id_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant({ actions: ["request_human_review"] })),
  }),
  "grant_missing_create_pr_comment",
);
await assertBlocked(
  fullChainEnv({
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant({ forbidden_actions: ["create_pr_comment"] })),
  }),
  "grant_forbids_create_pr_comment",
);
await assertBlocked(
  fullChainEnv({
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant({ scope: "project:other" })),
  }),
  "grant_scope_mismatch",
);
await assertBlocked(
  fullChainEnv({
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant({ constraints: ["human_operator_in_loop"] })),
  }),
  "grant_missing_dry_run_only_constraint",
);

await assertInvalid({
  env: fullChainEnv({ CODEX_GITHUB_COMMENT_PAYLOAD_JSON: "{nope" }),
  expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_JSON/,
});
await assertInvalid({
  env: fullChainEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify({ ...buildPayload(), helper: "codex:not-payload" }),
  }),
  expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_PAYLOAD/,
});
for (const target of [
  { ...baseTarget(), owner: "Aurna-code/other" },
  { ...baseTarget(), repo: "augnes/extra" },
  { ...baseTarget(), repo: "augnes space" },
  { ...baseTarget(), repo: "augnes#frag" },
  { ...baseTarget(), repo: "augnes?query" },
  { ...baseTarget(), owner: "Aurna-code\u0001" },
]) {
  await assertInvalid({
    env: fullChainEnv({
      CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload({ target })),
    }),
    expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_PAYLOAD/,
  });
}
await assertInvalid({
  env: fullChainEnv({ CODEX_ACTUATION_GATE_JSON: "{nope" }),
  expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_GATE_JSON/,
});
await assertInvalid({
  env: fullChainEnv({ CODEX_ACTUATION_GATE_JSON: JSON.stringify({ ...buildGate(), helper: "codex:not-gate" }) }),
  expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_GATE/,
});
await assertInvalid({
  env: fullChainEnv({ CODEX_ACTUATION_PREVIEW_JSON: "{nope" }),
  expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_PREVIEW_JSON/,
});
await assertInvalid({
  env: fullChainEnv({
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify({ ...buildPreview(), helper: "codex:not-preview" }),
  }),
  expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_PREVIEW/,
});
await assertInvalid({
  env: fullChainEnv({ CODEX_AUTHORITY_GRANT_JSON: "{nope" }),
  expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_GRANT_JSON/,
});
await assertInvalid({
  env: fullChainEnv({ CODEX_AUTHORITY_GRANT_JSON: JSON.stringify({ ...buildGrant(), helper: "codex:not-grant" }) }),
  expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_GRANT/,
});
await assertInvalid({
  env: fullChainEnv({ CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "xml" }),
  expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_OUTPUT/,
});
await assertInvalid({
  env: fullChainEnv({ CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN: "maybe" }),
  expected: /CODEX_GITHUB_COMMENT_READINESS_INVALID_BOOLEAN CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN/,
});
await assertInvalid({
  env: {},
  expected: /CODEX_GITHUB_COMMENT_READINESS_MISSING_PAYLOAD_INPUT/,
});

const payloadFilePath = path.join(tmpdir(), `augnes-github-comment-readiness-payload-${process.pid}.txt`);
await writeFile(payloadFilePath, marked(payloadBeginMarker, payloadEndMarker, buildPayload()), "utf8");
const fileInput = await runReadiness({
  env: fullChainEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: undefined,
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON_FILE: payloadFilePath,
    CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "json",
  }),
});
assert.equal(fileInput.status, 0, fileInput.stderr);
assert.equal(JSON.parse(fileInput.stdout).helper, "codex:github-comment-readiness");
successfulOutputs.push(fileInput.stdout);

const stdinInput = await runReadiness({
  stdin: JSON.stringify(buildPayload()),
  env: fullChainEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: undefined,
    CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "json",
  }),
});
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(JSON.parse(stdinInput.stdout).helper, "codex:github-comment-readiness");
successfulOutputs.push(stdinInput.stdout);

for (const output of successfulOutputs) {
  assertNoSecrets(output);
  assertNoForbiddenPhrases(output);
}

console.log(
  JSON.stringify(
    {
      smoke: "codex-github-comment-readiness",
      both_mode_checked: true,
      json_only_checked: true,
      summary_only_checked: true,
      full_chain_pass_checked: true,
      missing_optional_default_checked: true,
      require_full_chain_checked: true,
      payload_blocked_checked: true,
      payload_needs_review_checked: true,
      payload_internal_blockers_checked: true,
      payload_target_segment_validation_checked: true,
      payload_body_consistency_checked: true,
      gate_mismatch_blockers_checked: true,
      preview_mismatch_blockers_checked: true,
      grant_mismatch_blockers_checked: true,
      invalid_json_and_shape_checked: true,
      invalid_output_mode_checked: true,
      invalid_boolean_checked: true,
      file_input_checked: true,
      stdin_input_checked: true,
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

async function readinessJson(env) {
  const result = await runReadiness({ env: { CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "json", ...env } });
  assert.equal(result.status, 0, result.stderr);
  assertNoSecrets(result.stdout + result.stderr);
  successfulOutputs.push(result.stdout);
  const parsed = JSON.parse(result.stdout);
  assertCanonicalReadinessShape(parsed);
  return parsed;
}

async function assertBlocked(env, expectedBlocker) {
  const parsed = await readinessJson({ ...env, CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "json" });
  assert.equal(parsed.preflight_status, "blocked");
  assert.ok(parsed.blockers.includes(expectedBlocker), `${expectedBlocker} missing from ${parsed.blockers.join(",")}`);
}

function fullChainEnv(overrides = {}) {
  const env = {
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload()),
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate()),
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(buildPreview()),
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant()),
    ...overrides,
  };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key];
  }

  return env;
}

function runReadiness({ env = {}, stdin = "" } = {}) {
  const childEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    npm_config_cache: process.env.npm_config_cache ?? path.join(tmpdir(), "augnes-npm-cache"),
    GITHUB_TOKEN: fakeGithubToken,
    OPENAI_API_KEY: fakeOpenAiKey,
    ...env,
  };

  return new Promise((resolve) => {
    const child = spawn("npm", ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:github-comment-readiness"], {
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
  const result = await runReadiness({ env });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, expected);
  assertNoSecrets(result.stderr);
}

function baseTarget() {
  return {
    target_ref: "https://github.com/Aurna-code/augnes/pull/214",
    owner: "Aurna-code",
    repo: "augnes",
    pull_number: 214,
    issue_number: 214,
    target_status: "present",
  };
}

function basePayloadFingerprint() {
  return {
    endpoint_preview: "POST /repos/Aurna-code/augnes/issues/214/comments",
    api_url_preview: "https://api.github.com/repos/Aurna-code/augnes/issues/214/comments",
    method_preview: "would_POST",
    body_present: true,
    body_length: commentBody.length,
    body_sha256: commentBodySha,
    dry_run_only: true,
    would_execute: false,
  };
}

function buildPayload(overrides = {}, payloadOverrides = {}) {
  return {
    helper: "codex:github-comment-payload",
    version: 1,
    operation_mode: "delegated",
    delegated_consumption: true,
    intended_action: "create_pr_comment",
    gate_status: "gate_passed",
    preview_status: "ready_for_separate_actuation",
    grant_id: "grant-214-fixture",
    scope: "project:custom scope/214",
    work_id: "AG-214 github/comment-readiness",
    related_pr: "https://github.com/Aurna-code/augnes/pull/214",
    target: baseTarget(),
    payload: {
      ...basePayloadFingerprint(),
      ...payloadOverrides,
    },
    warnings: [],
    blockers: [],
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    next_step:
      "Dry-run GitHub comment payload is rendered. Posting still requires a separate authority-gated actuation helper or human/operator process.",
    authority_boundary:
      "The helper renders a GitHub comment payload preview only. It does not call GitHub. It does not post comments or reviews.",
    ...overrides,
  };
}

function buildGate(overrides = {}) {
  return {
    helper: "codex:actuation-gate",
    version: 1,
    intended_action: "create_pr_comment",
    planned_decision: "needs_review",
    gate_status: "gate_passed",
    authority_grant_required: true,
    authority_grant_present: true,
    authority_grant_valid: true,
    grant_id: "grant-214-fixture",
    scope: "project:custom scope/214",
    work_id: "AG-214 github/comment-readiness",
    related_pr: "https://github.com/Aurna-code/augnes/pull/214",
    ...overrides,
  };
}

function buildPreview(overrides = {}, operationPreviewOverrides = {}) {
  return {
    helper: "codex:actuation-preview",
    version: 1,
    intended_action: "create_pr_comment",
    gate_status: "gate_passed",
    preview_status: "ready_for_separate_actuation",
    execution_permitted_by_gate: true,
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    grant_id: "grant-214-fixture",
    scope: "project:custom scope/214",
    work_id: "AG-214 github/comment-readiness",
    related_pr: "https://github.com/Aurna-code/augnes/pull/214",
    target_status: "present",
    operation_preview: {
      action: "create_pr_comment",
      operation_kind: "github_write",
      method_preview: "would_POST",
      target_ref: "https://github.com/Aurna-code/augnes/pull/214",
      body_present: true,
      body_length: commentBody.length,
      body_preview: commentBody,
      dry_run_only: true,
      would_execute: false,
      ...operationPreviewOverrides,
    },
    ...overrides,
  };
}

function buildGrant(overrides = {}) {
  return {
    helper: "codex:authority-grant",
    version: 1,
    grant_id: "grant-214-fixture",
    granted_by: "human-operator-fixture",
    granted_to: "codex-fixture",
    scope: "project:custom scope/214",
    work_id: "AG-214 github/comment-readiness",
    related_pr: "https://github.com/Aurna-code/augnes/pull/214",
    actions: ["create_pr_comment"],
    expires_at: null,
    constraints: ["dry_run_only"],
    forbidden_actions: [],
    dry_run_only: true,
    authority_boundary:
      "This grant material does not execute the action itself. This helper does not grant or exercise authority by itself.",
    ...overrides,
  };
}

function marked(begin, end, value) {
  return ["summary text", begin, JSON.stringify(value, null, 2), end].join("\n");
}

function extractReadinessJson(output) {
  const begin = output.indexOf(readinessBeginMarker);
  const end = output.indexOf(readinessEndMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + readinessBeginMarker.length, end).trim());
}

function assertCanonicalReadinessShape(result) {
  assert.deepEqual(Object.keys(result), [
    "helper",
    "version",
    "operation_mode",
    "delegated_consumption",
    "intended_action",
    "preflight_status",
    "gate_status",
    "preview_status",
    "grant_id",
    "scope",
    "work_id",
    "related_pr",
    "target",
    "payload_fingerprint",
    "consistency_checks",
    "warnings",
    "blockers",
    "dry_run_only",
    "would_execute",
    "requires_separate_actuation_helper",
    "next_step",
    "authority_boundary",
  ]);
  assert.deepEqual(Object.keys(result.target), ["target_ref", "owner", "repo", "pull_number", "issue_number"]);
  assert.deepEqual(Object.keys(result.payload_fingerprint), [
    "endpoint_preview",
    "api_url_preview",
    "method_preview",
    "body_length",
    "body_sha256",
  ]);
  assert.deepEqual(Object.keys(result.consistency_checks), [
    "payload_internal",
    "gate_consistency",
    "preview_consistency",
    "grant_consistency",
  ]);
  assert.equal(result.helper, "codex:github-comment-readiness");
  assert.equal(result.intended_action, "create_pr_comment");
  assert.equal(result.dry_run_only, true);
  assert.equal(result.would_execute, false);
  assert.equal(result.requires_separate_actuation_helper, true);
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

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
