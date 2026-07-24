#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const agents = readRepositoryFile("AGENTS.md");
const readme = readRepositoryFile("README.md");
const localPolicy = readRepositoryFile(
  ".github/LOCAL_CANONICAL_VERIFICATION.md",
);
const pullRequestTemplate = readRepositoryFile(
  ".github/pull_request_template.md",
);
const reductionScope = readRepositoryFile(
  "docs/REPOSITORY_REDUCTION_SCOPE.md",
);
const canonicalSuite = readRepositoryFile(
  "scripts/run-canonical-test-suite.mjs",
);
const canonicalRunner = readRepositoryFile(
  "scripts/canonical-child-runner.mjs",
);
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
const processLifecycle = readRepositoryFile(
  "scripts/test-harness-process-lifecycle.mjs",
);
const plannerSource = readRepositoryFile(
  "scripts/canonical-change-planner.mjs",
);
const plannerContract = readRepositoryFile(
  "scripts/test-canonical-change-planner.mjs",
);
const documentationValidator = readRepositoryFile(
  "scripts/validate-canonical-docs-change.mjs",
);
const packageTest = readRepositoryFile(
  "scripts/test-distributable-package.mjs",
);
const packageJson = JSON.parse(readRepositoryFile("package.json"));

const activeWorkflowFiles = listFiles(".github/workflows").filter((file) =>
  /\.ya?ml$/iu.test(file),
);
assert.deepEqual(
  activeWorkflowFiles,
  [],
  "GitHub Actions workflow files must remain absent",
);
for (const removedPath of [
  ".github/actions/setup-canonical/action.yml",
  ".github/CANONICAL_CI_BREAK_GLASS.md",
  "scripts/test-canonical-ci-contract.mjs",
  "scripts/canonical-yaml-parser.mjs",
]) {
  assert.equal(
    existsSync(path.join(repositoryRoot, removedPath)),
    false,
    `hosted-workflow residue must remain absent: ${removedPath}`,
  );
}

const activePolicySources = {
  "AGENTS.md": agents,
  "README.md": readme,
  ".github/LOCAL_CANONICAL_VERIFICATION.md": localPolicy,
  ".github/pull_request_template.md": pullRequestTemplate,
  "docs/REPOSITORY_REDUCTION_SCOPE.md": reductionScope,
};
for (const [file, source] of Object.entries(activePolicySources)) {
  assert.doesNotMatch(
    source,
    /ubuntu-latest|actions\/checkout|actions\/setup-node|canonical-tests|hosted Canonical CI|post-merge Canonical CI/iu,
    `active policy must not depend on hosted GitHub Actions: ${file}`,
  );
}

for (const fragment of [
  "exact repository identity",
  "exact base SHA",
  "exact head SHA",
  "dirty-worktree status",
  "operating system and architecture",
  "Node and npm versions",
  "root and nested lockfile fingerprints",
  "selected plan",
  "each selected command and result",
  "finite duration",
  "cleanup and remaining-process result",
  "final pass or failure",
  "shared local host",
  "does not provide independent hosted reproduction",
  "GitHub remains source control, pull-request, review, and history infrastructure only",
]) {
  requireText(
    localPolicy,
    fragment,
    `local verification policy is missing required evidence: ${fragment}`,
  );
}
for (const fragment of [
  "Exact base SHA:",
  "Exact head SHA:",
  "Worktree status before verification:",
  "Worktree status after verification:",
  "Operating system and architecture:",
  "Node version:",
  "npm version:",
  "Root `package-lock.json` SHA-256:",
  "Nested `apps/augnes_apps/package-lock.json` SHA-256:",
  "Selected plan and planner command:",
  "Selected commands, results, and finite durations:",
  "Cleanup result:",
  "Remaining owned processes/listeners/runtime state/databases/profiles/temp roots:",
  "Final result: `pass | failure`",
  "no GitHub Actions workflow was invoked",
  "not an independent hosted reproduction",
]) {
  requireText(
    pullRequestTemplate,
    fragment,
    `pull-request template is missing local evidence: ${fragment}`,
  );
}

const canonicalCommands = Object.freeze({
  typecheck: "tsc --noEmit",
  unit: "node scripts/run-canonical-test-suite.mjs unit",
  integration: "node scripts/run-canonical-test-suite.mjs integration",
  integrationOperator:
    "node scripts/run-canonical-test-suite.mjs integration-operator",
  integrationSupporting:
    "node scripts/run-canonical-test-suite.mjs integration-supporting",
  authority: "node scripts/run-canonical-test-suite.mjs authority",
  operability: "node scripts/run-canonical-test-suite.mjs operability",
  operabilityFast:
    "node scripts/run-canonical-test-suite.mjs operability-fast",
  operabilityRecoveryValidator:
    "node scripts/run-canonical-test-suite.mjs operability-recovery-validator",
  operabilityRecoveryStorage:
    "node scripts/run-canonical-test-suite.mjs operability-recovery-storage",
  operabilitySupervisor:
    "node scripts/run-canonical-test-suite.mjs operability-supervisor",
  operabilityRuntimeReconciliation:
    "node scripts/run-canonical-test-suite.mjs operability-runtime-reconciliation",
  operabilityPackage:
    "node scripts/run-canonical-test-suite.mjs operability-package",
  e2e: "node scripts/run-canonical-test-suite.mjs e2e",
  e2eCore: "node scripts/run-canonical-test-suite.mjs e2e-core",
  e2eContinuity:
    "node scripts/run-canonical-test-suite.mjs e2e-continuity",
  contract:
    "node scripts/test-local-canonical-verification-contract.mjs",
});
assert.equal(packageJson.scripts.typecheck, canonicalCommands.typecheck);
assert.equal(packageJson.scripts.test, canonicalCommands.unit);
assert.equal(
  packageJson.scripts["test:integration"],
  canonicalCommands.integration,
);
assert.equal(
  packageJson.scripts["test:integration:operator"],
  canonicalCommands.integrationOperator,
);
assert.equal(
  packageJson.scripts["test:integration:supporting"],
  canonicalCommands.integrationSupporting,
);
assert.equal(
  packageJson.scripts["test:authority"],
  canonicalCommands.authority,
);
assert.equal(
  packageJson.scripts["test:operability"],
  canonicalCommands.operability,
);
assert.equal(
  packageJson.scripts["test:operability:fast"],
  canonicalCommands.operabilityFast,
);
assert.equal(
  packageJson.scripts["test:operability:recovery-validator"],
  canonicalCommands.operabilityRecoveryValidator,
);
assert.equal(
  packageJson.scripts["test:operability:recovery-storage"],
  canonicalCommands.operabilityRecoveryStorage,
);
assert.equal(
  packageJson.scripts["test:operability:supervisor"],
  canonicalCommands.operabilitySupervisor,
);
assert.equal(
  packageJson.scripts["test:operability:runtime-reconciliation"],
  canonicalCommands.operabilityRuntimeReconciliation,
);
assert.equal(
  packageJson.scripts["test:operability:package"],
  canonicalCommands.operabilityPackage,
);
assert.equal(packageJson.scripts["test:e2e"], canonicalCommands.e2e);
assert.equal(
  packageJson.scripts["test:e2e:core"],
  canonicalCommands.e2eCore,
);
assert.equal(
  packageJson.scripts["test:e2e:continuity"],
  canonicalCommands.e2eContinuity,
);
assert.equal(
  packageJson.scripts["test:canonical-contract"],
  canonicalCommands.contract,
);

for (const command of [
  "npm run typecheck",
  "npm run build",
  "npm test",
  "npm run test:authority",
  "npm run test:integration",
  "npm run test:operability",
  "npm run test:e2e:core",
  "npm run test:e2e:continuity",
]) {
  requireText(readme, `\`${command}\``, `README is missing ${command}`);
  requireText(localPolicy, command, `policy is missing ${command}`);
}

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
  requireText(
    plannerSource,
    fragment,
    `planner fail-closed contract is missing: ${fragment}`,
  );
}
assert.doesNotMatch(
  plannerSource,
  /GITHUB_OUTPUT|write-github-output|appendFileSync/u,
  "the local planner must not contain workflow-output behavior",
);
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
  requireText(
    plannerContract,
    regression,
    `planner regression is missing: ${regression}`,
  );
}
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

assert.doesNotMatch(
  canonicalSuite,
  /\bspawnSync\s*\(/u,
  "the canonical suite must not restore an unbounded spawnSync child wait",
);
for (const fragment of [
  `runCanonicalChild,`,
  `runCanonicalChildGroups,`,
  `maxConcurrency: 2`,
  `{ id: "operator-process", children:`,
  `{ id: "supporting-serial", children:`,
  `new Set(preparedSteps.map((step) => step.resourceRoot)).size`,
  `const temporaryRoot = realpathSync(`,
  `mkdtempSync(`,
  `ownedResourceRoots.push(resourceRoot)`,
  `for (const resourceRoot of ownedResourceRoots)`,
  `scripts/test-canonical-child-runner.mjs`,
  `scripts/test-local-canonical-verification-contract.mjs`,
]) {
  requireText(
    canonicalSuite,
    fragment,
    `canonical suite guardrail is missing: ${fragment}`,
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
assert.equal(
  countOccurrences(canonicalSuite, `"nested-app-runtime"`),
  4,
  "nested application runtime ownership must remain explicit",
);

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
  "browser scope must be suite-authored rather than ambient",
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
]) {
  requireText(
    canonicalRunnerContract,
    fragment,
    `runner failure-mode regression is missing: ${fragment}`,
  );
}
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
    `moved pure responsibility remains in operator smoke: ${responsibility}`,
  );
  assert.equal(
    countOccurrences(operatorPureContracts, `record("${responsibility}")`),
    1,
    `moved pure responsibility must execute once: ${responsibility}`,
  );
}
assert.equal(
  countOccurrences(
    canonicalSuite,
    `scripts/test-vnext-operator-pure-contracts-v0-1.ts`,
  ),
  1,
  "pure responsibility contract must run once",
);

for (const fragment of [
  `scripts/build-vnext-operator-browser-fixture-v0-1.ts`,
  `fixture_generation_duration_ms`,
  `AUGNES_BROWSER_E2E_SCOPE`,
  `RUN_CORE_SCOPE`,
  `RUN_CONTINUITY_SCOPE`,
  `[browser-e2e] phase_start`,
  `[browser-e2e] phase_result`,
  `[browser-e2e] cleanup_start`,
  `[browser-e2e] cleanup_result`,
]) {
  requireText(browserE2e, fragment, `browser E2E contract is missing: ${fragment}`);
}
assert.doesNotMatch(
  browserE2e,
  /smoke-vnext-operator-pilot-v0-1|AUGNES_VNEXT_OPERATOR_PILOT_BROWSER_FIXTURE_DIR/u,
  "E2E must not rerun broad operator smoke",
);
assert.doesNotMatch(
  operatorSmoke,
  /AUGNES_VNEXT_OPERATOR_PILOT_BROWSER_FIXTURE_DIR|browser_fixture_export/u,
  "operator integration must not own browser fixture export",
);

for (const fragment of [
  `deterministic_production_fixture`,
  `credential_material_included: false`,
  `external_network_calls: externalNetworkCalls`,
  `provider_calls: providerCalls`,
  `default_database_accessed: ambientDatabaseObservation.accessed`,
  `installZeroNetworkGuard({`,
  `networkGuard.attempts.length`,
  `assertAmbientDatabaseUnchanged(`,
  `networkGuard.restore()`,
  `assertDisposableOutputDirectory`,
]) {
  requireText(
    fixtureBuilder,
    fragment,
    `fixture builder contract is missing: ${fragment}`,
  );
}
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

for (const fragment of [
  `MERGED_R8A_COMMIT`,
  `git`,
  `cat-file`,
  `merged #1118 commit is unavailable locally`,
]) {
  requireText(
    packageTest,
    fragment,
    `package-history requirement is missing: ${fragment}`,
  );
}

for (const fragment of [
  `### Local Canonical verification lifecycle`,
  `must use the repository's bounded test-harness lifecycle`,
  `exact pull-request head`,
  `Do not add automatic retries, arbitrary sleeps, or wider timeouts`,
  `GitHub Actions execution must remain absent`,
]) {
  requireText(
    agents,
    fragment,
    `AGENTS.md local verification instruction is missing: ${fragment}`,
  );
}

console.log(
  JSON.stringify(
    {
      test: "local-canonical-verification-contract",
      status: "pass",
      active_github_actions_workflow_files: activeWorkflowFiles,
      local_deciding_evidence_required: true,
      bounded_runner_required: true,
      child_heartbeat_required: true,
      process_tree_cleanup_required: true,
      integration_concurrency_bound: 2,
      browser_lanes_must_run_sequentially_on_shared_host: true,
      integration_children_uniquely_owned: integrationChildren,
      operability_children_uniquely_owned: operabilityChildren.map(
        ([childId]) => childId,
      ),
      child_resource_isolation_required: true,
      zero_network_guard_required: true,
      package_history_required: true,
      local_execution_limitations_must_be_recorded: true,
      authority_regressions_required: [
        "canonical-child-runner",
        "local-canonical-verification-contract",
      ],
    },
    null,
    2,
  ),
);

function readRepositoryFile(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function listFiles(relativeDirectory) {
  const root = path.join(repositoryRoot, relativeDirectory);
  if (!existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile() || statSync(absolutePath).isFile()) {
        files.push(path.relative(repositoryRoot, absolutePath));
      }
    }
  };
  visit(root);
  return files.sort();
}

function assertCanonicalChildTimeout(source, pathName, timeout) {
  const invocation = `\"${pathName}\")`;
  const invocationIndex = source.indexOf(invocation);
  assert.notEqual(invocationIndex, -1, `missing canonical child: ${pathName}`);
  const blockStart = source.lastIndexOf("\n    {", invocationIndex);
  const blockEnd = source.indexOf("\n    },", invocationIndex);
  assert.notEqual(blockStart, -1, `missing canonical child block: ${pathName}`);
  assert.notEqual(blockEnd, -1, `unterminated canonical child: ${pathName}`);
  requireText(
    source.slice(blockStart, blockEnd),
    `timeoutMs: ${timeout}`,
    `${pathName} must keep its measured timeout`,
  );
}

function requireText(source, fragment, message) {
  assert.equal(source.includes(fragment), true, message);
}

function countOccurrences(source, needle) {
  return source.split(needle).length - 1;
}
