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
const canonicalEnvironment = readRepositoryFile(
  "scripts/canonical-test-environment.mjs",
);
const canonicalRunnerContract = readRepositoryFile(
  "scripts/test-canonical-child-runner.mjs",
);
const browserE2e = readRepositoryFile(
  "scripts/browser-validate-vnext-native-host-result-v0-1.mjs",
);
const operatorSmoke = readRepositoryFile(
  "scripts/smoke-vnext-operator-pilot-v0-1.ts",
);
const operatorPureContracts = readRepositoryFile(
  "scripts/test-vnext-operator-pure-contracts-v0-1.ts",
);
const fixtureBuilder = readRepositoryFile(
  "scripts/vnext-operator-browser-fixture-builder-v0-1.ts",
);
const fixtureBuilderContract = readRepositoryFile(
  "scripts/test-vnext-operator-browser-fixture-v0-1.ts",
);
const zeroNetworkGuard = readRepositoryFile(
  "scripts/test-harness-zero-network-guard.mjs",
);
const packageJson = JSON.parse(readRepositoryFile("package.json"));
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
  `runCanonicalChildGroups,`,
  "integration concurrency must use the bounded canonical group runner",
);
requireText(
  canonicalSuite,
  `maxConcurrency: 2`,
  "integration concurrency must retain its measured two-lane bound",
);
for (const groupId of ["operator-process", "supporting-serial"]) {
  requireText(
    canonicalSuite,
    `{ id: "${groupId}", children:`,
    `integration group ownership is missing: ${groupId}`,
  );
}
const integrationChildren = [
  "project-verify-material",
  "project-controls",
  "policy-triggered-model-run",
  "project-home",
  "project-onboarding",
  "project-identity",
  "mcp-adapter-runtime",
  "cross-session-read",
  "durable-semantic-loop",
  "operator-pilot",
  "portable-export",
];
for (const childId of integrationChildren) {
  assert.equal(
    countOccurrences(canonicalSuite, `id: "${childId}"`),
    1,
    `integration child must have exactly one owner: ${childId}`,
  );
}
for (const requirement of [
  "pure-deterministic",
  "database",
  "migrations",
  "backup-restore",
  "filesystem",
  "git-worktree",
  "process-owning",
  "listener-port-owning",
  "mutable-module-state",
  "filesystem-fixture-consumer",
]) {
  requireText(
    canonicalSuite,
    `"${requirement}"`,
    `integration requirement inventory is missing: ${requirement}`,
  );
}
for (const variable of [
  "HOME",
  "USERPROFILE",
  "TMPDIR",
  "TMP",
  "TEMP",
  "AUGNES_CANONICAL_TEMP_ROOT",
  "AUGNES_DB_PATH",
  "AUGNES_RUNTIME_STATE_DIR",
]) {
  requireText(
    canonicalEnvironment,
    `environment.${variable}`,
    `canonical child resource isolation is missing: ${variable}`,
  );
}
requireText(
  canonicalSuite,
  `new Set(preparedSteps.map((step) => step.resourceRoot)).size`,
  "canonical children must fail closed on duplicate resource ownership",
);
requireText(
  canonicalSuite,
  `const temporaryRoot = realpathSync(`,
  "canonical child resources must use one canonical OS-temporary identity",
);
for (const fragment of [
  `mkdtempSync(`,
  `ag-c\${String(index + 1).padStart(2, "0")}-`,
  `ownedResourceRoots.push(resourceRoot)`,
  `for (const resourceRoot of ownedResourceRoots)`,
]) {
  requireText(
    canonicalSuite,
    fragment,
    `short child-owned OS-temporary lifecycle is missing: ${fragment}`,
  );
}
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
  ["scripts/test-vnext-operator-pure-contracts-v0-1.ts", "30_000"],
  ["scripts/test-vnext-operator-browser-fixture-v0-1.ts", "45_000"],
  ["scripts/smoke-vnext-operator-pilot-v0-1.ts", "780_000"],
  ["scripts/test-runtime-database-bootstrap.mjs", "120_000"],
  ["scripts/test-runtime-operability.mjs", "120_000"],
  ["scripts/test-runtime-reconciliation.mjs", "180_000"],
  ["scripts/test-distributable-package.mjs", "300_000"],
  ["scripts/browser-validate-vnext-native-host-result-v0-1.mjs", "480_000"],
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
  `group_start group=`,
  `group_result group=`,
  `canonical concurrent group failed`,
  `child_result_missing`,
  `child_result_conflicting_label`,
  `child_result_duplicate`,
  `child_result_incomplete`,
  `outcome.value.code !== 0`,
]) {
  requireText(
    canonicalRunner,
    fragment,
    `canonical child runner contract is missing: ${fragment}`,
  );
}

for (const fragment of [
  `concurrent_groups_bounded_and_deterministic`,
  `concurrent_failure_timeout_and_cleanup_fail_closed`,
  `concurrent_incomplete_conflicting_and_duplicate_results_refused`,
  `concurrent-after-failure`,
  `concurrent-after-timeout`,
]) {
  requireText(
    canonicalRunnerContract,
    fragment,
    `concurrent runner failure-mode regression is missing: ${fragment}`,
  );
}

const movedResponsibilities = [
  "live_codex_public_command_summary_redacts_credentials_and_absolute_paths",
  "live_codex_public_command_summary_preserves_safe_relative_commands",
  "retired_native_host_transport_modules_and_routes_are_absent",
  "production_graph_has_zero_manual_native_host_copy_or_result_paste_symbols",
  "automatic_native_host_completion_has_one_complete_normalizer_and_receipt_authority",
  "packet_identity_is_absorbed_and_shared_inspector_is_read_only",
  "package_and_canonical_graph_have_no_retired_manual_aliases",
  "project_home_refresh_exact_projection_replay_is_idempotent",
  "project_home_refresh_distinguishes_repeated_approval_revisions_in_one_run",
  "project_home_refresh_terminal_and_paused_boundaries_refresh_once",
  "project_home_refresh_history_is_fifo_bounded",
  "static_refresh_resubmit_and_credential_safety_markers_present",
];
for (const responsibility of movedResponsibilities) {
  assert.equal(
    operatorSmoke.includes(responsibility),
    false,
    `moved pure responsibility must not remain in operator smoke: ${responsibility}`,
  );
  assert.equal(
    countOccurrences(
      operatorPureContracts,
      `record("${responsibility}")`,
    ),
    1,
    `moved pure responsibility must execute exactly once: ${responsibility}`,
  );
}
assert.equal(
  countOccurrences(
    canonicalSuite,
    `scripts/test-vnext-operator-pure-contracts-v0-1.ts`,
  ),
  1,
  "the pure responsibility contract must run exactly once in the canonical unit surface",
);

requireText(
  browserE2e,
  `scripts/build-vnext-operator-browser-fixture-v0-1.ts`,
  "E2E must use the deterministic fixture builder",
);
requireText(
  browserE2e,
  `fixture_generation_duration_ms`,
  "E2E must report fixture-generation duration separately",
);
const liveCompletionBarrier = browserE2e.indexOf(
  `await waitForLiveRunStatus(\n      manifest.project_id,\n      "completed",`,
);
const liveReceiptDomCheck = browserE2e.indexOf(
  `[data-live-host-status="completed"] [data-live-host-receipt="persisted"]`,
);
assert(
  liveCompletionBarrier >= 0 && liveCompletionBarrier < liveReceiptDomCheck,
  "E2E must await durable live-host completion before asserting the terminal receipt DOM",
);
assert.doesNotMatch(
  browserE2e,
  /smoke-vnext-operator-pilot-v0-1|AUGNES_VNEXT_OPERATOR_PILOT_BROWSER_FIXTURE_DIR/u,
  "E2E must not rerun the broad operator smoke to create its fixture",
);
assert.doesNotMatch(
  operatorSmoke,
  /AUGNES_VNEXT_OPERATOR_PILOT_BROWSER_FIXTURE_DIR|browser_fixture_export/u,
  "operator integration must no longer own the E2E fixture export mode",
);
for (const fragment of [
  `deterministic_production_fixture`,
  `artifact_ownership: "transferred_to_browser_harness"`,
  `persisted_lineage_status: "packet_compiled"`,
  `credential_material_included: false`,
  `external_network_calls: externalNetworkCalls`,
  `provider_calls: providerCalls`,
  `default_database_accessed: ambientDatabaseObservation.accessed`,
  `ambient_database_observation: "absent_before_and_after"`,
  `installZeroNetworkGuard({`,
  `networkGuard.attempts.length`,
  `assertAmbientDatabaseUnchanged(`,
  `networkGuard.restore()`,
  `assertDisposableOutputDirectory`,
  `validateVNextOperatorBrowserFixtureV01`,
]) {
  requireText(
    fixtureBuilder,
    fragment,
    `fixture builder contract is missing: ${fragment}`,
  );
}
for (const [source, owner] of [
  [fixtureBuilder, "fixture builder"],
  [operatorSmoke, "operator smoke"],
]) {
  requireText(
    source,
    `./test-harness-zero-network-guard.mjs`,
    `${owner} must reuse the repository-owned zero-network guard`,
  );
}
assert.doesNotMatch(
  fixtureBuilder,
  /LiveNativeHostRunServiceV01|createCodexAppServerAdapterV01|openai|anthropic|provider.*transport/iu,
  "fixture construction must not introduce a live host or provider transport",
);
assert.doesNotMatch(
  fixtureBuilder,
  /external_network_calls:\s*0|provider_calls:\s*0|default_database_accessed:\s*false/u,
  "fixture egress and default-database claims must be derived from observations",
);
for (const fragment of [
  `const attempt = Object.freeze({ method: label })`,
  `attempts.push(attempt)`,
  `error.code = "test_external_network_forbidden"`,
  `allowLoopback && isExactLoopbackCall`,
  `restores.reverse().forEach`,
  `"fetch"`,
  `"http.request"`,
  `"https.request"`,
  `"net.connect"`,
  `"tls.connect"`,
  `"dns.lookup"`,
  `"dns.promises.lookup"`,
]) {
  requireText(
    zeroNetworkGuard,
    fragment,
    `zero-network guard coverage is missing: ${fragment}`,
  );
}
for (const fragment of [
  `zero_network_guard_blocks_and_records_fetch_http_net_and_dns`,
  `fixture_builder_installs_guard_before_production_seams_and_cleans`,
  `fixture_builder_fails_closed_on_ambient_database_access_and_cleans`,
  `fixture_validation_does_not_claim_unobserved_egress_or_database_state`,
  `fixture_validation_fails_closed_on_incomplete_manifest`,
  `fixture_validation_fails_closed_on_conflicting_database_binding`,
  `fixture_builder_refuses_overwrite_and_preserves_existing_artifacts`,
  `fixture_contract_removes_database_manifest_root_and_side_files`,
]) {
  requireText(
    fixtureBuilderContract,
    fragment,
    `fixture builder regression is missing: ${fragment}`,
  );
}
assert.equal(
  packageJson.scripts["test:operator-pure-contracts"],
  "node --import tsx scripts/test-vnext-operator-pure-contracts-v0-1.ts",
);
assert.equal(
  packageJson.scripts["test:operator-browser-fixture"],
  "node --import tsx scripts/test-vnext-operator-browser-fixture-v0-1.ts",
);

for (const fragment of [
  `registerOwnedChild`,
  `terminateOwnedProcessTree`,
  `discoverOwnedProcessGroup`,
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
      integration_concurrency_bound: 2,
      integration_children_uniquely_owned: integrationChildren,
      child_resource_isolation_required: true,
      moved_responsibilities_execute_once: movedResponsibilities,
      broad_operator_smoke_rerun_by_e2e: false,
      deterministic_fixture_builder_required: true,
      live_host_completion_barrier_required: true,
      fixture_network_observations_required: true,
      fixture_ambient_database_sentinel_required: true,
      unobserved_fixture_validation_claims_forbidden: true,
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

function countOccurrences(source, fragment) {
  return source.split(fragment).length - 1;
}
