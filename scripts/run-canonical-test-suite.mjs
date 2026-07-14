#!/usr/bin/env node

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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
      label: "bounded model egress before transport",
      ...rootNode("scripts/test-bounded-model-egress.ts"),
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
    },
    {
      label: "canonical supervisor lifecycle, ownership, collision, and cleanup",
      ...rootNode("scripts/test-runtime-operability.mjs"),
    },
    {
      label: "runtime crash, orphan, stale-state, and database reconciliation",
      ...rootNode("scripts/test-runtime-reconciliation.mjs"),
    },
  ],
  e2e: [
    {
      label: "TaskContextPacket to Workbench golden path",
      ...rootNode("scripts/browser-validate-vnext-task-context-packet-handoff-v0-1.mjs"),
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
    const startedAt = Date.now();
    console.log(`\n[canonical:${suiteName}] ${step.label}`);
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
    const result = spawnSync(step.command, step.args, {
      cwd: step.cwd,
      env: childEnvironment,
      stdio: "inherit",
    });
    const durationMs = Date.now() - startedAt;
    const status = result.status ?? 1;
    results.push({ label: step.label, status, duration_ms: durationMs });
    if (result.error) throw result.error;
    if (status !== 0) {
      throw new Error(`${step.label} exited ${status}`);
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
