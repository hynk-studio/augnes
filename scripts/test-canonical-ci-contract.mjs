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
const setupAction = readRepositoryFile(
  ".github/actions/setup-canonical/action.yml",
);
const agents = readRepositoryFile("AGENTS.md");
const canonicalSuite = readRepositoryFile("scripts/run-canonical-test-suite.mjs");
const canonicalRunner = readRepositoryFile("scripts/canonical-child-runner.mjs");
const processLifecycle = readRepositoryFile(
  "scripts/test-harness-process-lifecycle.mjs",
);

requireText(
  workflow,
  `pull_request:\n  push:\n    branches: [main]`,
  "Canonical CI must run for pull requests and pushes to main",
);
requireText(
  workflow,
  `concurrency:\n  group: canonical-ci-\${{ github.workflow }}-\${{ github.event.pull_request.number || github.ref }}\n  cancel-in-progress: true`,
  "Canonical CI must cancel superseded runs for the same PR or ref",
);
requireText(
  workflow,
  `permissions:\n  contents: read`,
  "Canonical CI must retain read-only repository permissions",
);

const requiredExecutionJobs = [
  "static-authority",
  "integration",
  "operability",
  "e2e",
];
const jobs = new Map(
  [...requiredExecutionJobs, "canonical-tests"].map((jobName) => [
    jobName,
    extractYamlBlock(workflow, jobName, 2),
  ]),
);

for (const jobName of requiredExecutionJobs) {
  const job = jobs.get(jobName);
  assert.equal(
    yamlScalar(job, "runs-on"),
    "ubuntu-latest",
    `${jobName} must run on a clean GitHub-hosted Linux runner`,
  );
  assertFiniteTimeout(job, jobName);
  requireText(
    job,
    `uses: actions/checkout@v4`,
    `${jobName} must check out its own clean source tree`,
  );
  requireText(
    job,
    `uses: ./.github/actions/setup-canonical`,
    `${jobName} must perform the repository-owned clean dependency setup`,
  );
}

assert.equal(
  Number(yamlScalar(jobs.get("integration"), "timeout-minutes")),
  20,
  "integration must retain its measured finite workflow bound",
);
assert.equal(
  Number(yamlScalar(jobs.get("operability"), "timeout-minutes")),
  15,
  "operability must retain its bounded workflow timeout",
);
assert.equal(
  Number(yamlScalar(jobs.get("e2e"), "timeout-minutes")),
  10,
  "E2E must retain its bounded workflow timeout",
);

for (const fragment of [
  `using: composite`,
  `uses: actions/setup-node@v4`,
  `node-version: 22`,
  `cache: npm`,
  `package-lock.json`,
  `apps/augnes_apps/package-lock.json`,
  `run: npm ci`,
  `run: npm --prefix apps/augnes_apps ci`,
]) {
  requireText(
    setupAction,
    fragment,
    `canonical setup action is missing: ${fragment}`,
  );
}

const canonicalCommandOwners = new Map([
  ["npm run typecheck", "static-authority"],
  ["npm run build", "static-authority"],
  ["npm test", "static-authority"],
  ["npm run test:authority", "static-authority"],
  ["npm run test:integration", "integration"],
  ["npm run test:operability", "operability"],
  ["npm run test:e2e", "e2e"],
]);

for (const [command, intendedJob] of canonicalCommandOwners) {
  const owners = [...jobs]
    .filter(([, job]) => hasRunCommand(job, command))
    .map(([jobName]) => jobName);
  assert.deepEqual(
    owners,
    [intendedJob],
    `${command} must appear exactly once in ${intendedJob}`,
  );
  assert.equal(
    countRunCommands(workflow, command),
    1,
    `${command} must appear exactly once across the complete workflow`,
  );
}

const aggregator = jobs.get("canonical-tests");
assert.equal(
  yamlScalar(aggregator, "name"),
  "canonical-tests",
  "the stable canonical-tests required-check name must be preserved",
);
assert.equal(
  yamlScalar(aggregator, "if"),
  "always()",
  "the final canonical-tests gate must run after success, failure, or cancellation",
);
assert.deepEqual(
  yamlInlineList(aggregator, "needs").sort(),
  [...requiredExecutionJobs].sort(),
  "the final canonical-tests gate must depend on every required job",
);
assertFiniteTimeout(aggregator, "canonical-tests");
requireText(
  aggregator,
  `set -eu`,
  "the final canonical-tests gate must fail closed on the first unsuccessful dependency",
);
assert.equal(
  [...canonicalCommandOwners].some(([command]) =>
    hasRunCommand(aggregator, command),
  ),
  false,
  "the final canonical-tests gate must not duplicate a canonical suite",
);

for (const [jobName, environmentName] of [
  ["static-authority", "STATIC_AUTHORITY_RESULT"],
  ["integration", "INTEGRATION_RESULT"],
  ["operability", "OPERABILITY_RESULT"],
  ["e2e", "E2E_RESULT"],
]) {
  requireText(
    aggregator,
    `${environmentName}: \${{ needs.${jobName}.result }}`,
    `canonical-tests must read the ${jobName} conclusion`,
  );
  requireText(
    aggregator,
    `test "$${environmentName}" = "success"`,
    `canonical-tests must fail when ${jobName} is not successful`,
  );
}

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
  ["scripts/smoke-vnext-operator-pilot-v0-1.ts", "780_000"],
  ["scripts/test-runtime-database-bootstrap.mjs", "120_000"],
  ["scripts/test-runtime-operability.mjs", "120_000"],
  ["scripts/test-runtime-reconciliation.mjs", "180_000"],
  ["scripts/browser-validate-vnext-task-context-packet-handoff-v0-1.mjs", "480_000"],
]) {
  assertCanonicalChildTimeout(canonicalSuite, pathName, timeout);
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
      required_execution_jobs: requiredExecutionJobs,
      final_required_check: "canonical-tests",
      final_required_check_always_runs: true,
      workflow_job_timeout_minutes: Object.fromEntries(
        [...jobs].map(([jobName, job]) => [
          jobName,
          Number(yamlScalar(job, "timeout-minutes")),
        ]),
      ),
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

function extractYamlBlock(source, key, indentation) {
  const lines = source.split(/\r?\n/);
  const prefix = " ".repeat(indentation);
  const start = lines.findIndex((line) => line === `${prefix}${key}:`);
  assert.notEqual(start, -1, `missing YAML mapping: ${key}`);

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].trim().length === 0) continue;
    const leadingSpaces = lines[index].match(/^ */)[0].length;
    if (leadingSpaces <= indentation) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

function yamlScalar(source, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`^\\s+${escapedKey}:\\s*(.+?)\\s*$`, "m"));
  assert.ok(match, `missing YAML scalar: ${key}`);
  return match[1];
}

function yamlInlineList(source, key) {
  const value = yamlScalar(source, key);
  assert.match(value, /^\[.*\]$/, `${key} must be an inline YAML list`);
  return value
    .slice(1, -1)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function assertFiniteTimeout(job, jobName) {
  const timeout = Number(yamlScalar(job, "timeout-minutes"));
  assert.equal(
    Number.isFinite(timeout) && timeout > 0,
    true,
    `${jobName} must have a finite positive job timeout`,
  );
}

function hasRunCommand(job, command) {
  const escapedCommand = command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s+run:\\s*${escapedCommand}\\s*$`, "m").test(job);
}

function countRunCommands(source, command) {
  const escapedCommand = command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...source.matchAll(new RegExp(`^\\s+run:\\s*${escapedCommand}\\s*$`, "gm"))]
    .length;
}

function assertCanonicalChildTimeout(source, pathName, timeout) {
  const invocation = `\"${pathName}\")`;
  const invocationIndex = source.indexOf(invocation);
  assert.notEqual(invocationIndex, -1, `missing canonical child: ${pathName}`);
  const blockStart = source.lastIndexOf("\n    {", invocationIndex);
  const blockEnd = source.indexOf("\n    },", invocationIndex);
  assert.notEqual(blockStart, -1, `missing canonical child block: ${pathName}`);
  assert.notEqual(blockEnd, -1, `unterminated canonical child block: ${pathName}`);
  requireText(
    source.slice(blockStart, blockEnd),
    `timeoutMs: ${timeout}`,
    `${pathName} must keep its measured canonical timeout`,
  );
}

function requireText(source, fragment, message) {
  assert.equal(source.includes(fragment), true, message);
}
