#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { spawn, spawnSync } from "node:child_process";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { createRequire } from "node:module";
import net from "node:net";
import { networkInterfaces, tmpdir } from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";

import Database from "better-sqlite3";

import {
  confirmLocalProjectOnboardingV01,
  pickAndInspectLocalProjectV01,
} from "../lib/vnext/onboarding/local-project-onboarding";
import { readDefaultWorkspaceIdentityV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { canonicalizeProtocolValueV01 } from "../lib/vnext/protocol-primitives";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
} from "../lib/vnext/runtime/local-operator-session";

import {
  DEFAULT_BRIDGE_PORT,
  DEFAULT_UI_PORT,
  RUNTIME_CONTRACT,
  RUNTIME_SCHEMA_VERSION,
  buildSupervisorChildValues,
  classifyRuntimeUpdate,
  ensureRuntimeDirectory,
  handleRecoveryControlRequest,
  paginateRecoveryInventory,
  recoveryProtectionDecision,
  requestShutdownAfterResponse,
  resolvePhysicalRuntimeStateDestination,
  resolveRuntimeDistribution,
  resolveRuntimePaths,
  runtimeOwnsPort,
} from "./augnes-runtime-supervisor-core.mjs";
import {
  buildRuntimeChildEnvironment,
  findForbiddenRuntimeChildEnvironmentKeys,
} from "./runtime-child-environment.mjs";
import {
  DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT,
  DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT_VERSION,
  DISTRIBUTABLE_DATABASE_MIGRATION_IDS,
  DISTRIBUTABLE_DATABASE_READER_CONTRACTS,
  DISTRIBUTABLE_DATABASE_RECORD_CONTRACT,
  DISTRIBUTABLE_DATABASE_RECORD_CONTRACT_VERSION,
  DISTRIBUTABLE_DATABASE_SCHEMA_COMPATIBILITY,
  DISTRIBUTABLE_DATABASE_SCHEMA_CONTRACT,
  DISTRIBUTABLE_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
  DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
  detectDistributablePlatform,
  formatDistributablePlatformLabel,
} from "./distributable-package-contract.mjs";
import { canonicalStructuralSchemaContractSignature } from "./runtime-database-bootstrap.mjs";
import {
  cleanupOwnedProcesses,
  closeTrackedServer,
  registerOwnedChild,
  trackServerConnections,
  waitForOwnedProcessExit,
} from "./test-harness-process-lifecycle.mjs";

const repoRoot = process.cwd();
const applicationVersion = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8"),
).version;
const requireMcpSdk = createRequire(
  path.join(repoRoot, "apps", "augnes_apps", "package.json"),
);
const supervisorScript = path.join(repoRoot, "scripts", "augnes-runtime-supervisor.mjs");
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "augnes-runtime-operability-"));
const homeRoot = path.join(temporaryRoot, "home");
const tempRoot = path.join(temporaryRoot, "tmp");
const logRoot = path.join(temporaryRoot, "logs");
const databasePath = path.join(temporaryRoot, "data", "runtime.db");
const repositoryDatabasePath = path.join(repoRoot, "data", "augnes.db");
const runtimeMarkerScope = "project:runtime-supervisor-mcp-behavior-v0-1";
const runtimeMarkerStateKey = "runtime_supervisor.mcp_behavior_marker";
const runtimeMarkerValue = "disposable-root-runtime-marker-v0-1";
const registeredRuntimeWorkspaceId = "workspace:10000000-0000-4000-8000-000000000001";
const registeredRuntimeProjectAId = "project:20000000-0000-4000-8000-000000000001";
const registeredRuntimeProjectBId = "project:20000000-0000-4000-8000-000000000002";
const registeredRuntimeOperatorId = "operator:cdx2b1-runtime-positive-path";
const publicSecretSentinel = "must-not-escape-runtime-parent";
const publicModelSentinel = "reviewed-model-sentinel-must-not-escape";
const reviewedBridgeCompatibilityEnvironment = Object.freeze({
  AUGNES_APP_PROFILE: "chrono_lab",
  AUGNES_APP_TOOL_SURFACE: "work_loop_readonly",
  AUGNES_APP_DOMAIN: "https://app.runtime-compat.example",
  AUGNES_CONNECT_DOMAIN: "https://connect.runtime-compat.example",
  AUGNES_RESOURCE_DOMAIN: "https://resources.runtime-compat.example",
});
const blockedBridgeFileEnvironment = Object.freeze({
  AUGNES_WORKING_VIEW_FILE: path.join(temporaryRoot, "working-view.json"),
  AUGNES_CASEFILE_FILE: path.join(temporaryRoot, "casefile.json"),
  AUGNES_EVIDENCE_INDEX_FILE: path.join(temporaryRoot, "evidence-index.json"),
  AUGNES_CONTINUITY_REPORT_FILE: path.join(temporaryRoot, "continuity.json"),
  AUGNES_BOUNDARY_PACKET_FILE: path.join(temporaryRoot, "boundary.json"),
  AUGNES_STRATEGY_RATIONALE_FILE: path.join(temporaryRoot, "strategy.json"),
  AUGNES_GOVERNANCE_AUDIT_FILE: path.join(temporaryRoot, "audit.json"),
  AUGNES_REPO_NAVIGATION_FILE: path.join(temporaryRoot, "repo-navigation.json"),
});
const ownedProcesses = new Set();
const auxiliaryProcesses = new Set();
const selectedPorts = [];
const observedOwnedPids = new Set();
let pathFixtureSkipReason = null;
let proxyRequestCount = 0;
let unrelatedProcess = null;
let unrelatedIdentityServer = null;
let proxyServer = null;
let mcpBehaviorVerified = false;
let registeredRepositoryMcpEvidence = null;
let legacyRootRequestCount = 0;

mkdirSync(homeRoot, { recursive: true });
mkdirSync(tempRoot, { recursive: true });
mkdirSync(logRoot, { recursive: true });
mkdirSync(path.dirname(databasePath), { recursive: true });

const repositoryDatabaseBefore = snapshotDatabaseFamily(repositoryDatabasePath);
const ambientRuntimeProcessesBefore = listSupervisorProcessIds();
const ownedProcessCountBefore = observedOwnedPids.size;

let suiteError = null;
let cleanupError = null;

try {
  initializeDisposableDatabase(databasePath);
  assertRuntimeDistributionContract();
  assertRuntimeUpdateDecisionContract();
  await assertRecoveryControlDecisionContract();
  await assertConcurrentRecoveryRequestRefusal();
  assertRuntimeEnvironmentIsolation();
  await testRuntimeStatePathSafety();

  proxyServer = trackServerConnections(createHttpServer((_request, response) => {
    proxyRequestCount += 1;
    response.writeHead(502, { "content-type": "text/plain" });
    response.end("runtime test proxy sentinel");
  }));
  const proxyPort = await listenHttpServer(proxyServer);

  unrelatedProcess = spawn(
    process.execPath,
    ["--eval", "setInterval(() => {}, 1000)"],
    {
      detached: process.platform !== "win32",
      stdio: "ignore",
      windowsHide: true,
    },
  );
  registerOwnedChild(auxiliaryProcesses, unrelatedProcess, {
    label: "unrelated process sentinel",
  });
  assert(Number.isInteger(unrelatedProcess.pid));

  await testReadyDuplicateStatusAndStop();
  await testPoisonedEnvironmentRestart(proxyPort);
  await testParentSignalCleanup();
  await testRequiredChildFailure();
  await testUnverifiedOwnershipRefusal();

  assert.equal(mcpBehaviorVerified, true, "real public and StateRuntime MCP tools must be verified");
  assert.equal(
    registeredRepositoryMcpEvidence?.verified,
    true,
    "the real registered-repository MCP positive path must be verified",
  );
  assert.equal(
    registeredRepositoryMcpEvidence?.selection_independent_attachment,
    true,
    "Browser selection must not change the exact repository attachment",
  );
  assert.equal(
    registeredRepositoryMcpEvidence?.attachment_stale_reason,
    "packet_changed",
  );
  assert.equal(
    registeredRepositoryMcpEvidence?.same_path_replacement_blocked,
    true,
  );
  assert.equal(legacyRootRequestCount, 0, "legacy proposed routes must not reach the root runtime");
  assert.equal(proxyRequestCount, 0, "supervised startup must not make provider/proxy requests");
  assert.equal(isProcessAlive(unrelatedProcess.pid), true, "unrelated PID sentinel must remain alive");
  assert.deepEqual(
    snapshotDatabaseFamily(repositoryDatabasePath),
    repositoryDatabaseBefore,
    "the repository database and side files must remain byte/stat identical",
  );
  for (const pid of observedOwnedPids) {
    assert.equal(isProcessAlive(pid), false, `owned process ${pid} must not remain after tests`);
  }
  const ownedProcessCountAfter = [...observedOwnedPids].filter(isProcessAlive).length;
  assert.equal(ownedProcessCountAfter, 0);
  const ambientRuntimeProcessesAfter = listSupervisorProcessIds();
  assert.deepEqual(
    ambientRuntimeProcessesAfter,
    ambientRuntimeProcessesBefore,
    "the focused test must leave the ambient supervisor process count unchanged",
  );

  const summary = {
    test: "canonical-runtime-supervisor-operability",
    status: "pass",
    canonical_commands: ["start", "status", "stop"],
    real_processes: ["next-ui", "http-mcp-bridge"],
    loopback_only: true,
    preferred_ui_port: DEFAULT_UI_PORT,
    preferred_bridge_port: DEFAULT_BRIDGE_PORT,
    selected_ports: selectedPorts,
    ready_state_verified: true,
    duplicate_launch_reused: true,
    graceful_stop: true,
    parent_signal_cleanup: true,
    required_child_failure_observed: true,
    unverified_pid_never_signaled: true,
    environment_isolation_verified: true,
    update_decision_contract_verified: true,
    update_source_provenance_verified: true,
    semver_prerelease_precedence_verified: true,
    recovery_inventory_status_verified: true,
    recovery_response_close_shutdown_verified: true,
    concurrent_recovery_request_refusal_verified: true,
    reviewed_ui_provider_environment_verified: true,
    bridge_core_mode: "http",
    live_repository_mcp_tool_verified: mcpBehaviorVerified,
    registered_repository_positive_path: registeredRepositoryMcpEvidence?.verified === true,
    registered_repository_status: registeredRepositoryMcpEvidence?.repository_status ?? null,
    initial_binding: registeredRepositoryMcpEvidence?.initial_binding ?? null,
    revised_binding: registeredRepositoryMcpEvidence?.revised_binding ?? null,
    selection_coupled_binding: registeredRepositoryMcpEvidence?.selection_coupled_binding ?? null,
    browser_revision_refresh_verified: registeredRepositoryMcpEvidence?.revision_refresh === true,
    browser_selection_coupling_verified: registeredRepositoryMcpEvidence?.selection_coupling === true,
    selection_independent_attachment_verified:
      registeredRepositoryMcpEvidence?.selection_independent_attachment === true,
    repository_attachment_binding:
      registeredRepositoryMcpEvidence?.repository_attachment_binding ?? null,
    attachment_stale_reason:
      registeredRepositoryMcpEvidence?.attachment_stale_reason ?? null,
    same_path_replacement_blocked:
      registeredRepositoryMcpEvidence?.same_path_replacement_blocked === true,
    registered_repository_read_database_mutations:
      registeredRepositoryMcpEvidence?.read_database_mutations ?? null,
    registered_repository_read_project_file_mutations:
      registeredRepositoryMcpEvidence?.read_project_file_mutations ?? null,
    codex_only_database_copies:
      registeredRepositoryMcpEvidence?.codex_only_database_copies ?? null,
    browser_process_required:
      registeredRepositoryMcpEvidence?.browser_process_required ?? null,
    start_or_execution_created:
      registeredRepositoryMcpEvidence?.start_or_execution_created ?? null,
    official_stdio_mcp_client: true,
    private_companion_bridge_refusals_verified: true,
    narrow_companion_proxy_credential: true,
    mock_contribution: false,
    legacy_root_requests_observed: legacyRootRequestCount,
    runtime_state_physical_path_verified: true,
    path_fixture_skip_reason: pathFixtureSkipReason,
    provider_credentials_required: false,
    provider_or_proxy_requests: proxyRequestCount,
    repository_database_unchanged: true,
    owned_process_count_before: ownedProcessCountBefore,
    owned_process_count_after: ownedProcessCountAfter,
    ambient_supervisor_process_count_before: ambientRuntimeProcessesBefore.length,
    ambient_supervisor_process_count_after: ambientRuntimeProcessesAfter.length,
    owned_ports_after: 0,
    runtime_state_files_after: 0,
    disposable_database_preserved: true,
  };
  summary.normalized_public_result_sha256 = createHash("sha256")
    .update(
      JSON.stringify({
        test: summary.test,
        status: summary.status,
        canonical_commands: summary.canonical_commands,
        real_processes: summary.real_processes,
        loopback_only: summary.loopback_only,
        ready_state_verified: summary.ready_state_verified,
        duplicate_launch_reused: summary.duplicate_launch_reused,
        graceful_stop: summary.graceful_stop,
        parent_signal_cleanup: summary.parent_signal_cleanup,
        required_child_failure_observed: summary.required_child_failure_observed,
        unverified_pid_never_signaled: summary.unverified_pid_never_signaled,
        update_decision_contract_verified:
          summary.update_decision_contract_verified,
        update_source_provenance_verified:
          summary.update_source_provenance_verified,
        semver_prerelease_precedence_verified:
          summary.semver_prerelease_precedence_verified,
        recovery_inventory_status_verified:
          summary.recovery_inventory_status_verified,
        recovery_response_close_shutdown_verified:
          summary.recovery_response_close_shutdown_verified,
        concurrent_recovery_request_refusal_verified:
          summary.concurrent_recovery_request_refusal_verified,
        reviewed_ui_provider_environment_verified:
          summary.reviewed_ui_provider_environment_verified,
        bridge_core_mode: summary.bridge_core_mode,
        live_repository_mcp_tool_verified:
          summary.live_repository_mcp_tool_verified,
        registered_repository_positive_path:
          summary.registered_repository_positive_path,
        registered_repository_status: summary.registered_repository_status,
        browser_revision_refresh_verified:
          summary.browser_revision_refresh_verified,
        browser_selection_coupling_verified:
          summary.browser_selection_coupling_verified,
        selection_independent_attachment_verified:
          summary.selection_independent_attachment_verified,
        repository_attachment_binding: summary.repository_attachment_binding,
        attachment_stale_reason: summary.attachment_stale_reason,
        same_path_replacement_blocked: summary.same_path_replacement_blocked,
        registered_repository_read_database_mutations:
          summary.registered_repository_read_database_mutations,
        registered_repository_read_project_file_mutations:
          summary.registered_repository_read_project_file_mutations,
        codex_only_database_copies: summary.codex_only_database_copies,
        browser_process_required: summary.browser_process_required,
        start_or_execution_created: summary.start_or_execution_created,
        official_stdio_mcp_client: summary.official_stdio_mcp_client,
        private_companion_bridge_refusals_verified:
          summary.private_companion_bridge_refusals_verified,
        narrow_companion_proxy_credential:
          summary.narrow_companion_proxy_credential,
        mock_contribution: summary.mock_contribution,
        legacy_root_requests_observed: summary.legacy_root_requests_observed,
        runtime_state_physical_path_verified:
          summary.runtime_state_physical_path_verified,
        provider_or_proxy_requests: summary.provider_or_proxy_requests,
        repository_database_unchanged: summary.repository_database_unchanged,
        owned_process_count_after: summary.owned_process_count_after,
        owned_ports_after: summary.owned_ports_after,
        runtime_state_files_after: summary.runtime_state_files_after,
      }),
    )
    .digest("hex");
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  suiteError = error;
} finally {
  const cleanupErrors = [];
  for (const action of [
    () => cleanupOwnedProcesses(ownedProcesses, { termGraceMs: 12_000 }),
    () => closeServer(unrelatedIdentityServer),
    () => closeServer(proxyServer),
    () => cleanupOwnedProcesses(auxiliaryProcesses),
  ]) {
    try {
      await action();
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  rmSync(temporaryRoot, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
  if (cleanupErrors.length > 0) {
    cleanupError = new Error("runtime operability cleanup failed");
    cleanupError.code = "runtime_operability_cleanup_failed";
    cleanupError.causes = cleanupErrors;
  }
}

if (suiteError && cleanupError) {
  throw new AggregateError([suiteError, cleanupError], "runtime operability and cleanup failed");
}
if (suiteError) throw suiteError;
if (cleanupError) throw cleanupError;

async function testRuntimeStatePathSafety() {
  const fixtureRoot = path.join(temporaryRoot, "runtime-path-safety");
  const fakeRepositoryRoot = path.join(fixtureRoot, "fake-repository");
  const outsideRoot = path.join(fixtureRoot, "outside");
  mkdirSync(fakeRepositoryRoot, { recursive: true });
  mkdirSync(outsideRoot, { recursive: true });
  writeFileSync(path.join(fakeRepositoryRoot, "repository-sentinel"), "unchanged\n");
  const fakeRepositoryBefore = listRelativeEntriesRecursively(fakeRepositoryRoot);

  const normalOutside = path.join(outsideRoot, "normal", "runtime-state");
  const normalResolution = resolvePhysicalRuntimeStateDestination({
    candidate: normalOutside,
    repositoryRoot: fakeRepositoryRoot,
  });
  assert.equal(
    normalResolution.physical_destination,
    path.join(realpathSync(outsideRoot), "normal", "runtime-state"),
  );
  assert.equal(
    ensureRuntimeDirectory({
      directory: normalOutside,
      repositoryRoot: fakeRepositoryRoot,
    }),
    realpathSync(normalOutside),
  );

  const directInside = path.join(fakeRepositoryRoot, "direct-inside");
  assertRuntimePathError(
    () =>
      resolvePhysicalRuntimeStateDestination({
        candidate: directInside,
        repositoryRoot: fakeRepositoryRoot,
      }),
    "runtime_state_path_must_be_outside_repository",
    [directInside, fakeRepositoryRoot, publicSecretSentinel],
  );
  assert.equal(existsSync(directInside), false);

  const outsideLink = path.join(fixtureRoot, "outside-link");
  if (!createDirectoryLink(outsideRoot, outsideLink)) {
    assert.deepEqual(
      listRelativeEntriesRecursively(fakeRepositoryRoot),
      fakeRepositoryBefore,
    );
    return;
  }

  const acceptedViaLink = path.join(outsideLink, "linked", "runtime-state");
  const linkedResolution = resolvePhysicalRuntimeStateDestination({
    candidate: acceptedViaLink,
    repositoryRoot: fakeRepositoryRoot,
  });
  assert.equal(
    linkedResolution.physical_destination,
    path.join(realpathSync(outsideRoot), "linked", "runtime-state"),
  );
  ensureRuntimeDirectory({
    directory: acceptedViaLink,
    repositoryRoot: fakeRepositoryRoot,
  });
  assert.equal(
    realpathSync(acceptedViaLink),
    path.join(realpathSync(outsideRoot), "linked", "runtime-state"),
  );

  const nestedMissing = path.join(outsideLink, "missing-one", "missing-two", "runtime");
  const nestedResolution = resolvePhysicalRuntimeStateDestination({
    candidate: nestedMissing,
    repositoryRoot: fakeRepositoryRoot,
  });
  assert.equal(
    nestedResolution.physical_destination,
    path.join(realpathSync(outsideRoot), "missing-one", "missing-two", "runtime"),
  );

  const repositoryLink = path.join(fixtureRoot, "repository-link");
  assert.equal(createDirectoryLink(fakeRepositoryRoot, repositoryLink), true);
  const redirectedInside = path.join(repositoryLink, "redirected", "runtime-state");
  assertRuntimePathError(
    () =>
      resolvePhysicalRuntimeStateDestination({
        candidate: redirectedInside,
        repositoryRoot: fakeRepositoryRoot,
      }),
    "runtime_state_path_must_be_outside_repository",
    [redirectedInside, fakeRepositoryRoot, publicSecretSentinel],
  );
  assert.equal(
    existsSync(path.join(fakeRepositoryRoot, "redirected")),
    false,
    "a symlinked parent into the repository must be refused before mkdir",
  );

  const symlinkTarget = path.join(outsideRoot, "existing-runtime-target");
  const runtimeDirectoryLink = path.join(fixtureRoot, "runtime-directory-link");
  mkdirSync(symlinkTarget, { recursive: true });
  assert.equal(createDirectoryLink(symlinkTarget, runtimeDirectoryLink), true);
  assertRuntimePathError(
    () =>
      resolveRuntimePaths({
        environment: { AUGNES_RUNTIME_STATE_DIR: runtimeDirectoryLink },
        repositoryRootPath: fakeRepositoryRoot,
        repositoryFingerprint: "path-safety-fixture",
      }),
    "runtime_state_directory_invalid",
    [runtimeDirectoryLink, fakeRepositoryRoot, publicSecretSentinel],
  );
  assert.equal(lstatSync(runtimeDirectoryLink).isSymbolicLink(), true);

  const checkoutLink = path.join(fixtureRoot, "actual-checkout-link");
  assert.equal(createDirectoryLink(repoRoot, checkoutLink), true);
  const repositorySideName = `.augnes-runtime-path-safety-${path.basename(temporaryRoot)}`;
  const repositorySideDirectory = path.join(repoRoot, repositorySideName);
  assert.equal(existsSync(repositorySideDirectory), false);
  const publicScenario = {
    name: "runtime-path-public-error",
    root: fixtureRoot,
    stateDirectory: path.join(checkoutLink, repositorySideName),
    logRoot: path.join(logRoot, "runtime-path-public-error"),
  };
  mkdirSync(publicScenario.logRoot, { recursive: true });
  const publicEnvironment = scenarioEnvironment(publicScenario, {
    uiPort: DEFAULT_UI_PORT,
    bridgePort: DEFAULT_BRIDGE_PORT,
    providerMode: "absent",
  });
  const publicResult = await runCli(
    ["status"],
    publicEnvironment,
    publicScenario,
    "symlinked-repository-refusal",
  );
  assert.equal(publicResult.code, 2, publicResult.output);
  assert.deepEqual(lastJsonResult(publicResult.stdout), {
    schema_version: RUNTIME_SCHEMA_VERSION,
    contract: RUNTIME_CONTRACT,
    command: "status",
    result: "failed",
    state: "unavailable",
    reason: "runtime_state_path_must_be_outside_repository",
  });
  for (const forbidden of [
    publicScenario.stateDirectory,
    repoRoot,
    publicSecretSentinel,
    publicModelSentinel,
    "control-token.json",
    "bridge-supervisor.env",
  ]) {
    assert.equal(
      publicResult.output.includes(forbidden),
      false,
      "public runtime-path refusal must expose only the stable reason",
    );
  }
  assert.equal(existsSync(repositorySideDirectory), false);
  assert.deepEqual(
    listRelativeEntriesRecursively(fakeRepositoryRoot),
    fakeRepositoryBefore,
    "path safety checks must leave the fake repository unchanged",
  );
  removeScenarioLogs(publicScenario);
}

async function testReadyDuplicateStatusAndStop() {
  const scenario = createScenario("ready-stop");
  const registeredRepositories = createRegisteredRepositoryFixtureV01(scenario);
  const uiBlocker = await createTcpSentinel(DEFAULT_UI_PORT);
  const bridgeBlocker = await createTcpSentinel(DEFAULT_BRIDGE_PORT);
  const environment = scenarioEnvironment(scenario, {
    uiPort: uiBlocker.port,
    bridgePort: bridgeBlocker.port,
    providerMode: "absent",
  });
  Object.assign(environment, {
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: registeredRuntimeWorkspaceId,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: registeredRuntimeProjectAId,
    AUGNES_VNEXT_OPERATOR_ID: registeredRuntimeOperatorId,
  });

  const managed = startManagedSupervisor(
    environment,
    scenario,
    "ready-stop",
    "canonical",
  );
  const ready = await waitForJsonEvent(
    managed,
    (event) => event.command === "start" && event.result === "ready",
  );
  assertReadyResult(ready);
  assert.notEqual(ready.ui_port, uiBlocker.port, "occupied UI port must be skipped");
  assert.notEqual(ready.bridge_port, bridgeBlocker.port, "occupied bridge port must be skipped");
  selectedPorts.push({ scenario: scenario.name, ui: ready.ui_port, bridge: ready.bridge_port });
  rememberOwnedPids(ready);

  assert.equal(await canConnect(uiBlocker.port), true, "unrelated UI listener must remain alive");
  assert.equal(
    await canConnect(bridgeBlocker.port),
    true,
    "unrelated bridge listener must remain alive",
  );
  if (uiBlocker.connectionCount) {
    assert.equal(uiBlocker.connectionCount() > 0, true, "occupied UI listener must remain responsive");
  }
  if (bridgeBlocker.connectionCount) {
    assert.equal(
      bridgeBlocker.connectionCount() > 0,
      true,
      "occupied bridge listener must remain responsive",
    );
  }

  await assertReadyEndpoints(
    ready,
    environment,
    scenario,
    managed,
    registeredRepositories,
  );
  await assertLoopbackOnly(ready.ui_port);
  await assertLoopbackOnly(ready.bridge_port);
  const manifest = assertOwnershipFiles(scenario.stateDirectory, ready);
  assertPublicSafe(JSON.stringify(manifest), "manifest");
  assertPublicSafe(managed.output(), "start output");

  const databaseBeforeStatus = snapshotDatabaseFamily(databasePath);
  const status = await runCli(
    ["status"],
    environment,
    scenario,
    "status",
    "canonical",
  );
  assert.equal(status.code, 0, status.output);
  const statusResult = lastJsonResult(status.stdout);
  assert.equal(statusResult.state, "ready");
  assert.equal(statusResult.verified, true);
  assert.equal(statusResult.effective_url, ready.effective_url);
  assert.deepEqual(statusResult.children, ready.children);
  assertPublicSafe(status.output, "status output");
  assert.deepEqual(
    snapshotDatabaseFamily(databasePath),
    databaseBeforeStatus,
    "status must not mutate the disposable DB or side files",
  );

  const duplicate = await runCli(
    ["--webpack", "--hostname", "127.0.0.1", "--port", String(uiBlocker.port)],
    environment,
    scenario,
    "duplicate",
    "dev",
  );
  assert.equal(duplicate.code, 0, duplicate.output);
  const duplicateResult = lastJsonResult(duplicate.stdout);
  assert.equal(duplicateResult.result, "existing");
  assert.equal(duplicateResult.instance_id, ready.instance_id);
  assert.deepEqual(duplicateResult.children, ready.children);
  assertPublicSafe(duplicate.output, "duplicate output");
  assert.equal(managed.child.exitCode, null, "the original supervisor must remain alive");

  const widenedHost = await runCli(
    ["--hostname", "0.0.0.0"],
    environment,
    scenario,
    "non-loopback-refusal",
    "dev",
  );
  assert.equal(widenedHost.code, 2, widenedHost.output);
  assert.equal(lastJsonResult(widenedHost.stdout).reason, "non_loopback_hostname_refused");
  assertPublicSafe(widenedHost.output, "non-loopback refusal output");
  assert.equal(managed.child.exitCode, null, "a refused bind override must not affect the runtime");

  const ownedProcessTree = processTreePids(ready);
  for (const pid of ownedProcessTree) observedOwnedPids.add(pid);
  const databaseBeforeStop = snapshotDatabaseFamily(databasePath);
  const stop = await runCli(["stop"], environment, scenario, "stop", "canonical");
  assert.equal(stop.code, 0, stop.output);
  assert.equal(lastJsonResult(stop.stdout).state, "stopped");
  const supervisorExit = await waitForManagedExit(managed, 20_000);
  assert.equal(supervisorExit.code, 0, managed.output());

  await assertStoppedScenario(scenario, ready, ownedProcessTree);
  assert.equal(await canConnect(uiBlocker.port), true, "unrelated UI listener must survive stop");
  assert.equal(
    await canConnect(bridgeBlocker.port),
    true,
    "unrelated bridge listener must survive stop",
  );
  assert.equal(
    hashFile(databasePath),
    databaseBeforeStop.get(databasePath)?.sha256,
    "graceful stop must preserve the disposable database",
  );

  if (uiBlocker.server) await closeServer(uiBlocker.server);
  if (bridgeBlocker.server) await closeServer(bridgeBlocker.server);
  removeScenarioLogs(scenario);
}

async function testPoisonedEnvironmentRestart(proxyPort) {
  const scenario = createScenario("poisoned-restart");
  const uiBlocker = await createTcpSentinel(DEFAULT_UI_PORT);
  const bridgeBlocker = await createTcpSentinel(DEFAULT_BRIDGE_PORT);
  const environment = scenarioEnvironment(scenario, {
    uiPort: uiBlocker.port,
    bridgePort: bridgeBlocker.port,
    providerMode: "poisoned",
    proxyPort,
  });
  environment.AUGNES_UNRELATED_PID_SENTINEL = String(unrelatedProcess.pid);
  environment.AUGNES_REPOSITORY_DB_SENTINEL = repositoryDatabasePath;

  const managed = startManagedSupervisor(environment, scenario, "poisoned-restart");
  const ready = await waitForJsonEvent(
    managed,
    (event) => event.command === "start" && event.result === "ready",
  );
  assertReadyResult(ready);
  assert.notEqual(ready.ui_port, uiBlocker.port);
  assert.notEqual(ready.bridge_port, bridgeBlocker.port);
  selectedPorts.push({ scenario: scenario.name, ui: ready.ui_port, bridge: ready.bridge_port });
  rememberOwnedPids(ready);
  const bridgeHealth = await fetchJson(
    `http://127.0.0.1:${ready.bridge_port}/healthz`,
  );
  assert.equal(bridgeHealth.statusCode, 200);
  assert.equal(bridgeHealth.body.mode, "http");
  assert.equal(bridgeHealth.body.live_core_status, "ready");
  assert.equal(bridgeHealth.body.runtime_instance_id, ready.instance_id);
  assert.equal(bridgeHealth.body.profile, "chrono_lab");
  assertPublicSafe(JSON.stringify(bridgeHealth.body), "poisoned bridge health");
  assertOwnershipFiles(scenario.stateDirectory, ready);
  assertPublicSafe(managed.output(), "poisoned start output");
  assertProcessCommandLinesPublicSafe(processTreePids(ready));
  assert.equal(proxyRequestCount, 0, "poisoned proxy variables must not reach runtime children");
  assert.equal(isProcessAlive(unrelatedProcess.pid), true, "unrelated PID sentinel must stay alive");

  const status = await runCli(["status"], environment, scenario, "poisoned-status");
  assert.equal(status.code, 0, status.output);
  assertPublicSafe(status.output, "poisoned status output");

  const processTree = processTreePids(ready);
  for (const pid of processTree) observedOwnedPids.add(pid);
  const stop = await runCli(["stop"], environment, scenario, "poisoned-stop");
  assert.equal(stop.code, 0, stop.output);
  assertPublicSafe(stop.output, "poisoned stop output");
  const supervisorExit = await waitForManagedExit(managed, 20_000);
  assert.equal(supervisorExit.code, 0, managed.output());
  assertPublicSafe(managed.output(), "poisoned lifecycle output");
  await assertStoppedScenario(scenario, ready, processTree);
  assert.equal(proxyRequestCount, 0, "restart must not make provider/proxy requests");
  assert.equal(isProcessAlive(unrelatedProcess.pid), true, "restart/stop must not signal unrelated PID");
  assert.equal(await canConnect(uiBlocker.port), true, "poisoned UI blocker must survive");
  assert.equal(await canConnect(bridgeBlocker.port), true, "poisoned bridge blocker must survive");
  assertDirectoryPublicSafe(scenario.logRoot, "poisoned lifecycle logs");
  if (uiBlocker.server) await closeServer(uiBlocker.server);
  if (bridgeBlocker.server) await closeServer(bridgeBlocker.server);
  removeScenarioLogs(scenario);
}

async function testParentSignalCleanup() {
  const scenario = createScenario("parent-signal");
  const environment = scenarioEnvironment(scenario, {
    uiPort: await findPreferredPort(),
    bridgePort: await findPreferredPort(),
    providerMode: "absent",
  });
  const managed = startManagedSupervisor(environment, scenario, "parent-signal");
  const ready = await waitForJsonEvent(
    managed,
    (event) => event.command === "start" && event.result === "ready",
  );
  assertReadyResult(ready);
  selectedPorts.push({ scenario: scenario.name, ui: ready.ui_port, bridge: ready.bridge_port });
  rememberOwnedPids(ready);
  const processTree = processTreePids(ready);
  for (const pid of processTree) observedOwnedPids.add(pid);

  managed.child.kill("SIGTERM");
  const exit = await waitForManagedExit(managed, 20_000);
  assert.equal(exit.code, 0, managed.output());
  await assertStoppedScenario(scenario, ready, processTree);
  assert.match(managed.output(), /signal_sigterm/, "signal cleanup result must be observable");
  removeScenarioLogs(scenario);
}

async function testRequiredChildFailure() {
  const scenario = createScenario("child-failure");
  const environment = scenarioEnvironment(scenario, {
    uiPort: await findPreferredPort(),
    bridgePort: await findPreferredPort(),
    providerMode: "absent",
  });
  const managed = startManagedSupervisor(environment, scenario, "child-failure");
  const ready = await waitForJsonEvent(
    managed,
    (event) => event.command === "start" && event.result === "ready",
  );
  assertReadyResult(ready);
  selectedPorts.push({ scenario: scenario.name, ui: ready.ui_port, bridge: ready.bridge_port });
  rememberOwnedPids(ready);
  const processTree = processTreePids(ready);
  for (const pid of processTree) observedOwnedPids.add(pid);
  const bridge = ready.children.find((child) => child.role === "bridge");
  assert(bridge, "ready result must identify the bridge child");

  process.kill(bridge.pid, "SIGKILL");
  const failed = await waitForJsonEvent(
    managed,
    (event) =>
      event.command === "start" &&
      event.result === "failed" &&
      event.reason === "required_child_exited",
  );
  assert.equal(failed.failed_role, "bridge");
  const exit = await waitForManagedExit(managed, 20_000);
  assert.notEqual(exit.code, 0, "required child failure must make supervisor nonzero");
  await assertStoppedScenario(scenario, ready, processTree);
  assertPublicSafe(managed.output(), "child failure output");
  removeScenarioLogs(scenario);
}

async function testUnverifiedOwnershipRefusal() {
  const scenario = createScenario("unverified-owner");
  unrelatedIdentityServer = trackServerConnections(createHttpServer((_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        schema_version: RUNTIME_SCHEMA_VERSION,
        contract: "unrelated-service",
        state: "ready",
      }),
    );
  }));
  const controlPort = await listenHttpServer(unrelatedIdentityServer);
  const environment = scenarioEnvironment(scenario, {
    uiPort: await findPreferredPort(),
    bridgePort: await findPreferredPort(),
    providerMode: "absent",
  });
  const fakeManifest = {
    schema_version: RUNTIME_SCHEMA_VERSION,
    contract: RUNTIME_CONTRACT,
    instance_id: "unverified-live-pid-sentinel",
    repository_fingerprint: createHash("sha256").update(repoRoot).digest("hex"),
    supervisor_pid: unrelatedProcess.pid,
    control_host: "127.0.0.1",
    control_port: controlPort,
    children: [],
    effective_url: "http://127.0.0.1:65500",
    ui_port: 65500,
    bridge_port: 65499,
    lifecycle_state: "ready",
    started_at: new Date(0).toISOString(),
    last_transition_at: new Date(0).toISOString(),
    failure: null,
  };
  const manifestPath = path.join(scenario.stateDirectory, "runtime.json");
  writeFileSync(manifestPath, `${JSON.stringify(fakeManifest)}\n`, { mode: 0o600 });
  chmodSync(manifestPath, 0o600);

  const status = await runCli(["status"], environment, scenario, "unverified-status");
  assert.equal(status.code, 2, status.output);
  const statusResult = lastJsonResult(status.stdout);
  assert.equal(statusResult.state, "reconciliation_required");
  assert.equal(statusResult.verified, false);
  assert.equal("supervisor_pid" in statusResult, false, "unverified PID must not be echoed");
  assertPublicSafe(status.output, "unverified status output");
  assert.equal(isProcessAlive(unrelatedProcess.pid), true, "status must not signal unrelated PID");

  const stop = await runCli(["stop"], environment, scenario, "unverified-stop");
  assert.equal(stop.code, 2, stop.output);
  const stopResult = lastJsonResult(stop.stdout);
  assert.equal(stopResult.result, "refused");
  assert.equal(stopResult.reason, "runtime_ownership_unverifiable");
  assert.equal(isProcessAlive(unrelatedProcess.pid), true, "stop must not signal unrelated PID");
  assert.equal(await canConnect(controlPort), true, "unrelated control listener must remain alive");

  unlinkSync(manifestPath);
  await closeServer(unrelatedIdentityServer);
  unrelatedIdentityServer = null;
  assertNoRuntimeStateFiles(scenario.stateDirectory);
  removeScenarioLogs(scenario);
}

function createScenario(name) {
  const root = path.join(temporaryRoot, "scenarios", name);
  const stateDirectory = path.join(root, "runtime-state");
  const scenarioLogRoot = path.join(logRoot, name);
  mkdirSync(stateDirectory, { recursive: true, mode: 0o700 });
  mkdirSync(scenarioLogRoot, { recursive: true });
  return { name, root, stateDirectory, logRoot: scenarioLogRoot };
}

function createRegisteredRepositoryFixtureV01(scenario) {
  const root = path.join(scenario.root, "registered-repositories");
  const repositoryA = path.join(root, "repository-a");
  const repositoryB = path.join(root, "repository-b");
  mkdirSync(repositoryA, { recursive: true });
  mkdirSync(repositoryB, { recursive: true });
  writeFileSync(
    path.join(repositoryA, "fixture.txt"),
    "CDX2B2A registered repository A fixture\n",
  );
  writeFileSync(
    path.join(repositoryB, "fixture.txt"),
    "CDX2B2A registered repository B fixture\n",
  );
  initializeGitFixtureV01(repositoryA);
  initializeGitFixtureV01(repositoryB);
  return { repositoryA, repositoryB };
}

function initializeGitFixtureV01(root) {
  for (const args of [
    ["init", "--quiet", root],
    ["-C", root, "add", "fixture.txt"],
    ["-C", root, "-c", "user.name=Augnes Test", "-c", "user.email=test@augnes.local", "commit", "--quiet", "-m", "fixture"],
  ]) {
    const result = spawnSync("git", args, { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || `git fixture failed: ${args.join(" ")}`);
  }
}

function scenarioEnvironment(
  scenario,
  { uiPort, bridgePort, providerMode, proxyPort = null },
) {
  const environment = {
    ...process.env,
    HOME: homeRoot,
    USERPROFILE: homeRoot,
    TMPDIR: tempRoot,
    TMP: tempRoot,
    TEMP: tempRoot,
    AUGNES_RUNTIME_STATE_DIR: scenario.stateDirectory,
    AUGNES_RUNTIME_LOG_DIR: scenario.logRoot,
    AUGNES_DB_PATH: databasePath,
    AUGNES_UI_PREFERRED_PORT: String(uiPort),
    AUGNES_BRIDGE_PREFERRED_PORT: String(bridgePort),
  };

  for (const key of [
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "NO_PROXY",
    "http_proxy",
    "https_proxy",
    "all_proxy",
    "no_proxy",
    "ANTHROPIC_API_KEY",
    "AZURE_OPENAI_API_KEY",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "GOOGLE_API_KEY",
    "AUGNES_CORE_MODE",
    "AUGNES_USE_MOCK",
    "AUGNES_ENABLE_AGENT_BRIDGE",
    "AUGNES_APP_PROFILE",
    "AUGNES_APP_TOOL_SURFACE",
    "AUGNES_APP_DOMAIN",
    "AUGNES_CONNECT_DOMAIN",
    "AUGNES_RESOURCE_DOMAIN",
    "AUGNES_WORKING_VIEW_FILE",
    "AUGNES_CASEFILE_FILE",
    "AUGNES_EVIDENCE_INDEX_FILE",
    "AUGNES_CONTINUITY_REPORT_FILE",
    "AUGNES_BOUNDARY_PACKET_FILE",
    "AUGNES_STRATEGY_RATIONALE_FILE",
    "AUGNES_GOVERNANCE_AUDIT_FILE",
    "AUGNES_REPO_NAVIGATION_FILE",
  ]) {
    delete environment[key];
  }

  if (providerMode === "poisoned") {
    const proxyUrl = `http://127.0.0.1:${proxyPort}`;
    Object.assign(environment, {
      OPENAI_API_KEY: publicSecretSentinel,
      OPENAI_MODEL: publicModelSentinel,
      GITHUB_TOKEN: publicSecretSentinel,
      GH_TOKEN: publicSecretSentinel,
      ANTHROPIC_API_KEY: publicSecretSentinel,
      AZURE_OPENAI_API_KEY: publicSecretSentinel,
      AWS_ACCESS_KEY_ID: publicSecretSentinel,
      AWS_SECRET_ACCESS_KEY: publicSecretSentinel,
      GOOGLE_API_KEY: publicSecretSentinel,
      HTTP_PROXY: proxyUrl,
      HTTPS_PROXY: proxyUrl,
      ALL_PROXY: proxyUrl,
      NO_PROXY: "poisoned-no-proxy-value",
      AUGNES_UNRELATED_PARENT_VALUE: publicSecretSentinel,
      AUGNES_CORE_MODE: "http",
      AUGNES_USE_MOCK: "false",
      AUGNES_ENABLE_AGENT_BRIDGE: "false",
      ...blockedBridgeFileEnvironment,
      ...reviewedBridgeCompatibilityEnvironment,
    });
  }

  return environment;
}

function startManagedSupervisor(environment, scenario, label, surface = "direct") {
  return spawnManaged(["start"], environment, scenario, label, surface);
}

function spawnManaged(args, environment, scenario, label, surface = "direct") {
  const stdoutLog = path.join(scenario.logRoot, `${label}.stdout.log`);
  const stderrLog = path.join(scenario.logRoot, `${label}.stderr.log`);
  const invocation = buildInvocation(surface, args);
  const child = spawn(invocation.command, invocation.args, {
    cwd: repoRoot,
    env: environment,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const managed = {
    child,
    stdout: "",
    stderr: "",
    stdoutRemainder: "",
    events: [],
    stdoutLog,
    stderrLog,
    output() {
      return `${this.stdout}\n${this.stderr}`;
    },
  };
  managed.processRecord = registerOwnedChild(ownedProcesses, child, { label });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    managed.stdout += chunk;
    appendFileSync(stdoutLog, chunk, { mode: 0o600 });
    managed.stdoutRemainder += chunk;
    const lines = managed.stdoutRemainder.split(/\r?\n/);
    managed.stdoutRemainder = lines.pop() ?? "";
    for (const line of lines) {
      const parsed = parseJsonLine(line);
      if (parsed) managed.events.push(parsed);
    }
  });
  child.stderr.on("data", (chunk) => {
    managed.stderr += chunk;
    appendFileSync(stderrLog, chunk, { mode: 0o600 });
  });
  return managed;
}

async function runCli(args, environment, scenario, label, surface = "direct") {
  const managed = spawnManaged(args, environment, scenario, label, surface);
  const exit = await waitForManagedExit(managed, 25_000);
  if (managed.stdoutRemainder.length > 0) {
    const parsed = parseJsonLine(managed.stdoutRemainder);
    if (parsed) managed.events.push(parsed);
  }
  return {
    code: exit.code,
    signal: exit.signal,
    stdout: managed.stdout,
    stderr: managed.stderr,
    output: managed.output(),
  };
}

function buildInvocation(surface, args) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  if (surface === "canonical") {
    return { command: npmCommand, args: ["run", "augnes", "--", ...args] };
  }
  if (surface === "dev") {
    return { command: npmCommand, args: ["run", "dev", "--", ...args] };
  }
  return { command: process.execPath, args: [supervisorScript, ...args] };
}

async function waitForJsonEvent(managed, predicate, timeoutMs = 100_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const match = managed.events.find(predicate);
    if (match) return match;
    if (managed.child.exitCode !== null) {
      throw new Error(
        `managed runtime exited before expected event (${managed.child.exitCode}): ${managed.output()}`,
      );
    }
    await delay(50);
  }
  throw new Error(`timed out waiting for runtime event: ${managed.output()}`);
}

function parseJsonLine(line) {
  try {
    const value = JSON.parse(line);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function lastJsonResult(output) {
  const parsed = output
    .split(/\r?\n/)
    .map(parseJsonLine)
    .filter(Boolean);
  assert(parsed.length > 0, `expected JSON command output: ${output}`);
  return parsed.at(-1);
}

function assertReadyResult(result) {
  assert.equal(result.schema_version, RUNTIME_SCHEMA_VERSION);
  assert.equal(result.contract, RUNTIME_CONTRACT);
  assert.equal(result.state, "ready");
  assert.equal(result.verified, true);
  assert.equal(result.effective_url, `http://127.0.0.1:${result.ui_port}`);
  assert(Number.isInteger(result.supervisor_pid));
  assert.deepEqual(
    result.children.map((child) => child.role).sort(),
    ["bridge", "ui"],
  );
  for (const child of result.children) {
    assert(Number.isInteger(child.pid) && child.pid > 0);
    assert.equal(child.state, "ready");
    assert.equal(isProcessAlive(child.pid), true);
  }
}

async function assertReadyEndpoints(
  ready,
  environment,
  scenario,
  managed,
  registeredRepositories,
) {
  const uiHealth = await fetchJson(`${ready.effective_url}/api/healthz`);
  assert.equal(uiHealth.statusCode, 200);
  assert.equal(uiHealth.body.runtime_instance_id, ready.instance_id);
  assert.equal(uiHealth.body.status, "ready");
  assertSourceRuntimeDiagnostics(uiHealth.body);

  const rootResponse = await fetch(`${ready.effective_url}/`, {
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(rootResponse.status, 200, "real UI root must render successfully");
  await rootResponse.arrayBuffer();

  const bridgeHealth = await fetchJson(`http://127.0.0.1:${ready.bridge_port}/healthz`);
  assert.equal(bridgeHealth.statusCode, 200);
  assert.equal(bridgeHealth.body.runtime_instance_id, ready.instance_id);
  assert.equal(bridgeHealth.body.ok, true);
  assert.equal(bridgeHealth.body.mode, "http");
  assert.equal(bridgeHealth.body.live_core_status, "ready");
  assertSourceRuntimeDiagnostics(bridgeHealth.body);
  assertPublicSafe(JSON.stringify(uiHealth.body), "UI health response");
  assertPublicSafe(JSON.stringify(bridgeHealth.body), "bridge health response");
  await assertSupervisedMcpAdapterSplit({
    environment,
    ready,
    scenario,
    managed,
    registeredRepositories,
  });
}

async function assertSupervisedMcpAdapterSplit({
  environment,
  ready,
  scenario,
  managed,
  registeredRepositories,
}) {
  const values = buildSupervisorChildValues({
    role: "bridge",
    environment,
    paths: { bridgeEnvironment: path.join(scenario.stateDirectory, "bridge-supervisor.env") },
    instanceId: ready.instance_id,
    effectiveUrl: ready.effective_url,
    port: ready.bridge_port,
  });
  const childEnvironment = buildRuntimeChildEnvironment({
    role: "bridge",
    ambientEnvironment: environment,
    values,
  });
  assert.equal(values.AUGNES_CORE_MODE, "http");
  assert.equal(values.AUGNES_API_BASE_URL, ready.effective_url);
  assert.equal(values.AUGNES_ENABLE_AGENT_BRIDGE, "true");
  assert.equal(values.AUGNES_RUNTIME_INSTANCE_ID, ready.instance_id);
  assert.equal(childEnvironment.AUGNES_CORE_MODE, "http");
  assert.equal(childEnvironment.AUGNES_API_BASE_URL, ready.effective_url);
  assert.equal(childEnvironment.AUGNES_ENABLE_AGENT_BRIDGE, "true");
  assert.equal(childEnvironment.AUGNES_RUNTIME_INSTANCE_ID, ready.instance_id);
  assert.equal(Object.hasOwn(childEnvironment, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(childEnvironment, "OPENAI_MODEL"), false);

  const access = JSON.parse(readFileSync(path.join(scenario.stateDirectory, "companion-access.json"), "utf8"));
  await assertPrivateCompanionBridgeV01({ ready, proxyToken: access.proxy_token });

  const sourceBlindResult = await withLiveCompanionProxyV01({
    environment,
    manifestPath: path.join(scenario.stateDirectory, "runtime.json"),
    run: async ({ tools, callRepository, callExecution }) => {
      const unregistered = await assertReadOnlyRepositoryCallV01({
        repositoryRoot: repoRoot,
        callRepository,
        verifyProjectFiles: false,
      });
      const positivePath = await assertRegisteredRepositoryPositivePathV01({
        repositories: registeredRepositories,
        callRepository,
        callExecution,
      });
      return { tools, call: unregistered, positivePath };
    },
  });
  assert.equal(sourceBlindResult.tools.some((tool) => tool.name === "augnes_resume_repository"), true);
  assert.notEqual(sourceBlindResult.call.isError, true);
  assert.equal(sourceBlindResult.call.structuredContent?.companion?.status, "live");
  assert.equal(sourceBlindResult.call.structuredContent?.repository_resolution?.status, "project_not_registered");
  assert.equal(sourceBlindResult.positivePath.verified, true);
  registeredRepositoryMcpEvidence = sourceBlindResult.positivePath;

  const mcpPublicOutput = JSON.stringify({ sourceBlindResult });
  assertPublicSafe(mcpPublicOutput, "real MCP tool results");
  assert.equal(mcpPublicOutput.includes("claim-augnes-app-01"), false);
  const legacyRoutePattern = /\b(?:GET|POST)\s+\/(?:search|working-view|casefile|strategy|boundary-packet|continuity-report|repo\/navigate|governance-audit)(?:[?\s]|$)/g;
  const legacyRequests = managed.output().match(legacyRoutePattern) ?? [];
  legacyRootRequestCount += legacyRequests.length;
  assert.deepEqual(
    legacyRequests,
    [],
    "legacy public MCP tools must not target proposed dev-read API paths on the root runtime",
  );
  mcpBehaviorVerified = true;
}

async function withLiveCompanionProxyV01({ environment, manifestPath, run }) {
  const { Client } = requireMcpSdk("@modelcontextprotocol/sdk/client/index.js");
  const { StdioClientTransport } = requireMcpSdk("@modelcontextprotocol/sdk/client/stdio.js");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(repoRoot, "plugins", "augnes-operator", "mcp", "companion-proxy.mjs")],
    cwd: repoRoot,
    env: { ...environment, AUGNES_RUNTIME_STATE_DIR: path.dirname(manifestPath) },
    stderr: "pipe",
  });
  const client = new Client({
    name: "augnes-runtime-operability-stdio",
    version: "0.1.0",
  });
  let stderr = "";
  transport.stderr?.setEncoding("utf8");
  transport.stderr?.on("data", (chunk) => { stderr += chunk; });
  const cancel = () => transport.close();
  try {
    await withTimeout(client.connect(transport), 15_000, "official stdio MCP client connect", cancel);
    if (transport.pid) observedOwnedPids.add(transport.pid);
    const tools = await withTimeout(client.listTools(), 15_000, "official stdio MCP tools/list", cancel);
    const callRepository = (repositoryRoot) => withTimeout(client.callTool({
      name: "augnes_resume_repository",
      arguments: { repositoryRoot },
    }), 20_000, "official stdio MCP tools/call", cancel);
    const callExecution = (name, args) => withTimeout(client.callTool({
      name,
      arguments: args,
    }), 20_000, `official stdio MCP ${name}`, cancel);
    return await run({ tools: tools.tools, callRepository, callExecution });
  } finally {
    await withTimeout(client.close(), 10_000, "official stdio MCP client close", cancel).catch(() => {});
  }
}

async function assertRegisteredRepositoryPositivePathV01({
  repositories,
  callRepository,
  callExecution,
}) {
  const clock = advancingClockV01();
  const registeredA = await registerRepositoryThroughOnboardingV01({
    repositoryRoot: repositories.repositoryA,
    displayName: "CDX2B1 Runtime Repository A",
    createUuids: [
      registeredRuntimeWorkspaceId.slice("workspace:".length),
      registeredRuntimeProjectAId.slice("project:".length),
    ],
    clock,
  });
  assert.equal(registeredA.workspace.workspace_id, registeredRuntimeWorkspaceId);
  assert.equal(registeredA.project.project_id, registeredRuntimeProjectAId);

  const initialDefinition = {
    goal: "Create the CDX2B1 positive-path continuity fixture.",
    success_criteria: [
      "The registered repository resolves through the live Companion.",
      "Codex and Browser read the same current work.",
      "A Browser-side revision changes the refreshed Codex binding.",
    ],
    non_goals: ["Do not Start or execute work."],
  };
  const initial = defineFixtureWorkV01({
    workspaceId: registeredA.workspace.workspace_id,
    projectId: registeredA.project.project_id,
    definition: initialDefinition,
    clock,
  });
  assertNonExecutingProductMutationV01(initial);

  const initialRead = await assertReadOnlyRepositoryCallV01({
    repositoryRoot: repositories.repositoryA,
    callRepository,
  });
  assertExactRegisteredRepositoryResultV01({
    result: initialRead,
    workspaceId: registeredA.workspace.workspace_id,
    projectId: registeredA.project.project_id,
    displayName: registeredA.project.display_name,
    definition: initialDefinition,
  });
  const initialContinuity = initialRead.structuredContent.continuity;
  assert.equal(initialContinuity.project.status, "active_project");
  assert.equal(initialContinuity.project.active, true);
  assert.equal(initialContinuity.current_work.currentness, "fresh");
  assert.equal(initialContinuity.current_work.start_eligible, true);
  assert.equal(initialContinuity.next_action.kind, "start_current_work");
  assert.equal(initialContinuity.managed_execution.stage, "no_run");

  const projectTreeBeforePreparation = snapshotDirectoryContentV01(
    repositories.repositoryA,
  );
  const initialPreparation = await callExecution(
    "augnes_prepare_repository_execution",
    { repositoryRoot: repositories.repositoryA },
  );
  assert.notEqual(initialPreparation.isError, true);
  assert.equal(initialPreparation.structuredContent.status, "prepared");
  assert.equal(initialPreparation.structuredContent.reason, "ready");
  assert.equal(
    Object.values(initialPreparation.structuredContent.authority).every(
      (value) => value === false,
    ),
    true,
  );
  assert.deepEqual(
    snapshotDirectoryContentV01(repositories.repositoryA),
    projectTreeBeforePreparation,
    "attachment preparation must not mutate project A files",
  );
  const initialAttachment = initialPreparation.structuredContent.attachment;
  assert(initialAttachment?.attachment_id);

  const registeredB = await registerRepositoryThroughOnboardingV01({
    repositoryRoot: repositories.repositoryB,
    displayName: "CDX2B2A Runtime Repository B",
    createUuids: [registeredRuntimeProjectBId.slice("project:".length)],
    clock,
  });
  assert.equal(registeredB.workspace.workspace_id, registeredRuntimeWorkspaceId);
  assert.equal(registeredB.project.project_id, registeredRuntimeProjectBId);
  const selectedB = readFixtureSelectionV01();
  assert.equal(selectedB.project_id, registeredRuntimeProjectBId);

  const selectionCoupledRead = await assertReadOnlyRepositoryCallV01({
    repositoryRoot: repositories.repositoryA,
    callRepository,
  });
  assertExactRegisteredRepositoryResultV01({
    result: selectionCoupledRead,
    workspaceId: registeredA.workspace.workspace_id,
    projectId: registeredA.project.project_id,
    displayName: registeredA.project.display_name,
    definition: initialDefinition,
  });
  const selectionCoupledContinuity = selectionCoupledRead.structuredContent.continuity;
  assert.equal(selectionCoupledContinuity.project.status, "inactive_project");
  assert.equal(selectionCoupledContinuity.project.active, false);
  assert.equal(selectionCoupledContinuity.current_work.start_eligible, false);
  assert.equal(selectionCoupledContinuity.current_work.start_blocker, "The project is not active.");

  const afterSelectionPreparation = await callExecution(
    "augnes_prepare_repository_execution",
    { repositoryRoot: repositories.repositoryA },
  );
  assert.equal(
    afterSelectionPreparation.structuredContent.attachment.binding_fingerprint,
    initialAttachment.binding_fingerprint,
  );
  writeFileSync(
    path.join(repositories.repositoryB, "unrelated-b-change.txt"),
    "repository B only\n",
    "utf8",
  );
  const afterBChangePreparation = await callExecution(
    "augnes_prepare_repository_execution",
    { repositoryRoot: repositories.repositoryA },
  );
  assert.equal(
    afterBChangePreparation.structuredContent.attachment.binding_fingerprint,
    initialAttachment.binding_fingerprint,
  );

  selectFixtureProjectV01(registeredA.project.project_id);

  const revisedDefinition = {
    goal: "Refresh the CDX2B2A selection-independent attachment fixture.",
    success_criteria: [
      "The refreshed live Companion returns the revised current work.",
      "The exact snapshot binding changes after Browser-side revision.",
      "Repository A remains attached while Browser selects repository B.",
    ],
    non_goals: ["Do not Start or execute work."],
  };
  const revised = reviseFixtureWorkV01({
    workspaceId: registeredA.workspace.workspace_id,
    projectId: registeredA.project.project_id,
    currentPacket: initial.packet,
    definition: revisedDefinition,
    clock,
  });
  assertNonExecutingProductMutationV01(revised);
  assert.notEqual(revised.packet.packet_id, initial.packet.packet_id);
  assert.notEqual(
    revised.packet.integrity.fingerprint,
    initial.packet.integrity.fingerprint,
  );

  const staleValidation = await callExecution(
    "augnes_validate_repository_execution_attachment",
    { attachmentId: initialAttachment.attachment_id },
  );
  assert.equal(staleValidation.structuredContent.status, "validated");
  assert.equal(staleValidation.structuredContent.attachment.lifecycle, "stale");
  assert.equal(staleValidation.structuredContent.attachment.stale_reason, "packet_changed");

  const revisedRead = await assertReadOnlyRepositoryCallV01({
    repositoryRoot: repositories.repositoryA,
    callRepository,
  });
  assertExactRegisteredRepositoryResultV01({
    result: revisedRead,
    workspaceId: registeredA.workspace.workspace_id,
    projectId: registeredA.project.project_id,
    displayName: registeredA.project.display_name,
    definition: revisedDefinition,
  });
  const revisedContinuity = revisedRead.structuredContent.continuity;
  assert.equal(
    revisedContinuity.current_work.lineage_kind,
    "pre_execution_user_revision",
  );
  assert.notEqual(
    revisedContinuity.snapshot.binding,
    initialContinuity.snapshot.binding,
  );
  assert.equal(revisedContinuity.managed_execution.stage, "no_run");

  const revisedPreparation = await callExecution(
    "augnes_prepare_repository_execution",
    { repositoryRoot: repositories.repositoryA },
  );
  assert.equal(revisedPreparation.structuredContent.status, "prepared");
  const dbBeforeReplacement = openFixtureDatabaseV01();
  const baselineCountBeforeReplacement = dbBeforeReplacement.prepare(
    "SELECT COUNT(*) AS count FROM vnext_physical_root_baselines",
  ).get().count;
  dbBeforeReplacement.close();
  renameSync(repositories.repositoryA, `${repositories.repositoryA}-original`);
  mkdirSync(repositories.repositoryA, { recursive: true });
  writeFileSync(
    path.join(repositories.repositoryA, "fixture.txt"),
    "CDX2B2A same-path replacement fixture\n",
  );
  initializeGitFixtureV01(repositories.repositoryA);
  const replacementPreparation = await callExecution(
    "augnes_prepare_repository_execution",
    { repositoryRoot: repositories.repositoryA },
  );
  assert.equal(replacementPreparation.structuredContent.status, "blocked");
  assert.equal(replacementPreparation.structuredContent.reason, "physical_root_mismatch");
  const dbAfterReplacement = openFixtureDatabaseV01();
  assert.equal(
    dbAfterReplacement.prepare("SELECT COUNT(*) AS count FROM vnext_physical_root_baselines").get().count,
    baselineCountBeforeReplacement,
  );
  assert.equal(
    dbAfterReplacement.prepare("SELECT COUNT(*) AS count FROM vnext_repository_execution_attachments WHERE lifecycle = 'prepared'").get().count,
    0,
  );
  assert.equal(
    dbAfterReplacement.prepare("SELECT COUNT(*) AS count FROM autonomy_runs").get().count,
    0,
  );
  dbAfterReplacement.close();

  assert.deepEqual(
    listFilesRecursively(temporaryRoot).filter((file) =>
      /\.(?:db|sqlite|sqlite3)$/u.test(file)
    ),
    [databasePath],
    "the stdio proxy must not create a Codex-only database copy",
  );

  return {
    verified: true,
    repository_status:
      revisedRead.structuredContent.repository_resolution.status,
    initial_binding: initialContinuity.snapshot.binding,
    revised_binding: revisedContinuity.snapshot.binding,
    selection_coupled_binding: selectionCoupledContinuity.snapshot.binding,
    repository_attachment_binding: initialAttachment.binding_fingerprint,
    attachment_stale_reason: staleValidation.structuredContent.attachment.stale_reason,
    same_path_replacement_blocked: true,
    revision_refresh: true,
    selection_coupling: true,
    selection_independent_attachment: true,
    read_database_mutations: 0,
    read_project_file_mutations: 0,
    codex_only_database_copies: 0,
    browser_process_required: false,
    start_or_execution_created: false,
  };
}

async function registerRepositoryThroughOnboardingV01({
  repositoryRoot,
  displayName,
  createUuids,
  clock,
}) {
  const nowMs = Date.now();
  const picked = await pickAndInspectLocalProjectV01({
    environment: {
      ...process.env,
      AUGNES_CANONICAL_TEST_MODE: "1",
      AUGNES_CANONICAL_TEMP_ROOT: temporaryRoot,
      AUGNES_TEST_FOLDER_PICKER_PATH: repositoryRoot,
    },
    open_database: openFixtureDatabaseV01,
    now: clock.now,
    now_ms: () => nowMs,
    create_token: () => `selection:${path.basename(repositoryRoot)}`,
  });
  assert.equal(picked.status, "selected");
  const uuidQueue = [...createUuids];
  const db = openFixtureDatabaseV01();
  try {
    const confirmed = await confirmLocalProjectOnboardingV01(db, {
      selection_token: picked.selection_token,
      inspection_fingerprint: picked.inspection.inspection_fingerprint,
      display_name: displayName,
    }, {
      now: clock.now,
      now_ms: () => nowMs,
      create_uuid: () => {
        const next = uuidQueue.shift();
        assert(next, "canonical onboarding requested an unexpected identity");
        return next;
      },
    });
    assert.equal(uuidQueue.length, 0);
    assert.equal(confirmed.status, "created");
    const workspace = readDefaultWorkspaceIdentityV01(db);
    assert(workspace);
    const selection = readActiveProjectSelectionV01(db, workspace.workspace_id);
    assert.equal(selection?.project_id, confirmed.project.project_id);
    return { workspace, project: confirmed.project, selection };
  } finally {
    db.close();
  }
}

function defineFixtureWorkV01({ workspaceId, projectId, definition, clock }) {
  const db = openFixtureDatabaseV01();
  try {
    const config = fixtureOperatorConfigV01(workspaceId, projectId);
    const selection = readActiveProjectSelectionV01(db, workspaceId);
    assert.equal(selection?.project_id, projectId);
    const credential = issueFixtureOperatorCredentialV01(db, config, clock);
    return defineInitialProjectWorkV01(db, {
      config,
      credential,
      request: {
        action: "define_initial_project_work",
        workspace_id: workspaceId,
        project_id: projectId,
        expected_active_project_id: projectId,
        expected_active_selection_revision: selection.selection_revision,
        expected_initialization_state: "not_defined",
        ...definition,
      },
      clock,
    });
  } finally {
    db.close();
  }
}

function reviseFixtureWorkV01({
  workspaceId,
  projectId,
  currentPacket,
  definition,
  clock,
}) {
  const db = openFixtureDatabaseV01();
  try {
    const config = fixtureOperatorConfigV01(workspaceId, projectId);
    const selection = readActiveProjectSelectionV01(db, workspaceId);
    assert.equal(selection?.project_id, projectId);
    const credential = issueFixtureOperatorCredentialV01(db, config, clock);
    return revisePreExecutionProjectWorkV01(db, {
      config,
      credential,
      request: {
        action: "revise_pre_execution_project_work",
        workspace_id: workspaceId,
        project_id: projectId,
        expected_active_project_id: projectId,
        expected_active_selection_revision: selection.selection_revision,
        expected_current_packet_id: currentPacket.packet_id,
        expected_current_packet_fingerprint:
          currentPacket.integrity.fingerprint,
        expected_current_lineage_kind: "initial_user_defined",
        ...definition,
      },
      clock,
    });
  } finally {
    db.close();
  }
}

function issueFixtureOperatorCredentialV01(db, config, clock) {
  const issued = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
  return consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: issued.bootstrap_token,
    clock,
  }).credential;
}

function fixtureOperatorConfigV01(workspaceId, projectId) {
  return {
    enabled: true,
    workspace_id: workspaceId,
    project_id: projectId,
    operator_id: registeredRuntimeOperatorId,
    database_path: databasePath,
  };
}

function readFixtureSelectionV01() {
  const db = openFixtureDatabaseV01();
  try {
    const selection = readActiveProjectSelectionV01(
      db,
      registeredRuntimeWorkspaceId,
    );
    assert(selection);
    return selection;
  } finally {
    db.close();
  }
}

function selectFixtureProjectV01(projectId) {
  const db = openFixtureDatabaseV01();
  try {
    const active = readActiveProjectSelectionV01(
      db,
      registeredRuntimeWorkspaceId,
    );
    assert(active);
    if (active.project_id === projectId) return active;
    return selectActiveProjectV01(db, {
      workspace_id: registeredRuntimeWorkspaceId,
      project_id: projectId,
      expected_project_id: active.project_id,
      expected_revision: active.selection_revision,
      now: new Date().toISOString(),
    });
  } finally {
    db.close();
  }
}

function openFixtureDatabaseV01() {
  const db = new Database(databasePath, { fileMustExist: true });
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  return db;
}

function advancingClockV01() {
  let milliseconds = Date.now();
  return { now: () => new Date(++milliseconds).toISOString() };
}

async function assertReadOnlyRepositoryCallV01({
  repositoryRoot,
  callRepository,
  verifyProjectFiles = true,
}) {
  const databaseBefore = snapshotDatabaseFamily(databasePath);
  const repositoryBefore = verifyProjectFiles
    ? snapshotDirectoryContentV01(repositoryRoot)
    : null;
  const result = await callRepository(repositoryRoot);
  assert.deepEqual(
    snapshotDatabaseFamily(databasePath),
    databaseBefore,
    "a repository continuity MCP read must not mutate the canonical database",
  );
  if (verifyProjectFiles) {
    assert.deepEqual(
      snapshotDirectoryContentV01(repositoryRoot),
      repositoryBefore,
      "a repository continuity MCP read must not mutate project files",
    );
  }
  return result;
}

function assertExactRegisteredRepositoryResultV01({
  result,
  workspaceId,
  projectId,
  displayName,
  definition,
}) {
  assert.notEqual(
    result.isError,
    true,
    `registered repository MCP call failed: ${JSON.stringify(result)}`,
  );
  const projection = result.structuredContent;
  assert.equal(projection.companion.status, "live");
  assert.equal(projection.repository_resolution.status, "resolved_exact");
  assert.equal(projection.repository_resolution.display_name, displayName);
  assert.equal(
    projection.repository_resolution.project_key,
    publicProjectKeyV01(workspaceId, projectId),
  );
  assert(projection.continuity);
  assert.equal(
    projection.continuity.projection_version,
    "codex_current_continuity.v0.1",
  );
  assert.equal(projection.continuity.source_status, "exact");
  assert.equal(projection.continuity.snapshot.status, "exact");
  assert.match(
    projection.continuity.snapshot.binding,
    /^sha256:[a-f0-9]{64}$/u,
  );
  assert.equal(
    projection.continuity.project.project_key,
    projection.repository_resolution.project_key,
  );
  assert.equal(projection.continuity.current_work.goal, definition.goal);
  assert.deepEqual(
    [...projection.continuity.current_work.success_criteria].sort(),
    [...definition.success_criteria].sort(),
  );
  assert.deepEqual(
    [...projection.continuity.current_work.non_goals].sort(),
    [...definition.non_goals].sort(),
  );
  assertAllAuthorityFlagsFalseV01(projection.authority);
  assertAllAuthorityFlagsFalseV01(projection.continuity.authority);
}

function publicProjectKeyV01(workspaceId, projectId) {
  const canonical = canonicalizeProtocolValueV01({
    purpose: "codex-current-continuity-public-project-key.v0.1",
    workspace_id: workspaceId,
    project_id: projectId,
  });
  return `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
}

function assertAllAuthorityFlagsFalseV01(authority) {
  assert(authority && typeof authority === "object");
  assert.equal(Object.values(authority).length > 0, true);
  assert.equal(
    Object.values(authority).every((value) => value === false),
    true,
  );
}

function assertNonExecutingProductMutationV01(result) {
  for (const key of [
    "run_created",
    "provider_called",
    "project_files_written",
    "proposal_created",
    "review_decision_created",
    "transition_created",
    "semantic_state_changed",
    "execution_started",
    "semantic_authority_granted",
    "execution_authority_granted",
  ]) {
    assert.equal(result[key], false, key);
  }
}

async function assertPrivateCompanionBridgeV01({ ready, proxyToken }) {
  const endpoint = `http://127.0.0.1:${ready.bridge_port}/mcp`;
  const requestBody = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "privacy-test", version: "0.1.0" } } });
  const cases = [
    { name: "hostile origin", headers: { host: `127.0.0.1:${ready.bridge_port}`, origin: "https://attacker.example", "x-augnes-companion-proxy": proxyToken } },
    { name: "hostile host", headers: { host: "attacker.example", "x-augnes-companion-proxy": proxyToken } },
    { name: "dns rebinding host", headers: { host: "127.0.0.1.attacker.example", "x-augnes-companion-proxy": proxyToken } },
    { name: "missing credential", headers: { host: `127.0.0.1:${ready.bridge_port}` } },
    { name: "invalid credential", headers: { host: `127.0.0.1:${ready.bridge_port}`, "x-augnes-companion-proxy": "invalid" } },
  ];
  for (const testCase of cases) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", ...testCase.headers },
      body: requestBody,
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(response.status, 403, testCase.name);
    assert.equal(response.headers.get("access-control-allow-origin"), null, testCase.name);
    assert.deepEqual(await response.json(), { error: "companion_channel_refused" }, testCase.name);
  }
  const preflight = await fetch(endpoint, {
    method: "OPTIONS",
    headers: {
      host: `127.0.0.1:${ready.bridge_port}`,
      origin: "https://attacker.example",
      "access-control-request-method": "POST",
      "x-augnes-companion-proxy": proxyToken,
    },
    signal: AbortSignal.timeout(5_000),
  });
  assert.equal(preflight.status, 403);
  assert.equal(preflight.headers.get("access-control-allow-origin"), null);
  assert.deepEqual(await preflight.json(), { error: "companion_channel_refused" });
}

function assertOwnershipFiles(stateDirectory, ready) {
  const expected = [
    "bridge-supervisor.env",
    "companion-access.json",
    "control-token.json",
    "owner.lock",
    "runtime.json",
  ];
  assert.deepEqual(readdirSync(stateDirectory).sort(), expected);
  const directoryMode = statSync(stateDirectory).mode & 0o777;
  if (process.platform !== "win32") assert.equal(directoryMode, 0o700);
  for (const name of expected) {
    const filePath = path.join(stateDirectory, name);
    const mode = statSync(filePath).mode & 0o777;
    if (process.platform !== "win32") assert.equal(mode, 0o600, `${name} must be mode 0600`);
    const contents = readFileSync(filePath, "utf8");
    assertPublicSafe(contents, `${name} contents`);
    if (name === "bridge-supervisor.env") {
      assert.equal(contents, "", "the bridge dotenv isolation file must remain empty");
    }
  }
  const manifest = JSON.parse(readFileSync(path.join(stateDirectory, "runtime.json"), "utf8"));
  const controlToken = JSON.parse(readFileSync(path.join(stateDirectory, "control-token.json"), "utf8"));
  const companionAccess = JSON.parse(readFileSync(path.join(stateDirectory, "companion-access.json"), "utf8"));
  assert.equal(companionAccess.access_version, "augnes-companion-proxy-access.v0.1");
  assert.equal(typeof companionAccess.proxy_token, "string");
  assert.notEqual(companionAccess.proxy_token, controlToken.token);
  assert.notEqual(companionAccess.proxy_token, controlToken.child_ownership_token);
  assert.equal("token" in companionAccess, false);
  assert.equal("child_ownership_token" in companionAccess, false);
  assert.equal(manifest.instance_id, ready.instance_id);
  assert.equal(manifest.supervisor_pid, ready.supervisor_pid);
  assert.equal(manifest.lifecycle_state, "ready");
  assert.equal(manifest.control_host, "127.0.0.1");
  assert(Number.isInteger(manifest.control_port));
  assert.equal(manifest.effective_url, ready.effective_url);
  assert.deepEqual(
    manifest.children.map(({ ownership_port: _ownershipPort, ...child }) => child),
    ready.children,
  );
  for (const child of manifest.children) {
    assert(Number.isInteger(child.ownership_port) && child.ownership_port > 0);
    assert.equal(
      ready.children.some((publicChild) => "ownership_port" in publicChild),
      false,
      "private ownership listener ports must stay out of normal output",
    );
  }
  assert.equal("token" in manifest, false, "public ownership manifest must exclude control token");
  assert.equal("database_path" in manifest, false, "manifest must exclude database path");
  return manifest;
}

async function assertStoppedScenario(scenario, ready, processTree) {
  await waitForPortClosed(ready.ui_port);
  await waitForPortClosed(ready.bridge_port);
  await waitForPidsExit(processTree, 10_000);
  assertNoRuntimeStateFiles(scenario.stateDirectory);
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    assert.equal(
      existsSync(`${databasePath}${suffix}`),
      false,
      `disposable database side file must be closed after lifecycle test: ${suffix}`,
    );
  }
}

function assertNoRuntimeStateFiles(stateDirectory) {
  if (!existsSync(stateDirectory)) return;
  const files = listFilesRecursively(stateDirectory);
  assert.deepEqual(files, [], `runtime state must be empty after cleanup: ${files.join(", ")}`);
}

function assertRuntimeDistributionContract() {
  const applicationScopeFingerprint = "b".repeat(64);
  const buildIdentity = `sha256:${"a".repeat(64)}`;
  const packagePlatform = detectDistributablePlatform();
  const manifest = {
    contract: "augnes.distributable.v1",
    package_contract_version: DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
    application_version: applicationVersion,
    build_identity: buildIdentity,
    application_scope_fingerprint: applicationScopeFingerprint,
    platform: packagePlatform,
    runtime: {
      node_minimum: process.versions.node,
      node_modules_abi: process.versions.modules,
      node_napi: process.versions.napi,
      runtime_contract: RUNTIME_CONTRACT,
      runtime_schema_version: RUNTIME_SCHEMA_VERSION,
    },
    database: {
      schema_compatibility: DISTRIBUTABLE_DATABASE_SCHEMA_COMPATIBILITY,
      schema_contract: DISTRIBUTABLE_DATABASE_SCHEMA_CONTRACT,
      schema_signature: canonicalStructuralSchemaContractSignature(),
      migration_contract: DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT,
      migration_contract_version:
        DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT_VERSION,
      migration_ids: [...DISTRIBUTABLE_DATABASE_MIGRATION_IDS],
      record_contract: DISTRIBUTABLE_DATABASE_RECORD_CONTRACT,
      record_contract_version:
        DISTRIBUTABLE_DATABASE_RECORD_CONTRACT_VERSION,
      reader_contracts: [...DISTRIBUTABLE_DATABASE_READER_CONTRACTS],
      supported_source_schema_signatures: [
        ...DISTRIBUTABLE_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
      ],
      supported_source_schema_states: ["current", "old"],
    },
  };

  for (const name of ["first", "second"]) {
    const root = path.join(temporaryRoot, `packaged-runtime-${name}`);
    mkdirSync(path.join(root, "bridge", "dist"), { recursive: true });
    writeFileSync(path.join(root, "server.js"), "// packaged UI fixture\n");
    writeFileSync(
      path.join(root, "bridge", "dist", "server.mjs"),
      "// packaged bridge fixture\n",
    );
    writeFileSync(
      path.join(root, "augnes-package.json"),
      `${JSON.stringify(manifest)}\n`,
    );
    const distribution = resolveRuntimeDistribution({ repositoryRootPath: root });
    assert.equal(distribution.mode, "packaged");
    assert.equal(distribution.applicationVersion, applicationVersion);
    assert.equal(distribution.packageContract, "augnes.distributable.v1");
    assert.equal(
      distribution.packageContractVersion,
      DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
    );
    assert.equal(distribution.buildIdentity, buildIdentity);
    assert.equal(
      distribution.applicationScopeFingerprint,
      applicationScopeFingerprint,
      "the same package must keep one application scope across unpack roots",
    );
    assert.equal(
      distribution.packagePlatform,
      formatDistributablePlatformLabel(packagePlatform),
    );
    assert.equal(distribution.databaseSchemaCompatibility, "current");
  }

  const runtime = {
    controlPort: 41_001,
    uiPort: 41_002,
    bridgePort: null,
    children: new Map([
      ["ui", { port: 41_002, ownershipPort: 41_003 }],
    ]),
  };
  assert.equal(runtimeOwnsPort(runtime, 41_001), true);
  assert.equal(runtimeOwnsPort(runtime, 41_002), true);
  assert.equal(runtimeOwnsPort(runtime, 41_003), true);
  assert.equal(runtimeOwnsPort(runtime, 41_004), false);
}

function assertRuntimeUpdateDecisionContract() {
  const databaseSchemaSignature = canonicalStructuralSchemaContractSignature();
  const target = Object.freeze({
    mode: "packaged",
    applicationVersion: "2.0.0",
    buildIdentity: `sha256:${"2".repeat(64)}`,
    applicationScopeFingerprint: "a".repeat(64),
    packageContract: "augnes.distributable.v1",
    packageContractVersion: DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
    packagePlatform: "darwin-arm64",
    runtimeContract: RUNTIME_CONTRACT,
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    databaseSchemaContract: DISTRIBUTABLE_DATABASE_SCHEMA_CONTRACT,
    databaseSchemaSignature,
    databaseMigrationContract: DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT,
    databaseMigrationContractVersion:
      DISTRIBUTABLE_DATABASE_MIGRATION_CONTRACT_VERSION,
    databaseMigrationIds: [...DISTRIBUTABLE_DATABASE_MIGRATION_IDS],
    databaseRecordContract: DISTRIBUTABLE_DATABASE_RECORD_CONTRACT,
    databaseRecordContractVersion:
      DISTRIBUTABLE_DATABASE_RECORD_CONTRACT_VERSION,
    databaseReaderContracts: [...DISTRIBUTABLE_DATABASE_READER_CONTRACTS],
  });
  const existing = Object.freeze({
    application_version: "1.9.0",
    build_identity: `sha256:${"1".repeat(64)}`,
    application_scope_fingerprint: target.applicationScopeFingerprint,
    package_contract: target.packageContract,
    package_contract_version: target.packageContractVersion,
    package_platform: target.packagePlatform,
    runtime_contract: target.runtimeContract,
    runtime_schema_version: target.runtimeSchemaVersion,
    database_schema_contract: target.databaseSchemaContract,
    database_schema_signature: target.databaseSchemaSignature,
    database_migration_contract: target.databaseMigrationContract,
    database_migration_contract_version:
      target.databaseMigrationContractVersion,
    database_migration_ids: [...target.databaseMigrationIds],
    database_record_contract: target.databaseRecordContract,
    database_record_contract_version: target.databaseRecordContractVersion,
    database_reader_contracts: [...target.databaseReaderContracts],
  });

  assert.deepEqual(
    classifyRuntimeUpdate(
      {
        ...existing,
        application_version: target.applicationVersion,
        build_identity: target.buildIdentity,
      },
      target,
    ),
    { outcome: "no_update_required" },
    "the same verified build and contracts must be an idempotent no-op",
  );

  assert.deepEqual(classifyRuntimeUpdate(existing, target), {
    outcome: "update_ready",
    source_application_version: existing.application_version,
    source_build_identity: existing.build_identity,
    package_contract: existing.package_contract,
    package_contract_version: existing.package_contract_version,
    runtime_contract: existing.runtime_contract,
    runtime_schema_version: existing.runtime_schema_version,
    target_application_version: target.applicationVersion,
    target_build_identity: target.buildIdentity,
  });
  assert.equal(
    classifyRuntimeUpdate(
      { ...existing, package_contract_version: 1 },
      target,
    ).outcome,
    "update_ready",
    "the strict #1118 v1 package manifest must have one explicit handoff to the v2 recovery contract",
  );
  assert.equal(
    classifyRuntimeUpdate(
      { ...existing, application_version: target.applicationVersion },
      target,
    ).outcome,
    "incompatible_package",
    "an unordered different build of the same application version must fail closed",
  );
  assert.equal(
    classifyRuntimeUpdate(
      {
        ...existing,
        database_schema_signature: "0".repeat(64),
        database_reader_contracts: ["project_home.previous"],
      },
      {
        ...target,
        databaseMigrationIds: [
          ...target.databaseMigrationIds,
          "0002_additive_fixture",
        ],
      },
    ).outcome,
    "update_ready",
    "an additive target must hand off an exact-owned older schema so the real database inspector can stage its supported migration",
  );

  assert.deepEqual(
    classifyRuntimeUpdate(
      { ...existing, application_version: "2.1.0" },
      target,
    ),
    { outcome: "unsupported_downgrade" },
  );
  assert.deepEqual(
    classifyRuntimeUpdate(
      { ...existing, application_version: "2.0.0" },
      { ...target, applicationVersion: "2.0.0-rc.1" },
    ),
    { outcome: "unsupported_downgrade" },
    "a stable release must not be replaced by its prerelease",
  );
  assert.equal(
    classifyRuntimeUpdate(
      { ...existing, application_version: "2.0.0-rc.2" },
      { ...target, applicationVersion: "2.0.0-rc.10" },
    ).outcome,
    "update_ready",
    "numeric prerelease identifiers must use SemVer numeric precedence",
  );
  assert.equal(
    classifyRuntimeUpdate(
      { ...existing, application_version: "2.0.0-alpha" },
      { ...target, applicationVersion: "2.0.0-alpha.1" },
    ).outcome,
    "update_ready",
    "a longer equal-prefix prerelease must sort after its prefix",
  );

  for (const [label, existingOverride, targetOverride] of [
    ["application scope", { application_scope_fingerprint: "b".repeat(64) }, {}],
    ["package contract", { package_contract: "augnes.distributable.v0" }, {}],
    ["package contract version", { package_contract_version: 999 }, {}],
    ["runtime contract", { runtime_contract: "augnes.runtime.v0" }, {}],
    ["runtime schema", { runtime_schema_version: 999 }, {}],
    ["database schema contract", { database_schema_contract: "invalid" }, {}],
    ["database migration contract", { database_migration_contract: "invalid" }, {}],
    ["database migration version", { database_migration_contract_version: 999 }, {}],
    ["database migration IDs", { database_migration_ids: ["unexpected"] }, {}],
    ["database record contract", { database_record_contract: "invalid" }, {}],
    ["database record version", { database_record_contract_version: 999 }, {}],
    ["invalid source version", { application_version: "2" }, {}],
    ["invalid target version", {}, { applicationVersion: "2" }],
  ]) {
    assert.deepEqual(
      classifyRuntimeUpdate(
        { ...existing, ...existingOverride },
        { ...target, ...targetOverride },
      ),
      { outcome: "incompatible_package" },
      `${label} mismatch must fail closed`,
    );
  }
}

async function assertRecoveryControlDecisionContract() {
  const recoveryBackups = Array.from({ length: 205 }, (_, index) => ({
    backup_id: `backup-${String(index + 1).padStart(3, "0")}`,
  }));
  assert.deepEqual(paginateRecoveryInventory(recoveryBackups, 1), {
    page: 1,
    page_count: 3,
    items: recoveryBackups.slice(0, 100),
  });
  assert.deepEqual(paginateRecoveryInventory(recoveryBackups, 3), {
    page: 3,
    page_count: 3,
    items: recoveryBackups.slice(200),
  });
  assert.deepEqual(
    paginateRecoveryInventory(recoveryBackups, 100),
    {
      page: 3,
      page_count: 3,
      items: recoveryBackups.slice(200),
    },
    "an out-of-range but bounded page must clamp to the last selectable recovery page",
  );
  assert.deepEqual(
    recoveryProtectionDecision({
      inventoryState: "available",
      verifiedBackupCount: 1,
    }),
    {
      backupVerified: true,
      restoreAvailable: true,
      nextAction: "restore_latest_verified_backup",
    },
  );
  assert.deepEqual(
    recoveryProtectionDecision({
      inventoryState: "available",
      verifiedBackupCount: 0,
    }),
    {
      backupVerified: false,
      restoreAvailable: false,
      nextAction: "retry_update_or_continue_current_data",
    },
  );
  assert.deepEqual(
    recoveryProtectionDecision({
      inventoryState: "unavailable",
      verifiedBackupCount: 4,
    }),
    {
      backupVerified: false,
      restoreAvailable: false,
      nextAction: "review_recovery_backup_inventory",
    },
    "an unavailable inventory must never inherit a stale verified count",
  );

  for (const firstCompletion of ["finish", "close"]) {
    const response = new EventEmitter();
    let shutdownCount = 0;
    const runtime = {
      shutdownRequested: false,
      shutdownReason: null,
      exitCode: 2,
      lifecycleState: "failed",
      failure: null,
      lastTransitionAt: new Date(0).toISOString(),
      manifestCreated: false,
      resolveShutdown() {
        shutdownCount += 1;
      },
    };
    requestShutdownAfterResponse(runtime, response);
    response.emit(firstCompletion);
    response.emit(firstCompletion === "finish" ? "close" : "finish");
    await new Promise((resolve) => queueMicrotask(resolve));
    assert.equal(shutdownCount, 1);
    assert.equal(runtime.shutdownRequested, true);
    assert.equal(runtime.shutdownReason, "recovery_action_requested");
    assert.equal(runtime.lifecycleState, "stopping");
    assert.equal(runtime.exitCode, 0);
  }
}

async function assertConcurrentRecoveryRequestRefusal() {
  const runtime = {
    instanceId: "runtime-concurrent-recovery-test",
    childOwnershipToken: "a".repeat(64),
    recoveryRequest: null,
    shutdownRequested: false,
    runtimeDistribution: { mode: "source" },
  };
  const requestUrl = new URL("http://127.0.0.1/v1/recovery");
  const firstRequest = recoveryRequestStream(runtime);
  const firstResponse = recoveryResponseRecorder();
  const firstCompletion = handleRecoveryControlRequest(
    runtime,
    firstRequest,
    firstResponse,
    requestUrl,
  );

  assert.equal(runtime.recoveryRequest?.action, "request_pending");

  const secondRequest = recoveryRequestStream(runtime);
  secondRequest.end('{"action":"create_backup"}');
  const secondResponse = recoveryResponseRecorder();
  await handleRecoveryControlRequest(
    runtime,
    secondRequest,
    secondResponse,
    requestUrl,
  );
  assert.equal(secondResponse.statusCode, 409);
  assert.equal(
    JSON.parse(secondResponse.body).reason_code,
    "recovery_action_in_progress",
  );
  assert.equal(runtime.recoveryRequest?.action, "request_pending");

  firstRequest.end("{}");
  await firstCompletion;
  assert.equal(firstResponse.statusCode, 400);
  assert.equal(runtime.recoveryRequest, null);
}

function recoveryRequestStream(runtime) {
  const request = new PassThrough();
  request.method = "POST";
  request.headers = {
    "x-augnes-child-ownership": runtime.childOwnershipToken,
    "x-augnes-runtime-instance": runtime.instanceId,
  };
  return request;
}

function recoveryResponseRecorder() {
  const response = new EventEmitter();
  response.statusCode = null;
  response.body = null;
  response.writeHead = (statusCode) => {
    response.statusCode = statusCode;
  };
  response.end = (body) => {
    response.body = body;
    response.emit("finish");
  };
  return response;
}

function assertRuntimeEnvironmentIsolation() {
  const bridgeEnvironmentPath = path.join(temporaryRoot, "environment-isolation.env");
  writeFileSync(bridgeEnvironmentPath, "", { mode: 0o600 });
  const ambientEnvironment = {
    ...process.env,
    HOME: homeRoot,
    TMPDIR: tempRoot,
    AUGNES_DB_PATH: databasePath,
    OPENAI_API_KEY: publicSecretSentinel,
    OPENAI_MODEL: publicModelSentinel,
    CODEX_HOME: path.join(tempRoot, "codex-home"),
    CODEX_SQLITE_HOME: path.join(tempRoot, "codex-sqlite-home"),
    GITHUB_TOKEN: publicSecretSentinel,
    GH_TOKEN: publicSecretSentinel,
    ANTHROPIC_API_KEY: publicSecretSentinel,
    AZURE_OPENAI_API_KEY: publicSecretSentinel,
    AWS_ACCESS_KEY_ID: publicSecretSentinel,
    AWS_SECRET_ACCESS_KEY: publicSecretSentinel,
    GOOGLE_API_KEY: publicSecretSentinel,
    HTTP_PROXY: "http://127.0.0.1:9",
    HTTPS_PROXY: "http://127.0.0.1:9",
    ALL_PROXY: "http://127.0.0.1:9",
    NO_PROXY: "poisoned",
    NODE_OPTIONS: `--require=${path.join(tempRoot, "unreviewed-preload.cjs")}`,
    AUGNES_UNRELATED_PARENT_VALUE: publicSecretSentinel,
    AUGNES_CORE_MODE: "file",
    AUGNES_USE_MOCK: "false",
    AUGNES_ENABLE_AGENT_BRIDGE: "false",
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "false",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: "reviewed-workspace",
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: "reviewed-project",
    AUGNES_VNEXT_OPERATOR_ID: "reviewed-operator",
    AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS: "45000",
    AUGNES_VNEXT_OPERATOR_GATE_TTL_MS: "60000",
    ...blockedBridgeFileEnvironment,
    ...reviewedBridgeCompatibilityEnvironment,
  };
  const sharedArguments = {
    paths: { bridgeEnvironment: bridgeEnvironmentPath },
    instanceId: "environment-isolation-instance",
    companionProxyToken: "companion-proxy-token-environment-isolation",
    effectiveUrl: "http://127.0.0.1:3000",
    port: 8787,
  };

  const absentProviderEnvironment = { ...ambientEnvironment };
  delete absentProviderEnvironment.OPENAI_API_KEY;
  delete absentProviderEnvironment.OPENAI_MODEL;
  delete absentProviderEnvironment.CODEX_HOME;
  delete absentProviderEnvironment.CODEX_SQLITE_HOME;
  const absentUiValues = buildSupervisorChildValues({
    role: "ui",
    environment: absentProviderEnvironment,
    ...sharedArguments,
  });
  const absentUiEnvironment = buildRuntimeChildEnvironment({
    role: "ui",
    ambientEnvironment: absentProviderEnvironment,
    values: absentUiValues,
  });
  assert.equal(Object.hasOwn(absentUiEnvironment, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(absentUiEnvironment, "OPENAI_MODEL"), false);
  assert.equal(Object.hasOwn(absentUiEnvironment, "CODEX_HOME"), false);
  assert.equal(Object.hasOwn(absentUiEnvironment, "CODEX_SQLITE_HOME"), false);

  const uiValues = buildSupervisorChildValues({
    role: "ui",
    environment: ambientEnvironment,
    ...sharedArguments,
  });
  assert.equal(uiValues.OPENAI_API_KEY, publicSecretSentinel);
  assert.equal(uiValues.OPENAI_MODEL, publicModelSentinel);
  assert.equal(uiValues.CODEX_HOME, path.join(tempRoot, "codex-home"));
  assert.equal(
    uiValues.CODEX_SQLITE_HOME,
    path.join(tempRoot, "codex-sqlite-home"),
  );
  assert.equal(uiValues.AUGNES_DB_PATH, databasePath);
  assert.equal(uiValues.NODE_ENV, "development");
  assert.equal(uiValues.NODE_OPTIONS, null);
  assert.equal(uiValues.HOSTNAME, null);
  assert.equal(uiValues.PORT, null);
  assert.equal(uiValues.AUGNES_DISTRIBUTION_MODE, "source");
  assert.equal(uiValues.AUGNES_APPLICATION_VERSION, applicationVersion);
  assert.equal(uiValues.AUGNES_COMPANION_PROXY_TOKEN, sharedArguments.companionProxyToken);
  const uiEnvironment = buildRuntimeChildEnvironment({
    role: "ui",
    ambientEnvironment,
    values: uiValues,
  });
  assert.equal(uiEnvironment.OPENAI_API_KEY, publicSecretSentinel);
  assert.equal(uiEnvironment.OPENAI_MODEL, publicModelSentinel);
  assert.equal(uiEnvironment.CODEX_HOME, path.join(tempRoot, "codex-home"));
  assert.equal(
    uiEnvironment.CODEX_SQLITE_HOME,
    path.join(tempRoot, "codex-sqlite-home"),
  );
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED, "false");
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_WORKSPACE_ID, "reviewed-workspace");
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_PROJECT_ID, "reviewed-project");
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_ID, "reviewed-operator");
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS, "45000");
  assert.equal(uiEnvironment.AUGNES_VNEXT_OPERATOR_GATE_TTL_MS, "60000");
  assert.equal(uiEnvironment.AUGNES_COMPANION_PROXY_TOKEN, sharedArguments.companionProxyToken);
  assert.equal(Object.hasOwn(uiEnvironment, "NODE_OPTIONS"), false);

  const bridgeValues = buildSupervisorChildValues({
    role: "bridge",
    environment: ambientEnvironment,
    ...sharedArguments,
  });
  assert.equal(bridgeValues.AUGNES_CORE_MODE, "http");
  assert.equal(bridgeValues.AUGNES_API_BASE_URL, sharedArguments.effectiveUrl);
  assert.equal(bridgeValues.AUGNES_ENABLE_AGENT_BRIDGE, "true");
  assert.equal(bridgeValues.NODE_ENV, "development");
  assert.equal(bridgeValues.NODE_OPTIONS, null);
  assert.equal(bridgeValues.AUGNES_DISTRIBUTION_MODE, "source");
  assert.equal(bridgeValues.AUGNES_APPLICATION_VERSION, applicationVersion);
  assert.equal(bridgeValues.AUGNES_COMPANION_PROXY_TOKEN, sharedArguments.companionProxyToken);
  for (const [key, value] of Object.entries(reviewedBridgeCompatibilityEnvironment)) {
    assert.equal(
      bridgeValues[key],
      key === "AUGNES_APP_TOOL_SURFACE"
        ? "companion_repository_attachment"
        : value,
    );
  }
  const bridgeEnvironment = buildRuntimeChildEnvironment({
    role: "bridge",
    ambientEnvironment,
    values: bridgeValues,
  });
  assert.equal(bridgeEnvironment.AUGNES_CORE_MODE, "http");
  assert.equal(bridgeEnvironment.AUGNES_API_BASE_URL, sharedArguments.effectiveUrl);
  assert.equal(bridgeEnvironment.AUGNES_ENABLE_AGENT_BRIDGE, "true");
  assert.equal(bridgeEnvironment.AUGNES_COMPANION_PROXY_TOKEN, sharedArguments.companionProxyToken);
  assert.equal(Object.hasOwn(bridgeEnvironment, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(bridgeEnvironment, "OPENAI_MODEL"), false);
  assert.equal(Object.hasOwn(bridgeEnvironment, "CODEX_HOME"), false);
  assert.equal(Object.hasOwn(bridgeEnvironment, "CODEX_SQLITE_HOME"), false);
  assert.equal(Object.hasOwn(bridgeEnvironment, "NODE_OPTIONS"), false);
  for (const uiOnlyKey of [
    "AUGNES_DB_PATH",
    "AUGNES_VNEXT_OPERATOR_PILOT_ENABLED",
    "AUGNES_VNEXT_OPERATOR_WORKSPACE_ID",
    "AUGNES_VNEXT_OPERATOR_PROJECT_ID",
    "AUGNES_VNEXT_OPERATOR_ID",
    "AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS",
    "AUGNES_VNEXT_OPERATOR_GATE_TTL_MS",
    "CODEX_HOME",
    "CODEX_SQLITE_HOME",
  ]) {
    assert.equal(Object.hasOwn(bridgeEnvironment, uiOnlyKey), false);
  }

  for (const [role, values, childEnvironment] of [
    ["ui", uiValues, uiEnvironment],
    ["bridge", bridgeValues, bridgeEnvironment],
  ]) {
    assert.deepEqual(
      findForbiddenRuntimeChildEnvironmentKeys({
        role,
        childEnvironment,
        authoredValues: values,
      }),
      [],
    );
    for (const forbidden of [
      "GITHUB_TOKEN",
      "GH_TOKEN",
      "ANTHROPIC_API_KEY",
      "AZURE_OPENAI_API_KEY",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "GOOGLE_API_KEY",
      "HTTP_PROXY",
      "HTTPS_PROXY",
      "ALL_PROXY",
      "NO_PROXY",
      "AUGNES_UNRELATED_PARENT_VALUE",
      "AUGNES_USE_MOCK",
      ...Object.keys(blockedBridgeFileEnvironment),
    ]) {
      assert.equal(
        Object.hasOwn(childEnvironment, forbidden),
        false,
        `${role} child must not inherit ${forbidden}`,
      );
    }
  }

  for (const key of [
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "AUGNES_CORE_MODE",
    "AUGNES_API_BASE_URL",
    "AUGNES_ENABLE_AGENT_BRIDGE",
    "AUGNES_APP_PROFILE",
    "AUGNES_APP_TOOL_SURFACE",
    "AUGNES_APP_DOMAIN",
    "AUGNES_CONNECT_DOMAIN",
    "AUGNES_RESOURCE_DOMAIN",
  ]) {
    assert.equal(
      Object.hasOwn(roleEnvironment(key.startsWith("OPENAI") ? "bridge" : "ui"), key),
      false,
      `${key} must remain limited to its reviewed child role`,
    );
  }

  const packagedDistribution = {
    mode: "packaged",
    applicationVersion,
    packageContract: "augnes.distributable.v1",
    packageContractVersion: DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION,
    buildIdentity: `sha256:${"a".repeat(64)}`,
    applicationScopeFingerprint: "b".repeat(64),
    packagePlatform: formatDistributablePlatformLabel(
      detectDistributablePlatform(),
    ),
    runtimeContract: RUNTIME_CONTRACT,
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    databaseSchemaCompatibility: "current",
  };
  for (const role of ["ui", "bridge"]) {
    const values = buildSupervisorChildValues({
      role,
      environment: ambientEnvironment,
      ...sharedArguments,
      runtimeDistribution: packagedDistribution,
      databaseSchemaCompatibility: "current",
    });
    const childEnvironment = buildRuntimeChildEnvironment({
      role,
      ambientEnvironment,
      values,
    });
    assert.equal(childEnvironment.NODE_ENV, "production");
    assert.equal(childEnvironment.AUGNES_DISTRIBUTION_MODE, "packaged");
    assert.equal(childEnvironment.AUGNES_APPLICATION_VERSION, applicationVersion);
    assert.equal(
      childEnvironment.AUGNES_PACKAGE_CONTRACT,
      "augnes.distributable.v1",
    );
    assert.equal(
      childEnvironment.AUGNES_PACKAGE_CONTRACT_VERSION,
      String(DISTRIBUTABLE_PACKAGE_CONTRACT_VERSION),
    );
    assert.equal(
      childEnvironment.AUGNES_BUILD_IDENTITY,
      packagedDistribution.buildIdentity,
    );
    assert.equal(
      childEnvironment.AUGNES_PACKAGE_PLATFORM,
      packagedDistribution.packagePlatform,
    );
    assert.equal(childEnvironment.AUGNES_DATABASE_SCHEMA_COMPATIBILITY, "current");
    if (role === "ui") {
      assert.equal(childEnvironment.HOSTNAME, "127.0.0.1");
      assert.equal(childEnvironment.PORT, String(sharedArguments.port));
    }
    assert.deepEqual(
      findForbiddenRuntimeChildEnvironmentKeys({
        role,
        childEnvironment,
        authoredValues: values,
      }),
      [],
    );
  }

  function roleEnvironment(role) {
    return role === "ui" ? uiEnvironment : bridgeEnvironment;
  }
}

function assertSourceRuntimeDiagnostics(payload) {
  assert.equal(payload.distribution_mode, "source");
  assert.equal(payload.application_version, applicationVersion);
  assert.equal(payload.package_contract, null);
  assert.equal(payload.package_contract_version, null);
  assert.equal(payload.build_identity, null);
  assert.equal(payload.package_platform, null);
  assert.equal(payload.runtime_contract, RUNTIME_CONTRACT);
  assert.equal(payload.runtime_schema_version, RUNTIME_SCHEMA_VERSION);
  assert.equal(payload.database_schema_compatibility, "current");
}

function assertPublicSafe(value, label) {
  assert.equal(value.includes(publicSecretSentinel), false, `${label} exposed secret sentinel`);
  assert.equal(value.includes(publicModelSentinel), false, `${label} exposed model sentinel`);
  assert.doesNotMatch(
    value,
    /OPENAI_API_KEY|OPENAI_MODEL|GITHUB_TOKEN|GH_TOKEN|ANTHROPIC_API_KEY|AZURE_OPENAI_API_KEY|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|GOOGLE_API_KEY|HTTP_PROXY|HTTPS_PROXY|ALL_PROXY/,
  );
  assert.doesNotMatch(value, /control-token\.json|AUGNES_DB_PATH/);
}

function assertProcessCommandLinesPublicSafe(pids) {
  if (process.platform === "win32") return;
  const result = spawnSync("ps", ["-axo", "pid=,command="], {
    encoding: "utf8",
    timeout: 2_000,
  });
  assert.equal(result.status, 0, result.stderr);
  const owned = new Set(pids);
  const commandLines = result.stdout
    .split(/\r?\n/)
    .filter((line) => owned.has(Number(line.trim().split(/\s+/, 1)[0])))
    .join("\n");
  assertPublicSafe(commandLines, "owned child command lines");
}

function assertDirectoryPublicSafe(directory, label) {
  for (const filePath of listFilesRecursively(directory)) {
    assertPublicSafe(readFileSync(filePath, "utf8"), `${label}: ${path.basename(filePath)}`);
  }
}

function rememberOwnedPids(ready) {
  observedOwnedPids.add(ready.supervisor_pid);
  for (const child of ready.children) observedOwnedPids.add(child.pid);
}

function processTreePids(ready) {
  const pids = new Set([ready.supervisor_pid]);
  for (const child of ready.children) {
    pids.add(child.pid);
    if (process.platform !== "win32") {
      const result = spawnSync("ps", ["-axo", "pid=,pgid="], {
        encoding: "utf8",
        timeout: 2_000,
      });
      if (result.status === 0) {
        for (const line of result.stdout.split(/\r?\n/)) {
          const [pidText, pgidText] = line.trim().split(/\s+/);
          if (Number(pgidText) === child.pid) pids.add(Number(pidText));
        }
      }
    }
  }
  return [...pids].filter((pid) => Number.isInteger(pid) && pid > 0);
}

function listSupervisorProcessIds() {
  if (process.platform === "win32") return [];
  const result = spawnSync("ps", ["-axo", "pid=,command="], {
    encoding: "utf8",
    timeout: 2_000,
  });
  if (result.status !== 0) return [];
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes(supervisorScript))
    .map((line) => Number(line.split(/\s+/, 1)[0]))
    .filter((pid) => Number.isInteger(pid) && pid !== process.pid)
    .sort((left, right) => left - right);
}

function initializeDisposableDatabase(targetPath) {
  const environment = { ...process.env, AUGNES_DB_PATH: targetPath };
  delete environment.OPENAI_API_KEY;
  delete environment.GITHUB_TOKEN;
  const result = spawnSync(process.execPath, ["scripts/db-init.mjs"], {
    cwd: repoRoot,
    env: environment,
    encoding: "utf8",
    timeout: 30_000,
  });
  assert.equal(
    result.status,
    0,
    `disposable database initialization failed: ${result.stderr || result.stdout}`,
  );
  const database = new Database(targetPath);
  try {
    database
      .prepare(
        `INSERT INTO state_entries (
          id, scope, state_key, value, temporal_scope, stability, change_type,
          source_agent_id, source_session_id, source_transition_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
      )
      .run(
        "runtime-supervisor-mcp-behavior-marker",
        runtimeMarkerScope,
        runtimeMarkerStateKey,
        JSON.stringify(runtimeMarkerValue),
        "current",
        "temporary",
        "runtime_operability_fixture",
        "2000-01-01T00:00:00.000Z",
        "2000-01-01T00:00:00.000Z",
      );
  } finally {
    database.close();
  }
}

function snapshotDatabaseFamily(basePath) {
  const snapshot = new Map();
  for (const candidate of [basePath, `${basePath}-wal`, `${basePath}-shm`, `${basePath}-journal`]) {
    if (!existsSync(candidate)) continue;
    const stats = statSync(candidate, { bigint: true });
    snapshot.set(candidate, {
      sha256: hashFile(candidate),
      size: stats.size.toString(),
      mtime_ns: stats.mtimeNs.toString(),
      mode: (stats.mode & 0o777n).toString(8),
    });
  }
  return snapshot;
}

function hashFile(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

async function createTcpSentinel(preferredPort = 0) {
  let connections = 0;
  const sockets = new Set();
  const server = trackServerConnections(net.createServer((socket) => {
    connections += 1;
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
    socket.end();
  }));
  server.testSockets = sockets;
  try {
    const port = await listenTcpServer(server, preferredPort);
    return { server, port, connectionCount: () => connections };
  } catch (error) {
    if (error?.code !== "EADDRINUSE" || !(await canConnect(preferredPort))) throw error;
    return { server: null, port: preferredPort, connectionCount: null };
  }
}

async function findPreferredPort() {
  const server = trackServerConnections(net.createServer());
  const port = await listenTcpServer(server);
  await closeServer(server);
  return port;
}

async function listenTcpServer(server, preferredPort = 0) {
  while (true) {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(
        { host: "127.0.0.1", port: preferredPort, exclusive: true },
        resolve,
      );
    });
    const address = server.address();
    assert(address && typeof address === "object");
    if (address.port <= 65_535 - 20) return address.port;
    if (preferredPort !== 0) throw new Error("preferred test port exceeds bounded range");
    await closeServer(server);
  }
}

async function listenHttpServer(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  return address.port;
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  return { statusCode: response.status, body: await response.json() };
}

async function assertLoopbackOnly(port) {
  const addresses = Object.values(networkInterfaces())
    .flatMap((entries) => entries ?? [])
    .filter((entry) => !entry.internal && entry.family === "IPv4")
    .map((entry) => entry.address);
  for (const address of addresses) {
    assert.equal(
      await canConnect(port, address),
      false,
      `owned listener ${port} must not accept non-loopback address ${address}`,
    );
  }
}

function canConnect(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1_000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPortClosed(port) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (!(await canConnect(port))) return;
    await delay(100);
  }
  throw new Error(`owned runtime port ${port} remained open`);
}

async function waitForPidsExit(pids, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pids.every((pid) => !isProcessAlive(pid))) return;
    await delay(50);
  }
  const alive = pids.filter(isProcessAlive);
  assert.deepEqual(alive, [], `owned PIDs remained alive: ${alive.join(", ")}`);
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function waitForManagedExit(managed, timeoutMs) {
  return waitForOwnedProcessExit(managed.processRecord, timeoutMs, {
    termGraceMs: 12_000,
    killGraceMs: 5_000,
  });
}

function closeServer(server) {
  return closeTrackedServer(server, { timeoutMs: 3_000 });
}

function listFilesRecursively(root) {
  if (!existsSync(root)) return [];
  const results = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursively(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results.sort();
}

function listRelativeEntriesRecursively(root, relativeRoot = "") {
  if (!existsSync(root)) return [];
  const results = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const relativePath = path.join(relativeRoot, entry.name);
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(`directory:${relativePath}`);
      results.push(...listRelativeEntriesRecursively(fullPath, relativePath));
    } else if (entry.isSymbolicLink()) {
      results.push(`symlink:${relativePath}`);
    } else {
      results.push(`file:${relativePath}`);
    }
  }
  return results.sort();
}

function snapshotDirectoryContentV01(root, relativeRoot = "") {
  if (!existsSync(root)) return [];
  const results = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const relativePath = path.join(relativeRoot, entry.name);
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push({ kind: "directory", path: relativePath });
      results.push(...snapshotDirectoryContentV01(fullPath, relativePath));
    } else if (entry.isSymbolicLink()) {
      results.push({ kind: "symlink", path: relativePath });
    } else {
      const stats = statSync(fullPath, { bigint: true });
      results.push({
        kind: "file",
        path: relativePath,
        sha256: hashFile(fullPath),
        size: stats.size.toString(),
        mode: (stats.mode & 0o777n).toString(8),
      });
    }
  }
  return results.sort((left, right) => left.path.localeCompare(right.path));
}

function createDirectoryLink(target, linkPath) {
  try {
    symlinkSync(target, linkPath, process.platform === "win32" ? "junction" : "dir");
    return true;
  } catch (error) {
    if (
      process.platform === "win32" &&
      ["EPERM", "EACCES", "UNKNOWN"].includes(error?.code)
    ) {
      pathFixtureSkipReason = `directory_junction_unavailable_${error?.code ?? "unknown"}`;
      return false;
    }
    throw error;
  }
}

function assertRuntimePathError(callback, expectedCode, forbiddenValues) {
  let caught;
  try {
    callback();
  } catch (error) {
    caught = error;
  }
  assert(caught, `expected runtime path error ${expectedCode}`);
  assert.equal(caught.code, expectedCode);
  assert.equal(caught.message, expectedCode);
  const publicFailure = JSON.stringify({ reason: caught.code });
  for (const forbidden of forbiddenValues) {
    assert.equal(
      publicFailure.includes(forbidden),
      false,
      "runtime path error must not expose internal path or credential material",
    );
  }
}

function removeScenarioLogs(scenario) {
  rmSync(scenario.logRoot, { recursive: true, force: true });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withTimeout(promise, timeoutMs, label, onTimeout = () => {}) {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          Promise.resolve()
            .then(onTimeout)
            .catch(() => {});
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
