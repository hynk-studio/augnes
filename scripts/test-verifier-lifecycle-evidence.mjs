// Read-only controls over supplied retained originals. Mutations stay in
// memory, never authenticate substituted authority or reserve an invocation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { digest, inputEventIdentity } from "./local-canonical-inputs.mjs";
import { finalizeReceipt, verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";
import { readVerifierLifecycleDelegation, delegatesMaterialSourceCommission, verifierLifecycleAuthorityBindings,
  verifierLifecycleAuthorityScope, MATERIAL_HISTORY_BOUNDARY, INTEGRATION_BUDGET_LIMIT, verifyGitRevisionFailure } from "./local-canonical-git-observation.mjs";
import { VERIFIER_LIFECYCLE_REPAIR, VERIFIER_LIFECYCLE_GRANT, verifierLifecycleReaderGraph, validVerifierLifecycleInputs, verifyVerifierLifecyclePredecessor, verifyVerifierLifecycleRepair } from "./local-canonical-verifier-lifecycle-witness.mjs";
import { REVIEWED_REVISION_PHASES, validateReviewedRevisionAuthorityRecords, reviewedRevisionAuthorityObservation, revisionArtifact } from "./local-canonical-attempts.mjs";

const [delegationFile, receiptFile, materialFile, ...extra] = process.argv.slice(2);
if (!delegationFile || !receiptFile || extra.length) throw new Error("usage: test-verifier-lifecycle-evidence.mjs <delegation.json> <predecessor-receipt.json> [preparing-material.json]");
const read = file => JSON.parse(readFileSync(file, "utf8")), delegation = read(delegationFile), original = read(receiptFile);
const p = materialFile ? read(materialFile) : { ...structuredClone(original.attempt.source_correction),
  prior_family_id: original.attempt.family_id, prior_attempt_id: original.run.id, prior_receipt_fingerprint: original.integrity.content_fingerprint };
p.commission.evidence_kind = VERIFIER_LIFECYCLE_REPAIR;
const cases = [];
const gitSource = args => execFileSync("git", ["--no-replace-objects", ...args], { timeout: 10000, maxBuffer: 16 * 1024 * 1024 });
const graph = verifierLifecycleReaderGraph(gitSource, original.repository.head_sha);
assert(graph.some(entry => entry.path === "plugins/augnes-operator/mcp/node-runtime-policy.mjs"));
assert(graph.every(entry => !entry.path.includes("scripts/scripts/")));
const graphFixture = new Map([
  ["scripts/local-canonical-fixture-budget-witness.mjs", 'import "../shared/reader.mjs"; const child = `import "./not-a-module.mjs"`; // import "./comment.mjs"\n'],
  ["shared/reader.mjs", 'export const value = 1;'],
]);
const readGraphFixture = ([command, ref]) => { assert.equal(command, "show"); const raw = graphFixture.get(ref.slice(ref.indexOf(":") + 1)); assert.notEqual(raw, undefined); return Buffer.from(raw); };
assert.deepEqual(verifierLifecycleReaderGraph(readGraphFixture, "fixture").map(entry => entry.path), [...graphFixture.keys()]);
graphFixture.set("scripts/local-canonical-fixture-budget-witness.mjs", 'import "../../outside.mjs";');
assert.throws(() => verifierLifecycleReaderGraph(readGraphFixture, "fixture"));
cases.push("actual complete predecessor import closure", "ignore import-like child strings and comments", "refuse outside-repository imports");
assert(readVerifierLifecycleDelegation(delegation.body, p)); assert(delegatesMaterialSourceCommission(delegation.body, p));
for (const [label, change] of [
  ["negated permission", b => b.replace("is explicitly authorized", "is not explicitly authorized")],
  ["missing conditional acceptance", b => b.replace("After a separate read-only reviewer accepts", "Before a reviewer accepts")],
  ["extra deciding allowance", b => b.replace("one deciding invocation total", "two deciding invocations total")],
  ["weakened retry boundary", b => b.replace("No ordinal two, recovery", "Allow ordinal two, recovery")],
  ["quoted scope", b => "> " + b], ["fenced scope", b => "```\n" + b + "\n```"],
  ["hidden scope", b => "<!--\n" + b + "\n-->"],
  ["other branch", b => b.replaceAll(p.branch, "fixture/other")],
  ["other receipt", b => b.replace(p.prior_receipt_fingerprint, "f".repeat(64))],
  ["other attempt", b => b.replace(p.prior_attempt_id, "unsettled-attempt")],
  ["missing connected controls", b => b.replace("Before any deciding reservation", "After any deciding reservation")],
]) { assert.equal(delegatesMaterialSourceCommission(change(delegation.body), p), false, label); cases.push(label); }
// Scope grammar alone grants nothing; authentication/permission/capability
// controls are separately exercised by the production authority fixtures.
const scopeProof = structuredClone(p); scopeProof.accepted.review = { id: 1, sha256: "a".repeat(64) };
const bindings = verifierLifecycleAuthorityBindings(scopeProof);
const review = { body: ["Source review decision: ACCEPT / RETAIN for prospective qualification.", bindings, MATERIAL_HISTORY_BOUNDARY].join("\n\n") };
const grant = { body: [VERIFIER_LIFECYCLE_GRANT, bindings, `Accepted review: https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-1`, MATERIAL_HISTORY_BOUNDARY, INTEGRATION_BUDGET_LIMIT].join("\n\n") };
assert(verifierLifecycleAuthorityScope(scopeProof, review, grant));
for (const [label, text] of [["changed target", grant.body.replace(bindings, bindings.replace(p.head, "f".repeat(40)))],
  ["wrong kind", grant.body.replace(VERIFIER_LIFECYCLE_REPAIR, "unrelated-repair")], ["old grant scope", grant.body.replace(VERIFIER_LIFECYCLE_GRANT, "Authorize ordinal two.")]]) {
  assert.equal(verifierLifecycleAuthorityScope(scopeProof, review, { body: text }), false, label); cases.push(label);
}
if (materialFile) {
  // Explicit synthetic transport records exercise the production authority
  // validator only. They are never written as an authorized proof or submitted.
  const q = structuredClone(p), user = { login: "synthetic-reviewer", id: 900001, type: "User" };
  const timestamp = Date.parse(delegation.created_at) + 1000;
  const accepted = { id: 900002, user, author_association: "COLLABORATOR", state: "COMMENTED", commit_id: q.head,
    pull_request_url: `https://api.github.com/repos/hynk-studio/augnes/pulls/${q.pull_request}`, submitted_at: new Date(timestamp).toISOString(), body: "" };
  q.accepted.review = { id: accepted.id, sha256: "a".repeat(64) };
  const execution = { id: 900003, user, author_association: "COLLABORATOR", issue_url: `https://api.github.com/repos/hynk-studio/augnes/issues/${q.pull_request}`,
    created_at: new Date(timestamp + 1000).toISOString(), updated_at: new Date(timestamp + 1000).toISOString(), body: "" };
  const binding = verifierLifecycleAuthorityBindings(q);
  accepted.body = ["Source review decision: ACCEPT / RETAIN for prospective qualification.", binding, MATERIAL_HISTORY_BOUNDARY].join("\n\n");
  execution.body = [VERIFIER_LIFECYCLE_GRANT, binding, `Accepted review: https://github.com/hynk-studio/augnes/pull/${q.pull_request}#pullrequestreview-${accepted.id}`, MATERIAL_HISTORY_BOUNDARY, INTEGRATION_BUDGET_LIMIT].join("\n\n");
  q.accepted.review.sha256 = digest(reviewedRevisionAuthorityObservation(accepted, "accepted_revision"));
  q.authorization = { grant_comment_id: execution.id, grant_sha256: digest(reviewedRevisionAuthorityObservation(execution, "execution_commission")) };
  const permissions = Object.fromEntries([["accepted_revision", user], ["execution_commission", user], ["task_delegation", delegation.user]]
    .map(([role, author]) => [role, { user: { login: author.login }, permission: "maintain" }]));
  const pr = { number: q.pull_request, state: "open", draft: true, merged: false, auto_merge: null,
    head: { sha: q.head, ref: q.branch, repo: { full_name: "hynk-studio/augnes" } },
    base: { sha: q.base, ref: "main", repo: { full_name: "hynk-studio/augnes" } } };
  validateReviewedRevisionAuthorityRecords(q, accepted, execution, permissions, pr, null, null, delegation);
  cases.push("production_authority_validator_synthetic_transport_positive");
  for (const [label, mutate] of [
    ["missing review", state => { state.review = null; }],
    ["wrong reviewed head", state => { state.review.commit_id = "f".repeat(40); }],
    ["missing current permission", state => { state.permissions.accepted_revision.permission = "read"; }],
    ["grant before review", state => { state.grant.created_at = state.grant.updated_at = state.review.submitted_at; }],
    ["review before delegation", state => { state.review.submitted_at = delegation.created_at; }],
    ["edited execution record", state => { state.grant.updated_at = new Date(timestamp + 2000).toISOString(); }],
    ["substituted inventory binding", state => { state.proof.inputs.inventory_sha256 = "f".repeat(64); }],
    ["unpublished source", state => { state.pr.head.sha = "f".repeat(40); }],
    ["old executable scope", state => { state.grant.body = "Authorize ordinal two."; }],
  ]) {
    const state = structuredClone({ proof: q, review: accepted, grant: execution, permissions, pr }); mutate(state);
    if (state.review) state.proof.accepted.review.sha256 = digest(reviewedRevisionAuthorityObservation(state.review, "accepted_revision"));
    state.proof.authorization.grant_sha256 = digest(reviewedRevisionAuthorityObservation(state.grant, "execution_commission"));
    assert.throws(() => validateReviewedRevisionAuthorityRecords(state.proof, state.review, state.grant, state.permissions, state.pr, null, null, delegation), undefined, label);
    cases.push(label);
  }
  const folder = path.dirname(path.resolve(materialFile));
  // Use the actual bounded artifact owner, including its filename and file
  // safety rules; a permissive copied adapter conceals packet incompatibility.
  const bytes = (ref, limit = 512 * 1024) => revisionArtifact(folder, ref, limit);
  const parse = ref => JSON.parse(bytes(ref));
  const prior = parse(p.originals.attempt), completion = parse(p.originals.completion), focused = parse(p.focused), stock = JSON.parse(bytes(p.originals.stock).toString().trim());
  const git = args => execFileSync("git", ["--no-replace-objects", ...args], { timeout: 10000, maxBuffer: 16 * 1024 * 1024 });
  const common = { original, stock, parse, bytes, git, completion, completedAt: completion.finished_at, repositoryRoot: process.cwd() };
  const predecessor = overrides => verifyVerifierLifecyclePredecessor(p, prior, focused, { ...common, ...overrides,
    validateFailure: view => verifyGitRevisionFailure(original, view, parse(p.inputs.current), REVIEWED_REVISION_PHASES, prior.source_correction.commission.ordinal) });
  predecessor({}); assert.equal(verifyVerifierLifecycleRepair(p, prior, focused, common), p.head); cases.push("actual_complete_packet");
  for (const [label, mutate] of [["unsupported extra issue", s => s.issues.push("unexplained_fault")],
    ["false stock rewritten", s => { s.valid_deciding_evidence = true; }], ["missing original issue", s => { s.issues = s.issues.filter(v => v !== "receipt_attempt_records_unverified"); }]]) {
    const changed = structuredClone(stock); mutate(changed); assert.throws(() => predecessor({ stock: changed }), undefined, label); cases.push(label);
  }
  const capture = parse(focused.regression.after);
  assert.throws(() => bytes({ ...capture.collector, artifact: "collector.mjs" }), /revision_artifact_invalid/u);
  cases.push("production artifact reader refuses unsupported source extension");
  assert(validVerifierLifecycleInputs(capture, p));
  const substitutedRuntime = structuredClone(capture);
  substitutedRuntime.inputs.binding.runtime_inputs.node.version = "0";
  const rehashInputs = input => {
    const { contract, path_kind, binding, resources } = input;
    input.fingerprint = digest({ contract, path_kind, binding, resources });
  };
  rehashInputs(substitutedRuntime.inputs);
  assert.equal(validVerifierLifecycleInputs(substitutedRuntime, p), false);
  cases.push("rehashed frozen runtime substitution");
  for (const test of capture.cases.slice(0, 2)) {
    for (const [label, mutate] of [
      ["first input fault", r => { r.inputs.first_fault = { resource: "node-executable", disposition: "input_invalidation" }; }],
      ["secondary input fault", r => { r.inputs.secondary_faults = [{ resource: "node-executable", disposition: "input_invalidation" }]; }],
      ["runtime binding substitution", r => { r.inputs.binding.runtime_inputs.node.version = "0"; }],
      ...["head_sha", "tree_sha", "base_sha"].map(field => ["receipt " + field, r => { r.repository[field] = "f".repeat(40); }]),
      ["missing prepared dependencies", r => { delete r.inputs.prepared_dependencies; }],
      ["changed prerequisite", r => { r.inputs.prepared_dependencies[0].prerequisite.content_sha256 = "f".repeat(64); }],
      ["changed prepared output", r => { r.inputs.prepared_dependencies[2].after.content_sha256 = "f".repeat(64); }],
    ]) {
      // Rehash every substituted structural record consistently, so integrity
      // or packet equality cannot mask a missing semantic input check.
      const changed = structuredClone(parse(test.receipt)); mutate(changed);
      rehashInputs(changed.inputs);
      const receipt = finalizeReceipt(changed); assert(verifyReceiptIntegrity(receipt));
      const overrides = new Map([[test.receipt.sha256, receipt],
        [test.inspection.sha256, { ...parse(test.inspection), receipt }],
        [test.prior_inspection.sha256, { ...parse(test.prior_inspection), receipt }]]);
      assert.throws(() => verifyVerifierLifecycleRepair(p, prior, focused, { ...common,
        parse: ref => overrides.get(ref.sha256) ?? parse(ref) }), undefined, label);
      cases.push(test.name + ": " + label);
    }
  }
  // Explicit structural mutations reuse the existing production comparator.
  // They do not create observations or replace the retained capture's events.
  const inputControl = structuredClone(capture), resource = inputControl.inputs.resources.find(value => value.id === "browser-executable");
  const incidental = { resource: resource.id, classification: resource.classification, disposition: "incidental_executable_metadata",
    observed_at: inputControl.started_at, monotonic_ns: "1", after: structuredClone(resource.before) };
  incidental.after.metadata.links = String(BigInt(incidental.after.metadata.links) + 1n);
  incidental.after.metadata.ctime_ns = String(BigInt(incidental.after.metadata.ctime_ns) + 1n);
  incidental.identity = inputEventIdentity(incidental); inputControl.inputs.events = [incidental];
  assert(validVerifierLifecycleInputs(inputControl, p));
  for (const [label, mutate] of [
    ["hidden executable bytes", e => { e.after.sha256 = "f".repeat(64); }],
    ["hidden executable permissions", e => { e.after.permission_identity = "f".repeat(64); }],
    ["substituted executable inode", e => { e.after.metadata.inode = "1"; }],
    ["wrong role", e => { e.classification = "ambient"; }],
    ["stale event", e => { e.observed_at = "2000-01-01T00:00:00Z"; }],
    ["unknown input", e => { e.resource = "unknown"; }],
  ]) {
    const changed = structuredClone(inputControl); mutate(changed.inputs.events[0]); changed.inputs.events[0].identity = inputEventIdentity(changed.inputs.events[0]);
    assert.equal(validVerifierLifecycleInputs(changed, p), false, label); cases.push(label);
  }
  cases.push("production non-fault comparison retains incidental metadata");
  for (const [label, mutate] of [
    ["catalogue substitution", c => { c.after.source.inventory_sha256 = "f".repeat(64); }],
    ["dependency substitution", c => { c.after.dependencies.content_sha256 = "f".repeat(64); }],
    ["unknown inventory", c => { c.after.target.inventory = "f".repeat(64); }],
    ["runtime substitution", c => { c.after.runtime.node.version = "0"; }],
    ["missing before-build stop", c => { c.cases[0].build_executed = true; }],
    ["timed out authority", c => { c.cases[2].result.timed_out = true; }],
    ["incomplete cleanup", c => { c.cleanup.completed = false; }],
    ["unsettled owner", c => { c.ownership.checkout.released = false; }],
    ["different input writer", c => { c.cases[0].phases[0].command = "npm run unrelated"; }],
    ["missing predecessor import", c => { c.source_overlay.pop(); }],
    ["substituted initial bytes", c => { c.cases[0].initial.sha256 = "f".repeat(64); }],
    ["substituted generated bytes", c => { c.cases[0].generated.sha256 = "f".repeat(64); }],
    ["case environment override", c => { c.cases[0].environment.NODE_OPTIONS = "--expose-gc"; }],
    ["wrong fresh process", c => { c.cases[0].current_child = c.cases[0].prior_child; }],
    ["same basename from another directory", c => {
      const child = c.children.find(value => value.id === c.cases[0].current_child);
      child.args[2] = path.join(path.dirname(child.args[2]), "substituted", path.basename(child.args[2])); child.command = ["node", ...child.args].join(" ");
    }],
    ["wrong preparation scope", c => { c.preparations[0].result.cwd_scope = "web-planning-app"; }],
    ["extra executed build", c => { c.executed_phases.push(structuredClone(c.executed_phases.at(-1))); }],
    ["reordered executed phases", c => { c.executed_phases.reverse(); }],
    ["unsettled setup before consumer", c => { c.children[0].finished_at = c.cases[0].phases[0].finished_at; }],
    ["inspection before producer", c => { c.children[1].started_at = c.cases[0].phases[0].started_at; }],
    ["substituted setup log", c => { c.children[0].stdout = { ...c.children[0].stdout, sha256: "f".repeat(64) }; }],
  ]) {
    const changed = structuredClone(capture); mutate(changed);
    assert.throws(() => verifyVerifierLifecycleRepair(p, prior, focused, { ...common,
      parse: ref => ref.sha256 === focused.regression.after.sha256 ? changed : parse(ref) }), undefined, label); cases.push(label);
  }
  for (const [label, mutate] of [
    ["unrelated focused control command", c => { c.command = "node unrelated.mjs"; }],
    ["focused control source substitution", c => { c.source.tree = "f".repeat(40); }],
    ["focused control runtime substitution", c => { c.runtime_inputs_sha256 = "f".repeat(64); }],
    ["unsettled focused control", c => { c.cleanup.completed = false; }],
  ]) {
    const changed = structuredClone(parse(focused.regression.controls.record)); mutate(changed);
    const rebound = structuredClone(focused);
    rebound.commands = rebound.commands.map(command => equalRef(command.record, focused.regression.controls.record)
      ? { ...command, command: changed.command, result: changed.result, stdout: changed.stdout } : command);
    assert.throws(() => verifyVerifierLifecycleRepair(p, prior, rebound, { ...common,
      parse: ref => equalRef(ref, focused.regression.controls.record) ? changed : parse(ref) }), undefined, label); cases.push(label);
  }
  const unlinked = structuredClone(focused);
  unlinked.commands = unlinked.commands.filter(command => !equalRef(command.record, focused.regression.controls.record));
  assert.throws(() => verifyVerifierLifecycleRepair(p, prior, unlinked, common)); cases.push("unlinked focused control record");
}
console.log(JSON.stringify({ basis: "read-only structural and actual packet controls; no live authority or reservation", cases }));

function equalRef(left, right) { return left?.artifact === right?.artifact && left?.sha256 === right?.sha256; }
