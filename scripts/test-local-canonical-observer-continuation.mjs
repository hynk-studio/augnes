import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { freezeInputContract, digest } from "./local-canonical-inputs.mjs";
import { readObserverContinuationProof, inspectObserverContinuation } from "./local-canonical-observer-continuation.mjs";
import { beginAttempt, validateAttemptAdmission, readSourceCorrectionProof } from "./local-canonical-attempts.mjs";
import { inspectSettledInputPredecessor, inspectRequalificationHistory, readInputRequalificationProof } from "./local-canonical-input-requalification.mjs";
import { prepareProof as prepareInputProof, proofFile as inputProofFile } from "./fixtures/input-requalification.mjs";
import { finalizeReceipt } from "./local-canonical-receipt.mjs";
import { createFixture, runInvocation, stock, request, resourceList, read, write, git, commit, injectObserverFault } from "./fixtures/observer-continuation.mjs";
import { proofFile, remoteFile, installRemoteDouble, copyInstrumentedOwners, buildSourceHistory, prepareObserverProof, legacyIntegrationClaim } from "./fixtures/observer-continuation-support.mjs";

if (["stock", "compete"].includes(process.argv[2])) {
  const f = read(process.argv[3]), restore = installRemoteDouble(f);
  try {
    if (process.argv[2] === "stock") {
      let result;
      try { result = await stock(f, process.argv[4]); }
      catch (error) { result = { valid_deciding_evidence: false, reason: error.code ?? "stock_reader_refused" }; }
      process.stdout.write(JSON.stringify(result)); process.exitCode = result.valid_deciding_evidence ? 0 : 1;
    } else {
      const owner = acquireCheckoutVerificationOwnership({ repositoryRoot: f.checkout });
      try {
        write(process.argv[4], "ready\n"); const limit = Date.now() + 3000;
        while (!fs.existsSync(process.argv[5]) && Date.now() < limit) await new Promise(r => setTimeout(r, 5));
        assert(fs.existsSync(process.argv[5]));
        const proof = readObserverContinuationProof(proofFile(f), f.checkout);
        const frozen = freezeInputContract({ resources: resourceList(f, proof), pathKind: "isolated-model-free-v1", binding: { head: f.head, tree: f.tree, observer_continuation: digest(proof) } });
        const route = f.competingRoute === "input" ? { inputRequalification: readInputRequalificationProof(inputProofFile(f), f.checkout) } :
          f.competingRoute === "recovery" ? { recoveryProof: read(path.join(f.checkout, ".augnes-local-verification/other-route/repair.json")) } :
          f.competingRoute === "source" ? { sourceCorrection: readSourceCorrectionProof(path.join(f.checkout, ".augnes-local-verification/other-route/source.json"), f.checkout) } : { observerContinuation: proof };
        const a = beginAttempt(request(f, { checkoutOwner: owner, ...route, inputs: frozen.snapshot(), currentResources: resourceList(f),
          runId: `observer-race-${process.pid}`, contractFingerprint: frozen.snapshot().fingerprint }));
        process.stdout.write(`winner ${a.number}\n`);
      } catch (e) { process.stdout.write(`refused ${e.code ?? e.message}\n`); }
      finally { releaseCheckoutVerificationOwnership(owner, f.checkout); }
    }
  } finally { restore(); }
} else {
  const mode = process.argv[2] ?? "admission", owner = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(owner);
  const findings = [], pending = new Set(); let restore = () => {}, inFlight = 0;
  const child = options => {
    inFlight++;
    const p = runCanonicalChild({ suite: "observer-continuation-controls", command: process.execPath, cwd: owner.root,
      env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), timeoutMs: 4000, stdout: { write() {} }, stderr: { write() {} }, ...options });
    const checked = p.then(r => {
      const settled = r.exit_observed && r.streams_closed && r.cleanup_completed && r.remaining_owned_processes === 0;
      if (settled) inFlight--; assert(settled); return r;
    });
    pending.add(checked); void checked.then(() => pending.delete(checked), () => pending.delete(checked)); return checked;
  };
  const note = value => { findings.push(value); console.log(`[observer-continuation] PASS ${value}`); };
  try {
    const f = createFixture(owner.root, `observer-${mode}`), first = await runInvocation(f, { mutate: true, observerFault: true, settledPrefix: "child", legacyShape: true });
    assert.equal(first.receipt.outcome.disposition, "unknown_relevance"); assert.equal(first.receipt.inputs.first_fault.disposition, "observer_failure");
    assert.equal(first.receipt.phases[0].status, "pass"); assert.equal(first.receipt.phases[1].failure_code, "phase_cancelled");
    assert(first.receipt.phases.slice(2).every(p => p.status === "not_run"));
    const family = path.join(f.anchor, ".augnes-local-verification/families", first.attempt.family_id), receiptPath = path.join(f.checkout, first.relative);
    const retained = [receiptPath, path.join(family, "attempt-1.json"), path.join(family, "completion-1.json")].map(file => ({ file, bytes: fs.readFileSync(file) }));
    const sources = buildSourceHistory(f), owners = copyInstrumentedOwners(f, first, sources.reviewed);
    const { proof, observer, fixture } = await prepareObserverProof(f, first, sources, owners, child);
    const attempts = await import(pathToFileURL(path.join(owners, "scripts/local-canonical-attempts.mjs")));
    restore = installRemoteDouble(f);
    const inspect = p => observer.inspectObserverContinuation(request(f, { proof: p, currentResources: fixture.resourceList(f) }));
    const admission = () => attempts.validateAttemptAdmission(request(f, { observerContinuation: proof, currentResources: fixture.resourceList(f) }));
    const inventory = () => {
      const rows = [], walk = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name); if (entry.isDirectory()) walk(file); else rows.push([file, digest(fs.readFileSync(file))]);
      } }; walk(f.parent); return rows.sort((a, b) => a[0].localeCompare(b[0]));
    };
    assert.throws(() => readObserverContinuationProof(proofFile(f), f.checkout), /observer_predecessor_not_supported/u);
    assert.throws(() => inspectObserverContinuation(request(f, { proof, currentResources: fixture.resourceList(f) })), /observer_predecessor_not_supported/u);
    const beforeIntake = inventory(); inspect(proof); assert.equal(admission().number, 2); assert.deepEqual(inventory(), beforeIntake);
    assert.equal(fs.existsSync(path.join(family, "continuation-claim-1.json")), false);
    note("production pins refuse synthetic family; copied identity literals exercise read-only intake without a claim");
    const superseded = path.join(family, "correction-successor.json");
    write(superseded, { retained_fixture: true });
    try { assert.throws(admission, /attempt_candidate_superseded/u); } finally { fs.rmSync(superseded); }
    assert.throws(() => attempts.validateAttemptAdmission(request(f, { branch: f.branch + "-reset" })), /attempt_existing_candidate_requires_lineage/u);
    const changeProof = (edit, expected) => {
      const file = proofFile(f), old = fs.readFileSync(file), p = read(file); edit(p); write(file, p);
      try { assert.throws(() => inspect(observer.readObserverContinuationProof(file, f.checkout)), expected); }
      finally { write(file, old); }
    };
    const changeArtifact = (name, edit, expected) => {
      const file = path.join(path.dirname(proofFile(f)), name), old = fs.readFileSync(file);
      try { const data = read(file); edit(data); write(file, data); changeProof(p => {
        if (name === "source.json") p.source_review.sha256 = digest(fs.readFileSync(file));
        else p.history_review.sha256 = digest(fs.readFileSync(file));
      }, expected); } finally { write(file, old); }
    };
    const freshStock = async (relative, expected) => {
      const state = path.join(f.parent, "state.json"); write(state, f); let output = "";
      const result = await child({ label: "fresh-stock", args: [path.join(owners, "scripts/test-local-canonical-observer-continuation.mjs"), "stock", state, relative], stdout: { write(b) { output += b; } } });
      assert.equal(result.exit_code, expected ? 0 : 1, output); assert.equal(JSON.parse(output).valid_deciding_evidence, expected);
    };
    if (mode === "admission") {
      for (const [label, edit, expected] of [
        ["version", p => p.schema += ".new", /observer_predecessor_not_supported/u],
        ["family", p => p.prior.family_id = "a".repeat(64), /observer_predecessor_not_supported/u],
        ["receipt", p => p.prior.receipt_bytes_sha256 = "b".repeat(64), /observer_predecessor_not_supported/u],
        ["owner hashes", p => p.owner_hashes.pop(), /observer_owner_source_changed/u],
        ["unknown input", p => { p.input_basis.resources[0].classification = "unknown"; p.input_basis.fingerprint = digest(p.input_basis.resources); }, /observer_current_input_changed/u],
        ["local authority label", p => { delete p.external; p.authority = { approved: true }; }, /observer_external_authority_missing/u],
      ]) { changeProof(edit, expected); note(`${label} cannot admit`); }
      changeArtifact("history.json", h => h.cancelled_children = [], /observer_child_settlement_review_missing/u);
      changeArtifact("history.json", h => h.logs.pop(), /history_incomplete/u);
      changeArtifact("source.json", s => s.chain.pop(), /observer_source_review_invalid/u);
      changeArtifact("source.json", s => s.chain[1].parents.reverse(), /observer_source_review_invalid/u);
      const savedHead = f.head, savedTree = f.tree, savedProof = fs.readFileSync(proofFile(f));
      const sourceFile = path.join(path.dirname(proofFile(f)), "source.json"), savedSource = fs.readFileSync(sourceFile);
      fs.rmSync(path.join(f.checkout, "task-assets.txt")); f.head = commit(f.checkout, "adversarial lost task asset"); f.tree = git(f.checkout, "rev-parse", "HEAD^{tree}");
      try {
        const source = read(sourceFile); source.chain = observer.observerSourceChain(f.checkout, first.attempt.head, f.head); write(sourceFile, source);
        const changed = read(proofFile(f)); changed.head = f.head; changed.tree = f.tree; changed.source_review.sha256 = digest(fs.readFileSync(sourceFile)); write(proofFile(f), changed);
        assert.throws(() => inspect(observer.readObserverContinuationProof(proofFile(f), f.checkout)), /observer_source_review_invalid/u);
      } finally {
        git(f.checkout, "reset", "--hard", savedHead); f.head = savedHead; f.tree = savedTree; write(sourceFile, savedSource); write(proofFile(f), savedProof);
      }
      const integration = path.join(path.dirname(proofFile(f)), "integration.json"), savedIntegration = fs.readFileSync(integration);
      const edited = read(integration); edited.overlaps.pop(); write(integration, edited);
      try { changeArtifact("source.json", s => s.integration.sha256 = digest(fs.readFileSync(integration)), /overlap_unreviewed/u); }
      finally { write(integration, savedIntegration); }
      note("missing history/cancelled-child accounting, omitted delta, wrong parents and unreviewed overlap refuse");
      const remotePath = remoteFile(f), saved = fs.readFileSync(remotePath);
      for (const label of ["missing grant", "local forged grant", "dismissed review", "other source", "main movement", "edited body", "bot issuer"]) {
        const records = read(remotePath), review = records["repos/hynk-studio/augnes/pulls/1536/reviews/1"], grant = records["repos/hynk-studio/augnes/issues/comments/2"];
        if (label === "missing grant") delete records["repos/hynk-studio/augnes/issues/comments/2"];
        if (label === "local forged grant") grant.user.login = "untrusted";
        if (label === "dismissed review") review.state = "DISMISSED";
        if (label === "other source") review.commit_id = sources.reviewed;
        if (label === "main movement") records["repos/hynk-studio/augnes/branches/main"].commit.sha = "f".repeat(40);
        if (label === "edited body") grant.body += "edited";
        if (label === "bot issuer") grant.user.type = "Bot";
        write(remotePath, records); try { assert.throws(admission, /observer_/u); } finally { write(remotePath, saved); }
        note(`${label} refuses authenticated-record intake`);
      }
      const active = acquireCheckoutVerificationOwnership({ repositoryRoot: f.checkout });
      try { assert.throws(admission, /original_owner_active/u); } finally { releaseCheckoutVerificationOwnership(active, f.checkout); }
      write(path.join(f.checkout, "unreviewed.txt"), "unreviewed\n"); try { assert.throws(admission, /observer_source_moved/u); } finally { fs.rmSync(path.join(f.checkout, "unreviewed.txt")); }
      const file = proofFile(f), alias = `${file}.alias`;
      fs.chmodSync(file, 0o666); try { assert.throws(admission, /unsafe_artifact/u); } finally { fs.chmodSync(file, 0o600); }
      fs.linkSync(file, alias); try { assert.throws(admission, /unsafe_artifact/u); } finally { fs.rmSync(alias); }
      fs.renameSync(file, alias); fs.symlinkSync(alias, file);
      try { assert.throws(admission, /unsafe_path/u); } finally { fs.rmSync(file); fs.renameSync(alias, file); }
      note("active owner and dirty/unreviewed source refuse before mutation");
      note("complete inventory refuses lost task assets; proof permissions, hardlinks and symlinks stay blocking");
      const second = await fixture.runInvocation(f, { proof }); assert(second.receipt.phases.every(p => p.status === "pass"));
      await freshStock(second.relative, true);
      assert.equal((await fixture.stock(f, first.relative)).valid_deciding_evidence, false);
      assert.throws(admission, /attempt_budget_or_unsettled/u);
      note("complete five-phase invocation, fresh-process fixture stock, shared claim and permanent third refusal");
    } else if (mode === "history") {
      const completionPath = path.join(family, "completion-1.json"), savedCompletion = fs.readFileSync(completionPath);
      for (const label of ["product failure", "incomplete cleanup", "timeout", "secondary safety", "overflow", "mutable observer", "unobserved exit", "open streams"]) {
        const r = structuredClone(first.receipt);
        if (label === "product failure") { r.phases[0].status = "failure"; r.phases[0].exit_status = 1; }
        if (label === "incomplete cleanup") r.cleanup.completed = false;
        if (label === "timeout") r.phases[0].timed_out = true;
        if (label === "secondary safety") r.inputs.secondary_faults.push({ ...r.inputs.first_fault, disposition: "safety_violation" });
        if (label === "overflow") r.inputs.observation_overflow = true;
        if (label === "mutable observer") r.inputs.resources.find(x => x.id === "browser-executable").readOnlyExecutable = false;
        if (label === "unobserved exit") r.phases[0].cleanup.exit_observed = false;
        if (label === "open streams") r.phases[0].cleanup.streams_closed = false;
        const sealed = finalizeReceipt(r); write(receiptPath, sealed); write(completionPath, { ...JSON.parse(savedCompletion), receipt_fingerprint: sealed.integrity.content_fingerprint });
        try { assert.throws(() => inspectSettledInputPredecessor({ anchorRoot: f.anchor, repositoryRoot: f.checkout, receiptPath: first.relative }, "browser-observer")); }
        finally { write(receiptPath, first.originalBytes); write(completionPath, savedCompletion); }
        note(`${label} refused by shared complete-history reader`);
      }
      const p = first.receipt.phases[0], file = path.join(f.checkout, p.log.relative_path), old = fs.readFileSync(file);
      const lines = old.toString().trimEnd().split("\n"), summary = JSON.parse(lines.pop()); summary.results = [];
      write(file, lines.join("\n") + "\n" + JSON.stringify(summary) + "\n");
      try {
        assert.throws(admission, /log_changed/u);
        // Also reach the owner predicate with internally consistent synthetic
        // log hashes, rather than claiming a hash mismatch proves that rule.
        const historyPath = path.join(path.dirname(proofFile(f)), "history.json"), savedHistory = fs.readFileSync(historyPath);
        const original = structuredClone(first.receipt), history = read(historyPath), bytes = fs.readFileSync(file);
        original.phases[0].log.bytes = bytes.length;
        history.logs[0].bytes = bytes.length; history.logs[0].sha256 = digest(bytes); history.phases_fingerprint = digest(original.phases); write(historyPath, history);
        try { assert.throws(() => inspectRequalificationHistory(proofFile(f), { ...proof, history_review: { ...proof.history_review, sha256: digest(fs.readFileSync(historyPath)) } }, original), /independent_child_failure/u); }
        finally { write(historyPath, savedHistory); }
      } finally { write(file, old); }
      note("partial owner return refuses even with internally consistent synthetic log hashes");
      const second = await fixture.runInvocation(f, { proof, beforeChildren: ({ monitor }) => injectObserverFault(f, monitor) });
      assert.equal(second.receipt.outcome.disposition, "unknown_relevance"); assert(second.receipt.phases.every(p => p.status === "not_run"));
      assert.throws(admission); assert.equal((await fixture.stock(f, second.relative)).valid_deciding_evidence, false);
      note("post-admission observer failure spends invocation 2 before any phase and stock refuses");
    } else if (mode.startsWith("race")) {
      // These other routes have their own reader-valid local records, but this
      // observer predecessor is intentionally outside their admitted classes.
      // Existing input controls separately race two admissible route intents.
      if (mode === "race-input") await prepareInputProof(f, first);
      if (mode === "race-recovery") write(path.join(f.checkout, ".augnes-local-verification/other-route/repair.json"), {
        schema: "augnes.local-canonical-infrastructure-repair.v1", prior_attempt_id: first.attempt.attempt_id,
        prior_receipt_fingerprint: first.receipt.integrity.content_fingerprint, cause: "child_spawn_failure", observed_code: "ENOENT",
        remedy: "disposable_claim_only", evidence_sha256: "e".repeat(64), scope: "task_owned",
        probe: { exit_status: 0, cleanup_complete: true, artifact_sha256: "f".repeat(64), finished_at: new Date().toISOString() },
      });
      if (mode === "race-source") legacyIntegrationClaim(f, first);
      const gate = path.join(f.parent, "race-gate"), requests = [], outputs = ["", ""];
      for (let n = 0; n < 2; n++) {
        const checkout = path.join(f.parent, `racer-${n}`); git(f.anchor, "worktree", "add", "--force", checkout, f.branch);
        fs.cpSync(path.join(f.checkout, ".augnes-local-verification"), path.join(checkout, ".augnes-local-verification"), { recursive: true });
        const file = path.join(f.parent, `race-${n}.json`), ready = path.join(f.parent, `ready-${n}`);
        write(file, { ...f, checkout, ...(n === 1 && mode !== "race" ? { competingRoute: mode.slice(5) } : {}) }); requests.push({ file, ready });
      }
      const runners = requests.map((r, n) => child({ label: `atomic-observer-${n}`, timeoutMs: 6000, args: [path.join(owners, "scripts/test-local-canonical-observer-continuation.mjs"), "compete", r.file, r.ready, gate], stdout: { write(b) { outputs[n] += b; } } }));
      const until = Date.now() + 3000; while (!requests.every(r => fs.existsSync(r.ready)) && Date.now() < until) await new Promise(r => setTimeout(r, 5));
      assert(requests.every(r => fs.existsSync(r.ready))); write(gate, "admit\n");
      const settled = await Promise.all(runners); assert(settled.every(r => r.exit_code === 0));
      assert.equal(outputs.filter(o => o.includes("winner 2")).length, 1, outputs.join("\n"));
      for (const route of [{ observerContinuation: proof }, { inputRequalification: proof }, { recoveryProof: { schema: "augnes.local-canonical-infrastructure-repair.v1" } }, { sourceCorrection: proof }])
        assert.throws(() => attempts.validateAttemptAdmission(request(f, { ...route, currentResources: fixture.resourceList(f) })));
      assert.throws(() => attempts.validateAttemptAdmission(request(f, { branch: f.branch + "-reset" })));
      note(`${mode}: two fresh processes/checkouts have exactly one winner; observer/input/recovery/source/branch reset cannot recover spent allowance`);
    } else if (["drift", "ownership", "cancel"].includes(mode)) {
      const configBefore = fs.readFileSync(f.config);
      const leaseFile = path.join(f.checkout, ".augnes-local-verification/checkout-owner.json"), displacedLease = `${leaseFile}.fixture`;
      const second = await fixture.runInvocation(f, { proof, beforeChildren: ({ monitor, controller }) => {
        if (mode === "drift") fs.appendFileSync(f.config, '[branch "later"]\nremote=origin\nmerge=refs/heads/later\n');
        if (mode === "ownership") fs.renameSync(leaseFile, displacedLease);
        if (mode === "cancel") controller.abort();
        monitor.check();
      }, afterChildren: () => { if (mode === "ownership") fs.renameSync(displacedLease, leaseFile); } });
      assert(second.receipt.phases.every(p => p.status === "not_run"));
      if (mode !== "cancel") assert.equal(second.receipt.outcome.disposition, mode === "drift" ? "input_invalidation" : "safety_violation");
      else assert.notEqual(second.receipt.outcome.disposition, "completed_success");
      assert.throws(admission); assert.equal((await fixture.stock(f, second.relative)).valid_deciding_evidence, false);
      if (mode === "drift") write(f.config, configBefore);
      assert.throws(admission, /attempt_budget_or_unsettled/u);
      note(`${mode} after second freeze spends invocation 2, prevents every phase and refuses stock/third attempt even after restoring input bytes`);
    } else if (mode === "reinspection") {
      const second = await fixture.runInvocation(f, { proof });
      await freshStock(second.relative, true);
      const beforeStock = inventory(); assert.equal((await fixture.stock(f, second.relative)).valid_deciding_evidence, true); assert.deepEqual(inventory(), beforeStock);
      const claimPath = path.join(family, "continuation-claim-1.json"), remotePath = remoteFile(f);
      for (const [label, file, mutate] of [
        ["missing original", receiptPath, () => null], ["missing proof", proofFile(f), () => null],
        ["missing atomic claim", claimPath, () => null], ["changed proof bytes", proofFile(f), bytes => Buffer.concat([bytes, Buffer.from("\n")])],
        ["main movement", remotePath, bytes => { const data = JSON.parse(bytes); data["repos/hynk-studio/augnes/branches/main"].commit.sha = "f".repeat(40); return data; }],
        ["revoked grant", remotePath, bytes => { const data = JSON.parse(bytes); delete data["repos/hynk-studio/augnes/issues/comments/2"]; return data; }],
      ]) {
        const saved = fs.readFileSync(file), changed = mutate(saved); if (changed === null) fs.rmSync(file); else write(file, changed);
        try { await freshStock(second.relative, false); } finally { write(file, saved); }
        note(`fresh-process stock refuses ${label}`);
      }
      assert.throws(admission, /attempt_budget_or_unsettled/u); assert(fs.existsSync(claimPath));
      note("read-only restarted stock does not change originals or claims; restored proof cannot replay spent allowance");
      write(path.join(f.checkout, "later-source.txt"), "new source cannot refresh this family\n");
      f.head = commit(f.checkout, "disposable source after continuation"); f.tree = git(f.checkout, "rev-parse", "HEAD^{tree}");
      const successor = attempts.readSourceCorrectionProof(legacyIntegrationClaim(f, second), f.checkout);
      assert.throws(() => attempts.validateAttemptAdmission(request(f, { sourceCorrection: successor })), /observer_family_source_successor_refused/u);
      assert.throws(() => attempts.validateAttemptAdmission(request(f, { branch: f.branch + "-new-wrapper" })), /attempt_existing_candidate_requires_lineage/u);
      note("new committed source and reader-valid legacy source proof cannot create a third invocation after observer PASS");
    } else throw new Error("unknown observer control mode");
    for (const x of retained) assert.deepEqual(fs.readFileSync(x.file), x.bytes);
    note("original receipt, input/fault history and legacy attempt/completion bytes remain immutable");
    console.log(JSON.stringify({ schema: "augnes.observer-continuation-controls.v1", mode, findings, instrumentation: read(path.join(f.parent, "instrumentation.json")), historical_cause: "UNKNOWN", qualification: "NOT_RUN", fixture_stock_not_production_cli: true }));
  } finally {
    await Promise.allSettled([...pending]); restore();
    if (inFlight === 0) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    const [cleanup] = cleanupCanonicalTestResources([owner]); assert(cleanup.completed, JSON.stringify(cleanup));
  }
}
