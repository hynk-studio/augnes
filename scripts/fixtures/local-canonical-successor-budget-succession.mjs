// Disposable synthetic validator/record controls. Fixed production pins are not
// overridden, and a synthetic structural record never becomes authorization.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { digest } from "../local-canonical-inputs.mjs";
import { BUDGET_SCHEMA, BUDGET_ACCEPTED, authorizeSuccessorBudgetSuccession, assertSuccessorBudgetAuthorization, validSuccessorBudgetAttempt,
  validateSuccessorBudgetPredecessor, validateSuccessorBudgetSource, validateSuccessorBudgetDiagnosis,
  validateSuccessorBudgetAuthorityRecords } from "../local-canonical-successor-budget-succession.mjs";
import { OPERATING_PROFILE_SCHEMA, PROFILE_ACCEPTED, validOperatingProfileAttempt } from "../local-canonical-operating-profile-succession.mjs";
import { timeoutAuthorityObservation } from "../local-canonical-timeout-succession.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "../local-canonical-browser-replacement.mjs";
import { ATTEMPT_CONTRACT, beginAttempt, reconstructAttemptTip, inspectAttemptRecords, readSourceCorrectionProof } from "../local-canonical-attempts.mjs";
import { createGitHubObserverAuthorizationTransport } from "../github-main-branch-transport.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "../local-canonical-checkout-ownership.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse,
  cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "../canonical-test-environment.mjs";
import { runCanonicalChild } from "../canonical-child-runner.mjs";
import { finalizeReceipt, inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "../local-canonical-review-export.mjs";
import { baseReceipt } from "./local-canonical-receipt-v3.mjs";
import { assertReviewChildLifecycle, projectReviewChildResult } from "./local-canonical-review-child-result.mjs";

const self = fileURLToPath(import.meta.url), repository = path.resolve(path.dirname(self), "../..");
const contractPath = "scripts/test-local-canonical-verification-contract.mjs";
const suitePath = "scripts/run-canonical-test-suite.mjs", fixturePath = "scripts/test-vnext-project-work-initialization.ts";
const label = "settled failed result, expired history and explicit revalidated task authorship";
const write = (file, value) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file,
  typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value), { mode: 0o600 }); };
const read = file => JSON.parse(readFileSync(file, "utf8"));
const clone = value => structuredClone(value);
const time = offset => new Date(Date.now() + offset).toISOString();
const treeFiles = (directory, root = directory) => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? treeFiles(file, root) : [{ file: path.relative(root, file), sha256: digest(readFileSync(file)) }];
}).sort((a, b) => a.file.localeCompare(b.file));
const profileObservations = {
  accepted_repair: { id: 5721999096, author: "hynk-studio", author_id: 89450056,
    body_sha256: "292e3bbd25d97929e8f995b6412266a525439a60d5ad9e9cfa4f5dc45537bfc7", timestamp: "2026-10-31T08:31:34Z",
    role: "accepted_repair", commit_id: "35054619c612c1ffc6ff5bb42c370b7416758bbb" },
  execution_grant: { id: 6541192997, author: "hynk-studio", author_id: 89450056,
    body_sha256: "878b5a38e4eba06833e19e4e1e70602f036a3849f520ebfce8382a7ac2771447", timestamp: "2026-10-31T08:33:02Z",
    role: "execution_grant", commit_id: null },
};

function predecessor(c, initialId = "synthetic-budget-original") {
  const initialFamily = digest([ATTEMPT_CONTRACT, "hynk-studio/augnes", c.branch]);
  const initial = { contract: ATTEMPT_CONTRACT, family_id: initialFamily, attempt_id: initialId,
    number: 1, branch: c.branch, head: "a".repeat(40), tree: "b".repeat(40), contract_fingerprint: "c".repeat(64),
    started_at: time(-400000), prior_attempt_id: null, prior_receipt_fingerprint: null, recovery: null,
    source_correction: null, budget: { initial: 1, recovery: 1 } };
  const p = { schema: OPERATING_PROFILE_SCHEMA, kind: "operating_profile_efficiency", branch: c.branch,
    base: c.base, head: c.base, tree: c.baseTree, prior_family_id: initialFamily, prior_number: 1,
    prior_attempt_id: initial.attempt_id, prior_receipt_fingerprint: "d".repeat(64), pull_request: PROFILE_ACCEPTED.pull_request,
    budget: { initial: 1, recovery: 0 }, originals: Object.fromEntries(["receipt", "attempt", "completion", "log"].map(kind => [kind,
      { artifact: `synthetic-profile-${kind}.json`, sha256: PROFILE_ACCEPTED[kind === "log" ? "retained_log_sha256" : `${kind}_sha256`] }])),
    improvement: { base: c.base, head: profileObservations.accepted_repair.commit_id, tree: c.baseTree,
      review: { id: PROFILE_ACCEPTED.review_id, sha256: PROFILE_ACCEPTED.review_sha256 },
      evidence: { accepted_manifest: { artifact: "synthetic-profile-accepted.json", sha256: PROFILE_ACCEPTED.manifest_sha256 },
        manifest: { artifact: "synthetic-profile-evidence.json", sha256: "e".repeat(64) } } },
    final_source: { artifact: "synthetic-profile-source.json", sha256: "f".repeat(64) },
    authorization: { grant_comment_id: PROFILE_ACCEPTED.grant_id, grant_sha256: PROFILE_ACCEPTED.grant_sha256 } };
  const familyId = digest([ATTEMPT_CONTRACT, "hynk-studio/augnes", c.branch, "verified_source_correction", initial.attempt_id, c.base, c.baseTree]);
  const prior = { ...initial, family_id: familyId, attempt_id: "synthetic-budget-predecessor", head: c.base, tree: c.baseTree,
    started_at: time(-200000), source_correction: p, profile_authority: clone(profileObservations), budget: { initial: 1, recovery: 0 } };
  assert(validOperatingProfileAttempt(prior));
  const initialRoot = path.join(c.anchor, ".augnes-local-verification/families", initialFamily);
  write(path.join(initialRoot, "attempt-1.json"), initial);
  write(path.join(initialRoot, "completion-1.json"), { contract: ATTEMPT_CONTRACT, attempt_id: initial.attempt_id,
    receipt_fingerprint: p.prior_receipt_fingerprint, disposition: "product_failure", cleanup_complete: true,
    infrastructure_code: null, finished_at: time(-300000) });
  const edge = { contract: "augnes.local-canonical-successor.v2", kind: "operating_profile_efficiency", family_id: familyId,
    head: prior.head, tree: prior.tree, proof_fingerprint: digest(p) };
  write(path.join(initialRoot, "correction-successor.json"), edge);
  return { prior, incomingEdge: edge, family: path.join(c.anchor, ".augnes-local-verification/families", familyId) };
}

function originalLog() {
  const preceding = "preceding synthetic workload", later = "unstarted synthetic workload";
  const rows = [
    `[canonical:integration] child_start label=${JSON.stringify(preceding)} timeout_ms=30000`,
    `[canonical:integration] child_cleanup_result label=${JSON.stringify(preceding)} elapsed_ms=5 reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0`,
    `[canonical:integration] child_result label=${JSON.stringify(preceding)} duration_ms=5 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`,
    `[canonical:integration] child_start label=${JSON.stringify(label)} timeout_ms=30000`,
    `[canonical:integration] child_spawn label=${JSON.stringify(label)} pid=123 wait=process_exit`,
    `[canonical:integration] child_cleanup_start label=${JSON.stringify(label)} elapsed_ms=30002 reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false`,
    `[canonical:integration] child_cleanup_result label=${JSON.stringify(label)} elapsed_ms=30087 reason=bounded_timeout streams_closed=true remaining_owned_processes=0`,
    `[canonical:integration] child_result label=${JSON.stringify(label)} duration_ms=30087 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout`,
    "[canonical:integration] group_inventory " + JSON.stringify({ selected_count: 3, started_count: 2, settled_count: 2, completed_count: 2, failed_count: 1, unstarted_count: 1,
      children: [{ group: "supporting-serial", label: preceding, started: true, settled: true, completed: true, outcome: "passed" },
        { group: "supporting-serial", label, started: true, settled: true, completed: true, outcome: "failed" },
        { group: "supporting-serial", label: later, started: false, settled: false, completed: false, outcome: "not_started_after_failure" }] }),
    JSON.stringify({ suite: "integration", resource_cleanup: [{ root: "synthetic-owned-root", completed: true, failure_count: 0, failures: [] }] }),
  ];
  return Buffer.from(rows.join("\n") + "\n");
}

function make(root, own) {
  const c = { checkout: path.join(root, "checkout"), anchor: path.join(root, "anchor"), branch: "codex/synthetic-successor-budget" };
  mkdirSync(c.checkout); mkdirSync(c.anchor); c.owner = acquireCheckoutVerificationOwnership({ repositoryRoot: c.checkout }); own(c);
  c.git = (...args) => execFileSync("git", args, { cwd: c.checkout, timeout: 4000, maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  c.git("init", "-b", c.branch);
  c.commit = () => { c.git("add", "scripts"); c.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic successor-budget fixture"); return c.git("rev-parse", "HEAD").toString().trim(); };
  const currentSuite = readFileSync(path.join(repository, suitePath), "utf8");
  const registration = currentSuite.match(/    \{\n      id: "settled-expired-successor",[\s\S]*?\n    \},/u)?.[0];
  assert(registration?.includes("timeoutMs: 45_000"));
  c.acceptedSuite = currentSuite.replace(registration, registration.replace("timeoutMs: 45_000", "timeoutMs: 30_000"));
  write(path.join(c.checkout, suitePath), c.acceptedSuite);
  const currentContract = readFileSync(path.join(repository, contractPath), "utf8");
  const targetContract = currentContract.match(/const expiredSuccessorRegistration = [\s\S]*?\nfor \(const fragment of \[[^\n]+\]\)/u)?.[0];
  assert(targetContract?.includes("timeoutMs: 45_000"));
  write(path.join(c.checkout, contractPath), currentContract.replace(targetContract, targetContract.replace("timeoutMs: 45_000", "timeoutMs: 30_000")));
  c.fixtureBytes = readFileSync(path.join(repository, fixturePath)); write(path.join(c.checkout, fixturePath), c.fixtureBytes);
  c.base = c.commit(); c.baseTree = c.git("rev-parse", "HEAD^{tree}").toString().trim(); Object.assign(c, predecessor(c));
  const log = originalLog(), logRelative = ".augnes-local-verification/logs/synthetic-budget-predecessor/integration.log";
  write(path.join(c.checkout, logRelative), log);
  const declaration = { contract: "augnes.local-canonical-inputs.v3", path_kind: "isolated-model-free-v1", binding: { head: c.base, tree: c.baseTree,
    executor_fingerprint: "a".repeat(64), phase_environment_fingerprints: BROWSER_REPLACEMENT_PHASES.map(id => ({ id, fingerprint: "b".repeat(64) })) },
    resources: ["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable"].map(id => ({ id, classification: "safety", before: { present: false }, location_fingerprint: digest(id) })) };
  c.prior.contract_fingerprint = digest(declaration);
  c.receipt = finalizeReceipt({ ...clone(baseReceipt), receipt_version: 4,
    repository: { ...baseReceipt.repository, branch: c.branch, base_sha: c.base, head_sha: c.base, tree_sha: c.baseTree },
    evidence: { ...baseReceipt.evidence, mode: "full", selected_plan: "full-canonical" }, verification_context: { kind: "isolated-worktree" },
    executor: { ...baseReceipt.executor, source_fingerprint: "a".repeat(64) }, run: { ...baseReceipt.run, id: c.prior.attempt_id }, attempt: c.prior,
    inputs: { ...declaration, fingerprint: digest(declaration), checks: 2, first_fault: null, secondary_faults: [], events: [] },
    outcome: { disposition: "product_failure", safety: "preserved_within_observed_scope", validity: "valid_within_observed_scope", first_fault: null },
    checkout_ownership: { released: true }, capacity_ownership: { released: true },
    cleanup: { completed: true, remaining_owned_processes: 0, companion_service: { restored: true }, isolated_resources: { completed: true, failure_count: 0, failures: [] } },
    phases: BROWSER_REPLACEMENT_PHASES.map((id, index) => ({ id, status: index < 7 ? "pass" : index === 7 ? "failure" : "not_run", exit_status: index < 7 ? 0 : index === 7 ? 1 : null,
      failure_code: index === 7 ? "phase_failed" : null, timed_out: false, spawn_error_code: null, environment_fingerprint: "b".repeat(64),
      ...(index === 7 ? { log: { relative_path: logRelative, bytes: log.length, truncated: false } } : {}),
      cleanup: { completed: true, remaining_owned_processes: 0, exit_observed: index <= 7, streams_closed: index <= 7, termination_reason: index <= 7 ? "natural_exit" : null } })),
    final: { result: "failure", exit_status: 1, reason_codes: ["phase_failed", "selected_phases_incomplete"] } });
  c.completion = { contract: ATTEMPT_CONTRACT, attempt_id: c.prior.attempt_id, receipt_fingerprint: c.receipt.integrity.content_fingerprint,
    disposition: "product_failure", cleanup_complete: true, infrastructure_code: null, finished_at: time(-60000) };
  write(path.join(c.family, "attempt-1.json"), c.prior); write(path.join(c.family, "completion-1.json"), c.completion);
  c.folder = path.join(c.checkout, ".augnes-local-verification/budget");
  for (const [name, value] of Object.entries({ receipt: c.receipt, attempt: c.prior, completion: c.completion, edge: c.incomingEdge, log }))
    write(path.join(c.folder, `original-${name}.${name === "log" ? "log" : "json"}`), value);
  write(path.join(c.checkout, suitePath), currentSuite); write(path.join(c.checkout, contractPath), currentContract); c.head = c.commit(); c.tree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
  c.delta = (base, head) => { const bytes = c.git("diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", base, head, "--");
    return { bytes: bytes.length, sha256: digest(bytes), paths: c.git("diff", "--name-only", base, head, "--").toString().trim().split("\n").filter(Boolean).sort() }; };
  c.finalSource = { schema: "augnes.local-canonical-successor-budget-final-source.v1", basis: "implementation_owner_not_independent_review",
    deltas: { accepted_to_final: c.delta(c.base, c.head), main_to_final: c.delta(c.base, c.head) } };
  write(path.join(c.folder, "final-source.json"), c.finalSource); write(path.join(c.folder, "synthetic-report.md"), "Synthetic NOFIX diagnosis, not accepted production evidence.\n");
  c.ref = artifact => ({ artifact, sha256: digest(readFileSync(path.join(c.folder, artifact))) });
  c.proof = { schema: BUDGET_SCHEMA, kind: "settled_successor_budget", branch: c.branch, base: c.base, head: c.head, tree: c.tree,
    prior_family_id: c.prior.family_id, prior_number: 1, prior_attempt_id: c.prior.attempt_id, prior_receipt_fingerprint: c.receipt.integrity.content_fingerprint,
    pull_request: 999, budget: { initial: 1, recovery: 0 }, originals: Object.fromEntries(["receipt", "attempt", "completion", "edge", "log"].map(name => [name, c.ref(`original-${name}.${name === "log" ? "log" : "json"}`)])),
    diagnosis: { base: c.base, head: c.base, tree: c.baseTree, review: null, report: c.ref("synthetic-report.md"), bundle: null },
    final_source: c.ref("final-source.json"), authorization: null };
  c.file = path.join(c.folder, "proof.json");
  return c;
}

function diagnosis(c) {
  const environment = { NODE_ENV: "test", LANG: "C", LC_ALL: "C", TZ: "UTC" };
  const diff = "// Synthetic observation-only diff; never production evidence.\n";
  const source = { head: c.base, tree: c.baseTree, root: c.checkout, diff_bytes: Buffer.byteLength(diff), diff_sha256: digest(diff) };
  const result = { exit_code: 0, signal: null, timed_out: false, cancelled: false, spawn_error_code: null, exit_observed: true,
    streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0, termination_reason: "natural_exit", duration_ms: 20 };
  const run = { schema: "augnes.private.r6-focused-run.v1", result, timeout_ms: 30000, focused_pass: true, acceptance_failure: null, errors: [],
    resource_root_exists_after: false, cleanup: [{ completed: true, failure_count: 0, failures: [] }], started_at_utc: time(-100000), finished_at_utc: time(-90000),
    source_unchanged: true, source_before_fingerprint: digest(source), source_after_fingerprint: digest(source), cwd: c.checkout,
    environment_fingerprint: digest(environment), environment_keys: Object.keys(environment).sort(),
    tool_versions: { node: "24.22.1", npm: "11.16.0", platform: "darwin", architecture: "arm64", node_sha256: digest(readFileSync(process.execPath)) },
    args: ["--import", "tsx", fixturePath, "--settled-expired-successor-only", "--r6-trace=/synthetic/trace.jsonl"] };
  const reused = { path: fixturePath, byte_size: c.fixtureBytes.length, sha256: digest(c.fixtureBytes) };
  const restoration = { no_final_source_change: true, repositories_equal_intake: true, r5_receipt_unchanged: true, outer_owned_root_absent: true,
    recorded_settlement: result, restored_fixture_bytes: reused.byte_size, restored_fixture_sha256: reused.sha256,
    source: [{ path: fixturePath, unchanged: true, bytes: reused.byte_size, after_bytes: reused.byte_size, sha256: reused.sha256, after_sha256: reused.sha256 }] };
  const trace = [
    { operation: "scenario", stage: "begin" }, { operation: "expected synchronous refusal", stage: "begin", id: 1 },
    { operation: "expected synchronous refusal", stage: "threw", id: 1 }, { operation: "semantic_assertions", stage: "complete" },
    { operation: "scenario_cleanup", stage: "begin" }, { operation: "scenario_cleanup", stage: "complete" },
    { operation: "fixture_root_remove", stage: "begin" }, { operation: "fixture_root_remove", stage: "complete" },
  ].map((x, elapsed_ms) => ({ role: "settled-expired-successor", pid: 123, elapsed_ms, ...x }));
  const files = { "cleanup-and-restoration.json": restoration, "source-review.json": { disposition: "NO_FIX", source_head: c.base },
    "scenario-diagnostic.jsonl": trace.map(x => JSON.stringify(x)).join("\n") + "\n", "runs/synthetic/result.json": run,
    "runs/synthetic/source.json": source, "runs/synthetic/source-after.json": source, "runs/synthetic/environment.json": environment, "runs/synthetic/source.diff": diff };
  return { schema: "augnes.private-r6-evidence-bundle.v1", report_id: "AUGNES-1561-COMPANION-RESULT-SUCCESSOR-20261031", revision: 6,
    source_head: c.base, reused_source: reused, files: Object.entries(files).map(([path, value]) => {
      const text = typeof value === "string" ? value : JSON.stringify(value); return { path, byte_size: Buffer.byteLength(text), sha256: digest(text), text };
    }) };
}
function mutateBundle(bundle, name, change, lines = false) {
  const copy = clone(bundle), file = copy.files.find(x => x.path === name); assert(file);
  const value = lines ? file.text.trim().split("\n").map(line => JSON.parse(line)) : JSON.parse(file.text); change(value);
  file.text = lines ? value.map(x => JSON.stringify(x)).join("\n") + "\n" : JSON.stringify(value);
  file.byte_size = Buffer.byteLength(file.text); file.sha256 = digest(file.text); return copy;
}
function authority(c) {
  const p = c.proof, user = { login: "synthetic-publisher", id: 123, type: "User" }, reviewId = 555, grantId = 556;
  const review = { id: reviewId, user, author_association: "OWNER", state: "COMMENTED", commit_id: p.diagnosis.head,
    pull_request_url: `https://api.github.com/repos/hynk-studio/augnes/pulls/${p.pull_request}`, submitted_at: time(-50000),
    body: [p.diagnosis.head, p.diagnosis.tree, p.diagnosis.base, "ACCEPT / RETAIN", "NO FIX", "ChatGPT", "publisher", "not an execution grant"].join("\n") };
  p.diagnosis.review = { id: reviewId, sha256: digest(timeoutAuthorityObservation(review, "accepted_repair")) };
  const grant = { id: grantId, user, author_association: "OWNER", issue_url: `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}`, created_at: time(-40000), updated_at: time(-40000),
    body: [p.diagnosis.head, p.diagnosis.tree, p.diagnosis.base, p.branch, p.prior_attempt_id, p.prior_family_id, p.prior_receipt_fingerprint,
      p.originals.receipt.sha256, p.diagnosis.report.sha256, p.diagnosis.bundle.sha256,
      `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${reviewId}`,
      "only the outer `settled-expired-successor` budget to45,000ms", "from30,000 to45,000ms", "Retry/recovery budget:0.",
      "at most one admitted, unchanged planner-complete Full", "do not remove `operating_profile_consumed` restrictions generally",
      "No separate allowance ledger", "post-completion independent judgment", "ChatGPT independently audits the new policy/source and returned evidence after completion", "UNKNOWN", "#1561"].join("\n") };
  p.authorization = { grant_comment_id: grantId, grant_sha256: digest(timeoutAuthorityObservation(grant, "execution_grant")) };
  return { review, grant, permissions: Object.fromEntries(["accepted_repair", "execution_grant"].map(role => [role, { user: { login: user.login }, permission: "admin" }])),
    pr: { number: p.pull_request, state: "open", draft: true, merged: false, auto_merge: null,
      head: { sha: p.head, ref: p.branch, repo: { full_name: "hynk-studio/augnes" } }, base: { sha: p.base, ref: "main", repo: { full_name: "hynk-studio/augnes" } } } };
}
const checkSource = (c, p = c.proof, source = c.finalSource) => validateSuccessorBudgetSource({ proof: p, original: c.receipt, finalSource: source, repositoryRoot: c.checkout });
const checkAuthority = (c, a = c.authority, p = c.proof) => validateSuccessorBudgetAuthorityRecords(p, a.review, a.grant, a.permissions, a.pr);
const begin = (c, p, authorization) => beginAttempt({ repositoryRoot: c.checkout, anchorRoot: c.anchor, checkoutOwner: c.owner,
  branch: p.branch, head: p.head, tree: p.tree, acceptedMain: p.base, runId: "synthetic-budget-unissued", contractFingerprint: "7".repeat(64), sourceCorrection: p, budgetAuthorization: authorization });

// Published observation metadata is used solely for offline structural checks.
const budgetObservations = {
  accepted_repair: { id: 5724573102, author: "hynk-studio", author_id: 89450056,
    body_sha256: "30f4fb49498824d971291642d2b51a80f4bf930c37bca083dfb0dd6257040a7b", timestamp: "2026-10-31T19:33:56Z",
    role: "accepted_repair", commit_id: "7d964f440b201651cb7c35ccf0e67f712bb9e479" },
  execution_grant: { id: 6548163748, author: "hynk-studio", author_id: 89450056,
    body_sha256: "ef281c16490b8bda81d32b6ebb712caf2478552334d28c754eadcd85bce1ac9a", timestamp: "2026-10-31T19:34:49Z",
    role: "execution_grant", commit_id: null },
};
function structuralRecords(c) {
  const a = BUDGET_ACCEPTED, old = { ...c, branch: a.branch, base: a.head, baseTree: a.tree };
  Object.assign(old, predecessor(old, "2026-10-31T03-13-35-402Z-changed-52bf20699f0e-93d2eb850851ae28"));
  assert.equal(old.prior.family_id, a.family); old.prior.attempt_id = a.run;
  write(path.join(old.family, "attempt-1.json"), old.prior);
  write(path.join(old.family, "completion-1.json"), { ...c.completion, attempt_id: a.run, receipt_fingerprint: a.receipt_fingerprint });
  const p = clone(c.proof); Object.assign(p, { branch: a.branch, pull_request: a.pull_request, prior_family_id: a.family,
    prior_attempt_id: a.run, prior_receipt_fingerprint: a.receipt_fingerprint, local_relative_path: path.relative(c.checkout, c.file) });
  for (const kind of ["receipt", "attempt", "completion", "edge", "log"]) p.originals[kind].sha256 = a[kind === "log" ? "retained_log_sha256" : `${kind}_sha256`];
  Object.assign(p.diagnosis, { base: a.base, head: a.head, tree: a.tree, review: { id: a.review_id, sha256: a.review_sha256 } });
  p.diagnosis.report.sha256 = a.report_sha256; p.diagnosis.bundle.sha256 = a.bundle_sha256;
  p.authorization = { grant_comment_id: a.grant_id, grant_sha256: a.grant_sha256 };
  const familyId = digest([ATTEMPT_CONTRACT, "hynk-studio/augnes", p.branch, "verified_source_correction", p.prior_attempt_id, p.head, p.tree]);
  const attempt = { ...clone(c.prior), family_id: familyId, attempt_id: "synthetic-budget-structural-only", branch: p.branch,
    head: p.head, tree: p.tree, source_correction: p, budget_authority: clone(budgetObservations) };
  delete attempt.profile_authority; assert(validSuccessorBudgetAttempt(attempt));
  return { p, attempt, priorRoot: old.family, nextRoot: path.join(c.anchor, ".augnes-local-verification/families", familyId),
    edge: { contract: "augnes.local-canonical-successor.v2", kind: "settled_successor_budget", family_id: familyId, head: p.head, tree: p.tree, proof_fingerprint: digest(p) } };
}

if (process.argv[2] === "--stock-budget-records") {
  const packet = read(process.argv[3]), before = treeFiles(packet.anchor), receipt = read(packet.receipt);
  assert(reconstructAttemptTip({ anchorRoot: packet.anchor, branch: receipt.repository.branch }).successor_budget_consumed);
  assert(validSuccessorBudgetAttempt(receipt.attempt));
  assert(!inspectAttemptRecords({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, receipt }), "synthetic records cannot satisfy pinned production stock");
  assert.deepEqual(treeFiles(packet.anchor), before);
  console.log("cold structural reconstruction only; production stock refuses synthetic evidence without writes");
} else if (process.argv[2] === "--run-budget-fixtures") await budgetControls(process.argv[3]);

export async function budgetControls(group = "evidence") {
  assert(["evidence", "records"].includes(group));
  const owner = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(owner);
  let c, active = false; const checks = [];
  const pass = control => { checks.push(control); console.log(JSON.stringify({ control, status: "PASS", synthetic_only: true })); };
  const refused = (control, action, code) => { let observed; assert.throws(() => { try { action(); } catch (error) { observed = error; throw error; } }, code ? { code } : undefined, control);
    console.log(JSON.stringify({ control, observed_refusal: observed.code ?? observed.name, synthetic_only: true })); pass(control); };
  try {
    c = make(owner.root, value => { c = value; }); c.bundle = diagnosis(c); write(path.join(c.folder, "synthetic-bundle.json"), c.bundle);
    c.proof.diagnosis.bundle = c.ref("synthetic-bundle.json"); c.authority = authority(c); write(c.file, c.proof);
    if (group === "evidence") {
      const originalBytes = treeFiles(c.anchor), log = readFileSync(path.join(c.folder, "original-log.log"));
      const predecessorCheck = (receipt = c.receipt, bytes = log) => validateSuccessorBudgetPredecessor(receipt, c.prior,
        { ...c.completion, receipt_fingerprint: receipt.integrity.content_fingerprint },
        { ...c.proof, prior_receipt_fingerprint: receipt.integrity.content_fingerprint }, bytes);
      predecessorCheck(); assert.equal(validateSuccessorBudgetDiagnosis(c.bundle).call_count, 1); assert.equal(checkSource(c), true); checkAuthority(c);
      pass("pure synthetic predecessor, paired synchronous refusal, NOFIX diagnosis, exact budget source and authority records accept without capability");
      for (const [name, change] of [["unknown predecessor cleanup", r => r.cleanup.completed = false], ["additional failed phase", r => r.phases[0].status = "failure"],
        ["truncated original log", r => r.phases[7].log.truncated = true]]) {
        const value = clone(c.receipt); change(value); refused(name, () => predecessorCheck(finalizeReceipt(value)));
      }
      for (const [name, changed, code] of [["timeout latch cannot be erased", log.toString().replace("timed_out=true", "timed_out=false"), "budget_nested_unrelated_failure"],
        ["eventual exit zero cannot become the exact retained SIGTERM failure", log.toString().replace("exit_code=null signal=SIGTERM timed_out=true", "exit_code=0 signal=null timed_out=true"), "budget_nested_unrelated_failure"],
        ["changed aggregate predecessor deadline", log.toString().replace(`label=${JSON.stringify(label)} timeout_ms=30000`, `label=${JSON.stringify(label)} timeout_ms=45000`), "budget_timeout_latch_invalid"],
        ["incomplete child inventory", log.toString().replace('"settled_count":2', '"settled_count":1'), "budget_nested_inventory_invalid"]]) {
        const receipt = clone(c.receipt); receipt.phases[7].log.bytes = Buffer.byteLength(changed);
        refused(name, () => predecessorCheck(finalizeReceipt(receipt), Buffer.from(changed)), code);
      }
      for (const [name, file, change, lines] of [
        ["diagnosis cannot relabel a timed-out run", "runs/synthetic/result.json", x => x.result.timed_out = true],
        ["diagnosis retains the original30s observation bound", "runs/synthetic/result.json", x => x.timeout_ms = 45000],
        ["unknown restoration refuses", "cleanup-and-restoration.json", x => x.outer_owned_root_absent = false],
        ["unpaired synchronous throw refuses", "scenario-diagnostic.jsonl", x => x.splice(1, 1), true],
      ]) refused(name, () => validateSuccessorBudgetDiagnosis(mutateBundle(c.bundle, file, change, lines)));
      const bytesChanged = clone(c.bundle); bytesChanged.files[0].text += " "; refused("diagnostic file byte binding cannot be reinterpreted", () => validateSuccessorBudgetDiagnosis(bytesChanged));
      const badDelta = clone(c.finalSource); badDelta.deltas.main_to_final.sha256 = "0".repeat(64); refused("whole final delta mismatch", () => checkSource(c, c.proof, badDelta));
      for (const [name, file, mutate] of [
        ["another target outer budget refuses", suitePath, text => text.replace(/(id: "settled-expired-successor",[\s\S]*?timeoutMs:) 45_000/u, "$1 46_000")],
        ["changed neighboring inventory refuses", suitePath, text => text.replace('id: "authored-successor-handoff",', 'id: "replaced-authored-successor-handoff",')],
        ["changed inner fixture bound refuses", fixturePath, text => text.replace("timeout_ms: 10_000, stop_settle_timeout_ms: 3_000", "timeout_ms: 11_000, stop_settle_timeout_ms: 3_000")],
        ["changed registration assertion refuses", "scripts/test-local-canonical-verification-contract.mjs", text => text.replace('requireText(expiredSuccessorRegistration.block, fragment,', 'requireText(expiredRefusalRegistration.block, fragment,')],
        ["removed fixture assertion refuses", fixturePath, text => text.replace('assert.equal(renewed.status, "inserted");', "void renewed.status;")],
      ]) {
        const source = readFileSync(path.join(c.checkout, file), "utf8"), changed = mutate(source); assert.notEqual(changed, source);
        write(path.join(c.checkout, file), changed); const head = c.commit(), tree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
        const p = { ...c.proof, head, tree }, finalSource = { ...c.finalSource, deltas: { accepted_to_final: c.delta(c.base, head), main_to_final: c.delta(c.base, head) } };
        refused(name, () => checkSource(c, p, finalSource)); write(path.join(c.checkout, file), source); c.commit();
      }
      for (const [name, mutate] of [["changed accepted review", a => a.review.body += " changed"], ["changed execution grant", a => a.grant.body += " changed"],
        ["wrong reviewed source", a => a.review.commit_id = c.head], ["stale published head", a => a.pr.head.sha = c.base],
        ["wrong current main", a => a.pr.base.sha = c.head], ["Ready PR", a => a.pr.draft = false], ["unprivileged grant", a => a.permissions.execution_grant.permission = "read"]]) {
        const a = clone(c.authority); mutate(a); refused(name, () => checkAuthority(c, a));
      }
      const a = clone(c.authority), p = clone(c.proof); a.grant.body = "Generic approval"; p.authorization.grant_sha256 = digest(timeoutAuthorityObservation(a.grant, "execution_grant"));
      refused("re-signed generic grant has no prospective scope", () => checkAuthority(c, a, p), "budget_authority_scope_invalid");
      refused("synthetic evidence cannot satisfy fixed production pins", () => readSourceCorrectionProof(c.file, c.checkout), "budget_proof_invalid");
      let transportCalls = 0;
      const transport = createGitHubObserverAuthorizationTransport(999, { runner: async () => { transportCalls++; throw new Error("synthetic_authority_not_issued"); } });
      await assert.rejects(authorizeSuccessorBudgetSuccession(c.proof, { transport }), { code: "budget_authority_missing" }); assert.equal(transportCalls, 0);
      pass("synthetic records cannot obtain a pinned production capability");
      refused("forged authority cannot create a successor edge", () => begin(c, { ...c.proof, local_relative_path: path.relative(c.checkout, c.file) }, { observations: checkAuthority(c) }));
      assert.deepEqual(treeFiles(c.anchor), originalBytes); pass("all read and refusal controls preserve the ledger without reservation");
    } else {
      const { p, attempt, edge, priorRoot, nextRoot } = structuralRecords(c), predecessorBytes = treeFiles(c.anchor);
      assert(reconstructAttemptTip({ anchorRoot: c.anchor, branch: p.branch }).operating_profile_consumed);
      refused("pinned structural observations do not create an opaque authority capability",
        () => assertSuccessorBudgetAuthorization(p, { observations: clone(budgetObservations) }, c.completion), "budget_authenticated_authority_required");
      assert.deepEqual(treeFiles(c.anchor), predecessorBytes);
      write(path.join(priorRoot, "correction-successor.json"), edge); write(path.join(nextRoot, "attempt-1.json"), attempt);
      assert(reconstructAttemptTip({ anchorRoot: c.anchor, branch: p.branch }).successor_budget_consumed);
      pass("manually built typed budget records reconstruct only after an operating-profile predecessor");
      const receipt = finalizeReceipt({ ...clone(c.receipt), repository: { ...c.receipt.repository, branch: p.branch, head_sha: p.head, tree_sha: p.tree },
        run: { ...c.receipt.run, id: attempt.attempt_id }, attempt });
      const inspected = inspectReceiptForDecision(receipt, { currentAttemptRecordsValid: true });
      assert(!inspected.issues.includes("receipt_successor_budget_invalid")); assert(!inspected.valid_deciding_evidence);
      assert(inspectPrivateReviewExport(createPrivateReviewExport(receipt)).structurally_valid); pass("structural private export preserves failed non-deciding interpretation");
      for (const [name, mutate] of [["second attempt", a => a.number = 2], ["recovery allowance", a => a.budget.recovery = 1], ["recovery payload", a => a.recovery = {}],
        ["wrong predecessor", a => a.source_correction.prior_family_id = "0".repeat(64)], ["changed grant role", a => a.budget_authority.execution_grant.role = "implementation_owner"]]) {
        const changed = clone(attempt); mutate(changed); assert(!validSuccessorBudgetAttempt(changed), name);
        const altered = finalizeReceipt({ ...clone(receipt), attempt: changed }); assert(inspectReceiptForDecision(altered, { currentAttemptRecordsValid: true }).issues.includes("receipt_successor_budget_invalid")); pass(name + " structurally refuses");
      }
      for (const [name, markers] of [["authority-only", { budget_authority: {} }], ["consumed-only", { successor_budget_consumed: true }],
        ["schema with wrong kind", { source_correction: { schema: BUDGET_SCHEMA, kind: "wrong" } }], ["kind-only", { source_correction: { kind: "settled_successor_budget" } }]]) {
        const changed = clone(receipt); changed.attempt = { ...clone(attempt), source_correction: null }; delete changed.attempt.budget_authority; Object.assign(changed.attempt, markers);
        const rebound = finalizeReceipt(changed);
        refused(name + " cannot be laundered by private export", () => createPrivateReviewExport(rebound), "review_export_successor_budget_invalid");
      }
      const bytes = readFileSync(path.join(nextRoot, "attempt-1.json")); rmSync(path.join(nextRoot, "attempt-1.json"));
      refused("interrupted typed reservation remains consumed", () => reconstructAttemptTip({ anchorRoot: c.anchor, branch: p.branch })); write(path.join(nextRoot, "attempt-1.json"), bytes);
      refused("repeated typed attempt cannot reopen terminal lineage", () => begin(c, p, { observations: budgetObservations }));
      write(path.join(nextRoot, "correction-successor.json"), edge);
      refused("conflicting further successor refuses", () => reconstructAttemptTip({ anchorRoot: c.anchor, branch: p.branch }), "attempt_successor_budget_terminal"); rmSync(path.join(nextRoot, "correction-successor.json"));
      for (const original of predecessorBytes) assert.equal(digest(readFileSync(path.join(c.anchor, original.file))), original.sha256);
      const receiptFile = path.join(c.folder, "structural-receipt.json"), packetFile = path.join(c.folder, "structural-reader.json"); write(receiptFile, receipt);
      write(packetFile, { anchor: c.anchor, checkout: c.checkout, receipt: receiptFile }); const ledger = treeFiles(c.anchor); active = true; let output = "";
      const result = await runCanonicalChild({ suite: "successor-budget-record-fixture", label: "cold synthetic budget reader", command: process.execPath,
        args: [self, "--stock-budget-records", packetFile], cwd: owner.root, env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), timeoutMs: 4000,
        stdout: { write: chunk => output += chunk }, stderr: { write: chunk => output += chunk }, log() {} });
      active = !(result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0);
      console.log("AUGNES_REVIEW_CHILD_RESULT " + JSON.stringify(projectReviewChildResult(result, { controlId: "budget-cold-structural-reader" })));
      assertReviewChildLifecycle(result, { controlId: "budget-cold-structural-reader" }); assert.equal(result.exit_code, 0, output); assert.deepEqual(treeFiles(c.anchor), ledger);
      pass("fresh structural read is immutable and production stock refuses synthetic evidence");
    }
  } finally {
    if (c?.owner) releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: !active });
    if (!active) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    assert(cleanupCanonicalTestResources([owner])[0].completed);
  }
  console.log(JSON.stringify({ successor_budget_succession: checks, group, count: checks.length, synthetic_only: true, production_admission: "NOT_RUN", cleanup_complete: true }));
}
