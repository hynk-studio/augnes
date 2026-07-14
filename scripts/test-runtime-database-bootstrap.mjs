#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import {
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
  writeFileSync,
} from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  ensureApplicationDirectory,
  resolveAugnesLocalPaths,
  resolvePhysicalLocalDestination,
} from "./augnes-local-paths.mjs";
import {
  buildSupervisorChildValues,
  runRuntimeSupervisorCli,
} from "./augnes-runtime-supervisor.mjs";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import {
  PublicDatabaseBootstrapError,
  inspectRuntimeDatabase,
  prepareRuntimeDatabase,
  verifyDatabaseFile,
} from "./runtime-database-bootstrap.mjs";
import { buildRuntimeChildEnvironment } from "./runtime-child-environment.mjs";

const repositoryRoot = process.cwd();
const supervisorScript = path.join(repositoryRoot, "scripts", "augnes-runtime-supervisor.mjs");
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "augnes-database-bootstrap-"));
const repositoryDatabasePath = path.join(repositoryRoot, "data", "augnes.db");
const credentialSentinel = "db-bootstrap-provider-sentinel-must-not-escape";
const modelSentinel = "db-bootstrap-model-sentinel-must-not-escape";
const durableMarkerId = "agent:database-bootstrap-durable-marker";
const oldMarkerId = "agent:database-bootstrap-old-marker";
const firstStartMarkerScope = "project:database-bootstrap-first-start";
const firstStartMarkerKey = "database_bootstrap.first_start_marker";
const firstStartMarkerValue = "disposable-default-database-marker-v0-1";
const selectedPorts = [];
const managedSupervisors = new Set();
let providerOrExternalRequests = 0;
let pathFixtureSkipReason = null;
let walFixtureSkipReason = null;

const repositoryDatabaseBefore = snapshotDatabaseFamily(repositoryDatabasePath);
const repositoryTreeBefore = snapshotRepositoryLocalPathResidue();

try {
  testPurePathResolution();
  testPhysicalPathSafety();
  await testDirectDatabaseBootstrap();
  await testDiagnosticsAreReadOnly();
  await testRealFirstAndCurrentStarts();
  await testRealOldSchemaStart();
  await testFailurePreservation();
  await testSupervisorMigrationFailure();

  assert.deepEqual(
    snapshotDatabaseFamily(repositoryDatabasePath),
    repositoryDatabaseBefore,
    "repository database family must remain byte/stat identical",
  );
  assert.deepEqual(
    snapshotRepositoryLocalPathResidue(),
    repositoryTreeBefore,
    "no repository-side data, backup, config, or runtime path may be created",
  );

  const normalized = {
    test: "runtime-database-bootstrap-operability",
    status: "pass",
    path_layout_version: 1,
    pure_platform_paths_verified: ["linux", "darwin", "win32"],
    physical_path_safety_verified: true,
    default_ui_database_verified: true,
    first_start_database_state: "created",
    current_database_state: "current",
    old_database_state: "migrated",
    recovery_backup_verified: true,
    migration_failure_original_preserved: true,
    no_reset_or_seed: true,
    diagnostics_read_only: true,
    explicit_override_verified: true,
    provider_or_external_requests: providerOrExternalRequests,
    repository_database_unchanged: true,
    owned_processes_after: 0,
    owned_ports_after: 0,
    runtime_files_after: 0,
    temporary_migration_files_after: 0,
  };
  const summary = {
    ...normalized,
    selected_ports: selectedPorts,
    path_fixture_skip_reason: pathFixtureSkipReason,
    wal_fixture_skip_reason: walFixtureSkipReason,
    normalized_public_result_sha256: createHash("sha256")
      .update(JSON.stringify(normalized))
      .digest("hex"),
  };
  console.log(JSON.stringify(summary, null, 2));
} finally {
  for (const managed of managedSupervisors) {
    await terminateManagedSupervisor(managed);
  }
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function testPurePathResolution() {
  const fingerprint = "a".repeat(64);
  const scope = `checkout-${fingerprint.slice(0, 16)}`;
  const linuxXdg = resolveAugnesLocalPaths({
    platform: "linux",
    environment: {
      HOME: "/home/tester",
      XDG_DATA_HOME: "/xdg/data",
      XDG_CONFIG_HOME: "/xdg/config",
      XDG_STATE_HOME: "/xdg/state",
      XDG_RUNTIME_DIR: "/run/user/1000",
    },
    repositoryRoot: "/repo/augnes",
    repositoryFingerprint: fingerprint,
    validatePhysicalPaths: false,
  });
  assert.equal(linuxXdg.data_directory, `/xdg/data/augnes/v1/checkouts/${scope}/data`);
  assert.equal(linuxXdg.config_directory, `/xdg/config/augnes/v1/checkouts/${scope}/config`);
  assert.equal(linuxXdg.backup_directory, `/xdg/state/augnes/v1/checkouts/${scope}/backups`);
  assert.equal(linuxXdg.runtime_directory, `/run/user/1000/${scope}`);
  assert.equal(linuxXdg.database_path, `${linuxXdg.data_directory}/augnes.db`);

  const linuxFallback = resolveAugnesLocalPaths({
    platform: "linux",
    environment: { HOME: "/home/tester" },
    repositoryRoot: "/repo/augnes",
    repositoryFingerprint: fingerprint,
    validatePhysicalPaths: false,
  });
  assert.equal(
    linuxFallback.database_path,
    `/home/tester/.local/share/augnes/v1/checkouts/${scope}/data/augnes.db`,
  );
  assert.equal(
    linuxFallback.runtime_directory,
    `/home/tester/.local/state/augnes/runtime/${scope}`,
  );

  const mac = resolveAugnesLocalPaths({
    platform: "darwin",
    environment: { HOME: "/Users/tester" },
    repositoryRoot: "/repo/augnes",
    repositoryFingerprint: fingerprint,
    validatePhysicalPaths: false,
  });
  assert.equal(
    mac.database_path,
    `/Users/tester/Library/Application Support/Augnes/v1/checkouts/${scope}/data/augnes.db`,
  );
  assert.equal(
    mac.runtime_directory,
    `/Users/tester/Library/Application Support/Augnes/runtime/${scope}`,
  );

  const windows = resolveAugnesLocalPaths({
    platform: "win32",
    environment: {
      HOME: "/posix-home-must-not-win",
      USERPROFILE: "C:\\Users\\tester",
      LOCALAPPDATA: "D:\\Local",
      APPDATA: "E:\\Roaming",
    },
    repositoryRoot: "C:\\repo\\augnes",
    repositoryFingerprint: fingerprint,
    validatePhysicalPaths: false,
  });
  assert.equal(
    windows.database_path,
    `D:\\Local\\Augnes\\v1\\checkouts\\${scope}\\data\\augnes.db`,
  );
  assert.equal(
    windows.config_directory,
    `E:\\Roaming\\Augnes\\v1\\checkouts\\${scope}\\config`,
  );
  assert.equal(windows.runtime_directory, `D:\\Local\\Augnes\\runtime\\${scope}`);

  const windowsFallback = resolveAugnesLocalPaths({
    platform: "win32",
    environment: { USERPROFILE: "C:\\Users\\tester" },
    repositoryRoot: "C:\\repo\\augnes",
    repositoryFingerprint: fingerprint,
    validatePhysicalPaths: false,
  });
  assert.equal(
    windowsFallback.data_directory,
    `C:\\Users\\tester\\AppData\\Local\\Augnes\\v1\\checkouts\\${scope}\\data`,
  );
  assert.equal(
    windowsFallback.config_directory,
    `C:\\Users\\tester\\AppData\\Roaming\\Augnes\\v1\\checkouts\\${scope}\\config`,
  );

  const override = resolveAugnesLocalPaths({
    platform: "linux",
    environment: { HOME: "/home/tester", AUGNES_DB_PATH: "/explicit/runtime.db" },
    repositoryRoot: "/repo/augnes",
    repositoryFingerprint: fingerprint,
    validatePhysicalPaths: false,
  });
  assert.equal(override.database_path, "/explicit/runtime.db");
  assert.equal(override.database_override_active, true);
  assert.notEqual(linuxFallback.database_path, override.database_path);
  assert.equal(linuxFallback.database_path.includes("/repo/augnes"), false);
  assert.equal(linuxFallback.database_path.startsWith("/tmp/"), false);
  const otherCheckout = resolveAugnesLocalPaths({
    platform: "linux",
    environment: { HOME: "/home/tester" },
    repositoryRoot: "/repo/other-augnes",
    repositoryFingerprint: "c".repeat(64),
    validatePhysicalPaths: false,
  });
  assert.notEqual(otherCheckout.database_path, linuxFallback.database_path);
  assert.equal(
    resolveAugnesLocalPaths({
      platform: "linux",
      environment: { HOME: "/home/tester" },
      repositoryRoot: "/repo/augnes",
      repositoryFingerprint: fingerprint,
      validatePhysicalPaths: false,
    }).database_path,
    linuxFallback.database_path,
  );
}

function testPhysicalPathSafety() {
  const fixture = path.join(temporaryRoot, "physical-paths");
  const fakeRepository = path.join(fixture, "repository");
  const outside = path.join(fixture, "outside");
  mkdirSync(fakeRepository, { recursive: true });
  mkdirSync(outside, { recursive: true });

  const normal = path.join(outside, "normal", "data");
  const resolution = resolvePhysicalLocalDestination({
    candidate: normal,
    repositoryRoot: fakeRepository,
    insideRepositoryCode: "data_path_must_be_outside_repository",
  });
  assert.equal(
    resolution.physical_destination,
    path.join(realpathSync(outside), "normal", "data"),
  );
  ensureApplicationDirectory({
    directory: normal,
    repositoryRoot: fakeRepository,
    insideRepositoryCode: "data_path_must_be_outside_repository",
    invalidCode: "data_directory_invalid",
  });

  assertPublicPathFailure(
    () =>
      resolvePhysicalLocalDestination({
        candidate: path.join(fakeRepository, "direct"),
        repositoryRoot: fakeRepository,
        insideRepositoryCode: "data_path_must_be_outside_repository",
      }),
    "data_path_must_be_outside_repository",
    [fakeRepository],
  );

  const outsideTarget = path.join(outside, "linked-target");
  const outsideLink = path.join(fixture, "outside-link");
  mkdirSync(outsideTarget, { recursive: true });
  const repositoryLink = path.join(fixture, "repository-link");
  try {
    createDirectoryLink(outsideTarget, outsideLink);
    createDirectoryLink(fakeRepository, repositoryLink);
  } catch (error) {
    pathFixtureSkipReason = `directory_link_unavailable:${error?.code ?? "unknown"}`;
    return;
  }

  const acceptedLinked = path.join(outsideLink, "nested", "data");
  assert.equal(
    resolvePhysicalLocalDestination({
      candidate: acceptedLinked,
      repositoryRoot: fakeRepository,
      insideRepositoryCode: "data_path_must_be_outside_repository",
    }).physical_destination,
    path.join(realpathSync(outsideTarget), "nested", "data"),
  );
  ensureApplicationDirectory({
    directory: acceptedLinked,
    repositoryRoot: fakeRepository,
    insideRepositoryCode: "data_path_must_be_outside_repository",
    invalidCode: "data_directory_invalid",
  });

  const redirected = path.join(repositoryLink, "nested", "backups");
  assertPublicPathFailure(
    () =>
      resolvePhysicalLocalDestination({
        candidate: redirected,
        repositoryRoot: fakeRepository,
        insideRepositoryCode: "backup_path_must_be_outside_repository",
      }),
    "backup_path_must_be_outside_repository",
    [redirected, fakeRepository, credentialSentinel],
  );
  assertPublicPathFailure(
    () =>
      resolveAugnesLocalPaths({
        platform: "linux",
        environment: {
          HOME: outside,
          XDG_DATA_HOME: path.join(outside, "xdg-data"),
          XDG_CONFIG_HOME: path.join(outside, "xdg-config"),
          XDG_STATE_HOME: repositoryLink,
        },
        repositoryRoot: fakeRepository,
        repositoryFingerprint: "b".repeat(64),
      }),
    "backup_path_must_be_outside_repository",
    [repositoryLink, fakeRepository],
  );

  const finalSymlink = path.join(fixture, "final-directory-link");
  createDirectoryLink(outsideTarget, finalSymlink);
  assertPublicPathFailure(
    () =>
      ensureApplicationDirectory({
        directory: finalSymlink,
        repositoryRoot: fakeRepository,
        insideRepositoryCode: "data_path_must_be_outside_repository",
        invalidCode: "data_directory_invalid",
      }),
    "data_directory_invalid",
    [finalSymlink, fakeRepository],
  );

  for (const name of [
    "augnes.db",
    "runtime.json",
    "owner.lock",
    "control-token.json",
    "bridge-supervisor.env",
  ]) {
    assert.equal(existsSync(path.join(fakeRepository, "nested", "backups", name)), false);
  }
}

async function testDirectDatabaseBootstrap() {
  const root = path.join(temporaryRoot, "direct-bootstrap");
  const databasePath = path.join(root, "data", "augnes.db");
  const backupDirectory = path.join(root, "backups");

  const created = await prepareRuntimeDatabase({
    databasePath,
    backupDirectory,
    repositoryRoot,
    instanceId: "direct-created",
  });
  assert.deepEqual(publicDatabaseResult(created), {
    database_state: "created",
    schema_version: "current",
    recovery_backup_created: false,
  });
  assert.equal(existsSync(backupDirectory), false);
  assertFreshDatabaseHasNoDemoSeed(databasePath);
  if (process.platform !== "win32") {
    assert.equal((statSync(databasePath).mode & 0o777) <= 0o600, true);
  }

  insertDurableMarker(databasePath, durableMarkerId);
  const markerBefore = readDurableMarker(databasePath, durableMarkerId);
  const current = await prepareRuntimeDatabase({
    databasePath,
    backupDirectory,
    repositoryRoot,
    instanceId: "direct-current",
  });
  assert.equal(current.databaseState, "current");
  assert.equal(current.recoveryBackupCreated, false);
  assert.deepEqual(readDurableMarker(databasePath, durableMarkerId), markerBefore);
  assert.equal(existsSync(backupDirectory), false);

  const explicitPath = path.join(root, "explicit", "compatibility.db");
  const explicit = await prepareRuntimeDatabase({
    databasePath: explicitPath,
    backupDirectory: path.join(root, "explicit-backups"),
    repositoryRoot,
    instanceId: "direct-explicit",
  });
  assert.equal(explicit.databaseState, "created");
  assert.equal(existsSync(explicitPath), true);
  assert.equal(databasePath === explicitPath, false);
  const explicitDatabase = new Database(explicitPath, { fileMustExist: true });
  explicitDatabase.exec("DROP TABLE perspective_memory_items");
  explicitDatabase.close();
  insertDurableMarker(explicitPath, "agent:explicit-override-marker");
  const explicitMigrated = await prepareRuntimeDatabase({
    databasePath: explicitPath,
    backupDirectory: path.join(root, "explicit-backups"),
    repositoryRoot,
    instanceId: "direct-explicit-migration",
    databaseOverrideActive: true,
  });
  assert.equal(explicitMigrated.databaseState, "migrated");
  assert.deepEqual(readDurableMarker(explicitPath, "agent:explicit-override-marker"), {
    id: "agent:explicit-override-marker",
    name: "database bootstrap marker",
  });

  const fakeRepository = path.join(root, "explicit-repository-compatibility");
  mkdirSync(fakeRepository, { recursive: true });
  const repositoryCompatibilityPath = path.join(fakeRepository, "data", "compatibility.db");
  const repositoryCompatibility = await prepareRuntimeDatabase({
    databasePath: repositoryCompatibilityPath,
    backupDirectory: path.join(root, "explicit-repository-backups"),
    repositoryRoot: fakeRepository,
    instanceId: "direct-explicit-repository-compatibility",
    databaseOverrideActive: true,
  });
  assert.equal(repositoryCompatibility.databaseState, "created");
  assert.equal(existsSync(repositoryCompatibilityPath), true);

  for (const candidate of listDatabaseOperationResidue(root)) {
    assert.fail(`unexpected database operation residue: ${candidate}`);
  }
}

async function testDiagnosticsAreReadOnly() {
  const root = path.join(temporaryRoot, "diagnostics");
  mkdirSync(root, { recursive: true });
  const environment = disposableSupervisorEnvironment(root, {
    providerMode: "poisoned",
    includePorts: false,
  });
  const resolved = resolveAugnesLocalPaths({
    environment,
    repositoryRoot,
  });
  const before = listRelativeEntries(root);
  const result = runSupervisorCliSync(["diagnostics"], environment);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const diagnostics = lastJsonLine(result.stdout);
  assert.equal(diagnostics.command, "diagnostics");
  assert.equal(diagnostics.database.exists, false);
  assert.equal(diagnostics.database.state, "missing");
  assert.equal(diagnostics.database.override_active, false);
  assert.equal(diagnostics.paths.database_path, resolved.database_path);
  assert.equal(diagnostics.paths.backup_directory, resolved.backup_directory);
  assert.deepEqual(listRelativeEntries(root), before, "diagnostics must create no paths");
  assert.equal(existsSync(resolved.database_path), false);
  assertPublicSafe(result.stdout, "diagnostics output");

  const status = runSupervisorCliSync(["status"], environment);
  assert.equal(status.status, 0);
  assert.equal(status.stdout.includes(resolved.database_path), false);
  assert.equal(status.stdout.includes(resolved.backup_directory), false);

  const explicitDatabasePath = path.join(root, "explicit", "diagnostic.db");
  const overrideEnvironment = { ...environment, AUGNES_DB_PATH: explicitDatabasePath };
  const override = runSupervisorCliSync(["diagnostics"], overrideEnvironment);
  assert.equal(override.status, 0);
  const overrideResult = lastJsonLine(override.stdout);
  assert.equal(overrideResult.database.override_active, true);
  assert.equal(overrideResult.paths.database_path, explicitDatabasePath);
  assert.equal(existsSync(explicitDatabasePath), false);

  await prepareRuntimeDatabase({
    databasePath: explicitDatabasePath,
    backupDirectory: path.join(root, "explicit-backups"),
    repositoryRoot,
    instanceId: "diagnostics-current-fixture",
    databaseOverrideActive: true,
  });
  const databaseBefore = snapshotDatabaseFamily(explicitDatabasePath);
  const currentDiagnostics = runSupervisorCliSync(["diagnostics"], overrideEnvironment);
  assert.equal(currentDiagnostics.status, 0);
  assert.equal(lastJsonLine(currentDiagnostics.stdout).database.state, "current");
  assert.deepEqual(snapshotDatabaseFamily(explicitDatabasePath), databaseBefore);
  assertPublicSafe(currentDiagnostics.stdout, "current database diagnostics output");
}

async function testRealFirstAndCurrentStarts() {
  const root = path.join(temporaryRoot, "real-first-current");
  mkdirSync(root, { recursive: true });
  const firstPorts = await findPreferredPorts();
  const firstEnvironment = disposableSupervisorEnvironment(root, {
    ports: firstPorts,
    providerMode: "absent",
  });
  const paths = resolveAugnesLocalPaths({
    environment: firstEnvironment,
    repositoryRoot,
  });
  assert.equal(Object.hasOwn(firstEnvironment, "AUGNES_DB_PATH"), false);

  const first = await startSupervisor(
    firstEnvironment,
    "empty-environment-first-start",
    "canonical",
  );
  assert.equal(first.ready.database_state, "created");
  assert.equal(first.ready.database_schema_version, "current");
  assert.equal(first.ready.recovery_backup_created, false);
  assert.equal(existsSync(paths.database_path), true);
  assert.equal(existsSync(paths.config_directory), false);
  assert.equal(existsSync(paths.backup_directory), false);
  assertFreshDatabaseHasNoDemoSeed(paths.database_path);
  await assertRuntimeHealth(first.ready);
  insertStateMarker(paths.database_path, {
    scope: firstStartMarkerScope,
    stateKey: firstStartMarkerKey,
    value: firstStartMarkerValue,
  });
  const stateBrief = await fetchJson(
    `${first.ready.effective_url}/api/state/brief?scope=${encodeURIComponent(firstStartMarkerScope)}`,
  );
  assert.equal(stateBrief.scope, firstStartMarkerScope);
  assert.equal(
    stateBrief.active_state.find((entry) => entry.state_key === firstStartMarkerKey)?.value,
    firstStartMarkerValue,
    "the real supervised UI must read the application-owned default database",
  );
  const firstStatus = runSupervisorCliSync(["status"], firstEnvironment);
  assert.equal(firstStatus.status, 0, firstStatus.stderr || firstStatus.stdout);
  const firstStatusResult = lastJsonLine(firstStatus.stdout);
  assert.equal(firstStatusResult.database_state, "created");
  assert.equal(firstStatusResult.database_schema_version, "current");
  assertNormalOutputOmitsLocalPaths(
    `${first.stdout}\n${first.stderr}\n${firstStatus.stdout}`,
    paths,
  );
  assertChildEnvironmentBoundaries(firstEnvironment, paths, first.ready, false);
  assertRuntimeFilesPublicSafe(paths.runtime_directory, [paths.database_path]);
  await stopSupervisor(first, firstEnvironment, paths);
  assert.equal(existsSync(paths.database_path), true, "durable DB must remain after stop");
  assertNoSqliteSideFiles(paths.database_path);

  insertDurableMarker(paths.database_path, durableMarkerId);
  const markerBefore = readDurableMarker(paths.database_path, durableMarkerId);
  const secondPorts = await findPreferredPorts();
  const proxy = await createProxySentinel();
  try {
    const secondEnvironment = disposableSupervisorEnvironment(root, {
      ports: secondPorts,
      providerMode: "poisoned",
      proxyPort: proxy.port,
    });
    const second = await startSupervisor(secondEnvironment, "current-schema-restart");
    assert.equal(second.ready.database_state, "current");
    assert.equal(second.ready.recovery_backup_created, false);
    assert.deepEqual(readDurableMarker(paths.database_path, durableMarkerId), markerBefore);
    assert.equal(existsSync(paths.backup_directory), false);
    assertChildEnvironmentBoundaries(secondEnvironment, paths, second.ready, true);
    assertProcessCommandLinesPublicSafe(second.ready);
    assertRuntimeFilesPublicSafe(paths.runtime_directory, [
      credentialSentinel,
      modelSentinel,
      paths.database_path,
      paths.backup_directory,
    ]);
    assertNormalOutputOmitsLocalPaths(
      `${second.stdout}\n${second.stderr}`,
      paths,
    );
    assertPublicSafe(`${second.stdout}\n${second.stderr}`, "poisoned startup output");
    await stopSupervisor(second, secondEnvironment, paths);
    assert.equal(proxy.requests, 0, "startup must not make provider/proxy requests");
    providerOrExternalRequests += proxy.requests;
  } finally {
    await proxy.close();
  }
}

async function testRealOldSchemaStart() {
  const root = path.join(temporaryRoot, "real-old-schema");
  mkdirSync(root, { recursive: true });
  const ports = await findPreferredPorts();
  const environment = disposableSupervisorEnvironment(root, {
    ports,
    providerMode: "absent",
  });
  const paths = resolveAugnesLocalPaths({ environment, repositoryRoot });
  ensureApplicationDirectory({
    directory: paths.data_directory,
    repositoryRoot,
    insideRepositoryCode: "data_path_must_be_outside_repository",
    invalidCode: "data_directory_invalid",
  });
  const useWalFixture = process.platform !== "win32";
  if (!useWalFixture) walFixtureSkipReason = "active_wal_replacement_not_run_on_windows";
  const walReader = createOldDatabaseFixture(paths.database_path, oldMarkerId, {
    wal: useWalFixture,
  });
  if (useWalFixture) assert.equal(existsSync(`${paths.database_path}-wal`), true);
  assert.equal((await inspectRuntimeDatabase({ databasePath: paths.database_path })).database_state, "old");

  let managed;
  try {
    managed = await startSupervisor(environment, "old-schema-migration");
  } finally {
    if (walReader) {
      if (walReader.inTransaction) walReader.exec("ROLLBACK");
      walReader.close();
    }
  }
  assert.equal(managed.ready.database_state, "migrated");
  assert.equal(managed.ready.database_schema_version, "current");
  assert.equal(managed.ready.recovery_backup_created, true);
  assert.deepEqual(readDurableMarker(paths.database_path, oldMarkerId), {
    id: oldMarkerId,
    name: "database bootstrap marker",
  });
  assertFreshDatabaseHasNoDemoSeed(paths.database_path);
  const backups = listRegularFiles(paths.backup_directory).filter((name) => name.endsWith(".db"));
  assert.equal(existsSync(paths.config_directory), false);
  assert.equal(backups.length, 1, "one pre-migration recovery backup must be retained");
  const backupPath = path.join(paths.backup_directory, backups[0]);
  if (process.platform !== "win32") {
    assert.equal(statSync(paths.backup_directory).mode & 0o777, 0o700);
    assert.equal(statSync(backupPath).mode & 0o777, 0o600);
  }
  verifyDatabaseFile(backupPath);
  assert.deepEqual(readDurableMarker(backupPath, oldMarkerId), {
    id: oldMarkerId,
    name: "database bootstrap marker",
  });
  await stopSupervisor(managed, environment, paths);
  assert.equal(existsSync(backupPath), true, "recovery backup must survive runtime stop");

  const idempotent = await prepareRuntimeDatabase({
    databasePath: paths.database_path,
    backupDirectory: paths.backup_directory,
    repositoryRoot,
    instanceId: "old-schema-idempotent-retry",
  });
  assert.equal(idempotent.databaseState, "current");
  assert.equal(idempotent.recoveryBackupCreated, false);
  assert.equal(
    listRegularFiles(paths.backup_directory).filter((name) => name.endsWith(".db")).length,
    1,
    "idempotent preparation must not create a second backup",
  );
  assertNoDatabaseOperationResidue(root);
}

async function testFailurePreservation() {
  const newIntegrityRoot = path.join(temporaryRoot, "failure-new-integrity");
  const newIntegrityPath = path.join(newIntegrityRoot, "data", "augnes.db");
  await assert.rejects(
    prepareRuntimeDatabase({
      databasePath: newIntegrityPath,
      backupDirectory: path.join(newIntegrityRoot, "backups"),
      repositoryRoot,
      instanceId: "new-integrity-failure",
      dependencies: {
        verifyPreparedDatabase: () => {
          throw new Error("fixture new database integrity failure");
        },
      },
    }),
    (error) => error?.code === "database_integrity_failed",
  );
  assert.equal(existsSync(newIntegrityPath), false);
  assertNoDatabaseOperationResidue(newIntegrityRoot);

  await assertInjectedFailure({
    name: "backup-failure",
    expectedCode: "database_backup_failed",
    dependencies: {
      backupDatabase: async () => {
        throw new Error("fixture backup failure");
      },
    },
    expectBackup: false,
  });
  await assertInjectedFailure({
    name: "migration-failure",
    expectedCode: "database_migration_failed",
    dependencies: {
      migrateDatabase: () => {
        throw new Error("fixture migration failure");
      },
    },
    expectBackup: true,
  });
  await assertInjectedFailure({
    name: "integrity-failure",
    expectedCode: "database_integrity_failed",
    dependencies: {
      verifyPreparedDatabase: () => {
        throw new Error("fixture integrity failure");
      },
    },
    expectBackup: true,
  });
  await assertInjectedFailure({
    name: "replacement-failure",
    expectedCode: "database_bootstrap_failed",
    dependencies: {
      beforeReplacement: () => {
        throw new Error("fixture replacement failure");
      },
    },
    expectBackup: true,
  });

  const corruptRoot = path.join(temporaryRoot, "failure-corrupt");
  const corruptPath = path.join(corruptRoot, "data", "augnes.db");
  mkdirSync(path.dirname(corruptPath), { recursive: true });
  writeFileSync(corruptPath, "not a sqlite database\n", { mode: 0o600 });
  const corruptBefore = snapshotDatabaseFamily(corruptPath);
  await assert.rejects(
    prepareRuntimeDatabase({
      databasePath: corruptPath,
      backupDirectory: path.join(corruptRoot, "backups"),
      repositoryRoot,
      instanceId: "corrupt-database",
    }),
    (error) =>
      error instanceof PublicDatabaseBootstrapError &&
      ["database_open_failed", "database_integrity_failed"].includes(error.code),
  );
  assert.deepEqual(snapshotDatabaseFamily(corruptPath), corruptBefore);

  const unsupportedRoot = path.join(temporaryRoot, "failure-unsupported");
  const unsupportedPath = path.join(unsupportedRoot, "data", "augnes.db");
  mkdirSync(path.dirname(unsupportedPath), { recursive: true });
  const unsupportedDatabase = new Database(unsupportedPath);
  unsupportedDatabase.exec(
    "CREATE TABLE unrelated_application_data (id TEXT PRIMARY KEY, value TEXT NOT NULL);" +
      "INSERT INTO unrelated_application_data VALUES ('sentinel', 'unchanged');",
  );
  unsupportedDatabase.close();
  const unsupportedBefore = snapshotDatabaseFamily(unsupportedPath);
  assert.equal(
    (await inspectRuntimeDatabase({ databasePath: unsupportedPath })).database_state,
    "unsupported",
  );
  await assert.rejects(
    prepareRuntimeDatabase({
      databasePath: unsupportedPath,
      backupDirectory: path.join(unsupportedRoot, "backups"),
      repositoryRoot,
      instanceId: "unsupported-database",
    }),
    (error) => error?.code === "database_schema_unsupported",
  );
  assert.deepEqual(snapshotDatabaseFamily(unsupportedPath), unsupportedBefore);
  assert.equal(existsSync(path.join(unsupportedRoot, "backups")), false);

  const lockRoot = path.join(temporaryRoot, "failure-lock");
  const lockDatabase = path.join(lockRoot, "data", "augnes.db");
  mkdirSync(path.dirname(lockDatabase), { recursive: true });
  createOldDatabaseFixture(lockDatabase, oldMarkerId);
  const lockPath = `${lockDatabase}.augnes-bootstrap.lock`;
  const unrelatedLock = '{"contract":"unverified","supervisor_pid":1}\n';
  writeFileSync(lockPath, unrelatedLock, { mode: 0o600 });
  await assert.rejects(
    prepareRuntimeDatabase({
      databasePath: lockDatabase,
      backupDirectory: path.join(lockRoot, "backups"),
      repositoryRoot,
      instanceId: "must-not-trust-pid",
    }),
    (error) => error?.code === "database_bootstrap_owned",
  );
  assert.equal(readFileSync(lockPath, "utf8"), unrelatedLock);
  assert.deepEqual(readDurableMarker(lockDatabase, oldMarkerId), {
    id: oldMarkerId,
    name: "database bootstrap marker",
  });

  const concurrentRoot = path.join(temporaryRoot, "concurrent-bootstrap-lock");
  const concurrentPath = path.join(concurrentRoot, "data", "augnes.db");
  const concurrentBackups = path.join(concurrentRoot, "backups");
  mkdirSync(path.dirname(concurrentPath), { recursive: true });
  createOldDatabaseFixture(concurrentPath, oldMarkerId);
  let releaseBackup;
  let reportBackupEntered;
  const backupEntered = new Promise((resolve) => {
    reportBackupEntered = resolve;
  });
  const backupGate = new Promise((resolve) => {
    releaseBackup = resolve;
  });
  const firstPreparation = prepareRuntimeDatabase({
    databasePath: concurrentPath,
    backupDirectory: concurrentBackups,
    repositoryRoot,
    instanceId: "concurrent-owner-a",
    dependencies: {
      backupDatabase: async ({ sourcePath, targetPath }) => {
        reportBackupEntered();
        await backupGate;
        const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
        try {
          await source.backup(targetPath);
        } finally {
          source.close();
        }
      },
    },
  });
  await backupEntered;
  await assert.rejects(
    prepareRuntimeDatabase({
      databasePath: concurrentPath,
      backupDirectory: concurrentBackups,
      repositoryRoot,
      instanceId: "concurrent-owner-b",
    }),
    (error) => error?.code === "database_bootstrap_owned",
  );
  releaseBackup();
  assert.equal((await firstPreparation).databaseState, "migrated");
  assertNoDatabaseOperationResidue(concurrentRoot);
}

async function testSupervisorMigrationFailure() {
  const root = path.join(temporaryRoot, "supervisor-migration-failure");
  mkdirSync(root, { recursive: true });
  const ports = await findPreferredPorts();
  const environment = disposableSupervisorEnvironment(root, {
    ports,
    providerMode: "poisoned",
  });
  const paths = resolveAugnesLocalPaths({ environment, repositoryRoot });
  ensureApplicationDirectory({
    directory: paths.data_directory,
    repositoryRoot,
    insideRepositoryCode: "data_path_must_be_outside_repository",
    invalidCode: "data_directory_invalid",
  });
  createOldDatabaseFixture(paths.database_path, oldMarkerId);
  const originalBefore = snapshotDatabaseFamily(paths.database_path);
  const childProcessesBefore = listRuntimeChildProcesses();
  const output = [];
  const originalConsoleLog = console.log;
  console.log = (...values) => output.push(values.join(" "));
  let exitCode;
  try {
    exitCode = await runRuntimeSupervisorCli(["start"], environment, {
      prepareRuntimeDatabase: (options) =>
        prepareRuntimeDatabase({
          ...options,
          dependencies: {
            migrateDatabase: () => {
              throw new Error("fixture supervisor migration failure");
            },
          },
        }),
    });
  } finally {
    console.log = originalConsoleLog;
  }
  assert.equal(exitCode, 1);
  const events = output.map(parseJsonLine).filter(Boolean);
  const failure = events.find((event) => event.result === "failed");
  assert.equal(failure.reason, "database_migration_failed");
  assert.equal(failure.database_state, "failed");
  assert.equal(failure.recovery_backup_created, true);
  assert.equal(events.some((event) => (event.children ?? []).length > 0), false);
  assert.deepEqual(listRuntimeChildProcesses(), childProcessesBefore);
  assert.equal(await canConnect(ports.ui), false);
  assert.equal(await canConnect(ports.bridge), false);
  assert.deepEqual(snapshotDatabaseFamily(paths.database_path), originalBefore);
  assert.deepEqual(readDurableMarker(paths.database_path, oldMarkerId), {
    id: oldMarkerId,
    name: "database bootstrap marker",
  });
  assert.equal(
    listRegularFiles(paths.backup_directory).filter((name) => name.endsWith(".db")).length,
    1,
  );
  assertRuntimeStateClean(paths.runtime_directory);
  assertNoDatabaseOperationResidue(root);
  const publicOutput = output.join("\n");
  assert.equal(publicOutput.includes(paths.database_path), false);
  assert.equal(publicOutput.includes("fixture supervisor migration failure"), false);
  assert.equal(publicOutput.includes(oldMarkerId), false);
  assertPublicSafe(publicOutput, "supervisor database failure output");
}

async function assertInjectedFailure({
  name,
  expectedCode,
  dependencies,
  expectBackup,
}) {
  const root = path.join(temporaryRoot, `failure-${name}`);
  const databasePath = path.join(root, "data", "augnes.db");
  const backupDirectory = path.join(root, "backups");
  mkdirSync(path.dirname(databasePath), { recursive: true });
  createOldDatabaseFixture(databasePath, oldMarkerId);
  const originalBefore = snapshotDatabaseFamily(databasePath);
  let failure;
  try {
    await prepareRuntimeDatabase({
      databasePath,
      backupDirectory,
      repositoryRoot,
      instanceId: `failure-${name}`,
      dependencies,
    });
    assert.fail(`${name} must fail`);
  } catch (error) {
    failure = error;
  }
  assert.equal(failure?.code, expectedCode);
  assert.equal(failure?.message, expectedCode);
  assert.deepEqual(snapshotDatabaseFamily(databasePath), originalBefore);
  assert.deepEqual(readDurableMarker(databasePath, oldMarkerId), {
    id: oldMarkerId,
    name: "database bootstrap marker",
  });
  const backups = existsSync(backupDirectory)
    ? listRegularFiles(backupDirectory).filter((entry) => entry.endsWith(".db"))
    : [];
  assert.equal(backups.length, expectBackup ? 1 : 0);
  if (expectBackup) {
    const backupPath = path.join(backupDirectory, backups[0]);
    verifyDatabaseFile(backupPath);
    assert.deepEqual(readDurableMarker(backupPath, oldMarkerId), {
      id: oldMarkerId,
      name: "database bootstrap marker",
    });
  }
  assertNoDatabaseOperationResidue(root);
  assert.equal(JSON.stringify(failure).includes(databasePath), false);
  assert.equal(failure.message.includes(oldMarkerId), false);
}

async function startSupervisor(environment, label, surface = "direct") {
  const command = surface === "canonical"
    ? process.platform === "win32"
      ? "npm.cmd"
      : "npm"
    : process.execPath;
  const args = surface === "canonical"
    ? ["run", "augnes", "--", "start"]
    : [supervisorScript, "start"];
  const child = spawn(command, args, {
    cwd: repositoryRoot,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const managed = { child, label, stdout: "", stderr: "", ready: null };
  managedSupervisors.add(managed);
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    managed.stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    managed.stderr += chunk;
  });
  managed.ready = await waitForJsonEvent(
    managed,
    (event) => event.command === "start" && event.result === "ready",
    100_000,
  );
  selectedPorts.push({
    scenario: label,
    ui: managed.ready.ui_port,
    bridge: managed.ready.bridge_port,
  });
  return managed;
}

async function stopSupervisor(managed, environment, paths) {
  const stop = await runSupervisorCli(["stop"], environment);
  assert.equal(stop.status, 0, stop.stderr || stop.stdout);
  assert.equal(lastJsonLine(stop.stdout).result, "stopped");
  assertNormalOutputOmitsLocalPaths(stop.stdout, paths);
  await waitForExit(managed.child, 25_000);
  managedSupervisors.delete(managed);
  for (const child of managed.ready.children) {
    await waitForPidExit(child.pid, 10_000);
  }
  await waitForPortClosed(managed.ready.ui_port);
  await waitForPortClosed(managed.ready.bridge_port);
  assertRuntimeStateClean(paths.runtime_directory);
  assertNoSqliteSideFiles(paths.database_path);
}

async function terminateManagedSupervisor(managed) {
  if (managed.child.exitCode !== null) return;
  managed.child.kill("SIGTERM");
  await waitForExit(managed.child, 12_000).catch(() => {
    managed.child.kill("SIGKILL");
  });
}

async function waitForJsonEvent(managed, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const line of managed.stdout.split(/\r?\n/)) {
      const parsed = parseJsonLine(line);
      if (parsed && predicate(parsed)) return parsed;
    }
    if (managed.child.exitCode !== null) {
      throw new Error(
        `${managed.label} exited before readiness (${managed.child.exitCode}): ${managed.stderr || managed.stdout}`,
      );
    }
    await delay(100);
  }
  throw new Error(`${managed.label} readiness timed out: ${managed.stderr || managed.stdout}`);
}

function runSupervisorCliSync(args, environment) {
  return spawnSync(process.execPath, [supervisorScript, ...args], {
    cwd: repositoryRoot,
    env: environment,
    encoding: "utf8",
    timeout: 30_000,
  });
}

function runSupervisorCli(args, environment) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [supervisorScript, ...args], {
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
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      resolve({ status: code, signal, stdout, stderr });
    });
  });
}

function disposableSupervisorEnvironment(
  root,
  { ports = null, providerMode = "absent", proxyPort = null, includePorts = true } = {},
) {
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (
      key.startsWith("AUGNES_") ||
      key.endsWith("_API_KEY") ||
      [
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
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
      ].includes(key)
    ) {
      delete environment[key];
    }
  }
  const home = path.join(root, "home");
  const temp = path.join(root, "tmp");
  mkdirSync(home, { recursive: true });
  mkdirSync(temp, { recursive: true });
  Object.assign(environment, {
    HOME: home,
    USERPROFILE: home,
    XDG_DATA_HOME: path.join(root, "xdg-data"),
    XDG_CONFIG_HOME: path.join(root, "xdg-config"),
    XDG_STATE_HOME: path.join(root, "xdg-state"),
    XDG_RUNTIME_DIR: path.join(root, "xdg-runtime"),
    LOCALAPPDATA: path.join(root, "local-app-data"),
    APPDATA: path.join(root, "app-data"),
    TMPDIR: temp,
    TMP: temp,
    TEMP: temp,
    NEXT_TELEMETRY_DISABLED: "1",
  });
  if (includePorts && ports) {
    environment.AUGNES_UI_PREFERRED_PORT = String(ports.ui);
    environment.AUGNES_BRIDGE_PREFERRED_PORT = String(ports.bridge);
  }
  if (providerMode === "poisoned") {
    const proxyUrl = `http://127.0.0.1:${proxyPort ?? 9}`;
    Object.assign(environment, {
      OPENAI_API_KEY: credentialSentinel,
      OPENAI_MODEL: modelSentinel,
      GITHUB_TOKEN: credentialSentinel,
      GH_TOKEN: credentialSentinel,
      ANTHROPIC_API_KEY: credentialSentinel,
      AZURE_OPENAI_API_KEY: credentialSentinel,
      GOOGLE_API_KEY: credentialSentinel,
      AWS_ACCESS_KEY_ID: credentialSentinel,
      AWS_SECRET_ACCESS_KEY: credentialSentinel,
      HTTP_PROXY: proxyUrl,
      HTTPS_PROXY: proxyUrl,
      ALL_PROXY: proxyUrl,
      NO_PROXY: "poisoned-no-proxy",
      AUGNES_UNRELATED_PARENT_VALUE: credentialSentinel,
      AUGNES_CORE_MODE: "http",
      AUGNES_USE_MOCK: "false",
      AUGNES_ENABLE_AGENT_BRIDGE: "false",
    });
  }
  return environment;
}

function assertChildEnvironmentBoundaries(environment, paths, ready, providerPresent) {
  const supervisorPaths = {
    bridgeEnvironment: path.join(paths.runtime_directory, "bridge-supervisor.env"),
  };
  const common = {
    environment,
    paths: supervisorPaths,
    instanceId: ready.instance_id,
    effectiveUrl: ready.effective_url,
    port: ready.bridge_port,
    databasePath: paths.database_path,
  };
  const uiValues = buildSupervisorChildValues({ role: "ui", ...common });
  const ui = buildRuntimeChildEnvironment({
    role: "ui",
    ambientEnvironment: environment,
    values: uiValues,
  });
  assert.equal(ui.AUGNES_DB_PATH, paths.database_path);
  assert.equal(ui.AUGNES_RUNTIME_INSTANCE_ID, ready.instance_id);
  if (providerPresent) {
    assert.equal(ui.OPENAI_API_KEY, credentialSentinel);
    assert.equal(ui.OPENAI_MODEL, modelSentinel);
  } else {
    assert.equal(Object.hasOwn(ui, "OPENAI_API_KEY"), false);
    assert.equal(Object.hasOwn(ui, "OPENAI_MODEL"), false);
  }
  for (const key of ["GITHUB_TOKEN", "GH_TOKEN", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY"]){
    assert.equal(Object.hasOwn(ui, key), false);
  }

  const bridgeValues = buildSupervisorChildValues({ role: "bridge", ...common });
  const bridge = buildRuntimeChildEnvironment({
    role: "bridge",
    ambientEnvironment: environment,
    values: bridgeValues,
  });
  assert.equal(bridge.AUGNES_CORE_MODE, "mock");
  assert.equal(bridge.AUGNES_API_BASE_URL, ready.effective_url);
  assert.equal(bridge.AUGNES_ENABLE_AGENT_BRIDGE, "true");
  assert.equal(bridge.AUGNES_RUNTIME_INSTANCE_ID, ready.instance_id);
  for (const key of [
    "AUGNES_DB_PATH",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "AUGNES_UNRELATED_PARENT_VALUE",
  ]) {
    assert.equal(Object.hasOwn(bridge, key), false, `${key} must not reach bridge`);
  }
}

async function assertRuntimeHealth(ready) {
  const ui = await fetchJson(`${ready.effective_url}/api/healthz`);
  assert.equal(ui.ok, true);
  assert.equal(ui.runtime_instance_id, ready.instance_id);
  const bridge = await fetchJson(`http://127.0.0.1:${ready.bridge_port}/healthz`);
  assert.equal(bridge.ok, true);
  assert.equal(bridge.mode, "mock");
  assert.equal(bridge.runtime_instance_id, ready.instance_id);
}

function createOldDatabaseFixture(databasePath, markerId, { wal = false } = {}) {
  mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const database = new Database(databasePath);
  let walReader = null;
  try {
    if (wal) {
      database.pragma("journal_mode = WAL");
      database.pragma("wal_autocheckpoint = 0");
    }
    database.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(database);
    if (wal) {
      walReader = new Database(databasePath, { readonly: true, fileMustExist: true });
      walReader.exec("BEGIN");
      walReader.prepare("SELECT COUNT(*) AS count FROM sqlite_schema").get();
    }
    database
      .prepare("INSERT INTO agents (id, name, created_at) VALUES (?, ?, ?)")
      .run(markerId, "database bootstrap marker", "2000-01-01T00:00:00.000Z");
    database.exec("DROP TABLE perspective_memory_items");
  } finally {
    database.close();
  }
  return walReader;
}

function insertDurableMarker(databasePath, markerId) {
  const database = new Database(databasePath, { fileMustExist: true });
  try {
    database
      .prepare("INSERT INTO agents (id, name, created_at) VALUES (?, ?, ?)")
      .run(markerId, "database bootstrap marker", "2000-01-01T00:00:00.000Z");
  } finally {
    database.close();
  }
}

function insertStateMarker(databasePath, { scope, stateKey, value }) {
  const database = new Database(databasePath, { fileMustExist: true });
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
        "database-bootstrap-first-start-marker",
        scope,
        stateKey,
        JSON.stringify(value),
        "current",
        "temporary",
        "database_bootstrap_fixture",
        "2000-01-01T00:00:00.000Z",
        "2000-01-01T00:00:00.000Z",
      );
  } finally {
    database.close();
  }
}

function readDurableMarker(databasePath, markerId) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    return database.prepare("SELECT id, name FROM agents WHERE id = ?").get(markerId);
  } finally {
    database.close();
  }
}

function assertFreshDatabaseHasNoDemoSeed(databasePath) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM agents WHERE id = ?").get("agent:demo-runtime").count,
      0,
    );
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM sessions WHERE id = ?").get("session:demo-runtime-core").count,
      0,
    );
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM state_entries WHERE scope = ?").get("project:augnes").count,
      0,
    );
  } finally {
    database.close();
  }
}

function publicDatabaseResult(result) {
  return {
    database_state: result.databaseState,
    schema_version: result.schemaVersion,
    recovery_backup_created: result.recoveryBackupCreated,
  };
}

function assertNormalOutputOmitsLocalPaths(output, paths) {
  assert.equal(output.includes(paths.database_path), false, "normal output must omit DB path");
  assert.equal(output.includes(paths.backup_directory), false, "normal output must omit backup path");
}

function assertRuntimeFilesPublicSafe(runtimeDirectory, forbiddenValues) {
  if (!existsSync(runtimeDirectory)) return;
  for (const filePath of listFilesRecursively(runtimeDirectory)) {
    const stats = lstatSync(filePath);
    if (!stats.isFile() || stats.isSymbolicLink()) continue;
    const contents = readFileSync(filePath, "utf8");
    for (const forbidden of forbiddenValues) {
      assert.equal(contents.includes(forbidden), false, `${path.basename(filePath)} exposed protected material`);
    }
  }
}

function assertProcessCommandLinesPublicSafe(ready) {
  if (process.platform === "win32") return;
  for (const pid of [ready.supervisor_pid, ...ready.children.map((child) => child.pid)]) {
    const result = spawnSync("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf8",
    });
    if (result.status !== 0) continue;
    assert.equal(result.stdout.includes(credentialSentinel), false);
    assert.equal(result.stdout.includes(modelSentinel), false);
  }
}

function assertRuntimeStateClean(runtimeDirectory) {
  if (!existsSync(runtimeDirectory)) return;
  assert.deepEqual(listFilesRecursively(runtimeDirectory), []);
}

function assertNoSqliteSideFiles(databasePath) {
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    assert.equal(existsSync(`${databasePath}${suffix}`), false, `${suffix} must be cleaned`);
  }
}

function assertNoDatabaseOperationResidue(root) {
  const residue = listDatabaseOperationResidue(root);
  assert.deepEqual(residue, [], `database operation residue remained: ${residue.join(", ")}`);
}

function listDatabaseOperationResidue(root) {
  if (!existsSync(root)) return [];
  return listFilesRecursively(root)
    .filter((filePath) =>
      /\.augnes-(?:stage|rollback)|\.augnes-bootstrap\.lock$|-wal$|-shm$|-journal$/.test(
        filePath,
      ),
    )
    .sort();
}

function listFilesRecursively(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      files.push(...listFilesRecursively(target));
    } else {
      files.push(target);
    }
  }
  return files;
}

function listRegularFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => {
      const stats = lstatSync(path.join(directory, name));
      return stats.isFile() && !stats.isSymbolicLink();
    })
    .sort();
}

function listRelativeEntries(root) {
  return listFilesRecursively(root)
    .map((entry) => path.relative(root, entry))
    .sort();
}

function snapshotDatabaseFamily(databasePath) {
  const snapshot = new Map();
  for (const candidate of [
    databasePath,
    `${databasePath}-wal`,
    `${databasePath}-shm`,
    `${databasePath}-journal`,
  ]) {
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

function snapshotRepositoryLocalPathResidue() {
  const candidates = [
    path.join(repositoryRoot, "backups"),
    path.join(repositoryRoot, "config"),
    path.join(repositoryRoot, "runtime"),
    path.join(repositoryRoot, "Augnes"),
  ];
  const dataDirectory = path.join(repositoryRoot, "data");
  return {
    candidates: candidates.map((candidate) => [candidate, existsSync(candidate)]),
    data_entries: existsSync(dataDirectory) ? readdirSync(dataDirectory).sort() : [],
  };
}

function hashFile(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

async function findPreferredPorts() {
  const ui = await reserveEphemeralPort();
  let bridge = await reserveEphemeralPort();
  while (bridge === ui) bridge = await reserveEphemeralPort();
  return { ui, bridge };
}

async function reserveEphemeralPort() {
  while (true) {
    const server = net.createServer();
    const port = await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, () => {
        resolve(server.address().port);
      });
    });
    await closeNetServer(server);
    if (port >= 1_024 && port <= 65_515) return port;
  }
}

async function createProxySentinel() {
  let requests = 0;
  const server = net.createServer((socket) => {
    requests += 1;
    socket.destroy();
  });
  const port = await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, () => {
      resolve(server.address().port);
    });
  });
  return {
    port,
    get requests() {
      return requests;
    },
    close: () => closeNetServer(server),
  };
}

function closeNetServer(server) {
  return new Promise((resolve, reject) => {
    if (!server.listening) return resolve();
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response.json();
}

async function waitForPortClosed(port) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (!(await canConnect(port))) return;
    await delay(100);
  }
  assert.equal(await canConnect(port), false, `port ${port} remained open`);
}

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const finish = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(500);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function waitForPidExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isProcessAlive(pid)) return;
    await delay(100);
  }
  assert.equal(isProcessAlive(pid), false, `process ${pid} remained alive`);
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`process ${child.pid} exit timed out`));
    }, timeoutMs);
    const onExit = (code) => {
      cleanup();
      resolve(code);
    };
    const cleanup = () => {
      clearTimeout(timeout);
      child.off("exit", onExit);
    };
    child.once("exit", onExit);
  });
}

function listRuntimeChildProcesses() {
  if (process.platform === "win32") return [];
  const result = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
  if (result.status !== 0) return [];
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.includes(path.join("node_modules", "next", "dist", "bin", "next")) ||
        line.includes(path.join("apps", "augnes_apps", "src", "server.ts")),
    )
    .sort();
}

function lastJsonLine(output) {
  const values = output
    .split(/\r?\n/)
    .map(parseJsonLine)
    .filter(Boolean);
  assert(values.length > 0, `expected JSON output, received: ${output}`);
  return values.at(-1);
}

function parseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function assertPublicPathFailure(callback, expectedCode, forbiddenValues) {
  let failure;
  try {
    callback();
    assert.fail(`expected ${expectedCode}`);
  } catch (error) {
    failure = error;
  }
  assert.equal(failure?.code, expectedCode);
  assert.equal(failure?.message, expectedCode);
  const serialized = JSON.stringify({ code: failure.code, message: failure.message });
  for (const forbidden of forbiddenValues) {
    assert.equal(serialized.includes(forbidden), false);
  }
}

function assertPublicSafe(value, label) {
  for (const forbidden of [credentialSentinel, modelSentinel, "GITHUB_TOKEN", "OPENAI_API_KEY"]){
    assert.equal(String(value).includes(forbidden), false, `${label} exposed ${forbidden}`);
  }
}

function createDirectoryLink(target, linkPath) {
  symlinkSync(
    target,
    linkPath,
    process.platform === "win32" ? "junction" : "dir",
  );
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
