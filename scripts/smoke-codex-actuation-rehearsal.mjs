import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const beginMarker = "BEGIN_AUGNES_CODEX_ACTUATION_REHEARSAL_JSON";
const endMarker = "END_AUGNES_CODEX_ACTUATION_REHEARSAL_JSON";
const pipelineBeginMarker = "BEGIN_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const pipelineEndMarker = "END_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const fakeGithubToken = "fake-gh-token-actuation-rehearsal";
const fakeOpenAiKey = "fake-openai-key-actuation-rehearsal";
const commentBody = "Prepared rehearsal comment body for a later separate actuation helper.";
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
const delegatedPass = buildPipeline({ operationMode: "delegated", pipelineStatus: "pass" });

const both = await runRehearsal({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: markedPipeline(delegatedPass),
    CODEX_INTENDED_ACTION: "create_pr_comment",
    CODEX_REQUESTED_ACTIONS: "create_pr_comment",
    CODEX_POLICY_ALLOWED_ACTIONS: "create_pr_comment",
    CODEX_POLICY_FORBIDDEN_ACTIONS: "",
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant({ actions: ["create_pr_comment"] })),
    CODEX_ACTUATION_PREVIEW_BODY: commentBody,
    CODEX_ACTUATION_REHEARSAL_OUTPUT: "both",
  },
});
assert.equal(both.status, 0, both.stderr);
assert.match(both.stdout, /Codex actuation rehearsal/);
assert.match(both.stdout, new RegExp(`${beginMarker}\\n`));
assert.match(both.stdout, new RegExp(`\\n${endMarker}\\n?$`));
const bothJson = extractRehearsalJson(both.stdout);
assert.equal(bothJson.rehearsal_status, "ready_for_separate_actuation");
assert.equal(bothJson.action_plan.helper, "codex:closeout-action-plan");
assert.equal(bothJson.actuation_gate.helper, "codex:actuation-gate");
assert.equal(bothJson.actuation_preview.helper, "codex:actuation-preview");
assert.equal(bothJson.dry_run_only, true);
assert.equal(bothJson.would_execute, false);
assert.equal(bothJson.requires_separate_actuation_helper, true);
assert.equal(bothJson.execution_permitted_by_gate, true);
assertNoSecrets(both.stdout + both.stderr);
successfulOutputs.push(both.stdout);

const jsonOnly = await runRehearsal({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body",
    CODEX_ACTUATION_REHEARSAL_OUTPUT: "json",
  },
});
assert.equal(jsonOnly.status, 0, jsonOnly.stderr);
assert.equal(JSON.parse(jsonOnly.stdout).helper, "codex:actuation-rehearsal");
assert.doesNotMatch(jsonOnly.stdout, /Codex actuation rehearsal/);
successfulOutputs.push(jsonOnly.stdout);

const summaryOnly = await runRehearsal({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body",
    CODEX_ACTUATION_REHEARSAL_OUTPUT: "summary",
  },
});
assert.equal(summaryOnly.status, 0, summaryOnly.stderr);
assert.match(summaryOnly.stdout, /Codex actuation rehearsal/);
assert.doesNotMatch(summaryOnly.stdout, new RegExp(beginMarker));
successfulOutputs.push(summaryOnly.stdout);

const localAction = await runRehearsal({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body",
    CODEX_ACTUATION_REHEARSAL_OUTPUT: "json",
  },
});
assert.equal(localAction.status, 0, localAction.stderr);
assert.equal(JSON.parse(localAction.stdout).rehearsal_status, "ready_for_separate_actuation");
successfulOutputs.push(localAction.stdout);

const needsReview = await runRehearsal({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_INTENDED_ACTION: "create_pr_comment",
    CODEX_REQUESTED_ACTIONS: "create_pr_comment",
    CODEX_POLICY_ALLOWED_ACTIONS: "create_pr_comment",
    CODEX_POLICY_FORBIDDEN_ACTIONS: "",
    CODEX_ACTUATION_REHEARSAL_OUTPUT: "json",
  },
});
assert.equal(needsReview.status, 0, needsReview.stderr);
assert.equal(JSON.parse(needsReview.stdout).rehearsal_status, "needs_review");
successfulOutputs.push(needsReview.stdout);

const blocked = await runRehearsal({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_INTENDED_ACTION: "merge_pr",
    CODEX_REQUESTED_ACTIONS: "merge_pr",
    CODEX_ACTUATION_REHEARSAL_OUTPUT: "json",
  },
});
assert.equal(blocked.status, 0, blocked.stderr);
const blockedJson = JSON.parse(blocked.stdout);
assert.equal(blockedJson.rehearsal_status, "blocked");
assert.equal(blockedJson.gate_status, "denied");
successfulOutputs.push(blocked.stdout);

const isolatedModes = await runRehearsal({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body",
    CODEX_ACTION_PLAN_OUTPUT: "json",
    CODEX_ACTUATION_GATE_OUTPUT: "json",
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
    CODEX_ACTUATION_REHEARSAL_OUTPUT: "json",
  },
});
assert.equal(isolatedModes.status, 0, isolatedModes.stderr);
assert.equal(JSON.parse(isolatedModes.stdout).rehearsal_status, "ready_for_separate_actuation");
successfulOutputs.push(isolatedModes.stdout);

const filePath = path.join(tmpdir(), `augnes-actuation-rehearsal-pipeline-${process.pid}.json`);
await writeFile(filePath, markedPipeline(delegatedPass), "utf8");
const fileInput = await runRehearsal({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON_FILE: filePath,
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body",
    CODEX_ACTUATION_REHEARSAL_OUTPUT: "json",
  },
});
assert.equal(fileInput.status, 0, fileInput.stderr);
assert.equal(JSON.parse(fileInput.stdout).helper, "codex:actuation-rehearsal");
successfulOutputs.push(fileInput.stdout);

const stdinInput = await runRehearsal({
  stdin: JSON.stringify(delegatedPass),
  env: {
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body",
    CODEX_ACTUATION_REHEARSAL_OUTPUT: "json",
  },
});
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(JSON.parse(stdinInput.stdout).helper, "codex:actuation-rehearsal");
successfulOutputs.push(stdinInput.stdout);

await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_REQUESTED_ACTIONS: '["prepare_pr_body",7]',
  },
  expected: /CODEX_ACTUATION_REHEARSAL_ACTION_PLAN_FAILED/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_INTENDED_ACTION: "create_pr_comment",
    CODEX_REQUESTED_ACTIONS: "create_pr_comment",
    CODEX_POLICY_ALLOWED_ACTIONS: "create_pr_comment",
    CODEX_POLICY_FORBIDDEN_ACTIONS: "",
    CODEX_AUTHORITY_GRANT_JSON: "{nope",
  },
  expected: /CODEX_ACTUATION_REHEARSAL_GATE_FAILED/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body",
    CODEX_ACTUATION_PAYLOAD_JSON: "{nope",
  },
  expected: /CODEX_ACTUATION_REHEARSAL_PREVIEW_FAILED/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
  },
  expected: /CODEX_ACTUATION_REHEARSAL_MISSING_ACTION/,
});
await assertInvalid({
  expected: /CODEX_ACTUATION_REHEARSAL_MISSING_INPUT/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_ACTUATION_REHEARSAL_OUTPUT: "xml",
  },
  expected: /CODEX_ACTUATION_REHEARSAL_INVALID_OUTPUT/,
});

for (const output of successfulOutputs) {
  assertNoForbiddenPhrases(output);
  assertNoSecrets(output);
}

console.log(
  JSON.stringify(
    {
      smoke: "codex-actuation-rehearsal",
      both_mode_checked: true,
      json_only_checked: true,
      summary_only_checked: true,
      local_action_checked: true,
      needs_review_checked: true,
      blocked_checked: true,
      action_plan_failure_checked: true,
      gate_failure_checked: true,
      preview_failure_checked: true,
      output_mode_isolation_checked: true,
      file_input_checked: true,
      stdin_input_checked: true,
      missing_action_checked: true,
      missing_input_checked: true,
      invalid_output_mode_checked: true,
      forbidden_public_overclaims_checked: true,
      fake_secret_absence_checked: true,
      http_server_started: false,
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

function buildPipeline({ operationMode, pipelineStatus }) {
  const delegatedConsumption = operationMode === "delegated";
  return {
    helper: "codex:closeout-pipeline",
    version: 1,
    operation_mode: operationMode,
    delegated_consumption: delegatedConsumption,
    pipeline_status: pipelineStatus,
    closeout_status: "ready_for_review",
    scope: "project:custom scope/211",
    work_id: "AG-211 actuation/rehearsal",
    related_pr: "https://github.com/Aurna-code/augnes/pull/211",
    closeout: {
      helper: "codex:closeout-block",
      version: "1",
      operation_mode: operationMode,
      forbidden_actions: [],
    },
    closeout_check: {
      helper: "codex:closeout-check",
      version: 1,
      validation_status: pipelineStatus,
      operation_mode: operationMode,
      delegated_consumption: delegatedConsumption,
    },
    recommended_next_action:
      "Use this local material as input to a separate policy gate before any posting, approval, merge, publication, or mutation.",
    authority_boundary:
      "The pipeline runs local formatting and validation only. It does not call GitHub/OpenAI and does not mutate Augnes.",
  };
}

function buildGrant(overrides = {}) {
  return {
    helper: "codex:authority-grant",
    version: 1,
    grant_id: "grant-211-fixture",
    granted_by: "human-operator-fixture",
    granted_to: "codex-fixture",
    scope: "project:custom scope/211",
    work_id: "AG-211 actuation/rehearsal",
    related_pr: "https://github.com/Aurna-code/augnes/pull/211",
    actions: [],
    expires_at: null,
    constraints: ["dry_run_only"],
    forbidden_actions: [],
    dry_run_only: true,
    authority_boundary:
      "This grant does not execute the action itself. It is local authority material for a separate gate only.",
    ...overrides,
  };
}

function markedPipeline(pipeline) {
  return ["summary text", pipelineBeginMarker, JSON.stringify(pipeline, null, 2), pipelineEndMarker].join("\n");
}

function runRehearsal({ env = {}, stdin = "" } = {}) {
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
      ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:actuation-rehearsal"],
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
    child.stdin.end(stdin);
  });
}

async function assertInvalid({ env = {}, expected }) {
  const result = await runRehearsal({ env });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, expected);
  assertNoSecrets(result.stderr);
}

function extractRehearsalJson(output) {
  const begin = output.indexOf(beginMarker);
  const end = output.indexOf(endMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + beginMarker.length, end).trim());
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
