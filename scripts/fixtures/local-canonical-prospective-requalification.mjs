// Development-only synthetic history. These records exercise real proof,
// authority, preparation, exclusive reservation and cold readers; they are not
// observations of the registered owner, a Mac run or a live execution grant.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { digest } from "../local-canonical-inputs.mjs";
import { prepareProspectiveRequalification, reconstructAttemptTip, reviewedRevisionAuthorityObservation,
  REVIEWED_REVISION_PHASES, validReviewedRevisionAttempt, supportsSourceCorrection, readSourceCorrectionProof,
  validRecoveryProof, readRecoveryProof } from "../local-canonical-attempts.mjs";
import { gitRevisionInventory, GIT_CURRENT_STOCK_COMPARISON, verifyGitRevisionFailure } from "../local-canonical-git-observation.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "../local-canonical-review-export.mjs";
import { canonicalSerialize, finalizeReceipt, inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { dependencyRecords, executeFixture } from "./local-canonical-browser-successor.mjs";
import { PROSPECTIVE_REQUALIFICATION, PROSPECTIVE_REQUALIFICATION_CLAIM,
  PROSPECTIVE_REQUALIFICATION_HISTORY_BOUNDARY, PROSPECTIVE_REQUALIFICATION_GRANT,
  PROSPECTIVE_REQUALIFICATION_LIMIT, PROSPECTIVE_REQUALIFICATION_OWNER,
  PROSPECTIVE_REQUALIFICATION_DIAGNOSTIC_SCOPE, PROSPECTIVE_CURRENT_BASELINE_CONTRACT,
  prospectiveHistoricalRuntime, prospectiveRequalificationSourceEquivalence, prospectiveRequalificationRegisteredOwner,
  PROSPECTIVE_REQUALIFICATION_REGISTERED_OWNERS, PROSPECTIVE_REQUALIFICATION_BENCHMARK,
  prospectiveRequalificationDelegation, prospectiveRequalificationAuthorityBindings } from "../local-canonical-prospective-requalification.mjs";

const clone = structuredClone;
const now = () => new Date().toISOString();
const reader = "scripts/test-local-canonical-prospective-requalification.mjs";
const natural = { exit_code: 0, signal: null, timed_out: false, cancelled: false, spawn_error_code: null,
  exit_observed: true, streams_closed: true, cleanup_started: true, cleanup_completed: true,
  remaining_owned_processes: 0, termination_reason: "natural_exit", duration_ms: 1 };

export function seedProspectiveRequalificationFiles(c, write) {
  // These are inert source snapshots. No owner import, private service, model
  // or canonical suite runs inside this disposable Git repository.
  for (const file of [...PROSPECTIVE_REQUALIFICATION_REGISTERED_OWNERS.map(owner => owner.owner), "scripts/run-canonical-test-suite.mjs",
    "scripts/run-local-canonical-verification.mjs", "scripts/local-canonical-attempts.mjs"])
    write(path.join(c.checkout, file), readFileSync(new URL("../../" + file, import.meta.url)));
}

function snapshot(root) {
  const found = new Map();
  const visit = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file); else found.set(file, readFileSync(file));
    }
  };
  visit(root); return found;
}

export async function runProspectiveRequalificationControls(c, h, registeredOwner) {
  const selected = prospectiveRequalificationRegisteredOwner({ commission: registeredOwner === undefined ? {} : { registered_owner: registeredOwner } });
  const label = selected.label, bound = selected.bound_ms, elapsed = bound + 178;
  let refusals = 0;
  const git = (...args) => c.git(args).toString().trim();
  const tip = () => reconstructAttemptTip({ anchorRoot: c.anchor, repositoryRoot: c.checkout, branch: c.branch });
  const ref = (name, value) => h.artifact(c, name, value);
  const read = reference => h.read(path.join(c.artifacts, reference.artifact));
  const syntheticBehavior = exit => async () => ({ command: "synthetic control; no registered-owner execution",
    tested_source_head: c.head, finished_at: now(), result: { ...natural, exit_code: exit }, output: "synthetic lifecycle control\n" });

  // Complete the existing one-slot material source fixture with a synthetic
  // inner watchdog. The outer unit result remains a naturally settled exit 1.
  const old = h.proof(c), oldCapability = await h.auth(c, old);
  assert.equal(old.commission.maximum_invocations, 1);
  const watchdog = [
    `[canonical:unit] child_start label=${JSON.stringify(label)} timeout_ms=${bound}`,
    `[canonical:unit] child_spawn label=${JSON.stringify(label)} pid=4321 wait=process_exit`,
    `[canonical:unit] child_active label=${JSON.stringify(label)} elapsed_ms=30003 timeout_ms=${bound} exit_observed=false stdout_closed=false stderr_closed=false wait=process_exit`,
    `[canonical:unit] child_cleanup_start label=${JSON.stringify(label)} elapsed_ms=${bound + 4} reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false`,
    `[canonical:unit] child_cleanup_result label=${JSON.stringify(label)} elapsed_ms=${elapsed} reason=bounded_timeout streams_closed=true remaining_owned_processes=0`,
    `[canonical:unit] child_result label=${JSON.stringify(label)} duration_ms=${elapsed} exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout`,
    `Error: child_timed_out:unit:${label}`,
    "  code: 'canonical_child_timeout',",
    JSON.stringify({ suite: "unit", resource_cleanup: [{ completed: true, failure_count: 0, failures: [] }] }),
    "",
  ].join("\n");
  c.failurePhase = "unit";
  const failed = await executeFixture(c, { ...h, behavior: syntheticBehavior(1),
    begin: (subject, proof, capability, extra) => h.begin(subject, proof, capability, { ...extra, runId: "synthetic-settled-watchdog" }),
    decorateReceipt(receipt) {
      receipt.integration_base.contract = "augnes.local-canonical-integration-base.v2";
      const relative = `.augnes-local-verification/logs/${receipt.run.id}/unit.log`;
      h.write(path.join(c.checkout, relative), watchdog);
      receipt.phases.find(phase => phase.id === "unit").log = { relative_path: relative, bytes: Buffer.byteLength(watchdog), truncated: false };
    },
  }, old, oldCapability, null, dependencyRecords(c));
  delete c.failurePhase;
  assert.equal(failed.stock.valid_deciding_evidence, false);
  assert.equal(tip().reviewed_revision_consumed, 1);
  c.prior = failed.receipt;
  const preserved = snapshot(path.join(c.anchor, ".augnes-local-verification"));
  for (const [file, bytes] of snapshot(path.join(c.checkout, ".augnes-local-verification"))) preserved.set(file, bytes);
  const unchanged = () => { for (const [file, bytes] of preserved) assert(readFileSync(file).equals(bytes), "retained original remains unchanged: " + file); };
  const predecessorHead = c.head;

  // A support-only new source target. The control itself is deliberately tiny;
  // the real final reader suite is exercised by the containing test process.
  h.write(path.join(c.checkout, reader), 'console.log("synthetic prospective reader support");\n');
  c.git(["add", reader]);
  c.git(["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "synthetic prospective support"]);
  c.acceptedHead = git("rev-parse", "HEAD"); c.acceptedTree = git("rev-parse", "HEAD^{tree}"); c.grantId = 82;
  // A new assignment observes current metadata and the same installed service
  // with a new preservation binding. Replace snapshots instead of mutating the
  // prior receipt's shared fixture objects or any retained original bytes.
  c.inputs = clone(c.inputs);
  c.inputs.node.observation.metadata.device = "32";
  c.inputs.headers.observation.inventory_sha256 = digest("prospective current header inventory");
  c.gitDeclaration = clone(c.gitDeclaration);
  for (const [id, member] of [["node-executable", "node"], ["node-headers", "headers"]])
    c.gitDeclaration.resources.find(resource => resource.id === id).before = clone(c.inputs[member].observation);
  c.live = clone(c.live);
  c.live.inventory = gitRevisionInventory(c.gitDeclaration);
  c.live.service.state.preservation_binding = digest("prospective current service binding");
  Object.assign(c.live.service.diagnostics, { before_binding: c.live.service.state.preservation_binding,
    after_binding: c.live.service.state.preservation_binding, finished_at: now() });
  assert.notEqual(digest(c.inputs), digest(failed.receipt.inputs.binding.runtime_inputs));
  assert.notEqual(c.live.service.state.preservation_binding, failed.receipt.cleanup.companion_service.after.preservation_binding);
  h.prepare(c);
  const p = c.proof;
  Object.assign(p.commission, { source_revision: PROSPECTIVE_REQUALIFICATION, maximum_invocations: 1,
    input_acquisition: old.commission.input_acquisition });
  if (registeredOwner !== undefined) p.commission.registered_owner = registeredOwner;
  p.inputs.inventory_sha256 = c.live.inventory;
  p.originals.stock = ref("prior-stock.log", JSON.stringify(failed.stock));
  const command = "node --import tsx " + reader;
  const stdout = ref("synthetic-focused.log", "synthetic prospective support PASS; not host qualification\n");
  const result = ref("synthetic-focused.json", { command, tested_source_head: p.head, finished_at: now(), result: natural });
  const equivalence = prospectiveRequalificationSourceEquivalence(c.git, predecessorHead, p.head, registeredOwner);
  const sourceBytes = c.git(["show", p.head + ":" + reader]);
  const relative = `.augnes-local-verification/logs/${c.prior.run.id}/unit.log`;
  const current = { contract: PROSPECTIVE_CURRENT_BASELINE_CONTRACT, observed_at: now(),
    runtime_inputs_sha256: p.inputs.identity_sha256, inventory_sha256: p.inputs.inventory_sha256, companion: clone(c.live.service.state) };
  const focused = { schema: "augnes.local-canonical-reviewed-revision-focused.v1", basis: "implementation_owner_not_independent_review",
    predecessor_receipt_fingerprint: p.prior_receipt_fingerprint, runtime_inputs_sha256: p.inputs.identity_sha256,
    finished_at: now(), remedy: "Explicit future qualification of unchanged product behavior, not a repair of the historical timeout.",
    diagnosis: "The historical watchdog cause remains UNKNOWN; synthetic diagnostic data supplies neither causal repair nor qualification coverage.",
    failed_phase: "unit", implicated_paths: [reader], input_remedy_resources: [],
    source_files: [{ path: reader, byte_size: sourceBytes.length, sha256: digest(sourceBytes) }],
    commands: [{ command, tested_source_head: p.head, result: natural, record: result, stdout }],
    prospective: { kind: PROSPECTIVE_REQUALIFICATION, claim: PROSPECTIVE_REQUALIFICATION_CLAIM,
      owner: selected.owner,
      incident: { receipt: p.prior_receipt_fingerprint, cause: "UNKNOWN", log: ref("watchdog.log", watchdog),
        log_identity: { relative_path: relative, bytes: Buffer.byteLength(watchdog), sha256: digest(watchdog) } },
      retained: { scope: PROSPECTIVE_REQUALIFICATION_DIAGNOSTIC_SCOPE,
        artifacts: ["runner", "observer", "result", "stdout"].map(role => ({ role,
          original: ref("synthetic-diagnostic-" + role + ".log", "synthetic diagnostic " + role + "; no historical causality or coverage\n") })) },
      equivalence: ref("equivalence.json", equivalence), current: ref("current-baseline.json", current) } };
  const verifyHistorical = inputs => verifyGitRevisionFailure(failed.receipt, failed.stock, inputs, REVIEWED_REVISION_PHASES,
    old.commission.ordinal, false, false, false, true);
  assert.throws(() => verifyHistorical(c.inputs), { code: "revision_browser_failure_invalid" }); refusals++;
  assert.doesNotThrow(() => verifyHistorical(prospectiveHistoricalRuntime(p, failed.receipt, c.inputs)));
  p.focused = ref("focused.json", focused);
  p.source = ref("source.json", { ...read(p.source), reviewed_at: now() });
  const authority = clone(c.authority), delegation = { ...authority.grant, id: 80, created_at: now(), body: prospectiveRequalificationDelegation(p) };
  delegation.updated_at = delegation.created_at;
  p.commission.delegation = { id: delegation.id, sha256: digest(reviewedRevisionAuthorityObservation(delegation, "task_delegation")) };
  c.authority = { ...authority, linked: { "repos/hynk-studio/augnes/issues/comments/80": delegation } };
  c.authority.pr.head.sha = p.head;
  const transport = () => ({ pullRequest: async () => clone(c.authority.pr),
    grant: async id => clone([delegation, c.authority.grant].find(record => record.id === id)),
    permission: async login => ({ permission: "admin", user: { login } }) });
  const preparationFile = path.join(c.artifacts, "preparation.json");
  const bindPreparation = candidate => { const material = clone(candidate); delete material.authorization; delete material.accepted.review; delete material.local_relative_path;
    h.write(preparationFile, material); return material; };
  const preparationArgs = live => ({ file: preparationFile, repositoryRoot: c.checkout, predecessorRoot: c.checkout,
    anchorRoot: c.anchor, runtimeInputs: c.inputs, live });
  const prepare = async (candidate = p, live = c.live, api = transport()) => {
    bindPreparation(candidate); return prepareProspectiveRequalification(preparationArgs(live), { transport: api });
  };
  const edge = path.join(c.anchor, ".augnes-local-verification/families", p.prior_family_id, "correction-successor.json");
  const noReservation = () => { assert(!existsSync(edge)); assert.equal(tip().attempt_id, c.prior.run.id); unchanged(); };
  const prepared = await prepare();
  assert.equal(prepared.authorized, false); assert.equal(prepared.reserved, false);
  assert.equal(prepared.consumed, 1); noReservation();
  assert.equal(prepared.runtime_inputs, digest(c.inputs));
  assert.deepEqual(read(p.inputs.current), c.inputs);
  await delay(2);
  const exact = prospectiveRequalificationAuthorityBindings(p, prepared.target);
  const review = { ...authority.review, id: 81, commit_id: p.head, submitted_at: now(), body: [
    "Source review decision: ACCEPT / RETAIN for prospective qualification.", exact, PROSPECTIVE_REQUALIFICATION_HISTORY_BOUNDARY,
    "Independent reviewer: synthetic reviewer. Recording operator: synthetic operator. Source, evidence and preparation review only; not external or reference-host validation.",
  ].join("\n\n") };
  p.accepted.review = { id: review.id, sha256: digest(reviewedRevisionAuthorityObservation(review, "accepted_revision")) };
  await delay(2);
  const grant = { ...authority.grant, id: 82, created_at: now(), body: [PROSPECTIVE_REQUALIFICATION_GRANT, exact,
    "Accepted review: https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-81",
    PROSPECTIVE_REQUALIFICATION_HISTORY_BOUNDARY, PROSPECTIVE_REQUALIFICATION_LIMIT,
  ].join("\n\n") };
  grant.updated_at = grant.created_at;
  p.authorization = { grant_comment_id: grant.id, grant_sha256: digest(reviewedRevisionAuthorityObservation(grant, "execution_commission")) };
  c.authority.review = review; c.authority.grant = grant;
  const bind = () => h.write(c.file, p); bind();
  let parsed = h.proof(c), capability = await h.auth(c, parsed);
  assert.equal((await prepare()).target, prepared.target); noReservation();

  // A recognized prospective marker cannot select a permissive legacy reader
  // or be represented as infrastructure recovery. Require the early guard's
  // exact reason, not an incidental missing-artifact/schema failure.
  const marker = { commission: { source_revision: PROSPECTIVE_REQUALIFICATION } };
  const mixedRoute = { code: "prospective_requalification_mixed_route" };
  for (const [index, legacy] of [
    { schema: "augnes.local-canonical-source-correction.v1" },
    ...["source_revision", "verifier_correction", "accepted_main_integration", "behavior_preserving_improvement", "prospective_maintenance"]
      .map(kind => ({ schema: "augnes.local-canonical-source-correction.v2", kind })),
  ].entries()) {
    const mixed = { ...legacy, ...clone(marker) }, file = path.join(c.artifacts, `mixed-legacy-${index}.json`);
    assert.equal(supportsSourceCorrection(mixed), false);
    h.write(file, mixed);
    assert.throws(() => readSourceCorrectionProof(file, c.checkout), mixedRoute); refusals++;
    const selectorOnly = { ...legacy, commission: { registered_owner: PROSPECTIVE_REQUALIFICATION_BENCHMARK } };
    const selectorFile = path.join(c.artifacts, `mixed-selector-${index}.json`); h.write(selectorFile, selectorOnly);
    assert.equal(supportsSourceCorrection(selectorOnly), false);
    assert.throws(() => readSourceCorrectionProof(selectorFile, c.checkout), mixedRoute); refusals++;
  }
  for (const mutate of [q => delete q.inputs.inventory_sha256, q => q.commission.route = "other-route"]) {
    const mixed = clone(p); mutate(mixed);
    assert.equal(supportsSourceCorrection(mixed), false);
    const file = path.join(c.artifacts, "mixed-unbound.json"); h.write(file, mixed);
    assert.throws(() => readSourceCorrectionProof(file, c.checkout), mixedRoute); refusals++;
  }
  const repairPrior = { attempt_id: "synthetic-spawn-failure", receipt_fingerprint: digest("synthetic failed spawn"),
    infrastructure_code: "ENOENT", finished_at: new Date(0).toISOString() };
  const cause = ref("recovery-cause.json", { prior_receipt_fingerprint: repairPrior.receipt_fingerprint, spawn_error_code: "ENOENT" });
  const probe = ref("recovery-probe.json", natural);
  const recovery = { schema: "augnes.local-canonical-infrastructure-repair.v1", prior_attempt_id: repairPrior.attempt_id,
    prior_receipt_fingerprint: repairPrior.receipt_fingerprint, cause: "child_spawn_failure", observed_code: "ENOENT",
    remedy: "task_owned_synthetic_setup", evidence_sha256: cause.sha256, cause_artifact: cause.artifact,
    probe_artifact: probe.artifact, probe: { exit_status: 0, cleanup_complete: true, artifact_sha256: probe.sha256, finished_at: now() },
    scope: "task_owned" };
  const repairFile = path.join(c.artifacts, "recovery-reader.json"); h.write(repairFile, recovery);
  assert(validRecoveryProof(recovery, repairPrior)); assert.deepEqual(readRecoveryProof(repairFile), recovery);
  for (const mutate of [q => Object.assign(q, clone(marker)), q => q.source_correction = clone(marker),
    q => q.recovery = clone(marker), q => q.attempt = { repair: clone(marker) }]) {
    const mixed = clone(recovery); mutate(mixed); h.write(repairFile, mixed);
    assert.equal(validRecoveryProof(mixed, repairPrior), false);
    assert.throws(() => readRecoveryProof(repairFile), mixedRoute); refusals++;
  }
  const ordinaryExport = createPrivateReviewExport(failed.receipt);
  assert(inspectPrivateReviewExport(ordinaryExport).structurally_valid);
  assert(!inspectReceiptForDecision(failed.receipt).issues.includes("receipt_prospective_requalification_invalid"));
  for (const mutate of [r => Object.assign(r, clone(marker)), r => Object.assign(r.attempt, clone(marker)),
    r => r.attempt.source_correction = { schema: "augnes.local-canonical-source-correction.v1", ...clone(marker) },
    r => r.recovery = clone(marker), r => r.attempt.recovery = clone(marker), r => r.attempt.repair = clone(marker)]) {
    const mixed = clone(failed.receipt); mutate(mixed);
    const inspected = inspectReceiptForDecision(finalizeReceipt(mixed));
    assert(inspected.issues.includes("receipt_prospective_requalification_invalid"));
    assert.equal(inspected.valid_deciding_evidence, false);
    assert.throws(() => createPrivateReviewExport(mixed), /review_export_prospective_requalification_requires_original/u);
    const projected = clone(ordinaryExport); mutate(projected); delete projected.export_fingerprint;
    projected.export_fingerprint = digest(canonicalSerialize(projected));
    assert.equal(inspectPrivateReviewExport(projected).structurally_valid, false); refusals++;
  }
  noReservation();

  for (const mutate of [q => delete q.commission.source_revision, q => q.commission.source_revision = "material-source-correction-v1",
    q => q.commission.source_revision = "unknown", q => q.commission.ordinal = 2, q => q.commission.maximum_invocations = 2,
    q => q.commission.evidence_kind = "registered-fixture-validity-window-v1", q => q.commission.forward_decision = { id: 80, sha256: digest("forward") },
    q => q.branch += "-renamed", q => q.prior_attempt_id = "older-tip", q => q.inputs.inventory_sha256 = digest("other-input"),
    q => q.commission.registered_owner = "arbitrary-owner", q => q.commission.registered_owner = null,
    q => registeredOwner === undefined ? q.commission.registered_owner = PROSPECTIVE_REQUALIFICATION_BENCHMARK : delete q.commission.registered_owner]) {
    const altered = clone(p); mutate(altered); await assert.rejects(() => prepare(altered)); refusals++; noReservation();
  }
  for (const mutate of [v => v.runtime_inputs_sha256 = p.inputs.predecessor_sha256,
    v => v.inventory_sha256 = digest("stale current baseline inventory"), v => v.observed_at = read(p.originals.completion).finished_at,
    v => v.companion.service_identity = "sha256:" + digest("foreign installed service"),
    v => v.companion.preservation_binding = "invalid", v => v.companion.preservation_binding = digest("stale current binding"),
    v => v.companion.checkout_relation = "foreign",
    v => v.companion.preservation_valid = false, v => v.extra = "undeclared baseline field"]) {
    const baseline = clone(current); mutate(baseline);
    const altered = clone(p), f = clone(focused);
    f.prospective.current = ref("refused-current-baseline.json", baseline);
    altered.focused = ref("refused-current-focused.json", f);
    await assert.rejects(() => prepare(altered)); refusals++; noReservation();
  }
  {
    const altered = clone(p), f = clone(focused); delete f.prospective.current;
    altered.focused = ref("missing-current-focused.json", f);
    await assert.rejects(() => prepare(altered)); refusals++; noReservation();
  }
  await assert.rejects(() => prepare(p, { ...c.live, inventory: digest("changed inventory") })); refusals++; noReservation();
  for (const mutate of [v => v.state.preservation_binding = digest("changed after preparation"),
    v => v.state.service_identity = "sha256:" + digest("changed service after preparation"),
    v => v.state.status = v.state.status === "live" ? "installed_stopped" : "live",
    v => v.diagnostics.coherent = false]) {
    const live = clone(c.live); mutate(live.service);
    live.service.diagnostics.before_binding = live.service.state.preservation_binding;
    live.service.diagnostics.after_binding = live.service.state.preservation_binding;
    await assert.rejects(() => prepare(p, live), { code: "revision_current_preservation_unsafe" }); refusals++; noReservation();
  }
  await assert.rejects(() => prepare(p, c.live, { ...transport(), permission: async login => ({ permission: "read", user: { login } }) })); refusals++; noReservation();
  const oldDelegation = delegation.body;
  delegation.body = "Analyze the future option only; no implementation or execution authority.";
  await assert.rejects(() => prepare()); refusals++; delegation.body = oldDelegation; noReservation();

  // The same actual production seam is exercised after its async observation.
  for (const file of [preparationFile, path.join(c.artifacts, p.focused.artifact),
    path.join(c.anchor, ".augnes-local-verification/families", p.prior_family_id, "completion-1.json")]) {
    bindPreparation(p); const original = readFileSync(file);
    try {
      await assert.rejects(() => prepareProspectiveRequalification(preparationArgs(async () => {
        h.write(file, Buffer.concat([original, Buffer.from("\n")])); return clone(c.live);
      }), { transport: transport() })); refusals++;
    } finally { h.write(file, original); }
    noReservation();
  }
  bindPreparation(p);
  for (const mutate of [v => v.node.observation.sha256 = digest("late runtime replacement"),
    v => v.node.observation.metadata.device = "64", v => v.headers.observation.inventory_sha256 = digest("late header inventory")]) {
    const oldRuntime = clone(c.inputs);
    try {
      await assert.rejects(() => prepareProspectiveRequalification(preparationArgs(async () => {
        mutate(c.inputs); return clone(c.live);
      }), { transport: transport() })); refusals++;
    } finally { c.inputs = oldRuntime; }
  }
  noReservation();

  // A fresh grant must follow review and cannot reuse the predecessor's grant,
  // disappear, change scope, move heads or use a non-maintainer identity.
  for (const mutate of [record => record.body = "ordinary approval", record => record.commit_id = predecessorHead,
    record => record.user.type = "Bot", record => record.submitted_at = new Date(0).toISOString()]) {
    await assert.rejects(() => h.auth(c, parsed, (record, endpoint) => {
      if (endpoint.includes("/reviews/81")) mutate(record); return record;
    })); refusals++; noReservation();
  }
  for (const mutate of [record => record.body += "\nAuthorize another retry.", record => record.created_at = new Date(0).toISOString(),
    record => record.id = old.authorization.grant_comment_id]) {
    await assert.rejects(() => h.auth(c, parsed, (record, endpoint) => {
      if (endpoint.includes("/comments/82")) mutate(record); return record;
    })); refusals++; noReservation();
  }
  assert.throws(() => h.begin(c, parsed, { observations: {} })); refusals++; noReservation();
  for (const mutate of [v => v.state.preservation_binding = digest("changed reservation binding"),
    v => v.state.service_identity = "sha256:" + digest("changed reservation service"),
    v => v.state.status = v.state.status === "live" ? "installed_stopped" : "live"]) {
    const live = clone(c.live); mutate(live.service);
    live.service.diagnostics.before_binding = live.service.state.preservation_binding;
    live.service.diagnostics.after_binding = live.service.state.preservation_binding;
    assert.throws(() => h.begin(c, parsed, capability, { revisionLive: live }), { code: "revision_current_preservation_unsafe" });
    refusals++; noReservation();
  }
  const changedRuntime = clone(c.inputs); changedRuntime.node.observation.metadata.device = "64";
  assert.throws(() => h.begin(c, parsed, capability, { revisionInputs: changedRuntime }), { code: "revision_authenticated_authority_required" });
  refusals++; noReservation();
  await assert.rejects(() => h.begin(c, parsed, capability, { assertCurrent() {}, observeRevision: async () => {
    const file = path.join(c.artifacts, p.focused.artifact), bytes = readFileSync(file);
    h.write(file, Buffer.concat([bytes, Buffer.from("\n")])); return { authorization: capability, live: c.live };
  } })); refusals++;
  h.write(path.join(c.artifacts, p.focused.artifact), focused); noReservation();

  // Restore the exact preparation source after negative controls and reserve
  // once. A new physical process independently validates synthetic success.
  bind(); parsed = h.proof(c); capability = await h.auth(c, parsed);
  const browserExe = c.gitDeclaration.resources.find(value => value.id === "browser-executable");
  const browser = { contract: "augnes.local-canonical-browser-use.v2", executable_name: "Fixture",
    location_fingerprint: browserExe.location_fingerprint, before: browserExe.before, after: browserExe.before,
    actual_version: "Chrome/1", runtime_versions: { http: "Chrome/1", cdp: "Chrome/1" }, disposition: "unchanged", unchanged: true };
  const complete = await executeFixture(c, { ...h, behavior: syntheticBehavior(0),
    begin: (subject, proof, auth, extra) => {
      const attempt = h.begin(subject, proof, auth, { ...extra, runId: "synthetic-prospective-complete" });
      assert.throws(() => h.begin(subject, proof, auth, extra)); refusals++;
      assert.equal(tip().reviewed_revision_consumed, 1); return attempt;
    }, decorateReceipt(receipt) { receipt.integration_base.contract = "augnes.local-canonical-integration-base.v2"; },
  }, parsed, capability, browser, dependencyRecords(c));
  assert.equal(complete.stock.valid_deciding_evidence, true);
  assert.equal(complete.receipt.attempt.source_correction.commission.registered_owner, registeredOwner);
  if (registeredOwner === undefined) assert(!Object.hasOwn(complete.receipt.attempt.source_correction.commission, "registered_owner"));
  assert.deepEqual(tip().revision_grants, [11, 32, 62, 82]);
  assert.equal(tip().reviewed_revision_consumed, 1);
  assert(validReviewedRevisionAttempt(complete.receipt.attempt));
  // The old sanitized export drops the original incident and authority bodies.
  // It must reject this basis instead of producing a plausible repair export.
  const originalReceipt = canonicalSerialize(complete.receipt);
  assert.throws(() => createPrivateReviewExport(complete.receipt),
    /review_export_prospective_requalification_requires_original/u); refusals++;
  assert.equal(canonicalSerialize(complete.receipt), originalReceipt);
  const alteredExport = createPrivateReviewExport(failed.receipt);
  assert(inspectPrivateReviewExport(alteredExport).structurally_valid);
  alteredExport.attempt.source_correction.commission.source_revision = PROSPECTIVE_REQUALIFICATION;
  delete alteredExport.export_fingerprint;
  alteredExport.export_fingerprint = digest(canonicalSerialize(alteredExport));
  assert.equal(inspectPrivateReviewExport(alteredExport).structurally_valid, false); refusals++;
  assert.throws(() => h.begin(c, parsed, capability)); refusals++;
  await assert.rejects(() => prepare()); refusals++;
  // Reserved-but-interrupted state does not restore an allowance even when an
  // attempt body is unavailable. The exclusive edge continues to exist.
  const currentFamily = path.join(c.anchor, ".augnes-local-verification/families", complete.receipt.attempt.family_id);
  const completionFile = path.join(currentFamily, "completion-1.json"), completionBytes = readFileSync(completionFile);
  rmSync(completionFile);
  try { assert.throws(() => h.begin(c, parsed, capability)); refusals++; assert(existsSync(edge)); }
  finally { h.write(completionFile, completionBytes); }
  const attemptFile = path.join(currentFamily, "attempt-1.json"), attemptBytes = readFileSync(attemptFile);
  assert.equal(JSON.parse(attemptBytes).source_correction.commission.registered_owner, registeredOwner);
  rmSync(attemptFile);
  try { assert.throws(() => h.begin(c, parsed, capability)); refusals++; assert(existsSync(edge)); }
  finally { h.write(attemptFile, attemptBytes); }
  unchanged();
  assert.equal(gitRevisionInventory(complete.receipt.inputs), p.inputs.inventory_sha256);
  console.log(JSON.stringify({ prospective_requalification: { synthetic_only: true, real_authority: false, registered_owner_executions: 0,
    registered_owner: selected.id, registered_bound_ms: bound,
    non_reserving_preparation: true, one_slot_reservation: true, fresh_process_stock: true,
    original_history_preserved: true, prior_false_stock: failed.stock.valid_deciding_evidence,
    new_synthetic_stock: complete.stock.valid_deciding_evidence, history_cause: "UNKNOWN", refusals,
    grant_ids: tip().revision_grants, issued_limit: 1, consumed: 1, recovery: 0,
    current_git_stock_policy: GIT_CURRENT_STOCK_COMPARISON } }));
}
