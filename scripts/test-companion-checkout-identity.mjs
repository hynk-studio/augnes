#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, realpathSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync, symlinkSync, existsSync, copyFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import childProcess, { spawnSync } from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { mock } from "node:test";
import { observeCheckoutIdentity, compareCompanionCheckoutIdentity, checkoutObservationBinding } from "../plugins/augnes-operator/mcp/checkout-identity.mjs";
import { installCompanionService, inspectCompanionService, inspectCompanionPreservation, previewCompanionIdentityEnrollment,
  enrollCompanionIdentity, stopCompanionService, startCompanionService, uninstallCompanionService, resolveCompanionServiceLayout,
  computeServiceSourceFingerprint } from "../plugins/augnes-operator/mcp/companion-service-core.mjs";

const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "augnes-checkout-identity-")));
const repository = path.join(root, "checkout");
const actions = [];
const launchctl = args => { actions.push(args[0]); assert.equal(args[0], "print", "no service effects in stopped fixture"); return { status: 113 }; };
const options = { repositoryRoot: repository, homeDirectory: path.join(root, "home"),
  environment: { AUGNES_COMPANION_SERVICE_TEST_MODE: "1", AUGNES_COMPANION_SERVICE_TEST_ROOT: path.join(root, "state"), AUGNES_COMPANION_SERVICE_TEST_SCOPE: "identity" },
  testScope: "identity", launchctl, waitMs: 1 };
let cases = 0;
const check = (condition, message) => { assert.ok(condition, message); cases++; };
const clone = value => structuredClone(value);
const write = (file, value) => writeFileSync(file, JSON.stringify(value) + "\n", { mode: 0o600 });
const cli = args => {
  const run = spawnSync(process.execPath, [path.join(repository, "scripts/augnes-companion-service.mjs"), ...args], {
    env: { ...options.environment, HOME: options.homeDirectory, PATH: "/usr/bin:/bin" }, encoding: "utf8", timeout: 5_000,
  });
  assert.equal(run.status, 0, run.stderr); return JSON.parse(run.stdout);
};
const refused = async (operation, code) => { await assert.rejects(operation, error => error.code === code); cases++; };
try {
  for (const file of ["scripts/augnes-companion-service.mjs", "plugins/augnes-operator/mcp/companion-service-core.mjs", "plugins/augnes-operator/mcp/checkout-identity.mjs", "plugins/augnes-operator/mcp/checkout-identity-darwin.py"]) {
    mkdirSync(path.dirname(path.join(repository, file)), { recursive: true }); copyFileSync(file, path.join(repository, file));
  }
  const observed = observeCheckoutIdentity(repository);
  check(observed.durable_observation === "observed", "real Darwin provider must be available, not mocked or skipped");
  check(JSON.stringify(observeCheckoutIdentity(repository)) === JSON.stringify(observed), "real descriptor round trip");
  const configuration = { schema_version: 2, repository_root: repository, repository_fingerprint: observed.repository_fingerprint,
    repository_device: observed.device, repository_inode: observed.inode, repository_identity: observed.durable_identity };
  const changedDevice = { ...observed, device: String(BigInt(observed.device) + 1n) };
  check(compareCompanionCheckoutIdentity(configuration, changedDevice).valid, "separate lifecycle device renumbering: deterministic case, not real remount");
  check(checkoutObservationBinding(observed) !== checkoutObservationBinding(changedDevice), "active-run binding remains strict");
  const historical = { root: "/Users/hynk/code/augnes", fingerprint: "abde46b4408dd7423f7016b1a5e7ff57d8e0c5c76790ff6e6887219ae9599cf0", device: "16777234", inode: "100510742" };
  const later = { ...historical, device: "16777233" };
  check(!["root", "fingerprint", "device", "inode"].every(key => historical[key] === later[key]), "frozen old exactRelation regression still refuses");
  for (const [key, value] of [["volume_uuid", "11111111-1111-1111-1111-111111111111"], ["object_id", "1111111111111111"], ["birth_seconds", "1"]]) {
    const replaced = clone(observed); replaced.durable_identity[key] = value;
    check(!compareCompanionCheckoutIdentity(configuration, replaced).valid, `different ${key} refuses with same numeric inode/path`);
  }
  for (const state of ["unsupported", "unavailable", "incoherent", undefined])
    check(!compareCompanionCheckoutIdentity(configuration, { ...observed, durable_observation: state }).valid, `unavailable is not continuity: ${state}`);
  for (const identity of [null, {}, { ...observed.durable_identity, volume_uuid: "" }, { ...observed.durable_identity, extra: true }])
    check(!compareCompanionCheckoutIdentity({ ...configuration, repository_identity: identity }, observed).valid, "malformed persisted identity refuses");
  symlinkSync(repository, path.join(root, "alias"));
  assert.throws(() => observeCheckoutIdentity(path.join(root, "alias"))); cases++;
  const originalSpawn = childProcess.spawnSync;
  let swapped = false;
  const race = mock.method(childProcess, "spawnSync", (...args) => {
    const result = originalSpawn(...args);
    if (args[0] === "/usr/bin/python3" && !swapped) {
      renameSync(repository, repository + "-raced"); mkdirSync(repository); swapped = true;
    }
    return result;
  });
  syncBuiltinESMExports();
  try { assert.throws(() => observeCheckoutIdentity(repository), error => error.code === "companion_service_identity_observation_incoherent"); cases++; }
  finally { race.mock.restore(); syncBuiltinESMExports(); if (swapped) { rmSync(repository, { recursive: true }); renameSync(repository + "-raced", repository); } }
  for (const state of ["unsupported", "unavailable", "incoherent"]) {
    const failure = mock.method(childProcess, "spawnSync", () => ({ status: 1, stdout: JSON.stringify({ state }) }));
    syncBuiltinESMExports();
    try { check(observeCheckoutIdentity(repository).durable_observation === state, "actual resolver preserves missing provider observation"); }
    finally { failure.mock.restore(); syncBuiltinESMExports(); }
  }
  renameSync(repository, repository + "-original"); mkdirSync(repository);
  check(!compareCompanionCheckoutIdentity(configuration, observeCheckoutIdentity(repository)).valid, "real replaced directory refuses");
  rmSync(repository, { recursive: true }); renameSync(repository + "-original", repository);

  const installed = await installCompanionService({ ...options, start: false });
  check(installed.service.status === "installed_stopped", "supported stopped install, no launch or DB preparation");
  const layout = resolveCompanionServiceLayout(options);
  const current = JSON.parse(readFileSync(layout.configuration_path));
  check(current.schema_version === 2 && current.repository_identity.contract.endsWith(".v1"), "configuration versioned independently");
  const desiredBytes = readFileSync(layout.desired_state_path);
  const configBytes = readFileSync(layout.configuration_path);
  for (let session = 0; session < 2; session++) {
    const status = cli(["status"]);
    check(status.status === "installed_stopped", "thread identity is not checkout identity or authority");
  }
  const drift = { ...current, repository_device: String(BigInt(current.repository_device) + 1n) };
  write(layout.configuration_path, drift);
  check((await inspectCompanionService(options)).status === "installed_stopped", "real inspector accepts durable continuity with synthetic enrollment device drift");
  check((await stopCompanionService(options)).service.status === "installed_stopped", "stop resolves enrolled target without starting");
  await installCompanionService(options);
  check(readFileSync(layout.desired_state_path).equals(desiredBytes), "ordinary install replay/update preserves stopped intent");

  // Disposable legacy records reproduce the old installed format, never a
  // production config rewrite. Exercise both exact and ambiguous legacy input.
  const legacy = { ...current, schema_version: 1 }; delete legacy.repository_identity;
  for (const device of [current.repository_device, drift.repository_device]) {
    write(layout.configuration_path, { ...legacy, repository_device: device });
    const legacyBytes = readFileSync(layout.configuration_path);
    const status = await inspectCompanionService(options);
    check(!status.start_available && status.checkout_identity.category === "legacy_evidence_insufficient", "legacy ordinary read is non-authorizing");
    check(readFileSync(layout.configuration_path).equals(legacyBytes), "status never enrolls");
    await refused(() => startCompanionService(options), device === current.repository_device ? "companion_service_update_required" : "companion_service_recovery_refused");
    const preview = previewCompanionIdentityEnrollment(options);
    const decision = preview.decision;
    await refused(() => enrollCompanionIdentity({ ...options, decision: { ...decision, expires_at: "2000-01-01T00:00:00.000Z" } }), "companion_service_identity_enrollment_decision_stale");
    await refused(() => enrollCompanionIdentity({ ...options, decision: { ...decision, expected_source_fingerprint: "0".repeat(64) } }), "companion_service_identity_enrollment_decision_stale");
    await refused(() => enrollCompanionIdentity({ ...options, decision, testIdentityEnrollmentStageHook() { throw Object.assign(new Error(), { code: "simulated_interruption" }); } }), "simulated_interruption");
    check(readFileSync(layout.configuration_path).equals(legacyBytes) && !existsSync(layout.lifecycle_lock_path), "interrupted precommit keeps legacy config and settles own lock");
    await refused(() => enrollCompanionIdentity({ ...options, decision, testIdentityEnrollmentStageHook() { write(layout.desired_state_path, { ...JSON.parse(desiredBytes), desired_state: "running" }); } }), "companion_service_identity_enrollment_decision_stale");
    writeFileSync(layout.desired_state_path, desiredBytes);
    const outcomes = await Promise.allSettled([enrollCompanionIdentity({ ...options, decision }), enrollCompanionIdentity({ ...options, decision })]);
    check(outcomes.filter(value => value.status === "fulfilled").length === 1, "only one concurrent enrollment consumes exact decision");
    check(outcomes.filter(value => value.status === "rejected").length === 1, "stale contender refuses; no replacement ownership");
    check(readFileSync(layout.desired_state_path).equals(desiredBytes), "enrollment preserves stopped intent byte for byte");
    check((await inspectCompanionService(options)).status === "installed_stopped", "explicit enrollment supports current lifecycle");
    await refused(() => enrollCompanionIdentity({ ...options, decision }), "companion_service_identity_enrollment_legacy_required");
  }
  // Running intent remains intent; enrollment doesn't load it or open storage.
  write(layout.configuration_path, legacy);
  write(layout.desired_state_path, { ...JSON.parse(desiredBytes), desired_state: "running" });
  const running = previewCompanionIdentityEnrollment(options);
  const cliPreview = cli(["identity-preview"]);
  const decisionFile = path.join(root, "decision.json"); write(decisionFile, cliPreview.decision);
  check(cli(["enroll-identity", decisionFile]).result === "enrolled", "fresh CLI consumes protected explicit decision through real entry point");
  check(JSON.parse(readFileSync(layout.desired_state_path)).desired_state === "running", "running intent preserved without starting");
  writeFileSync(layout.desired_state_path, desiredBytes);
  const preservation = await inspectCompanionPreservation(options);
  check(preservation.state.preservation_valid, "coherent stopped preservation");
  let prints = 0;
  const changed = await inspectCompanionPreservation({ ...options, launchctl(args) {
    if (++prints === 2) write(layout.configuration_path, { ...JSON.parse(readFileSync(layout.configuration_path)), installed_at: "2001-01-01T00:00:00.000Z" });
    return launchctl(args);
  } });
  check(!changed.state.preservation_valid && !changed.diagnostics.coherent, "active-run material change refuses, no rebaseline");
  writeFileSync(layout.configuration_path, configBytes);
  check((await uninstallCompanionService(options)).service.status === "not_installed", "supported stopped uninstall");
  check(!existsSync(path.join(root, "state", "data")), "no database preparation in identity lifecycle");
  check(actions.every(action => action === "print"), "no launch, signalling, DNS, network or model effect");
  console.log(JSON.stringify({ status: "passed", cases, real_darwin_provider: true, deterministic_device_drift: true,
    real_mount_renumbering: "NOT_RUN", stopped_lifecycle: true, real_provider_calls: 0,
    provider_identity_fingerprint: createHash("sha256").update(JSON.stringify(observed.durable_identity)).digest("hex"),
    source_fingerprint: computeServiceSourceFingerprint(process.cwd()) }));
} finally { rmSync(root, { recursive: true, force: true }); }
