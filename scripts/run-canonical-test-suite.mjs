#!/usr/bin/env node

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalChildFailure,
  DEFAULT_CANONICAL_CHILD_TIMEOUT_MS,
  runCanonicalChild,
} from "./canonical-child-runner.mjs";
import {
  buildCanonicalChildEnvironment,
  findForbiddenAmbientKeysForwarded,
} from "./canonical-test-environment.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nestedAppRoot = path.join(repoRoot, "apps/augnes_apps");
const suiteName = process.argv[2];
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "augnes-canonical-tests-"));

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
      ...rootNode("scripts/validate-vnext-operator-pilot-review-window-config-v0-1.ts"),
    },
    {
      label: "Codex durable-summary policy",
      ...rootNode("scripts/validate-vnext-codex-review-durable-summary-policy-v0-1.ts"),
    },
  ],
  integration: [
    {
      label: "project automation, Personal Perspective scope, admission, CAS, and isolation",
      ...rootNode("scripts/test-vnext-project-controls.ts"),
    },
    {
      label: "policy-triggered Planner grant, Model Gateway, and RunReceipt lifecycle",
      ...rootNode("scripts/test-policy-triggered-model-run.ts"),
      timeoutMs: 30_000,
    },
    {
      label: "Minimum Project Home projection, lineage, isolation, and read-only routing",
      ...rootNode("scripts/test-vnext-project-home.ts"),
    },
    {
      label: "folder onboarding, recent projects, active selection, and recovery",
      ...rootNode("scripts/test-vnext-project-onboarding.ts"),
    },
    {
      label: "project identity, persistence, compatibility, and isolation",
      ...rootNode("scripts/test-vnext-project-identity.ts"),
      env: {
        AUGNES_DB_PATH: path.join(temporaryRoot, "project-identity.db"),
      },
    },
    {
      label: "current MCP and adapter runtime integration",
      ...nestedNode("scripts/smoke.ts"),
    },
    {
      label: "cross-session read integration",
      ...nestedNode("scripts/smoke-cross-session-read-tools.ts"),
    },
    {
      label: "durable semantic loop, replay, isolation, and migration",
      ...rootNode("scripts/smoke-vnext-durable-semantic-loop-v0-1.ts"),
      env: {
        AUGNES_DB_PATH: path.join(temporaryRoot, "durable-semantic-loop.db"),
      },
    },
    {
      label: "operator loop migration, backup, restore, and immutable records",
      ...rootNode("scripts/smoke-vnext-operator-pilot-v0-1.ts"),
      // Measured at 324.55s with the PR B fake App Server lifecycle matrix.
      // Keep a bounded margin without widening the 240s browser-fixture export.
      timeoutMs: 390_000,
    },
    {
      label: "portable-export foundations and project scope",
      ...rootNode("scripts/test-portable-export-foundations.ts"),
    },
  ],
  authority: [
    {
      label: "canonical child environment isolation",
      ...rootNode("scripts/test-canonical-environment-isolation.mjs"),
      env: {
        AUGNES_CANONICAL_TEMP_ROOT: temporaryRoot,
      },
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
      label: "project-scoped Model Gateway and all production model transport authority",
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
      label: "platform local paths, first-run database, migration, and recovery",
      ...rootNode("scripts/test-runtime-database-bootstrap.mjs"),
      timeoutMs: 120_000,
    },
    {
      label: "canonical supervisor lifecycle, ownership, collision, and cleanup",
      ...rootNode("scripts/test-runtime-operability.mjs"),
      timeoutMs: 120_000,
    },
    {
      label: "runtime crash, orphan, stale-state, and database reconciliation",
      ...rootNode("scripts/test-runtime-reconciliation.mjs"),
      timeoutMs: 180_000,
    },
  ],
  e2e: [
    {
      label: "TaskContextPacket to Workbench golden path",
      ...rootNode("scripts/browser-validate-vnext-task-context-packet-handoff-v0-1.mjs"),
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
  for (const step of suites[suiteName]) {
    console.log();
    const childEnvironment = buildCanonicalChildEnvironment({
      ambientEnvironment: process.env,
      stepEnvironment: step.env,
      temporaryRoot,
    });
    const forbiddenKeys = findForbiddenAmbientKeysForwarded({
      ambientEnvironment: process.env,
      childEnvironment,
      stepEnvironment: step.env,
    });
    forbiddenEnvironmentKeysForwarded += forbiddenKeys.length;
    canonicalChildrenChecked += 1;
    if (forbiddenKeys.length > 0) {
      throw new Error(
        `forbidden ambient environment keys forwarded: ${forbiddenKeys.join(", ")}`,
      );
    }
    const timeoutMs = step.timeoutMs ?? DEFAULT_CANONICAL_CHILD_TIMEOUT_MS;
    const result = await runCanonicalChild({
      suite: suiteName,
      label: step.label,
      command: step.command,
      args: step.args,
      cwd: step.cwd,
      env: childEnvironment,
      timeoutMs,
    });
    results.push({
      label: step.label,
      status: result.exit_code ?? 1,
      signal: result.signal,
      timed_out: result.timed_out,
      duration_ms: result.duration_ms,
    });
    if (result.timed_out || result.spawn_error_code || result.exit_code !== 0) {
      throw canonicalChildFailure(result, { suite: suiteName, timeoutMs });
    }
  }

  console.log(
    JSON.stringify(
      {
        suite: suiteName,
        status: "pass",
        environment_isolation_verified:
          forbiddenEnvironmentKeysForwarded === 0,
        forbidden_environment_keys_forwarded:
          forbiddenEnvironmentKeysForwarded,
        canonical_children_checked: canonicalChildrenChecked,
        results,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
