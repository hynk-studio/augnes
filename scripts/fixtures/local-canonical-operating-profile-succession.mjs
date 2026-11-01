// Synthetic production-owner controls. No real qualification, GitHub, Browser or
// model calls; every repository, authority response and ledger is disposable.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { digest } from "../local-canonical-inputs.mjs";
import { OPERATING_PROFILE_SCHEMA, PROFILE_ACCEPTED, PROFILE_SUITE_ADDITION, authorizeOperatingProfileSuccession, validOperatingProfileAttempt,
  validateOperatingProfilePredecessor, validateOperatingProfileComparison, validateOperatingProfileSource,
  validateOperatingProfileAuthorityRecords } from "../local-canonical-operating-profile-succession.mjs";
import { timeoutAuthorityObservation } from "../local-canonical-timeout-succession.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "../local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "../github-main-branch-transport.mjs";
import { ATTEMPT_CONTRACT, beginAttempt, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof } from "../local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "../local-canonical-checkout-ownership.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "../canonical-test-environment.mjs";
import { runCanonicalChild } from "../canonical-child-runner.mjs";
import { finalizeReceipt, inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "../local-canonical-review-export.mjs";
import { baseReceipt } from "./local-canonical-receipt-v3.mjs";
import { assertReviewChildLifecycle, projectReviewChildResult } from "./local-canonical-review-child-result.mjs";

const self = fileURLToPath(import.meta.url), repository = path.resolve(path.dirname(self), "../..");
const write = (file, value) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value), { mode: 0o600 }); };
const read = file => JSON.parse(readFileSync(file, "utf8"));
const time = offset => new Date(Date.now() + offset).toISOString();
const proof = c => readSourceCorrectionProof(c.file, c.checkout);
const save = c => write(c.file, c.proof);
const treeFiles = (directory, root = directory) => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? treeFiles(file, root) : [{ file: path.relative(root, file), sha256: digest(readFileSync(file)) }];
}).sort((a, b) => a.file.localeCompare(b.file));
const transport = (records, change = value => value) => createGitHubObserverAuthorizationTransport(999, { runner: async request => {
  assert.equal(request.operation, "fetch_browser_authority"); assert(request.args.includes("GET"));
  const url = request.args[1]; assert(url.startsWith("repos/hynk-studio/augnes/"));
  return change(structuredClone(url.includes("/reviews/") ? records.review : url.includes("/comments/") ? records.grant :
    url.endsWith("/pulls/999") ? records.pr : { permission: "admin", user: { login: "synthetic-publisher" } }), url);
} });
const authorize = (c, p, change) => authorizeOperatingProfileSuccession(p, { transport: transport(c.authority, change) });
const begin = (c, p, authorization, extra = {}) => beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner,
  branch: p.branch, head: p.head, tree: p.tree, acceptedMain: p.base, runId: "synthetic-profile-successor", contractFingerprint: "6".repeat(64),
  sourceCorrection: p, profileAuthorization: authorization, ...extra });

const harness = "scripts/execution-choice-transition-harness.ts";
const workload = ["scripts/test-operating-profile-contribution.ts", "scripts/operating-profile-contribution-fixture.ts",
  "scripts/operating-profile-contribution-followup.ts", "scripts/operating-profile-contribution-boundaries.ts"];
const sourcePaths = [harness, ...workload];
const label = "profile step, manual return, checked recommendation and fresh persisted follow-up";
const resultLine = (suite, name, duration, timedOut = false, exit = 0) => `[canonical:${suite}] child_result label=${JSON.stringify(name)} duration_ms=${duration} exit_code=${exit} signal=null timed_out=${timedOut} exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=${timedOut ? "bounded_timeout" : "natural_exit"}\n`;
const cleanupLine = (suite, name, duration, timedOut = false) => `[canonical:${suite}] child_cleanup_result label=${JSON.stringify(name)} elapsed_ms=${duration} reason=${timedOut ? "bounded_timeout" : "post_exit_settlement term_sent=false kill_sent=false"} streams_closed=true remaining_owned_processes=0\n`;
function originalLog() {
  let log = `[canonical:integration] child_start label=${JSON.stringify(label)} timeout_ms=150000\n`;
  for (const [role, duration] of [["producer", 30000], ["consumer", 5000], ["boundary", 60068]]) {
    log += `[canonical:operating-profile-contribution] child_start label=${JSON.stringify(role)} timeout_ms=60000\n`;
    if (role === "boundary") log += '[canonical:operating-profile-contribution] child_cleanup_start label="boundary" elapsed_ms=60001 reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false\n';
    log += cleanupLine("operating-profile-contribution", role, duration, role === "boundary") + resultLine("operating-profile-contribution", role, duration, role === "boundary");
  }
  log += JSON.stringify({ cleanup: [{ root: "synthetic-owned-root", completed: true, failure_count: 0, failures: [] }] }) + "\n";
  log += "AssertionError [ERR_ASSERTION]: canonical_child_timeout\n";
  log += cleanupLine("integration", label, 96000) + resultLine("integration", label, 96000, false, 1);
  log += '[canonical:integration] group_inventory ' + JSON.stringify({ selected_count: 2, started_count: 1, settled_count: 1, completed_count: 1, failed_count: 1, unstarted_count: 1,
    children: [{ label, started: true, settled: true, completed: true, outcome: "failed" }, { label: "synthetic later selected workload", started: false }] }) + "\n";
  return log + JSON.stringify({ suite: "integration", resource_cleanup: [{ root: "synthetic-phase-root", completed: true, failure_count: 0, failures: [] }] }) + "\n";
}
function priorReceipt(c, base, tree) {
  const resources = ["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable"].map(id => ({ id, classification: "safety", before: { present: false }, location_fingerprint: digest(id) }));
  const declaration = { contract: "augnes.local-canonical-inputs.v3", path_kind: "isolated-model-free-v1", binding: { head: base, tree,
    executor_fingerprint: "a".repeat(64), phase_environment_fingerprints: BROWSER_REPLACEMENT_PHASES.map(id => ({ id, fingerprint: "b".repeat(64) })) }, resources };
  // Explicit synthetic history, not a production-admitted execution.
  const prior = { contract: ATTEMPT_CONTRACT, family_id: digest([ATTEMPT_CONTRACT, "hynk-studio/augnes", c.branch]),
    attempt_id: "synthetic-profile-predecessor", number: 1, branch: c.branch, head: base, tree, contract_fingerprint: digest(declaration),
    started_at: time(-200000), prior_attempt_id: null, prior_receipt_fingerprint: null, recovery: null, source_correction: null, budget: { initial: 1, recovery: 1 } };
  const log = originalLog(), logRelative = ".augnes-local-verification/logs/synthetic-profile-predecessor/integration.log";
  write(path.join(c.checkout, logRelative), log);
  const receipt = finalizeReceipt({ ...structuredClone(baseReceipt), receipt_version: 4,
    repository: { ...baseReceipt.repository, branch: c.branch, head_sha: base, tree_sha: tree, base_sha: base },
    evidence: { ...baseReceipt.evidence, mode: "full", selected_plan: "full-canonical" }, verification_context: { kind: "isolated-worktree" },
    executor: { ...baseReceipt.executor, source_fingerprint: "a".repeat(64) }, run: { ...baseReceipt.run, id: prior.attempt_id }, attempt: prior,
    inputs: { ...declaration, fingerprint: digest(declaration), checks: 2, first_fault: null, secondary_faults: [], events: [] },
    outcome: { disposition: "product_failure", safety: "preserved_within_observed_scope", validity: "valid_within_observed_scope", first_fault: null },
    checkout_ownership: { released: true }, capacity_ownership: { released: true },
    cleanup: { completed: true, remaining_owned_processes: 0, companion_service: { restored: true }, isolated_resources: { completed: true, failure_count: 0, failures: [] } },
    phases: BROWSER_REPLACEMENT_PHASES.map((id, i) => ({ id, status: i < 7 ? "pass" : i === 7 ? "failure" : "not_run", exit_status: i < 7 ? 0 : i === 7 ? 1 : null,
      failure_code: i === 7 ? "phase_failed" : null, timed_out: false, spawn_error_code: null, environment_fingerprint: "b".repeat(64),
      ...(i === 7 ? { log: { relative_path: logRelative, bytes: Buffer.byteLength(log), truncated: false } } : {}),
      cleanup: { completed: true, remaining_owned_processes: 0, exit_observed: i <= 7, streams_closed: i <= 7, termination_reason: i <= 7 ? "natural_exit" : null } })),
    final: { result: "failure", exit_status: 1, reason_codes: ["phase_failed", "selected_phases_incomplete"] } });
  const family = path.join(c.anchor, ".augnes-local-verification/families", prior.family_id), completionFile = path.join(family, "completion-1.json");
  write(path.join(family, "attempt-1.json"), prior);
  const completion = { contract: ATTEMPT_CONTRACT, attempt_id: prior.attempt_id, receipt_fingerprint: receipt.integrity.content_fingerprint,
    disposition: "product_failure", cleanup_complete: true, infrastructure_code: null, finished_at: time(-60000) }; write(completionFile, completion);
  for (const [kind, value] of Object.entries({ receipt, attempt: prior, completion, log })) write(path.join(c.folder, `original-${kind}.${kind === "log" ? "log" : "json"}`), value);
  return { receipt, prior, family };
}

function baselineHarness(current) {
  const after = 'async function readSnapshot() {\n    const r = await call("augnes_resume_repository", { repositoryRoot: root });\n    return r.continuity.snapshot.binding;\n}\nasync function readCurrent() {\n    const snapshot = await readSnapshot();\n    return { snapshot, ...(await call("augnes_read_repository_work_sources", { repositoryRoot: root, expectedSnapshotBinding: snapshot })) };\n}';
  const before = 'async function readCurrent() {\n    const r = await call("augnes_resume_repository", { repositoryRoot: root });\n    return { snapshot: r.continuity.snapshot.binding, ...(await call("augnes_read_repository_work_sources", { repositoryRoot: root, expectedSnapshotBinding: r.continuity.snapshot.binding })) };\n}';
  assert(current.includes(after), "fixture expects the exact accepted helper refactor");
  return current.replace(after, before)
    .replace('    // The tool reads and fences its own sources; preparation only needs a fresh binding.\n', '')
    .replace('    const snapshot = await readSnapshot();\n    const args = { action, repositoryRoot: root, expectedSnapshotBinding: snapshot, ...values };', '    const c = await readCurrent();\n    const args = { action, repositoryRoot: root, expectedSnapshotBinding: c.snapshot, ...values };')
    .replace('    const snapshot = await readSnapshot();\n    return call("augnes_lookup_repository_retained_sources", {repositoryRoot: root, expectedSnapshotBinding: snapshot, query});', '    const c = await readCurrent();\n    return call("augnes_lookup_repository_retained_sources", {repositoryRoot: root, expectedSnapshotBinding: c.snapshot, query});');
}

function copy(value) {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Map) return new Map([...value].map(([k, v]) => [k, copy(v)]));
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, copy(v)]));
  return value;
}
function authority(p) {
  const user = { login: "synthetic-publisher", id: 7, type: "User" };
  const review = { id: 101, user, author_association: "OWNER", state: "COMMENTED", commit_id: p.improvement.head, submitted_at: time(-20000),
    pull_request_url: "https://api.github.com/repos/hynk-studio/augnes/pulls/999", body: `SYNTHETIC ChatGPT receiving audit: SOURCE / CONTRACT / DEVELOPMENT EVIDENCE ACCEPTED.
${p.improvement.head} ${p.improvement.tree} ${p.improvement.base} ${harness}
ACCEPT / RETAIN: both passed; 37 unused prefetches in the illustrative scope wording; equivalent assertions and unchanged deadlines.
Historical timeout cause UNKNOWN; this synthetic ChatGPT audit attribution is distinct from the publisher.` };
  p.improvement.review = { id: review.id, sha256: digest(timeoutAuthorityObservation(review, "accepted_repair")) };
  const grant = { id: 203, user, author_association: "OWNER", updated_at: time(-10000), issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/999",
    body: `SYNTHETIC explicit user authorization: minimal prospective operating-profile succession owner and ONE admitted Full; ZERO recovery/retry.
https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-101
${p.branch} ${p.improvement.head} ${p.improvement.tree} ${p.improvement.base} ${p.prior_family_id} ${p.prior_attempt_id} ${p.prior_receipt_fingerprint} ${p.originals.receipt.sha256}
For #1561, authorize the smallest necessary explicit prospective successor-policy/admission path and one admitted Full; zero automatic or explicit recovery/retry.
Do not relabel them as a prior-FAIL/corrected-PASS witness. Require independent post-completion audit.
Accept the both-PASS efficiency improvement and unchanged assertions/deadlines; preserve the historical timeout cause UNKNOWN.
Bind final base/head/tree and complete native deltas; final-source checks are implementation_owner_not_independent_review.
The interrupted reservation remains consumed across HEAD, branch, worktree, proof, grant copy and successor kind. No second Full or recovery.
Separate fresh-process stock follows the actual receipt, including a usable failed receipt. Independent audit follows completion.` };
  p.authorization = { grant_comment_id: grant.id, grant_sha256: digest(timeoutAuthorityObservation(grant, "execution_grant")) };
  return { review, grant, pr: { number: 999, state: "open", draft: true, merged: false, auto_merge: null,
    head: { sha: p.head, ref: p.branch, repo: { full_name: "hynk-studio/augnes" } }, base: { sha: p.base, ref: "main", repo: { full_name: "hynk-studio/augnes" } } } };
}
function captureRun(c, kind, files, baseline) {
  for (const [name, bytes] of files) write(path.join(c.checkout, name), bytes);
  const diff = c.git("diff", "--binary", "--no-ext-diff", "--no-textconv", c.base, "--");
  const environment = buildCanonicalChildEnvironment({ temporaryRoot: path.join(c.folder, "synthetic-env"), ambientEnvironment: { PATH: process.env.PATH, LANG: "C", LC_ALL: "C", TZ: "UTC", NO_COLOR: "1" } });
  const helpers = ["scripts/canonical-child-runner.mjs", "scripts/canonical-test-environment.mjs", "scripts/test-harness-process-lifecycle.mjs", "scripts/test-harness-zero-network-guard.mjs"].map(name => {
    const bytes = readFileSync(path.join(repository, name)); return { path: path.join(repository, name), bytes: bytes.length, sha256: digest(bytes) };
  });
  const source = { root: c.checkout, origin: "https://github.com/hynk-studio/augnes.git", branch: c.branch, head: c.base, tree: c.baseTree,
    status: [...files].filter(([name, bytes]) => !bytes.equals(c.git("show", `${c.base}:${name}`))).map(([name]) => ` M ${name}\n`).sort().join(""),
    origin_main_local_ref: c.base, diff_bytes: diff.length, diff_sha256: digest(diff), files: [...files].map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: digest(bytes) })).sort((a, b) => a.path.localeCompare(b.path)), helpers,
    wrapper: { path: self, bytes: readFileSync(self).length, sha256: digest(readFileSync(self)) } };
  const typecheck = kind === "typecheck", transition = kind.startsWith("transition_");
  const args = typecheck ? ["run", "typecheck"] : ["--import", "tsx", transition ? "scripts/test-execution-choice-transition.ts" : "scripts/test-operating-profile-contribution.ts", path.join(c.folder, kind, "artifacts"), ...(kind === "transition_existing" ? ["existing"] : [])];
  const order = ["baseline", "candidate", "final", "transition_normal", "transition_existing", "typecheck"].indexOf(kind);
  const result = { synthetic: true, command: typecheck ? "npm" : process.execPath, args, cwd: c.checkout, timeout_ms: 150000,
    tool_versions: { node: "24.22.1", node_path: process.execPath, node_sha256: c.nodeHash, npm_path: "npm", npm: "11.16.0", platform: "darwin", architecture: "arm64" },
    environment_fingerprint: digest(environment), environment_keys: Object.keys(environment).sort(), source_unchanged: true, source_before_fingerprint: digest(source), source_after_fingerprint: digest(source),
    started_at_utc: time(-40000 + order * 2000), finished_at_utc: time(-39000 + order * 2000),
    result: { label: kind, exit_code: 0, signal: null, timed_out: false, cancelled: false, duration_ms: 1000, spawn_error_code: null,
      exit_observed: true, streams_closed: true, cleanup_started: true, cleanup_completed: true, remaining_owned_processes: 0, termination_reason: "natural_exit" },
    focused_pass: true, acceptance_failure: null, resource_root_exists_after: false, cleanup: [{ completed: true }], errors: [] };
  const artifacts = new Map(Object.entries({ "downstream-result.json": '{"execution_authorized":false}', "fresh-followup.md": "Synthetic unchanged checked follow-up. No execution authorized.\n",
    "original-return.txt": "Synthetic original return\n", "producer-results.json": '{"checks":["synthetic unchanged assertion"],"provider_calls":0}',
    "profile-canonical.json": '{"profile":"synthetic"}', "profile-input.json": '{"profile":"synthetic"}\n' }).map(([name, bytes]) => [name, Buffer.from(bytes)]));
  for (const role of ["producer", "consumer", "boundary"]) {
    const binding = "sha256:" + digest(role), args = { repositoryRoot: c.checkout, expectedSnapshotBinding: binding };
    const trace = [{ name: "augnes_resume_repository", arguments: { repositoryRoot: c.checkout }, result: { continuity: { snapshot: { binding } } } },
      ...(baseline ? [{ name: "augnes_read_repository_work_sources", arguments: args, result: { status: "available" } }] : []),
      { name: "augnes_prepare_repository_execution_choice", arguments: { ...args, action: "read" }, result: { status: "available" } }];
    artifacts.set(`${role}-trace.json`, Buffer.from(JSON.stringify(trace)));
  }
  return { result, source, environment, diff, files: new Map(files), artifacts };
}
function make(root, own) {
  const checkout = path.join(root, "checkout"), anchor = path.join(root, "anchor"); mkdirSync(checkout); mkdirSync(anchor);
  const c = { checkout, anchor, branch: "codex/synthetic-profile-succession", folder: path.join(checkout, ".augnes-local-verification/profile") };
  c.owner = acquireCheckoutVerificationOwnership({ repositoryRoot: checkout }); own(c);
  c.git = (...args) => execFileSync("git", args, { cwd: checkout, timeout: 4000, maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  c.git("init", "-b", c.branch);
  c.commit = () => { c.git("add", "scripts", "package.json"); c.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic profile fixture"); return c.git("rev-parse", "HEAD").toString().trim(); };
  const afterFiles = new Map(sourcePaths.map(name => [name, readFileSync(path.join(repository, name))]));
  const beforeFiles = new Map(afterFiles); beforeFiles.set(harness, Buffer.from(baselineHarness(afterFiles.get(harness).toString())));
  for (const [name, bytes] of beforeFiles) write(path.join(checkout, name), bytes);
  for (const name of ["scripts/test-execution-choice-transition.ts", "package.json"]) write(path.join(checkout, name), readFileSync(path.join(repository, name)));
  const suite = readFileSync(path.join(repository, "scripts/run-canonical-test-suite.mjs"), "utf8");
  assert.equal(suite.split(PROFILE_SUITE_ADDITION).length, 2, "fixture requires the one exact additive registration");
  write(path.join(checkout, "scripts/run-canonical-test-suite.mjs"), suite.replace(PROFILE_SUITE_ADDITION, ""));
  c.base = c.commit(); c.baseTree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
  Object.assign(c, priorReceipt(c, c.base, c.baseTree));
  write(path.join(checkout, harness), afterFiles.get(harness)); const improvementHead = c.commit(), improvementTree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
  c.nodeHash = digest(readFileSync(process.execPath));
  const observed = files => new Map([...files].map(([name, bytes]) => [name, Buffer.concat([Buffer.from("// Synthetic observation-only comment.\n"), bytes])]));
  c.runs = { baseline: captureRun(c, "baseline", observed(beforeFiles), true), candidate: captureRun(c, "candidate", observed(afterFiles), false) };
  for (const kind of ["final", "transition_normal", "transition_existing", "typecheck"]) {
    const files = new Map(afterFiles);
    if (kind.startsWith("transition_")) files.set("scripts/test-execution-choice-transition.ts", readFileSync(path.join(repository, "scripts/test-execution-choice-transition.ts")));
    if (kind === "typecheck") files.set("package.json", readFileSync(path.join(repository, "package.json")));
    c.runs[kind] = captureRun(c, kind, files, false);
  }
  write(path.join(checkout, "scripts/run-canonical-test-suite.mjs"), suite);
  write(path.join(checkout, "scripts/local-canonical-operating-profile-succession.mjs"), "// Synthetic final prospective owner; never executed.\n");
  const head = c.commit(), tree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
  c.delta = (from, to) => { const bytes = c.git("diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", from, to, "--");
    return { bytes: bytes.length, sha256: digest(bytes), paths: c.git("diff", "--name-only", from, to, "--").toString().trim().split("\n").filter(Boolean).sort() }; };
  c.finalSource = { schema: "augnes.local-canonical-operating-profile-final-source.v1", basis: "implementation_owner_not_independent_review", deltas: {
    predecessor_to_improvement: c.delta(c.base, improvementHead), improvement_to_final: c.delta(improvementHead, head), predecessor_to_final: c.delta(c.base, head), main_to_final: c.delta(c.base, head) } };
  c.ref = artifact => ({ artifact, sha256: digest(readFileSync(path.join(c.folder, artifact))) });
  write(path.join(c.folder, "final-source.json"), c.finalSource); write(path.join(c.folder, "synthetic-manifest.json"), { synthetic: true, purpose: "must not satisfy the production accepted-evidence pin" });
  c.proof = { schema: OPERATING_PROFILE_SCHEMA, kind: "operating_profile_efficiency", branch: c.branch, base: c.base, head, tree,
    prior_family_id: c.prior.family_id, prior_number: 1, prior_attempt_id: c.prior.attempt_id, prior_receipt_fingerprint: c.receipt.integrity.content_fingerprint,
    pull_request: 999, budget: { initial: 1, recovery: 0 }, originals: Object.fromEntries(["receipt", "attempt", "completion", "log"].map(kind => [kind, c.ref(`original-${kind}.${kind === "log" ? "log" : "json"}`)])),
    improvement: { base: c.base, head: improvementHead, tree: improvementTree, review: null, evidence: { manifest: c.ref("synthetic-manifest.json") } },
    final_source: c.ref("final-source.json"), authorization: null };
  c.authority = authority(c.proof); c.file = path.join(c.folder, "proof.json"); save(c);
  c.comparison = { synthetic: true, comparison: ["producer", "consumer", "boundary"].map(role => ({ role, baseline_operations: 3, candidate_operations: 2, discarded_prefetches: 1,
    remaining_tool_action_sequence_identical: true, remaining_status_reason_stage_sequence_identical: true })) };
  return c;
}

function checkPredecessor(c, receipt = c.receipt, log = readFileSync(path.join(c.folder, "original-log.log"))) {
  const p = { ...c.proof, prior_receipt_fingerprint: receipt.integrity.content_fingerprint };
  const completion = { ...read(path.join(c.folder, "original-completion.json")), receipt_fingerprint: p.prior_receipt_fingerprint };
  return validateOperatingProfilePredecessor(receipt, receipt.attempt, completion, p, log);
}
function checkSource(c, runs = c.runs, finalSource = c.finalSource, p = c.proof) {
  return validateOperatingProfileSource({ proof: p, original: c.receipt, runs, finalSource, repositoryRoot: c.checkout });
}
const permissions = () => Object.fromEntries(["accepted_repair", "execution_grant"].map(role => [role, { user: { login: "synthetic-publisher" }, permission: "admin" }]));
const checkAuthority = (c, p = c.proof, a = c.authority, grants = permissions()) => validateOperatingProfileAuthorityRecords(p, a.review, a.grant, grants, a.pr);
// Public immutable observation metadata, not an authenticated capability. The
// synthetic files deliberately cannot satisfy the pinned production reader.
const publishedObservations = {
  accepted_repair: { id: 5721999096, author: "hynk-studio", author_id: 89450056, body_sha256: "292e3bbd25d97929e8f995b6412266a525439a60d5ad9e9cfa4f5dc45537bfc7",
    timestamp: "2026-10-31T08:31:34Z", role: "accepted_repair", commit_id: "35054619c612c1ffc6ff5bb42c370b7416758bbb" },
  execution_grant: { id: 6541192997, author: "hynk-studio", author_id: 89450056, body_sha256: "878b5a38e4eba06833e19e4e1e70602f036a3849f520ebfce8382a7ac2771447",
    timestamp: "2026-10-31T08:33:02Z", role: "execution_grant", commit_id: null },
};
function structuralProof(c) {
  const p = { ...copy(c.proof), local_relative_path: path.relative(c.checkout, c.file), pull_request: PROFILE_ACCEPTED.pull_request };
  for (const [kind, key] of [["receipt", "receipt_sha256"], ["attempt", "attempt_sha256"], ["completion", "completion_sha256"], ["log", "retained_log_sha256"]]) p.originals[kind].sha256 = PROFILE_ACCEPTED[key];
  p.improvement.head = publishedObservations.accepted_repair.commit_id;
  p.improvement.review = { id: PROFILE_ACCEPTED.review_id, sha256: PROFILE_ACCEPTED.review_sha256 };
  p.improvement.evidence.accepted_manifest = { artifact: "synthetic-manifest.json", sha256: PROFILE_ACCEPTED.manifest_sha256 };
  p.authorization = { grant_comment_id: PROFILE_ACCEPTED.grant_id, grant_sha256: PROFILE_ACCEPTED.grant_sha256 };
  return p;
}

if (process.argv[2] === "--stock-profile-records") {
  const packet = read(process.argv[3]), before = treeFiles(packet.anchor), receipt = read(packet.receipt);
  assert(reconstructAttemptTip({ anchorRoot: packet.anchor, branch: receipt.repository.branch }).operating_profile_consumed);
  assert(validOperatingProfileAttempt(receipt.attempt));
  assert(!inspectAttemptRecords({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, receipt }), "synthetic records cannot satisfy pinned production stock");
  assert.deepEqual(treeFiles(packet.anchor), before);
  console.log("cold structural reconstruction only; production stock correctly refuses synthetic evidence without writes");
} else if (process.argv[2] === "--run-profile-fixtures") await profileControls(process.argv[3]);

export async function profileControls(group = "evidence") {
  assert(["evidence", "authority", "records"].includes(group));
  const owner = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(owner);
  let c, active = false;
  const checks = [], pass = name => { checks.push(name); console.log(JSON.stringify({ control: name, status: "PASS", synthetic_only: true })); };
  const refused = (name, run, code) => {
    let observed;
    assert.throws(() => { try { run(); } catch (error) { observed = error; throw error; } }, code ? { code } : undefined, name);
    console.log(JSON.stringify({ control: name, observed_refusal: observed.code ?? observed.name, synthetic_only: true })); pass(name);
  };
  try {
    c = make(owner.root, value => { c = value; });
    if (group === "evidence") {
      checkPredecessor(c); assert.deepEqual(validateOperatingProfileComparison(c.runs, c.comparison), [1, 1, 1]); assert.equal(checkSource(c), true);
      pass("pure synthetic nested-timeout, both-PASS equivalence and complete Git-source checks accept without production admission");
      for (const [name, mutate] of [
        ["unknown cleanup refuses", r => r.cleanup.completed = false], ["additional failed phase refuses", r => r.phases[0].status = "failure"],
        ["outer timeout refuses", r => r.phases[7].timed_out = true], ["missing full-workload phase refuses", r => r.phases.pop()],
        ["truncated original log refuses", r => r.phases[7].log.truncated = true], ["wrong original log byte binding refuses", r => r.phases[7].log.bytes++],
      ]) { const changed = copy(c.receipt); mutate(changed); refused(name, () => checkPredecessor(c, finalizeReceipt(changed))); }
      const log = readFileSync(path.join(c.folder, "original-log.log"), "utf8");
      for (const [name, changed] of [
        ["boundary successful exit cannot erase timeout", log.replace('timed_out=true exit_observed', 'timed_out=false exit_observed')],
        ["unsettled nested result refuses", log.replace('streams_closed=true cleanup_completed=true', 'streams_closed=false cleanup_completed=true')],
        ["changed nested deadline refuses", log.replace('label="boundary" timeout_ms=60000', 'label="boundary" timeout_ms=61000')],
      ]) { const receipt = copy(c.receipt); receipt.phases[7].log.bytes = Buffer.byteLength(changed); refused(name, () => checkPredecessor(c, finalizeReceipt(receipt), Buffer.from(changed))); }
      for (const [name, mutate] of [
        ["timed-out candidate is not both-PASS evidence", runs => runs.candidate.result.result.timed_out = true],
        ["unknown candidate cleanup refuses", runs => runs.candidate.result.cleanup[0].completed = false],
        ["changed outer deadline refuses", runs => runs.candidate.result.timeout_ms++],
        ["changed checked artifact refuses", runs => runs.candidate.artifacts.set("fresh-followup.md", Buffer.from("changed\n"))],
        ["changed semantic result sequence refuses", runs => { const trace = JSON.parse(runs.candidate.artifacts.get("boundary-trace.json")); trace.at(-1).result.status = "refused"; runs.candidate.artifacts.set("boundary-trace.json", Buffer.from(JSON.stringify(trace))); }],
        ["prefetch binding mismatch refuses", runs => { const trace = JSON.parse(runs.baseline.artifacts.get("producer-trace.json")); trace[1].arguments.expectedSnapshotBinding = "sha256:" + "0".repeat(64); runs.baseline.artifacts.set("producer-trace.json", Buffer.from(JSON.stringify(trace))); }],
      ]) { const runs = copy(c.runs); mutate(runs); refused(name, () => validateOperatingProfileComparison(runs, c.comparison)); }
      const delta = copy(c.finalSource); delta.deltas.main_to_final.sha256 = "0".repeat(64); refused("wrong complete native delta refuses", () => checkSource(c, c.runs, delta));
      const wrapper = c.runs.final.files.get(workload[0]).toString();
      assert(wrapper.includes("timeoutMs=60_000")); write(path.join(c.checkout, workload[0]), wrapper.replace("timeoutMs=60_000", "timeoutMs=61_000"));
      const changedHead = c.commit(), changedProof = { ...c.proof, head: changedHead, tree: c.git("rev-parse", "HEAD^{tree}").toString().trim() };
      const resigned = copy(c.finalSource); resigned.deltas.improvement_to_final = c.delta(c.proof.improvement.head, changedHead);
      resigned.deltas.predecessor_to_final = c.delta(c.base, changedHead); resigned.deltas.main_to_final = c.delta(c.base, changedHead);
      refused("re-signed final Git delta cannot raise the retained fixture deadline", () => checkSource(c, c.runs, resigned, changedProof), "profile_workload_changed");
      const unpinned = structuralProof(c); delete unpinned.local_relative_path; unpinned.improvement.evidence.accepted_manifest = c.ref("synthetic-manifest.json"); write(c.file, unpinned);
      refused("re-signed synthetic manifest cannot satisfy immutable accepted evidence pin", () => proof(c), "profile_proof_invalid");
      assert(!existsSync(path.join(c.family, "correction-successor.json"))); pass("all evidence inspection leaves the exclusive predecessor edge absent");
    }
    if (group === "authority") {
      const observations = checkAuthority(c); assert.equal(observations.accepted_repair.author, "synthetic-publisher");
      pass("pure synthetic record validation preserves explicit ChatGPT attribution separately from publisher identity");
      for (const [name, mutate] of [
        ["changed review body refuses", a => a.review.body += "changed"], ["wrong review source refuses", a => a.review.commit_id = c.proof.head],
        ["changed grant body refuses", a => a.grant.body += "changed"], ["bot publisher refuses", a => a.grant.user.type = "Bot"],
        ["wrong grant destination refuses", a => a.grant.issue_url += "0"], ["unpublished final head refuses", a => a.pr.head.sha = c.proof.base],
        ["wrong current main refuses", a => a.pr.base.sha = c.proof.head], ["Ready PR refuses", a => a.pr.draft = false], ["auto merge refuses", a => a.pr.auto_merge = {}],
      ]) { const a = copy(c.authority); mutate(a); refused(name, () => checkAuthority(c, c.proof, a)); }
      const restricted = permissions(); restricted.execution_grant.permission = "read"; refused("unprivileged execution authority refuses", () => checkAuthority(c, c.proof, c.authority, restricted));
      const a = copy(c.authority), p = copy(c.proof); a.grant.body = "Generic approval"; p.authorization.grant_sha256 = digest(timeoutAuthorityObservation(a.grant, "execution_grant"));
      refused("re-signed generic approval does not grant the prospective allowance", () => checkAuthority(c, p, a), "profile_authority_scope_invalid");
      await assert.rejects(authorize(c, c.proof), { code: "profile_authority_missing" }); pass("synthetic records cannot obtain a pinned production authority capability");
      const ledger = treeFiles(c.anchor); refused("forged capability cannot admit synthetic proof", () => begin(c, { ...c.proof, local_relative_path: path.relative(c.checkout, c.file) }, { observations }));
      assert.deepEqual(treeFiles(c.anchor), ledger); pass("authority refusals make no reservation or ledger writes");
    }
    if (group === "records") {
      const p = structuralProof(c), observations = copy(publishedObservations);
      const familyId = digest([ATTEMPT_CONTRACT, "hynk-studio/augnes", c.branch, "verified_source_correction", p.prior_attempt_id, p.head, p.tree]);
      const attempt = { ...copy(c.prior), family_id: familyId, attempt_id: "synthetic-profile-record-only", head: p.head, tree: p.tree,
        source_correction: p, profile_authority: observations, budget: { initial: 1, recovery: 0 } };
      assert(validOperatingProfileAttempt(attempt));
      const originalBytes = treeFiles(c.anchor), nextRoot = path.join(c.anchor, ".augnes-local-verification/families", familyId);
      const edge = { contract: "augnes.local-canonical-successor.v2", kind: "operating_profile_efficiency", family_id: familyId, head: p.head, tree: p.tree, proof_fingerprint: digest(p) };
      // Manually authored synthetic structural records, never a production claim.
      write(path.join(c.family, "correction-successor.json"), edge); write(path.join(nextRoot, "attempt-1.json"), attempt);
      assert(reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch }).operating_profile_consumed);
      pass("synthetic record reconstruction recognizes the new terminal lineage kind");
      const receipt = finalizeReceipt({ ...copy(c.receipt), repository: { ...c.receipt.repository, head_sha: p.head, tree_sha: p.tree }, run: { ...c.receipt.run, id: attempt.attempt_id }, attempt });
      const inspected = inspectReceiptForDecision(receipt, { currentAttemptRecordsValid: true }); assert(!inspected.issues.includes("receipt_operating_profile_succession_invalid")); assert(!inspected.valid_deciding_evidence);
      const exported = createPrivateReviewExport(receipt); assert(inspectPrivateReviewExport(exported).structurally_valid); assert(validOperatingProfileAttempt(exported.attempt));
      for (const [name, mutate] of [["second attempt refuses", a => a.number = 2], ["recovery allowance refuses", a => a.budget.recovery = 1], ["recovery payload refuses", a => a.recovery = {}],
        ["altered source head refuses", a => a.head = c.base], ["altered grant role refuses", a => a.profile_authority.execution_grant.role = "implementation_owner"]]) {
        const changed = copy(attempt); mutate(changed); assert(!validOperatingProfileAttempt(changed), name);
        const altered = finalizeReceipt({ ...copy(receipt), attempt: changed }); assert(inspectReceiptForDecision(altered, { currentAttemptRecordsValid: true }).issues.includes("receipt_operating_profile_succession_invalid")); pass(name);
      }
      const bytes = readFileSync(path.join(nextRoot, "attempt-1.json")); rmSync(path.join(nextRoot, "attempt-1.json"));
      refused("interrupted synthetic edge without attempt refuses reconstruction", () => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch })); write(path.join(nextRoot, "attempt-1.json"), bytes);
      write(path.join(nextRoot, "correction-successor.json"), edge); refused("any successor after consumed profile edge refuses", () => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch }), "attempt_operating_profile_successor_terminal"); rmSync(path.join(nextRoot, "correction-successor.json"));
      for (const original of originalBytes) assert.equal(digest(readFileSync(path.join(c.anchor, original.file))), original.sha256);
      const receiptFile = path.join(c.folder, "structural-receipt.json"), packetFile = path.join(c.folder, "structural-packet.json"); write(receiptFile, receipt); write(packetFile, { anchor: c.anchor, checkout: c.checkout, receipt: receiptFile });
      const ledger = treeFiles(c.anchor); active = true; let output = "";
      const result = await runCanonicalChild({ suite: "operating-profile-record-fixture", label: "cold synthetic structural reader", command: process.execPath,
        args: [self, "--stock-profile-records", packetFile], cwd: owner.root, env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), timeoutMs: 4000,
        stdout: { write: chunk => output += chunk }, stderr: { write: chunk => output += chunk }, log() {} });
      active = !(result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0);
      console.log("AUGNES_REVIEW_CHILD_RESULT " + JSON.stringify(projectReviewChildResult(result, { controlId: "profile-cold-structural-reader" })));
      assertReviewChildLifecycle(result, { controlId: "profile-cold-structural-reader" }); assert.equal(result.exit_code, 0, output); assert.deepEqual(treeFiles(c.anchor), ledger);
      pass("fresh structural reader is read-only; pinned production stock still refuses synthetic evidence");
    }
  } finally {
    if (c?.owner) releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: !active });
    if (!active) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    assert(cleanupCanonicalTestResources([owner])[0].completed);
  }
  console.log(JSON.stringify({ operating_profile_succession: checks, group, count: checks.length, synthetic_only: true, production_admission: "NOT_RUN", cleanup_complete: true }));
}

