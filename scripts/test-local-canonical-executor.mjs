#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUTHORIZED_ORIGIN_URL,
  AUTHORIZED_REPOSITORY_ROOT,
  CANONICAL_NODE_COMPATIBILITY,
  CANONICAL_NODE_VERSION,
  assertAuthorizedRepositoryIdentity,
  assertCommitExists,
  assertExactSha,
  evaluateNodePolicy,
} from "./local-canonical-environment.mjs";
import {
  FULL_PHASE_IDS,
  QUICK_PHASE_IDS,
  RESOURCE_EXCLUSIVE_PHASE_IDS,
  buildPhasePlan,
  evaluateWorktreePolicy,
  isPostExecutionIdentityValid,
  resolveVerificationPlan,
  runPhasesSequentially,
} from "./run-local-canonical-verification.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const packageJson = JSON.parse(
  readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
);
const tsconfig = JSON.parse(
  readFileSync(path.join(repositoryRoot, "tsconfig.json"), "utf8"),
);
const gitignore = readFileSync(
  path.join(repositoryRoot, ".gitignore"),
  "utf8",
);
const executorSource = readFileSync(
  path.join(repositoryRoot, "scripts", "run-local-canonical-verification.mjs"),
  "utf8",
);

assert.equal(repositoryRoot, AUTHORIZED_REPOSITORY_ROOT);
assert.doesNotThrow(() =>
  assertAuthorizedRepositoryIdentity({
    resolvedRoot: AUTHORIZED_REPOSITORY_ROOT,
    originUrl: AUTHORIZED_ORIGIN_URL,
  }),
);
assert.throws(
  () =>
    assertAuthorizedRepositoryIdentity({
      resolvedRoot: "/Users/example/another-repository",
      originUrl: AUTHORIZED_ORIGIN_URL,
    }),
  (error) => error?.code === "unauthorized_repository_root",
);
assert.throws(
  () =>
    assertAuthorizedRepositoryIdentity({
      resolvedRoot: AUTHORIZED_REPOSITORY_ROOT,
      originUrl: "https://github.com/example/another-repository.git",
    }),
  (error) => error?.code === "unauthorized_repository_origin",
);

for (const malformed of [
  "",
  "abc",
  "a".repeat(39),
  "a".repeat(41),
  "A".repeat(40),
  "g".repeat(40),
]) {
  assert.throws(() => assertExactSha(malformed, "base"));
}
const actualHead = gitHead();
assert.doesNotThrow(() => assertCommitExists(repositoryRoot, actualHead, "head"));
assert.throws(
  () => assertCommitExists(repositoryRoot, "0".repeat(40), "head"),
  (error) => error?.code === "missing_head_commit",
);

assert.deepEqual(
  evaluateWorktreePolicy({ mode: "quick", worktreeDirty: true }),
  {
    allowed: true,
    deciding: false,
    transferable: false,
    reason: "quick_dirty_feedback_only",
  },
);
assert.deepEqual(
  evaluateWorktreePolicy({ mode: "changed", worktreeDirty: true }),
  {
    allowed: false,
    deciding: false,
    transferable: false,
    reason: "deciding_mode_requires_clean_worktree",
  },
);
assert.equal(
  evaluateWorktreePolicy({ mode: "full", worktreeDirty: false }).deciding,
  true,
);
const cleanIdentity = {
  head_sha: "2".repeat(40),
  branch: "codex/local-canonical-harness",
  detached: false,
  worktree_dirty: false,
};
assert.equal(
  isPostExecutionIdentityValid({
    mode: "full",
    expectedHeadSha: cleanIdentity.head_sha,
    identityBefore: cleanIdentity,
    identityAfter: cleanIdentity,
  }),
  true,
);
assert.equal(
  isPostExecutionIdentityValid({
    mode: "full",
    expectedHeadSha: cleanIdentity.head_sha,
    identityBefore: cleanIdentity,
    identityAfter: { ...cleanIdentity, worktree_dirty: true },
  }),
  false,
);
assert.equal(
  isPostExecutionIdentityValid({
    mode: "changed",
    expectedHeadSha: cleanIdentity.head_sha,
    identityBefore: cleanIdentity,
    identityAfter: { ...cleanIdentity, head_sha: "3".repeat(40) },
  }),
  false,
);

const baseSha = "1".repeat(40);
const headSha = "2".repeat(40);
let plannerCall = null;
const documentationPlan = resolveVerificationPlan({
  mode: "changed",
  baseSha,
  headSha,
  planner: (input) => {
    plannerCall = input;
    return {
      event: "pull_request",
      plan: "documentation-only",
      reason: "all_changes_match_documentation_allowlist",
      change_count: 1,
      changed_paths: ["README.md"],
      full_reasons: [],
    };
  },
});
assert.equal(plannerCall.eventName, "pull_request");
assert.equal(plannerCall.baseSha, baseSha);
assert.equal(plannerCall.headSha, headSha);
assert.equal(plannerCall.cwd, repositoryRoot);
assert.equal(documentationPlan.selected_plan, "documentation-only");
assert.deepEqual(
  buildPhasePlan({
    mode: "changed",
    selectedPlan: documentationPlan.selected_plan,
    baseSha,
    headSha,
  }).map((phase) => phase.id),
  ["documentation-validator"],
);
assert.equal(
  buildPhasePlan({
    mode: "changed",
    selectedPlan: documentationPlan.selected_plan,
    baseSha,
    headSha,
  }).some((phase) => phase.id.startsWith("dependencies-")),
  false,
);

const failClosedPlan = resolveVerificationPlan({
  mode: "changed",
  baseSha,
  headSha,
  planner: () => {
    throw new Error("unsupported diff shape");
  },
});
assert.equal(failClosedPlan.planner_status, "failed_closed_to_full");
assert.equal(failClosedPlan.selected_plan, "full-canonical");
assert.throws(() =>
  resolveVerificationPlan({
    mode: "full",
    baseSha,
    headSha,
    planner: () => {
      throw new Error("planner unavailable");
    },
  }),
);
assert.throws(() =>
  resolveVerificationPlan({
    mode: "changed",
    baseSha,
    headSha: baseSha,
    planner: () => assert.fail("planner must not receive identical SHAs"),
  }),
);

const fullPlan = buildPhasePlan({
  mode: "full",
  selectedPlan: "full-canonical",
  baseSha,
  headSha,
});
assert.deepEqual(
  fullPlan.map((phase) => phase.id),
  FULL_PHASE_IDS,
);
for (const required of [
  "dependencies-root",
  "dependencies-nested",
  "typecheck",
  "build",
  "unit",
  "authority",
  "integration",
  "operability",
  "e2e-core",
  "e2e-continuity",
]) {
  assert.equal(FULL_PHASE_IDS.includes(required), true, required);
}
assert(
  fullPlan.findIndex((phase) => phase.id === "e2e-core") <
    fullPlan.findIndex((phase) => phase.id === "e2e-continuity"),
);
for (const phaseId of RESOURCE_EXCLUSIVE_PHASE_IDS) {
  assert.equal(
    fullPlan.find((phase) => phase.id === phaseId)?.exclusive,
    true,
    phaseId,
  );
}
assert.deepEqual(
  buildPhasePlan({
    mode: "quick",
    selectedPlan: "quick-feedback",
    baseSha,
    headSha,
  }).map((phase) => phase.id),
  QUICK_PHASE_IDS,
);

let active = 0;
let maximumActive = 0;
const observedOrder = [];
const simulated = fullPlan.map((phase) => ({ ...phase }));
const sequentialResults = await runPhasesSequentially({
  phases: simulated,
  execute: async (phase) => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    observedOrder.push(phase.id);
    await Promise.resolve();
    active -= 1;
    return { id: phase.id, status: "pass" };
  },
});
assert.equal(maximumActive, 1);
assert.deepEqual(observedOrder, FULL_PHASE_IDS);
assert.equal(sequentialResults.length, FULL_PHASE_IDS.length);

const stoppedAfterFailure = await runPhasesSequentially({
  phases: simulated,
  execute: async (phase) => ({
    id: phase.id,
    status: phase.id === "build" ? "failure" : "pass",
  }),
});
assert.deepEqual(
  stoppedAfterFailure.map((result) => result.id),
  ["dependencies-root", "dependencies-nested", "typecheck", "build"],
);

assert.equal(CANONICAL_NODE_VERSION, "24.18.0");
assert.equal(CANONICAL_NODE_COMPATIBILITY, "^22.0.0 || ^24.0.0");
assert.equal(evaluateNodePolicy(CANONICAL_NODE_VERSION).canonical_match, true);
assert.equal(evaluateNodePolicy("22.23.1").compatibility_match, true);
assert.equal(evaluateNodePolicy("25.9.0").canonical_match, false);
assert.equal(evaluateNodePolicy("25.9.0").compatibility_match, false);

const canonicalScripts = {
  typegen: "next typegen",
  typecheck: "npm run typegen && tsc --noEmit",
  test: "node scripts/run-canonical-test-suite.mjs unit",
  "test:authority": "node scripts/run-canonical-test-suite.mjs authority",
  "test:integration": "node scripts/run-canonical-test-suite.mjs integration",
  "test:operability": "node scripts/run-canonical-test-suite.mjs operability",
  "test:e2e:core": "node scripts/run-canonical-test-suite.mjs e2e-core",
  "test:e2e:continuity":
    "node scripts/run-canonical-test-suite.mjs e2e-continuity",
  "test:canonical-contract":
    "node scripts/test-local-canonical-verification-contract.mjs",
  "test:dependency-lock-compatibility":
    "node scripts/test-dependency-lock-compatibility.mjs",
  "verify:local:quick":
    "node scripts/run-local-canonical-verification.mjs quick",
  "verify:local:changed":
    "node scripts/run-local-canonical-verification.mjs changed",
  "verify:local:full":
    "node scripts/run-local-canonical-verification.mjs full",
  "verify:local:receipt":
    "node scripts/run-local-canonical-verification.mjs validate",
};
for (const [name, command] of Object.entries(canonicalScripts)) {
  assert.equal(packageJson.scripts[name], command, name);
}
assert.equal(
  spawnSync("git", ["ls-files", "--error-unmatch", "next-env.d.ts"], {
    cwd: repositoryRoot,
    stdio: "ignore",
  }).status,
  1,
);
assert.equal(
  spawnSync("git", ["check-ignore", "--quiet", "next-env.d.ts"], {
    cwd: repositoryRoot,
    stdio: "ignore",
  }).status,
  0,
);
assert.match(gitignore, /^\/next-env\.d\.ts$/mu);
for (const generatedTypeInclude of [
  "next-env.d.ts",
  ".next/types/**/*.ts",
  ".next/dev/types/**/*.ts",
]) {
  assert.equal(tsconfig.include.includes(generatedTypeInclude), true);
}
assert.doesNotMatch(
  executorSource,
  /next-env\.d\.ts/u,
  "the executor must not special-case or mask generated next-env state",
);

assert.deepEqual(listWorkflowFiles(), []);
for (const forbiddenPath of [
  ".gitlab-ci.yml",
  ".gitlab-ci.yaml",
  "Jenkinsfile",
  "azure-pipelines.yml",
  "azure-pipelines.yaml",
  ".circleci",
  ".buildkite",
  ".woodpecker.yml",
  ".woodpecker.yaml",
  ".drone.yml",
]) {
  assert.equal(existsSync(path.join(repositoryRoot, forbiddenPath)), false);
}

console.log(
  JSON.stringify(
    {
      test: "local-canonical-executor",
      status: "pass",
      authorized_root_only: true,
      authorized_origin_only: true,
      exact_sha_and_missing_commit_fail_closed: true,
      quick_dirty_non_deciding: true,
      deciding_dirty_refused: true,
      post_execution_tracked_mutation_refused: true,
      next_env_generated_and_ignored: true,
      typecheck_runs_next_typegen: true,
      documentation_selection_dependency_light: true,
      full_phase_inventory_complete: true,
      browser_lanes_sequential: true,
      maximum_outer_phase_concurrency: maximumActive,
      canonical_node_mismatch_explicit: true,
      hosted_ci_absent: true,
    },
    null,
    2,
  ),
);

function gitHead() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0);
  return result.stdout.trim();
}

function listWorkflowFiles() {
  const workflowRoot = path.join(repositoryRoot, ".github", "workflows");
  if (!existsSync(workflowRoot)) return [];
  return readdirSync(workflowRoot).filter((name) => /\.ya?ml$/iu.test(name));
}
