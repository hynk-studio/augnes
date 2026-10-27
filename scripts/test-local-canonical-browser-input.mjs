import assert from "node:assert/strict";
import { chmodSync, existsSync, linkSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { createBrowserBundleObserver, compareBrowserBundle } from "./local-canonical-browser-bundle.mjs";
import { browserInputEnvironment, selectedBrowserInput, selectBrowserPath, assertSelectedBrowser, acquireBrowserInputGuard, releaseBrowserInputGuard, assertBrowserInputGuard, readBrowserInputBinding, strictBrowserArguments } from "./local-canonical-browser-input.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { beginBrowserUse, validBrowserUse, browserConsumersForPhase } from "./local-canonical-browser-identity.mjs";
import { freezeInputContract, monitorInputContract, digest } from "./local-canonical-inputs.mjs";
import { fixtureBrowser, fixtureWrite, refreshFixtureBinding } from "./fixtures/browser-input-contract.mjs";

const owner = createCanonicalTestResourceRoot("ag-resource-test-");
const root = owner.root, results = [];
let checkoutOwner, guard;
try {
  checkoutOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: root });
  let binding = fixtureBrowser(root), env = browserInputEnvironment(binding);
  const select = input => selectedBrowserInput({ repositoryRoot: root, env: input });
  assert.equal(selectBrowserPath(["/missing"], { repositoryRoot: root, env }), binding.executable);
  for (const key of ["AUGNES_BROWSER_INPUT_CONTRACT", "AUGNES_BROWSER_INPUT_BINDING", "AUGNES_BROWSER_INPUT_FINGERPRINT", "AUGNES_BROWSER_EXECUTABLE_PATH"]) {
    const copy = { ...env }; delete copy[key]; assert.throws(() => select(copy));
  }
  for (const extra of [{ AUGNES_BROWSER_INPUT_CONTRACT: "future" }, { AUGNES_BROWSER_INPUT_BINDING: ".augnes-local-verification/missing.json" },
    { AUGNES_BROWSER_INPUT_BINDING: "../outside" }, { AUGNES_BROWSER_EXECUTABLE_PATH: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" }, { AUGNES_BROWSER_INPUT_FINGERPRINT: "f".repeat(64) }]) assert.throws(() => select({ ...env, ...extra }));
  guard = acquireBrowserInputGuard({ repositoryRoot: root, checkoutOwner, binding, runId: "fixture" });
  assert.throws(() => select({}), /browser_input_binding_missing/);
  assert.throws(() => assertSelectedBrowser("/other", { repositoryRoot: root, env }), /alternate/);
  const child = buildCanonicalChildEnvironment({ temporaryRoot: root, ambientEnvironment: { PATH: process.env.PATH, ...env } });
  for (const key of Object.keys(env)) assert.equal(child[key], env[key]);
  assert.equal(select(child).publicBinding.fingerprint, binding.publicBinding.fingerprint);
  assert.deepEqual(strictBrowserArguments(["--headless=new", "--no-sandbox"], { repositoryRoot: root, env }), ["--headless=new"]);
  results.push("strict controller/child selection, stripped keys/all keys, wrong version/path/hash/alternate and sandbox-disable removal");
  const use = beginBrowserUse(binding.executable, { consumer: "durable-work-surface", repositoryRoot: root, env, emit() {} });
  use.version("Chrome/156.0.8078.47"); use.version("Chrome/156.0.8078.47", "cdp");
  const record = use.finish(), expected = { before: record.before, location_fingerprint: record.location_fingerprint, browser_input: binding.publicBinding };
  assert(validBrowserUse(record, expected));
  for (const mutate of [r => delete r.browser_input_fingerprint, r => r.contract = "augnes.local-canonical-browser-use.v2", r => r.runtime_versions.cdp = "Chrome/1.0", r => r.bundle_after.content_sha256 = "0".repeat(64), r => r.cli_version = "Google Chrome for Testing 1.0.0.0"]) {
    const copy = structuredClone(record); mutate(copy); assert(!validBrowserUse(copy, expected));
  }
  assert.equal(["integration", "e2e-project-experience", "e2e-operator-review-control", "e2e-operator-native-host-execution", "e2e-operator-work-expectation", "e2e-operator-multi-candidate", "e2e-continuity", "e2e-golden"].reduce((sum, id) => sum + Object.values(browserConsumersForPhase(id)).reduce((a, b) => a + b, 0), 0), 19);
  results.push("v3 launch/settlement record, CLI/HTTP/CDP agreement, downgrade and bundle drift refusal, 19-record workload unchanged");
  releaseBrowserInputGuard(guard, { settled: true }); guard = null;
  assert.equal(selectBrowserPath([binding.executable], { repositoryRoot: root, env: {} }), binding.executable);
  results.push("legacy selection outside strict lane retained");

  const data = path.join(binding.root, "Contents/Frameworks/Versions/A/Resources/data"), link = path.join(binding.root, "Contents/Frameworks/Versions/Current");
  const observe = createBrowserBundleObserver(binding.root), original = observe({ force: true });
  const poll = observe(); assert(poll.cost.content_reused); assert.equal(compareBrowserBundle(original.observation, poll.observation), "unchanged");
  fixtureWrite(path.join(root, "unrelated-shared-install"), "replacement");
  assert.equal(compareBrowserBundle(original.observation, observe({ force: true }).observation), "unchanged");
  const changes = [
    ["selected launcher bytes", () => fixtureWrite(binding.executable, "changed executable\n"), () => fixtureWrite(binding.executable, "#!/bin/sh\necho 'Google Chrome for Testing 156.0.8078.47'\n")],
    ["framework bytes", () => fixtureWrite(data, "changed bytes"), () => fixtureWrite(data, "fixture-data")],
    ["addition", () => fixtureWrite(path.join(binding.root, "new-resource"), "new"), () => unlinkSync(path.join(binding.root, "new-resource"))],
    ["deletion", () => renameSync(data, data + ".old"), () => renameSync(data + ".old", data)],
    ["permissions", () => chmodSync(data, 0o400), () => chmodSync(data, 0o600)],
    ["internal link topology", () => { unlinkSync(link); symlinkSync("./A", link); }, () => { unlinkSync(link); symlinkSync("A", link); }],
    ["root identity", () => { renameSync(binding.root, binding.root + ".old"); mkdirSync(binding.root); }, () => { rmSync(binding.root, { recursive: true }); renameSync(binding.root + ".old", binding.root); }],
  ];
  for (const [name, mutate, restore] of changes) {
    const current = observe({ force: true }); mutate();
    let refused = false; try { refused = compareBrowserBundle(current.observation, observe({ force: true }).observation) !== "unchanged"; } catch { refused = true; }
    assert(refused, name); restore(); results.push(`${name} detected`);
  }
  for (const target of ["/Applications/Google Chrome.app", "../../../../../../outside", "Current"]) {
    unlinkSync(link); symlinkSync(target, link); assert.throws(() => observe({ force: true })); unlinkSync(link); symlinkSync("A", link);
  }
  linkSync(data, data + ".alias"); assert.throws(() => observe({ force: true })); unlinkSync(data + ".alias");
  assert.throws(() => observe({ force: true, afterRead: () => fixtureWrite(data, "raced") }), /race/);
  results.push("escaping/dangling/cyclic links, hardlinks and an actual read-window write refused");
  binding = refreshFixtureBinding(root); env = browserInputEnvironment(binding);
  const monitor = freezeInputContract({ resources: [{ id: "browser-bundle", file: binding.root, classification: "execution", browserBundle: true }], pathKind: "isolated-model-free-v1", binding: {} });
  const controller = new AbortController(), active = monitorInputContract(monitor, controller);
  fixtureWrite(data, "changed before unit"); active.check(); active.stop(); assert(controller.signal.aborted); assert(monitor.snapshot().first_fault);
  results.push("production input monitor aborts before any unit/integration/Browser child on bundle change");
  binding = refreshFixtureBinding(root); guard = acquireBrowserInputGuard({ repositoryRoot: root, checkoutOwner, binding, runId: "sentinel" });
  const guardBytes = readFileSync(guard.file); unlinkSync(guard.file); assert.throws(() => assertBrowserInputGuard(guard));
  writeFileSync(guard.file, guardBytes, { mode: 0o600 }); releaseBrowserInputGuard(guard, { settled: true }); guard = null;
  const bindingFile = path.join(root, binding.publicBinding.local_relative_path), originalBinding = readFileSync(bindingFile);
  fixtureWrite(bindingFile, { contract: "future" }); assert.throws(() => readBrowserInputBinding(binding.publicBinding.local_relative_path, root));
  writeFileSync(bindingFile, originalBinding, { mode: 0o600 });
  results.push("missing active sentinel and unknown binding versions refused; only owned fixture bytes restored");
} finally {
  if (guard) releaseBrowserInputGuard(guard, { settled: true });
  if (checkoutOwner) releaseCheckoutVerificationOwnership(checkoutOwner, root, { consumersSettled: true });
  assert(cleanupCanonicalTestResources([owner]).every(r => r.completed));
}
console.log(JSON.stringify({ status: "pass", controls: results, cleanup_complete: true, real_browser_launches: 0 }));
