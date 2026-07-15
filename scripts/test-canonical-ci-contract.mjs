#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const workflow = readRepositoryFile(".github/workflows/ci.yml");
const agents = readRepositoryFile("AGENTS.md");
const canonicalSuite = readRepositoryFile("scripts/run-canonical-test-suite.mjs");
const canonicalRunner = readRepositoryFile("scripts/canonical-child-runner.mjs");
const processLifecycle = readRepositoryFile(
  "scripts/test-harness-process-lifecycle.mjs",
);

requireText(
  workflow,
  `concurrency:\n  group: canonical-ci-\${{ github.workflow }}-\${{ github.event.pull_request.number || github.ref }}\n  cancel-in-progress: true`,
  "Canonical CI must cancel superseded runs for the same PR or ref",
);
requireText(
  workflow,
  `canonical-tests:\n    runs-on: ubuntu-latest\n    timeout-minutes: 30`,
  "Canonical CI job timeout must remain bounded",
);
requireText(
  workflow,
  `- name: Runtime operability tests\n        timeout-minutes: 15\n        run: npm run test:operability`,
  "operability workflow timeout must remain bounded",
);
requireText(
  workflow,
  `- name: Automated golden-path E2E\n        timeout-minutes: 10\n        run: npm run test:e2e`,
  "E2E workflow timeout must remain bounded",
);

assert.doesNotMatch(
  canonicalSuite,
  /\bspawnSync\s*\(/,
  "the canonical suite must not restore an unbounded spawnSync child wait",
);
requireText(
  canonicalSuite,
  `runCanonicalChild,`,
  "canonical children must use the bounded runner",
);
requireText(
  canonicalSuite,
  `scripts/test-canonical-child-runner.mjs`,
  "bounded child lifecycle regression must remain authoritative",
);
requireText(
  canonicalSuite,
  `scripts/test-canonical-ci-contract.mjs`,
  "CI contract regression must remain in the authority suite",
);
for (const [pathName, timeout] of [
  ["scripts/test-runtime-database-bootstrap.mjs", "120_000"],
  ["scripts/test-runtime-operability.mjs", "120_000"],
  ["scripts/test-runtime-reconciliation.mjs", "180_000"],
  ["scripts/browser-validate-vnext-task-context-packet-handoff-v0-1.mjs", "480_000"],
]) {
  const escapedPath = pathName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(
    canonicalSuite,
    new RegExp(`${escapedPath}\\"\\),\\n\\s+timeoutMs: ${timeout}`),
    `${pathName} must keep its measured canonical timeout`,
  );
}

for (const fragment of [
  `DEFAULT_CANONICAL_CHILD_TIMEOUT_MS = 300_000`,
  `DEFAULT_CANONICAL_HEARTBEAT_MS = 30_000`,
  `terminateOwnedProcessTree(record`,
  `child_start label=`,
  `child_active label=`,
  `child_result label=`,
]) {
  requireText(
    canonicalRunner,
    fragment,
    `canonical child runner contract is missing: ${fragment}`,
  );
}

for (const fragment of [
  `registerOwnedChild`,
  `terminateOwnedProcessTree`,
  `cleanupOwnedProcesses`,
  `closeTrackedServer`,
  `taskkill`,
  `SIGTERM`,
  `SIGKILL`,
]) {
  requireText(
    processLifecycle,
    fragment,
    `owned process lifecycle contract is missing: ${fragment}`,
  );
}

for (const fragment of [
  `### Canonical CI lifecycle`,
  `must use the repository's bounded test-harness lifecycle`,
  `Only a completed successful Canonical CI run for the current pull-request head is merge evidence.`,
  `Do not repeatedly rerun a nonterminal CI job.`,
  `Never widen a timeout merely to conceal a hang.`,
]) {
  requireText(
    agents,
    fragment,
    `AGENTS.md canonical CI instruction is missing: ${fragment}`,
  );
}

console.log(
  JSON.stringify(
    {
      test: "canonical-ci-contract",
      status: "pass",
      superseded_runs_cancelled: true,
      current_head_success_required: true,
      workflow_job_timeout_minutes: 30,
      workflow_operability_timeout_minutes: 15,
      workflow_e2e_timeout_minutes: 10,
      bounded_runner_required: true,
      child_heartbeat_required: true,
      process_tree_cleanup_required: true,
      authority_regressions_required: [
        "canonical-child-runner",
        "canonical-ci-contract",
      ],
    },
    null,
    2,
  ),
);

function readRepositoryFile(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function requireText(source, fragment, message) {
  assert.equal(source.includes(fragment), true, message);
}
