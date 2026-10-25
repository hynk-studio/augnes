// Thirty-second development control: real source readers, no native/provider
// execution, real admission, capacity allocation or production deciding stock.
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, beginCanonicalTestResourceUse,
  settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { selectNativeConfigurationInputs, inheritSelectedExecutionEnvironment } from "./local-canonical-selected-execution.mjs";
import { codexConfigurationFiles, observeNativeConfigurationInput, nativeConfigurationFixtureRoot,
  selectedNativeFixtureRoots, NATIVE_FIXTURE_ROOTS_ENV } from "../lib/vnext/native-host/codex-configuration-sources.mjs";
import { freezeInputContract, digest, classifyInputChange } from "./local-canonical-inputs.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { retainSelectedInputEvidence, retainOwnedChildLifecycleEvidence, inspectRetainedSelectedInputs } from "./local-canonical-evidence-retention.mjs";
import { initializeOwnedChildLifecycleFile, appendOwnedChildLifecycleEvent } from "./test-harness-process-lifecycle.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { loadNativePreparation, loadReviewedInventory, fixtureManifest } from "./fixtures/local-canonical-native-configuration-reader.mjs";

const started = Date.now(), owner = createCanonicalTestResourceRoot("ag-resource-test-"), root = owner.root;
const implementationRoot = fileURLToPath(new URL("../", import.meta.url));
const runId = `native-configuration-${process.pid}-${Date.now()}`;
const evidenceRoot = path.join(implementationRoot, ".augnes-local-verification/1530-correction/f3", runId);
const externalDirectory = path.join(root, ".codex"), external = path.join(externalDirectory, "config.toml");
const environment = buildCanonicalChildEnvironment({ temporaryRoot: root });
const binding = { head: "1".repeat(40), tree: "2".repeat(40), executor_fingerprint: "3".repeat(64),
  plan_fingerprint: "4".repeat(64), consumer_map_fingerprint: "5".repeat(64) };
const results = [], children = [];
const reviewedIndex = process.argv.indexOf("--reviewed-source-directory");
const reviewedDirectory = reviewedIndex < 0 ? null : path.resolve(process.argv[reviewedIndex + 1]);
let checkoutOwner, activeChild = false;
const write = (file, content) => writeFileSync(file, content, { mode: 0o600 });
function setup(label) {
  const privateRoot = path.join(root, label), home = path.join(privateRoot, "home"), codexHome = path.join(home, ".codex");
  const sourceRoot = path.join(privateRoot, "source"), snapshotRoot = path.join(privateRoot, "snapshot");
  for (const directory of [privateRoot, home, codexHome, sourceRoot, snapshotRoot]) mkdirSync(directory, { mode: 0o700 });
  const selection = selectNativeConfigurationInputs({ privateRoot, environment: { HOME: home } });
  const manifest = fixtureManifest(privateRoot, selection), native = loadNativePreparation(manifest.environment);
  const resources = [{ ...manifest.resource }, ...selection.external_sources.map(({ before, ...resource }) => resource)];
  const contract = freezeInputContract({ resources, pathKind: "isolated-model-free-v1", binding: {
    ...binding, phase_inventory: binding.plan_fingerprint, selected_execution: { consumer_map_fingerprint: binding.consumer_map_fingerprint } } });
  return { privateRoot, home, codexHome, sourceRoot, snapshotRoot, selection, manifest, native, resources, contract };
}
async function child(label, args, onLifecycle) {
  let output = "", error = ""; activeChild = true;
  const result = await runCanonicalChild({ suite: "native-configuration", label, command: process.execPath, args, cwd: implementationRoot,
    env: environment, timeoutMs: 5000, onLifecycle, stdout: { write: value => { output += value; } }, stderr: { write: value => { error += value; } }, log() {} });
  children.push({ label, result }); activeChild = !result.cleanup_completed || !result.exit_observed || !result.streams_closed || result.remaining_owned_processes !== 0;
  assert.equal(canonicalChildAcceptanceFailure(result, { suite: "native-configuration", timeoutMs: 5000, requireNaturalExit: true }), null, error);
  return output;
}
beginCanonicalTestResourceUse(owner);
try {
  mkdirSync(evidenceRoot, { recursive: true, mode: 0o700 }); mkdirSync(externalDirectory, { mode: 0o700 });
  const absent = setup("absent");
  assert(codexConfigurationFiles(absent.codexHome, [absent.sourceRoot, absent.snapshotRoot]).includes("/etc/codex/config.toml"));
  assert(absent.selection.external_sources.some(r => r.file === external && r.before.present === false));
  const absentLaunch = absent.native.prepare(absent); absentLaunch.assert_sources_current();
  assert.equal(absent.contract.check({ force: true }), null);
  let reviewed;
  if (reviewedDirectory) {
    const previousNative = loadNativePreparation(absent.manifest.environment, path.join(reviewedDirectory, "codex-scoped-task.ts"));
    const previousLaunch = previousNative.prepare(absent); previousLaunch.assert_sources_current();
    const inventory = loadReviewedInventory(reviewedDirectory, root, absent.manifest.resource);
    assert.equal(inventory.resources.some(resource => resource.file === external), false);
    reviewed = { ...inventory, native_source_sha256: previousNative.source_sha256,
      contract: freezeInputContract({ resources: inventory.resources, pathKind: "isolated-model-free-v1", binding: { fixture: "reviewed-inventory" } }) };
  }
  // A fresh file after the native assertion was invisible to the old outer
  // inventory; the same data now triggers the production outer safety latch.
  write(external, 'model="fixture-created"\n');
  assert.equal(absent.contract.check({ force: true }).disposition, "safety_violation");
  if (reviewed) {
    assert.equal(reviewed.contract.check({ force: true }), null, "unchanged reviewed production inventory misses the newly present source");
    results.push({ label: "reviewed-inventory-omission-contrast", old_outer_fault: reviewed.contract.snapshot().first_fault,
      corrected_outer_fault: absent.contract.snapshot().first_fault, executor_sha256: reviewed.executor_sha256,
      selector_sha256: reviewed.selector_sha256, native_source_sha256: reviewed.native_source_sha256 });
  }
  assert.throws(() => absentLaunch.assert_sources_current(), /native_configuration_external_changed/u);
  rmSync(external); assert(absent.contract.snapshot().first_fault);
  results.push({ label: "absent-to-present-after-native-assert", fault: absent.contract.snapshot().first_fault });
  rmSync(absent.privateRoot, { recursive: true });

  const originalContent = 'model="fixture-original"\n[shell_environment_policy.set]\nPRIVATE_FIXTURE_VALUE="must-not-be-retained"\n';
  write(external, originalContent);
  const latePresent = setup("late-present"); latePresent.native.prepare(latePresent).assert_sources_current();
  assert.equal(latePresent.contract.check({ force: true }), null);
  write(external, 'model="fixture-late-change"\n');
  assert.equal(latePresent.contract.check({ force: true }).disposition, "safety_violation");
  results.push({ label: "present-content-change-after-native-assert-before-outer-completion", fault: latePresent.contract.snapshot().first_fault });
  rmSync(latePresent.privateRoot, { recursive: true }); write(external, originalContent);
  const present = setup("present"), launch = present.native.prepare(present);
  launch.assert_sources_current(); assert.equal(present.contract.check({ force: true }), null);
  assert(present.native.reads.includes(external), "the actual bounded native reader consumed the fixture ancestor config");
  assert.equal(JSON.stringify(present.selection).includes("must-not-be-retained"), false);
  const privateConfig = path.join(present.codexHome, "config.toml");
  write(privateConfig, 'model="owned-one"\n'); present.native.prepare(present).assert_sources_current();
  write(privateConfig, 'model="owned-two"\n'); present.native.prepare(present).assert_sources_current();
  assert.equal(present.contract.check({ force: true }), null, "mutable fixture config is not frozen external authority");
  results.push({ label: "unchanged-present-and-owned-mutable-config", native_reader_observed: true });

  const sibling = path.join(root, "child-owned"); mkdirSync(sibling, { mode: 0o700 });
  const childEnvironment = inheritSelectedExecutionEnvironment(present.manifest.environment, { AUGNES_CANONICAL_TEMP_ROOT: sibling });
  const roots = selectedNativeFixtureRoots(childEnvironment, present.selection);
  assert(roots.some(r => r.root === sibling));
  const childSelection = selectNativeConfigurationInputs({ privateRoot: sibling, environment: { HOME: path.join(sibling, "home") },
    inherited: present.manifest.manifest, inheritedEnvironment: childEnvironment });
  assert.deepEqual(childSelection.external_sources, present.selection.external_sources);
  assert.throws(() => inheritSelectedExecutionEnvironment(present.manifest.environment, { AUGNES_CANONICAL_TEMP_ROOT: root }), /parent_inventory_changed/u);
  const forged = { ...present.manifest.environment, [NATIVE_FIXTURE_ROOTS_ENV]: JSON.stringify({
    selection_fingerprint: present.manifest.environment.AUGNES_CANONICAL_SELECTED_INPUTS_SHA256,
    roots: [...present.selection.fixture_roots, nativeConfigurationFixtureRoot(root)] }) };
  assert.throws(() => selectedNativeFixtureRoots(forged, present.selection), /parent_inventory_changed/u);
  const unselected = path.join(root, "not-selected"); mkdirSync(unselected, { mode: 0o700 });
  const refusingNative = loadNativePreparation(present.manifest.environment);
  assert.throws(() => refusingNative.prepare({ ...present, sourceRoot: unselected }), /source_unselected/u);
  assert.equal(refusingNative.reads.length, 0, "original source-root refusal precedes native file reads");
  assert.throws(() => refusingNative.prepare({ ...present, snapshotRoot: unselected }), /source_unselected/u);
  assert.equal(refusingNative.reads.length, 0, "snapshot-root refusal precedes native file reads");
  results.push({ label: "nested-parent-propagation-no-recast-and-original-root-refusal" });

  const missingAncestor = path.join(root, "missing-parent", ".codex", "config.toml");
  const missingBefore = observeNativeConfigurationInput(missingAncestor);
  mkdirSync(path.dirname(path.dirname(missingAncestor)), { mode: 0o700 });
  assert.equal(classifyInputChange(missingBefore, observeNativeConfigurationInput(missingAncestor), { classification: "safety", nativeConfiguration: true }), "safety_violation");
  const alias = path.join(root, "config-alias"); symlinkSync(path.join(root, "not-created"), alias);
  assert.throws(() => observeNativeConfigurationInput(path.join(alias, "config.toml")), /ancestor_unsafe/u);
  const fileAlias = path.join(root, "dangling-config"); symlinkSync(path.join(root, "not-created"), fileAlias);
  assert.throws(() => observeNativeConfigurationInput(fileAlias), /file_unsafe/u);
  results.push({ label: "absent-ancestry-and-dangling-alias-refusals" });

  checkoutOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: root });
  const logs = path.join(root, ".augnes-local-verification/logs/f3-original"); mkdirSync(logs, { recursive: true, mode: 0o700 });
  const selected = retainSelectedInputEvidence({ root, checkoutOwner, runId: "f3-original", binding, resources: [present.manifest.resource] });
  const ledgerFile = path.join(root, "fixture-child-ledger.jsonl"), ledger = initializeOwnedChildLifecycleFile(ledgerFile);
  await child("retained fixture producer", ["-e", "process.exit(0)"], event => appendOwnedChildLifecycleEvent(ledgerFile, ledger.identity, event));
  const retainedChildren = retainOwnedChildLifecycleEvidence({ root, checkoutOwner, runId: "f3-original", binding, file: ledgerFile, identity: ledger.identity });
  const receipt = { repository: { head_sha: binding.head, tree_sha: binding.tree }, executor: { source_fingerprint: binding.executor_fingerprint },
    inputs: present.contract.snapshot(), selected_inputs: selected, owned_children: retainedChildren,
    outcome: { fixture_only: true, recorded_external_state: "unchanged" } };
  const receiptFile = path.join(root, "fixture-receipt.json"); write(receiptFile, JSON.stringify(receipt));
  // Normal runtime cleanup leaves the original retained observation evidence.
  rmSync(present.privateRoot, { recursive: true });
  assert.equal(inspectRetainedSelectedInputs({ root, descriptor: selected, expectedBinding: binding }).valid, true);
  const requestFile = path.join(root, "cold-request.json"), reader = fileURLToPath(new URL("./fixtures/local-canonical-native-configuration-reader.mjs", import.meta.url));
  for (const expected_valid of [true, false]) {
    if (!expected_valid) write(external, 'model="fixture-changed-after-native-assert"\n');
    write(requestFile, JSON.stringify({ fixture_identity: "production-ineligible-native-configuration", root, binding, receipt_file: receiptFile, expected_valid }));
    results.push({ label: expected_valid ? "fresh-unchanged-after-runtime-cleanup" : "fresh-changed-external-after-native-assert", ...JSON.parse(await child("fresh native input reader", [reader, requestFile])) });
  }
  assert.deepEqual(JSON.parse(readFileSync(receiptFile, "utf8")), receipt);
  // Keep the original nonsecret observations in development evidence as well.
  write(path.join(evidenceRoot, "original-receipt.json"), JSON.stringify(receipt, null, 2));
  write(path.join(evidenceRoot, "retained-manifest-copy.json"), readFileSync(path.join(logs, "selected-inputs/selected-execution-manifest.input")));
  assert.equal(readFileSync(path.join(evidenceRoot, "retained-manifest-copy.json"), "utf8").includes("must-not-be-retained"), false);
  const report = { fixture_identity: "production-ineligible-native-configuration", production_eligible: false,
    native_source_sha256: present.native.source_sha256, elapsed_ms: Date.now() - started, node: process.versions.node, results, children,
    limitation: "source-block preparation/current collector; no production admission, deciding receipt or native executable; retained-original reader checks occurred after private runtime cleanup and before disposable fixture cleanup" };
  assert(report.elapsed_ms < 30_000); write(path.join(evidenceRoot, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  if (checkoutOwner) releaseCheckoutVerificationOwnership(checkoutOwner, root, { consumersSettled: !activeChild });
  if (!activeChild) {
    settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    const [cleanup] = cleanupCanonicalTestResources([owner]); assert.equal(cleanup.completed, true, JSON.stringify(cleanup));
  }
}
