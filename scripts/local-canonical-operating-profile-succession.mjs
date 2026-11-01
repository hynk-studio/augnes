// One prospective #1561 allowance, using already accepted both-PASS evidence.
// The historical timeout remains UNKNOWN. No legacy witness rule is relaxed.
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { timeoutArtifact, validateTimeoutPredecessor, timeoutAuthorityObservation } from "./local-canonical-timeout-succession.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const OPERATING_PROFILE_SCHEMA = "augnes.local-canonical-operating-profile-succession.v1";
export const isOperatingProfileSuccession = p => p?.schema === OPERATING_PROFILE_SCHEMA && p.kind === "operating_profile_efficiency";
export const profileArtifact = timeoutArtifact;
export const profileAuthorityObservation = timeoutAuthorityObservation;
export const PROFILE_ACCEPTED = Object.freeze({
  manifest_sha256: "1cd322b79d66744bc7c6028367c2399877ee282cd17782387741bbe3b89c2a87",
  receipt_sha256: "7e62d77ac78ce492ef6544f93673e31c319797ee91c51819261ebf235c95b21e",
  attempt_sha256: "43c666cc18d771d9f6ac50633dc22bb88173cbc1d708c7ebca90b8ff3283088a",
  completion_sha256: "b50399c740d7585e963a55f92770d2a586706eaec47f550445d76ea206148d06",
  // Later retained-byte observation, 2026-10-31T04:20:38.944028Z. The original
  // receipt bound log path/length, not a log hash; it is never rewritten here.
  retained_log_sha256: "b7252a482d256d3cb6ba1456324e767ab70c8e8ed990bacc0b0f07733fdf915d",
  pull_request: 1562, review_id: 5721999096, grant_id: 6541192997,
  review_sha256: "73bfdbfb73702f252bd7963d5fdbd9e2f6e51b168c8107a47ad2121788377365",
  grant_sha256: "30e612c926b7d5e52d1693181fc45cb68f40c034133e287d92cee23e97377910",
});
export const PROFILE_SOURCE_PATHS = Object.freeze([
  "scripts/execution-choice-transition-harness.ts", "scripts/operating-profile-contribution-fixture.ts",
  "scripts/operating-profile-contribution-followup.ts", "scripts/operating-profile-contribution-boundaries.ts",
  "scripts/test-operating-profile-contribution.ts",
]);
export const PROFILE_POLICY_PATHS = Object.freeze([
  ".github/LOCAL_CANONICAL_VERIFICATION.md", "docs/LOCAL_CANONICAL_INPUT_CONTRACT.md",
  "scripts/local-canonical-operating-profile-succession.mjs", "scripts/local-canonical-attempts.mjs",
  "scripts/local-canonical-receipt.mjs", "scripts/local-canonical-review-export.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/run-canonical-test-suite.mjs",
  "scripts/test-local-canonical-executor.mjs", "scripts/test-local-canonical-review-corrections.mjs",
  "scripts/fixtures/local-canonical-operating-profile-succession.mjs",
]);
const RUNS = ["baseline", "candidate", "final", "transition_normal", "transition_existing", "typecheck"];
const ROLES = ["producer", "consumer", "boundary"];
const STABLE = ["downstream-result.json", "fresh-followup.md", "original-return.txt", "producer-results.json", "profile-canonical.json", "profile-input.json"];
const LABEL = "profile step, manual return, checked recommendation and fresh persisted follow-up";
export const PROFILE_SUITE_ADDITION = `    {
      id: "local-canonical-operating-profile-succession",
      label: "accepted operating-profile efficiency and one prospective Full",
      ...rootNode("scripts/test-local-canonical-review-corrections.mjs", "--operating-profile-succession-controls"),
      timeoutMs: 30_000,
      requireNaturalExit: true,
    },
`;
const capabilities = new WeakMap();
const fail = code => { throw Object.assign(new Error(code), { code }); };
const sha = x => typeof x === "string" && /^[a-f0-9]{64}$/u.test(x);
const commit = x => typeof x === "string" && /^[a-f0-9]{40}$/u.test(x);
const exact = (a, b) => digest(a) === digest(b);
const keys = (x, ks) => x && typeof x === "object" && !Array.isArray(x) && exact(Object.keys(x).sort(), [...ks].sort());
const time = x => typeof x === "string" && Number.isFinite(Date.parse(x)) && Date.parse(x) <= Date.now();
const natural = r => r?.exit_code === 0 && r.signal === null && r.timed_out === false && r.cancelled === false &&
  r.spawn_error_code === null && r.exit_observed === true && r.streams_closed === true && r.cleanup_completed === true &&
  r.remaining_owned_processes === 0 && r.termination_reason === "natural_exit";
const json = bytes => JSON.parse(bytes.toString("utf8"));

// Pure checks are usable with expressly synthetic test records. They do not
// issue an authority capability or bypass the production immutable-file pins.
export function validateOperatingProfilePredecessor(original, prior, completion, p, logBytes) {
  validateTimeoutPredecessor(original);
  if (!exact(original.attempt, prior) || prior.family_id !== p.prior_family_id || prior.number !== p.prior_number ||
      prior.attempt_id !== p.prior_attempt_id || prior.branch !== p.branch || original.integrity.content_fingerprint !== p.prior_receipt_fingerprint ||
      completion.contract !== prior.contract || completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== p.prior_receipt_fingerprint ||
      completion.disposition !== "product_failure" || completion.cleanup_complete !== true || !time(completion.finished_at)) fail("profile_predecessor_binding_invalid");
  const phase = original.phases.find(x => x.id === "integration"), log = phase.log;
  if (log?.truncated !== false || log.bytes !== logBytes.length ||
      log.relative_path !== `.augnes-local-verification/logs/${original.run.id}/integration.log`) fail("profile_original_log_binding_invalid");
  const starts = new Map(), results = new Map(), cleanups = new Set(), nested = new Map();
  let inventory = null, resourceCleanup = 0, wrapperCleanup = 0, timeoutLatched = false;
  for (const line of logBytes.toString("utf8").split("\n")) {
    const start = line.match(/^\[canonical:integration\] child_start label=("(?:[^"\\]|\\.)*") timeout_ms=(\d+)$/u);
    if (start) { const label = JSON.parse(start[1]); if (starts.has(label)) fail("profile_nested_inventory_invalid"); starts.set(label, Number(start[2])); }
    if (line.startsWith("[canonical:integration] child_result ")) {
      const m = line.match(/^\[canonical:integration\] child_result label=("(?:[^"\\]|\\.)*") duration_ms=(\d+) exit_code=(0|1) signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u);
      if (!m) fail("profile_nested_unsettled");
      const label = JSON.parse(m[1]);
      if (!starts.has(label) || results.has(label) || Number(m[3]) !== (label === LABEL ? 1 : 0) || Number(m[2]) >= starts.get(label)) fail("profile_nested_unrelated_failure");
      results.set(label, Number(m[3]));
    }
    if (line.startsWith("[canonical:integration] child_cleanup_result ")) {
      const m = line.match(/^\[canonical:integration\] child_cleanup_result label=("(?:[^"\\]|\\.)*") elapsed_ms=\d+ reason=(?:post_exit_settlement|post_close_settlement) term_sent=(?:true|false) kill_sent=(?:true|false) streams_closed=true remaining_owned_processes=0$/u);
      if (!m || cleanups.has(JSON.parse(m[1]))) fail("profile_nested_unsettled"); cleanups.add(JSON.parse(m[1]));
    }
    const ns = line.match(/^\[canonical:operating-profile-contribution\] child_start label="(producer|consumer|boundary)" timeout_ms=60000$/u);
    if (line.startsWith("[canonical:operating-profile-contribution] child_start ") && !ns) fail("profile_nested_inventory_invalid");
    if (ns) {
      const index = nested.size;
      if (ROLES[index] !== ns[1] || (index > 0 && !nested.get(ROLES[index - 1]).result)) fail("profile_nested_inventory_invalid");
      nested.set(ns[1], { start: true });
    }
    if (line.startsWith('[canonical:operating-profile-contribution] child_cleanup_start label="boundary"')) {
      const m = line.match(/^\[canonical:operating-profile-contribution\] child_cleanup_start label="boundary" elapsed_ms=(\d+) reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false$/u);
      if (!m || Number(m[1]) < 60000 || !nested.has("boundary") || nested.get("boundary").result || timeoutLatched) fail("profile_timeout_latch_invalid");
      timeoutLatched = true;
    }
    if (line.startsWith("[canonical:operating-profile-contribution] child_cleanup_result ")) {
      const m = line.match(/^\[canonical:operating-profile-contribution\] child_cleanup_result label="(producer|consumer|boundary)" elapsed_ms=(\d+) reason=(bounded_timeout|post_exit_settlement|post_close_settlement)(?: term_sent=(true|false) kill_sent=(true|false))? streams_closed=true remaining_owned_processes=0$/u);
      if (!m || !nested.has(m[1]) || nested.get(m[1]).cleanup || nested.get(m[1]).result || (m[1] === "boundary" ?
        !timeoutLatched || m[3] !== "bounded_timeout" || m[4] !== undefined || Number(m[2]) < 60000 :
        m[3] === "bounded_timeout" || m[4] === undefined)) fail("profile_nested_unsettled");
      nested.get(m[1]).cleanup = true;
    }
    if (line.startsWith("[canonical:operating-profile-contribution] child_result ")) {
      const m = line.match(/^\[canonical:operating-profile-contribution\] child_result label="(producer|consumer|boundary)" duration_ms=(\d+) exit_code=0 signal=null timed_out=(true|false) exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=(natural_exit|bounded_timeout)$/u);
      if (!m || !nested.has(m[1]) || !nested.get(m[1]).cleanup || nested.get(m[1]).result || (m[1] === "boundary" ?
        m[3] !== "true" || m[4] !== "bounded_timeout" || Number(m[2]) < 60000 :
        m[3] !== "false" || m[4] !== "natural_exit" || Number(m[2]) >= 60000)) fail("profile_nested_timeout_invalid");
      nested.get(m[1]).result = true;
    }
    if (line.startsWith("[canonical:integration] group_inventory ")) {
      if (inventory) fail("profile_nested_inventory_invalid"); inventory = JSON.parse(line.slice("[canonical:integration] group_inventory ".length));
    }
    if (line.startsWith("{")) {
      let x; try { x = JSON.parse(line); } catch { continue; }
      if (x.suite === "integration" && Object.hasOwn(x, "resource_cleanup")) {
        if (!Array.isArray(x.resource_cleanup) || !x.resource_cleanup.length || x.resource_cleanup.some(r => r.completed !== true || r.failure_count !== 0 || r.failures?.length !== 0)) fail("profile_nested_resource_unsettled"); resourceCleanup++;
      }
      if (nested.get("boundary")?.result && !results.has(LABEL) && keys(x, ["cleanup"])) {
        if (!Array.isArray(x.cleanup) || x.cleanup.length !== 1 || x.cleanup.some(r => r.completed !== true || r.failure_count !== 0 || r.failures?.length !== 0)) fail("profile_wrapper_cleanup_invalid"); wrapperCleanup++;
      }
    }
  }
  if (starts.get(LABEL) !== 150000 || starts.size !== results.size || starts.size !== cleanups.size ||
      [...starts.keys()].some(x => !cleanups.has(x)) || !exact([...nested.keys()], ROLES) || [...nested.values()].some(x => !x.result || !x.cleanup) || !timeoutLatched || wrapperCleanup !== 1 || resourceCleanup !== 1 ||
      !inventory || inventory.started_count !== starts.size || inventory.settled_count !== starts.size || inventory.completed_count !== starts.size || inventory.failed_count !== 1 ||
      !Array.isArray(inventory.children) || new Set(inventory.children.map(x => x.label)).size !== inventory.children.length || inventory.selected_count !== inventory.children.length || inventory.unstarted_count !== inventory.children.filter(x => !x.started).length ||
      inventory.children.some(x => x.started ? !results.has(x.label) || !x.settled || !x.completed || x.outcome !== (x.label === LABEL ? "failed" : "passed") : results.has(x.label))) fail("profile_nested_inventory_invalid");
  return { original, prior, completion };
}

// Bounded unified text patch application, never executing supplied evidence.
function patchedFiles(diff, source) {
  const lines = diff.toString("utf8").split("\n"), output = new Map();
  let i = 0;
  while (i < lines.length && lines[i]) {
    const header = lines[i++].match(/^diff --git a\/([A-Za-z0-9_./-]+) b\/\1$/u);
    if (!header || !PROFILE_SOURCE_PATHS.includes(header[1]) || output.has(header[1])) fail("profile_source_patch_invalid");
    const name = header[1], original = source(name).toString("utf8").split("\n"); let cursor = 0; const result = [];
    while (i < lines.length && !lines[i].startsWith("@@ ")) {
      if (!/^(?:index [a-f0-9]+\.\.[a-f0-9]+ 100644|--- a\/|\+\+\+ b\/)/u.test(lines[i++])) fail("profile_source_patch_invalid");
    }
    let hunks = 0;
    while (i < lines.length && lines[i].startsWith("@@ ")) {
      const h = lines[i++].match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/u);
      if (!h) fail("profile_source_patch_invalid");
      const start = Number(h[1]) - 1, oldCount = Number(h[2] ?? 1), newCount = Number(h[4] ?? 1); let old = 0, added = 0;
      if (start < cursor || start > original.length) fail("profile_source_patch_invalid");
      result.push(...original.slice(cursor, start)); cursor = start;
      while (i < lines.length && /^[ +\-]/u.test(lines[i]) && !lines[i].startsWith("--- ")) {
        const line = lines[i++], value = line.slice(1);
        if (line[0] !== "+") { if (original[cursor++] !== value) fail("profile_source_patch_invalid"); old++; }
        if (line[0] !== "-") { result.push(value); added++; }
      }
      if (old !== oldCount || added !== newCount) fail("profile_source_patch_invalid"); hunks++;
    }
    if (!hunks) fail("profile_source_patch_invalid");
    result.push(...original.slice(cursor)); output.set(name, Buffer.from(result.join("\n")));
  }
  return output;
}

export function validateOperatingProfileComparison(runs, comparison) {
  if (!keys(runs, RUNS)) fail("profile_run_inventory_invalid");
  for (const name of RUNS) {
    const run = runs[name], r = run.result, s = run.source, env = run.environment;
    if (!natural(r.result) || r.focused_pass !== true || r.acceptance_failure !== null || r.errors?.length !== 0 ||
        r.resource_root_exists_after !== false || !r.cleanup?.length || r.cleanup.some(x => x.completed !== true) ||
        !time(r.started_at_utc) || !time(r.finished_at_utc) || Date.parse(r.finished_at_utc) <= Date.parse(r.started_at_utc) ||
        r.source_unchanged !== true || r.source_before_fingerprint !== digest(s) || r.source_after_fingerprint !== digest(s) ||
        r.cwd !== s.root || r.environment_fingerprint !== digest(env) || !exact(r.environment_keys, Object.keys(env).sort()) ||
        r.tool_versions?.node !== CANONICAL_NODE_VERSION || r.tool_versions?.npm !== "11.16.0" || r.tool_versions?.platform !== "darwin" || r.tool_versions?.architecture !== "arm64" ||
        !sha(r.tool_versions.node_sha256) || env.NODE_ENV !== "test" || env.LANG !== "C" || env.LC_ALL !== "C" || env.TZ !== "UTC" ||
        s.diff_bytes !== run.diff.length || s.diff_sha256 !== digest(run.diff) || !Array.isArray(s.files) ||
        new Set(s.files.map(x => x.path)).size !== s.files.length || !exact(s.files.map(x => x.path).sort(), [...run.files.keys()].sort()) ||
        s.files.some(x => run.files.get(x.path)?.length !== x.bytes || digest(run.files.get(x.path)) !== x.sha256)) fail("profile_run_binding_invalid");
    if (name === "typecheck" ? !exact(r.args, ["run", "typecheck"]) :
      !Array.isArray(r.args) || r.args[0] !== "--import" || r.args[1] !== "tsx" || r.args[2] !== (name.startsWith("transition") ? "scripts/test-execution-choice-transition.ts" : "scripts/test-operating-profile-contribution.ts") ||
      (name === "transition_existing" ? r.args[4] !== "existing" || r.args.length !== 5 : r.args.length !== 4)) fail("profile_workload_invalid");
    if (["baseline", "candidate", "final"].includes(name) && (r.timeout_ms !== 150000 || r.result.duration_ms >= 150000)) fail("profile_workload_invalid");
  }
  if (Date.parse(runs.candidate.result.started_at_utc) <= Date.parse(runs.baseline.result.finished_at_utc) ||
      Date.parse(runs.final.result.started_at_utc) <= Date.parse(runs.candidate.result.finished_at_utc)) fail("profile_comparison_order_invalid");
  const counts = [];
  for (const role of ROLES) {
    const before = json(runs.baseline.artifacts.get(`${role}-trace.json`)), after = json(runs.candidate.artifacts.get(`${role}-trace.json`));
    if (!Array.isArray(before) || !Array.isArray(after) || before.length > 1000 || after.length > 1000) fail("profile_trace_invalid");
    const keep = [], removed = [];
    for (let i = 0; i < before.length; i++) {
      const x = before[i], previous = before[i - 1], next = before[i + 1];
      if (x.name === "augnes_read_repository_work_sources" && previous?.name === "augnes_resume_repository" &&
          ["augnes_prepare_repository_execution_choice", "augnes_lookup_repository_retained_sources"].includes(next?.name)) {
        const binding = previous.result?.continuity?.snapshot?.binding;
        if (typeof binding !== "string" || x.arguments?.expectedSnapshotBinding !== binding || next.arguments?.expectedSnapshotBinding !== binding) fail("profile_prefetch_binding_invalid");
        removed.push(i + 1);
      } else keep.push(x);
    }
    const projection = x => [x.name, x.arguments?.action ?? null, x.result?.status ?? null, x.result?.reason ?? null, x.result?.prepared_stage ?? null, x.result?.preparation_stage ?? null];
    if (!removed.length || !exact(keep.map(projection), after.map(projection))) fail("profile_trace_equivalence_invalid");
    const row = comparison.comparison?.find(x => x.role === role);
    if (!row || row.baseline_operations !== before.length || row.candidate_operations !== after.length || row.discarded_prefetches !== removed.length ||
        row.remaining_tool_action_sequence_identical !== true || row.remaining_status_reason_stage_sequence_identical !== true) fail("profile_comparison_summary_invalid");
    counts.push(removed.length);
  }
  for (const name of STABLE) {
    const bytes = runs.baseline.artifacts.get(name);
    if (!bytes || !bytes.equals(runs.candidate.artifacts.get(name) ?? Buffer.alloc(0)) || !bytes.equals(runs.final.artifacts.get(name) ?? Buffer.alloc(0))) fail("profile_artifact_equivalence_invalid");
  }
  return counts;
}

export function validateOperatingProfileSource({ proof: p, original, runs, finalSource, repositoryRoot }) {
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const source = (head, name) => git(["show", `${head}:${name}`]);
  const paths = (a, b) => git(["diff", "--name-only", a, b, "--"]).toString().trim().split("\n").filter(Boolean).sort();
  const delta = (a, b) => { const bytes = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", a, b, "--"]); return { bytes: bytes.length, sha256: digest(bytes), paths: paths(a, b) }; };
  if (!keys(finalSource, ["schema", "basis", "deltas"]) || finalSource.schema !== "augnes.local-canonical-operating-profile-final-source.v1" ||
      finalSource.basis !== "implementation_owner_not_independent_review" || !keys(finalSource.deltas, ["predecessor_to_improvement", "improvement_to_final", "predecessor_to_final", "main_to_final"])) fail("profile_final_source_invalid");
  for (const [key, a, b] of [["predecessor_to_improvement", original.repository.head_sha, p.improvement.head], ["improvement_to_final", p.improvement.head, p.head],
    ["predecessor_to_final", original.repository.head_sha, p.head], ["main_to_final", p.base, p.head]]) if (!exact(finalSource.deltas[key], delta(a, b))) fail("profile_final_delta_changed");
  for (const [a, b] of [[original.repository.head_sha, p.improvement.head], [p.improvement.head, p.head], [p.base, p.head], [p.improvement.base, p.base], [original.repository.base_sha, p.improvement.base]]) git(["merge-base", "--is-ancestor", a, b]);
  for (const target of [p, p.improvement]) if (git(["rev-parse", `${target.head}^{tree}`]).toString().trim() !== target.tree) fail("profile_source_identity_invalid");
  const parent = runs.baseline.source.head;
  if (!commit(parent) || runs.candidate.source.head !== parent || runs.final.source.head !== parent) fail("profile_run_source_invalid");
  git(["merge-base", "--is-ancestor", parent, p.improvement.head]);
  for (const name of RUNS) {
    const run = runs[name], s = run.source;
    if (s.head !== parent || s.tree !== git(["rev-parse", `${parent}^{tree}`]).toString().trim() || s.branch !== p.branch ||
        s.origin !== "https://github.com/hynk-studio/augnes.git" || s.origin_main_local_ref !== p.improvement.base) fail("profile_run_source_invalid");
    const patched = patchedFiles(run.diff, name => source(parent, name));
    for (const [name, bytes] of run.files) if (!(patched.get(name) ?? source(parent, name)).equals(bytes)) fail("profile_run_source_invalid");
    if (!["baseline", "candidate"].includes(name)) {
      if (!run.diff.equals(git(["diff", "--binary", "--no-ext-diff", "--no-textconv", parent, p.improvement.head, "--"]))) fail("profile_final_run_delta_invalid");
      for (const [file, bytes] of run.files) if (!source(p.improvement.head, file).equals(bytes)) fail("profile_final_run_source_invalid");
    }
  }
  for (const file of PROFILE_SOURCE_PATHS.slice(1)) {
    if (!source(original.repository.head_sha, file).equals(source(p.improvement.head, file)) || !source(p.improvement.head, file).equals(source(p.head, file)) ||
        !runs.baseline.files.get(file).equals(runs.candidate.files.get(file))) fail("profile_workload_changed");
  }
  if (!source(p.improvement.head, PROFILE_SOURCE_PATHS[0]).equals(source(p.head, PROFILE_SOURCE_PATHS[0]))) fail("profile_improvement_changed");
  const registration = head => {
    const matches = [...source(head, "scripts/run-canonical-test-suite.mjs").toString().matchAll(/\{\s*id:\s*"operating-profile-contribution",[^]*?requireNaturalExit:\s*true,\s*\}/gu)];
    if (matches.length !== 1) fail("profile_registration_invalid"); return matches[0][0];
  };
  if (registration(original.repository.head_sha) !== registration(p.improvement.head) || registration(p.improvement.head) !== registration(p.head) ||
      !registration(p.head).includes("timeoutMs: 150_000")) fail("profile_workload_changed");
  const suite = source(p.head, "scripts/run-canonical-test-suite.mjs").toString();
  if (suite.split(PROFILE_SUITE_ADDITION).length !== 2 || suite.replace(PROFILE_SUITE_ADDITION, "") !== source(p.improvement.head, "scripts/run-canonical-test-suite.mjs").toString()) fail("profile_suite_inventory_changed");
  const tree = head => new Map(git(["ls-tree", "-r", "-z", head]).toString().split("\0").filter(Boolean).map(x => {
    const m = x.match(/^(\d+) (blob|commit) ([a-f0-9]{40})\t(.+)$/u); if (!m) fail("profile_tree_invalid"); return [m[4], m.slice(1, 4)];
  }));
  const accepted = tree(p.improvement.head), base = tree(p.improvement.base), main = tree(p.base), final = tree(p.head), allowed = new Set(PROFILE_POLICY_PATHS);
  // Include accepted paths absent from the final diff: deletion/reversion does
  // not erase the accepted inventory or its presence/mode/blob obligation.
  const all = new Set([...accepted.keys(), ...base.keys(), ...main.keys(), ...final.keys()]);
  for (const file of all) {
    if (allowed.has(file)) continue;
    const a = accepted.get(file) ?? null, b = base.get(file) ?? null, m = main.get(file) ?? null, f = final.get(file) ?? null;
    const taskChanged = !exact(a, b), mainChanged = !exact(m, b);
    if (taskChanged && mainChanged && !exact(a, m)) fail("profile_current_main_overlap");
    if (!exact(f, taskChanged ? a : m)) fail("profile_unrelated_source_changed");
    if (f && (taskChanged || mainChanged) && (f[0] !== "100644" && f[0] !== "100755" || f[1] !== "blob")) fail("profile_source_mode_invalid");
  }
  return true;
}

export function readOperatingProfileEvidence(file, p, repositoryRoot) {
  const stored = { ...p }; delete stored.local_relative_path;
  if (!keys(stored, ["schema", "kind", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "pull_request", "budget", "originals", "improvement", "final_source", "authorization"]) ||
      !isOperatingProfileSuccession(p) || p.pull_request !== PROFILE_ACCEPTED.pull_request || ![p.base, p.head, p.tree, p.improvement?.base, p.improvement?.head, p.improvement?.tree].every(commit) ||
      !sha(p.prior_family_id) || !sha(p.prior_receipt_fingerprint) || ![1, 2].includes(p.prior_number) || !exact(p.budget, { initial: 1, recovery: 0 }) ||
      !keys(p.originals, ["receipt", "attempt", "completion", "log"]) || p.originals.receipt.sha256 !== PROFILE_ACCEPTED.receipt_sha256 ||
      p.originals.attempt.sha256 !== PROFILE_ACCEPTED.attempt_sha256 || p.originals.completion.sha256 !== PROFILE_ACCEPTED.completion_sha256 || p.originals.log.sha256 !== PROFILE_ACCEPTED.retained_log_sha256 ||
      !keys(p.improvement, ["base", "head", "tree", "review", "evidence"]) || !keys(p.improvement.review, ["id", "sha256"]) ||
      p.improvement.review.id !== PROFILE_ACCEPTED.review_id || p.improvement.review.sha256 !== PROFILE_ACCEPTED.review_sha256 ||
      !keys(p.improvement.evidence, ["accepted_manifest", "manifest"]) || p.improvement.evidence.accepted_manifest.sha256 !== PROFILE_ACCEPTED.manifest_sha256) fail("profile_proof_invalid");
  const folder = path.dirname(file), read = (ref, max) => profileArtifact(folder, ref, max);
  const original = json(read(p.originals.receipt, 512 * 1024)), prior = json(read(p.originals.attempt)), completion = json(read(p.originals.completion)), log = read(p.originals.log, 2 * 1024 * 1024);
  validateOperatingProfilePredecessor(original, prior, completion, p, log);
  const originalLog = path.join(repositoryRoot, original.phases.find(x => x.id === "integration").log.relative_path);
  if (!timeoutArtifact(path.dirname(originalLog), { artifact: path.basename(originalLog), sha256: p.originals.log.sha256 }, 2 * 1024 * 1024).equals(log)) fail("profile_original_log_changed");
  const accepted = json(read(p.improvement.evidence.accepted_manifest, 256 * 1024));
  if (accepted.report_id !== "AUGNES-1561-COMPANION-RESULT-SUCCESSOR-20261031" || accepted.revision !== 4 || accepted.source_count !== 197 || accepted.source_bytes !== 12923812 ||
      !Array.isArray(accepted.files) || accepted.files.length !== 197 || new Set(accepted.files.map(x => x.path)).size !== 197) fail("profile_accepted_inventory_invalid");
  const inventory = new Map(accepted.files.map(x => [x.path, x])); let total = 0;
  const bound = (ref, originalPath, maximum = 4 * 1024 * 1024) => {
    const bytes = read(ref, maximum), identity = inventory.get(originalPath);
    if (!identity || identity.sha256 !== ref.sha256 || identity.bytes !== bytes.length || (total += bytes.length) > 24 * 1024 * 1024) fail("profile_accepted_evidence_changed"); return bytes;
  };
  const manifest = json(read(p.improvement.evidence.manifest, 128 * 1024));
  if (!keys(manifest, ["schema", "runs", "comparison"]) || manifest.schema !== "augnes.local-canonical-operating-profile-evidence.v1" || !keys(manifest.runs, RUNS)) fail("profile_manifest_invalid");
  const runs = {};
  for (const name of RUNS) {
    const r = manifest.runs[name];
    if (!keys(r, ["directory", "result", "source", "environment", "diff", "files", "artifacts"]) || !/^runs\/[A-Za-z0-9._-]+$/u.test(r.directory) ||
        !r.files || !r.artifacts || Object.keys(r.files).length > 8 || Object.keys(r.artifacts).length > 12) fail("profile_manifest_invalid");
    const at = suffix => `${r.directory}/${suffix}`;
    runs[name] = { result: json(bound(r.result, at("result.json"))), source: json(bound(r.source, at("source.json"))), environment: json(bound(r.environment, at("environment.json"))),
      diff: bound(r.diff, at("source.diff")), files: new Map(Object.entries(r.files).map(([f, ref]) => [f, bound(ref, at(`source-files/${f}`))])),
      artifacts: new Map(Object.entries(r.artifacts).map(([f, ref]) => [f, bound(ref, at(`artifacts/${f}`))])) };
  }
  const counts = validateOperatingProfileComparison(runs, json(bound(manifest.comparison, "comparison.json")));
  if (!exact(counts, [21, 1, 15]) || RUNS.some(name => Date.parse(runs[name].result.started_at_utc) <= Date.parse(completion.finished_at) ||
      Date.parse(runs[name].result.finished_at_utc) >= Date.parse("2026-10-31T08:31:34Z"))) fail("profile_accepted_comparison_invalid");
  validateOperatingProfileSource({ proof: p, original, runs, finalSource: json(read(p.final_source, 128 * 1024)), repositoryRoot });
  return { original, prior, completion };
}

export function validateOperatingProfileAuthorityRecords(p, repair, grant, permissions, pr) {
  const observations = {};
  for (const [record, role, ref] of [[repair, "accepted_repair", p.improvement.review], [grant, "execution_grant", { id: p.authorization.grant_comment_id, sha256: p.authorization.grant_sha256 }]]) {
    if (record?.id !== ref.id || record.user?.type !== "User" || !Number.isSafeInteger(record.user?.id) || record.user.id <= 0 ||
        !/^[A-Za-z0-9-]{1,39}$/u.test(record.user?.login ?? "") || !["OWNER", "MEMBER", "COLLABORATOR"].includes(record.author_association) || typeof record.body !== "string" || Buffer.byteLength(record.body) > 64 * 1024) fail("profile_authority_identity_invalid");
    if (role === "accepted_repair" ? record.pull_request_url !== `https://api.github.com/repos/hynk-studio/augnes/pulls/${p.pull_request}` || !["COMMENTED", "APPROVED"].includes(record.state) || record.commit_id !== p.improvement.head :
      record.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}`) fail("profile_authority_source_invalid");
    const observation = profileAuthorityObservation(record, role), permission = permissions[role];
    if (!time(observation.timestamp) || digest(observation) !== ref.sha256) fail("profile_authority_changed");
    if (permission?.user?.login !== record.user.login || !["admin", "maintain"].includes(permission.permission)) fail("profile_authority_permission_invalid");
    observations[role] = observation;
  }
  if (![p.improvement.head, p.improvement.tree, p.improvement.base, "ACCEPT / RETAIN", "both passed", "37 unused", "ChatGPT", "publisher"].every(x => repair.body.includes(x)) ||
      ![p.improvement.head, p.improvement.tree, p.improvement.base, p.branch, p.prior_attempt_id, p.prior_family_id, p.originals.receipt.sha256,
        `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${p.improvement.review.id}`,
        "one admitted Full; zero automatic or explicit recovery/retry", "smallest necessary explicit prospective successor-policy/admission path",
        "independent post-completion", "Do not relabel them", "a prior-FAIL/corrected-PASS witness", "UNKNOWN", "#1561"].every(x => grant.body.includes(x))) fail("profile_authority_scope_invalid");
  if (Date.parse(observations.execution_grant.timestamp) <= Date.parse(observations.accepted_repair.timestamp)) fail("profile_authority_order_invalid");
  if (pr?.number !== p.pull_request || pr.state !== "open" || pr.draft !== true || pr.merged !== false || pr.auto_merge !== null ||
      pr.head?.repo?.full_name !== "hynk-studio/augnes" || pr.base?.repo?.full_name !== "hynk-studio/augnes" || pr.head.sha !== p.head || pr.head.ref !== p.branch || pr.base.sha !== p.base || pr.base.ref !== "main") fail("profile_published_source_invalid");
  return observations;
}
export async function authorizeOperatingProfileSuccession(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  if (!isOperatingProfileSuccession(p) || p.pull_request !== PROFILE_ACCEPTED.pull_request || !keys(p.authorization, ["grant_comment_id", "grant_sha256"]) ||
      p.authorization.grant_comment_id !== PROFILE_ACCEPTED.grant_id || p.authorization.grant_sha256 !== PROFILE_ACCEPTED.grant_sha256 ||
      p.improvement?.review?.id !== PROFILE_ACCEPTED.review_id || p.improvement.review.sha256 !== PROFILE_ACCEPTED.review_sha256) fail("profile_authority_missing");
  const repair = await transport.review(p.improvement.review.id), grant = await transport.grant(p.authorization.grant_comment_id);
  const permissions = { accepted_repair: await transport.permission(repair?.user?.login), execution_grant: await transport.permission(grant?.user?.login) };
  const observations = validateOperatingProfileAuthorityRecords(p, repair, grant, permissions, await transport.pullRequest());
  const capability = Object.freeze({ observations }); capabilities.set(capability, { proof: digest(p), observations: digest(observations) }); return capability;
}
export function assertOperatingProfileAuthorization(p, capability, completion) {
  const state = capabilities.get(capability);
  if (!state || state.proof !== digest(p) || state.observations !== digest(capability.observations) ||
      Date.parse(capability.observations.accepted_repair.timestamp) <= Date.parse(completion.finished_at)) fail("profile_authenticated_authority_required");
}
export function validOperatingProfileAttempt(attempt) {
  const p = attempt?.source_correction;
  return isOperatingProfileSuccession(p) && attempt.number === 1 && !attempt.recovery && !attempt.browser_replacement &&
    exact(attempt.budget, { initial: 1, recovery: 0 }) && exact(p.budget, { initial: 1, recovery: 0 }) && p.branch === attempt.branch &&
    p.pull_request === PROFILE_ACCEPTED.pull_request && [1, 2].includes(p.prior_number) && sha(p.prior_family_id) && sha(p.prior_receipt_fingerprint) &&
    typeof p.prior_attempt_id === "string" && p.prior_attempt_id.length > 0 && sha(p.final_source?.sha256) &&
    p.originals?.receipt?.sha256 === PROFILE_ACCEPTED.receipt_sha256 && p.originals?.attempt?.sha256 === PROFILE_ACCEPTED.attempt_sha256 &&
    p.originals?.completion?.sha256 === PROFILE_ACCEPTED.completion_sha256 && p.originals?.log?.sha256 === PROFILE_ACCEPTED.retained_log_sha256 &&
    p.improvement?.evidence?.accepted_manifest?.sha256 === PROFILE_ACCEPTED.manifest_sha256 && sha(p.improvement?.evidence?.manifest?.sha256) &&
    p.improvement?.review?.id === PROFILE_ACCEPTED.review_id && p.improvement?.review?.sha256 === PROFILE_ACCEPTED.review_sha256 &&
    p.authorization?.grant_comment_id === PROFILE_ACCEPTED.grant_id && p.authorization?.grant_sha256 === PROFILE_ACCEPTED.grant_sha256 &&
    [p.base, p.head, p.tree, p.improvement?.head, p.improvement?.tree, p.improvement?.base].every(commit) && p.head === attempt.head && p.tree === attempt.tree &&
    Date.parse(attempt.profile_authority?.execution_grant?.timestamp) > Date.parse(attempt.profile_authority?.accepted_repair?.timestamp) &&
    ["accepted_repair", "execution_grant"].every(role => {
      const o = attempt.profile_authority?.[role], ref = role === "accepted_repair" ? p.improvement?.review : { id: p.authorization?.grant_comment_id, sha256: p.authorization?.grant_sha256 };
      return keys(o, ["id", "author", "author_id", "body_sha256", "timestamp", "role", "commit_id"]) && o.role === role && o.id === ref?.id && digest(o) === ref?.sha256 &&
        Number.isSafeInteger(o.id) && o.id > 0 && Number.isSafeInteger(o.author_id) && o.author_id > 0 && /^[A-Za-z0-9-]{1,39}$/u.test(o.author ?? "") &&
        sha(o.body_sha256) && time(o.timestamp) && o.commit_id === (role === "accepted_repair" ? p.improvement.head : null);
    });
}
