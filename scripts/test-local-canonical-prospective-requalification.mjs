// Synthetic, offline reader controls. No historical owner, actual model,
// Companion service, network authority or deciding Full is executed.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { digest } from "./local-canonical-inputs.mjs";
import {
  PROSPECTIVE_REQUALIFICATION as KIND, PROSPECTIVE_REQUALIFICATION_OWNER as OWNER,
  PROSPECTIVE_REQUALIFICATION_CLAIM as CLAIM, PROSPECTIVE_REQUALIFICATION_HISTORY_BOUNDARY as HISTORY,
  PROSPECTIVE_REQUALIFICATION_DIAGNOSTIC_SCOPE as DIAGNOSTIC_SCOPE,
  PROSPECTIVE_CURRENT_BASELINE_CONTRACT,
  PROSPECTIVE_REQUALIFICATION_GRANT as GRANT, PROSPECTIVE_REQUALIFICATION_LIMIT as LIMIT,
  PROSPECTIVE_REQUALIFICATION_BENCHMARK as BENCHMARK, prospectiveRequalificationRegisteredOwner,
  isProspectiveRequalification, prospectiveRequalificationDelegation, delegatesProspectiveRequalification,
  prospectiveRequalificationAuthorityBindings, prospectiveRequalificationAuthorityScope,
  prospectiveRequalificationSourceEquivalence, verifyProspectiveRequalification, prospectiveHistoricalRuntime,
} from "./local-canonical-prospective-requalification.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse,
  cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";

const started = performance.now(), resource = createCanonicalTestResourceRoot("ag-resource-test-");
beginCanonicalTestResourceUse(resource);
const clone = structuredClone, before = "1".repeat(40), target = "2".repeat(40), base = "3".repeat(40);
const suite = "scripts/run-canonical-test-suite.mjs", driver = "scripts/run-local-canonical-verification.mjs", attempts = "scripts/local-canonical-attempts.mjs";
const file = name => readFileSync(new URL("../" + name, import.meta.url));
const benchmarkOwner = prospectiveRequalificationRegisteredOwner({ commission: { registered_owner: BENCHMARK } });
const common = new Map([OWNER, benchmarkOwner.owner, suite, driver, attempts, "package.json"].map(name => [name, file(name)]));
const versions = new Map([[before, new Map(common)], [target, new Map(common)]]);
versions.get(target).set("scripts/local-canonical-prospective-requalification.mjs", Buffer.from("// Synthetic support-only source bytes.\n"));
const changed = (a, b) => [...new Set([...versions.get(a).keys(), ...versions.get(b).keys()])].filter(name =>
  !versions.get(a).get(name)?.equals(versions.get(b).get(name) ?? Buffer.alloc(0))).sort();
const git = args => {
  if (args[0] === "show") { const [head, name] = args[1].split(":"); const value = versions.get(head)?.get(name); assert(value, "synthetic Git blob exists"); return value; }
  if (args[0] === "ls-tree") return Buffer.from("100644 blob " + "a".repeat(40) + "\t" + args.at(-1) + "\n");
  if (args[0] === "merge-base") { assert([before, target].indexOf(args[2]) <= [before, target].indexOf(args[3])); return Buffer.alloc(0); }
  if (args[0] === "diff") { const a = args.at(-3), b = args.at(-2), paths = changed(a, b); return args.includes("--name-only") ?
    Buffer.from(paths.join("\0") + (paths.length ? "\0" : "")) : Buffer.from(JSON.stringify(paths.map(name => [name, digest(versions.get(b).get(name) ?? Buffer.alloc(0))]))); }
  throw Error("unexpected synthetic Git operation");
};
let artifactCount = 0, refusals = 0;
const ref = value => {
  const artifact = "synthetic-" + ++artifactCount + ".log", data = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === "string" ? value : JSON.stringify(value));
  writeFileSync(path.join(resource.root, artifact), data, { mode: 0o600 });
  return { artifact, sha256: digest(data) };
};
const bytes = (r, maximum = 2 * 1024 * 1024) => {
  assert(/^[a-z0-9.-]+$/u.test(r.artifact));
  const data = readFileSync(path.join(resource.root, r.artifact));
  assert(data.length <= maximum && digest(data) === r.sha256, "synthetic artifact hash is binding"); return data;
};
const parse = r => JSON.parse(bytes(r));
const historicalRuntime = { contract: "synthetic-runtime", node: { location_fingerprint: digest("node path"),
  observation: { sha256: digest("node bytes"), permission_identity: digest("node permissions"),
    metadata: { device: "16777230", inode: "1", mtime_ns: "2", ctime_ns: "3", bytes: "4" } } },
  headers: { location_fingerprint: digest("headers path"), observation: { inventory_sha256: digest("old headers inventory"),
    content_sha256: digest("headers bytes"), permission_sha256: digest("headers permissions"), bytes: 10, entries: 2 } } };
const currentRuntime = clone(historicalRuntime);
currentRuntime.node.observation.metadata.device = "16777232";
currentRuntime.headers.observation.inventory_sha256 = digest("current headers inventory");
const p = { schema: "augnes.local-canonical-source-correction.v7", kind: "reviewed_revision", branch: "codex/synthetic-prospective",
  base, head: target, tree: "4".repeat(40), pull_request: 7,
  prior_family_id: digest("original family"), prior_number: 1, prior_attempt_id: "2026-07-24T00-00-00-000Z-full-111111111111-synthetic",
  prior_receipt_fingerprint: digest("original failed receipt"),
  inputs: { inventory_sha256: digest("current inventory"), identity_sha256: digest(currentRuntime),
    predecessor_sha256: digest(historicalRuntime), current: ref(currentRuntime) },
  commission: { source_revision: KIND, root_receipt_fingerprint: digest("original failed receipt"), ordinal: 1, maximum_invocations: 1, delegation: { id: 11 } },
  accepted: { head: target, tree: "4".repeat(40), base, review: { id: 12 } } };
const prior = { head: before, attempt_id: p.prior_attempt_id };
const label = "authenticated source-linked continuation admission and fresh managed Start contract";
const failedLog = `[canonical:unit] child_start label=${JSON.stringify(label)} timeout_ms=60000\n` +
  `[canonical:unit] child_active label=${JSON.stringify(label)} elapsed_ms=30003\n` +
  `[canonical:unit] child_result label=${JSON.stringify(label)} duration_ms=60178 exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n` +
  "AggregateError: canonical_child_timeout\n";
const logPath = `.augnes-local-verification/logs/${p.prior_attempt_id}/unit.log`;
mkdirSync(path.dirname(path.join(resource.root, logPath)), { recursive: true, mode: 0o700 });
writeFileSync(path.join(resource.root, logPath), failedLog, { mode: 0o600 });
const historicalState = { status: "live", checkout_relation: "exact", service_identity: "sha256:" + digest("installed service"),
  preservation_valid: true, preservation_binding: digest("historical service observation") };
const currentBaseline = { contract: PROSPECTIVE_CURRENT_BASELINE_CONTRACT, observed_at: "2026-07-24T00:00:02.000Z",
  runtime_inputs_sha256: p.inputs.identity_sha256, inventory_sha256: p.inputs.inventory_sha256,
  companion: { ...historicalState, preservation_binding: digest("current service observation") } };
const original = { inputs: { binding: { runtime_inputs: historicalRuntime } }, cleanup: { companion_service: { after: historicalState } },
  final: { reason_codes: ["phase_failed", "selected_phases_incomplete"] }, phases: [{ id: "unit", status: "failure", command: "npm test", exit_status: 1, timed_out: false,
  cleanup: { completed: true, exit_observed: true, streams_closed: true, remaining_owned_processes: 0, termination_reason: "natural_exit" },
  log: { relative_path: logPath, bytes: Buffer.byteLength(failedLog), truncated: false } }] };
const completion = { disposition: "product_failure", cleanup_complete: true, infrastructure_code: null, finished_at: "2026-07-24T00:00:01.000Z" };
const context = { git, parse, bytes, original, completion, repositoryRoot: resource.root };
const focused = { failed_phase: "unit", input_remedy_resources: [], finished_at: "2026-07-24T00:00:03.000Z",
  commands: [{ command: "node --import tsx scripts/test-local-canonical-prospective-requalification.mjs", tested_source_head: target }],
  prospective: { kind: KIND, claim: CLAIM, owner: OWNER,
    incident: { receipt: p.prior_receipt_fingerprint, log: ref(failedLog),
      log_identity: { relative_path: logPath, bytes: Buffer.byteLength(failedLog), sha256: digest(failedLog) }, cause: "UNKNOWN" },
    retained: { scope: DIAGNOSTIC_SCOPE, artifacts: ["runner", "observer", "result", "stdout"].map(role => ({ role, original: ref("Synthetic retained " + role + " bytes; never executed or claimed as qualification.\n") })) },
    equivalence: null, current: ref(currentBaseline) } };
const refuses = work => { assert.throws(work); refusals++; };
try {
  const derived = prospectiveRequalificationSourceEquivalence(git, before, target);
  focused.prospective.equivalence = ref(derived);
  assert.equal(derived.registration.bound_ms, 60000); assert.equal(derived.planner.phases.length, 16);
  assert.deepEqual(verifyProspectiveRequalification(p, prior, focused, context), { equivalence: derived, current: currentBaseline });
  // Historical absence retains the original owner, wire and equivalence form.
  assert.equal(prospectiveRequalificationRegisteredOwner(p).owner, OWNER);
  assert.deepEqual(Object.keys(derived.registration).sort(), ["bound_ms", "command", "label", "suite_remainder_sha256"]);
  assert(prospectiveRequalificationDelegation(p).includes("registered continuation-admission owner, complete workload, assertions, original 60000 ms child bound"));
  assert(!prospectiveRequalificationAuthorityBindings(p, digest("legacy target")).includes("Registered owner:"));
  {
    const q = clone(p); q.commission.registered_owner = BENCHMARK;
    const f = clone(focused), o = clone(original);
    const modelLog = failedLog.replaceAll(label, benchmarkOwner.label).replaceAll("60000", "90000").replaceAll("60178", "90178");
    const modelEquivalence = prospectiveRequalificationSourceEquivalence(git, before, target, BENCHMARK);
    assert.equal(modelEquivalence.owner.path, benchmarkOwner.owner);
    assert.equal(modelEquivalence.registration.command, benchmarkOwner.command);
    assert.equal(modelEquivalence.registration.bound_ms, 90000);
    f.prospective.owner = benchmarkOwner.owner; f.prospective.equivalence = ref(modelEquivalence);
    f.prospective.incident.log = ref(modelLog);
    f.prospective.incident.log_identity = { relative_path: logPath, bytes: Buffer.byteLength(modelLog), sha256: digest(modelLog) };
    o.phases[0].log.bytes = Buffer.byteLength(modelLog);
    const setLog = text => {
      const altered = clone(f), receipt = clone(o);
      altered.prospective.incident.log = ref(text);
      altered.prospective.incident.log_identity = { relative_path: logPath, bytes: Buffer.byteLength(text), sha256: digest(text) };
      receipt.phases[0].log.bytes = Buffer.byteLength(text);
      writeFileSync(path.join(resource.root, logPath), text, { mode: 0o600 });
      return { altered, receipt };
    };
    writeFileSync(path.join(resource.root, logPath), modelLog, { mode: 0o600 });
    assert.deepEqual(verifyProspectiveRequalification(q, prior, f, { ...context, original: o }), { equivalence: modelEquivalence, current: currentBaseline });
    for (const mutate of [v => delete v.commission.registered_owner, v => v.commission.registered_owner = "continuation-admission",
      v => v.commission.registered_owner = "other-owner", v => v.commission.registered_owner = undefined,
      v => v.commission.registered_owner = { ...benchmarkOwner }]) {
      const candidate = clone(q); mutate(candidate);
      refuses(() => verifyProspectiveRequalification(candidate, prior, f, { ...context, original: o }));
    }
    for (const mutate of [v => v.prospective.owner = OWNER, v => v.prospective.equivalence = ref(derived),
      v => v.failed_phase = "authority", v => v.prospective.bound_ms = 90000]) {
      const altered = clone(f); mutate(altered);
      refuses(() => verifyProspectiveRequalification(q, prior, altered, { ...context, original: o }));
    }
    const wrongCommand = clone(o); wrongCommand.phases[0].command = benchmarkOwner.command;
    refuses(() => verifyProspectiveRequalification(q, prior, f, { ...context, original: wrongCommand }));
    for (const text of [modelLog.replaceAll(benchmarkOwner.label, label), modelLog.replace("timeout_ms=90000", "timeout_ms=60000"),
      modelLog.replace("duration_ms=90178", "duration_ms=89178"), modelLog.replaceAll("[canonical:unit]", "[canonical:authority]"),
      modelLog.replace("[canonical:unit] child_active", "unclassified product payload\n[canonical:unit] child_active"),
      ...["AssertionError [ERR_ASSERTION]", "input_invalidation", "safety_violation", "revision_current_preservation_unsafe"].map(error => modelLog + error + "\n")]) {
      const { altered, receipt } = setLog(text);
      refuses(() => verifyProspectiveRequalification(q, prior, altered, { ...context, original: receipt }));
    }
    writeFileSync(path.join(resource.root, logPath), modelLog, { mode: 0o600 });
    // Even matching changes at both endpoints cannot redefine a closed owner.
    const source = file(suite).toString();
    for (const replacement of [
      source.replace('...rootNode("scripts/test-model-host-succession-benchmark.ts"),\n      timeoutMs: 90_000,', '...rootNode("scripts/test-model-host-succession-benchmark.ts"),\n      timeoutMs: 90_001,'),
      source.replace(benchmarkOwner.label, "other benchmark label"),
      source.replace('args: ["--import", "tsx", ...args]', 'args: ["--import", "tsx", "--skip", ...args]'),
    ]) {
      assert.notEqual(replacement, source);
      versions.get(before).set(suite, Buffer.from(replacement)); versions.get(target).set(suite, Buffer.from(replacement));
      refuses(() => prospectiveRequalificationSourceEquivalence(git, before, target, BENCHMARK));
      versions.get(before).set(suite, file(suite)); versions.get(target).set(suite, file(suite));
    }
    const plan = file(driver).toString(), alteredPlan = plan.replace('npmPhase("unit", "Canonical unit suite", ["test"], 3_600_000)', 'npmPhase("unit", "Canonical unit suite", ["test:other"], 3_600_000)');
    assert.notEqual(alteredPlan, plan);
    versions.get(before).set(driver, Buffer.from(alteredPlan)); versions.get(target).set(driver, Buffer.from(alteredPlan));
    refuses(() => prospectiveRequalificationSourceEquivalence(git, before, target, BENCHMARK));
    versions.get(before).set(driver, file(driver)); versions.get(target).set(driver, file(driver));
    const key = digest("benchmark preparation"), text = prospectiveRequalificationAuthorityBindings(q, key);
    assert(text.includes("Registered owner: " + BENCHMARK)); assert(text.includes("Registered child bound: 90000 ms"));
    const review = { body: ["Source review decision: ACCEPT / RETAIN for prospective qualification.", text, HISTORY,
      "Independent reviewer: synthetic separate model. Recording operator: synthetic maintainer. Source, evidence and preparation review only; not external or reference-host validation."].join("\n\n") };
    const grant = { body: [GRANT, text, "Accepted review: https://github.com/hynk-studio/augnes/pull/7#pullrequestreview-12", HISTORY, LIMIT].join("\n\n") };
    assert(prospectiveRequalificationAuthorityScope(q, review, grant, key));
    assert(delegatesProspectiveRequalification(prospectiveRequalificationDelegation(q), q));
    assert.equal(delegatesProspectiveRequalification(prospectiveRequalificationDelegation(p), q), false); refusals++;
    assert.equal(delegatesProspectiveRequalification(prospectiveRequalificationDelegation(q).replace("90000", "60000"), q), false); refusals++;
    assert.equal(prospectiveRequalificationAuthorityScope(p, review, grant, key), false); refusals++;
    writeFileSync(path.join(resource.root, logPath), failedLog, { mode: 0o600 });
    assert.deepEqual(verifyProspectiveRequalification(p, prior, focused, context), { equivalence: derived, current: currentBaseline });
  }
  const retainedRuntimeIdentity = digest({ currentRuntime, historicalRuntime, original, p });
  assert.strictEqual(prospectiveHistoricalRuntime(p, original, currentRuntime), historicalRuntime);
  assert.deepEqual(parse(p.inputs.current), currentRuntime);
  assert.equal(digest({ currentRuntime, historicalRuntime, original, p }), retainedRuntimeIdentity);
  const ordinary = clone(p); ordinary.commission.source_revision = "material-source-correction-v1";
  assert.strictEqual(prospectiveHistoricalRuntime(ordinary, null, currentRuntime), currentRuntime);
  const identical = clone(p); identical.inputs.identity_sha256 = digest(historicalRuntime);
  assert.strictEqual(prospectiveHistoricalRuntime(identical, original, historicalRuntime), historicalRuntime);
  for (const [proof, receipt, inputs] of [[p, original, historicalRuntime], [p, {}, currentRuntime],
    [{ ...p, inputs: { ...p.inputs, predecessor_sha256: digest("different predecessor") } }, original, currentRuntime],
    [p, { inputs: { binding: { runtime_inputs: {} } } }, currentRuntime]])
    refuses(() => prospectiveHistoricalRuntime(proof, receipt, inputs));
  for (const mutate of [r => r.contract += "-changed", r => r.node.location_fingerprint = digest("other node path"),
    r => r.node.observation.sha256 = digest("other node bytes"), r => r.node.observation.permission_identity = digest("other permissions"),
    r => r.node.observation.metadata.inode = "99", r => r.node.observation.metadata.mtime_ns = "99", r => r.node.observation.metadata.ctime_ns = "99",
    r => r.node.observation.metadata.bytes = "99", r => r.headers.location_fingerprint = digest("other headers path"),
    r => r.headers.observation.content_sha256 = digest("other headers bytes"), r => r.headers.observation.permission_sha256 = digest("other header permissions"),
    r => r.headers.observation.entries++, r => r.headers.observation.bytes++]) {
    const changedRuntime = clone(currentRuntime); mutate(changedRuntime);
    const q = clone(p); q.inputs.identity_sha256 = digest(changedRuntime);
    refuses(() => prospectiveHistoricalRuntime(q, original, changedRuntime));
  }
  for (const status of ["live", "installed_stopped"]) {
    const current = clone(currentBaseline); current.companion.status = status;
    const f = clone(focused); f.prospective.current = ref(current);
    assert.deepEqual(verifyProspectiveRequalification(p, prior, f, context).current, current);
  }
  for (const mutate of [c => c.contract = "unknown", c => delete c.observed_at, c => c.observed_at = 0,
    c => c.observed_at = "unobserved", c => c.observed_at = completion.finished_at,
    c => c.observed_at = "2026-07-24T00:00:00.000Z", c => c.observed_at = "2026-07-24T00:00:04.000Z",
    c => c.runtime_inputs_sha256 = p.inputs.predecessor_sha256, c => c.inventory_sha256 = digest("wrong current inventory"),
    c => c.companion.status = "recovery_required", c => c.companion.checkout_relation = "foreign",
    c => c.companion.preservation_valid = false, c => c.companion.service_identity = "malformed",
    c => c.companion.service_identity = "sha256:" + digest("foreign service"), c => c.companion.preservation_binding = "malformed",
    c => delete c.companion.preservation_binding, c => c.companion.extra = "undeclared", c => c.extra = "undeclared"]) {
    const current = clone(currentBaseline); mutate(current);
    const f = clone(focused); f.prospective.current = ref(current);
    refuses(() => verifyProspectiveRequalification(p, prior, f, context));
  }
  assert.equal(isProspectiveRequalification(p), true);
  for (const mutate of [v => v.schema = "augnes.local-canonical-source-correction.v5", v => v.commission.source_revision = "material-source-correction-v1",
    v => v.commission.source_revision = "unknown", v => delete v.commission.source_revision, v => delete v.inputs.inventory_sha256,
    v => v.commission.route = "serial-aggregate-budget-v1"]) {
    const q = clone(p); mutate(q); assert.equal(isProspectiveRequalification(q), false); refusals++;
  }
  for (const mutate of [f => f.regression = { kind: "natural-red-green" }, f => delete f.prospective,
    f => delete f.prospective.current, f => f.prospective.current.sha256 = digest("changed current artifact"),
    f => f.prospective.claim = "historical timeout repaired", f => f.prospective.owner = "scripts/other.ts",
    f => f.prospective.kind = "material-source-correction-v1", f => f.prospective.incident.cause = "proven scheduling delay",
    f => f.prospective.incident.receipt = digest("older receipt"), f => f.failed_phase = "integration",
    f => f.input_remedy_resources = ["node-executable"], f => f.commands[0].tested_source_head = before,
    f => f.prospective.retained.scope = "qualification PASS", f => f.prospective.retained.artifacts.pop(),
    f => f.prospective.retained.artifacts[0].role = "stdout", f => f.prospective.retained.artifacts[0].original = ref(""),
    f => f.prospective.equivalence = ref({ ...derived, limitations: "historical runtime proved" }),
    f => f.prospective.extra = "undeclared field"]) {
    const f = clone(focused); mutate(f); refuses(() => verifyProspectiveRequalification(p, prior, f, context));
  }
  for (const mutate of [q => q.commission.evidence_kind = "registered-fixture-validity-window-v1", q => q.commission.allowance_case = "maintenance"]) {
    const q = clone(p); mutate(q); refuses(() => verifyProspectiveRequalification(q, prior, focused, context));
  }
  for (const patch of [{ disposition: "safety_violation" }, { cleanup_complete: false }, { infrastructure_code: "EAGAIN" }])
    refuses(() => verifyProspectiveRequalification(p, prior, focused, { ...context, completion: { ...completion, ...patch } }));
  for (const mutate of [o => o.phases[0].timed_out = true, o => o.phases[0].cleanup.completed = false,
    o => o.phases[0].cleanup.remaining_owned_processes = 1, o => o.phases[0].exit_status = 0,
    o => o.phases[0].log.truncated = true, o => o.phases[0].log.relative_path = "other.log",
    o => o.final.reason_codes.push("interrupted")]) {
    const o = clone(original); mutate(o); refuses(() => verifyProspectiveRequalification(p, prior, focused, { ...context, original: o }));
  }
  for (const text of [failedLog.replace(label, "wrong child"), failedLog.replace("timeout_ms=60000", "timeout_ms=90000"),
    failedLog.replace("signal=SIGTERM", "signal=null"), failedLog.replace("exit_code=null", "exit_code=1"),
    failedLog.replace("timed_out=true", "timed_out=false"), failedLog.replace("duration_ms=60178", "duration_ms=40178"),
    failedLog.replace("cleanup_completed=true", "cleanup_completed=false"), failedLog.replace("remaining_owned_processes=0", "remaining_owned_processes=1"),
    failedLog.replace("child_active", "AssertionError [ERR_ASSERTION] child_active"), failedLog + "AssertionError [ERR_ASSERTION]: outer assertion\n",
    failedLog + '[canonical:unit] child_start label="another child" timeout_ms=60000\n',
    failedLog.replace("canonical_child_timeout", "unrelated_failure"), failedLog.slice(0, -60)]) {
    const f = clone(focused), o = clone(original);
    f.prospective.incident.log = ref(text); f.prospective.incident.log_identity = { relative_path: logPath, bytes: Buffer.byteLength(text), sha256: digest(text) };
    o.phases[0].log.bytes = Buffer.byteLength(text);
    // Even internally coherent, hash-bound mutations must fail attribution.
    writeFileSync(path.join(resource.root, logPath), text, { mode: 0o600 });
    refuses(() => verifyProspectiveRequalification(p, prior, f, { ...context, original: o }));
    writeFileSync(path.join(resource.root, logPath), failedLog, { mode: 0o600 });
  }
  writeFileSync(path.join(resource.root, logPath), failedLog + "changed", { mode: 0o600 });
  refuses(() => verifyProspectiveRequalification(p, prior, focused, context));
  writeFileSync(path.join(resource.root, logPath), failedLog, { mode: 0o600 });
  for (const [name, replacement] of [[OWNER, "// Different actual workload\n"], ["package.json", "{}\n"],
    [suite, file(suite).toString().replace('...rootNode("scripts/test-operational-continuation-admission.ts"),', '...rootNode("scripts/test-operational-continuation-admission.ts", "--skip-refusals"),')],
    [suite, file(suite).toString().replace('timeoutMs: 60_000,', 'timeoutMs: 60_001,')],
    [driver, file(driver).toString().replace('npmPhase("unit", "Canonical unit suite", ["test"], 3_600_000)', 'npmPhase("unit", "Canonical unit suite", ["test"], 3_600_001)')],
    [driver, file(driver).toString().replace('const completed = await runPhasesSequentially({', 'const completed = await skipPhasesSequentially({')],
    [attempts, file(attempts).toString().replace('"e2e-golden"]);', '"e2e-other"]);')]]) {
    const saved = versions.get(target).get(name); assert.notEqual(saved.toString(), replacement);
    versions.get(target).set(name, Buffer.from(replacement));
    refuses(() => prospectiveRequalificationSourceEquivalence(git, before, target)); versions.get(target).set(name, saved);
  }
  const newProduct = "lib/new-product.ts"; versions.get(target).set(newProduct, Buffer.from("export const changed = true;\n"));
  refuses(() => prospectiveRequalificationSourceEquivalence(git, before, target)); versions.get(target).delete(newProduct);
  // The otherwise exact allowed object must be a direct suites.unit element.
  // In particular, stripping an object injected into rootNode arguments would
  // conceal a real command change if AST location were ignored.
  const suiteSource = file(suite).toString(), controlStart = suiteSource.indexOf('      id: "prospective-requalification-evidence"');
  assert(controlStart > 0);
  const objectStart = suiteSource.lastIndexOf("    {", controlStart), objectEnd = suiteSource.indexOf("    },", controlStart) + 5;
  const controlObject = suiteSource.slice(objectStart, objectEnd).trim();
  const withoutControl = suiteSource.slice(0, objectStart) + suiteSource.slice(objectEnd + 1);
  assert(!withoutControl.includes('id: "prospective-requalification-evidence"'));
  for (const injected of [
    withoutControl.replace('rootNode("scripts/test-local-canonical-fixture-validity.mjs")', 'rootNode(' + controlObject + ', "scripts/test-local-canonical-fixture-validity.mjs")'),
    withoutControl.replace("  authority: [", "  authority: [" + controlObject + ","),
    withoutControl.replace("  unit: [", "  unit: [[" + controlObject + ",],"),
  ]) {
    assert.notEqual(injected, withoutControl);
    versions.get(target).set(suite, Buffer.from(injected));
    refuses(() => prospectiveRequalificationSourceEquivalence(git, before, target));
    versions.get(target).set(suite, common.get(suite));
  }
  const targetKey = digest("synthetic exact preparation"), bindings = prospectiveRequalificationAuthorityBindings(p, targetKey);
  const review = { body: ["Source review decision: ACCEPT / RETAIN for prospective qualification.", bindings, HISTORY,
    "Independent reviewer: synthetic separate model. Recording operator: synthetic maintainer. Source, evidence and preparation review only; not external or reference-host validation."].join("\n\n") };
  const grant = { body: [GRANT, bindings, "Accepted review: https://github.com/hynk-studio/augnes/pull/7#pullrequestreview-12", HISTORY, LIMIT].join("\n\n") };
  const delegation = prospectiveRequalificationDelegation(p);
  assert(delegatesProspectiveRequalification(delegation, p));
  assert(prospectiveRequalificationAuthorityScope(p, review, grant, targetKey));
  for (const body of ["Investigate only.\n\n" + delegation, "```text\n" + delegation + "\n```", "<!--\n" + delegation + "\n-->",
    delegation.replace("one explicit", "two explicit"), delegation.replace(p.prior_attempt_id, "old-attempt"), delegation.replace("does not", "does")]) {
    assert.equal(delegatesProspectiveRequalification(body, p), false); refusals++;
  }
  for (const body of ["Decline.\n\n" + grant.body, "```text\n" + grant.body + "\n```", "<!--\n" + grant.body + "\n-->",
    grant.body.replace(targetKey, digest("wrong preparation")), grant.body.replace(HISTORY, "Historical timeout is fixed."),
    grant.body.replace("Exactly one admitted", "At most two admitted"), grant.body.replace("review-12", "review-11"),
    grant.body.replace("explicit prospective requalification", "material source correction")]) {
    assert.equal(prospectiveRequalificationAuthorityScope(p, review, { body }, targetKey), false); refusals++;
  }
  for (const body of [review.body.replace("ACCEPT / RETAIN", "REJECT"), "```text\n" + review.body + "\n```",
    review.body.replace("Independent reviewer:", "Recording only:"), review.body.replace("not external or reference-host validation", "actual Mac qualification PASS")]) {
    assert.equal(prospectiveRequalificationAuthorityScope(p, { body }, grant, targetKey), false); refusals++;
  }
  const inherited = clone(p); inherited.commission.inherited_serial = { route: "serial-aggregate-budget-v1", envelope_sha256: digest("serial envelope"),
    origin_family_id: digest("serial origin"), origin_attempt_id: "original-serial-attempt", origin_receipt_fingerprint: digest("serial receipt"), origin_number: 1 };
  const inheritedText = prospectiveRequalificationAuthorityBindings(inherited, targetKey);
  for (const value of [inherited.commission.inherited_serial.envelope_sha256, inherited.commission.inherited_serial.origin_family_id,
    inherited.commission.inherited_serial.origin_attempt_id, inherited.commission.inherited_serial.origin_receipt_fingerprint,
    "Original timeout, false stock, interrupted child UNKNOWN and all earlier lineage remain unchanged."]) assert(inheritedText.includes(value));
  console.log(JSON.stringify({ test: "local-canonical-prospective-requalification", status: "pass", refusal_controls: refusals,
    synthetic_only: true, historical_owner_executed: false, actual_full_executed: false, elapsed_ms: Math.round(performance.now() - started) }));
} finally {
  settleCanonicalTestResourceUse(resource, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  assert(cleanupCanonicalTestResources([resource])[0].completed);
}
