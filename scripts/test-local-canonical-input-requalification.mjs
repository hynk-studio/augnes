import assert from "node:assert/strict";
import { appendFileSync, chmodSync, cpSync, existsSync, linkSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { validateAttemptAdmission, beginAttempt, finishAttempt, inspectAttemptRecords, inspectInputContinuationAvailability, readSourceCorrectionProof, readRecoveryProof } from "./local-canonical-attempts.mjs";
import { inspectInputRequalification, inspectInputPredecessor, readInputRequalificationProof, renewInputRequalificationBase, inputAdoptionInventory, validateBranchTrackingAddition } from "./local-canonical-input-requalification.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { freezeInputContract, monitorInputContract, digest, observeInputFile } from "./local-canonical-inputs.mjs";
import { finalizeReceipt } from "./local-canonical-receipt.mjs";
import { createFixture, runInvocation, prepareProof, stock, request, proofFile, write, read, git, commit, transport, tracking, immutableInventory, resourceList } from "./fixtures/input-requalification.mjs";

// A fresh process uses the same production stock readers and actual disposable
// Git/input state. No injected always-passing validator or old phase reuse.
if (process.argv[2] === "stock") {
  const f = read(process.argv[3]);
  const result = await stock(f, process.argv[4]);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(result.valid_deciding_evidence ? 0 : 1);
}
if (process.argv[2] === "compete") {
  const f = read(process.argv[3]), owner = acquireCheckoutVerificationOwnership({ repositoryRoot: f.checkout });
  try {
    write(process.argv[4], "ready\n");
    const deadline = Date.now() + 2000;
    while (!existsSync(process.argv[5]) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5));
    assert(existsSync(process.argv[5]));
    const proof = f.sourceProof ? null : readInputRequalificationProof(proofFile(f), f.checkout);
    const sourceCorrection = f.sourceProof ? readSourceCorrectionProof(path.join(f.checkout, f.sourceProof), f.checkout) : null;
    const recoveryProof = f.recoveryProof ? readRecoveryProof(path.join(f.checkout, f.recoveryProof)) : null;
    const frozen = freezeInputContract({ resources: resourceList(f, proof), pathKind: "isolated-model-free-v1", binding: { head: f.head, tree: f.tree, ...(proof ? { input_requalification: digest(proof) } : {}) } });
    frozen.check();
    const a = beginAttempt(request(f, { checkoutOwner: owner, runId: `competing-${process.pid}`, contractFingerprint: frozen.snapshot().fingerprint, inputs: frozen.snapshot(), inputRequalification: recoveryProof ? null : proof, sourceCorrection, recoveryProof }));
    // An intentionally uncompleted admission models a crash with no phase.
    process.stdout.write(`winner ${a.family_id} ${a.number}\n`);
  } catch (e) { process.stdout.write(`refused ${e.code ?? e.message}\n`); }
  finally { releaseCheckoutVerificationOwnership(owner, f.checkout); }
  process.exit(0);
}

const owned = createCanonicalTestResourceRoot("ag-resource-test-");
beginCanonicalTestResourceUse(owned);
let inFlight = 0;
const pendingChildren = new Set();
const findings = [], quiet = { write() {} };
const note = value => { findings.push(value); console.log(`[input-requalification] PASS ${value}`); };
const child = options => {
 const pending = (async () => {
  inFlight++;
  const result = await runCanonicalChild({ suite: "input-requalification-controls", command: process.execPath, cwd: owned.root,
    env: buildCanonicalChildEnvironment({ temporaryRoot: owned.root }), timeoutMs: 3000, stdout: quiet, stderr: quiet, ...options });
  const settled = result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
  if (settled) inFlight--;
  assert.equal(settled, true); return result;
 })();
 pendingChildren.add(pending);
 void pending.then(() => pendingChildren.delete(pending), () => pendingChildren.delete(pending));
 return pending;
};
const inspect = (f, proof) => inspectInputRequalification(request(f, { proof }));
function editedProof(f, proof, edit, assertion = () => assert.throws(() => inspect(f, readInputRequalificationProof(proofFile(f), f.checkout)))) {
  const file = proofFile(f), original = readFileSync(file), changed = structuredClone(proof); delete changed.local_relative_path;
  edit(changed); write(file, changed);
  try { assertion(); } finally { write(file, original); }
}
function editedOriginal(f, original, edit, assertion) {
  const file = path.join(f.checkout, original.relative), prior = readFileSync(file), completionFile = path.join(f.anchor, ".augnes-local-verification/families", original.attempt.family_id, "completion-1.json"), completion = readFileSync(completionFile);
  const changed = structuredClone(original.receipt); edit(changed); const sealed = finalizeReceipt(changed);
  write(file, sealed); write(completionFile, { ...read(completionFile), receipt_fingerprint: sealed.integrity.content_fingerprint });
  try { assertion(sealed); } finally { write(file, prior); write(completionFile, completion); }
}
try {
  const f = createFixture(owned.root, "complete");
  const first = await runInvocation(f, { mutate: true });
  assert.equal(first.receipt.outcome.disposition, "input_invalidation");
  assert.equal(first.results.length, 1); assert.equal(first.results[0].failure_code, "phase_cancelled");
  assert(first.receipt.phases.slice(1).every(p => p.status === "not_run"));
  assert.equal(first.receipt.cleanup.completed, true);
  assert.equal((await stock(f, first.relative)).valid_deciding_evidence, false);
  const proof = await prepareProof(f, first);
  inspect(f, proof);
  const beforeIntake = immutableInventory(f.parent);
  assert.equal(validateAttemptAdmission(request(f, { inputRequalification: proof })).number, 2);
  assert.deepEqual(immutableInventory(f.parent), beforeIntake);
  note("real Git-config mutation latches cancellation, settles, and read-only intake spends nothing");

  for (const [name, edit] of [
    ["missing authority", p => delete p.authority],
    ["wrong explicit input authority", p => p.authority.current_input_fingerprint = "0".repeat(64)],
    ["historical attribution invention", p => p.authority.historical_writer = "identified"],
    ["unresolved authority risk", p => p.authority.unresolved_risks.push("unknown authorization")],
    ["unknown change remainder", p => p.input.snapshots.pop()],
    ["wrong first fault", p => p.prior.fault_fingerprint = "0".repeat(64)],
    ["wrong original contract", p => p.prior.input_fingerprint = "0".repeat(64)],
    ["wrong current observation", p => p.input.current_observation.metadata.bytes = "1"],
    ["wrong target source", p => p.head = f.base],
    ["wrong authenticated base", p => p.accepted_main = f.head],
    ["changed history evidence", p => p.history_review.sha256 = "0".repeat(64)],
    ["changed source evidence", p => p.source_review.sha256 = "0".repeat(64)],
  ]) { editedProof(f, proof, edit); note(`refuses ${name}`); }
  const retained = path.join(f.checkout, first.relative), bytes = readFileSync(retained);
  write(retained, "{}"); assert.throws(() => inspect(f, proof)); write(retained, bytes);
  renameSync(retained, `${retained}.saved`); assert.throws(() => inspect(f, proof)); renameSync(`${retained}.saved`, retained);
  appendFileSync(retained, "\n"); assert.throws(() => inspect(f, proof), /input_requalification_predecessor_changed/u); write(retained, bytes);
  const log = path.join(f.checkout, first.receipt.phases[0].log.relative_path), logBytes = readFileSync(log);
  appendFileSync(log, "unreviewed remainder\n"); assert.throws(() => inspect(f, proof)); write(log, logBytes);
  const active = acquireCheckoutVerificationOwnership({ repositoryRoot: f.checkout });
  assert.throws(() => inspect(f, proof), /input_requalification_original_owner_active/u);
  releaseCheckoutVerificationOwnership(active, f.checkout);
  for (const [name, edit] of [
    ["independent assertion failure", r => { r.phases[0].failure_code = "phase_failed"; r.phases[0].exit_status = 1; }],
    ["unresolved timeout", r => r.phases[0].timed_out = true],
    ["incomplete settlement", r => r.cleanup.completed = false],
    ["unsettled child", r => r.phases[0].cleanup.remaining_owned_processes = 1],
    ["unreleased checkout", r => r.checkout_ownership.released = false],
    ["unreleased acquired capacity", r => r.capacity_ownership.released = false],
    ["incomplete historical cleanup", r => r.historical_inputs = { required: true, prepared: true, completed: false }],
    ["unexpected installed maintenance", r => r.cleanup.companion_service.maintenance_acquired = true],
    ["invalid preservation observation", r => r.cleanup.companion_service.observations.after.coherent = false],
    ["retained generated resource", r => r.cleanup.generated_next.present_after = true],
    ["observer overflow", r => r.inputs.observation_overflow = true],
    ["secondary safety", r => r.inputs.secondary_faults.push({ ...r.inputs.first_fault, resource: "credential_exposure", disposition: "safety_violation" })],
    ["unknown phase", r => r.phases[0].status = "unknown"],
  ]) {
    editedOriginal(f, first, edit, () => assert.throws(() => inspectInputPredecessor({ anchorRoot: f.anchor, repositoryRoot: f.checkout, receiptPath: first.relative })));
    note(`full predecessor inspection refuses ${name}`);
  }
  for (const change of ["\n[include]\n\tpath = /unreviewed\n", "\n[remote \"origin\"]\n\turl = https://example.invalid/unreviewed\n"]) assert.throws(() => validateBranchTrackingAddition(f.beforeConfig, Buffer.concat([f.beforeConfig, Buffer.from(change)])));
  const duplicateConfig = Buffer.concat([f.beforeConfig, Buffer.from('[Branch "duplicate"]\n  remote = another\n')]);
  assert.throws(() => validateBranchTrackingAddition(duplicateConfig, Buffer.concat([duplicateConfig, Buffer.from(tracking("duplicate"))])));
  for (const name of ["bad.lock", "bad/../name", ".hidden", "-option"]) assert.throws(() => validateBranchTrackingAddition(f.beforeConfig, Buffer.concat([f.beforeConfig, Buffer.from(tracking(name))])));
  const proofBytes = readFileSync(proofFile(f)); chmodSync(proofFile(f), 0o666); assert.throws(() => inspect(f, proof)); chmodSync(proofFile(f), 0o600);
  const alias = `${proofFile(f)}.alias`; linkSync(proofFile(f), alias); assert.throws(() => inspect(f, proof)); rmSync(alias);
  renameSync(proofFile(f), alias); symlinkSync(alias, proofFile(f)); assert.throws(() => inspect(f, proof)); rmSync(proofFile(f)); renameSync(alias, proofFile(f));
  assert.deepEqual(readFileSync(proofFile(f)), proofBytes);
  note("tampered/missing originals, full-log remainder, active owners, material config and unsafe artifact aliases refuse");

  const configForMonitor = path.join(owned.root, "monitor-input"); write(configForMonitor, "original\n");
  let ownerValid = true, observerValid = true;
  const monitored = freezeInputContract({ resources: [{ id: "git-config", file: configForMonitor, classification: "execution" }], pathKind: "canonical-conservative-v1", binding: {}, read: (...args) => { if (!observerValid) throw new Error("observer unavailable"); return observeInputFile(...args); } });
  const controller = new AbortController(), monitor = monitorInputContract(monitored, controller, { assertOwner: () => { if (!ownerValid) throw new Error("owner changed"); } });
  write(configForMonitor, "changed\n"); monitor.check(); const latched = monitored.snapshot().first_fault;
  ownerValid = false; monitor.check(); observerValid = false; monitor.check(); monitor.stop();
  assert.deepEqual(monitored.snapshot().first_fault, latched);
  assert(monitored.snapshot().secondary_faults.some(x => x.disposition === "safety_violation"));
  assert(monitored.snapshot().secondary_faults.some(x => x.disposition === "observer_failure"));
  note("first input fault stays latched while later ownership and observer faults remain visible");

  const second = await runInvocation(f, { proof });
  assert.equal(second.attempt.number, 2); assert.equal(second.results.length, 5);
  assert(second.results.every(p => p.status === "pass"));
  const valid = await stock(f, second.relative); assert.equal(valid.valid_deciding_evidence, true, JSON.stringify(valid));
  const fixtureFile = path.join(f.parent, "fixture.json"); write(fixtureFile, f);
  let freshOutput = "";
  const fresh = await child({ label: "fresh-stock", args: [fileURLToPath(import.meta.url), "stock", fixtureFile, second.relative], stdout: { write: b => freshOutput += b } });
  assert.equal(fresh.exit_code, 0, freshOutput);
  assert.deepEqual(readFileSync(retained), first.originalBytes);
  assert.equal((await stock(f, first.relative)).valid_deciding_evidence, false);
  assert.throws(() => validateAttemptAdmission(request(f, { inputRequalification: proof })), /attempt_budget_or_unsettled/u);
  assert.throws(() => validateAttemptAdmission(request(f, { branch: "codex/renamed" })), /attempt_existing_candidate_requires_lineage/u);
  const claim = path.join(f.anchor, ".augnes-local-verification/families", first.attempt.family_id, "continuation-claim-1.json"), claimBytes = readFileSync(claim);
  rmSync(claim); assert.equal(inspectAttemptRecords({ anchorRoot: f.anchor, repositoryRoot: f.checkout, receipt: second.receipt }), false); write(claim, claimBytes);
  const beforeStock = immutableInventory(f.parent); assert.equal((await stock(f, second.relative)).valid_deciding_evidence, true); assert.deepEqual(immutableInventory(f.parent), beforeStock);
  note("complete continuation passes fresh-process stock; original stays byte-identical/non-deciding, missing claim and third/relabelled attempts refuse");

  const drift = createFixture(owned.root, "second-drift"), driftFirst = await runInvocation(drift, { mutate: true }), driftProof = await prepareProof(drift, driftFirst);
  const beforeDrift = readFileSync(drift.config);
  const driftReview = path.join(path.dirname(proofFile(drift)), "history.json"), beforeReviewDrift = readFileSync(driftReview);
  const driftSecond = await runInvocation(drift, { proof: driftProof, beforeChildren: () => {
    appendFileSync(drift.config, tracking("after-second-freeze")); appendFileSync(driftReview, "\n");
  } });
  assert.equal(driftSecond.attempt.number, 2); assert.equal(driftSecond.results.length, 0);
  assert.equal(driftSecond.receipt.outcome.disposition, "input_invalidation"); assert.equal(driftSecond.receipt.cleanup.completed, true);
  assert(driftSecond.receipt.inputs.events.some(e => e.resource.startsWith("requalification-evidence-") && e.disposition === "input_invalidation"));
  write(drift.config, beforeDrift); write(driftReview, beforeReviewDrift);
  assert.throws(() => validateAttemptAdmission(request(drift, { inputRequalification: driftProof })), /attempt_budget_or_unsettled/u);
  note("drift after second admission consumes the slot before any child; restoration cannot authorize a third invocation");

  const adoption = createFixture(owned.root, "adoption"), adoptionFirst = await runInvocation(adoption, { mutate: true });
  const predecessor = adoption.head;
  appendFileSync(path.join(adoption.anchor, "shared.mjs"), "// accepted infrastructure registration\n");
  write(path.join(adoption.anchor, "infrastructure.mjs"), "export const infrastructure = true;\n");
  adoption.base = commit(adoption.anchor, "accepted infrastructure fixture");
  // The fixture builds a real two-parent merge with an explicitly reviewed
  // additive same-file resolution; no fabricated repair witness is required.
  assert.throws(() => git(adoption.checkout, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "merge", "--no-ff", "--no-commit", adoption.base));
  write(path.join(adoption.checkout, "shared.mjs"), "// base registration\n// retained task registration\n// accepted infrastructure registration\n");
  adoption.head = commit(adoption.checkout, "reviewed additive integration"); adoption.tree = git(adoption.checkout, "rev-parse", "HEAD^{tree}");
  const inv = inputAdoptionInventory(adoption.checkout, predecessor, adoption.base, adoption.head), divergent = inv.entries.filter(e => e.divergent);
  assert.equal(divergent.length, 1);
  const preservation = await child({ label: "additive-preservation", args: ["-e", `const fs=require('fs'); const assert=require('assert/strict'); const root=process.argv[1]; assert.equal(fs.readFileSync(root+'/task-assets.txt','utf8'),'retained task assets: adoption\\n'); const s=fs.readFileSync(root+'/shared.mjs','utf8'); for(const line of ['// retained task registration','// accepted infrastructure registration']) assert(s.includes(line)); assert(fs.readFileSync(root+'/infrastructure.mjs','utf8').includes('true'));`, adoption.checkout] });
  assert.equal(preservation.exit_code, 0);
  const preservationFile = path.join(path.dirname(proofFile(adoption)), "preservation.json");
  write(preservationFile, { schema: "augnes.local-canonical-integration-preservation.v1", head: adoption.head, tree: adoption.tree, delta_sha256: inv.delta_sha256,
    paths: divergent.map(e => e.path), node_version: process.versions.node, finished_at: new Date().toISOString(), result: preservation });
  const overlaps = divergent.map(e => ({ path: e.path, entries: e, kind: "reviewed_additive_overlap", review_reference: "https://github.com/hynk-studio/augnes/issues/1535", preservation: { artifact: "preservation.json", sha256: digest(readFileSync(preservationFile)) } }));
  const adoptionProof = await prepareProof(adoption, adoptionFirst, { kind: "accepted_main_adoption", overlaps });
  inspect(adoption, adoptionProof); await renewInputRequalificationBase({ repositoryRoot: adoption.checkout, proof: adoptionProof, transport: transport(adoption) });
  const reviewFile = path.join(path.dirname(proofFile(adoption)), "source.json"), reviewBytes = readFileSync(reviewFile);
  const noReview = read(reviewFile); noReview.overlaps = []; write(reviewFile, noReview);
  editedProof(adoption, adoptionProof, p => p.source_review.sha256 = digest(readFileSync(reviewFile)));
  write(reviewFile, reviewBytes);
  const goodHead = adoption.head, goodTree = adoption.tree;
  // Exact two-parent tree, but reversed ancestry, must be rejected before any
  // claim. Construction is confined to this disposable repository.
  adoption.head = git(adoption.checkout, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit-tree", goodTree, "-p", adoption.base, "-p", predecessor, "-m", "wrong ordered parents");
  const wrongParents = await prepareProof(adoption, adoptionFirst, { kind: "accepted_main_adoption", overlaps });
  assert.throws(() => inspect(adoption, wrongParents), /input_requalification_adoption_parents_invalid/u);
  adoption.head = goodHead;
  for (const [name, mutateTree] of [
    ["lost task asset", () => rmSync(path.join(adoption.checkout, "task-assets.txt"))],
    ["unreviewed unrelated edit", () => write(path.join(adoption.checkout, "unreviewed.mjs"), "unreviewed\n")],
    ["unreviewed overlap content", () => appendFileSync(path.join(adoption.checkout, "shared.mjs"), "// unrelated candidate insertion\n")],
  ]) {
    mutateTree(); git(adoption.checkout, "add", "."); git(adoption.checkout, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgSign=false", "commit", "--amend", "--no-edit", "-q");
    adoption.head = git(adoption.checkout, "rev-parse", "HEAD"); adoption.tree = git(adoption.checkout, "rev-parse", "HEAD^{tree}");
    const alteredInventory = inputAdoptionInventory(adoption.checkout, predecessor, adoption.base, adoption.head);
    const reviewedEntries = overlaps.map(overlap => ({ ...overlap, entries: alteredInventory.entries.find(e => e.path === overlap.path) }));
    const invalid = await prepareProof(adoption, adoptionFirst, { kind: "accepted_main_adoption", overlaps: reviewedEntries });
    assert.throws(() => inspect(adoption, invalid), name === "unreviewed overlap content" ? /input_requalification_unreviewed_resolution_content/u : undefined);
    git(adoption.checkout, "reset", "--hard", goodHead); adoption.head = goodHead; adoption.tree = goodTree;
    note(`adoption refuses ${name}`);
  }
  const restoredAdoptionProof = await prepareProof(adoption, adoptionFirst, { kind: "accepted_main_adoption", overlaps });
  git(adoption.anchor, "update-ref", "refs/heads/main", predecessor);
  await assert.rejects(() => renewInputRequalificationBase({ repositoryRoot: adoption.checkout, proof: restoredAdoptionProof, transport: transport(adoption) }), /integration_base_mismatch/u);
  git(adoption.anchor, "update-ref", "refs/heads/main", adoption.base);
  assert.equal(validateAttemptAdmission(request(adoption, { inputRequalification: restoredAdoptionProof })).number, 2);
  const adopted = await runInvocation(adoption, { proof: restoredAdoptionProof });
  assert.equal(adopted.attempt.family_id, adoptionFirst.attempt.family_id); assert.equal(adopted.attempt.number, 2);
  assert.equal((await stock(adoption, adopted.relative)).valid_deciding_evidence, true);
  assert.deepEqual(readFileSync(path.join(adoption.checkout, adoptionFirst.relative)), adoptionFirst.originalBytes);
  note("reviewed additive two-parent adoption preserves original assets and allowance; wrong parents, unreviewed overlaps and moved main refuse");

  const competing = createFixture(owned.root, "competing"), competingFirst = await runInvocation(competing, { mutate: true });
  await prepareProof(competing, competingFirst);
  const raceGate = path.join(competing.parent, "admit-gate"), requests = [], outputs = ["", ""];
  for (let n = 0; n < 2; n++) {
    const checkout = path.join(competing.parent, `racer-${n}`);
    git(competing.anchor, "worktree", "add", "--force", checkout, competing.branch);
    cpSync(path.join(competing.checkout, ".augnes-local-verification"), path.join(checkout, ".augnes-local-verification"), { recursive: true });
    const file = path.join(competing.parent, `racer-${n}.json`), ready = path.join(competing.parent, `ready-${n}`);
    write(file, { ...competing, checkout }); requests.push({ file, ready });
  }
  const racers = requests.map(({ file, ready }, n) => child({ label: `atomic-racer-${n}`, timeoutMs: 5000, args: [fileURLToPath(import.meta.url), "compete", file, ready, raceGate], stdout: { write: b => outputs[n] += b } }));
  const deadline = Date.now() + 2000;
  while (!requests.every(r => existsSync(r.ready)) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5));
  assert(requests.every(r => existsSync(r.ready))); write(raceGate, "admit\n");
  const raceResults = await Promise.all(racers); assert(raceResults.every(r => r.exit_code === 0));
  assert.equal(outputs.filter(x => x.startsWith("winner ")).length, 1, outputs.join("\n"));
  assert.equal(outputs.filter(x => x.startsWith("refused ")).length, 1, outputs.join("\n"));
  assert.throws(() => validateAttemptAdmission(request(competing, { inputRequalification: readInputRequalificationProof(proofFile(competing), competing.checkout) })));
  note("two fresh processes and different registered checkouts have one atomic winner; an unsettled no-phase claim remains spent after restart");

  const legacy = createFixture(owned.root, "legacy"), legacyFirst = await runInvocation(legacy, { mutate: true, legacyShape: true });
  assert.equal(legacyFirst.attempt.contract, "augnes.local-canonical-attempt-family.v1");
  const legacyProof = await prepareProof(legacy, legacyFirst), familyRoot = path.join(legacy.anchor, ".augnes-local-verification/families", legacyFirst.attempt.family_id);
  const legacyAttemptBytes = readFileSync(path.join(familyRoot, "attempt-1.json")), legacyCompletionBytes = readFileSync(path.join(familyRoot, "completion-1.json"));
  assert.equal(inspectInputContinuationAvailability({ anchorRoot: legacy.anchor, familyId: legacyFirst.attempt.family_id }).remaining_continuations, 1);
  assert.throws(() => validateAttemptAdmission(request(legacy, { branch: "codex/version-reset" })), /attempt_existing_candidate_requires_lineage/u);
  write(path.join(familyRoot, "attempt-2.json"), { attempt_id: "later-unsettled" });
  assert.throws(() => validateAttemptAdmission(request(legacy, { inputRequalification: legacyProof })), /attempt_budget_or_unsettled/u); rmSync(path.join(familyRoot, "attempt-2.json"));
  write(path.join(familyRoot, "correction-successor.json"), { family_id: "0".repeat(64) });
  assert.throws(() => validateAttemptAdmission(request(legacy, { inputRequalification: legacyProof })), /attempt_candidate_superseded/u); rmSync(path.join(familyRoot, "correction-successor.json"));
  const legacySecond = await runInvocation(legacy, { proof: legacyProof });
  assert.equal(legacySecond.attempt.contract, "augnes.local-canonical-attempt-family.v2");
  assert.equal(legacySecond.attempt.family_id, legacyFirst.attempt.family_id);
  assert.deepEqual(readFileSync(path.join(familyRoot, "attempt-1.json")), legacyAttemptBytes);
  assert.deepEqual(readFileSync(path.join(familyRoot, "completion-1.json")), legacyCompletionBytes);
  assert.deepEqual(readFileSync(path.join(legacy.checkout, legacyFirst.relative)), legacyFirst.originalBytes);
  const legacyFixture = path.join(legacy.parent, "fixture.json"); write(legacyFixture, legacy);
  let legacyOutput = "";
  assert.equal((await child({ label: "legacy-fresh-stock", args: [fileURLToPath(import.meta.url), "stock", legacyFixture, legacySecond.relative], stdout: { write: b => legacyOutput += b } })).exit_code, 0, legacyOutput);
  editedProof(legacy, legacyProof, p => p.authority.issued_at = new Date().toISOString(), () => assert.throws(() => validateAttemptAdmission(request(legacy, { inputRequalification: readInputRequalificationProof(proofFile(legacy), legacy.checkout) }))));
  note("v1 discovery and immutable originals survive v2 continuation; newer/superseded selection, branch/version reset and changed-proof replay refuse after fresh stock");

  const shared = createFixture(owned.root, "shared-allowance"), sharedFirst = await runInvocation(shared, { mutate: true }), sharedProof = await prepareProof(shared, sharedFirst);
  const interrupted = await runInvocation(shared, { proof: sharedProof, spawnFailure: true });
  assert.equal(interrupted.receipt.outcome.disposition, "infrastructure_interruption");
  assert.equal(interrupted.results[0].spawn_error_code, "ENOENT");
  assert.equal(interrupted.attempt.number, 2);
  const probe = await child({ label: "actual-recovery-probe", args: ["-e", "process.exit(0)"] });
  const repair = { schema: "augnes.local-canonical-infrastructure-repair.v1", prior_attempt_id: interrupted.attempt.attempt_id,
    prior_receipt_fingerprint: interrupted.receipt.integrity.content_fingerprint, cause: "child_spawn_failure", observed_code: "ENOENT", remedy: "use_owned_available_node",
    evidence_sha256: digest(interrupted.results[0]), scope: "task_owned", probe: { exit_status: probe.exit_code, cleanup_complete: probe.cleanup_completed, artifact_sha256: digest(probe), finished_at: new Date().toISOString() } };
  assert.throws(() => validateAttemptAdmission(request(shared, { recoveryProof: repair })), /attempt_budget_or_unsettled/u);
  assert.throws(() => validateAttemptAdmission(request(shared, { inputRequalification: sharedProof, recoveryProof: repair })), /attempt_identity_invalid/u);
  note("real spawn interruption after input continuation cannot acquire an infrastructure attempt 3; the two routes share one allowance");

  const cross = createFixture(owned.root, "source-competition"), crossFirst = await runInvocation(cross, { mutate: true });
  await prepareProof(cross, crossFirst);
  const sourceDir = path.join(cross.checkout, ".augnes-local-verification/source-proof"), regression = path.join(sourceDir, "regression.mjs");
  write(regression, "import assert from 'node:assert/strict'; const m=await import(process.argv[2]); assert.equal(m.value,2);\n");
  const modulePath = "scripts/local-canonical-inputs.mjs", witnesses = {}, oldHead = cross.head;
  for (const [kind, value] of [["before", 1], ["after", 2]]) {
    if (value === 2) { write(path.join(cross.checkout, modulePath), "export const value = 2;\n"); commit(cross.checkout, "disposable verifier fixture correction"); }
    const result = await child({ label: `source-competition-${kind}`, args: [regression, pathToFileURL(path.join(cross.checkout, modulePath)).href] });
    assert.equal(result.exit_code, kind === "before" ? 1 : 0);
    const record = { fixture_sha256: digest(readFileSync(regression)), environment_fingerprint: digest(buildCanonicalChildEnvironment({ temporaryRoot: owned.root })),
      source_sha256: digest(readFileSync(path.join(cross.checkout, modulePath))), result, node_version: process.versions.node, finished_at: new Date().toISOString() };
    const file = path.join(sourceDir, `${kind}.json`); write(file, record); witnesses[kind] = { artifact: `${kind}.json`, sha256: digest(readFileSync(file)), source_sha256: record.source_sha256 };
  }
  const corrected = { ...cross, head: git(cross.checkout, "rev-parse", "HEAD"), tree: git(cross.checkout, "rev-parse", "HEAD^{tree}") };
  const review = { schema: "augnes.local-canonical-candidate-review.v1", kind: "verifier_correction", head: corrected.head, tree: corrected.tree,
    predecessor_head: oldHead, predecessor_tree: cross.tree, source_review: "complete", addresses_disposition: "input_invalidation", addresses_resource: "git-config",
    prior_fault_fingerprint: digest(crossFirst.receipt.inputs.first_fault), authority_reference: "https://github.com/hynk-studio/augnes/issues/1535", reviewed_at: new Date().toISOString(),
    delta_sha256: digest(git(cross.checkout, "diff", "--binary", "--no-ext-diff", "--no-textconv", oldHead, corrected.head, "--") + "\n"), changed_paths: [modulePath] };
  write(path.join(sourceDir, "review.json"), review);
  const sourceProof = { schema: "augnes.local-canonical-source-correction.v2", kind: "verifier_correction", branch: cross.branch, head: corrected.head, tree: corrected.tree,
    prior_family_id: crossFirst.attempt.family_id, prior_number: 1, prior_attempt_id: crossFirst.attempt.attempt_id, prior_receipt_fingerprint: crossFirst.receipt.integrity.content_fingerprint,
    prior_receipt_path: crossFirst.relative, defect: "disposable_wrong_export", source_module: modulePath, fixture_artifact: "regression.mjs", fixture_sha256: digest(readFileSync(regression)),
    environment_fingerprint: digest(buildCanonicalChildEnvironment({ temporaryRoot: owned.root })), ...witnesses, review: { artifact: "review.json", sha256: digest(readFileSync(path.join(sourceDir, "review.json"))) } };
  write(path.join(sourceDir, "proof.json"), sourceProof);
  // Both immutable source intents pass their production evidence readers before
  // the race. No selected phase runs against the two competing intents.
  const parsedSource = readSourceCorrectionProof(path.join(sourceDir, "proof.json"), cross.checkout);
  assert.equal(validateAttemptAdmission(request(corrected, { sourceCorrection: parsedSource })).number, 1);
  const parsedInput = readInputRequalificationProof(proofFile(cross), cross.checkout);
  assert.equal(validateAttemptAdmission(request(cross, { inputRequalification: parsedInput })).number, 2);
  const crossGate = path.join(cross.parent, "cross-gate"), crossReady = [], crossOutputs = ["", ""], crossFiles = [];
  for (const [n, intent] of [cross, { ...corrected, sourceProof: ".augnes-local-verification/source-proof/proof.json" }].entries()) {
    const checkout = path.join(cross.parent, `intent-${n}`); git(cross.anchor, "worktree", "add", "--detach", checkout, intent.head);
    cpSync(path.join(cross.checkout, ".augnes-local-verification"), path.join(checkout, ".augnes-local-verification"), { recursive: true });
    const file = path.join(cross.parent, `intent-${n}.json`), ready = path.join(cross.parent, `intent-ready-${n}`); write(file, { ...intent, checkout }); crossFiles.push(file); crossReady.push(ready);
  }
  const crossChildren = crossFiles.map((file, n) => child({ label: `source-input-race-${n}`, timeoutMs: 5000, args: [fileURLToPath(import.meta.url), "compete", file, crossReady[n], crossGate], stdout: { write: b => crossOutputs[n] += b } }));
  const crossDeadline = Date.now() + 2000;
  while (!crossReady.every(p => existsSync(p)) && Date.now() < crossDeadline) await new Promise(resolve => setTimeout(resolve, 5));
  assert(crossReady.every(p => existsSync(p))); write(crossGate, "admit\n");
  assert((await Promise.all(crossChildren)).every(r => r.exit_code === 0));
  assert.equal(crossOutputs.filter(x => x.startsWith("winner ")).length, 1, crossOutputs.join("\n"));
  assert.equal(crossOutputs.filter(x => x.startsWith("refused ")).length, 1, crossOutputs.join("\n"));
  assert.throws(() => validateAttemptAdmission(request(cross, { inputRequalification: parsedInput })));
  assert.throws(() => validateAttemptAdmission(request(corrected, { sourceCorrection: parsedSource })));
  note("valid source-successor and input-continuation intents compete for the same atomic predecessor claim; neither loser can replay");

  const infrastructure = createFixture(owned.root, "infrastructure-competition"), infrastructureFirst = await runInvocation(infrastructure, { spawnFailure: true });
  assert.equal(infrastructureFirst.receipt.outcome.disposition, "infrastructure_interruption");
  // The input descriptor is deliberately ineligible for this disposition; it
  // competes against a substantiated recovery without gaining its own quota.
  await prepareProof(infrastructure, infrastructureFirst);
  const infraProbe = await child({ label: "infrastructure-remedy-probe", args: ["-e", "process.exit(0)"] });
  const repairDir = path.join(infrastructure.checkout, ".augnes-local-verification/repair");
  write(path.join(repairDir, "cause.json"), { prior_receipt_fingerprint: infrastructureFirst.receipt.integrity.content_fingerprint, spawn_error_code: "ENOENT" });
  write(path.join(repairDir, "probe.json"), infraProbe);
  write(path.join(repairDir, "proof.json"), { schema: "augnes.local-canonical-infrastructure-repair.v1", prior_attempt_id: infrastructureFirst.attempt.attempt_id,
    prior_receipt_fingerprint: infrastructureFirst.receipt.integrity.content_fingerprint, cause: "child_spawn_failure", observed_code: "ENOENT", remedy: "use_owned_available_node", scope: "task_owned",
    cause_artifact: "cause.json", evidence_sha256: digest(readFileSync(path.join(repairDir, "cause.json"))), probe_artifact: "probe.json",
    probe: { exit_status: 0, cleanup_complete: true, artifact_sha256: digest(readFileSync(path.join(repairDir, "probe.json"))), finished_at: new Date().toISOString() } });
  const infraProof = readRecoveryProof(path.join(repairDir, "proof.json"));
  assert.equal(validateAttemptAdmission(request(infrastructure, { recoveryProof: infraProof })).number, 2);
  const infraGate = path.join(infrastructure.parent, "infra-gate"), infraReady = [], infraOutputs = ["", ""], infraFiles = [];
  for (let n = 0; n < 2; n++) {
    const checkout = path.join(infrastructure.parent, `racer-${n}`); git(infrastructure.anchor, "worktree", "add", "--force", checkout, infrastructure.branch);
    cpSync(path.join(infrastructure.checkout, ".augnes-local-verification"), path.join(checkout, ".augnes-local-verification"), { recursive: true });
    const file = path.join(infrastructure.parent, `infra-${n}.json`), ready = path.join(infrastructure.parent, `infra-ready-${n}`);
    write(file, { ...infrastructure, checkout, ...(n === 0 ? { recoveryProof: ".augnes-local-verification/repair/proof.json" } : {}) }); infraFiles.push(file); infraReady.push(ready);
  }
  const infraChildren = infraFiles.map((file, n) => child({ label: `infrastructure-input-race-${n}`, timeoutMs: 5000, args: [fileURLToPath(import.meta.url), "compete", file, infraReady[n], infraGate], stdout: { write: b => infraOutputs[n] += b } }));
  const infraDeadline = Date.now() + 2000;
  while (!infraReady.every(p => existsSync(p)) && Date.now() < infraDeadline) await new Promise(resolve => setTimeout(resolve, 5));
  assert(infraReady.every(p => existsSync(p))); write(infraGate, "admit\n");
  assert((await Promise.all(infraChildren)).every(r => r.exit_code === 0));
  assert(infraOutputs[0].startsWith("winner "), infraOutputs.join("\n")); assert(infraOutputs[1].startsWith("refused "), infraOutputs.join("\n"));
  const infraClaim = read(path.join(infrastructure.anchor, ".augnes-local-verification/families", infrastructureFirst.attempt.family_id, "continuation-claim-1.json"));
  assert.equal(infraClaim.kind, "infrastructure_recovery");
  assert.throws(() => validateAttemptAdmission(request(infrastructure, { recoveryProof: infraProof })));
  note("infrastructure/input competition admits only the eligible recovery through the same claim and cannot reset the shared quota");

  const mixedProduct = createFixture(owned.root, "mixed-product"), mixedFirst = await runInvocation(mixedProduct, { mutate: true, nestedFailure: true });
  assert.equal(mixedFirst.receipt.outcome.disposition, "input_invalidation");
  assert.match(readFileSync(path.join(mixedProduct.checkout, mixedFirst.receipt.phases[0].log.relative_path), "utf8"), /independent-product-failure.*exit_code=1/u);
  const mixedProof = await prepareProof(mixedProduct, mixedFirst);
  assert.throws(() => inspect(mixedProduct, mixedProof), /input_requalification_independent_child_failure/u);
  const mixedSafety = createFixture(owned.root, "mixed-safety"), safetyFirst = await runInvocation(mixedSafety, { mutate: true,
    afterChildren: ({ monitor }) => { chmodSync(path.join(mixedSafety.parent, "instructions"), 0o644); monitor.check(); } });
  assert.equal(safetyFirst.receipt.outcome.disposition, "input_invalidation");
  assert(safetyFirst.receipt.inputs.secondary_faults.some(x => x.disposition === "safety_violation"));
  const safetyProof = await prepareProof(mixedSafety, safetyFirst);
  assert.throws(() => inspect(mixedSafety, safetyProof), /input_requalification_mixed_history/u);
  note("real failed nested child and later actual permission change cannot hide behind top-level input invalidation or a favorable review label");
} finally {
  await Promise.allSettled([...pendingChildren]);
  if (!inFlight) settleCanonicalTestResourceUse(owned, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  const [cleanup] = cleanupCanonicalTestResources([owned]);
  assert.equal(cleanup.completed, true, JSON.stringify(cleanup));
  console.log(`[input-requalification] cleanup completed=${cleanup.completed} findings=${findings.length}`);
}
