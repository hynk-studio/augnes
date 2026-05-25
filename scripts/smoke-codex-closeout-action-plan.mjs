import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const beginMarker = "BEGIN_AUGNES_CODEX_ACTION_PLAN_JSON";
const endMarker = "END_AUGNES_CODEX_ACTION_PLAN_JSON";
const pipelineBeginMarker = "BEGIN_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const pipelineEndMarker = "END_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const fakeGithubToken = "fake-gh-token-action-plan";
const fakeOpenAiKey = "fake-openai-key-action-plan";
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
const both = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: markedPipeline(delegatedPass),
    CODEX_REQUESTED_ACTIONS:
      "prepare_pr_body, delegated_handoff, create_pr_comment, merge_pr, mutate_augnes_state, unknown_action",
    CODEX_ACTION_PLAN_OUTPUT: "both",
  },
});
assert.equal(both.status, 0, both.stderr);
assert.match(both.stdout, /Codex closeout action plan/);
assert.match(both.stdout, new RegExp(`${beginMarker}\\n`));
assert.match(both.stdout, new RegExp(`\\n${endMarker}\\n?$`));
const bothJson = extractActionPlanJson(both.stdout);
assert.equal(bothJson.plan_status, "pass");
assertDecision(bothJson, "prepare_pr_body", "allow");
assertDecision(bothJson, "delegated_handoff", "allow");
assertDecision(bothJson, "create_pr_comment", "deny");
assertDecision(bothJson, "merge_pr", "deny");
assertDecision(bothJson, "mutate_augnes_state", "deny");
assertDecision(bothJson, "unknown_action", "deny", "unknown_action");
assertNoSecrets(both.stdout + both.stderr);
successfulOutputs.push(both.stdout);

const filePath = path.join(tmpdir(), `augnes-closeout-action-plan-${process.pid}.json`);
await writeFile(filePath, JSON.stringify(delegatedPass), "utf8");
const fileInput = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON_FILE: filePath,
    CODEX_ACTION_PLAN_OUTPUT: "json",
  },
});
assert.equal(fileInput.status, 0, fileInput.stderr);
assert.equal(JSON.parse(fileInput.stdout).helper, "codex:closeout-action-plan");
successfulOutputs.push(fileInput.stdout);

const stdinInput = await runActionPlan({
  stdin: JSON.stringify(delegatedPass),
  env: {
    CODEX_ACTION_PLAN_OUTPUT: "json",
  },
});
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(JSON.parse(stdinInput.stdout).helper, "codex:closeout-action-plan");
successfulOutputs.push(stdinInput.stdout);

const pipelineForbidden = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(
      buildPipeline({
        operationMode: "delegated",
        pipelineStatus: "pass",
        pipelineForbiddenActions: ["prepare_pr_body"],
      }),
    ),
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body",
    CODEX_ACTION_PLAN_OUTPUT: "json",
  },
});
assert.equal(pipelineForbidden.status, 0, pipelineForbidden.stderr);
assertDecision(JSON.parse(pipelineForbidden.stdout), "prepare_pr_body", "deny", "forbidden_action");
successfulOutputs.push(pipelineForbidden.stdout);

const humanAssisted = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(buildPipeline({ operationMode: "human_assisted", pipelineStatus: "pass" })),
    CODEX_REQUESTED_ACTIONS: "delegated_handoff",
    CODEX_ACTION_PLAN_OUTPUT: "json",
  },
});
assert.equal(humanAssisted.status, 0, humanAssisted.stderr);
assertDecision(JSON.parse(humanAssisted.stdout), "delegated_handoff", "needs_review", "human_operator_in_loop_required");
successfulOutputs.push(humanAssisted.stdout);

const needsReview = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(buildPipeline({ operationMode: "delegated", pipelineStatus: "needs_review" })),
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body,create_pr_comment",
    CODEX_ACTION_PLAN_OUTPUT: "json",
  },
});
assert.equal(needsReview.status, 0, needsReview.stderr);
const needsReviewJson = JSON.parse(needsReview.stdout);
assert.equal(needsReviewJson.plan_status, "needs_review");
assertDecision(needsReviewJson, "prepare_pr_body", "needs_review");
assertDecision(needsReviewJson, "create_pr_comment", "deny");
successfulOutputs.push(needsReview.stdout);

const failedPipeline = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(buildPipeline({ operationMode: "delegated", pipelineStatus: "fail" })),
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body,delegated_handoff,request_human_review",
    CODEX_ACTION_PLAN_OUTPUT: "json",
  },
});
assert.equal(failedPipeline.status, 0, failedPipeline.stderr);
const failedPipelineJson = JSON.parse(failedPipeline.stdout);
assert.equal(failedPipelineJson.plan_status, "fail");
assert.ok(failedPipelineJson.action_decisions.every((item) => item.decision === "deny"));
successfulOutputs.push(failedPipeline.stdout);

const defaultForbiddenWins = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_REQUESTED_ACTIONS: "create_pr_comment",
    CODEX_POLICY_ALLOWED_ACTIONS: "create_pr_comment",
    CODEX_ACTION_PLAN_OUTPUT: "json",
  },
});
assert.equal(defaultForbiddenWins.status, 0, defaultForbiddenWins.stderr);
assertDecision(JSON.parse(defaultForbiddenWins.stdout), "create_pr_comment", "deny", "forbidden_action");
successfulOutputs.push(defaultForbiddenWins.stdout);

const explicitActuationGate = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_REQUESTED_ACTIONS: "create_pr_comment",
    CODEX_POLICY_ALLOWED_ACTIONS: "create_pr_comment",
    CODEX_POLICY_FORBIDDEN_ACTIONS: "",
    CODEX_ACTION_PLAN_OUTPUT: "json",
  },
});
assert.equal(explicitActuationGate.status, 0, explicitActuationGate.stderr);
assertDecision(
  JSON.parse(explicitActuationGate.stdout),
  "create_pr_comment",
  "needs_review",
  "separate_authority_gate_required",
  "separate_authority_gate",
);
successfulOutputs.push(explicitActuationGate.stdout);

const requirePipelinePass = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(buildPipeline({ operationMode: "delegated", pipelineStatus: "needs_review" })),
    CODEX_REQUESTED_ACTIONS: "delegated_handoff",
    CODEX_ACTION_PLAN_OUTPUT: "json",
    CODEX_REQUIRE_PIPELINE_PASS: "true",
  },
});
assert.equal(requirePipelinePass.status, 0, requirePipelinePass.stderr);
assert.notEqual(findDecision(JSON.parse(requirePipelinePass.stdout), "delegated_handoff").decision, "allow");
successfulOutputs.push(requirePipelinePass.stdout);

const relaxedPipelinePass = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(buildPipeline({ operationMode: "delegated", pipelineStatus: "needs_review" })),
    CODEX_REQUESTED_ACTIONS: "prepare_pr_body",
    CODEX_ACTION_PLAN_OUTPUT: "json",
    CODEX_REQUIRE_PIPELINE_PASS: "false",
  },
});
assert.equal(relaxedPipelinePass.status, 0, relaxedPipelinePass.stderr);
assertDecision(JSON.parse(relaxedPipelinePass.stdout), "prepare_pr_body", "allow");
successfulOutputs.push(relaxedPipelinePass.stdout);

const jsonOnly = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_ACTION_PLAN_OUTPUT: "json",
  },
});
assert.equal(jsonOnly.status, 0, jsonOnly.stderr);
assert.equal(JSON.parse(jsonOnly.stdout).helper, "codex:closeout-action-plan");
assert.doesNotMatch(jsonOnly.stdout, /Codex closeout action plan/);
successfulOutputs.push(jsonOnly.stdout);

const summaryOnly = await runActionPlan({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_ACTION_PLAN_OUTPUT: "summary",
  },
});
assert.equal(summaryOnly.status, 0, summaryOnly.stderr);
assert.match(summaryOnly.stdout, /Codex closeout action plan/);
assert.doesNotMatch(summaryOnly.stdout, new RegExp(beginMarker));
successfulOutputs.push(summaryOnly.stdout);

await assertInvalid({
  expected: /CODEX_CLOSEOUT_ACTION_PLAN_MISSING_INPUT/,
});
await assertInvalid({
  env: { CODEX_CLOSEOUT_PIPELINE_JSON: "{nope" },
  expected: /CODEX_CLOSEOUT_ACTION_PLAN_INVALID_JSON/,
});
await assertInvalid({
  env: { CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify({ ...delegatedPass, helper: "codex:closeout-check" }) },
  expected: /CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(
      buildPipeline({
        operationMode: "delegated",
        pipelineStatus: "pass",
        closeoutCheckOverrides: { validation_status: "fail" },
      }),
    ),
  },
  expected: /CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(
      buildPipeline({
        operationMode: "delegated",
        pipelineStatus: "pass",
        closeoutCheckOverrides: { operation_mode: "human_assisted" },
      }),
    ),
  },
  expected: /CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(
      buildPipeline({
        operationMode: "delegated",
        pipelineStatus: "pass",
        closeoutCheckOverrides: { delegated_consumption: false },
      }),
    ),
  },
  expected: /CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(
      buildPipeline({
        operationMode: "delegated",
        pipelineStatus: "pass",
        closeoutCheckOverrides: { helper: "codex:closeout-block" },
      }),
    ),
  },
  expected: /CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_REQUESTED_ACTIONS: '["prepare_pr_body", 7]',
  },
  expected: /CODEX_CLOSEOUT_ACTION_PLAN_INVALID_LIST_ENV CODEX_REQUESTED_ACTIONS/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_ACTION_PLAN_OUTPUT: "xml",
  },
  expected: /CODEX_CLOSEOUT_ACTION_PLAN_INVALID_OUTPUT/,
});
await assertInvalid({
  env: {
    CODEX_CLOSEOUT_PIPELINE_JSON: JSON.stringify(delegatedPass),
    CODEX_REQUIRE_PIPELINE_PASS: "maybe",
  },
  expected: /CODEX_CLOSEOUT_ACTION_PLAN_INVALID_BOOLEAN CODEX_REQUIRE_PIPELINE_PASS/,
});

for (const output of successfulOutputs) {
  assertNoForbiddenPhrases(output);
  assertNoSecrets(output);
}

console.log(
  JSON.stringify(
    {
      smoke: "codex-closeout-action-plan",
      both_mode_checked: true,
      json_only_checked: true,
      summary_only_checked: true,
      env_input_checked: true,
      file_input_checked: true,
      stdin_input_checked: true,
      delegated_pass_policy_checked: true,
      human_assisted_delegated_handoff_checked: true,
      needs_review_pipeline_checked: true,
      failed_pipeline_checked: true,
      explicit_policy_checked: true,
      pipeline_pass_requirement_checked: true,
      invalid_input_checked: true,
      closeout_check_consistency_checked: true,
      forbidden_public_overclaims_checked: true,
      fake_secret_absence_checked: true,
      http_server_started: false,
      openai_calls: 0,
      github_calls: 0,
      provider_calls: 0,
      mutation_routes_called: 0,
    },
    null,
    2,
  ),
);

function buildPipeline({ operationMode, pipelineStatus, pipelineForbiddenActions = [], closeoutCheckOverrides = {} }) {
  const delegatedConsumption = operationMode === "delegated";
  return {
    helper: "codex:closeout-pipeline",
    version: 1,
    operation_mode: operationMode,
    delegated_consumption: delegatedConsumption,
    pipeline_status: pipelineStatus,
    closeout_status: "ready_for_review",
    scope: "project:custom scope/208",
    work_id: "AG-208 closeout/action-plan",
    related_pr: "https://github.com/Aurna-code/augnes/pull/208",
    closeout: {
      helper: "codex:closeout-block",
      version: "1",
      operation_mode: operationMode,
      forbidden_actions: pipelineForbiddenActions,
    },
    closeout_check: {
      helper: "codex:closeout-check",
      version: 1,
      validation_status: pipelineStatus,
      operation_mode: operationMode,
      delegated_consumption: delegatedConsumption,
      ...closeoutCheckOverrides,
    },
    recommended_next_action:
      "Use this local material as input to a separate policy gate before any posting, approval, merge, publication, or mutation.",
    authority_boundary:
      "The pipeline runs local formatting and validation only. It does not call GitHub/OpenAI and does not mutate Augnes.",
  };
}

function markedPipeline(pipeline) {
  return ["summary text", pipelineBeginMarker, JSON.stringify(pipeline, null, 2), pipelineEndMarker].join("\n");
}

function runActionPlan({ env = {}, stdin = "" } = {}) {
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
      ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:closeout-action-plan"],
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
  const result = await runActionPlan({ env });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, expected);
  assertNoSecrets(result.stderr);
}

function extractActionPlanJson(output) {
  const begin = output.indexOf(beginMarker);
  const end = output.indexOf(endMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + beginMarker.length, end).trim());
}

function findDecision(plan, action) {
  const found = plan.action_decisions.find((item) => item.action === action);
  assert.ok(found, `missing action decision for ${action}`);
  return found;
}

function assertDecision(plan, action, decision, reason, requiredGate) {
  const found = findDecision(plan, action);
  assert.equal(found.decision, decision);
  if (reason) assert.equal(found.reason, reason);
  if (requiredGate !== undefined) assert.equal(found.required_gate, requiredGate);
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
