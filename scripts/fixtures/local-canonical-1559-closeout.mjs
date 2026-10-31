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
function copyControlSources(target, pins, continuationPins = null, scopePins = null, instructionPins = null) {
  const copied = new Set();
  const copy = name => {
    if (copied.has(name)) return;
    copied.add(name);
    let source = readFileSync(path.join(repository, name), "utf8");
    if (name === ownerPath) {
      const marker = /\/\/ BEGIN CLOSEOUT PINS[\s\S]*?\/\/ END CLOSEOUT PINS/u;
      assert(marker.test(source), "the fixed pin declaration must be explicitly delimited");
      source = source.replace(marker, `// BEGIN CLOSEOUT PINS\nexport const CLOSEOUT_PINS = Object.freeze(${JSON.stringify(pins)});\n// END CLOSEOUT PINS`);
      if (continuationPins) {
        const continuationMarker = /\/\/ BEGIN CLOSEOUT CONTINUATION PINS[\s\S]*?\/\/ END CLOSEOUT CONTINUATION PINS/u;
        assert(continuationMarker.test(source), "continuation controls replace only its delimited fixed pin data");
        source = source.replace(continuationMarker, `// BEGIN CLOSEOUT CONTINUATION PINS\nexport const CLOSEOUT_CONTINUATION_PINS = Object.freeze(${JSON.stringify(continuationPins)});\n// END CLOSEOUT CONTINUATION PINS`);
      }
      if (scopePins) {
        const scopeMarker = /\/\/ BEGIN CLOSEOUT SCOPE CORRECTION PINS[\s\S]*?\/\/ END CLOSEOUT SCOPE CORRECTION PINS/u;
        assert(scopeMarker.test(source), "scope-correction controls replace only fixed pin data");
        source = source.replace(scopeMarker, `// BEGIN CLOSEOUT SCOPE CORRECTION PINS\nexport const CLOSEOUT_SCOPE_CORRECTION_PINS = Object.freeze(${JSON.stringify(scopePins)});\n// END CLOSEOUT SCOPE CORRECTION PINS`);
      }
      if (instructionPins) {
        const instructionMarker = /\/\/ BEGIN CLOSEOUT INSTRUCTION PINS[\s\S]*?\/\/ END CLOSEOUT INSTRUCTION PINS/u;
        assert(instructionMarker.test(source), "instruction-input controls replace only delimited fixed pin data");
        source = source.replace(instructionMarker, `// BEGIN CLOSEOUT INSTRUCTION PINS\nexport const CLOSEOUT_INSTRUCTION_PINS = Object.freeze(${JSON.stringify(instructionPins)});\n// END CLOSEOUT INSTRUCTION PINS`);
      }
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
  const [route, attempts, receipt, exported, transport, fixture, companion, ownership, browser, inputs] = await Promise.all([
    load("local-canonical-1559-closeout.mjs"), load("local-canonical-attempts.mjs"), load("local-canonical-receipt.mjs"),
    load("local-canonical-review-export.mjs"), load("github-main-branch-transport.mjs"), load("fixtures/local-canonical-receipt-v3.mjs"),
    load("local-canonical-companion-timeout-succession.mjs"), load("local-canonical-checkout-ownership.mjs"), load("local-canonical-browser-replacement.mjs"),
    load("local-canonical-inputs.mjs"),
  ]);
  return { ...route, ...attempts, ...receipt, ...exported, ...transport, ...fixture, ...companion, ...ownership, ...browser, ...inputs };
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
const authorize = (c, p, change) => c.m.authorizeCloseout(p, { transport: authorizationTransport(c, change),
  ...(c.m.isCloseoutInstructionReplacement?.(p) ? { frozenInputs: c.frozenInputs } : {}) });
const begin = (c, p, authorization, extra = {}) => c.m.beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner,
  branch: p.branch, head: p.head, tree: p.tree, acceptedMain: p.base, runId: "synthetic-closeout-successor",
  contractFingerprint: c.m.isCloseoutInstructionReplacement?.(p) ? c.frozenInputs?.fingerprint : "6".repeat(64),
  sourceCorrection: p, closeoutAuthorization: authorization,
  ...(c.m.isCloseoutInstructionReplacement?.(p) ? { closeoutInputs: c.frozenInputs } : {}), ...extra });

// Continuation and instruction controls seed their explicitly synthetic prior
// history. Initial-route controls still exercise that route's real admission.
// Each current profile's production proof reader revalidates the full history;
// its own admission, exclusive claims and cold stock keep the real owners.
async function fixtureHistoricalAttempt(c, runId, contractFingerprint = "6".repeat(64)) {
  if (!c.syntheticHistory) {
    const p = proof(c), authority = await authorize(c, p);
    return begin(c, p, authority, { runId, contractFingerprint });
  }
  const p = { ...structuredClone(c.proof), local_relative_path: path.relative(c.checkout, c.file).split(path.sep).join("/") };
  const contract = c.m.ATTEMPT_CONTRACT;
  const familyId = digest([contract, "hynk-studio/augnes", c.branch, "verified_source_correction", p.prior_attempt_id, p.head, p.tree]);
  const record = { contract, family_id: familyId, attempt_id: runId, number: 1, branch: c.branch, head: p.head, tree: p.tree,
    contract_fingerprint: contractFingerprint, started_at: time(0), prior_attempt_id: null, prior_receipt_fingerprint: null,
    recovery: null, source_correction: p, closeout_authority: { closeout_scope: c.m.closeoutAuthorityObservation(c.authority.grant) }, budget: { initial: 1, recovery: 0 } };
  assert(c.m.validCloseoutAttempt(record), "seeded historical record satisfies the unchanged production semantic validator");
  const families = path.join(c.anchor, ".augnes-local-verification/families"), target = path.join(families, familyId);
  mkdirSync(target, { recursive: true, mode: 0o700 });
  writeFileSync(path.join(families, p.prior_family_id, "correction-successor.json"), JSON.stringify({ contract: "augnes.local-canonical-successor.v2",
    kind: p.kind, family_id: familyId, head: p.head, tree: p.tree, proof_fingerprint: digest(p) }) + "\n", { flag: "wx", mode: 0o600 });
  writeFileSync(path.join(target, "attempt-1.json"), JSON.stringify(record) + "\n", { flag: "wx", mode: 0o600 });
  return record;
}

function settleFixtureHistory(c, attempt, options) {
  if (!c.syntheticHistory) return c.m.finishAttempt(attempt, options);
  const completion = { contract: c.m.ATTEMPT_CONTRACT, attempt_id: attempt.attempt_id, receipt_fingerprint: options.receiptFingerprint,
    disposition: options.disposition, cleanup_complete: options.cleanupComplete, infrastructure_code: null, finished_at: time(0) };
  writeFileSync(path.join(c.anchor, ".augnes-local-verification/families", attempt.family_id, "completion-1.json"), JSON.stringify(completion) + "\n", { flag: "wx", mode: 0o600 });
}

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

async function make(root, { policyOwnerSource = null } = {}) {
  const original = await controlModules(repository), pins = structuredClone(original.CLOSEOUT_PINS);
  const checkout = path.join(root, "checkout"), anchor = path.join(root, "anchor"), folder = path.join(checkout, ".augnes-local-verification/closeout");
  mkdirSync(checkout); mkdirSync(anchor); mkdirSync(folder, { recursive: true });
  const branch = "codex/synthetic-1559-closeout", base = pins.accepted_base, priorHead = pins.prior_head, priorTree = pins.prior_tree;
  const git = (...args) => execFileSync("git", args, { cwd: checkout, timeout: 4000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  git("init", "-b", branch);
  const objectPath = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-path", "objects"], { cwd: repository, encoding: "utf8", timeout: 4000 }).trim();
  write(path.join(checkout, ".git/objects/info/alternates"), objectPath + "\n");
  git("update-ref", `refs/heads/${branch}`, pins.repair_head); git("read-tree", pins.repair_head);
  for (const name of POLICY_PATHS) write(path.join(checkout, name), name === ownerPath && policyOwnerSource !== null ? policyOwnerSource : readFileSync(path.join(repository, name)));
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
else if (process.argv[2] === "--run-closeout-continuation-fixtures") await closeoutContinuationControls(process.argv[3]);
else if (process.argv[2] === "--run-closeout-scope-correction-fixtures") await closeoutScopeCorrectionControls(process.argv[3]);
else if (process.argv[2] === "--run-closeout-instruction-fixtures") await closeoutInstructionControls(process.argv[3]);

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

// These controls traverse the actual initial-closeout edge before constructing
// the separately bounded continuation. The old controls above retain their
// original inputs and assertions; no synthetic claim is task execution evidence.
function bindContinuationCandidate(c, head) {
  c.proof.head = head; c.proof.tree = c.git("rev-parse", `${head}^{tree}`).toString().trim();
  c.proof.final_source = c.artifact("continuation-final-source.json", {
    schema: "augnes.local-canonical-closeout-continuation-final-source.v1", basis: "implementation_owner_not_independent_review",
    base: c.base, head, tree: c.proof.tree, predecessor_head: c.prior.head, predecessor_tree: c.prior.tree,
    correction_source_hashes: c.proof.correction.source_hashes,
    deltas: { predecessor: c.delta(c.prior.head, head), initial_accepted: c.delta(c.pins.repair_head, head), main: c.delta(c.base, head) },
  });
  c.proof.source_scope = c.m.inspectCloseoutContinuationSourceScope(c.checkout, c.proof);
  c.authority.pr.head.sha = head; c.authority.pr.base.sha = c.base; save(c);
}

function continuationOriginalUnitLog() {
  return Array.from({ length: 17 }, (_, index) => `[canonical:unit] child_result label="synthetic preceding ${index}" duration_ms=1 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`).join("") +
    '[canonical:unit] child_start label="source-linked operational continuation candidate contract" timeout_ms=45000\n' +
    '[canonical:unit] child_result label="source-linked operational continuation candidate contract" duration_ms=45107 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n';
}

function continuationRetainedEvidence(c, { prior, completion, head, sourceHashes }) {
  const evidence = {}, put = (name, value, extension = "json") => evidence[name] = c.artifact(`synthetic-continuation-${name}.${extension}`, value);
  const snapshot = { schema: "augnes.private-development-snapshot.v1", nondeciding: true, synthetic_control_only: true,
    archive_head: prior.head, archive_tree: prior.tree, capture_stability: { stable: true },
    files: Object.entries(sourceHashes).map(([name, sha256]) => ({ path: name, present: true, sha256 })) };
  for (const name of ["source_manifest", "plain_snapshot", "protocol_snapshot", "fresh_session_snapshot", "typecheck_snapshot"]) put(name, snapshot);
  put("observer", "// SYNTHETIC observer bytes, never executed\n", "mjs");
  put("diagnostic_instrumenter", "// SYNTHETIC prior insertion metadata owner, never executed\n", "mjs");
  put("corrected_instrumenter", "// SYNTHETIC corrected insertion metadata owner, never executed\n", "mjs");
  const started = new Date(Date.parse(completion.finished_at) + 1).toISOString(), finished = new Date(Date.parse(completion.finished_at) + 2).toISOString();
  for (const [name, bound, entry, snapshotKey] of [
    ["diagnostic", 45000, "scripts/test-operational-continuation.ts", null],
    ["corrected_observed", 45000, "scripts/test-operational-continuation.ts", "source_manifest"],
    ["plain", 45000, "scripts/test-operational-continuation.ts", "plain_snapshot"],
    ["protocol", 300000, "scripts/vnext-protocol-conformance.ts", "protocol_snapshot"],
    ["fresh_session", 30000, "scripts/test-vnext-fresh-session-semantic-application.ts", "fresh_session_snapshot"],
    ["typecheck", 300000, "typecheck", "typecheck_snapshot"],
  ]) {
    const label = `synthetic-${name}`, command = { nondeciding: true, synthetic_control_only: true, head: prior.head, tree: prior.tree,
      timeout_ms: bound, require_natural_exit: false, command: ["synthetic-never-executed", entry], started_at: started,
      ...(snapshotKey ? { source_snapshot_sha256: evidence[snapshotKey].sha256 } : {}),
      ...(["diagnostic", "corrected_observed"].includes(name) ? { observer_sha256: evidence.observer.sha256,
        instrumenter_sha256: evidence[name === "diagnostic" ? "diagnostic_instrumenter" : "corrected_instrumenter"].sha256 } : {}) };
    put(`${name}_command`, command);
    put(`${name}_settlement`, { nondeciding: true, synthetic_control_only: true, prepared_at: started, finished_at: finished,
      result: { label, exit_code: 0, signal: null, timed_out: false, cancelled: false, spawn_error_code: null, exit_observed: true,
        streams_closed: true, cleanup_started: true, cleanup_completed: true, remaining_owned_processes: 0, termination_reason: "natural_exit", duration_ms: 1 },
      failure: null, root_absent: true, cleanup: [{ completed: true, failure_count: 0, failures: [] }],
      source_after: { changed_snapshot_files: [], checkout_changes_are_context_only: true } });
    put(`${name}_log`, `[canonical:synthetic] child_start label=${JSON.stringify(label)} timeout_ms=${bound}\n` +
      `[canonical:synthetic] child_result label=${JSON.stringify(label)} duration_ms=1 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n` +
      (name === "protocol" ? JSON.stringify({ prepared_relation_differential_case_count: 74, prepared_proposal_snapshot_isolation_checked: true,
        prepared_decisions_revalidated_on_every_call: true, caller_validation_overrides_refused: true }) + "\n" : ""), "log");
  }
  const paths = ["scripts/test-operational-continuation.ts", "lib/vnext/episode-delta-proposal.ts", "lib/vnext/review-decision.ts",
    "fixtures/vnext/research/operational-friction-proposal-v0-1.ts", "lib/vnext/operational-friction-proposal.ts", "lib/vnext/operational-context-selection.ts"];
  for (const [name, revision, instrumenter] of [["diagnostic", prior.head, "diagnostic_instrumenter"], ["corrected", head, "corrected_instrumenter"]]) {
    put(`${name}_instrumentation`, { nondeciding: true, synthetic_control_only: true, preload_sha256: evidence.observer.sha256,
      instrumenter_sha256: evidence[instrumenter].sha256,
      records: [...paths, ...(name === "corrected" ? ["lib/vnext/runtime/operator-pilot-review-material.ts"] : [])].map((file, index) => {
        const original = c.git("show", `${revision}:${file}`).toString(), marker = `/*__OP_OBSERVER:${index}:begin__*/\n/* synthetic marker only */\n/*__OP_OBSERVER:${index}:end__*/`;
        return { path: file, original_sha256: digest(original), original_bytes: Buffer.byteLength(original), observed_sha256: digest(marker + original),
          observed_bytes: Buffer.byteLength(marker + original), insertions: [{ position: 0, text: marker }], removing_markers_recovers_original_bytes: true };
      }) });
  }
  const common = { buildOperationalFrictionDisposableReviewFixtureV01: 2, materializeOperationalFrictionProposalV01: 100,
    assertOperationalFrictionMaterialMatchesSourcesV01: 41, materializeSourceLinkedOperationalContinuationV01: 36 };
  for (const [name, counters] of [["diagnostic_observations", { ...common, validateEpisodeDeltaProposalV01: 6177, validateReviewDecisionAgainstEpisodeDeltaProposalV01: 4989 }],
    ["corrected_observations", { ...common, validateEpisodeDeltaProposalV01: 1819, validateReviewDecisionProposalRelationV01: 4989, readProposalHistoryV01: 34,
      createReviewDecisionProposalRelationValidatorV01: 34, validateReviewDecisionProvenanceWithProposalRelationV01: 2195, recordVNextOperatorPilotReviewDecisionV01: 8 }]]) {
    put(name, JSON.stringify({ observer: "operational-continuation-private-v1", synthetic_control_only: true, sequence: 1,
      aggregate_timings_inclusive_not_additive: true, cumulative_wall_ms: 1, stage: "process-exit", exit_code: 0,
      hot: Object.fromEntries(Object.entries(counters).map(([key, calls]) => [key, { calls, completed: calls, active: 0 }])) }) + "\n", "jsonl");
  }
  put("analysis", { nondeciding: true, synthetic_control_only: true, historical_timeout_cause: "UNKNOWN", development_source_not_final_commit: true, prior_head: prior.head,
    proposal_validation: { before: { calls: 6177 }, after: { calls: 1819 } }, relation_validation: { before: { calls: 4989 }, after: { calls: 4989 } } });
  put("static_comparison", { nondeciding: true, synthetic_control_only: true, prior_head: prior.head, replacements: 1, exact_body_equal_after_single_callback_substitution: true });
  assert.deepEqual(Object.keys(evidence).sort(), [...c.m.CLOSEOUT_CONTINUATION_EVIDENCE_KEYS].sort()); return evidence;
}

async function continuationOriginalRefusal(c, name, mutate, code) {
  const p = structuredClone(c.proof), original = Object.fromEntries(Object.entries(p.originals).map(([key, ref]) =>
    [key, key.endsWith("log") ? readFileSync(path.join(c.folder, ref.artifact), "utf8") : read(path.join(c.folder, ref.artifact))]));
  mutate(original);
  original.receipt.phases[5].log.bytes = Buffer.byteLength(original.unit_log);
  original.receipt = c.m.finalizeReceipt(original.receipt);
  const fingerprint = original.receipt.integrity.content_fingerprint;
  original.completion.receipt_fingerprint = fingerprint; original.stock.content_fingerprint = fingerprint; original.stock_log = JSON.stringify(original.stock);
  p.prior_receipt_fingerprint = fingerprint;
  for (const [key, value] of Object.entries(original)) p.originals[key] = c.artifact(p.originals[key].artifact, value);
  const pins = { ...c.continuationPins, prior_receipt_fingerprint: fingerprint,
    originals: Object.fromEntries(Object.entries(p.originals).map(([key, ref]) => [key, ref.sha256])) };
  const root = path.join(path.dirname(c.controlRoot), `semantic-original-${name}`); copyControlSources(root, c.pins, pins);
  const m = await import(pathToFileURL(path.join(root, ownerPath)).href);
  assert.throws(() => m.readCloseoutEvidence(c.file, p, c.checkout), error => error.code === code, name);
}

async function makeContinuation(root, { syntheticHistory = false, ...options } = {}) {
  const c = await make(root, options), initialProof = structuredClone(c.proof); c.syntheticHistory = syntheticHistory;
  const initialAttempt = await fixtureHistoricalAttempt(c, "synthetic-initial-closeout-before-continuation");
  assert(c.m.validCloseoutAttempt(initialAttempt));
  const oldFamily = c.family, initialFamily = path.join(c.anchor, ".augnes-local-verification/families", initialAttempt.family_id);
  const unitLog = continuationOriginalUnitLog(), relativeLog = `.augnes-local-verification/logs/${initialAttempt.attempt_id}/unit.log`;
  write(path.join(c.checkout, relativeLog), unitLog);
  const receipt = c.m.finalizeReceipt({ ...structuredClone(c.receipt),
    repository: { ...c.receipt.repository, head_sha: initialAttempt.head, tree_sha: initialAttempt.tree },
    run: { ...c.receipt.run, id: initialAttempt.attempt_id }, attempt: initialAttempt,
    inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, head: initialAttempt.head, tree: initialAttempt.tree } },
    phases: c.receipt.phases.map(row => row.id === "unit" ? { ...row, log: { relative_path: relativeLog, bytes: Buffer.byteLength(unitLog), truncated: false } } : row),
  });
  settleFixtureHistory(c, initialAttempt, { receiptFingerprint: receipt.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
  const completion = read(path.join(initialFamily, "completion-1.json"));
  const stock = { content_fingerprint: receipt.integrity.content_fingerprint, valid_deciding_evidence: false,
    issues: Array.from({ length: 15 }, (_, index) => `synthetic_continuation_original_issue_${index + 1}`) };
  // Ledger bytes include the normal owner's terminating newline. Retain those
  // exact bytes so admission exercises its raw immutable-ledger digest check.
  const originals = Object.fromEntries(Object.entries({ receipt, attempt: readFileSync(path.join(initialFamily, "attempt-1.json")),
    completion: readFileSync(path.join(initialFamily, "completion-1.json")), edge: readFileSync(path.join(oldFamily, "correction-successor.json")),
    unit_log: unitLog, stock, stock_log: JSON.stringify(stock) })
    .map(([key, value]) => [key, c.artifact(`continuation-original-${key}.${key.endsWith("log") ? "log" : "json"}`, value)]));
  const initialRef = c.artifact("initial-proof.json", initialProof);
  const continuationPins = structuredClone(c.m.CLOSEOUT_CONTINUATION_PINS);
  const sourceHashes = {};
  for (const name of Object.keys(continuationPins.source_hashes).sort()) {
    const bytes = readFileSync(path.join(repository, name)); sourceHashes[name] = digest(bytes); write(path.join(c.checkout, name), bytes); c.git("add", "--", name);
  }
  c.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic exact three-source continuation correction");
  const head = c.git("rev-parse", "HEAD").toString().trim(), tree = c.git("rev-parse", `${head}^{tree}`).toString().trim();
  const evidence = continuationRetainedEvidence(c, { prior: initialAttempt, completion, head, tree, sourceHashes });
  Object.assign(continuationPins, { prior_head: initialAttempt.head, prior_tree: initialAttempt.tree, prior_family_id: initialAttempt.family_id,
    prior_attempt_id: initialAttempt.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint, completed_at: completion.finished_at,
    initial_proof: initialRef.sha256, originals: Object.fromEntries(Object.entries(originals).map(([name, ref]) => [name, ref.sha256])),
    source_hashes: sourceHashes, evidence: Object.fromEntries(Object.entries(evidence).map(([name, ref]) => [name, ref.sha256])) });
  c.m.releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: true }); c.owner = null;
  c.controlRoot = path.join(root, "continuation-control-source"); copyControlSources(c.controlRoot, c.pins, continuationPins); c.m = await controlModules(c.controlRoot);
  c.owner = c.m.acquireCheckoutVerificationOwnership({ repositoryRoot: c.checkout });
  Object.assign(c, { initialProof, prior: initialAttempt, priorHead: initialAttempt.head, priorTree: initialAttempt.tree, family: initialFamily, receipt,
    file: path.join(c.folder, "continuation-proof.json"), continuationPins });
  c.proof = { schema: c.m.CLOSEOUT_CONTINUATION_SCHEMA, kind: c.m.CLOSEOUT_CONTINUATION_KIND, pull_request: 1560,
    branch: c.branch, base: c.base, head, tree, prior_family_id: initialAttempt.family_id, prior_number: 1,
    prior_attempt_id: initialAttempt.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    originals, initial_proof: initialRef, correction: { source_hashes: sourceHashes, evidence }, source_scope: null, final_source: null,
    authorization: structuredClone(initialProof.authorization), budget: { initial: 1, recovery: 0 } };
  bindContinuationCandidate(c, head); return c;
}

export async function closeoutContinuationControls(group = "evidence") {
  assert(["evidence", "source", "authority", "admission", "stock", "race"].includes(group));
  const resource = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(resource);
  const checks = [], pass = name => { checks.push(name); console.log(`continuation control PASS: ${name}`); };
  let c, active = 0;
  const child = async (args, controlId) => {
    active++; let output = "";
    const result = await runCanonicalChild({ suite: "1559-closeout-continuation-fixture", label: "synthetic closeout continuation control",
      command: process.execPath, args, cwd: resource.root, env: buildCanonicalChildEnvironment({ temporaryRoot: resource.root }), timeoutMs: 4000,
      stdout: { write: chunk => output = (output + chunk).slice(-8000) }, stderr: { write: chunk => output = (output + chunk).slice(-8000) }, log() {} });
    if (result.cleanup_completed && result.exit_observed && result.streams_closed && result.remaining_owned_processes === 0) active--;
    console.log("AUGNES_REVIEW_CHILD_RESULT " + JSON.stringify(projectReviewChildResult(result, { controlId })));
    assertReviewChildLifecycle(result, { controlId }); return { ...result, output };
  };
  try {
    c = await makeContinuation(resource.root, { syntheticHistory: true });
    const saved = structuredClone(c.proof), savedAuthority = structuredClone(c.authority), validated = proof(c), authorized = await authorize(c, validated);
    const files = new Map(readdirSync(c.folder).map(name => [name, readFileSync(path.join(c.folder, name))])), ledger = treeFiles(c.anchor);
    // Only a control's mutated files need restoration. Rewriting the complete
    // initial proof and retained history on every refusal added unrelated I/O.
    const touched = new Set(), artifact = c.artifact;
    c.artifact = (name, value) => { touched.add(name); return artifact(name, value); };
    const reset = () => {
      for (const name of touched) {
        if (files.has(name)) write(path.join(c.folder, name), files.get(name));
        else rmSync(path.join(c.folder, name), { force: true });
      }
      touched.clear(); c.proof = structuredClone(saved); c.authority = structuredClone(savedAuthority); save(c);
    };
    const edgeFile = path.join(c.family, "correction-successor.json");
    const before = c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch });
    assert(before.closeout_consumed && before.companion_timeout_consumed && !before.closeout_continuation_consumed);
    assert(!existsSync(edgeFile)); assert.deepEqual(treeFiles(c.anchor), ledger);
    pass("full synthetic v7 to settled initial-closeout lineage validates without reserving continuation");
    if (group === "evidence") {
      for (const [name, mutate] of [
        ["initial schema downgrade", p => p.schema = c.m.CLOSEOUT_SCHEMA], ["initial kind downgrade", p => p.kind = "issue_1559_closeout"],
        ["wrong predecessor", p => p.prior_attempt_id = "another-attempt"], ["old v7 predecessor", p => p.prior_family_id = c.initialProof.prior_family_id],
        ["initial proof omitted", p => delete p.initial_proof], ["initial proof digest", p => p.initial_proof.sha256 = "0".repeat(64)],
        ["second initial allowance", p => p.budget.initial = 2], ["recovery allowance", p => p.budget.recovery = 1],
        ["correction path omitted", p => delete p.correction.source_hashes[Object.keys(p.correction.source_hashes)[0]]],
        ["extra correction path", p => p.correction.source_hashes["scripts/uncommissioned.mjs"] = "1".repeat(64)],
        ["accepted scope changed", p => p.source_scope.accepted_head = p.base],
      ]) { reset(); mutate(c.proof); save(c); assert.throws(() => proof(c), undefined, name); pass(`refuse ${name}`); }
      for (const [key, ref] of Object.entries(saved.originals)) {
        reset(); touched.add(ref.artifact); rmSync(path.join(c.folder, ref.artifact)); assert.throws(() => proof(c), undefined, key); pass(`missing original ${key} refuses`);
      }
      for (const [key, ref] of Object.entries(saved.correction.evidence)) {
        reset(); touched.add(ref.artifact); write(path.join(c.folder, ref.artifact), "SYNTHETIC tampered retained evidence\n");
        assert.throws(() => proof(c), undefined, key); pass(`tampered ${key} refuses`);
      }
      reset(); touched.add(saved.correction.evidence.plain_settlement.artifact); rmSync(path.join(c.folder, saved.correction.evidence.plain_settlement.artifact)); assert.throws(() => proof(c));
      pass("missing focused settlement refuses");
      for (const [name, mutate, code] of [
        ["seeded-initial-authority", x => { x.attempt.closeout_authority.closeout_scope.id++; x.receipt.attempt = structuredClone(x.attempt); }, "closeout_continuation_original_binding_invalid"],
        ["wrong-phase", x => x.receipt.phases[5].id = "integration", "closeout_continuation_original_binding_invalid"],
        ["extra-phase-failure", x => x.receipt.phases[4].status = "failure", "closeout_continuation_original_binding_invalid"],
        ["cleanup-incomplete", x => x.receipt.cleanup.completed = false, "closeout_continuation_original_binding_invalid"],
        ["unsettled-outer-unit", x => x.receipt.phases[5].timed_out = true, "closeout_continuation_original_unit_invalid"],
        ["wrong-child", x => x.unit_log = x.unit_log.replaceAll("source-linked operational continuation candidate contract", "another child"), "closeout_continuation_original_nested_timeout_invalid"],
        ["extra-child-failure", x => x.unit_log = x.unit_log.replace("exit_code=0 signal=null timed_out=false", "exit_code=1 signal=null timed_out=false"), "closeout_continuation_original_nested_timeout_invalid"],
      ]) {
        reset(); await continuationOriginalRefusal(c, name, mutate, code); pass(`self-consistent synthetic ${name}: ${code}`);
      }
      reset(); assert.deepEqual(treeFiles(c.anchor), ledger);
    }
    if (group === "source") {
      const sourceHead = saved.head;
      const restoreSource = () => { reset(); c.git("update-ref", `refs/heads/${c.branch}`, sourceHead); c.git("read-tree", sourceHead); };
      const mutation = (name, mutate, code, maskedScope = null) => {
        restoreSource(); mutate(); c.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", `synthetic ${name}`);
        const head = c.git("rev-parse", "HEAD").toString().trim(); assert.notEqual(head, sourceHead); bindContinuationCandidate(c, head);
        if (maskedScope) { c.proof.source_scope = structuredClone(maskedScope); save(c); }
        assert.throws(() => proof(c), error => error.code === code, name); pass(`${name}: ${code}`);
      };
      mutation("accepted added helper deletion", () => c.git("update-index", "--force-remove", "scripts/fixtures/companion-service-contract-families.mjs"), "closeout_continuation_retained_source_changed");
      mutation("accepted task reverted to base", () => { const name = "scripts/test-companion-ownership-retirement.mjs";
        write(path.join(c.checkout, name), c.git("show", `${c.base}:${name}`)); c.git("add", "--", name); }, "closeout_continuation_retained_source_changed");
      mutation("source outside three correction owners", () => { const name = "scripts/uncommissioned-continuation.mjs";
        write(path.join(c.checkout, name), "// SYNTHETIC uncommissioned source\n"); c.git("add", "--", name); }, "closeout_continuation_retained_source_changed");
      mutation("changed correction bytes", () => { const name = "lib/vnext/review-decision.ts";
        write(path.join(c.checkout, name), c.git("show", `${sourceHead}:${name}`).toString() + "\n// SYNTHETIC altered correction\n"); c.git("add", "--", name); }, "closeout_continuation_correction_invalid");
      mutation("weaker complete-child bound", () => { const name = "scripts/run-canonical-test-suite.mjs", source = c.git("show", `${sourceHead}:${name}`).toString();
        const changed = source.replace('...rootNode("scripts/test-operational-continuation.ts"),\n      timeoutMs: 45_000,', '...rootNode("scripts/test-operational-continuation.ts"),\n      timeoutMs: 60_000,');
        assert.notEqual(changed, source); write(path.join(c.checkout, name), changed); c.git("add", "--", name); }, "closeout_continuation_retained_source_changed");
      // A valid-looking declaration is only a cheap refusal screen. The actual
      // committed deletion must still fail the later independent Git checks.
      mutation("masked valid declaration over actual helper deletion", () => c.git("update-index", "--force-remove", "scripts/fixtures/companion-service-contract-families.mjs"),
        "closeout_continuation_retained_source_changed", saved.source_scope);
      restoreSource(); assert.deepEqual(treeFiles(c.anchor), ledger);
    }
    if (group === "authority") {
      for (const [name, change] of [
        ["changed scope body", (r, u) => u.includes("/comments/") ? { ...r, body: r.body + " changed" } : r],
        ["stale scope edit", (r, u) => u.includes("/comments/") ? { ...r, updated_at: time(-500) } : r],
        ["unprivileged author", (r, u) => u.endsWith("/permission") ? { ...r, permission: "read" } : r],
        ["unpublished candidate", (r, u) => u.endsWith("/pulls/1560") ? { ...r, head: { ...r.head, sha: c.prior.head } } : r],
        ["stale current main", (r, u) => u.endsWith("/pulls/1560") ? { ...r, base: { ...r.base, sha: c.prior.head } } : r],
        ["Ready transition", (r, u) => u.endsWith("/pulls/1560") ? { ...r, draft: false } : r],
        ["auto merge", (r, u) => u.endsWith("/pulls/1560") ? { ...r, auto_merge: {} } : r],
      ]) { await assert.rejects(authorize(c, validated, change), undefined, name); pass(`refuse ${name}`); }
      assert.throws(() => begin(c, validated, { observations: authorized.observations }));
      assert.throws(() => begin(c, validated, authorized, { acceptedMain: c.prior.head }));
      c.authority.grant.id++; c.proof.authorization = { scope_comment_id: c.authority.grant.id, scope_sha256: digest(c.m.closeoutAuthorityObservation(c.authority.grant)) }; save(c);
      await assert.rejects(authorize(c, c.proof)); pass("copied grant and forged capability cannot renew authority");
      assert(!existsSync(edgeFile)); assert.deepEqual(treeFiles(c.anchor), ledger);
    }
    if (group === "admission" || group === "stock") {
      assert.throws(() => begin(c, validated, authorized, { sourceCorrection: null }));
      for (const schema of [c.m.CLOSEOUT_SCHEMA, ...[1, 2, 3, 4, 5, 6, 7].map(x => `augnes.local-canonical-source-correction.v${x}`)])
        assert.throws(() => begin(c, { ...validated, schema }, authorized));
      assert.throws(() => begin(c, { ...validated, prior_family_id: c.initialProof.prior_family_id, prior_attempt_id: c.initialProof.prior_attempt_id }, authorized));
      assert(!existsSync(edgeFile)); pass("old v7 tip and all legacy route relabels cannot acquire continuation");
      const newer = path.join(c.family, "attempt-2.json"); write(newer, { ...c.prior, number: 2, attempt_id: "synthetic-later-tip" });
      assert.throws(() => begin(c, validated, authorized)); rmSync(newer); assert(!existsSync(edgeFile));
      const attempt = begin(c, validated, authorized); assert(c.m.validCloseoutAttempt(attempt)); assert.deepEqual(attempt.budget, { initial: 1, recovery: 0 });
      assert.throws(() => begin(c, validated, authorized)); pass("exclusive continuation reservation rejects an unfinished repeat");
      const current = c.m.finalizeReceipt({ ...structuredClone(c.receipt), repository: { ...c.receipt.repository, head_sha: saved.head, tree_sha: saved.tree },
        run: { ...c.receipt.run, id: attempt.attempt_id }, attempt, inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, head: saved.head, tree: saved.tree } } });
      c.m.finishAttempt(attempt, { receiptFingerprint: current.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
      const tip = c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch });
      assert(tip.companion_timeout_consumed && tip.closeout_consumed && tip.closeout_continuation_consumed);
      assert.throws(() => begin(c, validated, authorized)); assert.throws(() => begin(c, validated, authorized, { sourceCorrection: null }));
      for (const row of ledger) assert.equal(digest(readFileSync(path.join(c.anchor, row.file))), row.sha256);
      pass("terminal continuation preserves all v7 and initial-closeout records");
      const successor = path.join(c.anchor, ".augnes-local-verification/families", attempt.family_id), attemptFile = path.join(successor, "attempt-1.json");
      if (group === "admission") {
        const bytes = readFileSync(attemptFile); rmSync(attemptFile);
        assert.throws(() => c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch })); assert.throws(() => begin(c, validated, authorized)); write(attemptFile, bytes);
        pass("interrupted reservation cannot become a fresh attempt");
        write(path.join(successor, "correction-successor.json"), { contract: "augnes.local-canonical-successor.v2", kind: c.m.CLOSEOUT_CONTINUATION_KIND });
        assert.throws(() => c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch })); rmSync(path.join(successor, "correction-successor.json"));
        pass("terminal continuation refuses a further successor chain");
        write(path.join(c.checkout, ownerPath), c.git("show", `${saved.head}:${ownerPath}`).toString() + "\n// SYNTHETIC later policy-only head\n");
        c.git("add", "--", ownerPath); c.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic later candidate after consumed continuation");
        bindContinuationCandidate(c, c.git("rev-parse", "HEAD").toString().trim());
        const later = proof(c), laterAuthority = await authorize(c, later); assert.throws(() => begin(c, later, laterAuthority));
        pass("a later policy-only candidate cannot renew the consumed continuation");
      } else {
        const after = treeFiles(c.anchor);
        assert(c.m.inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current, closeoutAuthorization: authorized }));
        assert(!c.m.inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current }));
        const inspected = c.m.inspectReceiptForDecision(current, { currentAttemptRecordsValid: true });
        assert(!inspected.issues.includes("receipt_1559_closeout_invalid")); assert(!inspected.valid_deciding_evidence);
        const exported = c.m.createPrivateReviewExport(current); assert(c.m.inspectPrivateReviewExport(exported).structurally_valid); assert(c.m.validCloseoutAttempt(exported.attempt));
        for (const mutate of [r => r.receipt_version = 3, r => r.attempt.source_correction.schema = c.m.CLOSEOUT_SCHEMA,
          r => r.attempt.source_correction.kind = "issue_1559_closeout", r => delete r.attempt.closeout_authority,
          r => delete r.attempt.source_correction.correction.source_hashes[Object.keys(r.attempt.source_correction.correction.source_hashes)[0]]]) {
          const altered = structuredClone(current); mutate(altered); const finalized = c.m.finalizeReceipt(altered);
          assert(c.m.inspectReceiptForDecision(finalized, { currentAttemptRecordsValid: true }).issues.includes("receipt_1559_closeout_invalid"));
          assert.throws(() => c.m.createPrivateReviewExport(finalized));
          const alteredExport = structuredClone(exported); mutate(alteredExport); delete alteredExport.export_fingerprint;
          alteredExport.export_fingerprint = digest(c.m.canonicalSerialize(alteredExport)); assert(!c.m.inspectPrivateReviewExport(alteredExport).structurally_valid);
        }
        const receiptFile = path.join(c.folder, "continuation-receipt.json"), packet = path.join(c.folder, "continuation-stock-packet.json"); write(receiptFile, current);
        write(packet, { checkout: c.checkout, anchor: c.anchor, file: c.file, authority: c.authority, controlRoot: c.controlRoot, receiptFile });
        const result = await child([self, "--stock-closeout-fixture", packet], "closeout-continuation-cold-stock"); assert.equal(result.exit_code, 0, result.output);
        assert.deepEqual(treeFiles(c.anchor), after); pass("fresh stock rereads evidence and authority without reservation; failed receipt remains nondeciding");
        write(path.join(c.folder, saved.correction.evidence.plain_log.artifact), "SYNTHETIC late evidence tamper\n");
        const tampered = await child([self, "--stock-closeout-fixture", packet], "closeout-continuation-tampered-stock");
        assert.equal(tampered.exit_code, 1, tampered.output); assert.match(tampered.output, /closeout_evidence_changed/u);
        assert.deepEqual(treeFiles(c.anchor), after); pass("a separate fresh stock process rejects late evidence mutation without ledger writes");
      }
    }
    if (group === "race") {
      const raceAnchor = path.join(resource.root, "race-anchor"); cpSync(c.anchor, raceAnchor, { recursive: true }); const packets = [];
      for (const index of [1, 2]) {
        const checkout = path.join(resource.root, `race-checkout-${index}`); cpSync(c.checkout, checkout, { recursive: true, filter: file => path.basename(file) !== c.m.CHECKOUT_OWNER_FILE });
        const packet = path.join(resource.root, `race-${index}.json`); write(packet, { checkout, anchor: raceAnchor,
          file: path.join(checkout, ".augnes-local-verification/closeout/continuation-proof.json"), authority: c.authority, controlRoot: c.controlRoot, run_id: `synthetic-continuation-race-${index}` }); packets.push(packet);
      }
      const results = await Promise.all(packets.map((packet, index) => child([self, "--claim-closeout-fixture", packet], `closeout-continuation-race-${index + 1}`)));
      assert.deepEqual(results.map(x => x.exit_code).sort(), [0, 1], results.map(x => x.output).join("\n"));
      assert.equal(results.filter(x => x.output.includes("exclusive_claim_won")).length, 1); pass("concurrent independently owned checkouts share one continuation edge");
    }
  } finally {
    if (c?.owner) c.m.releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: active === 0 });
    if (!active) settleCanonicalTestResourceUse(resource, { cleanup_completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0 });
    assert(cleanupCanonicalTestResources([resource])[0].completed);
  }
  console.log(JSON.stringify({ closeout_continuation: checks, group, count: checks.length, synthetic_authority_only: true, cleanup_complete: true }));
}

function scopeCorrectionAuthorityLog() {
  return Array.from({ length: 8 }, (_, index) => `[canonical:authority] child_result label="synthetic preceding ${index}" duration_ms=1 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`).join("") +
    '[canonical:1559-closeout-continuation-controls] child_result label="evidence" duration_ms=2506 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n' +
    '[canonical:1559-closeout-continuation-controls] child_start label="source" timeout_ms=6000\n' +
    '[canonical:1559-closeout-continuation-controls] child_result label="source" duration_ms=6076 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n' +
    '[canonical:authority] child_result label="local Canonical executor identity and scheduling contract" duration_ms=9993 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n';
}

function scopeCorrectionRetained(c, prior, completion, before, after, nativeDelta) {
  const bytes = new Map(), put = (name, value) => bytes.set(name, Buffer.from(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)));
  put("mechanism-before.mjs", before); put("mechanism-after.mjs", after);
  put("fixture-before.mjs", "// SYNTHETIC fixture before, never executed\n"); put("fixture-after.mjs", "// SYNTHETIC fixture after, never executed\n");
  put("observe-git-cost.mjs", "// SYNTHETIC observation owner, never executed\n");
  const manifest = { schema: "augnes.private-source-scope-precheck-observation.v1", nondeciding: true, synthetic_control_only: true,
    prior_head: prior.head, prior_tree: prior.tree, historical_timeout_cause: "UNKNOWN", original_blocked_operation: "UNKNOWN" };
  const common = ["accepted added helper deletion", "accepted task reverted to base", "source outside three correction owners", "changed correction bytes", "weaker complete-child bound"];
  for (const [index, sample] of ["before", "after"].entries()) {
    const source = sample === "before" ? before : after, started = new Date(Date.parse(completion.finished_at) + 1 + index * 2).toISOString();
    const result = { label: sample, exit_code: 0, signal: null, timed_out: false, cancelled: false, spawn_error_code: null, exit_observed: true,
      streams_closed: true, cleanup_started: true, cleanup_completed: true, remaining_owned_processes: 0, termination_reason: "natural_exit", duration_ms: 1 };
    put(`${sample}/command.json`, { schema: "augnes.private-source-scope-probe-command.v1", nondeciding: true, synthetic_control_only: true, sample,
      prior_head: prior.head, prior_tree: prior.tree, timeout_ms: 6000, require_natural_exit: true, source_sha256: digest(source),
      fixture_sha256: digest(bytes.get(`fixture-${sample}.mjs`)), observer_sha256: digest(bytes.get("observe-git-cost.mjs")),
      command: ["synthetic-never-executed", "--run-closeout-continuation-fixtures", "source"], started_at: started });
    put(`${sample}/settlement.json`, { schema: "augnes.private-source-scope-probe-settlement.v1", nondeciding: true, synthetic_control_only: true, sample,
      finished_at: new Date(Date.parse(started) + 1).toISOString(), result, failure: null, root_absent: true,
      cleanup: [{ completed: true, failure_count: 0, failures: [] }] });
    const stages = ["full synthetic v7 to settled initial-closeout lineage validates without reserving continuation",
      ...common.map(name => `${name}: ${name === "changed correction bytes" ? "closeout_continuation_correction_invalid" : "closeout_continuation_retained_source_changed"}`),
      ...(sample === "after" ? ["masked valid declaration over actual helper deletion: closeout_continuation_retained_source_changed"] : [])];
    let calls = 100;
    put(`${sample}/observations.jsonl`, stages.map((stage, i) => {
      if (i) calls += sample === "before" || i === stages.length - 1 && sample === "after" ? 64 : 20;
      return JSON.stringify({ schema: "augnes.private-source-control-git-cost.v1", synthetic_control_only: true, sample, sequence: i + 1,
        stage, cumulative_wall_ms: i + 1, git: { calls, inclusive_ms: i + 1 } });
    }).join("\n") + "\n");
    put(`${sample}/output.log`, stages.map(stage => `continuation control PASS: ${stage}\n`).join(""));
    manifest[sample] = { command: `${sample}/command.json`, settlement: `${sample}/settlement.json`, observations: `${sample}/observations.jsonl`,
      log: `${sample}/output.log`, source_sha256: digest(source), result };
  }
  manifest.files = [...bytes].map(([name, value]) => ({ path: name, bytes: value.length, sha256: digest(value) }));
  const retained = [...bytes].map(([name, value], index) => ({ path: name, ...c.artifact(`scope-retained-${index}.${path.extname(name).slice(1)}`, value) }));
  return { mechanism_before: c.artifact("scope-mechanism-before.mjs", before), mechanism_after: c.artifact("scope-mechanism-after.mjs", after),
    native_delta: c.artifact("scope-mechanism.diff", nativeDelta),
    observations: c.artifact("scope-observations.json", manifest), retained };
}

function bindScopeCorrectionCandidate(c, head) {
  c.proof.head = head; c.proof.tree = c.git("rev-parse", `${head}^{tree}`).toString().trim();
  c.proof.final_source = c.artifact("scope-final-source.json", { schema: "augnes.local-canonical-closeout-scope-correction-final-source.v1",
    basis: "implementation_owner_not_independent_review", base: c.base, head, tree: c.proof.tree, predecessor_head: c.prior.head, predecessor_tree: c.prior.tree,
    deltas: { predecessor: c.delta(c.prior.head, head), first_closeout: c.delta(c.continuationPins.prior_head, head), main: c.delta(c.base, head) } });
  c.proof.source_scope = c.m.inspectCloseoutScopeCorrectionSourceScope(c.checkout, c.proof); c.authority.pr.head.sha = head; save(c);
}

async function makeScopeCorrection(root, { instructionPredecessor = false } = {}) {
  const source = readFileSync(path.join(repository, ownerPath), "utf8"), original = await controlModules(repository);
  // The mechanism predecessor is the public Git owner before this integration
  // existed. Removing one line from today's owner would also retain the new
  // validator's own literal needle and would not be the one-line mechanism.
  const beforeSource = execFileSync("git", ["show", `${original.CLOSEOUT_SCOPE_CORRECTION_PINS.prior_head}:${ownerPath}`],
    { cwd: repository, encoding: "utf8", timeout: 4000, maxBuffer: 2 * 1024 * 1024 });
  const needle = "  const original = continuationOriginalEvidence(folder, p, repositoryRoot), git = gitAt(repositoryRoot), source = json(closeoutArtifact(folder, p.final_source));";
  assert.equal(beforeSource.split(needle).length, 2, "one exact predecessor reader insertion point");
  const mechanismAfter = beforeSource.replace(needle, "  validateCloseoutContinuationSourceScope(p.source_scope);\n" + needle);
  const c = await makeContinuation(root, { policyOwnerSource: beforeSource, syntheticHistory: instructionPredecessor });
  const predecessorProof = structuredClone(c.proof);
  const prior = await fixtureHistoricalAttempt(c, "synthetic-operational-continuation-before-scope-correction");
  assert(c.m.validCloseoutAttempt(prior));
  const oldFamily = c.family, family = path.join(c.anchor, ".augnes-local-verification/families", prior.family_id);
  const authorityLog = scopeCorrectionAuthorityLog(), relativeLog = `.augnes-local-verification/logs/${prior.attempt_id}/authority.log`;
  write(path.join(c.checkout, relativeLog), authorityLog);
  const receipt = c.m.finalizeReceipt({ ...structuredClone(c.receipt), repository: { ...c.receipt.repository, head_sha: prior.head, tree_sha: prior.tree },
    run: { ...c.receipt.run, id: prior.attempt_id }, attempt: prior,
    inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, head: prior.head, tree: prior.tree } },
    phases: c.receipt.phases.map((row, index) => ({ ...row, status: index < 6 ? "pass" : index === 6 ? "failure" : "not_run",
      exit_status: index < 6 ? 0 : index === 6 ? 1 : null, failure_code: index === 6 ? "phase_failed" : null, timed_out: false,
      environment_fingerprint: index <= 6 ? "b".repeat(64) : null,
      cleanup: { completed: true, remaining_owned_processes: 0, exit_observed: index <= 6, streams_closed: index <= 6, termination_reason: index <= 6 ? "natural_exit" : null },
      ...(index === 6 ? { duration_ms: 59896, log: { relative_path: relativeLog, bytes: Buffer.byteLength(authorityLog), truncated: false } } : {}) })) });
  settleFixtureHistory(c, prior, { receiptFingerprint: receipt.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
  const completion = read(path.join(family, "completion-1.json")), stock = { content_fingerprint: receipt.integrity.content_fingerprint, valid_deciding_evidence: false,
    issues: Array.from({ length: 14 }, (_, index) => `synthetic_scope_original_issue_${index + 1}`) };
  const originals = Object.fromEntries(Object.entries({ receipt, attempt: readFileSync(path.join(family, "attempt-1.json")),
    completion: readFileSync(path.join(family, "completion-1.json")), edge: readFileSync(path.join(oldFamily, "correction-successor.json")),
    authority_log: authorityLog, stock, stock_log: JSON.stringify(stock) }).map(([key, value]) => [key, c.artifact(`scope-original-${key}.${key.endsWith("log") ? "log" : "json"}`, value)]));
  const predecessorRef = c.artifact("scope-predecessor-proof.json", predecessorProof), before = c.git("show", `${prior.head}:${ownerPath}`);
  assert.equal(before.toString(), beforeSource); write(path.join(c.checkout, ownerPath), mechanismAfter);
  const nativeDelta = c.git("diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", prior.head, "--", ownerPath);
  write(path.join(c.checkout, ownerPath), source); c.git("add", "--", ownerPath);
  if (instructionPredecessor) {
    const receiptOwner = "scripts/test-local-canonical-receipt.mjs";
    write(path.join(c.checkout, receiptOwner), readFileSync(path.join(repository, receiptOwner))); c.git("add", "--", receiptOwner);
  }
  c.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic one-line scope precheck correction");
  const head = c.git("rev-parse", "HEAD").toString().trim(), tree = c.git("rev-parse", `${head}^{tree}`).toString().trim();
  const correction = scopeCorrectionRetained(c, prior, completion, before, Buffer.from(mechanismAfter), nativeDelta);
  const pins = { ...structuredClone(c.m.CLOSEOUT_SCOPE_CORRECTION_PINS), prior_head: prior.head, prior_tree: prior.tree,
    prior_family_id: prior.family_id, prior_attempt_id: prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    completed_at: completion.finished_at, predecessor_proof: predecessorRef.sha256,
    originals: Object.fromEntries(Object.entries(originals).map(([name, ref]) => [name, ref.sha256])),
    correction: Object.fromEntries(Object.entries(correction).filter(([name]) => name !== "retained").map(([name, ref]) => [name, ref.sha256])),
    retained: Object.fromEntries(correction.retained.map(ref => [ref.path, ref.sha256])) };
  c.m.releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: true }); c.owner = null;
  c.controlRoot = path.join(root, "scope-control-source"); copyControlSources(c.controlRoot, c.pins, c.continuationPins, pins); c.m = await controlModules(c.controlRoot);
  c.owner = c.m.acquireCheckoutVerificationOwnership({ repositoryRoot: c.checkout });
  Object.assign(c, { predecessorProof, prior, family, receipt, scopePins: pins, file: path.join(c.folder, "scope-proof.json") });
  c.proof = { schema: c.m.CLOSEOUT_CONTINUATION_SCHEMA, kind: c.m.CLOSEOUT_SCOPE_CORRECTION_KIND, pull_request: 1560, branch: c.branch, base: c.base, head, tree,
    prior_family_id: prior.family_id, prior_number: 1, prior_attempt_id: prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    originals, predecessor_proof: predecessorRef, correction, source_scope: null, final_source: null,
    authorization: structuredClone(predecessorProof.authorization), budget: { initial: 1, recovery: 0 } };
  bindScopeCorrectionCandidate(c, head); return c;
}

export async function closeoutScopeCorrectionControls(group = "evidence") {
  assert(["evidence", "admission", "stock"].includes(group));
  const resource = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(resource);
  const checks = [], pass = name => { checks.push(name); console.log(`scope correction control PASS: ${name}`); }; let c, active = 0;
  const child = async (args, controlId) => {
    active++; let output = "";
    const result = await runCanonicalChild({ suite: "1559-closeout-scope-fixture", label: controlId, command: process.execPath, args, cwd: resource.root,
      env: buildCanonicalChildEnvironment({ temporaryRoot: resource.root }), timeoutMs: 4000,
      stdout: { write: chunk => output = (output + chunk).slice(-8000) }, stderr: { write: chunk => output = (output + chunk).slice(-8000) }, log() {} });
    if (result.cleanup_completed && result.exit_observed && result.streams_closed && result.remaining_owned_processes === 0) active--;
    console.log("AUGNES_REVIEW_CHILD_RESULT " + JSON.stringify(projectReviewChildResult(result, { controlId }))); assertReviewChildLifecycle(result, { controlId });
    return { ...result, output };
  };
  try {
    c = await makeScopeCorrection(resource.root); const saved = structuredClone(c.proof), validated = proof(c), authorized = await authorize(c, validated), ledger = treeFiles(c.anchor);
    const files = new Map(readdirSync(c.folder).map(name => [name, readFileSync(path.join(c.folder, name))]));
    const restore = (...names) => { for (const name of names) write(path.join(c.folder, name), files.get(name)); c.proof = structuredClone(saved); save(c); };
    const tip = c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch });
    assert(tip.companion_timeout_consumed && tip.closeout_consumed && tip.closeout_continuation_consumed && !tip.closeout_scope_correction_consumed);
    pass("actual synthetic v7, initial closeout and operational continuation lead to one distinct scope-correction proof");
    if (group === "evidence") {
      for (const [name, mutate] of [["old kind relabel", p => p.kind = c.m.CLOSEOUT_CONTINUATION_KIND], ["wrong final head", p => p.head = p.base],
        ["wrong original receipt", p => p.originals.receipt.sha256 = "0".repeat(64)], ["missing predecessor", p => delete p.predecessor_proof],
        ["forged accepted scope", p => p.source_scope.accepted_head = p.base], ["fabricated review field", p => p.review = { id: 1 }],
        ["extra allowance", p => p.budget.initial = 2], ["retained observation omitted", p => p.correction.retained.pop()]]) {
        restore(); mutate(c.proof); save(c); assert.throws(() => proof(c), undefined, name); pass(`refuse ${name}`);
      }
      restore(); const removedOwner = "scripts/test-local-canonical-receipt.mjs", scope = c.proof.source_scope;
      assert(!scope.accepted_task_paths.includes(removedOwner)); assert(!scope.policy_delta_paths.includes(removedOwner));
      scope.candidate_delta_paths.push(removedOwner); scope.candidate_delta_paths.sort();
      scope.policy_delta_paths.push(removedOwner); scope.policy_delta_paths.sort();
      scope.candidate_policy.push({ path: removedOwner, candidate: { present: false } }); scope.candidate_policy.sort((a, b) => a.path.localeCompare(b.path));
      save(c); assert.throws(() => proof(c), error => error.code === "closeout_scope_correction_policy_removed");
      pass("self-consistent declared deletion of a policy owner outside accepted32 refuses: closeout_scope_correction_policy_removed");
      restore(); for (const ref of [saved.originals.authority_log, saved.correction.mechanism_after, saved.correction.retained[0]]) {
        write(path.join(c.folder, ref.artifact), "SYNTHETIC tampered evidence\n"); assert.throws(() => proof(c)); restore(ref.artifact);
      }
      rmSync(path.join(c.folder, saved.originals.completion.artifact)); assert.throws(() => proof(c)); restore(saved.originals.completion.artifact);
      pass("missing original and changed mechanism/raw observations refuse before admission");
      await assert.rejects(authorize(c, validated, (record, url) => url.includes("/comments/") ? { ...record, updated_at: time(-500) } : record));
      await assert.rejects(authorize(c, validated, (record, url) => url.endsWith("/permission") ? { ...record, permission: "read" } : record));
      assert.throws(() => c.m.assertCloseoutAuthorization(validated, { observations: authorized.observations }, read(path.join(c.family, "completion-1.json"))));
      pass("stale authenticated scope, removed permission and forged capabilities refuse"); assert.deepEqual(treeFiles(c.anchor), ledger);
    } else {
      assert.throws(() => begin(c, c.predecessorProof, authorized));
      let attempt, current;
      if (group === "admission") {
        const packets = [];
        for (const index of [1, 2]) {
          const checkout = path.join(resource.root, `scope-race-checkout-${index}`); cpSync(c.checkout, checkout, { recursive: true, filter: file => path.basename(file) !== c.m.CHECKOUT_OWNER_FILE });
          const packet = path.join(resource.root, `scope-race-${index}.json`); write(packet, { checkout, anchor: c.anchor,
            file: path.join(checkout, ".augnes-local-verification/closeout/scope-proof.json"), authority: c.authority, controlRoot: c.controlRoot, run_id: `synthetic-scope-race-${index}` }); packets.push(packet);
        }
        const results = await Promise.all(packets.map((packet, index) => child([self, "--claim-closeout-fixture", packet], `scope-race-${index + 1}`)));
        assert.deepEqual(results.map(x => x.exit_code).sort(), [0, 1], results.map(x => x.output).join("\n")); pass("two checkouts share one exclusive correction edge");
        const winner = c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch });
        attempt = read(path.join(c.anchor, ".augnes-local-verification/families", winner.family_id, "attempt-1.json"));
      } else {
        attempt = begin(c, validated, authorized); assert.throws(() => begin(c, validated, authorized));
        current = c.m.finalizeReceipt({ ...structuredClone(c.receipt), repository: { ...c.receipt.repository, head_sha: saved.head, tree_sha: saved.tree },
          run: { ...c.receipt.run, id: attempt.attempt_id }, attempt, inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, head: saved.head, tree: saved.tree } } });
        c.m.finishAttempt(attempt, { receiptFingerprint: current.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
      }
      assert(c.m.validCloseoutAttempt(attempt)); assert.deepEqual(attempt.budget, { initial: 1, recovery: 0 });
      assert(c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch }).closeout_scope_correction_consumed);
      assert.throws(() => begin(c, validated, authorized)); pass("older tip, repeated and settled terminal attempts cannot reset the finite allowance");
      for (const row of ledger) assert.equal(digest(readFileSync(path.join(c.anchor, row.file))), row.sha256);
      if (group === "admission") {
        const family = path.join(c.anchor, ".augnes-local-verification/families", attempt.family_id), file = path.join(family, "attempt-1.json"), bytes = readFileSync(file);
        rmSync(file); assert.throws(() => c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch })); assert.throws(() => begin(c, validated, authorized)); write(file, bytes);
        write(path.join(family, "correction-successor.json"), { contract: "augnes.local-canonical-successor.v2", kind: c.m.CLOSEOUT_SCOPE_CORRECTION_KIND });
        assert.throws(() => c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch })); rmSync(path.join(family, "correction-successor.json"));
        pass("interrupted reservation and further successor chain stay closed");
      } else {
        const exported = c.m.createPrivateReviewExport(current); assert(c.m.inspectPrivateReviewExport(exported).structurally_valid); assert(c.m.validCloseoutAttempt(exported.attempt));
        assert(!c.m.inspectReceiptForDecision(current, { currentAttemptRecordsValid: true }).valid_deciding_evidence);
        for (const change of [r => r.receipt_version = 3, r => r.attempt.source_correction.kind = c.m.CLOSEOUT_CONTINUATION_KIND, r => delete r.attempt.closeout_authority,
          r => r.attempt.source_correction.correction.retained = [], r => r.attempt.source_correction.correction.retained[0].sha256 = "0".repeat(64)]) {
          const altered = structuredClone(current); change(altered); const value = c.m.finalizeReceipt(altered);
          if (value.receipt_version === 4) assert(!c.m.validCloseoutAttempt(value.attempt));
          assert(c.m.inspectReceiptForDecision(value, { currentAttemptRecordsValid: true }).issues.includes("receipt_1559_closeout_invalid")); assert.throws(() => c.m.createPrivateReviewExport(value));
          const alteredExport = structuredClone(exported); change(alteredExport); delete alteredExport.export_fingerprint;
          alteredExport.export_fingerprint = digest(c.m.canonicalSerialize(alteredExport)); assert(!c.m.inspectPrivateReviewExport(alteredExport).structurally_valid);
        }
        const after = treeFiles(c.anchor), receiptFile = path.join(c.folder, "scope-receipt.json"), packet = path.join(c.folder, "scope-stock-packet.json");
        write(receiptFile, current); write(packet, { checkout: c.checkout, anchor: c.anchor, file: c.file, authority: c.authority, controlRoot: c.controlRoot, receiptFile });
        const cold = await child([self, "--stock-closeout-fixture", packet], "scope-cold-stock"); assert.equal(cold.exit_code, 0, cold.output);
        assert.deepEqual(treeFiles(c.anchor), after); pass("fresh stock rereads the whole chain without reservation; export preserves bindings and refuses downgrades");
      }
    }
  } finally {
    if (c?.owner) c.m.releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: active === 0 });
    if (!active) settleCanonicalTestResourceUse(resource, { cleanup_completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0 });
    assert(cleanupCanonicalTestResources([resource])[0].completed);
  }
  console.log(JSON.stringify({ closeout_scope_correction: checks, group, count: checks.length, synthetic_authority_only: true, cleanup_complete: true }));
}

function bindInstructionCandidate(c, head) {
  c.proof.head = head; c.proof.tree = c.git("rev-parse", `${head}^{tree}`).toString().trim();
  c.proof.final_source = c.artifact("instruction-final-source.json", { schema: "augnes.local-canonical-closeout-instruction-final-source.v1",
    basis: "implementation_owner_not_independent_review", base: c.base, head, tree: c.proof.tree, predecessor_head: c.prior.head, predecessor_tree: c.prior.tree,
    deltas: { predecessor: c.delta(c.prior.head, head), first_closeout: c.delta(c.continuationPins.prior_head, head), main: c.delta(c.base, head) } });
  c.proof.source_scope = c.m.inspectCloseoutInstructionSourceScope(c.checkout, c.proof);
  c.authority.pr.head.sha = head; save(c);
}

async function makeInstructionReplacement(root) {
  const c = await makeScopeCorrection(root, { instructionPredecessor: true }), predecessorProof = structuredClone(c.proof);
  const instructionFile = path.join(root, "synthetic-user-instructions.md");
  const before = "SYNTHETIC global safety rules: preserve every other owner.\n### Augnes Space reporting exception\nRead existing reporting pages.\n### A substantive task ends with a complete report in its own session\nExecution, credentials and merge authority remain bounded.\n";
  const after = before.replace("Read existing reporting pages.", "Read and organize pages within the specifically authorized reporting Space.");
  write(instructionFile, before);
  const freeze = (head, tree) => c.m.freezeInputContract({ pathKind: "isolated-model-free-v1", binding: { ...c.inputs.binding, head, tree },
    resources: c.inputs.resources.map(row => ({ id: row.id, classification: row.classification,
      file: row.id === "user-instructions" ? instructionFile : path.join(root, `absent-${row.id}`) })) });
  const priorInput = freeze(c.proof.head, c.proof.tree), initialInputs = priorInput.snapshot();
  const prior = await fixtureHistoricalAttempt(c, "synthetic-scope-before-instruction-change", initialInputs.fingerprint);
  const oldFamily = c.family, family = path.join(c.anchor, ".augnes-local-verification/families", prior.family_id);
  write(instructionFile, after); assert.equal(priorInput.check({ force: true })?.disposition, "safety_violation");
  const inputs = priorInput.snapshot(), fault = inputs.first_fault, resource = inputs.resources.find(row => row.id === "user-instructions");
  assert.equal(inputs.events.length, 1); assert.equal(inputs.secondary_faults.length, 0);
  const unitLog = Array.from({ length: 51 }, (_, i) => `[canonical:unit] child_start label="synthetic preceding ${i}" timeout_ms=1000\n` +
    `[canonical:unit] child_result label="synthetic preceding ${i}" duration_ms=1 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`).join("") +
    '[canonical:unit] child_start label="machine-owned Companion service and public lifecycle contract" timeout_ms=30000\n';
  const relativeLog = `.augnes-local-verification/logs/${prior.attempt_id}/unit.log`; write(path.join(c.checkout, relativeLog), unitLog);
  const receipt = c.m.finalizeReceipt({ ...structuredClone(c.receipt), repository: { ...c.receipt.repository, head_sha: prior.head, tree_sha: prior.tree },
    run: { ...c.receipt.run, id: prior.attempt_id }, attempt: prior, inputs,
    outcome: { disposition: "safety_violation", safety: "blocked", validity: "invalidated", first_fault: fault },
    phases: c.receipt.phases.map((row, index) => {
      const { log, ...rest } = row;
      return { ...rest, status: index < 5 ? "pass" : index === 5 ? "failure" : "not_run", exit_status: index < 5 ? 0 : null,
        failure_code: index === 5 ? "phase_cancelled" : null, timed_out: false, environment_fingerprint: index <= 5 ? "b".repeat(64) : null,
        cleanup: { completed: true, remaining_owned_processes: 0, exit_observed: index <= 5, streams_closed: index <= 5,
          termination_reason: index < 5 ? "natural_exit" : index === 5 ? "operator_cancelled" : null },
        ...(index === 5 ? { duration_ms: 360925, log: { relative_path: relativeLog, bytes: Buffer.byteLength(unitLog), truncated: false } } : {}) };
    }) });
  settleFixtureHistory(c, prior, { receiptFingerprint: receipt.integrity.content_fingerprint, disposition: "safety_violation", cleanupComplete: true });
  const completion = read(path.join(family, "completion-1.json")), stock = { content_fingerprint: receipt.integrity.content_fingerprint,
    valid_deciding_evidence: false, issues: Array.from({ length: 17 }, (_, i) => `synthetic_instruction_original_issue_${i + 1}`) };
  const originals = Object.fromEntries(Object.entries({ receipt, attempt: readFileSync(path.join(family, "attempt-1.json")),
    completion: readFileSync(path.join(family, "completion-1.json")), edge: readFileSync(path.join(oldFamily, "correction-successor.json")),
    unit_log: unitLog, stock, stock_log: JSON.stringify(stock) }).map(([name, value]) => [name, c.artifact(`instruction-original-${name}.${name.endsWith("log") ? "log" : "json"}`, value)]));
  const predecessorRef = c.artifact("instruction-predecessor-proof.json", predecessorProof);
  const instruction = { before: c.artifact("instructions-before.md", before), after: c.artifact("instructions-after.md", after),
    delta: c.artifact("instructions.diff", "--- recorded-global-before\n+++ recorded-global-after\n@@ synthetic reporting-only change @@\n-Read existing reporting pages.\n+Read and organize pages within the specifically authorized reporting Space.\n"),
    provenance: c.artifact("instruction-provenance.json", { source_report_id: "SYNTHETIC-REPORT", source_report_revision: "r1", source_page: "synthetic-never-published",
      source_reference: "synthetic-private-record", source_bytes: 1, source_sha256: digest("SYNTHETIC"),
      records: { global_before: { path: "synthetic-before", byte_size: Buffer.byteLength(before), sha256: digest(before) },
        global_after: { path: "synthetic-after", byte_size: Buffer.byteLength(after), sha256: digest(after) } },
      matches_actual_safety_event: true, outside_reporting_exception_byte_identical: true, reported_author: "Codex", os_writer_independently_verified: false }) };
  const grant = { ...c.authority.grant, id: 204, body: "SYNTHETIC later explicit instruction-input replacement; never real authority.",
    created_at: new Date(Date.parse(completion.finished_at) + 1).toISOString() }; grant.updated_at = grant.created_at;
  const observation = c.m.closeoutAuthorityObservation(grant), instructionPins = { ...structuredClone(c.m.CLOSEOUT_INSTRUCTION_PINS), prior_head: prior.head, prior_tree: prior.tree,
    prior_family_id: prior.family_id, prior_attempt_id: prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    completed_at: completion.finished_at, fault_observed_at: fault.observed_at, predecessor_proof: predecessorRef.sha256,
    before_bytes: Buffer.byteLength(before), after_bytes: Buffer.byteLength(after), instruction_location_fingerprint: resource.location_fingerprint,
    instruction_identity_fingerprint: digest(Object.fromEntries(["device", "uid", "gid", "mode", "inode", "links"].map(key => [key, resource.before.metadata[key]]))),
    originals: Object.fromEntries(Object.entries(originals).map(([name, ref]) => [name, ref.sha256])),
    instruction: Object.fromEntries(Object.entries(instruction).map(([name, ref]) => [name, ref.sha256])),
    scope: Object.fromEntries(Object.entries(observation).filter(([name]) => !["role", "commit_id"].includes(name))) };
  // A new actual policy-only Git delta, separate from the unchanged accepted33.
  write(path.join(c.checkout, "scripts/test-local-canonical-receipt.mjs"), readFileSync(path.join(repository, "scripts/test-local-canonical-receipt.mjs"), "utf8") + "\n// synthetic instruction successor candidate\n");
  c.git("add", "--", "scripts/test-local-canonical-receipt.mjs"); c.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic prospective instruction-input binding");
  const head = c.git("rev-parse", "HEAD").toString().trim();
  c.m.releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: true }); c.owner = null;
  c.controlRoot = path.join(root, "instruction-control-source"); copyControlSources(c.controlRoot, c.pins, c.continuationPins, c.scopePins, instructionPins); c.m = await controlModules(c.controlRoot);
  c.owner = c.m.acquireCheckoutVerificationOwnership({ repositoryRoot: c.checkout });
  Object.assign(c, { prior, family, receipt, predecessorProof, instructionPins, instructionFile, file: path.join(c.folder, "instruction-proof.json") }); c.authority.grant = grant;
  c.proof = { schema: c.m.CLOSEOUT_CONTINUATION_SCHEMA, kind: c.m.CLOSEOUT_INSTRUCTION_KIND, pull_request: 1560, branch: c.branch, base: c.base,
    head, tree: null, prior_family_id: prior.family_id, prior_number: 1, prior_attempt_id: prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    originals, predecessor_proof: predecessorRef, instruction, source_scope: null, final_source: null,
    authorization: { scope_comment_id: grant.id, scope_sha256: digest(observation) }, budget: { initial: 1, recovery: 0 } };
  bindInstructionCandidate(c, head); c.inputContract = freeze(c.proof.head, c.proof.tree); c.frozenInputs = c.inputContract.snapshot(); return c;
}

async function instructionSemanticRefusal(c, name, mutate, code) {
  const p = structuredClone(c.proof), pins = structuredClone(c.instructionPins);
  const original = Object.fromEntries(Object.entries(p.originals).map(([key, ref]) => [key, key.endsWith("log") ? readFileSync(path.join(c.folder, ref.artifact), "utf8") : read(path.join(c.folder, ref.artifact))]));
  const instruction = Object.fromEntries(Object.entries(p.instruction).map(([key, ref]) => [key, key === "provenance" ? read(path.join(c.folder, ref.artifact)) : readFileSync(path.join(c.folder, ref.artifact), "utf8")]));
  mutate({ original, instruction, pins }); original.receipt.phases[5].log.bytes = Buffer.byteLength(original.unit_log);
  original.receipt = c.m.finalizeReceipt(original.receipt); const fingerprint = original.receipt.integrity.content_fingerprint;
  original.completion.receipt_fingerprint = fingerprint; original.stock.content_fingerprint = fingerprint; original.stock_log = JSON.stringify(original.stock);
  p.prior_receipt_fingerprint = pins.prior_receipt_fingerprint = fingerprint;
  for (const [key, value] of Object.entries(original)) p.originals[key] = c.artifact(p.originals[key].artifact, value);
  for (const [key, value] of Object.entries(instruction)) p.instruction[key] = c.artifact(p.instruction[key].artifact, value);
  pins.originals = Object.fromEntries(Object.entries(p.originals).map(([key, ref]) => [key, ref.sha256]));
  pins.instruction = Object.fromEntries(Object.entries(p.instruction).map(([key, ref]) => [key, ref.sha256]));
  const source = readFileSync(path.join(c.controlRoot, ownerPath), "utf8").replace(/\/\/ BEGIN CLOSEOUT INSTRUCTION PINS[\s\S]*?\/\/ END CLOSEOUT INSTRUCTION PINS/u,
    `// BEGIN CLOSEOUT INSTRUCTION PINS\nexport const CLOSEOUT_INSTRUCTION_PINS = Object.freeze(${JSON.stringify(pins)});\n// END CLOSEOUT INSTRUCTION PINS`);
  const file = path.join(c.controlRoot, "scripts", `instruction-semantic-${name}.mjs`); write(file, source);
  const module = await import(pathToFileURL(file).href); assert.throws(() => module.readCloseoutEvidence(c.file, p, c.checkout), error => error.code === code, name);
}

export async function closeoutInstructionControls(group = "evidence") {
  assert(["evidence", "admission", "stock"].includes(group));
  const resource = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(resource);
  const checks = [], pass = name => { checks.push(name); console.log(`instruction replacement control PASS: ${name}`); }; let c, active = 0;
  const child = async (args, controlId) => {
    active++; let output = "";
    const result = await runCanonicalChild({ suite: "1559-closeout-instruction-fixture", label: controlId, command: process.execPath, args, cwd: resource.root,
      env: buildCanonicalChildEnvironment({ temporaryRoot: resource.root }), timeoutMs: 4000,
      stdout: { write: chunk => output = (output + chunk).slice(-8000) }, stderr: { write: chunk => output = (output + chunk).slice(-8000) }, log() {} });
    if (result.cleanup_completed && result.exit_observed && result.streams_closed && result.remaining_owned_processes === 0) active--;
    console.log("AUGNES_REVIEW_CHILD_RESULT " + JSON.stringify(projectReviewChildResult(result, { controlId }))); assertReviewChildLifecycle(result, { controlId }); return { ...result, output };
  };
  try {
    c = await makeInstructionReplacement(resource.root); const saved = structuredClone(c.proof), validated = proof(c), authorized = await authorize(c, validated), ledger = treeFiles(c.anchor);
    const files = new Map(readdirSync(c.folder).map(name => [name, readFileSync(path.join(c.folder, name))]));
    const restore = () => { for (const [name, bytes] of files) { const file = path.join(c.folder, name); if (!existsSync(file) || !readFileSync(file).equals(bytes)) write(file, bytes); } c.proof = structuredClone(saved); save(c); };
    const tip = c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch }); assert(tip.closeout_scope_correction_consumed && !tip.closeout_instruction_consumed);
    assert.equal(c.m.assertCloseoutInstructionInputs(validated, c.frozenInputs), c.frozenInputs.fingerprint);
    pass("complete immutable predecessor plus real frozen instruction event admits only the distinct prospective profile");
    if (group === "evidence") {
      for (const [name, mutate] of [["missing instruction", p => delete p.instruction], ["changed instruction hash", p => p.instruction.after.sha256 = "0".repeat(64)],
        ["old profile fallback", p => p.kind = c.m.CLOSEOUT_SCOPE_CORRECTION_KIND], ["wrong predecessor", p => p.prior_attempt_id = "older"],
        ["recovery allowance", p => p.budget.recovery = 1], ["forged accepted source", p => p.source_scope.accepted_head = p.base]]) {
        restore(); mutate(c.proof); save(c); assert.throws(() => proof(c)); pass(`refuse ${name}`);
      }
      restore(); rmSync(path.join(c.folder, saved.instruction.before.artifact)); assert.throws(() => proof(c)); restore();
      for (const [name, mutate, code] of [
        ["wrong-fault", ({ original }) => { original.receipt.inputs.first_fault.resource = "credentials"; original.receipt.outcome.first_fault.resource = "credentials"; }, "closeout_instruction_original_fault_invalid"],
        ["secondary-fault", ({ original }) => original.receipt.inputs.secondary_faults.push({ ...original.receipt.inputs.first_fault }), "closeout_instruction_original_fault_invalid"],
        ["incomplete-cleanup", ({ original }) => original.receipt.cleanup.completed = false, "closeout_instruction_original_binding_invalid"],
        ["truncated-child", ({ original }) => original.unit_log += '[canonical:unit] child_result label="invented" exit_code=0 signal=null timed_out=false termination_reason=natural_exit\n', "closeout_instruction_original_cancellation_invalid"],
        ["outside-reporting", ({ instruction, pins }) => { instruction.after += "Unauthorized execution change.\n"; pins.after_bytes = Buffer.byteLength(instruction.after);
          instruction.provenance.records.global_after = { path: "synthetic-after", byte_size: pins.after_bytes, sha256: digest(instruction.after) }; }, "closeout_instruction_replacement_invalid"],
      ]) { restore(); await instructionSemanticRefusal(c, name, mutate, code); pass(`rehash all declared evidence and refuse ${name}`); }
      restore(); assert.deepEqual(treeFiles(c.anchor), ledger);
    } else if (group === "admission") {
      for (const mutate of [input => input.resources.find(row => row.id === "user-instructions").before.sha256 = "0".repeat(64),
        input => input.first_fault = { resource: "user-instructions", disposition: "safety_violation" }, input => input.secondary_faults.push({ disposition: "input_invalidation" }),
        input => input.events.push({ disposition: "safety_violation" }), input => input.binding.head = saved.base]) {
        const input = structuredClone(c.frozenInputs); mutate(input); assert.throws(() => begin(c, validated, authorized, { closeoutInputs: input }));
      }
      const wrongBytes = structuredClone(c.frozenInputs); wrongBytes.resources.find(row => row.id === "user-instructions").before.sha256 = "0".repeat(64);
      wrongBytes.fingerprint = digest({ contract: wrongBytes.contract, path_kind: wrongBytes.path_kind, binding: wrongBytes.binding, resources: wrongBytes.resources });
      assert.throws(() => c.m.assertCloseoutInstructionInputs(validated, wrongBytes), error => error.code === "closeout_instruction_frozen_input_invalid");
      await assert.rejects(c.m.authorizeCloseout(validated, { transport: authorizationTransport(c), frozenInputs: null }), error => error.code === "closeout_instruction_frozen_input_invalid");
      assert.throws(() => begin(c, validated, authorized, { closeoutInputs: null }));
      assert.throws(() => begin(c, validated, authorized, { contractFingerprint: "0".repeat(64) }));
      assert.throws(() => begin(c, validated, { observations: authorized.observations }));
      await assert.rejects(authorize(c, validated, (record, url) => url.includes("/comments/") ? { ...record, updated_at: time(1000) } : record));
      await assert.rejects(authorize(c, validated, (record, url) => url.endsWith("/permission") ? { ...record, permission: "read" } : record));
      assert.deepEqual(treeFiles(c.anchor), ledger); pass("missing, changed, faulted or forged frozen authority refuses before reservation");
      const packets = [];
      for (const index of [1, 2]) {
        const checkout = path.join(resource.root, `instruction-race-${index}`); cpSync(c.checkout, checkout, { recursive: true, filter: file => path.basename(file) !== c.m.CHECKOUT_OWNER_FILE });
        const packet = path.join(resource.root, `instruction-claim-${index}.json`); write(packet, { checkout, anchor: c.anchor,
          file: path.join(checkout, ".augnes-local-verification/closeout/instruction-proof.json"), authority: c.authority, frozenInputs: c.frozenInputs, controlRoot: c.controlRoot, run_id: `synthetic-instruction-race-${index}` }); packets.push(packet);
      }
      const results = await Promise.all(packets.map((packet, index) => child([self, "--claim-closeout-fixture", packet], `instruction-race-${index + 1}`)));
      assert.deepEqual(results.map(row => row.exit_code).sort(), [0, 1], results.map(row => row.output).join("\n"));
      const winner = c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch }); assert(winner.closeout_instruction_consumed);
      const family = path.join(c.anchor, ".augnes-local-verification/families", winner.family_id), attemptFile = path.join(family, "attempt-1.json"), attemptBytes = readFileSync(attemptFile);
      assert(c.m.validCloseoutAttempt(read(attemptFile))); assert.throws(() => begin(c, validated, authorized));
      for (const change of [p => p.head = p.base, p => p.branch += "-copied", p => p.kind = c.m.CLOSEOUT_CONTINUATION_KIND]) {
        const copied = structuredClone(validated); change(copied); assert.throws(() => begin(c, copied, authorized));
      }
      assert.throws(() => begin(c, validated, authorized, { recoveryProof: {} }));
      rmSync(attemptFile); assert.throws(() => c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch })); assert.throws(() => begin(c, validated, authorized)); write(attemptFile, attemptBytes);
      write(path.join(family, "correction-successor.json"), { contract: "augnes.local-canonical-successor.v2", kind: c.m.CLOSEOUT_INSTRUCTION_KIND });
      assert.throws(() => c.m.reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.branch })); rmSync(path.join(family, "correction-successor.json"));
      for (const row of ledger) assert.equal(digest(readFileSync(path.join(c.anchor, row.file))), row.sha256);
      pass("one exclusive winner; copied proof/head/branch, retry, recovery, interrupted reservation and chaining cannot renew it");
    } else {
      const attempt = begin(c, validated, authorized);
      // Stock must still authenticate the frozen declaration after a later
      // observed safety change; that dynamic fault never licenses reservation.
      write(c.instructionFile, readFileSync(c.instructionFile, "utf8") + "Later synthetic input change.\n");
      assert.equal(c.inputContract.check({ force: true })?.disposition, "safety_violation");
      const settledInputs = c.inputContract.snapshot();
      assert.throws(() => begin(c, validated, authorized, { closeoutInputs: settledInputs }));
      const current = c.m.finalizeReceipt({ ...structuredClone(c.receipt),
        repository: { ...c.receipt.repository, head_sha: saved.head, tree_sha: saved.tree }, run: { ...c.receipt.run, id: attempt.attempt_id }, attempt,
        inputs: settledInputs, outcome: { disposition: "safety_violation", safety: "blocked", validity: "invalidated", first_fault: settledInputs.first_fault } });
      c.m.finishAttempt(attempt, { receiptFingerprint: current.integrity.content_fingerprint, disposition: "safety_violation", cleanupComplete: true });
      const exported = c.m.createPrivateReviewExport(current); assert(c.m.validCloseoutAttempt(exported.attempt)); assert(c.m.inspectPrivateReviewExport(exported).structurally_valid);
      for (const mutate of [r => r.receipt_version = 3, r => r.attempt.source_correction.schema = "augnes.local-canonical-source-correction.v2",
        r => r.attempt.source_correction.kind = c.m.CLOSEOUT_SCOPE_CORRECTION_KIND, r => delete r.attempt.closeout_authority,
        r => delete r.attempt.closeout_instruction_input, r => r.attempt.closeout_instruction_input.fingerprint = "0".repeat(64),
        r => r.inputs.fingerprint = "0".repeat(64),
        r => { delete r.attempt.source_correction; delete r.attempt.closeout_authority; r.attempt.closeout_instruction_input = null; },
        r => delete r.attempt.source_correction.instruction.after, r => r.attempt.source_correction.instruction.after.sha256 = "0".repeat(64)]) {
        const altered = structuredClone(current); mutate(altered); const sealed = c.m.finalizeReceipt(altered);
        assert(c.m.inspectReceiptForDecision(sealed, { currentAttemptRecordsValid: true }).issues.includes("receipt_1559_closeout_invalid")); assert.throws(() => c.m.createPrivateReviewExport(sealed));
        const sanitized = structuredClone(exported); mutate(sanitized); delete sanitized.export_fingerprint; sanitized.export_fingerprint = digest(c.m.canonicalSerialize(sanitized));
        assert(!c.m.inspectPrivateReviewExport(sanitized).structurally_valid);
      }
      const after = treeFiles(c.anchor), receiptFile = path.join(c.folder, "instruction-receipt.json"), packet = path.join(c.folder, "instruction-stock-packet.json");
      write(receiptFile, current); write(packet, { checkout: c.checkout, anchor: c.anchor, file: c.file, authority: c.authority,
        frozenInputs: current.inputs, controlRoot: c.controlRoot, receiptFile });
      const cold = await child([self, "--stock-closeout-fixture", packet], "instruction-cold-stock"); assert.equal(cold.exit_code, 0, cold.output);
      assert.deepEqual(treeFiles(c.anchor), after); pass("fresh stock validates exact frozen inputs read-only; sanitized exports preserve bindings and refuse recomputed-integrity downgrades");
    }
  } finally {
    if (c?.owner) c.m.releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: active === 0 });
    if (!active) settleCanonicalTestResourceUse(resource, { cleanup_completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0 });
    assert(cleanupCanonicalTestResources([resource])[0].completed);
  }
  console.log(JSON.stringify({ closeout_instruction_replacement: checks, group, count: checks.length, synthetic_authority_only: true, cleanup_complete: true }));
}
