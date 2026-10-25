// Disposable infrastructure controls, never Mac qualification evidence. The
// selected five-phase workload is deliberately tiny; every phase still passes
// through the production executor, monitor, child owner and receipt readers.
import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { observerContinuationResources } from "../local-canonical-observer-continuation.mjs";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { freezeInputContract, monitorInputContract, digest, observeInputFile, classifyInputChange, nonFaultInputChange, deriveOperationalDisposition } from "../local-canonical-inputs.mjs";
import { beginAttempt, finishAttempt, inspectAttemptRecords } from "../local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership, checkoutVerificationFingerprint, assertCheckoutVerificationOwnership } from "../local-canonical-checkout-ownership.mjs";
import { admitVerificationContext } from "../local-canonical-verification-context.mjs";
import { acquireVerificationCapacity, releaseVerificationCapacity, assertVerificationCapacity } from "../local-canonical-capacity.mjs";
import { admitIntegrationBase } from "../local-canonical-integration-base.mjs";
import { createIsolatedInvocationResources, isolatedInvocationEnvironment, cleanupIsolatedInvocationResources } from "../local-canonical-isolated-resources.mjs";
import { runPhasesSequentially, executePhase, computeExecutorSourceFingerprint } from "../run-local-canonical-verification.mjs";
import { finalizeReceipt, inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { inspectCompanionPreservation } from "../../plugins/augnes-operator/mcp/companion-service-core.mjs";
import { baseReceipt, validContext, policyPhaseIds } from "./local-canonical-receipt-v3.mjs";

export const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const write = (file, value) => { mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 }); writeFileSync(file, typeof value === "string" || Buffer.isBuffer(value) ? value : `${JSON.stringify(value)}\n`, { mode: 0o600 }); };
export const read = file => JSON.parse(readFileSync(file, "utf8"));
export const git = (root, ...args) => execFileSync("git", ["--no-replace-objects", ...args], { cwd: root, timeout: 5000, maxBuffer: 4 * 1024 * 1024, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { PATH: process.env.PATH, HOME: root, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" } }).trim();
export const commit = (root, message) => { git(root, "add", "."); git(root, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgSign=false", "commit", "-qm", message); return git(root, "rev-parse", "HEAD"); };
export const tracking = name => `[branch "${name}"]\n\tremote = origin\n\tmerge = refs/heads/${name}\n`;
export function createFixture(root, name) {
  const parent = path.join(root, name), anchor = path.join(parent, "anchor"), checkout = path.join(parent, "checkout");
  mkdirSync(anchor, { recursive: true });
  git(anchor, "init", "-q", "-b", "main"); git(anchor, "remote", "add", "origin", "https://github.com/hynk-studio/augnes.git");
  write(path.join(anchor, ".gitignore"), ".augnes-local-verification/\n");
  write(path.join(anchor, "scripts/value.mjs"), "export const value = 1;\n");
  write(path.join(anchor, "scripts/local-canonical-inputs.mjs"), "export const value = 1;\n");
  write(path.join(anchor, "shared.mjs"), "// base registration\n");
  write(path.join(anchor, "apps/augnes_apps/.keep"), ""); write(path.join(anchor, "apps/web_planning/.keep"), "");
  const base = commit(anchor, "fixture accepted base"), branch = `codex/${name}`;
  git(anchor, "-c", "branch.autoSetupMerge=false", "worktree", "add", "-qb", branch, checkout, base);
  write(path.join(checkout, "task-assets.txt"), `retained task assets: ${name}\n`);
  appendFileSync(path.join(checkout, "shared.mjs"), "// retained task registration\n");
  const head = commit(checkout, "fixture original candidate");
  const f = { parent, anchor, checkout, base, branch, head, tree: git(checkout, "rev-parse", "HEAD^{tree}"), config: path.join(anchor, ".git/config"), sequence: 0 };
  for (const name of ["preferences", "instructions", "auth"]) write(path.join(parent, name), `fixture ${name}\n`);
  f.beforeConfig = readFileSync(f.config);
  f.browser = path.join(parent, "browser"); write(f.browser, "#!/bin/sh\nexit 0\n"); fs.chmodSync(f.browser, 0o700);
  return f;
}
export const context = f => admitVerificationContext({ repositoryRoot: f.checkout, kind: "isolated-worktree", platform: "darwin", canonicalRoot: f.anchor });
export const transport = f => ({ fetchBranchHead: async () => ({ repository_id: "hynk-studio/augnes", branch: "main", sha: git(f.anchor, "rev-parse", "main") }) });
export const resourceList = (f, proof = null) => [
  { id: "codex-preferences", file: path.join(f.parent, "preferences"), classification: "execution" },
  { id: "user-instructions", file: path.join(f.parent, "instructions"), classification: "execution" },
  { id: "auth-location", file: path.join(f.parent, "auth"), classification: "safety", metadataOnly: true },
  { id: "git-config", file: f.config, classification: "execution" },
  { id: "node-executable", file: process.execPath, classification: "execution" },
  { id: "browser-executable", file: f.browser, classification: "execution", readOnlyExecutable: true },
  ...(proof ? observerContinuationResources({ repositoryRoot: f.checkout, anchorRoot: f.anchor, proof }) : []),
];
export const request = (f, extra = {}) => ({ anchorRoot: f.anchor, repositoryRoot: f.checkout, branch: f.branch, head: f.head, tree: f.tree, acceptedMain: f.base, ...extra });
export async function runInvocation(f, { proof = null, mutate = false, beforeChildren = null, afterChildren = null, legacyShape = false, spawnFailure = false, nestedFailure = false, settledPrefix = null, observerFault = false } = {}) {
  const started = new Date().toISOString(), startedMs = Date.now(), runId = `fixture-${randomBytes(6).toString("hex")}-${++f.sequence}`, invocationId = randomBytes(16).toString("hex");
  const verification = context(f), base = await admitIntegrationBase({ repositoryRoot: f.checkout, baseSha: f.base, headSha: f.head, transport: transport(f) });
  assert.equal(base.status, "admitted");
  const privateResources = createIsolatedInvocationResources(invocationId), environment = isolatedInvocationEnvironment(privateResources);
  const serviceOptions = { repositoryRoot: f.anchor, homeDirectory: f.parent, environment: { HOME: f.parent }, platform: process.platform };
  const serviceBefore = await inspectCompanionPreservation(serviceOptions);
  assert.equal(serviceBefore.state.preservation_valid, true, JSON.stringify(serviceBefore));
  const owner = acquireCheckoutVerificationOwnership({ repositoryRoot: f.checkout });
  const capacity = acquireVerificationCapacity({ context: verification, host: { logical_cpu_count: 2, physical_memory_bytes: 8 * 1024 ** 3, disk_free_bytes_at_start: 32 * 1024 ** 3 }, invocationId });
  const logRoot = path.join(sourceRoot, ".augnes-local-verification/logs", runId); mkdirSync(logRoot, { recursive: true, mode: 0o700 });
  const sourceFiles = ["scripts/value.mjs"], fingerprint = computeExecutorSourceFingerprint(f.checkout, sourceFiles);
  const mutationMarker = path.join(f.parent, `mutation-ready-${runId}`);
  const mutationIndex = settledPrefix ? 1 : 0;
  const descendant = `const {spawn}=require('node:child_process'); const c=spawn(process.execPath,['-e',"setInterval(()=>{},1000)"],{stdio:['ignore','inherit','inherit']}); c.unref(); setTimeout(()=>process.exit(0),40);`;
  const prefixCode = settledPrefix === "phase" ? descendant : `
    (async()=>{
      const {runCanonicalChild,canonicalChildAcceptanceFailure}=await import(${JSON.stringify(pathToFileURL(path.join(sourceRoot, "scripts/canonical-child-runner.mjs")).href)});
      const r=await runCanonicalChild({suite:${JSON.stringify(policyPhaseIds[0])},label:'settled-prefix-child',command:process.execPath,args:['-e',${JSON.stringify(descendant)}],cwd:process.cwd(),env:process.env,timeoutMs:1500,termGraceMs:100,killGraceMs:100});
      const error=canonicalChildAcceptanceFailure(r,{suite:${JSON.stringify(policyPhaseIds[0])},timeoutMs:1500,requireNaturalExit:${settledPrefix === "strict-child"},requireCompleteCleanup:true});
      if(error) throw error;
      console.log(JSON.stringify({suite:${JSON.stringify(policyPhaseIds[0])},status:'pass',results:[{label:r.label,status:r.exit_code,timed_out:r.timed_out,exit_observed:r.exit_observed,streams_closed:r.streams_closed,cleanup_completed:r.cleanup_completed,remaining_owned_processes:r.remaining_owned_processes,termination_reason:r.termination_reason}]}));
    })().catch(e=>{console.error(e.code);process.exitCode=1});`;
  const phases = policyPhaseIds.map((id, n) => ({ id, label: `disposable-${n}`, command: spawnFailure && n === 0 ? path.join(f.parent, "absent-owned-executable") : process.execPath,
    args: ["-e", settledPrefix && n === 0 ? prefixCode : mutate && n === mutationIndex ? `const fs=require('fs'); process.on('SIGTERM',()=>process.exit(0)); (async()=>{${nestedFailure ? `const {runCanonicalChild}=await import(${JSON.stringify(pathToFileURL(path.join(sourceRoot, "scripts/canonical-child-runner.mjs")).href)}); await runCanonicalChild({suite:${JSON.stringify(id)},label:'independent-product-failure',command:process.execPath,args:['-e','process.exit(1)'],cwd:process.cwd(),env:process.env,timeoutMs:500});` : ""} fs.writeFileSync(${JSON.stringify(mutationMarker)},'ready\\n'); setInterval(()=>{},1000);})();` : "process.stdout.write('disposable phase passed\\n')"],
    display: `node disposable-phase-${n}`, cwdScope: "root", exclusive: false, browser: false, timeoutMs: 2000, base_sha: f.base, head_sha: f.head }));
  if (observerFault && mutate) phases[mutationIndex].args[1] = `
    const fs=require('fs');process.on('SIGTERM',()=>process.exit(0));
    (async()=>{const {runCanonicalChild}=await import(${JSON.stringify(pathToFileURL(path.join(sourceRoot, "scripts/canonical-child-runner.mjs")).href)});
    await runCanonicalChild({suite:${JSON.stringify(phases[mutationIndex].id)},label:'guard-cancelled-child',command:process.execPath,args:['-e','setInterval(()=>{},1000)'],cwd:process.cwd(),env:process.env,timeoutMs:1500,
      log(line){console.log(line);if(line.includes(' child_spawn '))fs.writeFileSync(${JSON.stringify(mutationMarker)},'ready');}});})();`;
  const frozen = freezeInputContract({ resources: resourceList(f, proof), pathKind: "isolated-model-free-v1", binding: { head: f.head, tree: f.tree, executor_fingerprint: fingerprint,
    ...(proof ? { observer_continuation: digest(proof) } : {}), phase_environment_fingerprints: phases.map(p => ({ id: p.id, fingerprint: digest(environment) })) } });
  const controller = new AbortController(), monitor = monitorInputContract(frozen, controller, { intervalMs: 5, assertOwner: () => { assertCheckoutVerificationOwnership(owner, f.checkout); assertVerificationCapacity(capacity); } });
  let attempt, results = [], settled = true, cleanup, checkoutRelease, capacityRelease;
  try {
    if (legacyShape) {
      // Frozen v1 writer shape for compatibility only. It is constructed once,
      // before the real original workload; never migrate or rewrite a receipt.
      assert.equal(proof, null);
      const contract = "augnes.local-canonical-attempt-family.v1", familyId = digest([contract, "hynk-studio/augnes", f.branch]);
      attempt = { contract, family_id: familyId, attempt_id: runId, number: 1, branch: f.branch, head: f.head, tree: f.tree,
        contract_fingerprint: frozen.snapshot().fingerprint, started_at: new Date().toISOString(), prior_attempt_id: null, prior_receipt_fingerprint: null,
        recovery: null, source_correction: null, budget: { initial: 1, recovery: 1 } };
      const file = path.join(f.anchor, ".augnes-local-verification/families", familyId, "attempt-1.json");
      mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 }); writeFileSync(file, `${JSON.stringify(attempt)}\n`, { flag: "wx", mode: 0o600 });
    } else attempt = beginAttempt(request(f, { checkoutOwner: owner, runId, contractFingerprint: frozen.snapshot().fingerprint, observerContinuation: proof, inputs: frozen.snapshot(), currentResources: resourceList(f) }));
    if (beforeChildren) beforeChildren({ frozen, controller, monitor, attempt });
    monitor.check();
    results = await runPhasesSequentially({ phases, signal: controller.signal, execute: async phase => {
      monitor.check(); if (controller.signal.aborted) return null;
      settled = false;
      // The owned child signals its exact mutation point. The controller then
      // writes and observes synchronously on one event loop, avoiding a fixture
      // read/write race being misrepresented as an ordinary input invalidation.
      let mutationTimer;
      if (mutate && phase.id === phases[mutationIndex].id) mutationTimer = setInterval(() => {
        if (!existsSync(mutationMarker)) return;
        clearInterval(mutationTimer);
        if (observerFault) injectObserverFault(f, monitor); else { appendFileSync(f.config, tracking(`observed-${f.sequence}`)); monitor.check(); }
      }, 5);
      let result;
      try { result = await executePhase({ phase, mode: "changed", runLogRoot: logRoot, isolatedResources: privateResources, signal: controller.signal, invocationId }); }
      finally { clearInterval(mutationTimer); }
      settled = result.cleanup.completed && result.cleanup.remaining_owned_processes === 0;
      const localLog = path.join(sourceRoot, result.log.relative_path);
      write(path.join(f.checkout, result.log.relative_path), readFileSync(localLog));
      return result;
    } });
    if (afterChildren) afterChildren({ frozen, controller, monitor, attempt });
  } finally {
    monitor.stop();
    cleanup = cleanupIsolatedInvocationResources(privateResources, { consumersSettled: settled });
    capacityRelease = releaseVerificationCapacity(capacity, { consumersSettled: settled });
    checkoutRelease = releaseCheckoutVerificationOwnership(owner, f.checkout, { consumersSettled: settled });
    if (settled) rmSync(logRoot, { recursive: true });
  }
  assert.equal(settled, true); assert.equal(cleanup.completed, true);
  const serviceAfter = await inspectCompanionPreservation(serviceOptions), input = frozen.snapshot();
  const receipt = structuredClone(baseReceipt);
  Object.assign(receipt, { receipt_version: 4, inputs: input, attempt, verification_context: verification });
  Object.assign(receipt.repository, { base_sha: f.base, head_sha: f.head, tree_sha: f.tree, branch: f.branch });
  receipt.executor = { ...receipt.executor, version: 4, source_files: sourceFiles, source_fingerprint: fingerprint };
  receipt.integration_base = base;
  receipt.phases = phases.map(p => results.find(r => r.id === p.id) ?? { id: p.id, label: p.label, command: p.display, cwd_scope: "root", exclusive: false, browser: false, invocation_id: invocationId,
    environment_fingerprint: digest(environment), status: "not_run", started_at: null, finished_at: null, duration_ms: null, exit_status: null, timed_out: false, failure_code: "phase_not_run", cleanup: { completed: true, remaining_owned_processes: 0 }, log: null });
  receipt.checkout_ownership = { required: true, acquired: true, ...owner.metadata, ...checkoutRelease, failure_code: null };
  receipt.capacity_ownership = { required: false, acquired: true, ...capacity, ...capacityRelease, failure_code: null };
  receipt.cleanup = { ...receipt.cleanup, completed: cleanup.completed, remaining_owned_processes: 0,
    isolated_resources: { required: true, prepared: true, ...privateResources, ...cleanup },
    companion_service: { scope: "accepted_checkout_read_only", before: serviceBefore.state, after: serviceAfter.state, observations: { before: serviceBefore.diagnostics, after: serviceAfter.diagnostics }, maintenance_acquired: false, maintenance_released: true, restored: digest(serviceBefore.state) === digest(serviceAfter.state) } };
  receipt.run = { id: runId, invocation_id: invocationId, started_at: started, finished_at: new Date().toISOString(), duration_ms: Date.now() - startedMs };
  const disposition = deriveOperationalDisposition({ phases: receipt.phases, fault: input.first_fault, cleanup: cleanup.completed });
  const passed = disposition === "completed_success";
  receipt.evidence.deciding = passed; receipt.evidence.transferable = passed;
  receipt.outcome = { disposition, first_fault: input.first_fault, validity: passed ? "valid_within_observed_scope" : "invalidated", safety: passed ? "preserved_within_observed_scope" : "blocked" };
  receipt.final = { ...receipt.final, result: passed ? "pass" : "failure", exit_status: passed ? 0 : 1, reason_codes: passed ? [] : [results.find(p => p.status === "failure")?.failure_code ?? "verification_cancelled", "selected_phases_incomplete"] };
  const sealed = finalizeReceipt(receipt), relative = `.augnes-local-verification/receipts/${runId}.json`;
  write(path.join(f.checkout, relative), sealed);
  if (legacyShape) writeFileSync(path.join(f.anchor, ".augnes-local-verification/families", attempt.family_id, "completion-1.json"), `${JSON.stringify({
    contract: attempt.contract, attempt_id: attempt.attempt_id, receipt_fingerprint: sealed.integrity.content_fingerprint, disposition,
    cleanup_complete: cleanup.completed, infrastructure_code: null, finished_at: new Date().toISOString(),
  })}\n`, { flag: "wx", mode: 0o600 });
  else finishAttempt(attempt, { receiptFingerprint: sealed.integrity.content_fingerprint, disposition, cleanupComplete: cleanup.completed, infrastructureCode: results.find(p => p.spawn_error_code)?.spawn_error_code ?? null });
  return { receipt: sealed, relative, originalBytes: readFileSync(path.join(f.checkout, relative)), attempt, results };
}

export async function stock(f, relative) {
  const r = read(path.join(f.checkout, relative)), current = resourceList(f, r.attempt.observer_continuation);
  const inputsValid = r.inputs.resources.every(resource => {
    const item = current.find(i => i.id === resource.id);
    return item && resource.location_fingerprint === digest(item.file) && nonFaultInputChange(classifyInputChange(resource.before, observeInputFile(item.file, { metadataOnly: item.metadataOnly, readOnlyExecutable: item.readOnlyExecutable }), resource));
  });
  return inspectReceiptForDecision(r, { ...structuredClone(validContext), currentVerificationContext: context(f), expectedRunId: r.run.id,
    currentIntegrationBase: await admitIntegrationBase({ repositoryRoot: f.checkout, baseSha: r.repository.base_sha, headSha: r.repository.head_sha, transport: transport(f) }),
    currentIdentity: { head_sha: git(f.checkout, "rev-parse", "HEAD"), origin: git(f.checkout, "remote", "get-url", "origin"), branch: git(f.checkout, "branch", "--show-current"), detached: false, worktree_dirty: git(f.checkout, "status", "--porcelain").length !== 0 },
    currentCheckoutFingerprint: checkoutVerificationFingerprint(f.checkout), currentExecutorFingerprint: computeExecutorSourceFingerprint(f.checkout, r.executor.source_files),
    currentAttemptRecordsValid: inspectAttemptRecords({ anchorRoot: f.anchor, repositoryRoot: f.checkout, receipt: r, currentResources: resourceList(f) }), currentInputStateValid: inputsValid });
}

// Fault injection is confined to disposable controls, never exported by a
// production owner. Exercise the real observer catch, latch and child cancel.
export function injectObserverFault(f, monitor) {
  const saved = fs.lstatSync;
  fs.lstatSync = (file, ...args) => { if (file === f.browser) throw Object.assign(new Error("synthetic read failure"), { code: "EIO" }); return saved(file, ...args); };
  syncBuiltinESMExports();
  try { monitor.check(); } finally { fs.lstatSync = saved; syncBuiltinESMExports(); }
}
