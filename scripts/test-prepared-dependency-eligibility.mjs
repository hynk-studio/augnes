import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { buildPhasePlan, phaseEnvironment, runPhasesSequentially } from "./run-local-canonical-verification.mjs";
import { createIsolatedInvocationResources, cleanupIsolatedInvocationResources } from "./local-canonical-isolated-resources.mjs";
import { inputEventIdentity, digest, observeCanonicalRuntimeInputs, observePreparedDependencyInputs, comparePreparedDependencyInputs, freezeInputContract } from "./local-canonical-inputs.mjs";
import { inspectClassifiedEvidence, finalizeReceipt } from "./local-canonical-receipt.mjs";
import { baseReceipt } from "./fixtures/local-canonical-receipt-v3.mjs";
import { beginAttempt, finishAttempt, prepareAttemptDependencies, inspectAttemptRecords } from "./local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { inspectCurrentIntegrationBudgetInputs, readCanonicalNextDeclaration } from "./local-canonical-fixture-budget-witness.mjs";
import { inspectGeneratedStockBrowserInputs } from "./local-canonical-stock-lifecycle-witness.mjs";
import { observePureContractSource, observePureContractLoader } from "./local-canonical-pure-contract-witness.mjs";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const priorHead = process.argv[2] === "--prior-head" ? process.argv[3] : null;
if (priorHead !== null) assert.match(priorHead, /^[a-f0-9]{40}$/u);
const write = (file, value) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value), { mode: 0o600 }); };
const natural = r => r.exit_code === 0 && !r.timed_out && !r.cancelled && r.exit_observed && r.streams_closed && r.cleanup_completed && r.remaining_owned_processes === 0 && r.termination_reason === "natural_exit";
const quiet = { write() {} };

// Separate-process stock-reader control. These are disposable development
// records, never an authenticated receipt, preparation or deciding allowance.
if (process.argv[2] === "--physical-control") {
  const p = JSON.parse(readFileSync(process.argv[3], "utf8"));
  assert.equal(await inspectAttemptRecords({ anchorRoot: p.root, repositoryRoot: p.root, receipt: p.receipt }), p.expected);
  console.log(JSON.stringify({ physical_attempt_reader: p.expected, basis: "disposable development ledger", pid: process.pid }));
} else if (process.argv[2] === "--stock-control") {
  const p = JSON.parse(readFileSync(process.argv[3], "utf8"));
  inspectCurrentIntegrationBudgetInputs(p.root, p.witness, p.receipt);
  inspectGeneratedStockBrowserInputs(p.root, p.web);
  console.log(JSON.stringify({ stock_readers: "pass", pid: process.pid }));
} else {
  const owner = createCanonicalTestResourceRoot("ag-resource-test-");
  beginCanonicalTestResourceUse(owner);
  const root = path.join(owner.root, "checkout"), isolated = createIsolatedInvocationResources(`dependency-control-${process.pid}`);
  const runtime = observeCanonicalRuntimeInputs();
  const environment = phaseEnvironment({ isolatedResources: isolated, runtimeInputs: runtime });
  const git = args => execFileSync("git", args, { cwd: root, timeout: 10000, stdio: ["ignore", "pipe", "pipe"] });
  const cases = [], preparations = [], originalSources = [];
  let settled = true;
  const run = async (command, args, cwd = root) => {
    const r = await runCanonicalChild({ suite: "prepared-dependency-control", label: "disposable registered preparation control", command, args, cwd, env: environment, timeoutMs: 60000, stdout: quiet, stderr: quiet, log() {} });
    settled &&= r.cleanup_completed && r.exit_observed && r.streams_closed && r.remaining_owned_processes === 0;
    assert.ok(natural(r), JSON.stringify(r)); return r;
  };
  try {
    mkdirSync(root);
    const packageRoot = path.join(owner.root, "archive", "package");
    write(path.join(packageRoot, "package.json"), { name: "tsx", version: "0.0.0-fixture", type: "module", exports: "./dist/loader.mjs" });
    write(path.join(packageRoot, "dist/loader.mjs"), "// Disposable structural package, not the application TS loader.\nexport {};\n");
    const archive = path.join(owner.root, "fixture.tgz");
    execFileSync("tar", ["-czf", archive, "-C", path.dirname(packageRoot), "package"], { timeout: 10000 });
    const integrity = "sha512-" + createHash("sha512").update(readFileSync(archive)).digest("base64");
    for (const folder of [root, path.join(root, "apps/web_planning")]) {
      mkdirSync(folder, { recursive: true }); copyFileSync(archive, path.join(folder, "fixture.tgz"));
      const pkg = { name: "disposable-dependency-control", version: "1.0.0", dependencies: { tsx: "file:fixture.tgz" } };
      write(path.join(folder, "package.json"), pkg);
      write(path.join(folder, "package-lock.json"), { name: pkg.name, version: pkg.version, lockfileVersion: 3, requires: true,
        packages: { "": pkg, "node_modules/tsx": { version: "0.0.0-fixture", resolved: "file:fixture.tgz", integrity } } });
    }
    for (const name of ["app", "components", "lib", "scripts", "types", "apps/augnes_apps/src", "apps/augnes_apps/public"]) write(path.join(root, name, ".keep"), "fixture\n");
    write(path.join(root, "tsconfig.json"), {});
    write(path.join(root, ".gitignore"), "node_modules/\nnext-env.d.ts\n.augnes-local-verification/\n");
    git(["init", "--quiet"]); git(["add", "."]); git(["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "disposable fixture source"]);
    const phases = buildPhasePlan({ mode: "full", selectedPlan: "full-canonical", baseSha: "0".repeat(40), headSha: "1".repeat(40) })
      .filter(p => ["dependencies-root", "dependencies-web-planning"].includes(p.id));
    const prepare = async phase => {
      assert.equal(phase.timeoutMs, 600000); assert.deepEqual(phase.args.slice(-3), ["ci", "--no-audit", "--no-fund"]);
      const result = await run(phase.command, phase.args, phase.cwdScope === "web-planning-app" ? path.join(root, "apps/web_planning") : root);
      const observation = observePreparedDependencyInputs({ repositoryRoot: root, phaseId: phase.id });
      preparations.push({ phase: phase.id, command: phase.display, result }); return observation;
    };
    const focused = [];
    for (const phase of phases) focused.push(await prepare(phase));
    const freeze = (module = { freezeInputContract }) => module.freezeInputContract({
      resources: [{ id: "fixture-source", file: path.join(root, "tsconfig.json"), classification: "execution" }],
      pathKind: "isolated-model-free-v1", binding: { runtime_inputs: runtime },
    });
    const installed = freeze();
    let consumers = 0;
    await runPhasesSequentially({ phases: [...phases, { id: "consumer" }], execute: async phase => {
      if (phase.id === "consumer") { consumers++; return { status: "pass" }; }
      await prepare(phase);
      const expected = focused.find(value => value.phase_id === phase.id);
      const actual = installed.prepareDependencies({ repositoryRoot: root, phaseId: phase.id, prerequisite: expected });
      assert.equal(comparePreparedDependencyInputs(expected, actual), "unchanged");
      return { status: "pass" };
    } });
    assert.equal(consumers, 1);
    assert.equal(installed.checkPreparedDependencies(), null);
    cases.push("matching_registered_preparation_before_consumer");
    const checkout = acquireCheckoutVerificationOwnership({ repositoryRoot: root });
    try {
      const contract = freeze();
      const snapshot = contract.snapshot();
      snapshot.binding.runtime_inputs.node.sha256 = digest("changed caller snapshot");
      assert.deepEqual(contract.snapshot().binding.runtime_inputs, runtime, "A returned observation cannot mutate the frozen capability");
      const attempt = beginAttempt({ anchorRoot: root, repositoryRoot: root, checkoutOwner: checkout,
        branch: "fixture/dependency-capability", head: git(["rev-parse", "HEAD"]).toString().trim(),
        tree: git(["rev-parse", "HEAD^{tree}"]).toString().trim(), runId: "disposable-capability", contractFingerprint: contract.snapshot().fingerprint, inputContract: contract });
      assert.throws(() => prepareAttemptDependencies({ ...attempt }, { repositoryRoot: root, inputs: freeze(), phaseId: phases[0].id }), /attempt_dependency_owner_invalid/u);
      assert.throws(() => prepareAttemptDependencies(attempt, { repositoryRoot: owner.root, inputs: freeze(), phaseId: phases[0].id }), /attempt_dependency_owner_invalid/u);
      assert.throws(() => prepareAttemptDependencies(attempt, { repositoryRoot: root, inputs: freeze(), phaseId: phases[0].id }), /attempt_dependency_owner_invalid/u);
      prepareAttemptDependencies(attempt, { repositoryRoot: root, inputs: contract, phaseId: phases[0].id });
      assert.throws(() => prepareAttemptDependencies(attempt, { repositoryRoot: root, inputs: contract, phaseId: phases[0].id }), /dependency_input_preparation_invalid/u);
      const physicalReceipt = finalizeReceipt({ receipt_version: 4, evidence: { deciding: false, transferable: false },
        repository: { branch: attempt.branch, head_sha: attempt.head, tree_sha: attempt.tree }, attempt,
        run: { id: attempt.attempt_id }, outcome: { disposition: "completed_success" }, cleanup: { completed: true } });
      finishAttempt(attempt, { receiptFingerprint: physicalReceipt.integrity.content_fingerprint, disposition: "completed_success", cleanupComplete: true });
      const packetFile = path.join(owner.root, "physical-stock.json");
      const freshPhysical = async (receipt, expected) => { write(packetFile, { root, receipt, expected });
        await run(process.execPath, [fileURLToPath(import.meta.url), "--physical-control", packetFile], repository); };
      await freshPhysical(physicalReceipt, true);
      for (const mutate of [r => { r.attempt.head = "f".repeat(40); }, r => { r.run.id = "substituted"; },
        r => { r.cleanup.completed = false; }, r => { r.outcome.disposition = "product_failure"; }]) {
        const changed = structuredClone(physicalReceipt); mutate(changed); await freshPhysical(finalizeReceipt(changed), false);
      }
      const incomplete = structuredClone(physicalReceipt); incomplete.integrity.content_fingerprint = digest("unrecorded completion");
      await freshPhysical(incomplete, false);
      cases.push("fresh_physical_attempt_completion_and_receipt_substitution_refused");
    } finally { assert.equal(releaseCheckoutVerificationOwnership(checkout, root, { consumersSettled: true }).released, true); }


    cases.push("foreign_frozen_contract_cloned_capability_and_repeated_phase_refused");

    // Genuine prior owner bytes with unchanged local import dependencies. Only
    // the named owner is replaced; record every source in this isolated capsule.
    let prior = null;
    if (priorHead) {
      const capsule = path.join(owner.root, "prior-owner");
      const copied = new Set();
      const copyModule = name => {
        if (copied.has(name)) return; copied.add(name);
        const bytes = name === "local-canonical-inputs.mjs" ? execFileSync("git", ["show", `${priorHead}:scripts/${name}`], { cwd: repository, maxBuffer: 2 * 1024 * 1024 }) : readFileSync(path.join(repository, "scripts", name));
        originalSources.push({ path: `scripts/${name}`, origin: name === "local-canonical-inputs.mjs" ? priorHead : "candidate", sha256: digest(bytes), bytes: bytes.length });
        write(path.join(capsule, name), bytes);
        for (const match of bytes.toString().matchAll(/(?:from\s+|import\s*)["']\.\/([\w.-]+\.mjs)["']/gu)) copyModule(match[1]);
      };
      copyModule("local-canonical-inputs.mjs"); prior = await import(pathToFileURL(path.join(capsule, "local-canonical-inputs.mjs")));
    }
    for (const [index, phase] of phases.entries()) {
      for (const field of ["content_sha256", "layout_sha256", "permission_sha256", "location_fingerprint"]) {
        const expected = { ...focused[index], [field]: digest(`different-${field}`) };
        const enter = async module => {
          const input = freeze(module); let entered = false;
          const result = await runPhasesSequentially({ phases: [phase, { id: "consumer" }], execute: async step => {
            if (step.id === "consumer") { entered = true; return { status: "pass" }; }
            try { input.prepareDependencies({ repositoryRoot: root, phaseId: phase.id, prerequisite: expected }); }
            catch (error) { assert.match(error.code, /^dependency_prerequisite_(?:input_invalidation|safety_violation)$/u); return { status: "failure" }; }
            return { status: "pass" };
          } });
          return { input, entered, result };
        };
        // The genuine prior owner ignores the unrelated prerequisite. The
        // current owner refuses before the real sequential runner's consumer.
        if (prior) assert.equal((await enter(prior)).entered, true);
        const { input: current, entered } = await enter({ freezeInputContract });
        assert.equal(entered, false, "An ineligible preparation must stop before consumer entry");
        assert.equal(current.snapshot().prepared_dependencies[0].before.phase_id, phase.id);
        assert.notEqual(current.snapshot().first_fault, null);
      }
    }
    cases.push("root_and_web_content_layout_permission_location_stop_before_consumer");
    const frozen = freeze(); frozen.prepareDependencies({ repositoryRoot: root, phaseId: phases[0].id, prerequisite: focused[0] });
    const loader = path.join(root, "node_modules/tsx/dist/loader.mjs"), original = readFileSync(loader);
    write(loader, original + "// mutation\n"); assert.notEqual(frozen.checkPreparedDependencies(), null); write(loader, original);
    cases.push("post_boundary_mutation_refused");
    const bothFaults = freeze();
    assert.throws(() => bothFaults.prepareDependencies({ repositoryRoot: root, phaseId: phases[0].id,
      prerequisite: { ...focused[0], content_sha256: digest("different accepted fixture input") } }));
    const firstFault = bothFaults.snapshot().first_fault, firstEvent = bothFaults.snapshot().events[0];
    write(loader, original + "// secondary mutation\n"); bothFaults.checkPreparedDependencies(); write(loader, original);
    const observed = bothFaults.snapshot(); assert.deepEqual(observed.first_fault, firstFault); assert.deepEqual(observed.events[0], firstEvent);
    assert.equal(observed.secondary_faults.length, 1);
    const receiptControl = structuredClone(baseReceipt); receiptControl.inputs = observed;
    receiptControl.repository.head_sha = observed.binding.head; receiptControl.repository.tree_sha = observed.binding.tree;
    const issues = []; inspectClassifiedEvidence(receiptControl, issues);
    assert.equal(issues.includes("receipt_input_event_invalid"), false);
    observed.events[0].prerequisite_sha256 = digest("substituted prerequisite"); observed.events[0].identity = inputEventIdentity(observed.events[0]);
    const refused = []; inspectClassifiedEvidence(receiptControl, refused);
    assert.equal(refused.includes("receipt_input_event_invalid"), true);
    cases.push("first_prerequisite_fault_survives_later_fault");
    const unsafe = freeze(); chmodSync(loader, 0o666);
    assert.throws(() => unsafe.prepareDependencies({ repositoryRoot: root, phaseId: phases[0].id, prerequisite: focused[0] })); chmodSync(loader, 0o600);
    // Restore by the registered producer, not chmod/content-digest tailoring.
    for (const phase of phases) await prepare(phase);
    cases.push("unsafe_file_refused");

    const witness = { after: { source: observePureContractSource(root), loader: observePureContractLoader(root, environment), dependencies: focused[0] }, environment: { AUGNES_CANONICAL_TEMP_ROOT: path.join(owner.root, "never-created") } };
    const declaration = ['/// <reference types="next" />','/// <reference types="next/image-types/global" />','import "./.next/types/routes.d.ts";','import "./.next/types/root-params.d.ts";',"","// NOTE: This file should not be edited","// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.",""].join("\n");
    const start = new Date().toISOString(); write(path.join(root, "next-env.d.ts"), declaration); const end = new Date().toISOString();
    // Structural reader controls. These records model registered fields; the
    // connected capture separately records real Next producers and phases.
    const invocation = "a".repeat(32), environmentFingerprint = digest(environment);
    const sourceBinding = { head: witness.after.source.head, tree: witness.after.source.tree };
    const receipt = finalizeReceipt({ verification_context: { kind: "isolated-worktree" }, cleanup: { completed: true },
      repository: { head_sha: sourceBinding.head, tree_sha: sourceBinding.tree },
      run: { invocation_id: invocation, started_at: start, finished_at: end },
      inputs: { binding: { ...sourceBinding, phase_environment_fingerprints: [{ id: "typecheck", fingerprint: environmentFingerprint }] } },
      phases: [{ id: "typecheck", command: "npm run typecheck", cwd_scope: "root", exclusive: false, browser: false,
        base_sha: null, head_sha: null, invocation_id: invocation, environment_fingerprint: environmentFingerprint,
        status: "pass", exit_status: 0, failure_code: null, timed_out: false, spawn_error_code: null,
        started_at: start, finished_at: end, cleanup: { completed: true, exit_observed: true, streams_closed: true,
          remaining_owned_processes: 0, listener_residue_count: null, termination_reason: "natural_exit" } }] });
    const stockFile = path.join(owner.root, "stock.json"); write(stockFile, { root, witness, receipt, web: focused[1] });
    await run(process.execPath, [fileURLToPath(import.meta.url), "--stock-control", stockFile], repository);
    const changedReceipt = mutate => { const value = structuredClone(receipt); mutate(value, value.phases[0]); return finalizeReceipt(value); };
    inspectCurrentIntegrationBudgetInputs(root, witness, changedReceipt((r, p) => { p.status = "failure"; p.exit_status = 1; p.failure_code = "phase_failed"; }));
    for (const mutate of [
      (r,p) => { p.finished_at = "2000-01-01T00:00:00Z"; },
      (r,p) => { p.started_at = "2100-01-01T00:00:00Z"; },
      (r,p) => { p.command = "npm run unrelated"; },
      (r,p) => { p.cwd_scope = "nested-app"; },
      (r,p) => { p.exclusive = true; },
      (r,p) => { p.browser = true; },
      (r,p) => { p.status = "not_run"; },
      (r,p) => { p.exit_status = 1; },
      (r,p) => { p.failure_code = "phase_cancelled"; },
      (r,p) => { p.timed_out = true; },
      (r,p) => { p.spawn_error_code = "ENOENT"; },
      (r,p) => { p.cleanup.streams_closed = false; },
      (r,p) => { p.cleanup.exit_observed = false; },
      (r,p) => { p.cleanup.remaining_owned_processes = 1; },
      (r,p) => { p.cleanup.listener_residue_count = 1; },
      (r,p) => { p.cleanup.termination_reason = "operator_cancelled"; },
      (r,p) => { p.invocation_id = "b".repeat(32); },
      (r,p) => { p.environment_fingerprint = digest("substitution"); },
      r => { r.run.started_at = "2100-01-01T00:00:00Z"; },
      r => { r.repository.head_sha = "f".repeat(40); },
      r => { r.inputs.binding.tree = "f".repeat(40); },
      r => { r.phases.push(structuredClone(r.phases[0])); },
    ]) assert.throws(() => inspectCurrentIntegrationBudgetInputs(root, witness, changedReceipt(mutate)));
    const tampered = structuredClone(receipt); tampered.run.id = "tampered";
    assert.throws(() => inspectCurrentIntegrationBudgetInputs(root, witness, tampered));
    const build = changedReceipt((r,p) => { p.id = "build"; p.command = "npm run build"; p.exclusive = true;
      r.inputs.binding.phase_environment_fingerprints[0].id = "build"; });
    inspectCurrentIntegrationBudgetInputs(root, witness, build);
    assert.throws(() => inspectGeneratedStockBrowserInputs(root, { ...focused[1], content_sha256: digest("changed") }));
    cases.push("fresh_stock_generated_window_and_out_of_window_refusal");
    for (const file of ["tsconfig.json", "package-lock.json", "node_modules/tsx/dist/loader.mjs"]) {
      const target = path.join(root, file), original = readFileSync(target);
      write(target, original + "\n ");
      assert.throws(() => inspectCurrentIntegrationBudgetInputs(root, witness, receipt));
      write(target, original);
    }
    cases.push("source_lockfile_loader_mutation_refused");
    const declarationFile = path.join(root, "next-env.d.ts"), heldDeclaration = path.join(owner.root, "held-declaration");
    assert.equal(readCanonicalNextDeclaration(root).raw.toString(), declaration);
    rmSync(declarationFile); assert.equal(readCanonicalNextDeclaration(root), null);
    write(heldDeclaration, declaration);
    for (const [label, install] of [
      ["oversized", () => write(declarationFile, "x".repeat(1025))],
      ["symlink", () => symlinkSync(heldDeclaration, declarationFile)],
      ["hardlink", () => linkSync(heldDeclaration, declarationFile)],
      ["directory", () => mkdirSync(declarationFile)],
      ["fifo", () => execFileSync("mkfifo", [declarationFile], { timeout: 1000 })],
      ["unsafe mode", () => { write(declarationFile, declaration); chmodSync(declarationFile, 0o666); }],
    ]) {
      install(); assert.throws(() => readCanonicalNextDeclaration(root), undefined, label);
      rmSync(declarationFile, { recursive: true });
    }
    write(declarationFile, declaration);
    cases.push("bounded_no_follow_generated_read_refuses_unsafe_files");
    console.log(JSON.stringify({ basis: "disposable development controls; no deciding authority", cases, prior_head: priorHead, original_sources: originalSources, preparations, process_umask: process.umask(), runtime: digest(runtime) }));
  } finally {
    assert.equal(cleanupIsolatedInvocationResources(isolated, { consumersSettled: settled }).completed, true);
    settleCanonicalTestResourceUse(owner, { exit_observed: settled, streams_closed: settled, cleanup_completed: settled, remaining_owned_processes: 0 });
    assert.equal(cleanupCanonicalTestResources([owner])[0].completed, true);
  }
}
