import { createHash, randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

export const COMPANION_SERVICE_CONTRACT = "augnes-companion-service.v0.1";
export const COMPANION_SERVICE_DESIRED_STATE_CONTRACT =
  "augnes-companion-service-desired-state.v0.1";
export const COMPANION_SERVICE_SCHEMA_VERSION = 1;
export const COMPANION_SERVICE_DESIRED_STATE_SCHEMA_VERSION = 1;
export const COMPANION_SERVICE_MANAGER_VERSION = 1;
export const COMPANION_SERVICE_PLATFORM = "darwin";
export const COMPANION_SERVICE_NODE_MAJOR = 24;
export const COMPANION_SERVICE_PUBLIC_STATES = Object.freeze([
  "unsupported",
  "not_installed",
  "installed_stopped",
  "starting",
  "live",
  "maintenance",
  "service_update_required",
  "recovery_required",
  "ambiguous",
]);
export const COMPANION_SUPERVISOR_FAILURE_ORIGINS = Object.freeze([
  "child_birth_identity_unavailable",
  "managed_child_exit_observed",
  "managed_child_identity_lost",
]);

const SERVICE_LABEL_PREFIX = "com.augnes.companion";
const SERVICE_SOURCE_FILES = Object.freeze([
  "scripts/augnes-companion-service.mjs",
  "plugins/augnes-operator/mcp/companion-service-core.mjs",
]);
const RUNTIME_CONTRACT = "augnes-local-runtime-supervisor-v1";
const RUNTIME_SCHEMA_VERSION = 2;
const RUNTIME_GENERATION_VERSION = 1;
const MAX_JSON_BYTES = 64 * 1024;
const MANAGER_POLL_MS = 250;
const MANAGER_BACKOFF_MS = Object.freeze([1_000, 2_000, 5_000, 10_000]);
const DEFAULT_LIVE_WAIT_MS = 90_000;
const STOP_WAIT_MS = 20_000;
const MAINTENANCE_WAIT_MS = 30_000;
const DEFAULT_MAINTENANCE_TTL_MS = 6 * 60 * 60 * 1_000;
const MAX_MAINTENANCE_TTL_MS = 12 * 60 * 60 * 1_000;
const MAX_CHILD_TAIL_BYTES = 16 * 1024;
const MAX_PRODUCTION_CHECKOUT_SCOPES = 512;
const STALE_DECOMMISSION_CONTRACT =
  "augnes-companion-service-stale-decommission.v0.1";
const STALE_DECOMMISSION_SCHEMA_VERSION = 1;
const STALE_DECOMMISSION_MATERIAL_KEYS = Object.freeze([
  "configuration",
  "desired_state",
  "launch_agent",
  "manager_state",
  "manager_lock",
  "maintenance_lease",
  "runtime_manifest",
  "runtime_token",
  "runtime_access",
  "runtime_lock",
  "runtime_bridge_environment",
]);
const STALE_DECOMMISSION_UNLINK_HELPER = [
  "import hashlib, os, stat, sys",
  "name, expected_parent_dev, expected_parent_ino, expected_sha, inject_swap = sys.argv[1:]",
  "parent_fd = 3",
  "parent = os.fstat(parent_fd)",
  "assert stat.S_ISDIR(parent.st_mode)",
  "assert str(parent.st_dev) == expected_parent_dev",
  "assert str(parent.st_ino) == expected_parent_ino",
  "quarantine = '.stale-decommission-quarantine-' + os.urandom(32).hex()",
  "os.rename(name, quarantine, src_dir_fd=parent_fd, dst_dir_fd=parent_fd)",
  "file_fd = os.open(quarantine, os.O_RDONLY | os.O_NOFOLLOW, dir_fd=parent_fd)",
  "try:",
  "    opened = os.fstat(file_fd)",
  "    linked = os.stat(quarantine, dir_fd=parent_fd, follow_symlinks=False)",
  "    assert stat.S_ISREG(opened.st_mode) and stat.S_ISREG(linked.st_mode)",
  "    assert opened.st_dev == linked.st_dev and opened.st_ino == linked.st_ino",
  "    digest = hashlib.sha256()",
  "    while True:",
  "        chunk = os.read(file_fd, 65536)",
  "        if not chunk: break",
  "        digest.update(chunk)",
  "    assert digest.hexdigest() == expected_sha",
  "    if inject_swap == '1':",
  "        os.rename(quarantine, quarantine + '.expected', src_dir_fd=parent_fd, dst_dir_fd=parent_fd)",
  "        injected_fd = os.open(quarantine, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=parent_fd)",
  "        os.write(injected_fd, b'foreign helper replacement\\n')",
  "        os.close(injected_fd)",
  "    linked_again = os.stat(quarantine, dir_fd=parent_fd, follow_symlinks=False)",
  "    assert opened.st_dev == linked_again.st_dev and opened.st_ino == linked_again.st_ino",
  "    os.unlink(quarantine, dir_fd=parent_fd)",
  "    parent_after = os.fstat(parent_fd)",
  "    assert parent_after.st_dev == parent.st_dev and parent_after.st_ino == parent.st_ino",
  "except:",
  "    try:",
  "        os.stat(name, dir_fd=parent_fd, follow_symlinks=False)",
  "    except FileNotFoundError:",
  "        try: os.rename(quarantine, name, src_dir_fd=parent_fd, dst_dir_fd=parent_fd)",
  "        except FileNotFoundError: pass",
  "    raise",
  "finally:",
  "    os.close(file_fd)",
].join("\n");
const STALE_DECOMMISSION_CREATE_HELPER = [
  "import os, stat, sys",
  "temporary, destination = sys.argv[1:]",
  "parent_fd = 3",
  "parent = os.fstat(parent_fd)",
  "assert stat.S_ISDIR(parent.st_mode)",
  "data = sys.stdin.buffer.read(1048576)",
  "file_fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=parent_fd)",
  "try:",
  "    offset = 0",
  "    while offset < len(data): offset += os.write(file_fd, data[offset:])",
  "    os.fsync(file_fd)",
  "finally:",
  "    os.close(file_fd)",
  "try:",
  "    os.link(temporary, destination, src_dir_fd=parent_fd, dst_dir_fd=parent_fd, follow_symlinks=False)",
  "    os.unlink(temporary, dir_fd=parent_fd)",
  "    os.fsync(parent_fd)",
  "except:",
  "    try: os.unlink(temporary, dir_fd=parent_fd)",
  "    except FileNotFoundError: pass",
  "    raise",
].join("\n");
const INSTALLED_CONFIGURATION_KEYS = Object.freeze([
  "contract",
  "schema_version",
  "manager_version",
  "service_label",
  "service_identity",
  "repository_root",
  "repository_fingerprint",
  "repository_device",
  "repository_inode",
  "node_path",
  "node_version",
  "manager_entry_path",
  "service_source_fingerprint",
  "runtime_state_directory",
  "runtime_home_directory",
  "database_path",
  "configuration_path",
  "launch_agent_path",
  "installed_at",
  "test_scope",
  "test_root",
]);

export class PublicCompanionServiceError extends Error {
  constructor(code, cause) {
    super(code, cause ? { cause } : undefined);
    this.name = "PublicCompanionServiceError";
    this.code = code;
  }
}

export function createCompanionSupervisorAttemptDiagnostics() {
  return {
    output_tail: "",
    exit_observation: null,
  };
}

export function appendCompanionSupervisorAttemptOutput(attempt, chunk) {
  if (!validSupervisorAttemptDiagnostics(attempt)) {
    throw new Error("companion supervisor attempt diagnostics invalid");
  }
  attempt.output_tail = boundedTail(attempt.output_tail + String(chunk));
}

export function observeCompanionSupervisorAttemptExit(attempt, code, signal) {
  if (!validSupervisorAttemptDiagnostics(attempt)) {
    throw new Error("companion supervisor attempt diagnostics invalid");
  }
  attempt.exit_observation = {
    status: Number.isInteger(code) && code >= 0 ? code : null,
    signal_present: typeof signal === "string" && signal.length > 0,
  };
}

export function snapshotCompanionSupervisorFailureProvenance({
  attempt,
  failureOrigin,
  restartCount,
}) {
  if (
    !validSupervisorAttemptDiagnostics(attempt) ||
    !COMPANION_SUPERVISOR_FAILURE_ORIGINS.includes(failureOrigin) ||
    !Number.isInteger(restartCount) ||
    restartCount < 1
  ) {
    throw new Error("companion supervisor failure provenance invalid");
  }
  const observedExit = failureOrigin === "managed_child_exit_observed"
    ? attempt.exit_observation
    : null;
  if (failureOrigin === "managed_child_exit_observed" && observedExit === null) {
    throw new Error("observed companion supervisor exit missing");
  }
  return {
    failure_origin: failureOrigin,
    child_exit_status: observedExit?.status ?? null,
    child_exit_signal_present: observedExit?.signal_present === true,
    restart_count: restartCount,
    restart_reason: "companion_service_restart_backoff",
    attempt_tail_sha256: `sha256:${sha256(attempt.output_tail)}`,
  };
}

export function readCompanionSupervisorFailureProvenance(managerState) {
  const provenance = managerState?.supervisor_failure_provenance;
  return validCompanionSupervisorFailureProvenance(provenance)
    ? { ...provenance }
    : null;
}

export function resolveCompanionServiceLayout({
  repositoryRoot,
  environment = process.env,
  platform = process.platform,
  homeDirectory = null,
  testScope = null,
} = {}) {
  const repository = observeRepository(repositoryRoot);
  const home = resolveHome(environment, homeDirectory);
  const test = resolveTestScope({ environment, testScope });
  const serviceSeed = JSON.stringify([
    COMPANION_SERVICE_CONTRACT,
    repository.repository_fingerprint,
    test?.scope ?? "production",
  ]);
  const serviceIdentity = sha256(serviceSeed);
  const label = test
    ? `${SERVICE_LABEL_PREFIX}.test.${serviceIdentity.slice(0, 16)}`
    : `${SERVICE_LABEL_PREFIX}.${serviceIdentity.slice(0, 16)}`;
  const checkoutScope = `checkout-${repository.repository_fingerprint.slice(0, 16)}`;
  const serviceDirectory = test
    ? path.join(test.root, `service-${serviceIdentity.slice(0, 16)}`)
    : path.join(
        home,
        "Library",
        "Application Support",
        "Augnes",
        "v1",
        "checkouts",
        checkoutScope,
        "config",
        "companion-service",
      );
  const productionCheckoutsDirectory = path.join(
    home,
    "Library",
    "Application Support",
    "Augnes",
    "v1",
    "checkouts",
  );
  const runtimeDirectory = test
    ? path.join(test.root, `runtime-${serviceIdentity.slice(0, 16)}`)
    : path.join(
        home,
        "Library",
        "Application Support",
        "Augnes",
        "runtime",
        checkoutScope,
      );
  return {
    platform,
    home,
    uid: typeof process.getuid === "function" ? process.getuid() : null,
    repository,
    test,
    service_identity: serviceIdentity,
    service_label: label,
    service_directory: serviceDirectory,
    configuration_path: path.join(serviceDirectory, "service.json"),
    desired_state_path: path.join(serviceDirectory, "desired-state.json"),
    lifecycle_lock_path: path.join(serviceDirectory, "lifecycle.lock"),
    manager_state_path: path.join(serviceDirectory, "manager-state.json"),
    manager_lock_path: path.join(serviceDirectory, "manager.lock"),
    maintenance_lease_path: path.join(serviceDirectory, "maintenance.json"),
    stale_decommission_path: path.join(
      serviceDirectory,
      "stale-decommission.json",
    ),
    runtime_directory: runtimeDirectory,
    runtime_manifest_path: path.join(runtimeDirectory, "runtime.json"),
    runtime_lock_path: path.join(runtimeDirectory, "owner.lock"),
    runtime_token_path: path.join(runtimeDirectory, "control-token.json"),
    runtime_access_path: path.join(runtimeDirectory, "companion-access.json"),
    runtime_bridge_environment_path: path.join(
      runtimeDirectory,
      "bridge-supervisor.env",
    ),
    launch_agent_path: path.join(home, "Library", "LaunchAgents", `${label}.plist`),
    production_checkouts_directory: productionCheckoutsDirectory,
  };
}

export async function inspectCompanionService({
  repositoryRoot,
  environment = process.env,
  platform = process.platform,
  homeDirectory = null,
  testScope = null,
  launchctl = defaultLaunchctl,
  now = () => Date.now(),
} = {}) {
  if (platform !== COMPANION_SERVICE_PLATFORM || currentUid() === 0) {
    return serviceObservation({
      status: "unsupported",
      checkoutRelation: "unsupported",
      startAvailable: false,
      resumeAvailable: false,
      reason: platform !== COMPANION_SERVICE_PLATFORM
        ? "companion_service_platform_unsupported"
        : "companion_service_root_user_unsupported",
    });
  }

  let layout;
  try {
    layout = resolveCompanionServiceLayout({
      repositoryRoot,
      environment,
      platform,
      homeDirectory,
      testScope,
    });
  } catch (error) {
    return serviceObservation({
      status: "ambiguous",
      checkoutRelation: "unverifiable",
      startAvailable: false,
      resumeAvailable: false,
      reason: publicCode(error, "companion_service_repository_unverifiable"),
    });
  }

  const staleDecommissionResult = readRegularJson(
    layout.stale_decommission_path,
  );
  if (staleDecommissionResult.state !== "missing") {
    if (
      staleDecommissionResult.state !== "valid" ||
      !validStaleCheckoutDecommissionRecord(
        staleDecommissionResult.value,
        layout,
      )
    ) {
      return serviceObservation({
        layout,
        status: "ambiguous",
        checkoutRelation: "conflicting",
        startAvailable: false,
        resumeAvailable: false,
        reason: "companion_service_stale_decommission_record_conflict",
      });
    }
    return serviceObservation({
      layout,
      configuration: staleDecommissionResult.value.configuration,
      status: "recovery_required",
      checkoutRelation: "substituted_or_moved",
      startAvailable: false,
      resumeAvailable: false,
      reason: "companion_service_stale_decommission_incomplete",
    });
  }

  const configurationResult = readRegularJson(layout.configuration_path);
  const plistResult = readRegularText(layout.launch_agent_path);
  const desiredStateResult = readRegularJson(layout.desired_state_path);
  if (
    configurationResult.state === "missing" &&
    plistResult.state === "missing" &&
    desiredStateResult.state === "missing"
  ) {
    return serviceObservation({
      layout,
      status: "not_installed",
      checkoutRelation: "exact",
      startAvailable: false,
      resumeAvailable: false,
      reason: "companion_service_not_installed",
    });
  }
  if (
    configurationResult.state !== "valid" ||
    plistResult.state !== "valid"
  ) {
    return serviceObservation({
      layout,
      status: "ambiguous",
      checkoutRelation: "conflicting",
      startAvailable: false,
      resumeAvailable: false,
      reason: "companion_service_installation_conflict",
    });
  }

  const configuration = configurationResult.value;
  const validation = validateInstalledConfiguration({
    configuration,
    plist: plistResult.contents,
    layout,
  });
  if (!validation.valid) {
    return serviceObservation({
      layout,
      configuration,
      status: validation.updateRequired
        ? "service_update_required"
        : validation.checkoutRelation === "exact"
          ? "ambiguous"
          : "recovery_required",
      checkoutRelation: validation.checkoutRelation,
      startAvailable: false,
      resumeAvailable: false,
      reason: validation.reason,
    });
  }

  if (desiredStateResult.state !== "valid") {
    return serviceObservation({
      layout,
      configuration,
      status: "ambiguous",
      checkoutRelation: "exact",
      startAvailable: false,
      resumeAvailable: false,
      reason: desiredStateResult.state === "missing"
        ? "companion_service_desired_state_missing"
        : "companion_service_desired_state_invalid",
    });
  }

  const desiredState = validateDesiredStateRecord(
    desiredStateResult.value,
    configuration,
  );
  if (!desiredState.valid) {
    return serviceObservation({
      layout,
      configuration,
      status: "ambiguous",
      checkoutRelation: "exact",
      startAvailable: false,
      resumeAvailable: false,
      reason: desiredState.reason,
    });
  }

  const sourceFingerprint = computeServiceSourceFingerprint(
    layout.repository.realpath,
  );
  const node = inspectNodeBinary(configuration.node_path);
  const loaded = launchctlLoaded(layout, launchctl);
  if (
    sourceFingerprint !== configuration.service_source_fingerprint ||
    !node.valid ||
    node.version !== configuration.node_version
  ) {
    const runtime = await inspectVerifiedRuntime({ layout, configuration });
    return serviceObservation({
      layout,
      configuration,
      status: "service_update_required",
      checkoutRelation: "exact",
      startAvailable: false,
      resumeAvailable: false,
      reason: !node.valid
        ? "companion_service_node_binding_stale"
        : "companion_service_configuration_stale",
      runtime,
      loaded,
      desiredState: desiredState.record,
    });
  }

  const maintenance = classifyMaintenanceLease({
    leasePath: layout.maintenance_lease_path,
    configuration,
    now,
  });
  const runtime = await inspectVerifiedRuntime({ layout, configuration });
  const managerState = readRegularJson(layout.manager_state_path);

  if (
    maintenance.lease &&
    maintenance.lease.pre_maintenance_desired_state !==
      desiredState.record.desired_state
  ) {
    return serviceObservation({
      layout,
      configuration,
      status: "ambiguous",
      checkoutRelation: "exact",
      startAvailable: false,
      resumeAvailable: false,
      reason: "companion_service_maintenance_desired_state_conflict",
      runtime,
      maintenance,
      loaded,
      desiredState: desiredState.record,
    });
  }

  if (maintenance.status === "active") {
    return serviceObservation({
      layout,
      configuration,
      status: "maintenance",
      checkoutRelation: "exact",
      startAvailable: false,
      resumeAvailable: false,
      reason: "companion_service_maintenance_active",
      runtime,
      maintenance,
      loaded,
      desiredState: desiredState.record,
    });
  }
  if (maintenance.status === "ambiguous") {
    return serviceObservation({
      layout,
      configuration,
      status: "ambiguous",
      checkoutRelation: "exact",
      startAvailable: false,
      resumeAvailable: false,
      reason: "companion_service_maintenance_ambiguous",
      runtime,
      maintenance,
      loaded,
      desiredState: desiredState.record,
    });
  }
  if (maintenance.status === "stale") {
    return serviceObservation({
      layout,
      configuration,
      status: "recovery_required",
      checkoutRelation: "exact",
      startAvailable: true,
      resumeAvailable: false,
      reason: "companion_service_stale_maintenance_recovery_required",
      runtime,
      maintenance,
      loaded,
      desiredState: desiredState.record,
    });
  }
  if (desiredState.record.desired_state === "stopped") {
    if (runtime.verified) {
      return serviceObservation({
        layout,
        configuration,
        status: "recovery_required",
        checkoutRelation: "exact",
        startAvailable: false,
        resumeAvailable: false,
        reason: "companion_service_stopped_runtime_conflict",
        runtime,
        maintenance,
        loaded,
        desiredState: desiredState.record,
      });
    }
    return serviceObservation({
      layout,
      configuration,
      status: "installed_stopped",
      checkoutRelation: "exact",
      startAvailable: true,
      resumeAvailable: false,
      reason: "companion_service_installed_stopped",
      runtime,
      maintenance,
      loaded,
      desiredState: desiredState.record,
    });
  }
  if (
    runtime.verified &&
    loaded &&
    managerState.state === "valid" &&
    validLiveManagerState(managerState.value, configuration, runtime)
  ) {
    return serviceObservation({
      layout,
      configuration,
      status: "live",
      checkoutRelation: "exact",
      startAvailable: false,
      resumeAvailable: true,
      reason: "companion_service_live",
      runtime,
      maintenance,
      loaded,
      desiredState: desiredState.record,
    });
  }
  if (runtime.verified) {
    return serviceObservation({
      layout,
      configuration,
      status: "recovery_required",
      checkoutRelation: "exact",
      startAvailable: true,
      resumeAvailable: false,
      reason: "companion_service_manager_ownership_unverifiable",
      runtime,
      maintenance,
      loaded,
      desiredState: desiredState.record,
    });
  }
  if (!loaded) {
    return serviceObservation({
      layout,
      configuration,
      status: "recovery_required",
      checkoutRelation: "exact",
      startAvailable: true,
      resumeAvailable: false,
      reason: "companion_service_running_service_unloaded",
      runtime,
      maintenance,
      loaded,
      desiredState: desiredState.record,
    });
  }
  if (
    managerState.state === "valid" &&
    ["starting", "maintenance"].includes(managerState.value?.status)
  ) {
    return serviceObservation({
      layout,
      configuration,
      status: managerState.value.status === "maintenance"
        ? "maintenance"
        : "starting",
      checkoutRelation: "exact",
      startAvailable: false,
      resumeAvailable: false,
      reason: managerState.value.reason ?? "companion_service_starting",
      runtime,
      maintenance,
      loaded,
      desiredState: desiredState.record,
    });
  }
  return serviceObservation({
    layout,
    configuration,
    status: "recovery_required",
    checkoutRelation: "exact",
    startAvailable: true,
    resumeAvailable: false,
    reason: managerState.state === "valid"
      ? managerState.value?.reason ?? "companion_service_runtime_recovery_required"
      : "companion_service_manager_state_unavailable",
    runtime,
    maintenance,
    loaded,
    desiredState: desiredState.record,
  });
}

export function publicCompanionServiceProjection(observation) {
  const status = COMPANION_SERVICE_PUBLIC_STATES.includes(observation?.status)
    ? observation.status
    : "ambiguous";
  return {
    contract: COMPANION_SERVICE_CONTRACT,
    service_version: COMPANION_SERVICE_MANAGER_VERSION,
    platform_support: status === "unsupported" ? "unsupported" : "supported",
    status,
    checkout_relation: observation?.checkout_relation ?? "unverifiable",
    service_identity: observation?.service_identity
      ? `sha256:${observation.service_identity}`
      : null,
    start_available: observation?.start_available === true,
    canonical_resume_available: observation?.resume_available === true,
    reason: observation?.reason ?? "companion_service_status_unavailable",
    next_action: serviceNextAction(status, observation?.reason),
    authority: lifecycleAuthority(false),
  };
}

export async function installCompanionService({
  repositoryRoot,
  nodePath = process.execPath,
  environment = process.env,
  platform = process.platform,
  homeDirectory = null,
  testScope = null,
  launchctl = defaultLaunchctl,
  waitMs = DEFAULT_LIVE_WAIT_MS,
} = {}) {
  assertSupportedServiceHost(platform);
  const layout = resolveCompanionServiceLayout({
    repositoryRoot,
    environment,
    platform,
    homeDirectory,
    testScope,
  });
  if (readRegularJson(layout.stale_decommission_path).state !== "missing") {
    throw new PublicCompanionServiceError(
      "companion_service_stale_decommission_incomplete",
    );
  }
  assertNoOtherProductionCompanionService(layout);
  const node = inspectNodeBinary(nodePath);
  if (!node.valid) {
    throw new PublicCompanionServiceError("companion_service_node24_required");
  }
  const managerEntryPath = path.join(
    layout.repository.realpath,
    "scripts",
    "augnes-companion-service.mjs",
  );
  assertRegularNonSymlink(managerEntryPath, "companion_service_source_invalid");
  const configuration = {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: COMPANION_SERVICE_SCHEMA_VERSION,
    manager_version: COMPANION_SERVICE_MANAGER_VERSION,
    service_label: layout.service_label,
    service_identity: layout.service_identity,
    repository_root: layout.repository.realpath,
    repository_fingerprint: layout.repository.repository_fingerprint,
    repository_device: layout.repository.device,
    repository_inode: layout.repository.inode,
    node_path: node.path,
    node_version: node.version,
    manager_entry_path: managerEntryPath,
    service_source_fingerprint: computeServiceSourceFingerprint(
      layout.repository.realpath,
    ),
    runtime_state_directory: layout.runtime_directory,
    runtime_home_directory: layout.test
      ? path.join(layout.test.root, "home")
      : layout.home,
    database_path: layout.test
      ? path.join(layout.test.root, "data", "augnes.db")
      : null,
    configuration_path: layout.configuration_path,
    launch_agent_path: layout.launch_agent_path,
    installed_at: new Date().toISOString(),
    test_scope: layout.test?.scope ?? null,
    test_root: layout.test?.root ?? null,
  };
  const plist = buildLaunchAgentPlist(configuration);

  const existingConfiguration = readRegularJson(layout.configuration_path);
  const existingPlist = readRegularText(layout.launch_agent_path);
  const existingDesiredState = readRegularJson(layout.desired_state_path);
  if (
    existingConfiguration.state !== "missing" ||
    existingPlist.state !== "missing" ||
    existingDesiredState.state !== "missing"
  ) {
    if (
      existingConfiguration.state !== "valid" ||
      existingPlist.state !== "valid" ||
      existingDesiredState.state !== "valid"
    ) {
      throw new PublicCompanionServiceError(
        "companion_service_installation_conflict",
      );
    }
    const desiredValidation = validateDesiredStateRecord(
      existingDesiredState.value,
      existingConfiguration.value,
    );
    if (!desiredValidation.valid) {
      throw new PublicCompanionServiceError(desiredValidation.reason);
    }
    if (
      sameInstalledConfiguration(existingConfiguration.value, configuration) &&
      existingPlist.contents === plist
    ) {
      return startCompanionService({
        repositoryRoot,
        environment,
        platform,
        homeDirectory,
        testScope,
        launchctl,
        waitMs,
      });
    }
    if (!replaceableInstalledConfiguration(existingConfiguration.value, layout)) {
      throw new PublicCompanionServiceError(
        "companion_service_installation_conflict",
      );
    }
    const maintenance = classifyMaintenanceLease({
      leasePath: layout.maintenance_lease_path,
      configuration: existingConfiguration.value,
    });
    if (maintenance.status === "active" || maintenance.status === "ambiguous") {
      throw new PublicCompanionServiceError(
        "companion_service_update_maintenance_refused",
      );
    }
    await stopCompanionService({
      repositoryRoot,
      environment,
      platform,
      homeDirectory,
      testScope,
      launchctl,
      waitMs: STOP_WAIT_MS,
    });
    if (maintenance.status === "stale") {
      removeExactMaintenanceLease(
        layout.maintenance_lease_path,
        maintenance.lease,
      );
    }
    for (const file of [layout.manager_state_path, layout.manager_lock_path]) {
      removeServiceOwnedStateFile(file, existingConfiguration.value);
    }
    removeOwnedRegularFile(layout.launch_agent_path, existingPlist.contents);
    removeServiceOwnedDesiredState(
      layout.desired_state_path,
      existingConfiguration.value,
    );
    removeOwnedRegularJson(
      layout.configuration_path,
      existingConfiguration.value,
    );
  }

  ensureOwnedDirectory(layout.service_directory);
  ensureLaunchAgentDirectory(path.dirname(layout.launch_agent_path));
  atomicWriteJson(layout.configuration_path, configuration, 0o600);
  let desiredState = null;
  try {
    desiredState = setExactDesiredState({
      layout,
      configuration,
      desiredState: "running",
      allowMissing: true,
    }).record;
    atomicWriteText(layout.launch_agent_path, plist, 0o600, true);
    const result = launchctl([
      "bootstrap",
      `gui/${currentUid()}`,
      layout.launch_agent_path,
    ]);
    if (result.status !== 0 && !launchctlLoaded(layout, launchctl)) {
      throw new PublicCompanionServiceError("companion_service_load_failed");
    }
    const observation = await waitForServiceStatus({
      repositoryRoot,
      environment,
      platform,
      homeDirectory,
      testScope,
      launchctl,
      waitMs,
      accepted: new Set(["live"]),
    });
    if (observation.status !== "live") {
      throw new PublicCompanionServiceError(
        observation.reason ?? "companion_service_start_failed",
      );
    }
    return lifecycleCommandResult("install", observation, true);
  } catch (error) {
    defaultLaunchctlSafeBootout(layout, launchctl);
    removeOwnedRegularFile(layout.launch_agent_path, plist);
    if (desiredState) {
      removeOwnedRegularJson(layout.desired_state_path, desiredState);
    }
    removeOwnedRegularJson(layout.configuration_path, configuration);
    removeDirectoryIfEmpty(layout.service_directory);
    throw error;
  }
}

export async function startCompanionService(options = {}) {
  const preliminary = await inspectCompanionService(options);
  if (!preliminary.configuration || preliminary.checkout_relation !== "exact") {
    return startCompanionServiceUnlocked(options);
  }
  const lock = await acquireLifecycleLock(
    preliminary.layout,
    preliminary.configuration,
    (Number.isInteger(options.waitMs) ? options.waitMs : DEFAULT_LIVE_WAIT_MS) +
      STOP_WAIT_MS,
  );
  try {
    return await startCompanionServiceUnlocked(options);
  } finally {
    releaseLifecycleLock(preliminary.layout, lock);
  }
}

async function startCompanionServiceUnlocked({
  repositoryRoot,
  environment = process.env,
  platform = process.platform,
  homeDirectory = null,
  testScope = null,
  launchctl = defaultLaunchctl,
  waitMs = DEFAULT_LIVE_WAIT_MS,
} = {}) {
  const before = await inspectCompanionService({
    repositoryRoot,
    environment,
    platform,
    homeDirectory,
    testScope,
    launchctl,
  });
  if (before.layout) assertNoOtherProductionCompanionService(before.layout);
  if (before.status === "live") {
    return lifecycleCommandResult("start", before, false);
  }
  if (before.status === "starting") {
    const after = await waitForServiceStatus({
      repositoryRoot,
      environment,
      platform,
      homeDirectory,
      testScope,
      launchctl,
      waitMs,
      accepted: new Set(["live", "recovery_required"]),
    });
    if (after.status !== "live") {
      throw new PublicCompanionServiceError(after.reason);
    }
    return lifecycleCommandResult("start", after, false);
  }
  if (
    !["installed_stopped", "recovery_required"].includes(before.status) ||
    !before.configuration ||
    before.checkout_relation !== "exact"
  ) {
    throw new PublicCompanionServiceError(startRefusalCode(before.status));
  }
  if (before.maintenance?.status === "active") {
    return lifecycleCommandResult("start", before, false);
  }
  let maintenanceRecovered = false;
  if (before.maintenance?.status === "stale") {
    removeExactMaintenanceLease(
      before.layout.maintenance_lease_path,
      before.maintenance.lease,
    );
    maintenanceRecovered = true;
  }

  const desiredState = setExactDesiredState({
    layout: before.layout,
    configuration: before.configuration,
    desiredState: "running",
  });

  const wasLoaded = before.loaded === true;
  const command = wasLoaded
    ? ["kickstart", `gui/${currentUid()}/${before.layout.service_label}`]
    : [
        "bootstrap",
        `gui/${currentUid()}`,
        before.layout.launch_agent_path,
      ];
  const result = launchctl(command);
  if (result.status !== 0 && !launchctlLoaded(before.layout, launchctl)) {
    throw new PublicCompanionServiceError("companion_service_start_failed");
  }
  const after = await waitForServiceStatus({
    repositoryRoot,
    environment,
    platform,
    homeDirectory,
    testScope,
    launchctl,
    waitMs,
    accepted: new Set(["live"]),
  });
  if (after.status !== "live") {
    throw new PublicCompanionServiceError(after.reason);
  }
  return lifecycleCommandResult(
    "start",
    after,
    desiredState.changed || maintenanceRecovered || result.status === 0,
  );
}

export async function stopCompanionService(options = {}) {
  const preliminary = await inspectCompanionService(options);
  if (!preliminary.configuration || preliminary.checkout_relation !== "exact") {
    return stopCompanionServiceUnlocked(options);
  }
  const lock = await acquireLifecycleLock(
    preliminary.layout,
    preliminary.configuration,
    (Number.isInteger(options.waitMs) ? options.waitMs : STOP_WAIT_MS) +
      STOP_WAIT_MS,
  );
  try {
    return await stopCompanionServiceUnlocked(options);
  } finally {
    releaseLifecycleLock(preliminary.layout, lock);
  }
}

async function stopCompanionServiceUnlocked({
  repositoryRoot,
  environment = process.env,
  platform = process.platform,
  homeDirectory = null,
  testScope = null,
  launchctl = defaultLaunchctl,
  waitMs = STOP_WAIT_MS,
} = {}) {
  const before = await inspectCompanionService({
    repositoryRoot,
    environment,
    platform,
    homeDirectory,
    testScope,
    launchctl,
  });
  if (before.status === "not_installed") {
    return lifecycleCommandResult("stop", before, false);
  }
  if (!before.configuration || before.checkout_relation !== "exact") {
    throw new PublicCompanionServiceError("companion_service_stop_refused");
  }
  if (before.status === "maintenance") {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_active",
    );
  }
  if (!replaceableInstalledConfiguration(before.configuration, before.layout)) {
    throw new PublicCompanionServiceError("companion_service_stop_refused");
  }
  const desiredState = setExactDesiredState({
    layout: before.layout,
    configuration: before.configuration,
    desiredState: "stopped",
  });
  const loaded = typeof before.loaded === "boolean"
    ? before.loaded
    : launchctlLoaded(before.layout, launchctl);
  if (!loaded) {
    if (before.runtime?.verified) {
      const residual = exactResidualSupervisor(before);
      if (!residual) {
        throw new PublicCompanionServiceError(
          "companion_service_supervisor_ownership_unverifiable",
        );
      }
      await stopManagedSupervisor({
        child: null,
        childIdentity: null,
        adoptedPid: residual,
        layout: before.layout,
        configuration: before.configuration,
      });
      const afterResidualStop = await waitForServiceStatus({
        repositoryRoot,
        environment,
        platform,
        homeDirectory,
        testScope,
        launchctl,
        waitMs,
        accepted: new Set(
          before.status === "service_update_required"
            ? ["service_update_required"]
            : ["installed_stopped"],
        ),
      });
      return lifecycleCommandResult("stop", afterResidualStop, true);
    }
    if (
      exactManagerStateExplicitlyStopped({
        layout: before.layout,
        configuration: before.configuration,
      }) &&
      await waitForRuntimeGenerationMaterialMissing(before.layout, 2_000)
    ) {
      if (before.status === "service_update_required") {
        return lifecycleCommandResult("stop", before, desiredState.changed);
      }
      return lifecycleCommandResult("stop", {
        ...before,
        status: "installed_stopped",
        start_available: true,
        resume_available: false,
        reason: "companion_service_installed_stopped",
      }, desiredState.changed);
    }
    if (await stopExactResidualRuntime({
      layout: before.layout,
      configuration: before.configuration,
    })) {
      const afterResidualStop = await waitForServiceStatus({
        repositoryRoot,
        environment,
        platform,
        homeDirectory,
        testScope,
        launchctl,
        waitMs,
        accepted: new Set(
          before.status === "service_update_required"
            ? ["service_update_required"]
            : ["installed_stopped"],
        ),
      });
      return lifecycleCommandResult("stop", afterResidualStop, true);
    }
    if (before.status === "service_update_required") {
      return lifecycleCommandResult("stop", before, desiredState.changed);
    }
    return lifecycleCommandResult("stop", {
      ...before,
      status: "installed_stopped",
      start_available: true,
      resume_available: false,
      reason: "companion_service_installed_stopped",
    }, desiredState.changed);
  }
  const managerState = readRegularJson(before.layout.manager_state_path);
  const managerPid = managerState.state === "valid"
    ? managerState.value?.manager_pid
    : null;
  const managerIdentity = managerState.state === "valid"
    ? managerState.value?.manager_process_identity
    : null;
  const result = launchctl([
    "bootout",
    `gui/${currentUid()}/${before.layout.service_label}`,
  ]);
  if (result.status !== 0 && launchctlLoaded(before.layout, launchctl)) {
    throw new PublicCompanionServiceError("companion_service_stop_failed");
  }
  if (
    Number.isInteger(managerPid) &&
    typeof managerIdentity === "string" &&
    !(await waitForExactProcessExit(managerPid, managerIdentity, waitMs))
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_manager_stop_timeout",
    );
  }
  const after = await waitForServiceStatus({
    repositoryRoot,
    environment,
    platform,
    homeDirectory,
    testScope,
    launchctl,
    waitMs,
    accepted: new Set(
      before.status === "service_update_required"
        ? ["service_update_required"]
        : ["installed_stopped"],
    ),
  });
  return lifecycleCommandResult(
    "stop",
    after,
    desiredState.changed || result.status === 0,
  );
}

export async function uninstallCompanionService(options = {}) {
  const before = await inspectCompanionService(options);
  if (before.status === "not_installed") {
    return lifecycleCommandResult("uninstall", before, false);
  }
  if (
    before.status === "recovery_required" &&
    before.checkout_relation === "substituted_or_moved" &&
    [
      "companion_service_checkout_identity_changed",
      "companion_service_stale_decommission_incomplete",
    ].includes(before.reason)
  ) {
    return decommissionStaleCheckoutCompanionService({
      ...options,
      before,
    });
  }
  if (!before.configuration || before.checkout_relation !== "exact") {
    throw new PublicCompanionServiceError("companion_service_uninstall_refused");
  }
  if (before.status === "maintenance") {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_active",
    );
  }
  if (!replaceableInstalledConfiguration(before.configuration, before.layout)) {
    throw new PublicCompanionServiceError("companion_service_uninstall_refused");
  }
  await stopCompanionService(options);
  const layout = before.layout;
  removeInactiveLifecycleLock(layout, before.configuration);
  removeOwnedRegularFile(
    layout.launch_agent_path,
    buildLaunchAgentPlist(before.configuration),
  );
  for (const file of [
    layout.manager_state_path,
    layout.manager_lock_path,
    layout.maintenance_lease_path,
  ]) {
    removeServiceOwnedStateFile(file, before.configuration);
  }
  removeServiceOwnedDesiredState(
    layout.desired_state_path,
    before.configuration,
  );
  removeOwnedRegularJson(layout.configuration_path, before.configuration);
  removeDirectoryIfEmpty(layout.service_directory);
  removeDirectoryIfEmpty(layout.runtime_directory);
  return lifecycleCommandResult("uninstall", serviceObservation({
    layout,
    status: "not_installed",
    checkoutRelation: "exact",
    startAvailable: false,
    resumeAvailable: false,
    reason: "companion_service_not_installed",
  }), true);
}

async function decommissionStaleCheckoutCompanionService({
  before,
  repositoryRoot,
  environment = process.env,
  platform = process.platform,
  homeDirectory = null,
  testScope = null,
  launchctl = defaultLaunchctl,
  waitMs = STOP_WAIT_MS,
  testFaultAfterStep = null,
  testBeforeUnlink = null,
  testSwapInsideUnlinkMaterial = null,
} = {}) {
  assertSupportedServiceHost(platform);
  const layout = before?.layout;
  const configuration = before?.configuration;
  if (
    !layout ||
    !staleCheckoutDecommissionConfigurationExact(configuration, layout)
  ) {
    throw staleCheckoutDecommissionRefused();
  }
  assertStaleDecommissionLifecyclePaths(layout);
  assertNoOtherProductionCompanionService(layout);
  const lifecycleLock = await acquireLifecycleLock(
    layout,
    configuration,
    waitMs,
  );
  let record;
  try {
    record = readExistingStaleCheckoutDecommissionRecord(layout);
    if (record === null) {
      const pending = buildStaleCheckoutDecommissionRecord({
        before,
        layout,
        configuration,
        launchctl,
      });
      let currentLaunchProcess = null;
      if (pending.launch_job !== null) {
        const currentLaunchJob = assertExactLoadedLaunchJob(
          pending,
          layout,
          launchctl,
        );
        if (currentLaunchJob.pid !== null) {
          const currentIdentity = readProcessBirthIdentity(currentLaunchJob.pid);
          if (currentIdentity.state === "unavailable") {
            throw staleCheckoutDecommissionRefused();
          }
          if (currentIdentity.state === "present") {
            currentLaunchProcess = {
              pid: currentLaunchJob.pid,
              identity: currentIdentity.identity,
            };
          }
        }
        const result = launchctl([
          "bootout",
          `gui/${currentUid()}/${configuration.service_label}`,
        ]);
        if (result.status !== 0 && launchctlLoaded(layout, launchctl)) {
          throw new PublicCompanionServiceError(
            "companion_service_stale_checkout_decommission_stop_failed",
          );
        }
      }
      maybeInjectStaleDecommissionTestFault(
        layout,
        testFaultAfterStep,
        "bootout",
      );
      if (launchctlLoaded(layout, launchctl)) {
        throw new PublicCompanionServiceError(
          "companion_service_stale_checkout_decommission_stop_failed",
        );
      }
      await waitForStaleDecommissionProcessesAbsent(
        pending,
        waitMs,
        currentLaunchProcess,
      );
      record = buildStaleCheckoutDecommissionRecord({
        before,
        layout,
        configuration,
        launchctl,
      });
      if (record.launch_job !== null || record.owned_processes.length !== 0) {
        throw staleCheckoutDecommissionRefused();
      }
      createExclusiveStaleDecommissionRecord(layout, record);
      maybeInjectStaleDecommissionTestFault(
        layout,
        testFaultAfterStep,
        "journal",
      );
    }
    assertStaleCheckoutDecommissionRecordCurrent(record, layout);
    for (const materialKey of STALE_DECOMMISSION_MATERIAL_KEYS) {
      removeStaleDecommissionMaterial(
        record,
        layout,
        materialKey,
        testBeforeUnlink,
        testSwapInsideUnlinkMaterial,
      );
      maybeInjectStaleDecommissionTestFault(
        layout,
        testFaultAfterStep,
        materialKey,
      );
    }
  } finally {
    releaseLifecycleLock(layout, lifecycleLock);
  }
  assertNoStaleDecommissionHelperResidue(record, layout);
  removeStaleDecommissionRecord(record, layout);
  removeDirectoryIfEmpty(layout.service_directory);
  removeDirectoryIfEmpty(layout.runtime_directory);
  const after = await inspectCompanionService({
    repositoryRoot,
    environment,
    platform,
    homeDirectory,
    testScope,
    launchctl,
  });
  if (after.status !== "not_installed") {
    throw new PublicCompanionServiceError(
      "companion_service_stale_checkout_decommission_incomplete",
    );
  }
  return lifecycleCommandResult("uninstall", after, true);
}

export async function acquireCompanionServiceMaintenance({
  repositoryRoot,
  operationId,
  environment = process.env,
  platform = process.platform,
  homeDirectory = null,
  testScope = null,
  launchctl = defaultLaunchctl,
  ttlMs = DEFAULT_MAINTENANCE_TTL_MS,
  waitMs = MAINTENANCE_WAIT_MS,
  joinAncestorLease = false,
} = {}) {
  if (!validOperationId(operationId)) {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_operation_invalid",
    );
  }
  if (!Number.isInteger(ttlMs) || ttlMs < 1_000 || ttlMs > MAX_MAINTENANCE_TTL_MS) {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_ttl_invalid",
    );
  }
  const before = await inspectCompanionService({
    repositoryRoot,
    environment,
    platform,
    homeDirectory,
    testScope,
    launchctl,
  });
  if (["unsupported", "not_installed"].includes(before.status)) {
    return {
      acquired: false,
      lease: null,
      before: boundedLifecycleState(before),
      reason: before.reason,
    };
  }
  if (
    joinAncestorLease &&
    before.status === "maintenance" &&
    before.maintenance?.status === "active" &&
    processIsDescendantOf(process.pid, before.maintenance.lease.owner_pid)
  ) {
    return {
      acquired: false,
      joined: true,
      lease: null,
      before: boundedLifecycleState(before),
      reason: "companion_service_maintenance_joined_ancestor",
    };
  }
  if (
    before.status === "service_update_required" &&
    await exactStoppedStaleSourceMaintenanceNotRequired({
      observation: before,
      launchctl,
    })
  ) {
    return {
      acquired: false,
      lease: null,
      before: boundedLifecycleState(before),
      reason: "companion_service_maintenance_not_required",
    };
  }
  if (!["live", "starting", "installed_stopped"].includes(before.status)) {
    throw new PublicCompanionServiceError(
      before.status === "service_update_required"
        ? "companion_service_update_required"
        : before.status === "maintenance"
          ? "companion_service_maintenance_in_progress"
          : "companion_service_maintenance_refused",
    );
  }
  if (!before.configuration || before.checkout_relation !== "exact") {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_refused",
    );
  }
  const durableDesiredState = readExactDesiredState(
    before.layout,
    before.configuration,
  );
  if (durableDesiredState.desired_state === "stopped") {
    return {
      acquired: false,
      lease: null,
      before: boundedLifecycleState(before),
      reason: "companion_service_maintenance_not_required",
    };
  }
  const ownerIdentity = readProcessBirthIdentity(process.pid);
  if (ownerIdentity.state !== "present") {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_owner_unverifiable",
    );
  }
  const nowMs = Date.now();
  const lease = {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: COMPANION_SERVICE_SCHEMA_VERSION,
    service_identity: before.configuration.service_identity,
    repository_fingerprint: before.configuration.repository_fingerprint,
    operation_id: operationId,
    owner_pid: process.pid,
    owner_process_identity: ownerIdentity.identity,
    pre_maintenance_desired_state: durableDesiredState.desired_state,
    acquired_at: new Date(nowMs).toISOString(),
    expires_at: new Date(nowMs + ttlMs).toISOString(),
  };
  createExclusiveJson(before.layout.maintenance_lease_path, lease);
  if (lease.pre_maintenance_desired_state === "running" && before.loaded) {
    const maintenance = await waitForMaintenancePause({
      repositoryRoot,
      environment,
      platform,
      homeDirectory,
      testScope,
      launchctl,
      waitMs,
    });
    if (maintenance.status !== "maintenance" || maintenance.runtime?.verified) {
      removeExactMaintenanceLease(before.layout.maintenance_lease_path, lease);
      throw new PublicCompanionServiceError(
        "companion_service_maintenance_pause_failed",
      );
    }
  }
  return {
    acquired: true,
    lease: Object.defineProperty(lease, "layout", {
      value: before.layout,
      enumerable: false,
    }),
    before: boundedLifecycleState(before),
    reason: "companion_service_maintenance_acquired",
  };
}

export async function releaseCompanionServiceMaintenance({
  lease,
  repositoryRoot,
  environment = process.env,
  platform = process.platform,
  homeDirectory = null,
  testScope = null,
  launchctl = defaultLaunchctl,
  waitMs = DEFAULT_LIVE_WAIT_MS,
} = {}) {
  if (!lease) {
    const observation = await inspectCompanionService({
      repositoryRoot,
      environment,
      platform,
      homeDirectory,
      testScope,
      launchctl,
    });
    return { released: false, after: boundedLifecycleState(observation) };
  }
  const layout = lease.layout ?? resolveCompanionServiceLayout({
    repositoryRoot,
    environment,
    platform,
    homeDirectory,
    testScope,
  });
  const configurationResult = readRegularJson(layout.configuration_path);
  if (configurationResult.state !== "valid") {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_restore_refused",
    );
  }
  const desiredState = readExactDesiredState(
    layout,
    configurationResult.value,
  );
  if (
    desiredState.desired_state !== lease.pre_maintenance_desired_state
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_desired_state_conflict",
    );
  }
  removeExactMaintenanceLease(layout.maintenance_lease_path, lease);
  const accepted = lease.pre_maintenance_desired_state === "running"
    ? new Set(["live"])
    : new Set(["installed_stopped"]);
  const after = await waitForServiceStatus({
    repositoryRoot,
    environment,
    platform,
    homeDirectory,
    testScope,
    launchctl,
    waitMs,
    accepted,
  });
  if (!accepted.has(after.status)) {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_restore_failed",
    );
  }
  return { released: true, after: boundedLifecycleState(after) };
}

export async function runWithCompanionServiceMaintenance({
  repositoryRoot,
  operationId,
  run,
  ...options
} = {}) {
  const acquired = await acquireCompanionServiceMaintenance({
    repositoryRoot,
    operationId,
    ...options,
  });
  let value;
  let runError = null;
  try {
    value = await run({ maintenance: acquired });
  } catch (error) {
    runError = error;
  } finally {
    const release = await releaseCompanionServiceMaintenance({
      lease: acquired.lease,
      repositoryRoot,
      ...options,
    });
    if (runError) throw runError;
    return { value, maintenance: acquired, release };
  }
}

export async function runCompanionServiceManager({
  configurationPath,
  launchEnvironment = process.env,
} = {}) {
  assertSupportedServiceHost(process.platform);
  assertRegularNonSymlink(
    configurationPath,
    "companion_service_configuration_invalid",
  );
  const configurationResult = readRegularJson(configurationPath);
  if (configurationResult.state !== "valid") {
    throw new PublicCompanionServiceError(
      "companion_service_configuration_invalid",
    );
  }
  const configuration = configurationResult.value;
  const managerEnvironment = configuration.test_scope
    ? {
        ...launchEnvironment,
        AUGNES_COMPANION_SERVICE_TEST_MODE: "1",
        AUGNES_COMPANION_SERVICE_TEST_SCOPE: configuration.test_scope,
        AUGNES_COMPANION_SERVICE_TEST_ROOT: configuration.test_root,
      }
    : launchEnvironment;
  const layout = resolveCompanionServiceLayout({
    repositoryRoot: configuration.repository_root,
    environment: managerEnvironment,
    platform: process.platform,
    homeDirectory: inferHomeFromConfiguration(configuration),
    testScope: configuration.test_scope,
  });
  const plist = readRegularText(layout.launch_agent_path);
  const validation = validateInstalledConfiguration({
    configuration,
    plist: plist.contents,
    layout,
  });
  if (!validation.valid) {
    throw new PublicCompanionServiceError(validation.reason);
  }
  let startupRefusal = null;
  try {
    assertNoOtherProductionCompanionService(layout);
  } catch (error) {
    startupRefusal = publicCode(
      error,
      "companion_service_production_registry_ambiguous",
    );
  }
  const desiredStateResult = readRegularJson(layout.desired_state_path);
  const desiredStateValidation = desiredStateResult.state === "valid"
    ? validateDesiredStateRecord(desiredStateResult.value, configuration)
    : {
        valid: false,
        reason: desiredStateResult.state === "missing"
          ? "companion_service_desired_state_missing"
          : "companion_service_desired_state_invalid",
      };
  if (!desiredStateValidation.valid) {
    startupRefusal ??= desiredStateValidation.reason;
  }
  if (process.execPath !== configuration.node_path) {
    throw new PublicCompanionServiceError(
      "companion_service_node_binding_stale",
    );
  }
  const node = inspectNodeBinary(configuration.node_path);
  if (!node.valid || node.version !== configuration.node_version) {
    throw new PublicCompanionServiceError(
      "companion_service_node_binding_stale",
    );
  }
  if (!installedManagerMaterialStillExact(configuration, layout)) {
    throw new PublicCompanionServiceError(
      "companion_service_configuration_stale",
    );
  }
  const recoverableManagerState = readRegularJson(layout.manager_state_path);
  const managerLock = acquireManagerLock(layout, configuration);
  if (startupRefusal) {
    writeManagerState(layout, configuration, {
      status: "recovery_required",
      reason: startupRefusal,
      supervisor_pid: null,
      restart_count: 0,
    });
    releaseManagerLock(layout, managerLock);
    return 0;
  }
  if (desiredStateValidation.record.desired_state === "stopped") {
    const maintenance = classifyMaintenanceLease({
      leasePath: layout.maintenance_lease_path,
      configuration,
    });
    if (
      maintenance.lease &&
      maintenance.lease.pre_maintenance_desired_state !== "stopped"
    ) {
      writeManagerState(layout, configuration, {
        status: "recovery_required",
        reason: "companion_service_maintenance_desired_state_conflict",
        supervisor_pid: null,
        restart_count: 0,
      });
      releaseManagerLock(layout, managerLock);
      return 0;
    }
    if (maintenance.status === "ambiguous" || maintenance.status === "active") {
      writeManagerState(layout, configuration, {
        status: maintenance.status === "active" ? "maintenance" : "recovery_required",
        reason: maintenance.status === "active"
          ? "companion_service_maintenance_active"
          : "companion_service_maintenance_ambiguous",
        supervisor_pid: null,
        restart_count: 0,
      });
      releaseManagerLock(layout, managerLock);
      return 0;
    }
    if (maintenance.status === "stale") {
      removeExactMaintenanceLease(
        layout.maintenance_lease_path,
        maintenance.lease,
      );
    }
    writeManagerState(layout, configuration, {
      status: "installed_stopped",
      reason: "companion_service_explicitly_stopped",
      supervisor_pid: null,
      restart_count: 0,
    });
    releaseManagerLock(layout, managerLock);
    return 0;
  }
  let shutdown = false;
  let child = null;
  let childIdentity = null;
  let childAttempt = null;
  let adoptedPid = null;
  let runtimeOwnership = null;
  let failures = 0;
  let lastFailureProvenance = recoverableManagerState.state === "valid"
    ? readCompanionSupervisorFailureProvenance(recoverableManagerState.value)
    : null;
  let shutdownSignal = null;

  const requestShutdown = (signal) => {
    shutdownSignal = signal;
    shutdown = true;
  };
  for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) {
    process.on(signal, () => requestShutdown(signal));
  }
  try {
    writeManagerState(layout, configuration, {
      status: "starting",
      reason: "companion_service_manager_started",
      supervisor_pid: null,
      restart_count: 0,
      supervisor_failure_provenance: lastFailureProvenance,
    });
    while (!shutdown) {
      if (!installedManagerMaterialStillExact(configuration, layout)) {
        throw new PublicCompanionServiceError(
          "companion_service_configuration_stale",
        );
      }
      const currentDesiredStateResult = readRegularJson(layout.desired_state_path);
      const currentDesiredState = currentDesiredStateResult.state === "valid"
        ? validateDesiredStateRecord(currentDesiredStateResult.value, configuration)
        : {
            valid: false,
            reason: currentDesiredStateResult.state === "missing"
              ? "companion_service_desired_state_missing"
              : "companion_service_desired_state_invalid",
          };
      if (!currentDesiredState.valid) {
        await stopManagedSupervisor({
          child, childIdentity, adoptedPid, layout, configuration,
        });
        child = null;
        childIdentity = null;
        childAttempt = null;
        adoptedPid = null;
        runtimeOwnership = null;
        lastFailureProvenance = null;
        writeManagerState(layout, configuration, {
          status: "recovery_required",
          reason: currentDesiredState.reason,
          supervisor_pid: null,
          restart_count: failures,
        });
        await delay(MANAGER_POLL_MS);
        continue;
      }
      if (currentDesiredState.record.desired_state === "stopped") {
        await stopManagedSupervisor({
          child, childIdentity, adoptedPid, layout, configuration,
        });
        child = null;
        childIdentity = null;
        childAttempt = null;
        adoptedPid = null;
        runtimeOwnership = null;
        lastFailureProvenance = null;
        writeManagerState(layout, configuration, {
          status: "installed_stopped",
          reason: "companion_service_explicitly_stopped",
          supervisor_pid: null,
          restart_count: failures,
        });
        break;
      }
      const maintenance = classifyMaintenanceLease({
        leasePath: layout.maintenance_lease_path,
        configuration,
      });
      if (
        maintenance.lease &&
        maintenance.lease.pre_maintenance_desired_state !== "running"
      ) {
        await stopManagedSupervisor({
          child, childIdentity, adoptedPid, layout, configuration,
        });
        child = null;
        childIdentity = null;
        childAttempt = null;
        adoptedPid = null;
        runtimeOwnership = null;
        lastFailureProvenance = null;
        writeManagerState(layout, configuration, {
          status: "recovery_required",
          reason: "companion_service_maintenance_desired_state_conflict",
          supervisor_pid: null,
          restart_count: failures,
        });
        await delay(MANAGER_POLL_MS);
        continue;
      }
      if (maintenance.status === "ambiguous") {
        await stopManagedSupervisor({
          child, childIdentity, adoptedPid, layout, configuration,
        });
        child = null;
        childIdentity = null;
        childAttempt = null;
        adoptedPid = null;
        runtimeOwnership = null;
        lastFailureProvenance = null;
        writeManagerState(layout, configuration, {
          status: "recovery_required",
          reason: "companion_service_maintenance_ambiguous",
          supervisor_pid: null,
          restart_count: failures,
        });
        await delay(MANAGER_POLL_MS);
        continue;
      }
      if (maintenance.status === "active") {
        await stopManagedSupervisor({
          child, childIdentity, adoptedPid, layout, configuration,
        });
        child = null;
        childIdentity = null;
        childAttempt = null;
        adoptedPid = null;
        runtimeOwnership = null;
        lastFailureProvenance = null;
        writeManagerState(layout, configuration, {
          status: "maintenance",
          reason: "companion_service_maintenance_active",
          supervisor_pid: null,
          restart_count: failures,
        });
        await delay(MANAGER_POLL_MS);
        continue;
      }
      if (maintenance.status === "stale") {
        removeExactMaintenanceLease(
          layout.maintenance_lease_path,
          maintenance.lease,
        );
        writeManagerState(layout, configuration, {
          status: "starting",
          reason: "companion_service_stale_maintenance_recovered",
          supervisor_pid: null,
          restart_count: failures,
        });
      }

      if (
        child &&
        processMatchesBirthIdentity(child.pid, childIdentity)
      ) {
        const runtime = await inspectVerifiedRuntime({ layout, configuration });
        if (runtime.verified) {
          runtimeOwnership = await captureManagerRuntimeOwnership({
            layout,
            configuration,
            runtime,
            previous: runtimeOwnership,
          });
          lastFailureProvenance = null;
        }
        writeManagerState(layout, configuration, {
          status: runtime.verified ? "live" : "starting",
          reason: runtime.verified
            ? "companion_service_live"
            : "companion_service_runtime_starting",
          supervisor_pid: child.pid,
          runtime_ownership: runtime.verified ? runtimeOwnership : null,
          restart_count: failures,
          supervisor_failure_provenance: lastFailureProvenance,
        });
        if (runtime.verified) failures = 0;
        await delay(MANAGER_POLL_MS);
        continue;
      }

      if (child) {
        failures += 1;
        lastFailureProvenance = snapshotCompanionSupervisorFailureProvenance({
          attempt: childAttempt ?? createCompanionSupervisorAttemptDiagnostics(),
          failureOrigin: childAttempt?.exit_observation
            ? "managed_child_exit_observed"
            : "managed_child_identity_lost",
          restartCount: failures,
        });
        child = null;
        childIdentity = null;
        childAttempt = null;
        runtimeOwnership = null;
      }

      if (adoptedPid && processMatchesBirthIdentity(adoptedPid.pid, adoptedPid.identity)) {
        const runtime = await inspectVerifiedRuntime({ layout, configuration });
        if (runtime.verified) {
          runtimeOwnership = await captureManagerRuntimeOwnership({
            layout,
            configuration,
            runtime,
            previous: runtimeOwnership,
          });
          lastFailureProvenance = null;
        }
        writeManagerState(layout, configuration, {
          status: runtime.verified ? "live" : "starting",
          reason: runtime.verified
            ? "companion_service_live"
            : "companion_service_adopted_runtime_starting",
          supervisor_pid: adoptedPid.pid,
          runtime_ownership: runtime.verified ? runtimeOwnership : null,
          restart_count: failures,
          supervisor_failure_provenance: lastFailureProvenance,
        });
        await delay(MANAGER_POLL_MS);
        continue;
      }
      adoptedPid = null;
      runtimeOwnership = null;

      const existingRuntime = await inspectVerifiedRuntime({ layout, configuration });
      if (existingRuntime.verified) {
        const previousPid = recoverableManagerState.state === "valid"
          ? recoverableManagerState.value?.supervisor_pid
          : null;
        const previousIdentity = recoverableManagerState.state === "valid"
          ? recoverableManagerState.value?.supervisor_process_identity
          : null;
        if (
          previousPid === existingRuntime.supervisor_pid &&
          processMatchesBirthIdentity(previousPid, previousIdentity)
        ) {
          adoptedPid = { pid: previousPid, identity: previousIdentity };
          continue;
        }
        writeManagerState(layout, configuration, {
          status: "recovery_required",
          reason: "companion_service_foreign_runtime_conflict",
          supervisor_pid: null,
          restart_count: failures,
          supervisor_failure_provenance: lastFailureProvenance,
        });
        await delay(MANAGER_POLL_MS);
        continue;
      }

      if (failures > 0) {
        const backoff = MANAGER_BACKOFF_MS[
          Math.min(failures - 1, MANAGER_BACKOFF_MS.length - 1)
        ];
        writeManagerState(layout, configuration, {
          status: "starting",
          reason: "companion_service_restart_backoff",
          supervisor_pid: null,
          restart_count: failures,
          restart_after: new Date(Date.now() + backoff).toISOString(),
          supervisor_failure_provenance: lastFailureProvenance,
        });
        await delay(backoff);
        if (shutdown) break;
      }

      const currentNode = inspectNodeBinary(configuration.node_path);
      if (!currentNode.valid || currentNode.version !== configuration.node_version) {
        throw new PublicCompanionServiceError(
          "companion_service_node_binding_stale",
        );
      }

      child = spawn(
        configuration.node_path,
        [
          path.join(configuration.repository_root, "scripts", "augnes-runtime-supervisor.mjs"),
          "start",
        ],
        {
          cwd: configuration.repository_root,
          env: serviceChildEnvironment(configuration, managerEnvironment),
          stdio: ["ignore", "pipe", "pipe"],
          detached: true,
        },
      );
      childAttempt = createCompanionSupervisorAttemptDiagnostics();
      const currentAttempt = childAttempt;
      for (const stream of [child.stdout, child.stderr]) {
        stream.setEncoding("utf8");
        stream.on("data", (chunk) => {
          appendCompanionSupervisorAttemptOutput(currentAttempt, chunk);
        });
      }
      child.once("error", () => {});
      child.once("exit", (code, signal) => {
        observeCompanionSupervisorAttemptExit(currentAttempt, code, signal);
      });
      childIdentity = await waitForProcessIdentity(child.pid);
      if (!childIdentity) {
        child.kill("SIGTERM");
        failures += 1;
        lastFailureProvenance = snapshotCompanionSupervisorFailureProvenance({
          attempt: currentAttempt,
          failureOrigin: "child_birth_identity_unavailable",
          restartCount: failures,
        });
        child = null;
        childIdentity = null;
        childAttempt = null;
        continue;
      }
      writeManagerState(layout, configuration, {
        status: "starting",
        reason: "companion_service_supervisor_started",
        supervisor_pid: child.pid,
        supervisor_process_identity: childIdentity,
        restart_count: failures,
        supervisor_failure_provenance: lastFailureProvenance,
      });
      await delay(MANAGER_POLL_MS);
    }
  } finally {
    await stopManagedSupervisor({
      child, childIdentity, adoptedPid, layout, configuration,
    });
    writeManagerState(layout, configuration, {
      status: "installed_stopped",
      reason: "companion_service_explicitly_stopped",
      supervisor_pid: null,
      restart_count: failures,
    });
    releaseManagerLock(layout, managerLock);
    for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) {
      process.removeAllListeners(signal);
    }
  }
  return shutdownSignal ? 1 : 0;
}

export function boundedLifecycleState(observation) {
  return {
    status: observation?.status ?? "ambiguous",
    checkout_relation: observation?.checkout_relation ?? "unverifiable",
    service_identity: observation?.service_identity
      ? `sha256:${observation.service_identity}`
      : null,
  };
}

export function lifecycleAuthority(runtimeLifecycleEffect) {
  return {
    runtime_lifecycle_effect: runtimeLifecycleEffect === true,
    repository_execution_authority: false,
    managed_run_started_or_resumed: false,
    project_file_write_authority: false,
    semantic_authority: false,
    provider_authority: false,
    model_authority: false,
    approval_authority: false,
    external_effect_authority: false,
    publication_authority: false,
    merge_authority: false,
  };
}

export function computeServiceSourceFingerprint(repositoryRoot) {
  const hash = createHash("sha256");
  for (const relativePath of SERVICE_SOURCE_FILES) {
    const file = path.join(repositoryRoot, relativePath);
    assertRegularNonSymlink(file, "companion_service_source_invalid");
    hash.update(relativePath);
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function selectSupportedNode24Binary({
  environment = process.env,
  candidates = [],
} = {}) {
  const pathCandidates = typeof environment.PATH === "string"
    ? environment.PATH.split(path.delimiter).map((entry) => path.join(entry, "node"))
    : [];
  const ordered = [
    ...candidates,
    process.execPath,
    "/opt/homebrew/opt/node@24/bin/node",
    "/usr/local/opt/node@24/bin/node",
    ...pathCandidates,
  ];
  const seen = new Set();
  for (const candidate of ordered) {
    if (typeof candidate !== "string" || seen.has(candidate)) continue;
    seen.add(candidate);
    const node = inspectNodeBinary(candidate);
    if (node.valid) return node;
  }
  throw new PublicCompanionServiceError("companion_service_node24_required");
}

export function buildLaunchAgentPlist(configuration) {
  const args = [
    configuration.node_path,
    configuration.manager_entry_path,
    "run",
    "--config",
    configurationPathFor(configuration),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    "<dict>",
    "  <key>Label</key>",
    `  <string>${xml(configuration.service_label)}</string>`,
    "  <key>ProgramArguments</key>",
    "  <array>",
    ...args.map((value) => `    <string>${xml(value)}</string>`),
    "  </array>",
    "  <key>WorkingDirectory</key>",
    `  <string>${xml(configuration.repository_root)}</string>`,
    "  <key>RunAtLoad</key>",
    "  <true/>",
    "  <key>KeepAlive</key>",
    "  <dict>",
    "    <key>SuccessfulExit</key>",
    "    <false/>",
    "  </dict>",
    "  <key>ThrottleInterval</key>",
    "  <integer>5</integer>",
    "  <key>ProcessType</key>",
    "  <string>Background</string>",
    "  <key>LimitLoadToSessionType</key>",
    "  <string>Aqua</string>",
    "  <key>StandardOutPath</key>",
    "  <string>/dev/null</string>",
    "  <key>StandardErrorPath</key>",
    "  <string>/dev/null</string>",
    "</dict>",
    "</plist>",
    "",
  ].join("\n");
}

function configurationPathFor(configuration) {
  if (
    typeof configuration.configuration_path !== "string" ||
    !path.isAbsolute(configuration.configuration_path)
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_configuration_path_invalid",
    );
  }
  return configuration.configuration_path;
}

function validateInstalledConfiguration({ configuration, plist, layout }) {
  const exactContract =
    isObject(configuration) &&
    configuration.contract === COMPANION_SERVICE_CONTRACT &&
    configuration.schema_version === COMPANION_SERVICE_SCHEMA_VERSION &&
    configuration.manager_version === COMPANION_SERVICE_MANAGER_VERSION;
  if (!exactContract) {
    return invalidConfiguration(
      "companion_service_configuration_version_stale",
      true,
      "exact",
    );
  }
  const exactRelation =
    configuration.repository_root === layout.repository.realpath &&
    configuration.repository_fingerprint ===
      layout.repository.repository_fingerprint &&
    configuration.repository_device === layout.repository.device &&
    configuration.repository_inode === layout.repository.inode;
  if (!exactRelation) {
    return invalidConfiguration(
      "companion_service_checkout_identity_changed",
      false,
      "substituted_or_moved",
    );
  }
  const exactService =
    configuration.service_label === layout.service_label &&
    configuration.service_identity === layout.service_identity &&
    configuration.runtime_state_directory === layout.runtime_directory &&
    configuration.runtime_home_directory ===
      (layout.test ? path.join(layout.test.root, "home") : layout.home) &&
    configuration.database_path ===
      (layout.test ? path.join(layout.test.root, "data", "augnes.db") : null) &&
    configuration.configuration_path === layout.configuration_path &&
    configuration.launch_agent_path === layout.launch_agent_path &&
    configuration.test_scope === (layout.test?.scope ?? null);
  const exactTestRoot = configuration.test_scope === null
    ? configuration.test_root === null
    : configuration.test_root === layout.test?.root;
  if (!exactService || !exactTestRoot) {
    return invalidConfiguration(
      "companion_service_identity_conflict",
      false,
      "conflicting",
    );
  }
  if (
    typeof plist !== "string" ||
    plist !== buildLaunchAgentPlist(configuration)
  ) {
    return invalidConfiguration(
      "companion_service_definition_conflict",
      false,
      "exact",
    );
  }
  return { valid: true, reason: null, updateRequired: false, checkoutRelation: "exact" };
}

function invalidConfiguration(reason, updateRequired, checkoutRelation) {
  return { valid: false, reason, updateRequired, checkoutRelation };
}

function newDesiredStateRecord(configuration, desiredState) {
  return {
    contract: COMPANION_SERVICE_DESIRED_STATE_CONTRACT,
    schema_version: COMPANION_SERVICE_DESIRED_STATE_SCHEMA_VERSION,
    service_identity: configuration.service_identity,
    repository_fingerprint: configuration.repository_fingerprint,
    desired_state: desiredState,
    updated_at: new Date().toISOString(),
  };
}

function validateDesiredStateRecord(value, configuration) {
  if (
    !isObject(value) ||
    value.contract !== COMPANION_SERVICE_DESIRED_STATE_CONTRACT ||
    value.schema_version !== COMPANION_SERVICE_DESIRED_STATE_SCHEMA_VERSION ||
    Object.keys(value).length !== 6 ||
    ![
      "contract",
      "schema_version",
      "service_identity",
      "repository_fingerprint",
      "desired_state",
      "updated_at",
    ].every((key) => Object.hasOwn(value, key)) ||
    !["running", "stopped"].includes(value.desired_state) ||
    !isIsoTimestamp(value.updated_at)
  ) {
    return {
      valid: false,
      record: null,
      reason: "companion_service_desired_state_invalid",
    };
  }
  if (
    value.service_identity !== configuration.service_identity ||
    value.repository_fingerprint !== configuration.repository_fingerprint
  ) {
    return {
      valid: false,
      record: null,
      reason: "companion_service_desired_state_conflict",
    };
  }
  return { valid: true, record: value, reason: null };
}

function readExactDesiredState(layout, configuration) {
  const result = readRegularJson(layout.desired_state_path);
  if (result.state !== "valid") {
    throw new PublicCompanionServiceError(
      result.state === "missing"
        ? "companion_service_desired_state_missing"
        : "companion_service_desired_state_invalid",
    );
  }
  const validation = validateDesiredStateRecord(result.value, configuration);
  if (!validation.valid) {
    throw new PublicCompanionServiceError(validation.reason);
  }
  return validation.record;
}

function setExactDesiredState({
  layout,
  configuration,
  desiredState,
  allowMissing = false,
}) {
  const current = readRegularJson(layout.desired_state_path);
  if (current.state === "missing" && allowMissing) {
    const record = newDesiredStateRecord(configuration, desiredState);
    atomicWriteJson(layout.desired_state_path, record, 0o600);
    return { changed: true, record };
  }
  if (current.state !== "valid") {
    throw new PublicCompanionServiceError(
      current.state === "missing"
        ? "companion_service_desired_state_missing"
        : "companion_service_desired_state_invalid",
    );
  }
  const validation = validateDesiredStateRecord(current.value, configuration);
  if (!validation.valid) {
    throw new PublicCompanionServiceError(validation.reason);
  }
  if (validation.record.desired_state === desiredState) {
    return { changed: false, record: validation.record };
  }
  const record = newDesiredStateRecord(configuration, desiredState);
  atomicWriteJson(layout.desired_state_path, record, 0o600);
  return { changed: true, record };
}

function assertNoOtherProductionCompanionService(layout) {
  if (layout.test) return;
  let rootStats;
  try {
    rootStats = lstatSync(layout.production_checkouts_directory);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw new PublicCompanionServiceError(
      "companion_service_production_registry_ambiguous",
      error,
    );
  }
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    throw new PublicCompanionServiceError(
      "companion_service_production_registry_ambiguous",
    );
  }
  let entries;
  try {
    entries = readdirSync(layout.production_checkouts_directory, {
      withFileTypes: true,
    }).filter((entry) => entry.name.startsWith("checkout-"));
  } catch (error) {
    throw new PublicCompanionServiceError(
      "companion_service_production_registry_ambiguous",
      error,
    );
  }
  if (entries.length > MAX_PRODUCTION_CHECKOUT_SCOPES) {
    throw new PublicCompanionServiceError(
      "companion_service_production_registry_ambiguous",
    );
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      throw new PublicCompanionServiceError(
        "companion_service_other_checkout_ambiguous",
      );
    }
    const candidateDirectory = path.join(
      layout.production_checkouts_directory,
      entry.name,
      "config",
      "companion-service",
    );
    if (candidateDirectory === layout.service_directory) continue;
    if (!/^checkout-[a-f0-9]{16}$/u.test(entry.name)) {
      if (ownedServiceDirectoryExists(candidateDirectory)) {
        throw new PublicCompanionServiceError(
          "companion_service_other_checkout_ambiguous",
        );
      }
      continue;
    }
    const directoryState = ownedServiceDirectoryState(candidateDirectory);
    if (directoryState === "missing") continue;
    if (directoryState !== "valid") {
      throw new PublicCompanionServiceError(
        "companion_service_other_checkout_ambiguous",
      );
    }
    const configurationPath = path.join(candidateDirectory, "service.json");
    const desiredStatePath = path.join(candidateDirectory, "desired-state.json");
    const configurationResult = readRegularJson(configurationPath);
    const desiredStateResult = readRegularJson(desiredStatePath);
    if (
      configurationResult.state !== "valid" ||
      desiredStateResult.state !== "valid" ||
      !validForeignProductionConfiguration({
        configuration: configurationResult.value,
        configurationPath,
        checkoutScope: entry.name,
        layout,
      })
    ) {
      throw new PublicCompanionServiceError(
        "companion_service_other_checkout_ambiguous",
      );
    }
    const configuration = configurationResult.value;
    if (!validateDesiredStateRecord(desiredStateResult.value, configuration).valid) {
      throw new PublicCompanionServiceError(
        "companion_service_other_checkout_ambiguous",
      );
    }
    const plist = readRegularText(configuration.launch_agent_path);
    if (
      plist.state !== "valid" ||
      plist.contents !== buildLaunchAgentPlist(configuration)
    ) {
      throw new PublicCompanionServiceError(
        "companion_service_other_checkout_ambiguous",
      );
    }
    if (
      configuration.repository_fingerprint ===
        layout.repository.repository_fingerprint ||
      configuration.service_identity === layout.service_identity
    ) {
      throw new PublicCompanionServiceError(
        "companion_service_other_checkout_ambiguous",
      );
    }
    throw new PublicCompanionServiceError(
      "companion_service_other_checkout_conflict",
    );
  }
}

function ownedServiceDirectoryState(directory) {
  try {
    const stats = lstatSync(directory);
    return stats.isDirectory() && !stats.isSymbolicLink() ? "valid" : "invalid";
  } catch (error) {
    return error?.code === "ENOENT" ? "missing" : "invalid";
  }
}

function ownedServiceDirectoryExists(directory) {
  return ownedServiceDirectoryState(directory) !== "missing";
}

function validForeignProductionConfiguration({
  configuration,
  configurationPath,
  checkoutScope,
  layout,
}) {
  if (!isObject(configuration)) return false;
  const repositoryFingerprint = configuration.repository_fingerprint;
  if (!/^[a-f0-9]{64}$/u.test(repositoryFingerprint ?? "")) return false;
  const serviceIdentity = sha256(JSON.stringify([
    COMPANION_SERVICE_CONTRACT,
    repositoryFingerprint,
    "production",
  ]));
  const expectedLabel = `${SERVICE_LABEL_PREFIX}.${serviceIdentity.slice(0, 16)}`;
  const expectedRuntimeDirectory = path.join(
    layout.home,
    "Library",
    "Application Support",
    "Augnes",
    "runtime",
    checkoutScope,
  );
  return (
    configuration.contract === COMPANION_SERVICE_CONTRACT &&
    configuration.schema_version === COMPANION_SERVICE_SCHEMA_VERSION &&
    configuration.manager_version === COMPANION_SERVICE_MANAGER_VERSION &&
    checkoutScope === `checkout-${repositoryFingerprint.slice(0, 16)}` &&
    configuration.service_identity === serviceIdentity &&
    configuration.service_label === expectedLabel &&
    typeof configuration.repository_root === "string" &&
    path.isAbsolute(configuration.repository_root) &&
    sha256(path.resolve(configuration.repository_root)) === repositoryFingerprint &&
    typeof configuration.repository_device === "string" &&
    typeof configuration.repository_inode === "string" &&
    typeof configuration.node_path === "string" &&
    path.isAbsolute(configuration.node_path) &&
    /^v24\.\d+\.\d+$/u.test(configuration.node_version ?? "") &&
    configuration.manager_entry_path === path.join(
      configuration.repository_root,
      "scripts",
      "augnes-companion-service.mjs",
    ) &&
    /^[a-f0-9]{64}$/u.test(configuration.service_source_fingerprint ?? "") &&
    configuration.runtime_state_directory === expectedRuntimeDirectory &&
    configuration.runtime_home_directory === layout.home &&
    configuration.database_path === null &&
    configuration.configuration_path === configurationPath &&
    configuration.launch_agent_path === path.join(
      layout.home,
      "Library",
      "LaunchAgents",
      `${expectedLabel}.plist`,
    ) &&
    isIsoTimestamp(configuration.installed_at) &&
    configuration.test_scope === null &&
    configuration.test_root === null
  );
}

function sameInstalledConfiguration(left, right) {
  const comparable = [
    "contract",
    "schema_version",
    "manager_version",
    "service_label",
    "service_identity",
    "repository_root",
    "repository_fingerprint",
    "repository_device",
    "repository_inode",
    "node_path",
    "node_version",
    "manager_entry_path",
    "service_source_fingerprint",
    "runtime_state_directory",
    "runtime_home_directory",
    "database_path",
    "configuration_path",
    "launch_agent_path",
    "test_scope",
    "test_root",
  ];
  return comparable.every((key) => left?.[key] === right?.[key]);
}

function installedManagerMaterialStillExact(configuration, layout) {
  const currentConfiguration = readRegularJson(layout.configuration_path);
  const currentPlist = readRegularText(layout.launch_agent_path);
  return (
    currentConfiguration.state === "valid" &&
    JSON.stringify(currentConfiguration.value) === JSON.stringify(configuration) &&
    currentPlist.state === "valid" &&
    currentPlist.contents === buildLaunchAgentPlist(configuration) &&
    computeServiceSourceFingerprint(configuration.repository_root) ===
      configuration.service_source_fingerprint
  );
}

function replaceableInstalledConfiguration(configuration, layout) {
  return (
    isObject(configuration) &&
    configuration.contract === COMPANION_SERVICE_CONTRACT &&
    configuration.service_label === layout.service_label &&
    configuration.service_identity === layout.service_identity &&
    configuration.repository_root === layout.repository.realpath &&
    configuration.repository_fingerprint ===
      layout.repository.repository_fingerprint &&
    configuration.repository_device === layout.repository.device &&
    configuration.repository_inode === layout.repository.inode &&
    configuration.runtime_state_directory === layout.runtime_directory &&
    configuration.launch_agent_path === layout.launch_agent_path &&
    configuration.test_scope === (layout.test?.scope ?? null) &&
    configuration.test_root === (layout.test?.root ?? null)
  );
}

function staleCheckoutDecommissionConfigurationExact(configuration, layout) {
  if (!isObject(configuration) || !layout) return false;
  const keys = Object.keys(configuration).sort();
  if (
    keys.length !== INSTALLED_CONFIGURATION_KEYS.length ||
    !INSTALLED_CONFIGURATION_KEYS.every((key) => keys.includes(key))
  ) return false;
  const sameLogicalCheckout =
    configuration.repository_root === layout.repository.realpath &&
    configuration.repository_fingerprint ===
      layout.repository.repository_fingerprint;
  const physicalIdentityChanged =
    configuration.repository_device !== layout.repository.device ||
    configuration.repository_inode !== layout.repository.inode;
  const exactService =
    configuration.contract === COMPANION_SERVICE_CONTRACT &&
    configuration.schema_version === COMPANION_SERVICE_SCHEMA_VERSION &&
    configuration.manager_version === COMPANION_SERVICE_MANAGER_VERSION &&
    configuration.service_label === layout.service_label &&
    configuration.service_identity === layout.service_identity &&
    typeof configuration.repository_device === "string" &&
    configuration.repository_device.length > 0 &&
    typeof configuration.repository_inode === "string" &&
    configuration.repository_inode.length > 0 &&
    typeof configuration.node_path === "string" &&
    path.isAbsolute(configuration.node_path) &&
    /^v24\.\d+\.\d+$/u.test(configuration.node_version ?? "") &&
    configuration.manager_entry_path === path.join(
      configuration.repository_root,
      "scripts",
      "augnes-companion-service.mjs",
    ) &&
    /^[a-f0-9]{64}$/u.test(
      configuration.service_source_fingerprint ?? "",
    ) &&
    configuration.runtime_state_directory === layout.runtime_directory &&
    configuration.runtime_home_directory ===
      (layout.test ? path.join(layout.test.root, "home") : layout.home) &&
    configuration.database_path ===
      (layout.test ? path.join(layout.test.root, "data", "augnes.db") : null) &&
    configuration.configuration_path === layout.configuration_path &&
    configuration.launch_agent_path === layout.launch_agent_path &&
    isIsoTimestamp(configuration.installed_at) &&
    configuration.test_scope === (layout.test?.scope ?? null) &&
    configuration.test_root === (layout.test?.root ?? null);
  return sameLogicalCheckout && physicalIdentityChanged && exactService;
}

function staleCheckoutDecommissionRefused() {
  return new PublicCompanionServiceError(
    "companion_service_stale_checkout_decommission_refused",
  );
}

function validStaleCheckoutDecommissionRecord(
  record,
  layout,
  durable = true,
) {
  if (
    !isObject(record) ||
    record.contract !== STALE_DECOMMISSION_CONTRACT ||
    record.schema_version !== STALE_DECOMMISSION_SCHEMA_VERSION ||
    Object.keys(record).length !== 9 ||
    ![
      "contract",
      "schema_version",
      "service_identity",
      "repository_fingerprint",
      "configuration",
      "materials",
      "launch_job",
      "owned_processes",
      "created_at",
    ].every((key) => Object.hasOwn(record, key)) ||
    record.service_identity !== layout.service_identity ||
    record.repository_fingerprint !==
      layout.repository.repository_fingerprint ||
    !staleCheckoutDecommissionConfigurationExact(
      record.configuration,
      layout,
    ) ||
    !isIsoTimestamp(record.created_at) ||
    !isObject(record.materials) ||
    Object.keys(record.materials).length !==
      STALE_DECOMMISSION_MATERIAL_KEYS.length ||
    !STALE_DECOMMISSION_MATERIAL_KEYS.every((key) =>
      validStaleDecommissionMaterial(record.materials[key])
    ) ||
    !(record.launch_job === null || validStaleDecommissionLaunchJob(
      record.launch_job,
      record.configuration,
    )) ||
    !Array.isArray(record.owned_processes) ||
    record.owned_processes.length > 64 ||
    record.owned_processes.some((entry) =>
      !isObject(entry) ||
      !["pid", "identity"].every((key) => Object.hasOwn(entry, key)) ||
      Object.keys(entry).length !== 2 ||
      !Number.isInteger(entry.pid) ||
      entry.pid <= 0 ||
      !/^[a-f0-9]{64}$/u.test(entry.identity ?? "")
    )
  ) return false;
  const processKeys = record.owned_processes.map(
    (entry) => `${entry.pid}:${entry.identity}`,
  );
  return new Set(processKeys).size === processKeys.length &&
    (!durable ||
      record.launch_job === null && record.owned_processes.length === 0);
}

function validStaleDecommissionMaterial(value) {
  if (!isObject(value) || !["missing", "valid"].includes(value.state)) {
    return false;
  }
  if (value.state === "missing") {
    return Object.keys(value).length === 2 &&
      Object.hasOwn(value, "parent") &&
      value.parent === null;
  }
  return Object.keys(value).length === 3 &&
    /^[a-f0-9]{64}$/u.test(value.sha256 ?? "") &&
    validStaleDecommissionParent(value.parent);
}

function validStaleDecommissionParent(value) {
  return isObject(value) &&
    Object.keys(value).length === 2 &&
    typeof value.device === "string" &&
    value.device.length > 0 &&
    typeof value.inode === "string" &&
    value.inode.length > 0;
}

function validStaleDecommissionLaunchJob(value, configuration) {
  const expectedArguments = expectedCompanionManagerArguments(configuration);
  return isObject(value) &&
    Object.keys(value).length === 7 &&
    value.label === configuration.service_label &&
    value.path === configuration.launch_agent_path &&
    value.program === configuration.node_path &&
    value.working_directory === configuration.repository_root &&
    Array.isArray(value.arguments) &&
    JSON.stringify(value.arguments) === JSON.stringify(expectedArguments) &&
    (value.pid === null || Number.isInteger(value.pid) && value.pid > 0) &&
    /^[a-f0-9]{64}$/u.test(value.fingerprint ?? "") &&
    value.fingerprint === staleDecommissionLaunchJobFingerprint(value);
}

function expectedCompanionManagerArguments(configuration) {
  return [
    configuration.node_path,
    configuration.manager_entry_path,
    "run",
    "--config",
    configuration.configuration_path,
  ];
}

function staleDecommissionLaunchJobFingerprint(value) {
  return sha256(JSON.stringify({
    label: value.label,
    path: value.path,
    program: value.program,
    arguments: value.arguments,
    working_directory: value.working_directory,
    pid: value.pid,
  }));
}

function readExistingStaleCheckoutDecommissionRecord(layout) {
  const existing = readRegularJson(layout.stale_decommission_path);
  if (existing.state === "missing") return null;
  if (
    existing.state !== "valid" ||
    !validStaleCheckoutDecommissionRecord(existing.value, layout)
  ) throw staleCheckoutDecommissionRefused();
  return existing.value;
}

function buildStaleCheckoutDecommissionRecord({
  before,
  layout,
  configuration,
  launchctl,
}) {
  const materials = captureStaleDecommissionMaterials(layout);
  const configurationMaterial = parseStaleDecommissionJsonMaterial(
    materials.configuration,
    layout.configuration_path,
    layout,
  );
  const desiredState = parseStaleDecommissionJsonMaterial(
    materials.desired_state,
    layout.desired_state_path,
    layout,
  );
  const plist = readStaleDecommissionMaterialContents(
    layout.launch_agent_path,
    materials.launch_agent,
    layout,
  );
  if (
    JSON.stringify(configurationMaterial) !== JSON.stringify(configuration) ||
    !staleCheckoutDecommissionConfigurationExact(
      configurationMaterial,
      layout,
    ) ||
    plist !== buildLaunchAgentPlist(configurationMaterial) ||
    !validateDesiredStateRecord(desiredState, configurationMaterial).valid
  ) throw staleCheckoutDecommissionRefused();
  const validation = validateInstalledConfiguration({
    configuration: configurationMaterial,
    plist,
    layout,
  });
  if (
    validation.valid ||
    validation.reason !== "companion_service_checkout_identity_changed" ||
    validation.checkoutRelation !== "substituted_or_moved" ||
    before?.reason !== validation.reason ||
    before?.checkout_relation !== validation.checkoutRelation
  ) throw staleCheckoutDecommissionRefused();

  const maintenance = classifyMaintenanceLease({
    leasePath: layout.maintenance_lease_path,
    configuration: configurationMaterial,
  });
  if (maintenance.status === "active") {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_active",
    );
  }
  if (
    maintenance.status === "ambiguous" ||
    maintenance.lease?.pre_maintenance_desired_state !== undefined &&
      maintenance.lease.pre_maintenance_desired_state !==
        desiredState.desired_state
  ) throw staleCheckoutDecommissionRefused();

  const launchJob = readExactStaleDecommissionLaunchJob(
    layout,
    configurationMaterial,
    launchctl,
  );
  const ownedProcesses = captureStaleDecommissionOwnedProcesses({
    configuration: configurationMaterial,
    layout,
    launchJob,
    materials,
  });
  const record = {
    contract: STALE_DECOMMISSION_CONTRACT,
    schema_version: STALE_DECOMMISSION_SCHEMA_VERSION,
    service_identity: configurationMaterial.service_identity,
    repository_fingerprint: configurationMaterial.repository_fingerprint,
    configuration: configurationMaterial,
    materials,
    launch_job: launchJob,
    owned_processes: ownedProcesses,
    created_at: new Date().toISOString(),
  };
  if (!validStaleCheckoutDecommissionRecord(record, layout, false)) {
    throw staleCheckoutDecommissionRefused();
  }
  return record;
}

function staleDecommissionMaterialPaths(layout) {
  return {
    configuration: layout.configuration_path,
    desired_state: layout.desired_state_path,
    launch_agent: layout.launch_agent_path,
    manager_state: layout.manager_state_path,
    manager_lock: layout.manager_lock_path,
    maintenance_lease: layout.maintenance_lease_path,
    runtime_manifest: layout.runtime_manifest_path,
    runtime_token: layout.runtime_token_path,
    runtime_access: layout.runtime_access_path,
    runtime_lock: layout.runtime_lock_path,
    runtime_bridge_environment: layout.runtime_bridge_environment_path,
  };
}

function captureStaleDecommissionMaterials(layout) {
  const result = {};
  for (const [key, file] of Object.entries(
    staleDecommissionMaterialPaths(layout),
  )) {
    result[key] = captureStaleDecommissionMaterial(
      file,
      staleDecommissionAnchorForFile(layout, file),
    );
  }
  return result;
}

function staleDecommissionAnchor(layout) {
  return layout.test?.root ?? layout.home;
}

function assertStaleDecommissionLifecyclePaths(layout) {
  assertStaleDecommissionPathChain(
    staleDecommissionAnchor(layout),
    layout.service_directory,
    false,
  );
  assertStaleDecommissionPathChain(
    layout.home,
    path.dirname(layout.launch_agent_path),
    false,
  );
  assertStaleDecommissionPathChain(
    staleDecommissionAnchor(layout),
    layout.runtime_directory,
    true,
  );
}

function staleDecommissionAnchorForFile(layout, file) {
  return file === layout.launch_agent_path
    ? layout.home
    : staleDecommissionAnchor(layout);
}

function captureStaleDecommissionMaterial(file, anchor) {
  const parent = captureStaleDecommissionParent(path.dirname(file), anchor);
  if (parent === null) return { state: "missing", parent: null };
  const current = readBoundedRegularText(file, parent, anchor);
  if (current.state === "missing") return { state: "missing", parent: null };
  if (current.state !== "valid") throw staleCheckoutDecommissionRefused();
  return { state: "valid", sha256: sha256(current.contents), parent };
}

function captureStaleDecommissionParent(directory, anchor) {
  assertStaleDecommissionPathChain(anchor, directory, true);
  let stats;
  try {
    stats = lstatSync(directory, { bigint: true });
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw staleCheckoutDecommissionRefused();
  }
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw staleCheckoutDecommissionRefused();
  }
  return { device: String(stats.dev), inode: String(stats.ino) };
}

function assertStaleDecommissionPathChain(anchor, target, allowMissingLeaf) {
  const relative = path.relative(anchor, target);
  if (
    !path.isAbsolute(anchor) ||
    !path.isAbsolute(target) ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) throw staleCheckoutDecommissionRefused();
  let current = anchor;
  const entries = relative === "" ? [] : relative.split(path.sep);
  for (let index = 0; index <= entries.length; index += 1) {
    if (index > 0) current = path.join(current, entries[index - 1]);
    try {
      const stats = lstatSync(current);
      if (!stats.isDirectory() || stats.isSymbolicLink()) {
        throw staleCheckoutDecommissionRefused();
      }
    } catch (error) {
      if (
        error?.code === "ENOENT" &&
        allowMissingLeaf &&
        index === entries.length
      ) return;
      if (error instanceof PublicCompanionServiceError) throw error;
      throw staleCheckoutDecommissionRefused();
    }
  }
}

function readBoundedRegularText(file, expectedParent, anchor) {
  assertStaleDecommissionPathChain(anchor, path.dirname(file), false);
  const parentDescriptor = openSync(
    path.dirname(file),
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
  );
  let fileDescriptor = null;
  try {
    const parentStats = fstatSync(parentDescriptor, { bigint: true });
    if (
      String(parentStats.dev) !== expectedParent.device ||
      String(parentStats.ino) !== expectedParent.inode
    ) throw staleCheckoutDecommissionRefused();
    try {
      fileDescriptor = openSync(
        file,
        constants.O_RDONLY | constants.O_NOFOLLOW,
      );
    } catch (error) {
      if (error?.code === "ENOENT") return { state: "missing", contents: null };
      throw staleCheckoutDecommissionRefused();
    }
    const fileStats = fstatSync(fileDescriptor, { bigint: true });
    const pathStats = lstatSync(file, { bigint: true });
    if (
      !fileStats.isFile() ||
      pathStats.isSymbolicLink() ||
      String(fileStats.dev) !== String(pathStats.dev) ||
      String(fileStats.ino) !== String(pathStats.ino) ||
      fileStats.size > BigInt(MAX_JSON_BYTES)
    ) throw staleCheckoutDecommissionRefused();
    const contents = readFileSync(fileDescriptor, "utf8");
    const parentAfter = lstatSync(path.dirname(file), { bigint: true });
    if (
      parentAfter.isSymbolicLink() ||
      String(parentAfter.dev) !== expectedParent.device ||
      String(parentAfter.ino) !== expectedParent.inode
    ) throw staleCheckoutDecommissionRefused();
    return { state: "valid", contents };
  } finally {
    if (fileDescriptor !== null) closeSync(fileDescriptor);
    closeSync(parentDescriptor);
  }
}

function readStaleDecommissionMaterialContents(file, material, layout) {
  if (material.state !== "valid") throw staleCheckoutDecommissionRefused();
  const current = readBoundedRegularText(
    file,
    material.parent,
    staleDecommissionAnchorForFile(layout, file),
  );
  if (
    current.state !== "valid" ||
    sha256(current.contents) !== material.sha256
  ) throw staleCheckoutDecommissionRefused();
  return current.contents;
}

function parseStaleDecommissionJsonMaterial(material, file, layout) {
  try {
    return JSON.parse(
      readStaleDecommissionMaterialContents(file, material, layout),
    );
  } catch (error) {
    if (error instanceof PublicCompanionServiceError) throw error;
    throw staleCheckoutDecommissionRefused();
  }
}

function readExactStaleDecommissionLaunchJob(
  layout,
  configuration,
  launchctl,
) {
  const result = launchctl([
    "print",
    `gui/${currentUid()}/${layout.service_label}`,
  ]);
  if (result.status !== 0) return null;
  const output = typeof result.stdout === "string"
    ? result.stdout
    : Buffer.isBuffer(result.stdout)
      ? result.stdout.toString("utf8")
      : "";
  const pathValue = launchctlPrintScalar(output, "path");
  const program = launchctlPrintScalar(output, "program");
  const workingDirectory = launchctlPrintScalar(output, "working directory");
  const label = launchctlPrintLabel(output);
  const pidText = launchctlPrintScalar(output, "pid");
  const pid = pidText === null ? null : Number(pidText);
  const args = launchctlPrintArguments(output);
  const job = {
    label,
    path: pathValue,
    program,
    arguments: args,
    working_directory: workingDirectory,
    pid: Number.isInteger(pid) && pid > 0 ? pid : null,
    fingerprint: "",
  };
  job.fingerprint = staleDecommissionLaunchJobFingerprint(job);
  if (!validStaleDecommissionLaunchJob(job, configuration)) {
    throw staleCheckoutDecommissionRefused();
  }
  return job;
}

function launchctlPrintScalar(output, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = output.match(
    new RegExp(`^\\s*${escaped}\\s*=\\s*(.+?)\\s*$`, "mu"),
  );
  return match?.[1] ?? null;
}

function launchctlPrintLabel(output) {
  const match = output.match(/^\s*([^\s=]+)\s*=\s*\{\s*$/mu);
  return match?.[1]?.split("/").at(-1) ?? null;
}

function launchctlPrintArguments(output) {
  const lines = output.split("\n");
  const start = lines.findIndex((line) => /^\s*arguments\s*=\s*\{\s*$/u.test(line));
  if (start < 0) return null;
  const values = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line === "}") return values;
    if (line.length === 0) continue;
    values.push(line.replace(/^\d+\s*=\s*/u, ""));
  }
  return null;
}

function captureStaleCheckoutDecommissionProcess(pid, identity) {
  if (
    !Number.isInteger(pid) ||
    pid <= 0 ||
    !/^[a-f0-9]{64}$/u.test(identity ?? "")
  ) throw staleCheckoutDecommissionRefused();
  const current = readProcessBirthIdentity(pid);
  if (current.state === "unavailable") throw staleCheckoutDecommissionRefused();
  if (current.state === "present" && current.identity !== identity) {
    throw staleCheckoutDecommissionRefused();
  }
  return {
    pid,
    identity,
    state: current.state === "present" ? "present" : "absent",
  };
}

function captureStaleCheckoutDecommissionProcessGroup(group) {
  const remaining = exactProcessGroupMembersStillPresent(group);
  const current = captureProcessGroupMembers(group.process_group);
  if (
    current.length !== remaining.length ||
    current.some((member, index) =>
      member.pid !== remaining[index].pid ||
      member.identity !== remaining[index].identity
    )
  ) throw staleCheckoutDecommissionRefused();
  return { ...group, present_members: remaining };
}

function captureStaleDecommissionOwnedProcesses({
  configuration,
  layout,
  launchJob,
  materials,
}) {
  const managerState = materials.manager_state.state === "valid"
    ? parseStaleDecommissionJsonMaterial(
        materials.manager_state,
        layout.manager_state_path,
        layout,
      )
    : null;
  const managerLock = materials.manager_lock.state === "valid"
    ? parseStaleDecommissionJsonMaterial(
        materials.manager_lock,
        layout.manager_lock_path,
        layout,
      )
    : null;
  const runtimeKeys = [
    "runtime_manifest",
    "runtime_token",
    "runtime_access",
    "runtime_lock",
  ];
  const runtimeMissing = runtimeKeys.every(
    (key) => materials[key].state === "missing",
  ) && materials.runtime_bridge_environment.state === "missing";
  if (managerState === null) {
    if (launchJob !== null || managerLock !== null || !runtimeMissing) {
      throw staleCheckoutDecommissionRefused();
    }
    return [];
  }
  if (
    !structurallyExactManagerState(managerState, configuration) ||
    ![
      "installed_stopped",
      "starting",
      "live",
      "maintenance",
      "recovery_required",
    ].includes(managerState.status) ||
    typeof managerState.reason !== "string" ||
    managerState.reason.length === 0
  ) throw staleCheckoutDecommissionRefused();
  if (
    managerLock !== null &&
    (!validManagerLock(managerLock, configuration) ||
      managerLock.owner_pid !== managerState.manager_pid ||
      managerLock.owner_process_identity !==
        managerState.manager_process_identity)
  ) throw staleCheckoutDecommissionRefused();

  const manager = captureStaleCheckoutDecommissionProcess(
    managerState.manager_pid,
    managerState.manager_process_identity,
  );
  if (
    manager.state === "present" &&
    (launchJob === null || launchJob.pid !== manager.pid || managerLock === null)
  ) throw staleCheckoutDecommissionRefused();
  const hasSupervisor = managerState.supervisor_pid !== null ||
    managerState.supervisor_process_identity !== null;
  let supervisor = null;
  if (hasSupervisor) {
    supervisor = captureStaleCheckoutDecommissionProcess(
      managerState.supervisor_pid,
      managerState.supervisor_process_identity,
    );
    if (runtimeMissing && supervisor.state === "present") {
      throw staleCheckoutDecommissionRefused();
    }
    if (
      supervisor.state === "present" &&
      (manager.state !== "present" ||
        !processIsDescendantOf(supervisor.pid, manager.pid))
    ) throw staleCheckoutDecommissionRefused();
  }

  const owned = [];
  if (launchJob !== null && launchJob.pid !== null) {
    const launched = readProcessBirthIdentity(launchJob.pid);
    if (launched.state === "unavailable") {
      throw staleCheckoutDecommissionRefused();
    }
    if (launched.state === "present") {
      owned.push({ pid: launchJob.pid, identity: launched.identity });
    }
  }
  if (manager.state === "present") owned.push({
    pid: manager.pid,
    identity: manager.identity,
  });
  if (supervisor?.state === "present") owned.push({
    pid: supervisor.pid,
    identity: supervisor.identity,
  });

  if (runtimeMissing && managerState.runtime_ownership !== null) {
    if (!validManagerRuntimeOwnership(managerState.runtime_ownership)) {
      throw staleCheckoutDecommissionRefused();
    }
    for (const group of managerState.runtime_ownership.process_groups) {
      if (captureStaleCheckoutDecommissionProcessGroup(group).present_members.length > 0) {
        throw staleCheckoutDecommissionRefused();
      }
    }
  }

  if (!runtimeMissing) {
    const manifest = parseStaleDecommissionJsonMaterial(
      materials.runtime_manifest,
      layout.runtime_manifest_path,
      layout,
    );
    const token = parseStaleDecommissionJsonMaterial(
      materials.runtime_token,
      layout.runtime_token_path,
      layout,
    );
    const access = parseStaleDecommissionJsonMaterial(
      materials.runtime_access,
      layout.runtime_access_path,
      layout,
    );
    const lock = parseStaleDecommissionJsonMaterial(
      materials.runtime_lock,
      layout.runtime_lock_path,
      layout,
    );
    const environmentMaterial = materials.runtime_bridge_environment;
    if (
      !validRuntimeManifest(manifest, configuration) ||
      !validRuntimeToken(token, manifest) ||
      !validRuntimeAccess(access, manifest) ||
      !validRuntimeLock(lock, manifest) ||
      environmentMaterial.state === "valid" &&
        readStaleDecommissionMaterialContents(
          layout.runtime_bridge_environment_path,
          environmentMaterial,
          layout,
        ) !== "" ||
      managerState.supervisor_pid !== manifest.supervisor_pid ||
      managerState.runtime_ownership?.generation_id !== manifest.generation_id ||
      managerState.runtime_ownership?.instance_id !== manifest.instance_id ||
      !validManagerRuntimeOwnership(managerState.runtime_ownership)
    ) throw staleCheckoutDecommissionRefused();
    const children = new Map(
      manifest.children.map((child) => [child?.role, child]),
    );
    for (const group of managerState.runtime_ownership.process_groups) {
      if (children.get(group.role)?.pid !== group.pid) {
        throw staleCheckoutDecommissionRefused();
      }
      const captured = captureStaleCheckoutDecommissionProcessGroup(group);
      for (const member of captured.present_members) {
        owned.push({ pid: member.pid, identity: member.identity });
      }
    }
  }
  const unique = new Map(owned.map((entry) => [
    `${entry.pid}:${entry.identity}`,
    entry,
  ]));
  return [...unique.values()].sort((left, right) => left.pid - right.pid);
}

function assertStaleCheckoutDecommissionRecordCurrent(record, layout) {
  if (!validStaleCheckoutDecommissionRecord(record, layout)) {
    throw staleCheckoutDecommissionRefused();
  }
  const paths = staleDecommissionMaterialPaths(layout);
  for (const key of STALE_DECOMMISSION_MATERIAL_KEYS) {
    const expected = record.materials[key];
    const current = readStaleDecommissionMaterialForReplay(
      paths[key],
      expected,
      layout,
    );
    if (
      current.state === "valid" &&
      (expected.state !== "valid" || current.sha256 !== expected.sha256)
    ) throw staleCheckoutDecommissionRefused();
  }
  const stored = readBoundedRegularText(
    layout.stale_decommission_path,
    record.materials.configuration.parent,
    staleDecommissionAnchor(layout),
  );
  if (
    stored.state !== "valid" ||
    JSON.stringify(JSON.parse(stored.contents)) !== JSON.stringify(record)
  ) throw staleCheckoutDecommissionRefused();
}

function readStaleDecommissionMaterialForReplay(file, expected, layout) {
  if (expected.parent === null) {
    const parent = captureStaleDecommissionParent(
      path.dirname(file),
      staleDecommissionAnchorForFile(layout, file),
    );
    if (parent === null) return { state: "missing" };
    const current = readBoundedRegularText(
      file,
      parent,
      staleDecommissionAnchorForFile(layout, file),
    );
    return current.state === "missing"
      ? { state: "missing" }
      : { state: "unexpected" };
  }
  const current = readBoundedRegularText(
    file,
    expected.parent,
    staleDecommissionAnchorForFile(layout, file),
  );
  if (current.state === "missing") return { state: "missing" };
  if (current.state !== "valid") throw staleCheckoutDecommissionRefused();
  return { state: "valid", sha256: sha256(current.contents) };
}

function assertExactLoadedLaunchJob(record, layout, launchctl) {
  const current = readExactStaleDecommissionLaunchJob(
    layout,
    record.configuration,
    launchctl,
  );
  if (
    current === null ||
    current.fingerprint !== record.launch_job.fingerprint
  ) throw staleCheckoutDecommissionRefused();
  return current;
}

async function waitForStaleDecommissionProcessesAbsent(
  record,
  waitMs,
  additionalProcess = null,
) {
  const deadline = Date.now() + waitMs;
  const processes = additionalProcess === null
    ? record.owned_processes
    : [...record.owned_processes, additionalProcess];
  while (true) {
    let active = false;
    for (const entry of processes) {
      const current = readProcessBirthIdentity(entry.pid);
      if (current.state === "present" && current.identity !== entry.identity) {
        throw staleCheckoutDecommissionRefused();
      }
      if (current.state === "unavailable") {
        throw staleCheckoutDecommissionRefused();
      }
      if (current.state === "present") active = true;
    }
    if (!active) return;
    if (Date.now() >= deadline) {
      throw new PublicCompanionServiceError(
        "companion_service_stale_checkout_residual_process_active",
      );
    }
    await delay(25);
  }
}

function removeStaleDecommissionMaterial(
  record,
  layout,
  materialKey,
  testBeforeUnlink,
  testSwapInsideUnlinkMaterial,
) {
  const file = staleDecommissionMaterialPaths(layout)[materialKey];
  const expected = record.materials[materialKey];
  const current = readStaleDecommissionMaterialForReplay(
    file,
    expected,
    layout,
  );
  if (current.state === "missing") return;
  if (
    current.state !== "valid" ||
    expected.state !== "valid" ||
    current.sha256 !== expected.sha256
  ) throw staleCheckoutDecommissionRefused();
  unlinkBoundedOwnedFile(
    file,
    expected.parent,
    staleDecommissionAnchorForFile(layout, file),
    expected.sha256,
    layout,
    materialKey,
    testBeforeUnlink,
    testSwapInsideUnlinkMaterial,
  );
}

function unlinkBoundedOwnedFile(
  file,
  expectedParent,
  anchor,
  expectedSha256,
  layout,
  materialKey,
  testBeforeUnlink = null,
  testSwapInsideUnlinkMaterial = null,
) {
  assertStaleDecommissionPathChain(anchor, path.dirname(file), false);
  const parentDescriptor = openSync(
    path.dirname(file),
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
  );
  try {
    const parentStats = fstatSync(parentDescriptor, { bigint: true });
    if (
      String(parentStats.dev) !== expectedParent.device ||
      String(parentStats.ino) !== expectedParent.inode
    ) throw staleCheckoutDecommissionRefused();
    if (testBeforeUnlink !== null) {
      if (!layout.test || typeof testBeforeUnlink !== "function") {
        throw staleCheckoutDecommissionRefused();
      }
      testBeforeUnlink({ material_key: materialKey, file });
    }
    if (
      testSwapInsideUnlinkMaterial !== null &&
      (!layout.test ||
        !STALE_DECOMMISSION_MATERIAL_KEYS.includes(
          testSwapInsideUnlinkMaterial,
        ))
    ) throw staleCheckoutDecommissionRefused();
    assertTrustedStaleDecommissionUnlinkHelper();
    const result = spawnSync(
      "/usr/bin/python3",
      [
        "-I",
        "-S",
        "-c",
        STALE_DECOMMISSION_UNLINK_HELPER,
        path.basename(file),
        expectedParent.device,
        expectedParent.inode,
        expectedSha256,
        testSwapInsideUnlinkMaterial === materialKey ? "1" : "0",
      ],
      {
        encoding: "utf8",
        timeout: 5_000,
        env: { PATH: "/usr/bin:/bin" },
        stdio: ["ignore", "ignore", "ignore", parentDescriptor],
      },
    );
    if (result.status !== 0) throw staleCheckoutDecommissionRefused();
  } finally {
    closeSync(parentDescriptor);
  }
}

function assertTrustedStaleDecommissionUnlinkHelper() {
  try {
    const stats = lstatSync("/usr/bin/python3");
    if (
      !stats.isFile() ||
      stats.isSymbolicLink() ||
      stats.uid !== 0 ||
      (stats.mode & 0o022) !== 0
    ) throw staleCheckoutDecommissionRefused();
  } catch (error) {
    if (error instanceof PublicCompanionServiceError) throw error;
    throw staleCheckoutDecommissionRefused();
  }
}

function createExclusiveStaleDecommissionRecord(layout, record) {
  const expectedParent = record.materials.configuration.parent;
  const anchor = staleDecommissionAnchor(layout);
  assertStaleDecommissionPathChain(
    anchor,
    path.dirname(layout.stale_decommission_path),
    false,
  );
  const parentDescriptor = openSync(
    path.dirname(layout.stale_decommission_path),
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
  );
  try {
    const parentStats = fstatSync(parentDescriptor, { bigint: true });
    if (
      String(parentStats.dev) !== expectedParent.device ||
      String(parentStats.ino) !== expectedParent.inode
    ) throw staleCheckoutDecommissionRefused();
    assertTrustedStaleDecommissionUnlinkHelper();
    const temporary = `.stale-decommission-${randomUUID()}.tmp`;
    const result = spawnSync(
      "/usr/bin/python3",
      [
        "-I",
        "-S",
        "-c",
        STALE_DECOMMISSION_CREATE_HELPER,
        temporary,
        path.basename(layout.stale_decommission_path),
      ],
      {
        input: `${JSON.stringify(record)}\n`,
        encoding: "utf8",
        timeout: 5_000,
        env: { PATH: "/usr/bin:/bin" },
        stdio: ["pipe", "ignore", "ignore", parentDescriptor],
      },
    );
    if (result.status !== 0) throw staleCheckoutDecommissionRefused();
  } finally {
    closeSync(parentDescriptor);
  }
}

function removeStaleDecommissionRecord(record, layout) {
  const parent = record.materials.configuration.parent;
  const current = readBoundedRegularText(
    layout.stale_decommission_path,
    parent,
    staleDecommissionAnchor(layout),
  );
  if (
    current.state !== "valid" ||
    JSON.stringify(JSON.parse(current.contents)) !== JSON.stringify(record)
  ) throw staleCheckoutDecommissionRefused();
  unlinkBoundedOwnedFile(
    layout.stale_decommission_path,
    parent,
    staleDecommissionAnchor(layout),
    sha256(current.contents),
    layout,
    "journal",
  );
}

function assertNoStaleDecommissionHelperResidue(record, layout) {
  const paths = staleDecommissionMaterialPaths(layout);
  const parents = new Map();
  for (const key of STALE_DECOMMISSION_MATERIAL_KEYS) {
    const expectedParent = record.materials[key].parent;
    if (expectedParent === null) continue;
    parents.set(path.dirname(paths[key]), expectedParent);
  }
  for (const [directory, expectedParent] of parents) {
    assertStaleDecommissionPathChain(
      directory === path.dirname(layout.launch_agent_path)
        ? layout.home
        : staleDecommissionAnchor(layout),
      directory,
      false,
    );
    const before = lstatSync(directory, { bigint: true });
    if (
      before.isSymbolicLink() ||
      String(before.dev) !== expectedParent.device ||
      String(before.ino) !== expectedParent.inode
    ) throw staleCheckoutDecommissionRefused();
    const residue = readdirSync(directory).some((name) =>
      name.startsWith(".stale-decommission-quarantine-") ||
      /^\.stale-decommission-[a-f0-9-]+\.tmp$/u.test(name)
    );
    const after = lstatSync(directory, { bigint: true });
    if (
      residue ||
      after.isSymbolicLink() ||
      String(after.dev) !== expectedParent.device ||
      String(after.ino) !== expectedParent.inode
    ) throw staleCheckoutDecommissionRefused();
  }
}

function maybeInjectStaleDecommissionTestFault(layout, expected, step) {
  if (expected === null) return;
  if (!layout.test || !["journal", "bootout", ...STALE_DECOMMISSION_MATERIAL_KEYS].includes(expected)) {
    throw staleCheckoutDecommissionRefused();
  }
  if (expected === step) {
    throw new PublicCompanionServiceError(
      "companion_service_stale_decommission_test_fault",
    );
  }
}

async function inspectVerifiedRuntime({ layout, configuration }) {
  const manifest = readRegularJson(layout.runtime_manifest_path);
  const token = readRegularJson(layout.runtime_token_path);
  const access = readRegularJson(layout.runtime_access_path);
  if (
    manifest.state !== "valid" ||
    token.state !== "valid" ||
    access.state !== "valid" ||
    !validRuntimeManifest(manifest.value, configuration) ||
    !validRuntimeToken(token.value, manifest.value) ||
    !validRuntimeAccess(access.value, manifest.value) ||
    !processAlive(manifest.value.supervisor_pid)
  ) {
    return { verified: false, supervisor_pid: null };
  }
  const children = new Map(
    manifest.value.children.map((child) => [child.role, child]),
  );
  const ui = children.get("ui");
  const bridge = children.get("bridge");
  if (!validRuntimeChild(ui, manifest.value.ui_port) ||
      !validRuntimeChild(bridge, manifest.value.bridge_port) ||
      !isPort(ui.ownership_port) ||
      !isPort(bridge.ownership_port)) {
    return { verified: false, supervisor_pid: manifest.value.supervisor_pid };
  }
  const ownershipHeaders = {
    "x-augnes-child-ownership": token.value.child_ownership_token,
  };
  const [uiHealth, bridgeHealth, uiOwnership, bridgeOwnership] = await Promise.all([
    fetchBoundedJson(`${manifest.value.effective_url}/api/healthz`),
    fetchBoundedJson(`http://127.0.0.1:${manifest.value.bridge_port}/healthz`),
    fetchBoundedJson(
      `http://127.0.0.1:${ui.ownership_port}/v1/ownership`,
      { headers: ownershipHeaders },
    ),
    fetchBoundedJson(
      `http://127.0.0.1:${bridge.ownership_port}/v1/ownership`,
      { headers: ownershipHeaders },
    ),
  ]);
  const exact =
    uiHealth?.ok === true &&
    uiHealth?.service === "augnes-ui" &&
    uiHealth?.status === "ready" &&
    uiHealth?.recovery_mode === false &&
    uiHealth?.runtime_instance_id === manifest.value.instance_id &&
    uiHealth?.runtime_generation_id === manifest.value.generation_id &&
    uiHealth?.runtime_repository_fingerprint ===
      manifest.value.repository_fingerprint &&
    bridgeHealth?.ok === true &&
    bridgeHealth?.name === "augnes-console" &&
    bridgeHealth?.mode === "http" &&
    bridgeHealth?.live_core_status === "ready" &&
    bridgeHealth?.runtime_instance_id === manifest.value.instance_id &&
    bridgeHealth?.runtime_generation_id === manifest.value.generation_id &&
    bridgeHealth?.runtime_repository_fingerprint ===
      manifest.value.repository_fingerprint &&
    validRuntimeChildOwnership(uiOwnership, ui, manifest.value) &&
    validRuntimeChildOwnership(bridgeOwnership, bridge, manifest.value);
  return {
    verified: exact,
    supervisor_pid: manifest.value.supervisor_pid,
    generation_id: exact ? manifest.value.generation_id : null,
    instance_id: exact ? manifest.value.instance_id : null,
  };
}

function validRuntimeManifest(value, configuration) {
  return (
    isObject(value) &&
    value.contract === RUNTIME_CONTRACT &&
    value.schema_version === RUNTIME_SCHEMA_VERSION &&
    value.generation_version === RUNTIME_GENERATION_VERSION &&
    value.repository_fingerprint === configuration.repository_fingerprint &&
    typeof value.generation_id === "string" && value.generation_id.length > 0 &&
    typeof value.instance_id === "string" && value.instance_id.length > 0 &&
    Number.isInteger(value.supervisor_pid) && value.supervisor_pid > 0 &&
    value.lifecycle_state === "ready" &&
    value.database_state !== "recovery_required" &&
    typeof value.effective_url === "string" &&
    /^http:\/\/127\.0\.0\.1:[0-9]+$/u.test(value.effective_url) &&
    Number.isInteger(value.ui_port) && value.ui_port > 0 &&
    Number.isInteger(value.bridge_port) && value.bridge_port > 0 &&
    Array.isArray(value.children)
  );
}

function validRuntimeAccess(value, manifest) {
  return (
    isObject(value) &&
    value.contract === manifest.contract &&
    value.schema_version === manifest.schema_version &&
    value.generation_version === manifest.generation_version &&
    value.generation_id === manifest.generation_id &&
    value.instance_id === manifest.instance_id &&
    value.repository_fingerprint === manifest.repository_fingerprint &&
    value.access_version === "augnes-companion-proxy-access.v0.1" &&
    typeof value.proxy_token === "string" && value.proxy_token.length >= 32
  );
}

function validRuntimeToken(value, manifest) {
  return (
    validRuntimeGenerationRecord(value, manifest) &&
    typeof value.token === "string" && value.token.length >= 32 &&
    typeof value.child_ownership_token === "string" &&
    value.child_ownership_token.length >= 32
  );
}

function validRuntimeLock(value, manifest) {
  return (
    validRuntimeGenerationRecord(value, manifest) &&
    value.supervisor_pid === manifest.supervisor_pid
  );
}

function validRuntimeGenerationRecord(value, manifest) {
  return (
    isObject(value) &&
    value.contract === manifest.contract &&
    value.schema_version === manifest.schema_version &&
    value.generation_version === manifest.generation_version &&
    value.generation_id === manifest.generation_id &&
    value.instance_id === manifest.instance_id &&
    value.repository_fingerprint === manifest.repository_fingerprint
  );
}

function validRuntimeChildOwnership(value, child, manifest) {
  return (
    isObject(value) &&
    value.ownership_verified === true &&
    value.contract === manifest.contract &&
    value.schema_version === manifest.schema_version &&
    value.generation_version === manifest.generation_version &&
    value.generation_id === manifest.generation_id &&
    value.repository_fingerprint === manifest.repository_fingerprint &&
    value.instance_id === manifest.instance_id &&
    value.role === child.role &&
    value.child_root_pid === child.pid &&
    value.process_pid === child.pid &&
    value.loopback_port === child.port
  );
}

function validRuntimeChild(value, port) {
  return (
    isObject(value) &&
    value.state === "ready" &&
    value.port === port &&
    Number.isInteger(value.pid) &&
    value.pid > 0 &&
    processAlive(value.pid)
  );
}

function isPort(value) {
  return Number.isInteger(value) && value >= 1 && value <= 65_535;
}

async function fetchBoundedJson(url, { headers = undefined } = {}) {
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(1_500),
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > MAX_JSON_BYTES) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function classifyMaintenanceLease({ leasePath, configuration, now = () => Date.now() }) {
  const result = readRegularJson(leasePath);
  if (result.state === "missing") return { status: "none", lease: null };
  if (result.state !== "valid" || !validMaintenanceLease(result.value, configuration)) {
    return { status: "ambiguous", lease: result.value ?? null };
  }
  const lease = result.value;
  const expired = Date.parse(lease.expires_at) <= now();
  const owner = readProcessBirthIdentity(lease.owner_pid);
  if (
    !expired &&
    owner.state === "present" &&
    owner.identity === lease.owner_process_identity
  ) {
    return { status: "active", lease };
  }
  if (
    expired ||
    owner.state === "missing" ||
    (owner.state === "present" && owner.identity !== lease.owner_process_identity)
  ) {
    return { status: "stale", lease };
  }
  return { status: "ambiguous", lease };
}

function validMaintenanceLease(value, configuration) {
  return (
    isObject(value) &&
    value.contract === COMPANION_SERVICE_CONTRACT &&
    value.schema_version === COMPANION_SERVICE_SCHEMA_VERSION &&
    value.service_identity === configuration.service_identity &&
    value.repository_fingerprint === configuration.repository_fingerprint &&
    validOperationId(value.operation_id) &&
    Number.isInteger(value.owner_pid) && value.owner_pid > 0 &&
    /^[a-f0-9]{64}$/u.test(value.owner_process_identity ?? "") &&
    ["running", "stopped"].includes(value.pre_maintenance_desired_state) &&
    isIsoTimestamp(value.acquired_at) &&
    isIsoTimestamp(value.expires_at) &&
    Date.parse(value.expires_at) > Date.parse(value.acquired_at) &&
    Date.parse(value.expires_at) - Date.parse(value.acquired_at) <=
      MAX_MAINTENANCE_TTL_MS
  );
}

async function stopManagedSupervisor({
  child,
  childIdentity,
  adoptedPid,
  layout,
  configuration,
}) {
  const pid = child?.pid ?? adoptedPid?.pid ?? null;
  if (!pid) return;
  const runtime = readRegularJson(layout.runtime_manifest_path);
  const exactManagedChild =
    child?.pid === pid && processMatchesBirthIdentity(pid, childIdentity);
  const exactAdoptedRuntime =
    runtime.state === "valid" &&
    runtime.value?.supervisor_pid === pid &&
    runtime.value?.repository_fingerprint === configuration.repository_fingerprint &&
    adoptedPid?.pid === pid &&
    processMatchesBirthIdentity(pid, adoptedPid.identity);
  if (!exactManagedChild && !exactAdoptedRuntime) {
    if (!processAlive(pid)) return;
    throw new PublicCompanionServiceError(
      "companion_service_supervisor_ownership_unverifiable",
    );
  }
  let runtimeProcessGroups = await captureExactRuntimeProcessGroups({
    layout,
    configuration,
    supervisorPid: pid,
  });
  await stopExactProcessGroup({
    pid,
    identity: exactManagedChild ? childIdentity : adoptedPid.identity,
    timeoutMs: 12_000,
    errorPrefix: "companion_service_supervisor",
  });
  if (runtimeProcessGroups.length === 0) {
    const fresh = readRegularJson(layout.runtime_manifest_path);
    if (
      fresh.state === "valid" &&
      fresh.value?.supervisor_pid === pid &&
      fresh.value?.repository_fingerprint === configuration.repository_fingerprint
    ) {
      runtimeProcessGroups = await captureExactRuntimeProcessGroups({
        layout,
        configuration,
        supervisorPid: pid,
      });
    }
  }
  for (const group of runtimeProcessGroups) {
    await stopExactProcessGroup({
      pid: group.pid,
      identity: group.identity,
      processGroup: group.process_group,
      members: group.members,
      timeoutMs: 8_000,
      errorPrefix: `companion_service_${group.role}`,
    });
  }
}

async function stopExactResidualRuntime({ layout, configuration }) {
  const manifest = readRegularJson(layout.runtime_manifest_path);
  const token = readRegularJson(layout.runtime_token_path);
  const access = readRegularJson(layout.runtime_access_path);
  const lock = readRegularJson(layout.runtime_lock_path);
  const generationMaterialMissing =
    manifest.state === "missing" &&
    token.state === "missing" &&
    access.state === "missing" &&
    lock.state === "missing";
  if (generationMaterialMissing) {
    const staleOwnership = readStaleManagerRuntimeOwnership({
      layout,
      configuration,
    });
    if (!staleOwnership) return false;
    if (!staleOwnership.has_live_members) return false;
    for (const group of staleOwnership.ownership.process_groups) {
      await stopExactProcessGroup({
        pid: group.pid,
        identity: group.identity,
        processGroup: group.process_group,
        members: group.members,
        timeoutMs: 8_000,
        errorPrefix: `companion_service_${group.role}`,
      });
    }
    removeOwnedRegularFile(layout.runtime_bridge_environment_path, "");
    removeDirectoryIfEmpty(layout.runtime_directory);
    return true;
  }
  if (
    manifest.state !== "valid" ||
    processAlive(manifest.value?.supervisor_pid)
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_runtime_ownership_unverifiable",
    );
  }
  const groups = await captureExactRuntimeProcessGroups({
    layout,
    configuration,
    supervisorPid: manifest.value.supervisor_pid,
  });
  for (const group of groups) {
    await stopExactProcessGroup({
      pid: group.pid,
      identity: group.identity,
      processGroup: group.process_group,
      members: group.members,
      timeoutMs: 8_000,
      errorPrefix: `companion_service_${group.role}`,
    });
  }
  removeExactResidualRuntimeState({
    layout,
    configuration,
    manifest: manifest.value,
  });
  return true;
}

async function captureManagerRuntimeOwnership({
  layout,
  configuration,
  runtime,
  previous,
}) {
  if (
    validManagerRuntimeOwnership(previous) &&
    previous.generation_id === runtime.generation_id &&
    previous.instance_id === runtime.instance_id
  ) return previous;
  const processGroups = await captureExactRuntimeProcessGroups({
    layout,
    configuration,
    supervisorPid: runtime.supervisor_pid,
  });
  const ownership = {
    generation_id: runtime.generation_id,
    instance_id: runtime.instance_id,
    process_groups: processGroups,
  };
  if (!validManagerRuntimeOwnership(ownership)) {
    throw new PublicCompanionServiceError(
      "companion_service_runtime_ownership_unverifiable",
    );
  }
  return ownership;
}

function readStaleManagerRuntimeOwnership({ layout, configuration }) {
  const state = readRegularJson(layout.manager_state_path);
  if (
    state.state !== "valid" ||
    state.value?.contract !== COMPANION_SERVICE_CONTRACT ||
    state.value?.schema_version !== COMPANION_SERVICE_SCHEMA_VERSION ||
    state.value?.service_identity !== configuration.service_identity ||
    state.value?.repository_fingerprint !== configuration.repository_fingerprint ||
    state.value?.status !== "live" ||
    processMatchesBirthIdentity(
      state.value?.manager_pid,
      state.value?.manager_process_identity,
    ) ||
    processMatchesBirthIdentity(
      state.value?.supervisor_pid,
      state.value?.supervisor_process_identity,
    ) ||
    !validManagerRuntimeOwnership(state.value?.runtime_ownership)
  ) return null;
  let hasLiveMembers = false;
  for (const group of state.value.runtime_ownership.process_groups) {
    const remaining = exactProcessGroupMembersStillPresent(group);
    const current = captureProcessGroupMembers(group.process_group);
    if (
      current.length !== remaining.length ||
      current.some((member, index) =>
        member.pid !== remaining[index].pid ||
        member.identity !== remaining[index].identity
      )
    ) {
      throw new PublicCompanionServiceError(
        "companion_service_runtime_ownership_unverifiable",
      );
    }
    if (remaining.length > 0) hasLiveMembers = true;
  }
  return {
    ownership: state.value.runtime_ownership,
    has_live_members: hasLiveMembers,
  };
}

function validManagerRuntimeOwnership(value) {
  if (
    !isObject(value) ||
    typeof value.generation_id !== "string" || value.generation_id.length === 0 ||
    typeof value.instance_id !== "string" || value.instance_id.length === 0 ||
    !Array.isArray(value.process_groups) || value.process_groups.length !== 2
  ) return false;
  const roles = new Set();
  for (const group of value.process_groups) {
    if (
      !isObject(group) ||
      !["ui", "bridge"].includes(group.role) ||
      roles.has(group.role) ||
      !Number.isInteger(group.pid) || group.pid <= 0 ||
      group.process_group !== group.pid ||
      !/^[a-f0-9]{64}$/u.test(group.identity ?? "") ||
      !Array.isArray(group.members) || group.members.length === 0 ||
      !group.members.some((member) =>
        member?.pid === group.pid && member?.identity === group.identity
      ) ||
      group.members.some((member) =>
        !Number.isInteger(member?.pid) || member.pid <= 0 ||
        !/^[a-f0-9]{64}$/u.test(member?.identity ?? "")
      )
    ) return false;
    roles.add(group.role);
  }
  return roles.has("ui") && roles.has("bridge");
}

async function captureExactRuntimeProcessGroups({
  layout,
  configuration,
  supervisorPid,
}) {
  const manifest = readRegularJson(layout.runtime_manifest_path);
  const token = readRegularJson(layout.runtime_token_path);
  const access = readRegularJson(layout.runtime_access_path);
  if (
    manifest.state === "missing" &&
    token.state === "missing" &&
    access.state === "missing"
  ) return [];
  if (
    manifest.state !== "valid" ||
    token.state !== "valid" ||
    access.state !== "valid" ||
    !validRuntimeManifest(manifest.value, configuration) ||
    !validRuntimeToken(token.value, manifest.value) ||
    !validRuntimeAccess(access.value, manifest.value) ||
    manifest.value.supervisor_pid !== supervisorPid
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_runtime_ownership_unverifiable",
    );
  }
  const children = new Map(
    manifest.value.children.map((value) => [value?.role, value]),
  );
  const captured = [
    ["ui", children.get("ui"), manifest.value.ui_port],
    ["bridge", children.get("bridge"), manifest.value.bridge_port],
  ];
  const ownership = await Promise.all(captured.map(async ([role, value, port]) => {
    if (!validRuntimeChild(value, port)) {
      throw new PublicCompanionServiceError(
        "companion_service_runtime_ownership_unverifiable",
      );
    }
    if (!isPort(value.ownership_port)) {
      throw new PublicCompanionServiceError(
        "companion_service_runtime_ownership_unverifiable",
      );
    }
    const privateIdentity = await fetchBoundedJson(
      `http://127.0.0.1:${value.ownership_port}/v1/ownership`,
      {
        headers: {
          "x-augnes-child-ownership": token.value.child_ownership_token,
        },
      },
    );
    if (!validRuntimeChildOwnership(privateIdentity, value, manifest.value)) {
      throw new PublicCompanionServiceError(
        "companion_service_runtime_ownership_unverifiable",
      );
    }
    const identity = readProcessBirthIdentity(value.pid);
    if (identity.state !== "present") {
      throw new PublicCompanionServiceError(
        "companion_service_runtime_ownership_unverifiable",
      );
    }
    const group = captureExactProcessGroup(value.pid, identity.identity);
    return {
      role,
      pid: value.pid,
      identity: identity.identity,
      process_group: group.process_group,
      members: group.members,
    };
  }));
  const confirmed = readRegularJson(layout.runtime_manifest_path);
  const confirmedToken = readRegularJson(layout.runtime_token_path);
  const confirmedAccess = readRegularJson(layout.runtime_access_path);
  if (
    confirmed.state !== "valid" ||
    confirmedToken.state !== "valid" ||
    confirmedAccess.state !== "valid" ||
    JSON.stringify(confirmed.value) !== JSON.stringify(manifest.value) ||
    JSON.stringify(confirmedToken.value) !== JSON.stringify(token.value) ||
    JSON.stringify(confirmedAccess.value) !== JSON.stringify(access.value)
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_runtime_ownership_changed",
    );
  }
  return ownership;
}

function removeExactResidualRuntimeState({ layout, configuration, manifest }) {
  const token = readRegularJson(layout.runtime_token_path);
  const access = readRegularJson(layout.runtime_access_path);
  const lock = readRegularJson(layout.runtime_lock_path);
  if (
    !validRuntimeManifest(manifest, configuration) ||
    token.state !== "valid" ||
    !validRuntimeToken(token.value, manifest) ||
    access.state !== "valid" ||
    !validRuntimeAccess(access.value, manifest) ||
    lock.state !== "valid" ||
    !validRuntimeLock(lock.value, manifest)
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_runtime_cleanup_refused",
    );
  }
  removeOwnedRegularJson(layout.runtime_access_path, access.value);
  removeOwnedRegularJson(layout.runtime_token_path, token.value);
  removeOwnedRegularJson(layout.runtime_lock_path, lock.value);
  removeOwnedRegularJson(layout.runtime_manifest_path, manifest);
  removeOwnedRegularFile(layout.runtime_bridge_environment_path, "");
  removeDirectoryIfEmpty(layout.runtime_directory);
}

async function acquireLifecycleLock(layout, configuration, waitMs) {
  const ownerIdentity = readProcessBirthIdentity(process.pid);
  if (ownerIdentity.state !== "present") {
    throw new PublicCompanionServiceError(
      "companion_service_lifecycle_owner_unverifiable",
    );
  }
  const lock = {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: COMPANION_SERVICE_SCHEMA_VERSION,
    service_identity: configuration.service_identity,
    repository_fingerprint: configuration.repository_fingerprint,
    lifecycle_operation_id: randomUUID(),
    owner_pid: process.pid,
    owner_process_identity: ownerIdentity.identity,
    acquired_at: new Date().toISOString(),
  };
  const deadline = Date.now() + waitMs;
  while (true) {
    if (tryCreateExclusiveJson(layout.lifecycle_lock_path, lock)) return lock;
    const existing = readRegularJson(layout.lifecycle_lock_path);
    if (
      existing.state !== "valid" ||
      !validLifecycleLock(existing.value, configuration)
    ) {
      throw new PublicCompanionServiceError(
        "companion_service_lifecycle_lock_ambiguous",
      );
    }
    if (!processMatchesBirthIdentity(
      existing.value.owner_pid,
      existing.value.owner_process_identity,
    )) {
      removeOwnedRegularJson(layout.lifecycle_lock_path, existing.value);
      continue;
    }
    if (Date.now() >= deadline) {
      throw new PublicCompanionServiceError(
        "companion_service_lifecycle_busy",
      );
    }
    await delay(25);
  }
}

function releaseLifecycleLock(layout, lock) {
  removeOwnedRegularJson(layout.lifecycle_lock_path, lock);
}

function validLifecycleLock(value, configuration) {
  return (
    isObject(value) &&
    value.contract === COMPANION_SERVICE_CONTRACT &&
    value.schema_version === COMPANION_SERVICE_SCHEMA_VERSION &&
    value.service_identity === configuration.service_identity &&
    value.repository_fingerprint === configuration.repository_fingerprint &&
    typeof value.lifecycle_operation_id === "string" &&
    value.lifecycle_operation_id.length > 0 &&
    Number.isInteger(value.owner_pid) && value.owner_pid > 0 &&
    /^[a-f0-9]{64}$/u.test(value.owner_process_identity ?? "") &&
    isIsoTimestamp(value.acquired_at)
  );
}

function removeInactiveLifecycleLock(layout, configuration) {
  const existing = readRegularJson(layout.lifecycle_lock_path);
  if (existing.state === "missing") return;
  if (
    existing.state !== "valid" ||
    !validLifecycleLock(existing.value, configuration)
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_lifecycle_lock_ambiguous",
    );
  }
  if (processMatchesBirthIdentity(
    existing.value.owner_pid,
    existing.value.owner_process_identity,
  )) {
    throw new PublicCompanionServiceError("companion_service_lifecycle_busy");
  }
  removeOwnedRegularJson(layout.lifecycle_lock_path, existing.value);
}

function acquireManagerLock(layout, configuration) {
  const existing = readRegularJson(layout.manager_lock_path);
  if (existing.state === "valid" && validManagerLock(existing.value, configuration)) {
    if (processMatchesBirthIdentity(
      existing.value.owner_pid,
      existing.value.owner_process_identity,
    )) {
      throw new PublicCompanionServiceError(
        "companion_service_manager_already_running",
      );
    }
    removeOwnedRegularJson(layout.manager_lock_path, existing.value);
  } else if (existing.state !== "missing") {
    throw new PublicCompanionServiceError(
      "companion_service_manager_lock_ambiguous",
    );
  }
  const identity = readProcessBirthIdentity(process.pid);
  if (identity.state !== "present") {
    throw new PublicCompanionServiceError(
      "companion_service_manager_identity_unavailable",
    );
  }
  const lock = {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: COMPANION_SERVICE_SCHEMA_VERSION,
    service_identity: configuration.service_identity,
    repository_fingerprint: configuration.repository_fingerprint,
    manager_id: randomUUID(),
    owner_pid: process.pid,
    owner_process_identity: identity.identity,
    acquired_at: new Date().toISOString(),
  };
  createExclusiveJson(layout.manager_lock_path, lock);
  return lock;
}

function releaseManagerLock(layout, lock) {
  removeOwnedRegularJson(layout.manager_lock_path, lock);
}

function validManagerLock(value, configuration) {
  return (
    isObject(value) &&
    value.contract === COMPANION_SERVICE_CONTRACT &&
    value.schema_version === COMPANION_SERVICE_SCHEMA_VERSION &&
    value.service_identity === configuration.service_identity &&
    value.repository_fingerprint === configuration.repository_fingerprint &&
    typeof value.manager_id === "string" && value.manager_id.length > 0 &&
    Number.isInteger(value.owner_pid) && value.owner_pid > 0 &&
    /^[a-f0-9]{64}$/u.test(value.owner_process_identity ?? "")
  );
}

function validLiveManagerState(value, configuration, runtime) {
  return (
    isObject(value) &&
    value.contract === COMPANION_SERVICE_CONTRACT &&
    value.schema_version === COMPANION_SERVICE_SCHEMA_VERSION &&
    value.service_identity === configuration.service_identity &&
    value.repository_fingerprint === configuration.repository_fingerprint &&
    value.status === "live" &&
    Number.isInteger(value.manager_pid) &&
    processMatchesBirthIdentity(
      value.manager_pid,
      value.manager_process_identity,
    ) &&
    value.supervisor_pid === runtime.supervisor_pid &&
    processMatchesBirthIdentity(
      value.supervisor_pid,
      value.supervisor_process_identity,
    )
  );
}

function exactManagerStateExplicitlyStopped({ layout, configuration }) {
  const state = readRegularJson(layout.manager_state_path);
  return (
    state.state === "valid" &&
    state.value?.contract === COMPANION_SERVICE_CONTRACT &&
    state.value?.schema_version === COMPANION_SERVICE_SCHEMA_VERSION &&
    state.value?.service_identity === configuration.service_identity &&
    state.value?.repository_fingerprint === configuration.repository_fingerprint &&
    state.value?.status === "installed_stopped" &&
    state.value?.supervisor_pid === null &&
    state.value?.supervisor_process_identity === null &&
    state.value?.runtime_ownership === null
  );
}

async function exactStoppedStaleSourceMaintenanceNotRequired({
  observation,
  launchctl,
}) {
  if (
    observation?.status !== "service_update_required" ||
    !exactSourceUpdateProjection(observation) ||
    observation.checkout_relation !== "exact" ||
    !observation.configuration ||
    !replaceableInstalledConfiguration(
      observation.configuration,
      observation.layout,
    ) ||
    !installedConfigurationOwnershipStillExact(observation) ||
    readExactDesiredState(
      observation.layout,
      observation.configuration,
    ).desired_state !== "stopped" ||
    observation.loaded !== false ||
    launchctlLoaded(observation.layout, launchctl) ||
    observation.runtime?.verified !== false ||
    observation.runtime?.supervisor_pid !== null ||
    !stoppedInertManagerOwnershipExact({
      layout: observation.layout,
      configuration: observation.configuration,
    })
  ) return false;

  const maintenance = classifyMaintenanceLease({
    leasePath: observation.layout.maintenance_lease_path,
    configuration: observation.configuration,
  });
  if (maintenance.status !== "none") return false;
  if (!(await waitForRuntimeGenerationMaterialMissing(observation.layout, 2_000))) {
    return false;
  }

  const currentRuntime = await inspectVerifiedRuntime({
    layout: observation.layout,
    configuration: observation.configuration,
  });
  const currentMaintenance = classifyMaintenanceLease({
    leasePath: observation.layout.maintenance_lease_path,
    configuration: observation.configuration,
  });
  return (
    exactSourceUpdateProjection(observation) &&
    installedConfigurationOwnershipStillExact(observation) &&
    readExactDesiredState(
      observation.layout,
      observation.configuration,
    ).desired_state === "stopped" &&
    !launchctlLoaded(observation.layout, launchctl) &&
    currentRuntime.verified === false &&
    currentRuntime.supervisor_pid === null &&
    stoppedInertManagerOwnershipExact({
      layout: observation.layout,
      configuration: observation.configuration,
    }) &&
    currentMaintenance.status === "none"
  );
}

function stoppedInertManagerOwnershipExact({
  layout,
  configuration,
}) {
  if (!managerLockAllowsStoppedInertness({ layout, configuration })) {
    return false;
  }
  const state = readRegularJson(layout.manager_state_path);
  if (state.state === "missing") return true;
  if (
    state.state !== "valid" ||
    !structurallyExactManagerState(state.value, configuration) ||
    !recordedProcessProvenAbsent(
      state.value.manager_pid,
      state.value.manager_process_identity,
    )
  ) return false;
  if (exactManagerStateExplicitlyStopped({ layout, configuration })) {
    return (
      state.value.reason === "companion_service_explicitly_stopped" &&
      state.value.restart_after === null
    );
  }
  if (
    state.value.status !== "live" ||
    state.value.reason !== "companion_service_live" ||
    !Number.isInteger(state.value.supervisor_pid) ||
    state.value.supervisor_pid <= 0 ||
    !/^[a-f0-9]{64}$/u.test(
      state.value.supervisor_process_identity ?? "",
    ) ||
    !recordedProcessProvenAbsent(
      state.value.supervisor_pid,
      state.value.supervisor_process_identity,
    ) ||
    !validManagerRuntimeOwnership(state.value.runtime_ownership) ||
    state.value.restart_after !== null
  ) return false;
  const staleRuntimeOwnership = readStaleManagerRuntimeOwnership({
    layout,
    configuration,
  });
  return staleRuntimeOwnership?.has_live_members === false;
}

function managerLockAllowsStoppedInertness({ layout, configuration }) {
  const lock = readRegularJson(layout.manager_lock_path);
  if (lock.state === "missing") return true;
  return (
    lock.state === "valid" &&
    validManagerLock(lock.value, configuration) &&
    recordedProcessProvenAbsent(
      lock.value.owner_pid,
      lock.value.owner_process_identity,
    )
  );
}

function structurallyExactManagerState(value, configuration) {
  return (
    isObject(value) &&
    value.contract === COMPANION_SERVICE_CONTRACT &&
    value.schema_version === COMPANION_SERVICE_SCHEMA_VERSION &&
    value.service_identity === configuration.service_identity &&
    value.repository_fingerprint === configuration.repository_fingerprint &&
    Number.isInteger(value.manager_pid) &&
    value.manager_pid > 0 &&
    /^[a-f0-9]{64}$/u.test(value.manager_process_identity ?? "") &&
    Number.isInteger(value.restart_count) &&
    value.restart_count >= 0 &&
    (value.restart_after === null || isIsoTimestamp(value.restart_after)) &&
    isIsoTimestamp(value.updated_at)
  );
}

function recordedProcessProvenAbsent(pid, identity) {
  if (
    !Number.isInteger(pid) ||
    pid <= 0 ||
    !/^[a-f0-9]{64}$/u.test(identity ?? "")
  ) return false;
  const current = readProcessBirthIdentity(pid);
  return (
    current.state === "missing" ||
    (current.state === "present" && current.identity !== identity)
  );
}

function exactSourceUpdateProjection(observation) {
  const node = inspectNodeBinary(observation.configuration?.node_path);
  return (
    observation?.reason === "companion_service_configuration_stale" &&
    node.valid &&
    node.version === observation.configuration?.node_version &&
    computeServiceSourceFingerprint(observation.layout.repository.realpath) !==
      observation.configuration?.service_source_fingerprint
  );
}

function installedConfigurationOwnershipStillExact(observation) {
  const configuration = readRegularJson(observation.layout.configuration_path);
  const plist = readRegularText(observation.layout.launch_agent_path);
  return (
    configuration.state === "valid" &&
    JSON.stringify(configuration.value) ===
      JSON.stringify(observation.configuration) &&
    plist.state === "valid" &&
    validateInstalledConfiguration({
      configuration: configuration.value,
      plist: plist.contents,
      layout: observation.layout,
    }).valid
  );
}

async function waitForRuntimeGenerationMaterialMissing(layout, waitMs) {
  const paths = [
    layout.runtime_manifest_path,
    layout.runtime_token_path,
    layout.runtime_access_path,
    layout.runtime_lock_path,
    layout.runtime_bridge_environment_path,
  ];
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    if (paths.every((file) => readRegularText(file).state === "missing")) {
      return true;
    }
    await delay(25);
  }
  return paths.every((file) => readRegularText(file).state === "missing");
}

function exactResidualSupervisor(observation) {
  const managerState = readRegularJson(observation.layout.manager_state_path);
  if (
    managerState.state !== "valid" ||
    managerState.value?.contract !== COMPANION_SERVICE_CONTRACT ||
    managerState.value?.service_identity !==
      observation.configuration.service_identity ||
    managerState.value?.repository_fingerprint !==
      observation.configuration.repository_fingerprint ||
    managerState.value?.supervisor_pid !== observation.runtime.supervisor_pid ||
    typeof managerState.value?.supervisor_process_identity !== "string" ||
    !processMatchesBirthIdentity(
      managerState.value.supervisor_pid,
      managerState.value.supervisor_process_identity,
    )
  ) return null;
  return {
    pid: managerState.value.supervisor_pid,
    identity: managerState.value.supervisor_process_identity,
  };
}

function writeManagerState(layout, configuration, state) {
  const supervisorIdentity = state.supervisor_pid
    ? readProcessBirthIdentity(state.supervisor_pid)
    : { state: "missing" };
  atomicWriteJson(layout.manager_state_path, {
    contract: COMPANION_SERVICE_CONTRACT,
    schema_version: COMPANION_SERVICE_SCHEMA_VERSION,
    service_identity: configuration.service_identity,
    repository_fingerprint: configuration.repository_fingerprint,
    status: state.status,
    reason: state.reason,
    manager_pid: process.pid,
    manager_process_identity:
      readProcessBirthIdentity(process.pid).identity ?? null,
    supervisor_pid: state.supervisor_pid ?? null,
    supervisor_process_identity:
      state.supervisor_process_identity ??
      (supervisorIdentity.state === "present" ? supervisorIdentity.identity : null),
    runtime_ownership: state.runtime_ownership ?? null,
    restart_count: state.restart_count ?? 0,
    restart_after: state.restart_after ?? null,
    supervisor_failure_provenance:
      validCompanionSupervisorFailureProvenance(
        state.supervisor_failure_provenance,
      )
        ? state.supervisor_failure_provenance
        : null,
    updated_at: new Date().toISOString(),
  }, 0o600);
}

function serviceChildEnvironment(configuration, environment) {
  const values = {
    HOME: configuration.runtime_home_directory,
    PATH: path.dirname(configuration.node_path),
    AUGNES_RUNTIME_STATE_DIR: configuration.runtime_state_directory,
    AUGNES_COMPANION_SERVICE: "1",
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  if (configuration.database_path) {
    values.AUGNES_DB_PATH = configuration.database_path;
  }
  for (const key of ["TMPDIR", "TMP", "TEMP", "LANG", "LC_ALL"]) {
    if (typeof environment[key] === "string" && environment[key].length > 0) {
      values[key] = environment[key];
    }
  }
  return values;
}

function observeRepository(repositoryRoot) {
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot)) {
    throw new PublicCompanionServiceError("companion_service_repository_invalid");
  }
  const lexical = path.resolve(repositoryRoot);
  assertRegularDirectory(lexical, "companion_service_repository_invalid");
  const real = realpathSync(lexical);
  if (real !== lexical) {
    throw new PublicCompanionServiceError("companion_service_repository_alias_refused");
  }
  const stats = statSync(real, { bigint: true });
  return {
    realpath: real,
    repository_fingerprint: sha256(real),
    device: String(stats.dev),
    inode: String(stats.ino),
  };
}

function resolveHome(environment, homeDirectory) {
  const value = homeDirectory ?? environment.HOME ?? os.homedir();
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new PublicCompanionServiceError("companion_service_home_invalid");
  }
  return path.resolve(value);
}

function resolveTestScope({ environment, testScope }) {
  const scope = testScope ?? environment.AUGNES_COMPANION_SERVICE_TEST_SCOPE ?? null;
  if (scope === null) return null;
  if (
    environment.AUGNES_COMPANION_SERVICE_TEST_MODE !== "1" ||
    !/^[a-z0-9][a-z0-9-]{5,63}$/u.test(scope)
  ) {
    throw new PublicCompanionServiceError("companion_service_test_scope_invalid");
  }
  const root = environment.AUGNES_COMPANION_SERVICE_TEST_ROOT;
  if (typeof root !== "string" || !path.isAbsolute(root)) {
    throw new PublicCompanionServiceError("companion_service_test_root_invalid");
  }
  return { scope, root: path.resolve(root) };
}

function inferHomeFromConfiguration(configuration) {
  const marker = `${path.sep}Library${path.sep}LaunchAgents${path.sep}`;
  const index = configuration.launch_agent_path.indexOf(marker);
  if (index <= 0) {
    throw new PublicCompanionServiceError("companion_service_home_invalid");
  }
  return configuration.launch_agent_path.slice(0, index);
}

function inspectNodeBinary(nodePath) {
  try {
    if (typeof nodePath !== "string" || !path.isAbsolute(nodePath)) {
      return { valid: false, path: null, version: null };
    }
    const resolved = realpathSync(nodePath);
    const stats = lstatSync(resolved);
    if (!stats.isFile() || stats.isSymbolicLink() || (stats.mode & 0o111) === 0) {
      return { valid: false, path: null, version: null };
    }
    const result = spawnSync(resolved, ["--version"], {
      encoding: "utf8",
      timeout: 2_000,
      env: {},
    });
    const version = result.status === 0 ? result.stdout.trim() : "";
    if (!new RegExp(`^v${COMPANION_SERVICE_NODE_MAJOR}\\.\\d+\\.\\d+$`, "u").test(version)) {
      return { valid: false, path: resolved, version };
    }
    return { valid: true, path: resolved, version };
  } catch {
    return { valid: false, path: null, version: null };
  }
}

function serviceObservation({
  layout = null,
  configuration = null,
  status,
  checkoutRelation,
  startAvailable,
  resumeAvailable,
  reason,
  runtime = null,
  maintenance = null,
  loaded = false,
  desiredState = null,
}) {
  return {
    status,
    checkout_relation: checkoutRelation,
    start_available: startAvailable,
    resume_available: resumeAvailable,
    reason,
    service_identity: layout?.service_identity ?? null,
    layout,
    configuration,
    runtime,
    maintenance,
    loaded,
    desired_state: desiredState?.desired_state ?? null,
    desired_state_record: desiredState,
  };
}

function lifecycleCommandResult(command, observation, changed) {
  return {
    command,
    result: changed ? "changed" : "exact_replay",
    service: publicCompanionServiceProjection(observation),
    authority: lifecycleAuthority(changed),
  };
}

function serviceNextAction(status, reason = null) {
  if (
    status === "recovery_required" &&
    [
      "companion_service_checkout_identity_changed",
      "companion_service_stale_decommission_incomplete",
    ].includes(reason)
  ) {
    return "Decommission the stale Companion service explicitly.";
  }
  const values = {
    unsupported: "Use a supported macOS user session.",
    not_installed: "Install Augnes Companion service for this checkout.",
    installed_stopped: "Start the installed Augnes Companion service once.",
    starting: "Wait for the installed Augnes Companion service to become live.",
    live: "Read canonical repository continuity.",
    maintenance: "Wait for the current local maintenance operation to finish.",
    service_update_required: "Reinstall the Companion service explicitly for this checkout.",
    recovery_required: "Recover the exact installed Companion service once.",
    ambiguous: "Review the conflicting local Companion service installation.",
  };
  return values[status] ?? values.ambiguous;
}

function startRefusalCode(status) {
  const values = {
    unsupported: "companion_service_platform_unsupported",
    not_installed: "companion_service_setup_required",
    maintenance: "companion_service_maintenance_active",
    service_update_required: "companion_service_update_required",
    ambiguous: "companion_service_ambiguous",
  };
  return values[status] ?? "companion_service_recovery_refused";
}

async function waitForServiceStatus({ accepted, waitMs, ...options }) {
  const deadline = Date.now() + waitMs;
  let observation = await inspectCompanionService(options);
  while (!accepted.has(observation.status) && Date.now() < deadline) {
    await delay(MANAGER_POLL_MS);
    observation = await inspectCompanionService(options);
  }
  return observation;
}

async function waitForMaintenancePause({ waitMs, ...options }) {
  const deadline = Date.now() + waitMs;
  let observation = await inspectCompanionService(options);
  while (
    !(
      observation.status === "maintenance" &&
      observation.runtime?.verified === false &&
      readRegularJson(observation.layout.runtime_manifest_path).state === "missing" &&
      readRegularJson(observation.layout.runtime_access_path).state === "missing"
    ) &&
    Date.now() < deadline
  ) {
    await delay(MANAGER_POLL_MS);
    observation = await inspectCompanionService(options);
  }
  return observation;
}

function launchctlLoaded(layout, launchctl) {
  return launchctl([
    "print",
    `gui/${currentUid()}/${layout.service_label}`,
  ]).status === 0;
}

function defaultLaunchctl(args) {
  return spawnSync("/bin/launchctl", args, {
    encoding: "utf8",
    timeout: 10_000,
    env: {
      PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
      HOME: os.homedir(),
    },
  });
}

function defaultLaunchctlSafeBootout(layout, launchctl) {
  try {
    launchctl(["bootout", `gui/${currentUid()}/${layout.service_label}`]);
  } catch {
    // Installation rollback continues with exact owned file cleanup.
  }
}

function assertSupportedServiceHost(platform) {
  if (platform !== COMPANION_SERVICE_PLATFORM) {
    throw new PublicCompanionServiceError(
      "companion_service_platform_unsupported",
    );
  }
  if (currentUid() === 0) {
    throw new PublicCompanionServiceError(
      "companion_service_root_user_unsupported",
    );
  }
}

function currentUid() {
  return typeof process.getuid === "function" ? process.getuid() : null;
}

function readProcessBirthIdentity(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return { state: "missing" };
  const result = spawnSync(
    "/bin/ps",
    ["-o", "lstart=", "-o", "command=", "-p", String(pid)],
    {
    encoding: "utf8",
    timeout: 1_500,
    env: { PATH: "/usr/bin:/bin" },
    },
  );
  const birthMaterial = result.status === 0 ? result.stdout.trim() : "";
  if (birthMaterial) {
    return {
      state: "present",
      identity: sha256(`${process.platform}:${pid}:${birthMaterial}`),
    };
  }
  try {
    process.kill(pid, 0);
    return { state: "unavailable" };
  } catch (error) {
    return error?.code === "ESRCH"
      ? { state: "missing" }
      : { state: "unavailable" };
  }
}

function processMatchesBirthIdentity(pid, identity) {
  const current = readProcessBirthIdentity(pid);
  return current.state === "present" && current.identity === identity;
}

function processIsDescendantOf(candidatePid, ancestorPid) {
  if (
    !Number.isInteger(candidatePid) ||
    !Number.isInteger(ancestorPid) ||
    candidatePid <= 0 ||
    ancestorPid <= 0
  ) return false;
  let current = candidatePid;
  const seen = new Set();
  while (current > 1 && !seen.has(current)) {
    if (current === ancestorPid) return true;
    seen.add(current);
    const result = spawnSync("/bin/ps", ["-o", "ppid=", "-p", String(current)], {
      encoding: "utf8",
      timeout: 1_500,
      env: { PATH: "/usr/bin:/bin" },
    });
    const parent = Number(result.status === 0 ? result.stdout.trim() : NaN);
    if (!Number.isInteger(parent) || parent <= 0) return false;
    current = parent;
  }
  return current === ancestorPid;
}

async function waitForProcessIdentity(pid) {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    const value = readProcessBirthIdentity(pid);
    if (value.state === "present") return value.identity;
    if (value.state === "missing") return null;
    await delay(25);
  }
  return null;
}

function captureExactProcessGroup(pid, identity) {
  if (!processMatchesBirthIdentity(pid, identity)) {
    throw new PublicCompanionServiceError(
      "companion_service_process_ownership_unverifiable",
    );
  }
  const groupResult = spawnSync(
    "/bin/ps",
    ["-o", "pgid=", "-p", String(pid)],
    {
      encoding: "utf8",
      timeout: 1_500,
      env: { PATH: "/usr/bin:/bin" },
    },
  );
  const processGroup = Number(
    groupResult.status === 0 ? groupResult.stdout.trim() : NaN,
  );
  if (!Number.isInteger(processGroup) || processGroup !== pid) {
    throw new PublicCompanionServiceError(
      "companion_service_process_group_ownership_unverifiable",
    );
  }
  const members = captureProcessGroupMembers(processGroup);
  if (!members.some((member) =>
    member.pid === pid && member.identity === identity
  )) {
    throw new PublicCompanionServiceError(
      "companion_service_process_group_ownership_unverifiable",
    );
  }
  return { process_group: processGroup, members };
}

function captureProcessGroupMembers(processGroup) {
  const result = spawnSync("/bin/ps", ["-axo", "pid=,pgid="], {
    encoding: "utf8",
    timeout: 1_500,
    env: { PATH: "/usr/bin:/bin" },
  });
  if (result.status !== 0) {
    throw new PublicCompanionServiceError(
      "companion_service_process_group_ownership_unverifiable",
    );
  }
  const members = [];
  for (const line of result.stdout.split("\n")) {
    const match = line.trim().match(/^(\d+)\s+(\d+)$/u);
    if (!match || Number(match[2]) !== processGroup) continue;
    const pid = Number(match[1]);
    const identity = readProcessBirthIdentity(pid);
    if (identity.state !== "present") {
      throw new PublicCompanionServiceError(
        "companion_service_process_group_ownership_unverifiable",
      );
    }
    members.push({ pid, identity: identity.identity });
  }
  return members.sort((left, right) => left.pid - right.pid);
}

async function stopExactProcessGroup({
  pid,
  identity,
  processGroup = null,
  members = null,
  timeoutMs,
  errorPrefix,
}) {
  const hasCapturedGroup = processGroup !== null && members !== null;
  if (!hasCapturedGroup && !processMatchesBirthIdentity(pid, identity)) return;
  const captured = hasCapturedGroup
    ? { process_group: processGroup, members }
    : captureExactProcessGroup(pid, identity);
  if (
    captured.process_group !== pid ||
    !captured.members.some((member) =>
      member.pid === pid && member.identity === identity
    )
  ) {
    throw new PublicCompanionServiceError(`${errorPrefix}_ownership_unverifiable`);
  }
  const beforeSignal = exactProcessGroupMembersStillPresent(captured);
  if (beforeSignal.length === 0) return;
  const currentBeforeSignal = captureProcessGroupMembers(captured.process_group);
  if (
    currentBeforeSignal.length !== beforeSignal.length ||
    currentBeforeSignal.some((member, index) =>
      member.pid !== beforeSignal[index].pid ||
      member.identity !== beforeSignal[index].identity
    )
  ) {
    throw new PublicCompanionServiceError(`${errorPrefix}_ownership_unverifiable`);
  }
  signalExactProcessGroup(captured.process_group, "SIGTERM");
  if (await waitForExactProcessGroupExit(captured, timeoutMs)) return;
  const remaining = exactProcessGroupMembersStillPresent(captured);
  const currentMembers = captureProcessGroupMembers(captured.process_group);
  if (
    remaining.length === 0 ||
    currentMembers.length !== remaining.length ||
    currentMembers.some((member, index) =>
      member.pid !== remaining[index].pid ||
      member.identity !== remaining[index].identity
    )
  ) {
    throw new PublicCompanionServiceError(`${errorPrefix}_ownership_unverifiable`);
  }
  signalExactProcessGroup(captured.process_group, "SIGKILL");
  if (!(await waitForExactProcessGroupExit(captured, 4_000))) {
    throw new PublicCompanionServiceError(`${errorPrefix}_stop_timeout`);
  }
}

function signalExactProcessGroup(processGroup, signal) {
  try {
    process.kill(-processGroup, signal);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

function exactProcessGroupMembersStillPresent(group) {
  return group.members.filter((member) => {
    if (!processMatchesBirthIdentity(member.pid, member.identity)) return false;
    const result = spawnSync(
      "/bin/ps",
      ["-o", "pgid=", "-p", String(member.pid)],
      {
        encoding: "utf8",
        timeout: 1_500,
        env: { PATH: "/usr/bin:/bin" },
      },
    );
    return result.status === 0 && Number(result.stdout.trim()) === group.process_group;
  });
}

async function waitForExactProcessGroupExit(group, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (exactProcessGroupMembersStillPresent(group).length === 0) return true;
    await delay(50);
  }
  return exactProcessGroupMembersStillPresent(group).length === 0;
}

async function waitForExactProcessExit(pid, identity, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!processMatchesBirthIdentity(pid, identity)) return true;
    await delay(50);
  }
  return !processMatchesBirthIdentity(pid, identity);
}

function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function createExclusiveJson(file, value) {
  ensureOwnedDirectory(path.dirname(file));
  let descriptor = null;
  try {
    descriptor = openSync(file, "wx", 0o600);
    writeFileSync(descriptor, `${JSON.stringify(value)}\n`, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    chmodSync(file, 0o600);
  } catch (error) {
    if (descriptor !== null) closeSync(descriptor);
    if (error?.code === "EEXIST") {
      throw new PublicCompanionServiceError(
        "companion_service_maintenance_in_progress",
      );
    }
    throw error;
  }
}

function tryCreateExclusiveJson(file, value) {
  ensureOwnedDirectory(path.dirname(file));
  let descriptor = null;
  try {
    descriptor = openSync(file, "wx", 0o600);
    writeFileSync(descriptor, `${JSON.stringify(value)}\n`, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    chmodSync(file, 0o600);
    return true;
  } catch (error) {
    if (descriptor !== null) closeSync(descriptor);
    if (error?.code === "EEXIST") return false;
    throw error;
  }
}

function atomicWriteJson(file, value, mode = 0o600) {
  atomicWriteText(file, `${JSON.stringify(value)}\n`, mode);
}

function atomicWriteText(
  file,
  value,
  mode = 0o600,
  preserveParentMode = false,
) {
  if (preserveParentMode) {
    ensureLaunchAgentDirectory(path.dirname(file));
  } else {
    ensureOwnedDirectory(path.dirname(file));
  }
  const temporary = `${file}.tmp-${process.pid}-${randomUUID()}`;
  let descriptor = null;
  try {
    descriptor = openSync(temporary, "wx", mode);
    writeFileSync(descriptor, value, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    renameSync(temporary, file);
    chmodSync(file, mode);
  } finally {
    if (descriptor !== null) closeSync(descriptor);
    try {
      unlinkSync(temporary);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function readRegularJson(file) {
  const text = readRegularText(file);
  if (text.state !== "valid") return text;
  try {
    return { state: "valid", value: JSON.parse(text.contents) };
  } catch {
    return { state: "invalid", value: null };
  }
}

function readRegularText(file) {
  try {
    const stats = lstatSync(file);
    if (!stats.isFile() || stats.isSymbolicLink() || stats.size > MAX_JSON_BYTES) {
      return { state: "invalid", contents: null };
    }
    return { state: "valid", contents: readFileSync(file, "utf8") };
  } catch (error) {
    return error?.code === "ENOENT"
      ? { state: "missing", contents: null }
      : { state: "invalid", contents: null };
  }
}

function removeExactMaintenanceLease(file, lease) {
  const current = readRegularJson(file);
  if (
    current.state !== "valid" ||
    current.value?.operation_id !== lease.operation_id ||
    current.value?.owner_pid !== lease.owner_pid ||
    current.value?.owner_process_identity !== lease.owner_process_identity ||
    current.value?.service_identity !== lease.service_identity
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_maintenance_changed",
    );
  }
  unlinkSync(file);
}

function removeServiceOwnedStateFile(file, configuration) {
  const value = readRegularJson(file);
  if (value.state === "missing") return;
  if (
    value.state !== "valid" ||
    value.value?.contract !== COMPANION_SERVICE_CONTRACT ||
    value.value?.service_identity !== configuration.service_identity ||
    value.value?.repository_fingerprint !== configuration.repository_fingerprint
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_owned_state_conflict",
    );
  }
  unlinkSync(file);
}

function removeServiceOwnedDesiredState(file, configuration) {
  const value = readRegularJson(file);
  if (value.state === "missing") return;
  if (
    value.state !== "valid" ||
    !validateDesiredStateRecord(value.value, configuration).valid
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_owned_state_conflict",
    );
  }
  unlinkSync(file);
}

function removeOwnedRegularJson(file, expected) {
  const current = readRegularJson(file);
  if (current.state === "missing") return;
  if (
    current.state !== "valid" ||
    JSON.stringify(current.value) !== JSON.stringify(expected)
  ) {
    throw new PublicCompanionServiceError(
      "companion_service_owned_state_conflict",
    );
  }
  unlinkSync(file);
}

function removeOwnedRegularFile(file, expected) {
  const current = readRegularText(file);
  if (current.state === "missing") return;
  if (current.state !== "valid" || current.contents !== expected) {
    throw new PublicCompanionServiceError(
      "companion_service_owned_state_conflict",
    );
  }
  unlinkSync(file);
}

function ensureOwnedDirectory(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const stats = lstatSync(directory);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new PublicCompanionServiceError(
      "companion_service_directory_invalid",
    );
  }
  chmodSync(directory, 0o700);
}

function ensureLaunchAgentDirectory(directory) {
  try {
    const stats = lstatSync(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new PublicCompanionServiceError(
        "companion_service_launch_agent_directory_invalid",
      );
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const stats = lstatSync(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new PublicCompanionServiceError(
        "companion_service_launch_agent_directory_invalid",
      );
    }
  }
}

function removeDirectoryIfEmpty(directory) {
  try {
    rmdirSync(directory);
  } catch (error) {
    if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error?.code)) throw error;
  }
}

function assertRegularDirectory(directory, code) {
  try {
    const stats = lstatSync(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) throw new Error(code);
  } catch (error) {
    throw new PublicCompanionServiceError(code, error);
  }
}

function assertRegularNonSymlink(file, code) {
  try {
    const stats = lstatSync(file);
    if (!stats.isFile() || stats.isSymbolicLink()) throw new Error(code);
  } catch (error) {
    throw new PublicCompanionServiceError(code, error);
  }
}

function validOperationId(value) {
  return typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{5,127}$/u.test(value);
}

function isIsoTimestamp(value) {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) &&
    !Number.isNaN(Date.parse(value));
}

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function boundedTail(value) {
  return Buffer.from(value, "utf8").subarray(-MAX_CHILD_TAIL_BYTES).toString("utf8");
}

function validSupervisorAttemptDiagnostics(value) {
  return (
    isObject(value) &&
    typeof value.output_tail === "string" &&
    (
      value.exit_observation === null ||
      (
        isObject(value.exit_observation) &&
        (
          value.exit_observation.status === null ||
          (
            Number.isInteger(value.exit_observation.status) &&
            value.exit_observation.status >= 0
          )
        ) &&
        typeof value.exit_observation.signal_present === "boolean"
      )
    )
  );
}

function validCompanionSupervisorFailureProvenance(value) {
  if (!isObject(value)) return false;
  const expectedKeys = [
    "attempt_tail_sha256",
    "child_exit_signal_present",
    "child_exit_status",
    "failure_origin",
    "restart_count",
    "restart_reason",
  ];
  return (
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify(expectedKeys) &&
    COMPANION_SUPERVISOR_FAILURE_ORIGINS.includes(value.failure_origin) &&
    (
      value.child_exit_status === null ||
      (Number.isInteger(value.child_exit_status) && value.child_exit_status >= 0)
    ) &&
    typeof value.child_exit_signal_present === "boolean" &&
    Number.isInteger(value.restart_count) &&
    value.restart_count >= 1 &&
    value.restart_reason === "companion_service_restart_backoff" &&
    /^sha256:[a-f0-9]{64}$/u.test(value.attempt_tail_sha256)
  );
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function publicCode(error, fallback) {
  return typeof error?.code === "string" && error.code.length > 0
    ? error.code
    : fallback;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
