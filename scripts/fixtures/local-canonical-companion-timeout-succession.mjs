// Explicitly synthetic predecessor and authority. Only disposable ledgers and
// synthetic log/settlement histories are used; no GitHub or provider calls occur.
// These records test evidence readers, not the repair itself or real qualification.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync, readdirSync, chmodSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { digest } from "../local-canonical-inputs.mjs";
import { COMPANION_TIMEOUT_SCHEMA, COMPANION_RETAINED_SOURCES, COMPANION_OWNER_SOURCES, COMPANION_SCENARIOS, validateCompanionRunEvidence, validateCompanionRegression, validateCompanionFocused, companionAuthorityObservation, companionAcceptedReviewRequirements, companionPolicyReviewRequirements, companionExecutionGrantRequirements, inspectCompanionSourceScope, authorizeCompanionTimeout, validateCompanionTimeoutPredecessor } from "../local-canonical-companion-timeout-succession.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "../local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "../github-main-branch-transport.mjs";
import { beginAttempt, finishAttempt, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof } from "../local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership, CHECKOUT_OWNER_FILE } from "../local-canonical-checkout-ownership.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "../canonical-test-environment.mjs";
import { runCanonicalChild } from "../canonical-child-runner.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "../local-canonical-review-export.mjs";
import { finalizeReceipt, inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { baseReceipt } from "./local-canonical-receipt-v3.mjs";
import { assertReviewChildLifecycle, projectReviewChildResult } from "./local-canonical-review-child-result.mjs";

const self = fileURLToPath(import.meta.url), repository = path.resolve(path.dirname(self), "../..");
const write = (file, value) => writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value), { mode: 0o600 });
const read = file => JSON.parse(readFileSync(file, "utf8"));
const time = offset => new Date(Date.now() + offset).toISOString();
const label = "Companion lost-ownership retirement and reconciliation regressions";
// Public Git source only. These commits are the finite repair this prospective
// route concerns; no private receipt, log, witness or authority is embedded.
const priorSource = "68742a2f14d2a69e2835cf68437dc276acf08008";
const repairSource = "a47c77746de213748d68ed0831221c2ddf321520";
const save = c => write(c.file, c.proof);
const proof = c => readSourceCorrectionProof(c.file, c.checkout);
const rebindSource = c => {
  Object.assign(c.proof, c.delta(c.priorHead, c.proof.head));
  Object.assign(c.proof.final_delta, c.delta(c.proof.repair.head, c.proof.head));
  c.proof.source_scope = inspectCompanionSourceScope(c.checkout, { acceptedBase: c.acceptedBase, repairHead: c.proof.repair.head, base: c.proof.base, head: c.proof.head });
};
const transport = (records, change = value => value) => createGitHubObserverAuthorizationTransport(999, { runner: async request => {
  assert.equal(request.operation, "fetch_browser_authority"); assert(request.args.includes("GET"));
  const url = request.args[1]; assert(url.startsWith("repos/hynk-studio/augnes/"));
  const record = url.endsWith("/reviews/102") ? records.policy : url.includes("/reviews/") ? records.repair : url.includes("/comments/") ? records.grant : { permission: "admin", user: { login: "synthetic-fixture" } };
  return change(structuredClone(record), url);
} });
const authorize = (c, p, change) => authorizeCompanionTimeout(p, { transport: transport(c.authority, change) });
const begin = (c, p, authorization, extra = {}) => beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner,
  branch: p.branch, head: p.head, tree: p.tree, acceptedMain: p.base, runId: "synthetic-companion-timeout-successor", contractFingerprint: "6".repeat(64),
  sourceCorrection: p, companionTimeoutAuthorization: authorization, ...extra });
const treeFiles = (directory, root = directory) => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? treeFiles(file, root) : [{ file: path.relative(root, file), sha256: digest(readFileSync(file)) }];
}).sort((a, b) => a.file.localeCompare(b.file));

function authority(p) {
  const user = { login: "synthetic-fixture", id: 7, type: "User" };
  p.repair.review = { id: 101, sha256: "0".repeat(64) };
  const repair = { id: 101, user, author_association: "OWNER", state: "COMMENTED", commit_id: p.repair.head,
    submitted_at: time(-2000), pull_request_url: "https://api.github.com/repos/hynk-studio/augnes/pulls/999",
    body: "SYNTHETIC independent review, not actual task authority.\n" + companionAcceptedReviewRequirements(p).join("\n") };
  p.repair.review = { id: repair.id, sha256: digest(companionAuthorityObservation(repair, "accepted_repair")) };
  const policy = { id: 102, user, author_association: "OWNER", state: "COMMENTED", commit_id: p.head,
    submitted_at: time(-1500), pull_request_url: "https://api.github.com/repos/hynk-studio/augnes/pulls/999",
    body: "SYNTHETIC independent final policy review, not actual task authority.\n" + companionPolicyReviewRequirements(p).join("\n") };
  p.authorization = { policy_review_id: policy.id, policy_review_sha256: digest(companionAuthorityObservation(policy, "final_policy_review")), grant_comment_id: null, grant_sha256: null };
  const grant = { id: 203, user, author_association: "OWNER", updated_at: time(-1000), issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/999",
    body: "SYNTHETIC user instruction, not actual task authority.\n" + companionExecutionGrantRequirements(p).join("\n") };
  p.authorization.grant_comment_id = grant.id; p.authorization.grant_sha256 = digest(companionAuthorityObservation(grant, "execution_grant"));
  return { repair, policy, grant };
}

function makeSyntheticEvidence({ artifact, publicSource }) {
  const fixture = artifact("regression.mjs", "// Explicitly synthetic bridge-readiness evidence-reader control.\n");
  const launcher = artifact("launcher.mjs", "// Explicitly synthetic bounded lifecycle evidence-reader control.\n");
  const runs = {}, evidence = { fixture, launcher };
  const diagnostic = "Companion ownership retirement nondeciding diagnostic";
  for (const [index, name] of ["before", "after", "focused"].entries()) {
    const isBefore = name === "before", exit = isBefore ? 1 : 0;
    const source = publicSource(isBefore ? priorSource : repairSource, COMPANION_RETAINED_SOURCES[0]);
    const root = `/synthetic/owned-${name}`, sourceRoot = isBefore ? "/synthetic/prior-source" : "/synthetic/corrected-source";
    const result = { label: diagnostic, exit_code: exit, signal: null, timed_out: false, cancelled: false, duration_ms: 5,
      spawn_error_code: null, exit_observed: true, streams_closed: true, cleanup_started: true, cleanup_completed: true,
      remaining_owned_processes: 0, termination_reason: "natural_exit" };
    const cleanup = [{ root, completed: true, failure_count: 0, failures: [] }];
    const settlement = { nondeciding: true, started_at: time(-18000 + index * 2000), finished_at: time(-17000 + index * 2000),
      node: "v24.22.1", source: sourceRoot, cwd: `${root}/source`, resource: { root, device: "1", inode: String(index + 1) },
      timeout_ms: 60000, require_natural_exit: true, result, acceptance: exit === 0 ? null : "canonical_child_failed", cleanup };
    let evidenceLines;
    if (name === "focused") {
      evidenceLines = [...COMPANION_SCENARIOS.map(([scenario, effects]) => JSON.stringify({ scenario, pass: true, effects })),
        ...["ui", "bridge", "manager-conflict"].map(adverse => JSON.stringify({ adverse, pass: true, cleanup_complete: true })),
        "PASS ownership retirement: authenticated loopback witnesses, exact refusal, reconciliation, replay and zero residue"];
    } else {
      const text = source.toString(), marker = 'await run("lost-state-retirement-and-replay",';
      const regression = { regression: "bridge-exit-before-readiness-settles-fixture", source_sha256: digest(source),
        derived_sha256: digest(text.slice(0, text.indexOf(marker)) + "\nexport { fixture };\n"),
        fault: { role: "bridge", exit: { code: 23, signal: null }, closed: true },
        witness_cleanup: { owned_remaining: 0, roots_remaining: [] },
        observations: [{ elapsed_ms: 1, event: "exit", role: "bridge", code: 23, signal: null },
          { elapsed_ms: 2, event: "exit", role: "ui", code: null, signal: "SIGTERM" }],
        setup_outcome: isBefore ? { kind: "pending" } : { kind: "rejected", code: "fixture_readiness_exited", message: "fixture child exited before readiness: bridge-ready" },
        passed: !isBefore, assertion: isBefore ? "fixture readiness remains pending after owned bridge exit/close: synthetic control" : null,
        fixture_cleanup: isBefore ? { owned_remaining: 1, roots_remaining: [`${root}/ag-recovery-synthetic`] } : { owned_remaining: 0, roots_remaining: [] } };
      evidenceLines = [JSON.stringify(regression)];
    }
    const log = [`[canonical:diagnostic] child_start label=${JSON.stringify(diagnostic)} timeout_ms=60000`, ...evidenceLines,
      `[canonical:diagnostic] child_exit label=${JSON.stringify(diagnostic)} elapsed_ms=5 exit_code=${exit} signal=null stdout_closed=true stderr_closed=true`,
      `[canonical:diagnostic] child_cleanup_result label=${JSON.stringify(diagnostic)} elapsed_ms=5 reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0`,
      `[canonical:diagnostic] child_result label=${JSON.stringify(diagnostic)} duration_ms=5 exit_code=${exit} signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`,
      JSON.stringify({ result, acceptance: settlement.acceptance, cleanup })].join("\n") + "\n";
    runs[name] = settlement;
    evidence[name] = { ...(name === "focused" ? {} : { source: artifact(`${name}-source.mjs`, source) }),
      log: artifact(`${name}.log`, log), settlement: artifact(`${name}.json`, settlement) };
  }
  evidence.owners = Object.fromEntries(COMPANION_OWNER_SOURCES.map(name => [name, artifact(name.replaceAll("/", "-"), publicSource(repairSource, name))]));
  evidence.environment_observation = artifact("environment.json", { recorded_after_runs: true, observed_at: time(-11000), node: "v24.22.1", npm: "11.16.0",
    node_sha256: "e".repeat(64), node_realpath: "/synthetic/node", platform: "darwin", architecture: "arm64", credentials_forwarded: false,
    environment_owner: "scripts/canonical-test-environment.mjs buildCanonicalChildEnvironment",
    private_homes_and_temp_roots: "different per execution; recorded in settlements", limits: "No retrospectively invented original environment fingerprint; synthetic fixture." });
  evidence.execution_inventory = artifact("inventory.json", Object.entries(runs).map(([name, run]) => ({
    name: name === "before" ? "readiness-prior" : name === "after" ? "readiness-final" : "focused-final",
    started_at: run.started_at, finished_at: run.finished_at, source: run.source, result: run.result, resource_cleanup: run.cleanup,
    command: `SYNTHETIC observer/run-child.mjs ${run.source}${name === "focused" ? "" : " scripts/readiness-regression.mjs"}` })));
  evidence.cleanup = artifact("cleanup.json", { recorded_at: time(-10000), all_settled: true, changed: [], missing: [], remaining_run_roots: [], matching_owned_processes: [],
    run_roots: Object.values(runs).map(run => run.resource.root), companion: { before_after_identical: true, status: "installed_stopped", state: { checkout_relation: "exact" } },
    new_qualification_invocations: 0, new_successor_reservations: 0, new_deciding_attempts: 0 });
  return evidence;
}

async function make(root) {
  const checkout = path.join(root, "checkout"), anchor = path.join(root, "anchor"); mkdirSync(checkout); mkdirSync(anchor);
  const owner = acquireCheckoutVerificationOwnership({ repositoryRoot: checkout });
  const git = (...args) => execFileSync("git", args, { cwd: checkout, env: { ...process.env, GIT_AUTHOR_DATE: time(-8000), GIT_COMMITTER_DATE: time(-8000) }, timeout: 4000, maxBuffer: 2 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const publicSource = (ref, name) => execFileSync("git", ["show", `${ref}:${name}`], { cwd: repository, timeout: 4000, maxBuffer: 2 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const branch = "codex/synthetic-companion-timeout-succession"; git("init", "-b", branch);
  const source = COMPANION_RETAINED_SOURCES[0];
  for (const name of COMPANION_RETAINED_SOURCES) {
    mkdirSync(path.dirname(path.join(checkout, name)), { recursive: true });
    writeFileSync(path.join(checkout, name), publicSource(priorSource, name));
  }
  const suite = publicSource(priorSource, "scripts/run-canonical-test-suite.mjs").toString();
  const registration = suite.match(/\{\s*label: "Companion lost-ownership retirement and reconciliation regressions",[\s\S]*?requireNaturalExit: true,\s*\}/u)?.[0];
  assert(registration, "existing complete registration must be retained");
  write(path.join(checkout, "scripts/run-canonical-test-suite.mjs"), registration + "\n");
  const commit = () => { git("add", "scripts", "plugins"); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic fixture"); return git("rev-parse", "HEAD").toString().trim(); };
  write(path.join(checkout, "scripts/accepted-existing.mjs"), "// original accepted task base\n");
  const acceptedBase = commit();
  write(path.join(checkout, "scripts/accepted-existing.mjs"), "// independently accepted task change\n");
  write(path.join(checkout, "scripts/accepted-added.mjs"), "// independently accepted added task file\n");
  const priorHead = commit(), oldTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  const resources = ["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable", "browser-executable"].map(id => ({ id, classification: "safety", before: { present: false }, location_fingerprint: digest(id) }));
  const declaration = { contract: "augnes.local-canonical-inputs.v3", path_kind: "isolated-model-free-v1", binding: { head: priorHead, tree: oldTree,
    executor_fingerprint: "a".repeat(64), phase_environment_fingerprints: BROWSER_REPLACEMENT_PHASES.map(id => ({ id, fingerprint: "b".repeat(64) })) }, resources };
  const prior = beginAttempt({ repositoryRoot: checkout, anchorRoot: anchor, checkoutOwner: owner, branch, head: priorHead, tree: oldTree, runId: "synthetic-companion-timeout-predecessor", contractFingerprint: digest(declaration) });
  // Synthetic history for validator controls. This does not claim a real 60s
  // child or any real qualification execution.
  const log = '[canonical:unit] child_start label="preceding synthetic workload" timeout_ms=30000\n' +
    '[canonical:unit] child_cleanup_result label="preceding synthetic workload" elapsed_ms=5 reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0\n' +
    '[canonical:unit] child_result label="preceding synthetic workload" duration_ms=5 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n' +
    `[canonical:unit] child_start label=${JSON.stringify(label)} timeout_ms=60000\n` +
    `[canonical:unit] child_spawn label=${JSON.stringify(label)} pid=123 wait=process_exit\n` +
    COMPANION_SCENARIOS.slice(0, 8).map(([scenario, effects]) => JSON.stringify({ scenario, pass: true, effects })).join("\n") + "\n" +
    `[canonical:unit] child_cleanup_start label=${JSON.stringify(label)} elapsed_ms=60003 reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false\n` +
    `[canonical:unit] child_cleanup_result label=${JSON.stringify(label)} elapsed_ms=60154 reason=bounded_timeout streams_closed=true remaining_owned_processes=0\n` +
    `[canonical:unit] child_result label=${JSON.stringify(label)} duration_ms=60154 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n` +
    JSON.stringify({ suite: "unit", resource_cleanup: [{ root: "synthetic-owned-root", completed: true, failure_count: 0, failures: [] }] }) + "\n";
  const logRelative = ".augnes-local-verification/logs/synthetic-predecessor/unit.log";
  mkdirSync(path.dirname(path.join(checkout, logRelative)), { recursive: true }); write(path.join(checkout, logRelative), log);
  const receipt = finalizeReceipt({ ...structuredClone(baseReceipt), receipt_version: 4,
    repository: { ...baseReceipt.repository, branch, head_sha: priorHead, tree_sha: oldTree, base_sha: acceptedBase },
    evidence: { ...baseReceipt.evidence, mode: "full", selected_plan: "full-canonical" },
    verification_context: { kind: "isolated-worktree" }, executor: { ...baseReceipt.executor, source_fingerprint: "a".repeat(64) },
    run: { ...baseReceipt.run, id: prior.attempt_id }, attempt: prior,
    inputs: { ...declaration, fingerprint: digest(declaration), checks: 2, first_fault: null, secondary_faults: [], events: [] },
    outcome: { disposition: "product_failure", safety: "preserved_within_observed_scope", validity: "valid_within_observed_scope", first_fault: null }, checkout_ownership: { released: true }, capacity_ownership: { released: true },
    cleanup: { completed: true, remaining_owned_processes: 0, companion_service: { restored: true }, isolated_resources: { completed: true, failure_count: 0, failures: [] } },
    phases: BROWSER_REPLACEMENT_PHASES.map((id, i) => ({ id, status: i < 5 ? "pass" : i === 5 ? "failure" : "not_run", exit_status: i < 5 ? 0 : i === 5 ? 1 : null,
      failure_code: i === 5 ? "phase_failed" : null, timed_out: false, spawn_error_code: null, environment_fingerprint: "b".repeat(64),
      ...(i === 5 ? { log: { relative_path: logRelative, bytes: Buffer.byteLength(log), truncated: false } } : {}),
      cleanup: { completed: true, remaining_owned_processes: 0, exit_observed: i <= 5, streams_closed: i <= 5, termination_reason: i <= 5 ? "natural_exit" : null } })),
    final: { result: "failure", exit_status: 1, reason_codes: ["phase_failed", "selected_phases_incomplete"] } });
  finishAttempt(prior, { receiptFingerprint: receipt.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
  const family = path.join(anchor, ".augnes-local-verification/families", prior.family_id), completionFile = path.join(family, "completion-1.json");
  const completion = read(completionFile); completion.finished_at = time(-20000); write(completionFile, completion);
  const folder = path.join(checkout, ".augnes-local-verification/companion-timeout"); mkdirSync(folder);
  write(path.join(folder, "original-receipt.json"), receipt); write(path.join(folder, "original-unit.log"), log);
  cpSync(path.join(family, "attempt-1.json"), path.join(folder, "original-attempt.json")); cpSync(completionFile, path.join(folder, "original-completion.json"));
  writeFileSync(path.join(checkout, source), publicSource(repairSource, source));
  const repairHead = commit(), repairTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  // A genuinely separate accepted-main branch adds two other route owners and
  // a registry change. The candidate must retain all of them and the older task.
  git("checkout", "-b", "synthetic-accepted-main", acceptedBase);
  for (const name of ["condition-requalification", "guide-correction"]) write(path.join(checkout, `scripts/local-canonical-${name}.mjs`), `// synthetic accepted-main ${name} owner\n`);
  write(path.join(checkout, "scripts/run-canonical-test-suite.mjs"), registration + "\n// synthetic accepted-main registration\n");
  const base = commit();
  git("checkout", branch);
  git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "merge", "--no-edit", base);
  write(path.join(checkout, "scripts/local-canonical-companion-timeout-succession.mjs"), "// synthetic bounded policy owner\n");
  const head = commit(), tree = git("rev-parse", "HEAD^{tree}").toString().trim();
  const artifact = (name, value) => { if (Buffer.isBuffer(value)) writeFileSync(path.join(folder, name), value); else write(path.join(folder, name), value); return { artifact: name, sha256: digest(readFileSync(path.join(folder, name))) }; };
  const evidence = makeSyntheticEvidence({ artifact, publicSource });
  const delta = (from, to) => ({ delta_sha256: digest(git("diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", from, to, "--")), changed_paths: git("diff", "--name-only", from, to, "--").toString().trim().split("\n").filter(Boolean).sort() });
  const p = { schema: COMPANION_TIMEOUT_SCHEMA, kind: "companion_readiness_timeout", defect: "owned_child_readiness_exit_without_setup_cleanup", branch, base, head, tree,
    prior_family_id: prior.family_id, prior_number: 1, prior_attempt_id: prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    source_module: source, evidence,
    originals: Object.fromEntries(["receipt", "attempt", "completion", "unit_log"].map(kind => [kind, { artifact: kind === "unit_log" ? "original-unit.log" : `original-${kind}.json`, sha256: digest(readFileSync(path.join(folder, kind === "unit_log" ? "original-unit.log" : `original-${kind}.json`))) }])),
    timeout: { phase: "unit", label, budget_ms: 60000, historical_cause: "UNKNOWN", original_blocked_operation: "UNKNOWN" },
    repair: { head: repairHead, tree: repairTree, ...delta(priorHead, repairHead), review: null,
      accepted_review: { reviewed_at: time(-3000), source_url: "https://chatgpt.com/space/page_11111111111111111111111111111111",
        block_id: "00000000-0000-4000-8000-000000000001", block_sha256: "8".repeat(64) } }, ...delta(priorHead, head),
    final_delta: { basis: "implementation_owner_not_independent_review", ...delta(repairHead, head) },
    retained_sources: Object.fromEntries(COMPANION_RETAINED_SOURCES.map(name => [name, digest(git("show", `${head}:${name}`))])),
    limitations: { historical_timeout_cause: "UNKNOWN", original_blocked_operation: "UNKNOWN", witnesses_run_before_repair_commit: true,
      private_home_and_temp_roots: "different_per_execution", original_per_run_environment_fingerprint: null,
      environment_observation: "after_runs_only", initial_manager_announcement: "unchanged_unproved" },
    authorization: null, pull_request: 999, budget: { initial: 1, recovery: 0 },
    source_scope: inspectCompanionSourceScope(checkout, { acceptedBase, repairHead, base, head }) };
  const c = { checkout, anchor, owner, git, commit, delta, family, receipt, proof: p, folder, file: path.join(folder, "proof.json"), logRelative, acceptedBase, priorHead };
  c.authority = authority(p); save(c); return c;
}

if (process.argv[2] === "--claim-companion-timeout-fixture") {
  const packet = read(process.argv[3]); let owner;
  try {
    owner = acquireCheckoutVerificationOwnership({ repositoryRoot: packet.checkout });
    const p = readSourceCorrectionProof(packet.file, packet.checkout), authorization = await authorizeCompanionTimeout(p, { transport: transport(packet.authority) });
    const attempt = beginAttempt({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, checkoutOwner: owner, branch: p.branch, head: p.head, tree: p.tree,
      acceptedMain: p.base, runId: packet.run_id, contractFingerprint: "6".repeat(64), sourceCorrection: p, companionTimeoutAuthorization: authorization });
    finishAttempt(attempt, { receiptFingerprint: "7".repeat(64), disposition: "product_failure", cleanupComplete: true });
    console.log("exclusive_claim_won");
  } catch (error) { console.log(`exclusive_claim_refused:${error.code}`); process.exitCode = 1; }
  finally { if (owner) releaseCheckoutVerificationOwnership(owner, packet.checkout, { consumersSettled: true }); }
} else if (process.argv[2] === "--stock-companion-timeout-fixture") {
  const packet = read(process.argv[3]), before = treeFiles(packet.anchor), p = readSourceCorrectionProof(packet.file, packet.checkout);
  const authorization = await authorizeCompanionTimeout(p, { transport: transport(packet.authority) });
  const receipt = read(packet.receipt);
  assert(inspectAttemptRecords({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, receipt, companionTimeoutAuthorization: authorization }));
  assert(!inspectReceiptForDecision(receipt, { currentAttemptRecordsValid: true }).issues.includes("receipt_companion_timeout_succession_invalid"));
  assert.deepEqual(treeFiles(packet.anchor), before); console.log("fresh stock reconstructs without reservation or ledger mutation");
} else if (process.argv[2] === "--run-companion-timeout-fixtures") {
  await companionTimeoutSuccessionControls(process.argv[3] ?? "all");
}

export async function companionTimeoutSuccessionControls(group = "all") {
  assert(["all", "evidence", "witnesses", "source", "originals", "authority", "authority_records", "admission", "race", "stock"].includes(group));
  const owner = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(owner);
  let c, active = 0; const checks = [];
  const child = async (args, controlId) => {
    active++; let output = "";
    const result = await runCanonicalChild({ suite: "companion-timeout-succession-fixture", label: "synthetic fixture", command: process.execPath, args, cwd: owner.root,
      env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), timeoutMs: 4000,
      stdout: { write: chunk => output = (output + chunk).slice(-2000) }, stderr: { write: chunk => output = (output + chunk).slice(-2000) }, log() {} });
    if (result.cleanup_completed && result.exit_observed && result.streams_closed && result.remaining_owned_processes === 0) active--;
    console.log("AUGNES_COMPANION_TIMEOUT_FIXTURE_CHILD " + JSON.stringify(projectReviewChildResult(result, { controlId })));
    assertReviewChildLifecycle(result, { controlId }); result.fixture_output = output; return result;
  };
  const groupStarted = performance.now();
  const pass = name => {
    checks.push(name);
    console.log("AUGNES_COMPANION_TIMEOUT_CONTROL " + JSON.stringify({ group, elapsed_ms: Math.round(performance.now() - groupStarted), check: name }));
  };
  try {
    c = await make(owner.root, child);
    const saved = structuredClone(c.proof), validated = proof(c), authorized = await authorize(c, validated);
    assert(validated && authorized); pass("complete synthetic timeout evidence and prospective authority");
    const edge = path.join(c.family, "correction-successor.json");
    const actualCompletion = path.join(c.family, "completion-1.json");
    assert(!existsSync(edge)); pass("reader and authority inspection do not reserve");
    const resetProof = () => { c.proof = structuredClone(saved); save(c); };
    assert.equal(validated.schema, "augnes.local-canonical-source-correction.v7");
    assert(validated.source_scope.accepted_task.some(row => row.path === "scripts/accepted-existing.mjs"));
    assert(validated.source_scope.accepted_task.some(row => row.path === "scripts/accepted-added.mjs"));
    assert(validated.source_scope.main_reconciliation.some(row => row.path === "scripts/local-canonical-condition-requalification.mjs" && row.rule === "preserve_accepted_main"));
    assert(validated.source_scope.main_reconciliation.some(row => row.path === "scripts/local-canonical-guide-correction.mjs" && row.rule === "preserve_accepted_main"));
    pass("v7 preserves accepted task union and separately advanced accepted main owners and registry");
    const missingRecords = structuredClone(saved); missingRecords.repair.review = null; missingRecords.authorization = null;
    assert(companionAcceptedReviewRequirements(missingRecords).length > 0);
    assert(companionPolicyReviewRequirements(missingRecords).length > 0);
    assert.throws(() => companionExecutionGrantRequirements(missingRecords), /companion_timeout_review_references_required/u);
    pass("review preparation requires no fabricated IDs and unresolved grant preparation refuses");
    if (["all", "evidence"].includes(group)) {
      for (const [name, mutate] of [
        ["legacy v1", p => p.schema = "augnes.local-canonical-source-correction.v1"],
        ["legacy v2", p => p.schema = "augnes.local-canonical-source-correction.v2"],
        ["observer v3", p => p.schema = "augnes.local-canonical-source-correction.v3"],
        ["structural v4", p => p.schema = "augnes.local-canonical-source-correction.v4"],
        ["obsolete ambiguous Companion v5", p => p.schema = "augnes.local-canonical-source-correction.v5"],
        ["GuideBrief v6 is not Companion", p => p.schema = "augnes.local-canonical-source-correction.v6"],
        ["missing accepted task scope", p => delete p.source_scope],
        ["redefined accepted task base", p => p.source_scope.accepted_base = p.base],
        ["omitted accepted task path", p => p.source_scope.accepted_task_paths.pop()],
        ["unknown retry kind", p => p.kind = "unknown_retry"],
        ["missing actual review provenance", p => delete p.repair.accepted_review],
        ["wrong provenance source", p => p.repair.accepted_review.source_url = "https://example.invalid/review"],
        ["future accepted review", p => p.repair.accepted_review.reviewed_at = time(60000)],
        ["review before repair commit", p => p.repair.accepted_review.reviewed_at = time(-15000)], ["missing originals", p => delete p.originals],
        ["receipt bytes", p => p.originals.receipt.sha256 = "0".repeat(64)],
        ["attempt bytes", p => p.originals.attempt.sha256 = "0".repeat(64)],
        ["completion bytes", p => p.originals.completion.sha256 = "0".repeat(64)],
        ["timeout bytes", p => p.originals.unit_log.sha256 = "0".repeat(64)], ["timeout budget", p => p.timeout.budget_ms = 61000],
        ["wrong phase", p => p.timeout.phase = "integration"], ["wrong child", p => p.timeout.label = "unrelated child"],
        ["historical operation rewrite", p => p.timeout.original_blocked_operation = "bridge-ready"],
        ["invented shared environment", p => p.limitations.original_per_run_environment_fingerprint = "e".repeat(64)],
        ["initial announcement overclaim", p => p.limitations.initial_manager_announcement = "fixed"],
        ["historical cause rewrite", p => p.timeout.historical_cause = "fixed"],
        ["unknown source", p => p.source_module = "lib/unrelated.mjs"], ["unchanged repair", p => p.repair.head = p.base],
        ["candidate tree", p => p.tree = p.base], ["source delta", p => p.delta_sha256 = "0".repeat(64)],
        ["final policy delta", p => p.final_delta.delta_sha256 = "0".repeat(64)],
        ["implementation audit relabel", p => p.final_delta.basis = "independent_review"],
        ["path inventory", p => p.changed_paths.pop()], ["reviewed regression changed", p => p.retained_sources[COMPANION_RETAINED_SOURCES[1]] = "0".repeat(64)],
        ["fixture identity", p => p.evidence.fixture.sha256 = "0".repeat(64)], ["before witness", p => p.evidence.before.settlement.sha256 = "0".repeat(64)],
        ["recovery allowance", p => p.budget.recovery = 1], ["duplicate initial allowance", p => p.budget.initial = 2],
        ["array digest", p => p.retained_sources[COMPANION_RETAINED_SOURCES[0]] = [p.retained_sources[COMPANION_RETAINED_SOURCES[0]]]],
        ["array commit", p => p.head = [p.head]],
      ]) {
        resetProof(); mutate(c.proof); save(c); assert.throws(() => proof(c), undefined, name);
        assert(!existsSync(edge)); pass(`refuse ${name}`);
      }
      resetProof();
    }
    if (["all", "witnesses"].includes(group)) {
      const afterLog = readFileSync(path.join(c.folder, saved.evidence.after.log.artifact));
      const afterSettlement = read(path.join(c.folder, saved.evidence.after.settlement.artifact));
      const afterSource = readFileSync(path.join(c.folder, saved.evidence.after.source.artifact));
      const afterRows = validateCompanionRunEvidence(afterLog, afterSettlement, 0);
      for (const [name, mutate] of [
        ["correction still fails", r => r.result.exit_code = 1], ["cancelled witness", r => r.result.cancelled = true],
        ["timed out witness", r => r.result.timed_out = true], ["witness cleanup residue", r => r.result.remaining_owned_processes = 1],
        ["open streams", r => r.result.streams_closed = false], ["non-natural witness", r => r.result.termination_reason = "bounded_timeout"],
        ["weakened bound", r => r.timeout_ms = 61000], ["natural-exit disabled", r => r.require_natural_exit = false],
        ["cleanup outside deadline", r => r.result.duration_ms = 60001], ["missing resource cleanup", r => r.cleanup = []],
      ]) {
        const changed = structuredClone(afterSettlement); mutate(changed);
        assert.throws(() => validateCompanionRunEvidence(afterLog, changed, 0), /companion_timeout_run_/u, name); pass(`refuse ${name}`);
      }
      for (const [name, mutate] of [
        ["bridge did not close", w => w.fault.closed = false], ["different injected failure", w => w.fault.exit.code = 24],
        ["missing assertion", w => w.passed = false], ["pending corrected setup", w => w.setup_outcome = { kind: "pending" }],
        ["fixture residue", w => w.fixture_cleanup.owned_remaining = 1], ["witness residue", w => w.witness_cleanup.owned_remaining = 1],
        ["wrong exact source", w => w.source_sha256 = "0".repeat(64)], ["changed derived fixture", w => w.derived_sha256 = "0".repeat(64)],
        ["unobserved owned exit", w => w.observations.pop()], ["reordered owned exits", w => w.observations.reverse()],
      ]) {
        const rows = structuredClone(afterRows); mutate(rows.find(row => row.regression));
        assert.throws(() => validateCompanionRegression(rows, afterSource, false), /companion_timeout_regression_/u, name); pass(`refuse ${name}`);
      }
      const focusedLog = readFileSync(path.join(c.folder, saved.evidence.focused.log.artifact));
      const focusedRows = validateCompanionRunEvidence(focusedLog, read(path.join(c.folder, saved.evidence.focused.settlement.artifact)), 0);
      for (const [name, mutate] of [
        ["missing ninth scenario", rows => rows.filter(row => row.scenario !== "changed-generation-at-effect-boundary")],
        ["scenario effect weakened", rows => { rows.find(row => row.scenario).effects = 0; return rows; }],
        ["missing manager adverse", rows => rows.filter(row => row.adverse !== "manager-conflict")],
        ["adverse cleanup missing", rows => { rows.find(row => row.adverse).cleanup_complete = false; return rows; }],
      ]) {
        assert.throws(() => validateCompanionFocused(mutate(structuredClone(focusedRows)), focusedLog), /companion_timeout_focused_coverage_invalid/u, name); pass(`refuse ${name}`);
      }
      assert.throws(() => validateCompanionFocused(focusedRows, Buffer.from(focusedLog.toString().replace("PASS ownership retirement:", "INCOMPLETE ownership retirement:"))), /companion_timeout_focused_coverage_invalid/u);
      pass("final natural completion summary is required");
    }
    if (["all", "source"].includes(group)) {
      for (const [name, file, replacement, action] of [
        ["unrelated", "scripts/unrelated.mjs", "export const unrelated=true;\n"],
        ["workload", COMPANION_RETAINED_SOURCES[0], "// removed the actual workload\n"],
        ["owner", COMPANION_OWNER_SOURCES[0], "// changed real Companion owner\n"],
        ["assertions", COMPANION_RETAINED_SOURCES[0], readFileSync(path.join(c.checkout, COMPANION_RETAINED_SOURCES[0]), "utf8").replace("assert.equal(f.effects(), 1)", "assert(true)")],
        ["deadline", "scripts/run-canonical-test-suite.mjs", readFileSync(path.join(c.checkout, "scripts/run-canonical-test-suite.mjs"), "utf8").replace("60_000", "120_000")],
        ["reverted-accepted-to-base", "scripts/accepted-existing.mjs", c.git("show", `${c.acceptedBase}:scripts/accepted-existing.mjs`).toString()],
        ["deleted-accepted-addition", "scripts/accepted-added.mjs", null, "delete"],
        ["deleted-accepted-existing", "scripts/accepted-existing.mjs", null, "delete"],
        ["changed-accepted-mode", "scripts/accepted-existing.mjs", null, "chmod"],
        ["removed-accepted-condition", "scripts/local-canonical-condition-requalification.mjs", null, "delete"],
        ["changed-accepted-guide", "scripts/local-canonical-guide-correction.mjs", "// discarded accepted-main GuideBrief implementation\n"],
        ["discarded-main-registry", "scripts/run-canonical-test-suite.mjs", c.git("show", `${saved.repair.head}:scripts/run-canonical-test-suite.mjs`).toString()],
      ]) {
        c.git("checkout", "-b", `synthetic-${name}`, saved.head);
        if (action === "delete") rmSync(path.join(c.checkout, file));
        else if (action === "chmod") chmodSync(path.join(c.checkout, file), 0o755);
        else write(path.join(c.checkout, file), replacement);
        c.proof.head = c.commit(); c.proof.tree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
        rebindSource(c);
        if (["reverted-accepted-to-base", "deleted-accepted-addition"].includes(name)) {
          assert(!c.proof.source_scope.candidate_delta_paths.includes(file), "regression must really disappear from current-base diff");
          assert(c.proof.source_scope.accepted_task_paths.includes(file), "accepted task union must retain the vanished path");
        }
        save(c);
        let refusal;
        try { proof(c); } catch (error) { refusal = error; }
        assert(refusal, "changed candidate must be refused");
        const expectedCode = ["reverted-accepted-to-base", "deleted-accepted-addition", "deleted-accepted-existing", "changed-accepted-mode", "workload", "assertions"].includes(name)
          ? "companion_timeout_accepted_task_changed" : ["removed-accepted-condition", "changed-accepted-guide", "unrelated", "owner"].includes(name)
            ? "companion_timeout_unrelated_candidate_delta" : name === "discarded-main-registry" ? "companion_timeout_unrelated_registration_changed" : "companion_timeout_registration_invalid";
        assert.equal(refusal.code, expectedCode, name);
        console.log("AUGNES_COMPANION_SOURCE_SCOPE_CONTROL " + JSON.stringify({ name, refusal_code: refusal.code, head: c.proof.head, tree: c.proof.tree,
          delta_sha256: c.proof.delta_sha256, final_delta_sha256: c.proof.final_delta.delta_sha256,
          scope_fingerprint: digest(c.proof.source_scope), changed_paths: c.proof.changed_paths, final_delta: c.proof.final_delta,
          source_scope: c.proof.source_scope, candidate_delta_paths: c.proof.source_scope.candidate_delta_paths,
          accepted: c.proof.source_scope.accepted_task.find(row => row.path === file) ?? null }));
        resetProof(); c.git("checkout", saved.branch); pass(`refuse actual ${name} source delta with matching Git inventories`);
      }
      // Divergent accepted-main edits to an accepted task path require a new
      // review, even when a merge keeps the accepted repair bytes exactly.
      c.git("checkout", "-b", "synthetic-overlap-main", saved.base);
      write(path.join(c.checkout, "scripts/accepted-existing.mjs"), "// conflicting accepted-main change\n");
      const divergentMain = c.commit();
      c.git("checkout", "-b", "synthetic-overlap-candidate", saved.head);
      c.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "merge", "--strategy=ours", "--no-edit", divergentMain);
      c.proof.base = divergentMain; c.proof.head = c.git("rev-parse", "HEAD").toString().trim(); c.proof.tree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
      rebindSource(c); save(c);
      assert.throws(() => proof(c), error => error.code === "companion_timeout_accepted_main_overlap_requires_review");
      console.log("AUGNES_COMPANION_SOURCE_SCOPE_CONTROL " + JSON.stringify({ name: "divergent-accepted-main-overlap", refusal_code: "companion_timeout_accepted_main_overlap_requires_review", base: c.proof.base, head: c.proof.head, tree: c.proof.tree, delta_sha256: c.proof.delta_sha256, final_delta_sha256: c.proof.final_delta.delta_sha256, scope_fingerprint: digest(c.proof.source_scope), changed_paths: c.proof.changed_paths, final_delta: c.proof.final_delta, source_scope: c.proof.source_scope }));
      resetProof(); c.git("checkout", saved.branch); pass("divergent accepted-main overlap cannot silently replace either accepted source");
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
        ["outer phase timeout", r => r.phases[5].timed_out = true], ["other phase failure", r => r.phases[4].status = "failure"],
        ["PASS reuse after failure", r => r.phases[6].status = "pass"], ["missing phase", r => r.phases.pop()],
        ["unsettled phase", r => r.phases[5].cleanup.streams_closed = false], ["unfinished cleanup", r => r.cleanup.completed = false],
        ["owned residue", r => r.cleanup.remaining_owned_processes = 1], ["Companion unrestored", r => r.cleanup.companion_service.restored = false],
        ["checkout owner retained", r => r.checkout_ownership.released = false], ["capacity retained", r => r.capacity_ownership.released = false],
      ]) {
        const changed = structuredClone(c.receipt); mutate(changed);
        changed.inputs.fingerprint = digest({ contract: changed.inputs.contract, path_kind: changed.inputs.path_kind, binding: changed.inputs.binding, resources: changed.inputs.resources });
        changed.attempt.contract_fingerprint = changed.inputs.fingerprint;
        assert.throws(() => validateCompanionTimeoutPredecessor(finalizeReceipt(changed)), undefined, name); pass(`refuse ${name}`);
      }
      // Rebind every synthetic byte/length/fingerprint so these controls reach
      // semantic log checks rather than merely demonstrating a stale hash.
      const logCopy = path.join(c.folder, saved.originals.unit_log.artifact), logOriginal = path.join(c.checkout, c.logRelative);
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
        const originalReceipt = JSON.parse(originals.get(receiptFile)); originalReceipt.phases[5].log.bytes = Buffer.byteLength(log);
        if (name === "truncated log") originalReceipt.phases[5].log.truncated = true;
        const sealed = finalizeReceipt(originalReceipt); write(receiptFile, sealed);
        const completion = JSON.parse(originals.get(completionFile)); completion.receipt_fingerprint = sealed.integrity.content_fingerprint;
        write(completionFile, completion); write(actualCompletion, completion);
        c.proof.prior_receipt_fingerprint = sealed.integrity.content_fingerprint;
        for (const kind of ["receipt", "completion"]) c.proof.originals[kind].sha256 = digest(readFileSync(path.join(c.folder, c.proof.originals[kind].artifact)));
        c.proof.originals.unit_log.sha256 = digest(log); save(c); assert.throws(() => proof(c), undefined, name);
        for (const [file, bytes] of originals) writeFileSync(file, bytes); pass(`refuse ${name}`);
      }
      resetProof(); assert.deepEqual(proof(c), validated);
    }
    if (["all", "authority"].includes(group)) {
      for (const [name, mutate] of [
        ["missing grant", (r, url) => url.includes("comments") ? null : r],
        ["missing exact final policy review", (r, url) => url.endsWith("/reviews/102") ? null : r],
        ["wrong final policy review head", (r, url) => url.endsWith("/reviews/102") ? { ...r, commit_id: c.proof.repair.head } : r],
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
        ["grant budget prose", "grant", body => body.replace("One Full and zero recovery/retry", "Unlimited Full and recovery/retry")],
        ["grant review source prose", "grant", body => body.replace(c.proof.repair.head, c.proof.head)],
        ["accepted correction scope", "repair", body => body.replace("accepts the one-file", "does not accept the one-file")],
        ["final policy base binding", "policy", body => body.replace(`Reviewed final base \`${c.proof.base}\``, "Reviewed final base `missing`")],
        ["final policy scope inventory", "policy", body => body.replace(digest(c.proof.source_scope), "0".repeat(64))],
        ["final policy native delta", "policy", body => body.replace(c.proof.final_delta.delta_sha256, "0".repeat(64))],
      ]) {
        const records = structuredClone(c.authority), changed = structuredClone(validated); records[role].body = mutate(records[role].body);
        const observation = companionAuthorityObservation(records[role], role === "repair" ? "accepted_repair" : role === "policy" ? "final_policy_review" : "execution_grant");
        if (role === "repair") changed.repair.review.sha256 = digest(observation);
        else if (role === "policy") changed.authorization.policy_review_sha256 = digest(observation);
        else changed.authorization.grant_sha256 = digest(observation);
        write(c.file, changed); const changedProof = proof(c);
        await assert.rejects(() => authorizeCompanionTimeout(changedProof, { transport: transport(records) }), /companion_timeout_(?:authority|review|policy_review)_scope_invalid/u, name);
        resetProof();
        pass(`refuse hash-consistent ${name}`);
      }
    }
    if (["all", "authority_records"].includes(group)) {
      for (const [name, role, mutate] of [
        ["grant predates review", "grant", r => r.updated_at = new Date(Date.parse(c.authority.policy.submitted_at) - 1).toISOString()],
        ["review predates accepted Page audit", "repair", r => r.submitted_at = new Date(Date.parse(saved.repair.accepted_review.reviewed_at) - 1).toISOString()],
        ["wrong review commit", "repair", r => r.commit_id = c.proof.head],
        ["wrong final policy commit", "policy", r => r.commit_id = c.proof.repair.head],
        ["stale final policy review", "policy", r => r.submitted_at = new Date(Date.parse(c.git("show", "-s", "--format=%cI", saved.head).toString().trim()) - 1).toISOString()],
        ["final policy review predates accepted review", "policy", r => r.submitted_at = new Date(Date.parse(c.authority.repair.submitted_at) - 1).toISOString()],
        ["final policy review rejected", "policy", r => r.state = "CHANGES_REQUESTED"],
        ["foreign final policy destination", "policy", r => r.pull_request_url = "https://api.github.com/repos/hynk-studio/augnes/pulls/998"],
        ["foreign review destination", "repair", r => r.pull_request_url = "https://api.github.com/repos/hynk-studio/augnes/pulls/998"],
        ["non-maintainer review association", "repair", r => r.author_association = "NONE"],
      ]) {
        const changed = structuredClone(validated), records = structuredClone(c.authority); mutate(records[role]);
        const observation = companionAuthorityObservation(records[role], role === "repair" ? "accepted_repair" : role === "policy" ? "final_policy_review" : "execution_grant");
        if (role === "repair") changed.repair.review.sha256 = digest(observation);
        else if (role === "policy") changed.authorization.policy_review_sha256 = digest(observation);
        else changed.authorization.grant_sha256 = digest(observation);
        records.grant.body = "SYNTHETIC updated reference binding.\n" + companionExecutionGrantRequirements(changed).join("\n");
        changed.authorization.grant_sha256 = digest(companionAuthorityObservation(records.grant, "execution_grant"));
        write(c.file, changed); const changedProof = proof(c);
        await assert.rejects(() => authorizeCompanionTimeout(changedProof, { transport: transport(records) }), /companion_timeout_authority_(?:order|source|identity)_invalid/u, name);
        resetProof(); pass(`refuse hash-consistent ${name}`);
      }
    }
    if (["all", "admission"].includes(group)) {
      assert.throws(() => begin(c, validated, { observations: authorized.observations }), /companion_timeout_authenticated_authority_required/u); pass("forged local authority cannot reserve");
      assert.throws(() => begin(c, validated, authorized, { acceptedMain: "0".repeat(40) }), /companion_timeout_current_base_required/u); pass("fresh main binding required");
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
        write(packet, { checkout, anchor: raceAnchor, file: path.join(checkout, ".augnes-local-verification/companion-timeout/proof.json"), authority: c.authority, run_id: `synthetic-race-${index}` }); racePackets.push(packet);
      }
      const race = await Promise.all(racePackets.map((packet, index) => child([self, "--claim-companion-timeout-fixture", packet], `timeout-race-${index + 1}`)));
      assert.deepEqual(race.map(result => result.exit_code).sort(), [0, 1], race.map(result => result.fixture_output).join("\n"));
      assert.equal(race.filter(result => result.fixture_output.includes("exclusive_claim_won")).length, 1); pass("two worktrees reserve one shared predecessor edge");
    }
    if (["all", "stock"].includes(group)) {
      const attempt = begin(c, validated, authorized); assert.deepEqual(attempt.budget, { initial: 1, recovery: 0 });
      assert.throws(() => begin(c, validated, authorized), /attempt_latest_tip_required/); pass("duplicate reservation before completion refuses");
      const current = finalizeReceipt({ ...structuredClone(c.receipt), repository: { ...c.receipt.repository, base_sha: c.proof.base, head_sha: c.proof.head, tree_sha: c.proof.tree },
        run: { ...c.receipt.run, id: attempt.attempt_id }, attempt, inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, head: c.proof.head, tree: c.proof.tree } } });
      finishAttempt(attempt, { receiptFingerprint: current.integrity.content_fingerprint, disposition: current.outcome.disposition, cleanupComplete: true });
      const ledgerBefore = treeFiles(c.anchor);
      assert(inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current, companionTimeoutAuthorization: authorized }));
      assert.deepEqual(treeFiles(c.anchor), ledgerBefore); pass("stock reconstructs without ledger writes");
      const inspection = inspectReceiptForDecision(current, { currentAttemptRecordsValid: true });
      assert(!inspection.issues.includes("receipt_companion_timeout_succession_invalid")); assert(!inspection.valid_deciding_evidence); pass("failed synthetic successor remains non-deciding");
      assert(!inspectReceiptForDecision(c.receipt).valid_deciding_evidence); pass("historical failed receipt remains invalid");
      assert(!inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current })); pass("stock cannot manufacture authorization");
      for (const change of [r => r.attempt.budget.recovery = 1, r => r.attempt.source_correction.budget.recovery = 1,
        r => r.attempt.number = 2, r => r.attempt.companion_timeout_authority.execution_grant.role = "implementation_owner"]) {
        const altered = structuredClone(current); change(altered);
        assert(inspectReceiptForDecision(finalizeReceipt(altered), { currentAttemptRecordsValid: true }).issues.includes("receipt_companion_timeout_succession_invalid"));
      }
      pass("stock refuses recovery, second attempts and altered grant roles");
      const exported = createPrivateReviewExport(current);
      assert.equal(inspectPrivateReviewExport(exported).structurally_valid, true);
      assert.equal(inspectPrivateReviewExport(exported).deciding, false);
      assert.equal(exported.attempt.source_correction.evidence.before.source.artifact, undefined);
      assert.equal(exported.attempt.source_correction.originals.unit_log.artifact, undefined);
      assert(!JSON.stringify(exported).includes("SYNTHETIC independent review"));
      for (const change of [r => r.attempt.source_correction.limitations.historical_timeout_cause = "fixed",
        r => r.attempt.source_correction.retained_sources[COMPANION_RETAINED_SOURCES[0]] = "0".repeat(64),
        r => r.attempt.companion_timeout_authority.execution_grant.role = "implementation_owner"]) {
        const alteredReceipt = structuredClone(current); change(alteredReceipt);
        const alteredExport = createPrivateReviewExport(finalizeReceipt(alteredReceipt));
        assert.equal(inspectPrivateReviewExport(alteredExport).structurally_valid, false);
      }
      pass("private export retains bounded identities, refuses tampering and never promotes authority");
      const successorReceipt = path.join(c.folder, "successor-receipt.json"); write(successorReceipt, current);
      const packet = path.join(c.folder, "stock-packet.json"); write(packet, { checkout: c.checkout, anchor: c.anchor, file: c.file, authority: c.authority, receipt: successorReceipt });
      const stock = await child([self, "--stock-companion-timeout-fixture", packet], "timeout-stock"); assert.equal(stock.exit_code, 0, stock.fixture_output); pass("cold stock process reconstructs without reservation");
      assert.throws(() => begin(c, validated, authorized));
      const copiedFile = path.join(c.folder, "copied-proof.json"); write(copiedFile, saved);
      const copied = readSourceCorrectionProof(copiedFile, c.checkout), copiedAuthorization = await authorize(c, copied);
      assert.throws(() => begin(c, copied, copiedAuthorization), /attempt_latest_tip_required/u);
      pass("copied proof and unchanged grant cannot renew consumed allowance");
      write(path.join(c.checkout, "scripts/local-canonical-companion-timeout-succession.mjs"), "// synthetic further in-scope source revision\n");
      const revisionHead = c.commit(), revisionTree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
      c.proof.head = revisionHead; c.proof.tree = revisionTree;
      rebindSource(c); save(c);
      const revision = proof(c);
      await assert.rejects(() => authorize(c, revision), /companion_timeout_authority_source_invalid/u);
      pass("changed final head requires its own exact final policy review");
      // Even new synthetic review/grant records cannot renew a consumed edge.
      const oldAuthority = c.authority; c.authority = authority(c.proof); save(c);
      const reviewedRevision = proof(c), revisionAuthorization = await authorize(c, reviewedRevision);
      assert.throws(() => begin(c, reviewedRevision, revisionAuthorization), /attempt_latest_tip_required/);
      c.authority = oldAuthority; resetProof(); pass("new in-scope commit and freshly bound reviews cannot renew consumed authority");
      assert.throws(() => beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner, branch: c.proof.branch,
        head: c.proof.head, tree: c.proof.tree, runId: "forbidden-reset", contractFingerprint: "7".repeat(64) }), /attempt_candidate_superseded/);
      pass("grant is terminal after completion and cannot reset the old family");
      const successorRoot = path.join(c.anchor, ".augnes-local-verification/families", attempt.family_id);
      const successorAttempt = path.join(successorRoot, "attempt-1.json"), successorBytes = readFileSync(successorAttempt);
      rmSync(successorAttempt); assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch })); assert.throws(() => begin(c, validated, authorized));
      writeFileSync(successorAttempt, successorBytes); pass("interrupted reservation is retained and cannot be replayed");
      write(path.join(successorRoot, "correction-successor.json"), { family_id: "f".repeat(64), head: c.proof.head, tree: c.proof.tree, proof_fingerprint: digest(validated) });
      assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch }), /attempt_companion_timeout_successor_terminal/);
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
  console.log(JSON.stringify({ companion_timeout_succession: checks, group, count: checks.length, synthetic_authority_only: true, cleanup_complete: true }));
  return checks;
}
