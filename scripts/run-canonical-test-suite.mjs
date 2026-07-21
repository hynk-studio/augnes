#!/usr/bin/env node

import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalChildFailure,
  DEFAULT_CANONICAL_CHILD_TIMEOUT_MS,
  runCanonicalChild,
  runCanonicalChildGroups,
} from "./canonical-child-runner.mjs";
import {
  buildCanonicalChildEnvironment,
  findForbiddenAmbientKeysForwarded,
} from "./canonical-test-environment.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const nestedAppRoot = path.join(repoRoot, "apps/augnes_apps");
const suiteName = process.argv[2];
const temporaryRoot = realpathSync(
  mkdtempSync(path.join(tmpdir(), "ag-suite-")),
);
const ownedResourceRoots = [];

const rootNode = (...args) => ({
  command: process.execPath,
  args: ["--import", "tsx", ...args],
  cwd: repoRoot,
});

const nestedNode = (...args) => ({
  command: process.execPath,
  args: ["--import", "tsx", ...args],
  cwd: nestedAppRoot,
});

const suites = {
  unit: [
    {
      label: "vNext provider-neutral protocol conformance",
      ...rootNode("scripts/vnext-protocol-conformance.ts"),
    },
    {
      label: "operator review-window policy",
      ...rootNode(
        "scripts/validate-vnext-operator-pilot-review-window-config-v0-1.ts",
      ),
    },
    {
      label: "operator deterministic and static pure contracts",
      ...rootNode("scripts/test-vnext-operator-pure-contracts-v0-1.ts"),
      timeoutMs: 30_000,
    },
    {
      label: "operator browser fixture builder contract",
      ...rootNode("scripts/test-vnext-operator-browser-fixture-v0-1.ts"),
      // The complete success and fail-closed contract measured 18.9s locally.
      timeoutMs: 45_000,
    },
    {
      label: "decision-centered Semantic Workbench presentation contract",
      ...rootNode("scripts/test-vnext-decision-centered-workbench.tsx"),
      timeoutMs: 30_000,
    },
    {
      label: "bounded local project-root verification adapter",
      ...rootNode("scripts/test-local-project-verification-adapter.ts"),
      // Incremental-bound, root-drift, and terminal-residue coverage measured 0.4s locally.
      timeoutMs: 30_000,
    },
  ],
  integration: [
    {
      id: "project-verify-material",
      group: "supporting-serial",
      requirements: ["database", "migrations", "backup-restore"],
      label:
        "project-scoped Evidence, Claim, relation admission, lineage, and source replay",
      ...rootNode("scripts/test-vnext-project-verify-material.ts"),
      timeoutMs: 30_000,
    },
    {
      id: "project-verify-lifecycle",
      group: "supporting-serial",
      requirements: ["database", "migrations", "backup-restore"],
      label:
        "project Verify lifecycle, exact Transition, reconciliation, and lineage",
      ...rootNode("scripts/test-vnext-project-verify-lifecycle.ts"),
      // Current-head exact lifecycle, rollback, bounded-read, source-chain, and
      // restore coverage measured 43.55s locally; bound it with a 60s margin.
      timeoutMs: 60_000,
    },
    {
      id: "project-verify-production-lifecycle",
      group: "supporting-serial",
      requirements: ["database", "migrations", "backup-restore"],
      label:
        "production local-root Verify candidate, Transition, later-context, and feedback lineage",
      ...rootNode(
        "scripts/test-local-project-verification-adapter.ts",
        "--sr3-lifecycle",
      ),
      // The complete real-adapter SR-1 -> SR-2 -> SR-3 lifecycle proof measured
      // 50.63s before call-local validation deduplication; bound it at 75s.
      timeoutMs: 75_000,
    },
    {
      id: "project-verify-operator-adapter",
      group: "supporting-serial",
      requirements: ["database", "migrations"],
      label:
        "authenticated Workbench decision adapter and exact SR-3 operation lineage",
      ...rootNode(
        "scripts/test-vnext-project-verify-lifecycle.ts",
        "--operator-adapter-only",
      ),
      // The isolated authenticated four-operation adapter chain measured under
      // one second locally after being split from the 39.18s CI lifecycle proof.
      timeoutMs: 30_000,
    },
    {
      id: "project-controls",
      group: "supporting-serial",
      requirements: ["database", "migrations", "mutable-module-state"],
      label:
        "project automation, Personal Perspective scope, admission, CAS, and isolation",
      ...rootNode("scripts/test-vnext-project-controls.ts"),
    },
    {
      id: "policy-triggered-model-run",
      group: "supporting-serial",
      requirements: ["database", "migrations", "deterministic-fake-transport"],
      label:
        "policy-triggered Planner grant, Model Gateway, and RunReceipt lifecycle",
      ...rootNode("scripts/test-policy-triggered-model-run.ts"),
      timeoutMs: 30_000,
    },
    {
      id: "project-home",
      group: "supporting-serial",
      requirements: ["database", "migrations", "filesystem"],
      label:
        "Minimum Project Home projection, lineage, isolation, and read-only routing",
      ...rootNode("scripts/test-vnext-project-home.ts"),
    },
    {
      id: "project-onboarding",
      group: "supporting-serial",
      requirements: ["database", "migrations", "filesystem", "project-root"],
      label:
        "folder onboarding, recent projects, active selection, and recovery",
      ...rootNode("scripts/test-vnext-project-onboarding.ts"),
    },
    {
      id: "project-identity",
      group: "supporting-serial",
      requirements: ["database", "migrations", "filesystem", "project-root"],
      label: "project identity, persistence, compatibility, and isolation",
      ...rootNode("scripts/test-vnext-project-identity.ts"),
    },
    {
      id: "mcp-adapter-runtime",
      group: "supporting-serial",
      requirements: ["filesystem", "process-owning", "mutable-module-state"],
      label: "current MCP and adapter runtime integration",
      ...nestedNode("scripts/smoke.ts"),
    },
    {
      id: "cross-session-read",
      group: "supporting-serial",
      requirements: [
        "database",
        "listener-port-owning",
        "mutable-module-state",
      ],
      label: "cross-session read integration",
      ...nestedNode("scripts/smoke-cross-session-read-tools.ts"),
    },
    {
      id: "durable-semantic-loop",
      group: "supporting-serial",
      requirements: ["database", "migrations", "backup-restore", "filesystem"],
      label: "durable semantic loop, replay, isolation, and migration",
      ...rootNode("scripts/smoke-vnext-durable-semantic-loop-v0-1.ts"),
    },
    {
      id: "operator-pilot",
      group: "operator-process",
      requirements: [
        "database",
        "migrations",
        "backup-restore",
        "filesystem",
        "git-worktree",
        "process-owning",
        "listener-port-owning",
        "mutable-module-state",
      ],
      label: "operator loop migration, backup, restore, and immutable records",
      ...rootNode("scripts/smoke-vnext-operator-pilot-v0-1.ts"),
      // Current-head local success measured 402.56s after adding the bounded
      // approval-lifecycle cases; the same CI run measured comparable
      // integration children at up to 1.87x local duration. Bound the projected
      // 753s run with a small margin. E2E now owns a separate 45s bounded
      // production-seam fixture builder instead of rerunning this smoke.
      timeoutMs: 780_000,
    },
    {
      id: "portable-export",
      group: "supporting-serial",
      requirements: ["pure-deterministic", "filesystem-fixture-consumer"],
      label: "portable-export foundations and project scope",
      ...rootNode("scripts/test-portable-export-foundations.ts"),
    },
    {
      id: "portable-project-continuity",
      group: "supporting-serial",
      requirements: [
        "database",
        "migrations",
        "filesystem",
        "backup-restore",
        "mutable-module-state",
      ],
      label:
        "portable project contract, atomic round trip, reader fidelity, and authority isolation",
      ...rootNode("scripts/test-portable-project-continuity.ts"),
      // Production-equivalent fixture, validation, round trip, replay, and
      // adversarial cases measured 13.41s locally.
      timeoutMs: 45_000,
    },
  ],
  authority: [
    {
      label: "canonical child environment isolation",
      ...rootNode("scripts/test-canonical-environment-isolation.mjs"),
    },
    {
      label: "bounded canonical child lifecycle and process-tree cleanup",
      ...rootNode("scripts/test-canonical-child-runner.mjs"),
      timeoutMs: 60_000,
    },
    {
      label: "canonical CI workflow and lifecycle guardrails",
      ...rootNode("scripts/test-canonical-ci-contract.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "bounded model egress before transport",
      ...rootNode("scripts/test-bounded-model-egress.ts"),
    },
    {
      label: "R4 production model boundary and exit invariants",
      ...rootNode("scripts/test-r4-model-boundary.ts"),
      timeoutMs: 30_000,
    },
    {
      label:
        "project-scoped Model Gateway and all production model transport authority",
      ...rootNode("scripts/test-model-gateway.ts"),
    },
    {
      label: "root runtime authority invariants",
      ...rootNode("scripts/smoke-authority-invariants.mjs"),
    },
    {
      label: "MCP and bridge authority invariants",
      ...nestedNode("scripts/invariants.ts"),
    },
  ],
  operability: [
    {
      label: "bounded public recovery action transport",
      ...rootNode("scripts/test-recovery-product-route.ts"),
      timeoutMs: 30_000,
    },
    {
      label: "production canonical record recovery validation",
      ...rootNode("scripts/test-recovery-canonical-record-validator.ts"),
      // The production 30-record backup/restore fixture, real product readers,
      // and adversarial mutations measured 83.72s locally after the recovery
      // privacy boundary. Comparable canonical process children have measured
      // up to 1.87x local duration in CI, so retain a bounded 180s limit.
      timeoutMs: 180_000,
    },
    {
      label: "versioned recovery backup and atomic restore contract",
      ...rootNode("scripts/test-recovery-backup.mjs"),
      // The complete backup, hard-crash ownership, adoption, and restore matrix
      // measured 37.62s locally. Comparable canonical process children have
      // measured up to 1.87x locally observed duration in CI, so retain a
      // bounded 75s child limit without retrying.
      timeoutMs: 75_000,
    },
    {
      label:
        "platform local paths, first-run database, migration, and recovery",
      ...rootNode("scripts/test-runtime-database-bootstrap.mjs"),
      timeoutMs: 120_000,
    },
    {
      label:
        "canonical supervisor lifecycle, ownership, collision, and cleanup",
      ...rootNode("scripts/test-runtime-operability.mjs"),
      timeoutMs: 120_000,
    },
    {
      label: "runtime crash, orphan, stale-state, and database reconciliation",
      ...rootNode("scripts/test-runtime-reconciliation.mjs"),
      // The complete update/restore journal, legacy-v3, active-WAL, and crash
      // reconciliation matrix measured 234.45s locally. Existing canonical CI
      // process suites have measured up to 1.87x local duration, so keep a
      // bounded 480s child limit with a small scheduling margin.
      timeoutMs: 480_000,
    },
    {
      label: "distributable package and packaged runtime operability",
      ...rootNode("scripts/test-distributable-package.mjs"),
      // The complete packaged update/restore, restart-failure, and crash
      // lifecycle measured 265.37s on darwin-arm64. The bounded 480s limit
      // retains measured CI scheduling/native-build margin without retrying.
      timeoutMs: 480_000,
    },
  ],
  e2e: [
    {
      label: "TaskContextPacket to Workbench golden path",
      ...rootNode("scripts/browser-validate-vnext-native-host-result-v0-1.mjs"),
      timeoutMs: 480_000,
    },
  ],
};

if (!(suiteName in suites)) {
  console.error(`Unknown canonical test suite: ${suiteName ?? "<missing>"}`);
  console.error(`Expected one of: ${Object.keys(suites).join(", ")}`);
  process.exit(2);
}

const results = [];
let forbiddenEnvironmentKeysForwarded = 0;
let canonicalChildrenChecked = 0;

try {
  const preparedSteps = suites[suiteName].map((step, index) => {
    const resourceRoot = realpathSync(
      mkdtempSync(
        path.join(tmpdir(), `ag-c${String(index + 1).padStart(2, "0")}-`),
      ),
    );
    ownedResourceRoots.push(resourceRoot);
    for (const directory of [
      path.join(resourceRoot, "home"),
      path.join(resourceRoot, "runtime-state"),
    ]) {
      mkdirSync(directory, { recursive: true, mode: 0o700 });
    }
    const stepEnvironment = step.env ?? {};
    const childEnvironment = buildCanonicalChildEnvironment({
      ambientEnvironment: process.env,
      stepEnvironment,
      temporaryRoot,
      resourceRoot,
    });
    const forbiddenKeys = findForbiddenAmbientKeysForwarded({
      ambientEnvironment: process.env,
      childEnvironment,
      stepEnvironment,
    });
    forbiddenEnvironmentKeysForwarded += forbiddenKeys.length;
    canonicalChildrenChecked += 1;
    if (forbiddenKeys.length > 0) {
      throw new Error(
        `forbidden ambient environment keys forwarded: ${forbiddenKeys.join(", ")}`,
      );
    }
    const timeoutMs = step.timeoutMs ?? DEFAULT_CANONICAL_CHILD_TIMEOUT_MS;
    return {
      id: step.id ?? `canonical-child-${index + 1}`,
      group: step.group ?? "serial",
      requirements: step.requirements ?? [],
      suite: suiteName,
      label: step.label,
      command: step.command,
      args: step.args,
      cwd: step.cwd,
      env: childEnvironment,
      timeoutMs,
      resourceRoot,
    };
  });
  if (
    new Set(preparedSteps.map((step) => step.id)).size !==
      preparedSteps.length ||
    new Set(preparedSteps.map((step) => step.resourceRoot)).size !==
      preparedSteps.length
  ) {
    throw new Error(
      "canonical child ownership or resource isolation is duplicated",
    );
  }

  let completedResults;
  if (suiteName === "integration") {
    const operator = preparedSteps.filter(
      (step) => step.group === "operator-process",
    );
    const supporting = preparedSteps.filter(
      (step) => step.group === "supporting-serial",
    );
    if (
      operator.length !== 1 ||
      supporting.length !== preparedSteps.length - 1
    ) {
      throw new Error(
        "integration concurrent ownership inventory is incomplete",
      );
    }
    completedResults = await runCanonicalChildGroups({
      suite: suiteName,
      maxConcurrency: 2,
      groups: [
        { id: "operator-process", children: operator },
        { id: "supporting-serial", children: supporting },
      ],
    });
  } else {
    completedResults = [];
    for (const step of preparedSteps) {
      console.log();
      const result = await runCanonicalChild(step);
      completedResults.push(result);
      if (
        result.timed_out ||
        result.spawn_error_code ||
        result.exit_code !== 0
      ) {
        throw canonicalChildFailure(result, {
          suite: suiteName,
          timeoutMs: step.timeoutMs,
        });
      }
    }
  }

  for (const result of completedResults) {
    results.push({
      label: result.label,
      group: result.group ?? "serial",
      status: result.exit_code ?? 1,
      signal: result.signal,
      timed_out: result.timed_out,
      duration_ms: result.duration_ms,
    });
  }

  console.log(
    JSON.stringify(
      {
        suite: suiteName,
        status: "pass",
        environment_isolation_verified: forbiddenEnvironmentKeysForwarded === 0,
        forbidden_environment_keys_forwarded: forbiddenEnvironmentKeysForwarded,
        canonical_children_checked: canonicalChildrenChecked,
        ...(suiteName === "integration"
          ? {
              concurrency_bound: 2,
              integration_groups: ["operator-process", "supporting-serial"],
              child_resource_isolation: [
                "HOME",
                "USERPROFILE",
                "TMPDIR",
                "TMP",
                "TEMP",
                "AUGNES_CANONICAL_TEMP_ROOT",
                "AUGNES_DB_PATH",
                "AUGNES_RUNTIME_STATE_DIR",
              ],
            }
          : {}),
        results,
      },
      null,
      2,
    ),
  );
} finally {
  for (const resourceRoot of ownedResourceRoots) {
    rmSync(resourceRoot, { recursive: true, force: true });
  }
  rmSync(temporaryRoot, { recursive: true, force: true });
}
