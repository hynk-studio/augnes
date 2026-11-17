// Synthetic, model-free reader controls. No retained private evidence, service,
// network, model or historical collector is executed by this test.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { digest } from "./local-canonical-inputs.mjs";
import { revisionArtifact, reviewedRevisionAuthorityObservation, validateReviewedRevisionAuthorityRecords } from "./local-canonical-attempts.mjs";
import { finalizeReceipt } from "./local-canonical-receipt.mjs";
import { REGISTERED_IDENTITY_BUDGET } from "./local-canonical-fixture-budget-witness.mjs";
import { REGISTERED_FIXTURE_VALIDITY_WINDOW as KIND, FIXTURE_VALIDITY_WINDOW_CLAIM as CLAIM,
  FIXTURE_VALIDITY_OWNER as OWNER, FIXTURE_VALIDITY_LIMITATIONS,
  fixtureValidityWindowSourceEquivalence, verifyRegisteredFixtureValidityWindow } from "./local-canonical-fixture-validity-witness.mjs";
import { verifyGitSourceRepair, fixtureValidityWindowDelegation, fixtureValidityWindowAuthorityBindings,
  fixtureValidityWindowAuthorityScope, delegatesMaterialSourceCommission, FIXTURE_VALIDITY_WINDOW_GRANT, MATERIAL_HISTORY_BOUNDARY,
  INTEGRATION_BUDGET_LIMIT, identityBudgetDelegation, identityBudgetAuthorityBindings, IDENTITY_BUDGET_GRANT } from "./local-canonical-git-observation.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse,
  cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";

const resource = createCanonicalTestResourceRoot("ag-resource-test-");
beginCanonicalTestResourceUse(resource);
const clone = structuredClone, before = "1".repeat(40), corrected = "2".repeat(40), target = "3".repeat(40), base = "4".repeat(40);
const core = "plugins/augnes-operator/mcp/companion-service-core.mjs", suite = "scripts/run-canonical-test-suite.mjs";
const observed = [OWNER, core, "scripts/companion-service-fixture-observation.mjs", "scripts/test-harness-process-lifecycle.mjs"];
const consumed = [...observed, "scripts/augnes-companion-service.mjs", "plugins/augnes-operator/mcp/checkout-identity.mjs",
  "plugins/augnes-operator/mcp/checkout-identity-darwin.py", "plugins/augnes-operator/mcp/node-runtime-policy.mjs"];
const pins = ["", "apps/augnes_apps/", "apps/web_planning/"].flatMap(prefix => ["package.json", "package-lock.json"].map(file => prefix + file));
const file = name => readFileSync(new URL("../" + name, import.meta.url));
const source = file(OWNER).toString();
// Reconstruct a synthetic predecessor independently of the production parser.
// These are source-data edits only; neither fixture is imported or executed.
let old = source.slice(0, source.indexOf("function positiveFixtureDecision(")) + source.slice(source.indexOf("const birth ="));
const start = old.indexOf("    const original = await core.prepareCompanionOwnershipRecovery(f.options);");
const expiry = old.indexOf("    await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: { ...preview.decision, expires_at: new Date(0)", start);
assert(start > 0 && expiry > start);
old = old.slice(0, start) + "    const preview = await core.prepareCompanionOwnershipRecovery(f.options);\n" + old.slice(expiry);
const loop = old.indexOf("    for (const change of [", start), tail = old.indexOf("    await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: preview.decision, testOwnershipRecoveryStageHook:", loop);
assert(loop > start && tail > loop);
old = (old.slice(0, loop) + old.slice(tail)).replaceAll("prepareFixtureRecovery(f.options)", "core.prepareCompanionOwnershipRecovery(f.options)");
const common = new Map([...consumed, ...pins, suite].map(name => [name, file(name)]));
const versions = new Map([[before, new Map(common)], [corrected, new Map(common)], [target, new Map(common)]]);
versions.get(before).set(OWNER, Buffer.from(old));
versions.get(target).set("scripts/local-canonical-fixture-validity-witness.mjs", Buffer.from("// synthetic support-only delta\n"));
const changed = (a, b) => [...new Set([...versions.get(a).keys(), ...versions.get(b).keys()])].filter(name =>
  !versions.get(a).get(name)?.equals(versions.get(b).get(name) ?? Buffer.alloc(0))).sort();
const git = args => {
  if (args[0] === "show") { const [head, name] = args[1].split(":"); const value = versions.get(head)?.get(name); assert(value, "synthetic Git blob exists"); return value; }
  if (args[0] === "ls-tree") return Buffer.from("100644 blob " + "a".repeat(40) + "\t" + args.at(-1) + "\n");
  if (args[0] === "merge-base") { assert([before, corrected, target].indexOf(args[2]) <= [before, corrected, target].indexOf(args[3])); return Buffer.alloc(0); }
  if (args[0] === "diff") { const a = args.at(-3), b = args.at(-2), paths = changed(a, b); return args.includes("--name-only") ?
    Buffer.from(paths.join("\0") + (paths.length ? "\0" : "")) : Buffer.from(JSON.stringify(paths.map(name => [name, digest(versions.get(b).get(name))]))); }
  throw Error("unexpected synthetic Git operation");
};
let artifactCount = 0, refused = 0;
const ref = value => {
  const artifact = "synthetic-" + ++artifactCount + ".log", data = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === "string" ? value : JSON.stringify(value));
  writeFileSync(path.join(resource.root, artifact), data, { mode: 0o600 });
  return { artifact, sha256: digest(data) };
};
const bytes = (r, max) => revisionArtifact(resource.root, r, max), parse = r => JSON.parse(bytes(r));
const time = n => new Date(Date.UTC(2026, 6, 24) + n).toISOString();
const original = { receipt_version: 4, repository: { repository_id: "hynk-studio/augnes", base_sha: base, head_sha: before },
  run: { started_at: time(0), finished_at: time(10) }, integration_base: {
    contract: "augnes.local-canonical-integration-base.v2", requested_base_sha: base, tested_head_sha: before,
    status: "admitted", reason_code: null, base_is_ancestor_of_head: true, checked_at: time(1), observation: null, base_matches_current_main: null,
  } };
const attemptId = "2026-07-24T00-00-00-000Z-full-111111111111-synthetic";
const p = { schema: "augnes.local-canonical-source-correction.v7", kind: "reviewed_revision", head: target, tree: "5".repeat(40), base,
  branch: "codex/synthetic-validity", pull_request: 7, prior_family_id: digest("family"), prior_attempt_id: attemptId,
  prior_receipt_fingerprint: digest("prior receipt"),
  inputs: { inventory_sha256: digest("current inventory"), identity_sha256: digest("current runtime") },
  accepted: { head: target, tree: "5".repeat(40), review: { id: 3 } },
  commission: { source_revision: "material-source-correction-v1", evidence_kind: KIND,
    root_receipt_fingerprint: digest("root receipt"), delegation: { id: 1 }, preparation_commitment: digest("preparation") } };
const prior = { head: before, attempt_id: attemptId }, context = { git, parse, bytes, completedAt: time(10), original, repositoryRoot: resource.root };
const failureLabel = "Companion lost-ownership retirement and reconciliation regressions";
const failedLog = `[canonical:unit] child_start label=${JSON.stringify(failureLabel)} timeout_ms=60000\n` +
  "PublicCompanionServiceError: companion_service_recovery_decision_stale\n" +
  `[canonical:unit] child_result label=${JSON.stringify(failureLabel)} duration_ms=1000 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n`;
const logPath = `.augnes-local-verification/logs/${prior.attempt_id}/unit.log`;
mkdirSync(path.dirname(path.join(resource.root, logPath)), { recursive: true, mode: 0o700 });
writeFileSync(path.join(resource.root, logPath), failedLog, { mode: 0o600 });
original.phases = [{ id: "unit", status: "failure", command: "npm test", exit_status: 1, timed_out: false,
  cleanup: { completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0, termination_reason: "natural_exit" },
  log: { relative_path: logPath, bytes: Buffer.byteLength(failedLog), truncated: false } }];
const command = "node --import tsx " + OWNER;
const observer = Buffer.from("// Synthetic observer reference, never evaluated.\nregisterHooks; sampleNow; guard_after_remainder;\n");
const runner = controlled => `// Synthetic collector source, never evaluated.
buildCanonicalChildEnvironment; acquireCheckoutVerificationOwnership; releaseCheckoutVerificationOwnership;
acquireVerificationCapacity; releaseVerificationCapacity;
await runCanonicalChild({command:process.execPath, args:${controlled ? "['--import','tsx','--import',path.join(out,'clock-control.mjs')," : "['--import','tsx',"}${JSON.stringify(OWNER)}],timeoutMs:60000});`;
const sourceRows = head => observed.map(name => ({ path: name, bytes: versions.get(head).get(name).length, sha256: digest(versions.get(head).get(name)) }));
function record(head, from, exit, control = null) {
  return { schema: "synthetic.fixture-evidence.original.v1", started_at: time(from), timeout_ms: 60000, deciding: false,
    ...(control ? { synthetic_clock_control: true, admissible_regression_witness: false, ...control } : { command }),
    tested_source_head: head, source: [...sourceRows(head), ...(control ? [{ path: ".augnes-local-verification/synthetic/clock-control.mjs", bytes: observer.length, sha256: digest(observer) }] : [])],
    host: { node_version: "24.22.1", path_node_version: "24.22.1", npm_version: "11.16.0", operating_system: "macOS", architecture: "arm64" },
    child: { label: "synthetic evidence control", exit_code: exit, signal: null, timed_out: false, cancelled: false, spawn_error_code: null,
      duration_ms: 10, exit_observed: true, streams_closed: true, cleanup_started: true, cleanup_completed: true, remaining_owned_processes: 0, termination_reason: "natural_exit" },
    cleanup: { settled: true, resources: [{ root: "/synthetic/private-root", completed: true, failure_count: 0, failures: [] }],
      checkout_release: { released: true }, capacity_release: { released: true } }, finished_at: time(from + 10) };
}
const finish = r => `[canonical:synthetic] child_result label=${JSON.stringify(r.child.label)} duration_ms=10 exit_code=${r.child.exit_code} signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n` +
  JSON.stringify({ result: r.child.exit_code, duration_ms: 10, settled: true, cleanup: r.cleanup.resources }) + "\n";
const full = record(corrected, 100, 0), names = [...source.matchAll(/await run\("([^"]+)"/gu)].map(match => match[1]);
assert.equal(names.length, 9);
const fullRows = names.flatMap(scenario => [{ scenario, stage: "action_pass" }, { scenario, pass: true, cleanup_complete: true }]);
const fullLog = [...fullRows, ...["ui", "bridge", "manager-conflict"].map(adverse => ({ adverse, pass: true, cleanup_complete: true }))].map(JSON.stringify).join("\n") +
  "\nPASS ownership retirement: authenticated loopback witnesses, exact refusal, reconciliation, replay and zero residue\n" + finish(full);
const matrix = [["prior", "backward_one_ms", 1, -1], ["prior", "forward_expired", 1, 300001], ["candidate", "backward_one_ms", 0, -1], ["candidate", "backward_beyond_margin", 1, -1001]];
const controls = matrix.map(([role, mode, exit, offset], index) => {
  const r = record(role === "prior" ? before : corrected, 20 + index * 20, exit, { role, mode });
  const issued_wall = 1_000_000, expiry = issued_wall + (role === "prior" ? 300000 : 299000), wall = issued_wall + offset;
  const samples = (mode === "forward_expired" ? ["expiry"] : ["expiry", "future"]).map(comparison => ({ comparison, wall, refused: comparison === "expiry" ? expiry <= wall : expiry > wall + 300000 }));
  const scenario = "lost-state-later-attempt-exit-diagnostic", rows = [{ scenario, stage: "scenario_start" }, { scenario, stage: "fixture_ready" },
    { location: "guard_after_remainder", group_role: "supervisor", ttl_ms: 300000, expiry, samples, control: { selected: true, mode, issued_wall, observed_wall: issued_wall + 2000 }, refused: exit === 1 },
    ...(exit ? [] : [{ scenario, stage: "action_pass" }, { scenario, pass: true, cleanup_complete: true }])];
  const output = rows.map(JSON.stringify).join("\n") + "\n" + (exit ? "companion_service_recovery_decision_stale\n" : "DIAGNOSTIC selected original later-attempt scenario complete; not whole-suite qualification\n") + finish(r);
  return { result: ref(r), stdout: ref(output) };
});
const focused = { failed_phase: "unit", input_remedy_resources: [], implicated_paths: [OWNER], finished_at: time(120),
  commands: [{ command: "node --import tsx scripts/test-local-canonical-fixture-validity.mjs", tested_source_head: target }],
  regression: { kind: KIND, claim: CLAIM, owner: OWNER,
    incident: { receipt: p.prior_receipt_fingerprint, log: ref(failedLog), log_identity: { relative_path: logPath, bytes: Buffer.byteLength(failedLog), sha256: digest(failedLog) }, cause: "UNKNOWN" }, retained: {
    complete: { runner: ref(runner(false)), result: ref(full), stdout: ref(fullLog) },
    controlled: { runner: ref(runner(true)), observer: ref(observer), observations: controls },
  }, equivalence: null } };
const refuses = (work, reason = /revision_fixture_validity_window_invalid/u) => { assert.throws(work, reason); refused++; };
try {
  const derived = fixtureValidityWindowSourceEquivalence(git, before, corrected, target);
  assert.equal(derived.limitations, FIXTURE_VALIDITY_LIMITATIONS);
  assert.equal(derived.consumed_sources.length, 8); assert.equal(derived.pinned_sources.length, 6);
  focused.regression.equivalence = ref(derived);
  assert.equal(verifyRegisteredFixtureValidityWindow(p, prior, focused, context), target);
  assert.equal(verifyGitSourceRepair(p, prior, focused, context), target);
  for (const mutate of [r => r.claim = "historical cause fixed", r => r.kind = "natural-red", r => r.owner = core,
    r => r.retained.controlled.observations.pop(), r => r.retained.controlled.observations.reverse(),
    r => r.retained.complete.stdout = ref(fullLog.replace('"scenario":"' + names[0] + '","pass":true', '"scenario":"' + names[0] + '","pass":false')),
    r => r.retained.complete.stdout = ref(fullLog.replace('"adverse":"ui"', '"adverse":"other"')),
    r => r.retained.complete.runner = ref(runner(true)), r => r.equivalence = ref({ ...derived, limitations: "complete historical runtime observed" }),
    r => r.retained.controlled.observer = ref(observer.toString() + "changed")]) {
    const f = clone(focused); mutate(f.regression); refuses(() => verifyRegisteredFixtureValidityWindow(p, prior, f, context));
  }
  for (const mutate of [v => v.runtime_inputs_sha256 = digest("invented historical runtime"), v => v.deciding = true,
    v => v.child.timed_out = true, v => v.child.remaining_owned_processes = 1, v => v.cleanup.capacity_release.released = false,
    v => v.host.path_node_version = "0.0.0", v => v.started_at = time(5), v => v.source[0].sha256 = digest("different observed source")]) {
    const f = clone(focused), r = clone(full); mutate(r); f.regression.retained.complete.result = ref(r);
    refuses(() => verifyRegisteredFixtureValidityWindow(p, prior, f, context));
  }
  for (const mutate of [v => v.admissible_regression_witness = true, v => v.synthetic_clock_control = false, v => v.role = "candidate"]) {
    const f = clone(focused), r = parse(f.regression.retained.controlled.observations[0].result); mutate(r);
    f.regression.retained.controlled.observations[0].result = ref(r); refuses(() => verifyRegisteredFixtureValidityWindow(p, prior, f, context));
  }
  for (const [from, to] of [['"ttl_ms":300000', '"ttl_ms":300001'], ['"wall":999999', '"wall":1000000'], ['"group_role":"supervisor"', '"group_role":"manager"']]) {
    const f = clone(focused), c = f.regression.retained.controlled.observations[0]; c.stdout = ref(bytes(c.stdout).toString().replaceAll(from, to));
    refuses(() => verifyRegisteredFixtureValidityWindow(p, prior, f, context));
  }
  for (const [name, text] of [[core, "// changed guard"], [pins[0], "{}"], [OWNER, source.replace("- 1_000", "- 2_000")],
    [suite, file(suite).toString().replace('timeoutMs: 60_000,', 'timeoutMs: 60_001,')]]) {
    const oldValue = versions.get(target).get(name); versions.get(target).set(name, Buffer.from(text));
    refuses(() => fixtureValidityWindowSourceEquivalence(git, before, corrected, target)); versions.get(target).set(name, oldValue);
  }
  for (const text of [source.replace("- 1_000", "+ 1_000"), source.replace('assert.equal(f.effects(), 1);', 'assert.equal(f.effects(), 0);'),
    source.replace("assert(!fs.existsSync(root));", "assert(+fs.existsSync(root));"), source.replace("effects++;", "effects--;")]) {
    assert.notEqual(text, source);
    const originalValue = versions.get(corrected).get(OWNER), targetValue = versions.get(target).get(OWNER);
    // Both candidate snapshots carry the mutation: refusal must come from the
    // predecessor-to-correction semantic recipe, not later byte inequality.
    versions.get(corrected).set(OWNER, Buffer.from(text)); versions.get(target).set(OWNER, Buffer.from(text));
    refuses(() => fixtureValidityWindowSourceEquivalence(git, before, corrected, target));
    versions.get(corrected).set(OWNER, originalValue); versions.get(target).set(OWNER, targetValue);
  }
  const legacy = clone(original); legacy.integration_base.contract = "augnes.local-canonical-integration-base.v1";
  refuses(() => verifyRegisteredFixtureValidityWindow(p, prior, focused, { ...context, original: legacy }));
  for (const mutate of [v => v.phases[0].timed_out = true, v => v.phases[0].log.truncated = true,
    v => v.phases[0].log.relative_path = "foreign.log", v => v.phases = []]) {
    const v = clone(original); mutate(v); refuses(() => verifyRegisteredFixtureValidityWindow(p, prior, focused, { ...context, original: v }));
  }
  for (const changedLog of [failedLog.replace(failureLabel, "unrelated child"), failedLog.replace("timed_out=false", "timed_out=true"),
    failedLog.replace("companion_service_recovery_decision_stale", "unrelated_error"), failedLog.slice(0, -20),
    "PublicCompanionServiceError: companion_service_recovery_decision_stale\n" + failedLog.replace("PublicCompanionServiceError: companion_service_recovery_decision_stale\n", "")]) {
    const f = clone(focused), o = clone(original); f.regression.incident.log = ref(changedLog);
    f.regression.incident.log_identity = { relative_path: logPath, bytes: Buffer.byteLength(changedLog), sha256: digest(changedLog) };
    o.phases[0].log.bytes = Buffer.byteLength(changedLog);
    // Matching a forged reference is not enough: the immutable physical log is
    // checked too. A matching synthetic physical copy still fails attribution.
    refuses(() => verifyRegisteredFixtureValidityWindow(p, prior, f, { ...context, original: o }));
    writeFileSync(path.join(resource.root, logPath), changedLog, { mode: 0o600 });
    refuses(() => verifyRegisteredFixtureValidityWindow(p, prior, f, { ...context, original: o }));
    writeFileSync(path.join(resource.root, logPath), failedLog, { mode: 0o600 });
  }
  refuses(() => verifyRegisteredFixtureValidityWindow(p, prior, focused, { ...context, original: undefined }));
  for (const attempt_id of ["../foreign", "synthetic/other", "synthetic\\other", ".hidden", "x".repeat(241)])
    refuses(() => verifyRegisteredFixtureValidityWindow(p, { ...prior, attempt_id }, focused, context));
  for (const commands of [[], [{ command: "node -e true", tested_source_head: target }], [{ command: focused.commands[0].command, tested_source_head: corrected }]])
    refuses(() => verifyRegisteredFixtureValidityWindow(p, prior, { ...focused, commands }, context));
  for (const [proof, f, ctx] of [[p, { ...focused, regression: { ...focused.regression, attribution: "candidate-driver-prior-implicated-source" } }, context],
    [{ ...p, commission: { ...p.commission, evidence_kind: "different-kind" } }, focused, context],
    [p, focused, { ...context, retainedBefore: {} }], [p, focused, { ...context, postPass: true }]])
    refuses(() => verifyGitSourceRepair(proof, prior, f, ctx), /revision_git_regression_invalid/u);
  const bindings = fixtureValidityWindowAuthorityBindings(p);
  const review = { body: ["Source review decision: ACCEPT / RETAIN for prospective qualification.", bindings, MATERIAL_HISTORY_BOUNDARY, "Synthetic reviewer attribution."].join("\n\n") };
  const grant = { body: [FIXTURE_VALIDITY_WINDOW_GRANT, bindings, "Accepted review: https://github.com/hynk-studio/augnes/pull/7#pullrequestreview-3", MATERIAL_HISTORY_BOUNDARY, INTEGRATION_BUDGET_LIMIT].join("\n\n") };
  assert(fixtureValidityWindowAuthorityScope(p, review, grant));
  assert(fixtureValidityWindowDelegation(p).includes("not a deciding execution grant"));
  assert(delegatesMaterialSourceCommission(fixtureValidityWindowDelegation(p), p));
  assert(!delegatesMaterialSourceCommission(fixtureValidityWindowDelegation(p) + "\n\nAuthorize replacement commissions.", p)); refused++;
  for (const changed of [grant.body.replace(target, before), grant.body + "\n\nAuthorize a retry.", grant.body.replace(CLAIM, "historical cause repaired")]) {
    assert(!fixtureValidityWindowAuthorityScope(p, review, { body: changed })); refused++;
  }
  // Synthetic transport/permission records exercise the real authority parser,
  // not a live identity, an authenticated approval or a deciding reservation.
  const predecessor = finalizeReceipt(clone(original)), q = clone(p), user = { login: "synthetic-maintainer", id: 900001, type: "User" };
  q.prior_receipt_fingerprint = predecessor.integrity.content_fingerprint; q.prior_number = 1;
  q.accepted.base = q.base; q.accepted.review = { id: 3, sha256: digest("pending review") };
  q.originals = Object.fromEntries(["receipt", "attempt", "completion", "stock"].map(key => [key, ref("synthetic " + key)]));
  q.source = ref("synthetic source"); q.focused = ref("synthetic focused"); q.inputs.current = ref("synthetic current"); q.inputs.predecessor_sha256 = digest("prior inputs");
  q.commission = { root_family_id: q.prior_family_id, root_number: 1, root_attempt_id: q.prior_attempt_id,
    root_receipt_fingerprint: q.prior_receipt_fingerprint, ordinal: 1, maximum_invocations: 1,
    source_revision: "material-source-correction-v1", evidence_kind: KIND, delegation: { id: 1, sha256: digest("pending delegation") } };
  const delegated = { id: 1, user, author_association: "COLLABORATOR", issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/7",
    created_at: time(20), updated_at: time(20), body: fixtureValidityWindowDelegation(q) };
  q.commission.delegation.sha256 = digest(reviewedRevisionAuthorityObservation(delegated, "task_delegation"));
  const exact = fixtureValidityWindowAuthorityBindings(q);
  const accepted = { id: 3, user, author_association: "COLLABORATOR", state: "COMMENTED", commit_id: q.head,
    pull_request_url: "https://api.github.com/repos/hynk-studio/augnes/pulls/7", submitted_at: time(30),
    body: ["Source review decision: ACCEPT / RETAIN for prospective qualification.", exact, MATERIAL_HISTORY_BOUNDARY,
      "Independent reviewer: synthetic model-only fixture. Recording operator: synthetic maintainer. No external validation."].join("\n\n") };
  const execution = { id: 4, user, author_association: "COLLABORATOR", issue_url: delegated.issue_url, created_at: time(40), updated_at: time(40),
    body: [FIXTURE_VALIDITY_WINDOW_GRANT, exact, "Accepted review: https://github.com/hynk-studio/augnes/pull/7#pullrequestreview-3", MATERIAL_HISTORY_BOUNDARY, INTEGRATION_BUDGET_LIMIT].join("\n\n") };
  q.accepted.review.sha256 = digest(reviewedRevisionAuthorityObservation(accepted, "accepted_revision"));
  q.authorization = { grant_comment_id: 4, grant_sha256: digest(reviewedRevisionAuthorityObservation(execution, "execution_commission")) };
  const permissions = Object.fromEntries(["accepted_revision", "execution_commission", "task_delegation"].map(role => [role, { user: { login: user.login }, permission: "maintain" }]));
  const pr = { number: 7, state: "open", draft: true, merged: false, auto_merge: null,
    head: { sha: q.head, ref: q.branch, repo: { full_name: "hynk-studio/augnes" } },
    base: { sha: "e".repeat(40), ref: "main", repo: { full_name: "hynk-studio/augnes" } } };
  const validate = s => validateReviewedRevisionAuthorityRecords(s.q, s.accepted, s.execution, s.permissions, s.pr, null, null, s.delegated, null, s.predecessor);
  const state = { q, accepted, execution, permissions, pr, delegated, predecessor };
  validate(state); // Only observed main moved; the exact declared target remains.
  validate({ ...state, pr: { ...pr, base: { ...pr.base, sha: q.base } } });
  for (const mutate of [s => s.predecessor = null, s => s.predecessor.integration_base.base_is_ancestor_of_head = false,
    s => s.predecessor = finalizeReceipt({ ...s.predecessor, synthetic_changed: true }),
    s => s.predecessor = finalizeReceipt({ ...s.predecessor, integration_base: { ...s.predecessor.integration_base, contract: "augnes.local-canonical-integration-base.v1" } }),
    s => s.pr.head.sha = before, s => s.pr.head.ref = "codex/other", s => s.pr.base.sha = "not-a-sha", s => s.pr.draft = false,
    s => s.permissions.execution_commission.permission = "read", s => s.accepted.commit_id = before,
    s => s.execution.created_at = s.execution.updated_at = time(25), s => s.execution.updated_at = time(41),
    s => s.q.inputs.inventory_sha256 = digest("other current inventory"), s => s.q.commission.maximum_invocations = 2,
    s => s.q.commission.ordinal = 2, s => s.delegated.body += "\n\nAuthorize replacement commissions."]) {
    const s = clone(state); mutate(s);
    s.q.accepted.review.sha256 = digest(reviewedRevisionAuthorityObservation(s.accepted, "accepted_revision"));
    s.q.authorization.grant_sha256 = digest(reviewedRevisionAuthorityObservation(s.execution, "execution_commission"));
    s.q.commission.delegation.sha256 = digest(reviewedRevisionAuthorityObservation(s.delegated, "task_delegation"));
    refuses(() => validate(s), /revision_/u);
  }
  // The new declared-base rule does not relax a different typed route.
  const unrelated = clone(state); unrelated.q.commission.evidence_kind = REGISTERED_IDENTITY_BUDGET;
  unrelated.delegated.body = identityBudgetDelegation(unrelated.q);
  unrelated.q.commission.delegation.sha256 = digest(reviewedRevisionAuthorityObservation(unrelated.delegated, "task_delegation"));
  const oldBindings = identityBudgetAuthorityBindings(unrelated.q);
  unrelated.accepted.body = ["Source review decision: ACCEPT / RETAIN for prospective qualification.", oldBindings, MATERIAL_HISTORY_BOUNDARY].join("\n\n");
  unrelated.execution.body = [IDENTITY_BUDGET_GRANT, oldBindings, "Accepted review: https://github.com/hynk-studio/augnes/pull/7#pullrequestreview-3", MATERIAL_HISTORY_BOUNDARY, INTEGRATION_BUDGET_LIMIT].join("\n\n");
  unrelated.q.accepted.review.sha256 = digest(reviewedRevisionAuthorityObservation(unrelated.accepted, "accepted_revision"));
  unrelated.q.authorization.grant_sha256 = digest(reviewedRevisionAuthorityObservation(unrelated.execution, "execution_commission"));
  unrelated.pr.base.sha = unrelated.q.base; unrelated.predecessor = null; validate(unrelated);
  unrelated.pr.base.sha = "e".repeat(40); unrelated.predecessor = predecessor;
  refuses(() => validate(unrelated), /revision_published_source_invalid/u);
  // Exercise the unchanged private production scope without introducing a
  // production test API or another material/authority runner. The one exact
  // module load appends exports only; no function body or import is replaced.
  const scopeUrl = new URL("./local-canonical-attempts.mjs?fixture-validity-scope-control", import.meta.url).href;
  let scoped;
  const hook = registerHooks({ load(url, options, next) {
    const loaded = next(url, options);
    return url === scopeUrl ? { ...loaded, source: String(loaded.source) +
      "\nexport { afterRevisionValidation as fixtureReadScope, verifyRevisionOriginals as fixtureOriginals };\n" } : loaded;
  } });
  try { scoped = await import(scopeUrl); } finally { hook.deregister(); }
  const physical = clone(p); physical.prior_number = 1; physical.originals = {};
  for (const [kind, relative, value] of [
    ["attempt", `.augnes-local-verification/families/${p.prior_family_id}/attempt-1.json`, { synthetic: "attempt" }],
    ["completion", `.augnes-local-verification/families/${p.prior_family_id}/completion-1.json`, { synthetic: "completion" }],
    ["receipt", `.augnes-local-verification/receipts/${p.prior_attempt_id}.json`, original],
  ]) {
    const content = JSON.stringify(value), actual = path.join(resource.root, relative);
    mkdirSync(path.dirname(actual), { recursive: true, mode: 0o700 }); writeFileSync(actual, content, { mode: 0o600 });
    physical.originals[kind] = { sha256: digest(content) };
  }
  physical.focused = ref(focused);
  const inspectScope = observe => scoped.fixtureReadScope(observe, () => scoped.fixtureOriginals(resource.root, resource.root, physical,
    path.join(resource.root, "synthetic-material.json")), (_prepared, _current, check) => { check(); return true; });
  assert.equal(await inspectScope(async () => null), true);
  try {
    await assert.rejects(inspectScope(async () => {
      await Promise.resolve(); writeFileSync(path.join(resource.root, logPath), failedLog + "synthetic observer mutation\n", { mode: 0o600 });
    }), /revision_validated_material_changed/u); refused++;
  } finally { writeFileSync(path.join(resource.root, logPath), failedLog, { mode: 0o600 }); }
  console.log(JSON.stringify({ synthetic_reader_controls: true, retained_source_equivalence: true, controlled_not_natural_red: true,
    final_target_authority_scope: true, synthetic_declared_base_publication: true, physical_original_observer_race_refused: true,
    refusals: refused, provider_calls: 0, service_calls: 0 }));
} finally {
  settleCanonicalTestResourceUse(resource, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  assert(cleanupCanonicalTestResources([resource]).every(value => value.completed));
}
console.log("PASS fixture-validity-window evidence: synthetic records, honest limitations, unchanged product/bounds and owned cleanup");
