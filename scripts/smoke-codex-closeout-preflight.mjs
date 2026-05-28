import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const helperPath = path.join(__dirname, "codex-closeout-preflight.mjs");

const baselineEnv = {
  CODEX_SCOPE: "project:augnes",
  CODEX_WORK_ID: "AG-260",
  CODEX_RESULT_STATUS: "completed",
  CODEX_RESULT_KIND: "tooling",
  CODEX_RESULT_SUMMARY: "Added a local deterministic closeout preflight helper.",
  CODEX_FILES_CHANGED: JSON.stringify([
    "scripts/codex-closeout-preflight.mjs",
    "scripts/smoke-codex-closeout-preflight.mjs",
    "docs/CODEX_CLOSEOUT_PREFLIGHT_V0_1.md",
    "package.json",
  ]),
  CODEX_RELATED_PR: "https://github.com/Aurna-code/augnes/pull/261",
  CODEX_RELATED_STATE_KEYS: JSON.stringify(["coordination.codex_harness"]),
  CODEX_SKIPPED_CHECKS_JSON: JSON.stringify([
    {
      check: "proof-only closeout",
      reason: "local Augnes runtime unavailable in this smoke test",
    },
  ]),
  CODEX_AUTHORITY_BOUNDARY_STATEMENT:
    "This helper is local and non-mutating. It does not approve, publish, merge, auto-merge, commit/reject Augnes state, call GitHub, call OpenAI, call Augnes runtime, record evidence, or record proof.",
};

const complete = runHelper({ env: baselineEnv });
assert.equal(complete.status, 0, complete.stderr);
assert.equal(complete.json.ok, true);
assertCheck(complete.json, "work_id", "pass");
assertCheck(complete.json, "legacy_completion", "pass");
assertCheck(complete.json, "merge_authority", "pass");

for (const safeBoundary of [
  "Codex must never merge PRs, enable auto-merge, or claim merge authority.",
  "Codex does not merge PRs and does not own merge authority.",
  "Merge remains a user/GitHub review decision, not Codex authority.",
  "This PR does not grant Codex merge authority.",
]) {
  const safeDefault = runHelper({
    env: { ...baselineEnv, CODEX_AUTHORITY_BOUNDARY_STATEMENT: safeBoundary },
  });
  assert.equal(safeDefault.status, 0, safeDefault.stderr);
  assertCheck(safeDefault.json, "merge_authority", "pass");

  const safeStrict = runHelper({
    args: ["--strict"],
    env: { ...baselineEnv, CODEX_AUTHORITY_BOUNDARY_STATEMENT: safeBoundary },
  });
  assert.equal(safeStrict.status, 0, safeStrict.stderr);
  assertCheck(safeStrict.json, "merge_authority", "pass");
}

const missingWorkIdDefault = runHelper({ env: { ...baselineEnv, CODEX_WORK_ID: "" } });
assert.equal(missingWorkIdDefault.status, 0, missingWorkIdDefault.stderr);
assert.equal(missingWorkIdDefault.json.ok, true);
assertCheck(missingWorkIdDefault.json, "work_id", "warn");

const missingWorkIdStrict = runHelper({
  args: ["--strict"],
  env: { ...baselineEnv, CODEX_WORK_ID: "" },
});
assert.notEqual(missingWorkIdStrict.status, 0);
assert.equal(missingWorkIdStrict.json.ok, false);
assertCheck(missingWorkIdStrict.json, "work_id", "fail");

const skippedGenericDefault = runHelper({
  env: {
    ...baselineEnv,
    CODEX_SKIPPED_CHECKS_JSON: JSON.stringify([{ check: "browser verification", reason: "N/A" }]),
  },
});
assert.equal(skippedGenericDefault.status, 0, skippedGenericDefault.stderr);
assertCheck(skippedGenericDefault.json, "skipped_checks", "warn");

const skippedGenericStrict = runHelper({
  args: ["--strict"],
  env: {
    ...baselineEnv,
    CODEX_SKIPPED_CHECKS_JSON: JSON.stringify([{ check: "browser verification", reason: "skipped" }]),
  },
});
assert.notEqual(skippedGenericStrict.status, 0);
assertCheck(skippedGenericStrict.json, "skipped_checks", "fail");

const docsOnlyRuntimeFiles = runHelper({
  env: {
    ...baselineEnv,
    CODEX_DOCS_ONLY: "true",
    CODEX_FILES_CHANGED: JSON.stringify([
      "docs/example.md",
      "apps/augnes_apps/src/server.ts",
      "package.json",
    ]),
  },
});
assert.equal(docsOnlyRuntimeFiles.status, 0, docsOnlyRuntimeFiles.stderr);
assertCheck(docsOnlyRuntimeFiles.json, "docs_only_scope", "warn");
assert.match(findCheck(docsOnlyRuntimeFiles.json, "docs_only_scope").message, /apps\/augnes_apps\/src\/server\.ts/);
assert.match(findCheck(docsOnlyRuntimeFiles.json, "docs_only_scope").message, /package\.json/);

const docsOnlyForbiddenFiles = [
  "package.json",
  "apps/augnes_apps/src/server.ts",
  "scripts/example.mjs",
  "lib/example.ts",
  "src/example.ts",
  "app/api/example/route.ts",
  "plugins/augnes-operator/.codex-plugin/plugin.json",
  "plugins/augnes-operator/hooks/hooks.json",
  "hooks/pre_tool_use.mjs",
  ".codex/config.toml",
  ".agents/plugins/marketplace.json",
];
const docsOnlyHighRiskPaths = runHelper({
  env: {
    ...baselineEnv,
    CODEX_DOCS_ONLY: "true",
    CODEX_FILES_CHANGED: JSON.stringify(docsOnlyForbiddenFiles),
  },
});
assert.equal(docsOnlyHighRiskPaths.status, 0, docsOnlyHighRiskPaths.stderr);
assertCheck(docsOnlyHighRiskPaths.json, "docs_only_scope", "warn");
for (const forbiddenFile of docsOnlyForbiddenFiles) {
  assert.match(
    findCheck(docsOnlyHighRiskPaths.json, "docs_only_scope").message,
    new RegExp(escapeRegExp(forbiddenFile)),
  );
}

const docsOnlyAllowedFiles = runHelper({
  env: {
    ...baselineEnv,
    CODEX_DOCS_ONLY: "true",
    CODEX_FILES_CHANGED: JSON.stringify([
      "AGENTS.md",
      "docs/example.md",
      ".agents/skills/augnes-read-brief/SKILL.md",
    ]),
  },
});
assert.equal(docsOnlyAllowedFiles.status, 0, docsOnlyAllowedFiles.stderr);
assertCheck(docsOnlyAllowedFiles.json, "docs_only_scope", "pass");

const legacyCompletionMention = runHelper({
  env: {
    ...baselineEnv,
    CODEX_RESULT_SUMMARY: "Used npm run codex:record-completion for compatibility.",
  },
});
assert.equal(legacyCompletionMention.status, 0, legacyCompletionMention.stderr);
assertCheck(legacyCompletionMention.json, "legacy_completion", "warn");

const mergeAuthorityStrict = runHelper({
  args: ["--strict"],
  env: {
    ...baselineEnv,
    CODEX_RESULT_SUMMARY: "Codex merged the PR, enabled auto-merge, and claimed merge authority.",
  },
});
assert.notEqual(mergeAuthorityStrict.status, 0);
assertCheck(mergeAuthorityStrict.json, "merge_authority", "fail");

const malformedSkippedChecks = runHelper({
  env: { ...baselineEnv, CODEX_SKIPPED_CHECKS_JSON: "{not json" },
});
assert.notEqual(malformedSkippedChecks.status, 0);
assert.equal(malformedSkippedChecks.json.ok, false);
assertCheck(malformedSkippedChecks.json, "input.skipped_checks_json", "fail");

console.log(
  JSON.stringify(
    {
      smoke: "codex-closeout-preflight",
      cases: [
        "complete closeout packet passes",
        "safe merge-boundary statements pass in default and strict mode",
        "missing CODEX_WORK_ID warns by default",
        "missing CODEX_WORK_ID fails in strict",
        "skipped check generic reason warns and fails in strict",
        "docs-only mode flags forbidden files",
        "docs-only mode flags top-level plugins, hooks, and .codex paths",
        "docs-only mode allows AGENTS.md, docs/*.md, and .agents/skills/*/SKILL.md",
        "legacy completion mention warns",
        "merge authority claim fails in strict",
        "malformed CODEX_SKIPPED_CHECKS_JSON fails",
      ],
    },
    null,
    2,
  ),
);

function runHelper({ args = [], env = {} }) {
  const childEnv = { ...process.env };
  for (const key of Object.keys(baselineEnv)) {
    delete childEnv[key];
  }
  delete childEnv.CODEX_DOCS_ONLY;

  const result = spawnSync(process.execPath, [helperPath, ...args], {
    env: { ...childEnv, ...env },
    encoding: "utf8",
  });

  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Helper did not print JSON.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}\n${error}`);
  }

  return { ...result, json };
}

function assertCheck(output, id, status) {
  assert.equal(findCheck(output, id).status, status, `${id} should be ${status}`);
}

function findCheck(output, id) {
  const check = output.checks.find((entry) => entry.id === id);
  assert.ok(check, `missing check ${id}`);
  return check;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
