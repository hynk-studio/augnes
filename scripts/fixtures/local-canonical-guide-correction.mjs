// Explicitly synthetic retained records and authority. Only disposable Git and
// ledger state are used; this fixture never replays accepted private witnesses.
import { AUXILIARY_EXECUTION_BUDGETS } from "../local-canonical-closeout-budgets.mjs";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { digest } from "../local-canonical-inputs.mjs";
import { GUIDE_CORRECTION_SCHEMA, authorizeGuideCorrection, validGuideCorrectionAttempt, validateGuidePredecessor } from "../local-canonical-guide-correction.mjs";
import { conditionAuthorityObservation, validConditionRequalificationAttempt } from "../local-canonical-condition-requalification.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "../local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "../github-main-branch-transport.mjs";
import { beginAttempt, finishAttempt, inspectAttemptRecords, reconstructAttemptTip, readSourceCorrectionProof } from "../local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership, CHECKOUT_OWNER_FILE } from "../local-canonical-checkout-ownership.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "../canonical-test-environment.mjs";
import { runCanonicalChild } from "../canonical-child-runner.mjs";
import { finalizeReceipt, inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "../local-canonical-review-export.mjs";
import { baseReceipt } from "./local-canonical-receipt-v3.mjs";
import { assertReviewChildLifecycle, projectReviewChildResult } from "./local-canonical-review-child-result.mjs";

const self = fileURLToPath(import.meta.url);
const write = (file, value) => { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value), { mode: 0o600 }); };
const read = file => JSON.parse(readFileSync(file, "utf8"));
const time = offset => new Date(Date.now() + offset).toISOString();
const proof = c => readSourceCorrectionProof(c.file, c.checkout);
const save = c => write(c.file, c.proof);
const observation = (r, role) => ({ id: r.id, author: r.user.login, author_id: r.user.id, body_sha256: digest(r.body),
  timestamp: r.updated_at ?? r.submitted_at, role, commit_id: role === "accepted_repair" ? r.commit_id : null });
const treeFiles = (directory, root = directory) => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? treeFiles(file, root) : [{ file: path.relative(root, file), sha256: digest(readFileSync(file)) }];
}).sort((a, b) => a.file.localeCompare(b.file));
const transport = (records, change = value => value) => createGitHubObserverAuthorizationTransport(999, { runner: async request => {
  assert.equal(request.operation, "fetch_browser_authority"); assert(request.args.includes("GET"));
  const url = request.args[1]; assert(url.startsWith("repos/hynk-studio/augnes/"));
  const record = url.includes("/reviews/") ? records.repair : url.includes("/comments/") ? records.grant : url.endsWith("/pulls/999") ? records.pr : { permission: "admin", user: { login: "synthetic-fixture" } };
  return change(structuredClone(record), url);
} });
const authorize = (c, p, change) => authorizeGuideCorrection(p, { transport: transport(c.authority, change) });
const begin = (c, p, authorization, extra = {}) => beginAttempt({ anchorRoot: c.anchor, repositoryRoot: c.checkout, checkoutOwner: c.owner,
  branch: p.branch, head: p.head, tree: p.tree, acceptedMain: p.base, runId: "synthetic-guide-successor", contractFingerprint: "6".repeat(64),
  sourceCorrection: p, guideAuthorization: authorization, ...extra });

// Tiny stored-ZIP fixture writer; no shell utility, extraction or arbitrary load.
function zip(members) {
  const chunks = [], directory = []; let offset = 0;
  for (const [name, value] of Object.entries(members)) {
    const filename = Buffer.from(name), bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
    let crc = 0xffffffff;
    for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
    crc = (crc ^ 0xffffffff) >>> 0;
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(bytes.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(filename.length, 26);
    const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(bytes.length, 20); central.writeUInt32LE(bytes.length, 24); central.writeUInt16LE(filename.length, 28); central.writeUInt32LE(offset, 42);
    chunks.push(local, filename, bytes); directory.push(central, filename); offset += local.length + filename.length + bytes.length;
  }
  const listing = Buffer.concat(directory), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(Object.keys(members).length, 8); end.writeUInt16LE(Object.keys(members).length, 10); end.writeUInt32LE(listing.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, listing, end]);
}
const REPAIR_PATHS = ["docs/CANONICAL_BROWSER_VERIFICATION_OWNERSHIP_V1.md", "scripts/project-experience-request-verdict-v1.mjs", "scripts/test-project-experience-guide-lifecycle-v1.mjs"];
const INPUTS = ["scripts/test-project-experience-guide-lifecycle-v1.mjs", "scripts/project-experience-guide-lifecycle-v1.mjs", "scripts/project-experience-host-round-trip-pins-v1.mjs", "scripts/project-experience-inspector-lifecycle-v1.mjs", "scripts/operator-execution-result-contract-v1.mjs", "scripts/browser-validate-project-experience-v1.mjs", "components/guide/use-project-guide-brief-v0-2.ts", "scripts/canonical-child-runner.mjs", "scripts/canonical-test-environment.mjs", "scripts/local-canonical-checkout-ownership.mjs", "package-lock.json", "node_modules/typescript/package.json"];
const ORIGINAL_MEMBERS = { receipt: "prior-lineage/original-receipt.json", attempt: "prior-lineage/attempt_reference.json", completion: "prior-lineage/completion_reference.json", edge: "prior-lineage/edge_reference.json", log: "evidence/original-native-host.log", extraction: "evidence/derived-extraction.json", result: "evidence/derived-child-result.json" };
const COMPARISON_MEMBERS = { before: "evidence/comparison/before.json", after: "evidence/comparison/after.json", summary: "evidence/comparison/summary.json", completion: "evidence/comparison/completion.json", interpretation_correction: "evidence/comparison-interpretation-correction.json", fixture: "source/scripts/test-project-experience-guide-lifecycle-v1.mjs" };
function syntheticV5(root, branch, priorHead, priorTree, oldRoot, inputsFingerprint) {
  const user = { login: "synthetic-fixture", id: 7, type: "User" };
  const review = { id: 11, user, body: "SYNTHETIC retained diagnosis", commit_id: oldRoot.head, submitted_at: time(-50000) };
  const grant = { id: 12, user, body: "SYNTHETIC consumed v5 grant", updated_at: time(-49000) };
  const condition_authority = { accepted_diagnosis: conditionAuthorityObservation(review, "accepted_diagnosis"), execution_grant: conditionAuthorityObservation(grant, "execution_grant") };
  const p = { schema: "augnes.local-canonical-source-correction.v5", kind: "condition_requalification", branch, base: oldRoot.head, head: priorHead, tree: priorTree,
    prior_family_id: oldRoot.family_id, prior_number: 1, prior_attempt_id: oldRoot.attempt_id, prior_receipt_fingerprint: "2".repeat(64),
    originals: Object.fromEntries(["receipt", "attempt", "completion", "log", "result"].map(key => [key, { artifact: `synthetic-${key}.json`, sha256: "3".repeat(64) }])),
    condition: { phase: "e2e-operator-work-expectation", subphase: "work_expectation_recording", failure: "operator-work-expectation:Error:operator_condition_timeout:hydrated_expectation_project_home",
      predicate: '[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-project-management-hydrated="true"]', condition_ms: 45000, child_ms: 360000, historical_cause: "UNKNOWN" },
    diagnosis: { head: oldRoot.head, tree: oldRoot.tree, archive: { artifact: "synthetic.zip", sha256: "4".repeat(64) }, review: { id: 11, sha256: digest(condition_authority.accepted_diagnosis) } },
    final_source: { artifact: "synthetic-final.json", sha256: "5".repeat(64) }, authorization: { grant_comment_id: 12, grant_sha256: digest(condition_authority.execution_grant) }, pull_request: 999, budget: { initial: 1, recovery: 0 } };
  const family_id = digest([oldRoot.contract, "hynk-studio/augnes", branch, "verified_source_correction", p.prior_attempt_id, priorHead, priorTree]);
  const prior = { contract: oldRoot.contract, family_id, attempt_id: "synthetic-v5-predecessor", number: 1, branch, head: priorHead, tree: priorTree,
    contract_fingerprint: inputsFingerprint, started_at: time(-40000), prior_attempt_id: null, prior_receipt_fingerprint: null, recovery: null, source_correction: p,
    condition_authority, budget: { initial: 1, recovery: 0 } };
  assert(validConditionRequalificationAttempt(prior));
  const family = path.join(root, ".augnes-local-verification/families", family_id);
  write(path.join(family, "attempt-1.json"), prior);
  write(path.join(root, ".augnes-local-verification/families", oldRoot.family_id, "correction-successor.json"), {
    contract: "augnes.local-canonical-successor.v2", kind: "condition_requalification", family_id, head: priorHead, tree: priorTree, proof_fingerprint: digest(p) });
  return { prior, family };
}
function authority(p, repairDelta) {
  const user = { login: "synthetic-fixture", id: 7, type: "User" };
  const repair = { id: 101, user, author_association: "OWNER", state: "COMMENTED", commit_id: p.repair.head, submitted_at: time(-2000),
    pull_request_url: "https://api.github.com/repos/hynk-studio/augnes/pulls/999", body: `SYNTHETIC SOURCE / CONTRACT / DEVELOPMENT EVIDENCE ACCEPTED for the exact three-path correction below.
${p.repair.head} ${p.repair.tree} ${p.repair.archive.sha256} ${repairDelta.sha256}
${REPAIR_PATHS.join("\n")}
The retained Mac 243ms FAIL / 242ms PASS comparison is accepted as development evidence.
The historical refresh caller, absent historical private pins and exact original failure causation remain UNKNOWN.` };
  p.repair.review = { id: repair.id, sha256: digest(observation(repair, "accepted_repair")) };
  const grant = { id: 203, user, author_association: "OWNER", updated_at: time(-1000), issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/999",
    body: `## User execution authorization: reviewed GuideBrief correction qualification
SYNTHETIC https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-101
${p.branch} ${p.repair.head} ${p.repair.tree} ${p.repair.archive.sha256} ${p.prior_family_id} ${p.prior_attempt_id} ${p.prior_receipt_fingerprint}
${REPAIR_PATHS.join("\n")}
Budget: ONE admitted Full; ZERO additional automatic or explicit recovery/retry.
It does **not** renew spent grant from the synthetic predecessor.
No separate policy-only Full, prior deployment, second final-source execution grant or routine intermediate independent-review handoff is required.
ChatGPT's independent audit of the added policy/source and actual results occurs AFTER completion.
A new interrupted reservation remains consumed; another HEAD, branch, worktree, proof, copied grant or successor kind cannot renew this authorization.
No second Full or recovery follows under this authority.
After settlement, run separate fresh-process stock on the actual new receipt, including a usable failed receipt.` };
  p.authorization = { grant_comment_id: grant.id, grant_sha256: digest(observation(grant, "execution_grant")) };
  return { repair, grant, pr: { number: 999, state: "open", draft: true, merged: false, auto_merge: null,
    head: { sha: p.head, ref: p.branch, repo: { full_name: "hynk-studio/augnes" } }, base: { sha: p.base, ref: "main", repo: { full_name: "hynk-studio/augnes" } } } };
}
function make(root) {
  const checkout = path.join(root, "checkout"), anchor = path.join(root, "anchor"); mkdirSync(checkout); mkdirSync(anchor);
  const owner = acquireCheckoutVerificationOwnership({ repositoryRoot: checkout });
  const git = (...args) => execFileSync("git", args, { cwd: checkout, timeout: 4000, maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const branch = "codex/synthetic-guide-correction"; git("init", "-b", branch);
  for (const name of new Set([...INPUTS, ...REPAIR_PATHS, "scripts/canonical-database-migrations.mjs"])) write(path.join(checkout, name), `// synthetic initial ${name}\n`);
  const commit = () => { git("add", "scripts", "docs", "components", "package-lock.json"); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "synthetic fixture"); return git("rev-parse", "HEAD").toString().trim(); };
  const base = commit(), baseTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  const oldRoot = beginAttempt({ anchorRoot: anchor, repositoryRoot: checkout, checkoutOwner: owner, branch, head: base, tree: baseTree, runId: "synthetic-pre-v5", contractFingerprint: "1".repeat(64) });
  finishAttempt(oldRoot, { receiptFingerprint: "2".repeat(64), disposition: "product_failure", cleanupComplete: true });
  write(path.join(checkout, "scripts/canonical-database-migrations.mjs"), "// synthetic retained migration implementation\n");
  const priorHead = commit(), priorTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  const resources = ["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable", "browser-executable"].map(id => ({ id, classification: "safety", before: { present: false }, location_fingerprint: digest(id) }));
  const declaration = { contract: "augnes.local-canonical-inputs.v3", path_kind: "isolated-model-free-v1", binding: { head: priorHead, tree: priorTree,
    executor_fingerprint: "a".repeat(64), phase_environment_fingerprints: BROWSER_REPLACEMENT_PHASES.map(id => ({ id, fingerprint: "b".repeat(64) })) }, resources };
  const { prior, family } = syntheticV5(anchor, branch, priorHead, priorTree, oldRoot, digest(declaration));
  const folder = path.join(checkout, ".augnes-local-verification/guide"); mkdirSync(folder, { recursive: true });
  const phase = "e2e-operator-native-host-execution";
  const result = { validation_version: "operator_execution_browser_validation.v1", child_id: "operator-native-host-execution", ok: false,
    failure: "final_gate:AssertionError:operator_unexpected_request_failure_count  2 !== 0 ", unexpected_request_failure_count: 2, acceptance_bound_ms: 360000,
    owned_process_residue_count: 0, listener_residue_count: 0,
    request_response_console_page_refusal_summary: { unexpected_request_failures: [1, 2].map(n => ({ evidence_version: "operator_request_failure_evidence.v1",
      initiator_consumers: ["components/guide/use-project-guide-brief-v0-2.ts"], request_id: `synthetic-${n}`, method: "GET", path: "/api/augnes/read/guide-brief",
      phase: "executed_reviewed_follow_up", initiating_phase: "executed_reviewed_follow_up", observation_phase: "executed_reviewed_follow_up", error_text: "net::ERR_ABORTED",
      response_status: null, response_classification: null, error_code: null, navigation_epoch: 1, delivery_sequence: n, delivery_cardinality: 1, duplicate_delivery_count: 0, request_type: "Fetch" })),
      unexpected_request_failure_capture: { total: 2, captured: 2, omitted: 0, complete: true } } };
  for (const key of ["unexpected_external_request_count", "unexpected_console_failure_count", "unexpected_page_failure_count", "unexpected_refusal_accounting_failure_count", "unowned_effect_count"]) result[key] = 0;
  for (const key of ["cleanup_complete", "owned_streams_settled", "temporary_root_removed", "temporary_process_root_removed", "temporary_profile_removed", "temporary_database_removed", "temporary_fixture_removed", "temporary_signal_removed", "temporary_transport_removed", "runtime_shutdown_complete", "chrome_cdp_shutdown_complete", "default_database_isolated"]) result[key] = true;
  const start = `[canonical:${phase}] child_start label="independent operator native-host execution Browser child" timeout_ms=360000\n`;
  const normalized = start + JSON.stringify(result, null, 2) + '\n' + `[canonical:${phase}] child_result label="independent operator native-host execution Browser child" duration_ms=250000 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n` + JSON.stringify({ suite: phase, resource_cleanup: [{ completed: true, failure_count: 0, failures: [] }] }) + '\n';
  const interleaved = "SYNTHETIC interleaved stderr: preserved original bytes\n", log = start + interleaved + normalized.slice(start.length);
  const logRelative = `.augnes-local-verification/logs/${prior.attempt_id}/${phase}.log`; write(path.join(checkout, logRelative), log);
  const receipt = finalizeReceipt({ ...structuredClone(baseReceipt), receipt_version: 4,
    repository: { ...baseReceipt.repository, branch, head_sha: priorHead, tree_sha: priorTree, base_sha: base }, evidence: { ...baseReceipt.evidence, mode: "full", selected_plan: "full-canonical" },
    verification_context: { kind: "isolated-worktree" }, executor: { ...baseReceipt.executor, source_fingerprint: "a".repeat(64) }, run: { ...baseReceipt.run, id: prior.attempt_id }, attempt: prior,
    inputs: { ...declaration, fingerprint: digest(declaration), checks: 2, first_fault: null, secondary_faults: [], events: [] },
    outcome: { disposition: "product_failure", safety: "preserved_within_observed_scope", validity: "valid_within_observed_scope", first_fault: null }, checkout_ownership: { released: true }, capacity_ownership: { released: true },
    cleanup: { completed: true, remaining_owned_processes: 0, companion_service: { restored: true }, isolated_resources: { completed: true, failure_count: 0, failures: [] } },
    phases: BROWSER_REPLACEMENT_PHASES.map((id, i) => ({ id, status: i < 11 ? "pass" : i === 11 ? "failure" : "not_run", exit_status: i < 11 ? 0 : i === 11 ? 1 : null,
      failure_code: i === 11 ? "phase_failed" : null, timed_out: false, spawn_error_code: null, environment_fingerprint: i > 11 ? null : "b".repeat(64),
      ...(i === 11 ? { log: { relative_path: logRelative, bytes: Buffer.byteLength(log), truncated: false } } : {}), cleanup: { completed: true, remaining_owned_processes: 0, exit_observed: i <= 11, streams_closed: i <= 11, termination_reason: i <= 11 ? "natural_exit" : null } })),
    final: { result: "failure", exit_status: 1, reason_codes: ["phase_failed", "selected_phases_incomplete"] } });
  const completion = { contract: prior.contract, attempt_id: prior.attempt_id, receipt_fingerprint: receipt.integrity.content_fingerprint, disposition: "product_failure", cleanup_complete: true, infrastructure_code: null, finished_at: time(-30000) };
  write(path.join(family, "completion-1.json"), completion);
  for (const [kind, value] of Object.entries({ receipt, attempt: prior, completion, log, result })) write(path.join(folder, `original-${kind}.${kind === "log" ? "log" : "json"}`), value);
  cpSync(path.join(anchor, ".augnes-local-verification/families", oldRoot.family_id, "correction-successor.json"), path.join(folder, "original-edge.json"));
  const extraction = { derived_not_original: true, raw_log_sha256: digest(log), raw_log_bytes: Buffer.byteLength(log), source_path: logRelative,
    removed_interleaved_stderr: { start_byte_inclusive: Buffer.byteLength(start), end_byte_exclusive: Buffer.byteLength(start + interleaved), bytes: Buffer.byteLength(interleaved), sha256: digest(interleaved) }, normalized_copy_sha256: digest(normalized), child_json_offset_in_derivative: Buffer.byteLength(start), historical_private_pin_reconstruction: false, historical_verdict_rerun: false, historical_result: result.failure };
  write(path.join(folder, "original-extraction.json"), extraction);
  for (const name of REPAIR_PATHS) write(path.join(checkout, name), `// synthetic reviewed correction ${name}\n`);
  const repairHead = commit(), repairTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  write(path.join(checkout, "scripts/local-canonical-guide-correction.mjs"), "// synthetic new bounded policy\n");
  const head = commit(), tree = git("rev-parse", "HEAD^{tree}").toString().trim();
  const delta = (a, b) => { const bytes = git("diff", "--binary", "--no-ext-diff", "--no-textconv", a, b, "--"); return { sha256: digest(bytes), bytes: bytes.length, changed_paths: git("diff", "--name-only", a, b, "--").toString().trim().split("\n").filter(Boolean).sort() }; };
  const source = { schema: "augnes.guide-correction-final-source.v1", basis: "implementation_owner_not_independent_review", base, head, tree, predecessor_head: priorHead, predecessor_tree: priorTree,
    repair_head: repairHead, repair_tree: repairTree, deltas: { repair: delta(priorHead, repairHead), predecessor: delta(priorHead, head), reviewed: delta(repairHead, head), main: delta(base, head) } };
  write(path.join(folder, "final-source.json"), source);
  const ref = artifact => ({ artifact, sha256: digest(readFileSync(path.join(folder, artifact))) });
  const c = { checkout, anchor, owner, git, commit, delta, source, prior, family, receipt, folder, file: path.join(folder, "proof.json"), logRelative, ref };
  buildComparison(c);
  c.proof = { schema: GUIDE_CORRECTION_SCHEMA, kind: "guide_cancellation_correction", branch, base, head, tree, prior_family_id: prior.family_id, prior_number: 1, prior_attempt_id: prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    originals: Object.fromEntries(Object.keys(ORIGINAL_MEMBERS).map(kind => [kind, ref(`original-${kind}.${kind === "log" ? "log" : "json"}`)])),
    repair: { head: repairHead, tree: repairTree, review: null, archive: null }, comparison: { ...Object.fromEntries(Object.keys(COMPARISON_MEMBERS).map(kind => [kind, ref(`comparison-${kind}.${kind === "fixture" ? "mjs" : "json"}`)])), finished_at: c.after.ended_at },
    final_source: ref("final-source.json"), authorization: null, pull_request: 999, budget: { initial: 1, recovery: 0 } };
  rebuildArchive(c); c.authority = authority(c.proof, source.deltas.repair); save(c); return c;
}
function buildComparison(c) {
  const environment = "e".repeat(64), verdict = REPAIR_PATHS[1];
  const cleanup = [{ completed: true, failure_count: 0, failures: [] }];
  const records = [false, true].map(expected => {
    const label = expected ? "after" : "before", head = expected ? c.source.repair_head : c.prior.head;
    const observed = { mode: "--supersession-verdict-source", fixture: "actual_hook_cleanup_replay_explicit_refresh", observed: [1, 2].map(read => ({ read, expected,
      reason: expected ? "expected_guide_replay_refresh_supersession" : read === 1 ? "guide_duplicate_event" : "guide_generation_mismatch", ...(expected ? { canceled_reads: 2, replacement_completed_and_adopted: true } : {}) })),
      requests: 3, bound_cancellations: 2, adopted_read: 3, actual_producer_collector_private_pins: true, final_body_parse_commit: true,
      synthetic_controlled_schedule: true, historical_browser_recreation: false, production_attempt: false,
      created_reads: [{ read: 1, effect: 1, cause: "initial_effect" }, { read: 2, effect: 2, cause: "initial_effect" }, { read: 3, effect: 2, cause: "explicit_refresh" }], aborted_reads: [1, 2] };
    const record = { label, head, source_sha256: digest(c.git("show", `${head}:${verdict}`)), started_at: time(expected ? -8000 : -12000), ended_at: time(expected ? -7000 : -11000),
      source_inputs_unchanged: true, ...(expected ? { environment_sha256: environment } : {}), observations: [observed],
      result: { label, exit_code: expected ? 0 : 1, signal: null, timed_out: false, cancelled: false, duration_ms: 10,
        spawn_error_code: null, exit_observed: true, streams_closed: true, cleanup_started: true, cleanup_completed: true, remaining_owned_processes: 0, termination_reason: "natural_exit" } };
    write(path.join(c.folder, `comparison-${label}.json`), record); return record;
  });
  const node = realpathSync(process.execPath), [before, after] = records; c.before = before; c.after = after;
  const summary = { development_only: true, qualification_or_successor: false, node: "v24.22.1", node_path: node, node_sha256: digest(readFileSync(node)), npm: "11.16.0", cwd: c.checkout,
    argv: [node, path.join(c.checkout, REPAIR_PATHS[2]), "--supersession-verdict-source", path.join(c.folder, "selected-verdict.mjs")], environment_sha256: environment,
    source_inputs: Object.fromEntries(INPUTS.map(name => [name, digest(readFileSync(path.join(c.checkout, name)))])), results: [before], cleanup, released: { released: true }, settled: true };
  write(path.join(c.folder, "comparison-summary.json"), summary);
  const completion = { development_only: true, original_summary_sha256: digest(readFileSync(path.join(c.folder, "comparison-summary.json"))), before_record_sha256: digest(readFileSync(path.join(c.folder, "comparison-before.json"))),
    after, environment_sha256: environment, cleanup, released: { released: true }, settled: true, historical_session_recreated: false, qualification_allowance: 0,
    resource_owner_correction: "SYNTHETIC initial wrapper capability refusal preserved before after child spawned." };
  write(path.join(c.folder, "comparison-completion.json"), completion);
  write(path.join(c.folder, "comparison-interpretation_correction.json"), { preserved_record: "comparison/completion.json", preserved_sha256: digest(readFileSync(path.join(c.folder, "comparison-completion.json"))),
    correction: "SYNTHETIC Numeric inode comparison is unavailable. Original record remains unchanged.", historical_session_recreation: false });
  write(path.join(c.folder, "comparison-fixture.mjs"), c.git("show", `${c.source.repair_head}:${REPAIR_PATHS[2]}`));
}
function rebuildArchive(c, change = members => members) {
  const members = {};
  for (const [key, name] of Object.entries(ORIGINAL_MEMBERS)) members[name] = readFileSync(path.join(c.folder, c.proof.originals[key].artifact));
  for (const [key, name] of Object.entries(COMPARISON_MEMBERS)) members[name] = readFileSync(path.join(c.folder, c.proof.comparison[key].artifact));
  for (const [label, head] of [["before", c.prior.head], ["after", c.proof.repair.head]]) {
    members[`evidence/comparison/${label}.mjs`] = c.git("show", `${head}:${REPAIR_PATHS[1]}`);
    members[`evidence/comparison/${label}.stdout`] = Buffer.from(JSON.stringify(read(path.join(c.folder, `comparison-${label}.json`)).observations[0]) + "\n");
  }
  members["evidence/comparison-console.log"] = Buffer.from('SYNTHETIC child_spawn label="before" pid=1\nError: resource_owner_invalid\n');
  members["evidence/comparison-after-console.log"] = Buffer.from('SYNTHETIC child_spawn label="after" pid=2\n');
  for (const name of new Set([...INPUTS, ...REPAIR_PATHS])) members[`source/${name}`] = name.startsWith("node_modules/") ? readFileSync(path.join(c.checkout, name)) : c.git("show", `${c.proof.repair.head}:${name}`);
  members["evidence/final-source.json"] = Buffer.from(JSON.stringify({ head: c.proof.repair.head, tree: c.proof.repair.tree, starting_head: c.prior.head, starting_tree: c.prior.tree,
    deltas: { "starting-to-candidate": { ...c.source.deltas.repair, paths: c.source.deltas.repair.changed_paths } } }));
  change(members);
  members["MANIFEST.json"] = Buffer.from(JSON.stringify({ kind: "private_offline_development_return", qualification: false, original_evidence_retained: true,
    head: c.proof.repair.head, tree: c.proof.repair.tree, entries: Object.entries(members).map(([name, bytes]) => ({ name, bytes: bytes.length, sha256: digest(bytes) })) }));
  write(path.join(c.folder, "accepted-packet.zip"), zip(members)); c.proof.repair.archive = c.ref("accepted-packet.zip");
}
function bindCandidate(c) {
  c.proof.head = c.commit(); c.proof.tree = c.git("rev-parse", "HEAD^{tree}").toString().trim();
  Object.assign(c.source, { head: c.proof.head, tree: c.proof.tree });
  c.source.deltas.predecessor = c.delta(c.prior.head, c.proof.head); c.source.deltas.reviewed = c.delta(c.proof.repair.head, c.proof.head); c.source.deltas.main = c.delta(c.proof.base, c.proof.head);
  write(path.join(c.folder, "final-source.json"), c.source); c.proof.final_source = c.ref("final-source.json"); c.authority.pr.head.sha = c.proof.head; save(c);
}

if (process.argv[2] === "--stock-guide-fixture") {
  const packet = read(process.argv[3]), before = treeFiles(packet.anchor), p = readSourceCorrectionProof(packet.file, packet.checkout);
  const authorization = await authorizeGuideCorrection(p, { transport: transport(packet.authority) });
  assert(inspectAttemptRecords({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, receipt: read(packet.receipt), guideAuthorization: authorization }));
  assert.deepEqual(treeFiles(packet.anchor), before); console.log("fresh stock reconstructs without writes");
} else if (process.argv[2] === "--claim-guide-fixture") {
  const packet = read(process.argv[3]); let owner;
  try {
    owner = acquireCheckoutVerificationOwnership({ repositoryRoot: packet.checkout });
    const p = readSourceCorrectionProof(packet.file, packet.checkout), authorization = await authorizeGuideCorrection(p, { transport: transport(packet.authority) });
    const attempt = beginAttempt({ anchorRoot: packet.anchor, repositoryRoot: packet.checkout, checkoutOwner: owner, branch: p.branch, head: p.head, tree: p.tree,
      acceptedMain: p.base, runId: packet.run_id, contractFingerprint: "6".repeat(64), sourceCorrection: p, guideAuthorization: authorization });
    finishAttempt(attempt, { receiptFingerprint: "7".repeat(64), disposition: "product_failure", cleanupComplete: true }); console.log("exclusive_claim_won");
  } catch (error) { console.log(`exclusive_claim_refused:${error.code}`); process.exitCode = 1; }
  finally { if (owner) releaseCheckoutVerificationOwnership(owner, packet.checkout, { consumersSettled: true }); }
} else if (process.argv[2] === "--run-guide-fixtures") await guideControls(process.argv[3]);

export async function guideControls(group = "evidence") {
  assert(["evidence", "authority", "admission", "race", "stock"].includes(group));
  const owner = createCanonicalTestResourceRoot("ag-resource-test-"); beginCanonicalTestResourceUse(owner);
  let c, active = 0; const checks = [], pass = name => checks.push(name);
  const child = async (args, controlId) => {
    active++; let output = "";
    const result = await runCanonicalChild({ suite: "guide-correction-fixture", label: "synthetic fixture", command: process.execPath, args, cwd: owner.root,
      env: buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), timeoutMs: AUXILIARY_EXECUTION_BUDGETS.nestedChildMs,
      stdout: { write: chunk => output = (output + chunk).slice(-4000) }, stderr: { write: chunk => output = (output + chunk).slice(-4000) }, log() {} });
    if (result.cleanup_completed && result.exit_observed && result.streams_closed && result.remaining_owned_processes === 0) active--;
    console.log("AUGNES_REVIEW_CHILD_RESULT " + JSON.stringify(projectReviewChildResult(result, { controlId })));
    assertReviewChildLifecycle(result, { controlId }); return { ...result, output };
  };
  try {
    c = make(owner.root); const saved = structuredClone(c.proof), savedAuthority = structuredClone(c.authority), validated = proof(c), authorized = await authorize(c, validated);
    const edge = path.join(c.family, "correction-successor.json"), savedFiles = new Map(readdirSync(c.folder).map(name => [name, readFileSync(path.join(c.folder, name))]));
    const reset = () => { for (const [name, bytes] of savedFiles) write(path.join(c.folder, name), bytes); c.proof = structuredClone(saved); c.authority = structuredClone(savedAuthority); };
    const mutateEvidence = (collection, key, mutate) => { const ref = c.proof[collection][key], value = read(path.join(c.folder, ref.artifact)); mutate(value);
      write(path.join(c.folder, ref.artifact), value); c.proof[collection][key] = c.ref(ref.artifact); rebuildArchive(c); save(c); };
    assert(reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch }).condition_requalification_consumed); assert(!existsSync(edge));
    pass("eligible reviewed correction over authentic-shaped synthetic terminal v5 history; reads do not reserve");
    if (group === "evidence") {
      for (const [name, mutate] of [
        ["old schema", p => p.schema = "augnes.local-canonical-source-correction.v2"], ["v5 relabel", p => p.schema = "augnes.local-canonical-source-correction.v5"],
        ["wrong kind", p => p.kind = "condition_requalification"], ["receipt digest", p => p.originals.receipt.sha256 = "0".repeat(64)],
        ["original edge digest", p => p.originals.edge.sha256 = "0".repeat(64)], ["original log digest", p => p.originals.log.sha256 = "0".repeat(64)],
        ["archive digest", p => p.repair.archive.sha256 = "0".repeat(64)], ["witness digest", p => p.comparison.before.sha256 = "0".repeat(64)],
        ["unknown source tree", p => p.tree = p.base], ["unreviewed repair", p => p.repair.head = p.head],
        ["copied spent grant", p => p.authorization.grant_comment_id = c.prior.source_correction.authorization.grant_comment_id],
        ["second allowance", p => p.budget.initial = 2], ["recovery", p => p.budget.recovery = 1],
      ]) { reset(); mutate(c.proof); save(c); assert.throws(() => proof(c), undefined, name); pass(`refuse ${name}`); }
      reset();
      for (const [name, change] of [["wrong phase", r => r.phases[11].id = "integration"], ["outer timeout", r => r.phases[11].timed_out = true], ["missing later phase", r => r.phases.pop()],
        ["cleanup incomplete", r => r.cleanup.completed = false], ["unresolved input fault", r => r.inputs.first_fault = { disposition: "unknown_relevance" }], ["non-v5 predecessor", r => r.attempt.source_correction = null]]) {
        const r = structuredClone(c.receipt); change(r); assert.throws(() => validateGuidePredecessor(finalizeReceipt(r)), undefined, name); pass(`refuse ${name}`);
      }
      for (const kind of ["repair", "predecessor", "reviewed", "main"]) {
        reset(); const source = read(path.join(c.folder, "final-source.json")); source.deltas[kind].sha256 = "0".repeat(64);
        write(path.join(c.folder, "final-source.json"), source); c.proof.final_source = c.ref("final-source.json"); save(c); assert.throws(() => proof(c), /guide_native_delta_invalid/);
      }
      pass("all four native deltas are bound separately"); reset();
      mutateEvidence("originals", "extraction", r => r.removed_interleaved_stderr.sha256 = "0".repeat(64)); assert.throws(() => proof(c), /guide_original_extraction_invalid/); pass("altered derived removal cannot rewrite original log"); reset();
      mutateEvidence("comparison", "after", r => r.result.timed_out = true); assert.throws(() => proof(c)); pass("timed-out after witness is not natural success"); reset();
      rebuildArchive(c, members => { members["source/components/guide/use-project-guide-brief-v0-2.ts"] = Buffer.from("// changed hook\n"); }); save(c);
      assert.throws(() => proof(c), /guide_comparison_dependency_changed/); pass("accepted witness dependency closure is bound"); reset();
      write(path.join(c.checkout, REPAIR_PATHS[1]), "// modified reviewed verdict\n"); bindCandidate(c); assert.throws(() => proof(c), /guide_retained_source_changed/); pass("reviewed repair bytes cannot change in final candidate");
    }
    if (group === "authority") {
      for (const [name, change] of [["changed grant body", (r, u) => u.includes("/comments/") ? { ...r, body: r.body + "changed" } : r],
        ["unprivileged", (r, u) => u.endsWith("/permission") ? { ...r, permission: "read" } : r], ["bot authority", r => r.user ? { ...r, user: { ...r.user, type: "Bot" } } : r],
        ["wrong review source", (r, u) => u.includes("/reviews/") ? { ...r, commit_id: c.proof.head } : r],
        ["unpublished head", (r, u) => u.endsWith("/pulls/999") ? { ...r, head: { ...r.head, sha: c.proof.base } } : r],
        ["wrong base", (r, u) => u.endsWith("/pulls/999") ? { ...r, base: { ...r.base, sha: c.proof.head } } : r],
        ["ready", (r, u) => u.endsWith("/pulls/999") ? { ...r, draft: false } : r], ["auto merge", (r, u) => u.endsWith("/pulls/999") ? { ...r, auto_merge: {} } : r]]) {
        await assert.rejects(authorize(c, validated, change), undefined, name); pass(`refuse ${name}`);
      }
      c.authority.grant.body = "Generic approval"; c.proof.authorization.grant_sha256 = digest(observation(c.authority.grant, "execution_grant")); save(c);
      await assert.rejects(authorize(c, proof(c)), /guide_authority_scope_invalid/); reset(); pass("generic privileged approval is not separate specific authority");
      assert.throws(() => begin(c, validated, { observations: authorized.observations }), /guide_authenticated_authority_required/);
      assert.throws(() => begin(c, validated, authorized, { acceptedMain: "f".repeat(40) })); assert(!existsSync(edge)); pass("forged capability and stale main refuse without reservation");
    }
    if (group === "admission" || group === "stock") {
      const originalFiles = treeFiles(c.anchor);
      assert.throws(() => begin(c, validated, authorized, { sourceCorrection: null }));
      for (const schema of ["v1", "v2", "v3", "v4", "v5"]) assert.throws(() => begin(c, { ...validated, schema: `augnes.local-canonical-source-correction.${schema}` }, authorized));
      assert(!existsSync(edge)); pass("legacy kinds cannot reopen spent v5");
      const completionFile = path.join(c.family, "completion-1.json"), completionBytes = readFileSync(completionFile);
      rmSync(completionFile); assert.throws(() => begin(c, validated, authorized)); write(completionFile, completionBytes); pass("unsettled predecessor cannot consume grant");
      const attempt = begin(c, validated, authorized); assert(validGuideCorrectionAttempt(attempt)); assert.deepEqual(attempt.budget, { initial: 1, recovery: 0 });
      assert.throws(() => begin(c, validated, authorized)); pass("exclusive initial attempt, duplicate and unfinished repeat refuse");
      const current = finalizeReceipt({ ...structuredClone(c.receipt), repository: { ...c.receipt.repository, head_sha: c.proof.head, tree_sha: c.proof.tree }, run: { ...c.receipt.run, id: attempt.attempt_id }, attempt,
        inputs: { ...c.receipt.inputs, binding: { ...c.receipt.inputs.binding, head: c.proof.head, tree: c.proof.tree } } });
      finishAttempt(attempt, { receiptFingerprint: current.integrity.content_fingerprint, disposition: "product_failure", cleanupComplete: true });
      assert(reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch }).guide_correction_consumed);
      assert.throws(() => begin(c, validated, authorized)); assert.throws(() => begin(c, validated, authorized, { sourceCorrection: null })); pass("settled new grant terminal, original v5 remains consumed");
      for (const original of originalFiles) assert.equal(digest(readFileSync(path.join(c.anchor, original.file))), original.sha256); pass("all previous receipt/attempt/completion/edge bytes preserved");
      const successorRoot = path.join(c.anchor, ".augnes-local-verification/families", attempt.family_id), attemptFile = path.join(successorRoot, "attempt-1.json"), attemptBytes = readFileSync(attemptFile);
      if (group === "admission") {
        rmSync(attemptFile); assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch })); assert.throws(() => begin(c, validated, authorized)); write(attemptFile, attemptBytes);
        pass("crash after exclusive reservation stays consumed");
        write(path.join(successorRoot, "correction-successor.json"), { contract: "augnes.local-canonical-successor.v2", kind: "condition_requalification" });
        assert.throws(() => reconstructAttemptTip({ anchorRoot: c.anchor, branch: c.proof.branch })); rmSync(path.join(successorRoot, "correction-successor.json")); pass("different successor kind cannot renew new grant");
        write(path.join(c.checkout, "scripts/local-canonical-guide-correction.mjs"), "// synthetic later policy\n"); bindCandidate(c);
        const later = proof(c), laterAuthority = await authorize(c, later); assert.throws(() => begin(c, later, laterAuthority)); pass("new HEAD cannot renew consumed authority");
        c.authority.grant.id++; c.proof.authorization = { grant_comment_id: c.authority.grant.id, grant_sha256: digest(observation(c.authority.grant, "execution_grant")) }; save(c);
        const copy = proof(c), copyAuthority = await authorize(c, copy); assert.throws(() => begin(c, copy, copyAuthority)); pass("copied authenticated grant cannot renew consumption");
      } else {
        const ledger = treeFiles(c.anchor); assert(inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current, guideAuthorization: authorized }));
        assert(!inspectAttemptRecords({ anchorRoot: c.anchor, repositoryRoot: c.checkout, receipt: current })); assert.deepEqual(treeFiles(c.anchor), ledger);
        const inspected = inspectReceiptForDecision(current, { currentAttemptRecordsValid: true }); assert(!inspected.issues.includes("receipt_guide_correction_invalid")); assert(!inspected.valid_deciding_evidence);
        const exported = createPrivateReviewExport(current); assert(inspectPrivateReviewExport(exported).structurally_valid); assert(validGuideCorrectionAttempt(exported.attempt)); assert(!JSON.stringify(exported).includes("original-receipt.json"));
        pass("stock/export validate new route but failed outcome remains non-deciding");
        const receiptFile = path.join(c.folder, "successor-receipt.json"), packet = path.join(c.folder, "stock-packet.json"); write(receiptFile, current);
        write(packet, { checkout: c.checkout, anchor: c.anchor, file: c.file, authority: c.authority, receipt: receiptFile });
        const result = await child([self, "--stock-guide-fixture", packet], "guide-cold-stock"); assert.equal(result.exit_code, 0, result.output); assert.deepEqual(treeFiles(c.anchor), ledger); pass("separate cold stock reconstructs without writes or reservations");
      }
    }
    if (group === "race") {
      const raceAnchor = path.join(owner.root, "race-anchor"); cpSync(c.anchor, raceAnchor, { recursive: true });
      const packets = [];
      for (const index of [1, 2]) {
        const checkout = path.join(owner.root, `race-checkout-${index}`); cpSync(c.checkout, checkout, { recursive: true, filter: file => path.basename(file) !== CHECKOUT_OWNER_FILE });
        // Each synthetic authenticated packet binds its own checkout; neither
        // claim borrows another checkout's authority or ownership capability.
        const folder = path.join(checkout, ".augnes-local-verification/guide"), file = path.join(folder, "proof.json");
        const copy = { ...c, checkout, folder, file, proof: read(file), source: structuredClone(c.source),
          git: (...args) => execFileSync("git", args, { cwd: checkout, timeout: 4000, maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }),
          ref: artifact => ({ artifact, sha256: digest(readFileSync(path.join(folder, artifact))) }) };
        const summary = read(path.join(folder, "comparison-summary.json")); summary.cwd = checkout; summary.argv[1] = path.join(checkout, REPAIR_PATHS[2]); summary.argv[3] = path.join(folder, "selected-verdict.mjs"); write(path.join(folder, "comparison-summary.json"), summary);
        const completion = read(path.join(folder, "comparison-completion.json")); completion.original_summary_sha256 = copy.ref("comparison-summary.json").sha256; write(path.join(folder, "comparison-completion.json"), completion);
        const correction = read(path.join(folder, "comparison-interpretation_correction.json")); correction.preserved_sha256 = copy.ref("comparison-completion.json").sha256; write(path.join(folder, "comparison-interpretation_correction.json"), correction);
        for (const key of ["summary", "completion", "interpretation_correction"]) copy.proof.comparison[key] = copy.ref(`comparison-${key}.json`);
        rebuildArchive(copy); copy.authority = authority(copy.proof, copy.source.deltas.repair); save(copy);
        const packet = path.join(owner.root, `race-${index}.json`); write(packet, { checkout, anchor: raceAnchor, file, authority: copy.authority, run_id: `synthetic-race-${index}` }); packets.push(packet);
      }
      const results = await Promise.all(packets.map((packet, i) => child([self, "--claim-guide-fixture", packet], `guide-race-${i + 1}`)));
      assert.deepEqual(results.map(r => r.exit_code).sort(), [0, 1], results.map(r => r.output).join("\n")); assert.equal(results.filter(r => r.output.includes("exclusive_claim_won")).length, 1);
      pass("two separately owned checkouts compete for one exclusive predecessor edge");
    }
  } finally {
    if (c?.owner) releaseCheckoutVerificationOwnership(c.owner, c.checkout, { consumersSettled: active === 0 });
    if (!active) settleCanonicalTestResourceUse(owner, { cleanup_completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0 });
    assert(cleanupCanonicalTestResources([owner])[0].completed);
  }
  console.log(JSON.stringify({ guide_correction: checks, group, count: checks.length, synthetic_authority_only: true, cleanup_complete: true }));
}
