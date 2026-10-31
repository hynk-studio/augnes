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
  const acceptedBase = CLOSEOUT_PINS.accepted_base, repairHead = CLOSEOUT_PINS.repair_head;
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
  for (const [ref, names] of [[repairHead, acceptedPaths], [head, [...acceptedPaths, ...mainPaths, ...candidatePaths]], [base, mainPaths]])
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
  return { schema: "augnes.local-canonical-closeout-source-scope.v1", basis: "accepted_task_and_current_main_union",
    accepted_base: acceptedBase, accepted_head: repairHead, current_main: base, accepted_task_paths: acceptedPaths, candidate_delta_paths: candidatePaths,
    policy_delta_paths: candidatePaths.filter(name => POLICY_PATHS.has(name)),
    candidate_policy: candidatePaths.filter(name => POLICY_PATHS.has(name)).map(name => ({ path: name, candidate: state(head, name) })),
    accepted_task: acceptedPaths.map(name => ({ path: name, accepted: state(repairHead, name), candidate: state(head, name) })),
    main_reconciliation: mainPaths.map(name => ({ path: name, rule: POLICY_PATHS.has(name) ? "bounded_policy_owner" : accepted.has(name) ? "main_matches_accepted_task" : "preserve_accepted_main", accepted_main: state(base, name), candidate: state(head, name) })) };
}
export function validateCloseoutSourceScope(scope) {
  const accepted = new Map(scope.accepted_task.map(row => [row.path, row]));
  if (!exact([...accepted.keys()].sort(), scope.accepted_task_paths) || scope.accepted_task_paths.length !== 27 ||
    !exact(scope.policy_delta_paths, scope.candidate_delta_paths.filter(name => POLICY_PATHS.has(name))) ||
    !exact(scope.candidate_policy.map(row => row.path), scope.policy_delta_paths)) fail("closeout_accepted_inventory_invalid");
  for (const name of new Set([...scope.accepted_task_paths, ...scope.candidate_delta_paths])) {
    const row = accepted.get(name);
    if (POLICY_PATHS.has(name)) {
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

export function readCloseoutEvidence(file, p, repositoryRoot) {
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
export async function authorizeCloseout(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
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
export function assertCloseoutAuthorization(p, capability, completion) {
  const state = capabilities.get(capability);
  if (!state || state.proof !== digest(p) || state.observations !== digest(capability.observations) || completion?.finished_at !== CLOSEOUT_PINS.completed_at || Date.parse(capability.observations.closeout_scope.timestamp) <= Date.parse(completion.finished_at)) fail("closeout_authenticated_authority_required");
}
export function validCloseoutAttempt(attempt) {
  try {
    const p = attempt?.source_correction;
    if (!semanticProof(p) || attempt.number !== 1 || attempt.recovery || attempt.browser_replacement || !exact(attempt.budget, BUDGET) || attempt.branch !== p.branch || attempt.head !== p.head || attempt.tree !== p.tree ||
      !Array.isArray(p.repair.retained) || !exact(p.repair.retained.map(x => x.path).sort(), CLOSEOUT_RETAINED_PATHS) || p.repair.retained.some(x => !sha(x.sha256)) || !validObservation(p, attempt.closeout_authority?.closeout_scope)) return false;
    validateCloseoutSourceScope(p.source_scope); return true;
  } catch { return false; }
}
