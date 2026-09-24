#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  utimesSync,
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
  assertDecidingEnvironment,
  assertExactSha,
  ensureBoundedLocalDirectory,
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
  admitAndResolveVerificationPlan,
  enforceArtifactRetention,
  evaluateWorktreePolicy,
  generatedNextEntryPresent,
  isPostExecutionIdentityValid,
  managesGeneratedNextState,
  removeBoundedGeneratedNextState,
  resolveVerificationPlan,
  runPhasesSequentially,
} from "./run-local-canonical-verification.mjs";
import {
  acquireCheckoutVerificationOwnership,
  assertCheckoutVerificationOwnership,
  CHECKOUT_OWNER_FILE,
  releaseCheckoutVerificationOwnership,
  requiresCheckoutVerificationOwnership,
} from "./local-canonical-checkout-ownership.mjs";
import { admitIntegrationBase } from "./local-canonical-integration-base.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { finalizeReceipt, verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";

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
// Real, disposable commit ancestry; the remote owner is deterministic and
// injected only here. No network or tracking-ref refresh occurs in this test.
const admissionRoot = mkdtempSync(path.join(tmpdir(), "augnes-base-admission-"));
try {
  const git = (args, input) => {
    const result = spawnSync("git", args, { cwd: admissionRoot, input, encoding: "utf8", timeout: 5_000 });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git(["init", "--quiet"]);
  const tree = git(["mktree"], "");
  const commit = (name, parent) => git([
    "-c", "user.name=CanonicalFixture", "-c", "user.email=canonical@example.invalid",
    "-c", "commit.gpgsign=false", "commit-tree", tree, "-m", name,
    ...(parent ? ["-p", parent] : []),
  ]);
  const oldBase = commit("old-base");
  const currentBase = commit("current-base", oldBase);
  const proposedHead = commit("proposed-head", currentBase);
  const divergentHead = commit("divergent-head", oldBase);
  // Deliberately stale tracking ref must never substitute for the remote read.
  git(["update-ref", "refs/remotes/origin/main", oldBase]);
  const currentTransport = { fetchBranchHead: async (branch) => {
    assert.equal(branch, "main");
    return { repository_id: CANONICAL_REPOSITORY_ID, branch, sha: currentBase };
  } };
  let decidingPlannerCalls = 0;
  const planner = () => { decidingPlannerCalls++; return {
    event: "pull_request", plan: "full-canonical", reason: "synthetic_integrity_change",
  }; };
  for (const mode of ["changed", "full"]) {
    const admitted = await admitAndResolveVerificationPlan({ mode, root: admissionRoot,
      baseSha: currentBase, headSha: proposedHead, transport: currentTransport, planner });
    assert.equal(admitted.integrationBase.status, "admitted");
    assert.equal(admitted.integrationBase.observation.sha, currentBase);
    assert.equal(admitted.integrationBase.base_is_ancestor_of_head, true);
    assert.equal(admitted.plan.selected_plan, "full-canonical");
    for (const [base, head, transport, reason] of [
      [oldBase, proposedHead, currentTransport, "integration_base_mismatch"],
      [proposedHead, proposedHead, currentTransport, "integration_base_mismatch"],
      [currentBase, divergentHead, currentTransport, "integration_base_not_ancestor"],
      [currentBase, proposedHead, { fetchBranchHead: async () => { throw new Error("offline"); } }, "integration_base_observation_unavailable"],
      [currentBase, proposedHead, { fetchBranchHead: async () => ({ repository_id: "other/repository", branch: "main", sha: currentBase }) }, "integration_base_observation_unavailable"],
    ]) {
      const callsBefore = decidingPlannerCalls;
      const result = await admitAndResolveVerificationPlan({ mode, root: admissionRoot,
        baseSha: base, headSha: head, transport, planner });
      assert.equal(result.integrationBase.status, "refused");
      assert.equal(result.integrationBase.reason_code, reason);
      assert.equal(result.plan.planner_status, "not_run");
      assert.equal(result.plan.selected_plan, "not-admitted");
      assert.equal(decidingPlannerCalls, callsBefore, "refused bases never reach the planner or phases");
      if (reason === "integration_base_observation_unavailable") assert.equal(result.integrationBase.observation, null);
      const failed = finalizeReceipt({ integration_base: result.integrationBase });
      assert.equal(verifyReceiptIntegrity(failed), true);
      assert.equal(failed.integration_base.reason_code, reason);
    }
  }
  assert.equal(decidingPlannerCalls, 2);
  const unavailable = await admitIntegrationBase({ repositoryRoot: admissionRoot, baseSha: currentBase,
    headSha: "0".repeat(40), transport: currentTransport });
  assert.equal(unavailable.reason_code, "integration_base_ancestry_unavailable");
  const quick = await admitAndResolveVerificationPlan({ mode: "quick", baseSha: oldBase,
    headSha: proposedHead, root: admissionRoot,
    transport: { fetchBranchHead: () => assert.fail("Quick does not read remote main") }, planner });
  assert.equal(quick.integrationBase, null);
  assert.equal(quick.plan.selected_plan, "quick-feedback");
} finally { rmSync(admissionRoot, { recursive: true, force: true }); }

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

assert.deepEqual(operatingPolicyPhases.at(-1).args,
  ["scripts/test-local-canonical-verification-contract.mjs", "--head", headSha]);
const decisionExpression = executorSource.slice(executorSource.indexOf("  const deciding ="), executorSource.indexOf("  const finishedMs ="));
assert.ok(decisionExpression.includes("plan.selected_plan"));
const evaluateDecision = new Function("plan", "mode", "passing", "nodePolicy", "identityBefore", "identityAfter", `${decisionExpression} return deciding;`);
for (const [selected_plan, expected] of [["documentation-only", false], ["operating-policy-only", true], ["owner-targeted", true], ["full-canonical", true]]) {
  assert.equal(evaluateDecision({ selected_plan }, "changed", true, {canonical_match: true}, {worktree_dirty: false}, {worktree_dirty: false}), expected);
}

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

const generatedNextTestRoot = realpathSync(mkdtempSync(
  path.join(tmpdir(), "augnes-local-canonical-next-"),
));
const generatedNextExternalRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-local-canonical-next-external-"),
);
const generatedNextCandidate = path.join(generatedNextTestRoot, ".next");
const generatedNextOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: generatedNextTestRoot });
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
      checkoutOwner: generatedNextOwner,
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
      checkoutOwner: generatedNextOwner,
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
        checkoutOwner: generatedNextOwner,
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
        checkoutOwner: generatedNextOwner,
        candidate: path.join(generatedNextTestRoot, "other-generated-state"),
      }),
    (error) => error?.code === "generated_next_path_out_of_bounds",
  );
} finally {
  releaseCheckoutVerificationOwnership(generatedNextOwner, generatedNextTestRoot);
  rmSync(generatedNextTestRoot, { recursive: true, force: true });
  rmSync(generatedNextExternalRoot, { recursive: true, force: true });
}

for (const plan of ["quick-feedback", "owner-targeted", "full-canonical"]) {
  assert.equal(requiresCheckoutVerificationOwnership(plan), true);
}
for (const plan of ["documentation-only", "operating-policy-only", "not-admitted"]) {
  assert.equal(requiresCheckoutVerificationOwnership(plan), false);
}
const exclusionRoot = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-checkout-exclusion-")));
const exclusionFile = path.join(exclusionRoot, ".augnes-local-verification", CHECKOUT_OWNER_FILE);
try {
  let owner = acquireCheckoutVerificationOwnership({ repositoryRoot: exclusionRoot });
  const metadata = structuredClone(owner.metadata);
  const concurrent = await runCanonicalChild({
    suite: "checkout-owner-regression", label: "second checkout owner",
    command: process.execPath,
    args: ["--input-type=module", "-e", `
      import { acquireCheckoutVerificationOwnership } from ${JSON.stringify(new URL("./local-canonical-checkout-ownership.mjs", import.meta.url).href)};
      try {
        acquireCheckoutVerificationOwnership({ repositoryRoot: ${JSON.stringify(exclusionRoot)} });
        process.exitCode = 2;
      } catch (error) {
        if (error.code !== "checkout_owner_busy") process.exitCode = 3;
      }
    `],
    cwd: exclusionRoot, timeoutMs: 10_000, heartbeatMs: 0, log() {},
  });
  assert.equal(concurrent.exit_code, 0);
  assert.equal(concurrent.cleanup_completed, true);
  assert.equal(concurrent.remaining_owned_processes, 0);
  mkdirSync(path.join(exclusionRoot, ".next"));
  writeFileSync(path.join(exclusionRoot, ".next", "owned-build"), "preserve");
  assert.throws(() => removeBoundedGeneratedNextState({ root: exclusionRoot }), hasCode("checkout_owner_not_owned"));
  assert.throws(() => releaseCheckoutVerificationOwnership({ metadata }, exclusionRoot), hasCode("checkout_owner_not_owned"));
  assert.equal(readFileSync(path.join(exclusionRoot, ".next", "owned-build"), "utf8"), "preserve");
  const firstOwner = owner;
  assert.equal(releaseCheckoutVerificationOwnership(owner, exclusionRoot).released, true);
  assert.equal(existsSync(exclusionFile), false);
  owner = acquireCheckoutVerificationOwnership({ repositoryRoot: exclusionRoot });
  assert.throws(() => releaseCheckoutVerificationOwnership(firstOwner, exclusionRoot), hasCode("checkout_owner_not_owned"));
  assert.equal(assertCheckoutVerificationOwnership(owner, exclusionRoot), true);

  // Simulate an externally replaced artifact. The open inode and in-memory
  // capability keep finally cleanup from releasing the successor's ownership.
  renameSync(exclusionFile, `${exclusionFile}.displaced`);
  const successor = acquireCheckoutVerificationOwnership({ repositoryRoot: exclusionRoot });
  assert.throws(() => removeBoundedGeneratedNextState({ root: exclusionRoot, checkoutOwner: owner }), hasCode("checkout_owner_identity_changed"));
  assert.throws(() => releaseCheckoutVerificationOwnership(owner, exclusionRoot), hasCode("checkout_owner_identity_changed"));
  assert.equal(assertCheckoutVerificationOwnership(successor, exclusionRoot), true);
  assert.equal(readFileSync(path.join(exclusionRoot, ".next", "owned-build"), "utf8"), "preserve");
  releaseCheckoutVerificationOwnership(successor, exclusionRoot);
  rmSync(`${exclusionFile}.displaced`);

  for (const [value, expected] of [
    [{ ...metadata, owner_process_identity: "0".repeat(64) }, "checkout_owner_stale_refused"],
    [{ ...metadata, checkout_fingerprint: "0".repeat(64) }, "checkout_owner_ambiguous"],
    [{ ...metadata, owner_pid: -1 }, "checkout_owner_ambiguous"],
    ["", "checkout_owner_ambiguous"],
    ["{".repeat(5000), "checkout_owner_ambiguous"],
  ]) {
    const content = typeof value === "string" ? value : JSON.stringify(value);
    writeFileSync(exclusionFile, content);
    assert.throws(() => acquireCheckoutVerificationOwnership({ repositoryRoot: exclusionRoot }), hasCode(expected));
    assert.equal(readFileSync(exclusionFile, "utf8"), content, "refusal retains the exact stale/ambiguous artifact");
    rmSync(exclusionFile);
  }
  const sentinel = path.join(exclusionRoot, "foreign-owner");
  writeFileSync(sentinel, "preserve foreign state");
  symlinkSync(sentinel, exclusionFile);
  assert.throws(() => acquireCheckoutVerificationOwnership({ repositoryRoot: exclusionRoot }), hasCode("checkout_owner_unsafe_path"));
  assert.equal(readFileSync(sentinel, "utf8"), "preserve foreign state");
  rmSync(exclusionFile);
  mkdirSync(exclusionFile);
  assert.throws(() => acquireCheckoutVerificationOwnership({ repositoryRoot: exclusionRoot }), hasCode("checkout_owner_unsafe_path"));
  rmSync(exclusionFile, { recursive: true });
  rmSync(path.dirname(exclusionFile), { recursive: true });
  const redirected = path.join(exclusionRoot, "redirected");
  mkdirSync(redirected);
  writeFileSync(path.join(redirected, CHECKOUT_OWNER_FILE), "preserve");
  symlinkSync(redirected, path.dirname(exclusionFile), process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => acquireCheckoutVerificationOwnership({ repositoryRoot: exclusionRoot }), hasCode("checkout_owner_unsafe_path"));
  assert.equal(readFileSync(path.join(redirected, CHECKOUT_OWNER_FILE), "utf8"), "preserve");
} finally { rmSync(exclusionRoot, { recursive: true, force: true }); }

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
  "e2e-operator-work-expectation",
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
  "nextState.removed_before_execution = removeBoundedGeneratedNextState({ checkoutOwner })",
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
assert.ok(generatedNextFinalRemovalIndex > phaseExecutionIndex);
assert.ok(maintenanceReleaseIndex > generatedNextFinalRemovalIndex);

// Exercise the actual executor acquisition/finally block with disposable
// generated state and mocked service/process owners. No live executor, service
// maintenance or phase command is started by this regression.
const ownedBlockStart = executorSource.indexOf("  const generatedNextManaged =");
const ownedBlockEnd = executorSource.indexOf("\n  const serviceLifecycleRestored =", ownedBlockStart);
assert.ok(ownedBlockStart > 0 && ownedBlockEnd > ownedBlockStart);
const ownedBlock = executorSource.slice(ownedBlockStart, ownedBlockEnd);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
for (const scenario of ["wrong_npm", "checkout_busy", "acquisition_failure", "owned_failure", "unsettled_failure", "success", "absent_success", "stopped_success", "quick_success", "pre_lock_state_race", "maintenance_state_race"]) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-canonical-ownership-")));
  let competingOwner = null;
  try {
    if (scenario === "checkout_busy") competingOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: root });
    const next = path.join(root, ".next"), windows = path.join(root, "windows-helper");
    const runLogRoot = path.join(root, ".augnes-local-verification", "logs", "synthetic");
    const createSharedState = () => {
      mkdirSync(next); writeFileSync(path.join(next, "live-build"), "pre-existing build");
      mkdirSync(windows); writeFileSync(path.join(windows, "live-helper"), "pre-existing helper");
    };
    const racingState = ["pre_lock_state_race", "maintenance_state_race"].includes(scenario);
    if (!racingState) createSharedState();
    const diagnosticBeforeLock = { next: existsSync(next), windows: existsSync(windows) };
    const calls = { acquire: 0, release: 0, phases: 0, remove: 0, checkoutAcquire: 0, checkoutRelease: 0, logPrepare: 0, prune: 0 };
    const quick = scenario === "quick_success";
    const noServiceMaintenance = ["absent_success", "stopped_success"].includes(scenario);
    let activeOwner = null;
    let maintenanceSettled = false;
    let serviceState = { status: scenario === "absent_success" ? "not_installed" : scenario === "stopped_success" ? "installed_stopped" : scenario === "pre_lock_state_race" ? "maintenance" : "live" };
    const assertObservationOwned = () => {
      assertCheckoutVerificationOwnership(activeOwner, root);
      assert(quick || maintenanceSettled, "authoritative generated-state reads follow maintenance admission");
    };
    const preflightIssues = [];
    if (scenario === "wrong_npm") {
      try {
        assertDecidingEnvironment({ host: { operating_system: "macOS", architecture: "arm64", node_version: "24.18.0", path_node_version: "24.18.0", npm_version: "11.12.1" }, nodePolicy: evaluateNodePolicy("24.18.0"), diskMinimumBytes: 0 });
      } catch (error) { preflightIssues.push(error.code); }
      assert.deepEqual(preflightIssues, ["canonical_npm_mismatch"]);
    }
    const context = {
      plan: { selected_plan: quick ? "quick-feedback" : "full-canonical" }, OWNER_TARGETED_PLAN: "owner-targeted",
      preflightIssues, phaseDefinitions: [{ id: "synthetic" }], phaseReceipts: [{ id: "synthetic", status: "not_run" }],
      repositoryRoot: root, runLogRoot, runId: "synthetic", mode: "changed", hostResult: {},
      process: { platform: "win32", arch: "x64" }, generatedWindowsHelperRoot: windows,
      dependencyMaintenance: null, dependencyMaintenanceRelease: null, serviceLifecycleBefore: null, serviceLifecycleAfter: null,
      console: { log() {}, error() {} }, RECEIPT_RETENTION: 20, LOG_RUN_RETENTION: 5,
      managesGeneratedNextState,
      generatedNextEntryPresent: () => { assertObservationOwned(); return existsSync(next); },
      existsSync: (candidate) => { if (candidate === windows) assertObservationOwned(); return existsSync(candidate); },
      requiresCheckoutVerificationOwnership, assertCheckoutVerificationOwnership,
      acquireCheckoutVerificationOwnership: (options) => {
        calls.checkoutAcquire++;
        if (scenario === "pre_lock_state_race") {
          // Owner A creates state after B's diagnostic snapshot, then releases.
          const priorOwner = acquireCheckoutVerificationOwnership(options);
          try { createSharedState(); serviceState = { status: "live" }; }
          finally { releaseCheckoutVerificationOwnership(priorOwner, root); }
        }
        activeOwner = acquireCheckoutVerificationOwnership(options);
        return activeOwner;
      },
      releaseCheckoutVerificationOwnership: (owner, repository, options) => { calls.checkoutRelease++; return releaseCheckoutVerificationOwnership(owner, repository, options); },
      removeBoundedGeneratedNextState: ({ checkoutOwner }) => { calls.remove++; return removeBoundedGeneratedNextState({ root, checkoutOwner }); },
      rmSync: (p, options) => { assert.equal(p, windows); calls.remove++; rmSync(p, options); },
      ensureBoundedLocalDirectory: (repository, candidate) => {
        assertCheckoutVerificationOwnership(activeOwner, root);
        calls.logPrepare++;
        return ensureBoundedLocalDirectory(repository, candidate);
      },
      enforceArtifactRetention: (options) => {
        calls.prune++;
        assert.equal(options.currentRunId, "synthetic");
        return enforceArtifactRetention({ ...options, root });
      },
      safeErrorCode: error => error.code ?? "synthetic_failure", boundedLifecycleState: value => value,
      inspectCompanionService: async () => structuredClone(serviceState),
      acquireCompanionServiceMaintenance: async () => {
        assertCheckoutVerificationOwnership(activeOwner, root);
        calls.acquire++;
        if (scenario === "acquisition_failure") throw Object.assign(new Error(), { code: "synthetic_acquisition_failure" });
        // Service-generated state may appear while maintenance is pausing it.
        if (scenario === "maintenance_state_race") createSharedState();
        maintenanceSettled = true;
        const before = structuredClone(serviceState);
        if (!noServiceMaintenance) serviceState = { status: "maintenance" };
        return { acquired: !noServiceMaintenance, before, lease: noServiceMaintenance ? null : { before } };
      },
      releaseCompanionServiceMaintenance: async ({ lease }) => {
        calls.release++;
        assert.equal(existsSync(next), false, "Next cleanup precedes service restoration");
        assert.equal(existsSync(windows), false, "helper cleanup precedes service restoration");
        if (lease) serviceState = lease.before;
        return { released: true };
      },
      runPhasesSequentially, executePhase: async () => {
        assert.throws(() => acquireCheckoutVerificationOwnership({ repositoryRoot: root }), hasCode("checkout_owner_busy"));
        assert.equal(existsSync(next), quick, "deciding execution starts without pre-existing Next state");
        assert.equal(existsSync(windows), quick, "deciding execution starts without pre-existing helper state");
        calls.phases++; mkdirSync(next, { recursive: true }); writeFileSync(path.join(next, "partial-build"), "owned");
        mkdirSync(windows, { recursive: true }); writeFileSync(path.join(windows, "partial-helper"), "owned");
        return { status: ["owned_failure", "unsettled_failure"].includes(scenario) ? "fail" : "pass",
          duration_ms: 1, failure_code: "synthetic",
          cleanup: { completed: scenario !== "unsettled_failure", remaining_owned_processes: scenario === "unsettled_failure" ? null : 0 } };
      },
    };
    const result = await new AsyncFunction(...Object.keys(context), ownedBlock + "\nreturn { nextState, windowsHelperState, sharedGeneratedStateOwned, cleanupComplete, executionFailure, checkoutOwnership, serviceLifecycleBefore, serviceLifecycleAfter, generatedWindowsHelperPresentAfter }; ")(...Object.values(context));
    if (["wrong_npm", "checkout_busy", "acquisition_failure"].includes(scenario)) {
      assert.equal(calls.phases, 0); assert.equal(calls.remove, 0); assert.equal(calls.release, 0);
      assert.equal(result.sharedGeneratedStateOwned, false);
      assert.equal(result.nextState.removed_after_execution, false);
      assert.equal(result.windowsHelperState.removed_after_execution, false);
      assert.equal(result.nextState.present_before, null);
      assert.equal(result.windowsHelperState.present_before, null);
      assert.equal(result.serviceLifecycleBefore, null);
      assert.equal(calls.logPrepare, 0);
      assert.equal(existsSync(runLogRoot), false, "refused attempts have no phase-log directory");
      assert.equal(readFileSync(path.join(next, "live-build"), "utf8"), "pre-existing build");
      assert.equal(readFileSync(path.join(windows, "live-helper"), "utf8"), "pre-existing helper");
      assert.equal(calls.acquire, scenario === "acquisition_failure" ? 1 : 0);
      if (scenario === "checkout_busy") {
        assert.equal(result.checkoutOwnership.failure_code, "checkout_owner_busy");
        assert.equal(result.executionFailure, true);
        const preserved = finalizeReceipt({ checkout_ownership: result.checkoutOwnership });
        assert.equal(preserved.checkout_ownership.acquired, false);
        assert.equal(verifyReceiptIntegrity(preserved), true);
        assert.equal(assertCheckoutVerificationOwnership(competingOwner, root), true);
      }
    } else {
      const unsettled = scenario === "unsettled_failure";
      assert.equal(calls.phases, 1); assert.equal(calls.release, quick || unsettled ? 0 : 1);
      assert.equal(result.sharedGeneratedStateOwned, true); assert.equal(result.cleanupComplete, !unsettled);
      assert.equal(result.nextState.removed_after_execution, !quick && !unsettled);
      assert.equal(result.windowsHelperState.removed_after_execution, !quick && !unsettled);
      assert.equal(existsSync(next), quick || unsettled); assert.equal(existsSync(windows), quick || unsettled);
      assert.equal(result.executionFailure, scenario === "owned_failure" || unsettled);
      assert.equal(result.nextState.present_before, true);
      assert.equal(result.windowsHelperState.present_before, true);
      assert.equal(result.generatedWindowsHelperPresentAfter, quick || unsettled);
      assert.equal(calls.logPrepare, 1);
      assert.equal(existsSync(runLogRoot), true, "retention preserves this run's phase logs");
      if (racingState) {
        assert.deepEqual(diagnosticBeforeLock, { next: false, windows: false });
        assert.equal(result.nextState.removed_before_execution, true);
        assert.equal(result.windowsHelperState.removed_before_execution, true);
        assert.deepEqual(result.serviceLifecycleBefore, { status: "live" });
        assert.deepEqual(result.serviceLifecycleAfter, { status: "live" });
        const receipt = finalizeReceipt({ cleanup: { generated_next: result.nextState,
          generated_windows_helper: result.windowsHelperState,
          companion_service: { before: result.serviceLifecycleBefore, after: result.serviceLifecycleAfter } } });
        assert.equal(verifyReceiptIntegrity(receipt), true);
        assert.equal(receipt.cleanup.generated_next.present_before, true);
      }
      if (unsettled) assert.equal(result.checkoutOwnership.failure_code, "checkout_owner_consumers_unsettled");
    }
    const acquired = !["wrong_npm", "checkout_busy"].includes(scenario);
    assert.equal(calls.checkoutRelease, acquired ? 1 : 0);
    assert.equal(calls.prune, acquired ? 1 : 0, "a refused/non-owner invocation never prunes artifacts");
    assert.equal(result.checkoutOwnership.released, acquired && scenario !== "unsettled_failure");
    assert.equal(existsSync(path.join(root, ".augnes-local-verification", CHECKOUT_OWNER_FILE)), ["checkout_busy", "unsettled_failure"].includes(scenario));
  } finally {
    if (competingOwner) releaseCheckoutVerificationOwnership(competingOwner, root);
    rmSync(root, { recursive: true, force: true });
  }
}

const retentionRoot = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-log-retention-")));
const retentionOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: retentionRoot });
try {
  const logs = path.join(retentionRoot, ".augnes-local-verification", "logs");
  const receipts = path.join(retentionRoot, ".augnes-local-verification", "receipts");
  const active = path.join(logs, "current-run");
  mkdirSync(active, { recursive: true });
  writeFileSync(path.join(active, "phase.log"), "current run evidence");
  utimesSync(active, 1, 1);
  mkdirSync(receipts);
  for (let index = 0; index < 8; index++) {
    const newer = path.join(logs, `newer-${index}`);
    mkdirSync(newer); utimesSync(newer, index + 2, index + 2);
    const failedReceipt = path.join(receipts, `failed-${index}.json`);
    writeFileSync(failedReceipt, JSON.stringify(finalizeReceipt({ final: { result: "failure" } })));
    utimesSync(failedReceipt, index + 2, index + 2);
  }
  const retentionOptions = { root: retentionRoot, currentRunId: "current-run", logMaximum: 5, receiptMaximum: 3 };
  assert.throws(() => enforceArtifactRetention(retentionOptions), hasCode("checkout_owner_not_owned"));
  assert.equal(readdirSync(logs).length, 9);
  assert.throws(() => enforceArtifactRetention({ ...retentionOptions, checkoutOwner: retentionOwner, currentRunId: "../escape" }), hasCode("invalid_artifact_retention_boundary"));
  enforceArtifactRetention({ ...retentionOptions, checkoutOwner: retentionOwner });
  assert.equal(readFileSync(path.join(active, "phase.log"), "utf8"), "current run evidence");
  assert.deepEqual(readdirSync(logs).sort(), ["current-run", "newer-4", "newer-5", "newer-6", "newer-7"]);
  assert.deepEqual(readdirSync(receipts).sort(), ["failed-5.json", "failed-6.json", "failed-7.json"]);
  for (const file of readdirSync(receipts)) {
    const receipt = JSON.parse(readFileSync(path.join(receipts, file), "utf8"));
    assert.equal(receipt.final.result, "failure");
    assert.equal(verifyReceiptIntegrity(receipt), true);
  }
} finally {
  releaseCheckoutVerificationOwnership(retentionOwner, retentionRoot);
  rmSync(retentionRoot, { recursive: true, force: true });
}

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
      current_main_base_equality_and_ancestry_admitted_before_planning: true,
      unavailable_current_main_has_no_tracking_ref_fallback: true,
      checkout_interprocess_exclusion_independent_of_companion: true,
      checkout_owner_stale_unsafe_and_foreign_cleanup_refused: true,
      quick_shared_typegen_coordinated: true,
      quick_dirty_non_deciding: true,
      deciding_dirty_refused: true,
      post_execution_tracked_mutation_refused: true,
      next_env_generated_and_ignored: true,
      typecheck_runs_next_typegen: true,
      documentation_selection_dependency_light: true,
      documentation_receipt_always_non_deciding: true,
      policy_documentation_read_from_exact_head: true,
      operating_policy_selection_static_and_maintenance_free: true,
      owner_targeted_selection_uses_fixed_owner_complete_phases: true,
      owner_targeted_dependencies_cleanly_prepared_before_consumers: true,
      owner_targeted_preexisting_and_generated_next_removed: true,
      generated_next_path_and_symlink_safety_fail_closed: true,
      generated_next_cleanup_precedes_companion_restoration: true,
      generated_state_observed_after_checkout_and_maintenance: true,
      current_run_logs_protected_within_retention_bound: true,
      refused_contenders_preserve_receipts_without_phase_logs: true,
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

function hasCode(code) {
  return (error) => error?.code === code;
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
