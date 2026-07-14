#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer as createHttpServer } from "node:http";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { resolveAugnesLocalPaths } from "./augnes-local-paths.mjs";
import {
  DEFAULT_BRIDGE_PORT,
  DEFAULT_UI_PORT,
  PORT_SEARCH_SIZE,
  RUNTIME_CONTRACT,
  RUNTIME_GENERATION_VERSION,
  RUNTIME_SCHEMA_VERSION,
  resolveRuntimePaths,
} from "./augnes-runtime-supervisor.mjs";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import {
  DATABASE_BOOTSTRAP_CONTRACT,
  bootstrapJournalPath,
  inspectDatabaseReconciliation,
  prepareRuntimeDatabase,
  verifyDatabaseFile,
} from "./runtime-database-bootstrap.mjs";
import { classifyRuntimeState } from "./runtime-reconciliation.mjs";

const repositoryRoot = realpathSync(process.cwd());
const repositoryFingerprint = createHash("sha256")
  .update(repositoryRoot)
  .digest("hex");
const supervisorScript = path.join(
  repositoryRoot,
  "scripts",
  "augnes-runtime-supervisor.mjs",
);
const testScript = path.join(
  repositoryRoot,
  "scripts",
  "test-runtime-reconciliation.mjs",
);
const observedChildRoots = new Set();
const observedOwnershipPorts = new Set();

if (process.argv[2] === "--bootstrap-crash-helper") {
  await runBootstrapCrashHelper(process.argv[3]);
} else {
  await runReconciliationSuite();
}

async function runReconciliationSuite() {
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "augnes-runtime-reconciliation-"),
  );
  const repositoryDatabasePath = path.join(repositoryRoot, "data", "augnes.db");
  const repositoryDatabaseBefore = snapshotDatabaseFamily(repositoryDatabasePath);
  const managed = new Set();
  const selectedPorts = [];
  let proxyRequests = 0;
  let activeWalSkipReason = null;
  let windowsHardCrashSkipReason = null;
  let proxyServer = null;

  try {
    proxyServer = createHttpServer((_request, response) => {
      proxyRequests += 1;
      response.writeHead(502).end("reconciliation proxy sentinel");
    });
    const proxyPort = await listen(proxyServer);

    if (process.platform === "win32") {
      windowsHardCrashSkipReason =
        "Windows hard-crash process-group execution is unavailable on this runner.";
    } else {
      await testReadyCrashConcurrentRestart({
        temporaryRoot,
        proxyPort,
        managed,
        selectedPorts,
      });
      await testPartialStartupCrash({
        temporaryRoot,
        proxyPort,
        managed,
        selectedPorts,
      });
      await testChildAlreadyDeadAndDeadBundle({
        temporaryRoot,
        proxyPort,
        managed,
        selectedPorts,
      });
    }

    await testUnverifiableRuntimeState({ temporaryRoot, proxyPort });
    const databaseResults = await testDatabaseCrashPhases({
      temporaryRoot,
      proxyPort,
      managed,
      selectedPorts,
    });
    activeWalSkipReason = databaseResults.activeWalSkipReason;
    await testRestoreFailureAndLegacyJournal({
      temporaryRoot,
      proxyPort,
      managed,
      selectedPorts,
    });

    assert.equal(proxyRequests, 0, "no provider, proxy, or external request is allowed");
    assert.deepEqual(
      snapshotDatabaseFamily(repositoryDatabasePath),
      repositoryDatabaseBefore,
      "repository database family must remain unchanged",
    );
    assert.equal(managed.size, 0, "all managed supervisors must have exited");
    assert.deepEqual(
      [...observedChildRoots].filter(processTreeAlive),
      [],
      "all observed owned process groups must have exited",
    );
    for (const port of [
      ...new Set([
        ...selectedPorts.flatMap((entry) => [entry.ui, entry.bridge]),
        ...observedOwnershipPorts,
      ]),
    ]) {
      assert.equal(await canConnect(port), false, `owned port ${port} must be closed`);
    }

    const normalized = {
      test: "runtime-reconciliation-operability",
      status: "pass",
      ready_hard_crash_recovered: process.platform !== "win32",
      partial_start_recovered: process.platform !== "win32",
      dead_child_recovered: process.platform !== "win32",
      dead_bundle_recovered: process.platform !== "win32",
      private_child_ownership_verified: process.platform !== "win32",
      forged_pid_refused: true,
      conflicting_generation_refused: true,
      concurrent_start_single_runtime: process.platform !== "win32",
      database_staging_ready_recovered: true,
      database_move_intent_recovered: true,
      database_original_moved_recovered: true,
      database_publish_intent_recovered: true,
      database_staging_published_recovered: true,
      database_published_verified_recovered: true,
      database_restore_failure_retried: true,
      active_wal_recovered: process.platform !== "win32",
      legacy_journal_refused: true,
      repository_database_unchanged: true,
      provider_or_external_requests: proxyRequests,
      owned_processes_after: 0,
      owned_ports_after: 0,
      accidental_runtime_or_database_residue: 0,
    };
    const summary = {
      ...normalized,
      selected_ports: selectedPorts,
      windows_hard_crash_skip_reason: windowsHardCrashSkipReason,
      active_wal_skip_reason: activeWalSkipReason,
      normalized_public_result_sha256: createHash("sha256")
        .update(JSON.stringify(normalized))
        .digest("hex"),
    };
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    for (const item of managed) await terminateManaged(item);
    for (const pid of observedChildRoots) {
      if (processTreeAlive(pid)) signalProcessTree(pid, "SIGKILL");
    }
    if (proxyServer) await closeServer(proxyServer);
    rmSync(temporaryRoot, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}

async function testReadyCrashConcurrentRestart({
  temporaryRoot,
  proxyPort,
  managed,
  selectedPorts,
}) {
  const scenario = await createRuntimeScenario(
    temporaryRoot,
    "ready-hard-crash",
    proxyPort,
  );
  createCurrentDatabase(scenario.databasePath);
  insertMarker(scenario.databasePath, "agent:reconciliation-ready-marker");

  const first = await startSupervisor(scenario, managed);
  selectedPorts.push(portSummary(scenario.name, first.ready));
  const oldChildren = first.ready.children.map((child) => ({ ...child }));
  await assertPrivateOwnershipProof(scenario, first);
  const publicMaterial = `${first.stdout}${first.stderr}${readFileSync(
    scenario.paths.manifest,
    "utf8",
  )}${readFileSync(scenario.paths.bridgeEnvironment, "utf8")}`;
  const tokenRecord = JSON.parse(readFileSync(scenario.paths.token, "utf8"));
  assert.equal(publicMaterial.includes(tokenRecord.child_ownership_token), false);

  process.kill(first.child.pid, "SIGKILL");
  await waitForExit(first.child, 10_000);
  managed.delete(first);
  assert(
    oldChildren.some((child) => processTreeAlive(child.pid)),
    "hard-killed supervisor must leave a real detached child for reconciliation",
  );

  const status = await runCli(["status"], scenario.environment);
  assert.equal(status.code, 0, status.output);
  assert.equal(lastJson(status.stdout).state, "orphaned");

  const restartA = spawnSupervisor(scenario, managed, "restart-a");
  await delay(15);
  const restartB = spawnSupervisor(scenario, managed, "restart-b");
  const winner = await firstReady([restartA, restartB]);
  for (const child of winner.ready.children) observedChildRoots.add(child.pid);
  recordOwnershipPorts(scenario);
  const loser = winner === restartA ? restartB : restartA;
  selectedPorts.push(portSummary(`${scenario.name}-restart`, winner.ready));
  const loserResult = await waitForExistingOrExit(loser);
  assert(
    loserResult?.result === "existing" ||
      loserResult?.reason === "runtime_ownership_unverifiable" ||
      loserResult?.reason === "runtime_reconciliation_in_progress",
    loser.output(),
  );
  await waitForExit(loser.child, 10_000);
  managed.delete(loser);
  for (const child of oldChildren) {
    await waitForProcessTreeExit(child.pid, 12_000);
    if (await canConnect(child.port)) {
      const replacement = winner.ready.children.find(
        (candidate) => candidate.port === child.port,
      );
      assert(replacement, "an open old port must be owned by the fresh generation");
      assert.notEqual(replacement.pid, child.pid);
    }
  }
  assertMarker(scenario.databasePath, "agent:reconciliation-ready-marker");
  assert.equal(
    [restartA, restartB].filter((item) => item.child.exitCode === null).length,
    1,
    "concurrent restart must leave exactly one supervisor",
  );
  await stopSupervisor(scenario, winner, managed);
  assertRuntimeStateClean(scenario.paths);
}

async function testPartialStartupCrash({
  temporaryRoot,
  proxyPort,
  managed,
  selectedPorts,
}) {
  const scenario = await createRuntimeScenario(
    temporaryRoot,
    "partial-start-crash",
    proxyPort,
  );
  createCurrentDatabase(scenario.databasePath);
  const blockers = await occupyPortRange(PORT_SEARCH_SIZE);
  scenario.environment.AUGNES_BRIDGE_PREFERRED_PORT = String(blockers.basePort);
  const partial = spawnSupervisor(scenario, managed, "partial");
  const partialManifest = await waitForManifest(
    scenario.paths.manifest,
    (manifest) =>
      manifest.children?.some(
        (child) => child.role === "ui" && child.state === "ready",
      ),
    40_000,
  );
  const ui = partialManifest.children.find((child) => child.role === "ui");
  observedChildRoots.add(ui.pid);
  if (Number.isInteger(ui.ownership_port)) {
    observedOwnershipPorts.add(ui.ownership_port);
  }
  process.kill(partial.child.pid, "SIGKILL");
  await waitForExit(partial.child, 10_000);
  managed.delete(partial);
  await blockers.close();
  assert(processTreeAlive(ui.pid), "partial-start UI must remain for proof-based cleanup");

  const restarted = await startSupervisor(scenario, managed);
  selectedPorts.push(portSummary(scenario.name, restarted.ready));
  await waitForProcessTreeExit(ui.pid, 12_000);
  await stopSupervisor(scenario, restarted, managed);
  assertRuntimeStateClean(scenario.paths);
}

async function testChildAlreadyDeadAndDeadBundle({
  temporaryRoot,
  proxyPort,
  managed,
  selectedPorts,
}) {
  const deadChildScenario = await createRuntimeScenario(
    temporaryRoot,
    "one-child-dead",
    proxyPort,
  );
  createCurrentDatabase(deadChildScenario.databasePath);
  const running = await startSupervisor(deadChildScenario, managed);
  const ui = running.ready.children.find((child) => child.role === "ui");
  const bridge = running.ready.children.find((child) => child.role === "bridge");
  process.kill(running.child.pid, "SIGKILL");
  await waitForExit(running.child, 10_000);
  managed.delete(running);
  signalProcessTree(bridge.pid, "SIGKILL");
  await waitForProcessTreeExit(bridge.pid, 10_000);
  const restarted = await startSupervisor(deadChildScenario, managed);
  selectedPorts.push(portSummary(deadChildScenario.name, restarted.ready));
  await waitForProcessTreeExit(ui.pid, 12_000);
  const restartedChildren = restarted.ready.children.map((child) => ({ ...child }));
  process.kill(restarted.child.pid, "SIGKILL");
  await waitForExit(restarted.child, 10_000);
  managed.delete(restarted);
  const orphanStop = await runCli(["stop"], deadChildScenario.environment);
  assert.equal(orphanStop.code, 0, orphanStop.output);
  assert.equal(lastJson(orphanStop.stdout).result, "reconciled");
  assert(lastJson(orphanStop.stdout).orphan_children_stopped >= 1);
  for (const child of restartedChildren) {
    await waitForProcessTreeExit(child.pid, 12_000);
  }
  assertRuntimeStateClean(deadChildScenario.paths);

  const deadBundleScenario = await createRuntimeScenario(
    temporaryRoot,
    "dead-bundle",
    proxyPort,
  );
  createCurrentDatabase(deadBundleScenario.databasePath);
  const bundle = await startSupervisor(deadBundleScenario, managed);
  const bundleChildren = bundle.ready.children.map((child) => ({ ...child }));
  process.kill(bundle.child.pid, "SIGKILL");
  await waitForExit(bundle.child, 10_000);
  managed.delete(bundle);
  for (const child of bundleChildren) {
    signalProcessTree(child.pid, "SIGKILL");
    await waitForProcessTreeExit(child.pid, 10_000);
  }
  const cleanRestart = await startSupervisor(deadBundleScenario, managed);
  selectedPorts.push(portSummary(deadBundleScenario.name, cleanRestart.ready));
  await stopSupervisor(deadBundleScenario, cleanRestart, managed);
  assertRuntimeStateClean(deadBundleScenario.paths);
}

async function testUnverifiableRuntimeState({ temporaryRoot, proxyPort }) {
  const scenario = await createRuntimeScenario(
    temporaryRoot,
    "unverifiable-runtime",
    proxyPort,
  );
  mkdirSync(scenario.paths.directory, { recursive: true, mode: 0o700 });
  const unrelated = spawn(
    process.execPath,
    ["--eval", "setInterval(() => {}, 1000)"],
    { stdio: "ignore", detached: process.platform !== "win32" },
  );
  const unrelatedListener = createHttpServer((_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ contract: "unrelated-runtime" }));
  });
  const unrelatedPort = await listen(unrelatedListener);
  const generationId = "forged-generation";
  const instanceId = "forged-instance";
  const base = {
    schema_version: RUNTIME_SCHEMA_VERSION,
    contract: RUNTIME_CONTRACT,
    generation_version: RUNTIME_GENERATION_VERSION,
    generation_id: generationId,
    instance_id: instanceId,
    repository_fingerprint: repositoryFingerprint,
  };
  const now = new Date().toISOString();
  writeRestrictedJson(scenario.paths.lock, {
    ...base,
    supervisor_pid: 999_999_999,
    started_at: now,
  });
  writeRestrictedJson(scenario.paths.token, {
    ...base,
    token: "a".repeat(64),
    child_ownership_token: "b".repeat(64),
  });
  writeRestrictedJson(scenario.paths.manifest, {
    ...base,
    supervisor_pid: 999_999_999,
    control_host: "127.0.0.1",
    control_port: unrelatedPort,
    children: [
      {
        role: "ui",
        pid: unrelated.pid,
        port: unrelatedPort,
        ownership_port: unrelatedPort,
        state: "ready",
      },
    ],
    effective_url: `http://127.0.0.1:${unrelatedPort}`,
    ui_port: unrelatedPort,
    bridge_port: null,
    database_state: "current",
    database_schema_version: "current",
    recovery_backup_created: false,
    lifecycle_state: "ready",
    started_at: now,
    last_transition_at: now,
    failure: null,
  });
  writeFileSync(scenario.paths.bridgeEnvironment, "", { mode: 0o600 });
  const before = snapshotRuntimeBundle(scenario.paths);
  for (const command of [["status"], ["stop"], ["start"]]) {
    const result = await runCli(command, scenario.environment);
    assert.equal(result.code, 2, result.output);
    assert.equal(lastJson(result.stdout).reason, "runtime_ownership_unverifiable");
    assert.equal(isProcessAlive(unrelated.pid), true);
    assert.equal(await canConnect(unrelatedPort), true);
    assert.deepEqual(snapshotRuntimeBundle(scenario.paths), before);
  }

  const token = JSON.parse(readFileSync(scenario.paths.token, "utf8"));
  unlinkSync(scenario.paths.token);
  const missingToken = await classifyRuntimeState({
    paths: scenario.paths,
    repositoryFingerprint,
  });
  assert.equal(missingToken.state, "ownership_unverifiable");
  writeRestrictedJson(scenario.paths.token, token);

  token.generation_id = "conflicting-generation";
  writeRestrictedJson(scenario.paths.token, token, true);
  const conflict = await classifyRuntimeState({
    paths: scenario.paths,
    repositoryFingerprint,
  });
  assert.equal(conflict.state, "conflicting_generation");

  token.generation_id = generationId;
  token.generation_version = 999;
  writeRestrictedJson(scenario.paths.token, token, true);
  const unsupportedGeneration = await classifyRuntimeState({
    paths: scenario.paths,
    repositoryFingerprint,
  });
  assert.equal(unsupportedGeneration.state, "ownership_unverifiable");

  writeFileSync(scenario.paths.token, "{malformed", { mode: 0o600 });
  const malformed = await classifyRuntimeState({
    paths: scenario.paths,
    repositoryFingerprint,
  });
  assert.equal(malformed.state, "ownership_unverifiable");

  unlinkSync(scenario.paths.token);
  symlinkSync(scenario.paths.lock, scenario.paths.token);
  const symlinked = await classifyRuntimeState({
    paths: scenario.paths,
    repositoryFingerprint,
  });
  assert.equal(symlinked.state, "ownership_unverifiable");

  signalProcessTree(unrelated.pid, "SIGTERM");
  await waitForExit(unrelated, 5_000).catch(() => {
    signalProcessTree(unrelated.pid, "SIGKILL");
  });
  await closeServer(unrelatedListener);
  rmSync(scenario.root, { recursive: true, force: true });
}

async function testDatabaseCrashPhases({
  temporaryRoot,
  proxyPort,
  managed,
  selectedPorts,
}) {
  const phases = [
    "staging_ready",
    "moving_original",
    "original_moved",
    "publishing_staging",
    "staging_published",
    "published_verified",
  ];
  for (const phase of phases) {
    const scenario = await createRuntimeScenario(
      temporaryRoot,
      `database-${phase}`,
      proxyPort,
    );
    const marker = `agent:reconciliation-${phase}`;
    createOldDatabase(scenario.databasePath, marker);
    const helper = await crashBootstrapAtPhase(scenario, phase);
    assert.equal(helper.phase, phase);
    const inspected = inspectDatabaseReconciliation({
      databasePath: scenario.databasePath,
      backupDirectory: scenario.localPaths.backup_directory,
      repositoryFingerprint,
    });
    assert.equal(inspected.state, "recoverable");
    assert.equal(inspected.phase, phase);
    if (phase === "original_moved") {
      const foreignCheckout = inspectDatabaseReconciliation({
        databasePath: scenario.databasePath,
        backupDirectory: scenario.localPaths.backup_directory,
        repositoryFingerprint: "f".repeat(64),
      });
      assert.equal(foreignCheckout.state, "recovery_required");
      assert.equal(foreignCheckout.automatic_reconciliation, false);
    }
    let runtime;
    if (phase === "staging_ready") {
      const startA = spawnSupervisor(scenario, managed, "database-reconcile-a");
      const startB = spawnSupervisor(scenario, managed, "database-reconcile-b");
      runtime = await firstReady([startA, startB]);
      for (const child of runtime.ready.children) observedChildRoots.add(child.pid);
      recordOwnershipPorts(scenario);
      const other = runtime === startA ? startB : startA;
      const otherResult = await waitForExistingOrExit(other);
      assert(
        otherResult?.result === "existing" ||
          otherResult?.reason === "runtime_ownership_unverifiable" ||
          otherResult?.reason === "runtime_reconciliation_in_progress" ||
          otherResult?.reason === "database_reconciliation_required",
        other.output(),
      );
      await waitForExit(other.child, 10_000);
      managed.delete(other);
    } else {
      runtime = await startSupervisor(scenario, managed);
    }
    selectedPorts.push(portSummary(scenario.name, runtime.ready));
    assertMarker(scenario.databasePath, marker);
    verifyDatabaseFile(scenario.databasePath);
    assert.equal(existsSync(bootstrapJournalPath(scenario.databasePath)), false);
    assert.equal(listOperationResidue(path.dirname(scenario.databasePath)).length, 0);
    const backups = regularFiles(scenario.localPaths.backup_directory).filter(
      (name) => name.endsWith(".db"),
    );
    assert(backups.length >= 1, "recovery backup must be retained");
    for (const backup of backups) {
      verifyDatabaseFile(path.join(scenario.localPaths.backup_directory, backup));
    }
    if (phase === "published_verified") {
      assert.equal(backups.length, 1, "verified publish must not create a second backup");
    }
    await stopSupervisor(scenario, runtime, managed);
    assertRuntimeStateClean(scenario.paths);
  }

  if (process.platform === "win32") {
    return {
      activeWalSkipReason:
        "Active-WAL crash execution is unavailable without a POSIX runner.",
    };
  }
  const walScenario = await createRuntimeScenario(
    temporaryRoot,
    "database-active-wal",
    proxyPort,
  );
  const walMarker = "agent:reconciliation-active-wal";
  await crashBootstrapAtPhase(walScenario, "staging_published", {
    createOldWalFixture: true,
    marker: walMarker,
  });
  const walRuntime = await startSupervisor(walScenario, managed);
  selectedPorts.push(portSummary(walScenario.name, walRuntime.ready));
  assertMarker(walScenario.databasePath, walMarker);
  verifyDatabaseFile(walScenario.databasePath);
  await stopSupervisor(walScenario, walRuntime, managed);
  return { activeWalSkipReason: null };
}

async function testRestoreFailureAndLegacyJournal({
  temporaryRoot,
  proxyPort,
  managed,
  selectedPorts,
}) {
  const restoreScenario = await createRuntimeScenario(
    temporaryRoot,
    "database-restore-failed",
    proxyPort,
  );
  const marker = "agent:reconciliation-restore-failed";
  createOldDatabase(restoreScenario.databasePath, marker);
  const helper = spawnBootstrapHelper(restoreScenario, {
    failureMode: "restore",
    marker,
  });
  const failure = await waitForHelperEvent(
    helper,
    (event) => event.kind === "restore_failed",
    40_000,
  );
  assert.equal(failure.code, "database_rollback_failed");
  await waitForExit(helper.child, 10_000);
  const inspected = inspectDatabaseReconciliation({
    databasePath: restoreScenario.databasePath,
    backupDirectory: restoreScenario.localPaths.backup_directory,
    repositoryFingerprint,
  });
  assert.equal(inspected.state, "recoverable");
  assert.equal(inspected.phase, "restore_failed");
  assert.equal(inspected.rollback_material_present, true);
  assert.equal(inspected.recovery_backup_present, true);
  const restored = await startSupervisor(restoreScenario, managed);
  selectedPorts.push(portSummary(restoreScenario.name, restored.ready));
  assertMarker(restoreScenario.databasePath, marker);
  await stopSupervisor(restoreScenario, restored, managed);

  const legacyScenario = await createRuntimeScenario(
    temporaryRoot,
    "database-legacy-journal",
    proxyPort,
  );
  createOldDatabase(
    legacyScenario.databasePath,
    "agent:reconciliation-legacy-journal",
  );
  const before = snapshotDatabaseFamily(legacyScenario.databasePath);
  writeRestrictedJson(bootstrapJournalPath(legacyScenario.databasePath), {
    contract: DATABASE_BOOTSTRAP_CONTRACT,
    instance_id: "legacy-runtime",
    supervisor_pid: 999_999_999,
    nonce: "legacy-nonce",
  });
  const diagnostics = await runCli(["diagnostics"], legacyScenario.environment);
  assert.equal(diagnostics.code, 0, diagnostics.output);
  assert.equal(
    lastJson(diagnostics.stdout).database_reconciliation.state,
    "recovery_required",
  );
  const refused = await runCli(["start"], legacyScenario.environment);
  assert.equal(refused.code, 2, refused.output);
  assert.equal(lastJson(refused.stdout).reason, "database_legacy_recovery_record");
  assert.deepEqual(snapshotDatabaseFamily(legacyScenario.databasePath), before);
  assert.equal(await canConnect(Number(legacyScenario.environment.AUGNES_UI_PREFERRED_PORT)), false);
  assert.equal(await canConnect(Number(legacyScenario.environment.AUGNES_BRIDGE_PREFERRED_PORT)), false);
}

async function runBootstrapCrashHelper(encodedConfiguration) {
  const configuration = JSON.parse(
    Buffer.from(encodedConfiguration, "base64url").toString("utf8"),
  );
  let walReader = null;
  if (configuration.createOldWalFixture) {
    walReader = createOldDatabase(
      configuration.databasePath,
      configuration.marker,
      { wal: true },
    );
  }
  try {
    await prepareRuntimeDatabase({
      databasePath: configuration.databasePath,
      backupDirectory: configuration.backupDirectory,
      repositoryRoot,
      repositoryFingerprint,
      instanceId: configuration.instanceId,
      runtimeOwnershipGeneration: configuration.generationId,
      databaseOverrideActive: true,
      dependencies: configuration.failureMode === "restore"
        ? {
            afterStagingPublished() {
              throw new Error("test publication failure");
            },
            beforeOriginalRestore() {
              throw new Error("test restoration failure");
            },
          }
        : {
            afterJournalPhase({ phase }) {
              if (phase !== configuration.targetPhase) return;
              process.stdout.write(
                `${JSON.stringify({ kind: "phase", phase })}\n`,
              );
              Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
            },
          },
    });
  } catch (error) {
    if (configuration.failureMode === "restore") {
      process.stdout.write(
        `${JSON.stringify({ kind: "restore_failed", code: error?.code })}\n`,
      );
      return;
    }
    throw error;
  } finally {
    walReader?.close();
  }
}

async function crashBootstrapAtPhase(
  scenario,
  phase,
  { createOldWalFixture = false, marker = null } = {},
) {
  const helper = spawnBootstrapHelper(scenario, {
    targetPhase: phase,
    createOldWalFixture,
    marker,
  });
  const event = await waitForHelperEvent(
    helper,
    (candidate) => candidate.kind === "phase" && candidate.phase === phase,
    40_000,
  );
  process.kill(helper.child.pid, process.platform === "win32" ? "SIGTERM" : "SIGKILL");
  await waitForExit(helper.child, 10_000);
  return event;
}

function spawnBootstrapHelper(scenario, options) {
  const configuration = {
    databasePath: scenario.databasePath,
    backupDirectory: scenario.localPaths.backup_directory,
    instanceId: `bootstrap-helper-${scenario.name}`,
    generationId: `generation-${scenario.name}`,
    ...options,
  };
  const child = spawn(
    process.execPath,
    [
      testScript,
      "--bootstrap-crash-helper",
      Buffer.from(JSON.stringify(configuration)).toString("base64url"),
    ],
    { cwd: repositoryRoot, env: scenario.environment, stdio: ["ignore", "pipe", "pipe"] },
  );
  const helper = { child, stdout: "", stderr: "", events: [] };
  collectJsonEvents(helper);
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    helper.stderr += chunk;
  });
  return helper;
}

async function createRuntimeScenario(temporaryRoot, name, proxyPort) {
  const root = path.join(temporaryRoot, name);
  const stateDirectory = path.join(root, "runtime");
  const databasePath = path.join(root, "database", "augnes.db");
  const home = path.join(root, "home");
  const xdgData = path.join(root, "xdg-data");
  const xdgState = path.join(root, "xdg-state");
  const xdgConfig = path.join(root, "xdg-config");
  const xdgRuntime = path.join(root, "xdg-runtime");
  const temporary = path.join(root, "tmp");
  for (const directory of [
    home,
    xdgData,
    xdgState,
    xdgConfig,
    xdgRuntime,
    temporary,
  ]) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  const uiPort = await freePort();
  const bridgePort = await freePort();
  const environment = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    XDG_DATA_HOME: xdgData,
    XDG_STATE_HOME: xdgState,
    XDG_CONFIG_HOME: xdgConfig,
    XDG_RUNTIME_DIR: xdgRuntime,
    TMPDIR: temporary,
    TMP: temporary,
    TEMP: temporary,
    AUGNES_RUNTIME_STATE_DIR: stateDirectory,
    AUGNES_DB_PATH: databasePath,
    AUGNES_UI_PREFERRED_PORT: String(uiPort),
    AUGNES_BRIDGE_PREFERRED_PORT: String(bridgePort),
    OPENAI_API_KEY: "reconciliation-provider-sentinel-must-not-escape",
    OPENAI_MODEL: "reconciliation-model-sentinel-must-not-escape",
    GITHUB_TOKEN: "reconciliation-github-sentinel",
    GH_TOKEN: "reconciliation-gh-sentinel",
    HTTP_PROXY: `http://127.0.0.1:${proxyPort}`,
    HTTPS_PROXY: `http://127.0.0.1:${proxyPort}`,
    ALL_PROXY: `http://127.0.0.1:${proxyPort}`,
    NO_PROXY: "poisoned.invalid",
    AWS_SECRET_ACCESS_KEY: "reconciliation-cloud-sentinel",
    AUGNES_UNRELATED_RECONCILIATION_VALUE: "must-not-forward",
  };
  const localPaths = resolveAugnesLocalPaths({
    environment,
    repositoryRoot,
    repositoryFingerprint,
  });
  const paths = resolveRuntimePaths({
    environment,
    repositoryFingerprint,
    repositoryRootPath: repositoryRoot,
  });
  return { name, root, stateDirectory, databasePath, environment, localPaths, paths };
}

function spawnSupervisor(scenario, managed, label = scenario.name) {
  const child = spawn(process.execPath, [supervisorScript, "start"], {
    cwd: repositoryRoot,
    env: scenario.environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const item = { child, label, stdout: "", stderr: "", events: [], ready: null };
  managed.add(item);
  collectJsonEvents(item);
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    item.stderr += chunk;
  });
  return item;
}

async function startSupervisor(scenario, managed) {
  const item = spawnSupervisor(scenario, managed);
  item.ready = await waitForJsonEvent(
    item,
    (event) => event.command === "start" && event.result === "ready",
    100_000,
  );
  for (const child of item.ready.children) observedChildRoots.add(child.pid);
  recordOwnershipPorts(scenario);
  assertPublicSafe(item.output?.() ?? `${item.stdout}${item.stderr}`);
  return item;
}

async function firstReady(items) {
  const winner = await Promise.any(
    items.map(async (item) => {
      item.ready = await waitForJsonEvent(
        item,
        (event) => event.command === "start" && event.result === "ready",
        100_000,
      );
      return item;
    }),
  );
  return winner;
}

async function waitForExistingOrExit(item) {
  const deadline = Date.now() + 100_000;
  while (Date.now() < deadline) {
    const result = item.events.find(
      (event) =>
        event.command === "start" &&
        ["existing", "refused", "failed"].includes(event.result),
    );
    if (result) return result;
    if (item.child.exitCode !== null) return lastJson(item.stdout);
    await delay(50);
  }
  throw new Error(`timed out waiting for concurrent start: ${item.stdout}${item.stderr}`);
}

async function stopSupervisor(scenario, item, managed) {
  const stop = await runCli(["stop"], scenario.environment);
  assert.equal(stop.code, 0, stop.output);
  assert(["stopped", "reconciled"].includes(lastJson(stop.stdout).result));
  await waitForExit(item.child, 25_000);
  managed.delete(item);
  for (const child of item.ready?.children ?? []) {
    await waitForProcessTreeExit(child.pid, 10_000);
    assert.equal(await canConnect(child.port), false);
  }
  assertPublicSafe(stop.output);
}

async function assertPrivateOwnershipProof(scenario, item) {
  const token = JSON.parse(readFileSync(scenario.paths.token, "utf8"));
  const manifest = JSON.parse(readFileSync(scenario.paths.manifest, "utf8"));
  for (const child of item.ready.children) {
    const pathname = child.role === "ui" ? "/api/healthz?ownership=1" : "/healthz?ownership=1";
    const response = await fetch(`http://127.0.0.1:${child.port}${pathname}`, {
      headers: { "x-augnes-child-ownership": token.child_ownership_token },
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(response.status, 200);
    const proof = await response.json();
    assert.equal(proof.ownership_verified, true);
    assert.equal(proof.contract, RUNTIME_CONTRACT);
    assert.equal(proof.repository_fingerprint, repositoryFingerprint);
    assert.equal(proof.generation_id, manifest.generation_id);
    assert.equal(proof.instance_id, manifest.instance_id);
    assert.equal(proof.role, child.role);
    assert.equal(proof.child_root_pid, child.pid);
    assert(Number.isInteger(proof.process_pid) && proof.process_pid > 0);
    assert.equal(proof.loopback_port, child.port);
    assert.equal(JSON.stringify(proof).includes(token.child_ownership_token), false);
  }
  const denied = await fetch(
    `${item.ready.effective_url}/api/healthz?ownership=1`,
    {
      headers: { "x-augnes-child-ownership": "wrong-token" },
      signal: AbortSignal.timeout(5_000),
    },
  );
  assert.equal(denied.status, 403);
}

function createCurrentDatabase(databasePath) {
  mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const database = new Database(databasePath);
  try {
    database.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(database);
  } finally {
    database.close();
  }
}

function createOldDatabase(databasePath, marker, { wal = false } = {}) {
  createCurrentDatabase(databasePath);
  const database = new Database(databasePath, { fileMustExist: true });
  let walReader = null;
  try {
    if (wal) {
      database.pragma("journal_mode = WAL");
      database.pragma("wal_autocheckpoint = 0");
      walReader = new Database(databasePath, { readonly: true, fileMustExist: true });
      walReader.exec("BEGIN");
      walReader.prepare("SELECT COUNT(*) FROM sqlite_schema").get();
    }
    database
      .prepare("INSERT INTO agents (id, name, created_at) VALUES (?, ?, ?)")
      .run(marker, "runtime reconciliation marker", "2000-01-01T00:00:00.000Z");
    database.exec("DROP TABLE perspective_memory_items");
  } finally {
    database.close();
  }
  return walReader;
}

function insertMarker(databasePath, marker) {
  const database = new Database(databasePath, { fileMustExist: true });
  try {
    database
      .prepare("INSERT INTO agents (id, name, created_at) VALUES (?, ?, ?)")
      .run(marker, "runtime reconciliation marker", "2000-01-01T00:00:00.000Z");
  } finally {
    database.close();
  }
}

function assertMarker(databasePath, marker) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    assert.deepEqual(
      database.prepare("SELECT id, name FROM agents WHERE id = ?").get(marker),
      { id: marker, name: "runtime reconciliation marker" },
    );
    assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
  } finally {
    database.close();
  }
}

function collectJsonEvents(item) {
  item.child.stdout.setEncoding("utf8");
  let pending = "";
  item.child.stdout.on("data", (chunk) => {
    item.stdout += chunk;
    pending += chunk;
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    for (const line of lines) {
      try {
        item.events.push(JSON.parse(line));
      } catch {
        // Non-JSON package-manager output is not an event.
      }
    }
  });
  item.output = () => `${item.stdout}${item.stderr}`;
}

async function waitForJsonEvent(item, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const event = item.events.find(predicate);
    if (event) return event;
    if (item.child.exitCode !== null) {
      throw new Error(`process exited before event: ${item.stdout}${item.stderr}`);
    }
    await delay(50);
  }
  throw new Error(`timed out waiting for event: ${item.stdout}${item.stderr}`);
}

async function waitForHelperEvent(item, predicate, timeoutMs) {
  return waitForJsonEvent(item, predicate, timeoutMs);
}

async function runCli(arguments_, environment) {
  const child = spawn(process.execPath, [supervisorScript, ...arguments_], {
    cwd: repositoryRoot,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const exit = await waitForExit(child, 120_000);
  return { code: exit.code, stdout, stderr, output: `${stdout}${stderr}` };
}

async function waitForManifest(filePath, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const value = JSON.parse(readFileSync(filePath, "utf8"));
      if (predicate(value)) return value;
    } catch {
      // Ownership publication is still in progress.
    }
    await delay(25);
  }
  throw new Error("timed out waiting for runtime manifest state");
}

async function occupyPortRange(size) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = await freePort();
    if (candidate > 65_535 - size) continue;
    const servers = [];
    try {
      for (let offset = 0; offset < size; offset += 1) {
        const server = net.createServer();
        await listen(server, candidate + offset);
        servers.push(server);
      }
      return {
        basePort: candidate,
        async close() {
          await Promise.all(servers.map(closeServer));
        },
      };
    } catch {
      await Promise.all(servers.map(closeServer));
    }
  }
  throw new Error("unable to reserve a consecutive bridge port range");
}

async function freePort() {
  const server = net.createServer();
  const port = await listen(server);
  await closeServer(server);
  return port;
}

function listen(server, port = 0) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port, exclusive: true }, () => {
      server.removeListener("error", reject);
      resolve(server.address().port);
    });
  });
}

function closeServer(server) {
  return new Promise((resolve) => {
    if (!server.listening) return resolve();
    server.close(() => resolve());
  });
}

async function canConnect(port) {
  if (!Number.isInteger(port) || port <= 0) return false;
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(300, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

function signalProcessTree(pid, signal) {
  try {
    process.kill(process.platform === "win32" ? pid : -pid, signal);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

function processTreeAlive(pid) {
  try {
    process.kill(process.platform === "win32" ? pid : -pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

async function waitForProcessTreeExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!processTreeAlive(pid)) return;
    await delay(50);
  }
  assert.equal(processTreeAlive(pid), false, `process tree ${pid} did not exit`);
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("process exit timed out")), timeoutMs);
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
  });
}

async function terminateManaged(item) {
  if (item.child.exitCode !== null) return;
  item.child.kill("SIGTERM");
  await waitForExit(item.child, 5_000).catch(() => item.child.kill("SIGKILL"));
}

function writeRestrictedJson(filePath, value, replace = false) {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  if (replace && existsSync(filePath)) unlinkSync(filePath);
  writeFileSync(filePath, `${JSON.stringify(value)}\n`, { mode: 0o600 });
  chmodSync(filePath, 0o600);
}

function snapshotRuntimeBundle(paths) {
  return [paths.manifest, paths.lock, paths.token, paths.bridgeEnvironment].map(
    (filePath) => {
      if (!existsSync(filePath)) return null;
      const stats = statSync(filePath);
      return {
        name: path.basename(filePath),
        size: stats.size,
        mode: stats.mode,
        sha256: createHash("sha256").update(readFileSync(filePath)).digest("hex"),
      };
    },
  );
}

function recordOwnershipPorts(scenario) {
  const manifest = JSON.parse(readFileSync(scenario.paths.manifest, "utf8"));
  for (const child of manifest.children ?? []) {
    if (Number.isInteger(child.ownership_port)) {
      observedOwnershipPorts.add(child.ownership_port);
    }
  }
}

function snapshotDatabaseFamily(databasePath) {
  return ["", "-wal", "-shm", "-journal"].map((suffix) => {
    const filePath = `${databasePath}${suffix}`;
    if (!existsSync(filePath)) return null;
    const stats = statSync(filePath);
    return {
      suffix,
      size: stats.size,
      mode: stats.mode,
      mtimeMs: stats.mtimeMs,
      sha256: createHash("sha256").update(readFileSync(filePath)).digest("hex"),
    };
  });
}

function assertRuntimeStateClean(paths) {
  for (const filePath of [
    paths.manifest,
    paths.lock,
    paths.token,
    paths.bridgeEnvironment,
    paths.reconciliationLease,
  ]) {
    assert.equal(existsSync(filePath), false, `${path.basename(filePath)} must be absent`);
  }
}

function regularFiles(directory) {
  if (!directory || !existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => {
    const stats = lstatSync(path.join(directory, name));
    return stats.isFile() && !stats.isSymbolicLink();
  });
}

function listOperationResidue(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) =>
    /\.augnes-(stage|rollback|bootstrap)/.test(name),
  );
}

function lastJson(stdout) {
  const lines = stdout.trim().split("\n").reverse();
  for (const line of lines) {
    try {
      return JSON.parse(line);
    } catch {
      // Continue through non-JSON output.
    }
  }
  throw new Error(`no JSON result in output: ${stdout}`);
}

function assertPublicSafe(value) {
  for (const sentinel of [
    "reconciliation-provider-sentinel-must-not-escape",
    "reconciliation-model-sentinel-must-not-escape",
    "reconciliation-github-sentinel",
    "reconciliation-gh-sentinel",
    "reconciliation-cloud-sentinel",
  ]) {
    assert.equal(value.includes(sentinel), false, `public output leaked ${sentinel}`);
  }
}

function portSummary(scenario, ready) {
  return { scenario, ui: ready.ui_port, bridge: ready.bridge_port };
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
