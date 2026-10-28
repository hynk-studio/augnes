import assert from "node:assert/strict";
import { chmodSync, existsSync, linkSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
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
import { observerControls } from "./fixtures/local-canonical-observer-controls.mjs";

const self = fileURLToPath(import.meta.url), repository = path.dirname(path.dirname(self));
const quiet = { write() {} }, write = (p, v) => writeFileSync(p, typeof v === "string" ? v : JSON.stringify(v), { mode: 0o600 });
const role = { classification: "execution", readOnlyExecutable: true };
const settled = r => r.cleanup_completed && r.exit_observed && r.streams_closed && r.remaining_owned_processes === 0;

if (process.argv[2] === "--observer-controls") {
  const owner = createCanonicalTestResourceRoot("ag-resource-test-");
  beginCanonicalTestResourceUse(owner);
  let controls;
  try { controls = await observerControls(owner.root, process.argv[3] ?? pathToFileURL(path.join(repository, "scripts/local-canonical-inputs.mjs")).href); }
  finally {
    settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    assert(cleanupCanonicalTestResources([owner])[0].completed);
  }
  console.log(JSON.stringify({ controls, cleanup_complete: true }));
  process.exit(controls.every(c => c.pass) ? 0 : 1);
}

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
  let observerOutput = "";
  const observer = await child([self, "--observer-controls"], { stdout: { write: b => { observerOutput = (observerOutput + b).slice(-16000); } } });
  assert.equal(observer.exit_code, 0, lastChildDiagnostic + observerOutput);
  findings.push("deterministic observation windows retain permitted aliases and sanitized failures; content, identity, ownership and native permissions remain protected");
  const executable = path.join(root, "read-only-browser"), alias = path.join(root, "alias");
  write(executable, "fixture executable\n"); chmodSync(executable, 0o700);
  const before = observeInputFile(executable, { readOnlyExecutable: true });
  const active = freezeInputContract({ resources: [{ id: "browser-executable", file: executable, ...role }], pathKind: "isolated-model-free-v1", binding: {} });
  const use = beginBrowserUse(executable, { consumer: "durable-work-surface", repositoryRoot: root, env: {}, emit() {} });
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
  let mutation, readyOutput = "", aliasWritten = false, mutationError = null;
  try {
    mutation = await child(["-e", "process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);process.stdout.write('alias-control-ready\\n');"], {
      signal: controller.signal, stdout: { write(chunk) {
        try {
          readyOutput += chunk.toString(); assert(readyOutput.length <= 1024);
          if (readyOutput === "alias-control-ready\n" && !aliasWritten) {
            // Keep monitoring active, but finish the fixture write in this
            // callback before observing it. A concurrent writer can correctly
            // cause observer_failure instead of the stable-byte classification
            // this particular control is meant to require.
            write(alias, "different executable"); aliasWritten = true; monitor.check();
          }
        } catch (error) { mutationError = error; controller.abort(error); }
      } },
    });
  } finally { monitor.stop(); }
  if (mutationError) throw mutationError;
  assert.equal(readyOutput, "alias-control-ready\n"); assert(aliasWritten);
  assert(mutation.cancelled); assert.equal(active.snapshot().first_fault.disposition, "input_invalidation");
  assert.equal(active.check({ force: true }).disposition, "input_invalidation");
  assert(active.snapshot().events.some(event => event.disposition === "input_invalidation" && event.after?.sha256 === digest("different executable")));
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
  await exactPathControls({
    name: "root-config", sourceModule: "next.config.ts", defect: "advisory_assessment",
    beforeSource: "export default { experimental: { agentUpgrade: 'security' } };\n",
    afterSource: "export default { experimental: { agentUpgrade: false } };\n",
    regression: "import assert from 'node:assert/strict'; const {default:config}=await import(process.argv[2]); assert.equal(config.experimental.agentUpgrade,false);\n",
  });
  await exactPathControls({
    name: "blank-state-return", sourceModule: "components/blank-state/blank-state-client.tsx", defect: "replayed_initial_activation",
    beforeSource: "export function initialTarget(replayed) { return replayed ? 'identity-input' : 'summary'; }\n",
    afterSource: "export function initialTarget() { return 'summary'; }\n",
    // This disposable module uses the exact admitted TSX path and ordinary JS
    // syntax. Loading its bytes as JS tests behavior without a JSX toolchain.
    regression: "import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs'; const {initialTarget}=await import('data:text/javascript,'+encodeURIComponent(readFileSync(new URL(process.argv[2]),'utf8'))); assert.equal(initialTarget(true),'summary');\n",
  });
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
    assert.throws(() => successor("completed_success", makeProof("completed_success", "source_revision")), /attempt_lineage_identity_invalid/);
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

// Exercise each narrow exact-path admission through the same reader, disposable
// append-only families and cold reconstruction used by production stock. These
// owned adversarial records are not real qualification history or run authority.
async function exactPathControls({ name, sourceModule, defect, beforeSource, afterSource, regression }) {
  const checkout = path.join(root, name); mkdirSync(checkout);
  const checkoutOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: checkout });
  const git = (...args) => execFileSync("git", args, { cwd: checkout, env, stdio: ["ignore", "pipe", "pipe"] });
  const commit = label => {
    git("add", sourceModule, "scripts");
    git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", label);
    return git("rev-parse", "HEAD").toString().trim();
  };
  const parse = file => JSON.parse(readFileSync(file, "utf8"));
  const checks = [];
  try {
    git("init", "-b", `codex/${name}`);
    mkdirSync(path.join(checkout, "scripts"));
    const readerFile = path.join(checkout, "scripts", "reader.mjs"); write(readerFile, "export const acceptsExactPath=false;\n");
    const moduleFile = path.join(checkout, sourceModule); mkdirSync(path.dirname(moduleFile), { recursive: true });
    write(moduleFile, beforeSource);
    const oldHead = commit("original exact-path source"), oldTree = git("rev-parse", "HEAD^{tree}").toString().trim();
    const artifacts = path.join(checkout, ".augnes-local-verification", "exact-path-correction"); mkdirSync(artifacts);
    const receiptDir = path.join(checkout, ".augnes-local-verification", "receipts"); mkdirSync(receiptDir);
    const request = { anchorRoot: checkout, repositoryRoot: checkout, checkoutOwner, head: oldHead, tree: oldTree, contractFingerprint: digest("disposable input contract") };
    const priors = {};
    for (const disposition of ["product_failure", "user_cancellation", "completed_success", "safety_violation", "input_invalidation", "infrastructure_interruption", "unknown_relevance", "unclassified_timeout", "unsettled", "cleanup_incomplete"]) {
      const a = beginAttempt({ ...request, branch: `codex/${name}-${disposition}`, runId: `${name}-${disposition}` });
      const outcome = disposition === "cleanup_incomplete" ? "product_failure" : disposition;
      const original = finalizeReceipt({ repository: { head_sha: oldHead, tree_sha: oldTree }, run: { id: a.attempt_id },
        inputs: { first_fault: { disposition: outcome, resource: name } }, outcome: { disposition: outcome }, cleanup: { completed: disposition !== "cleanup_incomplete" } });
      write(path.join(receiptDir, `${disposition}.json`), original);
      if (disposition !== "unsettled") finishAttempt(a, { receiptFingerprint: original.integrity.content_fingerprint, disposition: outcome, cleanupComplete: original.cleanup.completed });
      priors[disposition] = { a, original };
    }
    const fixture = path.join(artifacts, "regression.mjs");
    write(fixture, regression);
    const witnesses = {};
    for (const key of ["before", "after"]) {
      if (key === "after") {
        write(moduleFile, afterSource);
        write(readerFile, "export const acceptsExactPath=true;\n"); commit("correct behavior and admit exact path");
      }
      const result = await child([fixture, pathToFileURL(moduleFile).href]);
      assert.equal(result.exit_code, key === "before" ? 1 : 0);
      const record = { fixture_sha256: digest(readFileSync(fixture)), environment_fingerprint: digest(env), source_sha256: digest(readFileSync(moduleFile)),
        result, node_version: process.versions.node, finished_at: new Date().toISOString() };
      const file = path.join(artifacts, `${key}.json`); write(file, record);
      witnesses[key] = { artifact: `${key}.json`, sha256: digest(readFileSync(file)), source_sha256: record.source_sha256 };
    }
    const head = git("rev-parse", "HEAD").toString().trim(), tree = git("rev-parse", "HEAD^{tree}").toString().trim();
    const proofFile = path.join(artifacts, "proof.json"), reviewFile = path.join(artifacts, "review.json");
    const makeProof = (key = "product_failure", kind = "source_revision") => {
      const { a, original } = priors[key];
      const review = { schema: "augnes.local-canonical-candidate-review.v1", kind, head, tree, predecessor_head: oldHead, predecessor_tree: oldTree,
        source_review: "complete", authority_reference: "https://github.com/hynk-studio/augnes/issues/1545", reviewed_at: new Date().toISOString(),
        addresses_disposition: key, addresses_resource: name, prior_fault_fingerprint: digest(original.inputs.first_fault),
        delta_sha256: digest(git("diff", "--binary", "--no-ext-diff", "--no-textconv", oldHead, head, "--")),
        changed_paths: git("diff", "--name-only", oldHead, head, "--").toString().trim().split("\n").sort() };
      write(reviewFile, review);
      const proof = { schema: "augnes.local-canonical-source-correction.v2", kind, branch: a.branch, head, tree,
        prior_family_id: a.family_id, prior_number: 1, prior_attempt_id: a.attempt_id, prior_receipt_fingerprint: original.integrity.content_fingerprint,
        prior_receipt_path: `.augnes-local-verification/receipts/${key}.json`, source_module: sourceModule, defect,
        fixture_artifact: "regression.mjs", fixture_sha256: digest(readFileSync(fixture)), environment_fingerprint: digest(env), ...structuredClone(witnesses),
        review: { artifact: "review.json", sha256: digest(readFileSync(reviewFile)) } };
      write(proofFile, proof); return proof;
    };
    const readProof = () => readSourceCorrectionProof(proofFile, checkout);
    const successor = proof => beginAttempt({ ...request, branch: proof.branch, head: proof.head, tree: proof.tree, runId: `successor-${proof.branch.split("/").at(-1)}`, sourceCorrection: proof });
    const family = key => path.join(checkout, ".augnes-local-verification", "families", priors[key].a.family_id);
    const originalFiles = [proofFile, reviewFile, fixture, ...["before.json", "after.json"].map(name => path.join(artifacts, name)),
      ...Object.keys(priors).flatMap(key => [path.join(receiptDir, `${key}.json`), path.join(family(key), "attempt-1.json"),
        ...(key === "unsettled" ? [] : [path.join(family(key), "completion-1.json")])])];
    const saved = () => new Map(originalFiles.map(file => [file, readFileSync(file)]));
    const restore = bytes => { for (const [file, data] of bytes) { rmSync(file, { force: true }); writeFileSync(file, data, { mode: 0o600 }); } };
    const changeReview = (proof, mutate) => { const review = parse(reviewFile); mutate(review); write(reviewFile, review); proof.review.sha256 = digest(readFileSync(reviewFile)); };
    const changeWitness = (proof, key, mutate) => { const file = path.join(artifacts, proof[key].artifact), witness = parse(file); mutate(witness); write(file, witness); proof[key].sha256 = digest(readFileSync(file)); };
    const refused = (label, mutate, error, admission = false) => {
      const proof = makeProof(), bytes = saved();
      try {
        mutate(proof); write(proofFile, proof);
        assert.throws(() => admission ? successor(readProof()) : readProof(), error, label);
        assert(!existsSync(path.join(family("product_failure"), "correction-successor.json")), label);
        checks.push(label);
      } finally { restore(bytes); }
    };
    makeProof(); assert.equal(readProof().source_module, sourceModule);
    // Existing directory paths keep their reader interpretation; no generic
    // root-file, configuration suffix or components-prefix rule is added.
    for (const source_module of ["scripts/target.mjs", "app/Page.tsx", "lib/value.ts", "plugins/entry.cjs", "apps/client.js", "src/value.ts"]) {
      const proof = makeProof(); proof.source_module = source_module; write(proofFile, proof); assert.equal(readProof().source_module, source_module);
    }
    refused("v1 exact path", p => p.schema = "augnes.local-canonical-source-correction.v1", /source_correction_proof_invalid/);
    for (const name of ["next.config.js", "next.config.mjs", "next.config.ts.bak", "Next.config.ts", "other.config.ts", "index.ts", "package.json", "package-lock.json", "tsconfig.json", "./next.config.ts", "/next.config.ts", "../next.config.ts", "scripts/../next.config.ts", "next.config.ts/", "next.config.ts\n",
      "components/project-settings-link.tsx", "components/other.tsx", "components/blank-state/other.tsx", "components/blank-state/Blank-state-client.tsx", "components/blank-state/blank-state-client.ts", "components/blank-state/blank-state-client.tsx.bak",
      "./components/blank-state/blank-state-client.tsx", "/components/blank-state/blank-state-client.tsx", "../components/blank-state/blank-state-client.tsx", "components/blank-state/../blank-state/blank-state-client.tsx", "components//blank-state/blank-state-client.tsx", "components/blank-state/blank-state-client.tsx/", "components/blank-state/blank-state-client.tsx\n"]) {
      refused(`path ${JSON.stringify(name)}`, p => p.source_module = name, /source_correction_proof_invalid/);
    }
    for (const name of ["regression.mjs", "before.json", "after.json", "review.json"]) {
      refused(`missing ${name}`, () => rmSync(path.join(artifacts, name)), { code: "ENOENT" });
      refused(`tampered ${name}`, () => writeFileSync(path.join(artifacts, name), "\n", { flag: "a" }), /source_correction_fixture_changed|source_correction_witness_invalid|candidate_review_invalid/);
    }
    refused("fixture symlink", () => { rmSync(fixture); symlinkSync(moduleFile, fixture); }, /source_correction_fixture_changed/);
    refused("witness hardlink", () => { const file = path.join(artifacts, "after.json"); rmSync(file); linkSync(path.join(artifacts, "before.json"), file); }, /attempt_unsafe_record/);
    refused("different environment", p => changeWitness(p, "after", w => w.environment_fingerprint = digest("different environment")), /source_correction_witness_invalid/);
    refused("different fixture", p => changeWitness(p, "after", w => w.fixture_sha256 = digest("different regression")), /source_correction_witness_invalid/);
    for (const [key, value] of [["timed_out", true], ["cancelled", true], ["cleanup_completed", false], ["remaining_owned_processes", 1], ["exit_observed", false], ["streams_closed", false], ["termination_reason", "signal"]]) {
      refused(`witness ${key}`, p => changeWitness(p, "after", w => w.result[key] = value), /source_correction_witness_invalid/);
    }
    refused("noncanonical Node", p => changeWitness(p, "after", w => w.node_version = `v${process.versions.node}`), /source_correction_witness_invalid/);
    refused("witness order", p => changeWitness(p, "after", w => w.finished_at = parse(path.join(artifacts, "before.json")).finished_at), /source_correction_witness_order_invalid/);
    refused("predates settlement", p => changeWitness(p, "before", w => w.finished_at = "2000-01-01T00:00:00.000Z"), /source_correction_witness_predates_settlement/, true);
    refused("wrong Git source", p => { p.after.source_sha256 = digest("unrelated source"); changeWitness(p, "after", w => w.source_sha256 = p.after.source_sha256); }, /source_correction_source_mismatch/, true);
    refused("wrong tree", p => { p.tree = "0".repeat(40); changeReview(p, r => r.tree = p.tree); }, /source_correction_source_mismatch/, true);
    refused("unchanged predecessor head", p => { p.head = oldHead; changeReview(p, r => r.head = oldHead); }, /source_correction_predecessor_invalid/, true);
    refused("wrong branch", p => p.branch = "codex/unrelated", /source_correction_predecessor_invalid/, true);
    refused("wrong receipt", p => p.prior_receipt_fingerprint = digest("wrong receipt"), /source_correction_predecessor_invalid/, true);
    for (const [label, mutate] of [
      ["wrong delta", r => r.delta_sha256 = digest("partial delta")],
      ["incomplete paths", r => r.changed_paths = [sourceModule]],
      ["wrong predecessor source", r => r.predecessor_head = "0".repeat(40)],
      ["review before settlement", r => r.reviewed_at = "2000-01-01T00:00:00.000Z"],
    ]) refused(label, p => changeReview(p, mutate), /candidate_review_binding_invalid/, true);
    refused("tampered original receipt", () => { const file = path.join(receiptDir, "product_failure.json"), r = parse(file); r.outcome.disposition = "completed_success"; write(file, r); }, /candidate_review_binding_invalid/, true);
    for (const key of ["safety_violation", "input_invalidation", "infrastructure_interruption", "unknown_relevance", "unclassified_timeout", "unsettled", "cleanup_incomplete"]) {
      makeProof(key); assert.throws(() => successor(readProof()), key === "unsettled" ? { code: "ENOENT" } : /source_correction_predecessor_invalid/, key);
      assert(!existsSync(path.join(family(key), "correction-successor.json"))); checks.push(`predecessor ${key}`);
    }
    for (const key of ["safety_violation", "input_invalidation"]) {
      makeProof(key, "verifier_correction"); assert.throws(() => successor(readProof()), /candidate_guard_correction_unproven/);
      checks.push(`exact path verifier_correction ${key}`);
    }
    makeProof("product_failure", "accepted_main_integration"); assert.throws(() => successor(readProof()), /source_correction_predecessor_invalid/);
    checks.push("product failure is not accepted-main-only succession");
    const newer = path.join(family("product_failure"), "attempt-2.json"); write(newer, { attempt_id: "unsettled newer attempt" });
    makeProof(); assert.throws(() => successor(readProof()), /attempt_lineage_identity_invalid/); rmSync(newer); checks.push("older attempt selection");

    for (const key of ["product_failure", "user_cancellation", "completed_success"]) {
      makeProof(key); const proof = readProof(), attempt = successor(proof);
      assert.equal(attempt.number, 1); assert.equal(attempt.source_correction.prior_attempt_id, priors[key].a.attempt_id);
      finishAttempt(attempt, { receiptFingerprint: digest(key), disposition: "completed_success", cleanupComplete: true });
      const linked = { attempt, repository: { branch: attempt.branch }, run: { id: attempt.attempt_id }, integrity: { content_fingerprint: digest(key) }, outcome: { disposition: "completed_success" }, cleanup: { completed: true } };
      const stock = () => inspectAttemptRecords({ anchorRoot: checkout, repositoryRoot: checkout, receipt: linked });
      assert(stock(), key); checks.push(`reader admission stock ${key}`);
      const reservation = path.join(family(key), "correction-successor.json"), originalReservation = readFileSync(reservation);
      assert.throws(() => successor(proof), /attempt_latest_tip_required/);
      assert.throws(() => beginAttempt({ ...request, branch: proof.branch, runId: "superseded-recovery", recoveryProof: { schema: "augnes.local-canonical-infrastructure-repair.v1" } }), /attempt_candidate_superseded/);
      const alternate = { ...proof, defect: "different_successor" }; write(proofFile, alternate);
      assert.throws(() => successor(readProof()), /attempt_latest_tip_required/); write(proofFile, proof);
      assert.deepEqual(readFileSync(reservation), originalReservation); checks.push(`immutable successor ${key}`);
      for (const file of [proofFile, reviewFile, fixture, path.join(artifacts, "before.json"), path.join(artifacts, "after.json"),
        path.join(receiptDir, `${key}.json`), path.join(family(key), "attempt-1.json"), path.join(family(key), "completion-1.json"), reservation]) {
        const bytes = readFileSync(file);
        try { rmSync(file); assert(!stock(), `missing stock ${path.basename(file)}`); write(file, "{}"); assert(!stock(), `tampered stock ${path.basename(file)}`); }
        finally { writeFileSync(file, bytes, { mode: 0o600 }); }
        assert(stock(), `restored disposable ${path.basename(file)}`);
      }
      checks.push(`cold stock missing/tampered artifacts ${key}`);
    }
    findings.push({ exact_path: sourceModule, [`${name.replaceAll("-", "_")}_controls`]: checks });
  } finally { releaseCheckoutVerificationOwnership(checkoutOwner, checkout); }
}
