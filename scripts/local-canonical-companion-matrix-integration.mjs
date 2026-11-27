import { existsSync } from "node:fs";
import { CANONICAL_ORIGIN_URL, CANONICAL_REPOSITORY_ID } from "./canonical-repository-identity.mjs";
import { validPhaseBrowserUse } from "./local-canonical-browser-identity.mjs";
import { settledIsolatedResources, verifySettledPhaseFailure } from "./local-canonical-browser-revision.mjs";
import { checkoutVerificationFingerprint } from "./local-canonical-checkout-ownership.mjs";
import { digest } from "./local-canonical-inputs.mjs";
import { usesDeclaredIntegrationBase, validAdmittedIntegrationBase } from "./local-canonical-integration-base.mjs";
import { retainedBytes } from "./local-canonical-ordinary-watchdog-integration.mjs";
import { verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";
import { physicalFingerprint } from "./local-canonical-verification-context.mjs";

export const COMPANION_MATRIX_INTEGRATION = "settled-companion-matrix-watchdog-integration-v1";
const registration = "scripts/run-canonical-test-suite.mjs";
const label = 'label="Companion stale-manager stopped recovery and interruption regressions"';
const finalScenario = "crashed-applier-exact-journal-recovery";
const maximumLog = 2 * 1024 * 1024;
const driver = "scripts/run-local-canonical-verification.mjs";
const witness = "scripts/local-canonical-companion-matrix-integration.mjs";
const workload = ["scripts/test-companion-stale-manager-recovery.mjs", "scripts/companion-service-fixture-observation.mjs",
  "scripts/augnes-companion-service.mjs", "scripts/canonical-child-runner.mjs", "scripts/canonical-test-environment.mjs",
  "scripts/test-harness-process-lifecycle.mjs", "plugins/augnes-operator/mcp/companion-service-core.mjs",
  "plugins/augnes-operator/mcp/checkout-identity.mjs", "plugins/augnes-operator/mcp/checkout-identity-darwin.py",
  "plugins/augnes-operator/mcp/node-runtime-policy.mjs", "package.json", "package-lock.json", ".node-version", "tsconfig.json"];
const equal = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);

function requireEvidence(condition, reason) {
  if (!condition) {
    const code = "integration_companion_matrix_" + reason;
    throw Object.assign(new Error(code), {code});
  }
}

function resultDuration(line, failed) {
  const suffix = failed
    ? /^duration_ms=(\d+) exit_code=null signal=SIG(?:TERM|KILL) timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout$/u
    : /^duration_ms=(\d+) exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u;
  const match = suffix.exec(line.slice(("[canonical:unit] child_result " + label + " ").length));
  requireEvidence(match, "child_result");
  return Number(match[1]);
}

function matrixWindow(bytes, failed) {
  requireEvidence(Buffer.isBuffer(bytes) && bytes.length <= maximumLog, "log_size");
  const text = bytes.toString("utf8");
  requireEvidence(Buffer.from(text).equals(bytes), "log_encoding");
  const lines = text.split(/\r?\n/u);
  const start = "[canonical:unit] child_start " + label + " ";
  const end = "[canonical:unit] child_result " + label + " ";
  const starts = lines.filter(line => line.startsWith(start));
  const ends = lines.filter(line => line.startsWith(end));
  const limit = failed ? 180000 : 300000;
  requireEvidence(equal(starts, [start + "timeout_ms=" + limit]) && ends.length === 1, "child_inventory");
  const first = lines.indexOf(starts[0]), last = lines.indexOf(ends[0]);
  requireEvidence(first < last, "child_order");
  // A serial unit invocation stops at the first rejected child. Its outer
  // error summary can follow the result, but no later child can have started.
  requireEvidence(!failed || !lines.slice(last + 1).some(line => line.startsWith("[canonical:unit] child_start ")), "later_child");
  const results = lines.filter(line => line.startsWith("[canonical:unit] child_result ") && !line.startsWith(end));
  requireEvidence(results.every(line => / exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=\S+$/u.test(line)), "other_child_failure");
  const window = lines.slice(first + 1, last);
  const events = [];
  const lifecycle = [];
  for (const line of window) {
    if (!line) continue;
    const runner = /^\[canonical:unit\] (child_spawn|child_active|child_exit|child_cleanup_start|child_cleanup_result) /u.exec(line);
    if (runner && line.startsWith(runner[0] + label + " ")) {
      lifecycle.push({kind:runner[1], line, eventCount:events.length});
    } else {
      requireEvidence(line.startsWith('{"scenario":'), "unexpected_output");
      const event = JSON.parse(line);
      requireEvidence(JSON.stringify(event) === line, "ambiguous_event");
      events.push(event);
    }
  }
  const milestones = lifecycle.filter(row => row.kind !== "child_active");
  const kinds = ["child_spawn", ...(failed ? [] : ["child_exit"]), "child_cleanup_start", "child_cleanup_result"];
  requireEvidence(equal(milestones.map(row => row.kind), kinds) && milestones[0].eventCount === 0 &&
    milestones.slice(1).every(row => row.eventCount === events.length), "settlement_order");
  const cleanup = milestones.at(-2).line, settled = milestones.at(-1).line;
  const reason = failed ? "bounded_timeout" : "post_exit_settlement";
  requireEvidence(cleanup.includes(" reason=" + reason + " exit_observed=" + !failed) &&
    settled.includes(" reason=" + reason + " ") && settled.endsWith(" streams_closed=true remaining_owned_processes=0") &&
    (failed || (milestones[1].line.includes(" exit_code=0 signal=null ") && settled.includes(" term_sent=false kill_sent=false "))), "settlement");
  const duration = resultDuration(ends[0], failed);
  requireEvidence(Number.isSafeInteger(duration) && duration >= 180000 && (failed || (duration > 180000 && duration < 300000)), "duration");
  let previous = 0;
  for (const {kind, line} of lifecycle) {
    if (kind === "child_spawn") continue;
    const match = / elapsed_ms=(\d+) /u.exec(line);
    const elapsed = Number(match?.[1]);
    requireEvidence(Number.isSafeInteger(elapsed) && elapsed >= previous && elapsed <= duration, "runner_clock");
    previous = elapsed;
    if (kind === "child_active") {
      requireEvidence(line.endsWith(" timeout_ms=" + limit + " exit_observed=false stdout_closed=false stderr_closed=false wait=process_exit"), "heartbeat");
    } else if (kind === "child_exit" || kind === "child_cleanup_start") {
      requireEvidence(elapsed >= 180000 && (failed || elapsed < 300000), "observed_cutoff");
    }
  }
  const stages = ["scenario_start", "fixture_ready", "action_pass"];
  requireEvidence(events.length === (failed ? 38 * 4 + 2 : 39 * 4), "scenario_count");
  const names = [];
  for (let offset = 0; offset < events.length; offset += 4) {
    const group = events.slice(offset, offset + 4);
    const name = group[0].scenario;
    requireEvidence(typeof name === "string" && /^[a-z0-9_-]+$/u.test(name) && !names.includes(name), "scenario_id");
    names.push(name);
    for (const [index, row] of group.entries()) {
      requireEvidence(row.scenario === name && Number.isSafeInteger(row.elapsed_ms) && row.elapsed_ms >= 0 &&
        (index === 0 || row.elapsed_ms >= group[index - 1].elapsed_ms), "scenario_order");
      const fields = index < 3 ? ["elapsed_ms","scenario","stage"] : ["cleanup_complete","effects","elapsed_ms","pass","scenario"];
      requireEvidence(equal(Object.keys(row).sort(), fields) && (index < 3 ? row.stage === stages[index] :
        row.pass === true && row.cleanup_complete === true && Number.isSafeInteger(row.effects) && row.effects >= 0), "scenario_result");
    }
  }
  requireEvidence(names.at(-1) === finalScenario, "final_scenario");
  const completions = events.filter(row => row.pass === true);
  if (!failed) {
    const prefixTime = completions.slice(0,-1).reduce((sum,row) => sum + row.elapsed_ms,0);
    requireEvidence(completions.at(-1).effects === 1 && prefixTime + events.at(-2).elapsed_ms > 180000 &&
      prefixTime + completions.at(-1).elapsed_ms <= duration + completions.length, "action_window");
  }
  return {names, duration, effects:completions.map(row => row.effects)};
}

export function verifyCompanionMatrixLogs(failedBytes, acceptedBytes) {
  const failed = matrixWindow(failedBytes, true), accepted = matrixWindow(acceptedBytes, false);
  requireEvidence(equal(failed.names, accepted.names) && equal(failed.effects,accepted.effects.slice(0,-1)), "workload_mismatch");
  return {interrupted_scenario:finalScenario, completed_scenarios:accepted.names.length, accepted_duration_ms:accepted.duration};
}

// Read Git objects, never execute code from the predecessor. The only change
// brought in from main is removal of this one override and its local comment.
function verifyAdoptedSource(git, p, prior, accepted) {
  const i = p.integration;
  const run = (...args) => git(args).toString("utf8").trimEnd();
  const parents = run("show","-s","--format=%P",p.base).split(" ");
  requireEvidence(equal(parents,[i.merge_base, accepted.repository.head_sha]) &&
    run("rev-parse",p.base + "^{tree}") === accepted.repository.tree_sha &&
    accepted.repository.base_sha === i.merge_base &&
    run("diff","--name-only","--no-renames",i.merge_base,p.base,"--") === registration &&
    i.overlaps.length === 0 && i.adjustments.length === 0 &&
    run("diff","--name-only","--no-renames",prior.head,i.commit,"--") === registration, "adoption");
  requireEvidence(run("diff","--name-only",prior.head,p.base,"--",...workload) === "", "workload_changed");
  const support = new Set([".github/LOCAL_CANONICAL_VERIFICATION.md", "scripts/local-canonical-attempts.mjs", driver,
    witness, "scripts/local-canonical-ordinary-watchdog-integration.mjs",
    "scripts/fixtures/local-canonical-companion-matrix-integration.mjs", "scripts/fixtures/local-canonical-reviewed-revision.mjs"]);
  requireEvidence(i.correction_chain.every(commit => commit.paths.every(file => support.has(file))), "source_scope");
  const entryAnchor = '  "scripts/local-canonical-stock-verifier-output.mjs",\n]);';
  const oldDriver = run("show",prior.head + ":" + driver);
  requireEvidence(oldDriver.split(entryAnchor).length === 2 && run("show",p.base + ":" + driver) === oldDriver &&
    run("show",p.head + ":" + driver) === oldDriver.replace(entryAnchor,
      '  "scripts/local-canonical-stock-verifier-output.mjs",\n  "' + witness + '",\n]);'), "executor_scope");
  const before = run("show",prior.head + ":" + registration), after = run("show",p.head + ":" + registration);
  const entry = /(\n        label: "Companion stale-manager stopped recovery and interruption regressions",\n        \.\.\.rootNode\("scripts\/test-companion-stale-manager-recovery\.mjs"\),\n)((?:        \/\/[^\n]*\n)*)(        timeoutMs: 180_000,\n)?(        requireNaturalExit: true,\n      \},\n    \] : \[\]\),)/gu;
  const oldRows = [...before.matchAll(entry)], newRows = [...after.matchAll(entry)];
  requireEvidence(oldRows.length === 1 && newRows.length === 1 && oldRows[0][3] && !newRows[0][3] &&
    before.replace(entry,"$1$4") === after.replace(entry,"$1$4") &&
    after.includes("const timeoutMs = step.timeoutMs ?? DEFAULT_CANONICAL_CHILD_TIMEOUT_MS;") &&
    run("show",p.base + ":scripts/canonical-child-runner.mjs").includes("export const DEFAULT_CANONICAL_CHILD_TIMEOUT_MS = 300_000;"), "registration");
}

function parseAcceptedStock(bytes, receipt) {
  const lines = bytes.toString("utf8").trim().split(/\r?\n/u).filter(Boolean);
  if (lines.length !== 1) {
    const command = "> node scripts/run-local-canonical-verification.mjs validate --checkout-context isolated-worktree --receipt ";
    requireEvidence(lines.length === 3 && /^> augnes@[0-9.]+ verify:local:receipt$/u.test(lines[0]) &&
      lines[1] === command + ".augnes-local-verification/receipts/" + receipt.run.id + ".json", "stock_output");
  }
  return JSON.parse(lines.at(-1));
}

function verifyAcceptedReceipt(receipt, stock, phases) {
  const input = receipt.inputs;
  const browser = input.resources.find(row => row.id === "browser-executable");
  const attempt = receipt.attempt;
  requireEvidence(attempt.contract === "augnes.local-canonical-attempt-family.v1" && attempt.source_correction === null &&
    attempt.recovery === null && attempt.number === 1 && attempt.prior_attempt_id === null && attempt.prior_receipt_fingerprint === null &&
    attempt.family_id === digest([attempt.contract,CANONICAL_REPOSITORY_ID,attempt.branch]) &&
    receipt.outcome.disposition === "completed_success" && receipt.final.result === "pass" && receipt.final.exit_status === 0 &&
    receipt.evidence.deciding === true && receipt.evidence.transferable === true && settledIsolatedResources(receipt) &&
    stock.valid_deciding_evidence === true && stock.status === "valid" && equal(stock.issues,[]) &&
    equal(stock.dimensions,{historical_integrity:"intact", execution:"complete_pass", evidence_validity:"valid_in_recorded_context",
      safety:"preserved_within_observed_scope", current_merge_applicability:"matches_observed_context"}) &&
    stock.content_fingerprint === receipt.integrity.content_fingerprint && equal(receipt.phases.map(v => v.id),phases) &&
    receipt.phases.every((v, index) => v.status === "pass" && v.exit_status === 0 && v.timed_out === false &&
      v.failure_code === null && v.cleanup.completed && v.cleanup.termination_reason === "natural_exit" && v.cleanup.exit_observed &&
      v.cleanup.streams_closed && v.cleanup.remaining_owned_processes === 0 && v.invocation_id === receipt.run.invocation_id &&
      v.environment_fingerprint === input.binding.phase_environment_fingerprints[index].fingerprint &&
      validPhaseBrowserUse(v, v.browser_use ?? [], browser)), "upstream_qualification");
}

export function findCompanionMatrixCheckout(git, receipt) {
  const paths = git(["worktree", "list", "--porcelain", "-z"]).toString().split("\0")
    .filter(row => row.startsWith("worktree ")).map(row => row.slice("worktree ".length));
  const matches = paths.filter(dir => existsSync(dir) &&
    checkoutVerificationFingerprint(dir) === receipt.checkout_ownership.checkout_fingerprint &&
    physicalFingerprint(dir) === receipt.verification_context.checkout_fingerprint);
  requireEvidence(matches.length === 1, "upstream_originals_changed");
  return matches[0];
}

export function readCompanionMatrixPredecessor({root, anchorRoot, p, prior, completion, reader, review, git, phases, preparation, remember, verifyUpstreamOriginals}) {
  const refs = review.companion_matrix_predecessor;
  requireEvidence(equal(Object.keys(refs).sort(),["accepted_receipt","accepted_stock","accepted_unit_log","stock","unit_log"]), "references");
  const physical = (base, relative, max) => retainedBytes(base,relative,max,remember);
  const receipt = JSON.parse(physical(root,p.prior_receipt_path,512*1024));
  const stock = reader(refs.stock,{canonical:false});
  const accepted = reader(refs.accepted_receipt,{canonical:false, maximum:512*1024});
  const acceptedStock = parseAcceptedStock(reader(refs.accepted_stock,{json:false}),accepted);
  for (const item of [receipt, accepted]) {
    const {repository, attempt, verification_context:context} = item;
    requireEvidence(verifyReceiptIntegrity(item) && item.receipt_version === 4 && usesDeclaredIntegrationBase(item) &&
      validAdmittedIntegrationBase(item.integration_base,repository) &&
      item.integration_base.base_matches_current_main === true && item.integration_base.requested_base_sha === repository.base_sha &&
      item.integration_base.tested_head_sha === repository.head_sha && item.integration_base.observation.sha === repository.base_sha &&
      item.environment.operating_system === "macOS" && context.kind === "isolated-worktree" &&
      context.admission === "registered_worktree_of_authorized_mac" && repository.repository_id === CANONICAL_REPOSITORY_ID &&
      repository.origin === CANONICAL_ORIGIN_URL && repository.worktree_before === "clean" && repository.worktree_after === "clean" &&
      item.evidence.planner_plan === "full-canonical" && item.evidence.selected_plan === "full-canonical" &&
      equal(item.evidence.planner_browser_phase_ids, phases.filter(id => id.startsWith("e2e-"))) &&
      item.run.id === attempt.attempt_id && /^[\w-]+$/u.test(item.run.id) && attempt.branch === repository.branch &&
      attempt.head === repository.head_sha && attempt.tree === repository.tree_sha && item.inputs.first_fault === null &&
      item.outcome.first_fault === null && equal(item.inputs.secondary_faults,[]) && attempt.contract_fingerprint === item.inputs.fingerprint &&
      item.inputs.binding.head === attempt.head && item.inputs.binding.tree === attempt.tree, "receipt_identity");
  }
  requireEvidence(equal(receipt.attempt,prior) && stock.content_fingerprint === p.prior_receipt_fingerprint &&
    receipt.integrity.content_fingerprint === p.prior_receipt_fingerprint && receipt.phases[5].id === "unit" &&
    receipt.phases[5].status === "failure" && receipt.phases[5].exit_status === 1 && receipt.repository.base_sha === p.integration.merge_base &&
    receipt.verification_context.anchor_fingerprint === accepted.verification_context.anchor_fingerprint &&
    receipt.verification_context.git_common_fingerprint === accepted.verification_context.git_common_fingerprint &&
    prior.branch !== accepted.attempt.branch && Date.parse(completion.finished_at) < Date.parse(accepted.run.started_at) &&
    Date.parse(accepted.run.finished_at) < Date.parse(review.reviewed_at), "incident_identity");
  requireEvidence(["machine_fingerprint","architecture","operating_system_build","node","npm_version"].every(
    key => equal(receipt.environment[key],accepted.environment[key])), "upstream_environment");
  verifySettledPhaseFailure(receipt, stock, preparation.runtime_inputs, phases, receipt.inputs.resources.find(row => row.id === "browser-executable"),
    false, 1, false, true, true);
  verifyAcceptedReceipt(accepted, acceptedStock, phases);
  verifyAdoptedSource(git, p, prior, accepted);
  const family = accepted.attempt.family_id;
  requireEvidence(/^[a-f0-9]{64}$/u.test(family), "upstream_family");
  const ledger = ".augnes-local-verification/families/" + family + "/";
  const acceptedAttempt = JSON.parse(physical(anchorRoot,ledger + "attempt-1.json",512*1024));
  const acceptedCompletion = JSON.parse(physical(anchorRoot,ledger + "completion-1.json",64*1024));
  requireEvidence(equal(acceptedAttempt,accepted.attempt) && acceptedCompletion.contract === acceptedAttempt.contract &&
    acceptedCompletion.attempt_id === accepted.run.id && acceptedCompletion.receipt_fingerprint === accepted.integrity.content_fingerprint &&
    acceptedCompletion.disposition === "completed_success" && acceptedCompletion.cleanup_complete === true &&
    acceptedCompletion.infrastructure_code === null && Date.parse(acceptedCompletion.finished_at) >= Date.parse(accepted.run.finished_at) &&
    Date.parse(acceptedCompletion.finished_at) < Date.parse(review.reviewed_at), "upstream_ledger");
  const failedLog = reader(refs.unit_log,{json:false,maximum:maximumLog});
  const acceptedLog = reader(refs.accepted_unit_log,{json:false,maximum:maximumLog});
  const logPath = item => ".augnes-local-verification/logs/" + item.run.id + "/unit.log";
  for (const [item, bytes] of [[receipt,failedLog],[accepted,acceptedLog]]) {
    const log = item.phases[5].log;
    requireEvidence(log.truncated === false && log.bytes === bytes.length && log.relative_path === logPath(item), "log_identity");
  }
  requireEvidence(physical(root,logPath(receipt),maximumLog).equals(failedLog), "predecessor_log_changed");
  // Admission authenticates the copied upstream originals against their registered
  // physical checkout. Historical replay uses the reviewed copies and physical
  // completion, so retiring the upstream checkout later does not invalidate it.
  if (verifyUpstreamOriginals) {
    const checkout = findCompanionMatrixCheckout(git, accepted);
    requireEvidence(physical(checkout,logPath(accepted),maximumLog).equals(acceptedLog) &&
      digest(physical(checkout,".augnes-local-verification/receipts/" + accepted.run.id + ".json",512*1024)) === refs.accepted_receipt.sha256,
    "upstream_originals_changed");
  }
  const observation = verifyCompanionMatrixLogs(failedLog, acceptedLog);
  return {receipt, stock, observation};
}
