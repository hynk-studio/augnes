// Explicitly synthetic predecessor and authority. Only disposable ledgers and
// bounded deterministic witnesses are used; no GitHub or provider calls occur.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { digest } from "../local-canonical-inputs.mjs";
import { TIMEOUT_REPAIR_SCHEMA, TIMEOUT_RETAINED_SOURCES, timeoutAuthorityObservation, authorizeCorrectedTimeout, validateTimeoutPredecessor } from "../local-canonical-timeout-succession.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "../local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "../github-main-branch-transport.mjs";
import { beginAttempt, finishAttempt, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof } from "../local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership, CHECKOUT_OWNER_FILE } from "../local-canonical-checkout-ownership.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "../canonical-test-environment.mjs";
import { runCanonicalChild } from "../canonical-child-runner.mjs";
import { finalizeReceipt, inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { baseReceipt } from "./local-canonical-receipt-v3.mjs";
import { assertReviewChildLifecycle, projectReviewChildResult } from "./local-canonical-review-child-result.mjs";

const self = fileURLToPath(import.meta.url), repository = path.resolve(path.dirname(self), "../..");
const write = (file, value) => writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value), { mode: 0o600 });
const read = file => JSON.parse(readFileSync(file, "utf8"));
const time = offset => new Date(Date.now() + offset).toISOString();
const label = "native request-bound review, attributed continuation and disposable MCP Events lifecycle";
const save = c => write(c.file, c.proof);
const proof = c => readSourceCorrectionProof(c.file, c.checkout);
const transport = (records, change = value => value) => createGitHubObserverAuthorizationTransport(999, { runner: async request => {
  assert.equal(request.operation, "fetch_browser_authority"); assert(request.args.includes("GET"));
  const url = request.args[1]; assert(url.startsWith("repos/hynk-studio/augnes/"));
  const record = url.includes("/reviews/") ? records.repair : url.includes("/comments/") ? records.grant : { permission: "admin", user: { login: "synthetic-fixture" } };
  return change(structuredClone(record), url);
} });
const authorize = (c, p, change) => authorizeCorrectedTimeout(p, { transport: transport(c.authority, change) });
const begin = (c, p, authorization, extra = {}) => beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner,
  branch: p.branch, head: p.head, tree: p.tree, acceptedMain: p.base, runId: "synthetic-timeout-successor", contractFingerprint: "6".repeat(64),
  sourceCorrection: p, timeoutAuthorization: authorization, ...extra });
const treeFiles = (directory, root = directory) => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? treeFiles(file, root) : [{ file: path.relative(root, file), sha256: digest(readFileSync(file)) }];
}).sort((a, b) => a.file.localeCompare(b.file));

function authority(p) {
  const user = { login: "synthetic-fixture", id: 7, type: "User" };
  const repair = { id: 101, user, author_association: "OWNER", state: "COMMENTED", commit_id: p.repair.head,
    submitted_at: time(-2000), pull_request_url: "https://api.github.com/repos/hynk-studio/augnes/pulls/999",
    body: `SYNTHETIC independent review: Reviewed head \`${p.repair.head}\`, tree \`${p.repair.tree}\`. This review accepts the three-file structural-statement correction and its bounded development evidence; historical timeout cause UNKNOWN; qualification HOLD.` };
  p.repair.review = { id: repair.id, sha256: digest(timeoutAuthorityObservation(repair, "accepted_repair")) };
  const grant = { id: 203, user, author_association: "OWNER", updated_at: time(-1000), issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/999",
    body: `## User-authorized continuation — minimal policy correction and one complete qualification\nSYNTHETIC instruction, following https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-101.\nThe reviewed structural-statement correction at \`${p.repair.head}\` / tree \`${p.repair.tree}\` is ACCEPT / RETAIN.\nThe blanket legacy unknown/timeout predecessor refusal is the specific policy boundary now authorized to change for this bounded case.\nThe deciding allowance is **one Full and zero recovery/retry**.\nIt is not a new allowance per commit, worktree, proof, grant copy or accepted-main merge.\nBind the actual final source and all subsequent in-scope policy/integration changes in the new proof.\nDo not label implementation-owner checks as that independent audit.\nThe user's explicit instruction supplies this task authority; the new policy/source and resulting evidence receive independent post-completion audit.\nPreserve the historical cause UNKNOWN.\n` };
  p.authorization = { grant_comment_id: grant.id, grant_sha256: digest(timeoutAuthorityObservation(grant, "execution_grant")) };
  return { repair, grant };
}

async function make(root, child) {
  const checkout = path.join(root, "checkout"), anchor = path.join(root, "anchor"); mkdirSync(checkout); mkdirSync(anchor);
  const owner = acquireCheckoutVerificationOwnership({ repositoryRoot: checkout });
  const git = (...args) => execFileSync("git", args, { cwd: checkout, timeout: 4000, maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const branch = "codex/synthetic-timeout-succession"; git("init", "-b", branch);
  for (const name of ["lib/db", "scripts/fixtures"]) mkdirSync(path.join(checkout, name), { recursive: true });
  const source = TIMEOUT_RETAINED_SOURCES[0];
  write(path.join(checkout, source), "export function inspect(db,names){return names.map(name=>db.prepare('fixed').all(name));}\n");
  write(path.join(checkout, TIMEOUT_RETAINED_SOURCES[1]), "// synthetic operation-count regression\n");
  for (const name of ["scripts/test-request-bound-review.ts", "scripts/test-review-callback-enrollment.ts"])
    write(path.join(checkout, name), "// synthetic unchanged full workload owner\n");
  const suite = readFileSync(path.join(repository, "scripts/run-canonical-test-suite.mjs"), "utf8");
  const registration = suite.match(/    \{\n      id: "request-bound-review",[\s\S]*?\n    \},/u)?.[0];
  assert(registration, "existing complete registration must be retained");
  write(path.join(checkout, "scripts/run-canonical-test-suite.mjs"), registration + "\n");
  const commit = () => { git("add", "lib", "scripts"); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic fixture"); return git("rev-parse", "HEAD").toString().trim(); };
  const base = commit(), oldTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  const resources = ["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable", "browser-executable"].map(id => ({ id, classification: "safety", before: { present: false }, location_fingerprint: digest(id) }));
  const declaration = { contract: "augnes.local-canonical-inputs.v3", path_kind: "isolated-model-free-v1", binding: { head: base, tree: oldTree,
    executor_fingerprint: "a".repeat(64), phase_environment_fingerprints: BROWSER_REPLACEMENT_PHASES.map(id => ({ id, fingerprint: "b".repeat(64) })) }, resources };
  const prior = beginAttempt({ repositoryRoot: checkout, anchorRoot: anchor, checkoutOwner: owner, branch, head: base, tree: oldTree, runId: "synthetic-timeout-predecessor", contractFingerprint: digest(declaration) });
  // This is a synthetic retained log, not a claim of a real 30-second run.
  const log = '[canonical:integration] child_start label="preceding synthetic workload" timeout_ms=30000\n' +
    '[canonical:integration] child_cleanup_result label="preceding synthetic workload" elapsed_ms=5 reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0\n' +
    '[canonical:integration] child_result label="preceding synthetic workload" duration_ms=5 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n' +
    `[canonical:integration] child_start label=${JSON.stringify(label)} timeout_ms=30000\n` +
    `[canonical:integration] child_spawn label=${JSON.stringify(label)} pid=123 wait=process_exit\n` +
    `[canonical:integration] child_cleanup_start label=${JSON.stringify(label)} elapsed_ms=30003 reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false\n` +
    `[canonical:integration] child_cleanup_result label=${JSON.stringify(label)} elapsed_ms=30089 reason=bounded_timeout streams_closed=true remaining_owned_processes=0\n` +
    `[canonical:integration] child_result label=${JSON.stringify(label)} duration_ms=30089 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n` +
    JSON.stringify({ suite: "integration", resource_cleanup: [{ root: "synthetic-owned-root", completed: true, failure_count: 0, failures: [] }] }) + "\n";
  const logRelative = ".augnes-local-verification/logs/synthetic-predecessor/integration.log";
  mkdirSync(path.dirname(path.join(checkout, logRelative)), { recursive: true }); write(path.join(checkout, logRelative), log);
  const receipt = finalizeReceipt({ ...structuredClone(baseReceipt), receipt_version: 4,
    repository: { ...baseReceipt.repository, branch, head_sha: base, tree_sha: oldTree, base_sha: base },
    evidence: { ...baseReceipt.evidence, mode: "full", selected_plan: "full-canonical" },
    verification_context: { kind: "isolated-worktree" }, executor: { ...baseReceipt.executor, source_fingerprint: "a".repeat(64) },
    run: { ...baseReceipt.run, id: prior.attempt_id }, attempt: prior,
    inputs: { ...declaration, fingerprint: digest(declaration), checks: 2, first_fault: null, secondary_faults: [], events: [] },
    outcome: { disposition: "product_failure", safety: "preserved_within_observed_scope", validity: "valid_within_observed_scope", first_fault: null }, checkout_ownership: { released: true }, capacity_ownership: { released: true },
    cleanup: { completed: true, remaining_owned_processes: 0, companion_service: { restored: true }, isolated_resources: { completed: true, failure_count: 0, failures: [] } },
    phases: BROWSER_REPLACEMENT_PHASES.map((id, i) => ({ id, status: i < 7 ? "pass" : i === 7 ? "failure" : "not_run", exit_status: i < 7 ? 0 : i === 7 ? 1 : null,
      failure_code: i === 7 ? "phase_failed" : null, timed_out: false, spawn_error_code: null, environment_fingerprint: "b".repeat(64),
      ...(i === 7 ? { log: { relative_path: logRelative, bytes: Buffer.byteLength(log), truncated: false } } : {}),
      cleanup: { completed: true, remaining_owned_processes: 0, exit_observed: i <= 7, streams_closed: i <= 7, termination_reason: i <= 7 ? "natural_exit" : null } })),
    final: { result: "failure", exit_status: 1, reason_codes: ["phase_failed", "selected_phases_incomplete"] } });
  finishAttempt(prior, { receiptFingerprint: receipt.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
  const family = path.join(anchor, ".augnes-local-verification/families", prior.family_id), completionFile = path.join(family, "completion-1.json");
  const completion = read(completionFile); completion.finished_at = time(-20000); write(completionFile, completion);
  const folder = path.join(checkout, ".augnes-local-verification/timeout"); mkdirSync(folder);
  write(path.join(folder, "original-receipt.json"), receipt); write(path.join(folder, "original-integration.log"), log);
  cpSync(path.join(family, "attempt-1.json"), path.join(folder, "original-attempt.json")); cpSync(completionFile, path.join(folder, "original-completion.json"));
  const regression = "import assert from 'node:assert/strict';import{pathToFileURL}from'node:url';const{inspect}=await import(pathToFileURL(process.argv[2]).href);let n=0;const calls=[];const db={prepare(sql){n++;return{all(name){calls.push([sql,name]);return[name]}}}};assert.deepEqual(inspect(db,['a','b','c']),[['a'],['b'],['c']]);assert.deepEqual(calls,[['fixed','a'],['fixed','b'],['fixed','c']]);assert.equal(n,1);\n";
  write(path.join(checkout, source), "export function inspect(db,names){const statement=db.prepare('fixed');return names.map(name=>statement.all(name));}\n");
  write(path.join(checkout, TIMEOUT_RETAINED_SOURCES[1]), regression);
  const repairHead = commit(), repairTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  write(path.join(checkout, "scripts/local-canonical-timeout-succession.mjs"), "// synthetic bounded policy owner\n");
  const head = commit(), tree = git("rev-parse", "HEAD^{tree}").toString().trim();
  write(path.join(folder, "regression.mjs"), regression);
  const witnesses = {};
  for (const [kind, ref, expected] of [["before", base, 1], ["after", repairHead, 0]]) {
    const bytes = git("show", `${ref}:${source}`); writeFileSync(path.join(folder, `${kind}.mjs`), bytes);
    const result = await child([path.join(folder, "regression.mjs"), path.join(folder, `${kind}.mjs`)], `timeout-regression-${kind}`); assert.equal(result.exit_code, expected);
    const artifact = `${kind}.json`; write(path.join(folder, artifact), { fixture_sha256: digest(regression), source_sha256: digest(bytes), environment_fingerprint: "e".repeat(64), node_version: process.versions.node,
      result, finished_at: time(kind === "before" ? -8000 : -7000) });
    witnesses[kind] = { artifact, sha256: digest(readFileSync(path.join(folder, artifact))), source_sha256: digest(bytes) };
  }
  const delta = (from, to) => ({ delta_sha256: digest(git("diff", "--binary", "--no-ext-diff", "--no-textconv", from, to, "--")), changed_paths: git("diff", "--name-only", from, to, "--").toString().trim().split("\n").filter(Boolean).sort() });
  const p = { schema: TIMEOUT_REPAIR_SCHEMA, kind: "corrected_timeout", defect: "fixed_pragma_statement_repreparation", branch, base, head, tree,
    prior_family_id: prior.family_id, prior_number: 1, prior_attempt_id: prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    source_module: source, fixture_artifact: "regression.mjs", fixture_sha256: digest(regression), environment_fingerprint: "e".repeat(64), ...witnesses,
    originals: Object.fromEntries(["receipt", "attempt", "completion"].map(kind => [kind, { artifact: `original-${kind}.json`, sha256: digest(readFileSync(path.join(folder, `original-${kind}.json`))) }])),
    timeout: { phase: "integration", label, budget_ms: 30000, log: { artifact: "original-integration.log", sha256: digest(log) }, historical_cause: "UNKNOWN" },
    repair: { head: repairHead, tree: repairTree, ...delta(base, repairHead), review: null }, ...delta(base, head),
    final_delta: { basis: "implementation_owner_not_independent_review", ...delta(repairHead, head) },
    retained_sources: Object.fromEntries(TIMEOUT_RETAINED_SOURCES.map(name => [name, digest(git("show", `${head}:${name}`))])),
    authorization: null, pull_request: 999, budget: { initial: 1, recovery: 0 } };
  const c = { checkout, anchor, owner, git, commit, delta, family, receipt, proof: p, folder, file: path.join(folder, "proof.json"), logRelative };
  c.authority = authority(p); save(c); return c;
}

if (process.argv[2] === "--claim-timeout-fixture") {
  const packet = read(process.argv[3]); let owner;
  try {
    owner = acquireCheckoutVerificationOwnership({ repositoryRoot: packet.checkout });
    const p = readSourceCorrectionProof(packet.file, packet.checkout), authorization = await authorizeCorrectedTimeout(p, { transport: transport(packet.authority) });
    const attempt = beginAttempt({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, checkoutOwner: owner, branch: p.branch, head: p.head, tree: p.tree,
      acceptedMain: p.base, runId: packet.run_id, contractFingerprint: "6".repeat(64), sourceCorrection: p, timeoutAuthorization: authorization });
    finishAttempt(attempt, { receiptFingerprint: "7".repeat(64), disposition: "product_failure", cleanupComplete: true });
    console.log("exclusive_claim_won");
  } catch (error) { console.log(`exclusive_claim_refused:${error.code}`); process.exitCode = 1; }
  finally { if (owner) releaseCheckoutVerificationOwnership(owner, packet.checkout, { consumersSettled: true }); }
} else if (process.argv[2] === "--stock-timeout-fixture") {
  const packet = read(process.argv[3]), before = treeFiles(packet.anchor), p = readSourceCorrectionProof(packet.file, packet.checkout);
  const authorization = await authorizeCorrectedTimeout(p, { transport: transport(packet.authority) });
  const receipt = read(packet.receipt);
  assert(inspectAttemptRecords({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, receipt, timeoutAuthorization: authorization }));
  assert(!inspectReceiptForDecision(receipt, { currentAttemptRecordsValid: true }).issues.includes("receipt_timeout_succession_invalid"));
  assert.deepEqual(treeFiles(packet.anchor), before); console.log("fresh stock reconstructs without reservation or ledger mutation");
} else if (process.argv[2] === "--run-timeout-fixtures") {
  await timeoutSuccessionControls(process.argv[3] ?? "all");
}

export async function timeoutSuccessionControls(group = "all") {
  assert(["all", "evidence", "witnesses", "source", "originals", "admission", "race", "stock"].includes(group));
  const owner = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(owner);
  let c, active = 0; const checks = [];
  const child = async (args, controlId) => {
    active++; let output = "";
    const result = await runCanonicalChild({ suite: "timeout-succession-fixture", label: "synthetic fixture", command: process.execPath, args, cwd: owner.root,
      env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), timeoutMs: 4000,
      stdout: { write: chunk => output = (output + chunk).slice(-2000) }, stderr: { write: chunk => output = (output + chunk).slice(-2000) }, log() {} });
    if (result.cleanup_completed && result.exit_observed && result.streams_closed && result.remaining_owned_processes === 0) active--;
    console.log("AUGNES_TIMEOUT_FIXTURE_CHILD " + JSON.stringify(projectReviewChildResult(result, { controlId })));
    assertReviewChildLifecycle(result, { controlId }); result.fixture_output = output; return result;
  };
  const pass = name => checks.push(name);
  try {
    c = await make(owner.root, child);
    const saved = structuredClone(c.proof), validated = proof(c), authorized = await authorize(c, validated);
    assert(validated && authorized); pass("complete synthetic timeout evidence and prospective authority");
    const edge = path.join(c.family, "correction-successor.json");
    const actualCompletion = path.join(c.family, "completion-1.json");
    assert(!existsSync(edge)); pass("reader and authority inspection do not reserve");
    const resetProof = () => { c.proof = structuredClone(saved); save(c); };
    if (["all", "evidence"].includes(group)) {
      for (const [name, mutate] of [
        ["legacy v1", p => p.schema = "augnes.local-canonical-source-correction.v1"],
        ["legacy v2", p => p.schema = "augnes.local-canonical-source-correction.v2"],
        ["observer v3", p => p.schema = "augnes.local-canonical-source-correction.v3"],
        ["unknown retry kind", p => p.kind = "unknown_retry"], ["missing originals", p => delete p.originals],
        ["receipt bytes", p => p.originals.receipt.sha256 = "0".repeat(64)],
        ["attempt bytes", p => p.originals.attempt.sha256 = "0".repeat(64)],
        ["completion bytes", p => p.originals.completion.sha256 = "0".repeat(64)],
        ["timeout bytes", p => p.timeout.log.sha256 = "0".repeat(64)], ["timeout budget", p => p.timeout.budget_ms = 31000],
        ["historical cause rewrite", p => p.timeout.historical_cause = "fixed"],
        ["unknown source", p => p.source_module = "lib/unrelated.mjs"], ["unchanged repair", p => p.repair.head = p.base],
        ["candidate tree", p => p.tree = p.base], ["source delta", p => p.delta_sha256 = "0".repeat(64)],
        ["final policy delta", p => p.final_delta.delta_sha256 = "0".repeat(64)],
        ["implementation audit relabel", p => p.final_delta.basis = "independent_review"],
        ["path inventory", p => p.changed_paths.pop()], ["reviewed regression changed", p => p.retained_sources[TIMEOUT_RETAINED_SOURCES[1]] = "0".repeat(64)],
        ["fixture identity", p => p.fixture_sha256 = "0".repeat(64)], ["before witness", p => p.before.sha256 = "0".repeat(64)],
        ["recovery allowance", p => p.budget.recovery = 1], ["duplicate initial allowance", p => p.budget.initial = 2],
        ["array digest", p => p.retained_sources[TIMEOUT_RETAINED_SOURCES[0]] = [p.retained_sources[TIMEOUT_RETAINED_SOURCES[0]]]],
        ["array commit", p => p.head = [p.head]],
      ]) {
        resetProof(); mutate(c.proof); save(c); assert.throws(() => proof(c), undefined, name);
        assert(!existsSync(edge)); pass(`refuse ${name}`);
      }
      resetProof();
    }
    if (["all", "witnesses"].includes(group)) {
      const cosmetic = path.join(c.folder, "cosmetic.mjs");
      write(cosmetic, readFileSync(path.join(c.folder, "before.mjs"), "utf8") + "// cosmetic comment only\n");
      const cosmeticResult = await child([path.join(c.folder, "regression.mjs"), cosmetic], "timeout-cosmetic-regression");
      assert.equal(cosmeticResult.exit_code, 1); pass("cosmetic source still fails the same actual operation-count regression");
      const witnessFile = path.join(c.folder, c.proof.after.artifact), witnessBytes = readFileSync(witnessFile);
      for (const [name, mutate] of [
        ["cosmetic correction still fails", r => r.result.exit_code = 1], ["cancelled witness", r => r.result.cancelled = true],
        ["timed out witness", r => r.result.timed_out = true], ["witness cleanup residue", r => r.result.remaining_owned_processes = 1],
        ["changed witness environment", r => r.environment_fingerprint = "0".repeat(64)],
        ["witness before settlement", r => r.finished_at = time(-30000)],
      ]) {
        const record = JSON.parse(witnessBytes); mutate(record); write(witnessFile, record);
        c.proof.after.sha256 = digest(readFileSync(witnessFile)); save(c); assert.throws(() => proof(c), undefined, name);
        writeFileSync(witnessFile, witnessBytes); resetProof(); pass(`refuse ${name}`);
      }
    }
    if (["all", "source"].includes(group)) {
      for (const [name, file, replacement] of [
        ["unrelated", "lib/unrelated.mjs", "export const unrelated=true;\n"],
        ["workload", "scripts/test-request-bound-review.ts", "// removed the actual workload\n"],
        ["deadline", "scripts/run-canonical-test-suite.mjs", readFileSync(path.join(c.checkout, "scripts/run-canonical-test-suite.mjs"), "utf8").replace("30_000", "60_000")],
      ]) {
        c.git("checkout", "-b", `synthetic-${name}`, saved.head); write(path.join(c.checkout, file), replacement);
        c.proof.head = c.commit(); c.proof.tree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
        Object.assign(c.proof, c.delta(c.proof.base, c.proof.head)); Object.assign(c.proof.final_delta, c.delta(c.proof.repair.head, c.proof.head));
        save(c); assert.throws(() => proof(c), /timeout_(?:unrelated_candidate_delta|workload_changed)/);
        resetProof(); c.git("checkout", saved.branch); pass(`refuse actual ${name} source delta with matching Git inventories`);
      }
    }
    if (["all", "originals"].includes(group)) {
      for (const [name, mutate] of [
        ["missing input inventory", r => r.inputs.resources = r.inputs.resources.filter(resource => resource.id !== "git-config")], ["input first fault", r => r.inputs.first_fault = { disposition: "observer_failure" }],
        ["empty input observation", r => r.inputs.resources[0].before = {}],
        ["zero input checks", r => r.inputs.checks = 0], ["executor mismatch", r => r.inputs.binding.executor_fingerprint = "c".repeat(64)],
        ["missing phase environment", r => r.inputs.binding.phase_environment_fingerprints.pop()],
        ["invalid executable observation", r => Object.assign(r.inputs.resources[0], { classification: "execution", readOnlyExecutable: true, before: { present: true, executable_identity_policy: "shared-posix-v1" } })],
        ["secondary input fault", r => r.inputs.secondary_faults.push({ disposition: "safety_violation" })],
        ["unsafe input outcome", r => r.outcome.safety = "blocked"], ["unknown outer outcome", r => r.outcome.disposition = "unknown_relevance"],
        ["outer phase timeout", r => r.phases[7].timed_out = true], ["other phase failure", r => r.phases[6].status = "failure"],
        ["PASS reuse after failure", r => r.phases[8].status = "pass"], ["missing phase", r => r.phases.pop()],
        ["unsettled phase", r => r.phases[7].cleanup.streams_closed = false], ["unfinished cleanup", r => r.cleanup.completed = false],
        ["owned residue", r => r.cleanup.remaining_owned_processes = 1], ["Companion unrestored", r => r.cleanup.companion_service.restored = false],
        ["checkout owner retained", r => r.checkout_ownership.released = false], ["capacity retained", r => r.capacity_ownership.released = false],
      ]) {
        const changed = structuredClone(c.receipt); mutate(changed);
        changed.inputs.fingerprint = digest({ contract: changed.inputs.contract, path_kind: changed.inputs.path_kind, binding: changed.inputs.binding, resources: changed.inputs.resources });
        changed.attempt.contract_fingerprint = changed.inputs.fingerprint;
        assert.throws(() => validateTimeoutPredecessor(finalizeReceipt(changed)), undefined, name); pass(`refuse ${name}`);
      }
      // Rebind every synthetic byte/length/fingerprint so these controls reach
      // semantic log checks rather than merely demonstrating a stale hash.
      const logCopy = path.join(c.folder, saved.timeout.log.artifact), logOriginal = path.join(c.checkout, c.logRelative);
      const receiptFile = path.join(c.folder, saved.originals.receipt.artifact), completionFile = path.join(c.folder, saved.originals.completion.artifact);
      const originalFiles = [logCopy, logOriginal, receiptFile, completionFile, actualCompletion];
      const originals = new Map(originalFiles.map(file => [file, readFileSync(file)]));
      for (const [name, mutate] of [
        ["missing nested start", log => log.split("\n").filter(line => !(line.includes("child_start") && line.includes(label))).join("\n")],
        ["malformed nested start", log => log.replace("child_start label=", "child_start malformed=")],
        ["nested non-timeout failure", log => log.replace("timed_out=true", "timed_out=false")],
        ["nested cleanup residue", log => log.replaceAll("remaining_owned_processes=0", "remaining_owned_processes=1")],
        ["duplicate nested timeout", log => log + log.split("\n").find(line => line.includes("child_result") && line.includes(label)) + "\n"],
        ["unrelated child failure", log => log.replace("exit_code=0", "exit_code=1")],
        ["missing prior child cleanup", log => log.split("\n").filter(line => !(line.includes("child_cleanup_result") && line.includes("preceding synthetic workload"))).join("\n")],
        ["prior child cleanup contradiction", log => log.replace("term_sent=false kill_sent=false streams_closed=true", "term_sent=false kill_sent=false streams_closed=false")],
        ["missing resource cleanup", log => log.split("\n").filter(line => !line.includes('"resource_cleanup"')).join("\n")],
        ["resource cleanup failed", log => log.replace('"completed":true', '"completed":false')],
        ["truncated log", log => log],
      ]) {
        resetProof(); const log = mutate(originals.get(logCopy).toString()); write(logCopy, log); write(logOriginal, log);
        const originalReceipt = JSON.parse(originals.get(receiptFile)); originalReceipt.phases[7].log.bytes = Buffer.byteLength(log);
        if (name === "truncated log") originalReceipt.phases[7].log.truncated = true;
        const sealed = finalizeReceipt(originalReceipt); write(receiptFile, sealed);
        const completion = JSON.parse(originals.get(completionFile)); completion.receipt_fingerprint = sealed.integrity.content_fingerprint;
        write(completionFile, completion); write(actualCompletion, completion);
        c.proof.prior_receipt_fingerprint = sealed.integrity.content_fingerprint;
        for (const kind of ["receipt", "completion"]) c.proof.originals[kind].sha256 = digest(readFileSync(path.join(c.folder, c.proof.originals[kind].artifact)));
        c.proof.timeout.log.sha256 = digest(log); save(c); assert.throws(() => proof(c), undefined, name);
        for (const [file, bytes] of originals) writeFileSync(file, bytes); pass(`refuse ${name}`);
      }
      resetProof(); assert.deepEqual(proof(c), validated);
      for (const [name, mutate] of [
        ["missing grant", (r, url) => url.includes("comments") ? null : r],
        ["changed grant", (r, url) => url.includes("comments") ? { ...r, body: r.body + "changed" } : r],
        ["wrong grant destination", (r, url) => url.includes("comments") ? { ...r, issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/1" } : r],
        ["future grant", (r, url) => url.includes("comments") ? { ...r, updated_at: time(60000) } : r],
        ["reordered grant", (r, url) => url.includes("comments") ? { ...r, updated_at: time(-10000) } : r],
        ["changed review", (r, url) => url.includes("reviews") ? { ...r, body: r.body + "changed" } : r],
        ["wrong review source", (r, url) => url.includes("reviews") ? { ...r, commit_id: c.proof.head } : r],
        ["bot author", r => r.user?.type ? { ...r, user: { ...r.user, type: "Bot" } } : r],
        ["revoked maintainer permission", r => r.permission ? { ...r, permission: "read" } : r],
        ["unavailable authenticated read", () => { throw new Error("synthetic unavailable"); }],
      ]) { await assert.rejects(() => authorize(c, validated, mutate), undefined, name); pass(`refuse ${name}`); }
      for (const [name, role, mutate] of [
        ["grant budget prose", "grant", body => body.replace("one Full and zero recovery/retry", "unlimited Full and recovery/retry")],
        ["grant review source prose", "grant", body => body.replace(c.proof.repair.head, c.proof.head)],
        ["accepted correction scope", "repair", body => body.replace("accepts the three-file", "does not accept the three-file")],
      ]) {
        const records = structuredClone(c.authority), changed = structuredClone(validated); records[role].body = mutate(records[role].body);
        const observation = timeoutAuthorityObservation(records[role], role === "repair" ? "accepted_repair" : "execution_grant");
        if (role === "repair") changed.repair.review.sha256 = digest(observation); else changed.authorization.grant_sha256 = digest(observation);
        await assert.rejects(() => authorizeCorrectedTimeout(changed, { transport: transport(records) }), /timeout_(?:authority|review)_scope_invalid/);
        pass(`refuse hash-consistent ${name}`);
      }
    }
    if (["all", "admission"].includes(group)) {
      assert.throws(() => begin(c, validated, { observations: authorized.observations }), /timeout_authenticated_authority_required/); pass("forged local authority cannot reserve");
      assert.throws(() => begin(c, validated, authorized, { acceptedMain: "0".repeat(40) }), /timeout_current_base_required/); pass("fresh main binding required");
      assert.throws(() => begin(c, validated, authorized, { branch: "codex/copied-grant" })); pass("branch copy cannot reuse authority");
      const completionBytes = readFileSync(actualCompletion);
      rmSync(actualCompletion); assert.throws(() => begin(c, validated, authorized)); writeFileSync(actualCompletion, completionBytes); pass("unsettled latest predecessor refuses");
      write(actualCompletion, { ...read(actualCompletion), cleanup_complete: false }); assert.throws(() => begin(c, validated, authorized)); writeFileSync(actualCompletion, completionBytes); pass("changed live completion refuses");
      const newerAttempt = path.join(c.family, "attempt-2.json"), newerCompletion = path.join(c.family, "completion-2.json");
      write(newerAttempt, { ...read(path.join(c.family, "attempt-1.json")), number: 2, attempt_id: "synthetic-newer-tip" });
      assert.throws(() => begin(c, validated, authorized), /attempt_latest_tip_required/);
      write(newerCompletion, { ...read(actualCompletion), attempt_id: "synthetic-newer-tip" });
      assert.throws(() => begin(c, validated, authorized), /attempt_latest_tip_required/);
      rmSync(newerAttempt); rmSync(newerCompletion); pass("older settled or unsettled tip cannot regain allowance");
    }
    if (["all", "race"].includes(group)) {
      const raceAnchor = path.join(owner.root, "race-anchor"); cpSync(c.anchor, raceAnchor, { recursive: true });
      const racePackets = [];
      for (const index of [1, 2]) {
        const checkout = path.join(owner.root, `race-checkout-${index}`);
        cpSync(c.checkout, checkout, { recursive: true, filter: file => path.basename(file) !== CHECKOUT_OWNER_FILE });
        const packet = path.join(owner.root, `race-${index}.json`);
        write(packet, { checkout, anchor: raceAnchor, file: path.join(checkout, ".augnes-local-verification/timeout/proof.json"), authority: c.authority, run_id: `synthetic-race-${index}` }); racePackets.push(packet);
      }
      const race = await Promise.all(racePackets.map((packet, index) => child([self, "--claim-timeout-fixture", packet], `timeout-race-${index + 1}`)));
      assert.deepEqual(race.map(result => result.exit_code).sort(), [0, 1], race.map(result => result.fixture_output).join("\n"));
      assert.equal(race.filter(result => result.fixture_output.includes("exclusive_claim_won")).length, 1); pass("two worktrees reserve one shared predecessor edge");
    }
    if (["all", "stock"].includes(group)) {
      const attempt = begin(c, validated, authorized); assert.deepEqual(attempt.budget, { initial: 1, recovery: 0 });
      assert.throws(() => begin(c, validated, authorized), /attempt_latest_tip_required/); pass("duplicate reservation before completion refuses");
      const current = finalizeReceipt({ ...structuredClone(c.receipt), repository: { ...c.receipt.repository, head_sha: c.proof.head, tree_sha: c.proof.tree },
        run: { ...c.receipt.run, id: attempt.attempt_id }, attempt, inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, head: c.proof.head, tree: c.proof.tree } } });
      finishAttempt(attempt, { receiptFingerprint: current.integrity.content_fingerprint, disposition: current.outcome.disposition, cleanupComplete: true });
      const ledgerBefore = treeFiles(c.anchor);
      assert(inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current, timeoutAuthorization: authorized }));
      assert.deepEqual(treeFiles(c.anchor), ledgerBefore); pass("stock reconstructs without ledger writes");
      const inspection = inspectReceiptForDecision(current, { currentAttemptRecordsValid: true });
      assert(!inspection.issues.includes("receipt_timeout_succession_invalid")); assert(!inspection.valid_deciding_evidence); pass("failed synthetic successor remains non-deciding");
      assert(!inspectReceiptForDecision(c.receipt).valid_deciding_evidence); pass("historical failed receipt remains invalid");
      assert(!inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current })); pass("stock cannot manufacture authorization");
      for (const change of [r => r.attempt.budget.recovery = 1, r => r.attempt.source_correction.budget.recovery = 1,
        r => r.attempt.number = 2, r => r.attempt.timeout_authority.execution_grant.role = "implementation_owner"]) {
        const altered = structuredClone(current); change(altered);
        assert(inspectReceiptForDecision(finalizeReceipt(altered), { currentAttemptRecordsValid: true }).issues.includes("receipt_timeout_succession_invalid"));
      }
      pass("stock refuses recovery, second attempts and altered grant roles");
      const successorReceipt = path.join(c.folder, "successor-receipt.json"); write(successorReceipt, current);
      const packet = path.join(c.folder, "stock-packet.json"); write(packet, { checkout: c.checkout, anchor: c.anchor, file: c.file, authority: c.authority, receipt: successorReceipt });
      const stock = await child([self, "--stock-timeout-fixture", packet], "timeout-stock"); assert.equal(stock.exit_code, 0, stock.fixture_output); pass("cold stock process reconstructs without reservation");
      assert.throws(() => begin(c, validated, authorized));
      write(path.join(c.checkout, "scripts/local-canonical-timeout-succession.mjs"), "// synthetic further in-scope source revision\n");
      const revisionHead = c.commit(), revisionTree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
      c.proof.head = revisionHead; c.proof.tree = revisionTree;
      Object.assign(c.proof, c.delta(c.proof.base, revisionHead));
      Object.assign(c.proof.final_delta, c.delta(c.proof.repair.head, revisionHead)); save(c);
      const revision = proof(c), revisionAuthorization = await authorize(c, revision);
      assert.throws(() => begin(c, revision, revisionAuthorization), /attempt_latest_tip_required/);
      resetProof(); pass("new in-scope commit and rebound proof cannot renew consumed authority");
      assert.throws(() => beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner, branch: c.proof.branch,
        head: c.proof.head, tree: c.proof.tree, runId: "forbidden-reset", contractFingerprint: "7".repeat(64) }), /attempt_candidate_superseded/);
      pass("grant is terminal after completion and cannot reset the old family");
      const successorRoot = path.join(c.anchor, ".augnes-local-verification/families", attempt.family_id);
      const successorAttempt = path.join(successorRoot, "attempt-1.json"), successorBytes = readFileSync(successorAttempt);
      rmSync(successorAttempt); assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch })); assert.throws(() => begin(c, validated, authorized));
      writeFileSync(successorAttempt, successorBytes); pass("interrupted reservation is retained and cannot be replayed");
      write(path.join(successorRoot, "correction-successor.json"), { family_id: "f".repeat(64), head: c.proof.head, tree: c.proof.tree, proof_fingerprint: digest(validated) });
      assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch }), /attempt_timeout_successor_terminal/);
      rmSync(path.join(successorRoot, "correction-successor.json")); pass("recursive successor refuses even with another edge record");
      assert(existsSync(edge)); assert.equal(read(actualCompletion).disposition, "product_failure");
      assert.equal(read(path.join(c.folder, "original-receipt.json")).integrity.content_fingerprint, c.receipt.integrity.content_fingerprint);
      pass("original failed interpretation and reserved edge remain unchanged");
    }
  } finally {
    if (c?.owner) releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: !active });
    if (!active) settleCanonicalTestResourceUse(owner, { cleanup_completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0 });
    const cleanup = cleanupCanonicalTestResources([owner])[0]; assert(cleanup.completed, JSON.stringify(cleanup));
  }
  console.log(JSON.stringify({ timeout_succession: checks, group, count: checks.length, synthetic_authority_only: true, cleanup_complete: true }));
  return checks;
}
