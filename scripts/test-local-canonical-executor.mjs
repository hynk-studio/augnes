#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CANONICAL_NODE_COMPATIBILITY,
  CANONICAL_NODE_VERSION,
  assertAuthorizedRepositoryIdentity,
  assertCommitExists,
  assertExactSha,
  evaluateNodePolicy,
} from "./local-canonical-environment.mjs";
import {
  CANONICAL_DARWIN_REPOSITORY_ROOT,
  CANONICAL_ORIGIN_URL,
  CANONICAL_REPOSITORY_ID,
} from "./canonical-repository-identity.mjs";
import {
  FULL_PHASE_IDS,
  OPERATING_POLICY_PHASE_IDS,
  QUICK_PHASE_IDS,
  RESOURCE_EXCLUSIVE_PHASE_IDS,
  buildPhasePlan,
  evaluateWorktreePolicy,
  generatedNextEntryPresent,
  isPostExecutionIdentityValid,
  managesGeneratedNextState,
  removeBoundedGeneratedNextState,
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
const ownerTargetedUnitPhaseIds = [
  "targeted-change-validator",
  "dependencies-root",
  "dependencies-nested",
  "unit",
];
const executorSource = readFileSync(
  path.join(repositoryRoot, "scripts", "run-local-canonical-verification.mjs"),
  "utf8",
);

const authorizedIdentity = assertAuthorizedRepositoryIdentity({
  resolvedRoot: CANONICAL_DARWIN_REPOSITORY_ROOT,
  originUrl: CANONICAL_ORIGIN_URL,
});
assert.deepEqual(authorizedIdentity, {
  role: "canonical",
  repository_id: CANONICAL_REPOSITORY_ID,
  root: CANONICAL_DARWIN_REPOSITORY_ROOT,
  origin: CANONICAL_ORIGIN_URL,
});
assert.throws(
  () =>
    assertAuthorizedRepositoryIdentity({
      resolvedRoot: "/Users/example/another-repository",
      originUrl: CANONICAL_ORIGIN_URL,
    }),
  (error) => error?.code === "unauthorized_repository_root",
);
assert.throws(
  () =>
    assertAuthorizedRepositoryIdentity({
      resolvedRoot: CANONICAL_DARWIN_REPOSITORY_ROOT,
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

const operatingPolicyPlan = resolveVerificationPlan({
  mode: "changed",
  baseSha,
  headSha,
  planner: () => ({
    event: "pull_request",
    plan: "operating-policy-only",
    reason: "exact_safe_agents_operating_policy_change",
    change_count: 1,
    changed_paths: ["AGENTS.md"],
    full_reasons: [],
    browser_phase_ids: [],
  }),
});
assert.equal(operatingPolicyPlan.selected_plan, "operating-policy-only");
const operatingPolicyPhases = buildPhasePlan({
  mode: "changed",
  selectedPlan: operatingPolicyPlan.selected_plan,
  baseSha,
  headSha,
});
assert.deepEqual(
  operatingPolicyPhases.map((phase) => phase.id),
  OPERATING_POLICY_PHASE_IDS,
);
assert.equal(
  operatingPolicyPhases.some((phase) =>
    phase.id.startsWith("dependencies-") ||
    phase.id.startsWith("e2e-") ||
    phase.id === "build" ||
    phase.id === "operability"
  ),
  false,
);
assert.match(
  operatingPolicyPhases[0].display,
  /--plan operating-policy-only$/u,
);

const ownerTargetedPlan = resolveVerificationPlan({
  mode: "changed",
  baseSha,
  headSha,
  planner: () => ({
    event: "pull_request",
    plan: "owner-targeted",
    reason: "all_changes_have_owner_complete_targeted_coverage",
    change_count: 1,
    changed_paths: ["scripts/test-codex-augnes-user-hook-migration.mjs"],
    full_reasons: [],
    owner_ids: ["codex-user-reuse-hook"],
    targeted_phase_ids: ownerTargetedUnitPhaseIds,
    browser_phase_ids: [],
  }),
});
assert.equal(ownerTargetedPlan.selected_plan, "owner-targeted");
assert.deepEqual(ownerTargetedPlan.planner_owner_ids, [
  "codex-user-reuse-hook",
]);
assert.deepEqual(
  ownerTargetedPlan.planner_targeted_phase_ids,
  ownerTargetedUnitPhaseIds,
);
const ownerTargetedPhases = buildPhasePlan({
  mode: "changed",
  selectedPlan: ownerTargetedPlan.selected_plan,
  baseSha,
  headSha,
  targetedPhaseIds: ownerTargetedPlan.planner_targeted_phase_ids,
});
assert.deepEqual(
  ownerTargetedPhases.map((phase) => phase.id),
  ownerTargetedUnitPhaseIds,
);
assert.match(ownerTargetedPhases[0].display, /--plan owner-targeted$/u);
assert.equal(ownerTargetedPhases[1].display, "npm ci --no-audit --no-fund");
assert.equal(ownerTargetedPhases[1].cwdScope, "root");
assert.equal(ownerTargetedPhases[2].display, "npm ci --no-audit --no-fund");
assert.equal(ownerTargetedPhases[2].cwdScope, "nested-app");
assert.equal(ownerTargetedPhases[3].display, "npm test");
assert.equal(ownerTargetedPhases[3].exclusive, true);
assert.throws(
  () =>
    buildPhasePlan({
      mode: "changed",
      selectedPlan: "owner-targeted",
      baseSha,
      headSha,
      targetedPhaseIds: ["targeted-change-validator", "unit"],
    }),
  (error) => error?.code === "invalid_owner_targeted_phase_inventory",
);
assert.throws(
  () =>
    buildPhasePlan({
      mode: "changed",
      selectedPlan: "owner-targeted",
      baseSha,
      headSha,
      targetedPhaseIds: [
        "targeted-change-validator",
        "dependencies-root",
        "dependencies-nested",
        "caller-selected-command",
      ],
    }),
  (error) => error?.code === "invalid_owner_targeted_phase_inventory",
);
const ownerTargetedBrowserPhases = buildPhasePlan({
  mode: "changed",
  selectedPlan: "owner-targeted",
  baseSha,
  headSha,
  targetedPhaseIds: [
    "targeted-change-validator",
    "dependencies-root",
    "dependencies-nested",
    "typecheck",
    "unit",
    "e2e-operator-multi-candidate",
  ],
});
assert.deepEqual(
  ownerTargetedBrowserPhases.map((phase) => phase.id),
  [
    "targeted-change-validator",
    "dependencies-root",
    "dependencies-nested",
    "typecheck",
    "unit",
    "e2e-operator-multi-candidate",
  ],
);
assert.equal(ownerTargetedBrowserPhases.at(-1).browser, true);
assert.equal(ownerTargetedBrowserPhases.at(-1).base_sha, baseSha);
assert.equal(ownerTargetedBrowserPhases.at(-1).head_sha, headSha);

assert.equal(managesGeneratedNextState("owner-targeted"), true);
assert.equal(managesGeneratedNextState("full-canonical"), true);
assert.equal(managesGeneratedNextState("documentation-only"), false);
assert.equal(managesGeneratedNextState("operating-policy-only"), false);
assert.equal(managesGeneratedNextState("quick-feedback"), false);

const generatedNextTestRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-local-canonical-next-"),
);
const generatedNextExternalRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-local-canonical-next-external-"),
);
const generatedNextCandidate = path.join(generatedNextTestRoot, ".next");
try {
  mkdirSync(generatedNextCandidate);
  writeFileSync(
    path.join(generatedNextCandidate, "stale-head-sentinel"),
    "foreign generated state",
  );
  assert.equal(generatedNextEntryPresent(generatedNextCandidate), true);
  assert.equal(
    removeBoundedGeneratedNextState({
      root: generatedNextTestRoot,
      candidate: generatedNextCandidate,
    }),
    true,
  );
  assert.equal(generatedNextEntryPresent(generatedNextCandidate), false);

  mkdirSync(generatedNextCandidate);
  writeFileSync(
    path.join(generatedNextCandidate, "exact-head-generated-sentinel"),
    "targeted generated state",
  );
  assert.equal(
    removeBoundedGeneratedNextState({
      root: generatedNextTestRoot,
      candidate: generatedNextCandidate,
    }),
    true,
  );
  assert.equal(generatedNextEntryPresent(generatedNextCandidate), false);

  writeFileSync(
    path.join(generatedNextExternalRoot, "unrelated-user-work"),
    "preserve",
  );
  symlinkSync(
    generatedNextExternalRoot,
    generatedNextCandidate,
    process.platform === "win32" ? "junction" : "dir",
  );
  assert.throws(
    () =>
      removeBoundedGeneratedNextState({
        root: generatedNextTestRoot,
        candidate: generatedNextCandidate,
      }),
    (error) => error?.code === "unsafe_generated_next_path",
  );
  assert.equal(
    readFileSync(
      path.join(generatedNextExternalRoot, "unrelated-user-work"),
      "utf8",
    ),
    "preserve",
  );
  rmSync(generatedNextCandidate, { force: true });
  assert.throws(
    () =>
      removeBoundedGeneratedNextState({
        root: generatedNextTestRoot,
        candidate: path.join(generatedNextTestRoot, "other-generated-state"),
      }),
    (error) => error?.code === "generated_next_path_out_of_bounds",
  );
} finally {
  rmSync(generatedNextTestRoot, { recursive: true, force: true });
  rmSync(generatedNextExternalRoot, { recursive: true, force: true });
}

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
  ...(process.platform === "win32" ? ["native-windows-identity"] : []),
  "typecheck",
  "build",
  "unit",
  "authority",
  "integration",
  "operability",
  "e2e-project-experience",
  "e2e-operator-review-control",
  "e2e-operator-native-host-execution",
  "e2e-operator-multi-candidate",
  "e2e-continuity",
  "e2e-golden",
]) {
  assert.equal(FULL_PHASE_IDS.includes(required), true, required);
}
if (process.platform === "win32") {
  assert(
    fullPlan.findIndex((phase) => phase.id === "native-windows-identity") <
      fullPlan.findIndex((phase) => phase.id === "unit"),
  );
  assert.equal(
    fullPlan.find((phase) => phase.id === "native-windows-identity")?.display,
    "npm run build:native:windows-identity",
  );
}
assert(
  fullPlan.findIndex((phase) => phase.id === "e2e-project-experience") <
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
  [
    "dependencies-root",
    "dependencies-nested",
    ...(process.platform === "win32" ? ["native-windows-identity"] : []),
    "typecheck",
    "build",
  ],
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
  "test:e2e:project-experience":
    "node scripts/run-canonical-test-suite.mjs e2e-project-experience",
  "test:e2e:operator-execution":
    "node scripts/run-canonical-test-suite.mjs e2e-operator-execution",
  "test:e2e:continuity":
    "node scripts/run-canonical-test-suite.mjs e2e-continuity",
  "test:e2e:golden":
    "node scripts/run-canonical-test-suite.mjs e2e-golden",
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

const maintenanceAcquireIndex = executorSource.indexOf(
  "operationId: `local-canonical-dependencies:${runId}`",
);
const generatedNextPreRemovalIndex = executorSource.indexOf(
  "nextState.removed_before_execution = removeBoundedGeneratedNextState()",
);
const phaseExecutionIndex = executorSource.indexOf(
  "const completed = await runPhasesSequentially",
);
const maintenanceReleaseIndex = executorSource.indexOf(
  "dependencyMaintenanceRelease = await releaseCompanionServiceMaintenance",
);
const generatedNextFinalRemovalIndex = executorSource.indexOf(
  "nextState.removed_after_execution =",
);
assert.ok(maintenanceAcquireIndex >= 0);
assert.ok(generatedNextPreRemovalIndex > maintenanceAcquireIndex);
assert.ok(phaseExecutionIndex > generatedNextPreRemovalIndex);
assert.ok(maintenanceReleaseIndex > phaseExecutionIndex);
assert.ok(generatedNextFinalRemovalIndex > maintenanceReleaseIndex);

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
      operating_policy_selection_static_and_maintenance_free: true,
      owner_targeted_selection_uses_fixed_owner_complete_phases: true,
      owner_targeted_dependencies_cleanly_prepared_before_consumers: true,
      owner_targeted_preexisting_and_generated_next_removed: true,
      generated_next_path_and_symlink_safety_fail_closed: true,
      owner_targeted_arbitrary_phase_selection_refused: true,
      owner_targeted_browser_phase_exact_head_bound: true,
      full_phase_inventory_complete: true,
      dependency_maintenance_precedes_generated_mutation_and_spans_all_phases:
        true,
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
  return gitValue(["rev-parse", "HEAD"]);
}

function gitValue(args) {
  const result = spawnSync("git", args, {
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
