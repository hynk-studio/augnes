#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildRuntimeOperabilityCanonicalSteps,
  createRuntimeOperabilityContext,
} from "./runtime-operability-ownership.mjs";

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
const runtimeOperabilityOwnership = readRepositoryFile(
  "scripts/runtime-operability-ownership.mjs",
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
const browserE2e = [
  "scripts/browser-validate-project-experience-v1.mjs",
  "scripts/browser-validate-operator-review-control-v1.mjs",
  "scripts/browser-validate-operator-native-host-execution-v1.mjs",
  "scripts/browser-validate-operator-multi-candidate-v1.mjs",
  "scripts/browser-validate-continuity-v1.mjs",
  "scripts/browser-validate-cross-boundary-golden-v1.mjs",
  "scripts/operator-execution-browser-lifecycle-v1.mjs",
].map(readRepositoryFile).join("\n");
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
const localExecutor = readRepositoryFile(
  "scripts/run-local-canonical-verification.mjs",
);
const localEnvironment = readRepositoryFile(
  "scripts/local-canonical-environment.mjs",
);
const repositoryIdentity = readRepositoryFile(
  "scripts/canonical-repository-identity.mjs",
);
const localReceipt = readRepositoryFile(
  "scripts/local-canonical-receipt.mjs",
);
const localExecutorContract = readRepositoryFile(
  "scripts/test-local-canonical-executor.mjs",
);
const localReceiptContract = readRepositoryFile(
  "scripts/test-local-canonical-receipt.mjs",
);
const localPrEvidencePolicy = readRepositoryFile(
  ".github/LOCAL_CANONICAL_PR_EVIDENCE.md",
);
const localPrEvidence = readRepositoryFile(
  "scripts/local-canonical-pr-evidence.mjs",
);
const localPrEvidenceEnvelope = readRepositoryFile(
  "scripts/local-canonical-pr-evidence-envelope.mjs",
);
const localPrEvidenceTransport = readRepositoryFile(
  "scripts/local-canonical-github-transport.mjs",
);
const localPrEvidenceContract = readRepositoryFile(
  "scripts/test-local-canonical-pr-evidence.mjs",
);
const localPrEvidenceTransportContract = readRepositoryFile(
  "scripts/test-local-canonical-pr-evidence-transport.mjs",
);
const dependencyLockCompatibility = readRepositoryFile(
  "scripts/dependency-lock-compatibility.mjs",
);
const dependencyLockCompatibilityContract = readRepositoryFile(
  "scripts/test-dependency-lock-compatibility.mjs",
);
const gitignore = readRepositoryFile(".gitignore");
const tsconfig = JSON.parse(readRepositoryFile("tsconfig.json"));
const nodeVersionMarker = readRepositoryFile(".node-version").trim();
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
  ".github/LOCAL_CANONICAL_PR_EVIDENCE.md": localPrEvidencePolicy,
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
  typegen: "next typegen",
  typecheck: "npm run typegen && tsc --noEmit",
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
  e2eProjectExperience:
    "node scripts/run-canonical-test-suite.mjs e2e-project-experience",
  e2eOperatorExecution:
    "node scripts/run-canonical-test-suite.mjs e2e-operator-execution",
  e2eContinuity:
    "node scripts/run-canonical-test-suite.mjs e2e-continuity",
  e2eGolden: "node scripts/run-canonical-test-suite.mjs e2e-golden",
  contract:
    "node scripts/test-local-canonical-verification-contract.mjs",
  localExecutorContract:
    "node scripts/test-local-canonical-executor.mjs",
  localReceiptContract:
    "node scripts/test-local-canonical-receipt.mjs",
  dependencyLockCompatibilityContract:
    "node scripts/test-dependency-lock-compatibility.mjs",
  localQuick: "node scripts/run-local-canonical-verification.mjs quick",
  localChanged: "node scripts/run-local-canonical-verification.mjs changed",
  localFull: "node scripts/run-local-canonical-verification.mjs full",
  localReceiptValidation:
    "node scripts/run-local-canonical-verification.mjs validate",
  localEvidenceContract:
    "node scripts/test-local-canonical-pr-evidence.mjs",
  localEvidenceTransportContract:
    "node scripts/test-local-canonical-pr-evidence-transport.mjs",
  localEvidencePrepare:
    "node scripts/local-canonical-pr-evidence.mjs prepare",
  localEvidencePublish:
    "node scripts/local-canonical-pr-evidence.mjs publish",
  localEvidenceVerify:
    "node scripts/local-canonical-pr-evidence.mjs verify",
});
assert.equal(packageJson.scripts.typegen, canonicalCommands.typegen);
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
  packageJson.scripts["test:e2e:project-experience"],
  canonicalCommands.e2eProjectExperience,
);
assert.equal(
  packageJson.scripts["test:e2e:operator-execution"],
  canonicalCommands.e2eOperatorExecution,
);
assert.equal(
  packageJson.scripts["test:e2e:continuity"],
  canonicalCommands.e2eContinuity,
);
assert.equal(packageJson.scripts["test:e2e:golden"], canonicalCommands.e2eGolden);
assert.equal(
  packageJson.scripts["test:canonical-contract"],
  canonicalCommands.contract,
);
assert.equal(
  packageJson.scripts["test:local-canonical-executor"],
  canonicalCommands.localExecutorContract,
);
assert.equal(
  packageJson.scripts["test:local-canonical-receipt"],
  canonicalCommands.localReceiptContract,
);
assert.equal(
  packageJson.scripts["test:dependency-lock-compatibility"],
  canonicalCommands.dependencyLockCompatibilityContract,
);
assert.equal(
  packageJson.scripts["verify:local:quick"],
  canonicalCommands.localQuick,
);
assert.equal(
  packageJson.scripts["verify:local:changed"],
  canonicalCommands.localChanged,
);
assert.equal(
  packageJson.scripts["verify:local:full"],
  canonicalCommands.localFull,
);
assert.equal(
  packageJson.scripts["verify:local:receipt"],
  canonicalCommands.localReceiptValidation,
);
assert.equal(
  packageJson.scripts["test:local-canonical-pr-evidence"],
  canonicalCommands.localEvidenceContract,
);
assert.equal(
  packageJson.scripts["test:local-canonical-pr-evidence-transport"],
  canonicalCommands.localEvidenceTransportContract,
);
assert.equal(
  packageJson.scripts["verify:local:evidence:prepare"],
  canonicalCommands.localEvidencePrepare,
);
assert.equal(
  packageJson.scripts["verify:local:evidence:publish"],
  canonicalCommands.localEvidencePublish,
);
assert.equal(
  packageJson.scripts["verify:local:evidence:verify"],
  canonicalCommands.localEvidenceVerify,
);
assert.equal(nodeVersionMarker, "24.18.0");
assert.equal(packageJson.engines.node, "^22.0.0 || ^24.0.0");
assert.equal(packageJson.engines.npm, ">=10 <12");
assert.match(gitignore, /^\/next-env\.d\.ts$/mu);
assert.equal(
  spawnSync("git", ["ls-files", "--error-unmatch", "next-env.d.ts"], {
    cwd: repositoryRoot,
    stdio: "ignore",
  }).status,
  1,
);
for (const generatedTypeInclude of [
  "next-env.d.ts",
  ".next/types/**/*.ts",
  ".next/dev/types/**/*.ts",
]) {
  assert.equal(tsconfig.include.includes(generatedTypeInclude), true);
}

for (const command of [
  "npm run typecheck",
  "npm run build",
  "npm test",
  "npm run test:authority",
  "npm run test:integration",
  "npm run test:operability",
  "npm run test:e2e:project-experience",
  "npm run test:e2e:operator-execution",
  "npm run test:e2e:continuity",
  "npm run test:e2e:golden",
  "npm run test:e2e",
]) {
  requireText(readme, `\`${command}\``, `README is missing ${command}`);
  requireText(localPolicy, command, `policy is missing ${command}`);
}
for (const command of [
  "npm run verify:local:quick",
  "npm run verify:local:changed --",
  "npm run verify:local:full --",
  "npm run verify:local:receipt --",
]) {
  requireText(readme, command, `README is missing ${command}`);
  requireText(localPolicy, command, `policy is missing ${command}`);
}
for (const command of [
  "npm run verify:local:evidence:prepare --",
  "npm run verify:local:evidence:publish --",
  "npm run verify:local:evidence:verify --",
]) {
  requireText(readme, command, `README is missing ${command}`);
  requireText(localPolicy, command, `policy is missing ${command}`);
  requireText(localPrEvidencePolicy, command, `evidence policy is missing ${command}`);
}

for (const fragment of [
  `WINDOWS_AUTHORIZED_REPOSITORY_ROOT_ENV =`,
  `"AUGNES_CANONICAL_WINDOWS_REPOSITORY_ROOT"`,
  `process.env[WINDOWS_AUTHORIZED_REPOSITORY_ROOT_ENV] ?? ""`,
  `AUTHORIZED_REPOSITORY_ID =`,
  `AUTHORIZED_ORIGIN_URL =`,
  `matchCanonicalRepositoryIdentity`,
  `CANONICAL_NODE_VERSION = "24.18.0"`,
  `CANONICAL_NODE_COMPATIBILITY = "^22.0.0 || ^24.0.0"`,
  `missing_\${safeLabel(label)}_commit`,
  `ensureBoundedLocalDirectory`,
  `unsafe_local_artifact_directory`,
]) {
  requireText(
    localEnvironment,
    fragment,
    `local environment identity contract is missing: ${fragment}`,
  );
}
for (const fragment of [
  `"/Users/hynk/code/augnes"`,
  `"hynk-studio/augnes"`,
  `"https://github.com/hynk-studio/augnes.git"`,
  `unauthorized_repository_root`,
  `unauthorized_repository_origin`,
]) {
  requireText(
    repositoryIdentity,
    fragment,
    `canonical repository identity contract is missing: ${fragment}`,
  );
}
assert.doesNotMatch(
  localEnvironment,
  /IOPlatformUUID|system_profiler|ioreg|serial number|os\.hostname|os\.userInfo/iu,
  "machine fingerprint must not derive from private host identity",
);

for (const fragment of [
  `export const QUICK_PHASE_IDS`,
  `export const OPERATING_POLICY_PHASE_IDS`,
  `export const FULL_PHASE_IDS`,
  `export const RESOURCE_EXCLUSIVE_PHASE_IDS`,
  `"dependencies-root"`,
  `"dependencies-nested"`,
  `"typecheck"`,
  `"build"`,
  `"unit"`,
  `"authority"`,
  `"integration"`,
  `"operability"`,
  `"e2e-project-experience"`,
  `"e2e-operator-review-control"`,
  `"e2e-operator-native-host-execution"`,
  `"e2e-operator-multi-candidate"`,
  `"e2e-continuity"`,
  `"e2e-golden"`,
  `mode === "quick"`,
  `quick_dirty_feedback_only`,
  `deciding_mode_requires_clean_worktree`,
  `identityBefore.head_sha !== headSha`,
  `intended_head_mismatch`,
  `planner_failure_requires_full_canonical`,
  `documentation-validator`,
  `operating-policy-validator`,
  `operating-policy-planner-contract`,
  `operating-policy-executor-contract`,
  `operating-policy-receipt-contract`,
  `operating-policy-verification-contract`,
  `operating_policy_only_no_dependency_install`,
  `runPhasesSequentially`,
  `for (const phase of phases)`,
  `canonical_node_mismatch`,
  `npmPhase(`,
  `["ci", "--no-audit", "--no-fund"]`,
  `generatedNextRoot`,
  `removed_before_execution`,
  `removed_after_execution`,
  `MAX_PHASE_LOG_BYTES = 2 * 1024 * 1024`,
  `RECEIPT_RETENTION = 20`,
  `LOG_RUN_RETENTION = 5`,
  `buildLocalPhaseEnvironment`,
  `CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST`,
  `scripts/canonical-repository-identity.mjs`,
  `writeReceipt`,
  `validateReceiptAgainstCurrentRepository`,
  `isPostExecutionIdentityValid`,
]) {
  requireText(
    localExecutor,
    fragment,
    `local executor contract is missing: ${fragment}`,
  );
}
assert.doesNotMatch(
  localExecutor,
  /next-env\.d\.ts/u,
  "the local executor must not mask generated next-env state",
);

for (const fragment of [
  `ROOT_DEPENDENCY_BEARING_FIELDS`,
  `"dependencies"`,
  `"devDependencies"`,
  `"optionalDependencies"`,
  `"peerDependencies"`,
  `"peerDependenciesMeta"`,
  `"bundledDependencies"`,
  `"bundleDependencies"`,
  `"workspaces"`,
  `Object.hasOwn(rootPackage, field)`,
]) {
  requireText(
    dependencyLockCompatibility,
    fragment,
    `dependency-lock normalizer is missing: ${fragment}`,
  );
}
for (const fragment of [
  `root_version_ignored`,
  `root_engines_addition_and_change_ignored`,
  `root_package_manager_policy_ignored`,
  `root_dependency_declarations_exact`,
  `transitive_package_entries_exact`,
  `resolved_and_integrity_material_exact`,
  `deleted_package_entries_refused`,
  `nested_lock_compatibility_protected`,
]) {
  requireText(
    dependencyLockCompatibilityContract,
    fragment,
    `dependency-lock regression is missing: ${fragment}`,
  );
}
assert.doesNotMatch(
  localExecutor,
  /Promise\.all\(\s*(?:FULL_PHASE_IDS|phaseDefinitions|phases)/u,
  "outer local Canonical phases must never execute concurrently",
);
assert.doesNotMatch(
  localExecutor,
  /\b(?:retry|sleep)\s*\(/iu,
  "the local executor must not add retries or arbitrary sleeps",
);

for (const fragment of [
  `LOCAL_CANONICAL_RECEIPT_SCHEMA`,
  `canonicalSerialize`,
  `fingerprintCanonicalValue`,
  `finalizeReceipt`,
  `verifyReceiptIntegrity`,
  `assertPublicSafeReceipt`,
  `receipt_stale_head`,
  `receipt_stale_branch_state`,
  `receipt_current_worktree_dirty`,
  `receipt_stale_lockfiles`,
  `receipt_stale_executor`,
  `receipt_stale_plan`,
  `receipt_stale_environment`,
  `receipt_missing_phases`,
  `receipt_phase_inventory_mismatch`,
  `phase_not_passing:`,
  `receipt_cleanup_incomplete`,
  `receipt_canonical_node_mismatch`,
  `receipt_non_deciding`,
  `receipt_dirty_worktree`,
  `operating-policy-only`,
]) {
  requireText(
    localReceipt,
    fragment,
    `local receipt contract is missing: ${fragment}`,
  );
}

for (const fragment of [
  `authorized_root_only`,
  `authorized_origin_only`,
  `exact_sha_and_missing_commit_fail_closed`,
  `quick_dirty_non_deciding`,
  `deciding_dirty_refused`,
  `documentation_selection_dependency_light`,
  `operating_policy_selection_static_and_maintenance_free`,
  `full_phase_inventory_complete`,
  `browser_lanes_sequential`,
  `maximum_outer_phase_concurrency`,
  `canonical_node_mismatch_explicit`,
  `post_execution_tracked_mutation_refused`,
  `next_env_generated_and_ignored`,
  `typecheck_runs_next_typegen`,
  `hosted_ci_absent`,
]) {
  requireText(
    localExecutorContract,
    fragment,
    `local executor regression is missing: ${fragment}`,
  );
}
for (const fragment of [
  `deterministic_canonical_serialization`,
  `content_integrity_verified`,
  `required_fields_verified`,
  `private_material_excluded`,
  `stale_head_lock_executor_and_plan_refused`,
  `incomplete_failed_timed_out_and_cleanup_incomplete_refused`,
  `quick_dirty_explicitly_non_deciding`,
  `operating_policy_plan_deciding_and_validated`,
  `canonical_node_mismatch_refused`,
  `{ private_path: "/Users/private/project/file" }`,
  `{ username: "private-user" }`,
  `{ hostname: "private-host" }`,
  `{ environment_dump: { PRIVATE_VALUE: "hidden" } }`,
  `{ credentials: "hidden" }`,
  `{ token: "hidden" }`,
  `{ raw_output: "command output" }`,
  `{ prompt: "hidden prompt" }`,
  `{ model_output: "hidden model text" }`,
  `{ database_content: "private row" }`,
]) {
  requireText(
    localReceiptContract,
    fragment,
    `local receipt regression is missing: ${fragment}`,
  );
}
for (const authorityChild of [
  "scripts/test-canonical-change-planner.mjs",
  "scripts/test-dependency-lock-compatibility.mjs",
  "scripts/test-local-canonical-executor.mjs",
  "scripts/test-local-canonical-receipt.mjs",
  "scripts/test-local-canonical-pr-evidence.mjs",
  "scripts/test-local-canonical-pr-evidence-transport.mjs",
]) {
  assert.equal(
    countOccurrences(canonicalSuite, authorityChild),
    1,
    `authority suite must own ${authorityChild} exactly once`,
  );
}

for (const fragment of [
  `augnes.local-canonical-pr-evidence.v1`,
  `MAX_PUBLICATION_ENVELOPE_BYTES = 32 * 1024`,
  `MAX_PUBLICATION_COMMENT_BYTES = 48 * 1024`,
  `<!-- augnes-local-canonical-pr-evidence:v1 -->`,
  `<!-- /augnes-local-canonical-pr-evidence:v1 -->`,
  `fingerprintCanonicalValue(envelopeContent)`,
  `assertPublicSafeReceipt(envelope)`,
  `publication_integrity_mismatch`,
  `duplicate_publication_comments`,
  `not a signature or independent attestation`,
  `GitHub did not run these tests`,
  `OPERATING_POLICY_PUBLIC_PHASE_COMMANDS`,
  `operating-policy-only`,
]) {
  requireText(
    localPrEvidenceEnvelope,
    fragment,
    `publication envelope contract is missing: ${fragment}`,
  );
}
for (const fragment of [
  `validateReceiptAgainstCurrentRepository`,
  `receipt_not_current_deciding_evidence`,
  `remoteHeadSha !== identity.head_sha`,
  `remoteBaseSha !== pullRequest.base_sha`,
  `dirty_worktree_not_publishable`,
  `pull_request_not_draft`,
  `replacement_authority_required`,
  `publication_comment_changed_before_update`,
  `idempotent_noop`,
  `github_write_performed: action !== "idempotent_noop"`,
  `local_linked_match`,
  `.augnes-local-verification`,
  `"publications"`,
]) {
  requireText(
    localPrEvidence,
    fragment,
    `publication orchestrator contract is missing: ${fragment}`,
  );
}
for (const fragment of [
  `AUTHORIZED_GITHUB_REPOSITORY`,
  `"hynk-studio/augnes"`,
  `spawnSync("gh", args`,
  `shell: false`,
  `GITHUB_TRANSPORT_TIMEOUT_MS = 30_000`,
  `GITHUB_TRANSPORT_MAX_BYTES = 2 * 1024 * 1024`,
  `--paginate`,
  `--input`,
  `github_transport_failed`,
]) {
  requireText(
    localPrEvidenceTransport,
    fragment,
    `publication transport contract is missing: ${fragment}`,
  );
}
for (const forbiddenEndpoint of [
  "/statuses",
  "/check-runs",
  "/deployments",
  "/actions/workflows",
]) {
  assert.doesNotMatch(
    localPrEvidenceTransport,
    new RegExp(forbiddenEndpoint.replace("/", "\\/"), "u"),
    `publication transport must not contain ${forbiddenEndpoint}`,
  );
}
assert.doesNotMatch(
  localPrEvidenceTransport,
  /GITHUB_TOKEN|GH_TOKEN|auth status|credential/iu,
  "publication transport must not inspect or log authentication material",
);
for (const fragment of [
  `deterministic_projection`,
  `non_deciding_receipts_refused`,
  `full_documentation_and_operating_policy_receipts_supported`,
  `private_material_excluded`,
  `duplicate_and_malformed_comments_refused`,
  `dirty_stale_fork_closed_merged_and_non_draft_refused`,
  `arbitrary_comment_id_refused`,
]) {
  requireText(
    localPrEvidenceContract,
    fragment,
    `publication regression is missing: ${fragment}`,
  );
}
for (const fragment of [
  `fixed_repository_endpoints`,
  `argument_safe_gh_spawn`,
  `idempotent_noop_zero_writes`,
  `replacement_requires_exact_prior_fingerprint`,
  `changed_remote_body_refused`,
  `unrelated_comments_unchanged`,
  `no_delete_status_check_deployment_or_workflow_path`,
]) {
  requireText(
    localPrEvidenceTransportContract,
    fragment,
    `publication transport regression is missing: ${fragment}`,
  );
}
for (const fragment of [
  `Publication used: \`yes | no\``,
  `Dedicated evidence comment URL:`,
  `Publication-envelope SHA-256 content fingerprint:`,
  `Remote-only verification result:`,
  `Local-linked verification result:`,
  `Identical-publication idempotent no-op proof:`,
  `Replacement used: \`yes | no\``,
  `not a signature`,
]) {
  requireText(
    pullRequestTemplate,
    fragment,
    `pull-request template publication field is missing: ${fragment}`,
  );
}
for (const fragment of [
  `publication is never implicit`,
  `current task Draft PR`,
  `Never publish quick`,
  `Never publish to a historical PR`,
  `Stop on duplicate marker comments`,
  `idempotent no-write result`,
]) {
  requireText(
    agents,
    fragment,
    `AGENTS.md publication instruction is missing: ${fragment}`,
  );
}
assert.match(gitignore, /^\.augnes-local-verification\/$/mu);
for (const forbiddenConfig of [
  ".gitlab-ci.yml",
  ".gitlab-ci.yaml",
  ".github/actions-runner",
]) {
  assert.equal(
    existsSync(path.join(repositoryRoot, forbiddenConfig)),
    false,
    `alternate or self-hosted CI config must remain absent: ${forbiddenConfig}`,
  );
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
  `isSafeOperatingPolicyModification`,
  `exact_safe_agents_operating_policy_change`,
  `operating-policy-only`,
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
  "AGENTS-plus-documentation",
  "nested-AGENTS",
  "AGENTS-deletion",
  "AGENTS-rename",
  "AGENTS-mode-change",
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
  `validateCanonicalOperatingPolicyChange`,
  `operating-policy validator requires one safe AGENTS.md modification`,
]) {
  requireText(
    documentationValidator,
    fragment,
    `documentation fast-path validation is missing: ${fragment}`,
  );
}
for (const fragment of [
  `operating-policy-only`,
  `acquires no`,
  `production Companion maintenance`,
  `\`AGENTS.md\` combined`,
  `with any other path`,
  `deletion, rename, copy, mode change`,
]) {
  requireText(
    localPolicy,
    fragment,
    `operating-policy verification policy is missing: ${fragment}`,
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
  `joinAncestorLease: true`,
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
  "reconstruction-conformance",
  "commissioned-controlled-workbench",
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
  ["runtime-supervisor-lifecycle", "operability-supervisor"],
  ["runtime-supervisor-resume", "operability-supervisor"],
  ["runtime-reconciliation", "operability-runtime-reconciliation"],
  ["distributable-package", "operability-package"],
];
const operabilityOwnershipSource = `${canonicalSuite}\n${runtimeOperabilityOwnership}`;
for (const [childId, shardName] of operabilityChildren) {
  assert.equal(
    countOccurrences(operabilityOwnershipSource, `id: "${childId}"`),
    1,
    `operability child must have exactly one owner: ${childId}`,
  );
  requireText(
    operabilityOwnershipSource,
    `shard: "${shardName}"`,
    `operability child shard is missing: ${childId}`,
  );
}
const ownershipRootNode = (...args) => ({ args });
const darwinSupervisorSteps = buildRuntimeOperabilityCanonicalSteps(
  ownershipRootNode,
  "darwin",
);
const linuxSupervisorSteps = buildRuntimeOperabilityCanonicalSteps(
  ownershipRootNode,
  "linux",
);
const supportedWindowsSupervisorSteps = buildRuntimeOperabilityCanonicalSteps(
  ownershipRootNode,
  createRuntimeOperabilityContext({
    platform: "win32",
    architecture: "x64",
    windows_version: "10.0.26200",
    distribution_mode: "source",
    windows_physical_identity: {
      status: "exact_fixed_ntfs",
      reason: null,
    },
  }),
);
const unsupportedWindowsSupervisorSteps = buildRuntimeOperabilityCanonicalSteps(
  ownershipRootNode,
  createRuntimeOperabilityContext({
    platform: "win32",
    architecture: "x64",
    windows_version: "10.0.19045",
    distribution_mode: "source",
    windows_physical_identity: {
      status: "exact_fixed_ntfs",
      reason: null,
    },
  }),
);
assert.deepEqual(
  darwinSupervisorSteps.map((step) => step.id),
  ["runtime-supervisor-lifecycle", "runtime-supervisor-resume"],
  "Darwin operability must include lifecycle and positive Resume owners",
);
assert.deepEqual(
  linuxSupervisorSteps.map((step) => step.id),
  darwinSupervisorSteps.map((step) => step.id),
  "Linux operability must include the existing non-Windows owner set",
);
assert.deepEqual(
  supportedWindowsSupervisorSteps.map((step) => step.id),
  ["runtime-supervisor-lifecycle", "runtime-supervisor-resume"],
  "supported Windows 11 source fixed-NTFS operability must include positive Resume",
);
assert.deepEqual(
  unsupportedWindowsSupervisorSteps.map((step) => step.id),
  ["runtime-supervisor-lifecycle"],
  "unsupported Windows operability must retain lifecycle refusal without positive Resume",
);
assert.equal(
  [
    ...darwinSupervisorSteps,
    ...supportedWindowsSupervisorSteps,
    ...unsupportedWindowsSupervisorSteps,
  ].every((step) =>
    step.requirements.includes("nested-app-runtime"),
  ),
  true,
  "every platform-applicable supervisor owner must declare nested runtime ownership",
);
for (const fragment of [
  `buildRuntimeOperabilityCanonicalSteps(rootNode)`,
  `...buildRuntimeOperabilityCanonicalSteps(rootNode)`,
]) {
  requireText(
    canonicalSuite,
    fragment,
    `runtime operability aggregate ownership is missing: ${fragment}`,
  );
}
for (const fragment of [
  `selector: "lifecycle"`,
  `timeoutMs: 90_000`,
  `selector: "resume"`,
  `timeoutMs: 105_000`,
  `requireNaturalExit: true`,
  `RUNTIME_OPERABILITY_MAX_CHILD_TIMEOUT_MS = 120_000`,
]) {
  requireText(
    runtimeOperabilityOwnership,
    fragment,
    `runtime operability ownership bound is missing: ${fragment}`,
  );
}

for (const variable of [
  "HOME",
  "USERPROFILE",
  "LOCALAPPDATA",
  "APPDATA",
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
for (const directoryFragment of [
  `path.join(resourceRoot, "home", "AppData", "Local")`,
  `path.join(resourceRoot, "home", "AppData", "Roaming")`,
]) {
  requireText(
    canonicalSuite,
    directoryFragment,
    `canonical Windows browser profile root is not pre-created: ${directoryFragment}`,
  );
}
for (const fragment of [
  `"native-windows-identity"`,
  `"build:native:windows-identity"`,
  `generatedWindowsHelperRoot`,
  `generated_windows_helper`,
  `browserExecutablePath: phase.browser ? browserExecutablePath : null`,
  `environment.AUGNES_BROWSER_EXECUTABLE_PATH = browserExecutablePath`,
]) {
  requireText(
    localExecutor,
    fragment,
    `Windows native Canonical ownership is missing: ${fragment}`,
  );
}
requireText(
  canonicalEnvironment,
  `"AUGNES_CANONICAL_WINDOWS_REPOSITORY_ROOT"`,
  "canonical child Windows repository-root authorization is not forwarded",
);
for (const [pathName, timeout] of [
  ["scripts/test-commissioned-controlled-workbench.ts", "30_000"],
  ["scripts/test-vnext-operator-pure-contracts-v0-1.ts", "30_000"],
  ["scripts/test-vnext-operator-browser-fixture-v0-1.ts", "45_000"],
  ["scripts/smoke-vnext-operator-pilot-v0-1.ts", "780_000"],
  ["scripts/test-recovery-canonical-record-validator.ts", "300_000"],
  ["scripts/test-recovery-backup.mjs", "330_000"],
  ["scripts/test-runtime-database-bootstrap.mjs", "390_000"],
  ["scripts/test-runtime-reconciliation.mjs", "720_000"],
  ["scripts/test-distributable-package.mjs", "480_000"],
  ["scripts/browser-validate-continuity-v1.mjs", "480_000"],
  ["scripts/browser-validate-cross-boundary-golden-v1.mjs", "360_000"],
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
      operability_children_declared: operabilityChildren.map(
        ([childId]) => childId,
      ),
      runtime_supervisor_children_by_context: {
        darwin: darwinSupervisorSteps.map((step) => step.id),
        linux: linuxSupervisorSteps.map((step) => step.id),
        windows_11_source_fixed_ntfs: supportedWindowsSupervisorSteps.map(
          (step) => step.id,
        ),
        windows_10_source_fixed_ntfs: unsupportedWindowsSupervisorSteps.map(
          (step) => step.id,
        ),
      },
      child_resource_isolation_required: true,
      zero_network_guard_required: true,
      package_history_required: true,
      local_execution_limitations_must_be_recorded: true,
      authority_regressions_required: [
        "canonical-change-planner",
        "canonical-child-runner",
        "dependency-lock-compatibility",
        "local-canonical-verification-contract",
        "local-canonical-executor",
        "local-canonical-receipt",
        "local-canonical-pr-evidence",
        "local-canonical-pr-evidence-transport",
      ],
      local_pr_evidence_publication_explicit_only: true,
      local_pr_evidence_status_check_and_deployment_paths_absent: true,
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
  const suiteBlockStart = source.lastIndexOf("\n    {", invocationIndex);
  const declaredBlockStart = source.lastIndexOf(" = {", invocationIndex);
  const blockStart = Math.max(suiteBlockStart, declaredBlockStart);
  const blockEnd =
    blockStart === declaredBlockStart
      ? source.indexOf("\n};", invocationIndex)
      : source.indexOf("\n    },", invocationIndex);
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
