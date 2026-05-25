import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const beginMarker = "BEGIN_AUGNES_CODEX_AUTHORITY_GRANT_JSON";
const endMarker = "END_AUGNES_CODEX_AUTHORITY_GRANT_JSON";
const fakeGithubToken = "fake-gh-token-authority-grant";
const fakeOpenAiKey = "fake-openai-key-authority-grant";
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

const both = await runGrant({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_ACTIONS: "create_pr_comment",
    CODEX_AUTHORITY_GRANT_OUTPUT: "both",
  }),
});
assert.equal(both.status, 0, both.stderr);
assert.match(both.stdout, /Codex authority grant/);
assert.match(both.stdout, new RegExp(`${beginMarker}\\n`));
assert.match(both.stdout, new RegExp(`\\n${endMarker}\\n?$`));
const bothJson = extractGrantJson(both.stdout);
assertCanonicalGrantShape(bothJson);
assert.equal(bothJson.helper, "codex:authority-grant");
assert.equal(bothJson.dry_run_only, true);
assert.ok(bothJson.constraints.includes("dry_run_only"));
assert.match(bothJson.authority_boundary, /does not execute/);
assertNoSecrets(both.stdout + both.stderr);
successfulOutputs.push(both.stdout);

const jsonOnly = await runGrant({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_OUTPUT: "json",
  }),
});
assert.equal(jsonOnly.status, 0, jsonOnly.stderr);
const jsonOnlyParsed = JSON.parse(jsonOnly.stdout);
assertCanonicalGrantShape(jsonOnlyParsed);
assert.doesNotMatch(jsonOnly.stdout, /Codex authority grant/);
assert.doesNotMatch(jsonOnly.stdout, new RegExp(beginMarker));
successfulOutputs.push(jsonOnly.stdout);

const summaryOnly = await runGrant({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_OUTPUT: "summary",
  }),
});
assert.equal(summaryOnly.status, 0, summaryOnly.stderr);
assert.match(summaryOnly.stdout, /Codex authority grant/);
assert.doesNotMatch(summaryOnly.stdout, new RegExp(beginMarker));
assert.doesNotMatch(summaryOnly.stdout, /"helper":/);
successfulOutputs.push(summaryOnly.stdout);

const deterministicOne = await grantJson();
const deterministicTwo = await grantJson();
assert.equal(deterministicOne.grant_id, deterministicTwo.grant_id);
const differentAction = await grantJson({ CODEX_AUTHORITY_GRANT_ACTIONS: "request_human_review" });
assert.notEqual(deterministicOne.grant_id, differentAction.grant_id);
const differentScope = await grantJson({ CODEX_AUTHORITY_GRANT_SCOPE: "project:custom scope/212-different" });
assert.notEqual(deterministicOne.grant_id, differentScope.grant_id);

const explicitId = await grantJson({
  CODEX_AUTHORITY_GRANT_ID: " grant-fixture-explicit ",
});
assert.equal(explicitId.grant_id, "grant-fixture-explicit");

const codexScopeFallback = await grantJson({
  CODEX_AUTHORITY_GRANT_SCOPE: undefined,
  CODEX_SCOPE: "project:codex-scope-fallback",
});
assert.equal(codexScopeFallback.scope, "project:codex-scope-fallback");

const augnesScopeFallback = await grantJson({
  CODEX_AUTHORITY_GRANT_SCOPE: undefined,
  CODEX_SCOPE: undefined,
  AUGNES_SCOPE: "project:augnes-scope-fallback",
});
assert.equal(augnesScopeFallback.scope, "project:augnes-scope-fallback");

await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_SCOPE: undefined,
    CODEX_SCOPE: undefined,
    AUGNES_SCOPE: undefined,
  }),
  expected: /CODEX_AUTHORITY_GRANT_MISSING_SCOPE/,
});

const constrained = await grantJson({
  CODEX_AUTHORITY_GRANT_CONSTRAINTS:
    '["human_operator_in_loop","dry_run_only","human_operator_in_loop"," operator_logged "]',
});
assert.deepEqual(constrained.constraints, ["dry_run_only", "human_operator_in_loop", "operator_logged"]);

const forbidden = await grantJson({
  CODEX_AUTHORITY_GRANT_FORBIDDEN_ACTIONS: "merge_pr",
});
assert.deepEqual(forbidden.forbidden_actions, ["merge_pr"]);

await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_FORBIDDEN_ACTIONS: "merge_pr, merge_pr",
  }),
  expected: /CODEX_AUTHORITY_GRANT_DUPLICATE_ACTION/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_ACTIONS: "create_pr_comment",
    CODEX_AUTHORITY_GRANT_FORBIDDEN_ACTIONS: "create_pr_comment",
  }),
  expected: /CODEX_AUTHORITY_GRANT_CONFLICTING_ACTION/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_ACTIONS: undefined,
  }),
  expected: /CODEX_AUTHORITY_GRANT_MISSING_ACTIONS/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_GRANTED_BY: undefined,
  }),
  expected: /CODEX_AUTHORITY_GRANT_MISSING_GRANTED_BY/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_GRANTED_TO: undefined,
  }),
  expected: /CODEX_AUTHORITY_GRANT_MISSING_GRANTED_TO/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_ACTIONS: '["create_pr_comment"',
  }),
  expected: /CODEX_AUTHORITY_GRANT_INVALID_LIST_ENV CODEX_AUTHORITY_GRANT_ACTIONS/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_ACTIONS: '["create_pr_comment",7]',
  }),
  expected: /CODEX_AUTHORITY_GRANT_INVALID_LIST_ENV CODEX_AUTHORITY_GRANT_ACTIONS/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_ACTIONS: "invent_new_action",
  }),
  expected: /CODEX_AUTHORITY_GRANT_UNSUPPORTED_ACTION/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_ACTIONS: "create_pr_comment, create_pr_comment",
  }),
  expected: /CODEX_AUTHORITY_GRANT_DUPLICATE_ACTION/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_OUTPUT: "xml",
  }),
  expected: /CODEX_AUTHORITY_GRANT_INVALID_OUTPUT/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_DRY_RUN_ONLY: "maybe",
  }),
  expected: /CODEX_AUTHORITY_GRANT_INVALID_BOOLEAN CODEX_AUTHORITY_GRANT_DRY_RUN_ONLY/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_DRY_RUN_ONLY: "false",
  }),
  expected: /CODEX_AUTHORITY_GRANT_NON_DRY_RUN_UNSUPPORTED/,
});
await assertInvalid({
  env: grantEnv({
    CODEX_AUTHORITY_GRANT_ID: "   ",
  }),
  expected: /CODEX_AUTHORITY_GRANT_INVALID_GRANT_ID/,
});

const gateGrant = await grantJson({
  CODEX_AUTHORITY_GRANT_ACTIONS: "create_pr_comment",
});
const gate = await runGate({
  env: {
    CODEX_ACTION_PLAN_JSON: JSON.stringify(buildActionPlan(gateGrant)),
    CODEX_INTENDED_ACTION: "create_pr_comment",
    CODEX_AUTHORITY_GRANT_JSON: JSON.stringify(gateGrant),
    CODEX_ACTUATION_GATE_OUTPUT: "json",
  },
});
assert.equal(gate.status, 0, gate.stderr);
const gateJson = JSON.parse(gate.stdout);
assert.equal(gateJson.helper, "codex:actuation-gate");
assert.equal(gateJson.gate_status, "gate_passed");
assert.equal(gateJson.reason, "authority_grant_valid");
assert.equal(gateJson.grant_id, gateGrant.grant_id);
assertNoSecrets(gate.stdout + gate.stderr);
successfulOutputs.push(gate.stdout);

for (const output of successfulOutputs) {
  assertNoSecrets(output);
  assertNoForbiddenPhrases(output);
}

console.log(
  JSON.stringify(
    {
      smoke: "codex-authority-grant",
      both_mode_checked: true,
      json_only_checked: true,
      summary_only_checked: true,
      deterministic_grant_id_checked: true,
      explicit_grant_id_checked: true,
      scope_fallback_checked: true,
      missing_scope_checked: true,
      constraints_checked: true,
      forbidden_actions_checked: true,
      invalid_cases_checked: true,
      actuation_gate_compatibility_checked: true,
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

async function grantJson(overrides = {}) {
  const result = await runGrant({
    env: grantEnv({
      CODEX_AUTHORITY_GRANT_OUTPUT: "json",
      ...overrides,
    }),
  });
  assert.equal(result.status, 0, result.stderr);
  assertNoSecrets(result.stdout + result.stderr);
  successfulOutputs.push(result.stdout);
  const parsed = JSON.parse(result.stdout);
  assertCanonicalGrantShape(parsed);
  return parsed;
}

function grantEnv(overrides = {}) {
  const env = {
    CODEX_AUTHORITY_GRANT_ACTIONS: "create_pr_comment",
    CODEX_AUTHORITY_GRANT_GRANTED_BY: "human-operator-fixture",
    CODEX_AUTHORITY_GRANT_GRANTED_TO: "codex-fixture",
    CODEX_AUTHORITY_GRANT_SCOPE: "project:custom scope/212",
    CODEX_WORK_ID: "AG-212 authority/grant",
    CODEX_RELATED_PR: "https://github.com/Aurna-code/augnes/pull/212",
    ...overrides,
  };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key];
  }

  return env;
}

function runGrant({ env = {} } = {}) {
  return runAppScript("codex:authority-grant", env);
}

function runGate({ env = {} } = {}) {
  return runAppScript("codex:actuation-gate", env);
}

function runAppScript(scriptName, env = {}) {
  const childEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    npm_config_cache: process.env.npm_config_cache ?? path.join(tmpdir(), "augnes-npm-cache"),
    GITHUB_TOKEN: fakeGithubToken,
    OPENAI_API_KEY: fakeOpenAiKey,
    ...env,
  };

  return new Promise((resolve) => {
    const child = spawn("npm", ["--prefix", "apps/augnes_apps", "run", "--silent", scriptName], {
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
    child.stdin.end("");
  });
}

async function assertInvalid({ env, expected }) {
  const result = await runGrant({ env });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, expected);
  assertNoSecrets(result.stderr);
}

function extractGrantJson(output) {
  const begin = output.indexOf(beginMarker);
  const end = output.indexOf(endMarker);
  assert.notEqual(begin, -1);
  assert.notEqual(end, -1);
  assert.ok(end > begin);
  return JSON.parse(output.slice(begin + beginMarker.length, end).trim());
}

function assertCanonicalGrantShape(grant) {
  assert.deepEqual(Object.keys(grant), [
    "helper",
    "version",
    "grant_id",
    "granted_by",
    "granted_to",
    "scope",
    "work_id",
    "related_pr",
    "actions",
    "expires_at",
    "constraints",
    "forbidden_actions",
    "dry_run_only",
    "authority_boundary",
  ]);
}

function buildActionPlan(grant) {
  return {
    helper: "codex:closeout-action-plan",
    version: 1,
    operation_mode: "delegated",
    delegated_consumption: true,
    pipeline_status: "pass",
    plan_status: "pass",
    scope: grant.scope,
    work_id: grant.work_id,
    related_pr: grant.related_pr,
    requested_actions: ["create_pr_comment"],
    action_decisions: [
      {
        action: "create_pr_comment",
        decision: "needs_review",
        reason: "fixture_separate_authority_required",
        required_gate: "separate_authority_gate",
      },
    ],
    authority_boundary:
      "This local action plan does not execute actions and requires a separate gate before any actuation.",
  };
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
