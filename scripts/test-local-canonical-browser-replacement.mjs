import assert from "node:assert/strict";
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { fixtureCandidate, fixtureAuthority, fixtureWrite, refreshFixtureBinding } from "./fixtures/browser-input-contract.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, buildCanonicalChildEnvironment, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse } from "./canonical-test-environment.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { createGitHubBrowserAuthorizationTransport } from "./github-main-branch-transport.mjs";
import { readBrowserReplacementProof, validateBrowserReplacementPredecessor, authorizeBrowserReplacement, assertBrowserReplacementAuthorization } from "./local-canonical-browser-replacement.mjs";
import { readBrowserInputBinding } from "./local-canonical-browser-input.mjs";
import { beginAttempt, finishAttempt, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof } from "./local-canonical-attempts.mjs";
import { digest } from "./local-canonical-inputs.mjs";
import { finalizeReceipt, inspectReceiptForDecision } from "./local-canonical-receipt.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "./local-canonical-review-export.mjs";
import { readStockBrowserInput } from "./run-local-canonical-verification.mjs";
import { ensureMachineFingerprint, readMachineFingerprint } from "./local-canonical-environment.mjs";
const read = file => JSON.parse(readFileSync(file, "utf8"));
const self = fileURLToPath(import.meta.url);
const transport = records => createGitHubBrowserAuthorizationTransport({ runner: async request => {
  assert.equal(request.operation, "fetch_browser_authority"); assert(request.args.includes("GET"));
  const url = request.args[1];
  if (url.includes("/reviews/")) return structuredClone(records.review);
  if (url.includes("/comments/")) return structuredClone(records.grant);
  return { permission: "admin", user: { login: "fixture-owner" } };
} });
const live = (proof, checkout) => ({ browserInput: readBrowserInputBinding(proof.browser_input_path, checkout), executorFingerprint: proof.executor_fingerprint,
  environmentFingerprint: proof.environment_fingerprint, workloadFingerprint: proof.workload_fingerprint, commonInputsSha256: proof.common_inputs_sha256 });

if (["--stock", "--claim"].includes(process.argv[2])) {
  const packet = read(process.argv[3]), proof = readBrowserReplacementProof(packet.relative, packet.checkout);
  const authorization = await authorizeBrowserReplacement(proof, { transport: transport(packet.authority) });
  if (process.argv[2] === "--stock") {
    const receipt = read(packet.receipt);
    const selected = readStockBrowserInput(receipt, packet.checkout);
    assert.equal(digest(selected.publicBinding), digest(receipt.browser_input));
    assert.equal(readMachineFingerprint(path.join(packet.anchor, ".augnes-local-verification")), packet.machine);
    assert(inspectAttemptRecords({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, receipt, browserAuthorization: authorization, browserLive: live(proof, packet.checkout) }));
    const positive = inspectReceiptForDecision(receipt, { currentBrowserInputValid: true, currentInputStateValid: true, currentAttemptRecordsValid: true });
    assert(!positive.issues.includes("receipt_browser_input_invalid"));
    // The deliberately failed synthetic receipt is still non-deciding. Its
    // new input dimension must pass independently, then refuse missing state.
    assert.equal(positive.valid_deciding_evidence, false);
    assert(inspectReceiptForDecision(receipt, { currentBrowserInputValid: false }).issues.includes("receipt_browser_input_invalid"));
    assert(inspectPrivateReviewExport(createPrivateReviewExport(receipt)).structurally_valid);
    console.log("fresh_process_readonly_lineage_input_dimension_export_pass; failed_fixture_remains_non_deciding");
  } else {
    let owner;
    try {
      owner = acquireCheckoutVerificationOwnership({ repositoryRoot: packet.checkout });
      await delay(Math.max(0, packet.start - Date.now()));
      const attempt = beginAttempt({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, checkoutOwner: owner, branch: proof.branch,
        head: proof.head, tree: proof.tree, acceptedMain: proof.base, runId: packet.runId, contractFingerprint: "4".repeat(64),
        ...(packet.kind === "source" ? { sourceCorrection: readSourceCorrectionProof(path.join(packet.checkout, ".augnes-local-verification/browser/source-proof.json"), packet.checkout) } :
          { browserReplacement: proof, browserAuthorization: authorization, browserLive: live(proof, packet.checkout) }) });
      finishAttempt(attempt, { receiptFingerprint: "5".repeat(64), disposition: "product_failure", cleanupComplete: true });
      console.log("claim_won");
    } catch (error) { console.log(`claim_refused:${error.code}`); process.exitCode = 1; }
    finally { if (owner) releaseCheckoutVerificationOwnership(owner, packet.checkout, { consumersSettled: true }); }
  }
} else {
  const owner = createCanonicalTestResourceRoot("ag-resource-test-"), root = owner.root, checks = [];
  const owners = new Map(); let activeChildren = 0;
  beginCanonicalTestResourceUse(owner);
  const make = name => {
    const checkout = path.join(root, name), anchor = path.join(root, name + "-anchor"); mkdirSync(checkout); mkdirSync(anchor);
    const checkoutOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: checkout }); owners.set(checkout, checkoutOwner);
    return fixtureCandidate({ checkout, anchor, checkoutOwner });
  };
  const saveProof = c => fixtureWrite(path.join(c.checkout, c.relative), c.proof);
  const authorize = async c => authorizeBrowserReplacement(readBrowserReplacementProof(c.relative, c.checkout), { transport: transport(c.authority) });
  const begin = (c, auth, extra = {}) => beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.checkoutOwner, branch: c.branch,
    head: c.head, tree: c.tree, acceptedMain: c.base, runId: "replacement", contractFingerprint: "6".repeat(64),
    browserReplacement: readBrowserReplacementProof(c.relative, c.checkout), browserAuthorization: auth, browserLive: c.live, ...extra });
  const child = async (args, cwd) => {
    activeChildren++; let text = "";
    const result = await runCanonicalChild({ suite: "browser-replacement-control", label: args[1], command: process.execPath, args, cwd,
      env: buildCanonicalChildEnvironment({ temporaryRoot: root }), timeoutMs: 10000, stdout: { write(b) { text += b; } }, stderr: { write(b) { text += b; } }, log() {} });
    assert(result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0); activeChildren--;
    return { result, text };
  };
  const sourceProof = async c => {
    const folder = path.join(c.checkout, ".augnes-local-verification/browser"), module = "scripts/local-canonical-inputs.mjs";
    const regression = path.join(folder, "regression.mjs"); fixtureWrite(regression, "import assert from 'node:assert/strict';import fs from 'node:fs';assert.match(fs.readFileSync(process.argv[2],'utf8'),/version=2/);\n");
    const witnesses = {};
    for (const [kind, ref, exit] of [["before", c.base, 1], ["after", c.head, 0]]) {
      const file = path.join(folder, `${kind}-source.mjs`), bytes = c.git("show", `${ref}:${module}`); writeFileSync(file, bytes, { mode: 0o600 });
      const run = await child([regression, file], c.checkout); assert.equal(run.result.exit_code, exit, run.text);
      const record = { fixture_sha256: digest(readFileSync(regression)), source_sha256: digest(bytes), environment_fingerprint: digest(buildCanonicalChildEnvironment({ temporaryRoot: root })),
        node_version: process.versions.node, result: run.result, finished_at: new Date().toISOString() };
      fixtureWrite(path.join(folder, `${kind}.json`), record); witnesses[kind] = { artifact: `${kind}.json`, sha256: digest(readFileSync(path.join(folder, `${kind}.json`))), source_sha256: record.source_sha256 };
    }
    const review = { schema: "augnes.local-canonical-candidate-review.v1", kind: "verifier_correction", head: c.head, tree: c.tree, predecessor_head: c.base, predecessor_tree: c.receipt.repository.tree_sha,
      source_review: "complete", addresses_disposition: "safety_violation", addresses_resource: "browser-executable", prior_fault_fingerprint: digest(c.receipt.inputs.first_fault),
      authority_reference: "https://github.com/hynk-studio/augnes/issues/1545", reviewed_at: new Date().toISOString(), delta_sha256: c.proof.delta_sha256, changed_paths: c.proof.changed_paths };
    fixtureWrite(path.join(folder, "review.json"), review);
    const proof = { schema: "augnes.local-canonical-source-correction.v2", kind: "verifier_correction", branch: c.branch, head: c.head, tree: c.tree, prior_family_id: c.prior.family_id, prior_number: 1,
      prior_attempt_id: c.prior.attempt_id, prior_receipt_fingerprint: c.proof.prior_receipt_fingerprint, prior_receipt_path: c.proof.prior_receipt_path,
      defect: "fixture_behavior", source_module: module, fixture_artifact: "regression.mjs", fixture_sha256: digest(readFileSync(regression)), environment_fingerprint: digest(buildCanonicalChildEnvironment({ temporaryRoot: root })),
      ...witnesses, review: { artifact: "review.json", sha256: digest(readFileSync(path.join(folder, "review.json"))) } };
    const location = path.join(folder, "source-proof.json"); fixtureWrite(location, proof); return readSourceCorrectionProof(location, c.checkout);
  };
  try {
    const c = make("positive");
    // This exact existing Browser owner supplies complete-file syntax and
    // failure-propagation controls; it is not a general test-path exemption.
    fixtureWrite(path.join(c.checkout, "scripts/test-browser-verification-owners.mjs"), "export const syntaxControl = true;\n");
    c.git("add", "scripts/test-browser-verification-owners.mjs");
    c.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "Browser syntax owner");
    c.head = c.git("rev-parse", "HEAD").toString().trim();
    c.tree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
    Object.assign(c.proof, { head: c.head, tree: c.tree,
      delta_sha256: digest(c.git("diff", "--binary", "--no-ext-diff", "--no-textconv", c.base, c.head, "--")),
      changed_paths: c.git("diff", "--name-only", c.base, c.head, "--").toString().trim().split("\n").sort() });
    c.authority = fixtureAuthority(c.proof); saveProof(c);
    assert.equal(readBrowserReplacementProof(c.relative, c.checkout).changed_paths.includes("scripts/test-browser-verification-owners.mjs"), true);
    checks.push("exact Browser syntax-owner delta accepted through real reader and later disposable admission");
    const originalReceipt = structuredClone(c.receipt);
    for (const [name, mutate] of [
      ["secondary credential fault", r => r.inputs.secondary_faults.push({ resource: "credential_exposure", disposition: "safety_violation" })],
      ["missing retained event", r => r.inputs.events = []],
      ["tampered event", r => r.inputs.events[0].after.sha256 = "0".repeat(64)],
      ["unknown event", r => r.inputs.events.push({ resource: "unknown", disposition: "unknown_relevance" })],
      ["ownership not released", r => r.checkout_ownership.released = false],
      ["cleanup incomplete", r => r.cleanup.completed = false],
      ["product phase fault", r => r.phases[0].status = "failure"],
      ["timeout", r => r.phases[0].timed_out = true],
      ["input-only disposition", r => r.outcome.disposition = "input_invalidation"],
      ["missing source inventory", r => r.inputs.resources.pop()],
    ]) { const r = structuredClone(originalReceipt); mutate(r); assert.throws(() => validateBrowserReplacementPredecessor(finalizeReceipt(r)), undefined, name); checks.push(name + " refused"); }
    validateBrowserReplacementPredecessor(originalReceipt);
    let auth = await authorize(c);
    assert.throws(() => assertBrowserReplacementAuthorization(c.proof, { observations: auth.observations }));
    for (const [name, mutate, expectedCode] of [
      ["missing authority", p => delete p.authorization], ["unknown contract", p => p.contract = "future"], ["wrong head", p => p.head = "0".repeat(40)],
      ["wrong tree", p => p.tree = "0".repeat(40)], ["wrong delta", p => p.delta_sha256 = "0".repeat(64)],
      ["product delta", p => p.changed_paths = ["package.json"]], ["unsafe delta", p => p.changed_paths = ["../outside"]],
      ["unregistered neighboring test delta", p => p.changed_paths = ["scripts/test-browser-verification-owners-extra.mjs"], "browser_replacement_product_delta_refused"],
      ["missing evidence", p => p.evidence = []], ["tampered evidence", p => p.evidence[0].sha256 = "0".repeat(64)],
      ["wrong artifact", p => p.browser_input_sha256 = "0".repeat(64)], ["recovery budget", p => p.budget.recovery = 1],
    ]) {
      const original = structuredClone(c.proof); mutate(c.proof); saveProof(c);
      await assert.rejects(async () => { const p = readBrowserReplacementProof(c.relative, c.checkout); const a = await authorizeBrowserReplacement(p, { transport: transport(c.authority) }); begin(c, a); }, expectedCode ? { code: expectedCode } : undefined, name);
      c.proof = original; saveProof(c); checks.push(name + " refused");
    }
    for (const mutate of [r => r.review.user.type = "Bot", r => r.review.commit_id = "0".repeat(40), r => r.grant.issue_url += "0", r => r.review.body += "tampered", r => r.review.state = "DISMISSED"]) {
      const records = structuredClone(c.authority); mutate(records); await assert.rejects(() => authorizeBrowserReplacement(readBrowserReplacementProof(c.relative, c.checkout), { transport: transport(records) }));
    }
    checks.push("authenticated exact review/grant attribution, tampering, wrong owner surface and dismissed review refused");
    auth = await authorize(c);
    for (const key of ["environmentFingerprint", "executorFingerprint", "workloadFingerprint", "commonInputsSha256"]) assert.throws(() => begin(c, auth, { browserLive: { ...c.live, [key]: "0".repeat(64) } }), /live_binding/);
    for (const key of ["head", "tree", "acceptedMain", "branch"]) assert.throws(() => begin(c, auth, { [key]: key === "branch" ? "codex/other" : "0".repeat(40) }));
    assert.throws(() => begin(c, auth, { recoveryProof: {} }), /mixed/);
    assert.throws(() => begin(c, auth, { sourceCorrection: {} }), /mixed/);
    checks.push("live environment/executor/workload/common inputs/source/base/branch and mixed-kind refusal");
    const priorRoot = path.join(c.anchor, ".augnes-local-verification/families", c.prior.family_id), completionPath = path.join(priorRoot, "completion-1.json");
    const completion = readFileSync(completionPath); rmSync(completionPath); assert.throws(() => begin(c, auth)); writeFileSync(completionPath, completion, { mode: 0o600 });
    for (const extra of [{ contract: "future" }, { finished_at: "invalid" }, { cleanup_complete: false }]) {
      fixtureWrite(completionPath, { ...JSON.parse(completion), ...extra }); assert.throws(() => begin(c, auth));
    }
    writeFileSync(completionPath, completion, { mode: 0o600 });
    fixtureWrite(path.join(priorRoot, "attempt-2.json"), { ...c.prior, number: 2, attempt_id: "newer" }); assert.throws(() => begin(c, auth), /latest_tip/); rmSync(path.join(priorRoot, "attempt-2.json"));
    checks.push("unsettled and older-attempt predecessor refused");
    const attempt = begin(c, auth);
    const receipt = finalizeReceipt({ ...structuredClone(c.receipt), receipt_version: 5,
      repository: { ...c.receipt.repository, head_sha: c.head, tree_sha: c.tree, base_sha: c.base }, run: { ...c.receipt.run, id: attempt.attempt_id },
      attempt, browser_input: c.binding.publicBinding, browser_guard: { acquired: true, released: true, run_id: attempt.attempt_id },
      evidence: { ...c.receipt.evidence, mode: "full" },
      inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, browser_input: c.binding.publicBinding },
        resources: [...c.receipt.inputs.resources, { id: "browser-bundle", browserBundle: true, before: c.binding.publicBinding.bundle }] },
      outcome: { disposition: "product_failure" }, cleanup: { ...c.receipt.cleanup, completed: true } });
    finishAttempt(attempt, { receiptFingerprint: receipt.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
    const receiptPath = path.join(c.checkout, ".augnes-local-verification/receipts/replacement.json"); fixtureWrite(receiptPath, receipt);
    assert(inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt, browserAuthorization: auth, browserLive: c.live }));
    assert.throws(() => begin(c, auth), /latest_tip/);
    assert.throws(() => begin(c, auth, { browserReplacement: null, recoveryProof: {} }));
    assert.throws(() => begin(c, auth, { browserReplacement: null, sourceCorrection: { ...c.proof, prior_family_id: attempt.family_id, prior_attempt_id: attempt.attempt_id } }), /latest_tip/);
    const changed = structuredClone(c.proof); changed.authorization.grant_comment_id = 203; fixtureWrite(path.join(c.checkout, c.relative), changed);
    await assert.rejects(() => authorize(c)); saveProof(c);
    checks.push("one input successor; replay, renamed grant, recovery and source-correction detour refused");
    const machineRoot = path.join(c.anchor, ".augnes-local-verification"), machine = ensureMachineFingerprint(machineRoot);
    const machineFile = path.join(machineRoot, "machine-id"), stat = file => {
      const s = lstatSync(file, { bigint: true }); return ["dev", "ino", "mode", "uid", "gid", "size", "mtimeNs", "ctimeNs"].map(k => String(s[k]));
    };
    const machineBefore = [stat(machineRoot), stat(machineFile)];
    assert.equal(readMachineFingerprint(machineRoot), machine); assert.deepEqual([stat(machineRoot), stat(machineFile)], machineBefore);
    chmodSync(machineFile, 0o644); assert.throws(() => readMachineFingerprint(machineRoot)); assert.equal(lstatSync(machineFile).mode & 0o777, 0o644); chmodSync(machineFile, 0o600);
    const machineBytes = readFileSync(machineFile); rmSync(machineFile); assert.throws(() => readMachineFingerprint(machineRoot)); assert(!existsSync(machineFile)); writeFileSync(machineFile, machineBytes, { mode: 0o600 });
    const packet = { checkout: c.checkout, anchor: c.anchor, relative: c.relative, authority: c.authority, receipt: receiptPath, machine };
    const packetPath = path.join(root, "stock-packet.json"); fixtureWrite(packetPath, packet);
    const before = digest(treeBytes(c.anchor)), beforeMetadata = [stat(machineRoot), stat(machineFile)]; const fresh = await child([self, "--stock", packetPath], c.checkout);
    assert.equal(fresh.result.exit_code, 0, fresh.text); assert.equal(before, digest(treeBytes(c.anchor)));
    assert.deepEqual([stat(machineRoot), stat(machineFile)], beforeMetadata);
    assert.equal(readStockBrowserInput({ receipt_version: 4 }, c.checkout), null);
    for (const bad of [{ ...receipt, receipt_version: 4 }, { ...receipt, receipt_version: 999 }, { ...receipt, browser_input: null }]) assert.throws(() => readStockBrowserInput(bad, c.checkout));
    checks.push("stock selected-input reader refuses downgrade/unknown/missing binding; machine identity byte/metadata read-only, missing/unsafe state not repaired");
    checks.push("separate fresh-process production lineage/input-dimension/export reconstruction; failed fixture remains non-deciding; original anchor bytes unchanged");
    const exported = createPrivateReviewExport(receipt); assert(inspectPrivateReviewExport(exported).structurally_valid);
    const unknown = structuredClone(exported); unknown.schema = "future"; assert(!inspectPrivateReviewExport(unknown).structurally_valid);
    assert.throws(() => createPrivateReviewExport(finalizeReceipt({ ...receipt, receipt_version: 999 })), /version_unsupported/);
    for (const r of [ { ...receipt, receipt_version: 4 }, { ...receipt, browser_input: null }, { ...receipt, receipt_version: 999 } ]) {
      const issues = inspectReceiptForDecision(finalizeReceipt(r), {}).issues;
      assert(issues.some(i => /browser_input|version_mismatch/.test(i)));
    }
    checks.push("versioned export and deciding reader reject downgrade, missing selection and unknown version");
    const edgePath = path.join(priorRoot, "correction-successor.json"), edgeBytes = readFileSync(edgePath);
    for (const mutate of [e => e.contract = "future", e => delete e.contract, e => e.unknown = true, e => e.family_id = c.prior.family_id]) {
      const edge = JSON.parse(edgeBytes); mutate(edge); fixtureWrite(edgePath, edge);
      assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch }));
      assert(!inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt, browserAuthorization: auth, browserLive: c.live }));
    }
    writeFileSync(edgePath, edgeBytes, { mode: 0o600 });
    const nextAttemptPath = path.join(c.anchor, ".augnes-local-verification/families", attempt.family_id, "attempt-1.json"), nextAttemptBytes = readFileSync(nextAttemptPath);
    fixtureWrite(nextAttemptPath, { ...attempt, browser_replacement: { ...attempt.browser_replacement, contract: "future" } });
    assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch }));
    writeFileSync(nextAttemptPath, nextAttemptBytes, { mode: 0o600 });
    checks.push("unknown edge/attempt versions, stripped edge version, extra fields and cyclic lineage refuse without repair");

    const crash = make("crash"), crashRoot = path.join(crash.anchor, ".augnes-local-verification/families", crash.prior.family_id);
    fixtureWrite(path.join(crashRoot, "correction-successor.json"), { contract: "augnes.local-canonical-successor.v2", kind: "browser_input_replacement", family_id: "f".repeat(64), head: crash.head, tree: crash.tree, proof_fingerprint: digest(crash.proof) });
    assert.throws(() => reconstructAttemptTip({ anchorRoot: crash.anchor, branch: crash.branch }));
    await assert.rejects(async () => begin(crash, await authorize(crash)));
    assert(existsSync(path.join(crashRoot, "correction-successor.json")));
    checks.push("crash after exclusive claim/before attempt refuses without reset or repair");

    const cross = make("cross-kind"), crossAuth = await authorize(cross), correction = await sourceProof(cross);
    const corrected = beginAttempt({ anchorRoot: cross.anchor, repositoryRoot: cross.checkout, checkoutOwner: cross.checkoutOwner, branch: cross.branch, head: cross.head, tree: cross.tree,
      runId: "source-kind-wins", contractFingerprint: "2".repeat(64), sourceCorrection: correction });
    finishAttempt(corrected, { receiptFingerprint: "3".repeat(64), disposition: "product_failure", cleanupComplete: true });
    assert.throws(() => begin(cross, crossAuth), /latest_tip/);
    const oldEdgePath = path.join(cross.anchor, ".augnes-local-verification/families", cross.prior.family_id, "correction-successor.json"), oldEdgeBytes = readFileSync(oldEdgePath);
    fixtureWrite(oldEdgePath, { ...JSON.parse(oldEdgeBytes), kind: "unknown_unversioned_kind" });
    assert.throws(() => reconstructAttemptTip({ anchorRoot: cross.anchor, branch: cross.branch }), /edge_invalid/);
    writeFileSync(oldEdgePath, oldEdgeBytes, { mode: 0o600 });
    checks.push("genuine source-correction admission consumes the same predecessor edge; Browser kind cannot claim it again");

    const concurrent = make("concurrent"), second = path.join(root, "concurrent-second");
    await sourceProof(concurrent);
    cpSync(concurrent.checkout, second, { recursive: true, verbatimSymlinks: true });
    // The copied lease is fixture material, not a second owner. Remove it only
    // in the never-admitted clone before acquiring the supported local owner.
    rmSync(path.join(second, ".augnes-local-verification/checkout-owner.json"));
    const binding2 = refreshFixtureBinding(second), proof2 = structuredClone(concurrent.proof);
    proof2.browser_input_sha256 = digest(binding2.publicBinding); const authority2 = fixtureAuthority(proof2); fixtureWrite(path.join(second, concurrent.relative), proof2);
    releaseCheckoutVerificationOwnership(concurrent.checkoutOwner, concurrent.checkout, { consumersSettled: true }); owners.delete(concurrent.checkout);
    const start = Date.now() + 500, packets = [ { checkout: concurrent.checkout, authority: concurrent.authority, kind: "browser" }, { checkout: second, authority: authority2, kind: "source" } ].map((v, i) => ({ ...v, anchor: concurrent.anchor, relative: concurrent.relative, start, runId: `concurrent-${i}` }));
    const files = packets.map((v, i) => { const file = path.join(root, `claim-${i}.json`); fixtureWrite(file, v); return file; });
    const race = await Promise.all(files.map((file, i) => child([self, "--claim", file], packets[i].checkout)));
    assert.equal(race.filter(r => r.result.exit_code === 0).length, 1, JSON.stringify(race));
    assert.equal(race.filter(r => r.result.exit_code === 1).length, 1); checks.push("two simultaneous physical checkouts, Browser versus source correction: exactly one cross-kind claim wins");
  } finally {
    for (const [checkout, checkoutOwner] of owners) releaseCheckoutVerificationOwnership(checkoutOwner, checkout, { consumersSettled: activeChildren === 0 });
    if (!activeChildren) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    assert(cleanupCanonicalTestResources([owner]).every(r => r.completed));
  }
  console.log(JSON.stringify({ status: "pass", controls: checks, cleanup_complete: true, real_attempts_created: 0 }));
}
function treeBytes(root) {
  return readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(e => e.isDirectory() ? treeBytes(path.join(root, e.name)) : [[path.join(root, e.name), digest(readFileSync(path.join(root, e.name)))]]);
}
