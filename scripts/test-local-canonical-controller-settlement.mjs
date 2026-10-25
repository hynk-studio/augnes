// The unmodified production acquisition/finally and outer-wrapper blocks run
// against disposable resource/checkout owners and real synchronous children.
// Admission, capacity and installed Companion are ineligible fixture doubles.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, beginCanonicalTestResourceUse,
  settleCanonicalTestResourceUse } from "./canonical-test-environment.mjs";
import { createIsolatedInvocationResources, isolatedInvocationEnvironment, cleanupIsolatedInvocationResources } from "./local-canonical-isolated-resources.mjs";
import { acquireCheckoutVerificationOwnership, assertCheckoutVerificationOwnership,
  releaseCheckoutVerificationOwnership, CHECKOUT_OWNER_FILE } from "./local-canonical-checkout-ownership.mjs";
import { initializeOwnedChildLifecycleFile, inspectOwnedChildLifecycleBytes, readOwnedChildLifecycleFile,
  runOwnedSyncChild, withOwnedSyncLifecycle } from "./test-harness-process-lifecycle.mjs";
import { physicalFingerprint } from "./local-canonical-verification-context.mjs";
import { freezeInputContract, monitorInputContract } from "./local-canonical-inputs.mjs";
import { retainSelectedInputEvidence, retainOwnedChildLifecycleEvidence, inspectRetainedChildLifecycleEvidence } from "./local-canonical-evidence-retention.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceFile = process.argv[2] === "--controller-source" ? path.resolve(process.argv[3])
  : path.join(repositoryRoot, "scripts/run-local-canonical-verification.mjs");
const source = readFileSync(sourceFile, "utf8"), digest = value => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
const start = source.indexOf("  const generatedNextManaged =");
const end = source.indexOf("\n  const serviceLifecycleRestored =", start);
assert(start > 0 && end > start);
const block = source.slice(start, end);
const wrapperStart = source.indexOf("export async function executeLocalCanonicalVerification(options) {");
const wrapperEnd = source.indexOf("\nasync function executeLocalCanonicalVerificationInner", wrapperStart);
assert(wrapperStart > 0 && wrapperEnd > wrapperStart);
const wrapper = source.slice(wrapperStart, wrapperEnd).replace(/^export /u, "");
const historicalSource = readFileSync(path.join(repositoryRoot, "scripts/local-canonical-historical-inputs.mjs"), "utf8");
const historicalBlock = historicalSource.slice(historicalSource.indexOf("export function finishHistoricalInputs("))
  .replace(/^export /u, "");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const originalKill = process.kill;
const cases = [], failures = [];
const expect = (actual, expected, label) => { if (actual !== expected) failures.push({ label, expected, actual }); };
const gone = pid => { assert.throws(() => originalKill(pid, 0), error => error.code === "ESRCH"); };
const scenarios = ["unknown", "settled", "late_unknown", "missing_ledger", "unreadable_ledger", "missing_terminal",
  "checkout_owner_lost", "capacity_owner_lost", "pre_checkout_unknown", "pre_checkout_settled", "historical_unknown", "historical_settled"];

for (const scenario of scenarios) {
  const owner = createCanonicalTestResourceRoot("ag-resource-test-");
  const root = path.join(owner.root, "checkout"); mkdirSync(root);
  const resource = createIsolatedInvocationResources("c".repeat(32));
  const environment = isolatedInvocationEnvironment(resource), privateRoot = path.dirname(environment.HOME);
  const ledger = { file: path.join(environment.HOME, "controller-children.jsonl") };
  Object.assign(ledger, initializeOwnedChildLifecycleFile(ledger.file));
  const backupFile = path.join(environment.HOME, "original-children.jsonl");
  let checkoutOwner = null, cleaned = false, lifecycleReads = 0, observations = 0, phases = 0;
  let changedLedger = false, beforeCleanup = null, cleanupArgument = null, checkoutReleaseArgument = null, capacityReleaseArgument = null;
  let capacityLost = false, originalOwnerBytes = null;
  const historical = scenario.startsWith("historical_");
  let historicalOwner = null, historicalCleaned = false, historicalSnapshot = null, historicalCalls = 0;
  const historicalSnapshots = new WeakMap();
  const inputFile = path.join(environment.HOME, "fixture-input"); writeFileSync(inputFile, "before");
  const emptyFile = path.join(environment.HOME, "empty-config"); writeFileSync(emptyFile, "");
  const binding = { head: "a".repeat(40), tree: "b".repeat(40), executor_fingerprint: "c".repeat(64),
    plan_fingerprint: "d".repeat(64), consumer_map_fingerprint: "e".repeat(64) };
  const helperResults = [];
  const bootstrap = { invocationId: "c".repeat(32), resources: resource, selection: { fixture_only: true },
    consumersSettled: true, cleanupAttempted: false, cleaned: false };
  const ownerFile = path.join(root, ".augnes-local-verification", CHECKOUT_OWNER_FILE);
  const helper = unknown => {
    if (unknown) process.kill = (pid, signal) => {
      if (pid < 0 && signal === 0) throw Object.assign(new Error("fixture group observation unavailable"), { code: "EIO" });
      return originalKill(pid, signal);
    };
    let result;
    try { result = withOwnedSyncLifecycle(ledger, () => runOwnedSyncChild(process.execPath,
      ["-e", "process.stdout.write('actual controller helper')"], { timeout: 1000, encoding: "utf8" })); }
    catch (error) { assert.equal(error.code, "owned_process_observation_unknown"); result = error.result; }
    finally { process.kill = originalKill; }
    assert.equal(result.status, 0); assert.equal(result.error, undefined); helperResults.push(result); return result;
  };
  try {
    // Successful bootstrap uses a real private owner and a fully settled real
    // child before the controller acquires its disposable checkout ownership.
    helper(false); assert.equal(readOwnedChildLifecycleFile(ledger.file, ledger.identity).complete, true);
    const context = {
      bootstrap, checkoutContext: "isolated-worktree", verificationContext: { fixture_only: true }, signal: { aborted: false },
      controller: new AbortController(), plan: { selected_plan: "full-canonical" }, OWNER_TARGETED_PLAN: "owner-targeted",
      preflightIssues: [], phaseDefinitions: [{ id: historical ? "authority" : "synthetic" }], phaseReceipts: [{ id: "synthetic", status: "not_run" }],
      repositoryRoot: root, runLogRoot: path.join(root, ".augnes-local-verification", "logs", "fixture"), runId: "fixture", mode: "changed", host: {}, hostResult: {},
      process: { platform: "darwin", arch: "arm64" }, generatedWindowsHelperRoot: path.join(root, "windows"),
      invocationId: bootstrap.invocationId, headSha: "a".repeat(40), executorFingerprint: "b".repeat(64),
      dependencyMaintenance: null, dependencyMaintenanceRelease: null, serviceLifecycleBefore: null, serviceLifecycleAfter: null,
      serviceObservations: { before: null, after: null }, console: { log() {}, error() {} }, RECEIPT_RETENTION: 20, LOG_RUN_RETENTION: 5,
      managesGeneratedNextState: () => true, requiresCheckoutVerificationOwnership: () => true,
      assertVerificationContext() {}, assertCheckoutVerificationOwnership,
      acquireVerificationCapacity: () => ({ fixture_only: true }),
      assertVerificationCapacity: () => { if (capacityLost) throw Object.assign(new Error(), { code: "verification_capacity_not_owned" }); },
      acquireCheckoutVerificationOwnership: () => {
        if (scenario.startsWith("pre_checkout_")) {
          if (scenario === "pre_checkout_unknown") helper(true);
          throw Object.assign(new Error(), { code: "fixture_checkout_refused" });
        }
        checkoutOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: root });
        originalOwnerBytes = readFileSync(ownerFile, "utf8"); return checkoutOwner;
      },
      verificationAnchorRoot: () => root, enforceArtifactRetention() {}, collectRepositoryIdentity: () => ({ branch: "fixture" }),
      assertSelectedExecution() {}, assertFrozenSource() {},
      ensureBoundedLocalDirectory: (_root, directory) => mkdirSync(directory, { recursive: true, mode: 0o700 }),
      prepareHistoricalInputs() {
        historicalOwner = createCanonicalTestResourceRoot("ag-resource-test-");
        const fixtureSource = path.join(historicalOwner.root, "source"), destination = path.join(historicalOwner.root, "destination");
        mkdirSync(fixtureSource); mkdirSync(destination);
        for (const directory of [fixtureSource, destination]) writeFileSync(path.join(directory, "input"), "historical-fixture");
        historicalSnapshot = { source_fingerprint: physicalFingerprint(fixtureSource), content_fingerprint: digest("historical-fixture") };
        historicalSnapshots.set(historicalSnapshot, { owner: historicalOwner, source: fixtureSource, destination,
          context: { fixture_only: true }, repositoryRoot: root, checkoutOwner });
        beginCanonicalTestResourceUse(historicalOwner); return historicalSnapshot;
      },
      finishHistoricalInputs(snapshot, options) {
        historicalCalls++;
        // Run the exact production finish block. Only its admission-context
        // assertion is fixture-bound; its real helper can append UNKNOWN.
        const dependencies = { snapshots: historicalSnapshots, fail: code => { throw Object.assign(new Error(code), { code }); },
          assertVerificationContext() {
            helper(scenario === "historical_unknown");
            if (scenario === "historical_unknown") throw Object.assign(new Error(), { code: "owned_process_observation_unknown" });
          }, assertCheckoutVerificationOwnership, physicalFingerprint,
          scan: directory => ({ content_fingerprint: digest(readFileSync(path.join(directory, "input"), "utf8")) }),
          settleCanonicalTestResourceUse, cleanupCanonicalTestResources };
        const result = new Function(...Object.keys(dependencies), historicalBlock + "\nreturn finishHistoricalInputs;")(...Object.values(dependencies))(snapshot, options);
        historicalCleaned = result.completed; return result;
      },
      safeErrorCode: error => error.code ?? "fixture_error", generatedNextEntryPresent: () => false, existsSync: () => false,
      selectedExecutionLifecycle() { lifecycleReads++; return readOwnedChildLifecycleFile(ledger.file, ledger.identity); },
      cleanupIsolatedInvocationResources(actualResource, options) {
        assert.equal(actualResource, resource); cleanupArgument = structuredClone(options);
        const originalFile = existsSync(backupFile) ? backupFile : ledger.file;
        // A mode-unreadable ledger is inspected only after the production
        // decision, using the exact pre-change bytes retained by this fixture.
        beforeCleanup = { bytes: changedLedger ? readFileSync(backupFile, "utf8") : readFileSync(originalFile, "utf8"),
          ledger_present: existsSync(ledger.file), ledger_mode: existsSync(ledger.file) ? lstatSync(ledger.file).mode & 0o777 : null };
        try { beforeCleanup.observed = readOwnedChildLifecycleFile(ledger.file, ledger.identity); }
        catch (error) { beforeCleanup.observed = { error_code: error.code }; }
        const result = cleanupIsolatedInvocationResources(actualResource, options); cleaned = result.completed; return result;
      },
      releaseCheckoutVerificationOwnership(actualOwner, actualRoot, options) {
        checkoutReleaseArgument = structuredClone(options);
        return releaseCheckoutVerificationOwnership(actualOwner, actualRoot, options);
      },
      releaseVerificationCapacity(_lease, options) {
        capacityReleaseArgument = structuredClone(options);
        return { released: options.consumersSettled === true, fixture_only: true };
      },
      async inspectCompanionPreservation() {
        observations++;
        if (!changedLedger) helper(scenario === "unknown" || (scenario === "late_unknown" && observations === 2));
        if (observations === 1) {
          if (["missing_ledger", "unreadable_ledger", "missing_terminal"].includes(scenario)) {
            const bytes = readFileSync(ledger.file); writeFileSync(backupFile, bytes, { flag: "wx", mode: 0o600 }); changedLedger = true;
            if (scenario === "missing_ledger") renameSync(ledger.file, path.join(environment.HOME, "missing-original.jsonl"));
            if (scenario === "unreadable_ledger") chmodSync(ledger.file, 0);
            if (scenario === "missing_terminal") writeFileSync(ledger.file, bytes.toString().trimEnd().split("\n").slice(0, -1).join("\n") + "\n");
          }
          if (scenario === "checkout_owner_lost") writeFileSync(ownerFile, JSON.stringify({ ...JSON.parse(originalOwnerBytes), ownership_id: "0".repeat(32) }));
          if (scenario === "capacity_owner_lost") capacityLost = true;
        }
        // The real native observation failure is translated into unavailable,
        // as the checkout-identity reader does. Freeze and phases never begin.
        return { state: { preservation_valid: historical }, diagnostics: { samples: 1 } };
      },
      prepareInvocationInputs() {
        assert(historical, "unexpected input freeze");
        return freezeInputContract({ resources: [{ id: "fixture-input", file: inputFile, classification: "execution" }],
          pathKind: "canonical-conservative-v1", binding });
      },
      monitorInputContract(inputs, controller, options) {
        writeFileSync(inputFile, "actual consumed fixture mutation");
        return monitorInputContract(inputs, controller, options);
      },
      retainSelectedInputEvidence, retainOwnedChildLifecycleEvidence,
      selectedEvidenceBinding: () => binding,
      selectedExecutionRetainedResources: () => [{ id: "fixture-empty-config", kind: "empty-config", file: emptyFile,
        source_generated: true, expected_sha256: digest("") }],
      selectedExecutionLedger: () => ({ file: ledger.file, identity: ledger.identity }),
      runPhasesSequentially() { phases++; throw new Error("unexpected phase"); },
    };
    const result = await new AsyncFunction(...Object.keys(context), block +
      "\nreturn { checkoutConsumersSettled, cleanupComplete, executionFailure, checkoutOwnership, capacityOwnership, inputs, retainedChildren };")(...Object.values(context));
    for (const child of helperResults) gone(child.pid);
    const shouldSettle = ["settled", "pre_checkout_settled", "historical_settled"].includes(scenario);
    const lifecycle = inspectOwnedChildLifecycleBytes(beforeCleanup.bytes);
    const retainedOwner = existsSync(ownerFile), retainedPrivate = existsSync(privateRoot);
    expect(phases, 0, `${scenario}: no phase`); expect(result.inputs === null, !historical, `${scenario}: freeze boundary`);
    expect(result.executionFailure, true, `${scenario}: execution remains failed`);
    expect(lifecycleReads > 0, true, `${scenario}: original ledger checked`);
    expect(cleanupArgument?.consumersSettled, shouldSettle, `${scenario}: private settlement`);
    if (checkoutOwner) expect(checkoutReleaseArgument?.consumersSettled, shouldSettle, `${scenario}: checkout settlement`);
    expect(capacityReleaseArgument?.consumersSettled, shouldSettle, `${scenario}: capacity settlement`);
    expect(bootstrap.cleaned, shouldSettle, `${scenario}: bootstrap cleaned`);
    expect(retainedPrivate, !shouldSettle, `${scenario}: original private root retained`);
    if (checkoutOwner) expect(retainedOwner, !shouldSettle, `${scenario}: owner retained`);
    const retainedLedger = retainedPrivate && existsSync(ledger.file) && scenario !== "unreadable_ledger" ? readFileSync(ledger.file, "utf8") : null;
    if (["unknown", "late_unknown"].includes(scenario)) expect(retainedLedger, beforeCleanup.bytes, `${scenario}: UNKNOWN bytes unchanged`);
    let retainedLifecycle = null;
    if (historical) {
      expect(historicalCalls, 1, `${scenario}: historical finish runs once`);
      retainedLifecycle = inspectRetainedChildLifecycleEvidence({ root, descriptor: result.retainedChildren, expectedBinding: binding });
      expect(retainedLifecycle.lifecycle?.started_count, lifecycle.started_count, `${scenario}: all late starts retained`);
      expect(retainedLifecycle.lifecycle?.unknown_count, lifecycle.unknown_count, `${scenario}: late UNKNOWN retained`);
      expect(retainedLifecycle.lifecycle?.content_sha256, lifecycle.content_sha256, `${scenario}: retained final original bytes`);
    }
    cases.push({ scenario, production_eligible: false, lifecycle_reads: lifecycleReads, phases,
      actual_helpers: helperResults.map(child => ({ pid: child.pid, status: child.status, signal: child.signal, error: child.error?.code ?? null })),
      original_lifecycle: lifecycle, original_ledger_utf8: beforeCleanup.bytes, retained_ledger_utf8: retainedLedger,
      observed_lifecycle_before_cleanup: beforeCleanup.observed,
      ledger_mode_before_cleanup: beforeCleanup.ledger_mode, private_preserved: retainedPrivate, checkout_owner_preserved: retainedOwner,
      original_checkout_owner_utf8: originalOwnerBytes, retained_checkout_owner_utf8: retainedOwner ? readFileSync(ownerFile, "utf8") : null,
      cleanup_argument: cleanupArgument, checkout_release_argument: checkoutReleaseArgument, capacity_release_argument: capacityReleaseArgument,
      historical_cleanup_calls: historicalCalls, retained_lifecycle: retainedLifecycle,
      bootstrap: { consumersSettled: bootstrap.consumersSettled, cleanupAttempted: bootstrap.cleanupAttempted, cleaned: bootstrap.cleaned },
      result: { ...result, inputs: result.inputs?.snapshot() ?? null } });
  } finally {
    process.kill = originalKill;
    for (const child of helperResults) gone(child.pid);
    // Preserve original evidence above. This separate fixture-only cleanup
    // follows actual ESRCH proof and never changes a lifecycle event to PASS.
    if (!cleaned) {
      if (existsSync(ledger.file)) chmodSync(ledger.file, 0o600);
      assert.equal(cleanupIsolatedInvocationResources(resource, { consumersSettled: true }).completed, true);
    }
    if (historicalOwner && !historicalCleaned) {
      settleCanonicalTestResourceUse(historicalOwner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
      assert.equal(cleanupCanonicalTestResources([historicalOwner])[0].completed, true);
    }
    assert.equal(cleanupCanonicalTestResources([owner])[0].completed, true);
  }
}

// A cleanup-attempt marker cannot suppress the wrapper's original-ledger
// observation when a pre-acquisition/inner exception leaves private state.
for (const cleanupAttempted of [false, true]) {
  const resource = createIsolatedInvocationResources("d".repeat(32));
  const env = isolatedInvocationEnvironment(resource), ledger = { file: path.join(env.HOME, "wrapper.jsonl") };
  Object.assign(ledger, initializeOwnedChildLifecycleFile(ledger.file));
  let reads = 0, cleanupCalls = 0, bootstrapSeen, child, predecessor;
  try {
    const context = {
      process: { env: {} }, randomBytes: () => Buffer.alloc(16), repositoryRoot: "production-ineligible-fixture",
      createIsolatedInvocationResources: () => resource, isolatedInvocationSelection: () => ({ fixture_only: true }),
      withSelectedExecution: (_selection, callback) => callback(),
      async executeLocalCanonicalVerificationInner({ bootstrap }) {
        bootstrapSeen = bootstrap;
        withOwnedSyncLifecycle(ledger, () => { child = runOwnedSyncChild(process.execPath, ["-e", "process.exit(0)"], { timeout: 1000 }); });
        // Preserve a real started child's original incomplete record, without
        // manufacturing a terminal. The fixture retains the full predecessor.
        const bytes = readFileSync(ledger.file, "utf8");
        predecessor = bytes;
        writeFileSync(ledger.file, bytes.trimEnd().split("\n").slice(0, -1).join("\n") + "\n");
        bootstrap.cleanupAttempted = cleanupAttempted;
        throw Object.assign(new Error("fixture before acquisition"), { code: "fixture_before_acquisition" });
      },
      selectedExecutionLifecycle() { reads++; return readOwnedChildLifecycleFile(ledger.file, ledger.identity); },
      cleanupIsolatedInvocationResources(actual, options) { cleanupCalls++; return cleanupIsolatedInvocationResources(actual, options); },
    };
    let error;
    try { await new AsyncFunction(...Object.keys(context), wrapper + "\nreturn executeLocalCanonicalVerification({ checkoutContext: 'isolated-worktree' });")(...Object.values(context)); }
    catch (caught) { error = caught; }
    gone(child.pid);
    expect(reads > 0, true, `wrapper-${cleanupAttempted}: original ledger checked`);
    expect(bootstrapSeen.consumersSettled, false, `wrapper-${cleanupAttempted}: incomplete refused`);
    assert(existsSync(ledger.file));
    cases.push({ scenario: `wrapper_cleanup_attempted_${cleanupAttempted}`, reads, cleanupCalls,
      error_code: error?.code, ledger_predecessor_utf8: predecessor, ledger_original_utf8: readFileSync(ledger.file, "utf8"), private_preserved: true });
  } finally {
    if (child) gone(child.pid);
    assert.equal(cleanupIsolatedInvocationResources(resource, { consumersSettled: true }).completed, true);
  }
}
console.log(JSON.stringify({ test: "controller-pre-freeze-settlement", production_eligible: false,
  source_sha256: digest(source), block_sha256: digest(block), wrapper_sha256: digest(wrapper),
  historical_finish_sha256: digest(historicalBlock),
  expectations_sha256: digest({ scenarios, rule: "ledger_and_ownership_before_cleanup_and_release", wrapperMarkers: [false, true] }),
  cases, failures, fixture_cleanup_completed: true, real_admission: "NOT_RUN", real_capacity: "NOT_RUN" }));
assert.deepEqual(failures, [], "every original selected controller ledger governs cleanup and owner release");
