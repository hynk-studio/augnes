// Synthetic stock context. Only the failing/corrected behavioral child is executed.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { runCanonicalChild } from "../canonical-child-runner.mjs";
import { baseReceipt, validContext } from "./local-canonical-receipt-v3.mjs";
import { digest, observePreparedDependencyInputs } from "../local-canonical-inputs.mjs";
import { browserConsumersForPhase } from "../local-canonical-browser-identity.mjs";
import { BROWSER_SUCCESSOR_SCHEMA, browserReviewTarget, browserBindingMatches } from "../local-canonical-browser-revision.mjs";
import {
  REVIEWED_REVISION_PHASES, finishAttempt, reconstructAttemptTip, reviewedRevisionAuthorityObservation,
  inspectBrowserRevisionPreparation, validReviewedRevisionAttempt
} from "../local-canonical-attempts.mjs";
import { finalizeReceipt, inspectReceiptForDecision } from "../local-canonical-receipt.mjs";
import { createPrivateReviewExport, inspectPrivateReviewExport } from "../local-canonical-review-export.mjs";
import { HISTORICAL_INPUT_CONTRACT } from "../local-canonical-historical-inputs.mjs";
import { buildPhasePlan } from "../run-local-canonical-verification.mjs";

const clone = structuredClone;
const now = () => new Date().toISOString();
const runtimeKeys = ["AUGNES_CANONICAL_NODE_HEADERS", "AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT", "npm_config_nodedir", "AUGNES_BROWSER_EXECUTABLE_PATH"];

export async function behavior(c, syntaxOnly = false) {
  const script = 'import assert from "node:assert/strict"; import {value} from "./scripts/fixture.mjs"; assert.equal(value,4); console.log("corrected behavior");';
  const source = c.behaviorPath ?? "scripts/fixture.mjs";
  const args = c.gitDeclaration ? (syntaxOnly ? ["--check", source] : [source]) : ["--input-type=module", "-e", script];
  let output = "";
  const sink = { write(bytes) { output += bytes; } };
  const result = await runCanonicalChild({
    suite: "browser-successor", label: "source behavior", command: process.execPath,
    args, cwd: c.checkout, env: c.env, timeoutMs: 5000, stdout: sink, stderr: sink
  });
  assert(result.cleanup_completed && result.remaining_owned_processes === 0 && result.termination_reason === "natural_exit");
  return { command: c.gitDeclaration ? ["node", ...args].join(" ") : "node --input-type=module -e " + JSON.stringify(script), result, output, finished_at: now(), tested_source_head: c.head };
}

function declaration(c) {
  const rt = c.inputs;
  const resource = (id, member, flags) => ({
    id, classification: "execution", location_fingerprint: member.location_fingerprint,
    before: member.observation, ...flags
  });
  return {
    contract: "augnes.local-canonical-inputs.v3", path_kind: "isolated-model-free-v1",
    binding: {
      head: c.head, tree: c.tree, executor_fingerprint: baseReceipt.executor.source_fingerprint, runtime_inputs: rt,
      environment_keys: runtimeKeys, phase_environment_fingerprints: REVIEWED_REVISION_PHASES.map(id => ({ id, fingerprint: digest(id) }))
    },
    resources: [...["codex-preferences", "user-instructions", "auth-location", "git-config"].map(id =>
      ({ id, classification: "ambient", location_fingerprint: digest(id), before: { present: false } })),
    resource("node-executable", rt.node, { readOnlyExecutable: true }), resource("node-headers", rt.headers, { nodeHeaders: true }),
    resource("browser-executable", rt.browser.executable, { readOnlyExecutable: true }),
    {
      id: "browser-installation", classification: "execution", protectedInstallation: true,
      location_fingerprint: rt.browser.installation.location_fingerprint, before: rt.browser.installation
    }]
  };
}

export function dependencyRecords(c) {
  const project = path.join(c.root, "fixture-dependencies");
  return [["dependencies-root", ""], ["dependencies-nested", "apps/augnes_apps"], ["dependencies-web-planning", "apps/web_planning"]].map(([id, dir]) => {
    const location = path.join(project, dir);
    mkdirSync(path.join(location, "node_modules/fixture"), { recursive: true });
    for (const name of ["package.json", "package-lock.json", "node_modules/fixture/package.json"])
      writeFileSync(path.join(location, name), '{"name":"fixture"}\n');
    const before = observePreparedDependencyInputs({ repositoryRoot: project, phaseId: id });
    const after = observePreparedDependencyInputs({ repositoryRoot: project, phaseId: id });
    return { phase_id: id, before, after, unchanged: true, error: null };
  });
}

export async function executeFixture(c, h, proof, cap, browserRecord, dependencies) {
  const input = c.gitDeclaration ? { ...c.gitDeclaration, binding: {
    head: c.head, tree: c.tree, executor_fingerprint: baseReceipt.executor.source_fingerprint, runtime_inputs: c.inputs,
    environment_keys: runtimeKeys, phase_environment_fingerprints: REVIEWED_REVISION_PHASES.map(id => ({id, fingerprint:digest(id)}))
  } } : declaration(c);
  const start = now();
  const attempt = h.begin(c, proof, cap, { contractFingerprint: digest(input) });
  const child = await behavior(c), passed = child.result.exit_code === 0, finish = now();
  const r = clone(baseReceipt);
  Object.assign(r.repository, { head_sha: c.head, tree_sha: c.tree, base_sha: c.base, branch: c.branch });
  Object.assign(r.integration_base, { requested_base_sha: c.base, tested_head_sha: c.head, checked_at: start });
  Object.assign(r.integration_base.observation, { sha: c.base, observed_at: start });
  Object.assign(r.evidence, {
    mode: "full", selected_plan: "full-canonical", planner_plan: "full-canonical", deciding: passed, transferable: passed,
    planner_reason: "one_or_more_changes_require_full_canonical", planner_changed_paths: ["scripts/fixture.mjs"],
    planner_owner_ids: ["local-canonical-integrity"], planner_full_reasons: ["fixture_source_change"],
    planner_browser_phase_ids: REVIEWED_REVISION_PHASES.filter(id => id.startsWith("e2e-"))
  });
  Object.assign(r.dependencies, { policy: "clean_npm_ci_root_and_nested", download_cache: "invocation_private_cache_not_authoritative",
    installed_trees: "replaced_from_lockfiles_by_npm_ci" });
  Object.assign(r.verification_context, {
    kind: "isolated-worktree", admission: "registered_worktree_of_authorized_mac",
    checkout_fingerprint: digest("fixture checkout")
  });
  r.receipt_version = 4;
  r.run = {
    id: attempt.attempt_id, invocation_id: digest(attempt.attempt_id).slice(0, 32), started_at: start, finished_at: finish,
    duration_ms: Date.parse(finish) - Date.parse(start)
  };
  r.attempt = attempt;
  const ownership = {
    required: true, acquired: true, released: true, checkout_fingerprint: r.verification_context.checkout_fingerprint,
    ownership_id: digest("owner").slice(0, 32), acquired_at: start, released_at: finish, failure_code: null
  };
  r.checkout_ownership = ownership;
  r.capacity_ownership = { ...ownership, contract: "augnes.local-canonical-capacity.v1", limit: 2, slot: 1, invocation_id: r.run.invocation_id };
  r.cleanup.failure_codes = [];
  r.cleanup.isolated_resources = {
    required: true, prepared: true, completed: true, failure_count: 0, failures: [],
    invocation_id: r.run.invocation_id, policy: "private_outer_home_temp_cache_database_runtime", fingerprint: digest("fixture resources")
  };
  r.historical_inputs = {
    ...r.cleanup.isolated_resources, contract: HISTORICAL_INPUT_CONTRACT, anchor_fingerprint: r.verification_context.anchor_fingerprint,
    source_fingerprint: digest("fixture source"), content_fingerprint: digest("fixture contents"), unchanged: true, file_count: 1, byte_count: 1
  };
  const live = c.gitDeclaration ? c.live.service : c.live;
  const service = live.state, obs = { ...live.diagnostics, started_at: start, finished_at: finish };
  r.cleanup.companion_service = {
    scope: "accepted_checkout_read_only", before: service, after: service,
    maintenance_acquired: false, maintenance_released: true, restored: true, observations: { before: obs, after: obs }
  };
  r.inputs = { ...input, fingerprint: digest(input), checks: 1, events: [], first_fault: null, secondary_faults: [], prepared_dependencies: dependencies };
  for (const [i, key] of ["root_lock_sha256", "nested_lock_sha256", "web_planning_lock_sha256"].entries())
    r.dependencies[key] = dependencies[i].before.sources.find(s => s.name === "package-lock.json").sha256;
  const failure = passed ? Infinity : REVIEWED_REVISION_PHASES.indexOf("authority");
  const plan = buildPhasePlan({ mode: "full", selectedPlan: "full-canonical", baseSha: c.base, headSha: c.head });
  assert.deepEqual(plan.map(phase => phase.id), REVIEWED_REVISION_PHASES);
  r.phases = plan.map((phase, i) => {
    const id = phase.id;
    const status = i < failure ? "pass" : i === failure ? "failure" : "not_run";
    return {
      ...baseReceipt.phases[0], id, label: phase.label, command: phase.display, cwd_scope: phase.cwdScope, exclusive: phase.exclusive,
      status, browser: phase.browser, base_sha: c.base, head_sha: c.head,
      started_at: i > failure ? null : start, finished_at: i > failure ? null : finish, duration_ms: i === failure ? child.result.duration_ms : 0,
      exit_status: i > failure ? null : i === failure ? child.result.exit_code : 0,
      failure_code: i > failure ? "phase_not_run" : i === failure ? "phase_failed" : null,
      invocation_id: r.run.invocation_id, environment_fingerprint: i > failure ? null : digest(id),
      cleanup: i > failure ? null : {
        completed: child.result.cleanup_completed, exit_observed: child.result.exit_observed,
        streams_closed: child.result.streams_closed, termination_reason: child.result.termination_reason,
        remaining_owned_processes: child.result.remaining_owned_processes, listener_residue_count: 0
      },
      browser_use: i > failure ? [] : Object.entries(browserConsumersForPhase(id)).flatMap(([consumer, count]) =>
        Array.from({ length: count }, () => ({ ...browserRecord, consumer })))
    };
  });
  r.outcome = {
    disposition: passed ? "completed_success" : "product_failure", first_fault: null, safety: "preserved_within_observed_scope",
    validity: "valid_within_observed_scope", execution: passed ? "complete_pass" : "incomplete_or_failed"
  };
  r.final = {
    ...r.final, result: passed ? "pass" : "failure", exit_status: child.result.exit_code,
    reason_codes: passed ? [] : ["phase_failed", "selected_phases_incomplete"]
  };
  const receipt = finalizeReceipt(r);
  h.storeReceipt(c, receipt);
  finishAttempt(attempt, { receiptFingerprint: receipt.integrity.content_fingerprint, disposition: r.outcome.disposition, cleanupComplete: true });
  const stockTime = now();
  const stockContext = {
    ...validContext, currentVerificationContext: r.verification_context, expectedRunId: r.run.id,
    currentIntegrationBase: { ...r.integration_base, checked_at: stockTime, observation: { ...r.integration_base.observation, observed_at: stockTime } },
    currentIdentity: { ...validContext.currentIdentity, head_sha: c.git(["rev-parse", "HEAD"]).toString().trim(), branch: c.branch },
    currentCheckoutFingerprint: ownership.checkout_fingerprint, expectedPhaseIds: REVIEWED_REVISION_PHASES, expectedSelectedPlan: "full-canonical",
    expectedOwnerIds: r.evidence.planner_owner_ids,
    currentLocks: Object.fromEntries(["root", "nested", "webPlanning"].map((name, i) => [name, dependencies[i].before.sources[1].sha256]))
  };
  const stockOutput = path.join(c.artifacts, "fresh-stock.json"), packet = path.join(c.artifacts, "cold-packet.json");
  h.write(packet, {
    anchor: c.anchor, checkout: c.checkout, file: c.file, inputs: c.inputs, authority: c.authority, live: c.live,
    stockContext, stockOutput, expectedPass: passed
  });
  await h.fresh(packet);
  return { receipt, stock: h.read(stockOutput), child };
}

export async function checkBrowserSourceSuccessor(c, h, firstProof, firstAuthority, browserRecord) {
  const preparation = candidate => {
    const material = clone(candidate);
    delete material.authorization;
    const file = path.join(c.artifacts, "preparation.json");
    h.write(file, material);
    return inspectBrowserRevisionPreparation({
      file, repositoryRoot: c.checkout, predecessorRoot: c.checkout,
      anchorRoot: c.anchor, runtimeInputs: c.inputs, live: c.live
    });
  };
  const tip = () => reconstructAttemptTip({ anchorRoot: c.anchor, repositoryRoot: c.checkout, branch: c.branch });
  const packages = dependencyRecords(c);
  const firstFile = c.file;
  const first = await executeFixture(c, h, firstProof, firstAuthority, browserRecord, packages);
  assert.equal(first.child.result.exit_code, 1);
  assert.match(first.child.output, /3 !== 4/);
  assert.equal(first.stock.dimensions.historical_integrity, "intact");
  assert.equal(first.stock.dimensions.safety, "preserved_within_observed_scope");
  assert.equal(first.stock.valid_deciding_evidence, false);
  assert.equal(tip().reviewed_revision_consumed, 1);
  const rootStock = path.join(c.artifacts, firstProof.originals.stock.artifact);
  const rootReceipt = path.join(c.checkout, ".augnes-local-verification/receipts", c.prior.run.id + ".json");
  const rootCompletion = path.join(c.legacyRoot, "completion-1.json");
  const historic = [rootReceipt, rootCompletion, rootStock].map(file => [file, readFileSync(file)]);
  c.prior = first.receipt;
  c.grantId = 12;
  c.commit(4);
  h.prepare(c, 2);
  const p = c.proof;
  p.schema = BROWSER_SUCCESSOR_SCHEMA;
  p.commission.initial_authorization = firstProof.authorization;
  p.inputs.predecessor_sha256 = firstProof.inputs.identity_sha256;
  p.originals.stock = h.artifact(c, "prior-stock.log", JSON.stringify(first.stock));
  const source = h.read(path.join(c.artifacts, p.source.artifact));
  source.reviewed_at = now();
  p.source = h.artifact(c, "source.json", source);
  const corrected = await behavior(c);
  assert.equal(corrected.result.exit_code, 0);
  const focused = h.read(path.join(c.artifacts, p.focused.artifact));
  Object.assign(focused, {
    finished_at: corrected.finished_at, input_remedy_resources: [], failed_phase: "authority",
    diagnosis: "The fixture source returned three instead of the required value four.", commands: [{
      command: corrected.command, tested_source_head: c.head, result: corrected.result,
      record: h.artifact(c, "command-result.json", corrected), stdout: h.artifact(c, "command-stdout.log", corrected.output)
    }]
  });
  p.focused = h.artifact(c, "focused.json", focused);
  const target = browserReviewTarget(p), prepared = preparation(p);
  assert.equal(prepared.target, target);
  assert.equal(prepared.predecessor, first.receipt.integrity.content_fingerprint);
  assert.equal(prepared.runtime_inputs, firstProof.inputs.identity_sha256);
  assert.equal(prepared.root_receipt, firstProof.prior_receipt_fingerprint);
  assert.equal(prepared.consumed, 1);
  assert.equal(prepared.ordinal, 2);
  assert(!prepared.authorized && !prepared.reserved);
  assert.equal(tip().reviewed_revision_consumed, 1);

  for (const [name, mutate] of [
    ["unchanged candidate", q => Object.assign(q, { head: firstProof.head, tree: firstProof.tree })],
    ["forked root", q => { q.commission.root_family_id = digest("other root"); }],
    ["forked branch", q => { q.branch += "-fork"; }],
    ["prior authorization replaced", q => { q.commission.initial_authorization.grant_sha256 = digest("another grant"); }],
    ["ordinal reset", q => { q.commission.ordinal = 1; }],
    ["stale predecessor", q => { q.prior_receipt_fingerprint = firstProof.prior_receipt_fingerprint; }],
    ["third ordinal", q => { q.commission.ordinal = 3; }],
  ]) {
    const q = clone(p); mutate(q);
    assert.throws(() => preparation(q), undefined, name);
  }
  // A different commit with the same tree and freshly formatted evidence is still unchanged.
  const empty = clone(p);
  empty.head = c.git(["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit-tree",
    firstProof.tree, "-p", firstProof.head, "-m", "unchanged fixture"]).toString().trim();
  empty.tree = firstProof.tree;
  const delta = from => {
    const diff = c.git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", from, empty.head, "--"]);
    return { bytes: diff.length, sha256: digest(diff), paths: c.git(["diff", "--name-only", from, empty.head]).toString().trim().split("\n").filter(Boolean).sort() };
  };
  empty.source = h.artifact(c, "unchanged-source.json", {
    ...source, accepted_to_final: delta(p.accepted.head),
    main_to_final: delta(p.base), predecessor_to_final: delta(firstProof.head)
  });
  assert.throws(() => preparation(empty), /revision_material_remedy_required/);
  const withChangedBytes = (file, operation) => {
    const original = readFileSync(file);
    h.write(file, Buffer.concat([original, Buffer.from("\n")]));
    try { operation(); } finally { h.write(file, original); }
  };
  const firstLedger = path.join(c.anchor, ".augnes-local-verification/families", first.receipt.attempt.family_id);
  for (const file of [rootReceipt, rootCompletion, rootStock, path.join(firstLedger, "attempt-1.json"), path.join(firstLedger, "completion-1.json"),
    path.join(c.checkout, ".augnes-local-verification/receipts", first.receipt.run.id + ".json"), path.join(c.artifacts, p.originals.stock.artifact)])
    withChangedBytes(file, () => assert.throws(() => preparation(p)));
  const savedProof = readFileSync(firstFile);
  try {
    h.write(firstFile, { ...firstProof, head: c.head });
    assert.throws(() => preparation(p));
  } finally { h.write(firstFile, savedProof); }
  const staleFocus = clone(focused);
  staleFocus.commands[0].tested_source_head = firstProof.head;
  assert.throws(() => preparation({ ...p, focused: h.artifact(c, "stale-focused.json", staleFocus) }), /revision_focused_remedy_invalid/);
  const previous = h.read(path.join(c.artifacts, p.originals.receipt.artifact));
  for (const mutate of [r => { r.cleanup.isolated_resources.failure_count++; },
  r => { r.phases.find(x => x.status === "failure").cleanup.remaining_owned_processes++; },
  r => { r.phases[0].environment_fingerprint = digest("unrelated phase binding"); },
  r => { r.cleanup.companion_service.observations.after.coherent = false; }]) {
    const r = clone(previous); mutate(r);
    const q = clone(p); q.originals.receipt = h.artifact(c, "adverse-receipt.json", finalizeReceipt(r));
    assert.throws(() => preparation(q), /revision_browser_failure_invalid/);
  }
  const changed = clone(c.inputs);
  changed.browser.installation.content_sha256 = digest("other framework bytes");
  const q = clone(p);
  q.inputs.current = h.artifact(c, "other-inputs.json", changed);
  q.inputs.identity_sha256 = digest(changed);
  assert.throws(() => preparation(q), /revision_browser_failure_invalid/);
  assert(!browserBindingMatches(first.receipt.inputs, changed.browser));

  // Independent commit review and subsequent linked grant are fixture records only.
  await delay(5);
  const originalReview = firstProof.authorization.contract_review;
  const review = {
    ...c.authority.review, id: 22, commit_id: c.head, submitted_at: now(),
    body: "ACCEPT / RETAIN browser execution-input " + [p.base, p.head, p.tree, target].join(" ")
  };
  c.authority.contractReview = review;
  c.authority.contractPr = p.pull_request;
  p.authorization.contract_review = {
    pull_request: p.pull_request, id: review.id, head: p.head,
    sha256: digest(reviewedRevisionAuthorityObservation(review, "contract_review"))
  };
  assert.notEqual(originalReview.id, review.id);
  await delay(5);
  const grant = c.authority.grant;
  grant.created_at = grant.updated_at = now();
  const prUrl = "https://github.com/hynk-studio/augnes/pull/" + p.pull_request;
  const initialUrl = prUrl + "#issuecomment-" + firstProof.authorization.grant_comment_id;
  grant.body += " Second and final deciding invocation of " + initialUrl + " " + [p.schema, p.head, p.tree, p.base, target,
  p.prior_receipt_fingerprint, p.commission.root_receipt_fingerprint, prUrl + "#pullrequestreview-" + review.id].join(" ");
  p.authorization.grant_sha256 = digest(reviewedRevisionAuthorityObservation(grant, "execution_commission"));
  for (const [remove, replace] of [[initialUrl, initialUrl + "0"], [p.prior_receipt_fingerprint, "unbound"],
  [p.commission.root_receipt_fingerprint, "other root"], [target, "unbound"]]) {
    const altered = { ...grant, body: grant.body.replace(remove, replace) }, bad = clone(p);
    bad.authorization.grant_sha256 = digest(reviewedRevisionAuthorityObservation(altered, "execution_commission"));
    h.write(c.file, bad);
    await assert.rejects(h.auth(c, h.proof(c), (v, endpoint) => endpoint.includes("/comments/") ? altered : v),
      { code: "revision_authority_scope_invalid" });
  }
  h.write(c.file, { ...p, authorization: firstProof.authorization });
  assert.throws(() => h.proof(c), /revision_proof_invalid/);
  h.write(c.file, p);
  const proof = h.proof(c), cap = await h.auth(c, proof);
  const staleReview = { ...review, submitted_at: firstAuthority.observations.contract_review.timestamp };
  const stale = clone(p);
  stale.authorization.contract_review.sha256 = digest(reviewedRevisionAuthorityObservation(staleReview, "contract_review"));
  h.write(c.file, stale);
  const staleProof = h.proof(c), staleCap = await h.auth(c, staleProof, (v, endpoint) => endpoint.endsWith("/reviews/" + review.id) ? staleReview : v);
  assert.throws(() => h.begin(c, staleProof, staleCap), /revision_authenticated_authority_required/);
  h.write(c.file, JSON.stringify(p, null, 2));
  assert.deepEqual(h.proof(c), proof);
  assert.throws(() => h.begin(c, proof, cap, { revisionInputs: changed }), /revision_authenticated_authority_required/);
  assert.throws(() => h.begin(c, proof, cap, { revisionLive: null }), /revision_current_preservation_unsafe/);
  assert.equal(tip().reviewed_revision_consumed, 1);
  const second = await executeFixture(c, h, proof, cap, browserRecord, packages);
  assert.equal(second.child.result.exit_code, 0);
  assert.equal(second.stock.valid_deciding_evidence, true);
  assert.deepEqual(second.stock.issues, []);
  const finalTip = tip();
  assert.equal(finalTip.reviewed_revision_consumed, 2);
  assert.deepEqual(finalTip.revision_grants, [firstProof.authorization.grant_comment_id, grant.id]);
  assert.equal(second.receipt.attempt.source_correction.commission.root_receipt_fingerprint, firstProof.prior_receipt_fingerprint);
  assert.throws(() => preparation(p), /revision_preparation_target_changed/);
  assert.throws(() => h.begin(c, proof, cap), /attempt_latest_tip_required/);
  assert.throws(() => h.begin(c, firstProof, firstAuthority), /attempt_latest_tip_required/);
  for (const [file, bytes] of historic) assert.deepEqual(readFileSync(file), bytes);
  withChangedBytes(rootCompletion, () => { assert.throws(tip, /revision_original_ledger_changed/); assert(!h.stock(c, second.receipt, cap)); });
  withChangedBytes(path.join(c.artifacts, p.originals.stock.artifact), () => assert(!h.stock(c, second.receipt, cap)));
  const exported = createPrivateReviewExport(second.receipt);
  assert(validReviewedRevisionAttempt(exported.attempt));
  assert(inspectPrivateReviewExport(exported).structurally_valid);
  exported.phases.find(x => x.browser_use.length).browser_use[0].location_fingerprint = digest("wrong consumer");
  delete exported.export_fingerprint; exported.export_fingerprint = digest(exported);
  assert(!inspectPrivateReviewExport(exported).structurally_valid);
  const altered = clone(second.receipt);
  altered.inputs.resources.find(r => r.protectedInstallation).before = changed.browser.installation;
  assert(inspectReceiptForDecision(finalizeReceipt(altered)).issues.includes("receipt_browser_installation_invalid"));
  assert.throws(() => createPrivateReviewExport(finalizeReceipt(altered)), /browser_installation_invalid/);
  // A new grant, root and family cannot open a third slot via the generic route.
  c.prior = second.receipt; c.grantId = 13; c.commit(5); h.prepare(c);
  assert.throws(() => h.proof(c), /revision_browser_lineage_invalid/);
  assert.deepEqual(tip(), finalTip);
  console.log(JSON.stringify({
    synthetic_browser_successor: true, first: { exit: first.child.result.exit_code, stock: first.stock },
    second: { exit: second.child.result.exit_code, stock: second.stock }, consumed: finalTip.reviewed_revision_consumed,
    distinct_grants: finalTip.revision_grants.length, real_browser_launches: 0
  }));
}
