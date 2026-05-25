import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const beginMarker = "BEGIN_AUGNES_CODEX_ACTUATION_GATE_JSON";
const endMarker = "END_AUGNES_CODEX_ACTUATION_GATE_JSON";
const actionPlanBeginMarker = "BEGIN_AUGNES_CODEX_ACTION_PLAN_JSON";
const actionPlanEndMarker = "END_AUGNES_CODEX_ACTION_PLAN_JSON";
const fakeGithubToken = "fake-gh-token-actuation-gate";
const fakeOpenAiKey = "fake-openai-key-actuation-gate";
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
const basePlan = buildActionPlan();
const validCommentGrant = buildGrant({ actions: ["create_pr_comment"] });

const both = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: markedActionPlan(basePlan),
    CODEX_INTENDED_ACTION: "create_pr_comment",
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(validCommentGrant),
    CODEX_ACTUATION_GATE_OUTPUT: "both",
  },
});
assert.equal(both.status, 0, both.stderr);
assert.match(both.stdout, /Codex actuation gate/);
assert.match(both.stdout, new RegExp(`${beginMarker}\\n`));
assert.match(both.stdout, new RegExp(`\\n${endMarker}\\n?$`));
const bothJson = extractGateJson(both.stdout);
assert.equal(bothJson.gate_status, "gate_passed");
assert.equal(bothJson.reason, "authority_grant_valid");
assert.equal(bothJson.authority_grant_required, true);
assert.equal(bothJson.authority_grant_present, true);
assert.equal(bothJson.authority_grant_valid, true);
assert.equal(bothJson.grant_id, validCommentGrant.grant_id);
assertNoSecrets(both.stdout + both.stderr);
successfulOutputs.push(both.stdout);

const jsonOnly = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(jsonOnly.status, 0, jsonOnly.stderr);
const jsonOnlyParsed = JSON.parse(jsonOnly.stdout);
assert.equal(jsonOnlyParsed.gate_status, "gate_passed");
assert.equal(jsonOnlyParsed.reason, "local_plan_allows_action");
assert.equal(jsonOnlyParsed.authority_grant_required, false);
assert.doesNotMatch(jsonOnly.stdout, /Codex actuation gate/);
successfulOutputs.push(jsonOnly.stdout);

const summaryOnly = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_ACTUATION_GATE_OUTPUT: "summary",
  },
});
assert.equal(summaryOnly.status, 0, summaryOnly.stderr);
assert.match(summaryOnly.stdout, /Codex actuation gate/);
assert.doesNotMatch(summaryOnly.stdout, new RegExp(beginMarker));
successfulOutputs.push(summaryOnly.stdout);

const planDenied = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "merge_pr",
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant({ actions: ["merge_pr"] })),
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(planDenied.status, 0, planDenied.stderr);
assertGate(JSON.parse(planDenied.stdout), "denied", "plan_denied");
successfulOutputs.push(planDenied.stdout);

const actionNotInPlan = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "publish_external",
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(actionNotInPlan.status, 0, actionNotInPlan.stderr);
assertGate(JSON.parse(actionNotInPlan.stdout), "denied", "action_not_in_plan");
successfulOutputs.push(actionNotInPlan.stdout);

const unsupportedIntendedAction = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "invent_new_action",
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(unsupportedIntendedAction.status, 0, unsupportedIntendedAction.stderr);
const unsupportedIntendedActionJson = JSON.parse(unsupportedIntendedAction.stdout);
assertGate(unsupportedIntendedActionJson, "denied", "unknown_action");
assert.equal(unsupportedIntendedActionJson.required_gate, "supported_action_required");
assert.equal(unsupportedIntendedActionJson.authority_grant_required, false);
successfulOutputs.push(unsupportedIntendedAction.stdout);

const planFail = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(
      buildActionPlan({
        pipeline_status: "fail",
        plan_status: "fail",
        action_decisions: [decision("prepare_pr_body", "allow", "fixture_allow", null)],
      }),
    ),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(planFail.status, 0, planFail.stderr);
assertGate(JSON.parse(planFail.stdout), "denied", "plan_failed");
successfulOutputs.push(planFail.stdout);

const needsReviewWithoutGrant = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "create_pr_comment",
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(needsReviewWithoutGrant.status, 0, needsReviewWithoutGrant.stderr);
assertGate(JSON.parse(needsReviewWithoutGrant.stdout), "needs_review", "authority_grant_missing");
successfulOutputs.push(needsReviewWithoutGrant.stdout);

const humanMissingConstraint = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "delegated_handoff",
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant({ actions: ["delegated_handoff"], constraints: [] })),
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(humanMissingConstraint.status, 0, humanMissingConstraint.stderr);
assertGate(JSON.parse(humanMissingConstraint.stdout), "needs_review", "human_operator_in_loop_required");
successfulOutputs.push(humanMissingConstraint.stdout);

const humanWithConstraint = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "delegated_handoff",
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(
      buildGrant({ actions: ["delegated_handoff"], constraints: ["human_operator_in_loop"] }),
    ),
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(humanWithConstraint.status, 0, humanWithConstraint.stderr);
assertGate(JSON.parse(humanWithConstraint.stdout), "gate_passed", "authority_grant_valid");
successfulOutputs.push(humanWithConstraint.stdout);

const pipelinePassRequired = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "run_missing_checks",
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant({ actions: ["run_missing_checks"] })),
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(pipelinePassRequired.status, 0, pipelinePassRequired.stderr);
assertGate(JSON.parse(pipelinePassRequired.stdout), "needs_review", "pipeline_pass_required");
successfulOutputs.push(pipelinePassRequired.stdout);

const externalAllowNeedsGrant = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(
      buildActionPlan({
        action_decisions: [decision("record_completion", "allow", "fixture_allow", null)],
      }),
    ),
    CODEX_INTENDED_ACTION: "record_completion",
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(externalAllowNeedsGrant.status, 0, externalAllowNeedsGrant.stderr);
assertGate(JSON.parse(externalAllowNeedsGrant.stdout), "needs_review", "authority_grant_missing");
successfulOutputs.push(externalAllowNeedsGrant.stdout);

const externalAllowWithGrant = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(
      buildActionPlan({
        action_decisions: [decision("record_completion", "allow", "fixture_allow", null)],
      }),
    ),
    CODEX_INTENDED_ACTION: "record_completion",
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(buildGrant({ actions: ["record_completion"] })),
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(externalAllowWithGrant.status, 0, externalAllowWithGrant.stderr);
assertGate(JSON.parse(externalAllowWithGrant.stdout), "gate_passed", "authority_grant_valid");
successfulOutputs.push(externalAllowWithGrant.stdout);

const filePath = path.join(tmpdir(), `augnes-actuation-gate-plan-${process.pid}.json`);
await writeFile(filePath, JSON.stringify(basePlan), "utf8");
const fileInput = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON_FILE: filePath,
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(fileInput.status, 0, fileInput.stderr);
assert.equal(JSON.parse(fileInput.stdout).helper, "codex:actuation-gate");
successfulOutputs.push(fileInput.stdout);

const grantFilePath = path.join(tmpdir(), `augnes-actuation-gate-grant-${process.pid}.json`);
await writeFile(grantFilePath, JSON.stringify(validCommentGrant), "utf8");
const grantFileInput = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_AUTHORITY_GRANT_JSON_FILE: grantFilePath,
    CODEX_INTENDED_ACTION: "create_pr_comment",
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(grantFileInput.status, 0, grantFileInput.stderr);
assertGate(JSON.parse(grantFileInput.stdout), "gate_passed", "authority_grant_valid");
successfulOutputs.push(grantFileInput.stdout);

const stdinInput = await runGate({
  stdin: JSON.stringify(basePlan),
  env: {
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(JSON.parse(stdinInput.stdout).helper, "codex:actuation-gate");
successfulOutputs.push(stdinInput.stdout);

await assertInvalid({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "create_pr_comment",
    CODEX_AUTHORITY_GRANT_JSON: "{nope",
  },
  expected: /CODEX_ACTUATION_GATE_INVALID_GRANT_JSON/,
});
await assertInvalidGrant({ grant: { ...validCommentGrant, helper: undefined }, expected: /CODEX_ACTUATION_GATE_INVALID_GRANT/ });
await assertInvalidGrant({
  grant: buildGrant({ actions: ["merge_pr"] }),
  expected: /CODEX_ACTUATION_GATE_INVALID_GRANT/,
});
await assertInvalidGrant({
  grant: buildGrant({ actions: ["create_pr_comment"], forbidden_actions: ["create_pr_comment"] }),
  expected: /CODEX_ACTUATION_GATE_INVALID_GRANT/,
});
await assertInvalidGrant({
  grant: buildGrant({ actions: ["create_pr_comment"], scope: "project:wrong" }),
  expected: /CODEX_ACTUATION_GATE_INVALID_GRANT/,
});
await assertInvalidGrant({
  grant: buildGrant({ actions: ["create_pr_comment"], work_id: "AG-wrong" }),
  expected: /CODEX_ACTUATION_GATE_INVALID_GRANT/,
});
await assertInvalidGrant({
  grant: buildGrant({ actions: ["create_pr_comment"], related_pr: "https://github.com/Aurna-code/augnes/pull/999" }),
  expected: /CODEX_ACTUATION_GATE_INVALID_GRANT/,
});
await assertInvalidGrant({
  grant: buildGrant({
    actions: ["create_pr_comment"],
    authority_boundary: "This is a local authorization fixture.",
  }),
  expected: /CODEX_ACTUATION_GATE_INVALID_GRANT/,
});
await assertInvalid({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify({ ...basePlan, helper: "codex:closeout-pipeline" }),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
  },
  expected: /CODEX_ACTUATION_GATE_INVALID_ACTION_PLAN/,
});
await assertInvalid({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(
      buildActionPlan({
        action_decisions: [decision("invent_new_action", "allow", "fixture_allow", null)],
      }),
    ),
    CODEX_INTENDED_ACTION: "invent_new_action",
  },
  expected: /CODEX_ACTUATION_GATE_INVALID_ACTION_PLAN/,
});
await assertInvalid({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(
      buildActionPlan({
        action_decisions: [
          decision("prepare_pr_body", "allow", "allowed_local_planning_action", null),
          decision("prepare_pr_body", "deny", "conflicting_fixture", "policy_forbidden"),
        ],
      }),
    ),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
  },
  expected: /CODEX_ACTUATION_GATE_INVALID_ACTION_PLAN/,
});
await assertInvalid({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
  },
  expected: /CODEX_ACTUATION_GATE_MISSING_ACTION/,
});
await assertInvalid({
  expected: /CODEX_ACTUATION_GATE_MISSING_INPUT/,
});
await assertInvalid({
  env: {
    CODEX_ACTION_PLAN_JSON: "{nope",
    CODEX_INTENDED_ACTION: "prepare_pr_body",
  },
  expected: /CODEX_ACTUATION_GATE_INVALID_JSON/,
});
await assertInvalid({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
    CODEX_INTENDED_ACTION: "prepare_pr_body",
    CODEX_ACTUATION_GATE_OUTPUT: "xml",
  },
  expected: /CODEX_ACTUATION_GATE_INVALID_OUTPUT/,
});

for (const output of successfulOutputs) {
  assertNoForbiddenPhrases(output);
  assertNoSecrets(output);
}

console.log(
  JSON.stringify(
    {
      smoke: "codex-actuation-gate",
      both_mode_checked: true,
      json_only_checked: true,
      summary_only_checked: true,
      env_input_checked: true,
      file_input_checked: true,
      stdin_input_checked: true,
      authority_grant_file_input_checked: true,
      local_allowed_action_checked: true,
      plan_denied_action_checked: true,
      action_not_in_plan_checked: true,
      unsupported_intended_action_denied: true,
      plan_fail_checked: true,
      needs_review_without_grant_checked: true,
      human_operator_in_loop_checked: true,
      pipeline_pass_required_checked: true,
      external_allow_defense_in_depth_checked: true,
      unsupported_action_decision_rejected: true,
      duplicate_action_decision_rejected: true,
      invalid_grants_checked: true,
      invalid_action_plan_checked: true,
      missing_action_checked: true,
      missing_input_checked: true,
      invalid_output_mode_checked: true,
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

function buildActionPlan(overrides = {}) {
  return {
    helper: "codex:closeout-action-plan",
    version: 1,
    operation_mode: "delegated",
    delegated_consumption: true,
    pipeline_status: "pass",
    plan_status: "pass",
    scope: "project:custom scope/209",
    work_id: "AG-209 actuation/gate",
    related_pr: "https://github.com/Aurna-code/augnes/pull/209",
    requested_actions: [
      "prepare_pr_body",
      "create_pr_comment",
      "merge_pr",
      "delegated_handoff",
      "run_missing_checks",
    ],
    action_decisions: [
      decision("prepare_pr_body", "allow", "allowed_local_planning_action", null),
      decision("create_pr_comment", "needs_review", "separate_authority_gate_required", "separate_authority_gate"),
      decision("merge_pr", "deny", "forbidden_action", "policy_forbidden"),
      decision("delegated_handoff", "needs_review", "human_operator_in_loop_required", "human_operator_in_loop"),
      decision("run_missing_checks", "needs_review", "pipeline_needs_review", "pipeline_pass_required"),
    ],
    authority_boundary:
      "The helper produces a local policy-gated action plan only. It does not execute, post, approve, merge, publish, call providers, call GitHub, create evidence, create proof, mutate Augnes, or commit/reject state.",
    ...overrides,
  };
}

function decision(action, value, reason, requiredGate) {
  return {
    action,
    decision: value,
    reason,
    required_gate: requiredGate,
  };
}

function buildGrant(overrides = {}) {
  return {
    helper: "codex:authority-grant",
    version: 1,
    grant_id: "grant-209-fixture",
    granted_by: "human-operator-fixture",
    granted_to: "codex-fixture",
    scope: "project:custom scope/209",
    work_id: "AG-209 actuation/gate",
    related_pr: "https://github.com/Aurna-code/augnes/pull/209",
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

function markedActionPlan(plan) {
  return ["summary text", actionPlanBeginMarker, JSON.stringify(plan, null, 2), actionPlanEndMarker].join("\n");
}

function runGate({ env = {}, stdin = "" } = {}) {
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
      ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:actuation-gate"],
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
  const result = await runGate({ env });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, expected);
  assertNoSecrets(result.stderr);
}

async function assertInvalidGrant({ grant, expected }) {
  await assertInvalid({
    env: {
      CODEX_ACTION_PLAN_JSON: JSON.stringify(basePlan),
      CODEX_INTENDED_ACTION: "create_pr_comment",
      CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(grant),
    },
    expected,
  });
}

function extractGateJson(output) {
  const begin = output.indexOf(beginMarker);
  const end = output.indexOf(endMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + beginMarker.length, end).trim());
}

function assertGate(result, status, reason) {
  assert.equal(result.gate_status, status);
  assert.equal(result.reason, reason);
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
