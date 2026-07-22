#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseCanonicalYaml } from "./canonical-yaml-parser.mjs";

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
const plannerSource = readRepositoryFile("scripts/canonical-change-planner.mjs");
const plannerContract = readRepositoryFile(
  "scripts/test-canonical-change-planner.mjs",
);
const documentationValidator = readRepositoryFile(
  "scripts/validate-canonical-docs-change.mjs",
);
const parsedWorkflow = parseCanonicalYaml(workflow);
const parsedSetupAction = parseCanonicalYaml(setupAction);
const jobs = parsedWorkflow.jobs;
const requiredExecutionJobs = ["static", "integration", "operability", "e2e"];

assert.equal(parsedWorkflow.name, "Canonical CI");
assert.equal(Object.hasOwn(parsedWorkflow.on, "pull_request"), true);
assert.deepEqual(parsedWorkflow.on.push.branches, ["main"]);
assert.equal(
  parsedWorkflow.concurrency.group,
  "canonical-ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}",
);
assert.equal(parsedWorkflow.concurrency["cancel-in-progress"], true);
assert.deepEqual(parsedWorkflow.permissions, { contents: "read" });
assert.deepEqual(
  Object.keys(jobs).sort(),
  [
    "canonical-tests",
    "change-plan",
    "documentation",
    "e2e",
    "integration",
    "operability",
    "static",
  ],
  "Canonical CI must expose only the planner, selected execution graph, and stable aggregator",
);

for (const [jobName, job] of Object.entries(jobs)) {
  assert.equal(
    job["runs-on"],
    "ubuntu-latest",
    `${jobName} must run on a clean GitHub-hosted runner`,
  );
  assertFiniteWorkflowTimeout(job, jobName);
  assert.equal(
    job.steps.some((step) => step.uses === "actions/checkout@v4"),
    jobName !== "canonical-tests",
    `${jobName} checkout ownership is incorrect`,
  );
}

const planJob = jobs["change-plan"];
assert.equal(planJob.steps.at(-1).id, "plan");
assert.match(planJob.steps.at(-1).run, /canonical-change-planner\.mjs/u);
assert.match(planJob.steps.at(-1).run, /--write-github-output true/u);
assert.equal(planJob.steps[0].with["fetch-depth"], 1);
assert.equal(planJob.outputs.plan, "${{ steps.plan.outputs.plan }}");
for (const fragment of [
  `eventName === "push"`,
  `plan: "full-canonical"`,
  `reason: "main_push_always_full"`,
  `eventName !== "pull_request"`,
  `--name-status`,
  `--find-renames=50%`,
  `unsupported canonical diff status`,
  `mode_change:`,
]) {
  requireText(plannerSource, fragment, `planner fail-closed contract is missing: ${fragment}`);
}
for (const regression of [
  "README-only",
  "docs-only",
  "research-only",
  "submission-image-plus-markdown",
  "AGENTS.md",
  "workflow",
  "composite-action",
  "source-file",
  "application-CSS",
  "test-file",
  "migration",
  "package-manifest",
  "nested-lockfile",
  "docs-to-source-rename",
  "documentation-deletion",
  "unknown-path",
  "malformed-or-missing-base-head",
]) {
  requireText(plannerContract, regression, `planner regression is missing: ${regression}`);
}

const documentationJob = jobs.documentation;
assert.equal(
  documentationJob.if,
  "needs.change-plan.outputs.plan == 'documentation-only'",
);
assert.equal(documentationJob.steps[0].with["fetch-depth"], 1);
assert.match(documentationJob.steps.at(-1).run, /validate-canonical-docs-change\.mjs/u);
assert.equal(
  documentationJob.steps.some((step) =>
    String(step.uses ?? "").includes("setup-canonical"),
  ),
  false,
  "documentation-only validation must not install dependency trees",
);
for (const fragment of [
  `["diff", "--check"`,
  `extractMarkdownDestinations`,
  `unresolved relative Markdown link`,
  `unresolved local Markdown anchor`,
  `private absolute filesystem path`,
]) {
  requireText(
    documentationValidator,
    fragment,
    `documentation fast-path validation is missing: ${fragment}`,
  );
}

const expectedMatrices = {
  static: [
    ["typecheck", "npm run typecheck", "root-only"],
    ["build", "npm run build", "root-only"],
    ["unit", "npm test", "root-only"],
    ["authority", "npm run test:authority", "full"],
  ],
  integration: [
    ["operator", "npm run test:integration:operator", "root-only"],
    ["supporting", "npm run test:integration:supporting", "full"],
  ],
  operability: [
    ["fast", "npm run test:operability:fast", "root-only"],
    [
      "recovery-validator",
      "npm run test:operability:recovery-validator",
      "root-only",
    ],
    [
      "recovery-storage",
      "npm run test:operability:recovery-storage",
      "root-only",
    ],
    ["supervisor", "npm run test:operability:supervisor", "root-only"],
    [
      "runtime-reconciliation",
      "npm run test:operability:runtime-reconciliation",
      "root-only",
    ],
    ["package", "npm run test:operability:package", "full"],
  ],
  e2e: [
    ["core", "npm run test:e2e:core", null],
    ["continuity", "npm run test:e2e:continuity", null],
  ],
};

const canonicalCommandOwners = new Map();
for (const [jobName, expectedEntries] of Object.entries(expectedMatrices)) {
  const job = jobs[jobName];
  assert.equal(job.if, "needs.change-plan.outputs.plan == 'full-canonical'");
  assert.equal(job.strategy["fail-fast"], true);
  const entries = job.strategy.matrix.include;
  assert.deepEqual(
    entries.map((entry) => [entry.id, entry.command, entry.setup_profile ?? null]),
    expectedEntries,
    `${jobName} matrix ownership must be exact`,
  );
  for (const entry of entries) {
    assert.equal(
      Number.isFinite(entry.timeout_minutes ?? job["timeout-minutes"]) &&
        (entry.timeout_minutes ?? job["timeout-minutes"]) > 0,
      true,
      `${jobName}/${entry.id} must have a finite timeout`,
    );
    assert.equal(canonicalCommandOwners.has(entry.command), false);
    canonicalCommandOwners.set(entry.command, `${jobName}/${entry.id}`);
  }
  assert.equal(
    job.steps.some((step) => step.uses === "./.github/actions/setup-canonical"),
    true,
  );
}

const operabilityEntries = jobs.operability.strategy.matrix.include;
assert.deepEqual(
  operabilityEntries.map((entry) => [entry.id, entry.fetch_depth]),
  [
    ["fast", 1],
    ["recovery-validator", 1],
    ["recovery-storage", 1],
    ["supervisor", 1],
    ["runtime-reconciliation", 1],
    ["package", 0],
  ],
  "only the package shard may receive complete Git history",
);
assert.equal(countScalarValue(parsedWorkflow, "fetch-depth", 0), 0);
assert.equal(countScalarValue(parsedWorkflow, "fetch_depth", 0), 1);

assert.equal(parsedSetupAction.runs.using, "composite");
assert.equal(parsedSetupAction.inputs.profile.required, true);
const setupSteps = parsedSetupAction.runs.steps;
assert.equal(
  setupSteps.filter((step) => step.uses === "actions/setup-node@v4").length,
  2,
);
assert.equal(
  setupSteps.find((step) => step.name === "Install root-only dependencies").if,
  "inputs.profile == 'root-only'",
);
const fullInstallStep = setupSteps.find(
  (step) => step.name === "Install full dependency trees concurrently",
);
assert.equal(fullInstallStep.if,
  "inputs.profile == 'full'",
);
assert.match(fullInstallStep.run, /npm ci --no-audit --no-fund &/u);
assert.match(
  fullInstallStep.run,
  /npm --prefix apps\/augnes_apps ci --no-audit --no-fund &/u,
);
assert.match(fullInstallStep.run, /wait "\$root_pid" \|\| root_status=\$\?/u);
assert.match(fullInstallStep.run, /wait "\$nested_pid" \|\| nested_status=\$\?/u);
assert.match(fullInstallStep.run, /exit 1/u);

assert.equal(packageJson.scripts["test:integration"], "node scripts/run-canonical-test-suite.mjs integration");
assert.equal(packageJson.scripts["test:operability"], "node scripts/run-canonical-test-suite.mjs operability");
for (const [command, owner] of canonicalCommandOwners) {
  assert.equal(
    [...canonicalCommandOwners.keys()].filter((candidate) => candidate === command).length,
    1,
    `${command} must have one workflow owner (${owner})`,
  );
}

const aggregator = jobs["canonical-tests"];
assert.equal(aggregator.name, "canonical-tests");
assert.equal(aggregator.if, "always()");
assert.deepEqual(aggregator.needs, [
  "change-plan",
  "documentation",
  "static",
  "integration",
  "operability",
  "e2e",
]);
const aggregatorStep = aggregator.steps[0];
const aggregatorScript = aggregatorStep.run;
for (const fragment of [
  `test "$PLAN_RESULT" = "success"`,
  `documentation-only)`,
  `full-canonical)`,
  `test "$DOCUMENTATION_RESULT" = "success"`,
  `test "$DOCUMENTATION_RESULT" = "skipped"`,
  `test "$STATIC_RESULT" = "skipped"`,
  `test "$STATIC_RESULT" = "success"`,
  `test "$INTEGRATION_RESULT" = "success"`,
  `test "$OPERABILITY_RESULT" = "success"`,
  `test "$E2E_RESULT" = "success"`,
  `invalid or missing canonical plan`,
]) {
  requireText(aggregatorScript, fragment, `canonical aggregator is missing: ${fragment}`);
}
assert.doesNotMatch(
  workflow,
  /paths-ignore|continue-on-error|self-hosted|\bsleep\b|\bretry\b/iu,
  "Canonical CI must not hide work behind path filtering, retries, sleeps, or weaker runners",
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
  "project-verify-lifecycle",
  "project-verify-production-lifecycle",
  "project-verify-operator-adapter",
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
  "portable-project-continuity",
];
for (const childId of integrationChildren) {
  assert.equal(
    countOccurrences(canonicalSuite, `id: "${childId}"`),
    1,
    `integration child must have exactly one owner: ${childId}`,
  );
}
const operabilityChildren = [
  ["durable-run-reconciliation", "operability-fast"],
  ["public-recovery-action", "operability-fast"],
  ["recovery-validator", "operability-recovery-validator"],
  ["recovery-backup", "operability-recovery-storage"],
  ["runtime-database-bootstrap", "operability-recovery-storage"],
  ["runtime-supervisor", "operability-supervisor"],
  ["runtime-reconciliation", "operability-runtime-reconciliation"],
  ["distributable-package", "operability-package"],
];
for (const [childId, shardName] of operabilityChildren) {
  assert.equal(
    countOccurrences(canonicalSuite, `id: "${childId}"`),
    1,
    `operability child must have exactly one owner: ${childId}`,
  );
  requireText(
    canonicalSuite,
    `shard: "${shardName}"`,
    `operability child shard is missing: ${childId}`,
  );
}
for (const shardName of [
  "operability-fast",
  "operability-recovery-validator",
  "operability-recovery-storage",
  "operability-supervisor",
  "operability-runtime-reconciliation",
  "operability-package",
]) {
  assert.equal(
    packageJson.scripts[`test:${shardName.replace("operability-", "operability:")}`],
    `node scripts/run-canonical-test-suite.mjs ${shardName}`,
    `focused operability command must own ${shardName}`,
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
  canonicalEnvironment,
  `AUGNES_BROWSER_E2E_SCOPE:`,
  "the split browser scope must be suite-authored rather than ambient",
);
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
  ["scripts/test-recovery-canonical-record-validator.ts", "180_000"],
  ["scripts/test-recovery-backup.mjs", "75_000"],
  ["scripts/test-runtime-database-bootstrap.mjs", "120_000"],
  ["scripts/test-runtime-operability.mjs", "120_000"],
  ["scripts/test-runtime-reconciliation.mjs", "480_000"],
  ["scripts/test-distributable-package.mjs", "480_000"],
  ["scripts/browser-validate-vnext-native-host-result-v0-1.mjs", "480_000"],
]) {
  assertCanonicalChildTimeout(canonicalSuite, pathName, timeout);
}

for (const fragment of [
  `DEFAULT_CANONICAL_CHILD_TIMEOUT_MS = 300_000`,
  `DEFAULT_CANONICAL_HEARTBEAT_MS = 30_000`,
  `terminateOwnedProcessTree(record`,
  `child_start label=`,
  `child_spawn label=`,
  `child_exit label=`,
  `child_cleanup_start label=`,
  `child_cleanup_result label=`,
  `child_active label=`,
  `child_result label=`,
  `group_start group=`,
  `group_result group=`,
  `canonical concurrent group failed`,
  `child_result_missing`,
  `child_result_conflicting_label`,
  `child_result_duplicate`,
  `child_result_incomplete`,
  `settleOwnedProcessAfterExit(record`,
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
  `exited_child_inherited_stream_reaped_without_timeout`,
  `exit-with-inherited-stream`,
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
for (const fragment of [
  `AUGNES_BROWSER_E2E_SCOPE`,
  `RUN_CORE_SCOPE`,
  `RUN_CONTINUITY_SCOPE`,
  `[browser-e2e] phase_start`,
  `[browser-e2e] phase_result`,
  `[browser-e2e] cleanup_start`,
  `[browser-e2e] cleanup_result`,
]) {
  requireText(
    browserE2e,
    fragment,
    `split E2E lifecycle diagnostics are missing: ${fragment}`,
  );
}
for (const [script, command] of [
  ["test:e2e", "node scripts/run-canonical-test-suite.mjs e2e"],
  ["test:e2e:core", "node scripts/run-canonical-test-suite.mjs e2e-core"],
  [
    "test:e2e:continuity",
    "node scripts/run-canonical-test-suite.mjs e2e-continuity",
  ],
]) {
  assert.equal(packageJson.scripts[script], command);
}
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
  `settleOwnedProcessAfterExit`,
  `exitPromise`,
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
        Object.entries(jobs).map(([jobName, job]) => [
          jobName,
          job.strategy?.matrix?.include
            ? Object.fromEntries(
                job.strategy.matrix.include.map((entry) => [
                  entry.id,
                  entry.timeout_minutes ?? job["timeout-minutes"],
                ]),
              )
            : job["timeout-minutes"],
        ]),
      ),
      bounded_runner_required: true,
      child_heartbeat_required: true,
      process_tree_cleanup_required: true,
      integration_concurrency_bound: 2,
      e2e_workflow_lanes: ["core", "continuity"],
      integration_children_uniquely_owned: integrationChildren,
      operability_children_uniquely_owned: operabilityChildren.map(
        ([childId]) => childId,
      ),
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

function assertFiniteWorkflowTimeout(job, jobName) {
  const timeout = job["timeout-minutes"];
  if (Number.isFinite(timeout) && timeout > 0) return;
  assert.equal(
    timeout,
    "${{ matrix.timeout_minutes }}",
    `${jobName} must have a finite timeout or an exact matrix timeout expression`,
  );
  assert.equal(
    job.strategy.matrix.include.every(
      (entry) => Number.isFinite(entry.timeout_minutes) && entry.timeout_minutes > 0,
    ),
    true,
    `${jobName} matrix shards must each declare a finite timeout`,
  );
}

function countScalarValue(value, key, expected) {
  if (Array.isArray(value)) {
    return value.reduce(
      (total, entry) => total + countScalarValue(entry, key, expected),
      0,
    );
  }
  if (!value || typeof value !== "object") return 0;
  let total = Object.hasOwn(value, key) && value[key] === expected ? 1 : 0;
  for (const entryValue of Object.values(value)) {
    total += countScalarValue(entryValue, key, expected);
  }
  return total;
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
