import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const dogfoodDocPath = "docs/GITHUB_COMMENT_READINESS_SUMMARY_DOGFOOD_2026_05_27.md";
const smokeSourcePath = "scripts/smoke-codex-github-comment-readiness-summary-dogfood.mjs";
const helperSourcePath = "apps/augnes_apps/scripts/codex-github-comment-readiness.ts";
const readinessBeginMarker = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_READINESS_JSON";
const readinessEndMarker = "END_AUGNES_CODEX_GITHUB_COMMENT_READINESS_JSON";
const fakeGithubToken = "fake-gh-token-readiness-summary-dogfood";
const fakeOpenAiKey = "fake-openai-key-readiness-summary-dogfood";
const hiddenCommentBody = "Hidden readiness-summary dogfood body that must not render.";
const hiddenCommentBodySha = sha256(hiddenCommentBody);
const githubApiHost = ["api", "github", "com"].join(".");

const forbiddenOverclaimPhrases = [
  "production-ready",
  "ready_to_execute",
  "execution_ready",
  "evaluates PR quality",
  "detects drift at runtime",
  "repairs context automatically",
  "selects next tasks autonomously",
  "autonomous research agent",
  "benchmark result",
  "quality score",
  "KPI",
  "proof of quality",
  "readiness authority",
];

const allowedTopLevelKeys = [
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
];

const successfulOutputs = [];

const sampleA = await runReadiness({
  env: fullChainEnv({
    CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "summary",
    CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN: "true",
  }),
});
assertSuccess(sampleA);
assertStandardSummarySurface(sampleA.stdout);
assert.match(sampleA.stdout, /preflight_status: preflight_passed/);
for (const checkName of ["payload_internal", "gate_consistency", "preview_consistency", "grant_consistency"]) {
  assertSummaryCheck(sampleA.stdout, checkName, {
    checked: true,
    ok: true,
    warnings: "none",
    blockers: "none",
  });
}
successfulOutputs.push(sampleA.stdout);

const sampleB = await runReadiness({
  env: payloadOnlyEnv({
    CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "summary",
    CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN: "false",
  }),
});
assertSuccess(sampleB);
assertStandardSummarySurface(sampleB.stdout);
assert.match(sampleB.stdout, /preflight_status: preflight_passed/);
assertSummaryCheck(sampleB.stdout, "payload_internal", {
  checked: true,
  ok: true,
  warnings: "none",
  blockers: "none",
});
assertSummaryCheck(sampleB.stdout, "gate_consistency", {
  checked: false,
  ok: true,
  warnings: "gate_input_missing",
  blockers: "none",
});
assertSummaryCheck(sampleB.stdout, "preview_consistency", {
  checked: false,
  ok: true,
  warnings: "preview_input_missing",
  blockers: "none",
});
assertSummaryCheck(sampleB.stdout, "grant_consistency", {
  checked: false,
  ok: true,
  warnings: "authority_grant_input_missing",
  blockers: "none",
});
successfulOutputs.push(sampleB.stdout);

const sampleC = await runReadiness({
  env: payloadOnlyEnv({
    CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "summary",
    CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN: "true",
  }),
});
assertSuccess(sampleC);
assertStandardSummarySurface(sampleC.stdout);
assert.match(sampleC.stdout, /preflight_status: needs_review/);
assert.match(sampleC.stdout, /gate_input_missing/);
assert.match(sampleC.stdout, /preview_input_missing/);
assert.match(sampleC.stdout, /authority_grant_input_missing/);
assert.match(sampleC.stdout, /next_step: Do not post\./);
assert.match(sampleC.stdout, /before any separate posting layer/);
assert.match(sampleC.stdout, /preflight_passed is not execution readiness/);
assertNoExecutionReadinessWording(sampleC.stdout);
successfulOutputs.push(sampleC.stdout);

const sampleD = await runReadiness({
  env: fullChainEnv({
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(
      buildPayload({}, { endpoint_preview: "POST /repos/Aurna-code/other/issues/247/comments" }),
    ),
    CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "summary",
    CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN: "true",
  }),
});
assertSuccess(sampleD);
assertStandardSummarySurface(sampleD.stdout);
assert.match(sampleD.stdout, /preflight_status: blocked/);
assertSummaryCheck(sampleD.stdout, "payload_internal", {
  checked: true,
  ok: false,
  warnings: "none",
  blockers: "endpoint_preview_mismatch",
});
successfulOutputs.push(sampleD.stdout);

const both = await runReadiness({
  env: fullChainEnv({
    CODEX_GITHUB_COMMENT_READINESS_OUTPUT: "both",
    CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN: "true",
  }),
});
assertSuccess(both);
assertStandardSummarySurface(extractSummaryText(both.stdout));
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
  assert.deepEqual(check.warnings, []);
  assert.deepEqual(check.blockers, []);
}
successfulOutputs.push(both.stdout);

const doc = await readFile(dogfoodDocPath, "utf8");
assertRequiredDocSections(doc);
assertNoForbiddenOverclaims(doc, "dogfood doc");

for (const output of successfulOutputs) {
  assertNoSecretsOrHiddenMaterial(output);
  assertNoForbiddenOverclaims(output, "readiness output");
}

await assertLocalOnlySource(smokeSourcePath, { helper: false });
await assertLocalOnlySource(helperSourcePath, { helper: true });

console.log(
  JSON.stringify(
    {
      smoke: "codex-github-comment-readiness-summary-dogfood",
      samples_checked: ["A", "B", "C", "D"],
      both_mode_checked: true,
      consistency_summary_labels_checked: true,
      missing_chain_warning_labels_checked: true,
      blocker_label_visibility_checked: true,
      doc_sections_checked: true,
      forbidden_overclaims_checked: true,
      fake_secret_absence_checked: true,
      local_only_source_checked: true,
      http_server_started: false,
      fetch_calls: 0,
      openai_calls: 0,
      github_calls: 0,
      provider_calls: 0,
      augnes_runtime_calls: 0,
      posting_calls: 0,
    },
    null,
    2,
  ),
);

function assertSuccess(result) {
  assert.equal(result.status, 0, result.stderr);
  assertNoSecretsOrHiddenMaterial(result.stdout + result.stderr);
}

function assertStandardSummarySurface(summary) {
  assert.match(summary, /Codex GitHub comment readiness/);
  assert.match(summary, /^consistency_checks:$/m);
  for (const checkName of ["payload_internal", "gate_consistency", "preview_consistency", "grant_consistency"]) {
    assert.match(summary, new RegExp(`^- ${escapeRegExp(checkName)}:`, "m"), checkName);
  }
  assert.match(summary, /dry_run_only: true/);
  assert.match(summary, /would_execute: false/);
  assert.match(summary, /requires_separate_actuation_helper: true/);
}

function assertSummaryCheck(summary, checkName, { checked, ok, warnings, blockers }) {
  assert.match(
    summary,
    new RegExp(
      `^- ${escapeRegExp(checkName)}: checked=${checked} ok=${ok} warnings=${escapeRegExp(
        warnings,
      )} blockers=${escapeRegExp(blockers)}$`,
      "m",
    ),
    checkName,
  );
}

function assertCanonicalReadinessShape(result) {
  assert.deepEqual(Object.keys(result), allowedTopLevelKeys);
  assert.deepEqual(Object.keys(result.consistency_checks), [
    "payload_internal",
    "gate_consistency",
    "preview_consistency",
    "grant_consistency",
  ]);
  assert.equal(result.helper, "codex:github-comment-readiness");
  assert.equal(result.intended_action, "create_pr_comment");
}

function assertNoExecutionReadinessWording(output) {
  assert.doesNotMatch(output, /ready_to_execute/i);
  assert.doesNotMatch(output, /execution_ready/i);
  assert.doesNotMatch(output, /\bis execution readiness\b/i);
}

function assertNoSecretsOrHiddenMaterial(output) {
  assert.doesNotMatch(output, new RegExp(escapeRegExp(fakeGithubToken)));
  assert.doesNotMatch(output, new RegExp(escapeRegExp(fakeOpenAiKey)));
  assert.doesNotMatch(output, /GITHUB_TOKEN/);
  assert.doesNotMatch(output, /OPENAI_API_KEY/);
  assert.doesNotMatch(output, new RegExp(escapeRegExp(hiddenCommentBody)));
  assert.doesNotMatch(output, /"body"\s*:/i);
  assert.doesNotMatch(output, /body_preview/i);
  assert.doesNotMatch(output, /auth_header/i);
  assert.doesNotMatch(output, /authorization/i);
  assert.doesNotMatch(output, /bearer/i);
  assert.doesNotMatch(output, /"token"\s*:/i);
}

function assertNoForbiddenOverclaims(text, label) {
  for (const phrase of forbiddenOverclaimPhrases) {
    const pattern =
      phrase === "KPI"
        ? /(^|[^A-Za-z0-9_])KPI([^A-Za-z0-9_]|$)/i
        : new RegExp(escapeRegExp(phrase), "i");
    assert.doesNotMatch(text, pattern, `${label}: ${phrase}`);
  }
}

function assertRequiredDocSections(doc) {
  for (const section of [
    "Summary",
    "Scope boundary",
    "Dogfood samples",
    "Cross-sample findings",
    "Readiness-summary usefulness observations",
    "Development feedback",
    "UI/UX implications",
    "Sidecar e_t / perspective research implications",
    "Recommended next decision",
  ]) {
    assert.match(doc, new RegExp(`^## ${escapeRegExp(section)}$`, "m"), section);
  }
}

async function assertLocalOnlySource(filePath, { helper }) {
  const source = await readFile(filePath, "utf8");
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /from\s+["']node:http["']/);
  assert.doesNotMatch(source, /from\s+["']node:https["']/);
  assert.doesNotMatch(source, /from\s+["']node:http2["']/);
  assert.doesNotMatch(source, /\bcreateServer\s*\(/);
  assert.doesNotMatch(source, /\blisten\s*\(/);
  assert.doesNotMatch(source, /\bOctokit\b/);
  assert.doesNotMatch(source, /\baxios\b/);
  assert.doesNotMatch(source, /api\.openai\.com/);
  if (helper) {
    assert.doesNotMatch(source, /process\.env\.GITHUB_TOKEN/);
    assert.doesNotMatch(source, /process\.env\.OPENAI_API_KEY/);
  }
}

function runReadiness({ env = {} } = {}) {
  const childEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    npm_config_cache: process.env.npm_config_cache ?? "",
    GITHUB_TOKEN: fakeGithubToken,
    OPENAI_API_KEY: fakeOpenAiKey,
    ...env,
  };

  return new Promise((resolve) => {
    const child = spawn("npm", ["run", "--silent", "codex:github-comment-readiness"], {
      cwd: process.cwd(),
      env: childEnv,
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

function fullChainEnv(overrides = {}) {
  return {
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload()),
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate()),
    CODEX_ACTUATION_PREVIEW_JSON: JSON.stringify(buildPreview()),
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant()),
    ...overrides,
  };
}

function payloadOnlyEnv(overrides = {}) {
  return {
    CODEX_GITHUB_COMMENT_PAYLOAD_JSON: JSON.stringify(buildPayload()),
    ...overrides,
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
    grant_id: "grant-247-summary-dogfood",
    scope: "project:github-comment-readiness-summary-dogfood",
    work_id: "AG-247 readiness-summary-dogfood",
    related_pr: "https://github.com/Aurna-code/augnes/pull/247",
    target: baseTarget(),
    payload: {
      endpoint_preview: "POST /repos/Aurna-code/augnes/issues/247/comments",
      api_url_preview: `https://${githubApiHost}/repos/Aurna-code/augnes/issues/247/comments`,
      method_preview: "would_POST",
      body_present: true,
      body_length: hiddenCommentBody.length,
      body_sha256: hiddenCommentBodySha,
      dry_run_only: true,
      would_execute: false,
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
    grant_id: "grant-247-summary-dogfood",
    scope: "project:github-comment-readiness-summary-dogfood",
    work_id: "AG-247 readiness-summary-dogfood",
    related_pr: "https://github.com/Aurna-code/augnes/pull/247",
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
    grant_id: "grant-247-summary-dogfood",
    scope: "project:github-comment-readiness-summary-dogfood",
    work_id: "AG-247 readiness-summary-dogfood",
    related_pr: "https://github.com/Aurna-code/augnes/pull/247",
    target_status: "present",
    operation_preview: {
      action: "create_pr_comment",
      operation_kind: "github_write",
      method_preview: "would_POST",
      target_ref: "https://github.com/Aurna-code/augnes/pull/247",
      body_present: true,
      body_length: hiddenCommentBody.length,
      body_preview: hiddenCommentBody,
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
    grant_id: "grant-247-summary-dogfood",
    granted_by: "human-operator-fixture",
    granted_to: "codex-fixture",
    scope: "project:github-comment-readiness-summary-dogfood",
    work_id: "AG-247 readiness-summary-dogfood",
    related_pr: "https://github.com/Aurna-code/augnes/pull/247",
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

function baseTarget() {
  return {
    target_ref: "https://github.com/Aurna-code/augnes/pull/247",
    owner: "Aurna-code",
    repo: "augnes",
    pull_number: 247,
    issue_number: 247,
    target_status: "present",
  };
}

function extractReadinessJson(output) {
  const begin = output.indexOf(readinessBeginMarker);
  const end = output.indexOf(readinessEndMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + readinessBeginMarker.length, end).trim());
}

function extractSummaryText(output) {
  const begin = output.indexOf(readinessBeginMarker);
  assert.notEqual(begin, -1);
  return output.slice(0, begin);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
