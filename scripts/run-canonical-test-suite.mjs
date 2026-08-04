#!/usr/bin/env node

import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalChildAcceptanceFailure,
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

const operatorExecutionRequirements = [
  "database",
  "migrations",
  "filesystem",
  "project-root",
  "process-owning",
  "listener-port-owning",
  "browser-profile-owning",
  "cdp-session-owning",
  "immutable-fixture-input",
  "operator-session-owning",
];
const operatorReviewControlStep = {
  id: "operator-review-control",
  group: "operator-execution",
  requirements: operatorExecutionRequirements,
  label: "independent operator review and control Browser child",
  ...rootNode("scripts/browser-validate-operator-review-control-v1.mjs"),
  timeoutMs: 360_000,
  requireNaturalExit: true,
};
const operatorNativeHostExecutionStep = {
  id: "operator-native-host-execution",
  group: "operator-execution",
  requirements: operatorExecutionRequirements,
  label: "independent operator native-host execution Browser child",
  ...rootNode("scripts/browser-validate-operator-native-host-execution-v1.mjs"),
  timeoutMs: 360_000,
  requireNaturalExit: true,
};
const operatorMultiCandidateStep = {
  id: "operator-multi-candidate",
  group: "operator-execution",
  requirements: operatorExecutionRequirements,
  label: "independent operator multi-candidate semantic Browser child",
  ...rootNode("scripts/browser-validate-operator-multi-candidate-v1.mjs"),
  timeoutMs: 360_000,
  requireNaturalExit: true,
};
const projectExperienceStep = {
  id: "project-experience",
  group: "project-experience",
  requirements: [
    "database", "migrations", "filesystem", "project-root", "process-owning",
    "listener-port-owning", "browser-profile-owning", "cdp-session-owning",
    "immutable-fixture-input",
  ],
  label: "independent project experience Browser owner",
  ...rootNode("scripts/browser-validate-project-experience-v1.mjs"),
  timeoutMs: 360_000,
  requireNaturalExit: true,
};
const continuityStep = {
  id: "continuity",
  group: "continuity",
  requirements: [
    "database", "migrations", "filesystem", "backup-restore", "project-root",
    "process-owning", "listener-port-owning", "browser-profile-owning",
    "cdp-session-owning", "immutable-fixture-input",
  ],
  label: "independent continuity Browser owner",
  ...rootNode("scripts/browser-validate-continuity-v1.mjs"),
  timeoutMs: 480_000,
  requireNaturalExit: true,
};
const goldenStep = {
  id: "golden",
  group: "cross-boundary-golden",
  requirements: operatorExecutionRequirements,
  label: "thin cross-boundary Browser golden path",
  ...rootNode("scripts/browser-validate-cross-boundary-golden-v1.mjs"),
  timeoutMs: 360_000,
  requireNaturalExit: true,
};

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
      label: "project experience immutable Browser fixture contract",
      ...rootNode("scripts/test-project-experience-browser-fixture-v1.ts"),
      timeoutMs: 30_000,
    },
    {
      label: "project experience keyed result and finalization contract",
      ...rootNode("scripts/test-project-experience-result-contract-v1.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "continuity keyed result and finalization contract",
      ...rootNode("scripts/test-continuity-result-contract-v1.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "operator execution immutable Browser fixture profiles",
      ...rootNode("scripts/test-operator-execution-browser-fixture-v1.ts"),
      timeoutMs: 30_000,
    },
    {
      label: "operator execution keyed result effect and finalization contract",
      ...rootNode("scripts/test-operator-execution-result-contract-v1.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "operator execution exact structural effect ledger contract",
      ...rootNode("scripts/test-operator-execution-effect-ledger-v1.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "AI Workplane human projection and exact-detail contract",
      ...rootNode("scripts/test-vnext-decision-centered-workbench.tsx"),
      timeoutMs: 30_000,
    },
    {
      label:
        "GuideBrief bounded conversation routing, scope, meaning, and authority contract",
      ...rootNode("scripts/test-vnext-guide-brief-conversation.ts"),
      timeoutMs: 30_000,
    },
    {
      label:
        "GuideBrief bounded conversation Browser composition contract",
      ...rootNode(
        "scripts/test-vnext-guide-brief-conversation-component.ts",
      ),
      timeoutMs: 30_000,
    },
    {
      label:
        "GuideBrief bounded Browser interaction registry, plan, and execution contract",
      ...rootNode("scripts/test-vnext-guide-brief-interaction.ts"),
      timeoutMs: 30_000,
    },
    {
      label:
        "GuideBrief bounded Browser interaction component and owner contract",
      ...rootNode(
        "scripts/test-vnext-guide-brief-interaction-component.ts",
      ),
      timeoutMs: 30_000,
    },
    {
      label: "C8 semantic visual hierarchy and regression contract",
      ...rootNode("scripts/test-c8-semantic-visual-contract.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "contextual exact-details presentation contract",
      ...rootNode("scripts/test-vnext-contextual-inspector.ts"),
      timeoutMs: 30_000,
    },
    {
      label: "delegated Codex work projection and polling contract",
      ...rootNode("scripts/test-vnext-delegated-work.ts"),
      timeoutMs: 30_000,
    },
    {
      label: "exact read-only Codex current continuity contract",
      ...rootNode("scripts/test-vnext-codex-current-continuity.ts"),
      timeoutMs: 30_000,
    },
    {
      label: "exact repository-scoped Codex continuity contract",
      ...rootNode("scripts/test-codex-repository-continuity.ts"),
      timeoutMs: 30_000,
    },
    {
      label: "Windows physical-root identity adapter contract",
      ...rootNode("scripts/test-windows-physical-root-identity.ts"),
      timeoutMs: 30_000,
    },
    {
      label: "trusted repository execution admission and attachment contract",
      ...rootNode("scripts/test-repository-execution-attachment.ts"),
      timeoutMs: 60_000,
    },
    {
      label: "managed repository delegation contract",
      ...rootNode("scripts/test-repository-managed-delegation.ts"),
      timeoutMs: 60_000,
    },
    {
      label: "live Companion discovery and dynamic bridge-port contract",
      ...rootNode("scripts/test-codex-companion-discovery.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "private live Companion Host, Origin, CORS, and proxy-channel contract",
      ...rootNode("scripts/test-codex-companion-privacy.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "bounded local project-root verification adapter",
      ...rootNode("scripts/test-local-project-verification-adapter.ts"),
      // Incremental-bound, root-drift, and terminal-residue coverage measured 0.4s locally.
      timeoutMs: 30_000,
    },
    {
      label: "browser E2E timing and lifecycle contracts",
      ...rootNode("scripts/test-browser-e2e-timing.mjs"),
    },
    {
      label: "browser expected-refusal accounting",
      ...rootNode("scripts/test-browser-expected-refusal-accounting.mjs"),
    },
    {
      label: "race-safe browser file-signal observation",
      ...rootNode("scripts/test-bounded-file-signal.mjs"),
    },
    {
      label: "permanent Browser verification owner manifest contract",
      ...rootNode("scripts/test-browser-verification-owners.mjs"),
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
      id: "continuity-pins",
      group: "supporting-serial",
      requirements: [
        "database",
        "migrations",
        "filesystem",
        "mutable-module-state",
      ],
      label:
        "project-scoped Continuities pins, CAS, unresolved retention, recovery, portability, and authority isolation",
      ...rootNode("scripts/test-vnext-continuity-pins.ts"),
      timeoutMs: 120_000,
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
      id: "project-work-initialization",
      group: "supporting-serial",
      requirements: ["database", "migrations", "filesystem"],
      label:
        "authenticated first-work initialization, packet lineage, and separate native-host start",
      ...rootNode("scripts/test-vnext-project-work-initialization.ts"),
      timeoutMs: 30_000,
    },
    {
      id: "blank-state",
      group: "supporting-serial",
      requirements: ["database", "migrations", "filesystem"],
      label:
        "Blank State focus, route source, project choice, and read-only projection",
      ...rootNode("scripts/test-vnext-blank-state.ts"),
      timeoutMs: 30_000,
    },
    {
      id: "guide-brief-current-project",
      group: "supporting-serial",
      requirements: ["database", "migrations", "filesystem", "route-transport"],
      label:
        "GuideBrief v0.2 current-project source, projections, bounds, safety, and packet separation",
      ...rootNode("scripts/test-vnext-guide-brief.ts"),
      timeoutMs: 30_000,
    },
    {
      id: "codex-read-guide-brief",
      group: "supporting-serial",
      requirements: ["route-transport", "deterministic-fake-transport"],
      label:
        "Codex current-project GuideBrief marker, bounded sections, and fail-closed parsing",
      ...nestedNode("scripts/test-codex-read-brief.ts"),
      timeoutMs: 30_000,
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
      requirements: [
        "database",
        "migrations",
        "backup-restore",
        "filesystem",
        "nested-app-runtime",
      ],
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
      label: "canonical change planner and documentation validator",
      ...rootNode("scripts/test-canonical-change-planner.mjs"),
      timeoutMs: 60_000,
    },
    {
      label: "dependency-lock graph compatibility normalization",
      ...rootNode("scripts/test-dependency-lock-compatibility.mjs"),
      timeoutMs: 30_000,
    },
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
      label: "local Canonical verification and lifecycle guardrails",
      ...rootNode(
        "scripts/test-local-canonical-verification-contract.mjs",
      ),
      timeoutMs: 30_000,
    },
    {
      label: "local Canonical executor identity and scheduling contract",
      ...rootNode("scripts/test-local-canonical-executor.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "local Canonical receipt integrity and staleness contract",
      ...rootNode("scripts/test-local-canonical-receipt.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "local Canonical PR evidence projection and policy contract",
      ...rootNode("scripts/test-local-canonical-pr-evidence.mjs"),
      timeoutMs: 30_000,
    },
    {
      label: "local Canonical PR evidence GitHub transport contract",
      ...rootNode(
        "scripts/test-local-canonical-pr-evidence-transport.mjs",
      ),
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
      id: "durable-run-reconciliation",
      shard: "operability-fast",
      requirements: ["database", "migrations", "filesystem"],
      label:
        "startup durable-run reconciliation, exact replay, and redacted diagnostics",
      ...rootNode("scripts/test-runtime-run-reconciliation.ts"),
      timeoutMs: 30_000,
    },
    {
      id: "public-recovery-action",
      shard: "operability-fast",
      requirements: ["database", "migrations", "route-transport"],
      label: "bounded public recovery action transport",
      ...rootNode("scripts/test-recovery-product-route.ts"),
      timeoutMs: 30_000,
    },
    {
      id: "recovery-validator",
      shard: "operability-recovery-validator",
      requirements: ["database", "backup-restore", "production-readers"],
      label: "production canonical record recovery validation",
      ...rootNode("scripts/test-recovery-canonical-record-validator.ts"),
      // The production 30-record backup/restore fixture, real product readers,
      // and adversarial mutations measured 83.72s locally after the recovery
      // privacy boundary. Comparable canonical process children have measured
      // up to 1.87x local duration in CI, so retain a bounded 180s limit.
      timeoutMs: 180_000,
    },
    {
      id: "recovery-backup",
      shard: "operability-recovery-storage",
      requirements: ["database", "backup-restore", "process-owning"],
      label: "versioned recovery backup and atomic restore contract",
      ...rootNode("scripts/test-recovery-backup.mjs"),
      // The complete backup, hard-crash ownership, adoption, and restore matrix
      // measured 37.62s locally. Comparable canonical process children have
      // measured up to 1.87x locally observed duration in CI, so retain a
      // bounded 75s child limit without retrying.
      timeoutMs: 75_000,
    },
    {
      id: "runtime-database-bootstrap",
      shard: "operability-recovery-storage",
      requirements: ["database", "migrations", "backup-restore", "filesystem"],
      label:
        "platform local paths, first-run database, migration, and recovery",
      ...rootNode("scripts/test-runtime-database-bootstrap.mjs"),
      timeoutMs: 120_000,
    },
    {
      id: "runtime-supervisor",
      shard: "operability-supervisor",
      requirements: [
        "process-owning",
        "listener-port-owning",
        "filesystem",
        "nested-app-runtime",
      ],
      label:
        "canonical supervisor lifecycle, ownership, collision, and cleanup",
      ...rootNode("scripts/test-runtime-operability.mjs"),
      timeoutMs: 120_000,
    },
    {
      id: "runtime-reconciliation",
      shard: "operability-runtime-reconciliation",
      requirements: [
        "database",
        "backup-restore",
        "process-owning",
        "listener-port-owning",
        "filesystem",
        "nested-app-runtime",
      ],
      label: "runtime crash, orphan, stale-state, and database reconciliation",
      ...rootNode("scripts/test-runtime-reconciliation.mjs"),
      // The complete update/restore journal, legacy-v3, active-WAL, and crash
      // reconciliation matrix measured 234.45s locally. Existing canonical CI
      // process suites have measured up to 1.87x local duration, so keep a
      // bounded 480s child limit with a small scheduling margin.
      timeoutMs: 480_000,
    },
    {
      id: "distributable-package",
      shard: "operability-package",
      requirements: [
        "database",
        "migrations",
        "backup-restore",
        "process-owning",
        "listener-port-owning",
        "filesystem",
        "git-history",
        "package-build",
        "nested-app-runtime",
      ],
      label: "distributable package and packaged runtime operability",
      ...rootNode("scripts/test-distributable-package.mjs"),
      // The complete packaged update/restore, restart-failure, and crash
      // lifecycle measured 265.37s on darwin-arm64. The bounded 480s limit
      // retains measured CI scheduling/native-build margin without retrying.
      timeoutMs: 480_000,
    },
  ],
  e2e: [
    { ...projectExperienceStep },
    { ...operatorReviewControlStep },
    { ...operatorNativeHostExecutionStep },
    { ...operatorMultiCandidateStep },
    { ...continuityStep },
    { ...goldenStep },
  ],
  "e2e-project-experience": [{ ...projectExperienceStep }],
  "e2e-operator-review-control": [{ ...operatorReviewControlStep }],
  "e2e-operator-native-host-execution": [
    { ...operatorNativeHostExecutionStep },
  ],
  "e2e-operator-multi-candidate": [{ ...operatorMultiCandidateStep }],
  "e2e-operator-execution": [
    { ...operatorReviewControlStep },
    { ...operatorNativeHostExecutionStep },
    { ...operatorMultiCandidateStep },
  ],
  "e2e-continuity": [{ ...continuityStep }],
  "e2e-golden": [{ ...goldenStep }],
};

const integrationInventory = suites.integration;
suites["integration-operator"] = integrationInventory.filter(
  (step) => step.group === "operator-process",
);
suites["integration-supporting"] = integrationInventory.filter(
  (step) => step.group === "supporting-serial",
);

const operabilityInventory = suites.operability;
const operabilityShardNames = [
  "operability-fast",
  "operability-recovery-validator",
  "operability-recovery-storage",
  "operability-supervisor",
  "operability-runtime-reconciliation",
  "operability-package",
];
for (const shardName of operabilityShardNames) {
  suites[shardName] = operabilityInventory.filter(
    (step) => step.shard === shardName,
  );
  if (suites[shardName].length === 0) {
    throw new Error(`operability shard has no canonical ownership: ${shardName}`);
  }
}

if (
  suites["integration-operator"].length !== 1 ||
  suites["integration-supporting"].length !== integrationInventory.length - 1
) {
  throw new Error("focused integration ownership inventory is incomplete");
}
if (
  new Set(operabilityInventory.map((step) => step.id)).size !==
    operabilityInventory.length ||
  operabilityShardNames.flatMap((shardName) => suites[shardName]).length !==
    operabilityInventory.length
) {
  throw new Error("focused operability ownership inventory is incomplete");
}

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
      shard: step.shard ?? null,
      requirements: step.requirements ?? [],
      suite: suiteName,
      label: step.label,
      command: step.command,
      args: step.args,
      cwd: step.cwd,
      env: childEnvironment,
      timeoutMs,
      requireNaturalExit: step.requireNaturalExit === true,
      resourceRoot,
    };
  });
  const metadataByLabel = new Map(
    preparedSteps.map((step) => [
      step.label,
      {
        id: step.id,
        group: step.group,
        shard: step.shard,
        requirements: step.requirements,
      },
    ]),
  );
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
      const acceptanceFailure = canonicalChildAcceptanceFailure(result, {
        suite: suiteName,
        timeoutMs: step.timeoutMs,
        requireNaturalExit: step.requireNaturalExit,
      });
      if (acceptanceFailure) throw acceptanceFailure;
    }
  }

  for (const result of completedResults) {
    const metadata = metadataByLabel.get(result.label);
    if (!metadata) {
      throw new Error(`canonical result metadata is missing: ${result.label}`);
    }
    results.push({
      id: metadata.id,
      label: result.label,
      group: result.group ?? metadata.group,
      shard: metadata.shard,
      requirements: metadata.requirements,
      status: result.exit_code ?? 1,
      signal: result.signal,
      timed_out: result.timed_out,
      duration_ms: result.duration_ms,
      exit_observed: result.exit_observed,
      streams_closed: result.streams_closed,
      cleanup_completed: result.cleanup_completed,
      remaining_owned_processes: result.remaining_owned_processes,
      termination_reason: result.termination_reason,
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
