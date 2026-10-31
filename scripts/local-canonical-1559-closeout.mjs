// Prospective initial closeout for the separately authorized #1559 scope.
// The exhausted v7 grant and every historical failure remain immutable.
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, supportedInputContract, classifyInputChange, nonFaultInputChange } from "./local-canonical-inputs.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "./local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";
// Function-only reuse: neither module calls the other during initialization.
import { readSourceCorrectionProof, validateSourceCorrectionBinding } from "./local-canonical-attempts.mjs";

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
export const CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND = "issue_1559_scope_fixture_preparation_correction";
export const CLOSEOUT_CAPABILITY_CORRECTION_KIND = "issue_1559_capability_precheck_correction";
export const CLOSEOUT_FIXTURE_CORRECTION_KIND = "issue_1559_fixture_preparation_correction";
export const CLOSEOUT_INSTRUCTION_KIND = "issue_1559_instruction_input_replacement";
export const isCloseoutContinuation = p => p?.schema === CLOSEOUT_CONTINUATION_SCHEMA && p.kind === CLOSEOUT_CONTINUATION_KIND;
export const isCloseoutScopeCorrection = p => p?.schema === CLOSEOUT_CONTINUATION_SCHEMA && p.kind === CLOSEOUT_SCOPE_CORRECTION_KIND;
export const isCloseoutInstructionReplacement = p => p?.schema === CLOSEOUT_CONTINUATION_SCHEMA && p.kind === CLOSEOUT_INSTRUCTION_KIND;
export const isCloseoutFixtureCorrection = p => p?.schema === CLOSEOUT_CONTINUATION_SCHEMA && p.kind === CLOSEOUT_FIXTURE_CORRECTION_KIND;
export const isCloseoutCapabilityCorrection = p => p?.schema === CLOSEOUT_CONTINUATION_SCHEMA && p.kind === CLOSEOUT_CAPABILITY_CORRECTION_KIND;
export const isCloseoutScopeFixtureCorrection = p => p?.schema === CLOSEOUT_CONTINUATION_SCHEMA && p.kind === CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND;
export const usesCloseoutInstructionInputs = p => isCloseoutInstructionReplacement(p) || isCloseoutFixtureCorrection(p) || isCloseoutCapabilityCorrection(p) || isCloseoutScopeFixtureCorrection(p);
export const isAnyCloseout = p => isCloseout(p) || isCloseoutContinuation(p) || isCloseoutScopeCorrection(p) || isCloseoutInstructionReplacement(p) || isCloseoutFixtureCorrection(p) || isCloseoutCapabilityCorrection(p) || isCloseoutScopeFixtureCorrection(p);
export const hasCloseoutMarker = attempt => [CLOSEOUT_SCHEMA, CLOSEOUT_CONTINUATION_SCHEMA].includes(attempt?.source_correction?.schema) ||
  ["issue_1559_closeout", CLOSEOUT_CONTINUATION_KIND, CLOSEOUT_SCOPE_CORRECTION_KIND, CLOSEOUT_INSTRUCTION_KIND, CLOSEOUT_FIXTURE_CORRECTION_KIND, CLOSEOUT_CAPABILITY_CORRECTION_KIND, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND].includes(attempt?.source_correction?.kind) || !!attempt?.closeout_authority ||
  !!attempt?.closeout_consumed || !!attempt?.closeout_continuation_consumed || !!attempt?.closeout_scope_correction_consumed || !!attempt?.closeout_instruction_consumed || !!attempt?.closeout_fixture_correction_consumed || !!attempt?.closeout_capability_correction_consumed || !!attempt?.closeout_scope_fixture_correction_consumed || Object.hasOwn(attempt?.source_correction ?? {}, "scope_amendment") || Object.hasOwn(attempt ?? {}, "closeout_instruction_input");
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
  return validContinuingScopeObservation(p, observation, CLOSEOUT_PINS.scope);
}
function validContinuingScopeObservation(p, observation, scope) {
  const expected = { ...scope, role: "closeout_scope", commit_id: null };
  return keys(observation, Object.keys(expected)) && exact(observation, expected) && p.authorization?.scope_comment_id === expected.id &&
    p.authorization.scope_sha256 === digest(observation) && validTime(observation.timestamp);
}
export async function authorizeCloseoutContinuation(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  const evidence = continuationEvidence.get(digest(normalizedProof(p)));
  if (!semanticContinuationProof(p) || !evidence || !keys(p.authorization, ["scope_comment_id", "scope_sha256"]) ||
    p.authorization.scope_comment_id !== CLOSEOUT_PINS.scope.id || !sha(p.authorization.scope_sha256)) fail("closeout_continuation_authority_missing");
  return authorizeContinuingScope(p, evidence, transport);
}
async function authorizeContinuingScope(p, evidence, transport, scope = CLOSEOUT_PINS.scope) {
  const record = await transport.grant(p.authorization.scope_comment_id);
  if (record?.id !== scope.id || record.user?.type !== "User" || record.user.login !== scope.author || record.user.id !== scope.author_id ||
    record.author_association !== "OWNER" || record.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}` || record.created_at !== scope.timestamp ||
    typeof record.body !== "string" || Buffer.byteLength(record.body) > 65536) fail("closeout_continuation_authority_identity_invalid");
  const observation = closeoutAuthorityObservation(record);
  if (!validContinuingScopeObservation(p, observation, scope)) fail("closeout_continuation_authority_changed");
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

// Prospective acceptance of one instruction input under the later direct user
// steering. The original safety stop and the instruction monitor are unchanged.
// BEGIN CLOSEOUT INSTRUCTION PINS
export const CLOSEOUT_INSTRUCTION_PINS = Object.freeze({
  prior_head: "69d09685566391034a2c8b48cddcbdfaebdd1ddc", prior_tree: "94562fac91414decbf9b4a7b11614bece7d3fe4f",
  prior_family_id: "36607e4013b3b3347621a2eee5cddc94e99d8383ea879b4ba1b0c9274cb83d45",
  prior_attempt_id: "2026-10-31T04-48-27-071Z-full-69d096855663-adb7a9586e65b27c",
  prior_receipt_fingerprint: "7e1476437852d22b3a2ae0703fbe801cee8eda1bbddd13f6a275dac1c704826d",
  completed_at: "2026-10-31T04:55:57.206Z", fault_observed_at: "2026-10-31T04:55:52.443Z",
  predecessor_proof: "e7fb013f51766356298d91b2a54f0847090667434a51d22a3d65acbb8a71dbaf",
  before_bytes: 11769, after_bytes: 13875,
  instruction_location_fingerprint: "f111555e42220cf253fb9aaecfbd1bdebd0ddc4ae5d723d3988c5b506b8e89fa",
  instruction_identity_fingerprint: "5995ac47a8a645f89fa31d6498d766ad64b3b6438a58cb2ade4d4901d1fc3077",
  originals: {
    receipt: "f30b1d704444de9ed91a98dbf84e7932b15a68e67a301153d7d4ce8f15a4ad85",
    attempt: "1fa48bd91f6570617c05cc3a2c662a4ba20321e719e51c9aaf69eb3a062fc3cc",
    completion: "551ae470b9aabd6c17ddbc1ce1c1ef970efe1d0712ed7e3d4fe8a9c5a8f23907",
    edge: "6e5b07c7a27aeb585d22f292dd3a4d513aa091b8d99c3fb9de9d4eb3f50f19b1",
    unit_log: "c37e647e4e468d5a6f7b7be8bceb31f1a4ad5b9815452cd471761ae6ccb3bcd8",
    stock: "1d96646980e3e067efa05ac2a5527164f301012aaa5e9c98508a366b4344edc6",
    stock_log: "d4a231502403e7a3094ff2ea4371f15c975f8977db594d03bf28bb649e630ccc",
  },
  instruction: {
    before: "d4289118bf6acf24fede74a2475e6e0bb86909457748ca9d1300e4ae79496bb9",
    after: "f6297360e622d89e56998ebc10b362d596ef21a3054dde867bbcb5cc46de60f6",
    delta: "ca2080d731a5572f011a4e3efabc00374ea67b9d6f4cfae54daa3da64c4812ce",
    provenance: "e8a2122080c3ad5a1e5bc0c9ee7fa90beb80283b37b82f0795c96df21e8c1df6",
  },
  scope: { id: 6539480565, author: "hynk-studio", author_id: 89450056,
    body_sha256: "3dbdeeed627952a7eb0841094cb1728ee8f18c4322c82d702064a0b8f8126800", timestamp: "2026-10-31T05:18:33Z" },
});
// END CLOSEOUT INSTRUCTION PINS
for (const value of Object.values(CLOSEOUT_INSTRUCTION_PINS)) if (value && typeof value === "object") Object.freeze(value);
const instructionEvidence = new Map();
const instructionIdentity = observation => digest(Object.fromEntries(["device", "uid", "gid", "mode", "inode", "links"].map(key => [key, observation?.metadata?.[key]])));
export function inspectCloseoutInstructionSourceScope(repositoryRoot, { base, head }) {
  const { scope } = inspectSourceScope(repositoryRoot, { base, head }, CLOSEOUT_PINS.accepted_base, CLOSEOUT_INSTRUCTION_PINS.prior_head, [], SCOPE_CORRECTION_POLICY_PATHS);
  return { ...scope, schema: "augnes.local-canonical-closeout-instruction-source.v1", basis: "settled_scope_correction_and_current_main_union" };
}
export function validateCloseoutInstructionSourceScope(scope) {
  if (scope.schema !== "augnes.local-canonical-closeout-instruction-source.v1" || scope.basis !== "settled_scope_correction_and_current_main_union" ||
    scope.accepted_base !== CLOSEOUT_PINS.accepted_base || scope.accepted_head !== CLOSEOUT_INSTRUCTION_PINS.prior_head || !commit(scope.current_main)) fail("closeout_instruction_inventory_invalid");
  validateRetainedSourceScope(scope, 33, SCOPE_CORRECTION_POLICY_PATHS);
  if (scope.candidate_policy.some(row => row.candidate.present !== true)) fail("closeout_instruction_policy_removed");
  return scope;
}
function semanticInstructionProof(p) {
  const a = CLOSEOUT_INSTRUCTION_PINS;
  return isCloseoutInstructionReplacement(p) && p.pull_request === CLOSEOUT_PINS.pull_request && p.branch === CLOSEOUT_PINS.branch && [p.base, p.head, p.tree].every(commit) &&
    p.head !== a.prior_head && p.tree !== a.prior_tree && p.prior_family_id === a.prior_family_id && p.prior_attempt_id === a.prior_attempt_id &&
    p.prior_receipt_fingerprint === a.prior_receipt_fingerprint && p.prior_number === 1 && exact(p.budget, BUDGET) && p.predecessor_proof?.sha256 === a.predecessor_proof &&
    keys(p.originals, Object.keys(a.originals)) && Object.entries(a.originals).every(([name, hash]) => p.originals[name]?.sha256 === hash) &&
    keys(p.instruction, Object.keys(a.instruction)) && Object.entries(a.instruction).every(([name, hash]) => p.instruction[name]?.sha256 === hash) && sha(p.final_source?.sha256) &&
    p.source_scope?.schema === "augnes.local-canonical-closeout-instruction-source.v1" && p.source_scope.accepted_base === CLOSEOUT_PINS.accepted_base &&
    p.source_scope.accepted_head === a.prior_head && p.source_scope.current_main === p.base;
}
function instructionOriginalEvidence(folder, p, repositoryRoot) {
  const a = CLOSEOUT_INSTRUCTION_PINS, old = Object.fromEntries(Object.keys(a.originals).map(name => { const bytes = closeoutArtifact(folder, p.originals[name]); return [name, name.endsWith("log") ? bytes : json(bytes)]; }));
  const r = old.receipt, prior = old.attempt, completion = old.completion, copy = { ...r }; delete copy.integrity;
  const predecessor = json(closeoutArtifact(folder, p.predecessor_proof)), input = r.inputs, fault = input?.first_fault;
  if (r.integrity?.content_fingerprint !== digest(copy) || r.integrity.content_fingerprint !== p.prior_receipt_fingerprint || !exact(r.attempt, prior) ||
    prior.head !== a.prior_head || prior.tree !== a.prior_tree || prior.family_id !== p.prior_family_id || prior.attempt_id !== p.prior_attempt_id || prior.number !== 1 || prior.branch !== p.branch ||
    !validCloseoutScopeCorrectionAttempt(prior) || !isCloseoutScopeCorrection(predecessor) || !exact(normalizedProof(prior.source_correction), normalizedProof(predecessor)) ||
    completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== p.prior_receipt_fingerprint || completion.finished_at !== a.completed_at || completion.disposition !== "safety_violation" || completion.infrastructure_code !== null || completion.cleanup_complete !== true ||
    old.edge.contract !== "augnes.local-canonical-successor.v2" || old.edge.kind !== CLOSEOUT_SCOPE_CORRECTION_KIND || old.edge.family_id !== prior.family_id || old.edge.head !== prior.head || old.edge.tree !== prior.tree || old.edge.proof_fingerprint !== digest(prior.source_correction) ||
    r.repository?.repository_id !== "hynk-studio/augnes" || r.repository.origin !== "https://github.com/hynk-studio/augnes.git" || r.repository.head_sha !== prior.head || r.repository.tree_sha !== prior.tree || r.repository.branch !== p.branch ||
    r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" || r.repository.detached !== false ||
    r.outcome?.disposition !== "safety_violation" || r.outcome.safety !== "blocked" || !exact(r.outcome.first_fault, fault) ||
    r.cleanup?.completed !== true || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true || r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 ||
    !exact(r.phases?.map(x => x.id), BROWSER_REPLACEMENT_PHASES) || !exact(r.phases.map(x => x.status), [...Array(5).fill("pass"), "failure", ...Array(10).fill("not_run")]) ||
    old.stock.content_fingerprint !== p.prior_receipt_fingerprint || old.stock.valid_deciding_evidence !== false || old.stock.issues?.length !== 17) fail("closeout_instruction_original_binding_invalid");
  const declaration = { contract: input?.contract, path_kind: input?.path_kind, binding: input?.binding, resources: input?.resources };
  const resources = (Array.isArray(input?.resources) ? input.resources.filter(x => x.id === "user-instructions") : []), event = input?.events?.[0], resource = resources?.[0];
  if (!supportedInputContract(input?.contract) || digest(declaration) !== input.fingerprint || prior.contract_fingerprint !== input.fingerprint ||
    !Array.isArray(input.resources) || new Set(input.resources.map(x => x.id)).size !== input.resources.length || resources.length !== 1 || input.events?.length !== 1 || input.secondary_faults?.length !== 0 ||
    fault?.resource !== "user-instructions" || fault.disposition !== "safety_violation" || fault.observed_at !== a.fault_observed_at || event.resource !== fault.resource || event.observed_at !== fault.observed_at || event.monotonic_ns !== fault.monotonic_ns ||
    event.classification !== "safety" || event.disposition !== "safety_violation" || resource.classification !== "safety" || resource.location_fingerprint !== a.instruction_location_fingerprint ||
    resource.before?.present !== true || resource.before.sha256 !== a.instruction.before || Number(resource.before.metadata?.bytes) !== a.before_bytes || event.after?.present !== true || event.after.sha256 !== a.instruction.after || Number(event.after.metadata?.bytes) !== a.after_bytes ||
    instructionIdentity(resource.before) !== a.instruction_identity_fingerprint || instructionIdentity(event.after) !== a.instruction_identity_fingerprint ||
    classifyInputChange(resource.before, event.after, resource, input) !== "safety_violation") fail("closeout_instruction_original_fault_invalid");
  const unit = r.phases.find(x => x.id === "unit"), lines = old.unit_log.toString().split("\n"), results = lines.filter(x => x.startsWith("[canonical:unit] child_result ")), starts = lines.filter(x => x.startsWith("[canonical:unit] child_start "));
  if (unit.duration_ms !== 360925 || unit.timed_out !== false || unit.exit_status !== null || unit.failure_code !== "phase_cancelled" || unit.cleanup?.termination_reason !== "operator_cancelled" || unit.log?.truncated !== false || unit.log.bytes !== old.unit_log.length ||
    starts.length !== 52 || results.length !== 51 || results.some(x => !/ exit_code=0 signal=null timed_out=false .*termination_reason=natural_exit$/u.test(x)) ||
    starts.at(-1) !== '[canonical:unit] child_start label="machine-owned Companion service and public lifecycle contract" timeout_ms=30000') fail("closeout_instruction_original_cancellation_invalid");
  readCloseoutScopeCorrectionEvidence(path.join(folder, p.predecessor_proof.artifact), predecessor, repositoryRoot);
  return { original: r, prior, completion };
}
function instructionReplacementEvidence(folder, p) {
  const a = CLOSEOUT_INSTRUCTION_PINS, before = closeoutArtifact(folder, p.instruction.before), after = closeoutArtifact(folder, p.instruction.after), provenance = json(closeoutArtifact(folder, p.instruction.provenance));
  const split = bytes => {
    const start = "### Augnes Space reporting exception\n", end = "### A substantive task ends with a complete report in its own session\n", pieces = bytes.toString().split(start);
    if (pieces.length !== 2) fail("closeout_instruction_reporting_section_invalid");
    const rest = pieces[1].split(end); if (rest.length !== 2 || !rest[0]) fail("closeout_instruction_reporting_section_invalid");
    return { prefix: pieces[0], reporting: rest[0], suffix: rest[1] };
  };
  const old = split(before), current = split(after);
  if (before.length !== a.before_bytes || after.length !== a.after_bytes || old.prefix !== current.prefix || old.suffix !== current.suffix || old.reporting === current.reporting ||
    provenance.matches_actual_safety_event !== true || provenance.outside_reporting_exception_byte_identical !== true || provenance.reported_author !== "Codex" || provenance.os_writer_independently_verified !== false ||
    provenance.records?.global_before?.sha256 !== digest(before) || provenance.records.global_before.byte_size !== before.length ||
    provenance.records?.global_after?.sha256 !== digest(after) || provenance.records.global_after.byte_size !== after.length) fail("closeout_instruction_replacement_invalid");
  return { before_sha256: digest(before), after_sha256: digest(after), outside_reporting_sha256: digest({ prefix: old.prefix, suffix: old.suffix }) };
}
export function readCloseoutInstructionEvidence(file, p, repositoryRoot) {
  if (!keys(normalizedProof(p), ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "predecessor_proof", "instruction", "source_scope", "final_source", "authorization", "budget"]) || !semanticInstructionProof(p)) fail("closeout_instruction_proof_invalid");
  const folder = path.dirname(file);
  for (const ref of [p.predecessor_proof, ...Object.values(p.originals), ...Object.values(p.instruction), p.final_source]) closeoutArtifact(folder, ref);
  validateCloseoutInstructionSourceScope(p.source_scope);
  const evidence = instructionReplacementEvidence(folder, p), original = instructionOriginalEvidence(folder, p, repositoryRoot), git = gitAt(repositoryRoot), source = json(closeoutArtifact(folder, p.final_source));
  if (!keys(source, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "deltas"]) || source.schema !== "augnes.local-canonical-closeout-instruction-final-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
    source.base !== p.base || source.head !== p.head || source.tree !== p.tree || source.predecessor_head !== CLOSEOUT_INSTRUCTION_PINS.prior_head || source.predecessor_tree !== CLOSEOUT_INSTRUCTION_PINS.prior_tree ||
    !keys(source.deltas, ["predecessor", "first_closeout", "main"]) || git(["rev-parse", `${p.head}^{tree}`]).toString().trim() !== p.tree) fail("closeout_instruction_final_source_invalid");
  for (const [name, base] of [["predecessor", CLOSEOUT_INSTRUCTION_PINS.prior_head], ["first_closeout", CLOSEOUT_CONTINUATION_PINS.prior_head], ["main", p.base]]) {
    const bytes = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", base, p.head, "--"]), declared = source.deltas[name];
    const paths = git(["diff", "--no-renames", "--name-only", "-z", base, p.head, "--"]).toString().split("\0").filter(Boolean).sort();
    if (!keys(declared, ["sha256", "bytes", "changed_paths"]) || declared.sha256 !== digest(bytes) || declared.bytes !== bytes.length || !exact(declared.changed_paths, paths)) fail("closeout_instruction_native_delta_invalid");
  }
  const scope = inspectCloseoutInstructionSourceScope(repositoryRoot, p); validateCloseoutInstructionSourceScope(scope);
  if (!exact(scope, p.source_scope)) fail("closeout_instruction_source_scope_mismatch");
  instructionEvidence.set(digest(normalizedProof(p)), evidence); return { ...original, source, evidence };
}
// This consumes the executor's actual frozen declaration, never a second read
// of the instruction path. Dynamic events remain separate from its fingerprint.
export function assertCloseoutInstructionInputs(p, input, { requireUnfaulted = true } = {}) {
  const a = CLOSEOUT_INSTRUCTION_PINS, declaration = { contract: input?.contract, path_kind: input?.path_kind, binding: input?.binding, resources: input?.resources };
  const rows = (Array.isArray(input?.resources) ? input.resources.filter(x => x.id === "user-instructions") : []), row = rows?.[0];
  if (!usesCloseoutInstructionInputs(p) || input?.contract !== "augnes.local-canonical-inputs.v3" || input.path_kind !== "isolated-model-free-v1" ||
    !sha(input.fingerprint) || digest(declaration) !== input.fingerprint || input.binding?.head !== p.head || input.binding.tree !== p.tree ||
    !Array.isArray(input.resources) || new Set(input.resources.map(x => x.id)).size !== input.resources.length || rows.length !== 1 ||
    row.classification !== "safety" || row.location_fingerprint !== a.instruction_location_fingerprint || row.before?.present !== true ||
    row.before.sha256 !== a.instruction.after || Number(row.before.metadata?.bytes) !== a.after_bytes || instructionIdentity(row.before) !== a.instruction_identity_fingerprint ||
    (requireUnfaulted && (input.first_fault !== null || input.secondary_faults?.length !== 0 || !Array.isArray(input.events) || input.events.some(x => !nonFaultInputChange(x.disposition))))) fail("closeout_instruction_frozen_input_invalid");
  return input.fingerprint;
}
export function closeoutInstructionInputBinding(p, input, options) {
  const fingerprint = assertCloseoutInstructionInputs(p, input, options), a = CLOSEOUT_INSTRUCTION_PINS;
  return { contract: input.contract, path_kind: input.path_kind, fingerprint, head: p.head, tree: p.tree,
    resource: "user-instructions", classification: "safety", location_fingerprint: a.instruction_location_fingerprint,
    sha256: a.instruction.after, bytes: a.after_bytes, identity_fingerprint: a.instruction_identity_fingerprint };
}
function validInstructionInputBinding(attempt) {
  const p = attempt.source_correction, a = CLOSEOUT_INSTRUCTION_PINS, value = attempt.closeout_instruction_input;
  return sha(attempt.contract_fingerprint) && exact(value, { contract: "augnes.local-canonical-inputs.v3", path_kind: "isolated-model-free-v1",
    fingerprint: attempt.contract_fingerprint, head: p.head, tree: p.tree, resource: "user-instructions", classification: "safety",
    location_fingerprint: a.instruction_location_fingerprint, sha256: a.instruction.after, bytes: a.after_bytes, identity_fingerprint: a.instruction_identity_fingerprint });
}
export async function authorizeCloseoutInstruction(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request), frozenInputs } = {}) {
  const evidence = instructionEvidence.get(digest(normalizedProof(p))), scope = CLOSEOUT_INSTRUCTION_PINS.scope;
  if (!semanticInstructionProof(p) || !evidence || !keys(p.authorization, ["scope_comment_id", "scope_sha256"]) || p.authorization.scope_comment_id !== scope.id || !sha(p.authorization.scope_sha256) ||
    Date.parse(scope.timestamp) <= Date.parse(CLOSEOUT_INSTRUCTION_PINS.completed_at)) fail("closeout_instruction_authority_missing");
  const fingerprint = assertCloseoutInstructionInputs(p, frozenInputs, { requireUnfaulted: false });
  const capability = await authorizeContinuingScope(p, evidence, transport, scope);
  capabilities.set(capability, { ...capabilities.get(capability), instruction_inputs: fingerprint }); return capability;
}
export function assertCloseoutInstructionAuthorization(p, capability, completion, frozenInputs, { requireUnfaulted = true } = {}) {
  const state = capabilities.get(capability), evidence = instructionEvidence.get(digest(normalizedProof(p)));
  const fingerprint = assertCloseoutInstructionInputs(p, frozenInputs, { requireUnfaulted });
  if (!state || !evidence || state.proof !== digest(p) || state.observations !== digest(capability.observations) || state.evidence !== digest(evidence) || state.instruction_inputs !== fingerprint ||
    completion?.finished_at !== CLOSEOUT_INSTRUCTION_PINS.completed_at || !validContinuingScopeObservation(p, capability.observations.closeout_scope, CLOSEOUT_INSTRUCTION_PINS.scope)) fail("closeout_instruction_authenticated_authority_required");
}
export function validCloseoutInstructionAttempt(attempt) {
  try {
    const p = attempt?.source_correction;
    if (!semanticInstructionProof(p) || !validInstructionInputBinding(attempt) || attempt.number !== 1 || attempt.recovery || attempt.browser_replacement || !exact(attempt.budget, BUDGET) ||
      attempt.branch !== p.branch || attempt.head !== p.head || attempt.tree !== p.tree || !validContinuingScopeObservation(p, attempt.closeout_authority?.closeout_scope, CLOSEOUT_INSTRUCTION_PINS.scope)) return false;
    validateCloseoutInstructionSourceScope(p.source_scope); return true;
  } catch { return false; }
}

// One measured fixture-preparation correction under the original continuing
// scope. The prior instruction allowance and its complete failure stay spent.
// BEGIN CLOSEOUT FIXTURE CORRECTION PINS
export const CLOSEOUT_FIXTURE_CORRECTION_PINS = Object.freeze({
  "prior_head": "22842588d35b0679c7b851e9a2a503c52a4cadcc",
  "prior_tree": "109f5c3cc2646f16dc62dc58c3d1974916b9e346",
  "prior_family_id": "38bee310216c09498824cc9f4b0a22fe5c60ea120ea8844658c51b1b0405c6b1",
  "prior_attempt_id": "2026-10-31T05-40-58-047Z-full-22842588d35b-cf3af53326eed21e",
  "prior_receipt_fingerprint": "e7c7bb60eb21c92f4b0877fd45eba623255ebd6a4cd49c12565eea9562720e17",
  "completed_at": "2026-10-31T05:52:10.384Z",
  "predecessor_proof": "f47b538531fa0fafed154ead05f5a4231da76ebf2bafc2317d11d216f05a1d53",
  "fixture_path": "scripts/fixtures/local-canonical-1559-closeout.mjs",
  "fixture_sha256": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
  "manifest": "5c8c035f66f5456af0ae82fd7166a45fe642fd08476c6a027fb25a704fb0f5ec",
  "originals": {
    "receipt": "58126a415019c0fd5877876573efc3c399f7d8652d71699895472a5fed75e34a",
    "attempt": "3fec8138b52fcb4776c84c0044e88b54b3836a8dbe6303d94270af62ff786ac8",
    "completion": "124f1262444e0ea32f68ff76189e03b543fdd4b57a02e24df9bcbc6aebd6f5e0",
    "edge": "5719d110a04696535a644b20bd2b0b5bd6c1a82f157828367bfecf6dcdd0dd5a",
    "authority_log": "2887d0315b368e37715854c77d94256efd86d615262bf697e3293de2d2f51326",
    "stock": "aa812a90e27cfec787468e08525cf7618752d6efef5da6280ca276fd170173dd",
    "stock_log": "06cb3b97dbb148b7f69eebb994f49a084722332589b011fa5e39a5e11e520d0f"
  },
  "retained": {
    "accepted-main-integration.diff": "7e5183e3c1d98a150db33397d11f86abc029afb0fbc11f1e90ab6376ee1ac318",
    "baseline/executed-development.patch": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "baseline/fixture.mjs": "e0966d9f90c6b1e114bed9eaaf95db0fcdacc59d15d2702fed5e24ea21eb57fb",
    "baseline/output.log": "a818f1046df6f7a6c34f81c6cf9999505f4f60295019ae89a754cc52ea6c7bd7",
    "baseline/settlement.json": "040fd520617632220ab023dfd453c727ad3b9b5ca5d4323daa901bdc53cc7176",
    "baseline/source-command.json": "71754a6c18915fb1187f03b514b421ab578e58c5dbe1bd18b06f801b1b320ea7",
    "candidate-development.patch": "08a507a66ebfb2a16ea14095ea998a6a38e426adc32f46a8ccdb49935973c7d4",
    "candidate-fixture.mjs": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
    "candidate/executed-development.patch": "08a507a66ebfb2a16ea14095ea998a6a38e426adc32f46a8ccdb49935973c7d4",
    "candidate/fixture.mjs": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
    "candidate/output.log": "433353a49446d30dd490f631bde34b26286f8a31814bf316b0f363d690faac8b",
    "candidate/settlement.json": "a6b88b8be790b302b927a97f3fed75032ba1ada341b5c3e4a8a238dd02802842",
    "candidate/source-command.json": "35286ed37da849e6a7fdc6fb2cd63eb9c87eb346d4e6f88773f81e0fdadae8f7",
    "plan.json": "15660b14957347f258bcdaeaa6af7a1b24e90e1d75fcd8a230ec3a252a600890",
    "run-comparison.mjs": "e6905e7f70da420c9197fe3969cec54657f27ecb5c8269fb72dbe2ba0d33f924"
  }
});
// END CLOSEOUT FIXTURE CORRECTION PINS
for (const value of Object.values(CLOSEOUT_FIXTURE_CORRECTION_PINS)) if (value && typeof value === "object") Object.freeze(value);
const fixtureCorrectionEvidence = new Map();
export function inspectCloseoutFixtureCorrectionSourceScope(repositoryRoot, { base, head }) {
  const { scope } = inspectSourceScope(repositoryRoot, { base, head }, CLOSEOUT_PINS.accepted_base, CLOSEOUT_FIXTURE_CORRECTION_PINS.prior_head, [], SCOPE_CORRECTION_POLICY_PATHS);
  return { ...scope, schema: "augnes.local-canonical-closeout-fixture-source.v1", basis: "settled_instruction_replacement_and_current_main_union" };
}
export function validateCloseoutFixtureCorrectionSourceScope(scope) {
  if (scope?.schema !== "augnes.local-canonical-closeout-fixture-source.v1" || scope.basis !== "settled_instruction_replacement_and_current_main_union" ||
    scope.accepted_base !== CLOSEOUT_PINS.accepted_base || scope.accepted_head !== CLOSEOUT_FIXTURE_CORRECTION_PINS.prior_head || !commit(scope.current_main)) fail("closeout_fixture_inventory_invalid");
  validateRetainedSourceScope(scope, 33, SCOPE_CORRECTION_POLICY_PATHS);
  if (scope.candidate_policy.some(row => row.candidate.present !== true) ||
    scope.accepted_task.find(row => row.path === CLOSEOUT_FIXTURE_CORRECTION_PINS.fixture_path)?.candidate.sha256 !== CLOSEOUT_FIXTURE_CORRECTION_PINS.fixture_sha256) fail("closeout_fixture_source_changed");
  return scope;
}
function fixtureRetainedInventory(retained) {
  const expected = CLOSEOUT_FIXTURE_CORRECTION_PINS.retained;
  return Array.isArray(retained) && exact(retained.map(x => x?.path).sort(), Object.keys(expected).sort()) && retained.every(x => x.sha256 === expected[x.path] &&
    (keys(x, ["path", "sha256"]) || (keys(x, ["path", "artifact", "sha256"]) && /^[A-Za-z0-9_-]+\.(?:json|log|mjs|diff)$/u.test(x.artifact ?? ""))));
}
function semanticFixtureProof(p) {
  const a = CLOSEOUT_FIXTURE_CORRECTION_PINS;
  return isCloseoutFixtureCorrection(p) && p.pull_request === CLOSEOUT_PINS.pull_request && p.branch === CLOSEOUT_PINS.branch && [p.base, p.head, p.tree].every(commit) &&
    p.head !== a.prior_head && p.tree !== a.prior_tree && p.prior_family_id === a.prior_family_id && p.prior_attempt_id === a.prior_attempt_id && p.prior_number === 1 &&
    p.prior_receipt_fingerprint === a.prior_receipt_fingerprint && exact(p.budget, BUDGET) && p.predecessor_proof?.sha256 === a.predecessor_proof &&
    keys(p.originals, Object.keys(a.originals)) && Object.entries(a.originals).every(([name, hash]) => p.originals[name]?.sha256 === hash) &&
    keys(p.correction, ["manifest", "retained"]) && p.correction.manifest?.sha256 === a.manifest && fixtureRetainedInventory(p.correction.retained) && sha(p.final_source?.sha256) &&
    p.source_scope?.accepted_head === a.prior_head && p.source_scope.current_main === p.base;
}
function fixtureOriginalEvidence(folder, p, repositoryRoot) {
  const a = CLOSEOUT_FIXTURE_CORRECTION_PINS, old = Object.fromEntries(Object.keys(a.originals).map(name => { const bytes = closeoutArtifact(folder, p.originals[name]); return [name, name.endsWith("log") ? bytes : json(bytes)]; }));
  const r = old.receipt, prior = old.attempt, c = old.completion, copy = { ...r }; delete copy.integrity;
  const predecessor = json(closeoutArtifact(folder, p.predecessor_proof));
  if (r.integrity?.content_fingerprint !== digest(copy) || r.integrity.content_fingerprint !== p.prior_receipt_fingerprint || !exact(r.attempt, prior) ||
    prior.head !== a.prior_head || prior.tree !== a.prior_tree || prior.family_id !== p.prior_family_id || prior.attempt_id !== p.prior_attempt_id || prior.number !== 1 || prior.branch !== p.branch ||
    !validCloseoutInstructionAttempt(prior) || !isCloseoutInstructionReplacement(predecessor) || !exact(normalizedProof(prior.source_correction), normalizedProof(predecessor)) ||
    !exact(prior.closeout_instruction_input, closeoutInstructionInputBinding(predecessor, r.inputs)) ||
    c.attempt_id !== prior.attempt_id || c.receipt_fingerprint !== p.prior_receipt_fingerprint || c.finished_at !== a.completed_at || c.disposition !== "product_failure" || c.infrastructure_code !== null || c.cleanup_complete !== true ||
    old.edge.contract !== "augnes.local-canonical-successor.v2" || old.edge.kind !== CLOSEOUT_INSTRUCTION_KIND || old.edge.family_id !== prior.family_id || old.edge.head !== prior.head || old.edge.tree !== prior.tree || old.edge.proof_fingerprint !== digest(prior.source_correction) ||
    r.repository?.repository_id !== "hynk-studio/augnes" || r.repository.origin !== "https://github.com/hynk-studio/augnes.git" || r.repository.head_sha !== prior.head || r.repository.tree_sha !== prior.tree || r.repository.branch !== p.branch ||
    r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" || r.repository.detached !== false ||
    r.outcome?.disposition !== "product_failure" || r.outcome.safety !== "preserved_within_observed_scope" || r.outcome.first_fault !== null || r.inputs?.first_fault !== null || r.inputs.secondary_faults?.length !== 0 ||
    r.cleanup?.completed !== true || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true || r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 ||
    !exact(r.phases?.map(x => x.id), BROWSER_REPLACEMENT_PHASES) || !exact(r.phases.map(x => x.status), [...Array(6).fill("pass"), "failure", ...Array(9).fill("not_run")]) ||
    old.stock.content_fingerprint !== p.prior_receipt_fingerprint || old.stock.valid_deciding_evidence !== false || old.stock.issues?.length !== 15) fail("closeout_fixture_original_binding_invalid");
  const authority = r.phases.find(x => x.id === "authority"), lines = old.authority_log.toString().split("\n");
  const outer = lines.filter(x => x.startsWith("[canonical:authority] child_result ")), nested = lines.filter(x => x.startsWith("[canonical:1559-closeout-continuation-controls] child_result "));
  if (authority.duration_ms !== 80528 || authority.timed_out !== false || authority.exit_status !== 1 || authority.cleanup?.termination_reason !== "natural_exit" || authority.log?.truncated !== false || authority.log.bytes !== old.authority_log.length ||
    outer.length !== 9 || outer.slice(0, -1).some(x => !/ exit_code=0 signal=null timed_out=false .*termination_reason=natural_exit$/u.test(x)) ||
    outer.at(-1) !== '[canonical:authority] child_result label="local Canonical executor identity and scheduling contract" duration_ms=30074 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout' ||
    nested.length !== 6 || nested.some(x => !/ exit_code=0 signal=null timed_out=false .*termination_reason=natural_exit$/u.test(x)) ||
    !lines.includes('[canonical:1559-closeout-instruction-controls] child_start label="admission" timeout_ms=6000') || lines.some(x => x.startsWith("[canonical:1559-closeout-instruction-controls] child_result "))) fail("closeout_fixture_original_timeout_invalid");
  readCloseoutInstructionEvidence(path.join(folder, p.predecessor_proof.artifact), predecessor, repositoryRoot);
  return { original: r, prior, completion: c };
}
function fixtureDevelopmentEvidence(folder, p, repositoryRoot) {
  const a = CLOSEOUT_FIXTURE_CORRECTION_PINS, manifest = json(closeoutArtifact(folder, p.correction.manifest));
  const files = new Map(p.correction.retained.map(ref => [ref.path, closeoutArtifact(folder, artifactRef(ref))])), plan = json(files.get("plan.json")), git = gitAt(repositoryRoot);
  if (manifest.nondeciding !== true || !exact(manifest.plan, plan) || manifest.checkout_fixture_unchanged !== true || manifest.checkout_head_unchanged !== true ||
    plan.schema !== "augnes.private-executor-cumulative-comparison.v1" || plan.nondeciding !== true || !exact(plan.fixed_order, ["baseline", "candidate"]) || plan.samples_per_variant !== 1 ||
    plan.timeout_ms !== 30000 || plan.require_natural_exit !== true || plan.entry !== "scripts/test-local-canonical-executor.mjs" || plan.source_instrumentation !== false ||
    plan.baseline.head !== a.prior_head || plan.baseline.tree !== a.prior_tree || plan.candidate.fixture_sha256 !== a.fixture_sha256 ||
    !files.get("baseline/fixture.mjs").equals(git(["show", `${a.prior_head}:${a.fixture_path}`])) || !files.get("candidate/fixture.mjs").equals(git(["show", `${p.head}:${a.fixture_path}`])) ||
    !files.get("candidate-fixture.mjs").equals(files.get("candidate/fixture.mjs")) || digest(files.get("candidate-development.patch")) !== plan.candidate.development_delta_sha256) fail("closeout_fixture_comparison_invalid");
  const groups = {}, commands = {};
  for (const sample of ["baseline", "candidate"]) {
    const command = json(files.get(`${sample}/source-command.json`)), settled = json(files.get(`${sample}/settlement.json`)), result = settled.result;
    const log = files.get(`${sample}/output.log`).toString(); commands[sample] = command;
    if (command.nondeciding !== true || command.head !== plan[sample].head || command.tree !== plan[sample].tree || command.fixture_sha256 !== digest(files.get(`${sample}/fixture.mjs`)) ||
      command.timeout_ms !== 30000 || command.require_natural_exit !== true || command.source_instrumentation !== false || command.command?.length !== 2 || command.command[1] !== plan.entry ||
      settled.nondeciding !== true || settled.label !== sample || settled.failure !== null || settled.root_absent !== true || settled.source_after?.snapshot_delta_unchanged !== true ||
      !Array.isArray(settled.cleanup) || !settled.cleanup.length || settled.cleanup.some(x => x.completed !== true || x.failure_count !== 0) ||
      result.exit_code !== 0 || result.signal !== null || result.timed_out !== false || result.cancelled !== false || result.exit_observed !== true || result.streams_closed !== true || result.cleanup_completed !== true || result.remaining_owned_processes !== 0 || result.termination_reason !== "natural_exit" || result.duration_ms >= 30000 ||
      !validTime(command.started_at) || Date.parse(command.started_at) <= Date.parse(a.completed_at) || !validTime(settled.finished_at) || Date.parse(settled.finished_at) < Date.parse(command.started_at) ||
      !exact(settled, manifest.results?.find(x => x.label === sample)) || !log.includes('"test": "local-canonical-executor"')) fail("closeout_fixture_settlement_invalid");
    groups[sample] = manifest.groups?.[sample]?.filter(x => x.group);
    if (!Array.isArray(groups[sample]) || !exact(groups[sample].map(x => x.group), ["evidence", "source", "authority", "admission", "stock", "race", "admission"]) ||
      groups[sample].some(x => x.controls !== x.names.length || x.names.some(name => !log.includes(name)))) fail("closeout_fixture_controls_missing");
  }
  const before = manifest.results.find(x => x.label === "baseline"), after = manifest.results.find(x => x.label === "candidate");
  const b = groups.baseline.flatMap(x => x.names), c = groups.candidate.flatMap(x => x.names), added = c.filter(name => !b.includes(name));
  if (Date.parse(commands.candidate.started_at) <= Date.parse(before.finished_at) || after.result.duration_ms >= before.result.duration_ms || b.length !== 92 || c.length !== 93 ||
    b.some(name => !c.includes(name)) || !exact(added, ["self-consistent synthetic seeded-initial-authority: closeout_continuation_original_binding_invalid"])) fail("closeout_fixture_comparison_controls_changed");
  return { firstEvidenceAt: Date.parse(commands.baseline.started_at), manifest_sha256: a.manifest };
}
export function readCloseoutFixtureCorrectionEvidence(file, p, repositoryRoot) {
  if (!keys(normalizedProof(p), ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "predecessor_proof", "correction", "source_scope", "final_source", "authorization", "budget"]) || !semanticFixtureProof(p)) fail("closeout_fixture_proof_invalid");
  const folder = path.dirname(file);
  for (const ref of [p.predecessor_proof, ...Object.values(p.originals), p.correction.manifest, ...p.correction.retained.map(artifactRef), p.final_source]) closeoutArtifact(folder, ref);
  validateCloseoutFixtureCorrectionSourceScope(p.source_scope);
  const original = fixtureOriginalEvidence(folder, p, repositoryRoot), git = gitAt(repositoryRoot), source = json(closeoutArtifact(folder, p.final_source));
  if (!keys(source, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "deltas"]) || source.schema !== "augnes.local-canonical-closeout-fixture-final-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
    source.base !== p.base || source.head !== p.head || source.tree !== p.tree || source.predecessor_head !== CLOSEOUT_FIXTURE_CORRECTION_PINS.prior_head || source.predecessor_tree !== CLOSEOUT_FIXTURE_CORRECTION_PINS.prior_tree ||
    !keys(source.deltas, ["predecessor", "first_closeout", "main"]) || git(["rev-parse", `${p.head}^{tree}`]).toString().trim() !== p.tree) fail("closeout_fixture_final_source_invalid");
  for (const [name, base] of [["predecessor", CLOSEOUT_FIXTURE_CORRECTION_PINS.prior_head], ["first_closeout", CLOSEOUT_CONTINUATION_PINS.prior_head], ["main", p.base]]) {
    const bytes = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", base, p.head, "--"]), declared = source.deltas[name];
    const paths = git(["diff", "--no-renames", "--name-only", "-z", base, p.head, "--"]).toString().split("\0").filter(Boolean).sort();
    if (!keys(declared, ["sha256", "bytes", "changed_paths"]) || declared.sha256 !== digest(bytes) || declared.bytes !== bytes.length || !exact(declared.changed_paths, paths)) fail("closeout_fixture_native_delta_invalid");
  }
  const scope = inspectCloseoutFixtureCorrectionSourceScope(repositoryRoot, p); validateCloseoutFixtureCorrectionSourceScope(scope);
  if (!exact(scope, p.source_scope)) fail("closeout_fixture_source_scope_mismatch");
  const evidence = fixtureDevelopmentEvidence(folder, p, repositoryRoot); fixtureCorrectionEvidence.set(digest(normalizedProof(p)), evidence);
  return { ...original, source, evidence };
}
export async function authorizeCloseoutFixtureCorrection(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request), frozenInputs } = {}) {
  const evidence = fixtureCorrectionEvidence.get(digest(normalizedProof(p)));
  if (!semanticFixtureProof(p) || !evidence || !keys(p.authorization, ["scope_comment_id", "scope_sha256"]) || p.authorization.scope_comment_id !== CLOSEOUT_PINS.scope.id || !sha(p.authorization.scope_sha256)) fail("closeout_fixture_authority_missing");
  const fingerprint = assertCloseoutInstructionInputs(p, frozenInputs, { requireUnfaulted: false }), capability = await authorizeContinuingScope(p, evidence, transport);
  capabilities.set(capability, { ...capabilities.get(capability), instruction_inputs: fingerprint }); return capability;
}
export function assertCloseoutFixtureCorrectionAuthorization(p, capability, completion, frozenInputs, { requireUnfaulted = true } = {}) {
  const state = capabilities.get(capability), evidence = fixtureCorrectionEvidence.get(digest(normalizedProof(p))), fingerprint = assertCloseoutInstructionInputs(p, frozenInputs, { requireUnfaulted });
  if (!state || !evidence || state.proof !== digest(p) || state.observations !== digest(capability.observations) || state.evidence !== digest(evidence) || state.instruction_inputs !== fingerprint ||
    completion?.finished_at !== CLOSEOUT_FIXTURE_CORRECTION_PINS.completed_at || evidence.firstEvidenceAt <= Date.parse(completion.finished_at) || !validContinuationObservation(p, capability.observations.closeout_scope)) fail("closeout_fixture_authenticated_authority_required");
}
export function validCloseoutFixtureCorrectionAttempt(attempt) {
  try {
    const p = attempt?.source_correction;
    if (!semanticFixtureProof(p) || !validInstructionInputBinding(attempt) || attempt.number !== 1 || attempt.recovery || attempt.browser_replacement || !exact(attempt.budget, BUDGET) ||
      attempt.branch !== p.branch || attempt.head !== p.head || attempt.tree !== p.tree || !validContinuationObservation(p, attempt.closeout_authority?.closeout_scope)) return false;
    validateCloseoutFixtureCorrectionSourceScope(p.source_scope); return true;
  } catch { return false; }
}

// BEGIN CLOSEOUT CAPABILITY CORRECTION PINS
export const CLOSEOUT_CAPABILITY_CORRECTION_PINS = Object.freeze({
  "accepted_base": "bbb7dee536817fe4b7f28f5353a1d88f56c7e44d",
  "prior_head": "9e33dda83633cb80b97822b493ad3ed1343f4f50",
  "prior_tree": "2c6656a7055c904a1a0b8d4851c20208e56c7826",
  "prior_family_id": "dedddb9849fcd307ddb8bd9e24c3ad6278d8d5b98250243fa10dbfe970e8d032",
  "prior_attempt_id": "2026-10-31T06-17-03-197Z-full-9e33dda83633-daa3cdc31f1b11cc",
  "prior_receipt_fingerprint": "c8acea3dd2eeae8d7393a160f58ff75fc5fcd8a80fd26290ddb1bf895d0b7149",
  "completed_at": "2026-10-31T06:28:17.880Z",
  "predecessor_proof": "d8a60d80f7ff5947aea85f192863af4cbd1a4600f78c61c21747fc97ccd117c3",
  "fixture_path": "scripts/fixtures/local-canonical-1559-closeout.mjs",
  "fixture_sha256": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
  "manifest": "abc36d7564f88011df5d5e9b62bb08eedc0a2e97946bd1536b2b59c33c598626",
  "originals": {
    "receipt": "785e5ca1c3e5923948359541ba67d9432e1bd011db2492abf63069e6701b2cf6",
    "attempt": "e1f6c7e79ce9eaa0bc6ada8d58543e70cf2e0499b95c7bb1623d380dc0ade52f",
    "completion": "7403f5e65c1fffc6e36d1f93c65cb5621dacd64256a5d3ba91aa86633327b92d",
    "edge": "b13d2bb9d8eac335c5e450f6855e855d37f3984c477440c61685a525485e6339",
    "authority_log": "20bef06c890fed2b263398eab8b89203a13ebac2fc3c163fc0a8000c607445d3",
    "stock": "4a2d2bb5031bba3cf35dfb2aae62ee202ae0eb2c9a66395d77fe314d2422933a",
    "stock_log": "72213e311a014fd8ea40edf26691028d0a53cdbe76e89c8b22680178256a669b"
  },
  "retained": {
    "admission-precheck-callsite.txt": "ca4b5981a1981a56e756b1ddc026538e720ab8bce1e973137f036c9eba1f04b2",
    "baseline/fixture-observed.mjs": "b877e2d9395b747de92cb263a3ed91e7fbe81f9fbda348e21984a755151476d7",
    "baseline/fixture-original.mjs": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
    "baseline/fixture-recovered.mjs": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
    "baseline/instrument.mjs": "6be83849f24f687e7dce4762c9880e3041b1016329de8a1a2b8c4c3af0363d39",
    "baseline/instrumentation.json": "8d8bdc89cc4bbd59aef22fb2f9924cae377dd6b1d294aaca7a1f8ac7195719d4",
    "baseline/observations.jsonl": "35b91a28b346a6093d550f441620b8cc8ed4a1e98cd84332650191948bc5f436",
    "baseline/observer.mjs": "2e768543df76a410d34e347eda85734e472b136325c9b1eb08dcfa9669898ad9",
    "baseline/output.log": "c946e05226d64cad15b42110fa45cccea4f37ac6432bd6c77a38bd0527d0e618",
    "baseline/run-diagnostic.mjs": "845bf1b53606aefdf8fdc7c3ca7d7c7513e13f72ec9c334415389129821c2ed8",
    "baseline/settlement.json": "437fbb1d1ef3d9d5c7133b8c344b60f64a352f24bdd57e7286e1dd701e811ffe",
    "baseline/source-command.json": "994b395fdf6016b245cbfb29b64296c1c9a914d961bb114d38e4d9e02e643b0a",
    "before-bindings.json": "0e924d5847c59a781efd5f707d014bdc1db1f612a724a8eae3f815236e4caad9",
    "before/scripts/local-canonical-1559-closeout.mjs": "4a944df18a83398424c4be713808b7cc76d07dfc2957460c727d658d193d2b9b",
    "before/scripts/local-canonical-attempts.mjs": "0033c57a1aedc342cf62c2011bf8323bfafff5bafc2bcb2d4533f1c147ec077f",
    "candidate-bindings.json": "5795fcc577d25aa09c52911ec34b51b9cfc07b47aec0c9807663fe347deaadfb",
    "candidate-native.diff": "a8a9112e84728796623533f2146494dc6afe98fd6d5778b2f6088d4e42a450a6",
    "candidate/scripts/local-canonical-1559-closeout.mjs": "ab038b5f4e9653f49d4df4730839404ef22e0ac1045e9b72d3839a1c1fc9f317",
    "candidate/scripts/local-canonical-attempts.mjs": "b5b3adf119fc9397bb47af039ad3b00fa0341c091bd161c8fb4fbb4a4a4db973",
    "corrected-observed-1/fixture-observed.mjs": "bb5dd074f5a7b14ef53f19ce7ca36ba23343d15cdb4bbed353a23c2ed857693a",
    "corrected-observed-1/fixture-original.mjs": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
    "corrected-observed-1/fixture-recovered.mjs": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
    "corrected-observed-1/instrument.mjs": "6be83849f24f687e7dce4762c9880e3041b1016329de8a1a2b8c4c3af0363d39",
    "corrected-observed-1/instrumentation.json": "75a1914293dfa7f5d50a567131dc0438f1d93bc625db8a083c999ef58d1ebf45",
    "corrected-observed-1/observations.jsonl": "909ca722266110077411b971aaf8392ef1075c00315132a5adfa5c508f441754",
    "corrected-observed-1/observer.mjs": "eab82b85f3c608b94498ed592d7ceb05db5af7e6f558e0b1082e2e32593e19c8",
    "corrected-observed-1/output.log": "86d08a388ac0a5097becd3438ebdcc1bbf09dd801e5e0d7654c0f97d7f3c1fbc",
    "corrected-observed-1/run-corrected-observed.mjs": "03dd885cba7862730c68a2fdff46cc52f90987f46f93b06e6a0deda926417774",
    "corrected-observed-1/settlement.json": "624574aad319d591ea45bd10f20fe3e103b7ee283cfd43f9ef28621ef1e48f02",
    "corrected-observed-1/source-command.json": "1289d26a2cd2feb5a144ad7e2dad35f051b9d9d278a14e8019bc00bc0809e8de",
    "issued-capability-precheck-fragment.mjs": "2fd13faeddc71eb7352805d7d224dc8daad2f163fae9d1a9336016aada3c3744",
    "private-controls-1/output.log": "f8f8d11f0668a9241d32c1a81466be33bd5371b2a56a64a8c29c885973ab79d5",
    "private-controls-1/private-controls.mjs": "34660cdbbb4b4928c2474723b7077f360f621ce6f77aee42971eaaa0e1b7b3e4",
    "private-controls-1/private-preparation.mjs": "14f918dadf54aa5738844cacf3331c688970ba26e6615b2b47898b3790a01ad1",
    "private-controls-1/settlement.json": "fabac875a17b1e889f99c6d4cc07bac35ccd470c8a0f1da50bd014221f2b22fb",
    "private-controls-1/source-command.json": "163d8ec58b5a9d00639dc55f17bba2e3a2895d97d805487e400f7a697af84137",
    "run-private-controls.mjs": "d09556f2c688411f7b5cc3373c89005f31fdabae4275f60acdcf154b88561720"
  }
});
// END CLOSEOUT CAPABILITY CORRECTION PINS
for (const value of Object.values(CLOSEOUT_CAPABILITY_CORRECTION_PINS)) if (value && typeof value === "object") Object.freeze(value);
const capabilityCorrectionEvidence = new Map();
export function inspectCloseoutCapabilityCorrectionSourceScope(repositoryRoot, { base, head }) {
  const { scope } = inspectSourceScope(repositoryRoot, { base, head }, CLOSEOUT_CAPABILITY_CORRECTION_PINS.accepted_base, CLOSEOUT_CAPABILITY_CORRECTION_PINS.prior_head, [], SCOPE_CORRECTION_POLICY_PATHS);
  return { ...scope, schema: "augnes.local-canonical-closeout-capability-source.v1", basis: "settled_fixture_correction_and_current_main_union" };
}
export function validateCloseoutCapabilityCorrectionSourceScope(scope) {
  if (scope?.schema !== "augnes.local-canonical-closeout-capability-source.v1" || scope.basis !== "settled_fixture_correction_and_current_main_union" ||
    scope.accepted_base !== CLOSEOUT_CAPABILITY_CORRECTION_PINS.accepted_base || scope.accepted_head !== CLOSEOUT_CAPABILITY_CORRECTION_PINS.prior_head || !commit(scope.current_main)) fail("closeout_capability_inventory_invalid");
  validateRetainedSourceScope(scope, 33, SCOPE_CORRECTION_POLICY_PATHS);
  if (scope.candidate_policy.some(row => row.candidate.present !== true) ||
    scope.accepted_task.find(row => row.path === CLOSEOUT_CAPABILITY_CORRECTION_PINS.fixture_path)?.candidate.sha256 !== CLOSEOUT_CAPABILITY_CORRECTION_PINS.fixture_sha256) fail("closeout_capability_source_changed");
  return scope;
}
function capabilityRetainedInventory(retained) {
  const expected = CLOSEOUT_CAPABILITY_CORRECTION_PINS.retained;
  return Array.isArray(retained) && exact(retained.map(x => x?.path).sort(), Object.keys(expected).sort()) && retained.every(x => x.sha256 === expected[x.path] &&
    (keys(x, ["path", "sha256"]) || (keys(x, ["path", "artifact", "sha256"]) && /^[A-Za-z0-9_-]+\.(?:json|jsonl|log|mjs|diff|txt)$/u.test(x.artifact ?? ""))));
}
function semanticCapabilityProof(p) {
  const a = CLOSEOUT_CAPABILITY_CORRECTION_PINS;
  return isCloseoutCapabilityCorrection(p) && p.pull_request === CLOSEOUT_PINS.pull_request && p.branch === CLOSEOUT_PINS.branch && [p.base, p.head, p.tree].every(commit) &&
    p.head !== a.prior_head && p.tree !== a.prior_tree && p.prior_family_id === a.prior_family_id && p.prior_attempt_id === a.prior_attempt_id && p.prior_number === 1 &&
    p.prior_receipt_fingerprint === a.prior_receipt_fingerprint && exact(p.budget, BUDGET) && p.predecessor_proof?.sha256 === a.predecessor_proof &&
    keys(p.originals, Object.keys(a.originals)) && Object.entries(a.originals).every(([name, hash]) => p.originals[name]?.sha256 === hash) &&
    keys(p.correction, ["manifest", "retained"]) && p.correction.manifest?.sha256 === a.manifest && capabilityRetainedInventory(p.correction.retained) && sha(p.final_source?.sha256) &&
    p.source_scope?.accepted_head === a.prior_head && p.source_scope.current_main === p.base;
}
function capabilityOriginalEvidence(folder, p, repositoryRoot) {
  const a = CLOSEOUT_CAPABILITY_CORRECTION_PINS, old = Object.fromEntries(Object.keys(a.originals).map(name => { const bytes = closeoutArtifact(folder, p.originals[name]); return [name, name.endsWith("log") ? bytes : json(bytes)]; }));
  const r = old.receipt, prior = old.attempt, c = old.completion, copy = { ...r }; delete copy.integrity;
  const predecessor = json(closeoutArtifact(folder, p.predecessor_proof));
  if (r.integrity?.content_fingerprint !== digest(copy) || r.integrity.content_fingerprint !== p.prior_receipt_fingerprint || !exact(r.attempt, prior) ||
    prior.head !== a.prior_head || prior.tree !== a.prior_tree || prior.family_id !== p.prior_family_id || prior.attempt_id !== p.prior_attempt_id || prior.number !== 1 || prior.branch !== p.branch ||
    !validCloseoutFixtureCorrectionAttempt(prior) || !isCloseoutFixtureCorrection(predecessor) || !exact(normalizedProof(prior.source_correction), normalizedProof(predecessor)) ||
    !exact(prior.closeout_instruction_input, closeoutInstructionInputBinding(predecessor, r.inputs)) ||
    c.attempt_id !== prior.attempt_id || c.receipt_fingerprint !== p.prior_receipt_fingerprint || c.finished_at !== a.completed_at || c.disposition !== "product_failure" || c.infrastructure_code !== null || c.cleanup_complete !== true ||
    old.edge.contract !== "augnes.local-canonical-successor.v2" || old.edge.kind !== CLOSEOUT_FIXTURE_CORRECTION_KIND || old.edge.family_id !== prior.family_id || old.edge.head !== prior.head || old.edge.tree !== prior.tree || old.edge.proof_fingerprint !== digest(prior.source_correction) ||
    r.repository?.repository_id !== "hynk-studio/augnes" || r.repository.origin !== "https://github.com/hynk-studio/augnes.git" || r.repository.head_sha !== prior.head || r.repository.tree_sha !== prior.tree || r.repository.branch !== p.branch ||
    r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" || r.repository.detached !== false ||
    r.outcome?.disposition !== "product_failure" || r.outcome.safety !== "preserved_within_observed_scope" || r.outcome.first_fault !== null || r.inputs?.first_fault !== null || r.inputs.secondary_faults?.length !== 0 ||
    r.cleanup?.completed !== true || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true || r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 ||
    !exact(r.phases?.map(x => x.id), BROWSER_REPLACEMENT_PHASES) || !exact(r.phases.map(x => x.status), [...Array(6).fill("pass"), "failure", ...Array(9).fill("not_run")]) ||
    old.stock.content_fingerprint !== p.prior_receipt_fingerprint || old.stock.valid_deciding_evidence !== false || old.stock.issues?.length !== 14) fail("closeout_capability_original_binding_invalid");
  const authority = r.phases.find(x => x.id === "authority"), lines = old.authority_log.toString().split("\n");
  const outer = lines.filter(x => x.startsWith("[canonical:authority] child_result ")), nested = lines.filter(x => x.startsWith("[canonical:1559-closeout-continuation-controls] child_result "));
  if (authority.duration_ms !== 79650 || authority.timed_out !== false || authority.exit_status !== 1 || authority.cleanup?.termination_reason !== "natural_exit" || authority.log?.truncated !== false || authority.log.bytes !== old.authority_log.length ||
    outer.length !== 9 || outer.slice(0, -1).some(x => !/ exit_code=0 signal=null timed_out=false .*termination_reason=natural_exit$/u.test(x)) ||
    outer.at(-1) !== '[canonical:authority] child_result label="local Canonical executor identity and scheduling contract" duration_ms=29124 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit' ||
    nested.length !== 6 || nested.some(x => !/ exit_code=0 signal=null timed_out=false .*termination_reason=natural_exit$/u.test(x)) ||
    !lines.includes('[canonical:1559-closeout-instruction-controls] child_start label="admission" timeout_ms=6000') || !exact(lines.filter(x => x.startsWith("[canonical:1559-closeout-instruction-controls] child_result ")), ['[canonical:1559-closeout-instruction-controls] child_result label="admission" duration_ms=6104 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout'])) fail("closeout_capability_original_timeout_invalid");
  readCloseoutFixtureCorrectionEvidence(path.join(folder, p.predecessor_proof.artifact), predecessor, repositoryRoot);
  return { original: r, prior, completion: c };
}
function capabilityDevelopmentEvidence(folder, p, repositoryRoot) {
  const a = CLOSEOUT_CAPABILITY_CORRECTION_PINS, manifest = json(closeoutArtifact(folder, p.correction.manifest));
  const files = new Map(p.correction.retained.map(ref => [ref.path, closeoutArtifact(folder, artifactRef(ref))])), git = gitAt(repositoryRoot);
  const source = manifest.source, paths = ["scripts/local-canonical-1559-closeout.mjs", "scripts/local-canonical-attempts.mjs"];
  if (manifest.schema !== "augnes.private-closeout-issued-capability-correction.v1" || manifest.nondeciding !== true || manifest.base_head !== a.prior_head || manifest.base_tree !== a.prior_tree ||
    !Array.isArray(manifest.retained) || !exact(manifest.retained.map(x => x.path).sort(), Object.keys(a.retained).sort()) ||
    manifest.retained.some(x => x.sha256 !== a.retained[x.path] || x.bytes !== files.get(x.path)?.length) ||
    source?.before?.head !== a.prior_head || source.before.tree !== a.prior_tree || source.candidate?.head !== a.prior_head || source.candidate.tree !== a.prior_tree ||
    source.candidate.fixture_unchanged_sha256 !== a.fixture_sha256 || !exact(source.before.sources?.map(x => x.path), paths) || !exact(source.candidate.sources?.map(x => x.path), paths) ||
    source.candidate.delta?.sha256 !== digest(files.get("candidate-native.diff")) || source.candidate.delta.bytes !== files.get("candidate-native.diff").length) fail("closeout_capability_correction_invalid");
  for (const variant of ["before", "candidate"]) for (const row of source[variant].sources) {
    const bytes = files.get(`${variant}/${row.path}`);
    if (!bytes || row.sha256 !== digest(bytes) || row.bytes !== bytes.length || (variant === "before" && !bytes.equals(git(["show", `${a.prior_head}:${row.path}`])))) fail("closeout_capability_mechanism_source_invalid");
  }
  const fragment = text => text.match(/export function assertCloseoutIssuedCapability\(p, capability\) \{[\s\S]*?\n\}/u)?.[0];
  const admit = text => text.slice(text.indexOf("function admitSourceCorrection("), text.indexOf("\nfunction readCandidateReview("));
  const newArm = '    : isCloseoutCapabilityCorrection(p) ? "closeout_capability_authenticated_authority_required"\n';
  const finalOwner = git(["show", `${p.head}:${paths[0]}`]).toString(), finalAttempts = git(["show", `${p.head}:${paths[1]}`]).toString();
  const measuredOwner = files.get(`candidate/${paths[0]}`).toString(), measuredAttempts = files.get(`candidate/${paths[1]}`).toString();
  if (source.precheck_fragment?.sha256 !== digest(files.get("issued-capability-precheck-fragment.mjs")) || source.callsite_fragment?.sha256 !== digest(files.get("admission-precheck-callsite.txt")) ||
    `${fragment(measuredOwner)}\n` !== files.get("issued-capability-precheck-fragment.mjs").toString() || !fragment(finalOwner)?.includes(newArm.trim()) ||
    fragment(finalOwner).replace(newArm, "") !== fragment(measuredOwner) || admit(finalAttempts) !== admit(measuredAttempts) || !admit(finalAttempts).startsWith(files.get("admission-precheck-callsite.txt").toString().trimEnd()) ||
    digest(git(["show", `${p.head}:${a.fixture_path}`])) !== a.fixture_sha256) fail("closeout_capability_mechanism_source_invalid");
  const commands = {}, outcomes = {}, observations = {};
  function settledRun(directory, declared, entry) {
    const command = json(files.get(`${directory}/source-command.json`)), settled = json(files.get(`${directory}/settlement.json`)), result = settled.result;
    if (!exact(command, declared.command) || !exact(settled, declared.settlement) || command.nondeciding !== true || command.head !== a.prior_head || command.tree !== a.prior_tree ||
      command.timeout_ms !== 6000 || command.require_natural_exit !== true || !Array.isArray(command.command) || !entry(command.command) ||
      settled.nondeciding !== true || settled.failure !== null || settled.root_absent !== true || !Array.isArray(settled.cleanup) || !settled.cleanup.length || settled.cleanup.some(x => x.completed !== true || x.failure_count !== 0) ||
      result.exit_code !== 0 || result.signal !== null || result.timed_out !== false || result.cancelled !== false || result.exit_observed !== true || result.streams_closed !== true || result.cleanup_completed !== true || result.remaining_owned_processes !== 0 || result.termination_reason !== "natural_exit" || result.duration_ms >= 6000 ||
      !validTime(command.started_at) || Date.parse(command.started_at) <= Date.parse(a.completed_at) || !validTime(settled.finished_at) || Date.parse(settled.finished_at) <= Date.parse(command.started_at)) fail("closeout_capability_settlement_invalid");
    return { command, settled };
  }
  for (const [sample, directory] of [["baseline", "baseline"], ["corrected", "corrected-observed-1"]]) {
    const { command, settled } = settledRun(directory, manifest.samples?.[sample] ?? {}, argv => argv.length === 4 && argv[1].endsWith(`/${a.fixture_path}`) && exact(argv.slice(2), ["--run-closeout-instruction-fixtures", "admission"]));
    commands[sample] = command; outcomes[sample] = settled;
    const instrumentation = json(files.get(`${directory}/instrumentation.json`)), original = files.get(`${directory}/fixture-original.mjs`), observed = files.get(`${directory}/fixture-observed.mjs`), recovered = files.get(`${directory}/fixture-recovered.mjs`);
    const stripped = observed.toString().replace(/\/\* AG1559_OBSERVATION_BEGIN \*\/[\s\S]*?\/\* AG1559_OBSERVATION_END \*\//gu, "");
    if (!exact(instrumentation, manifest.samples[sample].instrumentation) || instrumentation.insertion_only !== true || instrumentation.original_bytes_recovered !== true ||
      !original.equals(recovered) || original.toString() !== stripped || digest(original) !== a.fixture_sha256 || instrumentation.original_sha256 !== a.fixture_sha256 || instrumentation.recovered_sha256 !== a.fixture_sha256 || instrumentation.observed_sha256 !== digest(observed) ||
      command.entry_original_sha256 !== a.fixture_sha256 || command.entry_observed_sha256 !== digest(observed) || command.instrumenter_sha256 !== digest(files.get(`${directory}/instrument.mjs`)) || command.observer_sha256 !== digest(files.get(`${directory}/observer.mjs`)) ||
      settled.source_after?.observed_source_unchanged !== true || settled.source_after.original_bytes_recovered !== true || (sample === "corrected" && (settled.source_after.captured_candidate_unchanged !== true || !exact(command.candidate_sources, source.candidate.sources) || !exact(command.candidate_delta, source.candidate.delta)))) fail("closeout_capability_observation_invalid");
    observations[sample] = files.get(`${directory}/observations.jsonl`).toString().trim().split("\n").map(line => JSON.parse(line));
    const rows = observations[sample], enter = rows.find(x => x.stage === "adverse_block_enter"), leave = rows.find(x => x.stage === "adverse_block_exit" && x.pid === enter?.pid);
    const delta = leave?.git.calls - enter?.git.calls, expected = sample === "baseline" ? 93 : 0;
    if (!enter || !leave || delta !== expected || leave.elapsed_ms <= enter.elapsed_ms || manifest.measurements?.[sample]?.stages?.adverse?.git_calls !== delta) fail("closeout_capability_work_reduction_invalid");
    const claims = rows.filter(x => x.stage === "claim_begin_enter");
    if (claims.length !== 2 || claims.some(begin => {
      const proofStart = rows.find(x => x.pid === begin.pid && x.stage === "claim_proof_enter"), proofEnd = rows.find(x => x.pid === begin.pid && x.stage === "claim_proof_exit");
      const end = rows.find(x => x.pid === begin.pid && ["claim_begin_exit", "claim_refused"].includes(x.stage));
      return !proofStart || !proofEnd || !end || proofEnd.git.calls - proofStart.git.calls !== 93 || end.git.calls - begin.git.calls !== 93;
    }) || !rows.some(x => x.stage === "claim_begin_exit") || !rows.some(x => x.stage === "claim_refused" && x.code === "EEXIST")) fail("closeout_capability_fresh_reread_missing");
  }
  const controls = settledRun("private-controls-1", manifest.controls ?? {}, argv => exact(argv.slice(1), ["scripts/fixtures/private-issued-capability-controls.mjs"]));
  const log = files.get("private-controls-1/output.log").toString(), result = log.split("\n").filter(line => line.startsWith('{"issued_capability_controls":')).map(line => JSON.parse(line));
  const names = ["unissued null capability", "forged observations-only capability", "reconstructed issued capability", "issued capability with changed proof binding", "issued capability with mutated observation binding", "doubly-invalid request retains authority-first prospective refusal", "genuine issued capability still rereads and rejects disk evidence changed after authentication", "genuine capability retains complete fresh positive proof validation and one normal synthetic admission"];
  if (result.length !== 1 || !exact(result[0], manifest.controls.results) || result[0].count !== 8 || result[0].synthetic_only !== true || result[0].cleanup_complete !== true ||
    !exact(result[0].issued_capability_controls?.map(x => x.name), names) || result[0].issued_capability_controls.some((row, i) => row.git_calls !== (i === 7 ? 93 : 0) || row.proof_reads !== (i >= 6 ? 1 : 0) || row.artifact_reads !== (i === 7 ? 2 : i === 6 ? 1 : 0)) ||
    controls.command.synthetic_only !== true || !exact(controls.command.candidate_sources, source.candidate.sources) || !exact(controls.command.candidate_delta, source.candidate.delta) || controls.command.fixture_sha256 !== a.fixture_sha256 ||
    controls.settled.source_after?.captured_candidate_unchanged !== true || controls.settled.source_after.fixture_unchanged !== true || controls.settled.source_after.private_helpers_unchanged !== true ||
    Date.parse(commands.corrected.started_at) <= Date.parse(outcomes.baseline.finished_at) || outcomes.corrected.result.duration_ms >= outcomes.baseline.result.duration_ms) fail("closeout_capability_controls_invalid");
  return { firstEvidenceAt: Date.parse(commands.baseline.started_at), manifest_sha256: a.manifest };
}
export function readCloseoutCapabilityCorrectionEvidence(file, p, repositoryRoot) {
  if (!keys(normalizedProof(p), ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "predecessor_proof", "correction", "source_scope", "final_source", "authorization", "budget"]) || !semanticCapabilityProof(p)) fail("closeout_capability_proof_invalid");
  const folder = path.dirname(file);
  for (const ref of [p.predecessor_proof, ...Object.values(p.originals), p.correction.manifest, ...p.correction.retained.map(artifactRef), p.final_source]) closeoutArtifact(folder, ref);
  validateCloseoutCapabilityCorrectionSourceScope(p.source_scope);
  const original = capabilityOriginalEvidence(folder, p, repositoryRoot), git = gitAt(repositoryRoot), source = json(closeoutArtifact(folder, p.final_source));
  if (!keys(source, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "deltas"]) || source.schema !== "augnes.local-canonical-closeout-capability-final-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
    source.base !== p.base || source.head !== p.head || source.tree !== p.tree || source.predecessor_head !== CLOSEOUT_CAPABILITY_CORRECTION_PINS.prior_head || source.predecessor_tree !== CLOSEOUT_CAPABILITY_CORRECTION_PINS.prior_tree ||
    !keys(source.deltas, ["predecessor", "first_closeout", "main"]) || git(["rev-parse", `${p.head}^{tree}`]).toString().trim() !== p.tree) fail("closeout_capability_final_source_invalid");
  for (const [name, base] of [["predecessor", CLOSEOUT_CAPABILITY_CORRECTION_PINS.prior_head], ["first_closeout", CLOSEOUT_CONTINUATION_PINS.prior_head], ["main", p.base]]) {
    const bytes = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", base, p.head, "--"]), declared = source.deltas[name];
    const paths = git(["diff", "--no-renames", "--name-only", "-z", base, p.head, "--"]).toString().split("\0").filter(Boolean).sort();
    if (!keys(declared, ["sha256", "bytes", "changed_paths"]) || declared.sha256 !== digest(bytes) || declared.bytes !== bytes.length || !exact(declared.changed_paths, paths)) fail("closeout_capability_native_delta_invalid");
  }
  const scope = inspectCloseoutCapabilityCorrectionSourceScope(repositoryRoot, p); validateCloseoutCapabilityCorrectionSourceScope(scope);
  if (!exact(scope, p.source_scope)) fail("closeout_capability_source_scope_mismatch");
  const evidence = capabilityDevelopmentEvidence(folder, p, repositoryRoot); capabilityCorrectionEvidence.set(digest(normalizedProof(p)), evidence);
  return { ...original, source, evidence };
}
export async function authorizeCloseoutCapabilityCorrection(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request), frozenInputs } = {}) {
  const evidence = capabilityCorrectionEvidence.get(digest(normalizedProof(p)));
  if (!semanticCapabilityProof(p) || !evidence || !keys(p.authorization, ["scope_comment_id", "scope_sha256"]) || p.authorization.scope_comment_id !== CLOSEOUT_PINS.scope.id || !sha(p.authorization.scope_sha256)) fail("closeout_capability_authority_missing");
  const fingerprint = assertCloseoutInstructionInputs(p, frozenInputs, { requireUnfaulted: false }), capability = await authorizeContinuingScope(p, evidence, transport);
  capabilities.set(capability, { ...capabilities.get(capability), instruction_inputs: fingerprint }); return capability;
}
export function assertCloseoutCapabilityCorrectionAuthorization(p, capability, completion, frozenInputs, { requireUnfaulted = true } = {}) {
  const state = capabilities.get(capability), evidence = capabilityCorrectionEvidence.get(digest(normalizedProof(p))), fingerprint = assertCloseoutInstructionInputs(p, frozenInputs, { requireUnfaulted });
  if (!state || !evidence || state.proof !== digest(p) || state.observations !== digest(capability.observations) || state.evidence !== digest(evidence) || state.instruction_inputs !== fingerprint ||
    completion?.finished_at !== CLOSEOUT_CAPABILITY_CORRECTION_PINS.completed_at || evidence.firstEvidenceAt <= Date.parse(completion.finished_at) || !validContinuationObservation(p, capability.observations.closeout_scope)) fail("closeout_capability_authenticated_authority_required");
}
export function validCloseoutCapabilityCorrectionAttempt(attempt) {
  try {
    const p = attempt?.source_correction;
    if (!semanticCapabilityProof(p) || !validInstructionInputBinding(attempt) || attempt.number !== 1 || attempt.recovery || attempt.browser_replacement || !exact(attempt.budget, BUDGET) ||
      attempt.branch !== p.branch || attempt.head !== p.head || attempt.tree !== p.tree || !validContinuationObservation(p, attempt.closeout_authority?.closeout_scope)) return false;
    validateCloseoutCapabilityCorrectionSourceScope(p.source_scope); return true;
  } catch { return false; }
}

// BEGIN CLOSEOUT SCOPE FIXTURE CORRECTION PINS
export const CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS = Object.freeze({
  "accepted_base": "bbb7dee536817fe4b7f28f5353a1d88f56c7e44d",
  "prior_head": "168167204f4c6b66961f7bdbac730ce7bde444e8",
  "prior_tree": "a106b65b76f30fc3d8560e299b6d800b6b714801",
  "prior_family_id": "65d35261679ffdcafdf6edcb86e86c3e8168b92bf6aae07c69a6c2c8e4acf7a9",
  "prior_attempt_id": "2026-10-31T06-59-09-045Z-full-168167204f4c-3fab428373fcf10d",
  "prior_receipt_fingerprint": "9929314dae211c24f891f9ba213bdf332e3b8688ddedbcafc62631d47350f244",
  "completed_at": "2026-10-31T07:10:32.711Z",
  "predecessor_proof": "89aab3e54bf6857ee08e29230dac5f24e005e34d9f735730e3ddd728fe3641d4",
  "fixture_path": "scripts/fixtures/local-canonical-1559-closeout.mjs",
  "fixture_before_sha256": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
  "fixture_sha256": "32c5fbeaf32438bf06b533e699c3bc24e9fb5f6534e670662576951f08058f63",
  "fixture_delta_sha256": "0f3466a2e7f66477dfd475d45d05a1e41d09af3e95a71a2745739c4774047414",
  "manifest": "1e5f8f0111cbf9ac5a9e95c3bf70e35c9778d71830ab1a98f7240f69317e0e12",
  "originals": {
    "receipt": "a1c156a6cf8afe52dcad2c139e7942804be6fa5c119d137b020b5e34cd5126c2",
    "attempt": "c80643f8966fadabea470d13caa346177c075f8ac9d60113fcd385472a9debd3",
    "completion": "f50b23797897a63003145e92446bdcff9b142dd3aa23ca0d14b5b2d32d4269c7",
    "edge": "0e051ace00814c5121342f0bf8e9c568d911c21120426c39c01a4ab2d851c3f8",
    "authority_log": "1a86208e0545393ccecc863da92e9c755efc5f062cb9c030e92a6442bffe6188",
    "stock": "f37da6a8c671f10c1eab903f1429d88e84d6086a0beb4205ac9fc31b447286f1",
    "stock_log": "644ac10ebb76c0260b7931ee8a222f8309f815538d917759fe97a1d24be72e79"
  },
  "retained": {
    "analysis.json": "ae62b322d8237bcfdd70cf04eaec2b20b33f09fbf2e6593d65e3a30f08e1187a",
    "baseline/fixture-observed.mjs": "e2d8bbdbd39a1452cb771e5e788a26a2d725ea1aa69a98e38414e282f36934b9",
    "baseline/fixture-original.mjs": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
    "baseline/fixture-recovered.mjs": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
    "baseline/instrument.mjs": "0424c8a047b914fea2f261a184813ff5638d222976af967055c65d46d57736e7",
    "baseline/instrumentation-output.log": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "baseline/instrumentation.json": "c7ec7cf25bbd7f2ea6e6c5e22ed7c9fd73cdc7d4196c94e44c589a950f307903",
    "baseline/observations.jsonl": "18d034bb30e6546f9cfca723d568841cac441f1f7da4a09a8eccbd2b1907849a",
    "baseline/observer.mjs": "e569977bd25f4a761152ca02f7de31efb3077b1d5968b0480fce84409a99edf2",
    "baseline/output.log": "780d525551ffad48be4d1e6336b41369e12cc297e296ba9bacf2f220845ca5bd",
    "baseline/owner-observed.mjs": "3f3d575aac45c89fcba237cbd0b69757e5ed56840febfea2f60dacef83d19407",
    "baseline/owner-original.mjs": "095ed2fcf3c3ac970ad329e8dd3a6f6f975679bd5926f27c8c293df787d2adc7",
    "baseline/owner-recovered.mjs": "095ed2fcf3c3ac970ad329e8dd3a6f6f975679bd5926f27c8c293df787d2adc7",
    "baseline/run-diagnostic.mjs": "c3c9e8d1213bb7442dbf469fe7fa351022971a2c72809b08d42216bcc722dbc4",
    "baseline/settlement.json": "4ae46d99389c6b0aefb85be47af8b1691c6f87c5d05b9df34dfb180941e32817",
    "baseline/source-command.json": "4f353eed4a918d3558635302a68f18c456a022de629ef3746227699ebfdd8854",
    "candidate-native.diff": "0f3466a2e7f66477dfd475d45d05a1e41d09af3e95a71a2745739c4774047414",
    "continuation-admission-1/output.log": "5f022381c403a2b46af7acca1a46ee6fe4302c6e5d83e5a8413f67d827e483b9",
    "continuation-admission-1/settlement.json": "b14a51982659010014663ef9b1b8a914845dd0f2750eaf62184c6d03e8acffae",
    "continuation-admission-1/source-command.json": "2c08bf43a9b70a91a46894c02289c022c6d6c6456efafa036c81576247d45f9f",
    "corrected-observed-1/fixture-observed.mjs": "f258edf0356227d2f0d01f771d76e68c7d482edab52f5daa53942a6be173c505",
    "corrected-observed-1/fixture-original.mjs": "32c5fbeaf32438bf06b533e699c3bc24e9fb5f6534e670662576951f08058f63",
    "corrected-observed-1/fixture-recovered.mjs": "32c5fbeaf32438bf06b533e699c3bc24e9fb5f6534e670662576951f08058f63",
    "corrected-observed-1/instrument.mjs": "0424c8a047b914fea2f261a184813ff5638d222976af967055c65d46d57736e7",
    "corrected-observed-1/instrumentation-output.log": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "corrected-observed-1/instrumentation.json": "b6fffa9eeea7ed7fa222a318712180c8426fefe01a69f052aa9a9b1c5e2475db",
    "corrected-observed-1/observations.jsonl": "3cb22e4208245521fbf232dbce00b373f68f7a8149ad51845ac21f10caee608b",
    "corrected-observed-1/observer.mjs": "980b2d19a5bc74a32e5affd60aded8808796d62c8c8dec961adab8d512bdd911",
    "corrected-observed-1/output.log": "36c3bd56d02e6ffde20fb9309933ba0dfd2a8aa69d67c96f9489a4baaaf3cca6",
    "corrected-observed-1/owner-observed.mjs": "117c7856d3283c2e66fed711ee0925b1b584ef4e2291cea768d32e3908292535",
    "corrected-observed-1/owner-original.mjs": "095ed2fcf3c3ac970ad329e8dd3a6f6f975679bd5926f27c8c293df787d2adc7",
    "corrected-observed-1/owner-recovered.mjs": "095ed2fcf3c3ac970ad329e8dd3a6f6f975679bd5926f27c8c293df787d2adc7",
    "corrected-observed-1/run-focused.mjs": "1d25a0ac07c5f727bc7b079c81958a8ca5b48a590c099208cde4ae154303662d",
    "corrected-observed-1/settlement.json": "5c10e5b9fdfa7c32c309cb6c78a66a49199b0b52ea4d7e5bc085d401732e6f5b",
    "corrected-observed-1/source-command.json": "34ee98fed397993cbcfbe2ed6cf855ccd1b7658bf9f8a482cc736ab446f9d9ea",
    "fixture-before.mjs": "c1c839ad3080fb25a1535f9fc36e4ecee9dde8f7342f8996f36ed140bd97d327",
    "fixture-candidate.mjs": "32c5fbeaf32438bf06b533e699c3bc24e9fb5f6534e670662576951f08058f63",
    "initial-admission-1/output.log": "29124c7d16b15fa2bbc78ac608c7d7bd59be7f042ede3acd0189d99bbf068f2f",
    "initial-admission-1/settlement.json": "8f8a7b4cff1378fe35947e8cd918d81298750c6c6696553c3498bd169976b087",
    "initial-admission-1/source-command.json": "a8c3e88fd139b0db39398253f9678eeb0d3f1a4e9fce2d4ca2608cef8e9c1acc",
    "scope-evidence-1/output.log": "75d9d8dcc5bf1b7560f5e5740a40526071d06b099f0bd89fae76256c43ac2e9c",
    "scope-evidence-1/settlement.json": "c31bb68b0add1207e953070734c8007b3fc1566de19a5239116440040acd1b9c",
    "scope-evidence-1/source-command.json": "657177e502aaa9ab068193ac44c1629900b4c0d35ca7fe0cc76591bea4ef33e2",
    "scope-stock-1/output.log": "5c4ce232c8a53e4eb9c14da9af7a31a24df3ec1a3f060f857160d016f8d07f9b",
    "scope-stock-1/settlement.json": "6fd910c70152620a6be61e5cebb5e155d2a0671299b3cc022046d898d54085da",
    "scope-stock-1/source-command.json": "b9abd327250846de867a43730c7af389944ac669c9e030a10e64a6b181c7ff14",
    "source-bindings.json": "90ea8af8eefadc9459f5e2199163854bef19343e1cc5b42d0da2977283ae1e40"
  }
});
// END CLOSEOUT SCOPE FIXTURE CORRECTION PINS
for (const value of Object.values(CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS)) if (value && typeof value === "object") Object.freeze(value);
const scopeFixtureCorrectionEvidence = new Map();
export function inspectCloseoutScopeFixtureCorrectionSourceScope(repositoryRoot, { base, head }) {
  const { scope } = inspectSourceScope(repositoryRoot, { base, head }, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.accepted_base, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.prior_head, [], SCOPE_CORRECTION_POLICY_PATHS);
  return { ...scope, schema: "augnes.local-canonical-closeout-scope-fixture-source.v1", basis: "settled_capability_correction_and_current_main_union" };
}
export function validateCloseoutScopeFixtureCorrectionSourceScope(scope) {
  if (scope?.schema !== "augnes.local-canonical-closeout-scope-fixture-source.v1" || scope.basis !== "settled_capability_correction_and_current_main_union" ||
    scope.accepted_base !== CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.accepted_base || scope.accepted_head !== CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.prior_head || !commit(scope.current_main)) fail("closeout_scope_fixture_inventory_invalid");
  validateRetainedSourceScope(scope, 33, SCOPE_CORRECTION_POLICY_PATHS);
  if (scope.candidate_policy.some(row => row.candidate.present !== true) ||
    scope.accepted_task.find(row => row.path === CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.fixture_path)?.candidate.sha256 !== CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.fixture_sha256) fail("closeout_scope_fixture_source_changed");
  return scope;
}
function scopeFixtureRetainedInventory(retained) {
  const expected = CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.retained;
  return Array.isArray(retained) && exact(retained.map(x => x?.path).sort(), Object.keys(expected).sort()) && retained.every(x => x.sha256 === expected[x.path] &&
    (keys(x, ["path", "sha256"]) || (keys(x, ["path", "artifact", "sha256"]) && /^[A-Za-z0-9_-]+\.(?:json|jsonl|log|mjs|diff|txt)$/u.test(x.artifact ?? ""))));
}
function semanticScopeFixtureProof(p) {
  const a = CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS;
  return isCloseoutScopeFixtureCorrection(p) && p.pull_request === CLOSEOUT_PINS.pull_request && p.branch === CLOSEOUT_PINS.branch && [p.base, p.head, p.tree].every(commit) &&
    p.head !== a.prior_head && p.tree !== a.prior_tree && p.prior_family_id === a.prior_family_id && p.prior_attempt_id === a.prior_attempt_id && p.prior_number === 1 &&
    p.prior_receipt_fingerprint === a.prior_receipt_fingerprint && exact(p.budget, BUDGET) && p.predecessor_proof?.sha256 === a.predecessor_proof &&
    keys(p.originals, Object.keys(a.originals)) && Object.entries(a.originals).every(([name, hash]) => p.originals[name]?.sha256 === hash) &&
    keys(p.correction, ["manifest", "retained"]) && p.correction.manifest?.sha256 === a.manifest && scopeFixtureRetainedInventory(p.correction.retained) && sha(p.final_source?.sha256) &&
    p.source_scope?.accepted_head === a.prior_head && p.source_scope.current_main === p.base;
}
function scopeFixtureOriginalEvidence(folder, p, repositoryRoot) {
  const a = CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS, old = Object.fromEntries(Object.keys(a.originals).map(name => { const bytes = closeoutArtifact(folder, p.originals[name]); return [name, name.endsWith("log") ? bytes : json(bytes)]; }));
  const r = old.receipt, prior = old.attempt, c = old.completion, copy = { ...r }; delete copy.integrity;
  const predecessor = json(closeoutArtifact(folder, p.predecessor_proof));
  if (r.integrity?.content_fingerprint !== digest(copy) || r.integrity.content_fingerprint !== p.prior_receipt_fingerprint || !exact(r.attempt, prior) ||
    prior.head !== a.prior_head || prior.tree !== a.prior_tree || prior.family_id !== p.prior_family_id || prior.attempt_id !== p.prior_attempt_id || prior.number !== 1 || prior.branch !== p.branch ||
    !validCloseoutCapabilityCorrectionAttempt(prior) || !isCloseoutCapabilityCorrection(predecessor) || !exact(normalizedProof(prior.source_correction), normalizedProof(predecessor)) ||
    !exact(prior.closeout_instruction_input, closeoutInstructionInputBinding(predecessor, r.inputs)) ||
    c.attempt_id !== prior.attempt_id || c.receipt_fingerprint !== p.prior_receipt_fingerprint || c.finished_at !== a.completed_at || c.disposition !== "product_failure" || c.infrastructure_code !== null || c.cleanup_complete !== true ||
    old.edge.contract !== "augnes.local-canonical-successor.v2" || old.edge.kind !== CLOSEOUT_CAPABILITY_CORRECTION_KIND || old.edge.family_id !== prior.family_id || old.edge.head !== prior.head || old.edge.tree !== prior.tree || old.edge.proof_fingerprint !== digest(prior.source_correction) ||
    r.repository?.repository_id !== "hynk-studio/augnes" || r.repository.origin !== "https://github.com/hynk-studio/augnes.git" || r.repository.head_sha !== prior.head || r.repository.tree_sha !== prior.tree || r.repository.branch !== p.branch ||
    r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" || r.repository.detached !== false ||
    r.outcome?.disposition !== "product_failure" || r.outcome.safety !== "preserved_within_observed_scope" || r.outcome.first_fault !== null || r.inputs?.first_fault !== null || r.inputs.secondary_faults?.length !== 0 ||
    r.cleanup?.completed !== true || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true || r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 ||
    !exact(r.phases?.map(x => x.id), BROWSER_REPLACEMENT_PHASES) || !exact(r.phases.map(x => x.status), [...Array(6).fill("pass"), "failure", ...Array(9).fill("not_run")]) ||
    old.stock.content_fingerprint !== p.prior_receipt_fingerprint || old.stock.valid_deciding_evidence !== false || old.stock.issues?.length !== 14) fail("closeout_scope_fixture_original_binding_invalid");
  const authority = r.phases.find(x => x.id === "authority"), lines = old.authority_log.toString().split("\n");
  const outer = lines.filter(x => x.startsWith("[canonical:authority] child_result ")), nested = lines.filter(x => x.startsWith("[canonical:1559-closeout-scope-correction-controls] child_result "));
  if (authority.duration_ms !== 87853 || authority.timed_out !== false || authority.exit_status !== 1 || authority.cleanup?.termination_reason !== "natural_exit" || authority.log?.truncated !== false || authority.log.bytes !== old.authority_log.length ||
    outer.length !== 10 || outer.slice(0, -1).some(x => !/ exit_code=0 signal=null timed_out=false .*termination_reason=natural_exit$/u.test(x)) ||
    outer.at(-2) !== '[canonical:authority] child_result label="local Canonical executor identity and scheduling contract" duration_ms=26278 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit' ||
    outer.at(-1) !== '[canonical:authority] child_result label="local Canonical receipt integrity and staleness contract" duration_ms=11562 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit' ||
    !exact(nested, [
      '[canonical:1559-closeout-scope-correction-controls] child_result label="evidence" duration_ms=4848 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit',
      '[canonical:1559-closeout-scope-correction-controls] child_result label="admission" duration_ms=6072 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout']) ||
    !lines.includes('[canonical:1559-closeout-scope-correction-controls] child_start label="admission" timeout_ms=6000') || lines.includes('[canonical:1559-closeout-scope-correction-controls] child_start label="stock" timeout_ms=6000') ||
    !lines.includes('[canonical:1559-closeout-instruction-controls] child_result label="admission" duration_ms=5388 exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit')) fail("closeout_scope_fixture_original_timeout_invalid");
  readCloseoutCapabilityCorrectionEvidence(path.join(folder, p.predecessor_proof.artifact), predecessor, repositoryRoot);
  return { original: r, prior, completion: c };
}
function scopeFixtureDevelopmentEvidence(folder, p, repositoryRoot) {
  const a = CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS, manifest = json(closeoutArtifact(folder, p.correction.manifest));
  const files = new Map(p.correction.retained.map(ref => [ref.path, closeoutArtifact(folder, artifactRef(ref))])), git = gitAt(repositoryRoot), binding = json(files.get("source-bindings.json"));
  const before = git(["show", `${a.prior_head}:${a.fixture_path}`]), candidate = git(["show", `${p.head}:${a.fixture_path}`]);
  const delta = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", a.prior_head, p.head, "--", a.fixture_path]);
  if (manifest.schema !== "augnes.private-closeout-scope-historical-setup-correction.v1" || manifest.nondeciding !== true || !exact(manifest.source, binding) ||
    binding.head !== a.prior_head || binding.tree !== a.prior_tree || !exact(binding.changed_paths, [a.fixture_path]) ||
    binding.before?.sha256 !== a.fixture_before_sha256 || binding.before.bytes !== before.length || binding.candidate?.sha256 !== a.fixture_sha256 || binding.candidate.bytes !== candidate.length ||
    binding.native_delta?.sha256 !== a.fixture_delta_sha256 || binding.native_delta.bytes !== delta.length || digest(delta) !== a.fixture_delta_sha256 || !delta.equals(files.get("candidate-native.diff")) ||
    !before.equals(files.get("fixture-before.mjs")) || !candidate.equals(files.get("fixture-candidate.mjs")) ||
    !Array.isArray(manifest.retained) || !exact(manifest.retained.map(x => x.path).sort(), Object.keys(a.retained).sort()) || manifest.retained.some(x => x.sha256 !== a.retained[x.path] || x.bytes !== files.get(x.path)?.length)) fail("closeout_scope_fixture_correction_invalid");
  // This correction changes fixture preparation only. Preserve the production
  // tree reader and full admission body; the issued guard only gains this kind.
  const ownerPath = "scripts/local-canonical-1559-closeout.mjs", attemptsPath = "scripts/local-canonical-attempts.mjs";
  const priorOwner = git(["show", `${a.prior_head}:${ownerPath}`]).toString(), finalOwner = git(["show", `${p.head}:${ownerPath}`]).toString();
  const section = (text, start, end) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)));
  const issued = text => text.match(/export function assertCloseoutIssuedCapability\(p, capability\) \{[\s\S]*?\n\}/u)?.[0];
  const newArm = '    : isCloseoutScopeFixtureCorrection(p) ? "closeout_scope_fixture_authenticated_authority_required"\n';
  if (section(priorOwner, "function inspectSourceScope(", "\nexport function validateCloseoutSourceScope(") !== section(finalOwner, "function inspectSourceScope(", "\nexport function validateCloseoutSourceScope(") ||
    priorOwner.match(/^const gitAt = .+$/mu)?.[0] !== finalOwner.match(/^const gitAt = .+$/mu)?.[0] || !issued(finalOwner)?.includes(newArm.trim()) || issued(finalOwner).replace(newArm, "") !== issued(priorOwner) ||
    section(git(["show", `${a.prior_head}:${attemptsPath}`]).toString(), "function admitSourceCorrection(", "\nfunction readCandidateReview(") !== section(git(["show", `${p.head}:${attemptsPath}`]).toString(), "function admitSourceCorrection(", "\nfunction readCandidateReview(")) fail("closeout_scope_fixture_production_owner_changed");
  const labels = ["baseline", "corrected-observed-1", "scope-evidence-1", "scope-stock-1", "initial-admission-1", "continuation-admission-1"];
  if (!exact(manifest.samples?.map(x => x.label), labels)) fail("closeout_scope_fixture_samples_invalid");
  const commands = {}, settlements = {}, logs = {}, summaries = {};
  const flags = ["--run-closeout-scope-correction-fixtures", "--run-closeout-scope-correction-fixtures", "--run-closeout-scope-correction-fixtures", "--run-closeout-scope-correction-fixtures", "--run-closeout-fixtures", "--run-closeout-continuation-fixtures"];
  const groups = ["admission", "admission", "evidence", "stock", "admission", "admission"];
  for (const [index, label] of labels.entries()) {
    const row = manifest.samples[index], command = json(files.get(`${label}/source-command.json`)), settled = json(files.get(`${label}/settlement.json`)), result = settled.result;
    const log = files.get(`${label}/output.log`).toString(); commands[label] = command; settlements[label] = settled; logs[label] = log;
    if (row.source_command !== `${label}/source-command.json` || row.settlement !== `${label}/settlement.json` || row.output !== `${label}/output.log` || row.source_head !== a.prior_head || row.timeout_ms !== 6000 || row.require_natural_exit !== true ||
      !exact(row.result, result) || !exact(row.source_after, settled.source_after) || command.nondeciding !== true || command.head !== a.prior_head || command.tree !== a.prior_tree ||
      command.timeout_ms !== 6000 || command.require_natural_exit !== true || command.command?.length !== 4 || !command.command[1].endsWith(`/${a.fixture_path}`) || !exact(command.command.slice(2), [flags[index], groups[index]]) ||
      settled.nondeciding !== true || settled.failure !== null || settled.root_absent !== true || !Array.isArray(settled.cleanup) || !settled.cleanup.length || settled.cleanup.some(x => x.completed !== true || x.failure_count !== 0) ||
      result.exit_code !== 0 || result.signal !== null || result.timed_out !== false || result.cancelled !== false || result.exit_observed !== true || result.streams_closed !== true || result.cleanup_completed !== true || result.remaining_owned_processes !== 0 || result.termination_reason !== "natural_exit" || result.duration_ms >= 6000 ||
      !validTime(command.started_at) || Date.parse(command.started_at) <= Date.parse(a.completed_at) || !validTime(settled.finished_at) || Date.parse(settled.finished_at) <= Date.parse(command.started_at) ||
      Object.values(settled.source_after ?? {}).some(value => value !== true)) fail("closeout_scope_fixture_settlement_invalid");
    if (index > 0 && (command.candidate_fixture_sha256 !== a.fixture_sha256 || !exact(command.changed_paths, [a.fixture_path]) || !exact(command.native_delta, binding.native_delta) || command.owner_original_sha256 !== digest(priorOwner) || (index > 1 && (command.entry_executed_sha256 !== a.fixture_sha256 || command.owner_executed_sha256 !== digest(priorOwner))))) fail("closeout_scope_fixture_command_source_invalid");
    summaries[label] = log.split("\n").filter(line => /^\{"closeout(?:_scope_correction|_continuation)?":/u.test(line)).map(line => JSON.parse(line));
    if (!exact(summaries[label], row.suite_summaries) || summaries[label].length !== 1 || summaries[label][0].group !== groups[index] || summaries[label][0].cleanup_complete !== true || summaries[label][0].synthetic_authority_only !== true) fail("closeout_scope_fixture_controls_missing");
  }
  const adverse = "self-consistent synthetic seeded-operational-authority: closeout_scope_correction_original_binding_invalid";
  if (manifest.new_adverse_control !== adverse || !summaries["scope-evidence-1"][0].closeout_scope_correction?.includes(adverse) ||
    !exact(summaries.baseline, summaries["corrected-observed-1"]) || summaries["initial-admission-1"][0].count !== 9 || summaries["continuation-admission-1"][0].count !== 7 ||
    Date.parse(commands["corrected-observed-1"].started_at) <= Date.parse(settlements.baseline.finished_at)) fail("closeout_scope_fixture_behavior_changed");
  const observations = {};
  for (const label of ["baseline", "corrected-observed-1"]) {
    const instrumentation = json(files.get(`${label}/instrumentation.json`));
    if (instrumentation.insertion_only !== true || instrumentation.all_original_bytes_recovered !== true || !exact(instrumentation.records?.map(x => x.path), [a.fixture_path, ownerPath])) fail("closeout_scope_fixture_observation_invalid");
    for (const [index, name] of ["fixture", "owner"].entries()) {
      const original = files.get(`${label}/${name}-original.mjs`), observed = files.get(`${label}/${name}-observed.mjs`), recovered = files.get(`${label}/${name}-recovered.mjs`), record = instrumentation.records[index];
      const expected = index ? Buffer.from(priorOwner) : label === "baseline" ? before : candidate;
      if (!original.equals(expected) || !recovered.equals(expected) || observed.toString().replace(/\/\* AG1559_SCOPE_OBSERVATION_BEGIN \*\/[\s\S]*?\/\* AG1559_SCOPE_OBSERVATION_END \*\//gu, "") !== expected.toString() ||
        record.original_sha256 !== digest(expected) || record.recovered_sha256 !== digest(expected) || record.observed_sha256 !== digest(observed) || record.original_bytes !== expected.length || record.observed_bytes !== observed.length || record.original_bytes_recovered !== true) fail("closeout_scope_fixture_observation_invalid");
    }
    const rows = files.get(`${label}/observations.jsonl`).toString().trim().split("\n").map(line => JSON.parse(line)); observations[label] = rows;
    const proofStart = rows.find(x => x.stage === "initial_proof_enter"), proofEnd = rows.find(x => x.stage === "initial_proof_exit");
    const starts = rows.filter(x => ["historical_proof_enter", "historical_begin_enter"].includes(x.stage));
    const historical = starts.map(x => { const end = rows.find(y => y.pid === x.pid && y.stage === x.stage.replace(/enter$/u, "exit") && y.elapsed_ms > x.elapsed_ms); return end?.git.calls - x.git.calls; });
    if (!proofStart || !proofEnd || proofEnd.git.calls - proofStart.git.calls !== 76 || !exact(historical, label === "baseline" ? [27, 27, 57, 57] : [])) fail("closeout_scope_fixture_work_reduction_invalid");
    const claims = rows.filter(x => x.stage === "claim_begin_enter");
    if (claims.length !== 2 || claims.some(begin => { const start = rows.find(x => x.pid === begin.pid && x.stage === "claim_proof_enter"), end = rows.find(x => x.pid === begin.pid && x.stage === "claim_proof_exit"), settled = rows.find(x => x.pid === begin.pid && ["claim_begin_exit", "claim_refused"].includes(x.stage));
      return !start || !end || !settled || end.git.calls - start.git.calls !== 76 || settled.git.calls - begin.git.calls !== 76;
    }) || !rows.some(x => x.stage === "claim_begin_exit") || !rows.some(x => x.stage === "claim_refused" && x.code === "EEXIST")) fail("closeout_scope_fixture_fresh_reread_missing");
  }
  const analysis = json(files.get("analysis.json"));
  if (manifest.analysis !== "analysis.json" || analysis.nondeciding !== true || analysis.historical_timeout_cause !== "UNKNOWN" || analysis.historical_blocked_operation !== "UNKNOWN" ||
    analysis.before?.historical_replay_git_calls !== 168 || analysis.after?.historical_replay_git_calls !== 0 || analysis.measured_change?.historical_setup_git_calls_removed !== 168 ||
    analysis.measured_change.current_scope_proof_git_calls_unchanged !== true || analysis.measured_change.current_race_claimants_keep_full_proof_and_fresh_begin !== true) fail("closeout_scope_fixture_analysis_invalid");
  return { firstEvidenceAt: Date.parse(commands.baseline.started_at), manifest_sha256: a.manifest };
}
export function readCloseoutScopeFixtureCorrectionEvidence(file, p, repositoryRoot) {
  if (!keys(normalizedProof(p), ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "predecessor_proof", "correction", "source_scope", "final_source", "authorization", "budget"]) || !semanticScopeFixtureProof(p)) fail("closeout_scope_fixture_proof_invalid");
  const folder = path.dirname(file);
  for (const ref of [p.predecessor_proof, ...Object.values(p.originals), p.correction.manifest, ...p.correction.retained.map(artifactRef), p.final_source]) closeoutArtifact(folder, ref);
  validateCloseoutScopeFixtureCorrectionSourceScope(p.source_scope);
  const original = scopeFixtureOriginalEvidence(folder, p, repositoryRoot), git = gitAt(repositoryRoot), source = json(closeoutArtifact(folder, p.final_source));
  if (!keys(source, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "deltas"]) || source.schema !== "augnes.local-canonical-closeout-scope-fixture-final-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
    source.base !== p.base || source.head !== p.head || source.tree !== p.tree || source.predecessor_head !== CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.prior_head || source.predecessor_tree !== CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.prior_tree ||
    !keys(source.deltas, ["predecessor", "first_closeout", "main"]) || git(["rev-parse", `${p.head}^{tree}`]).toString().trim() !== p.tree) fail("closeout_scope_fixture_final_source_invalid");
  for (const [name, base] of [["predecessor", CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.prior_head], ["first_closeout", CLOSEOUT_CONTINUATION_PINS.prior_head], ["main", p.base]]) {
    const bytes = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", base, p.head, "--"]), declared = source.deltas[name];
    const paths = git(["diff", "--no-renames", "--name-only", "-z", base, p.head, "--"]).toString().split("\0").filter(Boolean).sort();
    if (!keys(declared, ["sha256", "bytes", "changed_paths"]) || declared.sha256 !== digest(bytes) || declared.bytes !== bytes.length || !exact(declared.changed_paths, paths)) fail("closeout_scope_fixture_native_delta_invalid");
  }
  const scope = inspectCloseoutScopeFixtureCorrectionSourceScope(repositoryRoot, p); validateCloseoutScopeFixtureCorrectionSourceScope(scope);
  if (!exact(scope, p.source_scope)) fail("closeout_scope_fixture_source_scope_mismatch");
  const evidence = scopeFixtureDevelopmentEvidence(folder, p, repositoryRoot); scopeFixtureCorrectionEvidence.set(digest(normalizedProof(p)), evidence);
  return { ...original, source, evidence };
}
export async function authorizeCloseoutScopeFixtureCorrection(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request), frozenInputs } = {}) {
  const evidence = scopeFixtureCorrectionEvidence.get(digest(normalizedProof(p)));
  if (!semanticScopeFixtureProof(p) || !evidence || !keys(p.authorization, ["scope_comment_id", "scope_sha256"]) || p.authorization.scope_comment_id !== CLOSEOUT_PINS.scope.id || !sha(p.authorization.scope_sha256)) fail("closeout_scope_fixture_authority_missing");
  const fingerprint = assertCloseoutInstructionInputs(p, frozenInputs, { requireUnfaulted: false }), capability = await authorizeContinuingScope(p, evidence, transport);
  capabilities.set(capability, { ...capabilities.get(capability), instruction_inputs: fingerprint }); return capability;
}
export function assertCloseoutScopeFixtureCorrectionAuthorization(p, capability, completion, frozenInputs, { requireUnfaulted = true } = {}) {
  const state = capabilities.get(capability), evidence = scopeFixtureCorrectionEvidence.get(digest(normalizedProof(p))), fingerprint = assertCloseoutInstructionInputs(p, frozenInputs, { requireUnfaulted });
  if (!state || !evidence || state.proof !== digest(p) || state.observations !== digest(capability.observations) || state.evidence !== digest(evidence) || state.instruction_inputs !== fingerprint ||
    completion?.finished_at !== CLOSEOUT_SCOPE_FIXTURE_CORRECTION_PINS.completed_at || evidence.firstEvidenceAt <= Date.parse(completion.finished_at) || !validContinuationObservation(p, capability.observations.closeout_scope)) fail("closeout_scope_fixture_authenticated_authority_required");
}
export function validCloseoutScopeFixtureCorrectionAttempt(attempt) {
  try {
    const p = attempt?.source_correction;
    if (!semanticScopeFixtureProof(p) || !validInstructionInputBinding(attempt) || attempt.number !== 1 || attempt.recovery || attempt.browser_replacement || !exact(attempt.budget, BUDGET) ||
      attempt.branch !== p.branch || attempt.head !== p.head || attempt.tree !== p.tree || !validContinuationObservation(p, attempt.closeout_authority?.closeout_scope)) return false;
    validateCloseoutScopeFixtureCorrectionSourceScope(p.source_scope); return true;
  } catch { return false; }
}

// The user amended the existing closeout scope, not a historical failure's
// disposition or a defect profile. Packets without this modifier retain their
// original reader, authority and terminal semantics.
// BEGIN CLOSEOUT SCOPE AMENDMENT
export const CLOSEOUT_SCOPE_AMENDMENT = Object.freeze({
  comment_id: 6541370652, observation_sha256: "233d69594ec2452f02a69d9b521f5999a94cdafb7b00bebe875da71aceb3f38d",
  basis: "auxiliary_verifier_execution_budgets",
  scope: { id: 6541370652, author: "hynk-studio", author_id: 89450056, body_sha256: "6f68db676fa6c92eafd0abb6bea033af28ef0f2917bc51e4b95330d8ee565a50", timestamp: "2026-10-31T08:52:36Z" },
  accepted_base: "bbb7dee536817fe4b7f28f5353a1d88f56c7e44d",
  prior_head: "9c6341bb208ca3f336d2c6a1c8c5ce6191d60571", prior_tree: "fcda5f3ba6363e70994a041d55b7e51e65247dd9",
  prior_family_id: "7f2e0a968999dd4fbc46baca6f06694579f8c6d2c582aad257ebec507e622f33",
  prior_attempt_id: "2026-10-31T07-34-24-086Z-full-9c6341bb208c-c167760882b567ea",
  prior_receipt_fingerprint: "4767544eaab4d6e8d2ff42073daa98ef90eee307e1d7d125ecf91cb2f644dcf8", completed_at: "2026-10-31T07:45:57.226Z",
  predecessor_proof: "6c3c57b691ca665c540a2687e0ff9f2b999c2cfda12975a36a0bd37ca7c4864e",
  originals: { receipt: "52f21beccd66b6d14d289eae9d97c2c3cf3ffcbab1721f0aa7101d33aff7d206", attempt: "aa94c7781330f7cbee7caaa79504488f61ffe92ad52cea4f5d2bd3d18b420619",
    completion: "3f81b468d826ae33caa79db077af87c4242d48781540f5d2227e67aa6ceb4f3f", edge: "0d1f2fd857d950fdd3ae2dde50612ff4bb438692fd274b12fd55616364522ab5",
    authority_log: "cf37607fdbd3824c6a9f25d48409676761b0508df0763b8a25108137374c97bf", stock: "1bbd9915c34a6618cafb187196788100620c4c04711fc6deb7797f28509d56e7", stock_log: "4798c6c829fb528c68cd0355e69077aef4914908867fc151e835d11633a4c77e" },
  execution_budgets: { groupMs: 12000, nestedChildMs: 6000, executorHarnessMs: 120000, receiptHarnessMs: 90000, reviewHarnessMs: 180000 },
  budget_sources: {
    "scripts/local-canonical-closeout-budgets.mjs": "bd0ee298d9c933e212001ddfd7bf731799c706d3a6d2fa2d634c3d62c71c9472",
    "scripts/test-local-canonical-executor.mjs": "81d84ba6bf0d714a125dfcc178aafa6fff35d9f99827d101b4148a68aa8e3602",
    "scripts/test-local-canonical-receipt.mjs": "bbd3fbc542eaa15f8ed765ce1e0c042bdf1a2b1d42fe8016f86eb9dacc205ddd",
    "scripts/test-local-canonical-review-corrections.mjs": "182b1cf8e45c84d636d8b3252551486834f8cc1f68412cc32377b1a8bd7b5ec4",
    "scripts/fixtures/local-canonical-1559-closeout.mjs": "deaac501f0f5fbeea47c0c233840ea8d9cc3ca263f1d413cf0ce08ff3c5a9ba7",
    "scripts/run-canonical-test-suite.mjs": "89f25c27019cc70343db1ff6558dee4e005c600fca118cb66623a8c8c4d18873",
    "scripts/run-local-canonical-verification.mjs": "4a9c776005c920621bce07a864d025cf98699718c485fea0b9b12314ba52f3ec"
} ,
});
// END CLOSEOUT SCOPE AMENDMENT
for (const value of Object.values(CLOSEOUT_SCOPE_AMENDMENT)) if (value && typeof value === "object") Object.freeze(value);
// This is an authenticated expansion of the same scope, not a timeout-defect
// profile. The old amendment and source-revision records keep their own values.
// BEGIN CLOSEOUT AUXILIARY BUDGET AMENDMENT
export const CLOSEOUT_AUXILIARY_BUDGET_AMENDMENT = Object.freeze({
  comment_id: 6542798089, observation_sha256: "6cdbda0d9a72f9162d35c63cb62ab6421648796c1948a8561bb94ee9ec7fb992",
  basis: "auxiliary_verifier_budget_hierarchy",
  scope: { id: 6542798089, author: "hynk-studio", author_id: 89450056, body_sha256: "bbbf906a147cc0346a2e1bb52a62a60a807228a755dba5fc5d6594d6b0dfc3a2", timestamp: "2026-10-31T11:30:00Z" },
  accepted_base: "bbb7dee536817fe4b7f28f5353a1d88f56c7e44d",
  prior_head: "4f6a73e49d8b392f499e6cdb1ff4b0bea03a829b", prior_tree: "f61d0293e6b6f798d1d33451920f4c269056514d",
  prior_family_id: "750828f6435db69b958380f41ce33e537470756928cc4247c1b566eac637e1b2",
  prior_attempt_id: "2026-10-31T10-17-23-517Z-full-4f6a73e49d8b-d7416157e35b9828",
  prior_receipt_fingerprint: "7e07679f38295786e13d16af2d4826467fc0772ce9b6995aa56f8231092867d6", completed_at: "2026-10-31T10:32:23.681Z",
  predecessor_proof: "c4cb5c7b6dd17761d98d2933113a36501ab2478761d82607581992eb3f74ba22",
  originals: { receipt: "76ac9994c8183ced4432b2be8593a4c4f0a37908c90e3ed6b492679b25a78dbb", attempt: "3e7ec3895fc8468169bd9e7c8242047f6240c970de8eb556e540754721435765",
    completion: "999fa4f50d8a552865023cc81311f89bb082d7a0673e9d74291c3951635a507b", edge: "00a28d1fff2b0eac666e71658b7122487666a75858b88bef4d69fd517ba86f34",
    authority_log: "1a73729a30a95735ea2f2917efe62cee7aaaab22ab288bf1e6445e136d6b5b2e", stock: "a996be725c041edfe60ab922fcc0b08ccaffa4597c679549e8efd88404141e49", stock_log: "e5be1ecf465a33bef0b88b29c9ef96b3351f4086f3d8d57653481e1fe94be668" },
  execution_budgets: {
    closeout: { groupMs: 12000, nestedChildMs: 6000, executorHarnessMs: 120000, receiptHarnessMs: 90000, reviewHarnessMs: 180000 },
    auxiliary: { groupMs: 20000, nestedChildMs: 10000, ordinaryChildMs: 10000, reviewHarnessMs: 300000, companionHarnessMs: 240000,
      timeoutHarnessMs: 180000, conditionHarnessMs: 120000, guideHarnessMs: 150000, observerSuccessionMs: 60000, observerControlsMs: 20000,
      reviewAcceptanceFixtureMs: 30000, reviewAdverseFixtureMs: 12000, reviewChildResultHarnessMs: 60000 },
  },
  // Frozen implementation bytes; independent final-source judgment is separate.
  budget_sources: {
    "scripts/fixtures/local-canonical-companion-timeout-succession.mjs": "ff133a70fc8199161818849e077b8a2397afdf411c5febf7c493049810b3e480",
    "scripts/fixtures/local-canonical-condition-requalification.mjs": "70c23f2057161732f498422fa6b2d5b0bc612b6335ba16d5f6af6ac33c9f4d16",
    "scripts/fixtures/local-canonical-guide-correction.mjs": "0749a470f013ec49fe7f8b9de553aa2bf8beca5c7ad5e46d909c59bb6007973a",
    "scripts/fixtures/local-canonical-observer-succession.mjs": "21f05000d21eebba2789a3a3e7273bf4efb4aebde487300de7e47307898ef1ca",
    "scripts/fixtures/local-canonical-timeout-succession.mjs": "b5e563692e12a26ca109c467544e29fdd8e7e6e7861ac697f2b4d19b565f7a2e",
    "scripts/local-canonical-closeout-budgets.mjs": "db89fe5f1ff526f4976f8d5e354044eab81b10039d84ddba144924f08f7b1bb4",
    "scripts/local-canonical-companion-timeout-succession.mjs": "93a1c3abe37dcb987fe23732719a5b0e2890013b190da6d99196905da2f3fe20",
    "scripts/run-canonical-test-suite.mjs": "6c23acf9e74861d6f9c74b30748afad68c963140bd7484098b6eb84f5ed67292",
    "scripts/test-local-canonical-review-child-result.mjs": "c077da5c6ff050a70a469738af06dcb81a7e92860eb7984188e490496b30ca77",
    "scripts/test-local-canonical-review-corrections.mjs": "a0b8e8309236991263c409f90e15d0bdcb361690e10ade4663e17c32c88d24e8",
  },
});
// END CLOSEOUT AUXILIARY BUDGET AMENDMENT
for (const value of Object.values(CLOSEOUT_AUXILIARY_BUDGET_AMENDMENT)) if (value && typeof value === "object") Object.freeze(value);
for (const value of Object.values(CLOSEOUT_AUXILIARY_BUDGET_AMENDMENT.execution_budgets)) Object.freeze(value);
const auxiliaryAmendment = p => p?.scope_amendment?.comment_id === CLOSEOUT_AUXILIARY_BUDGET_AMENDMENT.comment_id;
const amendmentAuthority = p => auxiliaryAmendment(p) ? CLOSEOUT_AUXILIARY_BUDGET_AMENDMENT : CLOSEOUT_SCOPE_AMENDMENT;
const amendedEvidence = new Map();
const AMENDMENT_PATHS = new Set([...SCOPE_CORRECTION_POLICY_PATHS, "scripts/local-canonical-closeout-budgets.mjs", "scripts/run-canonical-test-suite.mjs"]);
const AMENDMENT_SOURCE_PATHS = [...AMENDMENT_PATHS].sort();
const AUXILIARY_BUDGET_SOURCE_PATHS = ["scripts/local-canonical-closeout-budgets.mjs", "scripts/test-local-canonical-review-corrections.mjs",
  "scripts/test-local-canonical-review-child-result.mjs", "scripts/run-canonical-test-suite.mjs", "scripts/fixtures/local-canonical-timeout-succession.mjs",
  "scripts/fixtures/local-canonical-condition-requalification.mjs", "scripts/fixtures/local-canonical-guide-correction.mjs", "scripts/fixtures/local-canonical-observer-succession.mjs",
  "scripts/local-canonical-companion-timeout-succession.mjs", "scripts/fixtures/local-canonical-companion-timeout-succession.mjs"].sort();
const AUXILIARY_AMENDMENT_PATHS = new Set([...AUXILIARY_BUDGET_SOURCE_PATHS, "scripts/local-canonical-1559-closeout.mjs", ".github/LOCAL_CANONICAL_VERIFICATION.md"]);

export const hasCloseoutScopeAmendment = p => isCloseoutScopeFixtureCorrection(p) && Object.hasOwn(p, "scope_amendment");
const amendmentDeclaration = (a = CLOSEOUT_SCOPE_AMENDMENT) => Object.fromEntries(["comment_id", "observation_sha256", "basis"].map(key => [key, a[key]]));
export function inspectCloseoutAmendedSourceScope(repositoryRoot, { base, head, source_revision_predecessor = null, scope_amendment = null }) {
  const packet = { scope_amendment }, a = amendmentAuthority(packet), { scope } = inspectSourceScope(repositoryRoot, { base, head }, a.accepted_base, source_revision_predecessor ?? a.prior_head, [], auxiliaryAmendment(packet) ? AUXILIARY_AMENDMENT_PATHS : source_revision_predecessor ? AMENDED_REVISION_PATHS : AMENDMENT_PATHS);
  return { ...scope, schema: "augnes.local-canonical-closeout-scope-fixture-source.v1", basis: "authorized_scope_amendment" };
}
export function validateCloseoutAmendedSourceScope(scope, revision = null, scope_amendment = null) {
  if (auxiliaryAmendment({ scope_amendment })) return validateAuxiliaryAmendmentScope(scope);
  if (revision) return validateAmendedRevisionScope(scope, revision);
  const a = CLOSEOUT_SCOPE_AMENDMENT;
  if (scope?.schema !== "augnes.local-canonical-closeout-scope-fixture-source.v1" || scope.basis !== "authorized_scope_amendment" || scope.accepted_base !== a.accepted_base || scope.accepted_head !== a.prior_head || !commit(scope.current_main)) fail("closeout_amendment_source_invalid");
  if (!exact(Object.keys(a.budget_sources).sort(), ["scripts/fixtures/local-canonical-1559-closeout.mjs", "scripts/local-canonical-closeout-budgets.mjs", "scripts/run-canonical-test-suite.mjs", "scripts/run-local-canonical-verification.mjs", "scripts/test-local-canonical-executor.mjs", "scripts/test-local-canonical-receipt.mjs", "scripts/test-local-canonical-review-corrections.mjs"]) || Object.values(a.budget_sources).some(hash => !sha(hash))) fail("closeout_amendment_budget_source_changed");
  validateRetainedSourceScope(scope, 33, AMENDMENT_PATHS);
  if (scope.candidate_policy.some(row => row.candidate.present !== true) || Object.entries(a.budget_sources).some(([name, hash]) =>
    scope.candidate_policy.find(row => row.path === name)?.candidate.sha256 !== hash)) fail("closeout_amendment_budget_source_changed");
  return scope;
}
function auxiliaryValidationEntries() {
  const { closeout: c, auxiliary: a } = CLOSEOUT_AUXILIARY_BUDGET_AMENDMENT.execution_budgets, review = "scripts/test-local-canonical-review-corrections.mjs";
  return { executor: ["scripts/test-local-canonical-executor.mjs", c.executorHarnessMs], receipt: ["scripts/test-local-canonical-receipt.mjs", c.receiptHarnessMs],
    review: [review, a.reviewHarnessMs], "corrected-timeout": [review, a.timeoutHarnessMs, "--corrected-timeout-controls"],
    "condition-requalification": [review, a.conditionHarnessMs, "--condition-requalification-controls"], "guide-correction": [review, a.guideHarnessMs, "--guide-correction-controls"],
    "companion-timeout": [review, a.companionHarnessMs, "--companion-timeout-controls"], "review-child-result": ["scripts/test-local-canonical-review-child-result.mjs", a.reviewChildResultHarnessMs] };
}
function validateAuxiliaryAmendmentScope(scope) {
  const a = CLOSEOUT_AUXILIARY_BUDGET_AMENDMENT;
  if (scope?.schema !== "augnes.local-canonical-closeout-scope-fixture-source.v1" || scope.basis !== "authorized_scope_amendment" || scope.accepted_base !== a.accepted_base || scope.accepted_head !== a.prior_head || !commit(scope.current_main)) fail("closeout_amendment_source_invalid");
  if (!exact(Object.keys(a.budget_sources).sort(), AUXILIARY_BUDGET_SOURCE_PATHS) || Object.values(a.budget_sources).some(hash => !sha(hash))) fail("closeout_amendment_budget_source_changed");
  validateRetainedSourceScope(scope, 34, AUXILIARY_AMENDMENT_PATHS);
  if (scope.candidate_policy.some(row => row.candidate.present !== true) || Object.entries(a.budget_sources).some(([name, hash]) =>
    scope.candidate_policy.find(row => row.path === name)?.candidate.sha256 !== hash)) fail("closeout_amendment_budget_source_changed");
  return scope;
}
function validateAuxiliaryAmendmentOriginal(old, p) {
  const r = old.receipt, prior = old.attempt, authority = r.phases?.find(x => x.id === "authority"), lines = old.authority_log.toString().split("\n"), outer = lines.filter(x => x.startsWith("[canonical:authority] child_result "));
  const label = "prospective Companion readiness timeout succession and terminal allowance", start = `[canonical:authority] child_start label="${label}" timeout_ms=30000`, offset = lines.lastIndexOf(start);
  const nested = lines.slice(offset + 1).filter(x => x.startsWith("AUGNES_REVIEW_CHILD_RESULT ")).map(x => JSON.parse(x.slice("AUGNES_REVIEW_CHILD_RESULT ".length)));
  if (prior.branch !== p.branch || r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" || r.repository.detached !== false ||
    r.outcome.safety !== "preserved_within_observed_scope" || r.outcome.first_fault !== null || r.inputs?.first_fault !== null || r.inputs.secondary_faults?.length !== 0 ||
    r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true || r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 ||
    old.completion.contract !== "augnes.local-canonical-attempt-family.v1" || old.completion.attempt_id !== prior.attempt_id || old.edge.contract !== "augnes.local-canonical-successor.v2" ||
    !exact(r.phases?.map(x => x.id), BROWSER_REPLACEMENT_PHASES) || !exact(r.phases.map(x => x.status), [...Array(6).fill("pass"), "failure", ...Array(9).fill("not_run")]) ||
    r.phases.slice(0, 6).some(x => x.exit_status !== 0 || x.timed_out !== false || x.spawn_error_code !== null || x.cleanup?.termination_reason !== "natural_exit" || x.cleanup.completed !== true || x.cleanup.exit_observed !== true || x.cleanup.streams_closed !== true || x.cleanup.remaining_owned_processes !== 0) ||
    authority?.exit_status !== 1 || authority.timed_out !== false || authority.spawn_error_code !== null || authority.cleanup?.termination_reason !== "natural_exit" || authority.cleanup.completed !== true || authority.cleanup.exit_observed !== true || authority.cleanup.streams_closed !== true || authority.cleanup.remaining_owned_processes !== 0 ||
    authority.log?.truncated !== false || authority.log.bytes !== old.authority_log.length || outer.length !== 19 || outer.slice(0, -1).some(x => !/ exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u.test(x)) ||
    outer.at(-1) !== `[canonical:authority] child_result label="${label}" duration_ms=11231 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit` ||
    offset < 0 || lines.filter(x => x.startsWith("[canonical:authority] child_start ")).at(-1) !== start || !exact(nested.map(x => x.control_id), ["companion-timeout-evidence", "companion-timeout-witnesses", "companion-timeout-source"]) ||
    nested.some((x, i) => x.exit_code !== (i === 2 ? null : 0) || x.signal !== (i === 2 ? "SIGTERM" : null) || x.timed_out !== (i === 2) || x.cancelled !== false || x.spawn_error_code !== null || x.termination_reason !== (i === 2 ? "bounded_timeout" : "natural_exit") || x.exit_observed !== true || x.streams_closed !== true || x.cleanup_started !== true || x.cleanup_completed !== true || x.remaining_owned_processes !== 0) ||
    nested[2].duration_ms !== 6075) fail("closeout_amendment_original_binding_invalid");
}
function semanticAmendedProof(p) {
  if (Object.hasOwn(p?.correction ?? {}, "source_revision")) return semanticAmendedRevision(p);
  const a = amendmentAuthority(p);
  return hasCloseoutScopeAmendment(p) && exact(p.scope_amendment, amendmentDeclaration(a)) && p.pull_request === CLOSEOUT_PINS.pull_request && p.branch === CLOSEOUT_PINS.branch &&
    [p.base, p.head, p.tree].every(commit) && p.head !== a.prior_head && p.tree !== a.prior_tree && p.prior_family_id === a.prior_family_id && p.prior_attempt_id === a.prior_attempt_id && p.prior_number === 1 &&
    p.prior_receipt_fingerprint === a.prior_receipt_fingerprint && exact(p.budget, BUDGET) && p.predecessor_proof?.sha256 === a.predecessor_proof &&
    keys(p.originals, Object.keys(a.originals)) && Object.entries(a.originals).every(([name, hash]) => p.originals[name]?.sha256 === hash) &&
    keys(p.correction, ["execution_budgets", "validation"]) && exact(p.correction.execution_budgets, a.execution_budgets) && sha(p.correction.validation?.sha256) && sha(p.final_source?.sha256) &&
    p.source_scope?.accepted_head === a.prior_head && p.source_scope.current_main === p.base &&
    keys(p.authorization, ["scope_comment_id", "scope_sha256", "amendment_comment_id", "amendment_sha256"]) && p.authorization.amendment_comment_id === a.comment_id && p.authorization.amendment_sha256 === a.observation_sha256;
}
// This predicate does not issue authority or reserve anything. It identifies the
// only transition for which the normal owner may authenticate this amendment.
export function matchesCloseoutAmendmentPredecessor(p, prior, completion = null) {
  if (Object.hasOwn(p?.correction ?? {}, "source_revision")) return semanticAmendedRevision(p) && prior?.family_id === p.prior_family_id && prior.number === 1 && prior.attempt_id === p.prior_attempt_id &&
    (!completion || (completion.attempt_id === prior.attempt_id && completion.receipt_fingerprint === p.prior_receipt_fingerprint && completion.disposition === "product_failure" && completion.cleanup_complete === true && validTime(completion.finished_at)));
  const a = amendmentAuthority(p);
  return semanticAmendedProof(p) && prior?.family_id === a.prior_family_id && prior.number === 1 && prior.attempt_id === a.prior_attempt_id &&
    (!completion || (completion.receipt_fingerprint === a.prior_receipt_fingerprint && completion.finished_at === a.completed_at && completion.disposition === "product_failure" && completion.cleanup_complete === true));
}
function readAmendedValidation(folder, p, repositoryRoot) {
  const value = json(closeoutArtifact(folder, p.correction.validation)), git = gitAt(repositoryRoot), a = amendmentAuthority(p), hierarchy = auxiliaryAmendment(p);
  const entries = hierarchy ? auxiliaryValidationEntries() : { executor: ["scripts/test-local-canonical-executor.mjs", a.execution_budgets.executorHarnessMs], receipt: ["scripts/test-local-canonical-receipt.mjs", a.execution_budgets.receiptHarnessMs], review: ["scripts/test-local-canonical-review-corrections.mjs", a.execution_budgets.reviewHarnessMs] };
  if (!keys(value, ["nondeciding", "basis", "records"]) || value.nondeciding !== true || value.basis !== "bounded_parent_controls" || !Array.isArray(value.records) ||
    !exact(value.records.map(row => row.name).sort(), Object.keys(entries).sort())) fail("closeout_amendment_validation_invalid");
  const hashes = new Map((hierarchy ? [...AUXILIARY_AMENDMENT_PATHS].sort() : AMENDMENT_SOURCE_PATHS).map(name => [name, digest(git(["show", `${p.head}:${name}`]))]));
  for (const row of value.records) {
    if (!keys(row, ["name", "source_command", "output", "settlement"])) fail("closeout_amendment_validation_invalid");
    const command = json(closeoutArtifact(folder, row.source_command)), settled = json(closeoutArtifact(folder, row.settlement)), output = closeoutArtifact(folder, row.output), [entry, budget, ...flags] = entries[row.name], r = settled.result;
    const entryIndex = hierarchy ? 3 : 1;
    if (command.nondeciding !== true || command.require_natural_exit !== true || command.timeout_ms !== budget || !Array.isArray(command.command) || command.command.length !== entryIndex + 1 + flags.length || !exact(command.command.slice(entryIndex + 1), flags) ||
      (hierarchy && (command.command[1] !== "--import" || command.command[2] !== "tsx")) ||
      typeof command.command[entryIndex] !== "string" || (!command.command[entryIndex].endsWith(`/${entry}`) && command.command[entryIndex] !== entry) || !Array.isArray(command.sources) || new Set(command.sources.map(source => source.path)).size !== command.sources.length ||
      [...hashes].some(([name, hash]) => command.sources.filter(source => source.path === name && source.sha256 === hash).length !== 1) ||
      settled.nondeciding !== true || settled.failure !== null || settled.root_absent !== true || !Array.isArray(settled.cleanup) || !settled.cleanup.length || settled.cleanup.some(x => x.completed !== true || x.failure_count !== 0) ||
      settled.started_at !== command.started_at || settled.source_after?.head_unchanged !== true || !exact(settled.source_after.changed_paths, []) ||
      !validTime(command.started_at) || Date.parse(command.started_at) < Date.parse(a.scope.timestamp) || !validTime(settled.finished_at) || Date.parse(settled.finished_at) <= Date.parse(command.started_at) ||
      r?.exit_code !== 0 || r.signal !== null || r.timed_out !== false || r.cancelled !== false || r.spawn_error_code !== null || r.termination_reason !== "natural_exit" ||
      r.exit_observed !== true || r.streams_closed !== true || r.cleanup_completed !== true || r.remaining_owned_processes !== 0 || !Number.isFinite(r.duration_ms) || r.duration_ms >= budget || !output.length) fail("closeout_amendment_focused_controls_invalid");
  }
  return { validation: p.correction.validation.sha256, original_blocked_operation: "UNKNOWN", historical_timeout_cause: "UNKNOWN" };
}
export function readCloseoutAmendedEvidence(file, p, repositoryRoot) {
  if (Object.hasOwn(p?.correction ?? {}, "source_revision")) return readAmendedSourceRevision(file, p, repositoryRoot);
  if (!keys(normalizedProof(p), ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "predecessor_proof", "correction", "source_scope", "final_source", "authorization", "budget", "scope_amendment"]) || !semanticAmendedProof(p)) fail("closeout_amendment_proof_invalid");
  const folder = path.dirname(file), a = amendmentAuthority(p), hierarchy = auxiliaryAmendment(p);
  for (const ref of [p.predecessor_proof, ...Object.values(p.originals), p.correction.validation, p.final_source]) closeoutArtifact(folder, ref);
  validateCloseoutAmendedSourceScope(p.source_scope, null, p.scope_amendment);
  const old = Object.fromEntries(Object.keys(a.originals).map(name => { const bytes = closeoutArtifact(folder, p.originals[name]); return [name, name.endsWith("log") ? bytes : json(bytes)]; })), r = old.receipt, prior = old.attempt, completion = old.completion, copy = { ...r }; delete copy.integrity;
  const predecessor = json(closeoutArtifact(folder, p.predecessor_proof));
  if (!matchesCloseoutAmendmentPredecessor(p, prior, completion) || r.integrity?.content_fingerprint !== p.prior_receipt_fingerprint || digest(copy) !== p.prior_receipt_fingerprint || !exact(r.attempt, prior) ||
    prior.head !== a.prior_head || prior.tree !== a.prior_tree || (hierarchy ? !validAmendedCloseoutAttempt(prior) || !Object.hasOwn(predecessor, "scope_amendment") : !validCloseoutScopeFixtureCorrectionAttempt(prior) || Object.hasOwn(predecessor, "scope_amendment")) || !exact(normalizedProof(prior.source_correction), normalizedProof(predecessor)) ||
    r.outcome?.disposition !== "product_failure" || r.cleanup?.completed !== true || r.repository?.head_sha !== a.prior_head || r.repository.tree_sha !== a.prior_tree ||
    r.repository.repository_id !== "hynk-studio/augnes" || r.repository.origin !== "https://github.com/hynk-studio/augnes.git" || r.repository.branch !== p.branch || completion.infrastructure_code !== null ||
    !exact(prior.closeout_instruction_input, closeoutInstructionInputBinding(predecessor, r.inputs)) ||
    old.edge.kind !== predecessor.kind || old.edge.family_id !== prior.family_id || old.edge.head !== prior.head || old.edge.tree !== prior.tree || old.edge.proof_fingerprint !== digest(prior.source_correction) ||
    old.stock.content_fingerprint !== p.prior_receipt_fingerprint || old.stock.valid_deciding_evidence !== false || old.stock.issues?.length !== 14) fail("closeout_amendment_original_binding_invalid");
  if (hierarchy) {
    validateAuxiliaryAmendmentOriginal(old, p);
    readCloseoutAmendedEvidence(path.join(folder, p.predecessor_proof.artifact), predecessor, repositoryRoot);
  } else readCloseoutScopeFixtureCorrectionEvidence(path.join(folder, p.predecessor_proof.artifact), predecessor, repositoryRoot);
  const git = gitAt(repositoryRoot), source = json(closeoutArtifact(folder, p.final_source));
  if (!keys(source, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "deltas"]) || source.schema !== "augnes.local-canonical-closeout-scope-fixture-final-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
    source.base !== p.base || source.head !== p.head || source.tree !== p.tree || source.predecessor_head !== a.prior_head || source.predecessor_tree !== a.prior_tree || !keys(source.deltas, ["predecessor", "first_closeout", "main"]) || git(["rev-parse", `${p.head}^{tree}`]).toString().trim() !== p.tree) fail("closeout_amendment_final_source_invalid");
  for (const [name, base] of [["predecessor", a.prior_head], ["first_closeout", CLOSEOUT_CONTINUATION_PINS.prior_head], ["main", p.base]]) {
    const bytes = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", base, p.head, "--"]), paths = git(["diff", "--no-renames", "--name-only", "-z", base, p.head, "--"]).toString().split("\0").filter(Boolean).sort();
    if (!exact(source.deltas[name], { sha256: digest(bytes), bytes: bytes.length, changed_paths: paths })) fail("closeout_amendment_native_delta_invalid");
  }
  const scope = inspectCloseoutAmendedSourceScope(repositoryRoot, p); validateCloseoutAmendedSourceScope(scope, null, p.scope_amendment);
  if (!exact(scope, p.source_scope)) fail("closeout_amendment_source_scope_mismatch");
  const evidence = readAmendedValidation(folder, p, repositoryRoot); if (hierarchy) evidence.completed_at = completion.finished_at; amendedEvidence.set(digest(normalizedProof(p)), evidence);
  return { original: r, prior, completion, source, evidence };
}
// The same authenticated amendment explicitly permits a substantive correction
// with focused evidence. Reuse ordinary v2 evidence, never a new failure profile
// or retry allowance. The only additional source relation here removes the
// demonstrated default-review output passthrough; all execution bounds remain.
const AMENDED_REVISION_MODULE = "scripts/test-local-canonical-review-corrections.mjs";
const AMENDED_REVISION_PATHS = new Set([AMENDED_REVISION_MODULE, "scripts/local-canonical-1559-closeout.mjs", "scripts/local-canonical-attempts.mjs", "scripts/local-canonical-review-export.mjs", ".github/LOCAL_CANONICAL_VERIFICATION.md"]);
function semanticAmendedRevision(p) {
  const a = CLOSEOUT_SCOPE_AMENDMENT, revision = p?.correction?.source_revision;
  return hasCloseoutScopeAmendment(p) && exact(p.scope_amendment, amendmentDeclaration()) && p.pull_request === CLOSEOUT_PINS.pull_request && p.branch === CLOSEOUT_PINS.branch &&
    [p.base, p.head, p.tree].every(commit) && sha(p.prior_family_id) && typeof p.prior_attempt_id === "string" && p.prior_number === 1 && sha(p.prior_receipt_fingerprint) &&
    p.prior_family_id !== a.prior_family_id && p.head !== p.source_scope?.accepted_head && exact(p.budget, BUDGET) && sha(p.predecessor_proof?.sha256) &&
    keys(p.originals, Object.keys(a.originals)) && Object.values(p.originals).every(ref => sha(ref?.sha256)) &&
    keys(p.correction, ["execution_budgets", "validation", "source_revision"]) && exact(p.correction.execution_budgets, a.execution_budgets) && sha(p.correction.validation?.sha256) && sha(p.final_source?.sha256) &&
    keys(revision, ["proof", "source_module", "before_sha256", "after_sha256"]) && sha(revision.proof?.sha256) && revision.source_module === AMENDED_REVISION_MODULE &&
    revision.before_sha256 === a.budget_sources[AMENDED_REVISION_MODULE] && revision.after_sha256 === "ca74f410c8c46f75efca8c1aa1eb06e10b5857421c742a46e306ec8ed7274bdb" &&
    commit(p.source_scope?.accepted_head) && p.source_scope.current_main === p.base &&
    keys(p.authorization, ["scope_comment_id", "scope_sha256", "amendment_comment_id", "amendment_sha256"]) && p.authorization.amendment_comment_id === a.comment_id && p.authorization.amendment_sha256 === a.observation_sha256;
}
function validateAmendedRevisionScope(scope, revision) {
  const a = CLOSEOUT_SCOPE_AMENDMENT;
  if (scope?.schema !== "augnes.local-canonical-closeout-scope-fixture-source.v1" || scope.basis !== "authorized_scope_amendment" || scope.accepted_base !== a.accepted_base || !commit(scope.accepted_head) || !commit(scope.current_main)) fail("closeout_amendment_source_invalid");
  validateRetainedSourceScope(scope, 34, AMENDED_REVISION_PATHS);
  if (scope.candidate_policy.some(row => row.candidate.present !== true) || Object.entries(a.budget_sources).some(([name, hash]) => {
    const row = scope.accepted_task.find(item => item.path === name);
    return row?.accepted.sha256 !== hash || row.candidate.sha256 !== (name === revision.source_module ? revision.after_sha256 : hash);
  })) fail("closeout_amendment_budget_source_changed");
  return scope;
}
function readAmendedSourceRevision(file, p, repositoryRoot) {
  if (!keys(normalizedProof(p), ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "predecessor_proof", "correction", "source_scope", "final_source", "authorization", "budget", "scope_amendment"]) || !semanticAmendedRevision(p)) fail("closeout_amendment_proof_invalid");
  const folder = path.dirname(file), revision = p.correction.source_revision;
  for (const ref of [p.predecessor_proof, ...Object.values(p.originals), p.correction.validation, revision.proof, p.final_source]) closeoutArtifact(folder, ref);
  validateAmendedRevisionScope(p.source_scope, revision);
  const old = Object.fromEntries(Object.keys(p.originals).map(name => { const bytes = closeoutArtifact(folder, p.originals[name]); return [name, name.endsWith("log") ? bytes : json(bytes)]; }));
  const r = old.receipt, prior = old.attempt, completion = old.completion, copy = { ...r }; delete copy.integrity;
  const predecessor = json(closeoutArtifact(folder, p.predecessor_proof));
  if (!matchesCloseoutAmendmentPredecessor(p, prior, completion) || !validAmendedCloseoutAttempt(prior) || !hasCloseoutScopeAmendment(predecessor) || !exact(normalizedProof(prior.source_correction), normalizedProof(predecessor)) ||
    prior.head !== p.source_scope.accepted_head || prior.head === p.head || prior.tree === p.tree || prior.branch !== p.branch || completion.infrastructure_code !== null ||
    r.integrity?.content_fingerprint !== p.prior_receipt_fingerprint || digest(copy) !== p.prior_receipt_fingerprint || !exact(r.attempt, prior) ||
    r.repository?.repository_id !== "hynk-studio/augnes" || r.repository.origin !== "https://github.com/hynk-studio/augnes.git" || r.repository.branch !== p.branch || r.repository.head_sha !== prior.head || r.repository.tree_sha !== prior.tree ||
    r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" || r.repository.detached !== false ||
    r.outcome?.disposition !== "product_failure" || r.outcome.safety !== "preserved_within_observed_scope" || r.outcome.first_fault !== null || r.inputs?.first_fault !== null || r.inputs.secondary_faults?.length !== 0 ||
    r.cleanup?.completed !== true || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true || r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 ||
    !exact(prior.closeout_instruction_input, closeoutInstructionInputBinding(predecessor, r.inputs)) ||
    old.edge.contract !== "augnes.local-canonical-successor.v2" || old.edge.kind !== predecessor.kind || old.edge.family_id !== prior.family_id || old.edge.head !== prior.head || old.edge.tree !== prior.tree || old.edge.proof_fingerprint !== digest(prior.source_correction) ||
    !exact(r.phases?.map(x => x.id), BROWSER_REPLACEMENT_PHASES) || !exact(r.phases.map(x => x.status), [...Array(6).fill("pass"), "failure", ...Array(9).fill("not_run")]) ||
    old.stock.content_fingerprint !== p.prior_receipt_fingerprint || old.stock.valid_deciding_evidence !== false || old.stock.issues?.length !== 14) fail("closeout_amendment_original_binding_invalid");
  const authority = r.phases.find(x => x.id === "authority"), lines = old.authority_log.toString().split("\n"), outer = lines.filter(x => x.startsWith("[canonical:authority] child_result "));
  const label = "review child natural completion, bounded diagnostics and intentional cancellation controls", start = `[canonical:authority] child_start label="${label}" timeout_ms=30000`, offset = lines.lastIndexOf(start);
  const nested = lines.slice(offset + 1).filter(x => x.startsWith("AUGNES_REVIEW_CHILD_RESULT ")).map(x => JSON.parse(x.slice("AUGNES_REVIEW_CHILD_RESULT ".length)));
  if (authority.exit_status !== 1 || authority.timed_out !== false || authority.spawn_error_code !== null || authority.cleanup?.termination_reason !== "natural_exit" || authority.cleanup.completed !== true || authority.cleanup.exit_observed !== true || authority.cleanup.streams_closed !== true || authority.cleanup.remaining_owned_processes !== 0 ||
    authority.log?.truncated !== false || authority.log.bytes !== old.authority_log.length || outer.length !== 14 || outer.slice(0, -1).some(x => !/ exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u.test(x)) ||
    !new RegExp(`^\\[canonical:authority\\] child_result label="${label}" duration_ms=\\d+ exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$`, "u").test(outer.at(-1)) ||
    r.phases.slice(0, 6).some(x => x.exit_status !== 0 || x.timed_out !== false || x.spawn_error_code !== null || x.cleanup?.termination_reason !== "natural_exit" || x.cleanup.completed !== true || x.cleanup.exit_observed !== true || x.cleanup.streams_closed !== true || x.cleanup.remaining_owned_processes !== 0) ||
    offset < 0 || lines.filter(x => x.startsWith("[canonical:authority] child_start ")).at(-1) !== start || nested.length !== 1 || nested[0].control_id !== "review-child-acceptance" ||
    nested[0].exit_code !== 1 || nested[0].signal !== null || nested[0].timed_out !== false || nested[0].cancelled !== false || nested[0].spawn_error_code !== null || nested[0].termination_reason !== "natural_exit" || nested[0].exit_observed !== true || nested[0].streams_closed !== true || nested[0].cleanup_started !== true || nested[0].cleanup_completed !== true || nested[0].remaining_owned_processes !== 0) fail("closeout_amendment_natural_failure_required");
  readCloseoutAmendedEvidence(path.join(folder, p.predecessor_proof.artifact), predecessor, repositoryRoot);
  const ordinaryFile = path.join(folder, revision.proof.artifact), declared = json(closeoutArtifact(folder, revision.proof));
  if (declared.schema !== "augnes.local-canonical-source-correction.v2" || declared.kind !== "source_revision" || hasCloseoutMarker({ source_correction: declared }) ||
    ["browser_input_path", "browser_input_sha256", "input_replacement_consumed", "authorization"].some(key => Object.hasOwn(declared, key))) fail("closeout_amendment_source_revision_invalid");
  const ordinary = readSourceCorrectionProof(ordinaryFile, repositoryRoot), review = json(closeoutArtifact(folder, ordinary.review));
  if (["branch", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint"].some(key => ordinary[key] !== p[key]) || ordinary.source_module !== revision.source_module || ordinary.before.source_sha256 !== revision.before_sha256 || ordinary.after.source_sha256 !== revision.after_sha256 ||
    review.authority_reference !== `https://github.com/hynk-studio/augnes/pull/1560#issuecomment-${CLOSEOUT_SCOPE_AMENDMENT.comment_id}` || review.review_basis !== "implementation_owner_not_independent_review") fail("closeout_amendment_source_revision_invalid");
  validateSourceCorrectionBinding({ repositoryRoot, branch: p.branch, head: p.head, tree: p.tree, proof: ordinary, prior, completion, acceptedMain: p.base });
  const git = gitAt(repositoryRoot), before = git(["show", `${prior.head}:${revision.source_module}`]).toString(), after = git(["show", `${p.head}:${revision.source_module}`]).toString();
  const passthrough = '      { controlId: `closeout-1559-${group}`, timeoutMs: CLOSEOUT_EXECUTION_BUDGETS.groupMs, stdout: process.stdout, stderr: process.stderr });';
  if (before.split(passthrough).length !== 2 || after !== before.replace(passthrough, passthrough.replace(", stdout: process.stdout, stderr: process.stderr", ""))) fail("closeout_amendment_correction_scope_invalid");
  const parent = "scripts/test-local-canonical-review-child-result.mjs", retainedPaths = [parent, "scripts/fixtures/local-canonical-review-child-acceptance.mjs", "scripts/fixtures/local-canonical-review-child-adverse.mjs", "scripts/fixtures/local-canonical-review-child-result.mjs", "scripts/canonical-child-runner.mjs", "scripts/canonical-test-environment.mjs", "scripts/local-canonical-browser-identity.mjs", "scripts/local-canonical-closeout-budgets.mjs"];
  const retained = retainedPaths.map(name => { const bytes = git(["show", `${prior.head}:${name}`]); if (!bytes.equals(git(["show", `${p.head}:${name}`]))) fail("closeout_amendment_witness_owner_changed"); return { path: name, sha256: digest(bytes), bytes: bytes.length }; });
  const witnesses = ["before", "after"].map(name => json(closeoutArtifact(folder, artifactRef(ordinary[name]))));
  if (ordinary.fixture_sha256 !== "a70d0a89aa32a07b2c807d9e6f6cf839928b5f42631b4d6d366b3bc874305135" || !exact(witnesses[0].command, witnesses[1].command) || witnesses[0].cwd !== witnesses[1].cwd ||
    Date.parse(review.reviewed_at) < Date.parse(witnesses[1].finished_at)) fail("closeout_amendment_complete_witness_required");
  for (const [index, witness] of witnesses.entries()) {
    const output = closeoutArtifact(folder, artifactRef(witness.output)), rows = output.toString().split("\n").filter(x => x.startsWith("AUGNES_REVIEW_CHILD_RESULT ")).map(x => JSON.parse(x.slice("AUGNES_REVIEW_CHILD_RESULT ".length)));
    if (witness.source_head !== (index ? p.head : prior.head) || witness.source_tree !== (index ? p.tree : prior.tree) || witness.source_module !== revision.source_module || witness.parent_entry !== parent || witness.parent_sha256 !== retained[0].sha256 || !exact(witness.retained_sources, retained) ||
      witness.source_unchanged !== true || witness.timeout_ms !== 30000 || witness.require_natural_exit !== true || witness.expected_exit_code !== (index ? 0 : 1) ||
      !Array.isArray(witness.command) || witness.command.length !== 3 || !witness.command[1].endsWith(`/${ordinary.fixture_artifact}`) || witness.command[2] !== witness.cwd ||
      !validTime(witness.started_at) || Date.parse(witness.started_at) <= Date.parse(completion.finished_at) || Date.parse(witness.started_at) < Date.parse(git(["show", "-s", "--format=%cI", p.head]).toString().trim()) || Date.parse(witness.finished_at) <= Date.parse(witness.started_at) ||
      witness.result.signal !== null || witness.result.spawn_error_code !== null || witness.result.cleanup_started !== true || !Number.isFinite(witness.result.duration_ms) || witness.result.duration_ms >= 30000 || witness.output.bytes !== output.length ||
      !exact(rows.map(row => row.control_id), index ? ["review-child-acceptance", "review-child-adverse"] : ["review-child-acceptance"]) ||
      rows.some(row => row.exit_code !== (index ? 0 : 1) || row.signal !== null || row.timed_out !== false || row.cancelled !== false || row.spawn_error_code !== null || row.termination_reason !== "natural_exit" || row.exit_observed !== true || row.streams_closed !== true || row.cleanup_started !== true || row.cleanup_completed !== true || row.remaining_owned_processes !== 0) ||
      (index && !output.toString().split("\n").includes(JSON.stringify({ status: "pass", checks: ["review-child-acceptance", "review-child-adverse"], cleanup_complete: true })))) fail("closeout_amendment_complete_witness_required");
  }
  const source = json(closeoutArtifact(folder, p.final_source));
  if (!keys(source, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "deltas"]) || source.schema !== "augnes.local-canonical-closeout-scope-fixture-final-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
    source.base !== p.base || source.head !== p.head || source.tree !== p.tree || source.predecessor_head !== prior.head || source.predecessor_tree !== prior.tree || !keys(source.deltas, ["predecessor", "first_closeout", "main"])) fail("closeout_amendment_final_source_invalid");
  for (const [name, base] of [["predecessor", prior.head], ["first_closeout", CLOSEOUT_CONTINUATION_PINS.prior_head], ["main", p.base]]) {
    const bytes = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", base, p.head, "--"]), paths = git(["diff", "--no-renames", "--name-only", "-z", base, p.head, "--"]).toString().split("\0").filter(Boolean).sort();
    if (!exact(source.deltas[name], { sha256: digest(bytes), bytes: bytes.length, changed_paths: paths })) fail("closeout_amendment_native_delta_invalid");
  }
  const scope = inspectCloseoutAmendedSourceScope(repositoryRoot, { ...p, source_revision_predecessor: prior.head }); validateAmendedRevisionScope(scope, revision);
  if (!exact(scope, p.source_scope)) fail("closeout_amendment_source_scope_mismatch");
  const evidence = { ...readAmendedValidation(folder, p, repositoryRoot), completed_at: completion.finished_at, source_revision: revision.proof.sha256 };
  amendedEvidence.set(digest(normalizedProof(p)), evidence); return { original: r, prior, completion, source, evidence };
}
function validAmendmentObservations(p, observations) {
  const a = amendmentAuthority(p);
  return keys(observations, ["closeout_scope", "scope_amendment"]) && validContinuationObservation(p, observations.closeout_scope) &&
    exact(observations.scope_amendment, { ...a.scope, role: "closeout_scope", commit_id: null }) && digest(observations.scope_amendment) === p.authorization.amendment_sha256;
}
async function authorizeAmendedCloseout(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request), frozenInputs } = {}) {
  const evidence = amendedEvidence.get(digest(normalizedProof(p))), a = amendmentAuthority(p);
  if (!semanticAmendedProof(p) || !evidence) fail("closeout_amendment_authority_missing");
  const fingerprint = assertCloseoutInstructionInputs(p, frozenInputs, { requireUnfaulted: false }), original = await authorizeContinuingScope(p, evidence, transport);
  const supplemental = await authorizeContinuingScope({ ...p, authorization: { scope_comment_id: a.comment_id, scope_sha256: a.observation_sha256 } }, evidence, transport, a.scope);
  const capability = Object.freeze({ observations: { closeout_scope: original.observations.closeout_scope, scope_amendment: supplemental.observations.closeout_scope } });
  capabilities.set(capability, { proof: digest(p), observations: digest(capability.observations), evidence: digest(evidence), instruction_inputs: fingerprint }); return capability;
}
function assertAmendedCloseoutAuthorization(p, capability, completion, frozenInputs, { requireUnfaulted = true } = {}) {
  const state = capabilities.get(capability), evidence = amendedEvidence.get(digest(normalizedProof(p))), fingerprint = assertCloseoutInstructionInputs(p, frozenInputs, { requireUnfaulted });
  if (!state || !evidence || state.proof !== digest(p) || state.observations !== digest(capability.observations) || state.evidence !== digest(evidence) || state.instruction_inputs !== fingerprint ||
    completion?.finished_at !== (evidence.completed_at ?? amendmentAuthority(p).completed_at) || !validAmendmentObservations(p, capability.observations)) fail("closeout_amendment_authenticated_authority_required");
}
function validAmendedCloseoutAttempt(attempt) {
  try {
    const p = attempt?.source_correction;
    if (!semanticAmendedProof(p) || !validInstructionInputBinding(attempt) || attempt.number !== 1 || attempt.recovery || attempt.browser_replacement || !exact(attempt.budget, BUDGET) ||
      attempt.branch !== p.branch || attempt.head !== p.head || attempt.tree !== p.tree || !validAmendmentObservations(p, attempt.closeout_authority)) return false;
    validateCloseoutAmendedSourceScope(p.source_scope, p.correction.source_revision, p.scope_amendment); return true;
  } catch { return false; }
}

export function readCloseoutEvidence(file, p, repositoryRoot) {
  if (Object.hasOwn(p ?? {}, "scope_amendment")) return readCloseoutAmendedEvidence(file, p, repositoryRoot);
  if (isCloseout(p)) return readInitialCloseoutEvidence(file, p, repositoryRoot);
  if (isCloseoutContinuation(p)) return readCloseoutContinuationEvidence(file, p, repositoryRoot);
  if (isCloseoutScopeCorrection(p)) return readCloseoutScopeCorrectionEvidence(file, p, repositoryRoot);
  if (isCloseoutInstructionReplacement(p)) return readCloseoutInstructionEvidence(file, p, repositoryRoot);
  if (isCloseoutFixtureCorrection(p)) return readCloseoutFixtureCorrectionEvidence(file, p, repositoryRoot);
  if (isCloseoutCapabilityCorrection(p)) return readCloseoutCapabilityCorrectionEvidence(file, p, repositoryRoot);
  if (isCloseoutScopeFixtureCorrection(p)) return readCloseoutScopeFixtureCorrectionEvidence(file, p, repositoryRoot);
  fail("closeout_identity_invalid");
}
export async function authorizeCloseout(p, options) {
  if (Object.hasOwn(p ?? {}, "scope_amendment")) return authorizeAmendedCloseout(p, options);
  if (isCloseout(p)) return authorizeInitialCloseout(p, options);
  if (isCloseoutContinuation(p)) return authorizeCloseoutContinuation(p, options);
  if (isCloseoutScopeCorrection(p)) return authorizeCloseoutScopeCorrection(p, options);
  if (isCloseoutInstructionReplacement(p)) return authorizeCloseoutInstruction(p, options);
  if (isCloseoutFixtureCorrection(p)) return authorizeCloseoutFixtureCorrection(p, options);
  if (isCloseoutCapabilityCorrection(p)) return authorizeCloseoutCapabilityCorrection(p, options);
  if (isCloseoutScopeFixtureCorrection(p)) return authorizeCloseoutScopeFixtureCorrection(p, options);
  fail("closeout_identity_invalid");
}
// Rejection only: a proof reread cannot issue a capability or repair its bound
// identity. Valid requests still perform every fresh read and the full late
// authorization check. A request with both forged authority and changed disk
// evidence now reports the authority refusal first.
export function assertCloseoutIssuedCapability(p, capability) {
  const code = isCloseout(p) ? "closeout_authenticated_authority_required"
    : isCloseoutContinuation(p) ? "closeout_continuation_authenticated_authority_required"
    : isCloseoutScopeCorrection(p) ? "closeout_scope_correction_authenticated_authority_required"
    : isCloseoutInstructionReplacement(p) ? "closeout_instruction_authenticated_authority_required"
    : isCloseoutScopeFixtureCorrection(p) ? "closeout_scope_fixture_authenticated_authority_required"
    : isCloseoutCapabilityCorrection(p) ? "closeout_capability_authenticated_authority_required"
    : isCloseoutFixtureCorrection(p) ? "closeout_fixture_authenticated_authority_required" : null;
  if (!code) fail("closeout_identity_invalid");
  const state = capabilities.get(capability);
  if (!state || state.proof !== digest(p) || state.observations !== digest(capability.observations)) fail(code);
}
export function assertCloseoutAuthorization(p, capability, completion, frozenInputs, options) {
  if (Object.hasOwn(p ?? {}, "scope_amendment")) return assertAmendedCloseoutAuthorization(p, capability, completion, frozenInputs, options);
  if (isCloseout(p)) return assertInitialCloseoutAuthorization(p, capability, completion);
  if (isCloseoutContinuation(p)) return assertCloseoutContinuationAuthorization(p, capability, completion);
  if (isCloseoutScopeCorrection(p)) return assertCloseoutScopeCorrectionAuthorization(p, capability, completion);
  if (isCloseoutInstructionReplacement(p)) return assertCloseoutInstructionAuthorization(p, capability, completion, frozenInputs, options);
  if (isCloseoutFixtureCorrection(p)) return assertCloseoutFixtureCorrectionAuthorization(p, capability, completion, frozenInputs, options);
  if (isCloseoutCapabilityCorrection(p)) return assertCloseoutCapabilityCorrectionAuthorization(p, capability, completion, frozenInputs, options);
  if (isCloseoutScopeFixtureCorrection(p)) return assertCloseoutScopeFixtureCorrectionAuthorization(p, capability, completion, frozenInputs, options);
  fail("closeout_identity_invalid");
}
export function validCloseoutAttempt(attempt) {
  if (Object.hasOwn(attempt?.source_correction ?? {}, "scope_amendment")) return validAmendedCloseoutAttempt(attempt);
  if (Object.hasOwn(attempt ?? {}, "closeout_instruction_input") && !usesCloseoutInstructionInputs(attempt?.source_correction)) return false;
  if (isCloseout(attempt?.source_correction)) return validInitialCloseoutAttempt(attempt);
  if (isCloseoutContinuation(attempt?.source_correction)) return validCloseoutContinuationAttempt(attempt);
  if (isCloseoutScopeCorrection(attempt?.source_correction)) return validCloseoutScopeCorrectionAttempt(attempt);
  if (isCloseoutInstructionReplacement(attempt?.source_correction)) return validCloseoutInstructionAttempt(attempt);
  if (isCloseoutFixtureCorrection(attempt?.source_correction)) return validCloseoutFixtureCorrectionAttempt(attempt);
  if (isCloseoutCapabilityCorrection(attempt?.source_correction)) return validCloseoutCapabilityCorrectionAttempt(attempt);
  if (isCloseoutScopeFixtureCorrection(attempt?.source_correction)) return validCloseoutScopeFixtureCorrectionAttempt(attempt);
  return false;
}
