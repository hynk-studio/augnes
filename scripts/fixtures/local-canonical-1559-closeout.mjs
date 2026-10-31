// Disposable controls for the finite #1559 closeout route. Synthetic records
// replace only fixed pin data in a private copy of the production owner; its
// validation and admission predicates remain unchanged. No private task evidence,
// real GitHub request, deciding workload or real attempt ledger is used here.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync, readdirSync, symlinkSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { digest } from "../local-canonical-inputs.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "../canonical-test-environment.mjs";
import { runCanonicalChild } from "../canonical-child-runner.mjs";
import { assertReviewChildLifecycle, projectReviewChildResult } from "./local-canonical-review-child-result.mjs";

const self = fileURLToPath(import.meta.url), repository = path.resolve(path.dirname(self), "../..");
const ownerPath = "scripts/local-canonical-1559-closeout.mjs";
const write = (file, value) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value), { mode: 0o600 }); };
const read = file => JSON.parse(readFileSync(file, "utf8"));
const time = offset => new Date(Date.now() + offset).toISOString();
const treeFiles = (directory, root = directory) => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? treeFiles(file, root) : [{ file: path.relative(root, file), sha256: digest(readFileSync(file)) }];
}).sort((a, b) => a.file.localeCompare(b.file));

// Import the real predicates through a copied dependency closure. This changes
// constants, never production source or a validator, and cannot grant authority
// in the repository's real process/module instance.
function copyControlSources(target, pins) {
  const copied = new Set();
  const copy = name => {
    if (copied.has(name)) return;
    copied.add(name);
    let source = readFileSync(path.join(repository, name), "utf8");
    if (name === ownerPath) {
      const marker = /\/\/ BEGIN CLOSEOUT PINS[\s\S]*?\/\/ END CLOSEOUT PINS/u;
      assert(marker.test(source), "the fixed pin declaration must be explicitly delimited");
      source = source.replace(marker, `// BEGIN CLOSEOUT PINS\nexport const CLOSEOUT_PINS = Object.freeze(${JSON.stringify(pins)});\n// END CLOSEOUT PINS`);
    }
    write(path.join(target, name), source);
    for (const match of source.matchAll(/(?:from\s+|import\s*\()(["'])(\.{1,2}\/[^"']+)\1/gu)) {
      const dependency = path.normalize(path.join(path.dirname(name), match[2]));
      assert(!dependency.startsWith(".."), "control import stays in the public repository");
      copy(dependency);
    }
  };
  for (const name of [ownerPath, "scripts/local-canonical-attempts.mjs", "scripts/local-canonical-receipt.mjs", "scripts/local-canonical-review-export.mjs",
    "scripts/github-main-branch-transport.mjs", "scripts/fixtures/local-canonical-receipt-v3.mjs"]) copy(name);
}

async function controlModules(root) {
  const load = name => import(pathToFileURL(path.join(root, "scripts", name)).href);
  const [route, attempts, receipt, exported, transport, fixture, companion, ownership, browser] = await Promise.all([
    load("local-canonical-1559-closeout.mjs"), load("local-canonical-attempts.mjs"), load("local-canonical-receipt.mjs"),
    load("local-canonical-review-export.mjs"), load("github-main-branch-transport.mjs"), load("fixtures/local-canonical-receipt-v3.mjs"),
    load("local-canonical-companion-timeout-succession.mjs"), load("local-canonical-checkout-ownership.mjs"), load("local-canonical-browser-replacement.mjs"),
  ]);
  return { ...route, ...attempts, ...receipt, ...exported, ...transport, ...fixture, ...companion, ...ownership, ...browser };
}

function syntheticV7(m, c) {
  const contract = m.ATTEMPT_CONTRACT, family = path.join(c.anchor, ".augnes-local-verification/families");
  const old = { contract, family_id: digest([contract, "hynk-studio/augnes", c.branch]), attempt_id: "synthetic-pre-companion", number: 1,
    branch: c.branch, head: c.base, tree: c.git("rev-parse", `${c.base}^{tree}`).toString().trim(), contract_fingerprint: "1".repeat(64),
    started_at: time(-60000), prior_attempt_id: null, prior_receipt_fingerprint: null, recovery: null, source_correction: null, budget: { initial: 1, recovery: 1 } };
  const oldCompletion = { contract, attempt_id: old.attempt_id, receipt_fingerprint: "2".repeat(64), disposition: "product_failure", cleanup_complete: true,
    infrastructure_code: null, finished_at: time(-55000) };
  write(path.join(family, old.family_id, "attempt-1.json"), old); write(path.join(family, old.family_id, "completion-1.json"), oldCompletion);
  const repair = "a47c77746de213748d68ed0831221c2ddf321520";
  const observation = (id, role, commit_id, offset) => ({ id, author: "synthetic-fixture", author_id: 7, body_sha256: digest(`SYNTHETIC ${role}`), timestamp: time(offset), role, commit_id });
  const authority = { accepted_repair: observation(101, "accepted_repair", repair, -50000), final_policy_review: observation(102, "final_policy_review", c.priorHead, -49000),
    execution_grant: observation(103, "execution_grant", null, -48000) };
  const p = { schema: m.COMPANION_TIMEOUT_SCHEMA, kind: "companion_readiness_timeout", defect: "owned_child_readiness_exit_without_setup_cleanup",
    source_module: "scripts/test-companion-ownership-retirement.mjs", branch: c.branch, base: c.base, head: c.priorHead, tree: c.priorTree,
    prior_family_id: old.family_id, prior_number: 1, prior_attempt_id: old.attempt_id, prior_receipt_fingerprint: oldCompletion.receipt_fingerprint,
    retained_sources: { "scripts/test-companion-ownership-retirement.mjs": "62e63db0423627ba23fe1793de1a880a056cf2a4ea5ed854938b134793eb685d" },
    limitations: structuredClone(m.COMPANION_LIMITATIONS), source_scope: { schema: "augnes.local-canonical-companion-source-scope.v1", basis: "accepted_task_and_current_main_union",
      accepted_base: c.base, accepted_head: repair, current_main: c.base },
    repair: { head: repair, tree: c.git("rev-parse", `${repair}^{tree}`).toString().trim(), review: { id: 101, sha256: digest(authority.accepted_repair) },
      accepted_review: { reviewed_at: time(-51000), source_url: "https://chatgpt.com/space/page_00000000000000000000000000000000", block_id: "00000000-0000-4000-8000-000000000001", block_sha256: "3".repeat(64) } },
    authorization: { policy_review_id: 102, policy_review_sha256: digest(authority.final_policy_review), grant_comment_id: 103, grant_sha256: digest(authority.execution_grant) },
    pull_request: 1560, budget: { initial: 1, recovery: 0 } };
  const prior = { contract, family_id: digest([contract, "hynk-studio/augnes", c.branch, "verified_source_correction", p.prior_attempt_id, p.head, p.tree]),
    attempt_id: "synthetic-consumed-companion", number: 1, branch: c.branch, head: c.priorHead, tree: c.priorTree, contract_fingerprint: c.inputs.fingerprint,
    started_at: time(-45000), prior_attempt_id: null, prior_receipt_fingerprint: null, recovery: null, source_correction: p,
    companion_timeout_authority: authority, budget: { initial: 1, recovery: 0 } };
  assert(m.validCompanionTimeoutAttempt(prior), "synthetic predecessor must satisfy the actual historical v7 validator");
  const edge = { contract: "augnes.local-canonical-successor.v2", kind: "companion_readiness_timeout", family_id: prior.family_id, head: prior.head, tree: prior.tree, proof_fingerprint: digest(p) };
  write(path.join(family, old.family_id, "correction-successor.json"), edge); write(path.join(family, prior.family_id, "attempt-1.json"), prior);
  return { prior, edge, family: path.join(family, prior.family_id), oldFamily: path.join(family, old.family_id) };
}

const POLICY_PATHS = [".github/LOCAL_CANONICAL_VERIFICATION.md", "scripts/local-canonical-attempts.mjs", "scripts/run-local-canonical-verification.mjs",
  "scripts/local-canonical-receipt.mjs", "scripts/local-canonical-review-export.mjs", "scripts/test-local-canonical-executor.mjs",
  "scripts/test-local-canonical-review-corrections.mjs", ownerPath, "scripts/fixtures/local-canonical-1559-closeout.mjs"];
const save = c => write(c.file, c.proof);
const proof = c => c.m.readSourceCorrectionProof(c.file, c.checkout);
const authorizationTransport = (c, change = value => value) => c.m.createGitHubObserverAuthorizationTransport(1560, { runner: async request => {
  assert.equal(request.operation, "fetch_browser_authority"); assert(request.args.includes("GET"));
  const url = request.args[1]; assert(url.startsWith("repos/hynk-studio/augnes/"));
  return change(structuredClone(url.includes("/comments/") ? c.authority.grant : url.endsWith("/pulls/1560") ? c.authority.pr :
    { permission: "admin", user: { login: "synthetic-fixture" } }), url);
} });
const authorize = (c, p, change) => c.m.authorizeCloseout(p, { transport: authorizationTransport(c, change) });
const begin = (c, p, authorization, extra = {}) => c.m.beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner,
  branch: p.branch, head: p.head, tree: p.tree, acceptedMain: p.base, runId: "synthetic-closeout-successor", contractFingerprint: "6".repeat(64),
  sourceCorrection: p, closeoutAuthorization: authorization, ...extra });

function retained(c, original) {
  const values = new Map(original.CLOSEOUT_RETAINED_PATHS.map(name => [name, Buffer.from(`SYNTHETIC retained ${name}\n`)]));
  const settled = (exit, index) => ({ nondeciding: true, started_at: time(-29000 + index * 10), finished_at: time(-28000 + index * 10), root_absent: true,
    result: { exit_code: exit, signal: null, timed_out: false, cancelled: false, spawn_error_code: null, exit_observed: true, streams_closed: true,
      cleanup_completed: true, remaining_owned_processes: 0, termination_reason: "natural_exit", duration_ms: 5 },
    cleanup: [{ completed: true, failure_count: 0, failures: [] }] });
  const put = (name, value) => values.set(name, Buffer.from(JSON.stringify(value)));
  const labels = ["pair-1-baseline", "pair-1-candidate", "pair-2-candidate", "pair-2-baseline", "pair-3-baseline", "pair-3-candidate"];
  const results = labels.map((label, index) => {
    const record = settled(0, index), revision = label.endsWith("candidate") ? "final" : "baseline";
    put(`${label}/settlement.json`, record);
    put(`${label}/source-command.json`, { nondeciding: true, mode: "plain", source_status: "", timeout_ms: 30000, require_natural_exit: false,
      head: revision === "final" ? c.pins.repair_head : c.priorHead, started_at: record.started_at });
    return { pair: Number(label[5]), revision, label, ...record };
  });
  for (const [index, label] of ["dev-normal-1", "dev-output-failure", "dev-lifecycle-failure", "dev-output-cleanup-failure"].entries()) {
    put(`${label}/settlement.json`, settled(index === 0 ? 0 : 1, index + 6));
    put(`${label}/source-command.json`, { nondeciding: true, timeout_ms: 30000 });
  }
  put("helper-controls-run/settlement.json", { ...settled(0, 10), helper_unchanged: true, failure: null });
  const refs = [...values].map(([name, bytes], index) => ({ path: name, ...c.artifact(`retained-${index}.${path.extname(name).slice(1) || "txt"}`, bytes) }));
  const manifest = c.artifact("manifest.json", { files: refs.map(ref => ({ path: ref.path, bytes: values.get(ref.path).length, sha256: ref.sha256 })) });
  const comparison = c.artifact("comparison.json", { plan: { baseline_head: c.priorHead, candidate_head: c.pins.repair_head, timeout_ms_per_complete_child: 30000, pairs: 3 },
    results, stopped: null, finished_at: time(-26000) });
  return { retained: refs, manifest, comparison };
}

function bindCandidate(c, head = c.commit()) {
  c.proof.head = head; c.proof.tree = c.git("rev-parse", `${head}^{tree}`).toString().trim();
  const source = { schema: "augnes.local-canonical-closeout-final-source.v1", basis: "implementation_owner_not_independent_review", base: c.proof.base,
    head, tree: c.proof.tree, predecessor_head: c.priorHead, predecessor_tree: c.priorTree, repair_head: c.pins.repair_head, repair_tree: c.pins.repair_tree,
    deltas: { repair: c.delta(c.priorHead, c.pins.repair_head), predecessor: c.delta(c.priorHead, head), reviewed: c.delta(c.pins.repair_head, head), main: c.delta(c.proof.base, head) } };
  c.proof.final_source = c.artifact("final-source.json", source);
  c.proof.source_scope = c.m.inspectCloseoutSourceScope(c.checkout, c.proof);
  if (c.authority) { c.authority.pr.head.sha = head; c.authority.pr.base.sha = c.proof.base; }
  save(c); return source;
}

async function make(root) {
  const original = await controlModules(repository), pins = structuredClone(original.CLOSEOUT_PINS);
  const checkout = path.join(root, "checkout"), anchor = path.join(root, "anchor"), folder = path.join(checkout, ".augnes-local-verification/closeout");
  mkdirSync(checkout); mkdirSync(anchor); mkdirSync(folder, { recursive: true });
  const branch = "codex/synthetic-1559-closeout", base = pins.accepted_base, priorHead = pins.prior_head, priorTree = pins.prior_tree;
  const git = (...args) => execFileSync("git", args, { cwd: checkout, timeout: 4000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  git("init", "-b", branch);
  const objectPath = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-path", "objects"], { cwd: repository, encoding: "utf8", timeout: 4000 }).trim();
  write(path.join(checkout, ".git/objects/info/alternates"), objectPath + "\n");
  git("update-ref", `refs/heads/${branch}`, pins.repair_head); git("read-tree", pins.repair_head);
  for (const name of POLICY_PATHS) write(path.join(checkout, name), readFileSync(path.join(repository, name)));
  const commit = () => { git("add", "--", ...POLICY_PATHS); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic bounded closeout candidate"); return git("rev-parse", "HEAD").toString().trim(); };
  const delta = (a, b) => { const bytes = git("diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", a, b, "--"); return { sha256: digest(bytes), bytes: bytes.length,
    changed_paths: git("diff", "--no-renames", "--name-only", "-z", a, b, "--").toString().split("\0").filter(Boolean).sort() }; };
  const resources = ["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable", "browser-executable"]
    .map(id => ({ id, classification: "safety", before: { present: false }, location_fingerprint: digest(id) }));
  const declaration = { contract: "augnes.local-canonical-inputs.v3", path_kind: "isolated-model-free-v1", binding: { head: priorHead, tree: priorTree,
    executor_fingerprint: "a".repeat(64), phase_environment_fingerprints: original.BROWSER_REPLACEMENT_PHASES.map(id => ({ id, fingerprint: "b".repeat(64) })) }, resources };
  const c = { checkout, anchor, folder, branch, base, priorHead, priorTree, git, commit, delta, pins, inputs: { ...declaration, fingerprint: digest(declaration) }, file: path.join(folder, "proof.json") };
  c.artifact = (name, value) => { write(path.join(folder, name), value); return { artifact: name, sha256: digest(readFileSync(path.join(folder, name))) }; };
  Object.assign(c, syntheticV7(original, c));
  const label = "machine-owned Companion service and public lifecycle contract";
  const unitLog = Array.from({ length: 51 }, (_, i) => `[canonical:unit] child_result label="synthetic preceding ${i}" duration_ms=1 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`).join("") +
    `[canonical:unit] child_start label=${JSON.stringify(label)} timeout_ms=30000\n` +
    `[canonical:unit] child_result label=${JSON.stringify(label)} duration_ms=30073 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n`;
  const logRelative = `.augnes-local-verification/logs/${c.prior.attempt_id}/unit.log`; write(path.join(checkout, logRelative), unitLog);
  const receipt = original.finalizeReceipt({ ...structuredClone(original.baseReceipt), receipt_version: 4,
    repository: { ...original.baseReceipt.repository, branch, base_sha: base, head_sha: priorHead, tree_sha: priorTree }, evidence: { ...original.baseReceipt.evidence, mode: "full", selected_plan: "full-canonical" },
    verification_context: { kind: "isolated-worktree" }, executor: { ...original.baseReceipt.executor, source_fingerprint: "a".repeat(64) }, run: { ...original.baseReceipt.run, id: c.prior.attempt_id }, attempt: c.prior,
    inputs: { ...c.inputs, checks: 2, first_fault: null, secondary_faults: [], events: [] }, outcome: { disposition: "product_failure", safety: "preserved_within_observed_scope", validity: "valid_within_observed_scope", first_fault: null },
    checkout_ownership: { released: true }, capacity_ownership: { released: true }, cleanup: { completed: true, remaining_owned_processes: 0, companion_service: { restored: true }, isolated_resources: { completed: true, failure_count: 0, failures: [] } },
    phases: original.BROWSER_REPLACEMENT_PHASES.map((id, i) => ({ id, status: i < 5 ? "pass" : i === 5 ? "failure" : "not_run", exit_status: i < 5 ? 0 : i === 5 ? 1 : null,
      failure_code: i === 5 ? "phase_failed" : null, timed_out: false, spawn_error_code: null, environment_fingerprint: i > 5 ? null : "b".repeat(64),
      ...(i === 5 ? { log: { relative_path: logRelative, bytes: Buffer.byteLength(unitLog), truncated: false } } : {}),
      cleanup: { completed: true, remaining_owned_processes: 0, exit_observed: i <= 5, streams_closed: i <= 5, termination_reason: i <= 5 ? "natural_exit" : null } })),
    final: { result: "failure", exit_status: 1, reason_codes: ["phase_failed", "selected_phases_incomplete"] } });
  const completion = { contract: c.prior.contract, attempt_id: c.prior.attempt_id, receipt_fingerprint: receipt.integrity.content_fingerprint, disposition: "product_failure",
    cleanup_complete: true, infrastructure_code: null, finished_at: time(-31000) };
  write(path.join(c.family, "completion-1.json"), completion);
  const stock = { content_fingerprint: receipt.integrity.content_fingerprint, valid_deciding_evidence: false, issues: Array.from({ length: 15 }, (_, i) => `synthetic_original_issue_${i + 1}`) };
  c.receipt = receipt;
  const originals = Object.fromEntries(Object.entries({ receipt, attempt: c.prior, completion, edge: c.edge, unit_log: unitLog, stock, stock_log: JSON.stringify(stock) })
    .map(([key, value]) => [key, c.artifact(`original-${key}.${key.endsWith("log") ? "log" : "json"}`, value)]));
  const repairEvidence = retained(c, original), reviewText = "SYNTHETIC accepted repair review; no actual review or execution authority.";
  const acceptedReview = { source_url: "https://chatgpt.com/space/page_00000000000000000000000000000000", block_id: "00000000-0000-4000-8000-000000000002", block_sha256: digest(reviewText), reviewed_at: time(-20000) };
  const reviewRef = c.artifact("accepted-review.json", { source_url: acceptedReview.source_url, review_completed_at: acceptedReview.reviewed_at, blocks: [{ id: acceptedReview.block_id, hash: acceptedReview.block_sha256, markdown: reviewText }] });
  const sourceBindings = c.artifact("source-bindings.json", { head: pins.repair_head, tree: pins.repair_tree, branch, status: "" });
  const nativeDelta = c.artifact("accepted-native.diff", git("diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", priorHead, pins.repair_head, "--"));
  const fullPrDelta = c.artifact("accepted-full-pr.diff", git("diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", base, pins.repair_head, "--"));
  const grant = { id: 203, user: { login: "synthetic-fixture", id: 7, type: "User" }, author_association: "OWNER", issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/1560",
    created_at: time(-10000), body: "SYNTHETIC separately scoped finite closeout authority; never actual task authority." }; grant.updated_at = grant.created_at;
  const observation = original.closeoutAuthorityObservation(grant);
  Object.assign(pins, { branch, prior_family_id: c.prior.family_id, prior_attempt_id: c.prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    completed_at: completion.finished_at, originals: Object.fromEntries(Object.entries(originals).map(([key, ref]) => [key, ref.sha256])),
    manifest: repairEvidence.manifest.sha256, comparison: repairEvidence.comparison.sha256, source_bindings: sourceBindings.sha256,
    native_delta: nativeDelta.sha256, full_pr_delta: fullPrDelta.sha256, accepted_review: { ...acceptedReview, sha256: reviewRef.sha256 },
    scope: Object.fromEntries(Object.entries(observation).filter(([key]) => !["role", "commit_id"].includes(key))) });
  c.controlRoot = path.join(root, "control-source"); copyControlSources(c.controlRoot, pins); c.m = await controlModules(c.controlRoot);
  c.owner = c.m.acquireCheckoutVerificationOwnership({ repositoryRoot: checkout });
  c.proof = { schema: c.m.CLOSEOUT_SCHEMA, kind: "issue_1559_closeout", pull_request: 1560, branch, base, head: pins.repair_head, tree: pins.repair_tree,
    prior_family_id: c.prior.family_id, prior_number: 1, prior_attempt_id: c.prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint, originals,
    repair: { head: pins.repair_head, tree: pins.repair_tree, accepted_review: { ...acceptedReview, ...reviewRef }, ...repairEvidence,
      source_bindings: sourceBindings, native_delta: nativeDelta, full_pr_delta: fullPrDelta },
    source_scope: null, final_source: null, authorization: { scope_comment_id: grant.id, scope_sha256: digest(observation) }, budget: { initial: 1, recovery: 0 } };
  c.authority = { grant, pr: { number: 1560, state: "open", draft: true, merged: false, auto_merge: null, head: { sha: null, ref: branch, repo: { full_name: "hynk-studio/augnes" } },
    base: { sha: base, ref: "main", repo: { full_name: "hynk-studio/augnes" } } } };
  bindCandidate(c); return c;
}

async function packetContext(file) {
  const packet = read(file), m = await controlModules(packet.controlRoot);
  return { ...packet, m, proof: read(packet.file) };
}
if (process.argv[2] === "--stock-closeout-fixture") {
  const c = await packetContext(process.argv[3]), before = treeFiles(c.anchor), p = proof(c), authorization = await authorize(c, p);
  assert(c.m.inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: read(c.receiptFile), closeoutAuthorization: authorization }));
  assert.deepEqual(treeFiles(c.anchor), before); console.log("fresh closeout stock reconstructs without writes or reservation");
} else if (process.argv[2] === "--claim-closeout-fixture") {
  const c = await packetContext(process.argv[3]);
  try {
    c.owner = c.m.acquireCheckoutVerificationOwnership({ repositoryRoot: c.checkout });
    const p = proof(c), authorization = await authorize(c, p), attempt = begin(c, p, authorization, { runId: c.run_id });
    c.m.finishAttempt(attempt, { receiptFingerprint: "7".repeat(64), disposition: "product_failure", cleanupComplete: true });
    console.log("exclusive_claim_won");
  } catch (error) { console.log(`exclusive_claim_refused:${error.code}`); process.exitCode = 1; }
  finally { if (c.owner) c.m.releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: true }); }
} else if (process.argv[2] === "--run-closeout-fixtures") await closeoutControls(process.argv[3]);

export async function closeoutControls(group = "evidence") {
  assert(["evidence", "source", "authority", "admission", "race", "stock"].includes(group));
  const resource = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(resource);
  const checks = [], pass = name => checks.push(name); let c, active = 0;
  const child = async (args, controlId) => {
    active++; let output = "";
    const result = await runCanonicalChild({ suite: "1559-closeout-fixture", label: "synthetic closeout control", command: process.execPath, args, cwd: resource.root,
      env: buildCanonicalChildEnvironment({ temporaryRoot: resource.root }), timeoutMs: 4000,
      stdout: { write: chunk => output = (output + chunk).slice(-8000) }, stderr: { write: chunk => output = (output + chunk).slice(-8000) }, log() {} });
    if (result.cleanup_completed && result.exit_observed && result.streams_closed && result.remaining_owned_processes === 0) active--;
    console.log("AUGNES_REVIEW_CHILD_RESULT " + JSON.stringify(projectReviewChildResult(result, { controlId })));
    assertReviewChildLifecycle(result, { controlId }); return { ...result, output };
  };
  try {
    c = await make(resource.root);
    const saved = structuredClone(c.proof), savedAuthority = structuredClone(c.authority), validated = proof(c), authorized = await authorize(c, validated);
    const files = new Map(readdirSync(c.folder).map(name => [name, readFileSync(path.join(c.folder, name))])), originalLedger = treeFiles(c.anchor);
    const reset = () => { for (const [name, bytes] of files) write(path.join(c.folder, name), bytes); c.proof = structuredClone(saved); c.authority = structuredClone(savedAuthority); };
    const edgeFile = path.join(c.family, "correction-successor.json");
    assert(c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch }).companion_timeout_consumed);
    assert(!existsSync(edgeFile)); assert.deepEqual(treeFiles(c.anchor), originalLedger);
    pass("normal reader and authenticated synthetic scope accept exact public repair; inspection does not reserve");
    if (group === "evidence") {
      for (const [name, mutate] of [
        ["legacy schema", p => p.schema = "augnes.local-canonical-source-correction.v2"], ["v7 relabel", p => p.schema = "augnes.local-canonical-source-correction.v7"],
        ["wrong profile", p => p.kind = "companion_readiness_timeout"], ["wrong branch", p => p.branch = "codex/copied-closeout"],
        ["wrong predecessor", p => p.prior_attempt_id = "another-attempt"], ["receipt digest", p => p.originals.receipt.sha256 = "0".repeat(64)],
        ["original edge digest", p => p.originals.edge.sha256 = "0".repeat(64)], ["stock omitted", p => delete p.originals.stock],
        ["accepted review changed", p => p.repair.accepted_review.block_sha256 = "0".repeat(64)], ["retained adverse omitted", p => p.repair.retained.pop()],
        ["second initial attempt", p => p.budget.initial = 2], ["recovery allowance", p => p.budget.recovery = 1],
      ]) { reset(); mutate(c.proof); save(c); assert.throws(() => proof(c), undefined, name); pass(`refuse ${name}`); }
      for (const key of Object.keys(saved.originals)) {
        reset(); rmSync(path.join(c.folder, c.proof.originals[key].artifact)); assert.throws(() => proof(c), undefined, key); pass(`missing original ${key} fails closed`);
      }
      reset(); const original = read(path.join(c.folder, c.proof.originals.receipt.artifact)); original.phases[5].id = "integration";
      c.proof.originals.receipt = c.artifact(c.proof.originals.receipt.artifact, c.m.finalizeReceipt(original)); save(c);
      assert.throws(() => proof(c)); pass("wrong original phase cannot be rehashed into accepted evidence");
      for (const [name, change] of [["incomplete cleanup", r => r.cleanup.completed = false], ["unresolved input fault", r => r.inputs.first_fault = { disposition: "unknown_relevance" }]]) {
        reset(); const changed = read(path.join(c.folder, c.proof.originals.receipt.artifact)); change(changed);
        c.proof.originals.receipt = c.artifact(c.proof.originals.receipt.artifact, c.m.finalizeReceipt(changed)); save(c); assert.throws(() => proof(c)); pass(`rehashed original ${name} refuses`);
      }
      reset(); write(path.join(c.folder, c.proof.originals.unit_log.artifact), "SYNTHETIC omitted timeout\n");
      assert.throws(() => proof(c), /closeout_evidence_changed/); pass("missing original nested timeout bytes refuse");
      c.proof.originals.unit_log.sha256 = digest(readFileSync(path.join(c.folder, c.proof.originals.unit_log.artifact))); save(c);
      assert.throws(() => proof(c)); pass("rehashing a truncated log cannot transfer original failure acceptance");
      for (const key of ["repair", "predecessor", "reviewed", "main"]) {
        reset(); const source = read(path.join(c.folder, c.proof.final_source.artifact)); source.deltas[key].sha256 = "0".repeat(64);
        c.proof.final_source = c.artifact("final-source.json", source); save(c); assert.throws(() => proof(c), /closeout_native_delta_invalid/);
      }
      pass("all four native source deltas bind independently"); reset();
      const adverse = c.proof.repair.retained.find(x => x.path === "dev-lifecycle-failure/settlement.json"), altered = read(path.join(c.folder, adverse.artifact));
      altered.result.exit_code = 0; write(path.join(c.folder, adverse.artifact), altered); assert.throws(() => proof(c), /closeout_evidence_changed/);
      pass("accepted adverse failure cannot be converted to favorable success"); reset(); assert.deepEqual(treeFiles(c.anchor), originalLedger);
    }
    if (group === "source") {
      const sourceHead = saved.head, policyBytes = readFileSync(path.join(c.checkout, ownerPath));
      const resetSource = () => { reset(); c.git("update-ref", `refs/heads/${c.branch}`, sourceHead); c.git("read-tree", sourceHead);
        rmSync(path.join(c.checkout, ownerPath), { force: true, recursive: true }); write(path.join(c.checkout, ownerPath), policyBytes); };
      const commitIndex = () => { c.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic actual source mutation"); return c.git("rev-parse", "HEAD").toString().trim(); };
      const mutation = (name, change, expected, verify = () => {}) => {
        resetSource(); change(); const head = commitIndex(); assert.notEqual(head, sourceHead); bindCandidate(c, head);
        assert.equal(c.proof.tree, c.git("rev-parse", `${head}^{tree}`).toString().trim());
        verify(head);
        assert.throws(() => proof(c), expected, name); pass(`actual committed ${name} refuses after head/tree/native-delta recomputation`);
      };
      mutation("accepted repair edit", () => { const name = "scripts/test-companion-service-contract.mjs"; write(path.join(c.checkout, name), c.git("show", `${sourceHead}:${name}`).toString() + "\n// unauthorized change\n"); c.git("add", "--", name); }, /closeout_accepted_source_changed/);
      mutation("accepted task deletion", () => c.git("update-index", "--force-remove", "scripts/test-companion-ownership-retirement.mjs"), /closeout_accepted_source_changed/);
      mutation("accepted source reverted to base and absent from final diff", () => { const name = "scripts/test-companion-ownership-retirement.mjs";
        write(path.join(c.checkout, name), c.git("show", `${c.base}:${name}`)); c.git("add", "--", name); }, /closeout_accepted_source_changed/,
      head => assert(!c.delta(c.base, head).changed_paths.includes("scripts/test-companion-ownership-retirement.mjs")));
      mutation("accepted added helper deletion", () => { const name = "scripts/fixtures/companion-service-contract-families.mjs";
        assert.equal(c.git("ls-tree", "--name-only", c.base, "--", name).toString(), ""); c.git("update-index", "--force-remove", name); }, /closeout_accepted_source_changed/);
      mutation("unrelated added source", () => { write(path.join(c.checkout, "scripts/synthetic-uncommissioned.mjs"), "// uncommissioned\n"); c.git("add", "--", "scripts/synthetic-uncommissioned.mjs"); }, /closeout_accepted_source_changed/);
      mutation("weaker child deadline", () => { const name = "scripts/run-canonical-test-suite.mjs", old = c.git("show", `${sourceHead}:${name}`).toString();
        const changed = old.replace('...rootNode("scripts/test-companion-service-contract.mjs"),\n      timeoutMs: 30_000,', '...rootNode("scripts/test-companion-service-contract.mjs"),\n      timeoutMs: 60_000,');
        assert.notEqual(changed, old); write(path.join(c.checkout, name), changed); c.git("add", "--", name); }, /closeout_accepted_source_changed/);
      mutation("new policy symlink", () => { rmSync(path.join(c.checkout, ownerPath)); symlinkSync("local-canonical-attempts.mjs", path.join(c.checkout, ownerPath)); c.git("add", "--", ownerPath); }, /closeout_source_type_invalid/);
      mutation("new policy gitlink", () => c.git("update-index", "--cacheinfo", `160000,${c.pins.repair_head},${ownerPath}`), /closeout_source_type_invalid/);
      resetSource(); assert.deepEqual(treeFiles(c.anchor), originalLedger);
    }
    if (group === "authority") {
      for (const [name, change] of [
        ["changed scope body", (r, u) => u.includes("/comments/") ? { ...r, body: r.body + "changed" } : r],
        ["stale scope edit", (r, u) => u.includes("/comments/") ? { ...r, updated_at: time(-500) } : r],
        ["wrong author", (r, u) => u.includes("/comments/") ? { ...r, user: { ...r.user, id: 8 } } : r],
        ["bot author", (r, u) => u.includes("/comments/") ? { ...r, user: { ...r.user, type: "Bot" } } : r],
        ["unprivileged author", (r, u) => u.endsWith("/permission") ? { ...r, permission: "read" } : r],
        ["wrong PR", (r, u) => u.includes("/comments/") ? { ...r, issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/1559" } : r],
        ["unpublished source", (r, u) => u.endsWith("/pulls/1560") ? { ...r, head: { ...r.head, sha: c.base } } : r],
        ["stale accepted main", (r, u) => u.endsWith("/pulls/1560") ? { ...r, base: { ...r.base, sha: c.priorHead } } : r],
        ["Ready transition", (r, u) => u.endsWith("/pulls/1560") ? { ...r, draft: false } : r],
        ["auto merge", (r, u) => u.endsWith("/pulls/1560") ? { ...r, auto_merge: {} } : r],
      ]) { await assert.rejects(authorize(c, validated, change), undefined, name); pass(`refuse ${name}`); }
      assert.throws(() => begin(c, validated, { observations: authorized.observations }), /closeout_authenticated_authority_required/);
      assert.throws(() => begin(c, validated, authorized, { acceptedMain: c.priorHead }));
      assert(!existsSync(edgeFile)); assert.deepEqual(treeFiles(c.anchor), originalLedger); pass("forged capability and stale admission base create no reservation");
    }
    if (group === "admission" || group === "stock") {
      assert.throws(() => begin(c, validated, authorized, { sourceCorrection: null }));
      for (const schema of ["v1", "v2", "v3", "v4", "v5", "v6", "v7"]) {
        assert.throws(() => begin(c, { ...validated, schema: `augnes.local-canonical-source-correction.${schema}` }, authorized));
      }
      assert.throws(() => begin(c, { ...validated, prior_family_id: c.prior.source_correction.prior_family_id, prior_attempt_id: c.prior.source_correction.prior_attempt_id }, authorized));
      pass("all legacy schemas and older-tip packets leave exhausted v7 terminal");
      const completionFile = path.join(c.family, "completion-1.json"), completionBytes = readFileSync(completionFile);
      rmSync(completionFile); assert.throws(() => begin(c, validated, authorized)); write(completionFile, completionBytes); assert(!existsSync(edgeFile));
      const newerAttempt = path.join(c.family, "attempt-2.json"); write(newerAttempt, { ...c.prior, number: 2, attempt_id: "synthetic-newer-ledger-tip" });
      assert.throws(() => begin(c, validated, authorized)); assert(!existsSync(edgeFile)); rmSync(newerAttempt); pass("actual later ledger attempt prevents admission against an older tip");
      const attempt = begin(c, validated, authorized); assert(c.m.validCloseoutAttempt(attempt)); assert.deepEqual(attempt.budget, { initial: 1, recovery: 0 });
      assert.throws(() => begin(c, validated, authorized)); pass("one exclusive new-scope attempt; unfinished duplicate refuses");
      const current = c.m.finalizeReceipt({ ...structuredClone(c.receipt), repository: { ...c.receipt.repository, head_sha: saved.head, tree_sha: saved.tree },
        run: { ...c.receipt.run, id: attempt.attempt_id }, attempt, inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, head: saved.head, tree: saved.tree } } });
      c.m.finishAttempt(attempt, { receiptFingerprint: current.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
      const tip = c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch }); assert(tip.closeout_consumed && tip.companion_timeout_consumed);
      assert.throws(() => begin(c, validated, authorized)); assert.throws(() => begin(c, validated, authorized, { sourceCorrection: null }));
      for (const file of originalLedger) assert.equal(digest(readFileSync(path.join(c.anchor, file.file))), file.sha256);
      pass("settlement consumes the new candidate and preserves every original v7 record");
      const successorRoot = path.join(c.anchor, ".augnes-local-verification/families", attempt.family_id), attemptFile = path.join(successorRoot, "attempt-1.json"), attemptBytes = readFileSync(attemptFile);
      if (group === "admission") {
        rmSync(attemptFile); assert.throws(() => c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch })); assert.throws(() => begin(c, validated, authorized)); write(attemptFile, attemptBytes);
        pass("interrupted reservation stays consumed without an attempt record");
        write(path.join(successorRoot, "correction-successor.json"), { contract: "augnes.local-canonical-successor.v2", kind: "issue_1559_closeout" });
        assert.throws(() => c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch }), /attempt_closeout_candidate_consumed/); rmSync(path.join(successorRoot, "correction-successor.json"));
        pass("new successor chaining cannot reopen the consumed candidate");
        write(path.join(c.checkout, ownerPath), readFileSync(path.join(c.checkout, ownerPath), "utf8") + "\n// synthetic later policy\n"); bindCandidate(c);
        const later = proof(c), laterAuthority = await authorize(c, later); assert.throws(() => begin(c, later, laterAuthority)); pass("another head cannot renew the consumed initial closeout");
        c.authority.grant.id++; c.proof.authorization = { scope_comment_id: c.authority.grant.id, scope_sha256: digest(c.m.closeoutAuthorityObservation(c.authority.grant)) }; save(c);
        await assert.rejects(authorize(c, proof(c)), /closeout_authority_missing/); pass("copied grant identity cannot reset consumption");
      } else {
        const ledger = treeFiles(c.anchor);
        assert(c.m.inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current, closeoutAuthorization: authorized }));
        assert(!c.m.inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current })); assert.deepEqual(treeFiles(c.anchor), ledger);
        const inspected = c.m.inspectReceiptForDecision(current, { currentAttemptRecordsValid: true });
        assert(!inspected.issues.includes("receipt_1559_closeout_invalid")); assert(!inspected.valid_deciding_evidence);
        const exported = c.m.createPrivateReviewExport(current); assert(c.m.inspectPrivateReviewExport(exported).structurally_valid); assert(c.m.validCloseoutAttempt(exported.attempt));
        assert(!JSON.stringify(exported).includes("original-receipt.json")); pass("failed stock stays nondeciding and export roundtrip preserves exact closeout bindings");
        for (const change of [r => r.receipt_version = 3, r => r.attempt.source_correction.schema = "augnes.local-canonical-source-correction.v2", r => r.attempt.source_correction.kind = "source_revision",
          r => delete r.attempt.closeout_authority, r => r.attempt.source_correction.repair.accepted_review.block_sha256 = "0".repeat(64)]) {
          const changed = structuredClone(current); change(changed);
          const rehashedReceipt = c.m.finalizeReceipt(changed);
          assert(c.m.inspectReceiptForDecision(rehashedReceipt, { currentAttemptRecordsValid: true }).issues.includes("receipt_1559_closeout_invalid"));
          assert.throws(() => c.m.createPrivateReviewExport(rehashedReceipt), /review_export_closeout_invalid/);
          const changedExport = structuredClone(exported); change(changedExport); delete changedExport.export_fingerprint;
          changedExport.export_fingerprint = digest(c.m.canonicalSerialize(changedExport));
          assert(!c.m.inspectPrivateReviewExport(changedExport).structurally_valid);
        }
        pass("receipt/export downgrades and missing authority refuse");
        const receiptFile = path.join(c.folder, "successor-receipt.json"), packet = path.join(c.folder, "stock-packet.json"); write(receiptFile, current);
        write(packet, { checkout: c.checkout, anchor: c.anchor, file: c.file, authority: c.authority, controlRoot: c.controlRoot, receiptFile });
        const result = await child([self, "--stock-closeout-fixture", packet], "closeout-1559-cold-stock"); assert.equal(result.exit_code, 0, result.output);
        assert.deepEqual(treeFiles(c.anchor), ledger); pass("fresh-process stock reauthenticates and inspects without reservation or writes");
      }
    }
    if (group === "race") {
      const raceAnchor = path.join(resource.root, "race-anchor"); cpSync(c.anchor, raceAnchor, { recursive: true }); const packets = [];
      for (const index of [1, 2]) {
        const checkout = path.join(resource.root, `race-checkout-${index}`); cpSync(c.checkout, checkout, { recursive: true, filter: file => path.basename(file) !== c.m.CHECKOUT_OWNER_FILE });
        const packet = path.join(resource.root, `race-${index}.json`); write(packet, { checkout, anchor: raceAnchor,
          file: path.join(checkout, ".augnes-local-verification/closeout/proof.json"), authority: c.authority, controlRoot: c.controlRoot, run_id: `synthetic-closeout-race-${index}` }); packets.push(packet);
      }
      const results = await Promise.all(packets.map((packet, i) => child([self, "--claim-closeout-fixture", packet], `closeout-1559-race-${i + 1}`)));
      assert.deepEqual(results.map(x => x.exit_code).sort(), [0, 1], results.map(x => x.output).join("\n"));
      assert.equal(results.filter(x => x.output.includes("exclusive_claim_won")).length, 1); pass("two independently owned disposable checkouts share exactly one exclusive predecessor edge");
    }
  } finally {
    if (c?.owner) c.m.releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: active === 0 });
    if (!active) settleCanonicalTestResourceUse(resource, { cleanup_completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0 });
    assert(cleanupCanonicalTestResources([resource])[0].completed);
  }
  console.log(JSON.stringify({ closeout: checks, group, count: checks.length, synthetic_authority_only: true, cleanup_complete: true }));
}
