// Disposable, explicitly synthetic authority. No production transport or ledger.
import { AUXILIARY_EXECUTION_BUDGETS } from "../local-canonical-closeout-budgets.mjs";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync, chmodSync, linkSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { digest, observeInputFile } from "../local-canonical-inputs.mjs";
import { OBSERVER_REPAIR_SCHEMA, OBSERVER_RETAINED_SOURCES, observerAuthorityBinding, observerAuthorityObservation, authorizeObserverRepair, validateObserverPredecessor } from "../local-canonical-observer-succession.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "../local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "../github-main-branch-transport.mjs";
import { beginAttempt, finishAttempt, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof } from "../local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership, CHECKOUT_OWNER_FILE } from "../local-canonical-checkout-ownership.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "../canonical-test-environment.mjs";
import { runCanonicalChild } from "../canonical-child-runner.mjs";
import { finalizeReceipt, inspectReceiptForDecision, canonicalSerialize } from "../local-canonical-receipt.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "../local-canonical-review-export.mjs";
import { baseReceipt } from "./local-canonical-receipt-v3.mjs";
import { assertReviewChildLifecycle, projectReviewChildResult } from "./local-canonical-review-child-result.mjs";
const write = (f, v) => writeFileSync(f, typeof v === "string" ? v : JSON.stringify(v), { mode: 0o600 });
const read = f => JSON.parse(readFileSync(f, "utf8"));
const time = offset => new Date(Date.now() + offset).toISOString();
const self = fileURLToPath(import.meta.url);
function authority(p) {
  const body = role => "```augnes-observer-repair-authorization\n" + JSON.stringify({ ...observerAuthorityBinding(p), role, review_id: 102,
    decision: role === "independent_review" ? "accept_exact_observer_succession" : "authorize_one_full_zero_recovery" }) + "\n```";
  const user = { login: "synthetic-fixture", id: 7, type: "User" };
  const makeReview = (id, head, body) => ({ id, user, author_association: "OWNER", state: "COMMENTED", commit_id: head, body,
    submitted_at: time(-2000), pull_request_url: `https://api.github.com/repos/hynk-studio/augnes/pulls/${p.pull_request}` });
  const repair = makeReview(101, p.repair.head, "SYNTHETIC accepted bounded observer repair; historical cause UNKNOWN.");
  p.repair.review = { id: repair.id, sha256: digest(observerAuthorityObservation(repair, "accepted_repair")) };
  const review = makeReview(102, p.head, body("independent_review"));
  const grant = { id: 203, user, author_association: "OWNER", updated_at: time(-1000), issue_url: `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}`, body: body("execution_grant") };
  p.authorization = { review_id: 102, review_sha256: digest(observerAuthorityObservation(review, "independent_review")), grant_comment_id: 203, grant_sha256: digest(observerAuthorityObservation(grant, "execution_grant")) };
  return { repair, review, grant };
}
const transport = (records, change = v => v) => createGitHubObserverAuthorizationTransport(999, { runner: async request => {
  assert.equal(request.operation, "fetch_browser_authority"); assert(request.args.includes("GET"));
  const url = request.args[1]; assert(url.startsWith("repos/hynk-studio/augnes/"));
  const r = url.includes("/reviews/") ? records[url.endsWith("/101") ? "repair" : "review"] : url.includes("/comments/") ? records.grant : { permission: "admin", user: { login: "synthetic-fixture" } };
  return change(structuredClone(r), url);
} });
const save = c => write(c.file, c.proof);
const proof = c => readSourceCorrectionProof(c.file, c.checkout);
const auth = (c, validatedProof, change) => authorizeObserverRepair(validatedProof, { transport: transport(c.authority, change) });
const begin = (c, validatedProof, authorization, extra = {}) => beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner,
  branch: c.proof.branch, head: c.proof.head, tree: c.proof.tree, acceptedMain: c.proof.base, runId: "synthetic-observer-successor", contractFingerprint: "6".repeat(64),
  sourceCorrection: validatedProof, observerAuthorization: authorization, ...extra });

async function make(root, child, progress) {
  const checkout = path.join(root, "checkout"), anchor = path.join(root, "anchor"); mkdirSync(checkout); mkdirSync(anchor);
  const owner = acquireCheckoutVerificationOwnership({ repositoryRoot: checkout });
  const git = (...args) => execFileSync("git", args, { cwd: checkout, timeout: 4000, maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const branch = "codex/synthetic-observer-succession"; git("init", "-b", branch);
  mkdirSync(path.join(checkout, "scripts/fixtures"), { recursive: true });
  write(path.join(checkout, OBSERVER_RETAINED_SOURCES[0]), "export const version=1;\n");
  write(path.join(checkout, OBSERVER_RETAINED_SOURCES[2]), "// synthetic retained discovery correction\n");
  const commit = () => { git("add", "scripts"); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic fixture"); return git("rev-parse", "HEAD").toString().trim(); };
  const base = commit(), oldTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  const executable = path.join(root, "synthetic-executable"); write(executable, "fixture executable\n"); chmodSync(executable, 0o700);
  const before = observeInputFile(executable, { readOnlyExecutable: true }); linkSync(executable, executable + "-alias");
  const after = observeInputFile(executable, { readOnlyExecutable: true });
  const resources = [{ id: "browser-executable", classification: "execution", readOnlyExecutable: true, before, location_fingerprint: digest(executable) }, ...["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable"].map(id => ({ id, classification: "safety", before: { present: false }, location_fingerprint: digest(id) }))];
  const declaration = { contract: "augnes.local-canonical-inputs.v3", path_kind: "isolated-model-free-v1", binding: { head: base, tree: oldTree }, resources };
  const prior = beginAttempt({ repositoryRoot: checkout, anchorRoot: anchor, checkoutOwner: owner, branch, head: base, tree: oldTree, runId: "synthetic-unknown-predecessor", contractFingerprint: digest(declaration) });
  const fault = { resource: "browser-executable", disposition: "observer_failure", observed_at: time(-10000), monotonic_ns: "2" };
  const event = (disposition, value, ns) => ({ ...fault, disposition, classification: "execution", after: value, monotonic_ns: ns, identity: digest(["browser-executable", disposition, value]) });
  const receipt = finalizeReceipt({ ...structuredClone(baseReceipt), receipt_version: 4, repository: { ...baseReceipt.repository, branch, head_sha: base, tree_sha: oldTree, base_sha: base },
    run: { ...baseReceipt.run, id: prior.attempt_id }, attempt: prior, inputs: { ...declaration, fingerprint: digest(declaration), checks: 2, first_fault: fault, secondary_faults: [], events: [event("incidental_executable_metadata", after, "1"), event("observer_failure", null, "2")] },
    outcome: { disposition: "unknown_relevance", safety: "blocked", first_fault: fault }, checkout_ownership: { released: true }, capacity_ownership: { released: true },
    cleanup: { completed: true, remaining_owned_processes: 0, companion_service: { restored: true }, isolated_resources: { completed: true, failure_count: 0 } },
    phases: BROWSER_REPLACEMENT_PHASES.map((id, i) => ({ id, status: i < 15 ? "pass" : "failure", exit_status: i < 15 ? 0 : null, failure_code: i < 15 ? null : "phase_cancelled", timed_out: false,
      cleanup: { completed: true, remaining_owned_processes: 0, exit_observed: true, streams_closed: true, termination_reason: i < 15 ? "natural_exit" : "operator_cancelled" } })),
    final: { result: "failure", exit_status: 1, reason_codes: ["phase_cancelled", "selected_phases_incomplete", "verification_cancelled"] } });
  finishAttempt(prior, { receiptFingerprint: receipt.integrity.content_fingerprint, disposition: "unknown_relevance", cleanupComplete: true });
  const family = path.join(anchor, ".augnes-local-verification/families", prior.family_id), completionFile = path.join(family, "completion-1.json");
  // Deterministic ordering in disposable fixture records, never production history.
  const completion = read(completionFile); completion.finished_at = time(-20000); write(completionFile, completion);
  const folder = path.join(checkout, ".augnes-local-verification/observer"); mkdirSync(folder);
  write(path.join(folder, "original-receipt.json"), receipt);
  cpSync(path.join(family, "attempt-1.json"), path.join(folder, "original-attempt.json")); cpSync(completionFile, path.join(folder, "original-completion.json"));
  const regression = "import assert from 'node:assert/strict';import fs from 'node:fs';assert.match(fs.readFileSync(process.argv[2],'utf8'),/version=2/);\n";
  write(path.join(checkout, OBSERVER_RETAINED_SOURCES[0]), "export const version=2;\n"); write(path.join(checkout, OBSERVER_RETAINED_SOURCES[1]), regression);
  const repairHead = commit(), repairTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  write(path.join(checkout, "scripts/local-canonical-observer-succession.mjs"), "// synthetic succession implementation\n"); const head = commit(), tree = git("rev-parse", "HEAD^{tree}").toString().trim();
  progress("setup_history_complete");
  write(path.join(folder, "regression.mjs"), regression);
  const evidence = {};
  for (const [kind, ref, expected] of [["before", base, 1], ["after", repairHead, 0]]) {
    const source = git("show", `${ref}:${OBSERVER_RETAINED_SOURCES[0]}`); writeFileSync(path.join(folder, `${kind}.mjs`), source);
    const result = await child([path.join(folder, "regression.mjs"), path.join(folder, `${kind}.mjs`)], `observer-regression-${kind}`); assert.equal(result.exit_code, expected);
    const artifact = `${kind}.json`; write(path.join(folder, artifact), { fixture_sha256: digest(regression), source_sha256: digest(source), environment_fingerprint: "e".repeat(64), node_version: process.versions.node,
      result, finished_at: time(kind === "before" ? -8000 : -7000) });
    evidence[kind] = { artifact, sha256: digest(readFileSync(path.join(folder, artifact))), source_sha256: digest(source) };
  }
  progress("setup_witnesses_complete");
  const delta = ref => ({ delta_sha256: digest(git("diff", "--binary", "--no-ext-diff", "--no-textconv", base, ref, "--")), changed_paths: git("diff", "--name-only", base, ref, "--").toString().trim().split("\n").sort() });
  const p = { schema: OBSERVER_REPAIR_SCHEMA, kind: "observer_repair", defect: "shared_executable_observer_read_window_and_diagnostics", branch, base, head, tree,
    prior_family_id: prior.family_id, prior_number: 1, prior_attempt_id: prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    source_module: OBSERVER_RETAINED_SOURCES[0], fixture_artifact: "regression.mjs", fixture_sha256: digest(regression), environment_fingerprint: "e".repeat(64), ...evidence,
    originals: Object.fromEntries(["receipt", "attempt", "completion"].map(k => [k, { artifact: `original-${k}.json`, sha256: digest(readFileSync(path.join(folder, `original-${k}.json`))) }])),
    repair: { head: repairHead, tree: repairTree, ...delta(repairHead), review: null }, ...delta(head),
    retained_sources: Object.fromEntries(OBSERVER_RETAINED_SOURCES.map(n => [n, digest(git("show", `${head}:${n}`))])), authorization: null, pull_request: 999, budget: { initial: 1, recovery: 0 } };
  const c = { checkout, anchor, owner, git, family, receipt, proof: p, folder, file: path.join(folder, "proof.json") }; c.authority = authority(p); save(c); return c;
}

if (process.argv[2] === "--claim-observer-fixture") {
  const packet = read(process.argv[3]); let owner;
  try {
    owner = acquireCheckoutVerificationOwnership({ repositoryRoot: packet.checkout });
    const p = readSourceCorrectionProof(packet.file, packet.checkout);
    const authorization = await authorizeObserverRepair(p, { transport: transport(packet.authority) });
    const attempt = beginAttempt({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, checkoutOwner: owner, branch: p.branch, head: p.head, tree: p.tree,
      acceptedMain: p.base, runId: packet.run_id, contractFingerprint: "6".repeat(64), sourceCorrection: p, observerAuthorization: authorization });
    finishAttempt(attempt, { receiptFingerprint: "7".repeat(64), disposition: "product_failure", cleanupComplete: true });
    console.log("exclusive_claim_won");
  } catch (error) { console.log(`exclusive_claim_refused:${error.code}`); process.exitCode = 1; }
  finally { if (owner) releaseCheckoutVerificationOwnership(owner, packet.checkout, { consumersSettled: true }); }
} else if (process.argv[2] === "--stock-observer-fixture") {
  const packet = read(process.argv[3]), p = readSourceCorrectionProof(packet.file, packet.checkout);
  const authorization = await authorizeObserverRepair(p, { transport: transport(packet.authority) });
  const receipt = read(packet.receipt);
  assert(inspectAttemptRecords({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, receipt, observerAuthorization: authorization }));
  assert(!inspectReceiptForDecision(receipt, { currentAttemptRecordsValid: true }).issues.includes("receipt_observer_succession_invalid"));
  assert(inspectPrivateReviewExport(createPrivateReviewExport(receipt)).structurally_valid);
  console.log("fresh readonly stock lineage and private export reconstructed; synthetic failed receipt remains non-deciding");
} else if (process.argv[2] === "--run-observer-fixtures") {
  await observerSuccessionControls();
}

export async function observerSuccessionControls() {
  const owner = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(owner);
  let c, active = 0; const checks = [];
  const progress = stage => console.log("AUGNES_OBSERVER_FIXTURE_PROGRESS " + JSON.stringify({ stage, completed_controls: checks.length }));
  const child = async (args, controlId) => {
    active++; let text = "";
    const result = await runCanonicalChild({ suite: "observer-succession-fixture", label: "synthetic fixture", command: process.execPath, args, cwd: owner.root,
      env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), timeoutMs: AUXILIARY_EXECUTION_BUDGETS.nestedChildMs, stdout: { write: b => text = (text + b).slice(-1000) }, stderr: { write: b => text = (text + b).slice(-1000) }, log() {} });
    const settled = result.cleanup_completed && result.exit_observed && result.streams_closed && result.remaining_owned_processes === 0;
    if (settled) active--;
    console.log("AUGNES_REVIEW_CHILD_RESULT " + JSON.stringify(projectReviewChildResult(result, { controlId })));
    assertReviewChildLifecycle(result, { controlId }); result.fixture_output = text; return result;
  };
  const pass = name => { checks.push(name); progress("control_complete"); };
  try {
    progress("setup_start"); c = await make(owner.root, child, progress); progress("setup_complete");
    const saved = structuredClone(c.proof), validatedProof = proof(c);
    assert(validatedProof); const authorized = await auth(c, validatedProof); pass("eligible complete synthetic proof and separate authenticated roles");
    for (const [name, mutate] of [
      ["missing originals", p => delete p.originals], ["altered original hash", p => p.originals.receipt.sha256 = "0".repeat(64)],
      ["original attempt hash", p => p.originals.attempt.sha256 = "0".repeat(64)], ["original completion hash", p => p.originals.completion.sha256 = "0".repeat(64)],
      ["repair source", p => p.repair.head = p.base], ["candidate tree", p => p.tree = p.base], ["candidate delta", p => p.delta_sha256 = "0".repeat(64)],
      ["reviewed delta", p => p.repair.delta_sha256 = "0".repeat(64)], ["path inventory", p => p.changed_paths.pop()], ["base not ancestor", p => p.base = "f".repeat(40)],
      ["retained discovery", p => p.retained_sources[OBSERVER_RETAINED_SOURCES[2]] = "0".repeat(64)], ["before witness", p => p.before.sha256 = "0".repeat(64)],
      ["fixture mismatch", p => p.fixture_sha256 = "0".repeat(64)], ["recovery budget", p => p.budget.recovery = 1], ["unrelated kind", p => p.kind = "unknown_retry"],
    ]) {
      c.proof = structuredClone(saved); mutate(c.proof); save(c); assert.throws(() => proof(c), undefined, name); pass(`refuse ${name}`);
    }
    c.proof = structuredClone(saved); save(c);
    const originalReceiptPath = path.join(c.folder, c.proof.originals.receipt.artifact), originalReceiptBytes = readFileSync(originalReceiptPath);
    rmSync(originalReceiptPath); assert.throws(() => proof(c)); writeFileSync(originalReceiptPath, originalReceiptBytes); pass("missing original file refuses");
    const witnessPath = path.join(c.folder, c.proof.before.artifact), witnessBytes = readFileSync(witnessPath), cancelledWitness = read(witnessPath);
    cancelledWitness.result.cancelled = true; write(witnessPath, cancelledWitness); c.proof.before.sha256 = digest(readFileSync(witnessPath)); save(c);
    assert.throws(() => proof(c), /source_correction_witness_invalid/); writeFileSync(witnessPath, witnessBytes); c.proof = structuredClone(saved); save(c); pass("cancelled deterministic witness refuses even with matching bytes");
    // The remaining authority/ledger controls keep this source proof unchanged.
    // Confirm restoration once; beginAttempt still rereads the live proof at
    // admission, and separate claim/stock children retain their own cold reads.
    assert.deepEqual(proof(c), validatedProof);
    for (const [name, mutate] of [
      ["timeout", r => r.phases[15].timed_out = true], ["other unknown", r => r.inputs.first_fault.resource = "node-executable"],
      ["invented diagnostic", r => r.inputs.first_fault.diagnostic = { stage: "read", code: "EIO" }], ["additional fault", r => r.inputs.secondary_faults.push(r.inputs.first_fault)],
      ["changed content", r => r.inputs.events[0].after.sha256 = "0".repeat(64)],
      ["replacement identity", r => r.inputs.events[0].after.metadata.inode = "1"],
      ["changed permission", r => r.inputs.events[0].after.permission_identity = "0".repeat(64)],
      ["changed ownership", r => r.inputs.events[0].after.metadata.uid = "0"], ["no incidental evidence", r => r.inputs.events.shift()],
      ["safety outcome", r => r.outcome.disposition = "safety_violation"], ["cleanup incomplete", r => r.cleanup.completed = false],
      ["unsettled child", r => r.phases[15].cleanup.streams_closed = false], ["phase stitching", r => r.phases.pop()],
    ]) {
      const r = structuredClone(c.receipt); mutate(r);
      r.outcome.first_fault = structuredClone(r.inputs.first_fault);
      for (const e of r.inputs.events) e.identity = digest([e.resource, e.disposition, e.after]);
      r.inputs.fingerprint = digest({ contract: r.inputs.contract, path_kind: r.inputs.path_kind, binding: r.inputs.binding, resources: r.inputs.resources });
      r.attempt.contract_fingerprint = r.inputs.fingerprint;
      const sealed = finalizeReceipt(r); assert.throws(() => validateObserverPredecessor(sealed), undefined, name); pass(`refuse ${name}`);
    }
    for (const [name, mutate] of [
      ["future grant", (r, url) => url.includes("comments") ? { ...r, updated_at: time(60000) } : r],
      ["stale review evidence", (r, url) => url.includes("/reviews/102") ? { ...r, body: r.body.replace(c.proof.head, c.proof.base) } : r],
      ["automated author", r => r.user?.type ? { ...r, user: { ...r.user, type: "Bot" } } : r],
      ["missing grant", (r, url) => url.includes("comments") ? null : r],
      ["changed review", (r, url) => url.includes("/reviews/102") ? { ...r, body: r.body + "changed" } : r],
      ["wrong review head", (r, url) => url.includes("/reviews/102") ? { ...r, commit_id: c.proof.base } : r],
      ["implementation role", (r, url) => url.includes("/reviews/102") ? { ...r, body: r.body.replace("independent_review", "implementation_owner") } : r],
      ["wrong grant destination", (r, url) => url.includes("comments") ? { ...r, issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/1" } : r],
      ["revoked permission", r => r.permission ? { ...r, permission: "read" } : r],
      ["repair review mismatch", (r, url) => url.includes("/reviews/101") ? { ...r, commit_id: c.proof.head } : r],
      ["unauthenticated transport", () => { throw new Error("synthetic refusal"); }],
    ]) { await assert.rejects(() => auth(c, validatedProof, mutate), undefined, name); pass(`refuse ${name}`); }
    assert.throws(() => begin(c, validatedProof, { observations: authorized.observations }), /observer_authenticated_authority_required/); pass("local capability forgery refused before reservation");
    assert.throws(() => begin(c, validatedProof, authorized, { acceptedMain: "0".repeat(40) }), /observer_current_base_required/); pass("stale accepted main refused");
    const completionPath = path.join(c.family, "completion-1.json"), bytes = readFileSync(completionPath);
    write(completionPath, { ...read(completionPath), finished_at: time(-1000) }); assert.throws(() => begin(c, validatedProof, authorized), /observer_original_ledger_changed/); writeFileSync(completionPath, bytes); pass("live original differs from retained bytes refused");
    const newer = { ...read(path.join(c.family, "attempt-1.json")), number: 2, attempt_id: "synthetic-newer-tip" };
    write(path.join(c.family, "attempt-2.json"), newer);
    assert.equal(reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch }).attempt_id, newer.attempt_id);
    assert.throws(() => begin(c, validatedProof, authorized), /attempt_latest_tip_required/);
    write(path.join(c.family, "completion-2.json"), { ...read(completionPath), attempt_id: newer.attempt_id });
    assert.throws(() => begin(c, validatedProof, authorized), /attempt_latest_tip_required/);
    rmSync(path.join(c.family, "attempt-2.json")); rmSync(path.join(c.family, "completion-2.json"));
    pass("latest valid settled and unsettled tip selection refuses old proof");
    cpSync(path.join(c.family, "attempt-1.json"), path.join(c.family, "attempt-2.json")); assert.throws(() => begin(c, validatedProof, authorized), /attempt_lineage_identity_invalid/); rmSync(path.join(c.family, "attempt-2.json")); pass("newer interrupted tip refuses older allowance");
    const raceAnchor = path.join(owner.root, "race-anchor"); cpSync(c.anchor, raceAnchor, { recursive: true });
    const racePackets = [];
    for (const i of [1, 2]) {
      const checkout = path.join(owner.root, `race-checkout-${i}`);
      cpSync(c.checkout, checkout, { recursive: true, filter: source => path.basename(source) !== CHECKOUT_OWNER_FILE });
      const packet = path.join(owner.root, `race-${i}.json`); write(packet, { checkout, anchor: raceAnchor, file: path.join(checkout, ".augnes-local-verification/observer/proof.json"), authority: c.authority, run_id: `synthetic-race-${i}` }); racePackets.push(packet);
    }
    progress("race_start");
    const race = await Promise.all(racePackets.map((packet, index) => child([self, "--claim-observer-fixture", packet], `observer-race-${index + 1}`)));
    assert.deepEqual(race.map(r => r.exit_code).sort(), [0, 1], race.map(r => r.fixture_output).join("\n"));
    assert.equal(race.filter(r => r.fixture_output.includes("exclusive_claim_won")).length, 1); pass("two checkout owners racing one anchor produce one exclusive successor");
    progress("race_complete");
    const attempt = begin(c, validatedProof, authorized); assert.equal(attempt.budget.recovery, 0); pass("exclusive successor reserved once");
    assert.throws(() => begin(c, validatedProof, authorized), /attempt_latest_tip_required/); pass("duplicate before completion refused");
    const current = finalizeReceipt({ ...structuredClone(c.receipt), repository: { ...c.receipt.repository, head_sha: c.proof.head, tree_sha: c.proof.tree },
      evidence: { ...c.receipt.evidence, mode: "full" }, verification_context: { ...c.receipt.verification_context, kind: "isolated-worktree" },
      run: { ...c.receipt.run, id: attempt.attempt_id }, attempt, inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, head: c.proof.head, tree: c.proof.tree } } });
    finishAttempt(attempt, { receiptFingerprint: current.integrity.content_fingerprint, disposition: current.outcome.disposition, cleanupComplete: true });
    assert(inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current, observerAuthorization: authorized }));
    assert.equal(inspectReceiptForDecision(current, { currentAttemptRecordsValid: true }).valid_deciding_evidence, false);
    assert(!inspectReceiptForDecision(current, { currentAttemptRecordsValid: true }).issues.includes("receipt_observer_succession_invalid")); pass("failed successor preserves zero budget and remains non-deciding");
    const receiptFile = path.join(c.folder, "successor-receipt.json"); write(receiptFile, current);
    const packet = path.join(c.folder, "stock-packet.json"); write(packet, { checkout: c.checkout, anchor: c.anchor, file: c.file, authority: c.authority, receipt: receiptFile });
    progress("stock_start");
    const fresh = await child([self, "--stock-observer-fixture", packet], "observer-stock"); assert.equal(fresh.exit_code, 0, fresh.fixture_output); pass("fresh stock reconstruction and export");
    progress("stock_complete");
    const exported = structuredClone(createPrivateReviewExport(current));
    assert(!JSON.stringify(exported).includes("original-receipt.json"));
    exported.attempt.observer_authority.execution_grant.role = "implementation_owner";
    const exportedValue = { ...exported }; delete exportedValue.export_fingerprint; exported.export_fingerprint = digest(canonicalSerialize(exportedValue));
    assert(!inspectPrivateReviewExport(exported).structurally_valid); pass("export retains sanitized attribution and rejects role tampering");
    assert(!inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current })); pass("stock missing authenticated authority refuses");
    const corrupt = structuredClone(current); corrupt.attempt.budget.recovery = 1;
    assert(inspectReceiptForDecision(finalizeReceipt(corrupt)).issues.includes("receipt_observer_succession_invalid")); pass("stock rejects recovery budget downgrade");
    const successorRoot = path.join(c.anchor, ".augnes-local-verification/families", attempt.family_id), successorAttempt = path.join(successorRoot, "attempt-1.json"), successorBytes = readFileSync(successorAttempt);
    rmSync(successorAttempt); assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch })); assert.throws(() => begin(c, validatedProof, authorized)); writeFileSync(successorAttempt, successorBytes); pass("interrupted reservation blocks replacement without rollback");
    assert.throws(() => beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner, branch: c.proof.branch,
      head: c.proof.head, tree: c.proof.tree, runId: "forbidden-reset", contractFingerprint: "7".repeat(64) }), /attempt_candidate_superseded/); pass("old family cannot regain recovery allowance");
    const completion = read(path.join(successorRoot, "completion-1.json")); completion.disposition = "infrastructure_interruption"; write(path.join(successorRoot, "completion-1.json"), completion);
    assert.throws(() => begin(c, validatedProof, authorized)); pass("even infrastructure failure cannot acquire special recovery");
    assert(existsSync(path.join(c.family, "correction-successor.json"))); assert.equal(read(completionPath).disposition, "unknown_relevance"); pass("original UNKNOWN and exclusive edge retained");
  } finally {
    progress("cleanup_start");
    if (c?.owner) releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: !active });
    if (!active) settleCanonicalTestResourceUse(owner, { cleanup_completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0 });
    const cleanup = cleanupCanonicalTestResources([owner])[0]; assert(cleanup.completed, JSON.stringify(cleanup));
    progress("cleanup_complete");
  }
  assert.equal(checks.length, 59);
  console.log(JSON.stringify({ observer_succession: checks, count: checks.length, synthetic_authority_only: true, cleanup_complete: true }));
  return checks;
}
