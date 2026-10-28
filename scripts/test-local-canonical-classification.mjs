import assert from "node:assert/strict";
import { chmodSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, buildCanonicalChildEnvironment, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse } from "./canonical-test-environment.mjs";
import { runCanonicalChild as executeChild } from "./canonical-child-runner.mjs";
import { INPUT_CONTRACT, LEGACY_INPUT_CONTRACT, freezeInputContract, classifyInputChange, observeInputFile, monitorInputContract, digest, deriveOperationalDisposition, commonInputResources, inputReadOptions } from "./local-canonical-inputs.mjs";
import { beginAttempt, finishAttempt, inspectAttemptRecords, readRecoveryProof, readSourceCorrectionProof } from "./local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { runPhasesSequentially, enforceArtifactRetention, FULL_PHASE_IDS, buildPhasePlan, browserReplacementLiveBinding, phaseEnvironment, prepareInvocationInputs } from "./run-local-canonical-verification.mjs";
import { createIsolatedInvocationResources, cleanupIsolatedInvocationResources } from "./local-canonical-isolated-resources.mjs";
import { pinVerificationEvidence } from "./local-canonical-evidence-retention.mjs";
import { canonicalSerialize, finalizeReceipt, inspectReceiptForDecision, verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "./local-canonical-review-export.mjs";
import { beginBrowserUse, validBrowserUse } from "./local-canonical-browser-identity.mjs";
import { baseReceipt, validContext } from "./fixtures/local-canonical-receipt-v3.mjs";

const owner = createCanonicalTestResourceRoot("ag-resource-test-");
const root = owner.root;
let childInFlight = false;
const findings = [];
async function runCanonicalChild(options) {
  childInFlight = true;
  const result = await executeChild(options);
  childInFlight = !(result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0);
  return result;
}
beginCanonicalTestResourceUse(owner);
try {
const config = path.join(root, "ambient.toml");
const initial = 'model = "sentinel-a"\nmodel_reasoning_effort = "high"\nservice_tier = "default"\n[projects.fixture]\ntrust_level = "untrusted"\n';
const changed = initial.replace("sentinel-a", "sentinel-b").replace('"high"', '"low"');
const quiet = { write() {} };
const note = name => findings.push(name);
const write = (file, value) => writeFileSync(file, value, { mode: 0o600 });
const resource = (classification = "ambient") => ({ id: "codex-preferences", file: config, classification, excludePreferences: classification === "ambient" });
const contract = (classification = "ambient", extra = {}) => freezeInputContract({ contract: LEGACY_INPUT_CONTRACT, resources: [resource(classification)], pathKind: classification === "ambient" ? "isolated-model-free-v1" : "consuming-fixture", binding: { fixture: "sentinel-consumer" }, ...extra });
const env = buildCanonicalChildEnvironment({ temporaryRoot: root, ambientEnvironment: { PATH: process.env.PATH, CODEX_HOME: root, OPENAI_API_KEY: "sentinel-not-a-credential", AUGNES_GUIDEBRIEF_REAL_PROVIDER_ACCEPTANCE: "1" } });
mkdirSync(env.HOME, { recursive: true });
mkdirSync(path.join(env.HOME, ".codex"));
write(path.join(env.HOME, ".codex", "config.toml"), 'model = "private-sentinel"\n');
assert(!Object.hasOwn(env, "CODEX_HOME") && !Object.hasOwn(env, "OPENAI_API_KEY") && !Object.hasOwn(env, "AUGNES_GUIDEBRIEF_REAL_PROVIDER_ACCEPTANCE"));

async function observedChild({ consumes = false, mutation = changed, observerFailure = false, timeout = false, inputContract = LEGACY_INPUT_CONTRACT } = {}) {
  write(config, initial);
  let refuseRead = false;
  const frozen = contract(consumes ? "execution" : "ambient", { contract: inputContract,
    ...(observerFailure ? { read: (...args) => { if (refuseRead) throw new Error("fixture observer unavailable"); return observeInputFile(...args); } } : {}) });
  const controller = new AbortController();
  const monitor = monitorInputContract(frozen, controller, { intervalMs: 10 });
  let timer;
  const output = [];
  const script = `const fs=require('fs'); const path=require('path');
    const selected=${consumes ? JSON.stringify(config) : "path.join(process.env.HOME,'.codex','config.toml')"};
    console.log(fs.readFileSync(selected,'utf8').split('\\n')[0]);
    process.on('SIGTERM',()=>process.exit(0));
    setTimeout(()=>{console.log(fs.readFileSync(selected,'utf8').split('\\n')[0]);process.exit(0)},240);`;
  let result;
  try {
    result = await runCanonicalChild({ suite: "classification", label: "disposable-consumer", command: process.execPath,
      args: ["-e", script], cwd: root, env, timeoutMs: timeout ? 100 : 2000, termGraceMs: 300, killGraceMs: 300,
      signal: controller.signal, stdout: { write: b => output.push(b.toString()) }, stderr: quiet, log() {},
      onSpawn: () => { if (!timeout) timer = setTimeout(() => { write(config, mutation); refuseRead = observerFailure; }, 80); } });
  } finally { clearTimeout(timer); monitor.stop(); }
  assert(result.cleanup_completed && result.remaining_owned_processes === 0 && result.streams_closed);
  return { result, evidence: frozen.snapshot(), output: output.join("") };
}

  // The actual refusal included a changed remainder, not just a model switch.
  // These are synthetic changes in our owned fixture, never edits of host policy.
  const remainder = initial.replace("untrusted", "trusted") + 'unrecognized = "different"\n';
  const currentContract = () => contract("ambient", { contract: INPUT_CONTRACT });
  const live = inputs => browserReplacementLiveBinding({ inputs, browserInput: null, host: {}, nodePolicy: {},
    machineFingerprint: "fixture", executorFingerprint: "fixture", phaseDefinitions: [] });
  for (const change of [initial, changed, remainder]) {
    write(config, initial);
    const frozen = currentContract(), before = frozen.snapshot(), prepared = live(before);
    write(config, change);
    assert.equal(frozen.check({ force: true }), null);
    const current = currentContract().snapshot();
    assert.equal(live(current).commonInputsSha256, prepared.commonInputsSha256);
    const r = before.resources[0];
    assert(["unchanged", "ambient_observation"].includes(classifyInputChange(r.before, current.resources[0].before, r, before)));
    // A fresh process exercises the same binding and comparator used by stock.
    const packet = path.join(root, "effective-input.json"); write(packet, JSON.stringify({ before, current }));
    const fresh = await runCanonicalChild({ suite: "classification", label: "fresh-effective-input", command: process.execPath,
      args: ["--input-type=module", "-e", `
        import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs';
        import {classifyInputChange, commonInputResources, digest} from ${JSON.stringify(pathToFileURL(path.resolve("scripts/local-canonical-inputs.mjs")).href)};
        import {browserReplacementLiveBinding} from ${JSON.stringify(pathToFileURL(path.resolve("scripts/run-local-canonical-verification.mjs")).href)};
        const {before,current}=JSON.parse(readFileSync(${JSON.stringify(packet)}));
        const binding=inputs=>browserReplacementLiveBinding({inputs,host:{},nodePolicy:{},phaseDefinitions:[]}).commonInputsSha256;
        assert.equal(binding(before),binding(current));
        assert.equal(digest(commonInputResources(before)),digest(commonInputResources(current)));
        const r=before.resources[0]; assert(['unchanged','ambient_observation'].includes(classifyInputChange(r.before,current.resources[0].before,r,before)));
      `], cwd: root, env, timeoutMs: 5000, stdout: quiet, stderr: quiet, log() {} });
    assert.equal(fresh.exit_code, 0); assert(fresh.cleanup_completed);
    // v2 uses the complete original binding and conservative remainder rule.
    const legacyBefore = { ...before, contract: LEGACY_INPUT_CONTRACT }, legacyCurrent = { ...current, contract: LEGACY_INPUT_CONTRACT };
    assert.equal(live(legacyBefore).commonInputsSha256, digest(legacyBefore.resources));
    if (change !== initial) assert.notEqual(live(legacyBefore).commonInputsSha256, live(legacyCurrent).commonInputsSha256);
  }
  const remainderChild = await observedChild({ mutation: remainder, inputContract: INPUT_CONTRACT });
  assert.equal(remainderChild.result.cancelled, false); assert.match(remainderChild.output, /private-sentinel/);
  assert.equal(remainderChild.evidence.first_fault, null);
  const consumingRemainder = await observedChild({ consumes: true, mutation: remainder, inputContract: INPUT_CONTRACT });
  assert(consumingRemainder.result.cancelled); assert.equal(consumingRemainder.evidence.first_fault.disposition, "input_invalidation");
  write(config, initial); const v3 = currentContract(), before = v3.snapshot();
  write(config, remainder); const after = observeInputFile(config, inputReadOptions(resource(), before));
  for (const policy of [{ ...before, contract: LEGACY_INPUT_CONTRACT }, { ...before, path_kind: "consuming-fixture" }, { ...before, contract: "unknown" }])
    assert.equal(classifyInputChange(before.resources[0].before, after, resource(), policy), "unknown_relevance");
  for (const r of [{ ...resource(), classification: "unknown" }, { ...resource(), id: "unreviewed-config" }])
    assert.equal(classifyInputChange(before.resources[0].before, after, r, before), "unknown_relevance");
  for (const key of ["mode", "uid", "gid", "device"]) {
    const unsafe = structuredClone(after); unsafe.metadata[key] = String(BigInt(unsafe.metadata[key]) + 1n);
    assert.equal(classifyInputChange(after, unsafe, resource(), before), "safety_violation");
  }
  const permission = { ...after, permission_identity: "0".repeat(64) };
  assert.equal(classifyInputChange(after, permission, resource(), before), "safety_violation");
  for (const bad of [{ ...after, permission_identity: null }, { ...after, sha256: null }, { ...after, metadata: { ...after.metadata, links: "2" } }])
    assert.equal(classifyInputChange(after, bad, resource(), before), "unknown_relevance");
  assert.equal(classifyInputChange(after, { present: false }, resource(), before), "input_invalidation");
  const replacementV3 = path.join(root, "replacement-v3"); write(replacementV3, remainder); renameSync(replacementV3, config);
  assert.equal(v3.check(), null); assert.equal(live(currentContract().snapshot()).commonInputsSha256, live(before).commonInputsSha256);
  chmodSync(config, 0o644); assert.equal(v3.check().disposition, "safety_violation"); chmodSync(config, 0o600);
  assert.notEqual(live(currentContract().snapshot()).commonInputsSha256, live({ ...before, resources: [{ ...before.resources[0], before: permission }] }).commonInputsSha256);
  note("v3 preparation/admission projection, monitor and fresh reconstruction agree for preferences, metadata replacement and non-preference remainder; consuming/unknown/safety and legacy v2 remain refusing");

  // Use the real phase environment and nested suite filter. The descendant uses
  // the native consumer's CODEX_HOME-or-homedir selection, with a deliberately
  // consuming control showing that private HOME alone is not sufficient.
  const isolated = createIsolatedInvocationResources("classification-descendant");
  try {
    const outer = phaseEnvironment({ phase: {}, isolatedResources: isolated });
    for (const key of ["CODEX_HOME", "OPENAI_API_KEY", "GH_TOKEN", "GITHUB_TOKEN", "NODE_OPTIONS", "AUGNES_GUIDEBRIEF_REAL_PROVIDER_ACCEPTANCE"])
      assert(!Object.hasOwn(outer, key), key);
    const nested = buildCanonicalChildEnvironment({ temporaryRoot: root, ambientEnvironment: { ...outer, CODEX_HOME: root, OPENAI_API_KEY: "synthetic-only" } });
    assert(!Object.hasOwn(nested, "CODEX_HOME") && !Object.hasOwn(nested, "OPENAI_API_KEY"));
    const descendant = `const fs=require('node:fs'),path=require('node:path'),os=require('node:os');const selected=path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'config.toml');process.stdout.write(fs.readFileSync(selected,'utf8'));`;
    const launch = async explicit => {
      let output = "";
      const result = await runCanonicalChild({ suite: "classification", label: "nested-selection", command: process.execPath,
        args: ["-e", `const {execFileSync}=require('node:child_process');process.stdout.write(execFileSync(process.execPath,['-e',${JSON.stringify(descendant)}],{env:process.env,timeout:2000}));`],
        cwd: root, env: explicit ? { ...nested, CODEX_HOME: root } : nested, timeoutMs: 5000,
        stdout: { write: b => output += b }, stderr: quiet, log() {} });
      assert.equal(result.exit_code, 0); assert(result.cleanup_completed); return output;
    };
    write(path.join(root, "config.toml"), initial);
    assert.equal(await launch(false), 'model = "private-sentinel"\n'); assert.equal(await launch(true), initial);
    write(path.join(root, "config.toml"), remainder);
    assert.equal(await launch(false), 'model = "private-sentinel"\n'); assert.equal(await launch(true), remainder);
    assert.throws(() => prepareInvocationInputs({ verificationContext: { kind: "isolated-worktree" }, isolatedResources: null }), /isolation_context/);
    assert.throws(() => prepareInvocationInputs({ verificationContext: { kind: "canonical" }, isolatedResources: isolated }), /isolation_context/);
  } finally { assert(cleanupIsolatedInvocationResources(isolated, { consumersSettled: true }).completed); }
  note("actual phase and suite environments plus launched descendant selection exclude shared configuration; explicit consuming path observes it; context mismatch refuses");

  const ambient = await observedChild();
  assert.equal(ambient.result.exit_code, 0); assert.equal(ambient.result.cancelled, false);
  assert.match(ambient.output, /private-sentinel/); assert(!ambient.output.includes("sentinel-b"));
  assert.equal(ambient.evidence.first_fault, null);
  assert.notEqual(ambient.evidence.resources[0].before.sha256, ambient.evidence.events[0].after.sha256, "the old blanket equality rule would reject this same controlled observation");
  assert.equal(ambient.evidence.events[0].disposition, "ambient_observation");
  note("effective private selection survives unrelated ambient preference mutation");
  const consuming = await observedChild({ consumes: true });
  assert.equal(consuming.result.cancelled, true); assert.equal(consuming.evidence.first_fault.disposition, "input_invalidation");
  assert.equal(consuming.result.exit_code, 0, "graceful exit after cancellation is still failure");
  assert.match(consuming.output, /sentinel-a/);
  note("same preference mutation invalidates a deliberately consuming child and settles exact owner");
  const mixed = await observedChild({ mutation: changed.replace("untrusted", "trusted") });
  assert.equal(mixed.evidence.first_fault.disposition, "unknown_relevance"); assert(mixed.result.cancelled);
  const unknown = await observedChild({ mutation: changed + 'unreviewed = "value"\n' });
  assert(unknown.result.cancelled);
  note("trust and unknown remainder edits cannot hide behind excluded preferences");
  const broken = await observedChild({ observerFailure: true });
  assert.equal(broken.evidence.first_fault.disposition, "observer_failure"); assert(broken.result.cancelled);
  note("critical observer failure latches and cancels without replacing baseline");
  const timed = await observedChild({ timeout: true });
  assert.equal(timed.result.timed_out, true); assert.equal(timed.result.exit_code, 0);
  assert.equal(deriveOperationalDisposition({ phases: [{ status: "failure", timed_out: true }], cleanup: true }), "unclassified_timeout");
  note("exit zero following timeout remains unclassified failure");

  write(config, initial);
  const frozen = contract();
  const replacement = path.join(root, "replacement"); write(replacement, initial); renameSync(replacement, config);
  assert.equal(frozen.check(), null); assert.equal(frozen.snapshot().events[0].disposition, "ambient_observation");
  assert.match(frozen.snapshot().resources[0].before.metadata.mtime_ns, /^\d+$/u);
  chmodSync(config, 0o644); assert.equal(frozen.check().disposition, "safety_violation");
  const firstFault = frozen.snapshot().first_fault;
  chmodSync(config, 0o600); write(config, changed);
  frozen.check(); assert.deepEqual(frozen.snapshot().first_fault, firstFault);
  const highPrecision = structuredClone(observeInputFile(config));
  const persistedObservation = path.join(root, "persisted-input-observation.json");
  write(persistedObservation, canonicalSerialize(highPrecision));
  assert.equal(classifyInputChange(JSON.parse(readFileSync(persistedObservation, "utf8")), observeInputFile(config), { classification: "execution" }), "unchanged",
    "stock readers must compare persisted canonical observations independently of JSON property order");
  const otherPrecision = structuredClone(highPrecision); otherPrecision.metadata.mtime_ns = String(BigInt(highPrecision.metadata.mtime_ns) + 1n);
  assert.equal(classifyInputChange(highPrecision, otherPrecision, { classification: "execution" }), "input_invalidation");
  note("metadata-only ambient replacement allowed; permissions and nanosecond input changes refuse; first fault persists");
  for (const kind of ["symlink", "hardlink"]) {
    rmSync(config); if (kind === "symlink") symlinkSync(path.join(env.HOME, ".codex", "config.toml"), config); else linkSync(path.join(env.HOME, ".codex", "config.toml"), config);
    assert.throws(() => contract()); rmSync(config); write(config, initial);
  }
  note("symlink and hardlink aliases refuse");
  for (const classification of ["execution", "safety", "unknown"]) {
    write(config, initial); const c = contract(classification); write(config, changed);
    assert(c.check());
  }
  const cancel = new AbortController();
  const sequence = await runPhasesSequentially({ phases: [{ id: "first" }, { id: "forbidden-second" }], signal: cancel.signal,
    execute: async () => { cancel.abort(); return { status: "pass" }; } });
  assert.equal(sequence.length, 1);
  note("execution/safety/unknown mutations refuse and cancellation prevents next phase admission");
  write(config, initial);
  const safety = contract();
  write(config, changed); // an explicitly identified owned write in this disposable fixture
  safety.reportSafetyEvent("unauthorized_task_write");
  assert.equal(safety.check().disposition, "safety_violation");
  const safetyController = new AbortController();
  const safetyMonitor = monitorInputContract(safety, safetyController, { assertOwner: () => { throw new Error("owner replaced"); } });
  assert(safetyController.signal.aborted); assert.equal(safetyMonitor.fault().resource, "unauthorized_task_write"); safetyMonitor.stop();
  note("identified unauthorized owned write and changed-owner faults remain hard stops despite preference exclusion");

  const checkout = path.join(root, "checkout"); mkdirSync(checkout);
  const checkoutOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: checkout });
  try {
    const request = { anchorRoot: root, repositoryRoot: checkout, checkoutOwner, branch: "codex/disposable-recovery", head: "1".repeat(40), tree: "2".repeat(40), runId: "initial-run", contractFingerprint: "3".repeat(64) };
    const attempt1 = beginAttempt(request);
    // Real child spawn error, followed by a task-local repaired executable probe.
    const missing = path.join(root, "missing-executable");
    const spawned = await runCanonicalChild({ suite: "classification", label: "missing-executable", command: missing, args: [], cwd: root, env, timeoutMs: 1000, stdout: quiet, stderr: quiet, log() {} });
    assert.equal(spawned.spawn_error_code, "ENOENT");
    const disposition = deriveOperationalDisposition({ phases: [{ status: "failure", spawn_error_code: spawned.spawn_error_code }], cleanup: true });
    assert.equal(disposition, "infrastructure_interruption");
    finishAttempt(attempt1, { receiptFingerprint: "4".repeat(64), disposition, cleanupComplete: true, infrastructureCode: "ENOENT" });
    assert.throws(() => beginAttempt({ ...request, runId: "cosmetic", head: "5".repeat(40) }));
    assert.throws(() => beginAttempt({ ...request, runId: "unproved" }));
    write(missing, '#!/bin/sh\nexit 0\n'); chmodSync(missing, 0o700);
    const probe = await runCanonicalChild({ suite: "classification", label: "repaired-executable", command: missing, args: [], cwd: root, env, timeoutMs: 1000, stdout: quiet, stderr: quiet, log() {} });
    assert.equal(probe.exit_code, 0); assert(probe.cleanup_completed);
    await new Promise(resolve => setTimeout(resolve, 2));
    const proof = { schema: "augnes.local-canonical-infrastructure-repair.v1", prior_attempt_id: "initial-run", prior_receipt_fingerprint: "4".repeat(64),
      cause: "child_spawn_failure", observed_code: "ENOENT", remedy: "restore_owned_fixture_executable", evidence_sha256: digest(readFileSync(missing)), scope: "task_owned",
      probe: { exit_status: 0, cleanup_complete: true, artifact_sha256: digest(probe), finished_at: new Date().toISOString() } };
    const attempt2 = beginAttempt({ ...request, runId: "recovery-run", recoveryProof: proof });
    assert.equal(attempt2.number, 2); assert.equal(attempt2.prior_attempt_id, "initial-run");
    const completeRecovery = await runPhasesSequentially({ phases: [{ id: "first" }, { id: "second" }], execute: async phase => {
      const result = await runCanonicalChild({ suite: "classification", label: phase.id, command: missing, args: [], cwd: root, env, timeoutMs: 1000, stdout: quiet, stderr: quiet, log() {} });
      return { status: result.exit_code === 0 && !result.cancelled && !result.timed_out && result.cleanup_completed ? "pass" : "failure" };
    } });
    assert.equal(completeRecovery.length, 2); assert(completeRecovery.every(r => r.status === "pass"));
    finishAttempt(attempt2, { receiptFingerprint: "6".repeat(64), disposition: "completed_success", cleanupComplete: true });
    const linked = { attempt: attempt2, repository: { branch: request.branch }, run: { id: "recovery-run" },
      integrity: { content_fingerprint: "6".repeat(64) }, outcome: { disposition: "completed_success" }, cleanup: { completed: true } };
    assert(inspectAttemptRecords({ anchorRoot: root, receipt: linked }));
    assert(!inspectAttemptRecords({ anchorRoot: root, receipt: { ...linked, integrity: { content_fingerprint: "0".repeat(64) } } }));
    const proofPath = path.join(root, "repair.json"), causePath = path.join(root, "cause.json"), probePath = path.join(root, "probe.json");
    write(causePath, JSON.stringify({ prior_receipt_fingerprint: proof.prior_receipt_fingerprint, spawn_error_code: "ENOENT" }));
    write(probePath, JSON.stringify(probe));
    write(proofPath, JSON.stringify({ ...proof, cause_artifact: "cause.json", probe_artifact: "probe.json", evidence_sha256: digest(readFileSync(causePath)), probe: { ...proof.probe, artifact_sha256: digest(readFileSync(probePath)) } }));
    assert.equal(readRecoveryProof(proofPath).cause, "child_spawn_failure");
    write(probePath, "{}"); assert.throws(() => readRecoveryProof(proofPath));
    assert.throws(() => beginAttempt({ ...request, runId: "third", recoveryProof: proof }));
    for (const outcome of ["product_failure", "unclassified_timeout", "safety_violation"]) {
      const req = { ...request, branch: `codex/${outcome}`, runId: outcome };
      const a = beginAttempt(req); finishAttempt(a, { receiptFingerprint: "4".repeat(64), disposition: outcome, cleanupComplete: true });
      assert.throws(() => beginAttempt({ ...req, recoveryProof: { ...proof, prior_attempt_id: outcome } }));
    }
    note("real missing-executable failure and repaired probe permit one linked recovery; product/unknown/safety/cosmetic/third attempts refused");
    const git = (...args) => execFileSync("git", args, { cwd: checkout, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    git("init", "-b", "codex/source-correction"); mkdirSync(path.join(checkout, "scripts"));
    const moduleFile = path.join(checkout, "scripts", "target.mjs"); write(moduleFile, "export const value = 1;\n");
    git("add", "scripts/target.mjs"); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "original source");
    const originalHead = git("rev-parse", "HEAD"), originalTree = git("rev-parse", "HEAD^{tree}");
    const original = beginAttempt({ ...request, branch: "codex/source-correction", head: originalHead, tree: originalTree, runId: "source-original" });
    finishAttempt(original, { receiptFingerprint: "7".repeat(64), disposition: "product_failure", cleanupComplete: true });
    const blockedPredecessors = [];
    for (const disposition of ["unclassified_timeout", "unknown_relevance", "safety_violation"]) {
      const prior = beginAttempt({ ...request, branch: `codex/source-${disposition}`, head: originalHead, tree: originalTree, runId: `source-${disposition}` });
      finishAttempt(prior, { receiptFingerprint: "7".repeat(64), disposition, cleanupComplete: true }); blockedPredecessors.push(prior);
    }
    const correctionRoot = path.join(checkout, ".augnes-local-verification", "correction"); mkdirSync(correctionRoot);
    const fixtureFile = path.join(correctionRoot, "regression.mjs");
    write(fixtureFile, "import assert from 'node:assert/strict'; const m=await import(process.argv[2]); assert.equal(m.value,2);\n");
    const witnesses = {};
    for (const [kind, value] of [["before", 1], ["after", 2]]) {
      if (value === 2) { write(moduleFile, "export const value = 2;\n"); git("add", "scripts/target.mjs"); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "correct value"); }
      const result = await runCanonicalChild({ suite: "classification", label: `source-${kind}`, command: process.execPath, args: [fixtureFile, pathToFileURL(moduleFile).href], cwd: checkout, env, timeoutMs: 2000, stdout: quiet, stderr: quiet, log() {} });
      assert.equal(result.exit_code, kind === "before" ? 1 : 0);
      const record = { fixture_sha256: digest(readFileSync(fixtureFile)), environment_fingerprint: digest(env), source_sha256: digest(readFileSync(moduleFile)), result, node_version: process.versions.node, finished_at: new Date().toISOString() };
      const artifact = `${kind}.json`; write(path.join(correctionRoot, artifact), JSON.stringify(record));
      witnesses[kind] = { artifact, sha256: digest(readFileSync(path.join(correctionRoot, artifact))), source_sha256: record.source_sha256 };
    }
    const correctedHead = git("rev-parse", "HEAD"), correctedTree = git("rev-parse", "HEAD^{tree}");
    const correctionFile = path.join(correctionRoot, "proof.json");
    const correctionProof = { schema: "augnes.local-canonical-source-correction.v1", branch: "codex/source-correction", defect: "wrong_exported_value", prior_family_id: original.family_id,
      prior_number: 1, prior_attempt_id: original.attempt_id, prior_receipt_fingerprint: "7".repeat(64), head: correctedHead, tree: correctedTree, source_module: "scripts/target.mjs",
      fixture_artifact: "regression.mjs", fixture_sha256: digest(readFileSync(fixtureFile)), environment_fingerprint: digest(env), ...witnesses };
    write(correctionFile, JSON.stringify(correctionProof));
    const afterFile = path.join(correctionRoot, correctionProof.after.artifact);
    const originalAfter = readFileSync(afterFile);
    for (const node_version of [`v${process.versions.node}`, "24.18.0", "22.23.4"]) {
      write(afterFile, JSON.stringify({ ...JSON.parse(originalAfter), node_version }));
      write(correctionFile, JSON.stringify({ ...correctionProof,
        after: { ...correctionProof.after, sha256: digest(readFileSync(afterFile)) } }));
      assert.throws(() => readSourceCorrectionProof(correctionFile, checkout), error => error.code === "source_correction_witness_invalid");
    }
    write(afterFile, originalAfter); write(correctionFile, JSON.stringify(correctionProof));
    readSourceCorrectionProof(correctionFile, checkout);
    note("actual witness reader accepts bare Canonical Node and refuses v-prefix, stale baseline and compatibility-only Node");
    for (const prior of blockedPredecessors) {
      write(correctionFile, JSON.stringify({ ...correctionProof, branch: prior.branch, prior_family_id: prior.family_id, prior_attempt_id: prior.attempt_id }));
      assert.throws(() => beginAttempt({ ...request, branch: prior.branch, head: correctedHead, tree: correctedTree, runId: "forbidden-source-successor", sourceCorrection: readSourceCorrectionProof(correctionFile, checkout) }), error => error.code === "source_correction_predecessor_invalid");
    }
    write(correctionFile, JSON.stringify(correctionProof));
    const admittedProof = readSourceCorrectionProof(correctionFile, checkout);
    const successor = beginAttempt({ ...request, branch: correctionProof.branch, head: correctedHead, tree: correctedTree, runId: "corrected-source", sourceCorrection: admittedProof });
    assert.equal(successor.number, 1); assert.equal(successor.source_correction.prior_attempt_id, original.attempt_id);
    finishAttempt(successor, { receiptFingerprint: "8".repeat(64), disposition: "completed_success", cleanupComplete: true });
    const successorReceipt = { ...linked, attempt: successor, repository: { branch: correctionProof.branch }, run: { id: successor.attempt_id }, integrity: { content_fingerprint: "8".repeat(64) } };
    assert(inspectAttemptRecords({ anchorRoot: root, repositoryRoot: checkout, receipt: successorReceipt }));
    assert.throws(() => beginAttempt({ ...request, branch: correctionProof.branch, head: correctedHead, tree: correctedTree, runId: "source-repeat", sourceCorrection: admittedProof }));
    git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-m", "cosmetic wrapper commit");
    write(correctionFile, JSON.stringify({ ...correctionProof, head: git("rev-parse", "HEAD") }));
    assert.throws(() => beginAttempt({ ...request, branch: correctionProof.branch, head: git("rev-parse", "HEAD"), tree: correctedTree, runId: "cosmetic-successor", sourceCorrection: readSourceCorrectionProof(correctionFile, checkout) }));
    write(correctionFile, JSON.stringify(correctionProof)); write(path.join(correctionRoot, "before.json"), "{}");
    assert.throws(() => readSourceCorrectionProof(correctionFile, checkout));
    note("real Git source correction requires identical fail/pass regression, preserves predecessor and refuses repeat/cosmetic forks or changed proof");
    const logs = path.join(checkout, ".augnes-local-verification", "logs"), receipts = path.join(checkout, ".augnes-local-verification", "receipts");
    mkdirSync(logs); mkdirSync(receipts);
    for (const id of ["pinned-old", "active-run", "disposable-old", "newer"]) {
      mkdirSync(path.join(logs, id)); write(path.join(receipts, `${id}.json`), "retained-original");
      utimesSync(path.join(logs, id), id === "newer" ? 2 : 1, id === "newer" ? 2 : 1);
    }
    pinVerificationEvidence({ root: checkout, checkoutOwner, runId: "pinned-old" });
    enforceArtifactRetention({ root: checkout, checkoutOwner, currentRunId: "active-run", receiptMaximum: 2, logMaximum: 2 });
    assert(existsSync(path.join(logs, "pinned-old")) && existsSync(path.join(logs, "active-run")));
    assert(!existsSync(path.join(logs, "disposable-old")));
    assert.equal(readFileSync(path.join(receipts, "pinned-old.json"), "utf8"), "retained-original");
    note("active and pinned originals survive bounded ordinary retention; disposable logs prune");
  } finally { releaseCheckoutVerificationOwnership(checkoutOwner, checkout); }

  const legacy = finalizeReceipt(baseReceipt);
  assert(inspectReceiptForDecision(legacy, validContext).valid_deciding_evidence);
  const receipt = structuredClone(baseReceipt); receipt.receipt_version = 4; receipt.repository.tree_sha = "7".repeat(40);
  receipt.checkout_ownership = { required: true, acquired: true, released: true, checkout_fingerprint: validContext.currentCheckoutFingerprint,
    ownership_id: "9".repeat(32), acquired_at: receipt.run.started_at, released_at: receipt.run.finished_at, failure_code: null };
  write(config, initial);
  const declaration = freezeInputContract({ pathKind: "canonical-conservative-v1", resources: ["codex-preferences", "user-instructions", "auth-location", "git-config", "node-executable"].map(id => ({ id, file: config, classification: "execution" })),
    binding: { head: receipt.repository.head_sha, tree: receipt.repository.tree_sha, executor_fingerprint: receipt.executor.source_fingerprint,
      phase_environment_fingerprints: receipt.phases.map(p => ({ id: p.id, fingerprint: "a".repeat(64) })) } });
  for (const phase of receipt.phases) phase.environment_fingerprint = "a".repeat(64);
  declaration.check(); receipt.inputs = declaration.snapshot();
  receipt.attempt = { contract: "augnes.local-canonical-attempt-family.v1", number: 1, attempt_id: receipt.run.id, head: receipt.repository.head_sha,
    tree: receipt.repository.tree_sha, contract_fingerprint: receipt.inputs.fingerprint, prior_attempt_id: null, recovery: null, budget: { initial: 1, recovery: 1 } };
  receipt.outcome = { disposition: "completed_success", execution: "complete_pass", validity: "valid_within_observed_scope", safety: "preserved_within_observed_scope" };
  validContext.currentAttemptRecordsValid = true;
  validContext.currentInputStateValid = true;
  const passing = finalizeReceipt(receipt);
  assert.deepEqual(inspectReceiptForDecision(passing, validContext).issues, []);
  // Receipt/event reconstruction must select v3 deliberately; relabelling the
  // same new event as legacy cannot acquire the non-consumption interpretation.
  const classified = structuredClone(receipt), observed = remainderChild.evidence;
  classified.verification_context.kind = "isolated-worktree";
  classified.inputs = { ...observed, binding: receipt.inputs.binding,
    resources: receipt.inputs.resources.map(r => r.id === "codex-preferences" ? observed.resources[0] : r) };
  const bindDeclaration = value => {
    const { contract, path_kind, binding, resources } = value.inputs;
    value.inputs.fingerprint = digest({ contract, path_kind, binding, resources });
    value.attempt.contract_fingerprint = value.inputs.fingerprint;
    return finalizeReceipt(value);
  };
  const inputIssues = value => inspectReceiptForDecision(bindDeclaration(value), validContext).issues.filter(i => i.startsWith("receipt_input_"));
  assert.deepEqual(inputIssues(classified), []);
  const oldInterpretation = structuredClone(classified); oldInterpretation.inputs.contract = LEGACY_INPUT_CONTRACT;
  assert(inputIssues(oldInterpretation).includes("receipt_input_event_invalid"));
  const missingSecurity = structuredClone(classified); delete missingSecurity.inputs.resources[0].before.permission_identity;
  assert(inputIssues(missingSecurity).includes("receipt_input_role_invalid"));
  assert(!inspectReceiptForDecision(passing, { ...validContext, currentAttemptRecordsValid: false }).valid_deciding_evidence);
  for (const mutate of [r => { r.inputs.resources = [null]; }, r => { r.inputs.events = [null]; }, r => { r.phases = [null]; },
    r => { r.inputs.binding.phase_environment_fingerprints = [null]; }]) {
    const malformed = structuredClone(receipt); mutate(malformed);
    assert.equal(inspectReceiptForDecision(finalizeReceipt(malformed), validContext).valid_deciding_evidence, false);
  }
  for (const mutate of [r => { r.inputs.fingerprint = "0".repeat(64); }, r => { r.phases.pop(); }, r => { r.phases[0].timed_out = true; },
    r => { r.inputs = null; }, r => { r.phases[0].failure_code = "phase_cancelled"; }, r => { r.cleanup.completed = false; },
    r => { r.phases[0].browser = true; }, r => { r.inputs.binding.tree = "8".repeat(40); }]) {
    const r = structuredClone(receipt); mutate(r);
    assert.equal(inspectReceiptForDecision(finalizeReceipt(r), validContext).valid_deciding_evidence, false);
  }
  const staleContext = structuredClone(validContext); staleContext.currentIntegrationBase.observation.sha = "8".repeat(40);
  const stale = inspectReceiptForDecision(passing, staleContext);
  assert.equal(stale.valid_deciding_evidence, false); assert.equal(stale.dimensions.historical_integrity, "intact");
  assert.equal(stale.dimensions.evidence_validity, "valid_in_recorded_context"); assert.equal(stale.dimensions.current_merge_applicability, "blocked");
  assert(verifyReceiptIntegrity(passing));
  note("real validator refuses missing/mismatched inputs, coverage, Browser, cancellation and cleanup; stale main leaves historical integrity distinct");
  const exported = createPrivateReviewExport(passing);
  assert.equal(inspectPrivateReviewExport(null).structurally_valid, false);
  assert(inspectPrivateReviewExport(exported).structurally_valid);
  assert.equal(inspectPrivateReviewExport(exported).deciding, false);
  assert(!JSON.stringify(exported).includes(root));
  exported.final.result = "tampered"; assert(!inspectPrivateReviewExport(exported).structurally_valid);
  assert.throws(() => createPrivateReviewExport(finalizeReceipt({ ...receipt, credentials: "forbidden" })));
  note("derived export linked to original fingerprint; secret-bearing originals and tampering refuse; no off-host deciding claim");
  const browserFile = path.join(root, "fixture-browser"); write(browserFile, "fixture executable"); chmodSync(browserFile, 0o700);
  const browserAlias = path.join(root, "fixture-browser-alias"); linkSync(browserFile, browserAlias);
  assert.throws(() => observeInputFile(browserFile), "mutable/config observations must still reject a shared inode");
  const executableContract = freezeInputContract({ pathKind: "isolated-model-free-v1", resources: [{ id: "browser-executable", file: browserFile, classification: "execution", readOnlyExecutable: true }], binding: {} });
  assert.equal(executableContract.check(), null);
  const browserUse = beginBrowserUse(browserFile, { consumer: "fixture", repositoryRoot: root, env: {}, emit() {} }); browserUse.version("Fixture/1.0"); browserUse.version("Fixture/1.0", "cdp");
  assert(validBrowserUse(browserUse.finish()));
  const changedBrowser = beginBrowserUse(browserFile, { consumer: "fixture", repositoryRoot: root, env: {}, emit() {} }); changedBrowser.version("Fixture/1.0"); changedBrowser.version("Fixture/1.0", "cdp"); write(browserAlias, "mutated executable");
  assert(!validBrowserUse(changedBrowser.finish()));
  assert.equal(executableContract.check().disposition, "input_invalidation");
  const relinked = freezeInputContract({ pathKind: "isolated-model-free-v1", resources: [{ id: "browser-executable", file: browserFile, classification: "execution", readOnlyExecutable: true }], binding: {} });
  rmSync(browserAlias); assert.equal(relinked.check(), null); assert.equal(relinked.snapshot().events[0].disposition, "incidental_executable_metadata");
  const readerBefore = { ...relinked.snapshot(), resources: relinked.snapshot().resources.map(r => ({ ...r, id: "executable-permissions-reader" })) };
  const readerAfter = { ...readerBefore, resources: readerBefore.resources.map(r => ({ ...r, before: observeInputFile(browserFile, { readOnlyExecutable: true }) })) };
  assert.equal(digest(commonInputResources(readerBefore)), digest(commonInputResources(readerAfter)));
  write(browserFile, "changed reader bytes"); readerAfter.resources[0].before = observeInputFile(browserFile, { readOnlyExecutable: true });
  assert.notEqual(digest(commonInputResources(readerBefore)), digest(commonInputResources(readerAfter)));
  assert.equal(buildPhasePlan({ mode: "full", selectedPlan: "full-canonical" }).length, FULL_PHASE_IDS.length);
  note("read-only shared Browser observes alias metadata and binds bytes; alias mutation refuses; Full phase inventory unchanged");
} finally {
  if (!childInFlight) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  const [cleanup] = cleanupCanonicalTestResources([owner]);
  assert(cleanup.completed, JSON.stringify(cleanup));
}
console.log(JSON.stringify({ status: "pass", contract: "classification-regression-v1", checks: findings, cleanup_complete: true }));
