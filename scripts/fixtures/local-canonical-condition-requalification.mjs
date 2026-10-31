// Synthetic, disposable authority/ledger controls. No Browser, GitHub or model use.
import { AUXILIARY_EXECUTION_BUDGETS } from "../local-canonical-closeout-budgets.mjs";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { digest } from "../local-canonical-inputs.mjs";
import { CONDITION_REQUALIFICATION_SCHEMA, conditionAuthorityObservation, authorizeConditionRequalification, validConditionRequalificationAttempt, validateConditionPredecessor } from "../local-canonical-condition-requalification.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "../local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "../github-main-branch-transport.mjs";
import { beginAttempt, finishAttempt, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof } from "../local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "../local-canonical-checkout-ownership.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "../canonical-test-environment.mjs";
import { runCanonicalChild } from "../canonical-child-runner.mjs";
import { finalizeReceipt, inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "../local-canonical-review-export.mjs";
import { baseReceipt } from "./local-canonical-receipt-v3.mjs";
import { assertReviewChildLifecycle } from "./local-canonical-review-child-result.mjs";

const self = fileURLToPath(import.meta.url);
const write = (file, value) => writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value), { mode: 0o600 });
const read = file => JSON.parse(readFileSync(file, "utf8"));
const time = offset => new Date(Date.now() + offset).toISOString();
const save = c => write(c.file, c.proof);
const proof = c => readSourceCorrectionProof(c.file, c.checkout);
const treeFiles = (directory, root = directory) => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? treeFiles(file, root) : [{ file: path.relative(root, file), sha256: digest(readFileSync(file)) }];
}).sort((a, b) => a.file.localeCompare(b.file));
const transport = (records, change = value => value) => createGitHubObserverAuthorizationTransport(999, { runner: async request => {
  assert.equal(request.operation, "fetch_browser_authority"); assert(request.args.includes("GET"));
  const url = request.args[1]; assert(url.startsWith("repos/hynk-studio/augnes/"));
  const record = url.includes("/reviews/") ? records.diagnosis : url.includes("/comments/") ? records.grant : url.endsWith("/pulls/999") ? records.pr : { permission: "admin", user: { login: "synthetic-fixture" } };
  return change(structuredClone(record), url);
} });
const authorize = (c, p, change) => authorizeConditionRequalification(p, { transport: transport(c.authority, change) });
const begin = (c, p, authorization, extra = {}) => beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner,
  branch: p.branch, head: p.head, tree: p.tree, acceptedMain: p.base, runId: "synthetic-condition-successor", contractFingerprint: "6".repeat(64),
  sourceCorrection: p, conditionAuthorization: authorization, ...extra });
function bindCandidate(c) {
  c.proof.head = c.commit(); c.proof.tree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
  const native = c.delta(c.proof.diagnosis.head, c.proof.head), main = c.delta(c.proof.base, c.proof.head);
  Object.assign(c.source, { head: c.proof.head, tree: c.proof.tree, ...native, main_delta_sha256: main.delta_sha256, main_changed_paths: main.changed_paths });
  write(path.join(c.folder, "final-source.json"), c.source); c.proof.final_source = c.ref("final-source.json");
  c.authority.pr.head.sha = c.proof.head; save(c);
}

function authority(p) {
  const user = { login: "synthetic-fixture", id: 7, type: "User" };
  const diagnosis = { id: 101, user, author_association: "OWNER", state: "COMMENTED", commit_id: p.diagnosis.head,
    submitted_at: time(-2000), pull_request_url: "https://api.github.com/repos/hynk-studio/augnes/pulls/999",
    body: `SYNTHETIC DIAGNOSIS ACCEPTED within its recorded development scope / no supported behavioral correction / qualification HOLD / DO NOT MERGE. Reviewed unchanged HEAD \`${p.diagnosis.head}\`, tree \`${p.diagnosis.tree}\`. Accepted packet ${p.diagnosis.archive.sha256}.` };
  p.diagnosis.review = { id: diagnosis.id, sha256: digest(conditionAuthorityObservation(diagnosis, "accepted_diagnosis")) };
  const grant = { id: 203, user, author_association: "OWNER", updated_at: time(-1000), issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/999",
    body: `## Explicit user authorization — bounded requalification after non-reproduced Project Home condition failure
SYNTHETIC instruction https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-101.
Starting head ${p.diagnosis.head} tree ${p.diagnosis.tree} branch ${p.branch} family ${p.prior_family_id} run ${p.prior_attempt_id} receipt ${p.prior_receipt_fingerprint} diagnosis ${p.diagnosis.archive.sha256}.
Budget: one admitted Full; zero additional automatic or explicit recovery/retry under this authorization.
Use a truthful implementation-owner final-source/binding record for new code; do not label future bytes independently reviewed.
No separate policy-only Full, prior deployment, new final-source execution grant, or routine independent-review handoff between this bounded implementation and its Full is required.
ChatGPT's independent audit of the implemented policy, exact final source and actual results is the post-completion decision.
Once the exclusive reservation is made, the allowance cannot be renewed by a crash, different branch/worktree/HEAD/proof, compatible main integration, duplicated grant or another successor kind. Interrupted reservation stays consumed.
Outcome success, failure, cancellation or interruption permits no second Full/recovery under this grant. Return the actual result.` };
  p.authorization = { grant_comment_id: grant.id, grant_sha256: digest(conditionAuthorityObservation(grant, "execution_grant")) };
  return { diagnosis, grant, pr: { number: 999, state: "open", draft: true, merged: false, auto_merge: null,
    head: { sha: p.head, ref: p.branch, repo: { full_name: "hynk-studio/augnes" } }, base: { sha: p.base, ref: "main", repo: { full_name: "hynk-studio/augnes" } } } };
}
function make(root) {
  const checkout = path.join(root, "checkout"), anchor = path.join(root, "anchor"); mkdirSync(checkout); mkdirSync(anchor);
  const owner = acquireCheckoutVerificationOwnership({ repositoryRoot: checkout });
  const git = (...args) => execFileSync("git", args, { cwd: checkout, timeout: 4000, maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const branch = "codex/synthetic-condition-succession"; git("init", "-b", branch); mkdirSync(path.join(checkout, "scripts"));
  write(path.join(checkout, "scripts/canonical-database-migrations.mjs"), "// synthetic preserved migration bytes\n");
  const commit = () => { git("add", "scripts"); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic fixture"); return git("rev-parse", "HEAD").toString().trim(); };
  const base = commit();
  write(path.join(checkout, "scripts/canonical-database-migrations.mjs"), "// synthetic accepted migration task bytes\n");
  const priorHead = commit(), oldTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  const resources = ["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable", "browser-executable"].map(id => ({ id, classification: "safety", before: { present: false }, location_fingerprint: digest(id) }));
  const declaration = { contract: "augnes.local-canonical-inputs.v3", path_kind: "isolated-model-free-v1", binding: { head: priorHead, tree: oldTree,
    executor_fingerprint: "a".repeat(64), phase_environment_fingerprints: BROWSER_REPLACEMENT_PHASES.map(id => ({ id, fingerprint: "b".repeat(64) })) }, resources };
  const prior = beginAttempt({ repositoryRoot: checkout, anchorRoot: anchor, checkoutOwner: owner, branch, head: priorHead, tree: oldTree, runId: "synthetic-condition-predecessor", contractFingerprint: digest(declaration) });
  const condition = { phase: "e2e-operator-work-expectation", subphase: "work_expectation_recording", failure: "operator-work-expectation:Error:operator_condition_timeout:hydrated_expectation_project_home",
    predicate: '[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-project-management-hydrated="true"]', condition_ms: 45000, child_ms: 360000, historical_cause: "UNKNOWN" };
  const result = { validation_version: "operator_execution_browser_validation.v1", child_id: "operator-work-expectation", ok: false, failure: condition.failure,
    browser_failure_snapshot: { primary: { phase: condition.subphase } }, acceptance_bound_ms: 360000, owned_process_residue_count: 0, listener_residue_count: 0 };
  for (const key of ["cleanup_complete", "owned_streams_settled", "temporary_root_removed", "temporary_process_root_removed", "temporary_profile_removed", "temporary_database_removed", "runtime_shutdown_complete", "chrome_cdp_shutdown_complete"]) result[key] = true;
  const log = '[canonical:e2e-operator-work-expectation] child_start label="independent operator work-expectation Browser child" timeout_ms=360000\n' + JSON.stringify(result, null, 2) + '\n' +
    '[canonical:e2e-operator-work-expectation] child_result label="independent operator work-expectation Browser child" duration_ms=72000 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n' +
    JSON.stringify({ suite: condition.phase, resource_cleanup: [{ completed: true, failure_count: 0, failures: [] }] }) + '\n';
  const logRelative = `.augnes-local-verification/logs/${prior.attempt_id}/${condition.phase}.log`;
  mkdirSync(path.dirname(path.join(checkout, logRelative)), { recursive: true }); write(path.join(checkout, logRelative), log);
  const receipt = finalizeReceipt({ ...structuredClone(baseReceipt), receipt_version: 4,
    repository: { ...baseReceipt.repository, branch, head_sha: priorHead, tree_sha: oldTree, base_sha: base }, evidence: { ...baseReceipt.evidence, mode: "full", selected_plan: "full-canonical" },
    verification_context: { kind: "isolated-worktree" }, executor: { ...baseReceipt.executor, source_fingerprint: "a".repeat(64) }, run: { ...baseReceipt.run, id: prior.attempt_id }, attempt: prior,
    inputs: { ...declaration, fingerprint: digest(declaration), checks: 2, first_fault: null, secondary_faults: [], events: [] },
    outcome: { disposition: "product_failure", safety: "preserved_within_observed_scope", validity: "valid_within_observed_scope", first_fault: null }, checkout_ownership: { released: true }, capacity_ownership: { released: true },
    cleanup: { completed: true, remaining_owned_processes: 0, companion_service: { restored: true }, isolated_resources: { completed: true, failure_count: 0, failures: [] } },
    phases: BROWSER_REPLACEMENT_PHASES.map((id, i) => ({ id, status: i < 12 ? "pass" : i === 12 ? "failure" : "not_run", exit_status: i < 12 ? 0 : i === 12 ? 1 : null,
      failure_code: i === 12 ? "phase_failed" : null, timed_out: false, spawn_error_code: null, environment_fingerprint: i > 12 ? null : "b".repeat(64),
      ...(i === 12 ? { log: { relative_path: logRelative, bytes: Buffer.byteLength(log), truncated: false } } : {}),
      cleanup: { completed: true, remaining_owned_processes: 0, exit_observed: i <= 12, streams_closed: i <= 12, termination_reason: i <= 12 ? "natural_exit" : null } })),
    final: { result: "failure", exit_status: 1, reason_codes: ["phase_failed", "selected_phases_incomplete"] } });
  finishAttempt(prior, { receiptFingerprint: receipt.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
  const family = path.join(anchor, ".augnes-local-verification/families", prior.family_id), completionFile = path.join(family, "completion-1.json");
  const completion = read(completionFile); completion.finished_at = time(-20000); write(completionFile, completion);
  const folder = path.join(checkout, ".augnes-local-verification/condition"); mkdirSync(folder);
  write(path.join(folder, "original-receipt.json"), receipt); write(path.join(folder, "original-log.log"), log); write(path.join(folder, "original-result.json"), result);
  cpSync(path.join(family, "attempt-1.json"), path.join(folder, "original-attempt.json")); cpSync(completionFile, path.join(folder, "original-completion.json"));
  write(path.join(folder, "diagnosis.zip"), "SYNTHETIC ARCHIVE BYTES: diagnosis accepted, original cause unknown\n");
  write(path.join(checkout, "scripts/local-canonical-condition-requalification.mjs"), "// synthetic bounded policy owner\n");
  const head = commit(), tree = git("rev-parse", "HEAD^{tree}").toString().trim();
  const delta = (from, to) => ({ delta_sha256: digest(git("diff", "--binary", "--no-ext-diff", "--no-textconv", from, to, "--")), changed_paths: git("diff", "--name-only", from, to, "--").toString().trim().split("\n").filter(Boolean).sort() });
  const native = delta(priorHead, head), main = delta(base, head), source = { schema: "augnes.condition-requalification-final-source.v1", basis: "implementation_owner_not_independent_review", base, head, tree,
    predecessor_head: priorHead, predecessor_tree: oldTree, ...native, main_delta_sha256: main.delta_sha256, main_changed_paths: main.changed_paths };
  write(path.join(folder, "final-source.json"), source);
  const ref = artifact => ({ artifact, sha256: digest(readFileSync(path.join(folder, artifact))) });
  const p = { schema: CONDITION_REQUALIFICATION_SCHEMA, kind: "condition_requalification", branch, base, head, tree,
    prior_family_id: prior.family_id, prior_number: 1, prior_attempt_id: prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    originals: Object.fromEntries(["receipt", "attempt", "completion", "result", "log"].map(kind => [kind, ref(`original-${kind}.${kind === "log" ? "log" : "json"}`)])), condition,
    diagnosis: { head: priorHead, tree: oldTree, archive: ref("diagnosis.zip"), review: null }, final_source: ref("final-source.json"), authorization: null, pull_request: 999, budget: { initial: 1, recovery: 0 } };
  const c = { checkout, anchor, owner, git, commit, delta, source, family, receipt, proof: p, folder, file: path.join(folder, "proof.json"), logRelative, ref };
  c.authority = authority(p); save(c); return c;
}

if (process.argv[2] === "--stock-condition-fixture") {
  const packet = read(process.argv[3]), before = treeFiles(packet.anchor), p = readSourceCorrectionProof(packet.file, packet.checkout);
  const authorization = await authorizeConditionRequalification(p, { transport: transport(packet.authority) });
  assert(inspectAttemptRecords({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, receipt: read(packet.receipt), conditionAuthorization: authorization }));
  assert.deepEqual(treeFiles(packet.anchor), before); console.log("fresh stock reconstructs without writes");
} else if (process.argv[2] === "--run-condition-fixtures") {
  await conditionControls(process.argv[3]);
}

export async function conditionControls(group = "evidence") {
  assert(["evidence", "authority", "admission", "stock"].includes(group));
  const owner = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(owner);
  let c, active = false; const checks = [], pass = name => checks.push(name);
  try {
    c = make(owner.root); const saved = structuredClone(c.proof), validated = proof(c), authorized = await authorize(c, validated);
    const edge = path.join(c.family, "correction-successor.json"), reset = () => { c.proof = structuredClone(saved); save(c); };
    assert(!existsSync(edge)); pass("eligible evidence and live synthetic authority do not reserve");
    if (group === "evidence") {
      for (const [name, mutate] of [
        ["v1 reinterpretation", p => p.schema = "augnes.local-canonical-source-correction.v1"], ["v2 reinterpretation", p => p.schema = "augnes.local-canonical-source-correction.v2"],
        ["v3 reinterpretation", p => p.schema = "augnes.local-canonical-source-correction.v3"], ["v4 reinterpretation", p => p.schema = "augnes.local-canonical-source-correction.v4"],
        ["wrong kind", p => p.kind = "corrected_timeout"], ["fabricated behavioral witnesses", p => p.before = {}],
        ["receipt bytes", p => p.originals.receipt.sha256 = "0".repeat(64)], ["result bytes", p => p.originals.result.sha256 = "0".repeat(64)],
        ["log bytes", p => p.originals.log.sha256 = "0".repeat(64)], ["diagnosis archive", p => p.diagnosis.archive.sha256 = "0".repeat(64)],
        ["source bytes", p => p.final_source.sha256 = "0".repeat(64)], ["wrong failure", p => p.condition.failure = "assertion_failed"],
        ["weaker predicate", p => p.condition.predicate = '[data-blank-state="v0.1"]'], ["condition deadline", p => p.condition.condition_ms++],
        ["child deadline", p => p.condition.child_ms++], ["repaired cause", p => p.condition.historical_cause = "FIXED"],
        ["second allowance", p => p.budget.initial = 2], ["recovery", p => p.budget.recovery = 1], ["old diagnosis", p => p.diagnosis.head = p.head],
      ]) { reset(); mutate(c.proof); save(c); assert.throws(() => proof(c), undefined, name); pass(`refuse ${name}`); }
      reset();
      for (const [name, mutate] of [
        ["wrong failing phase", r => r.phases[12].id = "integration"], ["outer timeout", r => r.phases[12].timed_out = true],
        ["missing later phase", r => r.phases.pop()], ["earlier failure", r => r.phases[2].status = "failure"], ["later pass", r => r.phases[14].status = "pass"],
        ["unsettled", r => r.cleanup.completed = false], ["input fault", r => r.inputs.first_fault = { disposition: "unknown_relevance" }],
        ["unresolved secondary", r => r.inputs.secondary_faults.push({})], ["input drift", r => r.inputs.events.push({ resource: "git-config", disposition: "unknown_relevance" })],
      ]) { const altered = structuredClone(c.receipt); mutate(altered); assert.throws(() => validateConditionPredecessor(finalizeReceipt(altered)), undefined, name); pass(`refuse ${name}`); }
      const sourceFile = path.join(c.folder, "final-source.json"), bytes = readFileSync(sourceFile);
      for (const change of [s => s.delta_sha256 = "0".repeat(64), s => s.main_delta_sha256 = "0".repeat(64), s => s.changed_paths = [], s => s.main_changed_paths = [], s => s.basis = "independent_review"]) {
        const source = JSON.parse(bytes); change(source); write(sourceFile, source); c.proof.final_source = c.ref("final-source.json"); save(c); assert.throws(() => proof(c));
      }
      writeFileSync(sourceFile, bytes); reset(); pass("native/main deltas and implementation-owner meaning enforced");
      const resultFile = path.join(c.folder, "original-result.json"), resultBytes = readFileSync(resultFile), changed = JSON.parse(resultBytes); changed.extra = "not emitted in original log";
      write(resultFile, changed); c.proof.originals.result = c.ref("original-result.json"); save(c); assert.throws(() => proof(c), /condition_original_result_invalid/);
      writeFileSync(resultFile, resultBytes); reset(); pass("result hash alone cannot replace the actual emitted log result");
      write(path.join(c.checkout, "scripts/canonical-database-migrations.mjs"), c.git("show", `${c.proof.base}:scripts/canonical-database-migrations.mjs`).toString());
      bindCandidate(c); assert.throws(() => proof(c), /condition_retained_task_changed/); pass("reverting retained task bytes to main cannot hide by removing a PR delta");
    }
    if (group === "authority") {
      for (const [name, change] of [
        ["altered prose", (r, u) => u.includes("/comments/") ? { ...r, body: r.body + "changed" } : r],
        ["unprivileged", (r, u) => u.endsWith("/permission") ? { ...r, permission: "read" } : r],
        ["bot authority", r => r.user ? { ...r, user: { ...r.user, type: "Bot" } } : r],
        ["wrong review source", (r, u) => u.includes("/reviews/") ? { ...r, commit_id: c.proof.head } : r],
        ["unpublished head", (r, u) => u.endsWith("/pulls/999") ? { ...r, head: { ...r.head, sha: c.proof.base } } : r],
        ["wrong base", (r, u) => u.endsWith("/pulls/999") ? { ...r, base: { ...r.base, sha: c.proof.head } } : r],
        ["ready", (r, u) => u.endsWith("/pulls/999") ? { ...r, draft: false } : r],
        ["auto merge", (r, u) => u.endsWith("/pulls/999") ? { ...r, auto_merge: {} } : r],
        ["different branch", (r, u) => u.endsWith("/pulls/999") ? { ...r, head: { ...r.head, ref: "codex/other" } } : r],
        ["other repository", (r, u) => u.endsWith("/pulls/999") ? { ...r, head: { ...r.head, repo: { full_name: "other/repo" } } } : r],
      ]) { await assert.rejects(authorize(c, validated, change), undefined, name); pass(`refuse ${name}`); }
      const original = structuredClone(c.authority);
      c.authority.grant.body = "Generic approval for one test"; c.proof.authorization.grant_sha256 = digest(conditionAuthorityObservation(c.authority.grant, "execution_grant")); save(c);
      await assert.rejects(authorize(c, proof(c)), /condition_authority_scope_invalid/); c.authority = original; reset(); pass("privileged generic prose is not specific prospective authority");
      assert.throws(() => begin(c, validated, { observations: authorized.observations }), /condition_authenticated_authority_required/);
      assert.throws(() => begin(c, validated, authorized, { acceptedMain: "f".repeat(40) }), /condition_current_base_required/); assert(!existsSync(edge)); pass("forged capability and stale main refuse before reservation");
    }
    if (group === "admission" || group === "stock") {
      const beforeOriginals = treeFiles(c.family), attempt = begin(c, validated, authorized);
      assert.deepEqual(attempt.budget, { initial: 1, recovery: 0 }); assert(validConditionRequalificationAttempt(attempt));
      assert.throws(() => begin(c, validated, authorized)); pass("one exclusive attempt, duplicate and unfinished replay refuse");
      const current = finalizeReceipt({ ...structuredClone(c.receipt), repository: { ...c.receipt.repository, head_sha: c.proof.head, tree_sha: c.proof.tree }, run: { ...c.receipt.run, id: attempt.attempt_id }, attempt,
        inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, head: c.proof.head, tree: c.proof.tree } } });
      finishAttempt(attempt, { receiptFingerprint: current.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
      assert(reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch }).condition_requalification_consumed);
      assert.throws(() => begin(c, validated, authorized)); assert.throws(() => begin(c, validated, authorized, { sourceCorrection: null })); pass("settled terminal successor cannot recover or reset old family");
      assert.deepEqual(treeFiles(c.family).filter(r => r.file !== "correction-successor.json"), beforeOriginals); pass("original immutable predecessor unchanged");
      const successorRoot = path.join(c.anchor, ".augnes-local-verification/families", attempt.family_id), attemptFile = path.join(successorRoot, "attempt-1.json"), attemptBytes = readFileSync(attemptFile);
      if (group === "admission") {
        rmSync(attemptFile); assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch })); assert.throws(() => begin(c, validated, authorized));
        writeFileSync(attemptFile, attemptBytes); pass("crash after exclusive edge leaves consumed reservation");
        for (const kind of ["condition_requalification", "observer_repair", "corrected_timeout", "browser_input_replacement"]) {
          write(path.join(successorRoot, "correction-successor.json"), { contract: "augnes.local-canonical-successor.v2", kind });
          assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch }), /attempt_condition_successor_terminal/);
          rmSync(path.join(successorRoot, "correction-successor.json"));
        }
        pass("every successor kind is terminal after consumption");
        assert.throws(() => begin(c, validated, authorized, { branch: "codex/other-branch" }), /source_correction_predecessor_invalid/); pass("another branch cannot borrow the predecessor");
        write(path.join(c.checkout, "scripts/local-canonical-condition-requalification.mjs"), "// synthetic later in-scope policy bytes\n");
        bindCandidate(c); const later = proof(c), laterAuthority = await authorize(c, later);
        assert.throws(() => begin(c, later, laterAuthority), /attempt_latest_tip_required/); pass("new head and freshly bound source do not renew consumed allowance");
        c.authority.grant.id++; c.proof.authorization = { grant_comment_id: c.authority.grant.id, grant_sha256: digest(conditionAuthorityObservation(c.authority.grant, "execution_grant")) }; save(c);
        const copied = proof(c), copiedAuthority = await authorize(c, copied); assert.throws(() => begin(c, copied, copiedAuthority), /attempt_latest_tip_required/); pass("authenticated grant copy cannot renew consumption");
      } else {
        const ledger = treeFiles(c.anchor); assert(inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current, conditionAuthorization: authorized }));
        assert(!inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current })); assert.deepEqual(treeFiles(c.anchor), ledger);
        const inspection = inspectReceiptForDecision(current, { currentAttemptRecordsValid: true }); assert(!inspection.issues.includes("receipt_condition_requalification_invalid")); assert(!inspection.valid_deciding_evidence);
        const exported = createPrivateReviewExport(current); assert(inspectPrivateReviewExport(exported).structurally_valid); assert(validConditionRequalificationAttempt(exported.attempt));
        assert(!JSON.stringify(exported).includes("original-receipt.json")); pass("sanitized export validates, failed receipt stays non-deciding, stock needs fresh authority");
        const receiptFile = path.join(c.folder, "successor-receipt.json"), packet = path.join(c.folder, "stock-packet.json"); write(receiptFile, current);
        write(packet, { checkout: c.checkout, anchor: c.anchor, file: c.file, authority: c.authority, receipt: receiptFile }); active = true;
        let output = ""; const result = await runCanonicalChild({ suite: "condition-requalification-fixture", label: "fresh synthetic stock", command: process.execPath,
          args: [self, "--stock-condition-fixture", packet], cwd: owner.root, env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), timeoutMs: AUXILIARY_EXECUTION_BUDGETS.nestedChildMs,
          stdout: { write: chunk => output += chunk }, stderr: { write: chunk => output += chunk }, log() {} });
        active = !(result.cleanup_completed && result.exit_observed && result.streams_closed && result.remaining_owned_processes === 0);
        assertReviewChildLifecycle(result, { controlId: "condition-fresh-stock" }); assert.equal(result.exit_code, 0, output); assert.deepEqual(treeFiles(c.anchor), ledger); pass("separate cold stock reconstructs without reservations or writes");
      }
    }
  } finally {
    if (c?.owner) releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: !active });
    if (!active) settleCanonicalTestResourceUse(owner, { cleanup_completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0 });
    assert(cleanupCanonicalTestResources([owner])[0].completed);
  }
  console.log(JSON.stringify({ condition_requalification: checks, group, count: checks.length, synthetic_authority_only: true, cleanup_complete: true }));
}
