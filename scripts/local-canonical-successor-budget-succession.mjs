// One new, explicitly authorized complete-fixture budget decision. The r5
// timeout remains UNKNOWN and its operating-profile allowance stays consumed.
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { timeoutArtifact, timeoutAuthorityObservation, validateTimeoutPredecessor } from "./local-canonical-timeout-succession.mjs";
import { validOperatingProfileAttempt } from "./local-canonical-operating-profile-succession.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const BUDGET_SCHEMA = "augnes.local-canonical-successor-budget-succession.v1";
export const isSuccessorBudgetSuccession = p => p?.schema === BUDGET_SCHEMA && p.kind === "settled_successor_budget";
export const budgetArtifact = timeoutArtifact;
export const budgetAuthorityObservation = timeoutAuthorityObservation;
export const BUDGET_ACCEPTED = Object.freeze({
  head: "7d964f440b201651cb7c35ccf0e67f712bb9e479", tree: "6d95da444e84a04e74a5498433b12cb122690de0",
  base: "bbb7dee536817fe4b7f28f5353a1d88f56c7e44d", branch: "codex/1561-companion-result-successor",
  run: "2026-10-31T09-16-14-109Z-full-7d964f440b20-97c9214878bcfaf7",
  family: "a97434d53a1cabf9c5bdb43d77cdad795fd169ad7e7cfd712e99d89c57c5c2c0",
  receipt_sha256: "fcb5ccce4c8ba14855134a8520a3131b7b9db531b326f70a0afe6a7bb54620f5",
  receipt_fingerprint: "30dfeb311eea0bc05080ddd8f85d53692062b51ec8ae70f1ac040556a31f49a5",
  attempt_sha256: "d7532e22e859b2bc508a1fbe1ffaf21f70837b1636512c8f06b522da7fd49c0c",
  completion_sha256: "ea3516846da0130e8a164c95ddd8f1466335682f7944d53cee783222af9f064a",
  edge_sha256: "47da0bdf5f25ef0f8275b0f44c95afb90085c550704668d7057483d46798b49f",
  // Later retained-byte observation, 2026-10-31T19:45Z; the original receipt
  // records the integration log's path/length, not this subsequently read hash.
  retained_log_sha256: "5511d56047e1ab7ef0e402a894b36db0d09ef9c7b7d007cd11e39f3ee18f80b5",
  report_sha256: "0149c9a8f5809cb6c170cbd41fa7c41f3ed0d0a34d5077538d0ce0e9e5515c79",
  bundle_sha256: "c4b9ecfa10c3c8d765a16eaee21a87fd1ac665c0dec15457c60c9e5eee93a936",
  fixture_sha256: "c03585097db4caa2544dc459e7502d8944c63ec4b186fdafd041fc76dbfae29c",
  pull_request: 1562, review_id: 5724573102, grant_id: 6548163748,
  review_sha256: "97d0f770e29eeb82a4455fa81b58996fd4449f9e80ac64ad0c4bb91c9a87e629",
  grant_sha256: "b9ab820580de53f042e40db8d8b67bdaaa7e65ca5ad0a2ba393ff1a0e0c0fb61",
});
export const BUDGET_POLICY_PATHS = Object.freeze([
  ".github/LOCAL_CANONICAL_VERIFICATION.md", "docs/LOCAL_CANONICAL_INPUT_CONTRACT.md",
  "scripts/local-canonical-successor-budget-succession.mjs", "scripts/local-canonical-attempts.mjs",
  "scripts/local-canonical-receipt.mjs", "scripts/local-canonical-review-export.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/run-canonical-test-suite.mjs",
  "scripts/test-local-canonical-executor.mjs", "scripts/test-local-canonical-review-corrections.mjs",
  "scripts/test-local-canonical-verification-contract.mjs",
  "scripts/fixtures/local-canonical-successor-budget-succession.mjs",
]);
const LABEL = "settled failed result, expired history and explicit revalidated task authorship";
const FIXTURE = "scripts/test-vnext-project-work-initialization.ts";
const SUITE = "scripts/run-canonical-test-suite.mjs";
const CONTRACT = "scripts/test-local-canonical-verification-contract.mjs";
const capabilities = new WeakMap();
const fail = code => { throw Object.assign(new Error(code), { code }); };
const sha = x => typeof x === "string" && /^[a-f0-9]{64}$/u.test(x);
const commit = x => typeof x === "string" && /^[a-f0-9]{40}$/u.test(x);
const exact = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const keys = (x, ks) => x && typeof x === "object" && !Array.isArray(x) && exact(Object.keys(x).sort(), [...ks].sort());
const time = x => typeof x === "string" && Number.isFinite(Date.parse(x)) && Date.parse(x) <= Date.now();
const json = bytes => JSON.parse(bytes.toString("utf8"));
const natural = r => r?.exit_code === 0 && r.signal === null && r.timed_out === false && r.cancelled === false &&
  r.spawn_error_code === null && r.exit_observed === true && r.streams_closed === true && r.cleanup_completed === true &&
  r.remaining_owned_processes === 0 && r.termination_reason === "natural_exit";

// Pure validators support labeled synthetic controls, never authority issuance.
export function validateSuccessorBudgetPredecessor(original, prior, completion, p, logBytes) {
  validateTimeoutPredecessor(original);
  if (!validOperatingProfileAttempt(prior) || !exact(original.attempt, prior) || prior.family_id !== p.prior_family_id ||
      prior.number !== p.prior_number || prior.attempt_id !== p.prior_attempt_id || prior.branch !== p.branch ||
      original.integrity.content_fingerprint !== p.prior_receipt_fingerprint || completion.contract !== prior.contract ||
      completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== p.prior_receipt_fingerprint ||
      completion.disposition !== "product_failure" || completion.cleanup_complete !== true || !time(completion.finished_at) ||
      original.repository.head_sha !== p.diagnosis.head || original.repository.tree_sha !== p.diagnosis.tree ||
      original.repository.base_sha !== p.diagnosis.base) fail("budget_predecessor_binding_invalid");
  const log = original.phases.find(x => x.id === "integration").log;
  if (log?.truncated !== false || log.bytes !== logBytes.length ||
      log.relative_path !== `.augnes-local-verification/logs/${original.run.id}/integration.log`) fail("budget_original_log_binding_invalid");
  const starts = new Map(), results = new Map(), cleanups = new Set();
  let inventory = null, resources = 0, timeoutLatched = false;
  for (const line of logBytes.toString("utf8").split("\n")) {
    if (line.startsWith("[canonical:integration] child_start ")) {
      const m = line.match(/^\[canonical:integration\] child_start label=("(?:[^"\\]|\\.)*") timeout_ms=(\d+)$/u);
      if (!m || starts.has(JSON.parse(m[1])) || Number(m[2]) <= 0) fail("budget_nested_inventory_invalid");
      starts.set(JSON.parse(m[1]), Number(m[2]));
    }
    if (line.startsWith(`[canonical:integration] child_cleanup_start label=${JSON.stringify(LABEL)}`)) {
      const m = line.match(/ elapsed_ms=(\d+) reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false$/u);
      if (!m || Number(m[1]) < 30000 || starts.get(LABEL) !== 30000 || timeoutLatched || results.has(LABEL)) fail("budget_timeout_latch_invalid");
      timeoutLatched = true;
    }
    if (line.startsWith("[canonical:integration] child_cleanup_result ")) {
      const m = line.match(/^\[canonical:integration\] child_cleanup_result label=("(?:[^"\\]|\\.)*") elapsed_ms=(\d+) reason=(bounded_timeout|post_exit_settlement|post_close_settlement)(?: term_sent=(true|false) kill_sent=(true|false))? streams_closed=true remaining_owned_processes=0$/u);
      if (!m) fail("budget_nested_unsettled");
      const label = JSON.parse(m[1]);
      if (!starts.has(label) || cleanups.has(label) || results.has(label) || (label === LABEL ?
        !timeoutLatched || m[3] !== "bounded_timeout" || Number(m[2]) < 30000 || m[4] !== undefined :
        m[3] === "bounded_timeout" || m[4] === undefined)) fail("budget_nested_unsettled");
      cleanups.add(label);
    }
    if (line.startsWith("[canonical:integration] child_result ")) {
      const m = line.match(/^\[canonical:integration\] child_result label=("(?:[^"\\]|\\.)*") duration_ms=(\d+) exit_code=(0|null) signal=(null|SIGTERM) timed_out=(true|false) exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=(natural_exit|bounded_timeout)$/u);
      if (!m) fail("budget_nested_unsettled");
      const label = JSON.parse(m[1]);
      if (!starts.has(label) || !cleanups.has(label) || results.has(label) || (label === LABEL ?
        !timeoutLatched || Number(m[2]) < 30000 || m[3] !== "null" || m[4] !== "SIGTERM" || m[5] !== "true" || m[6] !== "bounded_timeout" :
        Number(m[2]) >= starts.get(label) || m[3] !== "0" || m[4] !== "null" || m[5] !== "false" || m[6] !== "natural_exit")) fail("budget_nested_unrelated_failure");
      results.set(label, label === LABEL ? "failed" : "passed");
    }
    if (line.startsWith("[canonical:integration] group_inventory ")) {
      if (inventory) fail("budget_nested_inventory_invalid"); inventory = JSON.parse(line.slice("[canonical:integration] group_inventory ".length));
    }
    if (line.startsWith("{")) {
      let x; try { x = JSON.parse(line); } catch { continue; }
      if (x.suite === "integration" && Object.hasOwn(x, "resource_cleanup")) {
        if (!Array.isArray(x.resource_cleanup) || !x.resource_cleanup.length || x.resource_cleanup.some(r => r.completed !== true || r.failure_count !== 0 || r.failures?.length !== 0)) fail("budget_nested_resource_unsettled");
        resources++;
      }
    }
  }
  if (starts.get(LABEL) !== 30000 || !timeoutLatched || starts.size !== results.size || starts.size !== cleanups.size || resources !== 1 ||
      !inventory || inventory.started_count !== starts.size || inventory.settled_count !== starts.size || inventory.completed_count !== starts.size || inventory.failed_count !== 1 ||
      !Array.isArray(inventory.children) || new Set(inventory.children.map(x => x.label)).size !== inventory.children.length || inventory.selected_count !== inventory.children.length ||
      inventory.unstarted_count !== inventory.children.filter(x => !x.started).length || inventory.children.some(x => x.started ?
        !results.has(x.label) || x.settled !== true || x.completed !== true || x.outcome !== results.get(x.label) : results.has(x.label)) ||
      [...results.keys()].some(label => !inventory.children.some(x => x.label === label))) fail("budget_nested_inventory_invalid");
  return { original, prior, completion };
}

export function validateSuccessorBudgetDiagnosis(bundle) {
  if (bundle?.schema !== "augnes.private-r6-evidence-bundle.v1" || bundle.report_id !== "AUGNES-1561-COMPANION-RESULT-SUCCESSOR-20261031" ||
      bundle.revision !== 6 || !commit(bundle.source_head) || bundle.reused_source?.path !== FIXTURE || !sha(bundle.reused_source.sha256) ||
      !Array.isArray(bundle.files) || bundle.files.length > 32 || !bundle.files.length) fail("budget_diagnosis_inventory_invalid");
  const files = new Map(); let total = 0;
  for (const f of bundle.files) {
    if (!keys(f, ["path", "byte_size", "sha256", "text"]) || typeof f.path !== "string" || !/^[A-Za-z0-9_./-]+$/u.test(f.path) ||
        f.path.startsWith("/") || f.path.split("/").some(x => !x || x === "." || x === "..") || files.has(f.path) || typeof f.text !== "string") fail("budget_diagnosis_inventory_invalid");
    const bytes = Buffer.from(f.text);
    if (bytes.length !== f.byte_size || digest(bytes) !== f.sha256 || (total += bytes.length) > 1024 * 1024) fail("budget_diagnosis_bytes_changed");
    files.set(f.path, bytes);
  }
  const required = name => { const bytes = files.get(name); if (!bytes) fail("budget_diagnosis_missing"); return bytes; };
  const results = [...files.keys()].filter(x => /^runs\/[A-Za-z0-9._-]+\/result\.json$/u.test(x));
  if (results.length !== 1) fail("budget_diagnosis_run_invalid");
  const directory = path.posix.dirname(results[0]), run = json(required(results[0])), source = json(required(`${directory}/source.json`)), env = json(required(`${directory}/environment.json`));
  const restoration = json(required("cleanup-and-restoration.json")), review = json(required("source-review.json"));
  if (run.schema !== "augnes.private.r6-focused-run.v1" || !natural(run.result) || run.timeout_ms !== 30000 || run.result.duration_ms >= 30000 ||
      run.focused_pass !== true || run.acceptance_failure !== null || run.errors?.length !== 0 || run.resource_root_exists_after !== false ||
      !run.cleanup?.length || run.cleanup.some(x => x.completed !== true || x.failure_count !== 0 || x.failures?.length !== 0) ||
      !time(run.started_at_utc) || !time(run.finished_at_utc) || Date.parse(run.finished_at_utc) <= Date.parse(run.started_at_utc) ||
      run.source_unchanged !== true || run.source_before_fingerprint !== digest(source) || run.source_after_fingerprint !== digest(source) ||
      !required(`${directory}/source.json`).equals(required(`${directory}/source-after.json`)) || run.cwd !== source.root ||
      run.environment_fingerprint !== digest(env) || !exact(run.environment_keys, Object.keys(env).sort()) ||
      run.tool_versions?.node !== CANONICAL_NODE_VERSION || run.tool_versions?.npm !== "11.16.0" || run.tool_versions?.platform !== "darwin" || run.tool_versions?.architecture !== "arm64" ||
      !sha(run.tool_versions.node_sha256) || env.NODE_ENV !== "test" || env.LANG !== "C" || env.LC_ALL !== "C" || env.TZ !== "UTC" ||
      !Array.isArray(run.args) || run.args.length !== 5 || !exact(run.args.slice(0, 4), ["--import", "tsx", FIXTURE, "--settled-expired-successor-only"]) ||
      !run.args[4].startsWith("--r6-trace=/") || source.head !== bundle.source_head ||
      source.diff_bytes !== required(`${directory}/source.diff`).length || source.diff_sha256 !== digest(required(`${directory}/source.diff`))) fail("budget_diagnosis_run_invalid");
  if (restoration.no_final_source_change !== true || restoration.repositories_equal_intake !== true || restoration.r5_receipt_unchanged !== true ||
      restoration.outer_owned_root_absent !== true || !exact(restoration.recorded_settlement, run.result) ||
      restoration.restored_fixture_bytes !== bundle.reused_source.byte_size || restoration.restored_fixture_sha256 !== bundle.reused_source.sha256 ||
      !Array.isArray(restoration.source) || !restoration.source.length || new Set(restoration.source.map(x => x.path)).size !== restoration.source.length ||
      restoration.source.some(x => x.unchanged !== true || x.bytes !== x.after_bytes || !sha(x.sha256) || x.sha256 !== x.after_sha256) ||
      !restoration.source.some(x => x.path === FIXTURE && x.sha256 === bundle.reused_source.sha256 && x.bytes === bundle.reused_source.byte_size) ||
      review.disposition !== "NO_FIX" || review.source_head !== bundle.source_head) fail("budget_diagnosis_restoration_invalid");
  const trace = required("scenario-diagnostic.jsonl").toString().trim().split("\n").map(x => JSON.parse(x));
  const pending = new Map(), finished = new Set(), milestones = []; let previous = -1;
  if (!trace.length || trace.length > 256) fail("budget_diagnosis_trace_invalid");
  for (const x of trace) {
    if (x.role !== "settled-expired-successor" || !Number.isSafeInteger(x.pid) || x.pid <= 0 || x.pid !== trace[0].pid ||
        !Number.isFinite(x.elapsed_ms) || x.elapsed_ms < previous || typeof x.operation !== "string") fail("budget_diagnosis_trace_invalid");
    previous = x.elapsed_ms;
    if (x.id === undefined) { milestones.push(`${x.operation}:${x.stage}`); continue; }
    if (!Number.isSafeInteger(x.id) || x.id <= 0) fail("budget_diagnosis_trace_invalid");
    if (x.stage === "begin") {
      if (pending.has(x.id) || finished.has(x.id)) fail("budget_diagnosis_trace_invalid"); pending.set(x.id, x.operation);
    } else {
      if (!["complete", "rejected", "threw"].includes(x.stage) || pending.get(x.id) !== x.operation || finished.has(x.id)) fail("budget_diagnosis_trace_invalid");
      pending.delete(x.id); finished.add(x.id);
    }
  }
  if (pending.size || !finished.size || !exact(milestones, ["scenario:begin", "semantic_assertions:complete", "scenario_cleanup:begin", "scenario_cleanup:complete", "fixture_root_remove:begin", "fixture_root_remove:complete"])) fail("budget_diagnosis_trace_invalid");
  return { run, source, restoration, trace, call_count: finished.size };
}

export function validateSuccessorBudgetSource({ proof: p, original, finalSource, repositoryRoot }) {
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const source = (head, name) => git(["show", `${head}:${name}`]);
  const delta = (a, b) => { const bytes = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", a, b, "--"]); return {
    bytes: bytes.length, sha256: digest(bytes), paths: git(["diff", "--name-only", a, b, "--"]).toString().trim().split("\n").filter(Boolean).sort(),
  }; };
  if (!keys(finalSource, ["schema", "basis", "deltas"]) || finalSource.schema !== "augnes.local-canonical-successor-budget-final-source.v1" ||
      finalSource.basis !== "implementation_owner_not_independent_review" || !keys(finalSource.deltas, ["accepted_to_final", "main_to_final"]) ||
      !exact(finalSource.deltas.accepted_to_final, delta(p.diagnosis.head, p.head)) || !exact(finalSource.deltas.main_to_final, delta(p.base, p.head))) fail("budget_final_source_invalid");
  if (original.repository.head_sha !== p.diagnosis.head || original.repository.tree_sha !== p.diagnosis.tree || original.repository.base_sha !== p.diagnosis.base) fail("budget_source_identity_invalid");
  for (const [a, b] of [[p.diagnosis.head, p.head], [p.diagnosis.base, p.base], [p.base, p.head]]) git(["merge-base", "--is-ancestor", a, b]);
  for (const target of [p, p.diagnosis]) if (git(["rev-parse", `${target.head}^{tree}`]).toString().trim() !== target.tree) fail("budget_source_identity_invalid");
  const before = source(p.diagnosis.head, SUITE).toString(), after = source(p.head, SUITE).toString();
  const registrations = [...before.matchAll(/    \{\n      id: "settled-expired-successor",[\s\S]*?\n    \},\n/gu)];
  if (registrations.length !== 1 || registrations[0][0].split("timeoutMs: 30_000,").length !== 2 ||
      !registrations[0][0].includes(`...rootNode("${FIXTURE}", "--settled-expired-successor-only")`) || !registrations[0][0].includes("requireNaturalExit: true,") ||
      after !== before.replace(registrations[0][0], registrations[0][0].replace("timeoutMs: 30_000,", "timeoutMs: 45_000,"))) fail("budget_suite_workload_changed");
  const contractBefore = source(p.diagnosis.head, CONTRACT).toString();
  const contractBudget = `const expiredSuccessorRegistration = readCanonicalChildRegistration(integrationSource, "settled-expired-successor");
for (const fragment of ['group: "supporting-serial"', 'timeoutMs: 30_000', '"process-owning"', '"--settled-expired-successor-only"'])`;
  if (contractBefore.split(contractBudget).length !== 2 || source(p.head, CONTRACT).toString() !==
      contractBefore.replace(contractBudget, contractBudget.replace("timeoutMs: 30_000", "timeoutMs: 45_000"))) fail("budget_contract_assertions_changed");
  const tree = head => new Map(git(["ls-tree", "-r", "-z", head]).toString().split("\0").filter(Boolean).map(x => {
    const m = x.match(/^(\d+) (blob|commit) ([a-f0-9]{40})\t(.+)$/u); if (!m) fail("budget_tree_invalid"); return [m[4], m.slice(1, 4)];
  }));
  const accepted = tree(p.diagnosis.head), base = tree(p.diagnosis.base), main = tree(p.base), final = tree(p.head), allowed = new Set(BUDGET_POLICY_PATHS);
  for (const file of new Set([...accepted.keys(), ...base.keys(), ...main.keys(), ...final.keys()])) {
    const a = accepted.get(file) ?? null, b = base.get(file) ?? null, m = main.get(file) ?? null, f = final.get(file) ?? null;
    if (allowed.has(file)) {
      if (!f || f[0] !== "100644" || f[1] !== "blob") fail("budget_policy_source_mode_invalid");
      continue;
    }
    const taskChanged = !exact(a, b), mainChanged = !exact(m, b);
    if (taskChanged && mainChanged && !exact(a, m)) fail("budget_current_main_overlap");
    if (!exact(f, taskChanged ? a : m)) fail("budget_unrelated_source_changed");
    if (f && (taskChanged || mainChanged) && (!["100644", "100755"].includes(f[0]) || f[1] !== "blob")) fail("budget_source_mode_invalid");
  }
  return true;
}

function pinnedProof(p) {
  const a = BUDGET_ACCEPTED;
  return isSuccessorBudgetSuccession(p) && p.pull_request === a.pull_request && p.branch === a.branch && p.prior_family_id === a.family &&
    p.prior_number === 1 && p.prior_attempt_id === a.run && p.prior_receipt_fingerprint === a.receipt_fingerprint &&
    exact(p.budget, { initial: 1, recovery: 0 }) && [p.base, p.head, p.tree].every(commit) &&
    p.diagnosis?.base === a.base && p.diagnosis?.head === a.head && p.diagnosis?.tree === a.tree &&
    p.diagnosis?.review?.id === a.review_id && p.diagnosis.review.sha256 === a.review_sha256 &&
    p.diagnosis?.report?.sha256 === a.report_sha256 && p.diagnosis?.bundle?.sha256 === a.bundle_sha256 && sha(p.final_source?.sha256) &&
    p.authorization?.grant_comment_id === a.grant_id && p.authorization.grant_sha256 === a.grant_sha256 &&
    ["receipt", "attempt", "completion", "edge", "log"].every(k => p.originals?.[k]?.sha256 === a[k === "log" ? "retained_log_sha256" : `${k}_sha256`]);
}

export function readSuccessorBudgetEvidence(file, p, repositoryRoot) {
  const stored = { ...p }; delete stored.local_relative_path;
  if (!keys(stored, ["schema", "kind", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "pull_request", "budget", "originals", "diagnosis", "final_source", "authorization"]) ||
      !pinnedProof(p) || !keys(p.originals, ["receipt", "attempt", "completion", "edge", "log"]) ||
      !keys(p.diagnosis, ["base", "head", "tree", "review", "report", "bundle"]) || !keys(p.diagnosis.review, ["id", "sha256"]) ||
      !keys(p.authorization, ["grant_comment_id", "grant_sha256"])) fail("budget_proof_invalid");
  const read = (ref, max) => budgetArtifact(path.dirname(file), ref, max);
  const original = json(read(p.originals.receipt, 512 * 1024)), prior = json(read(p.originals.attempt)), completion = json(read(p.originals.completion));
  const edge = json(read(p.originals.edge)), log = read(p.originals.log, 2 * 1024 * 1024);
  validateSuccessorBudgetPredecessor(original, prior, completion, p, log);
  const originalLog = path.join(repositoryRoot, original.phases.find(x => x.id === "integration").log.relative_path);
  if (!budgetArtifact(path.dirname(originalLog), { artifact: path.basename(originalLog), sha256: p.originals.log.sha256 }, 2 * 1024 * 1024).equals(log)) fail("budget_original_log_changed");
  read(p.diagnosis.report, 64 * 1024);
  const bundle = json(read(p.diagnosis.bundle, 1024 * 1024)), diagnosis = validateSuccessorBudgetDiagnosis(bundle);
  if (bundle.source_head !== p.diagnosis.head || bundle.files.length !== 23 || bundle.reused_source.sha256 !== BUDGET_ACCEPTED.fixture_sha256 ||
      diagnosis.source.tree !== p.diagnosis.tree || diagnosis.source.branch !== p.branch || diagnosis.source.origin_main_local_ref !== p.diagnosis.base ||
      diagnosis.source.origin !== "https://github.com/hynk-studio/augnes.git" || diagnosis.restoration.r5_receipt_sha256 !== p.originals.receipt.sha256 ||
      diagnosis.call_count !== 43 || Date.parse(diagnosis.run.started_at_utc) <= Date.parse(completion.finished_at) ||
      Date.parse(diagnosis.run.finished_at_utc) >= Date.parse("2026-10-31T12:46:13Z")) fail("budget_accepted_diagnosis_invalid");
  validateSuccessorBudgetSource({ proof: p, original, finalSource: json(read(p.final_source, 128 * 1024)), repositoryRoot });
  return { original, prior, completion, edge };
}

export function validateSuccessorBudgetAuthorityRecords(p, review, grant, permissions, pr) {
  const observations = {};
  for (const [record, role, ref] of [[review, "accepted_repair", p.diagnosis.review], [grant, "execution_grant", { id: p.authorization.grant_comment_id, sha256: p.authorization.grant_sha256 }]]) {
    if (record?.id !== ref.id || record.user?.type !== "User" || !Number.isSafeInteger(record.user?.id) || record.user.id <= 0 ||
        !/^[A-Za-z0-9-]{1,39}$/u.test(record.user?.login ?? "") || !["OWNER", "MEMBER", "COLLABORATOR"].includes(record.author_association) ||
        typeof record.body !== "string" || Buffer.byteLength(record.body) > 64 * 1024) fail("budget_authority_identity_invalid");
    if (role === "accepted_repair" ? record.pull_request_url !== `https://api.github.com/repos/hynk-studio/augnes/pulls/${p.pull_request}` ||
        !["COMMENTED", "APPROVED"].includes(record.state) || record.commit_id !== p.diagnosis.head :
      record.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}`) fail("budget_authority_source_invalid");
    const observation = budgetAuthorityObservation(record, role), permission = permissions[role];
    if (!time(observation.timestamp) || digest(observation) !== ref.sha256) fail("budget_authority_changed");
    if (permission?.user?.login !== record.user.login || !["admin", "maintain"].includes(permission.permission)) fail("budget_authority_permission_invalid");
    observations[role] = observation;
  }
  if (![p.diagnosis.head, p.diagnosis.tree, p.diagnosis.base, "ACCEPT / RETAIN", "NO FIX", "ChatGPT", "publisher", "not an execution grant"].every(x => review.body.includes(x)) ||
      ![p.diagnosis.head, p.diagnosis.tree, p.diagnosis.base, p.branch, p.prior_attempt_id, p.prior_family_id, p.prior_receipt_fingerprint,
        p.originals.receipt.sha256, p.diagnosis.report.sha256, p.diagnosis.bundle.sha256,
        `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${p.diagnosis.review.id}`,
        "only the outer `settled-expired-successor` budget to45,000ms", "from30,000 to45,000ms", "Retry/recovery budget:0.",
        "at most one admitted, unchanged planner-complete Full", "do not remove `operating_profile_consumed` restrictions generally",
        "No separate allowance ledger", "post-completion independent judgment", "ChatGPT independently audits the new policy/source and returned evidence after completion", "UNKNOWN", "#1561"].every(x => grant.body.includes(x))) fail("budget_authority_scope_invalid");
  if (Date.parse(observations.execution_grant.timestamp) <= Date.parse(observations.accepted_repair.timestamp)) fail("budget_authority_order_invalid");
  if (pr?.number !== p.pull_request || pr.state !== "open" || pr.draft !== true || pr.merged !== false || pr.auto_merge !== null ||
      pr.head?.repo?.full_name !== "hynk-studio/augnes" || pr.base?.repo?.full_name !== "hynk-studio/augnes" || pr.head.sha !== p.head ||
      pr.head.ref !== p.branch || pr.base.sha !== p.base || pr.base.ref !== "main") fail("budget_published_source_invalid");
  return observations;
}

export async function authorizeSuccessorBudgetSuccession(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  if (!pinnedProof(p)) fail("budget_authority_missing");
  const review = await transport.review(p.diagnosis.review.id), grant = await transport.grant(p.authorization.grant_comment_id);
  const permissions = { accepted_repair: await transport.permission(review?.user?.login), execution_grant: await transport.permission(grant?.user?.login) };
  const observations = validateSuccessorBudgetAuthorityRecords(p, review, grant, permissions, await transport.pullRequest());
  const capability = Object.freeze({ observations }); capabilities.set(capability, { proof: digest(p), observations: digest(observations) }); return capability;
}

export function assertSuccessorBudgetAuthorization(p, capability, completion) {
  const state = capabilities.get(capability);
  if (!state || state.proof !== digest(p) || state.observations !== digest(capability.observations) ||
      !time(completion?.finished_at) ||
      Date.parse(capability.observations.accepted_repair.timestamp) <= Date.parse(completion.finished_at)) fail("budget_authenticated_authority_required");
}

export function validSuccessorBudgetAttempt(attempt) {
  const p = attempt?.source_correction;
  return pinnedProof(p) && attempt.number === 1 && !attempt.recovery && !attempt.browser_replacement &&
    exact(attempt.budget, { initial: 1, recovery: 0 }) && p.branch === attempt.branch && p.head === attempt.head && p.tree === attempt.tree &&
    Date.parse(attempt.budget_authority?.execution_grant?.timestamp) > Date.parse(attempt.budget_authority?.accepted_repair?.timestamp) &&
    ["accepted_repair", "execution_grant"].every(role => {
      const o = attempt.budget_authority?.[role], ref = role === "accepted_repair" ? p.diagnosis.review : { id: p.authorization.grant_comment_id, sha256: p.authorization.grant_sha256 };
      return keys(o, ["id", "author", "author_id", "body_sha256", "timestamp", "role", "commit_id"]) && o.role === role && o.id === ref.id && digest(o) === ref.sha256 &&
        Number.isSafeInteger(o.author_id) && o.author_id > 0 && /^[A-Za-z0-9-]{1,39}$/u.test(o.author ?? "") && sha(o.body_sha256) && time(o.timestamp) &&
        o.commit_id === (role === "accepted_repair" ? p.diagnosis.head : null);
    });
}
