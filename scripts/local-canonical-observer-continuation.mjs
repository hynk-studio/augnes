import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, observeInputFile, classifyInputChange, nonFaultInputChange } from "./local-canonical-inputs.mjs";
import { readRequalificationArtifact, localRequalificationArtifact as local, linkedRequalificationArtifact as linked,
  inspectSettledInputPredecessor, inspectRequalificationHistory, inspectRequalificationSource, inputAdoptionInventory } from "./local-canonical-input-requalification.mjs";

export const OBSERVER_CONTINUATION_CONTRACT = "augnes.local-canonical-reviewed-observer-continuation.v1";
// No environment, argument, JSON or transport option can replace this identity.
// Disposable tests instrument this literal in a separate copied module graph;
// the shipped reader and admission/stock owners always use these exact pins.
export const OBSERVER_PREDECESSOR = Object.freeze({
  family_id: "f35ca8cf567e7143e9cfcc5f6c74bfaa409a9e0878978be0894c1a06eab8d633",
  receipt_fingerprint: "76610900ef98eec1cd6dcfc9622efcf89899f29c307388f61b63cffe1763c6af",
  receipt_bytes_sha256: "4d472fc14a0fac99ef28ce5f9036cb8fa31d1091347c9c855e1d077a9330caaa",
  head: "54e137517db4bf28138a314a1384c58bbba2d480", tree: "fe2765b3ee1b1323be7126966cb5f4b3274567ec",
  reviewed_corrections_head: "a4b0302ad3717db861b0d609116fed5a2a96acf3",
});
export const OBSERVER_OWNER_FILES = Object.freeze([
  "scripts/local-canonical-observer-continuation.mjs", "scripts/local-canonical-attempts.mjs",
  "scripts/local-canonical-input-requalification.mjs", "scripts/local-canonical-inputs.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/local-canonical-receipt.mjs",
  "scripts/local-canonical-integration-base.mjs", "scripts/github-main-branch-transport.mjs",
  "scripts/local-canonical-checkout-ownership.mjs", "scripts/local-canonical-capacity.mjs",
  "scripts/canonical-child-runner.mjs", "scripts/test-harness-process-lifecycle.mjs",
  "scripts/run-canonical-test-suite.mjs", "scripts/test-local-canonical-verification-contract.mjs",
  ".github/LOCAL_CANONICAL_VERIFICATION.md", "docs/LOCAL_CANONICAL_INPUT_CONTRACT.md",
].sort());
const fail = code => { throw Object.assign(new Error(code), { code }); };
const hash = v => /^[0-9a-f]{64}$/u.test(v ?? "");
const sha = v => /^[0-9a-f]{40}$/u.test(v ?? "");
const same = (a, b) => digest(a) === digest(b);
const json = file => JSON.parse(readRequalificationArtifact(file));
const gitAt = root => args => execFileSync("git", ["--no-replace-objects", ...args], { cwd: root, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });

export function readObserverContinuationProof(file, repositoryRoot) {
  const relative = path.relative(repositoryRoot, file).split(path.sep).join("/"); local(repositoryRoot, relative);
  const p = json(file);
  if (p.schema !== OBSERVER_CONTINUATION_CONTRACT || ![p.head, p.tree, p.accepted_main].every(sha) || typeof p.branch !== "string" ||
      p.prior?.number !== 1 || ![p.prior.input_fingerprint, p.prior.fault_fingerprint, p.prior.attempt_record_sha256, p.prior.completion_record_sha256].every(hash) ||
      !/^\.augnes-local-verification\/receipts\/[A-Za-z0-9_-]+\.json$/u.test(p.prior.receipt_path ?? "") ||
      ["family_id", "receipt_fingerprint", "receipt_bytes_sha256"].some(k => p.prior[k] !== OBSERVER_PREDECESSOR[k])) fail("observer_predecessor_not_supported");
  for (const descriptor of [p.history_review, p.source_review]) linked(file, descriptor);
  if (!Array.isArray(p.input_basis?.resources) || !hash(p.input_basis.fingerprint) || p.input_basis.fingerprint !== digest(p.input_basis.resources)) fail("observer_input_basis_invalid");
  for (const key of ["review", "authorization"]) {
    const d = p.external?.[key];
    if (!Number.isSafeInteger(d?.id) || d.id < 1 || !hash(d.body_sha256)) fail("observer_external_authority_missing");
  }
  return { ...p, local_relative_path: relative };
}

export function observerInputBasis(resources) {
  if (!Array.isArray(resources) || resources.length === 0 || new Set(resources.map(r => r.id)).size !== resources.length) fail("observer_input_basis_invalid");
  const values = resources.map(({ file, ...r }) => ({ ...r, location_fingerprint: digest(file),
    before: observeInputFile(file, { metadataOnly: r.metadataOnly, preferences: r.excludePreferences, readOnlyExecutable: r.readOnlyExecutable }) }));
  return { resources: values, fingerprint: digest(values) };
}

export function observerOwnerHashes(repositoryRoot, head) {
  const git = gitAt(repositoryRoot);
  return OBSERVER_OWNER_FILES.map(file => ({ path: file, sha256: digest(git(["show", `${head}:${file}`])) }));
}

// The remote review and user grant bind this value, not a local 'approved' flag.
// Separate remote IDs/body hashes prevent a source review becoming a user grant.
export function observerAuthorityBinding(proof) {
  return { contract: OBSERVER_CONTINUATION_CONTRACT, head: proof.head, tree: proof.tree, base: proof.accepted_main, branch: proof.branch,
    prior: proof.prior, history_review: proof.history_review, source_review: proof.source_review,
    current_input_basis_fingerprint: proof.input_basis.fingerprint, owner_hashes: proof.owner_hashes,
    historical_cause: "UNKNOWN", scope: "one_complete_invocation", invocation: 2 };
}

function remote(endpoint) {
  try {
    return JSON.parse(execFileSync("gh", ["api", `repos/hynk-studio/augnes/${endpoint}`, "--hostname", "github.com", "--method", "GET", "--header", "Cache-Control: no-cache"],
      { timeout: 10000, maxBuffer: 2 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }));
  } catch { fail("observer_external_observation_unavailable"); }
}
function remoteEnvelope(record, descriptor, marker) {
  if (record?.id !== descriptor.id || record.user?.login !== "hynk-studio" || record.user.type !== "User" || record.author_association !== "OWNER" ||
      typeof record.body !== "string" || digest(record.body) !== descriptor.body_sha256) fail("observer_external_authority_invalid");
  const begin = `BEGIN_${marker}\n`, end = `\nEND_${marker}`;
  if (record.body.split(begin).length !== 2 || record.body.split(end).length !== 2) fail("observer_external_authority_invalid");
  try { return JSON.parse(record.body.split(begin)[1].split(end)[0]); } catch { fail("observer_external_authority_invalid"); }
}
function inspectExternalAuthority(proof, completion) {
  const main = remote("branches/main");
  if (main.name !== "main" || main.commit?.sha !== proof.accepted_main) fail("observer_main_moved");
  const review = remote(`pulls/1536/reviews/${proof.external.review.id}`);
  const accepted = remoteEnvelope(review, proof.external.review, "AUGNES_OBSERVER_REVIEW");
  const binding = observerAuthorityBinding(proof);
  if (!["COMMENTED", "APPROVED"].includes(review.state) || review.commit_id !== proof.head ||
      review.html_url !== `https://github.com/hynk-studio/augnes/pull/1536#pullrequestreview-${review.id}` ||
      accepted.schema !== "augnes.local-canonical-observer-review.v1" || accepted.decision !== "accept_final_source_and_contract" ||
      !same(accepted.binding, binding)) fail("observer_external_review_invalid");
  const authority = remote(`issues/comments/${proof.external.authorization.id}`);
  const grant = remoteEnvelope(authority, proof.external.authorization, "AUGNES_OBSERVER_AUTHORIZATION");
  if (authority.html_url !== `https://github.com/hynk-studio/augnes/issues/1535#issuecomment-${authority.id}` ||
      grant.schema !== "augnes.local-canonical-observer-authorization.v1" || grant.decision !== "authorize_one_prospective_invocation" ||
      !same(grant.binding, binding) || !same(grant.review, proof.external.review)) fail("observer_external_authorization_invalid");
  const times = [completion.finished_at, review.submitted_at, authority.created_at];
  if (times.some(t => !Number.isFinite(Date.parse(t)) || Date.parse(t) > Date.now()) ||
      Date.parse(times[0]) >= Date.parse(times[1]) || Date.parse(times[1]) >= Date.parse(times[2])) fail("observer_external_authority_order_invalid");
}

export function observerSourceChain(repositoryRoot, originalHead, head) {
  const git = gitAt(repositoryRoot), reverse = []; let cursor = head;
  for (let n = 0; cursor !== originalHead && n < 64; n++) {
    const parents = git(["show", "-s", "--format=%P", cursor]).toString().trim().split(" ");
    if (![1, 2].includes(parents.length) || !parents.every(sha)) fail("observer_source_ancestry_invalid");
    const inventory = inputAdoptionInventory(repositoryRoot, parents[0], parents[0], cursor);
    reverse.push({ head: cursor, tree: git(["rev-parse", `${cursor}^{tree}`]).toString().trim(), parents,
      inventory_fingerprint: inventory.fingerprint, delta_sha256: inventory.delta_sha256, changed_paths: inventory.changed_paths,
      changes: inventory.entries.filter(e => e.target !== e.predecessor).map(e => ({ path: e.path, before: e.predecessor, after: e.target })) });
    cursor = parents[0];
  }
  if (cursor !== originalHead || !reverse.length) fail("observer_source_ancestry_invalid");
  return reverse.reverse();
}
// v1 keeps its single-merge meaning. v2 explicitly lists every merge in the
// complete first-parent chain; the same descriptors are inspected and frozen.
function integrationDescriptors(source) {
  let descriptors;
  if (source.schema === "augnes.local-canonical-observer-source-review.v1" && !Object.hasOwn(source, "integrations")) descriptors = [source.integration];
  else if (source.schema === "augnes.local-canonical-observer-source-review.v2" && !Object.hasOwn(source, "integration")) descriptors = source.integrations;
  if (!Array.isArray(descriptors) || !descriptors.length || descriptors.length > 64 ||
      descriptors.some(d => !d || typeof d.artifact !== "string" || !hash(d.sha256)) ||
      new Set(descriptors.map(d => d.artifact)).size !== descriptors.length) fail("observer_source_integration_invalid");
  return descriptors;
}
function inspectSource(file, proof, original, completion, repositoryRoot) {
  const source = JSON.parse(linked(file, proof.source_review)), git = gitAt(repositoryRoot);
  const descriptors = integrationDescriptors(source);
  const chain = observerSourceChain(repositoryRoot, original.attempt.head, proof.head);
  if (!same(source.chain, chain) ||
      !chain.some(c => c.head === OBSERVER_PREDECESSOR.reviewed_corrections_head) ||
      chain.at(-1).head === OBSERVER_PREDECESSOR.reviewed_corrections_head || chain.at(-1).tree !== proof.tree ||
      chain.some(c => c.changes.some(e => e.before && !e.after))) fail("observer_source_review_invalid");
  const integrations = chain.filter(c => c.parents.length === 2);
  if (integrations.length !== descriptors.length || integrations.at(-1)?.parents[1] !== proof.accepted_main) fail("observer_source_integration_invalid");
  let previousMain = original.repository.base_sha;
  for (const [n, merge] of integrations.entries()) {
    const main = merge.parents[1];
    if (main === previousMain) fail("observer_source_main_lineage_invalid");
    try { git(["merge-base", "--is-ancestor", previousMain, main]); } catch { fail("observer_source_main_lineage_invalid"); }
    const mergeProof = { ...proof, head: merge.head, tree: merge.tree, accepted_main: main,
      kind: "accepted_main_adoption", source_review: descriptors[n] };
    inspectRequalificationSource(file, mergeProof, { ...original, attempt: { ...original.attempt, head: merge.parents[0],
      tree: git(["rev-parse", `${merge.parents[0]}^{tree}`]).toString().trim() } }, completion);
    previousMain = main;
  }
  const inventory = inputAdoptionInventory(repositoryRoot, original.attempt.head, original.repository.base_sha, proof.head);
  const assets = inventory.entries.filter(e => e.predecessor !== e.base && e.predecessor !== null).map(e => ({ path: e.path, entry: e.predecessor }));
  if (!same(source.task_assets, assets) || inventory.entries.some(e => e.predecessor !== e.base && e.predecessor !== null && !e.target)) fail("observer_task_assets_lost");
  if (!same(proof.owner_hashes, observerOwnerHashes(repositoryRoot, proof.head)) || proof.owner_hashes.some(o => digest(readRequalificationArtifact(path.join(repositoryRoot, o.path), 2 * 1024 * 1024)) !== o.sha256)) fail("observer_owner_source_changed");
  return source;
}

function inspectHistory(file, proof, original) {
  const h = inspectRequalificationHistory(file, proof, original), cancelled = [];
  for (const phase of original.phases.filter(p => p.status !== "not_run")) {
    const log = h.logs.find(l => l.phase === phase.id);
    if (!log || phase.log?.truncated !== false || log.path !== phase.log.relative_path || log.bytes !== phase.log.bytes) fail("observer_history_incomplete");
    const starts = new Map(), spawns = new Map(), results = new Set();
    const rows = readRequalificationArtifact(local(path.resolve(file.slice(0, -proof.local_relative_path.length)), log.path), 2 * 1024 * 1024).toString().split("\n");
    for (const row of rows.filter(r => r.startsWith(`[canonical:${phase.id}] `))) {
      const start = / child_start label=("(?:[^"\\]|\\.)*") timeout_ms=([0-9]+)$/u.exec(row);
      const spawn = / child_spawn label=("(?:[^"\\]|\\.)*") pid=([0-9]+) wait=process_exit$/u.exec(row);
      if (row.includes(" child_spawn ") && !spawn) fail("observer_child_unaccounted");
      if (start) starts.set(start[1], Number(start[2]));
      if (spawn) { if (!starts.has(spawn[1]) || spawns.has(spawn[1])) fail("observer_child_unaccounted"); spawns.set(spawn[1], Number(spawn[2])); }
      if (row.includes(" child_result ")) { const label = / label=("(?:[^"\\]|\\.)*") /u.exec(row)?.[1]; if (!spawns.has(label)) fail("observer_child_unaccounted"); results.add(label); }
    }
    for (const [label, timeout_ms] of starts) if (!results.has(label)) {
      if (phase.failure_code !== "phase_cancelled" || !spawns.has(label) || !Number.isSafeInteger(timeout_ms) || timeout_ms <= 0) fail("observer_child_unaccounted");
      cancelled.push({ phase: phase.id, label: JSON.parse(label), pid: spawns.get(label), timeout_ms,
        settlement_owner: "cancelled_phase", cleanup_fingerprint: digest(phase.cleanup) });
    }
  }
  if (!same(h.cancelled_children, cancelled) || h.historical_cause !== "UNKNOWN") fail("observer_child_settlement_review_missing");
  return h;
}

export function observerContinuationResources({ repositoryRoot, anchorRoot, proof }) {
  const file = local(repositoryRoot, proof.local_relative_path);
  if (!same(readObserverContinuationProof(file, repositoryRoot), proof)) fail("observer_proof_changed");
  const source = JSON.parse(linked(file, proof.source_review)), history = JSON.parse(linked(file, proof.history_review));
  const integrations = integrationDescriptors(source);
  const descriptors = [proof.history_review, proof.source_review, ...integrations];
  for (const descriptor of integrations) {
    const integration = JSON.parse(linked(file, descriptor));
    if (!Array.isArray(integration.overlaps)) fail("observer_source_integration_invalid");
    descriptors.push(...integration.overlaps.map(o => o.preservation));
  }
  const files = [file, local(repositoryRoot, proof.prior.receipt_path), ...descriptors.map(d => { linked(file, d); return path.join(path.dirname(file), d.artifact); }),
    ...history.logs.map(l => local(repositoryRoot, l.path)), ...["attempt", "completion"].map(k => path.join(anchorRoot, ".augnes-local-verification/families", proof.prior.family_id, `${k}-1.json`))];
  return [...new Set(files)].sort().map((file, n) => { readRequalificationArtifact(file, 2 * 1024 * 1024); return { id: `observer-evidence-${n}`, file, classification: "execution" }; });
}

export function inspectObserverContinuation({ anchorRoot, repositoryRoot, branch, head, tree, acceptedMain, proof, inputs = null, checkoutOwner = null, currentResources }) {
  const file = local(repositoryRoot, proof.local_relative_path);
  if (!same(readObserverContinuationProof(file, repositoryRoot), proof) || proof.head !== head || proof.tree !== tree || proof.branch !== branch || proof.accepted_main !== acceptedMain) fail("observer_target_changed");
  const git = gitAt(repositoryRoot);
  if (git(["rev-parse", "HEAD"]).toString().trim() !== head || git(["status", "--porcelain"]).toString().trim() ||
      git(["branch", "--show-current"]).toString().trim() !== branch || git(["remote", "get-url", "origin"]).toString().trim() !== "https://github.com/hynk-studio/augnes.git") fail("observer_source_moved");
  const predecessor = inspectSettledInputPredecessor({ anchorRoot, repositoryRoot, receiptPath: proof.prior.receipt_path, checkoutOwner }, "browser-observer");
  const { original, completion } = predecessor, a = original.attempt;
  if (a.head !== OBSERVER_PREDECESSOR.head || a.tree !== OBSERVER_PREDECESSOR.tree || a.branch !== branch ||
      proof.prior.family_id !== a.family_id || proof.prior.attempt_id !== a.attempt_id || proof.prior.receipt_fingerprint !== original.integrity.content_fingerprint ||
      proof.prior.input_fingerprint !== original.inputs.fingerprint || proof.prior.fault_fingerprint !== digest(original.inputs.first_fault) ||
      proof.prior.receipt_bytes_sha256 !== predecessor.original_bytes_sha256 || proof.prior.attempt_record_sha256 !== predecessor.attempt_record_sha256 ||
      proof.prior.completion_record_sha256 !== predecessor.completion_record_sha256) fail("observer_predecessor_changed");
  inspectHistory(file, proof, original); inspectSource(file, proof, original, completion, repositoryRoot);
  const current = observerInputBasis(currentResources);
  if (current.resources.length !== proof.input_basis.resources.length || current.resources.some((r, n) => {
    const p = proof.input_basis.resources[n]; const { before, ...identity } = r, { before: previous, ...priorIdentity } = p;
    return !same(identity, priorIdentity) || !["execution", "safety", "ambient"].includes(r.classification) || !nonFaultInputChange(classifyInputChange(previous, before, r));
  })) fail("observer_current_input_changed");
  const browser = current.resources.find(r => r.id === "browser-executable");
  if (!browser?.readOnlyExecutable || browser.metadataOnly || browser.excludePreferences || browser.before.present !== true ||
      classifyInputChange(browser.before, browser.before, browser) !== "unchanged") fail("observer_current_input_unknown");
  inspectExternalAuthority(proof, completion);
  if (inputs) {
    if (inputs.binding?.observer_continuation !== digest(proof) || inputs.binding.head !== head || inputs.binding.tree !== tree) fail("observer_freeze_mismatch");
    const evidence = observerContinuationResources({ repositoryRoot, anchorRoot, proof });
    const frozen = observerInputBasis([...currentResources, ...evidence]).resources;
    if (!Array.isArray(inputs.resources) || inputs.resources.length !== frozen.length || frozen.some((r, n) => {
      const p = inputs.resources[n]; const { before, ...identity } = r, { before: previous, ...priorIdentity } = p;
      return !same(identity, priorIdentity) || !nonFaultInputChange(classifyInputChange(previous, before, r));
    })) fail("observer_freeze_mismatch");
  }
  return { ...predecessor, proof_fingerprint: digest(proof), authority_binding: observerAuthorityBinding(proof) };
}
