#!/usr/bin/env node
// Explicit development evidence, never qualification admission. The normal
// phase definitions, input capability and bounded process/resource owners do
// the work; no receipt is added to the real attempt ledger.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { chooseBrowserPorts } from "./browser-preferred-ports.mjs";
import { admitVerificationContext } from "./local-canonical-verification-context.mjs";
import { collectHostEnvironment } from "./local-canonical-environment.mjs";
import { acquireVerificationCapacity, releaseVerificationCapacity } from "./local-canonical-capacity.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { createIsolatedInvocationResources, cleanupIsolatedInvocationResources } from "./local-canonical-isolated-resources.mjs";
import { observeCanonicalRuntimeInputs, observePreparedDependencyInputs, comparePreparedDependencyInputs, digest } from "./local-canonical-inputs.mjs";
import { observePureContractSource, observePureContractLoader } from "./local-canonical-pure-contract-witness.mjs";
import { finalizeReceipt } from "./local-canonical-receipt.mjs";
import { inspectCurrentIntegrationBudgetInputs } from "./local-canonical-fixture-budget-witness.mjs";
import { inspectGeneratedStockBrowserInputs } from "./local-canonical-stock-lifecycle-witness.mjs";
import { observeGitRevisionTarget, phaseEnvironment, buildPhasePlan, executePhase, runPhasesSequentially,
  prepareInvocationInputs, computeExecutorSourceFingerprint, removeBoundedGeneratedNextState } from "./run-local-canonical-verification.mjs";
import { AUXILIARY_EXECUTION_BUDGETS } from "./local-canonical-closeout-budgets.mjs";

const root = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const natural = r => r.exit_code === 0 && r.signal === null && !r.timed_out && !r.cancelled &&
  r.exit_observed && r.streams_closed && r.cleanup_completed && r.remaining_owned_processes === 0 && r.termination_reason === "natural_exit";

if (process.argv[2] === "--inspect") {
  const packet = JSON.parse(readFileSync(process.argv[3], "utf8"));
  const reader = process.argv[4] ? (await import(pathToFileURL(process.argv[4]).href)).inspectCurrentIntegrationBudgetInputs : inspectCurrentIntegrationBudgetInputs;
  let result = "accepted";
  try { reader(root, packet.witness, packet.receipt); inspectGeneratedStockBrowserInputs(root, packet.web); }
  catch (error) { if (error.code !== "revision_fixture_budget_invalid") throw error; result = error.code; }
  assert.equal(result, packet.expected);
  console.log(JSON.stringify({ basis: "non-deciding actual development phase records", result, pid: process.pid }));
} else {
  await capture();
}

async function capture() {
  const [directory, baseline, base, ...extra] = process.argv.slice(2);
  assert.equal(extra.length, 0); assert.match(baseline ?? "", /^[a-f0-9]{40}$/u); assert.match(base ?? "", /^[a-f0-9]{40}$/u);
  assert.equal(realpathSync(process.cwd()), root);
  const out = realpathSync(directory), git = args => execFileSync("git", ["--no-replace-objects", ...args], { cwd: root, timeout: 10000, maxBuffer: 16 * 1024 * 1024 });
  const save = (name, value) => { const raw = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n");
    writeFileSync(path.join(out, name), raw, { flag: "wx", mode: 0o600 }); return { artifact: name, sha256: digest(raw) }; };
  assert(!existsSync(path.join(out, "capture.json")));
  const context = admitVerificationContext({ repositoryRoot: root, kind: "isolated-worktree" }), host = collectHostEnvironment(root);
  const invocationId = randomBytes(16).toString("hex"), runtime = observeCanonicalRuntimeInputs();
  const head = git(["rev-parse", "HEAD"]).toString().trim();
  const phases = buildPhasePlan({ mode: "full", selectedPlan: "full-canonical", baseSha: base, headSha: head });
  const controller = new AbortController();
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => controller.abort());
  let lease, owner, resources, caseResources, inputs, activeInputs, activeResources, environment, before, after, cleanup, ownership, error, settled = true;
  const preparations = [], cases = [], sourceOverlay = [], outputs = [], lifecycle = [], children = [], phaseLogs = [], executedPhases = [];
  let outputBytes = 0, truncated = false;
  const sink = { write(chunk) {
    const buffer = Buffer.from(chunk), remaining = 2 * 1024 * 1024 - outputBytes;
    if (remaining > 0) outputs.push(buffer.subarray(0, remaining));
    outputBytes += buffer.length;
    if (outputBytes > 2 * 1024 * 1024) { truncated = true; controller.abort(); }
  } };
  const observe = async () => ({ source: observePureContractSource(root), loader: observePureContractLoader(root), runtime: observeCanonicalRuntimeInputs(),
    dependencies: observePreparedDependencyInputs({ repositoryRoot: root, phaseId: "dependencies-root" }),
    web_dependencies: observePreparedDependencyInputs({ repositoryRoot: root, phaseId: "dependencies-web-planning" }),
    target: await observeGitRevisionTarget(context, host.browserExecutablePath, runtime) });
  const declared = name => {
    const file = path.join(root, "next-env.d.ts"), stat = lstatSync(file, { bigint: true });
    assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1n && stat.uid === BigInt(process.getuid()) && (stat.mode & 0o022n) === 0n && stat.size <= 1024n && realpathSync(file) === file);
    const bytes = readFileSync(file), after = lstatSync(file, { bigint: true });
    assert(["dev", "ino", "uid", "gid", "mode", "size", "nlink", "mtimeNs", "ctimeNs"].every(key => stat[key] === after[key]));
    return { sha256: digest(bytes), bytes: bytes.length, content: save(name + "-declaration.log", bytes),
      mtime_ns: String(stat.mtimeNs), ctime_ns: String(stat.ctimeNs), mode: Number(stat.mode), links: Number(stat.nlink), uid: Number(stat.uid) };
  };
  const child = async (label, args, options = {}) => {
    const previousSettlement = settled; settled = false;
    const id = children.length, stdout = [], stderr = [], lines = [], start = new Date().toISOString();
    const { stdout: destinationOut = sink, stderr: destinationError = sink, ...settings } = options;
    let retained = 0;
    const retain = (chunks, destination) => ({ write(chunk) {
      const buffer = Buffer.from(chunk), remaining = 2 * 1024 * 1024 - retained;
      if (remaining > 0) chunks.push(buffer.subarray(0, remaining)); retained += buffer.length; destination.write(buffer);
      if (retained > 2 * 1024 * 1024) { truncated = true; controller.abort(); }
    } });
    const result = await runCanonicalChild({ suite: "verifier-lifecycle-development", label, command: process.execPath, args, cwd: root,
      env: environment, timeoutMs: 60000, signal: controller.signal, ...settings,
      stdout: retain(stdout, destinationOut), stderr: retain(stderr, destinationError), log: line => { lifecycle.push(line); lines.push(line); } });
    settled = previousSettlement && result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
    children.push({ id, label, args, command: ["node", ...args].join(" "), cwd_scope: "root", environment_fingerprint: digest(settings.env ?? environment),
      timeout_ms: settings.timeoutMs ?? 60000, started_at: start, finished_at: new Date().toISOString(), result,
      stdout: save(`child-${id}-stdout.log`, Buffer.concat(stdout)), stderr: save(`child-${id}-stderr.log`, Buffer.concat(stderr)),
      lifecycle: save(`child-${id}-lifecycle.log`, lines.join("\n") + "\n") });
    return result;
  };
  const started_at = new Date().toISOString();
  try {
    lease = acquireVerificationCapacity({ context, host: host.public, invocationId });
    owner = acquireCheckoutVerificationOwnership({ repositoryRoot: root });
    resources = createIsolatedInvocationResources(invocationId);
    environment = phaseEnvironment({ isolatedResources: resources, browserExecutablePath: host.browserExecutablePath, runtimeInputs: runtime });
    inputs = prepareInvocationInputs({ verificationContext: context, isolatedResources: resources, browserExecutablePath: host.browserExecutablePath,
      runtimeInputs: runtime, headSha: head, executorFingerprint: computeExecutorSourceFingerprint(root), phaseDefinitions: phases });
    activeInputs = inputs; activeResources = resources;
    const expected = new Map(phases.filter(p => p.id.startsWith("dependencies-")).map(p => [p.id, observePreparedDependencyInputs({ repositoryRoot: root, phaseId: p.id })]));
    const execute = async (phase, suffix) => {
      assert.equal(activeInputs.check({ force: true }), null);
      const previousSettlement = settled; settled = false;
      const result = await executePhase({ phase, mode: "development", runLogRoot: path.join(root, ".augnes-local-verification/logs", `verifier-${invocationId}-${suffix}`),
        browserExecutablePath: host.browserExecutablePath, runtimeInputs: runtime, isolatedResources: activeResources, signal: controller.signal, invocationId });
      settled = previousSettlement && result.cleanup.completed && result.cleanup.exit_observed && result.cleanup.streams_closed && result.cleanup.remaining_owned_processes === 0;
      executedPhases.push({ sequence: suffix, result });
      const rawLog = readFileSync(path.join(root, result.log.relative_path));
      assert.equal(rawLog.length, result.log.bytes); assert.equal(result.log.truncated, false);
      phaseLogs.push({ relative_path: result.log.relative_path, ref: save(`${suffix}-${phase.id}.log`, rawLog) });
      return result;
    };
    for (const phase of phases.filter(p => p.id.startsWith("dependencies-"))) {
      const result = await execute(phase, "preparation"), prepared = { phase: phase.id, result, expected: expected.get(phase.id), inputs: null };
      preparations.push(prepared); assert.equal(result.status, "pass");
      const observation = inputs.prepareDependencies({ repositoryRoot: root, phaseId: phase.id, prerequisite: expected.get(phase.id) });
      prepared.inputs = observation;
      assert.equal(comparePreparedDependencyInputs(expected.get(phase.id), observation), "unchanged");
    }
    before = await observe();
    // A bounded module capsule uses the genuine predecessor reader and its
    // complete local import graph. Candidate-only exports cannot be borrowed
    // into that graph. The driver and inspected checkout stay at this head.
    const capsule = path.join(environment.AUGNES_CANONICAL_TEMP_ROOT, "prior-reader"), copied = new Set();
    const copy = file => {
      if (copied.has(file)) return; copied.add(file);
      const bytes = git(["show", baseline + ":" + file]);
      const target = path.join(capsule, file); mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, bytes, { mode: 0o600 });
      sourceOverlay.push({ path: file, sha256: digest(bytes), basis: baseline });
      for (const match of bytes.toString().matchAll(/(?:from\s*|import\s*)["'](\.[^"']+\.mjs)["']/gu)) copy(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
    };
    copy("scripts/local-canonical-fixture-budget-witness.mjs"); symlinkSync(path.join(root, "node_modules"), path.join(capsule, "node_modules"));
    const priorReader = path.join(capsule, "scripts/local-canonical-fixture-budget-witness.mjs");
    for (const name of ["stopped-before-build", "through-build"]) {
      removeBoundedGeneratedNextState({ root, checkoutOwner: owner });
      caseResources = createIsolatedInvocationResources(randomBytes(16).toString("hex")); activeResources = caseResources;
      const caseEnvironment = phaseEnvironment({ isolatedResources: caseResources, browserExecutablePath: host.browserExecutablePath, runtimeInputs: runtime });
      activeInputs = prepareInvocationInputs({ verificationContext: context, isolatedResources: caseResources, browserExecutablePath: host.browserExecutablePath,
        runtimeInputs: runtime, headSha: head, executorFingerprint: computeExecutorSourceFingerprint(root), phaseDefinitions: phases });
      for (const phase of preparations) activeInputs.prepareDependencies({ repositoryRoot: root, phaseId: phase.phase, prerequisite: phase.inputs });
      const abortSetup = new AbortController(), port = (await chooseBrowserPorts()).app;
      const abortFromParent = () => abortSetup.abort();
      controller.signal.addEventListener("abort", abortFromParent, { once: true });
      if (controller.signal.aborted) abortSetup.abort();
      let setupOutput = "";
      const setupSink = { write(chunk) { sink.write(chunk); setupOutput = (setupOutput + chunk).slice(-65536); if (/Ready in /u.test(setupOutput)) abortSetup.abort(); } };
      let setup;
      try { setup = await child("owned Next dev setup", ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", String(port)],
        { signal: abortSetup.signal, stdout: setupSink, stderr: setupSink, env: caseEnvironment }); }
      finally { controller.signal.removeEventListener("abort", abortFromParent); }
      assert.equal(controller.signal.aborted, false);
      const setupChild = children.at(-1).id;
      assert(setup.cancelled && !setup.timed_out && settled); assert.match(readFileSync(path.join(root, "next-env.d.ts"), "utf8"), /\.next\/dev\/types\/routes\.d\.ts/u);
      const initial = { ...before, source: observePureContractSource(root) }, initialDeclaration = declared(name + "-initial");
      const typecheck = phases.find(p => p.id === "typecheck"), build = phases.find(p => p.id === "build");
      const stop = { id: "development-stop", label: "controlled development stop after successful typecheck", display: "node -e process.exit(17)",
        command: process.execPath, args: ["-e", "process.exit(17)"], cwdScope: "root", timeoutMs: 5000, exclusive: false, browser: false, base_sha: null, head_sha: null };
      const selected = name === "through-build" ? [typecheck, build] : [typecheck, stop, build];
      const runStarted = new Date().toISOString(), results = await runPhasesSequentially({ phases: selected, execute: phase => execute(phase, name), signal: controller.signal });
      assert.equal(results[0].status, "pass"); assert.equal(results[1].exit_status, name === "through-build" ? 0 : 17);
      assert.equal(results.length, 2);
      assert.equal(activeInputs.checkPreparedDependencies(), null); assert.equal(activeInputs.check({ force: true }), null);
      const caseInputs = activeInputs.snapshot(), caseCleanup = cleanupIsolatedInvocationResources(caseResources, { consumersSettled: settled });
      assert(caseCleanup.completed); caseResources = null; activeResources = resources; activeInputs = inputs;
      const receipt = finalizeReceipt({ receipt_version: 4, evidence: { deciding: false, transferable: false, basis: "actual-development-phases-no-attempt" },
        verification_context: { kind: "isolated-worktree" }, repository: { head_sha: head, tree_sha: before.source.tree, base_sha: base },
        run: { invocation_id: invocationId, started_at: runStarted, finished_at: new Date().toISOString() },
        inputs: caseInputs, phases: results, cleanup: { completed: caseCleanup.completed }, attempt: null });
      const witness = { after: initial, environment: caseEnvironment };
      // The actual producer's resource root is gone before fresh inspection;
      // the independent reader uses the still-owned outer capture environment.
      const packet = { witness, receipt, web: initial.web_dependencies, expected: "accepted" };
      const packetRef = save(name + "-inspection.json", packet);
      const inspect = await child("fresh generated output reader", [fileURLToPath(import.meta.url), "--inspect", path.join(out, packetRef.artifact)]); assert(natural(inspect));
      const currentChild = children.at(-1).id;
      const priorPacket = save(name + "-prior-inspection.json", { ...packet, expected: "revision_fixture_budget_invalid" });
      const prior = await child("genuine predecessor generated output reader", [fileURLToPath(import.meta.url), "--inspect", path.join(out, priorPacket.artifact), priorReader]); assert(natural(prior));
      cases.push({ name, setup, initial: initialDeclaration, generated: declared(name + "-generated"), receipt: save(name + "-development-receipt.json", receipt), inspection: packetRef,
        prior_inspection: priorPacket, current_result: inspect, prior_result: prior, phases: results, cleanup: caseCleanup, environment: caseEnvironment,
        setup_child: setupChild, current_child: currentChild, prior_child: children.at(-1).id, build_executed: name === "through-build" });
    }
    assert.equal(inputs.check({ force: true }), null);
    const authority = await child("complete registered reviewed revision fixtures", ["scripts/run-canonical-test-suite.mjs", "authority", "--reviewed-revision-only"], { timeoutMs: AUXILIARY_EXECUTION_BUDGETS.reviewHarnessMs });
    assert(natural(authority)); cases.push({ name: "registered-authority", result: authority, child: children.at(-1).id });
    assert.equal(inputs.checkPreparedDependencies(), null); assert.equal(inputs.check({ force: true }), null);
    after = await observe();
  } catch (cause) { error = cause; }
  finally {
    const finish = action => { try { return action(); } catch (cause) { error ??= cause; return null; } };
    if (owner && settled) finish(() => removeBoundedGeneratedNextState({ root, checkoutOwner: owner }));
    if (caseResources) finish(() => cleanupIsolatedInvocationResources(caseResources, { consumersSettled: settled }));
    cleanup = resources ? finish(() => cleanupIsolatedInvocationResources(resources, { consumersSettled: settled })) : null;
    ownership = { checkout: owner ? finish(() => releaseCheckoutVerificationOwnership(owner, root, { consumersSettled: settled })) : null,
      capacity: lease ? finish(() => releaseVerificationCapacity(lease, { consumersSettled: settled })) : null };
  }
  const record = { contract: "augnes.verifier-lifecycle-development.v1", basis: "actual-owned-development-invocation", command: "node scripts/capture-local-canonical-verifier-lifecycle.mjs",
    tested_source_head: head, tree: before?.source.tree, baseline, base, invocation_id: invocationId, started_at, finished_at: new Date().toISOString(), process_umask: process.umask(),
    before, after, environment, preparations, cases, children, phase_logs: phaseLogs, executed_phases: executedPhases, source_overlay: sourceOverlay, inputs: inputs?.snapshot(), cleanup, ownership, truncated,
    stdout: save("capture.log", Buffer.concat(outputs)), lifecycle: save("capture-lifecycle.log", lifecycle.join("\n") + "\n"), collector: save("collector.mjs", readFileSync(fileURLToPath(import.meta.url))),
    ...(error ? { capture_error: error.code ?? error.message } : {}) };
  save("capture.json", record); console.log(JSON.stringify({ head, cases: cases.map(c => c.name), cleanup, ownership, error: record.capture_error }));
  if (error || !cleanup?.completed || !ownership.checkout?.released || !ownership.capacity?.released) process.exitCode = 1;
}
