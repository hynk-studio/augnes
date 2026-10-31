// Prospective initial closeout for the separately authorized #1559 scope.
// The exhausted v7 grant and every historical failure remain immutable.
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest } from "./local-canonical-inputs.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "./local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const CLOSEOUT_SCHEMA = "augnes.local-canonical-closeout.v1";
export const isCloseout = p => p?.schema === CLOSEOUT_SCHEMA && p.kind === "issue_1559_closeout";
// BEGIN CLOSEOUT PINS
export const CLOSEOUT_PINS = Object.freeze({
  pull_request: 1560, branch: "codex/1559-direction-history",
  accepted_base: "c14788f9dc1fabbbddd8b7029f2e5fb7549dc96b",
  prior_head: "9e7baa0042ead359745722caaa11c01ea1c8ddcc", prior_tree: "088228a69e96dd30febde69a30beb2febd0faddc",
  prior_family_id: "280e5bc1c700b78ca9bba2b893cc4d81353192224253699d07513b286fb7bc58",
  prior_attempt_id: "2026-10-30T23-50-53-140Z-full-9e7baa0042ea-68570319d27ffb14",
  prior_receipt_fingerprint: "e6eecbc2007354e1d2538e92de609b3b5350d172081eb1988fe65c669c01c7a9",
  completed_at: "2026-10-30T23:59:47.443Z",
  repair_head: "fc46e56680100d130e7f61e948dd30447b0e609b", repair_tree: "a42249b83120927105f5b48015bb78d35ffb0f38",
  repair_hashes: {
    "scripts/fixtures/companion-service-contract-families.mjs": "e011347149344b2978434e324c0bf90e1e7f3e2545518d5ba26800bbf60a3848",
    "scripts/test-companion-service-contract.mjs": "55927de9dd946ef17052d7e2357c6d392b6c69bfdd1f197464a4b4c2d6dc0e45",
  },
  originals: {
    receipt: "30e3d881b8ece8fa6e90fbf0e39092952f7e656f6d1057af8080e2f37eed98db",
    attempt: "81628c8a56262e8d6fad00a97a5bcadd2ac904a092d1f677558790731d21e242",
    completion: "5bfc8f13c368fecb1a25cd67858a2a69472ed6aff2ee6c964617fa30ff39842d",
    edge: "8f099e29194586fb9829c0e97bcdceba4dce015059ce9cfd7c00547a878cb28a",
    unit_log: "18f5b6b2fc1ecf22b36f6698e0566310f8aa716644cd864717217e557ce990ee",
    stock: "aac21ec14504978c0a65192ba5fe97348d3a710d91ffa9987d81b0d8941ac1ce",
    stock_log: "e280f29dcae5612be749876544e27eedf89ce51848993d60b5980ea50d8f57c1",
  },
  manifest: "ab3aa63b9d435dc994d72d4abd5509cc95c9952ee6b646d83115eb5eae459c71",
  source_bindings: "c0f1d6e81f56e3a3dd318c8ea40861faf1d76c3d5cb3e83e21e25950573c9139",
  native_delta: "b009ebcdce5f012086820003d2f53916abaf6856a55aac0141f52d1468f70191",
  full_pr_delta: "7ac5472e5d2871a46dd09d13b6e7b157b0364f3f0d4eda06a1133491a9e5590d",
  comparison: "8ce712fbfd1f7dc6f15f41b55780bcf96b1b2a524ea915a219240f3eb6bfc437",
  accepted_review: {
    source_url: "https://chatgpt.com/space/page_939e86984fc88191bdfc0ebcc53ba434",
    block_id: "8bd45b5c-b87b-4eae-a776-72115d165c98", block_sha256: "d02e465a86e8c85d35801f4eff1bc7723c6df7dab9ed4222d3b1d69e5dc4b79c",
    reviewed_at: "2026-10-31T02:09:57Z", sha256: "583de644d6d379f51f05b4a57f77f9c241d80e1f6bb6e68ab5e710f2baef2ac5",
  },
  scope: { id: 6537722343, author: "hynk-studio", author_id: 89450056,
    body_sha256: "c41aacb6f25b4e60d19d00a54168be213b55c414a73c7c89ed1ea7b6a6479a36", timestamp: "2026-10-31T02:21:00Z" },
});
// END CLOSEOUT PINS
for (const value of Object.values(CLOSEOUT_PINS)) if (value && typeof value === "object") Object.freeze(value);
const POLICY_PATHS = new Set(["scripts/local-canonical-1559-closeout.mjs", "scripts/local-canonical-attempts.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/local-canonical-receipt.mjs", "scripts/local-canonical-review-export.mjs",
  ".github/LOCAL_CANONICAL_VERIFICATION.md", "scripts/fixtures/local-canonical-1559-closeout.mjs",
  "scripts/test-local-canonical-executor.mjs", "scripts/test-local-canonical-review-corrections.mjs"]);
const SCOPE_CORRECTION_POLICY_PATHS = new Set([...POLICY_PATHS, "scripts/test-local-canonical-receipt.mjs"]);
const REPAIR_PATHS = Object.keys(CLOSEOUT_PINS.repair_hashes).sort();
const BUDGET = Object.freeze({ initial: 1, recovery: 0 });
const capabilities = new WeakMap(), fail = code => { throw Object.assign(new Error(code), { code }); };
const sha = x => typeof x === "string" && /^[a-f0-9]{64}$/u.test(x);
const commit = x => typeof x === "string" && /^[a-f0-9]{40}$/u.test(x);
const exact = (a, b) => digest(a) === digest(b);
const keys = (x, names) => x && typeof x === "object" && !Array.isArray(x) && exact(Object.keys(x).sort(), [...names].sort());
const validTime = x => typeof x === "string" && Number.isFinite(Date.parse(x)) && Date.parse(x) <= Date.now();
const json = bytes => JSON.parse(bytes.toString("utf8"));
const gitAt = repo => args => execFileSync("git", args, { cwd: repo, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
function safeBytes(file, maximum) {
  const s = lstatSync(file);
  if (realpathSync(file) !== file || !s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > maximum) fail("closeout_evidence_unsafe");
  return readFileSync(file);
}
export function closeoutArtifact(folder, ref, maximum = 2 * 1024 * 1024) {
  if (!keys(ref, ["artifact", "sha256"]) || !/^[A-Za-z0-9_-]+\.(?:json|jsonl|log|mjs|md|diff|txt|output)$/u.test(ref.artifact ?? "") || !sha(ref.sha256)) fail("closeout_evidence_reference_invalid");
  const bytes = safeBytes(path.join(folder, ref.artifact), maximum);
  if (digest(bytes) !== ref.sha256) fail("closeout_evidence_changed");
  return bytes;
}
const artifactRef = ref => ({ artifact: ref?.artifact, sha256: ref?.sha256 });

// Compute every accepted-task row, even when a final candidate deletes it. Main
// reconciliation is a union of tree identities, not just the final diff's paths.
export function inspectCloseoutSourceScope(repositoryRoot, { base, head }) {
  return inspectSourceScope(repositoryRoot, { base, head }, CLOSEOUT_PINS.accepted_base, CLOSEOUT_PINS.repair_head).scope;
}
function inspectSourceScope(repositoryRoot, { base, head }, acceptedBase, repairHead, extraPaths = [], policyPaths = POLICY_PATHS) {
  if (![base, head].every(commit)) fail("closeout_source_scope_invalid");
  const git = gitAt(repositoryRoot);
  for (const [a, b] of [[acceptedBase, repairHead], [acceptedBase, base], [repairHead, head], [base, head]]) git(["merge-base", "--is-ancestor", a, b]);
  const changed = (a, b) => git(["diff", "--no-renames", "--name-only", "-z", a, b, "--"]).toString().split("\0").filter(Boolean).sort();
  const trees = new Map(), blobs = new Map();
  const tree = ref => {
    if (!trees.has(ref)) {
      const entries = new Map();
      for (const line of git(["ls-tree", "-rz", "--full-tree", ref]).toString().split("\0").filter(Boolean)) {
        const match = line.match(/^(\d{6}) (blob|commit) ([a-f0-9]{40})\t([^]+)$/u);
        if (!match || entries.has(match[4])) fail("closeout_source_tree_invalid");
        entries.set(match[4], { mode: match[1], type: match[2], object: match[3] });
      }
      trees.set(ref, entries);
    }
    return trees.get(ref);
  };
  const acceptedPaths = changed(acceptedBase, repairHead), candidatePaths = changed(base, head), mainPaths = changed(acceptedBase, base);
  const wanted = new Set();
  for (const [ref, names] of [[repairHead, [...acceptedPaths, ...extraPaths]], [head, [...acceptedPaths, ...mainPaths, ...candidatePaths, ...extraPaths]], [base, mainPaths]])
    for (const name of names) { const entry = tree(ref).get(name); if (entry?.type === "blob") wanted.add(entry.object); }
  if (wanted.size) {
    const batch = execFileSync("git", ["cat-file", "--batch"], { cwd: repositoryRoot, input: [...wanted].join("\n") + "\n", timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] });
    let offset = 0;
    for (const object of wanted) {
      const end = batch.indexOf(10, offset), match = end < 0 ? null : batch.subarray(offset, end).toString().match(/^([a-f0-9]{40}) blob (\d+)$/u);
      if (!match || match[1] !== object) fail("closeout_source_blob_invalid");
      const size = Number(match[2]); offset = end + 1;
      if (!Number.isSafeInteger(size) || size < 0 || offset + size >= batch.length || batch[offset + size] !== 10) fail("closeout_source_blob_invalid");
      blobs.set(object, digest(batch.subarray(offset, offset + size))); offset += size + 1;
    }
    if (offset !== batch.length) fail("closeout_source_blob_invalid");
  }
  const state = (ref, name) => { const entry = tree(ref).get(name); return entry ? { present: true, ...entry, sha256: entry.type === "blob" ? blobs.get(entry.object) : null } : { present: false }; };
  const accepted = new Set(acceptedPaths);
  const scope = { schema: "augnes.local-canonical-closeout-source-scope.v1", basis: "accepted_task_and_current_main_union",
    accepted_base: acceptedBase, accepted_head: repairHead, current_main: base, accepted_task_paths: acceptedPaths, candidate_delta_paths: candidatePaths,
    policy_delta_paths: candidatePaths.filter(name => policyPaths.has(name)),
    candidate_policy: candidatePaths.filter(name => policyPaths.has(name)).map(name => ({ path: name, candidate: state(head, name) })),
    accepted_task: acceptedPaths.map(name => ({ path: name, accepted: state(repairHead, name), candidate: state(head, name) })),
    main_reconciliation: mainPaths.map(name => ({ path: name, rule: policyPaths.has(name) ? "bounded_policy_owner" : accepted.has(name) ? "main_matches_accepted_task" : "preserve_accepted_main", accepted_main: state(base, name), candidate: state(head, name) })) };
  return { scope, state };
}
export function validateCloseoutSourceScope(scope) {
  return validateRetainedSourceScope(scope, 27);
}
function validateRetainedSourceScope(scope, acceptedCount, policyPaths = POLICY_PATHS) {
  const accepted = new Map(scope.accepted_task.map(row => [row.path, row]));
  if (!exact([...accepted.keys()].sort(), scope.accepted_task_paths) || scope.accepted_task_paths.length !== acceptedCount ||
    !exact(scope.policy_delta_paths, scope.candidate_delta_paths.filter(name => policyPaths.has(name))) ||
    !exact(scope.candidate_policy.map(row => row.path), scope.policy_delta_paths)) fail("closeout_accepted_inventory_invalid");
  for (const name of new Set([...scope.accepted_task_paths, ...scope.candidate_delta_paths])) {
    const row = accepted.get(name);
    if (policyPaths.has(name)) {
      if (row && (row.candidate.present !== row.accepted.present || row.candidate.mode !== row.accepted.mode || row.candidate.type !== row.accepted.type)) fail("closeout_accepted_policy_removed");
    } else if (!row || !exact(row.accepted, row.candidate)) fail("closeout_accepted_source_changed");
  }
  for (const row of scope.main_reconciliation) {
    if (row.rule === "main_matches_accepted_task" && !exact(row.accepted_main, accepted.get(row.path)?.accepted)) fail("closeout_main_conflict");
    if (row.rule !== "bounded_policy_owner" && !exact(row.accepted_main, row.candidate)) fail("closeout_main_changed");
    if (row.rule === "bounded_policy_owner" && row.accepted_main.present && (!row.candidate.present || row.candidate.mode !== row.accepted_main.mode || row.candidate.type !== row.accepted_main.type)) fail("closeout_main_policy_removed");
  }
  for (const s of [...scope.accepted_task.flatMap(x => [x.accepted, x.candidate]), ...scope.main_reconciliation.flatMap(x => [x.accepted_main, x.candidate]), ...scope.candidate_policy.map(x => x.candidate)])
    if (s.present && (s.type !== "blob" || !["100644", "100755"].includes(s.mode) || !sha(s.sha256))) fail("closeout_source_type_invalid");
  return scope;
}

function semanticProof(p) {
  const a = CLOSEOUT_PINS, review = p?.repair?.accepted_review;
  return isCloseout(p) && p.pull_request === a.pull_request && p.branch === a.branch && [p.base, p.head, p.tree].every(commit) &&
    p.prior_family_id === a.prior_family_id && p.prior_attempt_id === a.prior_attempt_id && p.prior_receipt_fingerprint === a.prior_receipt_fingerprint && p.prior_number === 1 &&
    p.repair?.head === a.repair_head && p.repair?.tree === a.repair_tree && exact(p.budget, BUDGET) &&
    Object.entries(a.originals).every(([name, hash]) => p.originals?.[name]?.sha256 === hash) &&
    ["manifest", "source_bindings", "native_delta", "full_pr_delta", "comparison"].every(name => p.repair?.[name]?.sha256 === a[name]) &&
    Object.entries(a.accepted_review).every(([name, value]) => review?.[name] === value) && sha(p.final_source?.sha256) &&
    p.source_scope?.schema === "augnes.local-canonical-closeout-source-scope.v1" && p.source_scope.accepted_base === a.accepted_base && p.source_scope.accepted_head === a.repair_head && p.source_scope.current_main === p.base;
}
function originalEvidence(folder, p) {
  const old = Object.fromEntries(Object.keys(CLOSEOUT_PINS.originals).map(name => { const bytes = closeoutArtifact(folder, p.originals[name]); return [name, name.endsWith("log") ? bytes : json(bytes)]; }));
  const r = old.receipt, prior = old.attempt, c = old.completion, copy = { ...r }; delete copy.integrity;
  if (r.integrity?.content_fingerprint !== digest(copy) || r.integrity.content_fingerprint !== p.prior_receipt_fingerprint || !exact(r.attempt, prior) ||
    prior.head !== CLOSEOUT_PINS.prior_head || prior.tree !== CLOSEOUT_PINS.prior_tree || prior.family_id !== p.prior_family_id || prior.attempt_id !== p.prior_attempt_id || prior.number !== 1 || prior.branch !== p.branch ||
    prior.source_correction?.kind !== "companion_readiness_timeout" || prior.source_correction?.schema !== "augnes.local-canonical-source-correction.v7" ||
    c.attempt_id !== prior.attempt_id || c.receipt_fingerprint !== p.prior_receipt_fingerprint || c.finished_at !== CLOSEOUT_PINS.completed_at || c.disposition !== "product_failure" || c.infrastructure_code !== null || c.cleanup_complete !== true ||
    old.edge.contract !== "augnes.local-canonical-successor.v2" || old.edge.kind !== "companion_readiness_timeout" || old.edge.family_id !== prior.family_id || old.edge.head !== prior.head || old.edge.tree !== prior.tree || old.edge.proof_fingerprint !== digest(prior.source_correction) ||
    r.outcome?.disposition !== "product_failure" || r.outcome.safety !== "preserved_within_observed_scope" || r.outcome.first_fault !== null || r.inputs?.first_fault !== null || r.inputs.secondary_faults?.length !== 0 ||
    r.cleanup?.completed !== true || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true || r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 ||
    !exact(r.phases?.map(x => x.id), BROWSER_REPLACEMENT_PHASES) || !exact(r.phases.map(x => x.status), [...Array(5).fill("pass"), "failure", ...Array(10).fill("not_run")]) ||
    old.stock.content_fingerprint !== p.prior_receipt_fingerprint || old.stock.valid_deciding_evidence !== false || old.stock.issues?.length !== 15) fail("closeout_original_binding_invalid");
  const unit = r.phases.find(x => x.id === "unit"), lines = old.unit_log.toString("utf8").split("\n");
  if (unit.timed_out !== false || unit.exit_status !== 1 || unit.cleanup?.termination_reason !== "natural_exit" || unit.log?.truncated !== false || unit.log.bytes !== old.unit_log.length) fail("closeout_original_unit_invalid");
  const results = lines.filter(x => x.startsWith("[canonical:unit] child_result "));
  const failed = results.filter(x => !/ exit_code=0 signal=null timed_out=false .*termination_reason=natural_exit$/u.test(x));
  if (results.length !== 52 || failed.length !== 1 || !/^\[canonical:unit\] child_result label="machine-owned Companion service and public lifecycle contract" duration_ms=30073 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout$/u.test(failed[0]) ||
    !lines.includes('[canonical:unit] child_start label="machine-owned Companion service and public lifecycle contract" timeout_ms=30000')) fail("closeout_original_nested_timeout_invalid");
  return { original: r, prior, completion: c };
}

const comparisonLabels = ["pair-1-baseline", "pair-1-candidate", "pair-2-candidate", "pair-2-baseline", "pair-3-baseline", "pair-3-candidate"];
export const CLOSEOUT_RETAINED_PATHS = Object.freeze([
  ...comparisonLabels.flatMap(label => ["output.log", "settlement.json", "source-command.json"].map(name => `${label}/${name}`)),
  ...["dev-normal-1", "dev-output-failure", "dev-lifecycle-failure", "dev-output-cleanup-failure"].flatMap(label => ["output.log", "settlement.json", "source-command.json", "instrumentation.json", "observations.jsonl"].map(name => `${label}/${name}`)),
  "helper-controls-run/output.log", "helper-controls-run/settlement.json", "helper-controls-run/source-and-command.json", "helper-controls-run/exact-helper.mjs", "helper-controls.mjs",
  "comparison-plan.json", "comparison-analysis.json", "adverse-analysis.json", "check-controls-v1.mjs", "check-controls-v1.output", "check-controls.mjs", "check-controls.output", "analysis-checker-correction.md",
  "run-comparison.mjs", "run-focused.mjs", "run-helper-controls.mjs", "instrument-controls.mjs", "observe-child.mjs", "owned-cleanup-summary.json",
].sort());
function retainedEvidence(folder, p) {
  const read = ref => closeoutArtifact(folder, ref), manifest = json(read(p.repair.manifest)), comparison = json(read(p.repair.comparison));
  if (!Array.isArray(manifest.files) || new Set(manifest.files.map(x => x.path)).size !== manifest.files.length || !Array.isArray(p.repair.retained) ||
    !exact(p.repair.retained.map(x => x.path).sort(), CLOSEOUT_RETAINED_PATHS)) fail("closeout_retained_inventory_invalid");
  const values = new Map();
  for (const ref of p.repair.retained) {
    if (!keys(ref, ["path", "artifact", "sha256"])) fail("closeout_retained_reference_invalid");
    const item = manifest.files.find(x => x.path === ref.path), bytes = read(artifactRef(ref));
    if (!item || item.bytes !== bytes.length || item.sha256 !== ref.sha256) fail("closeout_retained_manifest_mismatch");
    values.set(ref.path, bytes);
  }
  const settled = (record, exit) => record?.nondeciding === true && validTime(record.started_at) && validTime(record.finished_at) &&
    record.result?.exit_code === exit && record.result.signal === null && record.result.timed_out === false && record.result.cancelled === false && record.result.spawn_error_code === null &&
    record.result.exit_observed === true && record.result.streams_closed === true && record.result.cleanup_completed === true && record.result.remaining_owned_processes === 0 && record.result.termination_reason === "natural_exit" &&
    record.result.duration_ms < 30000 && record.root_absent === true && Array.isArray(record.cleanup) && record.cleanup.length === 1 && record.cleanup.every(x => x.completed === true && x.failure_count === 0 && x.failures?.length === 0);
  if (comparison.plan?.baseline_head !== CLOSEOUT_PINS.prior_head || comparison.plan.candidate_head !== p.repair.head || comparison.plan.timeout_ms_per_complete_child !== 30000 || comparison.plan.pairs !== 3 ||
    comparison.stopped !== null || !exact(comparison.results?.map(x => x.label), comparisonLabels) || Date.parse(comparison.finished_at) >= Date.parse(p.repair.accepted_review.reviewed_at)) fail("closeout_comparison_invalid");
  for (const row of comparison.results) {
    const record = json(values.get(`${row.label}/settlement.json`)), command = json(values.get(`${row.label}/source-command.json`));
    const { pair, revision, label, ...actual } = row;
    if (!exact(record, actual) || !settled(record, 0) || command.nondeciding !== true || command.mode !== "plain" || command.source_status !== "" || command.timeout_ms !== 30000 || command.require_natural_exit !== false ||
      command.head !== (revision === "final" ? p.repair.head : CLOSEOUT_PINS.prior_head) || command.started_at !== record.started_at) fail("closeout_comparison_settlement_invalid");
  }
  for (const label of ["dev-normal-1", "dev-output-failure", "dev-lifecycle-failure", "dev-output-cleanup-failure"]) {
    if (!settled(json(values.get(`${label}/settlement.json`)), label === "dev-normal-1" ? 0 : 1)) fail("closeout_adverse_settlement_invalid");
  }
  const helper = json(values.get("helper-controls-run/settlement.json"));
  if (!settled(helper, 0) || helper.helper_unchanged !== true || helper.failure !== null) fail("closeout_helper_settlement_invalid");
  const review = json(read(artifactRef(p.repair.accepted_review)));
  if (review.source_url !== p.repair.accepted_review.source_url || review.review_completed_at !== p.repair.accepted_review.reviewed_at || !Array.isArray(review.blocks) ||
    !review.blocks.some(x => x.id === p.repair.accepted_review.block_id && x.hash === p.repair.accepted_review.block_sha256 && digest(x.markdown) === x.hash)) fail("closeout_accepted_review_provenance_invalid");
}

function readInitialCloseoutEvidence(file, p, repositoryRoot) {
  const stored = { ...p }; delete stored.local_relative_path;
  if (!keys(stored, ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "repair", "source_scope", "final_source", "authorization", "budget"]) || !semanticProof(p) ||
    !keys(p.originals, Object.keys(CLOSEOUT_PINS.originals)) || !keys(p.repair, ["head", "tree", "accepted_review", "manifest", "source_bindings", "native_delta", "full_pr_delta", "comparison", "retained"]) ||
    !keys(p.repair.accepted_review, ["source_url", "block_id", "block_sha256", "reviewed_at", "artifact", "sha256"])) fail("closeout_proof_invalid");
  const folder = path.dirname(file), originals = originalEvidence(folder, p), git = gitAt(repositoryRoot);
  retainedEvidence(folder, p);
  const source = json(closeoutArtifact(folder, p.final_source)), bindings = json(closeoutArtifact(folder, p.repair.source_bindings));
  if (!keys(source, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "repair_head", "repair_tree", "deltas"]) || source.schema !== "augnes.local-canonical-closeout-final-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
    source.base !== p.base || source.head !== p.head || source.tree !== p.tree || source.predecessor_head !== CLOSEOUT_PINS.prior_head || source.predecessor_tree !== CLOSEOUT_PINS.prior_tree || source.repair_head !== p.repair.head || source.repair_tree !== p.repair.tree ||
    !keys(source.deltas, ["repair", "predecessor", "reviewed", "main"]) || bindings.head !== p.repair.head || bindings.tree !== p.repair.tree || bindings.branch !== p.branch || bindings.status !== "") fail("closeout_final_source_invalid");
  if (git(["rev-parse", `${p.head}^{tree}`]).toString().trim() !== p.tree || git(["rev-parse", `${p.repair.head}^{tree}`]).toString().trim() !== p.repair.tree) fail("closeout_source_tree_mismatch");
  const delta = (a, b) => git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", a, b, "--"]);
  const paths = (a, b) => git(["diff", "--no-renames", "--name-only", "-z", a, b, "--"]).toString().split("\0").filter(Boolean).sort();
  for (const [kind, a, b] of [["repair", CLOSEOUT_PINS.prior_head, p.repair.head], ["predecessor", CLOSEOUT_PINS.prior_head, p.head], ["reviewed", p.repair.head, p.head], ["main", p.base, p.head]]) {
    const bytes = delta(a, b), declared = source.deltas[kind];
    if (!keys(declared, ["sha256", "bytes", "changed_paths"]) || declared.sha256 !== digest(bytes) || declared.bytes !== bytes.length || !exact(declared.changed_paths, paths(a, b))) fail("closeout_native_delta_invalid");
  }
  if (!closeoutArtifact(folder, p.repair.native_delta).equals(delta(CLOSEOUT_PINS.prior_head, p.repair.head)) || !closeoutArtifact(folder, p.repair.full_pr_delta).equals(delta(CLOSEOUT_PINS.accepted_base, p.repair.head)) ||
    !exact(paths(CLOSEOUT_PINS.prior_head, p.repair.head), REPAIR_PATHS)) fail("closeout_accepted_delta_changed");
  const scope = inspectCloseoutSourceScope(repositoryRoot, p); validateCloseoutSourceScope(scope);
  if (!exact(scope, p.source_scope)) fail("closeout_source_scope_mismatch");
  for (const [name, hash] of Object.entries(CLOSEOUT_PINS.repair_hashes))
    if (digest(git(["show", `${p.repair.head}:${name}`])) !== hash || digest(git(["show", `${p.head}:${name}`])) !== hash) fail("closeout_accepted_repair_changed");
  return { ...originals, source };
}

export function closeoutAuthorityObservation(record) {
  return { id: record.id, author: record.user?.login, author_id: record.user?.id, body_sha256: digest(record.body), timestamp: record.updated_at,
    role: "closeout_scope", commit_id: null };
}
function validObservation(p, observation) {
  const expected = { ...CLOSEOUT_PINS.scope, role: "closeout_scope", commit_id: null };
  return keys(observation, Object.keys(expected)) && exact(observation, expected) && p.authorization?.scope_comment_id === expected.id && p.authorization.scope_sha256 === digest(observation) &&
    validTime(observation.timestamp) && Date.parse(observation.timestamp) > Date.parse(p.repair.accepted_review.reviewed_at);
}
async function authorizeInitialCloseout(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  if (!semanticProof(p) || !keys(p.authorization, ["scope_comment_id", "scope_sha256"]) || p.authorization.scope_comment_id !== CLOSEOUT_PINS.scope.id || !sha(p.authorization.scope_sha256)) fail("closeout_authority_missing");
  const record = await transport.grant(p.authorization.scope_comment_id);
  if (record?.id !== CLOSEOUT_PINS.scope.id || record.user?.type !== "User" || record.user.login !== CLOSEOUT_PINS.scope.author || record.user.id !== CLOSEOUT_PINS.scope.author_id ||
    record.author_association !== "OWNER" || record.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}` || record.created_at !== CLOSEOUT_PINS.scope.timestamp || typeof record.body !== "string" || Buffer.byteLength(record.body) > 65536) fail("closeout_authority_identity_invalid");
  const observation = closeoutAuthorityObservation(record);
  if (!validObservation(p, observation)) fail("closeout_authority_changed");
  const permission = await transport.permission(record.user.login);
  if (permission.user?.login !== record.user.login || !["admin", "maintain"].includes(permission.permission)) fail("closeout_authority_permission_invalid");
  const pr = await transport.pullRequest();
  if (pr?.number !== p.pull_request || pr.state !== "open" || pr.draft !== true || pr.merged !== false || pr.auto_merge !== null || pr.head?.repo?.full_name !== "hynk-studio/augnes" || pr.base?.repo?.full_name !== "hynk-studio/augnes" ||
    pr.head.sha !== p.head || pr.head.ref !== p.branch || pr.base.sha !== p.base || pr.base.ref !== "main") fail("closeout_published_source_invalid");
  const capability = Object.freeze({ observations: { closeout_scope: observation } });
  capabilities.set(capability, { proof: digest(p), observations: digest(capability.observations) }); return capability;
}
function assertInitialCloseoutAuthorization(p, capability, completion) {
  const state = capabilities.get(capability);
  if (!state || state.proof !== digest(p) || state.observations !== digest(capability.observations) || completion?.finished_at !== CLOSEOUT_PINS.completed_at || Date.parse(capability.observations.closeout_scope.timestamp) <= Date.parse(completion.finished_at)) fail("closeout_authenticated_authority_required");
}
function validInitialCloseoutAttempt(attempt) {
  try {
    const p = attempt?.source_correction;
    if (!semanticProof(p) || attempt.number !== 1 || attempt.recovery || attempt.browser_replacement || !exact(attempt.budget, BUDGET) || attempt.branch !== p.branch || attempt.head !== p.head || attempt.tree !== p.tree ||
      !Array.isArray(p.repair.retained) || !exact(p.repair.retained.map(x => x.path).sort(), CLOSEOUT_RETAINED_PATHS) || p.repair.retained.some(x => !sha(x.sha256)) || !validObservation(p, attempt.closeout_authority?.closeout_scope)) return false;
    validateCloseoutSourceScope(p.source_scope); return true;
  } catch { return false; }
}

// One actual correction after the settled initial closeout failure. This profile
// does not recognize any other timeout, repair, later head or successor chain.
export const CLOSEOUT_CONTINUATION_SCHEMA = "augnes.local-canonical-closeout-continuation.v1";
export const CLOSEOUT_CONTINUATION_KIND = "issue_1559_operational_validation_correction";
export const CLOSEOUT_SCOPE_CORRECTION_KIND = "issue_1559_source_scope_precheck_correction";
export const isCloseoutContinuation = p => p?.schema === CLOSEOUT_CONTINUATION_SCHEMA && p.kind === CLOSEOUT_CONTINUATION_KIND;
export const isCloseoutScopeCorrection = p => p?.schema === CLOSEOUT_CONTINUATION_SCHEMA && p.kind === CLOSEOUT_SCOPE_CORRECTION_KIND;
export const isAnyCloseout = p => isCloseout(p) || isCloseoutContinuation(p) || isCloseoutScopeCorrection(p);
export const hasCloseoutMarker = attempt => [CLOSEOUT_SCHEMA, CLOSEOUT_CONTINUATION_SCHEMA].includes(attempt?.source_correction?.schema) ||
  ["issue_1559_closeout", CLOSEOUT_CONTINUATION_KIND, CLOSEOUT_SCOPE_CORRECTION_KIND].includes(attempt?.source_correction?.kind) || !!attempt?.closeout_authority ||
  !!attempt?.closeout_consumed || !!attempt?.closeout_continuation_consumed || !!attempt?.closeout_scope_correction_consumed;
// BEGIN CLOSEOUT CONTINUATION PINS
export const CLOSEOUT_CONTINUATION_PINS = Object.freeze({
  prior_head: "ac8d6f04eb272c3d2222f30dda26cec6d540d0a2", prior_tree: "5678fe6a802ae3693857da90b8a4627a9766fc02",
  prior_family_id: "cf31595ef308fe280f426ffc3a30321444ecc1459fae8b845c6c6937bedcc372",
  prior_attempt_id: "2026-10-31T03-27-52-978Z-full-ac8d6f04eb27-e3404ce46f8977b0",
  prior_receipt_fingerprint: "64d0e0855d829e32ab930d930a95e9f584102f4332d97888086f1675f3161cae",
  completed_at: "2026-10-31T03:31:49.212Z",
  initial_proof: "61533ce2af79affc083e5ed5cf3f8c9498dddd438629183f4b985a5cba8085ea",
  originals: {
    receipt: "5a959e12135e2d0ec9257b57c970746fe46df826575816a8651262f7485a33f0",
    attempt: "1d7b23f1d3cc446e6371a741f778bca54576f80d5c61ba6e1eab71a5e4e500d5",
    completion: "c7e073f17989c65d157ab8749df457b94b4423be149dd408feb0d7b7ac986b72",
    edge: "12d35e566147ff516afe794f5dd401cb267bde393ccb06c03e67925f18c597fa",
    unit_log: "2d6425bec4a5146ce0499d6f4f67362dda5d1c47404dc348026de21cb5cfb2e3",
    stock: "b8a046bebc59ff4c8c42880cdda8114fe42c1ef12d3545b2a54baae6fbbcb37b",
    stock_log: "083ec4d068c45e59f7cda59b9579333323ba9aff099674d929b109dfad6426e9",
  },
  source_hashes: {
    "lib/vnext/review-decision.ts": "1ace29178f1a6883040f15235a3b002fa97399385ee98447db91783e2e8e7f5d",
    "lib/vnext/runtime/operator-pilot-review-material.ts": "86bad29cd3de440da353f38327ae0b939ae4e32fc4c151b749ba6b220d4f7ba6",
    "scripts/vnext-protocol-conformance/review-decision.ts": "4b1e8a4e10af15a5519fb7a328a0cc30a1b212b6560ed850c29cb6c2de0eb55c",
  },
  evidence: {
    diagnostic_command: "06aea383245993578bc14fe564057077d8ae22af1c09b64398565d810fe54cd5",
    diagnostic_settlement: "3d25f3c5cec246a47da7d01e674894d65e85cbb0128ae62a6430ae5cacafc238",
    diagnostic_log: "614773989273b7abfea29d4e6c21815a49d7d9ab9950f61ca38d34e273a23c03",
    corrected_observed_command: "f58d653c6b616ecbc1a93e88adadc56d2be74f925ca6687d992c9d4e4533ff43",
    corrected_observed_settlement: "45cdf21ece8019b647cb68d83da0845e11ffe3912534fbce37e5000ff2e721bc",
    corrected_observed_log: "a1db039f6f45a4e39868a2d1f0572e7344ca7f1f5240bcfa2555f562e419b89e",
    plain_command: "f53ae8e2a5ad3beb1132a9e573be9c2f7aed0a626045a3a3781d2199eaf1b140",
    plain_settlement: "77d634191354d68bc2ae0d7c2546e4bfc9407fbe2424083df9226b4e0a2bda0c",
    plain_log: "a2e8e30e72ca1fc9d2cdec688b602bf890d6822397d3c367f25dc3c0bb911c15",
    protocol_command: "d3bc0763841aa221e706340ae2cb16fa576ad17291e6e3ba5034f5c2f9247845",
    protocol_settlement: "9f94b5ea13e40c22b7b378d85de235f2a72d0fc5008a5853c1ffb416cbe95001",
    protocol_log: "3157f3d3c99a7689d8c05ea0f046a80c498fff44d04d85fb17978027f9f40a8e",
    fresh_session_command: "b63685e90f7f0c84053a712da4ae5e8339c1eb1a2f7674230d6cba7ff9646b77",
    fresh_session_settlement: "92e04ce557c348a5dc14f9dcfd6b7587f01defd606be55663bcd77b48fe54624",
    fresh_session_log: "c18111de330fbda6e41beeaa8c392f65f5c6f5d02553fe0e9854e00a9cfcf095",
    typecheck_command: "d4c7da742543988461574ae8bbaec50676807ced4a720c4697022c1094f5d8aa",
    typecheck_settlement: "874493dc9297ffc42fdef918c56efcdf078bd7e38ae2cf2161be460fca466e4a",
    typecheck_log: "217499b05a72a178c8ed8e287c06dac67f86c5e49d866ef04d0410d66d538453",
    diagnostic_observations: "c0bcc46d0f7885d504db0058adb207002834ee65a689d7cee869d756024bcf86",
    diagnostic_instrumentation: "4e65bae9d3fb573d90f24809dee2c92a8d20458c3c688cb6e5fd91b8dc0a0574",
    corrected_observations: "fe7094f730af2948654f471a8d1bba863d64247af413e9407974ea1aefeff80f",
    corrected_instrumentation: "c1c5e838c3b08dc978fc9c2470dcea15d7174d8e727fb06c6b8f6f46e19dbd98",
    observer: "b4a61980634a903964f6a4d5373fbd917aedcc6b6ed227c20ca3d1c693bbd9e3",
    diagnostic_instrumenter: "77b396c21c3d8f6fd2b61d319499b4e933dbfdbbff8545496c3c24d0b9f42e0a",
    corrected_instrumenter: "c314cbc2be47cb7bc9c920ee41d6a3c0d16ce878a5582ede106236ee4dcd4444",
    source_manifest: "0d3dd7d2789973801ea31d306d7f31561a4634a45df45cc66131e2e948e35d8d",
    analysis: "eebf4448443f8a2db3daaff977de10c61c852798e29df1a0c5de28308e88eaee",
    static_comparison: "ba3e224e533ae301330ff7cdd6a2348cdbb734cd88de9f03656039221ab7e985",
    plain_snapshot: "b0dbd02dfaea6f1347c010085eaee2cb6e2a4ffc385ebd1cde7c8eef08b12335",
    protocol_snapshot: "9875850627ad9763a0c68b0baa5710e58f4fd8bd25781013916c2d6c9d8994a2",
    fresh_session_snapshot: "ab5109ce8927583b0108a30eb6b5b6b04306ff28faba1d807696f77c353649bf",
    typecheck_snapshot: "90a641b15a2029857312ebe7cd71dc6e1d8618fd7d0d03472b3310b3afcdbf15",
  },
});
// END CLOSEOUT CONTINUATION PINS
for (const value of Object.values(CLOSEOUT_CONTINUATION_PINS)) if (value && typeof value === "object") Object.freeze(value);
export const CLOSEOUT_CONTINUATION_EVIDENCE_KEYS = Object.freeze([
  "diagnostic_command", "diagnostic_settlement", "diagnostic_log", "diagnostic_observations", "diagnostic_instrumentation",
  "observer", "diagnostic_instrumenter", "corrected_instrumenter", "corrected_observed_command", "corrected_observed_settlement", "corrected_observed_log",
  "corrected_observations", "corrected_instrumentation", "plain_command", "plain_settlement", "plain_log", "protocol_command", "protocol_settlement", "protocol_log",
  "fresh_session_command", "fresh_session_settlement", "fresh_session_log", "typecheck_command", "typecheck_settlement", "typecheck_log", "source_manifest", "analysis", "static_comparison",
  "plain_snapshot", "protocol_snapshot", "fresh_session_snapshot", "typecheck_snapshot",
]);
const continuationEvidence = new Map();
const continuationPaths = () => Object.keys(CLOSEOUT_CONTINUATION_PINS.source_hashes).sort();
const normalizedProof = p => { const copy = { ...p }; delete copy.local_relative_path; return copy; };

export function inspectCloseoutContinuationSourceScope(repositoryRoot, { base, head }) {
  const prior = CLOSEOUT_CONTINUATION_PINS.prior_head, paths = continuationPaths();
  const { scope, state } = inspectSourceScope(repositoryRoot, { base, head }, CLOSEOUT_PINS.accepted_base, prior, paths);
  return { ...scope, schema: "augnes.local-canonical-closeout-continuation-source-scope.v1", basis: "settled_initial_closeout_and_current_main_union",
    correction_source: paths.map(name => ({ path: name, before: state(prior, name), candidate: state(head, name) })) };
}
export function validateCloseoutContinuationSourceScope(scope) {
  const p = CLOSEOUT_CONTINUATION_PINS, corrected = new Set(continuationPaths()), accepted = new Map(scope.accepted_task.map(row => [row.path, row]));
  if (scope.schema !== "augnes.local-canonical-closeout-continuation-source-scope.v1" || scope.basis !== "settled_initial_closeout_and_current_main_union" ||
    scope.accepted_base !== CLOSEOUT_PINS.accepted_base || scope.accepted_head !== p.prior_head || !commit(scope.current_main) ||
    !exact([...accepted.keys()].sort(), scope.accepted_task_paths) || scope.accepted_task_paths.length !== 29 ||
    !exact(scope.correction_source.map(row => row.path), [...corrected].sort()) ||
    !exact(scope.policy_delta_paths, scope.candidate_delta_paths.filter(name => POLICY_PATHS.has(name))) ||
    !exact(scope.candidate_policy.map(row => row.path), scope.policy_delta_paths)) fail("closeout_continuation_inventory_invalid");
  for (const name of new Set([...scope.accepted_task_paths, ...scope.candidate_delta_paths])) {
    const row = accepted.get(name);
    if (corrected.has(name)) continue;
    if (POLICY_PATHS.has(name)) {
      if (row && (row.candidate.present !== row.accepted.present || row.candidate.mode !== row.accepted.mode || row.candidate.type !== row.accepted.type)) fail("closeout_continuation_policy_removed");
    } else if (!row || !exact(row.accepted, row.candidate)) fail("closeout_continuation_retained_source_changed");
  }
  for (const row of scope.correction_source) {
    if (!row.before.present || !row.candidate.present || row.before.mode !== row.candidate.mode || row.before.type !== "blob" || row.candidate.type !== "blob" ||
      row.candidate.sha256 !== p.source_hashes[row.path] || row.before.sha256 === row.candidate.sha256) fail("closeout_continuation_correction_invalid");
  }
  for (const row of scope.main_reconciliation) {
    const correctedRow = scope.correction_source.find(x => x.path === row.path);
    if (correctedRow) {
      if (!exact(row.accepted_main, correctedRow.before)) fail("closeout_continuation_main_conflict");
    } else {
      if (row.rule === "main_matches_accepted_task" && !exact(row.accepted_main, accepted.get(row.path)?.accepted)) fail("closeout_continuation_main_conflict");
      if (row.rule !== "bounded_policy_owner" && !exact(row.accepted_main, row.candidate)) fail("closeout_continuation_main_changed");
      if (row.rule === "bounded_policy_owner" && row.accepted_main.present && (!row.candidate.present || row.candidate.mode !== row.accepted_main.mode || row.candidate.type !== row.accepted_main.type)) fail("closeout_continuation_main_policy_removed");
    }
  }
  for (const state of [...scope.accepted_task.flatMap(x => [x.accepted, x.candidate]), ...scope.main_reconciliation.flatMap(x => [x.accepted_main, x.candidate]),
    ...scope.candidate_policy.map(x => x.candidate), ...scope.correction_source.flatMap(x => [x.before, x.candidate])])
    if (state.present && (state.type !== "blob" || !["100644", "100755"].includes(state.mode) || !sha(state.sha256))) fail("closeout_continuation_source_type_invalid");
  return scope;
}

function semanticContinuationProof(p) {
  const a = CLOSEOUT_CONTINUATION_PINS;
  return isCloseoutContinuation(p) && p.pull_request === CLOSEOUT_PINS.pull_request && p.branch === CLOSEOUT_PINS.branch && [p.base, p.head, p.tree].every(commit) &&
    p.head !== a.prior_head && p.tree !== a.prior_tree && p.prior_family_id === a.prior_family_id && p.prior_attempt_id === a.prior_attempt_id &&
    p.prior_receipt_fingerprint === a.prior_receipt_fingerprint && p.prior_number === 1 && exact(p.budget, BUDGET) && p.initial_proof?.sha256 === a.initial_proof &&
    Object.entries(a.originals).every(([name, hash]) => p.originals?.[name]?.sha256 === hash) &&
    exact(p.correction?.source_hashes, a.source_hashes) && Object.values(a.source_hashes).every(sha) &&
    keys(a.evidence, CLOSEOUT_CONTINUATION_EVIDENCE_KEYS) && keys(p.correction?.evidence, CLOSEOUT_CONTINUATION_EVIDENCE_KEYS) &&
    Object.entries(a.evidence).every(([name, hash]) => sha(hash) && p.correction.evidence[name]?.sha256 === hash) && sha(p.final_source?.sha256) &&
    p.source_scope?.schema === "augnes.local-canonical-closeout-continuation-source-scope.v1" && p.source_scope.accepted_base === CLOSEOUT_PINS.accepted_base &&
    p.source_scope.accepted_head === a.prior_head && p.source_scope.current_main === p.base;
}

function continuationOriginalEvidence(folder, p, repositoryRoot) {
  const a = CLOSEOUT_CONTINUATION_PINS;
  const old = Object.fromEntries(Object.keys(a.originals).map(name => { const bytes = closeoutArtifact(folder, p.originals[name]); return [name, name.endsWith("log") ? bytes : json(bytes)]; }));
  const r = old.receipt, prior = old.attempt, c = old.completion, copy = { ...r }; delete copy.integrity;
  const initial = json(closeoutArtifact(folder, p.initial_proof));
  if (r.integrity?.content_fingerprint !== digest(copy) || r.integrity.content_fingerprint !== p.prior_receipt_fingerprint || !exact(r.attempt, prior) ||
    prior.head !== a.prior_head || prior.tree !== a.prior_tree || prior.family_id !== p.prior_family_id || prior.attempt_id !== p.prior_attempt_id || prior.number !== 1 || prior.branch !== p.branch ||
    !validInitialCloseoutAttempt(prior) || !isCloseout(initial) || !exact(normalizedProof(prior.source_correction), normalizedProof(initial)) ||
    c.attempt_id !== prior.attempt_id || c.receipt_fingerprint !== p.prior_receipt_fingerprint || c.finished_at !== a.completed_at || c.disposition !== "product_failure" || c.infrastructure_code !== null || c.cleanup_complete !== true ||
    old.edge.contract !== "augnes.local-canonical-successor.v2" || old.edge.kind !== "issue_1559_closeout" || old.edge.family_id !== prior.family_id || old.edge.head !== prior.head || old.edge.tree !== prior.tree || old.edge.proof_fingerprint !== digest(prior.source_correction) ||
    r.repository?.repository_id !== "hynk-studio/augnes" || r.repository.origin !== "https://github.com/hynk-studio/augnes.git" || r.repository.head_sha !== prior.head || r.repository.tree_sha !== prior.tree || r.repository.branch !== p.branch ||
    r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" || r.repository.detached !== false ||
    r.outcome?.disposition !== "product_failure" || r.outcome.safety !== "preserved_within_observed_scope" || r.outcome.first_fault !== null || r.inputs?.first_fault !== null || r.inputs.secondary_faults?.length !== 0 ||
    r.cleanup?.completed !== true || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true || r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 ||
    !exact(r.phases?.map(x => x.id), BROWSER_REPLACEMENT_PHASES) || !exact(r.phases.map(x => x.status), [...Array(5).fill("pass"), "failure", ...Array(10).fill("not_run")]) ||
    old.stock.content_fingerprint !== p.prior_receipt_fingerprint || old.stock.valid_deciding_evidence !== false || old.stock.issues?.length !== 15) fail("closeout_continuation_original_binding_invalid");
  const unit = r.phases.find(x => x.id === "unit"), lines = old.unit_log.toString("utf8").split("\n");
  if (unit.timed_out !== false || unit.exit_status !== 1 || unit.cleanup?.termination_reason !== "natural_exit" || unit.log?.truncated !== false || unit.log.bytes !== old.unit_log.length) fail("closeout_continuation_original_unit_invalid");
  const results = lines.filter(x => x.startsWith("[canonical:unit] child_result "));
  const failed = results.filter(x => !/ exit_code=0 signal=null timed_out=false .*termination_reason=natural_exit$/u.test(x));
  if (results.length !== 18 || failed.length !== 1 || !/^\[canonical:unit\] child_result label="source-linked operational continuation candidate contract" duration_ms=45107 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout$/u.test(failed[0]) ||
    !lines.includes('[canonical:unit] child_start label="source-linked operational continuation candidate contract" timeout_ms=45000')) fail("closeout_continuation_original_nested_timeout_invalid");
  // The initial proof's adjacent retained bytes stay unchanged. Its complete
  // reader revalidates the older v7 failure, accepted repair and evidence.
  readInitialCloseoutEvidence(path.join(folder, p.initial_proof.artifact), initial, repositoryRoot);
  return { original: r, prior, completion: c };
}

function continuationDevelopmentEvidence(folder, p, repositoryRoot) {
  const refs = p.correction.evidence, bytes = Object.fromEntries(CLOSEOUT_CONTINUATION_EVIDENCE_KEYS.map(name => [name, closeoutArtifact(folder, refs[name])])), git = gitAt(repositoryRoot);
  const record = name => json(bytes[name]), starts = [], finishes = [];
  const runs = [
    ["diagnostic", 45000, "scripts/test-operational-continuation.ts", null],
    ["corrected_observed", 45000, "scripts/test-operational-continuation.ts", "source_manifest"],
    ["plain", 45000, "scripts/test-operational-continuation.ts", "plain_snapshot"],
    ["protocol", 300000, "scripts/vnext-protocol-conformance.ts", "protocol_snapshot"],
    ["fresh_session", 30000, "scripts/test-vnext-fresh-session-semantic-application.ts", "fresh_session_snapshot"],
    ["typecheck", 300000, "typecheck", "typecheck_snapshot"],
  ];
  for (const [name, bound, entry, snapshotKey] of runs) {
    const command = record(`${name}_command`), settlement = record(`${name}_settlement`), result = settlement.result, log = bytes[`${name}_log`].toString();
    if (command.nondeciding !== true || settlement.nondeciding !== true || command.head !== CLOSEOUT_CONTINUATION_PINS.prior_head || command.tree !== CLOSEOUT_CONTINUATION_PINS.prior_tree ||
      command.timeout_ms !== bound || command.require_natural_exit !== false || !Array.isArray(command.command) || command.command.at(-1) !== entry ||
      !validTime(command.started_at) || !validTime(settlement.prepared_at) || !validTime(settlement.finished_at) || Date.parse(command.started_at) <= Date.parse(CLOSEOUT_CONTINUATION_PINS.completed_at) ||
      Date.parse(settlement.prepared_at) > Date.parse(command.started_at) || Date.parse(settlement.finished_at) <= Date.parse(command.started_at) ||
      result?.exit_code !== 0 || result.signal !== null || result.timed_out !== false || result.cancelled !== false || result.spawn_error_code !== null || result.exit_observed !== true ||
      result.streams_closed !== true || result.cleanup_completed !== true || result.remaining_owned_processes !== 0 || result.termination_reason !== "natural_exit" ||
      !Number.isFinite(result.duration_ms) || result.duration_ms <= 0 || result.duration_ms >= bound || settlement.failure !== null || settlement.root_absent !== true ||
      !Array.isArray(settlement.cleanup) || settlement.cleanup.length !== 1 || settlement.cleanup.some(x => x.completed !== true || x.failure_count !== 0 || x.failures?.length !== 0)) fail("closeout_continuation_focused_settlement_invalid");
    const label = JSON.stringify(result.label), expected = `child_result label=${label} duration_ms=${result.duration_ms} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`;
    if (!log.split("\n").some(line => /^\[canonical:[^\]]+\] /u.test(line) && line.endsWith(expected)) ||
      !log.split("\n").some(line => /^\[canonical:[^\]]+\] /u.test(line) && line.endsWith(`child_start label=${label} timeout_ms=${bound}`))) fail("closeout_continuation_focused_log_invalid");
    starts.push(Date.parse(command.started_at)); finishes.push(Date.parse(settlement.finished_at));
    if (snapshotKey) {
      const snapshot = record(snapshotKey);
      if (command.source_snapshot_sha256 !== refs[snapshotKey].sha256 || snapshot.schema !== "augnes.private-development-snapshot.v1" || snapshot.nondeciding !== true ||
        snapshot.archive_head !== CLOSEOUT_CONTINUATION_PINS.prior_head || snapshot.archive_tree !== CLOSEOUT_CONTINUATION_PINS.prior_tree || snapshot.capture_stability?.stable !== true ||
        !Array.isArray(snapshot.files) || new Set(snapshot.files.map(x => x.path)).size !== snapshot.files.length ||
        snapshot.files.some(x => !POLICY_PATHS.has(x.path) && !continuationPaths().includes(x.path)) ||
        !continuationPaths().every(name => snapshot.files.some(x => x.path === name && x.present === true && x.sha256 === p.correction.source_hashes[name])) ||
        settlement.source_after?.changed_snapshot_files?.length !== 0 || settlement.source_after.checkout_changes_are_context_only !== true) fail("closeout_continuation_snapshot_invalid");
    }
  }
  // One diagnostic and one corrected observation use the same preload. Their
  // instrumenters differ because the relation evaluator moved into a private
  // helper; both are retained, and insertion reversal recovers exact Git bytes.
  for (const [key, source, instrumenter] of [["diagnostic", CLOSEOUT_CONTINUATION_PINS.prior_head, "diagnostic_instrumenter"], ["corrected", p.head, "corrected_instrumenter"]]) {
    const command = record(key === "diagnostic" ? "diagnostic_command" : "corrected_observed_command"), instrumentation = record(`${key}_instrumentation`);
    if (command.observer_sha256 !== refs.observer.sha256 || command.instrumenter_sha256 !== refs[instrumenter].sha256 ||
      instrumentation.preload_sha256 !== refs.observer.sha256 || instrumentation.instrumenter_sha256 !== refs[instrumenter].sha256 || instrumentation.nondeciding !== true ||
      !Array.isArray(instrumentation.records) || instrumentation.records.length !== (key === "diagnostic" ? 6 : 7)) fail("closeout_continuation_instrumentation_invalid");
    for (const row of instrumentation.records) {
      if (!/^(?:scripts|lib|fixtures)\/[a-zA-Z0-9_./-]+\.ts$/u.test(row.path ?? "") || row.path.split("/").includes("..") || row.removing_markers_recovers_original_bytes !== true || !Array.isArray(row.insertions)) fail("closeout_continuation_instrumentation_invalid");
      const original = git(["show", `${source}:${row.path}`]).toString("utf8"); let observed = original;
      for (const insertion of [...row.insertions].sort((a, b) => b.position - a.position)) {
        if (!Number.isSafeInteger(insertion.position) || insertion.position < 0 || insertion.position > original.length || typeof insertion.text !== "string") fail("closeout_continuation_instrumentation_invalid");
        observed = observed.slice(0, insertion.position) + insertion.text + observed.slice(insertion.position);
      }
      if (digest(original) !== row.original_sha256 || Buffer.byteLength(original) !== row.original_bytes || digest(observed) !== row.observed_sha256 || Buffer.byteLength(observed) !== row.observed_bytes ||
        observed.replace(/\/\*__OP_OBSERVER:\d+:begin__\*\/[\s\S]*?\/\*__OP_OBSERVER:\d+:end__\*\//gu, "") !== original) fail("closeout_continuation_observed_source_changed");
    }
  }
  const finalObservation = name => {
    const rows = bytes[name].toString().trim().split("\n").map(line => JSON.parse(line)), last = rows.at(-1);
    if (!rows.length || rows.some((row, i) => row.observer !== "operational-continuation-private-v1" || row.sequence !== i + 1 || row.aggregate_timings_inclusive_not_additive !== true ||
      !Number.isFinite(row.cumulative_wall_ms) || (i && row.cumulative_wall_ms < rows[i - 1].cumulative_wall_ms)) || last.stage !== "process-exit" || last.exit_code !== 0) fail("closeout_continuation_observation_invalid");
    return last;
  };
  const before = finalObservation("diagnostic_observations"), after = finalObservation("corrected_observations");
  const count = (row, name, expected) => row.hot?.[name]?.calls === expected && row.hot[name].completed === expected && row.hot[name].active === 0;
  if (!count(before, "validateEpisodeDeltaProposalV01", 6177) || !count(after, "validateEpisodeDeltaProposalV01", 1819) ||
    !count(before, "validateReviewDecisionAgainstEpisodeDeltaProposalV01", 4989) || !count(after, "validateReviewDecisionProposalRelationV01", 4989) ||
    !count(after, "readProposalHistoryV01", 34) || !count(after, "createReviewDecisionProposalRelationValidatorV01", 34) ||
    !count(after, "validateReviewDecisionProvenanceWithProposalRelationV01", 2195) || !count(after, "recordVNextOperatorPilotReviewDecisionV01", 8)) fail("closeout_continuation_mechanism_not_demonstrated");
  for (const [name, expected] of [["buildOperationalFrictionDisposableReviewFixtureV01", 2], ["materializeOperationalFrictionProposalV01", 100],
    ["assertOperationalFrictionMaterialMatchesSourcesV01", 41], ["materializeSourceLinkedOperationalContinuationV01", 36]])
    if (!count(before, name, expected) || !count(after, name, expected)) fail("closeout_continuation_workload_changed");
  const protocolLog = bytes.protocol_log.toString();
  if (!/"prepared_relation_differential_case_count"\s*:\s*74\s*[,}]/u.test(protocolLog) ||
    ["prepared_proposal_snapshot_isolation_checked", "prepared_decisions_revalidated_on_every_call", "caller_validation_overrides_refused"].some(name => !new RegExp(`"${name}"\\s*:\\s*true\\s*[,}]`, "u").test(protocolLog))) fail("closeout_continuation_adverse_coverage_invalid");
  const analysis = record("analysis"), comparison = record("static_comparison");
  if (analysis.nondeciding !== true || analysis.historical_timeout_cause !== "UNKNOWN" || analysis.development_source_not_final_commit !== true ||
    analysis.prior_head !== CLOSEOUT_CONTINUATION_PINS.prior_head || analysis.proposal_validation?.before?.calls !== 6177 || analysis.proposal_validation?.after?.calls !== 1819 ||
    analysis.relation_validation?.before?.calls !== 4989 || analysis.relation_validation?.after?.calls !== 4989 ||
    comparison.nondeciding !== true || comparison.prior_head !== CLOSEOUT_CONTINUATION_PINS.prior_head || comparison.replacements !== 1 || comparison.exact_body_equal_after_single_callback_substitution !== true) fail("closeout_continuation_claim_invalid");
  return { firstEvidenceAt: Math.min(...starts), lastEvidenceAt: Math.max(...finishes), original_blocked_operation: "UNKNOWN", historical_timeout_cause: "UNKNOWN" };
}

export function readCloseoutContinuationEvidence(file, p, repositoryRoot) {
  if (!keys(normalizedProof(p), ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "initial_proof", "correction", "source_scope", "final_source", "authorization", "budget"]) ||
    !semanticContinuationProof(p) || !keys(p.originals, Object.keys(CLOSEOUT_CONTINUATION_PINS.originals)) || !keys(p.correction, ["source_hashes", "evidence"])) fail("closeout_continuation_proof_invalid");
  const folder = path.dirname(file);
  // Refuse missing, unsafe or changed retained bytes before invoking Git or
  // reconstructing older evidence. Valid packets still receive every semantic
  // and exact-source check below; no validation result is cached or skipped.
  for (const ref of [p.initial_proof, ...Object.values(p.originals), ...Object.values(p.correction.evidence), p.final_source]) closeoutArtifact(folder, ref);
  validateCloseoutContinuationSourceScope(p.source_scope);
  const original = continuationOriginalEvidence(folder, p, repositoryRoot), git = gitAt(repositoryRoot), source = json(closeoutArtifact(folder, p.final_source));
  if (!keys(source, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "correction_source_hashes", "deltas"]) ||
    source.schema !== "augnes.local-canonical-closeout-continuation-final-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
    source.base !== p.base || source.head !== p.head || source.tree !== p.tree || source.predecessor_head !== CLOSEOUT_CONTINUATION_PINS.prior_head || source.predecessor_tree !== CLOSEOUT_CONTINUATION_PINS.prior_tree ||
    !exact(source.correction_source_hashes, p.correction.source_hashes) || !keys(source.deltas, ["predecessor", "initial_accepted", "main"]) ||
    git(["rev-parse", `${p.head}^{tree}`]).toString().trim() !== p.tree) fail("closeout_continuation_final_source_invalid");
  for (const [kind, base] of [["predecessor", CLOSEOUT_CONTINUATION_PINS.prior_head], ["initial_accepted", CLOSEOUT_PINS.repair_head], ["main", p.base]]) {
    const bytes = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", base, p.head, "--"]), declared = source.deltas[kind];
    const paths = git(["diff", "--no-renames", "--name-only", "-z", base, p.head, "--"]).toString().split("\0").filter(Boolean).sort();
    if (!keys(declared, ["sha256", "bytes", "changed_paths"]) || declared.sha256 !== digest(bytes) || declared.bytes !== bytes.length || !exact(declared.changed_paths, paths)) fail("closeout_continuation_native_delta_invalid");
  }
  const scope = inspectCloseoutContinuationSourceScope(repositoryRoot, p); validateCloseoutContinuationSourceScope(scope);
  if (!exact(scope, p.source_scope)) fail("closeout_continuation_source_scope_mismatch");
  const evidence = continuationDevelopmentEvidence(folder, p, repositoryRoot);
  continuationEvidence.set(digest(normalizedProof(p)), evidence);
  return { ...original, source, evidence };
}

function validContinuationObservation(p, observation) {
  const expected = { ...CLOSEOUT_PINS.scope, role: "closeout_scope", commit_id: null };
  return keys(observation, Object.keys(expected)) && exact(observation, expected) && p.authorization?.scope_comment_id === expected.id &&
    p.authorization.scope_sha256 === digest(observation) && validTime(observation.timestamp);
}
export async function authorizeCloseoutContinuation(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  const evidence = continuationEvidence.get(digest(normalizedProof(p)));
  if (!semanticContinuationProof(p) || !evidence || !keys(p.authorization, ["scope_comment_id", "scope_sha256"]) ||
    p.authorization.scope_comment_id !== CLOSEOUT_PINS.scope.id || !sha(p.authorization.scope_sha256)) fail("closeout_continuation_authority_missing");
  return authorizeContinuingScope(p, evidence, transport);
}
async function authorizeContinuingScope(p, evidence, transport) {
  const record = await transport.grant(p.authorization.scope_comment_id);
  if (record?.id !== CLOSEOUT_PINS.scope.id || record.user?.type !== "User" || record.user.login !== CLOSEOUT_PINS.scope.author || record.user.id !== CLOSEOUT_PINS.scope.author_id ||
    record.author_association !== "OWNER" || record.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}` || record.created_at !== CLOSEOUT_PINS.scope.timestamp ||
    typeof record.body !== "string" || Buffer.byteLength(record.body) > 65536) fail("closeout_continuation_authority_identity_invalid");
  const observation = closeoutAuthorityObservation(record);
  if (!validContinuationObservation(p, observation)) fail("closeout_continuation_authority_changed");
  const permission = await transport.permission(record.user.login);
  if (permission.user?.login !== record.user.login || !["admin", "maintain"].includes(permission.permission)) fail("closeout_continuation_authority_permission_invalid");
  const pr = await transport.pullRequest();
  if (pr?.number !== p.pull_request || pr.state !== "open" || pr.draft !== true || pr.merged !== false || pr.auto_merge !== null || pr.head?.repo?.full_name !== "hynk-studio/augnes" || pr.base?.repo?.full_name !== "hynk-studio/augnes" ||
    pr.head.sha !== p.head || pr.head.ref !== p.branch || pr.base.sha !== p.base || pr.base.ref !== "main") fail("closeout_continuation_published_source_invalid");
  const capability = Object.freeze({ observations: { closeout_scope: observation } });
  capabilities.set(capability, { proof: digest(p), observations: digest(capability.observations), evidence: digest(evidence) }); return capability;
}
export function assertCloseoutContinuationAuthorization(p, capability, completion) {
  const state = capabilities.get(capability), evidence = continuationEvidence.get(digest(normalizedProof(p)));
  // This authenticated continuing scope predates the initial failure. Its
  // timestamp is preserved; the actual diagnostic and focused correction must
  // postdate settlement. No later grant or independent review is invented.
  if (!state || !evidence || state.proof !== digest(p) || state.observations !== digest(capability.observations) || state.evidence !== digest(evidence) ||
    completion?.finished_at !== CLOSEOUT_CONTINUATION_PINS.completed_at || !validContinuationObservation(p, capability.observations.closeout_scope) ||
    evidence.firstEvidenceAt <= Date.parse(completion.finished_at)) fail("closeout_continuation_authenticated_authority_required");
}
export function validCloseoutContinuationAttempt(attempt) {
  try {
    const p = attempt?.source_correction;
    if (!semanticContinuationProof(p) || attempt.number !== 1 || attempt.recovery || attempt.browser_replacement || !exact(attempt.budget, BUDGET) ||
      attempt.branch !== p.branch || attempt.head !== p.head || attempt.tree !== p.tree || !validContinuationObservation(p, attempt.closeout_authority?.closeout_scope)) return false;
    validateCloseoutContinuationSourceScope(p.source_scope); return true;
  } catch { return false; }
}

// Only the actual settled 1d921d6a source-control timeout can enter this case.
// Its mechanism evidence is captured before this admission integration; the
// final source must retain that exact corrected reader function. This avoids
// making the owner's own whole-file hash depend on a hash embedded in itself.
// BEGIN CLOSEOUT SCOPE CORRECTION PINS
export const CLOSEOUT_SCOPE_CORRECTION_PINS = Object.freeze({
  prior_head: "1d921d6adeedf52264485ae55480c25b0f05c53c", prior_tree: "b4d64b88614d1b8817106788bbf8bedbe93d61a7",
  prior_family_id: "2f6b8b2b065c50198d745438de42df410d1dc2032b231615ad4aca547abd3b82",
  prior_attempt_id: "2026-10-31T04-12-51-606Z-full-1d921d6adeed-d08a657b5d51e362",
  prior_receipt_fingerprint: "7d8875c0408b66125e54940133fcc0c8cf8dd3667009d9b9d6ff7767e83f2731",
  completed_at: "2026-10-31T04:24:59.337Z", predecessor_proof: "33955e7866cc6dfaf2eed40c7edb80f7d007279de4c7848ef86afee749dbe288",
  originals: {
    receipt: "5a2beef18519c1aa78809198e20a8de30eba06f443a489fd73ae2e11b109742e",
    attempt: "db840143157526a9ddc4995a1eda6f9bc8dbe3d498fc51eab1069a8a2bb6e498",
    completion: "834af78520c3ce43bb804570aaef39288fc803cf51b4a231ea758140c3efd0a3",
    edge: "19439a7b0edb3bc656b6ca01548a3998df8b02cd1634925e41d7eaf427b6f63c",
    authority_log: "33a7e1001dea54b820a068d35bb995b712bdf9d102532a725ff88d84f0f5c493",
    stock: "c6f9ba55e25c5248a972ddcc2c695e4aa3afa201861a749e7aebd7e8ca396978",
    stock_log: "84ef3832f31ed1038dcb7f65d8b1529d1c24a1dc620574f6d16b83a50f34f154",
  },
  correction: {
      "mechanism_before": "fd9596db4f7cc26782292c5758aa85d20faaf11cbc7e16c043dd936e5950e071",
      "mechanism_after": "a76c11b8d7fd527643c79f0012055ab32e2521db789541d8145617de922c6d1a",
      "native_delta": "d7d29dde322562496f935641859019db115f0c46449824bee737c1c2a5f0a221",
      "observations": "735ef095f6be862775ac0a96f0a5aca64427a0ae7daee7e8b48993d3919d9050"
  },
  retained: {
      "after/command.json": "5f81bed91da051d0328e2c048f3de6e13a7fdbb1d48ae6105f9bb8a7f262601a",
      "after/observations.jsonl": "61d7c7d25cdf4bfce67db5766df69efb7b89c1f88d1e24687bd03808b2c34e03",
      "after/output.log": "dd9d0731fabb2660d43746c7ddfcc9d6e2d9415fe4704589d02d71deb1d13cb1",
      "after/settlement.json": "c7c71cbaa5cc6dc88495766c091e553c26dfdef133e0450f82cf0babc4ab0400",
      "before/command.json": "6a9ef7e1cc27fe9a2a945bb7be5a9702c5ca3e1d267606ae469a169239a50080",
      "before/observations.jsonl": "0f9fcd9c2bc98f8bad556b5a1524ac46e1f8321eb5d1f7f7569986e5a8788073",
      "before/output.log": "c1c42350e28e66059a4fabee9ea017c5c77cd614ba3393f3c9017d2836622361",
      "before/settlement.json": "a9af6dd07b6bc346118eb6ef9710a249f4a30eeacee8a4b594a22c0d3c25e0f0",
      "fixture-after.mjs": "c16b257269290e13908d5b94b89ea02b3060d4c8a27776744c99a49a0b079128",
      "fixture-before.mjs": "71b42625578221db0e406b7aaf7c942e23ca9e8e4f5c3595b5df3a60f70e7f02",
      "fixture.diff": "35c64aecd31b3caefeaf8b7f3e478b2a370448dabd4fd1134fdf7edf4a71207a",
      "invocation.json": "bf1f0114889d7f8339dc40d3af797cebd3680bb860541831e1869b0a943f1dc5",
      "mechanism-after.mjs": "a76c11b8d7fd527643c79f0012055ab32e2521db789541d8145617de922c6d1a",
      "mechanism-before.mjs": "fd9596db4f7cc26782292c5758aa85d20faaf11cbc7e16c043dd936e5950e071",
      "mechanism.diff": "d7d29dde322562496f935641859019db115f0c46449824bee737c1c2a5f0a221",
      "observe-git-cost.mjs": "dedb22c62172c07c4e920c2b8ab98cdf7826d38ba7acff8a5f31ca6cc181b1c4",
      "prepared-sources.json": "ee5cc38113805ca8b72f01bd5731074a384270baffbbde28b27b56a5a1e456b4",
      "run-probe.mjs": "a04f2b0c658db446ecbda646c71b5f05da2fee0d829d18a9ee766a9a4f38dc84"
  },
});
// END CLOSEOUT SCOPE CORRECTION PINS
for (const value of Object.values(CLOSEOUT_SCOPE_CORRECTION_PINS)) if (value && typeof value === "object") Object.freeze(value);
const scopeCorrectionEvidence = new Map();
const scopeCorrectionOwner = "scripts/local-canonical-1559-closeout.mjs";
export function inspectCloseoutScopeCorrectionSourceScope(repositoryRoot, { base, head }) {
  const { scope } = inspectSourceScope(repositoryRoot, { base, head }, CLOSEOUT_PINS.accepted_base, CLOSEOUT_SCOPE_CORRECTION_PINS.prior_head, [], SCOPE_CORRECTION_POLICY_PATHS);
  return { ...scope, schema: "augnes.local-canonical-closeout-scope-correction-source.v1", basis: "settled_operational_continuation_and_current_main_union" };
}
export function validateCloseoutScopeCorrectionSourceScope(scope) {
  if (scope.schema !== "augnes.local-canonical-closeout-scope-correction-source.v1" || scope.basis !== "settled_operational_continuation_and_current_main_union" ||
    scope.accepted_base !== CLOSEOUT_PINS.accepted_base || scope.accepted_head !== CLOSEOUT_SCOPE_CORRECTION_PINS.prior_head || !commit(scope.current_main)) fail("closeout_scope_correction_inventory_invalid");
  validateRetainedSourceScope(scope, 32, SCOPE_CORRECTION_POLICY_PATHS);
  if (scope.candidate_policy.some(row => row.candidate.present !== true)) fail("closeout_scope_correction_policy_removed");
  return scope;
}
function semanticScopeCorrectionProof(p) {
  const a = CLOSEOUT_SCOPE_CORRECTION_PINS;
  return isCloseoutScopeCorrection(p) && p.pull_request === CLOSEOUT_PINS.pull_request && p.branch === CLOSEOUT_PINS.branch && [p.base, p.head, p.tree].every(commit) &&
    p.head !== a.prior_head && p.tree !== a.prior_tree && p.prior_family_id === a.prior_family_id && p.prior_attempt_id === a.prior_attempt_id &&
    p.prior_receipt_fingerprint === a.prior_receipt_fingerprint && p.prior_number === 1 && exact(p.budget, BUDGET) && p.predecessor_proof?.sha256 === a.predecessor_proof &&
    Object.entries(a.originals).every(([name, hash]) => p.originals?.[name]?.sha256 === hash) &&
    Object.entries(a.correction).every(([name, hash]) => sha(hash) && p.correction?.[name]?.sha256 === hash) && scopeCorrectionRetainedInventory(p.correction?.retained) && sha(p.final_source?.sha256) &&
    p.source_scope?.schema === "augnes.local-canonical-closeout-scope-correction-source.v1" && p.source_scope.accepted_base === CLOSEOUT_PINS.accepted_base &&
    p.source_scope.accepted_head === a.prior_head && p.source_scope.current_main === p.base;
}
function scopeCorrectionRetainedInventory(retained) {
  const expected = CLOSEOUT_SCOPE_CORRECTION_PINS.retained;
  return Array.isArray(retained) && exact(retained.map(x => x?.path).sort(), Object.keys(expected).sort()) &&
    retained.every(x => x.sha256 === expected[x.path] && sha(x.sha256) &&
      (keys(x, ["path", "sha256"]) || (keys(x, ["path", "artifact", "sha256"]) && /^[A-Za-z0-9_-]+\.(?:json|jsonl|log|mjs|md|diff|txt|output)$/u.test(x.artifact ?? ""))));
}
function scopeCorrectionOriginalEvidence(folder, p, repositoryRoot) {
  const a = CLOSEOUT_SCOPE_CORRECTION_PINS, old = Object.fromEntries(Object.keys(a.originals).map(name => { const bytes = closeoutArtifact(folder, p.originals[name]); return [name, name.endsWith("log") ? bytes : json(bytes)]; }));
  const r = old.receipt, prior = old.attempt, c = old.completion, copy = { ...r }; delete copy.integrity;
  const predecessor = json(closeoutArtifact(folder, p.predecessor_proof));
  if (r.integrity?.content_fingerprint !== digest(copy) || r.integrity.content_fingerprint !== p.prior_receipt_fingerprint || !exact(r.attempt, prior) ||
    prior.head !== a.prior_head || prior.tree !== a.prior_tree || prior.family_id !== p.prior_family_id || prior.attempt_id !== p.prior_attempt_id || prior.number !== 1 || prior.branch !== p.branch ||
    !validCloseoutContinuationAttempt(prior) || !isCloseoutContinuation(predecessor) || !exact(normalizedProof(prior.source_correction), normalizedProof(predecessor)) ||
    c.attempt_id !== prior.attempt_id || c.receipt_fingerprint !== p.prior_receipt_fingerprint || c.finished_at !== a.completed_at || c.disposition !== "product_failure" || c.infrastructure_code !== null || c.cleanup_complete !== true ||
    old.edge.contract !== "augnes.local-canonical-successor.v2" || old.edge.kind !== CLOSEOUT_CONTINUATION_KIND || old.edge.family_id !== prior.family_id || old.edge.head !== prior.head || old.edge.tree !== prior.tree || old.edge.proof_fingerprint !== digest(prior.source_correction) ||
    r.repository?.repository_id !== "hynk-studio/augnes" || r.repository.origin !== "https://github.com/hynk-studio/augnes.git" || r.repository.head_sha !== prior.head || r.repository.tree_sha !== prior.tree || r.repository.branch !== p.branch ||
    r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" || r.repository.detached !== false ||
    r.outcome?.disposition !== "product_failure" || r.outcome.safety !== "preserved_within_observed_scope" || r.outcome.first_fault !== null || r.inputs?.first_fault !== null || r.inputs.secondary_faults?.length !== 0 ||
    r.cleanup?.completed !== true || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true || r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 ||
    !exact(r.phases?.map(x => x.id), BROWSER_REPLACEMENT_PHASES) || !exact(r.phases.map(x => x.status), [...Array(6).fill("pass"), "failure", ...Array(9).fill("not_run")]) ||
    old.stock.content_fingerprint !== p.prior_receipt_fingerprint || old.stock.valid_deciding_evidence !== false || old.stock.issues?.length !== 14) fail("closeout_scope_correction_original_binding_invalid");
  const authority = r.phases.find(x => x.id === "authority"), lines = old.authority_log.toString("utf8").split("\n");
  if (authority.duration_ms !== 59896 || authority.timed_out !== false || authority.exit_status !== 1 || authority.cleanup?.termination_reason !== "natural_exit" || authority.log?.truncated !== false || authority.log.bytes !== old.authority_log.length) fail("closeout_scope_correction_original_authority_invalid");
  const outer = lines.filter(x => x.startsWith("[canonical:authority] child_result ")), nested = lines.filter(x => x.startsWith("[canonical:1559-closeout-continuation-controls] child_result "));
  if (outer.length !== 9 || outer.slice(0, -1).some(x => !/ exit_code=0 signal=null timed_out=false .*termination_reason=natural_exit$/u.test(x)) ||
    outer.at(-1) !== '[canonical:authority] child_result label="local Canonical executor identity and scheduling contract" duration_ms=9993 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit' ||
    nested.length !== 2 || !/ label="evidence" duration_ms=2506 exit_code=0 signal=null timed_out=false .*termination_reason=natural_exit$/u.test(nested[0]) ||
    nested[1] !== '[canonical:1559-closeout-continuation-controls] child_result label="source" duration_ms=6076 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout' ||
    !lines.includes('[canonical:1559-closeout-continuation-controls] child_start label="source" timeout_ms=6000')) fail("closeout_scope_correction_original_nested_timeout_invalid");
  readCloseoutContinuationEvidence(path.join(folder, p.predecessor_proof.artifact), predecessor, repositoryRoot);
  return { original: r, prior, completion: c };
}
function correctedReaderFragment(source) {
  const starts = [...source.matchAll(/^export function readCloseoutContinuationEvidence\(/gmu)], start = starts[0]?.index ?? -1;
  const end = source.indexOf("\nfunction validContinuationObservation(", start);
  if (starts.length !== 1 || start < 0 || end < start) fail("closeout_scope_correction_mechanism_invalid");
  return source.slice(start, end);
}
function scopeCorrectionDevelopmentEvidence(folder, p, repositoryRoot) {
  const before = closeoutArtifact(folder, p.correction.mechanism_before), after = closeoutArtifact(folder, p.correction.mechanism_after), manifest = json(closeoutArtifact(folder, p.correction.observations));
  const git = gitAt(repositoryRoot), prior = git(["show", `${CLOSEOUT_SCOPE_CORRECTION_PINS.prior_head}:${scopeCorrectionOwner}`]), candidate = git(["show", `${p.head}:${scopeCorrectionOwner}`]);
  const needle = "  const original = continuationOriginalEvidence(folder, p, repositoryRoot), git = gitAt(repositoryRoot), source = json(closeoutArtifact(folder, p.final_source));";
  if (!before.equals(prior) || before.toString().split(needle).length !== 2 || after.toString() !== before.toString().replace(needle, "  validateCloseoutContinuationSourceScope(p.source_scope);\n" + needle) ||
    correctedReaderFragment(candidate.toString()) !== correctedReaderFragment(after.toString())) fail("closeout_scope_correction_mechanism_invalid");
  if (manifest.schema !== "augnes.private-source-scope-precheck-observation.v1" || manifest.nondeciding !== true || manifest.prior_head !== CLOSEOUT_SCOPE_CORRECTION_PINS.prior_head || manifest.prior_tree !== CLOSEOUT_SCOPE_CORRECTION_PINS.prior_tree ||
    manifest.historical_timeout_cause !== "UNKNOWN" || manifest.original_blocked_operation !== "UNKNOWN" || !Array.isArray(manifest.files) ||
    manifest.before?.source_sha256 !== digest(before) || manifest.after?.source_sha256 !== digest(after) || !exact(p.correction.retained.map(x => x.path).sort(), manifest.files.map(x => x.path).sort()) || new Set(manifest.files.map(x => x.path)).size !== manifest.files.length) fail("closeout_scope_correction_observation_invalid");
  const retained = new Map(p.correction.retained.map(ref => [ref.path, closeoutArtifact(folder, artifactRef(ref))]));
  for (const entry of manifest.files) if (!keys(entry, ["path", "bytes", "sha256"]) || retained.get(entry.path)?.length !== entry.bytes || digest(retained.get(entry.path)) !== entry.sha256) fail("closeout_scope_correction_observation_changed");
  const samples = {};
  for (const sample of ["before", "after"]) {
    const record = manifest[sample], command = json(retained.get(record.command)), settlement = json(retained.get(record.settlement)), result = settlement.result;
    const observations = retained.get(record.observations).toString().trim().split("\n").map(line => JSON.parse(line)), log = retained.get(record.log).toString();
    if (command.schema !== "augnes.private-source-scope-probe-command.v1" || settlement.schema !== "augnes.private-source-scope-probe-settlement.v1" || command.sample !== sample || settlement.sample !== sample ||
      command.nondeciding !== true || settlement.nondeciding !== true || command.prior_head !== CLOSEOUT_SCOPE_CORRECTION_PINS.prior_head || command.prior_tree !== CLOSEOUT_SCOPE_CORRECTION_PINS.prior_tree ||
      command.timeout_ms !== 6000 || command.require_natural_exit !== true || command.source_sha256 !== record.source_sha256 ||
      command.fixture_sha256 !== digest(retained.get(`fixture-${sample}.mjs`)) || command.observer_sha256 !== digest(retained.get("observe-git-cost.mjs")) ||
      !exact(command.command?.slice(-2), ["--run-closeout-continuation-fixtures", "source"]) ||
      !validTime(command.started_at) || !validTime(settlement.finished_at) || Date.parse(command.started_at) <= Date.parse(CLOSEOUT_SCOPE_CORRECTION_PINS.completed_at) || Date.parse(settlement.finished_at) < Date.parse(command.started_at) ||
      result?.cancelled !== false || result.exit_observed !== true || result.streams_closed !== true || result.cleanup_completed !== true || result.remaining_owned_processes !== 0 ||
      settlement.root_absent !== true || !Array.isArray(settlement.cleanup) || !settlement.cleanup.length || settlement.cleanup.some(x => x.completed !== true || x.failure_count !== 0) ||
      !exact(result, record.result) || !Number.isFinite(result.duration_ms) || result.duration_ms <= 0 ||
      (result.timed_out ? sample !== "before" || result.exit_code !== null || result.signal !== "SIGTERM" || result.termination_reason !== "bounded_timeout" || result.duration_ms < 6000 :
        result.exit_code !== 0 || result.signal !== null || result.termination_reason !== "natural_exit" || settlement.failure !== null)) fail("closeout_scope_correction_settlement_invalid");
    for (let i = 0; i < observations.length; i++) {
      const row = observations[i], previous = observations[i - 1];
      if (row.schema !== "augnes.private-source-control-git-cost.v1" || row.sample !== sample || row.sequence !== i + 1 || !Number.isSafeInteger(row.git?.calls) || row.git.calls < 0 ||
        !Number.isFinite(row.cumulative_wall_ms) || !Number.isFinite(row.git.inclusive_ms) || row.cumulative_wall_ms < 0 || row.git.inclusive_ms < 0 ||
        (previous && (row.git.calls < previous.git.calls || row.cumulative_wall_ms < previous.cumulative_wall_ms || row.git.inclusive_ms < previous.git.inclusive_ms))) fail("closeout_scope_correction_observation_invalid");
    }
    const positive = observations.find(x => x.stage.startsWith("full synthetic v7 to settled initial-closeout"));
    if (!positive || !log.includes("continuation control PASS: " + positive.stage)) fail("closeout_scope_correction_positive_missing");
    samples[sample] = { command, settlement, observations, positive, log };
  }
  if (Date.parse(samples.after.command.started_at) <= Date.parse(samples.before.settlement.finished_at) || samples.before.positive.git.calls !== samples.after.positive.git.calls) fail("closeout_scope_correction_sample_binding_invalid");
  const common = ["accepted added helper deletion", "accepted task reverted to base", "source outside three correction owners", "changed correction bytes", "weaker complete-child bound"];
  let beforePrevious = samples.before.positive, afterPrevious = samples.after.positive, compared = 0;
  for (const name of common) {
    const b = samples.before.observations.find(x => x.stage.startsWith(name + ":")), a = samples.after.observations.find(x => x.stage.startsWith(name + ":"));
    if (!a || !samples.after.log.includes("continuation control PASS: " + a.stage)) fail("closeout_scope_correction_adverse_missing");
    if (b) {
      if (!beforePrevious || b.git.calls - beforePrevious.git.calls <= a.git.calls - afterPrevious.git.calls || !samples.before.log.includes("continuation control PASS: " + b.stage)) fail("closeout_scope_correction_cost_not_demonstrated");
      compared++;
    }
    beforePrevious = b; afterPrevious = a;
  }
  const masked = samples.after.observations.find(x => x.stage.startsWith("masked valid declaration over actual helper deletion:"));
  if (!compared || !masked || masked.git.calls <= afterPrevious.git.calls || !samples.after.log.includes("continuation control PASS: " + masked.stage)) fail("closeout_scope_correction_masked_source_missing");
  return { manifest_sha256: p.correction.observations.sha256, compared, firstEvidenceAt: Date.parse(samples.before.command.started_at) };
}
export function readCloseoutScopeCorrectionEvidence(file, p, repositoryRoot) {
  if (!keys(normalizedProof(p), ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "predecessor_proof", "correction", "source_scope", "final_source", "authorization", "budget"]) ||
    !semanticScopeCorrectionProof(p) || !keys(p.originals, Object.keys(CLOSEOUT_SCOPE_CORRECTION_PINS.originals)) || !keys(p.correction, [...Object.keys(CLOSEOUT_SCOPE_CORRECTION_PINS.correction), "retained"])) fail("closeout_scope_correction_proof_invalid");
  const folder = path.dirname(file);
  for (const ref of [p.predecessor_proof, ...Object.values(p.originals), ...Object.keys(CLOSEOUT_SCOPE_CORRECTION_PINS.correction).map(name => p.correction[name]), ...p.correction.retained.map(artifactRef), p.final_source]) closeoutArtifact(folder, ref);
  validateCloseoutScopeCorrectionSourceScope(p.source_scope);
  const original = scopeCorrectionOriginalEvidence(folder, p, repositoryRoot), git = gitAt(repositoryRoot), source = json(closeoutArtifact(folder, p.final_source));
  if (!keys(source, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "deltas"]) || source.schema !== "augnes.local-canonical-closeout-scope-correction-final-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
    source.base !== p.base || source.head !== p.head || source.tree !== p.tree || source.predecessor_head !== CLOSEOUT_SCOPE_CORRECTION_PINS.prior_head || source.predecessor_tree !== CLOSEOUT_SCOPE_CORRECTION_PINS.prior_tree ||
    !keys(source.deltas, ["predecessor", "first_closeout", "main"]) || git(["rev-parse", `${p.head}^{tree}`]).toString().trim() !== p.tree) fail("closeout_scope_correction_final_source_invalid");
  for (const [name, base] of [["predecessor", CLOSEOUT_SCOPE_CORRECTION_PINS.prior_head], ["first_closeout", CLOSEOUT_CONTINUATION_PINS.prior_head], ["main", p.base]]) {
    const bytes = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", base, p.head, "--"]), declared = source.deltas[name];
    const paths = git(["diff", "--no-renames", "--name-only", "-z", base, p.head, "--"]).toString().split("\0").filter(Boolean).sort();
    if (!keys(declared, ["sha256", "bytes", "changed_paths"]) || declared.sha256 !== digest(bytes) || declared.bytes !== bytes.length || !exact(declared.changed_paths, paths)) fail("closeout_scope_correction_native_delta_invalid");
  }
  const scope = inspectCloseoutScopeCorrectionSourceScope(repositoryRoot, p); validateCloseoutScopeCorrectionSourceScope(scope);
  if (!exact(scope, p.source_scope)) fail("closeout_scope_correction_source_scope_mismatch");
  const evidence = scopeCorrectionDevelopmentEvidence(folder, p, repositoryRoot);
  scopeCorrectionEvidence.set(digest(normalizedProof(p)), evidence);
  return { ...original, source, evidence };
}
export async function authorizeCloseoutScopeCorrection(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  const evidence = scopeCorrectionEvidence.get(digest(normalizedProof(p)));
  if (!semanticScopeCorrectionProof(p) || !evidence || !keys(p.authorization, ["scope_comment_id", "scope_sha256"]) || p.authorization.scope_comment_id !== CLOSEOUT_PINS.scope.id || !sha(p.authorization.scope_sha256)) fail("closeout_scope_correction_authority_missing");
  return authorizeContinuingScope(p, evidence, transport);
}
export function assertCloseoutScopeCorrectionAuthorization(p, capability, completion) {
  const state = capabilities.get(capability), evidence = scopeCorrectionEvidence.get(digest(normalizedProof(p)));
  if (!state || !evidence || state.proof !== digest(p) || state.observations !== digest(capability.observations) || state.evidence !== digest(evidence) ||
    completion?.finished_at !== CLOSEOUT_SCOPE_CORRECTION_PINS.completed_at || !validContinuationObservation(p, capability.observations.closeout_scope) ||
    !Number.isFinite(evidence.firstEvidenceAt) || evidence.firstEvidenceAt <= Date.parse(completion.finished_at)) fail("closeout_scope_correction_authenticated_authority_required");
}
export function validCloseoutScopeCorrectionAttempt(attempt) {
  try {
    const p = attempt?.source_correction;
    if (!semanticScopeCorrectionProof(p) || attempt.number !== 1 || attempt.recovery || attempt.browser_replacement || !exact(attempt.budget, BUDGET) ||
      attempt.branch !== p.branch || attempt.head !== p.head || attempt.tree !== p.tree || !validContinuationObservation(p, attempt.closeout_authority?.closeout_scope)) return false;
    validateCloseoutScopeCorrectionSourceScope(p.source_scope); return true;
  } catch { return false; }
}

export function readCloseoutEvidence(file, p, repositoryRoot) {
  if (isCloseout(p)) return readInitialCloseoutEvidence(file, p, repositoryRoot);
  if (isCloseoutContinuation(p)) return readCloseoutContinuationEvidence(file, p, repositoryRoot);
  if (isCloseoutScopeCorrection(p)) return readCloseoutScopeCorrectionEvidence(file, p, repositoryRoot);
  fail("closeout_identity_invalid");
}
export async function authorizeCloseout(p, options) {
  if (isCloseout(p)) return authorizeInitialCloseout(p, options);
  if (isCloseoutContinuation(p)) return authorizeCloseoutContinuation(p, options);
  if (isCloseoutScopeCorrection(p)) return authorizeCloseoutScopeCorrection(p, options);
  fail("closeout_identity_invalid");
}
export function assertCloseoutAuthorization(p, capability, completion) {
  if (isCloseout(p)) return assertInitialCloseoutAuthorization(p, capability, completion);
  if (isCloseoutContinuation(p)) return assertCloseoutContinuationAuthorization(p, capability, completion);
  if (isCloseoutScopeCorrection(p)) return assertCloseoutScopeCorrectionAuthorization(p, capability, completion);
  fail("closeout_identity_invalid");
}
export function validCloseoutAttempt(attempt) {
  if (isCloseout(attempt?.source_correction)) return validInitialCloseoutAttempt(attempt);
  if (isCloseoutContinuation(attempt?.source_correction)) return validCloseoutContinuationAttempt(attempt);
  if (isCloseoutScopeCorrection(attempt?.source_correction)) return validCloseoutScopeCorrectionAttempt(attempt);
  return false;
}
