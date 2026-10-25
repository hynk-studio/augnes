// Test-only packaging and authenticated-response double. Production owners
// import neither this file nor any environment-selected policy/transport seam.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import cp from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { pathToFileURL } from "node:url";
import { digest } from "../local-canonical-inputs.mjs";
import { OBSERVER_PREDECESSOR, OBSERVER_OWNER_FILES } from "../local-canonical-observer-continuation.mjs";
import { inputAdoptionInventory } from "../local-canonical-input-requalification.mjs";
import { sourceRoot, git, commit, write, read } from "./observer-continuation.mjs";

export const proofFile = f => path.join(f.checkout, ".augnes-local-verification/observer/proof.json");
export const remoteFile = f => path.join(f.parent, "external-records.json");
// Reader-valid legacy claim; eligibility must still reject this observer family.
// This is deliberately not an assertion of an accepted PASS-only adoption.
export function legacyIntegrationClaim(f, prior) {
  const dir = path.join(f.checkout, ".augnes-local-verification/other-route"), review = {
    schema: "augnes.local-canonical-candidate-review.v1", kind: "accepted_main_integration", head: f.head, tree: f.tree,
    source_review: "complete", delta_sha256: "a".repeat(64), changed_paths: ["task-assets.txt"],
    authority_reference: "https://github.com/hynk-studio/augnes/issues/1535", reviewed_at: new Date().toISOString(),
  };
  write(path.join(dir, "review.json"), review);
  const file = path.join(dir, "source.json");
  write(file, { schema: "augnes.local-canonical-source-correction.v2", kind: "accepted_main_integration",
    branch: f.branch, head: f.head, tree: f.tree, accepted_main: f.base, prior_family_id: prior.attempt.family_id, prior_number: prior.attempt.number,
    prior_attempt_id: prior.attempt.attempt_id, prior_receipt_fingerprint: prior.receipt.integrity.content_fingerprint,
    prior_receipt_path: prior.relative, review: { artifact: "review.json", sha256: digest(fs.readFileSync(path.join(dir, "review.json"))) } });
  return file;
}
export function installRemoteDouble(f) {
  const original = cp.execFileSync;
  cp.execFileSync = (command, args, options) => {
    if (command !== "gh") return original(command, args, options);
    const records = read(remoteFile(f)), value = records[args[1]];
    if (!value) throw new Error("synthetic external record unavailable");
    return JSON.stringify(value);
  };
  syncBuiltinESMExports();
  return () => { cp.execFileSync = original; syncBuiltinESMExports(); };
}

export function copyInstrumentedOwners(f, first, reviewedHead) {
  const destination = path.join(f.parent, "owners"), copied = new Set();
  const copy = name => {
    if (copied.has(name)) return; copied.add(name);
    const source = path.join(sourceRoot, name), target = path.join(destination, name), bytes = fs.readFileSync(source);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
    if (!name.endsWith(".mjs")) return;
    for (const match of bytes.toString().matchAll(/(?:from\s*|import\s*\()\s*["'](\.[^"']+)["']/gu)) {
      const dependency = path.normalize(path.join(path.dirname(name), match[1]));
      if (fs.existsSync(path.join(sourceRoot, dependency)) && fs.statSync(path.join(sourceRoot, dependency)).isFile()) copy(dependency);
    }
  };
  for (const n of ["scripts/fixtures/observer-continuation.mjs", "scripts/fixtures/observer-continuation-support.mjs", "scripts/test-local-canonical-observer-continuation.mjs", "scripts/browser-verification-owners.v1.json", "scripts/local-canonical-change-owners.v1.json", "plugins/augnes-operator/mcp/checkout-identity-darwin.py"]) copy(n);
  const policy = path.join(destination, "scripts/local-canonical-observer-continuation.mjs"), original = fs.readFileSync(policy, "utf8");
  const pins = { family_id: first.attempt.family_id, receipt_fingerprint: first.receipt.integrity.content_fingerprint,
    receipt_bytes_sha256: digest(first.originalBytes), head: first.attempt.head, tree: first.attempt.tree, reviewed_corrections_head: reviewedHead };
  let instrumented = original;
  for (const [key, old] of Object.entries(OBSERVER_PREDECESSOR)) {
    assert.equal(instrumented.split(`"${old}"`).length, 2); instrumented = instrumented.replace(`"${old}"`, JSON.stringify(pins[key]));
  }
  fs.writeFileSync(policy, instrumented);
  write(path.join(f.parent, "instrumentation.json"), { schema: "augnes.disposable-observer-policy-instrumentation.v1", pins,
    production_module_sha256: digest(original), instrumented_module_sha256: digest(instrumented),
    changed_surface: "six immutable predecessor identity literals only", production_override_available: false });
  return destination;
}

export function buildSourceHistory(f, { sequential = false } = {}) {
  const originals = new Map();
  for (const file of OBSERVER_OWNER_FILES) {
    const bytes = fs.readFileSync(path.join(sourceRoot, file)); originals.set(file, bytes); write(path.join(f.checkout, file), bytes);
  }
  const shared = ["scripts/run-canonical-test-suite.mjs", "scripts/test-local-canonical-verification-contract.mjs"];
  for (const file of shared) fs.appendFileSync(path.join(f.checkout, file), "\n// retained fixture correction\n");
  const corrected = commit(f.checkout, "explicitly reviewed source correction");
  for (const file of shared) write(path.join(f.anchor, file), Buffer.concat([originals.get(file), Buffer.from("\n// accepted fixture main addition\n")]));
  write(path.join(f.anchor, "accepted-main-asset.txt"), "accepted main asset\n");
  f.base = commit(f.anchor, "new accepted main");
  try { git(f.checkout, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "merge", "--no-ff", "--no-commit", f.base); } catch { /* Expected additive add/add overlaps. */ }
  for (const file of shared) write(path.join(f.checkout, file), Buffer.concat([originals.get(file), Buffer.from("\n// retained fixture correction\n\n// accepted fixture main addition\n")]));
  const integration = commit(f.checkout, "reviewed exact main integration");
  assert.equal(git(f.checkout, "show", "-s", "--format=%P", integration), `${corrected} ${f.base}`);
  write(path.join(f.checkout, "reviewed-path-fix.txt"), "reviewed literal path correction\n");
  const reviewed = commit(f.checkout, "accepted correction floor");
  write(path.join(f.checkout, "observer-route.txt"), "new route requires its own review\n");
  f.head = commit(f.checkout, "new route implementation"); f.tree = git(f.checkout, "rev-parse", "HEAD^{tree}");
  const integrations = [{ integration, corrected, base: f.base, shared }];
  if (sequential) {
    fs.appendFileSync(path.join(f.checkout, "accepted-main-asset.txt"), "retained later correction\n");
    const laterCorrection = commit(f.checkout, "later reviewed correction");
    fs.appendFileSync(path.join(f.anchor, "accepted-main-asset.txt"), "accepted later main addition\n");
    write(path.join(f.anchor, "later-main-document.txt"), "accepted main document\n");
    f.base = commit(f.anchor, "later accepted main");
    try { git(f.checkout, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "merge", "--no-ff", "--no-commit", f.base); } catch { /* Reviewed additive overlap. */ }
    write(path.join(f.checkout, "accepted-main-asset.txt"), "accepted main asset\nretained later correction\naccepted later main addition\n");
    f.head = commit(f.checkout, "second exact main integration"); f.tree = git(f.checkout, "rev-parse", "HEAD^{tree}");
    assert.equal(git(f.checkout, "show", "-s", "--format=%P", f.head), `${laterCorrection} ${f.base}`);
    integrations.push({ integration: f.head, corrected: laterCorrection, base: f.base, shared: ["accepted-main-asset.txt"] });
  }
  return { integration, corrected, reviewed, shared, integrations, sequential };
}

export async function prepareObserverProof(f, first, sources, owners, child) {
  const observer = await import(pathToFileURL(path.join(owners, "scripts/local-canonical-observer-continuation.mjs")));
  const fixture = await import(pathToFileURL(path.join(owners, "scripts/fixtures/observer-continuation.mjs")));
  const file = proofFile(f), dir = path.dirname(file), original = first.receipt;
  const artifact = (name, value) => { const p = path.join(dir, name); write(p, value); return { artifact: name, sha256: digest(fs.readFileSync(p)) }; };
  const cancelled = [];
  for (const p of original.phases.filter(p => p.failure_code === "phase_cancelled")) {
    const bytes = fs.readFileSync(path.join(f.checkout, p.log.relative_path), "utf8"), starts = new Map();
    for (const line of bytes.split("\n")) {
      const start = / child_start label=("(?:[^"\\]|\\.)*") timeout_ms=([0-9]+)$/u.exec(line);
      const spawn = / child_spawn label=("(?:[^"\\]|\\.)*") pid=([0-9]+) wait=process_exit$/u.exec(line);
      if (start) starts.set(start[1], Number(start[2]));
      if (spawn) cancelled.push({ phase: p.id, label: JSON.parse(spawn[1]), pid: Number(spawn[2]), timeout_ms: starts.get(spawn[1]), settlement_owner: "cancelled_phase", cleanup_fingerprint: digest(p.cleanup) });
    }
  }
  await new Promise(r => setTimeout(r, 3));
  const reviewed_at = new Date().toISOString(), reference = "https://github.com/hynk-studio/augnes/pull/1536#pullrequestreview-1";
  const history = { schema: "augnes.local-canonical-input-history-review.v1", review_reference: reference, reviewed_at, historical_cause: "UNKNOWN", cancelled_children: cancelled,
    receipt_fingerprint: original.integrity.content_fingerprint, input_fingerprint: original.inputs.fingerprint, first_fault_fingerprint: digest(original.inputs.first_fault),
    events_fingerprint: digest(original.inputs.events), secondary_faults_fingerprint: digest(original.inputs.secondary_faults), phases_fingerprint: digest(original.phases),
    independent_failures: [], unresolved: [], safety_review: "complete", logs: original.phases.filter(p => p.status !== "not_run").map(p => ({ phase: p.id, path: p.log.relative_path, bytes: p.log.bytes, sha256: digest(fs.readFileSync(path.join(f.checkout, p.log.relative_path))) })) };
  const integrations = [];
  for (const [n, spec] of sources.integrations.entries()) {
    const inv = inputAdoptionInventory(f.checkout, spec.corrected, spec.base, spec.integration), mergeTree = git(f.checkout, "rev-parse", `${spec.integration}^{tree}`);
    const markers = n === 0 ? ['retained fixture correction', 'accepted fixture main addition'] : ['retained later correction', 'accepted later main addition'];
    const result = await child({ label: `integration-preservation-${n + 1}`, args: ["-e", `const cp=require('child_process'),assert=require('assert'); for(const file of ${JSON.stringify(spec.shared)}) {const b=cp.execFileSync('git',['show',${JSON.stringify(spec.integration)}+':'+file],{encoding:'utf8'});for(const marker of ${JSON.stringify(markers)}) assert(b.includes(marker));} assert(cp.execFileSync('git',['show',${JSON.stringify(spec.integration)}+':task-assets.txt'],{encoding:'utf8'}).includes('retained task assets'));`], cwd: f.checkout });
    assert.equal(result.exit_code, 0);
    const suffix = n === 0 ? "" : `-${n + 1}`;
    const witness = artifact(`preservation${suffix}.json`, { schema: "augnes.local-canonical-integration-preservation.v1", head: spec.integration, tree: mergeTree,
      delta_sha256: inv.delta_sha256, paths: spec.shared, node_version: "24.18.0", finished_at: new Date().toISOString(), result });
    integrations.push(artifact(`integration${suffix}.json`, { schema: "augnes.local-canonical-input-source-review.v1", kind: "accepted_main_adoption", head: spec.integration, tree: mergeTree,
      predecessor_head: spec.corrected, predecessor_tree: git(f.checkout, "rev-parse", `${spec.corrected}^{tree}`), accepted_main: spec.base, source_review: "complete", review_reference: reference, reviewed_at,
      merge_base: inv.merge_base, inventory_fingerprint: inv.fingerprint, delta_sha256: inv.delta_sha256, changed_paths: inv.changed_paths,
      task_assets: inv.entries.filter(e => e.predecessor !== e.base && e.predecessor !== null).map(e => ({ path: e.path, entry: e.predecessor })),
      overlaps: inv.entries.filter(e => e.divergent).map(e => ({ path: e.path, entries: e, review_reference: reference, kind: "reviewed_additive_overlap", preservation: witness })) }));
  }
  const assets = inputAdoptionInventory(f.checkout, first.attempt.head, original.repository.base_sha, f.head);
  const source = artifact("source.json", { schema: `augnes.local-canonical-observer-source-review.v${sources.sequential ? 2 : 1}`, chain: observer.observerSourceChain(f.checkout, first.attempt.head, f.head),
    ...(sources.sequential ? { integrations } : { integration: integrations[0] }),
    task_assets: assets.entries.filter(e => e.predecessor !== e.base && e.predecessor !== null).map(e => ({ path: e.path, entry: e.predecessor })) });
  const family = path.join(f.anchor, ".augnes-local-verification/families", first.attempt.family_id);
  const p = { schema: observer.OBSERVER_CONTINUATION_CONTRACT, branch: f.branch, head: f.head, tree: f.tree, accepted_main: f.base,
    prior: { family_id: first.attempt.family_id, number: 1, attempt_id: first.attempt.attempt_id, receipt_path: first.relative,
      receipt_fingerprint: original.integrity.content_fingerprint, input_fingerprint: original.inputs.fingerprint, fault_fingerprint: digest(original.inputs.first_fault), receipt_bytes_sha256: digest(first.originalBytes),
      attempt_record_sha256: digest(fs.readFileSync(path.join(family, "attempt-1.json"))), completion_record_sha256: digest(fs.readFileSync(path.join(family, "completion-1.json"))) },
    history_review: artifact("history.json", history), source_review: source, input_basis: observer.observerInputBasis(fixture.resourceList(f)), owner_hashes: observer.observerOwnerHashes(f.checkout, f.head) };
  const binding = observer.observerAuthorityBinding(p), wrap = (kind, data) => `BEGIN_AUGNES_OBSERVER_${kind}\n${JSON.stringify(data)}\nEND_AUGNES_OBSERVER_${kind}`;
  const reviewBody = wrap("REVIEW", { schema: "augnes.local-canonical-observer-review.v1", decision: "accept_final_source_and_contract", binding });
  p.external = { review: { id: 1, body_sha256: digest(reviewBody) } };
  const authorityBody = wrap("AUTHORIZATION", { schema: "augnes.local-canonical-observer-authorization.v1", decision: "authorize_one_prospective_invocation", binding, review: p.external.review });
  p.external.authorization = { id: 2, body_sha256: digest(authorityBody) };
  const user = { login: "hynk-studio", type: "User" }, submitted_at = new Date().toISOString();
  await new Promise(r => setTimeout(r, 3));
  write(remoteFile(f), { "repos/hynk-studio/augnes/branches/main": { name: "main", commit: { sha: f.base } },
    "repos/hynk-studio/augnes/pulls/1536/reviews/1": { id: 1, user, author_association: "OWNER", body: reviewBody, state: "COMMENTED", commit_id: f.head, submitted_at, html_url: "https://github.com/hynk-studio/augnes/pull/1536#pullrequestreview-1" },
    "repos/hynk-studio/augnes/issues/comments/2": { id: 2, user, author_association: "OWNER", body: authorityBody, created_at: new Date().toISOString(), html_url: "https://github.com/hynk-studio/augnes/issues/1535#issuecomment-2" } });
  write(file, p);
  return { proof: observer.readObserverContinuationProof(file, f.checkout), observer, fixture };
}
