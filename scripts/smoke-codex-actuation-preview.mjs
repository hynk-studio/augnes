import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const beginMarker = "BEGIN_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const endMarker = "END_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const gateBeginMarker = "BEGIN_AUGNES_CODEX_ACTUATION_GATE_JSON";
const gateEndMarker = "END_AUGNES_CODEX_ACTUATION_GATE_JSON";
const fakeGithubToken = "fake-gh-token-actuation-preview";
const fakeOpenAiKey = "fake-openai-key-actuation-preview";
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
const commentBody = "Prepared PR comment body for a later separate actuation helper.";
const gatePassedComment = buildGate({ intended_action: "create_pr_comment" });

const both = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: markedGate(gatePassedComment),
    CODEX_ACTUATION_PREVIEW_BODY: commentBody,
    CODEX_ACTUATION_PREVIEW_OUTPUT: "both",
  },
});
assert.equal(both.status, 0, both.stderr);
assert.match(both.stdout, /Codex actuation preview/);
assert.match(both.stdout, new RegExp(`${beginMarker}\\n`));
assert.match(both.stdout, new RegExp(`\\n${endMarker}\\n?$`));
const bothJson = extractPreviewJson(both.stdout);
assert.equal(bothJson.preview_status, "ready_for_separate_actuation");
assert.equal(bothJson.execution_permitted_by_gate, true);
assert.equal(bothJson.dry_run_only, true);
assert.equal(bothJson.would_execute, false);
assert.equal(bothJson.requires_separate_actuation_helper, true);
assert.equal(bothJson.operation_preview.operation_kind, "github_write");
assert.equal(bothJson.operation_preview.method_preview, "would_POST");
assert.equal(bothJson.target_status, "present");
assert.equal(bothJson.operation_preview.body_present, true);
assert.ok(bothJson.operation_preview.body_length > 0);
assert.equal("body_preview" in bothJson.operation_preview, false);
assertNoSecrets(both.stdout + both.stderr);
successfulOutputs.push(both.stdout);

const includeBody = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(gatePassedComment),
    CODEX_ACTUATION_PREVIEW_BODY: commentBody,
    CODEX_ACTUATION_PREVIEW_INCLUDE_BODY: "true",
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(includeBody.status, 0, includeBody.stderr);
assert.equal(JSON.parse(includeBody.stdout).operation_preview.body_preview, commentBody);
successfulOutputs.push(includeBody.stdout);

const jsonOnly = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate({ intended_action: "prepare_pr_body" })),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(jsonOnly.status, 0, jsonOnly.stderr);
assert.equal(JSON.parse(jsonOnly.stdout).helper, "codex:actuation-preview");
assert.doesNotMatch(jsonOnly.stdout, /Codex actuation preview/);
successfulOutputs.push(jsonOnly.stdout);

const summaryOnly = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate({ intended_action: "prepare_pr_body" })),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "summary",
  },
});
assert.equal(summaryOnly.status, 0, summaryOnly.stderr);
assert.match(summaryOnly.stdout, /Codex actuation preview/);
assert.doesNotMatch(summaryOnly.stdout, new RegExp(beginMarker));
successfulOutputs.push(summaryOnly.stdout);

const deniedGate = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(
      buildGate({ intended_action: "merge_pr", gate_status: "denied", reason: "plan_denied" }),
    ),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(deniedGate.status, 0, deniedGate.stderr);
const deniedGateJson = JSON.parse(deniedGate.stdout);
assert.equal(deniedGateJson.preview_status, "blocked");
assert.equal(deniedGateJson.execution_permitted_by_gate, false);
assert.equal(deniedGateJson.would_execute, false);
successfulOutputs.push(deniedGate.stdout);

const needsReviewGate = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(
      buildGate({ intended_action: "create_pr_comment", gate_status: "needs_review", reason: "authority_grant_missing" }),
    ),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(needsReviewGate.status, 0, needsReviewGate.stderr);
assert.equal(JSON.parse(needsReviewGate.stdout).preview_status, "needs_review");
successfulOutputs.push(needsReviewGate.stdout);

const missingStrictTarget = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(
      buildGate({ intended_action: "create_pr_comment", related_pr: null }),
    ),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(missingStrictTarget.status, 0, missingStrictTarget.stderr);
const missingStrictTargetJson = JSON.parse(missingStrictTarget.stdout);
assert.equal(missingStrictTargetJson.preview_status, "needs_review");
assert.equal(missingStrictTargetJson.target_status, "missing");
assert.ok(missingStrictTargetJson.blockers.includes("target_missing"));
successfulOutputs.push(missingStrictTarget.stdout);

const missingRelaxedTarget = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(
      buildGate({ intended_action: "create_pr_comment", related_pr: null }),
    ),
    CODEX_ACTUATION_PREVIEW_STRICT_TARGETS: "false",
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(missingRelaxedTarget.status, 0, missingRelaxedTarget.stderr);
const missingRelaxedTargetJson = JSON.parse(missingRelaxedTarget.stdout);
assert.equal(missingRelaxedTargetJson.preview_status, "ready_for_separate_actuation");
assert.equal(missingRelaxedTargetJson.target_status, "missing");
assert.ok(missingRelaxedTargetJson.warnings.includes("target_missing"));
successfulOutputs.push(missingRelaxedTarget.stdout);

const localAction = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(
      buildGate({ intended_action: "prepare_pr_body", related_pr: null, work_id: null }),
    ),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(localAction.status, 0, localAction.stderr);
const localActionJson = JSON.parse(localAction.stdout);
assert.equal(localActionJson.preview_status, "ready_for_separate_actuation");
assert.equal(localActionJson.target_status, "not_required");
assert.equal(localActionJson.operation_preview.operation_kind, "local_handoff");
assert.equal(localActionJson.operation_preview.method_preview, "none");
successfulOutputs.push(localAction.stdout);

const localActionNoGrant = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(
      buildGate({
        intended_action: "prepare_pr_body",
        planned_decision: "allow",
        required_gate: null,
        authority_grant_required: false,
        authority_grant_present: false,
        authority_grant_valid: false,
        grant_id: null,
        related_pr: null,
        work_id: null,
      }),
    ),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(localActionNoGrant.status, 0, localActionNoGrant.stderr);
assert.equal(JSON.parse(localActionNoGrant.stdout).preview_status, "ready_for_separate_actuation");
successfulOutputs.push(localActionNoGrant.stdout);

const augnesAction = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate({ intended_action: "record_completion" })),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(augnesAction.status, 0, augnesAction.stderr);
const augnesActionJson = JSON.parse(augnesAction.stdout);
assert.equal(augnesActionJson.operation_preview.operation_kind, "augnes_write");
assert.equal(augnesActionJson.operation_preview.method_preview, "would_POST");
assert.equal(augnesActionJson.target_status, "present");
successfulOutputs.push(augnesAction.stdout);

const augnesMissingWork = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate({ intended_action: "record_completion", work_id: null })),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(augnesMissingWork.status, 0, augnesMissingWork.stderr);
const augnesMissingWorkJson = JSON.parse(augnesMissingWork.stdout);
assert.equal(augnesMissingWorkJson.preview_status, "needs_review");
assert.equal(augnesMissingWorkJson.target_status, "missing");
successfulOutputs.push(augnesMissingWork.stdout);

const providerAction = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate({ intended_action: "call_provider" })),
    CODEX_ACTUATION_PREVIEW_TARGET_REF: "provider:fixture",
    CODEX_ACTUATION_PAYLOAD_JSON: JSON.stringify({ target_ref: "provider:payload", model: "fixture-model" }),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(providerAction.status, 0, providerAction.stderr);
const providerActionJson = JSON.parse(providerAction.stdout);
assert.equal(providerActionJson.operation_preview.operation_kind, "provider_call");
assert.equal(providerActionJson.operation_preview.method_preview, "would_CALL");
assert.deepEqual(providerActionJson.operation_preview.payload_keys, ["model", "target_ref"]);
assert.equal(providerActionJson.operation_preview.target_ref, "provider:fixture");
successfulOutputs.push(providerAction.stdout);

const payloadFilePath = path.join(tmpdir(), `augnes-actuation-preview-payload-${process.pid}.json`);
await writeFile(payloadFilePath, JSON.stringify({ target_ref: "https://github.com/Aurna-code/augnes/pull/210", body: "payload body" }), "utf8");
const payloadFileInput = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate({ intended_action: "create_pr_review", related_pr: null })),
    CODEX_ACTUATION_PAYLOAD_JSON_FILE: payloadFilePath,
    CODEX_ACTUATION_PREVIEW_INCLUDE_BODY: "true",
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(payloadFileInput.status, 0, payloadFileInput.stderr);
const payloadFileInputJson = JSON.parse(payloadFileInput.stdout);
assert.equal(payloadFileInputJson.operation_preview.target_ref, "https://github.com/Aurna-code/augnes/pull/210");
assert.equal(payloadFileInputJson.operation_preview.body_preview, "payload body");
successfulOutputs.push(payloadFileInput.stdout);

const gateFilePath = path.join(tmpdir(), `augnes-actuation-preview-gate-${process.pid}.json`);
await writeFile(gateFilePath, markedGate(buildGate({ intended_action: "prepare_pr_body" })), "utf8");
const fileInput = await runPreview({
  env: {
    CODEX_ACTUATION_GATE_JSON_FILE: gateFilePath,
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(fileInput.status, 0, fileInput.stderr);
assert.equal(JSON.parse(fileInput.stdout).helper, "codex:actuation-preview");
successfulOutputs.push(fileInput.stdout);

const stdinInput = await runPreview({
  stdin: JSON.stringify(buildGate({ intended_action: "prepare_pr_body" })),
  env: {
    CODEX_ACTUATION_PREVIEW_OUTPUT: "json",
  },
});
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(JSON.parse(stdinInput.stdout).helper, "codex:actuation-preview");
successfulOutputs.push(stdinInput.stdout);

await assertInvalid({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate({ intended_action: "invent_new_action" })),
  },
  expected: /CODEX_ACTUATION_PREVIEW_UNSUPPORTED_ACTION/,
});
await assertInvalid({
  env: {
    CODEX_ACTUATION_GATE_JSON: "{nope",
  },
  expected: /CODEX_ACTUATION_PREVIEW_INVALID_JSON/,
});
await assertInvalid({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify({ ...buildGate(), helper: "codex:actuation-preview" }),
  },
  expected: /CODEX_ACTUATION_PREVIEW_INVALID_GATE/,
});
await assertInvalidGateConsistency({
  gate: buildGate({ authority_grant_required: true, authority_grant_valid: false }),
});
await assertInvalidGateConsistency({
  gate: buildGate({ authority_grant_required: true, grant_id: null }),
});
await assertInvalidGateConsistency({
  gate: buildGate({ planned_decision: "deny" }),
});
await assertInvalidGateConsistency({
  gate: buildGate({ pipeline_status: "fail" }),
});
await assertInvalidGateConsistency({
  gate: buildGate({ authority_grant_valid: true, authority_grant_present: false }),
});
await assertInvalidGateConsistency({
  gate: buildGate({ planned_decision: null }),
});
await assertInvalidGrantRequiredGatePassed("create_pr_comment");
await assertInvalidGrantRequiredGatePassed("record_completion");
await assertInvalidGrantRequiredGatePassed("call_provider");
await assertInvalidGrantRequiredGatePassed("mutate_augnes_state");
await assertInvalid({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate()),
    CODEX_ACTUATION_PAYLOAD_JSON: "{nope",
  },
  expected: /CODEX_ACTUATION_PREVIEW_INVALID_PAYLOAD_JSON/,
});
await assertInvalid({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate()),
    CODEX_ACTUATION_PAYLOAD_JSON: "[1,2,3]",
  },
  expected: /CODEX_ACTUATION_PREVIEW_INVALID_PAYLOAD/,
});
await assertInvalid({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate()),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "xml",
  },
  expected: /CODEX_ACTUATION_PREVIEW_INVALID_OUTPUT/,
});
await assertInvalid({
  env: {
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(buildGate()),
    CODEX_ACTUATION_PREVIEW_INCLUDE_BODY: "maybe",
  },
  expected: /CODEX_ACTUATION_PREVIEW_INVALID_BOOLEAN CODEX_ACTUATION_PREVIEW_INCLUDE_BODY/,
});
await assertInvalid({
  expected: /CODEX_ACTUATION_PREVIEW_MISSING_INPUT/,
});

for (const output of successfulOutputs) {
  assertNoForbiddenPhrases(output);
  assertNoSecrets(output);
}

console.log(
  JSON.stringify(
    {
      smoke: "codex-actuation-preview",
      both_mode_checked: true,
      include_body_checked: true,
      json_only_checked: true,
      summary_only_checked: true,
      denied_gate_checked: true,
      needs_review_gate_checked: true,
      missing_strict_target_checked: true,
      relaxed_missing_target_warning_checked: true,
      local_action_checked: true,
      local_action_without_grant_checked: true,
      augnes_action_checked: true,
      provider_action_checked: true,
      payload_file_input_checked: true,
      gate_file_input_checked: true,
      stdin_input_checked: true,
      unsupported_action_failed: true,
      invalid_gate_json_failed: true,
      invalid_gate_shape_failed: true,
      invalid_gate_consistency_failed: true,
      grant_required_action_consistency_failed: true,
      invalid_payload_json_failed: true,
      invalid_payload_shape_failed: true,
      invalid_output_mode_failed: true,
      invalid_boolean_env_failed: true,
      missing_input_failed: true,
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

function buildGate(overrides = {}) {
  return {
    helper: "codex:actuation-gate",
    version: 1,
    operation_mode: "delegated",
    delegated_consumption: true,
    pipeline_status: "pass",
    plan_status: "pass",
    intended_action: "create_pr_comment",
    planned_decision: "needs_review",
    gate_status: "gate_passed",
    reason: "authority_grant_valid",
    required_gate: "separate_authority_gate",
    authority_grant_required: true,
    authority_grant_present: true,
    authority_grant_valid: true,
    grant_id: "grant-210-fixture",
    scope: "project:custom scope/210",
    work_id: "AG-210 actuation/preview",
    related_pr: "https://github.com/Aurna-code/augnes/pull/210",
    forbidden_actions: [],
    constraints: ["dry_run_only"],
    next_step:
      "This local gate is satisfied; execution still requires a separate actuation helper or human/operator process.",
    authority_boundary:
      "The helper validates local action-plan and authority-grant material only. It does not execute actions. It does not call GitHub/OpenAI/providers.",
    ...overrides,
  };
}

function markedGate(gate) {
  return ["summary text", gateBeginMarker, JSON.stringify(gate, null, 2), gateEndMarker].join("\n");
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

  return new Promise((resolve) => {
    const child = spawn(
      "npm",
      ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:actuation-preview"],
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
  const result = await runPreview({ env });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, expected);
  assertNoSecrets(result.stderr);
}

async function assertInvalidGateConsistency({ gate }) {
  await assertInvalid({
    env: {
      CODEX_ACTUATION_GATE_JSON: JSON.stringify(gate),
    },
    expected: /CODEX_ACTUATION_PREVIEW_INVALID_GATE/,
  });
}

async function assertInvalidGrantRequiredGatePassed(action) {
  await assertInvalidGateConsistency({
    gate: buildGate({
      intended_action: action,
      planned_decision: "allow",
      required_gate: null,
      authority_grant_required: false,
      authority_grant_present: false,
      authority_grant_valid: false,
      grant_id: null,
    }),
  });
}

function extractPreviewJson(output) {
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
