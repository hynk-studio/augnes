import assert from "node:assert/strict";
import { chmodSync, existsSync, linkSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ownedExecFileSync as execFileSync } from "./test-harness-process-lifecycle.mjs";
import { randomUUID } from "node:crypto";
import { observeInputFile, classifyInputChange, freezeInputContract, monitorInputContract, digest } from "./local-canonical-inputs.mjs";
import { beginBrowserUse, validBrowserUse, browserConsumersForPhase, BROWSER_IDENTITY_PREFIX } from "./local-canonical-browser-identity.mjs";
import { beginAttempt, finishAttempt, inspectAttemptRecords, readSourceCorrectionProof } from "./local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { createIsolatedInvocationResources, cleanupIsolatedInvocationResources } from "./local-canonical-isolated-resources.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { executePhase } from "./run-local-canonical-verification.mjs";
import { finalizeReceipt, inspectReceiptForDecision } from "./local-canonical-receipt.mjs";
import { baseReceipt, validContext } from "./fixtures/local-canonical-receipt-v3.mjs";

const self = fileURLToPath(import.meta.url), repository = path.dirname(path.dirname(self));
const quiet = { write() {} }, write = (p, v) => writeFileSync(p, typeof v === "string" ? v : JSON.stringify(v), { mode: 0o600 });
const role = { classification: "execution", readOnlyExecutable: true };
const settled = r => r.cleanup_completed && r.exit_observed && r.streams_closed && r.remaining_owned_processes === 0;

// The outer real child owner quarantines deliberately synthetic Browser records
// from Canonical's actual-use stream. This probes the production phase executor.
if (process.argv[2] === "--phase-probe") {
  const { records, expected, cases } = JSON.parse(readFileSync(process.argv[3], "utf8"));
  const id = `review-probe-${randomUUID()}`, resources = createIsolatedInvocationResources(id);
  const logDirectories = [];
  let complete = true;
  try {
    for (const [index, c] of cases.entries()) {
      const phaseRecords = structuredClone(records);
      if (c.mutation === "missing") phaseRecords.pop();
      if (c.mutation === "extra") phaseRecords.push(structuredClone(records[0]));
      if (c.mutation === "overflow") phaseRecords.push(...Array.from({ length: 4 }, () => structuredClone(records[0])));
      if (c.mutation === "wrong-location") phaseRecords[0].location_fingerprint = "0".repeat(64);
      if (c.mutation === "wrong-version") phaseRecords[0].runtime_versions.cdp = "Fixture/2.0";
      if (c.mutation === "content") phaseRecords[0].after.sha256 = "0".repeat(64);
      const output = phaseRecords.map(r => BROWSER_IDENTITY_PREFIX + JSON.stringify(r)).join("\n") + "\n";
      const code = `process.stdout.write(${JSON.stringify(output)});` + (c.mutation === "timeout" ? "process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);" : "");
      const runLogRoot = path.join(repository, ".augnes-local-verification", "logs", `${id}-${index}`);
      logDirectories.push(runLogRoot);
      const result = await executePhase({ phase: { id: "integration", browser: false, command: process.execPath, args: ["-e", code],
        display: "disposable Browser evidence emitter", label: "disposable evidence", cwdScope: "root", timeoutMs: c.mutation === "timeout" ? 150 : 2000 },
        mode: "regression", runLogRoot, isolatedResources: resources, expectedBrowser: expected });
      complete &&= result.cleanup.completed && result.cleanup.remaining_owned_processes === 0;
      assert.equal(result.status, c.pass ? "pass" : "failure", c.mutation);
      assert.equal(result.browser_use.length, phaseRecords.length);
      if (c.mutation === "timeout") { assert(result.timed_out); assert.equal(result.exit_status, 0); }
      else if (!c.pass) assert.equal(result.failure_code, "browser_identity_invalid");
    }
  } finally {
    const cleanup = cleanupIsolatedInvocationResources(resources, { consumersSettled: complete });
    assert(cleanup.completed); if (complete) for (const directory of logDirectories) { rmSync(directory, { recursive: true, force: true }); assert(!existsSync(directory)); }
  }
  process.exit(0);
}

const owner = createCanonicalTestResourceRoot("ag-resource-test-");
const root = owner.root, env = buildCanonicalChildEnvironment({ temporaryRoot: root });
const findings = []; let inFlight = false, lastChildDiagnostic = "";
beginCanonicalTestResourceUse(owner);
async function child(args, options = {}) {
  inFlight = true; lastChildDiagnostic = "";
  const result = await runCanonicalChild({ suite: "review-corrections", label: "disposable control", command: process.execPath, args,
    cwd: root, env, timeoutMs: 6000, stdout: quiet, stderr: { write(b) { lastChildDiagnostic = (lastChildDiagnostic + b.toString()).slice(-16000); } }, log() {}, ...options });
  inFlight = !settled(result); assert(!inFlight, JSON.stringify(result)); return result;
}
try {
  const executable = path.join(root, "read-only-browser"), alias = path.join(root, "alias");
  write(executable, "fixture executable\n"); chmodSync(executable, 0o700);
  const before = observeInputFile(executable, { readOnlyExecutable: true });
  const active = freezeInputContract({ resources: [{ id: "browser-executable", file: executable, ...role }], pathKind: "isolated-model-free-v1", binding: {} });
  const use = beginBrowserUse(executable, { consumer: "durable-work-surface", emit() {} });
  use.version("Fixture/1.0"); use.version("Fixture/1.0", "cdp");
  linkSync(executable, alias);
  assert.equal(active.check(), null);
  assert.equal(active.snapshot().events[0].disposition, "incidental_executable_metadata");
  const benignSnapshot = active.snapshot();
  const record = use.finish(); const expected = { before, location_fingerprint: digest(executable) };
  assert(validBrowserUse(record, expected));
  assert.throws(() => observeInputFile(executable), /input_unsafe_file/);
  for (const key of ["mode", "uid", "gid", "inode", "device"]) {
    const changed = structuredClone(record.after); changed.metadata[key] = String(BigInt(changed.metadata[key]) + 1n);
    assert.equal(classifyInputChange(before, changed, role), "safety_violation", key);
  }
  const strictBefore = { ...before, executable_identity_policy: "strict-metadata-v1" }, strictAfter = { ...record.after, executable_identity_policy: "strict-metadata-v1" };
  assert.equal(classifyInputChange(strictBefore, strictBefore, role), "unchanged");
  assert.equal(classifyInputChange(strictBefore, strictAfter, role), "safety_violation");
  const security = structuredClone(record.after); security.permission_identity = "0".repeat(64);
  assert.equal(classifyInputChange(before, security, role), "safety_violation");
  if (process.platform === "darwin") {
    execFileSync("/bin/chmod", ["+a", "everyone deny execute", executable]);
    assert.equal(classifyInputChange(before, observeInputFile(executable, { readOnlyExecutable: true }), role), "safety_violation");
    execFileSync("/bin/chmod", ["-N", executable]);
    execFileSync("/usr/bin/xattr", ["-w", "augnes.disposable-control", "sentinel", executable]);
    assert.equal(classifyInputChange(before, observeInputFile(executable, { readOnlyExecutable: true }), role), "safety_violation");
    execFileSync("/usr/bin/xattr", ["-d", "augnes.disposable-control", executable]);
  }
  const mixed = structuredClone(record.after); mixed.sha256 = "0".repeat(64);
  assert.equal(classifyInputChange(before, mixed, role), "input_invalidation");
  assert.equal(validBrowserUse({ ...record, after: mixed }, expected), false);
  assert.equal(validBrowserUse({ ...record, runtime_versions: { http: "Fixture/1.0", cdp: "Fixture/9.0" } }, expected), false);
  assert.equal(validBrowserUse(record, { ...expected, location_fingerprint: "0".repeat(64) }), false);
  assert.equal(validBrowserUse(record, { ...expected, actual_version: "Fixture/2.0" }), false);
  const incomplete = structuredClone(record); delete incomplete.before.metadata;
  assert.equal(validBrowserUse(incomplete, expected), false);
  rmSync(alias); assert.equal(active.check(), null);
  const linkedPath = path.join(root, "symlink"); symlinkSync(executable, linkedPath);
  assert.throws(() => observeInputFile(linkedPath, { readOnlyExecutable: true })); rmSync(linkedPath);
  assert.throws(() => freezeInputContract({ resources: [{ id: "bad-role", file: executable, ...role, classification: "ambient", excludePreferences: true }], pathKind: "isolated-model-free-v1", binding: {} }));
  // Real owned-child cancellation still latches an alias content mutation.
  linkSync(executable, alias);
  const controller = new AbortController(), monitor = monitorInputContract(active, controller, { intervalMs: 10 });
  const mutation = await child(["-e", `require('fs').writeFileSync(${JSON.stringify(alias)},'different executable');process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);`], { signal: controller.signal });
  monitor.stop(); assert(mutation.cancelled); assert.equal(active.snapshot().first_fault.disposition, "input_invalidation");
  chmodSync(executable, 0o600); assert.throws(() => observeInputFile(executable, { readOnlyExecutable: true }));
  const replacement = path.join(root, "replacement"); write(replacement, "fixture executable\n"); chmodSync(replacement, 0o700); renameSync(replacement, executable);
  assert.equal(classifyInputChange(before, observeInputFile(executable, { readOnlyExecutable: true }), role), "safety_violation");
  findings.push("shared alias add/remove is recorded; alias content, ownership/mode/inode/device/path changes and mutable aliases refuse; exact child settles after cancellation");

  const records = Object.entries(browserConsumersForPhase("integration")).flatMap(([consumer, count]) => Array.from({ length: count }, () => ({ ...record, consumer })));
  const probe = path.join(root, "phase-probe.json");
  write(probe, { records, expected, cases: [{ mutation: "none", pass: true }, ...["missing", "extra", "overflow", "wrong-location", "wrong-version", "content", "timeout"].map(mutation => ({ mutation, pass: false }))] });
  const probeResult = await child([self, "--phase-probe", probe], { timeoutMs: 15000 }); assert.equal(probeResult.exit_code, 0, lastChildDiagnostic);
  // Stock structural reader applies the same consumer inventory and role rule.
  const receipt = structuredClone(baseReceipt); receipt.receipt_version = 4; receipt.repository.tree_sha = "7".repeat(40);
  receipt.phases[0].id = "integration"; receipt.phases[0].browser = false; receipt.phases[0].browser_use = records;
  receipt.phases[0].environment_fingerprint = "a".repeat(64);
  const declaration = { contract: "augnes.local-canonical-inputs.v2", path_kind: "canonical-conservative-v1",
    binding: { head: receipt.repository.head_sha, tree: receipt.repository.tree_sha, executor_fingerprint: receipt.executor.source_fingerprint,
      phase_environment_fingerprints: [{ id: "integration", fingerprint: "a".repeat(64) }] },
    resources: [{ id: "browser-executable", ...role, ...expected }] };
  receipt.inputs = { ...declaration, fingerprint: digest(declaration), checks: 1, events: benignSnapshot.events, first_fault: null };
  const browserIssues = r => inspectReceiptForDecision(finalizeReceipt(r), validContext).issues.filter(x => x.startsWith("receipt_browser_identity_invalid:"));
  assert.deepEqual(browserIssues(receipt), []);
  assert(!inspectReceiptForDecision(finalizeReceipt(receipt), validContext).issues.some(x => ["receipt_input_event_invalid", "receipt_input_observation_blocked"].includes(x)));
  const forgedEvent = structuredClone(receipt); forgedEvent.inputs.events[0].after.sha256 = "0".repeat(64);
  const e = forgedEvent.inputs.events[0]; e.identity = digest([e.resource, e.disposition, e.after]);
  assert(inspectReceiptForDecision(finalizeReceipt(forgedEvent), validContext).issues.includes("receipt_input_event_invalid"));
  for (const mutate of [r => r.phases[0].browser_use.pop(), r => r.phases[0].browser_use[0].runtime_versions.cdp = "Fixture/2.0",
    r => r.phases[0].browser_use[0].after.sha256 = "0".repeat(64), r => r.phases[0].status = "not_run"]) {
    const copy = structuredClone(receipt); mutate(copy); assert.equal(browserIssues(copy).length, 1);
  }
  findings.push("real phase executor and stock reader require all integration Browser uses, exact executable/version and settled exit; timeout exit0 and invented NOT_RUN records refuse");

  await successionControls();
} finally {
  if (!inFlight) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  assert(cleanupCanonicalTestResources([owner]).every(x => x.completed));
}
console.log(JSON.stringify({ status: "pass", checks: findings, cleanup_complete: true }));

async function successionControls() {
  const checkout = path.join(root, "candidate"); mkdirSync(checkout);
  const checkoutOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: checkout });
  const git = (...args) => execFileSync("git", args, { cwd: checkout, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const commit = label => { git("add", "scripts"); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", label); return git("rev-parse", "HEAD"); };
  try {
    git("init", "-b", "codex/fixture"); mkdirSync(path.join(checkout, "scripts"));
    const modulePath = "scripts/local-canonical-inputs.mjs", moduleFile = path.join(checkout, modulePath);
    write(moduleFile, "export const value=1;\n"); const oldHead = commit("original"), oldTree = git("rev-parse", "HEAD^{tree}");
    const artifacts = path.join(checkout, ".augnes-local-verification", "successor"); mkdirSync(artifacts);
    const receiptDir = path.join(checkout, ".augnes-local-verification", "receipts"); mkdirSync(receiptDir);
    const request = { anchorRoot: root, repositoryRoot: checkout, checkoutOwner, branch: "codex/fixture", head: oldHead, tree: oldTree, runId: "original", contractFingerprint: "a".repeat(64) };
    const priors = {};
    for (const disposition of ["completed_success", "safety_violation", "unknown_relevance", "unclassified_timeout", "unsettled"]) {
      const a = beginAttempt({ ...request, branch: `codex/${disposition}`, runId: disposition });
      const original = finalizeReceipt({ repository: { head_sha: oldHead, tree_sha: oldTree, base_sha: "0".repeat(40) }, run: { id: disposition },
        inputs: { first_fault: disposition === "safety_violation" ? { disposition, resource: "browser-executable" } : null }, outcome: { disposition }, cleanup: { completed: true } });
      write(path.join(receiptDir, `${disposition}.json`), original);
      if (disposition !== "unsettled") finishAttempt(a, { receiptFingerprint: original.integrity.content_fingerprint, disposition, cleanupComplete: true });
      priors[disposition] = { a, original };
    }
    const fixture = path.join(artifacts, "regression.mjs"); write(fixture, "import assert from 'node:assert/strict';const m=await import(process.argv[2]);assert.equal(m.value,2);\n");
    write(moduleFile, "export const value=1; // cosmetic change only\n");
    const cosmeticHead = commit("cosmetic source"), cosmeticTree = git("rev-parse", "HEAD^{tree}");
    const cosmeticResult = await child([fixture, pathToFileURL(moduleFile).href]); assert.equal(cosmeticResult.exit_code, 1);
    const cosmeticRecord = { fixture_sha256: digest(readFileSync(fixture)), environment_fingerprint: digest(env), source_sha256: digest(readFileSync(moduleFile)), result: cosmeticResult, node_version: process.versions.node, finished_at: new Date().toISOString() };
    write(path.join(artifacts, "cosmetic.json"), cosmeticRecord);
    write(moduleFile, "export const value=1;\n"); // Restore only this owned fixture's original source before its retained witness.
    const witnesses = {};
    for (const [kind, value] of [["before", 1], ["after", 2]]) {
      if (value === 2) { write(moduleFile, "export const value=2;\n"); commit("meaningful requested behavior"); }
      const result = await child([fixture, pathToFileURL(moduleFile).href]); assert.equal(result.exit_code, kind === "before" ? 1 : 0);
      const record = { fixture_sha256: digest(readFileSync(fixture)), environment_fingerprint: digest(env), source_sha256: digest(readFileSync(moduleFile)), result, node_version: process.versions.node, finished_at: new Date().toISOString() };
      write(path.join(artifacts, `${kind}.json`), record);
      witnesses[kind] = { artifact: `${kind}.json`, sha256: digest(readFileSync(path.join(artifacts, `${kind}.json`))), source_sha256: record.source_sha256 };
    }
    const head = git("rev-parse", "HEAD"), tree = git("rev-parse", "HEAD^{tree}");
    const makeProof = (key, kind, targetHead = head, targetTree = tree, extra = {}) => {
      const { a, original } = priors[key];
      const review = { schema: "augnes.local-canonical-candidate-review.v1", kind, head: targetHead, tree: targetTree, predecessor_head: oldHead, predecessor_tree: oldTree,
        source_review: "complete", addresses_disposition: key, addresses_resource: original.inputs?.first_fault?.resource ?? null, prior_fault_fingerprint: digest(original.inputs?.first_fault ?? null), authority_reference: "https://github.com/hynk-studio/augnes/issues/1530",
        reviewed_at: new Date().toISOString(), delta_sha256: digest(execFileSync("git", ["diff", "--binary", "--no-ext-diff", "--no-textconv", oldHead, targetHead, "--"], { cwd: checkout })),
        changed_paths: git("diff", "--name-only", oldHead, targetHead, "--").split("\n").sort() };
      write(path.join(artifacts, "review.json"), review);
      const proof = { schema: "augnes.local-canonical-source-correction.v2", kind, branch: a.branch, prior_family_id: a.family_id, prior_number: a.number,
        prior_attempt_id: a.attempt_id, prior_receipt_fingerprint: original.integrity.content_fingerprint, prior_receipt_path: `.augnes-local-verification/receipts/${key}.json`,
        head: targetHead, tree: targetTree, defect: "wrong_export", source_module: modulePath, fixture_artifact: "regression.mjs", fixture_sha256: digest(readFileSync(fixture)),
        environment_fingerprint: digest(env), ...witnesses, review: { artifact: "review.json", sha256: digest(readFileSync(path.join(artifacts, "review.json"))) }, ...extra };
      const file = path.join(artifacts, "proof.json"); write(file, proof); return readSourceCorrectionProof(file, checkout);
    };
    const successor = (key, proof, extra = {}) => beginAttempt({ ...request, branch: priors[key].a.branch, head: proof.head, tree: proof.tree, runId: `successor-${key}`, sourceCorrection: proof, ...extra });
    assert.throws(() => makeProof("completed_success", "source_revision", cosmeticHead, cosmeticTree, {
      after: { artifact: "cosmetic.json", sha256: digest(readFileSync(path.join(artifacts, "cosmetic.json"))), source_sha256: cosmeticRecord.source_sha256 }
    }), /source_correction_witness_invalid/);
    for (const key of ["unknown_relevance", "unclassified_timeout", "unsettled"]) assert.throws(() => successor(key, makeProof(key, "source_revision")));
    assert.throws(() => successor("safety_violation", makeProof("safety_violation", "source_revision")));
    assert.throws(() => successor("completed_success", makeProof("completed_success", "source_revision", oldHead, oldTree)));
    // An adversarial record for a newer attempt must block selecting the older
    // completion even when that older completion would otherwise qualify.
    const newer = path.join(root, ".augnes-local-verification", "families", priors.completed_success.a.family_id, "attempt-2.json");
    write(newer, { attempt_id: "unsettled-newer-attempt" });
    assert.throws(() => successor("completed_success", makeProof("completed_success", "source_revision")), /source_correction_predecessor_invalid/);
    rmSync(newer);
    for (const [key, kind] of [["completed_success", "source_revision"], ["safety_violation", "verifier_correction"]]) {
      const proof = makeProof(key, kind), a = successor(key, proof);
      assert.equal(a.number, 1); assert.equal(a.source_correction.prior_attempt_id, priors[key].a.attempt_id);
      finishAttempt(a, { receiptFingerprint: "b".repeat(64), disposition: "completed_success", cleanupComplete: true });
      const linked = { attempt: a, repository: { branch: a.branch }, run: { id: a.attempt_id }, integrity: { content_fingerprint: "b".repeat(64) }, outcome: { disposition: "completed_success" }, cleanup: { completed: true } };
      assert(inspectAttemptRecords({ anchorRoot: root, repositoryRoot: checkout, receipt: linked }));
      assert.throws(() => successor(key, proof), "wrapper restart cannot reset a successful candidate");
      assert.throws(() => beginAttempt({ ...request, branch: priors[key].a.branch, runId: "superseded-retry" }), /attempt_candidate_superseded/);
      write(path.join(artifacts, "review.json"), {}); assert(!inspectAttemptRecords({ anchorRoot: root, repositoryRoot: checkout, receipt: linked }));
    }
    // A pure accepted-main merge has its own exact two-parent/tree proof. It
    // does not relabel the predecessor, claim a defect fixed or need a fake fail.
    git("checkout", "-b", "main", oldHead); write(path.join(checkout, "scripts", "incoming.mjs"), "export const accepted=true;\n"); const main = commit("accepted main change");
    git("checkout", "-b", "integrate", oldHead); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "merge", "--no-ff", "--no-edit", main);
    const mergeHead = git("rev-parse", "HEAD"), mergeTree = git("rev-parse", "HEAD^{tree}");
    const a = beginAttempt({ ...request, branch: "codex/integration", runId: "integration-original" });
    const original = finalizeReceipt({ ...priors.completed_success.original, run: { id: a.attempt_id } }); write(path.join(receiptDir, "integration.json"), original);
    finishAttempt(a, { receiptFingerprint: original.integrity.content_fingerprint, disposition: "completed_success", cleanupComplete: true }); priors.integration = { a, original };
    await new Promise(resolve => setTimeout(resolve, 2));
    const proof = makeProof("integration", "accepted_main_integration", mergeHead, mergeTree, { accepted_main: main });
    assert.throws(() => successor("integration", proof, { acceptedMain: oldHead }));
    const merged = successor("integration", proof, { acceptedMain: main }); assert.equal(merged.number, 1);
    finishAttempt(merged, { receiptFingerprint: "c".repeat(64), disposition: "completed_success", cleanupComplete: true });
    assert.throws(() => successor("integration", proof, { acceptedMain: main }));
    findings.push("meaningful revision after PASS, proved verifier correction after safety stop and exact accepted-main merge have immutable successors; unknown/timeout/unsettled/cosmetic/restart/wrong-main/changed-proof controls refuse");
  } finally { releaseCheckoutVerificationOwnership(checkoutOwner, checkout); }
}
